import { colorPalettes, type ColorPalette, type PaletteId, type PieceType } from './pieceColors';
import { PALETTE_MOODS, type GameTraits } from './gamePalette';

/**
 * A player's own palette: their three closest preset moods blended piece by piece,
 * each weighted by how close it sits to the player's style (inverse squared distance).
 * Same style, same colours; as the style drifts, the blend drifts with it.
 */
const PIECES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

export interface SignatureMix {
  paletteId: PaletteId;
  weight: number;
}

export function signatureMix(style: GameTraits, count = 3): SignatureMix[] {
  const ranked = (Object.entries(PALETTE_MOODS) as [PaletteId, GameTraits][])
    .map(([id, m]) => [id, (style.energy - m.energy) ** 2 + (style.length - m.length) ** 2 + (style.texture - m.texture) ** 2] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, count);
  const raw = ranked.map(([id, d]) => [id, 1 / Math.max(d, 1e-4)] as const);
  const total = raw.reduce((s, [, w]) => s + w, 0);
  return raw.map(([paletteId, w]) => ({ paletteId, weight: w / total }));
}

export function signaturePalette(style: GameTraits, playerName: string): ColorPalette {
  const mix = signatureMix(style).map((m) => ({ ...m, palette: colorPalettes.find((p) => p.id === m.paletteId)! }));
  const blendSide = (side: 'white' | 'black') => {
    const out = {} as Record<PieceType, string>;
    for (const piece of PIECES) {
      const rgb = [0, 0, 0];
      for (const { palette, weight } of mix) hexToRgb(palette[side][piece]).forEach((v, i) => (rgb[i] += v * weight));
      out[piece] = rgbToHex(rgb);
    }
    return out;
  };
  const lead = mix[0].palette;
  return {
    id: 'custom',
    name: `${playerName} Signature`,
    description: `Blend of ${mix.map((m) => `${m.palette.name} ${Math.round(m.weight * 100)}%`).join(', ')}`,
    white: blendSide('white'),
    black: blendSide('black'),
    legendTheme: lead.legendTheme,
  };
}
