/**
 * Dual-Pool Automated Benchmark Pipeline
 * VERSION: 6.94-BULLETPROOF (2026-01-21)
 * 
 * ARCHITECTURE:
 * ============
 * Two parallel processing pools - LOCAL STOCKFISH IS PRIMARY (guaranteed to work)
 * 
 * 1. HIGH-VOLUME LOCAL POOL (100+ results/hour)
 *    - Uses LOCAL Stockfish 17 NNUE at optimized depth (D18)
 *    - Fast and RELIABLE - no external API dependencies
 *    - Best for: Volume, guaranteed throughput
 * 
 * 2. DEEP LOCAL POOL (5 results/hour)  
 *    - Uses local Stockfish 17 NNUE at maximum depth (D30)
 *    - Slow but precise: ~12 minutes/game
 *    - Best for: Edge cases, pattern discovery
 * 
 * CRITICAL: Cloud API is OPTIONAL enhancement, not required.
 * Pipeline MUST work without any external API.
 * 
 * THROUGHPUT TARGETS:
 * - Volume Pool: 100 games/hour minimum (LOCAL STOCKFISH D18)
 * - Deep Pool: 5 games/hour with deep analysis (LOCAL STOCKFISH D30)
 * - Combined: 105+ unique games/hour
 */

const DUAL_POOL_VERSION = "6.94-BULLETPROOF";
console.log(`[v6.94] dualPoolPipeline.ts LOADED - Version: ${DUAL_POOL_VERSION}`);

import { Chess } from 'chess.js';
import { getStockfishEngine, terminateStockfish } from './stockfishEngine';
import { evaluatePosition as evaluateCloudPosition, getRateLimitStatus } from './lichessCloudEval';
import { generateHybridPrediction } from './hybridPrediction';
import { fetchLichessGames, lichessGameToPgn, type LichessGame } from './gameImport/lichessApi';
import { fetchChessComGames, type ChessComGame } from './gameImport/chesscomApi';
import { getAlreadyAnalyzedData, isGameAlreadyAnalyzed, hashPosition } from './benchmarkPersistence';
import { supabase } from '@/integrations/supabase/client';

// ================ POOL CONFIGURATIONS ================

export interface PoolConfig {
  name: string;
  targetPerHour: number;
  stockfishMode: 'local_fast' | 'local_deep'; // v6.94: Always local, just different depth
  localDepth: number;
  localNodes: number;
  analysisTimeout: number; // ms
  delayBetweenGames: number; // ms
}

// v6.94: VOLUME pool uses LOCAL Stockfish at D18 for guaranteed throughput
export const CLOUD_POOL_CONFIG: PoolConfig = {
  name: 'VOLUME-LOCAL',
  targetPerHour: 100,
  stockfishMode: 'local_fast',
  localDepth: 18,           // D18 is fast but accurate
  localNodes: 5000000,      // 5M nodes - quick
  analysisTimeout: 30000,   // 30s max
  delayBetweenGames: 500,   // 0.5s between games
};

// v6.94: DEEP pool uses LOCAL Stockfish at D30 for precision
export const LOCAL_POOL_CONFIG: PoolConfig = {
  name: 'LOCAL-DEEP',
  targetPerHour: 5,
  stockfishMode: 'local_deep',
  localDepth: 30,
  localNodes: 100000000,    // 100M nodes
  analysisTimeout: 600000,  // 10 minutes max
  delayBetweenGames: 1000,  // 1s between games
};

// ================ TYPES ================

export interface PoolPrediction {
  gameId: string;
  gameName: string;
  moveNumber: number;
  fen: string;
  pgn: string;
  
  // Stockfish evaluation
  stockfishEval: number;
  stockfishDepth: number;
  stockfishMode: 'cloud' | 'local';
  stockfishNodes?: number;
  
  stockfishPrediction: 'white_wins' | 'black_wins' | 'draw';
  stockfishConfidence: number;
  
  // Hybrid prediction
  hybridPrediction: 'white_wins' | 'black_wins' | 'draw';
  hybridConfidence: number;
  hybridArchetype: string;
  
  // Actual result
  actualResult: 'white_wins' | 'black_wins' | 'draw';
  
  // Scoring
  stockfishCorrect: boolean;
  hybridCorrect: boolean;
  
  // Metadata
  dataSource: 'lichess' | 'chesscom';
  poolName: string;
  analysisTimeMs: number;
}

export interface PoolProgress {
  poolName: string;
  completed: number;
  target: number;
  gamesPerHour: number;
  lastGameTime: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
}

export interface DualPoolResult {
  cloudPool: PoolPrediction[];
  localPool: PoolPrediction[];
  totalProcessed: number;
  cloudAccuracy: { stockfish: number; hybrid: number };
  localAccuracy: { stockfish: number; hybrid: number };
  startedAt: Date;
  completedAt?: Date;
}

// ================ PLAYER POOLS ================

// v6.96: VERIFIED existing Lichess players only 
// Removed: SSJG_Goku (404), Hikaru (404 - uses 'DrNykterstein' on Lichess)
const LICHESS_ELITE_PLAYERS = [
  'DrNykterstein', 'nihalsarin2004', 'FairChess_on_YouTube',
  'LyonBeast', 'Bombegansen', 'GMWSO', 'Vladimirovich9000',
  'penguingim1', 'AnishGiri', 'DanielNaroditsky', 'opperwezen',
  'Fins', 'Polish_fighter3000', 'howitzer14', 'lachesisQ',
  'TemurKuybokarov', 'Msb2', 'Zhigalko_Sergei', 'chaborak',
  'Alireza2003', 'FerdinandPorsche', 'realDonaldDuck',
];

const CHESSCOM_ELITE_PLAYERS = [
  'MagnusCarlsen', 'Hikaru', 'FabianoCaruana', 'LevonAronian',
  'GarryKasparov', 'DanielNaroditsky', 'GothamChess', 'AnishGiri',
  'WesleySo', 'Firouzja2003', 'NihalSarin', 'Naroditsky',
  'MVL_Chess', 'Alireza_Firouz', 'lachesisQ', 'DominguezPerez',
];

// ================ UTILITY FUNCTIONS ================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * v6.96-LOCAL: Generate hybrid prediction using PRE-COMPUTED local Stockfish eval
 * This avoids calling the cloud API which causes 429 rate limit errors
 */
async function generateLocalHybridPrediction(
  pgn: string,
  stockfishEval: number,
  stockfishDepth: number
): Promise<{
  prediction: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
  archetype: string;
}> {
  try {
    // Import simulation dynamically to avoid circular deps
    const { simulateGame } = await import('./gameSimulator');
    const { extractColorFlowSignature, predictFromColorFlow } = await import('./colorFlowAnalysis');
    
    const simulation = simulateGame(pgn);
    const colorSignature = extractColorFlowSignature(simulation.board, simulation.gameData, simulation.totalMoves);
    const colorPrediction = predictFromColorFlow(colorSignature, simulation.totalMoves);
    
    // Combine Stockfish eval with Color Flow prediction
    const sfPred = evalToPrediction(stockfishEval);
    const archetype = colorSignature.archetype || 'UNKNOWN';
    
    // Color flow predicted winner (from ColorFlowPrediction type)
    const colorPredictionStr = 
      colorPrediction.predictedWinner === 'white' ? 'white_wins' :
      colorPrediction.predictedWinner === 'black' ? 'black_wins' : 'draw';
    
    // Fuse: If both agree, high confidence. If disagree, use SF with reduced confidence.
    if (sfPred.prediction === colorPredictionStr) {
      return {
        prediction: sfPred.prediction,
        confidence: Math.min(98, sfPred.confidence + 10),
        archetype,
      };
    } else {
      // Stockfish has priority but lower confidence when Color Flow disagrees
      return {
        prediction: sfPred.prediction,
        confidence: Math.max(35, sfPred.confidence - 15),
        archetype,
      };
    }
  } catch (err) {
    console.warn('[v6.96-LOCAL] Hybrid fallback to SF-only:', err);
    const sfPred = evalToPrediction(stockfishEval);
    return {
      prediction: sfPred.prediction,
      confidence: sfPred.confidence,
      archetype: 'FALLBACK',
    };
  }
}

function evalToPrediction(cp: number): { prediction: 'white_wins' | 'black_wins' | 'draw'; confidence: number } {
  if (cp > 50) {
    return { prediction: 'white_wins', confidence: Math.min(95, 50 + Math.abs(cp) / 8) };
  } else if (cp < -50) {
    return { prediction: 'black_wins', confidence: Math.min(95, 50 + Math.abs(cp) / 8) };
  } else if (cp > 15) {
    return { prediction: 'white_wins', confidence: 40 + Math.abs(cp) };
  } else if (cp < -15) {
    return { prediction: 'black_wins', confidence: 40 + Math.abs(cp) };
  } else {
    return { prediction: 'draw', confidence: 35 + (15 - Math.abs(cp)) * 2 };
  }
}

// ================ GAME FETCHERS ================

interface UnifiedGame {
  id: string;
  name: string;
  pgn: string;
  result: 'white_wins' | 'black_wins' | 'draw';
  source: 'lichess' | 'chesscom';
  rating: number;
}

async function fetchLichessGamesForPool(
  count: number,
  existingIds: Set<string>,
  batchNumber: number,
  onProgress?: (msg: string) => void
): Promise<UnifiedGame[]> {
  const games: UnifiedGame[] = [];
  const shuffledPlayers = shuffleArray([...LICHESS_ELITE_PLAYERS]);
  
  // v6.92: Use batch-based window isolation
  const now = Date.now();
  const dataRichEpoch = new Date('2018-01-01').getTime();
  const primeOffsets = [17, 37, 53, 71, 89, 97];
  const yearOffset = primeOffsets[batchNumber % primeOffsets.length];
  const monthOffset = primeOffsets[(batchNumber + 1) % primeOffsets.length];
  
  const baseYear = 2018 + (yearOffset % 7); // 2018-2024
  const baseMonth = (monthOffset % 12);
  const windowStart = new Date(baseYear, baseMonth, 1).getTime();
  const windowEnd = Math.min(now, windowStart + 90 * 24 * 60 * 60 * 1000);
  
  onProgress?.(`[Lichess] Batch ${batchNumber}: Window ${new Date(windowStart).toISOString().slice(0,7)}`);
  
  for (const player of shuffledPlayers.slice(0, 5)) {
    if (games.length >= count) break;
    
    try {
      const result = await fetchLichessGames(player, {
        max: 20,
        since: windowStart,
        until: windowEnd,
        rated: true,
        opening: true,
        moves: true,
        pgnInJson: true,
      });
      
      for (const game of result.games) {
        if (games.length >= count) break;
        if (existingIds.has(game.id)) continue;
        
        const moveCount = game.moves?.split(' ').length || 0;
        if (moveCount < 20) continue;
        
        const pgn = lichessGameToPgn(game);
        const whiteName = game.players.white.user?.name || 'Anon';
        const blackName = game.players.black.user?.name || 'Anon';
        const whiteRating = game.players.white.rating || 2000;
        const blackRating = game.players.black.rating || 2000;
        
        games.push({
          id: game.id,
          name: `${whiteName} (${whiteRating}) vs ${blackName} (${blackRating})`,
          pgn,
          result: game.winner === 'white' ? 'white_wins' : 
                 game.winner === 'black' ? 'black_wins' : 'draw',
          source: 'lichess',
          rating: Math.max(whiteRating, blackRating),
        });
      }
      
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`[v6.92] Lichess fetch failed for ${player}:`, err);
    }
  }
  
  return shuffleArray(games);
}

async function fetchChessComGamesForPool(
  count: number,
  existingIds: Set<string>,
  batchNumber: number,
  onProgress?: (msg: string) => void
): Promise<UnifiedGame[]> {
  const games: UnifiedGame[] = [];
  const shuffledPlayers = shuffleArray([...CHESSCOM_ELITE_PLAYERS]);
  
  // v6.92: Use batch-based archive offset
  const monthOffset = (batchNumber * 3) % 24; // 0, 3, 6, ... months back
  
  onProgress?.(`[Chess.com] Batch ${batchNumber}: Archive offset ${monthOffset} months`);
  
  for (const player of shuffledPlayers.slice(0, 3)) {
    if (games.length >= count) break;
    
    try {
      const result = await fetchChessComGames(player, {
        max: 20,
        months: 3,
        monthOffset,
      });
      
      for (const game of result.games) {
        if (games.length >= count) break;
        
        // Extract game ID from URL
        const urlMatch = game.url.match(/\/game\/live\/(\d+)/);
        const gameId = urlMatch ? `cc_${urlMatch[1]}` : `cc_${game.end_time}`;
        
        if (existingIds.has(gameId)) continue;
        if (!game.pgn || game.pgn.length < 100) continue;
        
        const result = game.white.result === 'win' ? 'white_wins' :
                      game.black.result === 'win' ? 'black_wins' : 'draw';
        
        games.push({
          id: gameId,
          name: `${game.white.username} (${game.white.rating}) vs ${game.black.username} (${game.black.rating})`,
          pgn: game.pgn,
          result,
          source: 'chesscom',
          rating: Math.max(game.white.rating, game.black.rating),
        });
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`[v6.92] Chess.com fetch failed for ${player}:`, err);
    }
  }
  
  return shuffleArray(games);
}

// ================ ANALYSIS FUNCTIONS ================

/**
 * v6.94-BULLETPROOF: Always use LOCAL Stockfish for guaranteed results
 * Cloud API is OPTIONAL enhancement only - pipeline works without it
 */
async function analyzeWithLocalStockfish(
  game: UnifiedGame,
  movesToPlay: number,
  config: PoolConfig
): Promise<{ eval: number; depth: number; nodes?: number; mode: string } | null> {
  const chess = new Chess();
  
  try {
    chess.loadPgn(game.pgn);
  } catch {
    console.warn(`[v6.94] PGN parse failed for ${game.id}`);
    return null;
  }
  
  const history = chess.history();
  if (history.length < movesToPlay) {
    return null;
  }
  
  chess.reset();
  for (let i = 0; i < movesToPlay; i++) {
    chess.move(history[i]);
  }
  
  const fen = chess.fen();
  
  try {
    const engine = getStockfishEngine();
    
    // Health check with timeout
    const readyTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Engine ready timeout')), 15000)
    );
    
    try {
      await Promise.race([engine.waitReady(), readyTimeout]);
    } catch (readyErr) {
      console.warn(`[v6.94] Engine not ready, attempting recovery...`);
      terminateStockfish();
      await new Promise(r => setTimeout(r, 2000));
      const newEngine = getStockfishEngine();
      await newEngine.waitReady();
    }
    
    // Analysis with timeout
    const analysisTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Analysis timeout after ${config.analysisTimeout}ms`)), config.analysisTimeout)
    );
    
    const analysis = await Promise.race([
      engine.analyzePosition(fen, { 
        depth: config.localDepth,
        nodes: config.localNodes,
      }),
      analysisTimeout,
    ]);
    
    return {
      eval: analysis.evaluation.score,
      depth: analysis.evaluation.depth,
      nodes: analysis.evaluation.nodes,
      mode: config.stockfishMode,
    };
  } catch (err) {
    console.error(`[v6.94] Analysis failed for ${game.id}:`, err);
    
    // Try to recover engine for next game
    try {
      const engine = getStockfishEngine();
      engine.stop();
      await new Promise(r => setTimeout(r, 1000));
    } catch {}
    
    return null;
  }
}

// Legacy wrapper for backward compatibility
async function analyzeWithCloudPool(
  game: UnifiedGame,
  movesToPlay: number,
  config: PoolConfig
): Promise<{ eval: number; depth: number; nodes?: number } | null> {
  // v6.94: Route to local Stockfish - cloud is unreliable
  const result = await analyzeWithLocalStockfish(game, movesToPlay, CLOUD_POOL_CONFIG);
  return result ? { eval: result.eval, depth: result.depth, nodes: result.nodes } : null;
}

async function analyzeWithLocalPool(
  game: UnifiedGame,
  movesToPlay: number,
  config: PoolConfig
): Promise<{ eval: number; depth: number; nodes?: number } | null> {
  const result = await analyzeWithLocalStockfish(game, movesToPlay, config);
  return result ? { eval: result.eval, depth: result.depth, nodes: result.nodes } : null;
}

// ================ MAIN PIPELINE FUNCTIONS ================

export async function runCloudPoolBatch(
  targetCount: number,
  batchNumber: number,
  onProgress?: (status: string, progress: number, prediction?: PoolPrediction) => void
): Promise<PoolPrediction[]> {
  const predictions: PoolPrediction[] = [];
  const config = CLOUD_POOL_CONFIG;
  
  onProgress?.(`[${config.name}] Starting batch ${batchNumber}...`, 0);
  
  // Load existing game IDs
  const existingData = await getAlreadyAnalyzedData();
  const existingIds = existingData.gameIds;
  
  // Fetch games from both sources
  const lichessGames = await fetchLichessGamesForPool(
    Math.ceil(targetCount * 0.7), 
    existingIds, 
    batchNumber,
    (msg) => onProgress?.(msg, 5)
  );
  
  const chesscomGames = await fetchChessComGamesForPool(
    Math.ceil(targetCount * 0.3), 
    existingIds, 
    batchNumber,
    (msg) => onProgress?.(msg, 10)
  );
  
  const allGames = shuffleArray([...lichessGames, ...chesscomGames]);
  
  if (allGames.length === 0) {
    onProgress?.(`[${config.name}] No fresh games found`, 100);
    return [];
  }
  
  onProgress?.(`[${config.name}] Processing ${allGames.length} games...`, 15);
  
  let processed = 0;
  for (const game of allGames) {
    if (predictions.length >= targetCount) break;
    
    const startTime = Date.now();
    const movesToPlay = 15 + Math.floor(Math.random() * 20); // 15-35
    
    try {
      const sfResult = await analyzeWithCloudPool(game, movesToPlay, config);
      if (!sfResult) {
        processed++;
        continue;
      }
      
      // Get position for hybrid analysis
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      const history = chess.history();
      chess.reset();
      for (let i = 0; i < movesToPlay; i++) {
        chess.move(history[i]);
      }
      const fen = chess.fen();
      const truncatedPgn = chess.pgn();
      
      // v6.96-LOCAL: Use local hybrid prediction (no cloud API)
      const hybridResult = await generateLocalHybridPrediction(truncatedPgn, sfResult.eval, sfResult.depth);
      
      const sfPrediction = evalToPrediction(sfResult.eval);
      
      const prediction: PoolPrediction = {
        gameId: game.id,
        gameName: game.name,
        moveNumber: movesToPlay,
        fen,
        pgn: truncatedPgn,
        stockfishEval: sfResult.eval,
        stockfishDepth: sfResult.depth,
        stockfishMode: 'local', // v6.96: Always local now
        stockfishNodes: sfResult.nodes,
        stockfishPrediction: sfPrediction.prediction,
        stockfishConfidence: sfPrediction.confidence,
        hybridPrediction: hybridResult.prediction,
        hybridConfidence: hybridResult.confidence,
        hybridArchetype: hybridResult.archetype,
        actualResult: game.result,
        stockfishCorrect: sfPrediction.prediction === game.result,
        hybridCorrect: hybridResult.prediction === game.result,
        dataSource: game.source,
        poolName: config.name,
        analysisTimeMs: Date.now() - startTime,
      };
      
      predictions.push(prediction);
      processed++;
      
      const progress = 15 + (processed / allGames.length) * 85;
      onProgress?.(`[${config.name}] ${predictions.length}/${targetCount} analyzed`, progress, prediction);
      
      // Add to existing IDs to prevent re-analysis
      existingIds.add(game.id);
      
      await new Promise(r => setTimeout(r, config.delayBetweenGames));
      
    } catch (err) {
      console.error(`[${config.name}] Error processing ${game.id}:`, err);
      processed++;
    }
  }
  
  onProgress?.(`[${config.name}] Completed: ${predictions.length} predictions`, 100);
  return predictions;
}

export async function runLocalPoolBatch(
  targetCount: number,
  batchNumber: number,
  onProgress?: (status: string, progress: number, prediction?: PoolPrediction) => void
): Promise<PoolPrediction[]> {
  const predictions: PoolPrediction[] = [];
  const config = LOCAL_POOL_CONFIG;
  
  onProgress?.(`[${config.name}] Starting batch ${batchNumber}...`, 0);
  
  // Load existing game IDs
  const existingData = await getAlreadyAnalyzedData();
  const existingIds = existingData.gameIds;
  
  // Fetch games - prefer Lichess for local analysis
  const games = await fetchLichessGamesForPool(
    targetCount * 3, // Fetch extra for filtering
    existingIds, 
    batchNumber + 100, // Different window than cloud pool
    (msg) => onProgress?.(msg, 5)
  );
  
  if (games.length === 0) {
    onProgress?.(`[${config.name}] No fresh games found`, 100);
    return [];
  }
  
  onProgress?.(`[${config.name}] Deep analyzing ${Math.min(games.length, targetCount)} games...`, 10);
  
  let processed = 0;
  for (const game of games) {
    if (predictions.length >= targetCount) break;
    
    const startTime = Date.now();
    const movesToPlay = 15 + Math.floor(Math.random() * 20);
    
    const progressBase = 10 + (processed / targetCount) * 90;
    onProgress?.(`[${config.name}] Deep analyzing: ${game.name}`, progressBase);
    
    try {
      const sfResult = await analyzeWithLocalPool(game, movesToPlay, config);
      if (!sfResult) {
        processed++;
        continue;
      }
      
      // Get position for hybrid analysis
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      const history = chess.history();
      chess.reset();
      for (let i = 0; i < movesToPlay; i++) {
        chess.move(history[i]);
      }
      const fen = chess.fen();
      const truncatedPgn = chess.pgn();
      
      // v6.96-LOCAL: Use local hybrid prediction (no cloud API)
      const hybridResult = await generateLocalHybridPrediction(truncatedPgn, sfResult.eval, sfResult.depth);
      
      const sfPrediction = evalToPrediction(sfResult.eval);
      
      const prediction: PoolPrediction = {
        gameId: game.id,
        gameName: game.name,
        moveNumber: movesToPlay,
        fen,
        pgn: truncatedPgn,
        stockfishEval: sfResult.eval,
        stockfishDepth: sfResult.depth,
        stockfishMode: 'local',
        stockfishNodes: sfResult.nodes,
        stockfishPrediction: sfPrediction.prediction,
        stockfishConfidence: sfPrediction.confidence,
        hybridPrediction: hybridResult.prediction,
        hybridConfidence: hybridResult.confidence,
        hybridArchetype: hybridResult.archetype,
        actualResult: game.result,
        stockfishCorrect: sfPrediction.prediction === game.result,
        hybridCorrect: hybridResult.prediction === game.result,
        dataSource: game.source,
        poolName: config.name,
        analysisTimeMs: Date.now() - startTime,
      };
      
      predictions.push(prediction);
      processed++;
      
      console.log(`[${config.name}] Deep analysis complete: ${game.name} (${Math.round((Date.now() - startTime) / 1000)}s)`);
      onProgress?.(`[${config.name}] ${predictions.length}/${targetCount} deep analyzed`, progressBase + 5, prediction);
      
      existingIds.add(game.id);
      
      await new Promise(r => setTimeout(r, config.delayBetweenGames));
      
    } catch (err) {
      console.error(`[${config.name}] Error processing ${game.id}:`, err);
      processed++;
    }
  }
  
  onProgress?.(`[${config.name}] Completed: ${predictions.length} deep predictions`, 100);
  return predictions;
}

// ================ PERSISTENCE ================

export async function savePoolPredictions(
  predictions: PoolPrediction[],
  poolName: string
): Promise<string | null> {
  if (predictions.length === 0) return null;
  
  const runId = `pool-${poolName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  try {
    // Calculate stats
    const sfCorrect = predictions.filter(p => p.stockfishCorrect).length;
    const hybridCorrect = predictions.filter(p => p.hybridCorrect).length;
    
    // Save benchmark result
    const { data: benchmarkData, error: benchmarkError } = await supabase
      .from('chess_benchmark_results')
      .insert({
        run_id: runId,
        data_source: 'dual_pool_pipeline',
        total_games: predictions.length,
        completed_games: predictions.length,
        prediction_move_number: 25, // Average
        stockfish_accuracy: (sfCorrect / predictions.length) * 100,
        hybrid_accuracy: (hybridCorrect / predictions.length) * 100,
        stockfish_wins: predictions.filter(p => p.stockfishCorrect && !p.hybridCorrect).length,
        hybrid_wins: predictions.filter(p => p.hybridCorrect && !p.stockfishCorrect).length,
        both_correct: predictions.filter(p => p.stockfishCorrect && p.hybridCorrect).length,
        both_wrong: predictions.filter(p => !p.stockfishCorrect && !p.hybridCorrect).length,
        stockfish_version: poolName === 'LOCAL-DEEP' ? 'Stockfish 17 NNUE Local D30' : 'Lichess Cloud SF17',
        stockfish_mode: poolName.toLowerCase(),
        hybrid_version: `En Pensent v6.92 (${poolName})`,
        data_quality_tier: 'dual_pool',
        games_analyzed: predictions.map(p => p.gameName),
      })
      .select('id')
      .single();
    
    if (benchmarkError) {
      console.error(`[v6.92] Failed to save benchmark:`, benchmarkError);
      return null;
    }
    
    const benchmarkId = benchmarkData.id;
    
    // Save individual predictions
    const attempts = predictions.map(p => ({
      benchmark_id: benchmarkId,
      game_id: p.gameId,
      game_name: p.gameName,
      move_number: p.moveNumber,
      fen: p.fen,
      pgn: p.pgn,
      stockfish_eval: p.stockfishEval,
      stockfish_depth: p.stockfishDepth,
      stockfish_prediction: p.stockfishPrediction,
      stockfish_confidence: p.stockfishConfidence,
      hybrid_prediction: p.hybridPrediction,
      hybrid_confidence: p.hybridConfidence,
      hybrid_archetype: p.hybridArchetype,
      actual_result: p.actualResult,
      stockfish_correct: p.stockfishCorrect,
      hybrid_correct: p.hybridCorrect,
      position_hash: hashPosition(p.fen),
      data_source: p.dataSource,
      data_quality_tier: 'dual_pool',
    }));
    
    // Batch insert
    const BATCH_SIZE = 25;
    for (let i = 0; i < attempts.length; i += BATCH_SIZE) {
      const batch = attempts.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('chess_prediction_attempts')
        .insert(batch);
      
      if (error) {
        console.error(`[v6.92] Batch ${i / BATCH_SIZE + 1} failed:`, error);
      }
    }
    
    console.log(`[v6.92] Saved ${predictions.length} predictions to run ${runId}`);
    return runId;
    
  } catch (err) {
    console.error(`[v6.92] Save failed:`, err);
    return null;
  }
}

// ================ MAIN DUAL-POOL RUNNER ================

export async function runDualPoolPipeline(
  options: {
    cloudTarget?: number;
    localTarget?: number;
    runCloud?: boolean;
    runLocal?: boolean;
  } = {},
  onProgress?: (status: string, cloudProgress: PoolProgress, localProgress: PoolProgress) => void
): Promise<DualPoolResult> {
  const {
    cloudTarget = 100,
    localTarget = 5,
    runCloud = true,
    runLocal = true,
  } = options;
  
  const result: DualPoolResult = {
    cloudPool: [],
    localPool: [],
    totalProcessed: 0,
    cloudAccuracy: { stockfish: 0, hybrid: 0 },
    localAccuracy: { stockfish: 0, hybrid: 0 },
    startedAt: new Date(),
  };
  
  const cloudProgress: PoolProgress = {
    poolName: 'CLOUD-VOLUME',
    completed: 0,
    target: cloudTarget,
    gamesPerHour: 0,
    lastGameTime: Date.now(),
    status: 'running',
  };
  
  const localProgress: PoolProgress = {
    poolName: 'LOCAL-DEEP',
    completed: 0,
    target: localTarget,
    gamesPerHour: 0,
    lastGameTime: Date.now(),
    status: 'running',
  };
  
  const batchNumber = Math.floor(Date.now() / 3600000); // Hour-based batch
  
  // Run pools sequentially for stability (can be parallelized if needed)
  if (runCloud) {
    cloudProgress.status = 'running';
    onProgress?.('Running cloud pool...', cloudProgress, localProgress);
    
    const cloudPredictions = await runCloudPoolBatch(
      cloudTarget,
      batchNumber,
      (status, progress, prediction) => {
        if (prediction) {
          cloudProgress.completed++;
          cloudProgress.lastGameTime = Date.now();
        }
        onProgress?.(status, cloudProgress, localProgress);
      }
    );
    
    result.cloudPool = cloudPredictions;
    cloudProgress.completed = cloudPredictions.length;
    cloudProgress.status = 'completed';
    
    // Calculate accuracy
    if (cloudPredictions.length > 0) {
      result.cloudAccuracy.stockfish = (cloudPredictions.filter(p => p.stockfishCorrect).length / cloudPredictions.length) * 100;
      result.cloudAccuracy.hybrid = (cloudPredictions.filter(p => p.hybridCorrect).length / cloudPredictions.length) * 100;
    }
    
    // Save cloud predictions
    await savePoolPredictions(cloudPredictions, 'CLOUD-VOLUME');
  }
  
  if (runLocal) {
    localProgress.status = 'running';
    onProgress?.('Running local deep pool...', cloudProgress, localProgress);
    
    const localPredictions = await runLocalPoolBatch(
      localTarget,
      batchNumber,
      (status, progress, prediction) => {
        if (prediction) {
          localProgress.completed++;
          localProgress.lastGameTime = Date.now();
        }
        onProgress?.(status, cloudProgress, localProgress);
      }
    );
    
    result.localPool = localPredictions;
    localProgress.completed = localPredictions.length;
    localProgress.status = 'completed';
    
    // Calculate accuracy
    if (localPredictions.length > 0) {
      result.localAccuracy.stockfish = (localPredictions.filter(p => p.stockfishCorrect).length / localPredictions.length) * 100;
      result.localAccuracy.hybrid = (localPredictions.filter(p => p.hybridCorrect).length / localPredictions.length) * 100;
    }
    
    // Save local predictions
    await savePoolPredictions(localPredictions, 'LOCAL-DEEP');
  }
  
  result.totalProcessed = result.cloudPool.length + result.localPool.length;
  result.completedAt = new Date();
  
  onProgress?.(`Pipeline complete: ${result.totalProcessed} total predictions`, cloudProgress, localProgress);
  
  return result;
}

export default runDualPoolPipeline;
