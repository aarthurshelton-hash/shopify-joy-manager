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
  royaltyCentsEarned: number;
  royaltyOrdersCount: number;
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
 * Vision Value Appreciation Economics
 * 
 * Visions appreciate in value based on real-world activity (print orders, views, trades).
 * Value is NOT paid out directly - it accrues to the vision itself.
 * To realize gains, holders must sell visions on the marketplace.
 * 
 * Economics:
 * - Monthly subscription: $7/month (20% contributes to market growth)
 * - Print orders: 20% of revenue adds to vision's intrinsic value
 * - Marketplace: Seller keeps 95%, platform takes 5% transaction fee
 * - Bartering: Users can negotiate trades with counter-offers
 * 
 * Value Flow:
 * 1. Activity (prints, views, downloads) → increases vision score
 * 2. Score + royalty value → determines vision's market value
 * 3. Holder lists vision for sale → sets asking price
 * 4. Buyer purchases → pays seller directly (minus 5% fee)
 */
export const MEMBERSHIP_ECONOMICS = {
  monthlySubscription: 7.00,           // $7/month
  marketContributionRate: 0.20,        // 20% goes to market appreciation
  monthlyContributionPerMember: 1.40,  // $1.40/month per subscriber to market
  baseMarketCap: 5000,                 // $5,000 base market cap (foundation value)
  valuePerScorePoint: 0.50,            // Base $0.50 per score point
  membershipMultiplierCap: 3.0,        // Max 3x multiplier from memberships
  valueAppreciationRate: 0.20,         // 20% of print revenue adds to vision value
  platformRetentionRate: 0.80,         // 80% retained by platform (covers printing, fulfillment, operations)
  marketplaceTransactionFee: 0.05,     // 5% platform fee on marketplace sales
  sellerRetentionRate: 0.95,           // 95% goes directly to seller
  creatorPremiumTiers: {               // Creator premium multipliers based on engagement
    tier1: { minInteractions: 10, multiplier: 1.2 },
    tier2: { minInteractions: 50, multiplier: 1.5 },
  },
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
      royaltyCentsEarned: data.royalty_cents_earned || 0,
      royaltyOrdersCount: data.royalty_orders_count || 0,
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
        royaltyCentsEarned: score.royalty_cents_earned || 0,
        royaltyOrdersCount: score.royalty_orders_count || 0,
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
 * Now includes membership-driven appreciation
 */
export function calculateVisionValue(
  score: VisionScore, 
  membershipMultiplier: number = 1.0
): number {
  // Base value from score
  const baseValue = score.totalScore * MEMBERSHIP_ECONOMICS.valuePerScorePoint;
  
  // Premium for high engagement
  const engagementMultiplier = Math.min(1 + (score.uniqueViewers / 100), 2);
  
  // Premium for print orders (proven demand)
  const printPremium = score.printOrderCount * 5;
  
  // Apply membership-driven appreciation (capped)
  const effectiveMultiplier = Math.min(membershipMultiplier, MEMBERSHIP_ECONOMICS.membershipMultiplierCap);
  
  const rawValue = (baseValue * engagementMultiplier + printPremium) * effectiveMultiplier;
  
  return Math.round(rawValue * 100) / 100;
}

/**
 * Calculate the membership-driven market multiplier
 * More subscribers = higher multiplier for all vision values
 */
export function calculateMembershipMultiplier(subscriberCount: number): number {
  // Logarithmic scaling to prevent runaway inflation
  // 100 subscribers = 1.3x, 1000 = 1.6x, 10000 = 2.0x, 50000 = 2.5x
  if (subscriberCount <= 0) return 1.0;
  
  const multiplier = 1 + (Math.log10(subscriberCount + 1) * 0.3);
  return Math.min(multiplier, MEMBERSHIP_ECONOMICS.membershipMultiplierCap);
}

/**
 * Calculate the total vision market capitalization
 * Includes base value + membership contributions + organic score value
 */
export async function getVisionMarketCap(estimatedSubscribers: number = 100): Promise<{
  totalMarketCap: number;
  baseMarketCap: number;
  membershipContribution: number;
  organicValue: number;
  membershipMultiplier: number;
  totalVisions: number;
  totalScore: number;
}> {
  try {
    const platformStats = await getPlatformVisionStats();
    
    // Calculate membership multiplier
    const membershipMultiplier = calculateMembershipMultiplier(estimatedSubscribers);
    
    // Base market cap (foundation)
    const baseMarketCap = MEMBERSHIP_ECONOMICS.baseMarketCap;
    
    // Membership contribution pool (monthly injection)
    // Assuming average 6 months of contributions per subscriber
    const membershipContribution = estimatedSubscribers * MEMBERSHIP_ECONOMICS.monthlyContributionPerMember * 6;
    
    // Organic value from scores (views, downloads, trades, prints)
    const organicValue = platformStats.totalScore * MEMBERSHIP_ECONOMICS.valuePerScorePoint * membershipMultiplier;
    
    // Get total vision count
    const { count } = await supabase
      .from('saved_visualizations')
      .select('id', { count: 'exact', head: true });
    
    const totalMarketCap = baseMarketCap + membershipContribution + organicValue;
    
    return {
      totalMarketCap: Math.round(totalMarketCap * 100) / 100,
      baseMarketCap,
      membershipContribution: Math.round(membershipContribution * 100) / 100,
      organicValue: Math.round(organicValue * 100) / 100,
      membershipMultiplier: Math.round(membershipMultiplier * 100) / 100,
      totalVisions: count || 0,
      totalScore: platformStats.totalScore,
    };
  } catch (error) {
    console.error('Error calculating market cap:', error);
    return {
      totalMarketCap: MEMBERSHIP_ECONOMICS.baseMarketCap,
      baseMarketCap: MEMBERSHIP_ECONOMICS.baseMarketCap,
      membershipContribution: 0,
      organicValue: 0,
      membershipMultiplier: 1.0,
      totalVisions: 0,
      totalScore: 0,
    };
  }
}

/**
 * Get a user's total vision portfolio value with membership appreciation
 */
export async function getUserPortfolioValue(
  userId: string,
  estimatedSubscribers: number = 100
): Promise<{
  totalValue: number;
  visionCount: number;
  totalScore: number;
  membershipMultiplier: number;
  appreciationFromMemberships: number;
}> {
  try {
    const { data: visualizations } = await supabase
      .from('saved_visualizations')
      .select('id')
      .eq('user_id', userId);

    if (!visualizations || visualizations.length === 0) {
      return { 
        totalValue: 0, 
        visionCount: 0, 
        totalScore: 0,
        membershipMultiplier: 1.0,
        appreciationFromMemberships: 0,
      };
    }

    const vizIds = visualizations.map(v => v.id);
    const { data: scores } = await supabase
      .from('vision_scores')
      .select('*')
      .in('visualization_id', vizIds);

    const membershipMultiplier = calculateMembershipMultiplier(estimatedSubscribers);
    
    let totalValueWithMultiplier = 0;
    let totalValueWithoutMultiplier = 0;
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
        royaltyCentsEarned: scoreData.royalty_cents_earned || 0,
        royaltyOrdersCount: scoreData.royalty_orders_count || 0,
      };
      totalValueWithMultiplier += calculateVisionValue(score, membershipMultiplier);
      totalValueWithoutMultiplier += calculateVisionValue(score, 1.0);
      totalScore += score.totalScore;
    }

    // Add base value for visions without scores yet
    const visionsWithoutScores = visualizations.length - (scores?.length || 0);
    const baseVisionValue = 2.50 * membershipMultiplier; // $2.50 base value per vision
    totalValueWithMultiplier += visionsWithoutScores * baseVisionValue;
    totalValueWithoutMultiplier += visionsWithoutScores * 2.50;

    return {
      totalValue: Math.round(totalValueWithMultiplier * 100) / 100,
      visionCount: visualizations.length,
      totalScore,
      membershipMultiplier: Math.round(membershipMultiplier * 100) / 100,
      appreciationFromMemberships: Math.round((totalValueWithMultiplier - totalValueWithoutMultiplier) * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting user portfolio value:', error);
    return { 
      totalValue: 0, 
      visionCount: 0, 
      totalScore: 0,
      membershipMultiplier: 1.0,
      appreciationFromMemberships: 0,
    };
  }
}

/**
 * Calculate projected market appreciation for investor presentation
 */
export function calculateProjectedMarketCap(subscriberTargets: number[]): {
  subscribers: number;
  marketCap: number;
  multiplier: number;
  monthlyContribution: number;
}[] {
  return subscriberTargets.map(subscribers => {
    const multiplier = calculateMembershipMultiplier(subscribers);
    const monthlyContribution = subscribers * MEMBERSHIP_ECONOMICS.monthlyContributionPerMember;
    const annualContribution = monthlyContribution * 12;
    const marketCap = MEMBERSHIP_ECONOMICS.baseMarketCap + annualContribution;
    
    return {
      subscribers,
      marketCap: Math.round(marketCap),
      multiplier: Math.round(multiplier * 100) / 100,
      monthlyContribution: Math.round(monthlyContribution * 100) / 100,
    };
  });
}
