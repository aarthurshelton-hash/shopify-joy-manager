---
description: Data integrity, DB, and numeric safety rules
tags: [data_integrity, database, numeric_overflow, no_synthesis]
globs: ["farm/workers/**/*", "src/**/*"]
---

# Data Integrity Rules

## Sourcing
- Only real external data is allowed. No mock data, no simulation fallback, no test data in production.
- If a data source fails, return `null` / `OFFLINE` rather than fabricate values.
- All chess game IDs must be real Lichess (8-char alphanumeric) or Chess.com (`cc_*`) IDs.

## Numeric Overflow Prevention
- Always check DB column precision before writing numeric values.
- Clamp values to column limits; use `Math.min` / `Math.max` on every numeric INSERT.
- Examples from past bugs:
  - `color_richness` (numeric(5,4)): clamp to ≤ 9.9999.
  - `complexity_score` (numeric(5,4)): divide raw interaction count by ~100 and clamp.
  - `chess_confidence` / `market_confidence` (numeric(3,2)): store the 0.0–1.0 decimal, not `Math.round(conf * 100)`.
  - `chess_intensity` / `market_intensity` (numeric(3,2)): clamp `posComplexity` ≤ 9.99.

## Validation & Deduplication
- Validate FEN with a regex before saving; do not rely solely on `chess.js`.
- Keep deduplication lightweight: do not preload all 1M+ game IDs into a session Set on startup. Use batch `SELECT` per cycle plus a session-local Set; rely on `ON CONFLICT DO NOTHING` as final safety net.
- Fast-fail on constraint violations (`23505`, `23514`, `23502`) without retries.

## Randomness & Determinism
- Never use `Math.random()` for production logic.
- Seasonal/novelty/polarization/byte fields must be deterministic from a seed, date, phase, or hash.

## DB Connections
- Use the **direct** Supabase URL (`db.*.supabase.co:5432`), not the pooler, to avoid circuit breakers.
- Set worker pool `max: 1` (~6 total connections for 6 workers).
- Before diagnosing DB lockouts, check for orphaned processes:
  ```bash
  ps aux | grep -E "farm/workers|pm2"
  pkill -f "farm/workers"
  pkill -f "pm2 logs"
  ```

## Audit Trail
- When fixing data bugs, run explicit repair scripts, null stale rows, and recompute affected columns.
- Keep `ep_correct` / `hybrid_correct` / `stockfish_correct` semantics aligned to the actual column names in the target table.
