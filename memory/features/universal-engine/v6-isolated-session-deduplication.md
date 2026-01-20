# Memory: features/universal-engine/v6-isolated-session-deduplication
Updated: now

The 'v6.20-ISOLATED' system fixes consecutive benchmark runs by **separating session deduplication from DB deduplication**:

1. **Session-Local Tracking**: `sessionSeenIds` starts EMPTY each run - it only tracks games fetched/processed in THIS run, not previous runs
2. **DB Check at Prediction Time**: Games are checked against `analyzedData.gameIds` (DB) only when about to predict, not during fetching
3. **Clean Fetching**: `fetchLichessGames` receives only session-local IDs, allowing it to freely fetch games that exist in DB from previous runs
4. **Deduplication at Insert**: If a game was already predicted in a previous run, it's skipped at prediction time (line 547-553), not at fetch time

This ensures each benchmark run can fetch fresh games independently, while still preventing duplicate predictions within the same run AND across runs (via DB constraint).
