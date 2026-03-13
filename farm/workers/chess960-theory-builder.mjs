#!/usr/bin/env node
/**
 * Chess960 Opening Theory Builder
 *
 * Reads all ep14-sf18-960 JSONL result files and accumulates per-SP opening theory:
 *   - First N half-moves (UCI + SAN + SF eval) per starting position
 *   - Move frequency tables (what SF18 plays from each SP)
 *   - Castling pattern stats, draw rates, EP divergences
 *
 * Output: farm/data/chess960-theory/
 *   sp-NNN.json  — per-position theory (N = 0-959)
 *   index.json   — aggregate coverage + stats
 *
 * Run: node farm/workers/chess960-theory-builder.mjs [--watch]
 *      Or add to PM2 ecosystem for continuous updates.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, '..', 'logs', 'sandbox', 'ep14-sf18-960');
const THEORY_DIR  = path.join(__dirname, '..', 'data', 'chess960-theory');
const INDEX_FILE  = path.join(THEORY_DIR, 'index.json');
const THEORY_PLIES = 20; // capture first 20 half-moves as "opening"

const WATCH_MODE  = process.argv.includes('--watch');
const WATCH_MS    = 30_000; // rebuild every 30s in watch mode

fs.mkdirSync(THEORY_DIR, { recursive: true });

// ════════════════════════════════════════════════════════
// CHESS960 SCHARNAGL FEN (same logic as runner — standalone)
// ════════════════════════════════════════════════════════

function generateChess960Rank(sp) {
  const rank = Array(8).fill(null);
  let n = sp;
  // Bishops
  const b1 = n % 4; n = Math.floor(n / 4);
  rank[[1,3,5,7][b1]] = 'B';
  const b2 = n % 4; n = Math.floor(n / 4);
  rank[[0,2,4,6][b2]] = 'B';
  // Queen
  const q = n % 6; n = Math.floor(n / 6);
  const empQ = rank.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  rank[empQ[q]] = 'Q';
  // Knights (KN table)
  const KN = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]];
  const kn = KN[n];
  const empKN = rank.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  rank[empKN[kn[0]]] = 'N'; rank[empKN[kn[1]]] = 'N';
  // Rook King Rook fills remainder
  const rem = rank.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  rank[rem[0]] = 'R'; rank[rem[1]] = 'K'; rank[rem[2]] = 'R';
  return rank;
}

function chess960StartFen(sp) {
  const rank   = generateChess960Rank(sp);
  const kingF  = rank.indexOf('K');
  const rookFs = rank.map((v,i) => v==='R' ? i : -1).filter(i=>i>=0);
  const qsRook = rookFs.find(f => f < kingF);
  const ksRook = rookFs.find(f => f > kingF);
  const wCastle = (ksRook !== undefined ? String.fromCharCode(65+ksRook) : '')
                + (qsRook !== undefined ? String.fromCharCode(65+qsRook) : '');
  const sfCastling = (wCastle + wCastle.toLowerCase()) || '-';
  const whiteRank  = rank.join('');
  return `${whiteRank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w ${sfCastling} - 0 1`;
}

// ════════════════════════════════════════════════════════
// THEORY ACCUMULATOR
// ════════════════════════════════════════════════════════

function freshTheory(sp) {
  return {
    sp,
    startFen: chess960StartFen(sp),
    games: 0, draws: 0, epWins: 0, sfWins: 0,
    lines: [],
    moveFreq: {},      // {"1w:c4": n, "1b:e5": n, ...}
    castleStats: { whiteKS: 0, whiteQS: 0, whiteNone: 0, blackKS: 0, blackQS: 0, blackNone: 0 },
    evalByPly: [],     // sum of evals per ply (divide by gamesWithPly for avg)
    gamesWithPly: [],  // count of games that had each ply
    epDivergences: [], // { ply, result } summary
    updatedAt: null,
  };
}

function detectCastleType(ucis, color) {
  // Look for king-to-rook moves. In 960 the king moves to the rook's square.
  const kingStart = color === 'white' ? 'e1' : 'e8'; // not always true in 960 but heuristic
  const rank = color === 'white' ? '1' : '8';
  for (const uci of ucis) {
    if (!uci) continue;
    const from = uci.slice(0,2), to = uci.slice(2,4);
    if (from[1] === rank && to[1] === rank) {
      const fromFile = from.charCodeAt(0) - 97;
      const toFile   = to.charCodeAt(0)   - 97;
      // King moves: identified by large file delta or king-to-rook
      if (Math.abs(toFile - fromFile) >= 2) {
        return toFile > fromFile ? 'KS' : 'QS';
      }
    }
  }
  return 'none';
}

function ingestGame(record, theories) {
  const sp = record.sp;
  if (sp == null || !record.moves || !record.ucis) return null;

  if (!theories[sp]) theories[sp] = freshTheory(sp);
  const theory = theories[sp];
  theory.games++;

  const result = record.result;
  if (result === '1/2-1/2') theory.draws++;
  else if ((result === '1-0' && record.epColor === 'white') ||
           (result === '0-1' && record.epColor === 'black')) theory.epWins++;
  else theory.sfWins++;

  // Opening line: first THEORY_PLIES half-moves
  const plies  = Math.min(THEORY_PLIES, record.moves.length);
  const line = {
    san:      record.moves.slice(0, plies),
    uci:      record.ucis.slice(0, plies),
    evals:    (record.evals  || []).slice(0, plies),
    result,
    epColor:  record.epColor,
    date:     record.date,
    epOverrides: record.epOverrides || 0,
    halfMoves: record.halfMoves,
  };
  theory.lines.push(line);

  // Move frequency: "plyW:san" and "plyB:san"
  for (let i = 0; i < plies; i++) {
    const sideLabel = i % 2 === 0 ? 'w' : 'b';
    const key = `${Math.floor(i/2)+1}${sideLabel}:${record.moves[i]}`;
    theory.moveFreq[key] = (theory.moveFreq[key] || 0) + 1;
  }

  // Eval accumulation
  for (let i = 0; i < plies; i++) {
    const ev = record.evals?.[i];
    if (typeof ev === 'number') {
      theory.evalByPly[i]    = (theory.evalByPly[i]    || 0) + ev;
      theory.gamesWithPly[i] = (theory.gamesWithPly[i] || 0) + 1;
    }
  }

  // Castling detection
  const wUcis = record.ucis.filter((_, i) => i % 2 === 0); // white plies
  const bUcis = record.ucis.filter((_, i) => i % 2 === 1); // black plies
  const wCastle = detectCastleType(wUcis, 'white');
  const bCastle = detectCastleType(bUcis, 'black');
  if (wCastle === 'KS')       theory.castleStats.whiteKS++;
  else if (wCastle === 'QS')  theory.castleStats.whiteQS++;
  else                        theory.castleStats.whiteNone++;
  if (bCastle === 'KS')       theory.castleStats.blackKS++;
  else if (bCastle === 'QS')  theory.castleStats.blackQS++;
  else                        theory.castleStats.blackNone++;

  // EP divergence summary
  if (record.overrides) {
    const divCount = record.overrides.reduce((s,v) => s+v, 0);
    if (divCount > 0) theory.epDivergences.push({ result, divCount, epColor: record.epColor });
  }

  theory.updatedAt = new Date().toISOString();
  return theory; // returns reference to in-memory object (already stored in theories dict)
}

// ════════════════════════════════════════════════════════
// BUILD INDEX
// ════════════════════════════════════════════════════════

function buildIndex(theoriesBySpNumber) {
  const sps = Object.values(theoriesBySpNumber);
  const totalGames = sps.reduce((s,t) => s+t.games, 0);
  const totalDraws = sps.reduce((s,t) => s+t.draws, 0);
  const totalEpW   = sps.reduce((s,t) => s+t.epWins, 0);
  const totalSfW   = sps.reduce((s,t) => s+t.sfWins, 0);

  // Top SPs by game count
  const topSPs = sps
    .sort((a,b) => b.games - a.games)
    .slice(0, 20)
    .map(t => ({
      sp: t.sp,
      games: t.games,
      drawRate: t.games > 0 ? (t.draws/t.games).toFixed(3) : null,
      epWinRate: t.games > 0 ? (t.epWins/t.games).toFixed(3) : null,
    }));

  return {
    totalGames,
    spsCovered: sps.length,
    coverage: `${sps.length}/960`,
    byResult: { draw: totalDraws, epWin: totalEpW, sfWin: totalSfW },
    drawRate: totalGames > 0 ? (totalDraws/totalGames).toFixed(3) : null,
    epWinRate: totalGames > 0 ? (totalEpW/totalGames).toFixed(3) : null,
    topSPs,
    generatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════
// MAIN BUILD
// ════════════════════════════════════════════════════════

function build() {
  let jsonlFiles = [];
  try {
    jsonlFiles = fs.readdirSync(RESULTS_DIR)
      .filter(f => f.startsWith('results-') && f.endsWith('.jsonl'))
      .map(f => path.join(RESULTS_DIR, f));
  } catch {
    console.log('[960-theory] Results dir not found yet:', RESULTS_DIR);
    return;
  }

  const theories = {}; // sp → theory object — purely in-memory, rebuilt from scratch each call
  let totalLines = 0, skipped = 0;

  for (const file of jsonlFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    for (const line of raw.split('\n').filter(Boolean)) {
      try {
        const record = JSON.parse(line);
        if (record.sp == null) { skipped++; continue; }
        const theory = ingestGame(record, theories);
        if (!theory) { skipped++; continue; }
        totalLines++;
      } catch { skipped++; }
    }
  }

  // Save per-SP theory files
  for (const [sp, theory] of Object.entries(theories)) {
    fs.writeFileSync(
      path.join(THEORY_DIR, `sp-${sp}.json`),
      JSON.stringify(theory, null, 2)
    );
  }

  // Save index
  const index = buildIndex(theories);
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

  console.log(
    `[960-theory] Built: ${totalLines} games → ${Object.keys(theories).length} SPs covered` +
    ` (${index.coverage}) drawRate=${index.drawRate} epWin=${index.epWinRate}` +
    ` | skipped=${skipped}`
  );
}

// ════════════════════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════════════════════

build();

if (WATCH_MODE) {
  console.log(`[960-theory] Watch mode — rebuilding every ${WATCH_MS/1000}s`);
  setInterval(build, WATCH_MS);
}
