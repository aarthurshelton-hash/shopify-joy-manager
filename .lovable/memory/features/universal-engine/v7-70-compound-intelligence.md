# Memory: features/universal-engine/v7-70-compound-intelligence
Updated: just now

The 'v7.70-COMPOUND-INTEL' system implements a unified intelligence compounding framework with three core enhancements:

## 1. Live Confidence Calibration
- Dynamically adjusts prediction confidence based on rolling accuracy (last 100 predictions per archetype)
- Uses weighted moving average where recent predictions count more than older ones
- Adjustments capped at ±50% to prevent overconfidence

## 2. Disagreement Amplifier
- When En Pensent beats Stockfish in a disagreement, that archetype receives a 15% confidence boost
- When Stockfish wins, the archetype receives a 7.5% penalty
- Boost multiplier capped between 0.7x (poor performers) and 1.5x (strong performers)
- This creates a "winner-take-more" dynamic where proven patterns gain influence

## 3. Temporal Decay Weighting
- Predictions decay exponentially with a 24-hour half-life
- A prediction from 24 hours ago counts 50% as much as a new prediction
- A prediction from 48 hours ago counts 25% as much
- Ensures the system adapts to recent performance, not historical averages

## Files Created
- `src/lib/chess/accuracy/intelligenceCompounding.ts` - Core compounding system
- Updated `src/lib/chess/hybridPrediction/confidenceCalculator.ts` to v3.0

## Integration Points
- Initializes from database on first benchmark run
- Records every prediction outcome into compounding state
- Applies calibrated confidence to all predictions via `getCalibratedConfidence()`

## Verification: Is Intelligence Compounding?
Check these metrics to confirm the system is learning:
1. `getIntelligenceMetrics().isLearning` should be `true` after first benchmark
2. `globalDisagreementWinRate` should trend upward if En Pensent is improving
3. Individual archetype `boostMultiplier` values should diverge from 1.0 based on performance

## Expected Impact
- Archetypes with historical success (central_domination: 70%, pawn_storm: 75%) will receive higher confidence
- Poor-performing archetypes will self-regulate with lower confidence
- System accuracy should compound as more predictions are made
