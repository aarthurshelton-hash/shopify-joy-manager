/**
 * useVisionExport - React hook for bulletproof Vision exports
 * 
 * Provides a unified interface for all export operations:
 * - Download (preview/HD)
 * - Share (link generation)
 * - Print (order preparation)
 * 
 * Guarantees WYSIWYG: What You See Is What You Get
 */

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { validatePremiumDownload } from '@/lib/premium/validatePremiumDownload';
import { useVisualizationStateStore } from '@/stores/visualizationStateStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTimeline } from '@/contexts/TimelineContext';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';
import {
  captureVisionState,
  downloadVisionImage,
  generatePrintPreviewImage,
  preparePrintOrderData,
  createShareableLink,
  validateExportElement,
  findBoardElement,
  VisionState,
  ExportResult,
} from '@/lib/vision/VisionExportService';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface UseVisionExportOptions {
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
}

interface UseVisionExportReturn {
  // Refs
  boardRef: React.RefObject<HTMLDivElement>;
  
  // Export state
  isExporting: boolean;
  exportError: string | null;
  
  // Actions
  downloadPreview: () => Promise<ExportResult>;
  downloadHD: () => Promise<ExportResult>;
  downloadGIF: () => Promise<ExportResult>;
  orderPrint: () => void;
  shareVision: () => Promise<string | null>;
  
  // State capture
  getCurrentState: () => VisionState;
  
  // Utilities
  capturePreviewImage: () => Promise<string | null>;
}

export function useVisionExport(options: UseVisionExportOptions): UseVisionExportReturn {
  const {
    title,
    gameData,
    pgn,
    totalMoves,
    visualizationId,
    shareId,
    isPremium = false,
    onUpgradePrompt,
  } = options;
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const { setCapturedTimelineState, setReturningFromOrder } = useSessionStore();
  const {
    showPieces: storeShowPieces,
    pieceOpacity: storePieceOpacity,
    darkMode: storeDarkMode,
    showTerritory: storeShowTerritory,
    showHeatmaps: storeShowHeatmaps,
  } = useVisualizationStateStore();
  
  // Timeline context (may be null if not in provider)
  let currentMove = totalMoves;
  try {
    const timeline = useTimeline();
    currentMove = timeline.currentMove;
  } catch {
    // Not in TimelineProvider, use totalMoves
  }
  
  // Legend context (may be null if not in provider)
  let lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }> = [];
  let lockedSquares: Array<{ square: string; pieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }> }> = [];
  let compareMode = false;
  try {
    const legend = useLegendHighlight();
    lockedPieces = legend.lockedPieces;
    lockedSquares = legend.lockedSquares;
    compareMode = legend.compareMode;
  } catch {
    // Not in LegendHighlightProvider
  }
  
  const boardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  /**
   * Gets the current vision state from all sources
   */
  const getCurrentState = useCallback((): VisionState => {
    return captureVisionState(
      boardRef.current,
      currentMove,
      totalMoves,
      storeShowPieces,
      storePieceOpacity,
      storeDarkMode,
      lockedPieces,
      compareMode,
      lockedSquares,
      storeShowTerritory,
      storeShowHeatmaps
    );
  }, [
    currentMove,
    totalMoves,
    storeShowPieces,
    storePieceOpacity,
    storeDarkMode,
    lockedPieces,
    compareMode,
    lockedSquares,
    storeShowTerritory,
    storeShowHeatmaps,
  ]);
  
  /**
   * Finds and validates the board element
   */
  const getBoardElement = useCallback((): HTMLElement | null => {
    const element = findBoardElement(boardRef.current);
    if (!element) {
      // Try the ref directly
      if (boardRef.current) {
        const validation = validateExportElement(boardRef.current);
        if (validation.valid) {
          return boardRef.current;
        }
      }
      return null;
    }
    
    const validation = validateExportElement(element);
    if (!validation.valid) {
      console.error('[useVisionExport] Validation failed:', validation.error);
      return null;
    }
    
    return element;
  }, []);
  
  /**
   * Downloads preview image (with watermark for free users)
   */
  const downloadPreview = useCallback(async (): Promise<ExportResult> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const element = getBoardElement();
      if (!element) {
        throw new Error('Board not ready for export');
      }
      
      const result = await downloadVisionImage(element, {
        isHD: false,
        darkMode: storeDarkMode,
        gameTitle: title,
        visualizationId,
        isPremium: false, // Always watermark preview
      });
      
      if (result.success) {
        toast.success('Preview downloaded!', {
          description: 'Includes En Pensent branding',
        });
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      setExportError(message);
      toast.error('Download failed', { description: message });
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
    }
  }, [getBoardElement, storeDarkMode, title, visualizationId]);
  
  /**
   * Downloads HD image (premium only - with server-side validation)
   */
  const downloadHD = useCallback(async (): Promise<ExportResult> => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      // Server-side premium validation for security
      const validation = await validatePremiumDownload();
      
      if (!validation.allowed) {
        onUpgradePrompt?.();
        toast.info('HD downloads require Premium', {
          description: validation.message || 'Upgrade to download without watermarks',
        });
        setIsExporting(false);
        return { success: false, error: 'Premium required' };
      }
      
      const element = getBoardElement();
      if (!element) {
        throw new Error('Board not ready for export');
      }
      
      const result = await downloadVisionImage(element, {
        isHD: true,
        darkMode: storeDarkMode,
        gameTitle: title,
        visualizationId,
        isPremium: true,
      });
      
      if (result.success) {
        toast.success('HD image downloaded!');
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      setExportError(message);
      toast.error('Download failed', { description: message });
      return { success: false, error: message };
    } finally {
      setIsExporting(false);
    }
  }, [onUpgradePrompt, getBoardElement, storeDarkMode, title, visualizationId]);
  
  /**
   * Downloads animated GIF (premium only - with server-side validation)
   */
  const downloadGIF = useCallback(async (): Promise<ExportResult> => {
    setIsExporting(true);
    
    try {
      // Server-side premium validation for security
      const validation = await validatePremiumDownload();
      
      if (!validation.allowed) {
        onUpgradePrompt?.();
        toast.info('GIF exports require Premium', {
          description: validation.message || 'Upgrade to create animated visualizations',
        });
        setIsExporting(false);
        return { success: false, error: 'Premium required' };
      }
      
      // TODO: Implement GIF generation
      toast.info('GIF export coming soon!', {
        description: 'This feature is in development',
      });
      
      return { success: false, error: 'Not implemented' };
    } finally {
      setIsExporting(false);
    }
  }, [onUpgradePrompt]);
  
  /**
   * Prepares and navigates to print order page
   */
  const orderPrint = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const element = getBoardElement();
      const state = getCurrentState();
      
      // Generate preview image for cart
      let previewImageBase64: string | undefined;
      if (element) {
        try {
          previewImageBase64 = await generatePrintPreviewImage(element, storeDarkMode);
        } catch (e) {
          console.warn('[useVisionExport] Preview image generation failed:', e);
        }
      }
      
      // Prepare order data
      const orderData = preparePrintOrderData(
        title,
        gameData,
        state,
        {
          pgn,
          visualizationId,
          shareId,
          previewImageBase64,
          returnPath: window.location.pathname,
        }
      );
      
      // Save timeline state for restoration on return
      setCapturedTimelineState({
        currentMove: state.currentMove,
        totalMoves: state.totalMoves,
        title,
        lockedPieces: state.lockedPieces.map(p => ({
          pieceType: p.pieceType as PieceType,
          pieceColor: p.pieceColor as PieceColor,
        })),
        compareMode: state.compareMode,
        darkMode: state.darkMode,
        showPieces: state.showPieces,
        pieceOpacity: state.pieceOpacity,
      });
      setReturningFromOrder(true);
      
      // Set order data in store
      setOrderData({
        title: orderData.title,
        gameData: orderData.gameData,
        pgn: orderData.pgn,
        visualizationId: orderData.visualizationId,
        shareId: orderData.shareId,
        capturedState: {
          currentMove: orderData.capturedState.currentMove,
          selectedPhase: 'all',
          lockedPieces: orderData.capturedState.lockedPieces.map(p => ({
            pieceType: String(p.pieceType),
            pieceColor: String(p.pieceColor),
          })),
          compareMode: orderData.capturedState.compareMode,
          displayMode: 'art',
          darkMode: orderData.capturedState.darkMode,
          showTerritory: orderData.capturedState.showTerritory ?? false,
          showHeatmaps: orderData.capturedState.showHeatmaps ?? false,
          showPieces: orderData.capturedState.showPieces,
          pieceOpacity: orderData.capturedState.pieceOpacity,
          capturedAt: orderData.capturedState.capturedAt,
        },
        previewImageBase64: orderData.previewImageBase64,
        returnPath: orderData.returnPath,
      });
      
      toast.success('Board state captured for print!', {
        description: 'Your exact visualization settings will be preserved.',
      });
      
      navigate('/order-print');
    } catch (error) {
      console.error('[useVisionExport] Print order preparation failed:', error);
      toast.error('Failed to prepare print order');
    } finally {
      setIsExporting(false);
    }
  }, [
    getBoardElement,
    getCurrentState,
    storeDarkMode,
    title,
    gameData,
    pgn,
    visualizationId,
    shareId,
    setCapturedTimelineState,
    setReturningFromOrder,
    setOrderData,
    navigate,
  ]);
  
  /**
   * Generates shareable link with current state
   */
  const shareVision = useCallback(async (): Promise<string | null> => {
    try {
      const state = getCurrentState();
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = createShareableLink(baseUrl, state);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      toast.success('Link copied to clipboard!', {
        description: 'Share this link to show your exact view',
      });
      
      return shareUrl;
    } catch (error) {
      console.error('[useVisionExport] Share failed:', error);
      toast.error('Failed to copy link');
      return null;
    }
  }, [getCurrentState]);
  
  /**
   * Captures preview image for other purposes (cart, etc.)
   */
  const capturePreviewImage = useCallback(async (): Promise<string | null> => {
    try {
      const element = getBoardElement();
      if (!element) return null;
      
      return await generatePrintPreviewImage(element, storeDarkMode);
    } catch (error) {
      console.error('[useVisionExport] Preview capture failed:', error);
      return null;
    }
  }, [getBoardElement, storeDarkMode]);
  
  return {
    boardRef,
    isExporting,
    exportError,
    downloadPreview,
    downloadHD,
    downloadGIF,
    orderPrint,
    shareVision,
    getCurrentState,
    capturePreviewImage,
  };
}

export default useVisionExport;
