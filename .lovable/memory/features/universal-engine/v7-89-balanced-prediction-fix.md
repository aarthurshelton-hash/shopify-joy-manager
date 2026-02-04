# Memory: features/universal-engine/v7-89-balanced-prediction-fix
Updated: Now

## Critical Bug Found

The prediction engine was **always predicting white wins** (98.9% of predictions were white_wins).

### Root Cause Analysis (24h data)
| Outcome | Hybrid Accuracy | Prediction Distribution |
|---------|----------------|-------------------------|
| White wins | 99.2% | 98.9% of all predictions |
| Black wins | 0.9% | 1.0% of predictions |
| Draws | 0% | 0.1% of predictions |

### Bug #1: Prediction Engine Logic (predictionEngine.ts)
```typescript
// OLD BUGGY CODE:
if (archetypeDef.predictedOutcome === 'white_favored') {
  predictedWinner = signature.dominantSide === 'black' ? 'black' : 'white';
}
// This meant: if dominantSide is 'contested' OR 'white' → predict white
// Result: 9/13 archetypes are white_favored → almost always white
```

### Bug #2: Archetype Definitions
- 9 of 13 archetypes have `predictedOutcome: 'white_favored'`
- Only 4 are `balanced`
- **NONE are `black_favored`**

## v7.89-BALANCED Fix

### Core Insight
The predicted winner should be determined by **WHO CONTROLS THE BOARD** (dominantSide), not which archetype is detected. Archetype only adjusts confidence.

### New Prediction Logic (predictionEngine.ts)
```typescript
// v7.89 FIX: Use DOMINANT SIDE as primary factor
if (signature.dominantSide === 'white') {
  predictedWinner = 'white';
} else if (signature.dominantSide === 'black') {
  predictedWinner = 'black';
} else {
  // Contested: use intensity and quadrant control for tiebreaker
  if (signature.intensity < 20) {
    predictedWinner = 'draw';
  } else {
    // Compare quadrant control
    const whiteControl = quadrant.kingsideWhite + quadrant.queensideWhite;
    const blackControl = quadrant.kingsideBlack + quadrant.queensideBlack;
    predictedWinner = whiteControl > blackControl ? 'white' : 'black';
  }
}
```

### Removed Calibration Layer (dualPoolPipeline.ts)
The `calibrateForWhiteBias()` post-processing was removed because:
1. It was a band-aid for the underlying prediction bug
2. The oscillating overcorrection (v7.85→v7.88) proved it was not the right approach
3. With fixed prediction logic, no calibration is needed

### New Fusion Strategy
```typescript
// Agreement → high confidence, use shared prediction
// Strong SF eval (>200cp) → trust Stockfish
// Weak SF eval (<30cp) → trust Color Flow
// Medium → weighted by confidence levels
```

## Files Modified
- `src/lib/chess/colorFlowAnalysis/predictionEngine.ts` - Complete rewrite of prediction logic
- `src/lib/chess/dualPoolPipeline.ts` - Removed calibration, updated to v7.89-BALANCED

## Expected Impact
- Balanced prediction distribution (~48% white, ~45% black, ~7% draw matching actual outcomes)
- Higher accuracy on BOTH white and black wins
- No more oscillating between over-predicting white vs black
