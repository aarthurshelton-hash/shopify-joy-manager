#!/usr/bin/env node
/**
 * fair-play-review.mjs — triage review of tournament winners before payout.
 *
 * Input: results JSON from
 *   node scripts/tournaments/lichess-tournament.mjs results <id> --games --out results.json
 *
 * For each of the top N finishers, analyses their games with local Stockfish
 * and move clocks, and flags statistical outliers:
 *   - engine agreement (top-1 match rate) and average centipawn loss (ACPL)
 *   - move-time uniformity (coefficient of variation of per-move time)
 *
 * THIS IS TRIAGE, NOT PROOF. Thresholds are heuristic and uncalibrated.
 * A flag means "escalate to Lichess / human review before paying out",
 * never "ban". Lichess's own fair-play system remains the authority.
 *
 * Usage:
 *   node scripts/tournaments/fair-play-review.mjs results.json [--top 5] [--depth 12] [--band-max 1599] [--out review.json]
 * Env: STOCKFISH_PATH (default: stockfish on PATH)
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { Chess } from 'chess.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!file) {
  console.error('Usage: fair-play-review.mjs results.json [--top 5] [--depth 12] [--out review.json]');
  process.exit(1);
}
const TOP = Number(opt('top', 5));
const DEPTH = Number(opt('depth', 12));
const MIN_ANALYSED_MOVES = 30;
const BOOK_PLIES = 16;
const MATE_CP = 1000;

const THRESHOLDS = { acplMax: 12, top1Min: 0.7, timeCvMax: 0.35, bandOverrun: 300 };
// Rating-band events invite sandbagging (deliberately low rating to win a lower band).
// If --band-max is given, flag finishers whose performance rating far exceeds the cap.
const BAND_MAX = opt('band-max', null) ? Number(opt('band-max')) : null;

const report = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!report.games?.length) {
  console.error('results file has no games — re-run results with --games');
  process.exit(1);
}

// ── Stockfish (UCI, one persistent process) ─────────────────────────────────
const sf = spawn(process.env.STOCKFISH_PATH || 'stockfish');
let buf = '';
let waiter = null;
sf.stdout.on('data', (d) => {
  buf += d.toString();
  if (waiter && waiter.test(buf)) {
    const w = waiter;
    waiter = null;
    w.resolve(buf);
  }
});
const send = (cmd) => sf.stdin.write(`${cmd}\n`);
const until = (re) =>
  new Promise((resolve) => {
    waiter = { test: (s) => re.test(s), resolve };
    if (re.test(buf)) {
      const w = waiter;
      waiter = null;
      w.resolve(buf);
    }
  });

async function evalFen(fen) {
  buf = '';
  send(`position fen ${fen}`);
  send(`go depth ${DEPTH}`);
  const out = await until(/bestmove \S+/);
  const lines = out.split('\n').filter((l) => l.includes(' score ') && l.includes(' pv '));
  const last = lines[lines.length - 1] || '';
  const m = last.match(/score (cp|mate) (-?\d+)/);
  let cp = 0;
  if (m) cp = m[1] === 'cp' ? Number(m[2]) : Math.sign(Number(m[2])) * MATE_CP;
  cp = Math.max(-MATE_CP, Math.min(MATE_CP, cp));
  return { cp, best: out.match(/bestmove (\S+)/)[1] };
}

// ── Per-game analysis ───────────────────────────────────────────────────────
async function analyseGame(game, username) {
  const white = game.players?.white?.user?.name?.toLowerCase();
  const black = game.players?.black?.user?.name?.toLowerCase();
  const me = username.toLowerCase();
  const myColor = white === me ? 'w' : black === me ? 'b' : null;
  if (!myColor || !game.moves) return null;

  const sanMoves = game.moves.split(' ');
  const chess = new Chess();
  const fens = [chess.fen()];
  const uciMoves = [];
  for (const san of sanMoves) {
    const mv = chess.move(san);
    if (!mv) return null;
    uciMoves.push(mv.from + mv.to + (mv.promotion || ''));
    fens.push(chess.fen());
  }

  // Evaluate each position once; cp is from the side-to-move's view.
  const evals = [];
  for (const fen of fens) evals.push(await evalFen(fen));

  let analysed = 0;
  let matches = 0;
  let lossSum = 0;
  for (let i = 0; i < uciMoves.length; i++) {
    const mine = (i % 2 === 0) === (myColor === 'w');
    if (!mine || i < BOOK_PLIES || i + 1 >= evals.length) continue;
    // Skip trivial positions: already decided either way.
    if (Math.abs(evals[i].cp) > 600) continue;
    analysed++;
    if (evals[i].best === uciMoves[i]) matches++;
    lossSum += Math.max(0, Math.min(MATE_CP, evals[i].cp + evals[i + 1].cp));
  }

  // Move times from clocks (centiseconds, one per ply), own plies only.
  const times = [];
  const clocks = game.clocks;
  if (clocks && game.clock) {
    const inc = (game.clock.increment || 0) * 100;
    const initial = (game.clock.initial || 0) * 100;
    for (let i = 0; i < clocks.length; i++) {
      const mine = (i % 2 === 0) === (myColor === 'w');
      if (!mine || i < BOOK_PLIES) continue;
      const prev = i >= 2 ? clocks[i - 2] : initial;
      const t = (prev + inc - clocks[i]) / 100;
      if (t >= 0) times.push(t);
    }
  }
  return { analysed, matches, lossSum, times };
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const stdev = (a) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

// ── Main ────────────────────────────────────────────────────────────────────
send('uci');
await until(/uciok/);
send('isready');
await until(/readyok/);

const players = report.standings.slice(0, TOP);
const results = [];
for (const s of players) {
  const games = report.games.filter(
    (g) =>
      g.players?.white?.user?.name?.toLowerCase() === s.username.toLowerCase() ||
      g.players?.black?.user?.name?.toLowerCase() === s.username.toLowerCase(),
  );
  let analysed = 0, matches = 0, lossSum = 0;
  const times = [];
  for (const g of games) {
    const r = await analyseGame(g, s.username);
    if (!r) continue;
    analysed += r.analysed;
    matches += r.matches;
    lossSum += r.lossSum;
    times.push(...r.times);
  }
  const acpl = analysed ? lossSum / analysed : null;
  const top1 = analysed ? matches / analysed : null;
  const timeCv = times.length >= MIN_ANALYSED_MOVES ? stdev(times) / mean(times) : null;

  const flags = [];
  if (analysed < MIN_ANALYSED_MOVES) flags.push('insufficient_sample');
  else {
    if (acpl <= THRESHOLDS.acplMax && top1 >= THRESHOLDS.top1Min) flags.push('engine_like_accuracy');
    if (timeCv !== null && timeCv <= THRESHOLDS.timeCvMax) flags.push('uniform_move_times');
  }
  if (BAND_MAX && s.performance && s.performance > BAND_MAX + THRESHOLDS.bandOverrun) {
    flags.push('possible_sandbagging');
  }
  results.push({
    rank: s.rank, performance: s.performance ?? null, username: s.username, rating: s.rating ?? null,
    games: games.length, analysedMoves: analysed,
    acpl: acpl === null ? null : Number(acpl.toFixed(1)),
    top1MatchPct: top1 === null ? null : Number((top1 * 100).toFixed(1)),
    moveTimeCv: timeCv === null ? null : Number(timeCv.toFixed(2)),
    flags,
  });
}
sf.kill();

console.log(`Fair-play triage (depth ${DEPTH}, top ${TOP}) — heuristic, not proof\n`);
for (const r of results) {
  const tag = r.flags.length ? `  ⚠ ${r.flags.join(', ')}` : '  ok';
  console.log(
    `${String(r.rank).padStart(2)}. ${r.username.padEnd(20)} ACPL ${r.acpl ?? '?'}  top1 ${r.top1MatchPct ?? '?'}%  timeCV ${r.moveTimeCv ?? '?'}  (${r.analysedMoves} moves)${tag}`,
  );
}
const out = opt('out', file.replace(/\.json$/, '') + '-review.json');
fs.writeFileSync(out, JSON.stringify({ thresholds: THRESHOLDS, depth: DEPTH, results }, null, 2));
console.log(`\nWrote ${out}. Flagged accounts: escalate to Lichess / hold payout; do not publicly accuse.`);
