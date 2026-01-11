import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Crown, Check, Loader2, Sparkles, Download, Image, Star, Film } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired?: () => void;
  trigger?: 'download' | 'save' | 'general' | 'gif';
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onAuthRequired,
  trigger = 'general',
}) => {
  const { user, openCheckout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      onClose();
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);
    try {
      await openCheckout();
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerMessages = {
    download: {
      title: 'Unlock HD Downloads',
      description: 'Get high-resolution images without watermarks',
    },
    save: {
      title: 'Save to Your Gallery',
      description: 'Store and access your visualizations anytime',
    },
    gif: {
      title: 'Unlock Animated GIFs',
      description: 'Export your game journey as a stunning animation',
    },
    general: {
      title: 'Upgrade to Premium',
      description: 'Unlock the full Visionary experience',
    },
  };

  const features = [
    { icon: Download, text: 'Download in HD quality', highlight: trigger === 'download' },
    { icon: Image, text: 'No watermarks on images', highlight: trigger === 'download' },
    { icon: Film, text: 'Export animated GIF sequences', highlight: trigger === 'gif' },
    { icon: Star, text: 'Save to your personal gallery', highlight: trigger === 'save' },
    { icon: Sparkles, text: 'Early access to limited editions', highlight: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl">
            {triggerMessages[trigger].title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {triggerMessages[trigger].description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-primary">$7</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li
                key={index}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  feature.highlight ? 'bg-primary/10' : ''
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                }`}>
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full btn-luxury"
            size="lg"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Opening Checkout...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                {user ? 'Upgrade Now' : 'Sign Up to Upgrade'}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. Secure payment via Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
