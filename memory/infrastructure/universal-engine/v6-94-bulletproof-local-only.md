# Memory: infrastructure/universal-engine/v6-94-bulletproof-local-only
Updated: now

The **v6.94-BULLETPROOF** architecture removes ALL external API dependencies and uses LOCAL Stockfish exclusively.

## Core Principle
**No external APIs = No failures**. The pipeline works completely offline using local Stockfish 17 NNUE.

## Dual-Pool Architecture (Both use LOCAL Stockfish)

### VOLUME-LOCAL Pool (100+/hour)
- Local Stockfish 17 NNUE at **Depth 18**
- 5M nodes per position
- 30s timeout
- 10 games per batch, batch every 6 min

### LOCAL-DEEP Pool (5+/hour)
- Local Stockfish 17 NNUE at **Depth 30**
- 100M nodes per position  
- 10 min timeout
- 1 game per batch, batch every 12 min

## Why Cloud API Was Removed
1. Lichess Cloud Eval returns "notFound" for many positions
2. Rate limiting causes unpredictable delays
3. External dependency = point of failure
4. Local Stockfish is ALWAYS available

## Key Changes from v6.93
- `CLOUD_POOL_CONFIG` renamed conceptually to "VOLUME-LOCAL"
- Both pools use `analyzeWithLocalStockfish()`
- Cloud eval function kept as optional enhancement only
- Faster recovery (3 errors triggers, 15s delay)
- More frequent batches for continuous saves

## Self-Healing
- Health checks every 3 min
- 3 consecutive errors triggers full recovery
- Engine restart + state persistence
- Auto-reschedule after any failure

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
