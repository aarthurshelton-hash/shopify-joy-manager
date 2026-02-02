import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Wand2, Save, Trash2, Crown, Lock, Sparkles, 
  Undo2, Redo2, Palette, Paintbrush, ShoppingBag, Eraser
} from 'lucide-react';
import { useUndoRedo, CreativeState } from '@/hooks/useUndoRedo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  colorPalettes, PaletteId, PieceType, PieceColor 
} from '@/lib/chess/pieceColors';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { saveVisualization } from '@/lib/visualizations/visualizationStorage';
import AuthModal from '@/components/auth/AuthModal';
import { VisionaryMembershipCard } from '@/components/premium';
import { LiveColorLegend } from '@/components/chess/LiveColorLegend';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { useNavigate } from 'react-router-dom';
import ChessBoardVisualization from '@/components/chess/ChessBoardVisualization';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { Slider } from '@/components/ui/slider';

// Color brush - maps to a piece type for the legend system
interface ColorBrush {
  pieceType: PieceType;
  pieceColor: PieceColor;
  hexColor: string;
  label: string;
}

// Build visualization board from paint data
const buildVisualizationBoard = (
  paintData: Map<string, SquareVisit[]>
): SquareData[][] => {
  const board: SquareData[][] = [];
  
  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      const squareKey = `${file}-${rank}`;
      const isLight = (file + rank) % 2 === 1;
      const visits = paintData.get(squareKey) || [];
      
      board[rank][file] = {
        file,
        rank,
        visits,
        isLight,
      };
    }
  }
  
  return board;
};

// Generate FEN from visual pattern (maps colors to piece positions)
const generateFenFromPattern = (
  paintData: Map<string, SquareVisit[]>,
  whitePalette: Record<PieceType, string>,
  blackPalette: Record<PieceType, string>
): string => {
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Map each painted square to a piece based on the most prominent color
  paintData.forEach((visits, squareKey) => {
    if (visits.length === 0) return;
    
    const [fileStr, rankStr] = squareKey.split('-');
    const file = parseInt(fileStr);
    const visualRank = parseInt(rankStr);
    const boardRank = 7 - visualRank; // Convert visual rank to board rank
    
    // Use the topmost (last) visit's piece
    const topVisit = visits[visits.length - 1];
    const pieceChar = topVisit.color === 'w' 
      ? topVisit.piece.toUpperCase() 
      : topVisit.piece.toLowerCase();
    
    if (boardRank >= 0 && boardRank < 8 && file >= 0 && file < 8) {
      board[boardRank][file] = pieceChar;
    }
  });
  
  // Build FEN string
  const fenRows: string[] = [];
  for (let rank = 0; rank < 8; rank++) {
    let row = '';
    let emptyCount = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (emptyCount > 0) {
          row += emptyCount;
          emptyCount = 0;
        }
        row += piece;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) row += emptyCount;
    fenRows.push(row);
  }
  
  return fenRows.join('/') + ' w - - 0 1';
};

const CreativeMode = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { setOrderData } = usePrintOrderStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Brush state
  const [selectedBrush, setSelectedBrush] = useState<ColorBrush | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Board state - just paint data
  const [paintData, setPaintData] = useState<Map<string, SquareVisit[]>>(new Map());
  const [moveCounter, setMoveCounter] = useState(1);
  const [title, setTitle] = useState('My Drawing');
  
  // Palette state
  const [whitePalette, setWhitePalette] = useState<Record<PieceType, string>>({
    k: '#3B82F6', q: '#EC4899', r: '#14B8A6', b: '#A855F7', n: '#F97316', p: '#64748B'
  });
  const [blackPalette, setBlackPalette] = useState<Record<PieceType, string>>({
    k: '#DC2626', q: '#7C3AED', r: '#EA580C', b: '#F59E0B', n: '#7F1D1D', p: '#57534E'
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Build color brushes from palettes
  const colorBrushes = useMemo((): ColorBrush[] => {
    const brushes: ColorBrush[] = [];
    const pieceLabels: Record<PieceType, string> = {
      k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
    };
    
    // White colors
    Object.entries(whitePalette).forEach(([piece, color]) => {
      brushes.push({
        pieceType: piece as PieceType,
        pieceColor: 'w',
        hexColor: color,
        label: `White ${pieceLabels[piece as PieceType]}`
      });
    });
    
    // Black colors
    Object.entries(blackPalette).forEach(([piece, color]) => {
      brushes.push({
        pieceType: piece as PieceType,
        pieceColor: 'b',
        hexColor: color,
        label: `Black ${pieceLabels[piece as PieceType]}`
      });
    });
    
    return brushes;
  }, [whitePalette, blackPalette]);

  // Undo/Redo system
  const initialState: CreativeState = {
    pieceBoard: Array(8).fill(null).map(() => Array(8).fill(null)),
    paintData: new Map(),
    moveCounter: 1,
  };
  const { pushState, undo, redo, resetHistory, canUndo, canRedo } = useUndoRedo(initialState);

  // Handle undo
  const handleUndo = useCallback(() => {
    const restored = undo();
    if (restored) {
      setPaintData(restored.paintData);
      setMoveCounter(restored.moveCounter);
    }
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const restored = redo();
    if (restored) {
      setPaintData(restored.paintData);
      setMoveCounter(restored.moveCounter);
    }
  }, [redo]);

  // Build the visualization board
  const visualizationBoard = useMemo(() => 
    buildVisualizationBoard(paintData),
    [paintData]
  );

  // Paint a square
  const paintSquare = useCallback((file: number, rank: number) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const squareKey = `${file}-${rank}`;
    const newPaintData = new Map(paintData);

    if (isErasing) {
      // Erase mode - clear the square
      newPaintData.delete(squareKey);
    } else if (selectedBrush) {
      // Paint mode - add color layer
      const newVisit: SquareVisit = {
        piece: selectedBrush.pieceType,
        color: selectedBrush.pieceColor,
        moveNumber: moveCounter,
        hexColor: selectedBrush.hexColor,
      };
      
      const existing = newPaintData.get(squareKey) || [];
      newPaintData.set(squareKey, [...existing, newVisit]);
      setMoveCounter(prev => prev + 1);
    } else {
      return; // No brush selected
    }
    
    setPaintData(newPaintData);
    pushState({ 
      pieceBoard: Array(8).fill(null).map(() => Array(8).fill(null)), 
      paintData: newPaintData, 
      moveCounter: isErasing ? moveCounter : moveCounter + 1 
    });
  }, [selectedBrush, isErasing, isPremium, moveCounter, paintData, pushState]);

  // Handle square interaction
  const handleSquareClick = useCallback((visualRank: number, file: number) => {
    paintSquare(file, 7 - visualRank);
  }, [paintSquare]);

  // Handle mouse drag painting
  const handleSquareHover = useCallback((visualRank: number, file: number) => {
    if (isDragging && (selectedBrush || isErasing)) {
      paintSquare(file, 7 - visualRank);
    }
  }, [isDragging, selectedBrush, isErasing, paintSquare]);

  // Apply a preset palette
  const applyPalette = (paletteId: PaletteId) => {
    const palette = colorPalettes.find(p => p.id === paletteId);
    if (palette) {
      setWhitePalette(palette.white as Record<PieceType, string>);
      setBlackPalette(palette.black as Record<PieceType, string>);
      setSelectedBrush(null); // Reset brush when palette changes
      toast.success(`Applied ${palette.name} palette`);
    }
  };

  // Clear everything
  const handleClear = () => {
    const newPaintData = new Map<string, SquareVisit[]>();
    setPaintData(newPaintData);
    setMoveCounter(1);
    resetHistory({ 
      pieceBoard: Array(8).fill(null).map(() => Array(8).fill(null)), 
      paintData: newPaintData, 
      moveCounter: 1 
    });
    toast.success('Canvas cleared');
  };

  // Order print
  const handleOrderPrint = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    if (paintData.size === 0) {
      toast.error('Draw something first!');
      return;
    }

    const fen = generateFenFromPattern(paintData, whitePalette, blackPalette);
    
    setOrderData({
      title: title,
      fen: fen,
      gameData: {
        white: 'Creative',
        black: 'Mode',
        event: title,
        date: new Date().toISOString().split('T')[0],
        result: '*',
      },
      simulation: {
        board: visualizationBoard,
        gameData: {
          white: 'Creative',
          black: 'Mode',
          event: title,
          date: new Date().toISOString().split('T')[0],
          result: '*',
          pgn: '',
          moves: [],
        },
        totalMoves: moveCounter,
      },
      whitePalette,
      blackPalette,
    });
    
    navigate('/order-print');
  };

  // Save to gallery
  const handleSaveToGallery = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    if (paintData.size === 0) {
      toast.error('Draw something first!');
      return;
    }

    setIsSaving(true);
    try {
      // Generate image from visualization
      const canvas = document.createElement('canvas');
      const size = 1200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');
      
      const squareSize = size / 8;
      
      visualizationBoard.forEach((rankData, visualRank) => {
        rankData.forEach((square, file) => {
          const x = file * squareSize;
          const y = (7 - visualRank) * squareSize;
          
          // Base color
          const baseColor = square.isLight ? '#FAFAF9' : '#2C2C2C';
          ctx.fillStyle = baseColor;
          ctx.fillRect(x, y, squareSize, squareSize);
          
          // Draw nested squares for visits
          if (square.visits.length > 0) {
            const padding = squareSize * 0.08;
            const currentSize = squareSize - padding * 2;
            const sizeReduction = (currentSize * 0.7) / Math.min(square.visits.length, 6);
            
            const uniqueColors = [...new Set(square.visits.map(v => v.hexColor))];
            
            uniqueColors.slice(0, 6).forEach((color, i) => {
              const layerSize = currentSize - i * sizeReduction;
              const offset = (squareSize - layerSize) / 2;
              ctx.fillStyle = color;
              ctx.fillRect(x + offset, y + offset, layerSize, layerSize);
            });
          }
        });
      });
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create image')), 'image/png');
      });
      
      // Save to gallery
      const result = await saveVisualization(
        user.id,
        title,
        {
          board: visualizationBoard,
          gameData: {
            white: 'Creative',
            black: 'Mode',
            event: 'Manual Drawing',
            date: new Date().toISOString().split('T')[0],
            result: '*',
            pgn: '',
            moves: [],
          },
          totalMoves: moveCounter,
        },
        blob,
        undefined,
        {
          paletteId: 'custom',
          customColors: { white: whitePalette, black: blackPalette },
        }
      );
      
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Saved to My Visions!');
        navigate('/my-vision');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Wand2 className="h-4 w-4" />
              Creative Mode
            </div>
            <h1 className="text-3xl md:text-4xl font-royal font-bold uppercase tracking-wide">
              Draw Your <span className="text-gold-gradient">Vision</span>
            </h1>
            <p className="text-muted-foreground font-serif max-w-xl mx-auto">
              Paint colors on the board to create art. Your drawing automatically generates FEN notation for prints.
            </p>
          </div>

          {/* Premium prompt */}
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
                  <p className="text-sm text-muted-foreground font-serif">Upgrade to unlock Creative Mode</p>
                </div>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade Now
              </Button>
            </motion.div>
          )}

          {/* Main content */}
          <LegendHighlightProvider>
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Left sidebar - Tools */}
              <div className="lg:col-span-3 space-y-5">
                {/* Title */}
                <div>
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2 block">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-display"
                    placeholder="My Drawing..."
                  />
                </div>

                {/* Tool mode */}
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                    Tool
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={!isErasing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsErasing(false)}
                      className="gap-2"
                    >
                      <Paintbrush className="h-4 w-4" />
                      Paint
                    </Button>
                    <Button
                      variant={isErasing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsErasing(true)}
                      className="gap-2"
                    >
                      <Eraser className="h-4 w-4" />
                      Erase
                    </Button>
                  </div>
                </div>

                {/* Color palette - only show when painting */}
                {!isErasing && (
                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                      Color Brush
                    </label>
                    
                    {/* White colors */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground/60 font-display uppercase">Light Tones</p>
                      <div className="flex gap-2 flex-wrap">
                        {colorBrushes.slice(0, 6).map((brush, i) => (
                          <button
                            key={`w-${i}`}
                            onClick={() => setSelectedBrush(brush)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              selectedBrush?.hexColor === brush.hexColor && selectedBrush?.pieceColor === brush.pieceColor
                                ? 'border-white scale-110 shadow-lg ring-2 ring-primary'
                                : 'border-border/30 hover:border-primary/50 hover:scale-105'
                            }`}
                            style={{ backgroundColor: brush.hexColor }}
                            title={brush.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Black colors */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground/60 font-display uppercase">Dark Tones</p>
                      <div className="flex gap-2 flex-wrap">
                        {colorBrushes.slice(6, 12).map((brush, i) => (
                          <button
                            key={`b-${i}`}
                            onClick={() => setSelectedBrush(brush)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              selectedBrush?.hexColor === brush.hexColor && selectedBrush?.pieceColor === brush.pieceColor
                                ? 'border-white scale-110 shadow-lg ring-2 ring-primary'
                                : 'border-border/30 hover:border-primary/50 hover:scale-105'
                            }`}
                            style={{ backgroundColor: brush.hexColor }}
                            title={brush.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Palette presets */}
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                    <Palette className="h-3 w-3 inline mr-1" />
                    Presets
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.slice(0, 8).map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => applyPalette(palette.id)}
                        className="p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all group"
                        title={palette.name}
                      >
                        <div className="flex gap-0.5 justify-center">
                          {Object.values(palette.white).slice(0, 3).map((color, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUndo} 
                      disabled={!canUndo}
                      className="gap-1"
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="gap-1"
                    >
                      <Redo2 className="h-3 w-3" />
                      Redo
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClear} 
                    className="w-full gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear Canvas
                  </Button>
                </div>
              </div>

              {/* Center - Canvas */}
              <div className="lg:col-span-6 space-y-4">
                <div className="relative" ref={canvasRef}>
                  {!isPremium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                      <div className="text-center">
                        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-display uppercase tracking-wider">Premium Feature</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Interactive canvas */}
                  <div 
                    className="aspect-square w-full max-w-lg mx-auto relative"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {/* Grid overlay for interaction */}
                    <div className="absolute inset-0 grid grid-cols-8 z-10">
                      {Array.from({ length: 64 }).map((_, idx) => {
                        const row = Math.floor(idx / 8);
                        const col = idx % 8;
                        return (
                          <div
                            key={idx}
                            className="aspect-square cursor-crosshair hover:bg-white/10 transition-colors"
                            onClick={() => handleSquareClick(row, col)}
                            onMouseEnter={() => handleSquareHover(row, col)}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Visualization */}
                    <ChessBoardVisualization 
                      board={visualizationBoard}
                      size={500}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-center pt-4">
                  <Button 
                    onClick={handleSaveToGallery} 
                    variant="outline"
                    className="gap-2"
                    disabled={isSaving || !isPremium || paintData.size === 0}
                  >
                    {isSaving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Save className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <>
                        {!isPremium && <Lock className="h-4 w-4" />}
                        <Save className="h-4 w-4" />
                        Save to Gallery
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleOrderPrint}
                    className="gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    disabled={!isPremium || paintData.size === 0}
                  >
                    {!isPremium && <Lock className="h-4 w-4" />}
                    <ShoppingBag className="h-4 w-4" />
                    Order Print
                  </Button>
                </div>
                
                {/* Tip */}
                <p className="text-center text-xs text-muted-foreground/60 font-serif">
                  Click or drag to paint. Your artwork auto-generates position data for prints.
                </p>
              </div>

              {/* Right sidebar - Legend */}
              <div className="lg:col-span-3 space-y-4">
                <LiveColorLegend
                  whitePalette={whitePalette}
                  blackPalette={blackPalette}
                  title="Your Colors"
                />
                
                {/* Color customization */}
                <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50">
                  <h3 className="font-display font-bold uppercase tracking-wider text-xs">
                    Customize Palette
                  </h3>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-display uppercase">Light Tones</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
                        <div key={piece} className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={whitePalette[piece]}
                            onChange={(e) => {
                              setWhitePalette(prev => ({ ...prev, [piece]: e.target.value }));
                              setSelectedBrush(null);
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                          <span className="text-[9px] font-display uppercase text-muted-foreground">{piece}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-display uppercase">Dark Tones</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
                        <div key={piece} className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={blackPalette[piece]}
                            onChange={(e) => {
                              setBlackPalette(prev => ({ ...prev, [piece]: e.target.value }));
                              setSelectedBrush(null);
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                          <span className="text-[9px] font-display uppercase text-muted-foreground">{piece}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-2">
                  <h3 className="font-display font-bold uppercase tracking-wider text-xs">Canvas Stats</h3>
                  <div className="text-sm text-muted-foreground font-serif space-y-1">
                    <p>Painted squares: <span className="text-foreground font-medium">{paintData.size}</span></p>
                    <p>Color layers: <span className="text-foreground font-medium">{moveCounter - 1}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </LegendHighlightProvider>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <VisionaryMembershipCard
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="save"
      />
    </div>
  );
};

export default CreativeMode;
