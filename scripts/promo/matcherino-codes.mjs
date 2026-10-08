#!/usr/bin/env node
/**
 * En Pensent × Matcherino — reward code batch.
 *
 * Mints codes, writes upload-ready CSVs, optionally seeds the
 * reward_codes table, and optionally syncs Shopify discount codes.
 *
 *   node scripts/promo/matcherino-codes.mjs                    # CSVs + DB insert
 *   node scripts/promo/matcherino-codes.mjs --dry-run          # CSVs only
 *   node scripts/promo/matcherino-codes.mjs --shopify          # + Shopify sync
 *   node scripts/promo/matcherino-codes.mjs --champions 100 --supporters 1000
 *
 * Tiers:
 *   champion   EP-CHAMP-XXXX-XXXX   40% off + 365 days premium
 *   supporter  EP-SUPP-XXXX-XXXX    20% off +  31 days premium
 *
 * Env (.env):
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — DB insert (skipped if absent)
 *   SHOPIFY_ADMIN_TOKEN — only used with --shopify
 *
 * Output: ~/Downloads/matcherino-reward-codes/
 *   champions.csv, supporters.csv, all-codes.csv, shopify-created.txt, README.md
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

// ── config ────────────────────────────────────────────────────────────

const TIERS = {
  champion: { prefix: 'EP-CHAMP', discount: 40, premiumDays: 365 },
  supporter: { prefix: 'EP-SUPP', discount: 20, premiumDays: 31 },
};

const SHOPIFY_DOMAIN = 'printify-shop-manager-fs4kw.myshopify.com';
const SHOPIFY_API = `https://${SHOPIFY_DOMAIN}/admin/api/2025-07`;
const REDEEM_BASE = 'https://enpensent.com/redeem?code=';
const OUT_DIR = path.join(os.homedir(), 'Downloads', 'matcherino-reward-codes');
const SYNC_LOG = path.join(OUT_DIR, 'shopify-created.txt');

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const num = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : d;
};

const COUNTS = { champion: num('champions', 100), supporter: num('supporters', 1000) };
const BATCH = args[args.indexOf('--batch') + 1] || `matcherino-${new Date().toISOString().slice(0, 10)}`;
const DRY_RUN = flag('dry-run');
const DO_SHOPIFY = flag('shopify') && !DRY_RUN;

// ── code generation ───────────────────────────────────────────────────

// Unambiguous alphabet: no 0/O, 1/I/L — survives handwriting + print.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function mint(prefix) {
  let body = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) body += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}

function mintBatch(tier, count, seen) {
  const out = [];
  while (out.length < count) {
    const code = mint(TIERS[tier].prefix);
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

// ── CSV ───────────────────────────────────────────────────────────────

function csv(codes, tier) {
  const t = TIERS[tier];
  const rows = codes.map((c) =>
    [c, REDEEM_BASE + c, tier, t.discount, t.premiumDays].join(',')
  );
  return ['code,redeem_url,tier,discount_percent,premium_days', ...rows, ''].join('\n');
}

// ── Supabase ──────────────────────────────────────────────────────────

async function insertCodes(rows) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('  SUPABASE_SERVICE_ROLE_KEY not set — skipping DB insert.');
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await sb.from('reward_codes').insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`reward_codes insert failed: ${error.message}`);
    console.log(`  inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
}

// ── Shopify ───────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shopify(method, ep, body) {
  const res = await fetch(`${SHOPIFY_API}${ep}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429) {
    const wait = 2000;
    console.log(`    rate limited — waiting ${wait}ms`);
    await sleep(wait);
    return shopify(method, ep, body);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Shopify ${method} ${ep} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function ensurePriceRule(tier) {
  const t = TIERS[tier];
  const title = `Matcherino ${tier} — ${t.discount}%`;
  const { price_rules } = await shopify('GET', '/price_rules.json?limit=250');
  const existing = (price_rules || []).find((r) => r.title === title);
  if (existing) return existing.id;
  // Optional: SHOPIFY_ENTITLED_PRODUCT_IDS="123,456" scopes the discount to
  // those products instead of the whole cart (prevents discounting merch).
  const entitledIds = (process.env.SHOPIFY_ENTITLED_PRODUCT_IDS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const { price_rule } = await shopify('POST', '/price_rules.json', {
    price_rule: {
      title,
      target_type: 'line_item',
      target_selection: entitledIds.length ? 'entitled' : 'all',
      ...(entitledIds.length ? { entitled_product_ids: entitledIds } : {}),
      allocation_method: 'across',
      value_type: 'percentage',
      value: `-${t.discount}`,
      customer_selection: 'all',
      once_per_customer: true,
      starts_at: new Date().toISOString(),
    },
  });
  return price_rule.id;
}

async function syncShopify(codesByTier) {
  if (!process.env.SHOPIFY_ADMIN_TOKEN) {
    console.log('  SHOPIFY_ADMIN_TOKEN not set — skipping Shopify sync.');
    return;
  }
  const done = new Set(
    fs.existsSync(SYNC_LOG) ? fs.readFileSync(SYNC_LOG, 'utf8').split('\n').filter(Boolean) : []
  );
  for (const [tier, codes] of Object.entries(codesByTier)) {
    const ruleId = await ensurePriceRule(tier);
    console.log(`  price_rule "${tier}" → ${ruleId} (${codes.length} codes, resuming after ${done.size} synced)`);
    for (const code of codes) {
      if (done.has(code)) continue;
      await shopify('POST', `/price_rules/${ruleId}/discount_codes.json`, {
        discount_code: { code },
      });
      fs.appendFileSync(SYNC_LOG, code + '\n');
      await sleep(450); // stay under the 2 req/s admin bucket
    }
    console.log(`  ${tier}: ${codes.length} discount codes synced`);
  }
}

// ── main ──────────────────────────────────────────────────────────────

const seen = new Set();
const byTier = {};
for (const tier of Object.keys(TIERS)) {
  byTier[tier] = mintBatch(tier, COUNTS[tier], seen);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'champions.csv'), csv(byTier.champion, 'champion'));
fs.writeFileSync(path.join(OUT_DIR, 'supporters.csv'), csv(byTier.supporter, 'supporter'));
fs.writeFileSync(
  path.join(OUT_DIR, 'all-codes.csv'),
  csv([...byTier.champion], 'champion').replace(/\n$/, '') +
    '\n' +
    csv(byTier.supporter, 'supporter').split('\n').slice(1).join('\n')
);

console.log(`Batch ${BATCH}`);
console.log(`  ${byTier.champion.length} champions, ${byTier.supporter.length} supporters`);
console.log(`  CSVs → ${OUT_DIR}`);

if (!DRY_RUN) {
  const rows = Object.entries(byTier).flatMap(([tier, codes]) =>
    codes.map((code) => ({
      code,
      tier,
      discount_percent: TIERS[tier].discount,
      premium_days: TIERS[tier].premiumDays,
      batch: BATCH,
    }))
  );
  await insertCodes(rows);
  if (DO_SHOPIFY) await syncShopify(byTier);
}

fs.writeFileSync(
  path.join(OUT_DIR, 'README.md'),
  `# En Pensent × Matcherino reward codes — batch ${BATCH}

- champions.csv — ${byTier.champion.length} codes: 40% off + 1 year premium
- supporters.csv — ${byTier.supporter.length} codes: 20% off + 1 month premium
- all-codes.csv — both tiers, one file

Redeem at ${REDEEM_BASE}<code> — the player signs in (or creates a free
account), premium is granted for the printed duration, and the same code
is attached to their next shop checkout as a Shopify discount.
Shopify discounts sync with --shopify + SHOPIFY_ADMIN_TOKEN.
`
);

console.log(DRY_RUN ? '\nDry run — DB untouched.' : '\nDone.');
