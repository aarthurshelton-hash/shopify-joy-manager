import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingBag, Info, Sparkles, Building2, ArrowRightLeft, Percent } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Badge } from '@/components/ui/badge';

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
  const valueDollars = royaltyCentsEarned / 100;
  const totalRevenueDollars = totalPrintRevenue / 100;
  const valueAppreciationPercent = MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100;
  const platformSharePercent = MEMBERSHIP_ECONOMICS.platformRetentionRate * 100;
  const marketplaceFeePercent = MEMBERSHIP_ECONOMICS.marketplaceTransactionFee * 100;
  const backgroundImages = useRandomGameArt(1);

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}>
      {/* Subtle AI Art Background */}
      {backgroundImages[0] && (
        <div 
          className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImages[0]})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/90" />
      
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Vision Value
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs bg-card border-border">
                <p className="font-medium mb-2">How Value Appreciation Works</p>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">{valueAppreciationPercent}%</strong> of order <em>profit</em> adds to your vision's value</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Building2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{platformSharePercent}% of profit covers printing, fulfillment & operations</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ArrowRightLeft className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">No automatic payouts</strong> — sell, trade, or gift your vision to realize gains</span>
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {/* Main value display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            +${valueDollars.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">accrued value</span>
        </div>

        {/* Value appreciation badge */}
        <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/30">
          <TrendingUp className="h-3 w-3" />
          Value from {royaltyOrdersCount} print order{royaltyOrdersCount !== 1 ? 's' : ''} by others
        </Badge>

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
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Total Print Revenue</span>
            </div>
            <p className="text-lg font-semibold">${totalRevenueDollars.toFixed(2)}</p>
          </div>
        </div>

        {/* Value breakdown */}
        {printOrderCount > 0 && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            <div className="flex justify-between">
              <span>Total orders on this vision:</span>
              <span className="font-medium">{printOrderCount}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Value added ({valueAppreciationPercent}% of profit):</span>
              <span className="font-medium text-primary">+${valueDollars.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1 opacity-60">
              <span>Platform & fulfillment ({platformSharePercent}% of profit):</span>
              <span className="font-medium">${(totalRevenueDollars - valueDollars).toFixed(2)}</span>
            </div>
          </div>
        )}

        {royaltyOrdersCount === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Grow value:</strong> When others order prints, 
              {valueAppreciationPercent}% of order <em>profit</em> adds to this vision's value. 
              <strong className="text-foreground"> Sell, trade, or gift</strong> your vision to realize gains — no automatic payouts.
            </p>
          </div>
        )}

        {/* Marketplace CTA */}
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              <Percent className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">
                Sell on marketplace: <strong className="text-foreground">only {marketplaceFeePercent}% fee</strong>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              Visions can also be traded or gifted to other members
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoyaltyEarningsCard;
