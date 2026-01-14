import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';
import { watermarkBase64Image } from '@/lib/chess/invisibleWatermark';

interface ExportState {
  isExportingHD: boolean;
  isExportingGIF: boolean;
  gifProgress: number;
}

interface UseVisualizationExportOptions {
  isPremium: boolean;
  visualizationId?: string | null;
  userId?: string | null;
  onUnauthorized?: () => void;
  onUpgradeRequired?: () => void;
}

interface TrademarkExportOptions {
  board: SquareData[][];
  gameData: GameData;
  title: string;
  darkMode?: boolean;
  showQR?: boolean;
  shareId?: string;
  currentMoveNumber?: number;
  highlightState?: {
    lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
    compareMode: boolean;
  };
  piecesState?: {
    showPieces: boolean;
    pieceOpacity: number;
  };
}

/**
 * Hook for handling HD download and GIF export functionality
 */
export function useVisualizationExport(options: UseVisualizationExportOptions) {
  const { isPremium, visualizationId, userId, onUnauthorized, onUpgradeRequired } = options;
  
  const [state, setState] = useState<ExportState>({
    isExportingHD: false,
    isExportingGIF: false,
    gifProgress: 0,
  });
  
  const boardRef = useRef<HTMLDivElement>(null);

  /**
   * Download HD image of the visualization
   */
  const downloadHD = useCallback(async (
    captureElement: HTMLElement,
    title: string,
    darkMode: boolean = false
  ): Promise<boolean> => {
    if (!isPremium) {
      onUpgradeRequired?.();
      return false;
    }

    setState(prev => ({ ...prev, isExportingHD: true }));
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture with high resolution
      const canvas = await html2canvas(captureElement, {
        scale: 5, // 5x for print-quality resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
        // Ensure SVGs render correctly
        onclone: (clonedDoc) => {
          // Force any fonts to load
          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.style.overflow = 'visible';
          });
        },
      });
      
      // Convert to base64 first for watermarking
      let base64Image = canvas.toDataURL('image/png', 1.0);
      
      // Apply invisible watermark with ownership data
      if (visualizationId && userId) {
        try {
          base64Image = await watermarkBase64Image(base64Image, {
            visualizationId,
            userId,
            timestamp: Date.now(),
          });
        } catch (wmError) {
          console.warn('Failed to apply watermark:', wmError);
          // Continue without watermark
        }
      }
      
      // Convert base64 to blob for download
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-hd.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Record the download interaction
      if (visualizationId) {
        recordVisionInteraction(visualizationId, 'download_hd');
      }
      
      toast.success('HD image downloaded!', {
        description: 'Your visualization has been saved to your device.',
      });
      
      return true;
    } catch (error) {
      console.error('HD export failed:', error);
      toast.error('Download failed', {
        description: 'Please try again or use a different browser.',
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isExportingHD: false }));
    }
  }, [isPremium, visualizationId, onUpgradeRequired]);

  /**
   * Download HD image with the "trademark look" - proper PrintReadyVisualization rendering
   * This ensures the export matches the print product exactly
   */
  const downloadTrademarkHD = useCallback(async (
    exportOptions: TrademarkExportOptions
  ): Promise<boolean> => {
    if (!isPremium) {
      onUpgradeRequired?.();
      return false;
    }

    setState(prev => ({ ...prev, isExportingHD: true }));
    
    try {
      // Use the print image generator which renders PrintReadyVisualization
      const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
      
      // Create a simulation result from the board data
      const simulation: SimulationResult = {
        board: exportOptions.board,
        gameData: exportOptions.gameData,
        totalMoves: exportOptions.gameData.moves?.length || 0,
      };
      
      // Build captured state for print generator
      const capturedState = {
        currentMove: exportOptions.currentMoveNumber ?? Infinity,
        selectedPhase: 'all' as const,
        lockedPieces: exportOptions.highlightState?.lockedPieces || [],
        compareMode: exportOptions.highlightState?.compareMode || false,
        displayMode: 'art' as const,
        darkMode: exportOptions.darkMode || false,
        showTerritory: false,
        showHeatmaps: false,
        showPieces: exportOptions.piecesState?.showPieces || false,
        pieceOpacity: exportOptions.piecesState?.pieceOpacity || 0.7,
        capturedAt: new Date(),
      };
      
      let base64Image = await generateCleanPrintImage(simulation, {
        darkMode: exportOptions.darkMode || false,
        includeQR: exportOptions.showQR || false,
        shareId: exportOptions.shareId,
        capturedState,
        highlightState: exportOptions.highlightState ? {
          lockedPieces: exportOptions.highlightState.lockedPieces.map(p => ({
            pieceType: p.pieceType as 'k' | 'q' | 'r' | 'b' | 'n' | 'p',
            // Map 'white'/'black' to 'w'/'b' if needed
            pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
          })),
          compareMode: exportOptions.highlightState.compareMode,
        } : undefined,
      });
      
      // Apply invisible watermark with ownership data
      if (visualizationId && userId) {
        try {
          base64Image = await watermarkBase64Image(base64Image, {
            visualizationId,
            userId,
            timestamp: Date.now(),
            shareId: exportOptions.shareId,
          });
        } catch (wmError) {
          console.warn('Failed to apply watermark:', wmError);
          // Continue without watermark
        }
      }
      
      // Convert base64 to blob for download
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportOptions.title.replace(/\s+/g, '-').toLowerCase()}-hd.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Record the download interaction
      if (visualizationId) {
        recordVisionInteraction(visualizationId, 'download_hd');
      }
      
      toast.success('HD image downloaded!', {
        description: 'Your trademark visualization has been saved.',
      });
      
      return true;
    } catch (error) {
      console.error('Trademark HD export failed:', error);
      toast.error('Download failed', {
        description: 'Please try again or use a different browser.',
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isExportingHD: false }));
    }
  }, [isPremium, visualizationId, onUpgradeRequired]);

  /**
   * Generate animated GIF of the game progression - frame-by-frame capture
   * Each frame represents a move state from the timeline
   */
  const downloadGIF = useCallback(async (
    simulation: SimulationResult,
    captureElement: HTMLElement,
    title: string,
    onProgressUpdate?: (progress: number) => void
  ): Promise<boolean> => {
    if (!isPremium) {
      onUpgradeRequired?.();
      return false;
    }

    setState(prev => ({ ...prev, isExportingGIF: true, gifProgress: 0 }));
    
    try {
      // Import the frame-by-frame GIF generator
      const { generateAnimatedGif } = await import('@/lib/chess/gifFrameRenderer');
      
      // Show progress toast
      toast.loading('Generating animated GIF...', { id: 'gif-export', duration: Infinity });
      
      const updateProgress = (progress: number, message: string) => {
        setState(prev => ({ ...prev, gifProgress: progress }));
        onProgressUpdate?.(progress);
        toast.loading(`${message} (${Math.round(progress * 100)}%)`, { id: 'gif-export' });
      };
      
      // Generate the GIF with frame-by-frame capture
      const blob = await generateAnimatedGif({
        simulation,
        size: 400,
        darkMode: false,
        showCoordinates: true,
        frameDelay: 150,
        quality: 10,
        maxFrames: 60,
        onProgress: updateProgress
      });
      
      // Download the GIF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Record the download interaction
      if (visualizationId) {
        recordVisionInteraction(visualizationId, 'download_gif');
      }
      
      toast.dismiss('gif-export');
      toast.success('Animated GIF downloaded!', {
        description: `${simulation.totalMoves} moves captured (${(blob.size / 1024).toFixed(0)}KB)`,
      });
      
      return true;
    } catch (error) {
      console.error('GIF export failed:', error);
      toast.dismiss('gif-export');
      toast.error('GIF generation failed', {
        description: 'Please try again or use HD download instead.',
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isExportingGIF: false, gifProgress: 0 }));
    }
  }, [isPremium, visualizationId, onUpgradeRequired]);

  return {
    ...state,
    boardRef,
    downloadHD,
    downloadTrademarkHD,
    downloadGIF,
  };
}
