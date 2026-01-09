import React from 'react';
import { Palette, Check } from 'lucide-react';
import { 
  colorPalettes, 
  getActivePalette, 
  setActivePalette, 
  PaletteId,
  PieceType 
} from '@/lib/chess/pieceColors';

interface PaletteSelectorProps {
  onPaletteChange?: (paletteId: PaletteId) => void;
}

const PaletteSelector: React.FC<PaletteSelectorProps> = ({ onPaletteChange }) => {
  const [activePaletteId, setActivePaletteId] = React.useState<PaletteId>(getActivePalette().id);
  
  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
  
  const handleSelect = (paletteId: PaletteId) => {
    setActivePalette(paletteId);
    setActivePaletteId(paletteId);
    onPaletteChange?.(paletteId);
  };
  
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Palette className="h-5 w-5 text-primary" />
          Color Palette
        </h3>
        <p className="text-sm text-muted-foreground mt-1 font-serif">
          Choose a theme for your visualization
        </p>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorPalettes.map((palette) => {
            const isActive = palette.id === activePaletteId;
            
            return (
              <button
                key={palette.id}
                onClick={() => handleSelect(palette.id)}
                className={`text-left p-4 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? 'border-primary bg-primary/10 glow-gold' 
                    : 'border-border/50 bg-card hover:border-primary/30 hover:bg-card/80'
                }`}
              >
                {/* Header with title and check */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-display font-semibold text-sm">{palette.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 font-serif line-clamp-1">
                      {palette.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Color swatches preview */}
                <div className="space-y-2">
                  {/* White pieces row */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0">White</span>
                    <div className="flex gap-1 flex-1">
                      {pieces.map((piece) => (
                        <div
                          key={`w-${piece}`}
                          className="w-5 h-5 rounded-sm shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: palette.white[piece] }}
                          title={`White ${piece.toUpperCase()}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Black pieces row */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0">Black</span>
                    <div className="flex gap-1 flex-1">
                      {pieces.map((piece) => (
                        <div
                          key={`b-${piece}`}
                          className="w-5 h-5 rounded-sm shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: palette.black[piece] }}
                          title={`Black ${piece.toUpperCase()}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Piece labels */}
                <div className="flex items-center gap-1 mt-1.5 ml-8">
                  {['K', 'Q', 'R', 'B', 'N', 'P'].map((label) => (
                    <span key={label} className="w-5 text-center text-[8px] text-muted-foreground/60">
                      {label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaletteSelector;
