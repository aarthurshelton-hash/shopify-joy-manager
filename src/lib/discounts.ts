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

// Free shipping threshold (in USD)
export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_COST = 9.99;

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
  amountUntilFreeShipping: number;
  progressPercent: number;
}

export function calculateShipping(subtotalAfterDiscount: number): ShippingInfo {
  const isFreeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
  const amountUntilFreeShipping = isFreeShipping ? 0 : FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount;
  const progressPercent = Math.min((subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100, 100);
  
  return {
    isFreeShipping,
    shippingCost,
    amountUntilFreeShipping,
    progressPercent,
  };
}

export function calculateDiscount(subtotal: number, quantity: number): {
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
  const shipping = calculateShipping(finalTotal);
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
