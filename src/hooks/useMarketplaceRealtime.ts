import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ListingChange = {
  id: string;
  visualization_id: string;
  seller_id: string;
  price_cents: number;
  status: 'active' | 'sold' | 'cancelled';
  buyer_id: string | null;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
};

type VisionScoreChange = {
  id: string;
  visualization_id: string;
  total_score: number;
  view_count: number;
  download_hd_count: number;
  download_gif_count: number;
  print_order_count: number;
  print_revenue_cents: number;
  royalty_cents_earned: number;
  royalty_orders_count: number;
  trade_count: number;
  unique_viewers: number;
  updated_at: string;
};

interface UseMarketplaceRealtimeOptions {
  onListingChange?: (payload: RealtimePostgresChangesPayload<ListingChange>) => void;
  onScoreChange?: (payload: RealtimePostgresChangesPayload<VisionScoreChange>) => void;
  enabled?: boolean;
}

export function useMarketplaceRealtime({
  onListingChange,
  onScoreChange,
  enabled = true,
}: UseMarketplaceRealtimeOptions = {}) {
  const handleListingChange = useCallback(
    (payload: RealtimePostgresChangesPayload<ListingChange>) => {
      onListingChange?.(payload);
    },
    [onListingChange]
  );

  const handleScoreChange = useCallback(
    (payload: RealtimePostgresChangesPayload<VisionScoreChange>) => {
      onScoreChange?.(payload);
    },
    [onScoreChange]
  );

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('marketplace-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visualization_listings',
        },
        handleListingChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vision_scores',
        },
        handleScoreChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, handleListingChange, handleScoreChange]);
}

// Hook specifically for a user's visualizations (My Vision page)
interface UseMyVisionRealtimeOptions {
  userId?: string;
  onVisualizationChange?: () => void;
  onScoreChange?: (visualizationId: string) => void;
  enabled?: boolean;
}

export function useMyVisionRealtime({
  userId,
  onVisualizationChange,
  onScoreChange,
  enabled = true,
}: UseMyVisionRealtimeOptions = {}) {
  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase
      .channel(`my-vision-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_visualizations',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onVisualizationChange?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vision_scores',
        },
        (payload) => {
          const vizId = (payload.new as { visualization_id?: string })?.visualization_id;
          if (vizId) {
            onScoreChange?.(vizId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visualization_listings',
          filter: `seller_id=eq.${userId}`,
        },
        () => {
          onVisualizationChange?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, userId, onVisualizationChange, onScoreChange]);
}
