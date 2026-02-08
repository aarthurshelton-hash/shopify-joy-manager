import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Loader2, Clock, Database, Server, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { runCloudBenchmark, type BenchmarkResult, type PredictionAttempt } from '@/lib/chess/cloudBenchmark';
import { checkLichessAvailability } from '@/lib/chess/lichessCloudEval';
import { saveBenchmarkResults } from '@/lib/chess/benchmarkPersistence';
import { supabase } from '@/integrations/supabase/client';
import { useBenchmarkRateLimit } from '@/hooks/useRateLimitV2';
import { acquireBenchmarkLock, releaseBenchmarkLock } from '@/lib/chess/benchmarkCoordinator';
import { getCorrelationEngine, normalizeChessSignal } from '@/lib/pensent-core/crossDomainCorrelation';
import './Benchmark.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  sfCorrect: number;
  epCorrect: number;
  bothCorrect: number;
  bothWrong: number;
  epOnly: number;
  sfOnly: number;
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
  worker_id?: string | null;
  created_at: string;
  white_elo: number | null;
  black_elo: number | null;
  time_control: string | null;
  lichess_id_verified: boolean | null;
}

// ─── Direct DB Stats Hook ────────────────────────────────────────────────────
// Single source of truth: chess_prediction_attempts table ONLY

function useDbStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [
      { count: total },
      { count: sfCorrect },
      { count: epCorrect },
      { count: bothCorrect },
      { count: epOnly },
      { count: sfOnly },
    ] = await Promise.all([
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).eq('stockfish_correct', true),
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).eq('hybrid_correct', true),
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).eq('stockfish_correct', true).eq('hybrid_correct', true),
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).eq('hybrid_correct', true).eq('stockfish_correct', false),
      supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).eq('stockfish_correct', true).eq('hybrid_correct', false),
    ]);

    const t = total || 0;
    const bw = t - (bothCorrect || 0) - (epOnly || 0) - (sfOnly || 0);
    setStats({
      total: t,
      sfCorrect: sfCorrect || 0,
      epCorrect: epCorrect || 0,
      bothCorrect: bothCorrect || 0,
      bothWrong: Math.max(0, bw),
      epOnly: epOnly || 0,
      sfOnly: sfOnly || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Realtime: refresh stats + feed correlation engine on every new prediction
    const correlationEngine = getCorrelationEngine();
    correlationEngine.start();

    const channel = supabase
      .channel('benchmark-stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' }, (payload) => {
        refresh();
        // Feed into correlation engine so farm + web predictions are all tracked
        try {
          const row = payload.new as Record<string, unknown>;
          if (row.hybrid_prediction && row.stockfish_prediction) {
            const signal = normalizeChessSignal({
              gameId: String(row.game_id || ''),
              gameName: String(row.game_name || ''),
              fen: String(row.fen || ''),
              moveNumber: Number(row.move_number || 20),
              hybridPrediction: row.hybrid_prediction as PredictionAttempt['hybridPrediction'],
              hybridConfidence: Number(row.hybrid_confidence || 0),
              hybridArchetype: String(row.hybrid_archetype || 'unknown'),
              hybridCorrect: Boolean(row.hybrid_correct),
              stockfishPrediction: row.stockfish_prediction as PredictionAttempt['stockfishPrediction'],
              stockfishConfidence: Number(row.stockfish_confidence || 0),
              stockfishEval: Number(row.stockfish_eval || 0),
              stockfishDepth: Number(row.stockfish_depth || 18),
              stockfishCorrect: Boolean(row.stockfish_correct),
              actualResult: row.actual_result as PredictionAttempt['actualResult'],
              pgn: String(row.pgn || ''),
            } as PredictionAttempt);
            correlationEngine.ingestChessSignal(signal);
          }
        } catch { /* don't break stats refresh on correlation error */ }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, loading, refresh };
}

// ─── System Breakdown Hook ───────────────────────────────────────────────────
// Classifies rows by data_quality_tier (NOT data_source) because farm workers
// write 'lichess'/'chess.com' as data_source but 'farm_enhanced_8quad' etc. as tier.
// Uses server-side count queries to avoid Supabase's 1000-row default limit.

interface SystemStat { label: string; description: string; count: number; sfAcc: number; epAcc: number }

// Farm tiers written by farm workers (ep-enhanced-worker, benchmark-worker, etc.)
const FARM_TIERS = ['farm_enhanced_8quad', 'farm_generated', 'farm_hybrid_v2', 'farm_integrated'];
// Terminal tiers written by terminal workers
const TERMINAL_TIERS = ['terminal_live'];

function useSystemBreakdown() {
  const [systems, setSystems] = useState<SystemStat[]>([]);

  useEffect(() => {
    const load = async () => {
      // Server-side counts by system category using data_quality_tier
      // Farm: any tier containing 'farm' or known farm tiers
      // Terminal: terminal_live tier
      // Web/Engine: everything else (web_client, null, etc.)

      const farmFilter = (q: ReturnType<typeof supabase.from>) =>
        q.or(FARM_TIERS.map(t => `data_quality_tier.eq.${t}`).join(','));
      const terminalFilter = (q: ReturnType<typeof supabase.from>) =>
        q.in('data_quality_tier', TERMINAL_TIERS);
      // Web = everything NOT farm and NOT terminal
      const webFilter = (q: ReturnType<typeof supabase.from>) =>
        q.not('data_quality_tier', 'in', `(${[...FARM_TIERS, ...TERMINAL_TIERS].join(',')})`);

      const [
        { count: farmTotal },
        { count: farmSf },
        { count: farmEp },
        { count: termTotal },
        { count: termSf },
        { count: termEp },
        { count: webTotal },
        { count: webSf },
        { count: webEp },
      ] = await Promise.all([
        farmFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })),
        farmFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('stockfish_correct', true),
        farmFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('hybrid_correct', true),
        terminalFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })),
        terminalFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('stockfish_correct', true),
        terminalFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('hybrid_correct', true),
        webFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })),
        webFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('stockfish_correct', true),
        webFilter(supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true })).eq('hybrid_correct', true),
      ]);

      const categories = [
        {
          label: 'Terminal Farms',
          description: '24/7 automated game harvesting & 8-quadrant analysis',
          total: (farmTotal || 0) + (termTotal || 0),
          sf: (farmSf || 0) + (termSf || 0),
          ep: (farmEp || 0) + (termEp || 0),
        },
        {
          label: 'Prediction Engine',
          description: 'Web-based En Pensent vs Stockfish 17 analysis',
          total: webTotal || 0,
          sf: webSf || 0,
          ep: webEp || 0,
        },
      ];

      setSystems(
        categories
          .filter(c => c.total > 0)
          .map(c => ({
            label: c.label,
            description: c.description,
            count: c.total,
            sfAcc: c.total > 0 ? (c.sf / c.total) * 100 : 0,
            epAcc: c.total > 0 ? (c.ep / c.total) * 100 : 0,
          }))
      );
    };
    load();

    const channel = supabase
      .channel('system-breakdown')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return systems;
}

// ─── Game Detail Modal ───────────────────────────────────────────────────────

function GameDetailModal({ game }: { game: GameDetail }) {
  const isLichess = game.data_source === 'lichess' || (game.game_id && !game.game_id.startsWith('cc_') && /^[a-zA-Z0-9]{8}$/.test(game.game_id));
  const isChessCom = game.data_source === 'chess.com' || game.game_id?.startsWith('cc_');
  const rawId = game.game_id?.replace(/^(li_|cc_)/, '');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">{game.game_id}</span>
                <Badge variant="outline" className="text-xs shrink-0">{game.data_source || '?'}</Badge>
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
            Game: {game.game_id}
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
          </Section>

          {/* Position */}
          <Section title="Position">
            <Row label="Move Number" value={game.move_number?.toString()} />
            <Row label="FEN" value={game.fen} mono small />
            <Row label="Position Hash" value={game.position_hash} mono small />
          </Section>

          {/* Predictions */}
          <Section title="Predictions vs Actual">
            <div className="grid grid-cols-3 gap-3 text-center">
              <PredCard
                title="Stockfish 17"
                prediction={game.stockfish_prediction}
                correct={game.stockfish_correct}
                extra={`Eval: ${game.stockfish_eval ?? '—'} | Depth: ${game.stockfish_depth ?? '—'} | Conf: ${game.stockfish_confidence ?? '—'}%`}
              />
              <PredCard
                title="En Pensent"
                prediction={game.hybrid_prediction}
                correct={game.hybrid_correct}
                extra={`Archetype: ${game.hybrid_archetype || '—'} | Conf: ${game.hybrid_confidence ?? '—'}%`}
              />
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">Actual</p>
                <p className="font-bold text-lg">{game.actual_result?.replace('_', ' ') || '—'}</p>
                <p className="text-xs mt-1">&nbsp;</p>
                <Badge variant="outline" className="mt-1">GROUND TRUTH</Badge>
              </div>
            </div>
          </Section>

          {/* ELO */}
          {(game.white_elo || game.black_elo) && (
            <Section title="Ratings">
              <Row label="White ELO" value={game.white_elo?.toString()} />
              <Row label="Black ELO" value={game.black_elo?.toString()} />
              <Row label="Time Control" value={game.time_control} />
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PredCard({ title, prediction, correct, extra }: { title: string; prediction: string | null; correct: boolean | null; extra: string }) {
  return (
    <div className={`p-3 rounded-lg border ${correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-bold text-lg">{prediction?.replace('_', ' ') || '—'}</p>
      <p className="text-xs mt-1">{extra}</p>
      <Badge className={`mt-1 ${correct ? 'bg-green-500' : 'bg-red-500'}`}>
        {correct ? 'CORRECT' : 'WRONG'}
      </Badge>
    </div>
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

  const loadGames = async () => {
    setLoading(true);
    let query = supabase
      .from('chess_prediction_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter === 'ep_wins') query = query.eq('hybrid_correct', true).eq('stockfish_correct', false);
    else if (filter === 'sf_wins') query = query.eq('stockfish_correct', true).eq('hybrid_correct', false);
    else if (filter === 'both_correct') query = query.eq('hybrid_correct', true).eq('stockfish_correct', true);
    else if (filter === 'both_wrong') query = query.eq('hybrid_correct', false).eq('stockfish_correct', false);

    const { data } = await query;
    setGames((data as GameDetail[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadGames(); }, [page, filter]);

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
          <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {games.map((g) => <GameDetailModal key={g.id} game={g} />)}
            {games.length === 0 && <p className="text-center text-muted-foreground py-8">No games yet</p>}
            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <Button variant="outline" size="sm" disabled={games.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Benchmark Page ─────────────────────────────────────────────────────

export default function Benchmark() {
  const { stats, loading, refresh } = useDbStats();
  const systems = useSystemBreakdown();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<PredictionAttempt[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [gameCount, setGameCount] = useState(30);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const { check: checkBenchmarkLimit } = useBenchmarkRateLimit();

  useEffect(() => {
    checkLichessAvailability().then(r => setApiReady(r.available));
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const runBenchmark = async () => {
    const r = checkBenchmarkLimit();
    if (!r.allowed) return;
    await acquireBenchmarkLock();
    setIsRunning(true); setProgress(0); setStatus('Fetching games...'); setResult(null); setLiveAttempts([]); setElapsedTime(0);
    try {
      const res = await runCloudBenchmark(
        { gameCount, predictionMoveNumber: 20, useRealGames: true },
        (s, p, a) => { setStatus(s); setProgress(p); if (a) setLiveAttempts(prev => [...prev, a]); }
      );
      setResult(res);
      await saveBenchmarkResults(res);
      await refresh();
      setStatus(`Done! ${res.completedGames} games analyzed.`);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setIsRunning(false);
      await releaseBenchmarkLock();
    }
  };

  const sfAcc = stats && stats.total > 0 ? ((stats.sfCorrect / stats.total) * 100).toFixed(1) : '—';
  const epAcc = stats && stats.total > 0 ? ((stats.epCorrect / stats.total) * 100).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chess Benchmark</h1>
            <p className="text-sm text-muted-foreground">En Pensent vs Stockfish 17 — real games, real predictions</p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* ─── Total Games ─────────────────────────────────────────── */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-6xl font-bold tabular-nums">{loading ? '...' : stats?.total.toLocaleString()}</p>
              <p className="text-muted-foreground mt-1">Games Analyzed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every row is one real game from Lichess or Chess.com with verified predictions
              </p>
              <div className="mt-2">
                <GameListPanel title="All Games" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Accuracy Comparison ─────────────────────────────────── */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card className={`border-2 ${stats.sfCorrect > stats.epCorrect ? 'border-blue-500/50' : 'border-muted'}`}>
              <CardContent className="py-6 text-center">
                <p className="text-4xl font-bold text-blue-500">{sfAcc}%</p>
                <p className="text-sm text-muted-foreground mt-1">Stockfish 17</p>
                <p className="text-xs text-muted-foreground">{stats.sfCorrect.toLocaleString()} / {stats.total.toLocaleString()} correct</p>
              </CardContent>
            </Card>
            <Card className={`border-2 ${stats.epCorrect > stats.sfCorrect ? 'border-purple-500/50' : 'border-muted'}`}>
              <CardContent className="py-6 text-center">
                <p className="text-4xl font-bold text-purple-500">{epAcc}%</p>
                <p className="text-sm text-muted-foreground mt-1">En Pensent</p>
                <p className="text-xs text-muted-foreground">{stats.epCorrect.toLocaleString()} / {stats.total.toLocaleString()} correct</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Breakdown ───────────────────────────────────────────── */}
        {stats && stats.total > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Prediction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <StatDrill label="Both Correct" value={stats.bothCorrect} total={stats.total} color="text-green-500" filter="both_correct" />
                <StatDrill label="EP Only" value={stats.epOnly} total={stats.total} color="text-purple-500" filter="ep_wins" />
                <StatDrill label="SF Only" value={stats.sfOnly} total={stats.total} color="text-blue-500" filter="sf_wins" />
                <StatDrill label="Both Wrong" value={stats.bothWrong} total={stats.total} color="text-red-500" filter="both_wrong" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── System Breakdown ─────────────────────────────────────── */}
        {systems.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systems.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{s.label}</span>
                        <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0 ml-4">
                      <span>{s.count.toLocaleString()} games</span>
                      <span className="text-blue-500">SF {s.sfAcc.toFixed(1)}%</span>
                      <span className="text-purple-500">EP {s.epAcc.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Run Benchmark ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4" /> Run Web Benchmark
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
                  <span className="text-muted-foreground">{fmt(elapsedTime)}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!isRunning && result && <p className="text-sm text-muted-foreground">{status}</p>}

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

// ─── Stat with drill-down ────────────────────────────────────────────────────

function StatDrill({ label, value, total, color, filter }: { label: string; value: number; total: number; color: string; filter: string }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label} ({pct}%)</p>
      <GameListPanel filter={filter} title={`${label} Games`} />
    </div>
  );
}
