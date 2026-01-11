import React, { useState, useCallback, useRef } from 'react';
import PgnUploader from '@/components/chess/PgnUploader';
import PrintPreview from '@/components/chess/PrintPreview';
import ColorLegend from '@/components/chess/ColorLegend';
import ChessLoadingAnimation from '@/components/chess/ChessLoadingAnimation';
import PaletteSelector from '@/components/chess/PaletteSelector';
import ChessParticles from '@/components/chess/ChessParticles';
import FloatingChessPieces from '@/components/chess/FloatingChessPieces';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Crown, Sparkles, Award } from 'lucide-react';
import { toast } from 'sonner';
import { cleanPgn } from '@/lib/chess/pgnValidator';
import { PaletteId } from '@/lib/chess/pieceColors';
import { useScrollAnimation, scrollAnimationClasses } from '@/hooks/useScrollAnimation';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { TimelineProvider } from '@/contexts/TimelineContext';

// Import AI-generated art
import heroChessArt from '@/assets/hero-chess-art.jpg';
import chessMovementArt from '@/assets/chess-movement-art.jpg';
import chessKingArt from '@/assets/chess-king-art.jpg';

import { useTimeline } from '@/contexts/TimelineContext';
import { SquareData } from '@/lib/chess/gameSimulator';

// Timeline-aware wrapper for ColorLegend
const TimelineAwareColorLegend: React.FC<{ 
  paletteKey: number; 
  fullBoard: SquareData[][]; 
  totalMoves: number;
}> = ({ paletteKey, fullBoard, totalMoves }) => {
  const { currentMove } = useTimeline();
  
  // Filter board based on timeline
  const timelineBoard = React.useMemo(() => {
    if (currentMove === Infinity || currentMove >= totalMoves) {
      return fullBoard;
    }
    return fullBoard.map(rank => 
      rank.map(square => ({
        ...square,
        visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
      }))
    );
  }, [fullBoard, currentMove, totalMoves]);
  
  return <ColorLegend key={`legend-${paletteKey}`} board={timelineBoard} />;
};

const Index = () => {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    result: SimulationResult;
    pgn: string;
    title: string;
  } | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [currentPgn, setCurrentPgn] = useState<string>('');
  const [gameTitle, setGameTitle] = useState<string>('');
  const [paletteKey, setPaletteKey] = useState(0);
  const [savedShareId, setSavedShareId] = useState<string | null>(null);
  
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
  
  const handleBack = () => {
    setSimulation(null);
    setCurrentPgn('');
    setGameTitle('');
    setIsLoading(false);
    setPendingResult(null);
    setSavedShareId(null);
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
      
      {/* Secondary navigation for visualization mode */}
      {simulation && (
        <div className="border-b border-border/50 bg-card/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Create Another
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="gap-2 border-border/50"
            >
              <Palette className="h-4 w-4" />
              {showLegend ? 'Hide' : 'Show'} Legend
            </Button>
          </div>
        </div>
      )}
      
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
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
              
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
            <div className="relative h-28 md:h-56 overflow-hidden flex items-center justify-center">
              <FloatingChessPieces />
              <h2 
                className="relative z-10 text-xl md:text-4xl lg:text-5xl font-display tracking-widest text-gold-gradient animate-gentle-glow px-4 text-center"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Make Chess Yours...
              </h2>
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
                    <div 
                      ref={featureCard1Ref}
                      className={`text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 ease-out group ${
                        featureCard1Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-xl uppercase tracking-wide">Historic Moments</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Immortalize Fischer vs Spassky, Kasparov vs Deep Blue, or any legendary game in history
                      </p>
                    </div>
                    
                    <div 
                      ref={featureCard2Ref}
                      className={`text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 delay-100 ease-out group ${
                        featureCard2Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Palette className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-xl uppercase tracking-wide">Unique Artwork</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Every game creates a one-of-a-kind masterpiece — no two visualizations are ever the same
                      </p>
                    </div>
                    
                    <div 
                      ref={featureCard3Ref}
                      className={`text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 delay-200 ease-out group ${
                        featureCard3Visible 
                          ? scrollAnimationClasses.scaleUp.visible 
                          : scrollAnimationClasses.scaleUp.hidden
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-xl uppercase tracking-wide">Personal Legacy</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Commemorate your own victories, lessons learned, or matches played with loved ones
                      </p>
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

            {/* Premium Subscription CTA */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-12">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      {/* Crown Icon */}
                      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 animate-gentle-glow">
                        <Crown className="h-10 w-10 text-primary" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-display uppercase tracking-widest text-primary">
                          <Sparkles className="h-3 w-3" />
                          Visionary Membership
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wide">
                          Unlock <span className="text-gold-gradient">Premium</span> Features
                        </h3>
                        <p className="text-muted-foreground font-serif leading-relaxed">
                          Get watermark-free HD downloads, save unlimited visualizations to your personal gallery, 
                          and enjoy first access to limited edition gold & silver prints.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                          <div className="text-center sm:text-left">
                            <span className="text-3xl font-display font-bold text-foreground">$7</span>
                            <span className="text-muted-foreground font-serif">/month</span>
                          </div>
                          <a 
                            href="/my-vision" 
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
                          >
                            <Crown className="h-4 w-4" />
                            Become a Visionary
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <TimelineProvider>
            <LegendHighlightProvider>
              <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-10 justify-center">
                  {/* Print preview */}
                  <div className="flex-1 max-w-2xl space-y-8">
                    <PrintPreview 
                      key={paletteKey}
                      simulation={simulation} 
                      pgn={currentPgn}
                      title={gameTitle}
                      onShareIdCreated={handleShareIdCreated}
                    />
                    
                    {/* Product selector for ordering */}
                    <ProductSelector 
                      customPrintData={{
                        pgn: currentPgn,
                        gameTitle: gameTitle,
                      }}
                      simulation={simulation}
                      shareId={savedShareId}
                    />
                  </div>
                  
                  {/* Legend sidebar */}
                  {showLegend && (
                    <div className="lg:w-72">
                      <TimelineAwareColorLegend 
                        paletteKey={paletteKey} 
                        fullBoard={simulation.board}
                        totalMoves={simulation.totalMoves}
                      />
                    </div>
                  )}
                </div>
              </div>
            </LegendHighlightProvider>
          </TimelineProvider>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
