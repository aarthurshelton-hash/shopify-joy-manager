# Memory: features/universal-engine/v7-91-balanced-bias-fix
Updated: Now

## Problem Identified
v7.90-EQUILIBRIUM had **97% white bias** - nearly all predictions were `white_wins` regardless of actual outcome.

### Data Evidence (24h window)
| Actual | Predicted White | Predicted Black | Accuracy |
|--------|-----------------|-----------------|----------|
| white_wins | 963 | 0 | 98.8% ✓ |
| black_wins | 899 | 24 | **2.6%** ✗ |
| draws | 109 | 4 | **0%** ✗ |

## Root Causes

### 1. `determineDominantSide` Bias
The function summed all quadrant values: `kingsideWhite + kingsideBlack + ...`
- White activity = positive values
- Black activity = negative values
- Sum was almost always positive → `'white'` dominant

### 2. `calculateControlSignal` Bias
Used raw differences (`whiteTotalControl - blackTotalControl`) not ratios.
Any small positive skew → massive white advantage signal.

### 3. `calculateArchetypeSignal` Bias
All archetypes had `predictedOutcome: 'white_favored'` or `'balanced'`.
**None** had `'black_favored'`, so archetypes never boosted black.

## v7.91-BALANCED Fixes

### Fix 1: Symmetric `determineDominantSide`
```typescript
// Calculate each side's activity SEPARATELY using absolute values
const whiteActivity = Math.max(0, q.kingsideWhite) + Math.max(0, q.queensideWhite);
const blackActivity = Math.max(0, -q.kingsideBlack) + Math.max(0, -q.queensideBlack);
// Compare using ratio-based thresholds
```

### Fix 2: Ratio-based `calculateControlSignal`
```typescript
const whiteRatio = whiteTotalControl / totalControl;
const blackRatio = blackTotalControl / totalControl;
// Use symmetric thresholds (>60% control = advantage)
```

### Fix 3: Context-aware `calculateArchetypeSignal`
```typescript
// Archetype determines STYLE (draw-prone vs decisive)
// dominantSide determines WHO wins
function calculateArchetypeSignal(archetype, archetypeDef, dominantSide) {
  if (dominantSide === 'black') {
    // Black gets the 62% share of decisive outcomes
  }
}
```

## Files Modified
- `src/lib/chess/colorFlowAnalysis/signatureExtractor.ts` - Fixed `determineDominantSide`
- `src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts` - Fixed all signal calculations
- `src/lib/chess/dualPoolPipeline.ts` - Version bump to 7.91-BALANCED

## Expected Impact
- Prediction distribution: ~50% white, ~45% black, ~5% draw (balanced)
- Black win accuracy: 2.6% → 40%+ target
- Overall accuracy: Path to 80%+ by treating all outcomes symmetrically
