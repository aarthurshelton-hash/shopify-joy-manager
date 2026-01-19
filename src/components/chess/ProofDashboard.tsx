/**
 * Visual Proof Dashboard
 * 
 * Real-time evidence of En Pensent hybrid superiority in prediction.
 * Shows breakthrough cases, disagreement analysis, and cumulative proof.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Trophy, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Activity,
  Clock,
  Calendar,
  Timer
} from 'lucide-react';
import {
  getDisagreementStats,
  getHybridBreakthroughs,
  DisagreementCase,
  DisagreementStats,
  formatEval,
  getDisagreementInsight,
  formatTimeControl,
} from '@/lib/chess/disagreementTracker';
import { getCumulativeStats } from '@/lib/chess/benchmarkPersistence';
import { format, parseISO, isValid } from 'date-fns';

interface CumulativeStats {
  totalRuns: number;
  totalGamesAnalyzed: number;
  overallHybridAccuracy: number;
  overallStockfishAccuracy: number;
  hybridNetWins: number;
  bestArchetype: string | null;
  worstArchetype: string | null;
}

export function ProofDashboard() {
  const [stats, setStats] = useState<DisagreementStats | null>(null);
  const [breakthroughs, setBreakthroughs] = useState<DisagreementCase[]>([]);
  const [cumulative, setCumulative] = useState<CumulativeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [disagreementStats, breakthroughCases, cumulativeStats] = await Promise.all([
        getDisagreementStats(),
        getHybridBreakthroughs(10),
        getCumulativeStats(),
      ]);
      setStats(disagreementStats);
      setBreakthroughs(breakthroughCases);
      setCumulative(cumulativeStats);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 mx-auto animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Loading proof data...</p>
        </CardContent>
      </Card>
    );
  }

  const hybridAdvantage = cumulative 
    ? cumulative.overallHybridAccuracy - cumulative.overallStockfishAccuracy 
    : 0;

  const disagreementWinRate = stats && stats.totalDisagreements > 0
    ? (stats.hybridWinsDisagreements / stats.totalDisagreements) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Games Analyzed</p>
                  <p className="text-2xl font-bold">{cumulative?.totalGamesAnalyzed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`border ${hybridAdvantage > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hybridAdvantage > 0 ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                  <TrendingUp className={`w-5 h-5 ${hybridAdvantage > 0 ? 'text-green-500' : 'text-destructive'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hybrid Advantage</p>
                  <p className="text-2xl font-bold">
                    {hybridAdvantage >= 0 ? '+' : ''}{hybridAdvantage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Breakthrough Cases</p>
                  <p className="text-2xl font-bold">{stats?.breakthroughCases || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disagreement Win Rate</p>
                  <p className="text-2xl font-bold">{disagreementWinRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakthrough Cases */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Breakthrough Cases
            </CardTitle>
            <CardDescription>
              Where En Pensent was RIGHT and Stockfish was WRONG
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {breakthroughs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No breakthrough cases recorded yet.</p>
                  <p className="text-sm">Run benchmarks to collect evidence.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {breakthroughs.map((case_, index) => {
                    const timeControlInfo = formatTimeControl(case_.timeControl);
                    const analysisDate = case_.createdAt ? parseISO(case_.createdAt) : null;
                    const gameDate = case_.gameDate ? parseISO(case_.gameDate) : null;
                    
                    return (
                      <motion.div
                        key={case_.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border border-green-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                {case_.significance === 'breakthrough' ? '🌟 BREAKTHROUGH' : '✓ Notable'}
                              </Badge>
                              <Badge variant="outline" className={`${timeControlInfo.color} border-current/30 bg-current/10`}>
                                {timeControlInfo.icon} {timeControlInfo.label}
                              </Badge>
                              {(case_.whiteElo || case_.blackElo) && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  ~{Math.round(((case_.whiteElo || 0) + (case_.blackElo || 0)) / 2)} ELO
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{case_.gameName}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Move {case_.moveNumber}
                          </span>
                        </div>

                        {/* Date Information */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                          {gameDate && isValid(gameDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Played: {format(gameDate, 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {analysisDate && isValid(analysisDate) && (
                            <div className="flex items-center gap-1">
                              <Timer className="w-3 h-3 text-primary" />
                              <span className="text-primary">Analyzed: {format(analysisDate, 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-destructive/10 rounded">
                            <p className="text-muted-foreground">Stockfish</p>
                            <p className="font-mono font-bold text-destructive">{formatEval(case_.stockfishEval)}</p>
                            <p className="text-destructive">→ {case_.stockfishPrediction}</p>
                          </div>
                          <div className="text-center p-2 bg-green-500/10 rounded">
                            <p className="text-muted-foreground">Hybrid</p>
                            <p className="font-bold text-green-400">{case_.hybridArchetype}</p>
                            <p className="text-green-400">→ {case_.hybridPrediction}</p>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded">
                            <p className="text-muted-foreground">Actual</p>
                            <p className="font-bold text-primary">{case_.actualResult}</p>
                            <p className="text-primary">✓ Hybrid correct</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-3 italic">
                          {getDisagreementInsight(case_)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Disagreement Analysis */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Disagreement Analysis
            </CardTitle>
            <CardDescription>
              When Hybrid and Stockfish predict different outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Win/Loss in Disagreements */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Hybrid wins disagreements</span>
                <span className="font-bold text-green-400">
                  {stats?.hybridWinsDisagreements || 0} / {stats?.totalDisagreements || 0}
                </span>
              </div>
              <Progress 
                value={disagreementWinRate} 
                className="h-3 bg-destructive/20"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Stockfish: {stats?.stockfishWinsDisagreements || 0}</span>
                <span>Hybrid: {stats?.hybridWinsDisagreements || 0}</span>
              </div>
            </div>

            <Separator />

            {/* Stockfish Confidence When Wrong */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Avg Stockfish Confidence When Wrong
              </h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold font-mono">
                  {formatEval(stats?.averageStockfishConfidenceWhenWrong || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  When hybrid beats Stockfish, Stockfish was typically this confident in the wrong direction
                </p>
              </div>
            </div>

            <Separator />

            {/* Archetype Performance in Disagreements */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                Top Archetypes in Disagreements
              </h4>
              <div className="space-y-2">
                {(stats?.topArchetypesInDisagreements || []).map((arch, i) => (
                  <div key={arch.archetype} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      <Badge variant="outline">{arch.archetype}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{arch.count} cases</span>
                      <span className={`text-sm font-bold ${arch.winRate > 50 ? 'text-green-400' : 'text-destructive'}`}>
                        {arch.winRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.topArchetypesInDisagreements || stats.topArchetypesInDisagreements.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Run benchmarks to collect archetype data
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Key Insight */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Key Insight
              </h4>
              <p className="text-xs text-muted-foreground">
                When En Pensent and Stockfish disagree, the hybrid system wins{' '}
                <span className="text-primary font-bold">{disagreementWinRate.toFixed(0)}%</span> of the time.
                This proves that Color Flow pattern recognition adds genuine value
                beyond pure tactical calculation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proof Statement */}
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/30">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">
            The Evidence
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Over <span className="text-primary font-bold">{cumulative?.totalGamesAnalyzed || 0}</span> real grandmaster games,
            En Pensent's hybrid prediction system achieves{' '}
            <span className="text-primary font-bold">{(cumulative?.overallHybridAccuracy || 0).toFixed(1)}%</span> accuracy
            vs Stockfish 17 NNUE's{' '}
            <span className="text-muted-foreground">{(cumulative?.overallStockfishAccuracy || 0).toFixed(1)}%</span>.
            In disagreements, pattern recognition wins{' '}
            <span className="text-green-400 font-bold">{disagreementWinRate.toFixed(0)}%</span> of the time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
