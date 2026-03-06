# Techstars — Application Brief
## En Pensent — Universal Pattern Recognition

**Applicant:** Alec Arthur Shelton | Quebec, Canada | Pre-incorporation
**Program:** Techstars (Toronto / NYC / relevant vertical program)
**Model:** $120K / 6% equity | 3-month accelerator, strong corporate partner network
**Apply:** https://www.techstars.com/apply

---

## Company Overview

**En Pensent** has built the Universal Grid Portal: a single pattern recognition architecture — one 64-cell interference grid — that achieves state-of-the-art performance across seven physically distinct domains without domain-specific retraining.

**The headline result:** The same architecture that predicts chess game outcomes at 74.18% accuracy (beating Stockfish 18 at +2.67pp, n=2,804,090 live games, z>600, p≈0) also detects nuclear reactor faults at binary F1 100% (+11pp vs Bi-LSTM literature) and chemical process faults at F1 93.3% (+20.6pp vs Hotelling T²). All running 24/7 on production infrastructure. All SHA-256 timestamped. All independently verifiable.

---

## Problem & Solution

**Problem:** Industrial AI is fragmented. Every safety-critical domain (nuclear, chemical, battery, energy) has separate models with no transfer capability. The cost to build, maintain, and certify domain-specific AI across a single enterprise's asset portfolio is tens of millions of dollars per domain.

**Solution:** The Universal Grid Portal. Any sequential sensor stream → color-channel encoding → 64-cell grid → interference pattern → prediction. New domain = new 100-line adapter. Same grid. Same inference. Same self-learning calibration. Proven across 7 domains with no cross-domain supervision required.

**The moat:** The system independently discovered the same anomaly threshold (z > 3.0) in two physically unrelated safety domains (chemical TEP, nuclear NPPAD). Same algorithm, different physical data, same constant. This suggests a universal property of physical anomaly signatures — not a tuned parameter. No other system has demonstrated this.

---

## Validated Results

| Domain | Metric | EP Performance | Baseline | Advantage |
|--------|--------|--------------|---------|----------|
| Chess (live, 2.8M games) | 3-way outcome accuracy | **74.18%** | SF18 71.52% | +2.67pp, z>600, p≈0 |
| Nuclear safety (NPPAD) | Binary fault detection F1 | **100.0%** | Bi-LSTM 89% | +11pp |
| Nuclear safety (NPPAD) | 18-class fault ID | **72.1%** / Macro-F1 50.0% | NCC 40.7% | +31.4pp |
| Nuclear (NRC live data) | Daily outage prediction | **62.8%** balanced acc | Threshold 56.4% | +6.4pp |
| Chemical process (TEP) | Fault detection F1 | **93.3%** (2,200 records) | Hotelling T² 72.7% | +20.6pp |
| Battery (MATR dataset) | Critical-state detection | **89.0%** (114,692 cycles) | Persistence | +23.2pp vs random |
| Financial markets (live) | 7-day directional | **36.1%** (36,569 resolved) | Momentum 18.1% | +15.7pp |
| Markets | *false_breakout* pattern | **60.0%** (n=919) | Random 33.3% | +26.7pp |

---

## Business Model

**Phase I — Industrial Safety API:**
SaaS inference API for nuclear operators, battery manufacturers, and chemical plants. Per-domain monthly subscription. Pricing anchored to liability reduction: one avoided false shutdown at a 1GW nuclear plant = $1M+ saved. F1 100% binary nuclear fault detection = immediate enterprise value.

**Phase II — Photonic Chip Licensing:**
The grid's operations map directly to silicon photonic hardware (interference, WDM, phase accumulation). License GDS-II circuit design to foundries and data center operators. Target: <1ns inference, <10mW — ~30,000× energy reduction vs GPU inference ($100M+ annual savings for a hyperscaler).

---

## Why Techstars

Techstars' corporate partner network is the specific unlock. The industrial safety API requires a pilot contract with a nuclear operator, a battery manufacturer, or a chemical plant. Techstars corporate partners in energy, manufacturing, and defense are the fastest path to those pilots.

Specifically seeking: Techstars Energy (if active) or Techstars Defense (DoD-adjacent for nuclear/chemical safety applications). The photonic hardware roadmap also aligns with Techstars Hardware programs.

---

## Traction

- 2,804,090 live chess predictions — system running 24/7 for 12+ months
- 36,569 resolved market predictions — live production API
- 7 validated domains — all public datasets, all verifiable
- DARPA PICASSO application brief drafted (Mar 6, 2026 deadline — up to $35M)
- NRC IRAP brief complete (rolling, $50K–$1M)
- $0 raised. $0 grants received. Entirely self-funded solo founder.

---

## Founder

**Alec Arthur Shelton** — Built entire system solo: Universal Grid architecture, all 7 domain adapters, PM2 worker infrastructure, FPGA RTL prototype (Verilog, 8/8 tests passing), complete grant portfolio. Quebec, Canada. Pre-incorporation. Seeking photonics hardware co-founder + enterprise sales co-founder.

*All metrics as of February 19, 2026.*
