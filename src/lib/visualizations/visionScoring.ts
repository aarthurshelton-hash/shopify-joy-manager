import { supabase } from '@/integrations/supabase/client';

export interface VisionScore {
  visualizationId: string;
  viewCount: number;
  downloadHdCount: number;
  downloadGifCount: number;
  tradeCount: number;
  printOrderCount: number;
  printRevenueCents: number;
  totalScore: number;
  uniqueViewers: number;
  updatedAt: string;
}

export interface VisionLeaderboardEntry extends VisionScore {
  title: string;
  imagePath: string;
  ownerDisplayName: string;
  ownerId: string;
}

/**
 * Scoring weights:
 * - View: 0.01 points
 * - HD Download: 0.10 points
 * - GIF Download: 0.25 points
 * - Trade: 1.00 point
 * - Print Order: 2.00 points + revenue in dollars
 */
export const SCORING_WEIGHTS = {
  view: 0.01,
  download_hd: 0.10,
  download_gif: 0.25,
  trade: 1.00,
  print_order_base: 2.00,
  print_dollar_multiplier: 1.00, // Each dollar spent = 1 point
};

/**
 * Generate a simple hash of the client's IP for rate limiting anonymous users
 * This is NOT a secure hash - just for basic rate limiting
 */
async function getIpHash(): Promise<string | null> {
  try {
    // Use a fingerprint based on available browser data
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  } catch {
    return null;
  }
}

/**
 * Record a vision interaction with rate-limiting protection
 * Returns true if the interaction was recorded, false if rate-limited
 */
export async function recordVisionInteraction(
  visualizationId: string,
  interactionType: 'view' | 'download_hd' | 'download_gif' | 'trade' | 'print_order',
  valueCents: number = 0
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    const ipHash = userId ? null : await getIpHash();

    // Call the database function that handles rate limiting
    const { data, error } = await supabase.rpc('record_vision_interaction', {
      p_visualization_id: visualizationId,
      p_user_id: userId,
      p_interaction_type: interactionType,
      p_value_cents: valueCents,
      p_ip_hash: ipHash,
    });

    if (error) {
      console.error('Error recording interaction:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in recordVisionInteraction:', error);
    return false;
  }
}

/**
 * Get the score for a specific vision
 */
export async function getVisionScore(visualizationId: string): Promise<VisionScore | null> {
  try {
    const { data, error } = await supabase
      .from('vision_scores')
      .select('*')
      .eq('visualization_id', visualizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      visualizationId: data.visualization_id,
      viewCount: data.view_count,
      downloadHdCount: data.download_hd_count,
      downloadGifCount: data.download_gif_count,
      tradeCount: data.trade_count,
      printOrderCount: data.print_order_count,
      printRevenueCents: data.print_revenue_cents,
      totalScore: parseFloat(String(data.total_score)),
      uniqueViewers: data.unique_viewers,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error getting vision score:', error);
    return null;
  }
}

/**
 * Get the top visions by score (leaderboard)
 */
export async function getVisionLeaderboard(limit: number = 10): Promise<VisionLeaderboardEntry[]> {
  try {
    // Get top scores
    const { data: scores, error: scoresError } = await supabase
      .from('vision_scores')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(limit);

    if (scoresError) throw scoresError;
    if (!scores || scores.length === 0) return [];

    // Get visualization details
    const vizIds = scores.map(s => s.visualization_id);
    const { data: visualizations, error: vizError } = await supabase
      .from('saved_visualizations')
      .select('id, title, image_path, user_id')
      .in('id', vizIds);

    if (vizError) throw vizError;

    // Get owner profiles
    const userIds = [...new Set(visualizations?.map(v => v.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
    const vizMap = new Map(visualizations?.map(v => [v.id, v]) || []);

    return scores.map(score => {
      const viz = vizMap.get(score.visualization_id);
      return {
        visualizationId: score.visualization_id,
        viewCount: score.view_count,
        downloadHdCount: score.download_hd_count,
        downloadGifCount: score.download_gif_count,
        tradeCount: score.trade_count,
        printOrderCount: score.print_order_count,
        printRevenueCents: score.print_revenue_cents,
        totalScore: parseFloat(String(score.total_score)),
        uniqueViewers: score.unique_viewers,
        updatedAt: score.updated_at,
        title: viz?.title || 'Untitled',
        imagePath: viz?.image_path || '',
        ownerDisplayName: profileMap.get(viz?.user_id || '') || 'Anonymous',
        ownerId: viz?.user_id || '',
      };
    });
  } catch (error) {
    console.error('Error getting vision leaderboard:', error);
    return [];
  }
}

/**
 * Get aggregate platform statistics for analytics
 */
export async function getPlatformVisionStats(): Promise<{
  totalViews: number;
  totalDownloads: number;
  totalGifDownloads: number;
  totalTrades: number;
  totalPrintOrders: number;
  totalPrintRevenue: number;
  totalScore: number;
  uniqueCollectors: number;
}> {
  try {
    const { data, error } = await supabase
      .from('vision_scores')
      .select('view_count, download_hd_count, download_gif_count, trade_count, print_order_count, print_revenue_cents, total_score');

    if (error) throw error;

    const stats = (data || []).reduce((acc, score) => ({
      totalViews: acc.totalViews + score.view_count,
      totalDownloads: acc.totalDownloads + score.download_hd_count,
      totalGifDownloads: acc.totalGifDownloads + score.download_gif_count,
      totalTrades: acc.totalTrades + score.trade_count,
      totalPrintOrders: acc.totalPrintOrders + score.print_order_count,
      totalPrintRevenue: acc.totalPrintRevenue + score.print_revenue_cents,
      totalScore: acc.totalScore + parseFloat(String(score.total_score)),
    }), {
      totalViews: 0,
      totalDownloads: 0,
      totalGifDownloads: 0,
      totalTrades: 0,
      totalPrintOrders: 0,
      totalPrintRevenue: 0,
      totalScore: 0,
    });

    // Get unique collectors (owners of scored visions)
    const { data: visualizations } = await supabase
      .from('saved_visualizations')
      .select('user_id');
    
    const uniqueCollectors = new Set(visualizations?.map(v => v.user_id) || []).size;

    return { ...stats, uniqueCollectors };
  } catch (error) {
    console.error('Error getting platform vision stats:', error);
    return {
      totalViews: 0,
      totalDownloads: 0,
      totalGifDownloads: 0,
      totalTrades: 0,
      totalPrintOrders: 0,
      totalPrintRevenue: 0,
      totalScore: 0,
      uniqueCollectors: 0,
    };
  }
}

/**
 * Calculate the estimated value of a vision based on its score and activity
 */
export function calculateVisionValue(score: VisionScore): number {
  // Base value from score (each point = ~$0.50)
  const baseValue = score.totalScore * 0.5;
  
  // Premium for high engagement
  const engagementMultiplier = Math.min(1 + (score.uniqueViewers / 100), 2);
  
  // Premium for print orders (proven demand)
  const printPremium = score.printOrderCount * 5;
  
  return Math.round((baseValue * engagementMultiplier + printPremium) * 100) / 100;
}

/**
 * Get a user's total vision portfolio value
 */
export async function getUserPortfolioValue(userId: string): Promise<{
  totalValue: number;
  visionCount: number;
  totalScore: number;
}> {
  try {
    const { data: visualizations } = await supabase
      .from('saved_visualizations')
      .select('id')
      .eq('user_id', userId);

    if (!visualizations || visualizations.length === 0) {
      return { totalValue: 0, visionCount: 0, totalScore: 0 };
    }

    const vizIds = visualizations.map(v => v.id);
    const { data: scores } = await supabase
      .from('vision_scores')
      .select('*')
      .in('visualization_id', vizIds);

    let totalValue = 0;
    let totalScore = 0;

    for (const scoreData of scores || []) {
      const score: VisionScore = {
        visualizationId: scoreData.visualization_id,
        viewCount: scoreData.view_count,
        downloadHdCount: scoreData.download_hd_count,
        downloadGifCount: scoreData.download_gif_count,
        tradeCount: scoreData.trade_count,
        printOrderCount: scoreData.print_order_count,
        printRevenueCents: scoreData.print_revenue_cents,
        totalScore: parseFloat(String(scoreData.total_score)),
        uniqueViewers: scoreData.unique_viewers,
        updatedAt: scoreData.updated_at,
      };
      totalValue += calculateVisionValue(score);
      totalScore += score.totalScore;
    }

    return {
      totalValue,
      visionCount: visualizations.length,
      totalScore,
    };
  } catch (error) {
    console.error('Error getting user portfolio value:', error);
    return { totalValue: 0, visionCount: 0, totalScore: 0 };
  }
}
