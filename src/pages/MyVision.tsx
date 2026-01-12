import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserVisualizations, deleteVisualization, SavedVisualization } from '@/lib/visualizations/visualizationStorage';
import { migrateUserVisualizations } from '@/lib/visualizations/migrateVisualization';
import { checkVisualizationListed } from '@/lib/marketplace/marketplaceApi';
import { validatePremiumDownload } from '@/lib/premium/validatePremiumDownload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Crown, Trash2, Download, Image as ImageIcon, Loader2, Link2, ExternalLink, Sparkles, Printer, RefreshCw, ShoppingBag, Tag, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { OrderPrintButton } from '@/components/shop/OrderPrintButton';
import { VisionaryMembershipCard, SubscriptionManagement } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import ListForSaleModal from '@/components/marketplace/ListForSaleModal';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { useSessionStore } from '@/stores/sessionStore';

const MyVision: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { setOrderData } = usePrintOrderStore();
  const { 
    setCurrentSimulation, 
    setSavedShareId, 
    setReturningFromOrder,
    returningFromOrder,
    capturedTimelineState,
    setCapturedTimelineState,
  } = useSessionStore();
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedVisualization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [listingTarget, setListingTarget] = useState<SavedVisualization | null>(null);
  const [listedIds, setListedIds] = useState<Set<string>>(new Set());
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Handle restoration toast when returning from order page
  useEffect(() => {
    if (returningFromOrder && capturedTimelineState) {
      const { currentMove } = capturedTimelineState;
      const moveInfo = currentMove !== undefined 
        ? `Move ${currentMove} restored`
        : 'Your gallery is ready';
      
      toast.success('Welcome back!', {
        description: moveInfo,
        icon: <Sparkles className="w-4 h-4" />,
      });
      
      // Clear the flags
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

  useEffect(() => {
    if (user && isPremium) {
      loadVisualizations();
    } else {
      setIsLoading(false);
    }
  }, [user, isPremium]);

  const loadVisualizations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await getUserVisualizations(user.id);
    
    if (error) {
      toast.error('Failed to load visualizations', { description: error.message });
    } else {
      setVisualizations(data);
      
      // Check which visualizations are listed
      const listedSet = new Set<string>();
      for (const viz of data) {
        const { isListed } = await checkVisualizationListed(viz.id);
        if (isListed) listedSet.add(viz.id);
      }
      setListedIds(listedSet);
      
      // Check if any visualizations need migration (missing board data)
      const needsMigration = data.some(v => !v.game_data.board || !Array.isArray(v.game_data.board));
      if (needsMigration && data.length > 0) {
        // Auto-migrate in the background
        handleMigration();
      }
    }
    
    setIsLoading(false);
  };

  const handleMigration = async () => {
    if (!user || isMigrating) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateUserVisualizations(user.id);
      
      if (result.migrated > 0) {
        toast.success(`Updated ${result.migrated} visualization(s)`, {
          description: 'Your saved games now support full interactivity',
        });
        // Reload visualizations to get updated data
        const { data } = await getUserVisualizations(user.id);
        if (data) setVisualizations(data);
      }
      
      if (result.failed > 0) {
        console.warn('Migration failures:', result.errors);
      }
    } catch (err) {
      console.error('Migration error:', err);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    const { error } = await deleteVisualization(deleteTarget.id, deleteTarget.image_path);
    
    if (error) {
      toast.error('Failed to delete visualization', { description: error.message });
    } else {
      setVisualizations(prev => prev.filter(v => v.id !== deleteTarget.id));
      toast.success('Visualization deleted');
    }
    
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleDownload = async (visualization: SavedVisualization) => {
    setIsDownloading(visualization.id);
    
    try {
      // Server-side premium validation before allowing HD download
      const validation = await validatePremiumDownload();
      
      if (!validation.allowed) {
        toast.error('Premium Required', {
          description: validation.message || 'Upgrade to Premium for HD downloads',
        });
        setShowVisionaryModal(true);
        return;
      }

      const response = await fetch(visualization.image_path);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization.title.replace(/[^a-z0-9]/gi, '-')}.png`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCopyShareLink = async (shareId: string | null) => {
    if (!shareId) {
      toast.error('Share link not available');
      return;
    }
    
    const url = `${window.location.origin}/v/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied!', { description: url });
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleViewPublicPage = (shareId: string | null) => {
    if (!shareId) return;
    window.open(`/v/${shareId}`, '_blank');
  };

  const handleOrderPrint = (viz: SavedVisualization) => {
    // Reconstruct simulation from saved visualization data
    const storedData = viz.game_data;
    const board = storedData.board || 
      Array(8).fill(null).map((_, rank) =>
        Array(8).fill(null).map((_, file) => ({
          file,
          rank,
          visits: [],
          isLight: (file + rank) % 2 === 1,
        }))
      );
    
    const gameData = {
      white: storedData.white || 'White',
      black: storedData.black || 'Black',
      event: storedData.event || '',
      date: storedData.date || '',
      result: storedData.result || '',
      pgn: storedData.pgn || viz.pgn || '',
      moves: storedData.moves || [],
    };
    
    const simulation = {
      board,
      gameData,
      totalMoves: storedData.totalMoves || storedData.moves?.length || 0,
    };
    
    // Save to session store for restoration on return
    setCurrentSimulation(simulation, viz.pgn || '', viz.title);
    setSavedShareId(viz.public_share_id || null);
    setReturningFromOrder(true);
    
    setOrderData({
      visualizationId: viz.id,
      imagePath: viz.image_path,
      title: viz.title,
      pgn: viz.pgn || undefined,
      gameData: {
        white: viz.game_data.white,
        black: viz.game_data.black,
        event: viz.game_data.event,
        date: viz.game_data.date,
        result: viz.game_data.result,
      },
      // Include reconstructed simulation for print rendering
      simulation,
      shareId: viz.public_share_id,
      returnPath: '/my-vision',
    });
    navigate('/order-print');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">My Vision Gallery</h1>
            <p className="text-muted-foreground">
              Sign in to access your personal gallery of saved chess visualizations.
            </p>
            <Button onClick={() => setShowVisionaryModal(true)} className="btn-luxury">
              Sign In to Continue
            </Button>
          </div>
          
          <VisionaryMembershipCard
            isOpen={showVisionaryModal}
            onClose={() => setShowVisionaryModal(false)}
            onAuthRequired={() => {
              setShowVisionaryModal(false);
              setShowAuthModal(true);
            }}
            trigger="save"
          />
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
        <Footer />
      </div>
    );
  }

  // Not premium - show gallery preview with upgrade prompt
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-display font-bold">Unlock My Vision Gallery</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Save your chess visualizations to a personal gallery. Download them anytime, 
                share with unique QR codes, and build your collection of chess art.
              </p>
            </div>
            
            {/* Feature highlights */}
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-lg bg-card border border-border/50">
                <Download className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-sm">Unlimited Downloads</h3>
                <p className="text-xs text-muted-foreground">HD images, no watermarks</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border/50">
                <Link2 className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-sm">Shareable Links</h3>
                <p className="text-xs text-muted-foreground">Unique QR codes for prints</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border/50">
                <ImageIcon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-sm">Personal Gallery</h3>
                <p className="text-xs text-muted-foreground">All your art in one place</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowVisionaryModal(true)}
              className="btn-luxury gap-2"
              size="lg"
            >
              <Crown className="h-5 w-5" />
              Become a Visionary
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
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-display font-bold">My Vision Gallery</h1>
            </div>
            <div className="flex items-center gap-2">
              {isMigrating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMigration}
                    disabled={isMigrating || visualizations.length === 0}
                    className="gap-2"
                    title="Refresh and re-process any failed visualizations"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubscriptionPanel(!showSubscriptionPanel)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Subscription
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            Your saved chess visualizations, ready to download anytime.
          </p>
        </div>

        {/* Subscription Management Panel */}
        {showSubscriptionPanel && (
          <div className="mb-8 max-w-md">
            <SubscriptionManagement />
          </div>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : visualizations.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-medium">No visualizations yet</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Create a chess visualization and save it to your gallery to see it here.
            </p>
            <Button onClick={() => navigate('/')} className="btn-luxury mt-4">
              Create Your First Visualization
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visualizations.map((viz) => (
              <Card 
                key={viz.id} 
                className="overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                onClick={() => navigate(`/my-vision/${viz.id}`)}
              >
                <div className="relative aspect-square">
                  <img
                    src={viz.image_path}
                    alt={viz.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap p-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/my-vision/${viz.id}`);
                      }}
                      className="gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(viz);
                      }}
                      className="gap-1"
                      disabled={isDownloading === viz.id}
                    >
                      {isDownloading === viz.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderPrint(viz);
                      }}
                      className="gap-1 bg-gradient-to-r from-amber-500/80 to-amber-600/80 hover:from-amber-500 hover:to-amber-600 text-stone-900"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    {!listedIds.has(viz.id) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListingTarget(viz);
                        }}
                        className="gap-1"
                      >
                        <Tag className="h-4 w-4" />
                        Sell
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(viz);
                      }}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {listedIds.has(viz.id) && (
                    <Badge className="absolute top-2 left-2 bg-green-500/90">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      Listed
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium truncate">{viz.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {viz.game_data.white} vs {viz.game_data.black}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(viz.created_at).toLocaleDateString()}
                    </p>
                    {viz.public_share_id && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyShareLink(viz.public_share_id);
                          }}
                          title="Copy share link"
                        >
                          <Link2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPublicPage(viz.public_share_id);
                          }}
                          title="View public page"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visualization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" from your gallery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* List for Sale Modal */}
      {listingTarget && (
        <ListForSaleModal
          isOpen={!!listingTarget}
          onClose={() => setListingTarget(null)}
          visualizationId={listingTarget.id}
          visualizationTitle={listingTarget.title}
          onSuccess={() => {
            loadVisualizations();
          }}
        />
      )}
      
      {/* Visionary Membership Modal */}
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={() => {
          setShowVisionaryModal(false);
          setShowAuthModal(true);
        }}
        trigger="save"
      />
      
      <Footer />
    </div>
  );
};

export default MyVision;
