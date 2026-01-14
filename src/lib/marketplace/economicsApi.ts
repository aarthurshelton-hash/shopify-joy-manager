import { supabase } from '@/integrations/supabase/client';
import { 
  PROFIT_ECONOMICS, 
  calculateProfitDistribution, 
  estimateOrderCosts 
} from '@/lib/economics/profitBasedRoyalties';

export interface VisionEconomics {
  visualization_id: string;
  total_print_revenue_cents: number;
  total_royalties_earned_cents: number;
  total_trades: number;
  trade_volume_cents: number;
  vision_score: number;
}

export interface PortfolioEconomics {
  user_id: string;
  total_visions_owned: number;
  total_royalties_earned_cents: number;
  total_print_orders: number;
  total_marketplace_sales: number;
  total_sale_proceeds_cents: number;
  total_portfolio_score: number;
}

/**
 * Get economics data for a specific vision
 */
export async function getVisionEconomics(visualizationId: string): Promise<{
  data: VisionEconomics | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_vision_economics', {
      p_visualization_id: visualizationId,
    });

    if (error) throw error;
    return { data: data as unknown as VisionEconomics, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get portfolio economics for the current user
 */
export async function getUserPortfolioEconomics(): Promise<{
  data: PortfolioEconomics | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_user_portfolio_economics', {
      p_user_id: user.id,
    });

    if (error) throw error;
    return { data: data as unknown as PortfolioEconomics, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Calculate estimated royalty for a potential print order
 */
export function estimatePrintRoyalty(
  productType: 'print' | 'framedPrint' | 'book' | 'infoCard',
  size: string,
  priceCents: number
): {
  grossProfitCents: number;
  creatorRoyaltyCents: number;
  educationFundCents: number;
  palettePoolCents: number;
  gamecardPoolCents: number;
  profitMarginPercent: number;
} {
  const costs = estimateOrderCosts(productType, size, priceCents);
  const distribution = calculateProfitDistribution(costs);
  
  return {
    grossProfitCents: distribution.grossProfitCents,
    creatorRoyaltyCents: distribution.creatorRoyaltyCents,
    educationFundCents: distribution.educationFundCents,
    palettePoolCents: distribution.palettePoolCents,
    gamecardPoolCents: distribution.gamecardPoolCents,
    profitMarginPercent: distribution.profitMarginPercent,
  };
}

/**
 * Calculate marketplace fee and seller proceeds
 */
export function calculateMarketplaceFee(priceCents: number): {
  feeCents: number;
  sellerProceedsCents: number;
  feePercent: number;
} {
  // Free gifts have no fee
  if (priceCents === 0) {
    return { feeCents: 0, sellerProceedsCents: 0, feePercent: 0 };
  }
  
  const feePercent = PROFIT_ECONOMICS.marketplaceFee * 100; // 5%
  const feeCents = Math.round(priceCents * PROFIT_ECONOMICS.marketplaceFee);
  const sellerProceedsCents = priceCents - feeCents;
  
  return { feeCents, sellerProceedsCents, feePercent };
}

/**
 * Get economics breakdown explanation for UI
 */
export function getEconomicsExplanation(): {
  printOrderBreakdown: {
    label: string;
    percent: number;
    description: string;
  }[];
  marketplaceBreakdown: {
    label: string;
    percent: number;
    description: string;
  }[];
} {
  const pool = PROFIT_ECONOMICS.poolDistribution;
  
  return {
    printOrderBreakdown: [
      {
        label: 'Creator Value',
        percent: pool.creatorRoyalty * 100,
        description: 'Adds to your vision\'s tradeable value',
      },
      {
        label: 'Education Fund',
        percent: pool.educationFund * 100,
        description: 'Supports chess education scholarships',
      },
      {
        label: 'Palette Pool',
        percent: pool.palettePool * 100,
        description: 'Rewards popular color palettes',
      },
      {
        label: 'Gamecard Pool',
        percent: pool.gamecardPool * 100,
        description: 'Values legendary chess games',
      },
    ],
    marketplaceBreakdown: [
      {
        label: 'Seller Receives',
        percent: 95,
        description: '95% goes directly to the seller',
      },
      {
        label: 'Platform Fee',
        percent: 5,
        description: 'Supports platform operations',
      },
    ],
  };
}

/**
 * Format cents to display currency
 */
export function formatCentsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get platform-wide economics summary (for admin/dashboard)
 */
export async function getPlatformEconomicsSummary(): Promise<{
  data: {
    totalPrintRevenue: number;
    totalMarketplaceVolume: number;
    totalRoyaltiesDistributed: number;
    totalEducationFundContributions: number;
    totalPalettePoolValue: number;
    totalGamecardPoolValue: number;
  } | null;
  error: Error | null;
}> {
  try {
    // Get order financials totals
    const { data: orderData, error: orderError } = await supabase
      .from('order_financials')
      .select('order_type, gross_revenue_cents, creator_royalty_cents, education_fund_cents, palette_pool_cents, gamecard_pool_cents');
    
    if (orderError) throw orderError;

    const totals = (orderData || []).reduce(
      (acc, row) => {
        if (row.order_type === 'print_order') {
          acc.totalPrintRevenue += row.gross_revenue_cents || 0;
        } else if (row.order_type === 'marketplace_sale') {
          acc.totalMarketplaceVolume += row.gross_revenue_cents || 0;
        }
        acc.totalRoyaltiesDistributed += row.creator_royalty_cents || 0;
        acc.totalEducationFundContributions += row.education_fund_cents || 0;
        acc.totalPalettePoolValue += row.palette_pool_cents || 0;
        acc.totalGamecardPoolValue += row.gamecard_pool_cents || 0;
        return acc;
      },
      {
        totalPrintRevenue: 0,
        totalMarketplaceVolume: 0,
        totalRoyaltiesDistributed: 0,
        totalEducationFundContributions: 0,
        totalPalettePoolValue: 0,
        totalGamecardPoolValue: 0,
      }
    );

    return { data: totals, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
