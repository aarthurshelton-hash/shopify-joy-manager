/**
 * Live Market Ticker Component
 * Shows real-time prices for multiple asset classes
 * Click any symbol to focus predictions on that asset
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import type { MarketSnapshot } from '@/lib/pensent-core/domains/finance/crossMarketEngine';
import { cn } from '@/lib/utils';

interface MarketTickerProps {
  snapshot: MarketSnapshot;
  onSymbolClick?: (symbol: string) => void;
  focusedSymbol?: string;
}

const MARKET_LABELS: Record<string, { name: string; label: string; tradingSymbol: string }> = {
  equity: { name: 'SPY', label: 'Equity', tradingSymbol: 'SPY' },
  bond: { name: 'TLT', label: 'Bonds', tradingSymbol: 'TLT' },
  future: { name: 'ES', label: 'Futures', tradingSymbol: 'ES' },
  commodity: { name: 'GC', label: 'Gold', tradingSymbol: 'GLD' },
  forex: { name: 'DXY', label: 'Dollar', tradingSymbol: 'UUP' },
  crypto: { name: 'BTC', label: 'Bitcoin', tradingSymbol: 'BTC' }
};

// Wrapper component for AnimatePresence children
const TickerItem = forwardRef<HTMLDivElement, {
  tickKey: string;
  tick: { price: number; changePercent: number };
  info: { name: string; label: string; tradingSymbol: string };
  onClick?: () => void;
  isFocused?: boolean;
}>(({ tickKey, tick, info, onClick, isFocused }, ref) => {
  const isPositive = tick.changePercent > 0;
  const isNegative = tick.changePercent < 0;

  return (
    <motion.div
      ref={ref}
      key={tickKey}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isFocused ? 1.05 : 1,
        boxShadow: isFocused ? '0 0 20px rgba(var(--primary), 0.4)' : 'none'
      }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-3 py-2 rounded-lg border cursor-pointer transition-all",
        "bg-card/50 backdrop-blur-sm hover:bg-card/80",
        isPositive && "border-green-500/30 hover:border-green-500/60",
        isNegative && "border-red-500/30 hover:border-red-500/60",
        !isPositive && !isNegative && "border-border/50 hover:border-border",
        isFocused && "ring-2 ring-primary/50 border-primary/50 bg-primary/10"
      )}
    >
      <div className="flex items-center gap-2">
        {isFocused && (
          <Target className="w-3 h-3 text-primary animate-pulse" />
        )}
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
});

TickerItem.displayName = 'TickerItem';

export function MarketTicker({ snapshot, onSymbolClick, focusedSymbol }: MarketTickerProps) {
  const markets = Object.entries(snapshot).filter(([_, tick]) => tick !== null);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {markets.map(([key, tick]) => {
        if (!tick) return null;
        
        const info = MARKET_LABELS[key as keyof typeof MARKET_LABELS];
        if (!info) return null;

        const isFocused = focusedSymbol === info.tradingSymbol;

        return (
          <TickerItem
            key={key}
            tickKey={key}
            tick={tick}
            info={info}
            onClick={() => onSymbolClick?.(info.tradingSymbol)}
            isFocused={isFocused}
          />
        );
      })}
    </div>
  );
}
