# Memory: infrastructure/universal-engine/v7-42-autonomous-evolution

The Auto-Evolution Engine (v7.42-AUTONOMOUS) implements a dual-mode autonomous pipeline:

## Core Architecture
- **Server-Side Cron**: Runs every 2 minutes via Supabase edge function, independent of browser state
- **Client-Side Pipeline**: Runs when app is open, supplements server-side with local Stockfish analysis
- **Database Lock**: Coordinates between manual benchmarks and auto-evolution

## Lock Mechanism
- When manual benchmark starts: `benchmark_lock` row in `evolution_state` table is set with `locked: true`
- Server-side cron checks this lock and yields if active
- Lock expires after 10 minutes (stale lock protection)
- On benchmark complete: lock is released

## Dual-Pool Architecture
- **CLOUD-VOLUME Pool**: 25 games every 90s (~100/hour) via Lichess Cloud API
- **LOCAL-DEEP Pool**: 2 games every 5 min (~24/hour) via local Stockfish D30

## Key Files
- `supabase/functions/auto-evolve/index.ts` - Server-side cron (every 2 min)
- `src/lib/chess/autoEvolutionEngine.ts` - Client-side engine
- `src/lib/chess/benchmarkCoordinator.ts` - Lock management
- `src/hooks/useAutoEvolution.ts` - React hook for UI

## Manual Benchmark Flow (No Interruptions)
1. User starts manual benchmark
2. `acquireBenchmarkLock()` sets database lock + pauses client auto-evolution
3. Server-side cron sees lock, skips that run
4. Manual benchmark runs with full resources
5. `releaseBenchmarkLock()` clears lock + resumes auto-evolution

## 24/7 Operation
- Server-side cron runs every 2 min regardless of browser state
- Client-side supplements when app is open
- No user intervention needed for continuous data collection
