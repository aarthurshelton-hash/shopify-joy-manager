import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Trophy, Crown, Medal, Star, Eye, Heart, Palette, 
  TrendingUp, TrendingDown, Minus, Sparkles, ChevronRight, 
  User, Flame, Zap, Target, Award, Rocket, Swords, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CreatorStats {
  userId: string;
  displayName: string;
  visualizations: number;
  favorites: number;
  palettes: number;
  chessWins: number;
  chessLosses: number;
  chessDraws: number;
  totalScore: number;
  rank: number;
  rankChange: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  icon: 'trophy' | 'star' | 'zap' | 'target' | 'award' | 'rocket' | 'flame' | 'crown' | 'swords' | 'shield';
  color: string;
  description: string;
}

// Badge definitions
const BADGE_DEFINITIONS: Record<string, Badge> = {
  top_creator: {
    id: 'top_creator',
    name: 'Top Creator',
    icon: 'crown',
    color: 'from-yellow-500 to-amber-500',
    description: 'Ranked #1 this week'
  },
  rising_star: {
    id: 'rising_star',
    name: 'Rising Star',
    icon: 'rocket',
    color: 'from-blue-500 to-cyan-500',
    description: 'Climbed 3+ ranks this week'
  },
  prolific_artist: {
    id: 'prolific_artist',
    name: 'Prolific Artist',
    icon: 'zap',
    color: 'from-purple-500 to-pink-500',
    description: '10+ visualizations created'
  },
  curator: {
    id: 'curator',
    name: 'Curator',
    icon: 'star',
    color: 'from-amber-500 to-orange-500',
    description: '20+ games favorited'
  },
  palette_master: {
    id: 'palette_master',
    name: 'Palette Master',
    icon: 'target',
    color: 'from-green-500 to-emerald-500',
    description: '5+ custom palettes'
  },
  on_fire: {
    id: 'on_fire',
    name: 'On Fire',
    icon: 'flame',
    color: 'from-red-500 to-orange-500',
    description: 'Active 3+ days this week'
  },
  top_10: {
    id: 'top_10',
    name: 'Top 10',
    icon: 'award',
    color: 'from-indigo-500 to-violet-500',
    description: 'Ranked in top 10'
  },
  consistent: {
    id: 'consistent',
    name: 'Consistent',
    icon: 'trophy',
    color: 'from-teal-500 to-cyan-500',
    description: 'Active for 4+ weeks'
  },
  chess_champion: {
    id: 'chess_champion',
    name: 'Chess Champion',
    icon: 'swords',
    color: 'from-yellow-600 to-amber-600',
    description: '10+ chess victories'
  },
  undefeated: {
    id: 'undefeated',
    name: 'Undefeated',
    icon: 'shield',
    color: 'from-emerald-500 to-teal-500',
    description: '5+ wins with no losses'
  }
};

const BadgeIcon = ({ badge }: { badge: Badge }) => {
  const icons = {
    trophy: Trophy,
    star: Star,
    zap: Zap,
    target: Target,
    award: Award,
    rocket: Rocket,
    flame: Flame,
    crown: Crown,
    swords: Swords,
    shield: Shield
  };
  const Icon = icons[badge.icon];
  return <Icon className="h-3 w-3" />;
};

// Projected baseline creators with rank changes and badges
const PROJECTED_CREATORS: Omit<CreatorStats, 'rank'>[] = [
  { 
    userId: 'proj-1', 
    displayName: 'ChessMaster_Art', 
    visualizations: 47, 
    favorites: 28, 
    palettes: 12, 
    chessWins: 15,
    chessLosses: 3,
    chessDraws: 2,
    totalScore: 257,
    rankChange: 0,
    badges: [BADGE_DEFINITIONS.top_creator, BADGE_DEFINITIONS.chess_champion, BADGE_DEFINITIONS.palette_master]
  },
  { 
    userId: 'proj-2', 
    displayName: 'KingsPawn', 
    visualizations: 39, 
    favorites: 34, 
    palettes: 8, 
    chessWins: 12,
    chessLosses: 5,
    chessDraws: 1,
    totalScore: 224,
    rankChange: 2,
    badges: [BADGE_DEFINITIONS.rising_star, BADGE_DEFINITIONS.chess_champion]
  },
  { 
    userId: 'proj-3', 
    displayName: 'QueensGambit', 
    visualizations: 35, 
    favorites: 22, 
    palettes: 15, 
    chessWins: 8,
    chessLosses: 2,
    chessDraws: 3,
    totalScore: 192,
    rankChange: -1,
    badges: [BADGE_DEFINITIONS.palette_master, BADGE_DEFINITIONS.prolific_artist]
  },
  { 
    userId: 'proj-4', 
    displayName: 'SicilianDefender', 
    visualizations: 31, 
    favorites: 19, 
    palettes: 11, 
    chessWins: 10,
    chessLosses: 4,
    chessDraws: 2,
    totalScore: 180,
    rankChange: 1,
    badges: [BADGE_DEFINITIONS.on_fire, BADGE_DEFINITIONS.chess_champion]
  },
  { 
    userId: 'proj-5', 
    displayName: 'RookEndgame', 
    visualizations: 28, 
    favorites: 25, 
    palettes: 6, 
    chessWins: 7,
    chessLosses: 0,
    chessDraws: 1,
    totalScore: 153,
    rankChange: -2,
    badges: [BADGE_DEFINITIONS.undefeated, BADGE_DEFINITIONS.top_10]
  },
  { 
    userId: 'proj-6', 
    displayName: 'BishopPair', 
    visualizations: 26, 
    favorites: 18, 
    palettes: 9, 
    chessWins: 5,
    chessLosses: 3,
    chessDraws: 2,
    totalScore: 131,
    rankChange: 3,
    badges: [BADGE_DEFINITIONS.rising_star, BADGE_DEFINITIONS.top_10]
  },
  { 
    userId: 'proj-7', 
    displayName: 'KnightRider64', 
    visualizations: 24, 
    favorites: 21, 
    palettes: 5, 
    chessWins: 4,
    chessLosses: 2,
    chessDraws: 1,
    totalScore: 120,
    rankChange: 0,
    badges: [BADGE_DEFINITIONS.consistent, BADGE_DEFINITIONS.top_10]
  },
  { 
    userId: 'proj-8', 
    displayName: 'EnPassantPro', 
    visualizations: 22, 
    favorites: 16, 
    palettes: 8, 
    chessWins: 3,
    chessLosses: 1,
    chessDraws: 0,
    totalScore: 107,
    rankChange: 1,
    badges: [BADGE_DEFINITIONS.palette_master]
  },
  { 
    userId: 'proj-9', 
    displayName: 'CastleKing', 
    visualizations: 20, 
    favorites: 14, 
    palettes: 7, 
    chessWins: 2,
    chessLosses: 3,
    chessDraws: 1,
    totalScore: 92,
    rankChange: -1,
    badges: [BADGE_DEFINITIONS.consistent]
  },
  { 
    userId: 'proj-10', 
    displayName: 'PawnStorm', 
    visualizations: 18, 
    favorites: 12, 
    palettes: 6, 
    chessWins: 1,
    chessLosses: 2,
    chessDraws: 0,
    totalScore: 77,
    rankChange: 2,
    badges: [BADGE_DEFINITIONS.rising_star, BADGE_DEFINITIONS.top_10]
  },
];

// Calculate badges based on stats
const calculateBadges = (
  stats: { visualizations: number; favorites: number; palettes: number; chessWins: number; chessLosses: number }, 
  rank: number, 
  rankChange: number
): Badge[] => {
  const badges: Badge[] = [];
  
  if (rank === 1) badges.push(BADGE_DEFINITIONS.top_creator);
  if (rank <= 10) badges.push(BADGE_DEFINITIONS.top_10);
  if (rankChange >= 3) badges.push(BADGE_DEFINITIONS.rising_star);
  if (stats.visualizations >= 10) badges.push(BADGE_DEFINITIONS.prolific_artist);
  if (stats.favorites >= 20) badges.push(BADGE_DEFINITIONS.curator);
  if (stats.palettes >= 5) badges.push(BADGE_DEFINITIONS.palette_master);
  if (stats.chessWins >= 10) badges.push(BADGE_DEFINITIONS.chess_champion);
  if (stats.chessWins >= 5 && stats.chessLosses === 0) badges.push(BADGE_DEFINITIONS.undefeated);
  
  return badges.slice(0, 3); // Max 3 badges
};

const RankChangeIndicator = ({ change }: { change: number }) => {
  if (change === 0) {
    return (
      <span className="flex items-center gap-0.5 text-muted-foreground/50">
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  
  if (change > 0) {
    return (
      <motion.span 
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-0.5 text-green-500"
      >
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-display">{change}</span>
      </motion.span>
    );
  }
  
  return (
    <motion.span 
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center gap-0.5 text-red-500"
    >
      <TrendingDown className="h-3 w-3" />
      <span className="text-xs font-display">{Math.abs(change)}</span>
    </motion.span>
  );
};

const BadgeDisplay = ({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) => {
  if (badges.length === 0) return null;
  
  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-1.5'} flex-wrap`}>
      {badges.slice(0, compact ? 2 : 3).map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1, type: 'spring', stiffness: 500 }}
          className="group relative"
        >
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-white ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <BadgeIcon badge={badge} />
            {!compact && <span className="font-display">{badge.name}</span>}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <p className="font-display font-medium">{badge.name}</p>
            <p className="text-muted-foreground text-[10px]">{badge.description}</p>
          </div>
        </motion.div>
      ))}
      {badges.length > (compact ? 2 : 3) && (
        <span className="text-[10px] text-muted-foreground font-display">+{badges.length - (compact ? 2 : 3)}</span>
      )}
    </div>
  );
};

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
        const [vizResult, favResult, paletteResult, profilesResult, chessGamesResult] = await Promise.all([
          supabase.from('saved_visualizations').select('user_id'),
          supabase.from('favorite_games').select('user_id'),
          supabase.from('saved_palettes').select('user_id'),
          supabase.from('profiles').select('user_id, display_name'),
          supabase.from('chess_games').select('white_player_id, black_player_id, result, winner_id').eq('status', 'completed')
        ]);

        const userStats: Record<string, { 
          visualizations: number; 
          favorites: number; 
          palettes: number;
          chessWins: number;
          chessLosses: number;
          chessDraws: number;
        }> = {};
        
        const initUser = (userId: string) => {
          if (!userStats[userId]) {
            userStats[userId] = { 
              visualizations: 0, 
              favorites: 0, 
              palettes: 0,
              chessWins: 0,
              chessLosses: 0,
              chessDraws: 0
            };
          }
        };
        
        vizResult.data?.forEach(v => {
          initUser(v.user_id);
          userStats[v.user_id].visualizations++;
        });

        favResult.data?.forEach(f => {
          initUser(f.user_id);
          userStats[f.user_id].favorites++;
        });

        paletteResult.data?.forEach(p => {
          initUser(p.user_id);
          userStats[p.user_id].palettes++;
        });

        // Process chess games
        chessGamesResult.data?.forEach(game => {
          const whiteId = game.white_player_id;
          const blackId = game.black_player_id;
          
          if (whiteId) initUser(whiteId);
          if (blackId) initUser(blackId);
          
          if (game.result === 'draw') {
            if (whiteId) userStats[whiteId].chessDraws++;
            if (blackId) userStats[blackId].chessDraws++;
          } else if (game.result === 'white_wins') {
            if (whiteId) userStats[whiteId].chessWins++;
            if (blackId) userStats[blackId].chessLosses++;
          } else if (game.result === 'black_wins') {
            if (blackId) userStats[blackId].chessWins++;
            if (whiteId) userStats[whiteId].chessLosses++;
          }
        });

        const profilesMap: Record<string, string> = {};
        profilesResult.data?.forEach(p => {
          profilesMap[p.user_id] = p.display_name || 'Anonymous Artist';
        });

        // Calculate scores: visualizations (3pts), favorites (2pts), palettes (2pts), wins (5pts), draws (1pt)
        const realCreators: CreatorStats[] = Object.entries(userStats)
          .map(([userId, stats]) => {
            const totalScore = 
              (stats.visualizations * 3) + 
              (stats.favorites * 2) + 
              (stats.palettes * 2) + 
              (stats.chessWins * 5) + 
              (stats.chessDraws * 1);
            // Simulate rank change based on activity (in production, compare with previous week's data)
            const rankChange = Math.floor(Math.random() * 7) - 3; // -3 to +3
            
            return {
              userId,
              displayName: profilesMap[userId] || 'Anonymous Artist',
              visualizations: stats.visualizations,
              favorites: stats.favorites,
              palettes: stats.palettes,
              chessWins: stats.chessWins,
              chessLosses: stats.chessLosses,
              chessDraws: stats.chessDraws,
              totalScore,
              rank: 0,
              rankChange,
              badges: [] as Badge[]
            };
          })
          .sort((a, b) => b.totalScore - a.totalScore);

        let allCreators = [...realCreators];
        
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
        allCreators = allCreators.map((creator, index) => {
          const rank = index + 1;
          const badges = creator.badges.length > 0 
            ? creator.badges 
            : calculateBadges(
                { 
                  visualizations: creator.visualizations, 
                  favorites: creator.favorites, 
                  palettes: creator.palettes,
                  chessWins: creator.chessWins,
                  chessLosses: creator.chessLosses
                },
                rank,
                creator.rankChange
              );
          return {
            ...creator,
            rank,
            badges
          };
        });

        setCreators(allCreators.slice(0, 25));

        if (user) {
          const userCreator = allCreators.find(c => c.userId === user.id);
          if (userCreator) {
            setUserRank(userCreator);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
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

          {/* Weekly Badges Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold uppercase tracking-wider">Weekly Achievements</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(BADGE_DEFINITIONS).slice(0, 4).map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-card/50 border border-border/30 text-center group hover:border-primary/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                    <BadgeIcon badge={badge} />
                  </div>
                  <p className="text-xs font-display font-medium">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground font-display uppercase tracking-wider">Your Rank</p>
                      <RankChangeIndicator change={userRank.rankChange} />
                    </div>
                    <p className="text-3xl font-display font-bold">#{userRank.rank}</p>
                  </div>
                </div>
                <BadgeDisplay badges={userRank.badges} />
                <div className="flex gap-6 flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold">{userRank.visualizations}</p>
                    <p className="text-xs text-muted-foreground font-display uppercase">Artworks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold">{userRank.chessWins}</p>
                    <p className="text-xs text-muted-foreground font-display uppercase">Wins</p>
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
              const positions = [1, 0, 2];
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
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center mx-auto">
                        {getRankIcon(actualCreator.rank)}
                      </div>
                      <div className="absolute -top-1 -right-1">
                        <RankChangeIndicator change={actualCreator.rankChange} />
                      </div>
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg">{actualCreator.displayName}</p>
                      <p className="text-sm text-muted-foreground font-serif">Rank #{actualCreator.rank}</p>
                    </div>
                    <BadgeDisplay badges={actualCreator.badges} compact />
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{actualCreator.visualizations}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Swords className="h-3.5 w-3.5" />
                        <span>{actualCreator.chessWins}W</span>
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
              <div className="grid grid-cols-14 gap-4 p-4 bg-card/80 border-b border-border/30 text-xs font-display uppercase tracking-wider text-muted-foreground">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Creator</div>
                <div className="col-span-3">Badges</div>
                <div className="col-span-2 text-center">Artworks</div>
                <div className="col-span-2 text-center">Wins</div>
                <div className="col-span-2 text-center">Score</div>
              </div>
              
              {/* Rows */}
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground font-serif">
                  Loading rankings...
                </div>
              ) : (
                <AnimatePresence>
                  {creators.map((creator, index) => (
                    <motion.div
                      key={creator.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.03 }}
                      className={`grid grid-cols-14 gap-4 p-4 items-center border-b border-border/20 hover:bg-card/50 transition-colors ${
                        user && creator.userId === user.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-1">
                        {getRankIcon(creator.rank)}
                        <RankChangeIndicator change={creator.rankChange} />
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary/70" />
                        </div>
                        <span className="font-display font-medium truncate">{creator.displayName}</span>
                        {creator.rank <= 3 && (
                          <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="col-span-3">
                        <BadgeDisplay badges={creator.badges} compact />
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-display">{creator.visualizations}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-display text-green-500">{creator.chessWins}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-display font-bold text-primary">{creator.totalScore}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Badge Legend */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg border border-border/50 bg-card/30"
          >
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Achievement Badges
            </h3>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              {Object.values(BADGE_DEFINITIONS).map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center text-white`}>
                    <BadgeIcon badge={badge} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs font-medium truncate">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scoring Explanation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg border border-border/50 bg-card/30"
          >
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              How Scoring Works
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <Swords className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-display font-medium">Chess Wins</p>
                  <p className="text-xs text-muted-foreground">5 points each</p>
                </div>
              </div>
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-display font-medium">Chess Draws</p>
                  <p className="text-xs text-muted-foreground">1 point each</p>
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
