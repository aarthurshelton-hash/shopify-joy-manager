import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search,
  Crown,
  MapPin,
  Calendar,
  Eye,
  Image,
  Wallet,
  Mail,
  Phone,
  ChevronRight,
  User,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface AdminUserListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectUser: (userId: string) => void;
}

interface UserWithDetails {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  is_premium: boolean;
  vision_count: number;
  wallet_balance: number;
  total_orders: number;
  total_spent: number;
  last_activity: string | null;
}

export const AdminUserList: React.FC<AdminUserListProps> = ({
  searchQuery,
  setSearchQuery,
  onSelectUser,
}) => {
  // Fetch all users with their details
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-list', searchQuery],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, created_at');

      if (profilesError) throw profilesError;

      // Get subscription status for all users
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('user_id, subscription_status');

      // Get vision counts
      const { data: visions } = await supabase
        .from('saved_visualizations')
        .select('user_id');

      // Get wallet data
      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('user_id, balance_cents, total_spent_cents');

      // Get order counts
      const { data: orders } = await supabase
        .from('order_financials')
        .select('user_id');

      // Get recent activity
      const { data: interactions } = await supabase
        .from('vision_interactions')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      // Combine data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => {
        const subscription = subscriptions?.find(s => s.user_id === profile.user_id);
        const userVisions = visions?.filter(v => v.user_id === profile.user_id) || [];
        const wallet = wallets?.find(w => w.user_id === profile.user_id);
        const userOrders = orders?.filter(o => o.user_id === profile.user_id) || [];
        const lastInteraction = interactions?.find(i => i.user_id === profile.user_id);

        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          email: profile.display_name || 'Unknown',
          phone: null,
          created_at: profile.created_at,
          is_premium: subscription?.subscription_status === 'active',
          vision_count: userVisions.length,
          wallet_balance: wallet?.balance_cents || 0,
          total_orders: userOrders.length,
          total_spent: wallet?.total_spent_cents || 0,
          last_activity: lastInteraction?.created_at || null,
        };
      });

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return usersWithDetails.filter(u => 
          u.display_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.user_id.toLowerCase().includes(query)
        );
      }

      // Sort by most recent activity
      return usersWithDetails.sort((a, b) => {
        if (!a.last_activity) return 1;
        if (!b.last_activity) return -1;
        return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      });
    },
    staleTime: 30000,
  });

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Database
            </CardTitle>
            <CardDescription>
              Click on any user to view their complete profile and holdings
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
              {users?.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => onSelectUser(user.user_id)}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                        {user.is_premium ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                        {user.last_activity && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Active {formatDistanceToNow(new Date(user.last_activity), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Visions</p>
                      <p className="font-medium flex items-center gap-1 justify-end">
                        <Image className="h-3 w-3" />
                        {user.vision_count}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Wallet</p>
                      <p className="font-medium text-green-500">{formatCents(user.wallet_balance)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Orders</p>
                      <p className="font-medium">{user.total_orders}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-medium">{formatCents(user.total_spent)}</p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}

              {users?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching your search</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
