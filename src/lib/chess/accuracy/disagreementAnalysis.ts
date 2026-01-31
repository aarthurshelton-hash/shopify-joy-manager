/**
 * Disagreement Analysis - Priority 3.2
 * 
 * Track and analyze cases where En Pensent disagrees with Stockfish.
 * These are the most valuable learning opportunities.
 * 
 * When we're right and Stockfish is wrong, boost that archetype.
 * When Stockfish is right and we're wrong, learn from it.
 * 
 * Patent Pending - Alec Arthur Shelton
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// DISAGREEMENT TYPES
// ============================================================================

export interface DisagreementRecord {
  id: string;
  archetype: string;
  positionType: string;
  disagreementType: 'opposite' | 'confidence_gap' | 'draw_divergence';
  winner: 'enpensent' | 'stockfish';
  evaluationGap: number;  // How far apart were the evals
  moveNumber: number;
  timestamp: number;
  gameId?: string;
}

export interface DisagreementAnalysis {
  archetype: string;
  totalDisagreements: number;
  enPensentWins: number;
  stockfishWins: number;
  winRate: number;
  confidenceBoost: number;  // Calculated boost for this archetype
  topPositionTypes: Array<{ type: string; count: number; winRate: number }>;
  averageEvalGap: number;
  averageMoveNumber: number;
}

export interface PositionType {
  type: string;
  characteristics: string[];
}

// ============================================================================
// IN-MEMORY CACHE FOR FAST ACCESS
// ============================================================================

interface DisagreementCache {
  byArchetype: Map<string, DisagreementRecord[]>;
  totalEnPensentWins: number;
  totalStockfishWins: number;
  lastUpdated: number;
}

const cache: DisagreementCache = {
  byArchetype: new Map(),
  totalEnPensentWins: 0,
  totalStockfishWins: 0,
  lastUpdated: 0,
};

const CACHE_TTL_MS = 30000; // Refresh cache every 30 seconds

// ============================================================================
// POSITION TYPE DETECTION
// ============================================================================

/**
 * Detect the type of position based on moves
 */
export function detectPositionType(moves: string[]): PositionType {
  const moveCount = moves.length;
  const captures = moves.filter(m => m.includes('x')).length;
  const checks = moves.filter(m => m.includes('+')).length;
  const pawnMoves = moves.filter(m => /^[a-h]/.test(m) && !m.includes('=')).length;
  const captureRatio = captures / moveCount;
  
  const characteristics: string[] = [];
  
  // Determine position type
  let type = 'standard';
  
  if (captureRatio > 0.35) {
    type = 'tactical_melee';
    characteristics.push('high_capture_rate', 'forcing_moves');
  } else if (captureRatio > 0.25) {
    type = 'semi_open';
    characteristics.push('moderate_exchanges', 'dynamic');
  } else if (pawnMoves / moveCount > 0.3) {
    type = 'closed';
    characteristics.push('pawn_chains', 'maneuvering');
  } else if (checks > 5) {
    type = 'attacking';
    characteristics.push('king_pressure', 'initiative');
  } else if (moveCount > 60) {
    type = 'endgame';
    characteristics.push('reduced_material', 'technique');
  } else {
    type = 'positional';
    characteristics.push('piece_placement', 'prophylaxis');
  }
  
  return { type, characteristics };
}

// ============================================================================
// DISAGREEMENT RECORDING
// ============================================================================

/**
 * Record a disagreement between En Pensent and Stockfish
 * 
 * Call this whenever hybrid_correct !== stockfish_correct
 */
export async function recordDisagreementOutcome(params: {
  archetype: string;
  positionType: string;
  disagreementType: 'opposite' | 'confidence_gap' | 'draw_divergence';
  winner: 'enpensent' | 'stockfish';
  evaluationGap: number;
  moveNumber: number;
  gameId?: string;
}): Promise<void> {
  const record: DisagreementRecord = {
    id: crypto.randomUUID(),
    archetype: params.archetype,
    positionType: params.positionType,
    disagreementType: params.disagreementType,
    winner: params.winner,
    evaluationGap: params.evaluationGap,
    moveNumber: params.moveNumber,
    timestamp: Date.now(),
    gameId: params.gameId,
  };
  
  // Update cache
  const archetypeRecords = cache.byArchetype.get(params.archetype) || [];
  archetypeRecords.push(record);
  cache.byArchetype.set(params.archetype, archetypeRecords);
  
  if (params.winner === 'enpensent') {
    cache.totalEnPensentWins++;
  } else {
    cache.totalStockfishWins++;
  }
  
  // Log significant wins
  if (params.winner === 'enpensent') {
    console.log(`[DisagreementAnalysis] ✨ En Pensent beats Stockfish on ${params.archetype} (gap: ${params.evaluationGap.toFixed(0)}cp)`);
  }
}

/**
 * Get the disagreement win rate for an archetype
 * Returns: 0-1, where >0.5 means En Pensent wins more disagreements
 */
export function getDisagreementWinRate(archetype: string): number {
  const records = cache.byArchetype.get(archetype) || [];
  
  if (records.length < 3) {
    return 0.5; // Not enough data
  }
  
  const wins = records.filter(r => r.winner === 'enpensent').length;
  return wins / records.length;
}

/**
 * Get confidence boost for an archetype based on disagreement wins
 * 
 * If we beat Stockfish >60% of disagreements, boost confidence by 15%
 */
export function getConfidenceBoostFromDisagreements(archetype: string): number {
  const winRate = getDisagreementWinRate(archetype);
  
  if (winRate > 0.6) {
    return 1.15; // 15% boost
  } else if (winRate > 0.55) {
    return 1.08; // 8% boost
  } else if (winRate < 0.4) {
    return 0.92; // 8% penalty
  } else if (winRate < 0.35) {
    return 0.85; // 15% penalty
  }
  
  return 1.0; // Neutral
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get comprehensive disagreement analysis for an archetype
 */
export function analyzeArchetypeDisagreements(archetype: string): DisagreementAnalysis {
  const records = cache.byArchetype.get(archetype) || [];
  
  if (records.length === 0) {
    return {
      archetype,
      totalDisagreements: 0,
      enPensentWins: 0,
      stockfishWins: 0,
      winRate: 0.5,
      confidenceBoost: 1.0,
      topPositionTypes: [],
      averageEvalGap: 0,
      averageMoveNumber: 30,
    };
  }
  
  const enPensentWins = records.filter(r => r.winner === 'enpensent').length;
  const stockfishWins = records.filter(r => r.winner === 'stockfish').length;
  const winRate = enPensentWins / records.length;
  
  // Group by position type
  const byPositionType = new Map<string, { wins: number; total: number }>();
  for (const record of records) {
    const stats = byPositionType.get(record.positionType) || { wins: 0, total: 0 };
    stats.total++;
    if (record.winner === 'enpensent') stats.wins++;
    byPositionType.set(record.positionType, stats);
  }
  
  const topPositionTypes = Array.from(byPositionType.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.total,
      winRate: stats.wins / stats.total
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate averages
  const averageEvalGap = records.reduce((sum, r) => sum + r.evaluationGap, 0) / records.length;
  const averageMoveNumber = records.reduce((sum, r) => sum + r.moveNumber, 0) / records.length;
  
  return {
    archetype,
    totalDisagreements: records.length,
    enPensentWins,
    stockfishWins,
    winRate,
    confidenceBoost: getConfidenceBoostFromDisagreements(archetype),
    topPositionTypes,
    averageEvalGap,
    averageMoveNumber,
  };
}

/**
 * Get global disagreement statistics
 */
export function getGlobalDisagreementStats(): {
  totalDisagreements: number;
  enPensentWins: number;
  stockfishWins: number;
  overallWinRate: number;
  topWinningArchetypes: Array<{ archetype: string; winRate: number; count: number }>;
  topLosingArchetypes: Array<{ archetype: string; winRate: number; count: number }>;
} {
  const archetypeStats: Array<{ archetype: string; winRate: number; count: number }> = [];
  
  for (const [archetype, records] of cache.byArchetype.entries()) {
    if (records.length >= 3) {
      const wins = records.filter(r => r.winner === 'enpensent').length;
      archetypeStats.push({
        archetype,
        winRate: wins / records.length,
        count: records.length
      });
    }
  }
  
  // Sort for top winners and losers
  const sorted = [...archetypeStats].sort((a, b) => b.winRate - a.winRate);
  
  const total = cache.totalEnPensentWins + cache.totalStockfishWins;
  
  return {
    totalDisagreements: total,
    enPensentWins: cache.totalEnPensentWins,
    stockfishWins: cache.totalStockfishWins,
    overallWinRate: total > 0 ? cache.totalEnPensentWins / total : 0.5,
    topWinningArchetypes: sorted.filter(s => s.winRate > 0.5).slice(0, 5),
    topLosingArchetypes: sorted.filter(s => s.winRate < 0.5).reverse().slice(0, 5),
  };
}

// ============================================================================
// DATABASE SYNCHRONIZATION
// ============================================================================

/**
 * Load disagreement data from the database
 */
export async function loadDisagreementsFromDatabase(): Promise<void> {
  if (Date.now() - cache.lastUpdated < CACHE_TTL_MS) {
    return; // Cache is still fresh
  }
  
  console.log('[DisagreementAnalysis] Loading disagreement data from database...');
  
  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, hybrid_correct, stockfish_correct, stockfish_eval, move_number, game_id')
      .order('created_at', { ascending: false })
      .limit(10000);
    
    if (error || !data) {
      console.warn('[DisagreementAnalysis] Could not load from database:', error);
      return;
    }
    
    // Clear cache
    cache.byArchetype.clear();
    cache.totalEnPensentWins = 0;
    cache.totalStockfishWins = 0;
    
    // Process records
    for (const row of data) {
      // Only care about disagreements
      if (row.hybrid_correct === row.stockfish_correct) continue;
      
      const archetype = row.hybrid_archetype || 'unknown';
      const winner = row.hybrid_correct ? 'enpensent' : 'stockfish';
      
      const record: DisagreementRecord = {
        id: crypto.randomUUID(),
        archetype,
        positionType: 'unknown', // Not stored in DB currently
        disagreementType: 'opposite',
        winner,
        evaluationGap: Math.abs(row.stockfish_eval || 0),
        moveNumber: row.move_number || 25,
        timestamp: Date.now(),
        gameId: row.game_id,
      };
      
      const archetypeRecords = cache.byArchetype.get(archetype) || [];
      archetypeRecords.push(record);
      cache.byArchetype.set(archetype, archetypeRecords);
      
      if (winner === 'enpensent') {
        cache.totalEnPensentWins++;
      } else {
        cache.totalStockfishWins++;
      }
    }
    
    cache.lastUpdated = Date.now();
    
    const total = cache.totalEnPensentWins + cache.totalStockfishWins;
    console.log(`[DisagreementAnalysis] Loaded ${total} disagreements (En Pensent wins: ${cache.totalEnPensentWins}/${total})`);
    
  } catch (err) {
    console.error('[DisagreementAnalysis] Error loading from database:', err);
  }
}

/**
 * Initialize disagreement analysis system
 */
export async function initializeDisagreementAnalysis(): Promise<void> {
  await loadDisagreementsFromDatabase();
}
