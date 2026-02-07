import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, Brain, Heart, Zap, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Play, Pause, Cpu
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EdgeFunctionMonitor } from './EdgeFunctionMonitor';

interface SystemVital {
  vital_name: string;
  vital_type: string;
  status: string;
  last_pulse_at: string;
  seconds_since_pulse: number;
  pulse_count: number;
  last_value: number;
  target_value: number;
  is_healthy: boolean;
  metadata: {
    description?: string;
    interval_ms?: number;
    ticksCollected?: number;
    predictionsGenerated?: number;
    error?: string;
    [key: string]: unknown;
  };
}

interface EvolutionState {
  generation: number;
  fitness_score: number;
  total_predictions: number;
  last_mutation_at: string;
  genes: Record<string, number>;
}

interface SystemStats {
  totalTicks: number;
  totalPredictions: number;
  resolvedPredictions: number;
  correctPredictions: number;
  overallAccuracy: number;
}

const vitalIcons: Record<string, React.ReactNode> = {
  'market-collector': <Activity className="h-5 w-5" />,
  'prediction-engine': <Brain className="h-5 w-5" />,
  'resolution-engine': <CheckCircle className="h-5 w-5" />,
  'evolution-engine': <Cpu className="h-5 w-5" />,
  'correlation-engine': <TrendingUp className="h-5 w-5" />,
  'autonomous-trader': <Zap className="h-5 w-5" />,
  'data-integrity': <Heart className="h-5 w-5" />,
  'prediction-accuracy': <TrendingUp className="h-5 w-5" />,
  'system-fitness': <Activity className="h-5 w-5" />,
};

export function SystemVitalsDashboard() {
  const queryClient = useQueryClient();

  // Fetch system vitals
  const { data: vitals, isLoading: vitalsLoading, refetch: refetchVitals } = useQuery({
    queryKey: ['system-vitals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_vitals');
      if (error) throw error;
      return data as SystemVital[];
    },
    refetchInterval: 5000,
  });

  // Fetch evolution state
  const { data: evolution } = useQuery({
    queryKey: ['evolution-state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();
      if (error) throw error;
      return data as EvolutionState;
    },
    refetchInterval: 10000,
  });

  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const [ticksResult, predictionsResult, resolvedResult] = await Promise.all([
        supabase.from('market_tick_history').select('id', { count: 'exact', head: true }),
        supabase.from('prediction_outcomes').select('id', { count: 'exact', head: true }),
        supabase.from('prediction_outcomes').select('direction_correct').not('resolved_at', 'is', null),
      ]);

      const resolved = resolvedResult.data || [];
      const correct = resolved.filter(p => p.direction_correct).length;

      return {
        totalTicks: ticksResult.count || 0,
        totalPredictions: predictionsResult.count || 0,
        resolvedPredictions: resolved.length,
        correctPredictions: correct,
        overallAccuracy: resolved.length > 0 ? correct / resolved.length : 0,
      } as SystemStats;
    },
    refetchInterval: 10000,
  });

  // Trigger heartbeat manually
  const triggerHeartbeat = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-heartbeat', {
        body: { action: 'full_cycle' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Heartbeat triggered successfully', {
        description: `Collected ${data?.collect?.ticks || 0} ticks, ${data?.predict?.predictions || 0} predictions`
      });
      queryClient.invalidateQueries({ queryKey: ['system-vitals'] });
      queryClient.invalidateQueries({ queryKey: ['system-stats'] });
    },
    onError: (error) => {
      toast.error('Heartbeat failed', { description: error.message });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const formatTimeSince = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const heartbeatVitals = vitals?.filter(v => v.vital_type === 'heartbeat') || [];
  const metricVitals = vitals?.filter(v => v.vital_type === 'metric') || [];
  const healthyCount = vitals?.filter(v => v.is_healthy).length || 0;
  const totalCount = vitals?.length || 0;
  const systemHealth = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

  if (vitalsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className={`h-6 w-6 ${systemHealth >= 80 ? 'text-green-500 animate-pulse' : systemHealth >= 50 ? 'text-yellow-500' : 'text-destructive'}`} />
              System Vitals
            </CardTitle>
            <CardDescription>Living system health at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Health</span>
                <span className="font-bold">{Math.round(systemHealth)}%</span>
              </div>
              <Progress value={systemHealth} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span>{healthyCount} of {totalCount} systems healthy</span>
                <Button 
                  size="sm" 
                  onClick={() => triggerHeartbeat.mutate()}
                  disabled={triggerHeartbeat.isPending}
                >
                  {triggerHeartbeat.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Trigger Heartbeat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Gen {evolution?.generation || 0}</div>
            <p className="text-sm text-muted-foreground">
              Fitness: {((evolution?.fitness_score || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {evolution?.total_predictions?.toLocaleString() || 0} total predictions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((stats?.overallAccuracy || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {stats?.correctPredictions || 0} / {stats?.resolvedPredictions || 0} correct
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalTicks?.toLocaleString() || 0} ticks collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heartbeat Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Subsystem Heartbeats
          </CardTitle>
          <CardDescription>Real-time status of all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {heartbeatVitals.map((vital) => (
              <div 
                key={vital.vital_name}
                className={`p-4 rounded-lg border transition-colors ${
                  vital.is_healthy 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : vital.status === 'degraded'
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : vital.status === 'critical'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(vital.status)}>
                      {vitalIcons[vital.vital_name] || <Activity className="h-5 w-5" />}
                    </span>
                    <span className="font-medium capitalize">
                      {vital.vital_name.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <Badge variant={getStatusBadge(vital.status)}>
                    {vital.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {vital.metadata?.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Last pulse: {formatTimeSince(vital.seconds_since_pulse)}
                  </span>
                  <span className="font-mono text-xs">
                    #{vital.pulse_count.toLocaleString()}
                  </span>
                </div>
                {vital.is_healthy ? (
                  <div className="mt-2 h-1 bg-green-500/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 animate-pulse"
                      style={{ 
                        width: `${Math.max(10, 100 - (vital.seconds_since_pulse / ((vital.metadata?.interval_ms || 60000) / 1000) * 100))}%` 
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-2 h-1 bg-destructive/30 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {metricVitals.map((vital) => (
              <div 
                key={vital.vital_name}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium capitalize">
                    {vital.vital_name.replace(/-/g, ' ')}
                  </span>
                  {vital.is_healthy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">
                      {(vital.last_value * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Target: {(vital.target_value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={vital.last_value * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolution Genes */}
      {evolution?.genes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Evolution Genes (Generation {evolution.generation})
            </CardTitle>
            <CardDescription>Current genetic parameters guiding predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {Object.entries(evolution.genes).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xl font-mono font-bold">
                    {typeof value === 'number' ? value.toFixed(3) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Edge Function Monitor */}
      <EdgeFunctionMonitor />
    </div>
  );
}
