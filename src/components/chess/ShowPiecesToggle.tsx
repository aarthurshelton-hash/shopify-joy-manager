import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShowPiecesToggleProps {
  showPieces: boolean;
  pieceOpacity: number;
  onToggle: (show: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  compact?: boolean;
}

export const ShowPiecesToggle: React.FC<ShowPiecesToggleProps> = ({
  showPieces,
  pieceOpacity,
  onToggle,
  onOpacityChange,
  compact = false,
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center">
        {/* Main toggle button — directly toggles pieces on single tap */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showPieces ? 'default' : 'outline'}
              size="sm"
              className={`gap-2 rounded-r-none border-r-0 touch-manipulation ${compact ? 'h-7 text-xs' : ''}`}
              onClick={() => onToggle(!showPieces)}
            >
              {showPieces ? (
                <Eye className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              ) : (
                <EyeOff className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              )}
              <Crown className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {!compact && 'Pieces'}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showPieces ? 'Hide chess pieces' : 'Show chess pieces'}
          </TooltipContent>
        </Tooltip>

        {/* Opacity settings button — opens popover */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={showPieces ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-l-none px-1.5 touch-manipulation ${compact ? 'h-7' : ''}`}
                >
                  <ChevronDown className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Piece opacity settings</TooltipContent>
          </Tooltip>

          <PopoverContent side="bottom" align="center" className="w-60 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Show Pieces</span>
                </div>
                <Button
                  variant={showPieces ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs touch-manipulation"
                  onClick={() => onToggle(!showPieces)}
                >
                  {showPieces ? 'On' : 'Off'}
                </Button>
              </div>

              <motion.div
                initial={false}
                animate={{
                  opacity: showPieces ? 1 : 0.5,
                  height: showPieces ? 'auto' : 'auto',
                }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Opacity</span>
                  <span className="font-mono">{Math.round(pieceOpacity * 100)}%</span>
                </div>

                <Slider
                  value={[pieceOpacity]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => onOpacityChange(v[0])}
                  disabled={!showPieces}
                  className="w-full"
                />

                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Subtle</span>
                  <span>Bold</span>
                </div>
              </motion.div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Adjust piece visibility to find the perfect balance between the artistic visualization and chess position clarity.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
};

export default ShowPiecesToggle;
