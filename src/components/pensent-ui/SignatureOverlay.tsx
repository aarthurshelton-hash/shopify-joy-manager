/**
 * SignatureOverlay - Pattern visualization overlay
 * Displays temporal signature data as an animated overlay
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArchetypeBadge } from "./ArchetypeBadge";
import { TemporalFlowChart, TemporalFlowData } from "./TemporalFlowChart";
import { QuadrantRadar, QuadrantData } from "./QuadrantRadar";
import { 
  Activity, 
  TrendingUp, 
  Fingerprint, 
  Target,
  Zap,
  BarChart3
} from "lucide-react";

export interface SignatureData {
  fingerprint: string;
  archetype: string;
  intensity: number;
  momentum: number;
  confidence: number;
  temporalFlow: TemporalFlowData;
  quadrantProfile: QuadrantData;
}

export interface SignatureOverlayProps {
  signature: SignatureData;
  variant?: 'compact' | 'full' | 'minimal';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showCharts?: boolean;
  animated?: boolean;
  className?: string;
}

export const SignatureOverlay = ({
  signature,
  variant = 'compact',
  position = 'bottom-right',
  showCharts = true,
  animated = true,
  className
}: SignatureOverlayProps) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        className={cn(
          "absolute z-10 flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-background/80 backdrop-blur-sm border border-border/50",
          positionClasses[position],
          className
        )}
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Fingerprint className="w-4 h-4 text-primary" />
        <code className="text-xs font-mono text-muted-foreground">{signature.fingerprint}</code>
        <ArchetypeBadge archetype={signature.archetype} size="sm" />
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        className={cn(
          "absolute z-10 p-4 rounded-xl w-64",
          "bg-background/90 backdrop-blur-md border border-border/50 shadow-xl",
          positionClasses[position],
          className
        )}
        initial={animated ? { opacity: 0, scale: 0.95 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            <code className="text-xs font-mono text-muted-foreground">{signature.fingerprint}</code>
          </div>
        </div>
        
        {/* Archetype */}
        <div className="mb-4">
          <ArchetypeBadge 
            archetype={signature.archetype} 
            size="md" 
            showDescription 
          />
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Activity className="w-3 h-3 mx-auto mb-1 text-blue-400" />
            <div className="text-sm font-bold">{Math.round(signature.intensity * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Intensity</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <TrendingUp className="w-3 h-3 mx-auto mb-1 text-green-400" />
            <div className="text-sm font-bold">{Math.round(signature.momentum * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Momentum</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Zap className="w-3 h-3 mx-auto mb-1 text-amber-400" />
            <div className="text-sm font-bold">{Math.round(signature.confidence * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Confidence</div>
          </div>
        </div>
        
        {/* Mini temporal flow */}
        {showCharts && (
          <TemporalFlowChart 
            data={signature.temporalFlow} 
            height={60} 
            showLabels={false}
            showValues={false}
            colorScheme="gradient"
          />
        )}
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      className={cn(
        "absolute z-10 p-6 rounded-2xl w-[400px]",
        "bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl",
        positionClasses[position],
        className
      )}
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Temporal Signature</h3>
            <code className="text-xs font-mono text-muted-foreground">{signature.fingerprint}</code>
          </div>
        </div>
        <ArchetypeBadge archetype={signature.archetype} size="md" />
      </div>
      
      {/* Charts Row */}
      {showCharts && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Quadrant Radar */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              Quadrant Profile
            </div>
            <QuadrantRadar 
              data={signature.quadrantProfile} 
              size={120}
              showLabels
              showValues={false}
            />
          </div>
          
          {/* Temporal Flow */}
          <div>
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <BarChart3 className="w-3 h-3" />
              Temporal Flow
            </div>
            <TemporalFlowChart 
              data={signature.temporalFlow} 
              height={100}
              colorScheme="gradient"
            />
          </div>
        </div>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div 
          className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center"
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Activity className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <div className="text-lg font-bold">{Math.round(signature.intensity * 100)}%</div>
          <div className="text-xs text-muted-foreground">Pattern Intensity</div>
        </motion.div>
        
        <motion.div 
          className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <div className="text-lg font-bold">{Math.round(signature.momentum * 100)}%</div>
          <div className="text-xs text-muted-foreground">Momentum</div>
        </motion.div>
        
        <motion.div 
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <div className="text-lg font-bold">{Math.round(signature.confidence * 100)}%</div>
          <div className="text-xs text-muted-foreground">Confidence</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SignatureOverlay;
