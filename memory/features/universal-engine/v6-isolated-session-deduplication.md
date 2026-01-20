# Memory: features/universal-engine/v6-freeflow-session-logic-unified
Updated: now

The 'v6.22-CLEAN' benchmark architecture maximizes game absorption by **completely removing ALL deduplication logic from `fetchLichessGames`**:

1. **Clean Function Signature**: `fetchLichessGames(count: number)` - no longer accepts `analyzedData` parameter
2. **No Internal DB Check**: Removed `if (analyzedData?.gameIds?.has(lichessGameId)) continue;` line that was filtering games at fetch time
3. **DB Check at Prediction Time Only**: Games are checked against `analyzedData.gameIds` in the main prediction loop (line ~544), not during fetching
4. **Queue Deduplication**: Only filters duplicates within the current `allGames` queue using `existingIds` Set

The key bug was that even when not passing `analyzedData` as a parameter, the function referenced it via closure from outer scope, causing all DB games to be filtered during fetch. Now fetch truly returns ALL games from the API.
