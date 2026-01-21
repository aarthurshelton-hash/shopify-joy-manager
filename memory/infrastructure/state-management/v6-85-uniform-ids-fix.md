# Memory: infrastructure/state-management/v6-85-uniform-ids-fix
Updated: now

The 'v6.85-UNIFORM-IDS' architecture fixes an ID format mismatch bug that caused games to be processed multiple times or stuck in perpetual skip loops.

## Bug Identified
When tracking failed games, the code was inconsistent about ID formats:
- `failedGameIds.add(gameId)` - added PREFIXED form (e.g., `li_xxx` or `cc_123`)
- `failedGameIds.has(rawGameId)` - checked RAW form (e.g., `xxx` or `123`)

This mismatch meant:
1. A game that failed (parse error, ColorFlow error) would be added with prefix
2. On next loop iteration, the raw ID check would NOT find it
3. The game would be retried forever, wasting cycles

## Fix Applied
ALL failed ID operations now consistently use RAW form:

```typescript
// BEFORE (BUG):
failedGameIds.add(gameId);        // Prefixed: "li_ZhoooCoY"
if (failedGameIds.has(rawGameId)) // Raw: "ZhoooCoY" - NEVER MATCHES!

// AFTER (v6.85):
failedGameIds.add(rawGameId);     // Raw: "ZhoooCoY"
if (failedGameIds.has(rawGameId)) // Raw: "ZhoooCoY" - MATCHES!
```

## ID Format Convention (v6.85)
- **Database storage**: RAW IDs only (e.g., `ZhoooCoY`, `123456789`)
- **Failed tracking**: RAW IDs only
- **Session tracking**: RAW IDs only (via `analyzedData.gameIds`)
- **Fetch exclusions**: RAW IDs (converted from prefixed at fetch time)
- **Source identification**: Prefix retained in `source` field, not ID

## Pipeline Flow
1. Fetcher returns games with prefixed IDs (`li_xxx`, `cc_xxx`)
2. Benchmark extracts raw ID: `rawGameId = gameId.replace(/^(li_|cc_)/, '')`
3. All tracking operations use `rawGameId`
4. Database stores `rawGameId` in `game_id` column
5. Next session loads raw IDs into `analyzedData.gameIds`

This ensures zero ID format mismatches across the entire pipeline.
