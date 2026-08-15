---
description: Chess engine, color-flow, and prediction conventions
tags: [chess, color_flow, engine, archetype, stockfish, build]
globs: ["src/lib/chess/**/*", "farm/workers/*chess*", "farm/dist/lib/chess/**/*"]
---

# Chess Engine Rules

## Core Color Flow Laws
These apply to all documentation, visuals, and engines:
1. **Path coloring, not destination coloring**: every square a piece passes through gets colored.
2. **Knights trace the L-shape**: long leg first (2 squares), then short leg (1 square).
3. **Squares-in-squares layering**: new colors layer on top; up to 6 visible nested layers.
4. **Colorless starting squares**: a square only gets colored when a piece moves through or onto it.
5. **Origin square not colored by departure**: only path + destination get colored; origin is colored only if another piece later passes through.
6. **8-quadrant unique colors**: pawns get gradated rank-based colors; each piece pair (W/B rook, bishop, etc.) gets distinct colors.

Key code locations:
- Path tracing: `src/lib/chess/gameSimulator.ts` → `getPathSquares()`
- Visualization: `src/components/chess/ChessBoardVisualization.tsx` → `renderNestedSquares()`
- Color palette: `src/lib/chess/colorFlowAnalysis/enhancedSignatureExtractor.ts`
- Production worker: `farm/workers/ep-enhanced-worker.mjs` uses `simulateGame()`

## 32-Piece Color Flow
- Each of the 32 starting pieces has a unique hue (white 0–179, black 180–359).
- Pieces are tracked by starting square (e.g., `wRa` = a1 rook, `wPe` = e2 pawn).
- Trace stacks create nested square occupancy history.
- Piece values are **position-relative**: pawn rank 5→2pts, rank 6→3pts, rank 7→4pts; knight value rises in closed middlegame; bishop/rook values rise in endgame.
- Calibrate the 32-piece predictor with 32-piece-specific signals, not the 4-quad predictor.

## Dual Fusion Architecture
There are two independent fusion layers:
1. **`src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts`**: produces `baselinePred` from 11+ weighted signals (control, momentum, archetype, SF, phase, kingSafety, pawnStructure, enhancedControl, interaction, archetypePhase, mirror, deepSignals).
2. **`farm/workers/chess-db-ingest-worker.mjs`**: fuses `baseline` + `enhanced 32-piece` + `SF` into the stored `hybrid_prediction` and `hybrid_confidence`.
- **Critical**: to change the final stored prediction/confidence, modify the ingest worker's fusion logic, not only `equilibriumPredictor.ts`.
- `hybrid_confidence` is stored as integer 15–69 (from `hybridConf * 100`, capped).
- `baseline_prediction` and `enhanced_prediction` must be included in the return object from `processGame()`.

## Stockfish Eval Normalization
- Stockfish UCI `score cp` is from the **side-to-move's perspective**.
- Normalize to White's perspective before use:
  ```javascript
  const sideToMove = (fen || '').split(' ')[1] || 'w';
  const flipSign = sideToMove === 'b' ? -1 : 1;
  const whiteEval = evaluation * flipSign;
  ```
- Lichess PGN evals are already from White's perspective and should not be flipped.

## Build & Deploy
- Farm workers consume **compiled JS** in `farm/dist/`. TypeScript changes must be compiled.
- Preferred: `rm -rf farm/dist/lib/chess && npx tsc -p tsconfig.farm.json` then `pm2 restart all`.
- `tsconfig.farm.json` includes `colorFlowAnalysis/**/*.ts`, `gameSimulator.ts`, `pieceColors.ts`, `cloudBenchmark.ts`, `hybridPrediction/**/*.ts`. Module: CommonJS; `farm/dist/package.json` has `type: "commonjs"`.
- For a single-file esbuild of `equilibriumPredictor.ts`, see `.windsurf/skills/ep-farm-build.md`.

## Calibration & Confidence Rules
- Confidence caps must be applied in `predictionEngine.ts` **after** `calibrateConfidence()`, not in `equilibriumPredictor.ts`, because `archetypeCalibration.ts` overwrites `finalConfidence`.
- Use zone-aware weights and phase-aware weights calibrated from real data; avoid hardcoded constants.
- Use source-aware confidence specialization where data shows calibration gaps (e.g., Chess.com vs Lichess).
- Elite ELO gates: high-rated games need lower confidence caps because SF is more reliable in the 50–200cp zone.

## Fusion Intelligence
- Hybrid base weights (baseline 0.25, enhanced 0.45, SF 0.30) are modulated by multiplicative boosts:
  - archetype-specific accuracy ratio
  - time control (classical > rapid > blitz > bullet)
  - game phase (middlegame sweet spot)
- Combined boost is clamped to [0.82, 1.35], applied to enhanced weight, then renormalized to sum to 1.0.

## What NOT to do
- Do not predict draws directly (precision is terrible). Instead, dampen confidence in draw-prone positions.
- Do not apply blanket white-prediction dampeners at 0–100cp; they hurt high-confidence correct predictions.
- Avoid late-game demotions that contradict live data.
- Filter `time_control != 'puzzle'` when analyzing real-game accuracy.
