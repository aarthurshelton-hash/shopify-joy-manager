import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Gift, DollarSign, Loader2, Crown, Package, Shield, Palette, Sparkles, TrendingUp, Eye, Printer, ArrowRight } from 'lucide-react';
import { ListingsGridSkeleton } from '@/components/marketplace/MarketplaceSkeletons';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { VisionaryMembershipCard } from '@/components/premium';
import MarketplaceTransparency from '@/components/marketplace/MarketplaceTransparency';
import { MarketplaceFilters, SortOption, CategoryFilter } from '@/components/marketplace/MarketplaceFilters';
import { RotatingArtBackground } from '@/components/shared/RotatingArtBackground';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { BookShowcase } from '@/components/book/BookShowcase';
import { TrendingVisions } from '@/components/marketplace/TrendingVisions';
import { ClaimableVisionsSection } from '@/components/marketplace/ClaimableVisionsSection';
import { TransferLimitBadge } from '@/components/marketplace/TransferLimitBadge';
import EducationFundCard from '@/components/marketplace/EducationFundCard';
import { useSessionStore } from '@/stores/sessionStore';
import { usePrintOrderStore } from '@/stores/printOrderStore';
import { useMarketplaceRealtime } from '@/hooks/useMarketplaceRealtime';
import { useMarketplaceCache } from '@/hooks/useMarketplaceCache';
import { 
  getActiveListings, 
  completePurchase,
  MarketplaceListing 
} from '@/lib/marketplace/marketplaceApi';
import { trackMarketplaceClick } from '@/lib/analytics/marketplaceAnalytics';
import { isPremiumPalette, extractPaletteId, isThemedPalette, getPaletteArt, getPaletteDisplayName } from '@/lib/marketplace/paletteArtMap';
import { supabase } from '@/integrations/supabase/client';

const ITEMS_PER_PAGE = 20;

const Marketplace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const gameArtImages = useRandomGameArt(16);
  const { setOrderData } = usePrintOrderStore();
  const {
    returningFromOrder,
    capturedTimelineState,
    setReturningFromOrder,
    setCapturedTimelineState,
  } = useSessionStore();

  const handleOrderPrint = (e: React.MouseEvent, listing: MarketplaceListing) => {
    e.preventDefault();
    e.stopPropagation();
    const gameData = listing.visualization?.game_data as { white?: string; black?: string; event?: string; date?: string; result?: string } | null;
    setOrderData({
      title: listing.visualization?.title || 'Untitled Vision',
      imagePath: listing.visualization?.image_path,
      pgn: listing.visualization?.pgn || undefined,
      gameData: {
        white: gameData?.white || 'Unknown',
        black: gameData?.black || 'Unknown',
        event: gameData?.event,
        date: gameData?.date,
        result: gameData?.result,
      },
      returnPath: '/marketplace',
    });
    navigate('/order-print');
  };
  
  // Infinite scroll state
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalListings, setTotalListings] = useState(0);
  const [totalMarketVisions, setTotalMarketVisions] = useState(0);
  const [totalActiveListed, setTotalActiveListed] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  
  // Caching
  const cache = useMarketplaceCache();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [showGenesisOnly, setShowGenesisOnly] = useState(false);

  // Handle restoration toast when returning from order page
  useEffect(() => {
    if (returningFromOrder && capturedTimelineState) {
      const { currentMove, totalMoves, title } = capturedTimelineState;
      const titleText = title || 'Vision';
      const moveInfo = currentMove !== undefined && totalMoves !== undefined
        ? `Move ${currentMove} of ${totalMoves}`
        : currentMove !== undefined
        ? `Move ${currentMove}`
        : 'Your marketplace view is ready';
      
      toast.success(`${titleText} restored!`, {
        description: moveInfo,
        icon: <Sparkles className="w-4 h-4" />,
      });
      
      // Clear the flags
      setReturningFromOrder(false);
      setCapturedTimelineState(null);
    }
  }, [returningFromOrder, capturedTimelineState, setReturningFromOrder, setCapturedTimelineState]);

  // Fetch total market visions (including private) and total active listings
  useEffect(() => {
    const fetchCounts = async () => {
      // Fetch total visions (all saved visualizations)
      const { count: visionsCount, error: visionsError } = await supabase
        .from('saved_visualizations')
        .select('*', { count: 'exact', head: true });
      
      if (!visionsError && visionsCount !== null) {
        setTotalMarketVisions(visionsCount);
      }

      // Fetch total active listings
      const { count: listingsCount, error: listingsError } = await supabase
        .from('visualization_listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (!listingsError && listingsCount !== null) {
        setTotalActiveListed(listingsCount);
      }
    };
    fetchCounts();
  }, []);

  // Load initial listings with cache support
  const loadInitialListings = useCallback(async () => {
    // Check cache first
    const cachedListings = cache.getAllCachedListings();
    const cachedTotal = cache.getCachedTotalCount();
    
    if (cache.isCacheFresh() && cachedListings.length > 0) {
      setListings(cachedListings);
      setTotalListings(cachedTotal || cachedListings.length);
      setHasMore(cachedListings.length < (cachedTotal || 0));
      setCurrentPage(Math.ceil(cachedListings.length / ITEMS_PER_PAGE));
      setIsLoading(false);
      return;
    }

    // If stale but usable, show cached data while fetching
    if (cache.isCacheStale() && cachedListings.length > 0) {
      setListings(cachedListings);
      setTotalListings(cachedTotal || cachedListings.length);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const { data, total, hasMore: more, error } = await getActiveListings({ 
      page: 1, 
      limit: ITEMS_PER_PAGE 
    });
    
    if (error) {
      toast.error('Failed to load marketplace');
    } else {
      setListings(data);
      setTotalListings(total);
      setHasMore(more);
      setCurrentPage(1);
      
      // Update cache
      cache.cacheListingsPage(1, data);
      cache.cacheTotalCount(total);
    }
    setIsLoading(false);
  }, [cache]);

  // Load more listings for infinite scroll
  const loadMoreListings = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoadingMore(true);
    
    const nextPage = currentPage + 1;
    
    // Check cache first
    const cachedPage = cache.getCachedPage(nextPage);
    if (cachedPage && cachedPage.length > 0) {
      setListings(prev => [...prev, ...cachedPage]);
      setCurrentPage(nextPage);
      setHasMore(listings.length + cachedPage.length < totalListings);
      setIsLoadingMore(false);
      loadingRef.current = false;
      return;
    }
    
    const { data, hasMore: more, error } = await getActiveListings({ 
      page: nextPage, 
      limit: ITEMS_PER_PAGE 
    });
    
    if (error) {
      toast.error('Failed to load more listings');
    } else {
      setListings(prev => [...prev, ...data]);
      setHasMore(more);
      setCurrentPage(nextPage);
      
      // Update cache
      cache.cacheListingsPage(nextPage, data);
    }
    
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [currentPage, hasMore, listings.length, totalListings, cache]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreListings();
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMoreListings]);

  // Real-time updates for marketplace listings
  useMarketplaceRealtime({
    onListingChange: (payload) => {
      if (payload.eventType === 'INSERT') {
        // Prepend new listing
        loadInitialListings();
      } else if (payload.eventType === 'UPDATE') {
        // Update existing listing in cache and state
        const updated = payload.new as MarketplaceListing;
        cache.updateCachedListing(updated.id, updated);
        setListings(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
      } else if (payload.eventType === 'DELETE') {
        // Remove from cache and state
        const deleted = payload.old as { id: string };
        cache.invalidateListing(deleted.id);
        setListings(prev => prev.filter(l => l.id !== deleted.id));
      }
    },
    enabled: true,
  });

  useEffect(() => {
    loadInitialListings();
  }, [loadInitialListings]);

  // Refresh listings helper
  const refreshListings = useCallback(() => {
    cache.clearCache();
    loadInitialListings();
  }, [cache, loadInitialListings]);

  // Handle successful purchase redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const listingId = searchParams.get('listing');

    if (success === 'true' && listingId) {
      handlePurchaseComplete(listingId);
    }
  }, [searchParams]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((listing) => {
        const title = listing.visualization?.title?.toLowerCase() || '';
        const seller = listing.seller?.display_name?.toLowerCase() || '';
        const gameData = listing.visualization?.game_data as any;
        const white = gameData?.white?.toLowerCase() || '';
        const black = gameData?.black?.toLowerCase() || '';
        
        return title.includes(query) || 
               seller.includes(query) || 
               white.includes(query) || 
               black.includes(query);
      });
    }

    // Category filter
    if (category === 'genesis') {
      result = result.filter((l) => l.visualization?.title?.includes('Exemplar'));
    } else if (category === 'free') {
      result = result.filter((l) => l.price_cents === 0);
    } else if (category === 'paid') {
      result = result.filter((l) => l.price_cents > 0);
    }

    // Genesis only toggle (overrides category if set)
    if (showGenesisOnly) {
      result = result.filter((l) => l.visualization?.title?.includes('Exemplar'));
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'name':
          return (a.visualization?.title || '').localeCompare(b.visualization?.title || '');
        case 'score':
          // Would need vision scores loaded - for now sort by price as proxy
          return b.price_cents - a.price_cents;
        default:
          return 0;
      }
    });

    return result;
  }, [listings, searchQuery, sortBy, category, showGenesisOnly]);

  const handlePurchaseComplete = async (listingId: string) => {
    const { success, message, visualizationId, error } = await completePurchase(listingId);

    if (error) {
      toast.error('Transfer failed', { description: error.message });
    } else if (success) {
      toast.success('Congratulations!', { 
        description: message || 'Visualization added to your gallery!',
        action: visualizationId ? {
          label: 'View',
          onClick: () => navigate(`/my-vision/${visualizationId}`),
        } : undefined,
      });
      refreshListings();
      // Clear URL params
      navigate('/marketplace', { replace: true });
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Rotating Background */}
      <section className="relative border-b border-border/40 overflow-hidden" style={{ isolation: 'isolate' }}>
        <RotatingArtBackground opacity={0.1} interval={10000} imageCount={12} />
        
        {/* Content must be above background with higher z-index */}
        <div className="relative container mx-auto px-4 py-8 sm:py-12" style={{ zIndex: 1 }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Marketplace</h1>
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Vision Exchange</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 self-start sm:self-center sm:ml-4 bg-card/50 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5" />
              0% Commission
            </Badge>
          </div>
          
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            Discover and collect unique chess visualizations from fellow visionaries. 
            Each visualization can only be owned by one collector at a time.
            <span className="text-primary font-medium block sm:inline sm:ml-1">
              You own 100% of the value.
            </span>
          </p>
          
          {!isPremium && user && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-600">
                Premium membership required to claim ownership. <span className="text-muted-foreground">Anyone can order prints.</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Content with Tabs */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="mb-6 bg-card/50 border border-border/50">
            <TabsTrigger value="browse" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my-listings" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">My Listings</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="transparency" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">How It Works</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Claimable Visions Section */}
            <ClaimableVisionsSection onClaim={refreshListings} />

            {/* Trending Visions by Royalty Activity */}
            <TrendingVisions />

            {/* Featured Book Showcase */}
            <BookShowcase variant="compact" />

            {/* Filters */}
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              category={category}
              onCategoryChange={setCategory}
              showGenesisOnly={showGenesisOnly}
              onGenesisToggle={setShowGenesisOnly}
              totalResults={totalActiveListed}
              totalMarketVisions={totalMarketVisions}
            />

            {/* Listings Grid */}
            {isLoading ? (
              <ListingsGridSkeleton count={8} />
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-medium text-muted-foreground mb-2">
                  {searchQuery || category !== 'all' ? 'No matching visions' : 'No listings yet'}
                </h2>
                <p className="text-muted-foreground/70">
                  {searchQuery || category !== 'all' 
                    ? 'Try adjusting your filters or search query'
                    : 'Be the first to list a visualization for sale or gift!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredListings.map((listing, index) => {
                  const paletteId = extractPaletteId(listing.visualization?.game_data);
                  const hasPremiumPalette = isPremiumPalette(paletteId);
                  const hasThemedPalette = isThemedPalette(paletteId);
                  const paletteArt = getPaletteArt(paletteId);
                  const paletteName = getPaletteDisplayName(paletteId);
                  const backgroundImage = paletteArt || gameArtImages[index % gameArtImages.length];

                  return (
                    <a 
                      key={listing.id}
                      href={`/marketplace/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block animate-fade-in"
                      onClick={() => trackMarketplaceClick({
                        click_type: 'listing_card',
                        listing_id: listing.id,
                        visualization_id: listing.visualization?.id,
                        section: 'browse_grid',
                      })}
                    >
                        <Card 
                          className={`overflow-hidden group hover:shadow-xl transition-all duration-300 relative cursor-pointer ${
                            hasPremiumPalette
                              ? 'border-amber-500/50 ring-1 ring-amber-500/20 hover:ring-amber-500/40'
                              : hasThemedPalette
                                ? 'border-primary/30 ring-1 ring-primary/10 hover:ring-primary/30'
                                : 'border-border/50'
                          }`}
                        >
                        {/* Premium Shimmer Effect */}
                        {hasPremiumPalette && (
                          <div 
                            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.15) 25%, rgba(251, 191, 36, 0.3) 50%, rgba(251, 191, 36, 0.15) 75%, transparent 100%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 2s linear infinite',
                              zIndex: 1,
                            }}
                          />
                        )}
                        
                        {/* Image */}
                        <div className="aspect-square relative overflow-hidden bg-muted">
                          {listing.visualization?.image_path ? (
                            <img
                              src={listing.visualization.image_path}
                              alt={listing.visualization.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                        {/* Premium Palette Badge with glow */}
                        {hasPremiumPalette && (
                          <Badge 
                            className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black gap-1 shadow-lg shadow-amber-500/30 pointer-events-none"
                          >
                            <Palette className="h-3 w-3" />
                            Premium Palette
                          </Badge>
                        )}
                        
                        {/* Transfer Limit Badge */}
                        {listing.visualization?.id && (
                          <div className="absolute bottom-3 right-3 pointer-events-none">
                            <TransferLimitBadge 
                              visualizationId={listing.visualization.id} 
                              variant="compact" 
                            />
                          </div>
                        )}
                        
                        {/* Exemplar Badge */}
                        {listing.visualization?.title?.includes('Exemplar') && (
                          <Badge 
                            className="absolute top-3 left-3 bg-amber-500/90 hover:bg-amber-500 text-black pointer-events-none"
                          >
                            🏆 Genesis
                          </Badge>
                        )}
                        
                        {/* Price Badge */}
                        <Badge 
                          className={`absolute top-3 right-3 pointer-events-none ${
                            listing.price_cents === 0 
                              ? 'bg-green-500/90 hover:bg-green-500' 
                              : 'bg-primary/90 hover:bg-primary'
                          }`}
                        >
                          {listing.price_cents === 0 ? (
                            <><Gift className="h-3 w-3 mr-1" /> Free</>
                          ) : (
                            <><DollarSign className="h-3 w-3 mr-0.5" />{(listing.price_cents / 100).toFixed(2)}</>
                          )}
                        </Badge>

                          {/* Hover overlay to view details */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </div>
                          </div>
                        </div>

                        <CardContent 
                          className={`p-3 sm:p-4 relative overflow-hidden transition-all duration-300 group/content ${
                            hasPremiumPalette ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5' : ''
                          }`}
                          style={{
                            backgroundImage: `linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / ${hasPremiumPalette ? '0.82' : hasThemedPalette ? '0.88' : '0.92'}) 100%), url(${backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          title={paletteName ? `${paletteName} Palette` : undefined}
                        >
                        {/* Palette name tooltip on hover */}
                        {paletteName && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover/content:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-1.5 py-0.5 ${
                                hasPremiumPalette 
                                  ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-black border-0' 
                                  : 'bg-card/90 backdrop-blur-sm'
                              }`}
                            >
                              <Palette className="h-2.5 w-2.5 mr-1" />
                              {paletteName}
                            </Badge>
                          </div>
                        )}
                          
                          <h3 className="font-semibold truncate mb-1 text-sm sm:text-base relative z-10">
                            {listing.visualization?.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center justify-between relative z-10 mb-2">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              by {listing.seller?.display_name || 'Anonymous'}
                            </p>
                            {/* Vision Score indicator or Premium Palette indicator */}
                            {hasPremiumPalette ? (
                              <div className="flex items-center gap-1 text-xs text-amber-500" title={`Uses the ${paletteName} premium palette`}>
                                <Palette className="h-3 w-3" />
                                <span className="hidden sm:inline">Premium</span>
                              </div>
                            ) : hasThemedPalette ? (
                              <div className="flex items-center gap-1 text-xs text-primary/70" title={`Uses the ${paletteName} palette`}>
                                <Palette className="h-3 w-3" />
                                <span className="hidden sm:inline">Themed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Vision Score contributes to value">
                                <TrendingUp className="h-3 w-3" />
                                <span>Tracked</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Order Print CTA - Available to everyone */}
                          <button
                            onClick={(e) => handleOrderPrint(e, listing)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                              border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/10
                              hover:from-amber-500/20 hover:to-amber-600/20 hover:border-amber-500/50
                              text-amber-700 dark:text-amber-400 transition-all relative z-10"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Order Print
                          </button>
                        </CardContent>
                      </Card>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
              <div 
                ref={sentinelRef}
                className="flex items-center justify-center py-8"
              >
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading more visions...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* End of listings indicator */}
            {!hasMore && listings.length > 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                You've seen all {totalListings} visions
              </div>
            )}
          </TabsContent>

          {/* My Listings Tab - Redirects to unified My Vision gallery */}
          {user && (
            <TabsContent value="my-listings">
              <div className="text-center py-12 px-4 max-w-md mx-auto">
                <Package className="h-12 w-12 mx-auto text-primary/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Manage Your Visions</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  View all your visions, list them for sale, gift them, or manage existing listings from your unified Vision Gallery.
                </p>
                <Button
                  onClick={() => navigate('/my-vision')}
                  className="gap-2"
                >
                  Go to My Vision Gallery
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Transparency Tab */}
          <TabsContent value="transparency" className="space-y-6">
            <MarketplaceTransparency />
            <EducationFundCard />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <VisionaryMembershipCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onAuthRequired={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
        trigger="marketplace"
      />
    </div>
  );
};

export default Marketplace;
