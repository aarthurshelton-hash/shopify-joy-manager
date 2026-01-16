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
import { useActiveVisionStore } from '@/stores/activeVisionStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import AuthModal from '@/components/auth/AuthModal';
import { PremiumUpgradeModal } from '@/components/premium';
import { setActivePalette, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import { generateGameHash, extractMovesFromPgn, buildCanonicalShareUrl } from '@/lib/visualizations/gameCanonical';
import { detectGameCard } from '@/lib/chess/gameCardDetection';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';

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
  const { user, isPremium, isCheckingSubscription } = useAuth();
  const {
    setCurrentSimulation,
    setSavedShareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    returningFromOrder,
    capturedTimelineState,
    currentSimulation: sessionSimulation,
    currentPgn: sessionPgn,
    currentGameTitle: sessionTitle,
    clearSimulation,
  } = useSessionStore();
  const { setOrderData } = usePrintOrderStore();
  const { saveActiveVision, clearActiveVision } = useActiveVisionStore();
  const visualizationState = useVisualizationStateStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryVision, setPrimaryVision] = useState<GameVision | null>(null);
  const [paletteVariations, setPaletteVariations] = useState<PaletteVariation[]>([]);
  const [activePaletteId, setActivePaletteId] = useState<string>('modern');
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  
  // State for handling freshly generated (unsaved) games from session
  const [isFromSession, setIsFromSession] = useState(false);
  const [sessionBoard, setSessionBoard] = useState<SquareData[][] | null>(null);
  const [sessionGameData, setSessionGameData] = useState<GameData | null>(null);
  const [sessionTotalMoves, setSessionTotalMoves] = useState<number>(0);
  
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

  // Fetch game data by hash - checks session first, then database
  // Uses retry mechanism to handle race condition with session store persistence
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 8; // Increased from 3 to handle slower persistence
    const retryDelay = 100; // ms - increased from 50ms
    
    const fetchGameByHash = async () => {
      if (!gameHash) {
        setError('Invalid game link');
        setLoading(false);
        return;
      }

      // Check if this is from the generator - if so, we expect session data
      const isFromGenerator = searchParams.get('src') === 'generator';
      
      // First check if we have a freshly generated game in session storage
      if (sessionSimulation && sessionPgn) {
        const sessionGameHash = generateGameHash(sessionPgn);
        
        if (sessionGameHash === gameHash) {
          // This is a freshly generated game - use session data
          setIsFromSession(true);
          setSessionBoard(sessionSimulation.board);
          setSessionGameData(sessionSimulation.gameData);
          setSessionTotalMoves(sessionSimulation.totalMoves);
          
          // Set palette from URL or default
          const urlPalette = initialState.paletteId || 'modern';
          setActivePaletteId(urlPalette);
          if (urlPalette !== 'custom') {
            setActivePalette(urlPalette as PaletteId);
          }
          
          // Show success toast for new generation
          if (isFromGenerator) {
            toast.success('Visualization generated!', {
              description: `${sessionSimulation.totalMoves} moves processed.`,
            });
          }
          
          setLoading(false);
          return;
        }
      } else if (isFromGenerator && retryCount < maxRetries) {
        // Session data not ready yet - retry after a short delay
        // This handles the race condition where navigation happens before persist completes
        retryCount++;
        setTimeout(() => {
          // Re-read from store directly to get latest persisted state
          const store = useSessionStore.getState();
          if (store.currentSimulation && store.currentPgn) {
            const storeGameHash = generateGameHash(store.currentPgn);
            if (storeGameHash === gameHash) {
              setIsFromSession(true);
              setSessionBoard(store.currentSimulation.board);
              setSessionGameData(store.currentSimulation.gameData);
              setSessionTotalMoves(store.currentSimulation.totalMoves);
              
              const urlPalette = initialState.paletteId || 'modern';
              setActivePaletteId(urlPalette);
              if (urlPalette !== 'custom') {
                setActivePalette(urlPalette as PaletteId);
              }
              
              toast.success('Visualization generated!', {
                description: `${store.currentSimulation.totalMoves} moves processed.`,
              });
              
              setLoading(false);
              return;
            }
          }
          // If still no match after retries, continue to database fetch
          if (retryCount >= maxRetries) {
            continueWithDatabaseFetch();
          } else {
            fetchGameByHash();
          }
        }, retryDelay);
        return;
      }

      continueWithDatabaseFetch();
    };
    
    const continueWithDatabaseFetch = async () => {
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
          const vizHash = generateGameHash(vizPgn);
          
          if (vizHash === gameHash || (gameHash === 'empty' && !vizPgn)) {
            // Parse game_data to extract details
            const parsedGameData = viz.game_data as {
              board?: SquareData[][];
              gameData?: GameData;
              totalMoves?: number;
              paletteId?: string;
              whitePalette?: Record<string, string>;
              blackPalette?: Record<string, string>;
              pgn?: string;
              white?: string;
              black?: string;
              event?: string;
              date?: string;
              result?: string;
              moves?: string[];
              visualizationState?: {
                paletteId?: string;
                darkMode?: boolean;
              };
            };
            
            matchingVisions.push({
              id: viz.id,
              title: viz.title,
              pgn: viz.pgn || parsedGameData?.pgn || null,
              image_path: viz.image_path,
              public_share_id: viz.public_share_id,
              user_id: viz.user_id,
              created_at: viz.created_at,
              game_data: {
                white: parsedGameData?.white || parsedGameData?.gameData?.white,
                black: parsedGameData?.black || parsedGameData?.gameData?.black,
                event: parsedGameData?.event || parsedGameData?.gameData?.event,
                date: parsedGameData?.date || parsedGameData?.gameData?.date,
                result: parsedGameData?.result || parsedGameData?.gameData?.result,
                moves: parsedGameData?.moves || parsedGameData?.gameData?.moves,
                totalMoves: parsedGameData?.totalMoves,
                board: parsedGameData?.board,
                pgn: parsedGameData?.pgn,
                visualizationState: parsedGameData?.visualizationState || {
                  paletteId: parsedGameData?.paletteId,
                },
              },
            });
          }
        }

        if (matchingVisions.length === 0) {
          // No saved vision found - this might be a fresh game that needs to be simulated
          // For now, show error since we don't have the PGN to regenerate
          setError('Game not found');
          setLoading(false);
          return;
        }

        // Use the first (oldest) vision as the primary one
        const primary = matchingVisions[0];
        setPrimaryVision(primary);

        // Build palette variations from all matching visions
        const variations: PaletteVariation[] = matchingVisions.map(v => ({
          id: v.id,
          paletteId: v.game_data?.visualizationState?.paletteId || 'modern',
          ownerId: v.user_id || null,
          ownerName: null,
          isListed: false,
        }));
        setPaletteVariations(variations);

        // Determine which palette to activate
        const urlPalette = initialState.paletteId;
        const primaryPaletteId = primary.game_data?.visualizationState?.paletteId || 'modern';
        
        if (urlPalette) {
          // URL specified a palette - check if we have it
          const hasVariation = variations.some(v => v.paletteId === urlPalette);
          if (hasVariation) {
            setActivePaletteId(urlPalette);
            if (urlPalette !== 'custom') {
              setActivePalette(urlPalette as PaletteId);
            }
          } else {
            // Fall back to primary vision's palette
            setActivePaletteId(primaryPaletteId);
            if (primaryPaletteId !== 'custom') {
              setActivePalette(primaryPaletteId as PaletteId);
            }
          }
        } else {
          // No URL palette - use primary's palette
          setActivePaletteId(primaryPaletteId);
          if (primaryPaletteId !== 'custom') {
            setActivePalette(primaryPaletteId as PaletteId);
          }
        }

        // Record view interaction and get score
        if (primary.id) {
          recordVisionInteraction(primary.id, 'view').catch(console.error);
          getVisionScore(primary.id).then(score => {
            if (score) setVisionScore(score);
          }).catch(console.error);
          
          // Track in recently viewed
          useRecentlyViewedStore.getState().addRecentlyViewed({
            id: primary.id,
            gameHash: gameHash,
            imagePath: primary.image_path,
            title: primary.title,
          });
        }
        
        // Check if current user owns this variation
        if (user && activePaletteId) {
          const ownerVariation = variations.find(v => 
            v.paletteId === activePaletteId && v.ownerId === user.id
          );
          if (ownerVariation) {
            setOrderData({
              visualizationId: ownerVariation.id,
              title: primary.title,
              gameHash: gameHash,
              gameData: {
                white: primary.game_data?.white || 'Unknown',
                black: primary.game_data?.black || 'Unknown',
                event: primary.game_data?.event,
                date: primary.game_data?.date,
                result: primary.game_data?.result,
              },
            });
          }
        }
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGameByHash();
  }, [gameHash, initialState.paletteId, sessionSimulation, sessionPgn, searchParams]);

  // Reconstruct board and game data - supports both saved and session-based games
  const { board, gameData, totalMoves, effectivePgn } = useMemo(() => {
    // If from session (freshly generated), use session data
    if (isFromSession && sessionBoard && sessionGameData) {
      return {
        board: sessionBoard,
        gameData: sessionGameData,
        totalMoves: sessionTotalMoves,
        effectivePgn: sessionPgn || sessionGameData.pgn || '',
      };
    }
    
    // Otherwise use saved visualization data
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
      try {
        const simulation = simulateGame(pgn);
        reconstructedBoard = simulation.board;
      } catch (e) {
        console.error('Failed to simulate game:', e);
      }
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
  }, [primaryVision, isFromSession, sessionBoard, sessionGameData, sessionTotalMoves, sessionPgn]);

  // Save active vision state for refresh persistence
  useEffect(() => {
    if (!gameHash || loading || !primaryVision) return;
    
    // Build the full route with current palette
    const currentRoute = `/g/${gameHash}${activePaletteId ? `?p=${activePaletteId}` : ''}`;
    
    // Save state
    saveActiveVision({
      route: currentRoute,
      gameHash,
      paletteId: activePaletteId,
      pgn: effectivePgn,
      gameTitle: primaryVision?.title || '',
      currentMove: visualizationState.currentMove,
      selectedPhase: visualizationState.selectedPhase,
      lockedPieces: visualizationState.lockedPieces,
      compareMode: visualizationState.compareMode,
      darkMode: visualizationState.darkMode,
      showPieces: visualizationState.showPieces,
      pieceOpacity: visualizationState.pieceOpacity,
    });
  }, [
    gameHash, 
    activePaletteId, 
    loading,
    primaryVision,
    effectivePgn,
    visualizationState.currentMove,
    visualizationState.selectedPhase,
    visualizationState.lockedPieces,
    visualizationState.compareMode,
    visualizationState.darkMode,
    visualizationState.showPieces,
    visualizationState.pieceOpacity,
    saveActiveVision,
  ]);

  // Clear active vision when intentionally navigating away
  const handleBackClick = useCallback(() => {
    clearActiveVision();
    navigate(backLink.href);
  }, [clearActiveVision, navigate, backLink.href]);

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
        
        // Always apply watermark if not premium or still checking subscription status
        const shouldWatermark = !isPremium || isCheckingSubscription;
        
        const base64Image = await generateCleanPrintImage(
          { board: filteredBoard, gameData, totalMoves },
          { 
            darkMode: exportState?.darkMode || false, 
            withWatermark: shouldWatermark, 
            highlightState,
            capturedState,
            pgn: effectivePgn,
          }
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
        piecesState: exportState ? {
          showPieces: exportState.showPieces,
          pieceOpacity: exportState.pieceOpacity,
        } : undefined,
        pgn: effectivePgn,
        currentMoveNumber: exportState?.currentMove,
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

  // Check if we have valid data (either from DB or session)
  const hasValidData = primaryVision || (isFromSession && sessionBoard);

  if (error || !hasValidData) {
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
              {error || 'This game may not have been saved yet.'}
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

  // Determine display title
  const displayTitle = isFromSession 
    ? (sessionTitle || `${sessionGameData?.white || 'White'} vs ${sessionGameData?.black || 'Black'}`)
    : primaryVision?.title || 'Visualization';
  
  // Determine context for UnifiedVisionExperience
  const displayContext = isFromSession 
    ? 'generator' as const
    : (sourceContext.source || 'shared') as 'marketplace' | 'gallery' | 'shared' | 'postgame' | 'scanner' | 'generator';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Back link - clears active vision to prevent restore loop */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-serif">{backLink.label}</span>
            </button>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide mb-2">
              {displayTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {isFromSession ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Freshly generated
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {paletteVariations.length} palette{paletteVariations.length !== 1 ? 's' : ''} available
                </span>
              )}
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
              context={displayContext}
              paletteId={activePaletteId}
              visualizationId={primaryVision?.id}
              isPremium={isPremium}
              onUpgradePrompt={() => setShowVisionaryModal(true)}
              onBack={handleBackClick}
              isOwner={isFromSession || primaryVision?.user_id === user?.id}
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
