# Memory: infrastructure/state-management/v6-73-window-isolation-fix
Updated: 2026-01-20

## The Identity Theorem Debugging Approach - Full Trajectory

Applied the CEO's **En Pensent Identity Theorem** to trace the ENTIRE trajectory of game flow.

## Root Cause Analysis (v6.73)

**v6.72 was incomplete** - it tracked `allReceivedGameIds` for client-side filtering, but the **API kept returning the same games** because:
- Prime-based window offsets were **overlapping** between batches
- Batch 1 and Batch 2 could request the SAME time period
- API returns same games → Client filters them all → 0 new games → "Evaporation"

## The Complete Fix (v6.73-WINDOW-ISOLATION)

**Sequential non-overlapping time windows** per batch:

1. **Lichess**: Each batch explores a 60-day window
   - Batch 1: 0-60 days ago
   - Batch 2: 60-120 days ago
   - Batch 3: 120-180 days ago
   - No overlap = guaranteed unique games from API

2. **Chess.com**: Each batch explores 3-month archive windows
   - Batch 1: Most recent 3 months
   - Batch 2: 3-6 months ago (monthOffset=3)
   - Batch 3: 6-9 months ago (monthOffset=6)

## Code Changes

```typescript
// v6.73: Sequential non-overlapping windows
const windowDuration = 60; // 60-day fixed windows
const baseDaysBack = (batchNumber - 1) * windowDuration + playerOffset;
const until = now - (baseDaysBack * oneDay);
const since = until - (windowDuration * oneDay);
```

## Verification

Console should show:
- `[v6.73] DrNykterstein: Window 1 → 0-60 days ago`
- `[v6.73] DrNykterstein: Window 2 → 60-120 days ago`
- Games should NOT evaporate - each batch explores unique territory
