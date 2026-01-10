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
    if (!printRef.current) {
      console.error('Print ref not available');
      return null;
    }
    
    try {
      // Ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Extra time for rendering to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Starting html2canvas capture...');
      
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
      
      console.log('Canvas captured, size:', canvas.width, 'x', canvas.height);
      
      // Add watermark if needed
      if (withWatermark) {
        await addWatermark(canvas);
      }
      
      return canvas;
    } catch (error) {
      console.error('html2canvas capture failed:', error);
      throw error;
    }
  };
  
  // Add watermark to canvas - simple and reliable
  const addWatermark = async (canvas: HTMLCanvasElement): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('WATERMARK: Failed to get canvas context');
      return;
    }
    
    console.log('WATERMARK: Starting watermark, canvas size:', canvas.width, 'x', canvas.height);
    
    // Simple fixed-size watermark relative to canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Watermark dimensions (proportional to canvas)
    const wmWidth = Math.round(canvasWidth * 0.22);
    const wmHeight = Math.round(wmWidth * 0.28);
    const margin = Math.round(canvasWidth * 0.025);
    
    // Position: bottom-right of the board area (board is roughly top 55% of canvas)
    const boardBottom = Math.round(canvasHeight * 0.52);
    const wmX = canvasWidth - wmWidth - margin - Math.round(canvasWidth * 0.06);
    const wmY = boardBottom - wmHeight - margin;
    
    console.log('WATERMARK: Position calculated:', { wmX, wmY, wmWidth, wmHeight, boardBottom });
    
    // Draw white background with rounded corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    const radius = Math.round(wmHeight * 0.12);
    ctx.moveTo(wmX + radius, wmY);
    ctx.lineTo(wmX + wmWidth - radius, wmY);
    ctx.quadraticCurveTo(wmX + wmWidth, wmY, wmX + wmWidth, wmY + radius);
    ctx.lineTo(wmX + wmWidth, wmY + wmHeight - radius);
    ctx.quadraticCurveTo(wmX + wmWidth, wmY + wmHeight, wmX + wmWidth - radius, wmY + wmHeight);
    ctx.lineTo(wmX + radius, wmY + wmHeight);
    ctx.quadraticCurveTo(wmX, wmY + wmHeight, wmX, wmY + wmHeight - radius);
    ctx.lineTo(wmX, wmY + radius);
    ctx.quadraticCurveTo(wmX, wmY, wmX + radius, wmY);
    ctx.closePath();
    ctx.fill();
    
    console.log('WATERMARK: Background drawn');
    
    // Draw border
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
    ctx.lineWidth = Math.max(1, Math.round(wmHeight * 0.02));
    ctx.stroke();
    
    // Load and draw logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      const logoLoaded = await new Promise<boolean>((resolve) => {
        logoImg.onload = () => {
          console.log('WATERMARK: Logo loaded successfully');
          resolve(true);
        };
        logoImg.onerror = (e) => {
          console.error('WATERMARK: Logo failed to load', e);
          resolve(false);
        };
        logoImg.src = enPensentLogo;
      });
      
      const logoSize = Math.round(wmHeight * 0.7);
      const logoPad = Math.round(wmHeight * 0.15);
      const logoX = wmX + logoPad;
      const logoY = wmY + (wmHeight - logoSize) / 2;
      
      if (logoLoaded) {
        // Clip to circle and draw logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
        console.log('WATERMARK: Logo drawn');
      }
      
      // Draw text
      const textX = logoX + logoSize + logoPad;
      const fontSize1 = Math.round(wmHeight * 0.22);
      const fontSize2 = Math.round(wmHeight * 0.17);
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333333';
      ctx.font = `bold ${fontSize1}px Inter, system-ui, sans-serif`;
      ctx.fillText('EN PENSENT', textX, wmY + wmHeight * 0.38);
      
      ctx.fillStyle = '#666666';
      ctx.font = `${fontSize2}px Inter, system-ui, sans-serif`;
      ctx.fillText('enpensent.com', textX, wmY + wmHeight * 0.66);
      
      console.log('WATERMARK: Text drawn');
      
      // Draw QR code if available
      if (qrCodeDataUrl) {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        const qrLoaded = await new Promise<boolean>((resolve) => {
          qrImg.onload = () => {
            console.log('WATERMARK: QR loaded');
            resolve(true);
          };
          qrImg.onerror = () => {
            console.log('WATERMARK: QR failed');
            resolve(false);
          };
          qrImg.src = qrCodeDataUrl;
        });
        
        if (qrLoaded && qrImg.complete && qrImg.naturalWidth > 0) {
          const qrSize = Math.round(wmHeight * 0.72);
          const qrX = wmX + wmWidth - qrSize - logoPad;
          const qrY = wmY + (wmHeight - qrSize) / 2;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          console.log('WATERMARK: QR drawn');
        }
      }
      
      console.log('WATERMARK: Complete!');
    } catch (e) {
      console.error('WATERMARK: Error in watermark:', e);
      // If logo fails, just draw text watermark
      const fontSize = Math.round(wmHeight * 0.3);
      ctx.fillStyle = '#333333';
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EN PENSENT', wmX + wmWidth/2, wmY + wmHeight/2);
    }
  };
  
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
