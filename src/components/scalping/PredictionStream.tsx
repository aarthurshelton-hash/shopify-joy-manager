/**
 * Prediction Stream Component
 * Live feed of predictions with outcomes
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TickPrediction } from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

interface PredictionStreamProps {
  pending: TickPrediction[];
  resolved: TickPrediction[];
  maxHeight?: string;
}

const DirectionIcon: React.FC<{ direction: string; className?: string }> = ({ direction, className }) => {
  if (direction === 'up') return <TrendingUp className={cn("w-3 h-3 text-green-500", className)} />;
  if (direction === 'down') return <TrendingDown className={cn("w-3 h-3 text-red-500", className)} />;
  return <Minus className={cn("w-3 h-3 text-yellow-500", className)} />;
};

export const PredictionStream: React.FC<PredictionStreamProps> = ({
  pending,
  resolved,
  maxHeight = "400px"
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  return (
    <ScrollArea className={`pr-3`} style={{ maxHeight }}>
      <div className="space-y-2">
        {/* Pending predictions */}
        <AnimatePresence mode="popLayout">
          {pending.map(pred => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-sm",
                "bg-primary/10 border border-primary/20"
              )}
            >
              <Clock className="w-4 h-4 text-primary animate-pulse" />
              <DirectionIcon direction={pred.predictedDirection} />
              <span className="font-medium uppercase">{pred.predictedDirection}</span>
              <span className="text-muted-foreground">{pred.confidence}%</span>
              <span className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {formatMs(Math.max(0, pred.expiresAt - Date.now()))}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Resolved predictions */}
        <AnimatePresence mode="popLayout">
          {resolved.map(pred => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-sm",
                pred.wasCorrect 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : "bg-red-500/10 border border-red-500/20"
              )}
            >
              {pred.wasCorrect ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              
              <DirectionIcon direction={pred.predictedDirection} />
              <span className="text-xs text-muted-foreground">→</span>
              <DirectionIcon direction={pred.actualDirection || 'flat'} />
              
              <span className={cn(
                "font-mono text-xs",
                pred.wasCorrect ? "text-green-400" : "text-red-400"
              )}>
                {pred.priceAtPrediction.toFixed(2)} → {pred.actualPrice?.toFixed(2)}
              </span>
              
              <span className="flex-1" />
              
              <span className="text-xs text-muted-foreground">
                {formatTime(pred.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {pending.length === 0 && resolved.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No predictions yet. Start the engine to begin.
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
