---
description: Vercel build, deploy, and infrastructure rules
tags: [deployment, vercel, build, supabase, pm2, esbuild]
globs: ["package.json", "vercel.json", "vite.config.ts", "farm/dist/**/*"]
---

# Deployment & Build Rules

## Platform
- En Pensent deploys to **Vercel** (not Netlify).
- Domain: `enpensent.com`.
- Framework: Vite + React.
- Vercel project: `alecs-projects-94bfb299/shopify-joy-manager`.

## Git Workflow
- Active deployment branch is **`gh-pages`**, not `main`.
- Push to `main`, then:
  ```bash
  git push origin main:gh-pages --force
  ```
- Alternatively, use `npx vercel --prod`.

## Vercel Build Config
- `vercel.json`:
  - `buildCommand`: `npm run build`
  - `installCommand`: `npm install --include=dev`
  - `outputDirectory`: `dist`
  - `framework`: `vite`
  - Catch-all rewrite to `/index.html`

## Critical Build Pitfalls
1. Vercel installs with `NODE_ENV=production`, which omits `devDependencies`.
   - **All build-critical packages must be in `dependencies`**: `vite`, `@vitejs/plugin-react-swc`, `autoprefixer`, `postcss`, `tailwindcss`, `@tailwindcss/typography`, `terser`, `rollup-plugin-obfuscator`.
2. **Never put `vitest`, `@playwright/test`, or `vercel` CLI in `dependencies`.**
   - `vitest` pulls `vite@7` + `tsx` + `esbuild@0.27.x`, conflicting with `vite@5`'s `esbuild@0.21.5` and causing postinstall binary validation to fail.
3. `vite.config.ts` must **not** import `lovable-tagger` at top level. Lazy dynamic-import it only in dev mode.
4. Do **not** create an `api/` serverless directory or add `@vercel/node` unless truly needed.

## Build Verification
- Simulate the Vercel install locally:
  ```bash
  cp -r . /tmp/ep-vercel-test
  cd /tmp/ep-vercel-test
  NODE_ENV=production npm install --omit=dev
  npm run build
  ```

## Farm Workers Use Compiled JS
- `farm/dist/` is the runtime target for workers.
- After editing TypeScript in `src/lib/chess/...`, rebuild:
  ```bash
  rm -rf farm/dist/lib/chess
  npx tsc -p tsconfig.farm.json
  pm2 restart all && pm2 save
  ```
- For `equilibriumPredictor.ts` or `signalCalibration.ts` single-file esbuild, see `.windsurf/skills/ep-farm-build.md`.

## Supabase / DB Infrastructure
- Use the correct Supabase project ID (`ezvfslkjyjsqycztyfxh`) configured in `.env`.
- Connect via the **direct** `db.*.supabase.co:5432` URL, not the pooler, to avoid circuit breakers.
- Set worker DB pool `max: 1`.

## PM2 / Worker Management
- Save config after changes: `pm2 save`.
- Restart workers after deploying compiled JS: `pm2 restart all`.
- If DB lockouts occur, kill orphaned processes before debugging:
  ```bash
  ps aux | grep -E "farm/workers|pm2"
  pkill -f "farm/workers"
  pkill -f "pm2 logs"
  ```
