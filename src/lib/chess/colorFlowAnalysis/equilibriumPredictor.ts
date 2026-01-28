/**
 * Equilibrium Predictor v7.91-BALANCED
 * 
 * v7.91 KEY FIX: Eliminated systematic white bias
 * 
 * ROOT CAUSES FIXED:
 * 1. determineDominantSide summed white(+) and black(-) values = inherent white bias
 * 2. calculateControlSignal used raw differences instead of ratios
 * 3. calculateArchetypeSignal used hardcoded "white_favored" outcomes from archetypes
 * 
 * SOLUTION:
 * - Calculate white and black activity SEPARATELY using absolute values
 * - Use RATIOS (white/total, black/total) not differences
 * - Archetype determines STYLE (draw-prone vs decisive), dominantSide determines WHO wins
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
 * v7.91-BALANCED: Symmetric calculation that doesn't inherently favor white
 * 
 * KEY FIX: The quadrant profile uses +values for white, -values for black
 * We must calculate each side's total activity SYMMETRICALLY
 */
function calculateControlSignal(
  signature: ColorFlowSignature
): { white: number; black: number; draw: number } {
  const q = signature.quadrantProfile;
  
  // v7.91: Calculate absolute control for each side SEPARATELY
  // White's own territory control (positive values in white quadrants)
  const whiteHomeControl = Math.max(0, q.kingsideWhite) + Math.max(0, q.queensideWhite);
  // Black's own territory control (negative values become positive)
  const blackHomeControl = Math.max(0, -q.kingsideBlack) + Math.max(0, -q.queensideBlack);
  
  // Center is shared - split by sign
  const whiteCenterControl = Math.max(0, q.center);
  const blackCenterControl = Math.max(0, -q.center);
  
  // Territory invasion (controlling opponent's half)
  // White invading black's territory = positive kingsideBlack/queensideBlack
  const whiteInvasion = Math.max(0, q.kingsideBlack) + Math.max(0, q.queensideBlack);
  // Black invading white's territory = negative kingsideWhite/queensideWhite  
  const blackInvasion = Math.max(0, -q.kingsideWhite) + Math.max(0, -q.queensideWhite);
  
  // Total control with invasion weighted slightly less
  const whiteTotalControl = whiteHomeControl + whiteCenterControl + whiteInvasion * 0.7;
  const blackTotalControl = blackHomeControl + blackCenterControl + blackInvasion * 0.7;
  
  // Calculate difference - positive = white advantage, negative = black advantage
  const controlDiff = whiteTotalControl - blackTotalControl;
  const totalControl = whiteTotalControl + blackTotalControl;
  
  // Avoid division by zero
  if (totalControl < 10) {
    return { white: 33, black: 33, draw: 34 };
  }
  
  // v7.91: Use symmetric thresholds based on RATIO, not raw difference
  const whiteRatio = whiteTotalControl / totalControl;
  const blackRatio = blackTotalControl / totalControl;
  
  // Close contest (40-60% split) = high draw probability
  if (whiteRatio > 0.4 && whiteRatio < 0.6) {
    return { white: 32, black: 32, draw: 36 };
  }
  
  // White advantage (>60% control)
  if (whiteRatio >= 0.6) {
    const advantage = Math.min((whiteRatio - 0.5) * 60, 35);
    return { 
      white: 35 + advantage, 
      black: 30 - advantage / 2, 
      draw: 35 - advantage / 2 
    };
  }
  
  // Black advantage (>60% control)  
  if (blackRatio >= 0.6) {
    const advantage = Math.min((blackRatio - 0.5) * 60, 35);
    return { 
      white: 30 - advantage / 2, 
      black: 35 + advantage, 
      draw: 35 - advantage / 2 
    };
  }
  
  // Slightly favored positions (60% threshold not met)
  if (whiteRatio > 0.5) {
    const edge = (whiteRatio - 0.5) * 40;
    return { white: 34 + edge, black: 32 - edge / 2, draw: 34 - edge / 2 };
  } else {
    const edge = (blackRatio - 0.5) * 40;
    return { white: 32 - edge / 2, black: 34 + edge, draw: 34 - edge / 2 };
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
 * v7.91-BALANCED: Archetype describes game STYLE, not who wins
 * 
 * KEY INSIGHT: "kingside_attack" can favor EITHER side depending on who is attacking
 * The archetype outcome biases (all "white_favored") were causing massive bias
 * 
 * Instead: Use archetype to determine DRAW vs DECISIVE probability,
 * and the dominantSide (from signature) to determine WHITE vs BLACK
 */
function calculateArchetypeSignal(
  archetype: string,
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS] | undefined,
  dominantSide?: 'white' | 'black' | 'contested'
): { white: number; black: number; draw: number } {
  if (!archetypeDef) {
    return { white: 33, black: 33, draw: 34 };
  }
  
  // Archetype determines draw probability (style of game)
  const drawProneArchetypes = ['prophylactic_defense', 'closed_maneuvering', 'endgame_technique'];
  const decisiveArchetypes = ['kingside_attack', 'sacrificial_attack', 'opposite_castling', 'pawn_storm'];
  
  let drawProb: number;
  let decisiveProb: number;
  
  if (drawProneArchetypes.includes(archetype)) {
    drawProb = 42;  // High draw probability
    decisiveProb = 58;
  } else if (decisiveArchetypes.includes(archetype)) {
    drawProb = 22;  // Low draw probability - someone will win
    decisiveProb = 78;
  } else {
    drawProb = 32;  // Standard
    decisiveProb = 68;
  }
  
  // v7.92-BALANCED: WHO wins depends entirely on dominantSide
  // The key fix: contested should be TRULY 50/50, not biased
  if (dominantSide === 'white') {
    // White is dominant - they get 60% of decisive outcomes
    const whiteShare = decisiveProb * 0.60;
    const blackShare = decisiveProb * 0.40;
    return { white: whiteShare, black: blackShare, draw: drawProb };
  } else if (dominantSide === 'black') {
    // Black is dominant - they get 60% of decisive outcomes
    const blackShare = decisiveProb * 0.60;
    const whiteShare = decisiveProb * 0.40;
    return { white: whiteShare, black: blackShare, draw: drawProb };
  } else {
    // Contested - EXACTLY 50/50 split, no hidden bias
    const eachShare = decisiveProb / 2;
    return { white: eachShare, black: eachShare, draw: drawProb };
  }
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
