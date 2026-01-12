import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Banknote, Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { getWithdrawableBalance, validateWithdrawal, createWithdrawalRequest } from '@/lib/marketplace/withdrawalApi';
import { formatBalance } from '@/lib/marketplace/walletApi';
import { toast } from 'sonner';

interface WalletWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WalletWithdrawModal({ open, onOpenChange, onSuccess }: WalletWithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);
  const isValidAmount = amountCents >= 1000 && amountCents <= withdrawableBalance;

  useEffect(() => {
    if (open) {
      loadWithdrawableBalance();
    }
  }, [open]);

  const loadWithdrawableBalance = async () => {
    const { data } = await getWithdrawableBalance();
    setWithdrawableBalance(data);
  };

  const handleAmountChange = async (value: string) => {
    setAmount(value);
    setValidationError(null);
    
    const cents = Math.round(parseFloat(value || '0') * 100);
    if (cents >= 1000) {
      const { data } = await validateWithdrawal(cents);
      if (data && !data.is_valid) {
        setValidationError(data.error_message);
      }
    }
  };

  const handleWithdraw = async () => {
    if (!isValidAmount || !paypalEmail) return;

    setLoading(true);
    try {
      const { data: requestId, error } = await createWithdrawalRequest(amountCents, {
        method: 'paypal',
        email: paypalEmail,
        notes
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Withdrawal request submitted! We\'ll process it within 3-5 business days.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription>
            Request a payout of your marketplace earnings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Available balance */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <p className="text-sm text-muted-foreground">Available to Withdraw</p>
            <p className="text-2xl font-bold text-green-600">
              {formatBalance(withdrawableBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From marketplace sales only
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Withdrawal Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="withdraw-amount"
                type="number"
                min="10"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: $10.00
            </p>
            {validationError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationError}
              </p>
            )}
          </div>

          {/* PayPal email */}
          <div className="space-y-2">
            <Label htmlFor="paypal-email">PayPal Email</Label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="your@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Funds will be sent to this PayPal account
            </p>
          </div>

          {/* Optional notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Anti-fraud info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Fraud Protection</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Only earned funds (from sales) can be withdrawn
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    7-day wallet maturity requirement
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Manual review within 3-5 business days
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Withdrawals are reviewed manually to ensure security. 
                You'll receive an email when your payout is processed.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleWithdraw} 
            disabled={!isValidAmount || !paypalEmail || loading || !!validationError}
            className="w-full"
          >
            {loading ? 'Submitting...' : `Request Withdrawal of ${formatBalance(amountCents)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
