import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  DollarSign,
  Gift,
  Eye,
  Download,
  Printer,
  TrendingUp,
  Calendar,
  User,
  Swords,
  Trophy,
  Share2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Users,
  FileImage,
  Film,
  ArrowRightLeft,
} from 'lucide-react';
import { MarketplaceListing } from '@/lib/marketplace/marketplaceApi';
import { VisionScore, getVisionScore, calculateVisionValue, calculateMembershipMultiplier, SCORING_WEIGHTS } from '@/lib/visualizations/visionScoring';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VisionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketplaceListing | null;
  onPurchase: (listing: MarketplaceListing) => void;
  isPurchasing: boolean;
  isOwnListing: boolean;
  isPremium: boolean;
}

interface ExtendedGameData {
  white?: string;
  black?: string;
  event?: string;
  date?: string;
  result?: string;
  pgn?: string;
  moves?: string[];
  totalMoves?: number;
  visualizationState?: {
    paletteId?: string;
    darkMode?: boolean;
    currentMove?: number;
  };
}

const VisionDetailModal: React.FC<VisionDetailModalProps> = ({
  isOpen,
  onClose,
  listing,
  onPurchase,
  isPurchasing,
  isOwnListing,
  isPremium,
}) => {
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [showFullPgn, setShowFullPgn] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  useEffect(() => {
    if (listing?.visualization?.id && isOpen) {
      loadVisionScore(listing.visualization.id);
    }
  }, [listing?.visualization?.id, isOpen]);

  const loadVisionScore = async (visualizationId: string) => {
    setIsLoadingScore(true);
    const score = await getVisionScore(visualizationId);
    setVisionScore(score);
    
    if (score) {
      // Estimate with a moderate subscriber base (100)
      const multiplier = calculateMembershipMultiplier(100);
      setEstimatedValue(calculateVisionValue(score, multiplier));
    }
    setIsLoadingScore(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/v/${listing?.visualization?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.visualization?.title || 'Chess Visualization',
          text: 'Check out this unique chess visualization on En Pensent!',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  if (!listing) return null;

  const gameData = listing.visualization?.game_data as ExtendedGameData | undefined;
  const isGenesis = listing.visualization?.title?.includes('Exemplar');
  const isFree = listing.price_cents === 0;
  const totalMoves = gameData?.totalMoves || gameData?.moves?.length || 0;
  const paletteId = gameData?.visualizationState?.paletteId || 'modern';

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatResult = (result?: string) => {
    if (!result) return 'Unknown';
    if (result === '1-0') return 'White wins';
    if (result === '0-1') return 'Black wins';
    if (result === '1/2-1/2') return 'Draw';
    return result;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isGenesis && <Crown className="h-5 w-5 text-amber-500" />}
            {listing.visualization?.title || 'Untitled Vision'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Image and Quick Stats */}
          <div className="space-y-4">
            {/* Vision Image */}
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
              {listing.visualization?.image_path ? (
                <img
                  src={listing.visualization.image_path}
                  alt={listing.visualization.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {isGenesis && (
                  <Badge className="bg-amber-500/90 hover:bg-amber-500 text-black">
                    🏆 Genesis Vision
                  </Badge>
                )}
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                  {totalMoves} moves
                </Badge>
              </div>
              
              {/* Price Badge */}
              <Badge 
                className={`absolute top-3 right-3 text-base px-3 py-1 ${
                  isFree 
                    ? 'bg-green-500/90 hover:bg-green-500' 
                    : 'bg-primary/90 hover:bg-primary'
                }`}
              >
                {isFree ? (
                  <><Gift className="h-4 w-4 mr-1" /> Free Gift</>
                ) : (
                  <><DollarSign className="h-4 w-4 mr-0.5" />{(listing.price_cents / 100).toFixed(2)}</>
                )}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="lg"
                variant={isFree ? "default" : "outline"}
                onClick={() => onPurchase(listing)}
                disabled={isPurchasing || isOwnListing}
              >
                {isPurchasing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                ) : isOwnListing ? (
                  'Your Listing'
                ) : isFree ? (
                  <><Gift className="h-4 w-4 mr-2" /> Claim Gift</>
                ) : (
                  <><DollarSign className="h-4 w-4 mr-1" /> Purchase {formatPrice(listing.price_cents)}</>
                )}
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(`/v/${listing.visualization?.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {!isPremium && !isOwnListing && (
              <p className="text-sm text-muted-foreground text-center">
                <Crown className="h-4 w-4 inline mr-1 text-amber-500" />
                Premium required to claim ownership. <span className="opacity-70">Anyone can order prints.</span>
              </p>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listed by</p>
                <p className="font-medium">{listing.seller?.display_name || 'Anonymous'}</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(listing.created_at), 'MMM d, yyyy')}
              </Badge>
            </div>

            {/* Game Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Swords className="h-4 w-4" />
                Game Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {gameData?.white && (
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-muted-foreground text-xs">White</p>
                    <p className="font-medium truncate">{gameData.white}</p>
                  </div>
                )}
                {gameData?.black && (
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-muted-foreground text-xs">Black</p>
                    <p className="font-medium truncate">{gameData.black}</p>
                  </div>
                )}
                {gameData?.event && (
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-muted-foreground text-xs">Event</p>
                    <p className="font-medium truncate">{gameData.event}</p>
                  </div>
                )}
                {gameData?.date && (
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{gameData.date}</p>
                  </div>
                )}
                {gameData?.result && (
                  <div className="p-2 rounded bg-muted/50 col-span-2">
                    <p className="text-muted-foreground text-xs">Result</p>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <p className="font-medium">{formatResult(gameData.result)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Palette */}
              <div className="p-2 rounded bg-muted/50">
                <p className="text-muted-foreground text-xs">Color Palette</p>
                <p className="font-medium capitalize">{paletteId}</p>
              </div>
            </div>

            <Separator />

            {/* Vision Score Analytics */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Vision Analytics
              </h3>
              
              {isLoadingScore ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : visionScore ? (
                <div className="space-y-3">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <Eye className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                      <p className="text-lg font-bold">{visionScore.viewCount}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <FileImage className="h-4 w-4 mx-auto text-green-500 mb-1" />
                      <p className="text-lg font-bold">{visionScore.downloadHdCount}</p>
                      <p className="text-xs text-muted-foreground">HD</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <Film className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                      <p className="text-lg font-bold">{visionScore.downloadGifCount}</p>
                      <p className="text-xs text-muted-foreground">GIF</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <Printer className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                      <p className="text-lg font-bold">{visionScore.printOrderCount}</p>
                      <p className="text-xs text-muted-foreground">Prints</p>
                    </div>
                  </div>

                  {/* Trade Count and Unique Viewers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-muted/50 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-cyan-500" />
                      <div>
                        <p className="font-bold">{visionScore.tradeCount}</p>
                        <p className="text-xs text-muted-foreground">Trades</p>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-muted/50 flex items-center gap-2">
                      <Users className="h-4 w-4 text-pink-500" />
                      <div>
                        <p className="font-bold">{visionScore.uniqueViewers}</p>
                        <p className="text-xs text-muted-foreground">Unique Viewers</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Score & Estimated Value */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Vision Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {visionScore.totalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Est. Value</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${estimatedValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Print Revenue if any */}
                  {visionScore.printRevenueCents > 0 && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-sm">
                      <span className="text-amber-600 font-medium">
                        ${(visionScore.printRevenueCents / 100).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground"> in print revenue generated</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No analytics yet</p>
                  <p className="text-xs">Score builds with views, downloads, and trades</p>
                </div>
              )}
            </div>

            {/* Score Formula Reference */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <p className="font-medium mb-1">Scoring Formula:</p>
              <p>
                Views ({SCORING_WEIGHTS.view}) • HD ({SCORING_WEIGHTS.download_hd}) • 
                GIF ({SCORING_WEIGHTS.download_gif}) • Trade ({SCORING_WEIGHTS.trade}) • 
                Print ({SCORING_WEIGHTS.print_order_base} + $)
              </p>
            </div>

            {/* PGN Toggle */}
            {gameData?.pgn && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowFullPgn(!showFullPgn)}
                >
                  <span>View PGN</span>
                  {showFullPgn ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                <AnimatePresence>
                  {showFullPgn && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {gameData.pgn}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisionDetailModal;
