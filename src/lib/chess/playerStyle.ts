import type { ColorPalette, PaletteId } from './pieceColors';
import { colorPalettes } from './pieceColors';
import { rankPalettes, sanTokens, stickyPalette, traitsFromMoves, type GameTraits } from './gamePalette';
import { detectOpeningFromMoves } from './openingDetector';

/**
 * Player colour identity.
 * Every game a player plays is scored from their own moves only (energy, length, texture).
 * Their style is a running blend of those games in date order, so it evolves as they do:
 * a plain average for the first WARMUP games, then each new game moves the profile by ALPHA.
 * A player's colour comes from how they differ from other players, not from raw averages:
 * each game is placed against established players of the same time control (POPULATIONS),
 * so +/-2 standard deviations spans the full 0..1 mood range.
 * The palette is the closest mood to that relative style, and only changes when another mood is
 * clearly closer (stickyPalette), so the palette journey records real shifts rather than noise.
 */
export interface StyleGame {
  id: string;
  pgn: string;
  white: string;
  black: string;
  year: number;
  /** Set for online games (e.g. 'lichess', 'chesscom'): players are then keyed by username. */
  platform?: string;
  /** ISO timestamp, for ordering games within the same year. */
  at?: string;
}

export interface StyleSnapshot {
  gameId: string;
  year: number;
  games: number;
  /** Running blend of the player's own-move traits, as standard scores against their speed's population. */
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

const ALPHA = 0.1;
const WARMUP = 10;

export type Speed = 'bullet' | 'blitz' | 'rapid' | 'classical';

interface Population {
  mean: GameTraits;
  sd: GameTraits;
}

/**
 * Mean and spread of established players' (5+ games) blended traits, per time control.
 * Classical: the En Pensent master collection. Faster controls: see scripts/calibrate-style-population.ts.
 * Each game is compared with players of its own speed, so a blitz game is not "aggressive" just for being blitz.
 */
export const POPULATIONS: Record<Speed, Population> = {
  classical: { mean: { energy: 0.43, length: 0.443, texture: 0.483 }, sd: { energy: 0.102, length: 0.155, texture: 0.143 } },
  // Lichess top-12 per speed, 60 rated games each (Oct 2026)
  rapid: { mean: { energy: 0.557, length: 0.408, texture: 0.5 }, sd: { energy: 0.059, length: 0.118, texture: 0.075 } },
  blitz: { mean: { energy: 0.5, length: 0.54, texture: 0.473 }, sd: { energy: 0.063, length: 0.171, texture: 0.114 } },
  bullet: { mean: { energy: 0.487, length: 0.503, texture: 0.427 }, sd: { energy: 0.111, length: 0.098, texture: 0.116 } },
};
/** Back-compat: the classical population. */
export const POPULATION = POPULATIONS.classical;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const KEYS = ['energy', 'length', 'texture'] as const;

/** Standard scores of raw traits against the population of the game's speed. */
export function standardize(t: GameTraits, speed: Speed = 'classical'): GameTraits {
  const p = POPULATIONS[speed];
  const z = (k: keyof GameTraits) => (t[k] - p.mean[k]) / p.sd[k];
  return { energy: z('energy'), length: z('length'), texture: z('texture') };
}

/** Maps blended standard scores to 0..1 (+/-2 standard deviations spans the range). */
export function styleFromScores(z: GameTraits): GameTraits {
  return { energy: clamp01(0.5 + z.energy / 4), length: clamp01(0.5 + z.length / 4), texture: clamp01(0.5 + z.texture / 4) };
}

/** Raw traits -> relative style for one population (kept for callers that score a single profile). */
export function relativeStyle(t: GameTraits, speed: Speed = 'classical'): GameTraits {
  return styleFromScores(standardize(t, speed));
}

/** Time control from the PGN TimeControl header (estimated duration = base + 40 x increment). */
export function speedOfPgn(pgn: string): Speed {
  const tc = /\[TimeControl "([^"]*)"\]/.exec(pgn)?.[1];
  const m = tc ? /^(\d+)(?:\+(\d+))?$/.exec(tc) : null;
  if (!m) return 'classical';
  const est = Number(m[1]) + 40 * Number(m[2] ?? 0);
  return est < 180 ? 'bullet' : est < 480 ? 'blitz' : est < 1500 ? 'rapid' : 'classical';
}

/** A player's running style: how many games, and the blended standard scores. Small enough to store. */
export interface StyleState {
  games: number;
  scores: GameTraits;
}

/** Folds one game's standard scores into a running style (warm-up average, then ALPHA per game). */
export function foldGame(state: StyleState | null, scores: GameTraits): StyleState {
  if (!state) return { games: 1, scores };
  const n = state.games + 1;
  const w = Math.max(ALPHA, n <= WARMUP ? 1 / n : 0);
  const next = {} as GameTraits;
  for (const k of KEYS) next[k] = state.scores[k] + (scores[k] - state.scores[k]) * w;
  return { games: n, scores: next };
}

const ALIASES: Record<string, string> = {
  'robert fischer': 'fischer-b',
  'robert james fischer': 'fischer-b',
  'edward lasker': 'lasker-ed',
};

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z\s.-]/g, '').trim();

/** Identity key. Online players use `platform:username`; historical players use surname + initial. */
export function playerKey(name: string, platform?: string): string {
  if (platform) return `${platform}:${name.trim().toLowerCase()}`;
  const f = fold(name).replace(/\./g, ' ').replace(/\s+/g, ' ');
  if (ALIASES[f]) return ALIASES[f];
  const parts = f.split(' ');
  const surname = parts[parts.length - 1];
  return parts.length > 1 ? `${surname}-${parts[0][0]}` : surname;
}

/** A game replayed once, shared by both sides' scoring. */
export interface ParsedStyleGame {
  moves: string[];
  gambit: boolean;
  draw: boolean;
  speed: Speed;
}

export function parseStyleGame(pgn: string): ParsedStyleGame {
  const moves = sanTokens(pgn);
  return {
    moves,
    gambit: detectOpeningFromMoves(moves)?.category === 'gambit',
    draw: /\[Result "1\/2-1\/2"\]/.test(pgn),
    speed: speedOfPgn(pgn),
  };
}

/** Raw traits from one side's moves of a parsed game. */
export function sideTraitsOf(g: ParsedStyleGame, side: 'w' | 'b'): GameTraits {
  const last = g.moves[g.moves.length - 1] ?? '';
  const lastByMe = (g.moves.length % 2 === 1) === (side === 'w');
  return traitsFromMoves({
    moves: g.moves.filter((_, i) => (i % 2 === 0) === (side === 'w')),
    totalPlies: g.moves.length,
    mate: last.endsWith('#') && lastByMe,
    gambit: g.gambit && side === 'w',
    draw: g.draw,
  });
}

/** Traits from one side's moves in one game. */
export function sideTraits(pgn: string, side: 'w' | 'b'): GameTraits {
  return sideTraitsOf(parseStyleGame(pgn), side);
}

/** Builds every player's evolving profile from a collection of games. */
export function buildPlayerProfiles(games: StyleGame[]): Map<string, PlayerProfile> {
  const ordered = [...games].sort((a, b) => a.year - b.year || (a.at ?? '').localeCompare(b.at ?? '') || a.id.localeCompare(b.id));
  const profiles = new Map<string, PlayerProfile>();
  const names = new Map<string, Map<string, number>>();
  for (const g of ordered) {
    const parsed = parseStyleGame(g.pgn);
    for (const side of ['w', 'b'] as const) {
      const name = side === 'w' ? g.white : g.black;
      const key = playerKey(name, g.platform);
      const counts = names.get(key) ?? new Map<string, number>();
      counts.set(name, (counts.get(name) ?? 0) + 1);
      names.set(key, counts);
      const p = profiles.get(key) ?? { key, name, history: [] };
      const prev = p.history[p.history.length - 1];
      const state = foldGame(prev ? { games: prev.games, scores: prev.traits } : null, standardize(sideTraitsOf(parsed, side), parsed.speed));
      const style = styleFromScores(state.scores);
      p.history.push({ gameId: g.id, year: g.year, games: state.games, traits: state.scores, style, paletteId: stickyPalette(style, prev?.paletteId) });
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
  const pw = profiles.get(playerKey(game.white, game.platform));
  const pb = profiles.get(playerKey(game.black, game.platform));
  if (!pw || !pb) return null;
  return matchSnapshots(pw, snapshotAt(pw, game.id), pb, snapshotAt(pb, game.id));
}

/** Two players' current palettes against each other (e.g. a live GothamChess vs Hikaru matchup). */
export function matchPaletteForProfiles(pw: PlayerProfile, pb: PlayerProfile): MatchPalette {
  return matchSnapshots(pw, pw.history[pw.history.length - 1], pb, pb.history[pb.history.length - 1]);
}

function matchSnapshots(pw: PlayerProfile, sw: StyleSnapshot, pb: PlayerProfile, sb: StyleSnapshot): MatchPalette {
  let w = sw.paletteId;
  let b = sb.paletteId;
  let yieldW: string | undefined;
  let yieldB: string | undefined;
  if (w === b) {
    if (sw.games < sb.games) {
      w = rankPalettes(sw.style).find((id) => id !== b)!;
      yieldW = pb.name;
    } else {
      b = rankPalettes(sb.style).find((id) => id !== w)!;
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
