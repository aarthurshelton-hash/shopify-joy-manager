/**
 * React Hook for Stockfish Analysis
 * 
 * Provides easy-to-use Stockfish integration for React components.
 * Handles engine lifecycle, analysis state, and cleanup.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StockfishEngine, 
  getStockfishEngine, 
  PositionAnalysis, 
  GameAnalysis, 
  MoveAnalysis 
} from '@/lib/chess/stockfishEngine';

export interface UseStockfishAnalysisReturn {
  // Engine state
  isReady: boolean;
  isAnalyzing: boolean;
  error: string | null;
  
  // Analysis functions
  analyzePosition: (fen: string, depth?: number) => Promise<PositionAnalysis | null>;
  analyzeGame: (pgn: string, depth?: number) => Promise<GameAnalysis | null>;
  evaluateMove: (fen: string, move: string, depth?: number) => Promise<{
    cpLoss: number;
    accuracy: number;
    wasBest: boolean;
    bestMove: string;
  } | null>;
  quickEval: (fen: string) => Promise<number | null>;
  stopAnalysis: () => void;
  
  // Analysis results
  currentAnalysis: PositionAnalysis | null;
  gameAnalysis: GameAnalysis | null;
  progress: { current: number; total: number } | null;
  
  // Engine info
  engineVersion: string;
}

export function useStockfishAnalysis(): UseStockfishAnalysisReturn {
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<PositionAnalysis | null>(null);
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysis | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  
  const engineRef = useRef<StockfishEngine | null>(null);
  const mountedRef = useRef(true);

  // Initialize engine on mount
  useEffect(() => {
    mountedRef.current = true;
    
    const initEngine = async () => {
      try {
        const engine = getStockfishEngine();
        engineRef.current = engine;
        
        const ready = await engine.waitReady();
        if (mountedRef.current) {
          setIsReady(ready);
          if (!ready) {
            setError('Stockfish failed to initialize');
          }
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      }
    };
    
    initEngine();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Analyze a single position
  const analyzePosition = useCallback(async (fen: string, depth = 20): Promise<PositionAnalysis | null> => {
    if (!engineRef.current || !isReady) {
      setError('Engine not ready');
      return null;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await engineRef.current.analyzePosition(fen, { depth });
      if (mountedRef.current) {
        setCurrentAnalysis(analysis);
        setIsAnalyzing(false);
      }
      return analysis;
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
        setIsAnalyzing(false);
      }
      return null;
    }
  }, [isReady]);

  // Analyze a full game
  const analyzeGame = useCallback(async (pgn: string, depth = 15): Promise<GameAnalysis | null> => {
    if (!engineRef.current || !isReady) {
      setError('Engine not ready');
      return null;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setProgress({ current: 0, total: 0 });
    
    try {
      const analysis = await engineRef.current.analyzeGame(pgn, {
        depth,
        onProgress: (current, total) => {
          if (mountedRef.current) {
            setProgress({ current, total });
          }
        },
      });
      
      if (mountedRef.current) {
        setGameAnalysis(analysis);
        setIsAnalyzing(false);
        setProgress(null);
      }
      return analysis;
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
        setIsAnalyzing(false);
        setProgress(null);
      }
      return null;
    }
  }, [isReady]);

  // Evaluate a specific move
  const evaluateMove = useCallback(async (
    fen: string, 
    move: string, 
    depth = 15
  ): Promise<{ cpLoss: number; accuracy: number; wasBest: boolean; bestMove: string } | null> => {
    if (!engineRef.current || !isReady) {
      return null;
    }
    
    try {
      return await engineRef.current.evaluateMove(fen, move, depth);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed');
      return null;
    }
  }, [isReady]);

  // Quick evaluation (low depth, fast)
  const quickEval = useCallback(async (fen: string): Promise<number | null> => {
    if (!engineRef.current || !isReady) {
      return null;
    }
    
    try {
      return await engineRef.current.quickEval(fen);
    } catch (e) {
      return null;
    }
  }, [isReady]);

  // Stop current analysis
  const stopAnalysis = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setIsAnalyzing(false);
  }, []);

  return {
    isReady,
    isAnalyzing,
    error,
    analyzePosition,
    analyzeGame,
    evaluateMove,
    quickEval,
    stopAnalysis,
    currentAnalysis,
    gameAnalysis,
    progress,
    engineVersion: 'Stockfish 16 NNUE WASM',
  };
}

// ===================== UTILITY FUNCTIONS =====================

/**
 * Convert centipawn score to human-readable evaluation
 */
export function formatEvaluation(cp: number, isMate: boolean = false, mateIn?: number): string {
  if (isMate && mateIn !== undefined) {
    return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
  }
  
  const score = cp / 100;
  if (score > 0) {
    return `+${score.toFixed(2)}`;
  }
  return score.toFixed(2);
}

/**
 * Get evaluation bar percentage (for UI)
 */
export function getEvalBarPercent(cp: number): number {
  // Clamp to reasonable range and convert to percentage
  // +1000cp = 90%, -1000cp = 10%, 0 = 50%
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (clamped / 1000) * 40;
}

/**
 * Classify move quality based on centipawn loss
 */
export function classifyMoveQuality(cpLoss: number): {
  quality: 'brilliant' | 'great' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  color: string;
  symbol: string;
} {
  if (cpLoss < 0) {
    return { quality: 'brilliant', color: '#26C9A2', symbol: '!!' };
  }
  if (cpLoss <= 5) {
    return { quality: 'best', color: '#96BC4B', symbol: '✓' };
  }
  if (cpLoss <= 15) {
    return { quality: 'great', color: '#81B64C', symbol: '!' };
  }
  if (cpLoss <= 30) {
    return { quality: 'good', color: '#A3A3A3', symbol: '○' };
  }
  if (cpLoss <= 75) {
    return { quality: 'inaccuracy', color: '#F7C631', symbol: '?!' };
  }
  if (cpLoss <= 200) {
    return { quality: 'mistake', color: '#E58F2A', symbol: '?' };
  }
  return { quality: 'blunder', color: '#CA3431', symbol: '??' };
}
