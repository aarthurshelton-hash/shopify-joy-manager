/**
 * Maps add-on selections (frame size+style, info card) to real Shopify
 * variant GIDs so they are emitted as separate cart line items and actually
 * charged at checkout.
 *
 * The ADDON_VARIANTS map is populated by `scripts/promo/shop-addons.mjs`,
 * which creates the "Premium Frame" and "Vision Info Card" products via the
 * Admin API and rewrites this file with the real variant IDs. Until that
 * script has run, getAddonLines returns [] and checkout matches the
 * historical (uncharged add-on) behavior.
 */

import type { CartItem } from '@/stores/cartStore';

// <generated>
export const FRAME_VARIANTS: Record<string, string> = {
  "frame|8x10|natural": "gid://shopify/ProductVariant/50592795066530",
  "frame|8x10|black": "gid://shopify/ProductVariant/50592798671010",
  "frame|8x10|white": "gid://shopify/ProductVariant/50592798703778",
  "frame|8x10|walnut": "gid://shopify/ProductVariant/50592798736546",
  "frame|8x10|gold": "gid://shopify/ProductVariant/50592798769314",
  "frame|11x14|natural": "gid://shopify/ProductVariant/50592798802082",
  "frame|11x14|black": "gid://shopify/ProductVariant/50592798834850",
  "frame|11x14|white": "gid://shopify/ProductVariant/50592798867618",
  "frame|11x14|walnut": "gid://shopify/ProductVariant/50592798900386",
  "frame|11x14|gold": "gid://shopify/ProductVariant/50592798933154",
  "frame|12x16|natural": "gid://shopify/ProductVariant/50592798965922",
  "frame|12x16|black": "gid://shopify/ProductVariant/50592798998690",
  "frame|12x16|white": "gid://shopify/ProductVariant/50592799031458",
  "frame|12x16|walnut": "gid://shopify/ProductVariant/50592799064226",
  "frame|12x16|gold": "gid://shopify/ProductVariant/50592799096994",
  "frame|16x20|natural": "gid://shopify/ProductVariant/50592799129762",
  "frame|16x20|black": "gid://shopify/ProductVariant/50592799162530",
  "frame|16x20|white": "gid://shopify/ProductVariant/50592799195298",
  "frame|16x20|walnut": "gid://shopify/ProductVariant/50592799228066",
  "frame|16x20|gold": "gid://shopify/ProductVariant/50592799260834",
  "frame|18x24|natural": "gid://shopify/ProductVariant/50592799293602",
  "frame|18x24|black": "gid://shopify/ProductVariant/50592799326370",
  "frame|18x24|white": "gid://shopify/ProductVariant/50592799359138",
  "frame|18x24|walnut": "gid://shopify/ProductVariant/50592799391906",
  "frame|18x24|gold": "gid://shopify/ProductVariant/50592799424674",
  "frame|24x36|natural": "gid://shopify/ProductVariant/50592799457442",
  "frame|24x36|black": "gid://shopify/ProductVariant/50592799490210",
  "frame|24x36|white": "gid://shopify/ProductVariant/50592799522978",
  "frame|24x36|walnut": "gid://shopify/ProductVariant/50592799555746",
  "frame|24x36|gold": "gid://shopify/ProductVariant/50592799588514"
};

/** Shopify variant GID for the $9.99 Vision Info Card add-on */
export const INFO_CARD_VARIANT_ID = 'gid://shopify/ProductVariant/50592797032610';
// </generated>

function normalizeSizeLabel(size: string): string {
  return size.toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/["']/g, '');
}

export interface AddonLine {
  quantity: number;
  merchandiseId: string;
  attributes?: Array<{ key: string; value: string }>;
}

/**
 * Returns extra cart line items for a CartItem's add-ons, or [] when the
 * add-on products haven't been created in Shopify yet.
 */
export function getAddonLines(item: CartItem): AddonLine[] {
  const data = item.customPrintData;
  if (!data) return [];

  const lines: AddonLine[] = [];

  if (data.frameStyle) {
    // Size is the first selected option on the print variant (e.g. 11×14")
    const size = item.selectedOptions[0]?.value || item.variantTitle;
    const key = `frame|${normalizeSizeLabel(size)}|${data.frameStyle}`;
    const variantId = FRAME_VARIANTS[key];
    if (variantId) {
      lines.push({
        quantity: item.quantity,
        merchandiseId: variantId,
        attributes: [
          { key: '_addon_for', value: data.gameTitle || 'custom print' },
          { key: '_frame_for', value: size },
        ],
      });
    }
  }

  if (data.includeInfoCard && INFO_CARD_VARIANT_ID) {
    lines.push({
      quantity: item.quantity,
      merchandiseId: INFO_CARD_VARIANT_ID,
      attributes: [
        { key: '_addon_for', value: data.gameTitle || 'custom print' },
      ],
    });
  }

  return lines;
}
