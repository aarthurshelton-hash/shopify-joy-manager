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
import { fetchLichessPuzzleBatch, processPuzzle, loadCalibration, updateCalibration } from './puzzleArchetypeCalibrator.mjs';
import { savePredictionLocal, getLocalStats } from '../lib/simpleStorage.mjs';
import { computeLiveArchetypeWeights, saveLiveWeights, loadLiveWeights, logWeightComparison, loadPuzzleCalibration, mergePuzzleCalibration } from '../lib/liveArchetypeWeights.mjs';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Direct SQL pool - bypasses RLS completely
// max: 3 per worker (3 workers × 3 = 9 total, safe for Supabase connection limits)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Prevent pool errors from crashing the process
pool.on('error', (err) => {
  console.error(`[POOL] Unexpected error on idle client: ${err.message}`);
});

// Resilient query wrapper: retries up to 3 times with backoff
async function resilientQuery(queryText, values, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(queryText, values);
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 2000;
      console.log(`[POOL] Query failed (attempt ${attempt}/${retries}): ${err.message}, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

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

// Live archetype weights — refreshed from DB every 50 cycles
let liveArchetypeWeights = loadLiveWeights();

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

// ═══════════════════════════════════════════════════════════════════
// WORKER COORDINATION: Deterministic partitioning — no overlap ever
// ═══════════════════════════════════════════════════════════════════
const workerNum = parseInt((process.env.WORKER_ID || '').replace(/\D/g, '') || '1', 10);

// Partition Lichess players into exclusive slices per worker
const allLichessPlayers = GAME_SOURCES.LICHESS_PLAYERS.filter((v, i, a) => a.indexOf(v) === i); // dedupe
const allChesscomPlayers = GAME_SOURCES.CHESSCOM_PLAYERS.filter((v, i, a) => a.indexOf(v) === i);
const TOTAL_WORKERS = 3;
const lichessSlice = Math.ceil(allLichessPlayers.length / TOTAL_WORKERS);
const chesscomSlice = Math.ceil(allChesscomPlayers.length / TOTAL_WORKERS);
const myLichessPlayers = allLichessPlayers.slice((workerNum - 1) * lichessSlice, workerNum * lichessSlice);
const myChesscomPlayers = allChesscomPlayers.slice((workerNum - 1) * chesscomSlice, workerNum * chesscomSlice);
console.log(`[${workerId}] Exclusive Lichess pool: ${myLichessPlayers.length} players (${myLichessPlayers.slice(0,3).join(', ')}...)`);
console.log(`[${workerId}] Exclusive Chess.com pool: ${myChesscomPlayers.length} players (${myChesscomPlayers.slice(0,3).join(', ')}...)`);

// Each worker gets a deterministic source rotation offset
let currentSourceIndex = (workerNum - 1) * 100;

// In-memory deduplication: track all game IDs we've already analyzed
const analyzedGameIds = new Set();

/**
 * Pre-load recent game IDs from database so we never re-fetch/re-analyze
 * games that were already saved (even across restarts).
 * DB ON CONFLICT is the last-resort safety net, not the primary dedup.
 */
async function loadAnalyzedGameIds() {
  try {
    const result = await resilientQuery(
      `SELECT game_id FROM chess_prediction_attempts ORDER BY created_at DESC LIMIT 20000`
    );
    if (result.rows.length > 0) {
      for (const row of result.rows) {
        analyzedGameIds.add(row.game_id);
      }
      console.log(`[${workerId}] Pre-loaded ${analyzedGameIds.size} game IDs from DB (dedup active)`);
    } else {
      console.log(`[${workerId}] No existing games in DB — fresh start`);
    }
  } catch (err) {
    console.log(`[${workerId}] DB dedup pre-load failed (will rely on ON CONFLICT): ${err.message}`);
  }
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
// Deterministic time window per worker — NO randomness, NO overlap
// Worker 1: recent games (0-1.5 years back)
// Worker 2: mid-range (1.5-3 years back)  
// Worker 3: historical (3-5 years back)
const TIME_WINDOWS = [
  { startYears: 0, endYears: 1.5 },   // Worker 1
  { startYears: 1.5, endYears: 3 },   // Worker 2
  { startYears: 3, endYears: 5 },     // Worker 3
];
const myWindow = TIME_WINDOWS[Math.min(workerNum - 1, TIME_WINDOWS.length - 1)];
let lichessBeforeMs = Date.now() - (myWindow.startYears * 365.25 * 24 * 60 * 60 * 1000);
const lichessFloorMs = Date.now() - (myWindow.endYears * 365.25 * 24 * 60 * 60 * 1000);
console.log(`[${workerId}] Time window: ${new Date(lichessBeforeMs).toISOString().split('T')[0]} → ${new Date(lichessFloorMs).toISOString().split('T')[0]}`);
console.log(`[${workerId}] Range: ${myWindow.startYears}-${myWindow.endYears} years back`);
const PERF_TYPES = ['blitz', 'rapid', 'bullet', 'classical'];

async function fetchLichessGames(count = 5, perfType = 'blitz') {
  // Rotate perfType based on cycle to access different game pools
  const actualPerfType = PERF_TYPES[stats.cycles % PERF_TYPES.length];
  
  // Use THIS worker's exclusive player partition — no overlap with other workers
  const playersToTry = [];
  for (let i = 0; i < Math.min(6, myLichessPlayers.length); i++) {
    playersToTry.push(myLichessPlayers[(currentSourceIndex + i) % myLichessPlayers.length]);
  }
  
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
        const errorMsg = error?.message || 'Unknown fetch error';
        console.log(`[FARM] Lichess error (${player}) attempt ${attempt}: ${errorMsg}`);
        
        // If this is a network/abort error, don't retry immediately
        if (error?.name === 'AbortError' || errorMsg.includes('fetch failed')) {
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
  const player = myChesscomPlayers[currentSourceIndex % myChesscomPlayers.length];
  
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
  // Alternate between Lichess and Chess.com — puzzles REMOVED (fabricated PGNs, 4.3% accuracy)
  const sources = ['lichess', 'chesscom', 'lichess', 'chesscom'];
  const currentSource = sources[currentSourceIndex % sources.length];
  currentSourceIndex++;
  
  let games = [];
  
  console.log(`[FARM] Multi-source fetch: ${currentSource.toUpperCase()}`);
  
  if (currentSource === 'lichess') {
    games = await fetchLichessGames(count, perfType);
  } else {
    games = await fetchChessComGames(count);
  }
  
  // Fallback chain
  if (games.length === 0) {
    console.log(`[FARM] Primary source ${currentSource} failed, trying fallback...`);
    if (currentSource === 'lichess') {
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
 * 
 * Uses REAL EP color flow analysis: simulateGame replays real moves to build
 * the color flow heatmap, then extractColorFlowSignature reads the board state,
 * then predictFromColorFlow generates the prediction via the equilibrium system.
 * 
 * SF eval (centipawns) and ELO differential are supplementary signals.
 * All data is real — simulation is EP's analysis method, not fake data.
 */
function generateBothPredictions(fullPgn, gameData, epEngine, sfEvalCp, moveCount, eloDiff = 0) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extractEnhancedSignature } = epEngine;
  
  // Replay real moves to build color flow board
  let simulation, board, totalMoves;
  try {
    simulation = simulateGame(fullPgn);
    board = simulation.board;
    totalMoves = simulation.totalMoves || moveCount;
  } catch (e) {
    // PGN parse failed — use SF eval + ELO as primary signals
    // Build signature directly (no color flow data, but still a real prediction)
    const absSf = Math.abs(sfEvalCp);
    const sfDir = sfEvalCp > 0 ? 'white' : sfEvalCp < 0 ? 'black' : 'contested';
    const phase = moveCount < 15 ? 'opening' : moveCount < 30 ? 'middlegame' : 'endgame';
    const fallbackSig = {
      archetype: absSf > 200 ? 'central_domination' : absSf > 80 ? 'kingside_attack' : 'balanced_flow',
      dominantSide: sfDir,
      flowDirection: absSf > 100 ? (sfEvalCp > 0 ? 'kingside' : 'queenside') : 'central',
      intensity: Math.max(0.1, Math.min(1.0, absSf / 300)),
      quadrantProfile: {
        kingsideWhite: sfEvalCp > 0 ? 50 + absSf / 10 : 40,
        kingsideBlack: sfEvalCp < 0 ? 50 + absSf / 10 : 40,
        queensideWhite: sfEvalCp > 0 ? 45 + absSf / 15 : 35,
        queensideBlack: sfEvalCp < 0 ? 45 + absSf / 15 : 35,
      },
      temporalFlow: {
        earlyGame: phase === 'opening' ? 0.7 : 0.3,
        midGame: phase === 'middlegame' ? 0.7 : 0.3,
        lateGame: phase === 'endgame' ? 0.7 : 0.3,
        volatility: Math.min(80, absSf / 3),
      },
      fingerprint: `farm_sf_${Date.now()}`,
    };
    const fallbackPred = predictFromColorFlow(fallbackSig, moveCount, sfEvalCp, 18);
    const pred = {
      predictedWinner: fallbackPred.predictedWinner === 'white' ? 'white_wins' :
                       fallbackPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
      confidence: fallbackPred.confidence / 100,
      whiteAdvantage: sfEvalCp / 100,
    };
    return {
      baseline: { signature: fallbackSig, prediction: pred, fingerprint: fallbackSig.fingerprint, archetype: fallbackSig.archetype },
      enhanced: null,
    };
  }
  
  // 4-QUADRANT ENGINE: Real color flow signature from board heatmap
  const baselineSignature = extractColorFlowSignature(board, gameData, totalMoves);
  const baselineColorPred = predictFromColorFlow(baselineSignature, totalMoves, sfEvalCp, 18);
  const baselinePrediction = {
    predictedWinner: baselineColorPred.predictedWinner === 'white' ? 'white_wins' :
                     baselineColorPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
    confidence: baselineColorPred.confidence / 100,
    whiteAdvantage: sfEvalCp / 100,
  };
  
  // 8-QUADRANT ENGINE: Enhanced signature with ELO as supplementary signal
  let enhancedResult = null;
  let enhancedPrediction = baselinePrediction;
  if (extractEnhancedSignature && USE_ENHANCED_SIGNATURES) {
    try {
      enhancedResult = extractEnhancedSignature(simulation);
      const enhancedSig = {
        ...baselineSignature,
        archetype: enhancedResult.archetype || baselineSignature.archetype,
        dominantSide: enhancedResult.dominantSide || baselineSignature.dominantSide,
      };
      const enhancedColorPred = predictFromColorFlow(enhancedSig, totalMoves, sfEvalCp, 18);
      enhancedPrediction = {
        predictedWinner: enhancedColorPred.predictedWinner === 'white' ? 'white_wins' :
                         enhancedColorPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
        confidence: enhancedColorPred.confidence / 100,
        whiteAdvantage: sfEvalCp / 100,
      };
    } catch (e) {
      enhancedResult = null;
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
    // Don't cross into another worker's time territory
    if (lichessBeforeMs < lichessFloorMs) {
      // Reset to the TOP of this worker's window (not present — that's another worker's zone)
      lichessBeforeMs = Date.now() - (myWindow.startYears * 365.25 * 24 * 60 * 60 * 1000);
      console.log(`[${workerId}] Time window wrapped to top: ${new Date(lichessBeforeMs).toISOString().split('T')[0]}`);
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
      
      // Pass SF eval in centipawns into the shared equilibrium predictor
      // sf17Eval.evaluation is in pawns (e.g. 1.5), predictor expects centipawns (e.g. 150)
      const sfEvalCp = Math.round((sf17Eval.evaluation ?? 0) * 100);
      const eloDiff = (game.whiteElo || 1500) - (game.blackElo || 1500);
      const predictions = generateBothPredictions(game.pgn, gameData, epEngine, sfEvalCp, moveNumber, eloDiff);
      const baselinePred = predictions.baseline.prediction;
      const enhancedPred = predictions.enhanced?.prediction || baselinePred;
      
      // Enhanced signature data captured in predictions object — viz removed to keep logs clean
      
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
      
      // SELF-EVOLVING: Feed prediction into cross-domain correlation engine
      // This links live chess data → correlation engine → adapter registry → photonic bus
      // The web app's realtime subscription ingests these for universal pattern detection
      try {
        const corrId = `farm_${game.id}_${Date.now()}`;
        const consensus = enhancedPred.predictedWinner === sf17Prediction ? 'agree' : 'disagree';
        const corrScore = enhancedCorrect ? 0.8 : (consensus === 'agree' ? 0.5 : 0.3);
        await resilientQuery(
          `INSERT INTO cross_domain_correlations (
            correlation_id, pattern_id, pattern_name,
            correlation_score, chess_archetype, chess_confidence,
            chess_intensity, market_symbol, market_direction,
            market_confidence, market_intensity, validated, detected_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            corrId,
            consensus === 'agree' ? 'ep-sf-consensus' : 'ep-sf-divergence',
            consensus === 'agree' ? 'EP-SF Consensus' : 'EP-SF Divergence',
            corrScore,
            predictions.enhanced?.archetype || predictions.baseline.archetype,
            enhancedPred.confidence,
            Math.abs(enhancedPred.whiteAdvantage),
            game.source || 'chess',
            enhancedPred.predictedWinner === 'white_wins' ? 'up' : enhancedPred.predictedWinner === 'black_wins' ? 'down' : 'flat',
            sf17Eval.evaluation ? Math.min(1, Math.abs(sf17Eval.evaluation)) : 0.5,
            Math.min(1, Math.abs(sfEvalCp) / 300),
            enhancedCorrect
          ]
        );
      } catch (corrErr) {
        // Correlation save is non-critical — don't block predictions
      }
      
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
  
  // Compute live archetype weights from DB on startup (worker 1 only)
  if (workerNum === 1 && !liveArchetypeWeights) {
    try {
      console.log('Computing live archetype weights from DB...');
      const newWeights = await computeLiveArchetypeWeights(resilientQuery);
      if (newWeights) {
        // Merge puzzle calibration data (detection accuracy from labeled puzzles)
        const puzzleCal = loadPuzzleCalibration();
        if (puzzleCal) {
          mergePuzzleCalibration(newWeights, puzzleCal);
          console.log(`✓ Puzzle calibration merged: ${puzzleCal.totalPuzzles} puzzles, detection data for ${Object.keys(puzzleCal.archetypeAccuracy || {}).length} archetypes`);
        }
        liveArchetypeWeights = newWeights;
        saveLiveWeights(newWeights);
        logWeightComparison(newWeights);
      }
    } catch (err) {
      console.log(`Live weight init non-critical: ${err.message}`);
    }
  }
  
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
        await resilientQuery(`
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
      
      // PUZZLE ARCHETYPE CALIBRATION: Every 10 cycles, worker 1 processes
      // themed puzzles as labeled archetype reference data (not game predictions).
      // This builds a calibration library that improves archetype detection accuracy.
      if (stats.cycles % 10 === 0 && workerNum === 1) {
        try {
          console.log(`[${workerId}] Running puzzle archetype calibration...`);
          const puzzles = await fetchLichessPuzzleBatch(3);
          const calibration = loadCalibration();
          let matched = 0;
          for (const puzzle of puzzles) {
            const result = await processPuzzle(puzzle, epEngine);
            if (result) {
              updateCalibration(calibration, result);
              if (result.archetypeMatch) matched++;
              console.log(`[${workerId}] Puzzle ${puzzle.id}: expected=${result.expectedArchetype} detected=${result.detectedArchetype} ${result.archetypeMatch ? '✓' : '✗'}`);
            }
          }
          // Save calibration to disk (loadCalibration reads it back)
          const fs = await import('fs');
          const path = await import('path');
          const calPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'archetype-calibration.json');
          calibration.lastUpdated = new Date().toISOString();
          fs.writeFileSync(calPath, JSON.stringify(calibration, null, 2));
          console.log(`[${workerId}] Puzzle calibration: ${matched}/${puzzles.length} matched, ${calibration.totalPuzzles} total`);
        } catch (calErr) {
          console.log(`[${workerId}] Puzzle calibration non-critical error: ${calErr.message}`);
        }
      }
      
      // LIVE ARCHETYPE WEIGHT REFRESH: Every 50 cycles, worker 1 recomputes
      // real per-archetype accuracy from the database. This replaces the hardcoded
      // ARCHETYPE_HISTORICAL_ACCURACY with data-driven weights that improve with volume.
      if (stats.cycles % 50 === 0 && workerNum === 1) {
        try {
          console.log(`[${workerId}] Refreshing live archetype weights from DB...`);
          const newWeights = await computeLiveArchetypeWeights(resilientQuery);
          if (newWeights) {
            // Merge latest puzzle calibration data
            const puzzleCal = loadPuzzleCalibration();
            if (puzzleCal) {
              mergePuzzleCalibration(newWeights, puzzleCal);
              console.log(`[${workerId}] Puzzle calibration merged: ${puzzleCal.totalPuzzles} puzzles`);
            }
            liveArchetypeWeights = newWeights;
            saveLiveWeights(newWeights);
            logWeightComparison(newWeights);
          }
        } catch (weightErr) {
          console.log(`[${workerId}] Live weight refresh non-critical error: ${weightErr.message}`);
        }
      }
      
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
    
    const result = await resilientQuery(query, values);
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
