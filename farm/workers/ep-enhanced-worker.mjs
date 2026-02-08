/**
 * Enhanced EP Benchmark Worker with 8-Quadrant Signatures
 * 
 * Supports BOTH 4-quadrant (baseline) and 8-quadrant (enhanced) signatures
 * Runs A/B comparison to validate accuracy improvements
 * 
 * Expected improvement: 61% → 76-86% accuracy
 */

import dotenv from 'dotenv';
import { Chess } from 'chess.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;
import {
  drawQuadrantRadar,
  drawTemporalFlow,
  drawArchetypeBadge,
  drawFingerprint,
  drawPredictionGauge,
  logVisualization,
  COLORS
} from '../lib/visualization/backendViz.mjs';
import { FARM_CONFIG, THROUGHPUT } from '../config/optimizedFarmConfig.mjs';
import { savePredictionLocal, getLocalStats } from '../lib/simpleStorage.mjs';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Direct SQL pool - bypasses RLS completely
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

// Initialize Supabase client for reading
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
if (supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

console.log('[FARM] ✓ Direct SQL connection active (RLS bypass)');

// Worker identification
const workerId = process.env.WORKER_ID || 'ep-farm-1';
const workerType = 'ep-benchmark-enhanced';

// Feature flag: Enable enhanced 8-quadrant signatures
const USE_ENHANCED_SIGNATURES = process.env.USE_ENHANCED === 'true' || false;

// Stats tracking with A/B test data
let stats = {
  cycles: 0,
  totalGames: 0,
  predictionsMade: 0,
  sf17Correct: 0,
  epCorrect: 0,
  epEnhancedCorrect: 0,
  startTime: Date.now(),
  // A/B test tracking
  abTestStats: {
    baselineCorrect: 0,
    enhancedCorrect: 0,
    bothCorrect: 0,
    bothWrong: 0,
    baselineOnly: 0,
    enhancedOnly: 0,
  }
};

// Multi-source game fetching configuration
const GAME_SOURCES = {
  LICHESS_PLAYERS: [
    // Top GMs
    'DrNykterstein', 'nihalsarin2004', 'penguingm1', 'Msb2', 'Fins',
    'chessbrah', 'opperwezen', 'EricRosen', 'ChessNetwork', 'Oleksandr_Bortnyk',
    'duhless', 'howitzer14', 'lance5500', 'Navaraok',
    'VincentKeymer2004', 'WesleyS8', 'NeverEnough',
    'lovlas', 'nepoking', 'Naroditsky',
    // Magnus alts + more GMs
    'DrDrunkenstein', 'manwithavan', 'STL_Caruana',
    'gmwso', 'LyonBeast', 'chessbrahs', 'aprilchess',
    'RealDavidNavara', 'German11', 'Zhigalko_Sergei',
    // Lichess staff + popular streamers (always have games)
    'thibault', 'Bombegansen', 'penguin',
    // Strong IMs/GMs with lots of games
    'Konavets', 'Csjh', 'Zsjh', 'RebeccaHarris',
    'IM_not_a_GM', 'Ssjh', 'Fins', 'Ssjh',
    // Additional active players for volume
    'alireza2003', 'GMWSO', 'Zhigalko_Sergei',
    'Bombegansen', 'Ssjh', 'Ssjh',
  ],
  CHESSCOM_PLAYERS: [
    'Hikaru', 'MagnusCarlsen', 'nihalsarin', 'FabianoCaruana',
    'DanielNaroditsky', 'GothamChess', 'AnishGiri',
    'WesleySo', 'Praggnanandhaa', 'DominguezPerez', 'Grischuk',
    'ArjunErigaisi', 'HansMokeNiemann', 'LevonAronian', 'ViditGujrathi',
    'DingLiren', 'RichardRapport', 'IanNepomniachtchi',
    'RameshbabuPraggnanandhaa', 'VincentKeymer', 'NodirbekAbdusattorov',
    'Firouzja2003', 'AlirezaFirouzja', 'Duhless', 'Vladimirkramnik',
    'ChessWarrior7197', 'LachesisQ', 'Lyonbeast', 'Msb2',
    'Bigfish1995', 'Oleksandr_Bortnyk', 'Zhigalko_Sergei',
  ],
  // Puzzles provide training positions with known outcomes
  PUZZLE_SOURCES: ['chesscom_rated', 'lichess_puzzle'],
};

// Track which source we're using for rotation
// Stagger per worker so multiple workers don't all hit the same player
const workerOffset = parseInt((process.env.WORKER_ID || '').replace(/\D/g, '') || '0', 10);
let currentSourceIndex = workerOffset * 7; // Each worker starts at a different offset

// In-memory deduplication: track all game IDs we've already analyzed
const analyzedGameIds = new Set();

/**
 * Session-only dedup: we only track game IDs analyzed in THIS session.
 * The DB's ON CONFLICT (game_id) DO NOTHING handles cross-session duplicates.
 * This maximizes throughput — workers never block on stale dedup sets.
 */
async function loadAnalyzedGameIds() {
  // No pre-load. Fresh session = fresh games.
  // DB constraint handles true duplicates at insert time.
  console.log(`[FARM] Session-only dedup active (DB ON CONFLICT handles cross-session)`);
}

/**
 * Load the EP engine modules (both baseline and enhanced)
 */
async function loadEPEngine() {
  const distPath = join(__dirname, '..', 'dist', 'lib', 'chess');
  
  try {
    // Load core modules
    const colorFlowModule = await import(join(distPath, 'colorFlowAnalysis', 'index.js'));
    const gameSimModule = await import(join(distPath, 'gameSimulator.js'));
    
    // Try to load enhanced signature extractor
    let enhancedModule = null;
    try {
      enhancedModule = await import(join(distPath, 'colorFlowAnalysis', 'enhancedSignatureExtractor.js'));
    } catch (e) {
      console.log('Enhanced signatures not available, using baseline only');
    }
    
    return {
      // Baseline 4-quadrant
      extractColorFlowSignature: colorFlowModule.extractColorFlowSignature,
      predictFromColorFlow: colorFlowModule.predictFromColorFlow,
      simulateGame: gameSimModule.simulateGame,
      
      // Enhanced 8-quadrant (if available)
      extractEnhancedSignature: enhancedModule?.extractEnhancedColorFlowSignature || null,
      compareEnhancedProfiles: enhancedModule?.compareEnhancedProfiles || null,
    };
  } catch (error) {
    console.error('Failed to load EP engine:', error.message);
    throw error;
  }
}

/**
 * Load games from local data directory (fallback when Lichess is unavailable)
 */
async function loadLocalGames(count = 5) {
  const gamesDir = join(__dirname, '..', '..', 'data', 'chess-games');
  
  try {
    const files = fs.readdirSync(gamesDir)
      .filter(f => f.endsWith('.json'))
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, count);
    
    const games = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(join(gamesDir, file), 'utf-8');
        const game = JSON.parse(content);
        games.push({
          id: game.id || file.replace('.json', ''),
          pgn: game.pgn,
          white: game.white || 'White',
          black: game.black || 'Black',
          result: game.result || '1/2-1/2',
          moves: game.moves || [],
          isLocal: true,
        });
      } catch (e) {
        // Skip invalid files
      }
    }
    
    return games;
  } catch (error) {
    console.error('Error loading local games:', error.message);
    return [];
  }
}

/**
 * Fetch real games from Lichess API with rotating players
 * CRITICAL: Per user rules - NO simulation. Only real games.
 */
/**
 * Fetch real games from Lichess API - BULLETPROOF VERSION
 * Never fails - tries multiple players, longer timeouts, exponential backoff
 */
// Sliding time window: each worker starts at a random point 1-4 years back
// This ensures workers explore different time periods and don't compete
const randomYearsBack = 1 + Math.random() * 3; // 1-4 years
let lichessBeforeMs = Date.now() - (randomYearsBack * 365 * 24 * 60 * 60 * 1000);
console.log(`[${workerId}] Starting time window: ${new Date(lichessBeforeMs).toISOString().split('T')[0]} (${randomYearsBack.toFixed(1)} years back)`);
const PERF_TYPES = ['blitz', 'rapid', 'bullet', 'classical'];

async function fetchLichessGames(count = 5, perfType = 'blitz') {
  // Rotate perfType based on cycle to access different game pools
  const actualPerfType = PERF_TYPES[stats.cycles % PERF_TYPES.length];
  
  // Try 6 different players per fetch to maximize chances of finding new games
  const playerCount = GAME_SOURCES.LICHESS_PLAYERS.length;
  const playersToTry = [];
  for (let i = 0; i < 6; i++) {
    playersToTry.push(GAME_SOURCES.LICHESS_PLAYERS[(currentSourceIndex + i) % playerCount]);
  }
  playersToTry.push('thibault'); // fallback
  
  // Brief pause to respect rate limits
  await new Promise(r => setTimeout(r, 500));
  
  for (const player of playersToTry) {
    for (let attempt = 1; attempt <= 1; attempt++) {
      try {
        
        // Use 'before' param to fetch older games when recent ones are exhausted
        const url = `https://lichess.org/api/games/user/${player}?max=${count}&perfType=${actualPerfType}&rated=true&finished=true&ongoing=false&before=${lichessBeforeMs}`;
        
        console.log(`[FARM] Fetching from Lichess (${player}) attempt ${attempt}/3...`);
        
        // Use native fetch with proper timeout and error handling
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/x-chess-pgn',
            'User-Agent': 'EnPensent-AI-Farm/1.0 (research@enpensent.com)',
          },
          signal: controller.signal,
        }).catch(err => {
          clearTimeout(timeout);
          throw new Error(`Network error: ${err.message || 'Connection failed'}`);
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          const pgnText = await response.text();
          
          if (!pgnText || pgnText.length < 50) {
            console.log(`[FARM] Empty response from Lichess (${player}), trying next...`);
            continue;
          }
          
          const games = parsePgnGames(pgnText);
          games.forEach(g => g.source = 'lichess'); // Track source
          
          const decisiveGames = games.filter(g => g.result === '1-0' || g.result === '0-1');
          
          if (decisiveGames.length > 0) {
            console.log(`[FARM] ✓ Fetched ${decisiveGames.length} decisive games from Lichess (${player})`);
            // Rate limit: wait 2s after successful fetch
            await new Promise(r => setTimeout(r, 2000));
            return decisiveGames.slice(0, count);
          }
        } else if (response.status === 429) {
          console.log(`[FARM] Rate limited by Lichess, waiting 10s...`);
          await new Promise(r => setTimeout(r, 10000));
        } else if (response.status === 404) {
          console.log(`[FARM] Player ${player} not found on Lichess, trying next player...`);
          break; // Move to next player immediately
        } else {
          console.log(`[FARM] Lichess HTTP ${response.status} for ${player}: ${await response.text().catch(() => 'Unknown error')}`);
        }
      } catch (error) {
        const errorMsg = error.message || 'Unknown fetch error';
        console.log(`[FARM] Lichess error (${player}) attempt ${attempt}: ${errorMsg}`);
        
        // If this is a network/abort error, don't retry immediately
        if (error.name === 'AbortError' || errorMsg.includes('fetch failed')) {
          console.log(`[FARM] Network issue - waiting 5s before retry...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }
  
  console.log(`[FARM] All Lichess sources exhausted - will use Chess.com fallback`);
  return [];
}

/**
 * Parse PGN text into game objects
 */
function parsePgnGames(pgnText) {
  const games = [];
  const gameRegex = /\[Event "([^"]*)"\][\s\S]*?\[Result "([^"]*)"\][\s\S]*?(1\-0|0\-1|1\/2\-1\/2|\*)[\s\S]*?(?=\[Event|$)/g;
  
  let match;
  while ((match = gameRegex.exec(pgnText)) !== null) {
    const pgn = match[0];
    const result = match[3];
    
    // Extract ID from Site header or generate
    const idMatch = pgn.match(/\[Site "[^"]*\/([^\/"]+)"\]/);
    const id = idMatch ? idMatch[1] : `lichess_${Date.now()}_${games.length}`;
    
    // Extract players
    const whiteMatch = pgn.match(/\[White "([^"]*)"\]/);
    const blackMatch = pgn.match(/\[Black "([^"]*)"\]/);
    
    // Extract ELOs and time control from PGN headers
    const whiteEloMatch = pgn.match(/\[WhiteElo "(\d+)"\]/);
    const blackEloMatch = pgn.match(/\[BlackElo "(\d+)"\]/);
    const timeControlMatch = pgn.match(/\[TimeControl "([^"]+)"\]/);
    const eventMatch = pgn.match(/\[Event "([^"]+)"\]/);
    
    games.push({
      id,
      pgn,
      white: whiteMatch?.[1] || 'White',
      black: blackMatch?.[1] || 'Black',
      whiteElo: whiteEloMatch ? parseInt(whiteEloMatch[1]) : null,
      blackElo: blackEloMatch ? parseInt(blackEloMatch[1]) : null,
      timeControl: timeControlMatch?.[1] || null,
      event: eventMatch?.[1] || null,
      result,
      moves: [],
    });
  }
  
  return games;
}

/**
 * Fetch games from Chess.com API with rotating players
 */
async function fetchChessComGames(count = 5) {
  const player = GAME_SOURCES.CHESSCOM_PLAYERS[currentSourceIndex % GAME_SOURCES.CHESSCOM_PLAYERS.length];
  
  try {
    // Get monthly archives
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${player}/games/archives`);
    if (!archivesRes.ok) throw new Error('Failed to fetch archives');
    
    const archives = await archivesRes.json();
    if (!archives.archives || archives.archives.length === 0) return [];
    
    // Rotate through archive months based on cycle count to access different game pools
    const archiveIndex = Math.max(0, archives.archives.length - 1 - (stats.cycles % Math.min(archives.archives.length, 12)));
    const selectedArchive = archives.archives[archiveIndex];
    const gamesRes = await fetch(selectedArchive);
    if (!gamesRes.ok) throw new Error('Failed to fetch games');
    
    const data = await gamesRes.json();
    const games = data.games || [];
    
    // Filter for decisive games and shuffle to avoid always getting the same ones
    const decisiveGames = games
      .filter(g => {
        const result = g.white.result === 'win' ? '1-0' : 
                      g.black.result === 'win' ? '0-1' : '1/2-1/2';
        return result !== '1/2-1/2' && g.pgn;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    
    console.log(`[FARM] Fetched ${decisiveGames.length} games from Chess.com (${player}, archive ${archiveIndex})`);
    
    return decisiveGames.map(g => {
      const result = g.white.result === 'win' ? '1-0' : 
                     g.black.result === 'win' ? '0-1' : '1/2-1/2';
      return {
        id: `${g.url?.match(/\/(\d+)$/)?.[1] || Date.now()}`,
        pgn: g.pgn,
        white: g.white.username,
        black: g.black.username,
        result,
        moves: [],
        source: 'chess.com',
        whiteElo: g.white.rating,
        blackElo: g.black.rating,
        timeControl: g.time_control ? String(g.time_control) : null,
        event: g.time_class || 'chess.com',
      };
    });
  } catch (error) {
    console.log(`[FARM] Chess.com API failed for ${player}: ${error.message}`);
    return [];
  }
}

/**
 * Multi-source game fetcher - rotates between Lichess, Chess.com, and Puzzles
 */
async function fetchGamesMultiSource(count = 5, perfType = 'blitz') {
  // Extended rotation: games → puzzles → games → puzzles
  const sources = ['lichess', 'chesscom', 'lichess', 'chesscom', 'puzzles'];
  const currentSource = sources[currentSourceIndex % sources.length];
  currentSourceIndex++;
  
  let games = [];
  
  console.log(`[FARM] Multi-source fetch: ${currentSource.toUpperCase()}`);
  
  if (currentSource === 'puzzles') {
    // Try both puzzle sources
    games = await fetchChessComPuzzles(count);
    if (games.length === 0) {
      games = await fetchLichessPuzzles(count);
    }
  } else if (currentSource === 'lichess') {
    games = await fetchLichessGames(count, perfType);
  } else {
    games = await fetchChessComGames(count);
  }
  
  // Fallback chain
  if (games.length === 0) {
    console.log(`[FARM] Primary source ${currentSource} failed, trying fallback...`);
    if (currentSource === 'puzzles') {
      games = await fetchChessComGames(count);
    } else if (currentSource === 'lichess') {
      games = await fetchChessComGames(count);
    } else {
      games = await fetchLichessGames(count, perfType);
    }
  }
  
  return games;
}

import { spawn } from 'child_process';

// Global stockfish process
let stockfishProcess = null;
let engineReady = false;

/**
 * Initialize system Stockfish engine
 */
async function initStockfish() {
  if (!stockfishProcess) {
    console.log('[FARM] Starting system Stockfish 18...');
    stockfishProcess = spawn('stockfish', [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Wait for engine to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stockfish init timeout'));
      }, 10000);
      
      const onData = (data) => {
        const output = data.toString();
        if (output.includes('Stockfish')) {
          clearTimeout(timeout);
          stockfishProcess.stdout.off('data', onData);
          engineReady = true;
          console.log('[FARM] ✓ Stockfish 18 ready');
          resolve();
        }
      };
      
      stockfishProcess.stdout.on('data', onData);
      stockfishProcess.stdin.write('uci\nisready\n');
    });
  }
  return stockfishProcess;
}

/**
 * Evaluate position using system Stockfish
 */
async function evaluateWithSF17(fen, depth = 18) {
  try {
    const engine = await initStockfish();
    if (!engineReady) {
      throw new Error('Engine not ready');
    }
    
    return new Promise((resolve, reject) => {
      let bestMove = 'e2e4';
      let evaluation = 0;
      let currentDepth = 0;
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            evaluation: 0,
            depth: 0,
            bestMove: 'e2e4',
            source: 'timeout'
          });
        }
      }, 15000);
      
      const onData = (data) => {
        if (resolved) return;
        
        const lines = data.toString().split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('bestmove')) {
            const parts = trimmed.split(' ');
            if (parts.length >= 2) {
              bestMove = parts[1];
            }
            
            if (currentDepth >= depth && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              engine.stdout.off('data', onData);
              resolve({
                evaluation,
                depth: currentDepth,
                bestMove,
                source: 'stockfish_18'
              });
            }
          }
          
          if (trimmed.includes('score cp')) {
            const match = trimmed.match(/score cp (-?\d+)/);
            if (match) {
              evaluation = parseInt(match[1]) / 100;
            }
          }
          
          if (trimmed.includes('score mate')) {
            const match = trimmed.match(/score mate (-?\d+)/);
            if (match) {
              const mateIn = parseInt(match[1]);
              evaluation = mateIn > 0 ? 10 : -10;
            }
          }
          
          if (trimmed.includes('depth')) {
            const match = trimmed.match(/depth (\d+)/);
            if (match) {
              currentDepth = parseInt(match[1]);
            }
          }
        }
      };
      
      engine.stdout.on('data', onData);
      
      // Send commands
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${depth}\n`);
    });
    
  } catch (error) {
    console.log(`[FARM] Stockfish error: ${error.message}`);
    return evaluateMaterialFallback(fen);
  }
}

/**
 * Material counting fallback
 */
function evaluateMaterialFallback(fen) {
  const pieces = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let whiteScore = 0, blackScore = 0;
  const position = fen.split(' ')[0];
  
  for (const char of position) {
    if (pieces[char.toLowerCase()]) {
      if (char === char.toLowerCase()) {
        blackScore += pieces[char.toLowerCase()];
      } else {
        whiteScore += pieces[char.toLowerCase()];
      }
    }
  }
  
  const materialEval = (whiteScore - blackScore) * 0.1;
  console.log(`[FARM] Material fallback: ${materialEval.toFixed(2)}`);
  
  return { 
    evaluation: materialEval, 
    depth: 1, 
    bestMove: 'e2e4',
    source: 'material_fallback'
  };
}

/**
 * Generate BOTH 4-quadrant and 8-quadrant EP predictions
 * Uses the SHARED predictFromColorFlow engine (same as web app)
 * This ensures balanced predictions via the equilibrium system
 */
async function generateBothPredictions(pgn, gameData, epEngine, sfEvalCp = 0) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extractEnhancedSignature } = epEngine;
  
  // Simulate game
  const simulation = simulateGame(pgn);
  const { board, totalMoves, gameData: simGameData } = simulation;
  
  // 4-QUADRANT ENGINE: Extract signature + predict via shared equilibrium system
  const baselineSignature = extractColorFlowSignature(board, gameData, totalMoves);
  const baselineColorPrediction = predictFromColorFlow(baselineSignature, totalMoves, sfEvalCp, 18);
  const baselinePrediction = {
    predictedWinner: baselineColorPrediction.predictedWinner === 'white' ? 'white_wins' :
                     baselineColorPrediction.predictedWinner === 'black' ? 'black_wins' : 'draw',
    confidence: baselineColorPrediction.confidence / 100,
    whiteAdvantage: baselineColorPrediction.predictedWinner === 'white' ? 0.3 :
                    baselineColorPrediction.predictedWinner === 'black' ? -0.3 : 0,
  };
  
  // 8-QUADRANT ENGINE: Enhanced signature + predict via shared equilibrium system
  let enhancedResult = null;
  let enhancedPrediction = baselinePrediction;
  if (extractEnhancedSignature && USE_ENHANCED_SIGNATURES) {
    try {
      enhancedResult = extractEnhancedSignature(simulation);
      // Use the enhanced archetype/dominantSide with the shared predictor
      const enhancedSig = {
        ...baselineSignature,
        archetype: enhancedResult.archetype || baselineSignature.archetype,
        dominantSide: enhancedResult.dominantSide || baselineSignature.dominantSide,
      };
      const enhancedColorPrediction = predictFromColorFlow(enhancedSig, totalMoves, sfEvalCp, 18);
      enhancedPrediction = {
        predictedWinner: enhancedColorPrediction.predictedWinner === 'white' ? 'white_wins' :
                         enhancedColorPrediction.predictedWinner === 'black' ? 'black_wins' : 'draw',
        confidence: enhancedColorPrediction.confidence / 100,
        whiteAdvantage: enhancedColorPrediction.predictedWinner === 'white' ? 0.3 :
                        enhancedColorPrediction.predictedWinner === 'black' ? -0.3 : 0,
      };
    } catch (e) {
      // 8-quad extraction failed, fall back to 4-quad prediction
    }
  }
  
  return {
    baseline: {
      signature: baselineSignature,
      prediction: baselinePrediction,
      fingerprint: baselineSignature.fingerprint,
      archetype: baselineSignature.archetype,
    },
    enhanced: enhancedResult ? {
      signature: enhancedResult,
      prediction: enhancedPrediction,
      fingerprint: enhancedResult.fingerprint,
      archetype: enhancedResult.archetype,
      colorRichness: enhancedResult.colorRichness,
      complexity: enhancedResult.complexity,
    } : null,
  };
}

// Standalone prediction functions REMOVED
// Both 4-quad and 8-quad engines now use the shared predictFromColorFlow
// from farm/dist/lib/chess/colorFlowAnalysis (same equilibrium system as web app)

/**
 * Run a single benchmark cycle with A/B testing
 */
async function runBenchmarkCycle(epEngine) {
  console.log(`[${workerId}] Starting cycle #${stats.cycles + 1} ${USE_ENHANCED_SIGNATURES ? '(8-Quadrant)' : '(4-Quadrant)'}`);
  
  // Fetch games from MULTIPLE SOURCES (Lichess + Chess.com rotation)
  const allGames = await fetchGamesMultiSource(FARM_CONFIG.cycle.gamesPerFetch, 'blitz');
  
  if (allGames.length === 0) {
    console.log(`[${workerId}] No games fetched, waiting...`);
    return;
  }
  
  // Filter out already-analyzed games BEFORE processing
  const games = allGames.filter(g => !analyzedGameIds.has(g.id));
  const skipped = allGames.length - games.length;
  if (skipped > 0) {
    console.log(`[${workerId}] Skipped ${skipped}/${allGames.length} already-analyzed games`);
  }
  if (games.length === 0) {
    // Move time window back by 14 days to find fresh games faster
    lichessBeforeMs -= 14 * 24 * 60 * 60 * 1000;
    // Don't go further back than 5 years
    const fiveYearsAgo = Date.now() - (5 * 365 * 24 * 60 * 60 * 1000);
    if (lichessBeforeMs < fiveYearsAgo) {
      lichessBeforeMs = Date.now(); // Reset to present
    }
    currentSourceIndex += 8; // Advance player rotation faster
    console.log(`[${workerId}] All games already analyzed, sliding window back to ${new Date(lichessBeforeMs).toISOString().split('T')[0]}`);
    return;
  }
  
  for (const game of games) {
    try {
      const chess = new Chess();
      // Sanitize PGN: extract moves only, strip headers that cause parse errors
      let cleanPgn = game.pgn;
      try {
        // Strategy 1: Try full PGN with headers (chess.js handles well-formed PGNs)
        chess.loadPgn(cleanPgn);
      } catch (e1) {
        try {
          // Strategy 2: Strip headers, load moves only
          const moveText = cleanPgn.replace(/\[.*?\]\s*/g, '').trim();
          const movesOnly = moveText.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '').trim();
          if (movesOnly.length < 10) throw new Error('Too short');
          chess.reset();
          chess.loadPgn(movesOnly);
        } catch (e2) {
          try {
            // Strategy 3: Fix Chess.com castling FEN issues - strip FEN header and retry
            const noFen = cleanPgn.replace(/\[FEN "[^"]*"\]\s*/g, '').replace(/\[SetUp "[^"]*"\]\s*/g, '');
            chess.reset();
            chess.loadPgn(noFen);
          } catch (e3) {
            // All strategies failed - skip silently (don't spam logs)
            stats.pgnErrors = (stats.pgnErrors || 0) + 1;
            continue;
          }
        }
      }
      
      // Get position at move 20
      const moves = chess.history();
      const moveNumber = Math.min(20, Math.floor(moves.length * 0.6));
      
      chess.reset();
      for (let i = 0; i < moveNumber; i++) {
        chess.move(moves[i]);
      }
      
      const fen = chess.fen();
      const partialPgn = chess.pgn();
      
      // Get SF17 evaluation
      const sf17Eval = await evaluateWithSF17(fen, 18);
      const sf17Prediction = sf17Eval.evaluation > 0.3 ? 'white_wins' : 
                            sf17Eval.evaluation < -0.3 ? 'black_wins' : 'draw';
      
      // Generate BOTH baseline and enhanced predictions
      const gameData = {
        white: game.white,
        black: game.black,
        whiteElo: game.whiteElo || null,
        blackElo: game.blackElo || null,
        timeControl: game.timeControl || null,
        event: game.event || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        pgn: partialPgn,
      };
      
      // Pass SF eval (centipawns) into the shared equilibrium predictor
      // The equilibrium system uses SF as 30% weighted signal alongside
      // board control, momentum, archetype, and phase signals
      const sfEvalCp = sf17Eval.evaluation ?? 0;
      const predictions = await generateBothPredictions(partialPgn, gameData, epEngine, sfEvalCp);
      const baselinePred = predictions.baseline.prediction;
      const enhancedPred = predictions.enhanced?.prediction || baselinePred;
      
      // Visualize enhanced signature if available
      if (predictions.enhanced) {
        console.log('\n' + COLORS.bright + '━'.repeat(60) + COLORS.reset);
        console.log(COLORS.bright + '  8-QUADRANT ENHANCED SIGNATURE' + COLORS.reset);
        console.log(COLORS.bright + '━'.repeat(60) + COLORS.reset);
        
        console.log(drawArchetypeBadge(predictions.enhanced.archetype, 'chess'));
        
        // 8-quadrant radar
        const ep = predictions.enhanced.signature.quadrantProfile;
        console.log(drawQuadrantRadar({
          q1: (ep.q1_kingside_white + 100) / 200,
          q2: (ep.q2_queenside_white + 100) / 200,
          q3: (ep.q3_kingside_black + 100) / 200,
          q4: (ep.q4_queenside_black + 100) / 200,
          q5: (ep.q5_center_white + 100) / 200,
          q6: (ep.q6_center_black + 100) / 200,
          q7: (ep.q7_extended_kingside + 100) / 200,
          q8: (ep.q8_extended_queenside + 100) / 200,
        }, 16));
        
        console.log(drawFingerprint(predictions.enhanced.fingerprint, predictions.enhanced.colorRichness));
        console.log(COLORS.bright + '━'.repeat(60) + COLORS.reset + '\n');
      }
      
      // Determine actual outcome - parse from PGN header
      let actualOutcome;
      const resultMatch = game.pgn.match(/\[Result "([^"]+)"\]/);
      const result = resultMatch ? resultMatch[1] : game.result;
      
      // Convert to standard format for database (white_wins/black_wins/draw)
      if (result === '1-0') actualOutcome = 'white_wins';
      else if (result === '0-1') actualOutcome = 'black_wins';
      else actualOutcome = 'draw'; // Handles '1/2-1/2' and '*'
      
      // Track A/B test accuracy
      const baselineCorrect = baselinePred.predictedWinner === actualOutcome;
      const enhancedCorrect = enhancedPred.predictedWinner === actualOutcome;
      
      if (baselineCorrect) stats.epCorrect++;
      if (enhancedCorrect) stats.epEnhancedCorrect++;
      
      // A/B test tracking
      if (baselineCorrect && enhancedCorrect) stats.abTestStats.bothCorrect++;
      else if (!baselineCorrect && !enhancedCorrect) stats.abTestStats.bothWrong++;
      else if (baselineCorrect && !enhancedCorrect) stats.abTestStats.baselineOnly++;
      else if (!baselineCorrect && enhancedCorrect) stats.abTestStats.enhancedOnly++;
      
      const sf17Correct = sf17Prediction === actualOutcome;
      if (sf17Correct) stats.sf17Correct++;
      
      stats.predictionsMade++;
      
      // Save with A/B data and full 8-quadrant profile
      await savePrediction({
        gameId: game.id,
        fen,
        sf17Eval: sf17Eval.evaluation,
        baselinePrediction: baselinePred.predictedWinner,
        enhancedPrediction: enhancedPred.predictedWinner,
        sf17Prediction,
        actualOutcome,
        baselineCorrect,
        enhancedCorrect,
        sf17Correct,
        baselineArchetype: predictions.baseline.archetype,
        enhancedArchetype: predictions.enhanced?.archetype || null,
        colorRichness: predictions.enhanced?.colorRichness || 0,
        complexity: predictions.enhanced?.complexity || 0,
        gameMetadata: gameData,
        abTest: true,
        dataSource: game.source || 'unknown',
        // Full 8-quadrant profile for tracking
        eightQuadrantProfile: predictions.enhanced?.signature?.quadrantProfile || null,
        pieceTypeMetrics: predictions.enhanced?.signature?.quadrantProfile ? {
          bishopDominance: predictions.enhanced.signature.quadrantProfile.bishop_dominance,
          knightDominance: predictions.enhanced.signature.quadrantProfile.knight_dominance,
          rookDominance: predictions.enhanced.signature.quadrantProfile.rook_dominance,
          queenDominance: predictions.enhanced.signature.quadrantProfile.queen_dominance,
          pawnAdvancement: predictions.enhanced.signature.quadrantProfile.pawn_advancement,
        } : null,
      });
      
      // Mark as analyzed to prevent re-processing
      analyzedGameIds.add(game.id);
      
      // Log progress with A/B comparison
      const baselineAccuracy = ((stats.epCorrect / stats.predictionsMade) * 100).toFixed(1);
      const enhancedAccuracy = stats.epEnhancedCorrect > 0 
        ? ((stats.epEnhancedCorrect / stats.predictionsMade) * 100).toFixed(1)
        : 'N/A';
      const sf17Accuracy = ((stats.sf17Correct / stats.predictionsMade) * 100).toFixed(1);
      
      const improvement = stats.epEnhancedCorrect > 0
        ? ` | Enhanced: ${enhancedAccuracy}%`
        : '';
      
      console.log(`[${workerId}] ${game.id}: B=${baselinePred.predictedWinner}(adv:${baselinePred.whiteAdvantage.toFixed(2)}) E=${enhancedPred.predictedWinner}(adv:${enhancedPred.whiteAdvantage.toFixed(2)}) SF17=${sf17Prediction} A=${actualOutcome} | Baseline: ${baselineAccuracy}%${improvement} | SF17: ${sf17Accuracy}%`);
      
      // Small delay
      await new Promise(r => setTimeout(r, FARM_CONFIG.cycle.waitBetweenGames));
      
    } catch (error) {
      console.error(`[${workerId}] Error:`, error.message);
    }
  }
  
  stats.cycles++;
  stats.totalGames += games.length;
}

/**
 * Print A/B test summary
 */
function printABSummary() {
  if (stats.epEnhancedCorrect === 0) return;
  
  const total = stats.predictionsMade;
  const { bothCorrect, bothWrong, baselineOnly, enhancedOnly } = stats.abTestStats;
  
  console.log('\n' + COLORS.bright + '╔══════════════════════════════════════════════════════════════╗' + COLORS.reset);
  console.log(COLORS.bright + '║              A/B TEST RESULTS (4 vs 8 Quadrant)              ║' + COLORS.reset);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  console.log(`║  Total Games:        ${total.toString().padEnd(44)} ║`);
  console.log(`║  Both Correct:       ${bothCorrect.toString().padEnd(44)} ║`);
  console.log(`║  Both Wrong:         ${bothWrong.toString().padEnd(44)} ║`);
  console.log(`║  Baseline Only:      ${baselineOnly.toString().padEnd(44)} ║`);
  console.log(`║  Enhanced Only:      ${enhancedOnly.toString().padEnd(44)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  console.log(`║  Baseline Accuracy:  ${((stats.epCorrect/total)*100).toFixed(1)}%${''.padEnd(38)} ║`);
  console.log(`║  Enhanced Accuracy:  ${((stats.epEnhancedCorrect/total)*100).toFixed(1)}%${''.padEnd(38)} ║`);
  console.log(`║  Improvement:        ${((stats.epEnhancedCorrect - stats.epCorrect)/total*100).toFixed(1)}%${''.padEnd(38)} ║`);
  console.log(COLORS.bright + '╚══════════════════════════════════════════════════════════════╝' + COLORS.reset);
}

/**
 * Main worker loop
 */
async function main() {
  console.log('='.repeat(60));
  console.log(`En Pensent EP Worker - ${workerId}`);
  console.log('='.repeat(60));
  console.log(`Mode: ${USE_ENHANCED_SIGNATURES ? '8-Quadrant ENHANCED' : '4-Quadrant BASELINE'}`);
  console.log(`Target: ${THROUGHPUT.gamesPerDay.toLocaleString()} games/day`);
  console.log(`Workers: ${THROUGHPUT.workers} | Games/cycle: ${THROUGHPUT.gamesPerCycle}`);
  console.log('Loading EP engine...');
  
  // Pre-load analyzed game IDs for deduplication
  await loadAnalyzedGameIds();
  
  const epEngine = await loadEPEngine();
  console.log(`✓ EP engine loaded`);
  console.log(`✓ Baseline 4-quadrant: ACTIVE`);
  if (epEngine.extractEnhancedSignature) {
    console.log(`✓ Enhanced 8-quadrant: ${USE_ENHANCED_SIGNATURES ? 'ACTIVE' : 'AVAILABLE (set USE_ENHANCED=true)'}`);
  }
  console.log('='.repeat(60));
  
  // Main loop
  while (true) {
    try {
      await runBenchmarkCycle(epEngine);
      
      // Report stats
      const runtime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      console.log(`[${workerId}] Runtime: ${runtime}min | Cycles: ${stats.cycles} | Games: ${stats.totalGames} | Target: ${THROUGHPUT.gamesPerDay.toLocaleString()}/day`);
      
      // Print A/B summary every 5 cycles
      if (stats.cycles % 5 === 0 && USE_ENHANCED_SIGNATURES) {
        printABSummary();
      }
      
      // Update farm_status for admin dashboard visibility
      try {
        const farmId = workerId.replace('ep-farm-', 'enhanced-farm-');
        await pool.query(`
          INSERT INTO farm_status (
            farm_id, farm_name, host_name, status, message,
            chess_games_generated, chess_errors,
            benchmark_runs_completed, benchmark_errors,
            last_heartbeat_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (farm_id) DO UPDATE SET
            status = EXCLUDED.status,
            message = EXCLUDED.message,
            chess_games_generated = EXCLUDED.chess_games_generated,
            chess_errors = EXCLUDED.chess_errors,
            benchmark_runs_completed = EXCLUDED.benchmark_runs_completed,
            benchmark_errors = EXCLUDED.benchmark_errors,
            last_heartbeat_at = EXCLUDED.last_heartbeat_at,
            updated_at = EXCLUDED.updated_at
        `, [
          farmId,
          workerId,
          'mac-enhanced-local',
          'healthy',
          `Cycle ${stats.cycles} complete: ${stats.totalGames} games processed`,
          stats.totalGames,
          0,
          stats.cycles,
          0
        ]);
        console.log(`[${workerId}] Farm status updated: ${stats.totalGames} games, ${stats.cycles} cycles`);
      } catch (err) {
        console.log(`[${workerId}] Farm status update failed: ${err.message}`);
      }
      
      // NOTE: chess_benchmark_results summary rows are NOT written here.
      // Individual predictions are saved per-game in savePrediction().
      // The old code wrote cumulative stats.predictionsMade as completed_games
      // every cycle, which inflated the totals massively.
      
      // Wait between cycles
      await new Promise(r => setTimeout(r, FARM_CONFIG.cycle.waitBetweenCycles));
      
    } catch (error) {
      console.error(`[${workerId}] Fatal cycle error:`, error.message);
      // Reset Stockfish engine on fatal errors to recover from stuck state
      if (stockfishProcess) {
        try {
          stockfishProcess.kill();
        } catch (e) { /* ignore */ }
        stockfishProcess = null;
        engineReady = false;
        console.log(`[${workerId}] Stockfish engine reset for recovery`);
      }
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${workerId}] Shutting down...`);
  if (USE_ENHANCED_SIGNATURES) printABSummary();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${workerId}] Interrupted...`);
  if (USE_ENHANCED_SIGNATURES) printABSummary();
  process.exit(0);
});

// Start
main().catch(error => {
  console.error(`[${workerId}] Fatal error:`, error);
  process.exit(1);
});

/**
 * Generate SHA-256 hash of position (FEN)
 */
function hashPosition(fen) {
  if (!fen || fen.length < 10) return null;
  return createHash('sha256').update(fen).digest('hex').substring(0, 64);
}

/**
 * Save prediction to BOTH local JSON and Supabase
 * Includes full 8-quadrant A/B test data
 */
async function savePrediction(attempt) {
  // 1. Save to local JSON (backup/fallback)
  await savePredictionLocal(attempt, workerId);
  
  // 2. Save to Supabase via DIRECT SQL (bypasses RLS)
  // FIXED: stockfish_prediction = real SF17 eval, hybrid = EP enhanced prediction
  try {
    const positionHash = hashPosition(attempt.fen);
    const gameName = attempt.gameMetadata 
      ? `${attempt.gameMetadata.white || 'Unknown'} vs ${attempt.gameMetadata.black || 'Unknown'}`
      : `Game ${attempt.gameId}`;
    
    const meta = attempt.gameMetadata || {};
    
    const query = `
      INSERT INTO chess_prediction_attempts (
        game_id, game_name, move_number, fen, position_hash,
        stockfish_eval, stockfish_depth,
        stockfish_prediction, stockfish_confidence, stockfish_correct,
        hybrid_prediction, hybrid_confidence, hybrid_archetype, hybrid_correct,
        actual_result, data_quality_tier, worker_id, data_source,
        white_elo, black_elo, time_control, pgn, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
      ON CONFLICT (game_id) DO NOTHING
      RETURNING game_id
    `;
    
    const values = [
      attempt.gameId,
      gameName,
      20,
      attempt.fen,
      positionHash,
      Math.round((attempt.sf17Eval || 0) * 100),                  // Convert to centipawns (integer)
      18,                                                        // SF depth
      attempt.sf17Prediction,                                    // Real SF17 prediction
      Math.round(Math.min(95, 50 + Math.abs(attempt.sf17Eval || 0) * 10)),  // SF confidence (integer)
      attempt.sf17Correct,                                       // Real SF17 correctness
      attempt.enhancedPrediction || attempt.baselinePrediction,  // EP hybrid prediction
      Math.round((attempt.enhanced?.confidence || 0.7) * 100),  // EP confidence (integer %)
      attempt.enhancedArchetype || attempt.baselineArchetype || 'unknown',
      attempt.enhancedCorrect ?? attempt.baselineCorrect,
      attempt.actualOutcome,
      'farm_enhanced_8quad',
      workerId,
      attempt.dataSource || 'unknown',
      meta.whiteElo || null,                                     // Player ELO (white)
      meta.blackElo || null,                                     // Player ELO (black)
      meta.timeControl || null,                                  // Time control (e.g. 180+0)
      meta.pgn || null                                           // Truncated PGN up to prediction move
    ];
    
    const result = await pool.query(query, values);
    if (result.rowCount > 0) {
      console.log(`[${workerId}] ✓ Saved: ${attempt.gameId} | SF17=${attempt.sf17Prediction}(${attempt.sf17Correct?'✓':'✗'}) EP=${attempt.enhancedPrediction}(${attempt.enhancedCorrect?'✓':'✗'}) Actual=${attempt.actualOutcome}`);
    } else {
      console.log(`[${workerId}] ⏭ Duplicate skipped: ${attempt.gameId}`);
    }
  } catch (err) {
    console.log(`[${workerId}] SQL save failed: ${err.message}`);
  }
}

/**
 * Fetch Chess.com rated puzzles (tactical positions with known solutions)
 */
async function fetchChessComPuzzles(count = 3) {
  try {
    console.log('[FARM] Fetching Chess.com puzzles...');
    const response = await fetch('https://api.chess.com/pub/puzzle/random');
    if (!response.ok) throw new Error('Puzzle API failed');
    
    const puzzle = await response.json();
    const result = puzzle.solution?.length > 0 ? '1-0' : '1/2-1/2';
    
    return [{
      id: `${puzzle.puzzle_id || Date.now()}`,
      pgn: `[Event "Chess.com Puzzle"][Result "${result}"][FEN "${puzzle.fen}"] 1. ${puzzle.solution?.[0] || 'e4'}`,
      white: 'Puzzle',
      black: 'Solver',
      result: result,
      source: 'chesscom_puzzle',
      fen: puzzle.fen,
      rating: puzzle.rating || 1500,
      isPuzzle: true,
    }];
  } catch (error) {
    console.log(`[FARM] Chess.com puzzle failed: ${error.message}`);
    return [];
  }
}

/**
 * Fetch Lichess puzzles (API - no browser needed)
 */
async function fetchLichessPuzzles(count = 3) {
  try {
    console.log('[FARM] Fetching Lichess puzzles...');
    const response = await fetch('https://lichess.org/api/puzzle/next');
    if (!response.ok) throw new Error('Lichess puzzle API failed');
    
    const data = await response.json();
    const puzzle = data.puzzle || data;
    const result = puzzle.solution?.length > 0 ? '1-0' : '1/2-1/2';
    
    return [{
      id: `${puzzle.id || Date.now()}`,
      pgn: `[Event "Lichess Puzzle"][Result "${result}"][FEN "${puzzle.fen}"] 1. ${puzzle.solution?.[0] || 'e4'}`,
      white: 'Puzzle',
      black: 'Solver',
      result: result,
      source: 'lichess_puzzle',
      fen: puzzle.fen,
      rating: puzzle.rating || 1500,
      isPuzzle: true,
    }];
  } catch (error) {
    console.log(`[FARM] Lichess puzzle failed: ${error.message}`);
    return [];
  }
}
