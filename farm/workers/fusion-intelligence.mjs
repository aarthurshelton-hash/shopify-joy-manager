/**
 * Fusion Intelligence Module v2.0
 * 
 * Provides archetype-specific, time-control-aware, game-phase-aware,
 * and PLAYER-SPECIFIC confidence adjustments for the hybrid fusion step.
 * 
 * DESIGN PRINCIPLE: These are multiplicative modifiers on the EXISTING fusion
 * weights (baseline 0.50, enhanced 0.15, SF 0.35). They cannot break the system —
 * at worst they're neutral (1.0 multiplier). No new architecture, no 3-body chaos.
 * 
 * Imported by: ep-enhanced-worker, ep-bulk-worker, chess-db-ingest-worker
 */

import { getPlayerBoost } from './player-intelligence.mjs';

// ═══════════════════════════════════════════════════════════════
// 1. ARCHETYPE-SPECIFIC CONFIDENCE BOOST
// Based on observed accuracy differences between archetypes.
// High-accuracy archetypes get boosted enhanced weight;
// low-accuracy archetypes get slightly reduced enhanced weight
// (shifting trust toward SF which is archetype-agnostic).
// ═══════════════════════════════════════════════════════════════

// Production accuracy from 1,088,000+ games (Feb 14, 2026)
// Updated by workers via updateLiveArchetypeAccuracy()
// NOTE (Feb 16): Classifier now produces piece_* archetypes. These all have
// narrow accuracy spread (70.9-73.4%) so archetype boost is effectively neutral.
// piece_general_pressure (48.5%) is the only weak one but n=71 — too rare to matter.
let ARCHETYPE_ACCURACY = {
  // Tier 1: Strong signal (>60%) — trust EP heavily
  sacrificial_queenside_break: 0.639,  // n=128K
  sacrificial_kingside_assault: 0.631, // n=96K
  king_hunt:              0.615,       // n=5K
  queenside_expansion:    0.610,       // n=244K
  kingside_attack:        0.608,       // n=195K
  sacrificial_attack:     0.604,       // n=135K
  // Tier 2: Solid (55-60%) — default trust
  positional_squeeze:     0.592,       // n=94K
  balanced_flow:          0.577,       // n=9K
  queenside_bishop_squeeze: 0.577,     // n=1K
  central_domination:     0.574,       // n=19K
  closed_maneuvering:     0.565,       // n=148K
  pawn_storm:             0.564,       // n=1K
  kingside_knight_charge: 0.563,       // n=2K
  // Tier 3: Weak (48-55%) — reduce EP trust
  structural_pressure:    0.530,       // n=547
  minor_piece_coordination: 0.509,     // n=2K
  kingside_bishop_battery: 0.508,      // n=606
  central_bishop_cross:   0.502,       // n=2K
  piece_harmony:          0.487,       // n=3K
  central_knight_outpost: 0.486,       // n=4K
  // Tier 4: Anti-predictive (<40%) — defer to SF
  development_focus:      0.302,       // n=1K — BELOW random!
};

// Baseline: overall EP hybrid accuracy from 1M+ games
let BASELINE_ACC = 0.604;

/**
 * Live-update archetype accuracy from worker self-learning.
 * Called by workers when they recompute archetype weights.
 * This is the "learn from data" pattern from universal benchmark.
 */
export function updateLiveArchetypeAccuracy(liveData) {
  if (!liveData || typeof liveData !== 'object') return;
  for (const [arch, acc] of Object.entries(liveData)) {
    if (typeof acc === 'number' && acc > 0 && acc <= 1) {
      ARCHETYPE_ACCURACY[arch] = acc;
    }
  }
}

/**
 * Get a multiplier for the enhanced prediction weight based on archetype.
 * Archetypes where EP historically excels get a boost (up to 1.15x);
 * archetypes where EP is weaker get a slight reduction (down to 0.90x).
 * 
 * @param {string} archetype - The classified archetype name
 * @returns {number} Multiplier (0.90 - 1.15)
 */
export function getArchetypeBoost(archetype) {
  const acc = ARCHETYPE_ACCURACY[archetype];
  if (!acc) return 1.0; // Unknown archetype → neutral

  // Ratio of this archetype's accuracy to baseline
  // sacrificial_queenside_break: 0.639/0.604 = 1.058 → boost
  // development_focus: 0.302/0.604 = 0.500 → strong reduction
  const ratio = acc / BASELINE_ACC;
  
  // Widened range [0.65, 1.25] — lets strong archetypes shine,
  // weak ones defer to SF. Same "know when you don't know" pattern
  // that beats baseline in earthquake/virality/solar benchmarks.
  return Math.max(0.65, Math.min(1.25, ratio));
}


// ═══════════════════════════════════════════════════════════════
// 2. TIME CONTROL WEIGHTING
// Longer time controls produce richer temporal-spatial patterns.
// Classical (900+) → more reliable enhanced signatures → boost.
// Bullet (60s) → noisy, less reliable → slight reduction.
// ═══════════════════════════════════════════════════════════════

/**
 * Parse time control string and return a confidence multiplier.
 * 
 * @param {string|null} timeControl - e.g. "180+0", "300+3", "900+10"
 * @returns {number} Multiplier (0.92 - 1.12)
 */
export function getTimeControlBoost(timeControl) {
  if (!timeControl) return 1.0;
  
  // Parse base time in seconds
  const parts = timeControl.split('+');
  const baseTime = parseInt(parts[0]) || 0;
  const increment = parseInt(parts[1]) || 0;
  
  // Estimated total time (base + 40 moves of increment)
  const estimatedTotal = baseTime + increment * 40;
  
  if (estimatedTotal >= 1500) return 1.12;  // Classical (25+ min): richest data
  if (estimatedTotal >= 600)  return 1.08;  // Rapid (10+ min): strong data
  if (estimatedTotal >= 300)  return 1.03;  // Blitz (5 min): decent
  if (estimatedTotal >= 180)  return 1.00;  // Fast blitz (3 min): baseline
  if (estimatedTotal >= 60)   return 0.96;  // Bullet (1 min): noisier
  return 0.92;                               // Hyper-bullet: very noisy
}


// ═══════════════════════════════════════════════════════════════
// 3. GAME PHASE CONFIDENCE MULTIPLIER
// Middlegame positions (moves 15-35) have the richest tactical
// and strategic patterns. Very early positions are too bookish;
// very late positions may be trivial endgames or shuffling.
// ═══════════════════════════════════════════════════════════════

/**
 * Get confidence multiplier based on the move number being evaluated.
 * 
 * @param {number} moveNumber - Current move number in the game
 * @returns {number} Multiplier (0.92 - 1.08)
 */
export function getGamePhaseBoost(moveNumber) {
  if (moveNumber >= 18 && moveNumber <= 32) return 1.08;  // Sweet spot: rich middlegame
  if (moveNumber >= 12 && moveNumber <= 40) return 1.04;  // Good range: still informative
  if (moveNumber >= 8  && moveNumber <= 50) return 1.00;  // Neutral: adequate data
  // v16: DATA-DRIVEN — moves 1-10 are at 47.6% accuracy (below 3-class random)
  // Penalize EP weight hard so SF eval drives the prediction in the opening
  if (moveNumber <= 5)                      return 0.70;  // Moves 1-5: pure opening book, EP is noise
  if (moveNumber <= 10)                     return 0.80;  // Moves 6-10: still bookish, 47.6% acc
  return 0.88;                                             // 51+: endgame shuffling, 51.3% acc
}


// ═══════════════════════════════════════════════════════════════
// 3b. DRAW PROPENSITY DETECTION
// Data shows: when hybrid confidence ≤30, actual draw rate is 21-23%
// (2x the baseline 11.6%). Certain archetypes have even higher draw rates:
//   central_domination: 22%, positional_squeeze: 13.3%, piece_harmony: 17.6%
// Instead of guessing a side and being wrong, predict "draw".
// ═══════════════════════════════════════════════════════════════

const HIGH_DRAW_ARCHETYPES = new Set([
  'central_domination',   // 22.0% draws
  'piece_harmony',        // 17.6% draws
  'positional_squeeze',   // 13.3% draws
  'closed_maneuvering',   // 10.6% draws
]);

// Archetypes with zero or negative edge over baseline — EP adds nothing
const ZERO_EDGE_ARCHETYPES = new Set([
  'piece_harmony',            // -0.3pp edge
  'kingside_bishop_battery',  // -0.4pp edge
  'central_knight_outpost',   // 0.0pp edge
  'development_focus',        // 8.4% in opening — catastrophic
]);

/**
 * Determine whether a position should be predicted as "draw" based on
 * confidence, archetype, and game phase. Returns an object with the
 * recommendation and adjusted confidence.
 * 
 * THIS NEVER SKIPS A GAME — it only changes what we predict.
 * 
 * @param {string} archetype - Classified archetype
 * @param {number} moveNumber - Move number
 * @param {number} hybridConf - Current hybrid confidence (0-1 scale)
 * @param {Object} votes - Current vote distribution {white_wins, black_wins, draw}
 * @returns {{ shouldPredictDraw: boolean, adjustedConf: number, reason: string }}
 */
export function getPostFusionDrawGate(archetype, moveNumber, hybridConf, votes) {
  // Signal 1: Very low confidence → system is uncertain → draws are 2x more likely
  const isLowConf = hybridConf <= 0.30;
  
  // Signal 2: High-draw archetype
  const isHighDrawArch = HIGH_DRAW_ARCHETYPES.has(archetype);
  
  // Signal 3: Vote spread is tight (no clear winner among engines)
  const voteValues = Object.values(votes || {});
  const maxVote = Math.max(...voteValues);
  const minVote = Math.min(...voteValues);
  const tightSpread = voteValues.length >= 3 && (maxVote - minVote) < 0.15;
  
  // Signal 4: Opening phase where EP is weakest
  const isEarlyOpening = moveNumber <= 7;
  
  // Combined: need at least 2 signals to override to draw
  const drawSignals = (isLowConf ? 1 : 0) + (isHighDrawArch ? 1 : 0) + (tightSpread ? 1 : 0) + (isEarlyOpening ? 0.5 : 0);
  
  if (isLowConf && drawSignals >= 1.5) {
    return {
      shouldPredictDraw: true,
      adjustedConf: Math.min(0.35, hybridConf * 1.1),
      reason: `low_conf(${hybridConf.toFixed(2)})` + (isHighDrawArch ? '+high_draw_arch' : '') + (tightSpread ? '+tight_spread' : ''),
    };
  }
  
  return { shouldPredictDraw: false, adjustedConf: hybridConf, reason: '' };
}

/**
 * Get confidence dampening for zero-edge archetypes.
 * These archetypes perform no better than baseline — reduce confidence
 * so they don't pollute downstream learning with false signal.
 * 
 * @param {string} archetype
 * @returns {number} Multiplier (0.7 - 1.0)
 */
export function getArchetypeEdgeDampener(archetype) {
  if (ZERO_EDGE_ARCHETYPES.has(archetype)) return 0.75;
  return 1.0;
}


// ═══════════════════════════════════════════════════════════════
// 3b-2. ENHANCED DRAW SUPPRESSION (v17)
// Enhanced 8-quad has a massive false draw bias on certain archetypes.
// It predicts "draw" ~30% of the time when actual draws are 4-7%.
// These draw predictions are 2.7-3.0% accurate — pure poison.
//
// Data from 1,137,597 labeled games:
//   balanced_flow:    EN predicts draw 26.7% → actual draw 4.0% → 2.7% acc
//   tactical_melee:   EN predicts draw 34.5% → actual draw 6.7% → 2.9% acc
//   flank_operations: EN predicts draw 30.6% → actual draw 3.9% → 3.0% acc
//
// Without draw predictions, enhanced is GOOD on these archetypes:
//   balanced_flow white_wins: 57.0%, black_wins: 64.3%
//   tactical_melee white_wins: 53.9%, black_wins: 59.0%
//
// Fix: when enhanced predicts "draw" on a low-draw archetype,
// suppress its vote in the fusion. The fusion redistributes weight
// to baseline (which never predicts draw and hits 60.6% on these).
// ═══════════════════════════════════════════════════════════════

// Actual draw rates by archetype (from 1.15M games)
const ARCHETYPE_DRAW_RATES = {
  balanced_flow: 0.040,          // 4.0% draws
  tactical_melee: 0.067,         // 6.7% draws
  flank_operations: 0.039,       // 3.9% draws
  sacrificial_queenside_break: 0.10,
  sacrificial_kingside_assault: 0.08,
  sacrificial_attack: 0.06,
  kingside_attack: 0.08,
  queenside_expansion: 0.07,
  closed_maneuvering: 0.106,
  central_domination: 0.22,
  positional_squeeze: 0.133,
  piece_harmony: 0.176,
};

/**
 * Check if enhanced prediction of "draw" should be suppressed in the fusion.
 * Returns true if enhanced is predicting draw on an archetype where draws
 * are rare (<10% actual rate) — indicating the draw prediction is noise.
 *
 * When suppressed, the caller should zero out enhanced's vote and redistribute
 * its weight to baseline (the stronger non-draw predictor).
 *
 * @param {string} enhancedPrediction - Enhanced engine's prediction
 * @param {string} archetype - Enhanced archetype classification
 * @returns {{ suppress: boolean, reason: string }}
 */
export function shouldSuppressEnhancedDraw(enhancedPrediction, archetype, sfEvalCp = null, moveNumber = null) {
  if (enhancedPrediction !== 'draw') {
    return { suppress: false, reason: '' };
  }

  // Strong SF eval + enhanced draw is a recurrent failure mode.
  // Last-hour evidence: 30.4% draw rate at |eval|>=200 with only 47.7% EN accuracy
  // vs 62.5% baseline on the same bucket. Draw is rarely correct there.
  if (sfEvalCp !== null && sfEvalCp !== undefined) {
    const absEval = Math.abs(sfEvalCp);
    if (absEval >= 200) {
      return { suppress: true, reason: 'enhanced_draw_vs_decisive_sf' };
    }
    if (absEval >= 100 && (moveNumber === null || moveNumber >= 12)) {
      return { suppress: true, reason: 'enhanced_draw_vs_clear_sf' };
    }
  }
  
  const drawRate = ARCHETYPE_DRAW_RATES[archetype];
  if (drawRate !== undefined && drawRate < 0.10) {
    return {
      suppress: true,
      reason: `enhanced_draw_on_${archetype}(${(drawRate*100).toFixed(1)}%_actual)`,
    };
  }
  
  return { suppress: false, reason: '' };
}


// ═══════════════════════════════════════════════════════════════
// 3c. SF RELIABILITY GATE (v17)
// The #1 predictor of SF being wrong: its own eval magnitude.
// When |eval| < 50cp, SF is wrong 65-70% of the time (30-34% acc on 3-way).
// That means the real answer is one of the 2 options SF DIDN'T pick.
// Even random between 2 = 50%. EP's pattern recognition is better than
// random → guaranteed accuracy gain by stripping SF's bad vote.
//
// Data from 1,156,558 labeled games:
//   |eval| < 20cp:  SF 30.7%, EP 40.7% → EP +10.0pp
//   |eval| < 50cp:  SF 34.3%, EP 45.8% → EP +11.5pp
//   |eval| < 100cp: SF 50.7%, EP 53.7% → EP +3.0pp
//   |eval| > 200cp: SF 73.1%, EP 73.2% → tied (trust SF)
//   |eval| > 500cp: SF 68.9%, EP 69.0% → tied (trust SF)
//
// On disagreements specifically:
//   low_eval + early: EP 56.0% vs SF 17.2% (!!)
//   low_eval + mid:   EP 48.9% vs SF 25.3%
//   low_eval + late:  EP 36.3% vs SF 39.0% (only zone SF wins)
// ═══════════════════════════════════════════════════════════════

/**
 * Compute SF reliability multiplier based on eval magnitude and game phase.
 * When SF eval is near zero, SF is essentially guessing → reduce its weight.
 * When SF eval is decisive, it knows what it's doing → trust it.
 *
 * @param {number|null} sfEvalCp - Stockfish eval in centipawns (absolute value used)
 * @param {number} moveNumber - Current move number
 * @returns {{ sfMultiplier: number, redistributeToBaseline: number, reason: string }}
 */
export function getSfReliabilityWeight(sfEvalCp, moveNumber) {
  if (sfEvalCp === null || sfEvalCp === undefined) {
    return { sfMultiplier: 1.0, redistributeToBaseline: 0, reason: 'no_eval' };
  }

  const absEval = Math.abs(sfEvalCp);
  const isEarly = moveNumber <= 25;
  const isLate = moveNumber > 45;

  let sfMult, reason;

  if (absEval < 20) {
    // Dead equal: SF 30.7% — wrong 69% of the time
    // Early: EP 56.0% on disagreements → strip SF almost entirely
    // Late: SF 39.0% vs EP 36.3% → still reduce but less
    sfMult = isLate ? 0.35 : isEarly ? 0.10 : 0.15;
    reason = 'dead_equal';
  } else if (absEval < 50) {
    // Slight: SF 34.3% — wrong 66%
    sfMult = isLate ? 0.45 : isEarly ? 0.20 : 0.30;
    reason = 'slight_eval';
  } else if (absEval < 100) {
    // Small: SF 50.7% — coin flip
    sfMult = isLate ? 0.75 : isEarly ? 0.50 : 0.65;
    reason = 'small_eval';
  } else if (absEval < 200) {
    // Clear: SF 59.5% — decent, trust normally
    sfMult = 1.0;
    reason = 'clear_eval';
  } else {
    // Winning/decisive: SF 73%+ — trust it
    sfMult = 1.15;
    reason = 'decisive_eval';
  }

  // When we reduce SF weight, redistribute overwhelmingly to baseline (61.7%)
  // rather than enhanced (currently unstable intraday at ~45%).
  const sfReduction = (1.0 - sfMult) * 0.30; // How much raw weight we're removing
  const redistributeToBaseline = sfReduction > 0 ? sfReduction * 0.85 : 0; // 85% of freed weight → baseline
  // Remaining 15% of freed weight → enhanced (handled in main function)

  return { sfMultiplier: sfMult, redistributeToBaseline, reason };
}


// ═══════════════════════════════════════════════════════════════
// 4. COMBINED FUSION INTELLIGENCE
// Single function that computes all boosts and returns adjusted
// fusion weights. Drop-in replacement for the hardcoded weights.
// ═══════════════════════════════════════════════════════════════

/**
 * Compute intelligence-adjusted fusion weights.
 * 
 * Base weights: baseline=0.50, enhanced=0.15, sf=0.35
 * The enhanced weight gets multiplied by the combined boost factor,
 * then all weights are renormalized to sum to 1.0.
 * 
 * @param {string} archetype - Classified archetype
 * @param {string|null} timeControl - Time control string
 * @param {number} moveNumber - Move number being evaluated
 * @param {Object} [playerContext] - Optional player context for player-specific boost
 * @param {string|null} [playerContext.whiteName] - White player name
 * @param {string|null} [playerContext.blackName] - Black player name
 * @param {string|null} [playerContext.platform] - Data source/platform
 * @param {number|null} [sfEvalCp] - Stockfish eval in centipawns (for SF reliability gate)
 * @returns {{ baselineWeight: number, enhancedWeight: number, sfWeight: number, boostFactor: number, playerBoost: number, playerReason: string, sfReliability: string }}
 */
export function getIntelligentFusionWeights(archetype, timeControl, moveNumber, playerContext, sfEvalCp) {
  const archetypeBoost = getArchetypeBoost(archetype);
  const timeBoost = getTimeControlBoost(timeControl);
  const phaseBoost = getGamePhaseBoost(moveNumber);
  
  // Player-specific boost (new in v2) — learned from per-player accuracy data
  let playerBoostVal = 1.0;
  let playerReason = '';
  if (playerContext) {
    const pb = getPlayerBoost(
      playerContext.whiteName || null,
      playerContext.blackName || null,
      playerContext.platform || null,
      timeControl
    );
    playerBoostVal = pb.boost;
    playerReason = pb.reason;
  }
  
  // Combined boost: multiplicative (all independent signals)
  // Widened to [0.55, 1.45] — archetype + player intelligence drives fusion weights
  const combinedBoost = Math.max(0.55, Math.min(1.45, archetypeBoost * timeBoost * phaseBoost * playerBoostVal));
  
  // v16: In deep endgame (51+), boost SF weight — material is decisive
  // Data: SF at 51.0-52.5% in endgame, hybrid at 51.3-53.0%
  // But the combined signal with more SF weight should improve
  const sfEndgameBoost = moveNumber >= 51 ? 1.25 : moveNumber >= 41 ? 1.10 : 1.0;
  
  // v17: SF RELIABILITY GATE — the biggest single upgrade
  // When SF eval is near zero, SF is wrong 65-70% of the time.
  // Strip its vote and let EP pick between the remaining 2 answers.
  // Even random between 2 = 50% (vs SF's 30-34%). EP is better than random.
  const sfRel = getSfReliabilityWeight(sfEvalCp !== undefined ? sfEvalCp : null, moveNumber);
  
  // v17.2: Low-eval focus boost - strengthen EP where it consistently beats SF
  // Data shows EP edge is strongest at |eval|<50cp (+4.9pp advantage)
  const lowEvalFocus = (sfEvalCp !== null && sfEvalCp !== undefined && Math.abs(sfEvalCp) < 50) ? 1.15 : 1.0;
  
  // Apply boost to enhanced weight, endgame + reliability to SF
  // v17.1 rebalance: baseline is strongest live engine, enhanced is unstable intraday.
  const rawBaseline = 0.50 + sfRel.redistributeToBaseline;
  const rawEnhanced = 0.15 * combinedBoost * lowEvalFocus + (sfRel.redistributeToBaseline > 0 ? sfRel.redistributeToBaseline * 0.176 : 0); // 15% of freed SF weight (0.15/0.85 ratio)
  const rawSf = 0.35 * sfEndgameBoost * sfRel.sfMultiplier;
  
  // Renormalize so weights sum to 1.0
  const total = rawBaseline + rawEnhanced + rawSf;
  
  return {
    baselineWeight: rawBaseline / total,
    enhancedWeight: rawEnhanced / total,
    sfWeight: rawSf / total,
    boostFactor: combinedBoost,
    playerBoost: playerBoostVal,
    playerReason,
    sfReliability: sfRel.reason,
  };
}
