/**
 * Equilibrium Predictor v7.90-EQUILIBRIUM
 * 
 * KEY INSIGHT from CEO: "We were able to win black, then win white - 
 * this proves we have the tools to dominate BOTH"
 * 
 * Instead of oscillating between biases, this module:
 * 1. Calculates THREE independent confidence scores (white, black, draw)
 * 2. Only predicts when one outcome has clear dominance
 * 3. Uses BOTH directional signals to pick the most likely outcome
 * 
 * This is the path to 80%+ accuracy.
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
  const archetypeSignal = calculateArchetypeSignal(signature.archetype, archetype);
  
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
  
  if (whiteConfidence > blackConfidence && whiteConfidence > drawConfidence) {
    prediction = 'white_wins';
    finalConfidence = whiteConfidence;
    reasoning = `White leads (${whiteConfidence}% vs B:${blackConfidence}% D:${drawConfidence}%)`;
  } else if (blackConfidence > whiteConfidence && blackConfidence > drawConfidence) {
    prediction = 'black_wins';
    finalConfidence = blackConfidence;
    reasoning = `Black leads (${blackConfidence}% vs W:${whiteConfidence}% D:${drawConfidence}%)`;
  } else if (drawConfidence > whiteConfidence && drawConfidence > blackConfidence) {
    prediction = 'draw';
    finalConfidence = drawConfidence;
    reasoning = `Draw leads (${drawConfidence}% vs W:${whiteConfidence}% B:${blackConfidence}%)`;
  } else {
    // Tie or very close - use SF as tiebreaker
    if (stockfishEval > 20) {
      prediction = 'white_wins';
      finalConfidence = Math.max(whiteConfidence, 45);
      reasoning = `Tie broken by SF eval (+${stockfishEval}cp)`;
    } else if (stockfishEval < -20) {
      prediction = 'black_wins';
      finalConfidence = Math.max(blackConfidence, 45);
      reasoning = `Tie broken by SF eval (${stockfishEval}cp)`;
    } else {
      prediction = 'draw';
      finalConfidence = Math.max(drawConfidence, 40);
      reasoning = `Near-tie defaults to draw (SF: ${stockfishEval}cp)`;
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
 */
function calculateControlSignal(
  signature: ColorFlowSignature
): { white: number; black: number; draw: number } {
  const q = signature.quadrantProfile;
  
  // Calculate total control for each side
  const whiteControl = Math.max(0, q.kingsideWhite) + Math.max(0, q.queensideWhite) + Math.max(0, q.center);
  const blackControl = Math.max(0, -q.kingsideBlack) + Math.max(0, -q.queensideBlack) + Math.max(0, -q.center);
  
  // Also consider: who controls the OPPONENT'S territory
  const whiteInvasion = Math.max(0, q.kingsideBlack) + Math.max(0, q.queensideBlack);
  const blackInvasion = Math.max(0, -q.kingsideWhite) + Math.max(0, -q.queensideWhite);
  
  const whiteTotalControl = whiteControl + whiteInvasion * 0.5;
  const blackTotalControl = blackControl + blackInvasion * 0.5;
  
  // Normalize to create confidence distribution
  const diff = whiteTotalControl - blackTotalControl;
  
  if (Math.abs(diff) < 20) {
    // Close contest - high draw probability
    return { white: 30, black: 30, draw: 40 };
  } else if (diff > 0) {
    // White advantage
    const advantage = Math.min(diff / 2, 40);
    return { 
      white: 35 + advantage, 
      black: 25 - advantage / 2, 
      draw: 40 - advantage / 2 
    };
  } else {
    // Black advantage
    const advantage = Math.min(-diff / 2, 40);
    return { 
      white: 25 - advantage / 2, 
      black: 35 + advantage, 
      draw: 40 - advantage / 2 
    };
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
 */
function calculateArchetypeSignal(
  archetype: string,
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS] | undefined
): { white: number; black: number; draw: number } {
  if (!archetypeDef) {
    return { white: 33, black: 33, draw: 34 };
  }
  
  const winRate = archetypeDef.historicalWinRate;
  const outcome = archetypeDef.predictedOutcome;
  
  // Draw-prone archetypes
  const drawProneArchetypes = ['prophylactic_defense', 'closed_maneuvering', 'endgame_technique'];
  const decisiveArchetypes = ['kingside_attack', 'sacrificial_attack', 'opposite_castling'];
  
  if (drawProneArchetypes.includes(archetype)) {
    // Higher draw probability
    if (outcome === 'white_favored') {
      return { white: 35, black: 25, draw: 40 };
    } else if (outcome === 'black_favored') {
      return { white: 25, black: 35, draw: 40 };
    }
    return { white: 30, black: 30, draw: 40 };
  }
  
  if (decisiveArchetypes.includes(archetype)) {
    // Lower draw probability
    if (outcome === 'white_favored') {
      const boost = (winRate - 0.5) * 60;
      return { white: 45 + boost, black: 35 - boost / 2, draw: 20 };
    } else if (outcome === 'black_favored') {
      const boost = (0.5 - winRate) * 60;
      return { white: 35 - boost / 2, black: 45 + boost, draw: 20 };
    }
    return { white: 40, black: 40, draw: 20 };
  }
  
  // Standard archetype
  if (outcome === 'white_favored') {
    const boost = (winRate - 0.5) * 40;
    return { white: 40 + boost, black: 30 - boost / 2, draw: 30 };
  } else if (outcome === 'black_favored') {
    const boost = (0.5 - winRate) * 40;
    return { white: 30 - boost / 2, black: 40 + boost, draw: 30 };
  }
  
  return { white: 35, black: 35, draw: 30 };
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
