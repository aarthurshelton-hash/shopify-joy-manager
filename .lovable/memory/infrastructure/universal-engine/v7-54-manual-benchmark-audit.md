# Memory: infrastructure/universal-engine/v7-54-manual-benchmark-audit
Updated: now

## v7.54 Manual Benchmark Audit & Fix

### Issue Identified:
Console logs showed "Invalid move: exf4/fxe5" errors during benchmark analysis. Root cause traced to UCI-to-SAN conversion failure in `lichessGameToPgn()`.

### Root Cause:
- Lichess API returns moves in **UCI format** (e.g., `e2e4 e7e5 g1f3`) when `pgnInJson` is false
- `lichessGameToPgn()` was directly appending raw UCI moves to PGN headers
- `chess.loadPgn()` expects **SAN notation** (e.g., `1. e4 e5 2. Nf3`)
- Result: malformed PGN → `Invalid move` errors during replay

### Fix Applied:
Updated `src/lib/chess/gameImport/lichessApi.ts`:
1. Added Chess.js import at top of file
2. Modified `lichessGameToPgn()` to convert UCI → SAN by replaying moves
3. Properly format SAN moves as `1. e4 e5 2. Nf3 Nc6 ...`

### Manual Benchmark Flow Audit (Verified ✅):
1. **Lock Acquisition**: `acquireBenchmarkLock()` → Sets DB lock + pauses auto-evolution
2. **Pattern Loading**: `loadLearnedPatterns()` with 10s timeout
3. **Accuracy Caching**: `fetchChessCumulativeStats()` with 5s timeout
4. **Game Generation/Analysis**: `generateStockfishGame()` with move/game timeouts
5. **Prediction Making**: `makePredictionAtMove()` with retry-on-fallback (v7.3)
6. **Lock Release**: `releaseBenchmarkLock()` → Clears DB lock + resumes auto-evolution

### Dual Pool Pipeline Flow (Verified ✅):
1. **Yield Check**: `isManualBenchmarkActive()` at batch start + per-game
2. **Dedup Init**: `initKnownIds()` with 8s timeout
3. **Game Fetching**: 20s timeout per source (Lichess/Chess.com)
4. **Analysis**: 15s (Volume) / 45s (Deep) timeout per game
5. **Breathing**: `breathe()` enforces 300ms cooldown between games
6. **Save**: Batch insert with raw game ID normalization

### Coordinator Flow (Verified ✅):
- v7.42 sets database lock for server-side awareness
- AbortController pattern for cancellation
- Listener notification on lock state changes
