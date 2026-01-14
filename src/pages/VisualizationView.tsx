import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Crown, Calendar, ChevronLeft, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import UnifiedVisionExperience, { ExportState } from '@/components/chess/UnifiedVisionExperience';
import { useSessionStore } from '@/stores/sessionStore';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import { useAuth } from '@/hooks/useAuth';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';
import AuthModal from '@/components/auth/AuthModal';
import { PremiumUpgradeModal } from '@/components/premium';
import { setActivePalette, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import { buildShareUrl, decodeShareState, ShareableState } from '@/lib/visualizations/shareStateEncoding';

interface VisualizationData {
  id: string;
  title: string;
  image_path: string;
  pgn: string | null;
  game_data: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    result?: string;
    pgn?: string; // PGN can be stored in game_data as well
    moves?: string[];
    totalMoves?: number;
    board?: SquareData[][];
    visualizationState?: {
      paletteId?: string;
      darkMode?: boolean;
    };
    [key: string]: unknown;
  };
  created_at: string;
  public_share_id: string;
}

const VisualizationView = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const { 
    setCurrentSimulation, 
    setSavedShareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    returningFromOrder,
    capturedTimelineState,
  } = useSessionStore();
  
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const viewRecordedRef = useRef(false);
  
  // Decode initial state from URL for stateful share links
  const initialState = useMemo(() => {
    const encoded = searchParams.get('s');
    const decoded = decodeShareState(encoded);
    
    // Transform to match UnifiedVisionExperience initialState format
    return {
      move: decoded.move,
      dark: decoded.dark,
      pieces: decoded.pieces,
      opacity: decoded.opacity,
      locked: decoded.locked?.map(l => ({ type: l.type, color: l.color })),
      compare: decoded.compare,
      territory: decoded.territory,
      heatmaps: decoded.heatmaps,
      phase: decoded.phase,
    };
  }, [searchParams]);
  
  // Export hook for HD/GIF downloads
  const { 
    downloadTrademarkHD,
    downloadGIF 
  } = useVisualizationExport({
    isPremium,
    visualizationId: visualization?.id,
    onUnauthorized: () => setShowAuthModal(true),
    onUpgradeRequired: () => setShowVisionaryModal(true),
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

  useEffect(() => {
    const fetchVisualization = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('*')
          .eq('public_share_id', shareId)
          .single();

        if (fetchError || !data) {
          setError('Visualization not found');
          setLoading(false);
          return;
        }

        // Restore palette if saved
        const vizData = data as VisualizationData;
        const paletteId = vizData.game_data?.visualizationState?.paletteId;
        if (paletteId && paletteId !== 'custom') {
          setActivePalette(paletteId as PaletteId);
        }

        setVisualization(vizData);

        // Record view interaction (only once per session)
        if (!viewRecordedRef.current) {
          viewRecordedRef.current = true;
          recordVisionInteraction(data.id, 'view');
          
          // Fetch vision score
          getVisionScore(data.id).then(score => {
            if (score) setVisionScore(score);
          });
        }
      } catch (err) {
        console.error('Error fetching visualization:', err);
        setError('Failed to load visualization');
      } finally {
        setLoading(false);
      }
    };

    fetchVisualization();
  }, [shareId]);

  const handleShare = useCallback(async (exportState?: ExportState) => {
    const baseUrl = `${window.location.origin}/v/${shareId}`;
    
    // Build comprehensive stateful share URL
    const shareableState: ShareableState = exportState ? {
      move: exportState.currentMove > 0 && exportState.currentMove !== Infinity 
        ? exportState.currentMove 
        : undefined,
      dark: exportState.darkMode || undefined,
      pieces: exportState.showPieces || undefined,
      opacity: exportState.pieceOpacity !== 0.7 ? exportState.pieceOpacity : undefined,
      locked: exportState.lockedPieces?.length > 0 
        ? exportState.lockedPieces.map(p => ({ type: p.pieceType, color: p.pieceColor }))
        : undefined,
      compare: exportState.compareMode || undefined,
    } : {};
    
    const url = buildShareUrl(baseUrl, shareableState);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: visualization?.title || 'Chess Visualization',
          text: 'Check out this beautiful chess game visualization from En Pensent',
          url
        });
      } catch (err) {
        // User cancelled or error - fallback to clipboard
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  }, [shareId, visualization?.title]);

  // Reconstruct board and game data
  const { board, gameData, totalMoves, paletteId } = useMemo(() => {
    if (!visualization) {
      return { 
        board: [] as SquareData[][], 
        gameData: {} as GameData, 
        totalMoves: 0,
        paletteId: undefined,
      };
    }

    const data = visualization.game_data;
    
    const reconstructedBoard: SquareData[][] = data.board && Array.isArray(data.board)
      ? data.board
      : Array(8).fill(null).map((_, rank) =>
          Array(8).fill(null).map((_, file) => ({
            file,
            rank,
            visits: [],
            isLight: (file + rank) % 2 === 1,
          }))
        );

    const reconstructedGameData: GameData = {
      white: data.white || 'White',
      black: data.black || 'Black',
      event: data.event || '',
      date: data.date || '',
      result: data.result || '',
      pgn: (data.pgn as string) || visualization.pgn || '',
      moves: data.moves || [],
    };

    return {
      board: reconstructedBoard,
      gameData: reconstructedGameData,
      totalMoves: data.totalMoves || data.moves?.length || 0,
      paletteId: data.visualizationState?.paletteId as string | undefined,
    };
  }, [visualization]);

  // Handle exports (HD, GIF, Print)
  const handleExport = useCallback(async (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => {
    if (!visualization) return;
    
    // Build filtered board based on export state
    const filteredBoard = exportState && exportState.currentMove < totalMoves && exportState.currentMove > 0
      ? board.map(row => 
          row.map(square => ({
            ...square,
            visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove)
          }))
        )
      : board;
    
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
          gameData,
          totalMoves,
        };
        
        const base64Image = await generateCleanPrintImage(exportSimulation, {
          darkMode: exportState?.darkMode || false,
          withWatermark: !isPremium, // Add watermark for free users
          highlightState,
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
        board,
        gameData,
        title: visualization.title,
        darkMode: exportState?.darkMode || false,
      });
      return;
    }
    
    if (type === 'gif') {
      const simulation = { board, gameData, totalMoves };
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
          totalMoves,
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
      setCurrentSimulation({ board, gameData, totalMoves }, visualization.pgn || '', visualization.title);
      setSavedShareId(visualization.public_share_id);
      setReturningFromOrder(true);
      
      // Navigate to order print page
      const orderData: PrintOrderData = {
        visualizationId: visualization.id,
        title: visualization.title,
        imagePath: visualization.image_path,
        gameData: {
          white: gameData.white,
          black: gameData.black,
          event: gameData.event,
          date: gameData.date,
          result: gameData.result,
        },
        simulation: { board, gameData, totalMoves },
        shareId: visualization.public_share_id,
        returnPath: `/v/${shareId}`,
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
  }, [visualization, board, gameData, totalMoves, shareId, downloadTrademarkHD, downloadGIF, navigate, setOrderData, setCapturedTimelineState, setCurrentSimulation, setSavedShareId, setReturningFromOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !visualization) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="h-10 w-10 text-primary/50" />
            </div>
            <h1 className="text-2xl font-royal font-bold uppercase tracking-wide">
              Visualization Not Found
            </h1>
            <p className="text-muted-foreground font-serif">
              This visualization may have been removed or the link is invalid.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const createdDate = new Date(visualization.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-serif">Back to En Pensent</span>
            </Link>
          </motion.div>

          {/* Title and metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide mb-2">
                  {visualization.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {createdDate}
                  </span>
                  <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-display uppercase tracking-wider flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Visionary Collection
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Unified Vision Experience */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 rounded-xl border border-border/50 p-4 md:p-6"
          >
            <UnifiedVisionExperience
              board={board}
              gameData={gameData}
              totalMoves={totalMoves}
              pgn={visualization.pgn || ''}
              context="shared"
              defaultTab="experience"
              visualizationId={visualization.id}
              paletteId={paletteId}
              createdAt={visualization.created_at}
              title={visualization.title}
              shareId={visualization.public_share_id}
              onShare={handleShare}
              onExport={handleExport}
              isPremium={isPremium}
              onUpgradePrompt={() => setShowVisionaryModal(true)}
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
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-6 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-4"
          >
            <p className="text-muted-foreground font-serif">
              Create your own chess game visualizations and turn your memorable games into art.
            </p>
            <Link to="/">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <ExternalLink className="h-4 w-4" />
                Create Your Own
              </Button>
            </Link>
            
            {/* Branding */}
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground font-serif">
                Powered by
              </p>
              <p className="font-royal text-lg text-gold-gradient">En Pensent</p>
              <p className="text-xs text-muted-foreground font-serif italic">
                "In Thought" — Where Chess Becomes Art
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
      />
    </div>
  );
};

export default VisualizationView;