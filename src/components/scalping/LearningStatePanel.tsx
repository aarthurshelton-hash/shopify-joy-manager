/**
 * Learning State Panel
 * Shows the adaptive learning progress and confidence evolution
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Zap, Target, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LearningState } from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

interface LearningStatePanelProps {
  state: LearningState;
  stats: {
    upPredictions: { total: number; correct: number; accuracy: number };
    downPredictions: { total: number; correct: number; accuracy: number };
    flatPredictions: { total: number; correct: number; accuracy: number };
  };
}

export const LearningStatePanel: React.FC<LearningStatePanelProps> = ({ state, stats }) => {
  const volatilityColors = {
    low: 'text-blue-400 bg-blue-500/20',
    medium: 'text-green-400 bg-green-500/20',
    high: 'text-yellow-400 bg-yellow-500/20',
    extreme: 'text-red-400 bg-red-500/20'
  };
  
  const confidenceStatus = state.confidenceMultiplier >= 1.2 
    ? { label: 'Confident', color: 'text-green-400' }
    : state.confidenceMultiplier >= 0.9
      ? { label: 'Learning', color: 'text-yellow-400' }
      : { label: 'Cautious', color: 'text-red-400' };
  
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          Adaptive Learning State
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accuracy metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">
              {state.accuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Overall</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className={cn(
              "text-2xl font-bold",
              state.recentAccuracy >= 60 ? "text-green-400" : 
              state.recentAccuracy >= 45 ? "text-yellow-400" : "text-red-400"
            )}>
              {state.recentAccuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Recent (20)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">
              {state.totalPredictions}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
        
        {/* Streak */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "w-5 h-5",
              state.streak >= 5 ? "text-yellow-400" : "text-muted-foreground"
            )} />
            <span>Current Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{state.streak}</span>
            <span className="text-xs text-muted-foreground">
              (Best: {state.bestStreak})
            </span>
          </div>
        </div>
        
        {/* Direction accuracy breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">By Direction</h4>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="w-12 text-xs">UP</span>
            <Progress 
              value={stats.upPredictions.accuracy} 
              className="flex-1 h-2"
            />
            <span className="text-xs w-16 text-right">
              {stats.upPredictions.correct}/{stats.upPredictions.total}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="w-12 text-xs">DOWN</span>
            <Progress 
              value={stats.downPredictions.accuracy} 
              className="flex-1 h-2"
            />
            <span className="text-xs w-16 text-right">
              {stats.downPredictions.correct}/{stats.downPredictions.total}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-500" />
            <span className="w-12 text-xs">FLAT</span>
            <Progress 
              value={stats.flatPredictions.accuracy} 
              className="flex-1 h-2"
            />
            <span className="text-xs w-16 text-right">
              {stats.flatPredictions.correct}/{stats.flatPredictions.total}
            </span>
          </div>
        </div>
        
        {/* Multi-level accuracy */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Multi-Level Accuracy</h4>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="w-20 text-xs">Direction</span>
            <Progress value={state.multiLevel.direction.accuracy} className="flex-1 h-2" />
            <span className="text-xs w-12 text-right">{state.multiLevel.direction.accuracy.toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="w-20 text-xs">Magnitude</span>
            <Progress value={state.multiLevel.magnitude.avgScore} className="flex-1 h-2" />
            <span className="text-xs w-12 text-right">{state.multiLevel.magnitude.avgScore.toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="w-20 text-xs">Timing</span>
            <Progress value={state.multiLevel.timing.avgScore} className="flex-1 h-2" />
            <span className="text-xs w-12 text-right">{state.multiLevel.timing.avgScore.toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="w-20 text-xs">Composite</span>
            <Progress value={state.multiLevel.composite.avgScore} className="flex-1 h-2" />
            <span className={cn(
              "text-xs w-12 text-right font-bold",
              state.multiLevel.composite.trend > 0 ? "text-green-400" : 
              state.multiLevel.composite.trend < 0 ? "text-red-400" : ""
            )}>
              {state.multiLevel.composite.avgScore.toFixed(0)}%
            </span>
          </div>
          
          {state.multiLevel.confidenceCalibration.calibrationError > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Calibration: {state.multiLevel.confidenceCalibration.calibrationError.toFixed(1)}% error
            </div>
          )}
        </div>
        
        {/* Adaptive parameters */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Volatility</div>
            <Badge className={volatilityColors[state.volatilityState]}>
              {state.volatilityState.toUpperCase()}
            </Badge>
          </div>
          
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Confidence</div>
            <span className={cn("font-medium", confidenceStatus.color)}>
              {state.confidenceMultiplier.toFixed(2)}x ({confidenceStatus.label})
            </span>
          </div>
          
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Horizon</div>
            <span className="font-mono">
              {(state.adaptiveHorizonMs / 1000).toFixed(1)}s
            </span>
          </div>
          
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Bias</div>
            <span className={cn(
              "font-mono",
              state.momentumBias > 0.2 ? "text-green-400" :
              state.momentumBias < -0.2 ? "text-red-400" : "text-muted-foreground"
            )}>
              {state.momentumBias >= 0 ? '+' : ''}{state.momentumBias.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
