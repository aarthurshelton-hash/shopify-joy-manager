import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Database,
  Bell,
  MessageSquare,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MaintenanceResult {
  success: boolean;
  message?: string;
  results?: {
    interactions_deleted: number;
    offers_deleted: number;
    notifications_deleted: number;
    analytics_deleted: number;
    funnel_events_deleted: number;
    maintenance_completed_at: string;
  };
  error?: string;
  executed_at: string;
}

export const AdminMaintenancePanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MaintenanceResult | null>(null);

  const runMaintenance = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('data-maintenance', {
        method: 'POST',
      });

      if (error) throw error;

      setLastResult(data as MaintenanceResult);
      
      if (data.success) {
        toast.success('Data maintenance completed successfully', {
          description: `Cleaned up old records from the database`,
        });
      } else {
        toast.error('Maintenance completed with errors', {
          description: data.error,
        });
      }
    } catch (error: any) {
      console.error('Maintenance error:', error);
      toast.error('Failed to run maintenance', {
        description: error.message,
      });
      setLastResult({
        success: false,
        error: error.message,
        executed_at: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Data Maintenance
          </CardTitle>
          <CardDescription>
            Clean up old records, expired data, and optimize database performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Interactions</p>
                <p className="text-xs text-muted-foreground">Deletes vision interactions older than 90 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Expired Offers</p>
                <p className="text-xs text-muted-foreground">Removes marketplace offers expired 30+ days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Notifications</p>
                <p className="text-xs text-muted-foreground">Clears read notifications older than 60 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Analytics Cache</p>
                <p className="text-xs text-muted-foreground">Removes expired premium analytics data</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Run Button */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={runMaintenance} 
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Maintenance Now
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              This runs automatically daily at 3:00 AM UTC
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Result Card */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Last Maintenance Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                {lastResult.success ? (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(lastResult.executed_at), 'PPpp')}
                </span>
              </div>

              {/* Results */}
              {lastResult.success && lastResult.results && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Interactions</span>
                    </div>
                    <p className="text-lg font-bold">
                      {lastResult.results.interactions_deleted.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Offers</span>
                    </div>
                    <p className="text-lg font-bold">
                      {lastResult.results.offers_deleted.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Notifications</span>
                    </div>
                    <p className="text-lg font-bold">
                      {lastResult.results.notifications_deleted.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Analytics</span>
                    </div>
                    <p className="text-lg font-bold">
                      {lastResult.results.analytics_deleted.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Funnel Events</span>
                    </div>
                    <p className="text-lg font-bold">
                      {lastResult.results.funnel_events_deleted.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {!lastResult.success && lastResult.error && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                  {lastResult.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
