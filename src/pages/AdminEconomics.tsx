import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  ArrowLeft,
  Wallet,
  PieChart,
  BarChart3,
  Crown,
  Shield,
  Activity,
  Database,
  ArrowRightLeft,
  Printer,
  Download,
  Eye,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  Receipt,
  Scale,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPlatformVisionStats, MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const AdminEconomics: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  // Check if user is admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return data === true;
    },
    enabled: !!user,
  });

  // Platform-wide stats
  const { data: platformStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async () => {
      const [
        vizCount,
        listingsResult,
        salesResult,
        walletsResult,
        withdrawalsResult,
        subscriptionsResult,
        educationFundResult,
        interactionsResult,
      ] = await Promise.all([
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
        supabase.from('visualization_listings').select('id, status, price_cents, sold_at'),
        supabase.from('wallet_transactions').select('transaction_type, amount_cents, created_at'),
        supabase.from('user_wallets').select('balance_cents, total_earned_cents, total_spent_cents, total_deposited_cents, total_withdrawn_cents'),
        supabase.from('withdrawal_requests').select('status, amount_cents, created_at'),
        supabase.from('user_subscriptions').select('subscription_status, current_period_end'),
        supabase.from('education_fund').select('forfeited_value_cents, platform_fee_cents, fund_contribution_cents, visions_released'),
        supabase.from('vision_interactions').select('interaction_type, value_cents'),
      ]);

      const listings = listingsResult.data || [];
      const sales = salesResult.data || [];
      const wallets = walletsResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const educationFund = educationFundResult.data || [];
      const interactions = interactionsResult.data || [];

      // Calculate listing stats
      const activeListings = listings.filter(l => l.status === 'active');
      const soldListings = listings.filter(l => l.status === 'sold');
      const totalListingValue = activeListings.reduce((sum, l) => sum + l.price_cents, 0);
      const totalSalesVolume = soldListings.reduce((sum, l) => sum + l.price_cents, 0);

      // Calculate wallet stats
      const totalBalances = wallets.reduce((sum, w) => sum + w.balance_cents, 0);
      const totalEarned = wallets.reduce((sum, w) => sum + w.total_earned_cents, 0);
      const totalSpent = wallets.reduce((sum, w) => sum + w.total_spent_cents, 0);
      const totalDeposited = wallets.reduce((sum, w) => sum + w.total_deposited_cents, 0);
      const totalWithdrawn = wallets.reduce((sum, w) => sum + w.total_withdrawn_cents, 0);

      // Calculate withdrawal stats
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
      const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
      const completedWithdrawals = withdrawals.filter(w => w.status === 'completed');
      const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0);

      // Calculate subscription stats
      const activeSubscriptions = subscriptions.filter(s => 
        s.subscription_status === 'active' && 
        (!s.current_period_end || new Date(s.current_period_end) > new Date())
      );

      // Calculate education fund stats
      const totalForfeitedValue = educationFund.reduce((sum, e) => sum + (e.forfeited_value_cents || 0), 0);
      const totalPlatformFees = educationFund.reduce((sum, e) => sum + (e.platform_fee_cents || 0), 0);
      const totalFundContributions = educationFund.reduce((sum, e) => sum + (e.fund_contribution_cents || 0), 0);
      const totalVisionsReleased = educationFund.reduce((sum, e) => sum + (e.visions_released || 0), 0);

      // Calculate interaction stats
      const printOrders = interactions.filter(i => i.interaction_type === 'print_order');
      const totalPrintRevenue = printOrders.reduce((sum, i) => sum + (i.value_cents || 0), 0);
      const totalViews = interactions.filter(i => i.interaction_type === 'view').length;
      const totalDownloads = interactions.filter(i => i.interaction_type === 'download_hd' || i.interaction_type === 'download_gif').length;
      const totalTrades = interactions.filter(i => i.interaction_type === 'trade').length;

      return {
        visions: {
          total: vizCount.count || 0,
        },
        marketplace: {
          activeListings: activeListings.length,
          soldListings: soldListings.length,
          totalListingValue,
          totalSalesVolume,
          averagePrice: activeListings.length > 0 ? totalListingValue / activeListings.length : 0,
        },
        wallets: {
          totalUsers: wallets.length,
          totalBalances,
          totalEarned,
          totalSpent,
          totalDeposited,
          totalWithdrawn,
        },
        withdrawals: {
          pending: pendingWithdrawals.length,
          approved: approvedWithdrawals.length,
          completed: completedWithdrawals.length,
          pendingAmount: pendingWithdrawalAmount,
          totalProcessed: completedWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0),
        },
        subscriptions: {
          active: activeSubscriptions.length,
          total: subscriptions.length,
          mrr: activeSubscriptions.length * 700, // $7/month
        },
        educationFund: {
          totalForfeitedValue,
          totalPlatformFees,
          totalFundContributions,
          totalVisionsReleased,
          scholarshipsAwarded: Math.floor(totalFundContributions / 700),
        },
        interactions: {
          totalPrintOrders: printOrders.length,
          totalPrintRevenue,
          totalViews,
          totalDownloads,
          totalTrades,
        },
      };
    },
    enabled: isAdmin === true,
    staleTime: 30000,
  });

  // Recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['admin-recent-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*, user:profiles!wallet_transactions_user_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: isAdmin === true,
    staleTime: 30000,
  });

  // Recent sales
  const { data: recentSales } = useQuery({
    queryKey: ['admin-recent-sales'],
    queryFn: async () => {
      const { data } = await supabase
        .from('visualization_listings')
        .select(`
          id, 
          price_cents, 
          sold_at, 
          status,
          visualization:saved_visualizations(title)
        `)
        .eq('status', 'sold')
        .order('sold_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isAdmin === true,
    staleTime: 30000,
  });

  // Redirect if not admin
  if (!authLoading && !adminLoading && (!user || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  if (authLoading || adminLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const formatCents = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Pie chart data for fund allocation
  const fundAllocationData = [
    { name: 'Education Fund', value: platformStats?.educationFund.totalFundContributions || 0 },
    { name: 'Platform Fees', value: platformStats?.educationFund.totalPlatformFees || 0 },
  ];

  // Revenue breakdown data
  const revenueBreakdown = [
    { name: 'Subscriptions', value: (platformStats?.subscriptions.mrr || 0) * 6 }, // 6 months estimate
    { name: 'Marketplace Fees', value: Math.floor((platformStats?.marketplace.totalSalesVolume || 0) * 0.05) },
    { name: 'Print Revenue', value: Math.floor((platformStats?.interactions.totalPrintRevenue || 0) * 0.20) }, // 20% platform cut
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetchStats()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-8 mb-8 border border-primary/20 bg-gradient-to-br from-primary/10 to-amber-500/10"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CEO Economic Dashboard</h1>
                <p className="text-muted-foreground">Complete platform financial overview for Alec Arthur Shelton</p>
              </div>
              <Badge className="ml-auto bg-amber-500/20 text-amber-600 border-amber-500/30">
                <Crown className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallets</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="fund" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Monthly Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCents(platformStats?.subscriptions.mrr || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">From subscriptions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Active Subscribers</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.subscriptions.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Premium members</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Database className="h-4 w-4" />
                    <span className="text-xs">Total Visions</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.visions.total || 0}</p>
                  <p className="text-xs text-muted-foreground">In database</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Total Sales Volume</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCents(platformStats?.marketplace.totalSalesVolume || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">All-time</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={revenueBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatCents(value)}`}
                        >
                          {revenueBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCents(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Actions */}
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Pending Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Pending Withdrawals</p>
                        <p className="text-sm text-muted-foreground">
                          {platformStats?.withdrawals.pending || 0} requests • {formatCents(platformStats?.withdrawals.pendingAmount || 0)}
                        </p>
                      </div>
                    </div>
                    <Link to="/admin/withdrawals">
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">DMCA Reports</p>
                        <p className="text-sm text-muted-foreground">Check for pending reviews</p>
                      </div>
                    </div>
                    <Link to="/admin/dmca">
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Content Moderation</p>
                        <p className="text-sm text-muted-foreground">Flagged content queue</p>
                      </div>
                    </div>
                    <Link to="/admin/moderation">
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Eye className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{platformStats?.interactions.totalViews.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Download className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{platformStats?.interactions.totalDownloads.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <ArrowRightLeft className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{platformStats?.interactions.totalTrades || 0}</p>
                  <p className="text-xs text-muted-foreground">Trades</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Printer className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{platformStats?.interactions.totalPrintOrders || 0}</p>
                  <p className="text-xs text-muted-foreground">Print Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Receipt className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{formatCents(platformStats?.interactions.totalPrintRevenue || 0)}</p>
                  <p className="text-xs text-muted-foreground">Print Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Scale className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xl font-bold">{platformStats?.wallets.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Wallet Users</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                  <p className="text-3xl font-bold">{platformStats?.marketplace.activeListings || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{platformStats?.marketplace.soldListings || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed Sales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-3xl font-bold">{formatCents(platformStats?.marketplace.totalListingValue || 0)}</p>
                  <p className="text-sm text-muted-foreground">Listed Value</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{formatCents(platformStats?.marketplace.averagePrice || 0)}</p>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vision</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sold At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales?.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.visualization?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>{formatCents(sale.price_cents)}</TableCell>
                        <TableCell>{sale.sold_at ? format(new Date(sale.sold_at), 'PPp') : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!recentSales || recentSales.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No sales yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <Wallet className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-green-500">{formatCents(platformStats?.wallets.totalBalances || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total User Balances</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <p className="text-3xl font-bold">{formatCents(platformStats?.wallets.totalEarned || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Earned (Sales)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <ArrowRightLeft className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-3xl font-bold">{formatCents(platformStats?.wallets.totalSpent || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deposit vs Withdrawal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Deposited</span>
                      <span className="font-bold text-green-500">{formatCents(platformStats?.wallets.totalDeposited || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Withdrawn</span>
                      <span className="font-bold text-red-500">{formatCents(platformStats?.wallets.totalWithdrawn || 0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Net Position</span>
                      <span className="font-bold">
                        {formatCents((platformStats?.wallets.totalDeposited || 0) - (platformStats?.wallets.totalWithdrawn || 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Pending</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{platformStats?.withdrawals.pending || 0}</p>
                        <p className="text-xs text-muted-foreground">{formatCents(platformStats?.withdrawals.pendingAmount || 0)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        <span>Approved</span>
                      </div>
                      <p className="font-bold">{platformStats?.withdrawals.approved || 0}</p>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Completed</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{platformStats?.withdrawals.completed || 0}</p>
                        <p className="text-xs text-muted-foreground">{formatCents(platformStats?.withdrawals.totalProcessed || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-amber-500/30">
                <CardContent className="pt-6">
                  <Crown className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-3xl font-bold text-amber-500">{platformStats?.subscriptions.active || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Subscribers</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-green-500">{formatCents(platformStats?.subscriptions.mrr || 0)}</p>
                  <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <p className="text-3xl font-bold">{formatCents((platformStats?.subscriptions.mrr || 0) * 12)}</p>
                  <p className="text-sm text-muted-foreground">Projected ARR</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Economics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Per-Subscriber Value</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Fee</span>
                        <span className="font-bold">$7.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vision Value Appreciation</span>
                        <span className="font-bold">{MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Marketplace Access</span>
                        <span className="font-bold text-green-500">✓ Full</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Platform Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Signups</span>
                        <span className="font-bold">{platformStats?.subscriptions.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate</span>
                        <span className="font-bold">
                          {platformStats?.subscriptions.total 
                            ? ((platformStats?.subscriptions.active / platformStats.subscriptions.total) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Fund Tab */}
          <TabsContent value="fund" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-purple-500/30">
                <CardContent className="pt-6">
                  <GraduationCap className="h-8 w-8 text-purple-500 mb-2" />
                  <p className="text-3xl font-bold text-purple-500">{formatCents(platformStats?.educationFund.totalFundContributions || 0)}</p>
                  <p className="text-sm text-muted-foreground">Fund Balance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Award className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{platformStats?.educationFund.scholarshipsAwarded || 0}</p>
                  <p className="text-sm text-muted-foreground">Scholarships Awarded</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Recycle className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-3xl font-bold">{platformStats?.educationFund.totalVisionsReleased || 0}</p>
                  <p className="text-sm text-muted-foreground">Visions Recycled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-3xl font-bold">{formatCents(platformStats?.educationFund.totalForfeitedValue || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Forfeited Value</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Fund Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={fundAllocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                        >
                          <Cell fill="hsl(var(--chart-1))" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCents(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--chart-1))' }} />
                      <div className="flex-1">
                        <p className="font-medium">Education Fund (85%)</p>
                        <p className="text-sm text-muted-foreground">{formatCents(platformStats?.educationFund.totalFundContributions || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--muted))' }} />
                      <div className="flex-1">
                        <p className="font-medium">Platform Operations (15%)</p>
                        <p className="text-sm text-muted-foreground">{formatCents(platformStats?.educationFund.totalPlatformFees || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Link to="/education-fund" className="flex items-center justify-between hover:bg-muted/50 p-3 -m-3 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span>View Public Education Fund Page</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

// Missing import
import { Award, Recycle, ChevronRight } from 'lucide-react';

export default AdminEconomics;
