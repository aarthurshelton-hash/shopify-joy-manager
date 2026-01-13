/**
 * Hook for seamless palette switching
 * 
 * Regenerates the board visualization with a new palette without navigation
 * or full page reload. Updates the board colors in-place for instant transitions.
 */

import { useState, useCallback } from 'react';
import { simulateGame, SquareData, GameData, SimulationResult } from '@/lib/chess/gameSimulator';
import { setActivePalette, PaletteId, getPieceColor } from '@/lib/chess/pieceColors';
import { supabase } from '@/integrations/supabase/client';
import { getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';

export interface PaletteSwitchResult {
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  paletteId: PaletteId;
  visualizationId?: string;
  visionScore?: VisionScore | null;
  title?: string;
  createdAt?: string;
  imageUrl?: string;
  shareId?: string;
  isOwner?: boolean;
  isListed?: boolean;
  listingPrice?: number;
  sellerId?: string;
  sellerName?: string;
}

interface UseSeamlessPaletteSwitchOptions {
  pgn: string;
  currentUserId?: string;
  onSwitchStart?: () => void;
  onSwitchComplete?: (result: PaletteSwitchResult) => void;
  onError?: (error: Error) => void;
}

export function useSeamlessPaletteSwitch({
  pgn,
  currentUserId,
  onSwitchStart,
  onSwitchComplete,
  onError,
}: UseSeamlessPaletteSwitchOptions) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentPaletteId, setCurrentPaletteId] = useState<PaletteId | null>(null);

  /**
   * Switch to a new palette by regenerating the board visualization
   * If the palette is taken, it fetches the existing visualization data
   * If available, it regenerates from the PGN with new colors
   */
  const switchPalette = useCallback(async (
    newPaletteId: PaletteId,
    existingVisualizationId?: string
  ): Promise<PaletteSwitchResult | null> => {
    if (!pgn) return null;

    try {
      setIsSwitching(true);
      onSwitchStart?.();

      // Set the new palette globally
      setActivePalette(newPaletteId);
      setCurrentPaletteId(newPaletteId);

      let result: PaletteSwitchResult;

      if (existingVisualizationId) {
        // Fetch existing visualization data from database
        const { data: vizData, error } = await supabase
          .from('saved_visualizations')
          .select('*')
          .eq('id', existingVisualizationId)
          .single();

        if (error) throw error;

        // Parse the saved game data
        const gameData = vizData.game_data as unknown as {
          board?: SquareData[][];
          gameData?: GameData;
          totalMoves?: number;
        };

        // Check if this is listed
        const { data: listingData } = await supabase
          .from('visualization_listings')
          .select('*, profiles:seller_id(display_name)')
          .eq('visualization_id', existingVisualizationId)
          .eq('status', 'active')
          .maybeSingle();

        // Get vision score
        const visionScore = await getVisionScore(existingVisualizationId);

        result = {
          board: gameData.board || [],
          gameData: gameData.gameData || {
            white: 'Unknown',
            black: 'Unknown',
            event: '',
            date: '',
            result: '*',
            pgn: pgn,
            moves: [],
          },
          totalMoves: gameData.totalMoves || 0,
          paletteId: newPaletteId,
          visualizationId: existingVisualizationId,
          visionScore,
          title: vizData.title,
          createdAt: vizData.created_at,
          imageUrl: vizData.image_path,
          shareId: vizData.public_share_id,
          isOwner: vizData.user_id === currentUserId,
          isListed: !!listingData,
          listingPrice: listingData?.price_cents,
          sellerId: listingData?.seller_id,
          sellerName: (listingData?.profiles as { display_name?: string })?.display_name || 'Anonymous',
        };
      } else {
        // Regenerate board from PGN with new palette colors
        const simResult = simulateGame(pgn);

        // Re-apply colors based on new palette
        const updatedBoard = simResult.board.map(rank =>
          rank.map(square => ({
            ...square,
            visits: square.visits.map(visit => ({
              ...visit,
              hexColor: getPieceColor(visit.piece, visit.color),
            })),
          }))
        );

        result = {
          board: updatedBoard,
          gameData: simResult.gameData,
          totalMoves: simResult.totalMoves,
          paletteId: newPaletteId,
        };
      }

      onSwitchComplete?.(result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch palette');
      onError?.(error);
      return null;
    } finally {
      setIsSwitching(false);
    }
  }, [pgn, currentUserId, onSwitchStart, onSwitchComplete, onError]);

  /**
   * Regenerate board colors for current palette (useful for palette editor)
   */
  const regenerateColors = useCallback((board: SquareData[][]): SquareData[][] => {
    return board.map(rank =>
      rank.map(square => ({
        ...square,
        visits: square.visits.map(visit => ({
          ...visit,
          hexColor: getPieceColor(visit.piece, visit.color),
        })),
      }))
    );
  }, []);

  return {
    switchPalette,
    regenerateColors,
    isSwitching,
    currentPaletteId,
  };
}
