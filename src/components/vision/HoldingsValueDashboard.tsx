import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  Wallet,
  Image as ImageIcon,
  DollarSign,
  Eye,
  Printer,
  ArrowRightLeft,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';

interface VisionHolding {
  id: string;
  title: string;
  image_path: string;
  created_at: string;
  score?: {
    total_score: number;
    view_count: number;
    print_order_count: number;
    trade_count: number;
    royalty_cents_earned: number;
    print_revenue_cents: number;
  };
}

const HoldingsValueDashboard: React.FC = () => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<VisionHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (user) {
      loadHoldingsData();
    }
  }, [user]);

  const loadHoldingsData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get all user visualizations with their scores
      const { data: visualizations, error: vizError } = await supabase
        .from('saved_visualizations')
        .select('id, title, image_path, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (vizError) throw vizError;

      // Get scores for all visualizations
      const vizIds = visualizations?.map(v => v.id) || [];
      let scores: Record<string, VisionHolding['score']> = {};
      
      if (vizIds.length > 0) {
        const { data: scoresData } = await supabase
          .from('vision_scores')
          .select('visualization_id, total_score, view_count, print_order_count, trade_count, royalty_cents_earned, print_revenue_cents')
          .in('visualization_id', vizIds);

        scores = (scoresData || []).reduce((acc, s) => {
          acc[s.visualization_id] = {
            total_score: Number(s.total_score) || 0,
            view_count: s.view_count || 0,
            print_order_count: s.print_order_count || 0,
            trade_count: s.trade_count || 0,
            royalty_cents_earned: s.royalty_cents_earned || 0,
            print_revenue_cents: s.print_revenue_cents || 0,
          };
          return acc;
        }, {} as Record<string, VisionHolding['score']>);
      }

      // Combine data
      const holdingsData: VisionHolding[] = (visualizations || []).map(v => ({
        ...v,
        score: scores[v.id],
      }));

      setHoldings(holdingsData);

      // Calculate total portfolio value using database function
      const { data: portfolioValue } = await supabase
        .rpc('calculate_portfolio_value', { p_user_id: user.id });
      
      setTotalPortfolioValue(portfolioValue || 0);

      // Get wallet balance
      const { data: walletData } = await supabase
        .rpc('get_or_create_wallet', { p_user_id: user.id });
      
      if (walletData) {
        setWalletBalance(walletData.balance_cents || 0);
      }

    } catch (error) {
      console.error('Error loading holdings:', error);
    }
    
    setIsLoading(false);
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const totalScore = holdings.reduce((sum, h) => sum + (h.score?.total_score || 0), 0);
  const totalViews = holdings.reduce((sum, h) => sum + (h.score?.view_count || 0), 0);
  const totalPrints = holdings.reduce((sum, h) => sum + (h.score?.print_order_count || 0), 0);
  const totalTrades = holdings.reduce((sum, h) => sum + (h.score?.trade_count || 0), 0);
  const totalValueAppreciation = holdings.reduce((sum, h) => sum + (h.score?.royalty_cents_earned || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-amber-500/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Holdings Value Dashboard
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Your holdings value is calculated from vision scores + value appreciation from print orders. This represents your portfolio's market value when selling.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Portfolio Value */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm">Portfolio Value</span>
              </div>
              <p className="text-3xl font-bold text-primary">{formatCents(totalPortfolioValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on vision scores + value appreciation
              </p>
            </div>

            {/* Wallet Balance */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="text-sm">Available Balance</span>
              </div>
              <p className="text-3xl font-bold text-green-500">{formatCents(walletBalance)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for marketplace purchases
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <ImageIcon className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xl font-bold">{holdings.length}</p>
              <p className="text-xs text-muted-foreground">Visions</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Eye className="h-4 w-4 mx-auto text-purple-500 mb-1" />
              <p className="text-xl font-bold">{totalViews}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Printer className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <p className="text-xl font-bold">{totalPrints}</p>
              <p className="text-xs text-muted-foreground">Prints</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <ArrowRightLeft className="h-4 w-4 mx-auto text-cyan-500 mb-1" />
              <p className="text-xl font-bold">{totalTrades}</p>
              <p className="text-xs text-muted-foreground">Trades</p>
            </div>
          </div>

          {/* Value Appreciation */}
          {totalValueAppreciation > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">Value Appreciation from Print Orders</span>
                <span className="font-bold text-amber-600">{formatCents(totalValueAppreciation)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100)}% of print revenue adds to your holdings value
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Holdings */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Top Holdings by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holdings
                .sort((a, b) => (b.score?.total_score || 0) - (a.score?.total_score || 0))
                .slice(0, 5)
                .map((holding, idx) => {
                  const valueEstimate = ((holding.score?.total_score || 0) * 10) + (holding.score?.royalty_cents_earned || 0);
                  const maxValue = holdings.length > 0 
                    ? Math.max(...holdings.map(h => ((h.score?.total_score || 0) * 10) + (h.score?.royalty_cents_earned || 0)))
                    : 1;
                  
                  return (
                    <div key={holding.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{idx + 1}
                      </span>
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={holding.image_path} 
                          alt={holding.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{holding.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={(valueEstimate / maxValue) * 100} 
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {(holding.score?.total_score || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {formatCents(valueEstimate)}
                      </Badge>
                    </div>
                  );
                })}
            </div>

            {holdings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No visions in your collection yet</p>
                <p className="text-sm">Create or claim visions to build your portfolio</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Economics Explainer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            How Value Works
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <p>Vision score accumulates from views, downloads, prints, and trades</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <p>{Math.round(MEMBERSHIP_ECONOMICS.valueAppreciationRate * 100)}% of print order revenue adds to your holdings value</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <p>List visions for sale on the marketplace at your chosen price</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>{Math.round(MEMBERSHIP_ECONOMICS.sellerRetentionRate * 100)}% of sales go to you ({Math.round(MEMBERSHIP_ECONOMICS.marketplaceTransactionFee * 100)}% platform fee)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HoldingsValueDashboard;
