import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Loader2, Info, Building2, Sparkles, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

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
  const ownerSharePercent = MEMBERSHIP_ECONOMICS.ownerValueShare * 100;
  const platformSharePercent = MEMBERSHIP_ECONOMICS.platformValueShare * 100;

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

  const royaltyDollars = stats.totalRoyaltyCents / 100;
  const totalRevenueDollars = stats.totalPrintRevenue / 100;
  const platformDollars = totalRevenueDollars - royaltyDollars;

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
          <DollarSign className="h-5 w-5 text-primary" />
          Portfolio Royalties
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium mb-2">Revenue Split Economics</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Your Royalty
                    </span>
                    <span className="font-bold text-primary">{ownerSharePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Platform & Fulfillment
                    </span>
                    <span>{platformSharePercent}%</span>
                  </div>
                  <p className="text-muted-foreground pt-1 border-t border-border/50">
                    The {platformSharePercent}% covers printing, shipping, payment processing, and platform operations.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="relative z-10">
          Lifetime earnings from print orders by others
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {/* Main earnings display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            ${royaltyDollars.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">total earned</span>
        </div>

        {/* Revenue split visualization */}
        {stats.totalPrintRevenue > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <PieChart className="h-3 w-3 text-muted-foreground" />
                Revenue Distribution
              </span>
              <span className="text-muted-foreground">${totalRevenueDollars.toFixed(2)} total</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              <div 
                className="bg-primary transition-all"
                style={{ width: `${ownerSharePercent}%` }}
              />
              <div 
                className="bg-muted-foreground/30 transition-all"
                style={{ width: `${platformSharePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-primary font-medium">You: ${royaltyDollars.toFixed(2)}</span>
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
            <p className="text-lg font-semibold text-primary">{ownerSharePercent}%</p>
            <p className="text-xs text-muted-foreground">Your Share</p>
          </div>
        </div>

        {stats.totalRoyaltyOrders === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Share your visions publicly. 
              When others order prints, you automatically earn {ownerSharePercent}% royalties.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioRoyaltySummary;
