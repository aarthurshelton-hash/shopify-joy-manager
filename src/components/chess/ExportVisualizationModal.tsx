import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Loader2, 
  Sun, 
  Moon, 
  Printer, 
  Sparkles,
  Bookmark,
  Check,
  Crown,
  Camera,
  Copy,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MoveHistoryEntry, EnPensentOverlay } from './EnPensentOverlay';
import { PieceType } from '@/lib/chess/pieceColors';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { useSessionStore } from '@/stores/sessionStore';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import QRCode from 'qrcode';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';
import { VisionaryMembershipCard } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { getBoardPositionFen, STARTING_FEN } from '@/lib/chess/fenUtils';

interface ExportVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  moveHistory: MoveHistoryEntry[];
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
  gameInfo: {
    white: string;
    black: string;
    result?: string;
    totalMoves: number;
  };
  visualizationId?: string; // For tracking downloads
  pgn?: string; // For FEN export
}

/**
 * Modal for exporting the final En Pensent visualization after a game
 */
export const ExportVisualizationModal: React.FC<ExportVisualizationModalProps> = ({
  isOpen,
  onClose,
  moveHistory,
  whitePalette,
  blackPalette,
  gameInfo,
  visualizationId,
  pgn,
}) => {
  const navigate = useNavigate();
  const { user, isPremium, isCheckingSubscription } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const { captureState, darkMode: storeDarkMode, setDarkMode: setStoreDarkMode } = useVisualizationStateStore();
  const { setCapturedTimelineState, setReturningFromOrder } = useSessionStore();
  const exportRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync dark mode with store
  useEffect(() => {
    setStoreDarkMode(darkMode);
  }, [darkMode, setStoreDarkMode]);

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL('https://enpensent.com', {
          width: 80,
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
    if (isOpen) generateQR();
  }, [isOpen]);

  const handleDownload = async (isHD: boolean) => {
    // HD downloads require premium
    if (isHD && !isPremium) {
      setShowVisionaryModal(true);
      return;
    }
    
    if (!exportRef.current) return;
    
    setIsDownloading(true);
    
    // Determine if watermark should be applied
    // Apply watermark for: non-premium users, during subscription check, or for preview downloads
    const shouldWatermark = !isHD && (!isPremium || isCheckingSubscription);
    
    try {
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        logging: false,
      });
      
      // Apply watermark for non-premium preview downloads
      if (shouldWatermark) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw watermark text diagonally across the image
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = darkMode ? '#FFFFFF' : '#000000';
          ctx.font = 'bold 32px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Rotate and position watermark
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(-Math.PI / 6); // -30 degrees
          
          // Draw multiple lines of watermark
          ctx.fillText('EN PENSENT', 0, -40);
          ctx.fillText('enpensent.com', 0, 20);
          
          ctx.restore();
          
          // Add corner branding
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = darkMode ? '#FFFFFF' : '#000000';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('enpensent.com', canvas.width - 20, canvas.height - 20);
        }
      }
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const filename = `EnPensent-${gameInfo.white}-vs-${gameInfo.black}-${darkMode ? 'dark' : 'light'}${isHD ? '-HD' : '-preview'}.png`;
      
      // More reliable download approach - convert to blob and use URL.createObjectURL
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      toast.success(isHD ? 'HD image downloaded!' : 'Preview downloaded!', {
        description: shouldWatermark ? 'Includes En Pensent branding.' : undefined,
      });
      
      // Track HD download for vision scoring (only for HD, not preview)
      if (isHD && visualizationId) {
        recordVisionInteraction(visualizationId, 'download_hd');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOrderPrint = () => {
    // Capture current visualization state for the print
    const capturedVisualizationState = captureState(moveHistory);
    
    // Save timeline state for restoration on return
    const title = `${gameInfo.white} vs ${gameInfo.black}`;
    setCapturedTimelineState({
      currentMove: capturedVisualizationState.currentMove,
      totalMoves: moveHistory.length,
      title,
      lockedPieces: capturedVisualizationState.lockedPieces,
      compareMode: capturedVisualizationState.compareMode,
      darkMode,
    });
    setReturningFromOrder(true);
    
    // Set order data with En Pensent visualization and captured state
    setOrderData({
      title: `${gameInfo.white} vs ${gameInfo.black}`,
      gameData: {
        white: gameInfo.white,
        black: gameInfo.black,
        result: gameInfo.result,
      },
      moveHistory,
      whitePalette,
      blackPalette,
      capturedState: {
        ...capturedVisualizationState,
        darkMode, // Use current modal dark mode setting
      },
      returnPath: window.location.pathname,
    });
    
    toast.success('Board state captured for print!', {
      description: 'Your exact visualization settings will be preserved.',
      icon: <Camera className="w-4 h-4" />,
    });
    
    onClose();
    navigate('/order-print');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Export En Pensent Visualization
          </DialogTitle>
          <DialogDescription>
            Your game has been transformed into a unique piece of chess art. Download or order a print!
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 py-2">
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

        {/* Visualization Preview - The Trademark Look - matches PrintPreview exactly */}
        <div className="flex justify-center py-4">
          <div 
            ref={exportRef}
            className={`p-6 md:p-8 rounded-sm border shadow-2xl transition-colors ${
              darkMode 
                ? 'bg-[#0A0A0A] border-stone-800' 
                : 'bg-[#FDFCFB] border-stone-200'
            }`}
            style={{ maxWidth: '420px' }}
          >
            {/* The En Pensent board visualization */}
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {/* Chess board grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={i}
                      className={`${isLight ? 'bg-stone-200' : 'bg-stone-600'}`}
                    />
                  );
                })}
              </div>
              
              {/* En Pensent Overlay */}
              <EnPensentOverlay
                moveHistory={moveHistory}
                whitePalette={whitePalette}
                blackPalette={blackPalette}
                opacity={0.85}
                isEnabled={true}
                flipped={false}
              />
            </div>

            {/* Game Info - Trademark Style matching PrintPreview exactly */}
            <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
              <div className="text-center max-w-md mx-auto space-y-3">
                {/* Player Names - Cinzel inspired, elegant serif */}
                <h1 
                  className={`text-xl md:text-2xl font-semibold tracking-wide ${
                    darkMode ? 'text-stone-100' : 'text-stone-800'
                  }`}
                  style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
                >
                  <span>{gameInfo.white}</span>
                  <span 
                    className={`mx-2 font-normal italic text-lg ${
                      darkMode ? 'text-stone-500' : 'text-stone-400'
                    }`} 
                    style={{ fontFamily: "'Cormorant', Georgia, serif" }}
                  >
                    vs
                  </span>
                  <span>{gameInfo.black}</span>
                </h1>
                
                {/* Event Name - Elegant italic serif */}
                <h2 
                  className={`text-sm md:text-base italic ${
                    darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`}
                  style={{ fontFamily: "'Cormorant', Georgia, serif" }}
                >
                  Chess Game
                </h2>
                
                {/* Title and Date - Clean sans-serif */}
                <p 
                  className={`text-xs uppercase tracking-[0.15em] ${
                    darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {gameInfo.totalMoves} moves • {gameInfo.result || 'Game Finished'}
                </p>
              </div>
            </div>

            {/* Subtle branding - visible in preview */}
            <p 
              className={`text-center mt-4 text-[10px] tracking-[0.3em] uppercase font-medium ${
                darkMode ? 'text-stone-500' : 'text-stone-400'
              }`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              ♔ En Pensent ♚
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Download Row */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => handleDownload(false)}
              disabled={isDownloading}
              variant="outline"
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Preview
            </Button>
            
            <Button
              onClick={() => handleDownload(true)}
              disabled={isDownloading}
              className="gap-2 btn-luxury"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPremium ? (
                <Download className="h-4 w-4" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {isPremium ? 'Download HD' : 'HD Download'}
              {!isPremium && <span className="text-xs opacity-75">Premium</span>}
            </Button>
          </div>

          {/* FEN Export Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => {
                const fen = pgn ? getBoardPositionFen(pgn, gameInfo.totalMoves) : STARTING_FEN;
                navigator.clipboard.writeText(fen);
                toast.success('FEN copied to clipboard!', {
                  description: 'You can paste this position in any chess software.',
                });
              }}
            >
              <FileText className="h-3 w-3" />
              Copy Final Position (FEN)
            </Button>
          </div>

          {/* Order Print CTA */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleOrderPrint}
              className="relative overflow-hidden gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-900 font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              />
              <Printer className="h-4 w-4 relative z-10" />
              <span className="relative z-10 font-display tracking-wide">Order Premium Print</span>
            </Button>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground">
            Turn this visualization into museum-quality wall art
          </p>
        </div>
      </DialogContent>
      
      {/* Visionary Membership Modal for HD Download upsell */}
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={() => {
          setShowVisionaryModal(false);
          setShowAuthModal(true);
        }}
        trigger="download"
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </Dialog>
  );
};

export default ExportVisualizationModal;
