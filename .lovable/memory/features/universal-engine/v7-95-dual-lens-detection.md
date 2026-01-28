# Memory: features/universal-engine/v7-95-dual-lens-detection
Updated: Now

## Problem
Benchmark showed 985/996 white wins correct (99%) but only 21/924 black wins correct (2.3%).
Previous iterations showed the OPPOSITE pattern - we could detect black wins perfectly.
This proves BOTH detection methods work, just not simultaneously.

## Root Cause Analysis
- **Method A** (Absolute Difference): Favored black detection with 25-point threshold
- **Method B** (Ratio + Offset): Favored white detection with first-move compensation

Each method worked perfectly for ONE color but failed for the other.

## v7.95-DUAL-LENS Solution

### Core Architecture
Run BOTH detection methods simultaneously and use fusion logic:

```typescript
// Method A: Absolute difference (historically detected black wins)
const diffAbs = whiteActivityAbs - blackActivityAbs;
if (diffAbs > 25) methodA = 'white';
else if (diffAbs < -25) methodA = 'black';

// Method B: Ratio-based with 12% first-move offset (detected white wins)
const whiteRatio = (whiteTotal / grandTotal) - 0.12;
if (whiteFinal >= 0.55) methodB = 'white';
else if (blackFinal >= 0.55) methodB = 'black';

// Fusion Logic:
// Both agree → Strong confidence in that color
// Disagree → Contested (let SF/other signals decide)
// One contested, one has opinion → Trust the opinion
```

### Key Insight
The "dual-lens" approach allows EITHER method to identify dominance when appropriate:
- Method A catches black-dominant positions that Method B misses
- Method B catches white-dominant positions that Method A misses
- When they disagree, the position is truly contested

## Expected Impact
- White win accuracy: Maintain ~99% (Method B still works)
- Black win accuracy: Improve from 2% to ~40%+ (Method A now enabled)
- Draw detection: Improved via contested classification
- Overall: Path to 80%+ accuracy

## Files Modified
- `src/lib/chess/colorFlowAnalysis/signatureExtractor.ts` - Dual-lens determineDominantSide
- `src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts` - Simplified control signal
- `src/lib/chess/dualPoolPipeline.ts` - Version bump
