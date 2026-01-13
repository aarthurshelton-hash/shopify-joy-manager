import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity,
  Eye,
  Download,
  Printer,
  ArrowRightLeft,
  Crown,
  Wallet,
  ShoppingBag,
  UserPlus,
  Image,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_id?: string;
  value?: number;
}

export const AdminActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Fetch recent activities from multiple sources
  const { data: activityData, isLoading, refetch } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      const [
        visionsResult,
        interactionsResult,
        transactionsResult,
        subscriptionsResult,
        listingsResult,
        withdrawalsResult,
      ] = await Promise.all([
        // Recent visions created
        supabase
          .from('saved_visualizations')
          .select('id, title, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent interactions
        supabase
          .from('vision_interactions')
          .select('id, interaction_type, user_id, value_cents, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Recent wallet transactions
        supabase
          .from('wallet_transactions')
          .select('id, transaction_type, amount_cents, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent subscriptions
        supabase
          .from('user_subscriptions')
          .select('id, subscription_status, user_id, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(10),
        
        // Recent listings
        supabase
          .from('visualization_listings')
          .select('id, status, price_cents, seller_id, created_at, sold_at')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent withdrawals
        supabase
          .from('withdrawal_requests')
          .select('id, status, amount_cents, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const allActivities: ActivityItem[] = [];

      // Vision creations
      visionsResult.data?.forEach(v => {
        allActivities.push({
          id: `vision-${v.id}`,
          type: 'vision_created',
          description: `New vision created: "${v.title}"`,
          timestamp: v.created_at,
          user_id: v.user_id || undefined,
        });
      });

      // Interactions
      interactionsResult.data?.forEach(i => {
        const desc = {
          view: 'Vision viewed',
          download_hd: 'HD download',
          download_gif: 'GIF download',
          print_order: 'Print ordered',
          trade: 'Trade completed',
        }[i.interaction_type] || i.interaction_type;

        allActivities.push({
          id: `interaction-${i.id}`,
          type: i.interaction_type,
          description: desc,
          timestamp: i.created_at,
          user_id: i.user_id || undefined,
          value: i.value_cents,
        });
      });

      // Transactions
      transactionsResult.data?.forEach(t => {
        allActivities.push({
          id: `tx-${t.id}`,
          type: `wallet_${t.transaction_type}`,
          description: `Wallet ${t.transaction_type}: $${(Math.abs(t.amount_cents) / 100).toFixed(2)}`,
          timestamp: t.created_at,
          user_id: t.user_id,
          value: t.amount_cents,
        });
      });

      // Subscriptions
      subscriptionsResult.data?.forEach(s => {
        allActivities.push({
          id: `sub-${s.id}`,
          type: `subscription_${s.subscription_status}`,
          description: `Subscription ${s.subscription_status}`,
          timestamp: s.updated_at,
          user_id: s.user_id,
        });
      });

      // Listings
      listingsResult.data?.forEach(l => {
        if (l.status === 'sold' && l.sold_at) {
          allActivities.push({
            id: `listing-${l.id}`,
            type: 'marketplace_sale',
            description: `Marketplace sale: $${(l.price_cents / 100).toFixed(2)}`,
            timestamp: l.sold_at,
            user_id: l.seller_id,
            value: l.price_cents,
          });
        } else if (l.status === 'active') {
          allActivities.push({
            id: `listing-${l.id}`,
            type: 'listing_created',
            description: `New listing: $${(l.price_cents / 100).toFixed(2)}`,
            timestamp: l.created_at,
            user_id: l.seller_id,
            value: l.price_cents,
          });
        }
      });

      // Withdrawals
      withdrawalsResult.data?.forEach(w => {
        allActivities.push({
          id: `withdrawal-${w.id}`,
          type: `withdrawal_${w.status}`,
          description: `Withdrawal ${w.status}: $${(w.amount_cents / 100).toFixed(2)}`,
          timestamp: w.created_at,
          user_id: w.user_id,
          value: w.amount_cents,
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return allActivities.slice(0, 50);
    },
    staleTime: 10000, // Refresh more frequently
  });

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vision_interactions' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visualization_listings' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests' },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const getActivityIcon = (type: string) => {
    if (type.includes('view')) return <Eye className="h-4 w-4" />;
    if (type.includes('download')) return <Download className="h-4 w-4" />;
    if (type.includes('print')) return <Printer className="h-4 w-4" />;
    if (type.includes('trade') || type.includes('marketplace')) return <ArrowRightLeft className="h-4 w-4" />;
    if (type.includes('subscription')) return <Crown className="h-4 w-4" />;
    if (type.includes('wallet') || type.includes('withdrawal')) return <Wallet className="h-4 w-4" />;
    if (type.includes('vision')) return <Image className="h-4 w-4" />;
    if (type.includes('listing')) return <ShoppingBag className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    if (type.includes('sale') || type.includes('completed')) return 'text-green-500 bg-green-500/10';
    if (type.includes('print')) return 'text-blue-500 bg-blue-500/10';
    if (type.includes('subscription_active')) return 'text-primary bg-primary/10';
    if (type.includes('canceled') || type.includes('rejected')) return 'text-red-500 bg-red-500/10';
    if (type.includes('withdrawal_pending')) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time platform activity monitoring
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {activityData?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  {activity.value !== undefined && activity.value > 0 && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      ${(activity.value / 100).toFixed(2)}
                    </Badge>
                  )}
                </div>
              ))}

              {(!activityData || activityData.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
