/**
 * Piece Row Component for Color Legend
 * Extracted from LiveColorLegend for modularity
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

const PIECE_SYMBOLS: Record<PieceType, { w: string; b: string }> = {
  k: { w: '♚', b: '♔' },
  q: { w: '♛', b: '♕' },
  r: { w: '♜', b: '♖' },
  b: { w: '♝', b: '♗' },
  n: { w: '♞', b: '♘' },
  p: { w: '♟', b: '♙' },
};

const PIECE_NAMES: Record<PieceType, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
};

interface PieceRowProps {
  color: PieceColor;
  label: string;
  palette: Record<string, string>;
  compact?: boolean;
  pieceActivity: Map<string, number>;
  isHighlightedFromSquare: (piece: PieceType, color: PieceColor) => boolean;
  isHighlightedFromLegend: (piece: PieceType, color: PieceColor) => boolean;
  isLocked: (piece: PieceType, color: PieceColor) => boolean;
  shouldDim: (piece: PieceType, color: PieceColor) => boolean;
  onPieceHover: (piece: PieceType, color: PieceColor) => void;
  onPieceLeave: () => void;
  onPieceClick: (piece: PieceType, color: PieceColor) => void;
}

export const PieceRow: React.FC<PieceRowProps> = ({
  color,
  label,
  palette,
  compact = false,
  pieceActivity,
  isHighlightedFromSquare,
  isHighlightedFromLegend,
  isLocked,
  shouldDim,
  onPieceHover,
  onPieceLeave,
  onPieceClick,
}) => {
  const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-display uppercase tracking-wider ${
          color === 'w' ? 'text-sky-400' : 'text-rose-400'
        }`}>
          {color === 'w' ? '👑' : '🖤'} {label}
        </span>
      </div>
      <div className={`grid ${compact ? 'grid-cols-6' : 'grid-cols-3'} gap-1`}>
        {pieceTypes.map(piece => {
          const fromSquare = isHighlightedFromSquare(piece, color);
          const fromLegend = isHighlightedFromLegend(piece, color);
          const locked = isLocked(piece, color);
          const dimmed = shouldDim(piece, color);
          const isHighlighted = fromSquare || fromLegend || locked;
          const activity = pieceActivity.get(`${color}-${piece}`) || 0;
          const hexColor = palette[piece] || '#888';

          return (
            <motion.div
              key={`${color}-${piece}`}
              className={`
                relative flex items-center gap-1.5 p-1.5 rounded-md transition-all cursor-pointer
                touch-manipulation select-none
                ${isHighlighted 
                  ? 'bg-primary/20 ring-2 ring-primary shadow-lg' 
                  : 'hover:bg-accent/30'
                }
                ${fromSquare ? 'ring-2 ring-amber-400 bg-amber-400/20' : ''}
                ${locked ? 'ring-2 ring-sky-400 bg-sky-400/20' : ''}
                ${dimmed ? 'opacity-20' : 'opacity-100'}
              `}
              onMouseEnter={() => onPieceHover(piece, color)}
              onMouseLeave={onPieceLeave}
              onClick={() => onPieceClick(piece, color)}
              animate={{ 
                scale: isHighlighted ? 1.05 : 1,
                opacity: dimmed ? 0.2 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Color swatch */}
              <div
                className={`w-4 h-4 rounded shadow-sm shrink-0 transition-transform ${
                  isHighlighted ? 'scale-110 ring-1 ring-white/50' : ''
                }`}
                style={{ backgroundColor: hexColor }}
              />
              
              {/* Piece symbol */}
              <span 
                className="text-base shrink-0"
                style={{ color: hexColor }}
              >
                {PIECE_SYMBOLS[piece][color]}
              </span>
              
              {!compact && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {PIECE_NAMES[piece]}
                </span>
              )}

              {/* Activity indicator */}
              {activity > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                  {activity > 99 ? '99+' : activity}
                </span>
              )}

              {/* Lock indicator */}
              {locked && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                  <Lock className="w-2 h-2 text-white" />
                </span>
              )}

              {/* Highlight glow effect when square is hovered */}
              <AnimatePresence>
                {fromSquare && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 rounded-md pointer-events-none"
                    style={{
                      boxShadow: `0 0 12px 2px ${hexColor}80`,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PieceRow;
