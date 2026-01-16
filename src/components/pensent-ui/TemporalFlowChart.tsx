/**
 * TemporalFlowChart - Animated timeline visualization
 * Shows the temporal flow of a signature across phases
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TemporalFlowData {
  opening: number;
  midgame: number;
  endgame: number;
}

export interface TemporalFlowChartProps {
  data: TemporalFlowData;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
  colorScheme?: 'default' | 'heat' | 'cool' | 'gradient';
  className?: string;
}

const COLOR_SCHEMES = {
  default: ['hsl(var(--primary))', 'hsl(var(--primary))', 'hsl(var(--primary))'],
  heat: ['#22c55e', '#eab308', '#ef4444'],
  cool: ['#3b82f6', '#8b5cf6', '#ec4899'],
  gradient: ['#06b6d4', '#8b5cf6', '#f43f5e']
};

export const TemporalFlowChart = ({
  data,
  height = 120,
  showLabels = true,
  showValues = true,
  animated = true,
  colorScheme = 'gradient',
  className
}: TemporalFlowChartProps) => {
  const phases = [
    { key: 'opening', label: 'Opening', value: data.opening },
    { key: 'midgame', label: 'Midgame', value: data.midgame },
    { key: 'endgame', label: 'Endgame', value: data.endgame }
  ];
  
  const maxValue = Math.max(...phases.map(p => p.value), 0.01);
  const colors = COLOR_SCHEMES[colorScheme];
  
  // Calculate flow direction
  const trend = data.endgame > data.opening ? 'ascending' : 
                data.endgame < data.opening ? 'descending' : 'stable';

  return (
    <div className={cn("w-full", className)}>
      {/* Flow direction indicator */}
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
        <span>Temporal Flow</span>
        <span className={cn(
          "capitalize",
          trend === 'ascending' && 'text-green-400',
          trend === 'descending' && 'text-red-400',
          trend === 'stable' && 'text-yellow-400'
        )}>
          {trend}
        </span>
      </div>
      
      {/* Chart */}
      <div 
        className="relative w-full bg-muted/20 rounded-lg overflow-hidden"
        style={{ height }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
          {[0, 25, 50, 75, 100].map((line) => (
            <div 
              key={line} 
              className="w-full border-t border-muted/30"
              style={{ opacity: line === 0 || line === 100 ? 0 : 0.5 }}
            />
          ))}
        </div>
        
        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-2">
          {phases.map((phase, index) => {
            const barHeight = (phase.value / maxValue) * (height - 32);
            
            return (
              <div key={phase.key} className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-12 rounded-t-md relative overflow-hidden"
                  style={{ 
                    backgroundColor: colors[index],
                    boxShadow: `0 0 20px ${colors[index]}40`
                  }}
                  initial={animated ? { height: 0 } : { height: barHeight }}
                  animate={{ height: barHeight }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    ease: "easeOut"
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                    initial={{ y: '100%' }}
                    animate={{ y: '-100%' }}
                    transition={{
                      duration: 1.5,
                      delay: index * 0.15 + 0.5,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Value label */}
                  {showValues && (
                    <motion.div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold"
                      style={{ color: colors[index] }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.4 }}
                    >
                      {Math.round(phase.value * 100)}%
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
        
        {/* Connecting line */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ height, width: '100%' }}
        >
          <motion.path
            d={`M ${100 / 6}% ${height - 16 - (phases[0].value / maxValue) * (height - 32)} 
                Q 50% ${height - 16 - (phases[1].value / maxValue) * (height - 32) - 10}
                  ${100 - 100 / 6}% ${height - 16 - (phases[2].value / maxValue) * (height - 32)}`}
            fill="none"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="50%" stopColor={colors[1]} />
              <stop offset="100%" stopColor={colors[2]} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-around mt-2">
          {phases.map((phase, index) => (
            <span 
              key={phase.key}
              className="text-xs text-muted-foreground"
              style={{ color: colors[index] }}
            >
              {phase.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemporalFlowChart;
