/**
 * Equilibrium Predictor v19.0-ENDGAME-GOLDEN-GATE
 * 
 * UNIVERSAL PRINCIPLE (applies across chess, markets, all domains):
 * What determines draw/flat vs decisive/directional is NOT the volume/intensity
 * of activity. It is whether the pressure is ONE-SIDED or BALANCED.
 * 
 * v19.0 REFINEMENTS (data from 1.25M predictions, EP 60.0% vs SF 56.7%):
 *   1. ENDGAME REWEIGHTING (moves 46+): SF weight 0.17→0.28, pawnStructure 0.08→0.14,
 *      control 0.12→0.06, momentum 0.12→0.06. Sparse grids need more SF calculation depth.
 *      Target: flip endgame from EP 56.6% < SF 57.2% to EP > SF.
 *   2. OPENING HARD SUPPRESSION (moves 1-10): confidence capped at 38.
 *      47.5% accuracy drags average down. Still predict for learning, low confidence.
 *   3. DEEP ENDGAME DAMPENING (moves 61+): confidence capped at 45.
 *      42.2% accuracy zone where both EP and SF struggle.
 *   4. GOLDEN GATE EXPANSION: per-archetype confidence cap raised from +5 to +8.
 *      Lets high-accuracy archetypes (queenside_expansion 60.7%, kingside_attack 60.8%)
 *      express their full confidence instead of being artificially capped.
 * 
 * Golden gate (moves 15-45, conf≥50) = 71.6% on 593K games.
 * CURRENT: 60.0% on 1.25M games (+3.3pp over SF, 62.3% head-to-head win rate)
 * NEXT MILESTONE: 10M games, 70% universal accuracy.
 */

import { ColorFlowSignature, TemporalFlow, EnhancedSignalsData, EnhancedQuadrantProfileData } from './types';
import { computeMirrorEval, type MirrorEvalResult } from './mirrorEval';
import { computeDeepSignals, type DeepSignalResult } from './deepSignals';
import { computePhotonicFusionSignal } from './photonicGrid';
import { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';
import {
  ensureCalibrationLoaded,
  isCalibrated,
  getCalibratedStockfishSignal,
  getCalibratedArchetypeSignal,
  getCalibratedPhaseSignal,
  getCalibratedInteractionSignal,
  getCalibratedArchetypePhaseSignal,
  getArchetypeFusionWeights,
  getArchetypeAccuracy,
} from './signalCalibration';

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
 * v29.4: 32-Piece Color Flow data for fusion Component 15.
 * Lightweight subset of the full 32-piece signature — just the
 * asymmetry ratios needed for the fusion signal.
 * All ratios: >1 = white advantage, <1 = black advantage, ~1 = balanced.
 */
export interface Piece32Data {
  activityRatio: number;
  territoryRatio: number;
  survivalRatio: number;
  coordinationRatio: number;
  advancementDelta: number;
  centralityRatio: number;
  captureRatio: number;
  lateMomentumRatio: number;
  developmentRatio: number;
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
  currentMoveNumber: number,
  piece32Data?: Piece32Data | null
): EquilibriumScores {
  // v9.7: ARCHETYPE REMAPPING — garbage archetypes → nearest proven archetype
  // Data: these archetypes are below 40% even in the golden zone (conf 55-64):
  //   sacrificial_kingside_assault: 37.6% | sacrificial_queenside_break: 39.4%
  //   development_focus: 2.2% | king_hunt: 35.3%
  // Remap for signal calculation only (stored archetype unchanged for tracking)
  const ARCHETYPE_REMAP: Record<string, string> = {
    sacrificial_kingside_assault: 'kingside_attack',      // 69.2% golden zone
    sacrificial_queenside_break: 'queenside_expansion',   // 80.2% golden zone
    development_focus: 'closed_maneuvering',              // 70.2% golden zone
    king_hunt: 'kingside_attack',                         // 69.2% golden zone
    minor_piece_coordination: 'piece_harmony',            // 57.1% golden zone
    central_knight_outpost: 'central_domination',         // 71.1% golden zone
    bishop_pair_mastery: 'positional_squeeze',            // 79.3% golden zone
    // v32: piece_balanced_activity → closed_maneuvering (balanced = no forcing lines, mutual pressure)
    piece_balanced_activity: 'closed_maneuvering',
    // v32.1: piece_* archetypes from Lichess DB ingest — NOT in ARCHETYPE_DEFINITIONS.
    // Without remaps these fall through to undefined → zero archetype calibration signal.
    // Mapped by structural similarity to calibrated tactical archetypes:
    piece_queen_dominance:  'central_domination',   // Queen dominating open files = central control
    piece_rook_activity:    'open_tactical',         // Active rooks = open files = open tactical battle
    piece_bishop_control:   'positional_squeeze',    // Bishop pair long diagonals = positional squeeze
    piece_knight_maneuver:  'closed_maneuvering',    // Knight outposts = closed/semi-closed maneuvering
    piece_activity:         'open_tactical',         // Generic high piece activity = open tactical
    piece_endgame:          'endgame_technique',     // Piece endgame = technique
    piece_attack:           'sacrificial_attack',    // Direct piece attack = sacrificial attack
    piece_defense:          'prophylactic_defense',  // Defensive piece play = prophylactic
  };
  const effectiveArchetypeName = ARCHETYPE_REMAP[signature.archetype] || signature.archetype;
  const archetype = ARCHETYPE_DEFINITIONS[effectiveArchetypeName] || ARCHETYPE_DEFINITIONS[signature.archetype];
  const quadrant = signature.quadrantProfile;
  const temporal = signature.temporalFlow;
  
  // v12: SELF-LEARNING — load empirical signal calibrations from 700K+ outcomes
  ensureCalibrationLoaded();
  
  // ===== COMPONENT 1: Board Control Signals =====
  const controlSignal = calculateControlSignal(signature);
  
  // ===== COMPONENT 2: Temporal Momentum =====
  const momentumSignal = calculateMomentumSignal(temporal);
  
  // ===== COMPONENT 3: Archetype Historical Rates =====
  // v7.91: Pass dominantSide so archetype signal knows WHO is attacking
  // v9.7: Use remapped archetype name for signal lookup
  const archetypeSignal = calculateArchetypeSignal(effectiveArchetypeName, archetype, signature.dominantSide);
  
  // ===== COMPONENT 4: Stockfish Evaluation =====
  const sfSignal = calculateStockfishSignal(stockfishEval);
  
  // ===== COMPONENT 5: Game Phase Context =====
  const phaseSignal = calculatePhaseSignal(currentMoveNumber, signature.intensity);
  
  // ===== COMPONENT 6: King Safety Signal (NEW v10 — from enhanced signals) =====
  const kingSafetySignal = calculateKingSafetySignal(signature.enhancedSignals);
  
  // ===== COMPONENT 7: Pawn Structure Signal (NEW v10 — from enhanced signals) =====
  const pawnStructureSignal = calculatePawnStructureSignal(signature.enhancedSignals);
  
  // ===== COMPONENT 8: Enhanced Control Signal (NEW v10 — full 8-quadrant profile) =====
  const enhancedControlSignal = calculateEnhancedControlSignal(signature.enhancedProfile, signature.enhancedSignals);
  
  // ===== COMPONENT 9: RELATIVITY CONVERGENCE (v11 — dual inversion, all positive) =====
  // Not a weighted signal (avoids three-body). A PERSPECTIVE on equilibrium.
  // When 1/matter converges with 1/shadow → universe is balanced → draw.
  const relativity = computeRelativityConvergence(signature.enhancedProfile, signature.enhancedSignals);
  
  // ===== COMPONENT 10: INTERACTION SIGNAL (v12.1 — archetype × eval learned distribution) =====
  // The most powerful signal: captures how archetypes BEHAVE DIFFERENTLY at different eval levels.
  // e.g., kingside_attack at +100cp → 72% white (much higher than separate signals imply)
  // When available, steals weight from separate archetype (0.10) and SF (0.10) signals
  // because the interaction is strictly more informative than the two independent components.
  const interactionSignal = getCalibratedInteractionSignal(effectiveArchetypeName, stockfishEval);
  const hasInteraction = !!(interactionSignal && interactionSignal.sampleSize >= 100);
  
  // ===== COMPONENT 11: ARCHETYPE × PHASE TEMPORAL SIGNAL (v17.8) =====
  // The missing dimension: different archetypes peak at different game phases.
  // kingside_attack at move 25 is very different from kingside_attack at move 45.
  // When available, steals weight from separate archetype (0.03) and phase (0.02) signals
  // because the interaction is strictly more informative than the two independent components.
  const archPhaseSignal = getCalibratedArchetypePhaseSignal(effectiveArchetypeName, currentMoveNumber);
  const hasArchPhase = !!(archPhaseSignal && archPhaseSignal.sampleSize >= 100);
  
  // ===== COMPONENT 12: EP 3D MIRROR EVAL (v22.0 — SF-independent position evaluation) =====
  // EP's own centipawn-equivalent eval from color flow signals alone.
  // 3 dimensions: Spatial (8-quad territory) × Force (king safety + pawns + coordination) × Temporal (momentum multiplier)
  // Critical in 0-50cp zone where SF is useless (11% accuracy) but EP has +44pp edge.
  const mirrorEval = computeMirrorEval(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber
  );
  
  // ===== COMPONENT 13: DEEP SIGNALS (v24.0 — compound conversion signals) =====
  // Three new dimensions that capture CONVERSION POTENTIAL:
  //   1. Momentum Gradient: rate of change of advantage (acceleration/deceleration)
  //   2. Coordination Potential: do pieces work together toward conversion?
  //   3. Structural Destiny: is the pawn structure heading toward winnable or drawable?
  // These combine existing raw features in ways the scalar signals miss.
  const deepSignals = computeDeepSignals(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber,
    stockfishEval
  );
  const hasDeepSignals = deepSignals.signalCount >= 2;
  
  // ===== COMPONENT 14: PHOTONIC GRID FUSION (v29.2 — 7D spatial frequency analysis) =====
  // Derives per-square photonic patterns from enhanced signals: spatial alignment,
  // spectral imbalance, contestation, hotspot detection, cold zones, coordination, trajectories.
  // Cross-intel data: EP+Photonic agree → 73.1% correct. Photonic wins 37% of disagreements.
  // TARGET: 0-50cp zone where SF is ~23% and EP is ~30%. Photonic adds independent spatial signal.
  // Weight: 8% in 0-200cp zone (where spatial patterns matter), 0% above 200cp (SF is reliable).
  const photonicSignal = computePhotonicFusionSignal(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber
  );
  const hasPhotonic = photonicSignal.confidence > 0.2;
  
  // ===== COMPONENT 15: 32-PIECE COLOR FLOW FUSION (v29.4) =====
  // Each of 32 starting pieces tracked individually: activity, territory, survival,
  // coordination, advancement, centrality, captures, late momentum, development.
  // These are PIECE-CENTRIC features — fundamentally different from the board-centric
  // signals in Components 1-14. Two positions can have identical board signatures but
  // very different piece dynamics (e.g., one side's knight is hyperactive vs passive).
  // Convert 9 asymmetry ratios into a 3-way (white/black/draw) fusion signal.
  const piece32Signal = computePiece32FusionSignal(piece32Data);
  const hasPiece32 = piece32Signal.confidence > 0.15;
  
  // ===== v12.1: ABSTAIN MECHANISM — detect poison zones =====
  // When calibration shows this archetype×eval zone has accuracy < random (33.3%),
  // flag it so confidence gets capped downstream. System knows when it's guessing blind.
  const zoneAccuracy = getArchetypeAccuracy(effectiveArchetypeName);
  const isPoisonZone = zoneAccuracy && zoneAccuracy.sampleSize >= 200 && zoneAccuracy.accuracy < 0.35;
  
  // ===== FUSION: Weighted combination of signals =====
  // v12.1: When interaction signal is available, redistribute weight from separate
  // archetype and SF signals (which it subsumes) to the learned interaction.
  // v17.8: Per-archetype fusion weight auto-tuning — learned multipliers adjust
  // which signals matter most for each archetype (e.g., kingSafety for kingside_attack)
  // v22.0: Mirror eval steals weight from SF in the 0-50cp zone where SF is useless
  const archetypeFusionAdj = getArchetypeFusionWeights(effectiveArchetypeName);
  const hasEnhanced = !!(signature.enhancedSignals && signature.enhancedProfile);
  const hasMirrorEval = mirrorEval.signalCount >= 3;
  // v19.0: ENDGAME REWEIGHTING — in endgame (46+), SF calculation depth matters more
  // and color flow grids are sparser (fewer pieces = fewer visits). Boost SF + pawnStructure,
  // reduce control + momentum which rely on grid density.
  const isEndgame = currentMoveNumber >= 46;
  // v32: EARLY DEEP ENDGAME (51-60) — live 200K data: EP 76.3% vs SF 76.8% → -0.5pp.
  // SF holds a micro-lead here. Add mild confidence cap + phase SF boost to correct.
  const isEarlyDeepEndgame = currentMoveNumber >= 51 && currentMoveNumber < 61;
  const isDeepEndgame = currentMoveNumber >= 61;
  // v29.6: Very deep endgame (66+) — EP -4.2pp vs SF on 307 games.
  // Color flow grids are extremely sparse here. SF's tablebase-like depth dominates.
  const isVeryDeepEndgame = currentMoveNumber >= 66;
  
  // v30.3: PHASE-AWARE EP/SF MULTIPLIER — from 5-move bucket analysis on 2.5M games
  // EP dominates early game, SF takes over in late middlegame/endgame.
  // This stacks with eval zone multiplier for 2D calibration (zone × phase).
  //   1-5:   EP +11.9pp → strong EP phase boost
  //   6-10:  EP +10.4pp → strong EP phase boost
  //   11-15: EP +9.4pp  → solid EP phase boost
  //   16-20: EP +5.9pp  → moderate EP phase boost
  //   21-25: EP +3.4pp  → slight EP phase boost
  //   26-30: EP +1.4pp  → near-neutral
  //   31-35: EP -0.0pp  → dead even (crossover)
  //   36-40: SF +1.6pp  → slight SF phase boost
  //   41-45: SF +3.2pp  → moderate SF phase boost
  //   46-55: SF +3.0-3.5pp → SF endgame strength
  //   56+:   EP +1.9-4.9pp → EP resurgence (sparse grids but SF also weak)
  const phaseEpMult = currentMoveNumber <= 5 ? 1.15 :
                      currentMoveNumber <= 10 ? 1.12 :
                      currentMoveNumber <= 15 ? 1.10 :
                      currentMoveNumber <= 20 ? 1.07 :
                      currentMoveNumber <= 25 ? 1.04 :
                      currentMoveNumber <= 30 ? 1.01 :
                      currentMoveNumber <= 35 ? 1.0 :
                      currentMoveNumber <= 45 ? 0.96 :
                      currentMoveNumber <= 55 ? 0.94 :
                      1.0;  // 56+: neutral (both weak, EP slight edge)
  const phaseSfMult = currentMoveNumber <= 5 ? 0.80 :
                      currentMoveNumber <= 10 ? 0.82 :
                      currentMoveNumber <= 15 ? 0.85 :
                      currentMoveNumber <= 20 ? 0.90 :
                      currentMoveNumber <= 25 ? 0.95 :
                      currentMoveNumber <= 30 ? 0.98 :
                      currentMoveNumber <= 35 ? 1.0 :
                      currentMoveNumber <= 45 ? 1.05 :
                      currentMoveNumber <= 55 ? 1.12 :  // v32: boosted to match phaseSfMult
                      1.02;  // v32: 56+ SF respectable even in deep endgame
  
  // v22.2: ZONE-AWARE mirror eval weights (tuned from v22.0-v22.1 data)
  // Data from 25K+ games per iteration:
  //   0-50cp:   mirror eval HURTS (52.8% vs 54.9% baseline) — double-counts EP signals
  //   50-200cp: mirror eval HELPS (+2.1pp in 50-100, +0.9pp in 100-200)
  //   200+cp:   neutral — SF is reliable, mirror eval adds nothing
  // Strategy: ZERO weight in 0-50cp, 10% in 50-200cp, 2% above 200cp
  const absEval = Math.abs(stockfishEval);
  const sfIsWeak = absEval < 50;
  
  // v23.0: Intensity tracking (used by reversal guard downstream, NOT for weight boosting)
  // v23.0a REVERTED intensity boost: SF is also bad in high-intensity zones, boosting SF hurt -3pp.
  const signalIntensity = signature.intensity || 0;
  const intensityBoost = 0; // REVERTED — was hurting accuracy
  let mirrorEvalWeight = 0;
  if (hasMirrorEval) {
    if (absEval < 50) mirrorEvalWeight = 0;            // ZERO — EP already has full signal here
    else if (absEval < 200) mirrorEvalWeight = 0.10;   // 10% — mirror eval's sweet spot
    else mirrorEvalWeight = 0.02;                       // 2% — SF is reliable
  }
  const sfWeightReduction = mirrorEvalWeight; // Mirror eval steals from SF
  
  // v17.8: archetype×phase steals from independent archetype (-0.03) and phase (-0.02)
  // v24.2: Deep signals removed from fusion weights — they're derivatives of the same data.
  // Instead used as POST-FUSION tiebreaker in 0-100cp zone (see below).
  const deepWeight = 0;
  const deepStealControl = 0;
  const deepStealMomentum = 0;
  const deepStealPhase = 0;
  
  // v30.3: MICRO-ZONE CALIBRATION — 10-tier eval zones from 2.5M games
  // Old 4-tier was averaging wildly different zones together.
  // Data reveals EP's edge PEAKS at 10-25cp (+28-29pp, SF at 13-15%) then drops
  // sharply at 35-50cp (+1.8pp). Fine-grained zones capture this precisely.
  //
  // ALL-TIME DATA (2,511,852 games):
  //   0-5cp:    EP 36.9% SF 25.0% → edge +11.8pp  (SF slightly useful — near-equal positions)
  //   5-10cp:   EP 40.7% SF 16.5% → edge +24.2pp  (SF nearly blind)
  //   10-15cp:  EP 41.8% SF 13.2% → edge +28.6pp  (SF WORST zone — peak EP dominance)
  //   15-25cp:  EP 43.5% SF 14.7% → edge +28.8pp  (SF still blind, EP strongest)
  //   25-35cp:  EP 46.1% SF 26.2% → edge +20.0pp  (SF waking up, EP still dominant)
  //   35-50cp:  EP 47.6% SF 45.8% → edge +1.8pp   (SF competitive — transition zone)
  //   50-75cp:  EP 51.1% SF 51.3% → edge -0.2pp   (dead even)
  //   75-100cp: EP 52.2% SF 58.2% → edge -6.0pp   (SF takes over)
  //   100-150cp:EP 61.2% SF 57.2% → edge +4.0pp   (EP resurgence — pattern zone)
  //   150-200cp:EP 60.4% SF 63.8% → edge -3.4pp   (SF wins again)
  //   200+cp:   SF dominates increasingly
  //
  // 24H DATA confirms and amplifies: 10-25cp edge is +38-42pp in recent data.
  const sfZoneMultiplier = absEval < 5 ? 0.55 :     // Near-equal: SF has some signal, reduce moderately
                           absEval < 10 ? 0.25 :     // SF nearly blind (16.5%) — heavy reduction
                           absEval < 15 ? 0.20 :     // SF WORST (13.2%) — maximum reduction
                           absEval < 25 ? 0.20 :     // SF still blind (14.7%) — maximum reduction
                           absEval < 35 ? 0.35 :     // SF waking up (26.2%) — moderate reduction
                           absEval < 50 ? 0.80 :     // SF competitive (45.8%) — light reduction
                           absEval < 75 ? 0.95 :     // Dead even — near-full SF
                           absEval < 100 ? 1.05 :    // SF leads (-6pp) — slight SF boost
                           absEval < 150 ? 0.75 :    // EP resurgence (+4pp) — reduce SF
                           absEval < 200 ? 0.90 :    // SF leads (-3.4pp) — moderate SF
                           1.0;                       // 200+: full SF weight
  // EP boost: mirrors the micro-zone edge data
  const epBoost = absEval < 5 ? 1.20 :      // +11.8pp edge — moderate boost
                  absEval < 10 ? 1.50 :      // +24.2pp — strong boost
                  absEval < 15 ? 1.55 :      // +28.6pp — peak EP zone
                  absEval < 25 ? 1.55 :      // +28.8pp — peak EP zone
                  absEval < 35 ? 1.40 :      // +20.0pp — strong boost
                  absEval < 50 ? 1.05 :      // +1.8pp — marginal boost
                  absEval < 75 ? 1.0 :       // Dead even — neutral
                  absEval < 100 ? 0.92 :     // SF leads — reduce EP slightly
                  absEval < 150 ? 1.15 :     // EP resurgence — boost EP
                  absEval < 200 ? 0.95 :     // SF leads — reduce EP slightly
                  1.0;                        // 200+: neutral
  
  // v30.3: 2D calibration — stack eval zone multiplier × phase multiplier
  // Example: move 8, eval 15cp → epBoost 1.55 × phaseEpMult 1.12 = 1.74x EP weight
  //          move 42, eval 80cp → epBoost 0.92 × phaseEpMult 0.96 = 0.88x EP weight
  const combinedEpBoost = epBoost * phaseEpMult;
  const combinedSfMult = sfZoneMultiplier * phaseSfMult;
  
  const weights = hasEnhanced ? {
    control: ((isEndgame ? 0.06 : 0.12) - deepStealControl) * combinedEpBoost,
    momentum: ((isEndgame ? 0.06 : 0.12) - deepStealMomentum) * combinedEpBoost,
    archetype: hasInteraction ? (hasArchPhase ? 0.00 : 0.02) : (hasArchPhase ? 0.07 : 0.10),
    // v29.6: Very deep endgame (66+) gets 1.3x SF boost on top of endgame weights
    stockfish: ((hasInteraction ? (isEndgame ? 0.28 : 0.17) : (isEndgame ? 0.35 : 0.25)) - sfWeightReduction + intensityBoost) * combinedSfMult * (isVeryDeepEndgame ? 1.3 : 1.0),
    phase: (hasArchPhase ? 0.04 : 0.06) - deepStealPhase,
    kingSafety: (isEndgame ? 0.06 : 0.12) * combinedEpBoost,
    pawnStructure: isEndgame ? 0.14 : 0.08,
    enhancedControl: (isEndgame ? 0.10 : 0.15) * combinedEpBoost,
    interaction: hasInteraction ? 0.16 : 0,
    archetypePhase: hasArchPhase ? 0.05 : 0,
    mirrorEval: mirrorEvalWeight,
    deepSignals: deepWeight,
    photonic: hasPhotonic && absEval < 100 ? 0.10 : 0, // v32: Tightened 200→100 (data: 50-200cp -1.7pp, 0-50cp +0.9pp)
    piece32: hasPiece32 && absEval < 200 ? 0.08 * combinedEpBoost : 0, // v29.4: 32-piece in 0-200cp zone
  } : {
    control: 0.25,
    momentum: 0.20,
    archetype: hasInteraction ? (hasArchPhase ? 0.02 : 0.05) : (hasArchPhase ? 0.10 : 0.15),
    stockfish: (hasInteraction ? 0.20 : 0.30) - (hasMirrorEval && sfIsWeak ? 0.08 : 0) + intensityBoost,
    phase: hasArchPhase ? 0.07 : 0.10,
    kingSafety: 0,
    pawnStructure: 0,
    enhancedControl: 0,
    interaction: 0,
    archetypePhase: hasArchPhase ? 0.06 : 0,
    mirrorEval: hasMirrorEval && sfIsWeak ? 0.08 : 0,
    deepSignals: 0, // Deep signals require enhanced data
    photonic: 0, // Photonic requires enhanced data
    piece32: hasPiece32 && absEval < 200 ? 0.08 : 0, // v29.4: 32-piece works without enhanced data
  };
  
  // v17.8: Apply per-archetype fusion weight auto-tuning
  // When learned multipliers exist, adjust signal weights for this specific archetype
  // e.g., kingside_attack → boost kingSafety, positional_squeeze → boost pawnStructure
  if (archetypeFusionAdj && archetypeFusionAdj.sampleSize >= 200) {
    weights.stockfish *= archetypeFusionAdj.sfMultiplier;
    weights.control *= archetypeFusionAdj.controlMultiplier;
    weights.momentum *= archetypeFusionAdj.momentumMultiplier;
    weights.kingSafety *= archetypeFusionAdj.kingSafetyMultiplier;
    weights.pawnStructure *= archetypeFusionAdj.pawnStructureMultiplier;
    
    // Renormalize so weights sum to ~1.0
    const wKeys = Object.keys(weights) as (keyof typeof weights)[];
    const totalW = wKeys.reduce((s, k) => s + weights[k], 0);
    if (totalW > 0) {
      for (const k of wKeys) weights[k] /= totalW;
    }
  }
  
  // Interaction signal: use empirical distribution if available, else zero-weight placeholder
  const iSignal = hasInteraction 
    ? { white: interactionSignal!.white, black: interactionSignal!.black, draw: interactionSignal!.draw }
    : { white: 33, black: 33, draw: 34 };
  
  // v17.8: Archetype×phase signal — use empirical distribution if available
  const apSignal = hasArchPhase
    ? { white: archPhaseSignal!.white, black: archPhaseSignal!.black, draw: archPhaseSignal!.draw }
    : { white: 33, black: 33, draw: 34 };
  
  // v22.0: Convert 3D mirror eval (centipawns) → 3-way signal (white/black/draw)
  // Uses confidence-weighted sigmoid: strong eval + high confidence = decisive signal
  const mEvalWeight = (weights as Record<string, number>).mirrorEval || 0;
  let mirrorSignal = { white: 33, black: 33, draw: 34 };
  if (mEvalWeight > 0 && mirrorEval.signalCount >= 3) {
    const mEv = mirrorEval.eval;
    const mConf = mirrorEval.confidence;
    const absMEv = Math.abs(mEv);
    // Scale advantage by confidence: high confidence amplifies, low dampens
    const scaledAdv = Math.min(30, absMEv / 5 * mConf);
    const drawPenalty = Math.min(15, absMEv / 8 * mConf);
    if (mEv > 10) {
      mirrorSignal = { white: 35 + scaledAdv, black: 30 - scaledAdv / 2, draw: 35 - drawPenalty };
    } else if (mEv < -10) {
      mirrorSignal = { white: 30 - scaledAdv / 2, black: 35 + scaledAdv, draw: 35 - drawPenalty };
    } else {
      // Near-zero eval = draw lean, amplified by 3D alignment confidence
      mirrorSignal = { white: 32, black: 32, draw: 36 + mConf * 4 };
    }
  }
  
  // Calculate raw scores for each outcome
  const interactionWeight = (weights as Record<string, number>).interaction || 0;
  const archPhaseWeight = (weights as Record<string, number>).archetypePhase || 0;
  const whiteRaw = 
    controlSignal.white * weights.control +
    momentumSignal.white * weights.momentum +
    archetypeSignal.white * weights.archetype +
    sfSignal.white * weights.stockfish +
    phaseSignal.white * weights.phase +
    kingSafetySignal.white * weights.kingSafety +
    pawnStructureSignal.white * weights.pawnStructure +
    enhancedControlSignal.white * weights.enhancedControl +
    iSignal.white * interactionWeight +
    apSignal.white * archPhaseWeight +
    mirrorSignal.white * mEvalWeight +
    deepSignals.signal.white * deepWeight +
    photonicSignal.signal.white * ((weights as Record<string, number>).photonic || 0) +
    piece32Signal.signal.white * ((weights as Record<string, number>).piece32 || 0);
    
  const blackRaw = 
    controlSignal.black * weights.control +
    momentumSignal.black * weights.momentum +
    archetypeSignal.black * weights.archetype +
    sfSignal.black * weights.stockfish +
    phaseSignal.black * weights.phase +
    kingSafetySignal.black * weights.kingSafety +
    pawnStructureSignal.black * weights.pawnStructure +
    enhancedControlSignal.black * weights.enhancedControl +
    iSignal.black * interactionWeight +
    apSignal.black * archPhaseWeight +
    mirrorSignal.black * mEvalWeight +
    deepSignals.signal.black * deepWeight +
    photonicSignal.signal.black * ((weights as Record<string, number>).photonic || 0) +
    piece32Signal.signal.black * ((weights as Record<string, number>).piece32 || 0);
    
  const drawRaw = 
    controlSignal.draw * weights.control +
    momentumSignal.draw * weights.momentum +
    archetypeSignal.draw * weights.archetype +
    sfSignal.draw * weights.stockfish +
    phaseSignal.draw * weights.phase +
    kingSafetySignal.draw * weights.kingSafety +
    pawnStructureSignal.draw * weights.pawnStructure +
    enhancedControlSignal.draw * weights.enhancedControl +
    iSignal.draw * interactionWeight +
    apSignal.draw * archPhaseWeight +
    mirrorSignal.draw * mEvalWeight +
    deepSignals.signal.draw * deepWeight +
    photonicSignal.signal.draw * ((weights as Record<string, number>).photonic || 0) +
    piece32Signal.signal.draw * ((weights as Record<string, number>).piece32 || 0);
  
  // v9.2: Draw convergence amplifier (tuned back from v9.1)
  // Only amplify when strong convergence — v9.1 was too aggressive (thresholds too low)
  // The principle: multiple INDEPENDENT signals agreeing on draw = genuine neutralization
  const drawSignals = [
    controlSignal.draw, momentumSignal.draw, archetypeSignal.draw,
    sfSignal.draw, phaseSignal.draw,
    kingSafetySignal.draw, pawnStructureSignal.draw, enhancedControlSignal.draw,
    ...(hasArchPhase ? [apSignal.draw] : []),
  ];
  const drawStrongCount = drawSignals.filter(d => d >= 38).length;
  const drawFavorCount = drawSignals.filter(d => d >= 35).length;
  
  // v9.7: Draw convergence amplifier — much stricter than v9.4
  // Data: draw predictions at 27.7% accuracy (below random 33%). We are OVER-predicting draws.
  // Fix: require 6+ strong signals (was 4+), reduce boost magnitude, heavier early penalty
  let drawBoost = 0;
  const earlyMovePenalty = currentMoveNumber <= 20 ? 2 : currentMoveNumber <= 30 ? 1 : 0;
  if (drawStrongCount >= (6 + earlyMovePenalty)) {
    drawBoost = 1.0 + (drawStrongCount - 6 - earlyMovePenalty) * 0.5;
  } else if (drawFavorCount >= (6 + earlyMovePenalty)) {
    drawBoost = 0.3;
  }
  
  const adjustedDrawRaw = drawRaw + drawBoost;
  
  // v11: RELATIVITY CONVERGENCE (above) computes dual-inversion of matter & shadow.
  // All positive values, no negatives, no zeros. Uses reciprocal (1/x) not negation.
  // convergenceRatio informs draw margin easing below.
  // Raw score adjustments were benchmarked and hurt (-1pp to -8.9pp).
  // The convergence approach is perspective-based, not weight-based (avoids three-body).
  
  // Normalize to sum to 100
  const total = whiteRaw + blackRaw + adjustedDrawRaw;
  const whiteConfidence = Math.round((whiteRaw / total) * 100);
  const blackConfidence = Math.round((blackRaw / total) * 100);
  const drawConfidence = Math.round((adjustedDrawRaw / total) * 100);
  
  // Determine prediction from highest confidence
  let prediction: 'white_wins' | 'black_wins' | 'draw';
  let finalConfidence: number;
  let reasoning: string;
  
  // v9.0-TRUE-3WAY: All three outcomes compete equally.
  // SF eval is already baked into signals (30% weight via calculateStockfishSignal).
  // No separate SF override layer — the fusion scores ARE the decision.
  // Draw is a first-class outcome, not an afterthought.
  
  // v21.0: STRICT DRAW DETECTION — accuracy-first approach
  //
  // LESSON LEARNED from v20.x: draw detection at 8-14% precision HURTS overall accuracy.
  // Draws are 4% of games. False draw calls cost ~3pp overall.
  // Strategy: only predict draw when draw score GENUINELY dominates.
  // Accept missing most draws — the 96% decisive accuracy matters more.
  //
  // Path to 75%: stop losing points on bad draw calls, improve decisive predictions.
  
  const MIN_DRAW_MARGIN = 4; // Draw must lead by 4pp — very strict
  const suppressDrawsEntirely = currentMoveNumber <= 20; // No draws in opening/early middlegame
  
  // v22.3: MIRROR EVAL DRAW RESCUE — detect draws in 200-500cp zone
  let effectiveDrawMargin = MIN_DRAW_MARGIN;
  if (hasMirrorEval && absEval >= 150 && absEval <= 500 && currentMoveNumber >= 25) {
    const temporalShrinking = mirrorEval.dimensions.temporal < 0.75;
    const mirrorNearZero = Math.abs(mirrorEval.eval) < 40;
    if (temporalShrinking && mirrorNearZero) {
      effectiveDrawMargin = 1;
    }
  }
  
  // Find the winner: highest confidence wins
  const decisiveMax = Math.max(whiteConfidence, blackConfidence);
  const drawLeadsBy = drawConfidence - decisiveMax;
  
  if (suppressDrawsEntirely || drawLeadsBy < effectiveDrawMargin) {
    // Draw doesn't dominate — pick between white and black
    if (whiteConfidence >= blackConfidence) {
      prediction = 'white_wins';
      finalConfidence = whiteConfidence;
      reasoning = `White leads (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp)`;
    } else {
      prediction = 'black_wins';
      finalConfidence = blackConfidence;
      reasoning = `Black leads (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp)`;
    }
  } else {
    // Draw genuinely dominates — allow it
    prediction = 'draw';
    finalConfidence = drawConfidence;
    reasoning = `Draw leads by ${drawLeadsBy}pp (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp${effectiveDrawMargin < MIN_DRAW_MARGIN ? ' mirror-rescue' : ''})`;
  }
  
  // v23.0c REVERTED: Draw override in 0-50cp zone had 8.7% precision (2/23 correct).
  // 85% of 0-50cp games are decisive — false draw calls destroy more accuracy than correct ones gain.
  // LESSON: Draw detection in low-eval zones is a trap. The 0-50cp edge comes from picking
  // the RIGHT SIDE in decisive games, not from detecting draws.
  
  // v21.0: SF AGREEMENT SYSTEM — the biggest lever to 75%
  //
  // Data from 5000 games (moves 21-40):
  //   EP+SF agree:    76.2% accuracy ✅ (already above 75% target)
  //   EP+SF disagree: 50.5% accuracy (coin flip)
  //   When EP wrong-side: SF also wrong 90% of the time
  //   SF eval direction accuracy: 72.1%
  //
  // Strategy: When EP and SF disagree and SF has strong eval, defer to SF.
  // When they agree, trust the prediction more.
  
  const sfDirection: 'white_wins' | 'black_wins' | 'draw' = 
    stockfishEval > 50 ? 'white_wins' : stockfishEval < -50 ? 'black_wins' : 'draw';
  const epSfAgree = prediction === sfDirection;
  const absEvalForNudge = Math.abs(stockfishEval);
  
  // DISAGREEMENT OVERRIDE: When EP and SF disagree on direction
  // and SF has a strong eval, override EP with SF's pick.
  // v29.5: Zone-aware override threshold. Data from 51K games:
  //   0-50cp:   EP wins 72% of disagreements → high threshold (never override)
  //   50-100cp: SF wins 80% of disagreements → low threshold (75cp)
  //   100+cp:   Mixed → moderate threshold (150cp)
  // v29.6: Lowered 50-100cp threshold from 75→55. 15K data: EP wins only 23%
  // of disagreements in 50-100cp. SF needs to override EP more aggressively here.
  const sfOverrideThreshold = absEvalForNudge < 50 ? 9999 :  // Never override EP in 0-50cp
                              absEvalForNudge < 100 ? 55 :   // SF very reliable in 50-100cp
                              150;                            // Moderate elsewhere
  if (!epSfAgree && prediction !== 'draw' && sfDirection !== 'draw' && absEvalForNudge > sfOverrideThreshold) {
    prediction = sfDirection;
    finalConfidence = Math.max(whiteConfidence, blackConfidence);
    reasoning = `SF override: EP disagreed, SF=${stockfishEval}cp → ${sfDirection}`;
  }
  
  // TIGHT MARGIN SF NUDGE: When scores are close, use SF to break ties
  const scores = [
    { cls: 'white_wins' as const, score: whiteConfidence },
    { cls: 'black_wins' as const, score: blackConfidence },
    { cls: 'draw' as const, score: drawConfidence },
  ].sort((a, b) => b.score - a.score);
  
  const margin = scores[0].score - scores[1].score;
  // v29.5: Zone-aware nudge. In 50-100cp SF wins 80% of disagreements → allow nudge.
  // In 0-50cp EP dominates → block nudge. Above 100cp → allow nudge.
  // v29.6: Lowered from 75→55 to match override threshold
  const sfNudgeThreshold = absEvalForNudge < 50 ? 9999 : 55;
  if (margin <= 8 && prediction !== 'draw' && absEvalForNudge > sfNudgeThreshold) {
    // SF has a clear opinion — favor the decisive side
    const sfFavor = stockfishEval > 0 ? 'white_wins' : 'black_wins';
    if (scores[0].cls === sfFavor || scores[1].cls === sfFavor) {
      prediction = sfFavor;
      finalConfidence = Math.max(scores[0].score, scores[1].score);
      reasoning = `Tight margin (${margin}pp), SF nudge ${stockfishEval}cp → ${sfFavor}`;
    }
  }
  
  // v22.4: LOW-CONFIDENCE SF DEFERENCE
  // Data: low-conf (30-40) predictions are 57.8% accurate.
  //   When EP+SF agree at low-conf: 61.3%
  //   When EP+SF disagree at low-conf: 53.8% (coin flip)
  // Strategy: when EP's margin is tiny (<3pp) and SF has any opinion (>50cp),
  // defer to SF direction. This boosts the low-conf zone without hurting high-conf.
  // v29.5: Zone-aware deference. Same logic: SF reliable in 50-100cp, not in 0-50cp.
  // v29.6: Lowered from 75→55 to match override threshold
  const sfDeferThreshold = absEvalForNudge < 50 ? 9999 : 55;
  if (margin <= 3 && prediction !== 'draw' && sfDirection !== 'draw' && !epSfAgree && absEvalForNudge > sfDeferThreshold) {
    prediction = sfDirection;
    finalConfidence = Math.max(whiteConfidence, blackConfidence);
    reasoning = `Low-conf deference (margin=${margin}pp), SF=${stockfishEval}cp → ${sfDirection}`;
  }
  
  // v23.0a REVERTED: High-intensity reversal guard hurt accuracy.
  // SF is also bad in high-intensity zones — deferring to SF when EP disagrees
  // just trades EP's errors for SF's errors with no net gain.
  
  // v24.5 int-cap moved to post-calibration (see below line ~598)
  
  // v24.2: DEEP SIGNAL TIEBREAKER — 0-100cp zone only
  // When the fusion margin is tight (<6pp) and we're in the low-eval zone where
  // picking the RIGHT SIDE matters most, use deep signals to break the tie.
  // Deep signals capture conversion potential (coordination aimed at king,
  // supported passers, momentum acceleration) that scalar signals miss.
  if (hasDeepSignals && absEval < 100 && margin <= 6 && prediction !== 'draw' && currentMoveNumber >= 15) {
    const ds = deepSignals;
    // Only act when deep signals have a directional opinion (lowered from +3 to +1 for balanced positions)
    const dsDirection = ds.signal.white > ds.signal.black + 1 ? 'white_wins' :
                        ds.signal.black > ds.signal.white + 1 ? 'black_wins' : null;
    if (dsDirection && dsDirection !== prediction) {
      // Deep signals disagree with fusion — check if deep signals have any confirmation
      const dsMargin = Math.abs(ds.signal.white - ds.signal.black);
      const dsHasSignal = dsMargin > 2 && ds.signalCount >= 2;
      // Confirmation: sub-signals agree (lowered thresholds for balanced positions)
      const momAgrees = (dsDirection === 'white_wins' && ds.momentumGradient.gradient > 5) ||
                        (dsDirection === 'black_wins' && ds.momentumGradient.gradient < -5);
      const coordAgrees = (dsDirection === 'white_wins' && ds.coordinationPotential.conversionScore > 5) ||
                          (dsDirection === 'black_wins' && ds.coordinationPotential.conversionScore < -5);
      const structAgrees = (dsDirection === 'white_wins' && ds.structuralDestiny.destinyScore > 5) ||
                           (dsDirection === 'black_wins' && ds.structuralDestiny.destinyScore < -5);
      const confirmations = (momAgrees ? 1 : 0) + (coordAgrees ? 1 : 0) + (structAgrees ? 1 : 0);
      
      // Require at least 1 sub-signal confirmation (was 2 — too strict for balanced positions)
      if (dsHasSignal && confirmations >= 1) {
        prediction = dsDirection;
        finalConfidence = Math.max(whiteConfidence, blackConfidence);
        reasoning = `Deep signal tiebreak (margin=${margin}pp, ds=${dsMargin.toFixed(1)}, confirms=${confirmations}) → ${dsDirection}`;
      }
    }
  }
  
  // v17.8: UNIVERSAL PER-ARCHETYPE CONFIDENCE CALIBRATION
  // The benchmark must be FAIR — every archetype gets calibrated confidence that
  // matches its actual empirical accuracy. No archetype gets inflated or deflated
  // confidence relative to its true performance.
  //
  // Three layers:
  //   1. Per-archetype accuracy scaling: confidence tracks actual accuracy
  //   2. Volume penalty: low-volume archetypes get dampened (less certain)
  //   3. Golden zone preservation: the 55-64 internal range is genuinely high-accuracy
  //
  // This replaces the old one-size-fits-all recalibration (v9.6) which treated
  // all archetypes identically despite 20+pp accuracy differences between them.
  const archetypeStats = getArchetypeAccuracy(effectiveArchetypeName);
  
  if (archetypeStats && archetypeStats.sampleSize >= 50) {
    // Per-archetype calibration: scale confidence to match empirical accuracy
    // v19.0: GOLDEN GATE EXPANSION — be less aggressive in capping high-accuracy archetypes
    // If archetype has 70% accuracy, max confidence should be ~78 (was ~75)
    // If archetype has 45% accuracy, max confidence should be ~52 (was ~50)
    const empiricalAccuracy = archetypeStats.accuracy;
    const maxConfForArchetype = Math.round(empiricalAccuracy * 100) + 8; // Expanded from +5 — let strong archetypes breathe
    
    // Volume confidence: more games = more trust in the calibration
    // 50 games = 0.5x trust, 200 games = 0.8x, 1000+ games = 1.0x
    const volumeTrust = Math.min(1.0, 0.5 + (archetypeStats.sampleSize / 2000));
    
    // Blend: high volume → use per-archetype cap; low volume → use generic cap
    const genericCap = finalConfidence >= 55 ? Math.min(75, finalConfidence + 12) : finalConfidence;
    const archetypeCap = Math.min(maxConfForArchetype, finalConfidence >= 55 ? finalConfidence + 8 : finalConfidence);
    
    finalConfidence = Math.round(archetypeCap * volumeTrust + genericCap * (1 - volumeTrust));
  } else {
    // Fallback: generic recalibration for unknown/low-volume archetypes
    // Same as v9.6 but with volume penalty
    if (finalConfidence >= 55 && finalConfidence <= 64) {
      finalConfidence = Math.min(70, finalConfidence + 8); // Reduced from +12 — less optimistic without data
    } else if (finalConfidence >= 65) {
      finalConfidence = 62; // Reduced from 64 — less trust without archetype data
    }
  }
  
  // v19.0: OPENING HARD SUPPRESSION — moves 1-10 at 47.5% accuracy
  // Still predict (for learning) but cap confidence so they don't pollute high-confidence accuracy
  if (currentMoveNumber <= 10) {
    finalConfidence = Math.min(finalConfidence, 38);
  }
  
  // v29.6: DEEP ENDGAME DAMPENING — tiered by depth
  // m61-65: EP ~55% vs SF ~48% — EP still has slight edge, moderate cap
  // m66+:   EP 52.8% vs SF 57.0% — SF wins, aggressive cap + SF deference
  if (isVeryDeepEndgame) {
    finalConfidence = Math.min(finalConfidence, 38); // v29.6: was 45, data shows -4.2pp
  } else if (isDeepEndgame) {
    finalConfidence = Math.min(finalConfidence, 48);
  } else if (isEarlyDeepEndgame) {
    finalConfidence = Math.min(finalConfidence, 55); // v32: 51-60 SF micro-edge zone (-0.5pp)
  }
  
  // v29.6: 45-50 CONFIDENCE CORRECTION — data shows 30.9% actual accuracy (n=327)
  // These predictions are BELOW RANDOM (33.3%). Cap them down to reflect reality.
  if (finalConfidence >= 45 && finalConfidence < 50) {
    finalConfidence = 42; // Force into 40-45 bucket which has 44.2% actual (above random)
  }
  
  // v12.1: ABSTAIN — cap confidence in poison zones
  // When the system knows this archetype has <35% accuracy, don't be confident about it
  if (isPoisonZone) {
    finalConfidence = Math.min(finalConfidence, 40);
  }
  
  // v24.7: HIGH-INTENSITY CONFIDENCE CAP (post-calibration)
  // Data: when intensity >= 40, accuracy drops sharply:
  //   Agree+int<40 = 79.3%, Agree+int>=40 = 63.6% (-15.7pp)
  //   Disagree+int<40 = 50.3%, Disagree+int>=40 = 33.8% (-16.5pp)
  // High intensity = chaotic position = all signals (EP and SF) are noisy.
  // Cap confidence for ALL high-intensity predictions to reflect lower reliability.
  // Use epSfAgree (pre-override) since that's what the data was measured on.
  if (signalIntensity >= 50) {
    // Very high intensity: accuracy ~52-60%. Cap to 55.
    finalConfidence = Math.min(finalConfidence, 55);
    reasoning += ' [int-cap-50+→conf≤55]';
  } else if (signalIntensity >= 40 && !epSfAgree) {
    // High intensity + disagree: accuracy 33.8%. Cap to 42.
    finalConfidence = Math.min(finalConfidence, 42);
    reasoning += ' [int-cap-40+disagree→conf≤42]';
  }
  
  // v25.0: OVERCONFIDENCE CAP — data shows 70+ confidence band = 53.8% accuracy
  // This is WORSE than the 60-69 band (69.0%) and even 50-59 band (57.4%).
  // The system is generating false confidence. Cap at 69 to match the sweet spot.
  // This prevents the confidence→accuracy inversion that leaks ~1-2pp overall.
  if (finalConfidence >= 70) {
    finalConfidence = 69;
    reasoning += ' [overconf-cap-70→69]';
  }
  
  // High clarity = the leading outcome is significantly ahead
  const secondHighest = prediction === 'white_wins' 
    ? Math.max(blackConfidence, drawConfidence)
    : prediction === 'black_wins'
      ? Math.max(whiteConfidence, drawConfidence)
      : Math.max(whiteConfidence, blackConfidence);
  
  const highClarity = !isPoisonZone && finalConfidence - secondHighest >= 15;
  
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
      // v9.3: Contested = mild draw lean (not strong — many contested games are decisive)
      // Universal principle: balanced pressure = neutralization, but only mildly.
      // Need other signals (SF, momentum, phase) to confirm before committing to draw.
      return { white: 32, black: 33, draw: 35 };
  }
}

/**
 * Calculate momentum signal from temporal flow
 * 
 * v9.1: Key insight — balanced momentum + moderate/high volatility means
 * the game is oscillating (back-and-forth). This is a DRAW indicator,
 * not a decisive indicator. Think of it as ripples that cancel out.
 * 
 * Also: when one side has strong momentum but volatility is ALSO high,
 * this could indicate the losing side is creating counterplay/tricks
 * (sacrifice into perpetual, fortress building). This is the
 * "desperation draw" pattern.
 */
function calculateMomentumSignal(
  temporal: TemporalFlow
): { white: number; black: number; draw: number } {
  // Positive = white gaining, negative = black gaining
  const openingToMiddle = temporal.middlegame - temporal.opening;
  const middleToEnd = temporal.endgame - temporal.middlegame;
  
  // Overall momentum trend
  const momentum = openingToMiddle * 0.4 + middleToEnd * 0.6;
  const absMomentum = Math.abs(momentum);
  
  // v9.1: Tension-neutralization detector
  // When momentum REVERSES between phases (opening→mid vs mid→end),
  // the game's tension is settling. One side gained, then the other
  // fought back. This oscillation pattern strongly predicts draws.
  const momentumReversed = (openingToMiddle > 5 && middleToEnd < -5) ||
                           (openingToMiddle < -5 && middleToEnd > 5);
  
  // High volatility suggests unclear result
  const volatilityPenalty = Math.min(temporal.volatility / 3, 20);
  
  if (absMomentum > 15) {
    // One side has momentum, but check for desperation draw pattern
    const gain = Math.min(absMomentum, 40);
    const isWhite = momentum > 0;
    
    // v9.1: "Desperation draw" — one side dominates but volatility is high
    // AND momentum reversed. The losing side is fighting back with tricks
    // (sacrifices into perpetual, stalemate traps, fortress).
    if (momentumReversed && temporal.volatility > 40) {
      // v9.3: Desperation draw — cap drawBonus tighter to avoid over-prediction
      const drawBonus = Math.min(8, temporal.volatility / 6);
      return {
        white: isWhite ? (39 + gain / 2 - drawBonus) : (28 - gain / 4),
        black: isWhite ? (28 - gain / 4) : (39 + gain / 2 - drawBonus),
        draw: 33 + drawBonus - gain / 4
      };
    }
    
    // Standard momentum advantage
    if (isWhite) {
      return { 
        white: 40 + gain - volatilityPenalty / 2, 
        black: 25 - gain / 2, 
        draw: 35 - gain / 2 + volatilityPenalty / 2 
      };
    } else {
      return { 
        white: 25 - gain / 2, 
        black: 40 + gain - volatilityPenalty / 2, 
        draw: 35 - gain / 2 + volatilityPenalty / 2 
      };
    }
  } else {
    // Balanced momentum — the critical draw detection zone
    
    // v9.3: Momentum reversal with balanced result = ripples settled
    // But only a moderate draw lean — many reversed-momentum games are still decisive
    if (momentumReversed) {
      return { white: 31, black: 31, draw: 38 };
    }
    
    if (temporal.volatility > 60) {
      // High volatility + balanced = chaotic — slightly favors decisive
      return { white: 34, black: 34, draw: 32 };
    } else if (temporal.volatility > 30) {
      // v9.3: Moderate volatility + balanced = mild draw lean
      return { white: 32, black: 32, draw: 36 };
    } else {
      // Low volatility in balanced game = quiet draw lean
      return { white: 31, black: 31, draw: 38 };
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
    return { white: 33, black: 33, draw: 34 };
  }
  
  // v12: Use empirical archetype distributions when available
  // The empirical data captures the ACTUAL outcome distribution per archetype
  // across 700K+ games — much more accurate than hand-tuned boosts
  const empirical = getCalibratedArchetypeSignal(archetype);
  if (empirical && empirical.sampleSize >= 200) {
    // Empirical distributions are global (not side-specific).
    // Adjust for dominant side: the dominant side gets the higher of white/black,
    // the other side gets the lower. Draw stays as-is.
    const higherSide = Math.max(empirical.white, empirical.black);
    const lowerSide = Math.min(empirical.white, empirical.black);
    if (dominantSide === 'white') {
      return { white: higherSide, black: lowerSide, draw: empirical.draw };
    } else if (dominantSide === 'black') {
      return { white: lowerSide, black: higherSide, draw: empirical.draw };
    }
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  
  // v8.06: Moderate archetype boosts (reduced from v8.05)
  const ARCHETYPE_WEIGHTS: Record<string, { whiteBoost: number; blackBoost: number; drawBoost: number }> = {
    // Defensive archetypes - slight black boost
    // v9.4: closed_maneuvering was predicting draw 54% but actual=16% at early balanced
    prophylactic_defense: { whiteBoost: -2, blackBoost: 5, drawBoost: 2 },
    closed_maneuvering: { whiteBoost: -1, blackBoost: 3, drawBoost: -1 },
    
    // Tactical archetypes - depends on who is attacking
    kingside_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -5 },
    queenside_expansion: { whiteBoost: 0, blackBoost: 0, drawBoost: -3 },
    sacrificial_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -8 },
    
    // Balanced archetypes
    opposite_castling: { whiteBoost: -2, blackBoost: 2, drawBoost: 0 },
    open_tactical: { whiteBoost: -1, blackBoost: 2, drawBoost: -3 },
    
    // Strategic archetypes — side-neutral (dominantSide already assigns the advantage)
    central_domination: { whiteBoost: 0, blackBoost: 0, drawBoost: -3 },
    positional_squeeze: { whiteBoost: 0, blackBoost: 0, drawBoost: -2 },
    piece_harmony: { whiteBoost: 0, blackBoost: 0, drawBoost: 0 },
    
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
  
  // v8.08: Side-symmetric archetype signal
  // The dominant side gets the attacker boost, the other gets defender boost
  // This eliminates structural white bias from ARCHETYPE_WEIGHTS
  if (dominantSide === 'white') {
    whiteShare = (decisiveProb * 0.55) + weights.whiteBoost;
    blackShare = (decisiveProb * 0.45) + weights.blackBoost;
  } else if (dominantSide === 'black') {
    // Mirror: black gets the attacker share + whiteBoost (attacker bonus),
    // white gets defender share + blackBoost (defender bonus)
    blackShare = (decisiveProb * 0.55) + weights.whiteBoost;
    whiteShare = (decisiveProb * 0.45) + weights.blackBoost;
  } else {
    // Contested: exactly 50/50
    whiteShare = (decisiveProb / 2);
    blackShare = (decisiveProb / 2);
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
  // v12: Use empirical distributions from 700K+ labeled outcomes when available
  const empirical = getCalibratedStockfishSignal(eval_cp);
  if (empirical && empirical.sampleSize >= 100) {
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  
  // Fallback: v9.2 TCEC-calibrated thresholds
  // Universal principle: SF eval IS the directional imbalance measure.
  // Near-zero = balanced = draw. High = one-sided = decisive.
  if (eval_cp > 200) {
    // Winning for white — strong directional imbalance
    const winPct = Math.min(85, 60 + Math.abs(eval_cp - 200) / 10);
    return { white: winPct, black: 5, draw: 100 - winPct - 5 };
  } else if (eval_cp < -200) {
    // Winning for black — strong directional imbalance
    const winPct = Math.min(85, 60 + Math.abs(eval_cp + 200) / 10);
    return { white: 5, black: winPct, draw: 100 - winPct - 5 };
  } else if (eval_cp > 60) {
    // v9.2: Clear white advantage (between v8's 50 and v9.1's 80)
    const advantage = (eval_cp - 60) / 140 * 25;
    return { white: 44 + advantage, black: 25 - advantage / 2, draw: 31 - advantage / 2 };
  } else if (eval_cp < -60) {
    // v9.2: Clear black advantage
    const advantage = (-eval_cp - 60) / 140 * 25;
    return { white: 25 - advantage / 2, black: 44 + advantage, draw: 31 - advantage / 2 };
  } else if (eval_cp > 35) {
    // v9.2: Moderate white edge — draw very possible (fortress, simplification)
    return { white: 40, black: 27, draw: 33 };
  } else if (eval_cp < -35) {
    // v9.2: Moderate black edge — draw very possible
    return { white: 27, black: 40, draw: 33 };
  } else if (eval_cp > 20) {
    // v9.3: Slight white edge — draw is possible but not dominant
    return { white: 37, black: 29, draw: 34 };
  } else if (eval_cp < -20) {
    // v9.3: Slight black edge
    return { white: 29, black: 37, draw: 34 };
  } else {
    // v9.3: Equal position (±20cp) — moderate draw lean
    // This is the strongest draw signal from SF, but still not extreme
    return { white: 31, black: 31, draw: 38 };
  }
}

/**
 * Calculate phase signal based on game stage
 */
function calculatePhaseSignal(
  moveNumber: number,
  intensity: number
): { white: number; black: number; draw: number } {
  // v12: Use empirical phase distributions when available
  const empirical = getCalibratedPhaseSignal(moveNumber);
  if (empirical && empirical.sampleSize >= 100) {
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  
  // Fallback: hardcoded phase signal
  // Early game: predictions are less reliable, keep symmetric
  if (moveNumber < 15) {
    return { white: 34, black: 33, draw: 33 };
  }
  
  // Middlegame: balanced by default
  if (moveNumber < 30) {
    if (intensity < 40) {
      // v9.3: Low-moderate intensity middlegame = mild draw lean
      return { white: 33, black: 33, draw: 34 };
    }
    return { white: 34, black: 34, draw: 32 };
  }
  
  // Late game: intensity determines draw likelihood
  if (intensity < 30) {
    // v9.3: Low intensity late game = moderate draw lean (not extreme)
    return { white: 31, black: 31, draw: 38 };
  } else if (intensity > 60) {
    // High intensity late game = decisive result
    return { white: 38, black: 38, draw: 24 };
  }
  
  return { white: 33, black: 33, draw: 34 };
}

// ===== NEW v10: KING SAFETY SIGNAL =====
// Uses enhanced kingSafety data: pawn shields, king exposure, castling status
// King safety delta is the most predictive non-eval feature in chess
function calculateKingSafetySignal(
  signals?: EnhancedSignalsData
): { white: number; black: number; draw: number } {
  if (!signals) return { white: 33, black: 33, draw: 34 };
  
  const ks = signals.kingSafety;
  const delta = ks.kingSafetyDelta; // Positive = white safer
  
  // Both kings exposed = tactical chaos → decisive game
  const bothExposed = ks.whiteKingExposure > 0.3 && ks.blackKingExposure > 0.3;
  if (bothExposed) {
    // Mutual king danger — slight edge to whoever has better shield
    const shieldAdv = ks.whitePawnShield - ks.blackPawnShield;
    if (shieldAdv > 0.15) return { white: 42, black: 30, draw: 28 };
    if (shieldAdv < -0.15) return { white: 30, black: 42, draw: 28 };
    return { white: 35, black: 35, draw: 30 }; // Chaotic but decisive
  }
  
  // One king significantly exposed
  if (ks.blackKingExposure > 0.4 && ks.whiteKingExposure < 0.2) {
    const advantage = Math.min(25, ks.blackKingExposure * 50);
    return { white: 40 + advantage, black: 25 - advantage / 2, draw: 35 - advantage / 2 };
  }
  if (ks.whiteKingExposure > 0.4 && ks.blackKingExposure < 0.2) {
    const advantage = Math.min(25, ks.whiteKingExposure * 50);
    return { white: 25 - advantage / 2, black: 40 + advantage, draw: 35 - advantage / 2 };
  }
  
  // Both castled, similar safety = draw lean
  if (ks.castled.white && ks.castled.black && Math.abs(delta) < 0.2) {
    return { white: 32, black: 32, draw: 36 };
  }
  
  // General safety advantage
  if (delta > 0.3) {
    const adv = Math.min(15, delta * 20);
    return { white: 37 + adv, black: 30 - adv / 2, draw: 33 - adv / 2 };
  }
  if (delta < -0.3) {
    const adv = Math.min(15, Math.abs(delta) * 20);
    return { white: 30 - adv / 2, black: 37 + adv, draw: 33 - adv / 2 };
  }
  
  return { white: 33, black: 33, draw: 34 };
}

// ===== NEW v10: PAWN STRUCTURE SIGNAL =====
// Uses enhanced pawnStructure: islands, doubled, passed, connected pawns
// Pawn structure is the skeleton — it determines long-term potential
function calculatePawnStructureSignal(
  signals?: EnhancedSignalsData
): { white: number; black: number; draw: number } {
  if (!signals) return { white: 33, black: 33, draw: 34 };
  
  const ps = signals.pawnStructure;
  const score = ps.structureScore; // Positive = white better structure
  
  // Passed pawns are the strongest structural feature
  const passedDelta = ps.whitePassed - ps.blackPassed;
  
  // Symmetric structure = draw tendency
  if (Math.abs(score) < 0.1 && ps.whitePassed === ps.blackPassed) {
    return { white: 32, black: 32, draw: 36 };
  }
  
  // Significant passed pawn advantage
  if (passedDelta >= 2) {
    return { white: 48, black: 22, draw: 30 };
  }
  if (passedDelta <= -2) {
    return { white: 22, black: 48, draw: 30 };
  }
  if (passedDelta === 1) {
    return { white: 40, black: 28, draw: 32 };
  }
  if (passedDelta === -1) {
    return { white: 28, black: 40, draw: 32 };
  }
  
  // General structural advantage
  if (score > 0.3) {
    const adv = Math.min(12, score * 20);
    return { white: 36 + adv, black: 30 - adv / 2, draw: 34 - adv / 2 };
  }
  if (score < -0.3) {
    const adv = Math.min(12, Math.abs(score) * 20);
    return { white: 30 - adv / 2, black: 36 + adv, draw: 34 - adv / 2 };
  }
  
  return { white: 33, black: 33, draw: 34 };
}

// ===== NEW v10: ENHANCED 8-QUADRANT CONTROL SIGNAL =====
// Uses FULL 8-quadrant profile + square control map instead of just dominantSide
// This is the spatial upgrade: center splits, wing analysis, piece coordination
function calculateEnhancedControlSignal(
  profile?: EnhancedQuadrantProfileData,
  signals?: EnhancedSignalsData
): { white: number; black: number; draw: number } {
  if (!profile) return { white: 33, black: 33, draw: 34 };
  
  // Full 8-quadrant spatial analysis
  const whiteTerritory = profile.q1_kingside_white + profile.q2_queenside_white + profile.q5_center_white;
  const blackTerritory = Math.abs(profile.q3_kingside_black) + Math.abs(profile.q4_queenside_black) + Math.abs(profile.q6_center_black);
  const wingBalance = Math.abs(profile.q7_extended_kingside) + Math.abs(profile.q8_extended_queenside);
  
  // Center control is the most important spatial feature
  const centerAdvantage = profile.q5_center_white + profile.q6_center_black; // q6 is negative when black controls
  
  // Piece coordination from enhanced signals
  const coordination = signals?.coordination?.coordinationScore || 0;
  const controlScore = signals?.squareControl?.controlScore || 0; // -1 to 1
  const mobility = signals?.trajectories?.mobilityScore || 0;
  
  // Composite spatial advantage: center + territory + coordination
  const spatialAdvantage = 
    centerAdvantage * 0.35 +             // Center is king
    (whiteTerritory - blackTerritory) * 0.25 + // Territory balance
    controlScore * 30 * 0.20 +            // Square control map
    coordination * 20 * 0.10 +            // Piece coordination bonus
    mobility * 10 * 0.10;                 // Mobility bonus
  
  // High coordination + spatial advantage = very predictive
  if (Math.abs(spatialAdvantage) > 20) {
    const isWhite = spatialAdvantage > 0;
    const adv = Math.min(25, Math.abs(spatialAdvantage));
    if (isWhite) {
      return { white: 42 + adv, black: 25 - adv / 2, draw: 33 - adv / 2 };
    } else {
      return { white: 25 - adv / 2, black: 42 + adv, draw: 33 - adv / 2 };
    }
  }
  
  if (Math.abs(spatialAdvantage) > 8) {
    const isWhite = spatialAdvantage > 0;
    const adv = Math.min(12, Math.abs(spatialAdvantage) / 2);
    if (isWhite) {
      return { white: 38 + adv, black: 28 - adv / 2, draw: 34 - adv / 2 };
    } else {
      return { white: 28 - adv / 2, black: 38 + adv, draw: 34 - adv / 2 };
    }
  }
  
  // Balanced spatial = draw lean
  if (Math.abs(spatialAdvantage) < 3 && wingBalance < 10) {
    return { white: 31, black: 31, draw: 38 };
  }
  
  return { white: 33, black: 33, draw: 34 };
}

// ===== NEW v11: DUAL-INVERSION RELATIVITY CONVERGENCE =====
// "0 doesn't exist — we learn from absence of what we know"
// "keep it all above negativity" — no negative values, no zeros
//
// PRINCIPLE: Look at the universe from BOTH sides — what IS (matter) and
// what ISN'T (shadow/negative space) — and find where they agree.
// Inversion = reciprocal (1/x), NOT negation. Everything stays positive.
//
// When the inversions converge → the universe is in equilibrium → draw.
// When they diverge → one domain dominates → decisive.
// The relativity envelope (spread of median/avg) bounds our confidence.
//
// This avoids three-body problems: we compare TWO perspectives,
// not weight N signals against each other.

const EPSILON = 0.1; // Floor: keeps everything above zero, always positive

function sortedMedian(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function positiveAvg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeRelativityConvergence(
  profile?: EnhancedQuadrantProfileData,
  signals?: EnhancedSignalsData
): {
  convergenceRatio: number;   // 0-1: how close matter & shadow inversions are (1 = equilibrium)
  confidenceEnvelope: number; // 0-1: how tight the relativity bounds are (1 = very confident)
  matterInvMedian: number;    // median of 1/(matter+ε) — always positive
  shadowInvMedian: number;    // median of 1/(shadow+ε) — always positive
  matterInvAvg: number;
  shadowInvAvg: number;
} | null {
  if (!profile || !signals?.negativeSpace) return null;

  const ns = signals.negativeSpace;

  // ── MATTER: absolute magnitudes of what IS there (all positive) ──
  // Every value is |x| + ε → guaranteed > 0, never negative, never zero
  const matter = [
    Math.abs(profile.q1_kingside_white) + EPSILON,
    Math.abs(profile.q2_queenside_white) + EPSILON,
    Math.abs(profile.q3_kingside_black) + EPSILON,
    Math.abs(profile.q4_queenside_black) + EPSILON,
    Math.abs(profile.q5_center_white) + EPSILON,
    Math.abs(profile.q6_center_black) + EPSILON,
    Math.abs(profile.q7_extended_kingside) + EPSILON,
    Math.abs(profile.q8_extended_queenside) + EPSILON,
    (signals.squareControl?.whiteInfluence || 0) + EPSILON,
    (signals.squareControl?.blackInfluence || 0) + EPSILON,
    (signals.trajectories?.whiteDistance || 0) + EPSILON,
    (signals.trajectories?.blackDistance || 0) + EPSILON,
    (signals.coordination?.coordinationScore || 0) + EPSILON,
    (signals.kingSafety?.whitePawnShield || 0) + EPSILON,
    (signals.kingSafety?.blackPawnShield || 0) + EPSILON,
  ];

  // ── SHADOW: absolute magnitudes of what ISN'T there (all positive) ──
  // Pressure on empty squares — absence made measurable, always > 0
  const shadow = [
    Math.abs(ns.backRankPressure) + EPSILON,
    Math.abs(ns.whiteKingZoneShadow) + EPSILON,
    Math.abs(ns.blackKingZoneShadow) + EPSILON,
    ns.whiteInvasionShadow + EPSILON,
    ns.blackInvasionShadow + EPSILON,
    ns.voidTension + EPSILON,
    Math.abs(ns.negativeSpaceBalance) + EPSILON,
    ns.emptySquareCount + EPSILON,
  ];

  // ── INVERSION: reciprocal of each (1/x → always positive, never zero) ──
  // Large presence → small inverse. Small presence → large inverse.
  // The reciprocal FLIPS perspective while staying entirely positive.
  const invMatter = matter.map(m => 1 / m);
  const invShadow = shadow.map(s => 1 / s);

  // ── MEDIAN & AVERAGE of each inversion ──
  const mMedian = sortedMedian(invMatter);
  const mAvg = positiveAvg(invMatter);
  const sMedian = sortedMedian(invShadow);
  const sAvg = positiveAvg(invShadow);

  // ── CONVERGENCE: ratio of the two medians (closer to 1 = equilibrium) ──
  const maxMed = Math.max(mMedian, sMedian);
  const minMed = Math.min(mMedian, sMedian);
  const convergenceRatio = maxMed > 0 ? minMed / maxMed : 1;

  // ── RELATIVITY ENVELOPE: spread of all four statistics ──
  // Narrow spread = high confidence. Wide = uncertain.
  const allStats = [mMedian, mAvg, sMedian, sAvg];
  const maxStat = Math.max(...allStats);
  const minStat = Math.min(...allStats);
  const envelope = maxStat > 0 ? minStat / maxStat : 1; // 0-1, closer to 1 = tighter

  return {
    convergenceRatio,
    confidenceEnvelope: envelope,
    matterInvMedian: mMedian,
    shadowInvMedian: sMedian,
    matterInvAvg: mAvg,
    shadowInvAvg: sAvg,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT 15: 32-PIECE COLOR FLOW FUSION SIGNAL (v29.4)
// ═══════════════════════════════════════════════════════════════
//
// Converts 9 piece-level asymmetry ratios into a 3-way (white/black/draw) signal.
// Each ratio: >1 = white advantage, <1 = black advantage, ~1 = balanced.
// Uses log-clamped weighted combination matching the 32-piece predictor's weights.
//
// Key difference from board-centric signals: this captures INDIVIDUAL piece dynamics.
// Two positions with identical board signatures can have very different piece-level
// activity patterns. The 32-piece system sees "white's queenside knight was hyperactive
// while black's was passive" — information invisible to square-based analysis.

function computePiece32FusionSignal(
  data?: Piece32Data | null
): { signal: { white: number; black: number; draw: number }; confidence: number } {
  if (!data) {
    return { signal: { white: 33, black: 33, draw: 34 }, confidence: 0 };
  }

  const logClamp = (ratio: number) => Math.max(-1, Math.min(1, Math.log(ratio || 1)));

  // Weights matching pieceColorFlow32.mjs v1.1 calibration
  const w = {
    activity: 0.15,
    territory: 0.12,
    survival: 0.15,
    coordination: 0.15,
    advancement: 0.10,
    centrality: 0.08,
    captures: 0.08,
    lateMomentum: 0.10,
    development: 0.07,
  };

  // Compute weighted directional signal (-1 to +1, positive = white advantage)
  let whiteSignal = 0;
  whiteSignal += logClamp(data.activityRatio) * w.activity;
  whiteSignal += logClamp(data.territoryRatio) * w.territory;
  whiteSignal += logClamp(data.survivalRatio) * w.survival;
  whiteSignal += logClamp(data.coordinationRatio) * w.coordination;
  whiteSignal += Math.max(-1, Math.min(1, (data.advancementDelta || 0) / 3)) * w.advancement;
  whiteSignal += logClamp(data.centralityRatio) * w.centrality;
  whiteSignal += logClamp(data.captureRatio) * w.captures;
  whiteSignal += logClamp(data.lateMomentumRatio) * w.lateMomentum;
  whiteSignal += logClamp(data.developmentRatio) * w.development;

  // Count confirming features for confidence
  const features = [
    logClamp(data.activityRatio),
    logClamp(data.territoryRatio),
    logClamp(data.survivalRatio),
    logClamp(data.coordinationRatio),
    Math.max(-1, Math.min(1, (data.advancementDelta || 0) / 3)),
    logClamp(data.centralityRatio),
    logClamp(data.captureRatio),
    logClamp(data.lateMomentumRatio),
    logClamp(data.developmentRatio),
  ];

  const absSignal = Math.abs(whiteSignal);
  const dirSign = whiteSignal > 0 ? 1 : -1;
  const confirming = features.filter(f => f * dirSign > 0.02).length;

  // Confidence: based on signal strength + feature agreement
  const signalConf = Math.min(1, absSignal / 0.3);
  const confirmConf = confirming / 9;
  const confidence = 0.3 * signalConf + 0.7 * confirmConf;

  // Convert directional signal to 3-way distribution
  // Scale: absSignal of 0.3 = strong directional opinion
  const advantage = Math.min(20, absSignal * 60);
  const drawPenalty = Math.min(10, absSignal * 30);

  let white: number, black: number, draw: number;
  if (absSignal < 0.03) {
    // Near-balanced: slight draw lean
    white = 33;
    black = 33;
    draw = 34;
  } else if (whiteSignal > 0) {
    white = 35 + advantage;
    black = 30 - advantage / 2;
    draw = 35 - drawPenalty;
  } else {
    white = 30 - advantage / 2;
    black = 35 + advantage;
    draw = 35 - drawPenalty;
  }

  return { signal: { white, black, draw }, confidence };
}
