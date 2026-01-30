/**
 * Hook to fetch opening information from Lichess Opening Explorer
 * 
 * Provides:
 * - Opening name and ECO code
 * - Win/draw/loss statistics
 * - Top moves and their success rates
 * - Similar master games
 */

import { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';

export interface OpeningStats {
  white: number;
  draws: number;
  black: number;
  total: number;
}

export interface TopMove {
  san: string;
  white: number;
  draws: number;
  black: number;
  total: number;
  whiteWinRate: number;
}

export interface MasterGame {
  id: string;
  white: string;
  black: string;
  whiteRating: number;
  blackRating: number;
  winner?: string;
  year: number;
  url: string;
}

export interface LichessOpeningData {
  opening?: {
    eco: string;
    name: string;
  };
  stats: {
    masters: OpeningStats | null;
    lichess: OpeningStats | null;
  };
  topMoves: TopMove[];
  masterGames: MasterGame[];
  recentGames: MasterGame[];
}

interface UseLichessOpeningOptions {
  pgn?: string;
  fen?: string;
  enabled?: boolean;
  moveNumber?: number; // Specific move to analyze
}

interface UseLichessOpeningResult {
  data: LichessOpeningData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Convert PGN moves to UCI format for the API
 */
function pgnToMoves(pgn: string, upToMove?: number): string {
  try {
    const chess = new Chess();
    
    // Clean PGN - extract just the moves
    const cleanedPgn = pgn
      .replace(/\[.*?\]/g, '') // Remove headers
      .replace(/\{.*?\}/g, '') // Remove comments
      .replace(/\d+\.\.\./g, '') // Remove move continuation dots
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove results
      .trim();
    
    const tokens = cleanedPgn.split(/\s+/).filter(t => t.length > 0);
    const moves: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      if (upToMove && moves.length >= upToMove) break;
      
      try {
        const move = chess.move(tokens[i]);
        if (move) {
          moves.push(move.from + move.to + (move.promotion || ''));
        }
      } catch {
        // Skip invalid moves
        break;
      }
    }
    
    return moves.join(',');
  } catch {
    return '';
  }
}

/**
 * Hook to fetch opening data from Lichess
 */
export function useLichessOpening({
  pgn,
  fen,
  enabled = true,
  moveNumber,
}: UseLichessOpeningOptions): UseLichessOpeningResult {
  const [data, setData] = useState<LichessOpeningData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Memoize the moves string to avoid unnecessary refetches
  const moves = useMemo(() => {
    if (!pgn) return '';
    // Only use first 15 moves for opening classification
    const maxMoves = moveNumber || 15;
    return pgnToMoves(pgn, maxMoves);
  }, [pgn, moveNumber]);

  useEffect(() => {
    if (!enabled || (!moves && !fen)) {
      return;
    }

    let cancelled = false;

    const fetchOpening = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: responseData, error: fetchError } = await supabase.functions.invoke(
          'lichess-opening-explorer',
          {
            body: {
              moves: moves || undefined,
              fen: fen || undefined,
            },
          }
        );

        if (cancelled) return;

        if (fetchError) {
          console.error('[useLichessOpening] Fetch error:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (responseData?.error) {
          console.warn('[useLichessOpening] API error:', responseData.error);
          setError(responseData.error);
          return;
        }

        setData(responseData as LichessOpeningData);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to fetch opening data';
        console.error('[useLichessOpening] Error:', message);
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOpening();

    return () => {
      cancelled = true;
    };
  }, [moves, fen, enabled, refetchTrigger]);

  const refetch = () => setRefetchTrigger(t => t + 1);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to find similar games by archetype
 */
export function useSimilarGames({
  archetype,
  openingEco,
  enabled = true,
}: {
  archetype?: string;
  openingEco?: string;
  enabled?: boolean;
}) {
  const [games, setGames] = useState<Array<{
    id: string;
    gameName: string;
    archetype: string;
    outcome: string;
    moveCount: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || (!archetype && !openingEco)) {
      return;
    }

    let cancelled = false;

    const fetchSimilarGames = async () => {
      setIsLoading(true);

      try {
        // Query color_flow_patterns for similar games
        let query = supabase
          .from('color_flow_patterns')
          .select('id, fingerprint, archetype, outcome, total_moves, game_metadata, opening_eco')
          .limit(10);

        if (archetype) {
          query = query.eq('archetype', archetype);
        }
        if (openingEco) {
          query = query.eq('opening_eco', openingEco);
        }

        const { data, error } = await query;

        if (cancelled) return;

        if (error) {
          console.error('[useSimilarGames] Query error:', error);
          return;
        }

        const similarGames = (data || []).map(g => {
          const metadata = g.game_metadata as Record<string, unknown> | null;
          return {
            id: g.id,
            gameName: (metadata?.white as string || 'Unknown') + ' vs ' + (metadata?.black as string || 'Unknown'),
            archetype: g.archetype,
            outcome: g.outcome,
            moveCount: g.total_moves,
          };
        });

        setGames(similarGames);
      } catch (err) {
        console.error('[useSimilarGames] Error:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSimilarGames();

    return () => {
      cancelled = true;
    };
  }, [archetype, openingEco, enabled]);

  return { games, isLoading };
}
