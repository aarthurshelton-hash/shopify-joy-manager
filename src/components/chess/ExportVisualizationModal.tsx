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
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MoveHistoryEntry, EnPensentOverlay } from './EnPensentOverlay';
import { PieceType } from '@/lib/chess/pieceColors';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import QRCode from 'qrcode';

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
}) => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const exportRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

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

  const handleDownload = async (withWatermark: boolean) => {
    if (!exportRef.current) return;
    
    setIsDownloading(true);
    
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
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const filename = `EnPensent-${gameInfo.white}-vs-${gameInfo.black}-${darkMode ? 'dark' : 'light'}${withWatermark ? '-preview' : '-HD'}.png`;
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
      
      toast.success(withWatermark ? 'Preview downloaded!' : 'HD image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOrderPrint = () => {
    // Set order data with En Pensent visualization
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

        {/* Visualization Preview */}
        <div className="flex justify-center py-4">
          <div 
            ref={exportRef}
            className={`p-6 rounded-sm border shadow-xl transition-colors ${
              darkMode 
                ? 'bg-[#0A0A0A] border-stone-800' 
                : 'bg-[#FDFCFB] border-stone-200'
            }`}
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

            {/* Game Info */}
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-display ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    {gameInfo.white} vs {gameInfo.black}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {gameInfo.totalMoves} moves • {gameInfo.result || 'Game Finished'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <img src={enPensentLogo} alt="En Pensent" className="w-6 h-6 rounded-full" />
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR" className="w-6 h-6 opacity-60" />
                  )}
                </div>
              </div>
            </div>

            {/* Branding */}
            <p 
              className={`text-center text-[8px] tracking-[0.3em] uppercase mt-3 ${
                darkMode ? 'text-stone-600' : 'text-stone-400'
              }`}
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
              onClick={() => handleDownload(true)}
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
              onClick={() => handleDownload(false)}
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
    </Dialog>
  );
};

export default ExportVisualizationModal;
