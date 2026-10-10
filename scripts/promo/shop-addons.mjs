#!/usr/bin/env node
/**
 * shop-addons.mjs — create the Shopify products/variants that power
 * in-app add-ons (frames, info card) plus automatic bulk discounts,
 * then regenerate src/lib/shop/addonVariants.ts with the real variant GIDs.
 *
 * Why: the Storefront API cartCreate cannot override line prices — add-on
 * prices must come from real Shopify variants added as extra line items.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/promo/shop-addons.mjs
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/promo/shop-addons.mjs --dry-run
 *
 * Idempotent: skips products/discounts that already exist by title.
 */
import fs from 'node:fs';
import path from 'node:path';

const SHOPIFY_DOMAIN = 'printify-shop-manager-fs4kw.myshopify.com';
const ADMIN_API = `https://${SHOPIFY_DOMAIN}/admin/api/2025-07/graphql.json`;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

// ── frame pricing mirror (kept in sync with src/lib/shop/framePricing.ts) ──
const SIZES = ['8×10"', '11×14"', '12×16"', '16×20"', '18×24"', '24×36"'];
const PRINTIFY_BASE_COSTS = { '8x10': 30, '11x14': 38, '12x16': 42, '16x20': 50, '18x24': 62, '24x36': 85 };
const FRAME_STYLES = [
  { id: 'natural', name: 'Natural Wood', premiumMultiplier: 1.0 },
  { id: 'black', name: 'Classic Black', premiumMultiplier: 1.0 },
  { id: 'white', name: 'Gallery White', premiumMultiplier: 1.0 },
  { id: 'walnut', name: 'Rich Walnut', premiumMultiplier: 1.15 },
  { id: 'gold', name: 'Champagne Gold', premiumMultiplier: 1.25 },
];
const MARGIN = 1.20;
const INFO_CARD_PRICE = 9.99;

// Bulk discount tiers (mirror of src/lib/discounts.ts)
const BULK_TIERS = [
  { qty: 2, pct: 10 }, { qty: 3, pct: 15 }, { qty: 4, pct: 20 },
  { qty: 5, pct: 25 }, { qty: 8, pct: 30 }, { qty: 10, pct: 35 },
];

const normSize = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/["']/g, '');
const framePrice = (size, styleId) => {
  const base = PRINTIFY_BASE_COSTS[normSize(size)] ?? 45;
  const style = FRAME_STYLES.find((s) => s.id === styleId);
  return Math.ceil(base * (style?.premiumMultiplier ?? 1) * MARGIN) - 0.01;
};

async function admin(query, variables = {}) {
  const res = await fetch(ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(', '));
  return json.data;
}

async function existingProductId(title) {
  const data = await admin(`{ products(first: 100) { edges { node { id title } } } }`);
  return data.products.edges.find((e) => e.node.title === title)?.node.id || null;
}

async function createProductWithVariants(title, options, variantSpecs) {
  // 1. create product skeleton with options
  const created = await admin(
    `mutation P($input: ProductInput!) {
       productCreate(product: $input) {
         product { id options { id name values { name } } }
         userErrors { field message }
       }
     }`,
    {
      input: {
        title,
        productOptions: options.map((name) => ({ name, values: [] })),
        status: 'ACTIVE',
        tags: ['ep-addon'],
      },
    },
  );
  const err = created.productCreate.userErrors;
  if (err.length) throw new Error(`productCreate ${title}: ${JSON.stringify(err)}`);
  const product = created.productCreate.product;

  // 2. bulk-create variants
  const vc = await admin(
    `mutation V($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
       productVariantsBulkCreate(productId: $productId, variants: $variants) {
         productVariants { id title selectedOptions { name value } }
         userErrors { field message }
       }
     }`,
    {
      productId: product.id,
      variants: variantSpecs.map((v) => ({
        price: v.price.toFixed(2),
        optionValues: v.optionValues,
        inventoryPolicy: 'CONTINUE', // digital fulfillment — never out of stock
        inventoryItem: { tracked: false },
      })),
    },
  );
  const verr = vc.productVariantsBulkCreate.userErrors;
  if (verr.length) throw new Error(`variants ${title}: ${JSON.stringify(verr)}`);
  return vc.productVariantsBulkCreate.productVariants;
}

async function main() {
  if (!TOKEN && !DRY_RUN) {
    console.error('SHOPIFY_ADMIN_TOKEN required (Admin API). --dry-run to preview.');
    process.exit(1);
  }

  const frameVariants = SIZES.flatMap((size) =>
    FRAME_STYLES.map((style) => ({
      optionValues: [
        { optionName: 'Size', name: size },
        { optionName: 'Style', name: style.name },
      ],
      price: framePrice(size, style.id),
      key: `frame|${normSize(size)}|${style.id}`,
      label: `${size} ${style.name}`,
    })),
  );

  console.log(`Plan: ${frameVariants.length} frame variants + 1 info card + ${BULK_TIERS.length} discounts`);
  frameVariants.forEach((v) => console.log(`  ${v.label} → $${v.price}`));

  if (DRY_RUN) { console.log('(dry run — no changes)'); return; }

  // ── 1. Frame product ──────────────────────────────────────────────
  let frameMap = {};
  const existingFrame = await existingProductId('Print Frame Add-On');
  if (existingFrame) {
    console.log('Frame product exists — fetching variants');
    const d = await admin(
      `{ product(id: "${existingFrame}") { variants(first: 100) { edges { node { id selectedOptions { name value } } } } } }`,
    );
    for (const e of d.product.variants.edges) {
      const size = e.node.selectedOptions.find((o) => o.name === 'Size')?.value;
      const styleName = e.node.selectedOptions.find((o) => o.name === 'Style')?.value;
      const style = FRAME_STYLES.find((s) => s.name === styleName);
      if (size && style) frameMap[`frame|${normSize(size)}|${style.id}`] = e.node.id;
    }
  } else {
    const created = await createProductWithVariants(
      'Print Frame Add-On',
      ['Size', 'Style'],
      frameVariants,
    );
    created.forEach((v, i) => { frameMap[frameVariants[i].key] = v.id; });
    console.log(`Frame product created: ${created.length} variants`);
  }

  // ── 2. Info card product ──────────────────────────────────────────
  let infoCardVariantId = '';
  const existingCard = await existingProductId('Vision Info Card Add-On');
  if (existingCard) {
    const d = await admin(
      `{ product(id: "${existingCard}") { variants(first: 1) { edges { node { id } } } } }`,
    );
    infoCardVariantId = d.product.variants.edges[0]?.node.id || '';
    console.log('Info card exists:', infoCardVariantId);
  } else {
    const created = await createProductWithVariants(
      'Vision Info Card Add-On',
      ['Format'],
      [{ optionValues: [{ optionName: 'Format', name: 'Standard' }], price: INFO_CARD_PRICE }],
    );
    infoCardVariantId = created[0]?.id || '';
    console.log('Info card created:', infoCardVariantId);
  }

  // ── 3. Automatic bulk discounts ───────────────────────────────────
  for (const t of BULK_TIERS) {
    const d = await admin(
      `mutation D($input: DiscountAutomaticBasicInput!) {
         discountAutomaticBasicCreate(automaticBasicDiscount: $input) {
           automaticDiscountNode { id }
           userErrors { field message }
         }
       }`,
      {
        input: {
          title: `EP Bulk ${t.pct}% (${t.qty}+ prints)`,
          startsAt: new Date().toISOString(),
          minimumRequirement: { quantity: { greaterThanOrEqualToQuantity: String(t.qty) } },
          customerGets: {
            value: { percentage: t.pct / 100 },
            items: { all: true },
          },
        },
      },
    );
    const errs = d.discountAutomaticBasicCreate.userErrors;
    console.log(`  bulk ${t.pct}% (${t.qty}+):`, errs.length ? `ERR ${JSON.stringify(errs)}` : 'created');
  }

  // ── 4. Patch addonVariants.ts in place (between GENERATED markers) ──
  const target = path.join(process.cwd(), 'src/lib/shop/addonVariants.ts');
  const src = fs.readFileSync(target, 'utf8');
  const generated =
    `export const FRAME_VARIANTS: Record<string, string> = ${JSON.stringify(frameMap, null, 2)};\n\n` +
    `/** Shopify variant GID for the $${INFO_CARD_PRICE} Vision Info Card add-on */\n` +
    `export const INFO_CARD_VARIANT_ID = '${infoCardVariantId}';`;
  const next = src.replace(
    /\/\/ <generated>[\s\S]*?\/\/ <\/generated>/,
    `// <generated>\n${generated}\n// </generated>`,
  );
  if (next === src) throw new Error('addonVariants.ts missing // <generated> markers');
  fs.writeFileSync(target, next);
  console.log(`\nPatched addonVariants.ts: ${Object.keys(frameMap).length} frame variants + info card.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
