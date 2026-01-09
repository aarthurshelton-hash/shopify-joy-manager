import React, { useRef, useEffect, useState } from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PrintPreviewProps {
  simulation: SimulationResult;
  pgn?: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, pgn }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [boardSize, setBoardSize] = useState(320);
  
  // Calculate appropriate board size based on container
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 80, 450);
      setBoardSize(Math.max(280, maxWidth));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const handleDownload = async () => {
    if (!printRef.current) return;
    
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the full content with proper settings
      const canvas = await html2canvas(printRef.current, {
        scale: 3, // Higher resolution for print quality
        backgroundColor: '#FDFCFB',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });
      
      const link = document.createElement('a');
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      link.download = `EnPensent-${whiteName}-vs-${blackName}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success('High-resolution image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Preview - The actual artwork */}
      <div 
        ref={printRef}
        className="bg-[#FDFCFB] p-6 md:p-10 shadow-2xl mx-auto max-w-lg rounded-sm border border-stone-200"
        style={{ 
          minHeight: 'auto',
          width: 'fit-content',
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Chess board visualization - fixed size for consistency */}
          <ChessBoardVisualization 
            board={simulation.board} 
            size={boardSize}
          />
          
          {/* Game information - proper spacing */}
          <div className="w-full pt-4 border-t border-stone-200">
            <GameInfoDisplay gameData={simulation.gameData} />
          </div>
          
          {/* Subtle branding */}
          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-sans">
            En Pensent
          </p>
        </div>
      </div>
      
      {/* Download button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="gap-2 btn-luxury px-6"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Free Preview
        </Button>
      </div>
    </div>
  );
};

export default PrintPreview;
