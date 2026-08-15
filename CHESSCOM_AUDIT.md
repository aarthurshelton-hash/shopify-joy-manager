# En Pensent — Audit from Chess.com's Perspective

**Prepared:** August 2026
**Audience:** Chess.com evaluation team (engineering, product, M&A)
**Subject:** En Pensent chess prediction system — what it is, what it does, and what it's worth

---

## Executive Summary

En Pensent is a single-founder, pre-revenue, unincorporated research project that has built a novel path-based chess outcome prediction system. It is **not a product**, has **no users**, generates **no revenue**, and is **not incorporated**. Its core technical claim — a +5.43pp accuracy edge over Stockfish 18 on 3-way outcome prediction — is real but modest when properly contextualized against calibrated baselines. The system's most valuable asset is its Chess960/Freestyle performance, where it achieves +19.13pp over Stockfish in a domain where Stockfish has no opening book.

From Chess.com's perspective, En Pensent is **not an acquisition target in its current form**. It is a research prototype that would need significant investment to productize. However, it contains one genuinely novel idea — trajectory-based position representation — that could complement Chess.com's existing ML stack (Maia-2, Stockfish integration) if integrated as a feature layer rather than a standalone system.

**Estimated value to Chess.com:** $50K–$200K (acqui-hire / IP license range), contingent on the founder joining Chess.com's ML team. Not a standalone acquisition.

---

## 1. What En Pensent Actually Is

### 1.1 Technical Description

En Pensent ("EP") is a chess outcome prediction system that represents positions as **path histories** rather than static board states. For each move in a game, it records:

- Where every piece has been (trajectory tracing through intermediate squares)
- Which squares have been visited, by which piece type, at what move number
- An 8-quadrant spatial decomposition of the board with piece-type dominance ratios
- Shannon entropy of piece distribution per quadrant
- A strategic archetype classification (50+ archetypes: kingside attack, positional squeeze, etc.)

This "color flow signature" is fed into a prediction engine that fuses it with a Stockfish evaluation and produces a 3-way prediction (white wins / black wins / draw) with a confidence score.

### 1.2 The v9.0 Fusion Architecture (current)

As of August 2026, the system has been upgraded to a 3-signal fusion:

1. **EP color-flow signature** — decides the outcome (primary predictor)
2. **Maia-2** (NeurIPS 2024) — calibrates the confidence (agreement/disagreement signal)
3. **Stockfish 18 eval** — provides tactical coverage in extreme positions (>300cp)
4. **Isotonic regression** — maps raw confidence to empirical accuracy

The fusion uses each signal for what it's best at: EP has the highest single-model accuracy, Maia-2 provides calibration, and Stockfish handles tactical certainty.

### 1.3 Infrastructure

- **Database:** Supabase (free tier) with ~13.1M predictions stored
- **Ingestion:** 3 PM2 workers on a single Mac, pulling from Lichess DB (bulk PGN), Lichess API (GM games), and Chess.com public API (by player username)
- **Maia-2 service:** Local Python HTTP service on the same Mac
- **Fusion backfill:** 1 worker processing ~5 positions/sec through the REST API
- **Frontend:** Vite + React app deployed to Vercel at enpensent.com
- **Code:** 102 TypeScript files in `src/lib/chess/`, 57 worker files in `farm/workers/`
- **Repo size:** 15GB (includes model files, PGN caches, node_modules)
- **License:** MIT (code is open source, no patent filed)

### 1.4 What It Is Not

- **Not a chess engine.** It cannot play chess or recommend moves. It only predicts outcomes.
- **Not a product.** No mobile app, no user dashboard beyond a single `/explore` page, no subscription, no API customers.
- **Not incorporated.** No legal entity, no IP protection, no employees.
- **Not independently validated.** The audit package (`AUDIT.md`) is self-authored. No peer review, no published paper, no third-party benchmark.
- **Not scalable.** Running on a single Mac with Supabase free tier. The connection pool issues that took down Supabase during this audit demonstrate the infrastructure cannot handle production load.

---

## 2. What En Pensent Claims (and What's Real)

### 2.1 Headline Claim: +5.43pp over Stockfish 18

**Claim:** 69.24% accuracy vs Stockfish 18's 63.81% across 12.24M predictions.

**Reality:** The number is real but the comparison is misleading. Stockfish 18 is a chess engine, not a calibrated outcome classifier. The relevant comparison is against:

| Model | Accuracy | Brier | ECE (calibration) |
|-------|----------|-------|--------------------|
| EP v8.07 (original) | 77.0% | 0.189 | 0.170 (poor) |
| Stockfish 18 (raw) | 74.2% | 0.160 | 0.098 |
| Calibrated SF-logistic | 76.0% | 0.154 | 0.027 (excellent) |
| LightGBM | 77.4% | 0.162 | 0.066 |
| Maia-2 (standalone) | 71.1% | 0.235 | 0.159 |
| **EP v9.0 Fusion** | **77.0%** | **0.154** | **0.033** |

*(500-position fresh hold-out, August 2026)*

**Key findings:**
- EP's accuracy edge over a **simple logistic regression on Stockfish eval** is only +1.0pp (77.0% vs 76.0%)
- LightGBM **matches** EP's accuracy (77.4% vs 77.0%) with better calibration
- EP's original confidence values are **poorly calibrated** (ECE 0.170, "poorly calibrated" by standard thresholds) due to artificial clamping at [15, 69]
- The v9.0 fusion fixes the calibration problem (ECE 0.033) and achieves the best Brier score of all models, but the accuracy is unchanged from the original EP

**Bottom line for Chess.com:** The accuracy edge over a calibrated Stockfish baseline is ~1pp. The fusion achieves the best Brier score and log-loss, which matters for user-facing win percentages. But the "we beat Stockfish by 5.43pp" framing overstates the real advantage.

### 2.2 Chess960/Freestyle Claim: +19.13pp over Stockfish 18

**Claim:** 52.62% accuracy vs Stockfish's 33.49% on 1.77M Chess960 games.

**Reality:** This is the strongest claim and the most valuable asset. Stockfish 18 without an opening book falls to near-random (33.49% ≈ 33.33% random baseline) on Chess960. EP's path-based representation is opening-book-independent, so it maintains 52.62% accuracy.

**However:**
- 52.62% accuracy is still modest in absolute terms
- No calibration analysis has been performed on this subset
- No comparison against Maia-2 or LightGBM on Chess960
- Chess.com's own ML team could likely train a model on their Chess960 game data that would outperform EP

**Bottom line for Chess.com:** This is the most interesting result, but it proves the concept rather than delivering a production-ready system. Chess.com is investing in Freestyle chess and could build this internally with their own data.

### 2.3 Eval Zone Claim: +25-29pp in the 0-25cp zone

**Claim:** EP achieves ~43% accuracy vs Stockfish's ~14% in the 0-10cp eval zone.

**Reality:** This is real and consistent with the architecture — EP's trajectory analysis adds the most value exactly where Stockfish's search is least decisive. But the absolute accuracy is still low (43%), and this zone represents a small fraction of total positions. The value is in the signal, not the absolute performance.

### 2.4 Cross-Domain Claims

EP claims to work on industrial fault detection, battery degradation, energy grids, and financial markets. These are not independently verified and the market prediction system has gone through multiple threshold-corruption fixes. Cross-domain generalization is a research claim, not a product feature.

---

## 3. What Chess.com Already Has

To evaluate En Pensent's value, consider what Chess.com already possesses:

| Capability | Chess.com | En Pensent |
|------------|-----------|------------|
| Game database | 30+ billion games | ~13M predictions from scraped public games |
| ML models | Maia-2 (calibrated W/D/L), Stockfish integration | EP color-flow + Maia-2 + SF fusion |
| Users | 150M+ registered, millions of daily active | 0 (no product) |
| Revenue | $100M+ ARR | $0 (pre-revenue) |
| Infrastructure | Global CDN, GPU clusters, dedicated engineering team | Single Mac, Supabase free tier |
| Chess960 data | Massive (investing in Freestyle chess) | 1.77M games scraped from Lichess |
| Calibration | Maia-2 is well-calibrated by design | Fixed in v9.0 via isotonic regression (was broken) |
| Move prediction | Maia-2 predicts human moves | EP does not predict moves |
| Legal entity | Delaware C-corp, $1B+ valuation | Unincorporated, MIT-licensed, no patent |

**The gap:** Chess.com has everything En Pensent has, at greater scale, except the color-flow trajectory representation. That is the single novel contribution.

---

## 4. What Is Actually Valuable

### 4.1 The Color-Flow Trajectory Representation (Moderate Value)

The core idea — encoding where pieces have been rather than where they are — is genuinely novel in chess prediction. No published chess ML system uses this representation. It captures "lines of force" and strategic flow that static evaluations miss.

**Value to Chess.com:** Could be implemented as an additional feature layer in their existing ML pipeline. The 8-quadrant decomposition and archetype classification could augment Maia-2's input features. This is a feature engineering contribution, not a standalone system.

**Risk:** The representation has not been tested at scale against strong baselines with proper hold-out methodology. The +1pp edge over a logistic regression may not survive a larger, properly stratified benchmark.

### 4.2 The Chess960 Result (Moderate Value)

The +19.13pp over Stockfish on Chess960 is the most commercially relevant result because:
- Chess.com is investing in Freestyle chess
- Stockfish structurally cannot help here (no opening book)
- The path-based representation is opening-book-independent by design

**Value to Chess.com:** A Freestyle-specific prediction model could be a differentiator for Chess.com's Freestyle product. EP's approach could be the starting point.

**Risk:** Chess.com could train their own model on their own Chess960 data (which is vastly larger than EP's 1.77M games) and likely outperform EP. The value is in the idea, not the model.

### 4.3 The Fusion Architecture (Low Value)

The v9.0 fusion (EP + Maia-2 + SF + isotonic calibration) is a reasonable ensemble design, but it's standard ML engineering. Chess.com already has Maia-2 and Stockfish; adding a third signal is incremental, not breakthrough.

### 4.4 The 13M Prediction Corpus (Low Value)

The corpus is scraped from public Lichess and Chess.com games. Chess.com already has the source data at 1000x the scale. The predictions themselves are EP's output, which is only valuable if EP's model is valuable.

### 4.5 The Codebase (Low Value)

MIT-licensed, open source. No IP protection. Anyone can fork it. The code is functional but not production-grade — single-Mac deployment, Supabase free tier, no tests, no CI/CD.

---

## 5. What's Missing

From Chess.com's perspective, these gaps make En Pensent unsuitable for acquisition or integration in its current form:

### 5.1 No Independent Validation
- The audit is self-authored
- No peer-reviewed publication (the arXiv preprint is a draft, not submitted)
- No third-party benchmark (the benchmark in this repo was run by the founder)
- No replication by an independent team

### 5.2 No Production Infrastructure
- Single Mac, Supabase free tier
- No horizontal scaling, no GPU inference, no CDN
- The Supabase project crashed during this audit from connection pool exhaustion
- No monitoring, alerting, or SLA

### 5.3 No Product or Distribution
- No mobile app (Chess.com is mobile-first)
- No user base
- No API customers
- No brand recognition in the chess community

### 5.4 No Legal Protection
- MIT-licensed code (anyone can use it)
- No patent filed on the color-flow representation
- Not incorporated (no entity to acquire)
- No employment contracts, no non-competes

### 5.5 No Human Move Prediction
- Maia-2 predicts what moves humans will make — this is what Chess.com uses for game review and hints
- EP only predicts outcomes (W/D/L), not moves
- This limits EP's utility to the win-probability bar, not the move-coaching feature

### 5.6 Calibration Was Broken (Now Fixed)
- The original EP had ECE 0.170 (poorly calibrated) due to confidence clamping at [15, 69]
- This was fixed in v9.0 with isotonic regression (ECE 0.033)
- But the fix was applied during this audit — it would not have been caught by the original system

---

## 6. Valuation Scenarios

### Scenario A: Acqui-Hire ($50K–$200K)

Chess.com hires the founder as an ML engineer and licenses the color-flow representation as a feature layer. The founder brings:
- The trajectory representation idea
- Experience building chess ML systems
- The v9.0 fusion architecture design

Chess.com does not acquire the company (there is none), the code (it's MIT-licensed), or the data (it's scraped from public sources). The value is in the founder's expertise and the novel feature representation.

**Comparable:** Typical acqui-hire for a pre-revenue solo founder with novel IP but no product: $50K–$200K + employment offer.

### Scenario B: IP License ($25K–$100K)

Chess.com licenses the color-flow representation patent (if one were filed) and implements it internally. The founder does not join Chess.com.

**This scenario requires the founder to file a patent first**, which has not been done. Without a patent, the MIT-licensed code is free to use.

### Scenario C: Internal Build ($0)

Chess.com's ML team reads the arXiv preprint, implements the trajectory representation as a feature in their existing pipeline, and trains on their own 30B-game database. They likely outperform EP within weeks because they have:
- 1000x more data
- GPU infrastructure
- A team of ML engineers
- Maia-2 already integrated

**This is the most likely outcome.** The color-flow idea is published in the arXiv preprint (MIT-licensed code). Chess.com can implement it without acquiring anything.

### Scenario D: Partnership / Integration ($10K–$50K)

Chess.com contracts the founder to integrate EP's trajectory features into their Maia-2 pipeline as a consultant. This is a short-term engagement, not an acquisition.

---

## 7. The Honest Assessment

### What Chess.com would see if they looked at this today:

1. **A solo founder's Mac** running 5 PM2 workers, scraping public games from Chess.com's own API at ~1 req/sec
2. **A Supabase free-tier database** with 13M predictions that crashed during this audit from connection exhaustion
3. **An MIT-licensed codebase** with no IP protection, no patent, no legal entity
4. **A novel representation** (color-flow trajectory) that achieves +1pp over a logistic regression on standard chess, +19pp on Chess960 where Stockfish has no opening book
5. **A fusion architecture** that combines EP + Maia-2 + Stockfish with isotonic calibration, achieving the best Brier score in a small benchmark
6. **No product, no users, no revenue, no team**

### What Chess.com would actually want:

1. **The color-flow idea** — implementable from the arXiv preprint, no acquisition needed
2. **The Chess960 result** — interesting but Chess.com has vastly more Chess960 data
3. **The founder** — if they want another ML engineer with chess domain expertise

### What Chess.com would NOT want:

1. **The infrastructure** — single Mac, Supabase free tier
2. **The codebase** — MIT-licensed, no IP protection
3. **The data** — scraped from Chess.com's own public API
4. **The product** — there isn't one
5. **The legal entity** — there isn't one

---

## 8. Recommendations for En Pensent

If the goal is to make En Pensent valuable to Chess.com (or any chess platform), these are the priorities, in order:

### 8.1 File a Patent on the Color-Flow Representation (URGENT)

The color-flow trajectory representation is the single novel, potentially patentable idea. Without a patent, the MIT-licensed code is free for anyone to use, including Chess.com. A provisional patent would cost ~$2K and establish priority.

### 8.2 Get Independent Validation

The current audit is self-authored. To be taken seriously by Chess.com or any acquirer:
- Submit the arXiv preprint and get it indexed
- Have an independent researcher (not the founder) run the benchmark
- Publish the benchmark code and data

### 8.3 Run a Proper Large-Scale Benchmark

The current benchmark is 500 positions on a Mac CPU. A credible benchmark needs:
- 10,000+ hold-out positions
- GPU-accelerated Maia-2 inference
- Stratification by eval zone, phase, time control, and player rating
- Confidence intervals (bootstrap or Wilson)
- Comparison against Chess.com's actual production model (if available)

### 8.4 Productize the Chess960 Result

The Chess960/Freestyle edge is the most commercially relevant result. Build a product around it:
- A Freestyle chess win-probability API
- A browser extension that shows EP predictions for Freestyle games on Chess.com
- A comparison dashboard showing EP vs Stockfish on live Freestyle games

### 8.5 Incorporate

No serious acquirer will engage with an unincorporated solo founder. A Delaware C-corp or Canadian equivalent is a prerequisite for any M&A conversation.

### 8.6 Fix the Calibration in Production

The v9.0 fusion fixes the calibration issue (ECE 0.170 → 0.033), but the fix is currently only in the backfill worker. The main ingest workers still write the original v8.07 clamped confidence. The production pipeline needs to write fusion results for all new predictions, not just backfilled ones.

### 8.7 Scale the Infrastructure

A single Mac with Supabase free tier is not a credible infrastructure for a Chess.com partnership. At minimum:
- Move to a cloud VM with GPU for Maia-2 inference
- Upgrade Supabase to a paid tier (or migrate to a dedicated Postgres)
- Add monitoring, alerting, and uptime tracking

---

## 9. Final Verdict

**En Pensent is a research project with one good idea (trajectory-based position representation) and one strong result (Chess960), wrapped in a non-product with no legal protection and no independent validation.**

**To Chess.com, it is worth the arXiv preprint (free) and possibly the founder's expertise (acqui-hire range). It is not worth acquiring as a company, product, or platform.**

**The path to meaningful value is: patent the representation → publish the paper → get independent validation → productize the Chess960 result → incorporate → then approach Chess.com with a real product and protected IP.**

---

*This audit was prepared by analyzing the En Pensent codebase, database (13.1M predictions), benchmark results (500-position hold-out), production infrastructure (PM2 workers on macOS), and published claims (RESULTS.md, AUDIT.md). All numbers are from live system state as of August 2026.*
