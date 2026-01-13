/**
 * Palette Availability Indicator
 * 
 * Shows which palettes are available or taken for the current game.
 * Allows navigation between different palette versions of the same game.
 * Users can click on any palette to:
 * - View the taken vision (navigate to its visualization menu)
 * - Apply an available palette (if in generator context)
 * - See listing details if for sale
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Check, 
  Lock, 
  ShoppingBag, 
  ChevronDown, 
  Palette, 
  Crown,
  Eye,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { 
  getGamePaletteAvailability, 
  GamePaletteAvailability,
  PaletteAvailabilityInfo,
} from '@/lib/visualizations/paletteAvailability';
import { useNavigate } from 'react-router-dom';

interface PaletteAvailabilityIndicatorProps {
  pgn?: string;
  currentUserId?: string;
  currentPaletteId?: PaletteId;
  /** Called when user wants to apply a different palette (generator context) */
  onPaletteSelect?: (paletteId: PaletteId) => void;
  /** Called for seamless palette switching with full info */
  onSeamlessSwitch?: (info: PaletteAvailabilityInfo) => void;
  /** Context determines navigation behavior */
  context?: 'generator' | 'gallery' | 'marketplace' | 'shared' | 'scanner' | 'postgame';
  compact?: boolean;
  showAllPalettes?: boolean;
}

const PaletteAvailabilityIndicator: React.FC<PaletteAvailabilityIndicatorProps> = ({
  pgn,
  currentUserId,
  currentPaletteId,
  onPaletteSelect,
  onSeamlessSwitch,
  context = 'generator',
  compact = false,
  showAllPalettes = false,
}) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<GamePaletteAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!pgn) return;
    
    setIsLoading(true);
    getGamePaletteAvailability(pgn, currentUserId)
      .then(setAvailability)
      .finally(() => setIsLoading(false));
  }, [pgn, currentUserId]);

  // Handle clicking on a palette chip
  const handlePaletteClick = useCallback((info: PaletteAvailabilityInfo) => {
    // If seamless switch is provided, use it for all palette changes
    if (onSeamlessSwitch) {
      onSeamlessSwitch(info);
      return;
    }
    
    if (info.isTaken && info.visualizationId) {
      // Navigate to the vision's detail page (universal menu)
      if (info.isListedForSale) {
        navigate(`/marketplace/${info.visualizationId}`);
      } else {
        navigate(`/vision/${info.visualizationId}`);
      }
    } else if (!info.isTaken && onPaletteSelect) {
      // Apply this palette (only in generator context)
      onPaletteSelect(info.paletteId);
    }
  }, [navigate, onPaletteSelect, onSeamlessSwitch]);

  if (!pgn) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!availability) return null;

  const currentPaletteInfo = currentPaletteId 
    ? [...availability.availablePalettes, ...availability.takenPalettes].find(p => p.paletteId === currentPaletteId)
    : null;

  // Compact mode: just show status for current palette with click to expand
  if (compact && currentPaletteInfo) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              {currentPaletteInfo.isTaken ? (
                currentPaletteInfo.isOwnedByCurrentUser ? (
                  <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                    <Crown className="h-3 w-3" />
                    You Own This
                  </Badge>
                ) : currentPaletteInfo.isListedForSale ? (
                  <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <ShoppingBag className="h-3 w-3" />
                    For Sale
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Owned
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
                  <Check className="h-3 w-3" />
                  Available
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {availability.totalTaken > 0 && `${availability.totalTaken} colorway${availability.totalTaken > 1 ? 's' : ''} taken`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Browse palettes</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <PaletteGrid
            availability={availability}
            currentPaletteId={currentPaletteId}
            context={context}
            onPaletteClick={handlePaletteClick}
          />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full mode: show all palette availability
  return (
    <Collapsible open={isExpanded || showAllPalettes} onOpenChange={setIsExpanded}>
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Browse All Colorways</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {availability.totalAvailable} available
              </Badge>
              {availability.totalTaken > 0 && (
                <Badge variant="outline" className="text-xs">
                  {availability.totalTaken} owned
                </Badge>
              )}
              {!showAllPalettes && (
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <PaletteGrid
            availability={availability}
            currentPaletteId={currentPaletteId}
            context={context}
            onPaletteClick={handlePaletteClick}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// Grid of palette chips - shows all palettes with their status
const PaletteGrid: React.FC<{
  availability: GamePaletteAvailability;
  currentPaletteId?: PaletteId;
  context: string;
  onPaletteClick: (info: PaletteAvailabilityInfo) => void;
}> = ({ availability, currentPaletteId, context, onPaletteClick }) => {
  const isGeneratorContext = context === 'generator' || context === 'postgame';
  
  return (
    <div className="space-y-3">
      {/* Available Palettes - Claimable */}
      {availability.availablePalettes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Available to Claim ({availability.availablePalettes.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availability.availablePalettes.map((p) => (
              <PaletteChip 
                key={p.paletteId} 
                info={p} 
                isSelected={p.paletteId === currentPaletteId}
                isGeneratorContext={isGeneratorContext}
                onClick={() => onPaletteClick(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Taken Palettes - Viewable */}
      {availability.takenPalettes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Already Owned - Click to View ({availability.takenPalettes.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availability.takenPalettes.map((p) => (
              <PaletteChip 
                key={p.paletteId} 
                info={p} 
                isSelected={p.paletteId === currentPaletteId}
                isGeneratorContext={false}
                onClick={() => onPaletteClick(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Helpful tip */}
      <p className="text-[10px] text-muted-foreground/70 italic pt-2 border-t border-border/30">
        {isGeneratorContext 
          ? "Click available palettes to apply them. Click owned palettes to view that vision."
          : "Click any palette to view that colorway's visualization menu."
        }
      </p>
    </div>
  );
};

// Individual palette chip component
const PaletteChip: React.FC<{
  info: PaletteAvailabilityInfo;
  isSelected: boolean;
  isGeneratorContext: boolean;
  onClick: () => void;
}> = ({ info, isSelected, isGeneratorContext, onClick }) => {
  const palette = colorPalettes.find(p => p.id === info.paletteId);
  if (!palette) return null;

  // Get a sample color from the palette for the visual indicator
  const sampleColor = palette.white.q;

  const isClickable = !info.isTaken || info.visualizationId;
  const showViewIcon = info.isTaken && info.visualizationId;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={!isClickable}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs
              transition-all border font-medium
              ${isSelected 
                ? 'bg-primary/20 border-primary text-primary ring-2 ring-primary/20' 
                : info.isTaken 
                  ? info.isListedForSale
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:border-amber-500/50'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-border'
                  : 'bg-background border-primary/30 text-foreground hover:border-primary hover:bg-primary/5'
              }
              ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            `}
          >
            <span 
              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: sampleColor }}
            />
            <span className="truncate max-w-[100px]">{palette.name}</span>
            {info.isTaken && (
              info.isOwnedByCurrentUser ? (
                <Crown className="h-3 w-3 text-green-600 flex-shrink-0" />
              ) : info.isListedForSale ? (
                <ShoppingBag className="h-3 w-3 text-amber-500 flex-shrink-0" />
              ) : showViewIcon ? (
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-3 w-3 flex-shrink-0" />
              )
            )}
            {!info.isTaken && isGeneratorContext && (
              <Check className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          {info.isTaken ? (
            <div className="text-center space-y-1">
              <p className="font-medium">{palette.name}</p>
              <p className="text-xs text-muted-foreground">
                {info.isOwnedByCurrentUser 
                  ? 'You own this colorway' 
                  : `Owned by ${info.ownerDisplayName}`}
              </p>
              {info.isListedForSale && (
                <p className="text-xs text-amber-500">
                  For sale: ${(info.listingPriceCents! / 100).toFixed(2)}
                </p>
              )}
              <p className="text-[10px] text-primary mt-1">
                Click to view this vision →
              </p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="font-medium">{palette.name}</p>
              <p className="text-xs text-primary">Available to claim!</p>
              {isGeneratorContext && (
                <p className="text-[10px] text-muted-foreground">
                  Click to apply this palette
                </p>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PaletteAvailabilityIndicator;
