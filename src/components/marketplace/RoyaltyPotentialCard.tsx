import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Info, Users, ShoppingBag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';

interface RoyaltyPotentialCardProps {
  // Current stats (if owner viewing their own listing)
  royaltyCentsEarned?: number;
  royaltyOrdersCount?: number;
  totalPrintRevenue?: number;
  printOrderCount?: number;
  viewCount?: number;
  uniqueViewers?: number;
  
  // Context
  isOwner?: boolean;
  className?: string;
}

/**
 * Shows royalty earnings breakdown for marketplace listings
 * - For owners: shows actual earnings and potential
 * - For buyers: shows potential earnings preview
 */
export const RoyaltyPotentialCard: React.FC<RoyaltyPotentialCardProps> = ({
  royaltyCentsEarned = 0,
  royaltyOrdersCount = 0,
  totalPrintRevenue = 0,
  printOrderCount = 0,
  viewCount = 0,
  uniqueViewers = 0,
  isOwner = false,
  className = '',
}) => {
  const royaltyDollars = royaltyCentsEarned / 100;
  const totalRevenueDollars = totalPrintRevenue / 100;
  const valueAppreciationPercent = MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100;
  const marketplaceFeePercent = MEMBERSHIP_ECONOMICS.marketplaceTransactionFee * 100;
  const sellerKeepsPercent = MEMBERSHIP_ECONOMICS.sellerRetentionRate * 100;

  // Example print prices for potential calculation
  const avgPrintPrice = 49; // Average print price in USD
  const projectedValueAdded = (avgPrintPrice * valueAppreciationPercent / 100);

  return (
    <Card className={`bg-gradient-to-br from-emerald-500/5 via-primary/5 to-amber-500/5 border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          {isOwner ? 'Vision Value' : 'Ownership Value Potential'}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium mb-1">How Value Appreciation Works</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• {valueAppreciationPercent}% of print revenue adds to vision value</li>
                  <li>• Sell on marketplace to realize gains ({sellerKeepsPercent}% to you)</li>
                  <li>• Popular visions can appreciate significantly</li>
                  <li>• Only {marketplaceFeePercent}% platform fee on sales</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner ? (
          // Owner view: actual earnings
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-500">
                +${royaltyDollars.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">accrued value</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs">Orders by Others</span>
                </div>
                <p className="text-lg font-semibold">{royaltyOrdersCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Total Print Revenue</span>
                </div>
                <p className="text-lg font-semibold">${totalRevenueDollars.toFixed(2)}</p>
              </div>
            </div>

            {/* Engagement stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-semibold">{viewCount}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{uniqueViewers}</p>
                <p className="text-xs text-muted-foreground">Unique Viewers</p>
              </div>
            </div>

            {royaltyOrdersCount === 0 && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">
                When others order prints, value accrues here. Sell on marketplace to realize gains.
              </p>
            )}
          </>
        ) : (
          // Buyer view: potential earnings
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                As owner, <span className="text-emerald-500 font-medium">{valueAppreciationPercent}%</span> of print revenue adds to this vision's value. Sell to realize gains.
              </p>
              
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Example: $49 print order</span>
                  <span className="text-lg font-bold text-emerald-500">
                    +${projectedValueAdded.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Value added per print order
                </p>
              </div>
            </div>

            {/* Vision engagement preview */}
            {(viewCount > 0 || uniqueViewers > 0) && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                <div className="p-2 rounded bg-background/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs">Interest</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{viewCount} views</p>
                </div>
                <div className="p-2 rounded bg-background/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">Potential</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5 text-emerald-500">High</p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              Claim ownership to start building value from print orders. Sell anytime (only {marketplaceFeePercent}% fee).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RoyaltyPotentialCard;
