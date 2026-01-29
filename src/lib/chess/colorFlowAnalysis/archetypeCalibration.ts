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
export const ARCHETYPE_HISTORICAL_ACCURACY: Record<StrategicArchetype, {
  hybridAccuracy: number;
  sfAccuracy: number;
  agreementRate: number;
  sampleSize: number;
}> = {
  piece_harmony: { hybridAccuracy: 0.53, sfAccuracy: 0.51, agreementRate: 0.62, sampleSize: 1200 },
  kingside_attack: { hybridAccuracy: 0.51, sfAccuracy: 0.49, agreementRate: 0.58, sampleSize: 800 },
  queenside_expansion: { hybridAccuracy: 0.48, sfAccuracy: 0.52, agreementRate: 0.55, sampleSize: 600 },
  central_domination: { hybridAccuracy: 0.50, sfAccuracy: 0.48, agreementRate: 0.60, sampleSize: 500 },
  endgame_technique: { hybridAccuracy: 0.49, sfAccuracy: 0.51, agreementRate: 0.65, sampleSize: 450 },
  open_tactical: { hybridAccuracy: 0.47, sfAccuracy: 0.53, agreementRate: 0.52, sampleSize: 400 },
  positional_squeeze: { hybridAccuracy: 0.52, sfAccuracy: 0.48, agreementRate: 0.58, sampleSize: 350 },
  pawn_storm: { hybridAccuracy: 0.46, sfAccuracy: 0.50, agreementRate: 0.54, sampleSize: 300 },
  sacrificial_attack: { hybridAccuracy: 0.44, sfAccuracy: 0.46, agreementRate: 0.48, sampleSize: 250 },
  opposite_castling: { hybridAccuracy: 0.45, sfAccuracy: 0.47, agreementRate: 0.50, sampleSize: 200 },
  closed_maneuvering: { hybridAccuracy: 0.354, sfAccuracy: 0.42, agreementRate: 0.45, sampleSize: 180 },
  prophylactic_defense: { hybridAccuracy: 0.42, sfAccuracy: 0.48, agreementRate: 0.52, sampleSize: 150 },
  unknown: { hybridAccuracy: 0.415, sfAccuracy: 0.45, agreementRate: 0.40, sampleSize: 805 },
};

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
  const stats = ARCHETYPE_HISTORICAL_ACCURACY[archetype] || ARCHETYPE_HISTORICAL_ACCURACY.unknown;
  
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
