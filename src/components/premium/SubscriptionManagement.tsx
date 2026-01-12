import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, Calendar, CreditCard, RefreshCw, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SubscriptionManagement: React.FC = () => {
  const { 
    user, 
    isPremium, 
    subscriptionStatus, 
    isCheckingSubscription, 
    checkSubscription, 
    openCheckout, 
    openCustomerPortal 
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkSubscription();
      toast.success('Subscription status updated');
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await openCheckout();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!user) {
    return null;
  }

  const subscriptionEnd = subscriptionStatus?.subscriptionEnd 
    ? new Date(subscriptionStatus.subscriptionEnd) 
    : null;

  const isExpiringSoon = subscriptionEnd && 
    (subscriptionEnd.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Subscription</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isCheckingSubscription}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isCheckingSubscription ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Manage your Visionary premium subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          {isPremium ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted">
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        <Separator />

        {isPremium ? (
          <>
            {/* Premium Details */}
            <div className="space-y-4">
              {/* Renewal Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Renewal Date</span>
                </div>
                <div className="text-sm font-medium">
                  {subscriptionEnd ? format(subscriptionEnd, 'MMMM d, yyyy') : 'N/A'}
                </div>
              </div>

              {/* Expiring Soon Warning */}
              {isExpiringSoon && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-500">
                    Your subscription renews in less than 7 days
                  </span>
                </div>
              )}

              {/* Benefits */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-medium mb-2">Your Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited HD downloads</li>
                  <li>• No watermarks on exports</li>
                  <li>• Personal vision gallery</li>
                  <li>• Early access to new features</li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Manage Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageSubscription}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Update payment method, cancel, or view invoices
            </p>
          </>
        ) : (
          <>
            {/* Upgrade Prompt */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-medium mb-2">Premium Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited HD downloads</li>
                  <li>• No watermarks on exports</li>
                  <li>• Personal vision gallery</li>
                  <li>• Early access to new features</li>
                </ul>
              </div>

              <div className="text-center">
                <span className="text-2xl font-bold">$7</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <Button
              className="w-full btn-luxury"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Upgrade to Premium
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. Secure payment via Stripe.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
