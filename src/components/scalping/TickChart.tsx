/**
 * Real-time Tick Chart
 * Displays price movement with prediction markers
 */

import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ReferenceLine,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { cn } from '@/lib/utils';
import type { Tick } from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

interface TickChartProps {
  ticks: Tick[];
  currentPrediction?: {
    direction: 'up' | 'down' | 'flat';
    priceAtPrediction: number;
    targetPrice?: number;
  } | null;
  maxTicks?: number;
  height?: number;
  className?: string;
}

export const TickChart: React.FC<TickChartProps> = ({
  ticks,
  currentPrediction,
  maxTicks = 100,
  height = 200,
  className
}) => {
  const chartData = useMemo(() => {
    const recentTicks = ticks.slice(-maxTicks);
    return recentTicks.map((tick, i) => ({
      index: i,
      price: tick.price,
      time: new Date(tick.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    }));
  }, [ticks, maxTicks]);
  
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 1;
    return { 
      minPrice: min - padding, 
      maxPrice: max + padding 
    };
  }, [chartData]);
  
  const latestPrice = chartData[chartData.length - 1]?.price;
  const firstPrice = chartData[0]?.price;
  const isUp = latestPrice > firstPrice;
  
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={isUp ? "#22c55e" : "#ef4444"} 
                stopOpacity={0.3} 
              />
              <stop 
                offset="100%" 
                stopColor={isUp ? "#22c55e" : "#ef4444"} 
                stopOpacity={0} 
              />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="index" 
            hide 
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            hide
          />
          
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const value = payload[0].value;
              return (
                <div className="bg-popover border rounded px-2 py-1 text-xs">
                  <div className="font-mono">${typeof value === 'number' ? value.toFixed(2) : value}</div>
                  <div className="text-muted-foreground">{payload[0].payload.time}</div>
                </div>
              );
            }}
          />
          
          {/* Entry price line */}
          {currentPrediction && (
            <ReferenceLine 
              y={currentPrediction.priceAtPrediction} 
              stroke="#3b82f6" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
          
          {/* Target price line */}
          {currentPrediction?.targetPrice && (
            <ReferenceLine 
              y={currentPrediction.targetPrice} 
              stroke={currentPrediction.direction === 'up' ? '#22c55e' : '#ef4444'} 
              strokeDasharray="5 5"
              strokeWidth={1}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUp ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            dot={false}
            animationDuration={100}
            fill="url(#priceGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
