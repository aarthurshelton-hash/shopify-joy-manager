/**
 * CodeHealthGauge - Codebase Health Visualization
 * 
 * Displays overall codebase health with letter grades (A-F)
 * and detailed dimension breakdowns.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  Shield, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export interface CodeHealthData {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: {
    complexity: number;
    cohesion: number;
    coverage: number;
    velocity: number;
    quality: number;
    architecture: number;
    performance: number;
    evolution: number;
  };
  trend: 'improving' | 'stable' | 'degrading';
  criticalIssues: number;
}

export interface CodeHealthGaugeProps {
  data: CodeHealthData;
  size?: 'sm' | 'md' | 'lg';
  showDimensions?: boolean;
  animated?: boolean;
  className?: string;
}

const GRADE_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  A: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    label: 'Excellent'
  },
  B: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    label: 'Good'
  },
  C: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    label: 'Fair'
  },
  D: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    label: 'Poor'
  },
  F: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    label: 'Critical'
  }
};

const DIMENSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  complexity: Zap,
  cohesion: Shield,
  coverage: Activity,
  velocity: TrendingUp,
  quality: CheckCircle,
  architecture: Shield,
  performance: Zap,
  evolution: TrendingUp
};

export const CodeHealthGauge = ({
  data,
  size = 'md',
  showDimensions = true,
  animated = true,
  className
}: CodeHealthGaugeProps) => {
  const gradeConfig = GRADE_CONFIG[data.grade];
  
  const sizeClasses = {
    sm: {
      gauge: 'w-24 h-24',
      grade: 'text-3xl',
      score: 'text-sm',
      dimensions: 'text-xs'
    },
    md: {
      gauge: 'w-32 h-32',
      grade: 'text-4xl',
      score: 'text-base',
      dimensions: 'text-sm'
    },
    lg: {
      gauge: 'w-40 h-40',
      grade: 'text-5xl',
      score: 'text-lg',
      dimensions: 'text-base'
    }
  };

  const classes = sizeClasses[size];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (data.overallScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Main gauge */}
      <div className={cn("relative", classes.gauge)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            opacity={0.3}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`hsl(var(--${data.grade === 'A' || data.grade === 'B' ? 'primary' : data.grade === 'C' ? 'yellow-500' : 'destructive'}))`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn(
              data.grade === 'A' && 'stroke-green-500',
              data.grade === 'B' && 'stroke-emerald-500',
              data.grade === 'C' && 'stroke-yellow-500',
              data.grade === 'D' && 'stroke-orange-500',
              data.grade === 'F' && 'stroke-red-500'
            )}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn(classes.grade, "font-bold", gradeConfig.color)}
            initial={animated ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {data.grade}
          </motion.span>
          <span className={cn(classes.score, "text-muted-foreground")}>
            {Math.round(data.overallScore)}%
          </span>
        </div>
        
        {/* Trend indicator */}
        <motion.div
          className={cn(
            "absolute -top-1 -right-1 p-1 rounded-full",
            data.trend === 'improving' && 'bg-green-500/20',
            data.trend === 'stable' && 'bg-yellow-500/20',
            data.trend === 'degrading' && 'bg-red-500/20'
          )}
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          {data.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {data.trend === 'stable' && <Activity className="w-4 h-4 text-yellow-400" />}
          {data.trend === 'degrading' && <AlertTriangle className="w-4 h-4 text-red-400" />}
        </motion.div>
      </div>

      {/* Grade label */}
      <div className={cn(
        "px-3 py-1 rounded-full border",
        gradeConfig.bgColor,
        gradeConfig.borderColor
      )}>
        <span className={cn("font-medium", gradeConfig.color)}>
          {gradeConfig.label}
        </span>
      </div>

      {/* Critical issues badge */}
      {data.criticalIssues > 0 && (
        <motion.div
          className="flex items-center gap-1 text-red-400 text-sm"
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <XCircle className="w-4 h-4" />
          <span>{data.criticalIssues} critical issue{data.criticalIssues > 1 ? 's' : ''}</span>
        </motion.div>
      )}

      {/* Dimension breakdown */}
      {showDimensions && (
        <div className="w-full max-w-xs space-y-2">
          {Object.entries(data.dimensions).map(([dim, value], i) => {
            const Icon = DIMENSION_ICONS[dim] || Activity;
            return (
              <motion.div
                key={dim}
                className="flex items-center gap-2"
                initial={animated ? { opacity: 0, x: -10 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.05 }}
              >
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className={cn("capitalize flex-1", classes.dimensions, "text-muted-foreground")}>
                  {dim}
                </span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      value >= 70 ? 'bg-green-500' :
                      value >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    )}
                    initial={animated ? { width: 0 } : { width: `${value}%` }}
                    animate={{ width: `${value}%` }}
                    transition={{ delay: 1.2 + i * 0.05, duration: 0.5 }}
                  />
                </div>
                <span className={cn("font-mono w-8 text-right", classes.dimensions)}>
                  {Math.round(value)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CodeHealthGauge;
