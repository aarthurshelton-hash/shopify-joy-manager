#!/usr/bin/env node
/**
 * En Pensent — Multi-Source Chess Database Ingest Worker
 * 
 * Continuously ingests games from the world's largest chess databases:
 * 
 * SOURCE 1: Lichess Open Database (database.lichess.org)
 *   - Monthly PGN dumps, 80-100M rated games/month
 *   - Auto-rotates through months (newest first)
 *   - Streams directly via curl | zstdcat — no disk storage needed
 * 
 * SOURCE 2: FICS (Free Internet Chess Server) — ficsgames.org
 *   - Historical PGN archives going back to 1999
 * 
 * SOURCE 3: KingBase (kingbase-chess.net)
 *   - 2.4M+ master-level OTB games
 * 
 * SOURCE 4: CCRL (Computer Chess Rating Lists)
 *   - Engine-vs-engine games for baseline calibration
 * 
 * DEDUP: Lightweight batch-check against DB (no 600K+ preload).
 * QUALITY: Full EP pipeline — baseline + enhanced 8-quad + SF + hybrid fusion.
 * METADATA: Rich game context — players, events, locations, ECO, time controls.
 * SYNC: Same schema, same accuracy tracking, same self-learning as all other workers.
 * 
 * 100% real games — no synthetic data.
 */

import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;
import { Chess } from 'chess.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync, mkdirSync, unlinkSync, statSync } from 'fs';
import { createInterface } from 'readline';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { getIntelligentFusionWeights, getPostFusionDrawGate, getArchetypeEdgeDampener, shouldSuppressEnhancedDraw } from './fusion-intelligence.mjs';
import { refreshPlayerIntelligence } from './player-intelligence.mjs';
import fs from 'fs';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// ════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════

const CONFIG = {
  enableLichessDB: true,
  enableFICS: true,
  enableKingBase: true,
  enableCCRL: true,
  enableChessCom: true,
  enableLichessPuzzles: true,

  lichessStartYear: 2026,
  lichessStartMonth: 1,
  lichessOldestYear: 2020,

  ficsStartYear: 2025,
  ficsOldestYear: 2018,

  minElo: parseInt(process.argv.find(a => a.startsWith('--min-elo='))?.split('=')[1] || '1500'),
  requireEval: false,
  
  batchSize: 100,
  dedupBatchSize: 500,        // Check 500 IDs at a time against DB
  moveAnalysisRange: { min: 12, max: 55 },
  maxGamesPerSource: parseInt(process.argv.find(a => a.startsWith('--max-per-source='))?.split('=')[1] || '50000'),
  sfDepth: parseInt(process.argv.find(a => a.startsWith('--sf-depth='))?.split('=')[1] || '14'),
};

const workerId = process.env.WORKER_ID || 'db-ingest-1';
const DATA_DIR = join(__dirname, '..', 'data', 'chess-db');

// Chess.com top players for bulk game fetching (public API, no auth required)
const CHESSCOM_PLAYERS = [
  // Super GMs
  'MagnusCarlsen', 'Hikaru', 'FabianoCaruana', 'nihalsarin',
  'DanielNaroditsky', 'AnishGiri', 'LevonAronian', 'WesleySo1993',
  'lachesisQ', 'Firouzja2003', 'rpragchess', 'viikiichen',
  'Vladimirovich9000', 'FedSerov', 'FairPlayMachine',
  // Strong GMs (2600+)
  'GothamChess', 'Duhless', 'Bigfish1995', 'ChessWarrior7197',
  'lyonbeast', 'VladimirKramnik', 'Grischuk', 'IMRosen',
  'GMBenjaminBok', 'GMWSO', 'Jospem', 'Oleksandr_Bortnyk',
  'PinIsMightier', 'Msb2', 'KevinBordi', 'akaNemsko',
  // Active 2500+ players for volume
  'Hambleton', 'Bartholomew', 'chaborr', 'Cassjh',
  'DrChrisB', 'JannLee', 'Fins0905', 'penguin_gm',
];
let chesscomPlayerIndex = 0;

// ════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ════════════════════════════════════════════════════════

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 15000,
  });
  pool.on('error', (err) => {
    console.error('[DB-INGEST] Pool error (non-fatal):', err.message);
  });
  console.log('[DB-INGEST] ✓ Direct SQL connection active');
} else {
  console.log('[DB-INGEST] ⚠ No DATABASE_URL — dry-run mode');
}

// Graceful shutdown — drain pool before exit to prevent zombie connections
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    console.log(`[DB-INGEST] ${sig} received — draining pool...`);
    try { if (pool) await pool.end(); } catch {}
    process.exit(0);
  });
}

const FAST_FAIL_CODES = new Set(['23505', '23514', '23502', '22003', '42703']);

async function resilientQuery(text, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (FAST_FAIL_CODES.has(err?.code)) throw err;
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ════════════════════════════════════════════════════════
// LIGHTWEIGHT BATCH DEDUP — no 600K preload, just check batches
// ════════════════════════════════════════════════════════

// Small session cache — only IDs we've already checked or saved this session
const sessionDedup = new Set();

/**
 * Check a batch of game IDs against the DB.
 * Returns Set of IDs that already exist (should be skipped).
 */
async function checkDuplicateBatch(gameIds) {
  if (!pool || gameIds.length === 0) return new Set();
  
  // First filter out anything we already know from this session
  const toCheck = gameIds.filter(id => !sessionDedup.has(id));
  if (toCheck.length === 0) return new Set(gameIds.filter(id => sessionDedup.has(id) && sessionDedup.get?.(id) === 'exists'));
  
  const existingIds = new Set();
  
  try {
    const result = await resilientQuery(
      `SELECT game_id FROM chess_prediction_attempts WHERE game_id = ANY($1)`,
      [toCheck]
    );
    for (const row of result.rows) {
      existingIds.add(row.game_id);
      sessionDedup.add(row.game_id);
    }
  } catch (err) {
    console.error(`[${workerId}] Dedup batch check failed: ${err.message}`);
    // On failure, don't skip anything — let DB constraint catch dupes
  }
  
  return existingIds;
}

const FEN_REGEX = /^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/;

// ════════════════════════════════════════════════════════
// LOCAL STOCKFISH ENGINE
// ════════════════════════════════════════════════════════

let stockfishProcess = null;
let engineReady = false;

async function initStockfish() {
  if (!stockfishProcess) {
    console.log('[DB-INGEST] Starting local Stockfish...');
    stockfishProcess = spawn('stockfish', [], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    stockfishProcess.on('error', (err) => {
      console.error('[DB-INGEST] Stockfish spawn error:', err.message);
      engineReady = false;
    });
    stockfishProcess.on('close', () => { engineReady = false; stockfishProcess = null; });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Stockfish init timeout')), 10000);
      const onData = (data) => {
        if (data.toString().includes('Stockfish') || data.toString().includes('uciok')) {
          clearTimeout(timeout);
          stockfishProcess.stdout.off('data', onData);
          engineReady = true;
          console.log(`[DB-INGEST] ✓ Stockfish ready (depth ${CONFIG.sfDepth})`);
          resolve();
        }
      };
      stockfishProcess.stdout.on('data', onData);
      stockfishProcess.stdin.write('uci\nisready\n');
    });
  }
  return stockfishProcess;
}

async function evaluateWithStockfish(fen) {
  try {
    const engine = await initStockfish();
    if (!engineReady) throw new Error('Engine not ready');
    
    return new Promise((resolve) => {
      let evaluation = 0, currentDepth = 0, bestMove = 'e2e4';
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true; engine.stdout.off('data', onData);
          resolve({ evaluation: 0, depth: 0, bestMove: 'e2e4', source: 'timeout' });
        }
      }, 10000);
      
      const onData = (data) => {
        if (resolved) return;
        for (const line of data.toString().split('\n')) {
          const t = line.trim();
          if (t.startsWith('bestmove')) {
            const parts = t.split(' ');
            if (parts.length >= 2) bestMove = parts[1];
            if (!resolved) {
              resolved = true; clearTimeout(timeout); engine.stdout.off('data', onData);
              resolve({ evaluation, depth: currentDepth, bestMove, source: 'stockfish' });
            }
          }
          const cpMatch = t.match(/score cp (-?\d+)/);
          if (cpMatch) evaluation = parseInt(cpMatch[1]) / 100;
          const mateMatch = t.match(/score mate (-?\d+)/);
          if (mateMatch) evaluation = parseInt(mateMatch[1]) > 0 ? 10 : -10;
          const depthMatch = t.match(/depth (\d+)/);
          if (depthMatch) currentDepth = parseInt(depthMatch[1]);
        }
      };
      
      engine.stdout.on('data', onData);
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${CONFIG.sfDepth}\n`);
    });
  } catch {
    // Material fallback
    const pieces = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let w = 0, b = 0;
    for (const c of ((fen || '').split(' ')[0] || '')) {
      if (pieces[c.toLowerCase()]) {
        if (c === c.toLowerCase()) b += pieces[c]; else w += pieces[c.toLowerCase()];
      }
    }
    return { evaluation: (w - b) / 10, depth: 0, bestMove: 'e2e4', source: 'material_count' };
  }
}

// ════════════════════════════════════════════════════════
// EP ENGINE LOADER — Full pipeline (baseline + enhanced + predict)
// ════════════════════════════════════════════════════════

async function loadEPEngine() {
  const distPath = join(__dirname, '..', 'dist', 'lib', 'chess');
  
  const colorFlowModule = await import(join(distPath, 'colorFlowAnalysis', 'index.js'));
  const gameSimModule = await import(join(distPath, 'gameSimulator.js'));
  
  let enhancedModule = null;
  try {
    enhancedModule = await import(join(distPath, 'colorFlowAnalysis', 'enhancedSignatureExtractor.js'));
  } catch (e) {
    console.log('[DB-INGEST] Legacy enhanced module not available');
  }
  
  // Load TRUE 32-piece color flow system
  let piece32Module = null;
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    piece32Module = require(join(distPath, 'colorFlowAnalysis', 'pieceColorFlow32.js'));
    console.log('[DB-INGEST] ✓ 32-piece color flow system loaded');
  } catch (e) {
    console.log('[DB-INGEST] 32-piece module not available:', e.message);
  }
  
  return {
    extractColorFlowSignature: colorFlowModule.extractColorFlowSignature,
    predictFromColorFlow: colorFlowModule.predictFromColorFlow,
    simulateGame: gameSimModule.simulateGame,
    extractEnhancedSignature: enhancedModule?.extractEnhancedColorFlowSignature || null,
    extract32PieceSignature: piece32Module?.extract32PieceSignature || null,
    predictFrom32Piece: piece32Module?.predictFrom32PieceSignature || null,
  };
}

// ════════════════════════════════════════════════════════
// PGN STREAMING PARSER — Matches bulk worker's proven parser
// ════════════════════════════════════════════════════════

async function* parseStreamingPGN(readableStream) {
  const rl = createInterface({ input: readableStream, crlfDelay: Infinity });
  
  let headers = {};
  let movesLines = [];
  let headerLines = [];
  let state = 'IDLE';
  
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
      if (state === 'HEADERS') state = 'GAP';
      else if (state === 'MOVES') yield* yieldGame();
      continue;
    }
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const match = trimmed.match(/^\[(\w+)\s+"(.*)"\]$/);
      if (match) {
        if (state === 'MOVES') yield* yieldGame();
        state = 'HEADERS';
        headers[match[1]] = match[2];
        headerLines.push(trimmed);
      }
    } else if (state === 'GAP' || state === 'MOVES' || state === 'HEADERS') {
      state = 'MOVES';
      movesLines.push(trimmed);
    }
  }
  
  yield* yieldGame();
}

function extractEvalsFromMoves(moveText) {
  const evals = [];
  const evalRegex = /\[%eval\s+([#\-\d.]+)\]/g;
  let match;
  while ((match = evalRegex.exec(moveText)) !== null) {
    const evalStr = match[1];
    if (evalStr.startsWith('#')) {
      evals.push(parseInt(evalStr.substring(1)) > 0 ? 10000 : -10000);
    } else {
      evals.push(Math.round(parseFloat(evalStr) * 100));
    }
  }
  return evals;
}

function cleanMoves(moveText) {
  return moveText.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
}

function extractGameId(headers) {
  if (headers.GameId) return headers.GameId;
  const site = headers.Site || '';
  const lichessMatch = site.match(/lichess\.org\/(\w+)/);
  if (lichessMatch) return lichessMatch[1];
  // FICS game IDs
  const ficsMatch = site.match(/freechess\.org\/(\d+)/);
  if (ficsMatch) return 'fics_' + ficsMatch[1];
  // Fallback: hash
  const key = `${headers.White}_${headers.Black}_${headers.Date}_${headers.UTCTime || ''}_${headers.Result}`;
  return 'dbi_' + crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
}

// ════════════════════════════════════════════════════════
// GAME FILTER — Same quality gates as bulk worker
// ════════════════════════════════════════════════════════

function shouldProcessGame(game) {
  const h = game.headers;
  if (!h.Result || h.Result === '*') return false;
  
  const eventLower = (h.Event || '').toLowerCase();
  if (eventLower.includes('casual') || eventLower.includes('unrated')) return false;
  
  const whiteElo = parseInt(h.WhiteElo) || 0;
  const blackElo = parseInt(h.BlackElo) || 0;
  const avgElo = (whiteElo + blackElo) / 2;
  if (avgElo > 0 && avgElo < CONFIG.minElo) return false;
  
  if (eventLower.includes('ultrabullet') || eventLower.includes('hyperbullet')) return false;
  const tc = h.TimeControl || '';
  const tcMatch = tc.match(/(\d+)/);
  if (tcMatch && parseInt(tcMatch[1]) < 60 && !eventLower.includes('rapid')) return false;
  
  if (CONFIG.requireEval && game.evals.length < 5) return false;
  
  return true;
}

// ════════════════════════════════════════════════════════
// MOVE SELECTION — Weighted zones matching bulk worker
// ════════════════════════════════════════════════════════

function selectMoveNumber(totalMoves) {
  const maxMove = Math.min(totalMoves - 2, CONFIG.moveAnalysisRange.max);
  const minMove = CONFIG.moveAnalysisRange.min;
  if (maxMove <= minMove) return Math.max(minMove, Math.floor(totalMoves / 2));
  
  const r = Math.random();
  if (r < 0.25) {
    const earlyMax = Math.min(19, maxMove);
    return minMove + Math.floor(Math.random() * (earlyMax - minMove + 1));
  } else if (r < 0.50) {
    const midStart = Math.min(20, maxMove);
    const midEnd = Math.min(30, maxMove);
    return midStart + Math.floor(Math.random() * (midEnd - midStart + 1));
  } else {
    const lateStart = Math.min(30, maxMove);
    return lateStart + Math.floor(Math.random() * (maxMove - lateStart + 1));
  }
}

// ════════════════════════════════════════════════════════
// FULL EP PREDICTION PIPELINE — Matching bulk worker quality
// Baseline (4-quad) + Enhanced (8-quad) + SF + Hybrid Fusion
// ════════════════════════════════════════════════════════

let enhFailCount = 0;

function classifyArchetype32(sig) {
  if (!sig?.quadrants) return 'balanced_flow';
  const q = sig.quadrants;
  const ksPressure = Math.abs(q.q1_kingside_white) + Math.abs(q.q3_kingside_black);
  const qsPressure = Math.abs(q.q2_queenside_white) + Math.abs(q.q4_queenside_black);
  const centerControl = Math.abs(q.q5_center_white) + Math.abs(q.q6_center_black);
  const wingExpansion = Math.abs(q.q7_extended_kingside) + Math.abs(q.q8_extended_queenside);
  const materialImbalance = sig.materialFlow ? Math.abs(sig.materialFlow.balance) > 3 : false;
  const highInteractions = sig.interactions ? sig.interactions.cross > 10 : false;
  
  if (materialImbalance && highInteractions && ksPressure > qsPressure) return 'sacrificial_kingside_assault';
  if (materialImbalance && highInteractions && qsPressure > ksPressure) return 'sacrificial_queenside_break';
  if (ksPressure > qsPressure * 1.5 && ksPressure > 12) return 'kingside_attack';
  if (qsPressure > ksPressure * 1.5 && qsPressure > 12) return 'queenside_expansion';
  if (centerControl > ksPressure + qsPressure) return 'central_domination';
  if (wingExpansion > centerControl) return 'flank_operations';
  if (sig.traceDepth?.avg > 3.5) return 'closed_maneuvering';
  if (sig.captures > 10) return 'tactical_melee';
  if (sig.temporal?.endgame > 0.4) return 'endgame_technique';
  return 'balanced_flow';
}

async function processGame(game, moveNumber, epEngine, source) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extract32PieceSignature, predictFrom32Piece } = epEngine;
  
  const headerLines = Object.entries(game.headers).map(([k, v]) => `[${k} "${v}"]`).join('\n');
  const fullPgn = headerLines + '\n\n' + game.moves;
  
  // Play through moves with chess.js to get real FEN
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  try {
    const chess = new Chess();
    const moveTokens = game.moves
      .replace(/\{[^}]*\}/g, '').replace(/\d+\.+/g, '').split(/\s+/)
      .filter(t => t && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/));
    
    const targetHalfMove = moveNumber * 2;
    for (let i = 0; i < Math.min(targetHalfMove, moveTokens.length); i++) {
      const result = chess.move(moveTokens[i]);
      if (!result) break;
    }
    fen = chess.fen();
  } catch {}
  
  if (!FEN_REGEX.test(fen)) return null;
  
  // SF eval: prefer PGN annotations, fall back to local Stockfish
  let sfEvalCp = 0;
  let hasRealEval = false;
  
  if (game.evals.length > 0) {
    const evalIndex = Math.min(moveNumber * 2 - 2, game.evals.length - 1);
    sfEvalCp = evalIndex >= 0 ? game.evals[evalIndex] : 0;
    hasRealEval = true;
  } else {
    const sfResult = await evaluateWithStockfish(fen);
    sfEvalCp = Math.round(sfResult.evaluation * 100);
    hasRealEval = sfResult.source !== 'material_count';
  }
  
  // Simulate and extract signature
  let simulation, board, totalMoves;
  try {
    simulation = simulateGame(fullPgn);
    board = simulation.board;
    totalMoves = simulation.totalMoves || moveNumber;
  } catch { return null; }
  
  // Baseline (4-quadrant)
  const gameData = { white: game.headers.White || 'Unknown', black: game.headers.Black || 'Unknown', pgn: fullPgn };
  const baselineSig = extractColorFlowSignature(board, gameData, totalMoves);
  const baselinePred = predictFromColorFlow(baselineSig, totalMoves, sfEvalCp, 18);
  const baselineResult = {
    predictedWinner: baselinePred.predictedWinner === 'white' ? 'white_wins' :
                     baselinePred.predictedWinner === 'black' ? 'black_wins' : 'draw',
    confidence: baselinePred.confidence / 100,
  };
  
  // TRUE 32-PIECE ENHANCED ENGINE
  // Each of 32 pieces gets unique hue, traces through squares,
  // overlapping traces = squares within squares. Own predictor.
  let enhancedResult = baselineResult;
  let enhancedSig = null;
  if (extract32PieceSignature && predictFrom32Piece) {
    try {
      enhancedSig = extract32PieceSignature(fullPgn, moveNumber);
    } catch (e) {
      enhFailCount++;
      if (enhFailCount <= 3) console.error(`[DB-INGEST] 32-piece extraction failed (${enhFailCount}): ${e.message}`);
    }
    if (enhancedSig) {
      try {
        const pred32 = predictFrom32Piece(enhancedSig, sfEvalCp, moveNumber);
        if (pred32) {
          enhancedResult = {
            predictedWinner: pred32.predictedWinner === 'white' ? 'white_wins' :
                             pred32.predictedWinner === 'black' ? 'black_wins' : 'draw',
            confidence: pred32.confidence,
          };
        }
      } catch (e) {
        if (enhFailCount <= 5) console.error(`[DB-INGEST] 32-piece prediction failed: ${e.message}`);
      }
    }
  }
  
  // SF prediction
  const sf17Prediction = sfEvalCp > 30 ? 'white_wins' : sfEvalCp < -30 ? 'black_wins' : 'draw';
  
  // Actual outcome
  const result = game.headers.Result;
  const actualOutcome = result === '1-0' ? 'white_wins' : result === '0-1' ? 'black_wins' :
                        result === '1/2-1/2' ? 'draw' : null;
  if (!actualOutcome) return null;
  
  // Position hash
  const positionHash = crypto.createHash('sha256').update(fen).digest('hex').substring(0, 16);
  
  // ─── v14: INTELLIGENT HYBRID FUSION + PLAYER INTELLIGENCE ───
  const fusionArchetype = enhancedSig?.archetype || baselineSig.archetype;
  const playerCtx = {
    whiteName: game.headers.White || null,
    blackName: game.headers.Black || null,
    platform: game.source || 'lichess_db',
  };
  const fw = getIntelligentFusionWeights(fusionArchetype, game.headers.TimeControl || null, moveNumber, playerCtx, hasRealEval ? sfEvalCp : null);
  const votes = { white_wins: 0, black_wins: 0, draw: 0 };
  const baseConf = baselineResult.confidence;
  const enhConf = enhancedResult.confidence;
  const sfConf = hasRealEval ? Math.min(0.95, 0.5 + Math.abs(sfEvalCp) / 500) : 0.3;
  
  // v17: Enhanced draw suppression — enhanced predicts "draw" 27-35% on archetypes
  // where draws only happen 4-7%. These 2.7% accuracy predictions are pure poison.
  // When suppressed, redistribute enhanced's weight to baseline (61.7% > enhanced 59.3%).
  const drawSuppress = shouldSuppressEnhancedDraw(enhancedResult.predictedWinner, fusionArchetype);
  if (drawSuppress.suppress) {
    // Zero enhanced vote, give its weight to baseline
    votes[baselineResult.predictedWinner] += (fw.baselineWeight + fw.enhancedWeight) * baseConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
  } else {
    votes[baselineResult.predictedWinner] += fw.baselineWeight * baseConf;
    votes[enhancedResult.predictedWinner] += fw.enhancedWeight * enhConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
  }
  
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  let hybridPrediction = sortedVotes[0][0];
  const hybridRawConf = sortedVotes[0][1] / (sortedVotes[0][1] + sortedVotes[1][1] + sortedVotes[2][1] + 0.001);
  
  const allAgree = baselineResult.predictedWinner === enhancedResult.predictedWinner &&
                   enhancedResult.predictedWinner === sf17Prediction;
  const twoAgree = (baselineResult.predictedWinner === enhancedResult.predictedWinner) ||
                   (enhancedResult.predictedWinner === sf17Prediction) ||
                   (baselineResult.predictedWinner === sf17Prediction);
  let hybridConf = hybridRawConf;
  if (allAgree) hybridConf = Math.min(0.69, hybridConf * 1.15);
  else if (!twoAgree) hybridConf *= 0.75;
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));
  
  // v16: POST-FUSION INTELLIGENCE GATES
  // Games are ALWAYS processed — these change the PREDICTION, not whether we process
  const fusionArch = enhancedSig ? classifyArchetype32(enhancedSig) : baselineSig.archetype;
  
  // Gate 1: Draw detection — low conf + high-draw archetype → predict draw
  const drawGate = getPostFusionDrawGate(fusionArch, moveNumber, hybridConf, votes);
  if (drawGate.shouldPredictDraw) {
    hybridPrediction = 'draw';
    hybridConf = drawGate.adjustedConf;
  }
  
  // Gate 2: Zero-edge archetype dampener
  hybridConf *= getArchetypeEdgeDampener(fusionArch);
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));
  
  // Recompute correctness after potential draw override
  const hybridCorrect = hybridPrediction === actualOutcome;
  
  const enhDelta = (enhancedResult.predictedWinner === actualOutcome && baselineResult.predictedWinner !== actualOutcome) ? 1 :
                   (enhancedResult.predictedWinner !== actualOutcome && baselineResult.predictedWinner === actualOutcome) ? -1 : 0;
  
  // ─── RICH METADATA for reporting ───
  const h = game.headers;
  // v12.1: Pre-compute profiling buckets for per-player/per-opening/per-time-of-day learning
  const utcTime = h.UTCTime || h.StartTime || null;
  let timeOfDay = null;
  if (utcTime) {
    const hour = parseInt(utcTime.split(':')[0]);
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
  }
  const wElo = parseInt(h.WhiteElo) || null;
  const bElo = parseInt(h.BlackElo) || null;
  const avgElo = (wElo && bElo) ? Math.round((wElo + bElo) / 2) : null;
  let eloTier = null;
  if (avgElo) {
    if (avgElo >= 2500) eloTier = 'super_gm';
    else if (avgElo >= 2200) eloTier = 'master';
    else if (avgElo >= 1800) eloTier = 'expert';
    else if (avgElo >= 1400) eloTier = 'intermediate';
    else eloTier = 'beginner';
  }
  const metadata = {
    white_player: h.White || 'Unknown',
    black_player: h.Black || 'Unknown',
    white_title: h.WhiteTitle || null,
    black_title: h.BlackTitle || null,
    event: h.Event || null,
    site: h.Site || null,
    round: h.Round || null,
    date: h.Date || h.UTCDate || null,
    time: utcTime,
    eco: h.ECO || null,
    opening: h.Opening || null,
    termination: h.Termination || null,
    variant: h.Variant || 'Standard',
    source,
    time_control_raw: h.TimeControl || null,
    white_rating_diff: h.WhiteRatingDiff || null,
    black_rating_diff: h.BlackRatingDiff || null,
    // v12.1: Computed profiling fields
    time_of_day: timeOfDay,
    avg_elo: avgElo,
    elo_tier: eloTier,
  };
  
  return {
    gameId: game.id,
    gameName: `${h.White || '?'} vs ${h.Black || '?'}`,
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
    enhancedArchetype: enhancedSig ? classifyArchetype32(enhancedSig) : baselineSig.archetype,
    enhancedConfidence: enhancedResult.confidence,
    colorRichness: enhancedSig?.traceDepth?.avg || 0,
    complexity: enhancedSig?.interactions?.total || 0,
    eightQuadrantProfile: enhancedSig?.quadrants || null,
    pieceTypeMetrics: enhancedSig?.pieceTypeInfluence ? {
      bishopDominance: enhancedSig.pieceTypeInfluence.bishop?.white + enhancedSig.pieceTypeInfluence.bishop?.black || 0,
      knightDominance: enhancedSig.pieceTypeInfluence.knight?.white + enhancedSig.pieceTypeInfluence.knight?.black || 0,
      rookDominance: enhancedSig.pieceTypeInfluence.rook?.white + enhancedSig.pieceTypeInfluence.rook?.black || 0,
      queenDominance: enhancedSig.pieceTypeInfluence.queen?.white + enhancedSig.pieceTypeInfluence.queen?.black || 0,
      pawnAdvancement: enhancedSig.pawnProfiles ? Object.values(enhancedSig.pawnProfiles).reduce((s, p) => s + p.advancement, 0) / 16 : 0,
      relativeValueBalance: enhancedSig.relativeBalance?.delta || 0,
    } : null,
    hybridPrediction,
    hybridCorrect: hybridPrediction === actualOutcome,
    hybridConfidence: hybridConf,
    actualOutcome,
    dataSource: source,
    whiteElo: parseInt(h.WhiteElo) || null,
    blackElo: parseInt(h.BlackElo) || null,
    timeControl: h.TimeControl || null,
    pgn: fullPgn.substring(0, 5000),
    enhDelta,
    metadata,
  };
}

// ════════════════════════════════════════════════════════
// BATCH DB WRITER — Full schema matching bulk worker + rich metadata
// ════════════════════════════════════════════════════════

const pendingBatch = [];
let dbSaved = 0, dbDupes = 0, dbFenInvalid = 0;

async function batchInsert(attempts) {
  if (!pool || attempts.length === 0) return;
  
  const insertPromises = attempts.map(async (a) => {
    if (!a.fen || typeof a.fen !== 'string' || a.fen.length <= 20 || !FEN_REGEX.test(a.fen)) {
      dbFenInvalid++;
      return;
    }
    
    if (sessionDedup.has(a.gameId)) {
      dbDupes++;
      return;
    }
    
    try {
      const result = await resilientQuery(
        `/* db-ingest-v2 */ INSERT INTO chess_prediction_attempts (
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
          lesson_learned,
          created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,NOW())`,
        [
          a.gameId,
          a.gameName,
          a.moveNumber,
          a.fen,
          a.positionHash,
          Math.max(-9999, Math.min(9999, Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0)),
          a.hasRealEval ? 18 : 0,
          a.sf17Prediction || 'unknown',
          a.hasRealEval ? Math.round(Math.min(95, 50 + Math.abs((Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0) / 100) * 10)) : 0,
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
          a.dataQualityTier || 'farm_bulk_8quad',
          workerId,
          a.dataSource || 'unknown',
          a.whiteElo,
          a.blackElo,
          a.timeControl,
          (a.pgn || '').substring(0, 5000),
          a.enhDelta,
          a.eightQuadrantProfile ? JSON.stringify(a.eightQuadrantProfile) : null,
          a.pieceTypeMetrics ? JSON.stringify(a.pieceTypeMetrics) : null,
          Math.min(9.9999, Math.max(0, Number.isFinite(a.colorRichness) ? a.colorRichness : 0)),
          Math.min(9.9999, Math.max(0, Number.isFinite(a.complexity) ? a.complexity / 100 : 0)),
          a.metadata ? JSON.stringify(a.metadata) : null,
        ]
      );
      
      if (result.rowCount > 0) {
        dbSaved++;
        sessionDedup.add(a.gameId);
        
        // Cross-domain correlation — every 20th saved game
        if (dbSaved % 20 === 0) {
          try {
            const enginesAgree = a.baselineCorrect === a.enhancedCorrect;
            const sfAgrees = a.sf17Correct === a.enhancedCorrect;
            const allAgree = enginesAgree && sfAgrees;
            const confLevel = a.hybridConfidence || a.enhancedConfidence || 0.5;
            const posComplexity = Math.min(1, Math.abs((a.sfEvalCp || 0)) / 300);
            const realScore = (
              (confLevel * 0.4) +
              (allAgree ? 0.25 : enginesAgree ? 0.15 : 0) +
              (a.enhancedCorrect ? 0.25 : 0) +
              (posComplexity > 0.3 ? 0.10 : 0)
            );
            await resilientQuery(
              `INSERT INTO cross_domain_correlations (
                correlation_id, pattern_id, pattern_name,
                correlation_score, chess_archetype, chess_confidence,
                chess_intensity, market_symbol, market_direction,
                market_confidence, market_intensity, validated, detected_at
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
              [
                `dbi_${a.gameId}_${Date.now()}`,
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
                a.enhancedCorrect,
              ]
            );
          } catch { /* non-critical */ }
        }
      }
    } catch (err) {
      if (err?.code === '23505') {
        dbDupes++;
        sessionDedup.add(a.gameId);
      } else if (err?.code === '23514' || err?.code === '23502') {
        dbFenInvalid++;
        if (dbFenInvalid <= 5) console.error(`[${workerId}] Constraint violation (${err.code}): ${err.message?.substring(0, 200)}`);
      } else {
        console.error(`[${workerId}] DB error (${err?.code}): ${err?.message}`);
      }
    }
  });
  
  await Promise.allSettled(insertPromises);
}

async function flushBatch() {
  if (pendingBatch.length === 0) return;
  const batch = pendingBatch.splice(0);
  const beforeSaved = dbSaved;
  await batchInsert(batch);
  const newSaved = dbSaved - beforeSaved;
  console.log(`[${workerId}] Flush: ${batch.length} attempted | Saved: ${dbSaved} | Dupes: ${dbDupes} | FEN/Constraint: ${dbFenInvalid}`);
}

// ════════════════════════════════════════════════════════
// SHARED STREAM PROCESSOR — Batch dedup + full pipeline
// ════════════════════════════════════════════════════════

async function processSourceStream(stream, epEngine, source) {
  let processed = 0, skipped = 0, errors = 0;
  let epCorrect = 0, sfCorrect = 0;
  const startTime = Date.now();
  
  // Collect games in small batches for dedup checking
  let gameBuffer = [];
  
  try {
    for await (const game of parseStreamingPGN(stream)) {
      if (processed >= CONFIG.maxGamesPerSource) break;
      
      if (!shouldProcessGame(game)) {
        skipped++;
        continue;
      }
      
      // Quick session cache check
      if (sessionDedup.has(game.id)) {
        skipped++;
        continue;
      }
      
      gameBuffer.push(game);
      
      // When buffer is full, batch-check dedup against DB
      if (gameBuffer.length >= CONFIG.dedupBatchSize) {
        const ids = gameBuffer.map(g => g.id);
        const existingIds = await checkDuplicateBatch(ids);
        
        // Process only the new games
        for (const g of gameBuffer) {
          if (existingIds.has(g.id)) {
            skipped++;
            sessionDedup.add(g.id);
            continue;
          }
          
          if (processed >= CONFIG.maxGamesPerSource) break;
          
          try {
            const totalMoves = g.moves.split(/\d+\./).filter(m => m.trim()).length;
            if (totalMoves < 20) { skipped++; continue; } // Skip short games (<20 moves = opening noise)
            const moveNumber = selectMoveNumber(totalMoves);
            
            const attempt = await processGame(g, moveNumber, epEngine, source);
            if (!attempt) { errors++; continue; }
            
            processed++;
            if (attempt.enhancedCorrect) epCorrect++;
            if (attempt.sf17Correct) sfCorrect++;
            
            pendingBatch.push(attempt);
            
            if (pendingBatch.length >= CONFIG.batchSize) {
              await flushBatch();
              
              if (processed % 500 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = processed / elapsed;
                console.log(
                  `[${workerId}] [${source}] ▸ ${processed.toLocaleString()} games | ${rate.toFixed(1)}/s | ${Math.round(rate * 86400).toLocaleString()}/day` +
                  ` | EP: ${(100 * epCorrect / processed).toFixed(1)}%` +
                  ` | SF: ${(100 * sfCorrect / processed).toFixed(1)}%` +
                  ` | Skipped: ${skipped.toLocaleString()} | Errors: ${errors}`
                );
              }
            }
          } catch { errors++; }
        }
        
        gameBuffer = [];
      }
    }
    
    // Process remaining buffer
    if (gameBuffer.length > 0) {
      const ids = gameBuffer.map(g => g.id);
      const existingIds = await checkDuplicateBatch(ids);
      
      for (const g of gameBuffer) {
        if (existingIds.has(g.id) || processed >= CONFIG.maxGamesPerSource) {
          skipped++;
          continue;
        }
        
        try {
          const totalMoves = g.moves.split(/\d+\./).filter(m => m.trim()).length;
          if (totalMoves < 20) { skipped++; continue; } // Skip short games (<20 moves = opening noise)
          const moveNumber = selectMoveNumber(totalMoves);
          const attempt = await processGame(g, moveNumber, epEngine, source);
          if (!attempt) { errors++; continue; }
          
          processed++;
          if (attempt.enhancedCorrect) epCorrect++;
          if (attempt.sf17Correct) sfCorrect++;
          pendingBatch.push(attempt);
        } catch { errors++; }
      }
    }
  } catch (err) {
    console.log(`[${workerId}] [${source}] Stream ended: ${err.message || 'EOF'}`);
  }
  
  await flushBatch();
  
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(
    `\n[${workerId}] [${source}] ═══ SESSION SUMMARY ═══\n` +
    `  Processed:     ${processed.toLocaleString()}\n` +
    `  EP Accuracy:   ${processed > 0 ? (100 * epCorrect / processed).toFixed(1) : 'N/A'}%\n` +
    `  SF Accuracy:   ${processed > 0 ? (100 * sfCorrect / processed).toFixed(1) : 'N/A'}%\n` +
    `  Skipped:       ${skipped.toLocaleString()} (dedup + filters)\n` +
    `  Errors:        ${errors}\n` +
    `  DB Saved:      ${dbSaved.toLocaleString()} | Dupes: ${dbDupes} | FEN: ${dbFenInvalid}\n` +
    `  Time:          ${(elapsed / 60).toFixed(1)} minutes\n` +
    `  Rate:          ${(processed / elapsed).toFixed(1)} games/sec\n` +
    `══════════════════════════════════════════════════════`
  );
  
  return processed;
}

// ════════════════════════════════════════════════════════
// SOURCE 1: LICHESS OPEN DATABASE
// ════════════════════════════════════════════════════════

const completedLichessMonths = new Set();
const STATE_FILE = join(DATA_DIR, 'ingest-state.json');

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (state.completedLichessMonths) state.completedLichessMonths.forEach(m => completedLichessMonths.add(m));
      return state;
    }
  } catch {}
  return {};
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      completedLichessMonths: [...completedLichessMonths],
      lastUpdate: new Date().toISOString(),
    }, null, 2));
  } catch {}
}

function* generateLichessMonths() {
  let year = CONFIG.lichessStartYear;
  let month = CONFIG.lichessStartMonth;
  while (year > CONFIG.lichessOldestYear || (year === CONFIG.lichessOldestYear && month >= 1)) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    if (!completedLichessMonths.has(monthStr)) yield monthStr;
    month--;
    if (month < 1) { month = 12; year--; }
  }
}

async function ingestLichessDB(epEngine) {
  console.log('\n[LICHESS-DB] Starting Lichess Open Database ingestion...');
  
  const next = generateLichessMonths().next();
  if (next.done) { console.log('[LICHESS-DB] All months completed!'); return 0; }
  
  const monthStr = next.value;
  const url = `https://database.lichess.org/standard/lichess_db_standard_rated_${monthStr}.pgn.zst`;
  
  console.log(`[LICHESS-DB] Streaming month: ${monthStr}`);
  console.log(`[LICHESS-DB] URL: ${url}`);
  
  try {
    const { stdout } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
    if (stdout.trim() !== '200') {
      console.log(`[LICHESS-DB] Month ${monthStr} not available (HTTP ${stdout.trim()}) — skipping`);
      completedLichessMonths.add(monthStr);
      saveState();
      return 0;
    }
  } catch { return 0; }
  
  const curl = spawn('curl', ['-sL', url]);
  const zstd = spawn('zstdcat', ['-']);
  curl.stdout.pipe(zstd.stdin);
  curl.stderr.on('data', d => { const m = d.toString().trim(); if (m) console.error(`[curl] ${m}`); });
  zstd.stderr.on('data', d => { const m = d.toString().trim(); if (m && !m.includes('Read error')) console.error(`[zstd] ${m}`); });
  
  const games = await processSourceStream(zstd.stdout, epEngine, 'lichess_db');
  
  try { curl.kill(); } catch {}
  try { zstd.kill(); } catch {}
  
  if (games >= CONFIG.maxGamesPerSource) {
    console.log(`[LICHESS-DB] Hit max games for ${monthStr} — will continue next cycle`);
  } else {
    completedLichessMonths.add(monthStr);
    saveState();
    console.log(`[LICHESS-DB] ✓ Month ${monthStr} complete (${games} games)`);
  }
  
  return games;
}

// ════════════════════════════════════════════════════════
// SOURCE 2: FICS
// ════════════════════════════════════════════════════════

async function ingestFICS(epEngine) {
  console.log('\n[FICS] Starting FICS historical archive ingestion...');
  
  for (let year = CONFIG.ficsStartYear; year >= CONFIG.ficsOldestYear; year--) {
    const urls = [
      `https://www.ficsgames.org/dl/ficsgamesdb_${year}_standard_nomovetimes_${year}12.pgn.bz2`,
      `https://www.ficsgames.org/dl/ficsgamesdb_${year}_standard_nomovetimes.pgn.bz2`,
      `https://www.ficsgames.org/dl/ficsgamesdb_${year}_standard.pgn.bz2`,
    ];
    
    for (const url of urls) {
      try {
        const { stdout } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
        if (stdout.trim() === '200') {
          console.log(`[FICS] Streaming year ${year}`);
          const curl = spawn('curl', ['-sL', url]);
          const bzcat = spawn('bzcat', ['-']);
          curl.stdout.pipe(bzcat.stdin);
          
          const games = await processSourceStream(bzcat.stdout, epEngine, `fics_${year}`);
          try { curl.kill(); } catch {}
          try { bzcat.kill(); } catch {}
          console.log(`[FICS] Year ${year}: ${games} games`);
          return games;
        }
      } catch {}
    }
    break; // 1 year per cycle
  }
  return 0;
}

// ════════════════════════════════════════════════════════
// SOURCE 3: KINGBASE
// ════════════════════════════════════════════════════════

async function ingestKingBase(epEngine) {
  console.log('\n[KINGBASE] Checking for KingBase master games...');
  const kbDir = join(DATA_DIR, 'kingbase');
  mkdirSync(kbDir, { recursive: true });
  
  const pgnFiles = existsSync(kbDir) ? fs.readdirSync(kbDir).filter(f => f.endsWith('.pgn')) : [];
  
  if (pgnFiles.length === 0) {
    const urls = ['https://rebel13.nl/dl/KingBaseLite2019-A00-E99.pgn.zip'];
    for (const url of urls) {
      try {
        const zipPath = join(kbDir, 'kingbase.zip');
        console.log(`[KINGBASE] Downloading from ${url}...`);
        const { stdout } = await execAsync(`curl -sL -o '${zipPath}' -w '%{http_code}' '${url}'`, { timeout: 300000 });
        if (stdout.trim() === '200' && existsSync(zipPath) && statSync(zipPath).size > 1000000) {
          await execAsync(`unzip -o -q '${zipPath}' -d '${kbDir}'`, { timeout: 120000 });
          try { unlinkSync(zipPath); } catch {}
          break;
        }
        try { unlinkSync(zipPath); } catch {}
      } catch (err) { console.log(`[KINGBASE] Download failed: ${err.message}`); }
    }
  }
  
  const finalPgns = fs.readdirSync(kbDir).filter(f => f.endsWith('.pgn'));
  let totalGames = 0;
  for (const pgnFile of finalPgns) {
    console.log(`[KINGBASE] Processing: ${pgnFile}`);
    const stream = createReadStream(join(kbDir, pgnFile), { encoding: 'utf-8' });
    totalGames += await processSourceStream(stream, epEngine, 'kingbase');
    if (totalGames >= CONFIG.maxGamesPerSource) break;
  }
  return totalGames;
}

// ════════════════════════════════════════════════════════
// SOURCE 4: CCRL
// ════════════════════════════════════════════════════════

async function ingestCCRL(epEngine) {
  console.log('\n[CCRL] Checking for CCRL engine-vs-engine games...');
  const ccrlDir = join(DATA_DIR, 'ccrl');
  mkdirSync(ccrlDir, { recursive: true });
  
  const urls = [
    { url: 'https://ccrl.chessdom.com/ccrl/4040/games.zip', name: 'CCRL_4040' },
  ];
  
  let totalGames = 0;
  for (const { url, name } of urls) {
    const extractDir = join(ccrlDir, name);
    try {
      const { stdout } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
      if (stdout.trim() !== '200') { console.log(`[CCRL] ${name} not accessible`); continue; }
      
      mkdirSync(extractDir, { recursive: true });
      const zipPath = join(ccrlDir, `${name}.zip`);
      console.log(`[CCRL] Downloading ${name}...`);
      await execAsync(`curl -sL -o '${zipPath}' '${url}'`, { timeout: 600000 });
      
      if (existsSync(zipPath) && statSync(zipPath).size > 100000) {
        await execAsync(`unzip -o -q '${zipPath}' -d '${extractDir}'`, { timeout: 120000 });
        try { unlinkSync(zipPath); } catch {}
        
        const pgnFiles = fs.readdirSync(extractDir).filter(f => f.endsWith('.pgn'));
        for (const pgnFile of pgnFiles) {
          console.log(`[CCRL] Processing: ${pgnFile}`);
          const stream = createReadStream(join(extractDir, pgnFile), { encoding: 'utf-8' });
          totalGames += await processSourceStream(stream, epEngine, 'ccrl');
          if (totalGames >= CONFIG.maxGamesPerSource) break;
        }
      }
    } catch (err) { console.log(`[CCRL] Error: ${err.message}`); }
    if (totalGames >= CONFIG.maxGamesPerSource) break;
  }
  return totalGames;
}

// ════════════════════════════════════════════════════════
// SOURCE 5: CHESS.COM BULK GAMES
// ════════════════════════════════════════════════════════

async function ingestChessCom(epEngine) {
  console.log('\n[CHESS.COM] Starting Chess.com bulk game ingestion...');
  
  // Process 5 players per cycle, rotating through the pool
  const playersPerCycle = 5;
  let totalGames = 0;
  
  for (let i = 0; i < playersPerCycle && totalGames < CONFIG.maxGamesPerSource; i++) {
    const player = CHESSCOM_PLAYERS[chesscomPlayerIndex % CHESSCOM_PLAYERS.length];
    chesscomPlayerIndex++;
    
    try {
      // Get player's monthly archives
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${player}/games/archives`, {
        headers: { 'User-Agent': 'EnPensent/1.0 Chess Research (a.arthur.shelton@gmail.com)' }
      });
      if (!archivesRes.ok) {
        console.log(`[CHESS.COM] ${player}: archives failed (${archivesRes.status})`);
        continue;
      }
      
      const archiveData = await archivesRes.json();
      const archives = (archiveData.archives || []).reverse(); // Newest first
      
      if (archives.length === 0) { console.log(`[CHESS.COM] ${player}: no archives`); continue; }
      
      // Process last 3 months of archives per player
      const monthsToProcess = Math.min(3, archives.length);
      let playerGames = 0;
      
      for (let m = 0; m < monthsToProcess && playerGames < 2000; m++) {
        try {
          const gamesRes = await fetch(archives[m], {
            headers: { 'User-Agent': 'EnPensent/1.0 Chess Research (a.arthur.shelton@gmail.com)' }
          });
          if (!gamesRes.ok) continue;
          
          const gamesData = await gamesRes.json();
          const games = (gamesData.games || []).filter(g => {
            if (!g.pgn || g.rules !== 'chess') return false;
            const avgElo = ((g.white?.rating || 0) + (g.black?.rating || 0)) / 2;
            if (avgElo > 0 && avgElo < CONFIG.minElo) return false;
            // Skip bullet (< 60s base time)
            const tcBase = parseInt(String(g.time_control || '300').split('+')[0]);
            if (tcBase < 60) return false;
            return true;
          });
          
          for (const g of games) {
            if (playerGames >= 2000 || totalGames >= CONFIG.maxGamesPerSource) break;
            
            // Extract game ID from URL
            const urlMatch = g.url?.match(/\/game\/(?:live|daily)\/(\d+)/);
            const gameId = urlMatch ? `cc_${urlMatch[1]}` : `cc_${g.end_time || Date.now()}`;
            
            if (sessionDedup.has(gameId)) continue;
            
            // Parse result
            const wResult = g.white?.result;
            const result = wResult === 'win' ? '1-0' : 
                          (g.black?.result === 'win' ? '0-1' : '1/2-1/2');
            if (!['1-0', '0-1', '1/2-1/2'].includes(result)) continue;
            
            // Build game object matching processGame expectations
            const game = {
              id: gameId,
              headers: {
                White: g.white?.username || 'Unknown',
                Black: g.black?.username || 'Unknown',
                WhiteElo: String(g.white?.rating || ''),
                BlackElo: String(g.black?.rating || ''),
                Result: result,
                TimeControl: g.time_control || '',
                Event: g.time_class || 'chess.com',
              },
              moves: g.pgn.replace(/\[[^\]]*\]\s*/g, '').replace(/\{[^}]*\}/g, '').trim(),
              evals: [],
            };
            
            const totalMoves = game.moves.split(/\d+\./).filter(m => m.trim()).length;
            if (totalMoves < 20) continue;
            
            const moveNumber = selectMoveNumber(totalMoves);
            
            try {
              const attempt = await processGame(game, moveNumber, epEngine, 'chess.com');
              if (!attempt) continue;
              
              playerGames++;
              totalGames++;
              pendingBatch.push(attempt);
              
              if (pendingBatch.length >= CONFIG.batchSize) {
                await flushBatch();
              }
            } catch { /* skip failed games */ }
          }
          
          // Rate limit: Chess.com asks for 1 req/sec
          await new Promise(r => setTimeout(r, 1200));
          
        } catch (err) {
          console.log(`[CHESS.COM] ${player} archive error: ${err.message}`);
        }
      }
      
      console.log(`[CHESS.COM] ${player}: ${playerGames} games processed`);
      
      // Polite delay between players
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.log(`[CHESS.COM] ${player} failed: ${err.message}`);
    }
  }
  
  await flushBatch();
  console.log(`[CHESS.COM] Cycle complete: ${totalGames} games from ${playersPerCycle} players`);
  return totalGames;
}

// ════════════════════════════════════════════════════════
// SOURCE 6: LICHESS PUZZLE DATABASE
// Full 8-quadrant extraction on tactical positions with
// known outcomes. Each puzzle = a critical moment where
// piece energy distribution determines the result.
// Puzzle themes → archetype calibration signals.
// ════════════════════════════════════════════════════════

const completedPuzzleBatches = new Set();

async function ingestLichessPuzzles(epEngine) {
  console.log('\n[PUZZLES] Starting Lichess puzzle database ingestion...');
  console.log('[PUZZLES] Full 8-quadrant extraction for tactical calibration');
  
  const puzzleDir = join(DATA_DIR, 'puzzles');
  mkdirSync(puzzleDir, { recursive: true });
  
  const csvPath = join(puzzleDir, 'lichess_db_puzzle.csv');
  
  // Download puzzle DB if not cached (4M+ puzzles, ~300MB compressed)
  if (!existsSync(csvPath) || statSync(csvPath).size < 1000000) {
    console.log('[PUZZLES] Downloading Lichess puzzle database...');
    const url = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
    
    try {
      const { stdout } = await execAsync(
        `curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 }
      );
      if (stdout.trim() !== '200') {
        console.log('[PUZZLES] Puzzle DB not available');
        return 0;
      }
      
      console.log('[PUZZLES] Streaming + decompressing puzzle DB...');
      await execAsync(
        `curl -sL '${url}' | zstdcat > '${csvPath}'`,
        { timeout: 600000, maxBuffer: 1024 * 1024 * 10 }
      );
      
      if (!existsSync(csvPath) || statSync(csvPath).size < 1000000) {
        console.log('[PUZZLES] Download failed or file too small');
        return 0;
      }
      
      const lineCount = await execAsync(`wc -l < '${csvPath}'`, { timeout: 30000 });
      console.log(`[PUZZLES] ✓ Downloaded: ${lineCount.stdout.trim()} puzzles`);
    } catch (err) {
      console.log(`[PUZZLES] Download error: ${err.message}`);
      return 0;
    }
  }
  
  // Process puzzles in batches from random offsets for variety
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extractEnhancedSignature } = epEngine;
  
  // Pick a random starting line for this cycle (skip header)
  const totalLines = parseInt((await execAsync(`wc -l < '${csvPath}'`, { timeout: 10000 })).stdout.trim()) || 0;
  if (totalLines < 100) { console.log('[PUZZLES] Puzzle file too small'); return 0; }
  
  const startLine = 2 + Math.floor(Math.random() * Math.max(1, totalLines - CONFIG.maxGamesPerSource));
  const batchKey = `${startLine}-${startLine + CONFIG.maxGamesPerSource}`;
  
  console.log(`[PUZZLES] Processing from line ${startLine} (of ${totalLines.toLocaleString()} total)`);
  
  // Stream CSV lines using sed + head for the batch window
  let processed = 0, skipped = 0, errors = 0;
  let epCorrect = 0, sfCorrect = 0;
  const startTime = Date.now();
  
  try {
    const { stdout: csvBatch } = await execAsync(
      `sed -n '${startLine},${startLine + 5000}p' '${csvPath}'`,
      { timeout: 30000, maxBuffer: 1024 * 1024 * 50 }
    );
    
    const lines = csvBatch.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      if (processed >= CONFIG.maxGamesPerSource) break;
      
      // CSV: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
      const parts = line.split(',');
      if (parts.length < 8) continue;
      
      const [puzzleId, fen, moves, rating, , , nbPlays, themes, gameUrl] = parts;
      if (!fen || !moves || !puzzleId) continue;
      
      const puzzleRating = parseInt(rating) || 1500;
      if (puzzleRating < 1200) { skipped++; continue; } // Skip very easy puzzles
      
      const solutionMoves = moves.split(' ').filter(m => m.trim());
      if (solutionMoves.length < 2) { skipped++; continue; } // Need at least opponent move + solution
      
      const gameId = `puz_${puzzleId}`;
      if (sessionDedup.has(gameId)) { skipped++; continue; }
      
      try {
        // Build a mini-PGN from the puzzle FEN + solution moves
        // The puzzle starts with the opponent's last move, then the solution
        // Side to move in FEN = the solver (they have the winning tactic)
        const sideToMove = fen.split(' ')[1]; // 'w' or 'b'
        const solverWins = sideToMove === 'w' ? 'white_wins' : 'black_wins';
        // After first move (opponent's blunder), solver plays the solution
        // The actual outcome is that the solver wins
        const actualOutcome = solverWins;
        
        // Build PGN with FEN header so simulateGame can parse it
        const pgnMoves = solutionMoves.map((m, i) => {
          if (i % 2 === 0) return `${Math.floor(i / 2) + 1}. ${m}`;
          return m;
        }).join(' ');
        const puzzlePgn = `[FEN "${fen}"]\n[SetUp "1"]\n[Result "${sideToMove === 'w' ? '1-0' : '0-1'}"]\n\n${pgnMoves}`;
        
        // Run full 8-quadrant extraction on the puzzle position
        let simulation, enhancedSig = null, baselineSig = null;
        
        try {
          simulation = simulateGame(puzzlePgn);
        } catch {
          // FEN-based PGN may not parse — try direct board analysis
          skipped++;
          continue;
        }
        
        const board = simulation.board;
        const totalMoves = simulation.totalMoves || solutionMoves.length;
        
        // Get Stockfish eval on the puzzle position
        let sfEvalCp = 0;
        try {
          const sfResult = await evaluateWithStockfish(fen, CONFIG.sfDepth);
          sfEvalCp = Math.round(sfResult.evaluation * 100);
        } catch { /* use 0 */ }
        
        // Baseline 4-quadrant signature
        try {
          baselineSig = extractColorFlowSignature(board, {}, totalMoves);
        } catch { /* skip */ }
        
        // Full 8-quadrant enhanced extraction — this is the key for puzzles
        // Each piece's unique color traces through its squares reveal the tactical pattern
        if (extractEnhancedSignature) {
          try {
            enhancedSig = extractEnhancedSignature(simulation);
          } catch { /* extraction failed */ }
        }
        
        // Predict from signature
        let prediction = null;
        const sigToUse = enhancedSig || baselineSig;
        if (sigToUse) {
          try {
            prediction = predictFromColorFlow(sigToUse, totalMoves, sfEvalCp, 18);
          } catch { /* prediction failed */ }
        }
        
        if (!prediction) { errors++; continue; }
        
        const predictedOutcome = prediction.predictedWinner === 'white' ? 'white_wins' :
                                prediction.predictedWinner === 'black' ? 'black_wins' : 'draw';
        const epIsCorrect = predictedOutcome === actualOutcome;
        
        // SF prediction for comparison
        const sfPrediction = sfEvalCp > 30 ? 'white_wins' : sfEvalCp < -30 ? 'black_wins' : 'draw';
        const sfIsCorrect = sfPrediction === actualOutcome;
        
        if (epIsCorrect) epCorrect++;
        if (sfIsCorrect) sfCorrect++;
        
        // Store in DB with full 8-quadrant data + puzzle metadata
        const attempt = {
          gameId,
          gameName: `Puzzle ${puzzleId} (${puzzleRating})`,
          moveNumber: totalMoves,
          fen,
          positionHash: `puz_${puzzleId}`,
          sfEvalCp,
          sfDepth: CONFIG.sfDepth,
          sf17Prediction: sfPrediction,
          sf17Confidence: Math.min(95, 50 + Math.abs(sfEvalCp) / 5),
          sf17Correct: sfIsCorrect,
          enhancedPrediction: predictedOutcome,
          enhancedCorrect: epIsCorrect,
          enhancedArchetype: enhancedSig?.archetype || baselineSig?.archetype || 'unknown',
          enhancedConfidence: Math.min(0.69, Math.max(0.15, (prediction.confidence || 50) / 100)),
          baselinePrediction: predictedOutcome,
          baselineCorrect: epIsCorrect,
          actualOutcome,
          dataSource: 'lichess_puzzle',
          dataQualityTier: 'farm_puzzle_8quad',
          whiteElo: puzzleRating,
          blackElo: puzzleRating,
          timeControl: 'puzzle',
          pgn: puzzlePgn.substring(0, 2000),
          // 8-quadrant profile from enhanced extraction
          eightQuadrantProfile: enhancedSig?.enhancedProfile || null,
          pieceTypeMetrics: enhancedSig?.enhancedProfile ? {
            bishopDominance: enhancedSig.enhancedProfile.bishop_dominance,
            knightDominance: enhancedSig.enhancedProfile.knight_dominance,
            rookDominance: enhancedSig.enhancedProfile.rook_dominance,
            queenDominance: enhancedSig.enhancedProfile.queen_dominance,
          } : null,
          colorRichness: enhancedSig?.colorRichness || 0,
          complexity: enhancedSig?.complexity || 0,
          hasRealEval: true,
          // Store puzzle themes + rating in metadata (→ lesson_learned column)
          metadata: { puzzleThemes: themes || '', puzzleRating, nbPlays: parseInt(nbPlays) || 0 },
        };
        
        processed++;
        pendingBatch.push(attempt);
        sessionDedup.add(gameId);
        
        if (pendingBatch.length >= CONFIG.batchSize) {
          await flushBatch();
          
          if (processed % 500 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(
              `[PUZZLES] ▸ ${processed.toLocaleString()} puzzles | ${(processed / elapsed).toFixed(1)}/s` +
              ` | EP: ${(100 * epCorrect / processed).toFixed(1)}%` +
              ` | SF: ${(100 * sfCorrect / processed).toFixed(1)}%` +
              ` | Themes: ${themes?.split(' ').slice(0, 3).join(', ') || '—'}`
            );
          }
        }
      } catch { errors++; }
    }
  } catch (err) {
    console.log(`[PUZZLES] Batch error: ${err.message}`);
  }
  
  await flushBatch();
  
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(
    `\n[PUZZLES] ═══ PUZZLE SESSION ═══\n` +
    `  Processed:     ${processed.toLocaleString()}\n` +
    `  EP Accuracy:   ${processed > 0 ? (100 * epCorrect / processed).toFixed(1) : 'N/A'}%\n` +
    `  SF Accuracy:   ${processed > 0 ? (100 * sfCorrect / processed).toFixed(1) : 'N/A'}%\n` +
    `  Skipped:       ${skipped.toLocaleString()}\n` +
    `  Errors:        ${errors}\n` +
    `  Time:          ${(elapsed / 60).toFixed(1)} minutes\n` +
    `══════════════════════════════════════════════════════`
  );
  
  return processed;
}

// ════════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════════

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  
  console.log('═'.repeat(60));
  console.log(`En Pensent — Multi-Source Chess DB Ingest Worker`);
  console.log(`Worker ID: ${workerId}`);
  console.log('═'.repeat(60));
  console.log(`Sources: Lichess DB | FICS | KingBase | CCRL | Chess.com | Lichess Puzzles`);
  console.log(`Min ELO: ${CONFIG.minElo}`);
  console.log(`Max games/source/cycle: ${CONFIG.maxGamesPerSource.toLocaleString()}`);
  console.log(`SF Depth: ${CONFIG.sfDepth}`);
  console.log(`Dedup: Lightweight batch-check (${CONFIG.dedupBatchSize} IDs/batch)`);
  console.log('─'.repeat(60));
  
  loadState();
  
  console.log('Loading EP engine...');
  const epEngine = await loadEPEngine();
  console.log('✓ EP engine loaded');
  console.log('═'.repeat(60));
  
  let cycleCount = 0;
  
  while (true) {
    cycleCount++;
    const cycleStart = Date.now();
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`CYCLE ${cycleCount} — ${new Date().toISOString()}`);
    console.log('═'.repeat(60));
    
    let totalGames = 0;
    
    if (CONFIG.enableLichessDB) {
      try { totalGames += await ingestLichessDB(epEngine); }
      catch (err) { console.error(`[LICHESS-DB] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableFICS) {
      try { totalGames += await ingestFICS(epEngine); }
      catch (err) { console.error(`[FICS] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableKingBase) {
      try { totalGames += await ingestKingBase(epEngine); }
      catch (err) { console.error(`[KINGBASE] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableCCRL) {
      try { totalGames += await ingestCCRL(epEngine); }
      catch (err) { console.error(`[CCRL] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableChessCom) {
      try { totalGames += await ingestChessCom(epEngine); }
      catch (err) { console.error(`[CHESS.COM] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableLichessPuzzles) {
      try { totalGames += await ingestLichessPuzzles(epEngine); }
      catch (err) { console.error(`[PUZZLES] Fatal: ${err.message}`); }
    }
    
    const elapsed = (Date.now() - cycleStart) / 1000 / 60;
    console.log(`\nCycle ${cycleCount} complete: ${totalGames.toLocaleString()} games in ${elapsed.toFixed(1)} min`);
    console.log(`DB totals: Saved=${dbSaved.toLocaleString()} | Dupes=${dbDupes} | FEN=${dbFenInvalid}`);
    
    // Refresh player intelligence every 5 cycles (~30K games between refreshes)
    if (cycleCount % 5 === 1) {
      try {
        await refreshPlayerIntelligence(resilientQuery);
      } catch (piErr) {
        console.log(`[${workerId}] Player intel refresh non-critical: ${piErr.message}`);
      }
    }
    
    saveState();
    
    const sleepMin = totalGames > 0 ? 5 : 30;
    console.log(`Sleeping ${sleepMin} min before next cycle...`);
    await new Promise(r => setTimeout(r, sleepMin * 60 * 1000));
  }
}

main().catch(err => {
  console.error(`[${workerId}] Fatal error:`, err);
  process.exit(1);
});
