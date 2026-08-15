# En Pensent — Independent Benchmark + Fusion Architecture

## What This Is

An independent benchmark of the En Pensent chess outcome predictor against three baselines, plus a **fusion architecture (v9.0)** that combines all signals into a single calibrated prediction.

## Architecture: EP + Maia-2 + SF + Isotonic Calibration

The v9.0 fusion uses each signal for what it's best at:
- **EP color-flow** decides the outcome (W/D/L) — highest single-model accuracy
- **Maia-2** calibrates the confidence — agreement/disagreement adjusts confidence
- **Stockfish eval** provides tactical coverage in extreme positions (>300cp)
- **Isotonic regression** maps raw confidence to empirical accuracy (learned from train set)

## Results (500-position hold-out, August 2026)

| Model | N | Accuracy | Brier | Log-loss | ECE |
|-------|---|----------|-------|----------|-----|
| EP v8.07 (original) | 500 | 0.7700 | 0.1885 | 0.5657 | 0.1695 |
| Stockfish 18 (raw) | 500 | 0.7420 | 0.1599 | 0.5045 | 0.0982 |
| Calibrated SF-logistic | 500 | 0.7600 | 0.1542 | 0.4777 | 0.0272 |
| LightGBM | 500 | 0.7740 | 0.1622 | 0.5145 | 0.0656 |
| Maia-2 (standalone) | 487 | 0.7105 | 0.2347 | 0.8358 | 0.1588 |
| **EP v9.0 Fusion (isotonic)** | 500 | **0.7700** | **0.1536** | **0.4708** | **0.0328** |

### Key Findings

1. **Fusion achieves the best Brier score (0.1536) and log-loss (0.4708)** of all models.
2. **ECE improved 5.2x** over original EP (0.170 → 0.033) — from "poorly calibrated" to "well-calibrated".
3. **Accuracy maintained** at 77.0% (same as original EP, 0.4pp behind LightGBM within noise).
4. **Maia-2 standalone is weak on outcome prediction** (71.1%) but valuable as a calibration signal.
5. **Original EP's poor calibration was caused by confidence clamping** at [15, 69] — fixed by isotonic regression.

## Quick Start

```sh
# 1. Create Python 3.12 environment
uv venv --python 3.12 .venv-bench
source .venv-bench/bin/activate
uv pip install maia2 chess lightgbm scikit-learn pandas numpy

# 2. Start the Maia-2 inference service
python benchmark/src/maia_service.py --port 3002 --device cpu --preload &

# 3. Run the fused benchmark (v3 with learned isotonic calibration)
python benchmark/src/run_fusion_v3.py --n-holdout 500 --n-train 3000

# 4. Or run the original benchmark (without fusion)
python benchmark/src/run_benchmark.py --n-holdout 500 --n-train 3000 --device cpu
```

## Files

| File | Purpose |
|------|---------|
| `src/maia_service.py` | Maia-2 HTTP inference service |
| `src/run_benchmark.py` | Original benchmark (EP vs baselines) |
| `src/run_fused_benchmark.py` | v1 fusion benchmark (weighted vote) |
| `src/run_tuned_fusion.py` | v2 fusion (EP decides, Maia calibrates) |
| `src/run_fusion_v3.py` | v3 fusion with learned isotonic calibration |
| `data/` | Cached hold-out positions |
| `results/` | JSON results + isotonic model |

## Scaling Up

For a publication-quality benchmark:
1. Use a GPU machine (CUDA) for Maia-2 inference
2. Increase hold-out to 10,000+ positions
3. Use a truly independent hold-out (games EP has never seen)
4. Stratify by eval zone, phase, archetype, and time control
5. Test on Chess960/Freestyle subset where EP's edge is largest

## Citation

```bibtex
@inproceedings{tang2024maia,
  title={Maia-2: A Unified Model for Human-{AI} Alignment in Chess},
  author={Tang, Zhenwei and Jiao, Difan and McIlroy-Young, Reid and
          Kleinberg, Jon and Sen, Siddhartha and Anderson, Ashton},
  booktitle={NeurIPS},
  year={2024}
}
```
