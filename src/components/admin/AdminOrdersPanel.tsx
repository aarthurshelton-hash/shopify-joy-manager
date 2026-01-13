import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag,
  Printer,
  BookOpen,
  ArrowRightLeft,
  Crown,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

export const AdminOrdersPanel: React.FC = () => {
  const [orderType, setOrderType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch orders with filters
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', orderType, dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      let query = supabase
        .from('order_financials')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (orderType !== 'all') {
        query = query.eq('order_type', orderType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  // Calculate summary stats
  const stats = {
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((sum, o) => sum + (o.gross_revenue_cents || 0), 0) || 0,
    netRevenue: orders?.reduce((sum, o) => sum + (o.net_revenue_cents || 0), 0) || 0,
    totalRoyalties: orders?.reduce((sum, o) => sum + (o.creator_royalty_cents || 0), 0) || 0,
    byType: {
      print: orders?.filter(o => o.order_type === 'print').length || 0,
      book: orders?.filter(o => o.order_type === 'book').length || 0,
      subscription: orders?.filter(o => o.order_type === 'subscription').length || 0,
      marketplace: orders?.filter(o => o.order_type === 'marketplace').length || 0,
    },
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'print': return <Printer className="h-4 w-4" />;
      case 'book': return <BookOpen className="h-4 w-4" />;
      case 'subscription': return <Crown className="h-4 w-4" />;
      case 'marketplace': return <ArrowRightLeft className="h-4 w-4" />;
      default: return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getOrderColor = (type: string) => {
    switch (type) {
      case 'print': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'book': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'subscription': return 'bg-primary/10 text-primary border-primary/30';
      case 'marketplace': return 'bg-green-500/10 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingBag className="h-3 w-3" />
              <span className="text-xs">Total Orders</span>
            </div>
            <p className="text-xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Gross Revenue</span>
            </div>
            <p className="text-xl font-bold text-green-500">{formatCents(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Net Revenue</span>
            </div>
            <p className="text-xl font-bold">{formatCents(stats.netRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Crown className="h-3 w-3" />
              <span className="text-xs">Creator Royalties</span>
            </div>
            <p className="text-xl font-bold text-primary">{formatCents(stats.totalRoyalties)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Printer className="h-3 w-3" />
              <span className="text-xs">Print Orders</span>
            </div>
            <p className="text-xl font-bold">{stats.byType.print}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={orderType} onValueChange={setOrderType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="print">Print Orders</SelectItem>
            <SelectItem value="book">Book Orders</SelectItem>
            <SelectItem value="subscription">Subscriptions</SelectItem>
            <SelectItem value="marketplace">Marketplace</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Log
          </CardTitle>
          <CardDescription>
            Complete order history with financial breakdown
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
                {orders?.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getOrderColor(order.order_type)}>
                        {getOrderIcon(order.order_type)}
                        <span className="ml-1 capitalize">{order.order_type}</span>
                      </Badge>

                      <div>
                        <p className="font-medium">
                          {order.order_reference || `Order #${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Gross</p>
                        <p className="font-medium text-green-500">{formatCents(order.gross_revenue_cents)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fees</p>
                        <p className="font-medium text-red-500">-{formatCents(order.platform_fees_cents)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Costs</p>
                        <p className="font-medium text-red-500">-{formatCents(order.fulfillment_costs_cents)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Royalty</p>
                        <p className="font-medium text-primary">{formatCents(order.creator_royalty_cents)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className="font-bold">{formatCents(order.net_revenue_cents)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {orders?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found for the selected filters</p>
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
