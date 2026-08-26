#!/usr/bin/env python3
"""
En Pensent — Market Baseline Experiment
========================================

Trains a gradient-boosted model (LightGBM/XGBoost) on the same market prediction
data that EP's market worker produces, to establish a proper baseline beyond the
naive momentum heuristic currently used as `baseline_correct`.

The current "baseline" in the DB is a simple momentum direction heuristic —
barely above random (38.5% on a 3-class task where random = 33%). This script
trains a real model on the same features EP uses:

  - market_conditions (momentum, volatility, deviation, dailyChange, etc.)
  - vix (level, change, current)
  - vera_rubin (score, short_pressure, dark_force_direction)
  - chess_bridge (accuracy, regime, volatility)
  - price, volume, target_move, time_horizon, symbol

Models:
  A: LightGBM on all features (primary learned baseline)
  B: Logistic regression on same features (linear baseline)
  C: EP's existing predictions (system under test — no training)
  D: The naive momentum baseline (current `baseline_correct` in DB)

Usage:
  python benchmark/src/market_baseline.py --output benchmark/results/market_baseline_results.json
"""

import argparse
import json
import os
import sys
import time
import random
import numpy as np
import pandas as pd
from collections import Counter
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss
from sklearn.preprocessing import StandardScaler, LabelEncoder
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
load_dotenv()

# Reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_market_predictions():
    """Load all resolved market predictions with metadata from Postgres."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'], sslmode='require')
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print("Loading market predictions from Postgres...")
    query = """
        SELECT
            id, symbol, time_horizon, predicted_direction, confidence, archetype,
            target_move, price_at_prediction, volume_at_prediction,
            baseline_direction, baseline_confidence,
            actual_direction, actual_move,
            ep_correct, baseline_correct,
            candle_count,
            prediction_metadata,
            created_at,
            EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as hours_to_resolve
        FROM market_prediction_attempts
        WHERE ep_correct IS NOT NULL
          AND price_at_prediction IS NOT NULL
          AND prediction_metadata IS NOT NULL
          AND actual_direction IS NOT NULL
        ORDER BY created_at
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    print(f"  Loaded {len(rows)} resolved predictions")
    return rows


def extract_features(rows):
    """Extract features from raw rows + prediction_metadata JSON."""
    features = []
    labels = []
    ep_preds = []
    ep_correct = []
    bl_correct = []
    symbols = []
    horizons = []
    timestamps = []

    for row in rows:
        meta = row['prediction_metadata'] or {}
        mc = meta.get('market_conditions', {}) or {}
        vix = meta.get('vix', {}) or {}
        vr = meta.get('vera_rubin', {}) or {}
        cb = meta.get('chess_bridge', {}) or {}
        temporal = meta.get('temporal', {}) or {}

        # Numeric features
        f = {
            'price': float(row['price_at_prediction'] or 0),
            'volume': float(row['volume_at_prediction'] or 0),
            'target_move': float(row['target_move'] or 0),
            'confidence': float(row['confidence'] or 0),
            'baseline_confidence': float(row['baseline_confidence'] or 0),
            'candle_count': float(row['candle_count'] or 0),
            'hours_to_resolve': float(row['hours_to_resolve'] or 0),
            # market_conditions
            'mc_momentum': float(mc.get('momentum', 0)),
            'mc_deviation': float(mc.get('deviation', 0)),
            'mc_volatility': float(mc.get('volatility', 0)),
            'mc_daily_change': float(mc.get('dailyChange', 0)),
            'mc_total_visits': float(mc.get('totalVisits', 0)),
            'mc_grid_intensity': float(mc.get('gridIntensity', 0)),
            'mc_historical_trend': float(mc.get('historicalTrend', 0)),
            'mc_market_correlation': float(mc.get('marketCorrelation', 0)),
            # vix
            'vix_current': float(vix.get('current', 0)),
            'vix_change': float(vix.get('change', 0)),
            # vera_rubin
            'vr_score': float(vr.get('score', 0)),
            'vr_short_pressure': float(vr.get('short_pressure', 0)),
            # chess_bridge
            'cb_accuracy': float(cb.get('accuracy', 0)),
            # temporal
            'day_of_week': float(temporal.get('day_num', 0) or 0),
            'month_num': float(temporal.get('month_num', 0) or 0),
            'week_of_year': float(temporal.get('week_of_year', 0) or 0),
        }

        # Categorical features (encode as numeric)
        symbol_map = {'CL=F': 0, 'NG=F': 1, 'SI=F': 2, 'HG=F': 3, 'GC=F': 4,
                      'PL=F': 5, 'PA=F': 6, 'AMD': 7, 'AMZN': 8, 'MSFT': 9,
                      'NVDA': 10, 'META': 11, 'QQQ': 12, 'SPY': 13, 'GOOGL': 14,
                      'SLV': 15, 'GLD': 16, 'USO': 17, 'AAPL': 18, 'IWM': 19}
        horizon_map = {'5m': 0, '30m': 1, '1h': 2, '2h': 3, '4h': 4, '8h': 5, '1d': 6}
        vix_level_map = {'greed': 0, 'neutral': 1, 'fear': 2, 'extreme_fear': 3, 'extreme_greed': 4}
        vr_direction_map = {'bullish': 0, 'bearish': 1, 'neutral': 2}

        f['symbol_id'] = float(symbol_map.get(row['symbol'], 99))
        f['horizon_id'] = float(horizon_map.get(row['time_horizon'], 99))
        f['vix_level_id'] = float(vix_level_map.get(vix.get('level', ''), 99))
        f['vr_direction_id'] = float(vr_direction_map.get(vr.get('dark_force_direction', ''), 99))

        # Grid direction
        grid_dir = mc.get('gridDirection', 'neutral')
        f['grid_direction_id'] = float({'positive': 0, 'negative': 1, 'neutral': 2}.get(grid_dir, 2))

        features.append(f)
        labels.append(row['actual_direction'])
        ep_preds.append(row['predicted_direction'])
        ep_correct.append(bool(row['ep_correct']))
        bl_correct.append(bool(row['baseline_correct']) if row['baseline_correct'] is not None else False)
        symbols.append(row['symbol'])
        horizons.append(row['time_horizon'])
        timestamps.append(row['created_at'])

    df = pd.DataFrame(features)
    df['actual_direction'] = labels
    df['ep_pred'] = ep_preds
    df['ep_correct'] = ep_correct
    df['baseline_correct'] = bl_correct
    df['symbol'] = symbols
    df['time_horizon'] = horizons
    df['created_at'] = timestamps

    return df


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Market Baseline Experiment')
    parser.add_argument('--output', default='benchmark/results/market_baseline_results.json',
                        help='Output JSON path')
    args = parser.parse_args()

    print(f"\n{'='*70}")
    print(f"  En Pensent — Market Baseline Experiment")
    print(f"{'='*70}")

    # Load data
    rows = load_market_predictions()

    # Extract features
    print(f"\nExtracting features from prediction_metadata...")
    df = extract_features(rows)
    print(f"  Feature matrix: {df.shape[0]} rows, {df.shape[1]} columns")

    # Normalize labels to 3-class: bullish, bearish, neutral
    # The DB has mixed vocabularies: up/down/flat/neutral AND bullish/bearish/neutral
    DIRECTION_MAP = {
        'up': 'bullish', 'bullish': 'bullish',
        'down': 'bearish', 'bearish': 'bearish',
        'flat': 'neutral', 'neutral': 'neutral',
    }
    df['actual_direction'] = df['actual_direction'].map(DIRECTION_MAP).fillna('neutral')
    df['ep_pred'] = df['ep_pred'].map(DIRECTION_MAP).fillna('neutral')

    # Encode labels (3-class: bullish=0, bearish=1, neutral=2)
    le = LabelEncoder()
    le.fit(['bullish', 'bearish', 'neutral'])
    y = le.transform(df['actual_direction'])
    print(f"  Label distribution: {dict(Counter(y))}")
    print(f"  Classes: {list(le.classes_)}")

    # Feature columns (exclude labels, predictions, metadata)
    exclude_cols = ['actual_direction', 'ep_pred', 'ep_correct', 'baseline_correct',
                    'symbol', 'time_horizon', 'created_at']
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    X = df[feature_cols].values
    print(f"  Features ({len(feature_cols)}): {feature_cols}")

    # Time-based split: first 80% by time for train, next 10% val, last 10% test
    # This avoids look-ahead bias (no future data in training)
    n = len(df)
    train_end = int(n * 0.8)
    val_end = int(n * 0.9)

    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]

    df_train = df.iloc[:train_end]
    df_val = df.iloc[train_end:val_end]
    df_test = df.iloc[val_end:]

    print(f"\n  Time-based split:")
    print(f"    Train: {len(X_train)} ({df_train['created_at'].min()} → {df_train['created_at'].max()})")
    print(f"    Val:   {len(X_val)} ({df_val['created_at'].min()} → {df_val['created_at'].max()})")
    print(f"    Test:  {len(X_test)} ({df_test['created_at'].min()} → {df_test['created_at'].max()})")

    # ─── Model A: LightGBM ─────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  Model A: LightGBM (Gradient-Boosted Trees)")
    print(f"{'='*70}")

    try:
        import lightgbm as lgb
        has_lgb = True
    except ImportError:
        has_lgb = False
        print("  LightGBM not available — using XGBoost fallback")

    if has_lgb:
        train_data = lgb.Dataset(X_train, label=y_train, feature_name=feature_cols)
        val_data = lgb.Dataset(X_val, label=y_val, feature_name=feature_cols, reference=train_data)

        params = {
            'objective': 'multiclass',
            'num_class': 3,
            'metric': 'multi_logloss',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'seed': SEED,
            'num_threads': 4,
        }

        model_a = lgb.train(
            params, train_data, num_boost_round=500,
            valid_sets=[val_data],
            callbacks=[lgb.early_stopping(20), lgb.log_evaluation(50)]
        )

        # Predictions
        probs_a = model_a.predict(X_test)
        preds_a = probs_a.argmax(axis=1)
        acc_a = accuracy_score(y_test, preds_a)
        ll_a = log_loss(y_test, probs_a, labels=[0, 1, 2])
        brier_a = np.mean(np.sum((probs_a - np.eye(3)[y_test]) ** 2, axis=1))

        # Feature importance
        importance = dict(zip(feature_cols, model_a.feature_importance().tolist()))
        importance = dict(sorted(importance.items(), key=lambda x: -x[1])[:10])

        print(f"\n  Model A (Test): accuracy={acc_a*100:.2f}%, log_loss={ll_a:.4f}, brier={brier_a:.4f}")
        print(f"  Top features: {importance}")

    else:
        from sklearn.ensemble import GradientBoostingClassifier
        model_a = GradientBoostingClassifier(n_estimators=200, max_depth=5, learning_rate=0.05, random_state=SEED)
        model_a.fit(X_train, y_train)
        probs_a = model_a.predict_proba(X_test)
        preds_a = probs_a.argmax(axis=1)
        acc_a = accuracy_score(y_test, preds_a)
        ll_a = log_loss(y_test, probs_a, labels=[0, 1, 2])
        brier_a = np.mean(np.sum((probs_a - np.eye(3)[y_test]) ** 2, axis=1))
        importance = dict(zip(feature_cols, model_a.feature_importances_.tolist()))
        importance = dict(sorted(importance.items(), key=lambda x: -x[1])[:10])
        print(f"\n  Model A (Test): accuracy={acc_a*100:.2f}%, log_loss={ll_a:.4f}, brier={brier_a:.4f}")
        print(f"  Top features: {importance}")

    # ─── Model B: Logistic Regression ──────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  Model B: Logistic Regression (scaled)")
    print(f"{'='*70}")

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    model_b = LogisticRegression(max_iter=1000, C=1.0, random_state=SEED)
    model_b.fit(X_train_s, y_train)
    probs_b = model_b.predict_proba(X_test_s)
    preds_b = probs_b.argmax(axis=1)
    acc_b = accuracy_score(y_test, preds_b)
    ll_b = log_loss(y_test, probs_b, labels=[0, 1, 2])
    brier_b = np.mean(np.sum((probs_b - np.eye(3)[y_test]) ** 2, axis=1))
    print(f"  Model B (Test): accuracy={acc_b*100:.2f}%, log_loss={ll_b:.4f}, brier={brier_b:.4f}")

    # ─── Model C: EP's existing predictions ────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  Model C: EP Market Predictions (system under test)")
    print(f"{'='*70}")

    ep_correct_test = df_test['ep_correct'].values
    acc_c = ep_correct_test.mean() * 100
    print(f"  Model C (Test): accuracy={acc_c:.2f}%")

    # ─── Model D: Naive momentum baseline ──────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  Model D: Naive Momentum Baseline (current DB baseline)")
    print(f"{'='*70}")

    bl_correct_test = df_test['baseline_correct'].values
    acc_d = bl_correct_test.mean() * 100
    print(f"  Model D (Test): accuracy={acc_d:.2f}%")

    # ─── Stratified Evaluation ─────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  STRATIFIED EVALUATION (Test Set)")
    print(f"{'='*70}")

    # By symbol
    print(f"\n  --- By Symbol ---")
    print(f"  {'Symbol':<10} {'N':>6} {'A(LGBM)%':>9} {'B(LogReg)%':>10} {'C(EP)%':>7} {'D(Naive)%':>9}")
    for sym in df_test['symbol'].unique():
        mask = df_test['symbol'].values == sym
        if mask.sum() < 10:
            continue
        a_acc = (preds_a[mask] == y_test[mask]).mean() * 100
        b_acc = (preds_b[mask] == y_test[mask]).mean() * 100
        c_acc = ep_correct_test[mask].mean() * 100
        d_acc = bl_correct_test[mask].mean() * 100
        print(f"  {sym:<10} {mask.sum():>6} {a_acc:>8.1f}% {b_acc:>9.1f}% {c_acc:>6.1f}% {d_acc:>8.1f}%")

    # By time horizon
    print(f"\n  --- By Time Horizon ---")
    print(f"  {'Horizon':<10} {'N':>6} {'A(LGBM)%':>9} {'B(LogReg)%':>10} {'C(EP)%':>7} {'D(Naive)%':>9}")
    for hor in df_test['time_horizon'].unique():
        mask = df_test['time_horizon'].values == hor
        if mask.sum() < 10:
            continue
        a_acc = (preds_a[mask] == y_test[mask]).mean() * 100
        b_acc = (preds_b[mask] == y_test[mask]).mean() * 100
        c_acc = ep_correct_test[mask].mean() * 100
        d_acc = bl_correct_test[mask].mean() * 100
        print(f"  {hor:<10} {mask.sum():>6} {a_acc:>8.1f}% {b_acc:>9.1f}% {c_acc:>6.1f}% {d_acc:>8.1f}%")

    # ─── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  SUMMARY (Test Set, n={len(y_test)})")
    print(f"{'='*70}")
    print(f"  {'Model':<35} {'Accuracy':>10} {'Log-loss':>10} {'Brier':>10}")
    print(f"  {'-'*65}")
    print(f"  {'A: LightGBM (learned baseline)':<35} {acc_a*100:>9.2f}% {ll_a:>10.4f} {brier_a:>10.4f}")
    print(f"  {'B: Logistic Regression':<35} {acc_b*100:>9.2f}% {ll_b:>10.4f} {brier_b:>10.4f}")
    print(f"  {'C: EP market predictions':<35} {acc_c:>9.2f}% {'N/A':>10} {'N/A':>10}")
    print(f"  {'D: Naive momentum baseline':<35} {acc_d:>9.2f}% {'N/A':>10} {'N/A':>10}")
    print()
    print(f"  EP edge over LightGBM:     {acc_c - acc_a*100:+.2f}pp")
    print(f"  EP edge over LogReg:       {acc_c - acc_b*100:+.2f}pp")
    print(f"  EP edge over naive:        {acc_c - acc_d:+.2f}pp")
    print(f"  LightGBM edge over naive:  {acc_a*100 - acc_d:+.2f}pp")

    # ─── Save Results ──────────────────────────────────────────────────────
    results = {
        'experiment': 'market_baseline',
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'seed': SEED,
        'data': {
            'total_predictions': n,
            'train_size': len(X_train),
            'val_size': len(X_val),
            'test_size': len(X_test),
            'features': feature_cols,
            'split': 'time-based (80/10/10)',
        },
        'model_a': {
            'name': 'LightGBM' if has_lgb else 'GradientBoostingClassifier',
            'accuracy': acc_a,
            'log_loss': ll_a,
            'brier': brier_a,
            'top_features': importance,
        },
        'model_b': {
            'name': 'Logistic Regression',
            'accuracy': acc_b,
            'log_loss': ll_b,
            'brier': brier_b,
        },
        'model_c': {
            'name': 'EP market predictions',
            'accuracy': acc_c / 100,
        },
        'model_d': {
            'name': 'Naive momentum baseline',
            'accuracy': acc_d / 100,
        },
    }

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n  Results saved to {args.output}")


if __name__ == '__main__':
    main()
