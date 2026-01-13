import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, Sparkles, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getOrphanedVisualizations, claimOrphanedVisualization } from '@/lib/marketplace/marketplaceApi';
import { TransferLimitBadge } from './TransferLimitBadge';

interface OrphanedVision {
  id: string;
  title: string;
  image_path: string;
  game_data: unknown;
  pgn?: string | null;
}

interface ClaimableVisionsSectionProps {
  onClaim?: () => void;
}

export const ClaimableVisionsSection: React.FC<ClaimableVisionsSectionProps> = ({ onClaim }) => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [visions, setVisions] = useState<OrphanedVision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadOrphanedVisions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getOrphanedVisualizations();
    if (!error) {
      setVisions(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadOrphanedVisions();
  }, [loadOrphanedVisions]);

  const handleClaim = async (visionId: string, title: string) => {
    if (!user) {
      toast.error('Please sign in to claim visions');
      return;
    }
    if (!isPremium) {
      toast.error('Premium membership required', {
        description: 'Upgrade to claim and own visions',
      });
      return;
    }

    setClaimingId(visionId);
    const { success, error } = await claimOrphanedVisualization(visionId);

    if (error) {
      toast.error('Failed to claim vision', { description: error.message });
    } else if (success) {
      toast.success('Vision claimed!', {
        description: `"${title}" is now in your gallery`,
        action: {
          label: 'View',
          onClick: () => navigate(`/my-vision/${visionId}`),
        },
      });
      // Refresh the list
      loadOrphanedVisions();
      onClaim?.();
    }
    setClaimingId(null);
  };

  // Don't show section if no orphaned visions
  if (!isLoading && visions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Gift className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Claimable Visions
            <Badge variant="secondary" className="text-xs">
              {visions.length} available
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Unclaimed visions from expired memberships - free for premium members
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visions.map((vision, index) => (
            <div
              key={vision.id}
              style={{ 
                opacity: 0, 
                animation: `fadeInUp 0.3s ease-out ${index * 0.03}s forwards` 
              }}
            >
              <Card className="overflow-hidden group border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {vision.image_path ? (
                    <img
                      src={vision.image_path}
                      alt={vision.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Free badge */}
                  <Badge className="absolute top-2 right-2 bg-green-500/90 hover:bg-green-500 pointer-events-none">
                    <Gift className="h-3 w-3 mr-1" />
                    Free
                  </Badge>

                  {/* Transfer limit */}
                  <div className="absolute bottom-2 left-2 pointer-events-none">
                    <TransferLimitBadge visualizationId={vision.id} variant="compact" />
                  </div>
                </div>

                <CardContent className="p-2.5">
                  <h3 className="font-medium text-xs truncate mb-2">
                    {vision.title || 'Untitled Vision'}
                  </h3>
                  
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs gap-1"
                    disabled={!isPremium || claimingId === vision.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim(vision.id, vision.title);
                    }}
                  >
                    {claimingId === vision.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : !isPremium ? (
                      <>
                        <Crown className="h-3 w-3" />
                        Premium Only
                      </>
                    ) : (
                      <>
                        <Gift className="h-3 w-3" />
                        Claim
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {!isPremium && visions.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Crown className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-600">
            Upgrade to Premium to claim these unclaimed visions for free
          </span>
        </div>
      )}
    </div>
  );
};

export default ClaimableVisionsSection;
