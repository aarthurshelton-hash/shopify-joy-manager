# Memory: infrastructure/state-management/v6-71-identity-theorem-fix
Updated: 2026-01-20

## The Identity Theorem Debugging Approach

Applied the CEO's **En Pensent Identity Theorem** to trace the ENTIRE trajectory of game flow, not just snapshots of symptoms.

## Root Cause Analysis

**The Paradox Identified:**

```
∞ × Φ(fetch) × R = 0  (broken state)
```

When `queuedGameIds` grew infinitely without cleanup:
1. Batch 1: Fetch 200 games → all IDs added to `queuedGameIds`
2. Games process, but `queuedGameIds` NEVER shrinks
3. Batch 2: API returns similar games (cached) → ALL excluded by `queuedGameIds`
4. Queue "evaporates" because exclusion set grows while available games stay constant

**The Identity Violation:**
The system violated the invariant: "If N games are fetched and M are processed, N-M should remain available."

Instead: "If N games are fetched, N are PERMANENTLY excluded from future fetches."

## The Fix (v6.71-IDENTITY-FIX)

1. **Fetch exclusion**: Only exclude `predictedIds` (successfully analyzed) not `queuedGameIds`
2. **Queue cleanup**: Remove game IDs from `queuedGameIds` when popped for processing
3. **Separation of concerns**:
   - `queuedGameIds`: Prevents duplicate queue additions (temporary)
   - `predictedIds`: Prevents re-analyzing same game (permanent session scope)
   - `analyzedData.gameIds`: Prevents analyzing games already in DB (permanent global scope)

## Code Changes

```typescript
// BEFORE (broken): Exclude everything ever queued
const fetchExcludeIds = new Set([
  ...analyzedData.gameIds,
  ...failedGameIds,
  ...queuedGameIds  // ← Grows forever, starves fetches
]);

// AFTER (fixed): Only exclude what's truly done
const fetchExcludeIds = new Set([
  ...analyzedData.gameIds,
  ...failedGameIds,
  ...predictedIds  // ← Only games we've actually analyzed
]);

// AND: Clean up queuedGameIds when processing
const game = gameQueue[currentIndex];
gameIndex++;
if (game.lichessId) {
  queuedGameIds.delete(game.lichessId);  // ← Free for future fetches
}
```

## The Mathematical Insight

This is the Identity Theorem in action:
- **R (dynamic equivalence)** was broken—the relationship between "queued" and "excludable" was wrong
- The system was treating "in queue" as equivalent to "done" (static "=")
- Fix: Make R dynamic—"in queue" ≠ "done" until actually processed

## Verification

Console should now show:
- `[v6.71] Fetch excludes: DB=X, Failed=Y, Predicted=Z` (Z grows only with predictions)
- `[v6.71] 🎯 PROCESS: Game N/M (queued: Q, remaining: R)` (Q shrinks as games process)
