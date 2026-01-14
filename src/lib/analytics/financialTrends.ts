import { supabase } from '@/integrations/supabase/client';

export interface FinancialTrend {
  date: string;
  dailySubscriptionRevenueCents: number;
  dailyPrintRevenueCents: number;
  dailyBookRevenueCents: number;
  dailyMarketplaceFeeCents: number;
  dailyStripeFeesCents: number;
  dailyShopifyFeesCents: number;
  dailyPrintifyCostsCents: number;
  dailyLuluCostsCents: number;
  dailyCreatorRoyaltiesCents: number;
  dailyEducationFundCents: number;
  dailyPalettePoolCents: number;
  dailyGamecardPoolCents: number;
  dailyNewUsers: number;
  dailyNewSubscribers: number;
  dailyChurnedSubscribers: number;
  dailyVisionsCreated: number;
  dailyMarketplaceSales: number;
  dailyPrintOrders: number;
  dailyViews: number;
  dailyDownloads: number;
  dailyTrades: number;
  totalPalettePoolValueCents: number;
  totalGamecardPoolValueCents: number;
  totalMarketCapCents: number;
}

export interface ValuePool {
  id: string;
  name: string;
  baseValueCents: number;
  earnedValueCents: number;
  totalValueCents: number;
  usageCount: number;
  interactionCount: number;
  rarityTier?: string;
}

/**
 * Fetch financial trends for admin dashboard
 */
export async function getFinancialTrends(days: number = 30): Promise<FinancialTrend[]> {
  const { data, error } = await supabase
    .from('financial_trends')
    .select('*')
    .order('date', { ascending: false })
    .limit(days);

  if (error) {
    console.error('Error fetching financial trends:', error);
    return [];
  }

  return (data || []).map(row => ({
    date: row.date,
    dailySubscriptionRevenueCents: row.daily_subscription_revenue_cents || 0,
    dailyPrintRevenueCents: row.daily_print_revenue_cents || 0,
    dailyBookRevenueCents: row.daily_book_revenue_cents || 0,
    dailyMarketplaceFeeCents: row.daily_marketplace_fee_cents || 0,
    dailyStripeFeesCents: row.daily_stripe_fees_cents || 0,
    dailyShopifyFeesCents: row.daily_shopify_fees_cents || 0,
    dailyPrintifyCostsCents: row.daily_printify_costs_cents || 0,
    dailyLuluCostsCents: row.daily_lulu_costs_cents || 0,
    dailyCreatorRoyaltiesCents: row.daily_creator_royalties_cents || 0,
    dailyEducationFundCents: row.daily_education_fund_cents || 0,
    dailyPalettePoolCents: row.daily_palette_pool_cents || 0,
    dailyGamecardPoolCents: row.daily_gamecard_pool_cents || 0,
    dailyNewUsers: row.daily_new_users || 0,
    dailyNewSubscribers: row.daily_new_subscribers || 0,
    dailyChurnedSubscribers: row.daily_churned_subscribers || 0,
    dailyVisionsCreated: row.daily_visions_created || 0,
    dailyMarketplaceSales: row.daily_marketplace_sales || 0,
    dailyPrintOrders: row.daily_print_orders || 0,
    dailyViews: row.daily_views || 0,
    dailyDownloads: row.daily_downloads || 0,
    dailyTrades: row.daily_trades || 0,
    totalPalettePoolValueCents: row.total_palette_pool_value_cents || 0,
    totalGamecardPoolValueCents: row.total_gamecard_pool_value_cents || 0,
    totalMarketCapCents: row.total_market_cap_cents || 0,
  }));
}

/**
 * Fetch palette value pools
 */
export async function getPaletteValuePools(): Promise<ValuePool[]> {
  const { data, error } = await supabase
    .from('palette_value_pool')
    .select('*')
    .order('earned_value_cents', { ascending: false });

  if (error) {
    console.error('Error fetching palette pools:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.palette_id,
    name: row.palette_name,
    baseValueCents: row.base_value_cents,
    earnedValueCents: row.earned_value_cents,
    totalValueCents: row.base_value_cents + row.earned_value_cents,
    usageCount: row.total_visions_using,
    interactionCount: row.total_interactions,
  }));
}

/**
 * Fetch gamecard value pools
 */
export async function getGamecardValuePools(): Promise<ValuePool[]> {
  const { data, error } = await supabase
    .from('gamecard_value_pool')
    .select('*')
    .order('earned_value_cents', { ascending: false });

  if (error) {
    console.error('Error fetching gamecard pools:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.game_id,
    name: row.game_title,
    baseValueCents: row.base_value_cents,
    earnedValueCents: row.earned_value_cents,
    totalValueCents: row.base_value_cents + row.earned_value_cents,
    usageCount: row.total_visions,
    interactionCount: row.total_interactions,
    rarityTier: row.rarity_tier,
  }));
}

/**
 * Trigger daily financial snapshot (admin only)
 */
export async function triggerDailySnapshot(): Promise<boolean> {
  const { error } = await supabase.rpc('snapshot_daily_financials');
  
  if (error) {
    console.error('Error triggering snapshot:', error);
    return false;
  }
  
  return true;
}

/**
 * Generate premium analytics for a user
 */
export async function generatePremiumAnalytics(
  analyticsType: 'market_trends' | 'engagement_insights' | 'portfolio_analysis'
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('generate_premium_analytics', {
    p_user_id: user.id,
    p_analytics_type: analyticsType,
  });

  if (error) {
    console.error('Error generating premium analytics:', error);
    return null;
  }

  // Fetch the generated analytics
  const { data: analytics } = await supabase
    .from('premium_analytics')
    .select('*')
    .eq('id', data)
    .single();

  if (!analytics) return null;

  return {
    id: analytics.id,
    data: analytics.data as Record<string, unknown>,
  };
}

/**
 * Get user's premium analytics history
 */
export async function getPremiumAnalyticsHistory(): Promise<{
  id: string;
  analyticsType: string;
  generatedAt: string;
  expiresAt: string;
}[]> {
  const { data, error } = await supabase
    .from('premium_analytics')
    .select('id, analytics_type, generated_at, expires_at')
    .order('generated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching analytics history:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    analyticsType: row.analytics_type,
    generatedAt: row.generated_at,
    expiresAt: row.expires_at,
  }));
}

/**
 * Record a palette interaction (load/preview) to build value pool data
 * This tracks usage even before a vision is saved
 */
export async function recordPaletteInteraction(paletteId: string): Promise<boolean> {
  try {
    // First check if it exists
    const { data: existing } = await supabase
      .from('palette_value_pool')
      .select('total_interactions')
      .eq('palette_id', paletteId)
      .single();

    if (existing) {
      // Increment existing
      await supabase
        .from('palette_value_pool')
        .update({
          total_interactions: (existing.total_interactions || 0) + 1,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('palette_id', paletteId);
    }
    // If doesn't exist, it will be created by seed data - don't create new entries
    return true;
  } catch (err) {
    console.error('Error recording palette interaction:', err);
    return false;
  }
}

/**
 * Record a gamecard interaction (load/preview) to build value pool data
 */
export async function recordGamecardInteraction(gameId: string): Promise<boolean> {
  try {
    // First check if it exists
    const { data: existing } = await supabase
      .from('gamecard_value_pool')
      .select('total_interactions')
      .eq('game_id', gameId)
      .single();

    if (existing) {
      // Increment existing
      await supabase
        .from('gamecard_value_pool')
        .update({
          total_interactions: (existing.total_interactions || 0) + 1,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('game_id', gameId);
    }
    // If doesn't exist, it will be created by seed data - don't create new entries
    return true;
  } catch (err) {
    console.error('Error recording gamecard interaction:', err);
    return false;
  }
}

/**
 * Increment interaction count for a palette (SQL-side increment to avoid race conditions)
 */
export async function incrementPaletteUsage(paletteId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('palette_value_pool')
    .select('total_interactions')
    .eq('palette_id', paletteId)
    .single();

  if (existing) {
    await supabase
      .from('palette_value_pool')
      .update({
        total_interactions: (existing.total_interactions || 0) + 1,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('palette_id', paletteId);
  }
}

/**
 * Increment interaction count for a gamecard
 */
export async function incrementGamecardUsage(gameId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('gamecard_value_pool')
    .select('total_interactions')
    .eq('game_id', gameId)
    .single();

  if (existing) {
    await supabase
      .from('gamecard_value_pool')
      .update({
        total_interactions: (existing.total_interactions || 0) + 1,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('game_id', gameId);
  }
}
