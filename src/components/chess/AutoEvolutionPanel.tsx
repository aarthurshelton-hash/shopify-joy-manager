/**
 * Auto-Evolution Control Panel v6.93
 * 
 * Real-time dashboard for the self-healing evolution engine:
 * - Start/Stop/Pause controls
 * - Live stats and progress
 * - Pool status indicators
 * - Health monitoring
 */

import { useAutoEvolution } from '@/hooks/useAutoEvolution';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Zap, 
  Activity,
  Cloud,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Timer,
  Database
} from 'lucide-react';

export function AutoEvolutionPanel() {
  const {
    isRunning,
    isPaused,
    sessionPredictions,
    totalPredictions,
    cloudPredictions,
    localPredictions,
    consecutiveErrors,
    recoveryCount,
    poolStatus,
    sessionDuration,
    lastSuccess,
    lastError,
    start,
    stop,
    pause,
    resume,
    forceCloud,
    forceLocal,
    version,
  } = useAutoEvolution();
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'recovering': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': 
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Running</Badge>;
      case 'error': 
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Error</Badge>;
      case 'recovering': 
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Recovering</Badge>;
      default: 
        return <Badge variant="outline">Idle</Badge>;
    }
  };
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
            <CardTitle className="text-lg">Auto-Evolution Engine</CardTitle>
            <Badge variant="outline" className="text-xs">v{version}</Badge>
          </div>
          
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={start} size="sm" className="gap-1">
                <Play className="h-4 w-4" />
                Start
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button onClick={resume} size="sm" variant="outline" className="gap-1">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pause} size="sm" variant="outline" className="gap-1">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={stop} size="sm" variant="destructive" className="gap-1">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>
          v6.94-BULLETPROOF • Local Stockfish only • No external API dependencies
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3 w-3" />
              Session
            </div>
            <div className="text-2xl font-bold text-primary">{sessionPredictions}</div>
            <div className="text-xs text-muted-foreground">{sessionDuration}</div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Database className="h-3 w-3" />
              Total
            </div>
            <div className="text-2xl font-bold">{totalPredictions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">all time</div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Cpu className="h-3 w-3" />
              Volume Pool
            </div>
            <div className="text-xl font-bold text-blue-400">{cloudPredictions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">D18 ~100/hr</div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Cpu className="h-3 w-3" />
              Deep Pool
            </div>
            <div className="text-xl font-bold text-purple-400">{localPredictions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">D30 ~5/hr</div>
          </div>
        </div>
        
        {/* Pool Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">VOLUME (D18)</span>
              </div>
              {getStatusBadge(poolStatus.cloud)}
            </div>
            {isRunning && (
              <Button 
                onClick={forceCloud} 
                size="sm" 
                variant="ghost" 
                className="w-full mt-2 h-7 text-xs"
                disabled={poolStatus.cloud === 'running'}
              >
                <Zap className="h-3 w-3 mr-1" />
                Force Batch
              </Button>
            )}
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">DEEP (D30)</span>
              </div>
              {getStatusBadge(poolStatus.local)}
            </div>
            {isRunning && (
              <Button 
                onClick={forceLocal} 
                size="sm" 
                variant="ghost" 
                className="w-full mt-2 h-7 text-xs"
                disabled={poolStatus.local === 'running'}
              >
                <Zap className="h-3 w-3 mr-1" />
                Force Batch
              </Button>
            )}
          </div>
        </div>
        
        {/* Health Status */}
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {consecutiveErrors > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">
                  {consecutiveErrors > 0 ? `${consecutiveErrors} errors` : 'Healthy'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw className="h-3 w-3" />
                {recoveryCount} recoveries
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Timer className="h-3 w-3" />
                Last success: {lastSuccess}
              </div>
            </div>
          </div>
        </div>
        
        {/* Info Banner */}
        {isRunning && !isPaused && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-center">
            <span className="text-primary font-medium">🚀 v6.94 ACTIVE</span>
            <span className="text-muted-foreground"> • Volume batch every 6min • Deep batch every 12min • LOCAL STOCKFISH ONLY</span>
          </div>
        )}
        
        {isPaused && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-center">
            <span className="text-yellow-500 font-medium">⏸️ Paused</span>
            <span className="text-muted-foreground"> • Click Resume to continue data absorption</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AutoEvolutionPanel;
