import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  ShoppingBag, 
  Calendar,
  ArrowLeft,
  Wallet,
  PieChart,
  BarChart3,
  Clock,
  Sparkles,
  Image,
  Download,
  Gift,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { RoyaltyCalculator } from '@/components/calculator/RoyaltyCalculator';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface VisionStats {
  id: string;
  title: string;
  royaltyCentsEarned: number;
  royaltyOrdersCount: number;
  printRevenueCents: number;
  printOrderCount: number;
  viewCount: number;
  downloadCount: number;
  totalScore: number;
}

interface PortfolioStats {
  totalRoyaltyCents: number;
  totalRoyaltyOrders: number;
  totalPrintRevenue: number;
  totalPrintOrders: number;
  totalViews: number;
  totalDownloads: number;
  visionCount: number;
  visions: VisionStats[];
}

// Mock monthly data for charts (would be real in production)
const generateMonthlyData = (totalRoyalty: number) => {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const baseAmount = totalRoyalty / 7;
  
  return months.map((month, i) => ({
    month,
    royalties: Math.floor(baseAmount * (0.5 + Math.random()) * (1 + i * 0.15)),
    orders: Math.floor(Math.random() * 10 + 2),
  }));
};

const CreatorDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const backgroundImages = useRandomGameArt(3);
  const valueAppreciationPercent = MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100;
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['creator-dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Get user's visualizations
      const { data: visualizations } = await supabase
        .from('saved_visualizations')
        .select('id, title')
        .eq('user_id', user.id);

      if (!visualizations || visualizations.length === 0) {
        return {
          totalRoyaltyCents: 0,
          totalRoyaltyOrders: 0,
          totalPrintRevenue: 0,
          totalPrintOrders: 0,
          totalViews: 0,
          totalDownloads: 0,
          visionCount: 0,
          visions: [],
        } as PortfolioStats;
      }

      const vizIds = visualizations.map(v => v.id);

      // Get vision scores
      const { data: scores } = await supabase
        .from('vision_scores')
        .select('*')
        .in('visualization_id', vizIds);

      const visions: VisionStats[] = visualizations.map(viz => {
        const score = scores?.find(s => s.visualization_id === viz.id);
        return {
          id: viz.id,
          title: viz.title,
          royaltyCentsEarned: score?.royalty_cents_earned || 0,
          royaltyOrdersCount: score?.royalty_orders_count || 0,
          printRevenueCents: score?.print_revenue_cents || 0,
          printOrderCount: score?.print_order_count || 0,
          viewCount: score?.view_count || 0,
          downloadCount: (score?.download_gif_count || 0) + (score?.download_hd_count || 0),
          totalScore: score?.total_score || 0,
        };
      });

      const totals = visions.reduce((acc, v) => ({
        totalRoyaltyCents: acc.totalRoyaltyCents + v.royaltyCentsEarned,
        totalRoyaltyOrders: acc.totalRoyaltyOrders + v.royaltyOrdersCount,
        totalPrintRevenue: acc.totalPrintRevenue + v.printRevenueCents,
        totalPrintOrders: acc.totalPrintOrders + v.printOrderCount,
        totalViews: acc.totalViews + v.viewCount,
        totalDownloads: acc.totalDownloads + v.downloadCount,
      }), {
        totalRoyaltyCents: 0,
        totalRoyaltyOrders: 0,
        totalPrintRevenue: 0,
        totalPrintOrders: 0,
        totalViews: 0,
        totalDownloads: 0,
      });

      return {
        ...totals,
        visionCount: visualizations.length,
        visions: visions.sort((a, b) => b.royaltyCentsEarned - a.royaltyCentsEarned),
      } as PortfolioStats;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/" replace />;
  }

  const royaltyDollars = (stats?.totalRoyaltyCents || 0) / 100;
  const totalRevenueDollars = (stats?.totalPrintRevenue || 0) / 100;
  const platformDollars = totalRevenueDollars - royaltyDollars;
  const monthlyData = generateMonthlyData(royaltyDollars);
  
  // Payout simulation (in production, this would be real)
  const pendingPayout = royaltyDollars * 0.3; // Mock: 30% pending
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(1);
  nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          to="/my-visions" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Visions
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-8 mb-8 border border-primary/20 bg-gradient-to-br from-primary/10 to-green-500/10"
        >
          {backgroundImages[0] && (
            <div 
              className="absolute inset-0 opacity-[0.1] bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImages[0]})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/90" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                <p className="text-muted-foreground">Track your earnings and portfolio performance</p>
              </div>
            </div>
            
            {/* Main Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Total Royalties</span>
                </div>
                <p className="text-3xl font-bold text-green-500">${royaltyDollars.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
              </div>
              
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-sm">Orders by Others</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalRoyaltyOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Prints sold</p>
              </div>
              
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">Portfolio Size</span>
                </div>
                <p className="text-3xl font-bold">{stats?.visionCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Visions owned</p>
              </div>
              
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Total Views</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalViews || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all visions</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Calculator
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Earnings Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Earnings Trend
                  </CardTitle>
                  <CardDescription>Monthly royalty earnings over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorRoyalties" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Royalties']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="royalties" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorRoyalties)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Value Realization */}
              <Card className="relative overflow-hidden">
                {backgroundImages[1] && (
                  <div 
                    className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImages[1]})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/95" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-500" />
                    Realize Your Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-muted-foreground">Accrued Vision Value</p>
                    <p className="text-2xl font-bold text-green-500">${pendingPayout.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transfer to another member to realize gains
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-primary">How to realize value:</p>
                    <div className="flex items-start gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Sell</span>
                        <span className="text-muted-foreground"> — 5% platform fee, you receive 95%</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Trade</span>
                        <span className="text-muted-foreground"> — 5% fee when credits involved</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Gift className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Gift</span>
                        <span className="text-muted-foreground"> — No fees, recipient gets full value</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-start gap-2 text-xs">
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">No automatic payouts.</strong> Your vision's value grows from print orders. Transfer ownership to convert value to credits.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Visions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Top Performing Visions
                </CardTitle>
                <CardDescription>Your visions ranked by royalty earnings</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.visions && stats.visions.length > 0 ? (
                  <div className="space-y-3">
                    {stats.visions.slice(0, 5).map((vision, i) => (
                      <Link
                        key={vision.id}
                        to={`/visualization/${vision.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{vision.title}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {vision.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              {vision.royaltyOrdersCount} orders
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">${(vision.royaltyCentsEarned / 100).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">earned</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No visions yet</p>
                    <Button asChild className="mt-4">
                      <Link to="/">Create Your First Vision</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card className="relative overflow-hidden">
                {backgroundImages[2] && (
                  <div 
                    className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImages[2]})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/95" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Revenue Breakdown
                  </CardTitle>
                  <CardDescription>How print revenue is distributed</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Your Value Appreciation ({valueAppreciationPercent}%)
                      </span>
                      <span className="font-bold text-green-500">${royaltyDollars.toFixed(2)}</span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden bg-muted/30">
                      <div 
                        className="bg-green-500 transition-all"
                        style={{ width: `${valueAppreciationPercent}%` }}
                      />
                      <div 
                        className="bg-muted-foreground/30 transition-all"
                        style={{ width: `${100 - valueAppreciationPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                        Platform & Fulfillment ({100 - valueAppreciationPercent}%)
                      </span>
                      <span className="text-muted-foreground">${platformDollars.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium">Total Revenue Generated</span>
                    <span className="font-bold">${totalRevenueDollars.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Orders Over Time
                  </CardTitle>
                  <CardDescription>Monthly print orders by others</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Economics Explainer */}
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  How You Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">1. Create & Claim</h4>
                    <p className="text-xs text-muted-foreground">
                      Generate visualizations and claim ownership as a premium member
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">2. Others Order Prints</h4>
                    <p className="text-xs text-muted-foreground">
                      Anyone can order prints of public visions from the marketplace
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <h4 className="font-medium mb-1">3. Sell, Trade, or Gift</h4>
                    <p className="text-xs text-muted-foreground">
                      Value accrues from orders ({valueAppreciationPercent}% of profit). <strong>No automatic payouts</strong> — transfer ownership to realize gains.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator">
            <RoyaltyCalculator />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreatorDashboard;