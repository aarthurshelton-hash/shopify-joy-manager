# Memory: features/universal-engine/v7-87-targeted-calibration-fix
Updated: Now

## Critical Issue Found

v7.85-v7.86 calibration was **over-aggressive**, flipping TOO MANY predictions to white_wins.

### Evidence from Database (last 2 hours before fix):
- 185 correct white_wins predictions
- **167 wrong white_wins predictions** (when black actually won)
- Only 2 black_wins predictions total!

### Root Cause
The calibration conditions in v7.85 were too broad:
```typescript
// v7.85 - TOO AGGRESSIVE:
(biasCorrection >= 0.15 && stockfishEval > -150) ||  // Many archetypes match
(biasCorrection >= 0.10 && stockfishEval > -50) ||   // Even more match
(stockfishFavorsWhite && dominantSide === 'contested')  // Very common
```

Most games were classified as `kingside_attack` (0.15 bias) and `queenside_expansion` (0.12 bias), so they ALL got flipped to white_wins!

## v7.87 Fix Applied

Made calibration **targeted** - only flip predictions for:
1. `prophylactic_defense` archetype (the main problem) when eval > -200
2. When Stockfish STRONGLY favors white (eval > +100) in contested positions

```typescript
// v7.87 - TARGETED:
const shouldFlipToWhite = (
  // prophylactic_defense: flip unless Stockfish STRONGLY favors black
  (archetype === 'prophylactic_defense' && stockfishEval > -200 && dominantSide !== 'black') ||
  
  // Stockfish clearly favors white (+100) but we predicted black in contested position
  (stockfishEval > 100 && dominantSide === 'contested')
);
```

## Expected Impact
- Allow natural black_wins predictions for most archetypes
- Only flip prophylactic_defense (the actual problem archetype)
- Better balance between white/black predictions

## Files Modified
- `src/lib/chess/accuracy/whiteWinCalibration.ts` - Tightened flip conditions
- `src/lib/chess/dualPoolPipeline.ts` - Updated version to v7.87-TARGETED
