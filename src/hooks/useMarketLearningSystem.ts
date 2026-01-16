/**
 * Market Learning System Hook
 * Connects to the persistent 24/7 learning backend
 * Provides real-time sync and report access
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLiveHeartbeat } from './useLiveHeartbeat';

export interface SecurityMetrics {
  symbol: string;
  total_predictions: number;
  correct_predictions: number;
  direction_accuracy: number;
  magnitude_accuracy: number;
  timing_accuracy: number;
  calibration_accuracy: number;
  composite_accuracy: number;
  best_timeframe_ms?: number;
  optimal_confidence_threshold?: number;
  volatility_profile?: Record<string, unknown>;
  correlation_strengths?: Record<string, number>;
  last_prediction_at?: string;
}

export interface MarketCorrelation {
  symbol_a: string;
  symbol_b: string;
  correlation_coefficient: number;
  lag_ms: number;
  sample_size: number;
  confidence_interval?: number;
  timeframe: string;
  calculated_at: string;
}

export interface EvolutionState {
  generation: number;
  fitness_score: number;
  genes: Record<string, number>;
  learned_patterns?: unknown[];
  adaptation_history?: unknown[];
  total_predictions: number;
  last_mutation_at?: string;
}

export interface SystemReport {
  generatedAt: string;
  overallAccuracy: number;
  securityMetrics: SecurityMetrics[];
  topCorrelations: MarketCorrelation[];
  evolutionState: EvolutionState | null;
  recentPredictions: unknown[];
  summary: {
    totalSecurities: number;
    totalPredictions: number;
    avgDirectionAccuracy: number;
    generation: number;
    systemFitness: number;
  };
}

export interface MarketLearningState {
  isConnected: boolean;
  isCollecting: boolean;
  lastUpdate: Date | null;
  securityMetrics: SecurityMetrics[];
  correlations: MarketCorrelation[];
  evolutionState: EvolutionState | null;
  report: SystemReport | null;
  ticksCollectedToday: number;
  predictionsToday: number;
  error: string | null;
}

export function useMarketLearningSystem(autoSync = true) {
  const [state, setState] = useState<MarketLearningState>({
    isConnected: false,
    isCollecting: false,
    lastUpdate: null,
    securityMetrics: [],
    correlations: [],
    evolutionState: null,
    report: null,
    ticksCollectedToday: 0,
    predictionsToday: 0,
    error: null
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch security metrics
  const fetchSecurityMetrics = useCallback(async () => {
    const { data, error } = await supabase
      .from('security_accuracy_metrics')
      .select('*')
      .order('composite_accuracy', { ascending: false });

    if (!error && data) {
      setState(prev => ({
        ...prev,
        securityMetrics: data as SecurityMetrics[],
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Fetch correlations
  const fetchCorrelations = useCallback(async () => {
    const { data, error } = await supabase
      .from('market_correlations')
      .select('*')
      .order('correlation_coefficient', { ascending: false });

    if (!error && data) {
      setState(prev => ({
        ...prev,
        correlations: data as MarketCorrelation[],
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Fetch evolution state
  const fetchEvolutionState = useCallback(async () => {
    const { data, error } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('state_type', 'global')
      .single();

    if (!error && data) {
      setState(prev => ({
        ...prev,
        evolutionState: data as EvolutionState,
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Trigger background collection
  const triggerCollection = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-collector', {
        body: { action: 'collect' }
      });

      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        isCollecting: true,
        ticksCollectedToday: prev.ticksCollectedToday + (data?.ticksCollected || 0)
      }));

      return data;
    } catch (error) {
      console.error('Collection error:', error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
      return null;
    }
  }, []);

  // Trigger prediction resolution
  const triggerResolution = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-collector', {
        body: { action: 'resolve' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Resolution error:', error);
      return null;
    }
  }, []);

  // Trigger correlation calculation
  const triggerCorrelation = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-collector', {
        body: { action: 'correlate' }
      });

      if (error) throw error;
      await fetchCorrelations();
      return data;
    } catch (error) {
      console.error('Correlation error:', error);
      return null;
    }
  }, [fetchCorrelations]);

  // Trigger evolution
  const triggerEvolution = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-collector', {
        body: { action: 'evolve' }
      });

      if (error) throw error;
      await fetchEvolutionState();
      return data;
    } catch (error) {
      console.error('Evolution error:', error);
      return null;
    }
  }, [fetchEvolutionState]);

  // Generate comprehensive report
  const generateReport = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-collector', {
        body: { action: 'report' }
      });

      if (error) throw error;
      
      if (data?.report) {
        setState(prev => ({
          ...prev,
          report: data.report as SystemReport,
          lastUpdate: new Date()
        }));
      }

      return data?.report;
    } catch (error) {
      console.error('Report error:', error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
      return null;
    }
  }, []);

  // Record a new prediction
  const recordPrediction = useCallback(async (prediction: {
    symbol: string;
    predicted_direction: string;
    predicted_confidence: number;
    predicted_magnitude?: number;
    entry_price: number;
    prediction_horizon_ms: number;
    market_conditions?: Record<string, unknown>;
    correlated_assets?: Record<string, unknown>;
  }) => {
    try {
      const insertData = {
        symbol: prediction.symbol,
        predicted_direction: prediction.predicted_direction,
        predicted_confidence: prediction.predicted_confidence,
        predicted_magnitude: prediction.predicted_magnitude,
        entry_price: prediction.entry_price,
        prediction_horizon_ms: prediction.prediction_horizon_ms,
        market_conditions: prediction.market_conditions ? JSON.parse(JSON.stringify(prediction.market_conditions)) : null,
        correlated_assets: prediction.correlated_assets ? JSON.parse(JSON.stringify(prediction.correlated_assets)) : null
      };
      
      const { data, error } = await supabase
        .from('prediction_outcomes')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        predictionsToday: prev.predictionsToday + 1
      }));

      return data;
    } catch (error) {
      console.error('Record prediction error:', error);
      return null;
    }
  }, []);

  // Sync all data
  const syncAll = useCallback(async () => {
    await Promise.all([
      fetchSecurityMetrics(),
      fetchCorrelations(),
      fetchEvolutionState()
    ]);
    setState(prev => ({ ...prev, isConnected: true }));
  }, [fetchSecurityMetrics, fetchCorrelations, fetchEvolutionState]);

  // Heartbeat for continuous sync
  const heartbeat = useLiveHeartbeat({
    interval: 30000, // 30 seconds
    autoStart: autoSync,
    enabled: autoSync,
    onPulse: async () => {
      await triggerCollection();
      await triggerResolution();
      await syncAll();
    }
  });

  // Set up realtime subscriptions
  useEffect(() => {
    if (!autoSync) return;

    channelRef.current = supabase
      .channel('market-learning')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'security_accuracy_metrics' },
        () => fetchSecurityMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evolution_state' },
        () => fetchEvolutionState()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prediction_outcomes' },
        () => {
          setState(prev => ({
            ...prev,
            predictionsToday: prev.predictionsToday + 1
          }));
        }
      )
      .subscribe((status) => {
        setState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));
      });

    // Initial sync
    syncAll();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [autoSync, fetchSecurityMetrics, fetchEvolutionState, syncAll]);

  return {
    ...state,
    heartbeat,
    actions: {
      triggerCollection,
      triggerResolution,
      triggerCorrelation,
      triggerEvolution,
      generateReport,
      recordPrediction,
      syncAll
    }
  };
}
