/**
 * DEEP SIGNALS v1.0 — Three compound signal dimensions for 80% accuracy
 * 
 * These signals combine existing raw features from the enhanced extractor
 * in ways that capture CONVERSION POTENTIAL — the missing dimension.
 * 
 * SIGNAL 1: MOMENTUM GRADIENT
 *   Move-by-move momentum tracking via temporal flow derivatives.
 *   Detects acceleration (advantage growing faster), deceleration (advantage stalling),
 *   and inflection points (momentum about to reverse).
 *   Current temporal: 3 phase averages (opening/mid/end). This adds: rate of change.
 * 
 * SIGNAL 2: COORDINATION POTENTIAL
 *   Combines piece coordination (batteries, doubled rooks, minor harmony) with
 *   territory control and trajectory data to detect whether coordination translates
 *   to conversion potential. A bishop battery on an open diagonal aimed at the king
 *   is worth more than doubled rooks on a closed file.
 * 
 * SIGNAL 3: STRUCTURAL DESTINY
 *   Combines pawn structure (passed, islands, connected) with piece activity patterns
 *   to predict whether the position is heading toward a winnable or drawable endgame.
 *   A passed pawn with an active rook behind it = winnable. Symmetric pawns with
 *   opposite-color bishops = drawable.
 */

import type { EnhancedQuadrantProfileData, EnhancedSignalsData, TemporalFlow } from './types';

export interface DeepSignalResult {
  /** Momentum gradient: positive = white accelerating, negative = black accelerating */
  momentumGradient: {
    /** Rate of change of advantage (-100 to 100) */
    gradient: number;
    /** Is the advantage accelerating (growing faster)? */
    accelerating: boolean;
    /** Is there an inflection point (momentum about to reverse)? */
    inflection: boolean;
    /** Phase momentum: which phase had the biggest shift? */
    peakPhase: 'opening' | 'middlegame' | 'endgame';
    /** Confidence in the gradient signal (0-1) */
    confidence: number;
  };
  /** Coordination potential: does piece coordination translate to conversion? */
  coordinationPotential: {
    /** Conversion score: positive = white can convert, negative = black can convert (-100 to 100) */
    conversionScore: number;
    /** Is there a battery aimed at the enemy king zone? */
    kingTargeted: boolean;
    /** Are pieces coordinated in the same zone as the territorial advantage? */
    spatialAlignment: boolean;
    /** Confidence (0-1) */
    confidence: number;
  };
  /** Structural destiny: is the endgame winnable or drawable? */
  structuralDestiny: {
    /** Destiny score: positive = white's structure is winning, negative = black's (-100 to 100) */
    destinyScore: number;
    /** Does the passer have piece support? */
    supportedPasser: boolean;
    /** Is the structure symmetric (drawable)? */
    symmetric: boolean;
    /** Piece activity differential — active pieces with structural advantage = conversion */
    activityAlignment: number;
    /** Confidence (0-1) */
    confidence: number;
  };
  /** Combined 3-way signal for the fusion system */
  signal: { white: number; black: number; draw: number };
  /** How many sub-signals contributed (0-3) */
  signalCount: number;
}

/**
 * Compute all three deep signals from existing enhanced data.
 * No new extraction needed — this is a COMPOUND LAYER on top of existing signals.
 */
export function computeDeepSignals(
  profile: EnhancedQuadrantProfileData | undefined,
  signals: EnhancedSignalsData | undefined,
  temporal: TemporalFlow | undefined,
  currentMoveNumber: number,
  stockfishEval: number
): DeepSignalResult {
  let signalCount = 0;
  
  // ════════════════════════════════════════════════════
  // SIGNAL 1: MOMENTUM GRADIENT
  // Rate of change of advantage, not just the advantage itself.
  // A position going from +0.5 to +1.0 is very different from +1.0 to +0.5.
  // ════════════════════════════════════════════════════
  
  const momentumGradient = computeMomentumGradient(temporal, currentMoveNumber);
  if (momentumGradient.confidence > 0.2) signalCount++;
  
  // ════════════════════════════════════════════════════
  // SIGNAL 2: COORDINATION POTENTIAL
  // Do the pieces work together toward conversion?
  // Batteries + territory alignment + king targeting = conversion.
  // High coordination but no target = just activity, not conversion.
  // ════════════════════════════════════════════════════
  
  const coordinationPotential = computeCoordinationPotential(profile, signals);
  if (coordinationPotential.confidence > 0.2) signalCount++;
  
  // ════════════════════════════════════════════════════
  // SIGNAL 3: STRUCTURAL DESTINY
  // Where is the pawn structure heading?
  // Passed pawns + active pieces = winnable.
  // Symmetric structure + low activity = drawable.
  // ════════════════════════════════════════════════════
  
  const structuralDestiny = computeStructuralDestiny(signals, profile, currentMoveNumber);
  if (structuralDestiny.confidence > 0.2) signalCount++;
  
  // ════════════════════════════════════════════════════
  // FUSION: Combine all three into a 3-way signal
  // Weight by confidence and game phase
  // ════════════════════════════════════════════════════
  
  const signal = fuseDeepSignals(
    momentumGradient, coordinationPotential, structuralDestiny,
    currentMoveNumber, stockfishEval
  );
  
  return {
    momentumGradient,
    coordinationPotential,
    structuralDestiny,
    signal,
    signalCount,
  };
}

// ════════════════════════════════════════════════════════════
// SIGNAL 1: MOMENTUM GRADIENT
// ════════════════════════════════════════════════════════════

function computeMomentumGradient(
  temporal: TemporalFlow | undefined,
  currentMoveNumber: number
): DeepSignalResult['momentumGradient'] {
  if (!temporal) {
    return { gradient: 0, accelerating: false, inflection: false, peakPhase: 'middlegame', confidence: 0 };
  }
  
  // Phase transitions: opening→middlegame and middlegame→endgame
  const delta1 = temporal.middlegame - temporal.opening;   // Opening → middlegame shift
  const delta2 = temporal.endgame - temporal.middlegame;   // Middlegame → endgame shift
  
  // GRADIENT = second derivative: is the shift ACCELERATING or DECELERATING?
  // If delta1 = +5 (white gaining) and delta2 = +10 (white gaining faster) → accelerating
  // If delta1 = +10 and delta2 = +3 → decelerating (advantage stalling)
  const acceleration = delta2 - delta1;
  
  // Gradient: weighted recent momentum + acceleration
  // Recent momentum matters more (0.6 weight) but acceleration is the new signal (0.4)
  const gradient = delta2 * 0.6 + acceleration * 0.4;
  
  // Inflection: momentum reversed between phases
  const inflection = (delta1 > 3 && delta2 < -3) || (delta1 < -3 && delta2 > 3);
  
  // Accelerating: same direction AND getting stronger
  const sameDirection = (delta1 > 0 && delta2 > 0) || (delta1 < 0 && delta2 < 0);
  const accelerating = sameDirection && Math.abs(delta2) > Math.abs(delta1) * 0.8;
  
  // Peak phase: which transition had the biggest shift?
  const peakPhase = Math.abs(delta1) > Math.abs(delta2) ? 
    (currentMoveNumber <= 25 ? 'opening' : 'middlegame') : 'endgame';
  
  // Confidence: higher when we have clear directional signal, lower with high volatility
  const directionality = Math.abs(gradient) / (Math.abs(gradient) + 5); // 0-1, saturates at ~20
  const volPenalty = Math.min(0.4, temporal.volatility / 100);
  const phasePenalty = currentMoveNumber < 15 ? 0.3 : 0; // Less confident in opening
  const confidence = Math.max(0, Math.min(1, directionality * 0.7 + 0.3 - volPenalty - phasePenalty));
  
  return {
    gradient: Math.max(-100, Math.min(100, gradient * 3)),
    accelerating,
    inflection,
    peakPhase,
    confidence,
  };
}

// ════════════════════════════════════════════════════════════
// SIGNAL 2: COORDINATION POTENTIAL
// ════════════════════════════════════════════════════════════

function computeCoordinationPotential(
  profile: EnhancedQuadrantProfileData | undefined,
  signals: EnhancedSignalsData | undefined
): DeepSignalResult['coordinationPotential'] {
  if (!signals?.coordination || !signals?.squareControl || !profile) {
    return { conversionScore: 0, kingTargeted: false, spatialAlignment: false, confidence: 0 };
  }
  
  const coord = signals.coordination;
  const control = signals.squareControl;
  const ks = signals.kingSafety;
  
  // Raw coordination strength (batteries, doubled rooks, minor harmony)
  const rawCoord = coord.coordinationScore; // 0-1
  
  // Territory control direction
  const whiteTerritory = profile.q1_kingside_white + profile.q2_queenside_white + profile.q5_center_white;
  const blackTerritory = Math.abs(profile.q3_kingside_black) + Math.abs(profile.q4_queenside_black) + Math.abs(profile.q6_center_black);
  const territoryBias = whiteTerritory - blackTerritory; // Positive = white territory
  
  // KING TARGETING: Is the coordination aimed at the enemy king?
  // Batteries + king exposure on the SAME side = conversion potential
  const whiteKingExposed = ks ? ks.whiteKingExposure > 0.3 : false;
  const blackKingExposed = ks ? ks.blackKingExposure > 0.3 : false;
  
  // If white has coordination AND black king is exposed → white can convert
  // If black has coordination AND white king is exposed → black can convert
  const whiteTargetsKing = coord.batteryScore > 0 && blackKingExposed;
  const blackTargetsKing = coord.batteryScore > 0 && whiteKingExposed;
  const kingTargeted = whiteTargetsKing || blackTargetsKing;
  
  // SPATIAL ALIGNMENT: Is coordination in the same zone as territory advantage?
  // Coordination on the kingside when territory advantage is also kingside = aligned
  const kingsideControl = control.kingsideControlDelta; // Positive = white controls kingside
  const queensideControl = control.queensideControlDelta;
  const centerControl = control.centerControlDelta;
  
  // Alignment: territory + control pointing same direction
  const controlBias = kingsideControl + queensideControl + centerControl * 1.5;
  const spatialAlignment = (territoryBias > 5 && controlBias > 5) || (territoryBias < -5 && controlBias < -5);
  
  // CONVERSION SCORE: coordination × alignment × king targeting
  let conversionScore = 0;
  
  // Base: coordination strength × control direction
  conversionScore = rawCoord * controlBias * 8;
  
  // King targeting bonus: 2x multiplier when aimed at exposed king
  if (whiteTargetsKing) conversionScore += rawCoord * 30;
  if (blackTargetsKing) conversionScore -= rawCoord * 30;
  
  // Spatial alignment bonus: 1.5x when territory and coordination align
  if (spatialAlignment) {
    conversionScore *= 1.4;
  }
  
  // Multi-piece attack zones: concentrated force = conversion
  if (coord.multiPieceAttackZones > 0) {
    conversionScore += Math.sign(controlBias) * coord.multiPieceAttackZones * 8;
  }
  
  conversionScore = Math.max(-100, Math.min(100, conversionScore));
  
  // Confidence: higher when coordination is strong AND aligned
  const coordStrength = Math.min(1, rawCoord * 2);
  const alignmentBonus = spatialAlignment ? 0.2 : 0;
  const kingBonus = kingTargeted ? 0.15 : 0;
  const confidence = Math.min(1, coordStrength * 0.5 + alignmentBonus + kingBonus + 0.15);
  
  return { conversionScore, kingTargeted, spatialAlignment, confidence };
}

// ════════════════════════════════════════════════════════════
// SIGNAL 3: STRUCTURAL DESTINY
// ════════════════════════════════════════════════════════════

function computeStructuralDestiny(
  signals: EnhancedSignalsData | undefined,
  profile: EnhancedQuadrantProfileData | undefined,
  currentMoveNumber: number
): DeepSignalResult['structuralDestiny'] {
  if (!signals?.pawnStructure) {
    return { destinyScore: 0, supportedPasser: false, symmetric: false, activityAlignment: 0, confidence: 0 };
  }
  
  const ps = signals.pawnStructure;
  const traj = signals.trajectories;
  const coord = signals.coordination;
  
  // PASSED PAWN SUPPORT: A passer with active pieces behind it = winnable
  const passedDelta = ps.whitePassed - ps.blackPassed;
  const connectedDelta = ps.whiteConnected - ps.blackConnected;
  
  // Piece activity: are pieces active (high mobility) or passive?
  const mobility = traj ? traj.mobilityScore : 0.5;
  const forwardBias = traj ? traj.forwardBias : 0; // Positive = white pieces moving forward
  
  // SUPPORTED PASSER: passed pawn + forward piece movement + coordination
  // White has passers AND pieces are moving forward = supported
  const whiteSupportedPasser = ps.whitePassed > 0 && forwardBias > 0.05 && (coord?.coordinationScore || 0) > 0.2;
  const blackSupportedPasser = ps.blackPassed > 0 && forwardBias < -0.05 && (coord?.coordinationScore || 0) > 0.2;
  const supportedPasser = whiteSupportedPasser || blackSupportedPasser;
  
  // SYMMETRY: symmetric structure = drawable
  // Same number of islands, similar passed pawns, similar connected pawns
  const islandDiff = Math.abs(ps.whiteIslands - ps.blackIslands);
  const passedSame = ps.whitePassed === ps.blackPassed;
  const connectedSame = Math.abs(ps.whiteConnected - ps.blackConnected) <= 1;
  const doubledSame = Math.abs(ps.whiteDoubled - ps.blackDoubled) <= 1;
  const symmetric = islandDiff <= 1 && passedSame && connectedSame && doubledSame;
  
  // ACTIVITY ALIGNMENT: do active pieces align with structural advantage?
  // If white has better structure AND white pieces are more active → conversion
  const structureBias = ps.structureScore; // Positive = white better
  const activityBias = forwardBias * 50; // Positive = white more active
  const activityAlignment = structureBias * activityBias; // Positive when aligned
  
  // DESTINY SCORE: structure + support + activity alignment
  let destinyScore = 0;
  
  // Base: structural advantage
  destinyScore += ps.structureScore * 30;
  
  // Passed pawn bonus (biggest structural feature)
  destinyScore += passedDelta * 20;
  
  // Connected pawn bonus
  destinyScore += connectedDelta * 8;
  
  // Supported passer: massive bonus
  if (whiteSupportedPasser) destinyScore += 25;
  if (blackSupportedPasser) destinyScore -= 25;
  
  // Activity alignment: pieces supporting the structural advantage
  destinyScore += Math.max(-20, Math.min(20, activityAlignment * 0.5));
  
  // Symmetry penalty: symmetric structures tend toward draws
  if (symmetric) {
    destinyScore *= 0.4; // Dampen structural advantage when symmetric
  }
  
  // Phase scaling: structural destiny matters more in late game
  const phaseScale = currentMoveNumber < 20 ? 0.3 : currentMoveNumber < 35 ? 0.7 : 1.0;
  destinyScore *= phaseScale;
  
  destinyScore = Math.max(-100, Math.min(100, destinyScore));
  
  // Confidence
  const hasPassers = ps.whitePassed > 0 || ps.blackPassed > 0;
  const hasImbalance = Math.abs(ps.structureScore) > 0.2;
  const phaseConf = currentMoveNumber >= 25 ? 0.3 : 0.1;
  const confidence = Math.min(1, (hasPassers ? 0.3 : 0.1) + (hasImbalance ? 0.2 : 0) + phaseConf + (supportedPasser ? 0.2 : 0));
  
  return { destinyScore, supportedPasser, symmetric, activityAlignment, confidence };
}

// ════════════════════════════════════════════════════════════
// FUSION: Combine three deep signals into a 3-way prediction signal
// ════════════════════════════════════════════════════════════

function fuseDeepSignals(
  momentum: DeepSignalResult['momentumGradient'],
  coordination: DeepSignalResult['coordinationPotential'],
  structure: DeepSignalResult['structuralDestiny'],
  currentMoveNumber: number,
  stockfishEval: number
): { white: number; black: number; draw: number } {
  // Phase-aware weighting
  const isEarly = currentMoveNumber < 20;
  const isLate = currentMoveNumber > 40;
  
  // Momentum matters most in middlegame, coordination in attack phases, structure in endgame
  const momWeight = isEarly ? 0.2 : isLate ? 0.25 : 0.35;
  const coordWeight = isEarly ? 0.3 : isLate ? 0.2 : 0.35;
  const structWeight = isEarly ? 0.1 : isLate ? 0.55 : 0.30;
  
  // Confidence-weighted combination
  const momSignal = momentum.gradient * momentum.confidence * momWeight;
  const coordSignal = coordination.conversionScore * coordination.confidence * coordWeight;
  const structSignal = structure.destinyScore * structure.confidence * structWeight;
  
  const combined = momSignal + coordSignal + structSignal;
  
  // Convert to 3-way signal
  // Strong combined signal → decisive prediction
  // Weak/mixed signal → draw lean
  const absCombined = Math.abs(combined);
  
  // Draw indicators from deep signals
  const drawIndicators = [
    momentum.inflection ? 1 : 0,           // Momentum reversing = draw
    structure.symmetric ? 1 : 0,            // Symmetric structure = draw
    absCombined < 5 ? 1 : 0,               // No clear direction = draw
  ].reduce((a, b) => a + b, 0);
  
  // Base draw probability from deep signals
  const drawBase = 30 + drawIndicators * 3;
  
  if (absCombined < 3) {
    // No clear signal — slight draw lean
    return { white: 33, black: 33, draw: 34 };
  }
  
  const isWhite = combined > 0;
  const advantage = Math.min(25, absCombined / 3);
  const drawPenalty = Math.min(advantage / 2, 10);
  
  if (isWhite) {
    return {
      white: Math.round(35 + advantage),
      black: Math.round(35 - advantage),
      draw: Math.round(drawBase - drawPenalty),
    };
  } else {
    return {
      white: Math.round(35 - advantage),
      black: Math.round(35 + advantage),
      draw: Math.round(drawBase - drawPenalty),
    };
  }
}
