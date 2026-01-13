import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  Loader2, 
  Lock, 
  Sparkles,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';
import { generatePremiumAnalytics, getPremiumAnalyticsHistory } from '@/lib/analytics/financialTrends';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function PremiumAnalyticsDashboard() {
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<'market_trends' | 'engagement_insights' | 'portfolio_analysis'>('market_trends');

  const { data: analyticsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['premium-analytics-history'],
    queryFn: getPremiumAnalyticsHistory,
    enabled: !!user && isPremium,
  });

  const generateMutation = useMutation({
    mutationFn: (type: 'market_trends' | 'engagement_insights' | 'portfolio_analysis') => 
      generatePremiumAnalytics(type),
    onSuccess: (data) => {
      if (data) {
        toast.success('Analytics generated successfully!');
        queryClient.invalidateQueries({ queryKey: ['premium-analytics-history'] });
      }
    },
    onError: (error) => {
      toast.error('Failed to generate analytics');
      console.error(error);
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Premium Analytics</CardTitle>
          <CardDescription>
            Unlock exclusive market insights, engagement data, and portfolio analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 rounded-lg bg-background/50">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold">Market Trends</h4>
              <p className="text-sm text-muted-foreground">
                Palette & gamecard performance data
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <BarChart3 className="h-8 w-8 text-accent mx-auto mb-2" />
              <h4 className="font-semibold">Engagement Insights</h4>
              <p className="text-sm text-muted-foreground">
                Top visions & activity patterns
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold">Portfolio Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Your holdings & earnings breakdown
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Premium Analytics
          </h2>
          <p className="text-muted-foreground">
            Exclusive market data and insights for Visionary members
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Premium Access
        </Badge>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market_trends" className="gap-2">
            <LineChart className="h-4 w-4" />
            Market Trends
          </TabsTrigger>
          <TabsTrigger value="engagement_insights" className="gap-2">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="portfolio_analysis" className="gap-2">
            <PieChart className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market_trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends Report</CardTitle>
              <CardDescription>
                Performance data for palettes, gamecards, and overall market activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Palette Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      See which color palettes are driving the most engagement and value
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Gamecard Rankings</h4>
                    <p className="text-sm text-muted-foreground">
                      Track legendary game value appreciation and usage trends
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => generateMutation.mutate('market_trends')}
                  disabled={generateMutation.isPending}
                  className="w-full gap-2"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  Generate Market Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement_insights" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Insights</CardTitle>
              <CardDescription>
                Discover top-performing visions and optimal activity times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Top Visions</h4>
                    <p className="text-sm text-muted-foreground">
                      Ranked by total score, views, downloads, and trades
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Activity Patterns</h4>
                    <p className="text-sm text-muted-foreground">
                      Best times to list and engage for maximum visibility
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => generateMutation.mutate('engagement_insights')}
                  disabled={generateMutation.isPending}
                  className="w-full gap-2"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  Generate Engagement Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio_analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of your vision holdings and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Holdings Breakdown</h4>
                    <p className="text-sm text-muted-foreground">
                      Each vision with score, royalties earned, and estimated value
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold mb-2">Total Portfolio Value</h4>
                    <p className="text-sm text-muted-foreground">
                      Combined value of all your digital vision assets
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => generateMutation.mutate('portfolio_analysis')}
                  disabled={generateMutation.isPending}
                  className="w-full gap-2"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                  Generate Portfolio Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics History */}
      {analyticsHistory && analyticsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsHistory.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {report.analyticsType === 'market_trends' && <LineChart className="h-4 w-4 text-primary" />}
                    {report.analyticsType === 'engagement_insights' && <Activity className="h-4 w-4 text-accent" />}
                    {report.analyticsType === 'portfolio_analysis' && <PieChart className="h-4 w-4 text-primary" />}
                    <div>
                      <p className="font-medium capitalize">
                        {report.analyticsType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generated {new Date(report.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Expires {new Date(report.expiresAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
