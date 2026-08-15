"""
En Pensent — Training Set Export v2 (Sound Methodology)
============================================================================

Fixes from v1:
  1. Includes game_id so we can verify no game-level leakage
  2. Splits by game_id, not by position — no game appears in both sets
  3. Includes enhanced_confidence, color_richness, complexity_score
     (these are the actual color-flow trajectory outputs from the ingest worker)
  4. Includes game_type to identify Chess960 positions
  5. Drops duplicate FENs within each split
  6. Reports leakage verification stats

============================================================================
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime

import pandas as pd
import numpy as np

SUPABASE_URL = "https://ezvfslkjyjsqycztyfxh.supabase.co"

def load_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

def load_db_url():
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None

SUPABASE_KEY = load_key()
DB_URL = load_db_url()
if not SUPABASE_KEY:
    print("ERROR: Could not load SUPABASE_SERVICE_ROLE_KEY from .env", file=sys.stderr)
    sys.exit(1)

# Columns to export — now includes game_id and color-flow trajectory outputs
# created_at is included for temporal holdout splitting (train on older, test on newer)
# baseline_prediction + enhanced_prediction are included for stacker training
# (the stacker learns to fuse sub-predictors, replacing the hardcoded fusion)
COLUMNS = [
    'id', 'game_id', 'fen', 'actual_result', 'created_at',
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

def fetch_page(offset, limit=1000):
    """Fetch a page of positions via REST API."""
    select = ','.join(COLUMNS)
    url = (f"{SUPABASE_URL}/rest/v1/chess_prediction_attempts?"
           f"select={select}"
           f"&hybrid_prediction=not.is.null"
           f"&fen=not.is.null"
           f"&stockfish_eval=not.is.null"
           f"&move_number=gte.11&move_number=lte.80"
           f"&order=id.desc&limit={limit}&offset={offset}")
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

def fetch_via_postgres(total_needed):
    """Fetch positions via direct Postgres connection — bypasses REST API timeouts on JSON columns."""
    try:
        import psycopg2
    except ImportError:
        print("  psycopg2 not available, falling back to REST API")
        return None

    if not DB_URL:
        print("  No DATABASE_URL in .env, falling back to REST API")
        return None

    print(f"  Connecting to Postgres via direct connection...")
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

    # Fetch in batches using keyset pagination (id < last_id) to avoid OFFSET timeouts
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
                d[c] = row[i]
            all_rows.append(d)

        last_id = rows[-1][0]  # id is first column
        print(f"    Fetched {len(all_rows)} rows (batch: {len(rows)}, {elapsed:.1f}s, last_id={last_id})", flush=True)

    conn.close()
    return all_rows

def main():
    total_needed = 50000
    page_size = 1000
    all_rows = []

    print(f"Exporting {total_needed} positions from Supabase...")
    print(f"  Started: {datetime.now().isoformat()}")
    print()

    # ── Try direct Postgres first (bypasses REST API JSON column timeouts) ──
    pg_rows = fetch_via_postgres(total_needed)
    if pg_rows is not None:
        all_rows = pg_rows
        print(f"\nFetched {len(all_rows)} positions via Postgres direct connection")
    else:
        print(f"  Page size: {page_size}")
        offset = 0
        while len(all_rows) < total_needed:
            limit = min(page_size, total_needed - len(all_rows))
            print(f"  Fetching page {len(all_rows)//page_size + 1}: offset={offset}, limit={limit}...", end=' ', flush=True)

            t0 = time.time()
            data = fetch_page(offset, limit)
            elapsed = time.time() - t0

            if data is None:
                print(f"FAILED ({elapsed:.1f}s)")
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

    # ── PARSE COLOR-FLOW SIGNATURE FROM JSON COLUMNS ──
    # The ingest worker stores the full color-flow trajectory signature in:
    #   1. lesson_learned.ep_signals (baseline 4-quadrant signature)
    #   2. eight_quadrant_profile (enhanced 8-quadrant signature)
    # These contain the ACTUAL temporal trajectory features:
    #   - quadrantProfile: white vs black visit balance per quadrant (-100 to +100)
    #   - temporalFlow: opening/middlegame/endgame balance + volatility
    #   - intensity, dominantSide, flowDirection
    print(f"\n  Parsing color-flow signature from JSON columns...")

    def parse_json(val):
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return None
        if isinstance(val, dict):
            return val
        try:
            return json.loads(val)
        except:
            return None

    def extract_ep_signals(row):
        ll = parse_json(row.get('lesson_learned'))
        if ll and isinstance(ll, dict) and 'ep_signals' in ll:
            return ll['ep_signals']
        return None

    def extract_quadrant_profile(row):
        sig = extract_ep_signals(row)
        if sig and 'quadrant' in sig:
            q = sig['quadrant']
            return {
                'q_kingside_white': q.get('kingsideWhite', 0),
                'q_kingside_black': q.get('kingsideBlack', 0),
                'q_queenside_white': q.get('queensideWhite', 0),
                'q_queenside_black': q.get('queensideBlack', 0),
                'q_center': q.get('center', 0),
            }
        return None

    def extract_temporal_flow(row):
        sig = extract_ep_signals(row)
        if sig and 'temporal' in sig:
            t = sig['temporal']
            return {
                'tf_opening': t.get('opening', 0),
                'tf_middlegame': t.get('middlegame', 0),
                'tf_endgame': t.get('endgame', 0),
                'tf_volatility': t.get('volatility', 0),
            }
        return None

    def extract_intensity(row):
        sig = extract_ep_signals(row)
        if sig and 'intensity' in sig:
            return sig['intensity']
        return np.nan

    def extract_dominant_side(row):
        sig = extract_ep_signals(row)
        if sig and 'dominant_side' in sig:
            return sig['dominant_side']
        return None

    def extract_flow_direction(row):
        sig = extract_ep_signals(row)
        if sig and 'flow_direction' in sig:
            return sig['flow_direction']
        return None

    def extract_8quad(row):
        eq = parse_json(row.get('eight_quadrant_profile'))
        if eq and isinstance(eq, dict):
            return {
                'eq_q1_ks_white': eq.get('q1_kingside_white', 0),
                'eq_q2_qs_white': eq.get('q2_queenside_white', 0),
                'eq_q3_ks_black': eq.get('q3_kingside_black', 0),
                'eq_q4_qs_black': eq.get('q4_queenside_black', 0),
                'eq_q5_center_white': eq.get('q5_center_white', 0),
                'eq_q6_center_black': eq.get('q6_center_black', 0),
                'eq_bishop_dom': eq.get('bishop_dominance', 0),
                'eq_knight_dom': eq.get('knight_dominance', 0),
                'eq_rook_dom': eq.get('rook_dominance', 0),
                'eq_queen_dom': eq.get('queen_dominance', 0),
                'eq_pawn_adv': eq.get('pawn_advancement', 0),
            }
        return None

    # Extract all features
    quadrant_data = df.apply(extract_quadrant_profile, axis=1)
    temporal_data = df.apply(extract_temporal_flow, axis=1)
    df['cf_intensity'] = df.apply(extract_intensity, axis=1)
    df['cf_dominant_side'] = df.apply(extract_dominant_side, axis=1)
    df['cf_flow_direction'] = df.apply(extract_flow_direction, axis=1)
    eq_data = df.apply(extract_8quad, axis=1)

    # Unpack into columns
    for col in ['q_kingside_white', 'q_kingside_black', 'q_queenside_white', 'q_queenside_black', 'q_center']:
        df[col] = quadrant_data.apply(lambda x: x[col] if x else np.nan)

    for col in ['tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility']:
        df[col] = temporal_data.apply(lambda x: x[col] if x else np.nan)

    for col in ['eq_q1_ks_white', 'eq_q2_qs_white', 'eq_q3_ks_black', 'eq_q4_qs_black',
                'eq_q5_center_white', 'eq_q6_center_black',
                'eq_bishop_dom', 'eq_knight_dom', 'eq_rook_dom', 'eq_queen_dom', 'eq_pawn_adv']:
        df[col] = eq_data.apply(lambda x: x[col] if x else np.nan)

    # Report coverage
    has_quadrant = df['q_kingside_white'].notna().sum()
    has_temporal = df['tf_opening'].notna().sum()
    has_8quad = df['eq_q1_ks_white'].notna().sum()
    has_intensity = df['cf_intensity'].notna().sum()
    print(f"  Color-flow signature coverage:")
    print(f"    4-quadrant profile: {has_quadrant}/{len(df)} ({has_quadrant/len(df)*100:.1f}%)")
    print(f"    temporal flow:      {has_temporal}/{len(df)} ({has_temporal/len(df)*100:.1f}%)")
    print(f"    8-quadrant profile: {has_8quad}/{len(df)} ({has_8quad/len(df)*100:.1f}%)")
    print(f"    intensity:          {has_intensity}/{len(df)} ({has_intensity/len(df)*100:.1f}%)")

    # ── LEAKAGE PREVENTION: Split by game_id, not by position ──
    # Every game_id gets assigned to either training or hold-out, never both.
    # This prevents positions from the same game appearing in both sets.
    print(f"\n{'='*60}")
    print(f"  LEAKAGE-PREVENTION: Game-level split")
    print(f"{'='*60}")

    # Get unique game_ids and shuffle them
    if 'game_id' not in df.columns or df['game_id'].isna().all():
        print("  WARNING: No game_id column — falling back to position-level split")
        print("  This means we CANNOT verify no game-level leakage!")
        holdout = df.head(10000).copy()
        train = df.tail(max(0, len(df) - 10000)).copy()
    else:
        # Fill NaN game_ids with unique placeholders
        df['game_id'] = df['game_id'].fillna(df['id'].astype(str))

        unique_games = df['game_id'].unique()
        print(f"  Total positions: {len(df)}")
        print(f"  Unique games: {len(unique_games)}")
        print(f"  Positions per game: {len(df)/len(unique_games):.1f}")

        # Shuffle game_ids deterministically (seed for reproducibility)
        rng = np.random.RandomState(42)
        shuffled_games = rng.permutation(unique_games)

        # Split games 70/30 — 70% for training, 30% for hold-out
        n_holdout_games = int(len(shuffled_games) * 0.3)
        holdout_games = set(shuffled_games[:n_holdout_games])
        train_games = set(shuffled_games[n_holdout_games:])

        # Assign positions based on game split
        holdout = df[df['game_id'].isin(holdout_games)].copy()
        train = df[df['game_id'].isin(train_games)].copy()

        print(f"  Training games: {len(train_games)} → {len(train)} positions")
        print(f"  Hold-out games: {len(holdout_games)} → {len(holdout)} positions")

        # Verify no leakage
        train_game_set = set(train['game_id'].unique())
        holdout_game_set = set(holdout['game_id'].unique())
        overlap = train_game_set & holdout_game_set
        print(f"  Game overlap: {len(overlap)} (MUST be 0)")
        assert len(overlap) == 0, f"DATA LEAKAGE: {len(overlap)} games in both sets!"

    # Drop duplicate FENs within each split (same position from different games is OK,
    # but exact duplicate FENs with same result are just noise)
    train_before = len(train)
    holdout_before = len(holdout)
    train = train.drop_duplicates(subset=['fen'], keep='first')
    holdout = holdout.drop_duplicates(subset=['fen'], keep='first')
    print(f"\n  Dropped duplicate FENs:")
    print(f"    Training: {train_before} → {len(train)} ({train_before - len(train)} removed)")
    print(f"    Hold-out: {holdout_before} → {len(holdout)} ({holdout_before - len(holdout)} removed)")

    # Save
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)

    train_path = os.path.join(out_dir, f'training_set_v2_{datetime.now().strftime("%Y%m%d")}.csv')
    holdout_path = os.path.join(out_dir, f'holdout_set_v2_{datetime.now().strftime("%Y%m%d")}.csv')

    train.to_csv(train_path, index=False)
    holdout.to_csv(holdout_path, index=False)

    print(f"\nSaved:")
    print(f"  Training:  {train_path}")
    print(f"  Hold-out:  {holdout_path}")

    # Stats
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

    # Chess960 check
    chess960_train = train[train['data_source'] == 'lichess_960']
    chess960_holdout = holdout[holdout['data_source'] == 'lichess_960']
    print(f"\n=== Chess960 Sanity Check ===")
    print(f"  Training Chess960: {len(chess960_train)} positions")
    print(f"  Hold-out Chess960: {len(chess960_holdout)} positions")
    if len(chess960_holdout) > 0:
        sf_preds = chess960_holdout['stockfish_prediction'].value_counts()
        print(f"  SF predictions on Chess960 hold-out:")
        for pred, count in sf_preds.items():
            print(f"    {pred}: {count} ({count/len(chess960_holdout)*100:.1f}%)")
        actual = chess960_holdout['actual_result'].value_counts()
        print(f"  Actual results on Chess960 hold-out:")
        for res, count in actual.items():
            print(f"    {res}: {count} ({count/len(chess960_holdout)*100:.1f}%)")


if __name__ == "__main__":
    main()
