import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Trophy, Play, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { runQuickBenchmark, FAMOUS_GAMES_BENCHMARK, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/benchmark';
import { getStockfishEngine } from '@/lib/chess/stockfishEngine';

export default function Benchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<PredictionAttempt[]>([]);
  const [engineReady, setEngineReady] = useState(false);
  const [initPhase, setInitPhase] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check engine status on mount
  useEffect(() => {
    const checkEngine = async () => {
      setInitPhase('Loading Stockfish WASM engine...');
      const engine = getStockfishEngine();
      const ready = await engine.waitReady();
      setEngineReady(ready);
      setInitPhase(ready ? 'Engine ready' : 'Engine failed to load');
      console.log('[Benchmark] Stockfish engine ready:', ready);
    };
    checkEngine();
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const runBenchmark = async () => {
    console.log('[Benchmark] Starting benchmark...');
    setIsRunning(true);
    setProgress(0);
    setStatus('Initializing Stockfish 17 engine...');
    setResult(null);
    setLiveAttempts([]);
    setCurrentGameIndex(0);
    setElapsedTime(0);

    try {
      // Make sure engine is ready
      console.log('[Benchmark] Waiting for engine...');
      const engine = getStockfishEngine();
      const ready = await engine.waitReady();
      console.log('[Benchmark] Engine ready:', ready);
      
      if (!ready) {
        setStatus('Error: Stockfish engine failed to initialize');
        setIsRunning(false);
        return;
      }

      setStatus('Engine ready. Starting game analysis...');
      console.log('[Benchmark] Preparing games...');
      
      const games = FAMOUS_GAMES_BENCHMARK.map(g => ({
        pgn: g.pgn,
        result: g.result,
      }));

      console.log('[Benchmark] Running benchmark on', games.length, 'games');

      // Enhanced progress callback that updates live results
      const benchmarkResult = await runQuickBenchmark(
        games,
        20, // Predict at move 20
        18, // Stockfish depth 18
        (statusText, prog) => {
          console.log('[Benchmark] Progress:', statusText, prog.toFixed(1) + '%');
          setStatus(statusText);
          setProgress(prog);
          
          // Parse game index from status
          const match = statusText.match(/game (\d+)/i);
          if (match) {
            setCurrentGameIndex(parseInt(match[1]) - 1);
          }
        }
      );

      // Set live attempts as results come in
      setLiveAttempts(benchmarkResult.predictionPoints);
      setResult(benchmarkResult);
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
  const stockfishCorrect = result?.predictionPoints.filter(p => p.stockfishCorrect).length ?? 0;
  const hybridCorrect = result?.predictionPoints.filter(p => p.hybridCorrect).length ?? 0;

  // Estimate remaining time based on progress
  const estimatedTotalTime = progress > 0 ? Math.ceil(elapsedTime / (progress / 100)) : 0;
  const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            EN PENSENT vs STOCKFISH 17
          </h1>
          <p className="text-muted-foreground text-lg">
            Real predictions • Real games • Real results
          </p>
          <p className="text-sm text-muted-foreground/70 italic">
            Testing against {FAMOUS_GAMES_BENCHMARK.length} famous historical games with known outcomes
          </p>
        </div>

        {/* Engine Status */}
        <Card className={`border ${engineReady ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {engineReady ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                )}
                <span className="font-medium">
                  {engineReady ? 'Stockfish 17 WASM Ready' : initPhase || 'Loading engine...'}
                </span>
              </div>
              <Badge variant={engineReady ? 'default' : 'secondary'}>
                {engineReady ? 'Ready' : 'Loading'}
              </Badge>
            </div>
          </CardContent>
        </Card>

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
                disabled={isRunning || !engineReady}
                size="lg"
                className="gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !engineReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Analyzing...' : !engineReady ? 'Loading Engine...' : 'Run Real Benchmark'}
              </Button>
              <div className="text-sm text-muted-foreground">
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Elapsed: {formatTime(elapsedTime)}
                    {progress > 5 && ` • Est. remaining: ${formatTime(remainingTime)}`}
                  </span>
                ) : !engineReady ? (
                  <span className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    Please wait for Stockfish WASM to load...
                  </span>
                ) : (
                  'Analyzes each game position with Stockfish depth 18'
                )}
              </div>
            </div>

            {isRunning && (
              <div className="space-y-4">
                {/* Main progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{status}</span>
                    <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Current game being analyzed */}
                {currentGameIndex < FAMOUS_GAMES_BENCHMARK.length && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            Currently analyzing: {FAMOUS_GAMES_BENCHMARK[currentGameIndex]?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {FAMOUS_GAMES_BENCHMARK[currentGameIndex]?.year} • 
                            {' '}{FAMOUS_GAMES_BENCHMARK[currentGameIndex]?.white} vs {FAMOUS_GAMES_BENCHMARK[currentGameIndex]?.black}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Game {currentGameIndex + 1} of {FAMOUS_GAMES_BENCHMARK.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Expected time estimate */}
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-primary">{FAMOUS_GAMES_BENCHMARK.length}</p>
                    <p className="text-xs text-muted-foreground">Games to Analyze</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-orange-500">~15-30s</p>
                    <p className="text-xs text-muted-foreground">Per Game (Depth 18)</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-green-500">~5-10 min</p>
                    <p className="text-xs text-muted-foreground">Total Expected</p>
                  </div>
                </div>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result.completedGames}</p>
                  <p className="text-sm text-muted-foreground">Games Analyzed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result.confidence.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Statistical Confidence</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className={`text-2xl font-bold ${(result.hybridAccuracy - result.stockfishAccuracy) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(result.hybridAccuracy - result.stockfishAccuracy) > 0 ? '+' : ''}{(result.hybridAccuracy - result.stockfishAccuracy).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Hybrid Advantage</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result.bothCorrect}</p>
                  <p className="text-sm text-muted-foreground">Both Correct</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Game Results */}
        {result && result.predictionPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Individual Game Predictions (Real Data)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {result.predictionPoints.map((attempt, i) => {
                  const game = FAMOUS_GAMES_BENCHMARK[i];
                  return (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{game?.name || `Game ${i + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {game?.year} • {game?.white} vs {game?.black}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Archetype: <span className="text-primary">{attempt.hybridArchetype}</span> • 
                          SF Eval: <span className="font-mono">{attempt.stockfishEval > 0 ? '+' : ''}{attempt.stockfishEval}</span> cp
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Actual Result */}
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-muted-foreground mb-1">Actual</p>
                          <Badge variant="outline" className="text-xs">
                            {attempt.actualResult === 'white_wins' ? 'White' : attempt.actualResult === 'black_wins' ? 'Black' : 'Draw'}
                          </Badge>
                        </div>
                        
                        {/* Stockfish Prediction */}
                        <div className="text-center min-w-[90px]">
                          <p className="text-xs text-muted-foreground mb-1">Stockfish</p>
                          <div className="flex items-center gap-1">
                            {attempt.stockfishCorrect ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={attempt.stockfishCorrect ? 'default' : 'destructive'} className="text-xs">
                              {attempt.stockfishPrediction === 'white_wins' ? 'W' : attempt.stockfishPrediction === 'black_wins' ? 'B' : 'D'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Hybrid Prediction */}
                        <div className="text-center min-w-[90px]">
                          <p className="text-xs text-muted-foreground mb-1">En Pensent</p>
                          <div className="flex items-center gap-1">
                            {attempt.hybridCorrect ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={attempt.hybridCorrect ? 'default' : 'destructive'} className="text-xs">
                              {attempt.hybridPrediction === 'white_wins' ? 'W' : attempt.hybridPrediction === 'black_wins' ? 'B' : 'D'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Methodology Note */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Methodology:</strong> Each game is analyzed at move 20 with Stockfish depth 18 (~50,000-80,000 nodes). 
              Both systems predict the final outcome (white wins, black wins, or draw), which is compared against the 
              historical result. All data is real—no simulation, no shortcuts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
