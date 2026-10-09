#!/usr/bin/env node
/**
 * Token handout builder + upload — the "physical" NFT per reward code.
 * Combined front+back sheet PNG per code -> public `card-tokens` bucket ->
 * `token_url` stamped into *-with-cards CSVs for Matcherino.
 * Reads creds from .env (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 *   node scripts/promo/reward-card-token-upload.mjs             # build+upload
 *   node scripts/promo/reward-card-token-upload.mjs --no-upload # local only
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { GOOGLE_FONTS } from './tokens.mjs';
import { CARD_SPEC } from './victory-card.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DL = path.join(os.homedir(), 'Downloads');
const CARDS = path.join(DL, 'matcherino-reward-cards');
const CSV_DIR = path.join(DL, 'matcherino-reward-codes');
const BUCKET = 'card-tokens';
const NO_UPLOAD = process.argv.includes('--no-upload');
const CONCURRENCY = 6;

function loadEnv() {
  const env = {};
  try {
    for (const line of fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (m) env[m[1]] = m[2];
    }
  } catch { /* env may come from shell */ }
  return env;
}
const env = { ...loadEnv(), ...process.env };
const SUPA_URL = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_BASE = `${SUPA_URL}/storage/v1/object/public/${BUCKET}`;
const [trimW, trimH] = CARD_SPEC.trim.split('x').map(Number);

const sheetHtml = (f, b) =>
  `<!doctype html><html><head><meta charset="utf-8">
   <link rel="stylesheet" href="${GOOGLE_FONTS}">
   <style>html,body{margin:0;padding:0;background:#0B0E14}
   .row{display:flex}img{width:${trimW}px;height:${trimH}px;display:block}</style>
   </head><body><div class="row">
   <img src="data:image/svg+xml;base64,${f}">
   <img src="data:image/svg+xml;base64,${b}">
   </div></body></html>`;

async function buildSheets(jobs) {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  let done = 0;
  async function worker() {
    const page = await browser.newPage();
    await page.setViewport({ width: trimW * 2, height: trimH });
    while (jobs.length) {
      const j = jobs.shift();
      if (!j) break;
      await page.setContent(sheetHtml(
        fs.readFileSync(j.front).toString('base64'),
        fs.readFileSync(j.back).toString('base64'),
      ), { waitUntil: 'domcontentloaded', timeout: 60000 });
      try { await Promise.race([page.evaluate(() => document.fonts.ready), sleep(8000)]); } catch {}
      await page.screenshot({ path: j.out });
      if (++done % 100 === 0) console.log(`  sheet ${done}/${done + jobs.length}`);
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
}

async function ensureBucket() {
  const res = await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (!/already exists|Duplicate/i.test(body)) throw new Error(`bucket: ${res.status} ${body}`);
  }
}

async function upload(pngPath, key) {
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: fs.readFileSync(pngPath),
  });
  if (!res.ok) throw new Error(`upload ${key}: ${res.status} ${await res.text()}`);
  return `${PUBLIC_BASE}/${key}`;
}

// ── collect jobs ──────────────────────────────────────────────────────
const jobs = [];
for (const tier of ['champion', 'supporter']) {
  const dir = path.join(CARDS, tier);
  if (!fs.existsSync(dir)) { console.warn(`skip ${tier}: no ${dir}`); continue; }
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('-front.svg'))) {
    const code = f.replace('-front.svg', '');
    jobs.push({
      tier, code,
      front: path.join(dir, f),
      back: path.join(dir, `${code}-back.svg`),
      out: path.join(dir, `${code}-token.png`),
    });
  }
}
console.log(`${jobs.length} token sheets to build`);

// ── render sheets (resilient: per-job catch + browser relaunch) ───────
{
  const puppeteer = (await import('puppeteer')).default;
  let browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  let done = 0, failed = 0;
  async function worker() {
    let page = await browser.newPage();
    await page.setViewport({ width: trimW * 2, height: trimH });
    while (jobs.length) {
      const j = jobs.shift();
      if (!j) break;
      try {
        await page.setContent(sheetHtml(
          fs.readFileSync(j.front).toString('base64'),
          fs.readFileSync(j.back).toString('base64'),
        ), { waitUntil: 'domcontentloaded', timeout: 60000 });
        try { await Promise.race([page.evaluate(() => document.fonts.ready), sleep(8000)]); } catch {}
        await page.screenshot({ path: j.out });
      } catch (e) {
        failed++;
        console.warn(`  sheet fail ${j.code}: ${e.message}`);
        if (!browser.connected) {
          browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
        }
        try {
          page = await browser.newPage();
          await page.setViewport({ width: trimW * 2, height: trimH });
        } catch {}
      }
      if (++done % 100 === 0) console.log(`  sheet ${done} (${failed} failed)`);
    }
    try { await page.close(); } catch {}
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close().catch(() => {});
  console.log(`sheets done: ${done - failed}/${done} ok`);
}

// ── upload ────────────────────────────────────────────────────────────
if (!NO_UPLOAD) {
  if (!SUPA_URL || !SERVICE_KEY) {
    console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — skipping upload.');
    process.exit(1);
  }
  await ensureBucket();
  let up = 0, upFail = 0;
  const q = jobs.filter((j) => fs.existsSync(j.out));
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (q.length) {
      const j = q.shift();
      if (!j) break;
      try {
        j.url = await upload(j.out, `${j.tier}/${j.code}-token.png`);
      } catch (e) {
        upFail++;
        console.warn(`  upload fail ${j.code}: ${e.message}`);
      }
      if (++up % 100 === 0) console.log(`  uploaded ${up}`);
    }
  }));
  console.log(`uploads done: ${up - upFail}/${up} ok`);
}

// ── stamp token_url into enriched CSVs ────────────────────────────────
const byCode = new Map(jobs.map((j) => [j.code, j]));
for (const tier of ['champion', 'supporter']) {
  const file = path.join(CSV_DIR, `${tier}s-with-cards.csv`);
  if (!fs.existsSync(file)) { console.warn(`no ${file}`); continue; }
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const header = lines.shift();
  const rows = lines.map((l) => {
    const code = l.split(',')[0];
    const j = byCode.get(code);
    const tokenUrl = j?.url || `${tier}/${code}-token.png`;
    return `${l},${tokenUrl}`;
  });
  fs.writeFileSync(file, `${header},token_url\n${rows.join('\n')}\n`);
  console.log(`${file.split('/').pop()}: stamped ${rows.length} token_urls`);
}
console.log('done.');
