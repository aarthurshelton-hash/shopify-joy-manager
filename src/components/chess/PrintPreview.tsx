import React, { useRef, useEffect, useState } from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import { generatePrintCanvas } from '@/lib/chess/canvasRenderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sun, Moon, Crown, Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { useAuth } from '@/hooks/useAuth';
import { PremiumUpgradeModal } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { saveVisualization } from '@/lib/visualizations/visualizationStorage';

interface PrintPreviewProps {
  simulation: SimulationResult;
  pgn?: string;
  title?: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ simulation, pgn, title }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [boardSize, setBoardSize] = useState(320);
  const [darkMode, setDarkMode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalTrigger, setPremiumModalTrigger] = useState<'download' | 'save'>('download');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { isPremium, user } = useAuth();
  
  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL('https://enpensent.com', {
          width: 80,
          margin: 1,
          color: {
            dark: darkMode ? '#FAFAFA' : '#1A1A1A',
            light: darkMode ? '#0A0A0A' : '#FFFFFF',
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

  // Reset saved state when simulation changes
  useEffect(() => {
    setIsSaved(false);
  }, [simulation]);
  
  // Generate image using pure canvas rendering (no DOM capture)
  const captureImage = async (withWatermark: boolean): Promise<Blob | null> => {
    try {
      const canvas = await generatePrintCanvas(
        simulation.board,
        {
          white: simulation.gameData.white,
          black: simulation.gameData.black,
          event: simulation.gameData.event,
          date: simulation.gameData.date,
          moves: simulation.gameData.moves,
        },
        {
          boardSize: 1000, // Maximum resolution
          darkMode,
          withWatermark,
          title,
        }
      );
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Capture failed:', error);
      throw error;
    }
  };
  
  // Download using pure canvas rendering
  const handleDownload = async (withWatermark: boolean) => {
    setIsDownloading(true);
    try {
      const canvas = await generatePrintCanvas(
        simulation.board,
        {
          white: simulation.gameData.white,
          black: simulation.gameData.black,
          event: simulation.gameData.event,
          date: simulation.gameData.date,
          moves: simulation.gameData.moves,
        },
        {
          boardSize: 1000, // Maximum resolution
          darkMode,
          withWatermark,
          title,
        }
      );
      
      const link = document.createElement('a');
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      const modeLabel = darkMode ? 'dark' : 'light';
      const qualityLabel = withWatermark ? 'preview' : 'HD';
      link.download = `EnPensent-${whiteName}-vs-${blackName}-${modeLabel}-${qualityLabel}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success(withWatermark ? 'Preview image downloaded!' : 'HD image downloaded without watermark!');
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
      const imageBlob = await captureImage(false);
      
      if (!imageBlob) {
        throw new Error('Failed to capture image');
      }
      
      const visualizationTitle = title || 
        `${simulation.gameData.white} vs ${simulation.gameData.black}`;
      
      const { error } = await saveVisualization(
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
          {/* Chess board visualization with central watermark overlay */}
          <div className="relative">
            <ChessBoardVisualization 
              board={simulation.board} 
              size={boardSize}
            />
            
            {/* Corner watermark - hidden in preview, shown only in free downloads */}
            <div 
              ref={watermarkRef}
              className="absolute bottom-2 right-2 pointer-events-none"
              style={{ display: 'none' }}
            >
              <div 
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  darkMode 
                    ? 'bg-black/80 border border-stone-600' 
                    : 'bg-white/90 border border-stone-300'
                }`}
                style={{ backdropFilter: 'blur(4px)' }}
              >
                {/* Logo */}
                <img 
                  src={enPensentLogo} 
                  alt="En Pensent" 
                  className="w-8 h-8 object-contain"
                  crossOrigin="anonymous"
                />
                
                {/* Brand text and QR */}
                <div className="flex flex-col items-start">
                  <span 
                    className={`text-[9px] tracking-[0.15em] uppercase font-bold ${
                      darkMode ? 'text-stone-200' : 'text-stone-700'
                    }`}
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    En Pensent
                  </span>
                  <span 
                    className={`text-[7px] tracking-wide ${
                      darkMode ? 'text-stone-400' : 'text-stone-500'
                    }`}
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    enpensent.com
                  </span>
                </div>
                
                {/* QR Code */}
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Scan to visit" 
                    className="w-10 h-10"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            </div>
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
        
        {/* Save to Gallery button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleSaveToGallery}
            disabled={isDownloading || isSaving || isSaved}
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
