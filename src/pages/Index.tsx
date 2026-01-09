import React, { useState } from 'react';
import PgnUploader from '@/components/chess/PgnUploader';
import PrintPreview from '@/components/chess/PrintPreview';
import ColorLegend from '@/components/chess/ColorLegend';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { Header } from '@/components/shop/Header';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Trophy, Zap, Heart } from 'lucide-react';

const Index = () => {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [currentPgn, setCurrentPgn] = useState<string>('');
  const [gameTitle, setGameTitle] = useState<string>('');
  
  const handlePgnSubmit = (pgn: string) => {
    const result = simulateGame(pgn);
    setSimulation(result);
    setCurrentPgn(pgn);
    
    // Extract game title from PGN headers
    const whiteMatch = pgn.match(/\[White\s+"([^"]+)"\]/);
    const blackMatch = pgn.match(/\[Black\s+"([^"]+)"\]/);
    const eventMatch = pgn.match(/\[Event\s+"([^"]+)"\]/);
    
    if (whiteMatch && blackMatch) {
      setGameTitle(`${whiteMatch[1]} vs ${blackMatch[1]}`);
    } else if (eventMatch) {
      setGameTitle(eventMatch[1]);
    } else {
      setGameTitle('Chess Visualization');
    }
  };
  
  const handleBack = () => {
    setSimulation(null);
    setCurrentPgn('');
    setGameTitle('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <Header />
      
      {/* Secondary navigation for visualization mode */}
      {simulation && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Create Another
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="gap-2"
            >
              <Palette className="h-4 w-4" />
              {showLegend ? 'Hide' : 'Show'} Legend
            </Button>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {!simulation ? (
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Hero section */}
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-4 w-4" />
                Transform any chess game into unique art
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                Your Favorite Games,<br />
                <span className="bg-gradient-to-r from-primary via-primary to-accent-foreground bg-clip-text text-transparent">
                  Forever Immortalized
                </span>
              </h2>
              
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Upload any chess game — from legendary grandmaster battles to your own personal victories — 
                and watch it transform into a stunning visualization where every piece tells its story through color.
              </p>
            </div>
            
            {/* Upload form */}
            <PgnUploader onPgnSubmit={handlePgnSubmit} />
            
            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Trophy className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg">Historic Moments</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Immortalize Fischer vs Spassky, Kasparov vs Deep Blue, or any legendary game in history
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Palette className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Unique Art</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every game creates a one-of-a-kind masterpiece — no two visualizations are ever the same
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <Heart className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="font-bold text-lg">Personal Memories</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Commemorate your own games — victories, lessons learned, or matches played with loved ones
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            {/* Print preview */}
            <div className="flex-1 max-w-2xl space-y-6">
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
              <div className="lg:w-64">
                <ColorLegend />
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-16 bg-card/50">
        <div className="container mx-auto px-4 py-8 text-center space-y-2">
          <p className="text-sm font-medium">♔ En Pensent — Chess Visualization Art ♚</p>
          <p className="text-xs text-muted-foreground">
            Turn every move into a masterpiece
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
