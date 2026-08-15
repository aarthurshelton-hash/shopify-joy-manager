"""
En Pensent — Honest Benchmark v3
============================================================================

Improvements over v2:

1. TEMPORAL HOLDOUT: Train on older games, test on newer games.
   Uses created_at to split by time, not just by game_id.
   This tests whether the model predicts the FUTURE, not whether it fits
   the current era's patterns. Game-level leakage is still verified.

2. LEARNED STACKER: Replaces hand-tuned fusion weights (0.25/0.45/0.30)
   with a logistic regression / LightGBM stacker trained on the
   sub-predictor outputs (EP, SF, fusion) + context features.
   The stacker learns optimal weights from data, per-zone if needed.

3. ISOTONIC CALIBRATION: All models (EP, SF, stacker) get isotonic
   regression calibration on top, so probabilities are honest P(win/draw).
   This fixes the apples-to-oranges Brier/log-loss comparison from v2
   where EP used softmax(confidence) while baselines used real probs.

4. PER-ARCHETYPE REPORT: Table showing per-archetype N, EP acc, SF acc,
   delta, and bootstrap 95% CIs. The whole pitch is "archetype-specific
   edge" — this table shows whether it's real or noise.

5. PROPER BASELINE: Logistic regression on SF eval + move_number + elo
   (kept from v2). Also adds a "SF + context + isotonic" baseline so
   SF gets the same calibration treatment as EP.

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
from sklearn.isotonic import IsotonicRegression

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

# ─────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data"
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

# Temporal split: hold out the newest 25% of games (by created_at)
TEMPORAL_HOLDOUT_FRACTION = 0.25

# ─────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────

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

def calibrate_isotonic(y_true, pred_probs, n_classes=3):
    """Fit per-class isotonic regression on raw probabilities.
    Returns a function that calibrates new probability arrays."""
    calibrators = []
    for c in range(n_classes):
        y_binary = (y_true == c).astype(int)
        # Use the probability of class c as the input
        ir = IsotonicRegression(out_of_bounds='clip', y_min=0.01, y_max=0.99)
        ir.fit(pred_probs[:, c], y_binary)
        calibrators.append(ir)

    def apply(probs):
        calibrated = np.zeros_like(probs)
        for c in range(n_classes):
            calibrated[:, c] = calibrators[c].transform(probs[:, c])
        # Renormalize to sum to 1
        row_sums = calibrated.sum(axis=1, keepdims=True)
        row_sums = np.where(row_sums > 0, row_sums, 1.0)
        calibrated /= row_sums
        return calibrated

    return apply

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

def bootstrap_ci_delta(y_true, pred_a, pred_b, n=2000, confidence=0.95):
    """Bootstrap CI for the difference in accuracy between two models."""
    idx = np.random.choice(len(y_true), (n, len(y_true)), replace=True)
    accs_a = (pred_a[idx] == y_true[idx]).mean(axis=1)
    accs_b = (pred_b[idx] == y_true[idx]).mean(axis=1)
    deltas = accs_a - accs_b
    lo = float(np.percentile(deltas, (1-confidence)/2*100))
    hi = float(np.percentile(deltas, (1+confidence)/2*100))
    mean_delta = float(deltas.mean())
    return mean_delta, lo, hi

# ─────────────────────────────────────────────────────
# FEATURE GROUPS (for ablation + stacker)
# ─────────────────────────────────────────────────────

def build_features(df, arch_encoder=None, fit=False):
    """Build feature groups for ablation study and stacker."""
    df = df.copy()
    df['ep_pred'] = df['hybrid_prediction'].apply(normalize_pred)
    df['sf_pred'] = df['stockfish_prediction'].apply(normalize_pred)
    df['fusion_pred'] = df['fusion_prediction'].apply(normalize_pred)
    df['result'] = df['result_numeric'].astype(int)

    groups = {}

    # ── Group 1: SF eval only ──
    sf_eval = df['stockfish_eval'].fillna(0).clip(-1000, 1000).values.astype(float)
    groups['sf_eval'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
    ])

    # ── Group 2: SF eval + context ──
    move_num = df['move_number'].fillna(25).values.astype(float)
    white_elo = df['white_elo'].fillna(1500).values.astype(float)
    black_elo = df['black_elo'].fillna(1500).values.astype(float)
    context = np.column_stack([
        move_num, move_num ** 2,
        white_elo, black_elo, (white_elo - black_elo),
    ])
    groups['sf_eval + context'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
    ])

    # ── Sub-predictor probabilities (for stacker) ──
    ep_conf = (df['hybrid_confidence'].fillna(50) / 100.0).values.astype(float)
    sf_conf = (df['stockfish_confidence'].fillna(50) / 100.0).values.astype(float)
    fusion_conf = (df['fusion_calibrated_confidence'].fillna(50) / 100.0).values.astype(float)

    ep_pred = df['ep_pred'].values
    sf_pred = df['sf_pred'].values
    fusion_pred = df['fusion_pred'].values

    ep_onehot = np.zeros((len(df), 3))
    sf_onehot = np.zeros((len(df), 3))
    fusion_onehot = np.zeros((len(df), 3))
    for i in range(len(df)):
        if ep_pred[i] >= 0: ep_onehot[i, ep_pred[i]] = 1.0
        if sf_pred[i] >= 0: sf_onehot[i, sf_pred[i]] = 1.0
        if fusion_pred[i] >= 0: fusion_onehot[i, fusion_pred[i]] = 1.0

    # Sub-predictor probability vectors (pred * confidence for predicted class, rest uniform)
    ep_probs_raw = softmax_probs(ep_pred, ep_conf)
    sf_probs_raw = softmax_probs(sf_pred, sf_conf)
    fusion_probs_raw = softmax_probs(fusion_pred, fusion_conf)

    # ── Group 3: SF + context + EP ──
    groups['sf + context + EP'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_conf, ep_conf ** 2, ep_onehot,
    ])

    # ── Group 4: SF + context + EP + archetype ──
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

    enh_conf = df['enhanced_confidence'].fillna(0.5).values.astype(float)
    color_richness = df['color_richness'].fillna(0).values.astype(float)
    complexity = df['complexity_score'].fillna(0).values.astype(float)

    groups['sf + context + EP + archetype'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_conf, ep_conf ** 2, ep_onehot,
        enh_conf, color_richness, complexity,
        arch_onehot,
    ])

    # ── Group 4b: SF + context + EP + trajectory ──
    cf_cols = ['q_kingside_white', 'q_kingside_black', 'q_queenside_white',
               'q_queenside_black', 'q_center',
               'tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility',
               'cf_intensity']
    cf_features = df[cf_cols].fillna(0).values.astype(float) if all(c in df.columns for c in cf_cols) else np.zeros((len(df), len(cf_cols)))

    groups['sf + context + EP + trajectory'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_conf, ep_conf ** 2, ep_onehot,
        cf_features,
    ])

    # ── Group 4c: SF + context + EP + trajectory + archetype ──
    groups['sf + context + EP + trajectory + archetype'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_conf, ep_conf ** 2, ep_onehot,
        cf_features, arch_onehot,
    ])

    # ── Group 5: STACKER INPUT — all sub-predictor probs + context + archetype ──
    # This is the key new feature group: raw probabilities from all 3 sub-predictors
    # plus context, letting the stacker learn optimal fusion weights.
    groups['stacker (all probs + context + archetype)'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_probs_raw, sf_probs_raw, fusion_probs_raw,
        ep_conf, sf_conf, fusion_conf,
        enh_conf, color_richness, complexity,
        arch_onehot,
    ])

    # ── Group 5b: STACKER + trajectory ──
    groups['stacker + trajectory'] = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2, context,
        ep_probs_raw, sf_probs_raw, fusion_probs_raw,
        ep_conf, sf_conf, fusion_conf,
        enh_conf, color_richness, complexity,
        arch_onehot, cf_features,
    ])

    y = df['result'].values
    return groups, y, arch_encoder, {
        'ep_probs_raw': ep_probs_raw, 'sf_probs_raw': sf_probs_raw,
        'fusion_probs_raw': fusion_probs_raw,
        'ep_pred': ep_pred, 'sf_pred': sf_pred, 'fusion_pred': fusion_pred,
        'ep_conf': ep_conf, 'sf_conf': sf_conf, 'fusion_conf': fusion_conf,
        'archetype': archetype.values,
    }

# ─────────────────────────────────────────────────────
# NEURAL NETWORK
# ─────────────────────────────────────────────────────

class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden=64, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden), nn.BatchNorm1d(hidden), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(hidden, 32), nn.BatchNorm1d(32), nn.ReLU(), nn.Dropout(dropout),
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

    class_counts = np.bincount(y_train, minlength=3)
    weights = len(y_train) / (3 * class_counts)
    weights[2] = min(weights[2], 2.0)
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

# ─────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────

def main():
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    print(f"\n{'='*70}")
    print(f"  En Pensent — Honest Benchmark v3")
    print(f"  (temporal holdout + learned stacker + isotonic calibration)")
    print(f"{'='*70}")
    print(f"  Training file: {TRAIN_FILE}")
    print(f"  Hold-out file: {HOLDOUT_FILE}")
    print(f"  Device: {DEVICE}")
    print(f"  LightGBM: {'available' if HAS_LGB else 'NOT available'}")

    # ── LOAD AND MERGE ALL DATA, THEN RE-SPLIT TEMPORALLY ──
    # v2 split by game_id (random). v3 re-splits by created_at (temporal).
    train_df = pd.read_csv(TRAIN_FILE)
    holdout_df = pd.read_csv(HOLDOUT_FILE)
    all_df = pd.concat([train_df, holdout_df], ignore_index=True)

    has_created_at = 'created_at' in all_df.columns and all_df['created_at'].notna().any()
    print(f"\n  Total positions: {len(all_df)}")
    print(f"  created_at available: {has_created_at}")

    if has_created_at:
        all_df['created_at_dt'] = pd.to_datetime(all_df['created_at'], errors='coerce')
        all_df = all_df.dropna(subset=['created_at_dt']).sort_values('created_at_dt').reset_index(drop=True)
        print(f"  Date range: {all_df['created_at_dt'].min()} to {all_df['created_at_dt'].max()}")
        n_dates = all_df['created_at_dt'].dt.date.nunique()
        print(f"  Unique dates: {n_dates}")

        # ── TEMPORAL SPLIT: newest 25% of GAMES (not positions) as hold-out ──
        if 'game_id' in all_df.columns:
            game_dates = all_df.groupby('game_id')['created_at_dt'].min().sort_values()
            n_holdout_games = int(len(game_dates) * TEMPORAL_HOLDOUT_FRACTION)
            holdout_games = set(game_dates.tail(n_holdout_games).index)
            temporal_holdout = all_df[all_df['game_id'].isin(holdout_games)]
            temporal_train = all_df[~all_df['game_id'].isin(holdout_games)]
        else:
            n_holdout = int(len(all_df) * TEMPORAL_HOLDOUT_FRACTION)
            temporal_holdout = all_df.tail(n_holdout)
            temporal_train = all_df.head(len(all_df) - n_holdout)

        train_df = temporal_train
        holdout_df = temporal_holdout

        print(f"\n  TEMPORAL SPLIT (newest {TEMPORAL_HOLDOUT_FRACTION*100:.0f}% of games as hold-out):")
        print(f"  Train:      {len(train_df)} positions, {train_df['game_id'].nunique() if 'game_id' in train_df.columns else '?'} games")
        print(f"    Date range: {train_df['created_at_dt'].min()} to {train_df['created_at_dt'].max()}")
        print(f"  Hold-out:   {len(holdout_df)} positions, {holdout_df['game_id'].nunique() if 'game_id' in holdout_df.columns else '?'} games")
        print(f"    Date range: {holdout_df['created_at_dt'].min()} to {holdout_df['created_at_dt'].max()}")
    else:
        print(f"  WARNING: No created_at — falling back to v2 game-level split (NOT temporal)")

    # ── LEAKAGE CHECK ──
    if 'game_id' in train_df.columns and 'game_id' in holdout_df.columns:
        train_games = set(train_df['game_id'].dropna().unique())
        holdout_games = set(holdout_df['game_id'].dropna().unique())
        overlap = train_games & holdout_games
        print(f"\n  Leakage check: {len(overlap)} games in both sets (MUST be 0)")
        assert len(overlap) == 0, "DATA LEAKAGE DETECTED!"
        print(f"  ✓ No game-level leakage")

    # ── INTERNAL VALIDATION SPLIT (from training set, by game) ──
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

    # ── BUILD FEATURES ──
    train_groups, y_train, arch_enc, train_raw = build_features(train_split, fit=True)
    val_groups, y_val, _, val_raw = build_features(val_df, arch_encoder=arch_enc)
    holdout_groups, y_holdout, _, holdout_raw = build_features(holdout_df, arch_encoder=arch_enc)

    # ══════════════════════════════════════════════════════════════
    # SECTION 1: BASELINES (with isotonic calibration)
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  SECTION 1: BASELINES")
    print(f"{'='*70}")

    # ── SF (naive threshold) ──
    sf_pred = holdout_raw['sf_pred']
    sf_probs_raw = holdout_raw['sf_probs_raw']
    valid_sf = sf_pred >= 0

    # ── SF (calibrated LR) ──
    lr_sf = LogisticRegression(max_iter=2000, C=1.0)
    lr_sf.fit(train_groups['sf_eval + context'], y_train)
    lr_sf_probs = lr_sf.predict_proba(holdout_groups['sf_eval + context'])
    lr_sf_pred = lr_sf_probs.argmax(axis=1)

    # ── EP v8.07 (original, raw confidence) ──
    ep_pred = holdout_raw['ep_pred']
    ep_probs_raw = holdout_raw['ep_probs_raw']
    valid_ep = ep_pred >= 0

    # ── ISOTONIC CALIBRATION on EP, SF, fusion raw probs ──
    # Fit on the internal validation set (not hold-out), then apply to hold-out
    print(f"\n  Fitting isotonic calibration on validation set...")

    # EP isotonic
    ep_calibrator = calibrate_isotonic(y_val, val_raw['ep_probs_raw'])
    ep_probs_cal = ep_calibrator(holdout_raw['ep_probs_raw'])
    ep_pred_cal = ep_probs_cal.argmax(axis=1)

    # SF (naive) isotonic
    sf_naive_calibrator = calibrate_isotonic(y_val, val_raw['sf_probs_raw'])
    sf_probs_cal = sf_naive_calibrator(holdout_raw['sf_probs_raw'])
    sf_pred_cal = sf_probs_cal.argmax(axis=1)

    # SF (LR) isotonic — fit on val
    lr_sf_val_probs = lr_sf.predict_proba(val_groups['sf_eval + context'])
    lr_sf_calibrator = calibrate_isotonic(y_val, lr_sf_val_probs)
    lr_sf_probs_cal = lr_sf_calibrator(lr_sf_probs)
    lr_sf_pred_cal = lr_sf_probs_cal.argmax(axis=1)

    # Fusion isotonic
    fusion_pred = holdout_raw['fusion_pred']
    fusion_probs_raw = holdout_raw['fusion_probs_raw']
    valid_fusion = fusion_pred >= 0
    fusion_calibrator = calibrate_isotonic(y_val, val_raw['fusion_probs_raw'])
    fusion_probs_cal = fusion_calibrator(holdout_raw['fusion_probs_raw'])
    fusion_pred_cal = fusion_probs_cal.argmax(axis=1)

    # ══════════════════════════════════════════════════════════════
    # SECTION 2: LEARNED STACKER
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  SECTION 2: LEARNED STACKER (replaces hand-tuned fusion)")
    print(f"{'='*70}")

    stacker_group = 'stacker (all probs + context + archetype)'
    stacker_traj_group = 'stacker + trajectory'

    # ── LR Stacker ──
    print(f"\n  Training LR stacker...")
    lr_stacker = LogisticRegression(max_iter=2000, C=0.5)
    lr_stacker.fit(train_groups[stacker_group], y_train)
    lr_stacker_probs = lr_stacker.predict_proba(holdout_groups[stacker_group])
    lr_stacker_pred = lr_stacker_probs.argmax(axis=1)

    # LR stacker + trajectory
    lr_stacker_traj = LogisticRegression(max_iter=2000, C=0.5)
    lr_stacker_traj.fit(train_groups[stacker_traj_group], y_train)
    lr_stacker_traj_probs = lr_stacker_traj.predict_proba(holdout_groups[stacker_traj_group])
    lr_stacker_traj_pred = lr_stacker_traj_probs.argmax(axis=1)

    # ── LightGBM Stacker ──
    lgb_stacker_probs = None
    lgb_stacker_pred = None
    if HAS_LGB:
        print(f"  Training LightGBM stacker...")
        lgb_stacker = lgb.LGBMClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.05,
            num_leaves=31, min_child_samples=50, subsample=0.8,
            colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=0.1,
            random_state=SEED, verbose=-1
        )
        lgb_stacker.fit(train_groups[stacker_group], y_train,
                        eval_set=[(val_groups[stacker_group], y_val)],
                        callbacks=[lgb.early_stopping(20, verbose=False)])
        lgb_stacker_probs = lgb_stacker.predict_proba(holdout_groups[stacker_group])
        lgb_stacker_pred = lgb_stacker_probs.argmax(axis=1)

        # LGB + trajectory
        lgb_stacker_traj = lgb.LGBMClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.05,
            num_leaves=31, min_child_samples=50, subsample=0.8,
            colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=0.1,
            random_state=SEED, verbose=-1
        )
        lgb_stacker_traj.fit(train_groups[stacker_traj_group], y_train,
                             eval_set=[(val_groups[stacker_traj_group], y_val)],
                             callbacks=[lgb.early_stopping(20, verbose=False)])
        lgb_stacker_traj_probs = lgb_stacker_traj.predict_proba(holdout_groups[stacker_traj_group])
        lgb_stacker_traj_pred = lgb_stacker_traj_probs.argmax(axis=1)

    # ── Isotonic calibration on stackers ──
    print(f"  Calibrating stackers...")

    # LR stacker isotonic
    lr_stacker_val_probs = lr_stacker.predict_proba(val_groups[stacker_group])
    lr_stacker_calibrator = calibrate_isotonic(y_val, lr_stacker_val_probs)
    lr_stacker_probs_cal = lr_stacker_calibrator(lr_stacker_probs)
    lr_stacker_pred_cal = lr_stacker_probs_cal.argmax(axis=1)

    # LR stacker + traj isotonic
    lr_stacker_traj_val_probs = lr_stacker_traj.predict_proba(val_groups[stacker_traj_group])
    lr_stacker_traj_calibrator = calibrate_isotonic(y_val, lr_stacker_traj_val_probs)
    lr_stacker_traj_probs_cal = lr_stacker_traj_calibrator(lr_stacker_traj_probs)
    lr_stacker_traj_pred_cal = lr_stacker_traj_probs_cal.argmax(axis=1)

    lgb_stacker_probs_cal = None
    lgb_stacker_pred_cal = None
    if HAS_LGB:
        lgb_stacker_val_probs = lgb_stacker.predict_proba(val_groups[stacker_group])
        lgb_stacker_calibrator = calibrate_isotonic(y_val, lgb_stacker_val_probs)
        lgb_stacker_probs_cal = lgb_stacker_calibrator(lgb_stacker_probs)
        lgb_stacker_pred_cal = lgb_stacker_probs_cal.argmax(axis=1)

    # ══════════════════════════════════════════════════════════════
    # SECTION 3: RESULTS TABLE
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  HOLD-OUT BENCHMARK — TEMPORAL (n={len(holdout_df)})")
    print(f"{'='*70}")

    all_results = []

    # Baselines (raw)
    all_results.append(evaluate(y_holdout[valid_sf], sf_pred[valid_sf], sf_probs_raw[valid_sf], "SF (naive, raw)"))
    all_results.append(evaluate(y_holdout, lr_sf_pred, lr_sf_probs, "SF (calibrated LR, raw)"))
    all_results.append(evaluate(y_holdout[valid_ep], ep_pred[valid_ep], ep_probs_raw[valid_ep], "EP v8.07 (raw confidence)"))
    if valid_fusion.any():
        all_results.append(evaluate(y_holdout[valid_fusion], fusion_pred[valid_fusion], fusion_probs_raw[valid_fusion], "Fusion v3 (raw)"))

    # Baselines (isotonic calibrated)
    all_results.append(evaluate(y_holdout[valid_sf], sf_pred_cal[valid_sf], sf_probs_cal[valid_sf], "SF (naive, isotonic)"))
    all_results.append(evaluate(y_holdout, lr_sf_pred_cal, lr_sf_probs_cal, "SF (LR, isotonic)"))
    all_results.append(evaluate(y_holdout[valid_ep], ep_pred_cal[valid_ep], ep_probs_cal[valid_ep], "EP v8.07 (isotonic)"))
    if valid_fusion.any():
        all_results.append(evaluate(y_holdout[valid_fusion], fusion_pred_cal[valid_fusion], fusion_probs_cal[valid_fusion], "Fusion v3 (isotonic)"))

    # Stackers (raw)
    all_results.append(evaluate(y_holdout, lr_stacker_pred, lr_stacker_probs, "LR Stacker (raw)"))
    all_results.append(evaluate(y_holdout, lr_stacker_traj_pred, lr_stacker_traj_probs, "LR Stacker + traj (raw)"))
    if HAS_LGB:
        all_results.append(evaluate(y_holdout, lgb_stacker_pred, lgb_stacker_probs, "LGB Stacker (raw)"))
        all_results.append(evaluate(y_holdout, lgb_stacker_traj_pred, lgb_stacker_traj_probs, "LGB Stacker + traj (raw)"))

    # Stackers (isotonic calibrated)
    all_results.append(evaluate(y_holdout, lr_stacker_pred_cal, lr_stacker_probs_cal, "LR Stacker (isotonic)"))
    all_results.append(evaluate(y_holdout, lr_stacker_traj_pred_cal, lr_stacker_traj_probs_cal, "LR Stacker + traj (isotonic)"))
    if HAS_LGB and lgb_stacker_probs_cal is not None:
        all_results.append(evaluate(y_holdout, lgb_stacker_pred_cal, lgb_stacker_probs_cal, "LGB Stacker (isotonic)"))

    print(f"\n{'Model':<45} {'Acc':>7} {'Brier':>7} {'LogLoss':>8} {'ECE':>7}")
    print("-" * 80)
    for r in all_results:
        print(f"{r['name']:<45} {r['accuracy']*100:>6.1f}% {r['brier']:>7.4f} {r['log_loss']:>8.4f} {r['ece']:>7.4f}")

    # ══════════════════════════════════════════════════════════════
    # SECTION 4: BOOTSTRAP CIs FOR KEY MODELS
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  Bootstrap 95% Confidence Intervals (2000 resamples)")
    print(f"{'='*70}")

    key_preds = [
        ("SF (LR, isotonic)", lr_sf_pred_cal),
        ("EP v8.07 (isotonic)", ep_pred_cal),
        ("LR Stacker (isotonic)", lr_stacker_pred_cal),
        ("LR Stacker + traj (isotonic)", lr_stacker_traj_pred_cal),
    ]
    if HAS_LGB and lgb_stacker_pred_cal is not None:
        key_preds.append(("LGB Stacker (isotonic)", lgb_stacker_pred_cal))

    for name, pred in key_preds:
        v = pred >= 0
        acc = (pred[v] == y_holdout[v]).mean()
        lo, hi = bootstrap_ci(y_holdout[v], pred[v])
        print(f"  {name:<40} {acc*100:.2f}% [{lo*100:.2f}%, {hi*100:.2f}%]")

    # ── Pairwise deltas: Stacker vs SF, Stacker vs EP ──
    print(f"\n  Pairwise accuracy deltas (model A - model B):")
    print(f"  {'Comparison':<50} {'Δ':>7} {'95% CI':>20}")
    print("  " + "-" * 80)

    comparisons = [
        ("LR Stacker - SF(LR)", lr_stacker_pred_cal, lr_sf_pred_cal),
        ("LR Stacker - EP(isotonic)", lr_stacker_pred_cal, ep_pred_cal),
        ("LR Stacker+traj - LR Stacker", lr_stacker_traj_pred_cal, lr_stacker_pred_cal),
    ]
    if HAS_LGB and lgb_stacker_pred_cal is not None:
        comparisons.append(("LGB Stacker - LR Stacker", lgb_stacker_pred_cal, lr_stacker_pred_cal))
        comparisons.append(("LGB Stacker - SF(LR)", lgb_stacker_pred_cal, lr_sf_pred_cal))
        comparisons.append(("LGB Stacker - EP(isotonic)", lgb_stacker_pred_cal, ep_pred_cal))

    for name, pred_a, pred_b in comparisons:
        v = (pred_a >= 0) & (pred_b >= 0)
        mean_d, lo, hi = bootstrap_ci_delta(y_holdout[v], pred_a[v], pred_b[v])
        sig = "*" if (lo > 0 or hi < 0) else " "
        print(f"  {name:<50} {mean_d*100:>+6.2f}pp [{lo*100:>+6.2f}, {hi*100:>+6.2f}] {sig}")

    # ══════════════════════════════════════════════════════════════
    # SECTION 5: PER-ARCHETYPE REPORT
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  PER-ARCHETYPE REPORT (does EP's edge hold per archetype?)")
    print(f"{'='*70}")

    archetypes = holdout_df['hybrid_archetype'].fillna('unknown').astype(str)
    arch_counts = archetypes.value_counts()

    # Only report archetypes with enough samples
    min_n = 50
    significant_archs = arch_counts[arch_counts >= min_n].index.tolist()

    if significant_archs:
        print(f"\n  Archetypes with N >= {min_n} in hold-out:")
        print(f"  {'Archetype':<30} {'N':>6} {'EP acc':>8} {'SF acc':>8} {'Stacker':>8} {'Δ(EP-SF)':>9} {'95% CI':>20}")
        print("  " + "-" * 95)

        for arch in significant_archs:
            mask = (archetypes == arch).values
            n = mask.sum()
            y_arch = y_holdout[mask]

            ep_p = ep_pred_cal[mask]
            sf_p = lr_sf_pred_cal[mask]
            st_p = lr_stacker_pred_cal[mask]

            v_ep = ep_p >= 0
            v_sf = sf_p >= 0

            ep_acc = (ep_p[v_ep] == y_arch[v_ep]).mean() if v_ep.any() else 0
            sf_acc = (sf_p[v_sf] == y_arch[v_sf]).mean() if v_sf.any() else 0
            st_acc = (st_p == y_arch).mean()

            # Bootstrap delta CI for EP - SF (on positions where both are valid)
            v_both = v_ep & v_sf
            if v_both.sum() >= min_n:
                _, lo, hi = bootstrap_ci_delta(y_arch[v_both], ep_p[v_both], sf_p[v_both])
                ci_str = f"[{lo*100:>+6.1f}, {hi*100:>+6.1f}]"
            else:
                ci_str = "—"

            delta = (ep_acc - sf_acc) * 100
            if v_both.sum() >= min_n:
                sig = "*" if (lo > 0 or hi < 0) else " "
            else:
                sig = " "
            print(f"  {arch:<30} {n:>6} {ep_acc*100:>7.1f}% {sf_acc*100:>7.1f}% {st_acc*100:>7.1f}% {delta:>+8.1f}pp {ci_str:>20} {sig}")
    else:
        print(f"\n  No archetypes with N >= {min_n} in hold-out set")

    # ══════════════════════════════════════════════════════════════
    # SECTION 6: STRATIFIED BY EVAL ZONE
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  STRATIFIED BY EVAL ZONE (where is EP's edge?)")
    print(f"{'='*70}")
    zones = [(0, 25, "0-25cp"), (25, 50, "25-50cp"), (50, 100, "50-100cp"),
             (100, 200, "100-200cp"), (200, 9999, "200+cp")]
    print(f"  {'Zone':<12} {'N':>6} {'SF(LR)':>8} {'EP':>8} {'Stacker':>8} {'Δ(St-SF)':>9}")
    print("  " + "-" * 60)

    sf_eval_holdout = holdout_df['stockfish_eval'].fillna(0).values
    for lo_b, hi_b, name in zones:
        mask = (np.abs(sf_eval_holdout) >= lo_b) & (np.abs(sf_eval_holdout) < hi_b)
        if mask.sum() < 20:
            continue
        y_zone = y_holdout[mask]
        sf_acc = (lr_sf_pred_cal[mask] == y_zone).mean()
        ep_v = ep_pred_cal[mask] >= 0
        ep_acc = (ep_pred_cal[mask][ep_v] == y_zone[ep_v]).mean() if ep_v.any() else 0
        st_acc = (lr_stacker_pred_cal[mask] == y_zone).mean()
        delta = (st_acc - sf_acc) * 100
        print(f"  {name:<12} {mask.sum():>6} {sf_acc*100:>7.1f}% {ep_acc*100:>7.1f}% {st_acc*100:>7.1f}% {delta:>+8.1f}pp")

    # ══════════════════════════════════════════════════════════════
    # SECTION 7: CHESS960 ANALYSIS
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  CHESS960 ANALYSIS")
    print(f"{'='*70}")
    chess960_mask = (holdout_df['data_source'] == 'lichess_960').values if 'data_source' in holdout_df.columns else np.zeros(len(holdout_df), dtype=bool)
    if chess960_mask.sum() > 0:
        print(f"  Chess960 positions: {chess960_mask.sum()}")
        y_c960 = y_holdout[chess960_mask]

        sf_c960 = lr_sf_pred_cal[chess960_mask]
        sf_c960_acc = (sf_c960 == y_c960).mean()

        ep_c960 = ep_pred_cal[chess960_mask]
        ep_c960_acc = (ep_c960 == y_c960).mean()

        st_c960 = lr_stacker_pred_cal[chess960_mask]
        st_c960_acc = (st_c960 == y_c960).mean()

        print(f"  SF (LR, isotonic):  {sf_c960_acc*100:.1f}%")
        print(f"  EP (isotonic):      {ep_c960_acc*100:.1f}%")
        print(f"  LR Stacker:         {st_c960_acc*100:.1f}%")
    else:
        print("  No Chess960 positions in hold-out")

    # ══════════════════════════════════════════════════════════════
    # SECTION 8: CALIBRATION COMPARISON (ECE before/after isotonic)
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  CALIBRATION IMPACT (ECE before vs after isotonic)")
    print(f"{'='*70}")
    print(f"  {'Model':<35} {'ECE raw':>8} {'ECE isotonic':>13} {'Improvement':>12}")
    print("  " + "-" * 70)

    ep_ece_raw = evaluate(y_holdout[valid_ep], ep_pred[valid_ep], ep_probs_raw[valid_ep], "EP raw")['ece']
    ep_ece_cal = evaluate(y_holdout[valid_ep], ep_pred_cal[valid_ep], ep_probs_cal[valid_ep], "EP isotonic")['ece']
    print(f"  {'EP v8.07':<35} {ep_ece_raw:>8.4f} {ep_ece_cal:>13.4f} {(ep_ece_raw-ep_ece_cal)/ep_ece_raw*100:>11.1f}%")

    sf_ece_raw = evaluate(y_holdout[valid_sf], sf_pred[valid_sf], sf_probs_raw[valid_sf], "SF raw")['ece']
    sf_ece_cal = evaluate(y_holdout[valid_sf], sf_pred_cal[valid_sf], sf_probs_cal[valid_sf], "SF isotonic")['ece']
    print(f"  {'SF (naive)':<35} {sf_ece_raw:>8.4f} {sf_ece_cal:>13.4f} {(sf_ece_raw-sf_ece_cal)/sf_ece_raw*100:>11.1f}%")

    lr_sf_ece_raw = evaluate(y_holdout, lr_sf_pred, lr_sf_probs, "SF LR raw")['ece']
    lr_sf_ece_cal = evaluate(y_holdout, lr_sf_pred_cal, lr_sf_probs_cal, "SF LR isotonic")['ece']
    print(f"  {'SF (LR)':<35} {lr_sf_ece_raw:>8.4f} {lr_sf_ece_cal:>13.4f} {(lr_sf_ece_raw-lr_sf_ece_cal)/lr_sf_ece_raw*100:>11.1f}%")

    st_ece_raw = evaluate(y_holdout, lr_stacker_pred, lr_stacker_probs, "Stacker raw")['ece']
    st_ece_cal = evaluate(y_holdout, lr_stacker_pred_cal, lr_stacker_probs_cal, "Stacker isotonic")['ece']
    print(f"  {'LR Stacker':<35} {st_ece_raw:>8.4f} {st_ece_cal:>13.4f} {(st_ece_raw-st_ece_cal)/st_ece_raw*100:>11.1f}%")

    # ══════════════════════════════════════════════════════════════
    # SECTION 9: SUMMARY
    # ══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")

    best_acc = max(all_results, key=lambda r: r['accuracy'])
    best_brier = min(all_results, key=lambda r: r['brier'])
    best_ece = min(all_results, key=lambda r: r['ece'])

    print(f"\n  Best accuracy:  {best_acc['name']:<40} {best_acc['accuracy']*100:.2f}%")
    print(f"  Best Brier:     {best_brier['name']:<40} {best_brier['brier']:.4f}")
    print(f"  Best ECE:       {best_ece['name']:<40} {best_ece['ece']:.4f}")

    # Stacker vs SF delta
    v = (lr_stacker_pred_cal >= 0) & (lr_sf_pred_cal >= 0)
    mean_d, lo, hi = bootstrap_ci_delta(y_holdout[v], lr_stacker_pred_cal[v], lr_sf_pred_cal[v])
    sig = "SIGNIFICANT" if (lo > 0 or hi < 0) else "not significant"
    print(f"\n  LR Stacker vs SF (LR, isotonic):  Δ = {mean_d*100:+.2f}pp  [{lo*100:+.2f}, {hi*100:+.2f}]  {sig}")

    v = (lr_stacker_pred_cal >= 0) & (ep_pred_cal >= 0)
    mean_d, lo, hi = bootstrap_ci_delta(y_holdout[v], lr_stacker_pred_cal[v], ep_pred_cal[v])
    sig = "SIGNIFICANT" if (lo > 0 or hi < 0) else "not significant"
    print(f"  LR Stacker vs EP (isotonic):      Δ = {mean_d*100:+.2f}pp  [{lo*100:+.2f}, {hi*100:+.2f}]  {sig}")

    if HAS_LGB and lgb_stacker_pred_cal is not None:
        v = (lgb_stacker_pred_cal >= 0) & (lr_sf_pred_cal >= 0)
        mean_d, lo, hi = bootstrap_ci_delta(y_holdout[v], lgb_stacker_pred_cal[v], lr_sf_pred_cal[v])
        sig = "SIGNIFICANT" if (lo > 0 or hi < 0) else "not significant"
        print(f"  LGB Stacker vs SF (LR, isotonic): Δ = {mean_d*100:+.2f}pp  [{lo*100:+.2f}, {hi*100:+.2f}]  {sig}")

    print(f"\n  Note: This is a TEMPORAL holdout (train on older, test on newer).")
    print(f"  If the stacker beats SF here, the edge is real — not era-fitting.")

    print(f"\n{'='*70}")
    print(f"  Done.")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
