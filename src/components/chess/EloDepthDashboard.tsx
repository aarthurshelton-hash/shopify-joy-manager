import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Target, TrendingUp, Crown, Swords, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateEnPensentElo, 
  calculateDetailedEloMetrics,
  calculateMarketElo,
  canWeBeatStockfish,
  EloEstimate,
  DepthEloMetrics 
} from '@/lib/chess/eloEstimator';
import { calculateDepthMetricsFromBenchmark, DepthMetrics } from '@/lib/chess/depthAnalysis';

interface BenchmarkData {
  hybridAccuracy: number;
  stockfishAccuracy: number;
  totalGames: number;
  attempts: Array<{
    stockfish_depth: number | null;
    stockfish_correct: boolean;
    hybrid_correct: boolean;
    hybrid_confidence: number | null;
    hybrid_archetype: string | null;
    move_number: number;
  }>;
}

export function EloDepthDashboard() {
  const [loading, setLoading] = useState(true);
  const [eloEstimate, setEloEstimate] = useState<EloEstimate | null>(null);
  const [detailedElo, setDetailedElo] = useState<DepthEloMetrics | null>(null);
  const [depthMetrics, setDepthMetrics] = useState<DepthMetrics | null>(null);
  const [marketElo, setMarketElo] = useState<number>(0);
  const [beatStockfishPath, setBeatStockfishPath] = useState<string[]>([]);

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  const fetchBenchmarkData = async () => {
    setLoading(true);
    try {
      // Get cumulative stats
      const { data: benchmarks } = await supabase
        .from('chess_benchmark_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get prediction attempts for detailed analysis
      const { data: attempts } = await supabase
        .from('chess_prediction_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (benchmarks && benchmarks.length > 0 && attempts) {
        // Aggregate benchmark data
        const totalGames = benchmarks.reduce((sum, b) => sum + b.total_games, 0);
        const hybridCorrect = attempts.filter(a => a.hybrid_correct).length;
        const stockfishCorrect = attempts.filter(a => a.stockfish_correct).length;
        
        const hybridAccuracy = hybridCorrect / Math.max(attempts.length, 1);
        const stockfishAccuracy = stockfishCorrect / Math.max(attempts.length, 1);

        // Calculate depth metrics
        const depthData = attempts.map(a => ({
          stockfishDepth: a.stockfish_depth || 40,
          stockfishCorrect: a.stockfish_correct,
          hybridCorrect: a.hybrid_correct,
          hybridConfidence: a.hybrid_confidence || 50,
          hybridArchetype: a.hybrid_archetype || 'unknown',
          moveNumber: a.move_number,
        }));

        const depth = calculateDepthMetricsFromBenchmark(depthData);
        setDepthMetrics(depth);

        // Calculate ELO estimate
        const elo = calculateEnPensentElo(
          hybridAccuracy,
          stockfishAccuracy,
          depth.enPensentEffectiveDepth,
          attempts.length
        );
        setEloEstimate(elo);

        // Calculate detailed ELO breakdown
        const avgConfidence = attempts.reduce((sum, a) => sum + (a.hybrid_confidence || 50), 0) / attempts.length;
        const horizonAccuracy = depth.horizonAccuracy.find(h => h.movesAhead >= 15)?.accuracy || 50;
        
        const detailed = calculateDetailedEloMetrics(
          hybridAccuracy,
          stockfishAccuracy,
          depth.enPensentEffectiveDepth,
          depth.stockfishDepth,
          avgConfidence,
          horizonAccuracy
        );
        setDetailedElo(detailed);

        // Calculate market ELO
        const mktElo = calculateMarketElo(hybridAccuracy);
        setMarketElo(mktElo);

        // Get path to beat Stockfish
        const { path } = canWeBeatStockfish();
        setBeatStockfishPath(path);
      }
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="flex items-center justify-center h-64">
          <Brain className="w-8 h-8 animate-pulse text-primary" />
          <span className="ml-2">Calculating ELO & Depth...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main ELO Display */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            En Pensent™ ELO Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FIDE Reference - Stockfish Official */}
            <div className="text-center p-6 bg-muted/50 rounded-xl border border-muted">
              <div className="text-sm text-muted-foreground mb-2">FIDE Reference: Stockfish 17</div>
              <div className="text-5xl font-bold text-muted-foreground">
                3600
              </div>
              <Badge variant="outline" className="mt-2">
                CCRL/TCEC Official Rating
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                World's Strongest Engine
              </div>
            </div>

            {/* Our ELO */}
            <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30">
              <div className="text-sm text-muted-foreground mb-2">En Pensent (Prediction)</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {eloEstimate?.enPensentElo || '—'}
              </div>
              <Badge className="mt-2" variant="secondary">
                {eloEstimate?.humanEquivalent || 'Calculating...'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                SF Prediction ELO: {Math.round(eloEstimate?.stockfishPredictionElo || 0)}
              </div>
            </div>

            {/* Advantage */}
            <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl border border-green-500/30">
              <div className="text-sm text-muted-foreground mb-2">Prediction Advantage</div>
              <div className={`text-5xl font-bold ${(eloEstimate?.eloAdvantage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(eloEstimate?.eloAdvantage || 0) >= 0 ? '+' : ''}{Math.round(eloEstimate?.eloAdvantage || 0)}
              </div>
              <Badge variant="outline" className="mt-2 border-green-500/50 text-green-500">
                {(eloEstimate?.eloAdvantage || 0) > 0 ? 'Superior' : 'Growing'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                vs SF Prediction (not Playing)
              </div>
            </div>
          </div>

          {/* Confidence Interval */}
          {eloEstimate && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">95% Confidence Interval</div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-mono">{eloEstimate.confidenceRange.low}</span>
                <Progress 
                  value={((eloEstimate.enPensentElo - eloEstimate.confidenceRange.low) / 
                         (eloEstimate.confidenceRange.high - eloEstimate.confidenceRange.low)) * 100} 
                  className="flex-1"
                />
                <span className="text-lg font-mono">{eloEstimate.confidenceRange.high}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="depth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="depth" className="gap-2">
            <Target className="w-4 h-4" />
            Depth Analysis
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            ELO Breakdown
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Market ELO
          </TabsTrigger>
          <TabsTrigger value="path" className="gap-2">
            <Swords className="w-4 h-4" />
            Beat Stockfish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="depth">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Depth Comparison: En Pensent vs Stockfish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Stockfish Depth */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Stockfish Search Depth</div>
                  <div className="text-3xl font-bold">{depthMetrics?.stockfishDepth || 40} plies</div>
                  <div className="text-sm text-muted-foreground">
                    ≈ {Math.floor((depthMetrics?.stockfishDepth || 40) / 2)} moves ahead
                  </div>
                </div>

                {/* En Pensent Depth */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="text-sm text-muted-foreground mb-1">En Pensent Effective Depth</div>
                  <div className="text-3xl font-bold text-primary">
                    {depthMetrics?.enPensentEffectiveDepth || 0} plies
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ {Math.floor((depthMetrics?.enPensentEffectiveDepth || 0) / 2)} moves ahead
                  </div>
                </div>
              </div>

              {/* Depth Advantage */}
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Depth Advantage</div>
                    <div className={`text-2xl font-bold ${(depthMetrics?.depthAdvantage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(depthMetrics?.depthAdvantage || 0) >= 0 ? '+' : ''}{depthMetrics?.depthAdvantage || 0} plies
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Depth Ratio</div>
                    <div className="text-2xl font-bold">{depthMetrics?.depthRatio || 1}x</div>
                  </div>
                </div>
              </div>

              {/* Horizon Accuracy */}
              {depthMetrics?.horizonAccuracy && depthMetrics.horizonAccuracy.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-3">Accuracy by Prediction Horizon</div>
                  <div className="space-y-2">
                    {depthMetrics.horizonAccuracy.slice(0, 5).map((h, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground">
                          {h.movesAhead}+ moves
                        </div>
                        <div className="flex-1 flex gap-2 items-center">
                          <Progress value={h.accuracy} className="flex-1 h-2" />
                          <span className="text-sm font-mono w-12">{h.accuracy.toFixed(0)}%</span>
                        </div>
                        <div className="w-20 text-xs text-muted-foreground">
                          SF: {h.stockfishAccuracyAtHorizon.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                ELO Rating Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedElo?.breakdown.map((item, i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.category}</span>
                      <Badge variant={item.contribution >= 0 ? 'default' : 'destructive'}>
                        {item.contribution >= 0 ? '+' : ''}{item.contribution} ELO
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                ))}

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Combined ELO</span>
                    <span className="text-2xl font-bold text-primary">
                      {detailedElo?.combinedElo || eloEstimate?.enPensentElo || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Battle ELO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl border border-amber-500/30">
                <div className="text-sm text-muted-foreground mb-2">
                  The Market IS Our Stockfish
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {marketElo}
                </div>
                <div className="text-lg mt-2 text-muted-foreground">Market Battle ELO</div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-3">Understanding Market ELO</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• <strong>2000 ELO</strong> = Random guessing (50% accuracy)</p>
                  <p>• <strong>2400 ELO</strong> = Efficient Market Hypothesis baseline</p>
                  <p>• <strong>2700 ELO</strong> = Consistent edge over market (60% accuracy)</p>
                  <p>• <strong>3000+ ELO</strong> = Legendary trader level (70%+ accuracy)</p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Zap className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm">
                  <strong>CEO Insight:</strong> The market is a 3600+ ELO opponent - 
                  a complex adaptive system we're learning to beat through pattern recognition,
                  just like we're beating Stockfish's predictions in chess.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="path">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5" />
                Path to Beat Stockfish at Chess
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="text-sm font-medium text-amber-500 mb-2">Current Status</div>
                <p className="text-sm text-muted-foreground">
                  We currently USE Stockfish for tactical calculation, so we can't beat it at 
                  move-by-move play. However, our <strong>prediction superiority</strong> shows 
                  we understand game trajectories better than pure calculation.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">The Path Forward:</div>
                {beatStockfishPath.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="text-sm">{step.substring(3)}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                <Brain className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm">
                  <strong>The Ultimate Goal:</strong> Create a hybrid engine that uses 
                  En Pensent's pattern recognition to GUIDE Stockfish's tactical calculations,
                  choosing lines that lead to favorable outcomes we've already predicted.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
