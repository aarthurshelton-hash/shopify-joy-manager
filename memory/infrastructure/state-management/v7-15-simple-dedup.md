# Memory: infrastructure/state-management/v7-15-simple-dedup
Updated: now

The 'v7.15-SIMPLE-DEDUP' architecture radically simplifies game deduplication to a single principle:

## Core Philosophy
**Fresh ID → Check if in system → Accept or Reject. That's it.**

## Implementation
One module (`simpleDedup.ts`) with:
- ONE set: `knownGameIds` (raw IDs only, no prefixes)
- ONE check: `isKnown(gameId)` returns true/false
- ONE update: `markKnown(gameId)` after successful processing

## Key Functions
```typescript
initKnownIds()     // Load from DB once, cached thereafter
isKnown(id)        // Is this game already in our system?
markKnown(id)      // Mark as processed after success
toRawId(id)        // "li_ABC123" → "ABC123"
```

## What Was Removed
- `predictedIds` set
- `queuedGameIds` set  
- `analyzedData.gameIds` complexity
- Dual-form ID storage (prefixed + raw)
- Multi-layer deduplication checks
- `getAlreadyAnalyzedData()` in hot path (now cached)

## Integration Points
- `dualPoolPipeline.ts`: Calls `initKnownIds()` once, uses `isKnown()` to filter, `markKnown()` after save
- `multiSourceFetcher.ts`: Uses `isKnown()` during fetch to skip duplicates early

## Performance Gains
- DB query happens ONCE per session (8s timeout)
- All subsequent checks are O(1) Set lookups
- No repeated pagination through 50k+ records
