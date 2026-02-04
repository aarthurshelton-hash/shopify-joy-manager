# Memory: features/universal-engine/v7-96-true-dual-detection
Updated: Now

## Problem
Benchmark showed 99% white wins correct but only 2.3% black wins correct.
Previous v7.95-DUAL-LENS didn't fix the issue because Method A was incorrectly calculating raw activities.

## Root Cause
The original dual-lens had a flawed Method A calculation:
- It was treating "positive quadrant values as white invading black territory" which is WRONG
- Quadrant values are simple: POSITIVE = white activity, NEGATIVE = black activity

## v7.96-TRUE-DUAL Solution

### Correct Calculation
```typescript
// Simply iterate quadrant values
for (const v of [kingsideWhite, kingsideBlack, queensideWhite, queensideBlack, center]) {
  if (v > 0) whiteRawA += v;      // Positive = white strength
  else blackRawA += Math.abs(v);   // Negative = black strength
}

// Method A: 30-point threshold
if (diffA > 30) methodA = 'white';
else if (diffA < -30) methodA = 'black';

// Method B: Ratio with 7% first-move compensation
// 55% threshold after compensation
```

### Key Insight
The CEO's observation was correct: "we were winning every black wins match" historically.
This means the system HAD correct black detection logic - we just broke it with incorrect reimplementation.

By correctly summing positive vs negative quadrant values, we restore the original black-win detection
while keeping the first-move compensation for white-win detection.

## Expected Impact
- White win accuracy: Maintain ~99% (Method B still works)
- Black win accuracy: Improve from 2% to ~60%+ (Method A now correct)
- Path to 80%+ overall accuracy

## Files Modified
- `src/lib/chess/colorFlowAnalysis/signatureExtractor.ts` - Corrected dual-lens calculation
- `src/lib/chess/dualPoolPipeline.ts` - Version bump to 7.96
