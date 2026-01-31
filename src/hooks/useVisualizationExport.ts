import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';
import { watermarkBase64Image } from '@/lib/chess/invisibleWatermark';
import { checkRateLimit, getAnonymousIdentifier, RATE_LIMITS } from '@/lib/rateLimit';

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
    lockedSquares?: Array<{ square: string; pieces: Array<{ pieceType: string; pieceColor: string }> }>;
    compareMode: boolean;
  };
  piecesState?: {
    showPieces: boolean;
    pieceOpacity: number;
  };
  pgn?: string; // Explicit PGN for piece position calculation
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
   * Download HD image of the visualization - SIMPLIFIED for reliability
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
      
      // Get element dimensions for proper capture
      const rect = captureElement.getBoundingClientRect();
      const width = Math.max(rect.width, 800);
      const height = Math.max(rect.height, 800);
      
      // Capture with reasonable resolution (3x is good for HD, 5x can cause memory issues)
      const canvas = await html2canvas(captureElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: darkMode ? '#0A0A0A' : '#FFFFFF',
        width,
        height,
        onclone: (clonedDoc) => {
          // Ensure SVGs render correctly
          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.style.overflow = 'visible';
            // Force SVG sizing
            if (!svg.getAttribute('width')) {
              svg.setAttribute('width', '400');
            }
            if (!svg.getAttribute('height')) {
              svg.setAttribute('height', '400');
            }
          });
        },
      });
      
      // Simple blob download - most reliable approach
      const downloadSuccess = await new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            resolve(false);
            return;
          }
          
          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_en_pensent_hd.png`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup after a delay
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve(true);
          } catch (err) {
            console.error('Download link failed:', err);
            resolve(false);
          }
        }, 'image/png', 0.95);
      });
      
      if (!downloadSuccess) {
        throw new Error('Blob download failed');
      }
      
      // Record the download interaction
      if (visualizationId) {
        recordVisionInteraction(visualizationId, 'download_hd');
      }
      
      toast.success('HD image downloaded!');
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

    // Check rate limit for downloads
    const identifier = getAnonymousIdentifier();
    const rateLimitResult = await checkRateLimit(identifier, 'download', RATE_LIMITS.download.maxRequests, RATE_LIMITS.download.windowSeconds);
    if (!rateLimitResult.allowed) {
      toast.error(`Too many downloads. Please wait ${rateLimitResult.retry_after} seconds.`);
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
        pgn: exportOptions.pgn || exportOptions.gameData.pgn, // Pass explicit PGN for pieces
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
      
      // Use cross-browser download utility for Safari compatibility
      const { downloadFromBase64, isSafari, openInNewTab } = await import('@/lib/utils/downloadUtils');
      const filename = `${exportOptions.title.replace(/\s+/g, '-').toLowerCase()}-hd.png`;
      
      const success = await downloadFromBase64(base64Image, filename);
      
      if (!success) {
        // Fallback: open in new tab for manual save
        if (isSafari()) {
          openInNewTab(base64Image);
          toast.info('Image opened in new tab', {
            description: 'Right-click or long-press to save the image.',
          });
          return true;
        }
        throw new Error('Download failed');
      }
      
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
    onProgressUpdate?: (progress: number) => void,
    piecesState?: { showPieces: boolean; pieceOpacity: number }
  ): Promise<boolean> => {
    if (!isPremium) {
      onUpgradeRequired?.();
      return false;
    }

    // Check rate limit for downloads
    const identifier = getAnonymousIdentifier();
    const rateLimitResult = await checkRateLimit(identifier, 'download', RATE_LIMITS.download.maxRequests, RATE_LIMITS.download.windowSeconds);
    if (!rateLimitResult.allowed) {
      toast.error(`Too many downloads. Please wait ${rateLimitResult.retry_after} seconds.`);
      return false;
    }

    // Validate simulation data before starting
    if (!simulation || !simulation.board || simulation.totalMoves === undefined) {
      toast.error('Invalid visualization data', {
        description: 'Cannot generate GIF from current visualization.',
      });
      return false;
    }

    if (simulation.totalMoves === 0) {
      toast.error('No moves to animate', {
        description: 'This visualization has no moves to create a GIF from.',
      });
      return false;
    }

    setState(prev => ({ ...prev, isExportingGIF: true, gifProgress: 0 }));
    
    try {
      // Import the frame-by-frame GIF generator
      const { generateAnimatedGif } = await import('@/lib/chess/gifFrameRenderer');
      
      // Show progress toast
      const toastId = 'gif-export';
      toast.loading('Generating animated GIF...', { id: toastId, duration: Infinity });
      
      const updateProgress = (progress: number, message: string) => {
        setState(prev => ({ ...prev, gifProgress: progress }));
        onProgressUpdate?.(progress);
        toast.loading(`${message} (${Math.round(progress * 100)}%)`, { id: toastId });
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
        onProgress: updateProgress,
        showPieces: piecesState?.showPieces || false,
        pieceOpacity: piecesState?.pieceOpacity || 0.7,
      });
      
      // Validate blob was created
      if (!blob || blob.size === 0) {
        throw new Error('Generated GIF is empty');
      }
      
      // Download the GIF using cross-browser utility
      const { downloadFromBlob, isSafari, isIOS } = await import('@/lib/utils/downloadUtils');
      const filename = `${title.replace(/\s+/g, '-').toLowerCase()}.gif`;
      
      const success = await downloadFromBlob(blob, filename);
      
      if (!success && (isSafari() || isIOS())) {
        // For Safari/iOS, convert to data URL and open in new tab
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`
              <html><head><title>Save GIF</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;">
                <div style="text-align:center;">
                  <p style="color:white;font-family:system-ui;margin-bottom:20px;">Right-click or long-press to save</p>
                  <img src="${dataUrl}" style="max-width:100%;max-height:90vh;" />
                </div>
              </body></html>
            `);
            newWindow.document.close();
          }
        };
        reader.readAsDataURL(blob);
        
        toast.info('GIF opened in new tab', {
          description: 'Right-click or long-press to save the image.',
        });
        return true;
      }
      
      // Record the download interaction
      if (visualizationId) {
        recordVisionInteraction(visualizationId, 'download_gif');
      }
      
      toast.dismiss(toastId);
      toast.success('Animated GIF downloaded!', {
        description: `${simulation.totalMoves} moves captured (${(blob.size / 1024).toFixed(0)}KB)`,
      });
      
      return true;
    } catch (error) {
      console.error('GIF export failed:', error);
      toast.dismiss('gif-export');
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let description = 'Please try again or use HD download instead.';
      
      if (errorMessage.includes('worker')) {
        description = 'GIF encoder failed to initialize. Try refreshing the page.';
      } else if (errorMessage.includes('timeout')) {
        description = 'GIF generation took too long. Try with a shorter game.';
      } else if (errorMessage.includes('frame')) {
        description = 'Failed to capture visualization frames.';
      }
      
      toast.error('GIF generation failed', { description });
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
