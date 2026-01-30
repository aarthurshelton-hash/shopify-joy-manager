/**
 * MetricGrid64 - 64-Metric Grid Visualization
 * 
 * Visualizes the 8x8 metric grid (8 dimensions × 8 categories)
 * mirroring the chess 64-square territorial analysis.
 * 
 * Patent-Pending: En Pensent™ Code Flow Signatures
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CodeMetricGrid, CodeDimension, CodeCategory } from "@/lib/pensent-core/domains/code/types";

export interface MetricGrid64Props {
  grid: CodeMetricGrid;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showTooltips?: boolean;
  animated?: boolean;
  highlightDimension?: CodeDimension;
  highlightCategory?: CodeCategory;
  className?: string;
}

const DIMENSIONS: CodeDimension[] = [
  'complexity', 'cohesion', 'coverage', 'velocity',
  'quality', 'architecture', 'performance', 'evolution'
];

const CATEGORIES: CodeCategory[] = [
  'core-sdk', 'chess-domain', 'market-domain', 'code-domain',
  'ui-components', 'hooks-stores', 'pages-routes', 'utils-types'
];

const DIMENSION_LABELS: Record<CodeDimension, string> = {
  complexity: 'CX',
  cohesion: 'CO',
  coverage: 'CV',
  velocity: 'VE',
  quality: 'QU',
  architecture: 'AR',
  performance: 'PE',
  evolution: 'EV'
};

const CATEGORY_LABELS: Record<CodeCategory, string> = {
  'core-sdk': 'SDK',
  'chess-domain': 'CHE',
  'market-domain': 'MKT',
  'code-domain': 'COD',
  'ui-components': 'UI',
  'hooks-stores': 'HKS',
  'pages-routes': 'PGS',
  'utils-types': 'UTL'
};

const DIMENSION_COLORS: Record<CodeDimension, string> = {
  complexity: 'from-red-500/80 to-red-600/80',
  cohesion: 'from-blue-500/80 to-blue-600/80',
  coverage: 'from-green-500/80 to-green-600/80',
  velocity: 'from-yellow-500/80 to-yellow-600/80',
  quality: 'from-purple-500/80 to-purple-600/80',
  architecture: 'from-cyan-500/80 to-cyan-600/80',
  performance: 'from-orange-500/80 to-orange-600/80',
  evolution: 'from-pink-500/80 to-pink-600/80'
};

function getValueColor(value: number): string {
  if (value >= 80) return 'bg-green-500';
  if (value >= 60) return 'bg-emerald-500';
  if (value >= 40) return 'bg-yellow-500';
  if (value >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getValueIntensity(value: number): number {
  return 0.3 + (value / 100) * 0.7;
}

export const MetricGrid64 = ({
  grid,
  size = 'md',
  showLabels = true,
  showTooltips = true,
  animated = true,
  highlightDimension,
  highlightCategory,
  className
}: MetricGrid64Props) => {
  const cellSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  };

  // Create a lookup map for quick metric access
  const metricMap = new Map<string, number>();
  grid.metrics.forEach(m => {
    metricMap.set(`${m.dimension}-${m.category}`, m.value);
  });

  const renderCell = (row: number, col: number) => {
    const dimension = DIMENSIONS[row];
    const category = CATEGORIES[col];
    const key = `${dimension}-${category}`;
    const value = metricMap.get(key) ?? 0;
    
    const isHighlighted = 
      (highlightDimension && dimension === highlightDimension) ||
      (highlightCategory && category === highlightCategory);

    const cell = (
      <motion.div
        key={key}
        className={cn(
          cellSizes[size],
          "rounded-sm border border-muted/30 flex items-center justify-center relative overflow-hidden cursor-pointer",
          "transition-all duration-200 hover:scale-110 hover:z-10 hover:border-primary/50",
          isHighlighted && "ring-2 ring-primary"
        )}
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: (row * 8 + col) * 0.01,
          duration: 0.2
        }}
      >
        {/* Value indicator */}
        <div 
          className={cn("absolute inset-0", getValueColor(value))}
          style={{ opacity: getValueIntensity(value) }}
        />
        
        {/* Value text */}
        <span className={cn(
          textSizes[size],
          "font-mono font-bold relative z-10 text-white drop-shadow-md"
        )}>
          {Math.round(value)}
        </span>
        
        {/* Trend indicator */}
        {grid.metrics.find(m => m.dimension === dimension && m.category === category)?.trend === 'improving' && (
          <motion.div 
            className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
    );

    if (showTooltips) {
      return (
        <TooltipProvider key={key}>
          <Tooltip>
            <TooltipTrigger asChild>{cell}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <div className="space-y-1">
                <p className="font-semibold capitalize">
                  {dimension.replace('-', ' ')} × {category.replace('-', ' ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {Math.round(value)}%
                </p>
                <p className={cn(
                  "text-xs",
                  value >= 60 ? "text-green-400" : value >= 40 ? "text-yellow-400" : "text-red-400"
                )}>
                  {value >= 60 ? "✓ Healthy" : value >= 40 ? "⚠ Moderate" : "✗ Needs attention"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return cell;
  };

  return (
    <div className={cn("inline-block", className)}>
      {/* Overall score header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/60" />
          <span className="text-sm font-medium">64-Metric Grid</span>
        </div>
        <motion.div
          className="px-2 py-1 rounded bg-primary/20 text-primary font-bold text-sm"
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          {Math.round(grid.overallScore)}%
        </motion.div>
      </div>

      <div className="flex gap-1">
        {/* Row labels */}
        {showLabels && (
          <div className="flex flex-col gap-0.5 pr-1">
            {DIMENSIONS.map((dim, i) => (
              <div
                key={dim}
                className={cn(
                  cellSizes[size],
                  "flex items-center justify-center",
                  textSizes[size],
                  "font-mono text-muted-foreground"
                )}
              >
                <span 
                  className={cn(
                    "px-1 rounded",
                    highlightDimension === dim && "bg-primary/20 text-primary"
                  )}
                >
                  {DIMENSION_LABELS[dim]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div>
          {/* Column labels */}
          {showLabels && (
            <div className="flex gap-0.5 mb-1">
              {CATEGORIES.map(cat => (
                <div
                  key={cat}
                  className={cn(
                    cellSizes[size],
                    "flex items-center justify-center",
                    textSizes[size],
                    "font-mono text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "px-1 rounded",
                      highlightCategory === cat && "bg-primary/20 text-primary"
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Grid cells */}
          <div className="flex flex-col gap-0.5">
            {DIMENSIONS.map((_, row) => (
              <div key={row} className="flex gap-0.5">
                {CATEGORIES.map((_, col) => renderCell(row, col))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimension summary bar */}
      <div className="mt-3 flex gap-1">
        {DIMENSIONS.map((dim, i) => (
          <motion.div
            key={dim}
            className={cn(
              "flex-1 h-2 rounded-full bg-gradient-to-r",
              DIMENSION_COLORS[dim]
            )}
            style={{ opacity: (grid.byDimension[dim] || 50) / 100 }}
            initial={animated ? { scaleX: 0 } : {}}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
          />
        ))}
      </div>
      
      {showLabels && (
        <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-0.5">
          <span>Complexity</span>
          <span>Evolution</span>
        </div>
      )}
    </div>
  );
};

export default MetricGrid64;
