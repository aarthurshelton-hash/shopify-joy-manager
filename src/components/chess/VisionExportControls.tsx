/**
 * VisionExportControls - Bulletproof export UI component
 * 
 * Unified controls for all Vision export operations:
 * - Download preview (free, watermarked)
 * - Download HD (premium, no watermark)
 * - Download GIF (premium)
 * - Order Print (all users)
 * - Share Link (all users)
 * 
 * WYSIWYG guaranteed: exports exactly what user sees
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Crown,
  Printer,
  Share2,
  Loader2,
  Film,
} from 'lucide-react';
import { useVisionExport } from '@/hooks/useVisionExport';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface VisionExportControlsProps {
  // Game metadata
  title: string;
  gameData: {
    white: string;
    black: string;
    event?: string;
    date?: string;
    result?: string;
  };
  
  // Game data
  pgn?: string;
  totalMoves: number;
  
  // Optional IDs
  visualizationId?: string;
  shareId?: string | null;
  
  // Premium status
  isPremium?: boolean;
  onUpgradePrompt?: () => void;
  
  // Display options
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  
  // Ref for board element (for export capture)
  boardRef?: React.RefObject<HTMLDivElement>;
}

export const VisionExportControls = forwardRef<HTMLDivElement, VisionExportControlsProps>(
  (
    {
      title,
      gameData,
      pgn,
      totalMoves,
      visualizationId,
      shareId,
      isPremium = false,
      onUpgradePrompt,
      compact = false,
      showLabels = true,
      className = '',
    },
    ref
  ) => {
    const {
      boardRef,
      isExporting,
      downloadPreview,
      downloadHD,
      downloadGIF,
      orderPrint,
      shareVision,
    } = useVisionExport({
      title,
      gameData,
      pgn,
      totalMoves,
      visualizationId,
      shareId,
      isPremium,
      onUpgradePrompt,
    });

    const buttonSize = compact ? 'sm' : 'default';
    const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';
    const gap = compact ? 'gap-1' : 'gap-2';

    return (
      <div ref={ref} className={`flex flex-wrap items-center ${gap} ${className}`}>
        {/* Hidden board ref target - will be set by parent */}
        <div ref={boardRef} className="hidden" />

        {/* Preview Download - Free */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={buttonSize}
                className={gap}
                onClick={downloadPreview}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className={`${iconSize} animate-spin`} />
                ) : (
                  <Download className={iconSize} />
                )}
                {showLabels && 'Preview'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download preview image (free, with branding)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* HD Download - Premium */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={buttonSize}
                className={gap}
                onClick={downloadHD}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className={`${iconSize} animate-spin`} />
                ) : (
                  <Download className={iconSize} />
                )}
                {showLabels && 'HD'}
                {!isPremium && <Crown className={`${iconSize} text-primary`} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPremium
                ? 'Download high-resolution image'
                : 'Premium: Download HD image without watermark'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* GIF Download - Premium */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={buttonSize}
                className={gap}
                onClick={downloadGIF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className={`${iconSize} animate-spin`} />
                ) : (
                  <Film className={iconSize} />
                )}
                {showLabels && 'GIF'}
                {!isPremium && <Crown className={`${iconSize} text-primary`} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPremium
                ? 'Download animated GIF'
                : 'Premium: Download animated visualization'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Order Print - All Users */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="default"
                  size={buttonSize}
                  className={`${gap} bg-gradient-to-r from-amber-500/80 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-stone-900`}
                  onClick={orderPrint}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className={`${iconSize} animate-spin`} />
                  ) : (
                    <Printer className={iconSize} />
                  )}
                  {showLabels && 'Order Print'}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Order a physical print of your Vision</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Share - All Users */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={buttonSize}
                className={gap}
                onClick={shareVision}
              >
                <Share2 className={iconSize} />
                {showLabels && 'Share'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy shareable link with your exact view</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

VisionExportControls.displayName = 'VisionExportControls';

export default VisionExportControls;
