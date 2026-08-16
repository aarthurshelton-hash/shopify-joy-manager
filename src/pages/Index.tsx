import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExportState } from '@/components/chess/UnifiedVisionExperience';
import LiveProofRibbon from '@/components/homepage/LiveProofRibbon';
import OnboardingNudge from '@/components/chess/OnboardingNudge';
import { VisionaryMembershipCard } from '@/components/premium';
import type { SimulationResult } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PaletteId, getActivePalette, setActivePalette, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import {
  classifyGameArchetype,
  generateArchetypePoetry,
  getManualPaletteChoice,
  markManualPaletteChoice,
  logArchetypeColorWheelEvent,
} from '@/lib/chess/archetypeTemplates';
import { useScrollAnimation, scrollAnimationClasses } from '@/hooks/useScrollAnimation';
import { useSessionStore } from '@/stores/sessionStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { useActiveVisionStore } from '@/stores/activeVisionStore';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { useAuth } from '@/hooks/useAuth';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';
import { buildCanonicalShareUrl, generateGameHash } from '@/lib/visualizations/gameCanonical';

// Import AI-generated art
import heroChessArt from '@/assets/ai-art/upload-section-hero.jpg';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

// Lazy-load heavy chess components — only needed after user uploads a PGN
const PgnUploader = lazy(() => import('@/components/chess/PgnUploader'));
const UnifiedVisionExperience = lazy(() => import('@/components/chess/UnifiedVisionExperience'));
const GameInsightsPanel = lazy(() => import('@/components/chess/GameInsightsPanel'));
const ChessLoadingAnimation = lazy(() => import('@/components/chess/ChessLoadingAnimation'));
const HeroVisionDemo = lazy(() => import('@/components/homepage/HeroVisionDemo'));
const PaletteSelector = lazy(() => import('@/components/chess/PaletteSelector'));
const AuthModal = lazy(() => import('@/components/auth/AuthModal'));
const PrintGallery = lazy(() => import('@/components/homepage/PrintGallery'));
const ChessParticles = lazy(() => import('@/components/chess/ChessParticles'));

const Index = () => {
  const navigate = useNavigate();
  const { user, isPremium, isCheckingSubscription } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const visionBoardRef = useRef<HTMLDivElement>(null);
  
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    result: SimulationResult;
    pgn: string;
    title: string;
  } | null>(null);
  const [currentPgn, setCurrentPgn] = useState<string>('');
  const [gameTitle, setGameTitle] = useState<string>('');
  const [paletteKey, setPaletteKey] = useState(0);
  const [savedShareId, setSavedShareId] = useState<string | null>(null);
  const [savedVisualizationId, setSavedVisualizationId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Export hook for HD/GIF downloads
  const { 
    isExportingHD, 
    isExportingGIF, 
    gifProgress,
    downloadHD, 
    downloadTrademarkHD,
    downloadGIF 
  } = useVisualizationExport({
    isPremium,
    visualizationId: savedVisualizationId,
    userId: user?.id,
    onUnauthorized: () => setShowAuthModal(true),
    onUpgradeRequired: () => setShowVisionaryModal(true),
  });
  
  // Session store for persisting visualization state across navigation
  const { 
    currentSimulation: storedSimulation, 
    currentPgn: storedPgn, 
    currentGameTitle: storedTitle,
    savedShareId: storedShareId,
    capturedTimelineState: storedTimelineState,
    returningFromOrder,
    setCurrentSimulation,
    setSavedShareId: setSessionShareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    clearSimulation,
    setCreativeModeTransfer
  } = useSessionStore();
  
  // Visualization state store for timeline restoration
  const { 
    setCurrentMove, 
    setLockedPieces, 
    setCompareMode, 
    setDarkMode 
  } = useVisualizationStateStore();

  // Clear active vision when viewing Index (user is on homepage, not in a vision)
  const { clearActiveVision } = useActiveVisionStore();
  
  // Reset all visualization state when arriving at homepage fresh
  // This ensures clean state when navigating back to / from another page
  useEffect(() => {
    // Clear any stale active vision
    clearActiveVision();
    
    // If there's no stored simulation to restore, or it's not from an order return,
    // ensure local state is clean so the homepage renders fresh
    if (!storedSimulation || !returningFromOrder) {
      setSimulation(null);
      setCurrentPgn('');
      setGameTitle('');
      setIsLoading(false);
      setPendingResult(null);
      setSavedShareId(null);
      setSavedVisualizationId(null);
      setHasUnsavedChanges(false);
    }
  }, []); // Run once on mount — component remounts when navigating to / from another page
  
  // Restore visualization from session storage on mount (for returning from order page ONLY)
  useEffect(() => {
    if (!simulation && storedSimulation && storedPgn && returningFromOrder) {
      setSimulation(storedSimulation);
      setCurrentPgn(storedPgn);
      setGameTitle(storedTitle);
      setSavedShareId(storedShareId);
      
      // Restore timeline state if available
      if (storedTimelineState) {
        setCurrentMove(storedTimelineState.currentMove);
        setLockedPieces(storedTimelineState.lockedPieces);
        setCompareMode(storedTimelineState.compareMode);
        setDarkMode(storedTimelineState.darkMode);
      }
      
      // Show toast for returning from order page
      const titleText = storedTimelineState?.title || storedTitle || 'Visualization';
      const moveInfo = storedTimelineState 
        ? `Move ${storedTimelineState.currentMove} of ${storedTimelineState.totalMoves || storedSimulation.totalMoves || 0}`
        : 'Your exact board state has been preserved';
      toast.success(`${titleText} restored!`, {
        description: moveInfo,
        icon: <Sparkles className="w-4 h-4" />,
      });
      setReturningFromOrder(false);
      
      // Clear the stored simulation after restoring to prevent stale data
      clearSimulation();
    } else if (storedSimulation && !returningFromOrder) {
      // Stale simulation from navigating to /g/{hash} — clear it so homepage renders fresh
      clearSimulation();
    }
  }, []);
  
  // Refs for parallax sections (kept for compatibility)
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  
  // Scroll animations
  const [heroContentRef, heroContentVisible] = useScrollAnimation<HTMLDivElement>();
  const [uploadRef, uploadVisible] = useScrollAnimation<HTMLDivElement>();
  
  const handlePaletteChange = useCallback((paletteId: PaletteId) => {
    // Force re-render of components that use the palette
    setPaletteKey(prev => prev + 1);
    setHasUnsavedChanges(true);
    // Remember the manual choice — auto template never overrides it
    markManualPaletteChoice(paletteId);
    toast.success(`Palette changed to ${paletteId.charAt(0).toUpperCase() + paletteId.slice(1)}`);
  }, []);
  
  const handlePgnSubmit = async (pgn: string, famousGameTitle?: string) => {
    // Clean the PGN but don't validate - just process what we can
    const { cleanPgn } = await import('@/lib/chess/pgnValidator');
    const cleanedPgn = cleanPgn(pgn);

    // Simulate the game - dynamically import to avoid loading chess.js eagerly
    const { simulateGame } = await import('@/lib/chess/gameSimulator');
    const result = simulateGame(cleanedPgn);
    
    // Use famous game title if provided, otherwise leave empty (just show date)
    const title = famousGameTitle || '';

    // Archetype auto-template: classify the game's strategic feel
    const classification = classifyGameArchetype(result);
    if (classification) {
      const manualPalette = getManualPaletteChoice();
      let autoApplied = false;

      // Subtle auto template — only applies when the user hasn't chosen a palette
      if (!manualPalette && classification.template.paletteId !== getActivePalette().id) {
        setActivePalette(classification.template.paletteId);
        setPaletteKey(prev => prev + 1);
        autoApplied = true;
      }

      const poetry = generateArchetypePoetry(classification, cleanedPgn);
      toast.info(`${classification.archetypeName} · ${poetry.mood}`, {
        description: autoApplied
          ? `Template palette applied to match this game's feel. "${poetry.poem.split('\n')[0]}"`
          : `"${poetry.poem.split('\n')[0]}"`,
        duration: 5000,
      });

      // Persist archetype ↔ colour-wheel pairing — this data is never lost
      logArchetypeColorWheelEvent({
        classification,
        gameHash: generateGameHash(cleanedPgn),
        autoApplied,
        manualPaletteId: manualPalette,
        gameTitle: title || undefined,
      });
    }
    
    // Store the result and show loading animation
    setPendingResult({ result, pgn: cleanedPgn, title });
    setIsLoading(true);
  };

  // Handle FEN position submission - converts FEN to a visualization
  const handleFenSubmit = useCallback((fen: string, title?: string) => {
    const positionTitle = title || 'Position';
    
    import('@/lib/chess/fenUtils').then(({ fenToVisualizationBoard }) => {
      const board = fenToVisualizationBoard(fen);
      
      const result: SimulationResult = {
        board,
        gameData: {
          white: 'Position',
          black: 'Setup',
          event: positionTitle,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
          result: '*',
          pgn: fen,
          moves: [],
        },
        totalMoves: 0,
      };
      
      setPendingResult({ result, pgn: fen, title: positionTitle });
      setIsLoading(true);
    });
  }, []);
  
  const handleLoadingComplete = useCallback(() => {
    if (pendingResult) {
      // Store simulation in session for GameView to pick up
      // setCurrentSimulation now synchronously writes to sessionStorage
      setCurrentSimulation(pendingResult.result, pendingResult.pgn, pendingResult.title);
      
      // Generate the canonical URL and redirect to unified GameView
      const gameHash = generateGameHash(pendingResult.pgn);
      const paletteId = getActivePalette().id;
      
      // Build URL with palette param if not default
      const urlParams = new URLSearchParams();
      if (paletteId && paletteId !== 'modern') {
        urlParams.set('p', paletteId);
      }
      urlParams.set('src', 'generator'); // Track that this came from generation
      
      const targetUrl = `/g/${gameHash}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      
      setIsLoading(false);
      setPendingResult(null);
      
      // Navigate immediately - sessionStorage is now synchronously written
      navigate(targetUrl);
    }
  }, [pendingResult, navigate, setCurrentSimulation]);
  
  const handleReturnClick = () => {
    if (hasUnsavedChanges && !savedShareId) {
      setShowReturnDialog(true);
    } else {
      handleBack();
    }
  };
  
  const handleBack = () => {
    setSimulation(null);
    setCurrentPgn('');
    setGameTitle('');
    setIsLoading(false);
    setPendingResult(null);
    setSavedShareId(null);
    setHasUnsavedChanges(false);
    setShowReturnDialog(false);
    clearSimulation();
  };
  
  const handleShareIdCreated = (shareId: string) => {
    setSavedShareId(shareId);
    toast.success('QR code will now appear on your prints!', {
      description: 'Add to cart to get a print with your unique share link.',
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Confirmation dialog for unsaved changes */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your visualization. If you leave now, your palette and display settings will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Here</AlertDialogCancel>
            <AlertDialogAction onClick={handleBack}>
              Leave Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* No secondary navigation needed - UnifiedVisionExperience has its own back button */}
      
      {/* Main content */}
      <main>
        {isLoading ? (
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Suspense fallback={<div className="h-96 animate-pulse bg-muted/30 rounded-lg" />}>
            <ChessLoadingAnimation 
              onComplete={handleLoadingComplete} 
              totalMoves={pendingResult?.result.totalMoves}
            />
            </Suspense>
          </div>
        ) : !simulation ? (
          <>
            {/* Hero Section with Background Art */}
            <section ref={heroRef} className="relative overflow-hidden">
              {/* Background Image */}
              <div 
                ref={heroImageRef}
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${heroChessArt})`,
                  imageRendering: 'auto',
                  filter: 'blur(0.5px) saturate(1.1) contrast(1.05)',
                  opacity: 0.3,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background pointer-events-none" />
              
              {/* Floating Chess Particles */}
              <Suspense fallback={null}>
                <ChessParticles />
              </Suspense>
              
              <div 
                ref={heroContentRef}
                className={`relative container mx-auto px-4 py-14 md:py-28 transition-all duration-700 ease-out ${
                  heroContentVisible 
                    ? scrollAnimationClasses.fadeUp.visible 
                    : scrollAnimationClasses.fadeUp.hidden
                }`}
              >
                <div className="max-w-4xl mx-auto text-center space-y-5 md:space-y-8">
                  {/* Premium badge */}
                  <div className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-display uppercase tracking-widest backdrop-blur-sm">
                    <Crown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    The Future of Chess Intelligence
                  </div>
                  
                  {/* Main headline - Intelligence framing */}
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-royal font-bold leading-tight tracking-wide uppercase">
                    Every Game Tells<br />
                    <span className="text-gold-gradient">
                      A Story
                    </span>
                  </h2>
                  
                  {/* Subheadline */}
                  <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-serif px-2">
                    Watch any chess game paint itself into a living fingerprint.
                  </p>
                </div>

                {/* Self-playing hero demo — the wow before any action */}
                <div className="mt-10 md:mt-14">
                  <Suspense fallback={<div className="h-64 md:h-80 animate-pulse bg-muted/20 rounded-lg" />}>
                    <HeroVisionDemo />
                  </Suspense>
                </div>

                {/* Live, data-safe proof ribbon */}
                <div className="mt-8 md:mt-10">
                  <LiveProofRibbon />
                </div>
              </div>
            </section>

            {/* Palette & Upload Section */}
            <section id="make-your-own" className="container mx-auto px-4 py-12 space-y-8 scroll-mt-24">
              <div 
                ref={uploadRef}
                className={`max-w-4xl mx-auto space-y-8 transition-all duration-700 delay-100 ease-out ${
                  uploadVisible 
                    ? scrollAnimationClasses.fadeUp.visible 
                    : scrollAnimationClasses.fadeUp.hidden
                }`}
              >
                {/* Section heading */}
                <div className="text-center space-y-2">
                  <h3 className="font-royal text-2xl md:text-3xl font-bold uppercase tracking-wide">
                    Reveal Your <span className="text-gold-gradient">Game</span>
                  </h3>
                  <p className="text-muted-foreground font-serif max-w-xl mx-auto">
                    Any chess game — yours, a friend's, or a legend's — reveals its strategic fingerprint in seconds.
                  </p>
                </div>

                {/* Upload form (contains Vision Scanner + Legendary Games) */}
                <Suspense fallback={<div className="h-64 animate-pulse bg-muted/30 rounded-lg" />}>
                  <PgnUploader onPgnSubmit={handlePgnSubmit} onFenSubmit={handleFenSubmit} />
                </Suspense>

                {/* Palette selector */}
                <Suspense fallback={<div className="h-48 animate-pulse bg-muted/20 rounded-lg" />}>
                  <PaletteSelector onPaletteChange={handlePaletteChange} />
                </Suspense>
              </div>
            </section>
          </>
        ) : (
          <div className="w-full px-4 py-8" ref={visionBoardRef}>
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted/30 rounded-lg" />}>
            <UnifiedVisionExperience
              board={simulation.board}
              gameData={simulation.gameData}
              totalMoves={simulation.totalMoves}
              pgn={currentPgn || simulation.gameData.pgn}
              context="generator"
              title={gameTitle}
              shareId={savedShareId}
              visualizationId={savedVisualizationId || undefined}
              isPremium={isPremium}
              onBack={handleReturnClick}
              onUpgradePrompt={() => setShowVisionaryModal(true)}
              onExport={async (type, exportState) => {
                // Preview download is available for everyone
                // HD, GIF, and Gamecard require premium
                if (type !== 'print' && type !== 'preview') {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  if (!isPremium) {
                    setShowVisionaryModal(true);
                    return;
                  }
                }
                
                const visualTitle = gameTitle || `${simulation.gameData.white} vs ${simulation.gameData.black}`;
                
                // Filter board to current timeline position if provided
                const filteredBoard = exportState && exportState.currentMove < simulation.totalMoves
                  ? simulation.board.map(rank =>
                      rank.map(square => ({
                        ...square,
                        visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove)
                      }))
                    )
                  : simulation.board;
                
                // Prepare highlight state from export state
                const highlightState = exportState && exportState.lockedPieces.length > 0
                  ? {
                      lockedPieces: exportState.lockedPieces.map(p => ({
                        pieceType: p.pieceType as PieceType,
                        pieceColor: p.pieceColor as PieceColor,
                      })),
                      compareMode: exportState.compareMode,
                    }
                  : undefined;
                
                if (type === 'gamecard') {
                  try {
                    const { generateGamecardPdf, downloadBlob, sanitizeFilename } = await import('@/lib/chess/gamecardGenerator');
                    const exportSimulation = {
                      ...simulation,
                      board: filteredBoard,
                    };
                    const blob = await generateGamecardPdf(exportSimulation, {
                      darkMode: exportState?.darkMode || false,
                      pgn: currentPgn || undefined,
                    });
                    downloadBlob(blob, `gamecard_${sanitizeFilename(visualTitle)}.pdf`);
                    toast.success('Game card downloaded!', { description: 'Check your downloads folder' });
                  } catch (err) {
                    console.error('Gamecard generation failed:', err);
                    toast.error('Game card generation failed', { description: 'Please try again.' });
                  }
                  return;
                }

                if (type === 'print') {
                  // Save simulation to session store so we can restore it when returning
                  setCurrentSimulation(simulation, currentPgn, visualTitle);
                  setSessionShareId(savedShareId);
                  
                  // Capture timeline state for exact visual restoration
                  if (exportState) {
                    setCapturedTimelineState({
                      currentMove: exportState.currentMove,
                      totalMoves: simulation.totalMoves,
                      title: visualTitle,
                      lockedPieces: exportState.lockedPieces.map(p => ({
                        pieceType: p.pieceType as PieceType,
                        pieceColor: p.pieceColor as PieceColor,
                      })),
                      compareMode: exportState.compareMode,
                      darkMode: exportState.darkMode,
                      showPieces: exportState.showPieces,
                      pieceOpacity: exportState.pieceOpacity,
                    });
                  }
                  
                  // Mark that we're navigating to order page for toast on return
                  setReturningFromOrder(true);
                  
                  // Navigate to order print page with full simulation data
                  const currentGameHash = currentPgn ? generateGameHash(currentPgn) : undefined;
                  const currentPaletteId = getActivePalette().id;
                  
                  setOrderData({
                    title: visualTitle,
                    pgn: currentPgn,
                    gameData: {
                      white: simulation.gameData.white,
                      black: simulation.gameData.black,
                      event: simulation.gameData.event,
                      date: simulation.gameData.date,
                      result: simulation.gameData.result,
                    },
                    simulation: simulation, // Include full simulation for visualization
                    shareId: savedShareId || undefined,
                    returnPath: '/',
                    // Game metadata for cart display and navigation
                    gameHash: currentGameHash,
                    paletteId: currentPaletteId,
                    // Include captured state so print matches exactly what user sees
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
                  });
                  navigate('/order-print');
                } else if (type === 'preview') {
                  // Preview download - uses SAME rendering as HD, but with watermark for free users
                  try {
                    const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
                    
                    // Create simulation with filtered board
                    const exportSimulation = {
                      ...simulation,
                      board: filteredBoard,
                    };
                    
                    // Always apply watermark if not premium or still checking subscription status
                    const shouldWatermark = !isPremium || isCheckingSubscription;
                    
                    const base64Image = await generateCleanPrintImage(exportSimulation, {
                      darkMode: exportState?.darkMode || false,
                      withWatermark: shouldWatermark,
                      highlightState,
                      pgn: currentPgn, // Pass explicit PGN for piece rendering
                      capturedState: exportState ? {
                        currentMove: exportState.currentMove,
                        selectedPhase: 'all',
                        lockedPieces: exportState.lockedPieces || [],
                        compareMode: exportState.compareMode,
                        displayMode: 'art',
                        darkMode: exportState.darkMode,
                        showTerritory: false,
                        showHeatmaps: false,
                        showPieces: exportState.showPieces,
                        pieceOpacity: exportState.pieceOpacity,
                        capturedAt: new Date(),
                      } : undefined,
                    });
                    
                    // Convert base64 to blob for download
                    const response = await fetch(base64Image);
                    const blob = await response.blob();
                    
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${visualTitle.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    toast.success('Preview downloaded!', {
                      description: shouldWatermark ? 'Includes En Pensent branding.' : 'Full resolution image saved.',
                    });
                  } catch (error) {
                    console.error('Preview download failed:', error);
                    toast.error('Download failed', { description: 'Please try again.' });
                  }
                } else if (type === 'hd') {
                  // Use trademark HD export for proper "print-ready" look
                  // Include highlight state and pieces state so HD matches exactly what user sees
                  await downloadTrademarkHD({
                    board: filteredBoard,
                    gameData: simulation.gameData,
                    title: visualTitle,
                    darkMode: exportState?.darkMode || false,
                    showQR: !!savedShareId,
                    shareId: savedShareId || undefined,
                    highlightState,
                    piecesState: exportState ? {
                      showPieces: exportState.showPieces,
                      pieceOpacity: exportState.pieceOpacity,
                    } : undefined,
                    currentMoveNumber: exportState?.currentMove,
                    pgn: currentPgn, // Pass explicit PGN for piece rendering
                  });
                } else if (type === 'gif') {
                  const boardElement = visionBoardRef.current?.querySelector('[data-vision-board]') as HTMLElement;
                  const piecesState = exportState ? {
                    showPieces: exportState.showPieces,
                    pieceOpacity: exportState.pieceOpacity,
                  } : undefined;
                  
                  if (boardElement) {
                    await downloadGIF(simulation, boardElement, visualTitle, undefined, piecesState);
                  } else if (visionBoardRef.current) {
                    await downloadGIF(simulation, visionBoardRef.current, visualTitle, undefined, piecesState);
                  }
                }
              }}
              onSaveToGallery={async () => {
                if (!user) {
                  setShowAuthModal(true);
                  return null;
                }
                if (!isPremium) {
                  setShowVisionaryModal(true);
                  return null;
                }
                
                // Check for similarity/ownership before saving
                setIsSaving(true);
                try {
                  const { checkDuplicateVisualization, saveVisualization } = await import('@/lib/visualizations/visualizationStorage');
                  const { getActivePalette } = await import('@/lib/chess/pieceColors');
                  
                  // Build visualization state for ownership check
                  const activePalette = getActivePalette();
                  const visualizationState = {
                    paletteId: activePalette.id,
                    darkMode: false,
                  };
                  
                  // Check if this visualization is already owned
                  const checkResult = await checkDuplicateVisualization(
                    user.id,
                    currentPgn,
                    simulation.gameData,
                    visualizationState
                  );
                  
                  if (checkResult.isDuplicate) {
                    if (checkResult.ownedByCurrentUser) {
                      toast.info('Already in your gallery', {
                        description: 'This visualization is already saved to your collection.',
                      });
                    } else {
                      toast.error('This vision is already owned', {
                        description: `Owned by ${checkResult.ownerDisplayName || 'another collector'}. Try a different palette!`,
                      });
                    }
                    return null;
                  }
                  
                  if (checkResult.isTooSimilar) {
                    toast.error('Too similar to an existing vision', {
                      description: `${Math.round(checkResult.colorSimilarity || 30)}% similar to a vision by ${checkResult.ownerDisplayName || 'another collector'}. Change at least 8 colors.`,
                    });
                    return null;
                  }
                  
                  // Generate image for storage
                  const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
                  const base64Image = await generateCleanPrintImage(simulation, {
                    darkMode: false,
                  });
                  
                  // Convert base64 to blob
                  const response = await fetch(base64Image);
                  const blob = await response.blob();
                  
                  // Save to database
                  const visualTitle = gameTitle || `${simulation.gameData.white} vs ${simulation.gameData.black}`;
                  const result = await saveVisualization(
                    user.id,
                    visualTitle,
                    simulation,
                    blob,
                    currentPgn,
                    visualizationState
                  );
                  
                  if (result.error) {
                    toast.error('Save failed', { description: result.error.message });
                    return null;
                  }
                  
                  if (result.data) {
                    setSavedVisualizationId(result.data.id);
                    setSavedShareId(result.data.public_share_id);
                    setHasUnsavedChanges(false);
                    toast.success('Saved to your gallery!', {
                      description: 'You now own this unique visualization.',
                    });
                    return result.data.id;
                  }
                  
                  return null;
                } catch (error) {
                  console.error('Save to gallery failed:', error);
                  toast.error('Save failed', { description: 'Please try again.' });
                  return null;
                } finally {
                  setIsSaving(false);
                }
              }}
              onShare={() => {
                if (currentPgn) {
                  // Always use canonical game link based on PGN moves
                  const url = buildCanonicalShareUrl(currentPgn, getActivePalette().id);
                  navigator.clipboard.writeText(url);
                  toast.success('Share link copied!', { 
                    description: 'Universal link to this game!',
                  });
                } else {
                  toast.info('Generate a visualization first to share');
                }
              }}
              onTransferToCreative={() => {
                // Premium gate for Creative Mode
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                if (!isPremium) {
                  setShowVisionaryModal(true);
                  return;
                }
                
                // Transfer to creative mode
                const activePalette = getActivePalette();
                setCreativeModeTransfer({
                  board: simulation.board.map((rank, r) => 
                    rank.map((sq, f) => {
                      const lastVisit = sq.visits[sq.visits.length - 1];
                      if (lastVisit) {
                        const isWhite = lastVisit.color === 'w';
                        return isWhite 
                          ? lastVisit.piece.toUpperCase() 
                          : lastVisit.piece.toLowerCase();
                      }
                      return null;
                    })
                  ),
                  whitePalette: activePalette.white as Record<string, string>,
                  blackPalette: activePalette.black as Record<string, string>,
                  title: gameTitle || `${simulation.gameData.white} vs ${simulation.gameData.black}`,
                  sourceVisualizationId: savedVisualizationId || undefined,
                });
                navigate('/creative-mode');
              }}
            />
          </Suspense>
          {simulation && currentPgn && (
            <div className="px-4 pb-8">
              <Suspense fallback={null}>
                <GameInsightsPanel
                  simulation={simulation}
                  pgn={currentPgn}
                />
              </Suspense>
            </div>
          )}
          </div>
        )}
      </main>

      {simulation && <OnboardingNudge active={!!simulation} />}

      {!simulation && !isLoading && (
        <Suspense fallback={null}>
          <PrintGallery />
        </Suspense>
      )}

      <Footer />
      
      {/* Visionary Membership Modal */}
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={() => {
          setShowVisionaryModal(false);
          setShowAuthModal(true);
        }}
        trigger="general"
      />
      
      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </Suspense>
    </div>
  );
};

export default Index;
