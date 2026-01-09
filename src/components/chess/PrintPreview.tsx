import React, { useRef } from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { Download, ShoppingCart } from 'lucide-react';

interface PrintPreviewProps {
  simulation: SimulationResult;
  onOrderPrint?: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, onOrderPrint }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="space-y-6">
      {/* The actual print preview */}
      <div 
        ref={printRef}
        className="bg-white p-8 md:p-12 shadow-lg mx-auto max-w-2xl"
        style={{ aspectRatio: '3/4' }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {/* Chess board visualization */}
          <ChessBoardVisualization 
            board={simulation.board} 
            size={Math.min(400, window.innerWidth - 100)}
          />
          
          {/* Copyright notice */}
          <p className="text-xs text-muted-foreground self-end">
            © En Pensent
          </p>
          
          {/* Game information */}
          <GameInfoDisplay gameData={simulation.gameData} />
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Image
        </Button>
        <Button onClick={onOrderPrint} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Order Print
        </Button>
      </div>
    </div>
  );
};

export default PrintPreview;
