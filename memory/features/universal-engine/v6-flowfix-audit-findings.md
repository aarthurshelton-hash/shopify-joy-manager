# Memory: features/universal-engine/v6-flowfix-audit-findings
Updated: now

## v6.44-FLOWFIX Audit Findings & Fixes

### Root Causes Identified:

1. **Insufficient Fetch Multiplier**: `fetchCount = gameCount * 4` was too low when DB has 800+ games. With many games already analyzed, 4x multiplier wasn't enough to find fresh games. **Fixed**: Increased to `gameCount * 8` with minimum 150 games.

2. **Deterministic Time Windows Hitting Cache**: The edge function caches responses for 5 minutes. Deterministic windows (batch * 17 + playerIndex * 7) caused repeated cache hits when batches were fetched in quick succession. **Fixed**: Added random jitter (0-50 segments) to bypass cache.

3. **Missing Failed Game Filter at Fetch Time**: Games that timed out or had parse errors were added to `failedGameIds` but the fetch dedup filter didn't check this set, causing re-fetching of known-bad games. **Fixed**: Added `failedFiltered` check in `fetchMoreGames()`.

4. **Segment Size Too Large**: 29-day segments meant adjacent batches often overlapped. **Fixed**: Reduced to 20-day segments with extended offset range (0-150).

5. **Low Batch Limit**: `maxBatches = 20` could exhaust before finding enough fresh games. **Fixed**: Increased to 30.

### Key Changes in v6.44:

- `fetchCount`: `gameCount * 4` → `gameCount * 8` (minimum 150)
- `maxBatches`: 20 → 30
- Time window: Added `randomJitter = Math.floor(Math.random() * 50)` 
- Segment size: 29 days → 20 days
- Offset range: 0-100 → 0-150
- Window duration: 60-120 days → 30-90 days (more varied)
- Added `failedFiltered` to dedup trace logging
- Reduced per-player window logging (only first player per batch)

### Expected Improvement:

With 8x fetch multiplier and randomized windows, the system should:
1. Fetch 150+ games per batch instead of 80
2. Hit different Lichess API cache entries each batch
3. Skip known-failed games at fetch time (not just processing)
4. Find fresh games even with 800+ in database
