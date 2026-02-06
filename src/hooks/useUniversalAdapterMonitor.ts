/**
 * Universal Adapter Monitor Hook
 * 
 * Consumes adapter registry state from global state and provides
 * reactive access to all 55 domain adapters' metrics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  universalAdapterRegistry, 
  subscribeToAdapterEvolution,
  AdapterRegistry, 
  CrossDomainResonance,
  type UnifiedMarketData
} from '@/lib/pensent-core/domains/universal/adapters';

export interface AdapterMetrics {
  name: string;
  domain: string;
  isActive: boolean;
  signalCount: number;
  learningRate: number;
  lastUpdate: number;
  healthScore: number;
}

export interface ResonanceMetrics {
  adapter1: string;
  adapter2: string;
  resonanceScore: number;
  sharedPatterns: string[];
  lastSynced: number;
}

export interface UniversalMonitorState {
  adapters: AdapterMetrics[];
  resonances: ResonanceMetrics[];
  evolutionCycle: number;
  totalSignals: number;
  activeCount: number;
  lastUpdate: number;
}

export interface DomainSummary {
  domain: string;
  adapterCount: number;
  totalSignals: number;
  avgLearningRate: number;
  healthScore: number;
}

// Domain color mapping for visualization
export const DOMAIN_COLORS: Record<string, string> = {
  temporal: '#8b5cf6',      // violet
  soul: '#ec4899',          // pink
  bio: '#22c55e',           // green
  quantum: '#06b6d4',       // cyan
  photonic: '#f59e0b',      // amber
  market: '#10b981',        // emerald
  network: '#6366f1',       // indigo
  security: '#ef4444',      // red
  chess: '#f97316',       // orange
  code: '#3b82f6',        // blue
  climate: '#14b8a6',       // teal
  light: '#eab308',       // yellow
  audio: '#a855f7',       // purple
  realization: '#f43f5e',   // rose
  atomic: '#0ea5e9',      // sky
  biologyDeep: '#84cc16',   // lime
  default: '#6b7280'        // gray
};

export function useUniversalAdapterMonitor(pollInterval: number = 5000) {
  const [state, setState] = useState<UniversalMonitorState>({
    adapters: [],
    resonances: [],
    evolutionCycle: 0,
    totalSignals: 0,
    activeCount: 0,
    lastUpdate: Date.now()
  });

  const [domainSummaries, setDomainSummaries] = useState<DomainSummary[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract state from global registry
  const refreshState = useCallback(() => {
    const globalObj = globalThis as Record<string, unknown>;
    const adapterState = globalObj.EN_PENSENT_ADAPTER_STATE as {
      cycle: number;
      timestamp: number;
      adapters: Array<{
        name: string;
        domain: string;
        isActive: boolean;
        signalCount: number;
        learningRate: number;
      }>;
      resonances: Array<{
        adapter1: string;
        adapter2: string;
        resonanceScore: number;
        sharedPatterns: string[];
        lastSynced: number;
      }>;
    } | undefined;

    if (adapterState) {
      const adapters: AdapterMetrics[] = adapterState.adapters.map(a => ({
        ...a,
        lastUpdate: adapterState.timestamp,
        healthScore: calculateHealthScore(a)
      }));

      const totalSignals = adapters.reduce((sum, a) => sum + a.signalCount, 0);
      const activeCount = adapters.filter(a => a.isActive).length;

      setState({
        adapters,
        resonances: adapterState.resonances,
        evolutionCycle: adapterState.cycle,
        totalSignals,
        activeCount,
        lastUpdate: adapterState.timestamp
      });

      // Calculate domain summaries
      const domainMap = new Map<string, DomainSummary>();
      adapters.forEach(adapter => {
        const existing = domainMap.get(adapter.domain);
        if (existing) {
          existing.adapterCount++;
          existing.totalSignals += adapter.signalCount;
          existing.avgLearningRate = (existing.avgLearningRate * (existing.adapterCount - 1) + adapter.learningRate) / existing.adapterCount;
          existing.healthScore = (existing.healthScore * (existing.adapterCount - 1) + adapter.healthScore) / existing.adapterCount;
        } else {
          domainMap.set(adapter.domain, {
            domain: adapter.domain,
            adapterCount: 1,
            totalSignals: adapter.signalCount,
            avgLearningRate: adapter.learningRate,
            healthScore: adapter.healthScore
          });
        }
      });

      setDomainSummaries(Array.from(domainMap.values()));
    }
  }, []);

  // Get top resonating pairs
  const getTopResonances = useCallback((limit: number = 10): ResonanceMetrics[] => {
    return state.resonances
      .sort((a, b) => b.resonanceScore - a.resonanceScore)
      .slice(0, limit);
  }, [state.resonances]);

  // Get adapters by domain
  const getAdaptersByDomain = useCallback((domain: string): AdapterMetrics[] => {
    return state.adapters.filter(a => a.domain === domain);
  }, [state.adapters]);

  // Get health score for specific adapter
  const getAdapterHealth = useCallback((name: string): number => {
    const adapter = state.adapters.find(a => a.name === name);
    return adapter?.healthScore || 0;
  }, [state.adapters]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    await universalAdapterRegistry.initializeAll();
    refreshState();
  }, [refreshState]);

  // Increment signal for an adapter
  const incrementSignal = useCallback((adapterName: string) => {
    universalAdapterRegistry.incrementSignalCount(adapterName);
    refreshState();
  }, [refreshState]);

  // Start polling
  useEffect(() => {
    refreshState();
    intervalRef.current = setInterval(refreshState, pollInterval);
    
    // Subscribe to adapter evolution events
    const unsubscribe = subscribeToAdapterEvolution((event) => {
      console.log('[UniversalAdapterMonitor] Evolution event:', event.type);
      refreshState();
    });
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribe();
    };
  }, [pollInterval, refreshState]);

  return {
    ...state,
    domainSummaries,
    topResonances: getTopResonances(),
    getAdaptersByDomain,
    getAdapterHealth,
    refreshState,
    triggerSync,
    incrementSignal
  };
}

// Calculate health score based on adapter metrics
function calculateHealthScore(adapter: {
  isActive: boolean;
  signalCount: number;
  learningRate: number;
}): number {
  if (!adapter.isActive) return 0;
  
  const activityScore = Math.min(30, adapter.signalCount / 100);
  const learningScore = adapter.learningRate * 100;
  const baseScore = 50;
  
  return Math.min(100, baseScore + activityScore + learningScore);
}

// Get color for domain
export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || DOMAIN_COLORS.default;
}
