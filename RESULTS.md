# En Pensent — Canonical Results

**This is the single source of truth for all empirical claims published by the En Pensent project.**

Numbers in this document are the canonical values. The whitepaper, IP appraisal, public dashboard, and academic paper are all expected to match these figures. Any inconsistency found should be reported and treated as a bug.

For live, current numbers — which grow daily as the prediction corpus expands — run:

```bash
node audit/verify.mjs
```

---

## 1. Headline Result — En Pensent vs Stockfish 18

| Metric | Value |
|---|---|
| **Total predictions analyzed** | **12,240,000** |
| En Pensent correct (W/B/D) | 8,475,000 |
| Stockfish 18 correct (W/B/D) | 7,809,000 |
| **En Pensent accuracy** | **69.24%** |
| **Stockfish 18 accuracy** | **63.81%** |
| **En Pensent edge** | **+5.43 percentage points** |

This is on a 3-way classification task (white wins / black wins / draw) at the position selected for analysis in each game (typically a single mid-to-late-middlegame position per game; full sampling protocol in [`METHODOLOGY.md`](./METHODOLOGY.md)).

### Disagreement Breakdown

| Outcome | Count |
|---|---|
| Both EP and SF18 correct | 6,952,000 |
| Only EP correct (SF18 wrong) | 1,523,000 |
| Only SF18 correct (EP wrong) | 857,000 |
| Both wrong | 2,908,000 |

When En Pensent disagrees with Stockfish, **En Pensent is correct 64.0%** of the time (1,523,000 / (1,523,000 + 857,000)).

---

## 2. Chess960 / Freestyle Result

The Chess960 result is the cleanest evidence that the En Pensent representation captures real chess understanding, not memorized opening theory. Stockfish 18 has no opening book for the 960 starting positions and falls to near-random outcome prediction. En Pensent's path-based representation does not depend on opening knowledge and holds up.

| Metric | Value |
|---|---|
| Total Chess960 / Freestyle games | 1,769,457 |
| **En Pensent accuracy** | **52.62%** |
| **Stockfish 18 accuracy** | **33.49%** |
| **En Pensent edge** | **+19.13 percentage points** |

Stockfish 18's 33.49% on this subset is approximately the random baseline for 3-way classification (33.33%). En Pensent's 52.62% is well above random and approximately the same accuracy that Stockfish 18 achieves on standard chess at lower-quality positions.

---

## 3. Eval Zone Stratification (Standard Chess)

Stockfish search is strongest at large evaluations and weakest in the 0-25 centipawn range, where small material/positional imbalances do not resolve cleanly. En Pensent's largest gains are concentrated in this exact zone:

| Eval zone | EP accuracy | SF18 accuracy | Edge |
|---|---|---|---|
| 0-10 cp | ~43% | ~14% | **+29pp** |
| 10-25 cp | ~41% | ~16% | **+25pp** |
| 25-50 cp | ~58% | ~52% | +6pp |
| 50-100 cp | ~71% | ~70% | +1pp |
| 100-200 cp | ~78% | ~78% | ~0 |
| 200+ cp | ~88% | ~89% | -1pp |

The pattern is consistent: En Pensent's edge is largest exactly where Stockfish's search is admittedly weakest, and the two systems converge as evaluations become decisive.

---

## 4. Phase Stratification

| Game phase | EP accuracy | SF18 accuracy | Edge |
|---|---|---|---|
| Opening (moves 1-10) | 47.5% | 50.5% | -3.0pp (suppressed by EP) |
| Early middlegame (moves 11-25) | 65.8% | 60.1% | +5.7pp |
| Late middlegame (moves 26-45) | 71.6% | 68.1% | +3.5pp |
| Endgame (moves 46-65) | 73.2% | 70.4% | +2.8pp |
| Deep endgame (moves 66+) | 52.8% | 57.0% | -4.2pp (suppressed by EP) |

The system intentionally caps confidence in the opening (where archetype patterns are not yet established) and in deep endgames (where Stockfish converges to perfect play). The "Golden Zone" of moves 15-45 with confidence ≥50 is where the edge is most reliable.

---

## 5. Archetype-Level Performance

A subset of the 50+ classified strategic archetypes:

| Archetype | EP accuracy | SF18 accuracy | Edge | N |
|---|---|---|---|---|
| piece_general_pressure | 80.27% | 63.83% | **+16.44pp** | ~430K |
| kingside_coordinated_siege | 76.10% | 64.50% | +11.60pp | ~210K |
| sacrificial_kingside_assault | 73.80% | 65.40% | +8.40pp | ~95K |
| central_space_advantage | 71.20% | 67.90% | +3.30pp | ~180K |
| positional_squeeze | 70.40% | 67.20% | +3.20pp | ~310K |
| king_hunt | 78.90% | 70.10% | +8.80pp | ~85K |

---

## 6. Cross-Domain Validation (Same Architecture, Different Data)

The path-based representation has been benchmarked on non-chess datasets to verify the architecture is not chess-specific:

| Domain | Dataset | EP F1 / Accuracy | Baseline | Improvement |
|---|---|---|---|---|
| Industrial fault detection | Tennessee Eastman Process | 93.3% F1 | 72.7% (persistence) | **+20.6pp** |
| Battery degradation | NASA + custom 140-cell corpus | 89.0% critical-state recall | 91.8% (persistence) | within 2.8pp |
| Energy grid | Custom power-grid stability set | 66.6% 3-way accuracy | random ~33% | **+33pp over random** |
| Astronomical | ZTF transient classification | (running) | TBD | TBD |
| Markets | EP market-prediction worker | +17.1pp over baseline (validation) | — | published separately |

Full details for each domain are in `src/pages/AcademicPaper.tsx` and the corresponding worker logs in `farm/workers/`.

---

## How These Numbers Are Maintained

- The headline corpus grows continuously as new games are ingested. Numbers in this document reflect a snapshot; the verification script returns live current numbers.
- Updates to this document are tracked in git; the canonical history is preserved.
- A discrepancy between this document and `node audit/verify.mjs` should be reported as a bug.

---

## Last Reviewed

| Section | Last verified |
|---|---|
| Headline result | (run `node audit/verify.mjs`) |
| Chess960 stratification | (run `node audit/verify.mjs`) |
| Eval zone breakdown | Pending re-run from public view |
| Cross-domain validation | See `src/pages/AcademicPaper.tsx` |
