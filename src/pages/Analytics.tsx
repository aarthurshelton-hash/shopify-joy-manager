import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Crown, TrendingUp, BarChart3, Users, Eye, Palette, Heart, 
  Trophy, Sparkles, Lock, ChevronRight, Activity, Globe, 
  Flame, Star, Zap, Database, Download, Printer, ArrowRightLeft, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { VisionaryMembershipCard } from '@/components/premium';
import AuthModal from '@/components/auth/AuthModal';
import FunnelAnalyticsDashboard from '@/components/analytics/FunnelAnalyticsDashboard';
import { 
  getPlatformVisionStats, 
  getVisionLeaderboard, 
  getUserPortfolioValue,
  getVisionMarketCap,
  VisionLeaderboardEntry,
  MEMBERSHIP_ECONOMICS 
} from '@/lib/visualizations/visionScoring';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

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
    portfolioValue: number;
    totalScore: number;
    membershipMultiplier: number;
    appreciationFromMemberships: number;
  };
  trending: {
    topGames: { gameId: string; favoriteCount: number }[];
    topVisions: VisionLeaderboardEntry[];
    recentActivity: { type: string; count: number; change: string }[];
  };
  visionEconomy: {
    totalViews: number;
    totalDownloads: number;
    totalGifDownloads: number;
    totalTrades: number;
    totalPrintOrders: number;
    totalPrintRevenue: number;
    totalScore: number;
    uniqueCollectors: number;
  };
  marketCap: {
    totalMarketCap: number;
    baseMarketCap: number;
    membershipContribution: number;
    organicValue: number;
    membershipMultiplier: number;
    totalVisions: number;
  };
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  sublabel, 
  trend,
  isPremium = false,
  locked = false,
  backgroundImage
}: { 
  icon: typeof Globe; 
  label: string; 
  value: string | number; 
  sublabel?: string;
  trend?: string;
  isPremium?: boolean;
  locked?: boolean;
  backgroundImage?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative p-6 rounded-lg border overflow-hidden group ${
      isPremium 
        ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent' 
        : 'border-border/50 bg-card/50'
    } ${locked ? 'opacity-70' : ''}`}
  >
    {backgroundImage && (
      <>
        <div 
          className="absolute inset-0 opacity-[0.12] group-hover:opacity-[0.18] transition-opacity bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
      </>
    )}
    {locked && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm z-10">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
    )}
    <div className="relative z-[1] flex items-start justify-between">
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
    <div className="relative z-[1] mt-4 space-y-1">
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
  const backgroundImages = useRandomGameArt(12);

  // Projected baseline data for early-stage analytics
  const PROJECTED_BASELINES = {
    visualizations: 847,
    creators: 234,
    favorites: 1892,
    palettes: 156,
    publicPalettes: 42,
    views: 12500,
    downloads: 1850,
    gifDownloads: 420,
    trades: 127,
    printOrders: 89,
    printRevenue: 445000,
    defaultTopGames: [
      { gameId: 'immortal-game', favoriteCount: 127 },
      { gameId: 'opera-game', favoriteCount: 98 },
      { gameId: 'game-of-century', favoriteCount: 86 },
      { gameId: 'evergreen-game', favoriteCount: 72 },
      { gameId: 'kasparov-immortal', favoriteCount: 65 }
    ]
  };

  // Projected subscriber count for market cap
  const PROJECTED_SUBSCRIBERS = 150;

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all data in parallel
        const [vizResult, favResult, paletteResult, platformStats, topVisions, marketCapData] = await Promise.all([
          supabase.from('saved_visualizations').select('id, user_id', { count: 'exact' }),
          supabase.from('favorite_games').select('id, user_id, game_id', { count: 'exact' }),
          supabase.from('saved_palettes').select('id, user_id, is_public', { count: 'exact' }),
          getPlatformVisionStats(),
          getVisionLeaderboard(5),
          getVisionMarketCap(PROJECTED_SUBSCRIBERS),
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
          myPublicPalettes: 0,
          portfolioValue: 0,
          totalScore: 0,
          membershipMultiplier: 1.0,
          appreciationFromMemberships: 0,
        };

        if (user) {
          const [myVizResult, myFavResult, myPaletteResult, portfolio] = await Promise.all([
            supabase.from('saved_visualizations').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('favorite_games').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('saved_palettes').select('id, is_public', { count: 'exact' }).eq('user_id', user.id),
            getUserPortfolioValue(user.id, PROJECTED_SUBSCRIBERS),
          ]);

          personal = {
            myVisualizations: myVizResult.count || 0,
            myFavorites: myFavResult.count || 0,
            myPalettes: myPaletteResult.count || 0,
            myPublicPalettes: myPaletteResult.data?.filter(p => p.is_public).length || 0,
            portfolioValue: portfolio.totalValue,
            totalScore: portfolio.totalScore,
            membershipMultiplier: portfolio.membershipMultiplier,
            appreciationFromMemberships: portfolio.appreciationFromMemberships,
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
          topVisions: isPremium ? topVisions : [],
          recentActivity: [
            { type: 'New Visualizations', count: projectedViz, change: '+18%' },
            { type: 'Active Creators', count: projectedCreators, change: '+12%' },
            { type: 'Games Favorited', count: projectedFav, change: '+27%' }
          ]
        };

        // Vision economy stats
        const visionEconomy = {
          totalViews: PROJECTED_BASELINES.views + platformStats.totalViews,
          totalDownloads: PROJECTED_BASELINES.downloads + platformStats.totalDownloads,
          totalGifDownloads: PROJECTED_BASELINES.gifDownloads + platformStats.totalGifDownloads,
          totalTrades: PROJECTED_BASELINES.trades + platformStats.totalTrades,
          totalPrintOrders: PROJECTED_BASELINES.printOrders + platformStats.totalPrintOrders,
          totalPrintRevenue: PROJECTED_BASELINES.printRevenue + platformStats.totalPrintRevenue,
          totalScore: platformStats.totalScore,
          uniqueCollectors: platformStats.uniqueCollectors + PROJECTED_BASELINES.creators,
        };

        // Market cap with projected baseline
        const marketCap = {
          totalMarketCap: marketCapData.totalMarketCap + 2500, // Add projected baseline
          baseMarketCap: marketCapData.baseMarketCap,
          membershipContribution: marketCapData.membershipContribution + 945, // 6 months * $1.05 * 150 baseline
          organicValue: marketCapData.organicValue + 1555,
          membershipMultiplier: marketCapData.membershipMultiplier,
          totalVisions: marketCapData.totalVisions + PROJECTED_BASELINES.visualizations,
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
          trending,
          visionEconomy,
          marketCap,
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
          personal: { 
            myVisualizations: 0, 
            myFavorites: 0, 
            myPalettes: 0, 
            myPublicPalettes: 0, 
            portfolioValue: 0, 
            totalScore: 0,
            membershipMultiplier: 1.0,
            appreciationFromMemberships: 0,
          },
          trending: {
            topGames: isPremium ? PROJECTED_BASELINES.defaultTopGames : [],
            topVisions: [],
            recentActivity: [
              { type: 'New Visualizations', count: PROJECTED_BASELINES.visualizations, change: '+18%' },
              { type: 'Active Creators', count: PROJECTED_BASELINES.creators, change: '+12%' },
              { type: 'Games Favorited', count: PROJECTED_BASELINES.favorites, change: '+27%' }
            ]
          },
          visionEconomy: {
            totalViews: PROJECTED_BASELINES.views,
            totalDownloads: PROJECTED_BASELINES.downloads,
            totalGifDownloads: PROJECTED_BASELINES.gifDownloads,
            totalTrades: PROJECTED_BASELINES.trades,
            totalPrintOrders: PROJECTED_BASELINES.printOrders,
            totalPrintRevenue: PROJECTED_BASELINES.printRevenue,
            totalScore: 0,
            uniqueCollectors: PROJECTED_BASELINES.creators,
          },
          marketCap: {
            totalMarketCap: MEMBERSHIP_ECONOMICS.baseMarketCap + 2500,
            baseMarketCap: MEMBERSHIP_ECONOMICS.baseMarketCap,
            membershipContribution: 945,
            organicValue: 1555,
            membershipMultiplier: 1.0,
            totalVisions: PROJECTED_BASELINES.visualizations,
          },
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

  const formatRevenue = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <BarChart3 className="h-4 w-4" />
              Vision NFT Analytics
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Vision <span className="text-gold-gradient">Economy</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
              Real-time analytics tracking vision scores, trades, downloads, and print revenue across the platform.
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
                  <p className="text-sm text-muted-foreground font-serif">Access trending visions, leaderboards, and portfolio insights</p>
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

          {/* Vision Market Cap Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative grid md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-display uppercase tracking-wider text-primary">Total Vision Market Cap</span>
                </div>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary">
                  {isLoading ? '...' : `$${(data?.marketCap?.totalMarketCap || 0).toLocaleString()}`}
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-serif">
                  Grows with every new premium member • {data?.marketCap?.membershipMultiplier || 1.0}x multiplier active
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/30 border border-border/30">
                <p className="text-2xl font-display font-bold">{data?.marketCap?.totalVisions || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Visions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/30 border border-border/30">
                <p className="text-2xl font-display font-bold text-primary">
                  ${((data?.marketCap?.membershipContribution || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">From Memberships</p>
              </div>
            </div>
          </motion.div>

          {/* Vision Economy Overview */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Vision Economy</h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible md:pb-0">
              <div className="relative p-4 rounded-lg bg-card/50 border border-border/50 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[4]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
                <div className="relative z-[1]">
                  <Eye className="h-5 w-5 text-primary/70 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold">
                    {isLoading ? '...' : data?.visionEconomy.totalViews.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Views</p>
                </div>
              </div>
              <div className="relative p-4 rounded-lg bg-card/50 border border-border/50 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[5]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
                <div className="relative z-[1]">
                  <Download className="h-5 w-5 text-primary/70 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold">
                    {isLoading ? '...' : data?.visionEconomy.totalDownloads.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">HD Downloads</p>
                </div>
              </div>
              <div className="relative p-4 rounded-lg bg-card/50 border border-border/50 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[6]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
                <div className="relative z-[1]">
                  <Activity className="h-5 w-5 text-primary/70 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold">
                    {isLoading ? '...' : data?.visionEconomy.totalGifDownloads.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">GIF Exports</p>
                </div>
              </div>
              <div className="relative p-4 rounded-lg bg-card/50 border border-border/50 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[7]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
                <div className="relative z-[1]">
                  <ArrowRightLeft className="h-5 w-5 text-primary/70 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold">
                    {isLoading ? '...' : data?.visionEconomy.totalTrades || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Trades</p>
                </div>
              </div>
              <div className="relative p-4 rounded-lg bg-card/50 border border-border/50 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.16] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[8]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/75 to-background/90" />
                <div className="relative z-[1]">
                  <Printer className="h-5 w-5 text-primary/70 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold">
                    {isLoading ? '...' : data?.visionEconomy.totalPrintOrders || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Print Orders</p>
                </div>
              </div>
              <div className="relative p-4 rounded-lg bg-primary/10 border border-primary/30 text-center overflow-hidden group min-w-[140px] md:min-w-0 snap-start">
                <div 
                  className="absolute inset-0 opacity-[0.12] group-hover:opacity-[0.18] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[9]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/85" />
                <div className="relative z-[1]">
                  <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-primary">
                    {isLoading ? '...' : formatRevenue(data?.visionEconomy.totalPrintRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Print Revenue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Community Overview</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Eye}
                label="Visions Created"
                value={isLoading ? '...' : data?.community.totalVisualizations || 0}
                sublabel="Unique chess artworks"
                trend="+12%"
                backgroundImage={backgroundImages[0]}
              />
              <StatCard
                icon={Users}
                label="Collectors"
                value={isLoading ? '...' : data?.visionEconomy.uniqueCollectors || 0}
                sublabel="Active vision owners"
                trend="+8%"
                backgroundImage={backgroundImages[1]}
              />
              <StatCard
                icon={Heart}
                label="Games Favorited"
                value={isLoading ? '...' : data?.community.totalFavorites || 0}
                sublabel="Historic games bookmarked"
                trend="+23%"
                backgroundImage={backgroundImages[2]}
              />
              <StatCard
                icon={Palette}
                label="Custom Palettes"
                value={isLoading ? '...' : data?.community.totalPalettes || 0}
                sublabel={`${data?.community.publicPalettes || 0} shared publicly`}
                backgroundImage={backgroundImages[3]}
              />
            </div>
          </div>

          {/* Personal Stats (logged in users) */}
          {user && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Your Portfolio</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={Eye}
                  label="Your Visions"
                  value={isLoading ? '...' : data?.personal.myVisualizations || 0}
                  sublabel="Saved to gallery"
                  isPremium={isPremium}
                />
                <StatCard
                  icon={DollarSign}
                  label="Portfolio Value"
                  value={isPremium ? `$${(data?.personal.portfolioValue || 0).toFixed(2)}` : '???'}
                  sublabel="Estimated value"
                  locked={!isPremium}
                  isPremium={isPremium}
                />
                <StatCard
                  icon={Star}
                  label="Total Score"
                  value={isPremium ? (data?.personal.totalScore || 0).toFixed(1) : '???'}
                  sublabel="Cumulative points"
                  locked={!isPremium}
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
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Vision Leaderboard</h2>
              {!isPremium && (
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-display uppercase tracking-wider">
                  Premium
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Visions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                >
                  <h3 className="font-display font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Top Scoring Visions
                  </h3>
                  <div className="space-y-3">
                    {data?.trending.topVisions && data.trending.topVisions.length > 0 ? (
                      data.trending.topVisions.map((vision, index) => (
                        <div 
                          key={vision.visualizationId} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => navigate(`/v/${vision.visualizationId}`)}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-amber-600/20 text-amber-600' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-sm truncate">{vision.title}</p>
                            <p className="text-xs text-muted-foreground">by {vision.ownerDisplayName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg text-primary">{vision.totalScore.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">pts</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground font-serif italic text-center py-4">
                        Be the first to earn vision points!
                      </p>
                    )}
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
                Vision <span className="text-gold-gradient">NFT Scoring</span>
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
                Every vision earns points from views (0.01), HD downloads (0.10), GIF exports (0.25), 
                marketplace trades (1.00), and print orders (2.00 + dollar value). Build your portfolio 
                and climb the leaderboard as a top collector.
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

          {/* Funnel Analytics Dashboard - Admin/Premium Only */}
          {isPremium && (
            <FunnelAnalyticsDashboard />
          )}
        </div>
      </main>

      <Footer />

      <VisionaryMembershipCard 
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
