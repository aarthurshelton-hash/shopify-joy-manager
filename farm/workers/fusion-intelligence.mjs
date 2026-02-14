/**
 * Fusion Intelligence Module v2.0
 * 
 * Provides archetype-specific, time-control-aware, game-phase-aware,
 * and PLAYER-SPECIFIC confidence adjustments for the hybrid fusion step.
 * 
 * DESIGN PRINCIPLE: These are multiplicative modifiers on the EXISTING fusion
 * weights (baseline 0.25, enhanced 0.45, SF 0.30). They cannot break the system —
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
  if (moveNumber < 8)                       return 0.94;  // Too early: opening book territory
  return 0.92;                                             // Very late: endgame shuffling
}


// ═══════════════════════════════════════════════════════════════
// 4. COMBINED FUSION INTELLIGENCE
// Single function that computes all boosts and returns adjusted
// fusion weights. Drop-in replacement for the hardcoded weights.
// ═══════════════════════════════════════════════════════════════

/**
 * Compute intelligence-adjusted fusion weights.
 * 
 * Base weights: baseline=0.25, enhanced=0.45, sf=0.30
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
 * @returns {{ baselineWeight: number, enhancedWeight: number, sfWeight: number, boostFactor: number, playerBoost: number, playerReason: string }}
 */
export function getIntelligentFusionWeights(archetype, timeControl, moveNumber, playerContext) {
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
  
  // Apply boost to enhanced weight
  const rawBaseline = 0.25;
  const rawEnhanced = 0.45 * combinedBoost;
  const rawSf = 0.30;
  
  // Renormalize so weights sum to 1.0
  const total = rawBaseline + rawEnhanced + rawSf;
  
  return {
    baselineWeight: rawBaseline / total,
    enhancedWeight: rawEnhanced / total,
    sfWeight: rawSf / total,
    boostFactor: combinedBoost,
    playerBoost: playerBoostVal,
    playerReason,
  };
}
