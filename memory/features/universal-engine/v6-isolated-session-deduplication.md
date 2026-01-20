# Memory: features/universal-engine/v6-freeflow-fetching-philosophy
Updated: now

The 'v6.26-FREEFLOW' benchmark philosophy ensures maximum fresh game absorption by:

**Key Changes from v6.24-SESSFIX**:
1. **No player rotation tracking**: Removed `queriedPlayers` parameter entirely. Every batch randomly shuffles ALL 60+ players independently, ensuring maximum variety without memory overhead.
2. **Truly random time windows**: Each player query uses pure `Math.random()` for years (weighted 50% 2024-2025, 30% 2022-2023, 20% 2020-2021), months, and days.
3. **Increased fetch volume**: Requests 5x target games per batch (up from 3x) to ensure sufficient fresh games.
4. **More persistence**: Up to 8 empty batches allowed before stopping (up from 5), with 3s delays between retries.
5. **More players per batch**: Up to 15 players queried per batch with 2.5s delay between requests.
6. **Deferred deduplication**: ALL filtering happens ONLY at prediction stage via:
   - `analyzedData.gameIds` for database duplicates
   - `predictedIds` for session duplicates (games already predicted this run)

**Data Flow**:
- Fetch games → Add to queue (no pre-filtering)
- Queue dedup: Filter games already in queue from THIS session
- Prediction stage: Skip if `analyzedData.gameIds.has(id)` (DB) OR `predictedIds.has(id)` (session)
- After successful prediction: `predictedIds.add(lichessId)` + `analyzedData.gameIds.add(lichessId)`

This ensures subsequent batches always hit different player/time combinations for maximum fresh game discovery.
