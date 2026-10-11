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
 *   node scripts/promo/matcherino-codes.mjs --sync-existing    # push minted CSV batch
 *   node scripts/promo/matcherino-codes.mjs --sync-referrals   # push EP-REF-* DB codes
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
// Referral codes (EP-REF-*) are minted lazily in the DB by
// get_or_create_referral_code — never minted here, only synced to Shopify.
const REFERRAL = { discount: 20, title: 'En Pensent referral — 20%' };

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
const SYNC_EXISTING = flag('sync-existing');
const SYNC_REFERRALS = flag('sync-referrals');

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

// Dev Dashboard apps don't show an shpat_ token — exchange client creds.
async function ensureShopifyToken() {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return;
  const id = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) return;
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}&grant_type=client_credentials`,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Shopify token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  }
  process.env.SHOPIFY_ADMIN_TOKEN = json.access_token;
  console.log('  obtained admin token via client credentials');
}

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

// GraphQL discount nodes — works under write_discounts (REST price_rules
// requires protected scopes needing merchant re-approval).
async function shopifyGql(query, variables = {}) {
  const res = await fetch(`${SHOPIFY_API}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(', '));
  return json.data;
}

/**
 * Find or create the tier's DiscountCodeNode. The first CSV code becomes the
 * discount's primary code; the rest are bulk-added as redeem codes.
 */
async function ensureDiscountNode(tier, firstCode) {
  const t = tier === 'referral' ? REFERRAL : TIERS[tier];
  const title = t.title || `Matcherino ${tier} — ${t.discount}%`;
  try {
    const data = await shopifyGql(
      `{ codeDiscountNodes(first: 100) { nodes { id codeDiscount { ... on DiscountCodeBasic { title } } } } }`,
    );
    const hit = (data.codeDiscountNodes?.nodes || []).find(
      (n) => n.codeDiscount?.title === title,
    );
    if (hit) return hit.id;
  } catch (e) {
    console.log(`  discount lookup failed (${e.message}) — creating fresh`);
  }
  const created = await shopifyGql(
    `mutation D($input: DiscountCodeBasicInput!) {
       discountCodeBasicCreate(basicCodeDiscount: $input) {
         codeDiscountNode { id }
         userErrors { field message }
       }
     }`,
    {
      input: {
        title,
        code: firstCode,
        startsAt: new Date().toISOString(),
        appliesOncePerCustomer: true,
        context: { all: 'ALL' },
        customerGets: { value: { percentage: t.discount / 100 }, items: { all: true } },
      },
    },
  );
  const errs = created.discountCodeBasicCreate.userErrors;
  if (errs.length) throw new Error(`discountCreate ${tier}: ${JSON.stringify(errs)}`);
  return created.discountCodeBasicCreate.codeDiscountNode.id;
}

async function syncShopify(codesByTier) {
  await ensureShopifyToken();
  if (!process.env.SHOPIFY_ADMIN_TOKEN) {
    console.log('  SHOPIFY_ADMIN_TOKEN/CLIENT creds not set — skipping Shopify sync.');
    return;
  }
  const done = new Set(
    fs.existsSync(SYNC_LOG) ? fs.readFileSync(SYNC_LOG, 'utf8').split('\n').filter(Boolean) : []
  );
  for (const [tier, codes] of Object.entries(codesByTier)) {
    if (!codes.length) continue;
    const discountId = await ensureDiscountNode(tier, codes[0]);
    fs.appendFileSync(SYNC_LOG, codes[0] + '\n'); // primary code lives on the node itself
    done.add(codes[0]);
    const pending = codes.filter((c) => !done.has(c));
    console.log(`  discount "${tier}" → ${discountId} (${pending.length}/${codes.length} codes to sync)`);
    const CHUNK = 100;
    for (let i = 0; i < pending.length; i += CHUNK) {
      const slice = pending.slice(i, i + CHUNK);
      const d = await shopifyGql(
        `mutation B($discountId: ID!, $codes: [DiscountRedeemCodeInput!]!) {
           discountRedeemCodeBulkAdd(discountId: $discountId, codes: $codes) {
             bulkCreation { codesCount }
             userErrors { field message }
           }
         }`,
        { discountId, codes: slice.map((code) => ({ code })) },
      );
      const errs = d.discountRedeemCodeBulkAdd.userErrors;
      if (errs.length) throw new Error(`bulkAdd ${tier}: ${JSON.stringify(errs)}`);
      for (const code of slice) fs.appendFileSync(SYNC_LOG, code + '\n');
      console.log(`    ${tier}: ${Math.min(i + CHUNK, pending.length)}/${pending.length}`);
      await sleep(300); // GraphQL cost limit breathing room
    }
    console.log(`  ${tier}: ${codes.length} discount codes synced`);
  }
}

// ── main ──────────────────────────────────────────────────────────────

// --sync-referrals: push DB-minted EP-REF-* codes to a Shopify discount
// node so the friend's 20% off works at checkout. Rerun-safe — SYNC_LOG
// dedupes codes already pushed. Referral codes are minted continuously,
// so run this periodically (or whenever a referral redemption starts).
if (SYNC_REFERRALS) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from('reward_codes')
    .select('code')
    .eq('tier', 'referral')
    .limit(10000);
  if (error) { console.error('reward_codes query failed:', error.message); process.exit(1); }
  const codes = (data || []).map((r) => r.code);
  console.log(`sync-referrals: ${codes.length} referral codes in DB`);
  if (codes.length) await syncShopify({ referral: codes });
  else console.log('  none minted yet — nothing to do');
  process.exit(0);
}

// --sync-existing: push the already-minted CSV batch to Shopify without
// minting new codes or touching the DB.
if (SYNC_EXISTING) {
  const readCodes = (file) =>
    fs.readFileSync(path.join(OUT_DIR, file), 'utf8')
      .split('\n')
      .map((l) => l.split(',')[0].trim())
      .filter((c) => c.startsWith('EP-'));
  const existing = {
    champion: readCodes('champions.csv'),
    supporter: readCodes('supporters.csv'),
  };
  console.log(`sync-existing: ${existing.champion.length} champions + ${existing.supporter.length} supporters`);
  await syncShopify(existing);
  process.exit(0);
}

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
