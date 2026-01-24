# Memory: features/universal-engine/v7-61-phase-specialization

The 'v7.61-PHASE-SPEC' system implements **Phase Specialization** to improve prediction accuracy versus Stockfish by using separate prediction models for Opening, Middlegame, and Endgame phases.

## Core Theory
- Generalist models underperform specialists
- Opening patterns are volatile (book moves dominate)
- Middlegame patterns are moderately reliable
- Endgame patterns are HIGHLY predictive (technique dominates)

## Implementation

### New Module: `src/lib/chess/accuracy/phaseSpecialization.ts`

1. **Archetype Phase Reliability Matrix**: Each of the 13 archetypes has a reliability score (0.1-0.98) for each of the 5 phases (opening, early_middlegame, late_middlegame, endgame, deep_endgame).

2. **Phase-Specific Win Rate Adjustments**:
   - Opening: 30% regression toward mean (too volatile)
   - Middlegame: 15% regression, territorial advantage matters
   - Endgame: 5-12% regression, high confidence in technique patterns

3. **Prediction Gating**: If archetype reliability < 0.5 in current phase, the system abstains (returns 'unclear') rather than making a low-confidence guess.

4. **Phase-Optimal Horizons**:
   - Opening: 8 moves (too volatile for long predictions)
   - Late middlegame: 20 moves (patterns crystallizing)
   - Deep endgame: 50 moves (near-tablebase reliability)

### Integration Points

- `trajectoryPrediction.ts`: Now uses phase-adjusted win rates and phase-optimal horizons
- Trajectory breakers include warnings when archetype is unreliable in current phase
- Outcome probabilities calculated from phase-specialized rates

## Expected Accuracy Improvement

- Endgame predictions: +15-20% accuracy (technique patterns highly reliable)
- Opening predictions: May decrease slightly (intentional regression to avoid false confidence)
- Overall: Net +5-10% as endgame gains outweigh opening conservatism

## Key Functions

- `getPhaseSpecializedPrediction()`: Returns adjusted win rate + reliability + reasoning
- `getPhaseOptimalHorizon()`: Returns move horizon based on phase
- `isArchetypePhaseMatch()`: Checks if archetype is reliable in current phase
- `getPhaseDominantArchetypes()`: Returns archetypes with >80% reliability in phase
