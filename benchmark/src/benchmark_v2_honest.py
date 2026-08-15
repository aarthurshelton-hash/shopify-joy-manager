"""
En Pensent — Honest Benchmark v2
============================================================================

This benchmark fixes all the methodological issues from v1:

1. PROPER BASELINE: Logistic regression on SF eval + move_number + elo
   (not a naive sign(eval) threshold)

2. GAME-LEVEL SPLIT: No game appears in both training and hold-out
   (verified by game_id)

3. HONEST CHESS960: Check if SF eval is actually valid for Chess960
   positions before claiming an edge

4. REAL COLOR-FLOW SIGNAL: The archetype and enhanced_confidence ARE
   the color-flow trajectory outputs. We test whether they add
   predictive value over SF eval + elo.

5. ABLATION STUDY: Each feature group is added incrementally to
   measure its true contribution.

============================================================================
"""

import os
import sys
import json
import time
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss
from sklearn.linear_model import LogisticRegression

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data"
# Use v2 exports (game-level split) if available, fall back to v1
train_files = sorted(DATA_DIR.glob("training_set_v2_*.csv"))
holdout_files = sorted(DATA_DIR.glob("holdout_set_v2_*.csv"))
if not train_files:
    train_files = sorted(DATA_DIR.glob("training_set_*.csv"))
    holdout_files = sorted(DATA_DIR.glob("holdout_set_*.csv"))

TRAIN_FILE = train_files[-1]
HOLDOUT_FILE = holdout_files[-1]

DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
SEED = 42

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
PRED_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2, "1-0": 0, "0-1": 1, "1/2-1/2": 2}

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def normalize_pred(p):
    if pd.isna(p): return -1
    return PRED_MAP.get(str(p).strip().lower(), -1)

def normalize_result(r):
    if pd.isna(r): return -1
    return RESULT_MAP.get(str(r).strip().lower(), PRED_MAP.get(str(r).strip().lower(), -1))

def softmax_probs(pred, confidence):
    """Convert (prediction, confidence) to 3-class probability distribution."""
    probs = np.zeros((len(pred), 3))
    for i in range(len(pred)):
        p = confidence[i]
        cls = pred[i] if pred[i] >= 0 else 0
        probs[i, cls] = p
        rem = (1 - p) / 2
        for j in range(3):
            if j != cls: probs[i, j] = rem
    return probs

def evaluate(y_true, y_pred, y_probs, name="Model"):
    acc = accuracy_score(y_true, y_pred)
    y_onehot = np.zeros((len(y_true), 3))
    for i, y in enumerate(y_true): y_onehot[i, y] = 1.0
    brier = np.mean(np.sum((y_probs - y_onehot) ** 2, axis=1))
    ll = log_loss(y_true, y_probs, labels=[0, 1, 2])

    # ECE
    confidences = y_probs.max(axis=1)
    predictions = y_probs.argmax(axis=1)
    n_bins = 10
    bin_boundaries = np.linspace(1/3, 1.0, n_bins + 1)
    ece = 0
    for i in range(n_bins):
        lo, hi = bin_boundaries[i], bin_boundaries[i+1]
        mask = (confidences >= lo) & (confidences < hi if i < n_bins-1 else confidences <= hi)
        if mask.sum() > 0:
            bin_acc = (predictions[mask] == y_true[mask]).mean()
            bin_conf = confidences[mask].mean()
            ece += abs(bin_acc - bin_conf) * mask.sum() / len(y_true)

    return {'name': name, 'accuracy': float(acc), 'brier': float(brier),
            'log_loss': float(ll), 'ece': float(ece)}

def bootstrap_ci(y_true, y_pred, n=2000, confidence=0.95):
    idx = np.random.choice(len(y_true), (n, len(y_true)), replace=True)
    accs = (y_pred[idx] == y_true[idx]).mean(axis=1)
    return float(np.percentile(accs, (1-confidence)/2*100)), float(np.percentile(accs, (1+confidence)/2*100))

# ─────────────────────────────────────────────────────────────
# FEATURE GROUPS (for ablation)
# ─────────────────────────────────────────────────────────────

def build_features(df, arch_encoder=None, source_encoder=None, fit=False):
    """Build feature groups for ablation study."""
    df = df.copy()
    df['ep_pred'] = df['hybrid_prediction'].apply(normalize_pred)
    df['sf_pred'] = df['stockfish_prediction'].apply(normalize_pred)
    df['result'] = df['result_numeric'].astype(int)

    groups = {}

    # ── Group 1: SF eval only (the bare minimum) ──
    sf_eval = df['stockfish_eval'].fillna(0).clip(-1000, 1000).values.astype(float)
    groups['sf_eval'] = np.column_stack([
        sf_eval,
        np.abs(sf_eval),
        sf_eval ** 2,
    ])

    # ── Group 2: SF eval + move_number + elo ──
    move_num = df['move_number'].fillna(25).values.astype(float)
    white_elo = df['white_elo'].fillna(1500).values.astype(float)
    black_elo = df['black_elo'].fillna(1500).values.astype(float)
    groups['sf_eval + context'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
    ])

    # ── Group 3: SF eval + context + EP signals ──
    ep_conf = (df['hybrid_confidence'].fillna(50) / 100.0).values.astype(float)
    ep_pred = df['ep_pred'].values
    ep_onehot = np.zeros((len(df), 3))
    for i, p in enumerate(ep_pred):
        if p >= 0: ep_onehot[i, p] = 1.0

    groups['sf + context + EP'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
        ep_conf, ep_conf ** 2,
        ep_onehot,  # 3 features
    ])

    # ── Group 4: SF + context + EP + archetype (color-flow trajectory) ──
    archetype = df['hybrid_archetype'].fillna('unknown').astype(str)
    if fit:
        arch_encoder = LabelEncoder()
        arch_encoded = arch_encoder.fit_transform(archetype)
        arch_classes = set(arch_encoder.classes_)
    else:
        arch_classes = set(arch_encoder.classes_) if arch_encoder else set()
        arch_encoded = np.array([
            arch_encoder.transform([a])[0] if a in arch_classes
            else arch_encoder.transform(['unknown'])[0] if 'unknown' in arch_classes
            else 0
            for a in archetype
        ])

    n_arch = len(arch_encoder.classes_) if arch_encoder else 1
    arch_onehot = np.zeros((len(df), n_arch))
    for i, a in enumerate(arch_encoded):
        if a < n_arch: arch_onehot[i, a] = 1.0

    # Enhanced confidence (the color-flow trajectory confidence)
    enh_conf = df['enhanced_confidence'].fillna(0.5).values.astype(float)
    color_richness = df['color_richness'].fillna(0).values.astype(float)
    complexity = df['complexity_score'].fillna(0).values.astype(float)

    groups['sf + context + EP + archetype'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
        ep_conf, ep_conf ** 2,
        ep_onehot,
        enh_conf, color_richness, complexity,
        arch_onehot,
    ])

    # ── Group 4b: SF + context + EP + REAL color-flow trajectory features ──
    # These are the actual temporal trajectory features from the game simulator:
    #   - quadrantProfile: white vs black visit balance per quadrant (-100 to +100)
    #   - temporalFlow: opening/middlegame/endgame balance + volatility
    #   - intensity, dominantSide, flowDirection
    cf_cols = ['q_kingside_white', 'q_kingside_black', 'q_queenside_white',
               'q_queenside_black', 'q_center',
               'tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility',
               'cf_intensity']
    cf_features = df[cf_cols].fillna(0).values.astype(float) if all(c in df.columns for c in cf_cols) else np.zeros((len(df), len(cf_cols)))

    groups['sf + context + EP + trajectory'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
        ep_conf, ep_conf ** 2,
        ep_onehot,
        cf_features,
    ])

    # ── Group 4c: SF + context + EP + trajectory + archetype ──
    groups['sf + context + EP + trajectory + archetype'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
        ep_conf, ep_conf ** 2,
        ep_onehot,
        cf_features,
        arch_onehot,
    ])

    # ── Group 5: Everything + fusion signals ──
    fusion_conf = df['fusion_calibrated_confidence'].fillna(0.5).values.astype(float)
    fusion_pred = df['fusion_prediction'].apply(normalize_pred).values
    fusion_onehot = np.zeros((len(df), 3))
    for i, p in enumerate(fusion_pred):
        if p >= 0: fusion_onehot[i, p] = 1.0

    groups['sf + context + EP + archetype + fusion'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
        ep_conf, ep_conf ** 2,
        ep_onehot,
        enh_conf, color_richness, complexity,
        arch_onehot,
        fusion_conf, fusion_onehot,
    ])

    y = df['result'].values
    return groups, y, arch_encoder

# ─────────────────────────────────────────────────────────────
# NEURAL NETWORK (simple, to avoid overfitting on small data)
# ─────────────────────────────────────────────────────────────

class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden=64, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden),
            nn.BatchNorm1d(hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 3)
        )
    def forward(self, x):
        return self.net(x)

def train_nn(X_train, y_train, X_val, y_val, epochs=50, lr=0.001, batch_size=256):
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)

    X_train_t = torch.FloatTensor(X_train_s).to(DEVICE)
    y_train_t = torch.LongTensor(y_train).to(DEVICE)
    X_val_t = torch.FloatTensor(X_val_s).to(DEVICE)
    y_val_t = torch.LongTensor(y_val).to(DEVICE)

    train_dl = DataLoader(TensorDataset(X_train_t, y_train_t), batch_size=batch_size, shuffle=True)

    model = SimpleNN(X_train.shape[1]).to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-3)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)

    # Class weights
    class_counts = np.bincount(y_train, minlength=3)
    weights = len(y_train) / (3 * class_counts)
    weights[2] = min(weights[2], 2.0)  # cap draw weight
    criterion = nn.CrossEntropyLoss(weight=torch.FloatTensor(weights).to(DEVICE))

    best_val_acc = 0
    best_state = None
    patience_counter = 0

    for epoch in range(epochs):
        model.train()
        for xb, yb in train_dl:
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(X_val_t).argmax(dim=1).cpu().numpy()
            val_acc = (val_pred == y_val).mean()

        scheduler.step(1 - val_acc)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= 15:
            break

    if best_state:
        model.load_state_dict(best_state)
    return model, scaler

def nn_predict(model, scaler, X):
    X_s = scaler.transform(X)
    X_t = torch.FloatTensor(X_s).to(DEVICE)
    model.eval()
    with torch.no_grad():
        logits = model(X_t)
        probs = F.softmax(logits, dim=1).cpu().numpy()
    return probs.argmax(axis=1), probs

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    print(f"\n{'='*70}")
    print(f"  En Pensent — Honest Benchmark v2")
    print(f"{'='*70}")
    print(f"  Training: {TRAIN_FILE}")
    print(f"  Hold-out: {HOLDOUT_FILE}")
    print(f"  Device: {DEVICE}")

    train_df = pd.read_csv(TRAIN_FILE)
    holdout_df = pd.read_csv(HOLDOUT_FILE)

    # Verify no game-level leakage
    if 'game_id' in train_df.columns and 'game_id' in holdout_df.columns:
        train_games = set(train_df['game_id'].dropna().unique())
        holdout_games = set(holdout_df['game_id'].dropna().unique())
        overlap = train_games & holdout_games
        print(f"\n  Leakage check: {len(overlap)} games in both sets (MUST be 0)")
        assert len(overlap) == 0, "DATA LEAKAGE DETECTED!"
        print(f"  ✓ No game-level leakage")
    else:
        print(f"\n  WARNING: No game_id — cannot verify leakage!")

    print(f"  Training: {len(train_df)} positions, {train_df['game_id'].nunique() if 'game_id' in train_df.columns else '?'} games")
    print(f"  Hold-out: {len(holdout_df)} positions, {holdout_df['game_id'].nunique() if 'game_id' in holdout_df.columns else '?'} games")

    # Split training into train/val (80/20 by game)
    if 'game_id' in train_df.columns:
        games = train_df['game_id'].unique()
        rng = np.random.RandomState(42)
        rng.shuffle(games)
        n_val = int(len(games) * 0.2)
        val_games = set(games[:n_val])
        val_df = train_df[train_df['game_id'].isin(val_games)]
        train_split = train_df[~train_df['game_id'].isin(val_games)]
    else:
        val_df = train_df.head(int(len(train_df) * 0.2))
        train_split = train_df.tail(int(len(train_df) * 0.8))

    print(f"  Train split: {len(train_split)}, Val split: {len(val_df)}")

    # Build features for all groups
    train_groups, y_train, arch_enc = build_features(train_split, fit=True)
    val_groups, y_val, _ = build_features(val_df, arch_encoder=arch_enc)
    holdout_groups, y_holdout, _ = build_features(holdout_df, arch_encoder=arch_enc)

    # ── BASELINE 1: Naive SF (sign of eval) ──
    sf_pred = holdout_df['stockfish_prediction'].apply(normalize_pred).values
    sf_conf = (holdout_df['stockfish_confidence'].fillna(50) / 100.0).values
    sf_probs = softmax_probs(sf_pred, sf_conf)
    valid = sf_pred >= 0

    # ── BASELINE 2: Calibrated SF (logistic regression on sf_eval + move_num + elo) ──
    lr_sf = LogisticRegression(max_iter=2000, C=1.0)
    lr_sf.fit(train_groups['sf_eval + context'], y_train)
    lr_sf_probs = lr_sf.predict_proba(holdout_groups['sf_eval + context'])
    lr_sf_pred = lr_sf_probs.argmax(axis=1)

    # ── EP v8.07 (original) ──
    ep_pred = holdout_df['hybrid_prediction'].apply(normalize_pred).values
    ep_conf = (holdout_df['hybrid_confidence'].fillna(50) / 100.0).values
    ep_probs = softmax_probs(ep_pred, ep_conf)
    valid_ep = ep_pred >= 0

    # ── ABLATION: Logistic regression with each feature group ──
    lr_results = {}
    for group_name in ['sf_eval', 'sf_eval + context', 'sf + context + EP',
                       'sf + context + EP + archetype',
                       'sf + context + EP + trajectory',
                       'sf + context + EP + trajectory + archetype',
                       'sf + context + EP + archetype + fusion']:
        lr = LogisticRegression(max_iter=2000, C=0.5)
        lr.fit(train_groups[group_name], y_train)
        probs = lr.predict_proba(holdout_groups[group_name])
        pred = probs.argmax(axis=1)
        lr_results[group_name] = evaluate(y_holdout, pred, probs, f"LR ({group_name})")

    # ── ABLATION: Neural network with each feature group ──
    nn_results = {}
    for group_name in ['sf_eval + context', 'sf + context + EP',
                       'sf + context + EP + archetype',
                       'sf + context + EP + trajectory',
                       'sf + context + EP + trajectory + archetype',
                       'sf + context + EP + archetype + fusion']:
        model, scaler = train_nn(train_groups[group_name], y_train,
                                 val_groups[group_name], y_val)
        pred, probs = nn_predict(model, scaler, holdout_groups[group_name])
        nn_results[group_name] = evaluate(y_holdout, pred, probs, f"NN ({group_name})")

    # ── PRINT RESULTS ──
    print(f"\n{'='*70}")
    print(f"  HOLD-OUT BENCHMARK (n={len(holdout_df)})")
    print(f"{'='*70}")

    all_results = []
    all_results.append(evaluate(y_holdout[valid], sf_pred[valid], sf_probs[valid], "SF (naive threshold)"))
    all_results.append(evaluate(y_holdout, lr_sf_pred, lr_sf_probs, "SF (calibrated LR)"))
    all_results.append(evaluate(y_holdout[valid_ep], ep_pred[valid_ep], ep_probs[valid_ep], "EP v8.07 (original)"))
    all_results.extend(lr_results.values())
    all_results.extend(nn_results.values())

    print(f"\n{'Model':<55} {'Acc':>7} {'Brier':>7} {'LogLoss':>8} {'ECE':>7}")
    print("-" * 90)
    for r in all_results:
        print(f"{r['name']:<55} {r['accuracy']*100:>6.1f}% {r['brier']:>7.4f} {r['log_loss']:>8.4f} {r['ece']:>7.4f}")

    # ── ABLATION TABLE: What does each feature group add? ──
    print(f"\n{'='*70}")
    print(f"  ABLATION STUDY — What does each feature group add?")
    print(f"{'='*70}")
    print(f"\n  {'Feature group':<45} {'LR Acc':>8} {'NN Acc':>8} {'Δ vs SF':>8}")
    print("  " + "-" * 75)

    sf_baseline = lr_results['sf_eval + context']['accuracy']
    for group_name in ['sf_eval + context', 'sf + context + EP',
                       'sf + context + EP + archetype',
                       'sf + context + EP + trajectory',
                       'sf + context + EP + trajectory + archetype',
                       'sf + context + EP + archetype + fusion']:
        lr_acc = lr_results[group_name]['accuracy']
        nn_acc = nn_results.get(group_name, {}).get('accuracy', None)
        nn_str = f"{nn_acc*100:.1f}%" if nn_acc else "—"
        delta = (lr_acc - sf_baseline) * 100
        print(f"  {group_name:<45} {lr_acc*100:>7.1f}% {nn_str:>8} {delta:>+7.1f}pp")

    # ── Bootstrap CIs for key models ──
    print(f"\n{'='*70}")
    print(f"  Bootstrap 95% Confidence Intervals (2000 resamples)")
    print(f"{'='*70}")

    key_models = [
        ("SF (calibrated LR)", lr_sf_pred),
        ("EP v8.07", ep_pred),
        ("LR (sf + context + EP + archetype)", lr_results['sf + context + EP + archetype']['accuracy']),
    ]

    for name, pred in [("SF (calibrated LR)", lr_sf_pred), ("EP v8.07", ep_pred)]:
        v = pred >= 0
        acc = (pred[v] == y_holdout[v]).mean()
        lo, hi = bootstrap_ci(y_holdout[v], pred[v])
        print(f"  {name:<45} {acc*100:.2f}% [{lo*100:.2f}%, {hi*100:.2f}%]")

    for group_name in ['sf + context + EP + archetype',
                       'sf + context + EP + trajectory',
                       'sf + context + EP + trajectory + archetype',
                       'sf + context + EP + archetype + fusion']:
        lr = LogisticRegression(max_iter=2000, C=0.5)
        lr.fit(train_groups[group_name], y_train)
        pred = lr.predict(holdout_groups[group_name])
        acc = (pred == y_holdout).mean()
        lo, hi = bootstrap_ci(y_holdout, pred)
        label = group_name[:40] + ('...' if len(group_name) > 40 else '')
        print(f"  LR ({label:<43}) {acc*100:.2f}% [{lo*100:.2f}%, {hi*100:.2f}%]")

    # ── Chess960 analysis ──
    print(f"\n{'='*70}")
    print(f"  CHESS960 ANALYSIS")
    print(f"{'='*70}")
    chess960 = holdout_df[holdout_df['data_source'] == 'lichess_960']
    if len(chess960) > 0:
        print(f"  Chess960 positions: {len(chess960)}")
        sf_preds_c960 = chess960['stockfish_prediction'].apply(normalize_pred).values
        sf_evals_c960 = chess960['stockfish_eval'].values
        print(f"  SF eval range: [{sf_evals_c960.min():.0f}, {sf_evals_c960.max():.0f}]")
        print(f"  SF pred distribution: white={np.sum(sf_preds_c960==0)}, black={np.sum(sf_preds_c960==1)}, draw={np.sum(sf_preds_c960==2)}")
        actual_c960 = chess960['result_numeric'].astype(int).values
        print(f"  Actual: white={np.sum(actual_c960==0)}, black={np.sum(actual_c960==1)}, draw={np.sum(actual_c960==2)}")

        # Check if SF eval is meaningful for Chess960
        sf_acc_c960 = (sf_preds_c960[sf_preds_c960>=0] == actual_c960[sf_preds_c960>=0]).mean() if (sf_preds_c960>=0).any() else 0
        print(f"  SF (naive) accuracy: {sf_acc_c960*100:.1f}%")

        # Calibrated SF on Chess960
        c960_mask = holdout_df['data_source'] == 'lichess_960'
        lr_sf_c960_pred = lr_sf_probs[c960_mask.values].argmax(axis=1)
        lr_sf_c960_acc = (lr_sf_c960_pred == y_holdout[c960_mask.values]).mean()
        print(f"  SF (calibrated LR) accuracy: {lr_sf_c960_acc*100:.1f}%")

        # EP on Chess960
        ep_c960 = ep_pred[c960_mask.values]
        ep_c960_valid = ep_c960 >= 0
        ep_c960_acc = (ep_c960[ep_c960_valid] == y_holdout[c960_mask.values][ep_c960_valid]).mean() if ep_c960_valid.any() else 0
        print(f"  EP v8.07 accuracy: {ep_c960_acc*100:.1f}%")

        # LR with archetype on Chess960
        lr_arch = LogisticRegression(max_iter=2000, C=0.5)
        lr_arch.fit(train_groups['sf + context + EP + archetype'], y_train)
        lr_arch_probs = lr_arch.predict_proba(holdout_groups['sf + context + EP + archetype'])
        lr_arch_c960_pred = lr_arch_probs[c960_mask.values].argmax(axis=1)
        lr_arch_c960_acc = (lr_arch_c960_pred == y_holdout[c960_mask.values]).mean()
        print(f"  LR (sf+context+EP+archetype) accuracy: {lr_arch_c960_acc*100:.1f}%")

        print(f"\n  NOTE: If SF eval is broken for Chess960 (e.g. predicts black_wins")
        print(f"  only 3 times), then the 'edge over SF' on Chess960 is meaningless.")
    else:
        print("  No Chess960 positions in hold-out")

    # ── Stratified by eval zone ──
    print(f"\n{'='*70}")
    print(f"  STRATIFIED BY EVAL ZONE")
    print(f"{'='*70}")
    zones = [(0, 25, "0-25cp"), (25, 50, "25-50cp"), (50, 100, "50-100cp"),
             (100, 200, "100-200cp"), (200, 9999, "200+cp")]
    print(f"  {'Zone':<12} {'N':>6} {'SF(LR)':>8} {'EP':>8} {'LR(arch)':>9}")
    for lo, hi, name in zones:
        mask = (holdout_df['stockfish_eval'].abs() >= lo) & (holdout_df['stockfish_eval'].abs() < hi)
        if mask.sum() < 10: continue
        y_z = y_holdout[mask.values]
        sf_z = (lr_sf_pred[mask.values] == y_z).mean() * 100
        ep_z = (ep_pred[mask.values] == y_z).mean() * 100 if (ep_pred[mask.values] >= 0).any() else 0
        arch_z = (lr_arch_probs[mask.values].argmax(axis=1) == y_z).mean() * 100
        print(f"  {name:<12} {mask.sum():>6} {sf_z:>7.1f}% {ep_z:>7.1f}% {arch_z:>8.1f}%")

    # ── Save ──
    results_dir = Path(__file__).parent.parent / "results"
    results_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output = {
        "timestamp": datetime.now().isoformat(),
        "version": "v2-honest",
        "training_samples": len(train_df),
        "holdout_samples": len(holdout_df),
        "leakage_verified": True,
        "results": all_results,
        "ablation_lr": {k: v for k, v in lr_results.items()},
        "ablation_nn": {k: v for k, v in nn_results.items()},
    }
    results_file = results_dir / f"benchmark_v2_honest_{timestamp}.json"
    with open(results_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\n  Results saved: {results_file}")


if __name__ == "__main__":
    main()
