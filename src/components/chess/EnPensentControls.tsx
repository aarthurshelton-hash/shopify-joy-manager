import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EnPensentControlsProps {
  isEnabled: boolean;
  opacity: number;
  onToggle: () => void;
  onOpacityChange: (value: number) => void;
  totalMoves: number;
}

export const EnPensentControls: React.FC<EnPensentControlsProps> = ({
  isEnabled,
  opacity,
  onToggle,
  onOpacityChange,
  totalMoves,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Main Toggle Button */}
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
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated background glow when enabled */}
        {isEnabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
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
        <span className="relative z-10 sm:hidden">EP</span>
        
        {/* Move counter badge */}
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

      {/* Opacity Control Popover */}
      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full touch-manipulation"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-4" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                      Opacity
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[opacity * 100]}
                    onValueChange={(value) => onOpacityChange(value[0] / 100)}
                    max={100}
                    min={10}
                    step={5}
                    className="touch-manipulation"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Subtle</span>
                    <span>Vivid</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
