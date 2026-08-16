"""
En Pensent — Training Set Export v3 (Transformer Baseline)
============================================================================

Extends v2 with:
  1. Includes `pgn` (full move list) for transformer training
  2. 3-way split (train/val/test) by game_id — no game in multiple splits
  3. Stratification by actual_result (W/B/D) and game_type (standard/Chess960)
  4. PGN truncation at move_number (transformer sees only moves up to prediction)
  5. Configurable sample sizes via command-line args
  6. Saves split game_id lists for reproducibility

Usage:
  python benchmark/src/export_training_set_v3.py --n-train 100000 --n-val 10000 --n-test 10000
  python benchmark/src/export_training_set_v3.py --n-train 100000 --include-pgn --split-by game_id

Output:
  benchmark/data/train_v3_<date>.csv
  benchmark/data/val_v3_<date>.csv
  benchmark/data/test_v3_<date>.csv
  benchmark/data/split_game_ids_v3_<date>.json   (reproducibility)

============================================================================
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

def load_env(key):
    env_path = Path(__file__).parent.parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.startswith(f'{key}='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

DB_URL = load_env('DATABASE_URL')

# Columns to export — v3 adds pgn for transformer training
COLUMNS = [
    'id', 'game_id', 'fen', 'pgn', 'actual_result', 'created_at',
    'hybrid_prediction', 'hybrid_confidence', 'hybrid_correct', 'hybrid_archetype',
    'baseline_prediction', 'baseline_correct',
    'enhanced_prediction', 'enhanced_correct', 'enhanced_confidence',
    'stockfish_eval', 'stockfish_prediction', 'stockfish_correct', 'stockfish_confidence',
    'fusion_prediction', 'fusion_calibrated_confidence', 'fusion_agreement',
    'move_number', 'white_elo', 'black_elo', 'time_control', 'data_source',
    'color_richness', 'complexity_score', 'game_type',
    'lesson_learned', 'eight_quadrant_profile',
]

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}

def normalize_result(r):
    if r is None: return None
    r = str(r).strip().lower()
    if r in RESULT_MAP: return RESULT_MAP[r]
    if r in ("1-0", "w"): return 0
    if r in ("0-1", "b"): return 1
    if r in ("1/2-1/2", "d"): return 2
    return None

# ─────────────────────────────────────────────────────────────────────────────
# FETCH (direct Postgres, keyset pagination)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_via_postgres(total_needed, include_pgn=True):
    """Fetch positions via direct Postgres with keyset pagination."""
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 not available. Install with: pip install psycopg2-binary", file=sys.stderr)
        sys.exit(1)

    if not DB_URL:
        print("ERROR: No DATABASE_URL in .env", file=sys.stderr)
        sys.exit(1)

    print(f"  Connecting to Postgres...")
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    conn.set_session(readonly=True, autocommit=True)

    # Build SELECT — cast JSON columns to text for parsing
    col_select = []
    for c in COLUMNS:
        if c in ('lesson_learned', 'eight_quadrant_profile'):
            col_select.append(f"{c}::text as {c}")
        else:
            col_select.append(c)
    select_sql = ', '.join(col_select)

    # If not including PGN, remove it from the query to save bandwidth
    if not include_pgn:
        select_sql = select_sql.replace(', pgn', '')

    batch_size = 2000
    all_rows = []
    last_id = None
    while len(all_rows) < total_needed:
        limit = min(batch_size, total_needed - len(all_rows))
        if last_id is None:
            query = f"""
                SELECT {select_sql}
                FROM chess_prediction_attempts
                WHERE hybrid_prediction IS NOT NULL
                  AND fen IS NOT NULL
                  AND stockfish_eval IS NOT NULL
                  AND move_number BETWEEN 11 AND 80
                  AND actual_result IS NOT NULL
                ORDER BY id DESC
                LIMIT %s
            """
            params = (limit,)
        else:
            query = f"""
                SELECT {select_sql}
                FROM chess_prediction_attempts
                WHERE hybrid_prediction IS NOT NULL
                  AND fen IS NOT NULL
                  AND stockfish_eval IS NOT NULL
                  AND move_number BETWEEN 11 AND 80
                  AND actual_result IS NOT NULL
                  AND id < %s
                ORDER BY id DESC
                LIMIT %s
            """
            params = (last_id, limit)

        t0 = time.time()
        cur = conn.cursor()
        try:
            cur.execute(query, params)
            rows = cur.fetchall()
            cur.close()
        except Exception as e:
            print(f"    Query failed at last_id={last_id}: {e}")
            cur.close()
            break

        elapsed = time.time() - t0
        if len(rows) == 0:
            print(f"    No more rows ({elapsed:.1f}s)")
            break

        for row in rows:
            d = {}
            for i, c in enumerate(COLUMNS):
                if c == 'pgn' and not include_pgn:
                    d['pgn'] = None
                else:
                    d[c] = row[i]
            all_rows.append(d)

        last_id = rows[-1][0]
        print(f"    Fetched {len(all_rows)} rows (batch: {len(rows)}, {elapsed:.1f}s)", flush=True)

    conn.close()
    return all_rows

# ─────────────────────────────────────────────────────────────────────────────
# PGN TRUNCATION
# ─────────────────────────────────────────────────────────────────────────────

def truncate_pgn(pgn, move_number):
    """
    Truncate a PGN string to only include moves up to `move_number`.
    This prevents the transformer from seeing future moves (outcome leakage).

    move_number is in "full moves" (1-based, where move 1 = white's first move).
    We keep moves 1 through move_number (both white and black's moves for that number).
    """
    if not pgn or not isinstance(pgn, str):
        return None

    # Remove PGN headers and comments
    import re
    moves = re.sub(r'\[[^\]]*\]', '', pgn)  # Remove [Header "value"]
    moves = re.sub(r'\{[^}]*\}', '', moves)  # Remove {comments}
    moves = re.sub(r'\d+\.\.\.', '', moves)  # Remove black move indicators
    moves = moves.strip()

    # Split into move tokens: "1. e4 e5 2. Nf3 Nc6 ..."
    tokens = moves.split()
    kept = []
    current_move = 0
    for token in tokens:
        if re.match(r'^\d+\.$', token):
            current_move = int(token.rstrip('.'))
            if current_move > move_number:
                break
        kept.append(token)

    return ' '.join(kept)

# ─────────────────────────────────────────────────────────────────────────────
# SPLIT (game-ID split, stratified, 3-way)
# ─────────────────────────────────────────────────────────────────────────────

def stratified_game_split(df, train_frac=0.8, val_frac=0.1, test_frac=0.1, seed=42):
    """
    Split by game_id, stratified by (actual_result, game_type).
    No game appears in more than one split.
    """
    rng = np.random.RandomState(seed)

    # Fill NaN game_ids with unique placeholders
    df['game_id'] = df['game_id'].fillna(df['id'].astype(str))

    # Create stratification key
    df['strat_key'] = df['actual_result'].astype(str) + '_' + df['game_type'].fillna('standard').astype(str)

    # Get unique (game_id, strat_key) pairs — one strat_key per game
    # (a game has one result and one type, so take the first)
    game_info = df.groupby('game_id')['strat_key'].first().reset_index()
    game_info.columns = ['game_id', 'strat_key']

    train_games, val_games, test_games = set(), set(), set()

    for strat_key, group in game_info.groupby('strat_key'):
        games = group['game_id'].values
        rng.shuffle(games)
        n = len(games)
        n_train = int(n * train_frac)
        n_val = int(n * val_frac)
        train_games.update(games[:n_train])
        val_games.update(games[n_train:n_train + n_val])
        test_games.update(games[n_train + n_val:])

    return train_games, val_games, test_games

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Export training set v3 for transformer baseline')
    parser.add_argument('--n-train', type=int, default=100000, help='Training set size')
    parser.add_argument('--n-val', type=int, default=10000, help='Validation set size')
    parser.add_argument('--n-test', type=int, default=10000, help='Test set size')
    parser.add_argument('--include-pgn', action='store_true', default=True, help='Include PGN for transformer training')
    parser.add_argument('--no-pgn', action='store_true', help='Exclude PGN (for non-transformer experiments)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for split')
    args = parser.parse_args()

    include_pgn = args.include_pgn and not args.no_pgn
    total_needed = args.n_train + args.n_val + args.n_test

    print(f"{'='*60}")
    print(f"  En Pensent — Training Set Export v3")
    print(f"  Transformer Baseline Data")
    print(f"{'='*60}")
    print(f"  Target sizes: train={args.n_train}, val={args.n_val}, test={args.n_test}")
    print(f"  Total needed: {total_needed}")
    print(f"  Include PGN:  {include_pgn}")
    print(f"  Seed:         {args.seed}")
    print(f"  Started:      {datetime.now().isoformat()}")
    print()

    # Fetch
    all_rows = fetch_via_postgres(total_needed, include_pgn=include_pgn)
    df = pd.DataFrame(all_rows)
    print(f"\nFetched {len(df)} positions")

    # Normalize results
    df['result_numeric'] = df['actual_result'].apply(normalize_result)
    df = df[df['result_numeric'].notna()].copy()
    df['result_numeric'] = df['result_numeric'].astype(int)

    # Normalize predictions
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    df['ep_pred_num'] = df['hybrid_prediction'].apply(lambda x: pred_map.get(str(x).strip().lower(), -1))
    df['sf_pred_num'] = df['stockfish_prediction'].apply(lambda x: pred_map.get(str(x).strip().lower(), -1))

    # Truncate PGN at move_number (prevent outcome leakage for transformer)
    if include_pgn and 'pgn' in df.columns:
        print(f"\n  Truncating PGN at move_number (prevent outcome leakage)...")
        df['pgn_truncated'] = df.apply(lambda r: truncate_pgn(r.get('pgn'), r['move_number']), axis=1)
        has_pgn = df['pgn_truncated'].notna().sum()
        print(f"  PGN coverage: {has_pgn}/{len(df)} ({has_pgn/len(df)*100:.1f}%)")
    else:
        df['pgn_truncated'] = None

    # ── 3-WAY SPLIT (stratified by game_id) ──
    print(f"\n{'='*60}")
    print(f"  3-WAY SPLIT (stratified by game_id, result, game_type)")
    print(f"{'='*60}")

    train_games, val_games, test_games = stratified_game_split(
        df, train_frac=0.8, val_frac=0.1, test_frac=0.1, seed=args.seed
    )

    train = df[df['game_id'].isin(train_games)].copy()
    val = df[df['game_id'].isin(val_games)].copy()
    test = df[df['game_id'].isin(test_games)].copy()

    # Trim to target sizes (random sample within each split)
    if len(train) > args.n_train:
        train = train.sample(n=args.n_train, random_state=args.seed)
    if len(val) > args.n_val:
        val = val.sample(n=args.n_val, random_state=args.seed)
    if len(test) > args.n_test:
        test = test.sample(n=args.n_test, random_state=args.seed)

    # Verify no leakage
    train_gs = set(train['game_id'].unique())
    val_gs = set(val['game_id'].unique())
    test_gs = set(test['game_id'].unique())
    overlap_tv = train_gs & val_gs
    overlap_tt = train_gs & test_gs
    overlap_vt = val_gs & test_gs
    print(f"  Train: {len(train_gs)} games → {len(train)} positions")
    print(f"  Val:   {len(val_gs)} games → {len(val)} positions")
    print(f"  Test:  {len(test_gs)} games → {len(test)} positions")
    print(f"  Leakage check: train∩val={len(overlap_tv)}, train∩test={len(overlap_tt)}, val∩test={len(overlap_vt)} (all MUST be 0)")
    assert len(overlap_tv) == 0 and len(overlap_tt) == 0 and len(overlap_vt) == 0, "DATA LEAKAGE DETECTED!"

    # Drop duplicate FENs within each split
    for name, split in [('train', train), ('val', val), ('test', test)]:
        before = len(split)
        split.drop_duplicates(subset=['fen'], keep='first', inplace=True)
        if before != len(split):
            print(f"  {name}: dropped {before - len(split)} duplicate FENs")

    # ── SAVE ──
    out_dir = Path(__file__).parent.parent / 'data'
    out_dir.mkdir(exist_ok=True)
    date_str = datetime.now().strftime("%Y%m%d")

    train_path = out_dir / f'train_v3_{date_str}.csv'
    val_path = out_dir / f'val_v3_{date_str}.csv'
    test_path = out_dir / f'test_v3_{date_str}.csv'
    split_path = out_dir / f'split_game_ids_v3_{date_str}.json'

    # Select output columns
    output_cols = [
        'id', 'game_id', 'fen', 'pgn_truncated', 'actual_result', 'result_numeric',
        'hybrid_prediction', 'hybrid_confidence', 'hybrid_correct', 'hybrid_archetype',
        'stockfish_eval', 'stockfish_prediction', 'stockfish_correct', 'stockfish_confidence',
        'move_number', 'white_elo', 'black_elo', 'time_control', 'data_source', 'game_type',
        'color_richness', 'complexity_score',
    ]
    # Only include columns that exist
    output_cols = [c for c in output_cols if c in train.columns]

    train[output_cols].to_csv(train_path, index=False)
    val[output_cols].to_csv(val_path, index=False)
    test[output_cols].to_csv(test_path, index=False)

    # Save split game_ids for reproducibility
    with open(split_path, 'w') as f:
        json.dump({
            'train_game_ids': sorted(list(train_gs)),
            'val_game_ids': sorted(list(val_gs)),
            'test_game_ids': sorted(list(test_gs)),
            'seed': args.seed,
            'exported_at': datetime.now().isoformat(),
            'total_fetched': len(df),
        }, f, indent=2)

    print(f"\nSaved:")
    print(f"  Train: {train_path}")
    print(f"  Val:   {val_path}")
    print(f"  Test:  {test_path}")
    print(f"  Split: {split_path}")

    # ── STATS ──
    print(f"\n{'='*60}")
    print(f"  SPLIT STATISTICS")
    print(f"{'='*60}")

    for name, split in [('Train', train), ('Val', val), ('Test', test)]:
        ep_acc = split['hybrid_correct'].mean() * 100
        sf_acc = split['stockfish_correct'].mean() * 100
        edge = ep_acc - sf_acc
        print(f"\n  {name} (n={len(split)}):")
        print(f"    EP accuracy:  {ep_acc:.2f}%")
        print(f"    SF accuracy:  {sf_acc:.2f}%")
        print(f"    EP edge:      +{edge:.2f}pp")

        # By game type
        for gt, grp in split.groupby('game_type'):
            if len(grp) > 0:
                print(f"    {gt}: n={len(grp)} EP={grp['hybrid_correct'].mean()*100:.1f}% SF={grp['stockfish_correct'].mean()*100:.1f}%")

        # By eval zone
        print(f"    By eval zone:")
        for zone, (lo, hi) in [('0-25cp', (-25, 25)), ('25-50cp', (25, 50)), ('50-100cp', (50, 100)),
                                 ('100-200cp', (100, 200)), ('200+cp', (200, 9999))]:
            grp = split[(split['stockfish_eval'] >= lo) & (split['stockfish_eval'] < hi)]
            if len(grp) > 0:
                print(f"      {zone}: n={len(grp)} EP={grp['hybrid_correct'].mean()*100:.1f}% SF={grp['stockfish_correct'].mean()*100:.1f}% edge=+{(grp['hybrid_correct'].mean()-grp['stockfish_correct'].mean())*100:.1f}pp")

        # By move zone
        print(f"    By move zone:")
        for zone, (lo, hi) in [('12-19', (12, 19)), ('20-27', (20, 27)), ('28-45', (28, 45)), ('46+', (46, 80))]:
            grp = split[(split['move_number'] >= lo) & (split['move_number'] <= hi)]
            if len(grp) > 0:
                print(f"      {zone}: n={len(grp)} EP={grp['hybrid_correct'].mean()*100:.1f}% SF={grp['stockfish_correct'].mean()*100:.1f}% edge=+{(grp['hybrid_correct'].mean()-grp['stockfish_correct'].mean())*100:.1f}pp")

    print(f"\n{'='*60}")
    print(f"  Export complete. Use with:")
    print(f"    python benchmark/src/transformer_baseline.py")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
