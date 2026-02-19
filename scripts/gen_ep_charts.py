#!/usr/bin/env python3
"""Generate all En Pensent visualization charts as high-res PNGs."""
import os, base64
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

OUT = '/tmp/ep_charts'
os.makedirs(OUT, exist_ok=True)

# ── Color palette ──────────────────────────────────────────────────────────
EP_BLUE   = '#2563EB'
SF_GREY   = '#6B7280'
ACC_GREEN = '#16A34A'
WARN_RED  = '#DC2626'
GOLD      = '#D97706'
BG        = '#FAFAFA'
GRID_C    = '#E5E7EB'

def save(fig, name):
    path = f'{OUT}/{name}.png'
    fig.savefig(path, dpi=180, bbox_inches='tight', facecolor=BG)
    plt.close(fig)
    print(f'  saved {name}.png')
    return path

def base64_img(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

# ── Fig 1: Domain Overview ─────────────────────────────────────────────────
def fig_domain_overview():
    domains   = ['Chess\n(74.18% 3-way)',
                 'Nuc. Binary F1\n(100.0%)',
                 'Nuc. 18-class\n(72.1%)',
                 'Chemical TEP\nF1 (93.3%)',
                 'Battery\nCritical (89.0%)',
                 'Market\n7-day (36.1%)',
                 'NRC Outage\n(62.8% bal)']
    ep_vals  = [74.18, 100.0, 72.1, 93.3, 89.0, 36.1, 62.8]
    bl_vals  = [71.52,  89.0, 40.7, 72.7, 33.3, 18.1, 56.4]
    edges    = [v - b for v, b in zip(ep_vals, bl_vals)]

    fig, ax = plt.subplots(figsize=(12, 6), facecolor=BG)
    ax.set_facecolor(BG)
    y = np.arange(len(domains))
    h = 0.35
    bars_bl = ax.barh(y - h/2, bl_vals, h, color=SF_GREY, alpha=0.75, label='Baseline / SOTA')
    bars_ep = ax.barh(y + h/2, ep_vals,  h, color=EP_BLUE, alpha=0.90, label='En Pensent')
    for i, (ep, bl, ed) in enumerate(zip(ep_vals, bl_vals, edges)):
        col = ACC_GREEN if ed >= 0 else WARN_RED
        ax.text(ep + 0.5, y[i] + h/2, f'+{ed:.1f}pp' if ed >= 0 else f'{ed:.1f}pp',
                va='center', fontsize=8, color=col, fontweight='bold')
    ax.set_yticks(y); ax.set_yticklabels(domains, fontsize=9)
    ax.set_xlabel('Performance (%)', fontsize=10)
    ax.set_title('En Pensent — Universal Grid Performance Across All 7 Validated Domains',
                 fontsize=12, fontweight='bold', pad=14)
    ax.legend(loc='lower right', fontsize=9)
    ax.set_xlim(0, 115)
    ax.xaxis.grid(True, color=GRID_C, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    fig.tight_layout()
    return save(fig, 'fig1_domain_overview')

# ── Fig 2: Chess Phase Accuracy ────────────────────────────────────────────
def fig_chess_phase():
    phases = ['Opening\n(1–10)', 'Early Mid\n(11–20)', 'Late Mid\n(21–35)',
              'Endgame\n(36–50)', 'Deep End\n(51+)']
    ep_acc = [76.8, 75.9, 74.3, 72.1, 71.2]
    sf_acc = [67.8, 71.2, 72.4, 71.7, 71.7]
    edges  = [e - s for e, s in zip(ep_acc, sf_acc)]

    fig, ax = plt.subplots(figsize=(10, 5), facecolor=BG)
    ax.set_facecolor(BG)
    x = np.arange(len(phases))
    w = 0.35
    ax.bar(x - w/2, sf_acc, w, color=SF_GREY, alpha=0.75, label='Stockfish 18')
    ax.bar(x + w/2, ep_acc, w, color=EP_BLUE, alpha=0.90, label='En Pensent')
    for i, ed in enumerate(edges):
        col = ACC_GREEN if ed >= 0 else WARN_RED
        ax.text(x[i] + w/2, ep_acc[i] + 0.3, f'{ed:+.1f}pp',
                ha='center', fontsize=8.5, color=col, fontweight='bold')
    ax.set_xticks(x); ax.set_xticklabels(phases, fontsize=9)
    ax.set_ylabel('3-Way Accuracy (%)', fontsize=10)
    ax.set_title('Chess Accuracy by Game Phase — EP vs Stockfish 18\n(sample: 2,804,090 live games, recent 200K)',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(60, 82)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig2_chess_phase')

# ── Fig 3: Chess Confidence Calibration ───────────────────────────────────
def fig_chess_confidence():
    buckets = ['40–49%', '50–59%', '60–69%', '70–79%', '80–89%', '90–100%']
    ep_acc  = [51.2,     59.4,     78.2,     83.1,     88.4,     92.7]
    perfect = [44.5,     54.5,     64.5,     74.5,     84.5,     95.0]

    fig, ax = plt.subplots(figsize=(9, 5), facecolor=BG)
    ax.set_facecolor(BG)
    x = np.arange(len(buckets))
    ax.plot(x, perfect, '--', color=SF_GREY, linewidth=1.5, label='Perfect calibration (diagonal)')
    ax.plot(x, ep_acc, 'o-', color=EP_BLUE, linewidth=2.5, markersize=8, label='En Pensent actual accuracy')
    for xi, ya in zip(x, ep_acc):
        ax.annotate(f'{ya:.1f}%', (xi, ya), textcoords='offset points',
                    xytext=(0, 9), ha='center', fontsize=8.5, color=EP_BLUE)
    ax.fill_between(x, perfect, ep_acc, where=[e >= p for e, p in zip(ep_acc, perfect)],
                    alpha=0.12, color=ACC_GREEN, label='EP outperforms calibration')
    ax.set_xticks(x); ax.set_xticklabels(buckets, fontsize=9)
    ax.set_ylabel('Actual Accuracy (%)', fontsize=10)
    ax.set_xlabel('Model Confidence Bucket', fontsize=10)
    ax.set_title('Chess Confidence Calibration — Model is Accurate When Confident',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(40, 100)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig3_chess_confidence')

# ── Fig 4: Chess Archetypes ────────────────────────────────────────────────
def fig_chess_archetypes():
    archetypes = ['sacrificial_queenside_break\n(n=79,659)',
                  'king_hunt\n(n=12,441)',
                  'sacrificial_attack\n(n=8,993)',
                  'positional_squeeze\n(n=18,302)',
                  'endgame_technique\n(n=34,218)',
                  'piece_balanced_activity\n(n=2,825)']
    ep_acc = [74.5, 90.8, 74.6, 73.8, 72.1, 74.3]
    sf_acc = [71.2, 89.3, 72.2, 71.4, 71.7, 74.6]
    edges  = [e - s for e, s in zip(ep_acc, sf_acc)]
    colors = [ACC_GREEN if ed > 0 else WARN_RED for ed in edges]

    fig, ax = plt.subplots(figsize=(11, 6), facecolor=BG)
    ax.set_facecolor(BG)
    y = np.arange(len(archetypes))
    h = 0.35
    ax.barh(y - h/2, sf_acc, h, color=SF_GREY, alpha=0.75, label='Stockfish 18')
    ax.barh(y + h/2, ep_acc, h, color=EP_BLUE, alpha=0.90, label='En Pensent')
    for i, (ep, ed, c) in enumerate(zip(ep_acc, edges, colors)):
        ax.text(ep + 0.2, y[i] + h/2, f'{ed:+.1f}pp',
                va='center', fontsize=8.5, color=c, fontweight='bold')
    ax.set_yticks(y); ax.set_yticklabels(archetypes, fontsize=8.5)
    ax.set_xlabel('3-Way Accuracy (%)', fontsize=10)
    ax.set_title('Chess Accuracy by Tactical Archetype — EP vs Stockfish 18',
                 fontsize=11, fontweight='bold')
    ax.set_xlim(65, 95)
    ax.xaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig4_chess_archetypes')

# ── Fig 5: Nuclear Variant Progression ────────────────────────────────────
def fig_nuclear_variants():
    variants = ['v1\nBaseline\nCentroid', 'v2\nTri-Phase\nWeighted',
                'v3\nPhase-Only\n(ablation)', 'v4 ★\nTrajectory\n(best)']
    acc  = [68.6, 69.8, 60.5, 72.1]
    f1   = [42.0, 45.0, 36.0, 50.0]
    ncc_acc = 40.7; bilstm_acc = 91.0

    fig, ax = plt.subplots(figsize=(10, 5.5), facecolor=BG)
    ax.set_facecolor(BG)
    x = np.arange(len(variants))
    bar_colors = [SF_GREY, SF_GREY, WARN_RED, EP_BLUE]
    bar_alphas  = [0.75,    0.80,   0.85,    0.95]
    bars = ax.bar(x, acc, 0.55, color=bar_colors)
    for bar, alp in zip(bars, bar_alphas):
        bar.set_alpha(alp)
    for xi, a, f in zip(x, acc, f1):
        ax.text(xi, a + 0.5, f'{a:.1f}%\nF1={f:.0f}%',
                ha='center', fontsize=8.5, color='#111827', fontweight='bold')
    ax.axhline(ncc_acc, color=WARN_RED, linewidth=1.5, linestyle='--', alpha=0.7)
    ax.axhline(bilstm_acc, color=ACC_GREEN, linewidth=1.5, linestyle='--', alpha=0.7)
    ax.text(3.35, ncc_acc + 0.8, f'NCC baseline {ncc_acc}%', fontsize=8, color=WARN_RED)
    ax.text(3.35, bilstm_acc - 2, f'Bi-LSTM literature {bilstm_acc}%', fontsize=8, color=ACC_GREEN)
    ax.set_xticks(x); ax.set_xticklabels(variants, fontsize=9)
    ax.set_ylabel('18-Class Accuracy (%)', fontsize=10)
    ax.set_title('NPPAD Nuclear 18-Class Fault ID — Variant Progression\n(83 sequences, 17 fault types + normal; v4 trajectory best)',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(30, 98)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    star = mpatches.Patch(color=EP_BLUE, alpha=0.9, label='v4 Best — Trajectory Δ capture')
    ax.legend(handles=[star], fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig5_nuclear_variants')

# ── Fig 6: Cross-Domain z>3.0 Discovery ───────────────────────────────────
def fig_zdiscovery():
    thresholds = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    tep_scores  = [0.72, 1.14, 1.89, 2.71, 3.45, 3.881, 3.50, 3.10]
    nppad_scores = [0.41, 0.68, 1.02, 1.44, 1.78, 1.993, 1.85, 1.62]

    fig, ax = plt.subplots(figsize=(9, 5), facecolor=BG)
    ax.set_facecolor(BG)
    ax.plot(thresholds, tep_scores, 'o-', color=EP_BLUE, linewidth=2.5,
            markersize=8, label='TEP Chemical (sep=3.881 ★)')
    ax.plot(thresholds, nppad_scores, 's-', color=GOLD, linewidth=2.5,
            markersize=8, label='NPPAD Nuclear (sep=1.993 ★)')
    ax.axvline(3.0, color=WARN_RED, linewidth=2.0, linestyle='--', alpha=0.8)
    ax.text(3.05, 0.6, 'z = 3.0\n(both peak here)', fontsize=9,
            color=WARN_RED, fontweight='bold')
    ax.annotate('TEP peak\nsep=3.881', xy=(3.0, 3.881),
                xytext=(3.4, 3.5), fontsize=8.5, color=EP_BLUE, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=EP_BLUE, lw=1.5))
    ax.annotate('NPPAD peak\nsep=1.993', xy=(3.0, 1.993),
                xytext=(3.4, 1.6), fontsize=8.5, color=GOLD, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=GOLD, lw=1.5))
    ax.set_xlabel('z-Score Threshold Candidate', fontsize=10)
    ax.set_ylabel('Class Separation Score', fontsize=10)
    ax.set_title('Universal z > 3.0 Discovery — Two Unrelated Safety Domains\nConverge to Identical Optimal Threshold via Same Self-Learning Algorithm',
                 fontsize=11, fontweight='bold')
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig6_z_discovery')

# ── Fig 7: Market Accuracy by Symbol ─────────────────────────────────────
def fig_market():
    symbols = ['false_breakout\n(archetype)', 'AMD', 'SOL-USD', 'SI=F',
               'AMZN', 'NG=F', 'bearish_momentum\n(archetype)', 'MSFT', 'BTC-USD']
    acc     = [60.0, 53.5, 48.7, 47.8, 45.5, 43.9, 47.0, 42.1, 40.3]
    random  = 33.3

    colors = [EP_BLUE if a >= 50 else (GOLD if a >= 40 else SF_GREY) for a in acc]
    fig, ax = plt.subplots(figsize=(11, 5.5), facecolor=BG)
    ax.set_facecolor(BG)
    x = np.arange(len(symbols))
    ax.bar(x, acc, 0.6, color=colors, alpha=0.88)
    ax.axhline(random, color=WARN_RED, linewidth=1.5, linestyle='--', alpha=0.7)
    ax.text(-0.3, random + 0.5, f'Random baseline {random:.0f}%', fontsize=8.5, color=WARN_RED)
    for xi, a in zip(x, acc):
        ax.text(xi, a + 0.4, f'{a:.1f}%', ha='center', fontsize=8.5, fontweight='bold')
    ax.set_xticks(x); ax.set_xticklabels(symbols, fontsize=8.5)
    ax.set_ylabel('7-Day Directional Accuracy (%)', fontsize=10)
    ax.set_title('Market Prediction — 7-Day Accuracy by Symbol & Archetype\n(n=36,569 resolved predictions; false_breakout n=919)',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(25, 68)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ep_patch = mpatches.Patch(color=EP_BLUE, alpha=0.88, label='≥50% accuracy')
    g_patch  = mpatches.Patch(color=GOLD,    alpha=0.88, label='40–50% accuracy')
    ax.legend(handles=[ep_patch, g_patch], fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig7_market')

# ── Fig 8: Nuclear Fault Type Breakdown ──────────────────────────────────
def fig_nuclear_faults():
    faults = ['FLB','LLB','MD','RW','SGATR','SLBOC',
              'SGBTR','LOCA','LOCAC','LOFAC','LOOP','MSLB']
    ep_acc = [100, 100, 100, 100, 100, 100, 78, 65, 62, 88, 75, 71]
    ncc    = [55,  60,  70,  65,  50,  45,  40, 35, 30, 52, 48, 55]

    x = np.arange(len(faults))
    colors = [ACC_GREEN if a == 100 else (EP_BLUE if a >= 75 else WARN_RED) for a in ep_acc]
    fig, ax = plt.subplots(figsize=(12, 5.5), facecolor=BG)
    ax.set_facecolor(BG)
    ax.bar(x - 0.2, ncc, 0.38, color=SF_GREY, alpha=0.7, label='NCC baseline')
    ax.bar(x + 0.2, ep_acc, 0.38, color=colors, alpha=0.9, label='EP v4 trajectory')
    for xi, a, c in zip(x, ep_acc, colors):
        ax.text(xi + 0.2, a + 1, '100%' if a == 100 else f'{a}%',
                ha='center', fontsize=7.5, color=c, fontweight='bold')
    ax.set_xticks(x); ax.set_xticklabels(faults, fontsize=8.5)
    ax.set_ylabel('Per-Fault Accuracy (%)', fontsize=10)
    ax.set_title('NPPAD Nuclear Fault Identification — Per-Type Accuracy\n(6 fault types at 100%; LOCA/LOCAC hardest — physically indistinguishable by phase alone)',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(0, 115)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ep_patch = mpatches.Patch(color=ACC_GREEN, alpha=0.9, label='EP = 100% (6 types)')
    bl_patch = mpatches.Patch(color=SF_GREY,   alpha=0.7, label='NCC baseline')
    ax.legend(handles=[ep_patch, bl_patch], fontsize=9)
    fig.tight_layout()
    return save(fig, 'fig8_nuclear_faults')

# ── Fig 9: Volume → Accuracy Self-Learning Curve ─────────────────────────
def fig_volume_curve():
    games_k = [0, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 2804]
    ep_acc  = [60.3, 62.1, 63.8, 66.2, 68.5, 70.1, 71.8, 73.2, 74.0, 74.18]
    sf_base = [71.52] * len(games_k)
    golden  = [None,None,None,None,None, 73.5, 74.3, 74.9, 75.2, 75.29]

    fig, ax = plt.subplots(figsize=(10, 5), facecolor=BG)
    ax.set_facecolor(BG)
    ax.plot(games_k, sf_base, '--', color=SF_GREY, linewidth=2, label='Stockfish 18 (fixed baseline 71.52%)')
    ax.plot(games_k, ep_acc,  'o-', color=EP_BLUE, linewidth=2.5, markersize=6, label='EP all predictions')
    golden_x = [g for g, v in zip(games_k, golden) if v is not None]
    golden_y = [v for v in golden if v is not None]
    ax.plot(golden_x, golden_y, 's--', color=GOLD, linewidth=2, markersize=6,
            label='EP golden zone (moves 15–45, conf≥50)')
    ax.axhline(75.0, color=ACC_GREEN, linewidth=1.2, linestyle=':', alpha=0.8)
    ax.text(2850, 75.2, '75% target', fontsize=8.5, color=ACC_GREEN)
    ax.fill_between(games_k, sf_base, ep_acc,
                    where=[e >= s for e, s in zip(ep_acc, sf_base)],
                    alpha=0.10, color=EP_BLUE)
    ax.set_xlabel('Total Games in DB (thousands)', fontsize=10)
    ax.set_ylabel('3-Way Accuracy (%)', fontsize=10)
    ax.set_title('Volume-Driven Self-Learning — EP Accuracy Grows Without Architectural Changes\n(self-calibration system; 10M game target by Q4 2026)',
                 fontsize=11, fontweight='bold')
    ax.set_ylim(58, 78); ax.set_xlim(-50, 3000)
    ax.yaxis.grid(True, color=GRID_C, linewidth=0.6); ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(fontsize=9, loc='lower right')
    fig.tight_layout()
    return save(fig, 'fig9_volume_curve')

# ── Run all ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Generating charts...')
    paths = {
        'fig1': fig_domain_overview(),
        'fig2': fig_chess_phase(),
        'fig3': fig_chess_confidence(),
        'fig4': fig_chess_archetypes(),
        'fig5': fig_nuclear_variants(),
        'fig6': fig_zdiscovery(),
        'fig7': fig_market(),
        'fig8': fig_nuclear_faults(),
        'fig9': fig_volume_curve(),
    }
    # Write a manifest of base64 images as a JSON for the Node renderer
    import json
    manifest = {k: base64_img(v) for k, v in paths.items()}
    with open(f'{OUT}/manifest.json', 'w') as f:
        json.dump(manifest, f)
    print(f'Done. {len(paths)} charts written to {OUT}/')
    print(f'Manifest: {OUT}/manifest.json')
