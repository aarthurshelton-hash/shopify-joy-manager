# Memory: features/universal-engine/v7-56-smart-fallback-v1
Updated: 2026-01-23

## Problem Addressed
Fallback predictions (when engines timeout) were using random 33/33/34% guesses, diluting accuracy metrics with noise.

## v7.56-SMART-FALLBACK Solution

### Fallback Quality Tiers
| Tier | Condition | Accuracy Impact |
|------|-----------|-----------------|
| `full` | Both SF and Hybrid succeeded | Included |
| `partial_sf` | SF failed, Hybrid worked | Included |
| `partial_hybrid` | Hybrid failed, SF worked | Included |
| `archetype_fallback` | Hybrid failed, used archetype history | Included (smart guess) |
| `excluded` | Both failed | **Excluded from metrics** |

### Smart Fallback Logic
When Hybrid times out but Color Flow signature was extracted:
1. Look up archetype's historical win rates from `chess_prediction_attempts`
2. If 5+ games exist for archetype → use historical probabilities
3. If insufficient data → use calibrated default rates per archetype
4. Adjust slightly for dominant side (white/black/contested)

### Default Archetype Rates (when no historical data)
- `kingside_attack`: 42% white, 38% black, 20% draw
- `positional_squeeze`: 48% white, 32% black, 20% draw
- `tactical_chaos`: 40% white, 45% black, 15% draw
- `prophylactic_defense`: 34% white, 34% black, 32% draw

### Key Files
- `src/lib/chess/accuracy/archetypeHistoricalRates.ts` - Archetype stats loader and prediction
- `src/lib/chess/benchmark/predictionBenchmark.ts` - Updated with fallback tiers
- `src/lib/chess/accuracy/index.ts` - Export new module

### Benefits
1. **Cleaner Metrics**: Excluded cases don't pollute accuracy
2. **Smarter Guesses**: Archetype-based prediction beats random
3. **Transparency**: `fallbackTier` and `fallbackSource` track data quality
4. **Monitoring**: `fallbackStats` in BenchmarkResult shows breakdown
