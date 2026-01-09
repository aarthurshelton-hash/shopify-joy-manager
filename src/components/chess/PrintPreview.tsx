import React, { useRef } from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { Download, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PrintPreviewProps {
  simulation: SimulationResult;
  onOrderPrint?: () => void;
  pgn?: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, onOrderPrint, pgn }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const handleDownload = async () => {
    if (!printRef.current) return;
    
    setIsDownloading(true);
    try {
      // Use html2canvas for high-quality export
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `${simulation.gameData.white || 'chess'}-vs-${simulation.gameData.black || 'game'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const gameTitle = simulation.gameData.white && simulation.gameData.black
    ? `${simulation.gameData.white} vs ${simulation.gameData.black}`
    : simulation.gameData.event || 'Chess Game';
  
  return (
    <div className="space-y-6">
      {/* The actual print preview */}
      <div 
        ref={printRef}
        className="bg-white p-8 md:p-12 shadow-lg mx-auto max-w-2xl rounded-lg"
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
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Image
        </Button>
        <Button onClick={onOrderPrint} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Order Print
        </Button>
      </div>
      
      {/* Info about the process */}
      <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>
          Your unique chess visualization will be printed on museum-quality paper 
          and shipped directly to your door.
        </p>
      </div>
    </div>
  );
};

export default PrintPreview;
