/**
 * Global Accuracy Panel
 * Live, persistent accuracy tracking across all sessions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, TrendingDown, Activity, Zap, 
  Brain, Crosshair, Clock, BarChart3, Flame, 
  Award, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTradingSessionStore, GlobalAccuracy } from '@/stores/tradingSessionStore';

interface AccuracyGaugeProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  showTrend?: boolean;
  trendValue?: number;
}

const AccuracyGauge: React.FC<AccuracyGaugeProps> = ({ 
  value, label, icon, showTrend = false, trendValue = 0 
}) => {
  const getColor = (v: number) => {
    if (v >= 70) return 'text-green-400';
    if (v >= 55) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getProgressColor = (v: number) => {
    if (v >= 70) return 'bg-green-500';
    if (v >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={cn("font-mono font-bold", getColor(value))}>
          {value.toFixed(1)}%
          {showTrend && trendValue !== 0 && (
            <span className={cn(
              "ml-1 text-[10px]",
              trendValue > 0 ? "text-green-400" : "text-red-400"
            )}>
              {trendValue > 0 ? '↑' : '↓'}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getProgressColor(value))}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

interface StreakIndicatorProps {
  currentStreak: number;
  bestStreak: number;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ currentStreak, bestStreak }) => {
  const isPositive = currentStreak > 0;
  const absStreak = Math.abs(currentStreak);
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      isPositive ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
    )}>
      {isPositive ? (
        <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-red-400" />
      )}
      <div>
        <div className={cn(
          "text-sm font-bold",
          isPositive ? "text-green-400" : "text-red-400"
        )}>
          {isPositive ? `${absStreak} Win Streak` : `${absStreak} Loss Streak`}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Best: {bestStreak} wins
        </div>
      </div>
    </div>
  );
};

interface GlobalAccuracyPanelProps {
  compact?: boolean;
  showStreak?: boolean;
}

export const GlobalAccuracyPanel: React.FC<GlobalAccuracyPanelProps> = ({ 
  compact = false,
  showStreak = true
}) => {
  const { globalAccuracy, evolutionState, liveMetrics, syncEvolutionState } = useTradingSessionStore();
  const [pulseCount, setPulseCount] = useState(0);
  
  // Sync evolution state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      syncEvolutionState();
      setPulseCount(c => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [syncEvolutionState]);
  
  const isLive = liveMetrics.isStreaming;
  
  if (compact) {
    return (
      <div className="flex items-center gap-4 px-3 py-2 bg-card/50 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: isLive ? [1, 1.2, 1] : 1,
              opacity: isLive ? 1 : 0.5
            }}
            transition={{ duration: 1, repeat: isLive ? Infinity : 0 }}
          >
            <Target className={cn(
              "w-4 h-4",
              isLive ? "text-green-400" : "text-muted-foreground"
            )} />
          </motion.div>
          <span className="text-xs text-muted-foreground">Global Accuracy</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className={cn(
              "text-sm font-mono font-bold",
              globalAccuracy.accuracy >= 55 ? "text-green-400" : 
              globalAccuracy.accuracy >= 45 ? "text-yellow-400" : "text-red-400"
            )}>
              {globalAccuracy.accuracy.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Overall</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-mono text-primary">
              {globalAccuracy.totalPredictions}
            </div>
            <div className="text-[10px] text-muted-foreground">Predictions</div>
          </div>
          
          {showStreak && globalAccuracy.currentStreak !== 0 && (
            <Badge 
              variant="outline"
              className={cn(
                "text-xs",
                globalAccuracy.currentStreak > 0 
                  ? "border-green-500/30 text-green-400" 
                  : "border-red-500/30 text-red-400"
              )}
            >
              {globalAccuracy.currentStreak > 0 ? '🔥' : '❄️'} 
              {Math.abs(globalAccuracy.currentStreak)}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Brain className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground">Gen</span>
          <span className="text-xs font-mono text-primary">
            {evolutionState.metrics.generationNumber}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              animate={{ 
                rotate: isLive ? [0, 360] : 0
              }}
              transition={{ duration: 3, repeat: isLive ? Infinity : 0, ease: "linear" }}
            >
              <Target className={cn(
                "w-5 h-5",
                isLive ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
            Global Accuracy
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isLive ? "border-green-500/30 text-green-400" : "border-muted"
              )}
            >
              {isLive ? '● LIVE' : '○ PAUSED'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Gen {evolutionState.metrics.generationNumber}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Accuracy Display */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className={cn(
              "text-4xl font-mono font-bold",
              globalAccuracy.accuracy >= 55 ? "text-green-400" : 
              globalAccuracy.accuracy >= 45 ? "text-yellow-400" : "text-red-400"
            )}>
              {globalAccuracy.accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Overall Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono text-primary">
              {globalAccuracy.correctPredictions}
            </div>
            <div className="text-xs text-muted-foreground">
              of {globalAccuracy.totalPredictions} correct
            </div>
          </div>
          
          {showStreak && (
            <StreakIndicator 
              currentStreak={globalAccuracy.currentStreak}
              bestStreak={globalAccuracy.bestStreak}
            />
          )}
        </div>
        
        {/* Multi-Level Accuracy */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Multi-Level Accuracy
          </div>
          
          <div className="grid gap-2">
            <AccuracyGauge
              value={globalAccuracy.directionAccuracy}
              label="Direction"
              icon={<Crosshair className="w-3 h-3" />}
              showTrend
              trendValue={evolutionState.metrics.learningVelocity}
            />
            <AccuracyGauge
              value={globalAccuracy.magnitudeAccuracy}
              label="Magnitude"
              icon={<TrendingUp className="w-3 h-3" />}
            />
            <AccuracyGauge
              value={globalAccuracy.timingAccuracy}
              label="Timing"
              icon={<Clock className="w-3 h-3" />}
            />
            <AccuracyGauge
              value={globalAccuracy.confidenceCalibration}
              label="Calibration"
              icon={<Activity className="w-3 h-3" />}
            />
          </div>
        </div>
        
        {/* Evolution Fitness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Brain className="w-3 h-3" />
              Evolution Fitness
            </span>
            <span className={cn(
              "font-mono",
              evolutionState.metrics.learningVelocity > 0 ? "text-green-400" : "text-red-400"
            )}>
              {evolutionState.metrics.learningVelocity > 0 ? '+' : ''}
              {(evolutionState.metrics.learningVelocity * 100).toFixed(2)}% velocity
            </span>
          </div>
          
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const threshold = (i + 1) * 0.1;
              const active = evolutionState.metrics.currentFitness >= threshold;
              return (
                <motion.div
                  key={i}
                  className={cn(
                    "h-6 flex-1 rounded-sm",
                    active ? "bg-primary" : "bg-muted"
                  )}
                  animate={{
                    opacity: active ? [0.7, 1, 0.7] : 0.3
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              );
            })}
          </div>
          
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Current: {(evolutionState.metrics.currentFitness * 100).toFixed(0)}%</span>
            <span>Peak: {(evolutionState.metrics.peakFitness * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        {/* Learned Patterns Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Learned Patterns</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-primary">
              {evolutionState.patternLibrary.length}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {evolutionState.patternLibrary.filter(p => p.successRate > 0.6).length} high accuracy
            </div>
          </div>
        </div>
        
        {/* Live Metrics */}
        <AnimatePresence>
          {isLive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-2 text-center"
            >
              <div className="p-2 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground">Ticks</div>
                <div className="text-sm font-mono">{liveMetrics.ticksProcessed}</div>
              </div>
              <div className="p-2 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground">Predictions</div>
                <div className="text-sm font-mono">{liveMetrics.predictionsMade}</div>
              </div>
              <div className="p-2 bg-muted/20 rounded">
                <div className="text-xs text-muted-foreground">Symbol</div>
                <div className="text-sm font-mono">{liveMetrics.currentSymbol}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
