# Memory: infrastructure/data/v6-87-dynamic-leaderboard-sourcing
Updated: now

The 'v6.87-DYNAMIC-LEADERBOARD' system fetches live top players from Lichess leaderboards instead of relying solely on static player pools. This provides a constantly refreshing source of high-caliber players.

**Key Components**:

1. **New Edge Function**: `lichess-leaderboard` fetches from `/api/player` endpoint
   - Returns top 50 players across bullet, blitz, rapid, classical
   - 30-minute server-side cache to avoid hammering the API
   - Provides username, rating, title, and perfType for each player

2. **Client-Side Integration**: `multiSourceFetcher.ts` now calls `getLichessPlayerPool()`
   - First attempts to fetch live leaderboard players
   - Falls back to static `LICHESS_FALLBACK_PLAYERS` on failure
   - Combines both sources for maximum coverage
   - 30-minute client-side cache for efficiency

3. **Combined Pool Logic**:
   - Leaderboard players are prioritized (fresher, more active)
   - Static fallback ensures reliability when API is unavailable
   - Duplicates are automatically deduplicated via Set
   - Pool size: ~100-150 unique players (50 from each mode + 60 fallback)

**Data Flow**:
```
fetchLeaderboardPlayers() → lichess-leaderboard Edge Function → /api/player
                         ↓
                    cachedLeaderboardPlayers (30min TTL)
                         ↓
getLichessPlayerPool() → Combine with LICHESS_FALLBACK_PLAYERS → Dedupe → Return
```

This ensures the pipeline always has access to the most active, highest-rated players on Lichess at any given time.
