import React, { useState } from 'react';
import { Gift, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { createListing } from '@/lib/marketplace/marketplaceApi';
import { z } from 'zod';

// Validation schema for listing price
const listingPriceSchema = z.object({
  priceCents: z.number()
    .int('Price must be a whole number of cents')
    .min(0, 'Price cannot be negative')
    .max(1000000, 'Maximum price is $10,000') // $10,000 max
});

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationId: string;
  visualizationTitle: string;
  onSuccess?: () => void;
}

const ListForSaleModal: React.FC<ListForSaleModalProps> = ({
  isOpen,
  onClose,
  visualizationId,
  visualizationTitle,
  onSuccess,
}) => {
  const [listingType, setListingType] = useState<'free' | 'paid'>('free');
  const [priceUsd, setPriceUsd] = useState('5.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setPriceError(null);

    const priceCents = listingType === 'free' ? 0 : Math.round(parseFloat(priceUsd) * 100);

    // Validate with zod schema
    const validation = listingPriceSchema.safeParse({ priceCents });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid price';
      setPriceError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
      return;
    }

    if (listingType === 'paid' && (isNaN(priceCents) || priceCents < 100)) {
      setPriceError('Minimum price is $1.00');
      toast.error('Minimum price is $1.00');
      setIsSubmitting(false);
      return;
    }

    const { error } = await createListing(visualizationId, priceCents);

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to create listing', { description: error.message });
      return;
    }

    toast.success(listingType === 'free' 
      ? 'Listed as gift!' 
      : `Listed for $${(priceCents / 100).toFixed(2)}!`,
      { description: 'Your visualization is now on the marketplace' }
    );

    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List for Sale or Gift</DialogTitle>
          <DialogDescription>
            Transfer "{visualizationTitle}" to another collector
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={listingType}
            onValueChange={(v) => setListingType(v as 'free' | 'paid')}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="free"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                listingType === 'free' 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="free" id="free" className="sr-only" />
              <Gift className={`h-8 w-8 ${listingType === 'free' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="font-medium">Gift (Free)</span>
              <span className="text-xs text-muted-foreground text-center">
                First to claim gets it
              </span>
            </Label>

            <Label
              htmlFor="paid"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                listingType === 'paid' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="paid" id="paid" className="sr-only" />
              <DollarSign className={`h-8 w-8 ${listingType === 'paid' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">Sell</span>
              <span className="text-xs text-muted-foreground text-center">
                Set your price
              </span>
            </Label>
          </RadioGroup>

          {listingType === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => {
                    setPriceUsd(e.target.value);
                    setPriceError(null);
                  }}
                  className={`pl-9 ${priceError ? 'border-destructive' : ''}`}
                  placeholder="5.00"
                  max="10000"
                />
              </div>
              {priceError ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {priceError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Minimum $1.00, maximum $10,000. Stripe processing fees apply.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : listingType === 'free' ? (
              'List as Gift'
            ) : (
              `List for $${parseFloat(priceUsd || '0').toFixed(2)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListForSaleModal;