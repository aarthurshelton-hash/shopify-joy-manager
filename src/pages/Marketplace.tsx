import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Gift, DollarSign, Loader2, Crown, Package, Shield, TrendingUp, Eye, BookOpen, Palette } from 'lucide-react';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { VisionaryMembershipCard } from '@/components/premium';
import MyListingsSection from '@/components/marketplace/MyListingsSection';
import MarketplaceTransparency from '@/components/marketplace/MarketplaceTransparency';
import VisionExperienceModal from '@/components/marketplace/VisionExperienceModal';
import { MarketplaceFilters, SortOption, CategoryFilter } from '@/components/marketplace/MarketplaceFilters';
import { RotatingArtBackground } from '@/components/shared/RotatingArtBackground';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { BookShowcase } from '@/components/book/BookShowcase';
import { 
  getActiveListings, 
  purchaseListing, 
  completePurchase,
  MarketplaceListing 
} from '@/lib/marketplace/marketplaceApi';
import { getPaletteArt, isPremiumPalette, extractPaletteId } from '@/lib/marketplace/paletteArtMap';

const Marketplace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const gameArtImages = useRandomGameArt(16); // For listing card backgrounds
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [showGenesisOnly, setShowGenesisOnly] = useState(false);

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getActiveListings();
    if (error) {
      toast.error('Failed to load marketplace');
    } else {
      setListings(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

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
    setPurchasingId(listingId);
    const { success, message, visualizationId, error } = await completePurchase(listingId);
    setPurchasingId(null);

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
      loadListings();
      // Clear URL params
      navigate('/marketplace', { replace: true });
    }
  };

  const handlePurchase = async (listing: MarketplaceListing) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setPurchasingId(listing.id);
    const { url, success, message, visualizationId, error } = await purchaseListing(listing.id);

    if (error) {
      toast.error('Purchase failed', { description: error.message });
      setPurchasingId(null);
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
      loadListings();
      setPurchasingId(null);
      return;
    }

    // Paid - redirect to Stripe
    if (url) {
      window.open(url, '_blank');
      setPurchasingId(null);
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
      <div className="relative border-b border-border/40 overflow-hidden">
        <RotatingArtBackground opacity={0.1} interval={10000} imageCount={12} />
        
        <div className="relative container mx-auto px-4 py-8 sm:py-12">
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
              <span className="text-sm text-amber-600">Premium membership required to purchase visualizations</span>
            </div>
          )}
        </div>
      </div>

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
              totalResults={filteredListings.length}
            />

            {/* Listings Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
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
                {filteredListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={`overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer ${
                        isPremiumPalette(extractPaletteId(listing.visualization?.game_data))
                          ? 'border-amber-500/50 ring-1 ring-amber-500/20 hover:ring-amber-500/40'
                          : 'border-border/50'
                      }`}
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowDetailModal(true);
                      }}
                    >
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
                        
                        {/* Premium Palette Badge */}
                        {isPremiumPalette(extractPaletteId(listing.visualization?.game_data)) && (
                          <Badge 
                            className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black gap-1"
                          >
                            <Palette className="h-3 w-3" />
                            Premium Palette
                          </Badge>
                        )}
                        
                        {/* Exemplar Badge */}
                        {listing.visualization?.title?.includes('Exemplar') && (
                          <Badge 
                            className="absolute top-3 left-3 bg-amber-500/90 hover:bg-amber-500 text-black"
                          >
                            🏆 Genesis
                          </Badge>
                        )}
                        
                        {/* Price Badge */}
                        <Badge 
                          className={`absolute top-3 right-3 ${
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>

                      {(() => {
                        const paletteId = extractPaletteId(listing.visualization?.game_data);
                        const paletteArt = getPaletteArt(paletteId);
                        const hasPremiumPalette = isPremiumPalette(paletteId);
                        const backgroundImage = paletteArt || gameArtImages[index % gameArtImages.length];
                        
                        return (
                          <CardContent 
                            className={`p-3 sm:p-4 relative overflow-hidden transition-all duration-300 ${
                              hasPremiumPalette ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5' : ''
                            }`}
                            style={{
                              backgroundImage: `linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / ${hasPremiumPalette ? '0.85' : '0.92'}) 100%), url(${backgroundImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <h3 className="font-semibold truncate mb-1 text-sm sm:text-base relative z-10">
                              {listing.visualization?.title || 'Untitled'}
                            </h3>
                            <div className="flex items-center justify-between relative z-10">
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                by {listing.seller?.display_name || 'Anonymous'}
                              </p>
                              {/* Vision Score indicator or Premium Palette indicator */}
                              {hasPremiumPalette ? (
                                <div className="flex items-center gap-1 text-xs text-amber-500" title="Uses a premium color palette">
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
                          </CardContent>
                        );
                      })()}

                      <CardFooter className="p-3 sm:p-4 pt-0 flex gap-2">
                        <Button
                          className="flex-1 text-sm"
                          variant={listing.price_cents === 0 ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(listing);
                          }}
                          disabled={purchasingId === listing.id || listing.seller_id === user?.id}
                        >
                          {purchasingId === listing.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : listing.seller_id === user?.id ? (
                            'Your Listing'
                          ) : listing.price_cents === 0 ? (
                            'Claim Gift'
                          ) : (
                            formatPrice(listing.price_cents)
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListing(listing);
                            setShowDetailModal(true);
                          }}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Listings Tab */}
          {user && (
            <TabsContent value="my-listings">
              <MyListingsSection userId={user.id} onListingChange={loadListings} />
            </TabsContent>
          )}

          {/* Transparency Tab */}
          <TabsContent value="transparency">
            <MarketplaceTransparency />
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
      <VisionExperienceModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedListing(null);
        }}
        listing={selectedListing}
        onPurchase={handlePurchase}
        isPurchasing={purchasingId === selectedListing?.id}
        isOwnListing={selectedListing?.seller_id === user?.id}
        isPremium={isPremium}
      />
    </div>
  );
};

export default Marketplace;
