# En Pensent — Methodology

This document describes the sampling design, prediction architecture, and self-learning calibration loop used to produce the En Pensent prediction corpus and the headline accuracy figures.

For raw numbers, see [`RESULTS.md`](./RESULTS.md). For the verification protocol, see [`AUDIT.md`](./AUDIT.md).

---

## 1. Position Sampling

Every prediction in the public corpus corresponds to **one analysis position selected per game**. The selection is deterministic, weighted across game phases, and reproducible.

### Selection Rule (per `farm/workers/ep-enhanced-worker.mjs`)

For a game of `N` total moves:

1. Compute a deterministic seed from the game's hash identifier
2. Sample a phase bucket from a weighted distribution:
   - 15-30% of game length: weight 0.15
   - 30-45% of game length: weight 0.25
   - 45-60% of game length: weight 0.30
   - 60-75% of game length: weight 0.20
   - 75-90% of game length: weight 0.10
3. Within the chosen bucket, select a move number using the seed
4. Enforce minimum move number of 12 (skip opening preparation)
5. Enforce maximum of `N - 2` (skip terminal positions)

This produces a single per-game prediction concentrated in the late-middlegame range where prediction is most informative.

### Why This Sampling

- **Avoids opening dependence:** the first 12 moves are typically book moves where outcome is undetermined and not informative for representation quality
- **Avoids terminal trivialities:** the last 1-2 moves of a game are deterministic (mate, resignation, agreed draw) and not interesting for prediction
- **Phase-balanced:** weights ensure middlegame and endgame are both represented without one dominating
- **Deterministic:** same game ID produces the same analysis position every time, allowing reproducibility

### Possible Bias We're Aware Of

- Late-middlegame bias means the system is **not** measured on opening prediction. We do not claim opening-prediction superiority and the system caps confidence in moves 1-10 at 38% explicitly.
- Game-source bias: corpus is sourced from public Lichess + Chess.com APIs plus curated GM/IM lists. The rating distribution skews toward 1500-2400. The +5.43pp edge is observed across this distribution and may not hold at GM level (the system code includes rating-aware confidence dampening above 2500).

---

## 2. The Color Flow Representation

The core innovation. Every chess position is encoded not as a static board, but as the **path-history of all pieces up to the current move**.

### Mechanics (per `src/lib/chess/gameSimulator.ts`)

For each move played:

- **Sliding pieces** (bishop, rook, queen): all intermediate squares along the trajectory are marked as visited, not just the destination
- **Knight L-shape moves**: the L-shape path geometry is explicitly traced
- **Pawn advances**: encoded with a 6-level intensity gradient indicating advancement depth
- **Each visit records:** piece type, color, move number, and visit count

This produces a **64-element spatial fingerprint** that encodes "where pieces have been" rather than "where they are."

### Why It Matters

Two positions with identical board states can have completely different color-flow signatures. A position reached via a quiet positional buildup looks different from the same position reached via a tactical melee. The representation captures the **trajectory dynamics** that static evaluators (including Stockfish) discard.

This is the falsifiable claim: a representation that encodes path history contains predictive signal that representations of static positions do not. The 1.77M Chess960 result is the cleanest evidence — the same positions that confound Stockfish (no opening book) are tractable for the path-based representation.

---

## 3. Archetype Classification

The 64-element color flow fingerprint is reduced to one of 50+ named strategic archetypes (`src/lib/chess/colorFlowAnalysis/types.ts`).

Examples:

- `kingside_attack` — heavy color concentration on kingside files
- `queenside_expansion` — progressive queenside flow
- `central_domination` — dense center color presence
- `prophylactic_defense` — balanced low-intensity defense
- `pawn_storm` — linear pawn color trails
- `sacrificial_kingside_assault` — sacrifice + high tension on kingside
- `king_hunt` — exposed king + coordinated attack
- (44+ others, each with distinct empirical outcome distributions)

Each archetype is classified deterministically from the signature. Each archetype has a learned outcome distribution (e.g. `kingside_attack` historically resolves to white wins 54% / black wins 28% / draws 18% across the full corpus).

### Probable Over-Specification

We acknowledge — and any reviewer should test — that 50+ archetypes likely contain redundant or empirically-similar classes. An ablation that consolidates to ~10-15 distinct archetypes would probably preserve most of the signal. We have not yet run that ablation publicly.

---

## 4. The 15-Component Fusion (`equilibriumPredictor.ts`)

The final outcome prediction fuses 15 independent signal streams. Each component contributes a vote toward white-wins, black-wins, or draw, weighted by per-archetype tuned multipliers.

| # | Component | Source |
|---|---|---|
| 1 | Board control balance | Quadrant visit asymmetry |
| 2 | Temporal momentum | 3-phase acceleration |
| 3 | Archetype historical rate | Empirical W/B/D distribution per archetype |
| 4 | Stockfish 18 evaluation | depth 14-20 |
| 5 | Game phase context | Opening/mid/end adjustments |
| 6 | King safety delta | Attack/defense asymmetry |
| 7 | Pawn structure score | Passed, doubled, islands |
| 8 | 8-quadrant enhanced control | Spatial + piece-type ratios |
| 9 | Dual-inversion convergence | When 1/matter ≈ 1/shadow → draw |
| 10 | Archetype × eval interaction | Learned from 1M+ outcomes |
| 11 | Archetype × phase temporal | Different archetypes peak differently |
| 12 | EP 3D mirror eval | SF-independent: spatial × force × temporal |
| 13 | Deep signals | Momentum gradient, coordination potential |
| 14 | Photonic grid fusion | 7D spatial frequency analysis |
| 15 | 32-piece color flow | Per-piece activity, territory, survival |

### Per-Archetype Auto-Tuning

The fusion weights are not hardcoded. Each archetype has its own tuned multipliers learned from outcome data:

```typescript
const archetypeFusionAdj = getArchetypeFusionWeights(effectiveArchetypeName);
// Returns: { sfMultiplier, controlMultiplier, momentumMultiplier,
//            kingSafetyMultiplier, pawnStructureMultiplier }
```

Example tuning from production:

- `kingside_attack`: higher king-safety weight (king exposure matters more here)
- `positional_squeeze`: higher pawn-structure weight (pawn breaks decide)
- `endgame_technique`: lower archetype weight (Stockfish dominates here)

---

## 5. Self-Learning Calibration

The fusion weights are continuously updated by a calibration worker (`farm/workers/signal-calibration-worker.mjs`) that runs every 45 minutes.

### What It Learns

1. **Stockfish eval bucket → actual W/B/D distribution.** E.g. eval +50cp historically produces {white: 62%, black: 18%, draw: 20%}.
2. **Archetype → actual W/B/D distribution.** E.g. `kingside_attack` produces {white: 54%, black: 28%, draw: 18%}.
3. **Phase (move number) → actual W/B/D distribution.** E.g. moves 15-24 produce {white: 42%, black: 41%, draw: 17%}.
4. **Archetype × eval interaction → distribution.** E.g. `kingside_attack` at +100cp produces {white: 72%, black: 15%, draw: 13%}.
5. **Optimal fusion weights** via holdout validation.

### Holdout Discipline

The calibration loop uses a temporally-separated holdout: predictions from days `[T-30, T-7]` train the calibration; predictions from `T-7` onward validate it. The 7-day public-view lag in `audit/setup-public-view.sql` ensures any external auditor sees only data that has already passed through validation.

### What This Doesn't Solve

- The calibration cannot rescue a fundamentally bad signal. If the color flow representation were not predictive, no amount of calibration would produce a +5.43pp edge over a strong baseline.
- The calibration can drift if the underlying game distribution shifts (e.g. a sudden influx of bullet games changes the corpus). The system monitors this and alerts when calibration confidence drops below threshold.

---

## 6. Confidence Calibration & Brier Score

The system reports a confidence (0-100%) alongside each prediction. Confidence is calibrated such that, in aggregate, predictions made at confidence X resolve correctly approximately X% of the time.

| Confidence band | Empirical accuracy | Brier score |
|---|---|---|
| 30-40% | 41-43% | 0.215 |
| 40-50% | 51-54% | 0.198 |
| 50-60% | 60-63% | 0.181 |
| 60-70% | 69-72% | 0.165 |
| 70-80% | 77-80% | 0.148 |
| 80-85% | 82-85% | 0.135 |

The slight upward bias (predictions are slightly more accurate than confidence claims) is intentional — the system errs on the side of conservative confidence to reduce false certainty.

---

## 7. Stockfish 18 Baseline

For comparison fairness, the Stockfish 18 baseline is computed under matched conditions:

- **Depth 14-20** (matches the depth En Pensent uses to extract its own SF-eval signal)
- **Same 64-bit binary** (Stockfish 18 official release)
- **Same position** (the sampled analysis position from each game)
- **Outcome interpretation:** SF eval converted to 3-way W/B/D using the standard +0.50 / -0.50 pawn equivalent thresholds with draw zone

Stockfish is not run to its maximum reasonable strength (depth 30+) for this comparison. The baseline tests prediction-from-evaluation, not search-perfection. If we ran SF at maximum depth on each position, the baseline would likely improve by 2-4pp; the En Pensent edge would shrink correspondingly but persist.

---

## 8. What We Have Not Yet Done

For full transparency, comparisons we have not yet completed:

- **Transformer baseline:** A 50M-parameter transformer trained on PGN sequences predicting outcome at each position. This is the comparison most ML reviewers want to see, and we believe a strong transformer would close some (probably not all) of the +5.43pp gap. We have not run this.
- **Maia / learned-eval comparison:** Maia (CMU) is the standard learned-policy chess model. We have not benchmarked against it on outcome prediction.
- **Rating-stratified breakdown for the +5.43pp:** the code applies rating-aware dampening but the public stats do not yet split by rating tier. We will publish this breakdown.
- **Cross-platform reproducibility check:** all current numbers come from one production run. Independent re-runs on a fresh ingest would strengthen the evidence.

A reviewer who wants to run any of these comparisons is encouraged to do so — the corpus is publicly available via `predictions_public`.

---

## 9. Reproducibility Commitments

- All prediction code is in this repository under `src/lib/chess/`
- All worker code is in `farm/workers/` (kept locally for IP protection but available under audit)
- All outcomes are in the public read-only Supabase view
- All claims in `RESULTS.md` are verifiable via `node audit/verify.mjs`
- Discrepancies are bugs — please report them

---

## Contact

- **Methodology questions:** `a.arthur.shelton@gmail.com`
- **Bug reports / discrepancies:** same address, will be acknowledged within 48 hours and published publicly
