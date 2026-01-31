/**
 * Advanced Accuracy Dashboard v1.0
 * 
 * Real-time monitoring with:
 * - Archetype breakdown with live accuracy
 * - Disagreement tracking (En Pensent vs Stockfish)
 * - Universal resonance indicator
 * - ELO tier performance
 * - Auto-evolution status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Activity, Brain, 
  Target, Zap, BarChart3, Layers, 
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  getGlobalDisagreementStats,
  ELO_TIERS,
} from '@/lib/chess/accuracy';

interface ArchetypePerformance {
  archetype: string;
  total: number;
  correct: number;
  accuracy: number;
  beatsStockfish: number;
  stockfishWinRate: number;
}

interface EloTierStats {
  tier: string;
  total: number;
  accuracy: number;
  weight: number;
}

interface DashboardStats {
  overallAccuracy: number;
  totalPredictions: number;
  disagreementWinRate: number;
  totalDisagreements: number;
  archetypePerformance: ArchetypePerformance[];
  eloTierStats: EloTierStats[];
  universalResonance: number;
  lastUpdateTime: Date;
  isLoading: boolean;
}

const ACCURACY_TARGET = 85;

export function AdvancedAccuracyDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    overallAccuracy: 0,
    totalPredictions: 0,
    disagreementWinRate: 0,
    totalDisagreements: 0,
    archetypePerformance: [],
    eloTierStats: [],
    universalResonance: 0.5,
    lastUpdateTime: new Date(),
    isLoading: true,
  });

  const [liveUpdates, setLiveUpdates] = useState(0);

  // Fetch stats from database
  const fetchStats = async () => {
    try {
      // Get prediction attempts with archetype breakdown
      const { data: predictions, error } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_archetype, hybrid_correct, stockfish_correct, white_elo, black_elo, data_quality_tier');

      if (error) throw error;

      // Calculate overall accuracy
      const total = predictions?.length || 0;
      const correct = predictions?.filter(p => p.hybrid_correct).length || 0;
      const overallAccuracy = total > 0 ? (correct / total) * 100 : 0;

      // Calculate disagreement win rate
      const disagreements = predictions?.filter(p => p.hybrid_correct !== p.stockfish_correct) || [];
      const disagreementWins = disagreements.filter(p => p.hybrid_correct).length;
      const disagreementWinRate = disagreements.length > 0 
        ? (disagreementWins / disagreements.length) * 100 : 0;

      // Aggregate by archetype
      const archetypeMap = new Map<string, { total: number; correct: number; beatsStockfish: number }>();
      for (const p of predictions || []) {
        const arch = p.hybrid_archetype || 'unknown';
        const entry = archetypeMap.get(arch) || { total: 0, correct: 0, beatsStockfish: 0 };
        entry.total++;
        if (p.hybrid_correct) entry.correct++;
        if (p.hybrid_correct && !p.stockfish_correct) entry.beatsStockfish++;
        archetypeMap.set(arch, entry);
      }

      const archetypePerformance: ArchetypePerformance[] = Array.from(archetypeMap.entries())
        .map(([archetype, data]) => ({
          archetype,
          total: data.total,
          correct: data.correct,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          beatsStockfish: data.beatsStockfish,
          stockfishWinRate: data.total > 0 ? (data.beatsStockfish / data.total) * 100 : 0,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      // Aggregate by ELO tier
      const eloTierMap = new Map<string, { total: number; correct: number }>();
      for (const p of predictions || []) {
        const avgElo = ((p.white_elo || 1500) + (p.black_elo || 1500)) / 2;
        let tier = 'unknown';
        for (const t of ELO_TIERS) {
          if (avgElo >= t.range[0] && avgElo < t.range[1]) {
            tier = t.name;
            break;
          }
        }
        const entry = eloTierMap.get(tier) || { total: 0, correct: 0 };
        entry.total++;
        if (p.hybrid_correct) entry.correct++;
        eloTierMap.set(tier, entry);
      }

      // Calculate simple weights from base tier weights
      const baseWeights: Record<string, number> = {};
      for (const t of ELO_TIERS) {
        baseWeights[t.name] = t.baseWeight;
      }

      const eloTierStats: EloTierStats[] = Array.from(eloTierMap.entries())
        .map(([tier, data]) => ({
          tier,
          total: data.total,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          weight: baseWeights[tier] || 0,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      // Calculate universal resonance (from global disagreement stats)
      const globalStats = getGlobalDisagreementStats();
      const universalResonance = globalStats.totalDisagreements > 0
        ? globalStats.enPensentWins / globalStats.totalDisagreements
        : 0.5;

      setStats({
        overallAccuracy,
        totalPredictions: total,
        disagreementWinRate,
        totalDisagreements: disagreements.length,
        archetypePerformance,
        eloTierStats,
        universalResonance,
        lastUpdateTime: new Date(),
        isLoading: false,
      });

    } catch (err) {
      console.error('[AdvancedDashboard] Error fetching stats:', err);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('accuracy-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' },
        () => {
          setLiveUpdates(prev => prev + 1);
          fetchStats();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const accuracyColor = stats.overallAccuracy >= ACCURACY_TARGET 
    ? 'text-green-500' 
    : stats.overallAccuracy >= 65 
      ? 'text-yellow-500' 
      : 'text-red-500';

  const resonanceLevel = stats.universalResonance >= 0.7 
    ? 'High' 
    : stats.universalResonance >= 0.4 
      ? 'Medium' 
      : 'Low';

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Accuracy */}
        <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overall Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", accuracyColor)}>
              {stats.overallAccuracy.toFixed(1)}%
            </div>
            <Progress 
              value={stats.overallAccuracy} 
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {ACCURACY_TARGET}% | {stats.totalPredictions.toLocaleString()} predictions
            </p>
          </CardContent>
        </Card>

        {/* Disagreement Win Rate */}
        <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Disagreement Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", 
              stats.disagreementWinRate >= 60 ? 'text-green-500' : 'text-yellow-500'
            )}>
              {stats.disagreementWinRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Beats Stockfish in {stats.totalDisagreements} disagreements
            </p>
            {stats.disagreementWinRate >= 60 && (
              <Badge variant="outline" className="mt-2 text-green-500 border-green-500/50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Superior Pattern Recognition
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Universal Resonance */}
        <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Universal Resonance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold",
              stats.universalResonance >= 0.7 ? 'text-purple-500' :
              stats.universalResonance >= 0.4 ? 'text-blue-500' : 'text-gray-500'
            )}>
              {(stats.universalResonance * 100).toFixed(0)}%
            </div>
            <Badge variant="outline" className="mt-2">
              {resonanceLevel} Cross-Domain Alignment
            </Badge>
          </CardContent>
        </Card>

        {/* Live Updates */}
        <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              Live Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Collecting Data</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {liveUpdates} updates this session
            </p>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Last: {stats.lastUpdateTime.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Archetype Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Archetype Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.archetypePerformance.slice(0, 12).map(arch => (
              <div 
                key={arch.archetype} 
                className="p-3 rounded-lg border bg-muted/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium capitalize">
                    {arch.archetype.replace(/_/g, ' ')}
                  </span>
                  <Badge 
                    variant={arch.accuracy >= 70 ? 'default' : 'outline'}
                    className={cn(
                      arch.accuracy >= 70 ? 'bg-green-500/20 text-green-500' :
                      arch.accuracy >= 55 ? 'text-yellow-500' : 'text-red-500'
                    )}
                  >
                    {arch.accuracy.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={arch.accuracy} className="h-1.5 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{arch.total} games</span>
                  <span className="flex items-center gap-1">
                    {arch.stockfishWinRate >= 10 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    {arch.beatsStockfish} SF wins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ELO Tier Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ELO Tier Performance & Adaptive Sampling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.eloTierStats.map(tier => (
              <div key={tier.tier} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium capitalize">
                  {tier.tier.replace(/_/g, ' ')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={tier.accuracy} className="h-2 flex-1" />
                    <span className={cn("text-sm font-medium w-14 text-right",
                      tier.accuracy >= 70 ? 'text-green-500' :
                      tier.accuracy >= 55 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {tier.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{tier.total} predictions</span>
                    <span>
                      Sampling Weight: {(tier.weight * 100).toFixed(0)}%
                      {tier.accuracy < 55 && tier.total > 20 && (
                        <Badge variant="outline" className="ml-2 text-xs text-orange-500">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Boosted
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress to 85% Target */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Path to {ACCURACY_TARGET}% Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                {ACCURACY_TARGET - stats.overallAccuracy > 0 
                  ? `${(ACCURACY_TARGET - stats.overallAccuracy).toFixed(1)}% remaining`
                  : '🎉 Target Achieved!'
                }
              </p>
            </div>
            <div className={cn("text-4xl font-bold", accuracyColor)}>
              {((stats.overallAccuracy / ACCURACY_TARGET) * 100).toFixed(0)}%
            </div>
          </div>
          <Progress 
            value={(stats.overallAccuracy / ACCURACY_TARGET) * 100} 
            className="h-4"
          />
          <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Current</div>
              <div className={cn("text-lg font-bold", accuracyColor)}>
                {stats.overallAccuracy.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Target</div>
              <div className="text-lg font-bold text-primary">{ACCURACY_TARGET}%</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Gap</div>
              <div className={cn("text-lg font-bold",
                ACCURACY_TARGET - stats.overallAccuracy <= 0 ? 'text-green-500' :
                ACCURACY_TARGET - stats.overallAccuracy <= 10 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {Math.max(0, ACCURACY_TARGET - stats.overallAccuracy).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedAccuracyDashboard;
