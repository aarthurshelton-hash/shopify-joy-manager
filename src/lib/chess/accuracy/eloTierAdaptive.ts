/**
 * ELO-Tier Adaptive Sampling - Priority 4.2
 * 
 * Sample more from ELO tiers where we have lower accuracy
 * to accelerate learning in weak areas.
 * 
 * Patent Pending - Alec Arthur Shelton
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// ELO TIER DEFINITIONS
// ============================================================================

export interface EloTier {
  name: string;
  range: [number, number];
  baseWeight: number;  // Default sampling weight
  description: string;
}

export const ELO_TIERS: EloTier[] = [
  { name: 'super_gm', range: [2700, 3500], baseWeight: 0.30, description: 'Super GM (2700+)' },
  { name: 'grandmaster', range: [2500, 2700], baseWeight: 0.25, description: 'Grandmaster (2500-2700)' },
  { name: 'international_master', range: [2300, 2500], baseWeight: 0.20, description: 'IM (2300-2500)' },
  { name: 'master', range: [2000, 2300], baseWeight: 0.15, description: 'Master (2000-2300)' },
  { name: 'club_player', range: [1500, 2000], baseWeight: 0.07, description: 'Club (1500-2000)' },
  { name: 'beginner', range: [800, 1500], baseWeight: 0.03, description: 'Beginner (<1500)' },
];

export interface EloPerformance {
  accuracy: number;
  total: number;
  lastUpdated: number;
}

export interface AdaptiveWeights {
  tier: string;
  originalWeight: number;
  adaptedWeight: number;
  accuracy: number;
  sampleCount: number;
  adaptationReason: string;
}

// ============================================================================
// PERFORMANCE CACHE
// ============================================================================

const performanceCache: Map<string, EloPerformance> = new Map();
let cacheLastUpdated = 0;
const CACHE_TTL_MS = 60000; // 1 minute

// ============================================================================
// ADAPTIVE WEIGHT CALCULATION
// ============================================================================

/**
 * Get adaptive tier weights based on current performance
 * 
 * Logic:
 * - Underperforming tiers (<55% accuracy with 20+ samples) get 50% more weight
 * - Well-performing tiers (>70% accuracy) get normal weight
 * - Very well-performing tiers (>80% accuracy) get slightly reduced weight
 * 
 * This ensures we sample more from areas where we need to learn.
 */
export function getAdaptiveTierWeights(
  eloPerformance: Map<string, EloPerformance>
): AdaptiveWeights[] {
  const results: AdaptiveWeights[] = [];
  let totalWeight = 0;
  
  // First pass: calculate raw adjusted weights
  for (const tier of ELO_TIERS) {
    const perf = eloPerformance.get(tier.name);
    let adaptedWeight = tier.baseWeight;
    let adaptationReason = 'Base weight';
    
    if (perf && perf.total >= 20) {
      if (perf.accuracy < 0.55) {
        // Underperforming - increase sampling
        adaptedWeight = tier.baseWeight * 1.5;
        adaptationReason = `Underperforming (${(perf.accuracy * 100).toFixed(1)}% < 55%)`;
      } else if (perf.accuracy > 0.80) {
        // Very well performing - slightly reduce
        adaptedWeight = tier.baseWeight * 0.85;
        adaptationReason = `Well-performing (${(perf.accuracy * 100).toFixed(1)}% > 80%)`;
      } else if (perf.accuracy > 0.70) {
        // Good - maintain
        adaptationReason = `Good accuracy (${(perf.accuracy * 100).toFixed(1)}%)`;
      }
    } else if (perf && perf.total < 20) {
      adaptationReason = `Insufficient samples (${perf.total})`;
    }
    
    totalWeight += adaptedWeight;
    
    results.push({
      tier: tier.name,
      originalWeight: tier.baseWeight,
      adaptedWeight,
      accuracy: perf?.accuracy ?? 0.5,
      sampleCount: perf?.total ?? 0,
      adaptationReason,
    });
  }
  
  // Normalize to sum to 1.0
  for (const result of results) {
    result.adaptedWeight = result.adaptedWeight / totalWeight;
  }
  
  return results;
}

/**
 * Get the ELO tier for a given rating
 */
export function getEloTier(elo: number): EloTier | null {
  for (const tier of ELO_TIERS) {
    if (elo >= tier.range[0] && elo < tier.range[1]) {
      return tier;
    }
  }
  return null;
}

/**
 * Get the average ELO tier for a game
 */
export function getGameEloTier(whiteElo: number, blackElo: number): string {
  const avgElo = (whiteElo + blackElo) / 2;
  const tier = getEloTier(avgElo);
  return tier?.name ?? 'unknown';
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Load ELO tier performance from database
 */
export async function loadEloTierPerformance(): Promise<Map<string, EloPerformance>> {
  if (Date.now() - cacheLastUpdated < CACHE_TTL_MS && performanceCache.size > 0) {
    return performanceCache;
  }
  
  console.log('[EloTierAdaptive] Loading ELO tier performance from database...');
  
  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('white_elo, black_elo, hybrid_correct')
      .not('white_elo', 'is', null)
      .not('black_elo', 'is', null)
      .limit(20000);
    
    if (error || !data) {
      console.warn('[EloTierAdaptive] Could not load from database:', error);
      return performanceCache;
    }
    
    // Group by tier
    const tierStats: Map<string, { correct: number; total: number }> = new Map();
    
    for (const row of data) {
      const tierName = getGameEloTier(row.white_elo, row.black_elo);
      const stats = tierStats.get(tierName) || { correct: 0, total: 0 };
      stats.total++;
      if (row.hybrid_correct) stats.correct++;
      tierStats.set(tierName, stats);
    }
    
    // Convert to performance map
    performanceCache.clear();
    for (const [tierName, stats] of tierStats.entries()) {
      performanceCache.set(tierName, {
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0.5,
        total: stats.total,
        lastUpdated: Date.now(),
      });
    }
    
    cacheLastUpdated = Date.now();
    
    // Log summary
    console.log('[EloTierAdaptive] ELO tier performance:');
    for (const tier of ELO_TIERS) {
      const perf = performanceCache.get(tier.name);
      if (perf) {
        console.log(`  ${tier.name}: ${(perf.accuracy * 100).toFixed(1)}% (n=${perf.total})`);
      }
    }
    
    return performanceCache;
    
  } catch (err) {
    console.error('[EloTierAdaptive] Error loading from database:', err);
    return performanceCache;
  }
}

/**
 * Get current adaptive weights (loads from DB if needed)
 */
export async function getCurrentAdaptiveWeights(): Promise<AdaptiveWeights[]> {
  const performance = await loadEloTierPerformance();
  return getAdaptiveTierWeights(performance);
}

/**
 * Log adaptive weight decisions for debugging
 */
export async function logAdaptiveWeightDecisions(): Promise<void> {
  const weights = await getCurrentAdaptiveWeights();
  
  console.log('[EloTierAdaptive] ═══════════════════════════════════════');
  console.log('[EloTierAdaptive] Adaptive Sampling Weights:');
  
  for (const w of weights) {
    const change = ((w.adaptedWeight / w.originalWeight) - 1) * 100;
    const changeStr = change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    console.log(`[EloTierAdaptive] ${w.tier}: ${(w.originalWeight * 100).toFixed(0)}% → ${(w.adaptedWeight * 100).toFixed(0)}% (${changeStr}) | ${w.adaptationReason}`);
  }
  
  console.log('[EloTierAdaptive] ═══════════════════════════════════════');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Select a tier based on adaptive weights
 */
export function selectTierByWeight(weights: AdaptiveWeights[]): string {
  const random = Math.random();
  let cumulative = 0;
  
  for (const w of weights) {
    cumulative += w.adaptedWeight;
    if (random <= cumulative) {
      return w.tier;
    }
  }
  
  // Fallback to last tier
  return weights[weights.length - 1].tier;
}

/**
 * Get tier statistics summary
 */
export function getTierStatsSummary(weights: AdaptiveWeights[]): {
  weakestTier: string;
  strongestTier: string;
  totalSamples: number;
  averageAccuracy: number;
} {
  let weakest = weights[0];
  let strongest = weights[0];
  let totalSamples = 0;
  let weightedAccuracy = 0;
  
  for (const w of weights) {
    if (w.sampleCount > 10) {
      if (w.accuracy < weakest.accuracy) weakest = w;
      if (w.accuracy > strongest.accuracy) strongest = w;
    }
    totalSamples += w.sampleCount;
    weightedAccuracy += w.accuracy * w.sampleCount;
  }
  
  return {
    weakestTier: weakest.tier,
    strongestTier: strongest.tier,
    totalSamples,
    averageAccuracy: totalSamples > 0 ? weightedAccuracy / totalSamples : 0.5,
  };
}
