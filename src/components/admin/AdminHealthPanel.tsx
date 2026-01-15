import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertCircle, CheckCircle, Clock, Play, RefreshCw, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ErrorSummary {
  total_unresolved: number;
  last_24h_errors: number;
  by_type: Array<{ type: string; count: number }>;
  top_errors: Array<{
    id: string;
    message: string;
    component: string | null;
    count: number;
    last_seen: string;
  }>;
  recent_health_checks: Array<{
    id: string;
    type: string;
    status: string;
    issues_found: number;
    issues_fixed: number;
    completed_at: string;
  }>;
}

export function AdminHealthPanel() {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const queryClient = useQueryClient();

  const { data: errorSummary, isLoading } = useQuery({
    queryKey: ['error-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_error_summary', { p_days: 7 });
      if (error) throw error;
      return data as unknown as ErrorSummary;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data as { issues_fixed: number; success: boolean };
    },
    onSuccess: (data) => {
      toast.success(`Health check completed: ${data?.issues_fixed || 0} issues fixed`);
      queryClient.invalidateQueries({ queryKey: ['error-summary'] });
    },
    onError: (error: Error) => {
      toast.error(`Health check failed: ${error.message}`);
    },
  });

  const runDataIntegrityCheck = async () => {
    setIsRunningCheck(true);
    try {
      const { data, error } = await supabase.rpc('validate_and_fix_data_integrity');
      if (error) throw error;
      const result = data as unknown as { issues_fixed: number };
      toast.success(`Data integrity check: ${result?.issues_fixed || 0} issues fixed`);
      queryClient.invalidateQueries({ queryKey: ['error-summary'] });
    } catch (err) {
      toast.error(`Check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunningCheck(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Automated Monitoring
          </CardTitle>
          <CardDescription>
            Run health checks and data integrity validation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => runHealthCheckMutation.mutate()}
            disabled={runHealthCheckMutation.isPending}
          >
            {runHealthCheckMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Full Health Check
          </Button>
          <Button
            variant="outline"
            onClick={runDataIntegrityCheck}
            disabled={isRunningCheck}
          >
            {isRunningCheck ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Data Integrity Check
          </Button>
        </CardContent>
      </Card>

      {/* Error Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Unresolved Errors</span>
                <Badge variant={errorSummary?.total_unresolved ? 'destructive' : 'secondary'}>
                  {errorSummary?.total_unresolved || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last 24 Hours</span>
                <Badge variant="outline">{errorSummary?.last_24h_errors || 0}</Badge>
              </div>
              {errorSummary?.by_type && errorSummary.by_type.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">By Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {errorSummary.by_type.map((item) => (
                      <Badge key={item.type} variant="outline" className="text-xs">
                        {item.type}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Health Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {errorSummary?.recent_health_checks && errorSummary.recent_health_checks.length > 0 ? (
                <div className="space-y-3">
                  {errorSummary.recent_health_checks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {check.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        )}
                        <span className="text-sm font-medium">{check.type}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Fixed: {check.issues_fixed}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(check.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent health checks
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Top Errors */}
      {errorSummary?.top_errors && errorSummary.top_errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Unresolved Errors</CardTitle>
            <CardDescription>Most frequently occurring errors</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {errorSummary.top_errors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{error.message}</p>
                        {error.component && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Component: {error.component}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="destructive">{error.count}x</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(error.last_seen).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
