import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Users, Star, Sparkles, Shield, TrendingUp, Building, Palette, Gamepad2, BookOpen, DollarSign, Wallet, Wifi, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Visionary emails with permanent premium - synced with edge functions
const VISIONARY_EMAILS = [
  { email: 'a.arthur.shelton@gmail.com', name: 'Alec Arthur Shelton', role: 'CEO & Founder' },
  { email: 'info@mawuli.xyz', name: 'Mawuli', role: 'Marketplace Tester' },
  { email: 'opecoreug@gmail.com', name: 'Product Specialist', role: 'Overseas Analyst' },
];

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const AdminEconomicsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  // Fetch user breakdown
  const { data: userStats } = useQuery({
    queryKey: ['admin-economics-users'],
    queryFn: async () => {
      const [totalResult, premiumResult, visionsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
      ]);

      const total = totalResult.count || 0;
      const paidPremium = premiumResult.count || 0;
      const visionaryCount = VISIONARY_EMAILS.length;
      const totalPremium = paidPremium + visionaryCount;
      const freeUsers = Math.max(0, total - paidPremium);

      return {
        total,
        paidPremium,
        visionaryCount,
        totalPremium,
        freeUsers,
        totalVisions: visionsResult.count || 0,
        conversionRate: total > 0 ? ((paidPremium / total) * 100).toFixed(1) : '0',
      };
    },
  });

  // Fetch LIVE profit pool data
  const { data: profitPools } = useQuery({
    queryKey: ['admin-live-profit-pools'],
    queryFn: async () => {
      const [companyProfit, revenueStreams, gamecardPool, palettePool, openingPool, walletStats] = await Promise.all([
        supabase.from('company_profit_pool').select('*'),
        supabase.from('revenue_stream_summary').select('*'),
        supabase.from('gamecard_value_pool').select('earned_value_cents, total_interactions'),
        supabase.from('palette_value_pool').select('earned_value_cents, total_interactions'),
        supabase.from('opening_value_pool').select('earned_value_cents, total_interactions, total_marketplace_trades'),
        supabase.from('user_wallets').select('balance_cents, total_earned_cents, total_spent_cents'),
      ]);

      const cpData = companyProfit.data || [];
      const totalExtractable = cpData.reduce((sum, r) => sum + (r.extractable_profit_cents || 0), 0);
      const totalReinvested = cpData.reduce((sum, r) => sum + (r.reinvested_cents || 0), 0);
      const totalGross = cpData.reduce((sum, r) => sum + (r.gross_revenue_cents || 0), 0);
      const totalStripeFees = cpData.reduce((sum, r) => sum + (r.stripe_fees_cents || 0), 0);

      const gcData = gamecardPool.data || [];
      const ppData = palettePool.data || [];
      const opData = openingPool.data || [];
      const wData = walletStats.data || [];

      return {
        totalExtractable,
        totalReinvested,
        totalGross,
        totalStripeFees,
        gamecardPoolTotal: gcData.reduce((sum, r) => sum + (r.earned_value_cents || 0), 0),
        palettePoolTotal: ppData.reduce((sum, r) => sum + (r.earned_value_cents || 0), 0),
        openingPoolTotal: opData.reduce((sum, r) => sum + (r.earned_value_cents || 0), 0),
        activeGamecards: gcData.filter(r => r.earned_value_cents > 0).length,
        activePalettes: ppData.filter(r => r.earned_value_cents > 0).length,
        activeOpenings: opData.filter(r => r.earned_value_cents > 0).length,
        totalWalletBalance: wData.reduce((sum, r) => sum + (r.balance_cents || 0), 0),
        totalUserEarnings: wData.reduce((sum, r) => sum + (r.total_earned_cents || 0), 0),
        revenueStreams: revenueStreams.data || [],
      };
    },
    refetchInterval: 10000, // Refresh every 10 seconds for live data
    staleTime: 5000,
  });

  // Set up realtime subscriptions for instant updates
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const economicsChannel = supabase
      .channel('economics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_profit_pool' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-live-profit-pools'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'palette_value_pool' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-live-profit-pools'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gamecard_value_pool' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-live-profit-pools'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opening_value_pool' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-live-profit-pools'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-live-profit-pools'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-economics-users'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-economics-users'] });
      })
      .subscribe();

    channels.push(economicsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient]);

  return (
    <div className="space-y-6">
      {/* User Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{userStats?.total || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-3 w-3 text-amber-500" />
              <span className="text-xs">Visionaries</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{userStats?.visionaryCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">Permanent Premium</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Crown className="h-3 w-3 text-primary" />
              <span className="text-xs">Paid Premium</span>
            </div>
            <p className="text-2xl font-bold text-primary">{userStats?.paidPremium || 0}</p>
            <p className="text-[10px] text-muted-foreground">Stripe Subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">Free Users</span>
            </div>
            <p className="text-2xl font-bold">{userStats?.freeUsers || 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {userStats?.conversionRate}% conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Profit Pool - LIVE */}
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building className="h-6 w-6 text-green-500" />
            Company Profit Pool
            <Badge className="ml-auto bg-green-500/20 text-green-600 border-green-500/30">LIVE</Badge>
          </CardTitle>
          <CardDescription>Real money reserves from marketplace fees + net profits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground">Extractable Cash</p>
              <p className="text-2xl font-bold text-green-500">{formatCents(profitPools?.totalExtractable || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground">Reinvested</p>
              <p className="text-2xl font-bold text-blue-500">{formatCents(profitPools?.totalReinvested || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Gross Revenue</p>
              <p className="text-2xl font-bold">{formatCents(profitPools?.totalGross || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Stripe Fees</p>
              <p className="text-2xl font-bold text-orange-500">{formatCents(profitPools?.totalStripeFees || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Attribution Pools - LIVE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Value Attribution Pools
            <Badge variant="outline" className="ml-auto">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Gamecard Pool</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{formatCents(profitPools?.gamecardPoolTotal || 0)}</p>
              <p className="text-xs text-muted-foreground">{profitPools?.activeGamecards || 0} active games</p>
            </div>
            <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Palette Pool</span>
              </div>
              <p className="text-2xl font-bold text-pink-500">{formatCents(profitPools?.palettePoolTotal || 0)}</p>
              <p className="text-xs text-muted-foreground">{profitPools?.activePalettes || 0} active palettes</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Opening Pool</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{formatCents(profitPools?.openingPoolTotal || 0)}</p>
              <p className="text-xs text-muted-foreground">{profitPools?.activeOpenings || 0} active openings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Wallet Economy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Economy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Wallet Balances</p>
              <p className="text-2xl font-bold">{formatCents(profitPools?.totalWalletBalance || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Total User Earnings</p>
              <p className="text-2xl font-bold text-green-500">{formatCents(profitPools?.totalUserEarnings || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visionary Members */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Visionary Members
          </CardTitle>
          <CardDescription>Permanent premium access holders</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {VISIONARY_EMAILS.map((visionary, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    {visionary.role === 'CEO & Founder' ? <Crown className="h-4 w-4 text-amber-500" /> : <Shield className="h-4 w-4 text-amber-500" />}
                    <span className="text-sm font-medium">{visionary.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{visionary.role}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
