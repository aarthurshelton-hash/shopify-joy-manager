# Memory: infrastructure/data/v6-deep-pool-fetching-and-deduplication-logic
Updated: now

The 'v6.29-STREAMLINE' benchmark architecture maximizes fresh game absorption through:

1. **Pre-filtering at fetch time**: The `fetchLichessGames` function accepts `knownDbIds` (a Set of all game IDs already in the database + session) and filters out duplicates during the fetch phase, not after. This prevents wasted processing.

2. **Deterministic batch time windows**: Each batch uses `batchNumber * 21` days offset to explore DIFFERENT time periods. Batch 1 fetches recent games, Batch 2 explores 3 weeks ago, Batch 3 explores 6 weeks ago, etc. This ensures subsequent batches find genuinely new data.

3. **Prime number player rotation**: Uses offset `(batchNumber * 13) % playerCount` for non-repeating player starts across batches.

4. **Cumulative deduplication**: `allKnownIds` accumulates both database IDs and session IDs, passed to each fetch call to prevent any game from being fetched twice.

5. **Streamlined processing**: Games arriving in the queue are guaranteed fresh (not in DB or session), so the processing loop only needs to track `predictedIds` for session-level safety.

Key metrics:
- 8 players per batch (focused, deeper queries per player)
- 1.5s delay between API calls
- Up to 6 empty batches before stopping
- Each batch explores a unique 2-week time window offset by 3 weeks from the previous
