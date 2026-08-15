"""
En Pensent — Cross-Domain Transfer Test
============================================================================

Tests the core thesis: if archetypal tension is a universal predictive
primitive, then chess archetypes should carry predictive signal when
they appear in market data.

The market prediction system already classifies market positions into
chess archetypes via the chess→market bridge (chess_archetype_resonance
column). This test checks whether:

  1. Chess archetypes have different predictive accuracy in markets
  2. The structural archetypes that EP rescues best in chess
     (positional_squeeze, closed_maneuvering, sacrificial_attack)
     also perform differently in markets
  3. The direction of the effect is consistent (same archetype = same
     directional bias across domains)

Usage: python benchmark/src/benchmark_cross_domain.py
"""

import json
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from scipy import stats

# We'll query the DB directly via psycopg2
import psycopg2

def load_db_url():
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def fetch_market_data():
    """Fetch market predictions with chess archetype resonance."""
    db_url = load_db_url()
    if not db_url:
        print("ERROR: No DATABASE_URL in .env", file=sys.stderr)
        sys.exit(1)

    print("Connecting to Postgres...")
    conn = psycopg2.connect(db_url, connect_timeout=30)
    conn.set_session(readonly=True, autocommit=True)

    # Fetch market predictions with chess archetype resonance
    # Use keyset pagination to avoid timeouts
    all_rows = []
    last_id = None
    batch_size = 5000

    print("Fetching market predictions with chess archetype resonance...")
    while True:
        cur = conn.cursor()
        if last_id is None:
            cur.execute("""
                SELECT id, symbol, archetype, chess_archetype_resonance,
                       predicted_direction, actual_direction, ep_correct,
                       baseline_correct, confidence, cross_domain_confidence,
                       time_horizon
                FROM market_prediction_attempts
                WHERE chess_archetype_resonance IS NOT NULL
                  AND actual_direction IS NOT NULL
                ORDER BY id ASC
                LIMIT %s
            """, (batch_size,))
        else:
            cur.execute("""
                SELECT id, symbol, archetype, chess_archetype_resonance,
                       predicted_direction, actual_direction, ep_correct,
                       baseline_correct, confidence, cross_domain_confidence,
                       time_horizon
                FROM market_prediction_attempts
                WHERE chess_archetype_resonance IS NOT NULL
                  AND actual_direction IS NOT NULL
                  AND id > %s
                ORDER BY id ASC
                LIMIT %s
            """, (last_id, batch_size))

        rows = cur.fetchall()
        cur.close()

        if len(rows) == 0:
            break

        for row in rows:
            all_rows.append({
                'id': row[0],
                'symbol': row[1],
                'market_archetype': row[2],
                'chess_archetype': row[3],
                'predicted_direction': row[4],
                'actual_direction': row[5],
                'ep_correct': row[6],
                'baseline_correct': row[7],
                'confidence': row[8],
                'cross_domain_confidence': row[9],
                'time_horizon': row[10],
            })

        last_id = rows[-1][0]
        print(f"  Fetched {len(all_rows)} rows...", flush=True)

        if len(rows) < batch_size:
            break

    conn.close()

    df = pd.DataFrame(all_rows)
    print(f"\nTotal: {len(df)} market predictions with chess archetype resonance")
    return df


def fetch_chess_archetype_accuracy():
    """Fetch chess archetype accuracy from the exported CSV."""
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_set_v2_20260814.csv')
    if not os.path.exists(csv_path):
        print(f"  Chess CSV not found: {csv_path}")
        return None

    df = pd.read_csv(csv_path, low_memory=False)
    arch_acc = df.groupby('hybrid_archetype').agg(
        n=('result_numeric', 'count'),
        ep_acc=('hybrid_correct', 'mean'),
        sf_rescue_rate=('stockfish_correct', lambda x: 1 - x.mean()),
    ).reset_index()
    arch_acc.columns = ['chess_archetype', 'chess_n', 'chess_ep_acc', 'chess_sf_wrong_rate']
    return arch_acc


def test_cross_domain(market_df, chess_acc):
    print("\n" + "=" * 70)
    print("  CROSS-DOMAIN TRANSFER TEST")
    print("  Do chess archetypes carry predictive signal in market data?")
    print("=" * 70)

    # Overall market accuracy
    overall_ep = market_df['ep_correct'].mean()
    overall_baseline = market_df['baseline_correct'].mean()
    print(f"\n  Overall market accuracy:")
    print(f"    EP prediction:     {overall_ep*100:.1f}% (n={len(market_df)})")
    print(f"    Baseline (momentum): {overall_baseline*100:.1f}%")
    print(f"    EP edge over baseline: {(overall_ep - overall_baseline)*100:+.1f}pp")

    # Per-chess-archetype accuracy in markets
    arch_stats = market_df.groupby('chess_archetype').agg(
        n=('ep_correct', 'count'),
        ep_acc=('ep_correct', 'mean'),
        baseline_acc=('baseline_correct', 'mean'),
    ).sort_values('n', ascending=False)

    arch_stats['ep_edge'] = arch_stats['ep_acc'] - arch_stats['baseline_acc']
    arch_stats = arch_stats[arch_stats['n'] >= 50]

    print(f"\n  Chess archetype accuracy in MARKET data (n≥50):")
    print(f"  {'Chess Archetype':<35} {'N':>6} {'EP Acc%':>8} {'Base Acc%':>9} {'Edge':>7}")
    print(f"  {'-'*68}")
    for arch, row in arch_stats.iterrows():
        print(f"  {str(arch):<35} {int(row['n']):>6} {row['ep_acc']*100:>7.1f}% {row['baseline_acc']*100:>8.1f}% {row['ep_edge']*100:>+6.1f}pp")

    # Chi-square: do archetypes have different accuracy in markets?
    contingency = np.zeros((len(arch_stats), 2))
    for i, (arch, row) in enumerate(arch_stats.iterrows()):
        contingency[i] = [row['n'] * row['ep_acc'], row['n'] * (1 - row['ep_acc'])]
    chi2, p_val, dof, expected = stats.chi2_contingency(contingency)
    print(f"\n  Chi-square (archetype accuracy differs?): χ²={chi2:.2f}, p={p_val:.4f}")
    sig = "SIGNIFICANT — chess archetypes have different accuracy in markets" if p_val < 0.05 else "NOT SIGNIFICANT"
    print(f"  → {sig}")

    # Key question: do the structural archetypes that EP rescues best in chess
    # also perform differently in markets?
    structural_archetypes = [
        'positional_squeeze', 'closed_maneuvering', 'sacrificial_attack',
        'sacrificial_queenside_break', 'queenside_expansion',
        'kingside_attack', 'piece_balanced_activity',
    ]

    print(f"\n  Structural archetypes (where EP rescues best in chess):")
    print(f"  {'Archetype':<35} {'N':>6} {'Market EP%':>10} {'Market Edge':>11}")
    print(f"  {'-'*65}")
    for arch in structural_archetypes:
        if arch in arch_stats.index:
            row = arch_stats.loc[arch]
            print(f"  {arch:<35} {int(row['n']):>6} {row['ep_acc']*100:>9.1f}% {row['ep_edge']*100:>+10.1f}pp")

    # Cross-domain correlation: does chess EP accuracy predict market EP accuracy?
    if chess_acc is not None:
        merged = arch_stats.reset_index().merge(
            chess_acc, on='chess_archetype', how='inner'
        )
        merged = merged[merged['chess_n'] >= 30]

        if len(merged) >= 5:
            print(f"\n  Cross-domain correlation (n={len(merged)} archetypes with data in both):")
            chess_acc_vals = merged['chess_ep_acc'].astype(float).values
            market_acc_vals = merged['ep_acc'].astype(float).values
            r_ep, p_ep = stats.pearsonr(chess_acc_vals, market_acc_vals)
            print(f"    Chess EP acc vs Market EP acc: r={r_ep:.3f} (p={p_ep:.4f})")
            sig = "SIGNIFICANT — archetype accuracy transfers across domains!" if p_ep < 0.05 else "NOT SIGNIFICANT"
            print(f"    → {sig}")

            # Also check: does chess SF-wrong rate correlate with market EP edge?
            sf_wrong_vals = merged['chess_sf_wrong_rate'].astype(float).values
            edge_vals = merged['ep_edge'].astype(float).values
            r_rescue, p_rescue = stats.pearsonr(sf_wrong_vals, edge_vals)
            print(f"    Chess SF-wrong rate vs Market EP edge: r={r_rescue:.3f} (p={p_rescue:.4f})")

            print(f"\n  Detailed comparison:")
            print(f"  {'Archetype':<30} {'Chess N':>7} {'Chess EP%':>9} {'Market N':>8} {'Market EP%':>10} {'Mkt Edge':>8}")
            print(f"  {'-'*75}")
            for _, row in merged.sort_values('ep_acc', ascending=False).iterrows():
                print(f"  {str(row['chess_archetype']):<30} {int(row['chess_n']):>7} {row['chess_ep_acc']*100:>8.1f}% {int(row['n']):>8} {row['ep_acc']*100:>9.1f}% {row['ep_edge']*100:>+7.1f}pp")

    # Tension intensity in markets — does it predict accuracy like in chess?
    # (intensity column not available in market_prediction_attempts; skip)
    # Could be extracted from prediction_metadata JSON if needed in future

    # Time horizon analysis
    if market_df['time_horizon'].notna().sum() > 100:
        print(f"\n  Accuracy by time horizon:")
        horizon_acc = market_df.groupby('time_horizon').agg(
            n=('ep_correct', 'count'),
            ep_acc=('ep_correct', 'mean'),
            baseline_acc=('baseline_correct', 'mean'),
        ).sort_values('n', ascending=False)
        print(f"  {'Horizon':<15} {'N':>6} {'EP Acc%':>8} {'Base Acc%':>9} {'Edge':>7}")
        print(f"  {'-'*48}")
        for idx, row in horizon_acc.iterrows():
            print(f"  {str(idx):<15} {int(row['n']):>6} {row['ep_acc']*100:>7.1f}% {row['baseline_acc']*100:>8.1f}% {(row['ep_acc']-row['baseline_acc'])*100:>+6.1f}pp")

    return {
        'overall_ep_acc': float(overall_ep),
        'overall_baseline_acc': float(overall_baseline),
        'chi2': float(chi2),
        'chi2_p': float(p_val),
        'n_archetypes': len(arch_stats),
    }


def main():
    print("=" * 70)
    print("  En Pensent — Cross-Domain Transfer Test")
    print("  Testing: do chess archetypes predict market outcomes?")
    print("=" * 70)

    market_df = fetch_market_data()
    chess_acc = fetch_chess_archetype_accuracy()

    if chess_acc is not None:
        print(f"  Chess archetype accuracy loaded: {len(chess_acc)} archetypes")

    results = test_cross_domain(market_df, chess_acc)

    # Save
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results_path = os.path.join(
        os.path.dirname(__file__), '..', 'results',
        f'benchmark_cross_domain_{timestamp}.json'
    )
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n  Results saved: {results_path}")

    # Summary
    print("\n" + "=" * 70)
    print("  SUMMARY — Cross-Domain Transfer")
    print("=" * 70)
    print(f"  Market EP accuracy: {results['overall_ep_acc']*100:.1f}%")
    print(f"  Market baseline:    {results['overall_baseline_acc']*100:.1f}%")
    print(f"  EP edge:            {(results['overall_ep_acc']-results['overall_baseline_acc'])*100:+.1f}pp")
    print(f"  Archetype chi-square: p={results['chi2_p']:.4f}")
    if results['chi2_p'] < 0.05:
        print(f"  → Chess archetypes have SIGNIFICANTLY different accuracy in markets")
    else:
        print(f"  → No significant difference between chess archetypes in markets")


if __name__ == '__main__':
    main()
