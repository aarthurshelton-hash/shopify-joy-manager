"""
En Pensent — Neural Network Stacking Ensemble (v10.0)
============================================================================

Trains a neural network that combines:
  1. EP color-flow signals (prediction, confidence, archetype)
  2. Stockfish eval and prediction
  3. Maia-2 expected score (via fusion agreement proxy)
  4. Position metadata (move number, elo, time control, data source)

The network learns the optimal combination of these signals to predict
the 3-way outcome (white wins / black wins / draw).

Architecture:
  - Input: ~60 features (one-hot archetype, SF eval, EP conf, etc.)
  - Hidden: 3 layers (128, 64, 32) with dropout and batch norm
  - Output: 3-way softmax (white_wins, black_wins, draw)

This is a stacking ensemble — it learns when to trust EP vs SF vs Maia
based on the position characteristics.

============================================================================
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

# sklearn for preprocessing and evaluation
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, brier_score_loss, log_loss
from sklearn.calibration import calibration_curve
from sklearn.linear_model import LogisticRegression

# PyTorch for the neural network
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data"
TRAIN_FILE = sorted(DATA_DIR.glob("training_set_*.csv"))[-1]
HOLDOUT_FILE = sorted(DATA_DIR.glob("holdout_set_*.csv"))[-1]

EPOCHS = 50
BATCH_SIZE = 256
LR = 0.001
DROPOUT = 0.3
SEED = 42
DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
PRED_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2, "1-0": 0, "0-1": 1, "1/2-1/2": 2}

# ─────────────────────────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────

def normalize_pred(p):
    if pd.isna(p): return -1
    p = str(p).strip().lower()
    return PRED_MAP.get(p, -1)

def normalize_result(r):
    if pd.isna(r): return -1
    r = str(r).strip().lower()
    return RESULT_MAP.get(r, PRED_MAP.get(r, -1))

def build_features(df, archetype_encoder=None, source_encoder=None, fit_encoders=False):
    """Build feature matrix from raw dataframe."""
    df = df.copy()

    # Normalize predictions to numeric
    df['ep_pred'] = df['hybrid_prediction'].apply(normalize_pred)
    df['sf_pred'] = df['stockfish_prediction'].apply(normalize_pred)
    df['fusion_pred'] = df['fusion_prediction'].apply(normalize_pred)
    df['result'] = df['actual_result'].apply(normalize_result)

    # ── Numeric features ──
    features = {}

    # SF eval (clipped and scaled)
    sf_eval = df['stockfish_eval'].fillna(0).clip(-1000, 1000) / 1000.0
    features['sf_eval'] = sf_eval.values
    features['sf_eval_abs'] = np.abs(sf_eval.values)
    features['sf_eval_sq'] = sf_eval.values ** 2

    # SF confidence (scaled 0-1)
    features['sf_conf'] = (df['stockfish_confidence'].fillna(50) / 100.0).values

    # EP confidence (scaled 0-1)
    features['ep_conf'] = (df['hybrid_confidence'].fillna(50) / 100.0).values
    features['ep_conf_sq'] = features['ep_conf'] ** 2

    # Fusion calibrated confidence
    features['fusion_conf'] = df['fusion_calibrated_confidence'].fillna(0.5).values

    # Move number (scaled)
    features['move_num'] = (df['move_number'].fillna(25) / 80.0).values
    features['move_num_sq'] = features['move_num'] ** 2

    # Elo
    avg_elo = ((df['white_elo'].fillna(1500) + df['black_elo'].fillna(1500)) / 2).values
    features['avg_elo'] = (avg_elo - 1500) / 500.0
    elo_diff = (df['white_elo'].fillna(1500) - df['black_elo'].fillna(1500)).values
    features['elo_diff'] = elo_diff / 500.0

    # Time control
    tc = df['time_control'].fillna('180').astype(str)
    tc_base = tc.str.extract(r'(\d+)')[0].fillna(180).astype(int).clip(0, 600)
    features['tc_base'] = (tc_base / 600.0).values

    # ── One-hot: EP prediction ──
    for cls in [0, 1, 2]:
        features[f'ep_pred_{cls}'] = (df['ep_pred'] == cls).astype(float).values

    # ── One-hot: SF prediction ──
    for cls in [0, 1, 2]:
        features[f'sf_pred_{cls}'] = (df['sf_pred'] == cls).astype(float).values

    # ── One-hot: Fusion prediction ──
    for cls in [0, 1, 2]:
        features[f'fusion_pred_{cls}'] = (df['fusion_pred'] == cls).astype(float).values

    # ── Agreement signals ──
    ep_sf_agree = (df['ep_pred'] == df['sf_pred']).astype(float).values
    ep_fusion_agree = (df['ep_pred'] == df['fusion_pred']).astype(float).values
    sf_fusion_agree = (df['sf_pred'] == df['fusion_pred']).astype(float).values
    features['ep_sf_agree'] = ep_sf_agree
    features['ep_fusion_agree'] = ep_fusion_agree
    features['sf_fusion_agree'] = sf_fusion_agree

    # ── One-hot: Fusion agreement level ──
    agreement = df['fusion_agreement'].fillna('unknown').astype(str)
    for level in ['full', 'ep_sf', 'ep_maia', 'maia_sf', 'disagreement']:
        features[f'agree_{level}'] = (agreement == level).astype(float).values

    # ── One-hot: Archetype ──
    archetype = df['hybrid_archetype'].fillna('unknown').astype(str)
    if fit_encoders:
        archetype_encoder = LabelEncoder()
        archetype_encoded = archetype_encoder.fit_transform(archetype)
        archetype_classes = set(archetype_encoder.classes_)
    else:
        # Handle unseen labels by mapping them to 'unknown' index
        archetype_classes = set(archetype_encoder.classes_)
        archetype_encoded = np.array([
            archetype_encoder.transform([a])[0] if a in archetype_classes
            else archetype_encoder.transform(['unknown'])[0] if 'unknown' in archetype_classes
            else 0
            for a in archetype
        ])

    n_archetypes = len(archetype_encoder.classes_) if archetype_encoder is not None else archetype.nunique()
    arch_onehot = np.zeros((len(df), n_archetypes))
    for i, a in enumerate(archetype_encoded):
        if a < n_archetypes:
            arch_onehot[i, a] = 1.0
    for i in range(n_archetypes):
        features[f'arch_{i}'] = arch_onehot[:, i]

    # ── One-hot: Data source ──
    source = df['data_source'].fillna('unknown').astype(str)
    if fit_encoders:
        source_encoder = LabelEncoder()
        source_encoded = source_encoder.fit_transform(source)
        source_classes = set(source_encoder.classes_)
    else:
        source_classes = set(source_encoder.classes_)
        source_encoded = np.array([
            source_encoder.transform([s])[0] if s in source_classes
            else source_encoder.transform(['unknown'])[0] if 'unknown' in source_classes
            else 0
            for s in source
        ])

    n_sources = len(source_encoder.classes_) if source_encoder is not None else source.nunique()
    src_onehot = np.zeros((len(df), n_sources))
    for i, s in enumerate(source_encoded):
        if s < n_sources:
            src_onehot[i, s] = 1.0
    for i in range(n_sources):
        features[f'src_{i}'] = src_onehot[:, i]

    # ── Interaction features ──
    # EP confidence × SF eval agreement (high confidence + agreement = strong signal)
    features['ep_conf_x_agree'] = features['ep_conf'] * features['ep_sf_agree']
    features['sf_eval_x_move'] = features['sf_eval'] * features['move_num']
    features['ep_conf_x_move'] = features['ep_conf'] * features['move_num']
    # Zone indicators
    features['zone_balanced'] = (features['sf_eval_abs'] < 0.025).astype(float)  # |eval| < 25cp
    features['zone_mild'] = ((features['sf_eval_abs'] >= 0.025) & (features['sf_eval_abs'] < 0.05)).astype(float)
    features['zone_mod'] = ((features['sf_eval_abs'] >= 0.05) & (features['sf_eval_abs'] < 0.1)).astype(float)
    features['zone_decisive'] = (features['sf_eval_abs'] >= 0.2).astype(float)
    # EP confidence in balanced zone (where EP has edge)
    features['ep_conf_in_balanced'] = features['ep_conf'] * features['zone_balanced']
    features['ep_conf_in_mild'] = features['ep_conf'] * features['zone_mild']

    # Assemble feature matrix
    feature_names = sorted(features.keys())
    X = np.column_stack([features[name] for name in feature_names])

    y = df['result'].values
    return X, y, feature_names, archetype_encoder, source_encoder


# ─────────────────────────────────────────────────────────────
# NEURAL NETWORK MODEL
# ─────────────────────────────────────────────────────────────

class ChessPredictor(nn.Module):
    def __init__(self, input_dim, hidden_dims=(256, 128, 64, 32), dropout=0.3, n_classes=3):
        super().__init__()
        layers = []
        prev = input_dim
        for h in hidden_dims:
            layers.append(nn.Linear(prev, h))
            layers.append(nn.BatchNorm1d(h))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev = h
        layers.append(nn.Linear(prev, n_classes))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


# ─────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────

def train_model(X_train, y_train, X_val, y_val, feature_names):
    """Train the neural network with early stopping."""
    print(f"\n{'='*60}")
    print(f"Training Neural Network")
    print(f"{'='*60}")
    print(f"  Input features: {X_train.shape[1]}")
    print(f"  Training samples: {X_train.shape[0]}")
    print(f"  Validation samples: {X_val.shape[0]}")
    print(f"  Device: {DEVICE}")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Learning rate: {LR}")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # Convert to tensors
    X_train_t = torch.FloatTensor(X_train_scaled).to(DEVICE)
    y_train_t = torch.LongTensor(y_train).to(DEVICE)
    X_val_t = torch.FloatTensor(X_val_scaled).to(DEVICE)
    y_val_t = torch.LongTensor(y_val).to(DEVICE)

    train_ds = TensorDataset(X_train_t, y_train_t)
    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)

    # Initialize model
    model = ChessPredictor(X_train.shape[1], dropout=DROPOUT).to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    criterion = nn.CrossEntropyLoss()

    # Class weights (draws are underrepresented, but don't over-weight)
    # v10.1: Reduced draw weight from 6.3x to 2.5x — was trading too much W/B accuracy
    class_counts = np.bincount(y_train, minlength=3)
    raw_weights = len(y_train) / (3 * class_counts)
    # Cap draw weight at 2.5x (was ~6.3x with full balancing)
    raw_weights[2] = min(raw_weights[2], 2.5)
    class_weights = torch.FloatTensor(raw_weights).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    print(f"  Class weights: {class_weights.cpu().numpy()}")

    # Training loop
    best_val_acc = 0
    best_state = None
    patience = 10
    patience_counter = 0

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        for xb, yb in train_dl:
            optimizer.zero_grad()
            out = model(xb)
            loss = criterion(out, yb)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(xb)
        train_loss /= len(y_train)

        # Validation
        model.eval()
        with torch.no_grad():
            val_out = model(X_val_t)
            val_loss = criterion(val_out, y_val_t).item()
            val_pred = val_out.argmax(dim=1).cpu().numpy()
            val_acc = (val_pred == y_val).mean()
            val_probs = F.softmax(val_out, dim=1).cpu().numpy()

        scheduler.step(val_loss)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = model.state_dict().copy()
            patience_counter = 0
        else:
            patience_counter += 1

        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1:3d}: train_loss={train_loss:.4f} val_loss={val_loss:.4f} val_acc={val_acc:.4f} best={best_val_acc:.4f}")

        if patience_counter >= patience:
            print(f"  Early stopping at epoch {epoch+1} (patience={patience})")
            break

    # Restore best model
    model.load_state_dict(best_state)

    # Final validation predictions
    model.eval()
    with torch.no_grad():
        val_out = model(X_val_t)
        val_probs = F.softmax(val_out, dim=1).cpu().numpy()
        val_pred = val_out.argmax(dim=1).cpu().numpy()

    return model, scaler, val_pred, val_probs


# ─────────────────────────────────────────────────────────────
# BASELINE MODELS
# ─────────────────────────────────────────────────────────────

def train_logistic_baseline(X_train, y_train, X_val, y_val):
    """Simple logistic regression baseline."""
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)

    clf = LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced')
    clf.fit(X_train_s, y_train)
    pred = clf.predict(X_val_s)
    probs = clf.predict_proba(X_val_s)
    return pred, probs, clf, scaler


# ─────────────────────────────────────────────────────────────
# EVALUATION
# ─────────────────────────────────────────────────────────────

def evaluate(y_true, y_pred, y_probs, name="Model"):
    """Compute accuracy, Brier score, log loss, ECE."""
    acc = accuracy_score(y_true, y_pred)

    # Brier score (multiclass)
    y_onehot = np.zeros((len(y_true), 3))
    for i, y in enumerate(y_true):
        y_onehot[i, y] = 1.0
    brier = np.mean(np.sum((y_probs - y_onehot) ** 2, axis=1))

    # Log loss
    ll = log_loss(y_true, y_probs, labels=[0, 1, 2])

    # ECE (Expected Calibration Error)
    confidences = y_probs.max(axis=1)
    predictions = y_probs.argmax(axis=1)
    n_bins = 10
    bin_boundaries = np.linspace(1/3, 1.0, n_bins + 1)  # min confidence for 3-class is 1/3
    ece = 0
    for i in range(n_bins):
        lo, hi = bin_boundaries[i], bin_boundaries[i+1]
        mask = (confidences >= lo) & (confidences < hi if i < n_bins-1 else confidences <= hi)
        if mask.sum() > 0:
            bin_acc = (predictions[mask] == y_true[mask]).mean()
            bin_conf = confidences[mask].mean()
            ece += abs(bin_acc - bin_conf) * mask.sum() / len(y_true)

    # Per-class accuracy
    classes = ['white_wins', 'black_wins', 'draw']
    per_class = {}
    for i, cls in enumerate(classes):
        mask = y_true == i
        if mask.sum() > 0:
            per_class[cls] = {
                'n': int(mask.sum()),
                'accuracy': float((y_pred[mask] == i).mean()),
            }

    return {
        'name': name,
        'accuracy': float(acc),
        'brier': float(brier),
        'log_loss': float(ll),
        'ece': float(ece),
        'per_class': per_class,
    }


def bootstrap_ci(y_true, y_pred, n_bootstrap=1000, confidence=0.95):
    """Bootstrap confidence interval for accuracy."""
    n = len(y_true)
    accuracies = []
    for _ in range(n_bootstrap):
        idx = np.random.choice(n, n, replace=True)
        acc = (y_pred[idx] == y_true[idx]).mean()
        accuracies.append(acc)
    lower = np.percentile(accuracies, (1 - confidence) / 2 * 100)
    upper = np.percentile(accuracies, (1 + confidence) / 2 * 100)
    return float(lower), float(upper)


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    print(f"\n{'='*60}")
    print(f"  En Pensent — Neural Network Stacking Ensemble v10.0")
    print(f"{'='*60}")

    # Load data
    print(f"\nLoading data:")
    print(f"  Training: {TRAIN_FILE}")
    print(f"  Hold-out: {HOLDOUT_FILE}")

    train_df = pd.read_csv(TRAIN_FILE)
    holdout_df = pd.read_csv(HOLDOUT_FILE)

    # Filter valid results
    train_df = train_df[train_df['result_numeric'].notna()].copy()
    holdout_df = holdout_df[holdout_df['result_numeric'].notna()].copy()
    train_df['result_numeric'] = train_df['result_numeric'].astype(int)
    holdout_df['result_numeric'] = holdout_df['result_numeric'].astype(int)

    print(f"  Training samples: {len(train_df)}")
    print(f"  Hold-out samples: {len(holdout_df)}")

    # Split training into train/validation (80/20)
    val_size = int(len(train_df) * 0.2)
    val_df = train_df.head(val_size)  # Most recent = validation
    train_split = train_df.tail(len(train_df) - val_size)

    # Build features
    print("\nBuilding features...")
    X_train, y_train, feature_names, arch_enc, src_enc = build_features(
        train_split, fit_encoders=True
    )
    X_val, y_val, _, _, _ = build_features(
        val_df, archetype_encoder=arch_enc, source_encoder=src_enc
    )
    X_holdout, y_holdout, _, _, _ = build_features(
        holdout_df, archetype_encoder=arch_enc, source_encoder=src_enc
    )

    print(f"  Feature dimension: {X_train.shape[1]}")

    # ── Train Neural Network ──
    nn_model, nn_scaler, nn_val_pred, nn_val_probs = train_model(
        X_train, y_train, X_val, y_val, feature_names
    )

    # Predict on hold-out
    X_holdout_scaled = nn_scaler.transform(X_holdout)
    X_holdout_t = torch.FloatTensor(X_holdout_scaled).to(DEVICE)
    nn_model.eval()
    with torch.no_grad():
        holdout_out = nn_model(X_holdout_t)
        nn_holdout_probs = F.softmax(holdout_out, dim=1).cpu().numpy()
        nn_holdout_pred = nn_holdout_probs.argmax(axis=1)

    # ── Train Logistic Baseline ──
    print(f"\n{'='*60}")
    print(f"Training Logistic Regression Baseline")
    print(f"{'='*60}")
    lr_val_pred, lr_val_probs, lr_model, lr_scaler = train_logistic_baseline(
        X_train, y_train, X_val, y_val
    )
    X_holdout_lr = lr_scaler.transform(X_holdout)
    lr_holdout_probs = lr_model.predict_proba(X_holdout_lr)
    lr_holdout_pred = lr_holdout_probs.argmax(axis=1)

    # ── Baseline predictions (from raw data) ──
    ep_holdout_pred = holdout_df['hybrid_prediction'].apply(normalize_pred).values
    sf_holdout_pred = holdout_df['stockfish_prediction'].apply(normalize_pred).values
    fusion_holdout_pred = holdout_df['fusion_prediction'].apply(normalize_pred).values

    # EP probabilities (from confidence)
    ep_conf = (holdout_df['hybrid_confidence'].fillna(50) / 100.0).values
    ep_probs = np.zeros((len(holdout_df), 3))
    for i in range(len(holdout_df)):
        p = ep_conf[i]
        cls = ep_holdout_pred[i] if ep_holdout_pred[i] >= 0 else 0
        ep_probs[i, cls] = p
        remaining = (1 - p) / 2
        for j in range(3):
            if j != cls:
                ep_probs[i, j] = remaining

    # SF probabilities (from confidence)
    sf_conf = (holdout_df['stockfish_confidence'].fillna(50) / 100.0).values
    sf_probs = np.zeros((len(holdout_df), 3))
    for i in range(len(holdout_df)):
        p = sf_conf[i]
        cls = sf_holdout_pred[i] if sf_holdout_pred[i] >= 0 else 0
        sf_probs[i, cls] = p
        remaining = (1 - p) / 2
        for j in range(3):
            if j != cls:
                sf_probs[i, j] = remaining

    # Fusion probabilities
    fusion_conf = holdout_df['fusion_calibrated_confidence'].fillna(0.5).values
    fusion_probs = np.zeros((len(holdout_df), 3))
    for i in range(len(holdout_df)):
        p = fusion_conf[i]
        cls = fusion_holdout_pred[i] if fusion_holdout_pred[i] >= 0 else 0
        fusion_probs[i, cls] = p
        remaining = (1 - p) / 2
        for j in range(3):
            if j != cls:
                fusion_probs[i, j] = remaining

    # ── Evaluate all models ──
    print(f"\n{'='*60}")
    print(f"  HOLD-OUT BENCHMARK (n={len(holdout_df)})")
    print(f"{'='*60}")

    results = []

    # EP v8.07
    valid = ep_holdout_pred >= 0
    r_ep = evaluate(y_holdout[valid], ep_holdout_pred[valid], ep_probs[valid], "EP v8.07 (original)")
    results.append(r_ep)

    # Stockfish 18
    valid = sf_holdout_pred >= 0
    r_sf = evaluate(y_holdout[valid], sf_holdout_pred[valid], sf_probs[valid], "Stockfish 18")
    results.append(r_sf)

    # EP v9.0 Fusion
    valid = fusion_holdout_pred >= 0
    r_fusion = evaluate(y_holdout[valid], fusion_holdout_pred[valid], fusion_probs[valid], "EP v9.0 Fusion")
    results.append(r_fusion)

    # Logistic Regression
    r_lr = evaluate(y_holdout, lr_holdout_pred, lr_holdout_probs, "Logistic Regression (stacking)")
    results.append(r_lr)

    # Neural Network
    r_nn = evaluate(y_holdout, nn_holdout_pred, nn_holdout_probs, "Neural Network v10.0 (stacking)")
    results.append(r_nn)

    # Print results table
    print(f"\n{'Model':<35} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}")
    print("-" * 75)
    for r in results:
        print(f"{r['name']:<35} {r['accuracy']*100:>9.1f}% {r['brier']:>8.4f} {r['log_loss']:>8.4f} {r['ece']:>8.4f}")

    # Bootstrap CIs for the key models
    print(f"\n{'='*60}")
    print(f"  Bootstrap 95% Confidence Intervals (1000 resamples)")
    print(f"{'='*60}")

    for name, pred in [
        ("EP v8.07", ep_holdout_pred),
        ("Stockfish 18", sf_holdout_pred),
        ("EP v9.0 Fusion", fusion_holdout_pred),
        ("Neural Network v10.0", nn_holdout_pred),
    ]:
        valid = pred >= 0
        y_v = y_holdout[valid]
        p_v = pred[valid]
        acc = (p_v == y_v).mean()
        lo, hi = bootstrap_ci(y_v, p_v, n_bootstrap=1000)
        print(f"  {name:<30} {acc*100:.2f}% [{lo*100:.2f}%, {hi*100:.2f}%]")

    # ── Stratified analysis ──
    print(f"\n{'='*60}")
    print(f"  STRATIFIED ANALYSIS (Neural Network v10.0)")
    print(f"{'='*60}")

    # By eval zone
    print(f"\n  By eval zone:")
    zones = [
        ("0-25cp (balanced)", 0, 25),
        ("25-50cp (mild)", 25, 50),
        ("50-100cp (moderate)", 50, 100),
        ("100-200cp (clear)", 100, 200),
        ("200+cp (decisive)", 200, 9999),
    ]
    print(f"  {'Zone':<25} {'N':>6} {'EP':>8} {'SF':>8} {'Fusion':>8} {'NN v10':>8}")
    for name, lo, hi in zones:
        mask = (holdout_df['stockfish_eval'].abs() >= lo) & (holdout_df['stockfish_eval'].abs() < hi)
        if mask.sum() < 10: continue
        y_z = y_holdout[mask.values]
        ep_acc = (ep_holdout_pred[mask.values] == y_z).mean() * 100
        sf_acc = (sf_holdout_pred[mask.values] == y_z).mean() * 100
        fusion_mask = fusion_holdout_pred[mask.values] >= 0
        fusion_acc = (fusion_holdout_pred[mask.values][fusion_mask] == y_z[fusion_mask]).mean() * 100 if fusion_mask.sum() > 0 else 0
        nn_acc = (nn_holdout_pred[mask.values] == y_z).mean() * 100
        print(f"  {name:<25} {mask.sum():>6} {ep_acc:>7.1f}% {sf_acc:>7.1f}% {fusion_acc:>7.1f}% {nn_acc:>7.1f}%")

    # By data source
    print(f"\n  By data source:")
    print(f"  {'Source':<25} {'N':>6} {'EP':>8} {'SF':>8} {'Fusion':>8} {'NN v10':>8}")
    for src in sorted(holdout_df['data_source'].unique()):
        mask = (holdout_df['data_source'] == src).values
        if mask.sum() < 10: continue
        y_s = y_holdout[mask]
        ep_acc = (ep_holdout_pred[mask] == y_s).mean() * 100
        sf_acc = (sf_holdout_pred[mask] == y_s).mean() * 100
        fusion_mask = fusion_holdout_pred[mask] >= 0
        fusion_acc = (fusion_holdout_pred[mask][fusion_mask] == y_s[fusion_mask]).mean() * 100 if fusion_mask.sum() > 0 else 0
        nn_acc = (nn_holdout_pred[mask] == y_s).mean() * 100
        print(f"  {src:<25} {mask.sum():>6} {ep_acc:>7.1f}% {sf_acc:>7.1f}% {fusion_acc:>7.1f}% {nn_acc:>7.1f}%")

    # By game phase
    print(f"\n  By game phase:")
    print(f"  {'Phase':<25} {'N':>6} {'EP':>8} {'SF':>8} {'Fusion':>8} {'NN v10':>8}")
    phases = [
        ("Early-mid (11-25)", 11, 25),
        ("Late-mid (26-45)", 26, 45),
        ("Endgame (46-65)", 46, 65),
        ("Deep end (66-80)", 66, 80),
    ]
    for name, lo, hi in phases:
        mask = (holdout_df['move_number'] >= lo) & (holdout_df['move_number'] <= hi)
        if mask.sum() < 10: continue
        y_p = y_holdout[mask.values]
        ep_acc = (ep_holdout_pred[mask.values] == y_p).mean() * 100
        sf_acc = (sf_holdout_pred[mask.values] == y_p).mean() * 100
        fusion_mask = fusion_holdout_pred[mask.values] >= 0
        fusion_acc = (fusion_holdout_pred[mask.values][fusion_mask] == y_p[fusion_mask]).mean() * 100 if fusion_mask.sum() > 0 else 0
        nn_acc = (nn_holdout_pred[mask.values] == y_p).mean() * 100
        print(f"  {name:<25} {mask.sum():>6} {ep_acc:>7.1f}% {sf_acc:>7.1f}% {fusion_acc:>7.1f}% {nn_acc:>7.1f}%")

    # ── Per-class analysis ──
    print(f"\n{'='*60}")
    print(f"  PER-CLASS ANALYSIS (draw prediction)")
    print(f"{'='*60}")

    classes = ['white_wins', 'black_wins', 'draw']
    for cls_name, cls_idx in zip(classes, [0, 1, 2]):
        mask = y_holdout == cls_idx
        if mask.sum() < 5: continue
        print(f"\n  {cls_name} (n={mask.sum()}):")
        for name, pred in [("EP v8.07", ep_holdout_pred), ("SF 18", sf_holdout_pred),
                           ("Fusion v9", fusion_holdout_pred), ("NN v10", nn_holdout_pred)]:
            valid = mask & (pred >= 0)
            if valid.sum() > 0:
                recall = (pred[valid] == cls_idx).mean() * 100
                print(f"    {name:<20} recall: {recall:.1f}%")

    # ── Save results ──
    results_dir = Path(__file__).parent.parent / "results"
    results_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = results_dir / f"benchmark_{timestamp}.json"

    output = {
        "timestamp": datetime.now().isoformat(),
        "training_samples": len(train_df),
        "holdout_samples": len(holdout_df),
        "feature_count": X_train.shape[1],
        "device": str(DEVICE),
        "results": results,
        "feature_names": feature_names,
    }

    with open(results_file, 'w') as f:
        json.dump(output, f, indent=2)

    # Save model
    model_dir = Path(__file__).parent.parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_file = model_dir / f"nn_v10_{timestamp}.pt"
    torch.save({
        'model_state': nn_model.state_dict(),
        'scaler': nn_scaler,
        'feature_names': feature_names,
        'archetype_encoder': arch_enc,
        'source_encoder': src_enc,
        'input_dim': X_train.shape[1],
    }, model_file)

    print(f"\n{'='*60}")
    print(f"  Results saved: {results_file}")
    print(f"  Model saved:   {model_file}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
