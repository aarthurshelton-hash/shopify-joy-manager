/**
 * Evolution Panel Component
 * Shows self-learning system status and evolution metrics
 */

import { motion } from 'framer-motion';
import { 
  Dna, TrendingUp, TrendingDown, Sparkles, 
  Brain, Zap, Activity, Target
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { EvolutionState } from '@/lib/pensent-core/domains/finance/selfEvolvingSystem';

interface EvolutionPanelProps {
  state: EvolutionState;
}

function FitnessGauge({ value, label }: { value: number; label: string }) {
  const percentage = value * 100;
  const color = value >= 0.65 ? 'text-green-400' : 
                value >= 0.5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-bold", color)}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            value >= 0.65 ? "bg-green-500" : 
            value >= 0.5 ? "bg-yellow-500" : "bg-red-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </div>
    </div>
  );
}

function GeneCard({ gene }: { gene: { name: string; value: number; impact: number } }) {
  const isPositive = gene.impact > 0;
  const isNegative = gene.impact < -0.02;
  
  // Format gene name for display
  const displayName = gene.name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  return (
    <div className={cn(
      "p-2 rounded-lg border text-xs",
      isPositive && "border-green-500/30 bg-green-500/5",
      isNegative && "border-red-500/30 bg-red-500/5",
      !isPositive && !isNegative && "border-border/50 bg-card/50"
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate">{displayName}</span>
        <span className={cn(
          "font-mono",
          isPositive && "text-green-400",
          isNegative && "text-red-400"
        )}>
          {gene.value.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isPositive && <TrendingUp className="w-3 h-3 text-green-400" />}
        {isNegative && <TrendingDown className="w-3 h-3 text-red-400" />}
        <span className="text-muted-foreground">
          Impact: {(gene.impact * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function PatternBadge({ pattern }: { pattern: { name: string; successRate: number; occurrences: number } }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/30">
      <span className="text-xs truncate flex-1">{pattern.name}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          {pattern.occurrences}x
        </span>
        <span className={cn(
          "text-xs font-mono font-bold",
          pattern.successRate >= 0.6 ? "text-green-400" : "text-yellow-400"
        )}>
          {(pattern.successRate * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function EvolutionPanel({ state }: EvolutionPanelProps) {
  const { metrics, genes, patternLibrary } = state;
  
  const velocityIcon = metrics.learningVelocity > 0.02 ? TrendingUp : 
                       metrics.learningVelocity < -0.02 ? TrendingDown : Activity;
  const VelocityIcon = velocityIcon;
  
  const velocityColor = metrics.learningVelocity > 0.02 ? 'text-green-400' : 
                        metrics.learningVelocity < -0.02 ? 'text-red-400' : 'text-muted-foreground';

  // Get top performing genes with mapped type
  const topGenes = [...genes]
    .sort((a, b) => Math.abs(b.performanceImpact) - Math.abs(a.performanceImpact))
    .slice(0, 4)
    .map(g => ({ name: g.name, value: g.value, impact: g.performanceImpact }));

  // Get best patterns
  const bestPatterns = [...patternLibrary]
    .filter(p => p.occurrences >= 3)
    .sort((a, b) => b.successRate * b.confidence - a.successRate * a.confidence)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto">
      {/* Header with Generation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Self-Evolution</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="font-mono">Gen {metrics.generationNumber}</span>
        </div>
      </div>

      {/* Fitness Metrics */}
      <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
        <FitnessGauge value={metrics.currentFitness} label="System Fitness" />
        
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-center p-2 rounded bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Peak Fitness</div>
            <div className="text-sm font-mono font-bold text-primary">
              {(metrics.peakFitness * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Predictions</div>
            <div className="text-sm font-mono font-bold">
              {metrics.totalPredictions}
            </div>
          </div>
        </div>

        {/* Learning Velocity */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <VelocityIcon className={cn("w-4 h-4", velocityColor)} />
            <span className="text-xs text-muted-foreground">Learning Velocity</span>
          </div>
          <span className={cn("text-sm font-mono font-bold", velocityColor)}>
            {metrics.learningVelocity > 0 ? '+' : ''}{(metrics.learningVelocity * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Active Genes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Active Genes</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {topGenes.map(gene => (
            <GeneCard key={gene.name} gene={gene} />
          ))}
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Learned Patterns</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {patternLibrary.length} total
          </span>
        </div>
        
        <div className="space-y-1 overflow-y-auto">
          {bestPatterns.length > 0 ? (
            bestPatterns.map((pattern, i) => (
              <PatternBadge key={pattern.id || i} pattern={pattern} />
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              Learning patterns from market behavior...
            </div>
          )}
        </div>
      </div>

      {/* Adaptation Rate */}
      <div className="p-2 rounded-lg border border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Adaptation Rate</span>
          </div>
          <span className="text-sm font-mono font-bold text-primary">
            {(metrics.adaptationRate * 100).toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={metrics.adaptationRate * 100} 
          className="h-1 mt-2"
        />
      </div>
    </div>
  );
}
