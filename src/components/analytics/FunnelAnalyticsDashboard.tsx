import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, TrendingUp, Users, Eye, MousePointer, 
  CreditCard, Crown, RefreshCw, Calendar, ArrowRight,
  Beaker, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  MEMBERSHIP_CARD_TESTS, 
  getABTestResults,
  type VariantId 
} from '@/lib/analytics/abTesting';
import { MEMBERSHIP_METRICS } from '@/lib/analytics/membershipFunnel';

interface FunnelStep {
  name: string;
  eventType: string;
  count: number;
  conversionFromPrevious: number;
}

interface FunnelData {
  steps: FunnelStep[];
  totalModalViews: number;
  totalSignups: number;
  totalCheckouts: number;
  totalSubscriptions: number;
  overallConversion: number;
  topTriggers: { source: string; count: number; conversion: number }[];
}

interface ABTestResult {
  testId: string;
  testName: string;
  variants: {
    variant: VariantId;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }[];
  winner: VariantId | null;
  confidence: number;
}

const FunnelAnalyticsDashboard: React.FC = () => {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [abResults, setABResults] = useState<ABTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | '90'>('30');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const daysBack = parseInt(dateRange);
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Fetch funnel events
      const { data: events, error } = await supabase
        .from('membership_funnel_events')
        .select('event_type, trigger_source, converted_to_signup, converted_to_premium, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process funnel data
      const eventCounts: Record<string, number> = {
        modal_view: 0,
        feature_hover: 0,
        cta_click: 0,
        signup_started: 0,
        signup_completed: 0,
        checkout_started: 0,
        subscription_active: 0,
      };

      const triggerCounts: Record<string, { views: number; signups: number }> = {};

      for (const event of events || []) {
        if (eventCounts[event.event_type] !== undefined) {
          eventCounts[event.event_type]++;
        }

        if (event.event_type === 'modal_view' && event.trigger_source) {
          if (!triggerCounts[event.trigger_source]) {
            triggerCounts[event.trigger_source] = { views: 0, signups: 0 };
          }
          triggerCounts[event.trigger_source].views++;
        }

        if (event.event_type === 'signup_completed' && event.trigger_source) {
          if (!triggerCounts[event.trigger_source]) {
            triggerCounts[event.trigger_source] = { views: 0, signups: 0 };
          }
          triggerCounts[event.trigger_source].signups++;
        }
      }

      const steps: FunnelStep[] = [
        { 
          name: 'Modal Views', 
          eventType: 'modal_view', 
          count: eventCounts.modal_view,
          conversionFromPrevious: 100
        },
        { 
          name: 'Feature Engagement', 
          eventType: 'feature_hover', 
          count: eventCounts.feature_hover,
          conversionFromPrevious: eventCounts.modal_view > 0 
            ? (eventCounts.feature_hover / eventCounts.modal_view) * 100 : 0
        },
        { 
          name: 'Sign Up Started', 
          eventType: 'signup_started', 
          count: eventCounts.signup_started,
          conversionFromPrevious: eventCounts.modal_view > 0 
            ? (eventCounts.signup_started / eventCounts.modal_view) * 100 : 0
        },
        { 
          name: 'Sign Up Completed', 
          eventType: 'signup_completed', 
          count: eventCounts.signup_completed,
          conversionFromPrevious: eventCounts.signup_started > 0 
            ? (eventCounts.signup_completed / eventCounts.signup_started) * 100 : 0
        },
        { 
          name: 'Checkout Started', 
          eventType: 'checkout_started', 
          count: eventCounts.checkout_started,
          conversionFromPrevious: eventCounts.signup_completed > 0 
            ? (eventCounts.checkout_started / eventCounts.signup_completed) * 100 : 0
        },
        { 
          name: 'Subscribed', 
          eventType: 'subscription_active', 
          count: eventCounts.subscription_active,
          conversionFromPrevious: eventCounts.checkout_started > 0 
            ? (eventCounts.subscription_active / eventCounts.checkout_started) * 100 : 0
        },
      ];

      const topTriggers = Object.entries(triggerCounts)
        .map(([source, data]) => ({
          source,
          count: data.views,
          conversion: data.views > 0 ? (data.signups / data.views) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setFunnelData({
        steps,
        totalModalViews: eventCounts.modal_view,
        totalSignups: eventCounts.signup_completed,
        totalCheckouts: eventCounts.checkout_started,
        totalSubscriptions: eventCounts.subscription_active,
        overallConversion: eventCounts.modal_view > 0 
          ? (eventCounts.subscription_active / eventCounts.modal_view) * 100 : 0,
        topTriggers,
      });

      // Fetch A/B test results
      const abTestResults: ABTestResult[] = [];
      for (const test of Object.values(MEMBERSHIP_CARD_TESTS)) {
        const results = await getABTestResults(test.testId, daysBack);
        abTestResults.push({
          testId: test.testId,
          testName: test.testName,
          ...results,
        });
      }
      setABResults(abTestResults);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">
              Conversion Funnel Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time membership funnel tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Badge variant="outline" className="text-xs">
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-card border border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Modal Views</span>
          </div>
          <p className="text-2xl font-display font-bold">{funnelData?.totalModalViews || 0}</p>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{MEMBERSHIP_METRICS.weeklyGrowth} this week
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-card border border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Sign Ups</span>
          </div>
          <p className="text-2xl font-display font-bold">{funnelData?.totalSignups || 0}</p>
          <p className="text-xs text-muted-foreground">
            {((funnelData?.totalSignups || 0) / Math.max(funnelData?.totalModalViews || 1, 1) * 100).toFixed(1)}% of views
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-card border border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Checkouts</span>
          </div>
          <p className="text-2xl font-display font-bold">{funnelData?.totalCheckouts || 0}</p>
          <p className="text-xs text-muted-foreground">
            {((funnelData?.totalCheckouts || 0) / Math.max(funnelData?.totalSignups || 1, 1) * 100).toFixed(1)}% of signups
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Subscribed</span>
          </div>
          <p className="text-2xl font-display font-bold text-primary">{funnelData?.totalSubscriptions || 0}</p>
          <p className="text-xs text-primary/70">
            {(funnelData?.overallConversion || 0).toFixed(2)}% overall
          </p>
        </motion.div>
      </div>

      {/* Funnel Visualization */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-card border border-border"
      >
        <h3 className="font-display font-bold uppercase tracking-wide mb-6 flex items-center gap-2">
          <MousePointer className="h-4 w-4 text-primary" />
          Conversion Funnel
        </h3>

        <div className="space-y-4">
          {funnelData?.steps.map((step, index) => {
            const maxCount = Math.max(...(funnelData?.steps.map(s => s.count) || [1]));
            const widthPercent = (step.count / maxCount) * 100;
            
            return (
              <div key={step.eventType} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">{step.count}</span>
                    {index > 0 && (
                      <Badge 
                        variant={step.conversionFromPrevious > 50 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {step.conversionFromPrevious.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg"
                  />
                </div>
                {index < (funnelData?.steps.length || 0) - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Trigger Sources */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-card border border-border"
      >
        <h3 className="font-display font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Trigger Sources
        </h3>

        <div className="grid md:grid-cols-5 gap-4">
          {funnelData?.topTriggers.map((trigger, index) => (
            <div key={trigger.source} className="p-3 rounded-lg bg-muted/50 text-center">
              <Badge variant="outline" className="mb-2 capitalize">
                {trigger.source}
              </Badge>
              <p className="text-xl font-display font-bold">{trigger.count}</p>
              <p className="text-xs text-muted-foreground">
                {trigger.conversion.toFixed(1)}% conv.
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* A/B Test Results */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-card border border-border"
      >
        <h3 className="font-display font-bold uppercase tracking-wide mb-6 flex items-center gap-2">
          <Beaker className="h-4 w-4 text-primary" />
          A/B Test Results
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {abResults.map((test) => (
            <div key={test.testId} className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{test.testName}</h4>
                {test.winner ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Winner: {test.winner}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{test.confidence.toFixed(0)}% confidence</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Collecting data
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {test.variants.length > 0 ? (
                  test.variants.map((variant) => (
                    <div key={variant.variant} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                            {variant.variant}
                          </span>
                          {variant.impressions} impressions
                        </span>
                        <span className="font-medium">
                          {variant.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={variant.conversionRate} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No data collected yet
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Live Metrics Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="font-display font-bold uppercase tracking-wide">Live Membership Metrics</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-display font-bold">{MEMBERSHIP_METRICS.activeVisionaries.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active Visionaries</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-primary">${(MEMBERSHIP_METRICS.currentARR / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground">Current ARR</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-green-600">{MEMBERSHIP_METRICS.grossMargin}%</p>
            <p className="text-xs text-muted-foreground">Gross Margin</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold">{MEMBERSHIP_METRICS.modalConversionRate}%</p>
            <p className="text-xs text-muted-foreground">Modal → Signup</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold">{MEMBERSHIP_METRICS.signupToPremiumRate}%</p>
            <p className="text-xs text-muted-foreground">Signup → Premium</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FunnelAnalyticsDashboard;
