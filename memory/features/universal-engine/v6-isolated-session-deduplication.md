# Memory: features/universal-engine/v6-isolated-session-deduplication
Updated: now

The 'v6.21-FREEFLOW' system fixes consecutive benchmark batch fetching by **completely removing deduplication from the fetch layer**:

1. **Free Fetching**: `fetchLichessGames()` is called with NO deduplication data at all - it returns all games it finds from the Lichess API
2. **Queue Deduplication**: The `existingIds` Set filters out games already in `allGames` queue (prevents within-run queue duplicates)
3. **DB Check at Prediction Time**: Games are checked against `analyzedData.gameIds` (DB) only when about to predict, not during fetching
4. **Session Tracking for Logging**: `sessionSeenIds` tracks fetched games for informational purposes only, not for filtering

The key insight: passing `sessionSeenIds` to `fetchLichessGames` caused it to filter out ALL previously fetched games in subsequent batches, resulting in empty batch returns. By removing this filtering, each batch now returns fresh games from new random time windows.
