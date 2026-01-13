import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, ShoppingBag, Flame, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TrendingVision {
  id: string;
  listingId: string;
  title: string;
  imagePath: string;
  ownerName: string;
  royaltyOrdersCount: number;
  royaltyCentsEarned: number;
  recentOrders: number; // Orders in last 7 days
  priceCents: number;
}

export const TrendingVisions: React.FC = () => {
  const [trending, setTrending] = useState<TrendingVision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrendingVisions();
  }, []);

  const loadTrendingVisions = async () => {
    try {
      // Get visions with recent royalty activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get recent print orders
      const { data: recentInteractions } = await supabase
        .from('vision_interactions')
        .select('visualization_id')
        .eq('interaction_type', 'print_order')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Count recent orders per vision
      const recentOrderCounts = new Map<string, number>();
      (recentInteractions || []).forEach(interaction => {
        const count = recentOrderCounts.get(interaction.visualization_id) || 0;
        recentOrderCounts.set(interaction.visualization_id, count + 1);
      });

      // Get vision scores with royalty activity
      const { data: scores } = await supabase
        .from('vision_scores')
        .select('visualization_id, royalty_orders_count, royalty_cents_earned')
        .gt('royalty_orders_count', 0)
        .order('royalty_cents_earned', { ascending: false })
        .limit(20);

      if (!scores || scores.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get active listings for these visions
      const vizIds = scores.map(s => s.visualization_id);
      const { data: listings } = await supabase
        .from('visualization_listings')
        .select('id, visualization_id, price_cents, seller_id')
        .eq('status', 'active')
        .in('visualization_id', vizIds);

      if (!listings || listings.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get visualization details
      const listedVizIds = listings.map(l => l.visualization_id);
      const { data: visualizations } = await supabase
        .from('saved_visualizations')
        .select('id, title, image_path, user_id')
        .in('id', listedVizIds);

      // Get owner profiles
      const ownerIds = [...new Set(visualizations?.map(v => v.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      const vizMap = new Map(visualizations?.map(v => [v.id, v]) || []);
      const listingMap = new Map(listings.map(l => [l.visualization_id, l]));
      const scoreMap = new Map(scores.map(s => [s.visualization_id, s]));

      // Build trending list, prioritizing recent activity
      const trendingVisions: TrendingVision[] = [];

      for (const vizId of listedVizIds) {
        const viz = vizMap.get(vizId);
        const listing = listingMap.get(vizId);
        const score = scoreMap.get(vizId);
        const recentOrders = recentOrderCounts.get(vizId) || 0;

        if (viz && listing && score) {
          trendingVisions.push({
            id: viz.id,
            listingId: listing.id,
            title: viz.title,
            imagePath: viz.image_path,
            ownerName: profileMap.get(viz.user_id) || 'Anonymous',
            royaltyOrdersCount: score.royalty_orders_count,
            royaltyCentsEarned: score.royalty_cents_earned,
            recentOrders,
            priceCents: listing.price_cents,
          });
        }
      }

      // Sort by recent activity first, then total royalties
      trendingVisions.sort((a, b) => {
        // Prioritize recent activity
        if (a.recentOrders !== b.recentOrders) {
          return b.recentOrders - a.recentOrders;
        }
        // Then by total earnings
        return b.royaltyCentsEarned - a.royaltyCentsEarned;
      });

      setTrending(trendingVisions.slice(0, 6));
    } catch (error) {
      console.error('Error loading trending visions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Flame className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Trending by Royalties</h2>
          <p className="text-xs text-muted-foreground">Visions earning from print orders</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {trending.map((vision, index) => (
          <Link 
            key={vision.id}
            to={`/marketplace/${vision.listingId}`} 
            className="block"
            style={{ 
              opacity: 0, 
              animation: `fadeInUp 0.3s ease-out ${index * 0.05}s forwards` 
            }}
          >
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-orange-500/20 hover:border-orange-500/40 cursor-pointer">
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={vision.imagePath}
                    alt={vision.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Trending rank badge */}
                  <Badge 
                    className="absolute top-2 left-2 bg-orange-500/90 hover:bg-orange-500 text-white gap-1 pointer-events-none"
                  >
                    <TrendingUp className="h-3 w-3" />
                    #{index + 1}
                  </Badge>

                  {/* Recent activity indicator */}
                  {vision.recentOrders > 0 && (
                    <Badge 
                      className="absolute top-2 right-2 bg-green-500/90 hover:bg-green-500 text-white text-[10px] px-1.5 pointer-events-none"
                    >
                      {vision.recentOrders} this week
                    </Badge>
                  )}

                  {/* Royalty earnings overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                    <div className="flex items-center gap-1 text-white text-xs font-medium">
                      <DollarSign className="h-3 w-3 text-green-400" />
                      <span>${(vision.royaltyCentsEarned / 100).toFixed(2)} earned</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{vision.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground truncate">
                      {vision.ownerName}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-orange-500">
                      <ShoppingBag className="h-2.5 w-2.5" />
                      {vision.royaltyOrdersCount}
                    </div>
                  </div>
                </CardContent>
              </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
