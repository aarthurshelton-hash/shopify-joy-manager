/**
 * LiveColorGrid - Real-time 8x8 Color Grid Visualization
 * 
 * Renders live temporal signature data as an animated color grid.
 * Updates in real-time as new data flows in from any domain adapter.
 */

import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GridCell {
  row: number;
  col: number;
  value: number; // 0-1 normalized intensity
  color: string; // HSL color string
  label?: string;
  lastUpdated?: Date;
}

export interface LiveColorGridProps {
  /** 8x8 grid data (64 cells) */
  cells: GridCell[];
  /** Title above the grid */
  title?: string;
  /** Row labels (8 items) */
  rowLabels?: string[];
  /** Column labels (8 items) */
  colLabels?: string[];
  /** Show live pulse animation */
  isLive?: boolean;
  /** Last update timestamp */
  lastUpdate?: Date;
  /** Grid size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show cell values on hover */
  showValues?: boolean;
  /** Custom class name */
  className?: string;
  /** On cell click handler */
  onCellClick?: (cell: GridCell) => void;
}

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const LABEL_SIZE_MAP = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

export function LiveColorGrid({
  cells,
  title,
  rowLabels,
  colLabels,
  isLive = false,
  lastUpdate,
  size = 'md',
  showValues = true,
  className,
  onCellClick,
}: LiveColorGridProps) {
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  // Pulse animation when live
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setPulseCount(p => p + 1);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Organize cells into 8x8 grid
  const grid = useMemo(() => {
    const result: (GridCell | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    cells.forEach(cell => {
      if (cell.row >= 0 && cell.row < 8 && cell.col >= 0 && cell.col < 8) {
        result[cell.row][cell.col] = cell;
      }
    });
    return result;
  }, [cells]);

  // Calculate grid-wide statistics
  const stats = useMemo(() => {
    const values = cells.map(c => c.value).filter(v => v > 0);
    if (values.length === 0) return { avg: 0, max: 0, min: 0, hotspots: 0 };
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      hotspots: values.filter(v => v > 0.7).length,
    };
  }, [cells]);

  const cellSize = SIZE_MAP[size];
  const labelSize = LABEL_SIZE_MAP[size];

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      {(title || isLive) && (
        <div className="flex items-center justify-between mb-2">
          {title && <h4 className="text-sm font-medium">{title}</h4>}
          {isLive && (
            <div className="flex items-center gap-1.5">
              <motion.div
                key={pulseCount}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1 }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-[10px] text-green-500 font-medium">LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Column labels */}
      {colLabels && (
        <div className="flex ml-8 mb-1">
          {colLabels.map((label, i) => (
            <div
              key={i}
              className={cn(
                cellSize,
                labelSize,
                'flex items-center justify-center text-muted-foreground truncate'
              )}
              title={label}
            >
              {label.substring(0, 2)}
            </div>
          ))}
        </div>
      )}

      {/* Grid with row labels */}
      <div className="flex">
        {/* Row labels */}
        {rowLabels && (
          <div className="flex flex-col mr-1">
            {rowLabels.map((label, i) => (
              <div
                key={i}
                className={cn(
                  'w-7',
                  cellSize,
                  labelSize,
                  'flex items-center justify-end pr-1 text-muted-foreground truncate'
                )}
                title={label}
              >
                {label.substring(0, 3)}
              </div>
            ))}
          </div>
        )}

        {/* 8x8 Grid */}
        <div className="grid grid-cols-8 gap-0.5 p-1 rounded-lg bg-muted/20 border border-border/50">
          <AnimatePresence mode="popLayout">
            {grid.flat().map((cell, index) => {
              const row = Math.floor(index / 8);
              const col = index % 8;
              const isEmpty = !cell || cell.value === 0;

              return (
                <motion.div
                  key={`${row}-${col}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    backgroundColor: cell?.color || 'hsl(var(--muted))',
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: 0.3,
                    backgroundColor: { duration: 0.5 }
                  }}
                  className={cn(
                    cellSize,
                    'rounded-sm cursor-pointer transition-all',
                    'hover:ring-2 hover:ring-primary/50 hover:z-10',
                    isEmpty && 'bg-muted/30'
                  )}
                  style={{
                    backgroundColor: cell?.color || undefined,
                    opacity: isEmpty ? 0.3 : 0.5 + (cell?.value || 0) * 0.5,
                  }}
                  onMouseEnter={() => cell && setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => cell && onCellClick?.(cell)}
                  title={cell?.label}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Hover tooltip */}
      {showValues && hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-20 px-2 py-1 rounded bg-popover border shadow-lg text-xs"
          style={{ 
            left: `${(hoveredCell.col + 1) * 28}px`,
            top: `${(hoveredCell.row + 2) * 28}px`
          }}
        >
          <div className="font-medium">{hoveredCell.label || `[${hoveredCell.row}, ${hoveredCell.col}]`}</div>
          <div className="text-muted-foreground">
            Intensity: {(hoveredCell.value * 100).toFixed(1)}%
          </div>
          {hoveredCell.lastUpdated && (
            <div className="text-muted-foreground text-[10px]">
              {hoveredCell.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </motion.div>
      )}

      {/* Statistics footer */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{cells.filter(c => c.value > 0).length}/64 active</span>
        <span>{stats.hotspots} hotspots</span>
        {lastUpdate && (
          <span>{lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Utility: Generate grid cells from industry adapter data
 */
export function generateGridFromIndustryData(
  data: number[][],
  rowLabels: string[],
  colLabels: string[],
  colorScheme: 'heat' | 'cool' | 'spectrum' = 'heat'
): GridCell[] {
  const cells: GridCell[] = [];
  const now = new Date();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const value = data[row]?.[col] ?? 0;
      const normalizedValue = Math.max(0, Math.min(1, value));
      
      let color: string;
      if (colorScheme === 'heat') {
        // Red (hot) to blue (cold)
        const hue = (1 - normalizedValue) * 240;
        color = `hsl(${hue}, 80%, ${40 + normalizedValue * 20}%)`;
      } else if (colorScheme === 'cool') {
        // Blue to green
        const hue = 180 + normalizedValue * 60;
        color = `hsl(${hue}, 70%, ${40 + normalizedValue * 20}%)`;
      } else {
        // Full spectrum
        const hue = normalizedValue * 360;
        color = `hsl(${hue}, 75%, 50%)`;
      }

      cells.push({
        row,
        col,
        value: normalizedValue,
        color,
        label: `${rowLabels[row] || `T-${7 - row}`} × ${colLabels[col] || `M${col + 1}`}`,
        lastUpdated: now,
      });
    }
  }

  return cells;
}

/**
 * Utility: Generate empty grid
 */
export function createEmptyGrid(): GridCell[] {
  return Array(64).fill(null).map((_, i) => ({
    row: Math.floor(i / 8),
    col: i % 8,
    value: 0,
    color: 'hsl(var(--muted))',
  }));
}

export default LiveColorGrid;
