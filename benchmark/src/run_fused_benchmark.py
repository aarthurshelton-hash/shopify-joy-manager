"""
En Pensent — Fused Benchmark (EP + Maia-2 + Isotonic Calibration)
============================================================================

Benchmarks the new v9.0 fusion architecture against all previous baselines:

  1. En Pensent (v8.07, original — from corpus)
  2. Stockfish 18 raw (from corpus)
  3. Calibrated SF-eval logistic
  4. LightGBM
  5. Maia-2 (standalone)
  6. EP + Maia + SF FUSION (v9.0, with isotonic calibration)  ← NEW

The fusion model combines EP's color-flow prediction, Maia-2's expected
score, and SF's eval using weighted voting, then applies isotonic
calibration to fix the confidence clamping issue.

Requires the Maia-2 inference service to be running:
  python benchmark/src/maia_service.py --port 3002 --device cpu --preload

Usage:
  python benchmark/src/run_fused_benchmark.py --n-holdout 500 --n-train 3000

============================================================================
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime

import numpy as np
import pandas as pd

# ----------------------------------------------------------------------------
# Args
# ----------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="En Pensent fused benchmark")
    p.add_argument("--n-holdout", type=int, default=500)
    p.add_argument("--n-train", type=int, default=3000)
    p.add_argument("--input", type=str, default=None)
    p.add_argument("--output-dir", type=str, default="results")
    p.add_argument("--maia-url", type=str, default="http://127.0.0.1:3002")
    return p.parse_args()


# ----------------------------------------------------------------------------
# Supabase fetch
# ----------------------------------------------------------------------------

SUPABASE_URL = "https://ezvfslkjyjsqycztyfxh.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmZzbGtqeWpzcXljenR5ZnhoIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3NzAwODMwMjksImV4cCI6MjA4NTY1OTAyOX0."
    "pEFtxIisThrkNbXJPg0UThjscT0qqpxmv970PihxWMo"
)

def fetch_positions(n, offset=0):
    cols = (
        "fen,actual_result,stockfish_eval,stockfish_prediction,stockfish_correct,"
        "stockfish_confidence,hybrid_prediction,hybrid_confidence,hybrid_correct,"
        "hybrid_archetype,white_elo,black_elo,move_number,time_control,data_source,game_id"
    )
    rows = []
    page = 1000
    cur = offset
    while len(rows) < n:
        limit = min(page, n - len(rows))
        url = f"{SUPABASE_URL}/rest/v1/chess_prediction_attempts?select={cols}&limit={limit}&offset={cur}"
        req = urllib.request.Request(url, headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"  fetch error at offset {cur}: {e}", file=sys.stderr)
            break
        if not data:
            break
        rows.extend(data)
        cur += len(data)
        if len(data) < limit:
            break
    return pd.DataFrame(rows[:n])


# ----------------------------------------------------------------------------
# Maia-2 inference (via service)
# ----------------------------------------------------------------------------

def maia_infer(fen, white_elo, black_elo, maia_url):
    try:
        body = json.dumps({"fen": fen, "white_elo": white_elo, "black_elo": black_elo}).encode()
        req = urllib.request.Request(
            f"{maia_url}/infer",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


# ----------------------------------------------------------------------------
# Result normalization
# ----------------------------------------------------------------------------

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}

def normalize_result(r):
    if r is None:
        return None
    r = str(r).strip().lower()
    if r in RESULT_MAP: return RESULT_MAP[r]
    if r in ("1-0", "w"): return 0
    if r in ("0-1", "b"): return 1
    if r in ("1/2-1/2", "d"): return 2
    return None


# ----------------------------------------------------------------------------
# Isotonic calibration (Python implementation matching the TS layer)
# ----------------------------------------------------------------------------

ISOTONIC_TABLE = [
    (0.15, 0.40), (0.30, 0.45), (0.40, 0.50), (0.50, 0.62),
    (0.55, 0.68), (0.60, 0.75), (0.65, 0.82), (0.70, 0.86),
    (0.80, 0.90), (0.90, 0.94), (1.01, 0.96),
]

def isotonic_calibrate(raw_conf):
    p = max(0, min(1, raw_conf))
    for threshold, calibrated in ISOTONIC_TABLE:
        if p < threshold:
            return calibrated
    return ISOTONIC_TABLE[-1][1]


# ----------------------------------------------------------------------------
# Fusion (Python implementation matching the TS maiaFusion.ts)
# ----------------------------------------------------------------------------

# Archetype accuracy lookup (from HARDCODED_ACCURACY in archetypeCalibration.ts)
ARCHETYPE_ACCURACY = {
    "sacrificial_queenside_break": 0.639, "sacrificial_kingside_assault": 0.631,
    "king_hunt": 0.615, "queenside_expansion": 0.610, "kingside_attack": 0.608,
    "sacrificial_attack": 0.604, "positional_squeeze": 0.592,
    "balanced_flow": 0.577, "central_domination": 0.574,
    "closed_maneuvering": 0.565, "pawn_storm": 0.564,
    "piece_harmony": 0.487, "central_knight_outpost": 0.486,
    "open_tactical": 0.530, "endgame_technique": 0.565,
    "prophylactic_defense": 0.530, "opposite_castling": 0.550,
    "development_focus": 0.302, "unknown": 0.604,
}

def sf_to_outcome(sf_eval):
    if sf_eval > 50: return ("white_wins", min(0.95, 0.5 + sf_eval / 600))
    if sf_eval < -50: return ("black_wins", min(0.95, 0.5 + abs(sf_eval) / 600))
    return ("draw", 0.4)

def maia_to_outcome(white_score):
    if white_score > 0.6: return ("white_wins", white_score)
    if white_score < 0.4: return ("black_wins", 1 - white_score)
    return ("draw", 1 - abs(white_score - 0.5) * 2)

def compute_fusion_weights(archetype, sf_eval, move_number, is_960, ep_acc):
    abs_eval = abs(sf_eval)
    ep_w, maia_w, sf_w = 1.0, 1.0, 0.8

    if abs_eval > 300: sf_w, ep_w, maia_w = 2.0, 0.5, 0.7
    elif abs_eval > 150: sf_w, ep_w, maia_w = 1.3, 0.8, 0.9
    elif abs_eval < 50: ep_w, maia_w, sf_w = 1.3, 1.2, 0.5

    if ep_acc >= 0.55: ep_w *= 1.2
    elif ep_acc < 0.45: ep_w *= 0.7

    if is_960: ep_w *= 1.8; sf_w *= 0.3; maia_w *= 1.1
    if move_number <= 10: ep_w *= 0.3; maia_w *= 1.3
    if move_number >= 60: sf_w *= 1.5; ep_w *= 0.5; maia_w *= 0.8

    total = ep_w + maia_w + sf_w
    return ep_w / total, maia_w / total, sf_w / total


def fuse_predict(ep_pred, ep_conf, archetype, maia_data, sf_eval, move_number, is_960):
    ep_outcome, ep_prob = ep_pred, ep_conf
    sf_outcome, sf_prob = sf_to_outcome(sf_eval)

    if maia_data:
        maia_outcome, maia_prob = maia_to_outcome(maia_data["white_expected_score"])
    else:
        maia_outcome, maia_prob = sf_outcome, sf_prob  # fallback

    ep_acc = ARCHETYPE_ACCURACY.get(archetype, 0.604)
    w_ep, w_maia, w_sf = compute_fusion_weights(archetype, sf_eval, move_number, is_960, ep_acc)

    votes = {"white_wins": 0, "black_wins": 0, "draw": 0}
    votes[ep_outcome] += w_ep * ep_prob
    votes[maia_outcome] += w_maia * maia_prob
    votes[sf_outcome] += w_sf * sf_prob

    best = max(votes, key=votes.get)
    fused_conf = votes[best]

    # Agreement boost
    ep_maia_agree = ep_outcome == maia_outcome
    ep_sf_agree = ep_outcome == sf_outcome
    maia_sf_agree = maia_outcome == sf_outcome

    if ep_maia_agree and ep_sf_agree:
        fused_conf = min(0.95, fused_conf * 1.15)
    elif ep_maia_agree:
        fused_conf = min(0.90, fused_conf * 1.08)
    elif not ep_maia_agree and not ep_sf_agree and not maia_sf_agree:
        fused_conf *= 0.85

    calibrated = isotonic_calibrate(fused_conf)

    vote_sum = sum(votes.values())
    probs = {k: v / vote_sum if vote_sum > 0 else 0.33 for k, v in votes.items()}

    return best, calibrated, probs, fused_conf


# ----------------------------------------------------------------------------
# Metrics
# ----------------------------------------------------------------------------

def compute_metrics(preds, confs, y_true, name, calibrated_confs=None):
    valid = np.array([p is not None and p >= 0 for p in preds])
    p = np.array(preds)[valid]
    c = np.array(confs)[valid]
    y = np.array(y_true)[valid]

    n = len(y)
    if n == 0:
        return {"name": name, "n": 0, "accuracy": None, "brier": None, "log_loss": None, "ece": None}

    correct = (p == y).astype(int)
    accuracy = correct.mean()
    brier = np.mean((c - correct) ** 2)
    eps = 1e-12
    cc = np.clip(c, eps, 1 - eps)
    ll = -np.mean(correct * np.log(cc) + (1 - correct) * np.log(1 - cc))

    # ECE 10-bin
    n_bins = 10
    ece = 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        mask = (c >= lo) & (c < hi) if b < n_bins - 1 else (c >= lo) & (c <= hi)
        nb = mask.sum()
        if nb == 0: continue
        ece += abs(correct[mask].mean() - c[mask].mean()) * (nb / n)

    result = {"name": name, "n": int(n), "accuracy": float(accuracy),
              "brier": float(brier), "log_loss": float(ll), "ece": float(ece)}

    # Also compute metrics with calibrated confidence if provided
    if calibrated_confs is not None:
        cc_arr = np.array(calibrated_confs)[valid]
        brier_cal = np.mean((cc_arr - correct) ** 2)
        cc_clip = np.clip(cc_arr, eps, 1 - eps)
        ll_cal = -np.mean(correct * np.log(cc_clip) + (1 - correct) * np.log(1 - cc_clip))
        ece_cal = 0.0
        for b in range(n_bins):
            lo, hi = b / n_bins, (b + 1) / n_bins
            mask = (cc_arr >= lo) & (cc_arr < hi) if b < n_bins - 1 else (cc_arr >= lo) & (cc_arr <= hi)
            nb = mask.sum()
            if nb == 0: continue
            ece_cal += abs(correct[mask].mean() - cc_arr[mask].mean()) * (nb / n)
        result["brier_calibrated"] = float(brier_cal)
        result["log_loss_calibrated"] = float(ll_cal)
        result["ece_calibrated"] = float(ece_cal)

    return result


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print("=" * 72)
    print("  En Pensent — FUSED Benchmark (v9.0: EP + Maia-2 + Isotonic)")
    print("=" * 72)
    print(f"  Hold-out: {args.n_holdout} | Train: {args.n_train}")
    print(f"  Maia service: {args.maia_url}")
    print(f"  Started: {datetime.now().isoformat()}")
    print()

    # Check Maia service
    try:
        resp = urllib.request.urlopen(f"{args.maia_url}/health", timeout=5)
        health = json.loads(resp.read())
        print(f"  Maia service: {health['status']} (loaded: {health['model_loaded']})")
    except Exception as e:
        print(f"  WARNING: Maia service not reachable at {args.maia_url}: {e}")
        print(f"  Start it with: python benchmark/src/maia_service.py --port 3002 --preload")
        print(f"  Continuing without Maia (fusion will fall back to SF)...")
    print()

    # Load data
    if args.input and os.path.exists(args.input):
        print(f"Loading from {args.input}...")
        df = pd.read_csv(args.input)
    else:
        print(f"Fetching {args.n_holdout + args.n_train} positions from Supabase...")
        df = fetch_positions(args.n_holdout + args.n_train)
        path = f"data/fused_benchmark_positions_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(path, index=False)
        print(f"  saved to {path}")

    holdout = df.tail(args.n_holdout).copy()
    train = df.head(max(0, len(df) - args.n_holdout)).copy()
    if len(train) > args.n_train:
        train = train.head(args.n_train)

    y_true = holdout["actual_result"].apply(normalize_result).dropna().astype(int)
    holdout = holdout.loc[y_true.index]
    y_true = y_true.values
    print(f"  hold-out: {len(y_true)} valid positions")
    print()

    results = {}

    # --- 1. EP (original, from corpus) ---
    print("--- En Pensent v8.07 (original, from corpus) ---")
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    ep_preds, ep_confs = [], []
    for r in holdout.itertuples():
        p = pred_map.get(str(getattr(r, "hybrid_prediction", "")).strip().lower(), -1)
        c = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        ep_preds.append(p)
        ep_confs.append(c)
    results["ep_v807"] = compute_metrics(ep_preds, ep_confs, y_true, "ep_v807")
    print(f"  acc={results['ep_v807']['accuracy']:.4f}  brier={results['ep_v807']['brier']:.4f}  ECE={results['ep_v807']['ece']:.4f}")
    print()

    # --- 2. SF raw (from corpus) ---
    print("--- Stockfish 18 raw (from corpus) ---")
    sf_preds, sf_confs = [], []
    for r in holdout.itertuples():
        p = pred_map.get(str(getattr(r, "stockfish_prediction", "")).strip().lower(), -1)
        c = float(getattr(r, "stockfish_confidence", 50) or 50) / 100.0
        sf_preds.append(p)
        sf_confs.append(c)
    results["sf_raw"] = compute_metrics(sf_preds, sf_confs, y_true, "sf_raw")
    print(f"  acc={results['sf_raw']['accuracy']:.4f}  brier={results['sf_raw']['brier']:.4f}  ECE={results['sf_raw']['ece']:.4f}")
    print()

    # --- 3. Calibrated SF-eval logistic ---
    print("--- Calibrated SF-eval logistic ---")
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    def sf_feat(df):
        return pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0).values.reshape(-1, 1)
    train_y = train["actual_result"].apply(normalize_result).dropna().astype(int)
    train_X = sf_feat(train.loc[train_y.index])
    scaler = StandardScaler()
    train_Xs = scaler.fit_transform(train_X)
    log_model = LogisticRegression(max_iter=1000)
    log_model.fit(train_Xs, train_y)
    ho_Xs = scaler.transform(sf_feat(holdout))
    log_proba = log_model.predict_proba(ho_Xs)
    log_preds = log_proba.argmax(axis=1)
    log_confs = log_proba.max(axis=1)
    results["calibrated_sf"] = compute_metrics(log_preds, log_confs, y_true, "calibrated_sf")
    print(f"  acc={results['calibrated_sf']['accuracy']:.4f}  brier={results['calibrated_sf']['brier']:.4f}  ECE={results['calibrated_sf']['ece']:.4f}")
    print()

    # --- 4. LightGBM ---
    print("--- LightGBM ---")
    try:
        import lightgbm as lgb
        from sklearn.preprocessing import LabelEncoder
        def lgb_feat(df):
            f = pd.DataFrame({
                "sf_eval": pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0),
                "move_number": pd.to_numeric(df.get("move_number", 20), errors="coerce").fillna(20),
                "white_elo": pd.to_numeric(df.get("white_elo", 1500), errors="coerce").fillna(1500),
                "black_elo": pd.to_numeric(df.get("black_elo", 1500), errors="coerce").fillna(1500),
            })
            f["elo_diff"] = f["white_elo"] - f["black_elo"]
            f["abs_eval"] = f["sf_eval"].abs()
            return f
        train_y_lgb = train["actual_result"].apply(normalize_result).dropna().astype(int)
        train_X_lgb = lgb_feat(train.loc[train_y_lgb.index])
        lgb_model = lgb.LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.1,
                                       num_leaves=31, verbose=-1, n_jobs=-1)
        lgb_model.fit(train_X_lgb, train_y_lgb)
        lgb_proba = lgb_model.predict_proba(lgb_feat(holdout))
        lgb_preds = lgb_proba.argmax(axis=1)
        lgb_confs = lgb_proba.max(axis=1)
        results["lightgbm"] = compute_metrics(lgb_preds, lgb_confs, y_true, "lightgbm")
        print(f"  acc={results['lightgbm']['accuracy']:.4f}  brier={results['lightgbm']['brier']:.4f}  ECE={results['lightgbm']['ece']:.4f}")
    except ImportError:
        print("  lightgbm not installed — skipping")
    print()

    # --- 5. Maia-2 (standalone) ---
    print("--- Maia-2 (standalone) ---")
    maia_preds, maia_confs = [], []
    t0 = time.time()
    for i, r in enumerate(holdout.itertuples()):
        fen = r.fen
        w_elo = int(getattr(r, "white_elo", 1500) or 1500)
        b_elo = int(getattr(r, "black_elo", 1500) or 1500)
        data = maia_infer(fen, w_elo, b_elo, args.maia_url)
        if data:
            p = pred_map.get(data.get("predicted_outcome", ""), -1)
            c = data.get("confidence", 0.33)
        else:
            p, c = -1, 0.33
        maia_preds.append(p)
        maia_confs.append(c)
        if (i + 1) % 100 == 0:
            elapsed = time.time() - t0
            print(f"  Maia-2: {i+1}/{len(holdout)} ({(i+1)/elapsed:.1f}/s)")
    elapsed = time.time() - t0
    print(f"  Maia-2 done: {len(maia_preds)} in {elapsed:.1f}s ({len(maia_preds)/elapsed:.1f}/s)")
    results["maia2"] = compute_metrics(maia_preds, maia_confs, y_true, "maia2")
    print(f"  acc={results['maia2']['accuracy']:.4f}  brier={results['maia2']['brier']:.4f}  ECE={results['maia2']['ece']:.4f}")
    print()

    # --- 6. EP + Maia + SF FUSION (v9.0) ---
    print("--- EP + Maia + SF FUSION (v9.0 with isotonic calibration) ---")
    fusion_preds, fusion_confs_raw, fusion_confs_cal = [], [], []
    t0 = time.time()
    for i, r in enumerate(holdout.itertuples()):
        # EP signal from corpus
        ep_pred_str = str(getattr(r, "hybrid_prediction", "")).strip().lower()
        ep_pred = pred_map.get(ep_pred_str, -1)
        ep_conf = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        archetype = str(getattr(r, "hybrid_archetype", "unknown")).strip().lower()

        # SF signal
        sf_eval = int(getattr(r, "stockfish_eval", 0) or 0)
        move_num = int(getattr(r, "move_number", 20) or 20)

        # Maia signal (already fetched above, reuse)
        maia_data = maia_infer(r.fen,
                               int(getattr(r, "white_elo", 1500) or 1500),
                               int(getattr(r, "black_elo", 1500) or 1500),
                               args.maia_url) if i < len(maia_preds) else None
        # Actually reuse the Maia results we already fetched
        # Re-fetch would be slow; let's reconstruct from what we have
        # We need the raw white_expected_score, not just the thresholded result
        # So we do need to call maia_infer again... but that's expensive.
        # Instead, let's fetch all Maia raw scores first.
        pass

    # Actually, let's fetch all Maia raw scores upfront for the fusion
    print("  Fetching Maia raw scores for fusion...")
    maia_raw_scores = []
    t0 = time.time()
    for i, r in enumerate(holdout.itertuples()):
        data = maia_infer(r.fen,
                          int(getattr(r, "white_elo", 1500) or 1500),
                          int(getattr(r, "black_elo", 1500) or 1500),
                          args.maia_url)
        maia_raw_scores.append(data)
        if (i + 1) % 100 == 0:
            elapsed = time.time() - t0
            print(f"  Fusion Maia fetch: {i+1}/{len(holdout)} ({(i+1)/elapsed:.1f}/s)")
    print(f"  Fetched {len(maia_raw_scores)} Maia scores in {time.time()-t0:.1f}s")

    # Now run the fusion
    print("  Running fusion...")
    for i, r in enumerate(holdout.itertuples()):
        ep_pred_str = str(getattr(r, "hybrid_prediction", "")).strip().lower()
        ep_pred_num = pred_map.get(ep_pred_str, -1)
        ep_conf = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        archetype = str(getattr(r, "hybrid_archetype", "unknown")).strip().lower()
        sf_eval = int(getattr(r, "stockfish_eval", 0) or 0)
        move_num = int(getattr(r, "move_number", 20) or 20)
        is_960 = "960" in str(getattr(r, "data_source", "")).lower() or \
                 "freestyle" in str(getattr(r, "data_source", "")).lower()

        maia_data = maia_raw_scores[i]

        best, calibrated, probs, raw_conf = fuse_predict(
            ep_pred_str, ep_conf, archetype, maia_data, sf_eval, move_num, is_960
        )
        fusion_preds.append(pred_map.get(best, -1))
        fusion_confs_raw.append(raw_conf)
        fusion_confs_cal.append(calibrated)

    # Metrics with raw fusion confidence
    results["fusion_v900_raw"] = compute_metrics(
        fusion_preds, fusion_confs_raw, y_true, "fusion_v900_raw"
    )
    # Metrics with calibrated confidence
    results["fusion_v900_calibrated"] = compute_metrics(
        fusion_preds, fusion_confs_cal, y_true, "fusion_v900_calibrated",
        calibrated_confs=fusion_confs_cal
    )
    # The calibrated metrics are in the _calibrated entry's calibrated fields
    # Let's compute directly
    valid = np.array([p >= 0 for p in fusion_preds])
    fp = np.array(fusion_preds)[valid]
    fc = np.array(fusion_confs_cal)[valid]
    fy = np.array(y_true)[valid]
    fcorrect = (fp == fy).astype(int)
    facc = fcorrect.mean()
    fbrier = np.mean((fc - fcorrect) ** 2)
    eps = 1e-12
    fcc = np.clip(fc, eps, 1 - eps)
    fll = -np.mean(fcorrect * np.log(fcc) + (1 - fcorrect) * np.log(1 - fcc))
    # ECE
    fece = 0.0
    for b in range(10):
        lo, hi = b / 10, (b + 1) / 10
        mask = (fc >= lo) & (fc < hi) if b < 9 else (fc >= lo) & (fc <= hi)
        nb = mask.sum()
        if nb == 0: continue
        fece += abs(fcorrect[mask].mean() - fc[mask].mean()) * (nb / len(fy))

    results["fusion_v900"] = {
        "name": "fusion_v900 (EP+Maia+SF+isotonic)",
        "n": int(len(fy)),
        "accuracy": float(facc),
        "brier": float(fbrier),
        "log_loss": float(fll),
        "ece": float(fece),
        "raw_confidence_brier": results["fusion_v900_raw"]["brier"],
        "raw_confidence_ece": results["fusion_v900_raw"]["ece"],
    }
    print(f"  RAW:       acc={results['fusion_v900_raw']['accuracy']:.4f}  brier={results['fusion_v900_raw']['brier']:.4f}  ECE={results['fusion_v900_raw']['ece']:.4f}")
    print(f"  CALIBRATED: acc={facc:.4f}  brier={fbrier:.4f}  logloss={fll:.4f}  ECE={fece:.4f}")
    print()

    # --- Summary ---
    print("=" * 72)
    print("  RESULTS SUMMARY — FUSED BENCHMARK")
    print("=" * 72)
    print(f"  {'Model':<40} {'N':>6} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}")
    print("  " + "-" * 86)
    order = ["ep_v807", "sf_raw", "calibrated_sf", "lightgbm", "maia2", "fusion_v900"]
    for name in order:
        if name in results and results[name].get("accuracy") is not None:
            r = results[name]
            print(f"  {r['name']:<40} {r['n']:>6} {r['accuracy']:>10.4f} "
                  f"{r['brier']:>8.4f} {r.get('log_loss', 0):>8.4f} {r['ece']:>8.4f}")
    print()

    # Edge analysis
    if "ep_v807" in results and "fusion_v900" in results:
        ep_r = results["ep_v807"]
        fu_r = results["fusion_v900"]
        print("  FUSION vs ORIGINAL EP:")
        print(f"    Accuracy:  {fu_r['accuracy']:.4f} vs {ep_r['accuracy']:.4f}  ({(fu_r['accuracy']-ep_r['accuracy'])*100:+.2f}pp)")
        print(f"    Brier:     {fu_r['brier']:.4f} vs {ep_r['brier']:.4f}  ({'fusion better' if fu_r['brier'] < ep_r['brier'] else 'EP better'})")
        print(f"    ECE:       {fu_r['ece']:.4f} vs {ep_r['ece']:.4f}  ({'fusion better' if fu_r['ece'] < ep_r['ece'] else 'EP better'})")
        print()

    # Save
    out_json = os.path.join(args.output_dir, "fused_benchmark_results.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"  Results saved to {out_json}")
    print("=" * 72)


if __name__ == "__main__":
    main()
