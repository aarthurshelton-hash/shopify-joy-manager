# Memory: features/universal-engine/v7-94-first-move-fix
Updated: Now

## Problem Identified
After v7.91 and v7.92 fixes, prediction distribution was STILL **97.8% white_wins**.

### Data Evidence (24h window)
| Actual | Predicted White | Predicted Black | EP Wins | SF Wins |
|--------|-----------------|-----------------|---------|---------|
| white_wins (1154) | 1139 | 13 | **314** | 0 |
| black_wins (1097) | 1064 | 32 | **0** | 374 |
| draws (139) | 135 | 4 | 0 | 15 |

**Key Insight**: We beat Stockfish 314-0 on white wins, but lose 0-374 on black wins.
The system CAN recognize winning patterns - it just applies them only to white.

## Root Cause: First-Move Activity Advantage

Chess has a structural bias: **white moves first**, leading to:
- ~7% more board activity for white (more squares visited over game)
- Quadrant profile values are inherently positive-skewed
- `determineDominantSide` almost always returns 'white' or 'contested'

Even with ratio-based detection at 55% threshold:
- White typically has 53-57% activity ratio (structural, not strategic)
- Black rarely exceeds 55% unless massively winning
- Result: 98% of predictions default to white_wins

## v7.94-FIRST-MOVE-FIX Solution

### Core Fix: Activity Offset Compensation
```typescript
// White naturally gets ~7% more activity due to first-move advantage
const FIRST_MOVE_OFFSET = 0.07;

// Compensate white's advantage - shift the neutral point
// Instead of 50% being neutral, 53.5% white is neutral
const whiteCorrected = whiteRatioRaw - FIRST_MOVE_OFFSET;
const blackCorrected = blackRatioRaw + FIRST_MOVE_OFFSET;

// Re-normalize and use lower 52% threshold
```

### Why This Works
- Raw 55% white activity → Corrected to ~48% → Returns 'contested' or 'black'
- Raw 60% white activity → Corrected to ~53% → Returns 'white' (truly dominant)
- Raw 45% white activity → Corrected to ~38% → Returns 'black' (black dominant)

## Expected Impact
- Prediction distribution: Move from 98%/2%/0% → ~45%/45%/10%
- Black win accuracy: 0% → 40%+ (matching our white win performance)
- Overall accuracy: Path to 80%+ by treating both colors symmetrically

## Files Modified
- `src/lib/chess/colorFlowAnalysis/signatureExtractor.ts` - Added FIRST_MOVE_OFFSET
- `src/lib/chess/dualPoolPipeline.ts` - Version bump to 7.94-FIRST-MOVE-FIX
