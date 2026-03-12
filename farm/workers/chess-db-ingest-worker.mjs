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
import { generateParableAttribution } from '../lib/archetypeParableEngine.mjs';
import { refreshPlayerIntelligence } from './player-intelligence.mjs';
import fs from 'fs';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// v27.3: Prevent EPIPE from crashing the process. When Stockfish dies,
// async writes to its dead stdin emit unhandled errors that kill Node.
// Catch them here so the SF queue can recover gracefully.
process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
    console.error('[DB-INGEST] Caught EPIPE — Stockfish will be respawned on next eval');
    engineReady = false;
    stockfishProcess = null;
  } else {
    console.error('[DB-INGEST] Uncaught exception:', err);
    process.exit(1); // Only crash on real errors
  }
});
// Forward-declare so the handler above can reference them
var engineReady = false;
var stockfishProcess = null;

const envPath = join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// ════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════

const CONFIG = {
  enableLichessDB: true,
  enableChess960: true,        // v32: Freestyle Chess — separate Lichess DB, growing fast, competitive edge vs SF
  enableFICS: false,          // v29.0: DISABLED — ficsgames.org returns 403 Forbidden on all download URLs
  enableKingBase: false,        // v32.1: DISABLED temporarily — infinite PGN parse loop on corrupted zip extract
  enableCCRL: false,           // v29.9: DISABLED — EP 11.3% vs SF 75.6% on engine games. Poison for human-game predictor.
  enableChessCom: true,
  enableLichessPuzzles: true,
  enableChessComPuzzles: true,   // v34: Re-enabled — 0% bug fixed (SF eval fallback instead of hardcoded 'draw')
  enableFishtest: false,        // v29.9: DISABLED — engine-vs-engine games poison EP's human-game patterns (same as CCRL)

  // WORKER_SHARD partitions the 3 ingest workers across different time windows
  // to prevent duplicate stream downloads and wasted SF eval compute.
  // Shard 0: 2024-2026 (recent — highest quality, fastest accumulation)
  // Shard 1: 2020-2023 (mid-range — rich tactical library)
  // Shard 2: 2013-2019 (historical — deep pattern diversity)
  lichessStartYear:  process.env.WORKER_SHARD === '1' ? 2023 : process.env.WORKER_SHARD === '2' ? 2019 : 2026,
  lichessStartMonth: process.env.WORKER_SHARD === '1' ? 12   : process.env.WORKER_SHARD === '2' ? 12   : 2,
  lichessOldestYear: process.env.WORKER_SHARD === '1' ? 2020 : process.env.WORKER_SHARD === '2' ? 2013 : 2024,
  lichessStreamMinutes: 45,  // v29.9: Increased from 10→45 min — monthly dumps have 80M+ games, need sustained streaming

  ficsStartYear: 2025,
  ficsOldestYear: 2018,

  // Data source diversity controls (v17.2)
  // Prevent FICS domination and boost CCRL for EP edge restoration
  // v17.3: Scale to 100M games - massive ingestion for universal archetype intelligence
  // v17.4: Rate limiting and database protection
  sourceWeights: {
    lichess_db: 3.0,      // Primary — billions of games, sharded across 3 workers
    chesscom: 8.0,        // v29.0: Boosted — Chess.com is only 4% of DB, needs heavy sampling
    lichess_puzzles: 2.0, // v19.1: Fast eval, no SF queue bottleneck
    // fics/kingbase/ccrl/fishtest: permanently disabled — entries removed to avoid confusion
  },
  maxGamesPerSource: parseInt(process.argv.find(a => a.startsWith('--max-per-source='))?.split('=')[1] || '1000000'), // Scaled for 5M+ target
  // Rate limiting to prevent database collapse
  maxPredictionsPerHour: 1000000,     // Scaled for mass ingestion
  maxGamesPerMinute: 20000,           // Increased burst capacity
  batchSize: 1000,                   // v32: doubled — cuts DB round-trips in half, no quality impact
  dedupBatchSize: 2000,              // v32: doubled to match batch size
  dbInsertCooldown: 0,               // No cooldown — batch INSERT handles it
  minElo: parseInt(process.argv.find(a => a.startsWith('--min-elo='))?.split('=')[1] || '1500'),
  requireEval: false,
  moveAnalysisRange: { min: 12, max: 55 },
  sfDepth: parseInt(process.argv.find(a => a.startsWith('--sf-depth='))?.split('=')[1] || '14'),
  sfDepthFast: 12,                   // v27.3: Increased from 10→12. SF is 25-35% of fusion weight; depth 12 catches more tactics. ~1.5x slower but biggest accuracy lever.
  parallelGames: 24,                  // v29.8: Increase to 24 for maximum GM game throughput
};

const workerId = process.env.WORKER_ID || 'db-ingest-1';
const DATA_DIR = join(__dirname, '..', 'data', 'chess-db');

// Chess.com top players for bulk game fetching (public API, no auth required)
// v29.8: MASSIVELY EXPANDED POOL — billions of games available
const CHESSCOM_PLAYERS = [
  // Super GMs (2700+)
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
  // v27.4: Expanded pool — active GMs/IMs with deep archives
  'Vladislav_Artemiev', 'Parhamov', 'Zhigalko_Sergei', 'Amin_Tabatabaei',
  'Naroditsky', 'Mishra_Abhimanyu', 'Keymer_Vincent', 'Erigaisi',
  'Gukesh', 'Nodirbek', 'Pragg', 'Vidit_Gujrathi',
  'Duda_JK', 'Rapport_Richard', 'Mamedyarov_Shakhriyar', 'So_Wesley',
  // Popular streamers with thousands of games
  'BotezLive', 'annacramling', 'chessbrah', 'HansDaMan',
  'Sardoche', 'LilaChess', 'ChessNetwork', 'agadmator',
  // Strong IMs/FMs (2300-2500) — high volume players
  'Kostya_Kavutskiy', 'Levy_Rozman', 'Nemo_Zhou', 'Tani_Adewumi',
  'Canty_James', 'Rensch', 'Hess_Robert', 'Ramirez_Alejandro',
  // v29.8: MASSIVE EXPANSION — top 100 GMs by rating + active players
  'Ding_Liren', 'Ian_Nepomniachtchi', 'Alireza_Firouzja', 'Fabiano_Caruana',
  'Hikaru_Nakamura', 'Wesley_So', 'Levon_Aronian', 'Shakhriyar_Mamedyarov',
  'Anish_Giri', 'Viswanathan_Anand', 'Vladimir_Kramnik', 'Veselin_Topalov',
  'Teimour_Radjabov', 'Richard_Rapport', 'Jan_Krzysztof_Duda', 'Yu_Yangyi',
  'Pentala_Harikrishna', 'David_Navarra', 'Leinier_Dominguez', 'Jeffery_Xiong',
  'Sam_Shankland', 'John_M Burke', 'Sam_Sevian', 'Andrew_Hong',
  'Awonder_Liang', 'Christopher_Yoo', 'Gata_Kamsky', 'Varuzhan_Akobian',
  'Melikset_Khachiyan', 'Jesse_Kraai', 'Benjamin_Finegold', 'Gregory_Kaidanov',
  'Alex_Onischuk', 'Alex_Lenderman', 'Kamil_Mitong', 'Darius_Swiercz',
  'Steven_Zierk', 'Joshua_Friedel', 'Nicolas_Holt', 'Ray_Robson',
  'Conrad_Holt', 'Anna_Muzychuk', 'Mariya_Muzychuk', 'Alexandra_Kosteniuk',
  'Natalia_Pogonina', 'Valentina_Gunina', 'Olga_Girya', 'Ekaterina_Lahno',
  'Antoaneta_Stefanova', 'Tatiana_Kosintseva', 'Nadezhda_Kosintseva',
  // Additional active GMs with massive archives
  'Nihal_Sarin', 'Praggnanandhaa', 'Gukesh_D', 'Arjun_Erigaisi',
  'Leonard_Meyer', 'Vincent_Keymer', 'Abhimanyu_Mishra', 'Christopher_Yoo',
  'Awonder_Liang', 'Brandon_Jacobson', 'Carlsen_Magnus', 'Nakamura_Hikaru',
  // European GM pool
  'Radoslaw_Wojtaszek', 'Bartlomiej_Macieja', 'Mateusz_Bartel', 'Kamil_Mitong',
  'David_Anton_Guerrero', 'Jose_Cuenca_Jimenez', 'Francisco_Vallejo_Pons',
  'Alexei_Shirokov', 'Evgeny_Sveshnikov', 'Vladimir_Epishin', 'Sergey_Rublevsky',
  'Konstantin_Sakaev', 'Alexander_Motylev', 'Alexander_Khalifman',
  // Asian GM pool
  'Le_Quang_Liem', 'Nguyen_Ngoc_Truong_Son', 'Wang_Yue', 'Li_Chao',
  'Bu_Xiangzhi', 'Zhou_Jianchao', 'Ni_Hua', 'Zhang_Zhong',
  'Peng_Xiaomin', 'Ye_Jiangchuan', 'Zhang_Pengxiang', 'Wu_Ao',
  // Americas GM pool
  'Lazaro_Bruzon', 'Yuniesky_Quesada', 'Leinier_Dominguez',
  'Julio_Grande', 'Rafael_Diaz', 'Pedro_Francisco',
  // African GM pool
  'Kenny_Solomon', 'Watson_Kobese', 'Henry_Roberts',
  // Additional high-volume online players
  'DrNykterstein', 'Oleksandr_Bortnyk', 'German11', 'ChessWeeb',
  'lance5500', 'Fins', 'chesstoday', 'Konavets', 'EricRosen',
  'Bombegansen2', 'may6enexttime', 'Benefansen', 'rebeccaharris',
  'Ssjg_Goku', 'Night-King96', 'gothamchess', 'botezlive',
  'danielnaroditsky', 'anishgiri', 'levonaronian', 'wesleyso',
  'fabianocaruana', 'magnuscarlsen', 'firouzja2003', 'rpragchess'
];
let chesscomPlayerIndex = 0;

// v33.0: PLAYER_REGISTRY — one canonical entry per real-world player.
// Each handle is tagged with platform + mode so the same person's bullet
// account, classical account, and OTB results are distinguished but unified.
// LICHESS_API_PLAYERS and HANDLE_INFO are auto-derived — never edit those.
const PLAYER_REGISTRY = [
  // ── Super GMs ──────────────────────────────────────────────────────────────
  { name: 'Magnus Carlsen',          country: 'NO', fide: 2830, handles: [
    { platform: 'lichess',  username: 'magnuscarlsen',    mode: 'rapid/classical' },
    { platform: 'lichess',  username: 'DrNykterstein',    mode: 'bullet/blitz'    },
    { platform: 'lichess',  username: 'DrDrunkenstein',   mode: 'ultra-bullet'    },
    { platform: 'lichess',  username: 'Msb2',             mode: 'anonymous-blitz' },
  ]},
  { name: 'Hikaru Nakamura',         country: 'US', fide: 2794, handles: [
    { platform: 'lichess',  username: 'GMHikaru',         mode: 'rapid/blitz'     },
  ]},
  { name: 'Alireza Firouzja',        country: 'FR', fide: 2777, handles: [
    { platform: 'lichess',  username: 'alireza2003',      mode: 'rapid/blitz'     },
  ]},
  { name: 'D Gukesh',                country: 'IN', fide: 2783, handles: [
    { platform: 'lichess',  username: 'GukeshDommaraju',  mode: 'rapid/blitz'     },
  ]},
  { name: 'Arjun Erigaisi',          country: 'IN', fide: 2778, handles: [
    { platform: 'lichess',  username: 'ArjunErigaisi',    mode: 'rapid/blitz'     },
  ]},
  { name: 'Ian Nepomniachtchi',      country: 'RU', fide: 2764, handles: [
    { platform: 'lichess',  username: 'nepomniachtchi',    mode: 'rapid/blitz'     },
    { platform: 'lichess',  username: 'Vladimirovich9000', mode: 'anonymous-blitz' },
    { platform: 'lichess',  username: 'lachesisQ',         mode: 'anonymous-rapid' },
  ]},
  { name: 'Nodirbek Abdusattorov',   country: 'UZ', fide: 2762, handles: [
    { platform: 'lichess',  username: 'Nodirbek',         mode: 'rapid/blitz'     },
  ]},
  { name: 'Anish Giri',              country: 'NL', fide: 2760, handles: [
    { platform: 'lichess',  username: 'AnishGiri',        mode: 'rapid/blitz'     },
  ]},
  { name: 'Fabiano Caruana',         country: 'US', fide: 2759, handles: [
    { platform: 'lichess',  username: 'fabianocaruana',   mode: 'rapid/blitz'     },
  ]},
  { name: 'Wesley So',               country: 'US', fide: 2758, handles: [
    { platform: 'lichess',  username: 'GMWSO',            mode: 'rapid/blitz'     },
  ]},
  // ── 2700+ GMs ──────────────────────────────────────────────────────────────
  { name: 'Maxime Vachier-Lagrave',  country: 'FR', fide: 2727, handles: [
    { platform: 'lichess',  username: 'vachierlagrave',   mode: 'rapid/blitz'     },
    { platform: 'lichess',  username: 'LyonBeast',        mode: 'bullet/blitz'    },
  ]},
  { name: 'Praggnanandhaa',          country: 'IN', fide: 2747, handles: [
    { platform: 'lichess',  username: 'rpragchess',       mode: 'rapid/blitz'     },
  ]},
  { name: 'Shakhriyar Mamedyarov',   country: 'AZ', fide: 2747, handles: [
    { platform: 'lichess',  username: 'Mamedyarov',       mode: 'rapid/blitz'     },
  ]},
  { name: 'Richard Rapport',         country: 'HU', fide: 2745, handles: [
    { platform: 'lichess',  username: 'RichardRapport',   mode: 'rapid/blitz'     },
  ]},
  { name: 'Levon Aronian',           country: 'US', fide: 2750, handles: [
    { platform: 'lichess',  username: 'levonaronian',     mode: 'rapid/blitz'     },
  ]},
  { name: 'Alexander Grischuk',      country: 'RU', fide: 2764, handles: [
    { platform: 'lichess',  username: 'Grischuk',         mode: 'blitz/bullet'    },
  ]},
  { name: 'Nihal Sarin',             country: 'IN', fide: 2727, handles: [
    { platform: 'lichess',  username: 'nihalsarin',       mode: 'rapid/blitz'     },
  ]},
  { name: 'Vidit Gujrathi',          country: 'IN', fide: 2726, handles: [
    { platform: 'lichess',  username: 'vidit_gujrathi',   mode: 'rapid/blitz'     },
  ]},
  { name: 'Vincent Keymer',          country: 'DE', fide: 2726, handles: [
    { platform: 'lichess',  username: 'VKeymer',          mode: 'rapid/blitz'     },
  ]},
  { name: 'Javokhir Sindarov',       country: 'UZ', fide: 2699, handles: [
    { platform: 'lichess',  username: 'JavSin',           mode: 'rapid/blitz'     },
  ]},
  { name: 'Jan-Krzysztof Duda',      country: 'PL', fide: 2724, handles: [
    { platform: 'lichess',  username: 'Bombegansen2',      mode: 'rapid/blitz'     },
  ]},
  { name: 'Le Quang Liem',           country: 'VN', fide: 2703, handles: [
    { platform: 'lichess',  username: 'quangliem',         mode: 'rapid/blitz'     },
  ]},
  // ── 2600+ GMs ──────────────────────────────────────────────────────────────
  { name: 'Daniel Naroditsky',       country: 'US', fide: 2640, handles: [
    { platform: 'lichess',  username: 'DanielNaroditsky', mode: 'rapid/blitz'     },
    { platform: 'lichess',  username: 'danya_naroditsky', mode: 'bullet/ultra'    },
  ]},
  { name: 'David Navara',            country: 'CZ', fide: 2692, handles: [
    { platform: 'lichess',  username: 'RealDavidNavara',  mode: 'rapid/blitz'     },
  ]},
  { name: 'Oleksandr Bortnyk',       country: 'UA', fide: 2635, handles: [
    { platform: 'lichess',  username: 'Oleksandr_Bortnyk', mode: 'bullet'        },
  ]},
  { name: 'Jorden van Foreest',       country: 'NL', fide: 2697, handles: [
    { platform: 'lichess',  username: 'opperwezen',       mode: 'bullet'          },
  ]},
  { name: 'Sergey Zhigalko',         country: 'BY', fide: 2656, handles: [
    { platform: 'lichess',  username: 'Zhigalko_Sergei',  mode: 'blitz/bullet'    },
  ]},
  { name: 'Sam Shankland',           country: 'US', fide: 2691, handles: [
    { platform: 'lichess',  username: 'SamShankland',     mode: 'rapid/blitz'     },
  ]},
  { name: 'Andrew Tang',             country: 'US', fide: 2680, handles: [
    { platform: 'lichess',  username: 'penguingm1',       mode: 'ultra-bullet'    },
  ]},
  { name: 'Alexey Shirov',           country: 'ES', fide: 2691, handles: [
    { platform: 'lichess',  username: 'Shirov',           mode: 'blitz/bullet'    },
  ]},
  // ── Women's World Top (distinct OTB + online styles) ──────────────────────
  { name: 'Hou Yifan',               country: 'CN', fide: 2620, handles: [
    { platform: 'lichess',  username: 'HouYifan',         mode: 'rapid/classical' },
  ]},
  { name: 'Humpy Koneru',            country: 'IN', fide: 2572, handles: [
    { platform: 'lichess',  username: 'KoneruHumpy',      mode: 'rapid/blitz'     },
  ]},
  { name: 'Alexandra Kosteniuk',     country: 'FR', fide: 2516, handles: [
    { platform: 'lichess',  username: 'kosteniuk',        mode: 'rapid/blitz'     },
  ]},
  { name: 'Anna Muzychuk',           country: 'UA', fide: 2530, handles: [
    { platform: 'lichess',  username: 'AnnaMuzychuk',     mode: 'rapid/blitz'     },
  ]},
  // ── Streamers / Content Creators (diverse game styles, high volume) ────────
  { name: 'Eric Rosen',              country: 'US', fide: 2476, handles: [
    { platform: 'lichess',  username: 'EricRosen',        mode: 'rapid/classical' },
  ]},
  { name: 'Levy Rozman',             country: 'US', fide: 2397, handles: [
    { platform: 'lichess',  username: 'gothamchess',      mode: 'rapid/blitz'     },
  ]},
  { name: 'Anna Cramling',           country: 'SE', fide: 2375, handles: [
    { platform: 'lichess',  username: 'AnnaCramling',     mode: 'rapid/blitz'     },
  ]},
  // ── High-volume bullet specialists (positional pattern diversity) ──────────
  { name: 'Bullet Specialist A',     country: '??', fide: 0, handles: [
    { platform: 'lichess',  username: 'lance5500',        mode: 'bullet'          },
  ]},
  { name: 'John Bartholomew',         country: 'US', fide: 2455, handles: [
    { platform: 'lichess',  username: 'Fins',             mode: 'rapid/blitz'     },
  ]},
];

// Auto-derived — unique Lichess handles only, no duplicates across accounts
const LICHESS_API_PLAYERS = [...new Set(
  PLAYER_REGISTRY.flatMap(p => p.handles.filter(h => h.platform === 'lichess').map(h => h.username))
)];

// Lookup: username.toLowerCase() → { canonical_name, mode, country, fide_rating }
// Used when tagging ingested games so the same real player is linked across all handles
const HANDLE_INFO = Object.fromEntries(
  PLAYER_REGISTRY.flatMap(p =>
    p.handles.map(h => [h.username.toLowerCase(), {
      canonical_name: p.name, mode: h.mode, country: p.country, fide_rating: p.fide,
    }])
  )
);

let lichessApiPlayerIndex = 0;

// ════════════════════════════════════════════════════════
// v29.0: CROSS-PLATFORM PLAYER ALIAS MAP
// Maps platform-specific usernames to canonical real names.
// This enables unified accuracy tracking per PERSON across Lichess + Chess.com + KingBase.
// Format: { 'platform:username' → 'Canonical Name' }
// ════════════════════════════════════════════════════════

const PLAYER_ALIASES = new Map([
  // Magnus Carlsen
  ['lichess:DrNykterstein', 'Magnus Carlsen'], ['lichess:DrDrunkenstein', 'Magnus Carlsen'],
  ['chesscom:MagnusCarlsen', 'Magnus Carlsen'], ['kingbase:Carlsen, Magnus', 'Magnus Carlsen'],
  // Hikaru Nakamura
  ['lichess:GMHikaru', 'Hikaru Nakamura'], ['lichess:Hikaru', 'Hikaru Nakamura'],
  ['chesscom:Hikaru', 'Hikaru Nakamura'], ['kingbase:Nakamura, Hikaru', 'Hikaru Nakamura'],
  // Fabiano Caruana
  ['chesscom:FabianoCaruana', 'Fabiano Caruana'], ['kingbase:Caruana, Fabiano', 'Fabiano Caruana'],
  // Alireza Firouzja
  ['lichess:alireza2003', 'Alireza Firouzja'], ['chesscom:Firouzja2003', 'Alireza Firouzja'],
  ['kingbase:Firouzja, Alireza', 'Alireza Firouzja'],
  // Nihal Sarin
  ['lichess:nihalsarin', 'Nihal Sarin'], ['lichess:nihalsarin2004', 'Nihal Sarin'],
  ['chesscom:nihalsarin', 'Nihal Sarin'], ['kingbase:Sarin, Nihal', 'Nihal Sarin'],
  // Anish Giri
  ['lichess:AnishGiri', 'Anish Giri'], ['chesscom:AnishGiri', 'Anish Giri'],
  ['kingbase:Giri, Anish', 'Anish Giri'],
  // Wesley So
  ['lichess:GMWSO', 'Wesley So'], ['chesscom:WesleySo1993', 'Wesley So'],
  ['chesscom:So_Wesley', 'Wesley So'], ['kingbase:So, Wesley', 'Wesley So'],
  // Praggnanandhaa
  ['lichess:rpragchess', 'R Praggnanandhaa'], ['chesscom:rpragchess', 'R Praggnanandhaa'],
  ['chesscom:Pragg', 'R Praggnanandhaa'], ['kingbase:Praggnanandhaa, R', 'R Praggnanandhaa'],
  // Levon Aronian
  ['chesscom:LevonAronian', 'Levon Aronian'], ['kingbase:Aronian, Levon', 'Levon Aronian'],
  // Ian Nepomniachtchi
  ['lichess:Vladimirovich9000', 'Ian Nepomniachtchi'], ['lichess:lachesisQ', 'Ian Nepomniachtchi'],
  ['chesscom:lachesisQ', 'Ian Nepomniachtchi'], ['chesscom:Vladimirovich9000', 'Ian Nepomniachtchi'],
  ['kingbase:Nepomniachtchi, Ian', 'Ian Nepomniachtchi'],
  // Alexander Grischuk
  ['lichess:Grischuk', 'Alexander Grischuk'], ['chesscom:Grischuk', 'Alexander Grischuk'],
  ['kingbase:Grischuk, Alexander', 'Alexander Grischuk'],
  // Dommaraju Gukesh
  ['chesscom:Gukesh', 'D Gukesh'], ['kingbase:Gukesh, D', 'D Gukesh'],
  // Nodirbek Abdusattorov
  ['chesscom:Nodirbek', 'Nodirbek Abdusattorov'], ['kingbase:Abdusattorov, Nodirbek', 'Nodirbek Abdusattorov'],
  // Vincent Keymer
  ['chesscom:Keymer_Vincent', 'Vincent Keymer'], ['kingbase:Keymer, Vincent', 'Vincent Keymer'],
  // Arjun Erigaisi
  ['chesscom:Erigaisi', 'Arjun Erigaisi'], ['kingbase:Erigaisi, Arjun', 'Arjun Erigaisi'],
  // Jan-Krzysztof Duda
  ['lichess:Bombegansen2', 'Jan-Krzysztof Duda'], ['chesscom:Duda_JK', 'Jan-Krzysztof Duda'],
  ['kingbase:Duda, Jan-Krzysztof', 'Jan-Krzysztof Duda'],
  // Maxime Vachier-Lagrave
  ['lichess:LyonBeast', 'Maxime Vachier-Lagrave'], ['chesscom:lyonbeast', 'Maxime Vachier-Lagrave'],
  ['kingbase:Vachier-Lagrave, Maxime', 'Maxime Vachier-Lagrave'],
  // Eric Rosen
  ['lichess:EricRosen', 'Eric Rosen'], ['chesscom:IMRosen', 'Eric Rosen'],
  // Andrew Tang (penguingm1)
  ['lichess:penguingm1', 'Andrew Tang'], ['chesscom:penguin_gm', 'Andrew Tang'],
  // Levy Rozman (GothamChess)
  ['chesscom:GothamChess', 'Levy Rozman'], ['chesscom:Levy_Rozman', 'Levy Rozman'],
  // Jorden van Foreest
  ['lichess:opperwezen', 'Jorden van Foreest'], ['kingbase:Van Foreest, Jorden', 'Jorden van Foreest'],
  // John Bartholomew
  ['lichess:Fins', 'John Bartholomew'], ['chesscom:Fins0905', 'John Bartholomew'],
  ['chesscom:Bartholomew', 'John Bartholomew'],
  // Sergei Zhigalko
  ['lichess:Zhigalko_Sergei', 'Sergei Zhigalko'], ['chesscom:Zhigalko_Sergei', 'Sergei Zhigalko'],
  ['kingbase:Zhigalko, Sergei', 'Sergei Zhigalko'],
  // Oleksandr Bortnyk
  ['lichess:Oleksandr_Bortnyk', 'Oleksandr Bortnyk'], ['chesscom:Oleksandr_Bortnyk', 'Oleksandr Bortnyk'],
  // Vladimir Kramnik
  ['chesscom:VladimirKramnik', 'Vladimir Kramnik'], ['kingbase:Kramnik, Vladimir', 'Vladimir Kramnik'],
  // Vidit Gujrathi
  ['chesscom:Vidit_Gujrathi', 'Vidit Gujrathi'], ['kingbase:Vidit, Santosh Gujrathi', 'Vidit Gujrathi'],
  // Richard Rapport
  ['chesscom:Rapport_Richard', 'Richard Rapport'], ['kingbase:Rapport, Richard', 'Richard Rapport'],
  // Shakhriyar Mamedyarov
  ['chesscom:Mamedyarov_Shakhriyar', 'Shakhriyar Mamedyarov'], ['kingbase:Mamedyarov, Shakhriyar', 'Shakhriyar Mamedyarov'],
]);

// Reverse lookup: canonical name → all platform usernames
const CANONICAL_TO_ALIASES = new Map();
for (const [key, canonical] of PLAYER_ALIASES) {
  if (!CANONICAL_TO_ALIASES.has(canonical)) CANONICAL_TO_ALIASES.set(canonical, []);
  CANONICAL_TO_ALIASES.get(canonical).push(key);
}

/**
 * Resolve a platform-specific username to a canonical player name.
 * Falls back to the raw username if no alias exists.
 * @param {string} username - The platform username
 * @param {string} source - The data source (lichess_db, chess.com, kingbase, etc.)
 * @returns {string} Canonical player name
 */
function resolveCanonicalPlayer(username, source) {
  if (!username) return null;
  
  // Determine platform prefix from source
  let platform;
  if (source === 'lichess_db' || source === 'lichess' || source === 'lichess_puzzle') platform = 'lichess';
  else if (source === 'chess.com' || source === 'chesscom' || source === 'chesscom_puzzle') platform = 'chesscom';
  else if (source === 'kingbase') platform = 'kingbase';
  else if (source === 'ccrl' || source === 'fishtest') return username; // Engine names, no aliasing
  else platform = source;
  
  const key = `${platform}:${username}`;
  return PLAYER_ALIASES.get(key) || username;
}

// ════════════════════════════════════════════════════════
// v29.9: PARABLE TEMPORAL BRIDGE
// Maps chess archetypes → biblical parables → musical structures
// The Word IS the pattern. The pattern IS the light. The light IS the sound.
// ════════════════════════════════════════════════════════

const EP_EPSILON = 0.001; // Nothing doesn't exist

const PARABLE_MAP = {
  // Sacrifice & Courage
  david_goliath: {
    name: 'David and Goliath', scripture: '1 Samuel 17',
    flow: { early: 0.15, mid: 0.25, late: 0.60 }, intensity: 0.9, momentum: 1.8,
    chess: ['kingside_attack', 'sacrificial_attack', 'sacrificial_kingside_assault', 'piece_knight_maneuver'],
    music: { mode: 'phrygian', tempo: 'allegro', chords: 'i-bII-i-V', arc: 'pp→ff' },
    phases: ['The giant stands unchallenged', 'The shepherd steps forward — the sacrifice is offered', 'One stone, one moment — the kingside breaks through'],
    photon: 'hot',
  },
  prodigal_son: {
    name: 'The Prodigal Son', scripture: 'Luke 15:11-32',
    flow: { early: 0.40, mid: 0.15, late: 0.45 }, intensity: 0.7, momentum: 0.7,
    chess: ['overextension', 'retreat_regroup', 'prophylactic_defense', 'piece_advancement_pressure'],
    music: { mode: 'aeolian', tempo: 'andante', chords: 'I-V-vi-IV', arc: 'ff→pp→ff' },
    phases: ['Aggressive expansion — pieces push too far', 'The position collapses — material lost', 'Retreat and rebuild — the father welcomes home'],
    photon: 'transitional',
  },
  // Patience & Strategy
  sower_seeds: {
    name: 'The Sower and Seeds', scripture: 'Matthew 13:1-23',
    flow: { early: 0.50, mid: 0.30, late: 0.20 }, intensity: 0.4, momentum: 1.2,
    chess: ['queenside_expansion', 'pawn_storm', 'space_advantage', 'piece_general_pressure'],
    music: { mode: 'lydian', tempo: 'moderato', chords: 'I-II-IV-I', arc: 'mp→mf' },
    phases: ['Seeds scattered — pawns advance on multiple fronts', 'Some fall on rock — not all chains survive', 'Good soil bears fruit — surviving structure wins'],
    photon: 'cold',
  },
  mustard_seed: {
    name: 'The Mustard Seed', scripture: 'Matthew 13:31-32',
    flow: { early: 0.10, mid: 0.30, late: 0.60 }, intensity: 0.5, momentum: 1.9,
    chess: ['closed_maneuvering', 'positional_squeeze', 'endgame_technique', 'piece_bishop_control'],
    music: { mode: 'ionian', tempo: 'andante', chords: 'I-IV-V-I', arc: 'pp→mp→mf→ff' },
    phases: ['A tiny advantage — a single tempo, a diagonal', 'Quiet maneuvering — the bishops grow in influence', 'The tree fills the sky — small edge becomes unstoppable'],
    photon: 'cold',
  },
  // Transformation
  talents: {
    name: 'Parable of the Talents', scripture: 'Matthew 25:14-30',
    flow: { early: 0.33, mid: 0.33, late: 0.34 }, intensity: 0.6, momentum: 1.5,
    chess: ['piece_activity', 'development_lead', 'initiative', 'piece_queen_dominance'],
    music: { mode: 'mixolydian', tempo: 'moderato', chords: 'I-bVII-IV-I', arc: 'mf→f→ff' },
    phases: ['Resources distributed — pieces developed', 'Active pieces multiply influence — initiative compounds', 'The reckoning — invested pieces win, buried pieces lose'],
    photon: 'hot',
  },
  good_samaritan: {
    name: 'The Good Samaritan', scripture: 'Luke 10:25-37',
    flow: { early: 0.30, mid: 0.50, late: 0.20 }, intensity: 0.65, momentum: 1.1,
    chess: ['opposite_castling', 'counterattack', 'defensive_resource', 'piece_rook_activity'],
    music: { mode: 'dorian', tempo: 'andante', chords: 'i-IV-i-V', arc: 'mf→pp→mf' },
    phases: ['The traveler is attacked — position under siege', 'Unexpected defender arrives — cross-board intervention', 'Wounds bound — position stabilizes through unlikely defense'],
    photon: 'transitional',
  },
  // Judgment & Endgame
  wise_foolish_builders: {
    name: 'Wise and Foolish Builders', scripture: 'Matthew 7:24-27',
    flow: { early: 0.45, mid: 0.35, late: 0.20 }, intensity: 0.55, momentum: 0.8,
    chess: ['pawn_structure', 'fortress', 'solid_defense', 'piece_balanced_activity'],
    music: { mode: 'aeolian', tempo: 'moderato', chords: 'i-VI-III-VII', arc: 'f→mf→pp' },
    phases: ['Two structures rise — both sides build pawn chains', 'The storm comes — tactics test foundations', 'One stands, one falls — sound structure survives'],
    photon: 'cold',
  },
  wheat_tares: {
    name: 'Wheat and Tares', scripture: 'Matthew 13:24-30',
    flow: { early: 0.25, mid: 0.45, late: 0.30 }, intensity: 0.5, momentum: 1.0,
    chess: ['closed_maneuvering', 'prophylactic_defense', 'positional_squeeze', 'piece_harmony'],
    music: { mode: 'dorian', tempo: 'andante', chords: 'i-iv-i-V', arc: 'mp→mf→mp' },
    phases: ['Good and bad pieces grow together — unclear position', 'Patient waiting — let the position clarify', 'The harvest — endgame reveals true piece value'],
    photon: 'cold',
  },
  // Reversal
  last_first: {
    name: 'The Last Shall Be First', scripture: 'Matthew 20:1-16',
    flow: { early: 0.15, mid: 0.20, late: 0.65 }, intensity: 0.75, momentum: 1.7,
    chess: ['counterattack', 'exchange_sacrifice', 'initiative', 'piece_material_advantage'],
    music: { mode: 'phrygian', tempo: 'presto', chords: 'i-bII-V-i', arc: 'pp→ff' },
    phases: ['Behind in material — the underdog labors quietly', 'The reversal begins — sacrifice opens lines', 'The last becomes first — counterattack overwhelms'],
    photon: 'hot',
  },
  lost_sheep: {
    name: 'The Lost Sheep', scripture: 'Luke 15:1-7',
    flow: { early: 0.35, mid: 0.45, late: 0.20 }, intensity: 0.5, momentum: 0.9,
    chess: ['piece_rescue', 'retreat_regroup', 'defensive_resource'],
    music: { mode: 'aeolian', tempo: 'adagio', chords: 'vi-IV-I-V', arc: 'mf→pp→mp' },
    phases: ['A piece is stranded — cut off from the army', 'Resources diverted to rescue', 'Reunion — piece returns, position is whole again'],
    photon: 'transitional',
  },
  // Wisdom
  ten_virgins: {
    name: 'The Ten Virgins', scripture: 'Matthew 25:1-13',
    flow: { early: 0.20, mid: 0.30, late: 0.50 }, intensity: 0.6, momentum: 1.3,
    chess: ['time_pressure', 'preparation', 'endgame_technique'],
    music: { mode: 'mixolydian', tempo: 'allegro', chords: 'I-V-IV-I', arc: 'mp→mf→ff' },
    phases: ['Preparation — conserve time, build reserves', 'The wait — middlegame tests patience', 'Time pressure reveals who prepared and who squandered'],
    photon: 'hot',
  },
  pearl_great_price: {
    name: 'Pearl of Great Price', scripture: 'Matthew 13:45-46',
    flow: { early: 0.20, mid: 0.60, late: 0.20 }, intensity: 0.85, momentum: 1.0,
    chess: ['exchange_sacrifice', 'sacrificial_attack', 'queen_sacrifice', 'piece_queen_dominance'],
    music: { mode: 'lydian', tempo: 'moderato', chords: 'I-#IV-V-I', arc: 'mf→ff→mf' },
    phases: ['Searching — evaluating exchanges for the combination', 'The sacrifice — giving everything for the decisive blow', 'Possession — the sacrifice yields checkmate'],
    photon: 'hot',
  },
};

function findParableResonance(archetype, temporalFlow, intensity, momentum, moveNumber, totalMoves) {
  if (!archetype) return null;
  const gamePhase = totalMoves > 0 ? moveNumber / totalMoves : 0.5;
  let best = null;
  let bestScore = EP_EPSILON;

  // Normalize temporal flow: shift to all-positive, then normalize to sum ~1.0
  // Nothing doesn't exist — every phase has energy > 0
  const tf = temporalFlow || {};
  let rawE = tf.early ?? tf.opening ?? EP_EPSILON;
  let rawM = tf.mid ?? tf.middlegame ?? EP_EPSILON;
  let rawL = tf.late ?? tf.endgame ?? EP_EPSILON;
  const minVal = Math.min(rawE, rawM, rawL);
  const shift = minVal < EP_EPSILON ? (EP_EPSILON - minVal) : 0;
  rawE += shift; rawM += shift; rawL += shift;
  const tfTotal = rawE + rawM + rawL || 1;
  const tfEarly = Math.max(EP_EPSILON, rawE / tfTotal);
  const tfMid = Math.max(EP_EPSILON, rawM / tfTotal);
  const tfLate = Math.max(EP_EPSILON, rawL / tfTotal);

  // Normalize intensity: EP raw (0-100+) → 0-1, floored to ε
  const normIntensity = Math.max(EP_EPSILON, Math.min(1, (Math.abs(intensity) || EP_EPSILON) / 50));
  // Normalize momentum to positive field: 1.0 = neutral, >1 = advancing, <1 = retreating
  const normMomentum = Math.max(EP_EPSILON, momentum + 1.0);

  for (const [key, p] of Object.entries(PARABLE_MAP)) {
    let score = EP_EPSILON;
    // 1. Archetype match (40%)
    if (p.chess.includes(archetype)) {
      score += 0.40;
    } else {
      const root = archetype.split('_')[0];
      if (p.chess.some(a => a.includes(root) || root.includes(a.split('_')[0]))) score += 0.15;
    }
    // 2. Temporal flow cosine similarity (30%) — all values positive
    const pf = p.flow;
    const dot = tfEarly * pf.early + tfMid * pf.mid + tfLate * pf.late;
    const magA = Math.sqrt(tfEarly**2 + tfMid**2 + tfLate**2) || EP_EPSILON;
    const magB = Math.sqrt(pf.early**2 + pf.mid**2 + pf.late**2) || EP_EPSILON;
    score += Math.max(EP_EPSILON, dot / (magA * magB)) * 0.30;
    // 3. Intensity match (15%)
    score += Math.max(EP_EPSILON, 1 - Math.abs(normIntensity - p.intensity)) * 0.15;
    // 4. Momentum match (15%) — ratio proximity in positive field
    const momRatio = Math.max(normMomentum, p.momentum) / (Math.min(normMomentum, p.momentum) || EP_EPSILON);
    score += Math.max(EP_EPSILON, 1 / momRatio) * 0.15;

    if (score > bestScore) { bestScore = score; best = { key, parable: p, score }; }
  }
  if (!best || bestScore < 0.20) return null;

  const phase = gamePhase < 0.33 ? 0 : gamePhase < 0.66 ? 1 : 2;
  const m = best.parable.music;
  return {
    parable: best.parable.name,
    scripture: best.parable.scripture,
    phase: best.parable.phases[phase],
    music: `${m.mode} ${m.tempo} (${m.chords}) ${m.arc}`,
    photon: best.parable.photon,
    resonance: Math.round(bestScore * 100),
  };
}

// ════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ════════════════════════════════════════════════════════

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,                         // v19.1: 10 connections for parallel game processing
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 20000,  // Increased for heavy batch processing
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

const FEN_REGEX = /^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h1-8-]+( \d+ \d+)?$/;

// ════════════════════════════════════════════════════════
// LOCAL STOCKFISH ENGINE — v19.1: Queue-based for parallel safety
// ════════════════════════════════════════════════════════

// stockfishProcess and engineReady declared at top (var) for uncaughtException handler

// v19.1: Simple FIFO queue so parallel game processing can safely share
// one Stockfish process. SF commands are serialized; everything else runs in parallel.
const sfQueue = [];
let sfBusy = false;

async function initStockfish() {
  if (!stockfishProcess) {
    console.log('[DB-INGEST] Starting local Stockfish...');
    stockfishProcess = spawn('stockfish', [], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    stockfishProcess.on('error', (err) => {
      console.error('[DB-INGEST] Stockfish spawn error:', err.message);
      engineReady = false; stockfishProcess = null;
    });
    stockfishProcess.on('close', () => { engineReady = false; stockfishProcess = null; });
    stockfishProcess.stdin.on('error', () => { engineReady = false; stockfishProcess = null; });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Stockfish init timeout')), 10000);
      const onData = (data) => {
        if (data.toString().includes('Stockfish') || data.toString().includes('uciok')) {
          clearTimeout(timeout);
          stockfishProcess.stdout.off('data', onData);
          engineReady = true;
          console.log(`[DB-INGEST] ✓ Stockfish ready (depth ${CONFIG.sfDepth}, fast=${CONFIG.sfDepthFast})`);
          resolve();
        }
      };
      stockfishProcess.stdout.on('data', onData);
      stockfishProcess.stdin.write('uci\nisready\n');
    });
  }
  return stockfishProcess;
}

// v19.1: Internal SF eval — called only from the queue processor
// v29.1 FIX: Stockfish returns eval from SIDE-TO-MOVE perspective.
// We normalize to WHITE's perspective here so all downstream code
// can assume positive = white winning, negative = black winning.
function _sfEvalInternal(engine, fen, depth) {
  const sideToMove = (fen || '').split(' ')[1] || 'w';
  const flipSign = sideToMove === 'b' ? -1 : 1;
  
  return new Promise((resolve) => {
    let evaluation = 0, currentDepth = 0, bestMove = 'e2e4';
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true; engine.stdout.off('data', onData);
        resolve({ evaluation: 0, depth: 0, bestMove: 'e2e4', source: 'timeout' });
      }
    }, 8000); // Reduced from 10s
    
    const onData = (data) => {
      if (resolved) return;
      for (const line of data.toString().split('\n')) {
        const t = line.trim();
        if (t.startsWith('bestmove')) {
          const parts = t.split(' ');
          if (parts.length >= 2) bestMove = parts[1];
          if (!resolved) {
            resolved = true; clearTimeout(timeout); engine.stdout.off('data', onData);
            // v29.1: Normalize to white's perspective before returning
            resolve({ evaluation: evaluation * flipSign, depth: currentDepth, bestMove, source: 'stockfish' });
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
    try {
      if (!engine.stdin.writable) throw new Error('stdin not writable');
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write(`go depth ${depth}\n`);
    } catch {
      if (!resolved) {
        resolved = true; clearTimeout(timeout); engine.stdout.off('data', onData);
        engineReady = false; stockfishProcess = null;
        resolve({ evaluation: 0, depth: 0, bestMove: 'e2e4', source: 'epipe_recovery' });
      }
    }
  });
}

// v19.1: Process SF queue — one at a time
async function processSfQueue() {
  if (sfBusy || sfQueue.length === 0) return;
  sfBusy = true;
  
  while (sfQueue.length > 0) {
    const { fen, depth, resolve } = sfQueue.shift();
    try {
      const engine = await initStockfish();
      if (!engineReady) throw new Error('Engine not ready');
      const result = await _sfEvalInternal(engine, fen, depth);
      resolve(result);
    } catch {
      // Material fallback
      const pieces = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      let w = 0, b = 0;
      for (const c of ((fen || '').split(' ')[0] || '')) {
        if (pieces[c.toLowerCase()]) {
          if (c === c.toLowerCase()) b += pieces[c]; else w += pieces[c.toLowerCase()];
        }
      }
      resolve({ evaluation: (w - b) / 10, depth: 0, bestMove: 'e2e4', source: 'material_count' });
    }
  }
  
  sfBusy = false;
}

// v19.1: Public API — enqueues and returns a promise
async function evaluateWithStockfish(fen, depth = CONFIG.sfDepth) {
  // If game has PGN evals, this won't be called (fast path in processGame)
  return new Promise((resolve) => {
    sfQueue.push({ fen, depth, resolve });
    processSfQueue(); // Kick the queue (no-op if already running)
  });
}

// v19.1: FAST MATERIAL+POSITIONAL EVAL — no Stockfish needed
// ~1000x faster than SF depth 14. Used for high-throughput mode.
function fastPositionalEval(fen) {
  const parts = (fen || '').split(' ');
  const board = parts[0] || '';
  const sideToMove = parts[1] || 'w';
  
  const pieceValues = { p: 1, n: 3.2, b: 3.3, r: 5, q: 9, k: 0 };
  let wMat = 0, bMat = 0, wPieces = 0, bPieces = 0;
  let wCenterControl = 0, bCenterControl = 0;
  
  const rows = board.split('/');
  for (let rank = 0; rank < rows.length; rank++) {
    let file = 0;
    for (const c of rows[rank]) {
      if (c >= '1' && c <= '8') { file += parseInt(c); continue; }
      const val = pieceValues[c.toLowerCase()] || 0;
      const isCenter = (file >= 2 && file <= 5 && rank >= 2 && rank <= 5);
      if (c === c.toUpperCase()) {
        wMat += val; wPieces++;
        if (isCenter && c.toLowerCase() !== 'k') wCenterControl += 0.1;
      } else {
        bMat += val; bPieces++;
        if (isCenter && c !== 'k') bCenterControl += 0.1;
      }
      file++;
    }
  }
  
  // Material advantage in centipawns
  let eval_cp = (wMat - bMat) * 100;
  // Center control bonus
  eval_cp += (wCenterControl - bCenterControl) * 30;
  // Tempo bonus for side to move
  eval_cp += sideToMove === 'w' ? 10 : -10;
  
  return {
    evaluation: eval_cp / 100,
    depth: 0,
    bestMove: 'e2e4',
    source: 'fast_positional'
  };
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
  
  // Load TRUE 32-piece color flow system (v26.0: ESM module in farm/workers/)
  let piece32Module = null;
  try {
    piece32Module = await import(join(__dirname, 'pieceColorFlow32.mjs'));
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
  const baseTime = tcMatch ? parseInt(tcMatch[1]) : 0;
  // Only block ultra-short games (under 15 seconds base). All bullet/blitz/rapid/classical included.
  if (baseTime > 0 && baseTime < 15) return false;
  
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
  
  // v19.1b: PEAK GOLDEN ZONE BIAS — moves 28-45 are 70-73% accuracy
  // Data: 20-25=67.6%, 26-30=68.9%, 31-35=70.2%, 36-40=72.7%, 41-45=71.7%
  // Focus 65% on peak zone (28-45), reduce early golden (20-27) to 15%
  const r = Math.random();
  if (r < 0.05) {
    // 5% early middlegame (12-19) — learning data only
    const earlyMax = Math.min(19, maxMove);
    return minMove + Math.floor(Math.random() * (earlyMax - minMove + 1));
  } else if (r < 0.20) {
    // 15% early golden (20-27) — 67-69% accuracy
    const start = Math.min(20, maxMove);
    const end = Math.min(27, maxMove);
    return start + Math.floor(Math.random() * (end - start + 1));
  } else if (r < 0.85) {
    // 65% PEAK golden zone (28-45) — 70-73% accuracy
    const peakStart = Math.min(28, maxMove);
    const peakEnd = Math.min(45, maxMove);
    return peakStart + Math.floor(Math.random() * (peakEnd - peakStart + 1));
  } else {
    // 15% late middlegame/endgame (46-55) — 69.6% accuracy
    const lateStart = Math.min(46, maxMove);
    return lateStart + Math.floor(Math.random() * (maxMove - lateStart + 1));
  }
}

// v27.0: MULTI-POSITION SELECTION — 3 positions per game
// Instead of 1 random snapshot, evaluate 3 positions across the game arc.
// This gives us trajectory (is advantage growing/shrinking?), consistency
// (do all 3 agree?), and coverage (catch reversals between snapshots).
// Positions: early-mid (~22), peak (~35), late (~48) with jitter.
function selectMultiPositions(totalMoves) {
  const maxMove = Math.min(totalMoves - 2, CONFIG.moveAnalysisRange.max);
  const minMove = CONFIG.moveAnalysisRange.min;
  if (maxMove <= minMove + 6) {
    // Very short game — just use single position at midpoint
    return [Math.max(minMove, Math.floor(totalMoves / 2))];
  }
  
  // Target positions with small random jitter (±2 moves)
  const jitter = () => Math.floor(Math.random() * 5) - 2; // -2 to +2
  const range = maxMove - minMove;
  
  // 3 positions spread across the game: ~40%, ~60%, ~80% through the range
  // v27.0a: Shifted later — early positions (move <20) have 63% acc vs 72% in peak zone.
  // Ensure pos1 starts no earlier than move 22 (early golden zone).
  const pos1 = Math.max(Math.min(22, maxMove), Math.min(maxMove, minMove + Math.round(range * 0.40) + jitter()));
  const pos2 = Math.max(pos1 + 3, Math.min(maxMove, minMove + Math.round(range * 0.60) + jitter()));
  const pos3 = Math.max(pos2 + 3, Math.min(maxMove, minMove + Math.round(range * 0.80) + jitter()));
  
  return [pos1, pos2, pos3];
}

// ════════════════════════════════════════════════════════
// FULL EP PREDICTION PIPELINE — Matching bulk worker quality
// Baseline (4-quad) + Enhanced (8-quad) + SF + Hybrid Fusion
// ════════════════════════════════════════════════════════

let enhFailCount = 0;

// v32.1: Normalize piece_* archetypes from pieceColorFlow32 to tactical equivalents.
// piece_* names are NOT in ARCHETYPE_DEFINITIONS — they break signal calibration by
// generating uncalibrated archetype entries that dilute the learned signal weights.
const PIECE_ARCHETYPE_REMAP = {
  piece_queen_dominance:          'central_domination',
  piece_queen_dominance_early:    'sacrificial_attack',   // v35: premature queen = tactical, inherit sacrificial weights
  piece_queen_dominance_endgame:  'endgame_technique',    // v35: queen + pawn endgame, inherit endgame weights
  piece_rook_activity:            'open_tactical',
  piece_rook_endgame:             'endgame_technique',    // v35: Lucena/Philidor/7th rank, inherit endgame weights
  piece_bishop_control:           'positional_squeeze',
  piece_knight_maneuver:          'closed_maneuvering',
  piece_balanced_activity:        'closed_maneuvering',
  piece_activity:                 'open_tactical',
  piece_endgame:                  'endgame_technique',
  piece_attack:                   'sacrificial_attack',
  piece_defense:          'prophylactic_defense',
  piece_material_advantage:'open_tactical',
  piece_advancement_pressure:'queenside_expansion',
};

function classifyArchetype32(sig) {
  // v26.0: New 32-piece module provides archetype directly
  if (sig?.archetype) {
    return PIECE_ARCHETYPE_REMAP[sig.archetype] || sig.archetype;
  }
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

// v27.0: EVALUATE SINGLE POSITION — building block for multi-position analysis
// Returns raw prediction data for one position. Reuses same logic as processGame
// but separated so we can call it at multiple move numbers.
async function evaluatePosition(game, moveNumber, epEngine, fullPgn, moveTokens) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extract32PieceSignature, predictFrom32Piece } = epEngine;
  
  // Play through moves with chess.js to get real FEN
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  try {
    const chess = new Chess();
    const targetHalfMove = moveNumber * 2;
    for (let i = 0; i < Math.min(targetHalfMove, moveTokens.length); i++) {
      const result = chess.move(moveTokens[i]);
      if (!result) break;
    }
    fen = chess.fen();
  } catch {}
  
  if (!FEN_REGEX.test(fen)) return null;
  
  // SF18 eval
  let sfEvalCp = 0;
  let hasRealEval = false;
  try {
    const sfResult = await evaluateWithStockfish(fen, CONFIG.sfDepthFast);
    sfEvalCp = Math.round(sfResult.evaluation * 100);
    hasRealEval = sfResult.source === 'stockfish';
  } catch {
    if (game.evals.length > 0) {
      const evalIndex = Math.min(moveNumber * 2 - 2, game.evals.length - 1);
      sfEvalCp = evalIndex >= 0 ? game.evals[evalIndex] : 0;
      hasRealEval = true;
    } else {
      const sfResult = fastPositionalEval(fen);
      sfEvalCp = Math.round(sfResult.evaluation * 100);
      hasRealEval = false;
    }
  }
  
  // Simulate and extract signature
  let simulation, board, totalMoves;
  try {
    simulation = simulateGame(fullPgn);
    board = simulation.board;
    totalMoves = simulation.totalMoves || moveNumber;
  } catch { return null; }
  
  // v29.4: Extract 32-piece signature FIRST so it can feed into the fusion system.
  // The 32-piece data provides piece-centric features (activity, territory, survival per piece)
  // that are fundamentally different from the board-centric signals in the baseline.
  let enhancedSig = null;
  if (extract32PieceSignature && predictFrom32Piece) {
    try {
      enhancedSig = extract32PieceSignature(fullPgn, moveNumber);
    } catch (e) {
      enhFailCount++;
      if (enhFailCount <= 3) console.error(`[DB-INGEST] 32-piece extraction failed (${enhFailCount}): ${e.message}`);
    }
  }
  
  // Baseline (4-quadrant) — v29.4: now receives 32-piece data as Component 15 in fusion
  const gameData = { white: game.headers.White || 'Unknown', black: game.headers.Black || 'Unknown', pgn: fullPgn };
  const baselineSig = extractColorFlowSignature(board, gameData, totalMoves);
  const baselinePred = predictFromColorFlow(baselineSig, totalMoves, sfEvalCp, 18, enhancedSig || undefined);
  const baselineResult = {
    predictedWinner: baselinePred.predictedWinner === 'white' ? 'white_wins' :
                     baselinePred.predictedWinner === 'black' ? 'black_wins' : 'draw',
    confidence: baselinePred.confidence / 100,
  };
  
  // 32-piece standalone prediction (for enhanced result / comparison)
  let enhancedResult = baselineResult;
  if (enhancedSig && predictFrom32Piece) {
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
  
  const sfPrediction = sfEvalCp > 30 ? 'white_wins' : sfEvalCp < -30 ? 'black_wins' : 'draw';
  
  // v27.3 ARCH 5: Material count from FEN — zero cost, new signal dimension
  const material = countMaterial(fen);
  
  return {
    moveNumber, fen, sfEvalCp, hasRealEval, sfPrediction,
    baselineResult, baselinePred, baselineSig,
    enhancedResult, enhancedSig,
    intensity: baselineSig?.intensity || 0,
    material,
  };
}

// v27.0: MULTI-POSITION AGGREGATOR
// Takes 3 position evaluations and produces one superior prediction.
// Uses weighted voting (higher |eval| = more weight), trajectory detection,
// and consistency scoring (all agree = high conf, disagreement = low conf).
function aggregateMultiPosition(posEvals) {
  if (!posEvals || posEvals.length === 0) return null;
  if (posEvals.length === 1) return posEvals[0]; // Fallback to single-position
  
  // Weighted vote across all positions
  // Weight by |eval| (higher eval = more decisive = more trustworthy)
  // and by confidence (higher conf = more reliable signal)
  const votes = { white_wins: 0, black_wins: 0, draw: 0 };
  let totalWeight = 0;
  
  for (const pe of posEvals) {
    const absEval = Math.abs(pe.sfEvalCp);
    // v27.0a: Weight by move-number accuracy zone, not just |eval|.
    // Peak zone (28-45) has 70-73% acc, early golden (20-27) has 67-69%,
    // late (46+) has 69.6%. Weight peak positions more heavily.
    let phaseWeight = 1.0;
    if (pe.moveNumber >= 28 && pe.moveNumber <= 45) phaseWeight = 1.5; // peak zone
    else if (pe.moveNumber >= 20 && pe.moveNumber < 28) phaseWeight = 1.2; // early golden
    else if (pe.moveNumber > 45) phaseWeight = 1.1; // late middlegame
    // Also weight by |eval| but less aggressively
    const evalWeight = Math.min(2.0, 1.0 + absEval / 400);
    const confWeight = pe.baselineResult.confidence;
    const w = phaseWeight * evalWeight * confWeight;
    votes[pe.baselineResult.predictedWinner] += w;
    totalWeight += w;
  }
  
  // Determine winner from weighted vote
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const multiPrediction = sorted[0][0];
  
  // Consistency: how many positions agree with the winner?
  const agreeing = posEvals.filter(pe => pe.baselineResult.predictedWinner === multiPrediction).length;
  const consistency = agreeing / posEvals.length; // 1.0 = unanimous, 0.33 = split
  
  // Trajectory: is eval trending in one direction?
  // If eval is growing (advantage increasing), boost confidence.
  // If eval is shrinking (advantage decreasing), dampen confidence.
  let trajectory = 0; // positive = advantage growing, negative = shrinking
  if (posEvals.length >= 2) {
    const evals = posEvals.map(pe => pe.sfEvalCp);
    // Simple: compare last eval to first eval
    const evalDelta = evals[evals.length - 1] - evals[0];
    // Normalize: positive delta when the predicted winner's advantage is growing
    if (multiPrediction === 'white_wins') trajectory = evalDelta;
    else if (multiPrediction === 'black_wins') trajectory = -evalDelta;
    // draw: trajectory doesn't matter
  }
  
  // v29.2: Pick the "best" position — PREFER TIGHTER EVAL ZONES where EP has edge over SF.
  // Old logic: highest |eval| → biased toward 500+cp where EP=SF (no edge).
  // New logic: score positions by EP edge potential. 0-200cp is where spatial analysis matters.
  // This ensures the stored prediction is from the zone where EP is most differentiated from SF.
  const evalEdgeScore = (absEval) => {
    if (absEval < 50) return 4.0;    // EP +6.4pp edge — highest value
    if (absEval < 200) return 3.0;   // EP +1.3pp edge — good value
    if (absEval < 500) return 2.0;   // EP ~0pp edge — moderate
    return 1.0;                       // EP=SF — lowest value (both just follow eval)
  };
  const agreeingPositions = posEvals.filter(pe => pe.baselineResult.predictedWinner === multiPrediction);
  const bestPosition = agreeingPositions.length > 0
    ? agreeingPositions.sort((a, b) => evalEdgeScore(Math.abs(b.sfEvalCp)) - evalEdgeScore(Math.abs(a.sfEvalCp)))[0]
    : posEvals.sort((a, b) => evalEdgeScore(Math.abs(b.sfEvalCp)) - evalEdgeScore(Math.abs(a.sfEvalCp)))[0];
  
  // Return the best position's data, enriched with multi-position metadata
  return {
    ...bestPosition,
    // Override prediction with multi-position vote result
    multiPrediction,
    multiConsistency: consistency,
    multiTrajectory: trajectory,
    multiAgreeing: agreeing,
    multiTotal: posEvals.length,
    multiEvals: posEvals.map(pe => pe.sfEvalCp),
    multiPredictions: posEvals.map(pe => pe.baselineResult.predictedWinner),
  };
}

// v27.3 ARCH 5: MATERIAL COUNTING FROM FEN
// Extract piece counts directly from FEN. Zero cost, genuinely new signal.
// Material advantage is a strong predictor of conversion probability.
// Standard piece values: P=1, N=3, B=3, R=5, Q=9
function countMaterial(fen) {
  if (!fen) return null;
  const board = fen.split(' ')[0];
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let white = 0, black = 0;
  let wPieces = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  let bPieces = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  for (const c of board) {
    const lower = c.toLowerCase();
    if (values[lower]) {
      if (c === c.toUpperCase()) { white += values[lower]; wPieces[lower]++; }
      else { black += values[lower]; bPieces[lower]++; }
    }
  }
  const balance = white - black; // positive = white has more material
  const totalMaterial = white + black;
  const hasBishopPair = (side) => side.b >= 2;
  return {
    white, black, balance, totalMaterial,
    wPieces, bPieces,
    whiteBishopPair: hasBishopPair(wPieces),
    blackBishopPair: hasBishopPair(bPieces),
    isEndgame: totalMaterial <= 24, // roughly when queens are off + some pieces traded
    isMaterialImbalance: Math.abs(balance) >= 2, // at least 2 pawns worth of difference
  };
}

// v27.2: PLAYER PROFILE CACHE — avoid DB round-trip per game
// TTL-based cache: profiles expire after 10 min so updates propagate
const playerProfileCache = new Map(); // id -> { profile, fetchedAt }
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getPlayerProfile(playerName, source) {
  if (!pool || !playerName || playerName === 'Unknown') return null;
  const id = `${source}:${playerName.toLowerCase()}`;
  const cached = playerProfileCache.get(id);
  if (cached && Date.now() - cached.fetchedAt < PROFILE_CACHE_TTL) return cached.profile;
  
  try {
    const { rows } = await pool.query(
      `SELECT total_games, wins_as_white, wins_as_black, losses_as_white, losses_as_black, draws,
              latest_elo, peak_elo, ep_correct, ep_total, sf_correct,
              win_rate_white, win_rate_black, draw_rate,
              inferred_style, style_confidence
       FROM player_profiles WHERE id = $1`, [id]
    );
    const profile = rows.length > 0 ? rows[0] : null;
    playerProfileCache.set(id, { profile, fetchedAt: Date.now() });
    // Evict old entries periodically to prevent memory leak
    if (playerProfileCache.size > 10000) {
      const now = Date.now();
      for (const [k, v] of playerProfileCache) {
        if (now - v.fetchedAt > PROFILE_CACHE_TTL) playerProfileCache.delete(k);
      }
    }
    return profile;
  } catch {
    return null;
  }
}

async function processGame(game, moveNumber, epEngine, source) {
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extract32PieceSignature, predictFrom32Piece } = epEngine;
  
  const headerLines = Object.entries(game.headers).map(([k, v]) => `[${k} "${v}"]`).join('\n');
  const fullPgn = headerLines + '\n\n' + game.moves;
  const moveTokens = game.moves
    .replace(/\{[^}]*\}/g, '').replace(/\d+\.+/g, '').split(/\s+/)
    .filter(t => t && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/));
  
  // v27.2: Fetch player profiles (cached, non-blocking on failure)
  const dbSource = source || 'lichess_db';
  const [whiteProfile, blackProfile] = await Promise.all([
    getPlayerProfile(game.headers.White, dbSource),
    getPlayerProfile(game.headers.Black, dbSource),
  ]);
  
  // v27.1: PRIMARY position evaluation (uses the well-calibrated selectMoveNumber)
  // Prediction comes from THIS position only. Multi-position is confidence-only.
  const primaryEval = await evaluatePosition(game, moveNumber, epEngine, fullPgn, moveTokens);
  if (!primaryEval) return null;
  
  // v27.1: SECONDARY positions for confidence signal (don't change prediction)
  // Evaluate 2 additional positions across the game arc.
  // Agreement = boost confidence. Disagreement = dampen.
  const totalMoves = Math.floor(moveTokens.length / 2);
  let multiAgreement = null; // null = no multi-position data
  if (totalMoves >= 30) { // Only for games long enough to have meaningful spread
    const maxMove = Math.min(totalMoves - 2, CONFIG.moveAnalysisRange.max);
    const minMove = CONFIG.moveAnalysisRange.min;
    // Pick 2 secondary positions: one earlier, one later than primary
    const earlyPos = Math.max(minMove, Math.min(moveNumber - 8, Math.round(minMove + (maxMove - minMove) * 0.25)));
    const latePos = Math.min(maxMove, Math.max(moveNumber + 8, Math.round(minMove + (maxMove - minMove) * 0.75)));
    
    const secondaryEvals = [];
    if (earlyPos !== moveNumber && earlyPos >= minMove) {
      const pe = await evaluatePosition(game, earlyPos, epEngine, fullPgn, moveTokens);
      if (pe) secondaryEvals.push(pe);
    }
    if (latePos !== moveNumber && latePos <= maxMove) {
      const pe = await evaluatePosition(game, latePos, epEngine, fullPgn, moveTokens);
      if (pe) secondaryEvals.push(pe);
    }
    
    if (secondaryEvals.length > 0) {
      const primaryPred = primaryEval.baselineResult.predictedWinner;
      const agreeing = secondaryEvals.filter(pe => pe.baselineResult.predictedWinner === primaryPred).length;
      const totalSecondary = secondaryEvals.length;
      
      // Trajectory: eval trend across positions
      const allEvals = [primaryEval, ...secondaryEvals].sort((a, b) => a.moveNumber - b.moveNumber);
      const evalDelta = allEvals[allEvals.length - 1].sfEvalCp - allEvals[0].sfEvalCp;
      let trajectory = 0;
      if (primaryPred === 'white_wins') trajectory = evalDelta;
      else if (primaryPred === 'black_wins') trajectory = -evalDelta;
      
      multiAgreement = {
        agreeing,
        total: totalSecondary,
        consistency: agreeing / totalSecondary,
        trajectory,
        evals: allEvals.map(pe => pe.sfEvalCp),
        predictions: allEvals.map(pe => pe.baselineResult.predictedWinner),
      };
    }
  }
  
  // Use primary position's data for the full pipeline
  const { fen, sfEvalCp, hasRealEval, baselineResult, baselinePred, baselineSig,
          enhancedResult, enhancedSig, material } = primaryEval;
  
  // SF prediction from the primary position's eval
  const sf17Prediction = sfEvalCp > 30 ? 'white_wins' : sfEvalCp < -30 ? 'black_wins' : 'draw';
  
  // Actual outcome
  const result = game.headers.Result;
  const actualOutcome = result === '1-0' ? 'white_wins' : result === '0-1' ? 'black_wins' :
                        result === '1/2-1/2' ? 'draw' : null;
  if (!actualOutcome) return null;
  
  // Position hash
  const positionHash = crypto.createHash('sha256').update(fen).digest('hex').substring(0, 16);
  
  // ─── v26.0: ADAPTIVE FUSION (2-way or 3-way depending on 32-piece availability) ───
  // When 32-piece module produces a GENUINE independent prediction (different from baseline),
  // use real 3-way fusion. Otherwise, honest 2-way (baseline vs SF).
  const fusionArchetype = enhancedSig?.archetype || baselineSig.archetype;
  const playerCtx = {
    whiteName: game.headers.White || null,
    blackName: game.headers.Black || null,
    platform: game.source || 'lichess_db',
  };
  const fw = getIntelligentFusionWeights(fusionArchetype, game.headers.TimeControl || null, moveNumber, playerCtx, hasRealEval ? sfEvalCp : null);
  const baseConf = baselineResult.confidence;
  const enhConf = enhancedResult.confidence;
  const sfConf = hasRealEval ? Math.min(0.95, 0.5 + Math.abs(sfEvalCp) / 500) : 0.3;
  
  // Detect if 32-piece produced a genuinely independent prediction
  const has32Piece = enhancedSig && (enhancedResult.predictedWinner !== baselineResult.predictedWinner ||
                                      Math.abs(enhancedResult.confidence - baselineResult.confidence) > 0.05);
  
  const votes = { white_wins: 0, black_wins: 0, draw: 0 };
  let agreementCount, voiceCount;
  
  if (has32Piece) {
    // REAL 3-WAY FUSION: baseline + 32-piece + SF
    // v1.1: 32-piece gets reduced directional weight (only 28% correct when disagreeing)
    // but its agreement/disagreement is a strong confidence signal (74% vs 60.6%)
    const enh32Weight = fw.enhancedWeight * 0.5; // halve directional influence
    const baseWeight32 = fw.baselineWeight + fw.enhancedWeight * 0.5; // give remainder to baseline
    votes[baselineResult.predictedWinner] += baseWeight32 * baseConf;
    votes[enhancedResult.predictedWinner] += enh32Weight * enhConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
    voiceCount = 3;
    // Count how many voices agree on the winner
    const preds = [baselineResult.predictedWinner, enhancedResult.predictedWinner, sf17Prediction];
    const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    agreementCount = preds.filter(p => p === winner).length;
  } else {
    // HONEST 2-WAY FUSION: baseline + SF (32-piece not available or identical to baseline)
    const epWeight = fw.baselineWeight + fw.enhancedWeight; // ~0.65
    votes[baselineResult.predictedWinner] += epWeight * baseConf;
    votes[sf17Prediction] += fw.sfWeight * sfConf;
    voiceCount = 2;
    agreementCount = baselineResult.predictedWinner === sf17Prediction ? 2 : 1;
  }
  
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  let hybridPrediction = sortedVotes[0][0];
  const hybridRawConf = sortedVotes[0][1] / (sortedVotes[0][1] + sortedVotes[1][1] + sortedVotes[2][1] + 0.001);
  
  // Agreement-based confidence adjustment
  let hybridConf = hybridRawConf;
  if (voiceCount === 3) {
    // 3-way: unanimous = strong boost, 2/3 = mild boost, 1/3 = penalty
    if (agreementCount === 3) hybridConf = Math.min(0.69, hybridConf * 1.15);
    else if (agreementCount === 2) hybridConf = Math.min(0.69, hybridConf * 1.05);
    else hybridConf *= 0.75;
  } else {
    // 2-way: agree = moderate boost, disagree = penalty
    if (agreementCount === 2) hybridConf = Math.min(0.69, hybridConf * 1.10);
    else hybridConf *= 0.80;
  }
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));
  
  // v27.1: MULTI-POSITION CONFIDENCE-ONLY SIGNAL
  // v27.0/v27.0a tested: using multi-position to CHANGE prediction hurt -3pp.
  // The single-position selector is well-calibrated. Don't override it.
  // Instead, use secondary positions purely to adjust confidence:
  //   All agree → boost (the game trajectory confirms our prediction)
  //   Disagree → dampen (the game trajectory contradicts our prediction)
  if (multiAgreement) {
    const { agreeing, total, trajectory } = multiAgreement;
    
    if (agreeing === total) {
      // All secondary positions agree with primary — strong confirmation
      // v27.1a: This is the money signal. Games where the whole arc agrees
      // are much more likely to be correct. Boost to promote to higher tier.
      hybridConf = Math.min(0.69, hybridConf * 1.07);
    } else if (agreeing === 0) {
      // All secondary positions DISAGREE — but this doesn't mean primary is wrong.
      // The game may have had a reversal. Gentle dampen only.
      // v27.1a: Was 0.88 * min(0.55) — too aggressive, hurt below-60 by -1.5pp.
      hybridConf *= 0.96;
    }
    // Mixed agreement (1 of 2 agrees): no adjustment — ambiguous signal
    
    // Trajectory: eval trending in predicted direction = confirmation
    if (trajectory > 200 && agreeing === total) {
      // Strong trajectory + full agreement = very high conviction
      hybridConf = Math.min(0.69, hybridConf * 1.04);
    }
    // v27.1a: Removed negative trajectory dampen — it was part of the below-60 hurt.
  }
  
  // v27.2/v27.3: PLAYER PROFILE CONFIDENCE SIGNAL
  // When we know both players well, their historical patterns inform confidence.
  // This is the READ-SIDE foundation — at billions of games, this becomes
  // player-specific prediction models. For now: gentle confidence-only signal.
  //
  // v27.3 ARCH 2f: Added style matchup signal.
  // Style matchups affect game predictability:
  //   aggressive vs solid → highly predictable (solid usually wins)
  //   tactical vs tactical → chaotic, less predictable
  //   universal players → adapt, harder to predict
  let playerSignal = null;
  if (whiteProfile && blackProfile && 
      whiteProfile.total_games >= 50 && blackProfile.total_games >= 50) {
    // Both players have enough history for meaningful signal (50+ games each)
    const wpEpAcc = whiteProfile.ep_total > 0 ? whiteProfile.ep_correct / whiteProfile.ep_total : null;
    const bpEpAcc = blackProfile.ep_total > 0 ? blackProfile.ep_correct / blackProfile.ep_total : null;
    
    if (wpEpAcc !== null && bpEpAcc !== null) {
      const avgPlayerEpAcc = (wpEpAcc + bpEpAcc) / 2;
      
      // EP historically accurate for these players' games → boost
      // EP historically struggles → dampen
      // Threshold: overall EP acc is ~68%, so above 72% is notably good
      if (avgPlayerEpAcc >= 0.72) {
        hybridConf = Math.min(0.69, hybridConf * 1.03);
      } else if (avgPlayerEpAcc <= 0.55) {
        // EP struggles with these players (likely super GMs) — gentle dampen
        hybridConf *= 0.97;
      }
      
      // v27.3 ARCH 2f: Style matchup predictability signal
      const wStyle = whiteProfile.inferred_style || 'unknown';
      const bStyle = blackProfile.inferred_style || 'unknown';
      // Predictable matchups: styles where outcome patterns are clearer
      const predictableMatchups = [
        ['aggressive', 'solid'],   // solid usually grinds down aggressive
        ['positional', 'aggressive'], // positional controls chaos
      ];
      const chaoticMatchups = [
        ['tactical', 'tactical'],  // mutual calculation = volatile
        ['aggressive', 'aggressive'], // double-edged = unpredictable
      ];
      const matchupKey = [wStyle, bStyle].sort().join('+');
      const isPredictable = predictableMatchups.some(m => m.sort().join('+') === matchupKey);
      const isChaotic = chaoticMatchups.some(m => m.sort().join('+') === matchupKey);
      if (isPredictable && whiteProfile.style_confidence >= 0.5 && blackProfile.style_confidence >= 0.5) {
        hybridConf = Math.min(0.69, hybridConf * 1.02);
      } else if (isChaotic && whiteProfile.style_confidence >= 0.5 && blackProfile.style_confidence >= 0.5) {
        hybridConf *= 0.98;
      }
      
      // v27.3 ARCH 2f: Player win rate vs prediction alignment
      // If we predict white wins and white has a high win rate as white → confirmation
      const wpWinRate = parseFloat(whiteProfile.win_rate_white) || 0.5;
      const bpWinRate = parseFloat(blackProfile.win_rate_black) || 0.5;
      if (hybridPrediction === 'white_wins' && wpWinRate >= 0.6 && whiteProfile.total_games >= 100) {
        hybridConf = Math.min(0.69, hybridConf * 1.02);
      } else if (hybridPrediction === 'black_wins' && bpWinRate >= 0.6 && blackProfile.total_games >= 100) {
        hybridConf = Math.min(0.69, hybridConf * 1.02);
      }
      
      playerSignal = {
        whiteGames: whiteProfile.total_games,
        blackGames: blackProfile.total_games,
        whiteEpAcc: Math.round(wpEpAcc * 1000) / 10,
        blackEpAcc: Math.round(bpEpAcc * 1000) / 10,
        avgEpAcc: Math.round(avgPlayerEpAcc * 1000) / 10,
        whiteStyle: wStyle,
        blackStyle: bStyle,
        matchup: isPredictable ? 'predictable' : isChaotic ? 'chaotic' : 'neutral',
        wpWinRateWhite: Math.round(wpWinRate * 100),
        bpWinRateBlack: Math.round(bpWinRate * 100),
      };
    }
  }
  
  // v28.0: SOURCE-AWARE DRAW PRIOR ADJUSTMENT
  // Engine-vs-engine games (CCRL/Fishtest) have ~48% draw rate vs human ~30%.
  // When processing engine games, nudge toward draw when margin is tight.
  // This is the key intelligence gain from integrating engine game sources.
  const isEngineGame = source === 'ccrl' || source === 'fishtest';
  if (isEngineGame && hybridPrediction !== 'draw') {
    // In engine games, draws are ~1.6x more likely than in human games.
    // If the margin between top prediction and draw is small, flip to draw.
    const drawVote = votes['draw'] || 0;
    const topVote = sortedVotes[0][1];
    const drawGap = topVote - drawVote;
    const drawGapPct = drawGap / (topVote + 0.001);
    
    if (drawGapPct < 0.15 && Math.abs(sfEvalCp) < 80) {
      // Tight margin + low eval = engine draw territory
      hybridPrediction = 'draw';
      hybridConf = Math.min(0.69, hybridConf * 0.95);
    } else if (drawGapPct < 0.25 && Math.abs(sfEvalCp) < 40) {
      // Very low eval in engine game = strong draw signal
      hybridPrediction = 'draw';
      hybridConf = Math.min(0.69, hybridConf * 0.90);
    }
  }

  // v27.3 ARCH 3: OPENING (ECO) PREDICTABILITY SIGNAL
  // Some opening families produce more predictable games than others.
  // Data from 2.9M games shows ECO-level accuracy spread of ~5pp.
  // For now: use ECO letter as a coarse signal. At scale, use full ECO code.
  const ecoCode = game.headers.ECO || null;
  let openingSignal = null;
  if (ecoCode && ecoCode.length >= 1) {
    const ecoLetter = ecoCode[0].toUpperCase();
    // ECO families and their predictability characteristics:
    // A: Flank/irregular openings — diverse, less theory-driven
    // B: Semi-open (Sicilian, etc.) — tactical, volatile
    // C: Open games (1.e4 e5) — well-studied, moderate predictability
    // D: Closed/Queen's Gambit — positional, more predictable
    // E: Indian defenses — strategic, moderate-high predictability
    const ecoBoost = { 'D': 1.02, 'E': 1.01 };
    const ecoDampen = { 'B': 0.99 };
    if (ecoBoost[ecoLetter]) {
      hybridConf = Math.min(0.69, hybridConf * ecoBoost[ecoLetter]);
    } else if (ecoDampen[ecoLetter]) {
      hybridConf *= ecoDampen[ecoLetter];
    }
    openingSignal = { eco: ecoCode, letter: ecoLetter };
  }
  
  // Classify time control speed (needed by clock pressure + bullet caps below)
  const hdr_tc = game.headers;
  const tcRaw_early = hdr_tc.TimeControl || '';
  const tcMatch_early = tcRaw_early.match(/^(\d+)\+?(\d*)/);
  let tcSpeed = 'unknown';
  if (tcMatch_early) {
    const est = parseInt(tcMatch_early[1]) + (parseInt(tcMatch_early[2]) || 0) * 40;
    if (est < 180) tcSpeed = 'bullet';
    else if (est < 600) tcSpeed = 'blitz';
    else if (est < 1800) tcSpeed = 'rapid';
    else tcSpeed = 'classical';
  }
  
  // v27.3 ARCH 4: CLOCK PRESSURE ESTIMATION
  // We don't have actual clock data, but we can estimate time pressure
  // from time control + move number. In bullet (60s), by move 30 players
  // have ~1-2 seconds per move — outcomes become random.
  // Data: bullet accuracy drops from 68% at move 20 to 51% at move 40+.
  // This is already partially handled by bullet caps, but we can add
  // a continuous pressure signal for blitz too.
  if (tcSpeed === 'blitz' && moveNumber >= 40) {
    // Blitz late-game: players often have <30 seconds left
    // Accuracy drops ~5pp in this zone. Gentle dampen.
    hybridConf *= 0.98;
  }
  // Bullet extreme time pressure is already handled by bullet caps above.
  // For rapid/classical, time pressure is rarely a factor.
  
  // v27.3 ARCH 5: MATERIAL-AWARE CONFIDENCE SIGNAL
  // Material advantage is a strong predictor of conversion probability.
  // The side with more material converts eval advantages more reliably.
  let materialSignal = null;
  if (material && material.isMaterialImbalance && hasRealEval) {
    const matBalance = material.balance; // positive = white has more
    const predFavorsWhite = hybridPrediction === 'white_wins';
    const predFavorsBlack = hybridPrediction === 'black_wins';
    
    // Does our prediction align with the material advantage?
    const materialAligned = (predFavorsWhite && matBalance > 0) || (predFavorsBlack && matBalance < 0);
    const materialContra = (predFavorsWhite && matBalance < 0) || (predFavorsBlack && matBalance > 0);
    
    if (materialAligned) {
      // Prediction aligns with material advantage — more likely to convert
      // Stronger effect when eval also agrees (material + eval = very reliable)
      const evalAligned = (predFavorsWhite && sfEvalCp > 50) || (predFavorsBlack && sfEvalCp < -50);
      if (evalAligned && Math.abs(matBalance) >= 3) {
        // Material + eval + prediction all agree — strong boost
        hybridConf = Math.min(0.69, hybridConf * 1.05);
      } else {
        hybridConf = Math.min(0.69, hybridConf * 1.02);
      }
    } else if (materialContra && Math.abs(matBalance) >= 3) {
      // Predicting the side with LESS material wins — uphill conversion
      // Only dampen when material deficit is significant (3+ pawns worth)
      hybridConf *= 0.97;
    }
    
    materialSignal = {
      balance: matBalance,
      totalMaterial: material.totalMaterial,
      aligned: materialAligned,
      contra: materialContra,
    };
  }
  
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));
  
  // v16: POST-FUSION INTELLIGENCE GATES
  // Games are ALWAYS processed — these change the PREDICTION, not whether we process
  const fusionArch = enhancedSig ? classifyArchetype32(enhancedSig) : baselineSig.archetype;
  
  // Gate 1: DRAW-PRONE CONFIDENCE DAMPENER (v26.1)
  // Data: draws are only 5% of games. Even in the most draw-prone zone
  // (eval<=20cp + move>=40), draws are only 34% — predicting draw is wrong 66%.
  // Tested: draw predictor had 4.5% precision, flipped 11 correct predictions wrong.
  // LESSON: Don't predict draws. Instead, dampen confidence in draw-prone zones
  // so these uncertain positions don't pollute the high-conf bucket.
  if (hasRealEval) {
    const absEvalDraw = Math.abs(sfEvalCp);
    let drawScore = 0;
    if (absEvalDraw <= 5) drawScore += 3;
    else if (absEvalDraw <= 10) drawScore += 2.5;
    else if (absEvalDraw <= 20) drawScore += 2;
    else if (absEvalDraw <= 30) drawScore += 1;
    if (moveNumber >= 45) drawScore += 2;
    else if (moveNumber >= 35) drawScore += 1.5;
    else if (moveNumber >= 30) drawScore += 1;
    // Strong draw signal → dampen confidence (don't change prediction)
    // Score>=3 is redundant with 0-50cp eval cap (all score>=3 have eval<=30cp)
    // Score>=4 targets truly draw-prone games (31.6% accuracy, n=38)
    if (drawScore >= 4) hybridConf = Math.min(hybridConf, 0.48);
  }
  
  // Gate 2: Zero-edge archetype dampener
  hybridConf *= getArchetypeEdgeDampener(fusionArch);
  hybridConf = Math.min(0.69, Math.max(0.15, hybridConf));

  // v26.1 Path J tested: White-prediction dampener at 0-100cp. HURT (-0.9pp overall, -3.4pp conf 60).
  // White bias exists but blanket dampener damages high-conf correct predictions. Reverted.

  // v25.0: REVERSAL-AWARE CORRECTION (expanded from v21.2)
  // Data from 2,877 games in 100-500cp zone:
  //   Bullet: 35.3% reversal rate, EP 62.7% — biggest accuracy drag
  //   Blitz: 24.8% reversal, EP 72.0%
  //   Rapid: 21.1% reversal, EP 75.6%
  //   SF favors LOWER-rated: 32.0% reversal, EP 66.7%
  //   SF favors HIGHER-rated: 21.9% reversal, EP 74.7%
  //   Elo gap 100-200: higher-rated wins 61.1% of reversals
  //   Elo gap 200-300: higher-rated wins 65.1% of reversals
  //   Elo gap 300+: higher-rated wins 66.7% of reversals
  const hdr = game.headers;
  const wEloRev = parseInt(hdr.WhiteElo) || 0;
  const bEloRev = parseInt(hdr.BlackElo) || 0;
  const eloDiff = Math.abs(wEloRev - bEloRev);
  const whiteHigherRated = wEloRev > bEloRev;
  
  // tcSpeed already classified above (before clock pressure section)
  
  // v26.1 Path G: REVERSAL-RISK DAMPENER for 200-500cp zone
  // Data from 652 conf 62+ games in 200-500cp:
  //   SF favors lower-rated: 31.6% error (vs 17.7% higher) — 14pp gap
  //   Eval 200-250cp: 32.5% error (vs 17.4% at 400-500cp) — 15pp gap
  //   Move 40+: 32.1% error (vs 17.8% at move 10-20) — 14pp gap
  // When risk factors stack, dampen confidence below 62 threshold.
  if (hasRealEval && Math.abs(sfEvalCp) >= 200 && Math.abs(sfEvalCp) < 500) {
    let reversalRisk = 0;
    // Factor 1: SF favors lower-rated player (31.6% error rate)
    if (eloDiff >= 50 && wEloRev > 0 && bEloRev > 0) {
      const sfFavorsWhite = sfEvalCp > 0;
      const sfFavorsLower = (sfFavorsWhite && !whiteHigherRated) || (!sfFavorsWhite && whiteHigherRated);
      if (sfFavorsLower) reversalRisk += 1;
    }
    // Factor 2: Weak decisive zone (200-250cp has 32.5% error)
    if (Math.abs(sfEvalCp) < 250) reversalRisk += 1;
    // Factor 3: Late middlegame (move 40+ has 32.1% error)
    if (moveNumber >= 40) reversalRisk += 1;
    // 2+ risk factors → dampen below 60 threshold
    // v26.1: was 0.60→0.57→0.55. Dampened games had 64.8% acc at conf 60, 60% at conf 57.
    if (reversalRisk >= 2) {
      hybridConf = Math.min(0.55, hybridConf);
    }
  }

  // v25.0a: BULLET CONFIDENCE CAP (v26.1: eval-tiered)
  // Bullet accuracy by eval zone (from 1,802 games):
  //   50-500cp: 51-68% — high reversal rate, cap hard at 0.55
  //   500-1000cp: 76-78% — decent but not conf 69 quality, cap at 0.60
  //   1000+cp: 87-91% — reliable, no cap needed
  // v26.1 tested: 300-500cp→0.57 HURT (-2.4pp). 700+cp uncapped HURT (78.3% at conf 69).
  if (tcSpeed === 'bullet') {
    const absEvalBullet = Math.abs(sfEvalCp);
    if (absEvalBullet >= 50 && absEvalBullet < 300) {
      hybridConf = Math.min(0.55, hybridConf);
    } else if (absEvalBullet >= 300 && absEvalBullet < 500) {
      // v26.1 Path I.4: Bullet 300-500cp move<25 has 78.6% acc — promote to conf 60.
      // Late-game (25+) drops to 59.9-64.3% — keep at conf 55.
      hybridConf = Math.min(moveNumber < 25 ? 0.60 : 0.55, hybridConf);
    } else if (absEvalBullet >= 500 && absEvalBullet < 700) {
      // v26.1: Early-game bullet 500-700cp (move<30) has 79.4% acc — promote to conf 60.
      // Late-game (move 30+) drops to 64% — keep at conf 55.
      // Tested 400-700cp: bullet 400-500cp early was only 68.2% — too low for conf 60.
      hybridConf = Math.min(moveNumber < 30 ? 0.60 : 0.55, hybridConf);
    } else if (absEvalBullet >= 700 && absEvalBullet < 1000) {
      hybridConf = Math.min(0.60, hybridConf);  // Bullet 700-1000cp at 81.5% — appropriate for conf 60.
    }
    // 1000+cp: no bullet cap — 87-91% accuracy is reliable
  }
  
  // v26.1: REVERSAL CORRECTION (conservative — bullet/blitz only)
  // v26.1 experiment: expanding to all TCs in 50-200cp showed 50% acc on 34 flips (coin flip).
  // Historical data overfitted. Keep only proven bullet/blitz gate.
  // Bullet/blitz 50-400cp + gap>=150: 64.9% accuracy on flipped games (n=37).
  if (eloDiff >= 150 && wEloRev > 0 && bEloRev > 0 &&
      (tcSpeed === 'bullet' || tcSpeed === 'blitz') &&
      Math.abs(sfEvalCp) >= 50 && Math.abs(sfEvalCp) <= 400 &&
      hybridPrediction !== 'draw') {
    
    const predFavorsWhite = hybridPrediction === 'white_wins';
    const predFavorsLowerRated = (predFavorsWhite && !whiteHigherRated) || (!predFavorsWhite && whiteHigherRated);
    
    if (predFavorsLowerRated) {
      const correctionStrength = Math.min(1.0, eloDiff / 400);
      if (correctionStrength >= 0.5) {
        hybridPrediction = whiteHigherRated ? 'white_wins' : 'black_wins';
        hybridConf = Math.min(hybridConf, 0.55);
      }
    }
  }
  
  // v24.9: 50-100cp DISAGREEMENT SF OVERRIDE (data-driven)
  // Data from 15K games: in 50-100cp zone, when EP disagrees with SF:
  //   EP accuracy: 35.6% (n=90) — worse than random
  //   SF accuracy: ~64% — clearly better
  // Fix: when |eval| is 50-100cp and EP disagrees with SF, defer to SF.
  // This only fires on ~6% of 50-100cp predictions (90/1491).
  if (hasRealEval && Math.abs(sfEvalCp) >= 50 && Math.abs(sfEvalCp) < 100 &&
      hybridPrediction !== sf17Prediction && hybridPrediction !== 'draw' && sf17Prediction !== 'draw') {
    hybridPrediction = sf17Prediction;
    hybridConf = Math.min(hybridConf, 0.55); // Lower confidence — this is a correction
  }
  
  // v24.8: HIGH-INTENSITY CONFIDENCE CAP (data-driven)
  // Data from 5.7K SF18 games:
  //   Agree+int<40 = 79.3%, Agree+int>=40 = 63.6% (-15.7pp)
  //   Disagree+int<40 = 50.3%, Disagree+int>=40 = 33.8% (-16.5pp)
  // High intensity = chaotic position = all signals are noisy.
  // v26.1 tested eval-aware scaling (200+cp→0.61): HURT. Promoted unreliable games to
  // conf 61 with 60.3% accuracy, dragging down conf 60+ by -3.8pp. Reverted.
  // LESSON: High intensity IS a real signal of unreliability regardless of eval zone.
  const signalIntensity = baselineSig?.intensity || 0;
  const epSfAgreeIngest = hybridPrediction === sf17Prediction;
  if (signalIntensity >= 50 && !(hasRealEval && Math.abs(sfEvalCp) >= 500 && tcSpeed !== 'bullet')) {
    // Very high intensity: accuracy ~52-60%. Cap confidence.
    // v26.1: EXCEPT non-bullet 500+cp where accuracy is 81.4% despite high intensity.
    // Previous attempt exempted all 200+cp: HURT. 500+cp non-bullet is the safe subset.
    hybridConf = Math.min(0.55, hybridConf);
  } else if (signalIntensity >= 40 && !epSfAgreeIngest) {
    // High intensity + disagree with SF: accuracy 33.8%. Hard cap.
    hybridConf = Math.min(0.42, hybridConf);
  }
  
  // v26.0: EVAL-GRADUATED CONFIDENCE CAPS (data-driven)
  // Accuracy by eval zone (from 7.5K games):
  //   0-50cp:   48-53% accuracy — dead equal, fundamentally hard
  //   50-100cp: 52-62% accuracy — slight edge, still noisy
  //   100-200cp: 59-65% accuracy — clear advantage but 31.7% reversal rate
  //   200+cp:   69-84% accuracy — decisive, trust the prediction
  // Cap confidence so each zone's conf matches its actual reliability.
  if (hasRealEval) {
    const absEvalCap = Math.abs(sfEvalCp);
    if (absEvalCap < 50) {
      hybridConf = Math.min(0.52, hybridConf);       // ~50% accuracy zone
    } else if (absEvalCap < 200) {
      hybridConf = Math.min(0.55, hybridConf);       // v26.1: 50-200cp all cap at 0.55. Was 0.57 but conf 57 (57.0%) was worse than conf 55 (65.7%) — non-monotonic.
    } else if (absEvalCap < 300) {
      hybridConf = Math.min(0.55, hybridConf);       // v26.1: 200-300cp has 63.6% acc — too low for conf 60. Keep in conf 55.
    } else if (absEvalCap < 400) {
      hybridConf = Math.min(0.60, hybridConf);       // v26.1: 300-400cp has 76.2% acc — appropriate for conf 60, not conf 69.
    }
    // 400+cp: no cap — accuracy is 87%+, conf 69 is appropriate

    // v26.1 Path I: Demote worst conf 55 sub-segments to conf 52.
    // Bullet <200cp: 54.5% acc — coin flip, not conf 55 quality.
    // Late-game (move 35+) <200cp: mixed results (bullet 50%, blitz 70%).
    // Path K tested: bullet-only demotion was neutral. Keep original rule.
    if (absEvalCap >= 50 && absEvalCap < 200) {
      if (tcSpeed === 'bullet' || moveNumber >= 35) {
        hybridConf = Math.min(0.52, hybridConf);
      }
    }
    // v26.1 Path I.5 tested: Blitz move 30+ <300cp → conf 52. HURT (-1.2pp overall).
    // Blitz late-game performs better in live data than analysis suggested. Reverted.
  }

  // v26.1 Path I.2: Demote lower-rated upset predictions.
  // When EP predicts lower-rated player wins + elo gap >= 100: 52.2% acc (n=299).
  // At eval<300cp: 46.3% — below coin flip. These are unreliable upset calls.
  if (eloDiff >= 100 && wEloRev > 0 && bEloRev > 0 && hybridConf >= 0.52 && hybridConf <= 0.55) {
    const epPredictsLowerRated =
      (hybridPrediction === 'white_wins' && !whiteHigherRated) ||
      (hybridPrediction === 'black_wins' && whiteHigherRated);
    if (epPredictsLowerRated) {
      hybridConf = Math.min(0.52, hybridConf);
    }
  }

  // v19.0: PHASE-AWARE CONFIDENCE CAPS (matching predictionEngine.ts)
  // Opening moves are ~47% accuracy — cap confidence so they don't pollute high-conf stats
  if (moveNumber <= 10) {
    hybridConf = Math.min(0.38, hybridConf);
  }
  // v29.6: Tiered deep endgame caps (data from 15K games)
  // m61-65: EP ~55% vs SF ~48% — EP still has slight edge, moderate cap
  // m66+:   EP 52.8% vs SF 57.0% — SF wins, aggressive cap
  if (moveNumber >= 66) {
    hybridConf = Math.min(0.38, hybridConf);
  } else if (moveNumber >= 61) {
    hybridConf = Math.min(0.48, hybridConf);
  }
  // v29.6: 45-50 CONFIDENCE CORRECTION — data shows 30.9% actual (n=327)
  // These predictions are BELOW RANDOM. Force down to 42.
  if (hybridConf >= 0.45 && hybridConf < 0.50) {
    hybridConf = 0.42;
  }
  // v26.1 tested: late middlegame dampener (move 35+ sub-200cp → 0.52). Minimal impact, reverted.
  
  // v26.1 Path L tested: Elo-based prediction FLIP at low eval (<200cp, gap>=200).
  // Flip zone itself: 69.0% acc. But overall neutral (+0.1pp) and conf 60 dropped -2.6pp persistently.
  // Broader version (gap>=100 at 0-50cp): +1.0pp overall but also hurt conf 60 -2.6pp.
  // Reverted — interaction effects with other tiers negate the gains.

  // v26.1 Path H/I.3: ELO-BASED CONFIDENCE BOOST
  // When EP predicts higher-rated player wins AND elo gap >= 200 AND eval >= 200cp.
  // Tested all-eval: conf 60 dropped from 80.8% to 74.0% — 50-200cp HR pred too noisy in live data.
  // 200+cp HR pred + gap>=200: 78.9% — safe for conf 60.
  if (eloDiff >= 200 && wEloRev > 0 && bEloRev > 0 && hybridConf >= 0.52 && hybridConf <= 0.55
      && hasRealEval && Math.abs(sfEvalCp) >= 200) {
    const epPredictsHigherRated = 
      (hybridPrediction === 'white_wins' && whiteHigherRated) ||
      (hybridPrediction === 'black_wins' && !whiteHigherRated);
    if (epPredictsHigherRated) {
      hybridConf = 0.60;
    }
  }
  
  // v29.7 chess.com source-aware caps REMOVED (v35.0):
  // Calibrated on 5K games Feb 2026; now 1.6M chess.com games with live calibration.
  // Stale caps were suppressing EP's natural edge and altering predictions via draw-override.
  // Signal-calibration worker handles all source-aware learning organically now.
  const isChessCom = source === 'chess.com' || source === 'chesscom';
  const isLichessApi = source === 'lichess';
  
  if (isLichessApi) {
    // Lichess API: live/recent games, 54% EP accuracy — lowest source.
    // But EP edge is +3.7pp (best!) — SF is even worse at 50.3%.
    // Cap confidence to reflect low absolute accuracy.
    if (hybridConf >= 0.60) {
      hybridConf = Math.min(0.55, hybridConf);
    }
  }
  
  // Recompute correctness after potential draw override
  const hybridCorrect = hybridPrediction === actualOutcome;

  // ─── ARCHETYPE PARABLE ENGINE: live temporal words + multi-tradition confirmation ───
  // Words built from what ACTUALLY happened; parable arc predicts the outcome.
  // Runs after all confidence signals are applied — parable is the final layer.
  const parableGamePhase = moveNumber < 15 ? 'opening' : moveNumber < 35 ? 'middlegame' : 'endgame';
  const liveParable = generateParableAttribution(
    positionHash,
    fusionArchetype,
    null, // specialMoves — not pre-computed in ingest worker; engine handles gracefully
    parableGamePhase,
    hasRealEval ? sfEvalCp : 0,
    enhancedSig?.pieceTrajectories || null
  );
  // Parabolic confidence modifier — breathes within [0.90, 1.12], No zeros, no negatives
  if (liveParable?.confidence_modifier && liveParable.confidence_modifier !== 1.0) {
    hybridConf = Math.min(0.69, Math.max(0.15, hybridConf * Math.max(0.90, Math.min(1.12, liveParable.confidence_modifier))));
  }
  
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
    // v17.7: Market mapping and temporal dynamics
    // Request: white=sell, black=buy
    color_dynamics: { white: 'sell', black: 'buy' },
    player_likelihood: avgElo ? Math.min(1.0, avgElo / 3000) : 0.5,
    archetype_temporal: enhancedSig?.enhancedProfile?.temporalFlow || 'unknown',
    // v27.1: Multi-position confidence signal data
    multi_position: multiAgreement ? {
      positions: multiAgreement.total + 1, // +1 for primary
      agreeing: multiAgreement.agreeing,
      consistency: multiAgreement.consistency,
      trajectory: multiAgreement.trajectory,
      evals: multiAgreement.evals,
      predictions: multiAgreement.predictions,
    } : null,
    // v27.2/v27.3: Player profile + opening + clock + material signals
    player_signal: playerSignal,
    opening_signal: openingSignal,
    material_signal: materialSignal,
    // v22.3: Persist EP signal data for post-hoc mining
    ep_signals: {
      archetype: baselineSig?.archetype || null,
      dominant_side: baselineSig?.dominantSide || null,
      intensity: baselineSig?.intensity || null,
      flow_direction: baselineSig?.flowDirection || null,
      temporal: baselineSig?.temporalFlow || null,
      quadrant: baselineSig?.quadrantProfile || null,
      prediction_scores: baselinePred ? {
        white: baselinePred.whiteConfidence || null,
        black: baselinePred.blackConfidence || null,
        draw: baselinePred.drawConfidence || null,
        winner: baselinePred.predictedWinner || null,
        conf: baselinePred.confidence || null,
      } : null,
    },
    // v29.9: PARABLE TEMPORAL BRIDGE — chess archetype → biblical parable → musical structure
    // Enriched with live temporal narration + multi-tradition confirmation from Archetype Parable Engine
    parable: (() => {
      const base = findParableResonance(
        enhancedSig?.archetype || baselineSig?.archetype,
        enhancedSig?.enhancedProfile?.temporalFlow || baselineSig?.temporalFlow || { early: 0.33, mid: 0.34, late: 0.33 },
        baselineSig?.intensity || 0.5,
        baselineSig?.flowDirection === 'white_advancing' ? 0.3 : baselineSig?.flowDirection === 'black_advancing' ? -0.3 : 0,
        moveNumber,
        totalMoves
      );
      if (!liveParable) return base;
      // Merge: base provides music/photon/resonance; liveParable adds narration/traditions/outcome
      return {
        ...(base || {}),
        parable: liveParable.parable || base?.parable,
        scripture: liveParable.scripture || base?.scripture,
        verse: liveParable.verse,
        essence: liveParable.essence,
        motif: liveParable.motif,
        narration: liveParable.narration,
        parabolicOutcome: liveParable.parabolicOutcome,
        confluence: liveParable.confluence,
        traditions: liveParable.traditions,
        market_signal: liveParable.market_signal,
        confidence_modifier: liveParable.confidence_modifier,
      };
    })(),
  };
  
  return {
    gameId: extractGameId(game.headers),
    gameName: `${game.headers.White || '?' } vs ${game.headers.Black || '?'}`,
    moveNumber,
    fen,
    positionHash,
    sfEvalCp,
    hasRealEval,
    sf17Prediction,
    sf17Correct: sf17Prediction === actualOutcome,
    // Baseline (4-quadrant) prediction
    baselinePrediction: baselineResult.predictedWinner,
    baselineCorrect: baselineResult.predictedWinner === actualOutcome,
    // Enhanced (32-piece) prediction
    enhancedPrediction: enhancedResult.predictedWinner,
    enhancedCorrect: enhancedResult.predictedWinner === actualOutcome,
    enhancedConfidence: enhancedResult.confidence,
    enhancedArchetype: enhancedSig?.archetype || baselineSig?.archetype || null,
    // Hybrid fusion result
    hybridPrediction,
    hybridCorrect: hybridPrediction === actualOutcome,
    hybridConfidence: hybridConf,
    actualOutcome,
    dataSource: source,
    dataQualityTier: eloTier === 'super_gm' ? 'farm_gm_8quad' : 'farm_bulk_8quad',
    whiteElo: parseInt(h.WhiteElo) || null,
    blackElo: parseInt(h.BlackElo) || null,
    timeControl: h.TimeControl || null,
    pgn: fullPgn.substring(0, 5000),
    // v29.0: Granular tracking columns — resolve to canonical names for cross-platform tracking
    whitePlayer: resolveCanonicalPlayer(h.White, source) || h.White || null,
    blackPlayer: resolveCanonicalPlayer(h.Black, source) || h.Black || null,
    gameType: isEngineGame ? 'CvC' : (source === 'lichess_puzzle' || source === 'chesscom_puzzle') ? 'puzzle' : 'PvP',
    enhDelta,
    // Rich features from enhanced signature
    eightQuadrantProfile: enhancedSig?.enhancedProfile || null,
    pieceTypeMetrics: enhancedSig?.enhancedProfile ? {
      bishopDominance: enhancedSig.enhancedProfile.bishop_dominance,
      knightDominance: enhancedSig.enhancedProfile.knight_dominance,
      rookDominance: enhancedSig.enhancedProfile.rook_dominance,
      queenDominance: enhancedSig.enhancedProfile.queen_dominance,
      pawnAdvancement: enhancedSig.enhancedProfile.pawn_advancement,
    } : null,
    colorRichness: enhancedSig?.colorRichness || 0,
    complexity: enhancedSig?.complexity || 0,
    metadata,
  };
}

// ════════════════════════════════════════════════════════
// v27.2: PLAYER PROFILE ACCUMULATION
// Foundation for player-specific models at scale.
// At 1K+ games per player: style inference becomes reliable.
// At 10K+ games: player-specific prediction adjustments.
// At 100K+ games: individual player models.
// ════════════════════════════════════════════════════════

async function updatePlayerProfiles(attempts) {
  if (!pool || attempts.length === 0) return;
  
  // Aggregate stats per player from this batch
  const playerStats = new Map(); // playerId -> accumulated stats
  
  for (const a of attempts) {
    const white = a.metadata?.white_player;
    const black = a.metadata?.black_player;
    if (!white || !black || white === 'Unknown' || black === 'Unknown') continue;
    
    const source = a.dataSource || 'lichess';
    const outcome = a.actualOutcome;
    const arch = a.enhancedArchetype || 'unknown';
    const tc = a.timeControl || 'unknown';
    const eco = a.metadata?.eco || null;
    
    // White player stats
    const wId = `${source}:${white.toLowerCase()}`;
    if (!playerStats.has(wId)) {
      playerStats.set(wId, {
        id: wId, displayName: white, source,
        games: 0, winsWhite: 0, winsBlack: 0, lossesWhite: 0, lossesBlack: 0, draws: 0,
        elo: a.whiteElo, epCorrect: 0, epTotal: 0, sfCorrect: 0,
        archetypes: {}, timeControls: {}, openings: {},
      });
    }
    const ws = playerStats.get(wId);
    ws.games++;
    ws.epTotal++;
    if (a.hybridCorrect) ws.epCorrect++;
    if (a.sf17Correct) ws.sfCorrect++;
    if (outcome === 'white_wins') ws.winsWhite++;
    else if (outcome === 'black_wins') ws.lossesWhite++;
    else if (outcome === 'draw') ws.draws++;
    ws.archetypes[arch] = (ws.archetypes[arch] || 0) + 1;
    ws.timeControls[tc] = (ws.timeControls[tc] || 0) + 1;
    if (eco) ws.openings[eco] = (ws.openings[eco] || 0) + 1;
    if (a.whiteElo && (!ws.elo || a.whiteElo > ws.elo)) ws.elo = a.whiteElo;
    
    // Black player stats
    const bId = `${source}:${black.toLowerCase()}`;
    if (!playerStats.has(bId)) {
      playerStats.set(bId, {
        id: bId, displayName: black, source,
        games: 0, winsWhite: 0, winsBlack: 0, lossesWhite: 0, lossesBlack: 0, draws: 0,
        elo: a.blackElo, epCorrect: 0, epTotal: 0, sfCorrect: 0,
        archetypes: {}, timeControls: {}, openings: {},
      });
    }
    const bs = playerStats.get(bId);
    bs.games++;
    bs.epTotal++;
    if (a.hybridCorrect) bs.epCorrect++;
    if (a.sf17Correct) bs.sfCorrect++;
    if (outcome === 'black_wins') bs.winsBlack++;
    else if (outcome === 'white_wins') bs.lossesBlack++;
    else if (outcome === 'draw') bs.draws++;
    bs.archetypes[arch] = (bs.archetypes[arch] || 0) + 1;
    bs.timeControls[tc] = (bs.timeControls[tc] || 0) + 1;
    if (eco) bs.openings[eco] = (bs.openings[eco] || 0) + 1;
    if (a.blackElo && (!bs.elo || a.blackElo > bs.elo)) bs.elo = a.blackElo;
  }
  
  if (playerStats.size === 0) return;
  
  // Batch upsert all players — one query per player using ON CONFLICT
  // At scale this should be a multi-row upsert, but for now row-by-row is fine
  // since we have ~500 unique players per batch (250 games × 2 players)
  const upsertSQL = `
    INSERT INTO player_profiles (
      id, display_name, source,
      total_games, wins_as_white, wins_as_black, losses_as_white, losses_as_black, draws,
      latest_elo, peak_elo,
      ep_correct, ep_total, sf_correct,
      archetype_distribution, time_control_distribution, opening_distribution,
      last_seen, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())
    ON CONFLICT (id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, player_profiles.display_name),
      total_games = player_profiles.total_games + EXCLUDED.total_games,
      wins_as_white = player_profiles.wins_as_white + EXCLUDED.wins_as_white,
      wins_as_black = player_profiles.wins_as_black + EXCLUDED.wins_as_black,
      losses_as_white = player_profiles.losses_as_white + EXCLUDED.losses_as_white,
      losses_as_black = player_profiles.losses_as_black + EXCLUDED.losses_as_black,
      draws = player_profiles.draws + EXCLUDED.draws,
      latest_elo = GREATEST(EXCLUDED.latest_elo, player_profiles.latest_elo),
      peak_elo = GREATEST(EXCLUDED.peak_elo, player_profiles.peak_elo),
      ep_correct = player_profiles.ep_correct + EXCLUDED.ep_correct,
      ep_total = player_profiles.ep_total + EXCLUDED.ep_total,
      sf_correct = player_profiles.sf_correct + EXCLUDED.sf_correct,
      archetype_distribution = (
        SELECT jsonb_object_agg(key, COALESCE((player_profiles.archetype_distribution->>key)::int, 0) + COALESCE((EXCLUDED.archetype_distribution->>key)::int, 0))
        FROM jsonb_each_text(player_profiles.archetype_distribution || EXCLUDED.archetype_distribution)
      ),
      time_control_distribution = (
        SELECT jsonb_object_agg(key, COALESCE((player_profiles.time_control_distribution->>key)::int, 0) + COALESCE((EXCLUDED.time_control_distribution->>key)::int, 0))
        FROM jsonb_each_text(player_profiles.time_control_distribution || EXCLUDED.time_control_distribution)
      ),
      opening_distribution = (
        SELECT jsonb_object_agg(key, COALESCE((player_profiles.opening_distribution->>key)::int, 0) + COALESCE((EXCLUDED.opening_distribution->>key)::int, 0))
        FROM jsonb_each_text(player_profiles.opening_distribution || EXCLUDED.opening_distribution)
      ),
      -- v27.3: Compute derived win rates and style on every update
      win_rate_white = CASE WHEN (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.losses_as_white + EXCLUDED.losses_as_white) > 0
        THEN (player_profiles.wins_as_white + EXCLUDED.wins_as_white)::numeric / (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.losses_as_white + EXCLUDED.losses_as_white) ELSE NULL END,
      win_rate_black = CASE WHEN (player_profiles.wins_as_black + EXCLUDED.wins_as_black + player_profiles.losses_as_black + EXCLUDED.losses_as_black) > 0
        THEN (player_profiles.wins_as_black + EXCLUDED.wins_as_black)::numeric / (player_profiles.wins_as_black + EXCLUDED.wins_as_black + player_profiles.losses_as_black + EXCLUDED.losses_as_black) ELSE NULL END,
      draw_rate = CASE WHEN (player_profiles.total_games + EXCLUDED.total_games) > 0
        THEN (player_profiles.draws + EXCLUDED.draws)::numeric / (player_profiles.total_games + EXCLUDED.total_games) ELSE NULL END,
      inferred_style = CASE
        WHEN (player_profiles.total_games + EXCLUDED.total_games) < 50 THEN 'unknown'
        WHEN (player_profiles.draws + EXCLUDED.draws)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) > 0.35 THEN
          CASE WHEN (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.wins_as_black + EXCLUDED.wins_as_black)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) > 0.4 THEN 'positional' ELSE 'solid' END
        WHEN GREATEST(EXCLUDED.latest_elo, player_profiles.latest_elo) > 2600 AND (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.wins_as_black + EXCLUDED.wins_as_black)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) > 0.55 THEN 'universal'
        WHEN (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.wins_as_black + EXCLUDED.wins_as_black)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) > 0.5
          AND (player_profiles.draws + EXCLUDED.draws)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) < 0.2 THEN 'aggressive'
        WHEN (player_profiles.wins_as_white + EXCLUDED.wins_as_white + player_profiles.wins_as_black + EXCLUDED.wins_as_black)::numeric / NULLIF(player_profiles.total_games + EXCLUDED.total_games, 0) > 0.4 THEN 'tactical'
        ELSE 'unknown'
      END,
      style_confidence = CASE
        WHEN (player_profiles.total_games + EXCLUDED.total_games) >= 1000 THEN 0.95
        WHEN (player_profiles.total_games + EXCLUDED.total_games) >= 500 THEN 0.85
        WHEN (player_profiles.total_games + EXCLUDED.total_games) >= 200 THEN 0.70
        WHEN (player_profiles.total_games + EXCLUDED.total_games) >= 100 THEN 0.55
        WHEN (player_profiles.total_games + EXCLUDED.total_games) >= 50 THEN 0.40
        ELSE 0.10
      END,
      last_seen = NOW(),
      updated_at = NOW()
  `;
  
  let upserted = 0;
  for (const [, ps] of playerStats) {
    try {
      await pool.query(upsertSQL, [
        ps.id, ps.displayName, ps.source,
        ps.games, ps.winsWhite, ps.winsBlack, ps.lossesWhite, ps.lossesBlack, ps.draws,
        ps.elo || null,
        ps.epCorrect, ps.epTotal, ps.sfCorrect,
        JSON.stringify(ps.archetypes),
        JSON.stringify(ps.timeControls),
        JSON.stringify(ps.openings),
      ]);
      upserted++;
    } catch (e) {
      // Non-critical — don't let player profile errors block game processing
      if (upserted === 0) console.error(`[${workerId}] Player profile upsert error: ${e.message?.substring(0, 100)}`);
    }
  }
}

// ════════════════════════════════════════════════════════
// BATCH DB WRITER — Full schema matching bulk worker + rich metadata
// ════════════════════════════════════════════════════════

const pendingBatch = [];
let dbSaved = 0, dbDupes = 0, dbFenInvalid = 0;

async function batchInsert(attempts) {
  if (!pool || attempts.length === 0) return;
  
  // v19.1: Filter valid attempts first
  const valid = [];
  for (const a of attempts) {
    if (!a.fen || typeof a.fen !== 'string' || a.fen.length <= 20 || !FEN_REGEX.test(a.fen)) {
      dbFenInvalid++;
      continue;
    }
    if (sessionDedup.has(a.gameId)) {
      dbDupes++;
      continue;
    }
    // Guard: skip rows with no prediction (would violate hybrid_prediction NOT NULL)
    if (!a.hybridPrediction && !a.enhancedPrediction) {
      dbFenInvalid++;
      continue;
    }
    valid.push(a);
  }
  
  if (valid.length === 0) return;
  
  // v19.1: TRUE MULTI-ROW INSERT — 1 round-trip instead of N
  // Process in sub-batches of 50 to keep query size reasonable
  const SUB_BATCH = 50;
  for (let i = 0; i < valid.length; i += SUB_BATCH) {
    const chunk = valid.slice(i, i + SUB_BATCH);
    const COLS = 37;
    const valueClauses = [];
    const params = [];
    
    for (let j = 0; j < chunk.length; j++) {
      const a = chunk[j];
      const offset = j * COLS;
      valueClauses.push(`(${Array.from({length: COLS}, (_, k) => `$${offset + k + 1}`).join(',')})`);
      params.push(
        a.gameId,
        a.gameName,
        Math.round(a.moveNumber || 0),
        a.fen,
        a.positionHash,
        Math.round(Math.max(-9999, Math.min(9999, Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0))),
        a.hasRealEval ? 18 : 0,
        a.sf17Prediction || 'unknown',
        a.hasRealEval ? Math.round(Math.min(95, 50 + Math.abs((Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0) / 100) * 10)) : 0,
        a.sf17Correct ?? false,
        a.hybridPrediction || a.enhancedPrediction || 'unknown',
        // v29.6: Pass through EP's already-capped confidence (EP handles all phase/zone caps)
        Math.round(Math.max(15, Math.min(69, (a.hybridConfidence || a.enhancedConfidence || 0.5) * 100))),
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
        a.enhDelta || 0,
        a.eightQuadrantProfile ? JSON.stringify(a.eightQuadrantProfile) : null,
        a.pieceTypeMetrics ? JSON.stringify(a.pieceTypeMetrics) : null,
        Math.min(9.9999, Math.max(0, Number.isFinite(a.colorRichness) ? a.colorRichness : 0)),
        Math.min(9.9999, Math.max(0, Number.isFinite(a.complexity) ? a.complexity / 100 : 0)),
        a.metadata ? JSON.stringify(a.metadata) : null,
        a.whitePlayer || null,
        a.blackPlayer || null,
        a.gameType || null,
      );
    }
    
    try {
      const result = await resilientQuery(
        `/* db-ingest-v19.1-batch */ INSERT INTO chess_prediction_attempts (
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
          white_player, black_player, game_type
        ) VALUES ${valueClauses.join(',')}
        ON CONFLICT (game_id) DO NOTHING`,
        params
      );
      
      const inserted = result?.rowCount || 0;
      dbSaved += inserted;
      dbDupes += (chunk.length - inserted);
      for (const a of chunk) sessionDedup.add(a.gameId);
    } catch (err) {
      // Fallback: if multi-row fails, try one-by-one
      if (err?.code === '22003' || err?.code === '23502' || err?.code === '42703') {
        console.error(`[${workerId}] Batch INSERT failed (${err.code}), falling back to row-by-row: ${err.message?.substring(0, 200)}`);
        for (const a of chunk) {
          try {
            await resilientQuery(
              `INSERT INTO chess_prediction_attempts (
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
                white_player, black_player, game_type
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37)
              ON CONFLICT (game_id) DO NOTHING`,
              [
                a.gameId, a.gameName, Math.round(a.moveNumber || 0), a.fen, a.positionHash,
                Math.max(-9999, Math.min(9999, Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0)),
                a.hasRealEval ? 18 : 0, a.sf17Prediction || 'unknown',
                a.hasRealEval ? Math.round(Math.min(95, 50 + Math.abs((Number.isFinite(a.sfEvalCp) ? a.sfEvalCp : 0) / 100) * 10)) : 0,
                a.sf17Correct ?? false, a.hybridPrediction || a.enhancedPrediction || 'unknown',
                Math.round(Math.max(15, Math.min(69, (a.hybridConfidence || a.enhancedConfidence || 0.5) * 100))),
                a.enhancedArchetype || 'unknown', a.hybridCorrect ?? a.enhancedCorrect,
                a.enhancedPrediction, a.enhancedCorrect, a.enhancedArchetype || null,
                parseFloat(Math.min(0.69, Math.max(0.15, a.enhancedConfidence || 0.5)).toFixed(2)),
                a.baselinePrediction, a.baselineCorrect, a.actualOutcome,
                a.dataQualityTier || 'farm_bulk_8quad', workerId, a.dataSource || 'unknown',
                a.whiteElo, a.blackElo, a.timeControl, (a.pgn || '').substring(0, 5000),
                a.enhDelta || 0,
                a.eightQuadrantProfile ? JSON.stringify(a.eightQuadrantProfile) : null,
                a.pieceTypeMetrics ? JSON.stringify(a.pieceTypeMetrics) : null,
                Math.min(9.9999, Math.max(0, Number.isFinite(a.colorRichness) ? a.colorRichness : 0)),
                Math.min(9.9999, Math.max(0, Number.isFinite(a.complexity) ? a.complexity / 100 : 0)),
                a.metadata ? JSON.stringify(a.metadata) : null,
                a.whitePlayer || null,
                a.blackPlayer || null,
                a.gameType || null,
              ]
            );
            dbSaved++;
            sessionDedup.add(a.gameId);
          } catch (e2) {
            if (e2?.code === '23505') { dbDupes++; sessionDedup.add(a.gameId); }
            else dbFenInvalid++;
          }
        }
      } else {
        console.error(`[${workerId}] Batch error (${err?.code}): ${err?.message?.substring(0, 200)}`);
      }
    }
  }
  
  // v19.1: Cross-domain correlation — reduced to every 100th saved game (was 20)
  if (dbSaved % 100 < valid.length) {
    const a = valid[0];
    try {
      const enginesAgree = a.baselineCorrect === a.enhancedCorrect;
      const sfAgrees = a.sf17Correct === a.enhancedCorrect;
      const allAgree = enginesAgree && sfAgrees;
      const confLevel = a.hybridConfidence || a.enhancedConfidence || 0.5;
      const posComplexity = Math.min(1, Math.abs((a.sfEvalCp || 0)) / 300);
      const realScore = (
        (confLevel * 0.4) + (allAgree ? 0.25 : enginesAgree ? 0.15 : 0) +
        (a.enhancedCorrect ? 0.25 : 0) + (posComplexity > 0.3 ? 0.10 : 0)
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
          a.metadata?.parable?.motif ? `parable:${a.metadata.parable.motif}-${a.enhancedCorrect ? 'correct' : 'incorrect'}` : (allAgree ? 'consensus-correct' : a.enhancedCorrect ? 'ep-correct' : 'ep-incorrect'),
          a.metadata?.parable?.parable ? `${a.metadata.parable.parable} — ${a.metadata.parable.market_signal || 'chess pattern'}` : (allAgree ? 'All Engines Agree (Correct)' : a.enhancedCorrect ? 'EP Correct' : 'EP Incorrect'),
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

async function flushBatch() {
  if (pendingBatch.length === 0) return;
  const batch = pendingBatch.splice(0);
  const beforeSaved = dbSaved;
  await batchInsert(batch);
  
  // v27.2: Accumulate player profiles (fire-and-forget, non-blocking)
  updatePlayerProfiles(batch).catch(() => {});
  
  // Rate limiting: cooldown between inserts to prevent DB collapse
  if (CONFIG.dbInsertCooldown > 0) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.dbInsertCooldown));
  }
  
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
  let saturated = false;

  // v32: Dupe-spiral detection with SKIP instead of BAIL
  // When we hit dupes, skip deeper into the stream instead of giving up
  // Each Lichess monthly dump has 80-100M games — we've only scratched the surface
  const DUPE_WINDOW = 2000;
  const DUPE_SKIP_RATIO = 0.90; // 90%+ dupes = skip deeper
  const SKIP_AMOUNT = 50000; // Skip 50K games to find fresh territory
  const MAX_SKIPS = 5; // After 5 skips (250K games deep), mark month done
  let windowChecked = 0, windowDupes = 0;
  let skipCount = 0;
  let totalScanned = 0;
  let skipRemaining = 0; // v32: when > 0, skip games without processing

  // Collect games in small batches for dedup checking
  let gameBuffer = [];
  
  try {
    for await (const game of parseStreamingPGN(stream)) {
      if (processed >= CONFIG.maxGamesPerSource) break;
      totalScanned++;
      
      // v32: Skip mode — fast-forward through stream without processing
      if (skipRemaining > 0) {
        skipRemaining--;
        if (skipRemaining === 0) {
          console.log(`[${workerId}] [${source}] ✓ Skip complete, now at depth ~${totalScanned} — resuming processing`);
        }
        continue;
      }
      
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
        
        // v19.1: PARALLEL GAME PROCESSING — process N games concurrently
        const newGames = gameBuffer.filter(g => {
          if (existingIds.has(g.id)) { skipped++; sessionDedup.add(g.id); windowDupes++; return false; }
          return true;
        });
        windowChecked += gameBuffer.length;

        // v32: Dupe-spiral detection with SKIP — don't bail, skip deeper
        if (windowChecked >= DUPE_WINDOW) {
          const ratio = windowDupes / windowChecked;
          if (ratio >= DUPE_SKIP_RATIO) {
            skipCount++;
            if (skipCount >= MAX_SKIPS) {
              console.log(`[${workerId}] [${source}] ⚠ ${skipCount} dupe spirals after scanning ${totalScanned} games — month truly exhausted`);
              saturated = true;
              try { stream.destroy?.(); } catch {}
              break;
            }
            // SKIP deeper into the stream instead of bailing
            console.log(`[${workerId}] [${source}] ⚠ Dupe spiral #${skipCount} (${(ratio*100).toFixed(0)}% dupes) — skipping ${SKIP_AMOUNT} games deeper...`);
            skipRemaining = SKIP_AMOUNT;
            gameBuffer = [];
            windowChecked = 0; windowDupes = 0;
            continue;
          }
          // Reset window for next check
          windowChecked = 0; windowDupes = 0;
        }

        // Process in parallel chunks of CONFIG.parallelGames
        for (let pi = 0; pi < newGames.length; pi += CONFIG.parallelGames) {
          if (processed >= CONFIG.maxGamesPerSource) break;
          
          const chunk = newGames.slice(pi, pi + CONFIG.parallelGames);
          const results = await Promise.allSettled(chunk.map(async (g) => {
            const totalMoves = g.moves.split(/\d+\./).filter(m => m.trim()).length;
            if (totalMoves < 20) return null; // Skip short games
            const moveNumber = selectMoveNumber(totalMoves);
            return processGame(g, moveNumber, epEngine, source);
          }));
          
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value) {
              processed++;
              if (r.value.enhancedCorrect) epCorrect++;
              if (r.value.sf17Correct) sfCorrect++;
              pendingBatch.push(r.value);
            } else if (r.status === 'fulfilled' && r.value === null) {
              skipped++;
            } else {
              errors++;
            }
          }
          
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
        }
        
        gameBuffer = [];
      }
    }
    
    // Process remaining buffer (same parallel pattern)
    if (gameBuffer.length > 0) {
      const ids = gameBuffer.map(g => g.id);
      const existingIds = await checkDuplicateBatch(ids);
      
      const newGames = gameBuffer.filter(g => {
        if (existingIds.has(g.id)) { skipped++; sessionDedup.add(g.id); return false; }
        return true;
      });
      
      for (let pi = 0; pi < newGames.length; pi += CONFIG.parallelGames) {
        if (processed >= CONFIG.maxGamesPerSource) break;
        const chunk = newGames.slice(pi, pi + CONFIG.parallelGames);
        const results = await Promise.allSettled(chunk.map(async (g) => {
          const totalMoves = g.moves.split(/\d+\./).filter(m => m.trim()).length;
          if (totalMoves < 20) return null;
          const moveNumber = selectMoveNumber(totalMoves);
          return processGame(g, moveNumber, epEngine, source);
        }));
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            processed++;
            if (r.value.enhancedCorrect) epCorrect++;
            if (r.value.sf17Correct) sfCorrect++;
            pendingBatch.push(r.value);
          } else if (r.status === 'fulfilled' && r.value === null) {
            skipped++;
          } else {
            errors++;
          }
        }
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
const monthSkipOffsets = {}; // v32: Track how deep into each month we've gone
const STATE_FILE = join(DATA_DIR, `ingest-state-${workerId}.json`);

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (state.completedLichessMonths) state.completedLichessMonths.forEach(m => completedLichessMonths.add(m));
      if (typeof state.lichessMonthIndex === 'number') lichessMonthIndex = state.lichessMonthIndex;
      if (state.monthSkipOffsets) Object.assign(monthSkipOffsets, state.monthSkipOffsets);
      return state;
    }
  } catch {}
  return {};
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      completedLichessMonths: [...completedLichessMonths],
      lichessMonthIndex,
      monthSkipOffsets,
      lastUpdate: new Date().toISOString(),
    }, null, 2));
  } catch {}
}

// v29.9: Build full list of available months and rotate through them
// Each cycle picks the NEXT month in sequence, spreading coverage across all years
function getAllLichessMonths() {
  const months = [];
  let year = CONFIG.lichessStartYear;
  let month = CONFIG.lichessStartMonth;
  while (year > CONFIG.lichessOldestYear || (year === CONFIG.lichessOldestYear && month >= 1)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month--;
    if (month < 1) { month = 12; year--; }
  }
  return months;
}
let lichessMonthIndex = 0; // persisted to disk — survives restarts

async function ingestLichessDB(epEngine) {
  // v32: Alternate between standard and Chess960 databases
  // Chess960/Freestyle is the fastest growing format — EP needs this data
  const use960 = CONFIG.enableChess960 && (lichessMonthIndex % 3 === 0); // Every 3rd cycle = 960
  const dbType = use960 ? 'chess960' : 'standard';
  console.log(`\n[LICHESS-DB] Starting Lichess ${use960 ? '♟️ CHESS960/FREESTYLE' : 'Standard'} Database ingestion...`);
  
  const allMonths = getAllLichessMonths();
  if (allMonths.length === 0) { console.log('[LICHESS-DB] No months configured!'); return 0; }

  // Skip months already completed (404d or fully ingested) — find next valid one
  // Use separate completion tracking for 960 vs standard
  const completionKey = (m) => use960 ? `960-${m}` : m;
  let skipped = 0;
  while (completedLichessMonths.has(completionKey(allMonths[lichessMonthIndex % allMonths.length])) && skipped < allMonths.length) {
    lichessMonthIndex++;
    skipped++;
  }
  if (skipped > 0) console.log(`[LICHESS-DB] Skipped ${skipped} completed months, advancing to next available`);

  const monthStr = allMonths[lichessMonthIndex % allMonths.length];
  lichessMonthIndex++;
  saveState(); // persist index so restart continues from here
  console.log(`[LICHESS-DB] Cycle ${lichessMonthIndex}: month ${monthStr} (${allMonths.length} total, ${completedLichessMonths.size} completed) [${dbType}]`);
  // Standard: lichess_db_standard_rated_YYYY-MM.pgn.zst
  // Chess960: lichess_db_chess960_rated_YYYY-MM.pgn.zst
  const url = use960
    ? `https://database.lichess.org/chess960/lichess_db_chess960_rated_${monthStr}.pgn.zst`
    : `https://database.lichess.org/standard/lichess_db_standard_rated_${monthStr}.pgn.zst`;
  
  console.log(`[LICHESS-DB] Streaming month: ${monthStr}`);
  console.log(`[LICHESS-DB] URL: ${url}`);
  
  try {
    const { stdout } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
    if (stdout.trim() !== '200') {
      console.log(`[LICHESS-DB] Month ${monthStr} [${dbType}] not available (HTTP ${stdout.trim()}) — skipping`);
      completedLichessMonths.add(completionKey(monthStr));
      saveState();
      return 0;
    }
  } catch { return 0; }
  
  const curl = spawn('curl', ['-sL', url]);
  const zstd = spawn('zstdcat', ['-']);
  curl.stdout.pipe(zstd.stdin);
  curl.stderr.on('data', d => { const m = d.toString().trim(); if (m) console.error(`[curl] ${m}`); });
  zstd.stderr.on('data', d => { const m = d.toString().trim(); if (m && !m.includes('Read error')) console.error(`[zstd] ${m}`); });
  
  // v29.9: 45-minute timeout — monthly dumps have 80M+ games each.
  // FICS/CCRL disabled, so Lichess DB is the primary volume source.
  // At ~500 games/min throughput, 45 min = ~22K games per cycle.
  const streamMinutes = CONFIG.lichessStreamMinutes || 45;
  let timedOut = false;
  const streamTimeout = setTimeout(() => {
    timedOut = true;
    console.log(`[LICHESS-DB] Timeout after ${streamMinutes} min on ${monthStr} — killing stream, will resume next cycle`);
    try { curl.kill(); } catch {}
    try { zstd.kill(); } catch {}
  }, streamMinutes * 60 * 1000);
  
  let games = 0, isSaturated = false;
  try {
    const result = await processSourceStream(zstd.stdout, epEngine, use960 ? 'lichess_960' : 'lichess_db');
    games = result.count;
    isSaturated = result.saturated;
  } catch (streamErr) {
    // EPIPE from stream.destroy() during dupe spiral — treat as saturated
    console.log(`[LICHESS-DB] ${monthStr}: stream error (${streamErr.code || streamErr.message}) — treating as saturated`);
    isSaturated = true;
  }
  
  clearTimeout(streamTimeout);
  try { curl.kill(); } catch {}
  try { zstd.kill(); } catch {}
  
  // Self-healing: mark saturated months complete so worker never re-enters a dupe spiral
  if (isSaturated || games === 0) {
    completedLichessMonths.add(completionKey(monthStr));
    saveState();
    console.log(`[LICHESS-DB] ${monthStr} [${dbType}]: saturated — marked complete, auto-advancing to next month`);
  } else {
    console.log(`[LICHESS-DB] ${monthStr} [${dbType}]: ${games} new ${use960 ? 'Chess960/Freestyle' : 'standard'} games ingested${timedOut ? ' (timed out, millions more available)' : ''}`);
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
          
          const { count: games } = await processSourceStream(bzcat.stdout, epEngine, `fics_${year}`);
          try { curl.kill(); } catch {}
          try { bzcat.kill(); } catch {}
          
          if (totalGames >= CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.fics || 1.0)) {
            console.log(`[FICS] Hit weighted max games for ${year} — stopping`);
            break;
          }
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
    // v29.0: Fixed download — use -L to follow redirects, check file size instead of HTTP code
    const urls = [
      'https://rebel13.nl/download/KingBaseLite2019-A00-E99.pgn.zip',
      'https://rebel13.nl/dl/KingBaseLite2019-A00-E99.pgn.zip',
    ];
    for (const url of urls) {
      try {
        const zipPath = join(kbDir, 'kingbase.zip');
        console.log(`[KINGBASE] Downloading from ${url}...`);
        await execAsync(`curl -sL -o '${zipPath}' '${url}'`, { timeout: 300000 });
        if (existsSync(zipPath) && statSync(zipPath).size > 1000000) {
          console.log(`[KINGBASE] Downloaded ${(statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB — extracting...`);
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
    totalGames += (await processSourceStream(stream, epEngine, 'kingbase')).count;
    if (totalGames >= CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.kingbase || 1.0)) break;
  }
  return totalGames;
}

// ════════════════════════════════════════════════════════
// SOURCE 4: CCRL
// ════════════════════════════════════════════════════════

async function ingestCCRL(epEngine) {
  console.log('\n[CCRL] v28.0: CCRL engine-vs-engine games (computerchess.org.uk)...');
  const ccrlDir = join(DATA_DIR, 'ccrl');
  mkdirSync(ccrlDir, { recursive: true });
  
  // v28.0: Per-engine PGN files from computerchess.org.uk (old ccrl.chessdom.com is dead)
  // These are the top engines with the most games — all engine-vs-engine, high quality
  const CCRL_BASE = 'https://www.computerchess.org.uk/ccrl/4040/games-by-engine-commented';
  const engineFiles = [
    'Dragon_by_Komodo_3_3_64-bit_4CPU.commented.[5411].pgn.7z',   // 5411 games
    'Berserk_13_64-bit_4CPU.commented.[4259].pgn.7z',              // 4259 games
    'Integral_v7_64-bit_4CPU.commented.[1901].pgn.7z',             // 1901 games
    'Torch_v4_64-bit_4CPU.commented.[1462].pgn.7z',                // 1462 games
    'Horsie_1_1_64-bit_4CPU.commented.[1390].pgn.7z',              // 1390 games
    'Obsidian_16_0_64-bit_4CPU.commented.[1380].pgn.7z',           // 1380 games
    'Stormphrax_7_0_0_64-bit_4CPU.commented.[1336].pgn.7z',        // 1336 games
    'PlentyChess_7_0_0_64-bit_4CPU.commented.[1230].pgn.7z',       // 1230 games
    'Reckless_0_8_0_64-bit_4CPU.commented.[1226].pgn.7z',          // 1226 games
    'Alexandria_8_1_2_64-bit_4CPU.commented.[1164].pgn.7z',         // 1164 games
    'Caissa_1_23_64-bit_4CPU.commented.[1148].pgn.7z',              // 1148 games
    'Clover_9_1_64-bit_4CPU.commented.[1082].pgn.7z',               // 1082 games
    'Fritz_20_64-bit_4CPU.commented.[1008].pgn.7z',                 // 1008 games
    'Stockfish_18_64-bit_4CPU.commented.[486].pgn.7z',              // 486 games — THE target engine
  ];
  
  let totalGames = 0;
  const maxGames = CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.ccrl || 1.0);
  
  for (const file of engineFiles) {
    if (totalGames >= maxGames) break;
    
    const url = `${CCRL_BASE}/${file.replace(/\[/g, '%5B').replace(/\]/g, '%5D')}`;
    const archivePath = join(ccrlDir, file);
    const pgnName = file.replace('.7z', '');
    const pgnPath = join(ccrlDir, pgnName);
    
    try {
      // Skip if we already have the extracted PGN and it's recent (< 30 days old)
      if (existsSync(pgnPath) && (Date.now() - statSync(pgnPath).mtimeMs) < 30 * 86400000) {
        console.log(`[CCRL] Using cached: ${pgnName}`);
      } else {
        // Check accessibility
        const { stdout } = await execAsync(`curl -sL -o /dev/null -w '%{http_code}' --head '${url}'`, { timeout: 15000 });
        if (stdout.trim() !== '200') { console.log(`[CCRL] ${file} not accessible (${stdout.trim()})`); continue; }
        
        console.log(`[CCRL] Downloading: ${file}...`);
        await execAsync(`curl -sL -o '${archivePath}' '${url}'`, { timeout: 300000 });
        
        if (!existsSync(archivePath) || statSync(archivePath).size < 1000) {
          console.log(`[CCRL] Download too small, skipping`);
          try { unlinkSync(archivePath); } catch {}
          continue;
        }
        
        // Extract .7z → .pgn
        console.log(`[CCRL] Extracting: ${file}...`);
        await execAsync(`7z x -y -o'${ccrlDir}' '${archivePath}'`, { timeout: 120000 });
        try { unlinkSync(archivePath); } catch {}
      }
      
      if (existsSync(pgnPath)) {
        console.log(`[CCRL] Processing: ${pgnName} (${(statSync(pgnPath).size / 1024 / 1024).toFixed(1)} MB)`);
        const stream = createReadStream(pgnPath, { encoding: 'utf-8' });
        const { count: gamesFromFile } = await processSourceStream(stream, epEngine, 'ccrl');
        totalGames += gamesFromFile;
        console.log(`[CCRL] ${pgnName}: ${gamesFromFile} games processed (total: ${totalGames})`);
      }
    } catch (err) { console.log(`[CCRL] Error with ${file}: ${err.message}`); }
  }
  
  console.log(`[CCRL] Total engine-vs-engine games this cycle: ${totalGames}`);
  return totalGames;
}

// ════════════════════════════════════════════════════════
// SOURCE 5: CHESS.COM BULK GAMES
// ════════════════════════════════════════════════════════

async function ingestChessCom(epEngine) {
  console.log('\n[CHESS.COM] Starting Chess.com bulk game ingestion...');
  
  // v29.0: Boosted from 10→25 players per cycle — Chess.com is only 4% of DB
  const playersPerCycle = 25;
  let totalGames = 0;
  
  for (let i = 0; i < playersPerCycle && totalGames < CONFIG.maxGamesPerSource; i++) {
    const player = CHESSCOM_PLAYERS[chesscomPlayerIndex % CHESSCOM_PLAYERS.length];
    chesscomPlayerIndex++;
    const savedBeforePlayer = dbSaved;
    
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
      
      // v29.9: Process last 24 months but early-exit if player is exhausted (all dupes)
      const monthsToProcess = Math.min(24, archives.length);
      let playerGames = 0;
      let consecutiveDryMonths = 0;
      
      for (let m = 0; m < monthsToProcess && playerGames < 5000 && consecutiveDryMonths < 3; m++) {
        const gamesBeforeMonth = playerGames;
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
            if (playerGames >= 5000 || totalGames >= CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.chesscom || 1.0)) break;
            
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
        // v29.9: Early-exit if player is exhausted — skip remaining archives
        if (playerGames === gamesBeforeMonth) {
          consecutiveDryMonths++;
        } else {
          consecutiveDryMonths = 0;
        }
      }
      
      const newForPlayer = dbSaved - savedBeforePlayer;
      if (playerGames > 0 && newForPlayer === 0) {
        // All games were DB dupes — player fully saturated, skip ahead to find fresh players faster
        chesscomPlayerIndex += 5;
        console.log(`[CHESS.COM] ${player}: saturated (0/${playerGames} new) — skipping +5 players`);
      } else {
        console.log(`[CHESS.COM] ${player}: ${playerGames} games processed, ${newForPlayer} new${consecutiveDryMonths >= 3 ? ' (exhausted)' : ''}`);
      }
      
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
// SOURCE 5b: CHESS.COM PUZZLES
// Daily puzzle + random puzzles from Chess.com API.
// Each puzzle has FEN + PGN + solution — tactical positions with known outcomes.
// ════════════════════════════════════════════════════════

async function ingestChessComPuzzles(epEngine) {
  console.log('\n[CC-PUZZLES] Starting Chess.com puzzle ingestion...');
  
  const { simulateGame, extractColorFlowSignature, predictFromColorFlow, extractEnhancedSignature } = epEngine;
  let totalGames = 0;
  const maxPuzzles = 50; // 50 puzzles per cycle (API is one-at-a-time)
  
  for (let i = 0; i < maxPuzzles; i++) {
    try {
      const res = await fetch('https://api.chess.com/pub/puzzle/random', {
        headers: { 'User-Agent': 'EnPensent/1.0 Chess Research (a.arthur.shelton@gmail.com)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      
      const puzzle = await res.json();
      if (!puzzle.fen || !puzzle.pgn) continue;
      
      const gameId = `ccpuz_${puzzle.url?.split('/').pop() || Date.now()}`;
      if (sessionDedup.has(gameId)) continue;
      
      const fen = puzzle.fen;
      const sideToMove = fen.split(' ')[1];
      const solverWins = sideToMove === 'w' ? 'white_wins' : 'black_wins';
      
      try {
        const simulation = simulateGame(puzzle.pgn);
        if (!simulation || !simulation.board) continue;
        
        const board = simulation.board;
        const totalMoves = simulation.totalMoves || 20;
        
        let sfEvalCp = 0;
        try {
          const sfResult = fastPositionalEval(fen);
          sfEvalCp = sfResult?.evaluation || 0;
        } catch {}
        
        let enhancedSig = null, baselineSig = null;
        try { baselineSig = extractColorFlowSignature(board, {}, totalMoves); } catch {}
        if (extractEnhancedSignature) {
          try { enhancedSig = extractEnhancedSignature(simulation); } catch {}
        }
        
        const prediction = predictFromColorFlow(
          baselineSig || enhancedSig,
          enhancedSig,
          sfEvalCp / 100,
          totalMoves,
          null
        );
        
        const sfPrediction = sfEvalCp > 50 ? 'white_wins' : sfEvalCp < -50 ? 'black_wins' : 'draw';
        const epPrediction = prediction?.prediction || sfPrediction; // fallback to SF eval, not 'draw'
        const epIsCorrect = epPrediction === solverWins;
        const sfIsCorrect = sfPrediction === solverWins;
        
        const ccpuzConf = Math.min(0.69, Math.max(0.15, (prediction?.confidence || 50) / 100));
        const attempt = {
          gameId,
          gameName: `CC-Puzzle ${puzzle.title || i}`,
          moveNumber: totalMoves,
          fen,
          positionHash: gameId,
          sfEvalCp,
          hasRealEval: false,
          sf17Prediction: sfPrediction,
          sf17Correct: sfIsCorrect,
          hybridPrediction: epPrediction,
          hybridConfidence: ccpuzConf,
          hybridCorrect: epIsCorrect,
          enhancedPrediction: epPrediction,
          enhancedCorrect: epIsCorrect,
          enhancedArchetype: prediction?.archetype || 'unknown',
          enhancedConfidence: ccpuzConf,
          baselinePrediction: epPrediction,
          baselineCorrect: epIsCorrect,
          actualOutcome: solverWins,
          dataSource: 'chesscom_puzzle',
          dataQualityTier: 'farm_puzzle_8quad',
          whiteElo: null,
          blackElo: null,
          timeControl: 'puzzle',
          pgn: puzzle.pgn,
          whitePlayer: null,
          blackPlayer: null,
          gameType: 'puzzle',
          enhDelta: 0,
        };
        
        pendingBatch.push(attempt);
        totalGames++;
        
        if (pendingBatch.length >= CONFIG.batchSize) await flushBatch();
      } catch {}
      
      // Rate limit: 100ms between requests
      await new Promise(r => setTimeout(r, 100));
    } catch {}
  }
  
  await flushBatch();
  console.log(`[CC-PUZZLES] Cycle complete: ${totalGames} puzzles processed`);
  return totalGames;
}

// ════════════════════════════════════════════════════════
// CHESS.COM TITLED PLAYER DISCOVERY
// Expands the player pool by fetching titled players from Chess.com API.
// Runs once at startup to populate CHESSCOM_PLAYERS with GMs/IMs.
// ════════════════════════════════════════════════════════

async function discoverChessComPlayers() {
  // v35.0: Expanded to GM+IM+FM+NM — NM players have billions of games and are
  // the largest untapped pool on chess.com. High quality: 2200+ FIDE rated.
  const titles = ['GM', 'IM', 'FM', 'NM'];
  const existing = new Set(CHESSCOM_PLAYERS);
  let added = 0;
  
  for (const title of titles) {
    try {
      const res = await fetch(`https://api.chess.com/pub/titled/${title}`, {
        headers: { 'User-Agent': 'EnPensent/1.0 Chess Research (a.arthur.shelton@gmail.com)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      const players = data.players || [];
      
      // v35.0: Raised from 500→1000 per title — NM pool is massive, need higher cap
      const newPlayers = players.filter(p => !existing.has(p)).sort().slice(0, 1000);
      for (const p of newPlayers) {
        CHESSCOM_PLAYERS.push(p);
        existing.add(p);
        added++;
      }
      console.log(`[CC-DISCOVER] ${title}: ${players.length} total, +${newPlayers.length} new`);
    } catch (err) {
      console.log(`[CC-DISCOVER] ${title} failed: ${err.message}`);
    }
  }
  
  console.log(`[CC-DISCOVER] Player pool now: ${CHESSCOM_PLAYERS.length} players (+${added} discovered)`);
}

// ════════════════════════════════════════════════════════
// SOURCE 7: LICHESS API — Recent games from top players
// Uses the public Lichess API (no auth required, 20 req/min limit).
// Games go through the FULL pipeline: SF18 eval + EP engine + all signals.
// This is the primary source for new data since static monthly dumps are exhausted.
// ════════════════════════════════════════════════════════

async function ingestLichessAPI(epEngine) {
  console.log('\n[LICHESS-API] Starting Lichess API game ingestion...');
  
  const playersPerCycle = 12; // Process 12 players per cycle
  let totalGames = 0;
  const maxGames = CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.lichess_db || 1.0);
  
  for (let i = 0; i < playersPerCycle && totalGames < maxGames; i++) {
    const player = LICHESS_API_PLAYERS[lichessApiPlayerIndex % LICHESS_API_PLAYERS.length];
    lichessApiPlayerIndex++;
    
    try {
      // Fetch recent rated games (last 30 days, max 200 per player)
      // Lichess API returns NDJSON by default, but we request PGN format
      const since = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago
      const url = `https://lichess.org/api/games/user/${player}?since=${since}&rated=true&max=500&opening=true`;
      
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/x-ndjson',
          'User-Agent': 'EnPensent/1.0 Chess Research (a.arthur.shelton@gmail.com)',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout per player
      });
      
      if (!res.ok) {
        if (res.status === 429) {
          console.log(`[LICHESS-API] Rate limited — waiting 60s`);
          await new Promise(r => setTimeout(r, 60000));
        } else {
          console.log(`[LICHESS-API] ${player}: HTTP ${res.status}`);
        }
        continue;
      }
      
      const text = await res.text();
      const lines = text.split('\n').filter(l => l.trim());
      let playerGames = 0;
      let skipReasons = { noId: 0, dedup: 0, noPlayers: 0, lowElo: 0, noResult: 0, noMoves: 0, shortGame: 0, processFail: 0, dbDedup: 0 };
      
      for (const line of lines) {
        if (totalGames >= maxGames || playerGames >= 200) break;
        
        let g;
        try { g = JSON.parse(line); } catch { continue; }
        
        // Extract game data
        const gameId = g.id;
        if (!gameId) { skipReasons.noId++; continue; }
        if (sessionDedup.has(gameId)) { skipReasons.dedup++; continue; }
        
        // Need both players and a result
        const white = g.players?.white;
        const black = g.players?.black;
        if (!white?.user?.name || !black?.user?.name) { skipReasons.noPlayers++; continue; }
        
        // Filter by Elo
        const avgElo = ((white.rating || 0) + (black.rating || 0)) / 2;
        if (avgElo > 0 && avgElo < CONFIG.minElo) { skipReasons.lowElo++; continue; }
        
        // Parse result
        const winner = g.winner;
        const status = g.status;
        let result;
        if (winner === 'white') result = '1-0';
        else if (winner === 'black') result = '0-1';
        else if (status === 'draw' || status === 'stalemate') result = '1/2-1/2';
        else { skipReasons.noResult++; continue; } // Skip aborted/ongoing games
        
        // Lichess API returns moves as space-separated string (e.g. "d4 Nf6 c4 g6")
        const rawMoves = g.moves;
        if (!rawMoves || typeof rawMoves !== 'string') { skipReasons.noMoves++; continue; }
        
        // Convert space-separated moves to PGN format with move numbers
        const moveTokens = rawMoves.split(/\s+/).filter(m => m.trim());
        if (moveTokens.length < 20) { skipReasons.shortGame++; continue; } // Skip short games
        
        // Build PGN: "1. d4 Nf6 2. c4 g6 ..."
        let moves = '';
        for (let mi = 0; mi < moveTokens.length; mi++) {
          if (mi % 2 === 0) moves += `${Math.floor(mi / 2) + 1}. `;
          moves += moveTokens[mi] + ' ';
        }
        moves = moves.trim();
        const totalMoves = Math.ceil(moveTokens.length / 2); // full moves
        
        // Parse time control
        const clock = g.clock;
        let timeControl = '';
        if (clock) {
          timeControl = `${clock.initial || 0}+${clock.increment || 0}`;
        }
        
        // Build game object matching processGame expectations — FULL PIPELINE
        const game = {
          id: gameId,
          headers: {
            White: white.user.name,
            Black: black.user.name,
            WhiteElo: String(white.rating || ''),
            BlackElo: String(black.rating || ''),
            Result: result,
            TimeControl: timeControl,
            Event: g.perf || g.speed || 'lichess',
            Site: `https://lichess.org/${gameId}`,
            ECO: g.opening?.eco || '',
            Opening: g.opening?.name || '',
          },
          moves,
          evals: [], // No embedded evals — SF18 will evaluate fresh
        };
        
        const moveNumber = selectMoveNumber(totalMoves);
        
        try {
          // processGame runs the FULL pipeline:
          // 1. SF18 eval at depth 12 (CONFIG.sfDepthFast)
          // 2. EP baseline (4-quadrant color flow)
          // 3. EP 32-piece enhanced signature
          // 4. Hybrid fusion with all 13 signal components
          // 5. Multi-position confidence signal (3 positions)
          // 6. Player profile lookup + style matchup
          // 7. Opening (ECO) predictability signal
          // 8. Clock pressure signal
          // 9. Material-aware confidence signal
          // 10. All post-fusion intelligence gates
          const attempt = await processGame(game, moveNumber, epEngine, 'lichess_api');
          if (!attempt) { skipReasons.processFail++; continue; }

          // Tag with canonical player identity + playing mode from PLAYER_REGISTRY
          const handleMeta = HANDLE_INFO[player.toLowerCase()];
          if (handleMeta && attempt.metadata) {
            attempt.metadata.canonical_player = handleMeta.canonical_name;
            attempt.metadata.playing_mode    = handleMeta.mode;
            attempt.metadata.fide_rating     = handleMeta.fide_rating;
            attempt.metadata.country         = handleMeta.country;
          } else if (handleMeta) {
            attempt.metadata = {
              canonical_player: handleMeta.canonical_name,
              playing_mode:     handleMeta.mode,
              fide_rating:      handleMeta.fide_rating,
              country:          handleMeta.country,
            };
          }

          playerGames++;
          totalGames++;
          pendingBatch.push(attempt);
          
          if (pendingBatch.length >= CONFIG.batchSize) {
            await flushBatch();
            
            if (totalGames % 100 === 0) {
              console.log(`[LICHESS-API] ▸ ${totalGames} games | EP pipeline: SF18 depth ${CONFIG.sfDepthFast} + full EP engine`);
            }
          }
        } catch (e) { skipReasons.processFail++; if (playerGames === 0 && skipReasons.processFail <= 2) console.log(`[LICHESS-API] processGame error: ${e.message}`); }
      }
      
      const skipSummary = Object.entries(skipReasons).filter(([,v]) => v > 0).map(([k,v]) => `${k}=${v}`).join(', ');
      console.log(`[LICHESS-API] ${player}: ${playerGames} new games, ${lines.length} fetched${skipSummary ? ` (skips: ${skipSummary})` : ''}`);
      
      // Lichess API rate limit: 20 req/min = 1 req per 3s
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (err) {
      console.log(`[LICHESS-API] ${player} failed: ${err.message}`);
    }
  }
  
  await flushBatch();
  console.log(`[LICHESS-API] Cycle complete: ${totalGames} games from ${playersPerCycle} players`);
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
  
  const startLine = 2 + Math.floor(Math.random() * Math.max(1, totalLines - CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.lichess_puzzles || 1.0)));
  const batchKey = `${startLine}-${startLine + CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.lichess_puzzles || 1.0)}`;
  
  console.log(`[PUZZLES] Processing from line ${startLine} (of ${totalLines.toLocaleString()} total)`);
  
  // Stream CSV lines using sed + head for the batch window
  let processed = 0, skipped = 0, errors = 0;
  let epCorrect = 0, sfCorrect = 0;
  const startTime = Date.now();
  
  try {
    const { stdout: csvBatch } = await execAsync(
      `sed -n '${startLine},${startLine + CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.lichess_puzzles || 1.0)}p' '${csvPath}'`,
      { timeout: 300000, maxBuffer: 1024 * 1024 * 20 }
    );
    
    const lines = csvBatch.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      if (processed >= CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.lichess_puzzles || 1.0)) break;
      
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
        
        // v19.1: Fast eval for puzzles — SF queue is the bottleneck
        // Puzzle outcome is known (solver wins), SF eval is just a signal input
        let sfEvalCp = 0;
        try {
          const sfResult = fastPositionalEval(fen);
          sfEvalCp = Math.round(sfResult.evaluation * 100);
        } catch { /* use 0 */ }
        
        // Baseline 4-quadrant signature
        try {
          baselineSig = extractColorFlowSignature(board, {}, totalMoves);
        } catch { /* skip */ }
        
        // Full 8-quadrant enhanced extraction — this is the key for puzzles
        // Each piece's unique color traces through its squares reveal the tactical pattern
        // v17.4: Puzzle tactical intelligence - model player likelihood to see tactic
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
        // v17.4: Tactical intelligence - player likelihood and color dynamics
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
          colorRichness: Number(enhancedSig?.colorRichness || 0),
          complexity: Number(enhancedSig?.complexity || 0),
          hasRealEval: true,
          // Store puzzle themes + rating in metadata (→ lesson_learned column)
          // v17.4: Tactical intelligence - player likelihood and market color mapping
          // Request: white=sell, black=buy
          metadata: { 
            puzzleThemes: themes || '', 
            puzzleRating, 
            nbPlays: parseInt(nbPlays) || 0,
            playerLikelihood: Math.min(1.0, (parseInt(nbPlays) || 0) / 10000), // Likelihood player sees tactic
            colorDynamics: { white: 'sell', black: 'buy' }, // Market mapping (FLIPPED per request)
            tacticalComplexity: enhancedSig?.complexity || 0,
            archetypeTemporal: enhancedSig?.enhancedProfile?.temporalFlow || 'unknown'
          },
        };
        
        processed++;
        pendingBatch.push(attempt);
        
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
  
  return { count: processed, saturated: false };
}

// ════════════════════════════════════════════════════════
// SOURCE 2: FISHTTEST — Stockfish Testing Framework
// ════════════════════════════════════════════════════════
// v28.0: Fishtest runs thousands of engine-vs-engine games per test.
// The API exposes finished runs with W/D/L stats and opening book info.
// We fetch finished runs, download the PGN games from workers, and process them.
// Fishtest games are the highest quality engine-vs-engine data available.

const FISHTEST_API = 'https://tests.stockfishchess.org/api';
let fishtestRunIndex = 0;

async function ingestFishtest(epEngine) {
  console.log('\n[FISHTEST] v28.0: Stockfish testing framework engine-vs-engine games...');
  
  let totalGames = 0;
  const maxGames = CONFIG.maxGamesPerSource * (CONFIG.sourceWeights.fishtest || 1.0);
  
  try {
    // Fetch finished runs (most recent first) — each has 40K-800K games
    const runsRes = await fetch(`${FISHTEST_API}/finished_runs?page=1&page_size=20`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!runsRes.ok) { console.log(`[FISHTEST] API error: ${runsRes.status}`); return 0; }
    
    const runs = await runsRes.json();
    const runEntries = Object.entries(runs);
    console.log(`[FISHTEST] Found ${runEntries.length} finished runs`);
    
    // Process runs that have significant game counts and SPRT results
    for (const [runId, run] of runEntries) {
      if (totalGames >= maxGames) break;
      
      const results = run.results || {};
      const totalRunGames = (results.wins || 0) + (results.draws || 0) + (results.losses || 0);
      if (totalRunGames < 10000) continue; // Skip small runs
      
      const args = run.args || {};
      const tc = args.tc || '10+0.1';
      const sprt = args.sprt || {};
      
      // Extract the W/D/L distribution — this IS the engine-vs-engine intelligence
      const winRate = results.wins / totalRunGames;
      const drawRate = results.draws / totalRunGames;
      const lossRate = results.losses / totalRunGames;
      
      console.log(`[FISHTEST] Run ${runId.slice(-8)}: ${totalRunGames} games | TC: ${tc} | W:${(winRate*100).toFixed(1)}% D:${(drawRate*100).toFixed(1)}% L:${(lossRate*100).toFixed(1)}% | SPRT: ${sprt.state || 'unknown'}`);
      
      // Try to get PGN data from the run's pgn endpoint
      try {
        const pgnUrl = `https://tests.stockfishchess.org/api/pgn/${runId}`;
        const pgnRes = await fetch(pgnUrl, {
          headers: { 'Accept': 'application/x-chess-pgn' },
          signal: AbortSignal.timeout(60000),
        });
        
        if (pgnRes.ok && pgnRes.headers.get('content-type')?.includes('pgn')) {
          console.log(`[FISHTEST] Downloading PGN for run ${runId.slice(-8)}...`);
          const fishtestDir = join(DATA_DIR, 'fishtest');
          mkdirSync(fishtestDir, { recursive: true });
          const pgnPath = join(fishtestDir, `${runId}.pgn`);
          
          const pgnText = await pgnRes.text();
          fs.writeFileSync(pgnPath, pgnText);
          
          if (statSync(pgnPath).size > 1000) {
            const stream = createReadStream(pgnPath, { encoding: 'utf-8' });
            const { count: gamesFromRun } = await processSourceStream(stream, epEngine, 'fishtest');
            totalGames += gamesFromRun;
            console.log(`[FISHTEST] Run ${runId.slice(-8)}: ${gamesFromRun} games processed`);
          }
          try { unlinkSync(pgnPath); } catch {}
        } else {
          // PGN endpoint not available — use the statistical distribution instead
          // Store the W/D/L distribution as calibration data for engine game predictions
          console.log(`[FISHTEST] No PGN for ${runId.slice(-8)} — storing W/D/L calibration data`);
          
          // Store Fishtest calibration: engine games at this TC have this W/D/L distribution
          // This helps EP understand that engine games have ~48% draw rate vs human ~30%
          try {
            await resilientQuery(
              `INSERT INTO fishtest_calibration (run_id, time_control, total_games, wins, draws, losses, 
               win_rate, draw_rate, loss_rate, sprt_state, base_tag, new_tag, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
               ON CONFLICT (run_id) DO NOTHING`,
              [runId, tc, totalRunGames, results.wins, results.draws, results.losses,
               winRate, drawRate, lossRate, sprt.state || 'unknown',
               args.base_tag || 'unknown', args.new_tag || 'unknown']
            );
          } catch (dbErr) {
            // Table might not exist yet — that's fine, we'll create it later
            if (dbErr.message.includes('does not exist')) {
              console.log(`[FISHTEST] Creating fishtest_calibration table...`);
              try {
                await resilientQuery(`
                  CREATE TABLE IF NOT EXISTS fishtest_calibration (
                    run_id TEXT PRIMARY KEY,
                    time_control TEXT,
                    total_games INTEGER,
                    wins INTEGER,
                    draws INTEGER,
                    losses INTEGER,
                    win_rate REAL,
                    draw_rate REAL,
                    loss_rate REAL,
                    sprt_state TEXT,
                    base_tag TEXT,
                    new_tag TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                  )
                `);
                // Retry the insert
                await resilientQuery(
                  `INSERT INTO fishtest_calibration (run_id, time_control, total_games, wins, draws, losses,
                   win_rate, draw_rate, loss_rate, sprt_state, base_tag, new_tag, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                   ON CONFLICT (run_id) DO NOTHING`,
                  [runId, tc, totalRunGames, results.wins, results.draws, results.losses,
                   winRate, drawRate, lossRate, sprt.state || 'unknown',
                   args.base_tag || 'unknown', args.new_tag || 'unknown']
                );
              } catch (createErr) { console.log(`[FISHTEST] Table create error: ${createErr.message}`); }
            }
          }
        }
      } catch (pgnErr) {
        console.log(`[FISHTEST] PGN fetch error for ${runId.slice(-8)}: ${pgnErr.message}`);
      }
    }
  } catch (err) {
    console.log(`[FISHTEST] API error: ${err.message}`);
  }
  
  console.log(`[FISHTEST] Total engine-vs-engine games this cycle: ${totalGames}`);
  return totalGames;
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
  console.log(`Sources: Lichess DB | KingBase | CCRL | Chess.com | CC Puzzles | Lichess Puzzles | Fishtest`);
  console.log(`Min ELO: ${CONFIG.minElo}`);
  console.log(`Max games/base/cycle: ${CONFIG.maxGamesPerSource.toLocaleString()} (100M target)`);
  console.log(`Source weights: Lichess ${CONFIG.sourceWeights.lichess_db}x | CCRL ${CONFIG.sourceWeights.ccrl}x | Chess.com ${CONFIG.sourceWeights.chesscom}x | Fishtest ${CONFIG.sourceWeights.fishtest}x`);
  console.log(`SF Depth: ${CONFIG.sfDepth}`);
  console.log(`Dedup: Lightweight batch-check (${CONFIG.dedupBatchSize} IDs/batch)`);
  console.log('─'.repeat(60));
  
  loadState();
  
  // v29.0: Discover Chess.com titled players to expand pool from ~60 to 400+
  await discoverChessComPlayers();
  
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
    
    // v19.1: Prioritize by throughput — Lichess DB first (has embedded evals, no SF wait)
    // then GM sources (Chess.com, KingBase), then engine games, then puzzles last
    if (CONFIG.enableLichessDB) {
      try { totalGames += await ingestLichessDB(epEngine); }
      catch (err) { console.error(`[LICHESS-DB] Fatal: ${err.message}`); }
    }

    // v27.3: Lichess API — fresh games from top players (primary new data source)
    try { totalGames += await ingestLichessAPI(epEngine); }
    catch (err) { console.error(`[LICHESS-API] Fatal: ${err.message}`); }

    if (CONFIG.enableChessCom) {
      try { totalGames += await ingestChessCom(epEngine); }
      catch (err) { console.error(`[CHESS.COM] Fatal: ${err.message}`); }
    }

    if (CONFIG.enableChessComPuzzles) {
      try { totalGames += await ingestChessComPuzzles(epEngine); }
      catch (err) { console.error(`[CC-PUZZLES] Fatal: ${err.message}`); }
    }

    if (CONFIG.enableKingBase) {
      try { totalGames += await ingestKingBase(epEngine); }
      catch (err) { console.error(`[KINGBASE] Fatal: ${err.message}`); }
    }

    if (CONFIG.enableCCRL) {
      try { totalGames += await ingestCCRL(epEngine); }
      catch (err) { console.error(`[CCRL] Fatal: ${err.message}`); }
    }

    if (CONFIG.enableFishtest) {
      try { totalGames += await ingestFishtest(epEngine); }
      catch (err) { console.error(`[FISHTEST] Fatal: ${err.message}`); }
    }
    
    if (CONFIG.enableFICS) {
      try { totalGames += await ingestFICS(epEngine); }
      catch (err) { console.error(`[FICS] Fatal: ${err.message}`); }
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
    
    // v19.1: Faster cycle time — 1min active, 10min idle (was 5/30)
    const sleepMin = totalGames > 0 ? 1 : 10;
    console.log(`Sleeping ${sleepMin} min before next cycle...`);
    await new Promise(r => setTimeout(r, sleepMin * 60 * 1000));
  }
}

main().catch(err => {
  console.error(`[${workerId}] Fatal error:`, err);
  process.exit(1);
});
