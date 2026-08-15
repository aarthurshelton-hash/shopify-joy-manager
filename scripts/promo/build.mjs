#!/usr/bin/env node
/**
 * Builds both asset kits from the live engine.
 *
 *   node scripts/promo/build.mjs            # SVG + PNG
 *   node scripts/promo/build.mjs --no-png   # SVG only (skip Chromium)
 *
 * Outputs:
 *   ~/Downloads/enpensent-matcherino-promo    (refined in place)
 *   ~/Downloads/enpensent-victory-cards-v2    (new)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

import { simulateGame } from '../../farm/dist/lib/chess/gameSimulator.js';
import { extractEnhancedColorFlowSignature } from '../../farm/dist/lib/chess/colorFlowAnalysis/enhancedSignatureExtractor.js';

import { AUDIT, GOOGLE_FONTS, PRINT, QUADRANTS } from './tokens.mjs';
import { GAMES, archetypeLabel } from './games.mjs';
import { renderCard, CARD_SPEC } from './victory-card.mjs';
import {
  logoMarkAsset, wordmarkAsset, heroAsset, bannerAsset,
  predictionCardAsset, signatureCardAsset, iconsAsset, brandSpecAsset,
} from './matcherino-kit.mjs';
import { C } from './tokens.mjs';

const DL = path.join(os.homedir(), 'Downloads');
const PROMO_DIR = path.join(DL, 'enpensent-matcherino-promo');
const CARDS_DIR = path.join(DL, 'enpensent-victory-cards-v2');
const SKIP_PNG = process.argv.includes('--no-png');

const written = [];

function write(dir, name, content) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  written.push({ dir, name, bytes: Buffer.byteLength(content) });
  return p;
}

// ── analyse every game with the real engine ───────────────────────────

function analyse(game) {
  const sim = simulateGame(game.pgn);
  const sig = extractEnhancedColorFlowSignature(sim);
  if (!sim.totalMoves) throw new Error(`${game.id}: PGN produced no moves`);
  if (!sig.enhancedProfile) throw new Error(`${game.id}: no enhanced profile`);
  return { sim, sig };
}

console.log('En Pensent — asset build');
console.log(`Engine: farm/dist  ·  audit ${AUDIT.date}  ·  ${AUDIT.rows.toLocaleString('en-US')} scored positions\n`);

const analysed = GAMES.map((game) => {
  const { sim, sig } = analyse(game);
  console.log(
    `  ${game.id.padEnd(14)} ${String(sim.totalMoves).padStart(3)} plies  ` +
    `${sig.fingerprint.padEnd(12)} ${archetypeLabel(sig.archetype)}`
  );
  return { game, sim, sig };
});
console.log('');

const featured = analysed[0]; // The Immortal Game

// ── kit 1: Matcherino promo ───────────────────────────────────────────

const promoAssets = [
  ['ep-logo-mark.svg', logoMarkAsset()],
  ['ep-logo-mark-glow.svg', logoMarkAsset({ glow: true })],
  ['ep-logo-mark-mono-light.svg', logoMarkAsset({ mono: C.cream })],
  ['ep-logo-mark-mono-dark.svg', logoMarkAsset({ mono: C.obsidian, bg: C.cream })],
  ['ep-wordmark.svg', wordmarkAsset()],
  ['ep-wordmark-light.svg', wordmarkAsset({ light: true })],
  ['hero-fen-to-vision.svg', heroAsset(featured)],
  ['banner-sponsor-lockup.svg', bannerAsset()],
  ['card-prediction-engine.svg', predictionCardAsset()],
  ['card-quadrant-signature.svg', signatureCardAsset(featured)],
  ['icons.svg', iconsAsset()],
  ['brand-spec.svg', brandSpecAsset()],
];

for (const [name, svg] of promoAssets) write(PROMO_DIR, name, svg);

// ── kit 2: Victory cards v2 ───────────────────────────────────────────

const cardFiles = [];
for (const entry of analysed) {
  const { game } = entry;
  for (const side of ['front', 'back']) {
    for (const bleed of [false, true]) {
      const name = `victory-card-${game.id}-${side}${bleed ? '-print' : ''}.svg`;
      write(CARDS_DIR, name, renderCard({ ...entry, side, bleed }));
      if (!bleed) cardFiles.push({ game, side, name });
    }
  }
}

// ── docs ──────────────────────────────────────────────────────────────

write(PROMO_DIR, 'README.md', promoReadme());
write(PROMO_DIR, 'index.html', contactSheet({
  title: 'En Pensent × Matcherino — Promo Kit',
  intro:
    'Vector assets, sharp at any size. Every published statistic is a real audited figure ' +
    `from the full-database audit of ${AUDIT.date}.`,
  groups: [
    { label: 'Hero — 1600×900', items: ['hero-fen-to-vision.svg'], max: '100%' },
    { label: 'Sponsor lockup — 1600×400', items: ['banner-sponsor-lockup.svg'], max: '100%' },
    { label: 'Square cards — 1080×1080', items: ['card-prediction-engine.svg', 'card-quadrant-signature.svg'], max: '48%' },
    { label: 'Wordmark — 1200×280', items: ['ep-wordmark.svg', 'ep-wordmark-light.svg'], max: '100%' },
    { label: 'Mark — 512×512', items: ['ep-logo-mark.svg', 'ep-logo-mark-glow.svg', 'ep-logo-mark-mono-light.svg', 'ep-logo-mark-mono-dark.svg'], max: '23%' },
    { label: 'Icons — 5 × 192', items: ['icons.svg'], max: '100%' },
    { label: 'Brand specification', items: ['brand-spec.svg'], max: '100%' },
  ],
}));

write(CARDS_DIR, 'README.md', cardsReadme());
write(CARDS_DIR, 'index.html', contactSheet({
  title: 'En Pensent — Victory Cards v2',
  intro:
    `Trim ${CARD_SPEC.inches} in at ${CARD_SPEC.dpi} DPI (${CARD_SPEC.trim} px), ` +
    `${CARD_SPEC.bleedIn} in bleed. Front and back shown at trim size; ` +
    'the -print files add bleed and crop marks. Every analytical value is real engine output.',
  groups: analysed.map(({ game, sig }) => ({
    label: `${game.title} · ${game.year} · ${sig.fingerprint} · ${archetypeLabel(sig.archetype)}`,
    items: [`victory-card-${game.id}-front.svg`, `victory-card-${game.id}-back.svg`],
    max: '48%',
  })),
}));

// ── PNG rendering ─────────────────────────────────────────────────────

if (!SKIP_PNG) {
  await renderPngs();
} else {
  console.log('Skipping PNG render (--no-png)\n');
}

// ── summary ───────────────────────────────────────────────────────────

const byDir = written.reduce((m, w) => ((m[w.dir] = (m[w.dir] || 0) + 1), m), {});
console.log('Written:');
for (const [dir, count] of Object.entries(byDir)) console.log(`  ${count} files → ${dir}`);
console.log('\nDone.');

// ══════════════════════════════════════════════════════════════════════

async function renderPngs() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.log('puppeteer unavailable — SVGs written, skipping PNG.\n');
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  } catch (e) {
    console.log(`Chromium launch failed (${e.message.split('\n')[0]}) — SVGs written, skipping PNG.\n`);
    return;
  }

  const jobs = [
    ...promoAssets
      .filter(([n]) => !n.includes('mono'))
      .map(([name]) => ({ dir: PROMO_DIR, svg: name, out: name.replace(/\.svg$/, '@2x.png'), scale: 2 })),
    ...cardFiles.map(({ game, side }) => ({
      dir: CARDS_DIR,
      svg: `victory-card-${game.id}-${side}.svg`,
      out: `victory-card-${game.id}-${side}.png`,
      scale: 1,
    })),
  ];

  console.log(`Rendering ${jobs.length} PNGs via Chromium…`);
  for (const job of jobs) {
    const svg = fs.readFileSync(path.join(job.dir, job.svg), 'utf8');
    const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const w = m ? Math.round(+m[1]) : 1600;
    const h = m ? Math.round(+m[2]) : 900;

    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: job.scale });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
       <link rel="stylesheet" href="${GOOGLE_FONTS}">
       <style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>
       </head><body>${svg}</body></html>`,
      { waitUntil: 'networkidle0' }
    );
    try { await page.evaluate(() => document.fonts.ready); } catch {}
    await page.screenshot({ path: path.join(job.dir, job.out), omitBackground: false });
    await page.close();
    written.push({ dir: job.dir, name: job.out, bytes: 0 });
  }
  await browser.close();
  console.log('PNG render complete.\n');
}

function contactSheet({ title, intro, groups }) {
  const sections = groups
    .map(
      (g) => `  <h2>${g.label}</h2>
  <div class="row">
${g.items.map((i) => `    <figure style="flex:0 1 ${g.max}"><img src="${i}" alt="${i}"><figcaption>${i}</figcaption></figure>`).join('\n')}
  </div>`
    )
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="${GOOGLE_FONTS}">
<style>
  :root { color-scheme: dark; }
  body { background:${C.obsidian}; color:${C.cream}; font-family:Inter,system-ui,sans-serif; margin:0; padding:56px clamp(24px,5vw,72px); }
  h1 { font-family:Cinzel,serif; color:${C.gold}; font-weight:700; letter-spacing:2px; font-size:clamp(28px,3vw,40px); margin:0 0 12px; }
  p.intro { color:${C.muted}; font-size:15px; max-width:78ch; line-height:1.65; margin:0 0 8px; }
  h2 { color:${C.muted}; font-size:12px; letter-spacing:3px; text-transform:uppercase; font-weight:600; margin:52px 0 14px; padding-bottom:8px; border-bottom:1px solid ${C.line}; }
  .row { display:flex; gap:22px; flex-wrap:wrap; align-items:flex-start; }
  figure { margin:0; }
  img { display:block; width:100%; height:auto; border:1px solid ${C.line}; border-radius:10px; background:${C.panel}; }
  figcaption { color:${C.mutedDeep}; font-size:12px; font-family:ui-monospace,Menlo,monospace; margin-top:8px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="intro">${intro}</p>

${sections}
</body>
</html>
`;
}

function promoReadme() {
  const rows = promoAssets
    .map(([name]) => {
      const notes = {
        'ep-logo-mark.svg': '512×512 · flat, use at any size incl. favicon',
        'ep-logo-mark-glow.svg': '512×512 · glow, only at 96px and above',
        'ep-logo-mark-mono-light.svg': '512×512 · single colour on dark',
        'ep-logo-mark-mono-dark.svg': '512×512 · single colour on light',
        'ep-wordmark.svg': '1200×280 · dark backgrounds',
        'ep-wordmark-light.svg': '1200×280 · light backgrounds',
        'hero-fen-to-vision.svg': '1600×900 · main hero, real game → real signature',
        'banner-sponsor-lockup.svg': '1600×400 · co-brand strip, dashed sponsor slot',
        'card-prediction-engine.svg': '1080×1080 · the measured edge vs Stockfish',
        'card-quadrant-signature.svg': '1080×1080 · the 8-quadrant universal visualization',
        'icons.svg': '1280×256 · five 192px feature icons',
        'brand-spec.svg': '1600×1000 · palette, clear space, min sizes, type',
      };
      return `| \`${name}\` | ${notes[name] || ''} |`;
    })
    .join('\n');

  return `# En Pensent × Matcherino — Promo Asset Kit

Vector assets for the Matcherino sponsor page. Brand system: obsidian \`${C.obsidian}\`,
gold \`${C.gold}\`, cream \`${C.cream}\`, Cinzel display, and the trademark
squares-in-squares color flow motif.

## Assets

| File | Notes |
|---|---|
${rows}

Each SVG also ships as \`…@2x.png\` rendered through Chromium with the real
webfonts loaded, so the PNG type is pixel-accurate.

## The numbers on these assets are real

Every figure traces to one source: the full-database audit dated **${AUDIT.date}**.

| Metric | Value |
|---|---|
| Scored positions | ${AUDIT.rows.toLocaleString('en-US')} |
| En Pensent accuracy | ${AUDIT.epAccuracy}% |
| Stockfish (depth ${AUDIT.sfDepth}) accuracy | ${AUDIT.sfAccuracy}% |
| Measured edge | +${AUDIT.edgePp}pp |
| Strongest measured segment | ${AUDIT.bestSegment.label} — +${AUDIT.bestSegment.edgePp}pp |

These are outcome-prediction accuracies over the same games with the same
scoring. Nothing is modelled or extrapolated. If the audit is re-run, update
\`scripts/promo/tokens.mjs\` and rebuild — never edit an SVG by hand.

## Regenerating

\`\`\`bash
node scripts/promo/build.mjs           # SVG + PNG
node scripts/promo/build.mjs --no-png  # SVG only
\`\`\`

The hero and signature card are generated by running the live En Pensent engine
over a real PGN, so the board, archetype and fingerprint shown are genuine
output rather than illustration.

## Usage rules

- Keep clear space of at least 25% of the mark width on all sides.
- Below 96px use \`ep-logo-mark.svg\` (flat). Never the glow variant.
- The engine palette on \`brand-spec.svg\` mirrors the live product. Do not
  restyle those hues; they carry meaning.
- Do not stretch, recolour the gold gradient, or add outer shadows.

## Exporting other sizes

\`\`\`bash
# any resolution, fonts intact
node scripts/promo/build.mjs

# or one-off with librsvg (install the fonts first)
rsvg-convert -w 6400 hero-fen-to-vision.svg -o hero@4x.png
\`\`\`
`;
}

function cardsReadme() {
  const table = analysed
    .map(({ game, sim, sig }) =>
      `| ${game.title} | ${game.year} | ${game.result} | ${sim.totalMoves} | \`${sig.fingerprint}\` | ${archetypeLabel(sig.archetype)} |`
    )
    .join('\n');

  const quadTable = QUADRANTS.map((q) => `| ${q.short} | ${q.label} | ${q.zone} |`).join('\n');

  return `# En Pensent — Victory Cards v2

A cleaner, tournament-ready take on the limited pre-beta run. This is a new set;
the original \`enpensent-victory-cards limited pre beta V0 run\` folder is left
untouched.

## What changed from V0

| V0 | v2 |
|---|---|
| 1200×1680, no print spec | ${CARD_SPEC.trim} trim at ${CARD_SPEC.dpi} DPI, ${CARD_SPEC.bleedIn}in bleed, crop marks |
| Single crowded face | Front / back split — nothing competes for space |
| Decorative QR pattern | Real, scannable QR (spec quiet zone) on the back |
| Board squares were illustrative | Board rendered from real engine visit data |
| No signature panel | 8-quadrant signature, temporal flow, piece dominance, pawn advancement |
| Winner name printed twice | Winner once, plus a clean matchup line |
| No edition numbering | Explicit \`NNN / ${GAMES[0].edition.of}\` on both faces |
| Values not traceable | Fingerprint, archetype and provenance printed on the back |

## The set

| Card | Year | Result | Plies | Signature | Archetype |
|---|---|---|---|---|---|
${table}

Archetype, fingerprint, quadrant profile, temporal flow, piece dominance and
pawn advancement are computed at build time by the live engine from each game's
PGN. Nothing on these cards is estimated.

## Files

For every game:

- \`victory-card-<id>-front.svg\` — trim size, digital use
- \`victory-card-<id>-front-print.svg\` — with bleed + crop marks, send to printer
- \`victory-card-<id>-back.svg\` / \`-back-print.svg\` — verification & provenance
- \`victory-card-<id>-front.png\` / \`-back.png\` — ${CARD_SPEC.trim} raster previews

## Print specification

| Spec | Value |
|---|---|
| Trim | ${CARD_SPEC.inches} in (${CARD_SPEC.trim} px) |
| Canvas with bleed | ${CARD_SPEC.canvas} px |
| Bleed | ${CARD_SPEC.bleedIn} in per edge |
| Safe inset | ${(PRINT.safeInset / PRINT.dpi).toFixed(3)} in inside trim |
| Resolution | ${CARD_SPEC.dpi} DPI |

All content sits inside the safe area; only the background crosses the trim.
Convert to CMYK at the printer's profile — the gold is a screen gradient and
will need a proof pass, or a metallic spot ink if the budget allows.

## Reading the front

The signature panel is the same universal visualization the product uses.

| Quadrant | Region | Squares |
|---|---|---|
${quadTable}

Bars diverge from a shared zero axis: **blue / positive favours White**,
**red / negative favours Black**. Values are piece-weighted cumulative square
occupancy, so the axis maximum is printed under the panel.

## Regenerating

\`\`\`bash
node scripts/promo/build.mjs
\`\`\`

Edition numbers, tiers, titles and poems live in \`scripts/promo/games.mjs\`.
`;
}
