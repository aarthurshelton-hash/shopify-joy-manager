/**
 * Live Accuracy Metrics Hook v1.0
 * 
 * Provides real-time accuracy metrics with Supabase subscriptions.
 * Integrates with meta-learning and disagreement analysis systems.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getGlobalDisagreementStats,
  ELO_TIERS,
} from '@/lib/chess/accuracy';

export interface LiveAccuracyMetrics {
  // Overall stats
  overallAccuracy: number;
  totalPredictions: number;
  hybridWins: number;
  stockfishWins: number;
  
  // Disagreement analysis
  disagreementWinRate: number;
  totalDisagreements: number;
  enpensentWins: number;
  
  // By archetype
  archetypeAccuracy: Map<string, { total: number; correct: number; accuracy: number }>;
  
  // By ELO tier
  eloTierAccuracy: Map<string, { total: number; correct: number; accuracy: number }>;
  
  // Adaptive sampling weights
  adaptiveWeights: Record<string, number>;
  
  // Universal resonance
  universalResonance: number;
  
  // Meta
  lastUpdate: Date;
  isLive: boolean;
  updateCount: number;
}

const initialMetrics: LiveAccuracyMetrics = {
  overallAccuracy: 0,
  totalPredictions: 0,
  hybridWins: 0,
  stockfishWins: 0,
  disagreementWinRate: 0,
  totalDisagreements: 0,
  enpensentWins: 0,
  archetypeAccuracy: new Map(),
  eloTierAccuracy: new Map(),
  adaptiveWeights: {},
  universalResonance: 0.5,
  lastUpdate: new Date(),
  isLive: false,
  updateCount: 0,
};

export function useLiveAccuracyMetrics() {
  const [metrics, setMetrics] = useState<LiveAccuracyMetrics>(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);

  const calculateMetrics = useCallback(async () => {
    try {
      const { data: predictions, error } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_archetype, hybrid_correct, stockfish_correct, white_elo, black_elo');

      if (error) throw error;

      const total = predictions?.length || 0;
      const hybridCorrect = predictions?.filter(p => p.hybrid_correct).length || 0;
      const stockfishCorrect = predictions?.filter(p => p.stockfish_correct).length || 0;

      // Disagreement analysis
      const disagreements = predictions?.filter(p => p.hybrid_correct !== p.stockfish_correct) || [];
      const enpensentWins = disagreements.filter(p => p.hybrid_correct).length;

      // Archetype aggregation
      const archetypeMap = new Map<string, { total: number; correct: number; accuracy: number }>();
      for (const p of predictions || []) {
        const arch = p.hybrid_archetype || 'unknown';
        const entry = archetypeMap.get(arch) || { total: 0, correct: 0, accuracy: 0 };
        entry.total++;
        if (p.hybrid_correct) entry.correct++;
        entry.accuracy = (entry.correct / entry.total) * 100;
        archetypeMap.set(arch, entry);
      }

      // ELO tier aggregation
      const eloTierMap = new Map<string, { total: number; correct: number; accuracy: number }>();
      for (const p of predictions || []) {
        const avgElo = ((p.white_elo || 1500) + (p.black_elo || 1500)) / 2;
        let tier = 'unknown';
        for (const t of ELO_TIERS) {
          if (avgElo >= t.range[0] && avgElo < t.range[1]) {
            tier = t.name;
            break;
          }
        }
        const entry = eloTierMap.get(tier) || { total: 0, correct: 0, accuracy: 0 };
        entry.total++;
        if (p.hybrid_correct) entry.correct++;
        entry.accuracy = (entry.correct / entry.total) * 100;
        eloTierMap.set(tier, entry);
      }

      // Get base weights from tier config
      const adaptiveWeights: Record<string, number> = {};
      for (const t of ELO_TIERS) {
        adaptiveWeights[t.name] = t.baseWeight;
      }

      // Calculate universal resonance from global stats
      const globalStats = getGlobalDisagreementStats();
      const universalResonance = globalStats.totalDisagreements > 0
        ? globalStats.enPensentWins / globalStats.totalDisagreements
        : 0.5;

      setMetrics(prev => ({
        overallAccuracy: total > 0 ? (hybridCorrect / total) * 100 : 0,
        totalPredictions: total,
        hybridWins: hybridCorrect,
        stockfishWins: stockfishCorrect,
        disagreementWinRate: disagreements.length > 0 
          ? (enpensentWins / disagreements.length) * 100 : 0,
        totalDisagreements: disagreements.length,
        enpensentWins,
        archetypeAccuracy: archetypeMap,
        eloTierAccuracy: eloTierMap,
        adaptiveWeights,
        universalResonance,
        lastUpdate: new Date(),
        isLive: true,
        updateCount: prev.updateCount + 1,
      }));

      setIsLoading(false);
    } catch (err) {
      console.error('[useLiveAccuracyMetrics] Error:', err);
      setIsLoading(false);
    }
  }, []);

  // Initial load and real-time subscription
  useEffect(() => {
    calculateMetrics();

    const channel = supabase
      .channel('live-accuracy-metrics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' },
        () => calculateMetrics()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_benchmark_results' },
        () => calculateMetrics()
      )
      .subscribe();

    // Periodic refresh every 30 seconds
    const interval = setInterval(calculateMetrics, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [calculateMetrics]);

  return { metrics, isLoading, refresh: calculateMetrics };
}

export default useLiveAccuracyMetrics;
