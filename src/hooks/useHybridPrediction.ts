/**
 * Hook for Hybrid Prediction System
 * 
 * Combines Stockfish tactical analysis with Color Flow strategic trajectories
 */

import { useState, useCallback } from 'react';
import { 
  HybridPrediction, 
  generateHybridPrediction 
} from '@/lib/chess/hybridPrediction';
import { 
  PatternPrediction, 
  predictFromPatterns
} from '@/lib/chess/patternLearning';
import { 
  ColorFlowSignature, 
  extractColorFlowSignature 
} from '@/lib/chess/colorFlowAnalysis';
import { simulateGame } from '@/lib/chess/gameSimulator';

export interface HybridAnalysisProgress {
  stage: string;
  percent: number;
  details?: string;
}

export interface HybridAnalysisResult {
  hybridPrediction: HybridPrediction | null;
  patternPrediction: PatternPrediction | null;
  colorFlowSignature: ColorFlowSignature | null;
}

export function useHybridPrediction() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<HybridAnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HybridAnalysisResult>({
    hybridPrediction: null,
    patternPrediction: null,
    colorFlowSignature: null,
  });

  const analyzeGame = useCallback(async (pgn: string, options?: { depth?: number }) => {
    if (!pgn) {
      setError('No PGN provided');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress({ stage: 'Initializing hybrid analysis', percent: 0 });

    try {
      // Step 1: Extract Color Flow Signature
      setProgress({ stage: 'Extracting color flow signature', percent: 10 });
      const simulation = simulateGame(pgn);
      const colorFlowSignature = extractColorFlowSignature(
        simulation.board, 
        simulation.gameData, 
        simulation.totalMoves
      );

      // Step 2: Get pattern prediction (fast, no Stockfish needed)
      setProgress({ stage: 'Matching historical patterns', percent: 25 });
      const patternPrediction = predictFromPatterns(pgn);

      // Step 3: Generate full hybrid prediction (includes Lichess Cloud Stockfish)
      // v6.79-SLOWER-CLOUD: Add small delay before cloud API call to prevent cascading rate limits
      setProgress({ stage: 'Preparing Stockfish tactical analysis', percent: 35 });
      await new Promise(r => setTimeout(r, 500)); // Half-second buffer before cloud API
      
      setProgress({ stage: 'Running Stockfish tactical analysis (Cloud)', percent: 40 });
      const hybridPrediction = await generateHybridPrediction(pgn, {
        depth: options?.depth || 18,
        onProgress: (stage, percent) => {
          setProgress({ 
            stage, 
            percent: 40 + (percent * 0.5),
            details: `Depth: ${options?.depth || 18}`
          });
        },
      });

      // Step 4: Learn from this game for future predictions (if outcome is determinable)
      setProgress({ stage: 'Updating pattern database', percent: 95 });
      // Note: We'd need the game result to properly learn - skip for now during analysis
      // learnFromGame(pgn, outcome) would be called after game completion

      setProgress({ stage: 'Analysis complete', percent: 100 });
      setResult({
        hybridPrediction,
        patternPrediction,
        colorFlowSignature,
      });

    } catch (err) {
      console.error('Hybrid analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult({
      hybridPrediction: null,
      patternPrediction: null,
      colorFlowSignature: null,
    });
    setError(null);
    setProgress(null);
  }, []);

  return {
    isAnalyzing,
    progress,
    error,
    result,
    analyzeGame,
    clearResults,
  };
}
