#!/usr/bin/env node
/**
 * check-fulfillment.mjs — diagnostic: for every Shopify product, print
 * vendor, product type, status, and each variant's fulfillmentService.
 *
 * Tells you whether add-on products (frame, info card) are Printify-fulfilled
 * or manual — so you know who ships them when an order lands.
 *
 * Usage: node scripts/promo/check-fulfillment.mjs
 * Env:   SHOPIFY_STORE_DOMAIN (+ SHOPIFY_ADMIN_TOKEN, or CLIENT_ID/SECRET)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

const SHOP = process.env.SHOPIFY_STORE_DOMAIN || 'printify-shop-manager-fs4kw.myshopify.com';

let token = process.env.SHOPIFY_ADMIN_TOKEN;
if (!token) {
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const j = await r.json();
  token = j.access_token;
  if (!token) { console.error('token exchange failed:', j); process.exit(1); }
}

const FIX_SHIPPING = process.argv.includes('--fix-shipping');

const url = `https://${SHOP}/admin/api/2025-07/products.json?limit=50&fields=id,title,vendor,product_type,status,variants`;
const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
if (!r.ok) { console.error(`HTTP ${r.status}:`, await r.text()); process.exit(1); }
const { products } = await r.json();

const noShip = [];
for (const p of products) {
  const services = [...new Set(p.variants.map((v) => v.fulfillment_service))];
  console.log(`${p.title}`);
  console.log(`  vendor=${p.vendor} | type=${p.product_type || '(none)'} | status=${p.status} | fulfillment_service=${services.join(', ')}`);
  for (const v of p.variants.slice(0, 4)) {
    console.log(`    · ${v.title} | sku=${v.sku || '-'} | fulfill=${v.fulfillment_service} | inventory_mgmt=${v.inventory_management || 'null'} | ships=${v.requires_shipping}`);
  }
  if (p.variants.length > 4) console.log(`    … ${p.variants.length - 4} more variants`);
  for (const v of p.variants) {
    if (!v.requires_shipping) noShip.push({ id: v.id, title: `${p.title} / ${v.title}` });
  }
}

if (noShip.length) {
  console.log(`\n${noShip.length} variant(s) with requires_shipping=false:`);
  for (const v of noShip) console.log(`  ${v.id}  ${v.title}`);

  if (FIX_SHIPPING) {
    console.log('\nFixing…');
    for (const v of noShip) {
      const res = await fetch(`https://${SHOP}/admin/api/2025-07/variants/${v.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ variant: { id: v.id, requires_shipping: true } }),
      });
      console.log(`  ${v.id} ${v.title}: ${res.ok ? '✓' : `✗ HTTP ${res.status}`}`);
    }
    console.log('Done — rerun without --fix-shipping to verify.');
  } else {
    console.log('\nRerun with --fix-shipping to set requires_shipping=true on all of them.');
  }
} else {
  console.log('\nAll variants require shipping ✓');
}
