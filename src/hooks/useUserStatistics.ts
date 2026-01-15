import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserStatistics {
  user_id: string;
  generated_at: string;
  // Vision statistics
  total_visions_owned: number;
  total_visions_created: number;
  private_visions: number;
  public_visions: number;
  // Earnings statistics
  wallet_balance_cents: number;
  total_earned_cents: number;
  total_spent_cents: number;
  total_royalties_cents: number;
  // Marketplace activity
  active_listings: number;
  total_sales: number;
  total_purchases: number;
  pending_offers_received: number;
  pending_offers_sent: number;
  // Engagement metrics
  total_views_received: number;
  total_downloads_received: number;
  total_scans_received: number;
  portfolio_score: number;
  // Account info
  is_premium: boolean;
  member_since: string | null;
  last_activity: string | null;
}

export function useUserStatistics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-statistics', user?.id],
    queryFn: async (): Promise<UserStatistics | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_user_statistics', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching user statistics:', error);
        throw error;
      }

      return data as unknown as UserStatistics;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes - balance freshness with performance
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when connection restored
  });
}
