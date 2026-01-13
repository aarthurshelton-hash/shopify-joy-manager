import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Crown,
  Calendar,
  Eye,
  Image,
  Wallet,
  Mail,
  Phone,
  X,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ArrowRightLeft,
  Printer,
  Download,
  MapPin,
  Clock,
  User,
  Activity,
  Star,
  BarChart3,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface AdminUserDetailModalProps {
  userId: string;
  onClose: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  userId,
  onClose,
}) => {
  // Fetch complete user details
  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get visions with scores
      const { data: visions } = await supabase
        .from('saved_visualizations')
        .select(`
          id,
          title,
          created_at,
          image_path,
          game_data
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get vision scores for this user's visions
      const visionIds = visions?.map(v => v.id) || [];
      const { data: scores } = await supabase
        .from('vision_scores')
        .select('*')
        .in('visualization_id', visionIds.length > 0 ? visionIds : ['none']);

      // Get orders for this user
      const { data: orders } = await supabase
        .from('order_financials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get wallet transactions
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get marketplace listings
      const { data: listings } = await supabase
        .from('visualization_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      // Get interactions summary
      const { data: interactions } = await supabase
        .from('vision_interactions')
        .select('interaction_type, value_cents, created_at')
        .eq('user_id', userId);

      // Calculate portfolio value
      const portfolioValue = scores?.reduce((sum, s) => {
        return sum + (s.total_score || 0) * 10 + (s.royalty_cents_earned || 0);
      }, 0) || 0;

      // Calculate projected growth (simple 5% monthly projection)
      const projectedGrowth = portfolioValue * 0.05;

      return {
        profile,
        subscription,
        wallet,
        visions: visions?.map(v => {
          const score = scores?.find(s => s.visualization_id === v.id);
          return {
            ...v,
            score: score?.total_score || 0,
            views: score?.view_count || 0,
            downloads: (score?.download_hd_count || 0) + (score?.download_gif_count || 0),
            trades: score?.trade_count || 0,
            printOrders: score?.print_order_count || 0,
            royaltyEarned: score?.royalty_cents_earned || 0,
            estimatedValue: (score?.total_score || 0) * 10 + (score?.royalty_cents_earned || 0),
          };
        }),
        orders,
        transactions,
        listings,
        interactions,
        portfolioValue,
        projectedGrowth,
        totalOrderValue: orders?.reduce((sum, o) => sum + (o.gross_revenue_cents || 0), 0) || 0,
        totalRoyalties: scores?.reduce((sum, s) => sum + (s.royalty_cents_earned || 0), 0) || 0,
      };
    },
    enabled: !!userId,
  });

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const isPremium = userDetails?.subscription?.subscription_status === 'active';

  return (
    <Dialog open={!!userId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={userDetails?.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {userDetails?.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{userDetails?.profile?.display_name || 'Anonymous User'}</span>
                {isPremium ? (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                ) : (
                  <Badge variant="outline">Free Account</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                User ID: {userId}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="space-y-6 pr-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Wallet className="h-3 w-3" />
                      <span className="text-xs">Wallet Balance</span>
                    </div>
                    <p className="text-xl font-bold text-green-500">
                      {formatCents(userDetails?.wallet?.balance_cents || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BarChart3 className="h-3 w-3" />
                      <span className="text-xs">Portfolio Value</span>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {formatCents(userDetails?.portfolioValue || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Projected Growth</span>
                    </div>
                    <p className="text-xl font-bold text-green-500">
                      +{formatCents(userDetails?.projectedGrowth || 0)}/mo
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs">Total Royalties</span>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCents(userDetails?.totalRoyalties || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Account Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">
                        {userDetails?.profile?.created_at 
                          ? format(new Date(userDetails.profile.created_at), 'MMM d, yyyy')
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Subscription</p>
                      <p className="font-medium">
                        {userDetails?.subscription?.subscription_status || 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Period End</p>
                      <p className="font-medium">
                        {userDetails?.subscription?.current_period_end 
                          ? format(new Date(userDetails.subscription.current_period_end), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Spent</p>
                      <p className="font-medium text-primary">
                        {formatCents(userDetails?.wallet?.total_spent_cents || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visions Gallery */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Vision Holdings ({userDetails?.visions?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails?.visions && userDetails.visions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDetails.visions.map((vision) => (
                        <div 
                          key={vision.id}
                          className="flex gap-4 p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={vision.image_path} 
                              alt={vision.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{vision.title}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Created {formatDistanceToNow(new Date(vision.created_at), { addSuffix: true })}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="gap-1">
                                <Eye className="h-3 w-3" />
                                {vision.views}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Download className="h-3 w-3" />
                                {vision.downloads}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <ArrowRightLeft className="h-3 w-3" />
                                {vision.trades}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Printer className="h-3 w-3" />
                                {vision.printOrders}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">Est. Value</span>
                              <span className="font-medium text-green-500">
                                {formatCents(vision.estimatedValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No visions in portfolio</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order History ({userDetails?.orders?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails?.orders && userDetails.orders.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.orders.slice(0, 10).map((order) => (
                        <div 
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium capitalize">{order.order_type} Order</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-500">
                              {formatCents(order.gross_revenue_cents)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ref: {order.order_reference || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Transactions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails?.transactions && userDetails.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.transactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.description || format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${tx.amount_cents >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {tx.amount_cents >= 0 ? '+' : ''}{formatCents(tx.amount_cents)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatCents(tx.balance_after_cents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
