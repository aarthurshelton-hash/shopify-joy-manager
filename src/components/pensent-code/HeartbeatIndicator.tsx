/**
 * Heartbeat Indicator Component
 * Visual pulsing indicator showing live analysis state
 */

import { motion } from 'framer-motion';
import { Activity, Pause, RefreshCw } from 'lucide-react';
import { formatNextPulse } from '@/hooks/useLiveHeartbeat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeartbeatIndicatorProps {
  isAlive: boolean;
  isProcessing: boolean;
  lastPulse: Date | null;
  pulseCount: number;
  nextPulseIn: number;
  onStart?: () => void;
  onStop?: () => void;
  onPulse?: () => void;
  showControls?: boolean;
  compact?: boolean;
}

export function HeartbeatIndicator({
  isAlive,
  isProcessing,
  lastPulse,
  pulseCount,
  nextPulseIn,
  onStart,
  onStop,
  onPulse,
  showControls = true,
  compact = false
}: HeartbeatIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'p-2 rounded-lg bg-muted/30'}`}>
      {/* Pulsing heart icon */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <motion.div
                animate={isAlive ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                } : {}}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isAlive 
                    ? isProcessing 
                      ? 'bg-yellow-500/20' 
                      : 'bg-green-500/20' 
                    : 'bg-muted'
                }`}
              >
                <Activity className={`w-4 h-4 ${
                  isAlive 
                    ? isProcessing 
                      ? 'text-yellow-500' 
                      : 'text-green-500' 
                    : 'text-muted-foreground'
                }`} />
              </motion.div>
              
              {/* Pulse ring */}
              {isAlive && (
                <motion.div
                  animate={{
                    scale: [1, 2],
                    opacity: [0.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 rounded-full border-2 border-green-500"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isAlive 
              ? isProcessing 
                ? 'Processing...' 
                : `Live - Pulse #${pulseCount}`
              : 'Paused'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Status text */}
      {!compact && (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isAlive ? "default" : "secondary"} 
              className={`text-xs ${isAlive ? 'bg-green-500/20 text-green-400' : ''}`}
            >
              {isAlive ? 'LIVE' : 'PAUSED'}
            </Badge>
            {isAlive && !isProcessing && (
              <span className="text-xs text-muted-foreground">
                Next: {formatNextPulse(nextPulseIn)}
              </span>
            )}
            {isProcessing && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>
          {lastPulse && (
            <p className="text-xs text-muted-foreground">
              Last update: {lastPulse.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-1">
          {isAlive ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onStop}
            >
              <Pause className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onStart}
            >
              <Activity className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPulse}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  );
}
