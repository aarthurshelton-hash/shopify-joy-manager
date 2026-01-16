/**
 * PredictionGauge - Circular confidence meter
 * Shows prediction confidence (0-100%) with animated fill and color gradient
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PredictionGaugeProps {
  /** Confidence value 0-100 */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Optional label text */
  label?: string;
  /** Show percentage text */
  showValue?: boolean;
  /** Animation enabled */
  animated?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get color based on confidence value (red -> yellow -> green)
 */
const getGaugeColor = (value: number): string => {
  if (value < 25) return 'hsl(0, 80%, 50%)';      // Red
  if (value < 50) return 'hsl(30, 90%, 50%)';     // Orange
  if (value < 75) return 'hsl(50, 90%, 50%)';     // Yellow
  return 'hsl(142, 70%, 45%)';                     // Green
};

/**
 * Get background color (muted version of gauge color)
 */
const getGaugeBgColor = (value: number): string => {
  if (value < 25) return 'hsl(0, 30%, 20%)';
  if (value < 50) return 'hsl(30, 30%, 20%)';
  if (value < 75) return 'hsl(50, 30%, 20%)';
  return 'hsl(142, 30%, 20%)';
};

export const PredictionGauge = ({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  showValue = true,
  animated = true,
  className
}: PredictionGaugeProps) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const gaugeColor = getGaugeColor(clampedValue);
  const bgColor = getGaugeBgColor(clampedValue);

  return (
    <div 
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size, height: size + (label ? 24 : 0) }}
    >
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        
        {/* Background glow */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth + 4}
          opacity={0.3}
          filter="blur(4px)"
        />
        
        {/* Animated progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Gradient overlay for depth */}
        <defs>
          <linearGradient id={`gauge-gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#gauge-gradient-${value})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ height: size }}
      >
        {showValue && (
          <motion.span
            className="text-2xl font-bold"
            style={{ color: gaugeColor }}
            initial={animated ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(clampedValue)}%
          </motion.span>
        )}
        
        {/* Confidence tier indicator */}
        <motion.span
          className="text-xs text-muted-foreground mt-1"
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {clampedValue < 25 && 'Low'}
          {clampedValue >= 25 && clampedValue < 50 && 'Moderate'}
          {clampedValue >= 50 && clampedValue < 75 && 'Good'}
          {clampedValue >= 75 && 'High'}
        </motion.span>
      </div>
      
      {/* Label below */}
      {label && (
        <motion.span
          className="text-sm font-medium text-foreground mt-2"
          initial={animated ? { opacity: 0, y: 5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

export default PredictionGauge;
