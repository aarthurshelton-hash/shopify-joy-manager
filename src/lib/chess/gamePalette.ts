import { Chess } from 'chess.js';
import type { PaletteId } from './pieceColors';
import { detectOpeningFromMoves } from './openingDetector';

/**
 * Each game "chooses" its palette from how it was played.
 * Three traits are measured from the moves alone, each scaled 0..1 against the spread
 * observed across the En Pensent collections (10th percentile = 0, 90th = 1):
 *   energy  - captures, checks, gambits and mates (calm = 0, violent = 1)
 *   length  - how long the struggle lasted (miniature = 0, marathon = 1)
 *   texture - share of pawn moves (piece play = 0, pawn structure = 1)
 * The palette whose mood sits closest to those traits wins. Same game, same palette, always.
 */
export interface GameTraits {
  energy: number;
  length: number;
  texture: number;
}

export const PALETTE_MOODS: Record<Exclude<PaletteId, 'custom' | 'clear'>, GameTraits> = {
  volcanic: { energy: 1.0, length: 0.5, texture: 0.2 },
  contrast: { energy: 1.0, length: 0.0, texture: 0.5 },
  cyberpunk: { energy: 0.9, length: 0.9, texture: 0.2 },
  roman: { energy: 0.85, length: 0.2, texture: 0.8 },
  tropical: { energy: 0.75, length: 0.1, texture: 0.2 },
  medieval: { energy: 0.7, length: 0.6, texture: 0.9 },
  spectral: { energy: 0.7, length: 0.8, texture: 0.5 },
  stainedglass: { energy: 0.6, length: 0.35, texture: 0.6 },
  cosmic: { energy: 0.6, length: 1.0, texture: 0.6 },
  hotCold: { energy: 0.55, length: 0.5, texture: 0.5 },
  artdeco: { energy: 0.45, length: 0.3, texture: 0.2 },
  egyptian: { energy: 0.45, length: 0.75, texture: 1.0 },
  modern: { energy: 0.4, length: 0.55, texture: 0.3 },
  aurora: { energy: 0.4, length: 0.9, texture: 0.85 },
  vintage: { energy: 0.35, length: 0.2, texture: 0.75 },
  autumn: { energy: 0.3, length: 0.6, texture: 0.75 },
  inkgold: { energy: 0.25, length: 0.05, texture: 0.4 },
  desert: { energy: 0.25, length: 1.0, texture: 1.0 },
  ocean: { energy: 0.2, length: 0.75, texture: 0.2 },
  japanese: { energy: 0.1, length: 0.2, texture: 0.1 },
  woodland: { energy: 0.1, length: 0.45, texture: 0.9 },
  nordic: { energy: 0.05, length: 0.95, texture: 0.4 },
  greyscale: { energy: 0.0, length: 0.6, texture: 0.6 },
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const scale = (x: number, p10: number, p90: number) => clamp((x - p10) / (p90 - p10));

export function pgnMoves(pgn: string): string[] {
  const c = new Chess();
  try {
    c.loadPgn(pgn);
    return c.history();
  } catch {
    return [];
  }
}

export interface MoveCounts {
  moves: string[];
  totalPlies: number;
  mate: boolean;
  gambit: boolean;
  draw: boolean;
}

/** Scores a set of moves (a whole game, or one side's moves) on the three traits. */
export function traitsFromMoves({ moves, totalPlies, mate, gambit, draw }: MoveCounts): GameTraits {
  const n = Math.max(1, moves.length);
  const captures = moves.filter((m) => m.includes('x')).length / n;
  const checks = moves.filter((m) => /[+#]$/.test(m)).length / n;
  const pawns = moves.filter((m) => /^[a-h]/.test(m)).length / n;
  const energy = clamp(
    (scale(captures, 0.159, 0.267) + scale(checks, 0.009, 0.113)) / 2 +
      (mate ? 0.15 : 0) +
      (gambit ? 0.1 : 0) -
      (draw ? 0.15 : 0),
  );
  return { energy, length: scale(Math.max(1, totalPlies), 50, 123), texture: scale(pawns, 0.208, 0.35) };
}

export function measureGame(pgn: string): GameTraits {
  const moves = pgnMoves(pgn);
  return traitsFromMoves({
    moves,
    totalPlies: moves.length,
    mate: moves.length > 0 && moves[moves.length - 1].endsWith('#'),
    gambit: detectOpeningFromMoves(moves)?.category === 'gambit',
    draw: /\[Result "1\/2-1\/2"\]/.test(pgn),
  });
}

/** All palettes ordered from closest to furthest mood. */
export function rankPalettes(t: GameTraits): PaletteId[] {
  return (Object.entries(PALETTE_MOODS) as [PaletteId, GameTraits][])
    .map(([id, m]) => [id, (t.energy - m.energy) ** 2 + (t.length - m.length) ** 2 + (t.texture - m.texture) ** 2] as const)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

export function choosePaletteForGame(pgn: string): PaletteId {
  return rankPalettes(measureGame(pgn))[0];
}
