import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Gift, DollarSign, Loader2, ExternalLink, Crown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { PremiumUpgradeModal } from '@/components/premium';
import MyListingsSection from '@/components/marketplace/MyListingsSection';
import { 
  getActiveListings, 
  purchaseListing, 
  completePurchase,
  MarketplaceListing 
} from '@/lib/marketplace/marketplaceApi';

const Marketplace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Marketplace</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Discover and collect unique chess visualizations from other premium members. 
            Each visualization can only be owned by one collector at a time.
          </p>
          {!isPremium && user && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-amber-600">Premium membership required to purchase visualizations</span>
            </div>
          )}
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my-listings" className="gap-2">
                <Package className="h-4 w-4" />
                My Listings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-medium text-muted-foreground mb-2">No listings yet</h2>
                <p className="text-muted-foreground/70">
                  Be the first to list a visualization for sale or gift!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
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
                            <><DollarSign className="h-3 w-3 mr-0.5" />{(listing.price_cents / 100).toFixed(0)}</>
                          )}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate mb-1">
                          {listing.visualization?.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {listing.seller?.display_name || 'Anonymous'}
                        </p>
                      </CardContent>

                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button
                          className="flex-1"
                          variant={listing.price_cents === 0 ? "default" : "outline"}
                          onClick={() => handlePurchase(listing)}
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
                          onClick={() => navigate(`/v/${listing.visualization?.id}`)}
                          title="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
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
        </Tabs>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onAuthRequired={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
        trigger="save"
      />
    </div>
  );
};

export default Marketplace;