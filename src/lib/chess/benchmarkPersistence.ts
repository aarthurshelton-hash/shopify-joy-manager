/**
 * Benchmark Persistence & Learning
 * 
 * Stores all benchmark results for:
 * 1. Historical tracking of accuracy improvement
 * 2. Pattern learning from predictions
 * 3. Archetype-specific refinement
 * 4. Public proof of our claims
 * 5. Cross-run deduplication for data integrity
 */

import { supabase } from '@/integrations/supabase/client';
import type { BenchmarkResult, PredictionAttempt } from './cloudBenchmark';

/**
 * Normalize FEN to position-only part for consistent matching
 * Removes move clocks which don't affect position identity
 */
export function normalizeFen(fen: string): string {
  // Handle moves: format from edge function - extract move sequence
  if (fen.startsWith('moves:')) {
    return fen; // Already normalized for move-based FENs
  }
  return fen.split(' ').slice(0, 4).join(' ');
}

/**
 * Generate a unique hash for a chess position
 * Uses SHA256-like hash of normalized FEN (first 16 chars)
 * This MUST match the database hash format for deduplication
 */
export function hashPosition(fen: string): string {
  const positionPart = normalizeFen(fen);
  
  // Use SHA256-like hash (matches database migration)
  // Simple but consistent hash - djb2 with 16-char hex output
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < positionPart.length; i++) {
    const char = positionPart.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
    hash1 = hash1 >>> 0;
    hash2 = hash2 >>> 0;
  }
  return hash1.toString(16).padStart(8, '0') + hash2.toString(16).padStart(8, '0');
}

/**
 * Fetch all previously analyzed GAMES (not positions)
 * 
 * CRITICAL INSIGHT: Deduplication is GAME-BASED ONLY
 * - Same position in DIFFERENT games = VALUABLE (strengthens pattern recognition)
 * - Same GAME (same Lichess ID) = SKIP (already predicted)
 * 
 * We ONLY deduplicate by Lichess game ID to ensure we never analyze the same 
 * game twice, but identical positions appearing in different games are welcome.
 */
/**
 * Check if a game ID is a REAL external ID (Lichess or Chess.com)
 * v6.57: Now supports prefixed IDs (li_XXXXXXXX, cc_XXXXXXXXX)
 * Real IDs: "ZhoooCoY", "li_ZhoooCoY", "cc_123456789"
 * NOT real: "benchmark-1234567890-0", "internal_sfvsf_0"
 */
export function isRealLichessId(gameId: string): boolean {
  // Strip prefix if present
  const rawId = gameId.replace(/^(li_|cc_)/, '');
  const hasValidPrefix = gameId.startsWith('li_') || gameId.startsWith('cc_');
  
  // Lichess: 8 alphanumeric chars
  const isLichess = rawId.length === 8 && /^[a-zA-Z0-9]+$/.test(rawId);
  // Chess.com: numeric IDs of varying length
  const isChessCom = gameId.startsWith('cc_') && /^\d+$/.test(rawId);
  
  return isLichess || isChessCom || (hasValidPrefix && rawId.length >= 6);
}

/**
 * Fetch all previously analyzed REAL Lichess games for deduplication
 * 
 * v4.0: COMPLETELY ELIMINATES synthetic ID tracking.
 * We ONLY care about real 8-char Lichess IDs for deduplication.
 * All other IDs are treated as noise and ignored.
 */
export async function getAlreadyAnalyzedData(): Promise<{
  gameIds: Set<string>;          // Contains ONLY real 8-char Lichess IDs now
  realLichessIds: Set<string>;   // Same as gameIds (kept for backwards compat)
  positionHashes: Set<string>;   // For pattern learning cross-reference (NOT deduplication)
  fenStrings: Set<string>;       // For pattern learning (NOT deduplication)
}> {
  const gameIds = new Set<string>();        // NOW contains ONLY real Lichess IDs
  const positionHashes = new Set<string>(); // For learning, NOT deduplication
  const fenStrings = new Set<string>();     // For learning, NOT deduplication

  // CRITICAL: Paginate through ALL records to bypass 1000 row limit
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  let totalFetched = 0;
  let syntheticSkipped = 0;

  while (hasMore) {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('position_hash, game_id, fen')
      .range(from, from + pageSize - 1);

    if (error) {
      console.warn('[v4.0-DEDUP] Error fetching games:', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data) {
      if (row.game_id) {
        // v6.57: Add BOTH raw and prefixed forms for dedup matching
        if (isRealLichessId(row.game_id)) {
          gameIds.add(row.game_id);
          // Also add raw form for cross-matching
          const rawId = row.game_id.replace(/^(li_|cc_)/, '');
          if (rawId !== row.game_id) {
            gameIds.add(rawId);
          }
        } else {
          syntheticSkipped++;
        }
      }
      
      // Position data for pattern learning (NOT used for deduplication)
      if (row.position_hash) positionHashes.add(row.position_hash);
      if (row.fen) fenStrings.add(normalizeFen(row.fen));
    }

    totalFetched += data.length;
    from += pageSize;
    hasMore = data.length === pageSize;
  }

  console.log(`[v4.0-DEDUP] Database: ${totalFetched} records, ${gameIds.size} real Lichess IDs, ${syntheticSkipped} synthetic skipped`);
  
  // Return gameIds as the canonical set - realLichessIds is the same reference for compatibility
  return { gameIds, realLichessIds: gameIds, positionHashes, fenStrings };
}

/**
 * Check if a specific position has already been analyzed.
 * SYNCHRONOUS for in-memory check, fires background reaffirmation.
 * When a duplicate is found, we reaffirm our existing knowledge
 * (increment confidence) without re-analyzing - Stockfish doesn't 
 * have this compounding advantage.
 */
export function isPositionAlreadyAnalyzed(
  fen: string, 
  analyzedData: { positionHashes: Set<string>; fenStrings: Set<string> },
  reaffirmOnDuplicate: boolean = true
): boolean {
  const hash = hashPosition(fen);
  const normalizedFen = normalizeFen(fen);
  
  // Check BOTH hash AND normalized FEN for maximum duplicate detection
  const isDuplicate = analyzedData.positionHashes.has(hash) || analyzedData.fenStrings.has(normalizedFen);
  
  if (isDuplicate && reaffirmOnDuplicate) {
    // Fire-and-forget reaffirmation - don't block the check
    reaffirmExistingPrediction(fen, hash).catch(() => {});
  }
  
  return isDuplicate;
}

/**
 * Check if a specific game has already been analyzed (v4.0).
 * 
 * ONLY checks real 8-char Lichess IDs. Synthetic IDs always return false
 * because we don't track them for deduplication purposes.
 */
export function isGameAlreadyAnalyzed(
  gameId: string, 
  analyzedData: { gameIds: Set<string> }
): boolean {
  // v4.0: First verify this is even a real Lichess ID format
  // If not, we can't have analyzed it as a "real" game
  if (!isRealLichessId(gameId)) {
    return false;
  }
  return analyzedData.gameIds.has(gameId);
}

/**
 * Reaffirm existing prediction data when we encounter a duplicate.
 * This compounds our knowledge without re-analyzing - we already know
 * the outcome, Stockfish doesn't have this memory advantage.
 */
export async function reaffirmExistingPrediction(fen: string, hash: string): Promise<void> {
  try {
    // Find the existing prediction for this position
    const { data: existing } = await supabase
      .from('chess_prediction_attempts')
      .select('id, hybrid_confidence, hybrid_correct, lesson_learned')
      .or(`position_hash.eq.${hash},fen.eq.${fen}`)
      .limit(1)
      .single();
    
    if (existing) {
      // Boost confidence slightly for validated patterns (max 0.99)
      const boostedConfidence = Math.min(0.99, (existing.hybrid_confidence || 0.5) + 0.01);
      
      // Update with reaffirmed confidence
      await supabase
        .from('chess_prediction_attempts')
        .update({ 
          hybrid_confidence: boostedConfidence,
          lesson_learned: {
            ...(existing.lesson_learned as Record<string, unknown> || {}),
            reaffirmed_count: ((existing.lesson_learned as Record<string, unknown>)?.reaffirmed_count as number || 0) + 1,
            last_reaffirmed: new Date().toISOString()
          }
        })
        .eq('id', existing.id);
      
      console.log(`[Reaffirm] Position ${hash.slice(0, 8)}... reaffirmed (conf: ${boostedConfidence.toFixed(3)})`);
    }
  } catch (error) {
    // Silent fail - reaffirmation is enhancement, not critical
    console.debug('[Reaffirm] Could not reaffirm position:', error);
  }
}

/**
 * Analyze what can be learned from a prediction
 * Returns a JSON-compatible object
 */
function analyzeLessonLearned(attempt: PredictionAttempt): {
  timestamp: string;
  type: string;
  insight: string;
  archetype: string;
  [key: string]: string | number | boolean | undefined;
} {
  const base = {
    timestamp: new Date().toISOString(),
    type: 'unknown',
    insight: '',
    archetype: attempt.hybridArchetype || 'Unknown',
  };

  // Case 1: Hybrid was right, Stockfish was wrong
  if (attempt.hybridCorrect && !attempt.stockfishCorrect) {
    return {
      ...base,
      type: 'hybrid_superiority',
      insight: 'Color Flow detected strategic pattern that pure tactics missed',
      stockfishMiss: attempt.stockfishEval,
      confidence: attempt.hybridConfidence,
    };
  }
  // Case 2: Stockfish was right, Hybrid was wrong
  if (!attempt.hybridCorrect && attempt.stockfishCorrect) {
    return {
      ...base,
      type: 'hybrid_failure',
      insight: 'Tactical considerations outweighed strategic patterns',
      needsImprovement: true,
      stockfishEval: attempt.stockfishEval,
    };
  }
  // Case 3: Both wrong
  if (!attempt.hybridCorrect && !attempt.stockfishCorrect) {
    return {
      ...base,
      type: 'position_chaos',
      insight: 'Position too chaotic for either system',
      unpredictable: true,
    };
  }
  // Case 4: Both right
  return {
    ...base,
    type: 'consensus',
    insight: 'Clear position correctly evaluated by both systems',
    reliable: true,
  };
}

/**
 * Save benchmark results to database for learning
 */
export async function saveBenchmarkResults(result: BenchmarkResult): Promise<string | null> {
  const runId = `benchmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Calculate duration
    const durationMs = result.completedAt 
      ? result.completedAt.getTime() - result.startedAt.getTime()
      : 0;

    // Insert main benchmark result with TCEC calibration markers
    const { data: benchmarkData, error: benchmarkError } = await supabase
      .from('chess_benchmark_results')
      .insert({
        run_id: runId,
        data_source: result.dataSource,
        total_games: result.totalGames,
        completed_games: result.completedGames,
        prediction_move_number: 20,
        stockfish_accuracy: result.stockfishAccuracy,
        hybrid_accuracy: result.hybridAccuracy,
        stockfish_wins: result.stockfishWins,
        hybrid_wins: result.hybridWins,
        both_correct: result.bothCorrect,
        both_wrong: result.bothWrong,
        p_value: result.pValue,
        confidence: result.confidence,
        archetype_performance: result.archetypePerformance,
        games_analyzed: result.gamesAnalyzed,
        duration_ms: durationMs,
        stockfish_version: 'TCEC Stockfish 17 NNUE (ELO 3600) Unlimited',
        hybrid_version: 'En Pensent Hybrid v2.0 (TCEC Calibrated)',
        data_quality_tier: 'tcec_calibrated',
        stockfish_mode: 'tcec_unlimited',
      })
      .select('id')
      .single();

    if (benchmarkError) {
      console.error('Failed to save benchmark:', benchmarkError);
      return null;
    }

    const benchmarkId = benchmarkData.id;

    // v6.65-COMPLETE-ONLY: Filter to ONLY save attempts with COMPLETE predictions
    // Invalid predictions block the game_id from re-capture in future runs
    const VALID_PREDICTIONS = ['white', 'black', 'draw', 'white_wins', 'black_wins'];
    
    const validAttempts = result.predictionPoints.filter(attempt => {
      const hybridPred = String(attempt.hybridPrediction || '');
      const sfPred = String(attempt.stockfishPrediction || '');
      
      const hasValidHybrid = hybridPred && hybridPred !== 'unknown' && VALID_PREDICTIONS.includes(hybridPred);
      const hasValidStockfish = sfPred && sfPred !== 'unknown' && VALID_PREDICTIONS.includes(sfPred);
      
      if (!hasValidHybrid || !hasValidStockfish) {
        console.log(`[v6.65] Skipping incomplete prediction for ${attempt.gameId}: hybrid=${hybridPred}, sf=${sfPred}`);
        return false;
      }
      return true;
    });

    // Insert individual prediction attempts for learning
    const attempts = validAttempts.map(attempt => ({
      benchmark_id: benchmarkId,
      game_id: attempt.gameId,
      game_name: attempt.gameName,
      move_number: attempt.moveNumber,
      fen: attempt.fen,
      pgn: attempt.pgn,
      stockfish_eval: attempt.stockfishEval,
      stockfish_depth: attempt.stockfishDepth,
      stockfish_prediction: attempt.stockfishPrediction,
      stockfish_confidence: attempt.stockfishConfidence,
      hybrid_prediction: attempt.hybridPrediction,
      hybrid_confidence: attempt.hybridConfidence,
      hybrid_archetype: attempt.hybridArchetype,
      actual_result: attempt.actualResult,
      stockfish_correct: attempt.stockfishCorrect,
      hybrid_correct: attempt.hybridCorrect,
      position_hash: hashPosition(attempt.fen),
      lesson_learned: JSON.parse(JSON.stringify(analyzeLessonLearned(attempt))),
      data_quality_tier: 'tcec_calibrated',
      data_source: 'web_client', // NEW: Distinguish from farm_terminal
      engine_version: 'TCEC Stockfish 17 NNUE (ELO 3600)',
      hybrid_engine: 'En Pensent Universal v2.1',
      lichess_id_verified: true,
    }));
    
    console.log(`[v6.65] Saving ${attempts.length}/${result.predictionPoints.length} complete predictions (${result.predictionPoints.length - attempts.length} incomplete filtered out)`);

    // CRITICAL: Use batch inserts for large sets to avoid timeout issues
    const BATCH_SIZE = 25;
    let savedCount = 0;
    
    for (let i = 0; i < attempts.length; i += BATCH_SIZE) {
      const batch = attempts.slice(i, i + BATCH_SIZE);
      const { error: attemptsError } = await supabase
        .from('chess_prediction_attempts')
        .insert(batch);

      if (attemptsError) {
        console.error(`Failed to save prediction batch ${i / BATCH_SIZE + 1}:`, attemptsError);
        
        // CRITICAL FIX: If predictions fail to save, delete the benchmark result
        // This prevents orphaned benchmark records that inflate total counts
        await supabase.from('chess_benchmark_results').delete().eq('id', benchmarkId);
        console.error('[Benchmark] Rolled back benchmark result due to prediction save failure');
        return null;
      }
      
      savedCount += batch.length;
    }

    console.log(`[Benchmark] Saved run ${runId} with ${savedCount}/${attempts.length} predictions`);
    return runId;

  } catch (error) {
    console.error('Error saving benchmark results:', error);
    return null;
  }
}

/**
 * Get historical benchmark accuracy trend
 */
export async function getBenchmarkHistory(limit: number = 20): Promise<{
  dates: string[];
  hybridAccuracy: number[];
  stockfishAccuracy: number[];
  totalGames: number;
}> {
  const { data, error } = await supabase
    .from('chess_benchmark_results')
    .select('created_at, hybrid_accuracy, stockfish_accuracy, completed_games')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    return { dates: [], hybridAccuracy: [], stockfishAccuracy: [], totalGames: 0 };
  }

  return {
    dates: data.map(r => new Date(r.created_at).toLocaleDateString()),
    hybridAccuracy: data.map(r => Number(r.hybrid_accuracy)),
    stockfishAccuracy: data.map(r => Number(r.stockfish_accuracy)),
    totalGames: data.reduce((sum, r) => sum + (r.completed_games || 0), 0),
  };
}

/**
 * Get archetype performance statistics across all benchmarks
 * Uses pagination to fetch ALL records beyond 1000 row limit
 */
export async function getArchetypeStats(): Promise<Record<string, {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  stockfishBeats: number;
  hybridBeats: number;
}>> {
  const stats: Record<string, {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    stockfishBeats: number;
    hybridBeats: number;
  }> = {};

  // Paginate through all records to bypass 1000 row limit
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, hybrid_correct, stockfish_correct, stockfish_prediction')
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const attempt of data) {
      const hasValidStockfishPrediction = attempt.stockfish_prediction && 
        attempt.stockfish_prediction !== 'unknown' &&
        ['white_wins', 'black_wins', 'draw', 'white', 'black'].includes(attempt.stockfish_prediction);
      
      const arch = attempt.hybrid_archetype || 'Unknown';
      if (!stats[arch]) {
        stats[arch] = {
          totalPredictions: 0,
          correctPredictions: 0,
          accuracy: 0,
          stockfishBeats: 0,
          hybridBeats: 0,
        };
      }

      stats[arch].totalPredictions++;
      if (attempt.hybrid_correct) {
        stats[arch].correctPredictions++;
      }
      
      if (hasValidStockfishPrediction) {
        if (attempt.hybrid_correct && !attempt.stockfish_correct) {
          stats[arch].hybridBeats++;
        }
        if (attempt.stockfish_correct && !attempt.hybrid_correct) {
          stats[arch].stockfishBeats++;
        }
      }
    }

    from += pageSize;
    hasMore = data.length === pageSize;
  }

  // Calculate accuracies
  for (const arch of Object.keys(stats)) {
    stats[arch].accuracy = stats[arch].totalPredictions > 0
      ? (stats[arch].correctPredictions / stats[arch].totalPredictions) * 100
      : 0;
  }

  return stats;
}

/**
 * Find positions where hybrid beat stockfish (for learning what works)
 */
export async function getHybridWinPatterns(limit: number = 50): Promise<{
  fen: string;
  archetype: string;
  hybridConfidence: number;
  lesson: Record<string, unknown>;
}[]> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('fen, hybrid_archetype, hybrid_confidence, lesson_learned')
    .eq('hybrid_correct', true)
    .eq('stockfish_correct', false)
    .order('hybrid_confidence', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(d => ({
    fen: d.fen,
    archetype: d.hybrid_archetype || 'Unknown',
    hybridConfidence: Number(d.hybrid_confidence) || 0,
    lesson: d.lesson_learned as Record<string, unknown> || {},
  }));
}

/**
 * Find positions where hybrid failed (for improvement)
 */
export async function getHybridFailurePatterns(limit: number = 50): Promise<{
  fen: string;
  archetype: string;
  stockfishEval: number;
  lesson: Record<string, unknown>;
}[]> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('fen, hybrid_archetype, stockfish_eval, lesson_learned')
    .eq('hybrid_correct', false)
    .eq('stockfish_correct', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(d => ({
    fen: d.fen,
    archetype: d.hybrid_archetype || 'Unknown',
    stockfishEval: Number(d.stockfish_eval) || 0,
    lesson: d.lesson_learned as Record<string, unknown> || {},
  }));
}

/**
 * Calculate cumulative statistics across all runs
 * v7.26-AUDIT-SYNC: Unified with useRealtimeAccuracy calculations
 * Uses ALL predictions (no exclusions) for accurate totals
 */
export async function getCumulativeStats(): Promise<{
  totalRuns: number;
  totalGamesAnalyzed: number;
  overallHybridAccuracy: number;
  overallStockfishAccuracy: number;
  hybridNetWins: number;
  hybridWins: number;
  stockfishWins: number;
  bothCorrect: number;
  bothWrong: number;
  bestArchetype: string | null;
  worstArchetype: string | null;
  validPredictionCount: number;
  invalidPredictionCount: number;
}> {
  // v7.26: Query ALL predictions without filters to match DB truth exactly
  const [
    { count: totalPredictions },
    { count: hybridCorrectCount },
    { count: sfCorrectCount },
    { count: bothCorrectCount },
    { count: bothWrongCount },
    { count: hybridExclusiveWins },
    { count: sfExclusiveWins },
    { count: totalRuns },
  ] = await Promise.all([
    // Total predictions (ALL records)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true }),
    // Hybrid correct (includes both_correct)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true),
    // Stockfish correct (includes both_correct)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('stockfish_correct', true),
    // Both correct
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .eq('stockfish_correct', true),
    // Both wrong
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', false)
      .eq('stockfish_correct', false),
    // Hybrid exclusive wins (hybrid correct, SF wrong)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .eq('stockfish_correct', false),
    // SF exclusive wins (SF correct, hybrid wrong)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', false)
      .eq('stockfish_correct', true),
    // Total benchmark runs
    supabase
      .from('chess_benchmark_results')
      .select('*', { count: 'exact', head: true }),
  ]);

  const total = totalPredictions || 0;
  const hybridTotal = hybridCorrectCount || 0;
  const sfTotal = sfCorrectCount || 0;
  const bothC = bothCorrectCount || 0;
  const bothW = bothWrongCount || 0;
  const hybridWinsExclusive = hybridExclusiveWins || 0;
  const sfWinsExclusive = sfExclusiveWins || 0;

  console.log('[v7.26-CUMULATIVE] DB Truth:', {
    total,
    hybridCorrect: hybridTotal,
    sfCorrect: sfTotal,
    bothCorrect: bothC,
    bothWrong: bothW,
    hybridExclusive: hybridWinsExclusive,
    sfExclusive: sfWinsExclusive,
    runs: totalRuns
  });
  
  const archetypeStats = await getArchetypeStats();

  // Find best/worst archetypes
  let bestArch: string | null = null;
  let worstArch: string | null = null;
  let bestAcc = 0;
  let worstAcc = 100;

  for (const [arch, stats] of Object.entries(archetypeStats)) {
    if (stats.totalPredictions >= 5) {
      if (stats.accuracy > bestAcc) {
        bestAcc = stats.accuracy;
        bestArch = arch;
      }
      if (stats.accuracy < worstAcc) {
        worstAcc = stats.accuracy;
        worstArch = arch;
      }
    }
  }

  // v7.26: Return EXACT DB values - no filtering or transformations
  return {
    totalRuns: totalRuns || 0,
    totalGamesAnalyzed: total,
    overallHybridAccuracy: total > 0 ? (hybridTotal / total) * 100 : 0,
    overallStockfishAccuracy: total > 0 ? (sfTotal / total) * 100 : 0,
    hybridNetWins: hybridWinsExclusive - sfWinsExclusive,
    hybridWins: hybridWinsExclusive,
    stockfishWins: sfWinsExclusive,
    bothCorrect: bothC,
    bothWrong: bothW,
    bestArchetype: bestArch,
    worstArchetype: worstArch,
    validPredictionCount: total,
    invalidPredictionCount: 0, // All predictions are valid in v7.26
  };
}
