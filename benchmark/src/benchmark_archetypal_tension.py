"""
En Pensent — Archetypal Tension Benchmark
============================================================================

This benchmark tests the REAL thesis of En Pensent:

  Chess is the cleanest dataset to prove that archetypal tension — the flow
  of opposing forces across a bounded space over time — is a universal
  predictive primitive. The color-flow grid maps this tension. The question
  is not "does EP beat Stockfish at win prediction?" but:

    1. RESIDUAL SIGNAL: After removing everything SF eval explains, does the
       archetypal tension pattern still predict the outcome?

    2. ARCHETYPE CONSISTENCY: For each archetype, what's the win rate? Is it
       stable across data sources? Does it differ from the base rate?

    3. TIME PRESSURE: Does archetype predictive power change with time control?
       (Blitz vs rapid vs classical — tension resolves differently under pressure)

    4. TENSION SHAPE: Do the continuous trajectory features (quadrant profile,
       temporal flow, intensity) carry signal that the categorical archetype
       label doesn't capture?

    5. ORTHOGONALITY: Is the archetypal signal orthogonal to SF eval? If EP
       predicts correctly when SF is wrong (and vice versa), the systems
       capture different information — and fusion should work.

Usage:
  python benchmark/src/benchmark_archetypal_tension.py
"""

import json
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)

RESULT_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}
PRED_MAP = {"white_wins": 0, "black_wins": 1, "draw": 2}


def load_data():
    train_path = os.path.join(DATA_DIR, 'training_set_v2_20260814.csv')
    holdout_path = os.path.join(DATA_DIR, 'holdout_set_v2_20260814.csv')
    train = pd.read_csv(train_path)
    holdout = pd.read_csv(holdout_path)
    print(f"Loaded: {len(train)} training, {len(holdout)} hold-out")
    return train, holdout


def classify_time_control(tc):
    """Classify time control into pressure tiers."""
    if not tc or pd.isna(tc):
        return 'unknown'
    tc = str(tc).strip()
    # Parse base time in seconds
    parts = tc.split('+')
    base = int(parts[0]) if parts[0].isdigit() else 0
    if base == 0:
        return 'unknown'
    if base <= 60:
        return 'bullet'       # < 1 min — extreme pressure
    if base <= 180:
        return 'blitz'        # 1-3 min — high pressure
    if base <= 600:
        return 'rapid'        # 3-10 min — moderate pressure
    return 'classical'        # > 10 min — low pressure


def bootstrap_ci(accuracies, n_boot=2000):
    """Bootstrap 95% CI for a mean."""
    if len(accuracies) == 0:
        return 0, 0
    boots = [np.mean(np.random.choice(accuracies, len(accuracies), replace=True)) for _ in range(n_boot)]
    return np.percentile(boots, 2.5), np.percentile(boots, 97.5)


# ═════════════════════════════════════════════════════════════
# TEST 1: RESIDUAL SIGNAL — Does archetype predict after SF eval?
# ═════════════════════════════════════════════════════════════
def test_residual_signal(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 1: RESIDUAL SIGNAL")
    print("  Does archetypal tension predict outcomes AFTER SF eval is accounted for?")
    print("=" * 70)

    # Fit SF-only model on training
    sf_cols = ['stockfish_eval']
    X_train = train[sf_cols].fillna(0).values
    y_train = train['result_numeric'].values
    X_hold = holdout[sf_cols].fillna(0).values
    y_hold = holdout['result_numeric'].values

    sf_model = LogisticRegression(max_iter=2000, C=0.5)
    sf_model.fit(X_train, y_train)
    sf_probs = sf_model.predict_proba(X_hold)
    sf_pred = sf_probs.argmax(axis=1)
    sf_acc = (sf_pred == y_hold).mean()

    # Residual: cases where SF is WRONG
    sf_wrong = sf_pred != y_hold
    n_wrong = sf_wrong.sum()
    print(f"\n  SF accuracy: {sf_acc*100:.1f}% ({n_wrong}/{len(y_hold)} wrong)")

    # Among SF-wrong cases, does the archetype predict the right answer?
    # Compare archetype distribution of SF-wrong-correct vs SF-wrong-also-wrong
    if n_wrong < 10:
        print("  Too few SF-wrong cases for residual analysis")
        return {'sf_acc': sf_acc, 'n_wrong': n_wrong}

    # For each archetype, what's the EP accuracy on SF-wrong cases?
    hold_wrong = holdout[sf_wrong].copy()
    hold_wrong['sf_pred'] = sf_pred[sf_wrong]
    hold_wrong['ep_pred'] = hold_wrong['ep_pred_num']
    hold_wrong['ep_correct_on_sf_wrong'] = hold_wrong['ep_pred'] == hold_wrong['result_numeric']

    print(f"\n  EP accuracy on SF-wrong cases: {hold_wrong['ep_correct_on_sf_wrong'].mean()*100:.1f}%")
    print(f"  (Base rate if random: ~33% for 3-class)")

    # Per-archetype EP rescue rate
    arch_rescue = hold_wrong.groupby('hybrid_archetype').agg(
        n=('ep_correct_on_sf_wrong', 'count'),
        rescue_rate=('ep_correct_on_sf_wrong', 'mean')
    ).sort_values('n', ascending=False)

    print(f"\n  EP rescue rate by archetype (on SF-wrong cases):")
    print(f"  {'Archetype':<40} {'N':>5} {'Rescue%':>8}")
    print(f"  {'-'*55}")
    for arch, row in arch_rescue.head(15).iterrows():
        if row['n'] >= 3:
            print(f"  {str(arch):<40} {int(row['n']):>5} {row['rescue_rate']*100:>7.1f}%")

    # Statistical test: is EP's rescue rate significantly above chance (33%)?
    rescue_rates = hold_wrong['ep_correct_on_sf_wrong'].astype(int).values
    if len(rescue_rates) >= 10:
        t_stat, p_val = stats.ttest_1samp(rescue_rates, 0.33)
        lo, hi = bootstrap_ci(rescue_rates)
        print(f"\n  Rescue rate: {rescue_rates.mean()*100:.1f}% [CI: {lo*100:.1f}%, {hi*100:.1f}%]")
        print(f"  vs chance (33%): t={t_stat:.2f}, p={p_val:.4f}")
        sig = "SIGNIFICANT" if p_val < 0.05 else "NOT SIGNIFICANT"
        print(f"  → {sig}")

    return {
        'sf_acc': sf_acc,
        'n_wrong': int(n_wrong),
        'ep_rescue_rate': float(rescue_rates.mean()) if len(rescue_rates) >= 10 else None,
    }


# ═════════════════════════════════════════════════════════════
# TEST 2: ARCHETYPE CONSISTENCY — Win rates per archetype
# ═════════════════════════════════════════════════════════════
def test_archetype_consistency(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 2: ARCHETYPE CONSISTENCY")
    print("  Does each archetype have a stable, non-base-rate win rate?")
    print("=" * 70)

    # Overall base rate
    base_rate = train['result_numeric'].value_counts(normalize=True)
    print(f"\n  Base rate (training):")
    for r, p in base_rate.items():
        name = {0: 'white_wins', 1: 'black_wins', 2: 'draw'}[r]
        print(f"    {name}: {p*100:.1f}%")

    # Per-archetype win rates (training)
    arch_stats = train.groupby('hybrid_archetype').agg(
        n=('result_numeric', 'count'),
        white_rate=('result_numeric', lambda x: (x == 0).mean()),
        black_rate=('result_numeric', lambda x: (x == 1).mean()),
        draw_rate=('result_numeric', lambda x: (x == 2).mean()),
        ep_acc=('hybrid_correct', 'mean'),
    ).sort_values('n', ascending=False)

    # Filter to archetypes with enough samples
    arch_stats = arch_stats[arch_stats['n'] >= 10]

    print(f"\n  Archetype win rates (n≥10):")
    print(f"  {'Archetype':<40} {'N':>5} {'White%':>7} {'Black%':>7} {'Draw%':>7} {'EP Acc%':>8}")
    print(f"  {'-'*78}")
    for arch, row in arch_stats.iterrows():
        print(f"  {str(arch):<40} {int(row['n']):>5} {row['white_rate']*100:>6.1f}% {row['black_rate']*100:>6.1f}% {row['draw_rate']*100:>6.1f}% {row['ep_acc']*100:>7.1f}%")

    # Chi-square test: does archetype distribution differ from base rate?
    contingency = np.zeros((len(arch_stats), 3))
    for i, (arch, row) in enumerate(arch_stats.iterrows()):
        contingency[i] = [row['n'] * row['white_rate'], row['n'] * row['black_rate'], row['n'] * row['draw_rate']]
    chi2, p_val, dof, expected = stats.chi2_contingency(contingency)
    print(f"\n  Chi-square test (archetype vs base rate): χ²={chi2:.2f}, p={p_val:.4f}")
    sig = "SIGNIFICANT — archetypes have different outcome distributions" if p_val < 0.05 else "NOT SIGNIFICANT"
    print(f"  → {sig}")

    # Consistency: compare training vs hold-out win rates per archetype
    holdout_arch = holdout.groupby('hybrid_archetype').agg(
        n_hold=('result_numeric', 'count'),
        white_rate_hold=('result_numeric', lambda x: (x == 0).mean()),
        ep_acc_hold=('hybrid_correct', 'mean'),
    )

    consistency = arch_stats.join(holdout_arch, how='inner')
    consistency = consistency[consistency['n_hold'] >= 5]

    if len(consistency) >= 3:
        print(f"\n  Consistency (train vs hold-out, n_hold≥5):")
        print(f"  {'Archetype':<40} {'N_tr':>5} {'N_hd':>5} {'W_tr%':>6} {'W_hd%':>6} {'EP_tr%':>7} {'EP_hd%':>7}")
        print(f"  {'-'*80}")
        for arch, row in consistency.iterrows():
            print(f"  {str(arch):<40} {int(row['n']):>5} {int(row['n_hold']):>5} {row['white_rate']*100:>5.1f}% {row['white_rate_hold']*100:>5.1f}% {row['ep_acc']*100:>6.1f}% {row['ep_acc_hold']*100:>6.1f}%")

        # Correlation between train and holdout win rates
        if len(consistency) >= 5:
            r_white, p_white = stats.pearsonr(consistency['white_rate'], consistency['white_rate_hold'])
            r_ep, p_ep = stats.pearsonr(consistency['ep_acc'], consistency['ep_acc_hold'])
            print(f"\n  Train→Hold-out correlation:")
            print(f"    White win rate: r={r_white:.3f} (p={p_white:.4f})")
            print(f"    EP accuracy:     r={r_ep:.3f} (p={p_ep:.4f})")
            sig_w = "STABLE" if r_white > 0.5 else "UNSTABLE"
            sig_e = "STABLE" if r_ep > 0.5 else "UNSTABLE"
            print(f"    → White rate: {sig_w}, EP accuracy: {sig_e}")

    return {
        'n_archetypes': len(arch_stats),
        'chi2': float(chi2),
        'chi2_p': float(p_val),
    }


# ═════════════════════════════════════════════════════════════
# TEST 3: TIME PRESSURE — Does archetype power change with time control?
# ═════════════════════════════════════════════════════════════
def test_time_pressure(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 3: TIME PRESSURE")
    print("  Does archetypal tension resolve differently under time pressure?")
    print("=" * 70)

    # Combine train + holdout for this analysis (we're not training a model,
    # just measuring outcome distributions)
    all_data = pd.concat([train, holdout], ignore_index=True)
    all_data['pressure'] = all_data['time_control'].apply(classify_time_control)

    pressure_counts = all_data['pressure'].value_counts()
    print(f"\n  Time pressure distribution:")
    for p, n in pressure_counts.items():
        print(f"    {p}: {n}")

    # For each pressure tier: overall accuracy and archetype accuracy
    print(f"\n  Accuracy by time pressure:")
    print(f"  {'Pressure':<15} {'N':>6} {'SF Acc%':>8} {'EP Acc%':>8} {'White%':>7} {'Draw%':>7}")
    print(f"  {'-'*55}")

    pressure_results = {}
    for pressure in ['bullet', 'blitz', 'rapid', 'classical', 'unknown']:
        subset = all_data[all_data['pressure'] == pressure]
        if len(subset) < 10:
            continue
        sf_acc = subset['stockfish_correct'].mean()
        ep_acc = subset['hybrid_correct'].mean()
        white_rate = (subset['result_numeric'] == 0).mean()
        draw_rate = (subset['result_numeric'] == 2).mean()
        pressure_results[pressure] = {
            'n': len(subset), 'sf_acc': sf_acc, 'ep_acc': ep_acc,
            'white_rate': white_rate, 'draw_rate': draw_rate
        }
        print(f"  {pressure:<15} {len(subset):>6} {sf_acc*100:>7.1f}% {ep_acc*100:>7.1f}% {white_rate*100:>6.1f}% {draw_rate*100:>6.1f}%")

    # For each archetype, does accuracy change with pressure?
    print(f"\n  Archetype accuracy by pressure (n≥5 per cell):")
    print(f"  {'Archetype':<35} {'Blitz':>10} {'Rapid':>10} {'Classical':>10} {'Δ':>7}")
    print(f"  {'-'*75}")

    arch_pressure = all_data.groupby(['hybrid_archetype', 'pressure']).agg(
        n=('result_numeric', 'count'),
        ep_acc=('hybrid_correct', 'mean'),
        sf_acc=('stockfish_correct', 'mean'),
    ).reset_index()

    # Pivot for top archetypes
    top_archetypes = all_data['hybrid_archetype'].value_counts()
    top_archetypes = top_archetypes[top_archetypes >= 30].index

    for arch in top_archetypes:
        arch_data = arch_pressure[arch_pressure['hybrid_archetype'] == arch]
        row_data = {}
        for _, r in arch_data.iterrows():
            if r['n'] >= 5:
                row_data[r['pressure']] = (r['ep_acc'], r['n'])

        vals = []
        labels = []
        for p in ['blitz', 'rapid', 'classical']:
            if p in row_data:
                vals.append(row_data[p][0])
                labels.append(f"{row_data[p][0]*100:.0f}%({int(row_data[p][1])})")
            else:
                labels.append("—")

        delta = max(vals) - min(vals) if len(vals) >= 2 else 0
        print(f"  {str(arch):<35} {labels[0]:>10} {labels[1]:>10} {labels[2]:>10} {delta*100:>+6.1f}pp")

    # Key question: does EP's edge over SF change with pressure?
    print(f"\n  EP edge over SF by pressure:")
    for pressure, res in pressure_results.items():
        edge = res['ep_acc'] - res['sf_acc']
        print(f"    {pressure:<15} EP-SF = {edge*100:+.1f}pp")

    return pressure_results


# ═════════════════════════════════════════════════════════════
# TEST 4: TENSION SHAPE — Continuous trajectory features
# ═════════════════════════════════════════════════════════════
def test_tension_shape(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 4: TENSION SHAPE")
    print("  Do continuous trajectory features carry signal beyond the archetype label?")
    print("=" * 70)

    traj_cols = ['q_kingside_white', 'q_kingside_black', 'q_queenside_white',
                 'q_queenside_black', 'q_center',
                 'tf_opening', 'tf_middlegame', 'tf_endgame', 'tf_volatility',
                 'cf_intensity']

    # Check coverage
    has_traj = train[traj_cols].notna().all(axis=1)
    print(f"\n  Trajectory feature coverage: {has_traj.sum()}/{len(train)} training, "
          f"{holdout[traj_cols].notna().all(axis=1).sum()}/{len(holdout)} hold-out")

    if has_traj.sum() < 100:
        print("  Insufficient trajectory coverage for analysis")
        return {}

    # Filter to rows with trajectory data
    tr = train[has_traj].copy()
    ho = holdout[holdout[traj_cols].notna().all(axis=1)].copy()

    y_train = tr['result_numeric'].values
    y_hold = ho['result_numeric'].values

    # Model 1: SF eval only
    X1_train = tr[['stockfish_eval']].fillna(0).values
    X1_hold = ho[['stockfish_eval']].fillna(0).values
    m1 = LogisticRegression(max_iter=2000, C=0.5)
    m1.fit(X1_train, y_train)
    p1 = m1.predict_proba(X1_hold)
    acc1 = (p1.argmax(axis=1) == y_hold).mean()

    # Model 2: SF + trajectory features
    X2_train = tr[['stockfish_eval'] + traj_cols].fillna(0).values
    X2_hold = ho[['stockfish_eval'] + traj_cols].fillna(0).values
    scaler = StandardScaler()
    X2_train_s = scaler.fit_transform(X2_train)
    X2_hold_s = scaler.transform(X2_hold)
    m2 = LogisticRegression(max_iter=2000, C=0.5)
    m2.fit(X2_train_s, y_train)
    p2 = m2.predict_proba(X2_hold_s)
    acc2 = (p2.argmax(axis=1) == y_hold).mean()

    # Model 3: Trajectory only (no SF)
    X3_train = tr[traj_cols].fillna(0).values
    X3_hold = ho[traj_cols].fillna(0).values
    scaler3 = StandardScaler()
    X3_train_s = scaler3.fit_transform(X3_train)
    X3_hold_s = scaler3.transform(X3_hold)
    m3 = LogisticRegression(max_iter=2000, C=0.5)
    m3.fit(X3_train_s, y_train)
    p3 = m3.predict_proba(X3_hold_s)
    acc3 = (p3.argmax(axis=1) == y_hold).mean()

    print(f"\n  Model comparison:")
    print(f"    SF eval only:              {acc1*100:.1f}%")
    print(f"    Trajectory only (no SF):   {acc3*100:.1f}%")
    print(f"    SF + trajectory:           {acc2*100:.1f}%")
    print(f"    Δ (trajectory adds):       {(acc2-acc1)*100:+.1f}pp")

    # Log-loss comparison (more sensitive than accuracy)
    from sklearn.metrics import log_loss
    ll1 = log_loss(y_hold, p1, labels=[0, 1, 2])
    ll2 = log_loss(y_hold, p2, labels=[0, 1, 2])
    ll3 = log_loss(y_hold, p3, labels=[0, 1, 2])
    print(f"\n  Log-loss (lower = better):")
    print(f"    SF eval only:              {ll1:.4f}")
    print(f"    Trajectory only (no SF):   {ll3:.4f}")
    print(f"    SF + trajectory:           {ll2:.4f}")
    print(f"    Δ (trajectory adds):       {(ll2-ll1):+.4f}")

    # Feature importance: which trajectory features matter most?
    coefs = m2.coef_  # (3_classes, n_features)
    feature_names = ['sf_eval'] + traj_cols
    # Sum absolute coefficients across classes as importance
    importance = np.abs(coefs).sum(axis=0)
    imp_df = pd.DataFrame({'feature': feature_names, 'importance': importance})
    imp_df = imp_df.sort_values('importance', ascending=False)

    print(f"\n  Feature importance (|coefficient| summed across classes):")
    for _, row in imp_df.iterrows():
        print(f"    {row['feature']:<25} {row['importance']:.4f}")

    # Key question: does trajectory-only model capture DIFFERENT information?
    # Compare predictions where SF and trajectory disagree
    sf_pred = p1.argmax(axis=1)
    traj_pred = p3.argmax(axis=1)
    disagree = sf_pred != traj_pred
    n_disagree = disagree.sum()
    if n_disagree >= 10:
        sf_correct_on_disagree = (sf_pred[disagree] == y_hold[disagree]).mean()
        traj_correct_on_disagree = (traj_pred[disagree] == y_hold[disagree]).mean()
        print(f"\n  When SF and trajectory disagree ({n_disagree} cases):")
        print(f"    SF correct:     {sf_correct_on_disagree*100:.1f}%")
        print(f"    Trajectory correct: {traj_correct_on_disagree*100:.1f}%")
        if traj_correct_on_disagree > sf_correct_on_disagree:
            print(f"    → Trajectory captures DIFFERENT signal than SF!")
        else:
            print(f"    → SF is more reliable when they disagree")

    return {
        'sf_only_acc': acc1,
        'traj_only_acc': acc3,
        'sf_plus_traj_acc': acc2,
        'sf_only_logloss': ll1,
        'sf_plus_traj_logloss': ll2,
        'n_disagree': int(n_disagree),
    }


# ═════════════════════════════════════════════════════════════
# TEST 5: ORTHOGONALITY — Do EP and SF capture different information?
# ═════════════════════════════════════════════════════════════
def test_orthogonality(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 5: ORTHOGONALITY")
    print("  Do EP and SF capture different information?")
    print("=" * 70)

    y = holdout['result_numeric'].values
    sf_correct = holdout['stockfish_correct'].values
    ep_correct = holdout['hybrid_correct'].values

    # Confusion matrix
    both_correct = (sf_correct & ep_correct).sum()
    sf_only = (sf_correct & ~ep_correct).sum()
    ep_only = (~sf_correct & ep_correct).sum()
    neither = (~sf_correct & ~ep_correct).sum()
    n = len(y)

    print(f"\n  EP vs SF agreement matrix (n={n}):")
    print(f"                       EP correct   EP wrong")
    print(f"    SF correct:        {both_correct:>10}   {sf_only:>10}")
    print(f"    SF wrong:          {ep_only:>10}   {neither:>10}")

    sf_acc = sf_correct.mean()
    ep_acc = ep_correct.mean()
    # If they were independent, expected both correct = sf_acc * ep_acc * n
    expected_both = sf_acc * ep_acc * n
    print(f"\n  SF accuracy: {sf_acc*100:.1f}%")
    print(f"  EP accuracy: {ep_acc*100:.1f}%")
    print(f"  Both correct: {both_correct} (expected if independent: {expected_both:.0f})")

    if both_correct > expected_both:
        print(f"  → EP and SF are CORRELATED (overlap more than expected)")
    else:
        print(f"  → EP and SF are ORTHOGONAL (capture different information)")

    # McNemar's test: is the difference between sf_only and ep_only significant?
    if sf_only + ep_only >= 10:
        mcnemar_stat = (abs(sf_only - ep_only) - 1) ** 2 / (sf_only + ep_only)
        mcnemar_p = 1 - stats.chi2.cdf(mcnemar_stat, 1)
        print(f"\n  McNemar's test: χ²={mcnemar_stat:.2f}, p={mcnemar_p:.4f}")
        if mcnemar_p < 0.05:
            if ep_only > sf_only:
                print(f"  → EP is SIGNIFICANTLY better than SF (rescues more cases)")
            else:
                print(f"  → SF is SIGNIFICANTLY better than EP")
        else:
            print(f"  → No significant difference between EP and SF")

    # Per-archetype: where does EP rescue SF?
    print(f"\n  EP rescue rate by archetype (SF wrong, EP correct):")
    hold = holdout.copy()
    hold['sf_wrong'] = ~hold['stockfish_correct']
    hold['ep_rescue'] = hold['sf_wrong'] & hold['hybrid_correct']

    arch_rescue = hold[hold['sf_wrong']].groupby('hybrid_archetype').agg(
        n_sf_wrong=('sf_wrong', 'count'),
        rescues=('ep_rescue', 'sum'),
    )
    arch_rescue['rescue_rate'] = arch_rescue['rescues'] / arch_rescue['n_sf_wrong']
    arch_rescue = arch_rescue[arch_rescue['n_sf_wrong'] >= 3].sort_values('rescue_rate', ascending=False)

    print(f"  {'Archetype':<40} {'SF Wrong':>8} {'EP Rescues':>11} {'Rate%':>7}")
    print(f"  {'-'*68}")
    for arch, row in arch_rescue.head(15).iterrows():
        print(f"  {str(arch):<40} {int(row['n_sf_wrong']):>8} {int(row['rescues']):>11} {row['rescue_rate']*100:>6.1f}%")

    return {
        'both_correct': int(both_correct),
        'sf_only': int(sf_only),
        'ep_only': int(ep_only),
        'neither': int(neither),
        'expected_both_if_independent': float(expected_both),
    }


# ═════════════════════════════════════════════════════════════
# TEST 6: TENSION DYNAMICS — How does tension evolve over game phases?
# ═════════════════════════════════════════════════════════════
def test_tension_dynamics(train, holdout):
    print("\n" + "=" * 70)
    print("  TEST 6: TENSION DYNAMICS")
    print("  How does archetypal tension evolve across game phases?")
    print("=" * 70)

    all_data = pd.concat([train, holdout], ignore_index=True)
    has_traj = all_data[['tf_opening', 'tf_middlegame', 'tf_endgame', 'cf_intensity']].notna().all(axis=1)
    traj_data = all_data[has_traj].copy()

    if len(traj_data) < 100:
        print("  Insufficient trajectory data")
        return {}

    print(f"\n  Analyzing {len(traj_data)} positions with temporal flow data")

    # Tension by game phase and outcome
    print(f"\n  Temporal flow by outcome:")
    print(f"  {'Outcome':<15} {'N':>6} {'Opening':>8} {'Midgame':>8} {'Endgame':>8} {'Volatil':>8} {'Intensity':>9}")
    print(f"  {'-'*65}")

    for outcome in [0, 1, 2]:
        name = {0: 'white_wins', 1: 'black_wins', 2: 'draw'}[outcome]
        subset = traj_data[traj_data['result_numeric'] == outcome]
        if len(subset) < 10:
            continue
        print(f"  {name:<15} {len(subset):>6} {subset['tf_opening'].mean():>7.1f} {subset['tf_middlegame'].mean():>7.1f} "
              f"{subset['tf_endgame'].mean():>7.1f} {subset['tf_volatility'].mean():>7.1f} {subset['cf_intensity'].mean():>8.1f}")

    # Does the opening-middlegame tension differential predict the outcome?
    traj_data['tension_shift'] = traj_data['tf_middlegame'] - traj_data['tf_opening']
    print(f"\n  Tension shift (midgame - opening) by outcome:")
    for outcome in [0, 1, 2]:
        name = {0: 'white_wins', 1: 'black_wins', 2: 'draw'}[outcome]
        subset = traj_data[traj_data['result_numeric'] == outcome]
        if len(subset) >= 10:
            shift = subset['tension_shift'].mean()
            print(f"    {name:<15} shift = {shift:+.2f}")

    # Quadrant dominance by outcome — which quadrant's tension predicts who wins?
    print(f"\n  Quadrant profile by outcome:")
    print(f"  {'Outcome':<15} {'KWhite':>7} {'KBlack':>7} {'QWhite':>7} {'QBlack':>7} {'Center':>7}")
    print(f"  {'-'*55}")
    for outcome in [0, 1, 2]:
        name = {0: 'white_wins', 1: 'black_wins', 2: 'draw'}[outcome]
        subset = traj_data[traj_data['result_numeric'] == outcome]
        if len(subset) < 10:
            continue
        print(f"  {name:<15} {subset['q_kingside_white'].mean():>6.1f} {subset['q_kingside_black'].mean():>6.1f} "
              f"{subset['q_queenside_white'].mean():>6.1f} {subset['q_queenside_black'].mean():>6.1f} "
              f"{subset['q_center'].mean():>6.1f}")

    # ANOVA: does quadrant profile differ significantly by outcome?
    for col in ['q_kingside_white', 'q_kingside_black', 'q_queenside_white', 'q_queenside_black', 'q_center']:
        groups = [traj_data[traj_data['result_numeric'] == o][col].dropna().values
                  for o in [0, 1, 2]]
        groups = [g for g in groups if len(g) >= 10]
        if len(groups) >= 2:
            f_stat, p_val = stats.f_oneway(*groups)
            sig = "*" if p_val < 0.05 else ""
            print(f"  ANOVA {col:<25}: F={f_stat:.2f}, p={p_val:.4f} {sig}")

    return {}


# ═════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════
def main():
    print("=" * 70)
    print("  En Pensent — Archetypal Tension Benchmark")
    print("  Testing the real thesis: archetypal tension as universal predictor")
    print("=" * 70)

    train, holdout = load_data()

    # Verify no leakage
    train_games = set(train['game_id'].dropna())
    hold_games = set(holdout['game_id'].dropna())
    overlap = train_games & hold_games
    print(f"  Leakage check: {len(overlap)} overlapping games (MUST be 0)")
    assert len(overlap) == 0, "GAME-LEVEL LEAKAGE DETECTED"

    results = {}
    results['residual'] = test_residual_signal(train, holdout)
    results['consistency'] = test_archetype_consistency(train, holdout)
    results['time_pressure'] = test_time_pressure(train, holdout)
    results['tension_shape'] = test_tension_shape(train, holdout)
    results['orthogonality'] = test_orthogonality(train, holdout)
    results['tension_dynamics'] = test_tension_dynamics(train, holdout)

    # Save results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results_path = os.path.join(RESULTS_DIR, f'benchmark_archetypal_{timestamp}.json')

    # Convert numpy types
    def clean(obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [clean(v) for v in obj]
        return obj

    with open(results_path, 'w') as f:
        json.dump(clean(results), f, indent=2, default=str)
    print(f"\n  Results saved: {results_path}")

    # ── SUMMARY ──
    print("\n" + "=" * 70)
    print("  SUMMARY — Is there archetypal tension signal?")
    print("=" * 70)

    r1 = results.get('residual', {})
    if r1.get('ep_rescue_rate'):
        rate = r1['ep_rescue_rate']
        print(f"  1. Residual: EP rescues {rate*100:.1f}% of SF-wrong cases (chance=33%)")

    r2 = results.get('consistency', {})
    if r2.get('chi2_p') is not None:
        p = r2['chi2_p']
        print(f"  2. Consistency: Archetype outcome distributions {'differ' if p < 0.05 else 'do not differ'} significantly (p={p:.4f})")

    r3 = results.get('time_pressure', {})
    if r3:
        for p, res in r3.items():
            edge = res['ep_acc'] - res['sf_acc']
            if abs(edge) > 0.02:
                print(f"  3. Time pressure: EP {'beats' if edge > 0 else 'loses to'} SF by {abs(edge)*100:.1f}pp in {p}")

    r4 = results.get('tension_shape', {})
    if r4.get('n_disagree', 0) >= 10:
        print(f"  4. Tension shape: Trajectory-only model gets {r4['traj_only_acc']*100:.1f}% accuracy (SF: {r4['sf_only_acc']*100:.1f}%)")

    r5 = results.get('orthogonality', {})
    if r5:
        both = r5['both_correct']
        expected = r5.get('expected_both_if_independent', 0)
        orth = "ORTHOGONAL" if both < expected else "CORRELATED"
        print(f"  5. Orthogonality: EP and SF are {orth} (both correct: {both}, expected if independent: {expected:.0f})")


if __name__ == '__main__':
    main()
