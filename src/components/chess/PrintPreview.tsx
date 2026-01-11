import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import TimelineSlider from './TimelineSlider';
import { SimulationResult, SquareData } from '@/lib/chess/gameSimulator';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sun, Moon, Crown, Bookmark, Check, Film } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { useAuth } from '@/hooks/useAuth';
import { PremiumUpgradeModal } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { saveVisualization } from '@/lib/visualizations/visualizationStorage';
import { useTimeline } from '@/contexts/TimelineContext';
import { Progress } from '@/components/ui/progress';

interface PrintPreviewProps {
  simulation: SimulationResult;
  pgn?: string;
  title?: string;
  onShareIdCreated?: (shareId: string) => void;
}

// Filter board to show only moves up to a certain point
function filterBoardToMove(board: SquareData[][], moveNumber: number): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= moveNumber)
    }))
  );
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, pgn, title, onShareIdCreated }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const gifBoardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [boardSize, setBoardSize] = useState(320);
  const [darkMode, setDarkMode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTrigger, setPremiumModalTrigger] = useState<'download' | 'save' | 'gif'>('download');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [gifPreviewMove, setGifPreviewMove] = useState<number | null>(null);
  
  const { isPremium, user } = useAuth();

  // Timeline context for filtering board by move
  let timelineBoard: SquareData[][] = simulation.board;
  let currentMove = Infinity;
  try {
    const timeline = useTimeline();
    currentMove = timeline.currentMove;
    
    // Filter board based on current timeline position
    if (currentMove !== Infinity && currentMove < simulation.totalMoves) {
      timelineBoard = simulation.board.map(rank => 
        rank.map(square => ({
          ...square,
          visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
        }))
      );
    }
  } catch {
    // Timeline context not available
  }

  // Board for GIF generation (separate from main display)
  const gifBoard = gifPreviewMove !== null 
    ? filterBoardToMove(simulation.board, gifPreviewMove) 
    : timelineBoard;
  
  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL('https://enpensent.com', {
          width: 100,
          margin: 1,
          color: {
            dark: '#1A1A1A',
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
  }, []);
  
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

  // Reset saved state when simulation changes
  useEffect(() => {
    setIsSaved(false);
  }, [simulation]);
  
  // Capture the preview element directly using html2canvas
  const capturePreview = async (withWatermark: boolean): Promise<HTMLCanvasElement | null> => {
    if (!printRef.current) {
      console.error('Print ref not available');
      return null;
    }
    
    try {
      // Show watermark for free downloads
      if (withWatermark) {
        setShowWatermark(true);
        // Wait for React to render the watermark
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Extra time for rendering to settle
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Capture at 5x resolution for max quality
      const canvas = await html2canvas(printRef.current, {
        scale: 5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc, clonedElement) => {
          // Ensure SVG elements have proper namespace for html2canvas
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            const computedStyle = window.getComputedStyle(svg);
            if (!svg.getAttribute('width')) {
              svg.setAttribute('width', computedStyle.width);
            }
            if (!svg.getAttribute('height')) {
              svg.setAttribute('height', computedStyle.height);
            }
          });
          
          // Force font rendering in cloned document
          const allText = clonedElement.querySelectorAll('*');
          allText.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            if (computedStyle.fontFamily) {
              htmlEl.style.fontFamily = computedStyle.fontFamily;
            }
          });
        },
      });
      
      // Hide watermark after capture
      if (withWatermark) {
        setShowWatermark(false);
      }
      
      return canvas;
    } catch (error) {
      console.error('html2canvas capture failed:', error);
      setShowWatermark(false);
      throw error;
    }
  };
  
  // Watermark component for free downloads
  const WatermarkOverlay = () => (
    <div
      ref={watermarkRef}
      className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1.5 rounded-md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(180, 180, 180, 0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Logo */}
      <img
        src={enPensentLogo}
        alt="En Pensent"
        className="w-8 h-8 rounded-full object-cover"
      />
      
      {/* Text */}
      <div className="flex flex-col">
        <span
          className="text-xs font-semibold text-gray-800 leading-tight tracking-wide"
          style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
        >
          EN PENSENT
        </span>
        <span
          className="text-[10px] text-gray-500 leading-tight italic"
          style={{ fontFamily: "'Cormorant', Georgia, serif" }}
        >
          enpensent.com
        </span>
      </div>
      
      {/* QR Code */}
      {qrCodeDataUrl && (
        <img
          src={qrCodeDataUrl}
          alt="QR Code"
          className="w-8 h-8"
        />
      )}
    </div>
  );
  
  // Download handler
  const handleDownload = async (withWatermark: boolean) => {
    setIsDownloading(true);
    console.log('Starting download, withWatermark:', withWatermark);
    
    try {
      const canvas = await capturePreview(withWatermark);
      if (!canvas) {
        throw new Error('Failed to capture preview - canvas is null');
      }
      
      console.log('Canvas ready, creating download...');
      
      // Create data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('Data URL created, length:', dataUrl.length);
      
      // Create filename
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      const modeLabel = darkMode ? 'dark' : 'light';
      const qualityLabel = withWatermark ? 'preview' : 'HD';
      const filename = `EnPensent-${whiteName}-vs-${blackName}-${modeLabel}-${qualityLabel}.png`;
      
      // Use more reliable download method
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download triggered:', filename);
      toast.success(withWatermark ? 'Preview downloaded!' : 'HD image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleHDDownload = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('download');
      setShowPremiumModal(true);
      return;
    }
    
    handleDownload(false);
  };

  // GIF generation handler
  const handleGifDownload = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('gif');
      setShowPremiumModal(true);
      return;
    }

    if (!printRef.current) return;

    setIsGeneratingGif(true);
    setGifProgress(0);

    try {
      // Capture initial frame to get dimensions
      const firstCanvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        logging: false,
      });

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: firstCanvas.width,
        height: firstCanvas.height,
        workerScript: '/gif.worker.js',
      });

      // Sample moves for reasonable file size
      const maxFrames = 40;
      const step = simulation.totalMoves > maxFrames ? Math.ceil(simulation.totalMoves / maxFrames) : 1;
      const movesToCapture: number[] = [0];
      
      for (let i = 1; i <= simulation.totalMoves; i += step) {
        movesToCapture.push(i);
      }
      if (movesToCapture[movesToCapture.length - 1] !== simulation.totalMoves) {
        movesToCapture.push(simulation.totalMoves);
      }

      const totalFrames = movesToCapture.length;

      // Show watermark for GIF
      setShowWatermark(true);
      await new Promise(r => setTimeout(r, 100));

      for (let i = 0; i < movesToCapture.length; i++) {
        const moveNum = movesToCapture[i];
        setGifPreviewMove(moveNum);
        await new Promise(r => setTimeout(r, 80));

        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
          logging: false,
        });

        const isFirstOrLast = i === 0 || i === movesToCapture.length - 1;
        gif.addFrame(canvas, { delay: isFirstOrLast ? 600 : 150, copy: true });
        setGifProgress(((i + 1) / totalFrames) * 70);
      }

      setShowWatermark(false);
      setGifPreviewMove(null);

      gif.on('progress', (p: number) => setGifProgress(70 + p * 30));

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
        const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
        link.download = `EnPensent-${whiteName}-vs-${blackName}-animated.gif`;
        link.click();
        URL.revokeObjectURL(url);
        setIsGeneratingGif(false);
        setGifProgress(0);
        toast.success('GIF downloaded!');
      });

      gif.render();
    } catch (error) {
      console.error('GIF generation failed:', error);
      toast.error('GIF generation failed');
      setIsGeneratingGif(false);
      setGifProgress(0);
      setShowWatermark(false);
      setGifPreviewMove(null);
    }
  };

  const handleSaveToGallery = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!isPremium) {
      setPremiumModalTrigger('save');
      setShowPremiumModal(true);
      return;
    }
    
    setIsSaving(true);
    try {
      // Capture clean image (no watermark) for gallery
      const canvas = await capturePreview(false);
      if (!canvas) throw new Error('Failed to capture preview');
      
      const imageBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
      
      if (!imageBlob) {
        throw new Error('Failed to create image blob');
      }
      
      const visualizationTitle = title || 
        `${simulation.gameData.white} vs ${simulation.gameData.black}`;
      
      const { data, error } = await saveVisualization(
        user.id,
        visualizationTitle,
        simulation,
        imageBlob,
        pgn
      );
      
      if (error) {
        throw error;
      }
      
      setIsSaved(true);
      
      // Notify parent of the share ID for QR code integration
      if (data?.public_share_id && onShareIdCreated) {
        onShareIdCreated(data.public_share_id);
      }
      
      toast.success('Saved to your gallery!', {
        description: 'View it anytime in My Vision',
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
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
          {/* Chess board visualization with watermark overlay */}
          <div className="relative">
            <ChessBoardVisualization 
              board={gifPreviewMove !== null ? filterBoardToMove(simulation.board, gifPreviewMove) : timelineBoard} 
              size={boardSize}
            />
            
            {/* Watermark - visible during free download and GIF capture */}
            {showWatermark && <WatermarkOverlay />}
          </div>
          
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
        </div>
      </div>

      {/* Timeline Slider */}
      <TimelineSlider 
        totalMoves={simulation.totalMoves} 
        moves={simulation.gameData.moves}
      />
      
      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {/* Download buttons row */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            onClick={() => handleDownload(true)}
            disabled={isDownloading || isSaving}
            variant="outline"
            className="gap-2 px-6"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Free Preview
          </Button>
          
          <Button 
            onClick={handleHDDownload}
            disabled={isDownloading || isSaving}
            className="gap-2 btn-luxury px-6"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPremium ? (
              <Download className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isPremium ? 'Download HD (No Watermark)' : 'HD Download'}
            {!isPremium && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
        </div>

        {/* GIF Download button */}
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={handleGifDownload}
            disabled={isDownloading || isSaving || isGeneratingGif}
            variant="outline"
            className={`gap-2 px-6 border-violet-500/30 hover:bg-violet-500/10 ${isPremium ? 'text-violet-400' : ''}`}
          >
            {isGeneratingGif ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPremium ? (
              <Film className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isGeneratingGif ? 'Generating GIF...' : 'Download Animated GIF'}
            {!isPremium && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
          {isGeneratingGif && (
            <Progress value={gifProgress} className="w-48 h-2" />
          )}
        </div>
        
        {/* Save to Gallery button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleSaveToGallery}
            disabled={isDownloading || isSaving || isSaved || isGeneratingGif}
            variant={isSaved ? "secondary" : "outline"}
            className={`gap-2 px-6 ${isSaved ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : isPremium ? (
              <Bookmark className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isSaved ? 'Saved to Gallery' : 'Save to My Vision'}
            {!isPremium && !isSaved && (
              <span className="text-xs opacity-75 ml-1">Premium</span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onAuthRequired={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
        trigger={premiumModalTrigger}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default PrintPreview;
