import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Trophy, Crown, Medal, Star, Eye, Heart, Palette, 
  TrendingUp, Sparkles, ChevronRight, User, Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CreatorStats {
  userId: string;
  displayName: string;
  visualizations: number;
  favorites: number;
  palettes: number;
  totalScore: number;
  rank: number;
}

// Projected baseline creators for early-stage display
const PROJECTED_CREATORS: Omit<CreatorStats, 'rank'>[] = [
  { userId: 'proj-1', displayName: 'ChessMaster_Art', visualizations: 47, favorites: 28, palettes: 12, totalScore: 182 },
  { userId: 'proj-2', displayName: 'KingsPawn', visualizations: 39, favorites: 34, palettes: 8, totalScore: 164 },
  { userId: 'proj-3', displayName: 'QueensGambit', visualizations: 35, favorites: 22, palettes: 15, totalScore: 152 },
  { userId: 'proj-4', displayName: 'SicilianDefender', visualizations: 31, favorites: 19, palettes: 11, totalScore: 130 },
  { userId: 'proj-5', displayName: 'RookEndgame', visualizations: 28, favorites: 25, palettes: 6, totalScore: 118 },
  { userId: 'proj-6', displayName: 'BishopPair', visualizations: 26, favorites: 18, palettes: 9, totalScore: 106 },
  { userId: 'proj-7', displayName: 'KnightRider64', visualizations: 24, favorites: 21, palettes: 5, totalScore: 100 },
  { userId: 'proj-8', displayName: 'EnPassantPro', visualizations: 22, favorites: 16, palettes: 8, totalScore: 92 },
  { userId: 'proj-9', displayName: 'CastleKing', visualizations: 20, favorites: 14, palettes: 7, totalScore: 82 },
  { userId: 'proj-10', displayName: 'PawnStorm', visualizations: 18, favorites: 12, palettes: 6, totalScore: 72 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="w-6 h-6 flex items-center justify-center text-sm font-display text-muted-foreground">{rank}</span>;
  }
};

const getRankBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/40';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/40';
    default:
      return 'bg-card/50 border-border/50';
  }
};

const Leaderboard = () => {
  const { user, isPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [creators, setCreators] = useState<CreatorStats[]>([]);
  const [userRank, setUserRank] = useState<CreatorStats | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all visualizations with user_id
        const [vizResult, favResult, paletteResult, profilesResult] = await Promise.all([
          supabase.from('saved_visualizations').select('user_id'),
          supabase.from('favorite_games').select('user_id'),
          supabase.from('saved_palettes').select('user_id'),
          supabase.from('profiles').select('user_id, display_name')
        ]);

        // Aggregate stats by user
        const userStats: Record<string, { visualizations: number; favorites: number; palettes: number }> = {};
        
        vizResult.data?.forEach(v => {
          if (!userStats[v.user_id]) {
            userStats[v.user_id] = { visualizations: 0, favorites: 0, palettes: 0 };
          }
          userStats[v.user_id].visualizations++;
        });

        favResult.data?.forEach(f => {
          if (!userStats[f.user_id]) {
            userStats[f.user_id] = { visualizations: 0, favorites: 0, palettes: 0 };
          }
          userStats[f.user_id].favorites++;
        });

        paletteResult.data?.forEach(p => {
          if (!userStats[p.user_id]) {
            userStats[p.user_id] = { visualizations: 0, favorites: 0, palettes: 0 };
          }
          userStats[p.user_id].palettes++;
        });

        // Create profiles map
        const profilesMap: Record<string, string> = {};
        profilesResult.data?.forEach(p => {
          profilesMap[p.user_id] = p.display_name || 'Anonymous Artist';
        });

        // Calculate scores and create sorted list
        const realCreators: CreatorStats[] = Object.entries(userStats)
          .map(([userId, stats]) => ({
            userId,
            displayName: profilesMap[userId] || 'Anonymous Artist',
            visualizations: stats.visualizations,
            favorites: stats.favorites,
            palettes: stats.palettes,
            totalScore: (stats.visualizations * 3) + (stats.favorites * 2) + (stats.palettes * 2),
            rank: 0
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        // Merge with projected creators
        let allCreators = [...realCreators];
        
        // Add projected creators with adjusted scores if we have few real creators
        if (realCreators.length < 10) {
          const neededProjected = 10 - realCreators.length;
          const projectedToAdd = PROJECTED_CREATORS.slice(0, neededProjected).map(p => ({
            ...p,
            rank: 0
          }));
          allCreators = [...realCreators, ...projectedToAdd];
        }

        // Sort and assign ranks
        allCreators.sort((a, b) => b.totalScore - a.totalScore);
        allCreators = allCreators.map((creator, index) => ({
          ...creator,
          rank: index + 1
        }));

        setCreators(allCreators.slice(0, 25));

        // Find current user's rank
        if (user) {
          const userCreator = allCreators.find(c => c.userId === user.id);
          if (userCreator) {
            setUserRank(userCreator);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to projected data
        setCreators(PROJECTED_CREATORS.map((c, i) => ({ ...c, rank: i + 1 })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, timeframe]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Trophy className="h-4 w-4" />
              Creator Rankings
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Community <span className="text-gold-gradient">Leaderboard</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
              Celebrating the most active artists and curators in our chess visualization community.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex justify-center gap-2">
            {(['all', 'month', 'week'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-display uppercase tracking-wider transition-all ${
                  timeframe === tf 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/50 border border-border/50 text-muted-foreground hover:border-primary/30'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>

          {/* Current User Rank Card */}
          {user && userRank && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-display uppercase tracking-wider">Your Rank</p>
                    <p className="text-3xl font-display font-bold">#{userRank.rank}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold">{userRank.visualizations}</p>
                    <p className="text-xs text-muted-foreground font-display uppercase">Artworks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold">{userRank.favorites}</p>
                    <p className="text-xs text-muted-foreground font-display uppercase">Favorites</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold">{userRank.totalScore}</p>
                    <p className="text-xs text-muted-foreground font-display uppercase">Score</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Top 3 Podium */}
          <div className="grid md:grid-cols-3 gap-4">
            {creators.slice(0, 3).map((creator, index) => {
              const positions = [1, 0, 2]; // Center first place
              const podiumOrder = positions[index];
              const actualCreator = creators[podiumOrder];
              if (!actualCreator) return null;

              return (
                <motion.div
                  key={actualCreator.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-lg border ${getRankBadgeStyle(actualCreator.rank)} ${
                    actualCreator.rank === 1 ? 'md:scale-105 md:-translate-y-2' : ''
                  }`}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center mx-auto">
                      {getRankIcon(actualCreator.rank)}
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg">{actualCreator.displayName}</p>
                      <p className="text-sm text-muted-foreground font-serif">Rank #{actualCreator.rank}</p>
                    </div>
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{actualCreator.visualizations}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{actualCreator.favorites}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Palette className="h-3.5 w-3.5" />
                        <span>{actualCreator.palettes}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-2xl font-display font-bold text-primary">{actualCreator.totalScore}</p>
                      <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Total Score</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Full Leaderboard */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">Full Rankings</h2>
            </div>
            
            <div className="rounded-lg border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-card/80 border-b border-border/30 text-xs font-display uppercase tracking-wider text-muted-foreground">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Creator</div>
                <div className="col-span-2 text-center">Artworks</div>
                <div className="col-span-2 text-center">Favorites</div>
                <div className="col-span-2 text-center">Score</div>
              </div>
              
              {/* Rows */}
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground font-serif">
                  Loading rankings...
                </div>
              ) : (
                creators.map((creator, index) => (
                  <motion.div
                    key={creator.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-border/20 hover:bg-card/50 transition-colors ${
                      user && creator.userId === user.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      {getRankIcon(creator.rank)}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary/70" />
                      </div>
                      <span className="font-display font-medium truncate">{creator.displayName}</span>
                      {creator.rank <= 3 && (
                        <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-display">{creator.visualizations}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-display">{creator.favorites}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-display font-bold text-primary">{creator.totalScore}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Scoring Explanation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg border border-border/50 bg-card/30"
          >
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              How Scoring Works
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <Eye className="h-5 w-5 text-primary/70" />
                <div>
                  <p className="font-display font-medium">Visualizations</p>
                  <p className="text-xs text-muted-foreground">3 points each</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <Heart className="h-5 w-5 text-primary/70" />
                <div>
                  <p className="font-display font-medium">Game Favorites</p>
                  <p className="text-xs text-muted-foreground">2 points each</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <Palette className="h-5 w-5 text-primary/70" />
                <div>
                  <p className="font-display font-medium">Custom Palettes</p>
                  <p className="text-xs text-muted-foreground">2 points each</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
            >
              Create Your Visualization
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
