/**
 * Chess piece SVG path data and utilities
 * Shared between ChessPieceIcon component and canvas renderers
 */

import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

/**
 * SVG path data for each piece type — the En Pensent piece set.
 * Designed on a 100x100 viewBox with the piece centered.
 * Staunton-inspired silhouettes drawn with smooth Bézier curves,
 * consistent plinths, and royal proportions that read clearly at any size.
 */
export const PIECE_PATHS: Record<PieceType, string> = {
  // King — regal cross above a domed crown and flowing robe
  k: 'M46 5 L54 5 L54 11 L60 11 L60 19 L54 19 L54 25 L46 25 L46 19 L40 19 L40 11 L46 11 Z M50 27 C58 27 64 32 64 39 C64 44 61 48 56 50 L44 50 C39 48 36 44 36 39 C36 32 42 27 50 27 Z M43 52 L57 52 C63 57 68 66 70 76 L30 76 C32 66 37 57 43 52 Z M27 78 L73 78 L73 82 C73 84 71 86 69 86 L31 86 C29 86 27 84 27 82 Z',
  // Queen — five-point coronet with pearls above an elegant tapered gown
  q: 'M28 10 C30 10 31.5 11.5 31.5 13.5 C31.5 15.5 30 17 28 17 C26 17 24.5 15.5 24.5 13.5 C24.5 11.5 26 10 28 10 Z M50 5 C52 5 53.5 6.5 53.5 8.5 C53.5 10.5 52 12 50 12 C48 12 46.5 10.5 46.5 8.5 C46.5 6.5 48 5 50 5 Z M72 10 C74 10 75.5 11.5 75.5 13.5 C75.5 15.5 74 17 72 17 C70 17 68.5 15.5 68.5 13.5 C68.5 11.5 70 10 72 10 Z M39 7 C41 7 42.5 8.5 42.5 10.5 C42.5 12.5 41 14 39 14 C37 14 35.5 12.5 35.5 10.5 C35.5 8.5 37 7 39 7 Z M61 7 C63 7 64.5 8.5 64.5 10.5 C64.5 12.5 63 14 61 14 C59 14 57.5 12.5 57.5 10.5 C57.5 8.5 59 7 61 7 Z M27 19 L37 33 L43 15 L50 31 L57 15 L63 33 L73 19 L68 44 L32 44 Z M36 46 L64 46 L61 53 L39 53 Z M40 55 L60 55 C63 62 66 69 69 76 L31 76 C34 69 37 62 40 55 Z M27 78 L73 78 L73 82 C73 84 71 86 69 86 L31 86 C29 86 27 84 27 82 Z',
  // Rook — crenellated tower with molded cornice and stately plinth
  r: 'M30 10 L38 10 L38 17 L46 17 L46 10 L54 10 L54 17 L62 17 L62 10 L70 10 L70 26 L66 30 L34 30 L30 26 Z M36 32 L64 32 L66 58 L34 58 Z M32 60 L68 60 L70 66 L30 66 Z M30 68 L70 68 L72 76 L28 76 Z M26 78 L74 78 L74 82 C74 84 72 86 70 86 L30 86 C28 86 26 84 26 82 Z',
  // Bishop — mitre with diagonal slit, finial orb, and curved cassock
  b: 'M50 5 C52.5 5 54.5 7 54.5 9.5 C54.5 12 52.5 14 50 14 C47.5 14 45.5 12 45.5 9.5 C45.5 7 47.5 5 50 5 Z M50 16 C59 22 65 31 65 40 C65 48 58 53 50 53 C42 53 35 48 35 40 C35 31 41 22 50 16 Z M46.5 27.5 L55.5 39.5 L52.5 42 L43.5 30 Z M41 55 L59 55 L61 61 L39 61 Z M38 63 L62 63 C64 68 66 72 68 76 L32 76 C34 72 36 68 38 63 Z M28 78 L72 78 L72 82 C72 84 70 86 68 86 L32 86 C30 86 28 84 28 82 Z',
  // Knight — proud arched horse head with flowing mane
  n: 'M31 86 L31 78 C31 62 34 51 41 43 C36 41 32 36 31 31 C30 25 33 19 38 15 C44 10 52 8 59 10 C60 6 63 5 65 8 L68 14 C74 20 78 30 79 42 C80 55 78 68 75 78 L75 86 Z M42 25 C40 26.5 39.5 29.5 41 31.5 C42.5 33.5 45.5 33.5 47 32 L44 25 Z',
  // Pawn — sphere head on collared, tapered stem with flared base
  p: 'M50 12 C56.5 12 61.5 17 61.5 23.5 C61.5 30 56.5 35 50 35 C43.5 35 38.5 30 38.5 23.5 C38.5 17 43.5 12 50 12 Z M42 37 L58 37 L56 43 L44 43 Z M45 45 L55 45 L57.5 64 L42.5 64 Z M39 66 C42 65 46 64.5 50 64.5 C54 64.5 58 65 61 66 L66 76 L34 76 Z M30 78 L70 78 L70 82 C70 84 68 86 66 86 L34 86 C32 86 30 84 30 82 Z',
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
