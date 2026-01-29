# Memory: features/universal-engine/v8-05-precision-multi-signal-detection
Updated: now

The 'v8.05-PRECISION' update addresses the accuracy gap identified in data analysis (68.7% white accuracy vs 25.9% black accuracy). The system was predicting white for 903 games that ended in black wins due to structural bias in activity-sum calculations.

## Key Changes

### 1. Multi-Signal Black Detection (signatureExtractor.ts)
- **Territory Invasion Detection**: Measures who is invading WHOSE territory (black pieces in white's ranks 1-4, white pieces in black's ranks 5-8)
- **Black invasion boost**: 2.5x weight (vs 2.0x for white) to compensate for structural first-move advantage
- **Intensity ratio tiebreaker**: When scores are close, check if black has significant presence in white's territory

### 2. Archetype-Specific Color Weights (equilibriumPredictor.ts)
- Each archetype now has explicit `whiteBoost`, `blackBoost`, and `drawBoost` values
- Defensive archetypes (prophylactic_defense, closed_maneuvering) favor black (+12, +8)
- Tactical archetypes let dominantSide decide but reduce draw probability
- Eliminated reliance on FALLBACK archetype

### 3. Aggressive Stockfish Tiebreaker
- Lowered threshold for black SF influence: -50cp triggers black prediction (vs -75cp before)
- Very slight black edge (-15cp) now contributes to black prediction
- When SF shows black advantage, apply +12 confidence boost (vs +10 for white)

## Parameters
- FIRST_MOVE_OFFSET: 25 (balanced between old extremes of 15 and 60)
- DOMINANCE_GAP: 15 (require clear separation)
- Black invasion weight: 2.5x
- White invasion weight: 2.0x

## Target
65-70% overall accuracy by capturing BOTH white AND black wins simultaneously, eliminating the oscillating bias pattern.
