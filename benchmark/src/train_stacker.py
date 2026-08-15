"""
En Pensent — Stacker Training & Export
============================================================================

Trains a logistic regression stacker on the sub-predictor outputs
(baseline, enhanced, SF) + context + archetype + trajectory features,
then exports the model as JSON for inference in the Node.js farm worker.

The stacker REPLACES the hardcoded fusion weights (0.25/0.45/0.30) in
the chess-db-ingest-worker. It is trained on temporal holdout data and
exported as:
  - stacker_model.json: LR coefficients + intercept + scaler params
  - stacker_calibration.json: isotonic regression breakpoints per class
  - stacker_archetypes.json: archetype label encoder classes

Usage:
  python benchmark/src/train_stacker.py

Output:
  farm/models/stacker/stacker_model.json
  farm/models/stacker/stacker_calibration.json
  farm/models/stacker/stacker_archetypes.json
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss

# ─────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data"
MODELS_DIR = Path(__file__).parent.parent.parent / "farm" / "models" / "stacker"

train_files = sorted(DATA_DIR.glob("training_set_v2_*.csv"))
holdout_files = sorted(DATA_DIR.glob("holdout_set_v2_*.csv"))
if not train_files:
    train_files = sorted(DATA_DIR.glob("training_set_*.csv"))
    holdout_files = sorted(DATA_DIR.glob("holdout_set_*.csv"))

TRAIN_FILE = train_files[-1]
HOLDOUT_FILE = holdout_files[-1]

SEED = 42
TEMPORAL_HOLDOUT_FRACTION = 0.25

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
PRED_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2, "1-0": 0, "0-1": 1, "1/2-1/2": 2}

# ─────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────

def normalize_pred(p):
    if pd.isna(p): return -1
    return PRED_MAP.get(str(p).strip().lower(), -1)

def softmax_probs(pred, confidence):
    probs = np.zeros((len(pred), 3))
    for i in range(len(pred)):
        p = confidence[i]
        cls = pred[i] if pred[i] >= 0 else 0
        probs[i, cls] = p
        rem = (1 - p) / 2
        for j in range(3):
            if j != cls: probs[i, j] = rem
    return probs

# ─────────────────────────────────────────────────────
# FEATURE BUILDER
# ─────────────────────────────────────────────────────

# Feature column order — MUST match the JS inference implementation
FEATURE_NAMES = [
    # SF eval features (3)
    'sf_eval', 'sf_eval_abs', 'sf_eval_sq',
    # Context features (5)
    'move_num', 'move_num_sq', 'white_elo', 'black_elo', 'elo_diff',
    # Baseline (EP 4-quadrant) probability vector (3)
    'baseline_prob_w', 'baseline_prob_b', 'baseline_prob_d',
    # Enhanced (32-piece) probability vector (3)
    'enhanced_prob_w', 'enhanced_prob_b', 'enhanced_prob_d',
    # SF probability vector (3)
    'sf_prob_w', 'sf_prob_b', 'sf_prob_d',
    # Confidence scalars (3)
    'baseline_conf', 'enhanced_conf', 'sf_conf',
    # Enhanced signals (3)
    'enh_conf_32', 'color_richness', 'complexity',
    # Trajectory features (10)
    'q_kingside_white', 'q_kingside_black', 'q_queenside_white',
    'q_queenside_black', 'q_center',
    'tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility',
    'cf_intensity',
    # Archetype onehot (variable length, appended after fixed features)
]

CF_COLS = ['q_kingside_white', 'q_kingside_black', 'q_queenside_white',
           'q_queenside_black', 'q_center',
           'tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility',
           'cf_intensity']

def build_stacker_features(df, arch_encoder=None, fit=False):
    """Build the stacker feature matrix from sub-predictor outputs."""
    df = df.copy()

    # Normalize predictions
    baseline_pred = df['baseline_prediction'].apply(normalize_pred).values if 'baseline_prediction' in df.columns else np.full(len(df), -1)
    enhanced_pred = df['enhanced_prediction'].apply(normalize_pred).values if 'enhanced_prediction' in df.columns else np.full(len(df), -1)
    sf_pred = df['stockfish_prediction'].apply(normalize_pred).values
    result = df['result_numeric'].astype(int).values

    # Confidences — NOTE: scales differ between columns!
    # hybrid_confidence: 0-100 integer (mean ~61) → divide by 100
    # enhanced_confidence: 0-1 float (mean ~0.41) → use as-is
    # stockfish_confidence: 0-100 integer (mean ~75) → divide by 100
    baseline_conf = np.where(baseline_pred >= 0, 0.5, 0.5)  # fallback
    if 'hybrid_confidence' in df.columns:
        # Use hybrid_confidence as proxy for baseline if baseline_conf not available
        baseline_conf = (df['hybrid_confidence'].fillna(50) / 100.0).values

    enhanced_conf = df['enhanced_confidence'].fillna(0.5).values if 'enhanced_confidence' in df.columns else np.full(len(df), 0.5)
    sf_conf = (df['stockfish_confidence'].fillna(50) / 100.0).values

    # SF eval
    sf_eval = df['stockfish_eval'].fillna(0).clip(-1000, 1000).values.astype(float)

    # Context
    move_num = df['move_number'].fillna(25).values.astype(float)
    white_elo = df['white_elo'].fillna(1500).values.astype(float)
    black_elo = df['black_elo'].fillna(1500).values.astype(float)

    # Probability vectors
    baseline_probs = softmax_probs(baseline_pred, baseline_conf)
    enhanced_probs = softmax_probs(enhanced_pred, enhanced_conf)
    sf_probs = softmax_probs(sf_pred, sf_conf)

    # Enhanced signals
    color_richness = df['color_richness'].fillna(0).values.astype(float) if 'color_richness' in df.columns else np.zeros(len(df))
    complexity = df['complexity_score'].fillna(0).values.astype(float) if 'complexity_score' in df.columns else np.zeros(len(df))

    # Trajectory features
    cf_features = df[CF_COLS].fillna(0).values.astype(float) if all(c in df.columns for c in CF_COLS) else np.zeros((len(df), len(CF_COLS)))

    # Fixed features (30)
    fixed = np.column_stack([
        sf_eval, np.abs(sf_eval), sf_eval ** 2,
        move_num, move_num ** 2, white_elo, black_elo, (white_elo - black_elo),
        baseline_probs, enhanced_probs, sf_probs,
        baseline_conf, enhanced_conf, sf_conf,
        enhanced_conf, color_richness, complexity,
        cf_features,
    ])

    # Archetype onehot
    archetype = df['hybrid_archetype'].fillna('unknown').astype(str)
    if fit:
        arch_encoder = LabelEncoder()
        arch_encoded = arch_encoder.fit_transform(archetype)
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

    X = np.column_stack([fixed, arch_onehot])
    return X, result, arch_encoder

# ─────────────────────────────────────────────────────
# ISOTONIC CALIBRATION EXPORT
# ─────────────────────────────────────────────────────

def fit_isotonic(y_true, probs, n_classes=3):
    """Fit per-class isotonic regression. Return serializable breakpoints."""
    calibrators = []
    for c in range(n_classes):
        y_binary = (y_true == c).astype(int)
        ir = IsotonicRegression(out_of_bounds='clip', y_min=0.01, y_max=0.99)
        ir.fit(probs[:, c], y_binary)
        calibrators.append(ir)

    return calibrators

def export_isotonic(calibrators):
    """Export isotonic regression as JSON-serializable breakpoints."""
    exported = []
    for ir in calibrators:
        exported.append({
            'X_min': float(ir.X_min_),
            'X_max': float(ir.X_max_),
            'x_thresholds': ir.X_thresholds_.tolist(),
            'y_thresholds': ir.y_thresholds_.tolist(),
        })
    return exported

def apply_isotonic(probs, calibrators_exported):
    """Apply isotonic calibration (used for validation, mirrors JS implementation)."""
    calibrated = np.zeros_like(probs)
    for c in range(3):
        cal = calibrators_exported[c]
        x_thresh = np.array(cal['x_thresholds'])
        y_thresh = np.array(cal['y_thresholds'])
        # Piecewise constant interpolation
        calibrated[:, c] = np.interp(probs[:, c], x_thresh, y_thresh)
    # Renormalize
    row_sums = calibrated.sum(axis=1, keepdims=True)
    row_sums = np.where(row_sums > 0, row_sums, 1.0)
    calibrated /= row_sums
    return calibrated

# ─────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────

def main():
    np.random.seed(SEED)

    print(f"\n{'='*70}")
    print(f"  En Pensent — Stacker Training & Export")
    print(f"{'='*70}")
    print(f"  Training file: {TRAIN_FILE}")
    print(f"  Hold-out file: {HOLDOUT_FILE}")
    print(f"  Output dir: {MODELS_DIR}")

    # ── LOAD AND MERGE ──
    train_df = pd.read_csv(TRAIN_FILE, low_memory=False)
    holdout_df = pd.read_csv(HOLDOUT_FILE, low_memory=False)
    all_df = pd.concat([train_df, holdout_df], ignore_index=True)

    print(f"  Total positions: {len(all_df)}")

    # ── TEMPORAL SPLIT ──
    has_created_at = 'created_at' in all_df.columns and all_df['created_at'].notna().any()
    if has_created_at:
        all_df['created_at_dt'] = pd.to_datetime(all_df['created_at'], errors='coerce')
        all_df = all_df.dropna(subset=['created_at_dt']).sort_values('created_at_dt').reset_index(drop=True)

        if 'game_id' in all_df.columns:
            game_dates = all_df.groupby('game_id')['created_at_dt'].min().sort_values()
            n_holdout_games = int(len(game_dates) * TEMPORAL_HOLDOUT_FRACTION)
            holdout_games = set(game_dates.tail(n_holdout_games).index)
            holdout_df = all_df[all_df['game_id'].isin(holdout_games)]
            train_df = all_df[~all_df['game_id'].isin(holdout_games)]
        else:
            n_holdout = int(len(all_df) * TEMPORAL_HOLDOUT_FRACTION)
            holdout_df = all_df.tail(n_holdout)
            train_df = all_df.head(len(all_df) - n_holdout)

        print(f"  Temporal split:")
        print(f"    Train:    {len(train_df)} positions ({train_df['created_at_dt'].min()} to {train_df['created_at_dt'].max()})")
        print(f"    Hold-out: {len(holdout_df)} positions ({holdout_df['created_at_dt'].min()} to {holdout_df['created_at_dt'].max()})")
    else:
        print(f"  WARNING: No created_at — using v2 split as-is")

    # ── INTERNAL VALIDATION SPLIT ──
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
    X_train, y_train, arch_enc = build_stacker_features(train_split, fit=True)
    X_val, y_val, _ = build_stacker_features(val_df, arch_encoder=arch_enc)
    X_holdout, y_holdout, _ = build_stacker_features(holdout_df, arch_encoder=arch_enc)

    n_fixed = 30  # fixed features before archetype onehot
    n_arch = len(arch_enc.classes_)
    print(f"  Features: {n_fixed} fixed + {n_arch} archetype onehot = {X_train.shape[1]} total")
    print(f"  Archetypes: {list(arch_enc.classes_)}")

    # ── SCALE FEATURES ──
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_holdout_s = scaler.transform(X_holdout)

    # ── TRAIN LR STACKER ──
    print(f"\n  Training logistic regression stacker...")
    lr = LogisticRegression(max_iter=5000, C=0.5, solver='lbfgs')
    lr.fit(X_train_s, y_train)

    # ── EVALUATE (raw) ──
    train_pred = lr.predict(X_train_s)
    val_pred = lr.predict(X_val_s)
    holdout_pred = lr.predict(X_holdout_s)
    holdout_probs = lr.predict_proba(X_holdout_s)

    train_acc = accuracy_score(y_train, train_pred)
    val_acc = accuracy_score(y_val, val_pred)
    holdout_acc = accuracy_score(y_holdout, holdout_pred)

    print(f"  Train accuracy:      {train_acc*100:.2f}%")
    print(f"  Validation accuracy: {val_acc*100:.2f}%")
    print(f"  Hold-out accuracy:   {holdout_acc*100:.2f}%")

    # ── ISOTONIC CALIBRATION ──
    print(f"\n  Fitting isotonic calibration on validation set...")
    val_probs = lr.predict_proba(X_val_s)
    calibrators = fit_isotonic(y_val, val_probs)
    cal_exported = export_isotonic(calibrators)

    # Apply calibration to holdout
    holdout_probs_cal = apply_isotonic(holdout_probs, cal_exported)
    holdout_pred_cal = holdout_probs_cal.argmax(axis=1)
    holdout_acc_cal = accuracy_score(y_holdout, holdout_pred_cal)

    # Brier and ECE
    y_onehot = np.zeros((len(y_holdout), 3))
    for i, y in enumerate(y_holdout): y_onehot[i, y] = 1.0
    brier_raw = np.mean(np.sum((holdout_probs - y_onehot) ** 2, axis=1))
    brier_cal = np.mean(np.sum((holdout_probs_cal - y_onehot) ** 2, axis=1))
    ll_raw = log_loss(y_holdout, holdout_probs, labels=[0, 1, 2])
    ll_cal = log_loss(y_holdout, holdout_probs_cal, labels=[0, 1, 2])

    # ECE
    def compute_ece(y_true, probs):
        confidences = probs.max(axis=1)
        predictions = probs.argmax(axis=1)
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
        return ece

    ece_raw = compute_ece(y_holdout, holdout_probs)
    ece_cal = compute_ece(y_holdout, holdout_probs_cal)

    print(f"\n  Hold-out metrics (raw → isotonic):")
    print(f"    Accuracy: {holdout_acc*100:.2f}% → {holdout_acc_cal*100:.2f}%")
    print(f"    Brier:    {brier_raw:.4f} → {brier_cal:.4f}")
    print(f"    LogLoss:  {ll_raw:.4f} → {ll_cal:.4f}")
    print(f"    ECE:      {ece_raw:.4f} → {ece_cal:.4f}")

    # ── EXPORT MODEL AS JSON ──
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Export LR model
    model_json = {
        'version': '1.0',
        'trained_at': datetime.now().isoformat(),
        'model_type': 'logistic_regression',
        'n_classes': 3,
        'classes': ['white_wins', 'black_wins', 'draw'],
        'n_features': int(X_train.shape[1]),
        'n_fixed_features': n_fixed,
        'feature_names': FEATURE_NAMES + [f'arch_{a}' for a in arch_enc.classes_],
        'coefficients': lr.coef_.tolist(),
        'intercepts': lr.intercept_.tolist(),
        # Scaler params for standardization
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        # Metadata
        'train_accuracy': float(train_acc),
        'val_accuracy': float(val_acc),
        'holdout_accuracy': float(holdout_acc),
        'holdout_accuracy_calibrated': float(holdout_acc_cal),
        'holdout_brier_calibrated': float(brier_cal),
        'holdout_ece_calibrated': float(ece_cal),
        'train_size': int(len(y_train)),
        'holdout_size': int(len(y_holdout)),
    }

    model_path = MODELS_DIR / "stacker_model.json"
    with open(model_path, 'w') as f:
        json.dump(model_json, f, indent=2)
    print(f"\n  ✓ Exported model: {model_path}")

    # Export calibration
    cal_path = MODELS_DIR / "stacker_calibration.json"
    with open(cal_path, 'w') as f:
        json.dump({
            'version': '1.0',
            'calibrators': cal_exported,
        }, f, indent=2)
    print(f"  ✓ Exported calibration: {cal_path}")

    # Export archetype encoder
    arch_path = MODELS_DIR / "stacker_archetypes.json"
    with open(arch_path, 'w') as f:
        json.dump({
            'version': '1.0',
            'classes': arch_enc.classes_.tolist(),
        }, f, indent=2)
    print(f"  ✓ Exported archetypes: {arch_path}")

    # ── SUMMARY ──
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")
    print(f"  Stacker trained on {len(y_train)} positions, tested on {len(y_holdout)} (temporal holdout)")
    print(f"  Hold-out accuracy: {holdout_acc_cal*100:.2f}% (calibrated)")
    print(f"  Hold-out Brier:    {brier_cal:.4f}")
    print(f"  Hold-out ECE:      {ece_cal:.4f}")
    print(f"\n  Model artifacts in {MODELS_DIR}/")
    print(f"  - stacker_model.json ({os.path.getsize(model_path)} bytes)")
    print(f"  - stacker_calibration.json ({os.path.getsize(cal_path)} bytes)")
    print(f"  - stacker_archetypes.json ({os.path.getsize(arch_path)} bytes)")
    print(f"\n  Next: wire stacker-loader.mjs into chess-db-ingest-worker.mjs")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
