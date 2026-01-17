/**
 * Prediction HUD Component
 * Shows current prediction with confidence and countdown
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Zap, Target, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TickPrediction } from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

interface PredictionHUDProps {
  prediction: TickPrediction | null;
  latestPrice: number | null;
  className?: string;
  symbol?: string;
  simulatedBalance?: number;
  targetBalance?: number;
}

export const PredictionHUD: React.FC<PredictionHUDProps> = ({
  prediction,
  latestPrice,
  className,
  symbol = 'SPY',
  simulatedBalance = 1000,
  targetBalance = 10000
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [priceDelta, setPriceDelta] = useState(0);
  
  const progressToTarget = Math.min((simulatedBalance / targetBalance) * 100, 100);
  const growthPercent = ((simulatedBalance - 1000) / 1000) * 100;
  
  useEffect(() => {
    if (!prediction) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, prediction.expiresAt - Date.now());
      setTimeRemaining(remaining);
      
      if (latestPrice && prediction.priceAtPrediction) {
        setPriceDelta(latestPrice - prediction.priceAtPrediction);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [prediction, latestPrice]);
  
  if (!prediction) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-muted-foreground/30 gap-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-lg font-bold">{symbol}</span>
        </div>
        <span className="text-muted-foreground">Analyzing market patterns...</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>${simulatedBalance.toFixed(2)} → ${targetBalance.toLocaleString()} Goal</span>
        </div>
      </div>
    );
  }
  
  const isExpired = timeRemaining <= 0;
  const progress = prediction.horizonMs > 0 
    ? ((prediction.horizonMs - timeRemaining) / prediction.horizonMs) * 100 
    : 100;
  
  const directionConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: 'LONG'
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      label: 'SHORT'
    },
    flat: {
      icon: Minus,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      label: 'HOLD'
    }
  };
  
  const config = directionConfig[prediction.predictedDirection];
  const Icon = config.icon;
  
  // Is the current price movement matching our prediction?
  const isTracking = 
    (prediction.predictedDirection === 'up' && priceDelta > 0) ||
    (prediction.predictedDirection === 'down' && priceDelta < 0) ||
    (prediction.predictedDirection === 'flat' && Math.abs(priceDelta) < 0.05);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-4",
        config.bgColor,
        config.borderColor,
        isExpired && "opacity-60",
        className
      )}
    >
      {/* $1K → $10K Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/30">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-green-400"
          style={{ width: `${progressToTarget}%` }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute right-2 -top-5 text-[10px] font-mono text-muted-foreground">
          ${simulatedBalance.toFixed(0)} / ${targetBalance.toLocaleString()} ({growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%)
        </div>
      </div>
      
      {/* Prediction countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
        <motion.div
          className={cn("h-full", config.color.replace('text-', 'bg-'))}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      
      {/* Symbol badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-background/50 border border-border/50">
        <Target className="w-3 h-3 text-primary" />
        <span className="text-xs font-bold">{symbol}</span>
      </div>
      
      <div className="flex items-center gap-4 mt-4">
        {/* Direction indicator */}
        <motion.div
          animate={{ 
            scale: isTracking ? [1, 1.1, 1] : 1,
          }}
          transition={{ repeat: isTracking ? Infinity : 0, duration: 1 }}
          className={cn(
            "p-3 rounded-lg",
            config.bgColor,
            "border",
            config.borderColor
          )}
        >
          <Icon className={cn("w-8 h-8", config.color)} />
        </motion.div>
        
        {/* Prediction details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-2xl font-bold", config.color)}>
              {config.label}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-sm font-medium",
              prediction.confidence >= 70 ? "bg-green-500/20 text-green-400" :
              prediction.confidence >= 55 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            )}>
              {prediction.confidence}%
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Expired' : `${(timeRemaining / 1000).toFixed(1)}s`}
            </span>
            <span>
              Entry: ${prediction.priceAtPrediction.toFixed(2)}
            </span>
            {prediction.targetPrice && (
              <span>
                Target: ${prediction.targetPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        {/* Current delta */}
        <div className="text-right">
          <div className={cn(
            "text-xl font-mono font-bold",
            priceDelta > 0 ? "text-green-500" : priceDelta < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {priceDelta >= 0 ? '+' : ''}{priceDelta.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground">
            {isTracking ? (
              <span className="text-green-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Tracking
              </span>
            ) : (
              <span className="text-yellow-400">Diverging</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
