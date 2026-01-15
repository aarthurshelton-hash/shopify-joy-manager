import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Crown, AlertTriangle, Check, Loader2, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkVisualizationSimilarity, SimilarityCheckResult, PaletteColors } from '@/lib/visualizations/similarityDetection';
import { GameData } from '@/lib/chess/gameSimulator';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ClaimVisionButtonProps {
  pgn?: string;
  gameData: GameData;
  paletteId?: PaletteId;
  customColors?: PaletteColors;
  visualizationId?: string;
  isOwner?: boolean;
  isPremium?: boolean;
  onClaim?: () => Promise<string | null>;
  onUpgradePrompt?: () => void;
  compact?: boolean;
  className?: string;
}

interface OwnershipStatus {
  isChecking: boolean;
  isOwned: boolean;
  ownedByCurrentUser: boolean;
  ownerDisplayName?: string;
  isTooSimilar: boolean;
  similarityResult?: SimilarityCheckResult;
}

export const ClaimVisionButton: React.FC<ClaimVisionButtonProps> = ({
  pgn,
  gameData,
  paletteId = 'modern',
  customColors,
  visualizationId,
  isOwner = false,
  isPremium = false,
  onClaim,
  onUpgradePrompt,
  compact = false,
  className = '',
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<OwnershipStatus>({
    isChecking: true,
    isOwned: false,
    ownedByCurrentUser: false,
    isTooSimilar: false,
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSimilarityDialog, setShowSimilarityDialog] = useState(false);

  // Check ownership and similarity status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) {
        setStatus({
          isChecking: false,
          isOwned: false,
          ownedByCurrentUser: false,
          isTooSimilar: false,
        });
        return;
      }

      setStatus(prev => ({ ...prev, isChecking: true }));

      try {
        // Check similarity
        const similarityResult = await checkVisualizationSimilarity(
          user.id,
          pgn,
          gameData,
          paletteId,
          customColors
        );

        if (similarityResult.isTooSimilar) {
          setStatus({
            isChecking: false,
            isOwned: true,
            ownedByCurrentUser: similarityResult.ownedByCurrentUser || false,
            ownerDisplayName: similarityResult.ownerDisplayName,
            isTooSimilar: true,
            similarityResult,
          });
        } else {
          setStatus({
            isChecking: false,
            isOwned: false,
            ownedByCurrentUser: false,
            isTooSimilar: false,
            similarityResult,
          });
        }
      } catch (error) {
        console.error('Error checking ownership status:', error);
        setStatus({
          isChecking: false,
          isOwned: false,
          ownedByCurrentUser: false,
          isTooSimilar: false,
        });
      }
    };

    checkStatus();
  }, [user?.id, pgn, gameData, paletteId, customColors]);

  // Handle claim action
  const handleClaim = async () => {
    if (!user) {
      toast.error('Please sign in to claim this vision');
      return;
    }

    if (!isPremium) {
      onUpgradePrompt?.();
      return;
    }

    if (status.isTooSimilar) {
      setShowSimilarityDialog(true);
      return;
    }

    if (!onClaim) {
      toast.error('Claim functionality not available');
      return;
    }

    setIsClaiming(true);
    try {
      const id = await onClaim();
      if (id) {
        toast.success('Vision claimed successfully!', {
          description: 'This unique colorway is now in your gallery',
        });
        setStatus(prev => ({
          ...prev,
          isOwned: true,
          ownedByCurrentUser: true,
        }));
      }
    } catch (error) {
      console.error('Error claiming vision:', error);
      toast.error('Failed to claim vision');
    } finally {
      setIsClaiming(false);
    }
  };

  // Already owned by current user
  if (isOwner || status.ownedByCurrentUser) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-green-500/10 text-green-600 border-green-500/30 ${className}`}
      >
        <Check className="h-3 w-3 mr-1" />
        Your Vision
      </Badge>
    );
  }

  // Loading state
  if (status.isChecking) {
    return (
      <Button variant="outline" size={compact ? "sm" : "default"} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking...
      </Button>
    );
  }

  // Too similar to existing vision
  if (status.isTooSimilar && status.isOwned) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size={compact ? "sm" : "default"} 
                onClick={() => setShowSimilarityDialog(true)}
                className={`border-amber-500/50 text-amber-600 hover:bg-amber-500/10 ${className}`}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {compact ? 'Similar' : 'Too Similar'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>This vision is too similar to one already in {status.ownerDisplayName || "someone's"} gallery.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Similarity Dialog */}
        <Dialog open={showSimilarityDialog} onOpenChange={setShowSimilarityDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Vision Already Exists
              </DialogTitle>
              <DialogDescription>
                This exact colorway of this game is already owned by another collector.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Owner info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{status.ownerDisplayName || 'Another collector'}</p>
                  <p className="text-sm text-muted-foreground">
                    {status.similarityResult?.colorSimilarity 
                      ? `${Math.round(status.similarityResult.colorSimilarity)}% color similarity`
                      : 'Owns this colorway'
                    }
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">To claim your own unique vision:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Change at least 8 colors to make it unique
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Try a different palette for a fresh look
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Use Creative Mode to customize colors
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowSimilarityDialog(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link to="/creative">
                    <Sparkles className="h-4 w-4" />
                    Open Creative
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Available to claim
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={compact ? "sm" : "default"}
            onClick={handleClaim}
            disabled={isClaiming}
            className={`gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 ${className}`}
          >
            {isClaiming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {compact ? 'Claim' : 'Claim This Vision'}
            {!isPremium && <Crown className="h-3 w-3 opacity-70" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isPremium 
            ? 'Add this unique colorway to your gallery' 
            : 'Premium members can claim unique visions'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ClaimVisionButton;
