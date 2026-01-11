import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieceType, 
  PieceColor,
} from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { MoveHistoryEntry } from './EnPensentOverlay';
import { Sparkles, Eye, Lock, Unlock, X } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Try to use highlight context if available
  let highlightContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    highlightContext = useLegendHighlight();
  } catch {
    // Context not available
  }

  const { 
    hoveredSquare, 
    setHighlightedPiece, 
    highlightedPiece,
    lockedPieces = [],
    toggleLockedPiece,
    clearLock,
  } = highlightContext || {
    hoveredSquare: null,
    setHighlightedPiece: () => {},
    highlightedPiece: null,
    lockedPieces: [],
    toggleLockedPiece: () => {},
    clearLock: () => {},
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

  // Determine if any filtering is active
  const hasActiveFilter = hoveredSquare !== null || lockedPieces.length > 0 || highlightedPiece !== null;

  // Check if a piece is highlighted from square hover
  const isHighlightedFromSquare = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (!hoveredSquare) return false;
    return hoveredSquare.pieces.some(
      p => p.pieceType === pieceType && p.pieceColor === pieceColor
    );
  };

  // Check if piece is highlighted from legend hover
  const isHighlightedFromLegend = (pieceType: PieceType, pieceColor: PieceColor) => {
    return highlightedPiece?.pieceType === pieceType && highlightedPiece?.pieceColor === pieceColor;
  };

  // Check if piece is locked
  const isLocked = (pieceType: PieceType, pieceColor: PieceColor) => {
    return lockedPieces.some(p => p.pieceType === pieceType && p.pieceColor === pieceColor);
  };

  // Check if this piece should be dimmed (when filtering is active and this piece isn't part of it)
  const shouldDim = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (!hasActiveFilter) return false;
    
    // If square is hovered, dim pieces not on that square
    if (hoveredSquare) {
      return !isHighlightedFromSquare(pieceType, pieceColor);
    }
    
    // If pieces are locked, dim non-locked pieces
    if (lockedPieces.length > 0) {
      return !isLocked(pieceType, pieceColor);
    }
    
    // If hovering legend, dim non-hovered pieces
    if (highlightedPiece) {
      return !isHighlightedFromLegend(pieceType, pieceColor);
    }
    
    return false;
  };

  const handlePieceHover = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (setHighlightedPiece && lockedPieces.length === 0) {
      setHighlightedPiece({ pieceType, pieceColor });
    }
  };

  const handlePieceLeave = () => {
    if (setHighlightedPiece && lockedPieces.length === 0) {
      setHighlightedPiece(null);
    }
  };

  // Handle touch/click to lock a piece
  const handlePieceClick = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (toggleLockedPiece) {
      toggleLockedPiece({ pieceType, pieceColor });
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
                onMouseEnter={() => handlePieceHover(piece, color)}
                onMouseLeave={handlePieceLeave}
                onClick={() => handlePieceClick(piece, color)}
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

  if (isCollapsed) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsCollapsed(false)}
        className="p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 flex items-center gap-2 hover:bg-accent/30 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-display uppercase tracking-wider">Legend</span>
      </motion.button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          {title}
        </h4>
        <div className="flex items-center gap-2">
          {moveHistory.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {moveHistory.length} moves
            </span>
          )}
          {lockedPieces.length > 0 && (
            <button 
              onClick={clearLock}
              className="p-1 rounded hover:bg-accent/50 transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Hover/Selection hint */}
      <AnimatePresence mode="wait">
        {hoveredSquare && (
          <motion.div
            key="square-hint"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[10px] text-amber-400 text-center bg-amber-400/10 rounded px-2 py-1"
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Pieces on <span className="font-mono font-bold">{hoveredSquare.square}</span>
          </motion.div>
        )}
        {lockedPieces.length > 0 && !hoveredSquare && (
          <motion.div
            key="lock-hint"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[10px] text-sky-400 text-center bg-sky-400/10 rounded px-2 py-1"
          >
            <Lock className="w-3 h-3 inline mr-1" />
            {lockedPieces.length} piece{lockedPieces.length > 1 ? 's' : ''} locked • tap to toggle
          </motion.div>
        )}
      </AnimatePresence>

      {/* Piece rows */}
      {renderPieceRow('w', 'White')}
      {renderPieceRow('b', 'Black')}

      {/* Interactive hint */}
      <p className="text-[9px] text-muted-foreground text-center italic">
        {compact ? 'Tap to lock' : 'Hover squares or tap pieces to highlight'}
      </p>
    </motion.div>
  );
};

export default LiveColorLegend;