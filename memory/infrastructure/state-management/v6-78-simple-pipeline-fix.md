# Memory: infrastructure/state-management/v6-78-simple-pipeline-fix
Updated: now

The 'v6.78-SIMPLE' architecture radically simplifies the benchmark pipeline to fix "evaporating batches" and enable dual-source fetching.

## Philosophy
1. **ONE requirement**: A unique raw game ID not already in the database
2. **ONE check**: Does `analyzedData.gameIds.has(rawGameId)` return true? If yes, skip. If no, process.
3. **ONE source of truth**: `analyzedData.gameIds` contains all known raw IDs (from DB + this session)

## Key Changes from v6.77

### Removed Complexity
- Removed `predictedIds` set (merged into `analyzedData.gameIds`)
- Removed `queuedGameIds` set (no queue tracking needed)
- Removed dual-form ID storage (only raw IDs now)
- Removed over-aggressive exclusion logic

### Simplified Flow
```
FETCH: Get games from Lichess + Chess.com
       → Exclude: analyzedData.gameIds (raw) + failedGameIds (raw)
       → Return: Games not in DB

QUEUE: Add fetched games to queue
       → Simple check: is rawId in analyzedData.gameIds?

PROCESS: For each game in queue
       → Extract rawGameId = gameId.replace(/^(li_|cc_)/, '')
       → If analyzedData.gameIds.has(rawGameId) → skip
       → If failedGameIds.has(rawGameId) → skip
       → Otherwise → PREDICT

SUCCESS: After prediction
       → analyzedData.gameIds.add(rawGameId)
       → Save to DB with game_id = rawGameId
```

## Dual-Source Support
Both Lichess and Chess.com are now fetched equally:
```typescript
const result = await fetchMultiSourceGames({
  sources: ['lichess', 'chesscom'],  // BOTH
});
```

## Database Format
All game IDs stored in raw format (no `li_` or `cc_` prefix):
- Lichess: `ABC123XY` (8 chars)
- Chess.com: `123456789` (numeric)

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
