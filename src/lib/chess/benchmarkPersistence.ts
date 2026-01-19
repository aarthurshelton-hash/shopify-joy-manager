/**
 * Benchmark Persistence & Learning
 * 
 * Stores all benchmark results for:
 * 1. Historical tracking of accuracy improvement
 * 2. Pattern learning from predictions
 * 3. Archetype-specific refinement
 * 4. Public proof of our claims
 */

import { supabase } from '@/integrations/supabase/client';
import type { BenchmarkResult, PredictionAttempt } from './cloudBenchmark';

/**
 * Generate a unique hash for a chess position
 */
function hashPosition(fen: string): string {
  // Use the position part only (ignore move clocks for matching)
  const positionPart = fen.split(' ').slice(0, 4).join(' ');
  let hash = 0;
  for (let i = 0; i < positionPart.length; i++) {
    const char = positionPart.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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

    // Insert individual prediction attempts for learning
    const attempts = result.predictionPoints.map(attempt => ({
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
    }));

    const { error: attemptsError } = await supabase
      .from('chess_prediction_attempts')
      .insert(attempts);

    if (attemptsError) {
      console.error('Failed to save prediction attempts:', attemptsError);
    }

    console.log(`[Benchmark] Saved run ${runId} with ${attempts.length} predictions`);
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
 * FIXED: Filters out legacy 'unknown' Stockfish predictions that corrupt accuracy stats
 */
export async function getArchetypeStats(): Promise<Record<string, {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  stockfishBeats: number;
  hybridBeats: number;
}>> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('hybrid_archetype, hybrid_correct, stockfish_correct, stockfish_prediction');

  if (error || !data) {
    return {};
  }

  const stats: Record<string, {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    stockfishBeats: number;
    hybridBeats: number;
  }> = {};

  for (const attempt of data) {
    // CRITICAL FIX: Filter out legacy 'unknown' Stockfish predictions
    // These were caused by a bug in older code and corrupt accuracy calculations
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
    
    // Only count SF comparison if we have a valid SF prediction
    if (hasValidStockfishPrediction) {
      if (attempt.hybrid_correct && !attempt.stockfish_correct) {
        stats[arch].hybridBeats++;
      }
      if (attempt.stockfish_correct && !attempt.hybrid_correct) {
        stats[arch].stockfishBeats++;
      }
    }
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
 * FIXED: Filters out legacy 'unknown' predictions and recalculates accuracy properly
 */
export async function getCumulativeStats(): Promise<{
  totalRuns: number;
  totalGamesAnalyzed: number;
  overallHybridAccuracy: number;
  overallStockfishAccuracy: number;
  hybridNetWins: number;
  bestArchetype: string | null;
  worstArchetype: string | null;
  validPredictionCount: number;
  invalidPredictionCount: number;
}> {
  // Get individual predictions for accurate recalculation
  const { data: predictions } = await supabase
    .from('chess_prediction_attempts')
    .select('hybrid_correct, stockfish_correct, stockfish_prediction, hybrid_archetype');
  
  const { data: benchmarks } = await supabase
    .from('chess_benchmark_results')
    .select('completed_games, hybrid_accuracy, stockfish_accuracy, hybrid_wins, stockfish_wins');

  const archetypeStats = await getArchetypeStats();

  if (!benchmarks || benchmarks.length === 0) {
    return {
      totalRuns: 0,
      totalGamesAnalyzed: 0,
      overallHybridAccuracy: 0,
      overallStockfishAccuracy: 0,
      hybridNetWins: 0,
      bestArchetype: null,
      worstArchetype: null,
      validPredictionCount: 0,
      invalidPredictionCount: 0,
    };
  }

  // CRITICAL: Recalculate from individual predictions, filtering invalid data
  let validPredictions = 0;
  let invalidPredictions = 0;
  let hybridCorrectCount = 0;
  let stockfishCorrectCount = 0;
  let hybridWinsCount = 0;
  let stockfishWinsCount = 0;
  
  if (predictions) {
    for (const p of predictions) {
      const hasValidSF = p.stockfish_prediction && 
        p.stockfish_prediction !== 'unknown' &&
        ['white_wins', 'black_wins', 'draw', 'white', 'black'].includes(p.stockfish_prediction);
      
      if (hasValidSF) {
        validPredictions++;
        if (p.hybrid_correct) hybridCorrectCount++;
        if (p.stockfish_correct) stockfishCorrectCount++;
        if (p.hybrid_correct && !p.stockfish_correct) hybridWinsCount++;
        if (!p.hybrid_correct && p.stockfish_correct) stockfishWinsCount++;
      } else {
        invalidPredictions++;
      }
    }
  }

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

  return {
    totalRuns: benchmarks.length,
    totalGamesAnalyzed: validPredictions + invalidPredictions,
    overallHybridAccuracy: validPredictions > 0 ? (hybridCorrectCount / validPredictions) * 100 : 0,
    overallStockfishAccuracy: validPredictions > 0 ? (stockfishCorrectCount / validPredictions) * 100 : 0,
    hybridNetWins: hybridWinsCount - stockfishWinsCount,
    bestArchetype: bestArch,
    worstArchetype: worstArch,
    validPredictionCount: validPredictions,
    invalidPredictionCount: invalidPredictions,
  };
}
