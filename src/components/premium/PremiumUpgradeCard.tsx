import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VisionaryMembershipCard } from './VisionaryMembershipCard';

interface PremiumUpgradeCardProps {
  onAuthRequired?: () => void;
  compact?: boolean;
}

const PremiumUpgradeCard: React.FC<PremiumUpgradeCardProps> = ({ 
  onAuthRequired,
  compact = false 
}) => {
  const { user, isPremium, subscriptionStatus, isCheckingSubscription, openCustomerPortal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <Card className={`border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${compact ? '' : 'max-w-md'}`}>
        <CardHeader className={compact ? 'pb-3' : ''}>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Visionary Premium</CardTitle>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Active
            </Badge>
          </div>
          {subscriptionStatus?.subscriptionEnd && (
            <CardDescription>
              Renews {new Date(subscriptionStatus.subscriptionEnd).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManageSubscription}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Manage Subscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <>
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Go Premium</p>
                  <p className="text-xs text-muted-foreground">$7/month • No watermarks</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowVisionaryModal(true)}
                disabled={isCheckingSubscription}
                className="btn-luxury"
              >
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
        <VisionaryMembershipCard
          isOpen={showVisionaryModal}
          onClose={() => setShowVisionaryModal(false)}
          onAuthRequired={onAuthRequired}
          trigger="general"
        />
      </>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Visionary Premium</CardTitle>
          </div>
          <CardDescription className="text-base">
            Unlock the full experience for just $7/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            className="w-full btn-luxury"
            size="lg"
            onClick={() => setShowVisionaryModal(true)}
            disabled={isCheckingSubscription}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </CardContent>
      </Card>
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={onAuthRequired}
        trigger="general"
      />
    </>
  );
};

export default PremiumUpgradeCard;
