/**
 * React Hook for Predictive Chess Analysis
 * 
 * Provides access to the Predictive Analysis Engine for analyzing
 * position potential and getting best move recommendations.
 */

import { useState, useCallback, useRef } from 'react';
import { 
  analyzePositionPotential, 
  getBestMoveRecommendation,
  predictVisualPattern,
  PositionPotential,
  MoveRecommendation,
  VisualPattern,
} from '@/lib/chess/predictiveAnalysis';
import { Chess } from 'chess.js';

export interface UsePredictiveAnalysisReturn {
  // State
  isAnalyzing: boolean;
  progress: { stage: string; percent: number } | null;
  error: string | null;
  
  // Analysis results
  positionPotential: PositionPotential | null;
  moveRecommendation: MoveRecommendation | null;
  visualPattern: VisualPattern | null;
  
  // Actions
  analyzePosition: (fen: string, options?: AnalysisOptions) => Promise<PositionPotential | null>;
  getBestMove: (fen: string, depth?: number) => Promise<MoveRecommendation | null>;
  getVisualPattern: (fen: string) => VisualPattern | null;
  clearResults: () => void;
  cancelAnalysis: () => void;
}

interface AnalysisOptions {
  depth?: number;
  lines?: number;
  lookahead?: number;
}

export function usePredictiveAnalysis(): UsePredictiveAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [positionPotential, setPositionPotential] = useState<PositionPotential | null>(null);
  const [moveRecommendation, setMoveRecommendation] = useState<MoveRecommendation | null>(null);
  const [visualPattern, setVisualPattern] = useState<VisualPattern | null>(null);
  
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  const analyzePosition = useCallback(async (
    fen: string, 
    options: AnalysisOptions = {}
  ): Promise<PositionPotential | null> => {
    cancelledRef.current = false;
    setIsAnalyzing(true);
    setError(null);
    setProgress({ stage: 'Starting analysis', percent: 0 });
    
    try {
      const result = await analyzePositionPotential(fen, {
        depth: options.depth || 20,
        lines: options.lines || 3,
        lookahead: options.lookahead || 15,
        onProgress: (stage, percent) => {
          if (!cancelledRef.current && mountedRef.current) {
            setProgress({ stage, percent });
          }
        },
      });
      
      if (!cancelledRef.current && mountedRef.current) {
        setPositionPotential(result);
        setIsAnalyzing(false);
        setProgress(null);
      }
      
      return result;
    } catch (e) {
      if (!cancelledRef.current && mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
        setIsAnalyzing(false);
        setProgress(null);
      }
      return null;
    }
  }, []);

  const getBestMove = useCallback(async (
    fen: string, 
    depth: number = 20
  ): Promise<MoveRecommendation | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await getBestMoveRecommendation(fen, depth);
      
      if (mountedRef.current) {
        setMoveRecommendation(result);
        setIsAnalyzing(false);
      }
      
      return result;
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to get recommendation');
        setIsAnalyzing(false);
      }
      return null;
    }
  }, []);

  const getVisualPattern = useCallback((fen: string): VisualPattern | null => {
    try {
      const chess = new Chess(fen);
      const pattern = predictVisualPattern(chess);
      setVisualPattern(pattern);
      return pattern;
    } catch (e) {
      setError('Invalid FEN position');
      return null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setPositionPotential(null);
    setMoveRecommendation(null);
    setVisualPattern(null);
    setError(null);
  }, []);

  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    setIsAnalyzing(false);
    setProgress(null);
  }, []);

  return {
    isAnalyzing,
    progress,
    error,
    positionPotential,
    moveRecommendation,
    visualPattern,
    analyzePosition,
    getBestMove,
    getVisualPattern,
    clearResults,
    cancelAnalysis,
  };
}
