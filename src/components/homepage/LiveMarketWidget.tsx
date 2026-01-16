import { useState, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, TrendingUp, DollarSign, Palette, Crown, 
  Gamepad2, ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ValuePool {
  id: string;
  name: string;
  totalValue: number;
  change24h: number;
  type: 'palette' | 'gamecard';
}

interface MarketActivity {
  id: string;
  type: 'sale' | 'print' | 'trade' | 'listing';
  description: string;
  value?: number;
  timestamp: Date;
}

const LiveMarketWidget = forwardRef<HTMLElement, object>(function LiveMarketWidget(_props, ref) {
  const { isPremium, isAdmin } = useAuth();
  const [valuePools, setValuePools] = useState<ValuePool[]>([]);
  const [activities, setActivities] = useState<MarketActivity[]>([]);
  const [totalMarketValue, setTotalMarketValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch initial data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [paletteResult, gamecardResult, trendsResult] = await Promise.all([
          supabase
            .from('palette_value_pool')
            .select('*')
            .order('earned_value_cents', { ascending: false })
            .limit(3),
          supabase
            .from('gamecard_value_pool')
            .select('*')
            .order('earned_value_cents', { ascending: false })
            .limit(3),
          supabase
            .from('financial_trends')
            .select('*')
            .order('date', { ascending: false })
            .limit(1),
        ]);

        // Map palette pools
        const palettePools: ValuePool[] = (paletteResult.data || []).map(p => ({
          id: p.id,
          name: p.palette_name,
          totalValue: (p.base_value_cents + p.earned_value_cents) / 100,
          change24h: Math.random() * 10 - 2, // Simulated for now
          type: 'palette' as const,
        }));

        // Map gamecard pools
        const gamecardPools: ValuePool[] = (gamecardResult.data || []).map(g => ({
          id: g.id,
          name: g.game_title.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          totalValue: (g.base_value_cents + g.earned_value_cents) / 100,
          change24h: Math.random() * 15 - 3, // Simulated for now
          type: 'gamecard' as const,
        }));

        setValuePools([...palettePools.slice(0, 2), ...gamecardPools.slice(0, 2)]);

        // Calculate total market value
        const paletteTotal = (paletteResult.data || []).reduce(
          (sum, p) => sum + p.base_value_cents + p.earned_value_cents, 0
        );
        const gamecardTotal = (gamecardResult.data || []).reduce(
          (sum, g) => sum + g.base_value_cents + g.earned_value_cents, 0
        );
        setTotalMarketValue((paletteTotal + gamecardTotal) / 100);

        // Simulated recent activities
        setActivities([
          { id: '1', type: 'print', description: 'Print order completed', value: 49.99, timestamp: new Date(Date.now() - 120000) },
          { id: '2', type: 'trade', description: 'Vision traded', value: 125, timestamp: new Date(Date.now() - 300000) },
          { id: '3', type: 'listing', description: 'New marketplace listing', timestamp: new Date(Date.now() - 600000) },
        ]);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();

    // Set up realtime subscription for live updates
    const channel = supabase
      .channel('market-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visualization_listings' },
        (payload) => {
          const activity: MarketActivity = {
            id: crypto.randomUUID(),
            type: payload.new && (payload.new as { status?: string }).status === 'sold' ? 'sale' : 'listing',
            description: payload.new && (payload.new as { status?: string }).status === 'sold' 
              ? 'Vision sold!' 
              : 'New listing added',
            value: payload.new ? ((payload.new as { price_cents?: number }).price_cents || 0) / 100 : undefined,
            timestamp: new Date(),
          };
          setActivities(prev => [activity, ...prev].slice(0, 5));
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_financials' },
        (payload) => {
          const activity: MarketActivity = {
            id: crypto.randomUUID(),
            type: 'print',
            description: `${(payload.new as { order_type?: string }).order_type || 'Order'} completed`,
            value: ((payload.new as { gross_revenue_cents?: number }).gross_revenue_cents || 0) / 100,
            timestamp: new Date(),
          };
          setActivities(prev => [activity, ...prev].slice(0, 5));
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getActivityIcon = (type: MarketActivity['type']) => {
    switch (type) {
      case 'sale': return <DollarSign className="h-3 w-3 text-green-500" />;
      case 'print': return <Sparkles className="h-3 w-3 text-primary" />;
      case 'trade': return <TrendingUp className="h-3 w-3 text-blue-500" />;
      case 'listing': return <Activity className="h-3 w-3 text-amber-500" />;
    }
  };

  return (
    <section ref={ref} className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 overflow-hidden backdrop-blur-sm"
          >
            {/* Header with Live Indicator */}
            <div className="p-4 md:p-6 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  {/* Pulsing live indicator */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wide text-sm md:text-lg flex items-center gap-2">
                    Live Market Activity
                    <span className="text-[10px] font-normal text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-serif">
                    Value pools & real-time transactions
                  </p>
                </div>
              </div>
              
              {isAdmin && (
                <Link 
                  to="/admin/economics"
                  className="inline-flex items-center gap-1 text-xs font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                >
                  CEO Dashboard
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Total Market Value */}
                <div className="md:col-span-1">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border border-primary/30 relative overflow-hidden h-full">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Total Value Pools
                        </span>
                      </div>
                      <p className="text-2xl md:text-3xl font-display font-bold text-primary mb-1">
                        {isLoading ? '...' : `$${totalMarketValue.toLocaleString()}`}
                      </p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Growing with every order
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Updated {formatTimeAgo(lastUpdate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value Pools */}
                <div className="md:col-span-1 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <span className="text-sm font-display uppercase tracking-wider">
                      Top Value Pools
                    </span>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 rounded-lg bg-card/50 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {valuePools.map((pool, index) => (
                        <motion.div
                          key={pool.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-2 rounded-lg bg-card/40 border border-border/30 hover:border-primary/30 transition-colors"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            pool.type === 'palette' 
                              ? 'bg-amber-500/20 text-amber-500' 
                              : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {pool.type === 'palette' ? (
                              <Palette className="h-3 w-3" />
                            ) : (
                              <Gamepad2 className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{pool.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ${pool.totalValue.toFixed(0)}
                            </p>
                          </div>
                          <div className={`text-xs flex items-center gap-0.5 ${
                            pool.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {pool.change24h >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(pool.change24h).toFixed(1)}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Activity Feed */}
                <div className="md:col-span-1 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-display uppercase tracking-wider">
                      Recent Activity
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/20"
                        >
                          {getActivityIcon(activity.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{activity.description}</p>
                            {activity.value && (
                              <p className="text-[10px] text-primary font-medium">
                                ${activity.value.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Transparency Note */}
              <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Crown className="h-3 w-3 text-primary" />
                  20% of every sale grows these pools • Full transparency on{' '}
                  <Link to="/admin/economics" className="text-primary hover:underline">
                    economics page
                  </Link>
                </p>
                {isPremium && (
                  <Link 
                    to="/premium-analytics"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    Detailed Analytics <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

LiveMarketWidget.displayName = 'LiveMarketWidget';

export default LiveMarketWidget;
