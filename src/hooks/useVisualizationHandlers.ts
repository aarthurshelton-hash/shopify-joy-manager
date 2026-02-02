import { useCallback } from 'react';
import { toast } from 'sonner';
import { generateCleanPrintImage } from '@/lib/chess/printImageGenerator';
import type { ExportState } from '@/components/chess/UnifiedVisionExperience';
import { SimulationResult, SquareData, GameData } from '@/lib/chess/gameSimulator';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import type { PieceType } from '@/lib/chess/pieceColors';

interface VisualizationData {
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  pgn: string;
  title?: string;
  visualizationId?: string;
  paletteId?: string;
  shareId?: string;
}

interface UseVisualizationHandlersOptions {
  visualizationData: VisualizationData;
  isPremium: boolean;
  isCheckingSubscription: boolean;
  onUpgradePrompt: () => void;
  onSaveToGallery?: () => Promise<string | null>;
  setOrderData?: (data: unknown) => void;
  navigate?: (path: string) => void;
}

interface UseVisualizationHandlersReturn {
  handleExport: (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => Promise<void>;
  handleShare: () => Promise<void>;
  handleSaveToGallery: () => Promise<string | null>;
}

export function useVisualizationHandlers({
  visualizationData,
  isPremium,
  isCheckingSubscription,
  onUpgradePrompt,
  onSaveToGallery,
  setOrderData,
  navigate,
}: UseVisualizationHandlersOptions): UseVisualizationHandlersReturn {
  const { board, gameData, totalMoves, pgn, title, visualizationId, paletteId, shareId } = visualizationData;

  const handleExport = useCallback(async (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => {
    if (!board || !gameData) return;

    // Build filtered board based on export state
    const filteredBoard = exportState && exportState.currentMove < totalMoves && exportState.currentMove > 0
      ? board.map(row => 
          row.map(square => ({
            ...square,
            visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove)
          }))
        )
      : board;

    // Build highlight state for rendering
    const highlightState = exportState?.lockedPieces && exportState.lockedPieces.length > 0 ? {
      lockedPieces: exportState.lockedPieces.map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
      })),
      compareMode: exportState.compareMode,
    } : undefined;

    const exportSimulation: SimulationResult = {
      board: filteredBoard,
      gameData,
      totalMoves,
    };

    switch (type) {
      case 'preview': {
        try {
          const shouldWatermark = !isPremium || isCheckingSubscription;
          const base64Image = await generateCleanPrintImage(exportSimulation, {
            darkMode: exportState?.darkMode || false,
            withWatermark: shouldWatermark,
            highlightState,
            pgn,
            capturedState: exportState ? {
              currentMove: exportState.currentMove,
              selectedPhase: 'all',
              lockedPieces: exportState.lockedPieces || [],
              compareMode: exportState.compareMode,
              displayMode: 'art',
              darkMode: exportState.darkMode,
              showTerritory: false,
              showHeatmaps: false,
              showPieces: exportState.showPieces,
              pieceOpacity: exportState.pieceOpacity,
              capturedAt: new Date(),
            } : undefined,
          });

          const response = await fetch(base64Image);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title || 'chess-visualization'}-preview.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('Preview downloaded!');
        } catch (error) {
          console.error('Preview export failed:', error);
          toast.error('Failed to generate preview');
        }
        break;
      }

      case 'hd': {
        if (!isPremium) {
          onUpgradePrompt();
          return;
        }

        try {
          const base64Image = await generateCleanPrintImage(exportSimulation, {
            darkMode: exportState?.darkMode || false,
            withWatermark: false,
            highlightState,
            pgn,
            capturedState: exportState ? {
              currentMove: exportState.currentMove,
              selectedPhase: 'all',
              lockedPieces: exportState.lockedPieces || [],
              compareMode: exportState.compareMode,
              displayMode: 'art',
              darkMode: exportState.darkMode,
              showTerritory: false,
              showHeatmaps: false,
              showPieces: exportState.showPieces,
              pieceOpacity: exportState.pieceOpacity,
              capturedAt: new Date(),
            } : undefined,
          });

          const response = await fetch(base64Image);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title || 'chess-visualization'}-HD.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('HD image downloaded!');
        } catch (error) {
          console.error('HD export failed:', error);
          toast.error('Failed to generate HD image');
        }
        break;
      }

      case 'gif': {
        if (!isPremium) {
          onUpgradePrompt();
          return;
        }

        // GIF generation requires DOM element capture - handled by pages directly
        toast.info('GIF generation coming soon in unified handler');
        break;
      }

      case 'print': {
        if (setOrderData && navigate) {
          const currentGameHash = pgn ? generateGameHash(pgn) : undefined;
          
          setOrderData({
            title: title || 'Chess Visualization',
            pgn,
            gameData: {
              white: gameData.white,
              black: gameData.black,
              event: gameData.event,
              date: gameData.date,
              result: gameData.result,
            },
            simulation: exportSimulation,
            shareId: shareId || undefined,
            returnPath: '/',
            gameHash: currentGameHash,
            paletteId: paletteId || 'classic',
            capturedState: exportState ? {
              currentMove: exportState.currentMove,
              selectedPhase: 'all',
              lockedPieces: exportState.lockedPieces,
              compareMode: exportState.compareMode,
              displayMode: 'standard',
              darkMode: exportState.darkMode,
              showTerritory: false,
              showHeatmaps: false,
              showPieces: exportState.showPieces,
              pieceOpacity: exportState.pieceOpacity,
              capturedAt: new Date(),
            } : undefined,
          });
          navigate('/order-print');
        } else {
          toast.error('Print ordering not available in this context');
        }
        break;
      }
    }
  }, [board, gameData, totalMoves, pgn, title, isPremium, isCheckingSubscription, onUpgradePrompt, setOrderData, navigate, shareId, paletteId]);

  const handleShare = useCallback(async () => {
    if (!shareId && !visualizationId) {
      toast.error('Cannot share - no visualization ID available');
      return;
    }

    const shareUrl = `${window.location.origin}/v/${shareId || visualizationId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Chess Visualization',
          text: 'Check out this chess visualization on En Pensent!',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  }, [shareId, visualizationId, title]);

  const handleSaveToGallery = useCallback(async (): Promise<string | null> => {
    if (onSaveToGallery) {
      return await onSaveToGallery();
    }
    toast.error('Save to gallery not available in this context');
    return null;
  }, [onSaveToGallery]);

  return {
    handleExport,
    handleShare,
    handleSaveToGallery,
  };
}
