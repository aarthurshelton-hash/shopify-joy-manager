import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import { setActivePalette, PaletteId, PieceType, getCurrentPalette } from '@/lib/chess/pieceColors';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Loader2, Sparkles, ShoppingBag, Gift, DollarSign, Crown, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore, CreativeModeTransfer } from '@/stores/sessionStore';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import { VisionaryMembershipCard } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import { recordVisionInteraction, getVisionScore, VisionScore } from '@/lib/visualizations/visionScoring';
import UnifiedVisionExperience, { ExportState } from '@/components/chess/UnifiedVisionExperience';
import { useVisualizationExport } from '@/hooks/useVisualizationExport';
import { 
  getListingById, 
  purchaseListing, 
  MarketplaceListing 
} from '@/lib/marketplace/marketplaceApi';
import { extractPaletteId, isPremiumPalette, getPaletteDisplayName } from '@/lib/marketplace/paletteArtMap';
import WalletPurchaseModal from '@/components/marketplace/WalletPurchaseModal';

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
    setCurrentSimulation,
    setSavedShareId,
  } = useSessionStore();
  const { setOrderData } = usePrintOrderStore();
  
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletPurchaseModal, setShowWalletPurchaseModal] = useState(false);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  
  const viewRecordedRef = useRef(false);

  // Export hook for HD/GIF downloads
  const { 
    downloadTrademarkHD,
    downloadGIF 
  } = useVisualizationExport({
    isPremium,
    visualizationId: listing?.visualization?.id,
    onUnauthorized: () => setShowAuthModal(true),
    onUpgradeRequired: () => setShowUpgradeModal(true),
  });

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
          
          // Fetch vision score
          getVisionScore(data.visualization.id).then(score => {
            if (score) setVisionScore(score);
          });
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

    // For free listings, use the direct claim flow
    if (listing.price_cents === 0) {
      setIsPurchasing(true);
      const { success, message, visualizationId, error } = await purchaseListing(listing.id);

      if (error) {
        toast.error('Claim failed', { description: error.message });
        setIsPurchasing(false);
        return;
      }

      if (success) {
        toast.success('Congratulations!', {
          description: message || 'Visualization added to your gallery!',
          action: visualizationId ? {
            label: 'View',
            onClick: () => navigate(`/my-vision/${visualizationId}`),
          } : undefined,
        });
        navigate('/my-vision');
      }
      setIsPurchasing(false);
      return;
    }

    // For paid listings, show wallet purchase modal
    setShowWalletPurchaseModal(true);
  };

  const handleWalletPurchaseSuccess = (visualizationId: string) => {
    navigate('/my-vision');
  };

  const handleShare = async () => {
    if (!listing?.visualization?.id) return;
    
    const vizData = listing.visualization as { id: string; title: string; image_path: string; game_data: Record<string, unknown>; pgn?: string; public_share_id?: string };
    const shareUrl = `${window.location.origin}/v/${vizData.public_share_id || vizData.id}`;
    
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

  // Handle exports (HD, GIF, Print)
  const handleExport = useCallback(async (type: 'hd' | 'gif' | 'print' | 'preview', exportState?: ExportState) => {
    if (!listing?.visualization) return;
    
    const vizData = getVisualizationData();
    if (!vizData) return;
    
    // Build filtered board based on export state
    const filteredBoard = exportState && exportState.currentMove < vizData.totalMoves && exportState.currentMove > 0
      ? vizData.board.map(row => 
          row.map(square => ({
            ...square,
            visits: square.visits.filter(visit => visit.moveNumber <= exportState.currentMove)
          }))
        )
      : vizData.board;
    
    // Build highlight state for rendering
    const highlightState = exportState?.lockedPieces && exportState.lockedPieces.length > 0 ? {
      lockedPieces: exportState.lockedPieces.map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
      })),
      compareMode: exportState.compareMode,
    } : undefined;
    
    if (type === 'preview') {
      // Preview download - uses SAME rendering as HD, but with watermark for free users
      try {
        const { generateCleanPrintImage } = await import('@/lib/chess/printImageGenerator');
        
        const exportSimulation = {
          board: filteredBoard,
          gameData: vizData.gameData,
          totalMoves: vizData.totalMoves,
        };
        
        const base64Image = await generateCleanPrintImage(exportSimulation, {
          darkMode: exportState?.darkMode || false,
          withWatermark: !isPremium, // Add watermark for free users
          highlightState,
        });
        
        // Convert base64 to blob for download
        const response = await fetch(base64Image);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${listing.visualization.title.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Preview downloaded!', {
          description: isPremium ? 'Full resolution image saved.' : 'Includes En Pensent branding.',
        });
      } catch (error) {
        console.error('Preview download failed:', error);
        toast.error('Download failed', { description: 'Please try again.' });
      }
      return;
    }
    
    if (type === 'hd') {
      downloadTrademarkHD({
        board: vizData.board,
        gameData: vizData.gameData,
        title: listing.visualization.title,
        darkMode: exportState?.darkMode || false,
      });
      return;
    }
    
    if (type === 'gif') {
      const simulation = { board: vizData.board, gameData: vizData.gameData, totalMoves: vizData.totalMoves };
      const captureElement = document.querySelector('[data-vision-board="true"]') as HTMLElement;
      if (captureElement) {
        downloadGIF(simulation, captureElement, listing.visualization.title);
      } else {
        toast.error('Unable to capture visualization');
      }
      return;
    }
    
    if (type === 'print') {
      // Save timeline state for restoration on return
      if (exportState) {
        setCapturedTimelineState({
          currentMove: exportState.currentMove,
          totalMoves: vizData.totalMoves,
          title: listing.visualization.title,
          lockedPieces: exportState.lockedPieces.map(p => ({
            pieceType: p.pieceType as PieceType,
            pieceColor: p.pieceColor as 'w' | 'b',
          })),
          compareMode: exportState.compareMode,
          darkMode: exportState.darkMode,
        });
      }
      
      // Save simulation to session store
      setCurrentSimulation({
        board: vizData.board,
        gameData: vizData.gameData,
        totalMoves: vizData.totalMoves,
      }, listing.visualization.pgn || '', listing.visualization.title);
      const vizDataCast = listing.visualization as { public_share_id?: string };
      setSavedShareId(vizDataCast.public_share_id || '');
      setReturningFromOrder(true);
      
      // Navigate to order print page
      const orderData: PrintOrderData = {
        visualizationId: listing.visualization.id,
        title: listing.visualization.title,
        imagePath: listing.visualization.image_path,
        gameData: {
          white: vizData.gameData.white,
          black: vizData.gameData.black,
          event: vizData.gameData.event,
          date: vizData.gameData.date,
          result: vizData.gameData.result,
        },
        simulation: {
          board: vizData.board,
          gameData: vizData.gameData,
          totalMoves: vizData.totalMoves,
        },
        shareId: vizDataCast.public_share_id,
        returnPath: `/marketplace/${id}`,
        capturedState: exportState ? {
          currentMove: exportState.currentMove,
          selectedPhase: 'all',
          lockedPieces: exportState.lockedPieces,
          compareMode: exportState.compareMode,
          displayMode: 'standard',
          darkMode: exportState.darkMode,
          showTerritory: false,
          showHeatmaps: false,
          capturedAt: new Date(),
        } : undefined,
      };
      setOrderData(orderData);
      navigate('/order-print');
    }
  }, [listing, downloadTrademarkHD, downloadGIF, navigate, setOrderData, setCapturedTimelineState, setCurrentSimulation, setSavedShareId, setReturningFromOrder, id]);

  const handleBack = () => {
    navigate('/marketplace');
  };

  // Reconstruct board and gameData from stored data
  const getVisualizationData = useCallback(() => {
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
  }, [listing]);

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

  // Header actions for marketplace
  const headerActions = (
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
          <>
            <Wallet className="h-3 w-3 mr-1" />
            {((listing?.price_cents || 0) / 100).toFixed(2)} Credits
          </>
        )}
      </Badge>
      
      {hasPremiumPalette && (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black">
          {getPaletteDisplayName(paletteId || '') || 'Premium'}
        </Badge>
      )}

      {/* Claim Ownership - Premium only */}
      {!isOwnListing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
                    <Wallet className="h-4 w-4" />
                    Buy with Credits
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">What is Ownership?</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Add this vision to your personal gallery</li>
                <li>• Exclusive digital ownership - only one owner per vision</li>
                <li>• Earn royalties when others order prints</li>
                <li>• Seller receives 95%, 5% supports Education Fund</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isOwnListing && (
        <Badge variant="outline" className="gap-1">
          <Crown className="h-3 w-3" />
          Your Listing
        </Badge>
      )}
    </div>
  );

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
          
          {headerActions}
        </div>

        {/* Premium required notice for ownership */}
        {!isPremium && user && !isOwnListing && (
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-sm text-amber-600">
              Premium membership required to claim ownership. <span className="text-muted-foreground">Anyone can order prints.</span>
            </span>
          </div>
        )}

        {/* Unified Vision Experience - providers are handled internally */}
        <UnifiedVisionExperience
          board={vizData.board}
          gameData={vizData.gameData}
          totalMoves={vizData.totalMoves}
          pgn={listing?.visualization?.pgn || ''}
          context="marketplace"
          defaultTab="analytics"
          visualizationId={listing?.visualization?.id}
          paletteId={vizData.paletteId}
          createdAt={listing?.created_at}
          title={listing?.visualization?.title}
          imageUrl={listing?.visualization?.image_path}
          onTransferToCreative={handleTransferToCreative}
          onShare={handleShare}
          onExport={handleExport}
          isPremium={isPremium}
          onUpgradePrompt={() => setShowUpgradeModal(true)}
          purchasePrice={listing?.price_cents}
          showPurchaseButton={!isOwnListing}
          onPurchase={handlePurchase}
          isPurchasing={isPurchasing}
          isOwner={isOwnListing}
          visionScoreData={visionScore ? {
            viewCount: visionScore.viewCount,
            uniqueViewers: visionScore.uniqueViewers,
            royaltyCentsEarned: visionScore.royaltyCentsEarned,
            royaltyOrdersCount: visionScore.royaltyOrdersCount,
            printRevenueCents: visionScore.printRevenueCents,
            printOrderCount: visionScore.printOrderCount,
            totalScore: visionScore.totalScore,
            downloadHdCount: visionScore.downloadHdCount,
            downloadGifCount: visionScore.downloadGifCount,
            tradeCount: visionScore.tradeCount,
          } : null}
        />
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

      {/* Wallet Purchase Modal for paid listings */}
      {listing && (
        <WalletPurchaseModal
          open={showWalletPurchaseModal}
          onOpenChange={setShowWalletPurchaseModal}
          listingId={listing.id}
          visualizationTitle={listing.visualization?.title || 'Vision'}
          priceCents={listing.price_cents}
          sellerName={listing.seller?.display_name || 'Collector'}
          onSuccess={handleWalletPurchaseSuccess}
        />
      )}
    </div>
  );
};

export default MarketplaceVisionDetail;