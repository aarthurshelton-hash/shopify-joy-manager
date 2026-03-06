/**
 * BullionVaultPredictionPanel
 *
 * Live BullionVault price charts (gold / silver / platinum / palladium)
 * with En Pensent™ directional predictions overlaid per metal.
 * Fetches latest prediction from market_prediction_attempts for each EP symbol.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Metal config ────────────────────────────────────────────────────────────
const METALS = [
  { id: 'gold',      label: 'Gold',      bv: 'gold',      epSymbol: 'GC=F',  color: '#f59e0b', emoji: '🥇' },
  { id: 'silver',    label: 'Silver',    bv: 'silver',    epSymbol: 'SI=F',  color: '#94a3b8', emoji: '🥈' },
  { id: 'platinum',  label: 'Platinum',  bv: 'platinum',  epSymbol: 'PL=F',  color: '#8b5cf6', emoji: '💎' },
  { id: 'palladium', label: 'Palladium', bv: 'palladium', epSymbol: 'PA=F',  color: '#06b6d4', emoji: '⚗️' },
] as const;

type MetalId = typeof METALS[number]['id'];

interface EPPrediction {
  predicted_direction: string;
  confidence: number;
  archetype: string;
  time_horizon: string;
  created_at: string;
  ep_correct: boolean | null;
}

// ── BullionVault chart loader ────────────────────────────────────────────────
const BV_SCRIPT_ID = 'bv-chart-script';

function loadBVScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as { BullionVaultChart?: unknown }).BullionVaultChart) { resolve(); return; }
    const existing = document.getElementById(BV_SCRIPT_ID);
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = BV_SCRIPT_ID;
    script.src = 'https://www.bullionvault.com/chart/bullionvaultchart.js?v=1';
    script.type = 'text/javascript';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ── Direction badge ──────────────────────────────────────────────────────────
function DirectionBadge({ direction, confidence }: { direction: string; confidence: number }) {
  const isUp   = direction === 'bullish';
  const isDown = direction === 'bearish';
  const pct    = `${confidence}%`;

  if (isUp) return (
    <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-3 py-1.5">
      <TrendingUp className="w-4 h-4 text-emerald-400" />
      <span className="text-emerald-400 font-bold text-sm">BULLISH</span>
      <span className="text-emerald-300 text-xs ml-1">{pct}</span>
    </div>
  );
  if (isDown) return (
    <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5">
      <TrendingDown className="w-4 h-4 text-red-400" />
      <span className="text-red-400 font-bold text-sm">BEARISH</span>
      <span className="text-red-300 text-xs ml-1">{pct}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 bg-gray-500/15 border border-gray-500/30 rounded-lg px-3 py-1.5">
      <Minus className="w-4 h-4 text-gray-400" />
      <span className="text-gray-400 font-bold text-sm">NEUTRAL</span>
      <span className="text-gray-300 text-xs ml-1">{pct}</span>
    </div>
  );
}

// ── Single chart instance ────────────────────────────────────────────────────
function MetalChart({ bv, containerId }: { bv: string; containerId: string }) {
  const instanceRef = useRef<{ destroy?: () => void } | null>(null);
  const mountedRef  = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    loadBVScript().then(() => {
      const win = window as { BullionVaultChart?: new (opts: Record<string, unknown>, id: string) => { destroy?: () => void } };
      if (!win.BullionVaultChart) return;
      try {
        instanceRef.current = new win.BullionVaultChart({
          bullion: bv,
          currency: 'USD',
          timeframe: '1d',
          chartType: 'line',
          containerDefinedSize: true,
          miniChartMode: false,
          displayLatestPriceLine: true,
          switchBullion: false,
          switchCurrency: false,
          switchTimeframe: true,
          switchChartType: false,
          exportButton: false,
        }, containerId);
      } catch (_e) {
        // BullionVault chart init failed — external library, non-fatal
      }
    });

    return () => {
      try { instanceRef.current?.destroy?.(); } catch (_e) { /* non-fatal cleanup */ }
    };
  }, [bv, containerId]);

  return <div id={containerId} style={{ width: '100%', height: '320px' }} />;
}

// ── Main panel ───────────────────────────────────────────────────────────────
const BullionVaultPredictionPanel: React.FC = () => {
  const [active, setActive]           = useState<MetalId>('gold');
  const [preds, setPreds]             = useState<Record<string, EPPrediction | null>>({});
  const [loading, setLoading]         = useState(true);
  const [lastFetch, setLastFetch]     = useState<Date | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    const results: Record<string, EPPrediction | null> = {};

    await Promise.all(METALS.map(async (m) => {
      const { data } = await supabase
        .from('market_prediction_attempts')
        .select('predicted_direction, confidence, archetype, time_horizon, created_at, ep_correct')
        .eq('symbol', m.epSymbol)
        .not('archetype', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      results[m.id] = data ?? null;
    }));

    setPreds(results);
    setLastFetch(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 2 * 60 * 1000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  const metal = METALS.find(m => m.id === active)!;
  const pred  = preds[active];

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏦</span>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide">BullionVault Live · EP Predictions</h2>
            <p className="text-[10px] text-muted-foreground">En Pensent™ directional signal overlay — gold / silver / platinum / palladium</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-[10px] text-muted-foreground">
              Updated {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchPredictions}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            title="Refresh predictions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metal tabs */}
      <div className="flex border-b border-border/40">
        {METALS.map((m) => {
          const p = preds[m.id];
          const isUp   = p?.predicted_direction === 'bullish';
          const isDown = p?.predicted_direction === 'bearish';
          const dotColor = isUp ? 'bg-emerald-400' : isDown ? 'bg-red-400' : 'bg-gray-400';
          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                active === m.id
                  ? 'border-b-2 text-foreground bg-muted/30'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
              }`}
              style={{ borderColor: active === m.id ? m.color : undefined }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
              {!loading && p && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* EP prediction bar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">EP Signal</span>
            <span className="text-[10px] text-muted-foreground">{metal.epSymbol}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading prediction…
            </div>
          ) : pred ? (
            <div className="flex items-center gap-3 flex-wrap">
              <DirectionBadge direction={pred.predicted_direction} confidence={pred.confidence} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Archetype:</span>
                <span className="text-xs font-mono font-bold text-foreground">{pred.archetype}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Horizon:</span>
                <span className="text-xs font-mono text-foreground">{pred.time_horizon}</span>
              </div>
              {pred.ep_correct !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pred.ep_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {pred.ep_correct ? '✓ RESOLVED CORRECT' : '✗ RESOLVED WRONG'}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(pred.created_at).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              No prediction yet for {metal.epSymbol} — system will generate next cycle
            </div>
          )}
        </div>

        {/* BullionVault live chart */}
        <div className="rounded-lg overflow-hidden border border-border/30 bg-white">
          {METALS.map((m) => (
            <div key={m.id} style={{ display: active === m.id ? 'block' : 'none' }}>
              <MetalChart bv={m.bv} containerId={`bv-chart-${m.id}`} />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Live prices via BullionVault · EP signals from market-prediction-worker v33 ·{' '}
          <span className="text-amber-400">Chess→Market intelligence transfer active</span>
        </p>
      </div>
    </div>
  );
};

export default BullionVaultPredictionPanel;
