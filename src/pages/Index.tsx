import React, { useState, useCallback } from 'react';
import PgnUploader from '@/components/chess/PgnUploader';
import PrintPreview from '@/components/chess/PrintPreview';
import ColorLegend from '@/components/chess/ColorLegend';
import ChessLoadingAnimation from '@/components/chess/ChessLoadingAnimation';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Crown, Sparkles, Award } from 'lucide-react';
import { toast } from 'sonner';
import { cleanPgn } from '@/lib/chess/pgnValidator';

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
  
  const handlePgnSubmit = (pgn: string) => {
    // Clean the PGN but don't validate - just process what we can
    const cleanedPgn = cleanPgn(pgn);

    // Simulate the game - the simulator will process whatever it can
    const result = simulateGame(cleanedPgn);
    
    // Extract title
    const whiteMatch = cleanedPgn.match(/\[White\s+"([^"]+)"\]/);
    const blackMatch = cleanedPgn.match(/\[Black\s+"([^"]+)"\]/);
    const eventMatch = cleanedPgn.match(/\[Event\s+"([^"]+)"\]/);
    
    let title = 'Chess Visualization';
    if (whiteMatch && blackMatch) {
      title = `${whiteMatch[1]} vs ${blackMatch[1]}`;
    } else if (eventMatch) {
      title = eventMatch[1];
    }
    
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
      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="max-w-4xl mx-auto">
            <ChessLoadingAnimation onComplete={handleLoadingComplete} />
          </div>
        ) : !simulation ? (
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Hero section - Premium and bold */}
            <div className="text-center space-y-8 py-8">
              {/* Premium badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium tracking-wide">
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
            
            {/* Upload form */}
            <PgnUploader onPgnSubmit={handlePgnSubmit} />
            
            {/* Feature highlights - Premium cards */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-4 p-8 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl">Historic Moments</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                  Immortalize Fischer vs Spassky, Kasparov vs Deep Blue, or any legendary game in history
                </p>
              </div>
              
              <div className="text-center space-y-4 p-8 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl">Unique Artwork</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                  Every game creates a one-of-a-kind masterpiece — no two visualizations are ever the same
                </p>
              </div>
              
              <div className="text-center space-y-4 p-8 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group">
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
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 justify-center">
            {/* Print preview */}
            <div className="flex-1 max-w-2xl space-y-8">
              <PrintPreview 
                simulation={simulation} 
                pgn={currentPgn}
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
                <ColorLegend />
              </div>
            )}
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
