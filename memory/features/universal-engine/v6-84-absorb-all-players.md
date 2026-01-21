# Memory: features/universal-engine/v6-84-absorb-all-players
Updated: now

The 'v6.84-ABSORB-ALL' architecture ensures the pipeline accepts ANY game from the fetch layer as long as it has a unique game ID not already in the database. This builds on v6.57-ID-ONLY by making the player acceptance explicit:

## Key Principle
**Fresh ID = Fresh Game, Period.**

No filtering based on:
- Player usernames
- Player ratings  
- Game content (PGN length, move count)
- Time controls
- Game status/termination type

## Data Flow
1. **Fetch**: Query games from TOP_PLAYERS pool (needed to initiate API calls)
2. **Response**: Each game contains TWO players (queried player + their opponent)
3. **Accept**: EVERY game with a valid ID is accepted - opponents can be anyone
4. **Dedupe**: Only filter = `excludeIds.has(gameId)` check

## Why This Matters
When we query Magnus's games, we get games against:
- Other Super GMs (Hikaru, Caruana, etc.)
- Rising stars and young players
- Club players in simuls
- Anyone he played online

All these opponents' games are valuable training data for the universal intelligence. The archetype classification handles all skill levels.

## Deduplication Only
The ONLY rejection reasons are:
1. `!gameId` - No valid ID extracted from API response
2. `excludeIds.has(gameId)` - Already in database
3. `localIds.has(gameId)` - Already in current batch

No player-based, rating-based, or content-based filtering.
