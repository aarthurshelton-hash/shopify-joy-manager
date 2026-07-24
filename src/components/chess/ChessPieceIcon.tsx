/**
 * ChessPieceIcon - Centralized custom SVG chess piece renderer
 *
 * Replaces all unicode chess symbols (♔♕♖♗♘♙♚♛♜♝♞♟) across the site
 * with a consistent, branded En Pensent design.
 *
 * Usage:
 *   <ChessPieceIcon type="k" color="w" size={24} />
 *   <ChessPieceIcon type="q" color="b" size={48} hexColor="#DC2626" />
 *
 * For canvas rendering (GIF export), use drawPieceOnCanvas() which
 * renders the same SVG paths onto a 2D canvas context.
 */

import React from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { PIECE_PATHS, DEFAULT_FILL, DEFAULT_STROKE } from '@/lib/chess/piecePaths';

export interface ChessPieceIconProps {
  type: PieceType;
  color: PieceColor;
  size?: number;
  /** Override fill color (defaults to white=#ffffff or black=#1a1a1a) */
  hexColor?: string;
  /** Override stroke color (defaults to opposite of fill) */
  strokeColor?: string;
  /** Opacity 0-1 */
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ChessPieceIcon: React.FC<ChessPieceIconProps> = ({
  type,
  color,
  size = 24,
  hexColor,
  strokeColor,
  opacity = 1,
  className,
  style,
}) => {
  const fill = hexColor || DEFAULT_FILL[color];
  const stroke = strokeColor || DEFAULT_STROKE[color];
  const path = PIECE_PATHS[type];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, ...style }}
      aria-label={`${color === 'w' ? 'White' : 'Black'} ${type}`}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ChessPieceIcon;
