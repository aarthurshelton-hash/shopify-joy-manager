import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Users, Star, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Visionary emails with permanent premium - synced with edge functions
const VISIONARY_EMAILS = [
  { email: 'a.arthur.shelton@gmail.com', name: 'Alec Arthur Shelton', role: 'CEO & Founder' },
  { email: 'info@mawuli.xyz', name: 'Mawuli', role: 'Marketplace Tester' },
  { email: 'opecoreug@gmail.com', name: 'Product Specialist', role: 'Overseas Analyst' },
];

export const AdminEconomicsPanel: React.FC = () => {
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

  // Fetch visionary user details
  const { data: visionaryUsers } = useQuery({
    queryKey: ['admin-visionary-users'],
    queryFn: async () => {
      const emails = VISIONARY_EMAILS.map(v => v.email);
      const { data: users } = await supabase.auth.admin.listUsers();
      
      // Note: This requires admin access - fallback to showing config
      return VISIONARY_EMAILS;
    },
  });

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

      {/* Visionary Members */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Visionary Members
          </CardTitle>
          <CardDescription>
            Permanent premium access holders (internal team & partners)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {VISIONARY_EMAILS.map((visionary, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      {visionary.role === 'CEO & Founder' ? (
                        <Crown className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{visionary.name}</p>
                      <p className="text-xs text-muted-foreground">{visionary.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                    {visionary.role}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Platform Economics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Total Premium Access</p>
              <p className="font-bold text-lg">{userStats?.totalPremium || 0}</p>
              <p className="text-[10px] text-muted-foreground">
                ({userStats?.visionaryCount} visionary + {userStats?.paidPremium} paid)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Total Visions Created</p>
              <p className="font-bold text-lg">{userStats?.totalVisions || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Free-to-Paid Rate</p>
              <p className="font-bold text-lg">{userStats?.conversionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
