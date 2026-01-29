# Memory: features/universal-engine/v8-07-agreement-calibrated-system
Updated: now

The 'v8.07-AGREEMENT-CALIBRATED' system implements three key improvements based on data analysis:

1. **Agreement Weighting**: When SF and Hybrid agree, historical accuracy is 56%. When they disagree, Hybrid drops to 35.8% while SF maintains 45.5%. The system now:
   - Boosts confidence by 1.08-1.15x on agreement (higher for strong archetypes)
   - Defers to Stockfish on disagreement when SF eval is decisive (>150cp)
   - Applies 0.75-0.95x multiplier on disagreements based on archetype strength

2. **FALLBACK Elimination**: The 'unknown' archetype (805 games at 41.5% accuracy) is eliminated. The `classifyArchetype` function now uses volatility and activity ratios to always assign a specific archetype. Default is `piece_harmony` (53% accuracy, the best-performing archetype).

3. **Historical Calibration**: New `archetypeCalibration.ts` module provides:
   - `ARCHETYPE_HISTORICAL_ACCURACY`: Per-archetype accuracy stats from database
   - `calibrateConfidence()`: Adjusts confidence based on agreement state + archetype reliability
   - `forceArchetypeAssignment()`: Converts 'unknown' to best-matching specific archetype
   - Archetype-specific confidence ceiling: 30 + (accuracy * 100)

Key calibration logic:
- Agreement + strong archetype (>50% accuracy): 1.15x multiplier
- Agreement + average archetype: 1.08x multiplier
- Disagreement + strong SF (>150cp): defer to SF, 0.75x multiplier
- Disagreement + weak archetype: defer to SF, 0.82x multiplier
