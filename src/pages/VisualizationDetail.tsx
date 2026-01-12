import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getVisualizationById, SavedVisualization, VisualizationState } from '@/lib/visualizations/visualizationStorage';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { setActivePalette, setCustomColor, PaletteId, PieceType, colorPalettes, getActivePalette, getCurrentPalette } from '@/lib/chess/pieceColors';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import PrintPreview from '@/components/chess/PrintPreview';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, Wand2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore, CreativeModeTransfer } from '@/stores/sessionStore';
import PremiumUpgradeModal from '@/components/premium/PremiumUpgradeModal';

const VisualizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { setCreativeModeTransfer } = useSessionStore();
  
  const [visualization, setVisualization] = useState<SavedVisualization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Store original palette state for reset functionality
  const originalStateRef = useRef<VisualizationState | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);

  // Restore the saved palette when loading visualization
  const restorePaletteState = useCallback((vizState: VisualizationState | undefined) => {
    if (!vizState) return;
    
    // If custom colors were saved, restore them
    if (vizState.customColors) {
      const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
      pieces.forEach(piece => {
        if (vizState.customColors?.white[piece]) {
          setCustomColor('w', piece, vizState.customColors.white[piece]);
        }
        if (vizState.customColors?.black[piece]) {
          setCustomColor('b', piece, vizState.customColors.black[piece]);
        }
      });
      setActivePalette('custom');
    } else if (vizState.paletteId) {
      // Restore the saved palette
      setActivePalette(vizState.paletteId as PaletteId);
    }
    setHasChanges(false);
  }, []);

  // Reset to saved state
  const handleResetToSaved = useCallback(() => {
    restorePaletteState(originalStateRef.current);
    toast.success('Restored to saved state');
  }, [restorePaletteState]);

  // Transfer to Creative Mode
  const handleTransferToCreative = useCallback(() => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!visualization) return;

    // Build the board from the final position (FEN) or simulation data
    const gameData = visualization.game_data;
    const fen = gameData.pgn?.split(/\s+/).find(part => part.includes('/')) || 
                'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    
    // Parse FEN to board array
    const parseFenToBoard = (fenStr: string): (string | null)[][] => {
      const rows = fenStr.split(' ')[0].split('/');
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

    // Get current palette colors
    const currentPalette = getCurrentPalette();
    
    const transferData: CreativeModeTransfer = {
      board: parseFenToBoard(fen),
      whitePalette: currentPalette.white as Record<PieceType, string>,
      blackPalette: currentPalette.black as Record<PieceType, string>,
      title: `${visualization.title} (Creative Edit)`,
      sourceVisualizationId: visualization.id,
    };

    setCreativeModeTransfer(transferData);
    navigate('/creative-mode');
    toast.success('Transferred to Creative Mode');
  }, [visualization, isPremium, setCreativeModeTransfer, navigate]);

  // Track palette changes
  useEffect(() => {
    const checkForChanges = () => {
      if (!originalStateRef.current) return;
      
      const currentPalette = getActivePalette();
      const originalPaletteId = originalStateRef.current.paletteId || 'modern';
      
      if (currentPalette.id !== originalPaletteId) {
        setHasChanges(true);
      }
    };

    // Check periodically for changes (simple approach)
    const interval = setInterval(checkForChanges, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) {
      setError('Invalid visualization ID');
      setIsLoading(false);
      return;
    }

    const loadVisualization = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getVisualizationById(id);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setError('Visualization not found');
          return;
        }

        // Check ownership
        if (data.user_id !== user?.id) {
          setError('You do not have permission to view this visualization');
          return;
        }

        // Store original state for reset functionality
        const vizState = data.game_data.visualizationState as VisualizationState | undefined;
        originalStateRef.current = vizState;

        // Restore the palette state from the saved visualization
        restorePaletteState(vizState);

        setVisualization(data);
      } catch (err) {
        console.error('Failed to load visualization:', err);
        setError('Failed to load visualization');
        toast.error('Failed to load visualization');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadVisualization();
    } else if (!authLoading) {
      setError('Please sign in to view this visualization');
      setIsLoading(false);
    }
  }, [id, user, authLoading, restorePaletteState]);

  // Reconstruct SimulationResult from stored game_data
  const reconstructSimulation = (): SimulationResult | null => {
    if (!visualization) return null;

    const gameData = visualization.game_data;
    
    // Check if we have full board data stored
    if (gameData.board && Array.isArray(gameData.board)) {
      return {
        board: gameData.board as SquareData[][],
        gameData: {
          white: gameData.white || 'White',
          black: gameData.black || 'Black',
          event: gameData.event || '',
          date: gameData.date || '',
          result: gameData.result || '',
          pgn: gameData.pgn || visualization.pgn || '',
          moves: gameData.moves || [],
        },
        totalMoves: gameData.totalMoves || 0,
      };
    }
    
    // Fallback for older visualizations without board data
    // Create an empty board structure
    const emptyBoard: SquareData[][] = Array(8).fill(null).map((_, rank) =>
      Array(8).fill(null).map((_, file) => ({
        file,
        rank,
        visits: [],
        isLight: (file + rank) % 2 === 1,
      }))
    );
    
    return {
      board: emptyBoard,
      gameData: {
        white: gameData.white || 'White',
        black: gameData.black || 'Black',
        event: gameData.event || '',
        date: gameData.date || '',
        result: gameData.result || '',
        pgn: gameData.pgn || visualization.pgn || '',
        moves: gameData.moves || [],
      },
      totalMoves: gameData.totalMoves || 0,
    };
  };

  const handleBack = () => {
    navigate('/my-vision');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Unable to Load</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Gallery
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const simulation = reconstructSimulation();

  if (!simulation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Invalid Visualization Data</h1>
            <p className="text-muted-foreground">The visualization data could not be loaded.</p>
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Gallery
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Back button and title with action buttons */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Button 
              onClick={handleBack} 
              variant="ghost" 
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Gallery
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Reset to Saved button - only show if changes made */}
              {hasChanges && (
                <Button 
                  onClick={handleResetToSaved}
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Saved
                </Button>
              )}
              
              {/* Transfer to Creative Mode */}
              <Button 
                onClick={handleTransferToCreative}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Edit in Creative Mode
                {!isPremium && <Crown className="h-3 w-3 text-primary ml-1" />}
              </Button>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold">{visualization?.title}</h1>
          <p className="text-muted-foreground mt-1">
            {simulation.gameData.white} vs {simulation.gameData.black}
            {simulation.gameData.event && ` • ${simulation.gameData.event}`}
            {simulation.gameData.date && ` • ${simulation.gameData.date}`}
          </p>
        </div>

        {/* Full PrintPreview experience */}
        <TimelineProvider>
          <LegendHighlightProvider>
            <PrintPreview
              simulation={simulation}
              pgn={visualization?.pgn || undefined}
              title={visualization?.title}
            />
          </LegendHighlightProvider>
        </TimelineProvider>
      </div>
      <Footer />
      
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default VisualizationDetail;
