import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Cpu, Trophy, Play, Loader2, Clock, CheckCircle, XCircle, Cloud, Database, RefreshCw, Zap, Server, ChevronRight, ExternalLink } from 'lucide-react';
import { runCloudBenchmark, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/cloudBenchmark';
import { checkLichessAvailability } from '@/lib/chess/lichessCloudEval';
import { saveBenchmarkResults, getCumulativeStats } from '@/lib/chess/benchmarkPersistence';
import { supabase } from '@/integrations/supabase/client';
import { useHybridBenchmark, type LivePredictionData } from '@/hooks/useHybridBenchmark';
import { useStockfishAnalysis } from '@/hooks/useStockfishAnalysis';
import { createInitialEloState, calculateEloFromBenchmark, type LiveEloState } from '@/lib/chess/liveEloTracker';
import { useBenchmarkRateLimit } from '@/hooks/useRateLimitV2';
import { acquireBenchmarkLock, releaseBenchmarkLock } from '@/lib/chess/benchmarkCoordinator';
import { useRealtimeAccuracyContext } from '@/providers/RealtimeAccuracyProvider';
import { BenchmarkSourceBreakdown } from '@/components/chess/BenchmarkSourceBreakdown';
import { getCorrelationEngine, normalizeChessSignal } from '@/lib/pensent-core/crossDomainCorrelation';
import './Benchmark.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CumulativeStats {
  totalRuns: number;
  totalGamesAnalyzed: number;
  overallHybridAccuracy: number;
  overallStockfishAccuracy: number;
  hybridNetWins: number;
  hybridWins: number;
  stockfishWins: number;
  bothCorrect: number;
  bestArchetype: string | null;
  worstArchetype: string | null;
  validPredictionCount: number;
  invalidPredictionCount: number;
}

interface FarmStatus {
  farm_id: string;
  farm_name: string | null;
  status: string;
  message: string | null;
  chess_games_generated: number;
  last_heartbeat_at: string;
}

interface GameDetail {
  id: string;
  game_id: string;
  game_name: string | null;
  move_number: number | null;
  fen: string | null;
  pgn: string | null;
  stockfish_eval: number | null;
  stockfish_depth: number | null;
  stockfish_prediction: string | null;
  stockfish_confidence: number | null;
  stockfish_correct: boolean | null;
  hybrid_prediction: string | null;
  hybrid_confidence: number | null;
  hybrid_archetype: string | null;
  hybrid_correct: boolean | null;
  actual_result: string | null;
  position_hash: string | null;
  data_source: string | null;
  data_quality_tier: string | null;
  worker_id: string | null;
  created_at: string;
  white_elo: number | null;
  black_elo: number | null;
  time_control: string | null;
  lichess_id_verified: boolean | null;
}

// ─── Game Detail Modal ───────────────────────────────────────────────────────

function GameDetailModal({ game }: { game: GameDetail }) {
  const isLichess = game.game_id && !game.game_id.startsWith('cc_') && game.game_id.length === 8;
  const isChessCom = game.game_id?.startsWith('cc_');
  const rawId = game.game_id?.replace(/^(li_|cc_)/, '');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">{game.game_id}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {game.data_source || 'unknown'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {game.game_name || 'Unknown'} — {game.actual_result?.replace('_', ' ')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-xs font-medium ${game.hybrid_correct ? 'text-green-500' : 'text-red-500'}`}>
                EP {game.hybrid_correct ? '✓' : '✗'}
              </span>
              <span className={`text-xs font-medium ${game.stockfish_correct ? 'text-green-500' : 'text-red-500'}`}>
                SF {game.stockfish_correct ? '✓' : '✗'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Game Details: {game.game_id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Verification Links */}
          <div className="flex gap-2">
            {isLichess && (
              <a href={`https://lichess.org/${rawId}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-purple-500 hover:underline">
                <ExternalLink className="h-3 w-3" /> View on Lichess
              </a>
            )}
            {isChessCom && (
              <a href={`https://www.chess.com/game/live/${rawId}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-orange-500 hover:underline">
                <ExternalLink className="h-3 w-3" /> View on Chess.com
              </a>
            )}
          </div>

          {/* Identity */}
          <Section title="Identity">
            <Row label="Game ID" value={game.game_id} mono />
            <Row label="Game Name" value={game.game_name} />
            <Row label="Data Source" value={game.data_source} />
            <Row label="Quality Tier" value={game.data_quality_tier} />
            <Row label="Worker ID" value={game.worker_id} />
            <Row label="Created" value={game.created_at ? new Date(game.created_at).toLocaleString() : null} />
            <Row label="Lichess Verified" value={game.lichess_id_verified ? 'Yes' : 'No'} />
          </Section>

          {/* Position */}
          <Section title="Position">
            <Row label="Move Number" value={game.move_number?.toString()} />
            <Row label="FEN" value={game.fen} mono small />
            <Row label="Position Hash" value={game.position_hash} mono small />
            {game.pgn && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">PGN</p>
                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32 whitespace-pre-wrap">{game.pgn}</pre>
              </div>
            )}
          </Section>

          {/* Predictions */}
          <Section title="Predictions vs Actual">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-3 rounded-lg border ${game.stockfish_correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                <p className="text-xs text-muted-foreground">Stockfish 17</p>
                <p className="font-bold text-lg">{game.stockfish_prediction?.replace('_', ' ') || '—'}</p>
                <p className="text-xs">Eval: {game.stockfish_eval ?? '—'} | Depth: {game.stockfish_depth ?? '—'}</p>
                <p className="text-xs">Confidence: {game.stockfish_confidence ?? '—'}%</p>
                <Badge className={`mt-1 ${game.stockfish_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                  {game.stockfish_correct ? 'CORRECT' : 'WRONG'}
                </Badge>
              </div>
              <div className={`p-3 rounded-lg border ${game.hybrid_correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                <p className="text-xs text-muted-foreground">En Pensent</p>
                <p className="font-bold text-lg">{game.hybrid_prediction?.replace('_', ' ') || '—'}</p>
                <p className="text-xs">Archetype: {game.hybrid_archetype || '—'}</p>
                <p className="text-xs">Confidence: {game.hybrid_confidence ?? '—'}%</p>
                <Badge className={`mt-1 ${game.hybrid_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                  {game.hybrid_correct ? 'CORRECT' : 'WRONG'}
                </Badge>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">Actual Result</p>
                <p className="font-bold text-lg">{game.actual_result?.replace('_', ' ') || '—'}</p>
                <p className="text-xs mt-1">&nbsp;</p>
                <p className="text-xs">&nbsp;</p>
                <Badge variant="outline" className="mt-1">GROUND TRUTH</Badge>
              </div>
            </div>
          </Section>

          {/* Game Metadata */}
          <Section title="Game Metadata">
            <Row label="White ELO" value={game.white_elo?.toString()} />
            <Row label="Black ELO" value={game.black_elo?.toString()} />
            <Row label="Time Control" value={game.time_control} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="space-y-1 bg-muted/20 rounded-lg p-3">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, small }: { label: string; value: string | null | undefined; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-0.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? 'font-mono' : ''} ${small ? 'max-w-[300px]' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Game List Panel ─────────────────────────────────────────────────────────

function GameListPanel({ filter, title }: { filter?: string; title: string }) {
  const [games, setGames] = useState<GameDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadGames();
  }, [page, filter]);

  async function loadGames() {
    setLoading(true);
    try {
      let query = supabase
        .from('chess_prediction_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter === 'hybrid_wins') {
        query = query.eq('hybrid_correct', true).eq('stockfish_correct', false);
      } else if (filter === 'stockfish_wins') {
        query = query.eq('stockfish_correct', true).eq('hybrid_correct', false);
      } else if (filter === 'both_correct') {
        query = query.eq('hybrid_correct', true).eq('stockfish_correct', true);
      } else if (filter === 'both_wrong') {
        query = query.eq('hybrid_correct', false).eq('stockfish_correct', false);
      }

      const { data } = await query;
      setGames((data as GameDetail[]) || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          View games <ChevronRight className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <GameDetailModal key={game.id} game={game} />
            ))}
            {games.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No games found</p>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <Button variant="outline" size="sm" disabled={games.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Benchmark Page ─────────────────────────────────────────────────────

export default function Benchmark() {
  const { chessStats: realtimeChessStats } = useRealtimeAccuracyContext();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<PredictionAttempt[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [cumulativeStats, setCumulativeStats] = useState<CumulativeStats | null>(null);
  const [farmStatus, setFarmStatus] = useState<FarmStatus | null>(null);
  const [gameCount, setGameCount] = useState(30);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const { check: checkBenchmarkLimit } = useBenchmarkRateLimit();

  // Sync from realtime context
  useEffect(() => {
    if (realtimeChessStats && !isRunning) {
      setCumulativeStats({
        totalRuns: realtimeChessStats.totalRuns,
        totalGamesAnalyzed: realtimeChessStats.totalGames,
        overallHybridAccuracy: realtimeChessStats.hybridAccuracy,
        overallStockfishAccuracy: realtimeChessStats.stockfishAccuracy,
        hybridNetWins: realtimeChessStats.hybridNetWins,
        hybridWins: realtimeChessStats.hybridWins,
        stockfishWins: realtimeChessStats.stockfishWins,
        bothCorrect: realtimeChessStats.bothCorrect,
        bestArchetype: null,
        worstArchetype: null,
        validPredictionCount: realtimeChessStats.totalGames,
        invalidPredictionCount: 0,
      });
    }
  }, [realtimeChessStats, isRunning]);

  // Load farm status
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('farm_status')
        .select('farm_id, farm_name, status, message, chess_games_generated, last_heartbeat_at')
        .order('last_heartbeat_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setFarmStatus(data || null);
    };
    load();
  }, []);

  // Realtime subscription
  useEffect(() => {
    let lastRefresh = 0;
    const refreshStats = async () => {
      if (Date.now() - lastRefresh < 2000) return;
      lastRefresh = Date.now();
      const newStats = await getCumulativeStats();
      setCumulativeStats(newStats);
    };

    const channel = supabase
      .channel('benchmark-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' }, refreshStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Init
  useEffect(() => {
    const init = async () => {
      const [available, stats] = await Promise.all([
        checkLichessAvailability(),
        getCumulativeStats(),
      ]);
      setApiReady(available.available);
      setCumulativeStats(stats);
    };
    init();
  }, []);

  // Timer
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const runBenchmark = async () => {
    const r = checkBenchmarkLimit();
    if (!r.allowed) return;
    await acquireBenchmarkLock();
    setIsRunning(true);
    setProgress(0);
    setStatus('Fetching games...');
    setResult(null);
    setLiveAttempts([]);
    setElapsedTime(0);

    try {
      const benchmarkResult = await runCloudBenchmark(
        { gameCount, predictionMoveNumber: 20, useRealGames: true },
        (statusText, prog, attempt) => {
          setStatus(statusText);
          setProgress(prog);
          if (attempt) {
            setLiveAttempts(prev => [...prev, attempt]);
            const engine = getCorrelationEngine();
            engine.start();
            engine.ingestChessSignal(normalizeChessSignal(attempt));
          }
        }
      );
      setResult(benchmarkResult);
      await saveBenchmarkResults(benchmarkResult);
      const newStats = await getCumulativeStats();
      setCumulativeStats(newStats);
      setStatus(`Done! ${benchmarkResult.completedGames} games analyzed.`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setIsRunning(false);
      await releaseBenchmarkLock();
    }
  };

  const s = cumulativeStats;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            EN PENSENT vs STOCKFISH 17
          </h1>
          <p className="text-muted-foreground">Real predictions • Real games • Real results</p>
        </div>

        {/* ─── Grand Total ─────────────────────────────────────────────── */}
        <Card className="border-2 border-primary/40 bg-gradient-to-r from-purple-500/10 to-orange-500/10">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-5xl font-bold">{s?.totalGamesAnalyzed?.toLocaleString() ?? '—'}</p>
              <p className="text-muted-foreground mt-1">Total Games Analyzed (All Engines)</p>
              <div className="flex justify-center gap-1 mt-2">
                <GameListPanel filter="all" title="All Games" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 text-center">
              <Stat label="EP Accuracy" value={s ? `${s.overallHybridAccuracy.toFixed(1)}%` : '—'} color="text-purple-500" />
              <Stat label="SF Accuracy" value={s ? `${s.overallStockfishAccuracy.toFixed(1)}%` : '—'} color="text-blue-500" />
              <StatWithDrill label="EP Wins" value={s?.hybridWins ?? 0} color="text-green-500" filter="hybrid_wins" title="EP Wins (EP correct, SF wrong)" />
              <StatWithDrill label="SF Wins" value={s?.stockfishWins ?? 0} color="text-blue-500" filter="stockfish_wins" title="SF Wins (SF correct, EP wrong)" />
              <StatWithDrill label="Both Correct" value={s?.bothCorrect ?? 0} color="text-emerald-500" filter="both_correct" title="Both Correct (Consensus)" />
            </div>
          </CardContent>
        </Card>

        {/* ─── Three Engine Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Original Engine */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Original Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OriginalEngineStats />
            </CardContent>
          </Card>

          {/* Farm Workers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-blue-500" />
                Farm Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FarmEngineStats farmStatus={farmStatus} />
            </CardContent>
          </Card>

          {/* Web Benchmark */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cloud className="h-4 w-4 text-green-500" />
                Web Benchmark
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WebEngineStats />
            </CardContent>
          </Card>
        </div>

        {/* ─── Source Breakdown (Cross-Engine Relations) ────────────────── */}
        <BenchmarkSourceBreakdown />

        {/* ─── Run Benchmark ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Play className="h-4 w-4" />
              Run New Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Games</span>
                  <span className="font-mono">{gameCount}</span>
                </div>
                <Slider value={[gameCount]} onValueChange={([v]) => setGameCount(v)} min={10} max={500} step={10} disabled={isRunning} />
              </div>
              <Button onClick={runBenchmark} disabled={isRunning || !apiReady} className="gap-2">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Running...' : 'Run'}
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{status}</span>
                  <span className="text-muted-foreground">{formatTime(elapsedTime)}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!isRunning && result && (
              <div className="text-sm text-muted-foreground">{status}</div>
            )}

            {/* Live results during run */}
            {liveAttempts.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {liveAttempts.slice(-10).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                    <span className="truncate flex-1">{a.gameName}</span>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <span className={a.stockfishCorrect ? 'text-green-500' : 'text-red-500'}>SF {a.stockfishCorrect ? '✓' : '✗'}</span>
                      <span className={a.hybridCorrect ? 'text-green-500' : 'text-red-500'}>EP {a.hybridCorrect ? '✓' : '✗'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!apiReady && !isRunning && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Connecting to Lichess Cloud...
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── Stat Components ─────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatWithDrill({ label, value, color, filter, title }: { label: string; value: number; color: string; filter: string; title: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <GameListPanel filter={filter} title={title} />
    </div>
  );
}

// ─── Per-Engine Stats ────────────────────────────────────────────────────────

function OriginalEngineStats() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('chess_benchmark_results')
      .select('completed_games')
      .eq('data_source', 'original_engine')
      .then(({ data }) => {
        const sum = (data || []).reduce((s: number, r: { completed_games: number }) => s + (r.completed_games || 0), 0);
        setTotal(sum);
      });
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold text-yellow-500">{total?.toLocaleString() ?? '—'}</p>
      <p className="text-xs text-muted-foreground">Games from original pre-Windsurf engine</p>
      <p className="text-xs text-muted-foreground">Stored as aggregate summaries</p>
    </div>
  );
}

function FarmEngineStats({ farmStatus }: { farmStatus: FarmStatus | null }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .in('data_source', ['lichess', 'chess.com', 'chesscom', 'sql_worker', 'farm_terminal'])
      .then(({ count: c }) => setCount(c || 0));
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold text-blue-500">{count?.toLocaleString() ?? '—'}</p>
      <p className="text-xs text-muted-foreground">Individual predictions with full details</p>
      {farmStatus && (
        <div className="text-xs space-y-0.5">
          <p>Status: <Badge variant={farmStatus.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">{farmStatus.status}</Badge></p>
          <p className="text-muted-foreground">Last heartbeat: {new Date(farmStatus.last_heartbeat_at).toLocaleString()}</p>
        </div>
      )}
      <GameListPanel filter="all" title="Farm Worker Games" />
    </div>
  );
}

function WebEngineStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .in('data_source', ['web_client', 'lichess_live', 'chesscom_live'])
      .then(({ count: c }) => setCount(c || 0));
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold text-green-500">{count?.toLocaleString() ?? '—'}</p>
      <p className="text-xs text-muted-foreground">Web benchmark predictions with full details</p>
      <GameListPanel filter="all" title="Web Benchmark Games" />
    </div>
  );
}
