/**
 * Calibrates POPULATIONS.classical (src/lib/chess/playerStyle.ts) from the En Pensent master collections:
 * each player's own-move raw traits are blended exactly like playerStyle, then mean/sd are taken over
 * players with 5+ games.   npx tsx scripts/calibrate-classical-population.ts
 */
import { famousGames, carlsenLegendaryGames } from '../src/lib/chess/famousGames';
import { fischerTop100 } from '../src/lib/book/fischerGames';
import { carlsenTop100 } from '../src/lib/book/carlsenGames';
import { sanTokens, type GameTraits } from '../src/lib/chess/gamePalette';
import { foldGame, parseStyleGame, playerKey, sideTraitsOf, type StyleState } from '../src/lib/chess/playerStyle';

const seen = new Set<string>();
const games = [...famousGames, ...carlsenLegendaryGames, ...fischerTop100, ...carlsenTop100]
  .filter((g) => { const k = sanTokens(g.pgn).join(' '); if (seen.has(k)) return false; seen.add(k); return true; })
  .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

const states = new Map<string, StyleState>();
for (const g of games) {
  const parsed = parseStyleGame(g.pgn);
  for (const side of ['w', 'b'] as const) {
    const key = playerKey(side === 'w' ? g.white : g.black);
    states.set(key, foldGame(states.get(key) ?? null, sideTraitsOf(parsed, side)));
  }
}
const finals = [...states.values()].filter((s) => s.games >= 5).map((s) => s.scores);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const mean = {} as GameTraits;
const sd = {} as GameTraits;
for (const k of ['energy', 'length', 'texture'] as const) {
  const v = finals.map((f) => f[k]);
  mean[k] = r3(v.reduce((a, b) => a + b, 0) / v.length);
  sd[k] = r3(Math.sqrt(v.reduce((a, b) => a + (b - mean[k]) ** 2, 0) / v.length));
}
console.log(`  classical: { mean: ${JSON.stringify(mean).replace(/"/g, '')}, sd: ${JSON.stringify(sd).replace(/"/g, '')} }, // ${finals.length} players`);
