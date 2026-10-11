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
const DRY_RUN = process.argv.includes('--dry-run');

let TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

/**
 * Dev Dashboard apps don't show an shpat_ token — obtain one via the
 * client-credentials grant (app must be installed on the store and the
 * scopes must be in a released version).
 */
async function ensureToken() {
  if (TOKEN) return;
  const id = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      'Set SHOPIFY_ADMIN_TOKEN, or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET ' +
      '(Dev Dashboard → app → Settings → Credentials).',
    );
  }
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}&grant_type=client_credentials`,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  }
  TOKEN = json.access_token;
  console.log('Obtained admin token via client-credentials grant');
}

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

const specSig = (v) =>
  v.optionValues.map((o) => `${o.optionName}=${o.name}`).sort().join('|');
const variantSig = (selOpts) =>
  selOpts.map((o) => `${o.name}=${o.value}`).sort().join('|');

/** Create the product shell with declared option values; returns product id. */
async function createProduct(title, options, variantSpecs) {
  const optionValues = {};
  for (const v of variantSpecs) {
    for (const ov of v.optionValues) {
      (optionValues[ov.optionName] ??= new Set()).add(ov.name);
    }
  }
  const created = await admin(
    `mutation P($input: ProductCreateInput!) {
       productCreate(product: $input) {
         product { id }
         userErrors { field message }
       }
     }`,
    {
      input: {
        title,
        productOptions: options.map((name) => ({
          name,
          values: [...(optionValues[name] ?? ['Default'])].map((n) => ({ name: n })),
        })),
        status: 'ACTIVE',
        tags: ['ep-addon'],
      },
    },
  );
  const err = created.productCreate.userErrors;
  if (err.length) throw new Error(`productCreate ${title}: ${JSON.stringify(err)}`);
  return created.productCreate.product.id;
}

/** Publish a product to every sales channel so Storefront API can see it. */
async function publishProduct(productId) {
  const { publications } = await admin(`{ publications(first: 25) { nodes { id name } } }`);
  for (const pub of publications.nodes) {
    await admin(
      `mutation Pub($id: ID!, $pub: [PublicationInput!]!) {
         publishablePublish(id: $id, input: $pub) {
           userErrors { field message }
         }
       }`,
      { id: productId, pub: [{ publicationId: pub.id }] },
    );
  }
  console.log(`  published ${productId} to ${publications.nodes.length} channel(s)`);
}

/** Diff spec vs existing variants; bulk-create missing; return all variants. */
async function ensureProductVariants(productId, variantSpecs) {
  const existing = await admin(
    `{ product(id: "${productId}") { variants(first: 250) { edges { node { id selectedOptions { name value } } } } } }`,
  );
  const existingVariants = existing.product.variants.edges.map((e) => e.node);
  const existingSigs = new Set(existingVariants.map((v) => variantSig(v.selectedOptions)));

  const missing = variantSpecs.filter((v) => !existingSigs.has(specSig(v)));
  if (missing.length === 0) return existingVariants;

  const vc = await admin(
    `mutation V($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
       productVariantsBulkCreate(productId: $productId, variants: $variants) {
         productVariants { id title selectedOptions { name value } }
         userErrors { field message }
       }
     }`,
    {
      productId,
      variants: missing.map((v) => ({
        price: v.price.toFixed(2),
        optionValues: v.optionValues,
        inventoryPolicy: 'CONTINUE', // digital fulfillment — never out of stock
        inventoryItem: { tracked: false },
      })),
    },
  );
  const verr = vc.productVariantsBulkCreate.userErrors;
  if (verr.length) throw new Error(`variants for ${productId}: ${JSON.stringify(verr)}`);
  return [...existingVariants, ...vc.productVariantsBulkCreate.productVariants];
}

async function main() {
  if (!TOKEN && !process.env.SHOPIFY_CLIENT_ID && !DRY_RUN) {
    console.error('Set SHOPIFY_ADMIN_TOKEN or SHOPIFY_CLIENT_ID+SHOPIFY_CLIENT_SECRET. --dry-run to preview.');
    process.exit(1);
  }
  if (!DRY_RUN) await ensureToken();

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
  const frameProductId =
    (await existingProductId('Print Frame Add-On')) ||
    (await createProduct('Print Frame Add-On', ['Size', 'Style'], frameVariants));
  await publishProduct(frameProductId);
  const frameVariantNodes = await ensureProductVariants(frameProductId, frameVariants);
  for (const v of frameVariantNodes) {
    const size = v.selectedOptions.find((o) => o.name === 'Size')?.value;
    const styleName = v.selectedOptions.find((o) => o.name === 'Style')?.value;
    const style = FRAME_STYLES.find((s) => s.name === styleName);
    if (size && style) frameMap[`frame|${normSize(size)}|${style.id}`] = v.id;
  }
  console.log(`Frame product: ${Object.keys(frameMap).length}/${frameVariants.length} variants mapped`);

  // ── 2. Info card product ──────────────────────────────────────────
  const infoCardSpecs = [
    { optionValues: [{ optionName: 'Format', name: 'Standard' }], price: INFO_CARD_PRICE },
  ];
  const infoCardProductId =
    (await existingProductId('Vision Info Card Add-On')) ||
    (await createProduct('Vision Info Card Add-On', ['Format'], infoCardSpecs));
  await publishProduct(infoCardProductId);
  const infoCardNodes = await ensureProductVariants(infoCardProductId, infoCardSpecs);
  const infoCardVariantId = infoCardNodes[0]?.id || '';
  console.log('Info card variant:', infoCardVariantId);

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
  const markerRe = /\/\/ <generated>[\s\S]*?\/\/ <\/generated>/;
  if (!markerRe.test(src)) throw new Error('addonVariants.ts missing // <generated> markers');
  const next = src.replace(markerRe, `// <generated>\n${generated}\n// </generated>`);
  fs.writeFileSync(target, next);
  console.log(`\nPatched addonVariants.ts: ${Object.keys(frameMap).length} frame variants + info card.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
