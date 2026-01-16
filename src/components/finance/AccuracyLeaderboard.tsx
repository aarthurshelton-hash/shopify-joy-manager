/**
 * En Pensent™ Prediction Accuracy Leaderboard
 * 
 * Shows archetype performance, baseline comparison, and accuracy stats.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, BarChart3, Award } from 'lucide-react';
import { MARKET_ARCHETYPES } from '@/lib/pensent-core/domains/finance/types';

interface ArchetypePerformance {
  total: number;
  correct: number;
  avgAccuracy: number;
  baselineCorrect: number;
  baselineTotal: number;
}

interface AccuracyLeaderboardProps {
  archetypePerformance: Record<string, ArchetypePerformance>;
  overview?: Array<{
    archetype: string;
    time_horizon: string;
    resolved_predictions: number;
    correct_predictions: number;
    accuracy_percent: number;
    avg_accuracy_score: number;
    baseline_accuracy_percent: number;
  }>;
}

export const AccuracyLeaderboard: React.FC<AccuracyLeaderboardProps> = ({
  archetypePerformance,
  overview,
}) => {
  // Calculate overall stats
  const totalPredictions = Object.values(archetypePerformance).reduce((a, p) => a + p.total, 0);
  const totalCorrect = Object.values(archetypePerformance).reduce((a, p) => a + p.correct, 0);
  const totalBaselineCorrect = Object.values(archetypePerformance).reduce((a, p) => a + p.baselineCorrect, 0);
  const totalBaselineTotal = Object.values(archetypePerformance).reduce((a, p) => a + p.baselineTotal, 0);
  
  const overallAccuracy = totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0;
  const baselineAccuracy = totalBaselineTotal > 0 ? (totalBaselineCorrect / totalBaselineTotal) * 100 : 50;
  const outperformance = overallAccuracy - baselineAccuracy;

  // Sort archetypes by accuracy
  const sortedArchetypes = Object.entries(archetypePerformance)
    .filter(([_, p]) => p.total >= 3) // Only show archetypes with enough data
    .sort((a, b) => {
      const accA = a[1].total > 0 ? (a[1].correct / a[1].total) : 0;
      const accB = b[1].total > 0 ? (b[1].correct / b[1].total) : 0;
      return accB - accA;
    });

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 65) return 'text-green-500';
    if (accuracy >= 55) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getOutperformanceColor = (diff: number) => {
    if (diff >= 10) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (diff >= 5) return 'bg-green-500/10 text-green-300 border-green-500/20';
    if (diff >= 0) return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{totalPredictions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className={`w-8 h-8 ${getAccuracyColor(overallAccuracy)}`} />
              <div>
                <p className="text-sm text-muted-foreground">En Pensent Accuracy</p>
                <p className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
                  {overallAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Baseline (SMA)</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {baselineAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-8 h-8 ${outperformance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Outperformance</p>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-3 py-1 ${getOutperformanceColor(outperformance)}`}
                >
                  {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archetype Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Archetype Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedArchetypes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No resolved predictions yet. Make some predictions and wait for them to expire!
            </p>
          ) : (
            <div className="space-y-4">
              {sortedArchetypes.map(([archetype, perf], index) => {
                const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
                const baselineAcc = perf.baselineTotal > 0 
                  ? (perf.baselineCorrect / perf.baselineTotal) * 100 
                  : 50;
                const diff = accuracy - baselineAcc;
                const archetypeDef = MARKET_ARCHETYPES[archetype as keyof typeof MARKET_ARCHETYPES];

                return (
                  <div 
                    key={archetype}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {archetypeDef?.name || archetype}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {perf.total} predictions
                        </Badge>
                      </div>
                      <Progress value={accuracy} className="h-2" />
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                        {accuracy.toFixed(0)}%
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getOutperformanceColor(diff)}`}
                      >
                        {diff >= 0 ? '+' : ''}{diff.toFixed(0)}% vs baseline
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Statement */}
      {overallAccuracy > 55 && totalPredictions >= 10 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-400 mb-2">
                En Pensent™ Validation Checkpoint
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                With {totalPredictions} predictions at {overallAccuracy.toFixed(1)}% accuracy
                ({outperformance >= 0 ? '+' : ''}{outperformance.toFixed(1)}% vs baseline),
                the temporal signature extraction demonstrates {outperformance >= 10 ? 'strong' : outperformance >= 5 ? 'meaningful' : 'marginal'} predictive value
                beyond simple technical analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccuracyLeaderboard;
