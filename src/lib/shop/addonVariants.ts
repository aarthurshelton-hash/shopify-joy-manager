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
/** key: `frame|<normalizedSize>|<styleId>` → Shopify variant GID */
export const FRAME_VARIANTS: Record<string, string> = {
  // populated by scripts/promo/shop-addons.mjs
};

/** Shopify variant GID for the $9.99 Vision Info Card add-on */
export const INFO_CARD_VARIANT_ID = '';
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
