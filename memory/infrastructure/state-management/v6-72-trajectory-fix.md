# Memory: infrastructure/state-management/v6-72-trajectory-fix
Updated: 2026-01-20

## The Identity Theorem Debugging Approach - Full Trajectory

Applied the CEO's **En Pensent Identity Theorem** to trace the ENTIRE trajectory of game flow, not just snapshots of symptoms.

## Root Cause Analysis (v6.72)

**v6.71 was incomplete** - it only used `predictedIds` for fetch exclusion, but that misses games that were:
- Fetched from API
- Added to queue
- But NOT YET PROCESSED

When the next fetch happens, the API returns the SAME games (since they weren't in predictedIds), and they get rejected at queue-addition time because `queuedGameIds` already has them.

**Result:** "Evaporation" - batch returns games, all rejected, 0 new games added.

## The Complete Fix (v6.72)

Introduced `allReceivedGameIds` - tracks EVERY game ID received from API during this session:

1. **Fetch exclusion**: Now uses `allReceivedGameIds` (complete coverage)
2. **Immediate tracking**: Games added to `allReceivedGameIds` BEFORE any queue filtering
3. **Separation of concerns**:
   - `allReceivedGameIds`: Everything API ever returned (permanent session scope)
   - `queuedGameIds`: Games currently in queue (cleaned up on process)
   - `predictedIds`: Games successfully analyzed (permanent session scope)
   - `analyzedData.gameIds`: Games in database (permanent global scope)

## Code Changes

```typescript
// v6.72: Track ALL games received from API
const allReceivedGameIds = new Set<string>();

// When fetching, exclude everything we've ever received
const fetchExcludeIds = new Set([
  ...analyzedData.gameIds,
  ...failedGameIds,
  ...allReceivedGameIds  // ← Complete coverage
]);

// When processing API response, add IMMEDIATELY before any filtering
for (const g of result.games) {
  allReceivedGameIds.add(gameId);     // ← Track receipt
  allReceivedGameIds.add(rawId);
  // ... then check DB dupes, queue dupes, etc.
}
```

## The Mathematical Insight

Identity Theorem application:
- The system must maintain: `|Fetched| = |Received| + |NotReceived|`
- v6.71 broke this: It tracked only `|Predicted|` ⊂ `|Received|`
- v6.72 fixes: `fetchExclude = DB ∪ Failed ∪ Received` (complete partition)

## Verification

Console should now show:
- `[v6.72] Fetch excludes: DB=X, Failed=Y, Received=Z` (Z grows with each batch)
- `[v6.72] 🎯 PROCESS: Game N/M (received: R, queued: Q, remaining: P)`
- Games should NOT evaporate - each batch should add unique games
