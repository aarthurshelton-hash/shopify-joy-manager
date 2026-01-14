import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  Palette, 
  Gamepad2, 
  TrendingUp, 
  Zap,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { getPaletteValuePools, getGamecardValuePools, type ValuePool } from '@/lib/analytics/financialTrends';
import { format } from 'date-fns';

interface RecentInteraction {
  id: string;
  type: 'palette' | 'gamecard';
  name: string;
  timestamp: Date;
}

const RealTimeValueTracker: React.FC = () => {
  const queryClient = useQueryClient();
  const [recentInteractions, setRecentInteractions] = useState<RecentInteraction[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch palette pools with real-time updates
  const { data: palettePools, refetch: refetchPalettes } = useQuery({
    queryKey: ['admin-palette-pools-live'],
    queryFn: getPaletteValuePools,
    refetchInterval: isLive ? 5000 : false, // Poll every 5 seconds when live
  });

  // Fetch gamecard pools with real-time updates
  const { data: gamecardPools, refetch: refetchGamecards } = useQuery({
    queryKey: ['admin-gamecard-pools-live'],
    queryFn: getGamecardValuePools,
    refetchInterval: isLive ? 5000 : false,
  });

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isLive) return;

    const paletteChannel = supabase
      .channel('palette-pool-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'palette_value_pool' },
        (payload) => {
          console.log('Palette pool update:', payload);
          refetchPalettes();
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as any;
            setRecentInteractions(prev => [{
              id: `palette-${Date.now()}`,
              type: 'palette' as const,
              name: newData.palette_name || newData.palette_id,
              timestamp: new Date(),
            }, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    const gamecardChannel = supabase
      .channel('gamecard-pool-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gamecard_value_pool' },
        (payload) => {
          console.log('Gamecard pool update:', payload);
          refetchGamecards();
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as any;
            setRecentInteractions(prev => [{
              id: `gamecard-${Date.now()}`,
              type: 'gamecard' as const,
              name: newData.game_title || newData.game_id,
              timestamp: new Date(),
            }, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paletteChannel);
      supabase.removeChannel(gamecardChannel);
    };
  }, [isLive, refetchPalettes, refetchGamecards]);

  const formatCents = (cents: number) => 
    `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate totals
  const totalPaletteValue = (palettePools || []).reduce((sum, p) => sum + p.totalValueCents, 0);
  const totalGamecardValue = (gamecardPools || []).reduce((sum, g) => sum + g.totalValueCents, 0);
  const totalInteractions = (palettePools || []).reduce((sum, p) => sum + p.interactionCount, 0) +
    (gamecardPools || []).reduce((sum, g) => sum + g.interactionCount, 0);
  const totalEarnedValue = (palettePools || []).reduce((sum, p) => sum + p.earnedValueCents, 0) +
    (gamecardPools || []).reduce((sum, g) => sum + g.earnedValueCents, 0);

  // Get top performers
  const topPalettes = (palettePools || [])
    .filter(p => p.interactionCount > 0)
    .slice(0, 5);
  const topGamecards = (gamecardPools || [])
    .filter(g => g.interactionCount > 0)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isLive ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
            <Activity className={`h-5 w-5 ${isLive ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Real-Time Value Accrual</h3>
            <p className="text-sm text-muted-foreground">
              {isLive ? 'Live tracking enabled • Updates every 5 seconds' : 'Paused'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isLive 
                ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {isLive ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={() => {
              refetchPalettes();
              refetchGamecards();
            }}
            className="p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Palette className="h-3 w-3" />
              <span className="text-xs">Palette Pool</span>
            </div>
            <p className="text-xl font-bold text-purple-400">{formatCents(totalPaletteValue)}</p>
            <p className="text-xs text-muted-foreground">
              {(palettePools || []).reduce((sum, p) => sum + p.interactionCount, 0)} interactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gamepad2 className="h-3 w-3" />
              <span className="text-xs">Gamecard Pool</span>
            </div>
            <p className="text-xl font-bold text-amber-400">{formatCents(totalGamecardValue)}</p>
            <p className="text-xs text-muted-foreground">
              {(gamecardPools || []).reduce((sum, g) => sum + g.interactionCount, 0)} interactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Earned Value</span>
            </div>
            <p className="text-xl font-bold text-green-400">{formatCents(totalEarnedValue)}</p>
            <p className="text-xs text-muted-foreground">From orders & trades</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
              <span className="text-xs">Total Interactions</span>
            </div>
            <p className="text-xl font-bold">{totalInteractions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Across all assets</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      {recentInteractions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {recentInteractions.slice(0, 5).map((interaction) => (
                  <motion.div
                    key={interaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {interaction.type === 'palette' ? (
                        <Palette className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Gamepad2 className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-sm font-medium">{interaction.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {interaction.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(interaction.timestamp, 'HH:mm:ss')}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Palettes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-400" />
              Most Used Palettes
            </CardTitle>
            <CardDescription>By interaction count</CardDescription>
          </CardHeader>
          <CardContent>
            {topPalettes.length > 0 ? (
              <div className="space-y-3">
                {topPalettes.map((palette, index) => {
                  const maxInteractions = Math.max(...topPalettes.map(p => p.interactionCount), 1);
                  const percentage = (palette.interactionCount / maxInteractions) * 100;
                  
                  return (
                    <div key={palette.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{palette.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{palette.interactionCount}</span>
                          <span className="text-xs text-purple-400">{formatCents(palette.totalValueCents)}</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No palette interactions yet</p>
                <p className="text-xs">Interactions will appear as users load games</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Gamecards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-amber-400" />
              Most Viewed Gamecards
            </CardTitle>
            <CardDescription>By interaction count</CardDescription>
          </CardHeader>
          <CardContent>
            {topGamecards.length > 0 ? (
              <div className="space-y-3">
                {topGamecards.map((game) => {
                  const maxInteractions = Math.max(...topGamecards.map(g => g.interactionCount), 1);
                  const percentage = (game.interactionCount / maxInteractions) * 100;
                  
                  return (
                    <div key={game.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[150px]">{game.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              game.rarityTier === 'legendary' ? 'border-amber-500 text-amber-500' :
                              game.rarityTier === 'epic' ? 'border-purple-500 text-purple-500' :
                              'border-blue-500 text-blue-500'
                            }`}
                          >
                            {game.rarityTier}
                          </Badge>
                          <span className="text-muted-foreground">{game.interactionCount}</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No gamecard interactions yet</p>
                <p className="text-xs">Interactions will appear as users load famous games</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Pools Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Complete Value Pool Status</CardTitle>
          <CardDescription>All registered palettes and gamecards with their current values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Palettes */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-400" />
                Palettes ({palettePools?.length || 0})
              </h4>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {(palettePools || []).map((palette) => (
                  <div 
                    key={palette.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium">{palette.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {palette.interactionCount} views • {palette.usageCount} visions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCents(palette.totalValueCents)}</div>
                      {palette.earnedValueCents > 0 && (
                        <div className="text-xs text-green-500">+{formatCents(palette.earnedValueCents)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gamecards */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-amber-400" />
                Gamecards ({gamecardPools?.length || 0})
              </h4>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {(gamecardPools || []).map((game) => (
                  <div 
                    key={game.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium truncate block max-w-[180px]">{game.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] px-1 py-0 ${
                            game.rarityTier === 'legendary' ? 'border-amber-500 text-amber-500' :
                            game.rarityTier === 'epic' ? 'border-purple-500 text-purple-500' :
                            'border-blue-500 text-blue-500'
                          }`}
                        >
                          {game.rarityTier}
                        </Badge>
                        <span>{game.interactionCount} views</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCents(game.totalValueCents)}</div>
                      {game.earnedValueCents > 0 && (
                        <div className="text-xs text-green-500">+{formatCents(game.earnedValueCents)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeValueTracker;
