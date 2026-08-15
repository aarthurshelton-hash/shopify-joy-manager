---
description: Architecture for scaling chess data ingestion from 400K to billions of games
---

# Scale to Billions: Chess Data Ingestion Architecture

## Current State (Aug 2026)

- **3 PM2 workers** on a single Mac, scraping Chess.com + streaming Lichess DB dumps
- **~432K games** ingested across all workers
- **Throughput**: ~20K games/hour (bottlenecked by Stockfish eval at depth 14)
- **Worker 3** was broken (read-only transaction from DNS failure) — restarted
- **Supabase free tier**: limited pooler connections (max 9 concurrent)

## Root Bottleneck: Stockfish Evaluation

Every game gets SF depth-14 evaluation even when Lichess DB dumps contain
embedded `[%eval]` annotations. The worker calls `evaluateWithStockfish()`
first and only falls back to embedded evals on SF errors.

**Fix**: Use embedded evals when available. Skip SF entirely for Lichess DB
games that have `[%eval]` annotations. This would 10x throughput on Lichess
DB streams (from ~500 games/min to ~5000+ games/min).

### Implementation

In `chess-db-ingest-worker.mjs`, line ~1238:

```js
// BEFORE (current): always SF first
const sfResult = await evaluateWithStockfish(fen, CONFIG.sfDepthFast);

// AFTER: use embedded evals when available
if (game.evals.length > 0) {
  const evalIndex = Math.min(moveNumber * 2 - 2, game.evals.length - 1);
  sfEvalCp = evalIndex >= 0 ? game.evals[evalIndex] : 0;
  hasRealEval = true;
  // Skip SF queue entirely — embedded eval is higher quality (depth 20+)
} else {
  const sfResult = await evaluateWithStockfish(fen, CONFIG.sfDepthFast);
  sfEvalCp = Math.round(sfResult.evaluation * 100);
  hasRealEval = sfResult.source === 'stockfish';
}
```

## Phase 1: Optimize Current Workers (0 → 5M games)

1. **Use embedded evals** for Lichess DB games (10x throughput boost)
2. **Increase Lichess stream time** from 90 min to 180 min per cycle
3. **Add 2 more workers** (shards 3-4) covering 2013-2016 and 2007-2012
4. **Fix dupe spiral logic** — skip deeper into dumps instead of re-processing
5. **Expected throughput**: ~200K games/hour → 5M in ~25 hours

## Phase 2: Bulk PGN Ingestion (5M → 100M games)

1. **Download Lichess monthly dumps directly** to disk (80-100M games/month)
2. **Batch insert without SF eval** — use embedded evals only
3. **Run SF evaluation as a separate backfill pass** on inserted games
4. **Use `COPY` command** instead of INSERT for bulk loading (100x faster)
5. **Supabase**: Upgrade to Pro tier for higher connection limits

### Bulk Insert Architecture

```
Lichess ZST dump → curl | zstdcat → PGN parser → Batch COPY to chess_games
                                                    ↓
                                              Backfill worker
                                                    ↓
                                              SF eval (depth 14)
                                                    ↓
                                              Color flow analysis
                                                    ↓
                                              Prediction attempt
```

## Phase 3: Cloud Distribution (100M → billions)

1. **Move workers to cloud** (AWS/GCP spot instances)
2. **Distributed queue** (Redis/BullMQ) for work distribution
3. **Partition by month** — each worker handles one Lichess month
4. **Postgres partitioning** — partition `chess_games` by month
5. **Read replicas** for query load (site reads from replica)
6. **S3 for PGN storage** — raw PGNs archived, DB stores processed data only

### Cloud Worker Topology

```
Redis Queue (months to process)
    ├── Worker 1: 2026-01  →  EC2 spot (us-west-2)
    ├── Worker 2: 2026-02  →  EC2 spot (us-west-2)
    ├── Worker 3: 2025-12  →  EC2 spot (us-east-1)
    └── ... (scale to 50+ workers)
            ↓
    Supabase Postgres (partitioned by month)
            ↓
    Read Replica ← Site queries
```

## Phase 4: Real-Time Ingestion (live games)

1. **Lichess API round-robin** — stream live games as they finish
2. **Chess.com published game API** — daily batch of completed games
3. **WebSocket connections** to live tournament feeds
4. **Process within seconds of game completion** — near real-time predictions

## Data Quality Considerations

- **Min ELO filter**: Currently 1500. For billions scale, consider tiered storage:
  - Hot tier: 2500+ ELO (GM/IM games) — full SF depth 20 eval
  - Warm tier: 1800-2500 ELO — SF depth 14 or embedded evals
  - Cold tier: <1800 ELO — embedded evals only, no SF
- **Dedup**: Current batch-check approach works at scale. Consider Bloom filter
  for ultra-fast dedup at billions scale.
- **No zeros/negatives**: Maintain epsilon floors per AGENTS.md constraints.

## Verification

- Check `chess_games` count via Supabase after each phase
- Monitor worker logs for throughput (`Saved` count per flush)
- Verify prediction accuracy doesn't degrade with embedded-eval-only games
- Check `chess_prediction_attempts` count matches `chess_games` × moves analyzed
