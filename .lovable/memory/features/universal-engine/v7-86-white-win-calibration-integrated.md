# Memory: features/universal-engine/v7-86-white-win-calibration-integrated
Updated: Now

## Critical Bug Found (v7.86)
The `calibrateForWhiteBias()` function existed in `whiteWinCalibration.ts` but was **NEVER CALLED** by the main prediction pipeline!

The `generateLocalHybridPrediction()` in `dualPoolPipeline.ts` was completely bypassing calibration:
- v6.96 fusion logic: "If agree use SF, if disagree still use SF"
- Zero calibration applied → 2,598 games with `prophylactic_defense` wrongly predicted `black_wins`

## Database Evidence
```sql
-- When white wins but we predicted black:
-- prophylactic_defense: 2,598 games (92.8% of errors)
-- 2,478 had eval > -100 (should have flipped to white!)
```

## v7.86 Fix Applied
Modified `generateLocalHybridPrediction()` to:
1. Trust Color Flow when it disagrees with Stockfish (was doing opposite)
2. Call `calibrateForWhiteBias()` on the fused prediction
3. Log calibration flips for monitoring

## Key Code Change
```typescript
// v7.86-CALIBRATED: Apply white win calibration to fix prophylactic_defense bias
const calibrated = calibrateForWhiteBias(
  fusedPrediction,
  archetype,
  dominantSide,
  stockfishEval,
  fusedConfidence
);
```

## Expected Impact
- ~2,500 games should now correctly predict `white_wins` instead of `black_wins`
- Hybrid accuracy on white wins should jump from 47.7% to ~75%+
- Net win margin vs Stockfish should flip from -250 to positive

## Files Modified
- `src/lib/chess/dualPoolPipeline.ts` - Integrated calibration into prediction pipeline
