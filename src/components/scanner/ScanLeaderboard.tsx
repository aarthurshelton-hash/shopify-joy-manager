import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Star, Crown, Target, Zap, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  unique_visions_scanned: number;
  total_successful_scans: number;
  total_scans: number;
  last_scan_at: string;
}

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  threshold: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_scan", type: "first_scan", name: "First Scan", description: "Complete your first successful scan", icon: Star, color: "text-yellow-500", threshold: 1 },
  { id: "explorer_5", type: "explorer_5", name: "Explorer", description: "Scan 5 unique visions", icon: Target, color: "text-blue-500", threshold: 5 },
  { id: "collector_10", type: "collector_10", name: "Collector", description: "Scan 10 unique visions", icon: Medal, color: "text-green-500", threshold: 10 },
  { id: "hunter_25", type: "hunter_25", name: "Vision Hunter", description: "Scan 25 unique visions", icon: Award, color: "text-purple-500", threshold: 25 },
  { id: "master_50", type: "master_50", name: "Scan Master", description: "Scan 50 unique visions", icon: Trophy, color: "text-orange-500", threshold: 50 },
  { id: "legend_100", type: "legend_100", name: "Legend", description: "Scan 100 unique visions", icon: Crown, color: "text-primary", threshold: 100 },
  { id: "scan_streak_10", type: "scan_streak_10", name: "Dedicated", description: "Complete 10 total scans", icon: Zap, color: "text-cyan-500", threshold: 10 },
  { id: "scan_streak_50", type: "scan_streak_50", name: "Enthusiast", description: "Complete 50 total scans", icon: Zap, color: "text-pink-500", threshold: 50 },
  { id: "scan_streak_100", type: "scan_streak_100", name: "Scanner Elite", description: "Complete 100 total scans", icon: Zap, color: "text-red-500", threshold: 100 },
];

export function ScanLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      fetchUserAchievements();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_leaderboard")
        .select("*")
        .limit(20);

      if (error) throw error;
      setLeaderboard((data as LeaderboardEntry[]) || []);
      
      // Find current user in leaderboard
      if (user && data) {
        const userEntry = data.find((e: LeaderboardEntry) => e.user_id === user.id);
        setUserStats(userEntry || null);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("scan_achievements")
        .select("achievement_type")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserAchievements((data || []).map((a) => a.achievement_type));
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm text-muted-foreground">{rank}</span>;
    }
  };

  const getUserRank = () => {
    if (!user) return null;
    const rank = leaderboard.findIndex((e) => e.user_id === user.id) + 1;
    return rank > 0 ? rank : null;
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-display font-bold">Scan Leaderboard</span>
          {getUserRank() && (
            <Badge variant="secondary" className="text-xs">
              #{getUserRank()}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tab Toggle */}
            <div className="px-4 pb-2 flex gap-2">
              <Button
                variant={!showAchievements ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAchievements(false)}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-1" />
                Rankings
              </Button>
              <Button
                variant={showAchievements ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAchievements(true)}
                className="flex-1"
              >
                <Award className="h-4 w-4 mr-1" />
                Achievements
              </Button>
            </div>

            {!showAchievements ? (
              /* Leaderboard Rankings */
              <ScrollArea className="max-h-80">
                <div className="p-2 space-y-1">
                  {leaderboard.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No scans yet</p>
                      <p className="text-xs">Be the first to scan a vision!</p>
                    </div>
                  ) : (
                    leaderboard.map((entry, index) => {
                      const isCurrentUser = user?.id === entry.user_id;
                      return (
                        <motion.div
                          key={entry.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isCurrentUser
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-8 flex justify-center">
                            {getRankIcon(index + 1)}
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback>
                              {entry.display_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {entry.display_name || "Anonymous"}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.total_successful_scans} scans
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {entry.unique_visions_scanned}
                            </div>
                            <div className="text-xs text-muted-foreground">unique</div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            ) : (
              /* Achievements */
              <ScrollArea className="max-h-80">
                <div className="p-2 space-y-2">
                  {ACHIEVEMENTS.map((achievement, index) => {
                    const earned = userAchievements.includes(achievement.type);
                    const Icon = achievement.icon;
                    const progress = userStats
                      ? achievement.type.includes("streak")
                        ? userStats.total_successful_scans
                        : userStats.unique_visions_scanned
                      : 0;
                    const progressPercent = Math.min(100, (progress / achievement.threshold) * 100);

                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 rounded-lg border transition-all ${
                          earned
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted/30 border-border opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              earned ? "bg-primary/20" : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                earned ? achievement.color : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {achievement.name}
                              </span>
                              {earned && (
                                <Badge variant="secondary" className="text-xs">
                                  Earned
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {achievement.description}
                            </p>
                            {!earned && user && (
                              <div className="mt-2">
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {progress} / {achievement.threshold}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Your Stats Summary */}
            {user && userStats && (
              <div className="p-4 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">
                      {userStats.unique_visions_scanned}
                    </div>
                    <div className="text-xs text-muted-foreground">Unique</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {userStats.total_successful_scans}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {userAchievements.length}/{ACHIEVEMENTS.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
