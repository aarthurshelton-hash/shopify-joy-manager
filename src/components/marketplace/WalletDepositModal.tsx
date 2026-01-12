import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Shield, AlertCircle } from 'lucide-react';
import { initiateDeposit } from '@/lib/marketplace/withdrawalApi';
import { toast } from 'sonner';

interface WalletDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]; // cents

export function WalletDepositModal({ open, onOpenChange, onSuccess }: WalletDepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);
  const isValidAmount = amountCents >= 500 && amountCents <= 50000;

  const handleDeposit = async () => {
    if (!isValidAmount) return;

    setLoading(true);
    try {
      const { url, error } = await initiateDeposit(amountCents);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (url) {
        window.open(url, '_blank');
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err) {
      toast.error('Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription>
            Deposit funds to purchase visions on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((cents) => (
              <Button
                key={cents}
                variant={amountCents === cents ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAmount((cents / 100).toFixed(2))}
              >
                ${cents / 100}
              </Button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                min="5"
                max="500"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Min: $5.00 • Max: $500.00 per deposit
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Secure Payment via Stripe</p>
              <p className="text-muted-foreground">
                Your payment info is never stored on our servers
              </p>
            </div>
          </div>

          {/* Warning about withdrawals */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700">Important</p>
              <p className="text-amber-600/80">
                Deposited funds can only be used for purchases. 
                Only earnings from sales can be withdrawn.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleDeposit} 
            disabled={!isValidAmount || loading}
            className="w-full"
          >
            {loading ? 'Processing...' : `Deposit $${(amountCents / 100).toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
