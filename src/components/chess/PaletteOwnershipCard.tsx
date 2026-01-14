/**
 * PaletteOwnershipCard
 * 
 * Displays palette ownership and credit score information for a game/palette combination.
 * Shows who owns different colorways of the current game and their market value.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User, TrendingUp, Palette, Lock, Sparkles, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { getGamePaletteAvailability, GamePaletteAvailability, PaletteAvailabilityInfo } from '@/lib/visualizations/paletteAvailability';
import { useAuth } from '@/hooks/useAuth';

interface PaletteOwnershipCardProps {
  pgn: string;
  currentPaletteId?: PaletteId;
  onPaletteSelect?: (info: PaletteAvailabilityInfo) => void;
  compact?: boolean;
}

interface VisionCreditScore {
  visualizationId: string;
  totalScore: number;
  viewCount: number;
  royaltyCentsEarned: number;
}

const PaletteOwnershipCard: React.FC<PaletteOwnershipCardProps> = ({
  pgn,
  currentPaletteId,
  onPaletteSelect,
  compact = false,
}) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<GamePaletteAvailability | null>(null);
  const [creditScores, setCreditScores] = useState<Map<string, VisionCreditScore>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch palette availability for this game
  useEffect(() => {
    if (!pgn) return;
    
    setIsLoading(true);
    getGamePaletteAvailability(pgn, user?.id)
      .then(result => {
        setAvailability(result);
        
        // Fetch credit scores for taken palettes
        const vizIds = result.takenPalettes.map(p => p.visualizationId).filter(Boolean) as string[];
        if (vizIds.length > 0) {
          fetchCreditScores(vizIds);
        }
      })
      .finally(() => setIsLoading(false));
  }, [pgn, user?.id]);

  const fetchCreditScores = async (vizIds: string[]) => {
    const { data: scores } = await supabase
      .from('vision_scores')
      .select('visualization_id, total_score, view_count, royalty_cents_earned')
      .in('visualization_id', vizIds);
    
    if (scores) {
      const scoreMap = new Map<string, VisionCreditScore>();
      scores.forEach(s => {
        scoreMap.set(s.visualization_id, {
          visualizationId: s.visualization_id,
          totalScore: s.total_score,
          viewCount: s.view_count,
          royaltyCentsEarned: s.royalty_cents_earned,
        });
      });
      setCreditScores(scoreMap);
    }
  };

  // Memoized palette display list
  const displayPalettes = useMemo(() => {
    if (!availability) return [];
    
    const allPalettes = [...availability.takenPalettes, ...availability.availablePalettes];
    
    // Sort: current palette first, then taken (by score), then available
    return allPalettes.sort((a, b) => {
      // Current palette always first
      if (a.paletteId === currentPaletteId) return -1;
      if (b.paletteId === currentPaletteId) return 1;
      
      // Taken before available
      if (a.isTaken && !b.isTaken) return -1;
      if (!a.isTaken && b.isTaken) return 1;
      
      // Sort taken by credit score
      if (a.isTaken && b.isTaken) {
        const scoreA = a.visualizationId ? creditScores.get(a.visualizationId)?.totalScore || 0 : 0;
        const scoreB = b.visualizationId ? creditScores.get(b.visualizationId)?.totalScore || 0 : 0;
        return scoreB - scoreA;
      }
      
      return 0;
    });
  }, [availability, currentPaletteId, creditScores]);

  const visiblePalettes = showAll ? displayPalettes : displayPalettes.slice(0, compact ? 4 : 8);

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!availability) return null;

  const currentPaletteInfo = displayPalettes.find(p => p.paletteId === currentPaletteId);
  const currentScore = currentPaletteInfo?.visualizationId 
    ? creditScores.get(currentPaletteInfo.visualizationId) 
    : null;

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Colorway Ownership
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {availability.totalTaken} / {availability.totalTaken + availability.totalAvailable} claimed
          </Badge>
        </div>
      </div>

      {/* Current Palette Credit Score */}
      {currentPaletteInfo?.isTaken && currentScore && (
        <div className="p-2 rounded bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {currentPaletteInfo.isOwnedByCurrentUser ? 'Your' : `${currentPaletteInfo.ownerDisplayName}'s`} {currentPaletteInfo.paletteName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {currentScore.viewCount}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Sparkles className="h-3 w-3" />
                {currentScore.totalScore.toFixed(1)} pts
              </span>
              {currentScore.royaltyCentsEarned > 0 && (
                <span className="flex items-center gap-1 text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  ${(currentScore.royaltyCentsEarned / 100).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Palette Grid */}
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8'} gap-1.5`}>
        <AnimatePresence mode="popLayout">
          {visiblePalettes.map(palette => {
            const paletteData = colorPalettes.find(p => p.id === palette.paletteId);
            const score = palette.visualizationId ? creditScores.get(palette.visualizationId) : null;
            const isActive = palette.paletteId === currentPaletteId;
            
            return (
              <TooltipProvider key={palette.paletteId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => onPaletteSelect?.(palette)}
                      className={`
                        relative p-1.5 rounded border transition-all
                        ${isActive 
                          ? 'border-primary ring-1 ring-primary/50' 
                          : palette.isTaken 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-border/50 hover:border-primary/50'
                        }
                      `}
                    >
                      {/* Color preview dots */}
                      <div className="flex justify-center gap-0.5 mb-1">
                        {paletteData && ['k', 'q', 'r'].map(piece => (
                          <div
                            key={piece}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: paletteData.white[piece as keyof typeof paletteData.white] }}
                          />
                        ))}
                      </div>
                      
                      {/* Palette name */}
                      <p className="text-[8px] text-center truncate text-muted-foreground">
                        {palette.paletteName.split(' ')[0]}
                      </p>
                      
                      {/* Ownership indicator */}
                      {palette.isTaken && (
                        <div className="absolute -top-1 -right-1">
                          {palette.isOwnedByCurrentUser ? (
                            <Crown className="h-3 w-3 text-primary" />
                          ) : (
                            <Lock className="h-2.5 w-2.5 text-amber-500" />
                          )}
                        </div>
                      )}
                      
                      {/* Score badge */}
                      {score && score.totalScore > 0 && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                          <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3">
                            {score.totalScore.toFixed(0)}
                          </Badge>
                        </div>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{palette.paletteName}</p>
                      {palette.isTaken ? (
                        <>
                          <p className="text-muted-foreground">
                            Owned by {palette.isOwnedByCurrentUser ? 'you' : palette.ownerDisplayName}
                          </p>
                          {score && (
                            <p className="text-primary">Score: {score.totalScore.toFixed(1)} pts</p>
                          )}
                          {palette.isListedForSale && palette.listingPriceCents && (
                            <p className="text-green-500">
                              For sale: ${(palette.listingPriceCents / 100).toFixed(2)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-green-500">Available to claim</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more button */}
      {displayPalettes.length > (compact ? 4 : 8) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : `Show all ${displayPalettes.length} colorways`}
        </Button>
      )}
    </div>
  );
};

export default PaletteOwnershipCard;
