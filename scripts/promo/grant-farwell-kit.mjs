#!/usr/bin/env node
/**
 * Curates a personalized asset folder for Grant Farwell (Matcherino).
 *
 * Pulls the strongest assets from both kits, adds a cover letter,
 * and organizes them into a clean presentation structure.
 *
 *   node scripts/promo/grant-farwell-kit.mjs
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

import { AUDIT, GOOGLE_FONTS, C } from './tokens.mjs';
import { GAMES, archetypeLabel } from './games.mjs';
import { CARD_SPEC } from './victory-card.mjs';

const DL = path.join(os.homedir(), 'Downloads');
const SRC_PROMO = path.join(DL, 'enpensent-matcherino-promo');
const SRC_CARDS = path.join(DL, 'enpensent-victory-cards-v2');
const OUT = path.join(DL, 'enpensent-for-grant-farwell');

const written = [];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copy(srcDir, dstDir, filename) {
  const src = path.join(srcDir, filename);
  if (!fs.existsSync(src)) {
    console.warn(`  WARN: missing ${src}`);
    return;
  }
  ensureDir(dstDir);
  const dst = path.join(dstDir, filename);
  fs.copyFileSync(src, dst);
  written.push({ dst, bytes: fs.statSync(dst).size });
}

function write(dstDir, filename, content) {
  ensureDir(dstDir);
  const dst = path.join(dstDir, filename);
  fs.writeFileSync(dst, content);
  written.push({ dst, bytes: Buffer.byteLength(content) });
}

// ── curated asset list ────────────────────────────────────────────────

const PROMO_ASSETS = [
  'ep-logo-mark.svg',
  'ep-logo-mark@2x.png',
  'ep-logo-mark-glow.svg',
  'ep-logo-mark-glow@2x.png',
  'ep-logo-mark-mono-light.svg',
  'ep-logo-mark-mono-dark.svg',
  'ep-wordmark.svg',
  'ep-wordmark@2x.png',
  'ep-wordmark-light.svg',
  'hero-fen-to-vision.svg',
  'hero-fen-to-vision@2x.png',
  'banner-sponsor-lockup.svg',
  'banner-sponsor-lockup@2x.png',
  'card-prediction-engine.svg',
  'card-prediction-engine@2x.png',
  'card-quadrant-signature.svg',
  'card-quadrant-signature@2x.png',
  'icons.svg',
  'icons@2x.png',
  'brand-spec.svg',
  'brand-spec@2x.png',
];

// Pick the two most iconic games for the curated folder
const FEATURED_CARDS = ['immortal1851', 'opera1858'];
const CARD_SIDES = ['front', 'back'];

// ── build ─────────────────────────────────────────────────────────────

console.log('Building curated folder for Grant Farwell...\n');

// 1. Logos
const logosDir = path.join(OUT, 'logos');
PROMO_ASSETS.filter(f => f.startsWith('ep-logo') || f.startsWith('ep-wordmark'))
  .forEach(f => copy(SRC_PROMO, logosDir, f));

// 2. Hero + banner
const heroDir = path.join(OUT, 'hero-and-banners');
PROMO_ASSETS.filter(f => f.startsWith('hero-') || f.startsWith('banner-'))
  .forEach(f => copy(SRC_PROMO, heroDir, f));

// 3. Square cards
const cardsDir = path.join(OUT, 'square-cards');
PROMO_ASSETS.filter(f => f.startsWith('card-'))
  .forEach(f => copy(SRC_PROMO, cardsDir, f));

// 4. Icons + brand spec
const brandDir = path.join(OUT, 'brand-and-icons');
PROMO_ASSETS.filter(f => f.startsWith('icons') || f.startsWith('brand-spec'))
  .forEach(f => copy(SRC_PROMO, brandDir, f));

// 5. Victory cards (curated selection)
const vcDir = path.join(OUT, 'victory-cards');
for (const gameId of FEATURED_CARDS) {
  for (const side of CARD_SIDES) {
    copy(SRC_CARDS, vcDir, `victory-card-${gameId}-${side}.svg`);
    copy(SRC_CARDS, vcDir, `victory-card-${gameId}-${side}.png`);
    copy(SRC_CARDS, vcDir, `victory-card-${gameId}-${side}-print.svg`);
  }
}

// 6. Cover letter
write(OUT, 'COVER-LETTER.md', coverLetter());

// 7. README
write(OUT, 'README.md', readme());

// 8. Index page
write(OUT, 'index.html', indexPage());

// ── summary ───────────────────────────────────────────────────────────

console.log(`Written: ${written.length} files → ${OUT}\n`);
written.forEach(w => {
  const rel = path.relative(OUT, w.dst);
  console.log(`  ${rel.padEnd(48)} ${w.bytes.toLocaleString()} bytes`);
});
console.log('\nDone.');

// ══════════════════════════════════════════════════════════════════════

function coverLetter() {
  return `# En Pensent — Partnership Asset Package

**For:** Grant Farwell, Matcherino
**From:** En Pensent
**Date:** ${new Date().toISOString().split('T')[0]}
**Re:** Curated visual assets for Matcherino partnership

---

Grant,

Thank you for the conversation about bringing En Pensent to the
Matcherino ecosystem. This package contains the core visual assets we
think will resonate most with your community — tournament organizers,
players, and fans who already care deeply about the artistry of chess.

## What's inside

**logos/** — The En Pensent mark in four variants (flat, glow, mono-light,
mono-dark) plus the wordmark on dark and light backgrounds. All vector;
crisp at any size. Use the flat mark below 96px; reserve the glow for
larger placements.

**hero-and-banners/** — The main hero image (1600×900) showing a real
game's PGN transforming into its color flow visualization, and the
sponsor co-brand lockup strip (1600×400) with a dashed slot for the
Matcherino logo.

**square-cards/** — Two 1080×1080 cards: "The Engine That Sees Games As
Color" (the measured prediction edge vs Stockfish) and "The 8-Quadrant
Signature" (the universal visualization). Both are social-ready and
every number is from our full-database audit.

**victory-cards/** — Two collectible print cards (5×7in at 300 DPI) for
the most iconic games in chess history: Anderssen's Immortal Game (1851)
and the Opera Game (1858). Front shows the color flow board and
signature; back has a scannable QR for verification, the full PGN, and
provenance. These are the same cards we'd produce for tournament winners
on Matcherino.

**brand-and-icons/** — The brand specification sheet (palette, clear
space, minimum sizes, typography) and a set of five feature icons.

## The numbers are real

Every statistic on these assets traces to a single source: our
full-database audit dated **${AUDIT.date}**, covering
**${AUDIT.rows.toLocaleString('en-US')}** scored positions.

| Metric | Value |
|---|---|
| En Pensent prediction accuracy | ${AUDIT.epAccuracy}% |
| Stockfish (depth ${AUDIT.sfDepth}) accuracy | ${AUDIT.sfAccuracy}% |
| Measured edge | +${AUDIT.edgePp}pp |
| Strongest segment | ${AUDIT.bestSegment.label} (+${AUDIT.bestSegment.edgePp}pp) |

These are outcome-prediction accuracies over the same games with the
same scoring. Nothing is modelled or extrapolated.

## How we see this working with Matcherino

1. **Tournament prizes** — Victory cards as collectible rewards for
   Matcherino tournament winners, each card tied to the specific game
   they won. The QR on the back links to a verification page.

2. **Sponsorship visibility** — The banner lockup is designed for a
   co-brand placement; the dashed slot is sized for the Matcherino mark
   at 330×160px.

3. **Social promotion** — The square cards and hero image are
   social-ready (1080×1080 and 1600×900) and can be posted directly to
   promote En Pensent-powered events on Matcherino.

4. **Collectible series** — The victory card format scales to any game.
   We can produce cards for any Matcherino tournament on demand, each
   with real engine output from the actual game played.

## Usage guidelines

- Keep clear space of at least 25% of the mark width on all sides.
- Below 96px, use the flat mark — never the glow variant.
- The engine palette (on the brand spec sheet) mirrors the live product.
  Those hues carry meaning; please don't restyle them.
- Don't stretch, recolour the gold gradient, or add outer shadows.
- For print, use the \`-print.svg\` files which include bleed and crop
  marks. Convert to CMYK at your printer's profile.

## Questions?

I'm happy to produce custom assets, additional games, or different
formats. Just say the word.

— En Pensent
`;
}

function readme() {
  return `# En Pensent — Curated Assets for Grant Farwell

A selection of the strongest En Pensent visual assets, organized for the
Matcherino partnership.

## Folder structure

| Folder | Contents |
|---|---|
| \`logos/\` | Mark (4 variants) + wordmark (2 variants), SVG + PNG |
| \`hero-and-banners/\` | Hero image (1600×900) + sponsor lockup (1600×400) |
| \`square-cards/\` | Prediction edge card + signature card (1080×1080) |
| \`victory-cards/\` | Immortal Game + Opera Game, front/back, digital + print |
| \`brand-and-icons/\` | Brand spec sheet + 5 feature icons |

## Audit provenance

All figures: full-database audit **${AUDIT.date}**,
${AUDIT.rows.toLocaleString('en-US')} scored positions.
En Pensent ${AUDIT.epAccuracy}% vs Stockfish depth ${AUDIT.sfDepth}
${AUDIT.sfAccuracy}% (+${AUDIT.edgePp}pp).

## Regenerating

\`\`\`bash
# Full build (both kits + PNGs)
node scripts/promo/build.mjs

# This curation step
node scripts/promo/grant-farwell-kit.mjs
\`\`\`

Never edit SVGs by hand — update \`scripts/promo/tokens.mjs\` and rebuild.
`;
}

function indexPage() {
  const sections = [
    {
      label: 'Hero — 1600×900',
      items: ['hero-and-banners/hero-fen-to-vision.svg'],
      max: '100%',
    },
    {
      label: 'Sponsor lockup — 1600×400',
      items: ['hero-and-banners/banner-sponsor-lockup.svg'],
      max: '100%',
    },
    {
      label: 'Square cards — 1080×1080',
      items: ['square-cards/card-prediction-engine.svg', 'square-cards/card-quadrant-signature.svg'],
      max: '48%',
    },
    {
      label: 'Victory cards — 5×7in collectibles',
      items: FEATURED_CARDS.flatMap(id => [
        `victory-cards/victory-card-${id}-front.svg`,
        `victory-cards/victory-card-${id}-back.svg`,
      ]),
      max: '48%',
    },
    {
      label: 'Wordmark — 1200×280',
      items: ['logos/ep-wordmark.svg', 'logos/ep-wordmark-light.svg'],
      max: '100%',
    },
    {
      label: 'Mark — 512×512',
      items: ['logos/ep-logo-mark.svg', 'logos/ep-logo-mark-glow.svg', 'logos/ep-logo-mark-mono-light.svg', 'logos/ep-logo-mark-mono-dark.svg'],
      max: '23%',
    },
    {
      label: 'Icons — 5 × 192',
      items: ['brand-and-icons/icons.svg'],
      max: '100%',
    },
    {
      label: 'Brand specification',
      items: ['brand-and-icons/brand-spec.svg'],
      max: '100%',
    },
  ];

  const html = sections
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
<title>En Pensent — Assets for Grant Farwell</title>
<link rel="stylesheet" href="${GOOGLE_FONTS}">
<style>
  :root { color-scheme: dark; }
  body { background:${C.obsidian}; color:${C.cream}; font-family:Inter,system-ui,sans-serif; margin:0; padding:56px clamp(24px,5vw,72px); }
  h1 { font-family:Cinzel,serif; color:${C.gold}; font-weight:700; letter-spacing:2px; font-size:clamp(28px,3vw,40px); margin:0 0 12px; }
  p.intro { color:${C.muted}; font-size:15px; max-width:78ch; line-height:1.65; margin:0 0 8px; }
  .meta { color:${C.mutedDeep}; font-size:13px; font-family:ui-monospace,Menlo,monospace; margin:0 0 32px; }
  h2 { color:${C.muted}; font-size:12px; letter-spacing:3px; text-transform:uppercase; font-weight:600; margin:52px 0 14px; padding-bottom:8px; border-bottom:1px solid ${C.line}; }
  .row { display:flex; gap:22px; flex-wrap:wrap; align-items:flex-start; }
  figure { margin:0; }
  img { display:block; width:100%; height:auto; border:1px solid ${C.line}; border-radius:10px; background:${C.panel}; }
  figcaption { color:${C.mutedDeep}; font-size:12px; font-family:ui-monospace,Menlo,monospace; margin-top:8px; }
</style>
</head>
<body>
  <h1>En Pensent — Assets for Grant Farwell</h1>
  <p class="intro">Curated visual assets for the Matcherino partnership. Every statistic is from the
  full-database audit of ${AUDIT.date} (${AUDIT.rows.toLocaleString('en-US')} scored positions).
  En Pensent ${AUDIT.epAccuracy}% vs Stockfish depth ${AUDIT.sfDepth} ${AUDIT.sfAccuracy}% (+${AUDIT.edgePp}pp).</p>
  <p class="meta">Generated ${new Date().toISOString().split('T')[0]} · See COVER-LETTER.md for context</p>

${html}
</body>
</html>
`;
}
