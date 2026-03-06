/**
 * EPBacktestPanel
 *
 * Displays walk-forward $100 challenge backtest results.
 * Primary source: backtest_greeks_trades (Black-Scholes priced).
 * Fallback: backtest_trades (fixed premium).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart3,
  DollarSign, Zap, ShieldCheck, Trophy, Activity, FlaskConical,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BacktestTrade {
  symbol: string;
  direction: string;
  option_type?: string | null;
  archetype: string | null;
  time_horizon: string | null;
  entry_time: string;
  accuracy_at_entry: number | null;
  n_at_entry: number | null;
  confidence: number | null;
  // Greeks fields (backtest_greeks_trades)
  underlying_entry?: number | null;
  underlying_exit?: number | null;
  strike?: number | null;
  dte_entry?: number | null;
  iv?: number | null;
  bs_entry?: number | null;
  bs_exit?: number | null;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  contracts?: number | null;
  gross_pnl?: number | null;
  // Simple fields (backtest_trades)
  pnl?: number | null;
  pnl_pct: number | null;
  balance_before: number | null;
  balance_after: number | null;
  ep_correct: boolean | null;
  actual_move_pct?: number | null;
  price_move_pct?: number | null;
  exit_reason: string | null;
  run_id: string | null;
}

interface RunSummary {
  run_id: string;
  trades: BacktestTrade[];
  totalTrades: number;
  wins: number;
  finalBalance: number;
  peakBalance: number;
  maxDD: number;
  returnPct: number;
  bySymbol: Record<string, { t: number; w: number; pnl: number }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
const usd = (v: number) => `$${v.toFixed(2)}`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

function computeSummary(trades: BacktestTrade[]): RunSummary {
  let wins = 0, peak = 100, maxDD = 0;
  const bySymbol: Record<string, { t: number; w: number; pnl: number }> = {};
  for (const t of trades) {
    if (t.ep_correct) wins++;
    const bal = t.balance_after ?? 100;
    if (bal > peak) peak = bal;
    const dd = (peak - bal) / peak;
    if (dd > maxDD) maxDD = dd;
    const sym = t.symbol;
    if (!bySymbol[sym]) bySymbol[sym] = { t: 0, w: 0, pnl: 0 };
    bySymbol[sym].t++;
    if (t.ep_correct) bySymbol[sym].w++;
    bySymbol[sym].pnl += (t.gross_pnl ?? t.pnl ?? 0);
  }
  const finalBalance = trades.length ? (trades[trades.length - 1].balance_after ?? 100) : 100;
  return {
    run_id: trades[0]?.run_id ?? '',
    trades,
    totalTrades: trades.length,
    wins,
    finalBalance,
    peakBalance: peak,
    maxDD,
    returnPct: ((finalBalance - 100) / 100) * 100,
    bySymbol,
  };
}

function greeksSummary(trades: BacktestTrade[]) {
  const g = trades.filter(t => t.delta != null);
  if (!g.length) return null;
  const avg = (fn: (t: BacktestTrade) => number) => g.reduce((s,t) => s + fn(t), 0) / g.length;
  return {
    delta: avg(t => Math.abs(t.delta ?? 0)),
    theta: avg(t => t.theta ?? 0),
    vega:  avg(t => t.vega  ?? 0),
    avgEntry: avg(t => t.bs_entry ?? 0),
    avgMove:  avg(t => t.actual_move_pct ?? 0),
  };
}

// ── Mini equity curve ─────────────────────────────────────────────────────────
function EquityCurve({ trades }: { trades: BacktestTrade[] }) {
  if (!trades.length) return null;
  const points = [100, ...trades.map(t => t.balance_after ?? 100)];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 600, H = 80;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(v => H - ((v - min) / range) * (H - 8) - 4);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const final = points[points.length - 1];
  const isUp = final >= 100;
  const color = isUp ? '#10b981' : '#ef4444';
  const fillPath = `${path} L${W},${H} L0,${H} Z`;

  return (
    <div className="rounded-lg border border-border/30 bg-card/30 p-3">
      <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Equity Curve · $100 → {usd(final)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '80px' }}>
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#eqFill)" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <line x1={xs[0]} y1={ys[0]} x2={xs[0] + 6} y2={ys[0]} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-display font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

// ── Trade row ─────────────────────────────────────────────────────────────────
function TradeRow({ t }: { t: BacktestTrade }) {
  const win = t.ep_correct === true;
  const p   = t.gross_pnl ?? t.pnl ?? 0;
  const hasGreeks = t.delta != null;
  return (
    <div className={`px-3 py-2 rounded text-xs border space-y-1
      ${win ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold w-10 ${win ? 'text-emerald-400' : 'text-red-400'}`}>{t.symbol}</span>
        <span className="text-muted-foreground truncate flex-1 text-[10px]">{t.archetype ?? '—'} · {t.option_type?.toUpperCase() ?? (t.direction.includes('bull') ? 'CALL' : 'PUT')}</span>
        {hasGreeks && (
          <span className="text-[10px] font-mono text-purple-400">
            Δ{(t.delta ?? 0).toFixed(2)} θ{(t.theta ?? 0).toFixed(3)}
          </span>
        )}
        <span className={`font-mono font-bold w-16 text-right ${p >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {p >= 0 ? '+' : ''}{usd(p)}
        </span>
        <span className="text-[10px] text-muted-foreground w-18 text-right">{usd(t.balance_after ?? 0)}</span>
      </div>
      {hasGreeks && (
        <div className="flex gap-3 text-[10px] text-muted-foreground pl-12">
          <span>BS entry <span className="font-mono text-foreground/60">${(t.bs_entry ?? 0).toFixed(3)}</span></span>
          <span>BS exit <span className="font-mono text-foreground/60">${(t.bs_exit ?? 0).toFixed(3)}</span></span>
          <span>Δ move <span className={`font-mono ${(t.actual_move_pct ?? 0) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {(t.actual_move_pct ?? 0) >= 0 ? '+' : ''}{(t.actual_move_pct ?? 0).toFixed(2)}%
          </span></span>
          <span className="ml-auto">{t.exit_reason}</span>
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const EPBacktestPanel: React.FC = () => {
  const [summary, setSummary]   = useState<RunSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [showAll, setShowAll]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Try Greeks table first, fall back to simple table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data } = await (supabase as any)
      .from('backtest_greeks_trades')
      .select('*')
      .order('entry_time', { ascending: true })
      .limit(500);
    if (!data?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ data } = await (supabase as any)
        .from('backtest_trades')
        .select('*')
        .order('entry_time', { ascending: true })
        .limit(500));
    }

    if (data?.length) setSummary(computeSummary(data as BacktestTrade[]));
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = summary;
  const wr = s ? ((s.wins / s.totalTrades) * 100) : 0;
  const displayTrades = s ? (showAll ? s.trades : s.trades.slice(-30)) : [];
  const gk = s ? greeksSummary(s.trades) : null;
  const isGreeks = s?.trades.some(t => t.delta != null) ?? false;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
              $100 Challenge · Walk-Forward Backtest
              {isGreeks && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded px-1.5 py-0.5">
                  <FlaskConical className="w-2.5 h-2.5" /> Black-Scholes
                </span>
              )}
              <span className="text-[10px] font-normal text-muted-foreground border border-border/40 rounded px-1.5 py-0.5">
                No lookahead bias · Rolling accuracy gate
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground">
              SPY · QQQ · GC=F · SI=F · PL=F · PA=F · Gate: acc≥75% n≥100 conf≥60%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && <span className="text-[10px] text-muted-foreground">{lastFetch.toLocaleTimeString()}</span>}
          <button onClick={load} title="Refresh" className="p-1.5 rounded hover:bg-muted/50">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading && !s ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Activity className="w-4 h-4 animate-pulse" /> Loading backtest results…
          </div>
        ) : !s ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No backtest data yet — run <code className="font-mono text-xs bg-muted/50 px-1 rounded">node farm/workers/ep-backtest-engine.mjs</code>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile
                label="Final Balance" value={usd(s.finalBalance)}
                sub={pct(s.returnPct) + ' return'}
                color={s.finalBalance >= 100 ? 'text-emerald-400' : 'text-red-400'}
              />
              <Tile
                label="Win Rate" value={`${wr.toFixed(1)}%`}
                sub={`${s.wins}W / ${s.totalTrades - s.wins}L`}
                color={wr >= 60 ? 'text-emerald-400' : 'text-amber-400'}
              />
              <Tile
                label="Max Drawdown" value={`${(s.maxDD * 100).toFixed(1)}%`}
                sub={`Peak: ${usd(s.peakBalance)}`}
                color={s.maxDD < 0.15 ? 'text-emerald-400' : 'text-amber-400'}
              />
              <Tile
                label="Total Trades" value={String(s.totalTrades)}
                sub={`${Object.keys(s.bySymbol).length} symbols`}
                color="text-foreground"
              />
            </div>

            {/* Equity curve */}
            <EquityCurve trades={s.trades} />

            {/* Greeks summary strip */}
            {gk && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: 'Avg |Delta|', value: gk.delta.toFixed(3), tip: 'Price sensitivity — 0.35 ≈ 35¢ move per $1 underlying', color: 'text-purple-400' },
                  { label: 'Avg Theta/day', value: `$${gk.theta.toFixed(4)}`, tip: 'Time decay per calendar day (negative = losing to time)', color: 'text-amber-400' },
                  { label: 'Avg Vega/1%IV', value: `$${gk.vega.toFixed(4)}`, tip: 'Value change per 1% move in implied volatility', color: 'text-cyan-400' },
                  { label: 'Avg BS Entry', value: `$${gk.avgEntry.toFixed(3)}`, tip: 'Average Black-Scholes option price at entry', color: 'text-foreground' },
                  { label: 'Avg Underly Δ', value: `${gk.avgMove >= 0 ? '+' : ''}${gk.avgMove.toFixed(2)}%`, tip: 'Average actual price move in predicted direction', color: gk.avgMove >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-center">
                    <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
                    <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* By symbol */}
            {Object.keys(s.bySymbol).length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" /> By Symbol
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(s.bySymbol).map(([sym, d]) => (
                    <div key={sym} className="rounded-lg border border-border/30 bg-card/20 px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">{sym}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{d.t} trades · {((d.w/d.t)*100).toFixed(0)}% wr</span>
                      </div>
                      <span className={`font-mono text-sm font-bold ${d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {d.pnl >= 0 ? '+' : ''}{usd(d.pnl)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fairness callout */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-400">Walk-Forward Guarantee · </span>
                <span className="text-muted-foreground">
                  At each signal point T, gate accuracy was computed using only predictions with{' '}
                  <code className="font-mono bg-muted/40 px-1 rounded">created_at &lt; T</code>.
                  These predictions were generated in real-time by market-prediction-worker — no future data was used.
                  Results reflect true out-of-sample EP performance.
                </span>
              </div>
            </div>

            {/* Trade log */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Trade Log {showAll ? `(all ${s.totalTrades})` : `(last 30)`}
                </div>
                {s.totalTrades > 30 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {showAll ? 'Show less' : `Show all ${s.totalTrades}`}
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  <span className="w-12">Symbol</span>
                  <span>Archetype</span>
                  <span>Gate</span>
                  <span className="w-14 text-right">P&L</span>
                  <span className="w-20 text-right">Balance</span>
                </div>
                {displayTrades.map((t, i) => <TradeRow key={i} t={t} />)}
              </div>
            </div>

            {/* Run meta */}
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex items-center justify-between">
              <span>Run: <code className="font-mono">{s.run_id}</code></span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Start: $100 · Win +150% · Stop -50%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EPBacktestPanel;
