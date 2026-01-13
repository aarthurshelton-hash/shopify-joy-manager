import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Send,
  DollarSign,
  Check,
  X,
  ArrowLeftRight,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  createOffer, 
  counterOffer,
  acceptOffer,
  declineOffer,
  withdrawOffer,
  getListingOffers,
  formatOffer,
} from '@/lib/marketplace/offerApi';
import { getUserWallet, formatBalance } from '@/lib/marketplace/walletApi';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface OfferNegotiationCardProps {
  listingId: string;
  sellerId: string;
  listingPriceCents: number;
  currentUserId: string | undefined;
  isOwner: boolean;
  onOfferAccepted: (agreedPriceCents: number) => void;
}

const OfferNegotiationCard: React.FC<OfferNegotiationCardProps> = ({
  listingId,
  sellerId,
  listingPriceCents,
  currentUserId,
  isOwner,
  onOfferAccepted,
}) => {
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showCounterForm, setShowCounterForm] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  useEffect(() => {
    loadOffers();
    loadWallet();
  }, [listingId]);

  const loadOffers = async () => {
    setIsLoading(true);
    const { data, error } = await getListingOffers(listingId);
    if (!error) {
      setOffers(data);
    }
    setIsLoading(false);
  };

  const loadWallet = async () => {
    const { data } = await getUserWallet();
    if (data) {
      setWalletBalance(data.balance_cents);
    }
  };

  const handleSubmitOffer = async () => {
    const cents = Math.round(parseFloat(offerAmount) * 100);
    if (isNaN(cents) || cents < 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }

    if (cents > walletBalance) {
      toast.error('Insufficient wallet balance', {
        description: `Your balance: ${formatBalance(walletBalance)}`,
      });
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await createOffer(listingId, sellerId, cents, message || undefined);
    
    if (error) {
      toast.error('Failed to submit offer', { description: error.message });
    } else {
      toast.success('Offer submitted!');
      setOfferAmount('');
      setMessage('');
      loadOffers();
    }
    setIsSubmitting(false);
  };

  const handleCounterOffer = async (parentOfferId: string) => {
    const cents = Math.round(parseFloat(counterAmount) * 100);
    if (isNaN(cents) || cents < 0) {
      toast.error('Please enter a valid counter amount');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await counterOffer(parentOfferId, cents, counterMessage || undefined);
    
    if (error) {
      toast.error('Failed to submit counter offer', { description: error.message });
    } else {
      toast.success('Counter offer sent!');
      setShowCounterForm(null);
      setCounterAmount('');
      setCounterMessage('');
      loadOffers();
    }
    setIsSubmitting(false);
  };

  const handleAccept = async (offer: MarketplaceOffer) => {
    // Check if buyer has sufficient balance
    if (!isOwner && offer.offer_cents > walletBalance) {
      toast.error('Buyer has insufficient balance');
      return;
    }

    setIsSubmitting(true);
    const { error } = await acceptOffer(offer.id);
    
    if (error) {
      toast.error('Failed to accept offer', { description: error.message });
    } else {
      toast.success('Offer accepted!');
      onOfferAccepted(offer.offer_cents);
      loadOffers();
    }
    setIsSubmitting(false);
  };

  const handleDecline = async (offerId: string) => {
    setIsSubmitting(true);
    const { error } = await declineOffer(offerId);
    
    if (error) {
      toast.error('Failed to decline offer', { description: error.message });
    } else {
      toast.success('Offer declined');
      loadOffers();
    }
    setIsSubmitting(false);
  };

  const handleWithdraw = async (offerId: string) => {
    setIsSubmitting(true);
    const { error } = await withdrawOffer(offerId);
    
    if (error) {
      toast.error('Failed to withdraw offer', { description: error.message });
    } else {
      toast.success('Offer withdrawn');
      loadOffers();
    }
    setIsSubmitting(false);
  };

  const getOfferStatusBadge = (status: MarketplaceOffer['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'countered':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><ArrowLeftRight className="h-3 w-3 mr-1" />Countered</Badge>;
      case 'withdrawn':
        return <Badge variant="secondary">Withdrawn</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return null;
    }
  };

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const hasActiveOfferFromUser = pendingOffers.some(o => o.buyer_id === currentUserId);

  // Calculate fee preview
  const previewFee = offerAmount ? Math.floor(parseFloat(offerAmount) * 100 * 0.05) : 0;
  const previewSellerReceives = offerAmount ? Math.floor(parseFloat(offerAmount) * 100 * 0.95) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Negotiate with Credits
          {pendingOffers.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {pendingOffers.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Disclosure */}
        <div className="text-xs bg-muted/50 p-3 rounded-lg space-y-1">
          <p className="font-medium">Trade Fee Structure:</p>
          <p className="text-muted-foreground">
            • <strong>Credit trades:</strong> 5% platform fee (seller receives 95%)
          </p>
          <p className="text-muted-foreground">
            • <strong>Gifts:</strong> No fees — recipient gets full value
          </p>
        </div>

        {/* Wallet Balance Display */}
        <div className="flex items-center justify-between text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
          <span className="text-muted-foreground">Your Platform Credits</span>
          <span className="font-bold text-primary">{formatBalance(walletBalance)}</span>
        </div>

        {/* Submit New Offer Form (Buyers only) */}
        {!isOwner && currentUserId && !hasActiveOfferFromUser && (
          <div className="space-y-3 p-4 border border-dashed rounded-lg">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Your offer"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="pl-9"
                  step="0.01"
                  min="0"
                />
              </div>
              <Button 
                onClick={handleSubmitOffer}
                disabled={isSubmitting || !offerAmount}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
            <Textarea
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none"
            />
            
            {/* Live fee preview */}
            {offerAmount && parseFloat(offerAmount) > 0 && (
              <div className="text-xs bg-muted/30 p-2 rounded space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller receives (95%):</span>
                  <span className="font-medium">${(previewSellerReceives / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (5%):</span>
                  <span className="text-muted-foreground">${(previewFee / 100).toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Listing price: {formatOffer(listingPriceCents)} • Offers expire in 48 hours • 5% fee on trades
            </p>
          </div>
        )}

        {hasActiveOfferFromUser && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span>You have an active offer on this listing</span>
          </div>
        )}

        <Separator />

        {/* Offer History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Offer History</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : offers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No offers yet. Be the first to make an offer!
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{formatOffer(offer.offer_cents)}</span>
                      {getOfferStatusBadge(offer.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {offer.message && (
                    <p className="text-sm text-muted-foreground italic">"{offer.message}"</p>
                  )}

                  {/* Actions for pending offers */}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      {isOwner ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleAccept(offer)}
                            disabled={isSubmitting}
                            className="gap-1"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setShowCounterForm(offer.id);
                              setCounterAmount((offer.offer_cents / 100).toString());
                            }}
                            disabled={isSubmitting}
                            className="gap-1"
                          >
                            <ArrowLeftRight className="h-3 w-3" /> Counter
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDecline(offer.id)}
                            disabled={isSubmitting}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" /> Decline
                          </Button>
                        </>
                      ) : offer.buyer_id === currentUserId ? (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleWithdraw(offer.id)}
                          disabled={isSubmitting}
                        >
                          Withdraw Offer
                        </Button>
                      ) : null}
                    </div>
                  )}

                  {/* Counter Offer Form */}
                  {showCounterForm === offer.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 border-t mt-2"
                    >
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="Counter amount"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                            className="pl-9"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <Textarea
                        placeholder="Add a message"
                        value={counterMessage}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleCounterOffer(offer.id)}
                          disabled={isSubmitting}
                        >
                          Send Counter
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowCounterForm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferNegotiationCard;
