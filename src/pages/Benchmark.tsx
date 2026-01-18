import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Trophy, Play, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Cloud } from 'lucide-react';
import { runCloudBenchmark, FAMOUS_GAMES, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/cloudBenchmark';
import { checkLichessAvailability } from '@/lib/chess/lichessCloudEval';

export default function Benchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentGame, setCurrentGame] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<PredictionAttempt[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [initPhase, setInitPhase] = useState('Checking Lichess API...');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check Lichess API availability on mount
  useEffect(() => {
    let cancelled = false;
    
    const checkApi = async () => {
      setInitPhase('Checking Lichess Cloud API...');
      
      try {
        const available = await checkLichessAvailability();
        
        if (!cancelled) {
          setApiReady(available);
          setInitPhase(available ? 'Stockfish 17 via Lichess Cloud ready!' : 'API unavailable - check connection');
        }
      } catch (err) {
        console.error('[Benchmark] API check error:', err);
        if (!cancelled) {
          setInitPhase('API check failed - try again');
        }
      }
    };
    
    checkApi();
    
    return () => { cancelled = true; };
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
    console.log('[Benchmark] Starting cloud benchmark with REAL Lichess games...');
    setIsRunning(true);
    setProgress(0);
    setStatus('Fetching real games from Lichess top players...');
    setResult(null);
    setLiveAttempts([]);
    setCurrentGame('');
    setElapsedTime(0);

    try {
      const benchmarkResult = await runCloudBenchmark(
        {
          gameCount: 50, // Analyze 50 real games
          predictionMoveNumber: 20,
          useRealGames: true, // Use REAL Lichess games!
        },
        (statusText, prog, attempt) => {
          console.log('[Benchmark]', statusText, prog.toFixed(1) + '%');
          setStatus(statusText);
          setProgress(prog);
          
          // Extract game name from status
          const match = statusText.match(/(?:Analyzing|Evaluating|Completed):\s*(.+?)(?:\.\.\.)?$/);
          if (match) {
            setCurrentGame(match[1]);
          }
          
          // Add completed attempts to live view
          if (attempt) {
            setLiveAttempts(prev => [...prev, attempt]);
          }
        }
      );

      setResult(benchmarkResult);
      setStatus(`Completed! Analyzed ${benchmarkResult.completedGames} REAL games from Lichess.`);
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
            Testing against 50+ real games from top Lichess players (Magnus, Hikaru, Firouzja & more)
          </p>
        </div>

        {/* API Status */}
        <Card className={`border ${apiReady ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {apiReady ? (
                  <Cloud className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                )}
                <span className="font-medium">
                  {initPhase}
                </span>
              </div>
              <Badge variant={apiReady ? 'default' : 'secondary'} className="gap-1">
                <Cloud className="h-3 w-3" />
                {apiReady ? 'Stockfish 17 Ready' : 'Loading'}
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
                disabled={isRunning || !apiReady}
                size="lg"
                className="gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !apiReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Analyzing...' : !apiReady ? 'Connecting...' : 'Run Benchmark'}
              </Button>
              <div className="text-sm text-muted-foreground">
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Elapsed: {formatTime(elapsedTime)}
                    {progress > 5 && ` • Est. remaining: ${formatTime(remainingTime)}`}
                  </span>
                ) : !apiReady ? (
                  <span className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    Connecting to Lichess Cloud (Stockfish 17)...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Uses Lichess Cloud for Stockfish 17 evaluation
                  </span>
                )}
              </div>
            </div>

            {isRunning && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{status}</span>
                    <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {currentGame && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            Currently analyzing: {currentGame}
                          </p>
                        </div>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-primary">{FAMOUS_GAMES.length}</p>
                    <p className="text-xs text-muted-foreground">Games to Analyze</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-orange-500">~3s</p>
                    <p className="text-xs text-muted-foreground">Per Game (Rate Limited)</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-green-500">~30s</p>
                    <p className="text-xs text-muted-foreground">Total Expected</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Results */}
        {liveAttempts.length > 0 && !result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Live Results ({liveAttempts.length} / {FAMOUS_GAMES.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {liveAttempts.slice(-3).map((attempt, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="font-medium">{attempt.gameName}</span>
                    <div className="flex gap-4">
                      <span className={attempt.stockfishCorrect ? 'text-green-500' : 'text-red-500'}>
                        SF17: {attempt.stockfishCorrect ? '✓' : '✗'}
                      </span>
                      <span className={attempt.hybridCorrect ? 'text-green-500' : 'text-red-500'}>
                        Hybrid: {attempt.hybridCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    <p className="font-semibold">Lichess Cloud</p>
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
              <CardTitle>Individual Game Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.predictionPoints.map((attempt, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{attempt.gameName}</p>
                      <p className="text-xs text-muted-foreground">
                        Actual: {attempt.actualResult.replace('_', ' ')} • 
                        Archetype: {attempt.hybridArchetype}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">SF17 (D{attempt.stockfishDepth})</p>
                        <p className={`font-bold ${attempt.stockfishCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {attempt.stockfishCorrect ? '✓ Correct' : '✗ Wrong'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Hybrid</p>
                        <p className={`font-bold ${attempt.hybridCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {attempt.hybridCorrect ? '✓ Correct' : '✗ Wrong'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Methodology Note */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Methodology:</strong> Both systems analyze the same position at move 20 of each game. 
              Stockfish 17's evaluation is retrieved via Lichess Cloud API (typically depth 30+). 
              The En Pensent Hybrid system combines Color Flow™ pattern recognition with strategic trajectory analysis.
              The winner is the system with more correct predictions of the actual game outcome.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
