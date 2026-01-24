/**
 * Phase Specialization v7.61
 * 
 * Separate prediction models for Opening, Middlegame, and Endgame.
 * Each phase uses specialized logic tuned for that game stage.
 * 
 * THEORY: Generalist models underperform specialists.
 * - Opening: Book knowledge + development patterns dominate
 * - Middlegame: Tactical complexity + strategic archetypes matter
 * - Endgame: Technique patterns + king activity are decisive
 */

import { GamePhase, detectGamePhase, PHASE_WEIGHTS } from './temporalPhaseWeighting';
import { ColorFlowSignature, StrategicArchetype } from '../colorFlowAnalysis';

// ===================== PHASE-SPECIFIC ARCHETYPE RELIABILITY =====================

/**
 * How reliable each archetype is during each phase.
 * 1.0 = highly predictive in this phase
 * 0.3 = unreliable in this phase
 */
export const ARCHETYPE_PHASE_RELIABILITY: Record<StrategicArchetype, Record<GamePhase, number>> = {
  // Opening-phase archetypes
  kingside_attack: {
    opening: 0.4,           // Too early to predict attacks
    early_middlegame: 0.7,
    late_middlegame: 0.9,
    endgame: 0.5,
    deep_endgame: 0.3,
  },
  queenside_expansion: {
    opening: 0.5,
    early_middlegame: 0.7,
    late_middlegame: 0.85,
    endgame: 0.7,
    deep_endgame: 0.6,
  },
  central_domination: {
    opening: 0.8,           // Central control is key in opening
    early_middlegame: 0.85,
    late_middlegame: 0.75,
    endgame: 0.5,
    deep_endgame: 0.4,
  },
  prophylactic_defense: {
    opening: 0.3,           // Prophylaxis rarely visible early
    early_middlegame: 0.6,
    late_middlegame: 0.8,
    endgame: 0.9,           // Very predictive in technique phase
    deep_endgame: 0.95,
  },
  pawn_storm: {
    opening: 0.3,
    early_middlegame: 0.6,
    late_middlegame: 0.85,
    endgame: 0.7,
    deep_endgame: 0.6,
  },
  piece_harmony: {
    opening: 0.7,           // Development harmony is key
    early_middlegame: 0.8,
    late_middlegame: 0.75,
    endgame: 0.5,
    deep_endgame: 0.4,
  },
  opposite_castling: {
    opening: 0.6,           // Can be detected early
    early_middlegame: 0.9,  // Peak predictive power
    late_middlegame: 0.85,
    endgame: 0.4,
    deep_endgame: 0.3,
  },
  closed_maneuvering: {
    opening: 0.4,
    early_middlegame: 0.6,
    late_middlegame: 0.9,   // Most predictive in slow positions
    endgame: 0.8,
    deep_endgame: 0.7,
  },
  open_tactical: {
    opening: 0.3,           // Tactics too volatile
    early_middlegame: 0.5,
    late_middlegame: 0.6,
    endgame: 0.4,
    deep_endgame: 0.3,
  },
  endgame_technique: {
    opening: 0.1,           // Completely irrelevant
    early_middlegame: 0.2,
    late_middlegame: 0.4,
    endgame: 0.95,          // Extremely predictive
    deep_endgame: 0.98,     // Peak reliability
  },
  sacrificial_attack: {
    opening: 0.2,           // Gambits visible but outcome unclear
    early_middlegame: 0.6,
    late_middlegame: 0.7,
    endgame: 0.3,
    deep_endgame: 0.2,
  },
  positional_squeeze: {
    opening: 0.3,
    early_middlegame: 0.6,
    late_middlegame: 0.9,   // Squeeze is slow, predictable
    endgame: 0.85,
    deep_endgame: 0.8,
  },
  unknown: {
    opening: 0.3,
    early_middlegame: 0.3,
    late_middlegame: 0.3,
    endgame: 0.3,
    deep_endgame: 0.3,
  },
};

// ===================== PHASE-SPECIFIC WIN RATE ADJUSTMENTS =====================

export interface PhaseAdjustedPrediction {
  originalWinRate: number;
  phaseAdjustedWinRate: number;
  phaseReliability: number;
  phase: GamePhase;
  shouldPredict: boolean;  // Whether confidence is high enough
  reasoning: string;
}

/**
 * Opening-phase specialist logic
 * - Development advantage is temporary
 * - Central control matters more than material
 * - Book knowledge dominates (lower prediction confidence)
 */
function applyOpeningSpecialization(
  signature: ColorFlowSignature,
  baseWinRate: number
): { adjustedRate: number; reasoning: string } {
  let adjusted = baseWinRate;
  const reasons: string[] = [];
  
  // Central domination in opening is more predictive
  if (signature.archetype === 'central_domination') {
    adjusted = adjusted * 1.1;  // Boost by 10%
    reasons.push('Central control is decisive in opening');
  }
  
  // Piece harmony (development) is key
  if (signature.archetype === 'piece_harmony') {
    adjusted = adjusted * 1.08;
    reasons.push('Development advantage compounds');
  }
  
  // Sacrificial attacks in opening are speculative
  if (signature.archetype === 'sacrificial_attack') {
    adjusted = baseWinRate * 0.95 + 0.50 * 0.05;  // Pull toward 50%
    reasons.push('Gambit outcomes highly volatile');
  }
  
  // Opening predictions should regress toward mean
  adjusted = adjusted * 0.7 + 0.50 * 0.3;  // 30% regression
  reasons.push('Opening phase: prediction regression applied');
  
  return { adjustedRate: Math.max(0.35, Math.min(0.65, adjusted)), reasoning: reasons.join('; ') };
}

/**
 * Middlegame specialist logic
 * - Tactical volatility is highest
 * - Archetype patterns are most reliable here
 * - Use full archetype win rates with minor adjustments
 */
function applyMiddlegameSpecialization(
  signature: ColorFlowSignature,
  baseWinRate: number,
  isLate: boolean
): { adjustedRate: number; reasoning: string } {
  let adjusted = baseWinRate;
  const reasons: string[] = [];
  
  // Late middlegame: positional patterns crystallize
  if (isLate) {
    // Squeeze and closed patterns become very predictive
    if (signature.archetype === 'positional_squeeze' || signature.archetype === 'closed_maneuvering') {
      adjusted = adjusted * 1.15;  // 15% boost
      reasons.push('Late middlegame: positional patterns reliable');
    }
    
    // Tactical chaos is still volatile
    if (signature.archetype === 'open_tactical') {
      adjusted = adjusted * 0.9 + 0.50 * 0.1;
      reasons.push('Tactical positions remain volatile');
    }
  } else {
    // Early middlegame: slight regression
    adjusted = adjusted * 0.85 + 0.50 * 0.15;
    reasons.push('Early middlegame: moderate prediction confidence');
  }
  
  // Dominant side amplification
  if (signature.dominantSide !== 'contested') {
    const dominantBoost = signature.intensity / 100 * 0.05;
    if (signature.dominantSide === 'white') {
      adjusted += dominantBoost;
    } else {
      adjusted -= dominantBoost;
    }
    reasons.push(`${signature.dominantSide} territorial advantage detected`);
  }
  
  return { adjustedRate: Math.max(0.25, Math.min(0.75, adjusted)), reasoning: reasons.join('; ') };
}

/**
 * Endgame specialist logic
 * - Technique patterns are HIGHLY predictive
 * - King activity is crucial
 * - Material advantage is often decisive
 * - MOST RELIABLE PHASE for trajectory prediction
 */
function applyEndgameSpecialization(
  signature: ColorFlowSignature,
  baseWinRate: number,
  isDeep: boolean
): { adjustedRate: number; reasoning: string } {
  let adjusted = baseWinRate;
  const reasons: string[] = [];
  
  // Endgame technique is nearly deterministic
  if (signature.archetype === 'endgame_technique') {
    // Very high confidence in endgame technique patterns
    if (isDeep) {
      adjusted = adjusted * 1.25;  // Strong boost
      reasons.push('Deep endgame: technique patterns highly reliable');
    } else {
      adjusted = adjusted * 1.15;
      reasons.push('Endgame: technique patterns predictive');
    }
  }
  
  // Prophylactic defense in endgame = fortress attempt
  if (signature.archetype === 'prophylactic_defense') {
    // Pull toward draw
    adjusted = adjusted * 0.7 + 0.50 * 0.3;
    reasons.push('Defensive fortress detected - draw likely');
  }
  
  // Positional squeeze in endgame is decisive
  if (signature.archetype === 'positional_squeeze') {
    adjusted = adjusted * 1.2;
    reasons.push('Positional squeeze converts well in endgame');
  }
  
  // Dominant side in endgame is very telling
  if (signature.dominantSide !== 'contested') {
    const endgameBoost = 0.10;  // 10% swing based on territory
    if (signature.dominantSide === 'white') {
      adjusted += endgameBoost;
      reasons.push('White has endgame territorial advantage');
    } else {
      adjusted -= endgameBoost;
      reasons.push('Black has endgame territorial advantage');
    }
  }
  
  // Deep endgame: minimal regression - we trust the patterns
  if (isDeep) {
    // Almost no regression in deep endgame
    adjusted = adjusted * 0.95 + 0.50 * 0.05;
  } else {
    adjusted = adjusted * 0.88 + 0.50 * 0.12;
  }
  
  return { adjustedRate: Math.max(0.15, Math.min(0.85, adjusted)), reasoning: reasons.join('; ') };
}

// ===================== MAIN API =====================

/**
 * Get phase-specialized prediction adjustment
 */
export function getPhaseSpecializedPrediction(
  signature: ColorFlowSignature,
  baseWinRate: number,
  moveNumber: number,
  pieceCount: number
): PhaseAdjustedPrediction {
  const phase = detectGamePhase(moveNumber, pieceCount);
  const phaseReliability = ARCHETYPE_PHASE_RELIABILITY[signature.archetype]?.[phase] ?? 0.5;
  
  let result: { adjustedRate: number; reasoning: string };
  
  switch (phase) {
    case 'opening':
      result = applyOpeningSpecialization(signature, baseWinRate);
      break;
    case 'early_middlegame':
      result = applyMiddlegameSpecialization(signature, baseWinRate, false);
      break;
    case 'late_middlegame':
      result = applyMiddlegameSpecialization(signature, baseWinRate, true);
      break;
    case 'endgame':
      result = applyEndgameSpecialization(signature, baseWinRate, false);
      break;
    case 'deep_endgame':
      result = applyEndgameSpecialization(signature, baseWinRate, true);
      break;
    default:
      result = { adjustedRate: baseWinRate, reasoning: 'Unknown phase' };
  }
  
  // Determine if we should predict at all
  const MINIMUM_RELIABILITY = 0.5;
  const shouldPredict = phaseReliability >= MINIMUM_RELIABILITY;
  
  return {
    originalWinRate: baseWinRate,
    phaseAdjustedWinRate: result.adjustedRate,
    phaseReliability,
    phase,
    shouldPredict,
    reasoning: result.reasoning + ` [Phase: ${phase}, Reliability: ${(phaseReliability * 100).toFixed(0)}%]`,
  };
}

/**
 * Get the optimal prediction horizon for this phase
 */
export function getPhaseOptimalHorizon(phase: GamePhase): number {
  const horizons: Record<GamePhase, number> = {
    opening: 8,           // Too volatile, short horizon
    early_middlegame: 12,
    late_middlegame: 20,  // Patterns crystallizing
    endgame: 35,          // Technique is reliable
    deep_endgame: 50,     // Very long horizon - tablebase territory
  };
  return horizons[phase];
}

/**
 * Check if this is an archetype that excels in the current phase
 */
export function isArchetypePhaseMatch(archetype: StrategicArchetype, phase: GamePhase): boolean {
  const reliability = ARCHETYPE_PHASE_RELIABILITY[archetype]?.[phase] ?? 0.5;
  return reliability >= 0.75;  // Good match threshold
}

/**
 * Get archetypes that are most predictive in this phase
 */
export function getPhaseDominantArchetypes(phase: GamePhase): StrategicArchetype[] {
  const dominant: StrategicArchetype[] = [];
  
  for (const [archetype, phaseMap] of Object.entries(ARCHETYPE_PHASE_RELIABILITY)) {
    if (phaseMap[phase] >= 0.8) {
      dominant.push(archetype as StrategicArchetype);
    }
  }
  
  return dominant;
}
