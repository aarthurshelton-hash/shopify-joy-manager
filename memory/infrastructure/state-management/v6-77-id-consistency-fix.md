# Memory: infrastructure/state-management/v6-77-id-consistency-fix
Updated: now

The 'v6.77-ID-CONSISTENCY' architecture fixes the "fresh games skipped" bug where batch 2+ had games filtered out despite window isolation working correctly.

## Root Cause
When games were successfully predicted, only the PREFIXED form (e.g., `li_ABC123XY`) was added to `predictedIds` and `analyzedData.gameIds`. However:
1. The database stores RAW IDs (e.g., `ABC123XY`)
2. `getAlreadyAnalyzedData()` loads both forms from DB
3. But LIVE updates during the session only added prefixed form
4. Result: Next fetch's exclusion check couldn't match raw IDs from new fetches

## Fix: Dual-Form ID Storage
All deduplication sets now store BOTH prefixed and raw forms:

```typescript
// On successful prediction:
const rawGameId = gameId.replace(/^(li_|cc_)/, '');
predictedIds.add(gameId);      // li_ABC123XY
predictedIds.add(rawGameId);   // ABC123XY
analyzedData.gameIds.add(gameId);
analyzedData.gameIds.add(rawGameId);
```

## Fetch Exclusion Build (v6.77)
The `fetchExcludeIds` set is now built by iterating each source and adding both forms:
```typescript
for (const id of analyzedData.gameIds) {
  fetchExcludeIds.add(id);
  const raw = id.replace(/^(li_|cc_)/, '');
  if (raw !== id) fetchExcludeIds.add(raw);
}
```

## Session Dupe Check (v6.77)
The processing loop now checks BOTH forms:
```typescript
const rawGameIdForCheck = gameId.replace(/^(li_|cc_)/, '');
if (predictedIds.has(gameId) || predictedIds.has(rawGameIdForCheck)) {
  // Skip - already predicted
}
```

This ensures consistent ID matching regardless of whether the fetcher returns prefixed or raw IDs.

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
