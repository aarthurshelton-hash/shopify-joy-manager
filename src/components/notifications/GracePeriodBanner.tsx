import { AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface GracePeriodBannerProps {
  className?: string;
}

export function GracePeriodBanner({ className }: GracePeriodBannerProps) {
  const { gracePeriodStatus } = useSubscriptionNotifications();
  const { openCheckout } = useAuth();

  if (!gracePeriodStatus.isInGracePeriod) {
    return null;
  }

  const isUrgent = gracePeriodStatus.daysRemaining <= 2;

  return (
    <Alert
      variant={isUrgent ? 'destructive' : 'default'}
      className={cn(
        'border-2',
        isUrgent
          ? 'border-destructive bg-destructive/10'
          : 'border-orange-500 bg-orange-500/10',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isUrgent ? (
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className={cn('font-semibold', isUrgent ? 'text-destructive' : 'text-orange-600')}>
            {isUrgent
              ? `Urgent: Only ${gracePeriodStatus.daysRemaining} day${gracePeriodStatus.daysRemaining === 1 ? '' : 's'} left!`
              : `Grace Period Active: ${gracePeriodStatus.daysRemaining} days remaining`}
          </AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            {isUrgent
              ? 'Your visions will be released to the marketplace soon. Renew now to keep them.'
              : `Your subscription has ended. Renew before ${gracePeriodStatus.gracePeriodEnd?.toLocaleDateString()} to keep your visions.`}
          </AlertDescription>
          <Button
            size="sm"
            className="mt-3"
            variant={isUrgent ? 'destructive' : 'default'}
            onClick={openCheckout}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Renew Subscription
          </Button>
        </div>
      </div>
    </Alert>
  );
}
