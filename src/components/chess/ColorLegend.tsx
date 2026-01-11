import React, { useMemo } from 'react';
import { getPieceColorLegend, getActivePalette, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { SquareData } from '@/lib/chess/gameSimulator';
import { Lock, Unlock } from 'lucide-react';

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
  
  const { highlightedPiece, lockedPiece, setHighlightedPiece, toggleLockedPiece, clearLock } = highlightContext || { 
    highlightedPiece: null,
    lockedPiece: null,
    setHighlightedPiece: () => {},
    toggleLockedPiece: () => {},
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
  
  // Group by piece color
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');

  const handlePieceHover = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (interactive && setHighlightedPiece && !lockedPiece) {
      setHighlightedPiece({ pieceType, pieceColor });
    }
  };

  const handlePieceLeave = () => {
    if (interactive && setHighlightedPiece && !lockedPiece) {
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
    return lockedPiece?.pieceType === pieceType && lockedPiece?.pieceColor === pieceColor;
  };

  const getStats = (pieceType: PieceType, pieceColor: PieceColor): PieceStats | null => {
    return pieceStats.get(`${pieceColor}-${pieceType}`) || null;
  };

  const renderPieceItem = (item: typeof legend[0]) => {
    const highlighted = isHighlighted(item.piece, item.color);
    const locked = isLocked(item.piece, item.color);
    const stats = getStats(item.piece, item.color);
    const showStats = (highlighted || locked) && stats;

    return (
      <div 
        key={item.name} 
        className={`flex items-center gap-3 p-2 -m-2 rounded-md transition-all duration-200 ${
          interactive && highlightContext ? 'cursor-pointer hover:bg-accent/50' : ''
        } ${highlighted ? 'bg-accent ring-2 ring-primary/50' : ''} ${
          locked ? 'bg-primary/20 ring-2 ring-primary' : ''
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
        
        {/* Lock indicator */}
        {locked && (
          <Lock className="w-3 h-3 text-primary" />
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
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold tracking-wide">
          Color Legend
        </h3>
        {lockedPiece && (
          <button 
            onClick={clearLock}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Unlock className="w-3 h-3" />
            Unlock
          </button>
        )}
      </div>
      
      {interactive && highlightContext && (
        <p className="text-[10px] text-muted-foreground text-center -mt-2">
          Hover to preview • Click to lock
        </p>
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
