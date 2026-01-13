import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PgnUploader from '@/components/chess/PgnUploader';
import UnifiedVisionExperience, { ExportState } from '@/components/chess/UnifiedVisionExperience';
import ChessLoadingAnimation from '@/components/chess/ChessLoadingAnimation';
import PaletteSelector from '@/components/chess/PaletteSelector';
import ChessParticles from '@/components/chess/ChessParticles';
import FloatingChessPieces from '@/components/chess/FloatingChessPieces';
import TrendingWidget from '@/components/homepage/TrendingWidget';
import LiveMarketWidget from '@/components/homepage/LiveMarketWidget';
import CreativeModeShowcase from '@/components/homepage/CreativeModeShowcase';
import { NaturalQRShowcase } from '@/components/homepage/NaturalQRShowcase';
import { BookShowcase } from '@/components/book/BookShowcase';
import { EducationFundShowcase } from '@/components/homepage/EducationFundShowcase';
import { VisionaryMembershipCard } from '@/components/premium';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
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
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Award, Palette, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cleanPgn } from '@/lib/chess/pgnValidator';
import { PaletteId, getActivePalette } from '@/lib/chess/pieceColors';
import { useScrollAnimation, scrollAnimationClasses } from '@/hooks/useScrollAnimation';
import { useSessionStore } from '@/stores/sessionStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { saveVisualization } from '@/lib/visualizations/visualizationStorage';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

// Import AI-generated art
import heroChessArt from '@/assets/ai-art/upload-section-hero.jpg';
import chessMovementArt from '@/assets/chess-movement-art.jpg';
import chessKingArt from '@/assets/chess-king-art.jpg';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

const Index = () => {
  // Random AI art for feature cards
  const randomArts = useRandomGameArt(4); // 3 for feature cards + 1 for premium banner
  
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
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
  
  // Restore visualization from session storage on mount (for returning from order page)
  useEffect(() => {
    if (!simulation && storedSimulation && storedPgn) {
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
      
      // Show toast if returning from order page with move info
      if (returningFromOrder) {
        const titleText = storedTimelineState?.title || storedTitle || 'Visualization';
        const moveInfo = storedTimelineState 
          ? `Move ${storedTimelineState.currentMove} of ${storedTimelineState.totalMoves || storedSimulation.totalMoves || 0}`
          : 'Your exact board state has been preserved';
        toast.success(`${titleText} restored!`, {
          description: moveInfo,
          icon: <Sparkles className="w-4 h-4" />,
        });
        setReturningFromOrder(false);
      }
      
      // Clear the stored simulation after restoring to prevent stale data
      clearSimulation();
    }
  }, []);
  
  // Refs for parallax sections (used for scroll-based CSS transforms)
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const kingRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const featureImageRef = useRef<HTMLDivElement>(null);
  const kingImageRef = useRef<HTMLDivElement>(null);
  
  // Use refs for parallax to avoid state updates (prevents jitter)
  // Disable parallax on mobile for better performance
  React.useEffect(() => {
    let rafId: number;
    let ticking = false;
    
    // Check if mobile (< 768px) - disable parallax for performance
    const isMobile = () => window.innerWidth < 768;
    
    const updateParallax = () => {
      const scrollY = window.scrollY;
      const mobile = isMobile();
      
      // Hero image parallax - reduced on mobile, off completely for very small screens
      if (heroImageRef.current) {
        if (mobile) {
          // Static position on mobile - no parallax
          heroImageRef.current.style.transform = 'translate3d(0, 0, 0) scale(1.05)';
        } else {
          const offset = scrollY * 0.12; // Slightly reduced from 0.15
          heroImageRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.1)`;
        }
      }
      
      // Feature image parallax - disabled on mobile
      if (featureImageRef.current && featureRef.current) {
        if (mobile) {
          featureImageRef.current.style.transform = 'translate3d(0, 0, 0) scale(1.08)';
        } else {
          const rect = featureRef.current.getBoundingClientRect();
          const elementTop = rect.top + scrollY;
          const relativeScroll = scrollY - elementTop + window.innerHeight;
          const offset = relativeScroll * 0.08; // Reduced from 0.1
          featureImageRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.15)`;
        }
      }
      
      // King image parallax - disabled on mobile
      if (kingImageRef.current && kingRef.current) {
        if (mobile) {
          kingImageRef.current.style.transform = 'translate3d(0, 0, 0)';
        } else {
          const rect = kingRef.current.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          const offset = (center - viewportCenter) * -0.06; // Reduced from 0.08
          kingImageRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      }
      
      ticking = false;
    };
    
    const onScroll = () => {
      // Skip scroll handler entirely on mobile for best performance
      if (isMobile()) {
        return;
      }
      if (!ticking) {
        rafId = requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };
    
    // Handle resize to update mobile state
    const onResize = () => {
      updateParallax();
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    updateParallax(); // Initial position
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);
  
  // Scroll animations
  const [heroContentRef, heroContentVisible] = useScrollAnimation<HTMLDivElement>();
  const [uploadRef, uploadVisible] = useScrollAnimation<HTMLDivElement>();
  const [featureTitleRef, featureTitleVisible] = useScrollAnimation<HTMLHeadingElement>();
  const [featureCard1Ref, featureCard1Visible] = useScrollAnimation<HTMLDivElement>();
  const [featureCard2Ref, featureCard2Visible] = useScrollAnimation<HTMLDivElement>();
  const [featureCard3Ref, featureCard3Visible] = useScrollAnimation<HTMLDivElement>();
  const [kingContentRef, kingContentVisible] = useScrollAnimation<HTMLDivElement>();
  
  const handlePaletteChange = useCallback((paletteId: PaletteId) => {
    // Force re-render of components that use the palette
    setPaletteKey(prev => prev + 1);
    setHasUnsavedChanges(true);
    toast.success(`Palette changed to ${paletteId.charAt(0).toUpperCase() + paletteId.slice(1)}`);
  }, []);
  
  const handlePgnSubmit = (pgn: string, famousGameTitle?: string) => {
    // Clean the PGN but don't validate - just process what we can
    const cleanedPgn = cleanPgn(pgn);

    // Simulate the game - the simulator will process whatever it can
    const result = simulateGame(cleanedPgn);
    
    // Use famous game title if provided, otherwise leave empty (just show date)
    const title = famousGameTitle || '';
    
    // Store the result and show loading animation
    setPendingResult({ result, pgn: cleanedPgn, title });
    setIsLoading(true);
  };
  
  const handleLoadingComplete = useCallback(() => {
    if (pendingResult) {
      setSimulation(pendingResult.result);
      setCurrentPgn(pendingResult.pgn);
      setGameTitle(pendingResult.title);
      setIsLoading(false);
      setPendingResult(null);
      setHasUnsavedChanges(false); // Reset unsaved changes on new visualization
      
      if (pendingResult.result.totalMoves > 0) {
        toast.success('Visualization generated!', {
          description: `${pendingResult.result.totalMoves} moves processed.`,
        });
      } else {
        toast.info('Visualization created', {
          description: 'No moves could be parsed, but showing the board layout.',
        });
      }
    }
  }, [pendingResult]);
  
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
            <ChessLoadingAnimation 
              onComplete={handleLoadingComplete} 
              totalMoves={pendingResult?.result.totalMoves}
            />
          </div>
        ) : !simulation ? (
          <>
            {/* Hero Section with Background Art */}
            <section ref={heroRef} className="relative overflow-hidden">
              {/* Background Image with Parallax - ref-based transform */}
              <div 
                ref={heroImageRef}
                className="absolute inset-0 bg-cover bg-center opacity-35 will-change-transform"
                style={{ 
                  backgroundImage: `url(${heroChessArt})`,
                  transform: 'translate3d(0, 0, 0) scale(1.1)',
                  backfaceVisibility: 'hidden',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background pointer-events-none" />
              
              {/* Floating Chess Particles */}
              <ChessParticles />
              
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
                    Transform Chess Into Art
                  </div>
                  
                  {/* Main headline - Royal and powerful */}
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-royal font-bold leading-tight tracking-wide uppercase">
                    Your Masterpieces,<br />
                    <span className="text-gold-gradient">
                      Forever Immortalized
                    </span>
                  </h2>
                  
                  {/* Subheadline */}
                  <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-serif px-2">
                    Upload any chess game and transform it into a stunning visualization — 
                    where every piece tells its story through color and movement.
                  </p>
                </div>
              </div>
            </section>

            {/* Floating Gold & Silver Chess Pieces - decorative area */}
            <div className="relative h-32 md:h-64 overflow-hidden flex flex-col items-center justify-center gap-3 md:gap-5">
              <FloatingChessPieces />
              <h2 
                className="relative z-10 text-xl md:text-4xl lg:text-5xl font-display tracking-widest text-gold-gradient animate-gentle-glow px-4 text-center"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Make Chess Yours...
              </h2>
              
              {/* Subtle Visionary Premium Promo with Shimmer */}
              <button
                onClick={() => setShowVisionaryModal(true)}
                className="relative z-10 group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                {/* Shimmer overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"
                  style={{ backgroundSize: '200% 100%' }}
                />
                <Crown className="relative h-3.5 w-3.5 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="relative text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium tracking-wide">
                  Unlock HD Downloads & Personal Gallery
                </span>
                <Sparkles className="relative h-3 w-3 text-amber-500/60 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>

            {/* Palette & Upload Section */}
            <section className="container mx-auto px-4 py-12 space-y-12">
              <div 
                ref={uploadRef}
                className={`max-w-4xl mx-auto space-y-12 transition-all duration-700 delay-100 ease-out ${
                  uploadVisible 
                    ? scrollAnimationClasses.fadeUp.visible 
                    : scrollAnimationClasses.fadeUp.hidden
                }`}
              >
                {/* Upload form (contains Upload Your Game + Legendary Games) */}
                <PgnUploader onPgnSubmit={handlePgnSubmit} />
                
                {/* Palette selector */}
                <PaletteSelector onPaletteChange={handlePaletteChange} />
              </div>
            </section>
            
            {/* Feature highlights with art backgrounds */}
            <section ref={featureRef} className="relative py-20 overflow-hidden">
              {/* Background Art with Parallax - ref-based transform */}
              <div 
                ref={featureImageRef}
                className="absolute inset-0 bg-cover bg-center opacity-10 will-change-transform"
                style={{ 
                  backgroundImage: `url(${chessMovementArt})`,
                  transform: 'translate3d(0, 0, 0) scale(1.15)',
                  backfaceVisibility: 'hidden',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background" />
              
              <div className="relative container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h3 
                    ref={featureTitleRef}
                    className={`text-2xl md:text-3xl font-royal font-bold text-center mb-12 uppercase tracking-wider transition-all duration-700 ease-out ${
                      featureTitleVisible 
                        ? scrollAnimationClasses.fadeUp.visible 
                        : scrollAnimationClasses.fadeUp.hidden
                    }`}
                  >
                    Why <span className="text-gold-gradient">En Pensent</span>?
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Historic Moments - Links to Marketplace */}
                    <div
                      ref={featureCard1Ref}
                      className={`transition-all duration-500 ease-out ${
                        featureCard1Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <Link 
                        to="/marketplace"
                        className="relative block text-center space-y-4 p-8 rounded-xl overflow-hidden border border-border/50 group cursor-pointer hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                      >
                        {/* AI Art Background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                          style={{ backgroundImage: `url(${randomArts[0]})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/70" />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                            <Award className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-display font-bold text-xl uppercase tracking-wide mt-4 group-hover:text-primary transition-colors">Historic Moments</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed font-serif mt-2">
                            Immortalize Fischer vs Spassky, Kasparov vs Deep Blue, or any legendary game in history
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-primary/70 mt-3 group-hover:text-primary transition-colors">
                            Explore Marketplace <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    </div>
                    
                    {/* Unique Artwork - Links to Creative Mode */}
                    <div
                      ref={featureCard2Ref}
                      className={`transition-all duration-500 delay-100 ease-out ${
                        featureCard2Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <Link 
                        to="/creative-mode"
                        className="relative block text-center space-y-4 p-8 rounded-xl overflow-hidden border border-border/50 group cursor-pointer hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                      >
                        {/* AI Art Background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                          style={{ backgroundImage: `url(${randomArts[1]})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/70" />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                            <Palette className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-display font-bold text-xl uppercase tracking-wide mt-4 group-hover:text-primary transition-colors">Unique Artwork</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed font-serif mt-2">
                            Every game creates a one-of-a-kind masterpiece — no two visualizations are ever the same
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-primary/70 mt-3 group-hover:text-primary transition-colors">
                            Create Your Own <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    </div>
                    
                    {/* Personal Legacy - Links to My Vision Gallery */}
                    <div
                      ref={featureCard3Ref}
                      className={`transition-all duration-500 delay-200 ease-out ${
                        featureCard3Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <Link 
                        to="/my-vision"
                        className="relative block text-center space-y-4 p-8 rounded-xl overflow-hidden border border-border/50 group cursor-pointer hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                      >
                        {/* AI Art Background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                          style={{ backgroundImage: `url(${randomArts[2]})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/70" />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                            <Sparkles className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-display font-bold text-xl uppercase tracking-wide mt-4 group-hover:text-primary transition-colors">Personal Legacy</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed font-serif mt-2">
                            Commemorate your own victories, lessons learned, or matches played with loved ones
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-primary/70 mt-3 group-hover:text-primary transition-colors">
                            View Your Gallery <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Decorative King Art Section */}
            <section ref={kingRef} className="py-10 md:py-16">
              <div className="container mx-auto px-4">
                <div 
                  ref={kingContentRef}
                  className={`max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-12 transition-all duration-700 ease-out ${
                    kingContentVisible 
                      ? scrollAnimationClasses.fadeUp.visible 
                      : scrollAnimationClasses.fadeUp.hidden
                  }`}
                >
                  {/* King Art with Parallax - ref-based transform */}
                  <div 
                    ref={kingImageRef}
                    className="w-36 h-36 md:w-64 md:h-64 rounded-xl md:rounded-2xl overflow-hidden shadow-xl md:shadow-2xl ring-1 ring-primary/20 flex-shrink-0 will-change-transform"
                    style={{ 
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <img 
                      src={chessKingArt} 
                      alt="Golden chess king" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center md:text-left space-y-3 md:space-y-4 px-2">
                    <h3 className="text-xl md:text-3xl font-royal font-bold uppercase tracking-wide">
                      Every King Has a <span className="text-gold-gradient">Story</span>
                    </h3>
                    <p className="text-muted-foreground font-serif leading-relaxed text-base md:text-lg">
                      From the opening move to the final checkmate, each chess game weaves a unique narrative. 
                      Our visualizations capture this journey — transforming strategic brilliance into 
                      museum-quality art you can display with pride.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Creative Mode Showcase */}
            <CreativeModeShowcase />

            {/* NEW: Carlsen in Color Book Showcase */}
            <BookShowcase variant="hero" />

            {/* Live Market Activity Widget */}
            <LiveMarketWidget />

            {/* Community Trending Widget */}
            <TrendingWidget />

            {/* Natural QR Vision Showcase - moved to bottom before Premium CTA */}
            <NaturalQRShowcase />

            {/* Premium Subscription CTA */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                  <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card/95 via-card to-primary/10 shadow-2xl shadow-primary/10">
                    {/* AI Art Background with animated overlay */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-1000"
                      style={{ backgroundImage: `url(${randomArts[3]})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-card/50" />
                    
                    {/* Gold shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
                    
                    {/* Decorative corner accents */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-primary/40 rounded-tl-3xl" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-primary/40 rounded-br-3xl" />
                    
                    <div className="relative z-10 p-8 md:p-14">
                      <div className="flex flex-col lg:flex-row items-center gap-10">
                        {/* Gold Seal Logo */}
                        <div className="relative flex-shrink-0 group">
                          <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-amber-400/20 to-primary/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-primary/50 overflow-hidden shadow-xl shadow-primary/20 group-hover:border-primary/80 transition-colors duration-300">
                            <img 
                              src={enPensentLogo} 
                              alt="En Pensent" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Rotating glow ring */}
                          <div className="absolute -inset-2 border border-primary/30 rounded-full animate-spin-slow opacity-50" style={{ animationDuration: '20s' }} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 text-center lg:text-left space-y-5">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 text-xs font-display uppercase tracking-[0.2em] text-primary shadow-lg shadow-primary/10">
                            <Sparkles className="h-3.5 w-3.5" />
                            Visionary Membership
                          </div>
                          
                          <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold uppercase tracking-wide leading-tight">
                            Elevate Your <span className="text-gold-gradient">Chess Legacy</span>
                          </h3>
                          
                          <p className="text-base md:text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl">
                            Join an exclusive circle of chess art collectors. Unlock pristine HD downloads, 
                            curate your personal gallery, and gain first access to limited edition gold & silver prints.
                          </p>
                          
                          {/* Feature highlights */}
                          <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                            <div className="flex items-center gap-2 text-primary/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="font-serif">Watermark-free exports</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="font-serif">Unlimited gallery saves</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="font-serif">Priority print access</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                            <div className="text-center sm:text-left">
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-display font-bold text-gold-gradient">$7</span>
                                <span className="text-muted-foreground font-serif text-lg">/month</span>
                              </div>
                              <p className="text-xs text-muted-foreground/70 font-serif mt-1">Cancel anytime</p>
                            </div>
                            <Button 
                              onClick={() => setShowVisionaryModal(true)}
                              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-amber-500 to-primary text-primary-foreground font-display uppercase tracking-wider text-sm hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                              <Crown className="h-5 w-5 relative z-10" />
                              <span className="relative z-10">Become a Visionary</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-4xl" ref={visionBoardRef}>
            <UnifiedVisionExperience
              key={paletteKey}
              board={simulation.board}
              gameData={simulation.gameData}
              totalMoves={simulation.totalMoves}
              pgn={currentPgn}
              context="generator"
              title={gameTitle}
              shareId={savedShareId}
              visualizationId={savedVisualizationId || undefined}
              isPremium={isPremium}
              onBack={handleReturnClick}
              onUpgradePrompt={() => setShowVisionaryModal(true)}
              onExport={async (type, exportState) => {
                // Preview download is available for everyone
                // HD and GIF require premium
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
                        pieceType: p.pieceType as any,
                        pieceColor: p.pieceColor as any,
                      })),
                      compareMode: exportState.compareMode,
                    }
                  : undefined;
                
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
                        pieceType: p.pieceType as any,
                        pieceColor: p.pieceColor as any,
                      })),
                      compareMode: exportState.compareMode,
                      darkMode: exportState.darkMode,
                    });
                  }
                  
                  // Mark that we're navigating to order page for toast on return
                  setReturningFromOrder(true);
                  
                  // Navigate to order print page with full simulation data
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
                    link.download = `${visualTitle.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
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
                } else if (type === 'hd') {
                  // Use trademark HD export for proper "print-ready" look
                  await downloadTrademarkHD({
                    board: filteredBoard,
                    gameData: simulation.gameData,
                    title: visualTitle,
                    darkMode: exportState?.darkMode || false,
                    showQR: !!savedShareId,
                    shareId: savedShareId || undefined,
                  });
                } else if (type === 'gif') {
                  const boardElement = visionBoardRef.current?.querySelector('[data-vision-board]') as HTMLElement;
                  if (boardElement) {
                    await downloadGIF(simulation, boardElement, visualTitle);
                  } else if (visionBoardRef.current) {
                    await downloadGIF(simulation, visionBoardRef.current, visualTitle);
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
                
                // For now, show a toast prompting to use the full download flow
                // The actual save requires capturing the canvas as an image blob
                toast.info('Use HD Download to save to gallery', { 
                  description: 'Download your visualization first, then it will be saved to your gallery' 
                });
                return null;
              }}
              onShare={() => {
                if (savedShareId) {
                  const url = `${window.location.origin}/v/${savedShareId}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Share link copied!', { description: url });
                } else {
                  toast.info('Save to gallery first to get a share link');
                }
              }}
              onTransferToCreative={() => {
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
          </div>
        )}
      </main>

      {/* Education Fund Section */}
      <EducationFundShowcase variant="homepage" />
      
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
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Index;
