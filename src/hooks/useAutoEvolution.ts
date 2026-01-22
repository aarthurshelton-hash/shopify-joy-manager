/**
 * React Hook for Auto-Evolution Engine v7.24-LIVE-STATS
 * 
 * Provides complete control over the self-healing evolution system:
 * - Start/Stop/Pause controls
 * - Real-time stats and progress from DATABASE
 * - Event subscriptions for UI updates
 * - Force batch triggers
 * 
 * v7.24: Stats are now fetched from DB on mount (not just when engine starts)
 *        Uses useRealtimeAccuracyContext for live updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  startAutoEvolution,
  stopAutoEvolution,
  pauseAutoEvolution,
  resumeAutoEvolution,
  getEvolutionState,
  subscribeToEvolution,
  forceRunBatch,
  type EvolutionState,
  AUTO_EVOLUTION_VERSION,
} from '@/lib/chess/autoEvolutionEngine';
import { useRealtimeAccuracyContext } from '@/providers/RealtimeAccuracyProvider';

export interface UseAutoEvolutionReturn {
  // State
  state: EvolutionState;
  isRunning: boolean;
  isPaused: boolean;
  
  // Stats
  sessionPredictions: number;
  totalPredictions: number;
  cloudPredictions: number;
  localPredictions: number;
  
  // Health
  consecutiveErrors: number;
  recoveryCount: number;
  poolStatus: {
    cloud: string;
    local: string;
  };
  
  // Time info
  sessionDuration: string;
  lastSuccess: string;
  lastError: string;
  
  // Actions
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  forceCloud: () => void;
  forceLocal: () => void;
  
  // Events
  lastEvent: { type: string; data?: any } | null;
  
  // Version
  version: string;
}

export function useAutoEvolution(): UseAutoEvolutionReturn {
  const { toast } = useToast();
  const [state, setState] = useState<EvolutionState>(getEvolutionState);
  const [lastEvent, setLastEvent] = useState<{ type: string; data?: any } | null>(null);
  const [sessionDuration, setSessionDuration] = useState('0s');
  
  // v7.24: Use realtime context for LIVE database stats
  const { chessStats } = useRealtimeAccuracyContext();
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Subscribe to evolution events
  useEffect(() => {
    const unsubscribe = subscribeToEvolution((newState, event, data) => {
      setState(newState);
      setLastEvent({ type: event, data });
      
      // Toast notifications for key events
      if (event === 'cloud_batch_complete' || event === 'local_batch_complete') {
        toast({
          title: `🧬 ${event.includes('cloud') ? 'Cloud' : 'Deep'} Batch Complete`,
          description: `+${data?.count} predictions (${newState.sessionPredictions} session / ${chessStats?.totalGames || newState.totalPredictions} total)`,
        });
      } else if (event === 'recovery_complete') {
        toast({
          title: '🔄 Auto-Recovery Complete',
          description: `System recovered (${data?.count} total recoveries)`,
        });
      } else if (event === 'engine_started') {
        toast({
          title: '🚀 Auto-Evolution ACTIVE',
          description: `v${AUTO_EVOLUTION_VERSION} - Never stops absorbing data`,
        });
      }
    });
    
    return unsubscribe;
  }, [toast, chessStats]);
  
  // Session duration timer
  useEffect(() => {
    if (state.isRunning && state.sessionStartedAt) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - state.sessionStartedAt!.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const mins = Math.floor((elapsed % 3600000) / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        
        if (hours > 0) {
          setSessionDuration(`${hours}h ${mins}m`);
        } else if (mins > 0) {
          setSessionDuration(`${mins}m ${secs}s`);
        } else {
          setSessionDuration(`${secs}s`);
        }
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      setSessionDuration('0s');
    }
    
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [state.isRunning, state.sessionStartedAt]);
  
  // Actions
  const start = useCallback(async () => {
    await startAutoEvolution();
  }, []);
  
  const stop = useCallback(() => {
    stopAutoEvolution();
    toast({
      title: '⏹️ Evolution Stopped',
      description: `Session: ${state.sessionPredictions} predictions`,
    });
  }, [state.sessionPredictions, toast]);
  
  const pause = useCallback(() => {
    pauseAutoEvolution();
    toast({
      title: '⏸️ Evolution Paused',
      description: 'Will resume from current position',
    });
  }, [toast]);
  
  const resume = useCallback(() => {
    resumeAutoEvolution();
    toast({
      title: '▶️ Evolution Resumed',
      description: 'Continuing data absorption',
    });
  }, [toast]);
  
  const forceCloud = useCallback(() => {
    forceRunBatch('cloud');
    toast({
      title: '⚡ Forcing Cloud Batch',
      description: 'Running immediate cloud analysis',
    });
  }, [toast]);
  
  const forceLocal = useCallback(() => {
    forceRunBatch('local');
    toast({
      title: '⚡ Forcing Deep Batch',
      description: 'Running immediate deep analysis',
    });
  }, [toast]);
  
  // Format time helpers
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'never';
    const elapsed = Date.now() - date.getTime();
    if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`;
    if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
    return `${Math.floor(elapsed / 3600000)}h ago`;
  };
  
  // v7.24: Use REAL database stats from realtime context, not engine singleton
  // This ensures stats are accurate even before engine starts
  const totalFromDb = chessStats?.totalGames || 0;
  const volumeFromDb = chessStats?.volumePoolCount || 0;
  const deepFromDb = chessStats?.deepPoolCount || 0;
  
  return {
    state,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    
    sessionPredictions: state.sessionPredictions,
    // v7.24: Prefer DB stats over engine state
    totalPredictions: totalFromDb > 0 ? totalFromDb : state.totalPredictions,
    cloudPredictions: volumeFromDb > 0 ? volumeFromDb : state.totalCloudPredictions,
    localPredictions: deepFromDb > 0 ? deepFromDb : state.totalLocalPredictions,
    
    consecutiveErrors: state.consecutiveErrors,
    recoveryCount: state.recoveryCount,
    poolStatus: {
      cloud: state.cloudPoolStatus,
      local: state.localPoolStatus,
    },
    
    sessionDuration,
    lastSuccess: formatTimeAgo(state.lastSuccessAt),
    lastError: formatTimeAgo(state.lastErrorAt),
    
    start,
    stop,
    pause,
    resume,
    forceCloud,
    forceLocal,
    
    lastEvent,
    version: AUTO_EVOLUTION_VERSION,
  };
}

export default useAutoEvolution;
