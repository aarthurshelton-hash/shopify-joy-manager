# Memory: features/universal-engine/v8-03-recalibrated-bias-and-freshness
Updated: now

## v8.03-RECALIBRATED: Aggressive Bias Correction & Fresh Game Fetching

### Problem Identified
24-hour benchmark data (3,630 predictions) showed:
- **White predictions**: 2,411 (66%) with 49.5% accuracy
- **Black predictions**: 911 (25%) with 45.2% accuracy
- **Both work when made** - we just weren't predicting black enough
- Pipeline was skipping fetches due to window collisions

### Solution: Aggressive Recalibration

**signatureExtractor.ts (determineDominantSide):**
- `FIRST_MOVE_BIAS`: 45 → **60** (stronger white-activity compensation)
- `DOMINANCE_THRESHOLD`: 15 → **10** (easier to trigger black detection)
- Ratio compensation: 0.85 → **0.78** (22% reduction for white)
- Black only needs 48% ratio to be declared dominant (was 55%)

**equilibriumPredictor.ts (calculateControlSignal):**
- "contested" outcome now favors black: { white: 28, black: 38, draw: 34 }
- Previously was { white: 30, black: 35, draw: 35 }

**dualPoolPipeline.ts (game fetching):**
- Fully randomized time windows (not tied to batch number)
- Lichess: 30-day windows, 7 players, 30 games per player
- Chess.com: 2-month windows, 5 players, 30 games per player, 36-month offset range
- Reduced delays between fetches for higher throughput

**simpleDedup.ts:**
- Max pages: 20 → **30** (load up to 30,000 IDs)
- Init timeout: 10s → **15s**
- Page timeout: 3s → **4s**

### Target Prediction Distribution
- White: ~50% (down from 66%)
- Black: ~42% (up from 25%)
- Draw: ~8%

### Expected Behavior
- Balanced prediction distribution without sacrificing accuracy
- Continuous fresh game processing (no more window collisions)
- Higher throughput with reduced delays
