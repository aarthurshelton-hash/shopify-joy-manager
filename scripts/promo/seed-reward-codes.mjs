#!/usr/bin/env node
/**
 * seed-reward-codes.mjs — insert minted Matcherino reward codes into
 * Supabase `reward_codes` so /redeem recognizes them.
 *
 * Codes are minted to CSVs (champions.csv, supporters.csv) and synced to
 * Shopify separately — this script is the missing third step when a batch
 * was minted with --dry-run or the service key wasn't loaded.
 *
 * Idempotent: upserts on code; reruns are safe.
 *
 * Usage:
 *   node scripts/promo/seed-reward-codes.mjs [--dir ~/Downloads/matcherino-reward-codes] [--batch matcherino-2026-10-06]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL in env (.env / .env.local).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const DIR = arg('dir', path.join(os.homedir(), 'Downloads', 'matcherino-reward-codes')).replace(/^~/, os.homedir());
const BATCH = arg('batch', null); // default: read from README.md

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env/.env.local');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

let batch = BATCH;
if (!batch) {
  const readme = fs.existsSync(path.join(DIR, 'README.md')) ? fs.readFileSync(path.join(DIR, 'README.md'), 'utf8') : '';
  batch = readme.match(/batch\s+(\S+)/)?.[1] ?? `matcherino-${new Date().toISOString().slice(0, 10)}`;
}

function parseCsv(file) {
  const fp = path.join(DIR, file);
  if (!fs.existsSync(fp)) return [];
  return fs
    .readFileSync(fp, 'utf8')
    .split('\n')
    .slice(1)
    .map((l) => l.split(','))
    .filter((c) => c[0]?.startsWith('EP-'))
    .map((c) => ({
      code: c[0].trim(),
      tier: c[2].trim(),
      discount_percent: Number(c[3]),
      premium_days: Number(c[4]),
      batch,
    }));
}

const rows = [...parseCsv('champions.csv'), ...parseCsv('supporters.csv')];
if (!rows.length) {
  console.error(`No codes found in ${DIR} (expected champions.csv / supporters.csv)`);
  process.exit(1);
}
console.log(`Seeding ${rows.length} codes → batch "${batch}"`);

const CHUNK = 500;
for (let i = 0; i < rows.length; i += CHUNK) {
  const slice = rows.slice(i, i + CHUNK);
  const { error } = await sb.from('reward_codes').upsert(slice, { onConflict: 'code' });
  if (error) {
    console.error('INSERT FAILED:', error.message);
    process.exit(1);
  }
  console.log(`  ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
}

const { count } = await sb.from('reward_codes').select('*', { count: 'estimated', head: true });
console.log(`reward_codes total: ${count}`);
