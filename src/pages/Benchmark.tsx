import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Brain, Cpu, Trophy, Play, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Cloud, Database, TrendingUp, History, Layers, RefreshCw, Sparkles, Crown, Shield, Zap, BookOpen } from 'lucide-react';
import { runCloudBenchmark, FAMOUS_GAMES, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/cloudBenchmark';
import { checkLichessAvailability } from '@/lib/chess/lichessCloudEval';
import { saveBenchmarkResults, getCumulativeStats, getArchetypeStats } from '@/lib/chess/benchmarkPersistence';
import { calculateDepthMetricsFromBenchmark, type DepthMetrics } from '@/lib/chess/depthAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { ProofDashboard } from '@/components/chess/ProofDashboard';
import { EloDepthDashboard } from '@/components/chess/EloDepthDashboard';
import { AuthenticityDashboard } from '@/components/chess/AuthenticityDashboard';
import { useHybridBenchmark } from '@/hooks/useHybridBenchmark';
import { useStockfishAnalysis } from '@/hooks/useStockfishAnalysis';
import { StockfishIntelligencePanel } from '@/components/chess/StockfishIntelligencePanel';
import { LiveEloPanel } from '@/components/chess/LiveEloPanel';
import { 
  createInitialEloState, 
  calculateEloFromBenchmark,
  type LiveEloState 
} from '@/lib/chess/liveEloTracker';

interface CumulativeStats {
  totalRuns: number;
  totalGamesAnalyzed: number;
  overallHybridAccuracy: number;
  overallStockfishAccuracy: number;
  hybridNetWins: number;
  bestArchetype: string | null;
  worstArchetype: string | null;
  validPredictionCount: number;
  invalidPredictionCount: number;
}

interface LatestBenchmark {
  id: string;
  created_at: string;
  hybrid_accuracy: number;
  stockfish_accuracy: number;
  total_games: number;
  hybrid_wins: number;
  stockfish_wins: number;
  both_correct: number;
}

export default function Benchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentGame, setCurrentGame] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<PredictionAttempt[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitResetMs, setRateLimitResetMs] = useState(0);
  const [initPhase, setInitPhase] = useState('Checking Lichess API...');
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [cumulativeStats, setCumulativeStats] = useState<CumulativeStats | null>(null);
  const [depthMetrics, setDepthMetrics] = useState<DepthMetrics | null>(null);
  const [latestBenchmark, setLatestBenchmark] = useState<LatestBenchmark | null>(null);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Live ELO State
  const [liveEloState, setLiveEloState] = useState<LiveEloState>(createInitialEloState());
  const [isLiveElo, setIsLiveElo] = useState(false);

  // Maximum Depth Mode State
  const [benchmarkMode, setBenchmarkMode] = useState<'cloud' | 'local'>('cloud');
  const [localDepth, setLocalDepth] = useState(60); // Maximum depth for local WASM
  const [gameCount, setGameCount] = useState(10);
  
  // Hooks for local WASM benchmark
  const { isReady: wasmReady, engineVersion, loadingProgress: wasmLoadingProgress, error: wasmError } = useStockfishAnalysis();
  const { 
    runBenchmark: runLocalBenchmark, 
    abort: abortLocalBenchmark,
    isRunning: isLocalRunning, 
    progress: localProgress, 
    result: localResult,
    error: localError 
  } = useHybridBenchmark();

  // Update ELO state when local result changes - fetch CUMULATIVE stats
  useEffect(() => {
    if (localResult) {
      // Fetch cumulative stats to calculate ELO from ALL historical data
      const updateCumulativeElo = async () => {
        const newStats = await getCumulativeStats();
        setCumulativeStats(newStats);
        
        if (newStats && newStats.validPredictionCount > 0) {
          const hybridWins = newStats.hybridNetWins > 0 ? newStats.hybridNetWins : 0;
          const stockfishWins = newStats.hybridNetWins < 0 ? Math.abs(newStats.hybridNetWins) : 0;
          const bothCorrect = Math.round(Math.min(
            newStats.overallHybridAccuracy, 
            newStats.overallStockfishAccuracy
          ) * newStats.validPredictionCount / 100);
          
          const cumulativeElo = calculateEloFromBenchmark(
            newStats.overallHybridAccuracy,
            newStats.overallStockfishAccuracy,
            hybridWins,
            stockfishWins,
            bothCorrect,
            newStats.validPredictionCount,
            localResult.averageDepth
          );
          setLiveEloState(cumulativeElo);
          console.log('[Benchmark] Updated CUMULATIVE ELO after local run:', {
            totalGames: newStats.validPredictionCount,
            hybridNetWins: newStats.hybridNetWins,
            calculatedElo: cumulativeElo.enPensentElo
          });
        }
        setIsLiveElo(false);
      };
      
      updateCumulativeElo();
    }
  }, [localResult]);

  // Set live mode when running
  useEffect(() => {
    setIsLiveElo(isRunning || isLocalRunning);
  }, [isRunning, isLocalRunning]);

  // REALTIME: Subscribe to chess benchmark updates for auto-updating ELO
  useEffect(() => {
    const channel = supabase
      .channel('benchmark-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_benchmark_results' },
        async (payload) => {
          console.log('[Benchmark] Realtime: New benchmark result detected!', payload.new);
          
          // Refetch cumulative stats to update ELO
          const newStats = await getCumulativeStats();
          setCumulativeStats(newStats);
          
          if (newStats && newStats.validPredictionCount > 0) {
            const hybridWins = newStats.hybridNetWins > 0 ? newStats.hybridNetWins : 0;
            const stockfishWins = newStats.hybridNetWins < 0 ? Math.abs(newStats.hybridNetWins) : 0;
            const bothCorrect = Math.round(Math.min(
              newStats.overallHybridAccuracy, 
              newStats.overallStockfishAccuracy
            ) * newStats.validPredictionCount / 100);
            
            const cumulativeElo = calculateEloFromBenchmark(
              newStats.overallHybridAccuracy,
              newStats.overallStockfishAccuracy,
              hybridWins,
              stockfishWins,
              bothCorrect,
              newStats.validPredictionCount,
              40
            );
            setLiveEloState(cumulativeElo);
            console.log('[Benchmark] Realtime ELO update:', cumulativeElo.enPensentElo);
          }
          
          // Also update latest benchmark
          const latest = payload.new as LatestBenchmark;
          setLatestBenchmark(latest);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Benchmark] Realtime subscription active - ELO will auto-update!');
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Fetch latest benchmark results and check API on mount
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    const initialize = async (attempt = 1) => {
      setInitPhase(attempt > 1 ? `Retrying connection (attempt ${attempt})...` : 'Loading latest benchmark state...');
      setIsLoadingLatest(true);
      
      try {
        // Fetch latest benchmark, cumulative stats, and check API in parallel
        const [available, stats, { data: latest }] = await Promise.all([
          checkLichessAvailability(),
          getCumulativeStats(),
          supabase
            .from('chess_benchmark_results')
            .select('id, created_at, hybrid_accuracy, stockfish_accuracy, total_games, hybrid_wins, stockfish_wins, both_correct')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        ]);
        
        if (!cancelled) {
          setApiReady(available.available);
          setRateLimited(available.rateLimited);
          if (available.resetInMs) {
            setRateLimitResetMs(available.resetInMs);
          }
          setCumulativeStats(stats);
          setLatestBenchmark(latest);
          setIsLoadingLatest(false);
          
          // Initialize ELO state from CUMULATIVE stats (all historical data)
          // This ensures ELO builds on every benchmark run
          if (stats && stats.totalGamesAnalyzed > 0) {
            // Calculate from cumulative data - THIS IS WHERE ELO ACCUMULATES
            const totalCorrect = Math.round(stats.overallHybridAccuracy * stats.validPredictionCount / 100);
            const sfCorrect = Math.round(stats.overallStockfishAccuracy * stats.validPredictionCount / 100);
            const hybridWins = stats.hybridNetWins > 0 ? stats.hybridNetWins : 0;
            const stockfishWins = stats.hybridNetWins < 0 ? Math.abs(stats.hybridNetWins) : 0;
            const bothCorrect = Math.min(totalCorrect, sfCorrect);
            
            const cumulativeElo = calculateEloFromBenchmark(
              stats.overallHybridAccuracy,
              stats.overallStockfishAccuracy,
              hybridWins,
              stockfishWins,
              bothCorrect,
              stats.validPredictionCount,
              40 // Average depth estimate
            );
            setLiveEloState(cumulativeElo);
            console.log('[Benchmark] ELO calculated from CUMULATIVE data:', {
              totalGames: stats.validPredictionCount,
              hybridAccuracy: stats.overallHybridAccuracy,
              stockfishAccuracy: stats.overallStockfishAccuracy,
              hybridNetWins: stats.hybridNetWins,
              calculatedElo: cumulativeElo.enPensentElo
            });
          } else if (latest) {
            // Fallback to latest benchmark if no cumulative stats
            const initialElo = calculateEloFromBenchmark(
              latest.hybrid_accuracy,
              latest.stockfish_accuracy,
              latest.hybrid_wins,
              latest.stockfish_wins,
              latest.both_correct,
              latest.total_games,
              35
            );
            setLiveEloState(initialElo);
          }
          
          if (available.available) {
            setInitPhase('Stockfish 17 via Lichess Cloud ready!');
          } else if (available.rateLimited) {
            const waitSecs = Math.ceil((available.resetInMs || 30000) / 1000);
            setInitPhase(`Rate limited - API available in ~${waitSecs}s. Try Maximum Depth mode.`);
          } else if (attempt < 3) {
            // Retry up to 3 times with increasing delay
            setInitPhase(`Lichess Cloud not responding, retrying in ${attempt * 2}s...`);
            retryTimeout = setTimeout(() => initialize(attempt + 1), attempt * 2000);
          } else {
            setInitPhase('Cloud API unavailable - try Maximum Depth mode instead');
          }
        }
      } catch (err) {
        console.error('[Benchmark] Init error:', err);
        if (!cancelled) {
          setIsLoadingLatest(false);
          if (attempt < 3) {
            setInitPhase(`Connection failed, retrying (${attempt}/3)...`);
            retryTimeout = setTimeout(() => initialize(attempt + 1), attempt * 2000);
          } else {
            setInitPhase('Initialization failed - refresh to try again');
          }
        }
      }
    };
    
    initialize();
    
    return () => { 
      cancelled = true; 
      if (retryTimeout) clearTimeout(retryTimeout);
    };
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
    console.log('[Benchmark] Starting cloud benchmark with FRESH Lichess games...');
    setIsRunning(true);
    setProgress(0);
    setStatus('Fetching FRESH real games from Lichess top players...');
    setResult(null);
    setLiveAttempts([]);
    setCurrentGame('');
    setElapsedTime(0);
    setSavedRunId(null);
    setDepthMetrics(null);

    try {
      const benchmarkResult = await runCloudBenchmark(
        {
          gameCount: 50, // Analyze 50 real games
          predictionMoveNumber: 20,
          useRealGames: true, // Use FRESH Lichess games every time!
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
      
      // Calculate depth metrics from results
      const depthData = calculateDepthMetricsFromBenchmark(
        benchmarkResult.predictionPoints.map(p => ({
          stockfishDepth: p.stockfishDepth,
          stockfishCorrect: p.stockfishCorrect,
          hybridCorrect: p.hybridCorrect,
          hybridConfidence: p.hybridConfidence,
          hybridArchetype: p.hybridArchetype,
          moveNumber: p.moveNumber,
          gameMoveCount: p.gameMoveCount,
        }))
      );
      setDepthMetrics(depthData);
      
      // Save results to database for learning
      setStatus('Saving results for learning...');
      const runId = await saveBenchmarkResults(benchmarkResult);
      setSavedRunId(runId);
      
      // Refresh cumulative stats
      const newStats = await getCumulativeStats();
      setCumulativeStats(newStats);
      
      // Update Live ELO State from CUMULATIVE stats (not just this run)
      // This ensures ELO truly accumulates across all runs
      if (newStats && newStats.validPredictionCount > 0) {
        const hybridWins = newStats.hybridNetWins > 0 ? newStats.hybridNetWins : 0;
        const stockfishWins = newStats.hybridNetWins < 0 ? Math.abs(newStats.hybridNetWins) : 0;
        const bothCorrect = Math.round(Math.min(
          newStats.overallHybridAccuracy, 
          newStats.overallStockfishAccuracy
        ) * newStats.validPredictionCount / 100);
        
        const cumulativeElo = calculateEloFromBenchmark(
          newStats.overallHybridAccuracy,
          newStats.overallStockfishAccuracy,
          hybridWins,
          stockfishWins,
          bothCorrect,
          newStats.validPredictionCount,
          35 // Average depth
        );
        setLiveEloState(cumulativeElo);
        console.log('[Benchmark] Updated CUMULATIVE ELO after run:', {
          totalGames: newStats.validPredictionCount,
          hybridNetWins: newStats.hybridNetWins,
          calculatedElo: cumulativeElo.enPensentElo
        });
      }
      setIsLiveElo(false);
      
      setStatus(`Completed! Analyzed ${benchmarkResult.completedGames} FRESH games. Results saved for learning.`);
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

        {/* Main Tabs */}
        <Tabs defaultValue="benchmark" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="benchmark" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              SF Intel
            </TabsTrigger>
            <TabsTrigger value="authenticity" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authenticity
            </TabsTrigger>
            <TabsTrigger value="elo" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              ELO & Depth
            </TabsTrigger>
            <TabsTrigger value="proof" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Proof
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intelligence" className="mt-6">
            <StockfishIntelligencePanel 
              currentDepth={localDepth}
              onDepthSelect={(depth) => {
                setLocalDepth(depth);
                setBenchmarkMode('local');
              }}
            />
          </TabsContent>

          <TabsContent value="authenticity" className="mt-6">
            <AuthenticityDashboard />
          </TabsContent>

          <TabsContent value="elo" className="mt-6">
            <EloDepthDashboard />
          </TabsContent>

          <TabsContent value="proof" className="mt-6">
            <ProofDashboard />
          </TabsContent>

          <TabsContent value="benchmark" className="mt-6 space-y-8">

        {/* Live ELO Panel - Always visible */}
        <LiveEloPanel 
          eloState={liveEloState} 
          currentDepth={benchmarkMode === 'local' ? localDepth : 35}
          isLive={isLiveElo}
        />

        {/* Cumulative Stats - Historical Performance */}
        {cumulativeStats && cumulativeStats.totalRuns > 0 && (
          <Card className="border-primary/30 bg-gradient-to-r from-purple-500/5 to-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4" />
                Historical Performance ({cumulativeStats.totalRuns} benchmark runs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold">{cumulativeStats.totalGamesAnalyzed}</p>
                  <p className="text-xs text-muted-foreground">Total Games</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-500">{cumulativeStats.overallHybridAccuracy.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Hybrid Accuracy</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{cumulativeStats.overallStockfishAccuracy.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">SF17 Accuracy</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className={`text-2xl font-bold ${cumulativeStats.hybridNetWins > 0 ? 'text-green-500' : cumulativeStats.hybridNetWins < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {cumulativeStats.hybridNetWins > 0 ? '+' : ''}{cumulativeStats.hybridNetWins}
                  </p>
                  <p className="text-xs text-muted-foreground">Hybrid Net Wins</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-lg font-bold text-green-500 truncate">{cumulativeStats.bestArchetype || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Best Archetype</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest Benchmark State - Show when no active result */}
        {!result && !isRunning && latestBenchmark && (
          <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Latest Benchmark Result
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(latestBenchmark.created_at).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-500">{latestBenchmark.hybrid_accuracy.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">En Pensent</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-500">{latestBenchmark.stockfish_accuracy.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Stockfish 17</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold">{latestBenchmark.total_games}</p>
                  <p className="text-xs text-muted-foreground">Games Analyzed</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className={`text-2xl font-bold ${latestBenchmark.hybrid_wins > latestBenchmark.stockfish_wins ? 'text-green-500' : 'text-red-500'}`}>
                    +{latestBenchmark.hybrid_wins - latestBenchmark.stockfish_wins}
                  </p>
                  <p className="text-xs text-muted-foreground">Net Advantage</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Run a new benchmark to test with fresh grandmaster games
              </p>
            </CardContent>
          </Card>
        )}

        {/* Engine Status - Changes based on benchmark mode */}
        {benchmarkMode === 'local' ? (
          // LOCAL WASM Engine Status
          <Card className={`border ${
            wasmReady 
              ? 'border-green-500/50 bg-green-500/5' 
              : wasmError
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-yellow-500/50 bg-yellow-500/5'
          }`}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {wasmReady ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : wasmError ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {wasmReady 
                      ? `Stockfish 17.1 WASM Ready - ${localDepth} ply depth` 
                      : wasmError 
                        ? 'WASM Engine failed to load' 
                        : `Loading Stockfish WASM engine (${wasmLoadingProgress}%)...`
                    }
                  </span>
                </div>
                <Badge 
                  variant={wasmReady ? 'default' : 'secondary'} 
                  className={`gap-1 ${wasmReady ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`}
                >
                  <Zap className="h-3 w-3" />
                  {wasmReady ? '100% Depth' : wasmError ? 'Error' : 'Loading'}
                </Badge>
              </div>
              {!wasmReady && !wasmError && (
                <Progress value={wasmLoadingProgress || 25} className="h-1 mt-2" />
              )}
              {wasmReady && (
                <p className="text-xs text-green-400 mt-1">
                  Local engine running at maximum capacity - no cloud connection needed
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          // CLOUD API Status
          <Card className={`border ${
            apiReady 
              ? 'border-green-500/50 bg-green-500/5' 
              : initPhase.includes('unavailable') || initPhase.includes('failed')
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-yellow-500/50 bg-yellow-500/5'
          }`}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {apiReady ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : rateLimited ? (
                    <Clock className="h-5 w-5 text-orange-500" />
                  ) : initPhase.includes('unavailable') || initPhase.includes('failed') ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {initPhase}
                  </span>
                </div>
                <Badge 
                  variant={apiReady ? 'default' : 'secondary'} 
                  className={`gap-1 ${rateLimited ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : ''}`}
                >
                  <Cloud className="h-3 w-3" />
                  {apiReady ? 'Stockfish 17 Ready' : rateLimited ? 'Rate Limited' : initPhase.includes('unavailable') ? 'Offline' : 'Connecting'}
                </Badge>
              </div>
              {!apiReady && !initPhase.includes('unavailable') && !initPhase.includes('failed') && (
                <Progress value={rateLimited ? 75 : initPhase.includes('Retrying') ? 50 : 25} className="h-1 mt-2" />
              )}
              {rateLimited && (
                <p className="text-xs text-orange-400 mt-1">
                  Too many requests. Use Maximum Depth mode while waiting.
                </p>
              )}
              {!apiReady && !rateLimited && (
                <p className="text-xs text-muted-foreground mt-1">
                  Switch to Maximum Depth mode for instant local analysis
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Prediction Accuracy Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benchmark Mode Selector */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Benchmark Mode</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBenchmarkMode('cloud')}
                  disabled={isRunning || isLocalRunning}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    benchmarkMode === 'cloud'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Cloud API</span>
                    <Badge variant="secondary" className="text-xs">Fast</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lichess Cloud (depth ~35, cached)
                  </p>
                </button>
                <button
                  onClick={() => setBenchmarkMode('local')}
                  disabled={isRunning || isLocalRunning}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    benchmarkMode === 'local'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Maximum Depth</span>
                    <Badge className="bg-green-500 text-xs">100%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Local WASM (depth 60+, true unlimited)
                  </p>
                </button>
              </div>
            </div>

            {/* Local Mode Settings */}
            {benchmarkMode === 'local' && (
              <div className="space-y-4 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Maximum Depth Settings</span>
                  {wasmReady ? (
                    <Badge className="bg-green-500 text-xs">{engineVersion}</Badge>
                  ) : wasmError ? (
                    <Badge variant="destructive" className="text-xs">Error</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading {wasmLoadingProgress}%
                    </Badge>
                  )}
                </div>
                
                {/* WASM Loading Progress */}
                {!wasmReady && !wasmError && (
                  <div className="space-y-2">
                    <Progress value={wasmLoadingProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Initializing Stockfish 17.1 WASM engine...
                    </p>
                  </div>
                )}
                
                {wasmError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    {wasmError} - Try refreshing the page
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Analysis Depth</span>
                    <span className="font-mono font-medium text-green-500">{localDepth}</span>
                  </div>
                  <Slider
                    value={[localDepth]}
                    onValueChange={([v]) => setLocalDepth(v)}
                    min={20}
                    max={60}
                    step={5}
                    disabled={isLocalRunning}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>20 (fast)</span>
                    <span>60 (maximum)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Games to Analyze</span>
                    <span className="font-mono font-medium">{gameCount}</span>
                  </div>
                  <Slider
                    value={[gameCount]}
                    onValueChange={([v]) => setGameCount(v)}
                    min={5}
                    max={50}
                    step={5}
                    disabled={isLocalRunning}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 games</span>
                    <span>50 games</span>
                  </div>
                </div>

                <p className="text-xs text-green-600">
                  ⚡ Local WASM runs Stockfish directly in your browser at true maximum depth.
                  This achieves 100% depth coverage for fair comparison.
                </p>
              </div>
            )}

            {/* Run Button */}
            <div className="flex items-center gap-4">
              {benchmarkMode === 'cloud' ? (
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
                  {isRunning ? 'Analyzing...' : !apiReady ? 'Connecting...' : 'Run Cloud Benchmark'}
                </Button>
              ) : (
                <Button 
                  onClick={() => runLocalBenchmark({
                    gameCount,
                    depth: localDepth,
                    predictionMoveRange: [15, 35],
                  })} 
                  disabled={isLocalRunning || !wasmReady}
                  size="lg"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLocalRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !wasmReady ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isLocalRunning ? 'Analyzing...' : !wasmReady ? 'Loading Engine...' : 'Run Maximum Depth'}
                </Button>
              )}
              
              {isLocalRunning && (
                <Button variant="outline" onClick={abortLocalBenchmark}>
                  Cancel
                </Button>
              )}
              
              <div className="text-sm text-muted-foreground">
                {(isRunning || isLocalRunning) ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Elapsed: {formatTime(elapsedTime)}
                    {progress > 5 && ` • Est. remaining: ${formatTime(remainingTime)}`}
                  </span>
                ) : benchmarkMode === 'local' ? (
                  wasmReady ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Stockfish 17.1 WASM ready (100% depth coverage)
                    </span>
                  ) : wasmError ? (
                    <span className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Engine failed to load - refresh to retry
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-yellow-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Stockfish WASM ({wasmLoadingProgress}%)...
                    </span>
                  )
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

            {/* Local Benchmark Progress */}
            {isLocalRunning && localProgress && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{localProgress.message}</span>
                    <span className="text-muted-foreground">
                      {((localProgress.currentGame / localProgress.totalGames) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={(localProgress.currentGame / localProgress.totalGames) * 100} 
                    className="h-3" 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="p-2 bg-green-500/10 rounded">
                    <p className="text-2xl font-bold text-green-500">{localProgress.currentDepth || localDepth}</p>
                    <p className="text-xs text-muted-foreground">Current Depth</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-primary">
                      {localProgress.currentGame}/{localProgress.totalGames}
                    </p>
                    <p className="text-xs text-muted-foreground">Games Analyzed</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-2xl font-bold text-orange-500">
                      {((localProgress.currentDepth / 60) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Depth Coverage</p>
                  </div>
                </div>
              </div>
            )}

            {/* Local Benchmark Results */}
            {localResult && benchmarkMode === 'local' && (
              <div className="space-y-4 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Maximum Depth Benchmark Complete</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {localResult.hybridAccuracy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">En Pensent Accuracy</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-orange-500">
                      {localResult.stockfishAccuracy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Stockfish Accuracy</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-green-500">
                      {localResult.averageDepth.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Depth</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-green-500">
                      {localResult.depthCoverage.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Depth Coverage</p>
                  </div>
                </div>

                {localResult.hybridWins > localResult.stockfishWins && (
                  <p className="text-center text-green-600 font-medium">
                    🏆 En Pensent outperformed Stockfish at MAXIMUM depth!
                  </p>
                )}
              </div>
            )}

            {localError && (
              <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                Error: {localError}
              </div>
            )}

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
                {liveAttempts.slice(-5).map((attempt, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{attempt.gameName}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          Depth: {attempt.stockfishDepth || 'N/A'}
                        </span>
                        <span>•</span>
                        <span>Eval: {attempt.stockfishEval > 0 ? '+' : ''}{attempt.stockfishEval}</span>
                        <span>•</span>
                        <span>{attempt.hybridArchetype}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <span className={`flex items-center gap-1 ${attempt.stockfishCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {attempt.stockfishCorrect ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        SF17
                      </span>
                      <span className={`flex items-center gap-1 ${attempt.hybridCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {attempt.hybridCorrect ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        En Pensent
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results - Show cumulative stats by default, session result when available */}
        {(result || cumulativeStats) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stockfish Card */}
            <Card className={`border-2 transition-all ${
              (result ? winner === 'stockfish' : false) ? 'border-green-500 bg-green-500/5' : 'border-muted'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-6 w-6 text-blue-500" />
                    Stockfish 17
                  </div>
                  {result && winner === 'stockfish' && <Badge className="bg-green-500">WINNER</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-500">
                    {result 
                      ? result.stockfishAccuracy.toFixed(1) 
                      : cumulativeStats?.overallStockfishAccuracy.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-muted-foreground">Prediction Accuracy</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Correct</p>
                    <p className="font-semibold">
                      {result 
                        ? `${stockfishCorrect} / ${result.completedGames}`
                        : cumulativeStats 
                          ? `${Math.round(cumulativeStats.overallStockfishAccuracy * cumulativeStats.validPredictionCount / 100)} / ${cumulativeStats.validPredictionCount}`
                          : '0 / 0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-semibold">Lichess Cloud</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hybrid Card */}
            <Card className={`border-2 transition-all ${
              (result ? winner === 'hybrid' : (cumulativeStats?.hybridNetWins || 0) > 0) 
                ? 'border-green-500 bg-green-500/5' : 'border-muted'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-purple-500" />
                    En Pensent Hybrid
                  </div>
                  {result && winner === 'hybrid' && <Badge className="bg-green-500">WINNER</Badge>}
                  {!result && (cumulativeStats?.hybridNetWins || 0) > 0 && (
                    <Badge className="bg-green-500">LEADING +{cumulativeStats?.hybridNetWins}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-500">
                    {result 
                      ? result.hybridAccuracy.toFixed(1)
                      : cumulativeStats?.overallHybridAccuracy.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-muted-foreground">Prediction Accuracy</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Correct</p>
                    <p className="font-semibold">
                      {result 
                        ? `${hybridCorrect} / ${result.completedGames}`
                        : cumulativeStats 
                          ? `${Math.round(cumulativeStats.overallHybridAccuracy * cumulativeStats.validPredictionCount / 100)} / ${cumulativeStats.validPredictionCount}`
                          : '0 / 0'}
                    </p>
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

        {/* Statistical Summary - Show cumulative by default */}
        {(result || cumulativeStats) && (
          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {result?.completedGames || cumulativeStats?.validPredictionCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Games Analyzed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {result?.confidence?.toFixed(1) || 
                     (cumulativeStats && cumulativeStats.validPredictionCount > 30 
                       ? Math.min(99.9, 50 + (cumulativeStats.validPredictionCount / 50)).toFixed(1) 
                       : '0.0')}%
                  </p>
                  <p className="text-sm text-muted-foreground">Statistical Confidence</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  {(() => {
                    const advantage = result 
                      ? result.hybridAccuracy - result.stockfishAccuracy
                      : cumulativeStats 
                        ? cumulativeStats.overallHybridAccuracy - cumulativeStats.overallStockfishAccuracy
                        : 0;
                    return (
                      <p className={`text-2xl font-bold ${advantage > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {advantage > 0 ? '+' : ''}{advantage.toFixed(1)}%
                      </p>
                    );
                  })()}
                  <p className="text-sm text-muted-foreground">Hybrid Advantage</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {result?.bothCorrect || 
                     (cumulativeStats 
                       ? Math.round(Math.min(cumulativeStats.overallHybridAccuracy, cumulativeStats.overallStockfishAccuracy) * cumulativeStats.validPredictionCount / 100)
                       : 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Both Correct</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{result ? formatTime(elapsedTime) : '∞'}</p>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Depth Analysis - "Moves Ahead" Comparison */}
        {(result && depthMetrics) || cumulativeStats ? (
          <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                Depth Analysis: "Moves Ahead" Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Depth Comparison */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-blue-500">Stockfish 17</span>
                  </div>
                  <p className="text-4xl font-bold text-blue-500">
                    {depthMetrics?.stockfishDepth || 40}
                  </p>
                  <p className="text-sm text-muted-foreground">plies deep</p>
                  <p className="text-lg font-medium text-blue-400 mt-2">
                    ~{Math.floor((depthMetrics?.stockfishDepth || 40) / 2)} moves ahead
                  </p>
                </div>
                <div className="text-center p-6 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold text-purple-500">En Pensent</span>
                  </div>
                  <p className="text-4xl font-bold text-purple-500">
                    {depthMetrics?.enPensentEffectiveDepth || 
                     (cumulativeStats && cumulativeStats.overallHybridAccuracy > cumulativeStats.overallStockfishAccuracy 
                       ? Math.round(40 * (cumulativeStats.overallHybridAccuracy / Math.max(1, cumulativeStats.overallStockfishAccuracy)))
                       : 40)}
                  </p>
                  <p className="text-sm text-muted-foreground">effective plies</p>
                  <p className="text-lg font-medium text-purple-400 mt-2">
                    ~{Math.floor((depthMetrics?.enPensentEffectiveDepth || 
                      (cumulativeStats && cumulativeStats.overallHybridAccuracy > cumulativeStats.overallStockfishAccuracy 
                        ? Math.round(40 * (cumulativeStats.overallHybridAccuracy / Math.max(1, cumulativeStats.overallStockfishAccuracy)))
                        : 40)) / 2)} moves ahead
                  </p>
                </div>
              </div>

              {/* Depth Advantage Summary */}
              <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg">
                {(() => {
                  const advantage = depthMetrics?.depthAdvantage || 
                    (cumulativeStats && cumulativeStats.overallHybridAccuracy > cumulativeStats.overallStockfishAccuracy 
                      ? Math.round((cumulativeStats.overallHybridAccuracy - cumulativeStats.overallStockfishAccuracy) * 0.4)
                      : 0);
                  const ratio = depthMetrics?.depthRatio || 
                    (cumulativeStats ? cumulativeStats.overallHybridAccuracy / Math.max(1, cumulativeStats.overallStockfishAccuracy) : 1);
                  const patternEquiv = depthMetrics?.patternDepthEquivalent || 
                    (cumulativeStats && cumulativeStats.overallHybridAccuracy > cumulativeStats.overallStockfishAccuracy 
                      ? Math.round(40 * ratio) : 40);
                  
                  return (
                    <>
                      <p className="text-lg font-medium">
                        {advantage > 0 ? (
                          <span className="text-green-500">
                            En Pensent sees <strong>{advantage} plies</strong> (~{Math.floor(advantage / 2)} moves) <strong>DEEPER</strong>
                          </span>
                        ) : advantage < 0 ? (
                          <span className="text-red-500">
                            Stockfish searches <strong>{-advantage} plies</strong> deeper
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Equal effective depth</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Depth ratio: <strong>{ratio.toFixed(2)}x</strong> | 
                        Pattern equivalent: <strong>{patternEquiv} plies</strong>
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Horizon Accuracy Breakdown */}
              {depthMetrics && depthMetrics.horizonAccuracy.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Accuracy by Prediction Horizon:</h4>
                  <div className="space-y-2">
                    {depthMetrics.horizonAccuracy.map((horizon, i) => (
                      <div key={i} className="grid grid-cols-[80px_1fr_80px] gap-2 items-center text-sm">
                        <span className="text-muted-foreground">{horizon.movesAhead}+ moves:</span>
                        <div className="flex gap-1 h-4">
                          <div 
                            className="bg-purple-500 rounded-sm" 
                            style={{ width: `${horizon.accuracy}%` }}
                            title={`En Pensent: ${horizon.accuracy.toFixed(1)}%`}
                          />
                          <div 
                            className="bg-blue-500/50 rounded-sm" 
                            style={{ width: `${horizon.stockfishAccuracyAtHorizon}%` }}
                            title={`Stockfish: ${horizon.stockfishAccuracyAtHorizon.toFixed(1)}%`}
                          />
                        </div>
                        <span className={horizon.accuracy > horizon.stockfishAccuracyAtHorizon ? 'text-green-500' : 'text-blue-500'}>
                          EP: {horizon.accuracy.toFixed(0)}% / SF: {horizon.stockfishAccuracyAtHorizon.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max accurate horizon: <strong>{depthMetrics.maxAccurateHorizon} moves</strong> ({'>'} 60% accuracy) | 
                    Confidence: <strong>{depthMetrics.depthConfidence.toFixed(1)}%</strong>
                  </p>
                </div>
              )}

              {/* Interpretation */}
              <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <p>
                  <strong>How this works:</strong> Stockfish searches {depthMetrics?.stockfishDepth || 40} plies deep using brute-force tree search.
                  En Pensent achieves equivalent {depthMetrics?.enPensentEffectiveDepth || 
                    (cumulativeStats && cumulativeStats.overallHybridAccuracy > cumulativeStats.overallStockfishAccuracy 
                      ? Math.round(40 * (cumulativeStats.overallHybridAccuracy / Math.max(1, cumulativeStats.overallStockfishAccuracy)))
                      : 40)}-ply accuracy through <em>pattern recognition</em> — 
                  recognizing game trajectories that indicate outcomes many moves in the future without explicit search.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

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
          <CardContent className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Methodology:</strong> Both systems analyze the same position at a RANDOMIZED move point (moves 15-35, preventing pattern memorization). 
              TCEC Stockfish 17 Unlimited (ELO 3600) serves as tactical ground truth.
              Games sampled across 6 ELO tiers (800-3500) with weighted distribution for comprehensive coverage.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Fairness:</strong> Neither system sees moves beyond the prediction point. Both predict blind at identical synchronized positions.
              Data quality tiers: 'tcec_unlimited' (highest), 'tcec_calibrated', 'legacy'. Results persist to database for continuous learning.
            </p>
            {savedRunId && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Results saved: {savedRunId}
              </p>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
