import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import { setActivePalette, PaletteId, PieceType, getCurrentPalette } from '@/lib/chess/pieceColors';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { TimelineProvider } from '@/contexts/TimelineContext';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Sparkles, ShoppingBag, Gift, DollarSign, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore, CreativeModeTransfer } from '@/stores/sessionStore';
import { VisionaryMembershipCard } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';
import UnifiedVisionExperience from '@/components/chess/UnifiedVisionExperience';
import { 
  getListingById, 
  purchaseListing, 
  completePurchase,
  MarketplaceListing 
} from '@/lib/marketplace/marketplaceApi';
import { extractPaletteId, isPremiumPalette, getPaletteDisplayName } from '@/lib/marketplace/paletteArtMap';

interface ExtendedGameData {
  white?: string;
  black?: string;
  event?: string;
  date?: string;
  result?: string;
  pgn?: string;
  moves?: string[];
  totalMoves?: number;
  board?: SquareData[][];
  visualizationState?: {
    paletteId?: string;
    darkMode?: boolean;
    currentMove?: number;
  };
}

const MarketplaceVisionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { 
    setCreativeModeTransfer,
    returningFromOrder,
    capturedTimelineState,
    setReturningFromOrder,
    setCapturedTimelineState,
  } = useSessionStore();
  
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const viewRecordedRef = useRef(false);

  // Handle restoration toast when returning from order page
  useEffect(() => {
    if (returningFromOrder && capturedTimelineState) {
      const { currentMove, totalMoves, title } = capturedTimelineState;
      const titleText = title || 'Vision';
      const moveInfo = currentMove !== undefined && totalMoves !== undefined
        ? `Move ${currentMove} of ${totalMoves}`
        : currentMove !== undefined
        ? `Move ${currentMove}`
        : 'Your vision is ready';
      
      toast.success(`${titleText} restored!`, {
        description: moveInfo,
        icon: <Sparkles className="w-4 h-4" />,
      });
      
      // Clear the flags
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

  useEffect(() => {
    if (!id) {
      setError('Invalid listing ID');
      setIsLoading(false);
      return;
    }

    const loadListing = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getListingById(id);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setError('Listing not found');
          return;
        }

        // Restore palette from visualization
        const gameData = data.visualization?.game_data as ExtendedGameData;
        const paletteId = gameData?.visualizationState?.paletteId;
        if (paletteId && paletteId !== 'custom') {
          setActivePalette(paletteId as PaletteId);
        }

        setListing(data);

        // Record view interaction (only once per session)
        if (!viewRecordedRef.current && data.visualization?.id) {
          viewRecordedRef.current = true;
          recordVisionInteraction(data.visualization.id, 'view');
        }
      } catch (err) {
        console.error('Failed to load listing:', err);
        setError('Failed to load listing');
        toast.error('Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    };

    loadListing();
  }, [id]);

  // Transfer to Creative Mode
  const handleTransferToCreative = useCallback(() => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!listing?.visualization) return;

    const gameData = listing.visualization.game_data as ExtendedGameData;
    const fen = gameData.pgn?.split(/\s+/).find(part => part.includes('/')) || 
                'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    
    const parseFenToBoard = (fenStr: string): (string | null)[][] => {
      const rows = fenStr.split(' ')[0].split('/');
      return rows.map(row => {
        const squares: (string | null)[] = [];
        for (const char of row) {
          if (/\d/.test(char)) {
            for (let i = 0; i < parseInt(char); i++) squares.push(null);
          } else {
            squares.push(char);
          }
        }
        return squares;
      });
    };

    const currentPalette = getCurrentPalette();
    
    const transferData: CreativeModeTransfer = {
      board: parseFenToBoard(fen),
      whitePalette: currentPalette.white as Record<PieceType, string>,
      blackPalette: currentPalette.black as Record<PieceType, string>,
      title: `${listing.visualization.title} (Creative Edit)`,
      sourceVisualizationId: listing.visualization.id,
    };

    setCreativeModeTransfer(transferData);
    navigate('/creative-mode');
    toast.success('Transferred to Creative Mode');
  }, [listing, isPremium, setCreativeModeTransfer, navigate]);

  const handlePurchase = async () => {
    if (!listing) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setIsPurchasing(true);
    const { url, success, message, visualizationId, error } = await purchaseListing(listing.id);

    if (error) {
      toast.error('Purchase failed', { description: error.message });
      setIsPurchasing(false);
      return;
    }

    // Free gift - transferred immediately
    if (success) {
      toast.success('Congratulations!', {
        description: message || 'Visualization added to your gallery!',
        action: visualizationId ? {
          label: 'View',
          onClick: () => navigate(`/my-vision/${visualizationId}`),
        } : undefined,
      });
      navigate('/my-vision');
      setIsPurchasing(false);
      return;
    }

    // Paid - redirect to Stripe
    if (url) {
      window.open(url, '_blank');
      setIsPurchasing(false);
    }
  };

  const handleShare = async () => {
    if (!listing?.visualization?.id) return;
    
    const shareUrl = `${window.location.origin}/v/${listing.visualization.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.visualization.title || 'Chess Visualization',
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

  const handleBack = () => {
    navigate('/marketplace');
  };

  // Reconstruct board and gameData from stored data
  const getVisualizationData = () => {
    if (!listing?.visualization) return null;

    const storedData = listing.visualization.game_data as ExtendedGameData;
    
    const board: SquareData[][] = storedData.board || 
      Array(8).fill(null).map((_, rank) =>
        Array(8).fill(null).map((_, file) => ({
          file,
          rank,
          visits: [],
          isLight: (file + rank) % 2 === 1,
        }))
      );
    
    const gameData: GameData = {
      white: storedData.white || 'White',
      black: storedData.black || 'Black',
      event: storedData.event || '',
      date: storedData.date || '',
      result: storedData.result || '',
      pgn: storedData.pgn || listing.visualization.pgn || '',
      moves: storedData.moves || [],
    };
    
    const totalMoves = storedData.totalMoves || 0;
    const paletteId = storedData.visualizationState?.paletteId;
    
    return { board, gameData, totalMoves, paletteId };
  };

  const isOwnListing = user?.id === listing?.seller_id;
  const isFree = (listing?.price_cents ?? 0) === 0;
  const paletteId = listing ? extractPaletteId(listing.visualization?.game_data as Record<string, unknown>) : null;
  const hasPremiumPalette = paletteId ? isPremiumPalette(paletteId) : false;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Unable to Load</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Marketplace
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const vizData = getVisualizationData();

  if (!vizData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-display font-bold">Invalid Visualization Data</h1>
            <p className="text-muted-foreground">The visualization data could not be loaded.</p>
            <Button onClick={handleBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Marketplace
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button and purchase info */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button 
            onClick={handleBack} 
            variant="ghost" 
            className="gap-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Marketplace
          </Button>
          
          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Price Badge */}
            <Badge 
              className={`text-sm px-3 py-1 ${
                isFree 
                  ? 'bg-green-500/90 hover:bg-green-500' 
                  : 'bg-primary/90 hover:bg-primary'
              }`}
            >
              {isFree ? (
                <><Gift className="h-3 w-3 mr-1" /> Free</>
              ) : (
                <><DollarSign className="h-3 w-3" />{((listing?.price_cents || 0) / 100).toFixed(2)}</>
              )}
            </Badge>
            
            {hasPremiumPalette && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black">
                {getPaletteDisplayName(paletteId || '') || 'Premium'}
              </Badge>
            )}

            {/* Order Print - Available to everyone */}
            <Button
              variant="outline"
              className="gap-2 border-primary/50 hover:bg-primary/10"
              onClick={() => {
                // Navigate to order print with this visualization's data
                navigate('/order-print', { 
                  state: { 
                    fromMarketplace: true,
                    visualizationId: listing?.visualization?.id,
                    title: listing?.visualization?.title,
                    imageUrl: listing?.visualization?.image_path,
                  } 
                });
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              Order Print
            </Button>
            
            {/* Claim Ownership - Premium only */}
            {!isOwnListing && (
              <Button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="btn-luxury gap-2"
              >
                {isPurchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFree ? (
                  <>
                    <Gift className="h-4 w-4" />
                    Claim Vision
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Claim Ownership
                  </>
                )}
              </Button>
            )}
            
            {isOwnListing && (
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3" />
                Your Listing
              </Badge>
            )}
          </div>
        </div>

        {/* Premium required notice for ownership - prints are available to everyone */}
        {!isPremium && user && !isOwnListing && (
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-sm text-amber-600">
              Premium membership required to claim ownership. <span className="text-muted-foreground">Anyone can order prints.</span>
            </span>
          </div>
        )}

        {/* Unified Vision Experience */}
        <TimelineProvider>
          <LegendHighlightProvider>
            <UnifiedVisionExperience
              board={vizData.board}
              gameData={vizData.gameData}
              totalMoves={vizData.totalMoves}
              context="marketplace"
              defaultTab="analytics"
              visualizationId={listing?.visualization?.id}
              paletteId={vizData.paletteId}
              createdAt={listing?.created_at}
              title={listing?.visualization?.title}
              imageUrl={listing?.visualization?.image_path}
              onTransferToCreative={handleTransferToCreative}
              onShare={handleShare}
              isPremium={isPremium}
              onUpgradePrompt={() => setShowUpgradeModal(true)}
              purchasePrice={listing?.price_cents}
              showPurchaseButton={!isOwnListing}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
            />
          </LegendHighlightProvider>
        </TimelineProvider>
      </div>
      <Footer />
      
      <VisionaryMembershipCard
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="marketplace"
      />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default MarketplaceVisionDetail;
