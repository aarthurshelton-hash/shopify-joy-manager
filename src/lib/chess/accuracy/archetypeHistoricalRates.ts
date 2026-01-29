/**
 * Archetype Historical Win Rates
 * v7.56-SMART-FALLBACK: Use archetype history for intelligent fallbacks
 * 
 * When hybrid prediction times out, use historical archetype win rates
 * instead of random 33/33/34% guess.
 */

import { StrategicArchetype } from '../colorFlowAnalysis';
import { supabase } from '@/integrations/supabase/client';

export interface ArchetypeStats {
  archetype: StrategicArchetype;
  totalGames: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  whiteWinRate: number;
  blackWinRate: number;
  drawRate: number;
}

// Cache for archetype stats (refreshed every 5 minutes)
let cachedStats: Map<StrategicArchetype, ArchetypeStats> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Default rates when no historical data available
 * Based on general chess statistics (white slight advantage)
 */
/**
 * v8.02-CALIBRATED: Balanced default rates matching actual archetypes
 * Key fix: Use SYMMETRIC rates (equal white/black) since dominantSide handles bias
 */
const DEFAULT_RATES: Record<string, { white: number; black: number; draw: number }> = {
  // Attack archetypes - decisive outcomes
  kingside_attack: { white: 0.40, black: 0.40, draw: 0.20 },
  queenside_expansion: { white: 0.40, black: 0.40, draw: 0.20 },
  sacrificial_attack: { white: 0.42, black: 0.42, draw: 0.16 },
  opposite_castling: { white: 0.42, black: 0.42, draw: 0.16 },
  pawn_storm: { white: 0.42, black: 0.42, draw: 0.16 },
  
  // Central/positional archetypes
  central_domination: { white: 0.38, black: 0.38, draw: 0.24 },
  positional_squeeze: { white: 0.38, black: 0.38, draw: 0.24 },
  piece_harmony: { white: 0.36, black: 0.36, draw: 0.28 },
  
  // Tactical archetypes
  open_tactical: { white: 0.40, black: 0.40, draw: 0.20 },
  
  // Defensive/slow archetypes - higher draw rates
  closed_maneuvering: { white: 0.32, black: 0.32, draw: 0.36 },
  prophylactic_defense: { white: 0.30, black: 0.30, draw: 0.40 },
  endgame_technique: { white: 0.34, black: 0.34, draw: 0.32 },
  
  // Fallback for any unmapped archetypes
  default: { white: 0.36, black: 0.36, draw: 0.28 },
};

/**
 * Load archetype statistics from database
 */
export async function loadArchetypeStats(): Promise<Map<StrategicArchetype, ArchetypeStats>> {
  // Return cache if still valid
  if (Date.now() - cacheTimestamp < CACHE_TTL && cachedStats.size > 0) {
    return cachedStats;
  }

  try {
    // Query prediction attempts grouped by archetype
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, actual_result, hybrid_correct')
      .not('hybrid_archetype', 'eq', 'FALLBACK')
      .not('actual_result', 'is', null);

    if (error) {
      console.warn('[v7.56] Failed to load archetype stats:', error);
      return cachedStats;
    }

    // Aggregate by archetype
    const statsMap = new Map<string, { white: number; black: number; draw: number; total: number }>();

    for (const row of data || []) {
      const arch = row.hybrid_archetype || 'unknown';
      const existing = statsMap.get(arch) || { white: 0, black: 0, draw: 0, total: 0 };

      existing.total++;
      if (row.actual_result === 'white_wins') existing.white++;
      else if (row.actual_result === 'black_wins') existing.black++;
      else if (row.actual_result === 'draw') existing.draw++;

      statsMap.set(arch, existing);
    }

    // Convert to ArchetypeStats
    cachedStats = new Map();
    for (const [arch, counts] of statsMap) {
      if (counts.total >= 3) { // Only include archetypes with enough data
        cachedStats.set(arch as StrategicArchetype, {
          archetype: arch as StrategicArchetype,
          totalGames: counts.total,
          whiteWins: counts.white,
          blackWins: counts.black,
          draws: counts.draw,
          whiteWinRate: counts.white / counts.total,
          blackWinRate: counts.black / counts.total,
          drawRate: counts.draw / counts.total,
        });
      }
    }

    cacheTimestamp = Date.now();
    console.log(`[v7.56] Loaded archetype stats for ${cachedStats.size} archetypes`);

    return cachedStats;
  } catch (err) {
    console.warn('[v7.56] Error loading archetype stats:', err);
    return cachedStats;
  }
}

/**
 * Get prediction based on archetype historical win rates
 * Returns the most likely outcome based on historical data
 */
export function getArchetypePrediction(
  archetype: StrategicArchetype,
  dominantSide?: 'white' | 'black' | 'contested'
): {
  prediction: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
  probabilities: { white: number; black: number; draw: number };
  source: 'historical' | 'default';
} {
  // Check cached historical data first
  const stats = cachedStats.get(archetype);

  if (stats && stats.totalGames >= 5) {
    // Use historical data
    const probs = {
      white: stats.whiteWinRate,
      black: stats.blackWinRate,
      draw: stats.drawRate,
    };

    // Adjust slightly based on dominant side if available
    if (dominantSide === 'white') {
      probs.white = Math.min(0.95, probs.white * 1.1);
      probs.black = probs.black * 0.9;
    } else if (dominantSide === 'black') {
      probs.black = Math.min(0.95, probs.black * 1.1);
      probs.white = probs.white * 0.9;
    }

    // Normalize
    const total = probs.white + probs.black + probs.draw;
    probs.white /= total;
    probs.black /= total;
    probs.draw /= total;

    // Determine prediction
    let prediction: 'white_wins' | 'black_wins' | 'draw';
    let maxProb: number;

    if (probs.white >= probs.black && probs.white >= probs.draw) {
      prediction = 'white_wins';
      maxProb = probs.white;
    } else if (probs.black >= probs.draw) {
      prediction = 'black_wins';
      maxProb = probs.black;
    } else {
      prediction = 'draw';
      maxProb = probs.draw;
    }

    // Confidence scales with sample size and probability margin
    const sampleFactor = Math.min(1, stats.totalGames / 20);
    const marginFactor = maxProb - 0.33; // How much above random
    const confidence = Math.min(70, 35 + (marginFactor * 100) * sampleFactor);

    return {
      prediction,
      confidence,
      probabilities: probs,
      source: 'historical',
    };
  }

  // Fall back to default rates
  const defaults = DEFAULT_RATES[archetype] || DEFAULT_RATES.default;
  const probs = { ...defaults };

  // Adjust based on dominant side
  if (dominantSide === 'white') {
    probs.white = Math.min(0.95, probs.white * 1.15);
    probs.black = probs.black * 0.85;
  } else if (dominantSide === 'black') {
    probs.black = Math.min(0.95, probs.black * 1.15);
    probs.white = probs.white * 0.85;
  }

  // Normalize
  const total = probs.white + probs.black + probs.draw;
  probs.white /= total;
  probs.black /= total;
  probs.draw /= total;

  let prediction: 'white_wins' | 'black_wins' | 'draw';
  if (probs.white >= probs.black && probs.white >= probs.draw) {
    prediction = 'white_wins';
  } else if (probs.black >= probs.draw) {
    prediction = 'black_wins';
  } else {
    prediction = 'draw';
  }

  return {
    prediction,
    confidence: 40, // Lower confidence for default rates
    probabilities: probs,
    source: 'default',
  };
}

/**
 * Invalidate the cache (call after new predictions are saved)
 */
export function invalidateArchetypeCache(): void {
  cacheTimestamp = 0;
}
