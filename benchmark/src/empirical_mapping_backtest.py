#!/usr/bin/env python3
"""
Backtest the Empirical Archetype Mapping against LightGBM and EP.

Tests the empirical mapping (chess_archetype × market_archetype × horizon → direction)
on the same time-based test split used in market_baseline.py.

The mapping is loaded from benchmark/data/empirical_archetype_mapping.json and
applied to the test set. For cells not in the mapping, falls back to:
  1. chess_arch × market_arch (any horizon)
  2. market_arch only
  3. Random (33.3%)
"""

import argparse
import json
import os
import sys
import numpy as np
import pandas as pd
from collections import Counter
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv()

MIN_SAMPLES = 50
MIN_SAMPLES_NO_HORIZON = 100
MIN_SAMPLES_MARKET_ONLY = 200


def load_mapping(json_path):
    """Load the empirical mapping from JSON file."""
    with open(json_path) as f:
        raw = json.load(f)

    # Build full mapping
    full = {}
    for key, cell in raw.items():
        if cell['n'] >= MIN_SAMPLES:
            full[key] = cell

    # Build no-horizon mapping
    no_horizon_raw = {}
    for cell in full.values():
        key = f"{cell['chess_archetype']}|{cell['market_archetype']}"
        if key not in no_horizon_raw:
            no_horizon_raw[key] = {'total': 0, 'bull': 0, 'bear': 0, 'neutral': 0}
        no_horizon_raw[key]['total'] += cell['n']
        no_horizon_raw[key]['bull'] += round(cell['bull_pct'] * cell['n'])
        no_horizon_raw[key]['bear'] += round(cell['bear_pct'] * cell['n'])
        no_horizon_raw[key]['neutral'] += round(cell['neutral_pct'] * cell['n'])

    no_horizon = {}
    for key, c in no_horizon_raw.items():
        if c['total'] < MIN_SAMPLES_NO_HORIZON:
            continue
        bp = c['bull'] / c['total']
        bearp = c['bear'] / c['total']
        np_ = c['neutral'] / c['total']
        pred = 'bullish' if bp > bearp and bp > np_ else 'bearish' if bearp > bp and bearp > np_ else 'neutral'
        no_horizon[key] = {'predicted_direction': pred, 'n': c['total'], 'confidence': max(bp, bearp, np_)}

    # Build market-only mapping
    market_only_raw = {}
    for cell in full.values():
        key = cell['market_archetype']
        if key not in market_only_raw:
            market_only_raw[key] = {'total': 0, 'bull': 0, 'bear': 0, 'neutral': 0}
        market_only_raw[key]['total'] += cell['n']
        market_only_raw[key]['bull'] += round(cell['bull_pct'] * cell['n'])
        market_only_raw[key]['bear'] += round(cell['bear_pct'] * cell['n'])
        market_only_raw[key]['neutral'] += round(cell['neutral_pct'] * cell['n'])

    market_only = {}
    for key, c in market_only_raw.items():
        if c['total'] < MIN_SAMPLES_MARKET_ONLY:
            continue
        bp = c['bull'] / c['total']
        bearp = c['bear'] / c['total']
        np_ = c['neutral'] / c['total']
        pred = 'bullish' if bp > bearp and bp > np_ else 'bearish' if bearp > bp and bearp > np_ else 'neutral'
        market_only[key] = {'predicted_direction': pred, 'n': c['total'], 'confidence': max(bp, bearp, np_)}

    return full, no_horizon, market_only


def predict_empirical(chess_arch, market_arch, horizon, full, no_horizon, market_only):
    """Predict using the empirical mapping with fallback chain."""
    # Tier 1: Full match
    key1 = f"{chess_arch}|{market_arch}|{horizon}"
    if key1 in full:
        return full[key1]['predicted_direction'], 'full_match', full[key1]['n']

    # Tier 2: No horizon
    key2 = f"{chess_arch}|{market_arch}"
    if key2 in no_horizon:
        return no_horizon[key2]['predicted_direction'], 'no_horizon', no_horizon[key2]['n']

    # Tier 3: Market only
    if market_arch in market_only:
        return market_only[market_arch]['predicted_direction'], 'market_only', market_only[market_arch]['n']

    # Tier 4: Random fallback
    return 'neutral', 'fallback', 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mapping', default='benchmark/data/empirical_archetype_mapping.json')
    parser.add_argument('--output', default='benchmark/results/empirical_mapping_backtest.json')
    args = parser.parse_args()

    print(f"\n{'='*70}")
    print(f"  Empirical Archetype Mapping — Backtest")
    print(f"{'='*70}")

    # Load mapping
    full, no_horizon, market_only = load_mapping(args.mapping)
    print(f"  Mapping: {len(full)} full cells, {len(no_horizon)} no-horizon, {len(market_only)} market-only")

    # Load market predictions from DB
    print(f"\nLoading market predictions from Postgres...")
    conn = psycopg2.connect(os.environ['DATABASE_URL'], sslmode='require', options='-c statement_timeout=120000')
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Use server-side cursor for large query to avoid timeout
    cursor_name = "market_pred_cursor"
    cursor.execute(f"DECLARE {cursor_name} CURSOR FOR SELECT symbol, time_horizon, predicted_direction, confidence, archetype, actual_direction, ep_correct, baseline_correct, prediction_metadata, created_at FROM market_prediction_attempts WHERE ep_correct IS NOT NULL AND prediction_metadata IS NOT NULL AND actual_direction IS NOT NULL ORDER BY created_at")

    rows = []
    while True:
        cursor.execute(f"FETCH 5000 FROM {cursor_name}")
        batch = cursor.fetchall()
        if not batch:
            break
        rows.extend(batch)
        print(f"\r  Loaded {len(rows)} rows...", end='', flush=True)

    cursor.execute(f"CLOSE {cursor_name}")
    cursor.close()
    conn.close()
    print(f"\n  Loaded {len(rows)} resolved predictions")

    # Extract chess archetype from metadata
    records = []
    for row in rows:
        meta = row['prediction_metadata'] or {}
        chess_arch = meta.get('chess_bridge', {}).get('chessArchetype') if isinstance(meta.get('chess_bridge'), dict) else None
        market_arch = row['archetype']
        horizon = row['time_horizon']

        # Normalize actual direction
        actual = row['actual_direction']
        if actual in ('up', 'bullish'):
            actual_norm = 'bullish'
        elif actual in ('down', 'bearish'):
            actual_norm = 'bearish'
        else:
            actual_norm = 'neutral'

        records.append({
            'chess_arch': chess_arch,
            'market_arch': market_arch,
            'horizon': horizon,
            'actual': actual_norm,
            'ep_correct': bool(row['ep_correct']),
            'baseline_correct': bool(row['baseline_correct']) if row['baseline_correct'] is not None else False,
            'ep_pred': row['predicted_direction'],
            'symbol': row['symbol'],
            'created_at': row['created_at'],
        })

    df = pd.DataFrame(records)
    print(f"  Records with chess_arch: {df['chess_arch'].notna().sum()} / {len(df)}")

    # Time-based split (same as market_baseline.py: 80/10/10)
    n = len(df)
    train_end = int(n * 0.8)
    val_end = int(n * 0.9)
    df_test = df.iloc[val_end:]

    print(f"\n  Test set: {len(df_test)} samples")
    print(f"    Date range: {df_test['created_at'].min()} → {df_test['created_at'].max()}")

    # Only test on rows that have chess_arch (the mapping requires it)
    df_test_with_chess = df_test[df_test['chess_arch'].notna()].copy()
    df_test_without_chess = df_test[df_test['chess_arch'].isna()].copy()
    print(f"    With chess_arch: {len(df_test_with_chess)}")
    print(f"    Without chess_arch: {len(df_test_without_chess)}")

    # Apply empirical mapping to test set
    preds = []
    sources = []
    ns = []
    for _, row in df_test_with_chess.iterrows():
        pred, source, n_samples = predict_empirical(
            row['chess_arch'], row['market_arch'], row['horizon'],
            full, no_horizon, market_only
        )
        preds.append(pred)
        sources.append(source)
        ns.append(n_samples)

    df_test_with_chess['empirical_pred'] = preds
    df_test_with_chess['empirical_source'] = sources
    df_test_with_chess['empirical_n'] = ns
    df_test_with_chess['empirical_correct'] = df_test_with_chess['empirical_pred'] == df_test_with_chess['actual']

    # Compute accuracies
    emp_acc = df_test_with_chess['empirical_correct'].mean() * 100
    ep_acc = df_test_with_chess['ep_correct'].mean() * 100
    bl_acc = df_test_with_chess['baseline_correct'].mean() * 100

    print(f"\n{'='*70}")
    print(f"  RESULTS (Test set, n={len(df_test_with_chess)})")
    print(f"{'='*70}")
    print(f"  Empirical mapping:  {emp_acc:.2f}%")
    print(f"  EP predictions:     {ep_acc:.2f}%")
    print(f"  Naive baseline:     {bl_acc:.2f}%")
    print(f"  Random (3-class):   33.33%")
    print()
    print(f"  EP edge over empirical:  {ep_acc - emp_acc:+.2f}pp")
    print(f"  Empirical edge over EP:  {emp_acc - ep_acc:+.2f}pp")
    print(f"  Empirical edge over naive: {emp_acc - bl_acc:+.2f}pp")

    # Source breakdown
    print(f"\n  --- By Source ---")
    print(f"  {'Source':<15} {'N':>6} {'Emp%':>7} {'EP%':>7} {'Naive%':>7}")
    for source in ['full_match', 'no_horizon', 'market_only', 'fallback']:
        mask = df_test_with_chess['empirical_source'] == source
        if mask.sum() == 0:
            continue
        e = df_test_with_chess.loc[mask, 'empirical_correct'].mean() * 100
        ep = df_test_with_chess.loc[mask, 'ep_correct'].mean() * 100
        bl = df_test_with_chess.loc[mask, 'baseline_correct'].mean() * 100
        print(f"  {source:<15} {mask.sum():>6} {e:>6.1f}% {ep:>6.1f}% {bl:>6.1f}%")

    # By symbol
    print(f"\n  --- By Symbol ---")
    print(f"  {'Symbol':<10} {'N':>6} {'Emp%':>7} {'EP%':>7} {'Naive%':>7}")
    for sym in df_test_with_chess['symbol'].unique():
        mask = df_test_with_chess['symbol'] == sym
        if mask.sum() < 10:
            continue
        e = df_test_with_chess.loc[mask, 'empirical_correct'].mean() * 100
        ep = df_test_with_chess.loc[mask, 'ep_correct'].mean() * 100
        bl = df_test_with_chess.loc[mask, 'baseline_correct'].mean() * 100
        print(f"  {sym:<10} {mask.sum():>6} {e:>6.1f}% {ep:>6.1f}% {bl:>6.1f}%")

    # By horizon
    print(f"\n  --- By Horizon ---")
    print(f"  {'Horizon':<10} {'N':>6} {'Emp%':>7} {'EP%':>7} {'Naive%':>7}")
    for hor in df_test_with_chess['horizon'].unique():
        mask = df_test_with_chess['horizon'] == hor
        if mask.sum() < 10:
            continue
        e = df_test_with_chess.loc[mask, 'empirical_correct'].mean() * 100
        ep = df_test_with_chess.loc[mask, 'ep_correct'].mean() * 100
        bl = df_test_with_chess.loc[mask, 'baseline_correct'].mean() * 100
        print(f"  {hor:<10} {mask.sum():>6} {e:>6.1f}% {ep:>6.1f}% {bl:>6.1f}%")

    # Save results
    results = {
        'experiment': 'empirical_mapping_backtest',
        'mapping_cells': len(full),
        'test_size': len(df_test_with_chess),
        'empirical_accuracy': emp_acc / 100,
        'ep_accuracy': ep_acc / 100,
        'naive_accuracy': bl_acc / 100,
        'source_breakdown': {
            source: {
                'n': int((df_test_with_chess['empirical_source'] == source).sum()),
                'empirical_acc': float(df_test_with_chess.loc[df_test_with_chess['empirical_source'] == source, 'empirical_correct'].mean()),
                'ep_acc': float(df_test_with_chess.loc[df_test_with_chess['empirical_source'] == source, 'ep_correct'].mean()),
            }
            for source in df_test_with_chess['empirical_source'].unique()
        },
    }

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n  Results saved to {args.output}")


if __name__ == '__main__':
    main()
