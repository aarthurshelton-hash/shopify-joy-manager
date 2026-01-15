/**
 * GameView - Universal Visualization Menu for a Game
 * 
 * This page shows ONE game with all its palette variations (visions).
 * Each game has a single canonical URL: /g/{gameHash}
 * Different palettes are selectable from within this unified experience.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { motion } from 'framer-motion';
import { Crown, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { SquareData, GameData, simulateGame } from '@/lib/chess/gameSimulator';
import UnifiedVisionExperience, { ExportState } from '@/components/chess/UnifiedVisionExperience';
import { useAuth } from '@/hooks/useAuth';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';
import { useSessionStore } from '@/stores/sessionStore';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import AuthModal from '@/components/auth/AuthModal';
import { PremiumUpgradeModal } from '@/components/premium';
import { setActivePalette, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import { extractMovesFromPgn, buildCanonicalShareUrl } from '@/lib/visualizations/gameCanonical';
import { detectGameCard } from '@/lib/chess/gameCardDetection';

interface GameVision {
  id: string;
  title: string;
  pgn: string | null;
  image_path: string;
  public_share_id: string | null;
  user_id: string | null;
  game_data: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    result?: string;
    moves?: string[];
    totalMoves?: number;
    board?: SquareData[][];
    pgn?: string;
    visualizationState?: {
      paletteId?: string;
      darkMode?: boolean;
    };
  };
  created_at: string;
}

interface PaletteVariation {
  id: string;
  paletteId: string;
  ownerId: string | null;
  ownerName: string | null;
  isListed: boolean;
  price?: number;
  visionScore?: number;
}

const GameView = () => {
  const { gameHash } = useParams<{ gameHash: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const {
    setCurrentSimulation,
    setSavedShareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    returningFromOrder,
    capturedTimelineState,
  } = useSessionStore();
  const { setOrderData } = usePrintOrderStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryVision, setPrimaryVision] = useState<GameVision | null>(null);
  const [paletteVariations, setPaletteVariations] = useState<PaletteVariation[]>([]);
  const [activePaletteId, setActivePaletteId] = useState<string>('modern');
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  
  const viewRecordedRef = useRef(false);

  // Get initial state from URL params
  const initialState = useMemo(() => ({
    paletteId: searchParams.get('p') || undefined,
    move: searchParams.has('m') ? parseInt(searchParams.get('m')!) : undefined,
    dark: searchParams.get('d') === '1',
    pieces: searchParams.get('sp') === '1',
    opacity: searchParams.has('o') ? parseFloat(searchParams.get('o')!) : undefined,
  }), [searchParams]);

  // Determine context from URL params (set by redirects)
  const sourceContext = useMemo(() => {
    const src = searchParams.get('src');
    const listingId = searchParams.get('listing');
    return {
      source: src as 'gallery' | 'marketplace' | 'shared' | null,
      listingId,
    };
  }, [searchParams]);

  // Get back link based on source context
  const backLink = useMemo(() => {
    switch (sourceContext.source) {
      case 'gallery':
        return { href: '/my-vision', label: 'Return to Gallery' };
      case 'marketplace':
        return { href: '/marketplace', label: 'Return to Marketplace' };
      default:
        return { href: '/', label: 'Back to En Pensent' };
    }
  }, [sourceContext.source]);

  // Export hook
  const {
    downloadTrademarkHD,
    downloadGIF,
  } = useVisualizationExport({
    isPremium,
    visualizationId: primaryVision?.id,
    onUnauthorized: () => setShowAuthModal(true),
    onUpgradeRequired: () => setShowVisionaryModal(true),
  });

  // Handle restoration toast when returning from order page
  useEffect(() => {
    if (returningFromOrder && capturedTimelineState) {
      toast.success(`${capturedTimelineState.title || 'Visualization'} restored!`, {
        description: capturedTimelineState.currentMove 
          ? `Move ${capturedTimelineState.currentMove} of ${capturedTimelineState.totalMoves}`
          : 'Your visualization is ready',
        icon: <Sparkles className="w-4 h-4" />,
      });
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

  // Fetch game data by hash
  useEffect(() => {
    const fetchGameByHash = async () => {
      if (!gameHash) {
        setError('Invalid game link');
        setLoading(false);
        return;
      }

      try {
        // Fetch all saved visualizations and find ones matching this game hash
        const { data: allVisions, error: fetchError } = await supabase
          .from('saved_visualizations')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        // Find visions that match this game hash
        const matchingVisions: GameVision[] = [];
        
        for (const viz of allVisions || []) {
          const vizPgn = viz.pgn || (viz.game_data as { pgn?: string })?.pgn || '';
          const moves = extractMovesFromPgn(vizPgn);
          
          // Generate hash for comparison
          let hash = 0;
          let hash2 = 0;
          for (let i = 0; i < moves.length; i++) {
            const char = moves.charCodeAt(i);
            hash = ((hash << 5) - hash + char) | 0;
            hash2 = ((hash2 << 7) + hash2 + char) | 0;
          }
          const combined = Math.abs(hash) ^ Math.abs(hash2);
          const vizHash = combined.toString(36);
          
          if (vizHash === gameHash || gameHash === 'empty' && !moves) {
            matchingVisions.push(viz as unknown as GameVision);
          }
        }

        if (matchingVisions.length === 0) {
          setError('Game not found');
          setLoading(false);
          return;
        }

        // Use the first (oldest/original) vision as primary
        const primary = matchingVisions[0];
        setPrimaryVision(primary);

        // Set active palette from URL or from primary vision
        const urlPalette = initialState.paletteId;
        const primaryPalette = primary.game_data?.visualizationState?.paletteId || 'modern';
        const palette = urlPalette || primaryPalette;
        setActivePaletteId(palette);
        if (palette !== 'custom') {
          setActivePalette(palette as PaletteId);
        }

        // Build palette variations from all matching visions
        const variations: PaletteVariation[] = [];
        const seenPalettes = new Set<string>();

        for (const viz of matchingVisions) {
          const paletteId = viz.game_data?.visualizationState?.paletteId || 'modern';
          if (!seenPalettes.has(paletteId)) {
            seenPalettes.add(paletteId);
            
            // Fetch owner profile
            let ownerName: string | null = null;
            if (viz.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', viz.user_id)
                .single();
              ownerName = profile?.display_name || null;
            }

            // Check if listed on marketplace
            const { data: listing } = await supabase
              .from('visualization_listings')
              .select('price_cents, status')
              .eq('visualization_id', viz.id)
              .eq('status', 'active')
              .single();

            variations.push({
              id: viz.id,
              paletteId,
              ownerId: viz.user_id,
              ownerName,
              isListed: !!listing,
              price: listing?.price_cents,
            });
          }
        }

        setPaletteVariations(variations);

        // Record view interaction
        if (!viewRecordedRef.current) {
          viewRecordedRef.current = true;
          recordVisionInteraction(primary.id, 'view');
          getVisionScore(primary.id).then(score => {
            if (score) setVisionScore(score);
          });
        }
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGameByHash();
  }, [gameHash, initialState.paletteId]);

  // Reconstruct board and game data
  const { board, gameData, totalMoves, effectivePgn } = useMemo(() => {
    if (!primaryVision) {
      return {
        board: [] as SquareData[][],
        gameData: {} as GameData,
        totalMoves: 0,
        effectivePgn: '',
      };
    }

    const data = primaryVision.game_data;
    const pgn = primaryVision.pgn || data.pgn || '';
    
    // Try to use stored board, or simulate from PGN
    let reconstructedBoard: SquareData[][] = data.board || [];
    
    if (reconstructedBoard.length === 0 && pgn) {
      // Simulate game to get board
      const simulation = simulateGame(pgn);
      reconstructedBoard = simulation.board;
    }

    if (reconstructedBoard.length === 0) {
      reconstructedBoard = Array(8).fill(null).map((_, rank) =>
        Array(8).fill(null).map((_, file) => ({
          file,
          rank,
          visits: [],
          isLight: (file + rank) % 2 === 1,
        }))
      );
    }

    const reconstructedGameData: GameData = {
      white: data.white || 'White',
      black: data.black || 'Black',
      event: data.event || '',
      date: data.date || '',
      result: data.result || '',
      pgn,
      moves: data.moves || [],
    };

    return {
      board: reconstructedBoard,
      gameData: reconstructedGameData,
      totalMoves: data.totalMoves || data.moves?.length || 0,
      effectivePgn: pgn,
    };
  }, [primaryVision]);

  // Handle share with stateful URL
  const handleShare = useCallback(async (exportState?: ExportState) => {
    const url = buildCanonicalShareUrl(effectivePgn, activePaletteId, exportState ? {
      move: exportState.currentMove,
      dark: exportState.darkMode,
      pieces: exportState.showPieces,
      opacity: exportState.pieceOpacity,
    } : undefined);

    if (navigator.share) {
      try {
        await navigator.share({
          title: primaryVision?.title || 'Chess Visualization',
          text: 'Check out this chess game visualization from En Pensent',
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  }, [effectivePgn, activePaletteId, primaryVision?.title]);

  // Handle exports
  const handleExport = useCallback(async (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => {
    if (!primaryVision) return;

    const filteredBoard = exportState && exportState.currentMove < totalMoves && exportState.currentMove > 0
      ? board.map(row =>
          row.map(square => ({
            ...square,
            visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove),
          }))
        )
      : board;

    const highlightState = exportState?.lockedPieces && exportState.lockedPieces.length > 0 ? {
      lockedPieces: exportState.lockedPieces.map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
      })),
      compareMode: exportState.compareMode,
    } : undefined;

    if (type === 'preview') {
      try {
        const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
        const base64Image = await generateCleanPrintImage(
          { board: filteredBoard, gameData, totalMoves },
          { darkMode: exportState?.darkMode || false, withWatermark: !isPremium, highlightState }
        );
        const response = await fetch(base64Image);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${primaryVision.title.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Preview downloaded!');
      } catch (err) {
        console.error('Preview download failed:', err);
        toast.error('Download failed');
      }
      return;
    }

    if (type === 'hd') {
      downloadTrademarkHD({
        board: filteredBoard,
        gameData,
        title: primaryVision.title,
        darkMode: exportState?.darkMode || false,
        highlightState,
      });
      return;
    }

    if (type === 'gif') {
      const captureElement = document.querySelector('[data-vision-board="true"]') as HTMLElement;
      if (captureElement) {
        downloadGIF(
          { board, gameData, totalMoves },
          captureElement,
          primaryVision.title,
          undefined,
          exportState ? { showPieces: exportState.showPieces, pieceOpacity: exportState.pieceOpacity } : undefined
        );
      } else {
        toast.error('Unable to capture visualization');
      }
      return;
    }

    if (type === 'print') {
      if (exportState) {
        setCapturedTimelineState({
          currentMove: exportState.currentMove,
          totalMoves,
          title: primaryVision.title,
          lockedPieces: exportState.lockedPieces.map(p => ({
            pieceType: p.pieceType as PieceType,
            pieceColor: p.pieceColor as 'w' | 'b',
          })),
          compareMode: exportState.compareMode,
          darkMode: exportState.darkMode,
        });
      }

      setCurrentSimulation({ board, gameData, totalMoves }, effectivePgn, primaryVision.title);
      setSavedShareId(primaryVision.public_share_id || '');
      setReturningFromOrder(true);

      // Detect famous game card for attribution
      const gameCardMatch = detectGameCard(effectivePgn);
      const detectedGameId = gameCardMatch.isMatch && gameCardMatch.matchedGame 
        ? gameCardMatch.matchedGame.id 
        : undefined;

      const orderData: PrintOrderData = {
        visualizationId: primaryVision.id,
        title: primaryVision.title,
        imagePath: primaryVision.image_path,
        gameData: {
          white: gameData.white,
          black: gameData.black,
          event: gameData.event,
          date: gameData.date,
          result: gameData.result,
        },
        simulation: { board, gameData, totalMoves },
        shareId: primaryVision.public_share_id || undefined,
        returnPath: `/g/${gameHash}`,
        // Game metadata for cart display and navigation
        gameHash,
        gameId: detectedGameId, // For game card art in cart
        paletteId: activePaletteId,
        pgn: effectivePgn,
        capturedState: exportState ? {
          currentMove: exportState.currentMove,
          selectedPhase: 'all',
          lockedPieces: exportState.lockedPieces,
          compareMode: exportState.compareMode,
          displayMode: 'standard',
          darkMode: exportState.darkMode,
          showTerritory: false,
          showHeatmaps: false,
          showPieces: exportState.showPieces,
          pieceOpacity: exportState.pieceOpacity,
          capturedAt: new Date(),
        } : undefined,
      };
      setOrderData(orderData);
      navigate('/order-print');
    }
  }, [primaryVision, board, gameData, totalMoves, effectivePgn, gameHash, isPremium, downloadTrademarkHD, downloadGIF, navigate, setOrderData, setCapturedTimelineState, setCurrentSimulation, setSavedShareId, setReturningFromOrder]);

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

  if (error || !primaryVision) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="h-10 w-10 text-primary/50" />
            </div>
            <h1 className="text-2xl font-royal font-bold uppercase tracking-wide">
              Game Not Found
            </h1>
            <p className="text-muted-foreground font-serif">
              This game may not have been saved yet.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Create a Visualization
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              to={backLink.href}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-serif">{backLink.label}</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide mb-2">
              {primaryVision.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                {paletteVariations.length} palette{paletteVariations.length !== 1 ? 's' : ''} available
              </span>
              {visionScore && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-display uppercase tracking-wider">
                  Score: {visionScore.totalScore.toLocaleString()}
                </span>
              )}
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
              pgn={effectivePgn}
              context={sourceContext.source || 'shared'}
              paletteId={activePaletteId}
              visualizationId={primaryVision?.id}
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
              onShare={handleShare}
              onExport={handleExport}
              initialState={{
                move: initialState.move,
                dark: initialState.dark,
                pieces: initialState.pieces,
                opacity: initialState.opacity,
              }}
            />
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="signin"
        />
      )}

      {showVisionaryModal && (
        <PremiumUpgradeModal
          isOpen={showVisionaryModal}
          onClose={() => setShowVisionaryModal(false)}
          trigger="download"
        />
      )}
    </div>
  );
};

export default GameView;
