# En Pensent: Data Collaboration Request — Electric Vehicle Engineering

## Validating Cross-Domain Pattern Recognition on Real EV Telemetry

**From:** En Pensent Research (Alec Arthur Shelton)
**To:** EV Engineering Partner
**Date:** February 2026
**Confidentiality:** All data will be used exclusively for research validation. NDAs available on request.

---

## WHAT WE'RE ASKING

We'd like to run En Pensent's interference-based pattern recognition engine on real EV telemetry data to demonstrate measurable improvement over standard estimation methods. We need historical sensor data with known outcomes — the same structure we use for our chess benchmark (9,500+ verified predictions to date).

**This is not a sales pitch.** We want to prove — or disprove — that multi-domain interference outperforms single-domain models on real vehicle data. If it doesn't work, we learn something. If it does, we both have a publishable result.

---

## DATA REQUESTS (Priority Order)

### 1. Range Prediction Validation (Highest Value)

**What we need:**

| Field | Description | Format |
| --- | --- | --- |
| Trip ID | Unique identifier per trip | String |
| Start SOC (%) | State of charge at departure | Float |
| End SOC (%) | State of charge at arrival | Float |
| Distance (km) | Actual distance traveled | Float |
| Duration (min) | Trip duration | Float |
| Avg speed (km/h) | Average speed | Float |
| Ambient temp (°C) | Outside temperature | Float |
| HVAC energy (kWh) | Energy consumed by climate control | Float |
| Passenger count | Number of passengers (if bus) | Integer |
| Route ID | Repeated route identifier (if applicable) | String |
| Elevation gain (m) | Total elevation gained | Float |
| Date/time | When the trip occurred | ISO timestamp |

**Minimum volume:** 200+ trips (ideally 1,000+)
**Anonymization:** Route IDs can be hashed, GPS coordinates are NOT needed

**What we'll prove:** En Pensent's multi-domain interference predicts remaining range more accurately than `SOC × capacity / avg_consumption`. Target: reduce range estimation error by 5-15%.

---

### 2. Battery Degradation Tracking (High Value)

**What we need:**

| Field | Description | Format |
| --- | --- | --- |
| Vehicle/pack ID | Anonymized identifier | String |
| Date | Measurement date | ISO date |
| Cycle count | Total charge cycles to date | Integer |
| Capacity (Ah or kWh) | Measured capacity | Float |
| Internal resistance (mΩ) | Pack or cell-level | Float |
| Avg daily temp (°C) | Average operating temperature | Float |
| Avg daily discharge (kWh) | Daily energy throughput | Float |
| Fast charge count | Number of DC fast charges | Integer |
| Calendar age (days) | Days since commissioning | Integer |

**Minimum volume:** 50+ packs with 6+ months of history each
**Anonymization:** Vehicle IDs can be hashed

**What we'll prove:** En Pensent detects degradation archetype transitions (calendar → cycle → thermal abuse) earlier than standard capacity-fade curves. Target: predict capacity at 1,000 cycles with <3% error.

---

### 3. Thermal Event Detection (Medium Value)

**What we need:**

| Field | Description | Format |
| --- | --- | --- |
| Timestamp | Time of reading | ISO timestamp |
| Cell temps (°C) | Array of cell temperature readings | Array of floats |
| Pack current (A) | Discharge/charge current | Float |
| Ambient temp (°C) | Outside temperature | Float |
| Coolant temp in/out (°C) | Cooling loop temperatures | Float pair |
| Vehicle speed (km/h) | Current speed | Float |
| Event flag | Was this a thermal anomaly? (Y/N) | Boolean |

**Minimum volume:** 100+ hours of continuous logging (ideally including some thermal events)
**Anonymization:** No identifying info needed

**What we'll prove:** The interference network detects thermal anomalies 5-30 minutes before single-threshold BMS alerts by correlating cell temp patterns with current, ambient, coolant, and driving patterns simultaneously.

---

## WHAT WE DO WITH THE DATA

```text
Your historical data
        │
        ▼
┌─────────────────────┐
│  Domain Adapters     │  ← Each sensor type becomes a wavelength
│  (encode to signals) │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Interference        │  ← Cross-domain correlations extracted
│  Network             │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Prediction          │  ← Range / degradation / thermal event
│  + Confidence        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Compare to actual   │  ← Accuracy measured vs. baseline method
│  outcome (holdout)   │
└─────────────────────┘
```

**Protocol:**

1. We split data 80/20 (train/test) — no peeking at test set
2. We run En Pensent's interference engine on the training set to learn cross-domain patterns
3. We predict outcomes on the holdout test set
4. We compare accuracy against your current estimation method
5. We report results honestly — including if we don't beat baseline

---

## WHAT YOU GET BACK

- Full accuracy report comparing En Pensent vs. your current methods
- Identification of cross-domain correlations in your data you may not have seen
- If results are positive: co-authored publication opportunity
- If results are positive: priority access to En Pensent's vehicle intelligence platform
- All analysis code and methodology shared for reproducibility

---

## DATA FORMAT & TRANSFER

- **Preferred:** CSV, Parquet, or JSON
- **Transfer:** Secure file sharing (we'll set up an encrypted endpoint), or USB drive in person
- **Size:** Even 10MB of structured time-series data is enough to start
- **Timeline:** We can run initial analysis within 48 hours of receiving data

---

## OUR TRACK RECORD

| Domain | Predictions | Accuracy | Statistical Significance |
| --- | --- | --- | --- |
| Chess (3-way outcome) | 9,500+ | 54.4% | p ≈ 0 (z > 37) |
| Market (directional) | Accumulating | TBD | Pipeline live |
| Cross-domain correlations | 19,000+ | Validated | Multi-domain proof |

The chess benchmark proves the math works on complex temporal patterns. Your data proves it works on real engineering problems.

---

## CONTACT

**Alec Arthur Shelton** — CEO, En Pensent
Email: a.arthur.shelton@gmail.com
Live system: <https://enpensent.com>

---

*En Pensent — Universal Temporal Pattern Recognition*
*"The same equations. Different substrates. Universal patterns."*
