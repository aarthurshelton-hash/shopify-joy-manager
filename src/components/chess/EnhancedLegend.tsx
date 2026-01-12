import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieceType, 
  PieceColor,
  getActivePalette,
} from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { MoveHistoryEntry } from './EnPensentOverlay';
import { 
  Sparkles, Eye, Lock, X, MapPin, Swords, GitCompare, 
  Info, Crown, Shield, Crosshair, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface EnhancedLegendProps {
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

// Rich piece descriptions for tooltips
const PIECE_DESCRIPTIONS: Record<PieceType, { role: string; tactical: string; icon: typeof Crown }> = {
  k: {
    role: 'The monarch of the board',
    tactical: 'Protect at all costs. In endgames, becomes an attacking piece.',
    icon: Crown,
  },
  q: {
    role: 'The most powerful piece',
    tactical: 'Combines rook and bishop movement. Dominates open positions.',
    icon: Crown,
  },
  r: {
    role: 'The fortress defender',
    tactical: 'Controls files and ranks. Powerful in endgames on open files.',
    icon: Shield,
  },
  b: {
    role: 'The diagonal striker',
    tactical: 'Controls long diagonals. Bishop pair gives advantage in open games.',
    icon: Crosshair,
  },
  n: {
    role: 'The tactical jumper',
    tactical: 'Only piece that can jump. Excels in closed positions and forks.',
    icon: Target,
  },
  p: {
    role: 'The soul of chess',
    tactical: 'Controls the center. Advanced pawns create passed pawn threats.',
    icon: Shield,
  },
};

// Mode descriptions for the tabs
const MODE_DESCRIPTIONS = {
  pieces: {
    title: 'Piece Colors',
    description: 'Each unique color represents a chess piece. Hover or tap to see where each piece traveled during the game.',
    tip: 'Click any piece to lock its highlight on the board',
  },
  territory: {
    title: 'Territory Heatmap',
    description: 'Visualizes board control based on piece visits. Brighter areas show higher activity.',
    tip: 'Compare white vs black dominance across the board',
  },
  battle: {
    title: 'Battle Analysis',
    description: 'Head-to-head comparison of piece activity between white and black.',
    tip: 'Identify the MVP piece that controlled the most squares',
  },
  compare: {
    title: 'Compare Mode',
    description: 'Select two pieces to see where their paths overlap on the board.',
    tip: 'Great for analyzing piece coordination and control conflicts',
  },
};

export const EnhancedLegend: React.FC<EnhancedLegendProps> = ({
  whitePalette,
  blackPalette,
  moveHistory = [],
  compact = false,
  title = 'Color Legend',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMode, setActiveMode] = useState<'pieces' | 'territory' | 'battle'>('pieces');
  const palette = getActivePalette();
  const theme = palette.legendTheme;
  
  // Sync with visualization state store
  const { setShowTerritory, setLockedPieces: setStoreLockedPieces } = useVisualizationStateStore();
  
  // Sync territory mode with store
  useEffect(() => {
    setShowTerritory(activeMode === 'territory');
  }, [activeMode, setShowTerritory]);
  
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
    compareMode = false,
    toggleCompareMode,
    clearLock,
  } = highlightContext || {
    hoveredSquare: null,
    setHighlightedPiece: () => {},
    highlightedPiece: null,
    lockedPieces: [],
    toggleLockedPiece: () => {},
    compareMode: false,
    toggleCompareMode: () => {},
    clearLock: () => {},
  };

  // Calculate piece activity from move history
  const pieceActivity = useMemo(() => {
    const activity = new Map<string, number>();
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const colors: PieceColor[] = ['w', 'b'];
    
    for (const color of colors) {
      for (const piece of pieceTypes) {
        activity.set(`${color}-${piece}`, 0);
      }
    }
    
    for (const move of moveHistory) {
      const key = `${move.color}-${move.piece}`;
      activity.set(key, (activity.get(key) || 0) + 1);
    }
    
    return activity;
  }, [moveHistory]);

  // Find MVP piece
  const mvpPiece = useMemo(() => {
    let maxActivity = 0;
    let mvp: { piece: PieceType; color: PieceColor } | null = null;
    
    pieceActivity.forEach((count, key) => {
      if (count > maxActivity) {
        maxActivity = count;
        const [color, piece] = key.split('-') as [PieceColor, PieceType];
        mvp = { piece, color };
      }
    });
    
    return mvp;
  }, [pieceActivity]);

  // Calculate territory heatmap data
  const territoryData = useMemo(() => {
    const whiteControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    const blackControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    let maxWhite = 0;
    let maxBlack = 0;
    
    for (const move of moveHistory) {
      const file = move.square.charCodeAt(0) - 97;
      const rank = parseInt(move.square[1]) - 1;
      
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

  const hasActiveFilter = hoveredSquare !== null || lockedPieces.length > 0 || highlightedPiece !== null;

  const isHighlightedFromSquare = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (!hoveredSquare) return false;
    return hoveredSquare.pieces.some(
      p => p.pieceType === pieceType && p.pieceColor === pieceColor
    );
  };

  const isHighlightedFromLegend = (pieceType: PieceType, pieceColor: PieceColor) => {
    return highlightedPiece?.pieceType === pieceType && highlightedPiece?.pieceColor === pieceColor;
  };

  const isLocked = (pieceType: PieceType, pieceColor: PieceColor) => {
    return lockedPieces.some(p => p.pieceType === pieceType && p.pieceColor === pieceColor);
  };

  const getLockedIndex = (pieceType: PieceType, pieceColor: PieceColor) => {
    return lockedPieces.findIndex(p => p.pieceType === pieceType && p.pieceColor === pieceColor);
  };

  const shouldDim = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (!hasActiveFilter) return false;
    if (hoveredSquare) return !isHighlightedFromSquare(pieceType, pieceColor);
    if (lockedPieces.length > 0) return !isLocked(pieceType, pieceColor);
    if (highlightedPiece) return !isHighlightedFromLegend(pieceType, pieceColor);
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

  const handlePieceClick = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (toggleLockedPiece) {
      toggleLockedPiece({ pieceType, pieceColor });
    }
  };

  const renderPieceRow = (color: PieceColor, label: string) => {
    const pal = color === 'w' ? whitePalette : blackPalette;
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-display uppercase tracking-wider ${
            color === 'w' ? 'text-sky-400' : 'text-rose-400'
          }`}>
            {color === 'w' ? theme?.whiteEmoji || '❄️' : theme?.blackEmoji || '🔥'} {label}
          </span>
        </div>
        <div className={`grid ${compact ? 'grid-cols-6' : 'grid-cols-3'} gap-1`}>
          {pieceTypes.map(piece => {
            const fromSquare = isHighlightedFromSquare(piece, color);
            const fromLegend = isHighlightedFromLegend(piece, color);
            const locked = isLocked(piece, color);
            const lockedIndex = getLockedIndex(piece, color);
            const dimmed = shouldDim(piece, color);
            const isHighlighted = fromSquare || fromLegend || locked;
            const activity = pieceActivity.get(`${color}-${piece}`) || 0;
            const hexColor = pal[piece] || '#888';
            const isMvp = mvpPiece?.piece === piece && mvpPiece?.color === color;
            const pieceDesc = PIECE_DESCRIPTIONS[piece];
            const PieceIcon = pieceDesc.icon;

            return (
              <Tooltip key={`${color}-${piece}`}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`
                      relative flex items-center gap-1.5 p-1.5 rounded-md transition-all cursor-pointer
                      touch-manipulation select-none
                      ${isHighlighted 
                        ? 'bg-primary/20 ring-2 ring-primary shadow-lg' 
                        : 'hover:bg-accent/30'
                      }
                      ${fromSquare ? 'ring-2 ring-amber-400 bg-amber-400/20' : ''}
                      ${locked ? (lockedIndex === 0 ? 'ring-2 ring-sky-400 bg-sky-400/20' : 'ring-2 ring-rose-400 bg-rose-400/20') : ''}
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

                    {/* MVP badge */}
                    {isMvp && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Crown className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}

                    {/* Activity indicator */}
                    {activity > 0 && !isMvp && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                        {activity > 99 ? '99+' : activity}
                      </span>
                    )}

                    {/* Lock indicator */}
                    {locked && (
                      <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        lockedIndex === 0 ? 'bg-sky-500' : 'bg-rose-500'
                      }`}>
                        {lockedIndex + 1}
                      </span>
                    )}

                    {/* Highlight glow */}
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
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px] p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded shadow-sm"
                        style={{ backgroundColor: hexColor }}
                      />
                      <span className="text-lg">{PIECE_SYMBOLS[piece][color]}</span>
                      <span className="font-semibold">{PIECE_NAMES[piece]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{pieceDesc.role}</p>
                    <p className="text-xs leading-relaxed">{pieceDesc.tactical}</p>
                    {activity > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                        <PieceIcon className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {activity} move{activity !== 1 ? 's' : ''} this game
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      Click to lock • Double-click to compare
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
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
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </motion.button>
    );
  }

  return (
    <TooltipProvider>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={clearLock}
                    className="p-1 rounded hover:bg-accent/50 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Clear selection</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 rounded hover:bg-accent/50 transition-colors"
                >
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Collapse legend</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mode tabs with tooltips */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveMode('pieces')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
                  activeMode === 'pieces' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/30'
                }`}
              >
                <Eye className="w-3 h-3" />
                Pieces
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" />
                  {MODE_DESCRIPTIONS.pieces.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {MODE_DESCRIPTIONS.pieces.description}
                </p>
                <p className="text-[10px] text-primary mt-1 italic">
                  💡 {MODE_DESCRIPTIONS.pieces.tip}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveMode('territory')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
                  activeMode === 'territory' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/30'
                }`}
              >
                <MapPin className="w-3 h-3" />
                Territory
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {MODE_DESCRIPTIONS.territory.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {MODE_DESCRIPTIONS.territory.description}
                </p>
                <p className="text-[10px] text-primary mt-1 italic">
                  💡 {MODE_DESCRIPTIONS.territory.tip}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveMode('battle')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
                  activeMode === 'battle' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/30'
                }`}
              >
                <Swords className="w-3 h-3" />
                Battle
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-primary" />
                  {MODE_DESCRIPTIONS.battle.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {MODE_DESCRIPTIONS.battle.description}
                </p>
                <p className="text-[10px] text-primary mt-1 italic">
                  💡 {MODE_DESCRIPTIONS.battle.tip}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Compare mode toggle */}
        {toggleCompareMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={compareMode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={toggleCompareMode}
                className="w-full h-7 text-[10px] gap-1"
              >
                <GitCompare className="w-3 h-3" />
                {compareMode ? 'Exit Compare' : 'Compare Pieces'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-3">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4 text-primary" />
                  {MODE_DESCRIPTIONS.compare.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {MODE_DESCRIPTIONS.compare.description}
                </p>
                <p className="text-[10px] text-primary mt-1 italic">
                  💡 {MODE_DESCRIPTIONS.compare.tip}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Hover/Selection hints */}
        <AnimatePresence mode="wait">
          {hoveredSquare && (
            <motion.div
              key="square-hint"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] text-amber-400 text-center bg-amber-400/10 rounded px-2 py-1.5"
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Viewing pieces on <span className="font-mono font-bold">{hoveredSquare.square}</span>
            </motion.div>
          )}
          {lockedPieces.length > 0 && !hoveredSquare && (
            <motion.div
              key="lock-hint"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] text-sky-400 text-center bg-sky-400/10 rounded px-2 py-1.5"
            >
              <Lock className="w-3 h-3 inline mr-1" />
              {lockedPieces.length} piece{lockedPieces.length > 1 ? 's' : ''} locked
              {compareMode && lockedPieces.length === 2 && ' • Showing overlap'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content based on active mode */}
        <AnimatePresence mode="wait">
          {activeMode === 'territory' ? (
            <motion.div
              key="territory"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              {/* Territory control bar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-1 cursor-help">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-sky-400 font-semibold">{theme?.whiteName || 'White'} {territoryData.whitePercent}%</span>
                      <span className="text-rose-400 font-semibold">{theme?.blackName || 'Black'} {territoryData.blackPercent}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden bg-muted/50 flex">
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
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] p-3">
                  <div className="space-y-2">
                    <div className="font-semibold">Board Control</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This bar shows the percentage of total piece movement each side contributed to.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <div className="text-sky-400 font-bold text-lg">{territoryData.whitePercent}%</div>
                        <div className="text-[10px] text-muted-foreground">White activity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-rose-400 font-bold text-lg">{territoryData.blackPercent}%</div>
                        <div className="text-[10px] text-muted-foreground">Black activity</div>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Mini heatmaps */}
              <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
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
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[180px] p-2">
                    <p className="text-xs">
                      White piece activity heatmap. Brighter squares indicate more visits.
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
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
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[180px] p-2">
                    <p className="text-xs">
                      Black piece activity heatmap. Brighter squares indicate more visits.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          ) : activeMode === 'battle' ? (
            <motion.div
              key="battle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              {/* MVP piece highlight */}
              {mvpPiece && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 cursor-help">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-display uppercase tracking-wider text-amber-400">MVP</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div
                          className="w-4 h-4 rounded shadow-sm"
                          style={{ backgroundColor: (mvpPiece.color === 'w' ? whitePalette : blackPalette)[mvpPiece.piece] }}
                        />
                        <span className="text-base">{PIECE_SYMBOLS[mvpPiece.piece][mvpPiece.color]}</span>
                        <span className="text-xs">{PIECE_NAMES[mvpPiece.piece]}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] p-3">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        Most Valuable Piece
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The {PIECE_NAMES[mvpPiece.piece]} was the most active piece in this game with{' '}
                        {pieceActivity.get(`${mvpPiece.color}-${mvpPiece.piece}`)} moves.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Piece battles */}
              <div className="space-y-2">
                {(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map(piece => {
                  const whiteActivity = pieceActivity.get(`w-${piece}`) || 0;
                  const blackActivity = pieceActivity.get(`b-${piece}`) || 0;
                  const total = whiteActivity + blackActivity || 1;
                  const whitePercent = Math.round((whiteActivity / total) * 100);
                  
                  return (
                    <Tooltip key={piece}>
                      <TooltipTrigger asChild>
                        <div className="space-y-0.5 cursor-help">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1 text-sky-400">
                              <span style={{ color: whitePalette[piece] }}>{PIECE_SYMBOLS[piece].w}</span>
                              {whiteActivity}
                            </span>
                            <span className="text-muted-foreground font-display uppercase tracking-wider">
                              {PIECE_NAMES[piece]}
                            </span>
                            <span className="flex items-center gap-1 text-rose-400">
                              {blackActivity}
                              <span style={{ color: blackPalette[piece] }}>{PIECE_SYMBOLS[piece].b}</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-muted/50 flex">
                            <motion.div
                              className="h-full"
                              style={{ backgroundColor: whitePalette[piece] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${whitePercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                            <motion.div
                              className="h-full"
                              style={{ backgroundColor: blackPalette[piece] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${100 - whitePercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] p-2">
                        <p className="text-xs">
                          <span className="text-sky-400">White {PIECE_NAMES[piece]}</span>: {whiteActivity} moves vs{' '}
                          <span className="text-rose-400">Black {PIECE_NAMES[piece]}</span>: {blackActivity} moves
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
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
              {renderPieceRow('w', theme?.whiteName || 'White — Cold')}
              {renderPieceRow('b', theme?.blackName || 'Black — Hot')}

              {/* Interactive hint */}
              <p className="text-[9px] text-muted-foreground text-center italic">
                {compact ? 'Tap to lock • Hold for info' : 'Hover for info • Click to lock piece'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
};

export default EnhancedLegend;
