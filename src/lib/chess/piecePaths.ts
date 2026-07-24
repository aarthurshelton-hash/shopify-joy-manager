/**
 * Chess piece SVG path data and utilities
 * Shared between ChessPieceIcon component and canvas renderers
 */

import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

/**
 * SVG path data for each piece type.
 * Designed on a 100x100 viewBox with the piece centered.
 * These are simplified but distinctive silhouettes that read clearly at any size.
 */
export const PIECE_PATHS: Record<PieceType, string> = {
  // King - cross on top, wide base
  k: 'M50 8 L50 18 M44 13 L56 13 M50 18 C42 18 36 24 36 32 C36 38 39 42 44 44 L30 52 C26 54 24 58 24 64 L24 72 L76 72 L76 64 C76 58 74 54 70 52 L56 44 C61 42 64 38 64 32 C64 24 58 18 50 18 Z M22 74 L78 74 L78 82 L22 82 Z',
  // Queen - crown with points, wide base
  q: 'M50 6 L46 16 L40 10 L38 22 L30 16 L30 30 L22 26 L26 38 L18 36 L24 46 L76 46 L82 36 L74 38 L70 26 L62 30 L62 16 L54 22 L50 6 Z M24 48 L76 48 L76 56 L24 56 Z M22 58 L78 58 L78 68 L22 68 Z M20 70 L80 70 L80 80 L20 80 Z',
  // Rook - castle battlements, rectangular
  r: 'M28 8 L28 18 L36 18 L36 8 L44 8 L44 18 L52 18 L52 8 L60 8 L60 18 L68 18 L68 8 L72 8 L72 28 L28 28 Z M30 30 L70 30 L68 50 L32 50 Z M28 52 L72 52 L72 60 L28 60 Z M26 62 L74 62 L74 72 L26 72 Z M22 74 L78 74 L78 84 L22 84 Z',
  // Bishop - mitre with slit, curved base
  b: 'M50 6 C44 6 40 12 40 20 C40 26 44 30 48 32 L48 38 C40 40 34 46 32 54 L32 60 L68 60 L68 54 C66 46 60 40 52 38 L52 32 C56 30 60 26 60 20 C60 12 56 6 50 6 Z M46 14 L54 14 L50 20 Z M30 62 L70 62 L70 70 L30 70 Z M26 72 L74 72 L74 82 L26 82 Z',
  // Knight - horse head silhouette
  n: 'M32 84 L32 72 C32 60 34 52 38 46 L30 40 C26 38 24 34 26 30 L34 20 C38 14 44 10 50 10 C58 10 64 16 66 24 L68 40 C70 48 72 58 72 68 L72 72 L68 84 Z M40 28 C38 30 38 34 40 36 L46 34 L44 28 Z M34 72 L66 72 L66 76 L34 76 Z',
  // Pawn - simple round head, tapered body
  p: 'M50 8 C44 8 40 14 40 22 C40 28 44 32 50 32 C56 32 60 28 60 22 C60 14 56 8 50 8 Z M42 34 L58 34 L56 48 L44 48 Z M40 50 L60 50 L60 58 L40 58 Z M36 60 L64 60 L66 72 L34 72 Z M30 74 L70 74 L70 84 L30 84 Z',
};

export const DEFAULT_FILL: Record<PieceColor, string> = {
  w: '#ffffff',
  b: '#1a1a1a',
};

export const DEFAULT_STROKE: Record<PieceColor, string> = {
  w: '#1a1a1a',
  b: '#ffffff',
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
    stroke: color === 'w' ? '#1a1a1a' : '#ffffff',
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
