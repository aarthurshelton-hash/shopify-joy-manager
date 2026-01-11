import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getPieceColorLegend, 
  getActivePalette, 
  PieceType, 
  PieceColor,
  colorPalettes 
} from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { MoveHistoryEntry } from './EnPensentOverlay';
import { Sparkles, Eye, Crown } from 'lucide-react';

interface LiveColorLegendProps {
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  moveHistory?: MoveHistoryEntry[];
  compact?: boolean;
  title?: string;
}

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

export const LiveColorLegend: React.FC<LiveColorLegendProps> = ({
  whitePalette,
  blackPalette,
  moveHistory = [],
  compact = false,
  title = 'Color Legend',
}) => {
  // Try to use highlight context if available
  let highlightContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    highlightContext = useLegendHighlight();
  } catch {
    // Context not available
  }

  const { hoveredSquare, setHighlightedPiece, highlightedPiece } = highlightContext || {
    hoveredSquare: null,
    setHighlightedPiece: () => {},
    highlightedPiece: null,
  };

  // Calculate piece activity from move history
  const pieceActivity = useMemo(() => {
    const activity = new Map<string, number>();
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const colors: PieceColor[] = ['w', 'b'];
    
    // Initialize
    for (const color of colors) {
      for (const piece of pieceTypes) {
        activity.set(`${color}-${piece}`, 0);
      }
    }
    
    // Count from move history
    for (const move of moveHistory) {
      const key = `${move.color}-${move.piece}`;
      activity.set(key, (activity.get(key) || 0) + 1);
    }
    
    return activity;
  }, [moveHistory]);

  // Check if a piece is highlighted from square hover
  const isHighlightedFromSquare = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (!hoveredSquare) return false;
    return hoveredSquare.pieces.some(
      p => p.pieceType === pieceType && p.pieceColor === pieceColor
    );
  };

  const isHighlightedFromLegend = (pieceType: PieceType, pieceColor: PieceColor) => {
    return highlightedPiece?.pieceType === pieceType && highlightedPiece?.pieceColor === pieceColor;
  };

  const handlePieceHover = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (setHighlightedPiece) {
      setHighlightedPiece({ pieceType, pieceColor });
    }
  };

  const handlePieceLeave = () => {
    if (setHighlightedPiece) {
      setHighlightedPiece(null);
    }
  };

  const renderPieceRow = (color: PieceColor, label: string) => {
    const palette = color === 'w' ? whitePalette : blackPalette;
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
            const isFromSquare = isHighlightedFromSquare(piece, color);
            const isFromLegend = isHighlightedFromLegend(piece, color);
            const isHighlighted = isFromSquare || isFromLegend;
            const activity = pieceActivity.get(`${color}-${piece}`) || 0;
            const hexColor = palette[piece] || '#888';

            return (
              <motion.div
                key={`${color}-${piece}`}
                className={`
                  relative flex items-center gap-1.5 p-1.5 rounded-md transition-all cursor-pointer
                  ${isHighlighted 
                    ? 'bg-primary/20 ring-2 ring-primary shadow-lg scale-105' 
                    : 'hover:bg-accent/30'
                  }
                  ${isFromSquare ? 'ring-2 ring-amber-400 bg-amber-400/20' : ''}
                `}
                onMouseEnter={() => handlePieceHover(piece, color)}
                onMouseLeave={handlePieceLeave}
                animate={isFromSquare ? { 
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{ duration: 0.3 }}
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

                {/* Highlight glow effect when square is hovered */}
                <AnimatePresence>
                  {isFromSquare && (
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

  return (
    <div className="p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          {title}
        </h4>
        {moveHistory.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {moveHistory.length} moves
          </span>
        )}
      </div>

      {/* Hover hint */}
      {hoveredSquare && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-amber-400 text-center bg-amber-400/10 rounded px-2 py-1"
        >
          <Eye className="w-3 h-3 inline mr-1" />
          Showing pieces on <span className="font-mono font-bold">{hoveredSquare.square}</span>
        </motion.div>
      )}

      {/* Piece rows */}
      {renderPieceRow('w', 'White')}
      {renderPieceRow('b', 'Black')}

      {/* Interactive hint */}
      <p className="text-[9px] text-muted-foreground text-center italic">
        Hover squares to see piece history
      </p>
    </div>
  );
};

export default LiveColorLegend;