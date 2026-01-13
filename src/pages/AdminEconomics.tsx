import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RefreshCw,
  Palette,
  Gamepad2,
  TrendingDown,
  CreditCard,
  Package,
  BookOpen,
  Percent,
  LineChart,
  Calendar
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
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, LineChart as RechartsLine, Line, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { getFinancialTrends, getPaletteValuePools, getGamecardValuePools, triggerDailySnapshot, type FinancialTrend, type ValuePool } from '@/lib/analytics/financialTrends';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Estimated fee rates
const STRIPE_FEE_RATE = 0.029;
const STRIPE_FIXED_FEE = 30; // 30 cents
const SHOPIFY_FEE_RATE = 0.02;
const PRINTIFY_MARGIN = 0.35; // Estimated cost is 35% of retail
const LULU_MARGIN = 0.40; // Estimated cost is 40% of retail

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

  // Platform-wide comprehensive stats
  const { data: platformStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-comprehensive-stats'],
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
        palettePoolResult,
        gamecardPoolResult,
        orderFinancialsResult,
      ] = await Promise.all([
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
        supabase.from('visualization_listings').select('id, status, price_cents, sold_at'),
        supabase.from('wallet_transactions').select('transaction_type, amount_cents, created_at'),
        supabase.from('user_wallets').select('balance_cents, total_earned_cents, total_spent_cents, total_deposited_cents, total_withdrawn_cents'),
        supabase.from('withdrawal_requests').select('status, amount_cents, created_at'),
        supabase.from('user_subscriptions').select('subscription_status, current_period_end'),
        supabase.from('education_fund').select('forfeited_value_cents, platform_fee_cents, fund_contribution_cents, visions_released, event_type'),
        supabase.from('vision_interactions').select('interaction_type, value_cents'),
        supabase.from('palette_value_pool').select('*'),
        supabase.from('gamecard_value_pool').select('*'),
        supabase.from('order_financials').select('*'),
      ]);

      const listings = listingsResult.data || [];
      const sales = salesResult.data || [];
      const wallets = walletsResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const educationFund = educationFundResult.data || [];
      const interactions = interactionsResult.data || [];
      const palettePool = palettePoolResult.data || [];
      const gamecardPool = gamecardPoolResult.data || [];
      const orderFinancials = orderFinancialsResult.data || [];

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
      const monthlySubRevenue = activeSubscriptions.length * 700; // $7/month

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

      // Calculate value pools
      const totalPaletteValue = palettePool.reduce((sum, p) => sum + (p.earned_value_cents || 0), 0);
      const totalGamecardValue = gamecardPool.reduce((sum, g) => sum + (g.earned_value_cents || 0), 0);

      // Calculate order financials
      const printOrderFinancials = orderFinancials.filter(o => o.order_type === 'print');
      const bookOrderFinancials = orderFinancials.filter(o => o.order_type === 'book');
      const marketplaceOrderFinancials = orderFinancials.filter(o => o.order_type === 'marketplace');

      // Estimated costs breakdown
      const estimatedStripeFees = Math.floor((totalPrintRevenue + monthlySubRevenue) * STRIPE_FEE_RATE + (printOrders.length + activeSubscriptions.length) * STRIPE_FIXED_FEE);
      const estimatedShopifyFees = Math.floor(totalPrintRevenue * SHOPIFY_FEE_RATE);
      const estimatedPrintifyCosts = Math.floor(totalPrintRevenue * PRINTIFY_MARGIN);
      const estimatedLuluCosts = 0; // Book orders would add here

      // Calculate net profit
      const grossRevenue = totalPrintRevenue + monthlySubRevenue * 6 + Math.floor(totalSalesVolume * 0.05);
      const totalCosts = estimatedStripeFees + estimatedShopifyFees + estimatedPrintifyCosts + estimatedLuluCosts;
      const creatorPayouts = Math.floor(totalPrintRevenue * 0.20 * 0.40); // 20% value appreciation, 40% to creator
      const netProfit = grossRevenue - totalCosts - creatorPayouts - totalFundContributions;

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
          platformFees: Math.floor(totalSalesVolume * 0.05),
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
          mrr: monthlySubRevenue,
          arr: monthlySubRevenue * 12,
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
        costs: {
          stripeFees: estimatedStripeFees,
          shopifyFees: estimatedShopifyFees,
          printifyCosts: estimatedPrintifyCosts,
          luluCosts: estimatedLuluCosts,
          totalCosts,
        },
        revenue: {
          gross: grossRevenue,
          net: netProfit,
          creatorPayouts,
        },
        valuePools: {
          palettes: palettePool,
          gamecards: gamecardPool,
          totalPaletteValue,
          totalGamecardValue,
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
        .select('*')
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

  // Revenue breakdown data
  const revenueBreakdownData = [
    { name: 'Subscriptions', value: (platformStats?.subscriptions.mrr || 0) * 6, color: COLORS[0] },
    { name: 'Print Orders', value: platformStats?.interactions.totalPrintRevenue || 0, color: COLORS[1] },
    { name: 'Marketplace Fees', value: platformStats?.marketplace.platformFees || 0, color: COLORS[2] },
  ];

  // Cost breakdown data
  const costBreakdownData = [
    { name: 'Stripe Fees', value: platformStats?.costs.stripeFees || 0 },
    { name: 'Shopify Fees', value: platformStats?.costs.shopifyFees || 0 },
    { name: 'Printify Costs', value: platformStats?.costs.printifyCosts || 0 },
    { name: 'Lulu Costs', value: platformStats?.costs.luluCosts || 0 },
  ];

  // Value distribution data
  const valueDistributionData = [
    { name: 'Creator Royalties', value: platformStats?.revenue.creatorPayouts || 0 },
    { name: 'Education Fund', value: platformStats?.educationFund.totalFundContributions || 0 },
    { name: 'Palette Pool', value: platformStats?.valuePools.totalPaletteValue || 0 },
    { name: 'Gamecard Pool', value: platformStats?.valuePools.totalGamecardValue || 0 },
    { name: 'Platform Net', value: Math.max(0, platformStats?.revenue.net || 0) },
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
          className="relative overflow-hidden rounded-2xl p-8 mb-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-primary/5 to-amber-500/10"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CEO Economic Command Center</h1>
                <p className="text-muted-foreground">Complete financial transparency for Alec Arthur Shelton</p>
              </div>
              <Badge className="ml-auto bg-amber-500/20 text-amber-600 border-amber-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Gross Revenue</span>
              </div>
              <p className="text-xl font-bold text-green-500">
                {formatCents(platformStats?.revenue.gross || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs">Total Costs</span>
              </div>
              <p className="text-xl font-bold text-red-500">
                {formatCents(platformStats?.costs.totalCosts || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Net Profit</span>
              </div>
              <p className={`text-xl font-bold ${(platformStats?.revenue.net || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {formatCents(platformStats?.revenue.net || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">Premium Members</span>
              </div>
              <p className="text-xl font-bold">{platformStats?.subscriptions.active || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Printer className="h-3 w-3" />
                <span className="text-xs">Print Orders</span>
              </div>
              <p className="text-xl font-bold">{platformStats?.interactions.totalPrintOrders || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Database className="h-3 w-3" />
                <span className="text-xs">Total Visions</span>
              </div>
              <p className="text-xl font-bold">{platformStats?.visions.total || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="trends" className="gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financials</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Costs</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="pools" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Value Pools</span>
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallets</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
          </TabsList>

          {/* Trends Tab - New! */}
          <TrendsTab formatCents={formatCents} />

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-green-500" />
                    Revenue Streams
                  </CardTitle>
                  <CardDescription>All money coming into the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={revenueBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {revenueBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCents(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {revenueBreakdownData.map((item, i) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{formatCents(item.value)}</span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Revenue</span>
                      <span className="font-bold text-green-500">{formatCents(platformStats?.revenue.gross || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Value Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                    Value Distribution
                  </CardTitle>
                  <CardDescription>Where the money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={valueDistributionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `$${(v/100).toFixed(0)}`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => formatCents(value)} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Subscription Economics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">MRR</p>
                    <p className="text-2xl font-bold">{formatCents(platformStats?.subscriptions.mrr || 0)}</p>
                    <p className="text-xs text-muted-foreground">{platformStats?.subscriptions.active} × $7/mo</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">ARR</p>
                    <p className="text-2xl font-bold">{formatCents(platformStats?.subscriptions.arr || 0)}</p>
                    <p className="text-xs text-muted-foreground">Projected annual</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Stripe Fees (Est.)</p>
                    <p className="text-2xl font-bold text-red-500">
                      {formatCents(Math.floor((platformStats?.subscriptions.mrr || 0) * 6 * STRIPE_FEE_RATE))}
                    </p>
                    <p className="text-xs text-muted-foreground">2.9% + $0.30/txn</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">Net Sub Revenue</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCents(Math.floor((platformStats?.subscriptions.mrr || 0) * 6 * (1 - STRIPE_FEE_RATE)))}
                    </p>
                    <p className="text-xs text-muted-foreground">After Stripe fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-red-500" />
                    Cost Breakdown
                  </CardTitle>
                  <CardDescription>All platform expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Stripe Fees</p>
                          <p className="text-xs text-muted-foreground">2.9% + $0.30 per transaction</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">{formatCents(platformStats?.costs.stripeFees || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Shopify Fees</p>
                          <p className="text-xs text-muted-foreground">~2% per transaction</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">{formatCents(platformStats?.costs.shopifyFees || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Printify Production</p>
                          <p className="text-xs text-muted-foreground">~35% of print order value</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">{formatCents(platformStats?.costs.printifyCosts || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Lulu Book Production</p>
                          <p className="text-xs text-muted-foreground">~40% of book order value</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">{formatCents(platformStats?.costs.luluCosts || 0)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="font-semibold">Total Costs</span>
                      <span className="font-bold text-red-500 text-xl">{formatCents(platformStats?.costs.totalCosts || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Print Order Economics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-blue-500" />
                    Print Order Economics
                  </CardTitle>
                  <CardDescription>Per-order breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-xs text-muted-foreground">Gross Revenue</p>
                        <p className="text-lg font-bold text-green-500">{formatCents(platformStats?.interactions.totalPrintRevenue || 0)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/10">
                        <p className="text-xs text-muted-foreground">Production Cost</p>
                        <p className="text-lg font-bold text-red-500">{formatCents(platformStats?.costs.printifyCosts || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-sm font-medium mb-3">Value Appreciation Distribution (20%)</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Creator Royalty (40%)</span>
                          <span>{formatCents(platformStats?.revenue.creatorPayouts || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Education Fund (25%)</span>
                          <span>{formatCents(Math.floor((platformStats?.interactions.totalPrintRevenue || 0) * 0.20 * 0.25))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Palette Pool (20%)</span>
                          <span>{formatCents(Math.floor((platformStats?.interactions.totalPrintRevenue || 0) * 0.20 * 0.20))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gamecard Pool (15%)</span>
                          <span>{formatCents(Math.floor((platformStats?.interactions.totalPrintRevenue || 0) * 0.20 * 0.15))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Platform Retention (80%)</span>
                        <span className="font-bold text-primary text-lg">
                          {formatCents(Math.floor((platformStats?.interactions.totalPrintRevenue || 0) * 0.80 - (platformStats?.costs.printifyCosts || 0)))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">After production costs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Active Listings</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.marketplace.activeListings || 0}</p>
                  <p className="text-xs text-muted-foreground">Value: {formatCents(platformStats?.marketplace.totalListingValue || 0)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Completed Sales</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.marketplace.soldListings || 0}</p>
                  <p className="text-xs text-muted-foreground">Volume: {formatCents(platformStats?.marketplace.totalSalesVolume || 0)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs">Platform Fees (5%)</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">{formatCents(platformStats?.marketplace.platformFees || 0)}</p>
                  <p className="text-xs text-muted-foreground">From all sales</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Average Price</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCents(platformStats?.marketplace.averagePrice || 0)}</p>
                  <p className="text-xs text-muted-foreground">Per listing</p>
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
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Seller Receives</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales?.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.visualization?.title || 'Untitled'}</TableCell>
                        <TableCell>{formatCents(sale.price_cents)}</TableCell>
                        <TableCell className="text-green-500">{formatCents(Math.floor(sale.price_cents * 0.05))}</TableCell>
                        <TableCell>{formatCents(Math.floor(sale.price_cents * 0.95))}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {sale.sold_at ? format(new Date(sale.sold_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!recentSales || recentSales.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No sales yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Value Pools Tab */}
          <TabsContent value="pools" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Palette Value Pool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Trademarked Palette Pool
                  </CardTitle>
                  <CardDescription>
                    Value distributed to En Pensent® color palettes based on vision engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Pool Value</span>
                      <span className="font-bold text-primary text-xl">{formatCents(platformStats?.valuePools.totalPaletteValue || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {platformStats?.valuePools.palettes && platformStats.valuePools.palettes.length > 0 ? (
                      platformStats.valuePools.palettes.slice(0, 5).map((palette: any) => (
                        <div key={palette.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div>
                            <p className="font-medium">{palette.palette_name}</p>
                            <p className="text-xs text-muted-foreground">{palette.total_print_orders} prints</p>
                          </div>
                          <span className="font-bold">{formatCents(palette.earned_value_cents)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No palette value accumulated yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gamecard Value Pool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-amber-500" />
                    Legendary Game Card Pool
                  </CardTitle>
                  <CardDescription>
                    Value distributed to iconic chess games based on vision engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Pool Value</span>
                      <span className="font-bold text-amber-500 text-xl">{formatCents(platformStats?.valuePools.totalGamecardValue || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {platformStats?.valuePools.gamecards && platformStats.valuePools.gamecards.length > 0 ? (
                      platformStats.valuePools.gamecards.slice(0, 5).map((game: any) => (
                        <div key={game.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div>
                            <p className="font-medium">{game.game_title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{game.rarity_tier}</Badge>
                              <span className="text-xs text-muted-foreground">{game.total_print_orders} prints</span>
                            </div>
                          </div>
                          <span className="font-bold">{formatCents(game.earned_value_cents)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No gamecard value accumulated yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Value Pool Explanation */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Value Pool Distribution Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">How It Works</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      When visions are engaged with (prints ordered, downloads, trades), 20% of the revenue 
                      goes to value appreciation. This 20% is then distributed:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>40% → Vision Owner (Creator Royalty)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>25% → Education Fund</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>20% → Palette Pool</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>15% → Gamecard Pool</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pool Benefits</h4>
                    <p className="text-sm text-muted-foreground">
                      The palette and gamecard pools create intrinsic value for En Pensent® intellectual property.
                      As more visions using specific palettes or based on legendary games are engaged with,
                      those palettes and gamecards accumulate value, strengthening the brand's IP portfolio
                      and creating potential licensing opportunities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Wallet Users</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.wallets.totalUsers || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">Total Balances</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCents(platformStats?.wallets.totalBalances || 0)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Total Deposited</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">{formatCents(platformStats?.wallets.totalDeposited || 0)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-red-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs">Total Withdrawn</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">{formatCents(platformStats?.wallets.totalWithdrawn || 0)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-amber-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Pending Withdrawals</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-500">{platformStats?.withdrawals.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">{formatCents(platformStats?.withdrawals.pendingAmount || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions?.slice(0, 10).map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.amount_cents >= 0 ? 'default' : 'destructive'}>
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={tx.amount_cents >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {tx.amount_cents >= 0 ? '+' : ''}{formatCents(tx.amount_cents)}
                        </TableCell>
                        <TableCell>{formatCents(tx.balance_after_cents)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Fund Tab */}
          <TabsContent value="education" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs">Total Fund</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCents(platformStats?.educationFund.totalFundContributions || 0)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Scholarships Funded</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.educationFund.scholarshipsAwarded || 0}</p>
                  <p className="text-xs text-muted-foreground">$7/month each</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Database className="h-4 w-4" />
                    <span className="text-xs">Visions Released</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats?.educationFund.totalVisionsReleased || 0}</p>
                  <p className="text-xs text-muted-foreground">From lapsed subscriptions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Forfeited Value</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCents(platformStats?.educationFund.totalForfeitedValue || 0)}</p>
                  <p className="text-xs text-muted-foreground">85% to education</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Education Fund Allocation</CardTitle>
                <CardDescription>How the chess education fund receives contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Lapsed Subscriptions</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      When premium members cancel and don't renew within the 7-day grace period:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• 85% of forfeited vision value → Education Fund</li>
                      <li>• 15% platform fee</li>
                      <li>• Visions become claimable on marketplace</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Print Orders</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      From the 20% value appreciation pool:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• 25% of value appreciation → Education Fund</li>
                      <li>• Automatic distribution on each order</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Marketplace Sales</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      5% platform fee contributes to:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Platform operations</li>
                      <li>• Partial allocation to education initiatives</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{ formatCents: (cents: number) => string }> = ({ formatCents }) => {
  const queryClient = useQueryClient();

  // Fetch financial trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['financial-trends'],
    queryFn: () => getFinancialTrends(30),
  });

  // Fetch value pools
  const { data: palettePools } = useQuery({
    queryKey: ['palette-value-pools'],
    queryFn: getPaletteValuePools,
  });

  const { data: gamecardPools } = useQuery({
    queryKey: ['gamecard-value-pools'],
    queryFn: getGamecardValuePools,
  });

  // Snapshot mutation
  const snapshotMutation = useMutation({
    mutationFn: triggerDailySnapshot,
    onSuccess: () => {
      toast.success('Daily snapshot captured!');
      queryClient.invalidateQueries({ queryKey: ['financial-trends'] });
    },
    onError: () => {
      toast.error('Failed to capture snapshot');
    },
  });

  // Prepare trend chart data (reverse for chronological order)
  const chartData = (trends || []).slice().reverse().map(t => ({
    date: format(new Date(t.date), 'MMM d'),
    revenue: (t.dailySubscriptionRevenueCents + t.dailyPrintRevenueCents + t.dailyMarketplaceFeeCents) / 100,
    costs: (t.dailyStripeFeesCents + t.dailyShopifyFeesCents + t.dailyPrintifyCostsCents) / 100,
    views: t.dailyViews,
    downloads: t.dailyDownloads,
    trades: t.dailyTrades,
    visions: t.dailyVisionsCreated,
    palettePool: t.totalPalettePoolValueCents / 100,
    gamecardPool: t.totalGamecardPoolValueCents / 100,
  }));

  // Calculate totals from pools
  const totalPaletteValue = (palettePools || []).reduce((sum, p) => sum + p.totalValueCents, 0);
  const totalGamecardValue = (gamecardPools || []).reduce((sum, p) => sum + p.totalValueCents, 0);

  return (
    <TabsContent value="trends" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Financial Trends</h3>
          <p className="text-sm text-muted-foreground">30-day rolling performance data</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => snapshotMutation.mutate()}
          disabled={snapshotMutation.isPending}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Capture Today's Snapshot
        </Button>
      </div>

      {/* Revenue & Costs Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Revenue vs Costs
          </CardTitle>
          <CardDescription>Daily revenue and cost comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {trendsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" fill="hsl(var(--chart-1) / 0.2)" stroke="hsl(var(--chart-1))" name="Revenue" />
                  <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" name="Costs" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No trend data yet. Capture your first snapshot above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Daily Engagement
          </CardTitle>
          <CardDescription>Views, downloads, trades, and new visions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--chart-1))" name="Views" />
                  <Bar dataKey="downloads" fill="hsl(var(--chart-2))" name="Downloads" />
                  <Bar dataKey="trades" fill="hsl(var(--chart-3))" name="Trades" />
                  <Bar dataKey="visions" fill="hsl(var(--chart-4))" name="New Visions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Engagement data will appear here after snapshots.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Value Pool Growth */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Palette Value Pool
            </CardTitle>
            <CardDescription>Top performing trademarked palettes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">{formatCents(totalPaletteValue)}</div>
            <div className="space-y-3">
              {(palettePools || []).slice(0, 8).map((palette) => (
                <div key={palette.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{palette.name}</span>
                    <Badge variant="outline" className="text-xs">{palette.usageCount} uses</Badge>
                  </div>
                  <span className="text-sm font-medium">{formatCents(palette.totalValueCents)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-500" />
              Gamecard Value Pool
            </CardTitle>
            <CardDescription>Legendary chess games by rarity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">{formatCents(totalGamecardValue)}</div>
            <div className="space-y-3">
              {(gamecardPools || []).slice(0, 8).map((game) => (
                <div key={game.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[180px]">{game.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        game.rarityTier === 'legendary' ? 'border-amber-500 text-amber-500' :
                        game.rarityTier === 'epic' ? 'border-purple-500 text-purple-500' :
                        game.rarityTier === 'rare' ? 'border-blue-500 text-blue-500' :
                        'border-muted-foreground'
                      }`}
                    >
                      {game.rarityTier}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{formatCents(game.totalValueCents)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Cap Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Total Market Value Growth
          </CardTitle>
          <CardDescription>Combined palette and gamecard pool values over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="palettePool" stackId="1" fill="hsl(var(--chart-3) / 0.5)" stroke="hsl(var(--chart-3))" name="Palette Pool" />
                  <Area type="monotone" dataKey="gamecardPool" stackId="1" fill="hsl(var(--chart-4) / 0.5)" stroke="hsl(var(--chart-4))" name="Gamecard Pool" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Market cap history will appear after snapshots.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default AdminEconomics;