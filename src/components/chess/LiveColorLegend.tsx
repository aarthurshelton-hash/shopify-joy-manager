import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieceType, 
  PieceColor,
} from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { MoveHistoryEntry } from './EnPensentOverlay';
import { Sparkles, Eye, Lock, X, MapPin } from 'lucide-react';

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
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Sync with visualization state store
  const { setShowTerritory, setLockedPieces: setStoreLockedPieces } = useVisualizationStateStore();
  
  // Sync territory mode with store
  useEffect(() => {
    setShowTerritory(showHeatmap);
  }, [showHeatmap, setShowTerritory]);
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

  // Calculate territory heatmap data
  const territoryData = useMemo(() => {
    // Create 8x8 grid for each side's territory control
    const whiteControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    const blackControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    let maxWhite = 0;
    let maxBlack = 0;
    
    // Count visits per square per side
    for (const move of moveHistory) {
      const file = move.square.charCodeAt(0) - 97; // a=0, h=7
      const rank = parseInt(move.square[1]) - 1; // 1=0, 8=7
      
      if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
        if (move.color === 'w') {
          whiteControl[7 - rank][file]++;
          maxWhite = Math.max(maxWhite, whiteControl[7 - rank][file]);
        } else {
          blackControl[7 - rank][file]++;
          maxBlack = Math.max(maxBlack, blackControl[7 - rank][file]);
        }
      }
    }
    
    // Calculate overall control percentages
    let whiteTotal = 0;
    let blackTotal = 0;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        whiteTotal += whiteControl[r][f];
        blackTotal += blackControl[r][f];
      }
    }
    const total = whiteTotal + blackTotal || 1;
    
    return {
      whiteControl,
      blackControl,
      maxWhite: maxWhite || 1,
      maxBlack: maxBlack || 1,
      whitePercent: Math.round((whiteTotal / total) * 100),
      blackPercent: Math.round((blackTotal / total) * 100),
    };
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

      {/* Toggle between legend colors and territory heatmap */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => setShowHeatmap(false)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
            !showHeatmap ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/30'
          }`}
        >
          <Eye className="w-3 h-3" />
          Show Pieces
        </button>
        <button
          onClick={() => setShowHeatmap(true)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
            showHeatmap ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/30'
          }`}
        >
          <MapPin className="w-3 h-3" />
          Territory
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showHeatmap ? (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {/* Territory control bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-sky-400 font-semibold">👑 White {territoryData.whitePercent}%</span>
                <span className="text-rose-400 font-semibold">🖤 Black {territoryData.blackPercent}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-muted/50 flex">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${territoryData.whitePercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${territoryData.blackPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Side-by-side heatmaps */}
            <div className="grid grid-cols-2 gap-2">
              {/* White territory */}
              <div className="space-y-1">
                <span className="text-[9px] text-sky-400 font-display uppercase tracking-wider">White Control</span>
                <div className="aspect-square grid grid-cols-8 gap-px bg-border/30 rounded overflow-hidden">
                  {territoryData.whiteControl.map((row, r) =>
                    row.map((value, f) => {
                      const intensity = value / territoryData.maxWhite;
                      return (
                        <div
                          key={`w-${r}-${f}`}
                          className="aspect-square transition-colors"
                          style={{
                            backgroundColor: intensity > 0 
                              ? `rgba(56, 189, 248, ${0.2 + intensity * 0.8})` 
                              : (r + f) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                          }}
                          title={`${String.fromCharCode(97 + f)}${8 - r}: ${value} visits`}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Black territory */}
              <div className="space-y-1">
                <span className="text-[9px] text-rose-400 font-display uppercase tracking-wider">Black Control</span>
                <div className="aspect-square grid grid-cols-8 gap-px bg-border/30 rounded overflow-hidden">
                  {territoryData.blackControl.map((row, r) =>
                    row.map((value, f) => {
                      const intensity = value / territoryData.maxBlack;
                      return (
                        <div
                          key={`b-${r}-${f}`}
                          className="aspect-square transition-colors"
                          style={{
                            backgroundColor: intensity > 0 
                              ? `rgba(251, 113, 133, ${0.2 + intensity * 0.8})` 
                              : (r + f) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                          }}
                          title={`${String.fromCharCode(97 + f)}${8 - r}: ${value} visits`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Combined heatmap */}
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground font-display uppercase tracking-wider">Combined Dominance</span>
              <div className="aspect-[2/1] grid grid-cols-8 gap-px bg-border/30 rounded overflow-hidden">
                {territoryData.whiteControl.map((row, r) =>
                  row.map((wValue, f) => {
                    const bValue = territoryData.blackControl[r][f];
                    const total = wValue + bValue;
                    if (total === 0) {
                      return (
                        <div
                          key={`c-${r}-${f}`}
                          className="aspect-square"
                          style={{
                            backgroundColor: (r + f) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                          }}
                        />
                      );
                    }
                    const whiteRatio = wValue / total;
                    const contested = Math.min(wValue, bValue) / Math.max(wValue, bValue, 1);
                    
                    // Purple for contested, sky for white dominant, rose for black dominant
                    let color: string;
                    if (contested > 0.5) {
                      color = `rgba(168, 85, 247, ${0.4 + (total / (territoryData.maxWhite + territoryData.maxBlack)) * 0.6})`;
                    } else if (whiteRatio > 0.5) {
                      color = `rgba(56, 189, 248, ${0.3 + whiteRatio * 0.7})`;
                    } else {
                      color = `rgba(251, 113, 133, ${0.3 + (1 - whiteRatio) * 0.7})`;
                    }
                    
                    return (
                      <div
                        key={`c-${r}-${f}`}
                        className="aspect-square transition-colors"
                        style={{ backgroundColor: color }}
                        title={`${String.fromCharCode(97 + f)}${8 - r}: W:${wValue} B:${bValue}`}
                      />
                    );
                  })
                )}
              </div>
              <div className="flex justify-center gap-3 text-[8px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-sky-400" /> White
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-purple-500" /> Contested
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-rose-400" /> Black
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pieces"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {/* Piece rows */}
            {renderPieceRow('w', 'White')}
            {renderPieceRow('b', 'Black')}

            {/* Interactive hint */}
            <p className="text-[9px] text-muted-foreground text-center italic">
              {compact ? 'Tap to lock' : 'Hover squares or tap pieces to highlight'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LiveColorLegend;