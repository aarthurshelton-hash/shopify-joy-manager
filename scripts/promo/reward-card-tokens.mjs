#!/usr/bin/env node
/**
 * Reward tokens — one numbered game card (front + back) per reward code.
 *
 * Reads the minted codes from ~/Downloads/matcherino-reward-codes/*.csv and
 * renders every code its own card in ~/Downloads/matcherino-reward-cards/:
 *
 *   champion  → The Immortal Game, "roman" palette,  edition NNN / 100
 *   supporter → The Evergreen Game, "japanese" palette, edition NNNN / 1000
 *
 * The back's QR encodes that code's redeem_url (scan → signed-in redeem
 * flow), and the code itself is printed under it — each token is a
 * self-contained claim. Enriched CSVs (game_title, edition, game_url,
 * card_front, card_back appended) are written next to the originals as
 * *-with-cards.csv for Matcherino's reward payload.
 *
 *   node scripts/promo/reward-card-tokens.mjs              # SVG + PNG
 *   node scripts/promo/reward-card-tokens.mjs --no-png     # SVG only
 *   node scripts/promo/reward-card-tokens.mjs --in=<dir> --out=<dir>
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { simulateGame } from '../../farm/dist/lib/chess/gameSimulator.js';
import { extractEnhancedColorFlowSignature } from '../../farm/dist/lib/chess/colorFlowAnalysis/enhancedSignatureExtractor.js';
import { renderCard, CARD_SPEC } from './victory-card.mjs';
import { GOOGLE_FONTS } from './tokens.mjs';
import { GAMES, EVERGREEN } from './games.mjs';

const { setActivePalette } = require('../../farm/dist/pieceColors.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const argVal = (flag, fallback) => {
  const a = args.find((x) => x.startsWith(flag + '='));
  return a ? a.slice(flag.length + 1) : fallback;
};

const DL = path.join(os.homedir(), 'Downloads');
const IN_DIR = argVal('--in', path.join(DL, 'matcherino-reward-codes'));
const OUT = argVal('--out', path.join(DL, 'matcherino-reward-cards'));
const SKIP_PNG = args.includes('--no-png');
const PNG_CONCURRENCY = 8;

// ── canonical game URL (mirrors gameCanonical.ts) ───────────────────
function extractMovesFromPgn(pgn) {
  let c = pgn.replace(/\[[^\]]*\]/g, '');
  c = c.replace(/\{[^}]*\}/g, '');
  c = c.replace(/\([^)]*\)/g, '');
  c = c.replace(/\d+\.\s*/g, '');
  c = c.replace(/1-0|0-1|1\/2-1\/2|\*/g, '');
  return c.replace(/\s+/g, ' ').trim();
}
function compactHash(str) {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = ((h1 << 5) - h1 + ch) | 0;
    h2 = ((h2 << 7) + h2 + ch) | 0;
  }
  return (Math.abs(h1) ^ Math.abs(h2)).toString(36);
}
const gameUrl = (pgn, palette) =>
  `https://enpensent.com/g/${compactHash(extractMovesFromPgn(pgn))}?p=${palette}`;
// ────────────────────────────────────────────────────────────────────

function readCodes(file) {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const header = lines.shift().split(',');
  const iCode = header.indexOf('code');
  const iUrl = header.indexOf('redeem_url');
  if (iCode < 0 || iUrl < 0) throw new Error(`${file}: expected code,redeem_url columns`);
  return lines.map((l) => {
    const cols = l.split(',');
    return { code: cols[iCode], redeem_url: cols[iUrl], raw: l };
  });
}

const TIERS = [
  {
    key: 'champion',
    csv: 'champions.csv',
    palette: 'roman',
    game: { ...GAMES.find((g) => g.id === 'immortal1851'), tier: 'champion' },
  },
  {
    key: 'supporter',
    csv: 'supporters.csv',
    palette: 'japanese',
    game: EVERGREEN,
  },
];

const pngQueue = []; // {svgPath, pngPath}
let rendered = 0;

for (const tier of TIERS) {
  const csvPath = path.join(IN_DIR, tier.csv);
  if (!fs.existsSync(csvPath)) { console.warn(`skip ${tier.key}: no ${csvPath}`); continue; }
  const codes = readCodes(csvPath);
  const total = codes.length;

  setActivePalette(tier.palette);
  const sim = simulateGame(tier.game.pgn);
  const sig = extractEnhancedColorFlowSignature(sim);
  if (!sim.totalMoves || !sig.enhancedProfile) throw new Error(`${tier.game.id}: engine produced no output`);

  const dir = path.join(OUT, tier.key);
  fs.mkdirSync(dir, { recursive: true });
  const url = gameUrl(tier.game.pgn, tier.palette);

  const rows = ['code,redeem_url,tier,discount_percent,premium_days,game_title,edition,game_url,card_front,card_back'];
  for (let i = 0; i < codes.length; i++) {
    const { code, redeem_url } = codes[i];
    const game = {
      ...tier.game,
      edition: { number: i + 1, of: total },
      claimUrl: redeem_url,
      claimCode: code,
    };
    const frontFile = `${code}-front.svg`;
    const backFile = `${code}-back.svg`;
    fs.writeFileSync(path.join(dir, frontFile), renderCard({ game, sim, sig, side: 'front' }));
    fs.writeFileSync(path.join(dir, backFile), renderCard({ game, sim, sig, side: 'back' }));
    if (!SKIP_PNG) {
      pngQueue.push({ svg: path.join(dir, frontFile), png: path.join(dir, frontFile.replace('.svg', '.png')) });
      pngQueue.push({ svg: path.join(dir, backFile), png: path.join(dir, backFile.replace('.svg', '.png')) });
    }
    rows.push(`${code},${redeem_url},${tier.key},${tier.key === 'champion' ? 40 : 20},${tier.key === 'champion' ? 365 : 31},${tier.game.title.replace(',', '')},${i + 1}-of-${total},${url},${tier.key}/${frontFile},${tier.key}/${backFile}`);
    if (++rendered % 100 === 0) console.log(`  ${tier.key}: ${rendered} tokens`);
  }
  fs.writeFileSync(csvPath.replace('.csv', '-with-cards.csv'), rows.join('\n') + '\n');
  console.log(`${tier.key}: ${total} tokens → ${dir} · enriched CSV ${path.basename(csvPath.replace('.csv', '-with-cards.csv'))}`);
}

if (SKIP_PNG || !pngQueue.length) {
  console.log(`\n${rendered} tokens, ${SKIP_PNG ? 'SVGs only' : 'no PNG queue'}. → ${OUT}`);
  process.exit(0);
}

// PNG pass — one headless browser, fixed page pool.
let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.log('\npuppeteer unavailable — SVGs written, skipping PNG.');
  process.exit(0);
}

const [trimW, trimH] = CARD_SPEC.trim.split('x').map(Number);
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
let done = 0;

async function worker() {
  const page = await browser.newPage();
  await page.setViewport({ width: trimW, height: trimH });
  while (pngQueue.length) {
    const job = pngQueue.shift();
    if (!job) break;
    const svg = fs.readFileSync(job.svg, 'utf8');
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
       <link rel="stylesheet" href="${GOOGLE_FONTS}">
       <style>html,body{margin:0;padding:0}svg{display:block}</style>
       </head><body>${svg}</body></html>`,
      { waitUntil: 'domcontentloaded', timeout: 60000 },
    );
    try {
      await Promise.race([page.evaluate(() => document.fonts.ready), sleep(8000)]);
    } catch { /* font wait timed out — render anyway */ }
    await page.screenshot({ path: job.png });
    if (++done % 100 === 0) console.log(`  png ${done}/${done + pngQueue.length}`);
  }
  await page.close();
}

await Promise.all(Array.from({ length: PNG_CONCURRENCY }, worker));
await browser.close();
console.log(`\n${rendered} tokens (${rendered * 2} sides) → ${OUT}`);
