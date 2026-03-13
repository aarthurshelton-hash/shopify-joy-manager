#!/usr/bin/env node
/**
 * EP Sandbox Match Runner — Draw-Parity Proof vs SF18
 *
 * GOAL: Perma-draw Stockfish 18 at high depth. Beat it occasionally.
 *
 * Strategy:
 *   - EP+SF hybrid (White) and pure SF (Black) alternate each pair
 *   - DRAW_HUNT mode: actively steer into fortresses, opposite-color bishops,
 *     simplified endgames — exploit SF18's known evaluation weaknesses
 *   - Black NEVER diverges (data shows net-negative vs SF depth advantage)
 *   - White diverges ONLY into SF's ±0.5 blind spot toward drawish positions
 *
 * Output (ALL LOCAL — zero production DB writes):
 *   farm/logs/sandbox/ep-vs-sf-DATETIME.pgn      — full PGN archive
 *   farm/logs/sandbox/results-DATETIME.jsonl      — per-game JSON lines
 *   farm/logs/sandbox/report-DATETIME.txt         — Fishtest-style final report
 *
 * Fishtest SPRT (live):
 *   H0: elo_diff = 0  (EP is equal to SF baseline)
 *   H1: elo_diff = 5  (EP is 5 Elo above parity)
 *   alpha = beta = 0.05  =>  LLR bounds [-2.944, +2.944]
 *
 * Usage:
 *   node ep-sandbox-runner.mjs [options]
 *   --games     N    total games (default 200, must be even)
 *   --ep-depth  D    SF depth for EP hybrid (default 14)
 *   --sf-depth  D    SF depth for pure SF opponent (default 18)
 *   --multi-pv  N    MultiPV candidates (default 6)
 *   --elo0      E    SPRT H0 Elo diff (default 0)
 *   --elo1      E    SPRT H1 Elo diff (default 5)
 *   --no-ep          disable EP flow layer (pure SF vs SF — baseline control)
 */

import dotenv from 'dotenv';
import { Chess } from 'chess.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

// ════════════════════════════════════════════════════════
// CLI CONFIG
// ════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const cfg = {
    games: 200, epDepth: 14, sfDepth: 18, multiPV: 6,
    elo0: 0, elo1: 5, epEnabled: true,
    epTimeMs: 0, sfTimeMs: 0, // 0 = use depth; >0 = movetime in ms
    tag: '',  // subdirectory tag — isolates parallel runs from each other
    chess960: false, // Fischer Random Chess / Chess960 mode
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--games')     cfg.games     = parseInt(args[++i]);
    if (args[i] === '--ep-depth')  cfg.epDepth   = parseInt(args[++i]);
    if (args[i] === '--sf-depth')  cfg.sfDepth   = parseInt(args[++i]);
    if (args[i] === '--multi-pv')  cfg.multiPV   = parseInt(args[++i]);
    if (args[i] === '--elo0')      cfg.elo0      = parseFloat(args[++i]);
    if (args[i] === '--elo1')      cfg.elo1      = parseFloat(args[++i]);
    if (args[i] === '--no-ep')     cfg.epEnabled = false;
    if (args[i] === '--tag')       cfg.tag       = args[++i];
    if (args[i] === '--chess960')  cfg.chess960  = true;
    // Time control (overrides depth when set)
    if (args[i] === '--movetime')  { cfg.epTimeMs = parseInt(args[++i]); cfg.sfTimeMs = cfg.epTimeMs; }
    if (args[i] === '--ep-time')   cfg.epTimeMs  = parseInt(args[++i]);
    if (args[i] === '--sf-time')   cfg.sfTimeMs  = parseInt(args[++i]);
  }
  // Auto-derive tag if not set (guarantees unique subdirs for each config)
  if (!cfg.tag) {
    if (cfg.epTimeMs > 0)    cfg.tag = `mt${Math.round(cfg.epTimeMs/1000)}s`;
    else if (!cfg.epEnabled) cfg.tag = `ctrl-ep${cfg.epDepth}-sf${cfg.sfDepth}`;
    else                     cfg.tag = `ep${cfg.epDepth}-sf${cfg.sfDepth}`;
    if (cfg.chess960)        cfg.tag += '-960';
  }
  if (cfg.games % 2 !== 0) cfg.games++; // enforce even (color balance)
  return cfg;
}

const CFG = parseArgs();

// ════════════════════════════════════════════════════════
// OPENING BOOK — 15 ECO openings for game diversity
// Each game-pair (W then B) shares the same opening.
// ════════════════════════════════════════════════════════

const OPENINGS = [
  { name: 'Ruy_Lopez',           moves: ['e2e4','e7e5','g1f3','b8c6','f1b5'] },
  { name: 'Sicilian_Najdorf',    moves: ['e2e4','c7c5','g1f3','d7d6','d2d4','c5d4','f3d4','g8f6','b1c3','a7a6'] },
  { name: 'Queens_Gambit_Dec',   moves: ['d2d4','d7d5','c2c4','e7e6','b1c3','g8f6','g1f3'] },
  { name: 'Kings_Indian',        moves: ['d2d4','g8f6','c2c4','g7g6','b1c3','f8g7','e2e4','d7d6','g1f3'] },
  { name: 'French_Advance',      moves: ['e2e4','e7e6','d2d4','d7d5','e4e5','c7c5','c2c3'] },
  { name: 'Caro_Kann',           moves: ['e2e4','c7c6','d2d4','d7d5','b1c3','d5e4','c3e4'] },
  { name: 'English_Symmetrical', moves: ['c2c4','c7c5','b1c3','b8c6','g1f3','g8f6'] },
  { name: 'Nimzo_Indian',        moves: ['d2d4','g8f6','c2c4','e7e6','b1c3','f8b4','e2e3'] },
  { name: 'Berlin_Defense',      moves: ['e2e4','e7e5','g1f3','b8c6','f1b5','g8f6','e1g1','f6e4','d2d4','e4d6','f3e5','d6e4','d1e2'] },
  { name: 'Slav_Defense',        moves: ['d2d4','d7d5','c2c4','c7c6','b1c3','g8f6','g1f3','d5c4'] },
  { name: 'Exchange_Slav',       moves: ['d2d4','d7d5','c2c4','c7c6','g1f3','g8f6','c4d5','c6d5','b1c3','b8c6','f1f4'] },
  { name: 'Petroff_Defense',     moves: ['e2e4','e7e5','g1f3','g8f6','f3e5','d7d6','e5f3','f6e4','d2d3','e4f6','d3d4'] },
  { name: 'London_System',       moves: ['d2d4','d7d5','g1f3','g8f6','c1f4','e7e6','e2e3','c7c5'] },
  { name: 'Catalan',             moves: ['d2d4','g8f6','c2c4','e7e6','g2g3','d7d5','f1g2','f8e7','g1f3'] },
  { name: 'Queens_Indian',       moves: ['d2d4','g8f6','c2c4','e7e6','g1f3','b7b6','g2g3','c8b7'] },
];

function pickOpening(gameNum) {
  // Each consecutive pair (odd=W, even=B) plays the same opening.
  const pairIdx = Math.floor((gameNum - 1) / 2);
  return OPENINGS[pairIdx % OPENINGS.length];
}

// ════════════════════════════════════════════════════════
// CHESS960 / FISCHER RANDOM — Scharnagl numbering (SP 0-959)
// EP's color-flow reads live board state — no theory required.
// SF18's NNUE has less calibration in exotic 960 positions,
// widening the neutral-eval blind spot EP exploits.
// ════════════════════════════════════════════════════════

function generateChess960Rank(sp) {
  const p = new Array(8).fill('.');
  p[ [1,3,5,7][sp % 4] ] = 'B';                       // dark-square bishop
  const n1 = Math.floor(sp / 4);
  p[ [0,2,4,6][n1 % 4] ] = 'B';                       // light-square bishop
  const n2 = Math.floor(n1 / 4);
  let empty = p.map((v,i) => v==='.' ? i : -1).filter(i => i>=0);
  p[ empty[n2 % 6] ] = 'Q';                            // queen (6 remaining slots)
  const n3 = Math.floor(n2 / 6);
  const knightPairs = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]];
  empty = p.map((v,i) => v==='.' ? i : -1).filter(i => i>=0);
  const [ki1,ki2] = knightPairs[n3];                   // 10 knight combos (C(5,2))
  p[empty[ki1]] = 'N'; p[empty[ki2]] = 'N';
  empty = p.map((v,i) => v==='.' ? i : -1).filter(i => i>=0); // 3 left: R K R
  p[empty[0]] = 'R'; p[empty[1]] = 'K'; p[empty[2]] = 'R';
  return p;
}

function chess960Fen(sp) {
  const rank    = generateChess960Rank(sp);
  const kingF   = rank.indexOf('K');
  const rookFs  = rank.map((v,i) => v==='R' ? i : -1).filter(i => i>=0);
  const qsRook  = rookFs.find(f => f < kingF);
  const ksRook  = rookFs.find(f => f > kingF);
  // Shredder-FEN castling for Stockfish (UCI_Chess960 understands this)
  const wCastle = (ksRook !== undefined ? String.fromCharCode(65+ksRook) : '')
                + (qsRook !== undefined ? String.fromCharCode(65+qsRook) : '');
  const sfCastling = (wCastle + wCastle.toLowerCase()) || '-';
  const whiteRank  = rank.join('');
  const base       = `${whiteRank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank}`;
  return {
    sfFen:  `${base} w ${sfCastling} - 0 1`,  // for Stockfish (Shredder castling)
    cjsFen: `${base} w - - 0 1`,              // for chess.js (no castling — not supported)
  };
}

function pickChess960(gameNum) {
  // stride=7 is coprime with 960 → visits all 960 unique SPs in 960 pairs (1920 games)
  const pairIdx = Math.floor((gameNum - 1) / 2);
  const sp = (pairIdx * 7) % 960;
  const fens = chess960Fen(sp);
  return { ...fens, name: `Chess960_SP${sp}`, sp };
}

// Chess960 castling: SF18 outputs king-to-rook-square UCI (e.g. e1h1).
// chess.js has no 960 castling rights — manipulate FEN string directly to bypass validation.
function rankStrToArr(s) {
  const a = [];
  for (const c of s) { if (/\d/.test(c)) { for (let i=0;i<+c;i++) a.push('.'); } else a.push(c); }
  return a;
}
function arrToRankStr(a) {
  let s='',e=0;
  for (const c of a) { if(c==='.'){e++;}else{if(e){s+=e;e=0;}s+=c;} }
  if(e) s+=e;
  return s;
}
function applyMoveChess960(chess, uciMove) {
  const from  = uciMove.slice(0, 2);
  const to    = uciMove.slice(2, 4);
  const promo = uciMove[4] || undefined;

  if (CFG.chess960) {
    // Pre-check castling BEFORE chess.move() — chess.js v1.x throws (not null) on illegal
    // moves and may corrupt internal state. Detect castling first to skip chess.move() entirely.
    const piece    = chess.get(from);
    const rookAtTo = chess.get(to);
    if (piece?.type === 'k') {
      const fromFile = from.charCodeAt(0) - 97;
      const toFile   = to.charCodeAt(0) - 97;
      const rank     = from[1];
      const diff     = toFile - fromFile;
      const isCastle = Math.abs(diff) >= 2 || (rookAtTo?.type === 'r' && rookAtTo.color === piece.color);
      if (isCastle) {
        const isKS    = diff > 0;
        const kingDst = isKS ? `g${rank}` : `c${rank}`;
        const rookDst = isKS ? `f${rank}` : `d${rank}`;
        const rookSrc = rookAtTo ? to : (isKS ? `h${rank}` : `a${rank}`);
        try {
          const fenParts = chess.fen().split(' ');
          const rows     = fenParts[0].split('/');
          const ri       = 8 - parseInt(rank);
          const arr      = rankStrToArr(rows[ri]);
          const kCh      = piece.color === 'w' ? 'K' : 'k';
          const rCh      = piece.color === 'w' ? 'R' : 'r';
          arr[fromFile]                   = '.';
          arr[rookSrc.charCodeAt(0) - 97] = '.';
          arr[kingDst.charCodeAt(0) - 97] = kCh;
          arr[rookDst.charCodeAt(0) - 97] = rCh;
          rows[ri]    = arrToRankStr(arr);
          fenParts[0] = rows.join('/');
          fenParts[1] = piece.color === 'w' ? 'b' : 'w';
          fenParts[2] = '-';
          fenParts[3] = '-';
          fenParts[4] = '0';
          if (piece.color === 'b') fenParts[5] = String(parseInt(fenParts[5] || '1') + 1);
          // Return newFen instead of calling chess.load() — chess.load() corrupts
          // subsequent chess.get() calls in chess.js v1.x. Caller rebuilds with new Chess().
          return { san: isKS ? 'O-O' : 'O-O-O', from, to: kingDst, flags: 'k', newFen: fenParts.join(' ') };
        } catch(e) { log(`[960-CASTLE-ERR] ${e.message} move=${uciMove}`); return null; }
      }
    }
  }

  // Non-castling move — use chess.js normally
  try { const r = chess.move({ from, to, promotion: promo }); if (r) return r; } catch {}
  return null;
}

// Draw-hunt tuning — all values informed by ep-chess-engine data
const DRAW = {
  // Phase thresholds
  mirrorUntilMove:      10,   // play SF's top move until move 10
  survivalFromMove:     22,   // enter survival mode earlier (was 28)
  // Divergence gate — conservative: only act where SF is genuinely uncertain
  maxEvalToAct:         0.48, // act only in SF's ±0.48 blind spot
  minEpConf:            0.18, // EP needs meaningful confidence
  minScoreGap:          0.012,// EP pick needs clear edge
  // Scoring weights
  sfEvalWeight:         0.32,
  epFlowWeight:         0.46,
  uncertaintyBonus:     0.14,
  // Draw-hunt bonuses
  oppColorBishopsBonus: 0.40, // #1 fortress weapon — SF notoriously mishandles
  simplifyBonus:        0.14, // per piece pair simplified
  closedPawnBonus:      0.08,
  endgameBonus:         0.22, // drawn endgame zone
  repetitionBonus:      0.20, // MUCH higher — actively seek repetition
  kingSafetyDraw:       0.12,
  pawnSymmetryBonus:    0.12, // symmetrical pawn files → sterile structure
  fortressBonus:        0.30, // K+opp-bishop or K+P only fortresses
  repeatPositionBonus:  0.45, // move leads to already-seen position — MASSIVE
  // Win-hunt gate: SF neutral + EP strong archetype = try to WIN
  winHuntMaxEval:       0.35, // SF eval must be within ±0.35 to win-hunt
  winHuntMinConf:       0.22, // EP confidence must exceed this
};

// Archetypes where live benchmark shows EP massively outperforms SF18
// Source: 11M+ predictions — piece_general_pressure: +16.44pp (SF near-random)
const WIN_ARCHETYPES = new Set([
  'piece_general_pressure',  // EP +16.44pp, SF 46.65% (near random)
  'kingside_attack',         // EP strong, SF misses king danger
  'king_hunt',               // EP +1.71pp but high-confidence signal
  'kingside_knight_charge',  // EP +2.59pp in late middlegame
]);

// Archetypes where EP's draw-hunt is most effective
const DRAW_ARCHETYPES = new Set([
  'piece_balanced_activity', // EP +9.29pp — sterile balance = draw
  'piece_rook_activity',     // EP +3.58pp — rook endgames
  'piece_queen_dominance',   // EP +4.24pp — queen trades → draws
  'positional_squeeze',      // closed positions, hard to convert
  'central_knight_outpost',  // EP +0.90pp — stable knight = fortress
  'queenside_expansion',     // slow, closed — SF loses patience
]);

// ════════════════════════════════════════════════════════
// FILE OUTPUT — all local, never touches Supabase
// ════════════════════════════════════════════════════════

const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
// Each config gets its own subdirectory — parallel runs never share resume state
const OUT_DIR = join(__dirname, '..', 'logs', 'sandbox', CFG.tag);
fs.mkdirSync(OUT_DIR, { recursive: true });

const PGN_FILE    = join(OUT_DIR, `ep-vs-sf-${RUN_ID}.pgn`);
const JSONL_FILE  = join(OUT_DIR, `results-${RUN_ID}.jsonl`);
const REPORT_FILE = join(OUT_DIR, `report-${RUN_ID}.txt`);

function appendPgn(pgn)   { fs.appendFileSync(PGN_FILE,   pgn + '\n\n'); }
function appendJsonl(obj) { fs.appendFileSync(JSONL_FILE, JSON.stringify(obj) + '\n'); }

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ════════════════════════════════════════════════════════
// FISHTEST SPRT MATH
// Reference: cutechess-cli + Fishtest source (Sebastian Kuzminsky, 2019)
// ════════════════════════════════════════════════════════

const LLR_LO = Math.log(0.05 / 0.95); // -2.944 (fail bound)
const LLR_HI = Math.log(0.95 / 0.05); // +2.944 (pass bound)

function eloToScore(eloDiff) {
  return 1.0 / (1.0 + Math.pow(10, -eloDiff / 400));
}

function scoreToElo(score) {
  if (score <= 0 || score >= 1) return score <= 0 ? -999 : 999;
  return -400 * Math.log10(1.0 / score - 1.0);
}

/**
 * Trinomial Bernoulli SPRT (standard Fishtest approximation).
 * Treats each game as a continuous outcome W=1, D=0.5, L=0.
 */
function computeLLR(W, D, L, elo0, elo1) {
  const N = W + D + L;
  if (N < 2) return 0;
  const score = (W + D * 0.5) / N;
  const s0 = eloToScore(elo0);
  const s1 = eloToScore(elo1);
  const clamp = (v) => Math.max(1e-9, Math.min(1 - 1e-9, v));
  const sc = clamp(score), sc0 = clamp(s0), sc1 = clamp(s1);
  return N * (sc * Math.log(sc1 / sc0) + (1 - sc) * Math.log((1 - sc1) / (1 - sc0)));
}

/**
 * 95% confidence interval on Elo estimate via delta method.
 */
function eloCI95(N, score) {
  if (N < 5 || score <= 0 || score >= 1) return Infinity;
  const variance = (score * (1 - score)) / N;
  const dEdS = 400 / (Math.log(10) * score * (1 - score));
  return 1.96 * Math.sqrt(variance) * dEdS;
}

/**
 * Pentanomial score for paired games (fishtest standard).
 * Pairs assumed to be consecutive (game 1+2 = pair 1, etc.).
 * Returns {ll, ld, dd_wl, wd, ww} frequencies.
 */
function buildPentanomial(gameResults) {
  const counts = { ll: 0, ld: 0, dd_wl: 0, wd: 0, ww: 0 };
  for (let i = 0; i + 1 < gameResults.length; i += 2) {
    const a = gameResults[i].score;   // EP as White
    const b = gameResults[i + 1].score; // EP as Black
    const pairScore = a + b; // 0, 0.5, 1, 1.5, 2
    if (pairScore === 0)   counts.ll++;
    else if (pairScore === 0.5) counts.ld++;
    else if (pairScore === 1.0) counts.dd_wl++;
    else if (pairScore === 1.5) counts.wd++;
    else                        counts.ww++;
  }
  return counts;
}

// ════════════════════════════════════════════════════════
// STOCKFISH UCI ENGINE
// ════════════════════════════════════════════════════════

class StockfishEngine {
  constructor(name, depth, multiPV = 1, moveTimeMs = 0) {
    this.name = name;
    this.depth = depth;
    this.multiPV = multiPV;
    this.moveTimeMs = moveTimeMs; // 0 = use depth, >0 = movetime
    this.process = null;
    this.ready = false;
    this._buffer = '';
    this._waitingFor = null;
  }

  _handleData(data) {
    this._buffer += data.toString();
    const lines = this._buffer.split('\n');
    this._buffer = lines.pop();
    for (const raw of lines) {
      const t = raw.trim();
      if (!t) continue;
      const w = this._waitingFor;
      if (!w) continue;
      if (w.type === 'uciok' && t.includes('uciok')) {
        clearTimeout(w.timeout); this._waitingFor = null; w.resolve();
      } else if (w.type === 'readyok' && t.includes('readyok')) {
        clearTimeout(w.timeout); this._waitingFor = null; w.resolve();
      } else if (w.type === 'bestmove') {
        if (t.includes('multipv') && t.includes('score')) {
          const pvM  = t.match(/multipv (\d+)/);
          const cpM  = t.match(/score cp (-?\d+)/);
          const matM = t.match(/score mate (-?\d+)/);
          const movM = t.match(/ pv (.+)/);
          const depM = t.match(/depth (\d+)/);
          if (pvM && movM) {
            const pvNum = parseInt(pvM[1]);
            let evalCp = cpM ? parseInt(cpM[1]) : 0;
            if (matM) evalCp = parseInt(matM[1]) > 0 ? 10000 : -10000;
            const pv = movM[1].trim().split(' ');
            w.lines[pvNum - 1] = { pvNum, eval: evalCp / 100, move: pv[0], pv, depth: depM ? parseInt(depM[1]) : 0 };
          }
          // Parse SF18 WDL output (win/draw/loss out of 1000)
          const wdlM = t.match(/wdl (\d+) (\d+) (\d+)/);
          if (wdlM) w.lastWdl = { win: parseInt(wdlM[1]), draw: parseInt(wdlM[2]), loss: parseInt(wdlM[3]) };
        }
        if (t.startsWith('bestmove')) {
          const bestMove = t.split(' ')[1] || null;
          clearTimeout(w.timeout);
          const wdl = w.lastWdl || null;
          this._waitingFor = null;
          w.resolve({ bestMove, eval: w.lines[0]?.eval || 0, lines: w.lines.filter(Boolean), wdl });
        }
      }
    }
  }

  _waitFor(type, ms = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this._waitingFor?.type === type) { this._waitingFor = null; reject(new Error(`${this.name}: ${type} timeout`)); }
      }, ms);
      this._waitingFor = { type, resolve, reject, timeout, lines: [], lastWdl: null };
    });
  }

  async init() {
    if (this.process) {
      try { this.process.stdin.write('quit\n'); this.process.kill(); } catch { /* already dead */ }
      this.process = null; this.ready = false; this._waitingFor = null; this._buffer = '';
      await new Promise(r => setTimeout(r, 400));
    }
    this.process = spawn('stockfish', [], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.process.on('error', (e) => { console.error(`[${this.name}] ${e.message}`); this.ready = false; this.process = null; });
    this.process.on('close', () => { this.ready = false; this.process = null; });
    this.process.stdout.on('data', (d) => this._handleData(d));
    this.process.stdin.write('uci\n');
    await this._waitFor('uciok', 45000);
    this.ready = true;
    if (this.multiPV > 1) this.process.stdin.write(`setoption name MultiPV value ${this.multiPV}\n`);
    // SF18: full NNUE strength + WDL output for draw detection
    this.process.stdin.write('setoption name UCI_ShowWDL value true\n');
    if (CFG.chess960) this.process.stdin.write('setoption name UCI_Chess960 value true\n');
    this.process.stdin.write('setoption name UCI_AnalyseMode value false\n');
    this.process.stdin.write('isready\n');
    await this._waitFor('readyok', 15000);
    const tcLabel = this.moveTimeMs > 0 ? `movetime=${this.moveTimeMs}ms` : `depth=${this.depth}`;
    log(`[${this.name}] ✓ ready  ${tcLabel}  multiPV=${this.multiPV}`);
  }

  async newGame() {
    if (!this.ready || !this.process) { await this.init(); return; }
    try {
      this.process.stdin.write('ucinewgame\n');
      this.process.stdin.write('isready\n');
      await this._waitFor('readyok', 5000);
    } catch { await this.init(); }
  }

  // startFen + uciMoves: Chess960 mode — always send full position history so SF retains castling rights
  async getMove(fen, startFen = null, uciMoves = null) {
    if (!this.ready || !this.process) await this.init();
    try {
      if (startFen !== null) {
        const movePart = uciMoves?.length ? ` moves ${uciMoves.join(' ')}` : '';
        this.process.stdin.write(`position fen ${startFen}${movePart}\n`);
      } else {
        this.process.stdin.write(`position fen ${fen}\n`);
      }
      const goCmd = this.moveTimeMs > 0
        ? `go movetime ${this.moveTimeMs}\n`
        : `go depth ${this.depth}\n`;
      this.process.stdin.write(goCmd);
      const result = await this._waitFor('bestmove', 60000);
      // Normalize eval to white's perspective
      if ((fen.split(' ')[1] || 'w') === 'b') {
        result.eval = -(result.eval || 0);
        (result.lines || []).forEach(l => { if (l) l.eval = -l.eval; });
      }
      return result;
    } catch (e) {
      console.error(`[${this.name}] getMove error: ${e.message}`);
      try { await this.init(); } catch { /* ignore */ }
      return { bestMove: null, eval: 0, lines: [] };
    }
  }

  destroy() {
    if (this.process) { try { this.process.stdin.write('quit\n'); this.process.kill(); } catch { /* ignore */ } this.process = null; this.ready = false; }
  }
}

// ════════════════════════════════════════════════════════
// EP ENGINE LOADER  (from compiled farm/dist)
// ════════════════════════════════════════════════════════

async function loadEPEngine() {
  const distPath = join(__dirname, '..', 'dist', 'lib', 'chess');
  try {
    const colorFlowModule = await import(join(distPath, 'colorFlowAnalysis', 'index.js'));
    const gameSimModule   = await import(join(distPath, 'gameSimulator.js'));

    // Equilibrium predictor — gives per-position drawConfidence (0-100)
    // Trained on 1.25M predictions, calibrated per archetype + phase
    let calculateEquilibriumScoresFn = null;
    try {
      const eqModule = await import(join(distPath, 'colorFlowAnalysis', 'equilibriumPredictor.js'));
      calculateEquilibriumScoresFn = eqModule.calculateEquilibriumScores;
      log('[EP] ✓ Equilibrium predictor loaded — draw confidence active');
    } catch { log('[EP] Equilibrium predictor unavailable — using flow-only draw signal'); }

    let piece32Module = null;
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      piece32Module = require(join(distPath, 'colorFlowAnalysis', 'pieceColorFlow32.js'));
      log('[EP] ✓ 32-piece flow module loaded');
    } catch { log('[EP] 32-piece module unavailable — using 4Q baseline'); }

    log('[EP] ✓ Color-flow engine loaded');
    return {
      extractColorFlowSignature:  colorFlowModule.extractColorFlowSignature,
      predictFromColorFlow:       colorFlowModule.predictFromColorFlow,
      simulateGame:               gameSimModule.simulateGame,
      calculateEquilibriumScores: calculateEquilibriumScoresFn,
      extract32PieceSignature:    piece32Module?.extract32PieceSignature || null,
      predictFrom32Piece:         piece32Module?.predictFrom32PieceSignature || null,
    };
  } catch (e) {
    log(`[EP] ⚠ Engine not available (${e.message.substring(0, 60)})`);
    log('[EP] Falling back to pure-SF mode (baseline control run)');
    return null;
  }
}

// ════════════════════════════════════════════════════════
// POSITION ANALYSIS
// ════════════════════════════════════════════════════════

function analyzePosition(fen) {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const pieceVals = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let wPieces = 0, bPieces = 0, totalPawns = 0;
  let wBL = 0, wBD = 0, bBL = 0, bBD = 0;
  let wMat = 0, bMat = 0;

  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const c of rows[rank]) {
      if (c >= '1' && c <= '8') { file += parseInt(c); continue; }
      const val = pieceVals[c.toLowerCase()] || 0;
      const isLight = (rank + file) % 2 === 0;
      if (c === c.toUpperCase()) {
        wPieces++; wMat += val;
        if (c === 'B') isLight ? wBL++ : wBD++;
      } else {
        bPieces++; bMat += val;
        if (c === 'b') isLight ? bBL++ : bBD++;
      }
      if (c.toLowerCase() === 'p') totalPawns++;
      file++;
    }
  }

  const oppColorBishops =
    (wBL > 0 && bBD > 0 && wBD === 0 && bBL === 0) ||
    (wBD > 0 && bBL > 0 && wBL === 0 && bBD === 0);

  // Pawn symmetry — identical pawn file distribution → sterile drawn structure
  const wPawnFiles = new Array(8).fill(0);
  const bPawnFiles = new Array(8).fill(0);
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const c of rows[rank]) {
      if (c >= '1' && c <= '8') { file += parseInt(c); continue; }
      if (c === 'P') wPawnFiles[file]++;
      if (c === 'p') bPawnFiles[file]++;
      file++;
    }
  }
  const pawnSymmetry = wPawnFiles.every((v, i) => v === bPawnFiles[i]);

  const totalMat = wMat + bMat;
  // Fortress: opp-color bishops only, or pure king+pawn endgame
  const onlyBishopsLeft = (wPieces + bPieces - totalPawns) === 2; // just 2 bishops remain
  const fortressZone = (oppColorBishops && onlyBishopsLeft) ||
                       (totalMat < 10 && totalPawns > 0 && wPieces <= 2 && bPieces <= 2);

  return {
    pawnDensity:      totalPawns / 16,
    oppColorBishops,
    pawnSymmetry,
    fortressZone,
    simplified:       totalMat < 20,
    verySimplified:   totalMat < 12,
    drawnEndgame:     totalMat < 18 && totalPawns < 6,
    totalMaterial:    totalMat,
    materialDiff:     Math.abs(wMat - bMat),
    wMat, bMat,
    totalPieces:      wPieces + bPieces,
  };
}

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// ════════════════════════════════════════════════════════
// EP FLOW EVALUATOR
// ════════════════════════════════════════════════════════

// sfEval: normalized to white's perspective (passed from getMove result)
function evaluateFlowForMove(chess, candidateMove, moveHistory, epEngine, moveNumber, sfEval = 0) {
  if (!epEngine) return null;
  const { extractColorFlowSignature, predictFromColorFlow, calculateEquilibriumScores,
          extract32PieceSignature, predictFrom32Piece } = epEngine;

  const testChess = new Chess(chess.fen());
  let moveResult;
  try { moveResult = testChess.move(candidateMove, { sloppy: true }); } catch {}
  if (!moveResult) return null; // chess.js v1.x throws on illegal moves (e.g. Chess960 castling)

  const fullMoves = [...moveHistory, moveResult.san];
  const pgnBody = fullMoves.map((m, i) =>
    i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${m}` : m
  ).join(' ');
  const fullPgn = `[White "EP"]\n[Black "SF"]\n\n${pgnBody}`;

  try {
    const sim    = epEngine.simulateGame(fullPgn);
    const board  = sim.board;
    const total  = sim.totalMoves || moveNumber;
    const gameData = { white: 'EP', black: 'SF', pgn: fullPgn };

    const baseSig = extractColorFlowSignature(board, gameData, total);

    // Pass SF eval + depth for proper agreement-calibration in predictionEngine
    const basePred = predictFromColorFlow(baseSig, total, sfEval, CFG.epDepth);

    let prediction    = basePred.predictedWinner;
    let confidence    = basePred.confidence / 100;
    let archetype     = baseSig.archetype || 'unknown';
    let drawConfidence = 50; // default

    // Get equilibrium draw confidence (0-100) — trained on 1.25M games
    if (calculateEquilibriumScores) {
      try {
        const eq = calculateEquilibriumScores(baseSig, sfEval, CFG.epDepth, moveNumber);
        drawConfidence = eq.drawConfidence || 50;
      } catch { /* use default */ }
    }

    // 32-piece enhanced if available
    if (extract32PieceSignature && predictFrom32Piece) {
      try {
        const sig32 = extract32PieceSignature(fullPgn, moveNumber);
        if (sig32) {
          const p32 = predictFrom32Piece(sig32, 0, moveNumber);
          if (p32) { prediction = p32.predictedWinner; confidence = p32.confidence; archetype = sig32.archetype || archetype; }
        }
      } catch { /* use baseline */ }
    }

    return { move: candidateMove, san: moveResult.san, fen: testChess.fen(),
             epPrediction: prediction, epConfidence: confidence, archetype, drawConfidence };
  } catch { return null; }
}

// ════════════════════════════════════════════════════════
// DRAW-HUNT MOVE SELECTOR
// ════════════════════════════════════════════════════════

// sfWdl: { win, draw, loss } /1000 from the current position's SF18 WDL
// seenFens: Set of board-FEN prefixes already seen this game (for repetition detection)
function selectBestMove(sfLines, epEvals, wePlayWhite, moveNumber, chess, moveHistory, sfWdl = null, seenFens = null) {
  if (!sfLines.length) return { move: 'e2e4', reason: 'no_candidates' };

  const posAnalysis = analyzePosition(chess.fen());
  const sfBestEval  = sfLines[0]?.eval || 0;
  const ourEval     = wePlayWhite ? sfBestEval : -sfBestEval;
  const absEvalBest = Math.abs(sfBestEval);
  const losing      = ourEval < -0.5;
  const desperate   = ourEval < -2.0;

  // ── PHASE 1: Mirror SF in opening (skip entirely in Chess960 — no theory, hunt from move 1) ──
  const effectiveMirrorUntil = CFG.chess960 ? 0 : DRAW.mirrorUntilMove;
  if (moveNumber < effectiveMirrorUntil) {
    if (sfLines.length <= 1 || moveNumber < 4) {
      return { move: sfLines[0].move, sfEval: sfLines[0].eval, epPrediction: 'mirror', epConfidence: 0,
               combinedScore: 1.0, epOverride: false, sfBestMove: sfLines[0].move, sfBestEval: sfLines[0].eval,
               archetype: 'sf_mirror', divergeReason: 'mirror', candidates: [] };
    }
    const bestEval = sfLines[0].eval;
    const viable = sfLines.filter(l => Math.abs(l.eval - bestEval) < 0.25).slice(0, 3);
    const picked = viable[Math.floor(Math.random() * viable.length)];
    return { move: picked.move, sfEval: picked.eval, epPrediction: 'mirror_var', epConfidence: 0,
             combinedScore: 1.0, epOverride: picked.move !== sfLines[0].move,
             sfBestMove: sfLines[0].move, sfBestEval: sfLines[0].eval,
             archetype: 'sf_mirror', divergeReason: 'mirror_opening', candidates: [] };
  }

  const candidates = [];

  // Draw confidence multiplier: when EP's equilibrium predictor sees a drawn position,
  // amplify all draw-hunt bonuses. When SF WDL draw > 600/1000, double down.
  const epDrawConf   = epEvals.find(e => e)?.drawConfidence || 50;
  const wdlDrawProb  = sfWdl ? sfWdl.draw / 1000 : 0.5;
  const drawMultiplier =
    (epDrawConf > 65 || wdlDrawProb > 0.65) ? 2.0 :
    (epDrawConf > 50 || wdlDrawProb > 0.50) ? 1.4 : 1.0;

  for (const sfLine of sfLines) {
    const epEval = epEvals.find(e => e && e.move === sfLine.move);

    // SF score (from our side)
    const sfScore = wePlayWhite ? sigmoid(sfLine.eval * 2) : sigmoid(-sfLine.eval * 2);

    // EP score — uses equilibrium draw confidence when available
    let epScore = 0.5;
    if (epEval) {
      const ourSide   = wePlayWhite ? 'white' : 'black';
      const theirSide = wePlayWhite ? 'black' : 'white';
      if (epEval.epPrediction === ourSide)        epScore = 0.5 + epEval.epConfidence * 0.5;
      else if (epEval.epPrediction === theirSide) epScore = 0.5 - epEval.epConfidence * 0.5;
      else {
        // Draw prediction — weight by draw confidence
        const drawConf = (epEval.drawConfidence || 50) / 100;
        epScore = losing ? 0.50 + drawConf * 0.20 : 0.50 + drawConf * 0.08;
      }
    }

    // Uncertainty bonus (SF's ±0.5 blind spot)
    const absEval = Math.abs(sfLine.eval);
    const uncertaintyBonus =
      absEval < 0.2 ? DRAW.uncertaintyBonus * 1.0 :
      absEval < 0.5 ? DRAW.uncertaintyBonus * 0.7 :
      absEval < 1.0 ? DRAW.uncertaintyBonus * 0.3 : 0;

    // ── DRAW-HUNT bonuses ──
    let drawBonus = 0;
    const resultPos = epEval?.fen ? analyzePosition(epEval.fen) : null;

    // All draw bonuses scaled by drawMultiplier (EP equilibrium + SF WDL signal)

    // Opposite-color bishops → fortress machine
    if (resultPos?.oppColorBishops)
      drawBonus += DRAW.oppColorBishopsBonus * drawMultiplier;

    // Simplification (trade pieces toward drawish endgame)
    if (resultPos) {
      const piecesTraded = posAnalysis.totalPieces - resultPos.totalPieces;
      if (piecesTraded > 0) drawBonus += piecesTraded * DRAW.simplifyBonus * drawMultiplier;
      if (resultPos.drawnEndgame && !posAnalysis.drawnEndgame) drawBonus += DRAW.endgameBonus * drawMultiplier;
      if (resultPos.verySimplified && !posAnalysis.verySimplified) drawBonus += DRAW.endgameBonus * 0.5 * drawMultiplier;
    }

    // Closed pawn structure (harder to convert for SF)
    if (resultPos && resultPos.pawnDensity > posAnalysis.pawnDensity)
      drawBonus += DRAW.closedPawnBonus * drawMultiplier;

    // Repetition seeking (short PV = likely repeat or forced)
    if (sfLine.pv && sfLine.pv.length <= 3 && moveNumber > 20)
      drawBonus += DRAW.repetitionBonus * drawMultiplier;

    // King safety equalizer (EP detects equal king safety → sterile position)
    if (epEval && Math.abs(epEval.epConfidence) < 0.15 && absEval < 0.3)
      drawBonus += DRAW.kingSafetyDraw * drawMultiplier;

    // WDL draw signal bonus: when SF itself says draw > 50%, embrace it
    if (wdlDrawProb > 0.50 && absEval < 0.5)
      drawBonus += 0.10 * (wdlDrawProb - 0.50) * 10; // up to +0.10 at WDL draw = 1.0

    // Pawn symmetry → sterile drawn structure bonus
    if (resultPos?.pawnSymmetry && posAnalysis.pawnSymmetry)
      drawBonus += DRAW.pawnSymmetryBonus * drawMultiplier;

    // Fortress zone — opp-color bishops or pure K+P endgame
    if (resultPos?.fortressZone)
      drawBonus += DRAW.fortressBonus * drawMultiplier;

    // ── ARCHETYPE-AWARE DRAW BONUS ──
    // When moving INTO a known EP draw-strong archetype position, boost heavily
    const moveArchetype = epEval?.archetype || 'unknown';
    if (DRAW_ARCHETYPES.has(moveArchetype))
      drawBonus += 0.15 * drawMultiplier;

    // ── POSITION REPETITION BONUS ──
    // If this move leads back to a position we've already seen → huge bonus (force draw by repetition)
    if (seenFens && moveNumber > 15) {
      try {
        const testChess = new Chess(chess.fen());
        testChess.move({ from: sfLine.move.slice(0,2), to: sfLine.move.slice(2,4), promotion: sfLine.move[4] });
        const testBoard = testChess.fen().split(' ')[0];
        if (seenFens.has(testBoard)) drawBonus += DRAW.repeatPositionBonus;
      } catch {}
    }

    // Survival mode (aggressive draw-seeking)
    const inSurvival = moveNumber >= DRAW.survivalFromMove;
    if (inSurvival && losing) drawBonus += DRAW.simplifyBonus * 2 * drawMultiplier;

    // Combined score
    const combinedScore =
      DRAW.sfEvalWeight * sfScore +
      DRAW.epFlowWeight * epScore +
      uncertaintyBonus +
      drawBonus;

    candidates.push({
      move: sfLine.move,
      san: epEval?.san || sfLine.move,
      sfEval: sfLine.eval,
      sfScore,
      epPrediction: epEval?.epPrediction || '?',
      epConfidence: epEval?.epConfidence || 0,
      epScore,
      uncertaintyBonus,
      drawBonus,
      combinedScore,
      archetype: epEval?.archetype || 'unknown',
    });
  }

  candidates.sort((a, b) => b.combinedScore - a.combinedScore);

  const epPick   = candidates[0];
  const sfBest   = sfLines[0];
  const sfScored = candidates.find(c => c.move === sfBest.move) || epPick;

  // ── DIVERGENCE DECISION (White only, never Black) ──
  const inBlindSpot = absEvalBest < DRAW.maxEvalToAct;
  const epScoreGap  = epPick.combinedScore - sfScored.combinedScore;
  const isBlack     = !wePlayWhite;
  const survivalMode = moveNumber >= DRAW.survivalFromMove;

  let shouldDiverge = false;
  let divergeReason = 'mirror';

  const ourColor = wePlayWhite ? 'white' : 'black';
  const sfNeutral = absEvalBest < DRAW.winHuntMaxEval;
  const inWinArch = WIN_ARCHETYPES.has(epPick.archetype);
  const inDrawArch = DRAW_ARCHETYPES.has(epPick.archetype);

  if (isBlack) {
    // Black diverges ONLY toward structural draws in EP's proven draw-strong archetypes
    // when position is near-equal — exploiting SF18's weakness in these structures
    const nearEqual = absEvalBest < 0.40;
    const strongDrawSignal = epPick.drawBonus > 0.14;
    if (nearEqual && (inDrawArch || strongDrawSignal) && epScoreGap >= DRAW.minScoreGap && !desperate) {
      shouldDiverge = true;
      divergeReason = `B_draw_arch: arch=${epPick.archetype} bonus=${epPick.drawBonus?.toFixed(3)} eval=${sfBest.eval.toFixed(2)}`;
    }
  } else if (epPick.move !== sfBest.move) {
    // ── WIN HUNT: SF neutral + EP in win-strong archetype + EP predicts our color ──
    // This is the "1-in-1000" case: SF sees ±0.0 but EP's color flow says we're winning
    if (sfNeutral && inWinArch && !desperate &&
        epPick.epPrediction === ourColor &&
        epPick.epConfidence >= DRAW.winHuntMinConf) {
      shouldDiverge = true;
      divergeReason = `WIN_HUNT: arch=${epPick.archetype} SF=${sfBest.eval.toFixed(2)} ep_conf=${(epPick.epConfidence*100).toFixed(0)}%`;
    // ── DRAW HUNT: normal blind-spot diverge or draw-archetype ──
    } else if ((inBlindSpot || inDrawArch) && !desperate &&
        epPick.epConfidence >= DRAW.minEpConf &&
        epScoreGap >= DRAW.minScoreGap &&
        !survivalMode) {
      shouldDiverge = true;
      divergeReason = `W_draw: eval=${sfBest.eval.toFixed(2)} arch=${epPick.archetype} gap=${epScoreGap.toFixed(3)}`;
    } else if (survivalMode && epPick.drawBonus > 0.10) {
      shouldDiverge = true;
      divergeReason = `survival_draw: drawBonus=${epPick.drawBonus?.toFixed(3)}`;
    }
  }

  const finalMove = shouldDiverge ? epPick : sfScored;

  return {
    move: finalMove.move,
    san: finalMove.san,
    sfEval: finalMove.sfEval,
    epPrediction: finalMove.epPrediction,
    epConfidence: finalMove.epConfidence,
    combinedScore: finalMove.combinedScore,
    epOverride: shouldDiverge,
    sfBestMove: sfBest.move,
    sfBestEval: sfBest.eval,
    archetype: finalMove.archetype,
    divergeReason,
    candidates: candidates.slice(0, 3),
  };
}

// ════════════════════════════════════════════════════════
// GAME LOOP
// ════════════════════════════════════════════════════════

async function playSingleGame(epSf, opponentSf, epEngine, gameNum, wePlayWhite) {
  await epSf.newGame();
  await opponentSf.newGame();

  let chess        = new Chess();
  const moveHistory = [];
  const gameLog     = [];
  const seenFens    = new Set(); // board-FEN prefixes seen this game — for repetition detection
  let epOverrides  = 0;
  let halfMoves    = 0;
  let lastWdlDraw  = 500; // track last WDL draw probability (/ 1000)

  // Opening setup: Chess960 starting position OR standard opening book
  let openingName;
  let c960StartFen = null; // Shredder FEN passed to Stockfish in 960 mode
  let uciMoveList  = [];   // full UCI move history for Chess960 position tracking
  if (CFG.chess960) {
    const c960 = pickChess960(gameNum);
    chess = new Chess(c960.cjsFen); // chess.js uses '-' castling (Shredder not supported)
    c960StartFen = c960.sfFen;      // Stockfish gets Shredder FEN for correct castling rights
    openingName = c960.name;
    log(`[G${gameNum}] ${c960.name}  FEN: ${c960.sfFen}`);
  } else {
    const opening = pickOpening(gameNum);
    openingName = opening.name;
    for (const bookUCI of opening.moves) {
      if (chess.isGameOver()) break;
      try {
        const r = chess.move({ from: bookUCI.slice(0,2), to: bookUCI.slice(2,4), promotion: bookUCI[4] });
        if (r) { moveHistory.push(r.san); halfMoves++; }
        else break;
      } catch { break; }
    }
  }

  while (!chess.isGameOver() && halfMoves < 400) {
    const fen        = chess.fen();
    const isOurTurn  = (chess.turn() === 'w') === wePlayWhite;
    const moveNumber = Math.floor(halfMoves / 2) + 1;
    let moveUCI;

    // Active draw claim: when SF WDL says draw > 70% and we've left the opening,
    // accept the draw immediately rather than playing on and risking a loss.
    if (isOurTurn && moveNumber > 20 && chess.isThreefoldRepetition()) {
      log(`[G${gameNum}] Three-fold repetition — claiming draw at move ${moveNumber} (WDL draw: ${lastWdlDraw}/1000)`);
      break; // chess.js doesn't auto-claim; we manually exit the loop
    }

    if (isOurTurn) {
      const sfResult = await epSf.getMove(fen, c960StartFen, uciMoveList);
      const sfWdl    = sfResult.wdl || null; // { win, draw, loss } / 1000 from SF18
      let selection;

      if (!epEngine) {
        selection = {
          move: sfResult.bestMove, sfEval: sfResult.eval,
          epPrediction: 'sf_only', epConfidence: 0,
          combinedScore: 1.0, epOverride: false,
          sfBestMove: sfResult.bestMove, sfBestEval: sfResult.eval,
          archetype: 'sf_only', divergeReason: 'no_ep', candidates: [],
        };
      } else {
        const epEvals = [];
        for (const line of sfResult.lines) {
          // Pass sfEval so predictFromColorFlow uses agreement-calibration
          epEvals.push(evaluateFlowForMove(chess, line.move, moveHistory, epEngine, moveNumber, sfResult.eval));
        }
        selection = selectBestMove(sfResult.lines, epEvals, wePlayWhite, moveNumber, chess, moveHistory, sfWdl, seenFens);
      }

      moveUCI = selection.move;
      if (selection.epOverride) epOverrides++;

      // Track WDL draw signal for stats
      if (sfWdl) lastWdlDraw = sfWdl.draw;

      gameLog.push({
        halfMove: halfMoves, side: 'EP', uci: moveUCI,
        sfEval: selection.sfEval, epPred: selection.epPrediction,
        epConf: selection.epConfidence?.toFixed(2),
        wdlDraw: sfWdl?.draw,
        override: selection.epOverride, reason: selection.divergeReason,
        archetype: selection.archetype,
      });
    } else {
      const sfResult = await opponentSf.getMove(fen, c960StartFen, uciMoveList);
      moveUCI = sfResult.bestMove;
      if (sfResult.wdl) lastWdlDraw = sfResult.wdl.draw;
      gameLog.push({ halfMove: halfMoves, side: 'SF', uci: moveUCI, sfEval: sfResult.eval, wdlDraw: sfResult.wdl?.draw });
    }

    // Record this position in seenFens for repetition detection
    seenFens.add(chess.fen().split(' ')[0]);

    if (!moveUCI || moveUCI.length < 4) {
      log(`[G${gameNum}] SF returned null move — aborting`);
      break;
    }

    try {
      const result = applyMoveChess960(chess, moveUCI);
      if (!result) { log(`[G${gameNum}] Illegal: ${moveUCI} in ${fen}`); break; }
      moveHistory.push(result.san);
      if (CFG.chess960) uciMoveList.push(moveUCI); // track for Stockfish position cmd
      // Chess960 castling returns newFen — rebuild with fresh Chess() to avoid load() state corruption
      if (result.newFen) {
        chess = new Chess(result.newFen);
        log(`[960] ${result.san} → ${result.newFen.split(' ').slice(0,2).join(' ')}`);
      }
    } catch (e) { log(`[G${gameNum}] Move error: ${e.message}`); break; }

    halfMoves++;
  }

  // Result
  let result = 'draw', resultStr = '1/2-1/2';
  if (chess.isCheckmate()) {
    result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
    resultStr = chess.turn() === 'w' ? '0-1' : '1-0';
  }

  const epWon  = (wePlayWhite && result === 'white_wins') || (!wePlayWhite && result === 'black_wins');
  const epLost = (wePlayWhite && result === 'black_wins') || (!wePlayWhite && result === 'white_wins');
  const score  = epWon ? 1.0 : epLost ? 0.0 : 0.5;
  const pgn    = buildPGN(moveHistory, resultStr, wePlayWhite, gameNum, openingName);

  return {
    gameNum, wePlayWhite, result, resultStr, score,
    epWon, epLost, epDrew: !epWon && !epLost,
    halfMoves, epOverrides, moveHistory, gameLog, pgn, fen: chess.fen(),
    epColor: wePlayWhite ? 'white' : 'black',
    sfDepth: CFG.sfDepth, epDepth: CFG.epDepth,
    opening: openingName,
    sp: CFG.chess960 ? (Math.floor((gameNum-1)/2)*7)%960 : null,
    startFen: c960StartFen,
    avgWdlDraw: lastWdlDraw, // last known WDL draw signal
  };
}

function buildPGN(moveHistory, result, wePlayWhite, gameNum, opening) {
  const white = wePlayWhite ? `EP_Sandbox_d${CFG.epDepth}` : `SF18_d${CFG.sfDepth}`;
  const black = wePlayWhite ? `SF18_d${CFG.sfDepth}`       : `EP_Sandbox_d${CFG.epDepth}`;
  let pgn = `[Event "EP Sandbox Match"]\n`;
  pgn += `[Site "En Pensent Lab — local sandbox"]\n`;
  pgn += `[Date "${new Date().toISOString().substring(0, 10)}"]\n`;
  pgn += `[Round "${gameNum}"]\n`;
  pgn += `[White "${white}"]\n`;
  pgn += `[Black "${black}"]\n`;
  pgn += `[Result "${result}"]\n`;
  pgn += `[Opening "${opening || 'unknown'}"]\n`;
  pgn += `[EPControl "${CFG.epTimeMs > 0 ? 'movetime_'+CFG.epTimeMs+'ms' : 'depth_'+CFG.epDepth}"]\n`;
  pgn += `[SFControl "${CFG.sfTimeMs > 0 ? 'movetime_'+CFG.sfTimeMs+'ms' : 'depth_'+CFG.sfDepth}"]\n\n`;
  for (let i = 0; i < moveHistory.length; i++) {
    if (i % 2 === 0) pgn += `${Math.floor(i / 2) + 1}. `;
    pgn += moveHistory[i] + ' ';
  }
  pgn += result;
  return pgn;
}

// ════════════════════════════════════════════════════════
// LIVE SPRT STATUS LINE
// ════════════════════════════════════════════════════════

function sprtStatusLine(W, D, L, elo0, elo1) {
  const N     = W + D + L;
  const score = N > 0 ? (W + D * 0.5) / N : 0.5;
  const elo   = scoreToElo(score);
  const ci    = eloCI95(N, score);
  const llr   = computeLLR(W, D, L, elo0, elo1);
  const status = llr >= LLR_HI ? 'PASSED ✓' : llr <= LLR_LO ? 'FAILED ✗' : 'ongoing';

  const wPct = N > 0 ? (W / N * 100).toFixed(1) : '0.0';
  const dPct = N > 0 ? (D / N * 100).toFixed(1) : '0.0';
  const lPct = N > 0 ? (L / N * 100).toFixed(1) : '0.0';

  return (
    `W:${W}(${wPct}%) D:${D}(${dPct}%) L:${L}(${lPct}%) ` +
    `| Elo: ${elo >= 0 ? '+' : ''}${elo.toFixed(1)} ±${ci.toFixed(1)} ` +
    `| LLR: ${llr.toFixed(3)} [${LLR_LO.toFixed(3)}, ${LLR_HI.toFixed(3)}] ` +
    `| SPRT(${elo0},${elo1}): ${status}`
  );
}

// ════════════════════════════════════════════════════════
// FINAL FISHTEST-STYLE REPORT
// ════════════════════════════════════════════════════════

function writeReport(gameResults, CFG) {
  const W = gameResults.filter(g => g.epWon).length;
  const D = gameResults.filter(g => g.epDrew).length;
  const L = gameResults.filter(g => g.epLost).length;

  // Per-opening breakdown
  const byOpening = {};
  for (const g of gameResults) {
    const op = g.opening || 'unknown';
    if (!byOpening[op]) byOpening[op] = { W: 0, D: 0, L: 0 };
    if (g.epWon)       byOpening[op].W++;
    else if (g.epLost) byOpening[op].L++;
    else               byOpening[op].D++;
  }
  const N = W + D + L;
  const score = (W + D * 0.5) / N;
  const elo   = scoreToElo(score);
  const ci    = eloCI95(N, score);
  const llr   = computeLLR(W, D, L, CFG.elo0, CFG.elo1);
  const sprtResult = llr >= LLR_HI ? 'PASSED' : llr <= LLR_LO ? 'FAILED' : 'INCONCLUSIVE';

  // By color
  const wGames = gameResults.filter(g => g.wePlayWhite);
  const bGames = gameResults.filter(g => !g.wePlayWhite);
  const wW = wGames.filter(g => g.epWon).length, wD = wGames.filter(g => g.epDrew).length, wL = wGames.filter(g => g.epLost).length;
  const bW = bGames.filter(g => g.epWon).length, bD = bGames.filter(g => g.epDrew).length, bL = bGames.filter(g => g.epLost).length;

  // Overrides
  const totalOverrides = gameResults.reduce((s, g) => s + (g.epOverrides || 0), 0);
  const avgOverrides   = (totalOverrides / N).toFixed(2);

  // Pentanomial
  const penta = buildPentanomial(gameResults);
  const pN = Math.floor(N / 2);

  // Draw rate
  const drawRate = (D / N * 100).toFixed(1);
  const notLose  = ((W + D) / N * 100).toFixed(1);

  // Opening table rows (must be computed before const lines = [...])
  const openingRows = Object.entries(byOpening)
    .sort((a, b) => (b[1].W + b[1].D + b[1].L) - (a[1].W + a[1].D + a[1].L))
    .map(([op, r]) => {
      const n = r.W + r.D + r.L;
      const s = (r.W + r.D * 0.5) / n;
      return `  ${op.padEnd(22)} W:${String(r.W).padStart(2)} D:${String(r.D).padStart(2)} L:${String(r.L).padStart(2)}  ${(s*100).toFixed(0).padStart(3)}%`;
    });

  const sep = '═'.repeat(68);
  const lines = [
    sep,
    '  EN PENSENT SANDBOX — FISHTEST-STYLE MATCH REPORT',
    sep,
    `  Run ID    : ${RUN_ID}`,
    `  Date      : ${new Date().toUTCString()}`,
    `  EP control: ${CFG.epTimeMs > 0 ? 'movetime ' + CFG.epTimeMs + 'ms (reaches depth 20-26 naturally)' : 'depth ' + CFG.epDepth} (SF backbone + EP flow)`,
    `  SF control: ${CFG.sfTimeMs > 0 ? 'movetime ' + CFG.sfTimeMs + 'ms (reaches depth 20-26 naturally)' : 'depth ' + CFG.sfDepth} (pure Stockfish opponent)`,
    `  EP flow   : ${CFG.epEnabled ? 'ENABLED' : 'DISABLED (baseline control)'}`,
    `  MultiPV   : ${CFG.multiPV}`,
    `  Games     : ${N}`,
    '',
    '  RESULTS TABLE',
    '  ' + '─'.repeat(64),
    `  ${'Color'.padEnd(8)} ${'W'.padStart(5)} ${'D'.padStart(5)} ${'L'.padStart(5)} ${'Score'.padStart(8)} ${'Elo est'.padStart(10)}`,
    '  ' + '─'.repeat(64),
    formatRow('White',  wW, wD, wL),
    formatRow('Black',  bW, bD, bL),
    formatRow('TOTAL',  W,  D,  L),
    '  ' + '─'.repeat(64),
    '',
    '  DRAW ANALYSIS',
    `  Draw rate      : ${drawRate}%  (target: ≥ 60% vs SF18)`,
    `  Not-lose rate  : ${notLose}%`,
    `  Avg EP overrides/game: ${avgOverrides}`,
    '',
    '  PENTANOMIAL (paired W/B games)',
    `  LL: ${penta.ll}  LD: ${penta.ld}  DD+WL: ${penta.dd_wl}  WD: ${penta.wd}  WW: ${penta.ww}  (n=${pN} pairs)`,
    '',
    '  FISHTEST SPRT',
    `  H0: elo_diff = ${CFG.elo0}  H1: elo_diff = ${CFG.elo1}`,
    `  alpha = beta = 0.05`,
    `  LLR bounds: [${LLR_LO.toFixed(3)}, ${LLR_HI.toFixed(3)}]`,
    `  LLR        : ${llr.toFixed(4)}`,
    `  Elo est    : ${elo >= 0 ? '+' : ''}${elo.toFixed(1)} ± ${ci.toFixed(1)} (95% CI)`,
    `  Result     : ${sprtResult}`,
    '',
    '  PER-OPENING BREAKDOWN',
    '  ' + '─'.repeat(64),
    `  ${'Opening'.padEnd(22)} ${'W'.padStart(4)} ${'D'.padStart(4)} ${'L'.padStart(4)}  ${'Score'.padStart(6)}`,
    '  ' + '─'.repeat(64),
    ...openingRows,
    '  ' + '─'.repeat(64),
    '',
    '  OUTPUT FILES',
    `  PGN    : ${PGN_FILE}`,
    `  JSONL  : ${JSONL_FILE}`,
    `  Report : ${REPORT_FILE}`,
    sep,
    '',
    '  INTERPRETATION',
    drawInterpretation(score, elo, ci, drawRate, sprtResult, CFG),
    sep,
  ];

  const report = lines.join('\n');
  fs.writeFileSync(REPORT_FILE, report + '\n');
  console.log('\n' + report + '\n');
}

function formatRow(label, W, D, L) {
  const N = W + D + L;
  const score = N > 0 ? ((W + D * 0.5) / N) : 0;
  const elo   = N > 3 ? scoreToElo(score) : NaN;
  const eLbl  = isNaN(elo) ? '    n/a' : `${elo >= 0 ? '+' : ''}${elo.toFixed(1)}`;
  return `  ${label.padEnd(8)} ${String(W).padStart(5)} ${String(D).padStart(5)} ${String(L).padStart(5)} ${(score * 100).toFixed(1).padStart(7)}% ${eLbl.padStart(10)}`;
}

function drawInterpretation(score, elo, ci, drawRate, sprtResult, CFG) {
  const lines = [];
  if (parseFloat(drawRate) >= 60)
    lines.push('  ✓ Draw rate ≥ 60% — EP successfully navigates to fortress positions');
  else if (parseFloat(drawRate) >= 45)
    lines.push('  ≈ Draw rate 45-60% — EP holds reasonable parity against SF');
  else
    lines.push('  ✗ Draw rate < 45% — tune draw-hunt bonuses or increase survival onset');

  if (elo > 0)  lines.push(`  ✓ Positive Elo estimate (+${elo.toFixed(1)}) — EP outperforms SF at this depth pairing`);
  else if (elo > -10) lines.push(`  ≈ Near-zero Elo (${elo.toFixed(1)}) — EP achieves rough parity (goal met)`);
  else           lines.push(`  ✗ Negative Elo (${elo.toFixed(1)}) — EP losing more than expected`);

  if (sprtResult === 'PASSED')
    lines.push(`  ✓ SPRT passed H1 (elo_diff ≥ ${CFG.elo1}) — statistically verified EP advantage`);
  else if (sprtResult === 'FAILED')
    lines.push(`  ✗ SPRT failed — EP did not reach H1 threshold`);
  else
    lines.push(`  … SPRT inconclusive — run more games to reach statistical significance`);

  return lines.join('\n');
}

// ════════════════════════════════════════════════════════
// RESUME — skip already-completed games from prior run
// ════════════════════════════════════════════════════════

function loadCompletedGames(jsonlFile) {
  if (!fs.existsSync(jsonlFile)) return new Set();
  const done = new Set();
  try {
    const lines = fs.readFileSync(jsonlFile, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try { done.add(JSON.parse(line).gameNum); } catch { /* skip corrupt line */ }
    }
  } catch { /* unreadable */ }
  return done;
}

// Find latest existing run JSONL in OUT_DIR to resume from
function findLatestRun() {
  try {
    const files = fs.readdirSync(OUT_DIR)
      .filter(f => f.startsWith('results-') && f.endsWith('.jsonl'))
      .sort().reverse();
    return files[0] ? join(OUT_DIR, files[0]) : null;
  } catch { return null; }
}

// ════════════════════════════════════════════════════════
// MAIN — SANDBOX TOURNAMENT
// ════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  EP SANDBOX RUNNER — Draw-Parity Proof vs SF18                  ║');
  console.log('║  GOAL: Perma-draw. Beat occasionally. Real data. Fishtest proof. ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  EP: ${(CFG.epTimeMs > 0 ? 'movetime='+CFG.epTimeMs+'ms' : 'depth='+CFG.epDepth).padEnd(16)} SF: ${(CFG.sfTimeMs > 0 ? 'movetime='+CFG.sfTimeMs+'ms' : 'depth='+CFG.sfDepth).padEnd(16)} MultiPV=${CFG.multiPV} Games=${CFG.games}║`);
  console.log(`║  SPRT H0=${CFG.elo0} H1=${CFG.elo1}  EP flow: ${CFG.epEnabled ? 'ON ' : 'OFF'}  Output: farm/logs/sandbox/  ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`  PGN    → ${PGN_FILE}`);
  console.log(`  JSONL  → ${JSONL_FILE}`);
  console.log(`  Report → ${REPORT_FILE}`);
  console.log('');

  // Initialize engines
  log('[INIT] Loading EP flow engine...');
  const epEngine = CFG.epEnabled ? await loadEPEngine() : null;
  if (!epEngine && CFG.epEnabled) log('[INIT] EP engine unavailable — running baseline SF-vs-SF control');

  log('[INIT] Spawning Stockfish processes...');
  const epSf       = new StockfishEngine('EP-SF',  CFG.epDepth, CFG.multiPV, CFG.epTimeMs);
  const opponentSf = new StockfishEngine('OPP-SF', CFG.sfDepth, 1,           CFG.sfTimeMs);
  await epSf.init();
  await opponentSf.init();

  // Resume detection
  const latestRun = findLatestRun();
  const completedGames = latestRun ? loadCompletedGames(latestRun) : new Set();
  if (completedGames.size > 0) {
    log(`[RESUME] Found ${completedGames.size} completed games in ${latestRun}`);
    log(`[RESUME] Skipping completed games, continuing from game ${Math.max(...completedGames) + 1}`);
  }

  const gameResults = [];
  let W = 0, D = 0, L = 0;
  let totalHalfMoves = 0, totalOverrides = 0;
  const startTime = Date.now();

  log(`[START] Tournament begins — ${CFG.games} games, alternating colors\n`);

  for (let i = 1; i <= CFG.games; i++) {
    const wePlayWhite = i % 2 === 1; // odd = White, even = Black (paired)

    // Skip if already completed in a previous run
    if (completedGames.has(i)) {
      log(`[SKIP] Game ${i} already completed`);
      continue;
    }

    try {
      const game = await playSingleGame(epSf, opponentSf, epEngine, i, wePlayWhite);

      gameResults.push(game);
      if (game.epWon)       W++;
      else if (game.epLost) L++;
      else                  D++;

      totalHalfMoves  += game.halfMoves;
      totalOverrides  += game.epOverrides;

      // Write PGN + JSONL immediately (crash-safe)
      appendPgn(game.pgn);
      const jsonlEntry = {
        gameNum: game.gameNum, date: new Date().toISOString(),
        epColor: game.epColor, result: game.resultStr,
        epWon: game.epWon, epDrew: game.epDrew, epLost: game.epLost,
        score: game.score, halfMoves: game.halfMoves,
        epOverrides: game.epOverrides, epDepth: CFG.epDepth, sfDepth: CFG.sfDepth,
        opening: game.opening, avgWdlDraw: game.avgWdlDraw,
      };
      if (CFG.chess960) {
        jsonlEntry.sp       = game.sp;
        jsonlEntry.startFen = game.startFen;
        jsonlEntry.moves    = game.moveHistory;
        jsonlEntry.ucis     = game.gameLog.map(e => e.uci).filter(Boolean);
        jsonlEntry.evals    = game.gameLog.map(e => e.sfEval ?? null);
        jsonlEntry.sides    = game.gameLog.map(e => e.side);
        jsonlEntry.overrides = game.gameLog.map(e => e.override ? 1 : 0);
      }
      appendJsonl(jsonlEntry);

      // Live result line
      const emoji   = game.epWon ? '🏆' : game.epDrew ? '🤝' : '❌';
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const gpm     = (i / ((Date.now() - startTime) / 60000)).toFixed(2);
      const wdlStr  = game.avgWdlDraw ? `wdl-d:${game.avgWdlDraw}` : '';
      console.log(
        `${emoji} G${String(i).padStart(4)}/${CFG.games}` +
        ` ${game.epColor === 'white' ? 'W' : 'B'}` +
        ` ${game.resultStr.padEnd(7)}` +
        ` ${String(Math.floor(game.halfMoves / 2)).padStart(3)}mv` +
        ` ovr:${game.epOverrides}` +
        ` ${game.opening?.substring(0, 12).padEnd(12)}` +
        ` ${wdlStr}` +
        ` [${elapsed}s ${gpm}/min]`
      );

      // SPRT update every 5 games
      if (i % 5 === 0 || i === CFG.games) {
        console.log(`       ${sprtStatusLine(W, D, L, CFG.elo0, CFG.elo1)}`);
      }

      // Check SPRT early stop
      const llr = computeLLR(W, D, L, CFG.elo0, CFG.elo1);
      if (i >= 20 && (llr >= LLR_HI || llr <= LLR_LO)) {
        const verdict = llr >= LLR_HI ? 'PASSED ✓' : 'FAILED ✗';
        console.log(`\n  ══ SPRT early stop at game ${i}: ${verdict} ══\n`);
        break;
      }

    } catch (e) {
      log(`[G${i}] Error: ${e.message}`);
    }
  }

  // Cleanup
  epSf.destroy();
  opponentSf.destroy();

  // Final report
  console.log('');
  log('[DONE] Writing final report...');
  writeReport(gameResults, CFG);
  log(`[DONE] All output saved to ${OUT_DIR}`);

  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
