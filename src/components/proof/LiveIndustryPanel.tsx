/**
 * LiveIndustryPanel - Real-time Industry Adapter Dashboard
 * 
 * Displays live-updating 8x8 grids for Manufacturing and Supply Chain domains,
 * plus cross-domain correlations with chess/code/market patterns.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Truck, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Link2
} from 'lucide-react';
import { LiveColorGrid } from '@/components/pensent-ui/LiveColorGrid';
import { useLiveIndustryData } from '@/hooks/useLiveIndustryData';
import { cn } from '@/lib/utils';

interface LiveIndustryPanelProps {
  enabled?: boolean;
  refreshInterval?: number;
  compact?: boolean;
  className?: string;
}

export function LiveIndustryPanel({
  enabled = true,
  refreshInterval = 3000,
  compact = false,
  className,
}: LiveIndustryPanelProps) {
  const industry = useLiveIndustryData({ enabled, refreshInterval });

  const significanceColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-amber-500/20 text-amber-400',
    breakthrough: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Industry Adapters</h3>
          {industry.isLive && (
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ● LIVE
              </motion.span>
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={industry.isLive ? industry.pause : industry.resume}
          >
            {industry.isLive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={industry.refresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'md:grid-cols-2')}>
        {/* Manufacturing Grid */}
        <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-red-400" />
                Predictive Maintenance
              </div>
              {industry.manufacturing.criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {industry.manufacturing.criticalAlerts} Alert{industry.manufacturing.criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <LiveColorGrid
              cells={industry.manufacturing.grid}
              rowLabels={industry.rowLabels.manufacturing}
              colLabels={industry.colLabels.manufacturing}
              isLive={industry.isLive}
              lastUpdate={industry.lastUpdate}
              size="sm"
            />
            
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Machine Health</div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={industry.manufacturing.machineHealth} 
                    className="h-1.5 flex-1" 
                  />
                  <span className={cn(
                    'font-medium',
                    industry.manufacturing.machineHealth > 80 ? 'text-green-400' :
                    industry.manufacturing.machineHealth > 50 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {industry.manufacturing.machineHealth.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Predicted Failures</div>
                <div className={cn(
                  'text-lg font-bold',
                  industry.manufacturing.predictedFailures > 0 ? 'text-red-400' : 'text-green-400'
                )}>
                  {industry.manufacturing.predictedFailures}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply Chain Grid */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Supply Chain Flow
              </div>
              {industry.supplyChain.bottlenecks > 2 && (
                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                  {industry.supplyChain.bottlenecks} Bottlenecks
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <LiveColorGrid
              cells={industry.supplyChain.grid}
              rowLabels={industry.rowLabels.supplyChain}
              colLabels={industry.colLabels.supplyChain}
              isLive={industry.isLive}
              lastUpdate={industry.lastUpdate}
              size="sm"
            />
            
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Flow Efficiency</div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={industry.supplyChain.flowEfficiency} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="font-medium">
                    {industry.supplyChain.flowEfficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Demand Accuracy</div>
                <div className="text-lg font-bold text-blue-400">
                  {industry.supplyChain.demandAccuracy.toFixed(0)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Domain Correlations */}
      {!compact && industry.crossDomainCorrelations.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Link2 className="w-4 h-4 text-purple-400" />
              Cross-Domain Pattern Discoveries
              <Badge variant="outline" className="text-xs ml-2">Black Swan Detection</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {industry.crossDomainCorrelations.slice(0, 4).map((corr) => (
                <motion.div
                  key={corr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Badge className={significanceColors[corr.significance]} variant="outline">
                      {corr.significance === 'breakthrough' && <Zap className="w-3 h-3 mr-1" />}
                      {corr.significance.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {corr.sourceType} → {corr.targetType}
                    </span>
                  </div>
                  <div className="text-xs max-w-[60%] truncate" title={corr.description}>
                    {corr.description}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-mono">
                      {(corr.correlation * 100).toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Active sensors: {industry.manufacturing.activeSensors}/64
        </span>
        <span>
          Last update: {industry.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default LiveIndustryPanel;
