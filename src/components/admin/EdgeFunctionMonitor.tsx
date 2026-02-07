/**
 * Edge Function Monitor Dashboard Component
 * 
 * Real-time monitoring dashboard for Supabase Edge Functions health,
 * performance metrics, and operational status.
 */

import { useState } from 'react';
import { useEdgeFunctionMonitor } from '@/hooks/useEdgeFunctionMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface EdgeFunctionMonitorProps {
  className?: string;
}

export function EdgeFunctionMonitor({ className }: EdgeFunctionMonitorProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    results,
    isLoading,
    lastUpdated,
    systemStatus,
    error,
    checkHealth,
    checkSingleFunction,
    healthyCount,
    warningCount,
    errorCount,
    totalCount,
    getAllMetrics,
  } = useEdgeFunctionMonitor({
    autoRefresh: true,
    refreshInterval: 30_000,
  });

  const metrics = getAllMetrics();

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSystemStatusBadge = () => {
    switch (systemStatus) {
      case 'healthy':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Activity className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className={className}>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Edge Function Monitor</CardTitle>
                <CardDescription>
                  Real-time health monitoring for Supabase Edge Functions
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSystemStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkHealth()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="functions">
                <Server className="h-4 w-4 mr-2" />
                Functions
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Metrics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{totalCount}</p>
                      </div>
                      <Server className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Healthy</p>
                        <p className="text-2xl font-bold text-emerald-500">{healthyCount}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Warning</p>
                        <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Error</p>
                        <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.functionName}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.functionName}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.status} • {Math.round(result.responseTime)}ms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(result.status)}`} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkSingleFunction(result.functionName)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No functions monitored yet</p>
                  <Button
                    variant="outline"
                    onClick={() => checkHealth()}
                    className="mt-4"
                    disabled={isLoading}
                  >
                    Start Monitoring
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Functions Tab */}
            <TabsContent value="functions" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result) => (
                      <Card key={result.functionName}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(result.status)}
                              <div>
                                <p className="font-medium">{result.functionName}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{Math.round(result.responseTime)}ms response</span>
                                  <span>•</span>
                                  <span>
                                    Checked: {new Date(result.lastChecked).toLocaleTimeString()}
                                  </span>
                                </div>
                                {result.error && (
                                  <p className="text-xs text-red-500 mt-1">{result.error}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={result.status === 'healthy' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                          {result.details && Object.keys(result.details).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Details:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No function details available</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {metrics.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.map((metric) => (
                      <Card key={metric.functionName}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <p className="font-medium">{metric.functionName}</p>
                            </div>
                            <Badge variant="outline">
                              {metric.totalInvocations} calls
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Avg Response</p>
                              <p className="font-medium">{Math.round(metric.averageResponseTime)}ms</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">P95 Response</p>
                              <p className="font-medium">{Math.round(metric.p95ResponseTime)}ms</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">P99 Response</p>
                              <p className="font-medium">{Math.round(metric.p99ResponseTime)}ms</p>
                            </div>
                          </div>
                          {metric.errorRate > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-red-500">
                                Error Rate: {(metric.errorRate * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No metrics available yet</p>
                    <p className="text-xs mt-2">
                      Metrics are collected as functions are invoked
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default EdgeFunctionMonitor;
