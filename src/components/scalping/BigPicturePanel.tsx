/**
 * Big Picture Panel Component
 * Shows cross-market correlations and unified market signals
 */

import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield, 
  AlertTriangle,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { BigPictureState, CrossMarketSignal } from '@/lib/pensent-core/domains/finance/crossMarketEngine';
import { cn } from '@/lib/utils';

interface BigPicturePanelProps {
  state: BigPictureState;
}

function SentimentGauge({ value, label }: { value: number; label: string }) {
  // -1 to 1 scale
  const normalized = (value + 1) / 2 * 100;
  const isPositive = value > 0.1;
  const isNegative = value < -0.1;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-mono",
          isPositive && "text-green-400",
          isNegative && "text-red-400"
        )}>
          {value > 0 ? '+' : ''}{(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-red-500/20" />
          <div className="w-1/2 bg-green-500/20" />
        </div>
        <motion.div
          className={cn(
            "absolute top-0 bottom-0 w-1 rounded-full",
            isPositive ? "bg-green-400" : isNegative ? "bg-red-400" : "bg-muted-foreground"
          )}
          style={{ left: `${normalized}%` }}
          animate={{ left: `${normalized}%` }}
          transition={{ type: 'spring', stiffness: 200 }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: CrossMarketSignal }) {
  const icons = {
    divergence: AlertTriangle,
    convergence: ArrowRightLeft,
    leading: TrendingUp,
    lagging: TrendingDown,
    breakout: Zap,
    reversal: Activity
  };

  const Icon = icons[signal.type];
  const age = Math.floor((Date.now() - signal.timestamp) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-2 rounded-lg border bg-card/50",
        signal.strength > 0.7 ? "border-yellow-500/50" : "border-border/50"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          "p-1 rounded",
          signal.strength > 0.7 ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"
        )}>
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium capitalize">{signal.type}</span>
            <span className="text-[10px] text-muted-foreground">
              {signal.sourceMarkets.join(' → ')}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {signal.description}
          </p>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {age}s
        </div>
      </div>
    </motion.div>
  );
}

export function BigPicturePanel({ state }: BigPicturePanelProps) {
  const boostColor = state.predictionBoost >= 1.2 ? 'text-green-400' : 
                     state.predictionBoost <= 0.8 ? 'text-red-400' : 'text-primary';

  return (
    <div className="h-full flex flex-col gap-3 p-3">
      {/* Prediction Boost */}
      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={cn("w-4 h-4", boostColor)} />
            <span className="text-sm font-medium">Prediction Boost</span>
          </div>
          <motion.span 
            className={cn("text-lg font-bold font-mono", boostColor)}
            key={state.predictionBoost.toFixed(2)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {state.predictionBoost.toFixed(2)}x
          </motion.span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Cross-market alignment enhances prediction confidence
        </p>
      </div>

      {/* Market Gauges */}
      <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Market Pulse</span>
        </div>

        <SentimentGauge value={state.marketSentiment} label="Sentiment" />
        <SentimentGauge value={state.riskAppetite} label="Risk Appetite" />

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Volatility Index</span>
            <span className={cn(
              "font-mono",
              state.volatilityIndex > 50 ? "text-yellow-400" : "text-muted-foreground"
            )}>
              {state.volatilityIndex.toFixed(0)}
            </span>
          </div>
          <Progress 
            value={state.volatilityIndex} 
            className="h-1.5"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Trend Alignment</span>
            <span className="font-mono text-muted-foreground">
              {(state.trendAlignment * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={state.trendAlignment * 100} 
            className="h-1.5"
          />
        </div>
      </div>

      {/* Active Signals */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">Cross-Market Signals</span>
          {state.activeSignals.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
              {state.activeSignals.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {state.activeSignals.length > 0 ? (
            state.activeSignals.map((signal, i) => (
              <SignalBadge key={`${signal.type}-${signal.timestamp}-${i}`} signal={signal} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Markets aligned - no divergence signals
            </div>
          )}
        </div>
      </div>

      {/* Correlations Summary */}
      {state.correlations.length > 0 && (
        <div className="p-2 rounded-lg border border-border/30 bg-card/30">
          <div className="text-[10px] text-muted-foreground mb-1">Active Correlations</div>
          <div className="flex flex-wrap gap-1">
            {state.correlations.slice(0, 4).map((corr, i) => (
              <div 
                key={i}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  corr.isInverted ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                )}
              >
                {corr.market1}/{corr.market2}: {(corr.correlation * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
