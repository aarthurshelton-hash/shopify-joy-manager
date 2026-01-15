import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface WalletChange {
  id: string;
  user_id: string;
  balance_cents: number;
  total_deposited_cents: number;
  total_withdrawn_cents: number;
  total_earned_cents: number;
  total_spent_cents: number;
  created_at: string;
  updated_at: string;
}

interface TransactionChange {
  id: string;
  user_id: string;
  transaction_type: string;
  amount_cents: number;
  balance_after_cents: number;
  related_listing_id: string | null;
  counterparty_id: string | null;
  description: string | null;
  created_at: string;
}

interface UseWalletRealtimeOptions {
  onWalletChange?: (wallet: WalletChange) => void;
  onTransactionChange?: (transaction: TransactionChange) => void;
  enabled?: boolean;
}

/**
 * Hook for real-time wallet balance and transaction updates
 * Ensures wallet data stays synchronized across the app
 */
export function useWalletRealtime({
  onWalletChange,
  onTransactionChange,
  enabled = true,
}: UseWalletRealtimeOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const handleWalletChange = useCallback(
    (payload: RealtimePostgresChangesPayload<WalletChange>) => {
      const newData = payload.new as WalletChange;
      if (newData) {
        onWalletChange?.(newData);
        // Invalidate related queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
        queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      }
    },
    [onWalletChange, queryClient]
  );

  const handleTransactionChange = useCallback(
    (payload: RealtimePostgresChangesPayload<TransactionChange>) => {
      const newData = payload.new as TransactionChange;
      if (newData) {
        onTransactionChange?.(newData);
        // Invalidate transaction queries
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      }
    },
    [onTransactionChange, queryClient]
  );

  useEffect(() => {
    if (!enabled || !user?.id) {
      setIsConnected(false);
      return;
    }

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        handleWalletChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        handleTransactionChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [enabled, user?.id, handleWalletChange, handleTransactionChange]);

  return { isConnected };
}
