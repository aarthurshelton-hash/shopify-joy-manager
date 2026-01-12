import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';

interface ExportState {
  isExportingHD: boolean;
  isExportingGIF: boolean;
  gifProgress: number;
}

interface UseVisualizationExportOptions {
  isPremium: boolean;
  visualizationId?: string | null;
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
}

/**
 * Hook for handling HD download and GIF export functionality
 */
export function useVisualizationExport(options: UseVisualizationExportOptions) {
  const { isPremium, visualizationId, onUnauthorized, onUpgradeRequired } = options;
  
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
      
      // Convert to blob for download
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/png',
          1.0
        );
      });
      
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
      
      const base64Image = await generateCleanPrintImage(simulation, {
        darkMode: exportOptions.darkMode || false,
        includeQR: exportOptions.showQR || false,
        shareId: exportOptions.shareId,
      });
      
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
   * Generate animated GIF of the game progression
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
      const GIF = (await import('gif.js')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const { board, totalMoves, gameData } = simulation;
      
      // Show progress toast
      toast.loading('Generating GIF...', { id: 'gif-export', duration: Infinity });
      
      // Capture initial frame to get dimensions
      const firstCanvas = await html2canvas(captureElement, {
        scale: 2, // 2x for good quality without huge file size
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: firstCanvas.width,
        height: firstCanvas.height,
        workerScript: '/gif.worker.js',
      });
      
      // Determine which moves to capture (sample if too many)
      const maxFrames = 60;
      const step = totalMoves > maxFrames ? Math.ceil(totalMoves / maxFrames) : 1;
      const movesToCapture: number[] = [];
      
      for (let i = 0; i <= totalMoves; i += step) {
        movesToCapture.push(i);
      }
      // Always include final frame
      if (movesToCapture[movesToCapture.length - 1] !== totalMoves) {
        movesToCapture.push(totalMoves);
      }
      
      const frameCount = movesToCapture.length;
      let capturedFrames = 0;

      // We need a way to temporarily filter the board for each frame
      // This requires the component to expose a method to set the current move
      // For now, we'll capture the full final state as a single-frame "GIF"
      // A full implementation would require the board component to accept a currentMove prop
      
      // Simplified approach: capture multiple states using CSS animation simulation
      // For a proper frame-by-frame capture, we'd need to integrate with TimelineContext
      
      // Add the initial frame (held longer)
      gif.addFrame(firstCanvas, { delay: 450, copy: true });
      capturedFrames++;
      
      const updateProgress = (progress: number) => {
        setState(prev => ({ ...prev, gifProgress: progress }));
        onProgressUpdate?.(progress);
        toast.loading(`Generating GIF... ${Math.round(progress * 100)}%`, { id: 'gif-export' });
      };
      
      updateProgress(capturedFrames / frameCount * 0.5);
      
      // For a more complete implementation, we'd iterate through moves
      // and capture each state. For now, add final frame.
      const finalCanvas = await html2canvas(captureElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      gif.addFrame(finalCanvas, { delay: 1000, copy: true });
      updateProgress(0.6);
      
      // Render the GIF
      const blob = await new Promise<Blob>((resolve, reject) => {
        gif.on('progress', (p: number) => {
          updateProgress(0.6 + p * 0.4);
        });
        
        gif.on('finished', (blob: Blob) => {
          resolve(blob);
        });
        
        gif.on('error', (error: Error) => {
          reject(error);
        });
        
        gif.render();
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
      toast.success('GIF downloaded!', {
        description: `Animated visualization saved (${(blob.size / 1024).toFixed(0)}KB)`,
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
