/**
 * MarketFlowVisualizer
 * EP Universal 8×8 Grid — Live Volume Flow + v33 Metadata
 *
 * Translates Finnhub volume delta, Vera Rubin dark force, chess consensus,
 * VIX, FINRA short pressure, EP prediction, temporal, and archetype parable
 * into the Universal Grid visual language.
 *
 * BLACK = BUY (bullish) | WHITE = SELL (bearish) — universal chess-market invariant.
 * Each cell breathes with the signal — darkness is buying force, light is selling force.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Wifi, WifiOff, TrendingUp, TrendingDown, Minus,
  Activity, Eye, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlowCell {
  value: number;       // 0–1, signal strength
  bullish: boolean;    // true = black (buy), false = white (sell)
  neutral: boolean;
  glow: boolean;       // true = high conviction
  label?: string;
}

interface SymbolRow {
  symbol: string;
  name: string;
  sector: string;
  emoji: string;
  cells: FlowCell[];
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  archetype: string;
  archetypeStory?: string;
  archetypeMoral?: string;
  chessPiece: string;
  chessColor: string;
  lastUpdated: string;
  age: number; // minutes since last prediction
}

interface PredictionMetadata {
  volume_flow?: { buy_pct?: number; sell_pct?: number; delta_pct?: number; chess_color?: string; piece_tier?: string; signal?: string; stale?: boolean };
  vera_rubin?: { score?: number; dark_force_direction?: string; piece_tier?: string; short_pressure?: number; vix_regime?: string };
  chess_consensus?: { blackPct?: number; whitePct?: number; drawPct?: number; dominantArchetype?: string; direction?: string };
  vix?: { current?: number; level?: string; change?: number };
  short_volume?: { shortPct?: number; signal?: string };
  archetype_story?: { story?: string; moral?: string; mechanism?: string; driver?: string; piece_tier?: string; color_bias?: string };
  temporal?: { day_of_week?: string; season?: string; month?: string };
  classification?: { how?: string; why?: string; who?: string; color_bias?: string };
  parable?: { agrees?: boolean; strength?: number; direction?: string };
  market_conditions?: { momentum?: number; volatility?: number };
}

// ── Signal Column Definitions (8 dimensions = the grid columns) ───────────────

const SIGNAL_COLS = [
  { key: 'flow',     label: 'FLOW',    short: 'FLW', hue: 142, desc: 'Live bid/sell volume delta (Finnhub WebSocket)' },
  { key: 'vera',     label: 'VERA',    short: 'VRA', hue: 270, desc: 'Vera Rubin dark force — hidden institutional pressure' },
  { key: 'chess',    label: 'CHESS',   short: 'CHS', hue: 210, desc: 'Chess consensus: black (buy) vs white (sell) piece activity' },
  { key: 'vix',      label: 'VIX',     short: 'VIX', hue: 0,   desc: 'VIX regime — fear index (high = bearish dark force)' },
  { key: 'short',    label: 'SHORT',   short: 'SHT', hue: 38,  desc: 'FINRA short pressure — bearish institutional positioning' },
  { key: 'ep',       label: 'EP PRED', short: 'EP',  hue: 55,  desc: 'En Pensent directional prediction × confidence' },
  { key: 'temporal', label: 'TEMPORAL',short: 'TMP', hue: 185, desc: 'Day-of-week + season temporal pattern strength' },
  { key: 'parable',  label: 'PARABLE', short: 'PAR', hue: 300, desc: 'Archetype parable cross-domain confirmation signal' },
] as const;

type ColKey = typeof SIGNAL_COLS[number]['key'];

// ── Symbol Universe ───────────────────────────────────────────────────────────

const SYMBOLS = [
  { symbol: 'SPY',  name: 'S&P 500',       sector: 'indices',    emoji: '📊' },
  { symbol: 'QQQ',  name: 'NASDAQ 100',    sector: 'indices',    emoji: '💻' },
  { symbol: 'IWM',  name: 'Russell 2000',  sector: 'indices',    emoji: '🏭' },
  { symbol: 'AMD',  name: 'AMD',           sector: 'tech',       emoji: '🔴' },
  { symbol: 'NVDA', name: 'NVIDIA',        sector: 'tech',       emoji: '🟢' },
  { symbol: 'GOOGL',name: 'Google',        sector: 'tech',       emoji: '🔵' },
  { symbol: 'MSFT', name: 'Microsoft',     sector: 'tech',       emoji: '🪟' },
  { symbol: 'META', name: 'Meta',          sector: 'tech',       emoji: '👁' },
  { symbol: 'SI=F', name: 'Silver',        sector: 'commodities',emoji: '🥈' },
  { symbol: 'CL=F', name: 'Crude Oil',     sector: 'energy',     emoji: '🛢' },
];

const PIECE_ICONS: Record<string, string> = {
  king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟',
};

// ── Cell Computation ──────────────────────────────────────────────────────────

function computeCells(meta: PredictionMetadata, direction: string, confidence: number): FlowCell[] {
  const bullish = direction === 'bullish';
  const bearish = direction === 'bearish';

  // FLOW: volume buy/sell delta
  const flowBuyPct = meta.volume_flow?.buy_pct ?? 0.5;
  const flowStale = meta.volume_flow?.stale ?? true;
  const flowVal = flowStale ? 0.3 : Math.abs(flowBuyPct - 0.5) * 2;
  const flowBull = flowStale ? (!bearish) : (flowBuyPct > 0.5);

  // VERA RUBIN: dark force score (0=bullish dark force, 1=bearish dark force → invert for display)
  const vrScore = meta.vera_rubin?.score ?? 0.5;
  const vrBull = vrScore < 0.5;
  const vrVal = Math.abs(vrScore - 0.5) * 2;

  // CHESS: blackPct (buy) vs whitePct (sell)
  const blackPct = (meta.chess_consensus?.blackPct ?? 50) / 100;
  const chessBull = blackPct > 0.5;
  const chessVal = Math.abs(blackPct - 0.5) * 2;

  // VIX: high vix = fear = bearish force
  const vixLevel = meta.vix?.level ?? 'neutral';
  const vixBull = vixLevel === 'low';
  const vixVal = vixLevel === 'extreme' ? 1.0 : vixLevel === 'high' ? 0.75 : vixLevel === 'low' ? 0.75 : 0.3;

  // SHORT: high short pressure = bearish
  const shortPct = meta.short_volume?.shortPct ?? 0.4;
  const shortBull = shortPct < 0.4;
  const shortVal = Math.abs(shortPct - 0.4) * 2;

  // EP: prediction direction × confidence
  const epBull = bullish;
  const epVal = confidence;

  // TEMPORAL: parable/day-of-week effect (use parable.strength as proxy)
  const parableStrength = meta.parable?.strength ?? 0.5;
  const parableDir = meta.parable?.direction;
  const tempBull = parableDir === 'bullish' ? true : parableDir === 'bearish' ? false : bullish;
  const tempVal = Math.abs(parableStrength - 0.5) * 2;

  // PARABLE: cross-domain confirmation
  const parableAgrees = meta.parable?.agrees ?? false;
  const parBull = parableDir === 'bullish' ? true : parableDir === 'bearish' ? false : bullish;
  const parVal = parableAgrees ? parableStrength : 0.2;

  // Glow = flow + chess + EP all agree with each other (3-way consensus)
  const signals = [flowBull, chessBull, epBull];
  const allBull = signals.every(s => s);
  const allBear = signals.every(s => !s);
  const glow = allBull || allBear;

  return [
    { value: flowVal,  bullish: flowBull,  neutral: flowStale, glow },
    { value: vrVal,    bullish: vrBull,    neutral: vrVal < 0.1, glow: vrVal > 0.7 },
    { value: chessVal, bullish: chessBull, neutral: chessVal < 0.1, glow: chessVal > 0.6 },
    { value: vixVal,   bullish: vixBull,   neutral: vixLevel === 'neutral', glow: vixVal > 0.7 },
    { value: shortVal, bullish: shortBull, neutral: shortVal < 0.1, glow: false },
    { value: epVal,    bullish: epBull,    neutral: !bullish && !bearish, glow: epVal > 0.7 },
    { value: tempVal,  bullish: tempBull,  neutral: tempVal < 0.1, glow: false },
    { value: parVal,   bullish: parBull,   neutral: !parableAgrees, glow: parableAgrees && parableStrength > 0.7 },
  ];
}

function getCellStyle(cell: FlowCell, hue: number) {
  if (cell.neutral) {
    return {
      background: `hsl(${hue}, 10%, 18%)`,
      boxShadow: 'none',
    };
  }
  // Black = buy (dark, high saturation green-black)
  // White = sell (light, red-white)
  const lightness = cell.bullish
    ? Math.max(8, 28 - cell.value * 20)   // darker = stronger buy = more black
    : Math.min(85, 28 + cell.value * 55);  // lighter = stronger sell = more white
  const sat = cell.bullish ? 70 + cell.value * 20 : 60 + cell.value * 20;
  const displayHue = cell.bullish ? hue : (hue + 180) % 360;
  const glow = cell.glow
    ? `0 0 ${6 + cell.value * 10}px hsl(${displayHue}, ${sat}%, ${lightness + 20}%)`
    : 'none';
  return {
    background: `hsl(${displayHue}, ${sat}%, ${lightness}%)`,
    boxShadow: glow,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

const MarketFlowVisualizer: React.FC = () => {
  const [rows, setRows] = useState<SymbolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<ColKey | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Get latest prediction per symbol with v33 metadata
      const { data, error } = await supabase
        .from('market_prediction_attempts')
        .select('symbol, predicted_direction, confidence, archetype, created_at, prediction_metadata')
        .in('symbol', SYMBOLS.map(s => s.symbol))
        .not('prediction_metadata', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data) return;

      // Deduplicate — latest per symbol
      const bySymbol = new Map<string, typeof data[0]>();
      for (const row of data) {
        if (!bySymbol.has(row.symbol)) bySymbol.set(row.symbol, row);
      }

      const now = Date.now();
      const newRows: SymbolRow[] = SYMBOLS
        .map(sym => {
          const row = bySymbol.get(sym.symbol);
          const meta = (row?.prediction_metadata as PredictionMetadata) ?? {};
          const direction = (row?.predicted_direction as 'bullish' | 'bearish' | 'neutral') ?? 'neutral';
          const confidence = typeof row?.confidence === 'number'
            ? (row.confidence > 1 ? row.confidence / 100 : row.confidence)
            : 0;
          const archetype = row?.archetype ?? 'choppy';
          const ageMs = row ? now - new Date(row.created_at).getTime() : Infinity;
          const ageMin = Math.round(ageMs / 60000);

          const cells = computeCells(meta, direction, confidence);

          // Chess piece from vera_rubin or archetype_story
          const pieceTier = meta.vera_rubin?.piece_tier
            ?? meta.archetype_story?.piece_tier
            ?? 'pawn';

          return {
            symbol: sym.symbol,
            name: sym.name,
            sector: sym.sector,
            emoji: sym.emoji,
            cells,
            direction,
            confidence,
            archetype,
            archetypeStory: meta.archetype_story?.story,
            archetypeMoral: meta.archetype_story?.moral,
            chessPiece: PIECE_ICONS[pieceTier] ?? '♟',
            chessColor: meta.chess_consensus
              ? ((meta.chess_consensus.blackPct ?? 50) > 50 ? 'black' : 'white')
              : (direction === 'bullish' ? 'black' : 'white'),
            lastUpdated: row?.created_at ?? '',
            age: ageMin,
          };
        });

      setRows(newRows);
      setLastRefresh(new Date());
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  const dominantSignal = rows.length > 0
    ? (() => {
        const bulls = rows.filter(r => r.direction === 'bullish').length;
        const bears = rows.filter(r => r.direction === 'bearish').length;
        if (bulls > bears + 2) return { label: 'BLACK DOMINATES', color: 'text-emerald-400', icon: '♚' };
        if (bears > bulls + 2) return { label: 'WHITE DOMINATES', color: 'text-slate-300', icon: '♔' };
        return { label: 'CONTESTED', color: 'text-amber-400', icon: '⚖' };
      })()
    : null;

  return (
    <TooltipProvider>
      <div className="w-full rounded-xl border border-border/50 bg-card/30 backdrop-blur overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">♟</span>
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-widest">
                  Market Flow Grid
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  EP Universal 8×8 · Volume Delta · Vera Rubin · Chess Consensus
                </p>
              </div>
            </div>
            {dominantSignal && (
              <Badge
                variant="outline"
                className={`text-[10px] font-mono gap-1 ${dominantSignal.color} border-current/30`}
              >
                {dominantSignal.icon} {dominantSignal.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {lastRefresh.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false })} ET
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(a => !a)}
              className="p-1.5 rounded hover:bg-muted/50 transition-colors"
              title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              {autoRefresh
                ? <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <button
              onClick={fetchData}
              className="p-1.5 rounded hover:bg-muted/50 transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-2 pt-2 pb-1 gap-1">
          {/* Symbol column spacer */}
          <div className="w-[110px] shrink-0" />
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${SIGNAL_COLS.length}, 1fr)` }}>
            {SIGNAL_COLS.map(col => (
              <Tooltip key={col.key}>
                <TooltipTrigger asChild>
                  <button
                    className={`
                      text-center text-[9px] font-mono uppercase tracking-wider py-1 rounded cursor-pointer
                      transition-colors ${hoveredCol === col.key ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:text-foreground'}
                    `}
                    onMouseEnter={() => setHoveredCol(col.key as ColKey)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    {col.short}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1">
                    <div className="font-semibold text-xs">{col.label}</div>
                    <p className="text-[10px] text-muted-foreground">{col.desc}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          {/* Direction column spacer */}
          <div className="w-[52px] shrink-0 text-[9px] text-muted-foreground text-center font-mono">EP</div>
        </div>

        {/* Grid rows */}
        <div className="px-2 pb-3 space-y-1">
          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading grid...
            </div>
          ) : (
            rows.map(row => (
              <Tooltip key={row.symbol}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`
                      flex items-center gap-1 rounded-md cursor-pointer transition-all duration-200
                      ${hoveredRow === row.symbol ? 'bg-muted/30 ring-1 ring-border/50' : 'hover:bg-muted/10'}
                    `}
                    onMouseEnter={() => setHoveredRow(row.symbol)}
                    onMouseLeave={() => setHoveredRow(null)}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Symbol label */}
                    <div className="w-[110px] shrink-0 flex items-center gap-1.5 px-2 py-1.5">
                      <span className="text-base leading-none">{row.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold truncate">{row.symbol}</span>
                          <span className="text-[11px] opacity-70">{row.chessPiece}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-mono ${
                            row.age < 30 ? 'text-emerald-400/70' : row.age < 120 ? 'text-amber-400/70' : 'text-muted-foreground/50'
                          }`}>
                            {row.age < 999 ? `${row.age}m` : '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signal cells */}
                    <div className="flex-1 grid gap-1 py-1.5" style={{ gridTemplateColumns: `repeat(${SIGNAL_COLS.length}, 1fr)` }}>
                      {row.cells.map((cell, ci) => {
                        const col = SIGNAL_COLS[ci];
                        const style = getCellStyle(cell, col.hue);
                        return (
                          <motion.div
                            key={col.key}
                            className="h-7 rounded-sm relative overflow-hidden"
                            style={style}
                            animate={cell.glow ? {
                              boxShadow: [
                                style.boxShadow,
                                style.boxShadow?.replace(/\d+px hsl/, '12px hsl') ?? style.boxShadow,
                              ]
                            } : {}}
                            transition={{ duration: 1.5, repeat: cell.glow ? Infinity : 0, repeatType: 'reverse' }}
                          >
                            {/* Intensity shimmer for glow cells */}
                            {cell.glow && (
                              <motion.div
                                className="absolute inset-0 opacity-20"
                                style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                              />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Direction + confidence */}
                    <div className="w-[52px] shrink-0 flex flex-col items-center justify-center py-1 px-1">
                      <div className={`flex items-center gap-0.5 ${
                        row.direction === 'bullish' ? 'text-emerald-400'
                          : row.direction === 'bearish' ? 'text-red-400'
                          : 'text-muted-foreground'
                      }`}>
                        {row.direction === 'bullish' ? <TrendingUp className="h-3 w-3" />
                          : row.direction === 'bearish' ? <TrendingDown className="h-3 w-3" />
                          : <Minus className="h-3 w-3" />}
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {row.confidence > 0 ? `${Math.round(row.confidence * 100)}%` : '—'}
                      </span>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px] p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{row.emoji} {row.symbol} — {row.name}</span>
                      <Badge variant="outline" className="text-[9px]">{row.sector}</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-mono ${
                        row.direction === 'bullish' ? 'text-emerald-400' : row.direction === 'bearish' ? 'text-red-400' : 'text-muted-foreground'
                      }`}>
                        {row.chessColor === 'black' ? '♚ BLACK (BUY)' : '♔ WHITE (SELL)'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{row.chessPiece} {row.archetype}</span>
                    </div>
                    {row.archetypeStory && (
                      <p className="text-[10px] text-muted-foreground italic border-l-2 border-border pl-2">
                        "{row.archetypeStory}"
                      </p>
                    )}
                    {row.archetypeMoral && (
                      <p className="text-[10px] text-primary/80 font-medium">
                        ↳ {row.archetypeMoral}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground/60">
                      Last prediction: {row.age < 999 ? `${row.age} min ago` : 'no recent data'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))
          )}
        </div>

        {/* Legend footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/20 bg-background/20">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-900 border border-emerald-700/50" />
              <span>♚ BLACK = BUY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-300/50" />
              <span>♔ WHITE = SELL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span>GREY = NEUTRAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-amber-400" />
              <span>GLOW = 3-WAY CONSENSUS</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>♟ Retail → ♜ Bank → ♛ Institution → ♚ Central Bank</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MarketFlowVisualizer;
