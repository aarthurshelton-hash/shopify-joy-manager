/**
 * EP Options Signal Panel
 *
 * Real-time visual dashboard for the ep-real-trader paper strategy.
 * Shows live gate status for SPY/QQQ, signal quality, P&L tracker,
 * and a scrolling trade log — all driven by live Supabase data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Zap, Target, DollarSign,
  Activity, CheckCircle2, XCircle, Clock, RefreshCw, BarChart3,
  ChevronRight, Flame, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LiveSignal {
  symbol: string;
  predicted_direction: string;
  confidence: number;
  archetype: string;
  time_horizon: string;
  created_at: string;
  ep_correct: boolean | null;
}

interface SymbolMetrics {
  symbol: string;
  direction_accuracy: number | null;
  composite_accuracy: number | null;
  total_predictions: number | null;
  correct_predictions: number | null;
}

interface ScalpTrade {
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  realized_pnl: number | null;
  exit_reason: string | null;
  archetype: string | null;
  confidence_at_entry: number | null;
  accuracy_at_entry: number | null;
  mode: string;
  session_balance: number | null;
  created_at: string;
  closed_at: string | null;
}

// ── Gate thresholds (must match ep-real-trader.mjs) ───────────────────────────
const GATE = { MIN_ACC: 0.75, MIN_N: 100, MIN_CONF: 0.60 };
const SYMBOLS = ['SPY', 'QQQ'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function gateColor(pass: boolean) {
  return pass ? 'text-emerald-400' : 'text-red-400';
}
function gateBg(pass: boolean) {
  return pass
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : 'bg-red-500/10 border-red-500/30';
}
function dirColor(dir: string) {
  if (dir === 'up' || dir === 'bullish') return 'text-emerald-400';
  if (dir === 'down' || dir === 'bearish') return 'text-red-400';
  return 'text-gray-400';
}
function dirIcon(dir: string) {
  if (dir === 'up' || dir === 'bullish') return <TrendingUp className="w-3.5 h-3.5" />;
  if (dir === 'down' || dir === 'bearish') return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}
function pnlColor(v: number) {
  return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-gray-400';
}
function ageLabel(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ── Gate bar ──────────────────────────────────────────────────────────────────
function GateBar({ label, value, max, threshold, fmt }:
  { label: string; value: number; max: number; threshold: number; fmt: (v:number)=>string }) {
  const pct   = Math.min(100, (value / max) * 100);
  const tPct  = (threshold / max) * 100;
  const pass  = value >= threshold;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground shrink-0">{label}</span>
      <div className="relative flex-1 h-1.5 bg-white/5 rounded-full overflow-visible">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pass ? 'bg-emerald-500' : 'bg-red-500/70'}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-yellow-400/70 rounded-full"
          style={{ left: `${tPct}%` }}
          title={`Gate: ${fmt(threshold)}`}
        />
      </div>
      <span className={`w-12 text-right font-mono ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
        {fmt(value)}
      </span>
      {pass
        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        : <XCircle     className="w-3 h-3 text-red-400 shrink-0" />}
    </div>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────
function SignalCard({ signal, metrics }: { signal: LiveSignal | null; metrics: SymbolMetrics | null }) {
  const sym   = signal?.symbol || metrics?.symbol || '?';
  const dir   = signal?.predicted_direction || 'flat';
  const conf  = signal?.confidence ?? 0;
  const acc   = metrics?.direction_accuracy ?? 0;
  const n     = metrics?.total_predictions ?? 0;

  const passAcc  = acc  >= GATE.MIN_ACC;
  const passN    = n    >= GATE.MIN_N;
  const passConf = conf >= GATE.MIN_CONF;
  const allPass  = passAcc && passN && passConf;

  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${
      allPass
        ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
        : 'border-border/40 bg-card/30'
    }`}>
      {/* Symbol + direction */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-black tracking-tighter">{sym}</span>
          {allPass && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full animate-pulse">
              <Flame className="w-2.5 h-2.5" /> LIVE GATE
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 font-bold text-sm ${dirColor(dir)}`}>
          {dirIcon(dir)}
          {dir === 'up' || dir === 'bullish' ? 'CALL' : dir === 'down' || dir === 'bearish' ? 'PUT' : 'FLAT'}
        </div>
      </div>

      {/* Gate bars */}
      <div className="space-y-1.5 mb-3">
        <GateBar label="Accuracy" value={acc}  max={1}    threshold={GATE.MIN_ACC}  fmt={v => `${(v*100).toFixed(0)}%`} />
        <GateBar label="Samples"  value={n}    max={500}  threshold={GATE.MIN_N}    fmt={v => `${v}`} />
        <GateBar label="Conf"     value={conf} max={1}    threshold={GATE.MIN_CONF} fmt={v => `${(v*100).toFixed(0)}%`} />
      </div>

      {/* Signal meta */}
      {signal ? (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="font-mono">{signal.archetype}</span>
          <span>·</span>
          <span>{signal.time_horizon}</span>
          <span>·</span>
          <span>{ageLabel(signal.created_at)}</span>
          {signal.ep_correct !== null && (
            <span className={`ml-auto font-bold ${signal.ep_correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.ep_correct ? '✓' : '✗'}
            </span>
          )}
        </div>
      ) : (
        <div className="text-[10px] text-muted-foreground">Awaiting fresh prediction…</div>
      )}

      {/* All-pass indicator */}
      {allPass && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-400 border-t border-emerald-500/20 pt-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          ep-real-trader would BUY {dir === 'up' || dir === 'bullish' ? 'CALL' : 'PUT'} · 0-2DTE · max $15
        </div>
      )}
    </div>
  );
}

// ── P&L / balance strip ───────────────────────────────────────────────────────
function BalanceStrip({ trades }: { trades: ScalpTrade[] }) {
  const closed  = trades.filter(t => t.realized_pnl !== null);
  const totalPnl = closed.reduce((s, t) => s + (t.realized_pnl ?? 0), 0);
  const wins    = closed.filter(t => (t.realized_pnl ?? 0) > 0).length;
  const wr      = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const balance = (trades[0]?.session_balance ?? 100) ;
  const startBal = 100;
  const balGain = balance - startBal;

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Balance', value: `$${balance.toFixed(2)}`, sub: balGain >= 0 ? `+$${balGain.toFixed(2)}` : `-$${Math.abs(balGain).toFixed(2)}`, color: balGain >= 0 ? 'text-emerald-400' : 'text-red-400' },
        { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, sub: `${closed.length} trades`, color: pnlColor(totalPnl) },
        { label: 'Win Rate', value: `${wr.toFixed(0)}%`, sub: `${wins}W / ${closed.length - wins}L`, color: wr >= 50 ? 'text-emerald-400' : 'text-amber-400' },
        { label: 'Mode', value: 'PAPER', sub: 'Live → Mon', color: 'text-amber-400' },
      ].map(s => (
        <div key={s.label} className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
          <div className={`text-lg font-display font-black ${s.color}`}>{s.value}</div>
          <div className="text-[10px] text-muted-foreground">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Trade log row ─────────────────────────────────────────────────────────────
function TradeRow({ t }: { t: ScalpTrade }) {
  const pnl    = t.realized_pnl ?? 0;
  const isOpen = t.closed_at === null;
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs border transition-colors ${
      isOpen ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/20 bg-card/20 hover:bg-card/40'
    }`}>
      <div className={`flex items-center gap-1 font-bold w-16 ${dirColor(t.direction)}`}>
        {dirIcon(t.direction)}
        {t.symbol}
      </div>
      <span className="text-muted-foreground font-mono">
        {t.direction === 'up' ? 'C' : 'P'} · $0.{String(Math.round((t.entry_price ?? 0) * 100)).padStart(2,'0')}
      </span>
      {isOpen ? (
        <span className="ml-auto flex items-center gap-1 text-amber-400 font-bold">
          <Activity className="w-3 h-3 animate-pulse" /> OPEN
        </span>
      ) : (
        <>
          <span className={`ml-auto font-bold font-mono ${pnlColor(pnl)}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground w-20 text-right truncate">{t.exit_reason ?? ''}</span>
        </>
      )}
      <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const EPOptionsSignalPanel: React.FC = () => {
  const [signals,   setSignals]   = useState<Record<string, LiveSignal | null>>({});
  const [metrics,   setMetrics]   = useState<Record<string, SymbolMetrics | null>>({});
  const [trades,    setTrades]    = useState<ScalpTrade[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [pulse,     setPulse]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Live signals (last 10 min, SPY/QQQ)
    const { data: sigData } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, predicted_direction, confidence, archetype, time_horizon, created_at, ep_correct')
      .in('symbol', SYMBOLS)
      .gt('created_at', cutoff)
      .not('predicted_direction', 'in', '("flat","neutral")')
      .order('created_at', { ascending: false })
      .limit(20);

    const sigMap: Record<string, LiveSignal | null> = {};
    for (const s of SYMBOLS) {
      sigMap[s] = (sigData ?? []).find(d => d.symbol === s) ?? null;
    }
    setSignals(sigMap);

    // Symbol accuracy metrics
    const { data: metData } = await supabase
      .from('security_accuracy_metrics')
      .select('symbol, direction_accuracy, composite_accuracy, total_predictions, correct_predictions')
      .in('symbol', SYMBOLS);

    const metMap: Record<string, SymbolMetrics | null> = {};
    for (const s of SYMBOLS) {
      metMap[s] = (metData ?? []).find(d => d.symbol === s) ?? null;
    }
    setMetrics(metMap);

    // Trades from ep-real-trader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tradeData } = await (supabase as any)
      .from('options_scalp_trades')
      .select('symbol, direction, entry_price, exit_price, realized_pnl, exit_reason, archetype, confidence_at_entry, accuracy_at_entry, mode, session_balance, created_at, closed_at')
      .order('created_at', { ascending: false })
      .limit(20);

    setTrades((tradeData as ScalpTrade[] | null) ?? []);
    setLastFetch(new Date());
    setLoading(false);
    setPulse(p => !p);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const anySignalLive = SYMBOLS.some(s => {
    const sig = signals[s];
    const met = metrics[s];
    const acc  = met?.direction_accuracy ?? 0;
    const n    = met?.total_predictions  ?? 0;
    const conf = sig?.confidence ?? 0;
    return acc >= GATE.MIN_ACC && n >= GATE.MIN_N && conf >= GATE.MIN_CONF;
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Target className="w-5 h-5 text-primary" />
            {anySignalLive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
              EP Options Signal Radar
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                anySignalLive
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${anySignalLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {anySignalLive ? 'SIGNAL FIRE' : 'MONITORING'}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground">
              ep-real-trader paper mode · SPY / QQQ 0-2DTE · Stop -50% · Target +200%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-[10px] text-muted-foreground">
              {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            title="Refresh signals"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Gate legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
          <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
          <span>Gate thresholds:</span>
          <span className="font-mono text-foreground/60">Acc ≥ 75%</span>
          <span>·</span>
          <span className="font-mono text-foreground/60">n ≥ 100 resolved</span>
          <span>·</span>
          <span className="font-mono text-foreground/60">Conf ≥ 60%</span>
          <span className="ml-auto text-yellow-400">Yellow tick = gate threshold</span>
        </div>

        {/* Signal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SYMBOLS.map(s => (
            <SignalCard key={s} signal={signals[s] ?? null} metrics={{ symbol: s, ...(metrics[s] ?? { direction_accuracy: null, composite_accuracy: null, total_predictions: null, correct_predictions: null }) }} />
          ))}
        </div>

        {/* Balance strip */}
        <BalanceStrip trades={trades} />

        {/* Trade log */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trade Log</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Paper mode · fills to options_scalp_trades</span>
          </div>

          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed border-border/40 rounded-xl">
              <AlertTriangle className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-sm font-medium">No trades yet</p>
              <p className="text-xs mt-1 text-center max-w-xs">
                ep-real-trader is running in paper mode. Start IB Gateway (port 4002) Monday — trades will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {trades.map((t, i) => <TradeRow key={i} t={t} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Refreshes every 30s · data from market_prediction_attempts + security_accuracy_metrics
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <ShieldCheck className="w-3 h-3" />
            Paper → Live: set LIVE_TRADING_ENABLED=true in .env
          </div>
        </div>
      </div>
    </div>
  );
};

export default EPOptionsSignalPanel;
