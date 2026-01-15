import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getVisualizationById, SavedVisualization, VisualizationState } from '@/lib/visualizations/visualizationStorage';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import { setActivePalette, setCustomColor, PaletteId, PieceType, getCurrentPalette } from '@/lib/chess/pieceColors';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore, CreativeModeTransfer } from '@/stores/sessionStore';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import { VisionaryMembershipCard } from '@/components/premium';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import UnifiedVisionExperience, { ExportState } from '@/components/chess/UnifiedVisionExperience';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';

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
    setCurrentSimulation,
    setSavedShareId,
  } = useSessionStore();
  const { setOrderData } = usePrintOrderStore();
  
  const [visualization, setVisualization] = useState<SavedVisualization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // Store original palette state for reset functionality
  const originalStateRef = useRef<VisualizationState | undefined>(undefined);
  const viewRecordedRef = useRef(false);

  // Export hook for HD/GIF downloads
  const { 
    downloadTrademarkHD,
    downloadGIF 
  } = useVisualizationExport({
    isPremium,
    visualizationId: visualization?.id,
    onUpgradeRequired: () => setShowUpgradeModal(true),
  });

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
      
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

  // Restore the saved palette when loading visualization
  const restorePaletteState = useCallback((vizState: VisualizationState | undefined) => {
    if (!vizState) return;
    
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

    const gameData = visualization.game_data;
    const fen = gameData.pgn?.split(/\s+/).find(part => part.includes('/')) || 
                'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    
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

        // Everyone can VIEW any visualization - ownership only matters for editing/saving
        // The isOwner flag controls what actions are available, not viewing rights
        const ownerCheck = user?.id === data.user_id;
        setIsOwner(ownerCheck);

        // Store original state for reset functionality
        const vizState = data.game_data.visualizationState as VisualizationState | undefined;
        originalStateRef.current = vizState;

        // Restore the palette state from the saved visualization
        restorePaletteState(vizState);

        setVisualization(data);

        // Load vision score for royalty display
        const score = await getVisionScore(data.id);
        if (score) setVisionScore(score);

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

    // Load visualization for anyone - no auth required for viewing
    loadVisualization();
  }, [id, user, restorePaletteState]);

  // Reconstruct board and gameData from stored data
  const getVisualizationData = useCallback(() => {
    if (!visualization) return null;

    const storedData = visualization.game_data;
    
    const board: SquareData[][] = storedData.board || 
      Array(8).fill(null).map((_, rank) =>
        Array(8).fill(null).map((_, file) => ({
          file,
          rank,
          visits: [],
          isLight: (file + rank) % 2 === 1,
        }))
      );
    
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
  }, [visualization]);

  // Handle exports (HD, GIF, Print)
  const handleExport = useCallback(async (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => {
    if (!visualization) return;
    
    const vizData = getVisualizationData();
    if (!vizData) return;
    
    // Build filtered board based on export state
    const filteredBoard = exportState && exportState.currentMove < vizData.totalMoves && exportState.currentMove > 0
      ? vizData.board.map(row => 
          row.map(square => ({
            ...square,
            visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove)
          }))
        )
      : vizData.board;
    
    // Build highlight state for rendering
    const highlightState = exportState?.lockedPieces && exportState.lockedPieces.length > 0 ? {
      lockedPieces: exportState.lockedPieces.map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
      })),
      compareMode: exportState.compareMode,
    } : undefined;
    
    if (type === 'preview') {
      // Preview download - uses SAME rendering as HD, but with watermark for free users
      try {
        const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
        
        const exportSimulation = {
          board: filteredBoard,
          gameData: vizData.gameData,
          totalMoves: vizData.totalMoves,
        };
        
        // Build captured state for preview with all current settings
        const capturedState = exportState ? {
          currentMove: exportState.currentMove,
          selectedPhase: 'all' as const,
          lockedPieces: exportState.lockedPieces,
          compareMode: exportState.compareMode,
          displayMode: 'standard' as const,
          darkMode: exportState.darkMode,
          showTerritory: false,
          showHeatmaps: false,
          showPieces: exportState.showPieces,
          pieceOpacity: exportState.pieceOpacity,
          capturedAt: new Date(),
        } : undefined;
        
        const base64Image = await generateCleanPrintImage(exportSimulation, {
          darkMode: exportState?.darkMode || false,
          withWatermark: !isPremium, // Add watermark for free users
          highlightState,
          capturedState,
          pgn: visualization?.pgn || vizData.gameData.pgn || '',
        });
        
        // Convert base64 to blob for download
        const response = await fetch(base64Image);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${visualization.title.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Preview downloaded!', {
          description: isPremium ? 'Full resolution image saved.' : 'Includes En Pensent branding.',
        });
      } catch (error) {
        console.error('Preview download failed:', error);
        toast.error('Download failed', { description: 'Please try again.' });
      }
      return;
    }
    
    if (type === 'hd') {
      downloadTrademarkHD({
        board: filteredBoard,
        gameData: vizData.gameData,
        title: visualization.title,
        darkMode: exportState?.darkMode || false,
        highlightState,
        piecesState: exportState ? {
          showPieces: exportState.showPieces,
          pieceOpacity: exportState.pieceOpacity,
        } : undefined,
        pgn: visualization?.pgn || vizData.gameData.pgn || '',
        currentMoveNumber: exportState?.currentMove,
      });
      return;
    }
    
    if (type === 'gif') {
      const simulation = { board: vizData.board, gameData: vizData.gameData, totalMoves: vizData.totalMoves };
      const captureElement = document.querySelector('[data-vision-board="true"]') as HTMLElement;
      const piecesState = exportState ? {
        showPieces: exportState.showPieces,
        pieceOpacity: exportState.pieceOpacity,
      } : undefined;
      
      if (captureElement) {
        downloadGIF(simulation, captureElement, visualization.title, undefined, piecesState);
      } else {
        toast.error('Unable to capture visualization');
      }
      return;
    }
    
    if (type === 'print') {
      // Save timeline state for restoration on return
      if (exportState) {
        setCapturedTimelineState({
          currentMove: exportState.currentMove,
          totalMoves: vizData.totalMoves,
          title: visualization.title,
          lockedPieces: exportState.lockedPieces.map(p => ({
            pieceType: p.pieceType as PieceType,
            pieceColor: p.pieceColor as 'w' | 'b',
          })),
          compareMode: exportState.compareMode,
          darkMode: exportState.darkMode,
        });
      }
      
      // Save simulation to session store
      setCurrentSimulation({
        board: vizData.board,
        gameData: vizData.gameData,
        totalMoves: vizData.totalMoves,
      }, visualization.pgn || '', visualization.title);
      setSavedShareId(visualization.public_share_id || '');
      setReturningFromOrder(true);
      
      // Navigate to order print page
      const orderData: PrintOrderData = {
        visualizationId: visualization.id,
        title: visualization.title,
        imagePath: visualization.image_path,
        gameData: {
          white: vizData.gameData.white,
          black: vizData.gameData.black,
          event: vizData.gameData.event,
          date: vizData.gameData.date,
          result: vizData.gameData.result,
        },
        simulation: {
          board: vizData.board,
          gameData: vizData.gameData,
          totalMoves: vizData.totalMoves,
        },
        shareId: visualization.public_share_id,
        returnPath: `/my-vision/${id}`,
        capturedState: exportState ? {
          currentMove: exportState.currentMove,
          selectedPhase: 'all',
          lockedPieces: exportState.lockedPieces,
          compareMode: exportState.compareMode,
          displayMode: 'standard',
          darkMode: exportState.darkMode,
          showTerritory: false,
          showHeatmaps: false,
          capturedAt: new Date(),
        } : undefined,
      };
      setOrderData(orderData);
      navigate('/order-print');
    }
  }, [visualization, getVisualizationData, downloadTrademarkHD, downloadGIF, navigate, setOrderData, setCapturedTimelineState, setCurrentSimulation, setSavedShareId, setReturningFromOrder, id]);

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

  if (isLoading) {
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

        {/* Unified Vision Experience - providers are handled internally */}
        <UnifiedVisionExperience
          board={vizData.board}
          gameData={vizData.gameData}
          totalMoves={vizData.totalMoves}
          pgn={visualization?.pgn || ''}
          context="gallery"
          defaultTab="experience"
          visualizationId={visualization?.id}
          paletteId={vizData.paletteId}
          createdAt={visualization?.created_at}
          title={visualization?.title}
          imageUrl={visualization?.image_path}
          onTransferToCreative={handleTransferToCreative}
          onShare={handleShare}
          onExport={handleExport}
          isPremium={isPremium}
          onUpgradePrompt={() => setShowUpgradeModal(true)}
          isOwner={isOwner}
          visionScoreData={visionScore ? {
            viewCount: visionScore.viewCount,
            uniqueViewers: visionScore.uniqueViewers,
            royaltyCentsEarned: visionScore.royaltyCentsEarned,
            royaltyOrdersCount: visionScore.royaltyOrdersCount,
            printRevenueCents: visionScore.printRevenueCents,
            printOrderCount: visionScore.printOrderCount,
            totalScore: visionScore.totalScore,
            downloadHdCount: visionScore.downloadHdCount,
            downloadGifCount: visionScore.downloadGifCount,
            tradeCount: visionScore.tradeCount,
          } : null}
        />
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