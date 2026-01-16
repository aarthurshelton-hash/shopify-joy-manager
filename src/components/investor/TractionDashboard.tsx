import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Eye, Scan, GitBranch, TrendingUp, Database, Target, Zap, Radio } from 'lucide-react';
import { useRealtimeAccuracyContext } from '@/providers/RealtimeAccuracyProvider';

interface TractionMetrics {
  totalChessPatterns: number;
  totalCodeAnalyses: number;
  totalVisions: number;
  totalScans: number;
  totalViews: number;
  weeklyGrowth: number;
  uniqueOpenings: number;
  activeUsers: number;
}

export default function TractionDashboard() {
  const { isConnected, updateCount } = useRealtimeAccuracyContext();
  const [metrics, setMetrics] = useState<TractionMetrics>({
    totalChessPatterns: 0,
    totalCodeAnalyses: 0,
    totalVisions: 0,
    totalScans: 0,
    totalViews: 0,
    weeklyGrowth: 0,
    uniqueOpenings: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch real data from various tables
      const [
        patternsRes,
        codeRes,
        visionsRes,
        scansRes,
        openingsRes,
        usersRes,
      ] = await Promise.all([
        supabase.from('color_flow_patterns').select('id', { count: 'exact', head: true }),
        supabase.from('code_repository_patterns').select('id', { count: 'exact', head: true }),
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
        supabase.from('scan_history').select('id', { count: 'exact', head: true }),
        supabase.from('opening_value_pool').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      // Get aggregated views from vision_scores
      const viewsRes = await supabase
        .from('vision_scores')
        .select('view_count, scan_count');
      
      const totalViews = viewsRes.data?.reduce((acc, v) => acc + (v.view_count || 0), 0) || 0;
      const totalScansFromScores = viewsRes.data?.reduce((acc, v) => acc + (v.scan_count || 0), 0) || 0;

      setMetrics({
        totalChessPatterns: patternsRes.count || 0,
        totalCodeAnalyses: codeRes.count || 0,
        totalVisions: visionsRes.count || 0,
        totalScans: (scansRes.count || 0) + totalScansFromScores,
        totalViews: totalViews,
        weeklyGrowth: 23, // Placeholder - would calculate from time-series
        uniqueOpenings: openingsRes.count || 0,
        activeUsers: usersRes.count || 0,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching traction metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Re-fetch when realtime updates occur
  useEffect(() => {
    if (updateCount > 0) {
      fetchMetrics();
    }
  }, [updateCount, fetchMetrics]);

  // Set up realtime subscriptions for investor-relevant tables
  useEffect(() => {
    const channel = supabase
      .channel('investor-traction-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_visualizations' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'color_flow_patterns' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'code_repository_patterns' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_history' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchMetrics())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  const metricCards = [
    {
      title: 'Chess Patterns Analyzed',
      value: metrics.totalChessPatterns,
      icon: <Target className="h-5 w-5" />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      description: 'Unique game signatures extracted',
    },
    {
      title: 'Code Repos Analyzed',
      value: metrics.totalCodeAnalyses,
      icon: <GitBranch className="h-5 w-5" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'GitHub repositories processed',
    },
    {
      title: 'Visions Created',
      value: metrics.totalVisions,
      icon: <Eye className="h-5 w-5" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Visual pattern artworks generated',
    },
    {
      title: 'Pattern Scans',
      value: metrics.totalScans,
      icon: <Scan className="h-5 w-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Real-world scans performed',
    },
    {
      title: 'Total Views',
      value: metrics.totalViews,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      description: 'Pattern visualizations viewed',
    },
    {
      title: 'Registered Users',
      value: metrics.activeUsers,
      icon: <Database className="h-5 w-5" />,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      description: 'Platform accounts created',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live data synchronized' : 'Connecting...'}
          </span>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Radio className="h-3 w-3" />
          Updated {lastRefresh.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}>
                    {metric.icon}
                  </div>
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <span className="text-2xl font-bold">
                      {metric.value.toLocaleString()}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm">{metric.title}</h3>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Growth Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Combined Pattern Recognition</h3>
                <p className="text-sm text-muted-foreground">
                  Total patterns analyzed across chess + code domains
                </p>
              </div>
            </div>
            <div className="text-right">
              {loading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">
                    {(metrics.totalChessPatterns + metrics.totalCodeAnalyses + metrics.totalVisions).toLocaleString()}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    <Zap className="h-3 w-3 mr-1" />
                    2 domains live
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flywheel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The Data Flywheel Effect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <FlywheelStep step={1} label="More Users" />
            <Arrow />
            <FlywheelStep step={2} label="More Patterns" />
            <Arrow />
            <FlywheelStep step={3} label="Better Predictions" />
            <Arrow />
            <FlywheelStep step={4} label="More Value" />
            <Arrow />
            <span className="text-primary font-bold">↻ Repeat</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Every analysis makes the system smarter—creating an unbeatable data moat
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FlywheelStep({ step, label }: { step: number; label: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mx-auto mb-1">
        {step}
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function Arrow() {
  return <span className="text-muted-foreground hidden sm:inline">→</span>;
}
