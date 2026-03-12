/**
 * Archetype Calibration v8.07c-BREAKTHROUGH-MAXIMIZER
 * 
 * Data-driven confidence adjustments optimized for DISAGREEMENT WINS
 * 
 * Key insight: Every SF miss is our opportunity to shine
 *              Strong archetypes (>50%) should NEVER defer to SF
 *              Weak SF signals are BREAKTHROUGH territory
 * 
 * Strategy: 
 * - Boost on agreement (56% historical)
 * - TRUST pattern recognition on disagreements
 * - Only defer in absolute extreme cases (>350cp) with weak archetypes
 */

import { StrategicArchetype } from './types';

/**
 * Historical accuracy by archetype (from database analysis)
 * Updated from actual chess_prediction_attempts data
 */
/**
 * Hardcoded fallback weights — used when live weights are unavailable.
 * These are the initial values from the first database snapshot.
 */
// Updated from fusion-intelligence.mjs ARCHETYPE_ACCURACY (10M+ games, Mar 2026).
// These are fallbacks used ONLY when live DB weights are unavailable (cold start / DB outage).
const HARDCODED_ACCURACY: Record<string, {
  hybridAccuracy: number;
  sfAccuracy: number;
  agreementRate: number;
  sampleSize: number;
}> = {
  sacrificial_queenside_break: { hybridAccuracy: 0.639, sfAccuracy: 0.58, agreementRate: 0.70, sampleSize: 128000 },
  sacrificial_kingside_assault: { hybridAccuracy: 0.631, sfAccuracy: 0.57, agreementRate: 0.68, sampleSize: 96000 },
  king_hunt:                { hybridAccuracy: 0.615, sfAccuracy: 0.56, agreementRate: 0.65, sampleSize: 5000 },
  queenside_expansion:      { hybridAccuracy: 0.610, sfAccuracy: 0.55, agreementRate: 0.67, sampleSize: 244000 },
  kingside_attack:          { hybridAccuracy: 0.608, sfAccuracy: 0.55, agreementRate: 0.66, sampleSize: 195000 },
  sacrificial_attack:       { hybridAccuracy: 0.604, sfAccuracy: 0.54, agreementRate: 0.65, sampleSize: 135000 },
  positional_squeeze:       { hybridAccuracy: 0.592, sfAccuracy: 0.53, agreementRate: 0.63, sampleSize: 94000 },
  balanced_flow:            { hybridAccuracy: 0.577, sfAccuracy: 0.52, agreementRate: 0.62, sampleSize: 9000 },
  central_domination:       { hybridAccuracy: 0.574, sfAccuracy: 0.52, agreementRate: 0.63, sampleSize: 19000 },
  closed_maneuvering:       { hybridAccuracy: 0.565, sfAccuracy: 0.51, agreementRate: 0.60, sampleSize: 148000 },
  pawn_storm:               { hybridAccuracy: 0.564, sfAccuracy: 0.51, agreementRate: 0.60, sampleSize: 1000 },
  piece_harmony:            { hybridAccuracy: 0.487, sfAccuracy: 0.48, agreementRate: 0.58, sampleSize: 3000 },
  central_knight_outpost:   { hybridAccuracy: 0.486, sfAccuracy: 0.47, agreementRate: 0.56, sampleSize: 4000 },
  open_tactical:            { hybridAccuracy: 0.530, sfAccuracy: 0.49, agreementRate: 0.58, sampleSize: 5000 },
  endgame_technique:        { hybridAccuracy: 0.565, sfAccuracy: 0.53, agreementRate: 0.65, sampleSize: 20000 },
  prophylactic_defense:     { hybridAccuracy: 0.530, sfAccuracy: 0.50, agreementRate: 0.60, sampleSize: 5000 },
  opposite_castling:        { hybridAccuracy: 0.550, sfAccuracy: 0.50, agreementRate: 0.60, sampleSize: 3000 },
  development_focus:        { hybridAccuracy: 0.302, sfAccuracy: 0.40, agreementRate: 0.35, sampleSize: 1000 },
  unknown:                  { hybridAccuracy: 0.604, sfAccuracy: 0.54, agreementRate: 0.62, sampleSize: 10000 },
};

/**
 * Runtime override store for live weights.
 * Call updateLiveArchetypeWeights() to inject fresh data from Supabase/farm.
 * When set, these override the hardcoded fallback for any archetype present.
 */
let liveWeightsOverride: Record<string, {
  hybridAccuracy: number;
  sfAccuracy: number;
  agreementRate: number;
  sampleSize: number;
}> | null = null;

/**
 * Inject live archetype weights at runtime.
 * Called by the web app after fetching from Supabase or the farm's live-archetype-weights.json.
 * Puzzle calibration data (detection accuracy) is already merged into these weights by the farm.
 */
export function updateLiveArchetypeWeights(weights: Record<string, {
  hybridAccuracy: number;
  sfAccuracy: number;
  agreementRate: number;
  sampleSize: number;
}>) {
  liveWeightsOverride = weights;
}

/**
 * Get the effective accuracy stats for an archetype.
 * Prefers live weights (which include puzzle calibration), falls back to hardcoded.
 */
function getEffectiveStats(archetype: StrategicArchetype) {
  return liveWeightsOverride?.[archetype] || HARDCODED_ACCURACY[archetype] || HARDCODED_ACCURACY.unknown;
}

/**
 * Exported for backward compatibility — returns hardcoded + live merged.
 * Consumers should prefer getEffectiveStats() internally.
 */
export const ARCHETYPE_HISTORICAL_ACCURACY = new Proxy(HARDCODED_ACCURACY, {
  get(target, prop: string) {
    if (liveWeightsOverride?.[prop]) return liveWeightsOverride[prop];
    return target[prop as keyof typeof target];
  }
}) as Record<StrategicArchetype, {
  hybridAccuracy: number;
  sfAccuracy: number;
  agreementRate: number;
  sampleSize: number;
}>;

export interface CalibrationResult {
  /** Adjusted confidence after calibration */
  adjustedConfidence: number;
  /** Should we defer to Stockfish? */
  deferToStockfish: boolean;
  /** Multiplier applied */
  confidenceMultiplier: number;
  /** Reason for adjustment */
  reason: string;
}

/**
 * Calculate calibrated confidence based on:
 * 1. Agreement between Hybrid and SF predictions
 * 2. Historical archetype accuracy
 * 3. Stockfish eval strength
 */
export function calibrateConfidence(
  archetype: StrategicArchetype,
  hybridPrediction: string,
  sfPrediction: string,
  baseConfidence: number,
  sfEval: number
): CalibrationResult {
  const stats = getEffectiveStats(archetype);
  
  // Check if predictions agree
  const agree = hybridPrediction === sfPrediction;
  
  // v8.07c: BREAKTHROUGH-MAXIMIZER
  // ONLY defer in absolute extreme tactical situations
  // Every SF miss is an opportunity for pattern recognition to shine
  const absoluteExtremeSfSignal = Math.abs(sfEval) > 350; // Raised from 250cp
  const extremeSfSignal = Math.abs(sfEval) > 250;
  const strongSfSignal = Math.abs(sfEval) > 150;
  
  // Is this a strong archetype that should NEVER defer?
  const isStrongArchetype = stats.hybridAccuracy >= 0.50;
  const isDecentArchetype = stats.hybridAccuracy >= 0.45;
  
  let multiplier = 1.0;
  let reason = '';
  let deferToStockfish = false;
  
  if (agree) {
    // AGREEMENT CASE: Both predict the same outcome
    // Historical: 56% accuracy when agreeing - this is our reliable zone
    
    if (isStrongArchetype) {
      multiplier = 1.18; // Boost strong archetypes more
      reason = `Agreement + elite ${archetype} (${(stats.hybridAccuracy * 100).toFixed(0)}% historical)`;
    } else if (isDecentArchetype) {
      multiplier = 1.10; // Good archetype
      reason = `Agreement on ${archetype}`;
    } else {
      multiplier = 1.02; // Even weak archetypes get slight boost on agreement
      reason = `Agreement, moderate archetype ${archetype}`;
    }
    
    // Extra boost for strong SF confirmation
    if (strongSfSignal) {
      multiplier *= 1.08;
      reason += ' + SF confirms';
    }
  } else {
    // DISAGREEMENT CASE: This is our BREAKTHROUGH TERRITORY
    // v8.07c: Trust pattern recognition MUCH more aggressively
    // SF sees snapshots, we see trajectories
    
    if (isStrongArchetype) {
      // STRONG ARCHETYPES (>50%): NEVER defer to SF
      // These are our best performers - trust them fully
      if (absoluteExtremeSfSignal) {
        // Even in extreme cases, still trust strong archetypes
        multiplier = 0.92; // Minimal penalty
        reason = `Disagree, SF extreme but ${archetype} elite - TRUST PATTERN`;
      } else if (extremeSfSignal) {
        multiplier = 0.98; // Almost no penalty
        reason = `Disagree, ${archetype} elite vs SF - BREAKTHROUGH ZONE`;
      } else if (strongSfSignal) {
        multiplier = 1.0; // No penalty at all
        reason = `Disagree, strong ${archetype} vs moderate SF - OPPORTUNITY`;
      } else {
        // Weak SF eval - BOOST our confidence!
        multiplier = 1.05; // Actually boost on weak SF disagreement
        reason = `Disagree, weak SF, elite ${archetype} - CAPITALIZE`;
      }
    } else if (isDecentArchetype) {
      // DECENT ARCHETYPES (45-50%): Only defer in absolute extreme
      if (absoluteExtremeSfSignal) {
        deferToStockfish = true;
        multiplier = 0.82;
        reason = `Disagree, SF absolute extreme (${sfEval}cp), defer`;
      } else if (extremeSfSignal) {
        multiplier = 0.90; // Moderate penalty
        reason = `Disagree, ${archetype} decent vs SF extreme - cautious`;
      } else if (strongSfSignal) {
        multiplier = 0.95; // Slight penalty
        reason = `Disagree, ${archetype} decent - OPPORTUNITY`;
      } else {
        multiplier = 1.0; // No penalty for weak SF
        reason = `Disagree, weak SF, decent ${archetype} - BREAKTHROUGH`;
      }
    } else {
      // WEAK ARCHETYPES (<45%): More cautious but still don't over-defer
      if (absoluteExtremeSfSignal) {
        deferToStockfish = true;
        multiplier = 0.78;
        reason = `Disagree, SF extreme (${sfEval}cp), weak archetype - defer`;
      } else if (extremeSfSignal) {
        deferToStockfish = true;
        multiplier = 0.82;
        reason = `Disagree, SF strong, weak ${archetype}`;
      } else if (strongSfSignal) {
        multiplier = 0.88;
        reason = `Disagree, SF moderate, weak archetype - cautious trust`;
      } else {
        // Even weak archetypes get a shot with weak SF
        multiplier = 0.95;
        reason = `Disagree, weak SF, test ${archetype}`;
      }
    }
  }
  
  // Apply archetype-specific ceiling based on historical accuracy
  // v8.07c: Raise ceiling for strong archetypes
  const archetypeCeiling = isStrongArchetype 
    ? 40 + (stats.hybridAccuracy * 100) // Higher ceiling for elite
    : 30 + (stats.hybridAccuracy * 100);
  
  const adjustedConfidence = Math.min(
    archetypeCeiling,
    Math.round(baseConfidence * multiplier)
  );
  
  return {
    adjustedConfidence: Math.max(25, Math.min(88, adjustedConfidence)),
    deferToStockfish,
    confidenceMultiplier: multiplier,
    reason,
  };
}

/**
 * Get SF-based prediction from centipawn evaluation
 */
export function getSfPrediction(sfEval: number): 'white_wins' | 'black_wins' | 'draw' {
  if (sfEval > 50) return 'white_wins';
  if (sfEval < -50) return 'black_wins';
  return 'draw';
}

/**
 * Eliminate FALLBACK/unknown by force-assigning closest archetype
 */
export function forceArchetypeAssignment(
  currentArchetype: StrategicArchetype,
  dominantSide: 'white' | 'black' | 'contested',
  flowDirection: string,
  intensity: number
): StrategicArchetype {
  // If not unknown, return as-is
  if (currentArchetype !== 'unknown') {
    return currentArchetype;
  }
  
  // Force-assign based on available signals
  if (intensity > 60) {
    // High intensity suggests tactical battle
    if (flowDirection === 'kingside') return 'kingside_attack';
    if (flowDirection === 'queenside') return 'queenside_expansion';
    return 'open_tactical';
  }
  
  if (intensity < 30) {
    // Low intensity suggests positional play
    if (dominantSide === 'contested') return 'prophylactic_defense';
    return 'closed_maneuvering';
  }
  
  // Medium intensity - use flow direction
  switch (flowDirection) {
    case 'kingside': return 'piece_harmony';
    case 'queenside': return 'positional_squeeze';
    case 'central': return 'central_domination';
    case 'diagonal': return 'opposite_castling';
    default: return 'piece_harmony'; // Best-performing default
  }
}
