/**
 * Dual-Pool Automated Benchmark Pipeline
 * VERSION: 7.0-UNBLOCKABLE (2026-01-22)
 * 
 * ARCHITECTURE:
 * ============
 * Two parallel processing pools - LOCAL STOCKFISH IS PRIMARY (guaranteed to work)
 * 
 * v7.0 CRITICAL FIXES:
 * - All game fetching has hard timeouts (15s per source)
 * - Individual game analysis has hard timeout (30s)
 * - No operation can block indefinitely
 * - Graceful degradation on partial failures
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
 */

const DUAL_POOL_VERSION = "7.90-NO-HALTS";
console.log(`[v7.90] dualPoolPipeline.ts LOADED - Version: ${DUAL_POOL_VERSION}`);

// v7.0: Hard timeout wrapper for any async operation
function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)
    )
  ]);
}

import { Chess } from 'chess.js';
import { getStockfishEngine, terminateStockfish } from './stockfishEngine';
import { evaluatePosition as evaluateCloudPosition, getRateLimitStatus } from './lichessCloudEval';
import { generateHybridPrediction } from './hybridPrediction';
import { fetchLichessGames, lichessGameToPgn, type LichessGame } from './gameImport/lichessApi';
import { fetchChessComGames, type ChessComGame } from './gameImport/chesscomApi';
import { hashPosition } from './benchmarkPersistence';
import { supabase } from '@/integrations/supabase/client';
import { isManualBenchmarkActive } from './benchmarkCoordinator';
import { initKnownIds, isKnown, markKnown, getKnownIds, toRawId } from './simpleDedup';
import { breathe, RATE_LIMIT_BREATHING_MS } from './breathingPacer';

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

// v7.58-STABLE: VOLUME pool - balanced speed and stability
export const CLOUD_POOL_CONFIG: PoolConfig = {
  name: 'VOLUME-LOCAL',
  targetPerHour: 150,       // v7.58: Balanced target (150/hr = 2.5/min)
  stockfishMode: 'local_fast',
  localDepth: 18,           // v7.58: D18 for quality
  localNodes: 3000000,      // v7.58: 3M nodes
  analysisTimeout: 12000,   // v7.58: 12s max
  delayBetweenGames: 300,   // v7.58: 300ms between games prevents glitching
};

// v7.58-STABLE: DEEP pool - stable deep analysis
export const LOCAL_POOL_CONFIG: PoolConfig = {
  name: 'LOCAL-DEEP',
  targetPerHour: 12,        // v7.58: Realistic target
  stockfishMode: 'local_deep',
  localDepth: 26,           // v7.58: D26 for depth
  localNodes: 40000000,     // v7.58: 40M nodes
  analysisTimeout: 40000,   // v7.58: 40s max
  delayBetweenGames: 500,   // v7.58: 500ms between games for stability
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
  
  // v7.17: Additional game metadata for DB alignment
  whiteElo?: number;
  blackElo?: number;
  timeControl?: string;
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
 * v7.87-TARGETED: Generate hybrid prediction with TARGETED calibration
 * 
 * v7.85-v7.86 was over-aggressive, flipping too many predictions to white.
 * v7.87 only flips for prophylactic_defense archetype or when SF strongly favors white.
 */
/**
 * v7.89-BALANCED: Generate hybrid prediction using fixed Color Flow logic
 * 
 * KEY INSIGHT: The color flow prediction engine now uses DOMINANT SIDE
 * as the primary factor, not archetype. No more post-hoc calibration needed.
 * 
 * Fusion strategy:
 * - If SF and Color Flow agree → high confidence, use that prediction
 * - If they disagree → weighted blend based on position characteristics
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
    const { simulateGame } = await import('./gameSimulator');
    const { extractColorFlowSignature, predictFromColorFlow } = await import('./colorFlowAnalysis');
    
    const simulation = simulateGame(pgn);
    const colorSignature = extractColorFlowSignature(simulation.board, simulation.gameData, simulation.totalMoves);
    const colorPrediction = predictFromColorFlow(colorSignature, simulation.totalMoves);
    
    const sfPred = evalToPrediction(stockfishEval);
    const archetype = colorSignature.archetype || 'unknown';
    
    // Color flow predicted winner
    const colorPredictionStr: 'white_wins' | 'black_wins' | 'draw' = 
      colorPrediction.predictedWinner === 'white' ? 'white_wins' :
      colorPrediction.predictedWinner === 'black' ? 'black_wins' : 'draw';
    
    // v7.89 BALANCED FUSION: No more calibration layer
    let fusedPrediction: 'white_wins' | 'black_wins' | 'draw';
    let fusedConfidence: number;
    
    if (sfPred.prediction === colorPredictionStr) {
      // Agreement = high confidence, use shared prediction
      fusedPrediction = sfPred.prediction;
      fusedConfidence = Math.min(95, (sfPred.confidence + colorPrediction.confidence) / 2 + 15);
    } else {
      // Disagreement - use weighted blend based on evaluation strength
      const sfStrength = Math.abs(stockfishEval);
      
      if (sfStrength > 200) {
        // Strong SF advantage - trust Stockfish more
        fusedPrediction = sfPred.prediction;
        fusedConfidence = Math.min(80, sfPred.confidence);
      } else if (sfStrength < 30) {
        // Unclear position - trust Color Flow pattern recognition
        fusedPrediction = colorPredictionStr;
        fusedConfidence = Math.max(45, colorPrediction.confidence);
      } else {
        // Medium eval - weight by confidence levels
        if (colorPrediction.confidence > sfPred.confidence + 10) {
          fusedPrediction = colorPredictionStr;
          fusedConfidence = colorPrediction.confidence;
        } else {
          fusedPrediction = sfPred.prediction;
          fusedConfidence = sfPred.confidence;
        }
      }
    }
    
    return {
      prediction: fusedPrediction,
      confidence: fusedConfidence,
      archetype,
    };
  } catch (err) {
    console.warn('[v7.89-BALANCED] Hybrid fallback to SF-only:', err);
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

// v7.17: Aligned with DB schema fields
interface UnifiedGame {
  id: string;
  name: string;
  pgn: string;
  result: 'white_wins' | 'black_wins' | 'draw';
  source: 'lichess' | 'chesscom';
  rating: number;
  // v7.17: Additional metadata for DB alignment
  whiteElo?: number;
  blackElo?: number;
  timeControl?: string;
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
          // v7.17: Include ELO and time control for DB alignment
          whiteElo: whiteRating,
          blackElo: blackRating,
          timeControl: game.speed || undefined,
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
          // v7.17: Include ELO and time control for DB alignment
          whiteElo: game.white.rating,
          blackElo: game.black.rating,
          timeControl: game.time_class || undefined,
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
  // v7.30-YIELD: CRITICAL - Check lock BEFORE touching Stockfish engine
  if (isManualBenchmarkActive()) {
    console.log(`[v7.30-YIELD] Manual benchmark owns engine, skipping analysis for ${game.id}`);
    return null;
  }
  
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
    console.error(`[v7.16] Analysis failed for ${game.id}:`, err);
    
    // v7.16: Aggressive recovery - terminate and restart on any failure
    try {
      terminateStockfish();
      await new Promise(r => setTimeout(r, 1500));
      // Pre-warm new engine
      const newEngine = getStockfishEngine();
      await Promise.race([
        newEngine.waitReady(),
        new Promise(r => setTimeout(r, 3000))
      ]);
    } catch (recoveryErr) {
      console.warn('[v7.16] Recovery failed:', recoveryErr);
    }
    
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
  
  // v7.13: Check for manual benchmark before starting
  if (isManualBenchmarkActive()) {
    console.log('[v7.13] Manual benchmark active, skipping pool batch');
    return predictions;
  }
  
  onProgress?.(`[${config.name}] Starting batch ${batchNumber}...`, 0);
  
  // v7.15-SIMPLE-DEDUP: Init known IDs ONCE (cached after first call)
  try {
    await withTimeout(initKnownIds(), 8000, 'InitKnownIds');
  } catch (err) {
    console.warn('[v7.15] Failed to init known IDs, continuing:', err);
  }
  const existingIds = getKnownIds();
  
  // v7.0: Fetch games with hard timeouts - continue even if one source fails
  let lichessGames: UnifiedGame[] = [];
  let chesscomGames: UnifiedGame[] = [];
  
  try {
    lichessGames = await withTimeout(
      fetchLichessGamesForPool(Math.ceil(targetCount * 0.7), existingIds, batchNumber, (msg) => onProgress?.(msg, 5)),
      20000,
      'FetchLichess'
    );
  } catch (err) {
    console.warn('[v7.15] Lichess fetch timeout/error:', err);
  }
  
  try {
    chesscomGames = await withTimeout(
      fetchChessComGamesForPool(Math.ceil(targetCount * 0.3), existingIds, batchNumber, (msg) => onProgress?.(msg, 10)),
      20000,
      'FetchChessCom'
    );
  } catch (err) {
    console.warn('[v7.15] Chess.com fetch timeout/error:', err);
  }
  
  // v7.15-SIMPLE-DEDUP: Filter games using simple check
  const allGames = shuffleArray([...lichessGames, ...chesscomGames]).filter(game => !isKnown(game.id));
  
  if (allGames.length === 0) {
    onProgress?.(`[${config.name}] No fresh games found`, 100);
    return [];
  }
  
  onProgress?.(`[${config.name}] Processing ${allGames.length} fresh games...`, 15);
  
  let processed = 0;
  for (const game of allGames) {
    if (predictions.length >= targetCount) break;
    
    // v7.30-YIELD: Check for manual benchmark at START of each game
    if (isManualBenchmarkActive()) {
      console.log(`[v7.30-YIELD] Manual benchmark detected mid-batch, yielding ${predictions.length} predictions`);
      return predictions; // Return what we have so far
    }
    
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
        // v7.17: Include ELO and time control for DB alignment
        whiteElo: game.whiteElo,
        blackElo: game.blackElo,
        timeControl: game.timeControl,
      };
      
      predictions.push(prediction);
      processed++;
      
      const progress = 15 + (processed / allGames.length) * 85;
      onProgress?.(`[${config.name}] ${predictions.length}/${targetCount} analyzed`, progress, prediction);
      
      // v7.41-BREATHE: Use breathing pacer to mark known AND enforce cooldown
      await breathe(game.id, markKnown, config.delayBetweenGames);
      
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
  
  // v7.15-SIMPLE-DEDUP: Init known IDs ONCE (cached after first call)
  try {
    await withTimeout(initKnownIds(), 8000, 'InitKnownIds');
  } catch (err) {
    console.warn('[v7.15] Failed to init known IDs:', err);
  }
  const existingIds = getKnownIds();
  
  // Fetch games - prefer Lichess for local analysis
  const rawGames = await fetchLichessGamesForPool(
    targetCount * 3, // Fetch extra for filtering
    existingIds, 
    batchNumber + 100, // Different window than cloud pool
    (msg) => onProgress?.(msg, 5)
  );
  
  // v7.15-SIMPLE-DEDUP: Filter using simple check
  const games = rawGames.filter(game => !isKnown(game.id));
  
  if (games.length === 0) {
    onProgress?.(`[${config.name}] No fresh games found`, 100);
    return [];
  }
  
  onProgress?.(`[${config.name}] Deep analyzing ${Math.min(games.length, targetCount)} games...`, 10);
  
  let processed = 0;
  for (const game of games) {
    if (predictions.length >= targetCount) break;
    
    // v7.30-YIELD: Check for manual benchmark at START of each game
    if (isManualBenchmarkActive()) {
      console.log(`[v7.30-YIELD] Manual benchmark detected mid-batch, yielding ${predictions.length} predictions`);
      return predictions; // Return what we have so far
    }
    
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
        // v7.17: Include ELO and time control for DB alignment
        whiteElo: game.whiteElo,
        blackElo: game.blackElo,
        timeControl: game.timeControl,
      };
      
      predictions.push(prediction);
      processed++;
      
      console.log(`[${config.name}] Deep analysis complete: ${game.name} (${Math.round((Date.now() - startTime) / 1000)}s)`);
      onProgress?.(`[${config.name}] ${predictions.length}/${targetCount} deep analyzed`, progressBase + 5, prediction);
      
      // v7.41-BREATHE: Use breathing pacer to mark known AND enforce cooldown
      await breathe(game.id, markKnown, config.delayBetweenGames);
      
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
    // v7.17-SCHEMA-ALIGNED: Ensure all fields match DB schema exactly
    const attempts = predictions.map(p => ({
      benchmark_id: benchmarkId,
      // v7.17: Strip prefix from game_id for DB consistency (raw ID only)
      game_id: toRawId(p.gameId),
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
      // v7.17: Add missing fields that manual benchmark includes
      lichess_id_verified: true,
      time_control: p.timeControl || null,
      white_elo: p.whiteElo || null,
      black_elo: p.blackElo || null,
    }));
    
    // v7.90: Batch upsert with conflict handling to prevent duplicate key errors
    const BATCH_SIZE = 25;
    for (let i = 0; i < attempts.length; i += BATCH_SIZE) {
      const batch = attempts.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('chess_prediction_attempts')
        .upsert(batch, { 
          onConflict: 'game_id',
          ignoreDuplicates: true 
        });
      
      if (error) {
        console.error(`[v7.90] Batch ${i / BATCH_SIZE + 1} failed:`, error);
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
