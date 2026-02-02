import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid3X3, Eye, Maximize2 } from 'lucide-react';
import { ShowPiecesToggle } from './ShowPiecesToggle';

interface VisionControlsProps {
  showCoordinates: boolean;
  onToggleCoordinates: (value: boolean) => void;
  showPieces: boolean;
  pieceOpacity: number;
  onTogglePieces: (value: boolean) => void;
  onOpacityChange: (value: number) => void;
  showLegend?: boolean;
  onToggleLegend?: (value: boolean) => void;
  onFullscreen: () => void;
  children?: React.ReactNode;
}

export const VisionControls: React.FC<VisionControlsProps> = ({
  showCoordinates,
  onToggleCoordinates,
  showPieces,
  pieceOpacity,
  onTogglePieces,
  onOpacityChange,
  showLegend,
  onToggleLegend,
  onFullscreen,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      {/* Left: View controls */}
      <div className="flex flex-wrap items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={showCoordinates}
                  onCheckedChange={onToggleCoordinates}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Toggle board coordinates (C)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-4 w-px bg-border" />

        <ShowPiecesToggle 
          showPieces={showPieces}
          pieceOpacity={pieceOpacity}
          onToggle={onTogglePieces}
          onOpacityChange={onOpacityChange}
          compact
        />

        {showLegend !== undefined && onToggleLegend && (
          <>
            <div className="h-4 w-px bg-border" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      checked={showLegend}
                      onCheckedChange={onToggleLegend}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Toggle color legend (L)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {/* Fullscreen Button */}
        <div className="h-4 w-px bg-border" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFullscreen}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen mode (F)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Right: Additional actions (like export buttons) */}
      {children && (
        <>
          <div className="hidden sm:block h-4 w-px bg-border mx-1" />
          <div className="flex items-center gap-2 sm:ml-auto">
            {children}
          </div>
        </>
      )}
    </div>
  );
};
