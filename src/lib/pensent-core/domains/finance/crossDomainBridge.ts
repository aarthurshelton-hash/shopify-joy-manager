/**
 * Cross-Domain Bridge: Chess ↔ Market
 * 
 * Feeds the active chess archetype distribution into market predictions,
 * enabling the 4th domain proof of cross-domain correlation.
 * 
 * Queries the most recent chess predictions from Supabase and extracts
 * the dominant archetype + confidence. This data is injected into
 * market predictions as chess_archetype_resonance and cross_domain_confidence.
 * 
 * RULES:
 * - Only real chess prediction data (from chess_prediction_attempts)
 * - No caching of stale data beyond 30 minutes
 * - Returns null when no recent chess data available (never fakes)
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChessResonanceSignal {
  dominantArchetype: string;
  confidence: number;
  sampleSize: number;
  accuracy: number;
  timestamp: number;
}

let cachedSignal: ChessResonanceSignal | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get the current chess archetype resonance signal.
 * Queries the last 100 chess predictions to find the dominant archetype
 * and its accuracy rate.
 */
export async function getChessResonanceSignal(): Promise<ChessResonanceSignal | null> {
  // Return cached if fresh
  if (cachedSignal && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSignal;
  }

  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, hybrid_correct, hybrid_confidence')
      .not('hybrid_archetype', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Count archetypes
    const archetypeCounts: Record<string, { total: number; correct: number; totalConfidence: number }> = {};
    for (const row of data) {
      const arch = row.hybrid_archetype || 'unknown';
      if (!archetypeCounts[arch]) {
        archetypeCounts[arch] = { total: 0, correct: 0, totalConfidence: 0 };
      }
      archetypeCounts[arch].total++;
      if (row.hybrid_correct) archetypeCounts[arch].correct++;
      archetypeCounts[arch].totalConfidence += (row.hybrid_confidence || 0);
    }

    // Find dominant archetype
    let dominant = 'unknown';
    let maxCount = 0;
    for (const [arch, counts] of Object.entries(archetypeCounts)) {
      if (counts.total > maxCount) {
        maxCount = counts.total;
        dominant = arch;
      }
    }

    const dominantData = archetypeCounts[dominant];
    const accuracy = dominantData.total > 0 ? dominantData.correct / dominantData.total : 0;
    const avgConfidence = dominantData.total > 0 ? dominantData.totalConfidence / dominantData.total : 0;

    const signal: ChessResonanceSignal = {
      dominantArchetype: dominant,
      confidence: Math.round(avgConfidence * 100) / 100,
      sampleSize: data.length,
      accuracy: Math.round(accuracy * 1000) / 10,
      timestamp: Date.now(),
    };

    cachedSignal = signal;
    cachedAt = Date.now();

    return signal;
  } catch (err) {
    console.error('[CrossDomainBridge] Error fetching chess resonance:', err);
    return null;
  }
}

/**
 * Map chess archetypes to market sentiment bias.
 * Returns a directional hint and weight (0-1).
 * 
 * Based on the archetypal universality thesis:
 * - Attack archetypes → bullish bias (aggressive commitment)
 * - Expansion archetypes → bullish bias (patient accumulation)
 * - Constriction archetypes → bearish bias (resource denial)
 * - Defensive archetypes → neutral/bearish (reactive posture)
 */
export function mapChessToMarketBias(archetype: string): {
  bias: 'bullish' | 'bearish' | 'neutral';
  weight: number;
  reasoning: string;
} {
  const archetypeMap: Record<string, { bias: 'bullish' | 'bearish' | 'neutral'; weight: number; reasoning: string }> = {
    kingside_attack: { bias: 'bullish', weight: 0.6, reasoning: 'Aggressive commitment → momentum play' },
    queenside_expansion: { bias: 'bullish', weight: 0.5, reasoning: 'Patient accumulation → value building' },
    central_domination: { bias: 'bullish', weight: 0.4, reasoning: 'Control of center → market stability' },
    positional_squeeze: { bias: 'bearish', weight: 0.5, reasoning: 'Resource denial → compression' },
    pawn_storm: { bias: 'bullish', weight: 0.7, reasoning: 'All-in push → breakout momentum' },
    defensive_fortress: { bias: 'neutral', weight: 0.3, reasoning: 'Defensive posture → consolidation' },
    endgame_technique: { bias: 'neutral', weight: 0.2, reasoning: 'Late-stage grinding → low volatility' },
    material_advantage: { bias: 'bullish', weight: 0.4, reasoning: 'Resource lead → accumulation phase' },
    tactical_chaos: { bias: 'neutral', weight: 0.1, reasoning: 'Unpredictable → high volatility, no direction' },
    opening_preparation: { bias: 'neutral', weight: 0.2, reasoning: 'Early stage → market opening' },
  };

  return archetypeMap[archetype] || { bias: 'neutral', weight: 0.1, reasoning: `Unknown archetype: ${archetype}` };
}
