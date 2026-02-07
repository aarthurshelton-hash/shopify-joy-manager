/**
 * Cross-Domain Correlation Dashboard Panel
 * 
 * Real-time display of universal patterns detected across
 * Chess and Market predictions.
 * 
 * Mounted in the CEO Dashboard to show when intelligence
 * converges across domains.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, TrendingUp, TrendingDown, Minus, 
  Zap, Target, Clock, Brain, Link2,
  ChevronRight, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrossDomainCorrelations } from '@/lib/pensent-core/crossDomainCorrelation';
import { cn } from '@/lib/utils';

interface CorrelationPanelProps {
  className?: string;
  maxDisplay?: number;
}

const PATTERN_ICONS: Record<string, React.ReactNode> = {
  'momentum': <TrendingUp className="w-4 h-4" />,
  'reversal': <TrendingDown className="w-4 h-4" />,
  'consolidation': <Minus className="w-4 h-4" />,
  'breakout': <Zap className="w-4 h-4" />
};

const PATTERN_COLORS: Record<string, string> = {
  'momentum': 'bg-green-500/20 text-green-500 border-green-500/30',
  'reversal': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  'consolidation': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  'breakout': 'bg-purple-500/20 text-purple-500 border-purple-500/30'
};

export const CrossDomainCorrelationPanel: React.FC<CorrelationPanelProps> = ({
  className,
  maxDisplay = 5
}) => {
  const { 
    correlations, 
    patterns, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring 
  } = useCrossDomainCorrelations();

  const [expanded, setExpanded] = useState<string | null>(null);

  // Auto-start monitoring on mount
  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring();
    }
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  const recentCorrelations = correlations.slice(0, maxDisplay);
  const hasCorrelations = recentCorrelations.length > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Cross-Domain Patterns
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Universal intelligence across Chess & Markets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isMonitoring ? "default" : "secondary"}
              className="text-xs"
            >
              {isMonitoring ? (
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Monitoring
                </span>
              ) : (
                'Paused'
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pattern Statistics */}
        <div className="grid grid-cols-5 gap-2">
          {patterns.map((pattern) => (
            <div 
              key={pattern.patternId}
              className="text-center p-2 rounded-lg bg-muted/50"
            >
              <div className="text-lg font-bold text-primary">
                {pattern.occurrences}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {pattern.patternName.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Correlations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Detections
          </h4>

          {!hasCorrelations ? (
            <div className="text-center py-6 text-muted-foreground">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for pattern alignment...</p>
              <p className="text-xs mt-1">
                Correlations appear when chess and market predictions align
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {recentCorrelations.map((corr) => (
                  <motion.div
                    key={corr.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:bg-muted/50",
                      expanded === corr.id ? "bg-muted/30" : ""
                    )}
                    onClick={() => setExpanded(
                      expanded === corr.id ? null : corr.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-xs",
                            PATTERN_COLORS[corr.patternType] || PATTERN_COLORS['momentum']
                          )}
                        >
                          {PATTERN_ICONS[corr.patternType]}
                          <span className="ml-1 capitalize">
                            {corr.patternType}
                          </span>
                        </Badge>
                        <span className="text-sm font-medium">
                          {(corr.correlationScore * 100).toFixed(0)}% Match
                        </span>
                      </div>
                      <ChevronRight 
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expanded === corr.id ? "rotate-90" : ""
                        )} 
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-chess-primary" />
                        <span className="text-muted-foreground">
                          {corr.chessSignal.archetype.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-market-primary" />
                        <span className="text-muted-foreground">
                          {corr.marketSignal.symbol} {corr.marketSignal.direction}
                        </span>
                      </div>
                    </div>

                    {expanded === corr.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-border/50 space-y-3"
                      >
                        {/* Chess Details */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">Chess Signal</span>
                            <span className="text-muted-foreground">
                              Intensity: {(corr.chessSignal.normalizedIntensity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={corr.chessSignal.confidence * 100} 
                            className="h-1"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Move {corr.chessSignal.moveNumber} • 
                            Outcome: {corr.chessSignal.outcome}
                          </p>
                        </div>

                        {/* Market Details */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">Market Signal</span>
                            <span className="text-muted-foreground">
                              Confidence: {(corr.marketSignal.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={corr.marketSignal.confidence * 100} 
                            className="h-1"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            {corr.marketSignal.category} • 
                            Vol: {(corr.marketSignal.volatility * 100).toFixed(2)}%
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {new Date(corr.detectedAt).toLocaleTimeString()}
                          </Badge>
                          {corr.validated ? (
                            <Badge variant="default" className="text-[10px] bg-green-500">
                              Validated
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Pending Validation
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Total Stats */}
        {hasCorrelations && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {correlations.length} correlation{correlations.length !== 1 ? 's' : ''} detected
              </span>
              <span>
                {patterns.reduce((sum, p) => sum + p.occurrences, 0)} total patterns
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrossDomainCorrelationPanel;
