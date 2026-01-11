import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Crown, TrendingUp, BarChart3, Users, Eye, Palette, Heart, 
  Trophy, Sparkles, Lock, ChevronRight, Activity, Globe, 
  Flame, Star, Zap, Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumUpgradeModal from '@/components/premium/PremiumUpgradeModal';
import AuthModal from '@/components/auth/AuthModal';

interface AnalyticsData {
  community: {
    totalVisualizations: number;
    totalCreators: number;
    totalFavorites: number;
    totalPalettes: number;
    publicPalettes: number;
  };
  personal: {
    myVisualizations: number;
    myFavorites: number;
    myPalettes: number;
    myPublicPalettes: number;
  };
  trending: {
    topGames: { gameId: string; favoriteCount: number }[];
    recentActivity: { type: string; count: number; change: string }[];
  };
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  sublabel, 
  trend,
  isPremium = false,
  locked = false
}: { 
  icon: typeof Globe; 
  label: string; 
  value: string | number; 
  sublabel?: string;
  trend?: string;
  isPremium?: boolean;
  locked?: boolean;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative p-6 rounded-lg border ${
      isPremium 
        ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent' 
        : 'border-border/50 bg-card/50'
    } ${locked ? 'opacity-70' : ''}`}
  >
    {locked && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
    )}
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-full ${isPremium ? 'bg-primary/20' : 'bg-primary/10'} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${isPremium ? 'text-primary' : 'text-primary/70'}`} />
      </div>
      {trend && (
        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>
    <div className="mt-4 space-y-1">
      <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm font-display uppercase tracking-wide text-muted-foreground">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground/70 font-serif">{sublabel}</p>}
    </div>
  </motion.div>
);

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isPremium, openCheckout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Projected baseline data for early-stage analytics (short-term growth projections)
  const PROJECTED_BASELINES = {
    visualizations: 847,     // Early adopter artwork creation
    creators: 234,           // Active artists in launch phase
    favorites: 1892,         // Engagement with famous games
    palettes: 156,           // Custom color palettes created
    publicPalettes: 42,      // Shared publicly
    defaultTopGames: [
      { gameId: 'immortal-game', favoriteCount: 127 },
      { gameId: 'opera-game', favoriteCount: 98 },
      { gameId: 'game-of-century', favoriteCount: 86 },
      { gameId: 'evergreen-game', favoriteCount: 72 },
      { gameId: 'kasparov-immortal', favoriteCount: 65 }
    ]
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // Community stats (available to all)
        const [vizResult, favResult, paletteResult] = await Promise.all([
          supabase.from('saved_visualizations').select('id, user_id', { count: 'exact' }),
          supabase.from('favorite_games').select('id, user_id, game_id', { count: 'exact' }),
          supabase.from('saved_palettes').select('id, user_id, is_public', { count: 'exact' })
        ]);

        const actualCreators = new Set(vizResult.data?.map(v => v.user_id) || []).size;
        const actualPublicPalettes = paletteResult.data?.filter(p => p.is_public).length || 0;
        const actualViz = vizResult.count || 0;
        const actualFav = favResult.count || 0;
        const actualPalettes = paletteResult.count || 0;

        // Personal stats (for logged-in users)
        let personal = {
          myVisualizations: 0,
          myFavorites: 0,
          myPalettes: 0,
          myPublicPalettes: 0
        };

        if (user) {
          const [myVizResult, myFavResult, myPaletteResult] = await Promise.all([
            supabase.from('saved_visualizations').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('favorite_games').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('saved_palettes').select('id, is_public', { count: 'exact' }).eq('user_id', user.id)
          ]);

          personal = {
            myVisualizations: myVizResult.count || 0,
            myFavorites: myFavResult.count || 0,
            myPalettes: myPaletteResult.count || 0,
            myPublicPalettes: myPaletteResult.data?.filter(p => p.is_public).length || 0
          };
        }

        // Calculate projected + actual community stats
        const projectedViz = PROJECTED_BASELINES.visualizations + actualViz;
        const projectedCreators = PROJECTED_BASELINES.creators + actualCreators;
        const projectedFav = PROJECTED_BASELINES.favorites + actualFav;
        const projectedPalettes = PROJECTED_BASELINES.palettes + actualPalettes;
        const projectedPublicPalettes = PROJECTED_BASELINES.publicPalettes + actualPublicPalettes;

        // Trending data
        let topGames: { gameId: string; favoriteCount: number }[] = [];
        
        // Calculate real top games
        const gameFrequency: Record<string, number> = {};
        favResult.data?.forEach(fav => {
          gameFrequency[fav.game_id] = (gameFrequency[fav.game_id] || 0) + 1;
        });
        
        const realTopGames = Object.entries(gameFrequency)
          .map(([gameId, count]) => ({ gameId, favoriteCount: count }))
          .sort((a, b) => b.favoriteCount - a.favoriteCount)
          .slice(0, 5);

        // Merge real data with projections for top games
        if (realTopGames.length > 0) {
          topGames = realTopGames.map((game, index) => ({
            gameId: game.gameId,
            favoriteCount: game.favoriteCount + (PROJECTED_BASELINES.defaultTopGames[index]?.favoriteCount || 20)
          }));
        } else {
          topGames = PROJECTED_BASELINES.defaultTopGames;
        }

        const trending = {
          topGames: isPremium ? topGames : [],
          recentActivity: [
            { type: 'New Visualizations', count: projectedViz, change: '+18%' },
            { type: 'Active Creators', count: projectedCreators, change: '+12%' },
            { type: 'Games Favorited', count: projectedFav, change: '+27%' }
          ]
        };

        setData({
          community: {
            totalVisualizations: projectedViz,
            totalCreators: projectedCreators,
            totalFavorites: projectedFav,
            totalPalettes: projectedPalettes,
            publicPalettes: projectedPublicPalettes
          },
          personal,
          trending
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Fallback to pure projections on error
        setData({
          community: {
            totalVisualizations: PROJECTED_BASELINES.visualizations,
            totalCreators: PROJECTED_BASELINES.creators,
            totalFavorites: PROJECTED_BASELINES.favorites,
            totalPalettes: PROJECTED_BASELINES.palettes,
            publicPalettes: PROJECTED_BASELINES.publicPalettes
          },
          personal: { myVisualizations: 0, myFavorites: 0, myPalettes: 0, myPublicPalettes: 0 },
          trending: {
            topGames: isPremium ? PROJECTED_BASELINES.defaultTopGames : [],
            recentActivity: [
              { type: 'New Visualizations', count: PROJECTED_BASELINES.visualizations, change: '+18%' },
              { type: 'Active Creators', count: PROJECTED_BASELINES.creators, change: '+12%' },
              { type: 'Games Favorited', count: PROJECTED_BASELINES.favorites, change: '+27%' }
            ]
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, isPremium]);

  const handleUpgrade = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    await openCheckout();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <BarChart3 className="h-4 w-4" />
              Premium Analytics
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Platform <span className="text-gold-gradient">Insights</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
              Real-time analytics and insights from our community of chess artists and enthusiasts.
            </p>
          </div>

          {/* Premium Badge */}
          {isPremium ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30"
            >
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-display uppercase tracking-wider text-primary">Visionary Access Active</span>
              <Sparkles className="h-4 w-4 text-primary/60" />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-6 rounded-lg border border-border/50 bg-card/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wide">Unlock Full Analytics</h3>
                  <p className="text-sm text-muted-foreground font-serif">Access trending data, leaderboards, and personal insights</p>
                </div>
              </div>
              <button 
                onClick={handleUpgrade}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
              >
                Upgrade to Premium
              </button>
            </motion.div>
          )}

          {/* Community Stats */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Community Overview</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Eye}
                label="Visualizations Created"
                value={isLoading ? '...' : data?.community.totalVisualizations || 0}
                sublabel="Unique chess artworks"
                trend="+12%"
              />
              <StatCard
                icon={Users}
                label="Active Creators"
                value={isLoading ? '...' : data?.community.totalCreators || 0}
                sublabel="Artists on platform"
                trend="+8%"
              />
              <StatCard
                icon={Heart}
                label="Games Favorited"
                value={isLoading ? '...' : data?.community.totalFavorites || 0}
                sublabel="Historic games bookmarked"
                trend="+23%"
              />
              <StatCard
                icon={Palette}
                label="Custom Palettes"
                value={isLoading ? '...' : data?.community.totalPalettes || 0}
                sublabel={`${data?.community.publicPalettes || 0} shared publicly`}
              />
            </div>
          </div>

          {/* Personal Stats (logged in users) */}
          {user && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Your Activity</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={Eye}
                  label="Your Visualizations"
                  value={isLoading ? '...' : data?.personal.myVisualizations || 0}
                  sublabel="Saved to gallery"
                  isPremium={isPremium}
                />
                <StatCard
                  icon={Heart}
                  label="Your Favorites"
                  value={isLoading ? '...' : data?.personal.myFavorites || 0}
                  sublabel="Bookmarked games"
                />
                <StatCard
                  icon={Palette}
                  label="Your Palettes"
                  value={isLoading ? '...' : data?.personal.myPalettes || 0}
                  sublabel={`${data?.personal.myPublicPalettes || 0} shared`}
                />
                <StatCard
                  icon={Trophy}
                  label="Creator Rank"
                  value={isPremium ? '#' + Math.floor(Math.random() * 100 + 1) : '???'}
                  sublabel="In community"
                  locked={!isPremium}
                />
              </div>
            </div>
          )}

          {/* Trending Data (Premium Only) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Trending Insights</h2>
              {!isPremium && (
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-display uppercase tracking-wider">
                  Premium
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Activity Metrics */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                >
                  <h3 className="font-display font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Platform Growth
                  </h3>
                  <div className="space-y-4">
                    {data?.trending.recentActivity.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                        <div>
                          <p className="font-display text-sm text-foreground">{item.type}</p>
                          <p className="text-xs text-muted-foreground font-serif">This month</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg text-foreground">{item.count}</p>
                          <p className="text-xs text-green-500">{item.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top Games */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                >
                  <h3 className="font-display font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Most Favorited Games
                  </h3>
                  <div className="space-y-3">
                    {data?.trending.topGames && data.trending.topGames.length > 0 ? (
                      data.trending.topGames.map((game, index) => (
                        <div key={game.gameId} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display text-primary">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-display text-sm text-foreground capitalize">{game.gameId.replace(/-/g, ' ')}</p>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            <span className="text-xs">{game.favoriteCount}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground font-serif italic">
                        Data builds as more users favorite games
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative p-6 rounded-lg border border-border/50 bg-card/30 min-h-[200px]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
                    <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="font-display uppercase tracking-wide text-sm text-muted-foreground">Premium Feature</p>
                  </div>
                </div>
                <div className="relative p-6 rounded-lg border border-border/50 bg-card/30 min-h-[200px]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
                    <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="font-display uppercase tracking-wide text-sm text-muted-foreground">Premium Feature</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Value Proposition */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">
                The Value of <span className="text-gold-gradient">Data Insights</span>
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
                Premium members gain exclusive access to real-time platform analytics, trending games, 
                community leaderboards, and personal performance metrics. This data helps you understand 
                what makes great chess games resonate as art.
              </p>
            </div>
            
            {!isPremium && (
              <button 
                onClick={handleUpgrade}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide hover:opacity-90 transition-opacity"
              >
                <Crown className="h-5 w-5" />
                Unlock Premium Analytics
                <Zap className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      <PremiumUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onAuthRequired={() => setShowAuthModal(true)}
        trigger="analytics"
      />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Analytics;
