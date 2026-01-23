/**
 * Temporal Phase Weighting - v7.53-ACCURACY
 * 
 * Varies pattern confidence based on game phase.
 * Opening patterns are less predictive than endgame patterns.
 */

export type GamePhase = 'opening' | 'early_middlegame' | 'late_middlegame' | 'endgame' | 'deep_endgame';

export interface PhaseWeight {
  phase: GamePhase;
  patternWeight: number;      // How much to trust pattern recognition
  tacticalWeight: number;     // How much to trust calculation
  horizonMultiplier: number;  // How far ahead predictions are reliable
  volatilityFactor: number;   // Expected position volatility
}

/**
 * Phase weights calibrated from historical data
 * Opening: Patterns less reliable (book moves dominate)
 * Endgame: Patterns highly reliable (technique over tactics)
 */
export const PHASE_WEIGHTS: Record<GamePhase, PhaseWeight> = {
  opening: {
    phase: 'opening',
    patternWeight: 0.3,
    tacticalWeight: 0.7,
    horizonMultiplier: 0.5,
    volatilityFactor: 0.8,
  },
  early_middlegame: {
    phase: 'early_middlegame',
    patternWeight: 0.5,
    tacticalWeight: 0.5,
    horizonMultiplier: 0.7,
    volatilityFactor: 0.9,
  },
  late_middlegame: {
    phase: 'late_middlegame',
    patternWeight: 0.6,
    tacticalWeight: 0.4,
    horizonMultiplier: 0.85,
    volatilityFactor: 0.7,
  },
  endgame: {
    phase: 'endgame',
    patternWeight: 0.75,
    tacticalWeight: 0.25,
    horizonMultiplier: 1.0,
    volatilityFactor: 0.4,
  },
  deep_endgame: {
    phase: 'deep_endgame',
    patternWeight: 0.85,
    tacticalWeight: 0.15,
    horizonMultiplier: 1.2,
    volatilityFactor: 0.2,
  },
};

/**
 * Determine game phase from move number and piece count
 */
export function detectGamePhase(moveNumber: number, pieceCount: number): GamePhase {
  // Deep endgame: very few pieces
  if (pieceCount <= 8) {
    return 'deep_endgame';
  }
  
  // Endgame: reduced material
  if (pieceCount <= 14) {
    return 'endgame';
  }
  
  // Opening: first 10-12 moves typically
  if (moveNumber <= 12) {
    return 'opening';
  }
  
  // Early middlegame
  if (moveNumber <= 25) {
    return 'early_middlegame';
  }
  
  // Late middlegame
  return 'late_middlegame';
}

/**
 * Get phase-adjusted confidence for a prediction
 */
export function getPhaseAdjustedConfidence(
  baseConfidence: number,
  moveNumber: number,
  pieceCount: number
): { confidence: number; phase: GamePhase; weights: PhaseWeight } {
  const phase = detectGamePhase(moveNumber, pieceCount);
  const weights = PHASE_WEIGHTS[phase];
  
  // Adjust confidence based on phase reliability
  const phaseMultiplier = weights.patternWeight + (weights.tacticalWeight * 0.5);
  const adjustedConfidence = Math.min(1, baseConfidence * phaseMultiplier * weights.horizonMultiplier);
  
  return {
    confidence: adjustedConfidence,
    phase,
    weights,
  };
}

/**
 * Calculate optimal prediction horizon based on phase
 */
export function getOptimalHorizon(phase: GamePhase, baseHorizon: number = 20): number {
  const weights = PHASE_WEIGHTS[phase];
  return Math.round(baseHorizon * weights.horizonMultiplier);
}

/**
 * Blend tactical and strategic scores based on phase
 */
export function blendScores(
  tacticalScore: number,
  strategicScore: number,
  phase: GamePhase
): number {
  const weights = PHASE_WEIGHTS[phase];
  return (tacticalScore * weights.tacticalWeight) + (strategicScore * weights.patternWeight);
}
