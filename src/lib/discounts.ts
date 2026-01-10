// Quantity-based discount tiers
// The more prints ordered, the bigger the discount

export interface DiscountTier {
  minQuantity: number;
  discountPercent: number;
  label: string;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minQuantity: 1, discountPercent: 0, label: 'No discount' },
  { minQuantity: 2, discountPercent: 10, label: '10% off' },
  { minQuantity: 3, discountPercent: 15, label: '15% off' },
  { minQuantity: 4, discountPercent: 20, label: '20% off' },
  { minQuantity: 5, discountPercent: 25, label: '25% off' },
  { minQuantity: 8, discountPercent: 30, label: '30% off' },
  { minQuantity: 10, discountPercent: 35, label: '35% off' },
];

// Shipping costs by region
export const SHIPPING_CONFIG = {
  freeRegions: ['US', 'CA'], // Free shipping for USA and Canada
  internationalCost: 14.99, // Flat rate for international orders
};

export type ShippingRegion = 'US' | 'CA' | 'international';

export function getShippingRegion(countryCode?: string): ShippingRegion {
  if (!countryCode) return 'US'; // Default to US
  const code = countryCode.toUpperCase();
  if (code === 'US' || code === 'USA') return 'US';
  if (code === 'CA' || code === 'CAN') return 'CA';
  return 'international';
}

export function getDiscountTier(quantity: number): DiscountTier {
  // Find the highest applicable discount tier
  let applicableTier = DISCOUNT_TIERS[0];
  
  for (const tier of DISCOUNT_TIERS) {
    if (quantity >= tier.minQuantity) {
      applicableTier = tier;
    }
  }
  
  return applicableTier;
}

export function getNextDiscountTier(quantity: number): DiscountTier | null {
  const currentTier = getDiscountTier(quantity);
  const currentIndex = DISCOUNT_TIERS.indexOf(currentTier);
  
  if (currentIndex < DISCOUNT_TIERS.length - 1) {
    return DISCOUNT_TIERS[currentIndex + 1];
  }
  
  return null;
}

export interface ShippingInfo {
  isFreeShipping: boolean;
  shippingCost: number;
  region: ShippingRegion;
  regionLabel: string;
}

export function calculateShipping(region: ShippingRegion = 'US'): ShippingInfo {
  const isFreeShipping = SHIPPING_CONFIG.freeRegions.includes(region);
  const shippingCost = isFreeShipping ? 0 : SHIPPING_CONFIG.internationalCost;
  
  const regionLabels: Record<ShippingRegion, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'international': 'International',
  };
  
  return {
    isFreeShipping,
    shippingCost,
    region,
    regionLabel: regionLabels[region],
  };
}

export function calculateDiscount(subtotal: number, quantity: number, region: ShippingRegion = 'US'): {
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  tier: DiscountTier;
  nextTier: DiscountTier | null;
  itemsUntilNextTier: number;
  shipping: ShippingInfo;
  grandTotal: number;
} {
  const tier = getDiscountTier(quantity);
  const nextTier = getNextDiscountTier(quantity);
  const discountAmount = subtotal * (tier.discountPercent / 100);
  const finalTotal = subtotal - discountAmount;
  const itemsUntilNextTier = nextTier ? nextTier.minQuantity - quantity : 0;
  const shipping = calculateShipping(region);
  const grandTotal = finalTotal + shipping.shippingCost;
  
  return {
    discountPercent: tier.discountPercent,
    discountAmount,
    finalTotal,
    tier,
    nextTier,
    itemsUntilNextTier,
    shipping,
    grandTotal,
  };
}
