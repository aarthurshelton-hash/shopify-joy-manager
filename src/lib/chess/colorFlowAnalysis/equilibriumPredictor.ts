/**
 * Equilibrium Predictor v8.06-EQUILIBRIUM
 * 
 * v8.06 LEARNING FROM v8.05:
 * - v8.05 over-corrected: 69% black predictions but only 47.8% accurate
 * - Swinging between white-bias and black-bias doesn't work
 * 
 * SOLUTION: True equilibrium with balanced weights
 * - Reduce archetype-specific boosts to prevent overcorrection
 * - Use Stockfish as symmetric tiebreaker (same thresholds for both colors)
 * - Target ~50% white / ~35% black / ~15% draw distribution
 * 
 * TARGET: 55-60% accuracy with balanced prediction distribution
 */

import { ColorFlowSignature, QuadrantProfile, TemporalFlow } from './types';
import { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';

export interface EquilibriumScores {
  /** Confidence that white will win (0-100) */
  whiteConfidence: number;
  /** Confidence that black will win (0-100) */
  blackConfidence: number;
  /** Confidence the game will draw (0-100) */
  drawConfidence: number;
  /** The predicted outcome based on highest confidence */
  prediction: 'white_wins' | 'black_wins' | 'draw';
  /** Final confidence of the prediction */
  finalConfidence: number;
  /** Reasoning for the prediction */
  reasoning: string;
  /** Whether the prediction meets the clarity threshold */
  highClarity: boolean;
}

/**
 * Calculate equilibrium scores for all three outcomes
 * 
 * This is the core of the balanced prediction system.
 * We calculate independent confidence for each outcome rather than
 * binary classification that can flip-flop.
 */
export function calculateEquilibriumScores(
  signature: ColorFlowSignature,
  stockfishEval: number,
  stockfishDepth: number,
  currentMoveNumber: number
): EquilibriumScores {
  const archetype = ARCHETYPE_DEFINITIONS[signature.archetype];
  const quadrant = signature.quadrantProfile;
  const temporal = signature.temporalFlow;
  
  // ===== COMPONENT 1: Board Control Signals =====
  const controlSignal = calculateControlSignal(signature);
  
  // ===== COMPONENT 2: Temporal Momentum =====
  const momentumSignal = calculateMomentumSignal(temporal);
  
  // ===== COMPONENT 3: Archetype Historical Rates =====
  // v7.91: Pass dominantSide so archetype signal knows WHO is attacking
  const archetypeSignal = calculateArchetypeSignal(signature.archetype, archetype, signature.dominantSide);
  
  // ===== COMPONENT 4: Stockfish Evaluation =====
  const sfSignal = calculateStockfishSignal(stockfishEval);
  
  // ===== COMPONENT 5: Game Phase Context =====
  const phaseSignal = calculatePhaseSignal(currentMoveNumber, signature.intensity);
  
  // ===== FUSION: Weighted combination of all signals =====
  // Weights determine how much each component contributes
  const weights = {
    control: 0.25,    // Board control is fundamental
    momentum: 0.20,   // Trajectory matters
    archetype: 0.15,  // Historical patterns
    stockfish: 0.30,  // Tactical assessment
    phase: 0.10,      // Context adjustment
  };
  
  // Calculate raw scores for each outcome
  let whiteRaw = 
    controlSignal.white * weights.control +
    momentumSignal.white * weights.momentum +
    archetypeSignal.white * weights.archetype +
    sfSignal.white * weights.stockfish +
    phaseSignal.white * weights.phase;
    
  let blackRaw = 
    controlSignal.black * weights.control +
    momentumSignal.black * weights.momentum +
    archetypeSignal.black * weights.archetype +
    sfSignal.black * weights.stockfish +
    phaseSignal.black * weights.phase;
    
  let drawRaw = 
    controlSignal.draw * weights.control +
    momentumSignal.draw * weights.momentum +
    archetypeSignal.draw * weights.archetype +
    sfSignal.draw * weights.stockfish +
    phaseSignal.draw * weights.phase;
  
  // Normalize to sum to 100
  const total = whiteRaw + blackRaw + drawRaw;
  const whiteConfidence = Math.round((whiteRaw / total) * 100);
  const blackConfidence = Math.round((blackRaw / total) * 100);
  const drawConfidence = Math.round((drawRaw / total) * 100);
  
  // Determine prediction from highest confidence
  let prediction: 'white_wins' | 'black_wins' | 'draw';
  let finalConfidence: number;
  let reasoning: string;
  
  // v8.06-EQUILIBRIUM: Symmetric decision making with SF as balanced tiebreaker
  
  // CASE 1: Clear leader with significant margin (require 10% gap)
  if (whiteConfidence > blackConfidence + 10 && whiteConfidence > drawConfidence + 8) {
    prediction = 'white_wins';
    finalConfidence = whiteConfidence;
    reasoning = `White leads clearly (${whiteConfidence}% vs B:${blackConfidence}% D:${drawConfidence}%)`;
  } else if (blackConfidence > whiteConfidence + 10 && blackConfidence > drawConfidence + 8) {
    prediction = 'black_wins';
    finalConfidence = blackConfidence;
    reasoning = `Black leads clearly (${blackConfidence}% vs W:${whiteConfidence}% D:${drawConfidence}%)`;
  } else if (drawConfidence > whiteConfidence + 12 && drawConfidence > blackConfidence + 12) {
    prediction = 'draw';
    finalConfidence = drawConfidence;
    reasoning = `Draw leads (${drawConfidence}% vs W:${whiteConfidence}% B:${blackConfidence}%)`;
  } 
  // CASE 2: v8.06 - Stockfish as SYMMETRIC tiebreaker (equal thresholds)
  else if (stockfishEval > 100) {
    prediction = 'white_wins';
    finalConfidence = Math.max(whiteConfidence + 8, 55);
    reasoning = `SF strong white (+${stockfishEval}cp)`;
  } else if (stockfishEval < -100) {
    prediction = 'black_wins';
    finalConfidence = Math.max(blackConfidence + 8, 55);
    reasoning = `SF strong black (${stockfishEval}cp)`;
  } else if (stockfishEval > 50) {
    prediction = 'white_wins';
    finalConfidence = Math.max(whiteConfidence, 48);
    reasoning = `SF white advantage (+${stockfishEval}cp)`;
  } else if (stockfishEval < -50) {
    prediction = 'black_wins';
    finalConfidence = Math.max(blackConfidence, 48);
    reasoning = `SF black advantage (${stockfishEval}cp)`;
  }
  // CASE 3: Near-equal SF eval - use our confidence scores
  else if (whiteConfidence > blackConfidence && whiteConfidence > drawConfidence) {
    prediction = 'white_wins';
    finalConfidence = whiteConfidence;
    reasoning = `White edge (SF: ${stockfishEval}cp)`;
  } else if (blackConfidence > whiteConfidence && blackConfidence > drawConfidence) {
    prediction = 'black_wins';
    finalConfidence = blackConfidence;
    reasoning = `Black edge (SF: ${stockfishEval}cp)`;
  } else if (drawConfidence >= whiteConfidence && drawConfidence >= blackConfidence) {
    prediction = 'draw';
    finalConfidence = drawConfidence;
    reasoning = `Draw likely (SF: ${stockfishEval}cp)`;
  }
  // CASE 4: Truly tied - slight favor to higher Elo attacker
  else {
    if (stockfishEval >= 0) {
      prediction = 'white_wins';
      finalConfidence = Math.max(whiteConfidence, 42);
      reasoning = `Tie broken: SF slightly favors white`;
    } else {
      prediction = 'black_wins';
      finalConfidence = Math.max(blackConfidence, 42);
      reasoning = `Tie broken: SF slightly favors black`;
    }
  }
  
  // High clarity = the leading outcome is significantly ahead
  const secondHighest = prediction === 'white_wins' 
    ? Math.max(blackConfidence, drawConfidence)
    : prediction === 'black_wins'
      ? Math.max(whiteConfidence, drawConfidence)
      : Math.max(whiteConfidence, blackConfidence);
  
  const highClarity = finalConfidence - secondHighest >= 15;
  
  return {
    whiteConfidence,
    blackConfidence,
    drawConfidence,
    prediction,
    finalConfidence,
    reasoning,
    highClarity,
  };
}

/**
 * Calculate control signal from quadrant profile
 * v7.95-DUAL-LENS: Use dominantSide directly - the extraction already handles bias compensation
 */
function calculateControlSignal(
  signature: ColorFlowSignature
): { white: number; black: number; draw: number } {
  const dominantSide = signature.dominantSide;
  const q = signature.quadrantProfile;
  
  // Calculate intensity for confidence scaling
  const totalActivity = (
    Math.abs(q.kingsideWhite) + Math.abs(q.kingsideBlack) +
    Math.abs(q.queensideWhite) + Math.abs(q.queensideBlack) +
    Math.abs(q.center)
  );
  
  // Low activity = uncertain
  if (totalActivity < 50) {
    return { white: 33, black: 33, draw: 34 };
  }
  
  // Calculate advantage strength based on intensity
  const intensity = Math.min(1, totalActivity / 300);
  const baseAdvantage = 15 + intensity * 20; // 15-35 point advantage
  
  // v7.95-DUAL-LENS: Trust the dual-lens dominantSide detection completely
  // It already combines both black-favoring and white-favoring detection methods
  switch (dominantSide) {
    case 'white':
      return { 
        white: 35 + baseAdvantage, 
        black: 30 - baseAdvantage / 2, 
        draw: 35 - baseAdvantage / 2 
      };
    case 'black':
      return { 
        white: 30 - baseAdvantage / 2, 
        black: 35 + baseAdvantage, 
        draw: 35 - baseAdvantage / 2 
      };
    case 'contested':
    default:
      // v8.04-SYMMETRIC: Contested = truly equal, let SF be the tiebreaker
      // Previous versions artificially favored one color, causing oscillation
      return { white: 33, black: 33, draw: 34 };
  }
}

/**
 * Calculate momentum signal from temporal flow
 */
function calculateMomentumSignal(
  temporal: TemporalFlow
): { white: number; black: number; draw: number } {
  // Positive = white gaining, negative = black gaining
  const openingToMiddle = temporal.middlegame - temporal.opening;
  const middleToEnd = temporal.endgame - temporal.middlegame;
  
  // Overall momentum trend
  const momentum = openingToMiddle * 0.4 + middleToEnd * 0.6;
  
  // High volatility suggests unclear result
  const volatilityPenalty = Math.min(temporal.volatility / 3, 20);
  
  if (momentum > 15) {
    // White gaining momentum
    const gain = Math.min(momentum, 40);
    return { 
      white: 40 + gain - volatilityPenalty / 2, 
      black: 25 - gain / 2, 
      draw: 35 - gain / 2 + volatilityPenalty / 2 
    };
  } else if (momentum < -15) {
    // Black gaining momentum
    const gain = Math.min(-momentum, 40);
    return { 
      white: 25 - gain / 2, 
      black: 40 + gain - volatilityPenalty / 2, 
      draw: 35 - gain / 2 + volatilityPenalty / 2 
    };
  } else {
    // Balanced - depends on volatility
    if (temporal.volatility > 50) {
      // High volatility = decisive result likely
      return { white: 35, black: 35, draw: 30 };
    } else {
      // Low volatility in balanced game = draw likely
      return { white: 30, black: 30, draw: 40 };
    }
  }
}

/**
 * Calculate archetype signal from historical patterns
 * v8.06-EQUILIBRIUM: Reduced archetype boosts to prevent overcorrection
 * 
 * v8.05 showed that aggressive boosts cause oscillation.
 * v8.06 uses moderate, balanced adjustments.
 */
function calculateArchetypeSignal(
  archetype: string,
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS] | undefined,
  dominantSide?: 'white' | 'black' | 'contested'
): { white: number; black: number; draw: number } {
  if (!archetypeDef) {
    // No archetype = equal split
    return { white: 33, black: 33, draw: 34 };
  }
  
  // v8.06: Moderate archetype boosts (reduced from v8.05)
  const ARCHETYPE_WEIGHTS: Record<string, { whiteBoost: number; blackBoost: number; drawBoost: number }> = {
    // Defensive archetypes - slight black boost
    prophylactic_defense: { whiteBoost: -2, blackBoost: 5, drawBoost: 4 },
    closed_maneuvering: { whiteBoost: -1, blackBoost: 3, drawBoost: 5 },
    
    // Tactical archetypes - depends on who is attacking
    kingside_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -5 },
    queenside_expansion: { whiteBoost: 0, blackBoost: 0, drawBoost: -3 },
    sacrificial_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -8 },
    
    // Balanced archetypes
    opposite_castling: { whiteBoost: -2, blackBoost: 2, drawBoost: 0 },
    open_tactical: { whiteBoost: -1, blackBoost: 2, drawBoost: -3 },
    
    // Strategic archetypes
    central_domination: { whiteBoost: 2, blackBoost: 0, drawBoost: -3 },
    positional_squeeze: { whiteBoost: 2, blackBoost: -1, drawBoost: -2 },
    piece_harmony: { whiteBoost: 0, blackBoost: 1, drawBoost: 0 },
    
    // Endgame/pawn archetypes
    endgame_technique: { whiteBoost: -1, blackBoost: 2, drawBoost: 6 },
    pawn_storm: { whiteBoost: 0, blackBoost: 0, drawBoost: -5 },
  };
  
  const weights = ARCHETYPE_WEIGHTS[archetype] || { whiteBoost: 0, blackBoost: 0, drawBoost: 0 };
  
  // Base draw probability by archetype style
  const drawProneArchetypes = ['prophylactic_defense', 'closed_maneuvering', 'endgame_technique'];
  const decisiveArchetypes = ['kingside_attack', 'sacrificial_attack', 'opposite_castling', 'pawn_storm'];
  
  let baseDrawProb: number;
  
  if (drawProneArchetypes.includes(archetype)) {
    baseDrawProb = 35;
  } else if (decisiveArchetypes.includes(archetype)) {
    baseDrawProb = 25;
  } else {
    baseDrawProb = 30;
  }
  
  const drawProb = Math.max(18, Math.min(45, baseDrawProb + weights.drawBoost));
  const decisiveProb = 100 - drawProb;
  
  // v8.06: Symmetric split based on dominantSide
  let whiteShare: number;
  let blackShare: number;
  
  if (dominantSide === 'white') {
    whiteShare = (decisiveProb * 0.55) + weights.whiteBoost;
    blackShare = (decisiveProb * 0.45) + weights.blackBoost;
  } else if (dominantSide === 'black') {
    blackShare = (decisiveProb * 0.55) + weights.blackBoost;
    whiteShare = (decisiveProb * 0.45) + weights.whiteBoost;
  } else {
    // Contested: exactly 50/50
    whiteShare = (decisiveProb / 2) + weights.whiteBoost;
    blackShare = (decisiveProb / 2) + weights.blackBoost;
  }
  
  // Normalize
  const total = whiteShare + blackShare + drawProb;
  return { 
    white: Math.round((whiteShare / total) * 100), 
    black: Math.round((blackShare / total) * 100), 
    draw: Math.round((drawProb / total) * 100)
  };
}

/**
 * Calculate Stockfish signal from centipawn evaluation
 */
function calculateStockfishSignal(
  eval_cp: number
): { white: number; black: number; draw: number } {
  // TCEC-calibrated thresholds
  if (eval_cp > 200) {
    // Winning for white
    const winPct = Math.min(85, 60 + Math.abs(eval_cp - 200) / 10);
    return { white: winPct, black: 5, draw: 100 - winPct - 5 };
  } else if (eval_cp < -200) {
    // Winning for black
    const winPct = Math.min(85, 60 + Math.abs(eval_cp + 200) / 10);
    return { white: 5, black: winPct, draw: 100 - winPct - 5 };
  } else if (eval_cp > 50) {
    // White advantage
    const advantage = (eval_cp - 50) / 150 * 25;
    return { white: 45 + advantage, black: 25 - advantage / 2, draw: 30 };
  } else if (eval_cp < -50) {
    // Black advantage
    const advantage = (-eval_cp - 50) / 150 * 25;
    return { white: 25 - advantage / 2, black: 45 + advantage, draw: 30 };
  } else if (eval_cp > 15) {
    // Slight white edge
    return { white: 38, black: 28, draw: 34 };
  } else if (eval_cp < -15) {
    // Slight black edge
    return { white: 28, black: 38, draw: 34 };
  } else {
    // Equal position - draw likely
    return { white: 30, black: 30, draw: 40 };
  }
}

/**
 * Calculate phase signal based on game stage
 */
function calculatePhaseSignal(
  moveNumber: number,
  intensity: number
): { white: number; black: number; draw: number } {
  // Early game: predictions are less reliable, slightly favor white (first-move advantage)
  if (moveNumber < 15) {
    return { white: 36, black: 32, draw: 32 };
  }
  
  // Middlegame: balanced predictions
  if (moveNumber < 30) {
    return { white: 34, black: 34, draw: 32 };
  }
  
  // Late game: intensity determines draw likelihood
  if (intensity < 30) {
    // Low intensity late game = draw likely
    return { white: 28, black: 28, draw: 44 };
  } else if (intensity > 60) {
    // High intensity late game = decisive result
    return { white: 38, black: 38, draw: 24 };
  }
  
  return { white: 33, black: 33, draw: 34 };
}
