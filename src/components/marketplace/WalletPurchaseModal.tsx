import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Loader2,
  DollarSign,
  Crown,
  Sparkles,
  PiggyBank,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserWallet, formatBalance, purchaseWithWallet } from '@/lib/marketplace/walletApi';
import { initiateDeposit } from '@/lib/marketplace/withdrawalApi';
import { useNavigate } from 'react-router-dom';
import { usePaymentRateLimit } from '@/hooks/useRateLimitV2';

interface WalletPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  visualizationTitle: string;
  priceCents: number;
  sellerName: string;
  onSuccess?: (visualizationId: string) => void;
}

export const WalletPurchaseModal: React.FC<WalletPurchaseModalProps> = ({
  open,
  onOpenChange,
  listingId,
  visualizationTitle,
  priceCents,
  sellerName,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const { check: checkLimit, isLimited, resetInMs } = usePaymentRateLimit();
  const retryAfter = resetInMs ? Math.ceil(resetInMs / 1000) : null;

  // Calculate fees
  const platformFeeCents = Math.floor(priceCents * 0.05);
  const sellerReceivesCents = priceCents - platformFeeCents;
  const hasEnoughBalance = walletBalance >= priceCents;

  useEffect(() => {
    if (open) {
      loadWallet();
      setPurchaseComplete(false);
    }
  }, [open]);

  const loadWallet = async () => {
    setIsLoading(true);
    const { data, error } = await getUserWallet();
    if (data) {
      setWalletBalance(data.balance_cents);
    } else if (error) {
      console.error('Failed to load wallet:', error);
    }
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!hasEnoughBalance) {
      toast.error('Insufficient balance', {
        description: 'Please add funds to your wallet first',
      });
      return;
    }

    // Check rate limit before proceeding (V2 is synchronous)
    const result = checkLimit();
    if (!result.allowed) return;

    setIsPurchasing(true);

    const { success, error } = await purchaseWithWallet(listingId, priceCents);

    if (error) {
      toast.error('Purchase failed', { description: error.message });
      setIsPurchasing(false);
      return;
    }

    if (success) {
      setPurchaseComplete(true);
      toast.success('Purchase complete!', {
        description: `${visualizationTitle} is now yours!`,
        icon: <Sparkles className="h-4 w-4" />,
      });
      
      // Call success callback after brief delay
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(listingId);
        } else {
          navigate('/my-vision');
        }
      }, 1500);
    }

    setIsPurchasing(false);
  };

  const handleAddFunds = () => {
    onOpenChange(false);
    navigate('/marketplace?tab=wallet');
  };

  const handleQuickDeposit = async () => {
    const neededAmount = priceCents - walletBalance;
    // Add a small buffer (10%) to avoid edge cases
    const depositAmount = Math.max(500, Math.ceil(neededAmount * 1.1));
    
    setIsPurchasing(true);
    try {
      const { url, error } = await initiateDeposit(depositAmount);
      
      if (error) {
        toast.error('Deposit failed', { description: error.message });
        return;
      }

      if (url) {
        toast.info('Redirecting to payment...', {
          description: `Adding ${formatBalance(depositAmount)} to complete purchase`,
        });
        window.open(url, '_blank');
      }
    } catch (err) {
      toast.error('Failed to initiate deposit');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {purchaseComplete ? 'Purchase Complete!' : 'Confirm Purchase'}
          </DialogTitle>
          <DialogDescription>
            {purchaseComplete 
              ? 'The vision has been transferred to your collection.'
              : 'Review the transaction details below'
            }
          </DialogDescription>
        </DialogHeader>

        {purchaseComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{visualizationTitle}</h3>
              <p className="text-sm text-muted-foreground">Added to your collection</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Vision Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold truncate">{visualizationTitle}</h3>
              <p className="text-sm text-muted-foreground">From: {sellerName}</p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vision Price</span>
                <span className="font-semibold">{formatBalance(priceCents)}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Seller receives (95%)
                  </span>
                  <span>{formatBalance(sellerReceivesCents)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PiggyBank className="h-3 w-3" /> Platform Fee (5%)
                  </span>
                  <span>{formatBalance(platformFeeCents)}</span>
                </div>
              </div>

              <Separator />

              {/* Wallet Balance */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Balance</span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Badge variant={hasEnoughBalance ? 'default' : 'destructive'}>
                    {formatBalance(walletBalance)}
                  </Badge>
                )}
              </div>

              {!isLoading && !hasEnoughBalance && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Insufficient balance</p>
                      <p className="text-destructive/80">
                        You need {formatBalance(priceCents - walletBalance)} more to complete this purchase.
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Deposit Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={handleQuickDeposit}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Quick Deposit {formatBalance(Math.max(500, Math.ceil((priceCents - walletBalance) * 1.1)))}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Balance After Purchase */}
            {hasEnoughBalance && !isLoading && (
              <div className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded-lg">
                <span className="text-muted-foreground">Balance after purchase</span>
                <span className="font-medium">{formatBalance(walletBalance - priceCents)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {hasEnoughBalance ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    disabled={isPurchasing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handlePurchase}
                    disabled={isPurchasing || isLoading || isLimited}
                  >
                    {isPurchasing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLimited ? (
                      `Try again in ${retryAfter}s`
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Pay {formatBalance(priceCents)}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleAddFunds}
                  >
                    <Wallet className="h-4 w-4" />
                    Add Funds
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletPurchaseModal;
