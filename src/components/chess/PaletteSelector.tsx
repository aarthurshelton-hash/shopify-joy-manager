import React, { useState, useCallback, useEffect, forwardRef } from 'react';
import { Palette, Check, Pencil, Save, Loader2, ChevronDown, Globe, User } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { incrementPaletteUsage } from '@/lib/analytics/financialTrends';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Import palette background images
import hotcoldBg from '@/assets/palettes/hotcold.jpg';
import medievalBg from '@/assets/palettes/medieval.jpg';
import egyptianBg from '@/assets/palettes/egyptian.jpg';
import romanBg from '@/assets/palettes/roman.jpg';
import modernBg from '@/assets/palettes/modern.jpg';
import greyscaleBg from '@/assets/palettes/greyscale.jpg';
import japaneseBg from '@/assets/palettes/japanese.jpg';
import nordicBg from '@/assets/palettes/nordic.jpg';
import artdecoBg from '@/assets/palettes/artdeco.jpg';
import tropicalBg from '@/assets/palettes/tropical.jpg';
import cyberpunkBg from '@/assets/palettes/cyberpunk.jpg';
import autumnBg from '@/assets/palettes/autumn.jpg';
import oceanBg from '@/assets/palettes/ocean.jpg';
import desertBg from '@/assets/palettes/desert.jpg';
import cosmicBg from '@/assets/palettes/cosmic.jpg';
import vintageBg from '@/assets/palettes/vintage.jpg';

// Map palette IDs to background images
const paletteBackgrounds: Record<string, string> = {
  hotCold: hotcoldBg,
  medieval: medievalBg,
  egyptian: egyptianBg,
  roman: romanBg,
  modern: modernBg,
  greyscale: greyscaleBg,
  japanese: japaneseBg,
  nordic: nordicBg,
  artdeco: artdecoBg,
  tropical: tropicalBg,
  cyberpunk: cyberpunkBg,
  autumn: autumnBg,
  ocean: oceanBg,
  desert: desertBg,
  cosmic: cosmicBg,
  vintage: vintageBg,
};

interface SavedPaletteItem {
  id: string;
  name: string;
  white_colors: Record<string, string>;
  black_colors: Record<string, string>;
  is_public: boolean;
  user_id: string;
}

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

const PaletteSelector = forwardRef<HTMLDivElement, PaletteSelectorProps>(function PaletteSelector({ onPaletteChange }, ref) {
  const { user } = useAuth();
  const [activePaletteId, setActivePaletteId] = useState<PaletteId>(getActivePalette().id);
  const [customColors, setCustomColors] = useState(() => {
    const custom = getCustomPalette();
    return { white: { ...custom.white }, black: { ...custom.black } };
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPaletteItem[]>([]);
  const [publicPalettes, setPublicPalettes] = useState<SavedPaletteItem[]>([]);
  const [isLoadingPalettes, setIsLoadingPalettes] = useState(false);
  
  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  // Fetch saved and public palettes
  useEffect(() => {
    const fetchPalettes = async () => {
      setIsLoadingPalettes(true);
      try {
        // Fetch public palettes (available to everyone)
        const { data: publicData } = await supabase
          .from('saved_palettes')
          .select('id, name, white_colors, black_colors, is_public, user_id')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20);
        
        setPublicPalettes((publicData || []).map(p => ({
          ...p,
          white_colors: p.white_colors as Record<string, string>,
          black_colors: p.black_colors as Record<string, string>,
        })));

        // Fetch user's own palettes if logged in
        if (user) {
          const { data: userData } = await supabase
            .from('saved_palettes')
            .select('id, name, white_colors, black_colors, is_public, user_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          setSavedPalettes((userData || []).map(p => ({
            ...p,
            white_colors: p.white_colors as Record<string, string>,
            black_colors: p.black_colors as Record<string, string>,
          })));
        }
      } catch (error) {
        console.error('Error fetching palettes:', error);
      } finally {
        setIsLoadingPalettes(false);
      }
    };

    fetchPalettes();
  }, [user]);

  const handleLoadSavedPalette = (palette: SavedPaletteItem) => {
    pieces.forEach(piece => {
      setCustomColor('w', piece, palette.white_colors[piece]);
      setCustomColor('b', piece, palette.black_colors[piece]);
    });
    
    setCustomColors({
      white: palette.white_colors as Record<PieceType, string>,
      black: palette.black_colors as Record<PieceType, string>,
    });
    
    setActivePalette('custom');
    setActivePaletteId('custom');
    onPaletteChange?.('custom');
    
    toast.success(`"${palette.name}" loaded!`);
  };
  
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
    
    // Track palette interaction for value attribution (only for non-custom palettes)
    if (paletteId !== 'custom') {
      incrementPaletteUsage(paletteId).catch(err => 
        console.warn('Failed to track palette interaction:', err)
      );
    }
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

  const handleSavePalette = async () => {
    if (!user || !paletteName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_palettes').insert({
        user_id: user.id,
        name: paletteName.trim(),
        white_colors: customColors.white,
        black_colors: customColors.black,
      });
      
      if (error) throw error;
      
      toast.success('Palette saved!', {
        description: `"${paletteName}" has been saved to your account.`,
      });
      setIsSaveDialogOpen(false);
      setPaletteName('');
    } catch (error) {
      console.error('Error saving palette:', error);
      toast.error('Failed to save palette');
    } finally {
      setIsSaving(false);
    }
  };
  
  const isCustomActive = activePaletteId === 'custom';
  
  return (
    <div ref={ref} className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            Color Palette
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-serif">
            Choose a theme for your visualization
          </p>
        </div>
        
        {/* Quick Load Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={isLoadingPalettes}>
              {isLoadingPalettes ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Load Saved
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto bg-card border-border z-50">
            {/* User's palettes */}
            {user && savedPalettes.length > 0 && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  <User className="h-3 w-3" />
                  My Palettes
                </DropdownMenuLabel>
                {savedPalettes.map((palette) => (
                  <DropdownMenuItem
                    key={palette.id}
                    onClick={() => handleLoadSavedPalette(palette)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex gap-0.5">
                        {pieces.slice(0, 3).map((piece) => (
                          <div
                            key={piece}
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: palette.white_colors[piece] }}
                          />
                        ))}
                      </div>
                      <span className="flex-1 truncate">{palette.name}</span>
                      {palette.is_public && <Globe className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Public palettes */}
            {publicPalettes.length > 0 && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  <Globe className="h-3 w-3" />
                  Community Palettes
                </DropdownMenuLabel>
                {publicPalettes
                  .filter(p => !user || p.user_id !== user.id) // Don't show own palettes again
                  .slice(0, 10)
                  .map((palette) => (
                    <DropdownMenuItem
                      key={palette.id}
                      onClick={() => handleLoadSavedPalette(palette)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex gap-0.5">
                          {pieces.slice(0, 3).map((piece) => (
                            <div
                              key={piece}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: palette.white_colors[piece] }}
                            />
                          ))}
                        </div>
                        <span className="flex-1 truncate">{palette.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </>
            )}
            
            {/* Empty state */}
            {savedPalettes.length === 0 && publicPalettes.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No saved palettes yet
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="p-5 space-y-5">
        {/* Preset palettes - horizontally scrollable on mobile */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0">
          {colorPalettes.map((palette) => {
            const isActive = palette.id === activePaletteId;
            const isCustom = palette.id === 'custom';
            const displayColors = isCustom ? customColors : { white: palette.white, black: palette.black };
            const bgImage = paletteBackgrounds[palette.id];
            
            return (
              <button
                key={palette.id}
                onClick={() => handleSelect(palette.id)}
                className={`relative text-left p-4 rounded-lg border transition-all duration-300 overflow-hidden min-w-[280px] sm:min-w-0 snap-start ${
                  isActive 
                    ? 'border-primary glow-gold' 
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                {/* Background image */}
                {bgImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />
                )}
                {/* Overlay for better text readability */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isActive ? 'bg-primary/10' : 'bg-card/80'
                }`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header with title and check */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isCustom && <Pencil className="h-3.5 w-3.5 text-primary" />}
                      <div>
                        <h4 className="font-display font-semibold text-sm">{palette.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 font-serif">
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
            
            {/* Save Palette Button - only for logged in users */}
            {user && (
              <div className="mt-6 pt-4 border-t border-primary/20">
                <Button
                  onClick={() => setIsSaveDialogOpen(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Save className="h-4 w-4" />
                  Save This Palette
                </Button>
              </div>
            )}
            
            {!user && (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Sign in to save your custom palettes
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Save Palette Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Save Custom Palette</DialogTitle>
            <DialogDescription>
              Give your palette a name to save it to your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <Input
              placeholder="My Awesome Palette"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && paletteName.trim()) {
                  handleSavePalette();
                }
              }}
            />
            
            {/* Preview of colors being saved */}
            <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-muted/50">
              {pieces.map((piece) => (
                <div key={`preview-${piece}`} className="flex flex-col gap-1">
                  <div
                    className="w-6 h-6 rounded-sm ring-1 ring-black/10"
                    style={{ backgroundColor: customColors.white[piece] }}
                  />
                  <div
                    className="w-6 h-6 rounded-sm ring-1 ring-black/10"
                    style={{ backgroundColor: customColors.black[piece] }}
                  />
                </div>
              ))}
            </div>
            
            <Button
              onClick={handleSavePalette}
              disabled={!paletteName.trim() || isSaving}
              className="w-full gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Palette
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

PaletteSelector.displayName = 'PaletteSelector';

export default PaletteSelector;
