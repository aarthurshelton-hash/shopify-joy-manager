import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionNotification {
  id: string;
  user_id: string;
  notification_type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface GracePeriodStatus {
  isInGracePeriod: boolean;
  gracePeriodEnd: Date | null;
  daysRemaining: number;
}

export function useSubscriptionNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SubscriptionNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [gracePeriodStatus, setGracePeriodStatus] = useState<GracePeriodStatus>({
    isInGracePeriod: false,
    gracePeriodEnd: null,
    daysRemaining: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchGracePeriodStatus = useCallback(async () => {
    if (!user) {
      setGracePeriodStatus({
        isInGracePeriod: false,
        gracePeriodEnd: null,
        daysRemaining: 0,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('grace_period_end, subscription_status')
        .eq('user_id', user.id)
        .single();

      if (error || !data?.grace_period_end) {
        setGracePeriodStatus({
          isInGracePeriod: false,
          gracePeriodEnd: null,
          daysRemaining: 0,
        });
        return;
      }

      const gracePeriodEnd = new Date(data.grace_period_end);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      setGracePeriodStatus({
        isInGracePeriod: gracePeriodEnd > now,
        gracePeriodEnd,
        daysRemaining,
      });
    } catch (error) {
      console.error('Error fetching grace period status:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('subscription_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('subscription_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchNotifications();
    fetchGracePeriodStatus();
  }, [fetchNotifications, fetchGracePeriodStatus]);

  // Set up realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as SubscriptionNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    gracePeriodStatus,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
