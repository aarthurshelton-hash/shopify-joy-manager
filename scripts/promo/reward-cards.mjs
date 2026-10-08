#!/usr/bin/env node
/**
 * Reward card art for the Matcherino prize drop.
 *
 *   champion  → The Immortal Game in the "roman" palette   (edition of 100)
 *   supporter → The Evergreen Game in the "japanese" palette (edition of 1000)
 *
 * Front + back, SVG and PNG, into public/card-assets/ so the /redeem
 * page and the print kit can reference them at stable URLs.
 *
 *   node scripts/promo/reward-cards.mjs            # SVG + PNG
 *   node scripts/promo/reward-cards.mjs --no-png   # SVG only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { simulateGame } from '../../farm/dist/lib/chess/gameSimulator.js';
import { extractEnhancedColorFlowSignature } from '../../farm/dist/lib/chess/colorFlowAnalysis/enhancedSignatureExtractor.js';
import { renderCard, CARD_SPEC } from './victory-card.mjs';
import { GOOGLE_FONTS } from './tokens.mjs';
import { GAMES, EVERGREEN } from './games.mjs';

// CJS module — named import via createRequire for reliability.
const { setActivePalette } = require('../../farm/dist/pieceColors.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', '..', 'public', 'card-assets');
const SKIP_PNG = process.argv.includes('--no-png');

const CARDS = [
  { key: 'champion', palette: 'roman', game: { ...GAMES.find(g => g.id === 'immortal1851'), tier: 'champion', edition: { number: 1, of: 100 } } },
  { key: 'supporter', palette: 'japanese', game: EVERGREEN },
];

fs.mkdirSync(OUT, { recursive: true });
const written = [];

for (const { key, palette, game } of CARDS) {
  setActivePalette(palette);
  const sim = simulateGame(game.pgn);
  const sig = extractEnhancedColorFlowSignature(sim);
  if (!sim.totalMoves || !sig.enhancedProfile) throw new Error(`${game.id}: engine produced no output`);

  for (const side of ['front', 'back']) {
    const name = `reward-card-${key}-${side}`;
    const svg = renderCard({ game, sim, sig, side });
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    written.push(`${name}.svg`);
  }
  console.log(`${key.padEnd(10)} ${game.title} · ${palette} · ${sig.fingerprint}`);
}

if (SKIP_PNG) {
  console.log('\n--no-png: SVGs only.');
} else {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.log('\npuppeteer unavailable — SVGs written, skipping PNG.');
    process.exit(0);
  }
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  for (const f of written.filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(OUT, f), 'utf8');
    const page = await browser.newPage();
    await page.setViewport({ width: CARD_SPEC.trim.split('x').map(Number)[0], height: CARD_SPEC.trim.split('x').map(Number)[1] });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
       <link rel="stylesheet" href="${GOOGLE_FONTS}">
       <style>html,body{margin:0;padding:0}svg{display:block}</style>
       </head><body>${svg}</body></html>`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    // Font stylesheet may hang offline — cap the wait.
    try {
      await Promise.race([
        page.evaluate(() => document.fonts.ready),
        sleep(15000),
      ]);
    } catch {}
    await page.screenshot({ path: path.join(OUT, f.replace(/\.svg$/, '.png')) });
    await page.close();
    written.push(f.replace(/\.svg$/, '.png'));
    console.log(`  rendered ${f.replace(/\.svg$/, '.png')}`);
  }
  await browser.close();
}

console.log(`\n${written.length} files → ${OUT}`);
