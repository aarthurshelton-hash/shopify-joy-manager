#!/usr/bin/env node
/**
 * En Pensent EP Bulk Worker — Mass Volume Chess Ingestion
 * 
 * Two modes for absorbing billions of games:
 * 
 * MODE 1: BULK DATABASE (100x throughput)
 *   Downloads and stream-parses Lichess monthly PGN database dumps.
 *   80-100M rated games/month. Zero API rate limits.
 *   Usage: node ep-bulk-worker.mjs --mode=bulk --month=2025-01
 *   Or with local file: node ep-bulk-worker.mjs --mode=bulk --file=/path/to/games.pgn
 * 
 * MODE 2: TOURNAMENT FETCHING (10x throughput)
 *   Auto-discovers and fetches entire Lichess arena tournaments.
 *   100-500 unique games per tournament, tournaments every hour.
 *   Usage: node ep-bulk-worker.mjs --mode=tournament
 * 
 * Both modes feed into the same EP v9.3 engine pipeline with batch DB writes.
 * 
 * Lichess Database: https://database.lichess.org/
 * Format: .pgn.zst (Zstandard compressed PGN)
 * Eval annotations: [%eval X.XX] embedded in move comments
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;
import { Chess } from 'chess.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync, createWriteStream, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { createInterface } from 'readline';
import { spawn, exec } from 'child_process';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import crypto from 'crypto';
import { getIntelligentFusionWeights, shouldSuppressEnhancedDraw } from './fusion-intelligence.mjs';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '..', '.env');
import fs from 'fs';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// ═══════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════

const CONFIG = {
  // Mode: 'bulk', 'tournament', or 'grandmaster'
  mode: process.argv.find(a => a.startsWith('--mode='))?.split('=')[1] || 'tournament',
  
  // Bulk mode: month to download (YYYY-MM) or local file path
  bulkMonth: process.argv.find(a => a.startsWith('--month='))?.split('=')[1] || null,
  bulkFile: process.argv.find(a => a.startsWith('--file='))?.split('=')[1] || null,
  
  // Filters
  minElo: parseInt(process.argv.find(a => a.startsWith('--min-elo='))?.split('=')[1] || '1500'),
  requireEval: false,                    // false = process games without eval (use color flow only)
  timeControls: ['blitz', 'rapid', 'classical', 'standard'],  // Skip bullet/ultrabullet
  
  // Processing
  batchSize: 100,                        // DB write batch size (Pro tier)
  maxGamesPerSession: parseInt(process.argv.find(a => a.startsWith('--max='))?.split('=')[1] || '0') || Infinity,
  moveAnalysisRange: { min: 12, max: 55 },  // Move range for analysis point selection (raised from 8 — opening <12 is near-random noise)
  
  // Tournament mode
  tournamentTypes: ['hourly', 'daily', 'weekly', 'arena'],
  tournamentMinPlayers: 20,
  
  // Grandmaster mode: TWIC + Lichess Elite + major event archives
  twicStartIssue: parseInt(process.argv.find(a => a.startsWith('--twic-start='))?.split('=')[1] || '1520'),
  twicEndIssue: parseInt(process.argv.find(a => a.startsWith('--twic-end='))?.split('=')[1] || '1575'),
  // TWIC issues: ~920 (2013) to 1575+ (2026). Each has ~2000 GM games.
  // 1520-1575 = ~55 issues × 2000 games = ~110,000 GM games
  // Full archive 920-1575 = ~655 issues × 2000 = ~1.3 million GM games
  
};

const workerId = process.env.WORKER_ID || 'ep-bulk-1';

// ═══════════════════════════════════════════════════════
// DATABASE CONNECTION (Direct SQL — same as ep-enhanced-worker)
// ═══════════════════════════════════════════════════════

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.error('[BULK] Pool error (non-fatal):', err.message);
  });
  console.log('[BULK] ✓ Direct SQL connection active');
} else {
  console.log('[BULK] ⚠ No DATABASE_URL — running in dry-run mode (no DB writes)');
}

// Graceful shutdown — drain pool before exit to prevent zombie connections
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    console.log(`[BULK] ${sig} received — draining pool...`);
    try { if (pool) await pool.end(); } catch {}
    process.exit(0);
  });
}

// Fast-fail codes: no point retrying constraint violations
const FAST_FAIL_CODES = new Set(['23505', '23514', '23502']);

async function resilientQuery(text, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      // Fast-fail on constraint violations — retrying won't help
      if (FAST_FAIL_CODES.has(err?.code)) throw err;
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ═══════════════════════════════════════════════════════
// LIGHTWEIGHT BATCH DEDUP — no heavy preload, just batch-check
// ═══════════════════════════════════════════════════════

// Session-only cache — IDs we've already checked or saved this session
const knownGameIds = new Set();

/** Lightweight init — no preload needed, batch-check handles dedup */
async function preloadKnownGameIds() {
  console.log(`[${workerId}] Using lightweight batch dedup (no preload)`);
}

/**
 * Check a batch of game IDs against the DB.
 * Returns Set of IDs that already exist (should be skipped).
 */
async function checkDuplicateBatch(gameIds) {
  if (!pool || gameIds.length === 0) return new Set();
  const toCheck = gameIds.filter(id => !knownGameIds.has(id));
  if (toCheck.length === 0) return new Set();
  const existingIds = new Set();
  try {
    const result = await resilientQuery(
      `SELECT game_id FROM chess_prediction_attempts WHERE game_id = ANY($1)`,
      [toCheck]
    );
    for (const row of result.rows) {
      existingIds.add(row.game_id);
      knownGameIds.add(row.game_id); // Cache for session
    }
  } catch (err) {
    console.error(`[${workerId}] Dedup batch check failed: ${err.message}`);
  }
  return existingIds;
}

/** FEN validation regex — must match DB constraint */
const FEN_REGEX = /^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/;

// ═══════════════════════════════════════════════════════
// LOCAL STOCKFISH 18 ENGINE
// ═══════════════════════════════════════════════════════

let stockfishProcess = null;
let engineReady = false;
const SF_DEPTH = parseInt(process.argv.find(a => a.startsWith('--sf-depth='))?.split('=')[1] || '14');

async function initStockfish() {
  if (!stockfishProcess) {
    console.log('[BULK] Starting local Stockfish 18...');
    stockfishProcess = spawn('stockfish', [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    stockfishProcess.on('error', (err) => {
      console.error('[BULK] Stockfish spawn error:', err.message);
      engineReady = false;
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stockfish init timeout'));
      }, 10000);
      
      const onData = (data) => {
        const output = data.toString();
        if (output.includes('Stockfish') || output.includes('uciok')) {
          clearTimeout(timeout);
          stockfishProcess.stdout.off('data', onData);
          engineReady = true;
          console.log(`[BULK] ✓ Stockfish 18 ready (depth ${SF_DEPTH})`);
          resolve();
        }
      };
      
      stockfishProcess.stdout.on('data', onData);
      stockfishProcess.stdin.write('uci\nisready\n');
    });
  }
  return stockfishProcess;
}

async function evaluateWithStockfish(fen, depth = SF_DEPTH) {
  try {
    const engine = await initStockfish();
    if (!engineReady) throw new Error('Engine not ready');
    
    // v29.1 FIX: SF returns eval from side-to-move perspective. Normalize to white's.
    const sideToMove = (fen || '').split(' ')[1] || 'w';
    const flipSign = sideToMove === 'b' ? -1 : 1;
    
    return new Promise((resolve, reject) => {
      let evaluation = 0;
      let currentDepth = 0;
      let bestMove = 'e2e4';
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          engine.stdout.off('data', onData);
          resolve({ evaluation: 0, depth: 0, bestMove: 'e2e4', source: 'timeout' });
        }
      }, 10000);
      
      const onData = (data) => {
        if (resolved) return;
        const lines = data.toString().split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('bestmove')) {
            const parts = trimmed.split(' ');
            if (parts.length >= 2) bestMove = parts[1];
            
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              engine.stdout.off('data', onData);
              // v29.1: Normalize to white's perspective
              resolve({ evaluation: evaluation * flipSign, depth: currentDepth, bestMove, source: 'stockfish_18' });
            }
          }
          
          if (trimmed.includes('score cp')) {
            const match = trimmed.match(/score cp (-?\d+)/);
            if (match) evaluation = parseInt(match[1]) / 100;
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
            if (match) currentDepth = parseInt(match[1]);
          }
        }
      };
      
      engine.stdout.on('data', onData);
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${depth}\n`);
    });
  } catch (error) {
    return evaluateMaterialFallback(fen);
  }
}

function evaluateMaterialFallback(fen) {
  const pieces = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let whiteScore = 0, blackScore = 0;
  const position = (fen || '').split(' ')[0] || '';
  
  for (const char of position) {
    if (pieces[char.toLowerCase()]) {
      if (char === char.toLowerCase()) blackScore += pieces[char.toLowerCase()];
      else whiteScore += pieces[char.toLowerCase()];
    }
  }
  
  return {
    evaluation: (whiteScore - blackScore) / 10,
    depth: 0,
    bestMove: 'e2e4',
    source: 'material_count'
  };
}

// ═══════════════════════════════════════════════════════
// EP ENGINE LOADER
// ═══════════════════════════════════════════════════════

async function loadEPEngine() {
  const distPath = join(__dirname, '..', 'dist', 'lib', 'chess');
  
  const colorFlowModule = await import(join(distPath, 'colorFlowAnalysis', 'index.js'));
  const gameSimModule = await import(join(distPath, 'gameSimulator.js'));
  
  let enhancedModule = null;
  try {
    enhancedModule = await import(join(distPath, 'colorFlowAnalysis', 'enhancedSignatureExtractor.js'));
  } catch (e) {
    console.log('[BULK] Enhanced signatures not available, using baseline only');
  }
  
  return {
    extractColorFlowSignature: colorFlowModule.extractColorFlowSignature,
    predictFromColorFlow: colorFlowModule.predictFromColorFlow,
    simulateGame: gameSimModule.simulateGame,
    extractEnhancedSignature: enhancedModule?.extractEnhancedColorFlowSignature || null,
  };
}

// ═══════════════════════════════════════════════════════
// PGN STREAMING PARSER
// ═══════════════════════════════════════════════════════

/**
 * Parse a Lichess PGN stream into individual game objects.
 * Handles eval annotations, clock data, and all standard headers.
 * 
 * Lichess PGN format:
 *   [Event "Rated Blitz game"]
 *   [Site "https://lichess.org/abcd1234"]
 *   [White "Player1"]
 *   [BlackElo "2345"]
 *   ...
 *   1. e4 { [%eval 0.17] [%clk 0:05:00] } 1... c5 { [%eval 0.31] } ...
 * 
 * Yields: { headers: {}, moves: "1. e4 c5 ...", pgn: "full pgn", evals: [0.17, 0.31, ...] }
 */
async function* parseStreamingPGN(readableStream) {
  const rl = createInterface({ input: readableStream, crlfDelay: Infinity });
  
  // State machine: IDLE -> HEADERS -> MOVES -> yield -> IDLE
  let headers = {};
  let movesLines = [];
  let headerLines = [];
  let state = 'IDLE'; // IDLE, HEADERS, GAP, MOVES
  
  function* yieldGame() {
    if (Object.keys(headers).length > 0 && movesLines.length > 0) {
      const moveText = movesLines.join(' ');
      const evals = extractEvalsFromMoves(moveText);
      const fullPgn = headerLines.join('\n') + '\n\n' + movesLines.join('\n');
      yield {
        headers: { ...headers },
        moves: cleanMoves(moveText),
        pgn: fullPgn,
        evals,
        id: extractGameId(headers),
      };
    }
    headers = {};
    movesLines = [];
    headerLines = [];
    state = 'IDLE';
  }
  
  for await (const line of rl) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      // Empty line
      if (state === 'HEADERS') {
        state = 'GAP'; // Gap between headers and moves
      } else if (state === 'MOVES') {
        // End of game — yield it
        yield* yieldGame();
      }
      continue;
    }
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      // Header line
      const match = trimmed.match(/^\[(\w+)\s+"(.*)"\]$/);
      if (match) {
        if (state === 'MOVES') {
          // New game starting while in moves — yield previous game first
          yield* yieldGame();
        }
        state = 'HEADERS';
        headers[match[1]] = match[2];
        headerLines.push(trimmed);
      }
    } else if (state === 'GAP' || state === 'MOVES' || state === 'HEADERS') {
      // Move line (can appear after gap or continue moves)
      state = 'MOVES';
      movesLines.push(trimmed);
    }
  }
  
  // Yield last game at end of stream
  yield* yieldGame();
}

/**
 * Extract eval annotations from Lichess PGN move text.
 * Format: { [%eval 0.17] } or { [%eval #3] } for mate
 * Returns array of centipawn evals indexed by half-move number.
 */
function extractEvalsFromMoves(moveText) {
  const evals = [];
  const evalRegex = /\[%eval\s+([#\-\d.]+)\]/g;
  let match;
  
  while ((match = evalRegex.exec(moveText)) !== null) {
    const evalStr = match[1];
    if (evalStr.startsWith('#')) {
      // Mate score — convert to large centipawn value
      const mateIn = parseInt(evalStr.substring(1));
      evals.push(mateIn > 0 ? 10000 : -10000);
    } else {
      // Centipawn eval (Lichess stores as pawns, e.g., 0.17 = 17cp)
      evals.push(Math.round(parseFloat(evalStr) * 100));
    }
  }
  
  return evals;
}

/**
 * Remove eval/clock annotations from move text for clean PGN.
 */
function cleanMoves(moveText) {
  return moveText
    .replace(/\{[^}]*\}/g, '')  // Remove all comments/annotations
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim();
}

/**
 * Extract game ID from Lichess headers.
 */
function extractGameId(headers) {
  // Lichess GameId header (tournament games)
  if (headers.GameId) return headers.GameId;
  
  // Lichess Site header: "https://lichess.org/abcd1234"
  const site = headers.Site || '';
  const lichessMatch = site.match(/lichess\.org\/(\w+)/);
  if (lichessMatch) return lichessMatch[1];
  
  // Fallback: hash of key headers for uniqueness
  const key = `${headers.White}_${headers.Black}_${headers.Date}_${headers.UTCTime || ''}_${headers.Result}`;
  return 'bulk_' + crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
}

// ═══════════════════════════════════════════════════════
// GAME FILTER
// ═══════════════════════════════════════════════════════

function shouldProcessGame(game) {
  const h = game.headers;
  
  // Must have result
  if (!h.Result || h.Result === '*') return false;
  
  // Must be rated (tournament games don't say 'rated' in Event, but they are rated)
  const eventLower = (h.Event || '').toLowerCase();
  if (eventLower.includes('casual') || eventLower.includes('unrated')) return false;
  
  // ELO filter
  const whiteElo = parseInt(h.WhiteElo) || 0;
  const blackElo = parseInt(h.BlackElo) || 0;
  const avgElo = (whiteElo + blackElo) / 2;
  if (avgElo < CONFIG.minElo) return false;
  
  // Time control filter — skip ultrabullet/hyperbullet (too noisy for prediction)
  // SuperBlitz (60-120s) and above are fine — only exclude < 60s
  if (eventLower.includes('ultrabullet') || eventLower.includes('hyperbullet')) return false;
  const tc = h.TimeControl || '';
  const tcMatch = tc.match(/(\d+)/);
  if (tcMatch && parseInt(tcMatch[1]) < 60 && !eventLower.includes('rapid')) return false;
  
  // Must have eval annotations (if required — disabled by default for tournament mode)
  if (CONFIG.requireEval && game.evals.length < 5) return false;
  
  return true;
}

// ═══════════════════════════════════════════════════════
// EP PREDICTION PIPELINE
// ═══════════════════════════════════════════════════════

/**
 * Select analysis move number from weighted zones.
 * Opening: 8-14, Middlegame: 15-28, Endgame: 29-55
 * Weighted toward middlegame where predictions are most meaningful.
 */
function selectMoveNumber(totalMoves) {
  const maxMove = Math.min(totalMoves - 2, CONFIG.moveAnalysisRange.max);
  const minMove = CONFIG.moveAnalysisRange.min;
  if (maxMove <= minMove) return Math.max(minMove, Math.floor(totalMoves / 2));
  
  // v10: Favor move 25-50 (65.8% acc) but keep 25% early for informational evolution.
  // Early data trains opening pattern recognition — needed for cross-domain learning.
  // 25% early (8-19), 25% mid (20-30), 50% late sweet spot (30-50)
  const r = Math.random();
  if (r < 0.25) {
    // Early: move 8-19 (25% — informational evolution for opening patterns)
    const earlyMax = Math.min(19, maxMove);
    return minMove + Math.floor(Math.random() * (earlyMax - minMove + 1));
  } else if (r < 0.50) {
    // Mid: move 20-30 (25%)
    const midStart = Math.min(20, maxMove);
    const midEnd = Math.min(30, maxMove);
    return midStart + Math.floor(Math.random() * (midEnd - midStart + 1));
  } else {
    // Late sweet spot: move 30-50 (50% — highest accuracy zone)
    const lateStart = Math.min(30, maxMove);
    return lateStart + Math.floor(Math.random() * (maxMove - lateStart + 1));
  }
}

/**
 * Process a single game through the EP engine.
 * Returns prediction attempt object ready for DB insertion.
 */
async function processGame(game, moveNumber, epEngine) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extractEnhancedSignature } = epEngine;
  
  // Build PGN with headers for simulation
  const headerLines = Object.entries(game.headers)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join('\n');
  const fullPgn = headerLines + '\n\n' + game.moves;
  
  // Play through moves with chess.js to get real FEN at analysis point
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  try {
    const chess = new Chess();
    // Parse move tokens from clean PGN
    const moveTokens = game.moves
      .replace(/\{[^}]*\}/g, '')  // Remove annotations
      .replace(/\d+\.+/g, '')     // Remove move numbers
      .split(/\s+/)
      .filter(t => t && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/));
    
    const targetHalfMove = moveNumber * 2;  // Approximate half-moves
    for (let i = 0; i < Math.min(targetHalfMove, moveTokens.length); i++) {
      const result = chess.move(moveTokens[i]);
      if (!result) break;
    }
    fen = chess.fen();
  } catch (e) {
    // FEN generation failed — use starting position
  }
  
  // Get SF18 eval: prefer PGN annotations, fall back to local Stockfish engine
  let sfEvalCp = 0;
  let hasRealEval = false;
  
  if (game.evals.length > 0) {
    // Use eval from PGN annotations (Lichess games with server analysis)
    const evalIndex = Math.min(moveNumber * 2 - 2, game.evals.length - 1);
    sfEvalCp = evalIndex >= 0 ? game.evals[evalIndex] : 0;
    hasRealEval = true;
  } else {
    // Run local Stockfish 18 on the position
    const sfResult = await evaluateWithStockfish(fen, SF_DEPTH);
    sfEvalCp = Math.round(sfResult.evaluation * 100);  // Convert pawns → centipawns
    hasRealEval = sfResult.source !== 'material_count';
  }
  
  // Simulate and extract signature
  let simulation, board, totalMoves;
  try {
    simulation = simulateGame(fullPgn);
    board = simulation.board;
    totalMoves = simulation.totalMoves || moveNumber;
  } catch (e) {
    return null; // PGN parse failed
  }
  
  // Baseline (4-quadrant)
  const gameData = {
    white: game.headers.White || 'Unknown',
    black: game.headers.Black || 'Unknown',
    pgn: fullPgn,
  };
  const baselineSig = extractColorFlowSignature(board, gameData, totalMoves);
  const baselinePred = predictFromColorFlow(baselineSig, totalMoves, sfEvalCp, 18);
  const baselineResult = {
    predictedWinner: baselinePred.predictedWinner === 'white' ? 'white_wins' :
                     baselinePred.predictedWinner === 'black' ? 'black_wins' : 'draw',
    confidence: baselinePred.confidence / 100,
  };
  
  // Enhanced (8-quadrant)
  let enhancedResult = baselineResult;
  let enhancedSig = null;
  if (extractEnhancedSignature) {
    try {
      enhancedSig = extractEnhancedSignature(simulation);
      if (!processGame._enhExtractOk) processGame._enhExtractOk = 0;
      processGame._enhExtractOk++;
    } catch (e) {
      if (!processGame._enhExtractFail) processGame._enhExtractFail = 0;
      processGame._enhExtractFail++;
      if (processGame._enhExtractFail <= 5) {
        console.error(`[BULK] Enhanced extraction failed (${processGame._enhExtractFail}): ${e.message}`);
      }
    }
    // Periodic diagnostic: extraction success rate
    const totalAttempts = (processGame._enhExtractOk || 0) + (processGame._enhExtractFail || 0);
    if (totalAttempts > 0 && totalAttempts % 200 === 0) {
      const hasProfile = enhancedSig?.enhancedProfile ? 'yes' : 'no';
      console.log(`[BULK] 8Q extraction: ${processGame._enhExtractOk || 0}/${totalAttempts} ok (${((processGame._enhExtractOk || 0) / totalAttempts * 100).toFixed(1)}%) | last has enhancedProfile: ${hasProfile}`);
    }
    if (enhancedSig) {
      try {
        const enhancedPred = predictFromColorFlow(enhancedSig, totalMoves, sfEvalCp, 18);
        enhancedResult = {
          predictedWinner: enhancedPred.predictedWinner === 'white' ? 'white_wins' :
                           enhancedPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
          confidence: enhancedPred.confidence / 100,
        };
      } catch (e) {
        // Prediction failed but enhancedSig (with 8q profile) is preserved for DB storage
        if (!processGame._enhPredFail) processGame._enhPredFail = 0;
        processGame._enhPredFail++;
        if (processGame._enhPredFail <= 3) {
          console.error(`[BULK] Enhanced prediction failed (${processGame._enhPredFail}): ${e.message}`);
        }
      }
    }
  }
  
  // SF18 prediction from eval (±30cp threshold = 0.3 pawns, matching existing workers)
  const sf17Prediction = sfEvalCp > 30 ? 'white_wins' : sfEvalCp < -30 ? 'black_wins' : 'draw';
  
  // Actual outcome
  const result = game.headers.Result;
  const actualOutcome = result === '1-0' ? 'white_wins' : result === '0-1' ? 'black_wins' : 
                        result === '1/2-1/2' ? 'draw' : null;
  if (!actualOutcome) return null;
  
  // Generate position hash from FEN
  const positionHash = crypto.createHash('sha256').update(fen).digest('hex').substring(0, 16);
  
  // ─── v13: INTELLIGENT HYBRID FUSION ───
  // Archetype-specific + time-control-aware + game-phase-aware weights
  const fusionArchetype = enhancedSig?.archetype || baselineSig.archetype;
  const fw = getIntelligentFusionWeights(fusionArchetype, game.headers.TimeControl || null, moveNumber, null, hasRealEval ? sfEvalCp : null);
  const votes = { white_wins: 0, black_wins: 0, draw: 0 };
  const baseConf = baselineResult.confidence;
  const enhConf = enhancedResult.confidence;
  const sfConf = hasRealEval ? Math.min(0.95, 0.5 + Math.abs(sfEvalCp) / 500) : 0.3;
  
  // v17: Enhanced draw suppression
  const drawSuppress = shouldSuppressEnhancedDraw(enhancedResult.predictedWinner, fusionArchetype, hasRealEval ? sfEvalCp : null, moveNumber);
  if (drawSuppress.suppress) {
    votes[baselineResult.predictedWinner] += (fw.baselineWeight + fw.enhancedWeight) * baseConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
  } else {
    votes[baselineResult.predictedWinner] += fw.baselineWeight * baseConf;
    votes[enhancedResult.predictedWinner] += fw.enhancedWeight * enhConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
  }
  
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const hybridPrediction = sortedVotes[0][0];
  const hybridRawConf = sortedVotes[0][1] / (sortedVotes[0][1] + sortedVotes[1][1] + sortedVotes[2][1] + 0.001);
  
  // Agreement bonus: when all 3 engines agree, boost confidence
  const allAgree = baselineResult.predictedWinner === enhancedResult.predictedWinner && 
                   enhancedResult.predictedWinner === sf17Prediction;
  const twoAgree = (baselineResult.predictedWinner === enhancedResult.predictedWinner) ||
                   (enhancedResult.predictedWinner === sf17Prediction) ||
                   (baselineResult.predictedWinner === sf17Prediction);
  let hybridConf = hybridRawConf;
  if (allAgree) hybridConf = Math.min(0.69, hybridConf * 1.15);
  else if (!twoAgree) hybridConf *= 0.75; // All disagree → low confidence
  
  // Calibration: cap at 0.69 (70+ bucket drops 19pp in accuracy data)
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));
  
  return {
    gameId: game.id,
    gameName: `${game.headers.White} vs ${game.headers.Black}`,
    moveNumber,
    fen,
    positionHash,
    sfEvalCp,
    sf17Prediction,
    sf17Correct: sf17Prediction === actualOutcome,
    hasRealEval,
    baselinePrediction: baselineResult.predictedWinner,
    baselineCorrect: baselineResult.predictedWinner === actualOutcome,
    baselineArchetype: baselineSig.archetype,
    enhancedPrediction: enhancedResult.predictedWinner,
    enhancedCorrect: enhancedResult.predictedWinner === actualOutcome,
    enhancedArchetype: enhancedSig?.archetype || baselineSig.archetype,
    enhancedConfidence: enhancedResult.confidence,
    // Rich features from enhanced signature (8-quad profile, piece metrics, complexity)
    colorRichness: enhancedSig?.colorRichness || 0,
    complexity: enhancedSig?.complexity || 0,
    eightQuadrantProfile: enhancedSig?.enhancedProfile || null,
    pieceTypeMetrics: enhancedSig?.enhancedProfile ? {
      bishopDominance: enhancedSig.enhancedProfile.bishop_dominance,
      knightDominance: enhancedSig.enhancedProfile.knight_dominance,
      rookDominance: enhancedSig.enhancedProfile.rook_dominance,
      queenDominance: enhancedSig.enhancedProfile.queen_dominance,
      pawnAdvancement: enhancedSig.enhancedProfile.pawn_advancement,
    } : null,
    // Real hybrid: fusion of baseline + enhanced + SF
    hybridPrediction,
    hybridCorrect: hybridPrediction === actualOutcome,
    hybridConfidence: hybridConf,
    actualOutcome,
    dataSource: CONFIG.mode === 'bulk' ? 'lichess_db' : CONFIG.mode === 'grandmaster' ? 'lichess_gm' : 'lichess_tournament',
    whiteElo: parseInt(game.headers.WhiteElo) || null,
    blackElo: parseInt(game.headers.BlackElo) || null,
    timeControl: game.headers.TimeControl || null,
    pgn: fullPgn.substring(0, 5000),  // Cap PGN storage size
    // Schema parity with chess-db-ingest-worker
    whitePlayer: game.headers.White || null,
    blackPlayer: game.headers.Black || null,
    gameType: 'PvP',
    lessonLearned: {
      white_player: game.headers.White || null,
      black_player: game.headers.Black || null,
      eco: game.headers.ECO || null,
      opening: game.headers.Opening || null,
      event: game.headers.Event || null,
      time_of_day: null,
      avg_elo: (parseInt(game.headers.WhiteElo) && parseInt(game.headers.BlackElo))
        ? Math.round((parseInt(game.headers.WhiteElo) + parseInt(game.headers.BlackElo)) / 2)
        : null,
    },
  };
}

// ═══════════════════════════════════════════════════════
// BATCH DB WRITER
// ═══════════════════════════════════════════════════════

const pendingBatch = [];
let dbSaved = 0;
let dbDupes = 0;
let dbFenInvalid = 0;

async function batchInsert(attempts) {
  if (!pool || attempts.length === 0) return;
  
  // Fire all inserts concurrently — network latency is the bottleneck, not DB processing
  const insertPromises = attempts.map(async (a, idx) => {
    // FEN validation — skip invalid FENs before hitting DB constraint
    if (!a.fen || typeof a.fen !== 'string' || a.fen.length <= 20 || !FEN_REGEX.test(a.fen)) {
      dbFenInvalid++;
      return;
    }
    
    // In-memory dedup — skip if we already know this game
    if (knownGameIds.has(a.gameId)) {
      dbDupes++;
      return;
    }
    
    try {
      // Plain INSERT (no ON CONFLICT) — PgBouncer compatible
      // Catch 23505 (duplicate) at the error handler level
      // Compute baseline_vs_enhanced_delta
      const enhDelta = (a.enhancedCorrect === true && a.baselineCorrect === false) ? 1 :
                       (a.enhancedCorrect === false && a.baselineCorrect === true) ? -1 : 0;
      const result = await resilientQuery(
        `/* bulk-v5-fullschema */ INSERT INTO chess_prediction_attempts (
          game_id, game_name, move_number, fen, position_hash,
          stockfish_eval, stockfish_depth,
          stockfish_prediction, stockfish_confidence, stockfish_correct,
          hybrid_prediction, hybrid_confidence, hybrid_archetype, hybrid_correct,
          enhanced_prediction, enhanced_correct, enhanced_archetype, enhanced_confidence,
          baseline_prediction, baseline_correct,
          actual_result, data_quality_tier, worker_id, data_source,
          white_elo, black_elo, time_control, pgn,
          baseline_vs_enhanced_delta,
          eight_quadrant_profile, piece_type_metrics, color_richness, complexity_score,
          lesson_learned, white_player, black_player, game_type,
          created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,NOW())
        ON CONFLICT (game_id) DO NOTHING`,
        [
          a.gameId,
          a.gameName,
          a.moveNumber,
          a.fen,
          a.positionHash,
          Math.max(-9999, Math.min(9999, a.sfEvalCp || 0)),
          a.hasRealEval ? 18 : 0,
          a.sf17Prediction || 'unknown',
          a.hasRealEval ? Math.round(Math.min(95, 50 + Math.abs((a.sfEvalCp || 0) / 100) * 10)) : 0,
          a.sf17Correct ?? false,
          a.hybridPrediction || a.enhancedPrediction,
          Math.round(Math.min(69, Math.max(15, (a.hybridConfidence || a.enhancedConfidence || 0.5) * 100))),
          a.enhancedArchetype || 'unknown',
          a.hybridCorrect ?? a.enhancedCorrect,
          a.enhancedPrediction,
          a.enhancedCorrect,
          a.enhancedArchetype || null,
          parseFloat(Math.min(0.69, Math.max(0.15, a.enhancedConfidence || 0.5)).toFixed(2)),
          a.baselinePrediction,
          a.baselineCorrect,
          a.actualOutcome,
          a.dataSource === 'lichess_db' ? 'farm_bulk_8quad' : 
            a.dataSource === 'lichess_gm' ? 'farm_gm_8quad' : 'farm_tournament_8quad',
          workerId,
          a.dataSource || 'unknown',
          a.whiteElo,
          a.blackElo,
          a.timeControl,
          (a.pgn || '').substring(0, 5000),
          enhDelta,
          a.eightQuadrantProfile ? JSON.stringify(a.eightQuadrantProfile) : null,
          a.pieceTypeMetrics ? JSON.stringify(a.pieceTypeMetrics) : null,
          Math.min(9.9999, Math.max(0, parseFloat(a.colorRichness) || 0)),
          Math.min(9.9999, Math.max(0, (parseFloat(a.complexity) || 0) / 100)),
          a.lessonLearned ? JSON.stringify(a.lessonLearned) : null,
          a.whitePlayer || null,
          a.blackPlayer || null,
          a.gameType || 'PvP',
        ]
      );
      
      if (result.rowCount > 0) {
        dbSaved++;
        // Session-aware dedup: add to Set after successful save
        knownGameIds.add(a.gameId);
        // Cross-domain correlation — every 20th saved game (real scores, not hardcoded)
        if (dbSaved % 20 === 0) {
          try {
            // Real correlation score: based on engine agreement + confidence + position complexity
            const enginesAgree = a.baselineCorrect === a.enhancedCorrect;
            const sfAgrees = a.sf17Correct === a.enhancedCorrect;
            const allAgree = enginesAgree && sfAgrees;
            const confLevel = a.hybridConfidence || a.enhancedConfidence || 0.5;
            const posComplexity = Math.min(1, Math.abs((a.sfEvalCp || 0)) / 300);
            // Real score: weighted by confidence, agreement, and whether prediction was correct
            const realScore = (
              (confLevel * 0.4) +                         // How confident were we?
              (allAgree ? 0.25 : enginesAgree ? 0.15 : 0) + // Did engines agree?
              (a.enhancedCorrect ? 0.25 : 0) +            // Were we right?
              (posComplexity > 0.3 ? 0.10 : 0)            // Was it a complex position?
            );
            await resilientQuery(
              `INSERT INTO cross_domain_correlations (
                correlation_id, pattern_id, pattern_name,
                correlation_score, chess_archetype, chess_confidence,
                chess_intensity, market_symbol, market_direction,
                market_confidence, market_intensity, validated, detected_at
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
              [
                `bulk_${a.gameId}_${Date.now()}`,
                allAgree ? 'consensus-correct' : a.enhancedCorrect ? 'ep-correct' : 'ep-incorrect',
                allAgree ? 'All Engines Agree (Correct)' : a.enhancedCorrect ? 'EP Correct' : 'EP Incorrect',
                Math.min(9.99, Math.round(realScore * 100) / 100),
                a.enhancedArchetype || 'unknown',
                Math.min(9.99, Math.round((a.enhancedConfidence || 0.5) * 100) / 100),
                Math.min(9.99, posComplexity),
                `chess:${a.dataSource || 'lichess_db'}`,
                a.enhancedPrediction === 'white_wins' ? 'up' : a.enhancedPrediction === 'black_wins' ? 'down' : 'flat',
                Math.min(9.99, Math.round(confLevel * 100) / 100),
                Math.min(9.99, posComplexity),
                a.enhancedCorrect
              ]
            );
          } catch (corrErr) { /* non-critical */ }
        }
      }
    } catch (err) {
      if (err?.code === '23505') {
        dbDupes++;
        knownGameIds.add(a.gameId); // Now known — don't retry
      } else if (err?.code === '23514' || err?.code === '23502') {
        dbFenInvalid++; // Count constraint violations
        if (dbFenInvalid <= 5) {
          console.error(`[${workerId}] Constraint violation (${err.code}): ${err.message?.substring(0, 200)}`);
        }
      } else {
        console.error(`[${workerId}] DB error (${err?.code}): ${err?.message}`);
      }
    }
  });
  
  await Promise.allSettled(insertPromises);
}

async function flushBatch() {
  if (pendingBatch.length === 0) return;
  const batch = pendingBatch.splice(0, pendingBatch.length);
  const beforeSaved = dbSaved;
  await batchInsert(batch);
  const newSaved = dbSaved - beforeSaved;
  if (dbSaved % 50 === 0 || newSaved === 0) {
    console.log(`[${workerId}] Flush: ${batch.length} attempted | Saved: ${dbSaved} | Dupes: ${dbDupes} | FEN/Constraint: ${dbFenInvalid}`);
  }
}

// ═══════════════════════════════════════════════════════
// MODE 1: BULK DATABASE INGESTION
// ═══════════════════════════════════════════════════════

// v29.9: Generate all available Lichess months from a starting month backwards
function generateBulkMonths(startMonth) {
  const months = [];
  const [startY, startM] = startMonth.split('-').map(Number);
  let y = startY, m = startM;
  // Go back to 2013 (Lichess started)
  while (y > 2013 || (y === 2013 && m >= 1)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m--;
    if (m < 1) { m = 12; y--; }
  }
  return months;
}

async function runBulkMode(epEngine) {
  if (CONFIG.bulkFile) {
    // Local file mode — single pass
    if (!existsSync(CONFIG.bulkFile)) {
      console.error(`[BULK] File not found: ${CONFIG.bulkFile}`);
      process.exit(1);
    }
    let pgnStream;
    if (CONFIG.bulkFile.endsWith('.zst')) {
      console.log(`[BULK] Streaming zstd-compressed PGN: ${CONFIG.bulkFile}`);
      const zstd = spawn('zstdcat', [CONFIG.bulkFile]);
      pgnStream = zstd.stdout;
      zstd.stderr.on('data', d => console.error(`[zstd] ${d}`));
    } else {
      console.log(`[BULK] Streaming PGN: ${CONFIG.bulkFile}`);
      pgnStream = createReadStream(CONFIG.bulkFile, { encoding: 'utf-8' });
    }
    await processStream(pgnStream, epEngine);
    return;
  }
  
  if (!CONFIG.bulkMonth) {
    console.error('[BULK] Must specify --month=YYYY-MM or --file=/path/to/pgn');
    process.exit(1);
  }

  // v29.9: CONTINUOUS OVERNIGHT MODE — loop through months forever, never exit.
  // Each month has 80-100M games. Stream them with curl | zstdcat, no timeout.
  // SF18 evaluates every position. The worker runs until manually stopped.
  const allMonths = generateBulkMonths(CONFIG.bulkMonth);
  let monthIndex = 0;
  let cycleCount = 0;

  while (true) {
    cycleCount++;
    const monthStr = allMonths[monthIndex % allMonths.length];
    monthIndex++;
    
    const url = `https://database.lichess.org/standard/lichess_db_standard_rated_${monthStr}.pgn.zst`;
    console.log(`\n[BULK] ══════ Cycle ${cycleCount}: month ${monthStr} (${allMonths.length} months available) ══════`);
    console.log(`[BULK] Streaming: ${url}`);
    console.log(`[BULK] No timeout — will process entire month (27-30GB compressed, 80M+ games)`);
    
    try {
      // Check if month exists
      const { stdout: httpCode } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
      if (httpCode.trim() !== '200') {
        console.log(`[BULK] Month ${monthStr} not available (HTTP ${httpCode.trim()}) — skipping`);
        continue;
      }

      // Stream download through zstd — NO TIMEOUT. Let it run until the file is done.
      const curl = spawn('curl', ['-sL', url]);
      const zstd = spawn('zstdcat', ['-']);
      curl.stdout.pipe(zstd.stdin);
      const pgnStream = zstd.stdout;
      
      curl.stderr.on('data', d => console.error(`[curl] ${d}`));
      zstd.stderr.on('data', d => console.error(`[zstd] ${d}`));
      
      // Process the ENTIRE month — no timeout, no early exit
      await processStream(pgnStream, epEngine);
      
      console.log(`[BULK] ✓ Month ${monthStr} complete — moving to next month`);
      
      // Brief pause between months to let DB catch up
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (err) {
      console.error(`[BULK] Month ${monthStr} error (non-fatal): ${err.message}`);
      // Wait 30s and try next month
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

// ═══════════════════════════════════════════════════════
// MODE 2: TOURNAMENT FETCHING
// ═══════════════════════════════════════════════════════

async function runTournamentMode(epEngine) {
  console.log(`[TOURNAMENT] Discovering recent Lichess tournaments...`);
  
  while (true) {
    try {
      // Fetch list of recently finished tournaments
      const tournaments = await discoverTournaments();
      
      for (const tourney of tournaments) {
        console.log(`[TOURNAMENT] Processing: ${tourney.fullName} (${tourney.nbPlayers} players, ${tourney.id})`);
        await fetchAndProcessTournament(tourney.id, epEngine);
        // Rate limit between tournaments
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // Wait before discovering more tournaments
      console.log(`[TOURNAMENT] Cycle complete. Waiting 5 minutes for new tournaments...`);
      await new Promise(r => setTimeout(r, 300000));
      
    } catch (err) {
      console.error(`[TOURNAMENT] Error: ${err.message}`);
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

/**
 * Fetch tournament PGN via curl (more reliable than fetch+Readable.fromWeb)
 */
async function fetchAndProcessTournament(tourneyId, epEngine) {
  const url = `https://lichess.org/api/tournament/${tourneyId}/games?evals=true&clocks=true&opening=true`;
  const tmpFile = join(__dirname, '..', 'data', `tourney_${tourneyId}.pgn`);
  
  try {
    // Download PGN to temp file (avoids stream conversion issues)
    await execAsync(`curl -sL '${url}' -H 'Accept: application/x-chess-pgn' -o '${tmpFile}'`, { timeout: 120000 });
    
    if (!existsSync(tmpFile)) {
      console.log(`[TOURNAMENT] Download failed: ${tourneyId}`);
      return;
    }
    
    const stream = createReadStream(tmpFile, { encoding: 'utf-8' });
    await processStream(stream, epEngine);
    
    // Cleanup
    try { unlinkSync(tmpFile); } catch (e) {}
  } catch (err) {
    console.error(`[TOURNAMENT] Error processing ${tourneyId}: ${err.message}`);
    try { unlinkSync(tmpFile); } catch (e) {}
  }
}

async function discoverTournaments() {
  const tournaments = [];
  
  try {
    // Fetch recently finished arenas
    const resp = await fetch('https://lichess.org/api/tournament', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!resp.ok) return [];
    const data = await resp.json();
    
    // Get finished tournaments with enough players
    const finished = (data.finished || []).filter(t => {
      if (t.nbPlayers < CONFIG.tournamentMinPlayers) return false;
      const perfKey = t.perf?.key || '';
      // Skip variants
      if (['ultraBullet', 'racingKings', 'antichess', 'crazyhouse', 'kingOfTheHill', 'horde', 'atomic', 'threeCheck', 'chess960'].includes(perfKey)) return false;
      // Accept blitz, rapid, classical, and bullet (for volume)
      if (!['blitz', 'rapid', 'classical', 'bullet', 'superBlitz'].includes(perfKey)) return false;
      // Skip rating-capped arenas below min-elo (e.g. "≤1500 Blitz Arena")
      const capMatch = (t.fullName || '').match(/[≤<](\d+)/); 
      if (capMatch && parseInt(capMatch[1]) < CONFIG.minElo) return false;
      return true;
    });
    
    // Take up to 10 tournaments per cycle
    tournaments.push(...finished.slice(0, 10));
    
  } catch (err) {
    console.error(`[TOURNAMENT] Discovery error: ${err.message}`);
  }
  
  console.log(`[TOURNAMENT] Found ${tournaments.length} tournaments to process`);
  return tournaments;
}

// ═══════════════════════════════════════════════════════
// SHARED PROCESSING PIPELINE
// ═══════════════════════════════════════════════════════

async function processStream(pgnStream, epEngine) {
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let epCorrect = 0;
  let sfCorrect = 0;
  let drawsTotal = 0;
  let drawsCaught = 0;
  const startTime = Date.now();
  const DEDUP_BATCH = 500; // Check 500 IDs at a time against DB
  let gameBuffer = [];
  
  async function processBufferedGames() {
    if (gameBuffer.length === 0) return;
    
    // Batch-check all buffered IDs against DB at once
    const ids = gameBuffer.map(g => g.id);
    const existingIds = await checkDuplicateBatch(ids);
    
    for (const game of gameBuffer) {
      if (processed >= CONFIG.maxGamesPerSession) break;
      
      if (existingIds.has(game.id)) {
        skipped++;
        knownGameIds.add(game.id);
        continue;
      }
      
      try {
        const totalMoves = game.moves.split(/\d+\./).filter(m => m.trim()).length;
        if (totalMoves < 20) { errors++; continue; } // Skip abandoned/premature games (<20 moves = noise)
        const moveNumber = selectMoveNumber(totalMoves);
        
        const attempt = await processGame(game, moveNumber, epEngine);
        if (!attempt) { errors++; continue; }
        
        processed++;
        if (attempt.enhancedCorrect) epCorrect++;
        if (attempt.sf17Correct === true) sfCorrect++;
        if (attempt.actualOutcome === 'draw') {
          drawsTotal++;
          if (attempt.enhancedPrediction === 'draw') drawsCaught++;
        }
        
        pendingBatch.push(attempt);
        
        if (pendingBatch.length >= CONFIG.batchSize) {
          await flushBatch();
        }
        
        if (processed % 100 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const gamesPerSec = (processed / elapsed).toFixed(1);
          const gamesPerDay = Math.round(processed / elapsed * 86400);
          const epAcc = processed > 0 ? ((epCorrect / processed) * 100).toFixed(1) : 'N/A';
          const sfAcc = processed > 0 ? ((sfCorrect / processed) * 100).toFixed(1) : 'N/A';
          const drawRecall = drawsTotal > 0 ? ((drawsCaught / drawsTotal) * 100).toFixed(0) : 'N/A';
          
          console.log(`[${workerId}] ▸ ${processed.toLocaleString()} games | ${gamesPerSec}/s | ${gamesPerDay.toLocaleString()}/day | EP: ${epAcc}% | SF18: ${sfAcc}% | Draws: ${drawsCaught}/${drawsTotal} (${drawRecall}%) | Skipped: ${skipped.toLocaleString()} | Errors: ${errors}`);
        }
        
      } catch (err) {
        errors++;
        if (errors % 100 === 0) console.error(`[${workerId}] Error #${errors}: ${err.message}`);
      }
    }
    gameBuffer = [];
  }
  
  for await (const game of parseStreamingPGN(pgnStream)) {
    if (processed >= CONFIG.maxGamesPerSession) {
      console.log(`[${workerId}] Reached max games limit: ${CONFIG.maxGamesPerSession}`);
      break;
    }
    
    // Quick session cache check
    if (knownGameIds.has(game.id)) { skipped++; continue; }
    
    // Apply filters before buffering
    if (!shouldProcessGame(game)) { skipped++; continue; }
    
    gameBuffer.push(game);
    
    // When buffer is full, batch-check dedup against DB then process
    if (gameBuffer.length >= DEDUP_BATCH) {
      await processBufferedGames();
    }
  }
  
  // Process remaining buffer
  await processBufferedGames();
  
  // Flush remaining
  await flushBatch();
  
  // Final summary
  const elapsed = (Date.now() - startTime) / 1000;
  const gamesPerSec = elapsed > 0 ? (processed / elapsed).toFixed(1) : 0;
  const epAcc = processed > 0 ? ((epCorrect / processed) * 100).toFixed(1) : 'N/A';
  const sfAcc = processed > 0 ? ((sfCorrect / processed) * 100).toFixed(1) : 'N/A';
  
  console.log('\n' + '═'.repeat(60));
  console.log(`[${workerId}] BULK PROCESSING COMPLETE`);
  console.log('─'.repeat(60));
  console.log(`  Games processed: ${processed.toLocaleString()}`);
  console.log(`  Games skipped:   ${skipped.toLocaleString()} (filtered out)`);
  console.log(`  Errors:          ${errors}`);
  console.log(`  Throughput:      ${gamesPerSec} games/sec → ${Math.round(gamesPerSec * 86400).toLocaleString()}/day`);
  console.log(`  EP Accuracy:     ${epAcc}%`);
  console.log(`  SF18 Accuracy:   ${sfAcc}%`);
  console.log(`  Draw Recall:     ${drawsCaught}/${drawsTotal}`);
  console.log(`  Time:            ${(elapsed / 60).toFixed(1)} minutes`);
  console.log('═'.repeat(60));
}

// ═══════════════════════════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════════════════════════

/**
 * Download a Lichess database file for local processing.
 * Usage: node ep-bulk-worker.mjs --download --month=2025-01
 */
async function downloadDatabase() {
  const month = CONFIG.bulkMonth;
  if (!month) {
    console.error('Must specify --month=YYYY-MM');
    process.exit(1);
  }
  
  const url = `https://database.lichess.org/standard/lichess_db_standard_rated_${month}.pgn.zst`;
  const outPath = join(__dirname, '..', 'data', `lichess_${month}.pgn.zst`);
  
  console.log(`Downloading: ${url}`);
  console.log(`Saving to:   ${outPath}`);
  
  const curl = spawn('curl', ['-L', '--progress-bar', '-o', outPath, url]);
  curl.stderr.pipe(process.stderr);
  
  await new Promise((resolve, reject) => {
    curl.on('close', code => code === 0 ? resolve() : reject(new Error(`curl exited ${code}`)));
  });
  
  console.log(`✓ Downloaded to ${outPath}`);
  console.log(`Run: node ep-bulk-worker.mjs --mode=bulk --file=${outPath}`);
}

// ═══════════════════════════════════════════════════════
// MODE 3: GRANDMASTER DATABASE INGESTION
// ═══════════════════════════════════════════════════════

/**
 * GRANDMASTER MODE — Pulls from multiple elite chess databases:
 * 
 * 1. TWIC (The Week in Chess) — theweekinchess.com/twic
 *    Weekly PGN archives of ALL top-level FIDE games since 1994.
 *    Includes: World Championships, Candidates, Tata Steel, Norway Chess,
 *    Sinquefield Cup, Olympiads, Grand Swiss, Grand Prix, and every
 *    FIDE-rated tournament worldwide.
 *    ~2000 games/issue, ~1600 issues = ~3.2 million GM games.
 * 
 * 2. Lichess Elite Database — database.lichess.org
 *    Games played by 2500+ rated players on Lichess.
 *    With full eval annotations. High quality.
 * 
 * 3. Lichess Broadcast Games — lichess.org/api/broadcast
 *    Live-relayed FIDE events (Tata Steel, Candidates, World Championship)
 *    with real-time eval. These are OTB GM games.
 * 
 * All data is 100% real — actual games played by real players.
 */
// Track what we've already processed across cycles
const processedTwicIssues = new Set();
const processedBroadcastRounds = new Set();
let twicHighWaterMark = CONFIG.twicEndIssue; // Tracks newest known issue for forward scanning
let gmCycleCount = 0;

// How often each source runs (in cycles). 1 cycle ≈ time to complete one full pass.
// TWIC: weekly releases, check every cycle but skip already-done issues
// Broadcasts: new events frequently, check every cycle
// Elite: 2500+ players, rotate a batch each cycle
const ELITE_BATCH_SIZE = 30; // Players per cycle (Pro tier)
let elitePlayerOffset = 0;

async function runGrandmasterMode(epEngine) {
  console.log('═'.repeat(60));
  console.log('[GM] GRANDMASTER DATABASE INGESTION — CONTINUOUS MODE');
  console.log('[GM] Sources: TWIC + Lichess Broadcasts + Lichess Elite');
  console.log('[GM] Cycling indefinitely with smart dedup');
  console.log('═'.repeat(60));
  
  while (true) {
    gmCycleCount++;
    const cycleStart = Date.now();
    const cycleSavedBefore = dbSaved;
    console.log(`\n[GM] ══════ Cycle ${gmCycleCount} starting ══════`);
    
    try {
      // Phase 1: TWIC — scan for new issues AND backfill historical
      await ingestTWIC(epEngine);
      
      // Phase 2: Lichess Broadcasts — OTB GM events
      await ingestLichessBroadcasts(epEngine);
      
      // Phase 3: Lichess Elite — rotate through 2500+ players
      await ingestLichessElite(epEngine);
      
    } catch (err) {
      console.error(`[GM] Cycle ${gmCycleCount} error (non-fatal): ${err.message}`);
    }
    
    const elapsed = ((Date.now() - cycleStart) / 1000 / 60).toFixed(1);
    console.log(`[GM] Cycle ${gmCycleCount} complete in ${elapsed} min | Saved: ${dbSaved} | Dupes: ${dbDupes} | FEN invalid: ${dbFenInvalid}`);
    console.log(`[GM] TWIC issues done: ${processedTwicIssues.size} | Broadcast rounds done: ${processedBroadcastRounds.size}`);
    
    // Sleep between cycles:
    // - If we processed new games THIS CYCLE, short sleep (10 min) to keep momentum
    // - If everything was deduped, longer sleep (30 min) to save resources
    const cycleSaved = dbSaved - cycleSavedBefore;
    const sleepMs = cycleSaved > 0 ? 10 * 60 * 1000 : 30 * 60 * 1000;
    console.log(`[GM] Sleeping ${sleepMs / 60000} min before next cycle...`);
    await new Promise(r => setTimeout(r, sleepMs));
  }
}

/**
 * TWIC (The Week in Chess) — the gold standard of chess game databases.
 * Every FIDE-rated game worldwide since 1994. Published weekly as PGN.
 * 
 * World Championships, Candidates, Tata Steel, Norway Chess, Sinquefield Cup,
 * Olympiad, Grand Swiss, Grand Prix — all here.
 * 
 * URL format: https://theweekinchess.com/zips/twic{ISSUE}g.zip
 * Each zip contains a .pgn file with ~2000 games.
 */
async function ingestTWIC(epEngine) {
  const dataDir = join(__dirname, '..', 'data');
  
  // Forward scan: check for NEW issues beyond our high water mark (new issues come weekly)
  // Hard cap: scan at most 5 issues ahead per cycle to avoid runaway probing
  const scanStart = twicHighWaterMark + 1;
  const scanEnd = scanStart + 5;
  let forwardScanned = 0;
  for (let probe = scanStart; probe < scanEnd; probe++) {
    try {
      const { stdout } = await execAsync(
        `curl -sL -o /dev/null -w '%{http_code}' 'https://theweekinchess.com/zips/twic${probe}g.zip'`,
        { timeout: 15000 }
      );
      if (stdout.trim() === '200') {
        twicHighWaterMark = probe;
        forwardScanned++;
        console.log(`[TWIC] ✓ New issue discovered: ${probe}`);
      } else {
        break; // No more new issues
      }
    } catch { break; }
  }
  if (forwardScanned > 0) console.log(`[TWIC] Found ${forwardScanned} new issue(s), high water mark now ${twicHighWaterMark}`);
  
  // Process from newest to oldest, skipping already-done issues
  const remaining = [];
  for (let issue = twicHighWaterMark; issue >= CONFIG.twicStartIssue; issue--) {
    if (!processedTwicIssues.has(issue)) remaining.push(issue);
  }
  
  if (remaining.length === 0) {
    console.log(`[TWIC] All ${processedTwicIssues.size} issues already processed`);
    return;
  }
  
  // Process up to 10 issues per cycle to avoid monopolizing resources
  const batch = remaining.slice(0, 10);
  console.log(`\n[TWIC] Processing ${batch.length} issues (${remaining.length} total remaining)`);
  
  let issuesProcessed = 0;
  
  for (const issue of batch) {
    const zipUrl = `https://theweekinchess.com/zips/twic${issue}g.zip`;
    const zipPath = join(dataDir, `twic${issue}g.zip`);
    const pgnPath = join(dataDir, `twic${issue}.pgn`);
    
    try {
      // Skip if already extracted
      if (existsSync(pgnPath)) {
        console.log(`[TWIC] Issue ${issue}: using cached PGN`);
      } else {
        // Download zip
        console.log(`[TWIC] Issue ${issue}: downloading from ${zipUrl}`);
        const { stdout, stderr } = await execAsync(
          `curl -sL -o '${zipPath}' -w '%{http_code}' '${zipUrl}'`,
          { timeout: 60000 }
        );
        
        if (stdout.trim() !== '200') {
          console.log(`[TWIC] Issue ${issue}: HTTP ${stdout.trim()} — skipping`);
          try { unlinkSync(zipPath); } catch (e) {}
          continue;
        }
        
        // Extract PGN from zip
        await execAsync(`unzip -o -q '${zipPath}' -d '${dataDir}'`, { timeout: 30000 });
        try { unlinkSync(zipPath); } catch (e) {}
        
        // Find the extracted PGN (might have different name)
        if (!existsSync(pgnPath)) {
          const pgns = readdirSync(dataDir).filter(f => f.startsWith(`twic${issue}`) && f.endsWith('.pgn'));
          if (pgns.length > 0) {
            const { renameSync } = await import('fs');
            renameSync(join(dataDir, pgns[0]), pgnPath);
          } else {
            console.log(`[TWIC] Issue ${issue}: no PGN found in zip — skipping`);
            continue;
          }
        }
      }
      
      // Process the PGN
      console.log(`[TWIC] Issue ${issue}: processing games...`);
      const stream = createReadStream(pgnPath, { encoding: 'utf-8' });
      
      await processStream(stream, epEngine);
      
      // Mark as processed so we skip it next cycle
      processedTwicIssues.add(issue);
      issuesProcessed++;
      console.log(`[TWIC] Issue ${issue}: ✓ processed (${issuesProcessed}/${batch.length} this cycle)`);
      
      // Clean up PGN to save disk space (optional — comment out to keep cache)
      // try { unlinkSync(pgnPath); } catch (e) {}
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      console.error(`[TWIC] Issue ${issue}: error — ${err.message}`);
      try { unlinkSync(zipPath); } catch (e) {}
      continue;
    }
  }
  
  console.log(`\n[TWIC] ✓ Complete: ${issuesProcessed} issues processed`);
}

/**
 * Lichess Broadcasts — OTB grandmaster events relayed live on Lichess.
 * Tata Steel, Candidates, World Championship, Norway Chess, etc.
 * These are REAL over-the-board games with official FIDE ratings.
 * 
 * API: GET /api/broadcast (paginated list of all broadcasts)
 * Games: GET /api/broadcast/{broadcastRoundId}/pgn
 */
async function ingestLichessBroadcasts(epEngine) {
  console.log('\n[BROADCAST] Fetching Lichess broadcast archives (OTB GM events)...');
  
  try {
    // Fetch recent broadcasts (paginated)
    const resp = await fetch('https://lichess.org/api/broadcast?nb=50', {
      headers: { 'Accept': 'application/x-ndjson' },
    });
    
    if (!resp.ok) {
      console.log(`[BROADCAST] API error: ${resp.status}`);
      return;
    }
    
    const text = await resp.text();
    const broadcasts = text.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
    
    console.log(`[BROADCAST] Found ${broadcasts.length} broadcast events`);
    
    for (const bc of broadcasts) {
      const name = bc.tour?.name || bc.name || 'Unknown';
      const rounds = bc.rounds || [];
      
      if (rounds.length === 0) continue;
      
      console.log(`[BROADCAST] Event: ${name} (${rounds.length} rounds)`);
      
      for (const round of rounds) {
        if (!round.id) continue;
        
        // Skip already-processed broadcast rounds
        if (processedBroadcastRounds.has(round.id)) continue;
        
        const tmpFile = join(__dirname, '..', 'data', `broadcast_${round.id}.pgn`);
        try {
          await execAsync(
            `curl -sL 'https://lichess.org/api/broadcast/round/${round.id}.pgn' -o '${tmpFile}'`,
            { timeout: 30000 }
          );
          
          if (existsSync(tmpFile)) {
            const stream = createReadStream(tmpFile, { encoding: 'utf-8' });
            await processStream(stream, epEngine);
            processedBroadcastRounds.add(round.id);
            try { unlinkSync(tmpFile); } catch (e) {}
          }
        } catch (err) {
          try { unlinkSync(tmpFile); } catch (e) {}
        }
        
        await new Promise(r => setTimeout(r, 1500)); // Rate limit
      }
    }
  } catch (err) {
    console.error(`[BROADCAST] Error: ${err.message}`);
  }
}

/**
 * Lichess Elite Database — Games by 2500+ rated Lichess players.
 * These have eval annotations. High quality, with known strong players.
 * 
 * We fetch recent games from known titled players using the Lichess API.
 */
// Cached elite player list — refreshed once per session
let cachedElitePlayers = null;

async function ingestLichessElite(epEngine) {
  // Discover elite players (refresh once, then cache)
  if (!cachedElitePlayers) {
    console.log('\n[ELITE] Discovering 2500+ Lichess players...');
    const elitePlayers = [];
    
    for (const perf of ['classical', 'rapid', 'blitz']) {
      try {
        const resp = await fetch(`https://lichess.org/api/player/top/50/${perf}`, {
          headers: { 'Accept': 'application/vnd.lichess.v3+json' },
        });
        if (resp.ok) {
          const data = await resp.json();
          const players = (data.users || [])
            .filter(u => (u.perfs?.[perf]?.rating || 0) >= 2500)
            .map(u => u.username);
          elitePlayers.push(...players);
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    
    cachedElitePlayers = [...new Set(elitePlayers)];
    console.log(`[ELITE] Discovered ${cachedElitePlayers.length} elite players (2500+)`);
  }
  
  if (!cachedElitePlayers || cachedElitePlayers.length === 0) {
    console.log('[ELITE] No elite players found — skipping');
    return;
  }
  
  // Rotate through players in batches across cycles
  const batch = [];
  for (let i = 0; i < ELITE_BATCH_SIZE; i++) {
    const idx = (elitePlayerOffset + i) % cachedElitePlayers.length;
    batch.push(cachedElitePlayers[idx]);
  }
  elitePlayerOffset = (elitePlayerOffset + ELITE_BATCH_SIZE) % cachedElitePlayers.length;
  
  console.log(`\n[ELITE] Processing batch of ${batch.length} players (offset ${elitePlayerOffset}/${cachedElitePlayers.length})`);
  
  for (const player of batch) {
    try {
      const tmpFile = join(__dirname, '..', 'data', `elite_${player}.pgn`);
      
      // Fetch last 200 games with evals
      await execAsync(
        `curl -sL 'https://lichess.org/api/games/user/${player}?max=200&rated=true&evals=true&clocks=true&perfType=classical,rapid,blitz' -H 'Accept: application/x-chess-pgn' -o '${tmpFile}'`,
        { timeout: 60000 }
      );
      
      if (existsSync(tmpFile)) {
        console.log(`[ELITE] Processing ${player}'s games...`);
        const stream = createReadStream(tmpFile, { encoding: 'utf-8' });
        await processStream(stream, epEngine);
        try { unlinkSync(tmpFile); } catch (e) {}
      }
      
      // Lichess rate limit: 1 request per second for game exports
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[ELITE] Error for ${player}: ${err.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

async function main() {
  console.log('═'.repeat(60));
  console.log(`En Pensent EP Bulk Worker — ${workerId}`);
  console.log('═'.repeat(60));
  console.log(`Mode:      ${CONFIG.mode.toUpperCase()}`);
  console.log(`Min ELO:   ${CONFIG.minElo}`);
  console.log(`Eval req:  ${CONFIG.requireEval}`);
  console.log(`Batch:     ${CONFIG.batchSize}`);
  if (CONFIG.maxGamesPerSession < Infinity) {
    console.log(`Max games: ${CONFIG.maxGamesPerSession.toLocaleString()}`);
  }
  console.log('─'.repeat(60));
  
  // Handle --download flag
  if (process.argv.includes('--download')) {
    await downloadDatabase();
    process.exit(0);
  }
  
  // Pre-load known game IDs for dedup (tournament mode especially benefits)
  await preloadKnownGameIds();
  
  // Load EP engine
  console.log('Loading EP engine...');
  const epEngine = await loadEPEngine();
  console.log('✓ EP engine loaded (v9.3)');
  console.log('═'.repeat(60));
  
  // Ensure data directory exists
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  
  if (CONFIG.mode === 'bulk') {
    await runBulkMode(epEngine);
  } else if (CONFIG.mode === 'tournament') {
    await runTournamentMode(epEngine);
  } else if (CONFIG.mode === 'grandmaster') {
    await runGrandmasterMode(epEngine);
  } else {
    console.error(`Unknown mode: ${CONFIG.mode}. Use --mode=bulk, --mode=tournament, or --mode=grandmaster`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`[${workerId}] Fatal error:`, err);
  process.exit(1);
});
