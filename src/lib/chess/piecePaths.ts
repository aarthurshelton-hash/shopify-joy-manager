/**
 * Chess piece SVG path data and utilities
 * Shared between ChessPieceIcon component and canvas renderers
 */

import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

/**
 * En Pensent piece set: weighty lathe-turned Staunton silhouettes, 100x100 box.
 * Sub-paths are wound clockwise so overlaps union under the nonzero rule.
 * Renderers paint a wide stroke BEHIND the fill so only the outer edge shows.
 */
const BASE =
  'M22 90 L22 85 C22 82 25 80 28 80 L72 80 C75 80 78 82 78 85 L78 90 Z ' +
  'M29 81 L29 74 L71 74 L71 81 Z';

const pearl = (cx: number, cy: number, r = 4.2) =>
  `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx} ${cy + r} A${r} ${r} 0 1 1 ${cx} ${cy - r} Z `;

export const PIECE_PATHS: Record<PieceType, string> = {
  p:
    pearl(50, 30, 12.5) +
    'M37 47 C37 43.5 42 41.5 50 41.5 C58 41.5 63 43.5 63 47 C63 50 58 51.5 50 51.5 C42 51.5 37 50 37 47 Z ' +
    'M33 75 C40 67 43 57 44 48 L56 48 C57 57 60 67 67 75 Z ' +
    BASE,
  r:
    'M28 26 L28 12 L38 12 L38 17.5 L44.5 17.5 L44.5 12 L55.5 12 L55.5 17.5 L62 17.5 L62 12 L72 12 ' +
    'L72 26 L67 30 L66.5 62 L73 68 L73 76 L27 76 L27 68 L33.5 62 L33 30 Z ' +
    BASE,
  n:
    'M27 77 C27 68 32 62 38 57 C33 57 29 55 26 51 C22 49 20 44 22 40 C24 36 30 30 36 25 ' +
    'L40 11 L45 19 L52 10 L56 20 C66 24 74 38 75 52 C76 62 75 70 74 77 Z ' +
    BASE,
  b:
    pearl(50, 10, 5) +
    'M50 14 C58 20 66 30 66 41 C66 48 61 52 56 53 L44 53 C39 52 34 48 34 41 C34 30 42 20 50 14 Z ' +
    'M38 52 L62 52 C63 55 63 57 61 58.5 L39 58.5 C37 57 37 55 38 52 Z ' +
    'M40 58 L60 58 C60 66 63 72 69 77 L31 77 C37 72 40 66 40 58 Z ' +
    BASE,
  q:
    pearl(24, 16) + pearl(37, 11) + pearl(50, 8.5) + pearl(63, 11) + pearl(76, 16) +
    'M30 48 L23 19 L35 32 L36.5 14 L45 31 L50 11 L55 31 L63.5 14 L65 32 L77 19 L70 48 Z ' +
    'M29 47 L71 47 C72 50 72 52 70 54 L30 54 C28 52 28 50 29 47 Z ' +
    'M34 53 L66 53 C66 62 68 70 74 77 L26 77 C32 70 34 62 34 53 Z ' +
    BASE,
  k:
    'M46 3 L54 3 L54 9 L60 9 L60 16 L54 16 L54 22 L46 22 L46 16 L40 16 L40 9 L46 9 Z ' +
    'M50 24 C60 24 67 30 67 38 C67 44 63 48 58 50 L42 50 C37 48 33 44 33 38 C33 30 40 24 50 24 Z ' +
    'M36 49 L64 49 L66 56 L34 56 Z ' +
    'M36 55 L64 55 C64 64 67 71 73 77 L27 77 C33 71 36 64 36 55 Z ' +
    BASE,
};


// Brand-thematic defaults — cream & charcoal with a gold accent stroke
export const DEFAULT_FILL: Record<PieceColor, string> = {
  w: '#F5EFE0', // warm cream
  b: '#211C16', // rich obsidian
};

export const DEFAULT_STROKE: Record<PieceColor, string> = {
  w: '#403422', // deep bronze outline for cream pieces
  b: '#C9A552', // muted gold outline for dark pieces
};

export interface PieceDetail {
  /** Thin engraved grooves: turning rings, mane, mitre slit */
  engrave: string;
  /** Soft specular edge-light */
  highlight: string;
  /** Point details: eye, nostril */
  dots: [number, number][];
}

const GROOVES = 'M24.5 86 L75.5 86 M30.5 77.5 L69.5 77.5';

export const PIECE_DETAILS: Record<PieceType, PieceDetail> = {
  p: { engrave: `M39 62 C45 64.5 55 64.5 61 62 ${GROOVES}`, highlight: 'M41.5 25 C43 21 46.5 19.5 50 19.5', dots: [] },
  r: { engrave: `M28 26 L72 26 M34 62 L66 62 ${GROOVES}`, highlight: 'M36 34 L36.5 58', dots: [] },
  n: {
    engrave: `M34 44 C38 48 42 50 46 49 M58 24 C64 30 68 38 69 48 M53 31 C59 37 62 45 63 55 ${GROOVES}`,
    highlight: 'M27 42 C29 37 33 31 38 27',
    dots: [[41, 32], [24.5, 43]],
  },
  b: { engrave: `M47.5 26 L56.5 41.5 M40 65 C46 67 54 67 60 65 M38 55 L62 55 ${GROOVES}`, highlight: 'M42 27 C40 33 39 38 40 44', dots: [] },
  q: { engrave: `M31 45 L69 45 M35 63 C43 66 57 66 65 63 ${GROOVES}`, highlight: 'M37.5 56 C37.5 63 35.5 69 31 74.5', dots: [] },
  k: { engrave: `M34 38 L66 38 M37 64 C44 67 56 67 63 64 ${GROOVES}`, highlight: 'M38 31 C40 28 43 26.5 46 26', dots: [] },
};

/** Visible outline = half of this (the stroke is painted behind the fill). */
export const PIECE_OUTLINE_WIDTH = 4;

export interface PieceTones {
  light: string;
  mid: string;
  dark: string;
  outline: string;
  engrave: string;
  highlight: string;
  speck: string;
}

/** Mix a #RGB/#RRGGBB colour toward white (t>0) or black (t<0). */
export function shadeHex(hex: string, t: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const target = t >= 0 ? 255 : 0;
  const k = Math.abs(t);
  const out = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16);
    return Math.round(v + (target - v) * k).toString(16).padStart(2, '0');
  });
  return `#${out.join('')}`;
}

const CURATED: Record<PieceColor, Omit<PieceTones, 'outline'>> = {
  w: { light: '#FFFDF6', mid: '#F1E8D0', dark: '#C4B28A', engrave: '#8A7650', highlight: '#FFFFFF', speck: '#6B5A38' },
  b: { light: '#5C5244', mid: '#2A241C', dark: '#0B0906', engrave: '#000000', highlight: '#E8CF8A', speck: '#000000' },
};

export function getPieceTones(color: PieceColor, hexColor?: string, strokeColor?: string): PieceTones {
  const outline = strokeColor || DEFAULT_STROKE[color];
  if (!hexColor) return { ...CURATED[color], outline };
  return {
    light: shadeHex(hexColor, 0.55),
    mid: hexColor,
    dark: shadeHex(hexColor, -0.32),
    outline,
    engrave: shadeHex(hexColor, -0.5),
    highlight: shadeHex(hexColor, 0.85),
    speck: shadeHex(hexColor, -0.65),
  };
}

/**
 * Get the SVG path data for a piece type
 */
export function getPiecePath(type: PieceType): string {
  return PIECE_PATHS[type];
}

/**
 * Get the default fill/stroke colors for a piece color
 */
export function getPieceColors(color: PieceColor, hexColor?: string) {
  return {
    fill: hexColor || DEFAULT_FILL[color],
    stroke: DEFAULT_STROKE[color],
  };
}

/**
 * Map FEN piece character (e.g. 'K', 'k') to PieceType
 */
export function fenCharToType(char: string): PieceType {
  return char.toLowerCase() as PieceType;
}

/**
 * Map FEN piece character to PieceColor
 */
export function fenCharToColor(char: string): PieceColor {
  return char === char.toUpperCase() ? 'w' : 'b';
}
