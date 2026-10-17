#!/usr/bin/env node
/**
 * schedule.mjs — plan / create the En Pensent tournament ladder on Lichess.
 *
 * Rules (bands, time controls, entry gates, cadence) come from
 * src/lib/tournament/ladder.json — the same file the website reads.
 *
 *   node scripts/tournaments/schedule.mjs plan   [--from 2026-10-19] [--days 14]
 *   node scripts/tournaments/schedule.mjs create [--from ...] [--days 14] --team en-pensent --yes
 *
 * `create` is a dry run unless --yes is passed. Created events are logged in
 * scripts/tournaments/created-events.json so re-running never duplicates.
 * Requires LICHESS_TOKEN (tournament:write) for create.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));
const ladder = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/lib/tournament/ladder.json'), 'utf8'));
const LOG = path.join(HERE, 'created-events.json');

const args = process.argv.slice(2);
const CMD = args.shift();
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const DAY_MS = 86_400_000;
const epoch = Date.parse(`${ladder.epoch}T00:00:00Z`);

// Mirrors ladderEvent() in src/lib/tournament/ladder.ts — keep in sync.
function ladderEvent(index) {
  const band = ladder.bands[index % ladder.bands.length];
  const lap = Math.floor(index / ladder.bands.length);
  const tc = ladder.timeControls[(index + lap) % ladder.timeControls.length];
  const cycle = Math.floor(index / (ladder.bands.length * ladder.timeControls.length));
  const [hh, mm] = ladder.slotsUtc[(index + cycle) % ladder.slotsUtc.length].split(':').map(Number);
  const startsAt = new Date(epoch + index * ladder.cadenceDays * DAY_MS + (hh * 60 + mm) * 60_000);
  const label = startsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return { index, startsAt, band, tc, name: `EP ${band.label} ${tc.label} · ${label}` };
}

function window(from, days) {
  const to = from + days * DAY_MS;
  const out = [];
  for (let i = Math.max(0, Math.floor((from - epoch) / (ladder.cadenceDays * DAY_MS)) - 1); ; i++) {
    const ev = ladderEvent(i);
    if (ev.startsAt.getTime() >= to) break;
    if (ev.startsAt.getTime() >= from) out.push(ev);
  }
  return out;
}

const fromArg = flag('from');
const from = fromArg ? Date.parse(`${fromArg}T00:00:00Z`) : Date.now();
const days = Number(flag('days', 14));
const events = window(from, days);

if (CMD !== 'plan' && CMD !== 'create') {
  console.log('Usage: schedule.mjs <plan|create> [--from YYYY-MM-DD] [--days 14] [--team id] [--yes]');
  process.exit(1);
}

console.log(`Ladder: every ${ladder.cadenceDays} days, ${ladder.durationMinutes} min, ${events.length} events in window\n`);
for (const e of events) {
  const gate = `>=${e.tc.minRatedGames} rated ${e.tc.perf}, acct >=${e.tc.minAccountDays}d`;
  console.log(`${e.startsAt.toISOString().slice(0, 16)}Z  ${e.name.padEnd(36)} ${gate}  review top ${e.tc.reviewTop}`);
}

if (CMD === 'plan') process.exit(0);

const yes = flag('yes') === true;
const team = flag('team');
const created = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
console.log(yes ? '\nCreating…' : '\nDRY RUN (add --yes to create)');

for (const e of events) {
  if (created[e.name]) { console.log(`  skip (exists): ${e.name} → ${created[e.name].id}`); continue; }
  const cli = [
    path.join(HERE, 'lichess-tournament.mjs'), 'create-arena',
    '--name', e.name,
    '--clock', e.tc.clock,
    '--minutes', String(ladder.durationMinutes),
    '--perf', e.tc.perf,
    '--min-rated-games', String(e.tc.minRatedGames),
    '--min-account-days', String(e.tc.minAccountDays),
    '--start-date', e.startsAt.toISOString(),
  ];
  if (e.band.minRating) cli.push('--min-rating', String(e.band.minRating));
  if (e.band.maxRating) cli.push('--max-rating', String(e.band.maxRating));
  if (team) cli.push('--team', String(team));

  if (!yes) { console.log(`  would create: ${e.name}`); continue; }
  const r = spawnSync('node', cli, { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`  FAILED: ${e.name}\n${r.stderr || r.stdout}`); continue; }
  const id = r.stdout.match(/id:\s*(\S+)/)?.[1];
  created[e.name] = { id, startsAt: e.startsAt.toISOString(), band: e.band.id, tc: e.tc.id };
  fs.writeFileSync(LOG, JSON.stringify(created, null, 2));
  console.log(`  created: ${e.name} → https://lichess.org/tournament/${id}`);
}
