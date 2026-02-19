import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Loader2, Clock, Database, Server, ChevronRight, ExternalLink, RefreshCw, TrendingUp, Zap, Brain, Globe, BarChart3 } from 'lucide-react';
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
const FARM_TIERS = ['farm_enhanced_8quad', 'farm_generated', 'farm_hybrid_v2', 'farm_integrated', 'farm_bulk_8quad', 'farm_gm_8quad', 'farm_tournament_8quad', 'farm_puzzle_8quad'];
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

      const baseQuery = () => supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true });

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
        baseQuery().or(FARM_TIERS.map(t => `data_quality_tier.eq.${t}`).join(',')),
        baseQuery().or(FARM_TIERS.map(t => `data_quality_tier.eq.${t}`).join(',')).eq('stockfish_correct', true),
        baseQuery().or(FARM_TIERS.map(t => `data_quality_tier.eq.${t}`).join(',')).eq('hybrid_correct', true),
        baseQuery().in('data_quality_tier', TERMINAL_TIERS),
        baseQuery().in('data_quality_tier', TERMINAL_TIERS).eq('stockfish_correct', true),
        baseQuery().in('data_quality_tier', TERMINAL_TIERS).eq('hybrid_correct', true),
        baseQuery().not('data_quality_tier', 'in', `(${[...FARM_TIERS, ...TERMINAL_TIERS].join(',')})`),
        baseQuery().not('data_quality_tier', 'in', `(${[...FARM_TIERS, ...TERMINAL_TIERS].join(',')})`).eq('stockfish_correct', true),
        baseQuery().not('data_quality_tier', 'in', `(${[...FARM_TIERS, ...TERMINAL_TIERS].join(',')})`).eq('hybrid_correct', true),
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

// ─── Per-Source Breakdown Hook ───────────────────────────────────────────────
// Lichess vs Chess.com accuracy from data_source column

interface SourceStat { label: string; icon: string; count: number; sfAcc: number; epAcc: number; avgElo: number }

function useSourceBreakdown() {
  const [sources, setSources] = useState<SourceStat[]>([]);

  useEffect(() => {
    const load = async () => {
      // Match all lichess variants (lichess, lichess_gm, lichess_db, lichess_tournament) and chess.com
      const lichessFilter = 'data_source.eq.lichess,data_source.like.lichess_%';
      const chesscomFilter = 'data_source.eq.chess.com,data_source.like.chesscom%';
      const [
        { count: liTotal }, { count: liSf }, { count: liEp },
        { count: ccTotal }, { count: ccSf }, { count: ccEp },
      ] = await Promise.all([
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(lichessFilter),
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(lichessFilter).eq('stockfish_correct', true),
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(lichessFilter).eq('hybrid_correct', true),
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(chesscomFilter),
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(chesscomFilter).eq('stockfish_correct', true),
        supabase.from('chess_prediction_attempts').select('*', { count: 'exact', head: true }).or(chesscomFilter).eq('hybrid_correct', true),
      ]);

      // Get average ELO per source (sample recent 200 games)
      const { data: liEloData } = await supabase.from('chess_prediction_attempts').select('white_elo, black_elo').or(lichessFilter).not('white_elo', 'is', null).order('created_at', { ascending: false }).limit(200);
      const { data: ccEloData } = await supabase.from('chess_prediction_attempts').select('white_elo, black_elo').or(chesscomFilter).not('white_elo', 'is', null).order('created_at', { ascending: false }).limit(200);

      const avgElo = (rows: { white_elo: number | null; black_elo: number | null }[] | null) => {
        if (!rows || rows.length === 0) return 0;
        const sum = rows.reduce((s, r) => s + ((r.white_elo || 0) + (r.black_elo || 0)) / 2, 0);
        return Math.round(sum / rows.length);
      };

      const results: SourceStat[] = [];
      if ((liTotal || 0) > 0) results.push({ label: 'Lichess', icon: '♟', count: liTotal || 0, sfAcc: (liTotal || 0) > 0 ? ((liSf || 0) / (liTotal || 1)) * 100 : 0, epAcc: (liTotal || 0) > 0 ? ((liEp || 0) / (liTotal || 1)) * 100 : 0, avgElo: avgElo(liEloData) });
      if ((ccTotal || 0) > 0) results.push({ label: 'Chess.com', icon: '♚', count: ccTotal || 0, sfAcc: (ccTotal || 0) > 0 ? ((ccSf || 0) / (ccTotal || 1)) * 100 : 0, epAcc: (ccTotal || 0) > 0 ? ((ccEp || 0) / (ccTotal || 1)) * 100 : 0, avgElo: avgElo(ccEloData) });
      setSources(results);
    };
    load();
  }, []);

  return sources;
}

// ─── Archetype Breakdown Hook ───────────────────────────────────────────────
// Per-archetype prediction accuracy from hybrid_archetype column

interface ArchetypeStat { archetype: string; total: number; correct: number; acc: number }

function useArchetypeBreakdown() {
  const [archetypes, setArchetypes] = useState<ArchetypeStat[]>([]);

  useEffect(() => {
    const load = async () => {
      // Fetch recent games with archetype data
      const { data } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_archetype, hybrid_correct')
        .not('hybrid_archetype', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (!data) return;

      const map = new Map<string, { total: number; correct: number }>();
      for (const row of data) {
        const arch = row.hybrid_archetype || 'unknown';
        const entry = map.get(arch) || { total: 0, correct: 0 };
        entry.total++;
        if (row.hybrid_correct) entry.correct++;
        map.set(arch, entry);
      }

      const results = Array.from(map.entries())
        .map(([archetype, { total, correct }]) => ({ archetype, total, correct, acc: total > 0 ? (correct / total) * 100 : 0 }))
        .sort((a, b) => b.total - a.total);

      setArchetypes(results);
    };
    load();
  }, []);

  return archetypes;
}

// ─── ELO Bracket Analysis Hook ──────────────────────────────────────────────
// Accuracy by ELO range — shows where EP outperforms SF at different skill levels

interface EloBracket { range: string; min: number; max: number; total: number; sfAcc: number; epAcc: number }

function useEloBracketAnalysis() {
  const [brackets, setBrackets] = useState<EloBracket[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('chess_prediction_attempts')
        .select('white_elo, black_elo, stockfish_correct, hybrid_correct')
        .not('white_elo', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (!data) return;

      const bracketDefs = [
        { range: '< 1500', min: 0, max: 1500 },
        { range: '1500–2000', min: 1500, max: 2000 },
        { range: '2000–2500', min: 2000, max: 2500 },
        { range: '2500–2800', min: 2500, max: 2800 },
        { range: '2800+', min: 2800, max: 9999 },
      ];

      const results: EloBracket[] = bracketDefs.map(def => {
        const games = data.filter(r => {
          const avg = ((r.white_elo || 0) + (r.black_elo || 0)) / 2;
          return avg >= def.min && avg < def.max;
        });
        const sfCorrect = games.filter(g => g.stockfish_correct).length;
        const epCorrect = games.filter(g => g.hybrid_correct).length;
        return {
          ...def,
          total: games.length,
          sfAcc: games.length > 0 ? (sfCorrect / games.length) * 100 : 0,
          epAcc: games.length > 0 ? (epCorrect / games.length) * 100 : 0,
        };
      }).filter(b => b.total > 0);

      setBrackets(results);
    };
    load();
  }, []);

  return brackets;
}

// ─── Cross-Domain Correlation Summary ───────────────────────────────────────

interface CorrelationSummary { totalSignals: number; chessSignals: number; marketSignals: number; correlationsFound: number; strongCorrelations: number }

function useCorrelationSummary() {
  const [summary, setSummary] = useState<CorrelationSummary | null>(null);

  useEffect(() => {
    const load = () => {
      const eng = getCorrelationEngine();
      const validationStats = eng.getValidationStats();
      const patterns = eng.getPatternStats();
      const recentCorrelations = eng.getRecentCorrelations(50);
      const strongCorrs = recentCorrelations.filter(c => c.correlationScore > 0.7);
      setSummary({
        totalSignals: validationStats.total,
        chessSignals: patterns.reduce((s, p) => s + p.occurrences, 0),
        marketSignals: validationStats.validated,
        correlationsFound: recentCorrelations.length,
        strongCorrelations: strongCorrs.length,
      });
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return summary;
}

// ─── Game Detail Modal ───────────────────────────────────────────────────────

function GameDetailModal({ game }: { game: GameDetail }) {
  const isLichess = game.data_source?.startsWith('lichess') || (game.game_id && !game.game_id.startsWith('cc_') && /^[a-zA-Z0-9]{8}$/.test(game.game_id));
  const isChessCom = game.data_source === 'chess.com' || game.data_source?.startsWith('chesscom') || game.game_id?.startsWith('cc_');
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
  const sources = useSourceBreakdown();
  const archetypes = useArchetypeBreakdown();
  const eloBrackets = useEloBracketAnalysis();
  const correlationSummary = useCorrelationSummary();

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
    // Try edge function first, but auto-enable after 5s timeout
    // The benchmark uses local Stockfish engine anyway
    const timeout = setTimeout(() => setApiReady(true), 5000);
    checkLichessAvailability().then(r => {
      clearTimeout(timeout);
      setApiReady(r.available || true); // Always enable - local SF engine is the primary
    }).catch(() => {
      clearTimeout(timeout);
      setApiReady(true); // Enable anyway - local engine works without cloud eval
    });
    return () => clearTimeout(timeout);
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

        {/* ─── Per-Source Breakdown ──────────────────────────────────── */}
        {sources.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" /> Games by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map(s => (
                  <div key={s.label} className="p-4 rounded-lg border border-border bg-muted/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold">{s.icon} {s.label}</span>
                      <Badge variant="outline">{s.count.toLocaleString()} games</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-blue-500 font-bold">{s.sfAcc.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">SF17</p>
                      </div>
                      <div>
                        <p className="text-purple-500 font-bold">{s.epAcc.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">EP</p>
                      </div>
                      <div>
                        <p className="font-bold">{s.avgElo > 0 ? s.avgElo.toLocaleString() : '—'}</p>
                        <p className="text-xs text-muted-foreground">Avg ELO</p>
                      </div>
                    </div>
                    {s.epAcc > s.sfAcc && (
                      <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> EP leads by {(s.epAcc - s.sfAcc).toFixed(1)}pp
                      </p>
                    )}
                    {s.sfAcc > s.epAcc && (
                      <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> SF leads by {(s.sfAcc - s.epAcc).toFixed(1)}pp
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── ELO Bracket Analysis (SF17 Real-World Comparison) ──── */}
        {eloBrackets.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Stockfish 17 ELO Comparison
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                SF17 NNUE (ELO ~3600) vs En Pensent Hybrid — accuracy by player rating bracket
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eloBrackets.map(b => {
                  const epLeads = b.epAcc > b.sfAcc;
                  const diff = Math.abs(b.epAcc - b.sfAcc);
                  return (
                    <div key={b.range} className="flex items-center gap-3">
                      <span className="text-sm font-mono w-24 shrink-0">{b.range}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full ep-bar" style={{ width: `${b.sfAcc}%` }} />
                          </div>
                          <span className="text-xs text-blue-500 w-14 text-right">{b.sfAcc.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full sf-bar" style={{ width: `${b.epAcc}%` }} />
                          </div>
                          <span className="text-xs text-purple-500 w-14 text-right">{b.epAcc.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 w-24">
                        <span className="text-xs text-muted-foreground">{b.total.toLocaleString()} games</span>
                        {diff > 0.5 && (
                          <p className={`text-xs font-medium ${epLeads ? 'text-purple-400' : 'text-blue-400'}`}>
                            {epLeads ? 'EP' : 'SF'} +{diff.toFixed(1)}pp
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
                Stockfish 17 NNUE runs at depth 18 locally with 128MB hash. En Pensent adds 25 temporal domain adapters on top of the same engine.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ─── Archetype Performance ──────────────────────────────── */}
        {archetypes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" /> Archetype Performance (EP Domain Adapters)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                En Pensent classifies games by strategic archetype — each triggers different temporal adapters
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {archetypes.map(a => (
                  <div key={a.archetype} className="flex items-center justify-between p-2 rounded border border-border bg-muted/10">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium capitalize">{a.archetype.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-muted-foreground">{a.total.toLocaleString()} games</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-sm font-bold ${a.acc >= 50 ? 'text-green-500' : a.acc >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {a.acc.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">({a.correct}/{a.total})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Cross-Domain Correlation Engine ────────────────────── */}
        {correlationSummary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" /> Cross-Domain Correlation Engine
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Real-time pattern detection between chess predictions and market signals
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xl font-bold">{correlationSummary.totalSignals}</p>
                  <p className="text-xs text-muted-foreground">Total Signals</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-purple-500">{correlationSummary.chessSignals}</p>
                  <p className="text-xs text-muted-foreground">Chess Patterns</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-green-500">{correlationSummary.marketSignals}</p>
                  <p className="text-xs text-muted-foreground">Market Signals</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-orange-500">{correlationSummary.correlationsFound}</p>
                  <p className="text-xs text-muted-foreground">Correlations</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-yellow-500">{correlationSummary.strongCorrelations}</p>
                  <p className="text-xs text-muted-foreground">Strong (&gt;70%)</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The correlation engine detects when chess game archetypes (e.g. crushing attacks, positional grinds) align with market momentum patterns in real-time. Updates every 30s.
              </p>
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
