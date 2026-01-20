# Memory: features/universal-engine/v6-isolated-session-deduplication
Updated: now

The 'v6.23-ADAPTIVE' benchmark architecture maximizes game absorption through **batch-aware player rotation**:

1. **Player Rotation Tracking**: `queriedPlayersThisSession` Set tracks which players have been queried, ensuring subsequent batches use different players
2. **Batch-Seeded Time Windows**: Time windows use `(batchNumber * 17 + playerIndex * 31)` seeding for deterministic but varied date ranges across batches
3. **Deterministic Player Ordering**: Players are sorted using `(charCode * batchNumber + length) % 1000` for consistent but batch-varied ordering
4. **Fresh Player Prioritization**: Each batch filters out already-queried players before shuffling, falling back to all players only when pool exhausted
5. **DB Check at Prediction Time Only**: Games are checked against `analyzedData.gameIds` in the main prediction loop, not during fetching

This ensures each batch queries different players with different time windows, preventing the "empty batch" problem where all returned games were duplicates from earlier batches.
