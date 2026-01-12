import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingBag, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';

interface RoyaltyEarningsCardProps {
  royaltyCentsEarned: number;
  royaltyOrdersCount: number;
  totalPrintRevenue: number;
  printOrderCount: number;
  className?: string;
}

export const RoyaltyEarningsCard: React.FC<RoyaltyEarningsCardProps> = ({
  royaltyCentsEarned,
  royaltyOrdersCount,
  totalPrintRevenue,
  printOrderCount,
  className = '',
}) => {
  const royaltyDollars = royaltyCentsEarned / 100;
  const totalRevenueDollars = totalPrintRevenue / 100;
  const ownerSharePercent = MEMBERSHIP_ECONOMICS.ownerValueShare * 100;

  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Royalty Earnings
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium mb-1">How Royalties Work</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• You earn {ownerSharePercent}% when others order prints of your vision</li>
                  <li>• Royalties are tracked automatically</li>
                  <li>• Build passive income from your chess art</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main earnings display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            ${royaltyDollars.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">earned</span>
        </div>

        {/* Stats grid */}
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

        {/* Revenue breakdown */}
        {printOrderCount > 0 && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            <div className="flex justify-between">
              <span>Total orders on this vision:</span>
              <span className="font-medium">{printOrderCount}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Your share ({ownerSharePercent}%):</span>
              <span className="font-medium text-primary">${royaltyDollars.toFixed(2)}</span>
            </div>
          </div>
        )}

        {royaltyOrdersCount === 0 && (
          <p className="text-xs text-muted-foreground italic">
            When others order prints of your vision, you'll earn royalties here.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoyaltyEarningsCard;
