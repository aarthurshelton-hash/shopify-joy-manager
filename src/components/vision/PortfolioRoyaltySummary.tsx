import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';

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
  const ownerSharePercent = MEMBERSHIP_ECONOMICS.ownerValueShare * 100;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Portfolio Royalties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main earnings display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            ${royaltyDollars.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">total earned</span>
        </div>

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
            <p className="text-lg font-semibold">{ownerSharePercent}%</p>
            <p className="text-xs text-muted-foreground">Your Share</p>
          </div>
        </div>

        {stats.totalRoyaltyOrders === 0 && (
          <p className="text-xs text-muted-foreground italic text-center">
            Share your visions to start earning royalties when others order prints!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioRoyaltySummary;
