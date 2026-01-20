/**
 * Realtime Accuracy Hook v6.63
 * Ensures all accuracy metrics auto-update across the entire En Pensent platform
 * Now includes chess_prediction_attempts for FIDE ELO and cumulative stats sync
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

export interface ChessCumulativeStats {
  totalGames: number;
  hybridWins: number;
  stockfishWins: number;
  bothCorrect: number;
  bothWrong: number;
  hybridAccuracy: number;
  stockfishAccuracy: number;
  avgConfidence: number;
}

export interface AccuracyUpdate {
  type: 'prediction' | 'evolution' | 'security' | 'correlation' | 'chess';
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

// Cached chess stats with timestamp for efficient querying
let cachedChessStats: ChessCumulativeStats | null = null;
let lastChessStatsFetch = 0;
const CHESS_STATS_CACHE_MS = 2000; // 2 second cache

/**
 * Fetch cumulative chess stats directly from database
 * Uses count queries to bypass 1000 row limit
 */
export async function fetchChessCumulativeStats(): Promise<ChessCumulativeStats> {
  // Return cached if fresh
  if (cachedChessStats && Date.now() - lastChessStatsFetch < CHESS_STATS_CACHE_MS) {
    return cachedChessStats;
  }

  const [
    { count: totalGames },
    { count: hybridWins },
    { count: sfWins },
    { count: bothCorrect },
    { count: hybridCorrect },
    { count: sfCorrect },
  ] = await Promise.all([
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown')
      .not('hybrid_prediction', 'is', null)
      .neq('hybrid_prediction', 'unknown'),
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .eq('stockfish_correct', false)
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown'),
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', false)
      .eq('stockfish_correct', true)
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown'),
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .eq('stockfish_correct', true)
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown'),
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown'),
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('stockfish_correct', true)
      .not('stockfish_prediction', 'is', null)
      .neq('stockfish_prediction', 'unknown'),
  ]);

  const total = totalGames || 0;
  const epWins = hybridWins || 0;
  const stockfishWinsCount = sfWins || 0;
  const bothCorrectCount = bothCorrect || 0;
  const bothWrongCount = total - epWins - stockfishWinsCount - bothCorrectCount;

  const stats: ChessCumulativeStats = {
    totalGames: total,
    hybridWins: epWins,
    stockfishWins: stockfishWinsCount,
    bothCorrect: bothCorrectCount,
    bothWrong: Math.max(0, bothWrongCount),
    hybridAccuracy: total > 0 ? ((hybridCorrect || 0) / total) * 100 : 0,
    stockfishAccuracy: total > 0 ? ((sfCorrect || 0) / total) * 100 : 0,
    avgConfidence: 0.7, // Approximate - full calculation would require fetching rows
  };

  cachedChessStats = stats;
  lastChessStatsFetch = Date.now();
  
  return stats;
}

/**
 * Force invalidate chess stats cache
 */
export function invalidateChessStatsCache() {
  cachedChessStats = null;
  lastChessStatsFetch = 0;
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
  
  const [chessStats, setChessStats] = useState<ChessCumulativeStats | null>(null);

  // Sync all accuracy data from database
  const syncAccuracyData = useCallback(async () => {
    try {
      // Sync evolution state from local system
      syncEvolutionState();
      
      // Fetch chess cumulative stats
      const freshChessStats = await fetchChessCumulativeStats();
      setChessStats(freshChessStats);
      
      broadcastAccuracyUpdate({
        type: 'chess',
        data: freshChessStats,
        timestamp: new Date()
      });
      
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
      queryClient.invalidateQueries({ queryKey: ['chess-cumulative-stats'] });
      queryClient.invalidateQueries({ queryKey: ['benchmark-stats'] });

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

    // Chess prediction attempts channel - CRITICAL for FIDE ELO updates
    const chessChannel = supabase
      .channel('realtime-chess-predictions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' },
        async (payload) => {
          console.log('[RealtimeAccuracy] Chess prediction update:', payload.eventType);
          
          // Invalidate cache and refetch
          invalidateChessStatsCache();
          const freshStats = await fetchChessCumulativeStats();
          setChessStats(freshStats);
          
          broadcastAccuracyUpdate({
            type: 'chess',
            data: freshStats,
            timestamp: new Date()
          });

          setState(prev => ({
            ...prev,
            lastUpdate: new Date(),
            updateCount: prev.updateCount + 1
          }));

          queryClient.invalidateQueries({ queryKey: ['chess-cumulative-stats'] });
          queryClient.invalidateQueries({ queryKey: ['benchmark-stats'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeAccuracy] Chess predictions channel connected');
        }
      });
    channels.push(chessChannel);

    // Prediction outcomes channel
    const predictionChannel = supabase
      .channel('realtime-predictions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prediction_outcomes' },
        (payload) => {
          console.log('[RealtimeAccuracy] Prediction update:', payload.eventType);
          syncEvolutionState();
          selfEvolvingSystem.getState();
          
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
      channels: ['chess', 'predictions', 'evolution', 'security', 'correlations']
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
    chessStats,
    syncAccuracyData,
    subscribeToUpdates: subscribeToAccuracyUpdates
  };
}
