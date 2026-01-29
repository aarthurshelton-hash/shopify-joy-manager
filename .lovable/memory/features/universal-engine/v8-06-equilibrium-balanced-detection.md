# Memory: features/universal-engine/v8-06-equilibrium-balanced-detection
Updated: now

The 'v8.06-EQUILIBRIUM' update corrects the v8.05 overcorrection. v8.05 swung from 66% white predictions to 69% black predictions (only 47.8% accurate). v8.06 implements true balance.

## Key Changes

### 1. Symmetric Territory Detection (signatureExtractor.ts)
- Equal invasion weights: 2.0x for BOTH colors (v8.05 had 2.5x for black)
- FIRST_MOVE_OFFSET: 20 (balanced between v8.04's 15 and v8.05's 25)
- DOMINANCE_GAP: 18 (require clear separation before committing)
- Invasion tiebreaker requires 1.5x advantage (v8.05 had 0.8x)

### 2. Reduced Archetype Boosts (equilibriumPredictor.ts)
- Defensive archetypes: blackBoost reduced from +12 to +5
- Tactical archetypes: no color boost, only draw probability adjustment
- Prevents oscillation between white-bias and black-bias

### 3. Symmetric Stockfish Thresholds
- Strong advantage: ±100cp (equal for both colors)
- Moderate advantage: ±50cp (equal for both colors)
- Confidence boost: +8 for both (v8.05 had +12 for black, +10 for white)

## Target
55-60% accuracy with balanced ~50% white / ~35% black / ~15% draw distribution.
