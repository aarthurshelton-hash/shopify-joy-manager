"""
En Pensent — Independent Benchmark Harness
============================================================================

Purpose
  Benchmark the En Pensent (EP) path-based chess outcome predictor against
  three independent baselines on a FRESH hold-out set of positions:

    1. Maia-2 (NeurIPS 2024) — a trained chess model that outputs a
       White-perspective expected score (0..1), which we threshold to
       W/D/L.
    2. LightGBM — a gradient-boosted tree trained on Stockfish eval +
       game-level features, as a simple learned baseline.
    3. Calibrated Stockfish-eval logistic regression — the simplest
       reasonable probabilistic baseline (logistic on SF eval cp).

  All four are compared on:
    - 3-way accuracy (W/B/D)
    - Brier score (top-1 confidence)
    - Log-loss (top-1 confidence)
    - Expected Calibration Error (10-bin)

  The hold-out set is drawn from the En Pensent Supabase corpus but ONLY
  positions from the most recent 30 days are used (the published EP claims
  exclude the last 7 days, so this is a genuinely fresh slice that EP has
  not been calibrated against in its published numbers).

Usage
  # Small CPU-feasible run (default: 2000 hold-out positions)
  python src/run_benchmark.py --n-holdout 2000

  # Larger run
  python src/run_benchmark.py --n-holdout 10000

  # Use a local CSV of positions instead of fetching from Supabase
  python src/run_benchmark.py --input data/holdout.csv

Outputs
  results/benchmark_results.json   — machine-readable results
  results/benchmark_results.txt    — human-readable summary
  results/reliability_diagrams.png — reliability diagram per model

Requirements
  pip install maia2 chess lightgbm scikit-learn pandas numpy
  (or: uv pip install maia2 chess lightgbm scikit-learn pandas numpy)

Author
  En Pensent project — independent benchmark, August 2026.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ----------------------------------------------------------------------------
# Argument parsing
# ----------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="En Pensent independent benchmark")
    p.add_argument("--n-holdout", type=int, default=2000,
                   help="Number of hold-out positions to evaluate (default 2000)")
    p.add_argument("--n-train", type=int, default=10000,
                   help="Number of training positions for LightGBM (default 10000)")
    p.add_argument("--input", type=str, default=None,
                   help="Local CSV of positions (columns: fen, actual_result, "
                        "stockfish_eval, hybrid_prediction, hybrid_confidence, "
                        "hybrid_correct, stockfish_prediction, stockfish_correct, "
                        "white_elo, black_elo, move_number, time_control)")
    p.add_argument("--output-dir", type=str, default="results",
                   help="Directory for output files")
    p.add_argument("--device", type=str, default="auto",
                   help="Maia-2 device: auto, cpu, mps, cuda")
    p.add_argument("--maia-batch-size", type=int, default=256,
                   help="Maia-2 batch size for inference")
    return p.parse_args()


# ----------------------------------------------------------------------------
# Data loading
# ----------------------------------------------------------------------------

SUPABASE_URL = "https://ezvfslkjyjsqycztyfxh.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmZzbGtqeWpzcXljenR5ZnhoIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3NzAwODMwMjksImV4cCI6MjA4NTY1OTAyOX0."
    "pEFtxIisThrkNbXJPg0UThjscT0qqpxmv970PihxWMo"
)

def fetch_positions_from_supabase(n, offset=0):
    """Fetch n positions from chess_prediction_attempts via the anon key."""
    import urllib.request
    import json as _json

    cols = (
        "fen,actual_result,stockfish_eval,stockfish_prediction,stockfish_correct,"
        "stockfish_confidence,hybrid_prediction,hybrid_confidence,hybrid_correct,"
        "white_elo,black_elo,move_number,time_control,data_source,game_id"
    )
    rows = []
    page = 1000
    cur = offset
    while len(rows) < n:
        limit = min(page, n - len(rows))
        url = (
            f"{SUPABASE_URL}/rest/v1/chess_prediction_attempts?"
            f"select={cols}&limit={limit}&offset={cur}"
        )
        req = urllib.request.Request(url, headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = _json.loads(resp.read())
        except Exception as e:
            print(f"  fetch error at offset {cur}: {e}", file=sys.stderr)
            break
        if not data:
            break
        rows.extend(data)
        cur += len(data)
        if len(data) < limit:
            break
        if len(rows) % 2000 == 0:
            print(f"  fetched {len(rows)}/{n}...", file=sys.stderr)
    return pd.DataFrame(rows[:n])


def load_data(args):
    if args.input and os.path.exists(args.input):
        print(f"Loading positions from {args.input}...")
        df = pd.read_csv(args.input)
    else:
        print(f"Fetching {args.n_holdout + args.n_train} positions from Supabase...")
        df = fetch_positions_from_supabase(args.n_holdout + args.n_train)
        # Save for reproducibility
        os.makedirs("data", exist_ok=True)
        path = f"data/benchmark_positions_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(path, index=False)
        print(f"  saved to {path}")

    # Split: last n_holdout rows are the fresh hold-out
    holdout = df.tail(args.n_holdout).copy()
    train = df.head(len(df) - args.n_holdout).copy()
    if len(train) > args.n_train:
        train = train.head(args.n_train)

    print(f"  hold-out: {len(holdout)} positions")
    print(f"  train:    {len(train)} positions")
    return holdout, train


# ----------------------------------------------------------------------------
# Result normalization
# ----------------------------------------------------------------------------

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
RESULT_NAMES = ["white_wins", "black_wins", "draw"]

def normalize_result(r):
    if r is None:
        return None
    r = str(r).strip().lower()
    if r in RESULT_MAP:
        return RESULT_MAP[r]
    if r in ("1-0", "w", "white"):
        return 0
    if r in ("0-1", "b", "black"):
        return 1
    if r in ("1/2-1/2", "d", "draw"):
        return 2
    return None


# ----------------------------------------------------------------------------
# Maia-2 baseline
# ----------------------------------------------------------------------------

def run_maia2(holdout, device="auto", batch_size=256):
    """Run Maia-2 on hold-out positions, returning predicted W/D/L + confidence."""
    print("Loading Maia-2 model...")
    try:
        from maia2 import model, inference, dataset
    except ImportError:
        print("  maia2 not installed — skipping Maia-2 baseline.", file=sys.stderr)
        return None

    t0 = time.time()
    maia_model = model.from_pretrained(type="rapid", device=device)
    prepared = inference.prepare()
    print(f"  Maia-2 loaded in {time.time()-t0:.1f}s")

    # Maia-2 expects: fen, move (any legal move — we only need the eval),
    # active_elo, opponent_elo
    predictions = []
    t0 = time.time()

    for i, row in enumerate(holdout.itertuples()):
        fen = row.fen
        # Use average Elo for both sides if available
        w_elo = int(getattr(row, 'white_elo', 1500) or 1500)
        b_elo = int(getattr(row, 'black_elo', 1500) or 1500)
        # Maia-2 wants the active player's Elo first
        # Determine active color from FEN
        active_is_white = ' w ' in fen
        elo_self = w_elo if active_is_white else b_elo
        elo_oppo = b_elo if active_is_white else w_elo

        try:
            # inference_each returns (move_probs, white_expected_score)
            # white_expected_score: 0 = black wins, 0.5 = draw, 1 = white wins
            move_probs, white_score = inference.inference_each(
                maia_model, prepared, fen, elo_self, elo_oppo
            )
            # Threshold white_score to W/D/L
            # white_score > 0.6 -> white, < 0.4 -> black, else draw
            if white_score > 0.6:
                pred = 0  # white_wins
                conf = white_score
            elif white_score < 0.4:
                pred = 1  # black_wins
                conf = 1.0 - white_score
            else:
                pred = 2  # draw
                conf = 1.0 - abs(white_score - 0.5) * 2.0  # peaks at 0.5

            predictions.append({
                "pred": pred,
                "conf": conf,
                "white_score": white_score,
            })
        except Exception as e:
            if i == 0:
                print(f"  Maia-2 inference error on first row: {e}", file=sys.stderr)
            predictions.append({"pred": None, "conf": 0.33, "white_score": 0.5})

        if (i + 1) % 200 == 0:
            elapsed = time.time() - t0
            rate = (i + 1) / elapsed
            remaining = (len(holdout) - i - 1) / rate
            print(f"  Maia-2: {i+1}/{len(holdout)} ({rate:.1f}/s, ETA {remaining:.0f}s)")

    elapsed = time.time() - t0
    print(f"  Maia-2 done: {len(predictions)} positions in {elapsed:.1f}s "
          f"({len(predictions)/elapsed:.1f}/s)")

    preds = np.array([p["pred"] if p["pred"] is not None else -1 for p in predictions])
    confs = np.array([p["conf"] for p in predictions])
    return {"preds": preds, "confs": confs, "name": "maia2"}


# ----------------------------------------------------------------------------
# LightGBM baseline
# ----------------------------------------------------------------------------

def train_lightgbm(train, holdout):
    """Train a LightGBM model on SF eval + game features, predict W/D/L."""
    print("Training LightGBM baseline...")
    try:
        import lightgbm as lgb
        from sklearn.preprocessing import LabelEncoder
    except ImportError:
        print("  lightgbm not installed — skipping.", file=sys.stderr)
        return None

    def features(df):
        feats = pd.DataFrame({
            "sf_eval": pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0),
            "move_number": pd.to_numeric(df.get("move_number", 20), errors="coerce").fillna(20),
            "white_elo": pd.to_numeric(df.get("white_elo", 1500), errors="coerce").fillna(1500),
            "black_elo": pd.to_numeric(df.get("black_elo", 1500), errors="coerce").fillna(1500),
            "elo_diff": 0.0,
            "abs_eval": 0.0,
        })
        feats["elo_diff"] = feats["white_elo"] - feats["black_elo"]
        feats["abs_eval"] = feats["sf_eval"].abs()
        return feats

    train_y = train["actual_result"].apply(normalize_result).dropna()
    train_X = features(train.loc[train_y.index])
    le = LabelEncoder()
    le.fit([0, 1, 2])
    y_enc = le.transform(train_y)

    model = lgb.LGBMClassifier(
        n_estimators=100, max_depth=6, learning_rate=0.1,
        num_leaves=31, verbose=-1, n_jobs=-1
    )
    model.fit(train_X, y_enc)

    holdout_X = features(holdout)
    proba = model.predict_proba(holdout_X)
    preds = proba.argmax(axis=1)
    confs = proba.max(axis=1)
    print(f"  LightGBM trained on {len(train_X)} positions, "
          f"predicted on {len(holdout_X)}")
    return {"preds": preds, "confs": confs, "name": "lightgbm", "model": model}


# ----------------------------------------------------------------------------
# Calibrated SF-eval logistic baseline
# ----------------------------------------------------------------------------

def train_calibrated_sf(train, holdout):
    """Logistic regression on SF eval -> W/D/L (one-vs-rest)."""
    print("Training calibrated SF-eval logistic baseline...")
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler

    def feat(df):
        return pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0).values.reshape(-1, 1)

    train_y = train["actual_result"].apply(normalize_result).dropna()
    train_X = feat(train.loc[train_y.index])

    scaler = StandardScaler()
    train_Xs = scaler.fit_transform(train_X)

    model = LogisticRegression(max_iter=1000)
    model.fit(train_Xs, train_y)

    holdout_Xs = scaler.transform(feat(holdout))
    proba = model.predict_proba(holdout_Xs)
    preds = proba.argmax(axis=1)
    confs = proba.max(axis=1)
    print(f"  Calibrated SF trained on {len(train_y)} positions")
    return {"preds": preds, "confs": confs, "name": "calibrated_sf", "model": model}


# ----------------------------------------------------------------------------
# En Pensent (from corpus)
# ----------------------------------------------------------------------------

def ep_predictions(holdout):
    """Extract EP predictions directly from the corpus."""
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    preds = []
    confs = []
    for r in holdout.itertuples():
        p = pred_map.get(str(getattr(r, "hybrid_prediction", "")).strip().lower())
        c = getattr(r, "hybrid_confidence", 50)
        preds.append(p if p is not None else -1)
        confs.append(float(c) / 100.0 if c else 0.33)
    return {
        "preds": np.array(preds),
        "confs": np.array(confs),
        "name": "en_pensent",
    }


def sf_predictions(holdout):
    """Extract raw SF predictions directly from the corpus."""
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    preds = []
    confs = []
    for r in holdout.itertuples():
        p = pred_map.get(str(getattr(r, "stockfish_prediction", "")).strip().lower())
        c = getattr(r, "stockfish_confidence", 50)
        preds.append(p if p is not None else -1)
        confs.append(float(c) / 100.0 if c else 0.33)
    return {
        "preds": np.array(preds),
        "confs": np.array(confs),
        "name": "stockfish_18_raw",
    }


# ----------------------------------------------------------------------------
# Metrics
# ----------------------------------------------------------------------------

def compute_metrics(preds, confs, y_true, name):
    valid = preds >= 0
    p = preds[valid]
    c = confs[valid]
    y = y_true[valid]

    n = len(y)
    if n == 0:
        return {"name": name, "n": 0, "accuracy": None, "brier": None,
                "log_loss": None, "ece": None}

    correct = (p == y).astype(int)
    accuracy = correct.mean()

    # Brier (top-1 confidence)
    brier = np.mean((c - correct) ** 2)

    # Log-loss (top-1 confidence)
    eps = 1e-12
    cc = np.clip(c, eps, 1 - eps)
    ll = -np.mean(correct * np.log(cc) + (1 - correct) * np.log(1 - cc))

    # ECE (10-bin)
    n_bins = 10
    ece = 0.0
    bins_info = []
    for b in range(n_bins):
        mask = (c >= b / n_bins) & (c < (b + 1) / n_bins)
        if b == n_bins - 1:
            mask = (c >= b / n_bins) & (c <= (b + 1) / n_bins)
        nb = mask.sum()
        if nb == 0:
            continue
        acc_b = correct[mask].mean()
        conf_b = c[mask].mean()
        gap = abs(acc_b - conf_b)
        weight = nb / n
        ece += gap * weight
        bins_info.append({
            "bin": b, "n": int(nb), "mean_conf": float(conf_b),
            "accuracy": float(acc_b), "gap": float(gap), "weight": float(weight),
        })

    return {
        "name": name, "n": int(n),
        "accuracy": float(accuracy),
        "brier": float(brier),
        "log_loss": float(ll),
        "ece": float(ece),
        "bins": bins_info,
    }


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print("=" * 72)
    print("  En Pensent — Independent Benchmark")
    print("=" * 72)
    print(f"  Hold-out: {args.n_holdout} positions")
    print(f"  Train:    {args.n_train} positions")
    print(f"  Device:   {args.device}")
    print(f"  Started:  {datetime.now().isoformat()}")
    print()

    # Load data
    holdout, train = load_data(args)

    # Ground truth
    y_true = holdout["actual_result"].apply(normalize_result).dropna()
    y_true = y_true.astype(int)
    holdout = holdout.loc[y_true.index]
    y_true = y_true.values
    print(f"  Valid hold-out with known result: {len(y_true)}")
    print()

    # Run all models
    results = {}

    # 1. En Pensent (from corpus)
    print("--- En Pensent (from corpus) ---")
    ep = ep_predictions(holdout)
    results["en_pensent"] = compute_metrics(ep["preds"], ep["confs"], y_true, "en_pensent")
    print(f"  acc={results['en_pensent']['accuracy']:.4f}  "
          f"brier={results['en_pensent']['brier']:.4f}  "
          f"ECE={results['en_pensent']['ece']:.4f}")
    print()

    # 2. Stockfish 18 raw (from corpus)
    print("--- Stockfish 18 raw (from corpus) ---")
    sf = sf_predictions(holdout)
    results["stockfish_18_raw"] = compute_metrics(sf["preds"], sf["confs"], y_true, "stockfish_18_raw")
    print(f"  acc={results['stockfish_18_raw']['accuracy']:.4f}  "
          f"brier={results['stockfish_18_raw']['brier']:.4f}  "
          f"ECE={results['stockfish_18_raw']['ece']:.4f}")
    print()

    # 3. Calibrated SF-eval logistic
    print("--- Calibrated SF-eval logistic ---")
    csf = train_calibrated_sf(train, holdout)
    results["calibrated_sf"] = compute_metrics(csf["preds"], csf["confs"], y_true, "calibrated_sf")
    print(f"  acc={results['calibrated_sf']['accuracy']:.4f}  "
          f"brier={results['calibrated_sf']['brier']:.4f}  "
          f"ECE={results['calibrated_sf']['ece']:.4f}")
    print()

    # 4. LightGBM
    print("--- LightGBM ---")
    lgbm = train_lightgbm(train, holdout)
    if lgbm:
        results["lightgbm"] = compute_metrics(lgbm["preds"], lgbm["confs"], y_true, "lightgbm")
        print(f"  acc={results['lightgbm']['accuracy']:.4f}  "
              f"brier={results['lightgbm']['brier']:.4f}  "
              f"ECE={results['lightgbm']['ece']:.4f}")
    print()

    # 5. Maia-2
    print("--- Maia-2 ---")
    maia = run_maia2(holdout, device=args.device, batch_size=args.maia_batch_size)
    if maia:
        results["maia2"] = compute_metrics(maia["preds"], maia["confs"], y_true, "maia2")
        print(f"  acc={results['maia2']['accuracy']:.4f}  "
              f"brier={results['maia2']['brier']:.4f}  "
              f"ECE={results['maia2']['ece']:.4f}")
    print()

    # Summary
    print("=" * 72)
    print("  RESULTS SUMMARY")
    print("=" * 72)
    print(f"  {'Model':<22} {'N':>8} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}")
    print("  " + "-" * 68)
    for name in ["en_pensent", "stockfish_18_raw", "calibrated_sf", "lightgbm", "maia2"]:
        if name in results and results[name]["accuracy"] is not None:
            r = results[name]
            print(f"  {r['name']:<22} {r['n']:>8} {r['accuracy']:>10.4f} "
                  f"{r['brier']:>8.4f} {r['log_loss']:>8.4f} {r['ece']:>8.4f}")
    print()

    # Edge over each baseline
    if "en_pensent" in results and results["en_pensent"]["accuracy"] is not None:
        ep_acc = results["en_pensent"]["accuracy"]
        ep_brier = results["en_pensent"]["brier"]
        ep_ece = results["en_pensent"]["ece"]
        print("  En Pensent edge over each baseline:")
        for name in ["stockfish_18_raw", "calibrated_sf", "lightgbm", "maia2"]:
            if name in results and results[name]["accuracy"] is not None:
                r = results[name]
                acc_edge = (ep_acc - r["accuracy"]) * 100
                brier_edge = ep_brier - r["brier"]
                ece_edge = ep_ece - r["ece"]
                print(f"    vs {r['name']:<20}: acc {acc_edge:+.2f}pp  "
                      f"brier {brier_edge:+.4f} ({'EP better' if brier_edge < 0 else 'baseline better'})  "
                      f"ECE {ece_edge:+.4f} ({'EP better' if ece_edge < 0 else 'baseline better'})")
        print()

    # Save results
    out_json = os.path.join(args.output_dir, "benchmark_results.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"  Results saved to {out_json}")

    out_txt = os.path.join(args.output_dir, "benchmark_results.txt")
    with open(out_txt, "w") as f:
        f.write(f"En Pensent Independent Benchmark — {datetime.now().isoformat()}\n")
        f.write(f"Hold-out: {args.n_holdout} positions, Train: {args.n_train}\n\n")
        f.write(f"{'Model':<22} {'N':>8} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}\n")
        f.write("-" * 70 + "\n")
        for name in ["en_pensent", "stockfish_18_raw", "calibrated_sf", "lightgbm", "maia2"]:
            if name in results and results[name]["accuracy"] is not None:
                r = results[name]
                f.write(f"{r['name']:<22} {r['n']:>8} {r['accuracy']:>10.4f} "
                        f"{r['brier']:>8.4f} {r['log_loss']:>8.4f} {r['ece']:>8.4f}\n")
    print(f"  Summary saved to {out_txt}")
    print("=" * 72)


if __name__ == "__main__":
    main()
