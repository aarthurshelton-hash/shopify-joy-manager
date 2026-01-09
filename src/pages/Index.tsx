import React, { useState, useCallback, useRef } from 'react';
import PgnUploader from '@/components/chess/PgnUploader';
import PrintPreview from '@/components/chess/PrintPreview';
import ColorLegend from '@/components/chess/ColorLegend';
import ChessLoadingAnimation from '@/components/chess/ChessLoadingAnimation';
import PaletteSelector from '@/components/chess/PaletteSelector';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Crown, Sparkles, Award } from 'lucide-react';
import { toast } from 'sonner';
import { cleanPgn } from '@/lib/chess/pgnValidator';
import { PaletteId } from '@/lib/chess/pieceColors';
import { useParallax } from '@/hooks/useParallax';

// Import AI-generated art
import heroChessArt from '@/assets/hero-chess-art.jpg';
import chessMovementArt from '@/assets/chess-movement-art.jpg';
import chessKingArt from '@/assets/chess-king-art.jpg';

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
  
  // Refs for parallax sections
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const kingRef = useRef<HTMLDivElement>(null);
  
  // Parallax offsets for each section
  const heroOffset = useParallax(heroRef, { speed: 0.15, direction: 'up' });
  const featureOffset = useParallax(featureRef, { speed: 0.2, direction: 'up' });
  const kingOffset = useParallax(kingRef, { speed: 0.1, direction: 'down' });
  
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
              {/* Background Image with Parallax */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-75 ease-out will-change-transform"
                style={{ 
                  backgroundImage: `url(${heroChessArt})`,
                  transform: `translateY(${heroOffset}px) scale(1.1)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
              
              <div className="relative container mx-auto px-4 py-20 md:py-28">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                  {/* Premium badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium tracking-wide backdrop-blur-sm">
                    <Crown className="h-4 w-4" />
                    Transform Chess Into Art
                  </div>
                  
                  {/* Main headline */}
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight">
                    Your Masterpieces,<br />
                    <span className="text-gold-gradient">
                      Forever Immortalized
                    </span>
                  </h2>
                  
                  {/* Subheadline */}
                  <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-serif">
                    Upload any chess game and transform it into a stunning visualization — 
                    where every piece tells its story through color and movement.
                  </p>
                </div>
              </div>
            </section>

            {/* Palette & Upload Section */}
            <section className="container mx-auto px-4 py-12 space-y-12">
              <div className="max-w-4xl mx-auto space-y-12">
                {/* Palette selector */}
                <PaletteSelector onPaletteChange={handlePaletteChange} />
                
                {/* Upload form */}
                <PgnUploader onPgnSubmit={handlePgnSubmit} />
              </div>
            </section>
            
            {/* Feature highlights with art backgrounds */}
            <section ref={featureRef} className="relative py-20 overflow-hidden">
              {/* Background Art with Parallax */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 transition-transform duration-75 ease-out will-change-transform"
                style={{ 
                  backgroundImage: `url(${chessMovementArt})`,
                  transform: `translateY(${featureOffset}px) scale(1.15)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background" />
              
              <div className="relative container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
                    Why <span className="text-gold-gradient">En Pensent</span>?
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-xl">Historic Moments</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Immortalize Fischer vs Spassky, Kasparov vs Deep Blue, or any legendary game in history
                      </p>
                    </div>
                    
                    <div className="text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Palette className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-xl">Unique Artwork</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Every game creates a one-of-a-kind masterpiece — no two visualizations are ever the same
                      </p>
                    </div>
                    
                    <div className="text-center space-y-4 p-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-xl">Personal Legacy</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                        Commemorate your own victories, lessons learned, or matches played with loved ones
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Decorative King Art Section */}
            <section ref={kingRef} className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* King Art with Parallax */}
                  <div 
                    className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-primary/20 flex-shrink-0 transition-transform duration-100 ease-out will-change-transform"
                    style={{ transform: `translateY(${kingOffset}px)` }}
                  >
                    <img 
                      src={chessKingArt} 
                      alt="Golden chess king" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center md:text-left space-y-4">
                    <h3 className="text-2xl md:text-3xl font-display font-bold">
                      Every King Has a <span className="text-gold-gradient">Story</span>
                    </h3>
                    <p className="text-muted-foreground font-serif leading-relaxed">
                      From the opening move to the final checkmate, each chess game weaves a unique narrative. 
                      Our visualizations capture this journey — transforming strategic brilliance into 
                      museum-quality art you can display with pride.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-10 justify-center">
              {/* Print preview */}
              <div className="flex-1 max-w-2xl space-y-8">
                <PrintPreview 
                  key={paletteKey}
                  simulation={simulation} 
                  pgn={currentPgn}
                  title={gameTitle}
                />
                
                {/* Product selector for ordering */}
                <ProductSelector 
                  customPrintData={{
                    pgn: currentPgn,
                    gameTitle: gameTitle,
                  }}
                />
              </div>
              
              {/* Legend sidebar */}
              {showLegend && (
                <div className="lg:w-72">
                  <ColorLegend key={`legend-${paletteKey}`} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer - Premium and minimal */}
      <footer className="border-t border-border/50 mt-20 bg-card/30">
        <div className="container mx-auto px-4 py-10 text-center space-y-3">
          <p className="text-sm font-display font-medium tracking-wide text-gold-gradient">
            ♔ En Pensent ♚
          </p>
          <p className="text-xs text-muted-foreground tracking-wide">
            Turn every move into a masterpiece
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
