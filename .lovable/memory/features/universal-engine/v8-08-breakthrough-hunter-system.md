# Memory: features/universal-engine/v8-08-breakthrough-hunter-system
Updated: now

The 'v8.08-BREAKTHROUGH-HUNTER' system identifies SF vulnerability zones and capitalizes on them for higher accuracy:

## Core Innovation: SF Vulnerability Detection
New module `sfVulnerabilityDetector.ts` analyzes positions to detect where Stockfish historically underperforms:

### Vulnerability Factors (weighted)
1. **Archetype Blindspot (35%)**: SF struggles with closed_maneuvering (75%), prophylactic_defense (70%), opposite_castling (68%)
2. **Eval Uncertainty Zone (25%)**: Peak uncertainty at 0cp, decreasing as eval becomes extreme
3. **Position Complexity (20%)**: High intensity + contested + balanced flow = complex
4. **Temporal Trajectory Mismatch (15%)**: When momentum disagrees with SF eval
5. **Game Phase (5%)**: SF less reliable in strategic endgames and slow openings

## Dynamic Weight Adjustment
When SF vulnerability > 55%, the equilibrium predictor:
- **Boosts** pattern recognition weights by 30%
- **Reduces** SF weight by up to 40%
- Raises extreme SF threshold to 400cp (from 350cp)

## Breakthrough Zone Detection
Position qualifies as BREAKTHROUGH when:
- SF vulnerability > 55%
- Archetype pattern strength > 0.65
- SF eval is NOT extreme (<400cp)

In breakthrough zones, trust pattern recognition FIRST with confidence boost of +12-18 points.

## Archetype-Specific SF Blindspot Scores
- closed_maneuvering: 0.75 (highest - SF misses long-term pawn structure)
- prophylactic_defense: 0.70 (SF undervalues defensive resources)
- opposite_castling: 0.68 (SF misses racing attack tempo)
- pawn_storm: 0.65 (SF misses pawn break timing)
- sacrificial_attack: 0.60 (SF undervalues long-term compensation)
- open_tactical: 0.30 (lowest - SF is reliable here)

## Files Created/Modified
- Created: `src/lib/chess/colorFlowAnalysis/sfVulnerabilityDetector.ts`
- Modified: `src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts`
- Modified: `src/lib/chess/colorFlowAnalysis/archetypeCalibration.ts`
- Modified: `src/lib/chess/colorFlowAnalysis/index.ts`

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
