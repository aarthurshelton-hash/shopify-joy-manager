/**
 * useUnifiedLiveData - Single Source of Truth for All Live Data
 * 
 * Consolidates ALL real-time data streams across En Pensent:
 * - Chess predictions & benchmarks
 * - Code analysis & evolution
 * - Industry adapters (Manufacturing, Supply Chain)
 * - Cross-domain correlations
 * - Market signals
 * 
 * This hook provides a unified interface for any component that needs
 * live-updating data from the En Pensent universe.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRealtimeAccuracyContext } from '@/providers/RealtimeAccuracyProvider';
import { useLiveIndustryData } from '@/hooks/useLiveIndustryData';
import { subscribeToEvolution, type EvolutionEvent } from '@/hooks/useUnifiedEvolution';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedLiveState {
  // Connection status
  isConnected: boolean;
  isLive: boolean;
  lastGlobalUpdate: Date | null;
  updateCount: number;

  // Chess domain
  chess: {
    totalPredictions: number;
    hybridAccuracy: number;
    stockfishAccuracy: number;
    hybridWins: number;
    stockfishWins: number;
    volumePool: number;
    deepPool: number;
    lastUpdate: Date | null;
  };

  // Code domain
  code: {
    health: number;
    patternAlignment: number;
    evolutionCount: number;
    lastArchetype: string | null;
    lastUpdate: Date | null;
  };

  // Industry domains
  industry: {
    manufacturing: {
      machineHealth: number;
      predictedFailures: number;
      criticalAlerts: number;
      activeSensors: number;
    };
    supplyChain: {
      flowEfficiency: number;
      bottlenecks: number;
      demandAccuracy: number;
    };
    crossDomainCorrelations: number;
    lastUpdate: Date | null;
  };

  // Market domain
  market: {
    syncAccuracy: number;
    ticksProcessed: number;
    lastUpdate: Date | null;
  };

  // Evolution metrics
  evolution: {
    generation: number;
    fitnessScore: number;
    lastMutation: Date | null;
  };
}

const INITIAL_STATE: UnifiedLiveState = {
  isConnected: false,
  isLive: false,
  lastGlobalUpdate: null,
  updateCount: 0,
  chess: {
    totalPredictions: 0,
    hybridAccuracy: 0,
    stockfishAccuracy: 0,
    hybridWins: 0,
    stockfishWins: 0,
    volumePool: 0,
    deepPool: 0,
    lastUpdate: null,
  },
  code: {
    health: 100,
    patternAlignment: 100,
    evolutionCount: 0,
    lastArchetype: null,
    lastUpdate: null,
  },
  industry: {
    manufacturing: {
      machineHealth: 100,
      predictedFailures: 0,
      criticalAlerts: 0,
      activeSensors: 64,
    },
    supplyChain: {
      flowEfficiency: 100,
      bottlenecks: 0,
      demandAccuracy: 100,
    },
    crossDomainCorrelations: 0,
    lastUpdate: null,
  },
  market: {
    syncAccuracy: 100,
    ticksProcessed: 0,
    lastUpdate: null,
  },
  evolution: {
    generation: 0,
    fitnessScore: 0,
    lastMutation: null,
  },
};

interface UseUnifiedLiveDataOptions {
  enabled?: boolean;
  industryEnabled?: boolean;
  refreshInterval?: number;
}

export function useUnifiedLiveData(options: UseUnifiedLiveDataOptions = {}) {
  const { 
    enabled = true, 
    industryEnabled = true,
    refreshInterval = 3000 
  } = options;

  const [state, setState] = useState<UnifiedLiveState>(INITIAL_STATE);

  // Use the realtime accuracy context for chess/evolution data
  const realtimeContext = useRealtimeAccuracyContext();

  // Use the industry data hook
  const industryData = useLiveIndustryData({ 
    enabled: enabled && industryEnabled, 
    refreshInterval 
  });

  // Subscribe to evolution events
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToEvolution((event: EvolutionEvent) => {
      setState(prev => {
        const now = new Date();
        let updates: Partial<UnifiedLiveState> = {
          lastGlobalUpdate: now,
          updateCount: prev.updateCount + 1,
          isLive: true,
        };

        // Handle different event types
        if (event.type === 'code_analysis' && event.data) {
          const data = event.data as { archetype?: string; health?: number };
          updates.code = {
            ...prev.code,
            health: data.health || prev.code.health,
            lastArchetype: data.archetype || prev.code.lastArchetype,
            lastUpdate: now,
          };
        } else if (event.type === 'pattern_discovered') {
          updates.code = {
            ...prev.code,
            patternAlignment: Math.min(100, prev.code.patternAlignment + 2),
            evolutionCount: prev.code.evolutionCount + 1,
            lastUpdate: now,
          };
        } else if (event.type === 'market_sync' && event.data) {
          const data = event.data as { accuracy?: number; ticksProcessed?: number };
          updates.market = {
            syncAccuracy: data.accuracy || prev.market.syncAccuracy,
            ticksProcessed: data.ticksProcessed || prev.market.ticksProcessed,
            lastUpdate: now,
          };
        }

        return { ...prev, ...updates };
      });
    });

    return unsubscribe;
  }, [enabled]);

  // Sync chess stats from realtime context
  useEffect(() => {
    if (!enabled || !realtimeContext.chessStats) return;

    const stats = realtimeContext.chessStats;
    setState(prev => ({
      ...prev,
      isConnected: realtimeContext.isConnected,
      chess: {
        totalPredictions: stats.totalGames,
        hybridAccuracy: stats.hybridAccuracy,
        stockfishAccuracy: stats.stockfishAccuracy,
        hybridWins: stats.hybridWins,
        stockfishWins: stats.stockfishWins,
        volumePool: stats.volumePoolCount,
        deepPool: stats.deepPoolCount,
        lastUpdate: realtimeContext.lastUpdate,
      },
    }));
  }, [enabled, realtimeContext.chessStats, realtimeContext.isConnected, realtimeContext.lastUpdate]);

  // Sync industry data
  useEffect(() => {
    if (!enabled || !industryEnabled) return;

    setState(prev => ({
      ...prev,
      industry: {
        manufacturing: {
          machineHealth: industryData.manufacturing.machineHealth,
          predictedFailures: industryData.manufacturing.predictedFailures,
          criticalAlerts: industryData.manufacturing.criticalAlerts,
          activeSensors: industryData.manufacturing.activeSensors,
        },
        supplyChain: {
          flowEfficiency: industryData.supplyChain.flowEfficiency,
          bottlenecks: industryData.supplyChain.bottlenecks,
          demandAccuracy: industryData.supplyChain.demandAccuracy,
        },
        crossDomainCorrelations: industryData.crossDomainCorrelations.length,
        lastUpdate: industryData.lastUpdate,
      },
      isLive: industryData.isLive || prev.isLive,
    }));
  }, [enabled, industryEnabled, industryData]);

  // Fetch evolution state from database
  const fetchEvolutionState = useCallback(async () => {
    if (!enabled) return;

    try {
      const { data } = await supabase
        .from('evolution_state')
        .select('generation, fitness_score, last_mutation_at')
        .eq('state_type', 'global')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setState(prev => ({
          ...prev,
          evolution: {
            generation: data.generation || 0,
            fitnessScore: data.fitness_score || 0,
            lastMutation: data.last_mutation_at ? new Date(data.last_mutation_at) : null,
          },
        }));
      }
    } catch (error) {
      console.warn('[UnifiedLiveData] Failed to fetch evolution state:', error);
    }
  }, [enabled]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!enabled) return;

    fetchEvolutionState();
    const interval = setInterval(fetchEvolutionState, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [enabled, fetchEvolutionState]);

  // Force refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      realtimeContext.syncAccuracyData(),
      fetchEvolutionState(),
    ]);
    industryData.refresh();
  }, [realtimeContext, fetchEvolutionState, industryData]);

  // Pause/resume
  const pause = useCallback(() => {
    industryData.pause();
    setState(prev => ({ ...prev, isLive: false }));
  }, [industryData]);

  const resume = useCallback(() => {
    industryData.resume();
    setState(prev => ({ ...prev, isLive: true }));
  }, [industryData]);

  // Computed summary
  const summary = useMemo(() => {
    const chessLead = state.chess.hybridAccuracy - state.chess.stockfishAccuracy;
    const systemHealth = (
      state.code.health * 0.3 +
      state.industry.manufacturing.machineHealth * 0.2 +
      state.industry.supplyChain.flowEfficiency * 0.2 +
      state.market.syncAccuracy * 0.3
    );
    
    return {
      chessLead: chessLead.toFixed(1),
      systemHealth: systemHealth.toFixed(0),
      totalUpdates: state.updateCount,
      domainsActive: [
        state.chess.lastUpdate ? 'chess' : null,
        state.code.lastUpdate ? 'code' : null,
        state.industry.lastUpdate ? 'industry' : null,
        state.market.lastUpdate ? 'market' : null,
      ].filter(Boolean).length,
    };
  }, [state]);

  return {
    ...state,
    summary,
    refresh,
    pause,
    resume,
    // Expose raw hooks for detailed access
    industryData,
    realtimeContext,
  };
}

export default useUnifiedLiveData;
