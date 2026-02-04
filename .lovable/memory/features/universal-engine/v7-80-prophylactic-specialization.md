# Memory: features/universal-engine/v7-80-prophylactic-specialization
Updated: now

## v7.80-PROPHYLACTIC-SPEC: Enhanced Sub-Archetype Classification

The prophylactic_defense archetype now features **deep specialization** with advanced pattern detection and weighted scoring.

## Key Enhancements

### 1. Weighted Multi-Factor Scoring Engine
- Each sub-archetype (11 variations + unknown) scored against 4-5 weighted criteria
- Phase-aware multipliers: Opening (1.3x), Middlegame (1.2x), Endgame (1.4x)
- Normalized confidence calculation with total score distribution

### 2. Advanced Metrics Calculation
- **centerDominance**: Ratio of central activity to total activity
- **compressionRatio**: How "contracted" the defensive structure is
- **counterattackPotential**: Stored energy indicators for counterplay
- **structuralRigidity**: How locked/static the position is
- **gamePhase**: Dynamic phase detection (opening/middlegame/endgame)

### 3. Secondary Variation Detection
- Top-2 variations returned when secondary confidence > 25%
- Enables hybrid pattern recognition (e.g., "Hedgehog with Elastic elements")

### 4. Defensive Topology Detection
- **central**: High center dominance (>35%)
- **flank**: Large quadrant shift (>50)
- **distributed**: Balanced activity across board
- **contracted**: Compressed fortress-like structure

### 5. Temporal Rhythm Classification
- **proactive**: Gradual increase without major incidents
- **reactive**: Multiple response moments (≥3)
- **static**: Ultra-low volatility, minimal moments
- **elastic**: Clear retreat then advance pattern

### 6. Trading Signal Generation
Each variation maps to a specific market action:
- `petrosian_overprotection` → hedge
- `karpov_stranglehold` → accumulate
- `nimzowitsch_restraint` → hold
- `hedgehog_coil` → accumulate
- `berlin_wall` → hold
- `fortress_construction` → reduce
- `elastic_defense` → accumulate
- `pressure_absorption` → hold

## Updated `ProphylacticAnalysis` Interface
```typescript
interface ProphylacticAnalysis {
  variation: ProphylacticVariation;
  confidence: number;
  matchingFactors: string[];
  suggestedPlay: string;
  riskAssessment: string;
  // v7.80 Enhanced
  secondaryVariation?: ProphylacticVariation;
  secondaryConfidence?: number;
  phaseSpecificStrength: 'opening' | 'middlegame' | 'endgame';
  defensiveTopology: 'central' | 'flank' | 'distributed' | 'contracted';
  temporalRhythm: 'proactive' | 'reactive' | 'static' | 'elastic';
  tradingSignal: 'hold' | 'accumulate' | 'hedge' | 'reduce' | 'wait';
}
```

## Console Output
During classification, the system logs:
```
[Prophylactic v7.80] Primary: karpov_stranglehold (78%), Secondary: hedgehog_coil (32%)
[Prophylactic v7.80] Topology: central, Rhythm: proactive, Phase: endgame
```
