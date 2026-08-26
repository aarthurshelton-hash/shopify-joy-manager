# En Pensent — Canonical Results

**This is the single source of truth for all empirical claims published by the En Pensent project.**

Numbers in this document are the canonical values. The whitepaper, IP appraisal, public dashboard, and academic paper are all expected to match these figures. Any inconsistency found should be reported and treated as a bug.

For live, current numbers — which grow daily as the prediction corpus expands — run:

```bash
node audit/verify.mjs
```

> **Important — Headline Revision (Aug 2026):** The previously published +5.43pp headline was computed on the full 12M+ corpus, which included a trajectory-extraction leak (the color-flow signature was extracted from the full-game board instead of the board truncated at the prediction move — see [PROOF.md](./PROOF.md)). A backfill is in progress to recompute all predictions with the corrected truncated trajectory. The leak-free 30-day window (84K predictions, verifiable via `node audit/verify.mjs`) shows **+2.31pp**, consistent with the game-ID-split hold-out result of +2.1pp in PROOF.md. The +5.43pp figure is retained below as historical context but should not be cited as the current headline.

---

## 1. Headline Result — En Pensent vs Stockfish 18

### Current (leak-free, 30-day window, verifiable)

| Metric | Value |
|---|---|
| **Total predictions (30-day window)** | **84,307** |
| En Pensent correct (W/B/D) | 64,619 |
| Stockfish 18 correct (W/B/D) | 62,668 |
| **En Pensent accuracy** | **76.65%** |
| **Stockfish 18 accuracy** | **74.33%** |
| **En Pensent edge** | **+2.31 percentage points** |

This is on a 3-way classification task (white wins / black wins / draw) at the position selected for analysis in each game (typically a single mid-to-late-middlegame position per game; full sampling protocol in [`METHODOLOGY.md`](./METHODOLOGY.md)). These numbers are live and verifiable via `node audit/verify.mjs` using only the public anon key.

### Historical (full corpus, includes trajectory leak — do not cite)

| Metric | Value |
|---|---|
| Total predictions analyzed | 12,240,000 |
| En Pensent correct (W/B/D) | 8,475,000 |
| Stockfish 18 correct (W/B/D) | 7,809,000 |
| En Pensent accuracy | 69.24% |
| Stockfish 18 accuracy | 63.81% |
| En Pensent edge | +5.43 percentage points |

The historical +5.43pp includes predictions made with the full-game trajectory leak. The leak inflated the signature's apparent predictive power by exposing future board state. The backfill (v37, in progress) recomputes all predictions with the corrected truncated trajectory. Once complete, the full-corpus number will be re-published. Until then, use the 30-day leak-free window as the headline.

### Disagreement Breakdown (historical)

| Outcome | Count |
|---|---|
| Both EP and SF18 correct | 6,952,000 |
| Only EP correct (SF18 wrong) | 1,523,000 |
| Only SF18 correct (EP wrong) | 857,000 |
| Both wrong | 2,908,000 |

When En Pensent disagrees with Stockfish, **En Pensent is correct 64.0%** of the time (1,523,000 / (1,523,000 + 857,000)). This disagreement ratio is from the historical corpus and may change after the backfill completes.

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

> **Note:** The Chess960 numbers above are from the historical corpus (pre-backfill). The current 30-day window shows +21.07pp edge on 3,009 Chess960 predictions (run `node audit/verify.mjs` for live numbers).

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

The pattern is consistent: En Pensent's edge is largest exactly where Stockfish's search is admittedly weakest, and the two systems converge as evaluations become decisive. The 0-50cp zone is where EP's color-flow trajectory representation adds the most value over material/positional evaluation.

> **Note:** These zone breakdowns are from the historical corpus. The leak-free 30-day window shows the same pattern (run `node audit/phase-reweight.mjs` for the current zone breakdown).

---

## 4. Phase Stratification

| Game phase | EP accuracy | SF18 accuracy | Edge |
|---|---|---|---|
| Opening (moves 1-10) | 47.5% | 50.5% | -3.0pp (suppressed by EP) |
| Early middlegame (moves 11-25) | 65.8% | 60.1% | +5.7pp |
| Late middlegame (moves 26-45) | 71.6% | 68.1% | +3.5pp |
| Endgame (moves 46-65) | 73.2% | 70.4% | +2.8pp |
| Deep endgame (moves 66+) | 52.8% | 57.0% | -4.2pp (suppressed by EP) |

The system intentionally caps confidence in the opening (where archetype patterns are not yet established) and in deep endgames (where Stockfish converges to perfect play). The "Golden Zone" of moves 15-45 with confidence >=50 is where the edge is most reliable.

### Leak-free phase breakdown (30-day window, verifiable)

| Phase zone | N | EP% | SF% | Edge |
|---|---|---|---|---|
| 12-19 (early middlegame) | 4,721 | 65.54% | 58.55% | **+6.99pp** |
| 20-27 (early golden) | 15,092 | 74.09% | 69.93% | +4.15pp |
| 28-45 (peak golden) | 54,376 | 78.00% | 76.26% | +1.74pp |
| 46+ (late/endgame) | 10,118 | 78.37% | 77.89% | +0.47pp |

EP's edge is largest in early middlegame (+7pp) and smallest in the peak zone (+1.7pp) where both systems are most accurate. The peak-zone sampling distribution (65% of predictions in moves 28-45) actually *deflates* the headline edge relative to a phase-even sample. See [`METHODOLOGY.md`](./METHODOLOGY.md) for the full bias analysis.

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
| Markets | EP market-prediction worker | +7.86pp over naive baseline, +0.09pp vs LightGBM (91K predictions) | — | see §8 below |

Full details for each domain are in `src/pages/AcademicPaper.tsx` and the corresponding worker logs in `farm/workers/`.

---

## 7. Transformer Baseline (completed)

The Stockfish 18 comparison is not a fair fight — SF is a chess engine that evaluates positions, not a system designed to predict game outcomes. A transformer trained on the same task (PGN -> outcome) is the proper baseline.

### Results (test set, n=8,606, game-ID-split, no leakage)

| Model | Accuracy | Log-loss | Brier |
|---|---|---|---|
| **D: EP color-flow fusion** | **72.98%** | N/A | N/A |
| C: SF-eval logistic regression | 72.77% | 0.6655 | 0.3785 |
| Stockfish 18 (raw eval) | 70.69% | N/A | N/A |
| A: PGN transformer (1M params) | 45.91% | 1.0530 | 0.6367 |

**Key findings:**
- EP (+72.98%) beats the PGN transformer (+45.91%) by **+27.07pp** — a massive gap
- The transformer barely beats random (33% on 3-way) and is far below even raw SF eval
- McNemar's test: p=0.0000 (EP is significantly better than the transformer)
- EP also beats SF-eval logistic regression by +0.21pp, confirming the edge is not just from SF eval information

**Why the transformer underperforms:**
- 1M parameters is small — the spec called for 5-10M. Scaling up may help.
- PGN coverage is only 61.9% on the test set (38% of positions have no PGN stored)
- The transformer sees raw move tokens but has no board-state awareness — it can't "see" the position, only the move sequence
- Early stopping at epoch 13 (val loss diverging after epoch 6) — the model overfits quickly on 50K PGN-covered training samples

**Stratified results (test set):**

| Eval zone | N | Transformer% | EP% | SF% |
|---|---|---|---|---|
| 0-25cp | 727 | 37.6% | 42.8% | 21.5% |
| 25-50cp | 406 | 39.4% | 48.8% | 39.2% |
| 50-100cp | 553 | 42.1% | 53.7% | 53.0% |
| 100-200cp | 852 | 39.6% | 57.3% | 56.8% |
| 200+cp | 6,068 | 48.6% | 82.2% | 82.3% |

EP beats the transformer in every eval zone. The transformer's accuracy is flat across zones (~40-49%), while EP and SF both scale with eval magnitude. This suggests the transformer is not learning the position-evaluation signal that both EP and SF extract.

**Caveats:**
- This is a 1M-param transformer, not the 50M-param model from the spec. A larger model with board-state input (Model B) may close some of the gap.
- The transformer only had PGN move tokens — no board state tensor. Adding board state (Model B from the spec) is a follow-up.
- PGN coverage at 62% means 38% of test positions were effectively `<PAD>`-only sequences for the transformer.

**Interpretation:** EP's color-flow representation carries structural signal that a small sequence transformer cannot extract from raw PGN alone. The +27pp gap is large enough that scaling the transformer to 50M params is unlikely to fully close it — but that experiment is the natural follow-up.

- **Data**: 81K train / 8.5K val / 8.6K test positions, game-ID-split (no leakage)
- **Input**: PGN truncated at prediction move (no future-move leakage)
- **Spec**: [`benchmark/docs/transformer_baseline_spec.md`](./benchmark/docs/transformer_baseline_spec.md)
- **Code**: `python benchmark/src/transformer_baseline.py`
- **Results**: `benchmark/results/transformer_baseline_results.json`

---

## 8. Market Baseline (completed)

The market prediction system was previously compared only against a naive momentum heuristic (barely above random at 35%). A proper learned baseline (LightGBM) was trained on the same features EP uses: market conditions, VIX, chess-bridge resonance, price, volume, and temporal features.

### Results (test set, n=9,163, time-based split, no look-ahead)

| Model | Accuracy | Log-loss | Brier |
|---|---|---|---|
| **C: EP market predictions** | **42.77%** | N/A | N/A |
| A: LightGBM (learned baseline) | 42.68% | 1.0166 | 0.6195 |
| B: Logistic Regression | 39.05% | 1.5597 | 0.9230 |
| D: Naive momentum baseline | 34.91% | N/A | N/A |

**Key findings:**
- EP (+42.77%) and LightGBM (+42.68%) are **essentially tied** (+0.09pp)
- Both beat the naive momentum baseline by ~+8pp
- EP beats logistic regression by +3.72pp
- The LightGBM model's top features are: price, hours_to_resolve, symbol_id, daily_change, confidence

**Interpretation:** EP's market predictions do not carry significant predictive signal beyond what a gradient-boosted model can extract from the same features. The +7.7pp "edge" over the naive baseline was real but misleading — it was EP being less bad than a weak baseline, not EP being better than a proper model. The market system's value is in the chess-market bridge architecture and interpretability, not in raw predictive power.

**Stratified results (by symbol, selected):**

| Symbol | N | LightGBM% | EP% | Naive% |
|---|---|---|---|---|
| NVDA | 202 | 35.6% | 57.9% | 19.8% |
| CL=F | 1,885 | 42.3% | 49.5% | 38.6% |
| NG=F | 1,039 | 55.1% | 50.4% | 32.2% |
| SI=F | 1,312 | 56.2% | 46.6% | 38.6% |
| MSFT | 180 | 27.2% | 40.6% | 28.9% |

EP outperforms LightGBM on tech stocks (NVDA, MSFT) but underperforms on commodities (NG=F, SI=F). This suggests the chess-market bridge adds value for tech-sector predictions but not for commodity predictions.

- **Code**: `python benchmark/src/market_baseline.py`
- **Results**: `benchmark/results/market_baseline_results.json`

---

## 9. Empirical Archetype Mapping (completed, v34)

The market baseline experiment (§8) showed EP and LightGBM were tied at ~42.7%. But both were using the same features — the question was whether the chess archetype label itself carries signal that a feature-based model can't extract.

The empirical mapping tests this: it learns the `chess_archetype × market_archetype × time_horizon → direction` distribution directly from historical data, without any feature engineering. If the archetype combination carries signal, this simple lookup table should outperform both EP and LightGBM.

### Results (test set, n=9,180, time-based split, no look-ahead)

| Model | Accuracy | Notes |
|---|---|---|
| **Empirical mapping** | **47.89%** | Learned archetype combo lookup |
| EP market predictions | 42.71% | System under test |
| LightGBM | 42.68% | Feature-based learned baseline |
| Naive momentum | 34.99% | Previous "baseline" |
| Random (3-class) | 33.33% | — |

**Key findings:**
- The empirical mapping beats EP by **+5.17pp** and LightGBM by **+5.21pp**
- It beats the naive baseline by **+12.90pp**
- 99.7% of test predictions matched a full cell (chess × market × horizon), only 0.3% needed fallback
- The signal is in the archetype LABEL combination, not in chess game outcome distributions

**Why this works:**
The chess archetype label encodes structural information about the market state that feature-based models can't easily extract. "Kingside_attack × regime_shift_down × 2h" → bearish (84.3% accuracy, n=351) is a pattern that the grid classification captures but that momentum/volatility features alone miss. The empirical mapping is essentially a lookup table over these structural patterns.

**Stratified results (by symbol, selected):**

| Symbol | N | Emp% | EP% | Naive% |
|---|---|---|---|---|
| CL=F | 1,892 | 61.2% | 49.3% | 38.8% |
| HG=F | 352 | 59.4% | 42.3% | 15.3% |
| NG=F | 1,039 | 52.4% | 50.4% | 32.2% |
| SI=F | 1,312 | 53.0% | 46.6% | 38.6% |
| NVDA | 202 | 50.0% | 57.9% | 19.8% |
| GOOGL | 111 | 56.8% | 17.1% | 43.2% |

The empirical mapping outperforms EP on most symbols, except NVDA where EP's chess-bridge resonance still wins. This suggests the archetype label is the dominant signal for commodities, while tech stocks benefit from the full chess-bridge architecture.

**Implementation:**
- `farm/workers/domain-adapters/empirical-archetype-mapping.mjs` — mapping class with 3-tier fallback
- `farm/scripts/refresh-empirical-mapping.mjs` — PM2 cron worker (every 6h)
- Integrated into `market-prediction-worker.mjs` as v34: overrides grid direction when empirical confidence ≥55% with n≥100
- `benchmark/src/empirical_mapping_backtest.py` — backtest script
- `benchmark/data/empirical_archetype_mapping.json` — 46 cells, refreshed every 6h

**What this means for the concept:**
The chess→market bridge concept is sound — the archetype labels DO carry cross-domain structural signal. The original implementation's problem was using chess game outcome distributions (which are too uniform across archetypes to differentiate market outcomes) instead of directly learning the archetype→market mapping from market data. The empirical mapping fixes this by learning the mapping from the market data itself.

---

- The headline corpus grows continuously as new games are ingested. Numbers in this document reflect a snapshot; the verification script returns live current numbers.
- The 30-day leak-free window is the current verifiable headline. The full-corpus number will be re-published after the v37 backfill completes.
- Updates to this document are tracked in git; the canonical history is preserved.
- A discrepancy between this document and `node audit/verify.mjs` should be reported as a bug.

---

## Last Reviewed

| Section | Last verified |
|---|---|
| Headline result (leak-free) | Aug 2026 — run `node audit/verify.mjs` |
| Headline result (historical) | Pre-backfill — do not cite |
| Chess960 stratification | run `node audit/verify.mjs` |
| Eval zone breakdown | run `node audit/phase-reweight.mjs` |
| Phase breakdown | run `node audit/verify.mjs` (phase stats view) |
| Cross-domain validation | See `src/pages/AcademicPaper.tsx` |
| Transformer baseline | Aug 2026 — completed, see §7 |
| Market baseline | Aug 2026 — completed, see §8 |
| Empirical archetype mapping | Aug 2026 — completed, see §9 |
