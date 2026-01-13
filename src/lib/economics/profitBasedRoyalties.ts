/**
 * Profit-Based Royalty System
 * 
 * IMPORTANT: Visions earn 20% of PROFIT, not revenue.
 * 
 * Revenue Flow:
 * 1. Customer pays order total (e.g., $49 for print)
 * 2. Platform pays fulfillment costs (Printify, shipping, fees)
 * 3. Remaining = Gross Profit
 * 4. 20% of Gross Profit → Value Appreciation Pool
 * 5. 80% of Gross Profit → Platform operations
 * 
 * Value Appreciation Pool Distribution:
 * - Creator Royalties: 40%
 * - Education Fund: 25%
 * - Palette Pool: 20%
 * - Gamecard Pool: 15%
 */

export interface OrderCosts {
  /** Gross revenue from order */
  grossRevenueCents: number;
  /** Printify/Lulu fulfillment cost */
  fulfillmentCostCents: number;
  /** Stripe/Shopify platform fees (~3%) */
  platformFeesCents: number;
  /** Shipping cost (if applicable) */
  shippingCostCents: number;
}

export interface ProfitDistribution {
  /** Gross profit after all costs */
  grossProfitCents: number;
  /** Total going to value appreciation (20% of profit) */
  valueAppreciationPoolCents: number;
  /** Creator royalty share (40% of pool) */
  creatorRoyaltyCents: number;
  /** Education fund share (25% of pool) */
  educationFundCents: number;
  /** Palette pool share (20% of pool) */
  palettePoolCents: number;
  /** Gamecard pool share (15% of pool) */
  gamecardPoolCents: number;
  /** Platform retention (80% of profit) */
  platformRetentionCents: number;
  /** Profit margin percentage */
  profitMarginPercent: number;
}

// Core economic constants
export const PROFIT_ECONOMICS = {
  // Value appreciation rate - 20% of PROFIT (not revenue)
  valueAppreciationRate: 0.20,
  
  // Platform retention - 80% of profit covers operations
  platformRetentionRate: 0.80,
  
  // Value Appreciation Pool distribution
  poolDistribution: {
    creatorRoyalty: 0.40,    // 40% to creator
    educationFund: 0.25,     // 25% to education
    palettePool: 0.20,       // 20% to palette appreciation
    gamecardPool: 0.15,      // 15% to legendary game cards
  },
  
  // Estimated fulfillment costs by product type
  estimatedCosts: {
    print: {
      '8x10': { fulfillment: 1200, shipping: 500 },    // ~$12 fulfillment + $5 shipping
      '11x14': { fulfillment: 1500, shipping: 600 },
      '16x20': { fulfillment: 2200, shipping: 800 },
      '18x24': { fulfillment: 2800, shipping: 900 },
      '24x36': { fulfillment: 4000, shipping: 1200 },
    } as Record<string, { fulfillment: number; shipping: number }>,
    framedPrint: {
      '8x10': { fulfillment: 3000, shipping: 1000 },
      '11x14': { fulfillment: 3800, shipping: 1200 },
      '16x20': { fulfillment: 5000, shipping: 1500 },
      '18x24': { fulfillment: 6200, shipping: 1800 },
      '24x36': { fulfillment: 8500, shipping: 2500 },
    } as Record<string, { fulfillment: number; shipping: number }>,
    book: {
      standard: { fulfillment: 2500, shipping: 800 },
      largeFormat: { fulfillment: 3500, shipping: 1000 },
    },
    infoCard: {
      single: { fulfillment: 200, shipping: 100 },
    },
  },
  
  // Platform transaction fees (~3% Stripe + variable Shopify)
  transactionFeeRate: 0.035, // 3.5% average
  
  // Marketplace fee on vision sales
  marketplaceFee: 0.05, // 5%
  
  // Subscription contribution rate
  subscriptionContributionRate: 0.20, // 20% of $7 = $1.40/month
};

/**
 * Calculate profit distribution for an order
 */
export function calculateProfitDistribution(costs: OrderCosts): ProfitDistribution {
  const totalCosts = costs.fulfillmentCostCents + costs.platformFeesCents + costs.shippingCostCents;
  const grossProfitCents = Math.max(0, costs.grossRevenueCents - totalCosts);
  
  // 20% of profit goes to value appreciation
  const valueAppreciationPoolCents = Math.round(grossProfitCents * PROFIT_ECONOMICS.valueAppreciationRate);
  
  // Distribute the pool
  const dist = PROFIT_ECONOMICS.poolDistribution;
  const creatorRoyaltyCents = Math.round(valueAppreciationPoolCents * dist.creatorRoyalty);
  const educationFundCents = Math.round(valueAppreciationPoolCents * dist.educationFund);
  const palettePoolCents = Math.round(valueAppreciationPoolCents * dist.palettePool);
  const gamecardPoolCents = Math.round(valueAppreciationPoolCents * dist.gamecardPool);
  
  // Platform keeps 80%
  const platformRetentionCents = grossProfitCents - valueAppreciationPoolCents;
  
  // Calculate margin
  const profitMarginPercent = costs.grossRevenueCents > 0 
    ? (grossProfitCents / costs.grossRevenueCents) * 100 
    : 0;
  
  return {
    grossProfitCents,
    valueAppreciationPoolCents,
    creatorRoyaltyCents,
    educationFundCents,
    palettePoolCents,
    gamecardPoolCents,
    platformRetentionCents,
    profitMarginPercent,
  };
}

/**
 * Estimate order costs for a given product
 */
export function estimateOrderCosts(
  productType: 'print' | 'framedPrint' | 'book' | 'infoCard',
  size: string,
  priceCents: number
): OrderCosts {
  const costs = PROFIT_ECONOMICS.estimatedCosts;
  
  let fulfillmentCostCents = 2000; // Default $20
  let shippingCostCents = 800;     // Default $8
  
  if (productType === 'print' && costs.print[size]) {
    fulfillmentCostCents = costs.print[size].fulfillment;
    shippingCostCents = costs.print[size].shipping;
  } else if (productType === 'framedPrint' && costs.framedPrint[size]) {
    fulfillmentCostCents = costs.framedPrint[size].fulfillment;
    shippingCostCents = costs.framedPrint[size].shipping;
  } else if (productType === 'book') {
    const bookSize = size === 'large' ? 'largeFormat' : 'standard';
    fulfillmentCostCents = costs.book[bookSize].fulfillment;
    shippingCostCents = costs.book[bookSize].shipping;
  } else if (productType === 'infoCard') {
    fulfillmentCostCents = costs.infoCard.single.fulfillment;
    shippingCostCents = costs.infoCard.single.shipping;
  }
  
  // Platform fees (Stripe + Shopify)
  const platformFeesCents = Math.round(priceCents * PROFIT_ECONOMICS.transactionFeeRate);
  
  return {
    grossRevenueCents: priceCents,
    fulfillmentCostCents,
    platformFeesCents,
    shippingCostCents,
  };
}

/**
 * Calculate creator royalty for an example order
 * This is what we show users as potential earnings
 */
export function calculateExampleRoyalty(orderPriceDollars: number, productType: 'print' | 'framedPrint' = 'print', size: string = '16x20'): {
  grossProfit: number;
  creatorRoyalty: number;
  educationContribution: number;
  profitMargin: number;
} {
  const priceCents = Math.round(orderPriceDollars * 100);
  const costs = estimateOrderCosts(productType, size, priceCents);
  const distribution = calculateProfitDistribution(costs);
  
  return {
    grossProfit: distribution.grossProfitCents / 100,
    creatorRoyalty: distribution.creatorRoyaltyCents / 100,
    educationContribution: distribution.educationFundCents / 100,
    profitMargin: distribution.profitMarginPercent,
  };
}

/**
 * Format profit-based royalty explanation for UI
 */
export function getRoyaltyExplanation(): {
  headline: string;
  bullets: string[];
  example: { price: number; profit: number; royalty: number };
} {
  const example = calculateExampleRoyalty(49, 'print', '16x20');
  
  return {
    headline: '20% of profit adds to vision value',
    bullets: [
      'Based on actual profit after fulfillment costs',
      'Not raw revenue—honest, sustainable economics',
      `Avg. $${example.creatorRoyalty.toFixed(2)} per $49 print order`,
      'Sell on marketplace to realize accumulated value',
    ],
    example: {
      price: 49,
      profit: example.grossProfit,
      royalty: example.creatorRoyalty,
    },
  };
}

/**
 * Calculate estimated gross margins by product category
 * For investor materials
 */
export function getGrossMarginsByCategory(): {
  category: string;
  margin: number;
  description: string;
}[] {
  return [
    {
      category: 'Digital Downloads',
      margin: 95,
      description: 'Near-zero marginal cost for HD/GIF exports',
    },
    {
      category: 'Unframed Prints',
      margin: 55,
      description: 'After Printify fulfillment and shipping',
    },
    {
      category: 'Framed Canvas',
      margin: 35,
      description: 'Premium product with higher fulfillment costs',
    },
    {
      category: 'Coffee Table Books',
      margin: 40,
      description: 'Lulu print-on-demand hardcover production',
    },
    {
      category: 'Premium Memberships',
      margin: 98,
      description: 'Recurring SaaS with minimal delivery costs',
    },
    {
      category: 'Marketplace Fees',
      margin: 100,
      description: '5% transaction fee on peer-to-peer sales',
    },
  ];
}
