/**
 * QuadrantRadar - 4-axis radar chart for quadrant profiles
 * Visualizes the distribution across 4 dimensions
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuadrantData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export interface QuadrantRadarProps {
  data: QuadrantData;
  labels?: { q1: string; q2: string; q3: string; q4: string };
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
  fillColor?: string;
  strokeColor?: string;
  className?: string;
}

const DEFAULT_LABELS = {
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4'
};

export const QuadrantRadar = ({
  data,
  labels = DEFAULT_LABELS,
  size = 200,
  showLabels = true,
  showValues = true,
  animated = true,
  fillColor = 'hsl(var(--primary))',
  strokeColor = 'hsl(var(--primary))',
  className
}: QuadrantRadarProps) => {
  const center = size / 2;
  const radius = (size - 60) / 2;
  
  // Convert data to points
  const angles = [
    -Math.PI / 2,     // Top (Q1)
    0,                 // Right (Q2)
    Math.PI / 2,       // Bottom (Q3)
    Math.PI            // Left (Q4)
  ];
  
  const values = [data.q1, data.q2, data.q3, data.q4];
  const maxValue = Math.max(...values, 0.01);
  
  const points = values.map((value, index) => {
    const normalizedValue = value / maxValue;
    const x = center + Math.cos(angles[index]) * radius * normalizedValue;
    const y = center + Math.sin(angles[index]) * radius * normalizedValue;
    return { x, y, value, angle: angles[index] };
  });
  
  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';
  
  // Axis endpoints
  const axisPoints = angles.map(angle => ({
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  }));
  
  // Label positions (slightly outside the chart)
  const labelOffset = 25;
  const labelPoints = angles.map(angle => ({
    x: center + Math.cos(angle) * (radius + labelOffset),
    y: center + Math.sin(angle) * (radius + labelOffset)
  }));
  
  const quadrantLabels = [labels.q1, labels.q2, labels.q3, labels.q4];

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <circle
            key={ratio}
            cx={center}
            cy={center}
            r={radius * ratio}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}
        
        {/* Axis lines */}
        {axisPoints.map((point, index) => (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="hsl(var(--muted))"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}
        
        {/* Filled area */}
        <motion.path
          d={pathData}
          fill={fillColor}
          fillOpacity={0.2}
          stroke={strokeColor}
          strokeWidth={2}
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={6}
            fill={strokeColor}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            initial={animated ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          />
        ))}
        
        {/* Labels */}
        {showLabels && labelPoints.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-xs font-medium"
          >
            {quadrantLabels[index]}
          </text>
        ))}
        
        {/* Values */}
        {showValues && points.map((point, index) => {
          const valueOffset = 20;
          const valueX = center + Math.cos(angles[index]) * (radius * (values[index] / maxValue) + valueOffset);
          const valueY = center + Math.sin(angles[index]) * (radius * (values[index] / maxValue) + valueOffset);
          
          return (
            <motion.text
              key={`value-${index}`}
              x={valueX}
              y={valueY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-primary text-xs font-bold"
              initial={animated ? { opacity: 0 } : {}}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {Math.round(values[index] * 100)}%
            </motion.text>
          );
        })}
      </svg>
      
      {/* Center indicator */}
      <motion.div
        className="absolute rounded-full bg-primary/20 border border-primary"
        style={{
          width: 12,
          height: 12,
          left: center - 6,
          top: center - 6
        }}
        initial={animated ? { scale: 0 } : {}}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
    </div>
  );
};

export default QuadrantRadar;
