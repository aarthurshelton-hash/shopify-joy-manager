/**
 * Frame Pricing Configuration
 * 
 * Based on Printify's real costs for framed canvas products.
 * All prices include a 20% markup to ensure profitability.
 * 
 * Printify base costs (approximate):
 * - 8×10" canvas frame: $28-32
 * - 11×14" canvas frame: $35-40
 * - 16×20" canvas frame: $45-52
 * - 18×24" canvas frame: $55-65
 * - 24×36" canvas frame: $75-90
 * 
 * Premium frame styles (walnut, gold) add ~$8-15 to base cost.
 */

export interface FrameStyle {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  description: string;
  /** Premium multiplier - standard frames = 1.0, premium = higher */
  premiumMultiplier: number;
}

export interface FrameSizePrice {
  size: string;
  /** Base Printify cost in USD */
  printifyCost: number;
  /** Our selling price with 20% margin */
  ourPrice: number;
}

// Frame styles with premium multipliers
export const FRAME_STYLES: FrameStyle[] = [
  {
    id: 'natural',
    name: 'Natural Wood',
    color: 'Natural',
    colorHex: '#D4A574',
    description: 'Warm, organic finish that complements any decor',
    premiumMultiplier: 1.0,
  },
  {
    id: 'black',
    name: 'Classic Black',
    color: 'Black',
    colorHex: '#1A1A1A',
    description: 'Timeless elegance for modern and traditional spaces',
    premiumMultiplier: 1.0,
  },
  {
    id: 'white',
    name: 'Gallery White',
    color: 'White',
    colorHex: '#F5F5F5',
    description: 'Clean, museum-quality presentation',
    premiumMultiplier: 1.0,
  },
  {
    id: 'walnut',
    name: 'Rich Walnut',
    color: 'Walnut',
    colorHex: '#5D4037',
    description: 'Premium dark wood with sophisticated grain',
    premiumMultiplier: 1.15, // 15% premium
  },
  {
    id: 'gold',
    name: 'Champagne Gold',
    color: 'Gold',
    colorHex: '#D4AF37',
    description: 'Luxurious metallic finish for statement pieces',
    premiumMultiplier: 1.25, // 25% premium
  },
];

// Printify base costs per size (in USD)
// These are approximate wholesale costs from Printify
const PRINTIFY_BASE_COSTS: Record<string, number> = {
  '8×10"': 30,
  '8x10': 30,
  '11×14"': 38,
  '11x14': 38,
  '12×16"': 42,
  '12x16': 42,
  '16×20"': 50,
  '16x20': 50,
  '18×24"': 62,
  '18x24': 62,
  '24×36"': 85,
  '24x36': 85,
};

// 20% markup factor
const MARGIN_MULTIPLIER = 1.20;

/**
 * Normalize size string for consistent lookup
 */
function normalizeSize(size: string): string {
  // Remove spaces, convert × to x, ensure quotes
  return size.toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/["']/g, '');
}

/**
 * Get Printify base cost for a given size
 */
export function getPrintifyBaseCost(size: string): number {
  const normalized = normalizeSize(size);
  
  // Direct lookup
  for (const [key, cost] of Object.entries(PRINTIFY_BASE_COSTS)) {
    if (normalizeSize(key) === normalized) {
      return cost;
    }
  }
  
  // Try to extract dimensions
  const match = size.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (match) {
    const key = `${match[1]}x${match[2]}`;
    if (PRINTIFY_BASE_COSTS[key]) {
      return PRINTIFY_BASE_COSTS[key];
    }
  }
  
  // Default fallback
  return 45;
}

/**
 * Calculate frame price for a given size and style
 * Includes 20% margin over Printify cost
 */
export function calculateFramePrice(size: string, frameStyleId: string): number {
  const baseCost = getPrintifyBaseCost(size);
  const style = FRAME_STYLES.find(s => s.id === frameStyleId);
  const premiumMultiplier = style?.premiumMultiplier || 1.0;
  
  // Apply premium multiplier, then our 20% margin
  const rawPrice = baseCost * premiumMultiplier * MARGIN_MULTIPLIER;
  
  // Round to nearest .99 for pricing psychology
  return Math.ceil(rawPrice) - 0.01;
}

/**
 * Get all frame prices for a given size
 */
export function getFramePricesForSize(size: string): Array<FrameStyle & { price: number }> {
  return FRAME_STYLES.map(style => ({
    ...style,
    price: calculateFramePrice(size, style.id),
  }));
}

/**
 * Get the base (cheapest) frame price for a size
 */
export function getBaseFramePrice(size: string): number {
  return calculateFramePrice(size, 'natural');
}

/**
 * Frame shipping configuration
 */
export const FRAME_SHIPPING_COST = 12.99;
export const FREE_SHIPPING_THRESHOLD = 3;
