import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature } from '@/lib/pensent-core/types/core';

interface EnPensentControlsProps {
  isEnabled: boolean;
  onToggle: () => void;
  totalMoves: number;
  showPieces?: boolean;
  onShowPiecesToggle?: () => void;
  signature?: TemporalSignature | null;
}

export const EnPensentControls: React.FC<EnPensentControlsProps> = ({
  isEnabled,
  onToggle,
  totalMoves,
  showPieces = true,
  onShowPiecesToggle,
  signature,
}) => {
  const pattern = useEnPensentPatterns(signature);
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onToggle}
              className={`
                relative overflow-hidden
                flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5
                rounded-full font-display text-xs sm:text-sm uppercase tracking-wider
                transition-all duration-300 touch-manipulation
                ${isEnabled 
                  ? 'bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-muted/80 text-muted-foreground hover:bg-muted border border-border/50'
                }
              `}
              style={isEnabled && signature ? {
                background: `linear-gradient(135deg, ${pattern.dominantColor}, ${pattern.secondaryColor})`,
                boxShadow: `0 4px 20px ${pattern.dominantColor}40`
              } : undefined}
              whileTap={{ scale: 0.95 }}
            >
              {isEnabled && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: signature 
                      ? `linear-gradient(90deg, transparent, ${pattern.secondaryColor}40, transparent)`
                      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
              
              <AnimatePresence mode="wait">
                {isEnabled ? (
                  <motion.div
                    key="on"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="off"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <span className="relative z-10 hidden sm:inline">En Pensent</span>
              <span className="relative z-10 sm:hidden">Art</span>
              
              {isEnabled && totalMoves > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-background text-foreground text-[10px] font-bold border border-border shadow-sm"
                >
                  {totalMoves}
                </motion.span>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isEnabled ? 'Hide' : 'Show'} En Pensent Art</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {onShowPiecesToggle && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPieces ? "default" : "outline"}
                size="sm"
                onClick={onShowPiecesToggle}
                className={`
                  gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-full touch-manipulation font-display text-xs uppercase tracking-wider
                  ${showPieces 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'border-border/50'
                  }
                `}
              >
                {showPieces ? (
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="hidden sm:inline">Pieces</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{showPieces ? 'Hide' : 'Show'} Chess Pieces</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};