import React, { useMemo, useState } from 'react';
import { getPieceColorLegend, getActivePalette, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';
import { SquareData } from '@/lib/chess/gameSimulator';
import { GitCompare, X, Swords, ChevronDown, ChevronUp } from 'lucide-react';
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

interface BattleStats {
  whiteTotalSquares: number;
  blackTotalSquares: number;
  whiteTotalVisits: number;
  blackTotalVisits: number;
  whitePercentage: number;
  blackPercentage: number;
  pieceBattles: {
    pieceType: PieceType;
    pieceName: string;
    pieceSymbol: string;
    whiteSquares: number;
    blackSquares: number;
    whiteVisits: number;
    blackVisits: number;
    whiteHex: string;
    blackHex: string;
  }[];
  mvpPiece: {
    color: PieceColor;
    type: PieceType;
    name: string;
    symbol: string;
    hex: string;
    squareCount: number;
  } | null;
}

const ColorLegend: React.FC<ColorLegendProps> = ({ interactive = true, board }) => {
  const legend = getPieceColorLegend();
  const palette = getActivePalette();
  const theme = palette.legendTheme;
  const [showBattleAnalysis, setShowBattleAnalysis] = useState(false);
  
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

  // Calculate battle analysis stats
  const battleStats = useMemo((): BattleStats | null => {
    if (!board || pieceStats.size === 0) return null;
    
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const pieceNames: Record<PieceType, string> = {
      k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
    };
    const pieceSymbols: Record<PieceType, { w: string; b: string }> = {
      k: { w: '♚', b: '♔' }, q: { w: '♛', b: '♕' }, r: { w: '♜', b: '♖' },
      b: { w: '♝', b: '♗' }, n: { w: '♞', b: '♘' }, p: { w: '♟', b: '♙' }
    };
    
    let whiteTotalSquares = 0;
    let blackTotalSquares = 0;
    let whiteTotalVisits = 0;
    let blackTotalVisits = 0;
    
    const pieceBattles = pieceTypes.map(pt => {
      const whiteStats = pieceStats.get(`w-${pt}`)!;
      const blackStats = pieceStats.get(`b-${pt}`)!;
      
      whiteTotalSquares += whiteStats.squareCount;
      blackTotalSquares += blackStats.squareCount;
      whiteTotalVisits += whiteStats.visitCount;
      blackTotalVisits += blackStats.visitCount;
      
      const whiteLegend = legend.find(l => l.piece === pt && l.color === 'w');
      const blackLegend = legend.find(l => l.piece === pt && l.color === 'b');
      
      return {
        pieceType: pt,
        pieceName: pieceNames[pt],
        pieceSymbol: pieceSymbols[pt].w,
        whiteSquares: whiteStats.squareCount,
        blackSquares: blackStats.squareCount,
        whiteVisits: whiteStats.visitCount,
        blackVisits: blackStats.visitCount,
        whiteHex: whiteLegend?.hex || '#3B82F6',
        blackHex: blackLegend?.hex || '#EF4444',
      };
    });
    
    // Find MVP (most active piece)
    let mvpPiece: BattleStats['mvpPiece'] = null;
    let maxSquares = 0;
    
    for (const [key, stat] of pieceStats) {
      if (stat.squareCount > maxSquares) {
        maxSquares = stat.squareCount;
        const [color, piece] = key.split('-') as [PieceColor, PieceType];
        const legendItem = legend.find(l => l.piece === piece && l.color === color);
        mvpPiece = {
          color,
          type: piece,
          name: pieceNames[piece],
          symbol: pieceSymbols[piece][color],
          hex: legendItem?.hex || '#888',
          squareCount: stat.squareCount,
        };
      }
    }
    
    const totalSquaresVisited = whiteTotalSquares + blackTotalSquares;
    
    return {
      whiteTotalSquares,
      blackTotalSquares,
      whiteTotalVisits,
      blackTotalVisits,
      whitePercentage: totalSquaresVisited > 0 ? Math.round((whiteTotalSquares / totalSquaresVisited) * 100) : 50,
      blackPercentage: totalSquaresVisited > 0 ? Math.round((blackTotalSquares / totalSquaresVisited) * 100) : 50,
      pieceBattles,
      mvpPiece,
    };
  }, [board, pieceStats, legend]);

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

  const renderBattleAnalysis = () => {
    if (!battleStats) return null;

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Overall territory control */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-sky-400">{theme.whiteName}</span>
            <span className="text-rose-400">{theme.blackName}</span>
          </div>
          
          {/* Main battle bar */}
          <div className="relative h-6 rounded-full overflow-hidden bg-muted/30">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
              style={{ width: `${battleStats.whitePercentage}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-500"
              style={{ width: `${battleStats.blackPercentage}%` }}
            />
            {/* Center divider indicator */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/20 -translate-x-1/2" />
            {/* Percentage labels */}
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <span className="text-xs font-bold text-white drop-shadow-md">{battleStats.whitePercentage}%</span>
              <span className="text-xs font-bold text-white drop-shadow-md">{battleStats.blackPercentage}%</span>
            </div>
          </div>
          
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>{battleStats.whiteTotalSquares} squares</span>
            <span>{battleStats.blackTotalSquares} squares</span>
          </div>
        </div>

        {/* MVP Piece */}
        {battleStats.mvpPiece && (
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 rounded-lg p-3 border border-amber-500/30">
            <div className="text-[10px] font-semibold text-center mb-1 uppercase tracking-widest text-amber-400">
              ⭐ Most Active Piece
            </div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-6 h-6 rounded shadow-md ring-2 ring-amber-400/50"
                style={{ backgroundColor: battleStats.mvpPiece.hex }}
              />
              <span className="text-xl">{battleStats.mvpPiece.symbol}</span>
              <span className="text-sm font-medium">
                {battleStats.mvpPiece.color === 'w' ? 'White' : 'Black'} {battleStats.mvpPiece.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({battleStats.mvpPiece.squareCount} sq)
              </span>
            </div>
          </div>
        )}

        {/* Piece-by-piece battles */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-center uppercase tracking-widest text-muted-foreground">
            Piece Battles
          </div>
          {battleStats.pieceBattles.map((battle) => {
            const total = battle.whiteSquares + battle.blackSquares;
            const whitePercent = total > 0 ? (battle.whiteSquares / total) * 100 : 50;
            const blackPercent = total > 0 ? (battle.blackSquares / total) * 100 : 50;
            const winner = battle.whiteSquares > battle.blackSquares ? 'white' : 
                          battle.blackSquares > battle.whiteSquares ? 'black' : 'tie';
            
            return (
              <div key={battle.pieceType} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: battle.whiteHex }} />
                    <span className={winner === 'white' ? 'font-bold text-sky-400' : 'text-muted-foreground'}>
                      {battle.whiteSquares}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{battle.pieceSymbol} {battle.pieceName}</span>
                  <div className="flex items-center gap-1">
                    <span className={winner === 'black' ? 'font-bold text-rose-400' : 'text-muted-foreground'}>
                      {battle.blackSquares}
                    </span>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: battle.blackHex }} />
                  </div>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden bg-muted/30">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-300"
                    style={{ 
                      width: `${whitePercent}%`,
                      backgroundColor: battle.whiteHex,
                    }}
                  />
                  <div 
                    className="absolute right-0 top-0 h-full rounded-r-full transition-all duration-300"
                    style={{ 
                      width: `${blackPercent}%`,
                      backgroundColor: battle.blackHex,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
          {/* Battle Analysis toggle */}
          {board && (
            <Button
              variant={showBattleAnalysis ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowBattleAnalysis(!showBattleAnalysis)}
              className={`h-6 px-2 text-[10px] gap-1 ${showBattleAnalysis ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            >
              <Swords className="w-3 h-3" />
              Battle
            </Button>
          )}
          
          {/* Compare mode toggle */}
          {interactive && highlightContext && !showBattleAnalysis && (
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
          {lockedPieces.length > 0 && !showBattleAnalysis && (
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
      
      {/* Battle Analysis View */}
      {showBattleAnalysis ? (
        renderBattleAnalysis()
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ColorLegend;
