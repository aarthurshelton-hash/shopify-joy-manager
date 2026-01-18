import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Trophy, Play, Loader2 } from 'lucide-react';
import { runQuickBenchmark, FAMOUS_GAMES_BENCHMARK, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/benchmark';

export default function Benchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [attempts, setAttempts] = useState<PredictionAttempt[]>([]);

  const runBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    setStatus('Initializing Stockfish engine...');
    setResult(null);
    setAttempts([]);

    try {
      const games = FAMOUS_GAMES_BENCHMARK.map(g => ({
        pgn: g.pgn,
        result: g.result,
      }));

      const benchmarkResult = await runQuickBenchmark(
        games,
        20, // Predict at move 20
        18, // Stockfish depth
        (statusText, prog) => {
          setStatus(statusText);
          setProgress(prog);
        }
      );

      setResult(benchmarkResult);
      setAttempts(benchmarkResult.predictionPoints);
    } catch (error) {
      console.error('Benchmark failed:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getWinner = () => {
    if (!result) return null;
    if (result.hybridAccuracy > result.stockfishAccuracy) return 'hybrid';
    if (result.stockfishAccuracy > result.hybridAccuracy) return 'stockfish';
    return 'tie';
  };

  const winner = getWinner();

  // Calculate correct counts from predictionPoints
  const stockfishCorrect = result?.predictionPoints.filter(p => p.stockfishCorrect).length ?? 0;
  const hybridCorrect = result?.predictionPoints.filter(p => p.hybridCorrect).length ?? 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            EN PENSENT vs STOCKFISH 17
          </h1>
          <p className="text-muted-foreground text-lg">
            Proving temporal pattern recognition beats raw calculation
          </p>
          <p className="text-sm text-muted-foreground/70 italic">
            "Deep Blue proved machines could PLAY chess. AlphaZero proved self-play could master it. 
            En Pensent proves temporal patterns can PREDICT it."
          </p>
        </div>

        {/* Control Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Prediction Accuracy Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={runBenchmark} 
                disabled={isRunning}
                size="lg"
                className="gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Running...' : 'Run Benchmark (20 Famous Games)'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Tests prediction accuracy at move 20 against known outcomes
              </span>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stockfish Card */}
            <Card className={`border-2 transition-all ${winner === 'stockfish' ? 'border-green-500 bg-green-500/5' : 'border-muted'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-6 w-6 text-blue-500" />
                    Stockfish 17
                  </div>
                  {winner === 'stockfish' && <Badge className="bg-green-500">WINNER</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-500">
                    {result.stockfishAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-muted-foreground">Prediction Accuracy</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Correct</p>
                    <p className="font-semibold">{stockfishCorrect} / {result.completedGames}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-semibold">Centipawn Eval</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hybrid Card */}
            <Card className={`border-2 transition-all ${winner === 'hybrid' ? 'border-green-500 bg-green-500/5' : 'border-muted'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-purple-500" />
                    En Pensent Hybrid
                  </div>
                  {winner === 'hybrid' && <Badge className="bg-green-500">WINNER</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-500">
                    {result.hybridAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-muted-foreground">Prediction Accuracy</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Correct</p>
                    <p className="font-semibold">{hybridCorrect} / {result.completedGames}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-semibold">Temporal Patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistical Summary */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result.completedGames}</p>
                  <p className="text-sm text-muted-foreground">Games Analyzed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result.confidence.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Statistical Confidence</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {(result.hybridAccuracy - result.stockfishAccuracy).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Hybrid Advantage</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">Move 20</p>
                  <p className="text-sm text-muted-foreground">Prediction Point</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Game Results */}
        {attempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Individual Game Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attempts.map((attempt, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{FAMOUS_GAMES_BENCHMARK[i]?.name || `Game ${i + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        Actual: {attempt.actualResult}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Badge variant={attempt.stockfishPrediction === attempt.actualResult ? 'default' : 'destructive'}>
                          SF: {attempt.stockfishPrediction}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Badge variant={attempt.hybridPrediction === attempt.actualResult ? 'default' : 'destructive'}>
                          EP: {attempt.hybridPrediction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
