---
description: Market prediction, trading, and chess-market bridge rules
tags: [market, trading, chess_market_bridge, sector, live_accuracy]
globs: ["farm/workers/market*", "public/ib-*-trader/**/*", "src/lib/market/**/*"]
---

# Market Prediction Rules

## Fundamental Invariants
- **BLACK = BUY (bullish), WHITE = SELL (bearish)** across all market systems and UI.
- **No crypto** (BTC, ETH, SOL, etc.) in the market pipeline.
- Market predictions are stored in **`market_prediction_attempts`** (not `market_predictions`).

## Chess→Market Bridge
- Dual-signal architecture lives in `farm/workers/market-prediction-worker.mjs`:
  - **Signal A**: chess consensus from last 5 min / ~200 games (`getChessConsensusSignal()`).
  - **Signal B**: market grid pattern matched to chess archetypes (`classifyMarketAsChess(signature)`).
  - Cyclical confirmation: agreement → ×1.15, disagreement → ×0.85.
- Archetype-to-regime mapping:
  - `kingside_attack` → momentum
  - `queenside_expansion` → institutional/broad activity
  - `positional_squeeze` → low-vol compression
  - `sacrifical_attack` → breakout
  - `central_domination` → trend
  - `closed_maneuvering` → range-bound

## Sector Classification → Chess Mode
In `market-prediction-worker.mjs`:
- tech (AMD, NVDA, MSFT, GOOGL, META, AAPL, AMZN) → bullet
- commodities (GC=F, SI=F, HG=F) → classical
- energy (CL=F, NG=F) → rapid
- forex pairs → blitz
- indices (SPY, QQQ, ^FTSE, ^GDAXI) → rapid

## Timeframe Mapping
Market timeframes feed through the same 8×8 grid with different candle granularity:
- scalp → 1m candles, 5m resolution → chess opening
- short → 5m candles, 30m resolution
- medium → 15m candles, 2h resolution → chess late middlegame
- swing → 1h candles, 8h resolution → chess early endgame
- daily → 1d candles, 24h resolution → chess deep endgame

## Accuracy & Confidence
- Maintain a **live accuracy cache** refreshed from DB (combo, archetype, fallback tiers); do not rely on stale hardcoded accuracy tables.
- Confidence inversion is a known trap: low-confidence buckets can be more accurate than high-confidence buckets if the accuracy table is stale. Always validate against live data.
- Replace hard archetype blacklists with **soft confidence dampening** so the system keeps learning; gate < 5% on 50+ samples → 90% penalty.
- Directional bias: historically the system is much better at predicting **down** moves than up.

## Threshold Learning
- `refreshLearnedDirThresholds()` must filter to **`yahoo_finance` live data only**; exclude `yahoo_historical` replay.
- Reject any learned threshold that causes > 20% neutral rate.
- `resolveAuditTrailPredictions()` must skip resolutions where `|exitPrice - predPrice| / predPrice < 0.00005` (stale / weekend prices).
- Historical replay uses daily candle fallback; never let it contaminate live threshold learning.

## Query Strategy
- Full-table aggregates on Supabase time out; use **recent-window samples** (e.g., last 7 days, 5000 resolved rows) for status checks.
- See `.windsurf/skills/live-market-status.md` for the exact procedure.

## Trading
- See `public/ib-headless-trader/config.js` for filters, Kelly sizing (quarter-Kelly), and risk limits.
- Required order field: `transmit: true` on every `placeOrder()` call or IB Gateway will hold the order locally.
- USD-denominated accounts may need a CAD→USD forex order via `POST /api/forex` (IDEALPRO, `USD`, `CASH`) before USD stock orders fill.
