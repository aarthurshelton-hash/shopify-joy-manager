import React, { useMemo } from 'react';
import { getPieceColorLegend, getActivePalette, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { SquareData } from '@/lib/chess/gameSimulator';
import { Lock, Unlock, GitCompare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColorLegendProps {
  interactive?: boolean;
  board?: SquareData[][];
}

interface PieceStats {
  squareCount: number;
  visitCount: number;
  percentage: number;
}

const ColorLegend: React.FC<ColorLegendProps> = ({ interactive = true, board }) => {
  const legend = getPieceColorLegend();
  const palette = getActivePalette();
  const theme = palette.legendTheme;
  
  // Try to use highlight context if available (wrapped in provider)
  let highlightContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    highlightContext = useLegendHighlight();
  } catch {
    // Context not available, that's okay - just won't be interactive
  }
  
  const { 
    highlightedPiece, 
    lockedPieces = [], 
    compareMode = false,
    setHighlightedPiece, 
    toggleLockedPiece, 
    toggleCompareMode,
    clearLock 
  } = highlightContext || { 
    highlightedPiece: null,
    lockedPieces: [],
    compareMode: false,
    setHighlightedPiece: () => {},
    toggleLockedPiece: () => {},
    toggleCompareMode: () => {},
    clearLock: () => {}
  };
  
  // Calculate stats for each piece type
  const pieceStats = useMemo(() => {
    if (!board) return new Map<string, PieceStats>();
    
    const stats = new Map<string, PieceStats>();
    const totalSquares = 64;
    
    // Initialize all piece types
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const colors: PieceColor[] = ['w', 'b'];
    
    for (const color of colors) {
      for (const piece of pieceTypes) {
        stats.set(`${color}-${piece}`, { squareCount: 0, visitCount: 0, percentage: 0 });
      }
    }
    
    // Count visits
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        const visitedBy = new Set<string>();
        
        for (const visit of square.visits) {
          const key = `${visit.color}-${visit.piece}`;
          const existing = stats.get(key)!;
          existing.visitCount++;
          
          // Track unique squares visited
          if (!visitedBy.has(key)) {
            visitedBy.add(key);
            existing.squareCount++;
          }
        }
      }
    }
    
    // Calculate percentages
    for (const [key, stat] of stats) {
      stat.percentage = Math.round((stat.squareCount / totalSquares) * 100);
    }
    
    return stats;
  }, [board]);

  // Calculate overlap stats for compare mode
  const overlapStats = useMemo(() => {
    if (!board || !compareMode || lockedPieces.length !== 2) return null;
    
    const [piece1, piece2] = lockedPieces;
    let overlapCount = 0;
    let piece1Only = 0;
    let piece2Only = 0;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        const hasPiece1 = square.visits.some(
          v => v.piece === piece1.pieceType && v.color === piece1.pieceColor
        );
        const hasPiece2 = square.visits.some(
          v => v.piece === piece2.pieceType && v.color === piece2.pieceColor
        );
        
        if (hasPiece1 && hasPiece2) overlapCount++;
        else if (hasPiece1) piece1Only++;
        else if (hasPiece2) piece2Only++;
      }
    }
    
    return { overlapCount, piece1Only, piece2Only };
  }, [board, compareMode, lockedPieces]);
  
  // Group by piece color
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');

  const handlePieceHover = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (interactive && setHighlightedPiece && lockedPieces.length === 0) {
      setHighlightedPiece({ pieceType, pieceColor });
    }
  };

  const handlePieceLeave = () => {
    if (interactive && setHighlightedPiece && lockedPieces.length === 0) {
      setHighlightedPiece(null);
    }
  };

  const handlePieceClick = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (interactive && toggleLockedPiece) {
      toggleLockedPiece({ pieceType, pieceColor });
    }
  };

  const isHighlighted = (pieceType: PieceType, pieceColor: PieceColor) => {
    return highlightedPiece?.pieceType === pieceType && highlightedPiece?.pieceColor === pieceColor;
  };

  const isLocked = (pieceType: PieceType, pieceColor: PieceColor) => {
    return lockedPieces.some(p => p.pieceType === pieceType && p.pieceColor === pieceColor);
  };

  const getLockedIndex = (pieceType: PieceType, pieceColor: PieceColor) => {
    return lockedPieces.findIndex(p => p.pieceType === pieceType && p.pieceColor === pieceColor);
  };

  const getStats = (pieceType: PieceType, pieceColor: PieceColor): PieceStats | null => {
    return pieceStats.get(`${pieceColor}-${pieceType}`) || null;
  };

  const renderPieceItem = (item: typeof legend[0]) => {
    const highlighted = isHighlighted(item.piece, item.color);
    const locked = isLocked(item.piece, item.color);
    const lockedIndex = getLockedIndex(item.piece, item.color);
    const stats = getStats(item.piece, item.color);
    const showStats = (highlighted || locked) && stats;

    return (
      <div 
        key={item.name} 
        className={`flex items-center gap-3 p-2 -m-2 rounded-md transition-all duration-200 ${
          interactive && highlightContext ? 'cursor-pointer hover:bg-accent/50' : ''
        } ${highlighted ? 'bg-accent ring-2 ring-primary/50' : ''} ${
          locked ? (lockedIndex === 0 ? 'bg-sky-500/20 ring-2 ring-sky-500' : 'bg-rose-500/20 ring-2 ring-rose-500') : ''
        }`}
        onMouseEnter={() => handlePieceHover(item.piece, item.color)}
        onMouseLeave={handlePieceLeave}
        onClick={() => handlePieceClick(item.piece, item.color)}
      >
        <div
          className={`w-5 h-5 rounded shadow-sm transition-transform duration-200 ${
            highlighted || locked ? 'scale-125 ring-2 ring-white/50' : ''
          }`}
          style={{ backgroundColor: item.hex }}
        />
        <span className="text-lg">{item.symbol}</span>
        <span className="text-xs text-muted-foreground font-serif flex-1">
          {item.name.replace('White ', '').replace('Black ', '')}
        </span>
        
        {/* Lock indicator with compare badge */}
        {locked && (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            lockedIndex === 0 ? 'bg-sky-500' : 'bg-rose-500'
          }`}>
            {lockedIndex + 1}
          </div>
        )}
        
        {/* Stats on hover/lock */}
        {showStats && (
          <div className="flex flex-col items-end text-[10px] leading-tight animate-fade-in">
            <span className="text-foreground font-semibold">{stats.percentage}%</span>
            <span className="text-muted-foreground">{stats.squareCount} sq</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col gap-5 p-6 bg-card rounded-lg border border-border/50">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold tracking-wide">
          Color Legend
        </h3>
        <div className="flex items-center gap-2">
          {/* Compare mode toggle */}
          {interactive && highlightContext && (
            <Button
              variant={compareMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleCompareMode}
              className={`h-6 px-2 text-[10px] gap-1 ${compareMode ? 'bg-primary' : ''}`}
            >
              <GitCompare className="w-3 h-3" />
              Compare
            </Button>
          )}
          
          {/* Clear button */}
          {lockedPieces.length > 0 && (
            <button 
              onClick={clearLock}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>
      
      {interactive && highlightContext && (
        <p className="text-[10px] text-muted-foreground text-center -mt-2">
          {compareMode 
            ? `Select 2 pieces to compare • ${lockedPieces.length}/2 selected`
            : 'Hover to preview • Click to lock'
          }
        </p>
      )}

      {/* Overlap stats in compare mode */}
      {compareMode && overlapStats && lockedPieces.length === 2 && (
        <div className="bg-gradient-to-r from-sky-500/10 via-purple-500/20 to-rose-500/10 rounded-lg p-3 border border-border/50 animate-fade-in">
          <div className="text-[10px] font-semibold text-center mb-2 uppercase tracking-widest text-muted-foreground">
            Overlap Analysis
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sky-400 font-bold text-lg">{overlapStats.piece1Only}</div>
              <div className="text-[9px] text-muted-foreground">Only ①</div>
            </div>
            <div>
              <div className="text-purple-400 font-bold text-lg">{overlapStats.overlapCount}</div>
              <div className="text-[9px] text-muted-foreground">Shared</div>
            </div>
            <div>
              <div className="text-rose-400 font-bold text-lg">{overlapStats.piece2Only}</div>
              <div className="text-[9px] text-muted-foreground">Only ②</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-5">
        {/* White pieces */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <span className="text-[10px] font-sans font-medium text-sky-400 uppercase tracking-widest">
              {theme.whiteEmoji} White — {theme.whiteName}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {whitePieces.map(renderPieceItem)}
          </div>
        </div>
        
        {/* Black pieces */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <span className="text-[10px] font-sans font-medium text-rose-400 uppercase tracking-widest">
              {theme.blackEmoji} Black — {theme.blackName}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {blackPieces.map(renderPieceItem)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
