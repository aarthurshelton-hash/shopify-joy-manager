import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, DollarSign, Gift, Loader2, Edit2, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  getUserListings,
  cancelListing,
  updateListingPrice,
  MarketplaceListing,
} from '@/lib/marketplace/marketplaceApi';
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

interface MyListingsSectionProps {
  userId: string;
  onListingChange?: () => void;
}

const MyListingsSection: React.FC<MyListingsSectionProps> = ({ userId, onListingChange }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, [userId]);

  const loadListings = async () => {
    setIsLoading(true);
    const { data, error } = await getUserListings(userId);
    if (error) {
      toast.error('Failed to load your listings');
    } else {
      // Only show active listings in "My Listings"
      setListings(data.filter(l => l.status === 'active'));
    }
    setIsLoading(false);
  };

  const handleStartEdit = (listing: MarketplaceListing) => {
    setEditingId(listing.id);
    setEditPrice((listing.price_cents / 100).toString());
  };

  const handleSavePrice = async (listingId: string) => {
    const priceCents = Math.round(parseFloat(editPrice) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSavingId(listingId);
    const { error } = await updateListingPrice(listingId, priceCents);
    setSavingId(null);

    if (error) {
      toast.error('Failed to update price');
    } else {
      toast.success('Price updated');
      setEditingId(null);
      loadListings();
      onListingChange?.();
    }
  };

  const handleCancelListing = async () => {
    if (!cancelDialogId) return;
    
    setSavingId(cancelDialogId);
    const { error } = await cancelListing(cancelDialogId);
    setSavingId(null);
    setCancelDialogId(null);

    if (error) {
      toast.error('Failed to cancel listing');
    } else {
      toast.success('Listing cancelled');
      loadListings();
      onListingChange?.();
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free Gift';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg">
        <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">
          You don't have any active listings.
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Go to My Vision to list visualizations for sale or gift.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {listing.visualization?.image_path ? (
                    <img
                      src={listing.visualization.image_path}
                      alt={listing.visualization.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      listing.price_cents === 0 
                        ? 'bg-green-500/90' 
                        : 'bg-primary/90'
                    }`}
                  >
                    {listing.price_cents === 0 ? (
                      <><Gift className="h-3 w-3 mr-1" /> Gift</>
                    ) : (
                      <><DollarSign className="h-3 w-3 mr-0.5" />{(listing.price_cents / 100).toFixed(0)}</>
                    )}
                  </Badge>
                </div>

                <CardContent className="p-3">
                  <h4 className="font-medium text-sm truncate">
                    {listing.visualization?.title || 'Untitled'}
                  </h4>
                  
                  {/* Price Editor */}
                  {editingId === listing.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="h-8 pl-6 text-sm"
                          placeholder="0 for free"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSavePrice(listing.id)}
                        disabled={savingId === listing.id}
                      >
                        {savingId === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPrice(listing.price_cents)}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="p-3 pt-0 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleStartEdit(listing)}
                    disabled={editingId === listing.id}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit Price
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setCancelDialogId(listing.id)}
                    disabled={savingId === listing.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/v/${listing.visualization?.id}`)}
                    title="View details"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelDialogId} onOpenChange={(open) => !open && setCancelDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your visualization from the marketplace. You can list it again later from your My Vision gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Listed</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyListingsSection;
