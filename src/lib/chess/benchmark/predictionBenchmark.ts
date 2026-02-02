/**
 * En Pensent™ Prediction Benchmark System
 * 
 * v7.56-SMART-FALLBACK: Intelligent fallback handling with quality tiers
 * v7.3-RETRY-ON-FALLBACK: Retries with extended time before accepting fallback
 * 
 * THE PARADIGM: We don't just play chess - we predict its future better than pure calculation.
 * 
 * This benchmark proves that fusing strategic pattern recognition with tactical analysis
 * creates predictions that surpass Stockfish's raw evaluation.
 * 
 * Performance optimizations:
 * - Patterns loaded ONCE before benchmark starts (not per-prediction)
 * - Accuracy stats fetched ONCE and cached (not per-prediction)
 * - skipCloudEval option used to avoid API rate limits
 * - RETRY with extended timeout before accepting fallback
 * - SMART FALLBACK: Use archetype history instead of random guess
 */

import { Chess } from 'chess.js';
import { getStockfishEngine, terminateStockfish } from '../stockfishEngine';
import { generateHybridPrediction } from '../hybridPrediction';
import { extractColorFlowSignature } from '../colorFlowAnalysis';
import { simulateGame } from '../gameSimulator';
import { loadLearnedPatterns } from '../patternLearning/persistentPatternLoader';
import { fetchChessCumulativeStats, invalidateChessStatsCache } from '@/hooks/useRealtimeAccuracy';
import { updateAccuracyCache } from '../hybridPrediction/confidenceCalculator';
import { loadArchetypeStats, getArchetypePrediction } from '../accuracy/archetypeHistoricalRates';

// v7.56: Fallback quality tiers
export type FallbackTier = 'full' | 'partial_sf' | 'partial_hybrid' | 'archetype_fallback' | 'excluded';

export interface PredictionAttempt {
  gameId: string;
  moveNumber: number;
  fen: string;
  pgn: string;
  
  // Stockfish's prediction (from raw centipawn evaluation)
  stockfishEval: number;
  stockfishPrediction: 'white_wins' | 'black_wins' | 'draw';
  stockfishConfidence: number; // 0-100
  
  // Hybrid system prediction
  hybridPrediction: 'white_wins' | 'black_wins' | 'draw';
  hybridConfidence: number; // 0-100
  hybridArchetype: string;
  
  // Actual result after game completes
  actualResult?: 'white_wins' | 'black_wins' | 'draw';
  
  // Scoring
  stockfishCorrect?: boolean;
  hybridCorrect?: boolean;
  
  // v7.3: Track if this was a retry
  wasRetried?: boolean;
  
  // v7.56: Fallback quality tier
  fallbackTier?: FallbackTier;
  fallbackSource?: 'archetype_history' | 'default_rates' | 'random';
}

export interface BenchmarkResult {
  totalGames: number;
  completedGames: number;
  predictionPoints: PredictionAttempt[];
  
  // Win rates (v7.56: excludes 'excluded' tier)
  stockfishAccuracy: number;
  hybridAccuracy: number;
  
  // Detailed breakdown
  stockfishWins: number;  // Predictions where SF was right, Hybrid wrong
  hybridWins: number;     // Predictions where Hybrid was right, SF wrong
  bothCorrect: number;
  bothWrong: number;
  
  // By archetype
  archetypePerformance: Record<string, { correct: number; total: number }>;
  
  // Statistical significance
  confidence: number;
  pValue: number;
  
  // Timestamp
  startedAt: Date;
  completedAt?: Date;
  
  // v7.3: Retry stats
  totalRetries?: number;
  
  // v7.56: Fallback stats
  fallbackStats?: {
    full: number;           // Complete predictions
    partial_sf: number;     // SF failed, Hybrid worked
    partial_hybrid: number; // Hybrid failed, SF worked
    archetype_fallback: number; // Used archetype history
    excluded: number;       // Both failed - not in accuracy metrics
  };
}

// v7.3: Helper to detect if result is a fallback
function isFallbackResult<T>(result: T, fallback: T): boolean {
  if (result === fallback) return true;
  if (typeof result === 'object' && typeof fallback === 'object') {
    return JSON.stringify(result) === JSON.stringify(fallback);
  }
  return false;
}

// v7.3: Promise with timeout that RETRIES with extended time on fallback
async function withRetryTimeout<T>(
  promiseFactory: () => Promise<T>,
  initialMs: number,
  fallback: T,
  maxRetries: number = 2,
  timeoutMultiplier: number = 1.5
): Promise<{ result: T; wasRetried: boolean }> {
  let currentTimeout = initialMs;
  let wasRetried = false;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await Promise.race([
      promiseFactory(),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), currentTimeout))
    ]);
    
    // If we got a real result (not fallback), return it
    if (!isFallbackResult(result, fallback)) {
      return { result, wasRetried };
    }
    
    // On fallback, retry with more time
    if (attempt < maxRetries) {
      wasRetried = true;
      currentTimeout = Math.round(currentTimeout * timeoutMultiplier);
      console.log(`[v7.3] Timeout hit, retry ${attempt + 1}/${maxRetries} with ${currentTimeout}ms`);
      
      // Reset Stockfish if it might be stuck
      if (attempt === 1) {
        try {
          terminateStockfish();
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.warn('[v7.3] Engine reset failed:', e);
        }
      }
    }
  }
  
  // All retries exhausted, return fallback
  console.warn('[v7.3] All retries exhausted, using fallback');
  return { result: fallback, wasRetried };
}

// Simple timeout helper (no retry) for non-critical operations
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

// Convert Stockfish centipawn evaluation to win probability and prediction
// v8.1-SYMMETRIC: Fixed asymmetric thresholds causing white bias
function stockfishEvalToPrediction(cp: number): {
  prediction: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
} {
  // SYMMETRIC thresholds - identical for both colors
  const WINNING_THRESHOLD = 150;
  const ADVANTAGE_THRESHOLD = 50;
  const SLIGHT_THRESHOLD = 15;
  
  // Winning positions - SYMMETRIC
  if (cp > WINNING_THRESHOLD) {
    const confidence = Math.min(85, 60 + (cp - WINNING_THRESHOLD) / 8);
    return { prediction: 'white_wins', confidence };
  } else if (cp < -WINNING_THRESHOLD) {
    const confidence = Math.min(85, 60 + (-cp - WINNING_THRESHOLD) / 8);
    return { prediction: 'black_wins', confidence };
  }
  
  // Advantage positions - SYMMETRIC
  else if (cp > ADVANTAGE_THRESHOLD) {
    const advantage = (cp - ADVANTAGE_THRESHOLD) / (WINNING_THRESHOLD - ADVANTAGE_THRESHOLD);
    const confidence = 45 + advantage * 20;
    return { prediction: 'white_wins', confidence };
  } else if (cp < -ADVANTAGE_THRESHOLD) {
    const advantage = (-cp - ADVANTAGE_THRESHOLD) / (WINNING_THRESHOLD - ADVANTAGE_THRESHOLD);
    const confidence = 45 + advantage * 20;
    return { prediction: 'black_wins', confidence };
  }
  
  // Slight advantage - SYMMETRIC
  else if (cp > SLIGHT_THRESHOLD) {
    const confidence = 35 + ((cp - SLIGHT_THRESHOLD) / (ADVANTAGE_THRESHOLD - SLIGHT_THRESHOLD)) * 10;
    return { prediction: 'white_wins', confidence };
  } else if (cp < -SLIGHT_THRESHOLD) {
    const confidence = 35 + ((-cp - SLIGHT_THRESHOLD) / (ADVANTAGE_THRESHOLD - SLIGHT_THRESHOLD)) * 10;
    return { prediction: 'black_wins', confidence };
  }
  
  // Equal position
  else {
    const confidence = 30 + (SLIGHT_THRESHOLD - Math.abs(cp)) * 2;
    return { prediction: 'draw', confidence };
  }
}

// Generate a high-quality Stockfish vs Stockfish game
async function generateStockfishGame(
  gameId: string,
  depth: number = 18,
  maxMoves: number = 100,
  onProgress?: (move: number, pgn: string) => void
): Promise<{ pgn: string; result: 'white_wins' | 'black_wins' | 'draw'; moveCount: number }> {
  const chess = new Chess();
  const engine = getStockfishEngine();
  
  // Timeout: 10s for engine ready
  const ready = await withTimeout(engine.waitReady(), 10000, false);
  if (!ready) {
    console.warn('[Benchmark] Stockfish not ready, returning short game');
    return { pgn: '', result: 'draw', moveCount: 0 };
  }
  
  let moveCount = 0;
  const MOVE_TIMEOUT = 5000; // 5s per move max
  const GAME_TIMEOUT = 120000; // 2 min total game limit
  const gameStart = Date.now();
  
  while (!chess.isGameOver() && moveCount < maxMoves) {
    // Check total game timeout
    if (Date.now() - gameStart > GAME_TIMEOUT) {
      console.warn(`[Benchmark] Game ${gameId} hit 2-minute limit at move ${moveCount}`);
      break;
    }
    
    // Analysis with 5s timeout per move
    const analysis = await withTimeout(
      engine.analyzePosition(chess.fen(), { depth, nodes: 50000 }),
      MOVE_TIMEOUT,
      { bestMove: null, evaluation: { score: 0 } } as any
    );
    
    if (analysis.bestMove) {
      try {
        const from = analysis.bestMove.slice(0, 2);
        const to = analysis.bestMove.slice(2, 4);
        const promotion = analysis.bestMove.length > 4 ? analysis.bestMove[4] : undefined;
        
        chess.move({ from, to, promotion });
        moveCount++;
        
        onProgress?.(moveCount, chess.pgn());
      } catch (e) {
        console.warn('Move failed:', analysis.bestMove, e);
        break;
      }
    } else {
      console.warn(`[Benchmark] No best move returned for game ${gameId} at move ${moveCount}`);
      break;
    }
  }
  
  // Determine result - v8.1-SYMMETRIC: Use consistent threshold
  let result: 'white_wins' | 'black_wins' | 'draw' = 'draw';
  if (chess.isCheckmate()) {
    result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
  } else if (chess.isDraw()) {
    result = 'draw';
  } else if (moveCount >= maxMoves || Date.now() - gameStart > GAME_TIMEOUT) {
    // SYMMETRIC timeout evaluation - same threshold as prediction
    const finalEval = await withTimeout(engine.quickEval(chess.fen()), 3000, 0);
    const TIMEOUT_THRESHOLD = 150; // Match WINNING_THRESHOLD in stockfishEvalToPrediction
    if (finalEval > TIMEOUT_THRESHOLD) result = 'white_wins';
    else if (finalEval < -TIMEOUT_THRESHOLD) result = 'black_wins';
    else result = 'draw';
  }
  
  return { pgn: chess.pgn(), result, moveCount };
}

// Make a prediction at a specific point in the game
// v7.56-SMART-FALLBACK: Uses archetype history for intelligent fallbacks
// v7.3: Uses retry-on-fallback for both Stockfish and Hybrid predictions
async function makePredictionAtMove(
  gameId: string,
  fullPgn: string,
  moveNumber: number,
  depth: number = 18
): Promise<PredictionAttempt> {
  const chess = new Chess();
  chess.loadPgn(fullPgn);
  
  // Get history and replay up to moveNumber
  const history = chess.history({ verbose: true });
  chess.reset();
  
  for (let i = 0; i < Math.min(moveNumber, history.length); i++) {
    chess.move(history[i].san);
  }
  
  const truncatedPgn = chess.pgn();
  const fen = chess.fen();
  
  // v7.56: Track fallback state
  let sfFailed = false;
  let hybridFailed = false;
  let fallbackTier: FallbackTier = 'full';
  let fallbackSource: 'archetype_history' | 'default_rates' | 'random' | undefined;
  
  // v7.56: Pre-extract Color Flow signature for smart fallback
  let extractedArchetype: string = 'unknown';
  let extractedDominantSide: 'white' | 'black' | 'contested' = 'contested';
  try {
    const simResult = simulateGame(truncatedPgn);
    if (simResult.board && simResult.gameData) {
      const signature = extractColorFlowSignature(simResult.board, simResult.gameData, moveNumber);
      extractedArchetype = signature.archetype;
      extractedDominantSide = signature.dominantSide;
    }
  } catch (e) {
    console.warn('[v7.56] Signature extraction failed:', e);
  }
  
  // v7.3: Stockfish evaluation with RETRY on timeout
  const engine = getStockfishEngine();
  await withTimeout(engine.waitReady(), 5000, false);
  
  const sfFallback = { evaluation: { score: 0 }, bestMove: '', isFallback: true } as any;
  const { result: analysis, wasRetried: sfRetried } = await withRetryTimeout(
    () => engine.analyzePosition(fen, { depth, nodes: 100000 }),
    8000, // 8s initial timeout
    sfFallback,
    2, // max 2 retries
    1.5 // 1.5x timeout on retry (8s -> 12s -> 18s)
  );
  
  // Check if SF actually returned data or fallback
  sfFailed = analysis.isFallback === true || (analysis.evaluation?.score === 0 && !analysis.bestMove);
  
  const stockfishResult = stockfishEvalToPrediction(analysis.evaluation?.score || 0);
  
  // v7.56: Hybrid prediction with SMART FALLBACK
  const hybridFallback = { 
    trajectoryPrediction: { outcomeProbabilities: { whiteWin: 0.33, blackWin: 0.33, draw: 0.34 } },
    confidence: { overall: 30 },
    strategicAnalysis: { archetype: 'FALLBACK' },
    isFallback: true
  } as any;
  
  const { result: hybridResult, wasRetried: hybridRetried } = await withRetryTimeout(
    () => generateHybridPrediction(truncatedPgn, { 
      depth,
      precomputedEval: analysis.evaluation?.score || 0,
      precomputedDepth: analysis.evaluation?.depth || depth,
      skipCloudEval: true,
    }),
    12000, // 12s initial timeout
    hybridFallback,
    2, // max 2 retries
    1.5 // 1.5x timeout on retry (12s -> 18s -> 27s)
  );
  
  // Check if Hybrid actually returned data or fallback
  hybridFailed = hybridResult.isFallback === true || hybridResult.strategicAnalysis?.archetype === 'FALLBACK';
  
  // v7.56: Determine fallback tier and apply smart fallback if needed
  let hybridPrediction: 'white_wins' | 'black_wins' | 'draw';
  let hybridConfidence: number;
  let hybridArchetype: string;
  
  if (!hybridFailed) {
    // Full prediction available
    fallbackTier = sfFailed ? 'partial_sf' : 'full';
    const probs = hybridResult.trajectoryPrediction.outcomeProbabilities;
    hybridPrediction = 
      probs.whiteWin > probs.blackWin && probs.whiteWin > probs.draw ? 'white_wins' :
      probs.blackWin > probs.draw ? 'black_wins' : 'draw';
    hybridConfidence = hybridResult.confidence.overall;
    hybridArchetype = hybridResult.strategicAnalysis.archetype;
  } else if (!sfFailed && extractedArchetype !== 'unknown') {
    // Hybrid failed but SF worked AND we have an archetype - use smart fallback
    fallbackTier = 'archetype_fallback';
    const archetypePred = getArchetypePrediction(extractedArchetype as any, extractedDominantSide);
    hybridPrediction = archetypePred.prediction;
    hybridConfidence = archetypePred.confidence;
    hybridArchetype = `${extractedArchetype}_fallback`;
    fallbackSource = archetypePred.source === 'historical' ? 'archetype_history' : 'default_rates';
    console.log(`[v7.56] Smart fallback for ${gameId}: ${extractedArchetype} -> ${hybridPrediction} (${fallbackSource})`);
  } else if (sfFailed && hybridFailed) {
    // Both failed - exclude from metrics
    fallbackTier = 'excluded';
    hybridPrediction = 'draw'; // Placeholder
    hybridConfidence = 0;
    hybridArchetype = 'EXCLUDED';
    fallbackSource = 'random';
    console.warn(`[v7.56] Both SF and Hybrid failed for ${gameId} - excluding from metrics`);
  } else {
    // SF failed, hybrid worked
    fallbackTier = 'partial_hybrid';
    const probs = hybridResult.trajectoryPrediction.outcomeProbabilities;
    hybridPrediction = 
      probs.whiteWin > probs.blackWin && probs.whiteWin > probs.draw ? 'white_wins' :
      probs.blackWin > probs.draw ? 'black_wins' : 'draw';
    hybridConfidence = hybridResult.confidence.overall;
    hybridArchetype = hybridResult.strategicAnalysis.archetype;
  }
  
  const wasRetried = sfRetried || hybridRetried;
  if (wasRetried) {
    console.log(`[v7.56] Prediction for ${gameId} completed after retry (SF: ${sfRetried}, Hybrid: ${hybridRetried}, Tier: ${fallbackTier})`);
  }
    
  return {
    gameId,
    moveNumber,
    fen,
    pgn: truncatedPgn,
    stockfishEval: analysis.evaluation?.score || 0,
    stockfishPrediction: stockfishResult.prediction,
    stockfishConfidence: stockfishResult.confidence,
    hybridPrediction,
    hybridConfidence,
    hybridArchetype,
    wasRetried,
    fallbackTier,
    fallbackSource,
  };
}

// Run the full benchmark
// v7.2-BENCHMARK-STREAMLINED: Pre-load all patterns and cache accuracy ONCE before loop
export async function runPredictionBenchmark(
  options: {
    numGames?: number;
    predictionMoveNumber?: number;
    depth?: number;
    onProgress?: (status: string, progress: number) => void;
  } = {}
): Promise<BenchmarkResult> {
  const {
    numGames = 10,
    predictionMoveNumber = 20,
    depth = 18,
    onProgress,
  } = options;
  
  // v7.2: PRE-LOAD patterns ONCE before benchmark starts
  onProgress?.('Loading historical patterns...', 1);
  try {
    const { loaded } = await withTimeout(
      loadLearnedPatterns(),
      10000, // 10s timeout
      { loaded: 0, hybridWins: 0, stockfishWins: 0, totalAccuracy: 0 }
    );
    console.log(`[Benchmark] Pre-loaded ${loaded} historical patterns`);
  } catch (e) {
    console.warn('[Benchmark] Pattern pre-load failed, continuing:', e);
  }
  
  // v7.56: PRE-LOAD archetype stats for smart fallbacks
  onProgress?.('Loading archetype history...', 1.5);
  try {
    const archetypeStats = await withTimeout(loadArchetypeStats(), 5000, new Map());
    console.log(`[Benchmark] Pre-loaded archetype stats for ${archetypeStats.size} archetypes`);
  } catch (e) {
    console.warn('[Benchmark] Archetype stats pre-load failed, continuing:', e);
  }
  
  // v7.2: PRE-CACHE accuracy stats ONCE before benchmark starts
  onProgress?.('Fetching accuracy stats...', 2);
  try {
    const stats = await withTimeout(
      fetchChessCumulativeStats(),
      5000, // 5s timeout
      { totalGames: 0, hybridAccuracy: 50, stockfishAccuracy: 50 } as any
    );
    if (stats.totalGames > 0) {
      const totalCorrect = Math.round((stats.hybridAccuracy / 100) * stats.totalGames);
      updateAccuracyCache(stats.totalGames, totalCorrect);
    }
    console.log(`[Benchmark] Pre-cached accuracy: ${stats.hybridAccuracy.toFixed(1)}% from ${stats.totalGames} games`);
  } catch (e) {
    console.warn('[Benchmark] Accuracy pre-cache failed, continuing:', e);
  }
  
  const result: BenchmarkResult = {
    totalGames: numGames,
    completedGames: 0,
    predictionPoints: [],
    stockfishAccuracy: 0,
    hybridAccuracy: 0,
    stockfishWins: 0,
    hybridWins: 0,
    bothCorrect: 0,
    bothWrong: 0,
    archetypePerformance: {},
    confidence: 0,
    pValue: 1,
    startedAt: new Date(),
  };
  
  for (let i = 0; i < numGames; i++) {
    // CRITICAL: For internal benchmark (Stockfish vs Stockfish), we use a synthetic-style ID
    // but mark it clearly as internal so it's never confused with real Lichess IDs
    // Real Lichess IDs are ALWAYS 8 alphanumeric chars - this format is intentionally different
    const gameId = `internal_sfvsf_${i}`;
    
    onProgress?.(`Generating game ${i + 1}/${numGames}`, (i / numGames) * 100);
    
    try {
      // Generate a Stockfish vs Stockfish game
      const game = await generateStockfishGame(gameId, depth, 100);
      
      if (game.moveCount < predictionMoveNumber) {
        console.log(`Game ${i} too short (${game.moveCount} moves), skipping`);
        continue;
      }
      
      onProgress?.(`Analyzing game ${i + 1}/${numGames}`, ((i + 0.5) / numGames) * 100);
      
      // Make predictions at the specified move
      const prediction = await makePredictionAtMove(gameId, game.pgn, predictionMoveNumber, depth);
      prediction.actualResult = game.result;
      
      // Score predictions
      prediction.stockfishCorrect = prediction.stockfishPrediction === game.result;
      prediction.hybridCorrect = prediction.hybridPrediction === game.result;
      
      result.predictionPoints.push(prediction);
      result.completedGames++;
      
      // Update archetype performance
      if (!result.archetypePerformance[prediction.hybridArchetype]) {
        result.archetypePerformance[prediction.hybridArchetype] = { correct: 0, total: 0 };
      }
      result.archetypePerformance[prediction.hybridArchetype].total++;
      if (prediction.hybridCorrect) {
        result.archetypePerformance[prediction.hybridArchetype].correct++;
      }
      
      // Update comparison counts
      if (prediction.stockfishCorrect && prediction.hybridCorrect) {
        result.bothCorrect++;
      } else if (!prediction.stockfishCorrect && !prediction.hybridCorrect) {
        result.bothWrong++;
      } else if (prediction.hybridCorrect) {
        result.hybridWins++;
      } else {
        result.stockfishWins++;
      }
      
    } catch (e) {
      console.error(`Error in game ${i}:`, e);
    }
  }
  
  // v8.1: Calculate fallback stats (for transparency)
  const fallbackStats = {
    full: result.predictionPoints.filter(p => p.fallbackTier === 'full').length,
    partial_sf: result.predictionPoints.filter(p => p.fallbackTier === 'partial_sf').length,
    partial_hybrid: result.predictionPoints.filter(p => p.fallbackTier === 'partial_hybrid').length,
    archetype_fallback: result.predictionPoints.filter(p => p.fallbackTier === 'archetype_fallback').length,
    excluded: result.predictionPoints.filter(p => p.fallbackTier === 'excluded').length,
  };
  result.fallbackStats = fallbackStats;
  
  console.log(`[v7.56] Fallback stats: ${JSON.stringify(fallbackStats)}`);
  
  // v8.1-FIXED: Calculate final statistics INCLUDING ALL predictions with actual results
  // Previously excluded 'excluded' tier which skewed accuracy metrics
  const predictionsWithResults = result.predictionPoints.filter(p => p.actualResult);
  const totalCount = predictionsWithResults.length;
  
  // Count ALL predictions with results (don't exclude based on fallback tier)
  const sfCorrect = predictionsWithResults.filter(p => p.stockfishCorrect).length;
  const hybridCorrect = predictionsWithResults.filter(p => p.hybridCorrect).length;
  
  result.stockfishAccuracy = totalCount > 0 ? (sfCorrect / totalCount) * 100 : 0;
  result.hybridAccuracy = totalCount > 0 ? (hybridCorrect / totalCount) * 100 : 0;
  
  // Statistical significance (binomial test approximation)
  if (totalCount > 0) {
    const diff = Math.abs(hybridCorrect - sfCorrect);
    const n = totalCount;
    const variance = n * 0.5 * 0.5; // Under null hypothesis
    const zScore = diff / Math.sqrt(variance);
    result.pValue = 2 * (1 - normalCdf(zScore));
    result.confidence = 100 * (1 - result.pValue);
  }
  
  result.completedAt = new Date();
  
  // Log summary with corrected counts
  console.log(`[v8.1] Analyzed ${totalCount} predictions total`);
  if (fallbackStats.excluded > 0) {
    console.log(`[v8.1] Included ${fallbackStats.excluded} previously excluded predictions`);
  }
  console.log(`[v8.1] Stockfish: ${sfCorrect}/${totalCount} (${result.stockfishAccuracy.toFixed(1)}%)`);
  console.log(`[v8.1] Hybrid: ${hybridCorrect}/${totalCount} (${result.hybridAccuracy.toFixed(1)}%)`);
  if (fallbackStats.archetype_fallback > 0) {
    console.log(`[v8.1] Used archetype-based smart fallback for ${fallbackStats.archetype_fallback} predictions`);
  }
  
  return result;
}

// Normal CDF approximation for p-value calculation
function normalCdf(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1 / (1 + p * z);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1 + sign * y);
}

// Quick benchmark with pre-existing games
// v7.2-BENCHMARK-STREAMLINED: Pre-load patterns and cache accuracy
export async function runQuickBenchmark(
  pgnGames: { pgn: string; result: 'white_wins' | 'black_wins' | 'draw' }[],
  predictionMoveNumber: number = 20,
  depth: number = 18,
  onProgress?: (status: string, progress: number) => void
): Promise<BenchmarkResult> {
  // v7.2: PRE-LOAD patterns and accuracy stats ONCE
  onProgress?.('Loading historical patterns...', 1);
  try {
    await withTimeout(loadLearnedPatterns(), 10000, { loaded: 0 } as any);
    const stats = await withTimeout(fetchChessCumulativeStats(), 5000, { totalGames: 0, hybridAccuracy: 50 } as any);
    if (stats.totalGames > 0) {
      const totalCorrect = Math.round((stats.hybridAccuracy / 100) * stats.totalGames);
      updateAccuracyCache(stats.totalGames, totalCorrect);
    }
  } catch (e) {
    console.warn('[QuickBenchmark] Pre-load failed, continuing:', e);
  }
  
  const result: BenchmarkResult = {
    totalGames: pgnGames.length,
    completedGames: 0,
    predictionPoints: [],
    stockfishAccuracy: 0,
    hybridAccuracy: 0,
    stockfishWins: 0,
    hybridWins: 0,
    bothCorrect: 0,
    bothWrong: 0,
    archetypePerformance: {},
    confidence: 0,
    pValue: 1,
    startedAt: new Date(),
  };
  
  for (let i = 0; i < pgnGames.length; i++) {
    const game = pgnGames[i];
    const gameId = `quick-${i}`;
    
    onProgress?.(`Analyzing game ${i + 1}/${pgnGames.length}`, (i / pgnGames.length) * 100);
    
    try {
      const prediction = await makePredictionAtMove(gameId, game.pgn, predictionMoveNumber, depth);
      prediction.actualResult = game.result;
      prediction.stockfishCorrect = prediction.stockfishPrediction === game.result;
      prediction.hybridCorrect = prediction.hybridPrediction === game.result;
      
      result.predictionPoints.push(prediction);
      result.completedGames++;
      
      // Update counts (same as above)
      if (!result.archetypePerformance[prediction.hybridArchetype]) {
        result.archetypePerformance[prediction.hybridArchetype] = { correct: 0, total: 0 };
      }
      result.archetypePerformance[prediction.hybridArchetype].total++;
      if (prediction.hybridCorrect) {
        result.archetypePerformance[prediction.hybridArchetype].correct++;
      }
      
      if (prediction.stockfishCorrect && prediction.hybridCorrect) {
        result.bothCorrect++;
      } else if (!prediction.stockfishCorrect && !prediction.hybridCorrect) {
        result.bothWrong++;
      } else if (prediction.hybridCorrect) {
        result.hybridWins++;
      } else {
        result.stockfishWins++;
      }
      
    } catch (e) {
      console.error(`Error in game ${i}:`, e);
    }
  }
  
  // Calculate stats
  const sfCorrect = result.predictionPoints.filter(p => p.stockfishCorrect).length;
  const hybridCorrect = result.predictionPoints.filter(p => p.hybridCorrect).length;
  
  result.stockfishAccuracy = result.completedGames > 0 ? (sfCorrect / result.completedGames) * 100 : 0;
  result.hybridAccuracy = result.completedGames > 0 ? (hybridCorrect / result.completedGames) * 100 : 0;
  
  if (result.completedGames > 0) {
    const diff = Math.abs(hybridCorrect - sfCorrect);
    const n = result.completedGames;
    const variance = n * 0.5 * 0.5;
    const zScore = diff / Math.sqrt(variance);
    result.pValue = 2 * (1 - normalCdf(zScore));
    result.confidence = 100 * (1 - result.pValue);
  }
  
  result.completedAt = new Date();
  
  return result;
}

export default runPredictionBenchmark;
