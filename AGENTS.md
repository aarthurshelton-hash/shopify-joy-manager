# AGENTS.md — En Pensent Project Guide

## Project Overview

En Pensent is a universal pattern-prediction system built around an 8×8 color-flow grid.
It predicts outcomes across chess, financial markets, batteries, chemical processes, and live-data domains.
The web front end is a Vite + React app deployed to Vercel at `enpensent.com`.
The back end is a set of Node/TS farm workers managed by PM2, writing to Supabase Postgres.

## Architecture at a Glance

- **Universal Grid**: `farm/workers/domain-adapters/universal-grid.mjs` (and compiled `src/lib/chess/colorFlowAnalysis/*`) transforms domain-specific features into 8-quadrant signatures.
- **Chess Pipeline**: `chess-db-ingest-worker.mjs` ingests real games, evaluates with Stockfish 18, runs color-flow analysis, and stores predictions in `chess_prediction_attempts`.
- **Market Pipeline**: `market-prediction-worker.mjs` maps market candle windows to the same grid, uses a chess→market bridge, and stores predictions in `market_prediction_attempts`.
- **Playing Engine**: `src/lib/chess/trajectoryChessEngine.ts` selects moves by trajectory alignment against learned patterns.
- **Autonomous Trader**: `public/ib-headless-trader/` reads predictions and routes orders through `public/ib-gateway-bridge/` to IBKR.

## Coding Conventions

- Use TypeScript for `src/lib/chess` and front-end code; farm workers are `.mjs` ESM.
- Always compile chess library changes to `farm/dist/lib/chess` before restarting workers.
- Never hardcode credentials or API keys; source them from `.env`.
- Never use `Math.random()` for production logic.
- Clamp every numeric value to its DB column precision before INSERT.
- Respect the **No Zeros / No Negatives** universal constraint: use epsilon floors and reciprocals.

## Key File Locations

| Concern | Path |
|---------|------|
| Core color flow laws | `.windsurf/rules/chess-engine.md` |
| Market bridge & trading | `.windsurf/rules/market-prediction.md` |
| Data integrity | `.windsurf/rules/data-integrity.md` |
| Deployment & build | `.windsurf/rules/deployment.md` |
| Core behavioral rules | `.windsurf/rules/en-pensent-core.md` |
| Farm build skill | `.windsurf/skills/ep-farm-build.md` |
| Market status skill | `.windsurf/skills/live-market-status.md` |
| DB recovery skill | `.windsurf/skills/db-connection-recovery.md` |

## Build & Deploy

1. After `src/lib/chess` changes, rebuild `farm/dist` (see `deployment.md`).
2. Test locally with `npm run build`.
3. Push `main`, then `git push origin main:gh-pages --force`, or run `npx vercel --prod`.
4. Restart PM2 workers: `pm2 restart all && pm2 save`.

## Testing & Verification

- Prefer automated verification when available (unit tests, Playwright).
- For farm code, verify by checking worker logs and DB output after restart.
- For Vercel, run a simulated production install before pushing.

## Historical Context

- Stockfish outcome prediction is far lower than conventional wisdom (~57% overall, not 75–85%).
- EP's edge over Stockfish is strongest in the 0–50cp evaluation zone.
- The market engine has gone through multiple threshold-corruption fixes; live accuracy cache and `yahoo_finance`-only threshold learning are the current standard.
