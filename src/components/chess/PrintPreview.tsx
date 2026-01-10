import React, { useRef, useEffect, useState } from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface PrintPreviewProps {
  simulation: SimulationResult;
  pgn?: string;
  title?: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, pgn, title }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [boardSize, setBoardSize] = useState(320);
  const [darkMode, setDarkMode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL('https://enpensent.com', {
          width: 80,
          margin: 1,
          color: {
            dark: darkMode ? '#FAFAFA' : '#1A1A1A',
            light: 'transparent',
          },
          errorCorrectionLevel: 'M',
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    generateQR();
  }, [darkMode]);
  
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
      
      // Show watermark for capture
      if (watermarkRef.current) {
        watermarkRef.current.style.display = 'block';
      }
      
      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Capture the full content with proper settings
      const canvas = await html2canvas(printRef.current, {
        scale: 3, // Higher resolution for print quality
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });
      
      // Hide watermark after capture
      if (watermarkRef.current) {
        watermarkRef.current.style.display = 'none';
      }
      
      const link = document.createElement('a');
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      const modeLabel = darkMode ? 'dark' : 'light';
      link.download = `EnPensent-${whiteName}-vs-${blackName}-${modeLabel}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success('High-resolution image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
      // Make sure watermark is hidden on error too
      if (watermarkRef.current) {
        watermarkRef.current.style.display = 'none';
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant={darkMode ? "outline" : "default"}
          size="sm"
          onClick={() => setDarkMode(false)}
          className="gap-2 text-xs"
        >
          <Sun className="h-3 w-3" />
          Light
        </Button>
        <Button
          variant={darkMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDarkMode(true)}
          className="gap-2 text-xs"
        >
          <Moon className="h-3 w-3" />
          Dark
        </Button>
      </div>

      {/* Print Preview - The actual artwork */}
      <div 
        ref={printRef}
        className={`p-6 md:p-10 shadow-2xl mx-auto max-w-lg rounded-sm border transition-colors duration-300 ${
          darkMode 
            ? 'bg-[#0A0A0A] border-stone-800' 
            : 'bg-[#FDFCFB] border-stone-200'
        }`}
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
          <div className={`w-full pt-4 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
            <GameInfoDisplay gameData={simulation.gameData} title={title} darkMode={darkMode} />
          </div>
          
          {/* Subtle branding - visible in preview */}
          <p 
            className={`text-[10px] tracking-[0.3em] uppercase font-medium ${
              darkMode ? 'text-stone-500' : 'text-stone-400'
            }`}
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            ♔ En Pensent ♚
          </p>
          
          {/* Watermark - hidden in preview, shown only in downloads */}
          <div 
            ref={watermarkRef}
            className={`w-full pt-4 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}
            style={{ display: 'none' }}
          >
            <div className="flex items-center justify-between px-2">
              {/* Logo on the left */}
              <div className="flex items-center gap-2">
                <img 
                  src={enPensentLogo} 
                  alt="En Pensent" 
                  className="w-10 h-10 object-contain"
                  crossOrigin="anonymous"
                />
                <div className="flex flex-col">
                  <span 
                    className={`text-[9px] tracking-[0.2em] uppercase font-semibold ${
                      darkMode ? 'text-stone-300' : 'text-stone-600'
                    }`}
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    En Pensent
                  </span>
                  <span 
                    className={`text-[7px] tracking-wider ${
                      darkMode ? 'text-stone-500' : 'text-stone-400'
                    }`}
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    Chess Art Visualizations
                  </span>
                </div>
              </div>
              
              {/* QR Code on the right */}
              <div className="flex flex-col items-center gap-1">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Scan to visit" 
                    className="w-12 h-12"
                    crossOrigin="anonymous"
                  />
                )}
                <span 
                  className={`text-[6px] tracking-wide ${
                    darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`}
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  enpensent.com
                </span>
              </div>
            </div>
          </div>
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
