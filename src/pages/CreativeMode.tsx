import { useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Wand2, Palette, Download, Save, Share2, Trash2, 
  RotateCcw, Crown, Lock, Sparkles, Eye, Grid3X3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colorPalettes, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import AuthModal from '@/components/auth/AuthModal';
import PremiumUpgradeModal from '@/components/premium/PremiumUpgradeModal';

type PieceKey = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | null;

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const parseFen = (fen: string): (string | null)[][] => {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const squares: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) squares.push(null);
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
};

const boardToFen = (board: (string | null)[][]): string => {
  return board.map(row => {
    let fenRow = '';
    let emptyCount = 0;
    for (const square of row) {
      if (square === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        fenRow += square;
      }
    }
    if (emptyCount > 0) fenRow += emptyCount;
    return fenRow;
  }).join('/') + ' w KQkq - 0 1';
};

const CreativeMode = () => {
  const { user, isPremium } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Board state
  const [board, setBoard] = useState<(string | null)[][]>(parseFen(STARTING_FEN));
  const [selectedPiece, setSelectedPiece] = useState<PieceKey>(null);
  const [title, setTitle] = useState('Untitled Design');
  
  // Palette state - custom colors for each piece
  const [whitePalette, setWhitePalette] = useState<Record<PieceType, string>>({
    k: '#3B82F6', q: '#EC4899', r: '#14B8A6', b: '#A855F7', n: '#F97316', p: '#64748B'
  });
  const [blackPalette, setBlackPalette] = useState<Record<PieceType, string>>({
    k: '#DC2626', q: '#7C3AED', r: '#EA580C', b: '#F59E0B', n: '#7F1D1D', p: '#57534E'
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const fen = useMemo(() => boardToFen(board), [board]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (selectedPiece === null) {
      // Clear square
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[row][col] = null;
        return newBoard;
      });
    } else {
      // Place selected piece
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[row][col] = selectedPiece;
        return newBoard;
      });
    }
  }, [selectedPiece, isPremium]);

  const clearBoard = () => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
  };

  const resetBoard = () => {
    setBoard(parseFen(STARTING_FEN));
  };

  const applyPalette = (paletteId: PaletteId) => {
    const palette = colorPalettes.find(p => p.id === paletteId);
    if (palette) {
      setWhitePalette(palette.white as Record<PieceType, string>);
      setBlackPalette(palette.black as Record<PieceType, string>);
    }
  };

  const getPieceColor = (piece: string): string => {
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase() as PieceType;
    return isWhite ? whitePalette[pieceType] : blackPalette[pieceType];
  };

  const saveDesign = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('creative_designs').insert({
        user_id: user.id,
        title,
        fen,
        palette: { white: whitePalette, black: blackPalette },
        is_public: false,
      });

      if (error) throw error;
      toast.success('Design saved!');
    } catch (e) {
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPiecePalette = () => (
    <div className="space-y-4">
      <h3 className="font-display font-bold uppercase tracking-wider text-sm">Select Piece</h3>
      
      {/* White pieces */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-display uppercase">White</p>
        <div className="flex gap-2">
          {(['K', 'Q', 'R', 'B', 'N', 'P'] as const).map(piece => (
            <button
              key={piece}
              onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                selectedPiece === piece
                  ? 'border-primary bg-primary/20 scale-110'
                  : 'border-border/50 hover:border-primary/50'
              }`}
              style={{ color: whitePalette[piece.toLowerCase() as PieceType] }}
            >
              {PIECE_SYMBOLS[piece]}
            </button>
          ))}
        </div>
      </div>

      {/* Black pieces */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-display uppercase">Black</p>
        <div className="flex gap-2">
          {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
            <button
              key={piece}
              onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                selectedPiece === piece
                  ? 'border-primary bg-primary/20 scale-110'
                  : 'border-border/50 hover:border-primary/50'
              }`}
              style={{ color: blackPalette[piece as PieceType] }}
            >
              {PIECE_SYMBOLS[piece]}
            </button>
          ))}
        </div>
      </div>

      {/* Eraser */}
      <button
        onClick={() => setSelectedPiece(null)}
        className={`w-full p-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
          selectedPiece === null
            ? 'border-primary bg-primary/20'
            : 'border-border/50 hover:border-primary/50'
        }`}
      >
        <Trash2 className="h-4 w-4" />
        <span className="text-sm font-display">Eraser</span>
      </button>
    </div>
  );

  const renderColorPickers = () => (
    <div className="space-y-4">
      <h3 className="font-display font-bold uppercase tracking-wider text-sm">Custom Colors</h3>
      
      {/* Preset palettes */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-display uppercase">Presets</p>
        <div className="grid grid-cols-4 gap-2">
          {colorPalettes.slice(0, 8).map(palette => (
            <button
              key={palette.id}
              onClick={() => applyPalette(palette.id)}
              className="p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex gap-0.5">
                {Object.values(palette.white).slice(0, 3).map((color, i) => (
                  <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-[8px] font-display truncate mt-1">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Individual color pickers */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-display uppercase">White Pieces</p>
        <div className="grid grid-cols-3 gap-2">
          {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
            <div key={piece} className="flex items-center gap-2">
              <input
                type="color"
                value={whitePalette[piece]}
                onChange={(e) => setWhitePalette(prev => ({ ...prev, [piece]: e.target.value }))}
                className="w-6 h-6 rounded cursor-pointer"
              />
              <span className="text-[10px] font-display uppercase">{piece}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-display uppercase">Black Pieces</p>
        <div className="grid grid-cols-3 gap-2">
          {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
            <div key={piece} className="flex items-center gap-2">
              <input
                type="color"
                value={blackPalette[piece]}
                onChange={(e) => setBlackPalette(prev => ({ ...prev, [piece]: e.target.value }))}
                className="w-6 h-6 rounded cursor-pointer"
              />
              <span className="text-[10px] font-display uppercase">{piece}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Wand2 className="h-4 w-4" />
              Creative Mode
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Design Your <span className="text-gold-gradient">Masterpiece</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
              Place pieces anywhere, customize every color, and create unique chess art visualizations.
            </p>
          </div>

          {!isPremium && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-4">
                <Crown className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider">Visionary Exclusive</h3>
                  <p className="text-sm text-muted-foreground font-serif">Upgrade to unlock full creative mode features</p>
                </div>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade Now
              </Button>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Board */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="max-w-xs font-display"
                  placeholder="Design title..."
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetBoard} className="gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearBoard} className="gap-1">
                    <Grid3X3 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Chess Board */}
              <div className="relative">
                {!isPremium && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="text-center">
                      <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-display uppercase tracking-wider">Premium Feature</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-8 border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl">
                  {board.map((row, rowIdx) =>
                    row.map((piece, colIdx) => {
                      const isLight = (rowIdx + colIdx) % 2 === 0;
                      return (
                        <motion.div
                          key={`${rowIdx}-${colIdx}`}
                          onClick={() => handleSquareClick(rowIdx, colIdx)}
                          className={`
                            aspect-square cursor-pointer transition-all flex items-center justify-center
                            ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                            hover:brightness-110
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {piece && (
                            <span
                              className="text-3xl md:text-4xl lg:text-5xl select-none drop-shadow-md"
                              style={{ color: getPieceColor(piece) }}
                            >
                              {PIECE_SYMBOLS[piece]}
                            </span>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* FEN Display */}
              <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1">Position (FEN)</p>
                <p className="text-xs font-mono break-all">{fen}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {renderPiecePalette()}
              {renderColorPickers()}

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Button 
                  onClick={saveDesign} 
                  className="w-full gap-2"
                  disabled={isSaving || !isPremium}
                >
                  {!isPremium && <Lock className="h-4 w-4" />}
                  <Save className="h-4 w-4" />
                  Save Design
                </Button>
                <Button variant="outline" className="w-full gap-2" disabled={!isPremium}>
                  <Eye className="h-4 w-4" />
                  Preview Visualization
                </Button>
                <Button variant="outline" className="w-full gap-2" disabled={!isPremium}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default CreativeMode;
