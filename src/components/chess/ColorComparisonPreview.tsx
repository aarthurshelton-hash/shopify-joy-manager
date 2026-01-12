import React from 'react';
import { PieceType } from '@/lib/chess/pieceColors';
import { PaletteColors, colorDistance } from '@/lib/visualizations/similarityDetection';
import { AlertTriangle, Check, X } from 'lucide-react';

const PIECE_TYPES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
const PIECE_NAMES: Record<PieceType, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
};
const PIECE_SYMBOLS: Record<PieceType, { white: string; black: string }> = {
  k: { white: '♚', black: '♔' },
  q: { white: '♛', black: '♕' },
  r: { white: '♜', black: '♖' },
  b: { white: '♝', black: '♗' },
  n: { white: '♞', black: '♘' },
  p: { white: '♟', black: '♙' },
};

interface ColorComparisonPreviewProps {
  yourColors: PaletteColors;
  existingColors: PaletteColors;
  similarityThreshold?: number;
  ownerName?: string;
}

const ColorComparisonPreview: React.FC<ColorComparisonPreviewProps> = ({
  yourColors,
  existingColors,
  similarityThreshold = 50,
  ownerName = 'Another collector',
}) => {
  // Calculate which colors are too similar
  const colorMatches: Array<{
    side: 'white' | 'black';
    piece: PieceType;
    yourColor: string;
    existingColor: string;
    isSimilar: boolean;
    distance: number;
  }> = [];
  
  for (const piece of PIECE_TYPES) {
    // White pieces
    const whiteDistance = colorDistance(yourColors.white[piece], existingColors.white[piece]);
    colorMatches.push({
      side: 'white',
      piece,
      yourColor: yourColors.white[piece],
      existingColor: existingColors.white[piece],
      isSimilar: whiteDistance < similarityThreshold,
      distance: whiteDistance,
    });
    
    // Black pieces
    const blackDistance = colorDistance(yourColors.black[piece], existingColors.black[piece]);
    colorMatches.push({
      side: 'black',
      piece,
      yourColor: yourColors.black[piece],
      existingColor: existingColors.black[piece],
      isSimilar: blackDistance < similarityThreshold,
      distance: blackDistance,
    });
  }
  
  const similarCount = colorMatches.filter(m => m.isSimilar).length;
  const similarityPercent = Math.round((similarCount / 12) * 100);
  const needToChange = Math.ceil(12 * 0.7) - (12 - similarCount); // Need at least 70% different
  
  return (
    <div className="bg-background border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-sm">Color Similarity Detected</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your colors are <span className="font-semibold text-amber-600">{similarityPercent}% similar</span> to a vision by {ownerName}.
            {needToChange > 0 && (
              <> Change at least <span className="font-semibold">{needToChange} more colors</span> for uniqueness.</>
            )}
          </p>
        </div>
      </div>
      
      {/* Color Comparison Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* White Pieces */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">White Pieces</h5>
          <div className="space-y-1.5">
            {PIECE_TYPES.map(piece => {
              const match = colorMatches.find(m => m.side === 'white' && m.piece === piece)!;
              return (
                <div 
                  key={`white-${piece}`}
                  className={`flex items-center gap-2 p-1.5 rounded-md ${
                    match.isSimilar ? 'bg-amber-500/10' : 'bg-green-500/10'
                  }`}
                >
                  <span className="text-sm w-4">{PIECE_SYMBOLS[piece].white}</span>
                  <div className="flex items-center gap-1 flex-1">
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: match.yourColor }}
                      title={`Your: ${match.yourColor}`}
                    />
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: match.existingColor }}
                      title={`Existing: ${match.existingColor}`}
                    />
                  </div>
                  {match.isSimilar ? (
                    <X className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Black Pieces */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">Black Pieces</h5>
          <div className="space-y-1.5">
            {PIECE_TYPES.map(piece => {
              const match = colorMatches.find(m => m.side === 'black' && m.piece === piece)!;
              return (
                <div 
                  key={`black-${piece}`}
                  className={`flex items-center gap-2 p-1.5 rounded-md ${
                    match.isSimilar ? 'bg-amber-500/10' : 'bg-green-500/10'
                  }`}
                >
                  <span className="text-sm w-4">{PIECE_SYMBOLS[piece].black}</span>
                  <div className="flex items-center gap-1 flex-1">
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: match.yourColor }}
                      title={`Your: ${match.yourColor}`}
                    />
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <div 
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: match.existingColor }}
                      title={`Existing: ${match.existingColor}`}
                    />
                  </div>
                  {match.isSimilar ? (
                    <X className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <X className="h-3 w-3 text-amber-500" />
          <span>Too similar - needs change</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          <span>Unique enough</span>
        </div>
      </div>
    </div>
  );
};

export default ColorComparisonPreview;
