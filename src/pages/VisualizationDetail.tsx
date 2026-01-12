import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getVisualizationById, SavedVisualization, VisualizationState } from '@/lib/visualizations/visualizationStorage';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import { setActivePalette, setCustomColor, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore, CreativeModeTransfer } from '@/stores/sessionStore';
import { VisionaryMembershipCard } from '@/components/premium';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import UnifiedVisionExperience from '@/components/chess/UnifiedVisionExperience';
import { getCurrentPalette } from '@/lib/chess/pieceColors';
import { RoyaltyEarningsCard } from '@/components/vision/RoyaltyEarningsCard';

const VisualizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { 
    setCreativeModeTransfer,
    returningFromOrder,
    capturedTimelineState,
    setReturningFromOrder,
    setCapturedTimelineState,
  } = useSessionStore();
  
  const [visualization, setVisualization] = useState<SavedVisualization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  
  // Store original palette state for reset functionality
  const originalStateRef = useRef<VisualizationState | undefined>(undefined);
  const viewRecordedRef = useRef(false);

  // Handle restoration toast when returning from order page
  useEffect(() => {
    if (returningFromOrder && capturedTimelineState) {
      const { currentMove, totalMoves, title } = capturedTimelineState;
      const titleText = title || 'Visualization';
      const moveInfo = currentMove !== undefined && totalMoves !== undefined
        ? `Move ${currentMove} of ${totalMoves}`
        : currentMove !== undefined
        ? `Move ${currentMove}`
        : 'Your visualization is ready';
      
      toast.success(`${titleText} restored!`, {
        description: moveInfo,
        icon: <Sparkles className="w-4 h-4" />,
      });
      
      // Clear the flags
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

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
  }, []);

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

        // Load vision score for royalty display
        const score = await getVisionScore(data.id);
        if (score) {
          setVisionScore(score);
        }

        // Record view interaction (only once per session)
        if (!viewRecordedRef.current) {
          viewRecordedRef.current = true;
          recordVisionInteraction(data.id, 'view');
        }
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

  // Reconstruct board and gameData from stored data
  const getVisualizationData = () => {
    if (!visualization) return null;

    const storedData = visualization.game_data;
    
    // Reconstruct board
    const board: SquareData[][] = storedData.board || 
      Array(8).fill(null).map((_, rank) =>
        Array(8).fill(null).map((_, file) => ({
          file,
          rank,
          visits: [],
          isLight: (file + rank) % 2 === 1,
        }))
      );
    
    // Reconstruct gameData
    const gameData: GameData = {
      white: storedData.white || 'White',
      black: storedData.black || 'Black',
      event: storedData.event || '',
      date: storedData.date || '',
      result: storedData.result || '',
      pgn: storedData.pgn || visualization.pgn || '',
      moves: storedData.moves || [],
    };
    
    const totalMoves = storedData.totalMoves || 0;
    const paletteId = storedData.visualizationState?.paletteId;
    
    return { board, gameData, totalMoves, paletteId };
  };

  const handleBack = () => {
    navigate('/my-vision');
  };

  const handleShare = async () => {
    if (!visualization?.public_share_id) {
      toast.error('This visualization has no public share link');
      return;
    }
    
    const shareUrl = `${window.location.origin}/v/${visualization.public_share_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: visualization.title || 'Chess Visualization',
          text: 'Check out this unique chess visualization on En Pensent!',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
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

  const vizData = getVisualizationData();

  if (!vizData) {
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
        {/* Back button */}
        <div className="mb-6">
          <Button 
            onClick={handleBack} 
            variant="ghost" 
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Gallery
          </Button>
        </div>

        {/* Unified Vision Experience */}
        <TimelineProvider>
          <LegendHighlightProvider>
            <UnifiedVisionExperience
              board={vizData.board}
              gameData={vizData.gameData}
              totalMoves={vizData.totalMoves}
              context="gallery"
              defaultTab="experience"
              visualizationId={visualization?.id}
              paletteId={vizData.paletteId}
              createdAt={visualization?.created_at}
              title={visualization?.title}
              imageUrl={visualization?.image_path}
              onTransferToCreative={handleTransferToCreative}
              onShare={handleShare}
              isPremium={isPremium}
              onUpgradePrompt={() => setShowUpgradeModal(true)}
            />
          </LegendHighlightProvider>
        </TimelineProvider>

        {/* Royalty Earnings Card */}
        {visionScore && (visionScore.royaltyOrdersCount > 0 || visionScore.printOrderCount > 0) && (
          <div className="mt-8 max-w-md">
            <RoyaltyEarningsCard
              royaltyCentsEarned={visionScore.royaltyCentsEarned}
              royaltyOrdersCount={visionScore.royaltyOrdersCount}
              totalPrintRevenue={visionScore.printRevenueCents}
              printOrderCount={visionScore.printOrderCount}
            />
          </div>
        )}
      </div>
      <Footer />
      
      <VisionaryMembershipCard
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="download"
      />
    </div>
  );
};

export default VisualizationDetail;
