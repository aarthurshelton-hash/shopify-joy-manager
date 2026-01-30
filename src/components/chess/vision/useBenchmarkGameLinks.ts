/**
 * Hook to link Visions with benchmark game predictions
 * 
 * Fetches relevant predictions from chess_prediction_attempts
 * that match the current game being visualized.
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BenchmarkPredictionLink } from './VisionExportState';

interface UseBenchmarkGameLinksOptions {
  pgn?: string;
  gameName?: string;
  whitePlayer?: string;
  blackPlayer?: string;
  enabled?: boolean;
}

interface UseBenchmarkGameLinksResult {
  linkedPredictions: BenchmarkPredictionLink[];
  isLoading: boolean;
  error: Error | null;
  hasBreakthroughCase: boolean; // Hybrid correct, Stockfish wrong
  accuracy: {
    hybrid: number;
    stockfish: number;
  } | null;
}

export function useBenchmarkGameLinks({
  pgn,
  gameName,
  whitePlayer,
  blackPlayer,
  enabled = true,
}: UseBenchmarkGameLinksOptions): UseBenchmarkGameLinksResult {
  const [predictions, setPredictions] = useState<BenchmarkPredictionLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create search terms from game context
  const searchTerms = useMemo(() => {
    const terms: string[] = [];
    if (gameName) terms.push(gameName);
    if (whitePlayer && blackPlayer) {
      terms.push(`${whitePlayer} vs ${blackPlayer}`);
      terms.push(`${whitePlayer}-${blackPlayer}`);
    }
    return terms;
  }, [gameName, whitePlayer, blackPlayer]);

  useEffect(() => {
    if (!enabled || searchTerms.length === 0) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Search for predictions matching any of our search terms
        let query = supabase
          .from('chess_prediction_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        // Use ilike for flexible matching on game_name
        if (gameName) {
          query = query.ilike('game_name', `%${gameName}%`);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        const links: BenchmarkPredictionLink[] = (data || []).map(p => ({
          gameId: p.game_id,
          gameName: p.game_name,
          moveNumber: p.move_number,
          hybridPrediction: p.hybrid_prediction,
          stockfishPrediction: p.stockfish_prediction,
          actualResult: p.actual_result,
          hybridCorrect: p.hybrid_correct,
          stockfishCorrect: p.stockfish_correct,
          archetype: p.hybrid_archetype || undefined,
          confidence: p.hybrid_confidence || undefined,
        }));

        setPredictions(links);
      } catch (err) {
        console.error('Error fetching benchmark links:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch predictions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [enabled, searchTerms, gameName]);

  // Calculate accuracy stats
  const accuracy = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const hybridCorrect = predictions.filter(p => p.hybridCorrect).length;
    const stockfishCorrect = predictions.filter(p => p.stockfishCorrect).length;
    
    return {
      hybrid: (hybridCorrect / predictions.length) * 100,
      stockfish: (stockfishCorrect / predictions.length) * 100,
    };
  }, [predictions]);

  // Check for breakthrough cases
  const hasBreakthroughCase = useMemo(() => {
    return predictions.some(p => p.hybridCorrect && !p.stockfishCorrect);
  }, [predictions]);

  return {
    linkedPredictions: predictions,
    isLoading,
    error,
    hasBreakthroughCase,
    accuracy,
  };
}

export default useBenchmarkGameLinks;
