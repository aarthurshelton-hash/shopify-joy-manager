import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Lock, Unlock } from 'lucide-react';
import { getRemainingTransfers } from '@/lib/marketplace/marketplaceApi';

interface TransferLimitBadgeProps {
  visualizationId: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export const TransferLimitBadge: React.FC<TransferLimitBadgeProps> = ({
  visualizationId,
  variant = 'default',
  className = '',
}) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransferLimit = async () => {
      setIsLoading(true);
      const { remaining: count, error } = await getRemainingTransfers(visualizationId);
      if (!error) {
        setRemaining(count);
      }
      setIsLoading(false);
    };

    fetchTransferLimit();
  }, [visualizationId]);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`gap-1 animate-pulse ${className}`}>
        <RefreshCw className="h-3 w-3 animate-spin" />
        {variant === 'default' && <span>Checking...</span>}
      </Badge>
    );
  }

  if (remaining === null) return null;

  const canTransfer = remaining > 0;
  const isLimited = remaining < 3;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Badge 
            variant={canTransfer ? 'outline' : 'destructive'}
            className={`gap-1 cursor-default ${
              canTransfer 
                ? isLimited 
                  ? 'border-amber-500/50 text-amber-600 bg-amber-500/10' 
                  : 'border-green-500/50 text-green-600 bg-green-500/10'
                : ''
            } ${className}`}
          >
            {canTransfer ? (
              <Unlock className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {variant === 'default' && (
              <span>
                {canTransfer ? `${remaining}/3 transfers left` : 'Limit reached'}
              </span>
            )}
            {variant === 'compact' && (
              <span>{remaining}/3</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">
              {canTransfer 
                ? `${remaining} transfer${remaining !== 1 ? 's' : ''} remaining today`
                : 'Transfer limit reached'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {canTransfer
                ? 'Each vision can be transferred max 3 times per 24 hours'
                : 'Try again later - limit resets after 24 hours'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TransferLimitBadge;
