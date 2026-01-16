/**
 * Realtime Accuracy Hook
 * Ensures all accuracy metrics auto-update across the entire En Pensent platform
 * Subscribes to prediction outcomes, evolution state, and security metrics
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTradingSessionStore } from '@/stores/tradingSessionStore';
import { selfEvolvingSystem } from '@/lib/pensent-core/domains/finance/selfEvolvingSystem';
import { useQueryClient } from '@tanstack/react-query';

export interface RealtimeAccuracyState {
  isConnected: boolean;
  lastUpdate: Date | null;
  updateCount: number;
  channels: string[];
}

export interface AccuracyUpdate {
  type: 'prediction' | 'evolution' | 'security' | 'correlation';
  data: unknown;
  timestamp: Date;
}

type AccuracyListener = (update: AccuracyUpdate) => void;
const accuracyListeners: Set<AccuracyListener> = new Set();

export function subscribeToAccuracyUpdates(listener: AccuracyListener): () => void {
  accuracyListeners.add(listener);
  return () => accuracyListeners.delete(listener);
}

function broadcastAccuracyUpdate(update: AccuracyUpdate) {
  accuracyListeners.forEach(listener => listener(update));
}

export function useRealtimeAccuracy(enabled = true) {
  const queryClient = useQueryClient();
  const { syncEvolutionState, globalAccuracy } = useTradingSessionStore();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  
  const [state, setState] = useState<RealtimeAccuracyState>({
    isConnected: false,
    lastUpdate: null,
    updateCount: 0,
    channels: []
  });

  // Sync all accuracy data from database
  const syncAccuracyData = useCallback(async () => {
    try {
      // Sync evolution state from local system
      syncEvolutionState();
      
      // Fetch latest security metrics
      const { data: securityMetrics } = await supabase
        .from('security_accuracy_metrics')
        .select('*')
        .order('composite_accuracy', { ascending: false });
      
      if (securityMetrics) {
        broadcastAccuracyUpdate({
          type: 'security',
          data: securityMetrics,
          timestamp: new Date()
        });
      }

      // Fetch latest evolution state
      const { data: evolutionData } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();

      if (evolutionData) {
        broadcastAccuracyUpdate({
          type: 'evolution',
          data: evolutionData,
          timestamp: new Date()
        });
      }

      // Fetch latest correlations
      const { data: correlations } = await supabase
        .from('market_correlations')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(50);

      if (correlations) {
        broadcastAccuracyUpdate({
          type: 'correlation',
          data: correlations,
          timestamp: new Date()
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['security-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-state'] });
      queryClient.invalidateQueries({ queryKey: ['market-correlations'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-outcomes'] });

      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        updateCount: prev.updateCount + 1
      }));
    } catch (error) {
      console.error('[RealtimeAccuracy] Sync error:', error);
    }
  }, [syncEvolutionState, queryClient]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!enabled) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Prediction outcomes channel
    const predictionChannel = supabase
      .channel('realtime-predictions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prediction_outcomes' },
        (payload) => {
          console.log('[RealtimeAccuracy] Prediction update:', payload.eventType);
          syncEvolutionState();
          selfEvolvingSystem.getState(); // Trigger recalculation
          
          broadcastAccuracyUpdate({
            type: 'prediction',
            data: payload.new,
            timestamp: new Date()
          });

          setState(prev => ({
            ...prev,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['prediction-outcomes'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeAccuracy] Prediction channel connected');
        }
      });
    channels.push(predictionChannel);

    // Evolution state channel
    const evolutionChannel = supabase
      .channel('realtime-evolution')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evolution_state' },
        (payload) => {
          console.log('[RealtimeAccuracy] Evolution update:', payload.eventType);
          syncEvolutionState();
          
          broadcastAccuracyUpdate({
            type: 'evolution',
            data: payload.new,
            timestamp: new Date()
          });

          setState(prev => ({
            ...prev,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));

          queryClient.invalidateQueries({ queryKey: ['evolution-state'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeAccuracy] Evolution channel connected');
        }
      });
    channels.push(evolutionChannel);

    // Security metrics channel
    const securityChannel = supabase
      .channel('realtime-security-metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'security_accuracy_metrics' },
        (payload) => {
          console.log('[RealtimeAccuracy] Security metrics update:', payload.eventType);
          
          broadcastAccuracyUpdate({
            type: 'security',
            data: payload.new,
            timestamp: new Date()
          });

          setState(prev => ({
            ...prev,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));

          queryClient.invalidateQueries({ queryKey: ['security-metrics'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeAccuracy] Security metrics channel connected');
        }
      });
    channels.push(securityChannel);

    // Market correlations channel
    const correlationChannel = supabase
      .channel('realtime-correlations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_correlations' },
        (payload) => {
          console.log('[RealtimeAccuracy] Correlation update:', payload.eventType);
          
          broadcastAccuracyUpdate({
            type: 'correlation',
            data: payload.new,
            timestamp: new Date()
          });

          setState(prev => ({
            ...prev,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));

          queryClient.invalidateQueries({ queryKey: ['market-correlations'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeAccuracy] Correlation channel connected');
        }
      });
    channels.push(correlationChannel);

    channelsRef.current = channels;

    setState(prev => ({
      ...prev,
      isConnected: true,
      channels: ['predictions', 'evolution', 'security', 'correlations']
    }));

    // Initial sync
    syncAccuracyData();

    // Periodic sync every 5 seconds for local state
    const syncInterval = setInterval(() => {
      syncEvolutionState();
    }, 5000);

    return () => {
      clearInterval(syncInterval);
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setState(prev => ({ ...prev, isConnected: false, channels: [] }));
    };
  }, [enabled, syncEvolutionState, queryClient, syncAccuracyData]);

  return {
    ...state,
    globalAccuracy,
    syncAccuracyData,
    subscribeToUpdates: subscribeToAccuracyUpdates
  };
}
