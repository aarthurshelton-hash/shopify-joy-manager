# Memory: infrastructure/data/v6-87-dynamic-leaderboard-sourcing
Updated: now

The 'v6.87b-DYNAMIC-LEADERBOARD' system fetches live top players from Lichess leaderboards with full randomization for maximum variety.

**Key Components**:

1. **Edge Function**: `lichess-leaderboard` fetches from `/api/player` endpoint
   - Returns top 100 players (configurable) across ALL game modes:
     - Standard: bullet, blitz, rapid, classical
     - Variants: ultraBullet, chess960, crazyhouse, antichess, atomic, horde, racingKings, kingOfTheHill
   - **Fisher-Yates shuffle** for true randomization each request
   - 30-minute server-side cache ONLY for non-randomized requests
   - Provides username, rating, title, perfType, and rank for each player

2. **Randomization Options**:
   - `randomize: true` (default) → Fresh shuffle every request, no cache
   - `randomize: false` → Sorted by rating, cached for 30min
   - `count: 100` (default) → How many players to return after shuffle

3. **Future Database Integration**:
   - Player pool will eventually map to `en_pensent_memory` table
   - Parameters per player: archetype affinity, prediction accuracy history
   - Game mode clustering for targeted prediction tuning
   - Mass volume ingestion enables fine-grained accuracy calibration

**Data Flow**:
```
fetchLeaderboardPlayers() → lichess-leaderboard Edge Function → /api/player
                         ↓
                    shuffleArray() (Fisher-Yates)
                         ↓
getLichessPlayerPool() → Combine with fallback → Dedupe → Return randomized 100
```

This ensures every batch explores different players from different game modes for maximum prediction training diversity.
