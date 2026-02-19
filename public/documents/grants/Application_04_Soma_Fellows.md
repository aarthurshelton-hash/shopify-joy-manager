# Soma Capital Fellows — Application Brief
## En Pensent — Universal Pattern Recognition

**Applicant:** Alec Arthur Shelton | Quebec, Canada | Pre-incorporation
**Program:** Soma Capital Fellows (pre-seed)
**Model:** ~$25K / small equity | Fast application, pre-seed stage
**Apply:** https://www.somacap.com/fellows

---

## 60-Second Version

We built a single pattern recognition architecture — a 64-cell interference grid — that achieves state-of-the-art results in 7 physically distinct domains without domain-specific retraining.

- **Chess:** 74.18% vs Stockfish 18's 71.52% (+2.67pp, n=2,804,090 live games, statistically z>600)
- **Nuclear reactor safety:** Binary fault F1 **100%** (beats Bi-LSTM literature +11pp)
- **Chemical fault detection:** F1 **93.3%** (+20.6pp vs industry baseline)
- **Battery degradation:** **89.0%** critical state detection
- **Financial markets:** *false_breakout* pattern **60.0%** accuracy (n=919, vs 33% random)

All running 24/7 on production infrastructure. SHA-256 timestamped. Zero synthetic data.

The system independently discovered the same anomaly threshold (z > 3.0) in nuclear and chemical data — unprogrammed, unsupervised, from different physical systems. The architecture maps directly to photonic hardware (silicon photonics PIC, <10mW, ~30,000× vs GPU). Pre-incorporation Canadian founder. No investors yet.

---

## Full Results

| Domain | Metric | EP | Baseline | Edge |
|--------|--------|----|---------|------|
| Chess (live) | 3-way accuracy | **74.18%** (2.8M games) | SF18 71.52% | +2.67pp, z>600 |
| Nuclear (NPPAD) | Binary fault F1 | **100.0%** | Bi-LSTM 89% | +11pp |
| Nuclear (NPPAD) | 18-class fault ID | **72.1%** | NCC 40.7% | +31.4pp |
| NRC live | Outage prediction | **62.8%** bal acc | Threshold 56.4% | +6.4pp |
| Chemical (TEP) | Fault F1 | **93.3%** | Hotelling T² 72.7% | +20.6pp |
| Battery (MATR) | Critical detection | **89.0%** | Persistence | +23.2pp vs random |
| Markets (live) | 7-day directional | **36.1%** (36,569 resolved) | Momentum 18.1% | +15.7pp |
| Markets | *false_breakout* | **60.0%** (n=919) | Random 33.3% | +26.7pp |

---

## Business Model

**Now:** Industrial safety inference API. Target: nuclear operators ($1M+ cost per false shutdown), battery manufacturers, chemical process plants. F1 100% binary nuclear fault detection is not a research result — it is liability reduction with a clear dollar value.

**Later:** License the photonic integrated circuit design (GDS-II). 30,000× power reduction vs GPU inference. Data center operators pay for per-watt savings at scale.

---

## Why Now / Why Pre-Seed

The system is built. The proof is live. The gap is: (1) co-founder with photonics hardware background for the silicon PIC design phase, (2) enterprise sales into the first industrial safety customer. The Soma fellowship funds the 90-day sprint to sign that first customer.

---

## Founder

**Alec Arthur Shelton** — Sole builder of entire system. Quebec, Canada. Pre-incorporation.

*All metrics as of February 19, 2026.*
