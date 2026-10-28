import type { PaletteId } from './pieceColors';
import type { GameTraits } from './gamePalette';
import { MATCH_PALETTES, PLAYER_PALETTES, type SavedMatchPalette } from './playerPalettes';
import { explainSide } from './playerStyle';

export interface SavedSide {
  player: string;
  key: string;
  paletteId: PaletteId;
  style: GameTraits;
  games: number;
  why: string;
  /** [year, palette] each time this player's palette changed, across the collections. */
  journey: [number, PaletteId][];
}

function unpack(row: SavedMatchPalette, offset: 0 | 7, opponent: string): SavedSide {
  const [paletteId, key, games, energy, texture, length, yielded] = row.slice(offset, offset + 7) as [PaletteId, string, number, number, number, number, 0 | 1];
  const player = PLAYER_PALETTES[key]?.name ?? key;
  const style = { energy, texture, length };
  return {
    player,
    key,
    paletteId,
    style,
    games,
    why: explainSide(player, style, games, paletteId, yielded ? opponent : undefined),
    journey: PLAYER_PALETTES[key]?.journey ?? [],
  };
}

/**
 * Auto palette for a saved game: each side in its player's palette as it stood at that game.
 * Keys are famous-game ids, or `fischer:<id>` / `carlsen:<id>` for book games.
 */
export function savedMatchPalette(key: string): { white: SavedSide; black: SavedSide } | null {
  const row = MATCH_PALETTES[key];
  if (!row) return null;
  const whiteName = PLAYER_PALETTES[row[1]]?.name ?? row[1];
  const blackName = PLAYER_PALETTES[row[8]]?.name ?? row[8];
  return { white: unpack(row, 0, blackName), black: unpack(row, 7, whiteName) };
}
