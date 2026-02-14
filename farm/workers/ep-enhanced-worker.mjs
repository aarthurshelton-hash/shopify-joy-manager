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
import { getIntelligentFusionWeights, updateLiveArchetypeAccuracy } from './fusion-intelligence.mjs';
import { refreshPlayerIntelligence, getPlayerIntelSummary } from './player-intelligence.mjs';
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
// v11: Reduced pool size to prevent Supabase pooler exhaustion
// 3 workers × 2 = 6 connections (was 3×8=24, exhausting 60-conn pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
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
      // Don't retry constraint violations — they'll never succeed on retry
      if (err.code === '23505' || err.code === '23514' || err.code === '23502') throw err;
      if (attempt === retries) throw err;
      const delay = attempt * 2000;
      console.log(`[POOL] Query failed (attempt ${attempt}/${retries}): ${err.message} [query: ${queryText.replace(/\s+/g,' ').slice(0,60)}...], retrying in ${delay}ms...`);
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
// v9.2: Enabled by default — was false, making Enhanced ≡ Baseline (no differentiation)
const USE_ENHANCED_SIGNATURES = process.env.USE_ENHANCED !== 'false';

// Stats tracking with A/B test data
let stats = {
  cycles: 0,
  totalGames: 0,
  predictionsMade: 0,
  sf17Correct: 0,
  epCorrect: 0,
  epEnhancedCorrect: 0,
  // 3-way class tracking (draws are critical for unbiased accuracy)
  drawsTotal: 0,
  drawsEpCorrect: 0,
  drawsSfCorrect: 0,
  decisiveTotal: 0,
  decisiveEpCorrect: 0,
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

// Live archetype weights — refreshed from DB every 25 cycles (Pro tier)
let liveArchetypeWeights = loadLiveWeights();

// Multi-source game fetching configuration
const GAME_SOURCES = {
  LICHESS_PLAYERS: [
    // Top GMs — verified active accounts
    'DrNykterstein', 'nihalsarin2004', 'penguingm1', 'Msb2', 'Fins',
    'chessbrah', 'opperwezen', 'EricRosen', 'ChessNetwork', 'Oleksandr_Bortnyk',
    'duhless', 'howitzer14', 'lance5500', 'Navaraok',
    'VincentKeymer2004', 'WesleyS8', 'NeverEnough',
    'lovlas', 'nepoking', 'Naroditsky',
    'DrDrunkenstein', 'manwithavan', 'STL_Caruana',
    'gmwso', 'LyonBeast', 'chessbrahs', 'aprilchess',
    'RealDavidNavara', 'German11', 'Zhigalko_Sergei',
    'thibault', 'Bombegansen', 'penguin',
    'Konavets', 'Csjh', 'Zsjh', 'RebeccaHarris',
    'IM_not_a_GM', 'alireza2003',
    // Batch 2 — additional titled players for volume
    'Jospem', 'JMVL75', 'Mareco', 'Arka50', 'may6enexttime',
    'Drnykansen', 'Vladimir_Onischuk', 'GM_Sethuraman', 'SuleymanSuleymanov',
    'Bigfish1995', 'night-king96', 'RaufMamedov', 'GM_Atabayev',
    'bakhtiyar_Ibragiimov', 'igorkovalenko', 'FairChess_on_YouTube',
    'Gogieff', 'crestbook', 'Russian-Deficit', 'MrDodgy',
    'Graansen', 'TigrVShlyworke', 'BahadurMUSTBE', 'Zaven_Andriasyan',
    'Vladimirovich9000', 'GhandeevamChess', 'Yuriy_Kuzubov',
    'TheRealPanfil', 'VolodarBorsh', 'GothamFan1', 'Araz_Basimov',
    'GMBenjaminBok', 'cheparinov', 'tropentag', 'GarryKasparov',
    // Batch 3 — IMs and strong FMs with high volume
    'StellarinIGM', 'rebeccaharris', 'DaVe_ChEsS', 'Zheka_Galitsky',
    'LeiKLei', 'IMAnna', 'FIDE_MasterM', 'Csjh_backup',
    'KeithArkell', 'Polgar_J', 'SuPi1996', 'Korobov',
    'Keymer_Vincent', 'Dreev', 'LuisPauloSupi', 'TomRaj',
    'MarinMihail', 'SergeiZhigalko', 'GM_Xiangzhi', 'Fedoseev',
    'Sarana', 'dubov_danya', 'Wojtaszek', 'Vitiugov',
  ],
  CHESSCOM_PLAYERS: [
    // Top GMs — verified active accounts
    'Hikaru', 'MagnusCarlsen', 'nihalsarin', 'FabianoCaruana',
    'DanielNaroditsky', 'GothamChess', 'AnishGiri',
    'WesleySo', 'Praggnanandhaa', 'DominguezPerez', 'Grischuk',
    'ArjunErigaisi', 'HansMokeNiemann', 'LevonAronian', 'ViditGujrathi',
    'DingLiren', 'RichardRapport', 'IanNepomniachtchi',
    'RameshbabuPraggnanandhaa', 'VincentKeymer', 'NodirbekAbdusattorov',
    'Firouzja2003', 'AlirezaFirouzja', 'Duhless', 'Vladimirkramnik',
    'ChessWarrior7197', 'LachesisQ', 'Lyonbeast', 'Msb2',
    'Bigfish1995', 'Oleksandr_Bortnyk', 'Zhigalko_Sergei',
    // Batch 2 — additional titled players
    'SamShankland', 'MVLOfficial', 'leinier', 'Jefferyx',
    'GMHikaruNakamura', 'DavidHowell', 'GataKamsky', 'AlexanderGrischuk',
    'BorisGelfand', 'PeterSvidler', 'Pentala_Harikrishna', 'SantoshGujrathi',
    'SergeiMovsesian', 'SergeyKarjakin', 'MaximeVachier', 'TeimourRadjabov',
    'SamuelSevian', 'RayRobson', 'ChristopherYoo', 'Leinier',
    'JordanVanForrest', 'RadosPlawBelka', 'JanKrzysztofDuda',
    'NiclasSentientHubert', 'BogdanDanielDeac', 'GukeshD',
    'Erigaisi_Arjun', 'VishyAnand', 'SebastianLuepke', 'ParhamMaghsoodloo',
    // Batch 3 — strong GMs for deeper coverage
    'BassemAmin', 'SalehSalem', 'SantoshVidit', 'GirigGiri',
    'KrishnanSasikiran', 'VuongQuangLiem', 'LeQuangLiem',
    'TuanMinh_Le', 'KierenShome', 'Nodirbek', 'MVL_Chess',
    'GMAbhimanyu', 'EtienneBacrot', 'MaxVachier', 'Tiger_Hillarp',
    'JoelBenjamin', 'LoekVanWely', 'AlexanderMorozevich',
    'IvanCheparinov', 'VladimirMalakhov', 'DmitryAndreikin',
  ],
  // Puzzles provide training positions with known outcomes
  PUZZLE_SOURCES: ['chesscom_rated', 'lichess_puzzle'],
};

/**
 * Dynamic player discovery — fetch active titled players from Lichess leaderboard.
 * Returns hundreds of active usernames we haven't seen before.
 */
async function discoverLichessPlayers() {
  const discovered = new Set();
  const perfTypes = ['bullet', 'blitz', 'rapid', 'classical'];
  for (const perf of perfTypes) {
    try {
      const res = await fetch(`https://lichess.org/api/player/top/200/${perf}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        for (const u of users) {
          if (u.username) discovered.add(u.username);
        }
      }
      await new Promise(r => setTimeout(r, 1500)); // Rate limit
    } catch (e) {
      console.log(`[DISCOVER] Lichess ${perf} leaderboard failed: ${e.message}`);
    }
  }
  return [...discovered];
}

// ═══════════════════════════════════════════════════════════════════
// WORKER COORDINATION: Deterministic partitioning — no overlap ever
// ═══════════════════════════════════════════════════════════════════
const workerNum = parseInt((process.env.WORKER_ID || '').replace(/\D/g, '') || '1', 10);

// Partition players into exclusive slices per worker — mutable so discovery can expand
const allLichessBase = GAME_SOURCES.LICHESS_PLAYERS.filter((v, i, a) => a.indexOf(v) === i);
const allChesscomPlayers = GAME_SOURCES.CHESSCOM_PLAYERS.filter((v, i, a) => a.indexOf(v) === i);
const TOTAL_WORKERS = 3;
let myLichessPlayers = [];
const chesscomSlice = Math.ceil(allChesscomPlayers.length / TOTAL_WORKERS);
const myChesscomPlayers = allChesscomPlayers.slice((workerNum - 1) * chesscomSlice, workerNum * chesscomSlice);

// Initialize with static list, will be expanded by discovery
const lichessSlice = Math.ceil(allLichessBase.length / TOTAL_WORKERS);
myLichessPlayers = allLichessBase.slice((workerNum - 1) * lichessSlice, workerNum * lichessSlice);

/**
 * Expand Lichess player pool with dynamically discovered players from leaderboards.
 * Each worker gets a deterministic slice of discovered players (no overlap).
 */
async function expandPlayerPool() {
  try {
    const discovered = await discoverLichessPlayers();
    if (discovered.length === 0) return;
    // Merge with static list, dedupe
    const knownSet = new Set(allLichessBase);
    const newPlayers = discovered.filter(p => !knownSet.has(p));
    if (newPlayers.length === 0) {
      console.log(`[${workerId}] Discovery: ${discovered.length} players found, all already known`);
      return;
    }
    // Sort for deterministic partitioning, then take this worker's slice
    newPlayers.sort();
    const discSlice = Math.ceil(newPlayers.length / TOTAL_WORKERS);
    const myNewSlice = newPlayers.slice((workerNum - 1) * discSlice, workerNum * discSlice);
    // Add to pool (dedupe against existing)
    const existing = new Set(myLichessPlayers);
    let added = 0;
    for (const p of myNewSlice) {
      if (!existing.has(p)) {
        myLichessPlayers.push(p);
        added++;
      }
    }
    console.log(`[${workerId}] Discovery: +${added} new Lichess players (pool now ${myLichessPlayers.length})`);
  } catch (e) {
    console.log(`[${workerId}] Discovery failed: ${e.message}`);
  }
}

console.log(`[${workerId}] Initial Lichess pool: ${myLichessPlayers.length} players`);
console.log(`[${workerId}] Chess.com pool: ${myChesscomPlayers.length} players`);

// Each worker gets a deterministic source rotation offset
let currentSourceIndex = (workerNum - 1) * 100;

// Session-only dedup: tracks game IDs processed THIS session only.
// Cross-session dedup: lightweight batch DB check before processing (not 1M+ preload).
// Final safety net: DB unique constraint + ON CONFLICT DO NOTHING.
const analyzedGameIds = new Set();

/**
 * Lightweight batch dedup: check a batch of game IDs against the DB.
 * Returns Set of IDs that already exist. Fast — just one SELECT per batch.
 */
async function checkDuplicateBatch(gameIds) {
  if (gameIds.length === 0) return new Set();
  const toCheck = gameIds.filter(id => !analyzedGameIds.has(id));
  if (toCheck.length === 0) return new Set();
  const existingIds = new Set();
  try {
    const result = await resilientQuery(
      `SELECT game_id FROM chess_prediction_attempts WHERE game_id = ANY($1)`,
      [toCheck]
    );
    for (const row of result.rows) {
      existingIds.add(row.game_id);
      analyzedGameIds.add(row.game_id); // Cache for session
    }
  } catch (err) {
    console.log(`[${workerId}] Batch dedup check failed (will use ON CONFLICT): ${err.message}`);
  }
  return existingIds;
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
    
    // Try to load enhanced signature extractor (legacy 12-color)
    let enhancedModule = null;
    try {
      enhancedModule = await import(join(distPath, 'colorFlowAnalysis', 'enhancedSignatureExtractor.js'));
    } catch (e) {
      console.log('Legacy enhanced signatures not available');
    }
    
    // Load the TRUE 32-piece color flow system
    let piece32Module = null;
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      piece32Module = require(join(distPath, 'colorFlowAnalysis', 'pieceColorFlow32.js'));
      console.log('✓ 32-piece color flow system loaded (32 unique hues, squares-within-squares)');
    } catch (e) {
      console.log('32-piece module not available:', e.message);
    }
    
    return {
      // Baseline 4-quadrant
      extractColorFlowSignature: colorFlowModule.extractColorFlowSignature,
      predictFromColorFlow: colorFlowModule.predictFromColorFlow,
      simulateGame: gameSimModule.simulateGame,
      
      // Legacy enhanced (12-color, kept for archetype classification)
      extractEnhancedSignature: enhancedModule?.extractEnhancedColorFlowSignature || null,
      compareEnhancedProfiles: enhancedModule?.compareEnhancedProfiles || null,
      
      // TRUE 32-piece system (each piece unique hue, own predictor)
      extract32PieceSignature: piece32Module?.extract32PieceSignature || null,
      predictFrom32Piece: piece32Module?.predictFrom32PieceSignature || null,
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
// FRESH GAMES: Fetch most recent games (no time window lock).
// Player pools are already partitioned between workers — no overlap.
// Dedup set catches anything already in DB.
// Billions of public games available; players play new games every day.
console.log(`[${workerId}] Mode: FRESH — fetching most recent games from ${myLichessPlayers.length} Lichess + ${myChesscomPlayers.length} Chess.com players`);
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
        
        // Fetch games — go deeper into history when recent games exhausted
        // Rotate 'since' back in time: cycle 0 = recent, cycle 1 = 1 month ago, etc.
        const monthsBack = Math.floor(stats.cycles / myLichessPlayers.length) % 24; // up to 2 years back
        const sinceMs = monthsBack > 0 ? Date.now() - (monthsBack * 30 * 24 * 60 * 60 * 1000) : undefined;
        const sinceParam = sinceMs ? `&until=${sinceMs}&since=${sinceMs - 30 * 24 * 60 * 60 * 1000}` : '';
        const url = `https://lichess.org/api/games/user/${player}?max=${Math.max(count, 200)}&perfType=${actualPerfType}&rated=true&finished=true&ongoing=false&evals=true&clocks=true${sinceParam}`;
        
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
          
          // Include ALL results: wins, losses, AND draws
          // Draws are critical at high-level chess (50%+ of GM games)
          // Filtering them out creates fundamental prediction bias
          const validGames = games.filter(g => g.result && g.pgn);
          
          if (validGames.length > 0) {
            console.log(`[FARM] ✓ Fetched ${validGames.length} games from Lichess (${player}) [W:${validGames.filter(g=>g.result==='1-0').length} B:${validGames.filter(g=>g.result==='0-1').length} D:${validGames.filter(g=>g.result==='1/2-1/2').length}]`);
            // Rate limit: wait 2s after successful fetch
            await new Promise(r => setTimeout(r, 2000));
            return validGames.slice(0, count);
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
    
    // v12.1: PLAYER PROFILING — extract rich metadata for per-player learning
    // Titles: GM, IM, FM, NM, CM, WGM, WIM, WFM — reveals caliber + playing style
    const whiteTitleMatch = pgn.match(/\[WhiteTitle "([^"]*)"\]/);
    const blackTitleMatch = pgn.match(/\[BlackTitle "([^"]*)"\]/);
    // Opening: ECO code (e.g. B90) + name (e.g. "Sicilian Defense: Najdorf Variation")
    const ecoMatch = pgn.match(/\[ECO "([^"]*)"\]/);
    const openingMatch = pgn.match(/\[Opening "([^"]*)"\]/);
    // Time of game: UTC date + time — enables time-of-day analysis
    // (morning players think differently than midnight grinders)
    const utcDateMatch = pgn.match(/\[UTCDate "([^"]*)"\]/);
    const utcTimeMatch = pgn.match(/\[UTCTime "([^"]*)"\]/);
    // Termination: Normal, Time forfeit, Abandoned — how the game ended
    const terminationMatch = pgn.match(/\[Termination "([^"]*)"\]/);
    
    // Compute time-of-day bucket for temporal profiling
    let timeOfDay = null;
    if (utcTimeMatch?.[1]) {
      const hour = parseInt(utcTimeMatch[1].split(':')[0]);
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';
    }
    
    // Compute ELO tier for archetype grouping
    const avgElo = (whiteEloMatch && blackEloMatch) ? 
      Math.round((parseInt(whiteEloMatch[1]) + parseInt(blackEloMatch[1])) / 2) : null;
    let eloTier = null;
    if (avgElo) {
      if (avgElo >= 2500) eloTier = 'super_gm';       // Elite — deep preparation, rare blunders
      else if (avgElo >= 2200) eloTier = 'master';     // Titled — consistent, theory-heavy
      else if (avgElo >= 1800) eloTier = 'expert';     // Strong club — knows openings, makes tactical errors
      else if (avgElo >= 1400) eloTier = 'intermediate'; // Developing — pattern-based, frequent inaccuracies
      else eloTier = 'beginner';                        // Learning — chaotic, unpredictable
    }
    
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
      // v12.1: Player profiling fields
      playerProfile: {
        whiteTitle: whiteTitleMatch?.[1] || null,
        blackTitle: blackTitleMatch?.[1] || null,
        eco: ecoMatch?.[1] || null,
        opening: openingMatch?.[1] || null,
        utcDate: utcDateMatch?.[1] || null,
        utcTime: utcTimeMatch?.[1] || null,
        timeOfDay,
        termination: terminationMatch?.[1] || null,
        avgElo,
        eloTier,
      },
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
    
    // Fetch most recent archive first, then rotate to older ones as dedup filters out known games
    const archiveIndex = Math.max(0, archives.archives.length - 1 - (stats.cycles % archives.archives.length));
    const selectedArchive = archives.archives[archiveIndex];
    const gamesRes = await fetch(selectedArchive);
    if (!gamesRes.ok) throw new Error('Failed to fetch games');
    
    const data = await gamesRes.json();
    const games = data.games || [];
    
    // Include ALL results: wins, losses, AND draws
    // Draws are critical data — filtering them biases the entire model
    const validGames = games
      .filter(g => g.pgn)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(count, 200));
    
    const wCount = validGames.filter(g => g.white.result === 'win').length;
    const bCount = validGames.filter(g => g.black.result === 'win').length;
    const dCount = validGames.length - wCount - bCount;
    console.log(`[FARM] Fetched ${validGames.length} games from Chess.com (${player}, archive ${archiveIndex}) [W:${wCount} B:${bCount} D:${dCount}]`);
    
    return validGames.map(g => {
      const result = g.white.result === 'win' ? '1-0' : 
                     g.black.result === 'win' ? '0-1' : '1/2-1/2';
      const whiteName = g.white?.username || g.white?.['@id']?.split('/')?.pop() || 'Unknown';
      const blackName = g.black?.username || g.black?.['@id']?.split('/')?.pop() || 'Unknown';
      const wElo = g.white?.rating || null;
      const bElo = g.black?.rating || null;
      const avgElo = (wElo && bElo) ? Math.round((wElo + bElo) / 2) : null;
      
      // Extract opening from PGN headers if present
      const ecoMatch = g.pgn?.match(/\[ECO "([^"]*)"\]/);
      const openingMatch = g.pgn?.match(/\[Opening "([^"]*)"\]/);
      // Extract UTC time from PGN for time-of-day analysis
      const utcTimeMatch = g.pgn?.match(/\[EndTime "([^"]*)"\]/) || g.pgn?.match(/\[StartTime "([^"]*)"\]/);
      let timeOfDay = null;
      if (utcTimeMatch?.[1]) {
        const hour = parseInt(utcTimeMatch[1].split(':')[0]);
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';
      }
      
      let eloTier = null;
      if (avgElo) {
        if (avgElo >= 2500) eloTier = 'super_gm';
        else if (avgElo >= 2200) eloTier = 'master';
        else if (avgElo >= 1800) eloTier = 'expert';
        else if (avgElo >= 1400) eloTier = 'intermediate';
        else eloTier = 'beginner';
      }
      
      return {
        id: `${g.url?.match(/\/(\d+)$/)?.[1] || Date.now()}`,
        pgn: g.pgn,
        white: whiteName,
        black: blackName,
        result,
        moves: [],
        source: 'chess.com',
        whiteElo: wElo,
        blackElo: bElo,
        timeControl: g.time_control ? String(g.time_control) : null,
        event: g.time_class || 'chess.com',
        // v12.1: Player profiling for chess.com games
        playerProfile: {
          whiteTitle: null,  // Chess.com API doesn't expose titles in game data
          blackTitle: null,
          eco: ecoMatch?.[1] || null,
          opening: openingMatch?.[1] || null,
          utcDate: null,
          utcTime: utcTimeMatch?.[1] || null,
          timeOfDay,
          termination: g.white?.result === 'timeout' || g.black?.result === 'timeout' ? 'Time forfeit' : 'Normal',
          avgElo,
          eloTier,
        },
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
  // Lichess weighted 3:2 to compensate for higher API failure/timeout rate
  const sources = ['lichess', 'chesscom', 'lichess', 'chesscom', 'lichess'];
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
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extract32PieceSignature, predictFrom32Piece } = epEngine;
  
  // ── 4-QUADRANT BASELINE (always runs) ──
  let simulation, board, totalMoves;
  let baselineSignature, baselinePrediction;
  try {
    simulation = simulateGame(fullPgn);
    board = simulation.board;
    totalMoves = simulation.totalMoves || moveCount;
    baselineSignature = extractColorFlowSignature(board, gameData, totalMoves);
    const baselineColorPred = predictFromColorFlow(baselineSignature, totalMoves, sfEvalCp, 18);
    baselinePrediction = {
      predictedWinner: baselineColorPred.predictedWinner === 'white' ? 'white_wins' :
                       baselineColorPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
      confidence: baselineColorPred.confidence / 100,
      whiteAdvantage: sfEvalCp / 100,
    };
  } catch (e) {
    // Simulation failed — SF eval fallback
    const absSf = Math.abs(sfEvalCp);
    const phase = moveCount < 15 ? 'opening' : moveCount < 30 ? 'middlegame' : 'endgame';
    const fallbackSig = {
      archetype: absSf > 200 ? 'central_domination' : absSf > 80 ? 'kingside_attack' : 'balanced_flow',
      dominantSide: sfEvalCp > 0 ? 'white' : sfEvalCp < 0 ? 'black' : 'contested',
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
    baselinePrediction = {
      predictedWinner: fallbackPred.predictedWinner === 'white' ? 'white_wins' :
                       fallbackPred.predictedWinner === 'black' ? 'black_wins' : 'draw',
      confidence: fallbackPred.confidence / 100,
      whiteAdvantage: sfEvalCp / 100,
    };
    baselineSignature = fallbackSig;
  }
  
  // ── 32-PIECE ENHANCED ENGINE ──
  // Each of 32 pieces gets unique hue. Traces through squares.
  // Overlapping traces = squares within squares. Own predictor.
  let piece32Sig = null;
  let enhancedPrediction = baselinePrediction; // fallback if 32-piece fails
  
  if (extract32PieceSignature && predictFrom32Piece && USE_ENHANCED_SIGNATURES) {
    try {
      piece32Sig = extract32PieceSignature(fullPgn, moveCount);
    } catch (e) {
      // 32-piece extraction failed — stays on baseline
    }
    if (piece32Sig) {
      try {
        // Use the 32-piece predictor — calibrated FOR 32-piece data
        const pred32 = predictFrom32Piece(piece32Sig, sfEvalCp, moveCount);
        if (pred32) {
          enhancedPrediction = {
            predictedWinner: pred32.predictedWinner === 'white' ? 'white_wins' :
                             pred32.predictedWinner === 'black' ? 'black_wins' : 'draw',
            confidence: pred32.confidence,
            whiteAdvantage: pred32.ensembleScore,
            agreement: pred32.agreement,
            signalCount: pred32.signalCount,
          };
        }
      } catch (e) {
        // Prediction failed — 32-piece sig preserved for DB storage
      }
    }
  }
  
  // Classify archetype from 32-piece data or fall back to baseline
  const enhancedArchetype = piece32Sig ? classifyArchetypeFrom32Piece(piece32Sig) : baselineSignature.archetype;
  
  return {
    baseline: {
      signature: baselineSignature,
      prediction: baselinePrediction,
      fingerprint: baselineSignature.fingerprint,
      archetype: baselineSignature.archetype,
    },
    enhanced: piece32Sig ? {
      signature: piece32Sig,
      prediction: enhancedPrediction,
      fingerprint: piece32Sig.fingerprint,
      archetype: enhancedArchetype,
      colorRichness: piece32Sig.traceDepth?.avg || 0,
      complexity: piece32Sig.interactions?.total || 0,
    } : null,
  };
}

/**
 * Classify archetype from 32-piece signature data.
 * Uses the richer per-piece spatial data to detect archetypes
 * that the 4-quadrant system can't distinguish.
 */
function classifyArchetypeFrom32Piece(sig) {
  const q = sig.quadrants;
  const ksPressure = Math.abs(q.q1_kingside_white) + Math.abs(q.q3_kingside_black);
  const qsPressure = Math.abs(q.q2_queenside_white) + Math.abs(q.q4_queenside_black);
  const centerControl = Math.abs(q.q5_center_white) + Math.abs(q.q6_center_black);
  const wingExpansion = Math.abs(q.q7_extended_kingside) + Math.abs(q.q8_extended_queenside);
  
  const pt = sig.pieceTypeInfluence;
  const bishopActive = (pt.bishop.white + pt.bishop.black) > (pt.knight.white + pt.knight.black);
  const rookActive = (pt.rook.white + pt.rook.black) > 15;
  const queenEarly = (pt.queen.white + pt.queen.black) > 20 && sig.temporal.opening > 0.25;
  const pawnStorm = sig.pawnProfiles && Object.values(sig.pawnProfiles).some(p => p.advancement >= 4);
  const highInteractions = sig.interactions.cross > 10;
  const materialImbalance = Math.abs(sig.materialFlow.balance) > 3;
  
  // Sacrifice-driven attacks
  if (materialImbalance && highInteractions && ksPressure > qsPressure) return 'sacrificial_kingside_assault';
  if (materialImbalance && highInteractions && qsPressure > ksPressure) return 'sacrificial_queenside_break';
  
  // Piece-specific archetypes (32-piece system can distinguish these)
  if (bishopActive && wingExpansion > 10) return 'bishop_pair_mastery';
  if (!bishopActive && centerControl > 15) return 'central_knight_outpost';
  if (rookActive && sig.temporal.endgame > 0.35) return 'rook_endgame_dominance';
  if (queenEarly && ksPressure > 15) return 'queen_raid';
  
  // Spatial archetypes
  if (pawnStorm && ksPressure > qsPressure) return 'pawn_storm';
  if (ksPressure > qsPressure * 1.5 && ksPressure > 12) return 'kingside_attack';
  if (qsPressure > ksPressure * 1.5 && qsPressure > 12) return 'queenside_expansion';
  if (centerControl > ksPressure + qsPressure) return 'central_domination';
  if (wingExpansion > centerControl) return 'flank_operations';
  
  // Structure archetypes
  if (sig.traceDepth.avg > 3.5) return 'closed_maneuvering';
  if (sig.captures > 10) return 'tactical_melee';
  if (sig.temporal.endgame > 0.4) return 'endgame_technique';
  
  return 'balanced_flow';
}

/**
 * Run a single benchmark cycle with A/B testing
 */
async function runBenchmarkCycle(epEngine) {
  console.log(`[${workerId}] Starting cycle #${stats.cycles + 1} ${USE_ENHANCED_SIGNATURES ? '(8-Quadrant)' : '(4-Quadrant)'}`);
  
  // Fetch games from MULTIPLE SOURCES (Lichess + Chess.com rotation)
  const allGames = await fetchGamesMultiSource(Math.max(FARM_CONFIG.cycle.gamesPerFetch, 200), 'blitz');
  
  if (allGames.length === 0) {
    console.log(`[${workerId}] No games fetched, waiting...`);
    return;
  }
  
  // Filter out already-analyzed games BEFORE processing
  // Step 1: Session cache (instant)
  const sessionFiltered = allGames.filter(g => !analyzedGameIds.has(g.id));
  // Step 2: Lightweight DB batch check (one SELECT, not 1M+ preload)
  const existingInDb = await checkDuplicateBatch(sessionFiltered.map(g => g.id));
  const deduped = sessionFiltered.filter(g => !existingInDb.has(g.id));
  
  // Source quality filter: skip low-ELO, bullet, and incomplete games
  const games = deduped.filter(g => {
    const wElo = g.whiteElo || 0;
    const bElo = g.blackElo || 0;
    const avgElo = (wElo && bElo) ? (wElo + bElo) / 2 : 0;
    if (avgElo > 0 && avgElo < 1500) return false; // Low-ELO games = noisy
    const tc = g.timeControl || '';
    const tcBase = parseInt(tc.match(/^(\d+)/)?.[1] || '300');
    if (tcBase < 60) return false; // Bullet/ultrabullet = too noisy
    if (!g.result || g.result === '*') return false;
    return true;
  });
  const skipped = allGames.length - games.length;
  if (skipped > 0) {
    console.log(`[${workerId}] Skipped ${skipped}/${allGames.length} (${allGames.length - deduped.length} dupes, ${deduped.length - games.length} quality-filtered)`);
  }
  if (games.length === 0) {
    // All fetched games already analyzed — advance player rotation to find fresh ones
    currentSourceIndex += 8;
    console.log(`[${workerId}] All games already analyzed, advancing player rotation`);
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
      
      // Variable move number — each game analyzed at a different position
      // Builds interlinkage data across opening, middlegame, and endgame
      const moves = chess.history({ verbose: true });
      if (moves.length < 20) { stats.pgnErrors = (stats.pgnErrors || 0) + 1; continue; } // Skip short games (<20 moves = opening noise)
      const moveSans = moves.map(m => m.san);
      const moveNumber = selectAnalysisMoveNumber(moves.length, game.id);
      
      // ♟️ SPECIAL MOVE DETECTION: Track en passant, castling, promotion, sacrifice
      // These map to market tactical patterns in the cross-domain bridge
      const specialMoves = { enPassant: 0, castleK: 0, castleQ: 0, promotion: 0, sacrifice: 0, checks: 0, positionalSacs: 0 };
      
      // POSITION-RELATIVE PIECE VALUATION
      // "The true value is relative to the position every new position in a game"
      // Static values are a beginner heuristic. A passed pawn on the 7th = 4pts.
      // A knight on an outpost in a closed center = 4pts. A rook on a closed file = 3pts.
      // We track the GAME PHASE to adjust values dynamically.
      const totalMoveCount = moves.length;
      const gamePhase = totalMoveCount < 20 ? 'opening' : totalMoveCount < 40 ? 'middlegame' : 'endgame';
      let pawnAdvances = 0; // Track pawn pushes to detect passed pawns
      
      for (let mi = 0; mi < moves.length; mi++) {
        const m = moves[mi];
        const movePhase = mi < 20 ? 'opening' : mi < 40 ? 'middlegame' : 'endgame';
        
        if (m.flags.includes('e')) specialMoves.enPassant++;
        if (m.flags.includes('k')) specialMoves.castleK++;
        if (m.flags.includes('q')) specialMoves.castleQ++;
        if (m.promotion) specialMoves.promotion++;
        if (m.san.includes('+')) specialMoves.checks++;
        if (m.piece === 'p' && !m.captured) pawnAdvances++;
        
        // POSITION-RELATIVE sacrifice detection
        // Values shift based on game phase and positional context
        if (m.captured) {
          // Base values (the starting point, not the truth)
          const baseVal = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
          
          // Position-relative adjustments
          let pieceValue = baseVal[m.piece] || 0;
          let capturedValue = baseVal[m.captured] || 0;
          
          // PAWN value increases with advancement (rank)
          // A pawn on rank 6-7 is worth 2-4 points, not 1
          if (m.piece === 'p') {
            const rank = parseInt(m.to[1]);
            const advancedRank = m.color === 'w' ? rank : (9 - rank);
            if (advancedRank >= 7) pieceValue = 4;      // One step from promotion = queen-lite
            else if (advancedRank >= 6) pieceValue = 3;  // Dangerous passed pawn
            else if (advancedRank >= 5) pieceValue = 2;  // Advanced pawn, gaining power
          }
          if (m.captured === 'p') {
            const rank = parseInt(m.to[1]);
            const advancedRank = m.color === 'w' ? rank : (9 - rank);
            if (advancedRank >= 7) capturedValue = 4;
            else if (advancedRank >= 6) capturedValue = 3;
            else if (advancedRank >= 5) capturedValue = 2;
          }
          
          // KNIGHT value increases in closed positions (many pawns, middlegame)
          // BISHOP value increases in open positions (endgame, fewer pawns)
          if (m.piece === 'n' && movePhase === 'middlegame') pieceValue = 3.5;
          if (m.piece === 'b' && movePhase === 'endgame') pieceValue = 3.5;
          if (m.captured === 'n' && movePhase === 'middlegame') capturedValue = 3.5;
          if (m.captured === 'b' && movePhase === 'endgame') capturedValue = 3.5;
          
          // ROOK value increases in endgame (open files, active rooks)
          if (m.piece === 'r' && movePhase === 'endgame') pieceValue = 5.5;
          if (m.captured === 'r' && movePhase === 'endgame') capturedValue = 5.5;
          
          // QUEEN value decreases slightly in complex middlegame (overloaded, vulnerable)
          if (m.piece === 'q' && movePhase === 'middlegame') pieceValue = 8.5;
          
          // Detect sacrifice: giving up more positional value than received
          if (pieceValue > capturedValue + 0.5) {
            specialMoves.sacrifice++;
            // Positional sacrifice: when a piece is given up in a way that doesn't make 
            // static sense but makes positional sense (followed by check or forcing move)
            const nextMove = moves[mi + 1];
            if (nextMove && (nextMove.san.includes('+') || nextMove.san.includes('#'))) {
              specialMoves.positionalSacs++;
            }
          }
        }
      }
      
      chess.reset();
      for (let i = 0; i < moveNumber; i++) {
        chess.move(moveSans[i]);
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
        // v12.1: Player profiling — flows through to lesson_learned jsonb
        playerProfile: game.playerProfile || null,
      };
      
      // Pass SF eval in centipawns into the shared equilibrium predictor
      // sf17Eval.evaluation is in pawns (e.g. 1.5), predictor expects centipawns (e.g. 150)
      const sfEvalCp = Math.round((sf17Eval.evaluation ?? 0) * 100);
      const eloDiff = (game.whiteElo || 1500) - (game.blackElo || 1500);
      const predictions = generateBothPredictions(partialPgn, gameData, epEngine, sfEvalCp, moveNumber, eloDiff);
      const baselinePred = predictions.baseline.prediction;
      let enhancedPred = predictions.enhanced?.prediction || baselinePred;
      
      // Determine actual outcome - parse from PGN header
      let actualOutcome;
      const resultMatch = game.pgn.match(/\[Result "([^"]+)"\]/);
      const result = resultMatch ? resultMatch[1] : game.result;
      
      // Convert to standard format for database (white_wins/black_wins/draw)
      // v9.2: Skip games with unknown/in-progress results (*) — they are NOT draws
      if (result === '1-0') actualOutcome = 'white_wins';
      else if (result === '0-1') actualOutcome = 'black_wins';
      else if (result === '1/2-1/2') actualOutcome = 'draw';
      else {
        console.log(`[${workerId}] ⏭ Skipped unknown result: ${game.id || 'unknown'} (result="${result}")`);
        continue;
      }
      
      // Track A/B test accuracy
      const baselineCorrect = baselinePred.predictedWinner === actualOutcome;
      const enhancedCorrect = enhancedPred.predictedWinner === actualOutcome;
      
      const sf17Correct = sf17Prediction === actualOutcome;
      
      // v14: INTELLIGENT HYBRID FUSION + PLAYER INTELLIGENCE
      // Archetype + time-control + game-phase + player-specific weights
      const fusionArchetype = predictions.enhanced?.archetype || predictions.baseline.archetype;
      const playerCtx = {
        whiteName: game.whiteName || game.players?.white || null,
        blackName: game.blackName || game.players?.black || null,
        platform: game.source || 'lichess',
      };
      const fw = getIntelligentFusionWeights(fusionArchetype, game.timeControl || null, moveNumber, playerCtx);
      const fusionScores = { white_wins: 0, black_wins: 0, draw: 0 };
      fusionScores[baselinePred.predictedWinner] += fw.baselineWeight;
      fusionScores[enhancedPred.predictedWinner] += fw.enhancedWeight;
      fusionScores[sf17Prediction] += fw.sfWeight;
      const hybridPrediction = Object.entries(fusionScores)
        .sort((a, b) => b[1] - a[1])[0][0];
      const hybridConfidence = Math.max(...Object.values(fusionScores));
      const hybridCorrect = hybridPrediction === actualOutcome;
      
      if (baselineCorrect) stats.epCorrect++;
      if (enhancedCorrect) stats.epEnhancedCorrect++;
      if (sf17Correct) stats.sf17Correct++;
      if (hybridCorrect) stats.hybridCorrect = (stats.hybridCorrect || 0) + 1;
      
      // Track draw vs decisive accuracy separately
      if (actualOutcome === 'draw') {
        stats.drawsTotal++;
        if (enhancedCorrect) stats.drawsEpCorrect++;
        if (sf17Correct) stats.drawsSfCorrect++;
      } else {
        stats.decisiveTotal++;
        if (enhancedCorrect) stats.decisiveEpCorrect++;
      }
      
      // A/B test tracking
      if (baselineCorrect && enhancedCorrect) stats.abTestStats.bothCorrect++;
      else if (!baselineCorrect && !enhancedCorrect) stats.abTestStats.bothWrong++;
      else if (baselineCorrect && !enhancedCorrect) stats.abTestStats.baselineOnly++;
      else if (!baselineCorrect && enhancedCorrect) stats.abTestStats.enhancedOnly++;
      
      stats.predictionsMade++;
      
      // Generate creative language attribution — deterministic from position hash
      const posHash = hashPosition(fen);
      const archetype = predictions.enhanced?.archetype || predictions.baseline.archetype;
      const poetry = generateGamePoetry(posHash, archetype, specialMoves, gamePhase, sfEvalCp);
      
      // Save with A/B data, variable move number, poetry, and full 8-quadrant profile
      await savePrediction({
        gameId: game.id,
        fen,
        moveNumber,
        sf17Eval: sf17Eval.evaluation,
        baselinePrediction: baselinePred.predictedWinner,
        enhancedPrediction: enhancedPred.predictedWinner,
        hybridPrediction,
        hybridConfidence,
        hybridCorrect,
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
        poetry,
        gamePhase,
        // Full 8-quadrant profile for tracking (enhancedProfile = real 8-quad data)
        eightQuadrantProfile: predictions.enhanced?.signature?.enhancedProfile || null,
        pieceTypeMetrics: predictions.enhanced?.signature?.enhancedProfile ? {
          bishopDominance: predictions.enhanced.signature.enhancedProfile.bishop_dominance,
          knightDominance: predictions.enhanced.signature.enhancedProfile.knight_dominance,
          rookDominance: predictions.enhanced.signature.enhancedProfile.rook_dominance,
          queenDominance: predictions.enhanced.signature.enhancedProfile.queen_dominance,
          pawnAdvancement: predictions.enhanced.signature.enhancedProfile.pawn_advancement,
        } : null,
        specialMoves,
      });
      
      // SELF-EVOLVING: Feed prediction into cross-domain correlation engine
      // This links live chess data → correlation engine → adapter registry → photonic bus
      // The web app's realtime subscription ingests these for universal pattern detection
      // v12: Real correlation scores (not hardcoded 0.8/0.3)
      if (stats.predictionsMade % 20 === 0) {
        try {
          const enginesAgree = baselineCorrect === enhancedCorrect;
          const sfAgrees = sf17Correct === enhancedCorrect;
          const allAgree = enginesAgree && sfAgrees;
          const confLevel = hybridConfidence || 0.5;
          const posComplexity = Math.min(1, Math.abs(sfEvalCp) / 300);
          const realScore = (
            (confLevel * 0.4) +
            (allAgree ? 0.25 : enginesAgree ? 0.15 : 0) +
            (hybridCorrect ? 0.25 : 0) +
            (posComplexity > 0.3 ? 0.10 : 0)
          );
          await resilientQuery(
            `INSERT INTO cross_domain_correlations (
              correlation_id, pattern_id, pattern_name,
              correlation_score, chess_archetype, chess_confidence,
              chess_intensity, market_symbol, market_direction,
              market_confidence, market_intensity, validated, detected_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
            [
              `farm_${game.id}_${Date.now()}`,
              allAgree ? 'consensus-correct' : hybridCorrect ? 'ep-correct' : 'ep-incorrect',
              allAgree ? 'All Engines Agree (Correct)' : hybridCorrect ? 'EP Correct' : 'EP Incorrect',
              Math.min(9.99, Math.round(realScore * 100) / 100),
              predictions.enhanced?.archetype || predictions.baseline.archetype,
              Math.min(9.99, Math.round(confLevel * 100) / 100),  // numeric(3,2): 0.00-9.99
              Math.min(9.99, posComplexity),
              `chess:${game.source || 'lichess'}`,
              hybridPrediction === 'white_wins' ? 'up' : hybridPrediction === 'black_wins' ? 'down' : 'flat',
              Math.min(9.99, Math.round(confLevel * 100) / 100),  // numeric(3,2): 0.00-9.99
              Math.min(9.99, posComplexity),
              hybridCorrect
            ]
          );
        } catch (corrErr) { /* non-critical */ }
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
      
      const drawInfo = stats.drawsTotal > 0 ? ` | Draws: ${stats.drawsEpCorrect}/${stats.drawsTotal}` : '';
      console.log(`[${workerId}] ${game.id} m${moveNumber}: B=${baselinePred.predictedWinner}(adv:${baselinePred.whiteAdvantage.toFixed(2)}) E=${enhancedPred.predictedWinner}(adv:${enhancedPred.whiteAdvantage.toFixed(2)}) SF17=${sf17Prediction} A=${actualOutcome} | Baseline: ${baselineAccuracy}%${improvement} | SF17: ${sf17Accuracy}%${drawInfo}`);
      console.log(`[${workerId}]   ✦ ${poetry.verse}`);
      console.log(`[${workerId}]   ◆ ${poetry.essence} [${poetry.motif}]`);
      
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
  
  // Dedup: session-only Set + DB ON CONFLICT DO NOTHING (no preload needed)
  console.log(`[${workerId}] Dedup: session-local Set + DB ON CONFLICT (instant startup)`);
  
  // Expand player pool with dynamically discovered players from Lichess leaderboards
  await expandPlayerPool();
  
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
        // Two-step upsert (UPDATE then INSERT) — works through PgBouncer
        const statusMsg = `Cycle ${stats.cycles} complete: ${stats.totalGames} games processed`;
        const updateResult = await resilientQuery(`
          UPDATE farm_status SET
            status = $1, message = $2,
            chess_games_generated = $3, chess_errors = $4,
            benchmark_runs_completed = $5, benchmark_errors = $6,
            last_heartbeat_at = NOW(), updated_at = NOW()
          WHERE farm_id = $7
        `, ['healthy', statusMsg, stats.totalGames, 0, stats.cycles, 0, farmId]);
        if (updateResult.rowCount === 0) {
          await resilientQuery(`
            INSERT INTO farm_status (
              farm_id, farm_name, host_name, status, message,
              chess_games_generated, chess_errors,
              benchmark_runs_completed, benchmark_errors,
              last_heartbeat_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `, [farmId, workerId, 'mac-enhanced-local', 'healthy', statusMsg,
              stats.totalGames, 0, stats.cycles, 0]);
        }
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
      
      // LIVE ARCHETYPE WEIGHT REFRESH: Every 25 cycles, worker 1 recomputes
      // real per-archetype accuracy from the database. This replaces the hardcoded
      // ARCHETYPE_HISTORICAL_ACCURACY with data-driven weights that improve with volume.
      // Refresh player pool every 25 cycles to discover new active players (Pro tier)
      if (stats.cycles % 25 === 0) {
        await expandPlayerPool();
      }
      if (stats.cycles % 25 === 0 && workerNum === 1) {
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
            
            // Feed fresh accuracy data back to fusion-intelligence (self-improving)
            // Extract accuracy per archetype from the live weights
            const liveAccuracy = {};
            for (const [arch, data] of Object.entries(newWeights)) {
              if (data && typeof data.accuracy === 'number') {
                liveAccuracy[arch] = data.accuracy;
              }
            }
            if (Object.keys(liveAccuracy).length > 0) {
              updateLiveArchetypeAccuracy(liveAccuracy);
              console.log(`[${workerId}] Fusion intelligence updated with ${Object.keys(liveAccuracy).length} live archetype accuracies`);
            }
          }
        } catch (weightErr) {
          console.log(`[${workerId}] Live weight refresh non-critical error: ${weightErr.message}`);
        }
        // Player intelligence refresh (same cadence as archetype weights)
        try {
          await refreshPlayerIntelligence(resilientQuery);
        } catch (piErr) {
          console.log(`[${workerId}] Player intel refresh non-critical: ${piErr.message}`);
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

// ═══════════════════════════════════════════════════════════════════
// CREATIVE LANGUAGE ATTRIBUTION — Deterministic poetry from game signature
// At millions of games per country, this builds a linguistic pattern corpus
// where language interpretation maps to position characteristics
// ═══════════════════════════════════════════════════════════════════

const POETRY_NOUNS = [
  'horizon', 'cathedral', 'eclipse', 'resonance', 'labyrinth', 'prism', 'glacier',
  'meridian', 'constellation', 'helix', 'aurora', 'tidewater', 'ember', 'zenith',
  'mosaic', 'tempest', 'oracle', 'fortress', 'cascade', 'phantom', 'chrysalis',
  'nebula', 'quarry', 'mirage', 'pinnacle', 'vortex', 'requiem', 'sentinel',
  'silhouette', 'tributary', 'axiom', 'paradox', 'crucible', 'archipelago',
  'fjord', 'monolith', 'caldera', 'citadel', 'genesis', 'apex', 'theorem',
  'compass', 'obelisk', 'tapestry', 'fulcrum', 'reverie', 'harmonic', 'bastion',
];
const POETRY_VERBS = [
  'unfolds', 'converges', 'reverberates', 'dissolves', 'crystallizes', 'transcends',
  'illuminates', 'cascades', 'pierces', 'blooms', 'fractures', 'weaves', 'ignites',
  'surrenders', 'emerges', 'resonates', 'awakens', 'descends', 'spirals', 'transforms',
  'echoes', 'devours', 'sculpts', 'bridges', 'reclaims', 'suspends', 'orbits',
  'anchors', 'whispers', 'shatters', 'envelops', 'distills',
];
const POETRY_ADJ = [
  'luminous', 'fractured', 'crystalline', 'ephemeral', 'relentless', 'sovereign',
  'molten', 'mercurial', 'verdant', 'obsidian', 'gilded', 'spectral', 'tethered',
  'boundless', 'nascent', 'ethereal', 'volcanic', 'harmonic', 'prismatic', 'veiled',
  'incandescent', 'temperate', 'celestial', 'austere', 'radiant', 'kinetic',
  'subterranean', 'iridescent', 'stoic', 'volatile', 'serene', 'fervent',
];
const POETRY_IMAGERY = [
  'where light bends through stone', 'as rivers find the sea',
  'beneath the weight of stars', 'through corridors of time',
  'like fire reflected in still water', 'where silence speaks in color',
  'across the geometry of doubt', 'through the architecture of intention',
  'where every path remembers its origin', 'as the tide reads the shore',
  'in the space between certainty and wonder', 'where patterns breathe',
  'through the lattice of becoming', 'as shadows trace the truth',
  'where the grid meets the infinite', 'beneath the canopy of logic',
  'across the spectrum of resolve', 'where tension finds its voice',
  'in the calculus of beauty', 'as the position reveals its nature',
  'where intuition and structure collide', 'through the fabric of decision',
  'like a theorem written in light', 'where chaos distills to form',
];

/**
 * Generate deterministic creative poetry from game signature.
 * Same game + position always yields same words (hash-seeded).
 * Returns { verse, essence, motif } for storage and display.
 */
function generateGamePoetry(positionHash, archetype, specialMoves, gamePhase, eval_cp) {
  if (!positionHash) return { verse: 'position without echo', essence: 'unknown', motif: 'void' };
  
  // Use hash bytes as deterministic seed
  const h = positionHash;
  const seed = (offset) => parseInt(h.substring(offset, offset + 4), 16) || 0;
  
  const noun1 = POETRY_NOUNS[seed(0) % POETRY_NOUNS.length];
  const noun2 = POETRY_NOUNS[seed(4) % POETRY_NOUNS.length];
  const verb = POETRY_VERBS[seed(8) % POETRY_VERBS.length];
  const adj1 = POETRY_ADJ[seed(12) % POETRY_ADJ.length];
  const adj2 = POETRY_ADJ[seed(16) % POETRY_ADJ.length];
  const imagery = POETRY_IMAGERY[seed(20) % POETRY_IMAGERY.length];
  
  // Archetype colors the tone
  const toneMap = {
    'aggressive_attacker': 'with fury',
    'positional_maestro': 'with patience',
    'tactical_genius': 'with precision',
    'endgame_specialist': 'with inevitability',
    'solid_defender': 'with resolve',
    'dynamic_player': 'with transformation',
    'quiet_strategist': 'with subtlety',
    'sacrificial_artist': 'with sacrifice',
  };
  const tone = toneMap[archetype] || 'with intention';
  
  // Special moves add flavor
  let flourish = '';
  if (specialMoves?.sacrifice > 0) flourish = '— the offering accepted';
  else if (specialMoves?.promotion > 0) flourish = '— crowned in passage';
  else if (specialMoves?.enPassant > 0) flourish = '— the ghost step taken';
  else if (specialMoves?.castleK > 0 || specialMoves?.castleQ > 0) flourish = '— the king finds shelter';
  
  // Game phase shapes structure
  const phaseWord = gamePhase === 'opening' ? 'genesis' : gamePhase === 'endgame' ? 'twilight' : 'crucible';
  
  // Eval shapes emotion
  const evalWord = Math.abs(eval_cp || 0) > 300 ? 'decisive' : Math.abs(eval_cp || 0) > 100 ? 'contested' : 'balanced';
  
  const verse = `The ${adj1} ${noun1} ${verb} ${imagery}, ${tone}${flourish}`;
  const essence = `${adj2} ${phaseWord} of ${evalWord} ${noun2}`;
  const motif = `${noun1}-${verb}-${noun2}`;
  
  return { verse, essence, motif };
}

// ═══════════════════════════════════════════════════════════════════
// VARIABLE MOVE NUMBER — Analyze different positions per game
// Builds interlinkage data across ALL move numbers
// ═══════════════════════════════════════════════════════════════════

/**
 * Select analysis move number — proportional to actual game length.
 * 
 * A 25-move blitz → analyzed in its opening/middlegame (m6-m21)
 * A 45-move standard → analyzed across all phases (m10-m38)
 * A 90-move endgame grind → deep endgame coverage (m20-m76)
 * 
 * Zones are defined as PERCENTAGES of the game, so reports naturally
 * group by game phase (opening/middlegame/endgame) relative to each game.
 * When aggregated across millions of games, this reveals how accuracy
 * and archetype distributions shift across proportional game phases.
 */
function selectAnalysisMoveNumber(totalMoves, gameId) {
  // Deterministic seed from game ID
  const idHash = createHash('md5').update(gameId).digest('hex');
  const seed = parseInt(idHash.substring(0, 8), 16);
  
  // Zones as proportions of THIS game's total moves
  // Each zone maps to a game phase — reports aggregate by phase label
  const zones = [
    { pctStart: 0.15, pctEnd: 0.30, weight: 2, phase: 'opening' },        // 15-30% of game
    { pctStart: 0.30, pctEnd: 0.45, weight: 3, phase: 'early_middle' },    // 30-45%
    { pctStart: 0.45, pctEnd: 0.60, weight: 3, phase: 'deep_middle' },     // 45-60%
    { pctStart: 0.60, pctEnd: 0.75, weight: 2, phase: 'late_middle' },     // 60-75%
    { pctStart: 0.75, pctEnd: 0.90, weight: 1, phase: 'endgame' },         // 75-90%
  ];
  
  // Pick zone based on seed (weighted selection)
  const totalWeight = zones.reduce((s, z) => s + z.weight, 0);
  let pick = seed % totalWeight;
  let zone = zones[0];
  for (const z of zones) {
    if (pick < z.weight) { zone = z; break; }
    pick -= z.weight;
  }
  
  // Convert percentage range to actual move numbers for this game
  const minMove = Math.max(12, Math.round(totalMoves * zone.pctStart));
  const maxMove = Math.max(minMove + 1, Math.round(totalMoves * zone.pctEnd));
  
  // Pick specific move within the range (deterministic from seed)
  const range = maxMove - minMove;
  const moveNum = minMove + (seed % Math.max(1, range));
  
  return Math.max(12, Math.min(moveNum, totalMoves - 2)); // Never analyze last 2 moves (min 12 — opening <12 is near-random)
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
    // FEN validation: must match DB constraint regex
    // ^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$
    const fen = attempt.fen;
    if (!fen || typeof fen !== 'string' || fen.length <= 20 ||
        !/^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/.test(fen)) {
      console.log(`[${workerId}] ⚠ Skipping save: invalid FEN for ${attempt.gameId}`);
      return;
    }
    
    const positionHash = hashPosition(fen);
    const gameName = attempt.gameMetadata 
      ? `${attempt.gameMetadata.white || 'Unknown'} vs ${attempt.gameMetadata.black || 'Unknown'}`
      : `Game ${attempt.gameId}`;
    
    const meta = attempt.gameMetadata || {};
    
    const query = `
      /* v4-enriched */ INSERT INTO chess_prediction_attempts (
        game_id, game_name, move_number, fen, position_hash,
        stockfish_eval, stockfish_depth,
        stockfish_prediction, stockfish_confidence, stockfish_correct,
        hybrid_prediction, hybrid_confidence, hybrid_archetype, hybrid_correct,
        enhanced_prediction, enhanced_correct, enhanced_archetype, enhanced_confidence,
        baseline_prediction, baseline_correct,
        actual_result, data_quality_tier, worker_id, data_source,
        white_elo, black_elo, time_control, pgn, lesson_learned,
        eight_quadrant_profile, piece_type_metrics, color_richness, complexity_score, baseline_vs_enhanced_delta,
        created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,NOW())
    `;
    
    // Compute baseline_vs_enhanced_delta: difference in correctness
    const enhDelta = (attempt.enhancedCorrect === true && attempt.baselineCorrect === false) ? 1 :
                     (attempt.enhancedCorrect === false && attempt.baselineCorrect === true) ? -1 : 0;
    
    const values = [
      attempt.gameId,
      gameName,
      attempt.moveNumber || 20,
      attempt.fen,
      positionHash,
      Math.max(-9999, Math.min(9999, Math.round((attempt.sf17Eval || 0) * 100))),  // Centipawns (capped)
      18,                                                        // SF depth
      attempt.sf17Prediction,                                    // Real SF17 prediction
      Math.round(Math.min(95, 50 + Math.abs(attempt.sf17Eval || 0) * 10)),  // SF confidence (integer)
      attempt.sf17Correct,                                       // Real SF17 correctness
      attempt.hybridPrediction || attempt.enhancedPrediction || attempt.baselinePrediction,  // v12: real 3-engine fusion
      Math.round(Math.min(69, Math.max(15, (attempt.hybridConfidence || 0.5) * 100))),  // hybrid confidence (capped 15-69)
      attempt.enhancedArchetype || attempt.baselineArchetype || 'unknown',
      attempt.hybridCorrect ?? attempt.enhancedCorrect ?? attempt.baselineCorrect,  // v12: real hybrid correctness
      attempt.enhancedPrediction || null,                        // enhanced_prediction (8-quad)
      attempt.enhancedCorrect ?? null,                           // enhanced_correct
      attempt.enhancedArchetype || null,                         // enhanced_archetype
      parseFloat((attempt.enhanced?.confidence || 0.70).toFixed(2)),  // enhanced_confidence (DECIMAL 0-1)
      attempt.baselinePrediction || null,                        // baseline_prediction (4-quad)
      attempt.baselineCorrect ?? null,                           // baseline_correct
      attempt.actualOutcome,
      'farm_enhanced_8quad',
      workerId,
      attempt.dataSource || 'unknown',
      meta.whiteElo || null,
      meta.blackElo || null,
      meta.timeControl || null,
      meta.pgn || null,
      JSON.stringify({
        verse: attempt.poetry?.verse || null,
        essence: attempt.poetry?.essence || null,
        motif: attempt.poetry?.motif || null,
        move_number: attempt.moveNumber || 20,
        game_phase: attempt.gamePhase || 'unknown',
        special_moves: attempt.specialMoves || {},
        // v12.1: Player profiling — foundation for per-player archetype learning
        player_profile: meta.playerProfile || null,
      }),
      attempt.eightQuadrantProfile ? JSON.stringify(attempt.eightQuadrantProfile) : null,  // eight_quadrant_profile
      attempt.pieceTypeMetrics ? JSON.stringify(attempt.pieceTypeMetrics) : null,           // piece_type_metrics
      Math.min(9.9999, Math.max(0, parseFloat(attempt.colorRichness) || 0)),                  // color_richness (numeric 5,4 max 9.9999)
      Math.min(9.9999, Math.max(0, (parseFloat(attempt.complexity) || 0) / 100)),               // complexity_score (numeric 5,4, normalized /100)
      enhDelta,                                                                             // baseline_vs_enhanced_delta
    ];
    
    const result = await resilientQuery(query, values);
    if (result.rowCount > 0) {
      analyzedGameIds.add(attempt.gameId); // Add to dedup set for this session
      console.log(`[${workerId}] ✓ Saved: ${attempt.gameId} | SF17=${attempt.sf17Prediction}(${attempt.sf17Correct?'✓':'✗'}) EP=${attempt.enhancedPrediction}(${attempt.enhancedCorrect?'✓':'✗'}) Actual=${attempt.actualOutcome}`);
    }
  } catch (err) {
    // PostgreSQL 23505 = unique_violation — game already exists, skip silently
    if (err.code === '23505') {
      analyzedGameIds.add(attempt.gameId); // Mark as known so we don't re-analyze
      console.log(`[${workerId}] ⏭ Duplicate skipped: ${attempt.gameId}`);
    } else if (err.code === '23514') {
      // Check constraint violation (e.g. valid_fen_format) — bad data, skip
      console.log(`[${workerId}] ⚠ Check constraint failed for ${attempt.gameId}: ${err.constraint || err.message}`);
    } else {
      console.log(`[${workerId}] SQL save failed: ${err.message}`);
    }
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
