# Memory: infrastructure/universal-engine/v6-93-auto-evolution-never-stop

The Auto-Evolution Engine (v6.93-NEVER-STOP) implements a self-healing dual-pool benchmark pipeline designed for continuous, uninterrupted data absorption.

## Core Principles
- **Never Stops**: If the system halts for any reason, it automatically recovers
- **Self-Healing**: 5 consecutive errors trigger full recovery (engine restart, state reset)
- **Incremental Persistence**: All predictions saved immediately to prevent data loss
- **Health Monitoring**: 5-minute health checks ensure engine stability

## Dual-Pool Architecture
- **CLOUD-VOLUME Pool**: 25 games every 15 min (~100/hour) via Lichess Cloud API
- **LOCAL-DEEP Pool**: 2 games every 24 min (~5/hour) via local Stockfish D30

## Key Files
- `src/lib/chess/autoEvolutionEngine.ts` - Core self-healing engine
- `src/hooks/useAutoEvolution.ts` - React hook for UI integration
- `src/components/chess/AutoEvolutionPanel.tsx` - Control panel UI

## Auto-Recovery Triggers
1. 5+ consecutive batch errors
2. Stockfish engine health check failure
3. Database connectivity issues

## Recovery Sequence
1. Stop all timers
2. Wait 30s for in-flight operations
3. Terminate and restart Stockfish
4. Reset error counters
5. Persist state
6. Restart batch timers

## State Persistence
Evolution state saved to `evolution_state` table with:
- Total predictions (lifetime)
- Session predictions
- Recovery count
- Batch number (generation)
- Fitness score (100 - errors*20)
