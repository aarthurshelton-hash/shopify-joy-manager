import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Loader2, Info, Building2, Sparkles, PieChart, ArrowRightLeft, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PortfolioRoyaltyStats {
  totalRoyaltyCents: number;
  totalRoyaltyOrders: number;
  totalPrintRevenue: number;
  totalPrintOrders: number;
  visionCount: number;
}

export const PortfolioRoyaltySummary: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PortfolioRoyaltyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const backgroundImages = useRandomGameArt(1);
  const valueAppreciationPercent = MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100;
  const platformSharePercent = MEMBERSHIP_ECONOMICS.platformRetentionRate * 100;
  const marketplaceFeePercent = MEMBERSHIP_ECONOMICS.marketplaceTransactionFee * 100;
  const sellerKeepsPercent = MEMBERSHIP_ECONOMICS.sellerRetentionRate * 100;

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get user's visualizations
        const { data: visualizations } = await supabase
          .from('saved_visualizations')
          .select('id')
          .eq('user_id', user.id);

        if (!visualizations || visualizations.length === 0) {
          setStats({
            totalRoyaltyCents: 0,
            totalRoyaltyOrders: 0,
            totalPrintRevenue: 0,
            totalPrintOrders: 0,
            visionCount: 0,
          });
          setIsLoading(false);
          return;
        }

        const vizIds = visualizations.map(v => v.id);

        // Get vision scores for all user's visualizations
        const { data: scores } = await supabase
          .from('vision_scores')
          .select('royalty_cents_earned, royalty_orders_count, print_revenue_cents, print_order_count')
          .in('visualization_id', vizIds);

        const totals = (scores || []).reduce((acc, score) => ({
          totalRoyaltyCents: acc.totalRoyaltyCents + (score.royalty_cents_earned || 0),
          totalRoyaltyOrders: acc.totalRoyaltyOrders + (score.royalty_orders_count || 0),
          totalPrintRevenue: acc.totalPrintRevenue + (score.print_revenue_cents || 0),
          totalPrintOrders: acc.totalPrintOrders + (score.print_order_count || 0),
        }), {
          totalRoyaltyCents: 0,
          totalRoyaltyOrders: 0,
          totalPrintRevenue: 0,
          totalPrintOrders: 0,
        });

        setStats({
          ...totals,
          visionCount: visualizations.length,
        });
      } catch (error) {
        console.error('Error fetching portfolio royalty stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const valueDollars = stats.totalRoyaltyCents / 100;
  const totalRevenueDollars = stats.totalPrintRevenue / 100;
  const platformDollars = totalRevenueDollars - valueDollars;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
          Portfolio Value
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium mb-2">Value Appreciation Model</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Value Appreciation
                    </span>
                    <span className="font-bold text-primary">{valueAppreciationPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Platform & Fulfillment
                    </span>
                    <span>{platformSharePercent}%</span>
                  </div>
                  <p className="text-muted-foreground pt-1 border-t border-border/50">
                    Value accrues to your visions. Sell on the marketplace to realize gains ({sellerKeepsPercent}% to you, {marketplaceFeePercent}% platform fee).
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="relative z-10">
          Accrued value from print orders by others
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {/* Main value display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            +${valueDollars.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">accrued value</span>
        </div>

        {/* Value appreciation visualization */}
        {stats.totalPrintRevenue > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <PieChart className="h-3 w-3 text-muted-foreground" />
                Print Revenue Split
              </span>
              <span className="text-muted-foreground">${totalRevenueDollars.toFixed(2)} total</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              <div 
                className="bg-primary transition-all"
                style={{ width: `${valueAppreciationPercent}%` }}
              />
              <div 
                className="bg-muted-foreground/30 transition-all"
                style={{ width: `${platformSharePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-primary font-medium">Your Value: +${valueDollars.toFixed(2)}</span>
              <span className="text-muted-foreground">Operations: ${platformDollars.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-lg font-semibold">{stats.visionCount}</p>
            <p className="text-xs text-muted-foreground">Visions</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-lg font-semibold">{stats.totalRoyaltyOrders}</p>
            <p className="text-xs text-muted-foreground">Orders by Others</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-lg font-semibold text-green-500">{sellerKeepsPercent}%</p>
            <p className="text-xs text-muted-foreground">On Sale</p>
          </div>
        </div>

        {stats.totalRoyaltyOrders === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> When others order prints, 
              {valueAppreciationPercent}% of revenue adds to your vision's value. List on the marketplace to sell.
            </p>
          </div>
        )}

        {/* Marketplace CTA */}
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <ArrowRightLeft className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-muted-foreground">
              Ready to sell? <strong className="text-foreground">Only {marketplaceFeePercent}% fee</strong>
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
            <Link to="/marketplace">Marketplace</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioRoyaltySummary;
