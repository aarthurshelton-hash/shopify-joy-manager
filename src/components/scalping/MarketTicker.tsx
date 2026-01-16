/**
 * Live Market Ticker Component
 * Shows real-time prices for multiple asset classes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketSnapshot } from '@/lib/pensent-core/domains/finance/crossMarketEngine';
import { cn } from '@/lib/utils';

interface MarketTickerProps {
  snapshot: MarketSnapshot;
}

const MARKET_LABELS = {
  equity: { name: 'SPY', label: 'Equity' },
  bond: { name: 'TLT', label: 'Bonds' },
  future: { name: 'ES', label: 'Futures' },
  commodity: { name: 'GC', label: 'Gold' },
  forex: { name: 'DXY', label: 'Dollar' },
  crypto: { name: 'BTC', label: 'Bitcoin' }
};

export function MarketTicker({ snapshot }: MarketTickerProps) {
  const markets = Object.entries(snapshot).filter(([_, tick]) => tick !== null);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {markets.map(([key, tick]) => {
          if (!tick) return null;
          
          const info = MARKET_LABELS[key as keyof typeof MARKET_LABELS];
          const isPositive = tick.changePercent > 0;
          const isNegative = tick.changePercent < 0;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg border",
                "bg-card/50 backdrop-blur-sm",
                isPositive && "border-green-500/30",
                isNegative && "border-red-500/30",
                !isPositive && !isNegative && "border-border/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground font-medium">
                  {info.label}
                </div>
                <motion.div 
                  className="text-sm font-mono font-bold"
                  key={tick.price}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                >
                  {tick.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </motion.div>
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-mono",
                  isPositive && "text-green-400",
                  isNegative && "text-red-400",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}>
                  {isPositive && <TrendingUp className="w-3 h-3" />}
                  {isNegative && <TrendingDown className="w-3 h-3" />}
                  {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                  <span>{isPositive ? '+' : ''}{tick.changePercent.toFixed(3)}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
