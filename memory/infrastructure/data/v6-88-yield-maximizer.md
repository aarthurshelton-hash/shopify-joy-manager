# Memory: infrastructure/data/v6-88-yield-maximizer
Updated: now

The 'v6.88-YIELD-MAXIMIZER' architecture addresses excessive game skipping that was causing prediction yield loss.

## Problems Fixed

### 1. Cloud Eval Requirement (Lines 628-632)
**Before**: Games silently skipped when Lichess Cloud had no eval for the position
**After**: Proceed in "hybrid-only mode" with neutral eval, letting En Pensent's hybrid prediction shine

```typescript
// v6.88: Fallback when no cloud eval available
if (!cloudEval) {
  console.log(`[v6.88] No cloud eval for ${game.name} - using hybrid-only mode`);
  evalSource = 'hybrid_only';
  // Stockfish prediction will be neutral, letting hybrid shine
} else {
  stockfishEval = cloudEval.evaluation;
  stockfishDepth = cloudEval.depth;
}
```

### 2. Overly Aggressive Game Length Check (Lines 590-594)
**Before**: Required `history.length >= movesToPlay + 10` (e.g., 35 move minimum for move 25 prediction)
**After**: Requires only `history.length >= movesToPlay` (25 moves for move 25 prediction)

### 3. Fetch-Time Move Filter (Line 345)
**Before**: Rejected games with fewer than 10 half-moves
**After**: Accepts games with 15+ half-moves (aligns with minimum prediction point)

## Impact
These three changes should significantly increase the yield of predictions per fetched game, reducing "ditched" fetches and maximizing data absorption from the dynamic leaderboard sourcing system (v6.87).

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
