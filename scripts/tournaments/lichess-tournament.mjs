#!/usr/bin/env node
/**
 * lichess-tournament.mjs — create + audit En Pensent tournaments on Lichess.
 *
 * Lichess chosen over Chess.com deliberately: full tournament-management API,
 * server-enforced entry conditions (rating bands, account age, rated-game
 * minimums), team-gated events, and game export WITH move clocks for
 * anti-cheat review. Chess.com's API is read-only.
 *
 * Commands:
 *   node scripts/tournaments/lichess-tournament.mjs create-arena \
 *        --name "EP Weekly Open U1600" --clock 5+2 --minutes 90 \
 *        --max-rating 1600 --min-rated-games 50 --min-account-days 30 \
 *        --team en-pensent
 *
 *   node scripts/tournaments/lichess-tournament.mjs create-swiss \
 *        --name "EP Monthly Championship" --clock 10+5 --rounds 7 \
 *        --team en-pensent [--min-rating 1600]
 *
 *   node scripts/tournaments/lichess-tournament.mjs results <tournamentId> \
 *        [--games] [--out results.json]
 *
 * Env: LICHESS_TOKEN (OAuth token with tournament:write for create;
 *   results/games need no auth)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

const API = 'https://lichess.org';
const TOKEN = process.env.LICHESS_TOKEN;

const args = process.argv.slice(2);
const CMD = args.shift();
const flag = (name, fallback) => {
  if (args.includes(`--${name}`)) {
    const i = args.indexOf(`--${name}`);
    const v = args[i + 1];
    return v && !v.startsWith('--') ? v : true;
  }
  return fallback;
};

// Lichess only allows voucher/credit prizes if the description says so explicitly,
// and recommends a 72h payout hold plus open accounts for fair-play review.
const PRIZE_TERMS =
  'Prizes: Matcherino cash prize pool (paid by Matcherino) plus En Pensent reward codes, which are '
  + 'discount codes redeemable only at https://enpensent.com/redeem. '
  + 'Fair play: rated games only; no prizes are paid until 72 hours after the event, and winners must keep '
  + 'their Lichess accounts open. Accounts flagged by Lichess are ineligible. '
  + 'Not affiliated with or sponsored by Lichess.';

const DEFAULT_MIN_RATED_GAMES = '30';

function parseClock(spec) {
  const [limit, inc = '0'] = String(spec).split('+');
  return { limitMinutes: Number(limit), increment: Number(inc) };
}

async function api(pathname, { method = 'GET', body, ndjson = false } = {}) {
  const headers = {};
  if (ndjson) headers.Accept = 'application/x-ndjson';
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const r = await fetch(`${API}${pathname}`, { method, headers, body });
  if (!r.ok) {
    throw new Error(`${method} ${pathname} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  const text = await r.text();
  if (ndjson) return text.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return JSON.parse(text);
}

// ── create-arena ────────────────────────────────────────────────────────────
async function createArena() {
  if (!TOKEN) { console.error('Need LICHESS_TOKEN (tournament:write scope)'); process.exit(1); }
  const { limitMinutes, increment } = parseClock(flag('clock', '5+2'));
  const name = flag('name', `EP Arena ${new Date().toISOString().slice(0, 10)}`);

  const p = new URLSearchParams({
    name,
    'clockTime': String(limitMinutes),
    'clockIncrement': String(increment),
    minutes: String(flag('minutes', 90)),
    variant: 'standard',
    rated: 'true',
    berserkable: 'true',
    streakable: 'true',
    hasChat: 'true',
    description: flag('description', `En Pensent open arena. ${PRIZE_TERMS}`),
  });

  const startDate = flag('start-date');
  if (startDate) {
    const ms = Date.parse(startDate);
    if (Number.isNaN(ms) || ms < Date.now()) { console.error(`--start-date must be a future ISO date, got ${startDate}`); process.exit(1); }
    p.set('startDate', String(ms));
  }

  // ── Anti-cheat entry conditions (server-enforced by Lichess) ──
  const team = flag('team');
  if (team) p.set('conditions.teamMember.teamId', team);
  const perf = flag('perf');
  if (perf) p.set('conditions.nbRatedGame.perf', String(perf));
  if (flag('max-rating')) p.set('conditions.maxRating.rating', String(flag('max-rating')));
  if (flag('min-rating')) p.set('conditions.minRating.rating', String(flag('min-rating')));
  p.set('conditions.nbRatedGame.nb', String(flag('min-rated-games', DEFAULT_MIN_RATED_GAMES)));
  if (flag('min-account-days')) p.set('conditions.accountAge', String(flag('min-account-days')));

  const t = await api('/api/tournament', { method: 'POST', body: p });
  console.log(`Arena created: ${t.fullName}`);
  console.log(`  id: ${t.id}`);
  console.log(`  url: https://lichess.org/tournament/${t.id}`);
  console.log(`  starts: ${t.startsAt}`);
  console.log(`  clock: ${t.clock.limit / 60}+${t.clock.increment} | ${t.minutes}min`);
  if (t.conditions) console.log(`  conditions: ${JSON.stringify(t.conditions)}`);
}

// ── create-swiss ────────────────────────────────────────────────────────────
async function createSwiss() {
  if (!TOKEN) { console.error('Need LICHESS_TOKEN (tournament:write scope)'); process.exit(1); }
  const team = flag('team');
  if (!team) { console.error('Swiss requires --team <teamId> (team-scoped by design)'); process.exit(1); }
  const { limitMinutes, increment } = parseClock(flag('clock', '10+5'));
  const name = flag('name', `EP Swiss ${new Date().toISOString().slice(0, 10)}`);

  const p = new URLSearchParams({
    name,
    'clock.limit': String(limitMinutes * 60), // swiss wants seconds
    'clock.increment': String(increment),
    nbRounds: String(flag('rounds', 7)),
    variant: 'standard',
    rated: 'true',
    description: flag('description', `En Pensent championship Swiss. ${PRIZE_TERMS}`),
  });
  if (flag('max-rating')) p.set('conditions.maxRating', String(flag('max-rating')));
  if (flag('min-rating')) p.set('conditions.minRating', String(flag('min-rating')));
  p.set('conditions.nbRatedGame', String(flag('min-rated-games', DEFAULT_MIN_RATED_GAMES)));
  if (flag('min-account-days')) p.set('conditions.accountAge', String(flag('min-account-days')));

  const t = await api(`/api/swiss/new/${team}`, { method: 'POST', body: p });
  console.log(`Swiss created: ${t.name}`);
  console.log(`  id: ${t.id}`);
  console.log(`  url: https://lichess.org/swiss/${t.id}`);
  console.log(`  rounds: ${t.nbRounds} | clock: ${limitMinutes}+${increment}`);
}

// ── results ─────────────────────────────────────────────────────────────────
async function results() {
  const id = args[0];
  if (!id) { console.error('Usage: results <tournamentId> [--games] [--out file]'); process.exit(1); }

  const standings = await api(`/api/tournament/${id}/results?nb=200`, { ndjson: true });
  const report = {
    tournamentId: id,
    fetchedAt: new Date().toISOString(),
    standings,
  };

  if (flag('games')) {
    // Full game export WITH move clocks — move-time data feeds anti-cheat review
    // (uniform move times on critical decisions is a classic engine tell).
    console.error('  fetching games with clocks (this can take a moment)…');
    const games = await api(
      `/api/tournament/${id}/games?moves=true&clocks=true&evals=true&opening=true`,
      { ndjson: true },
    );
    report.games = games;
    console.error(`  ${games.length} games fetched`);
  }

  const top10 = standings.slice(0, 10);
  console.log('Top 10:');
  for (const s of top10) {
    console.log(`  ${String(s.rank).padStart(2)}. ${s.username} — ${s.score}pts (${s.performance ?? '?'} perf${s.ratingDiff ? `, ${s.ratingDiff > 0 ? '+' : ''}${s.ratingDiff}` : ''})`);
  }
  console.log(`\n${standings.length} total players`);

  const out = flag('out', `tournament-${id}-results.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`Wrote ${out}`);
}

// ── dispatch ────────────────────────────────────────────────────────────────
const COMMANDS = { 'create-arena': createArena, 'create-swiss': createSwiss, results };
if (!COMMANDS[CMD]) {
  console.log(`Usage: node lichess-tournament.mjs <${Object.keys(COMMANDS).join('|')}> [flags]
  create-arena  --name X --clock 5+2 --minutes 90 [--team en-pensent]
                [--max-rating N] [--min-rating N] [--min-rated-games N] [--min-account-days N]
  create-swiss  --name X --clock 10+5 --rounds 7 --team en-pensent [same conditions]
  results       <tournamentId> [--games] [--out file]`);
  process.exit(1);
}
await COMMANDS[CMD]();
