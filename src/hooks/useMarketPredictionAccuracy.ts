/**
 * Hook for market prediction accuracy stats from the audit trail.
 * Mirrors useRealtimeAccuracy pattern but for the market domain.
 * All data from real Supabase queries — no estimates.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMarketAccuracyStats,
  resolveExpiredPredictions,
  type MarketAccuracyStats,
} from '@/lib/pensent-core/domains/finance/marketPredictionAudit';
import { supabase } from '@/integrations/supabase/client';

interface UseMarketPredictionAccuracyOptions {
  autoResolve?: boolean;
  refreshInterval?: number;
}

/**
 * Simple Yahoo Finance price lookup via Supabase edge function.
 * Returns null if unavailable — never fakes data.
 */
async function lookupPrice(symbol: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.functions.invoke('stock-data', {
      body: { symbol },
    });
    if (error || !data?.price) return null;
    return data.price;
  } catch {
    return null;
  }
}

export function useMarketPredictionAccuracy(
  options: UseMarketPredictionAccuracyOptions = {}
) {
  const { autoResolve = false, refreshInterval = 60000 } = options;
  const [resolving, setResolving] = useState(false);
  const [lastResolved, setLastResolved] = useState<{ resolved: number; errors: number } | null>(null);

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<MarketAccuracyStats | null>({
    queryKey: ['market-prediction-accuracy'],
    queryFn: getMarketAccuracyStats,
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });

  const triggerResolve = useCallback(async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const result = await resolveExpiredPredictions(lookupPrice);
      setLastResolved(result);
      if (result.resolved > 0) {
        refetch();
      }
    } finally {
      setResolving(false);
    }
  }, [resolving, refetch]);

  // Auto-resolve expired predictions periodically
  useEffect(() => {
    if (!autoResolve) return;

    // Resolve on mount
    triggerResolve();

    // Then every 5 minutes
    const interval = setInterval(triggerResolve, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoResolve, triggerResolve]);

  return {
    stats,
    isLoading,
    error,
    refetch,
    resolving,
    lastResolved,
    triggerResolve,
  };
}
