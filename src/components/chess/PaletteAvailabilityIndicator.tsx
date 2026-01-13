/**
 * Palette Availability Indicator
 * 
 * Shows which palettes are available or taken for the current game.
 * Integrates with the Universal Visualization Menu to guide users
 * toward unique ownership opportunities.
 */

import React, { useEffect, useState } from 'react';
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
  onPaletteSelect?: (paletteId: PaletteId) => void;
  compact?: boolean;
  showAllPalettes?: boolean;
}

const PaletteAvailabilityIndicator: React.FC<PaletteAvailabilityIndicatorProps> = ({
  pgn,
  currentUserId,
  currentPaletteId,
  onPaletteSelect,
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

  // Compact mode: just show status for current palette
  if (compact && currentPaletteInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5">
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
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {currentPaletteInfo.isTaken ? (
              currentPaletteInfo.isOwnedByCurrentUser ? (
                <span>You own this game in {currentPaletteInfo.paletteName}</span>
              ) : (
                <span>
                  Owned by {currentPaletteInfo.ownerDisplayName}
                  {currentPaletteInfo.isListedForSale && ` • Listed for $${(currentPaletteInfo.listingPriceCents! / 100).toFixed(2)}`}
                </span>
              )
            ) : (
              <span>This palette is available - be the first to claim it!</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
              <span className="text-sm font-medium">Palette Ownership</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {availability.totalAvailable} available
              </Badge>
              {!showAllPalettes && (
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2">
          {/* Available Palettes */}
          {availability.availablePalettes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Available to Claim</p>
              <div className="flex flex-wrap gap-1">
                {availability.availablePalettes.map((p) => (
                  <PaletteChip 
                    key={p.paletteId} 
                    info={p} 
                    isSelected={p.paletteId === currentPaletteId}
                    onSelect={onPaletteSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Taken Palettes */}
          {availability.takenPalettes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Already Owned</p>
              <div className="flex flex-wrap gap-1">
                {availability.takenPalettes.map((p) => (
                  <PaletteChip 
                    key={p.paletteId} 
                    info={p} 
                    isSelected={p.paletteId === currentPaletteId}
                    onSelect={onPaletteSelect}
                    onViewListing={p.isListedForSale ? () => navigate(`/marketplace/${p.visualizationId}`) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// Individual palette chip component
const PaletteChip: React.FC<{
  info: PaletteAvailabilityInfo;
  isSelected: boolean;
  onSelect?: (paletteId: PaletteId) => void;
  onViewListing?: () => void;
}> = ({ info, isSelected, onSelect, onViewListing }) => {
  const palette = colorPalettes.find(p => p.id === info.paletteId);
  if (!palette) return null;

  // Get a sample color from the palette for the visual indicator
  const sampleColor = palette.white.q;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (info.isListedForSale && onViewListing) {
                onViewListing();
              } else if (!info.isTaken && onSelect) {
                onSelect(info.paletteId);
              }
            }}
            className={`
              inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
              transition-all border
              ${isSelected 
                ? 'bg-primary/20 border-primary text-primary ring-2 ring-primary/20' 
                : info.isTaken 
                  ? 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
              }
              ${(!info.isTaken || info.isListedForSale) ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <span 
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: sampleColor }}
            />
            <span className="truncate max-w-[80px]">{palette.name}</span>
            {info.isTaken && (
              info.isOwnedByCurrentUser ? (
                <Crown className="h-3 w-3 text-primary" />
              ) : info.isListedForSale ? (
                <ShoppingBag className="h-3 w-3 text-amber-500" />
              ) : (
                <Lock className="h-3 w-3" />
              )
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {info.isTaken ? (
            <div className="text-center">
              <p className="font-medium">{palette.name}</p>
              <p className="text-xs text-muted-foreground">
                {info.isOwnedByCurrentUser 
                  ? 'You own this colorway' 
                  : `Owned by ${info.ownerDisplayName}`}
              </p>
              {info.isListedForSale && (
                <p className="text-xs text-amber-500 mt-1">
                  Listed for ${(info.listingPriceCents! / 100).toFixed(2)} • Click to view
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium">{palette.name}</p>
              <p className="text-xs text-primary">Available to claim!</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PaletteAvailabilityIndicator;
