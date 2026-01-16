/**
 * Trajectory Timeline Overlay
 * 
 * Overlays predicted strategic milestones and trajectory markers
 * on the game replay timeline slider.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Crown, 
  Swords,
  Shield,
  Zap,
  Flag
} from 'lucide-react';
import { HybridPrediction, TrajectoryMilestone } from '@/lib/chess/hybridPrediction';
import { PatternPrediction } from '@/lib/chess/patternLearning';
import { cn } from '@/lib/utils';

interface TrajectoryTimelineOverlayProps {
  hybridPrediction?: HybridPrediction | null;
  patternPrediction?: PatternPrediction | null;
  totalMoves: number;
  currentMove: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

interface TrajectoryMarker {
  move: number;
  type: 'milestone' | 'turning_point' | 'critical' | 'prediction';
  label: string;
  description?: string;
  confidence: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TrajectoryTimelineOverlay: React.FC<TrajectoryTimelineOverlayProps> = ({
  hybridPrediction,
  patternPrediction,
  totalMoves,
  currentMove,
  orientation = 'vertical',
  className,
}) => {
  // Generate trajectory markers from predictions
  const markers = React.useMemo(() => {
    const result: TrajectoryMarker[] = [];

    // Add hybrid prediction trajectory milestones
    if (hybridPrediction?.trajectoryPrediction?.expectedMilestones) {
      hybridPrediction.trajectoryPrediction.expectedMilestones.forEach((milestone, index) => {
        // Show milestone markers
        result.push({
          move: milestone.approximateMoveNumber,
          type: milestone.description.toLowerCase().includes('critical') ? 'critical' : 'milestone',
          label: `Move ${milestone.approximateMoveNumber}`,
          description: milestone.description,
          confidence: hybridPrediction.confidence.overall,
          color: 'text-amber-400',
          icon: Target,
        });
      });
    }

    // Add predicted trajectory milestones from pattern prediction
    if (patternPrediction && patternPrediction.lookaheadMoves > 0) {
      const lookaheadStart = totalMoves;
      const lookaheadEnd = totalMoves + patternPrediction.lookaheadMoves;
      
      // Add prediction start marker
      if (lookaheadStart > 0) {
        result.push({
          move: lookaheadStart,
          type: 'prediction',
          label: 'Prediction Zone',
          description: `Pattern-based forecast for next ${patternPrediction.lookaheadMoves} moves`,
          confidence: patternPrediction.confidence,
          color: 'text-purple-400',
          icon: Zap,
        });
      }

      // Add critical points in prediction zone
      const predictionMilestones = [
        Math.round(lookaheadStart + patternPrediction.lookaheadMoves * 0.33),
        Math.round(lookaheadStart + patternPrediction.lookaheadMoves * 0.66),
        lookaheadEnd,
      ];

      predictionMilestones.forEach((move, index) => {
        const isEnd = index === predictionMilestones.length - 1;
        result.push({
          move,
          type: isEnd ? 'turning_point' : 'milestone',
          label: isEnd ? 'Trajectory End' : `Checkpoint ${index + 1}`,
          description: isEnd 
            ? `Predicted outcome: ${patternPrediction.mostLikelyOutcome.replace('_', ' ')}`
            : `Pattern trajectory checkpoint`,
          confidence: patternPrediction.confidence * (1 - index * 0.1),
          color: isEnd 
            ? patternPrediction.mostLikelyOutcome === 'white_wins' ? 'text-sky-400' 
              : patternPrediction.mostLikelyOutcome === 'black_wins' ? 'text-rose-400' 
              : 'text-amber-400'
            : 'text-purple-400/70',
          icon: isEnd ? Flag : Shield,
        });
      });
    }

    // Sort by move number
    return result.sort((a, b) => a.move - b.move);
  }, [hybridPrediction, patternPrediction, totalMoves]);

  if (markers.length === 0) return null;

  // Calculate position based on move number and total
  const getPosition = (move: number) => {
    const maxMove = Math.max(
      totalMoves,
      patternPrediction ? totalMoves + patternPrediction.lookaheadMoves : totalMoves
    );
    return (move / maxMove) * 100;
  };

  const isVertical = orientation === 'vertical';

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "absolute pointer-events-none",
          isVertical ? "inset-y-0 right-0 w-8" : "inset-x-0 top-0 h-8",
          className
        )}
      >
        {markers.map((marker, index) => {
          const position = getPosition(marker.move);
          const isPast = marker.move <= currentMove;
          const isCurrent = marker.move === currentMove;
          const isFuture = marker.move > totalMoves;
          const IconComponent = marker.icon;

          return (
            <Tooltip key={`${marker.move}-${marker.type}-${index}`}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: isFuture ? 0.6 : 1, 
                    scale: isCurrent ? 1.2 : 1 
                  }}
                  className={cn(
                    "absolute pointer-events-auto cursor-pointer transition-all",
                    isVertical 
                      ? "right-1 -translate-y-1/2" 
                      : "top-1 -translate-x-1/2"
                  )}
                  style={isVertical 
                    ? { top: `${position}%` } 
                    : { left: `${position}%` }
                  }
                >
                  <div 
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all",
                      isCurrent ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "",
                      isPast && !isFuture ? "opacity-100" : "opacity-70",
                      isFuture ? "border border-dashed border-current" : "",
                      marker.type === 'critical' ? "bg-rose-500/20" : 
                      marker.type === 'turning_point' ? "bg-amber-500/20" :
                      marker.type === 'prediction' ? "bg-purple-500/20" :
                      "bg-card/80",
                      "w-5 h-5"
                    )}
                  >
                    <IconComponent className={cn("w-3 h-3", marker.color)} />
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side={isVertical ? "left" : "bottom"} 
                className="max-w-[200px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <IconComponent className={cn("w-3 h-3", marker.color)} />
                    <span className="font-medium text-xs">{marker.label}</span>
                    {isFuture && (
                      <span className="text-[10px] text-muted-foreground bg-purple-500/20 px-1 rounded">
                        Predicted
                      </span>
                    )}
                  </div>
                  {marker.description && (
                    <p className="text-[10px] text-muted-foreground">
                      {marker.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Confidence:</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${marker.confidence}%` }}
                      />
                    </div>
                    <span>{Math.round(marker.confidence)}%</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Future zone indicator */}
        {patternPrediction && patternPrediction.lookaheadMoves > 0 && (
          <div 
            className={cn(
              "absolute bg-gradient-to-b from-purple-500/10 to-purple-500/5 border-l border-dashed border-purple-500/30",
              isVertical 
                ? "inset-x-0 bottom-0" 
                : "inset-y-0 right-0"
            )}
            style={isVertical 
              ? { top: `${getPosition(totalMoves)}%` }
              : { left: `${getPosition(totalMoves)}%` }
            }
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default TrajectoryTimelineOverlay;
