import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VisionNFT, VisionValueHistory } from '@/lib/nfts/visionNftApi';
import { getVisionNFT, getVisionNFTByVisualization, getVisionValueHistory } from '@/lib/nfts/visionNftApi';

interface UseVisionNFTOptions {
  visualizationId?: string;
  visionNftId?: string;
  enabled?: boolean;
}

interface UseVisionNFTReturn {
  visionNFT: VisionNFT | null;
  history: VisionValueHistory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVisionNFT({
  visualizationId,
  visionNftId,
  enabled = true,
}: UseVisionNFTOptions): UseVisionNFTReturn {
  const [visionNFT, setVisionNFT] = useState<VisionNFT | null>(null);
  const [history, setHistory] = useState<VisionValueHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    if (!visualizationId && !visionNftId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let nft: VisionNFT | null = null;

      if (visionNftId) {
        const { data, error } = await getVisionNFT(visionNftId);
        if (error) throw error;
        nft = data;
      } else if (visualizationId) {
        const { data, error } = await getVisionNFTByVisualization(visualizationId);
        if (error) throw error;
        nft = data;
      }

      setVisionNFT(nft);

      if (nft) {
        const { data: historyData, error: historyError } = await getVisionValueHistory(nft.id, 90);
        if (historyError) throw historyError;
        setHistory(historyData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [visualizationId, visionNftId, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up realtime subscription for value updates
  useEffect(() => {
    if (!enabled || !visionNFT?.id) return;

    const channel = supabase
      .channel(`vision-nft-${visionNFT.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vision_nfts',
          filter: `id=eq.${visionNFT.id}`,
        },
        (payload) => {
          setVisionNFT(payload.new as VisionNFT);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visionNFT?.id, enabled]);

  return {
    visionNFT,
    history,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Hook for portfolio tracking
export function usePortfolioValue(userId?: string) {
  const [totalValue, setTotalValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [gainPercentage, setGainPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      const { calculatePortfolioValue } = await import('@/lib/nfts/visionNftApi');
      const result = await calculatePortfolioValue(userId);
      
      if (!result.error) {
        setTotalValue(result.totalValueCents);
        setTotalGain(result.totalGainCents);
        setGainPercentage(result.gainPercentage);
      }
      setIsLoading(false);
    };

    fetchPortfolio();

    // Subscribe to updates
    const channel = supabase
      .channel(`portfolio-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vision_nfts',
          filter: `current_owner_id=eq.${userId}`,
        },
        () => {
          fetchPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { totalValue, totalGain, gainPercentage, isLoading };
}
