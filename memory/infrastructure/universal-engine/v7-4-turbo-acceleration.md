# Memory: infrastructure/universal-engine/v7-4-turbo-acceleration
Updated: 2026-01-21

## v7.4-TURBO Acceleration Strategy

### Problem
Original v7.3 throughput was ~1,200 games/day, requiring ~82 days to reach 100,000 games.

### Solution: Safe 5x Acceleration

#### Optimizations Applied
1. **Pre-fetch Deduplication**: Query existing game IDs BEFORE fetching to avoid wasted API calls
2. **Parallel Source Fetching**: Lichess + Chess.com fetched via Promise.all simultaneously
3. **Increased Batch Size**: 5 → 10 games per cron run
4. **Faster Cloud Eval**: 7.5s → 5s interval (12 req/min, still under 20 limit)
5. **More Players per Run**: 2 → 3 players per source
6. **Extended Time Window**: 7 → 14 days lookback for more game variety
7. **Faster Cron**: 5min → 2min intervals

#### Rate Limit Safety
- Lichess Cloud Eval: 20 req/min limit
- TURBO uses 12 req/min (60% of limit)
- Built-in exponential backoff on 429 responses
- Pre-deduplication prevents redundant API calls

#### Projected Throughput
| Metric | v7.3 | v7.4-TURBO | Improvement |
|--------|------|------------|-------------|
| Games/batch | 5 | 10 | 2x |
| Batches/hour | 12 | 30 | 2.5x |
| Games/day | ~1,200 | ~5,000-6,000 | ~5x |
| Time to 100K | 82 days | **17-20 days** | 4-5x faster |

#### Data Quality Tiers
- `verified-sf17`: Real Stockfish 17 evaluation from Lichess Cloud
- `turbo-fallback`: Material-based heuristic (when cloud eval unavailable)

### Cron Configuration
```sql
SELECT cron.schedule(
  'auto-evolve-turbo',
  '*/2 * * * *',  -- Every 2 minutes
  ...
);
```

### Why This Doesn't Break the System
1. Still under Lichess rate limits (60% usage)
2. Pre-deduplication eliminates wasted calls
3. Parallel fetching = faster but same total requests
4. Real SF17 still primary source (fallback is rare)
5. All predictions still compete against authentic SF17 NNUE

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
