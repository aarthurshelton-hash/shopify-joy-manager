"""
En Pensent — Large Training Set Export
============================================================================

Exports 20,000 positions from Supabase with all features needed for
neural network training and large-scale benchmarking.

Exports:
  - 15,000 training positions
  - 5,000 hold-out positions (for benchmark with confidence intervals)

Features per position:
  - id, fen, actual_result
  - hybrid_prediction, hybrid_confidence, hybrid_correct, hybrid_archetype
  - stockfish_eval, stockfish_prediction, stockfish_correct, stockfish_confidence
  - fusion_prediction, fusion_calibrated_confidence, fusion_agreement
  - move_number, white_elo, black_elo, time_control, data_source

The export uses the REST API in pages of 1000 to avoid timeout.

============================================================================
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime

import pandas as pd

SUPABASE_URL = "https://ezvfslkjyjsqycztyfxh.supabase.co"

# Load service role key from .env
def load_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

SUPABASE_KEY = load_key()
if not SUPABASE_KEY:
    print("ERROR: Could not load SUPABASE_SERVICE_ROLE_KEY from .env", file=sys.stderr)
    sys.exit(1)

# Columns to export
COLUMNS = [
    'id', 'fen', 'actual_result',
    'hybrid_prediction', 'hybrid_confidence', 'hybrid_correct', 'hybrid_archetype',
    'stockfish_eval', 'stockfish_prediction', 'stockfish_correct', 'stockfish_confidence',
    'fusion_prediction', 'fusion_calibrated_confidence', 'fusion_agreement',
    'move_number', 'white_elo', 'black_elo', 'time_control', 'data_source',
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

def fetch_page(offset, limit=1000):
    """Fetch a page of positions via REST API."""
    select = ','.join(COLUMNS)
    url = f"{SUPABASE_URL}/rest/v1/chess_prediction_attempts?select={select}&hybrid_prediction=not.is.null&fen=not.is.null&stockfish_eval=not.is.null&move_number=gte.11&move_number=lte.80&order=id.desc&limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  fetch error at offset {offset}: {e}", file=sys.stderr)
        return None

def main():
    total_needed = 50000
    page_size = 1000
    all_rows = []

    print(f"Exporting {total_needed} positions from Supabase...")
    print(f"  Page size: {page_size}")
    print(f"  Started: {datetime.now().isoformat()}")
    print()

    offset = 0
    while len(all_rows) < total_needed:
        limit = min(page_size, total_needed - len(all_rows))
        print(f"  Fetching page {len(all_rows)//page_size + 1}: offset={offset}, limit={limit}...", end=' ', flush=True)

        t0 = time.time()
        data = fetch_page(offset, limit)
        elapsed = time.time() - t0

        if data is None:
            print(f"FAILED ({elapsed:.1f}s)")
            # Retry once
            time.sleep(3)
            data = fetch_page(offset, limit)
            if data is None:
                print(f"  Retry failed, stopping")
                break

        if len(data) == 0:
            print(f"empty ({elapsed:.1f}s) — no more data")
            break

        all_rows.extend(data)
        offset += len(data)
        print(f"got {len(data)} ({elapsed:.1f}s, total: {len(all_rows)})")

    print(f"\nFetched {len(all_rows)} positions total")

    # Convert to DataFrame
    df = pd.DataFrame(all_rows)

    # Normalize results
    df['result_numeric'] = df['actual_result'].apply(normalize_result)
    df = df[df['result_numeric'].notna()].copy()
    df['result_numeric'] = df['result_numeric'].astype(int)

    # Normalize predictions to numeric
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    df['ep_pred_num'] = df['hybrid_prediction'].apply(lambda x: pred_map.get(str(x).strip().lower(), -1))
    df['sf_pred_num'] = df['stockfish_prediction'].apply(lambda x: pred_map.get(str(x).strip().lower(), -1))
    df['fusion_pred_num'] = df['fusion_prediction'].apply(lambda x: pred_map.get(str(x).strip().lower(), -1) if x else -1)

    # Split: most recent 10000 = hold-out, rest = training
    # (data is already ordered by id DESC, so first 10000 are most recent)
    holdout = df.head(10000).copy()
    train = df.tail(max(0, len(df) - 10000)).copy()

    print(f"\nSplit:")
    print(f"  Training:  {len(train)} positions")
    print(f"  Hold-out:  {len(holdout)} positions")

    # Save
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)

    train_path = os.path.join(out_dir, f'training_set_{datetime.now().strftime("%Y%m%d")}.csv')
    holdout_path = os.path.join(out_dir, f'holdout_set_{datetime.now().strftime("%Y%m%d")}.csv')

    train.to_csv(train_path, index=False)
    holdout.to_csv(holdout_path, index=False)

    print(f"\nSaved:")
    print(f"  Training:  {train_path}")
    print(f"  Hold-out:  {holdout_path}")

    # Quick stats
    print(f"\n=== Training Set Stats ===")
    print(f"  EP accuracy:   {train['hybrid_correct'].mean()*100:.1f}%")
    print(f"  SF accuracy:   {train['stockfish_correct'].mean()*100:.1f}%")
    if train['fusion_pred_num'].gt(0).any():
        valid_fusion = train[train['fusion_pred_num'] >= 0]
        if len(valid_fusion) > 0:
            fusion_acc = (valid_fusion['fusion_pred_num'] == valid_fusion['result_numeric']).mean()
            print(f"  Fusion accuracy: {fusion_acc*100:.1f}% (n={len(valid_fusion)})")

    print(f"\n  By source:")
    for src, grp in train.groupby('data_source'):
        print(f"    {src}: n={len(grp)} EP={grp['hybrid_correct'].mean()*100:.1f}% SF={grp['stockfish_correct'].mean()*100:.1f}%")

    print(f"\n=== Hold-out Set Stats ===")
    print(f"  EP accuracy:   {holdout['hybrid_correct'].mean()*100:.1f}%")
    print(f"  SF accuracy:   {holdout['stockfish_correct'].mean()*100:.1f}%")

    print(f"\n  By source:")
    for src, grp in holdout.groupby('data_source'):
        print(f"    {src}: n={len(grp)} EP={grp['hybrid_correct'].mean()*100:.1f}% SF={grp['stockfish_correct'].mean()*100:.1f}%")


if __name__ == "__main__":
    main()
