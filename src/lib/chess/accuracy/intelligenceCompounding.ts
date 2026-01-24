/**
 * Intelligence Compounding System v7.70
 * 
 * UNIFIED LEARNING BOOST:
 * 1. Live Confidence Calibration - dynamically adjust based on rolling accuracy
 * 2. Disagreement Amplifier - boost archetypes when we beat Stockfish
 * 3. Temporal Decay Weighting - recent predictions count more than older ones
 * 
 * This ensures En Pensent gets SMARTER with every prediction.
 */

import { supabase } from '@/integrations/supabase/client';
import { StrategicArchetype } from '../colorFlowAnalysis';

// ============= LIVE TRACKING STATE =============

interface ArchetypeStats {
  totalPredictions: number;
  correctPredictions: number;
  recentPredictions: Array<{ correct: boolean; timestamp: number; weight: number }>;
  disagreementWins: number;  // Times we beat Stockfish
  disagreementLosses: number; // Times Stockfish beat us
  boostMultiplier: number;  // Current confidence boost (1.0 = neutral)
}

interface CompoundingState {
  archetypes: Map<StrategicArchetype, ArchetypeStats>;
  lastDatabaseSync: number;
  globalAccuracy: number;
  globalDisagreementWinRate: number;
  initialized: boolean;
}

const DECAY_HALF_LIFE_HOURS = 24; // Recent predictions decay over 24 hours
const ROLLING_WINDOW_SIZE = 100; // Track last 100 predictions per archetype
const DISAGREEMENT_BOOST_FACTOR = 0.15; // 15% boost per disagreement win
const MAX_BOOST = 1.5; // Cap boost at 50% increase
const MIN_BOOST = 0.7; // Minimum 30% reduction for poor performers

const state: CompoundingState = {
  archetypes: new Map(),
  lastDatabaseSync: 0,
  globalAccuracy: 0.333, // Start at random baseline
  globalDisagreementWinRate: 0,
  initialized: false,
};

// ============= TEMPORAL DECAY WEIGHTING =============

/**
 * Calculate weight for a prediction based on age (exponential decay)
 * Recent predictions matter more than older ones
 */
function calculateTemporalWeight(timestampMs: number): number {
  const ageHours = (Date.now() - timestampMs) / (1000 * 60 * 60);
  // Exponential decay: weight = 0.5^(age/halfLife)
  return Math.pow(0.5, ageHours / DECAY_HALF_LIFE_HOURS);
}

/**
 * Calculate weighted accuracy from recent predictions
 */
function calculateWeightedAccuracy(predictions: Array<{ correct: boolean; timestamp: number; weight: number }>): number {
  if (predictions.length === 0) return 0.333; // Random baseline
  
  let weightedCorrect = 0;
  let totalWeight = 0;
  
  for (const pred of predictions) {
    const weight = calculateTemporalWeight(pred.timestamp);
    weightedCorrect += pred.correct ? weight : 0;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedCorrect / totalWeight : 0.333;
}

// ============= DISAGREEMENT AMPLIFIER =============

/**
 * Record a disagreement outcome (when En Pensent and Stockfish disagree)
 * If we were right, boost the archetype's confidence
 */
export function recordDisagreement(
  archetype: StrategicArchetype,
  enPensentCorrect: boolean,
  stockfishCorrect: boolean
): void {
  const stats = getOrCreateArchetypeStats(archetype);
  
  // Only count when they actually disagreed
  if (enPensentCorrect === stockfishCorrect) return;
  
  if (enPensentCorrect && !stockfishCorrect) {
    // WE WON! Boost this archetype
    stats.disagreementWins++;
    stats.boostMultiplier = Math.min(
      MAX_BOOST,
      stats.boostMultiplier + DISAGREEMENT_BOOST_FACTOR
    );
    console.log(`[Intelligence] ✨ ${archetype} beat Stockfish! Boost: ${(stats.boostMultiplier * 100).toFixed(0)}%`);
  } else {
    // Stockfish won - slight penalty
    stats.disagreementLosses++;
    stats.boostMultiplier = Math.max(
      MIN_BOOST,
      stats.boostMultiplier - (DISAGREEMENT_BOOST_FACTOR / 2)
    );
  }
  
  state.archetypes.set(archetype, stats);
}

/**
 * Get the current boost multiplier for an archetype
 */
export function getArchetypeBoost(archetype: StrategicArchetype): number {
  const stats = state.archetypes.get(archetype);
  return stats?.boostMultiplier ?? 1.0;
}

// ============= LIVE CONFIDENCE CALIBRATION =============

/**
 * Record a prediction outcome for live calibration
 */
export function recordPredictionOutcome(
  archetype: StrategicArchetype,
  wasCorrect: boolean,
  enPensentCorrect?: boolean,
  stockfishCorrect?: boolean
): void {
  const stats = getOrCreateArchetypeStats(archetype);
  
  // Add to rolling window
  stats.recentPredictions.push({
    correct: wasCorrect,
    timestamp: Date.now(),
    weight: 1.0, // Will be recalculated dynamically
  });
  
  // Maintain window size
  if (stats.recentPredictions.length > ROLLING_WINDOW_SIZE) {
    stats.recentPredictions.shift();
  }
  
  // Update totals
  stats.totalPredictions++;
  if (wasCorrect) stats.correctPredictions++;
  
  state.archetypes.set(archetype, stats);
  
  // Record disagreement if both outcomes provided
  if (enPensentCorrect !== undefined && stockfishCorrect !== undefined) {
    recordDisagreement(archetype, enPensentCorrect, stockfishCorrect);
  }
}

/**
 * Get live-calibrated confidence for an archetype
 * Returns a multiplier to apply to base confidence
 */
export function getLiveConfidenceMultiplier(archetype: StrategicArchetype): number {
  const stats = state.archetypes.get(archetype);
  
  if (!stats || stats.recentPredictions.length < 5) {
    // Not enough data - return neutral
    return 1.0;
  }
  
  // Calculate weighted accuracy (recent predictions count more)
  const weightedAccuracy = calculateWeightedAccuracy(stats.recentPredictions);
  
  // Calculate adjustment: if we're beating baseline (33.3%), boost confidence
  const baseline = 0.333;
  const delta = weightedAccuracy - baseline;
  
  // Scale: +16.7% accuracy (50% total) = +25% confidence multiplier
  // Cap at ±50% adjustment
  const adjustment = Math.max(-0.5, Math.min(0.5, delta * 1.5));
  
  return 1.0 + adjustment;
}

/**
 * Get comprehensive calibrated confidence for a prediction
 * Combines: live calibration × disagreement boost × temporal decay
 */
export function getCalibratedConfidence(
  archetype: StrategicArchetype,
  baseConfidence: number
): { confidence: number; factors: string[] } {
  const factors: string[] = [];
  let finalConfidence = baseConfidence;
  
  // 1. Live calibration multiplier
  const liveMultiplier = getLiveConfidenceMultiplier(archetype);
  finalConfidence *= liveMultiplier;
  if (liveMultiplier !== 1.0) {
    factors.push(`Live calibration: ${liveMultiplier > 1 ? '+' : ''}${((liveMultiplier - 1) * 100).toFixed(0)}%`);
  }
  
  // 2. Disagreement boost
  const boost = getArchetypeBoost(archetype);
  finalConfidence *= boost;
  if (boost !== 1.0) {
    factors.push(`Disagreement boost: ${boost > 1 ? '+' : ''}${((boost - 1) * 100).toFixed(0)}%`);
  }
  
  // 3. Sample size confidence
  const stats = state.archetypes.get(archetype);
  if (stats && stats.totalPredictions > 50) {
    factors.push(`${stats.totalPredictions} historical samples`);
  }
  
  // Cap at reasonable bounds
  finalConfidence = Math.max(10, Math.min(95, finalConfidence));
  
  return { confidence: finalConfidence, factors };
}

// ============= DATABASE SYNC =============

/**
 * Initialize from database on first load
 */
export async function initializeFromDatabase(): Promise<void> {
  if (state.initialized) return;
  
  console.log('[Intelligence] Initializing compounding system from database...');
  
  try {
    // Load archetype performance data
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, hybrid_correct, stockfish_correct, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);
    
    if (error) {
      console.error('[Intelligence] Database load error:', error);
      state.initialized = true;
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('[Intelligence] No historical data found');
      state.initialized = true;
      return;
    }
    
    // Process historical data
    let totalCorrect = 0;
    let totalDisagreementWins = 0;
    let totalDisagreements = 0;
    
    for (const record of data) {
      const archetype = normalizeArchetype(record.hybrid_archetype);
      if (!archetype) continue;
      
      const stats = getOrCreateArchetypeStats(archetype);
      const timestamp = new Date(record.created_at).getTime();
      
      // Add to predictions
      stats.recentPredictions.push({
        correct: record.hybrid_correct ?? false,
        timestamp,
        weight: calculateTemporalWeight(timestamp),
      });
      
      // Keep only most recent within window
      if (stats.recentPredictions.length > ROLLING_WINDOW_SIZE) {
        stats.recentPredictions.shift();
      }
      
      stats.totalPredictions++;
      if (record.hybrid_correct) {
        stats.correctPredictions++;
        totalCorrect++;
      }
      
      // Track disagreements
      if (record.hybrid_correct !== record.stockfish_correct) {
        totalDisagreements++;
        if (record.hybrid_correct && !record.stockfish_correct) {
          stats.disagreementWins++;
          totalDisagreementWins++;
        } else {
          stats.disagreementLosses++;
        }
      }
      
      // Calculate boost multiplier from disagreement ratio
      if (stats.disagreementWins + stats.disagreementLosses > 0) {
        const ratio = stats.disagreementWins / (stats.disagreementWins + stats.disagreementLosses);
        stats.boostMultiplier = MIN_BOOST + (MAX_BOOST - MIN_BOOST) * ratio;
      }
      
      state.archetypes.set(archetype, stats);
    }
    
    state.globalAccuracy = data.length > 0 ? totalCorrect / data.length : 0.333;
    state.globalDisagreementWinRate = totalDisagreements > 0 
      ? totalDisagreementWins / totalDisagreements 
      : 0;
    state.lastDatabaseSync = Date.now();
    state.initialized = true;
    
    console.log(`[Intelligence] Initialized with ${data.length} predictions:`);
    console.log(`  - Global accuracy: ${(state.globalAccuracy * 100).toFixed(1)}%`);
    console.log(`  - Disagreement win rate: ${(state.globalDisagreementWinRate * 100).toFixed(1)}%`);
    console.log(`  - Archetypes tracked: ${state.archetypes.size}`);
    
  } catch (err) {
    console.error('[Intelligence] Initialization error:', err);
    state.initialized = true;
  }
}

// ============= INTELLIGENCE METRICS =============

/**
 * Get current intelligence metrics for display
 */
export function getIntelligenceMetrics(): {
  globalAccuracy: number;
  globalDisagreementWinRate: number;
  archetypeCount: number;
  topPerformers: Array<{ archetype: string; accuracy: number; boost: number }>;
  isLearning: boolean;
} {
  const topPerformers: Array<{ archetype: string; accuracy: number; boost: number }> = [];
  
  for (const [archetype, stats] of state.archetypes) {
    if (stats.totalPredictions >= 10) {
      topPerformers.push({
        archetype,
        accuracy: stats.correctPredictions / stats.totalPredictions,
        boost: stats.boostMultiplier,
      });
    }
  }
  
  // Sort by accuracy
  topPerformers.sort((a, b) => b.accuracy - a.accuracy);
  
  return {
    globalAccuracy: state.globalAccuracy,
    globalDisagreementWinRate: state.globalDisagreementWinRate,
    archetypeCount: state.archetypes.size,
    topPerformers: topPerformers.slice(0, 5),
    isLearning: state.initialized && state.archetypes.size > 0,
  };
}

// ============= HELPER FUNCTIONS =============

function getOrCreateArchetypeStats(archetype: StrategicArchetype): ArchetypeStats {
  let stats = state.archetypes.get(archetype);
  
  if (!stats) {
    stats = {
      totalPredictions: 0,
      correctPredictions: 0,
      recentPredictions: [],
      disagreementWins: 0,
      disagreementLosses: 0,
      boostMultiplier: 1.0,
    };
    state.archetypes.set(archetype, stats);
  }
  
  return stats;
}

function normalizeArchetype(raw: string | null): StrategicArchetype | null {
  if (!raw) return null;
  
  const validArchetypes: StrategicArchetype[] = [
    'kingside_attack', 'queenside_expansion', 'central_domination',
    'prophylactic_defense', 'pawn_storm', 'piece_harmony',
    'opposite_castling', 'closed_maneuvering', 'open_tactical',
    'endgame_technique', 'sacrificial_attack', 'positional_squeeze',
    'unknown',
  ];
  
  const lower = raw.toLowerCase().replace(/\s+/g, '_');
  
  if (validArchetypes.includes(lower as StrategicArchetype)) {
    return lower as StrategicArchetype;
  }
  
  // Fuzzy match
  for (const valid of validArchetypes) {
    if (lower.includes(valid) || valid.includes(lower)) {
      return valid;
    }
  }
  
  return 'unknown';
}

// ============= EXPORTS =============

export { state as compoundingState };
