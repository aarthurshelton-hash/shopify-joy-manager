# v7.85-WHITE-FIX: Aggressive Fix for prophylactic_defense White Win Bias

## Problem Discovered (v7.75 → v7.85)
Post-v7.75 analysis revealed **prophylactic_defense** as the root cause of white win losses:

| Archetype | When White Wins | Correct | Accuracy |
|-----------|----------------|---------|----------|
| **prophylactic_defense** | 3,711 games | 1,120 | **30.2%** ❌ |
| sacrificial_attack | 307 games | 299 | 97.4% ✅ |
| queenside_expansion | 296 games | 264 | 89.2% ✅ |

**Critical**: 2,572 wrong predictions where white won but we predicted black—all from `prophylactic_defense`.

## v7.85 Fixes

### 1. Tightened Archetype Classification
```typescript
// Requires actual defensive characteristics, not just low activity
const hasDefensiveCharacter = (
  (quadrant.kingsideBlack < -10 || quadrant.queensideBlack < -10) &&
  (temporal.middlegame <= temporal.opening) &&
  moments.length <= 2
);
if (totalActivity < 120 && volatility < 25 && hasDefensiveCharacter) {
  return 'prophylactic_defense';
}
```

### 2. Flipped Calibration for prophylactic_defense
```typescript
// v7.85: Was -0.10 (wrong!), now +0.25 (highest white boost)
prophylactic_defense: 0.25
```

### 3. Aggressive Flip Logic
- Flip to white_wins if prophylactic_defense AND stockfishEval > -100
- Higher thresholds: biasCorrection >= 0.15 flips at stockfishEval > -150

## Files Changed
- `src/lib/chess/colorFlowAnalysis/signatureExtractor.ts`
- `src/lib/chess/accuracy/whiteWinCalibration.ts`
