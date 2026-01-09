import React, { useState } from 'react';
import PgnUploader from '@/components/chess/PgnUploader';
import PrintPreview from '@/components/chess/PrintPreview';
import ColorLegend from '@/components/chess/ColorLegend';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';

const Index = () => {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  
  const handlePgnSubmit = (pgn: string) => {
    const result = simulateGame(pgn);
    setSimulation(result);
  };
  
  const handleBack = () => {
    setSimulation(null);
  };
  
  const handleOrderPrint = () => {
    // TODO: Integrate with Shopify/Printify
    console.log('Order print clicked');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {simulation && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Game
              </Button>
            )}
            <h1 className="text-xl font-serif font-bold tracking-wide">
              En Pensent
            </h1>
          </div>
          
          {simulation && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
            >
              <Palette className="h-4 w-4 mr-2" />
              {showLegend ? 'Hide' : 'Show'} Legend
            </Button>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {!simulation ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero section */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold">
                Transform Chess Games Into Art
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Upload any chess game and create a beautiful visualization of the entire match. 
                Each piece leaves its unique color signature as it moves across the board.
              </p>
            </div>
            
            {/* Upload form */}
            <PgnUploader onPgnSubmit={handlePgnSubmit} />
            
            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">♞</span>
                </div>
                <h3 className="font-semibold">Any Game</h3>
                <p className="text-sm text-muted-foreground">
                  Famous matches, personal games, or tournament highlights
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="font-semibold">Unique Art</h3>
                <p className="text-sm text-muted-foreground">
                  Every game creates a one-of-a-kind abstract visualization
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🖼️</span>
                </div>
                <h3 className="font-semibold">Print Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Order high-quality prints to display your favorite games
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            {/* Print preview */}
            <div className="flex-1 max-w-2xl">
              <PrintPreview 
                simulation={simulation} 
                onOrderPrint={handleOrderPrint}
              />
            </div>
            
            {/* Legend sidebar */}
            {showLegend && (
              <div className="lg:w-48">
                <ColorLegend />
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© En Pensent — Chess Visualization Art</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
