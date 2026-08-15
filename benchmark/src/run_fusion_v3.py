"""
En Pensent — Fused Benchmark v3 (Learned Isotonic + Tuned Fusion)
============================================================================

Same tuned fusion as v2, but learns the isotonic calibration table from
the training split instead of using a hardcoded estimate. This should
dramatically improve ECE.

Also adds a logistic calibration (Platt scaling) alternative for comparison.

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
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression as LR_cal

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--n-holdout", type=int, default=500)
    p.add_argument("--n-train", type=int, default=3000)
    p.add_argument("--input", type=str, default=None)
    p.add_argument("--output-dir", type=str, default="results")
    p.add_argument("--maia-url", type=str, default="http://127.0.0.1:3002")
    return p.parse_args()

SUPABASE_URL = "https://ezvfslkjyjsqycztyfxh.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmZzbGtqeWpzcXljenR5ZnhoIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3NzAwODMwMjksImV4cCI6MjA4NTY1OTAyOX0."
    "pEFtxIisThrkNbXJPg0UThjscT0qqpxmv970PihxWMo"
)

def fetch_positions(n, offset=0):
    cols = ("fen,actual_result,stockfish_eval,stockfish_prediction,stockfish_correct,"
            "stockfish_confidence,hybrid_prediction,hybrid_confidence,hybrid_correct,"
            "hybrid_archetype,white_elo,black_elo,move_number,time_control,data_source,game_id")
    rows = []
    cur = offset
    while len(rows) < n:
        limit = min(1000, n - len(rows))
        url = f"{SUPABASE_URL}/rest/v1/chess_prediction_attempts?select={cols}&limit={limit}&offset={cur}"
        req = urllib.request.Request(url, headers={
            "apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"  fetch error: {e}", file=sys.stderr); break
        if not data: break
        rows.extend(data); cur += len(data)
        if len(data) < limit: break
    return pd.DataFrame(rows[:n])

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
def normalize_result(r):
    if r is None: return None
    r = str(r).strip().lower()
    if r in RESULT_MAP: return RESULT_MAP[r]
    if r in ("1-0","w"): return 0
    if r in ("0-1","b"): return 1
    if r in ("1/2-1/2","d"): return 2
    return None

def maia_infer(fen, w_elo, b_elo, url):
    try:
        body = json.dumps({"fen": fen, "white_elo": w_elo, "black_elo": b_elo}).encode()
        req = urllib.request.Request(f"{url}/infer", data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return None

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
    "piece_general_pressure": 0.80, "kingside_coordinated_siege": 0.76,
    "piece_knight_maneuver": 0.62, "central_space_advantage": 0.71,
}

def sf_to_outcome(sf_eval):
    if sf_eval > 50: return "white_wins"
    if sf_eval < -50: return "black_wins"
    return "draw"

def maia_to_outcome(ws):
    if ws > 0.55: return "white_wins"
    if ws < 0.45: return "black_wins"
    return "draw"

def tuned_fuse_raw(ep_pred, ep_conf, archetype, maia_data, sf_eval, move_num, is_960):
    """Returns (outcome, raw_confidence) — NO calibration applied."""
    ep_acc = ARCHETYPE_ACCURACY.get(archetype, 0.604)
    sf_outcome = sf_to_outcome(sf_eval)
    abs_eval = abs(sf_eval)
    if maia_data:
        maia_score = maia_data["white_expected_score"]
        maia_outcome = maia_to_outcome(maia_score)
    else:
        maia_score = 0.5; maia_outcome = sf_outcome

    # Step 1: Decide outcome (EP primary, SF overrides in extreme)
    outcome = ep_pred
    is_strong = ep_acc >= 0.55
    if abs_eval > 350 and not is_strong: outcome = sf_outcome
    elif abs_eval > 250 and ep_acc < 0.45: outcome = sf_outcome
    elif move_num >= 60 and abs_eval > 100: outcome = sf_outcome
    elif move_num <= 10 and ep_acc < 0.45: outcome = sf_outcome

    # Step 2: Base confidence from EP raw confidence (NOT isotonic — we'll calibrate later)
    base_conf = ep_conf

    # Step 3: Agreement adjustments
    ep_sf_agree = (ep_pred == sf_outcome)
    ep_maia_agree = (ep_pred == maia_outcome)
    sf_maia_agree = (sf_outcome == maia_outcome)

    if ep_sf_agree and ep_maia_agree:
        base_conf = min(0.95, base_conf * 1.20)
    elif ep_sf_agree:
        base_conf = min(0.92, base_conf * 1.12)
    elif ep_maia_agree:
        base_conf = min(0.88, base_conf * 1.06)
    elif sf_maia_agree:
        base_conf = base_conf * 0.82
    else:
        base_conf = base_conf * 0.75

    # Step 4: Position adjustments
    if is_strong: base_conf = min(0.95, base_conf * 1.05)
    if is_960: base_conf = min(0.95, base_conf * 1.15)
    if abs_eval > 300: base_conf = max(base_conf, 0.85)
    elif abs_eval > 200: base_conf = max(base_conf, 0.75)
    if move_num <= 10: base_conf = min(base_conf, 0.45)
    if move_num >= 60 and abs_eval > 100: base_conf = max(base_conf, 0.80)

    base_conf = max(0.15, min(0.96, base_conf))
    return outcome, base_conf


def compute_metrics(preds, confs, y_true, name):
    valid = np.array([p is not None and p >= 0 for p in preds])
    p = np.array(preds)[valid]; c = np.array(confs)[valid]; y = np.array(y_true)[valid]
    n = len(y)
    if n == 0: return {"name": name, "n": 0, "accuracy": None, "brier": None, "log_loss": None, "ece": None}
    correct = (p == y).astype(int)
    accuracy = float(correct.mean())
    brier = float(np.mean((c - correct) ** 2))
    eps = 1e-12
    cc = np.clip(c, eps, 1 - eps)
    ll = float(-np.mean(correct * np.log(cc) + (1 - correct) * np.log(1 - cc)))
    n_bins = 10; ece = 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        mask = (c >= lo) & (c < hi) if b < n_bins - 1 else (c >= lo) & (c <= hi)
        nb = mask.sum()
        if nb == 0: continue
        ece += abs(correct[mask].mean() - c[mask].mean()) * (nb / n)
    return {"name": name, "n": int(n), "accuracy": accuracy, "brier": brier, "log_loss": ll, "ece": float(ece)}


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    print("=" * 72)
    print("  En Pensent — FUSION v3 (Learned Isotonic Calibration)")
    print("=" * 72)
    print(f"  Hold-out: {args.n_holdout} | Train: {args.n_train}")
    print(f"  Started: {datetime.now().isoformat()}")
    print()

    # Load data
    if args.input and os.path.exists(args.input):
        df = pd.read_csv(args.input)
    else:
        df = fetch_positions(args.n_holdout + args.n_train)
    holdout = df.tail(args.n_holdout).copy()
    train = df.head(max(0, len(df) - args.n_holdout)).copy()
    if len(train) > args.n_train:
        train = train.head(args.n_train)

    y_true = holdout["actual_result"].apply(normalize_result).dropna().astype(int)
    holdout = holdout.loc[y_true.index]; y_true = y_true.values
    train_y = train["actual_result"].apply(normalize_result).dropna().astype(int)
    train = train.loc[train_y.index]
    print(f"  hold-out: {len(y_true)} | train: {len(train_y)}")
    print()

    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}
    results = {}

    # --- Baselines ---
    ep_preds, ep_confs = [], []
    sf_preds, sf_confs = [], []
    for r in holdout.itertuples():
        ep_preds.append(pred_map.get(str(getattr(r, "hybrid_prediction", "")).strip().lower(), -1))
        ep_confs.append(float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0)
        sf_preds.append(pred_map.get(str(getattr(r, "stockfish_prediction", "")).strip().lower(), -1))
        sf_confs.append(float(getattr(r, "stockfish_confidence", 50) or 50) / 100.0)
    results["ep_v807"] = compute_metrics(ep_preds, ep_confs, y_true, "ep_v807")
    results["sf_raw"] = compute_metrics(sf_preds, sf_confs, y_true, "sf_raw")

    # Calibrated SF logistic
    from sklearn.preprocessing import StandardScaler
    def sf_feat(df):
        return pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0).values.reshape(-1, 1)
    scaler = StandardScaler()
    log_model = LR_cal(max_iter=1000)
    log_model.fit(scaler.fit_transform(sf_feat(train)), train_y)
    log_proba = log_model.predict_proba(scaler.transform(sf_feat(holdout)))
    results["calibrated_sf"] = compute_metrics(log_proba.argmax(axis=1), log_proba.max(axis=1), y_true, "calibrated_sf")

    # LightGBM
    try:
        import lightgbm as lgb
        def lgb_feat(df):
            f = pd.DataFrame({
                "sf_eval": pd.to_numeric(df["stockfish_eval"], errors="coerce").fillna(0),
                "move_number": pd.to_numeric(df.get("move_number", 20), errors="coerce").fillna(20),
                "white_elo": pd.to_numeric(df.get("white_elo", 1500), errors="coerce").fillna(1500),
                "black_elo": pd.to_numeric(df.get("black_elo", 1500), errors="coerce").fillna(1500),
            })
            f["elo_diff"] = f["white_elo"] - f["black_elo"]; f["abs_eval"] = f["sf_eval"].abs()
            return f
        lgb_model = lgb.LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, num_leaves=31, verbose=-1, n_jobs=-1)
        lgb_model.fit(lgb_feat(train), train_y)
        lgb_proba = lgb_model.predict_proba(lgb_feat(holdout))
        results["lightgbm"] = compute_metrics(lgb_proba.argmax(axis=1), lgb_proba.max(axis=1), y_true, "lightgbm")
    except ImportError:
        pass

    # Maia-2
    print("  Fetching Maia-2 scores...")
    maia_scores = []
    t0 = time.time()
    for i, r in enumerate(holdout.itertuples()):
        maia_scores.append(maia_infer(r.fen, int(getattr(r, "white_elo", 1500) or 1500),
                                      int(getattr(r, "black_elo", 1500) or 1500), args.maia_url))
        if (i + 1) % 200 == 0: print(f"    {i+1}/{len(holdout)} ({(i+1)/(time.time()-t0):.1f}/s)")
    print(f"  Maia fetched in {time.time()-t0:.1f}s")

    maia_preds, maia_confs = [], []
    for d in maia_scores:
        if d: maia_preds.append(pred_map.get(d.get("predicted_outcome", ""), -1)); maia_confs.append(d.get("confidence", 0.33))
        else: maia_preds.append(-1); maia_confs.append(0.33)
    results["maia2"] = compute_metrics(maia_preds, maia_confs, y_true, "maia2")

    # --- Compute RAW fusion confidence on BOTH train and holdout ---
    print("  Computing fusion raw confidence on train set (for calibration learning)...")
    train_raw_confs = []
    train_preds = []
    train_maia = []
    # Fetch Maia for train set too (for calibration learning)
    for i, r in enumerate(train.itertuples()):
        d = maia_infer(r.fen, int(getattr(r, "white_elo", 1500) or 1500),
                       int(getattr(r, "black_elo", 1500) or 1500), args.maia_url)
        train_maia.append(d)
        if (i + 1) % 500 == 0: print(f"    train Maia: {i+1}/{len(train)}")

    for i, r in enumerate(train.itertuples()):
        ep_pred_str = str(getattr(r, "hybrid_prediction", "")).strip().lower()
        ep_conf = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        archetype = str(getattr(r, "hybrid_archetype", "unknown")).strip().lower()
        sf_eval = int(getattr(r, "stockfish_eval", 0) or 0)
        move_num = int(getattr(r, "move_number", 20) or 20)
        is_960 = "960" in str(getattr(r, "data_source", "")).lower() or "freestyle" in str(getattr(r, "data_source", "")).lower()
        outcome, raw_conf = tuned_fuse_raw(ep_pred_str, ep_conf, archetype, train_maia[i], sf_eval, move_num, is_960)
        train_preds.append(pred_map.get(outcome, -1))
        train_raw_confs.append(raw_conf)

    train_correct = (np.array(train_preds) == train_y.values).astype(int)
    train_raw = np.array(train_raw_confs)

    # --- Learn isotonic calibration from train set ---
    print("  Learning isotonic calibration from train set...")
    iso = IsotonicRegression(out_of_bounds='clip', y_min=0.01, y_max=0.99)
    iso.fit(train_raw, train_correct)

    # Also learn logistic (Platt) calibration for comparison
    log_cal = LR_cal(max_iter=1000)
    log_cal.fit(train_raw.reshape(-1, 1), train_correct)

    # --- Compute fusion on holdout ---
    print("  Computing fusion on hold-out...")
    fusion_preds, fusion_raw_confs = [], []
    for i, r in enumerate(holdout.itertuples()):
        ep_pred_str = str(getattr(r, "hybrid_prediction", "")).strip().lower()
        ep_conf = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        archetype = str(getattr(r, "hybrid_archetype", "unknown")).strip().lower()
        sf_eval = int(getattr(r, "stockfish_eval", 0) or 0)
        move_num = int(getattr(r, "move_number", 20) or 20)
        is_960 = "960" in str(getattr(r, "data_source", "")).lower() or "freestyle" in str(getattr(r, "data_source", "")).lower()
        outcome, raw_conf = tuned_fuse_raw(ep_pred_str, ep_conf, archetype, maia_scores[i], sf_eval, move_num, is_960)
        fusion_preds.append(pred_map.get(outcome, -1))
        fusion_raw_confs.append(raw_conf)

    # Apply isotonic calibration
    fusion_iso_confs = iso.predict(np.array(fusion_raw_confs))
    # Apply logistic calibration
    fusion_log_confs = log_cal.predict_proba(np.array(fusion_raw_confs).reshape(-1, 1))[:, 1]

    results["fusion_raw"] = compute_metrics(fusion_preds, fusion_raw_confs, y_true, "fusion_raw")
    results["fusion_iso"] = compute_metrics(fusion_preds, fusion_iso_confs, y_true, "fusion_iso (isotonic)")
    results["fusion_log"] = compute_metrics(fusion_preds, fusion_log_confs, y_true, "fusion_log (platt)")

    # --- Summary ---
    print()
    print("=" * 72)
    print("  RESULTS — FUSION v3 (Learned Calibration)")
    print("=" * 72)
    print(f"  {'Model':<35} {'N':>6} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}")
    print("  " + "-" * 81)
    for name in ["ep_v807", "sf_raw", "calibrated_sf", "lightgbm", "maia2",
                 "fusion_raw", "fusion_iso", "fusion_log"]:
        if name in results and results[name].get("accuracy") is not None:
            r = results[name]
            print(f"  {r['name']:<35} {r['n']:>6} {r['accuracy']:>10.4f} "
                  f"{r['brier']:>8.4f} {r.get('log_loss',0):>8.4f} {r['ece']:>8.4f}")
    print()

    # Best analysis
    fu = results["fusion_iso"]
    ep = results["ep_v807"]
    best_acc = max([(r["accuracy"], r["name"]) for k, r in results.items() if k not in ["fusion_raw","fusion_iso","fusion_log"] and r.get("accuracy")])
    best_ece = min([(r["ece"], r["name"]) for k, r in results.items() if k not in ["fusion_raw","fusion_iso","fusion_log"] and r.get("ece") is not None])
    best_brier = min([(r["brier"], r["name"]) for k, r in results.items() if k not in ["fusion_raw","fusion_iso","fusion_log"] and r.get("brier") is not None])

    print(f"  FUSION (isotonic) vs BEST baseline:")
    print(f"    Accuracy: {fu['accuracy']:.4f} vs {best_acc[0]:.4f} ({(fu['accuracy']-best_acc[0])*100:+.2f}pp vs {best_acc[1]})")
    print(f"    Brier:    {fu['brier']:.4f} vs {best_brier[0]:.4f} ({'FUSION BEST' if fu['brier'] < best_brier[0] else 'baseline better'} vs {best_brier[1]})")
    print(f"    ECE:      {fu['ece']:.4f} vs {best_ece[0]:.4f} ({'FUSION BEST' if fu['ece'] < best_ece[0] else 'baseline better'} vs {best_ece[1]})")
    print()
    print(f"  FUSION vs ORIGINAL EP:")
    print(f"    Accuracy: {fu['accuracy']:.4f} vs {ep['accuracy']:.4f} ({(fu['accuracy']-ep['accuracy'])*100:+.2f}pp)")
    print(f"    Brier:    {fu['brier']:.4f} vs {ep['brier']:.4f} ({'BETTER' if fu['brier'] < ep['brier'] else 'worse'})")
    print(f"    ECE:      {fu['ece']:.4f} vs {ep['ece']:.4f} ({'BETTER' if fu['ece'] < ep['ece'] else 'worse'})")
    print()

    out_json = os.path.join(args.output_dir, "fusion_v3_results.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2, default=str)
    # Also save the isotonic model for production use
    import pickle
    with open(os.path.join(args.output_dir, "isotonic_model.pkl"), "wb") as f:
        pickle.dump(iso, f)
    print(f"  Results saved to {out_json}")
    print(f"  Isotonic model saved to results/isotonic_model.pkl")
    print("=" * 72)


if __name__ == "__main__":
    main()
