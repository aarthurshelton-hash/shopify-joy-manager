/**
 * Calibrates POPULATIONS (src/lib/chess/playerStyle.ts) for online time controls.
 * Samples rated games of Lichess's top players per speed via the public API, builds each player's
 * blended raw traits exactly like playerStyle does, and prints the mean/sd over players with 5+ games.
 *
 *   npx tsx scripts/calibrate-style-population.ts
 */
import { foldGame, parseStyleGame, sideTraitsOf, type StyleState } from '../src/lib/chess/playerStyle';
import type { GameTraits } from '../src/lib/chess/gamePalette';

const SPEEDS = ['bullet', 'blitz', 'rapid'] as const;
const PLAYERS_PER_SPEED = 12;
const GAMES_PER_PLAYER = 60;
const UA = { 'User-Agent': 'EnPensent-style-calibration (enpensent.com)' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, accept: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { ...UA, Accept: accept } });
    if (res.ok) return res.text();
    if (res.status === 429) await sleep(61_000);
    else return null;
  }
  return null;
}

const keys = ['energy', 'length', 'texture'] as const;
const out: Record<string, { mean: GameTraits; sd: GameTraits; players: number; games: number }> = {};

for (const speed of SPEEDS) {
  const top = await get(`https://lichess.org/api/player/top/${PLAYERS_PER_SPEED}/${speed}`, 'application/vnd.lichess.v3+json');
  const users: string[] = top ? JSON.parse(top).users.map((u: { username: string }) => u.username) : [];
  const finals: GameTraits[] = [];
  let games = 0;
  for (const user of users) {
    const blob = await get(
      `https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=${GAMES_PER_PLAYER}&perfType=${speed}&rated=true&clocks=false&evals=false&opening=false`,
      'application/x-chess-pgn',
    );
    await sleep(1500);
    if (!blob) continue;
    const pgns = blob.split(/\n\n(?=\[Event )/).filter((p) => p.includes('[White '));
    let state: StyleState | null = null;
    for (const pgn of pgns.reverse()) {
      const side = new RegExp(`\\[White "${user}"\\]`, 'i').test(pgn) ? 'w' : 'b';
      const parsed = parseStyleGame(pgn);
      if (parsed.moves.length < 10) continue;
      state = foldGame(state, sideTraitsOf(parsed, side));
      games++;
    }
    if (state && state.games >= 5) finals.push(state.scores);
  }
  const mean = {} as GameTraits;
  const sd = {} as GameTraits;
  for (const k of keys) {
    const v = finals.map((f) => f[k]);
    mean[k] = v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
    sd[k] = Math.sqrt(v.reduce((a, b) => a + (b - mean[k]) ** 2, 0) / Math.max(1, v.length));
  }
  out[speed] = { mean, sd, players: finals.length, games };
  console.error(`${speed}: ${finals.length} players, ${games} games`);
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;
for (const [speed, p] of Object.entries(out)) {
  const fmt = (t: GameTraits) => `{ energy: ${r3(t.energy)}, length: ${r3(t.length)}, texture: ${r3(t.texture)} }`;
  console.log(`  ${speed}: { mean: ${fmt(p.mean)}, sd: ${fmt(p.sd)} }, // ${p.players} players, ${p.games} games`);
}
