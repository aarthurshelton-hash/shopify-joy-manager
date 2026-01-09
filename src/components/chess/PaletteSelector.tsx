import React, { useState, useCallback } from 'react';
import { Palette, Check, Pencil } from 'lucide-react';
import { 
  colorPalettes, 
  getActivePalette, 
  setActivePalette, 
  setCustomColor,
  getCustomPalette,
  PaletteId,
  PieceType,
  PieceColor
} from '@/lib/chess/pieceColors';

interface PaletteSelectorProps {
  onPaletteChange?: (paletteId: PaletteId) => void;
}

const pieceNames: Record<PieceType, string> = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
};

const pieceSymbols: Record<PieceType, { white: string; black: string }> = {
  k: { white: '♔', black: '♚' },
  q: { white: '♕', black: '♛' },
  r: { white: '♖', black: '♜' },
  b: { white: '♗', black: '♝' },
  n: { white: '♘', black: '♞' },
  p: { white: '♙', black: '♟' },
};

// Generate a random hex color
const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.floor(Math.random() * 40); // 50-90%
  const lightness = 35 + Math.floor(Math.random() * 30); // 35-65%
  
  // Convert HSL to Hex
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
};

const generateRandomPalette = () => {
  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
  const white: Record<PieceType, string> = {} as Record<PieceType, string>;
  const black: Record<PieceType, string> = {} as Record<PieceType, string>;
  
  pieces.forEach(piece => {
    white[piece] = generateRandomColor();
    black[piece] = generateRandomColor();
  });
  
  return { white, black };
};

const PaletteSelector: React.FC<PaletteSelectorProps> = ({ onPaletteChange }) => {
  const [activePaletteId, setActivePaletteId] = useState<PaletteId>(getActivePalette().id);
  const [customColors, setCustomColors] = useState(() => {
    const custom = getCustomPalette();
    return { white: { ...custom.white }, black: { ...custom.black } };
  });
  
  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
  
  const handleSelect = useCallback((paletteId: PaletteId) => {
    // If selecting custom, generate random colors
    if (paletteId === 'custom' && activePaletteId !== 'custom') {
      const randomPalette = generateRandomPalette();
      
      // Update the custom palette with random colors
      pieces.forEach(piece => {
        setCustomColor('w', piece, randomPalette.white[piece]);
        setCustomColor('b', piece, randomPalette.black[piece]);
      });
      
      setCustomColors(randomPalette);
    }
    
    setActivePalette(paletteId);
    setActivePaletteId(paletteId);
    onPaletteChange?.(paletteId);
  }, [onPaletteChange, activePaletteId]);
  
  const handleCustomColorChange = useCallback((pieceColor: PieceColor, pieceType: PieceType, hexColor: string) => {
    setCustomColor(pieceColor, pieceType, hexColor);
    setCustomColors(prev => ({
      ...prev,
      [pieceColor === 'w' ? 'white' : 'black']: {
        ...prev[pieceColor === 'w' ? 'white' : 'black'],
        [pieceType]: hexColor,
      }
    }));
    // Trigger re-render if custom is active
    if (activePaletteId === 'custom') {
      onPaletteChange?.('custom');
    }
  }, [activePaletteId, onPaletteChange]);
  
  const isCustomActive = activePaletteId === 'custom';
  
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
      
      <div className="p-5 space-y-5">
        {/* Preset palettes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorPalettes.map((palette) => {
            const isActive = palette.id === activePaletteId;
            const isCustom = palette.id === 'custom';
            const displayColors = isCustom ? customColors : { white: palette.white, black: palette.black };
            
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
                  <div className="flex items-center gap-2">
                    {isCustom && <Pencil className="h-3.5 w-3.5 text-primary" />}
                    <div>
                      <h4 className="font-display font-semibold text-sm">{palette.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-serif line-clamp-1">
                        {palette.description}
                      </p>
                    </div>
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
                          style={{ backgroundColor: displayColors.white[piece] }}
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
                          style={{ backgroundColor: displayColors.black[piece] }}
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
        
        {/* Custom color picker panel - only show when custom is selected */}
        {isCustomActive && (
          <div className="border border-primary/30 rounded-lg p-5 bg-primary/5 animate-fade-in">
            <h4 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Customize Your Colors
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* White pieces */}
              <div className="space-y-3">
                <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">White Pieces</h5>
                <div className="space-y-2">
                  {pieces.map((piece) => (
                    <div key={`custom-w-${piece}`} className="flex items-center gap-3">
                      <span className="text-xl w-6">{pieceSymbols[piece].white}</span>
                      <span className="text-sm text-muted-foreground w-16">{pieceNames[piece]}</span>
                      <label className="relative cursor-pointer group">
                        <input
                          type="color"
                          value={customColors.white[piece]}
                          onChange={(e) => handleCustomColorChange('w', piece, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div 
                          className="w-8 h-8 rounded-md shadow-sm ring-1 ring-black/10 group-hover:ring-primary/50 transition-all"
                          style={{ backgroundColor: customColors.white[piece] }}
                        />
                      </label>
                      <span className="text-xs font-mono text-muted-foreground">{customColors.white[piece]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Black pieces */}
              <div className="space-y-3">
                <h5 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Black Pieces</h5>
                <div className="space-y-2">
                  {pieces.map((piece) => (
                    <div key={`custom-b-${piece}`} className="flex items-center gap-3">
                      <span className="text-xl w-6">{pieceSymbols[piece].black}</span>
                      <span className="text-sm text-muted-foreground w-16">{pieceNames[piece]}</span>
                      <label className="relative cursor-pointer group">
                        <input
                          type="color"
                          value={customColors.black[piece]}
                          onChange={(e) => handleCustomColorChange('b', piece, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div 
                          className="w-8 h-8 rounded-md shadow-sm ring-1 ring-black/10 group-hover:ring-primary/50 transition-all"
                          style={{ backgroundColor: customColors.black[piece] }}
                        />
                      </label>
                      <span className="text-xs font-mono text-muted-foreground">{customColors.black[piece]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaletteSelector;
