---
description: Rebuild compiled farm JS after TypeScript changes
tags: [chess, build, esbuild, farm, typescript]
---

# Skill: Rebuild EP Farm Compiled JS

## When to use
After modifying any TypeScript file under `src/lib/chess/colorFlowAnalysis/` or `src/lib/chess/hybridPrediction/` that is imported by `farm/workers/*.mjs`.

## Full rebuild (preferred)

```bash
rm -rf farm/dist/lib/chess
npx tsc -p tsconfig.farm.json
pm2 restart all
pm2 save
```

## Single-file esbuild (equilibriumPredictor)

```bash
npx esbuild src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts \
  --bundle --platform=node --format=cjs \
  --outfile=farm/dist/lib/chess/colorFlowAnalysis/equilibriumPredictor.js \
  --external:./types \
  --external:./archetypeDefinitions \
  --external:./signalCalibration \
  --external:./mirrorEval \
  --external:./deepSignals \
  --external:./photonicGrid

npx esbuild src/lib/chess/colorFlowAnalysis/signalCalibration.ts \
  --bundle --platform=node --format=cjs \
  --outfile=farm/dist/lib/chess/colorFlowAnalysis/signalCalibration.js \
  --external:./types

cp farm/dist/lib/chess/colorFlowAnalysis/equilibriumPredictor.js farm/dist/colorFlowAnalysis/
cp farm/dist/lib/chess/colorFlowAnalysis/signalCalibration.js farm/dist/colorFlowAnalysis/
pm2 restart chess-db-ingest chess-benchmark-0
pm2 save
```

## Verify
- Check worker logs for `stockfish_depth: 18` and expected max confidence caps.
- Confirm `farm/dist/lib/chess` contains updated `.js` files.
