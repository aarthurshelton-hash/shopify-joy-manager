import { supabase } from '@/integrations/supabase/client';

export interface VisionNFT {
  id: string;
  visualization_id: string;
  token_id: string;
  mint_number?: number;
  
  // Value tracking
  mint_price_cents: number;
  current_floor_price_cents: number;
  all_time_high_cents?: number;
  all_time_low_cents?: number;
  appreciation_rate?: number;
  
  // Value sources
  print_revenue_contribution_cents: number;
  gamecard_pool_share_cents: number;
  palette_pool_share_cents: number;
  opening_pool_share_cents: number;
  engagement_value_cents: number;
  trading_premium_cents: number;
  
  // Attribution
  game_id?: string;
  palette_id?: string;
  opening_eco?: string;
  
  // Rarity
  rarity_score: number;
  total_prints_ordered: number;
  total_views: number;
  total_unique_viewers: number;
  total_downloads: number;
  total_trades: number;
  
  // Ownership
  current_owner_id?: string;
  minted_by?: string;
  minted_at: string;
  
  // Trading
  last_sale_price_cents?: number;
  last_sale_at?: string;
}

export interface VisionValueHistory {
  id: string;
  vision_nft_id: string;
  floor_price_cents: number;
  total_contribution_cents: number;
  
  // Component breakdown
  print_revenue_cents: number;
  gamecard_share_cents: number;
  palette_share_cents: number;
  opening_share_cents: number;
  engagement_cents: number;
  trading_premium_cents: number;
  
  // Context
  game_hype_score: number;
  palette_scarcity: number;
  
  snapshot_date: string;
  created_at: string;
}

export interface VisionTrade {
  id: string;
  vision_nft_id: string;
  seller_id?: string;
  buyer_id?: string;
  trade_price_cents: number;
  trade_type: 'marketplace_sale' | 'private_trade' | 'external_sale' | 'initial_claim';
  seller_gain_cents: number;
  platform_fee_cents: number;
  game_id?: string;
  palette_id?: string;
  traded_at: string;
}

// Get all vision NFTs for a user
export async function getUserVisionNFTs(userId: string): Promise<{
  data: VisionNFT[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_nfts')
      .select('*')
      .eq('current_owner_id', userId)
      .order('current_floor_price_cents', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as VisionNFT[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get a single vision NFT by ID
export async function getVisionNFT(visionNftId: string): Promise<{
  data: VisionNFT | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_nfts')
      .select('*')
      .eq('id', visionNftId)
      .single();

    if (error) throw error;
    return { data: data as VisionNFT, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Get vision NFT by visualization ID
export async function getVisionNFTByVisualization(visualizationId: string): Promise<{
  data: VisionNFT | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_nfts')
      .select('*')
      .eq('visualization_id', visualizationId)
      .single();

    if (error) throw error;
    return { data: data as VisionNFT, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Get value history for a vision (for charts)
export async function getVisionValueHistory(
  visionNftId: string,
  days: number = 30
): Promise<{
  data: VisionValueHistory[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_value_history')
      .select('*')
      .eq('vision_nft_id', visionNftId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as VisionValueHistory[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get trading history for a vision
export async function getVisionTrades(visionNftId: string): Promise<{
  data: VisionTrade[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_trades')
      .select('*')
      .eq('vision_nft_id', visionNftId)
      .order('traded_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as VisionTrade[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get top performing visions
export async function getTopPerformingVisions(
  limit: number = 10,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<{
  data: VisionNFT[];
  error: Error | null;
}> {
  try {
    const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    
    // Get visions that appreciated most in the timeframe
    const { data, error } = await supabase
      .from('vision_nfts')
      .select(`
        *,
        history:vision_value_history!inner(floor_price_cents, snapshot_date)
      `)
      .gte('vision_value_history.snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('appreciation_rate', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: (data || []) as VisionNFT[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get visions by game (for "hot games" feature)
export async function getVisionsByGame(gameId: string): Promise<{
  data: VisionNFT[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_nfts')
      .select('*')
      .eq('game_id', gameId)
      .order('current_floor_price_cents', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as VisionNFT[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get visions by palette (for scarcity calculations)
export async function getVisionsByPalette(paletteId: string): Promise<{
  data: VisionNFT[];
  count: number;
  error: Error | null;
}> {
  try {
    const { data, error, count } = await supabase
      .from('vision_nfts')
      .select('*', { count: 'exact' })
      .eq('palette_id', paletteId)
      .order('current_floor_price_cents', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as VisionNFT[], count: count || 0, error: null };
  } catch (error) {
    return { data: [], count: 0, error: error as Error };
  }
}

// Calculate total portfolio value for a user
export async function calculatePortfolioValue(userId: string): Promise<{
  totalValueCents: number;
  totalMintCostCents: number;
  totalGainCents: number;
  gainPercentage: number;
  visionCount: number;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_nfts')
      .select('current_floor_price_cents, mint_price_cents')
      .eq('current_owner_id', userId);

    if (error) throw error;

    const visions = data || [];
    const totalValueCents = visions.reduce((sum, v) => sum + (v.current_floor_price_cents || 0), 0);
    const totalMintCostCents = visions.reduce((sum, v) => sum + (v.mint_price_cents || 0), 0);
    const totalGainCents = totalValueCents - totalMintCostCents;
    const gainPercentage = totalMintCostCents > 0 ? (totalGainCents / totalMintCostCents) * 100 : 0;

    return {
      totalValueCents,
      totalMintCostCents,
      totalGainCents,
      gainPercentage,
      visionCount: visions.length,
      error: null,
    };
  } catch (error) {
    return {
      totalValueCents: 0,
      totalMintCostCents: 0,
      totalGainCents: 0,
      gainPercentage: 0,
      visionCount: 0,
      error: error as Error,
    };
  }
}

// Format cents to dollar display
export function formatValue(cents: number): string {
  if (cents === 0) return '$0.00';
  if (cents < 100) return `$0.${cents.toString().padStart(2, '0')}`;
  return `$${(cents / 100).toFixed(2)}`;
}

// Format appreciation percentage
export function formatAppreciation(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
