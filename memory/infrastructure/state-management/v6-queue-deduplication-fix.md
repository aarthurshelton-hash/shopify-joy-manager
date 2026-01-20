# Memory: infrastructure/state-management/v6-queue-deduplication-fix
Updated: now

The 'v6.66-QUEUE-DEDUP' architecture fixes the "infamous fetching glitch" where subsequent batches returned mostly duplicate games, causing "0 remaining" starvation.

**Root Cause:**
When fetching new batches, the exclusion set only contained:
1. `analyzedData.gameIds` - games already in the database
2. `failedGameIds` - games that failed processing

This missed games that were **currently in the queue waiting to be processed**. Result: subsequent fetches would return the same games, which were then filtered out when adding to queue, yielding "0 new games" even with hundreds fetched.

**Fix:**
Added `queuedGameIds` Set that tracks ALL game IDs ever added to the queue during the session:
1. Before adding a game to the queue, add its ID (both prefixed and raw) to `queuedGameIds`
2. Include `queuedGameIds` in the fetch exclusion set
3. Check against `queuedGameIds` when filtering fetched games into the queue

**Deduplication Layers (v6.66):**
1. **Fetch-time**: Exclude DB games + failed games + already-queued games
2. **Queue-add-time**: Double-check against DB + already-queued
3. **Processing-time**: Check `predictedIds` for session duplicates

This ensures each game ID is only ever fetched and queued once per session, maximizing fresh game throughput.
