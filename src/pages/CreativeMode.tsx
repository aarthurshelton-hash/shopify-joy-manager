import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Wand2, Download, Save, Trash2, 
  RotateCcw, Crown, Lock, Sparkles, Eye, Grid3X3, ArrowLeft,
  Upload, FolderOpen, Palette, Paintbrush, EyeOff, MousePointer2,
  Undo2, Redo2
} from 'lucide-react';
import { useUndoRedo, CreativeState } from '@/hooks/useUndoRedo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  colorPalettes, PaletteId, PieceType, PieceColor, 
  getPieceColor as getGlobalPieceColor 
} from '@/lib/chess/pieceColors';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { getUserVisualizations, SavedVisualization, saveVisualization } from '@/lib/visualizations/visualizationStorage';
import AuthModal from '@/components/auth/AuthModal';
import PremiumUpgradeModal from '@/components/premium/PremiumUpgradeModal';
import { LiveColorLegend } from '@/components/chess/LiveColorLegend';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { useSessionStore } from '@/stores/sessionStore';
import { useNavigate } from 'react-router-dom';
import ChessBoardVisualization from '@/components/chess/ChessBoardVisualization';

type PieceKey = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | null;
type EditMode = 'place' | 'paint' | 'erase';

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

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

// Convert piece board + manual paint data to SquareData[][] for visualization
const buildVisualizationBoard = (
  pieceBoard: (string | null)[][],
  paintData: Map<string, SquareVisit[]>,
  whitePalette: Record<PieceType, string>,
  blackPalette: Record<PieceType, string>
): SquareData[][] => {
  const board: SquareData[][] = [];
  
  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      const squareKey = `${file}-${rank}`;
      const isLight = (file + rank) % 2 === 1;
      
      // Get visits from paint data or from piece on square
      let visits: SquareVisit[] = paintData.get(squareKey) || [];
      
      // If no manual paint, add current piece as a visit
      if (visits.length === 0) {
        const piece = pieceBoard[7 - rank]?.[file]; // Flip rank for display
        if (piece) {
          const isWhite = piece === piece.toUpperCase();
          const pieceType = piece.toLowerCase() as PieceType;
          const pieceColor: PieceColor = isWhite ? 'w' : 'b';
          const hexColor = isWhite ? whitePalette[pieceType] : blackPalette[pieceType];
          
          visits = [{
            piece: pieceType,
            color: pieceColor,
            moveNumber: 1,
            hexColor,
          }];
        }
      }
      
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

// Import Modal for loading visions
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (viz: SavedVisualization) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const { user } = useAuth();
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadVisualizations();
    }
  }, [isOpen, user]);

  const loadVisualizations = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await getUserVisualizations(user.id);
    setVisualizations(data || []);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[70vh] overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Import from My Visions</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[50vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : visualizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No saved visions found. Create and save a visualization first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {visualizations.map(viz => (
                <button
                  key={viz.id}
                  onClick={() => { onImport(viz); onClose(); }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
                >
                  <img 
                    src={viz.image_path} 
                    alt={viz.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium px-2 text-center">{viz.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const CreativeMode = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { creativeModeTransfer, clearCreativeModeTransfer } = useSessionStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState<EditMode>('paint');
  const [selectedPiece, setSelectedPiece] = useState<PieceKey>('P');
  const [showVisualization, setShowVisualization] = useState(true);
  
  // Board state
  const [pieceBoard, setPieceBoard] = useState<(string | null)[][]>(parseFen(STARTING_FEN));
  const [title, setTitle] = useState('Creative Design');
  const [sourceVisualizationId, setSourceVisualizationId] = useState<string | null>(null);
  
  // Paint data - manual color assignments per square
  const [paintData, setPaintData] = useState<Map<string, SquareVisit[]>>(new Map());
  const [moveCounter, setMoveCounter] = useState(1);
  
  // Palette state
  const [whitePalette, setWhitePalette] = useState<Record<PieceType, string>>({
    k: '#3B82F6', q: '#EC4899', r: '#14B8A6', b: '#A855F7', n: '#F97316', p: '#64748B'
  });
  const [blackPalette, setBlackPalette] = useState<Record<PieceType, string>>({
    k: '#DC2626', q: '#7C3AED', r: '#EA580C', b: '#F59E0B', n: '#7F1D1D', p: '#57534E'
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Undo/Redo system
  const initialState: CreativeState = {
    pieceBoard: parseFen(STARTING_FEN),
    paintData: new Map(),
    moveCounter: 1,
  };
  const { pushState, undo, redo, resetHistory, canUndo, canRedo } = useUndoRedo(initialState);

  // Push state changes to history
  const saveToHistory = useCallback(() => {
    pushState({ pieceBoard, paintData, moveCounter });
  }, [pushState, pieceBoard, paintData, moveCounter]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const restored = undo();
    if (restored) {
      setPieceBoard(restored.pieceBoard);
      setPaintData(restored.paintData);
      setMoveCounter(restored.moveCounter);
    }
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const restored = redo();
    if (restored) {
      setPieceBoard(restored.pieceBoard);
      setPaintData(restored.paintData);
      setMoveCounter(restored.moveCounter);
    }
  }, [redo]);

  // Load transferred data from visualization detail page
  useEffect(() => {
    if (creativeModeTransfer) {
      setPieceBoard(creativeModeTransfer.board);
      setWhitePalette(creativeModeTransfer.whitePalette);
      setBlackPalette(creativeModeTransfer.blackPalette);
      setTitle(creativeModeTransfer.title);
      if (creativeModeTransfer.sourceVisualizationId) {
        setSourceVisualizationId(creativeModeTransfer.sourceVisualizationId);
      }
      clearCreativeModeTransfer();
      toast.success('Loaded from your vision');
    }
  }, [creativeModeTransfer, clearCreativeModeTransfer]);

  // Build the visualization board data
  const visualizationBoard = useMemo(() => 
    buildVisualizationBoard(pieceBoard, paintData, whitePalette, blackPalette),
    [pieceBoard, paintData, whitePalette, blackPalette]
  );

  // Handle square click based on edit mode
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const squareKey = `${col}-${7 - row}`; // Convert to visualization coords

    if (editMode === 'erase') {
      // Clear the square
      const newBoard = pieceBoard.map(r => [...r]);
      newBoard[row][col] = null;
      setPieceBoard(newBoard);
      
      const newPaintData = new Map(paintData);
      newPaintData.delete(squareKey);
      setPaintData(newPaintData);
      
      // Save to history
      pushState({ pieceBoard: newBoard, paintData: newPaintData, moveCounter });
    } else if (editMode === 'place' && selectedPiece) {
      // Place a piece
      const newBoard = pieceBoard.map(r => [...r]);
      newBoard[row][col] = selectedPiece;
      setPieceBoard(newBoard);
      
      // Save to history
      pushState({ pieceBoard: newBoard, paintData, moveCounter });
    } else if (editMode === 'paint' && selectedPiece) {
      // Paint a color layer on the square (adds to existing)
      const isWhite = selectedPiece === selectedPiece.toUpperCase();
      const pieceType = selectedPiece.toLowerCase() as PieceType;
      const pieceColor: PieceColor = isWhite ? 'w' : 'b';
      const hexColor = isWhite ? whitePalette[pieceType] : blackPalette[pieceType];
      
      const newVisit: SquareVisit = {
        piece: pieceType,
        color: pieceColor,
        moveNumber: moveCounter,
        hexColor,
      };
      
      const newPaintData = new Map(paintData);
      const existing = newPaintData.get(squareKey) || [];
      newPaintData.set(squareKey, [...existing, newVisit]);
      setPaintData(newPaintData);
      
      const newMoveCounter = moveCounter + 1;
      setMoveCounter(newMoveCounter);
      
      // Save to history
      pushState({ pieceBoard, paintData: newPaintData, moveCounter: newMoveCounter });
    }
  }, [editMode, selectedPiece, isPremium, whitePalette, blackPalette, moveCounter, pieceBoard, paintData, pushState]);

  // Import a vision
  const handleImportVision = (viz: SavedVisualization) => {
    // Load the visualization data
    const newPaintData = new Map<string, SquareVisit[]>();
    
    if (viz.game_data.board) {
      // Convert SquareData to paint data
      (viz.game_data.board as SquareData[][]).forEach((rankData, rank) => {
        rankData.forEach((square, file) => {
          if (square.visits && square.visits.length > 0) {
            newPaintData.set(`${file}-${rank}`, square.visits);
          }
        });
      });
      
      setPaintData(newPaintData);
    }
    
    // Load palette from visualization state
    const vizState = viz.game_data.visualizationState;
    if (vizState?.customColors) {
      setWhitePalette(vizState.customColors.white as Record<PieceType, string>);
      setBlackPalette(vizState.customColors.black as Record<PieceType, string>);
    }
    
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    setTitle(`${viz.title} (Edited)`);
    setSourceVisualizationId(viz.id);
    setPieceBoard(newBoard);
    
    // Reset history with imported state
    resetHistory({ pieceBoard: newBoard, paintData: newPaintData, moveCounter: 1 });
    toast.success('Vision imported! Now customize it.');
  };

  // Apply a preset palette
  const applyPalette = (paletteId: PaletteId) => {
    const palette = colorPalettes.find(p => p.id === paletteId);
    if (palette) {
      setWhitePalette(palette.white as Record<PieceType, string>);
      setBlackPalette(palette.black as Record<PieceType, string>);
      toast.success(`Applied ${palette.name} palette`);
    }
  };

  // Clear everything
  const handleClear = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    const newPaintData = new Map<string, SquareVisit[]>();
    setPieceBoard(newBoard);
    setPaintData(newPaintData);
    setMoveCounter(1);
    resetHistory({ pieceBoard: newBoard, paintData: newPaintData, moveCounter: 1 });
    toast.success('Canvas cleared');
  };

  // Reset to starting position
  const handleReset = () => {
    const newBoard = parseFen(STARTING_FEN);
    const newPaintData = new Map<string, SquareVisit[]>();
    setPieceBoard(newBoard);
    setPaintData(newPaintData);
    setMoveCounter(1);
    resetHistory({ pieceBoard: newBoard, paintData: newPaintData, moveCounter: 1 });
    toast.success('Reset to starting position');
  };

  // Get piece color
  const getPieceColor = (piece: string): string => {
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase() as PieceType;
    return isWhite ? whitePalette[pieceType] : blackPalette[pieceType];
  };

  // Save as new vision
  const handleSaveToGallery = async () => {
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
      // Generate image from visualization
      const canvas = document.createElement('canvas');
      const size = 1200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');
      
      // Simple rendering - draw the visualization
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
            let currentSize = squareSize - padding * 2;
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
            event: 'Manual Design',
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
      
      <main className="container mx-auto px-4 py-8 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Return navigation */}
          {sourceVisualizationId && (
            <Button 
              onClick={() => navigate(`/my-vision/${sourceVisualizationId}`)}
              variant="ghost" 
              className="gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Original Vision
            </Button>
          )}

          {/* Hero */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Wand2 className="h-4 w-4" />
              Creative Mode
            </div>
            <h1 className="text-3xl md:text-4xl font-royal font-bold uppercase tracking-wide">
              Manual <span className="text-gold-gradient">Visualization</span> Studio
            </h1>
            <p className="text-muted-foreground font-serif max-w-2xl mx-auto">
              Paint colors manually, import your visions, and create unique artworks with full control over every square.
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
              <div className="lg:col-span-3 space-y-6">
                {/* Title input */}
                <div>
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2 block">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-display"
                    placeholder="Design title..."
                  />
                </div>

                {/* Edit mode tabs */}
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Edit Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={editMode === 'paint' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('paint')}
                      className="gap-1 text-xs"
                    >
                      <Paintbrush className="h-3 w-3" />
                      Paint
                    </Button>
                    <Button
                      variant={editMode === 'place' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('place')}
                      className="gap-1 text-xs"
                    >
                      <MousePointer2 className="h-3 w-3" />
                      Place
                    </Button>
                    <Button
                      variant={editMode === 'erase' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('erase')}
                      className="gap-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                      Erase
                    </Button>
                  </div>
                </div>

                {/* Piece selector */}
                {(editMode === 'paint' || editMode === 'place') && (
                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                      {editMode === 'paint' ? 'Select Color' : 'Select Piece'}
                    </label>
                    
                    {/* White pieces */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-display uppercase">White</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(['K', 'Q', 'R', 'B', 'N', 'P'] as const).map(piece => (
                          <button
                            key={piece}
                            onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
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
                      <p className="text-[10px] text-muted-foreground font-display uppercase">Black</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
                          <button
                            key={piece}
                            onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
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
                  </div>
                )}

                {/* Palette presets */}
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Presets</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {colorPalettes.slice(0, 8).map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => applyPalette(palette.id)}
                        className="p-1.5 rounded border border-border/50 hover:border-primary/50 transition-all group"
                        title={palette.name}
                      >
                        <div className="flex gap-0.5 justify-center">
                          {Object.values(palette.white).slice(0, 3).map((color, i) => (
                            <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowImportModal(true)}
                    className="w-full gap-2"
                    disabled={!isPremium}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Import Vision
                  </Button>
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClear} className="gap-1">
                      <Grid3X3 className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center - Canvas */}
              <div className="lg:col-span-6 space-y-4">
                {/* Toggle visualization view */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-display">
                    {showVisualization ? 'Visualization Preview' : 'Piece Board'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVisualization(!showVisualization)}
                    className="gap-2"
                  >
                    {showVisualization ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showVisualization ? 'Show Board' : 'Show Art'}
                  </Button>
                </div>

                <div className="relative" ref={canvasRef}>
                  {!isPremium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                      <div className="text-center">
                        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-display uppercase tracking-wider">Premium Feature</p>
                      </div>
                    </div>
                  )}
                  
                  <AnimatePresence mode="wait">
                    {showVisualization ? (
                      <motion.div
                        key="visualization"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="aspect-square w-full max-w-lg mx-auto"
                      >
                        <ChessBoardVisualization 
                          board={visualizationBoard}
                          size={500}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="board"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-8 border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl max-w-lg mx-auto"
                      >
                        {pieceBoard.map((row, rowIdx) =>
                          row.map((piece, colIdx) => {
                            const isLight = (rowIdx + colIdx) % 2 === 0;
                            
                            return (
                              <motion.div
                                key={`${rowIdx}-${colIdx}`}
                                onClick={() => handleSquareClick(rowIdx, colIdx)}
                                className={`
                                  aspect-square cursor-pointer transition-all flex items-center justify-center
                                  ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                                  hover:brightness-110 touch-manipulation select-none
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {piece && (
                                  <span
                                    className="text-3xl md:text-4xl select-none drop-shadow-md"
                                    style={{ color: getPieceColor(piece) }}
                                  >
                                    {PIECE_SYMBOLS[piece]}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Save actions */}
                <div className="flex gap-3 justify-center pt-4">
                  <Button 
                    onClick={handleSaveToGallery} 
                    className="gap-2"
                    disabled={isSaving || !isPremium}
                  >
                    {isSaving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Save className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <>
                        {!isPremium && <Lock className="h-4 w-4" />}
                        <Save className="h-4 w-4" />
                        Save to My Visions
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right sidebar - Legend */}
              <div className="lg:col-span-3">
                <LiveColorLegend
                  whitePalette={whitePalette}
                  blackPalette={blackPalette}
                  title="Color Palette"
                />
                
                {/* Color customization */}
                <div className="mt-6 space-y-4 p-4 rounded-lg border border-border/50 bg-card/50">
                  <h3 className="font-display font-bold uppercase tracking-wider text-xs">Customize Colors</h3>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-display uppercase">White Pieces</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
                        <div key={piece} className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={whitePalette[piece]}
                            onChange={(e) => setWhitePalette(prev => ({ ...prev, [piece]: e.target.value }))}
                            className="w-5 h-5 rounded cursor-pointer border-0"
                          />
                          <span className="text-[9px] font-display uppercase">{piece}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-display uppercase">Black Pieces</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['k', 'q', 'r', 'b', 'n', 'p'] as const).map(piece => (
                        <div key={piece} className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={blackPalette[piece]}
                            onChange={(e) => setBlackPalette(prev => ({ ...prev, [piece]: e.target.value }))}
                            className="w-5 h-5 rounded cursor-pointer border-0"
                          />
                          <span className="text-[9px] font-display uppercase">{piece}</span>
                        </div>
                      ))}
                    </div>
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
      
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <AnimatePresence>
        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportVision}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreativeMode;
