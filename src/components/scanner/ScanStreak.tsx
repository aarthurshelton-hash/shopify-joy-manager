import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Crown, Star, Gift, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_scan_date: string | null;
  total_scan_days: number;
  scanned_today: boolean;
}

interface StreakReward {
  id: string;
  streak_day: number;
  reward_type: string;
  reward_value: number;
  claimed_date: string;
}

const REWARD_TIERS = [
  { day: 3, type: "common", icon: Star, color: "text-blue-400", bg: "bg-blue-500/20", label: "3 Day", value: 10 },
  { day: 7, type: "rare", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/20", label: "Weekly", value: 25 },
  { day: 14, type: "epic", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/20", label: "2 Week", value: 50 },
  { day: 30, type: "legendary", icon: Trophy, color: "text-red-400", bg: "bg-red-500/20", label: "Monthly", value: 100 },
];

export function ScanStreak() {
  const { user } = useAuth();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [recentRewards, setRecentRewards] = useState<StreakReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStreakInfo();
      fetchRecentRewards();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStreakInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc("get_user_streak", { p_user_id: user.id });
      if (error) throw error;
      setStreakInfo(data as unknown as StreakInfo);
    } catch (error) {
      console.error("Failed to fetch streak info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRewards = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("streak_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentRewards(data as StreakReward[]);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    }
  };

  if (!user) {
    return (
      <div className="p-4 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Flame className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sign in to track your scan streak</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-card/50 border border-border/50 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  const currentStreak = streakInfo?.current_streak || 0;
  const longestStreak = streakInfo?.longest_streak || 0;
  const scannedToday = streakInfo?.scanned_today || false;
  const nextTier = REWARD_TIERS.find(t => t.day > currentStreak) || REWARD_TIERS[REWARD_TIERS.length - 1];
  const daysToNext = Math.max(0, nextTier.day - currentStreak);

  // Calculate streak flame intensity based on streak length
  const flameIntensity = Math.min(100, currentStreak * 10);
  const flameColor = currentStreak >= 30 ? "text-red-500" : 
                     currentStreak >= 14 ? "text-amber-500" : 
                     currentStreak >= 7 ? "text-purple-500" : 
                     currentStreak >= 3 ? "text-blue-500" : "text-orange-400";

  return (
    <motion.div 
      layout
      className="rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/50 overflow-hidden"
    >
      {/* Main Streak Display */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Animated Flame */}
          <div className="relative">
            <motion.div
              animate={{
                scale: scannedToday ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: scannedToday ? Infinity : 0,
                repeatDelay: 1,
              }}
              className={`p-2 rounded-xl ${scannedToday ? 'bg-orange-500/20' : 'bg-muted'}`}
            >
              <Flame 
                className={`h-7 w-7 ${scannedToday ? flameColor : 'text-muted-foreground'}`} 
              />
            </motion.div>
            
            {/* Streak fire effect for active streaks */}
            {scannedToday && currentStreak >= 3 && (
              <motion.div
                className="absolute -inset-1 rounded-xl bg-gradient-to-t from-orange-500/30 to-red-500/0"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
              {scannedToday && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full"
                >
                  ✓ Today
                </motion.span>
              )}
            </div>
            {!scannedToday && currentStreak > 0 && (
              <p className="text-xs text-amber-400">
                Scan today to keep your streak!
              </p>
            )}
            {currentStreak === 0 && (
              <p className="text-xs text-muted-foreground">
                Start scanning to build your streak
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground">Best</div>
            <div className="font-semibold">{longestStreak} days</div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            ▼
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Progress to Next Tier */}
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Next reward</span>
                  <div className="flex items-center gap-1.5">
                    <nextTier.icon className={`h-4 w-4 ${nextTier.color}`} />
                    <span className="text-sm font-medium">{nextTier.label}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(100, (currentStreak / nextTier.day) * 100)}%` 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {daysToNext > 0 
                    ? `${daysToNext} more day${daysToNext > 1 ? 's' : ''} to ${nextTier.label} reward (+${nextTier.value} points)`
                    : `You've reached ${nextTier.label} tier!`
                  }
                </p>
              </div>

              {/* Reward Tiers */}
              <div className="grid grid-cols-4 gap-2">
                {REWARD_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  const achieved = currentStreak >= tier.day;
                  return (
                    <div
                      key={tier.day}
                      className={`p-2 rounded-lg text-center transition-all ${
                        achieved 
                          ? `${tier.bg} border border-current/20` 
                          : 'bg-muted/30 opacity-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${achieved ? tier.color : 'text-muted-foreground'}`} />
                      <div className="text-xs font-medium">{tier.day}d</div>
                      <div className={`text-xs ${achieved ? tier.color : 'text-muted-foreground'}`}>
                        +{tier.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Rewards */}
              {recentRewards.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Recent Rewards
                  </h4>
                  <div className="space-y-1">
                    {recentRewards.slice(0, 3).map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-sm"
                      >
                        <span className="text-muted-foreground">
                          Day {reward.streak_day} - {reward.reward_type}
                        </span>
                        <span className="text-primary font-medium">
                          +{reward.reward_value} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                <div className="text-center">
                  <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <div className="text-lg font-bold">{streakInfo?.total_scan_days || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Days</div>
                </div>
                <div className="text-center">
                  <Flame className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                  <div className="text-lg font-bold">{currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div className="text-center">
                  <Trophy className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                  <div className="text-lg font-bold">{longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Best</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Hook to update streak after a scan
export async function updateScanStreak(userId: string): Promise<{
  current_streak: number;
  longest_streak: number;
  new_day: boolean;
  streak_broken: boolean;
  reward_type: string | null;
  reward_value: number;
} | null> {
  try {
    const { data, error } = await supabase.rpc("update_scan_streak", { p_user_id: userId });
    if (error) throw error;
    return data as {
      current_streak: number;
      longest_streak: number;
      new_day: boolean;
      streak_broken: boolean;
      reward_type: string | null;
      reward_value: number;
    };
  } catch (error) {
    console.error("Failed to update streak:", error);
    return null;
  }
}