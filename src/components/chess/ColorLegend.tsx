import React from 'react';
import { getPieceColorLegend, getActivePalette, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';

interface ColorLegendProps {
  interactive?: boolean;
}

const ColorLegend: React.FC<ColorLegendProps> = ({ interactive = true }) => {
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
  
  const { highlightedPiece, setHighlightedPiece } = highlightContext || { 
    highlightedPiece: null, 
    setHighlightedPiece: () => {} 
  };
  
  // Group by piece color
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');

  const handlePieceHover = (pieceType: PieceType, pieceColor: PieceColor) => {
    if (interactive && setHighlightedPiece) {
      setHighlightedPiece({ pieceType, pieceColor });
    }
  };

  const handlePieceLeave = () => {
    if (interactive && setHighlightedPiece) {
      setHighlightedPiece(null);
    }
  };

  const isHighlighted = (pieceType: PieceType, pieceColor: PieceColor) => {
    return highlightedPiece?.pieceType === pieceType && highlightedPiece?.pieceColor === pieceColor;
  };
  
  return (
    <div className="flex flex-col gap-5 p-6 bg-card rounded-lg border border-border/50">
      <h3 className="font-display text-sm font-semibold text-center tracking-wide">
        Color Legend
      </h3>
      
      {interactive && highlightContext && (
        <p className="text-[10px] text-muted-foreground text-center -mt-2">
          Hover to highlight on board
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
            {whitePieces.map((item) => (
              <div 
                key={item.name} 
                className={`flex items-center gap-3 p-2 -m-2 rounded-md transition-all duration-200 ${
                  interactive && highlightContext ? 'cursor-pointer hover:bg-accent/50' : ''
                } ${isHighlighted(item.piece, item.color) ? 'bg-accent ring-2 ring-primary/50 scale-105' : ''}`}
                onMouseEnter={() => handlePieceHover(item.piece, item.color)}
                onMouseLeave={handlePieceLeave}
              >
                <div
                  className={`w-5 h-5 rounded shadow-sm transition-transform duration-200 ${
                    isHighlighted(item.piece, item.color) ? 'scale-125 ring-2 ring-white/50' : ''
                  }`}
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-lg">{item.symbol}</span>
                <span className="text-xs text-muted-foreground font-serif">{item.name.replace('White ', '')}</span>
              </div>
            ))}
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
            {blackPieces.map((item) => (
              <div 
                key={item.name} 
                className={`flex items-center gap-3 p-2 -m-2 rounded-md transition-all duration-200 ${
                  interactive && highlightContext ? 'cursor-pointer hover:bg-accent/50' : ''
                } ${isHighlighted(item.piece, item.color) ? 'bg-accent ring-2 ring-primary/50 scale-105' : ''}`}
                onMouseEnter={() => handlePieceHover(item.piece, item.color)}
                onMouseLeave={handlePieceLeave}
              >
                <div
                  className={`w-5 h-5 rounded shadow-sm transition-transform duration-200 ${
                    isHighlighted(item.piece, item.color) ? 'scale-125 ring-2 ring-white/50' : ''
                  }`}
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-lg">{item.symbol}</span>
                <span className="text-xs text-muted-foreground font-serif">{item.name.replace('Black ', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
