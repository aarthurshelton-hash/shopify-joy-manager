/**
 * React Hook for Dual-Pool Benchmark Pipeline
 * 
 * Provides easy integration of the dual-pool system:
 * - CLOUD-VOLUME: 100+ games/hour via Lichess Cloud API
 * - LOCAL-DEEP: 5 games/hour with Stockfish D30
 */

import { useState, useCallback, useRef } from 'react';
import { 
  runDualPoolPipeline,
  runCloudPoolBatch,
  runLocalPoolBatch,
  savePoolPredictions,
  type PoolPrediction,
  type PoolProgress,
  type DualPoolResult,
  CLOUD_POOL_CONFIG,
  LOCAL_POOL_CONFIG,
} from '@/lib/chess/dualPoolPipeline';

export interface UseDualPoolReturn {
  // State
  isRunning: boolean;
  cloudProgress: PoolProgress | null;
  localProgress: PoolProgress | null;
  lastResult: DualPoolResult | null;
  error: string | null;
  
  // Actions
  runFullPipeline: (options?: {
    cloudTarget?: number;
    localTarget?: number;
    runCloud?: boolean;
    runLocal?: boolean;
  }) => Promise<DualPoolResult | null>;
  
  runCloudOnly: (target?: number) => Promise<PoolPrediction[]>;
  runLocalOnly: (target?: number) => Promise<PoolPrediction[]>;
  
  stopPipeline: () => void;
  
  // Stats
  estimatedCloudTime: string;
  estimatedLocalTime: string;
}

export function useDualPoolPipeline(): UseDualPoolReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [cloudProgress, setCloudProgress] = useState<PoolProgress | null>(null);
  const [localProgress, setLocalProgress] = useState<PoolProgress | null>(null);
  const [lastResult, setLastResult] = useState<DualPoolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortRef = useRef(false);
  const batchRef = useRef(0);
  
  const runFullPipeline = useCallback(async (options?: {
    cloudTarget?: number;
    localTarget?: number;
    runCloud?: boolean;
    runLocal?: boolean;
  }): Promise<DualPoolResult | null> => {
    if (isRunning) {
      setError('Pipeline already running');
      return null;
    }
    
    setIsRunning(true);
    setError(null);
    abortRef.current = false;
    batchRef.current++;
    
    try {
      const result = await runDualPoolPipeline(
        options,
        (status, cloud, local) => {
          if (!abortRef.current) {
            setCloudProgress(cloud);
            setLocalProgress(local);
          }
        }
      );
      
      setLastResult(result);
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed';
      setError(message);
      return null;
      
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);
  
  const runCloudOnly = useCallback(async (target: number = 100): Promise<PoolPrediction[]> => {
    if (isRunning) {
      setError('Pipeline already running');
      return [];
    }
    
    setIsRunning(true);
    setError(null);
    abortRef.current = false;
    batchRef.current++;
    
    try {
      const predictions = await runCloudPoolBatch(
        target,
        batchRef.current,
        (status, progress) => {
          if (!abortRef.current) {
            setCloudProgress({
              poolName: 'CLOUD-VOLUME',
              completed: 0,
              target,
              gamesPerHour: 100,
              lastGameTime: Date.now(),
              status: 'running',
            });
          }
        }
      );
      
      // Save predictions
      await savePoolPredictions(predictions, 'CLOUD-VOLUME');
      
      return predictions;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cloud pool failed';
      setError(message);
      return [];
      
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);
  
  const runLocalOnly = useCallback(async (target: number = 5): Promise<PoolPrediction[]> => {
    if (isRunning) {
      setError('Pipeline already running');
      return [];
    }
    
    setIsRunning(true);
    setError(null);
    abortRef.current = false;
    batchRef.current++;
    
    try {
      const predictions = await runLocalPoolBatch(
        target,
        batchRef.current,
        (status, progress) => {
          if (!abortRef.current) {
            setLocalProgress({
              poolName: 'LOCAL-DEEP',
              completed: 0,
              target,
              gamesPerHour: 5,
              lastGameTime: Date.now(),
              status: 'running',
            });
          }
        }
      );
      
      // Save predictions
      await savePoolPredictions(predictions, 'LOCAL-DEEP');
      
      return predictions;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Local pool failed';
      setError(message);
      return [];
      
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);
  
  const stopPipeline = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);
  
  // Calculate estimated times based on targets
  const estimatedCloudTime = `~${Math.ceil((cloudProgress?.target || 100) / CLOUD_POOL_CONFIG.targetPerHour * 60)} min`;
  const estimatedLocalTime = `~${Math.ceil((localProgress?.target || 5) / LOCAL_POOL_CONFIG.targetPerHour * 60)} min`;
  
  return {
    isRunning,
    cloudProgress,
    localProgress,
    lastResult,
    error,
    runFullPipeline,
    runCloudOnly,
    runLocalOnly,
    stopPipeline,
    estimatedCloudTime,
    estimatedLocalTime,
  };
}

export default useDualPoolPipeline;
