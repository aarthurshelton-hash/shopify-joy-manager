# Memory: infrastructure/universal-engine/v6-96-local-only-fix
Updated: 2026-01-21

## Problem Identified
Pipeline was hitting 429 rate limits from Lichess Cloud Eval API because:
1. `generateHybridPrediction()` was calling `evaluatePosition()` which hits the cloud API
2. "Hikaru" in LICHESS_ELITE_PLAYERS returns 404 (correct username: DrNykterstein)
3. Cloud API has strict rate limits (20 req/min) causing pipeline stalls

## v6.96-LOCAL Fixes

### 1. New Local Hybrid Prediction Function
Created `generateLocalHybridPrediction()` that:
- Uses PRE-COMPUTED Stockfish eval from local analysis
- Combines with Color Flow analysis (no API calls)
- Returns prediction, confidence, and archetype
- Falls back gracefully on any error

### 2. Updated Player Lists
Removed invalid usernames:
- "SSJG_Goku" (404)
- "Hikaru" (404 - uses DrNykterstein on Lichess, Hikaru on Chess.com)

Added verified players:
- chaborak, Alireza2003, FerdinandPorsche, realDonaldDuck

### 3. Pipeline Changes
Both `runCloudPoolBatch` and `runLocalPoolBatch` now:
- Use `generateLocalHybridPrediction()` instead of cloud-calling version
- Set `stockfishMode: 'local'` for all predictions
- Avoid any external API calls during analysis

## Architecture (v6.96)
```
Game Fetch (Lichess/Chess.com APIs)
    ↓
Local Stockfish Analysis (D18 or D30)
    ↓
Local Hybrid Prediction (SF eval + Color Flow)
    ↓
Save to Database
```

**Zero cloud eval API calls during pipeline execution.**

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
