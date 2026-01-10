import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SimulationResult } from '@/lib/chess/gameSimulator';
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
    if (!printRef.current) return null;
    
    // Ensure fonts are loaded
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Extra time for rendering to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
          // Force explicit dimensions
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
    
    // Add watermark if needed
    if (withWatermark) {
      await addWatermark(canvas);
    }
    
    return canvas;
  };
  
  // Add watermark to canvas - matching reference design exactly
  const addWatermark = async (canvas: HTMLCanvasElement): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      // Load logo image with timeout
      const logoImg = await Promise.race([
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Logo load failed'));
          img.src = enPensentLogo;
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Logo timeout')), 5000))
      ]);
      
      // Load QR image with timeout (skip if not ready)
      let qrImg: HTMLImageElement | null = null;
      if (qrCodeDataUrl) {
        try {
          qrImg = await Promise.race([
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('QR load failed'));
              img.src = qrCodeDataUrl;
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('QR timeout')), 5000))
          ]);
        } catch {
          console.warn('QR code failed to load, continuing without it');
        }
      }
      
      // Calculate scale factor based on canvas vs original size
      const scaleFactor = canvas.width / printRef.current!.offsetWidth;
      
      // Get the actual board element to find its exact position
      const boardElement = printRef.current!.querySelector('svg');
      if (!boardElement) {
        console.warn('Board element not found');
        return;
      }
      
      const previewRect = printRef.current!.getBoundingClientRect();
      const boardRect = boardElement.getBoundingClientRect();
      
      // Calculate board position relative to preview
      const boardOffsetX = (boardRect.left - previewRect.left) * scaleFactor;
      const boardOffsetY = (boardRect.top - previewRect.top) * scaleFactor;
      const boardWidth = boardRect.width * scaleFactor;
      const boardHeight = boardRect.height * scaleFactor;
      
      // Watermark dimensions - matching reference image proportions
      const wmWidth = 200 * scaleFactor;
      const wmHeight = 56 * scaleFactor;
      const margin = 10 * scaleFactor;
      
      // Position in bottom-right of the chess board
      const wmX = boardOffsetX + boardWidth - wmWidth - margin;
      const wmY = boardOffsetY + boardHeight - wmHeight - margin;
      
      // Background with rounded corners - white with high opacity
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(wmX, wmY, wmWidth, wmHeight, 6 * scaleFactor);
      ctx.fill();
      
      // Subtle border
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.lineWidth = 1 * scaleFactor;
      ctx.stroke();
      
      // Draw logo (circular) - left side
      const logoSize = 40 * scaleFactor;
      const logoX = wmX + 10 * scaleFactor;
      const logoY = wmY + (wmHeight - logoSize) / 2;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
      
      // Brand text - center
      const textX = logoX + logoSize + 10 * scaleFactor;
      const fontSize1 = 12 * scaleFactor;
      const fontSize2 = 10 * scaleFactor;
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333333';
      ctx.font = `700 ${fontSize1}px 'Inter', system-ui, sans-serif`;
      ctx.fillText('EN PENSENT', textX, wmY + wmHeight * 0.38);
      
      ctx.fillStyle = '#666666';
      ctx.font = `400 ${fontSize2}px 'Inter', system-ui, sans-serif`;
      ctx.fillText('enpensent.com', textX, wmY + wmHeight * 0.65);
      
      // QR Code - right side (if loaded)
      if (qrImg) {
        const qrSize = 42 * scaleFactor;
        const qrX = wmX + wmWidth - qrSize - 8 * scaleFactor;
        const qrY = wmY + (wmHeight - qrSize) / 2;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }
    } catch (error) {
      console.error('Watermark failed:', error);
      // Continue without watermark rather than failing the download
    }
  };
  
  // Download handler
  const handleDownload = async (withWatermark: boolean) => {
    setIsDownloading(true);
    try {
      const canvas = await capturePreview(withWatermark);
      if (!canvas) throw new Error('Failed to capture preview');
      
      const link = document.createElement('a');
      const whiteName = simulation.gameData.white?.replace(/\s+/g, '-') || 'chess';
      const blackName = simulation.gameData.black?.replace(/\s+/g, '-') || 'game';
      const modeLabel = darkMode ? 'dark' : 'light';
      const qualityLabel = withWatermark ? 'preview' : 'HD';
      link.download = `EnPensent-${whiteName}-vs-${blackName}-${modeLabel}-${qualityLabel}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
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
          {/* Chess board visualization */}
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
