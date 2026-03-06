/**
 * CommodityGridVisualizer
 * Translates commodity OHLCV market-condition signals into the EP Universal 8×8 Grid.
 * Version A — raw market state | Version B — EP predictive overlay
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, Download, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface GridCell {
  intensity: number;    // 0–1
  direction: number;    // -1 bear · 0 neutral · +1 bull
  baseHue: number;
  layers: string[];     // hex/hsl colors, outermost first
  epGlow: boolean;
}

interface EPPred {
  symbol: string;
  direction: string;
  confidence: number;
  archetype: string;
  timeHorizon: string;
  conditions: Record<string, number>;
  createdAt: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const METALS = [
  { id: 'gold',      label: 'Gold',      epSymbol: 'GC=F', hue: 43,  emoji: '🥇' },
  { id: 'silver',    label: 'Silver',    epSymbol: 'SI=F', hue: 210, emoji: '🥈' },
  { id: 'platinum',  label: 'Platinum',  epSymbol: 'PL=F', hue: 270, emoji: '💎' },
  { id: 'palladium', label: 'Palladium', epSymbol: 'PA=F', hue: 185, emoji: '⚗️' },
] as const;

type MetalId = typeof METALS[number]['id'];

const SIGNAL_ROWS = [
  { label: 'MOMENTUM',       short: 'MOM', keys: ['momentum_5','momentum_10','momentum_20'],  hue: 38  },
  { label: 'TREND',          short: 'TRD', keys: ['trend_strength','sector_momentum'],         hue: 215 },
  { label: 'VOLUME',         short: 'VOL', keys: ['volume_ratio','buying_pressure'],           hue: 142 },
  { label: 'VOLATILITY',     short: 'VLT', keys: ['volatility','atr_ratio','vol_change'],      hue: 0   },
  { label: 'MEAN-REVERSION', short: 'MRV', keys: ['rsi_signal','mean_distance'],              hue: 55  },
  { label: 'PATTERN',        short: 'PAT', keys: ['tactical_score','candle_signal'],           hue: 300 },
  { label: 'STRUCTURE',      short: 'STR', keys: ['options_iv','support_proximity'],           hue: 180 },
  { label: 'CONFLUENCE',     short: 'CON', keys: ['signal_agreement','confidence_score'],     hue: 90  },
] as const;

const TIMEFRAME_COLS = [
  { label: '5m'  },
  { label: '15m' },
  { label: '30m' },
  { label: '1h'  },
  { label: '2h'  },
  { label: '4h'  },
  { label: '8h'  },
  { label: '1d'  },
] as const;

const TF_TO_HORIZON: Record<string, string[]> = {
  '30m': ['30m'],
  '1h':  ['scalp_1h', 'scalp'],
  '2h':  ['medium'],
  '8h':  ['swing'],
  '1d':  ['daily'],
};

// ── Signal computation ────────────────────────────────────────────────────────
function computeGrid(
  conds: Record<string, number>,
  preds: EPPred[],
  metalHue: number
): { grid: GridCell[][]; epRow: GridCell[] } {
  const grid: GridCell[][] = SIGNAL_ROWS.map((sig, ri) =>
    TIMEFRAME_COLS.map((tf, ci) => {
      // Average raw signal values for this row
      const vals = sig.keys.map(k => conds[k]).filter(v => v !== undefined && !isNaN(v));
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

      // Timeframe decay: shorter timeframes are noisier → lower weight
      const tfDecay = 0.45 + (ci / 7) * 0.55;
      const intensity = Math.min(1, Math.abs(avg) * tfDecay);
      const direction = avg > 0.05 ? 1 : avg < -0.05 ? -1 : 0;

      const hueShift = direction * 20;
      const sat = 50 + intensity * 40;
      const lum = 15 + intensity * 45;
      const base = `hsl(${sig.hue + hueShift},${sat}%,${lum}%)`;
      const metal = `hsl(${metalHue + hueShift},${35 + intensity * 35}%,${25 + intensity * 30}%)`;

      // Check EP agreement on this timeframe
      const matchPred = preds.find(p =>
        (TF_TO_HORIZON[tf.label] ?? []).includes(p.timeHorizon)
      );
      const epDir = matchPred?.direction === 'bullish' ? 1 : matchPred?.direction === 'bearish' ? -1 : 0;
      const epConf = matchPred ? matchPred.confidence / 100 : 0;
      const epAgrees = epDir !== 0 && epDir === direction && epConf > 0.48;

      const layers = [base, metal];
      if (epAgrees) layers.push(`hsl(${metalHue},90%,${38 + epConf * 28}%)`);

      return { intensity, direction, baseHue: sig.hue, layers, epGlow: epAgrees };
    })
  );

  const epRow: GridCell[] = TIMEFRAME_COLS.map((tf) => {
    const match = preds.find(p => (TF_TO_HORIZON[tf.label] ?? []).includes(p.timeHorizon));
    const dir = match?.direction === 'bullish' ? 1 : match?.direction === 'bearish' ? -1 : 0;
    const conf = match ? match.confidence / 100 : 0;
    const hs = dir * 22;
    const color = match
      ? `hsl(${metalHue + hs},${55 + conf * 40}%,${18 + conf * 42}%)`
      : 'hsl(220,12%,10%)';
    return {
      intensity: match ? conf : 0.08,
      direction: dir,
      baseHue: metalHue,
      layers: match ? [color, `hsl(${metalHue + hs},85%,50%)`] : [color],
      epGlow: !!match,
    };
  });

  return { grid, epRow };
}

// ── SVG renderer ──────────────────────────────────────────────────────────────
interface GridSVGProps {
  grid: GridCell[][];
  epRow: GridCell[];
  metalHue: number;
  metalLabel: string;
  showEP: boolean;
  size?: number;
}

const GridSVG = React.forwardRef<SVGSVGElement, GridSVGProps>(
  ({ grid, epRow, metalHue, metalLabel, showEP, size = 400 }, ref) => {
    const LABEL_W = 36;
    const LABEL_H = 18;
    const BORDER  = 5;
    const EP_H    = showEP ? 28 : 0;

    const cols = 8;
    const rows = 8 + (showEP ? 1 : 0);
    const cellW = (size - LABEL_W - BORDER * 2) / cols;
    const cellH = (size - LABEL_H - BORDER * 2 - EP_H) / 8;
    const totalW = size + LABEL_W;
    const totalH = size + LABEL_H + EP_H + BORDER;

    const renderCell = (cell: GridCell, cx: number, cy: number, w: number, h: number, isEP = false) => {
      const els: React.ReactNode[] = [];
      els.push(<rect key="bg" x={cx} y={cy} width={w} height={h} fill="hsl(222,22%,7%)" />);

      const maxL = Math.min(cell.layers.length, 3);
      for (let li = 0; li < maxL; li++) {
        const shrink = Math.pow(0.74, li);
        const lw = (w - 2) * shrink;
        const lh = (h - 2) * shrink;
        const ox = cx + (w - lw) / 2;
        const oy = cy + (h - lh) / 2;
        els.push(
          <rect key={`l${li}`} x={ox} y={oy} width={lw} height={lh}
            fill={cell.layers[li]}
            opacity={0.25 + cell.intensity * 0.75}
          />
        );
      }

      if (cell.epGlow || isEP) {
        els.push(
          <rect key="glow" x={cx + 1} y={cy + 1} width={w - 2} height={h - 2}
            fill="none"
            stroke={`hsl(${metalHue},95%,62%)`}
            strokeWidth={isEP ? 1.2 : 0.7}
            opacity={0.55 + cell.intensity * 0.45}
          />
        );
      }
      return els;
    };

    return (
      <svg ref={ref} width={totalW} height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', background: 'hsl(222,25%,5%)' }}
      >
        {/* Outer border */}
        <rect x={0} y={0} width={totalW} height={totalH} fill="hsl(222,25%,5%)" />
        <rect x={BORDER/2} y={BORDER/2} width={totalW - BORDER} height={totalH - BORDER}
          fill="none" stroke={`hsl(${metalHue},55%,32%)`} strokeWidth={BORDER/2} rx={3} />

        {/* Column headers */}
        {TIMEFRAME_COLS.map((tf, ci) => (
          <text key={tf.label}
            x={LABEL_W + BORDER + ci * cellW + cellW / 2}
            y={BORDER + 13}
            textAnchor="middle" fontSize={8.5} fontFamily="monospace"
            fill={`hsl(${metalHue},45%,55%)`}
          >{tf.label}</text>
        ))}

        {/* Signal rows */}
        {grid.map((row, ri) => {
          const sig = SIGNAL_ROWS[ri];
          const cy = LABEL_H + BORDER + ri * cellH;
          return (
            <g key={sig.short}>
              <text x={LABEL_W - 4} y={cy + cellH / 2 + 3.5}
                textAnchor="end" fontSize={7} fontFamily="monospace" letterSpacing={0.3}
                fill={`hsl(${sig.hue},48%,52%)`}
              >{sig.short}</text>
              {row.map((cell, ci) => {
                const cx = LABEL_W + BORDER + ci * cellW;
                return <g key={ci}>{renderCell(cell, cx, cy, cellW - 1, cellH - 1)}</g>;
              })}
            </g>
          );
        })}

        {/* EP row separator + cells */}
        {showEP && (
          <g>
            <line
              x1={LABEL_W} y1={LABEL_H + BORDER + 8 * cellH + 1}
              x2={totalW - BORDER} y2={LABEL_H + BORDER + 8 * cellH + 1}
              stroke={`hsl(${metalHue},75%,48%)`} strokeWidth={0.8} strokeDasharray="3,2"
            />
            <text x={LABEL_W - 4} y={LABEL_H + BORDER + 8 * cellH + EP_H / 2 + 5}
              textAnchor="end" fontSize={6.5} fontFamily="monospace"
              fill={`hsl(${metalHue},90%,62%)`}
            >EP→</text>
            {epRow.map((cell, ci) => {
              const cx = LABEL_W + BORDER + ci * cellW;
              const cy = LABEL_H + BORDER + 8 * cellH + 4;
              return <g key={ci}>{renderCell(cell, cx, cy, cellW - 1, EP_H - 6, true)}</g>;
            })}
          </g>
        )}

        {/* Watermark */}
        <text x={totalW / 2} y={totalH - 3}
          textAnchor="middle" fontSize={6.5} fontFamily="monospace"
          fill={`hsl(${metalHue},35%,35%)`} letterSpacing={1.5}
        >EN PENSENT™ UNIVERSAL GRID · {metalLabel.toUpperCase()}</text>
      </svg>
    );
  }
);
GridSVG.displayName = 'GridSVG';

// ── Direction badge ───────────────────────────────────────────────────────────
function DirBadge({ dir, conf }: { dir: string; conf: number }) {
  if (dir === 'bullish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
      <TrendingUp className="w-3 h-3" /> {conf}%
    </span>
  );
  if (dir === 'bearish') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold">
      <TrendingDown className="w-3 h-3" /> {conf}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-xs">
      <Minus className="w-3 h-3" /> {conf}%
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const CommodityGridVisualizer: React.FC = () => {
  const [activeMetal, setActiveMetal] = useState<MetalId>('gold');
  const [showEP, setShowEP]           = useState(true);
  const [preds, setPreds]             = useState<Record<MetalId, EPPred[]>>({} as Record<MetalId, EPPred[]>);
  const [loading, setLoading]         = useState(true);
  const [lastFetch, setLastFetch]     = useState<Date | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const result = {} as Record<MetalId, EPPred[]>;

    await Promise.all(
      METALS.map(async (m) => {
        const { data } = await supabase
          .from('market_prediction_attempts')
          .select('predicted_direction,confidence,archetype,time_horizon,created_at,prediction_metadata')
          .eq('symbol', m.epSymbol)
          .not('archetype', 'is', null)
          .order('created_at', { ascending: false })
          .limit(16);

        result[m.id] = (data ?? []).map(r => {
          const meta = (r.prediction_metadata as Record<string, unknown>) ?? {};
          const conditions = (meta.market_conditions as Record<string, number>) ?? {};
          return {
            symbol: m.epSymbol,
            direction: r.predicted_direction,
            confidence: r.confidence ?? 0,
            archetype: r.archetype ?? 'unknown',
            timeHorizon: r.time_horizon ?? '',
            conditions,
            createdAt: r.created_at,
          } as EPPred;
        });
      })
    );

    setPreds(result);
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 2 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const metal     = METALS.find(m => m.id === activeMetal)!;
  const metalPreds = preds[activeMetal] ?? [];

  // Merge & average all stored market_conditions from recent predictions
  const mergedConds = metalPreds.reduce<Record<string, number>>((acc, p) => {
    for (const [k, v] of Object.entries(p.conditions)) {
      acc[k] = (acc[k] ?? 0) + v;
    }
    return acc;
  }, {});
  if (metalPreds.length > 0) {
    for (const k of Object.keys(mergedConds)) mergedConds[k] /= metalPreds.length;
  }

  const { grid, epRow } = computeGrid(mergedConds, metalPreds, metal.hue);
  const latestPred = metalPreds[0];

  const handleExport = () => {
    if (!svgRef.current) return;
    const data = new XMLSerializer().serializeToString(svgRef.current);
    const url  = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `EP_Grid_${metal.label}_${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-widest">Universal Grid · Commodity Encoder</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Market conditions → 8×8 Universal Grid · A: raw state · B: EP predictive
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => setShowEP(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-xs transition-colors">
            {showEP ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showEP ? 'B: EP ON' : 'A: RAW'}
          </button>
          <button onClick={fetchAll} title="Refresh grid data"
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-xs transition-colors">
            <Download className="w-3 h-3" />SVG
          </button>
        </div>
      </div>

      {/* Metal tabs */}
      <div className="flex border-b border-border/40">
        {METALS.map(m => {
          const mp = preds[m.id];
          const latest = mp?.[0];
          return (
            <button key={m.id} onClick={() => setActiveMetal(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeMetal === m.id
                  ? 'text-foreground bg-muted/25'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
              }`}
              style={{ borderColor: activeMetal === m.id ? `hsl(${m.hue},65%,52%)` : undefined }}
            >
              <span>{m.emoji}</span>
              <span className="hidden sm:inline">{m.label}</span>
              {!loading && latest && (
                latest.direction === 'bullish' ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                : latest.direction === 'bearish' ? <TrendingDown className="w-3 h-3 text-red-400" />
                : <Minus className="w-3 h-3 text-gray-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col lg:flex-row gap-5">
        {/* Grid */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {loading ? (
            <div className="aspect-square max-w-sm w-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-xs">Mapping market signals to grid…</span>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <GridSVG
                ref={svgRef}
                grid={grid}
                epRow={epRow}
                metalHue={metal.hue}
                metalLabel={metal.label}
                showEP={showEP}
                size={360}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-52 flex flex-col gap-4 text-xs">
          {/* Version indicator */}
          <div className={`rounded-lg px-3 py-2.5 border ${showEP ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/30 bg-muted/10'}`}>
            <p className="font-bold text-[10px] uppercase tracking-wider mb-1.5">
              {showEP ? '⬛ Version B — EP Predictive' : '□ Version A — Raw Market State'}
            </p>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              {showEP
                ? 'EP row appended below grid. Glowing cell borders = EP high-confidence agreement with raw signal.'
                : 'Pure signal grid. 8 categories × 8 timeframes. No prediction overlay.'}
            </p>
          </div>

          {/* Signal row legend */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Signal Rows</p>
            <div className="space-y-1.5">
              {SIGNAL_ROWS.map(s => (
                <div key={s.short} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: `hsl(${s.hue},58%,38%)` }} />
                  <span className="text-muted-foreground font-mono">{s.short}</span>
                  <span className="text-muted-foreground/55 truncate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest EP prediction */}
          {latestPred && (
            <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Latest EP Signal
              </p>
              <div className="flex items-center gap-2 mb-2">
                <DirBadge dir={latestPred.direction} conf={latestPred.confidence} />
              </div>
              <div className="space-y-1 text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Archetype</span>
                  <span className="text-foreground font-mono truncate ml-2">
                    {latestPred.archetype.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Horizon</span>
                  <span className="text-foreground font-mono">{latestPred.timeHorizon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signal count</span>
                  <span className="text-foreground font-mono">{metalPreds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>As of</span>
                  <span className="text-foreground font-mono">
                    {new Date(latestPred.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timeframe key */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Columns</p>
            <div className="grid grid-cols-4 gap-1">
              {TIMEFRAME_COLS.map((tf) => (
                <div key={tf.label} className="text-center">
                  <div className="rounded text-[9px] font-mono py-0.5 bg-muted/20"
                    style={{ color: `hsl(${metal.hue},50%,55%)` }}>
                    {tf.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommodityGridVisualizer;
