import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { 
  Crown, 
  Shield, 
  Users, 
  ArrowLeft,
  RefreshCw,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Activity,
  Image,
  Wrench,
  HeartPulse,
  Code,
  Zap,
  LineChart,
  Presentation,
  FileText,
  Sparkles,
  Network
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLocationAnalytics } from '@/components/admin/AdminLocationAnalytics';
import { AdminSecurityAuditLog } from '@/components/admin/AdminSecurityAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { AdminUserDetailModal } from '@/components/admin/AdminUserDetailModal';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AdminOrdersPanel } from '@/components/admin/AdminOrdersPanel';
import { AdminSubscriptionsPanel } from '@/components/admin/AdminSubscriptionsPanel';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminMaintenancePanel } from '@/components/admin/AdminMaintenancePanel';
import { AdminHealthPanel } from '@/components/admin/AdminHealthPanel';
import { AdminEconomicsPanel } from '@/components/admin/AdminEconomicsPanel';
import { AdminUserCountBadge } from '@/components/admin/AdminUserCountBadge';
import { AutoHealPanel } from '@/components/pensent-code/AutoHealPanel';
import LiveCodebaseDebugger from '@/components/pensent-code/LiveCodebaseDebugger';
import { UniversalAdapterMonitor } from '@/components/admin/UniversalAdapterMonitor';
import { UnifiedSystemDashboard } from '@/components/admin/UnifiedSystemDashboard';

const AdminCEODashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');

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

  // Fetch platform overview stats
  const { data: overviewStats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-ceo-overview'],
    queryFn: async () => {
      const [
        usersResult,
        premiumResult,
        visionsResult,
        ordersResult,
        walletsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
        supabase.from('order_financials').select('gross_revenue_cents'),
        supabase.from('user_wallets').select('balance_cents'),
      ]);

      const totalOrders = ordersResult.data || [];
      const totalRevenue = totalOrders.reduce((sum, o) => sum + (o.gross_revenue_cents || 0), 0);
      const wallets = walletsResult.data || [];
      const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.balance_cents || 0), 0);

      return {
        totalUsers: usersResult.count || 0,
        premiumUsers: premiumResult.count || 0,
        freeUsers: (usersResult.count || 0) - (premiumResult.count || 0),
        totalVisions: visionsResult.count || 0,
        totalRevenue,
        totalWalletBalance,
        ordersCount: totalOrders.length,
      };
    },
    enabled: isAdmin === true,
    staleTime: 30000,
  });

  // Redirect if not admin
  if (!authLoading && !adminLoading && (!user || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const formatCents = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
            Refresh
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
                <h1 className="text-3xl font-bold">CEO Command Center</h1>
                <p className="text-muted-foreground">Complete user & order management for Alec Arthur Shelton</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <AdminUserCountBadge />
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                  <Shield className="h-3 w-3 mr-1" />
                  CEO Access
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">Total Users</span>
              </div>
              <p className="text-xl font-bold">{overviewStats?.totalUsers || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Crown className="h-3 w-3" />
                <span className="text-xs">Premium</span>
              </div>
              <p className="text-xl font-bold text-primary">{overviewStats?.premiumUsers || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">Free Users</span>
              </div>
              <p className="text-xl font-bold">{overviewStats?.freeUsers || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Image className="h-3 w-3" />
                <span className="text-xs">Total Visions</span>
              </div>
              <p className="text-xl font-bold">{overviewStats?.totalVisions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="h-3 w-3" />
                <span className="text-xs">Orders</span>
              </div>
              <p className="text-xl font-bold">{overviewStats?.ordersCount || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Revenue</span>
              </div>
              <p className="text-xl font-bold text-green-500">{formatCents(overviewStats?.totalRevenue || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet className="h-3 w-3" />
                <span className="text-xs">Wallet Balance</span>
              </div>
              <p className="text-xl font-bold">{formatCents(overviewStats?.totalWalletBalance || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links to CEO-Only Features */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">CEO Quick Access</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/stock-predictions">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <LineChart className="h-4 w-4" />
                Stock Predictions
              </Button>
            </Link>
            <Link to="/trading">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Zap className="h-4 w-4" />
                Trading Terminal
              </Button>
            </Link>
            <Link to="/strategic-plan">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <FileText className="h-4 w-4" />
                Strategic Plan
              </Button>
            </Link>
            <Link to="/code-analysis">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Code className="h-4 w-4" />
                Code Analyzer
              </Button>
            </Link>
            <Link to="/showcase">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Presentation className="h-4 w-4" />
                Showcase Tour
              </Button>
            </Link>
            <Link to="/investor-portal">
              <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Sparkles className="h-4 w-4" />
                Investor Portal
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="economics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Econ</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Subs</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maint.</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="codebase" className="gap-2 text-amber-500">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Code</span>
            </TabsTrigger>
            <TabsTrigger value="universal" className="gap-2 text-violet-500">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Universal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUserList 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectUser={setSelectedUserId}
            />
          </TabsContent>

          <TabsContent value="economics">
            <AdminEconomicsPanel />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrdersPanel />
          </TabsContent>

          <TabsContent value="subscriptions">
            <AdminSubscriptionsPanel />
          </TabsContent>

          <TabsContent value="activity">
            <AdminActivityFeed />
          </TabsContent>

          <TabsContent value="locations">
            <AdminLocationAnalytics />
          </TabsContent>

          <TabsContent value="security">
            <AdminSecurityAuditLog />
          </TabsContent>

          <TabsContent value="maintenance">
            <AdminMaintenancePanel />
          </TabsContent>

          <TabsContent value="health">
            <AdminHealthPanel />
          </TabsContent>

          <TabsContent value="codebase">
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Code className="h-6 w-6 text-amber-500" />
                  Self-Healing Codebase System
                </h2>
                <p className="text-muted-foreground">
                  Continuous analysis and auto-fix capabilities for the En Pensent platform
                </p>
              </div>
              
              {/* Auto-Heal Panel */}
              <AutoHealPanel />
              
              {/* Live Codebase Debugger */}
              <LiveCodebaseDebugger />
            </div>
          </TabsContent>

          <TabsContent value="universal">
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Network className="h-6 w-6 text-violet-500" />
                  Unified System Command Center
                </h2>
                <p className="text-muted-foreground">
                  Real-time telemetry from code analysis, adapters, evolution events, and cross-domain resonance
                </p>
              </div>
              
              {/* Unified System Dashboard with live visualizations */}
              <UnifiedSystemDashboard />
            </div>
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        <AdminUserDetailModal 
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </main>

      <Footer />
    </div>
  );
};

export default AdminCEODashboard;
