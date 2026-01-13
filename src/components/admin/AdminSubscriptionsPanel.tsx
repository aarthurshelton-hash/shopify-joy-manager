import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Crown,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, addDays } from 'date-fns';

export const AdminSubscriptionsPanel: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch subscriptions with user info
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get profiles for all subscription users
      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds.length > 0 ? userIds : ['none']);

      return data?.map(sub => ({
        ...sub,
        profile: profiles?.find(p => p.user_id === sub.user_id),
      })) || [];
    },
    staleTime: 30000,
  });

  // Calculate stats
  const stats = {
    active: subscriptions?.filter(s => s.subscription_status === 'active').length || 0,
    canceled: subscriptions?.filter(s => s.subscription_status === 'canceled').length || 0,
    pastDue: subscriptions?.filter(s => s.subscription_status === 'past_due').length || 0,
    trialing: subscriptions?.filter(s => s.subscription_status === 'trialing').length || 0,
    mrr: (subscriptions?.filter(s => s.subscription_status === 'active').length || 0) * 700, // $7/month
    expiringThisWeek: subscriptions?.filter(s => {
      if (!s.current_period_end || s.subscription_status !== 'active') return false;
      const endDate = new Date(s.current_period_end);
      const weekFromNow = addDays(new Date(), 7);
      return endDate <= weekFromNow && endDate > new Date();
    }).length || 0,
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />Trialing</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-xs">Active</span>
            </div>
            <p className="text-xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-3 w-3" />
              <span className="text-xs">Canceled</span>
            </div>
            <p className="text-xl font-bold">{stats.canceled}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Past Due</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{stats.pastDue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">Trialing</span>
            </div>
            <p className="text-xl font-bold">{stats.trialing}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">MRR</span>
            </div>
            <p className="text-xl font-bold text-primary">{formatCents(stats.mrr)}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" />
              <span className="text-xs">Expiring Soon</span>
            </div>
            <p className="text-xl font-bold text-orange-500">{stats.expiringThisWeek}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subscriptions</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="canceled">Canceled</SelectItem>
          <SelectItem value="past_due">Past Due</SelectItem>
          <SelectItem value="trialing">Trialing</SelectItem>
        </SelectContent>
      </Select>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Database
          </CardTitle>
          <CardDescription>
            All premium subscriptions with renewal tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {subscriptions?.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={sub.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {sub.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium">{sub.profile?.display_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {getStatusBadge(sub.subscription_status)}

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Period End</p>
                        <p className="font-medium">
                          {sub.current_period_end 
                            ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </div>

                      {sub.cancel_at_period_end && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Canceling
                        </Badge>
                      )}

                      {sub.grace_period_end && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Grace Period</p>
                          <p className="font-medium text-orange-500">
                            {format(new Date(sub.grace_period_end), 'MMM d')}
                          </p>
                        </div>
                      )}

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {subscriptions?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subscriptions found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
