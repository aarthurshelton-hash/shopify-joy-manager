/**
 * EP MIRROR EVAL v2.0 — 3D Position Evaluation
 * 
 * THREE DIMENSIONS that MULTIPLY, not just add:
 *   D1: SPATIAL  — 8-quadrant territory + negative space (WHERE is the advantage?)
 *   D2: FORCE    — king safety + pawn structure + coordination + captures (HOW STRONG?)
 *   D3: TEMPORAL — momentum + volatility + phase (IS IT GROWING OR SHRINKING?)
 * 
 * The 3D interaction captures what 2D additive fusion misses:
 *   - A spatial advantage that's GROWING temporally is worth 2x
 *   - A force advantage in a SHRINKING spatial zone is worth 0.5x
 *   - High force + high spatial + high temporal = DECISIVE (3D alignment)
 *   - Mixed signals across dimensions = UNCERTAIN (3D divergence)
 * 
 * NO Stockfish input. This is EP's independent view of the position.
 * 
 * Output: centipawn-equivalent score (positive = white advantage)
 */

import type { EnhancedQuadrantProfileData, EnhancedSignalsData, TemporalFlow } from './types';

export interface MirrorEvalResult {
  /** Centipawn-equivalent score (positive = white advantage) */
  eval: number;
  /** Confidence in the eval (0-1) */
  confidence: number;
  /** 3D breakdown */
  dimensions: {
    spatial: number;    // D1: WHERE (territory + negative space)
    force: number;      // D2: HOW STRONG (king safety + pawns + coordination + captures)
    temporal: number;   // D3: GROWING/SHRINKING (momentum multiplier, 0.5-2.0)
  };
  /** Breakdown of contributing signals */
  components: {
    spatial: number;
    momentum: number;
    kingSafety: number;
    pawnStructure: number;
    coordination: number;
    captureGraph: number;
    negativeSpace: number;
  };
  /** Number of signal domains that contributed (0-7) */
  signalCount: number;
}

/**
 * Compute EP's 3D mirror eval from color flow signals alone.
 * 
 * D1 (Spatial) × D3 (Temporal) + D2 (Force) × D3 (Temporal)
 * = position advantage amplified or dampened by temporal dynamics
 */
export function computeMirrorEval(
  profile: EnhancedQuadrantProfileData | undefined,
  signals: EnhancedSignalsData | undefined,
  temporal: TemporalFlow | undefined,
  currentMoveNumber: number
): MirrorEvalResult {
  const components = {
    spatial: 0,
    momentum: 0,
    kingSafety: 0,
    pawnStructure: 0,
    coordination: 0,
    captureGraph: 0,
    negativeSpace: 0,
  };
  let signalCount = 0;

  // ════════════════════════════════════════════════════
  // DIMENSION 1: SPATIAL — WHERE is the advantage?
  // 8-quadrant territory + negative space pressure
  // ════════════════════════════════════════════════════
  
  let spatialScore = 0;
  
  if (profile) {
    const whiteTerritory = profile.q1_kingside_white + profile.q2_queenside_white;
    const blackTerritory = Math.abs(profile.q3_kingside_black) + Math.abs(profile.q4_queenside_black);
    const centerBalance = profile.q5_center_white + profile.q6_center_black;
    const wingBalance = profile.q7_extended_kingside + profile.q8_extended_queenside;
    const territoryDiff = whiteTerritory - blackTerritory;

    // Center is king — 2x weight. Territory 1x. Wings 0.3x.
    components.spatial = Math.max(-250, Math.min(250, 
      (centerBalance * 2.0 + territoryDiff * 1.0 + wingBalance * 0.3) * 0.7
    ));
    spatialScore = components.spatial;
    signalCount++;
  }

  // Negative space extends spatial dimension — pressure on EMPTY squares
  if (signals?.negativeSpace) {
    const ns = signals.negativeSpace;
    const spaceCp = ns.negativeSpaceBalance * 0.3;
    const invasionDiff = (ns.whiteInvasionShadow - ns.blackInvasionShadow) * 0.5;
    const kingPressureDiff = (ns.blackKingZoneShadow - ns.whiteKingZoneShadow) * 2;
    const backRankCp = -ns.backRankPressure * 3;
    const voidDampen = Math.max(0.6, 1.0 - ns.voidTension / 30);
    
    components.negativeSpace = Math.max(-150, Math.min(150, 
      (spaceCp + invasionDiff + kingPressureDiff + backRankCp) * voidDampen
    ));
    // Negative space is part of spatial dimension
    spatialScore = spatialScore * 0.7 + components.negativeSpace * 0.3;
    signalCount++;
  }

  // ════════════════════════════════════════════════════
  // DIMENSION 2: FORCE — HOW STRONG is the advantage?
  // King safety + pawn structure + coordination + captures
  // ════════════════════════════════════════════════════
  
  let forceScore = 0;
  let forceSignals = 0;

  // King Safety — the most predictive non-eval feature
  if (signals?.kingSafety) {
    const ks = signals.kingSafety;
    const shieldDiff = (ks.whitePawnShield - ks.blackPawnShield) * 40;
    const exposureDiff = (ks.blackKingExposure - ks.whiteKingExposure) * 80;
    let castleBonus = 0;
    if (ks.castled.white && !ks.castled.black) castleBonus = 25;
    else if (!ks.castled.white && ks.castled.black) castleBonus = -25;
    
    components.kingSafety = Math.max(-200, Math.min(200, 
      ks.kingSafetyDelta * 30 + shieldDiff * 0.3 + exposureDiff * 0.5 + castleBonus
    ));
    forceScore += components.kingSafety;
    forceSignals++;
    signalCount++;
  }

  // Pawn Structure — the skeleton
  if (signals?.pawnStructure) {
    const ps = signals.pawnStructure;
    const passedDiff = (ps.whitePassed - ps.blackPassed) * 50;
    const connectedDiff = (ps.whiteConnected - ps.blackConnected) * 15;
    const doubledDiff = (ps.blackDoubled - ps.whiteDoubled) * 20;
    const islandDiff = (ps.blackIslands - ps.whiteIslands) * 15;
    
    components.pawnStructure = Math.max(-200, Math.min(200, 
      ps.structureScore * 60 + passedDiff * 0.4 + connectedDiff * 0.2 + doubledDiff * 0.2 + islandDiff * 0.2
    ));
    forceScore += components.pawnStructure;
    forceSignals++;
    signalCount++;
  }

  // Piece Coordination — dynamic potential
  if (signals?.coordination) {
    const coord = signals.coordination;
    const controlBias = signals.squareControl?.controlScore || 0;
    const coordCp = coord.coordinationScore * controlBias * 120;
    const attackZoneBias = coord.multiPieceAttackZones * controlBias * 15;
    
    components.coordination = Math.max(-150, Math.min(150, coordCp + attackZoneBias));
    forceScore += components.coordination;
    forceSignals++;
    signalCount++;
  }

  // Capture Graph — material battle
  if (signals?.captureGraph) {
    const cg = signals.captureGraph;
    const exchangeCp = cg.exchangeScore * cg.totalCaptures * 15;
    const sacBonus = cg.sacrificeIndicators > 0 && cg.exchangeScore < 0 
      ? -cg.sacrificeIndicators * 20 : 0;
    const tensionDampen = Math.max(0.5, 1.0 - cg.materialTension * 0.5);
    
    components.captureGraph = Math.max(-150, Math.min(150, (exchangeCp + sacBonus) * tensionDampen));
    forceScore += components.captureGraph;
    forceSignals++;
    signalCount++;
  }

  // Normalize force by number of contributing signals
  if (forceSignals > 0) forceScore /= forceSignals;

  // ════════════════════════════════════════════════════
  // DIMENSION 3: TEMPORAL — IS IT GROWING OR SHRINKING?
  // This is the MULTIPLIER that amplifies or dampens D1 and D2
  // Range: 0.4 (collapsing) to 2.0 (accelerating)
  // ════════════════════════════════════════════════════
  
  let temporalMultiplier = 1.0; // Neutral by default
  
  if (temporal) {
    const openingToMiddle = temporal.middlegame - temporal.opening;
    const middleToEnd = temporal.endgame - temporal.middlegame;
    
    // Recent momentum weighted more
    const momentum = openingToMiddle * 0.3 + middleToEnd * 0.7;
    components.momentum = Math.max(-150, Math.min(150, momentum * 3));
    signalCount++;
    
    // Momentum DIRECTION relative to current advantage
    // If spatial+force says white and momentum is positive → amplify
    // If spatial+force says white but momentum is negative → dampen
    const currentDirection = spatialScore + forceScore; // Rough direction
    const momentumAligned = (currentDirection > 0 && momentum > 0) || 
                            (currentDirection < 0 && momentum < 0);
    const momentumReversed = (openingToMiddle > 5 && middleToEnd < -5) ||
                             (openingToMiddle < -5 && middleToEnd > 5);
    
    // Volatility: high volatility = less certain about temporal trend
    const volDampen = Math.max(0.5, 1.0 - temporal.volatility / 80);
    
    if (momentumAligned && !momentumReversed) {
      // Advantage is GROWING — amplify (up to 1.8x)
      const strength = Math.min(0.8, Math.abs(momentum) / 30);
      temporalMultiplier = 1.0 + strength * volDampen;
    } else if (momentumReversed) {
      // Momentum reversed — advantage is SETTLING (dampen to 0.5-0.8x)
      temporalMultiplier = 0.5 + 0.3 * volDampen;
    } else if (!momentumAligned && Math.abs(momentum) > 10) {
      // Advantage is SHRINKING — dampen (0.6-0.9x)
      const strength = Math.min(0.4, Math.abs(momentum) / 40);
      temporalMultiplier = 1.0 - strength * volDampen;
    }
    // else: neutral momentum → multiplier stays 1.0
  }

  // ════════════════════════════════════════════════════
  // 3D FUSION: Spatial × Temporal + Force × Temporal
  // The temporal dimension MULTIPLIES both other dimensions
  // ════════════════════════════════════════════════════
  
  const isOpening = currentMoveNumber <= 15;
  const isMiddlegame = currentMoveNumber > 15 && currentMoveNumber <= 40;
  const isEndgame = currentMoveNumber > 40;

  // Phase-aware spatial vs force weighting
  const spatialWeight = isOpening ? 0.55 : isMiddlegame ? 0.45 : 0.30;
  const forceWeight = 1.0 - spatialWeight;

  // 3D eval: (spatial × spatialWeight + force × forceWeight) × temporalMultiplier
  const baseEval = spatialScore * spatialWeight + forceScore * forceWeight;
  const eval3D = baseEval * temporalMultiplier;

  // ════════════════════════════════════════════════════
  // CONFIDENCE: 3D alignment = high confidence
  // All three dimensions pointing same way = very confident
  // Mixed signals across dimensions = uncertain
  // ════════════════════════════════════════════════════
  
  const spatialDir = Math.sign(spatialScore) || 0;
  const forceDir = Math.sign(forceScore) || 0;
  const momentumDir = Math.sign(components.momentum) || 0;
  
  // 3D alignment: all three agree = 1.0, two agree = 0.7, all disagree = 0.3
  const dirs = [spatialDir, forceDir, momentumDir].filter(d => d !== 0);
  let alignment = 0.5;
  if (dirs.length >= 2) {
    const posCount = dirs.filter(d => d > 0).length;
    const negCount = dirs.filter(d => d < 0).length;
    const maxAgree = Math.max(posCount, negCount);
    alignment = maxAgree / dirs.length;
  }
  
  // Signal coverage: more domains = more confident
  const coverage = Math.min(1.0, signalCount / 5);
  
  // Temporal amplification of confidence: growing advantage = more confident
  const temporalConfBoost = temporalMultiplier > 1.2 ? 0.1 : temporalMultiplier < 0.7 ? -0.1 : 0;
  
  const confidence = Math.min(1.0, Math.max(0.1, alignment * 0.5 + coverage * 0.4 + temporalConfBoost + 0.1));

  return {
    eval: Math.round(eval3D * 10) / 10,
    confidence,
    dimensions: {
      spatial: Math.round(spatialScore * 10) / 10,
      force: Math.round(forceScore * 10) / 10,
      temporal: Math.round(temporalMultiplier * 100) / 100,
    },
    components,
    signalCount,
  };
}

/**
 * Convert mirror eval to a win probability (0-1 for white).
 * Uses a sigmoid function calibrated to match SF's eval-to-winrate curve.
 */
export function mirrorEvalToWinProb(evalCp: number): number {
  // SF's win rate model: winRate = 1 / (1 + 10^(-eval/400))
  // We use the same curve for comparability
  return 1 / (1 + Math.pow(10, -evalCp / 400));
}

/**
 * Get EP's prediction direction from mirror eval alone.
 * This is EP's independent opinion, no SF involved.
 */
export function mirrorEvalDirection(evalCp: number): 'white_wins' | 'black_wins' | 'draw' {
  if (evalCp > 30) return 'white_wins';
  if (evalCp < -30) return 'black_wins';
  return 'draw';
}
