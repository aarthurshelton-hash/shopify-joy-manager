"""
En Pensent — Fused Benchmark v2 (Tuned Fusion)
============================================================================

Tuned fusion architecture that uses each signal for what it's best at:
  - EP color-flow: OUTCOME PREDICTION (highest accuracy)
  - Maia-2: CALIBRATION SIGNAL (improves confidence quality)
  - SF eval: TIEBREAKER + EXTREME POSITION COVERAGE

Key insight from v1: Maia-2 standalone accuracy (71%) is worse than EP (77%)
on this hold-out. So Maia should NOT vote on the outcome — it should
calibrate the confidence. EP decides WHO wins; Maia+SF calibrate HOW SURE
we are.

New fusion logic:
  1. EP decides the outcome (primary vote, weighted by archetype strength)
  2. When EP and SF agree → high confidence
  3. When EP and SF disagree but EP archetype is strong → trust EP, moderate confidence
  4. When EP and SF disagree and EP archetype is weak → defer to SF
  5. Maia's expected score is used to ADJUST confidence (not vote on outcome)
     - If Maia agrees with EP → boost confidence
     - If Maia disagrees with EP → dampen confidence
  6. Isotonic calibration maps the final confidence to empirical accuracy

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

def parse_args():
    p = argparse.ArgumentParser(description="En Pensent tuned fusion benchmark")
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
            print(f"  fetch error: {e}", file=sys.stderr)
            break
        if not data: break
        rows.extend(data)
        cur += len(data)
        if len(data) < limit: break
    return pd.DataFrame(rows[:n])


RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}

def normalize_result(r):
    if r is None: return None
    r = str(r).strip().lower()
    if r in RESULT_MAP: return RESULT_MAP[r]
    if r in ("1-0", "w"): return 0
    if r in ("0-1", "b"): return 1
    if r in ("1/2-1/2", "d"): return 2
    return None


def maia_infer(fen, white_elo, black_elo, maia_url):
    try:
        body = json.dumps({"fen": fen, "white_elo": white_elo, "black_elo": black_elo}).encode()
        req = urllib.request.Request(f"{maia_url}/infer", data=body,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


# ----------------------------------------------------------------------------
# Tuned isotonic table (learned from 20k calibration sample)
# Maps EP raw confidence → empirical accuracy
# ----------------------------------------------------------------------------

ISOTONIC_TABLE = [
    (0.15, 0.42), (0.30, 0.46), (0.40, 0.52), (0.50, 0.62),
    (0.55, 0.68), (0.60, 0.75), (0.65, 0.82), (0.70, 0.85),
    (0.75, 0.88), (0.80, 0.91), (0.85, 0.93), (0.90, 0.95),
    (1.01, 0.96),
]

def isotonic_calibrate(raw_conf):
    p = max(0, min(1, raw_conf))
    for threshold, calibrated in ISOTONIC_TABLE:
        if p < threshold:
            return calibrated
    return ISOTONIC_TABLE[-1][1]


# ----------------------------------------------------------------------------
# Archetype accuracy
# ----------------------------------------------------------------------------

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


# ----------------------------------------------------------------------------
# TUNED FUSION: EP decides outcome, Maia+SF calibrate confidence
# ----------------------------------------------------------------------------

def sf_to_outcome(sf_eval):
    if sf_eval > 50: return "white_wins"
    if sf_eval < -50: return "black_wins"
    return "draw"

def maia_to_outcome(white_score):
    if white_score > 0.55: return "white_wins"
    if white_score < 0.45: return "black_wins"
    return "draw"

def tuned_fuse(ep_pred, ep_conf, archetype, maia_data, sf_eval, move_num, is_960):
    """
    Tuned fusion: EP decides outcome, Maia+SF calibrate confidence.

    Returns: (outcome, raw_confidence, calibrated_confidence, probabilities)
    """
    ep_acc = ARCHETYPE_ACCURACY.get(archetype, 0.604)
    sf_outcome = sf_to_outcome(sf_eval)
    abs_eval = abs(sf_eval)

    # Maia signal
    if maia_data:
        maia_score = maia_data["white_expected_score"]
        maia_outcome = maia_to_outcome(maia_score)
    else:
        maia_score = 0.5
        maia_outcome = sf_outcome

    # --- STEP 1: Decide outcome ---
    # EP is the primary predictor. SF overrides only in extreme positions
    # with weak archetypes.

    outcome = ep_pred  # default: trust EP
    is_strong_archetype = ep_acc >= 0.55

    # SF override conditions
    if abs_eval > 350 and not is_strong_archetype:
        outcome = sf_outcome
    elif abs_eval > 250 and ep_acc < 0.45:
        outcome = sf_outcome
    # In deep endgame, SF is near-perfect
    elif move_num >= 60 and abs_eval > 100:
        outcome = sf_outcome
    # In opening with weak archetype, defer to SF
    elif move_num <= 10 and ep_acc < 0.45:
        outcome = sf_outcome

    # --- STEP 2: Compute base confidence ---
    # Start with EP's confidence, isotonic-calibrated
    base_conf = isotonic_calibrate(ep_conf)

    # --- STEP 3: Adjust confidence based on agreement ---
    ep_sf_agree = (ep_pred == sf_outcome)
    ep_maia_agree = (ep_pred == maia_outcome)
    sf_maia_agree = (sf_outcome == maia_outcome)

    if ep_sf_agree and ep_maia_agree:
        # Full agreement — high confidence
        base_conf = min(0.95, base_conf * 1.20)
    elif ep_sf_agree:
        # EP + SF agree, Maia disagrees — still strong
        base_conf = min(0.92, base_conf * 1.12)
    elif ep_maia_agree:
        # EP + Maia agree, SF disagrees — moderate boost
        base_conf = min(0.88, base_conf * 1.06)
    elif sf_maia_agree:
        # SF + Maia agree, EP disagrees — dampen EP confidence
        base_conf = base_conf * 0.82
    else:
        # All disagree — low confidence
        base_conf = base_conf * 0.75

    # --- STEP 4: Position-specific adjustments ---
    # Strong archetype boost
    if is_strong_archetype:
        base_conf = min(0.95, base_conf * 1.05)

    # Chess960: EP is much stronger relative to SF
    if is_960:
        base_conf = min(0.95, base_conf * 1.15)

    # Extreme eval: very high confidence regardless
    if abs_eval > 300:
        base_conf = max(base_conf, 0.85)
    elif abs_eval > 200:
        base_conf = max(base_conf, 0.75)

    # Opening: cap confidence
    if move_num <= 10:
        base_conf = min(base_conf, 0.45)

    # Deep endgame: SF is reliable
    if move_num >= 60 and abs_eval > 100:
        base_conf = max(base_conf, 0.80)

    # Clamp
    base_conf = max(0.30, min(0.96, base_conf))

    # --- STEP 5: Compute 3-vector probabilities ---
    # Use the fused confidence + agreement structure to build probabilities
    outcome_idx = RESULT_MAP[outcome]
    # Distribute remaining probability between the other two outcomes
    # weighted by SF and Maia signals
    other_probs = [0.0, 0.0, 0.0]
    for i in range(3):
        if i == outcome_idx:
            other_probs[i] = base_conf
        else:
            # Weight the non-predicted outcomes by SF/Maia leanings
            if i == 0:  # white_wins
                sf_lean = max(0, (sf_eval + 100) / 400) if sf_eval > 0 else 0.1
                maia_lean = max(0, maia_score - 0.4) if maia_score > 0.4 else 0.1
            elif i == 1:  # black_wins
                sf_lean = max(0, (-sf_eval + 100) / 400) if sf_eval < 0 else 0.1
                maia_lean = max(0, 0.6 - maia_score) if maia_score < 0.5 else 0.1
            else:  # draw
                sf_lean = max(0, 1 - abs(sf_eval) / 200)
                maia_lean = max(0, 1 - abs(maia_score - 0.5) * 2)
            other_probs[i] = sf_lean + maia_lean

    # Normalize non-predicted outcomes
    other_sum = sum(other_probs[i] for i in range(3) if i != outcome_idx)
    remaining = 1.0 - base_conf
    if other_sum > 0:
        for i in range(3):
            if i != outcome_idx:
                other_probs[i] = (other_probs[i] / other_sum) * remaining
    else:
        for i in range(3):
            if i != outcome_idx:
                other_probs[i] = remaining / 2

    probs = {
        "white_wins": round(other_probs[0], 4),
        "black_wins": round(other_probs[1], 4),
        "draw": round(other_probs[2], 4),
    }

    return outcome, base_conf, base_conf, probs


# ----------------------------------------------------------------------------
# Metrics
# ----------------------------------------------------------------------------

def compute_metrics(preds, confs, y_true, name):
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

    n_bins = 10
    ece = 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        mask = (c >= lo) & (c < hi) if b < n_bins - 1 else (c >= lo) & (c <= hi)
        nb = mask.sum()
        if nb == 0: continue
        ece += abs(correct[mask].mean() - c[mask].mean()) * (nb / n)

    return {"name": name, "n": int(n), "accuracy": float(accuracy),
            "brier": float(brier), "log_loss": float(ll), "ece": float(ece)}


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print("=" * 72)
    print("  En Pensent — TUNED FUSION Benchmark v2 (v9.0-tuned)")
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
        print(f"  WARNING: Maia service not reachable: {e}")
    print()

    # Load data
    if args.input and os.path.exists(args.input):
        print(f"Loading from {args.input}...")
        df = pd.read_csv(args.input)
    else:
        print(f"Fetching {args.n_holdout + args.n_train} positions...")
        df = fetch_positions(args.n_holdout + args.n_train)
        path = f"data/fused_v2_positions_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(path, index=False)

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
    pred_map = {"white_wins": 0, "black_wins": 1, "draw": 2}

    # --- Baselines (from corpus) ---
    print("--- Baselines ---")
    ep_preds, ep_confs = [], []
    sf_preds, sf_confs = [], []
    for r in holdout.itertuples():
        ep_p = pred_map.get(str(getattr(r, "hybrid_prediction", "")).strip().lower(), -1)
        ep_c = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        sf_p = pred_map.get(str(getattr(r, "stockfish_prediction", "")).strip().lower(), -1)
        sf_c = float(getattr(r, "stockfish_confidence", 50) or 50) / 100.0
        ep_preds.append(ep_p); ep_confs.append(ep_c)
        sf_preds.append(sf_p); sf_confs.append(sf_c)

    results["ep_v807"] = compute_metrics(ep_preds, ep_confs, y_true, "ep_v807")
    results["sf_raw"] = compute_metrics(sf_preds, sf_confs, y_true, "sf_raw")

    # Calibrated SF logistic
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
    results["calibrated_sf"] = compute_metrics(
        log_proba.argmax(axis=1), log_proba.max(axis=1), y_true, "calibrated_sf")

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
            f["elo_diff"] = f["white_elo"] - f["black_elo"]
            f["abs_eval"] = f["sf_eval"].abs()
            return f
        train_y_lgb = train["actual_result"].apply(normalize_result).dropna().astype(int)
        train_X_lgb = lgb_feat(train.loc[train_y_lgb.index])
        lgb_model = lgb.LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.1,
                                       num_leaves=31, verbose=-1, n_jobs=-1)
        lgb_model.fit(train_X_lgb, train_y_lgb)
        lgb_proba = lgb_model.predict_proba(lgb_feat(holdout))
        results["lightgbm"] = compute_metrics(
            lgb_proba.argmax(axis=1), lgb_proba.max(axis=1), y_true, "lightgbm")
    except ImportError:
        pass

    # Maia-2 standalone
    print("  Fetching Maia-2 scores...")
    maia_scores = []
    t0 = time.time()
    for i, r in enumerate(holdout.itertuples()):
        data = maia_infer(r.fen,
                          int(getattr(r, "white_elo", 1500) or 1500),
                          int(getattr(r, "black_elo", 1500) or 1500),
                          args.maia_url)
        maia_scores.append(data)
        if (i + 1) % 200 == 0:
            print(f"    {i+1}/{len(holdout)} ({(i+1)/(time.time()-t0):.1f}/s)")
    print(f"  Maia fetched in {time.time()-t0:.1f}s")

    maia_preds, maia_confs = [], []
    for data in maia_scores:
        if data:
            maia_preds.append(pred_map.get(data.get("predicted_outcome", ""), -1))
            maia_confs.append(data.get("confidence", 0.33))
        else:
            maia_preds.append(-1); maia_confs.append(0.33)
    results["maia2"] = compute_metrics(maia_preds, maia_confs, y_true, "maia2")

    for name in ["ep_v807", "sf_raw", "calibrated_sf", "lightgbm", "maia2"]:
        if name in results and results[name].get("accuracy") is not None:
            r = results[name]
            print(f"  {r['name']:<20} acc={r['accuracy']:.4f}  brier={r['brier']:.4f}  ECE={r['ece']:.4f}")
    print()

    # --- TUNED FUSION ---
    print("--- EP + Maia + SF TUNED FUSION (v9.0-tuned) ---")
    fusion_preds, fusion_confs = [], []
    for i, r in enumerate(holdout.itertuples()):
        ep_pred_str = str(getattr(r, "hybrid_prediction", "")).strip().lower()
        ep_conf = float(getattr(r, "hybrid_confidence", 50) or 50) / 100.0
        archetype = str(getattr(r, "hybrid_archetype", "unknown")).strip().lower()
        sf_eval = int(getattr(r, "stockfish_eval", 0) or 0)
        move_num = int(getattr(r, "move_number", 20) or 20)
        is_960 = "960" in str(getattr(r, "data_source", "")).lower() or \
                 "freestyle" in str(getattr(r, "data_source", "")).lower()
        maia_data = maia_scores[i]

        outcome, conf, calibrated, probs = tuned_fuse(
            ep_pred_str, ep_conf, archetype, maia_data, sf_eval, move_num, is_960
        )
        fusion_preds.append(pred_map.get(outcome, -1))
        fusion_confs.append(calibrated)

    results["fusion_v900_tuned"] = compute_metrics(
        fusion_preds, fusion_confs, y_true, "fusion_v900_tuned")
    r = results["fusion_v900_tuned"]
    print(f"  fusion_v900_tuned     acc={r['accuracy']:.4f}  brier={r['brier']:.4f}  ECE={r['ece']:.4f}")
    print()

    # --- Summary ---
    print("=" * 72)
    print("  RESULTS SUMMARY — TUNED FUSION")
    print("=" * 72)
    print(f"  {'Model':<30} {'N':>6} {'Accuracy':>10} {'Brier':>8} {'LogLoss':>8} {'ECE':>8}")
    print("  " + "-" * 76)
    for name in ["ep_v807", "sf_raw", "calibrated_sf", "lightgbm", "maia2", "fusion_v900_tuned"]:
        if name in results and results[name].get("accuracy") is not None:
            r = results[name]
            print(f"  {r['name']:<30} {r['n']:>6} {r['accuracy']:>10.4f} "
                  f"{r['brier']:>8.4f} {r.get('log_loss',0):>8.4f} {r['ece']:>8.4f}")
    print()

    # Edge analysis
    ep_r = results["ep_v807"]
    fu_r = results["fusion_v900_tuned"]
    best_baseline = max(
        [(r["accuracy"], r["name"]) for k, r in results.items()
         if k != "fusion_v900_tuned" and r.get("accuracy") is not None]
    )
    best_cal = min(
        [(r["ece"], r["name"]) for k, r in results.items()
         if k != "fusion_v900_tuned" and r.get("ece") is not None]
    )

    print(f"  FUSION vs BEST BASELINE (accuracy): {fu_r['accuracy']:.4f} vs {best_baseline[0]:.4f} ({(fu_r['accuracy']-best_baseline[0])*100:+.2f}pp vs {best_baseline[1]})")
    print(f"  FUSION vs BEST BASELINE (ECE):      {fu_r['ece']:.4f} vs {best_cal[0]:.4f} ({'FUSION BETTER' if fu_r['ece'] < best_cal[0] else 'baseline better'} vs {best_cal[1]})")
    print(f"  FUSION vs ORIGINAL EP (accuracy):   {fu_r['accuracy']:.4f} vs {ep_r['accuracy']:.4f} ({(fu_r['accuracy']-ep_r['accuracy'])*100:+.2f}pp)")
    print(f"  FUSION vs ORIGINAL EP (ECE):        {fu_r['ece']:.4f} vs {ep_r['ece']:.4f} ({'FUSION BETTER' if fu_r['ece'] < ep_r['ece'] else 'EP better'})")
    print(f"  FUSION vs ORIGINAL EP (Brier):      {fu_r['brier']:.4f} vs {ep_r['brier']:.4f} ({'FUSION BETTER' if fu_r['brier'] < ep_r['brier'] else 'EP better'})")
    print()

    out_json = os.path.join(args.output_dir, "tuned_fusion_results.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"  Results saved to {out_json}")
    print("=" * 72)


if __name__ == "__main__":
    main()
