import type { ColorPalette, PaletteId } from './pieceColors';
import { colorPalettes } from './pieceColors';
import { pgnMoves, rankPalettes, traitsFromMoves, type GameTraits } from './gamePalette';
import { detectOpeningFromMoves } from './openingDetector';

/**
 * Player colour identity.
 * Every game a player plays is scored from their own moves only (energy, length, texture).
 * Their style is a running blend of those games in date order, so it evolves as they do:
 * each new game moves the profile by ALPHA, after an initial warm-up average.
 * A player's colour comes from how they differ from other players, not from raw averages:
 * each trait is placed against the population of established players (POPULATION, calibrated
 * on the En Pensent collection), so +/-2 standard deviations spans the full 0..1 mood range.
 * The palette is the one whose mood sits closest to that relative style at that moment.
 */
export interface StyleGame {
  id: string;
  pgn: string;
  white: string;
  black: string;
  year: number;
}

export interface StyleSnapshot {
  gameId: string;
  year: number;
  games: number;
  /** Running blend of the player's own-move traits. */
  traits: GameTraits;
  /** Traits relative to the player population; drives the palette. */
  style: GameTraits;
  paletteId: PaletteId;
}

export interface PlayerProfile {
  key: string;
  name: string;
  history: StyleSnapshot[];
}

export interface SidePalette {
  player: string;
  key: string;
  paletteId: PaletteId;
  style: GameTraits;
  games: number;
  /** True when this side took its next-closest palette because the opponent already held the first. */
  yielded: boolean;
  why: string;
}

export interface MatchPalette {
  white: SidePalette;
  black: SidePalette;
}

const ALPHA = 0.25;
const WARMUP = 4;

/** Mean and spread of established players' (5+ games) blended traits in the collection. */
export const POPULATION = {
  mean: { energy: 0.434, length: 0.44, texture: 0.478 },
  sd: { energy: 0.118, length: 0.166, texture: 0.143 },
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function relativeStyle(t: GameTraits): GameTraits {
  const r = (k: keyof GameTraits) => clamp01(0.5 + (t[k] - POPULATION.mean[k]) / (4 * POPULATION.sd[k]));
  return { energy: r('energy'), length: r('length'), texture: r('texture') };
}

const ALIASES: Record<string, string> = {
  'robert fischer': 'fischer-b',
  'robert james fischer': 'fischer-b',
  'edward lasker': 'lasker-ed',
};

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z\s.-]/g, '').trim();

export function playerKey(name: string): string {
  const f = fold(name).replace(/\./g, ' ').replace(/\s+/g, ' ');
  if (ALIASES[f]) return ALIASES[f];
  const parts = f.split(' ');
  const surname = parts[parts.length - 1];
  return parts.length > 1 ? `${surname}-${parts[0][0]}` : surname;
}

/** Traits from one side's moves in one game. */
export function sideTraits(pgn: string, side: 'w' | 'b'): GameTraits {
  const moves = pgnMoves(pgn);
  const mine = moves.filter((_, i) => (i % 2 === 0) === (side === 'w'));
  const last = moves[moves.length - 1] ?? '';
  const lastByMe = (moves.length % 2 === 1) === (side === 'w');
  const opening = detectOpeningFromMoves(moves);
  return traitsFromMoves({
    moves: mine,
    totalPlies: moves.length,
    mate: last.endsWith('#') && lastByMe,
    gambit: opening?.category === 'gambit' && side === 'w',
    draw: /\[Result "1\/2-1\/2"\]/.test(pgn),
  });
}

const blend = (a: GameTraits, b: GameTraits, w: number): GameTraits => ({
  energy: a.energy + (b.energy - a.energy) * w,
  length: a.length + (b.length - a.length) * w,
  texture: a.texture + (b.texture - a.texture) * w,
});

/** Builds every player's evolving profile from a collection of games. */
export function buildPlayerProfiles(games: StyleGame[]): Map<string, PlayerProfile> {
  const ordered = [...games].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  const profiles = new Map<string, PlayerProfile>();
  const names = new Map<string, Map<string, number>>();
  for (const g of ordered) {
    for (const side of ['w', 'b'] as const) {
      const name = side === 'w' ? g.white : g.black;
      const key = playerKey(name);
      const counts = names.get(key) ?? new Map<string, number>();
      counts.set(name, (counts.get(name) ?? 0) + 1);
      names.set(key, counts);
      const p = profiles.get(key) ?? { key, name, history: [] };
      const prev = p.history[p.history.length - 1];
      const t = sideTraits(g.pgn, side);
      const n = (prev?.games ?? 0) + 1;
      const traits = prev ? blend(prev.traits, t, Math.max(ALPHA, n <= WARMUP ? 1 / n : 0)) : t;
      const style = relativeStyle(traits);
      p.history.push({ gameId: g.id, year: g.year, games: n, traits, style, paletteId: rankPalettes(style)[0] });
      profiles.set(key, p);
    }
  }
  for (const [key, p] of profiles) {
    const counts = [...(names.get(key) ?? new Map()).entries()];
    p.name = counts.sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? p.name;
  }
  return profiles;
}

const level = (x: number, lo: string, mid: string, hi: string) => (x < 0.34 ? lo : x < 0.67 ? mid : hi);

export function describeStyle(t: GameTraits): string {
  return [
    level(t.energy, 'calmer', 'typical energy', 'more aggressive'),
    level(t.texture, 'piece-driven', 'typical structure', 'pawn-driven'),
    level(t.length, 'quicker games', 'typical length', 'longer games'),
  ].join(', ');
}

function snapshotAt(p: PlayerProfile, gameId: string): StyleSnapshot {
  return p.history.find((h) => h.gameId === gameId) ?? p.history[p.history.length - 1];
}

export function explainSide(player: string, style: GameTraits, games: number, paletteId: PaletteId, yieldedTo?: string): string {
  const pct = (x: number) => Math.round(x * 100);
  return `${player}: ${describeStyle(style)} vs. other players (energy ${pct(style.energy)}, texture ${pct(style.texture)}, length ${pct(style.length)}) over ${games} game${games === 1 ? '' : 's'} → ${paletteId}${yieldedTo ? ` (next-closest; ${yieldedTo} holds the first)` : ''}`;
}

function side(p: PlayerProfile, snap: StyleSnapshot, paletteId: PaletteId, yieldedTo?: string): SidePalette {
  return {
    player: p.name,
    key: p.key,
    paletteId,
    style: snap.style,
    games: snap.games,
    yielded: !!yieldedTo,
    why: explainSide(p.name, snap.style, snap.games, paletteId, yieldedTo),
  };
}

/**
 * Each player's palette as it stood when the game was played.
 * If both styles land on the same palette, the player with fewer games yields to their next-closest mood.
 */
export function matchPaletteForGame(game: StyleGame, profiles: Map<string, PlayerProfile>): MatchPalette | null {
  const pw = profiles.get(playerKey(game.white));
  const pb = profiles.get(playerKey(game.black));
  if (!pw || !pb) return null;
  const sw = snapshotAt(pw, game.id);
  const sb = snapshotAt(pb, game.id);
  let w = sw.paletteId;
  let b = sb.paletteId;
  let yieldW: string | undefined;
  let yieldB: string | undefined;
  if (w === b) {
    if (sw.games < sb.games) {
      w = rankPalettes(sw.style)[1];
      yieldW = pb.name;
    } else {
      b = rankPalettes(sb.style)[1];
      yieldB = pw.name;
    }
  }
  return { white: side(pw, sw, w, yieldW), black: side(pb, sb, b, yieldB) };
}

/** White pieces from the white player's palette, black pieces from the black player's. */
export function composeMatchPalette(whiteId: PaletteId, blackId: PaletteId): ColorPalette {
  const w = colorPalettes.find((p) => p.id === whiteId) ?? colorPalettes[0];
  const b = colorPalettes.find((p) => p.id === blackId) ?? colorPalettes[0];
  return {
    ...w,
    id: 'custom',
    name: `${w.name} vs ${b.name}`,
    description: `White in ${w.name}, Black in ${b.name}`,
    white: { ...w.white },
    black: { ...b.black },
    legendTheme: {
      whiteName: w.legendTheme.whiteName,
      whiteEmoji: w.legendTheme.whiteEmoji,
      blackName: b.legendTheme.blackName,
      blackEmoji: b.legendTheme.blackEmoji,
    },
    backgroundImage: undefined,
  };
}
