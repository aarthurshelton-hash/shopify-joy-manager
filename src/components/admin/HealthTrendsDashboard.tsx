import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, AlertTriangle, Bell, BellOff, CheckCircle, Clock, 
  RefreshCw, Shield, TrendingDown, TrendingUp, XCircle, Zap 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';

interface HealthTrends {
  daily_trends: Array<{
    date: string;
    errors_reported: number;
    errors_resolved: number;
    issues_found: number;
    issues_fixed: number;
    api_requests: number;
    rate_limited: number;
  }>;
  hourly_trends: Array<{
    date: string;
    hour: number;
    errors: number;
    fixed: number;
    requests: number;
  }>;
  totals: {
    total_errors: number;
    total_resolved: number;
    total_issues_found: number;
    total_issues_fixed: number;
    total_requests: number;
    total_rate_limited: number;
  };
  active_alerts: number;
  critical_alerts: number;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function HealthTrendsDashboard() {
  const [timeRange, setTimeRange] = useState(7);
  const queryClient = useQueryClient();

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['health-trends', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_health_trends', { p_days: timeRange });
      if (error) throw error;
      return data as unknown as HealthTrends;
    },
    refetchInterval: 60000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_alerts', { 
        p_include_resolved: false,
        p_limit: 50 
      });
      if (error) throw error;
      return (data as unknown as SystemAlert[]) || [];
    },
    refetchInterval: 30000,
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.rpc('acknowledge_alert', { p_alert_id: alertId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.rpc('resolve_alert', { p_alert_id: alertId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['health-trends'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (trendsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totals = trends?.totals || {
    total_errors: 0,
    total_resolved: 0,
    total_issues_found: 0,
    total_issues_fixed: 0,
    total_requests: 0,
    total_rate_limited: 0,
  };

  const resolutionRate = totals.total_errors > 0 
    ? Math.round((totals.total_resolved / totals.total_errors) * 100) 
    : 100;

  const fixRate = totals.total_issues_found > 0
    ? Math.round((totals.total_issues_fixed / totals.total_issues_found) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {(trends?.critical_alerts || 0) > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {trends?.critical_alerts} Critical Alert{trends?.critical_alerts !== 1 ? 's' : ''} Require Attention
                </p>
                <p className="text-sm text-muted-foreground">
                  Review and resolve critical issues immediately
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Resolution</CardTitle>
            {resolutionRate >= 80 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.total_resolved} / {totals.total_errors} errors resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fixRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.total_issues_fixed} / {totals.total_issues_found} auto-fixed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.total_requests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limited</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total_rate_limited}</div>
            <p className="text-xs text-muted-foreground">
              {totals.total_requests > 0 
                ? ((totals.total_rate_limited / totals.total_requests) * 100).toFixed(2)
                : 0}% of requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {(trends?.active_alerts || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {trends?.active_alerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Error & Issue Trends</CardTitle>
                <CardDescription>Daily error rates and auto-fix performance</CardDescription>
              </div>
              <div className="flex gap-2">
                {[7, 14, 30].map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={timeRange === days ? 'default' : 'outline'}
                    onClick={() => setTimeRange(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends?.daily_trends?.slice().reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="errors_reported" 
                      name="Errors" 
                      stackId="1"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive)/0.3)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="errors_resolved" 
                      name="Resolved" 
                      stackId="2"
                      stroke="hsl(142, 76%, 36%)" 
                      fill="hsl(142, 76%, 36%, 0.3)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="issues_fixed" 
                      name="Auto-Fixed" 
                      stackId="3"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.3)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Traffic & Rate Limiting</CardTitle>
              <CardDescription>Request volume and protection metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends?.daily_trends?.slice().reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="api_requests" 
                      name="API Requests" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="rate_limited" 
                      name="Rate Limited" 
                      fill="hsl(var(--destructive))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                {(alerts?.length || 0)} unresolved alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : alerts && alerts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.severity === 'critical' 
                            ? 'border-destructive bg-destructive/5' 
                            : alert.severity === 'warning'
                            ? 'border-yellow-500/50 bg-yellow-500/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{alert.title}</p>
                                <Badge variant={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.alert_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {alert.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString()}
                                {alert.acknowledged_at && (
                                  <span className="ml-2 text-green-600">
                                    • Acknowledged
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {!alert.acknowledged_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlert.mutate(alert.id)}
                                disabled={acknowledgeAlert.isPending}
                              >
                                <BellOff className="h-3 w-3 mr-1" />
                                Ack
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => resolveAlert.mutate(alert.id)}
                              disabled={resolveAlert.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Tab */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity (Last 48 Hours)</CardTitle>
              <CardDescription>Granular view of system activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends?.hourly_trends?.slice().reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value, index) => {
                        const item = trends?.hourly_trends?.slice().reverse()[index];
                        if (!item) return '';
                        return `${value}:00`;
                      }}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          const item = payload[0].payload;
                          return `${item.date} ${item.hour}:00`;
                        }
                        return '';
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      name="Errors" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fixed" 
                      name="Fixed" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="requests" 
                      name="Requests" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}