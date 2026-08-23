/**
 * SignalCard — Live En Pensent market signal card
 *
 * Renders a victory-card-style signal for a single symbol with:
 * - Direction (CALL/PUT) with calibrated conviction
 * - 8×8 Universal Grid (market flow visualized as chess board)
 * - Archetype story + parable
 * - Key signal drivers (VIX, chess consensus, short volume, overnight sentiment)
 * - Auto-refreshes from Supabase
 *
 * BLACK = BUY (bullish) | WHITE = SELL (bearish) — universal chess-market invariant.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Activity, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlowCell {
  value: number;
  bullish: boolean;
  neutral: boolean;
  glow: boolean;
  label?: string;
}

interface SignalCardProps {
  symbol: string;
  name: string;
  sector: string;
  emoji: string;
}

interface PredictionData {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  rawConfidence?: number;
  archetype: string;
  price: number;
  createdAt: string;
  metadata: any;
}

// ── Signal Columns (8 dimensions = the grid columns) ──────────────────────────

const SIGNAL_COLS = [
  { key: 'flow',     label: 'FLOW',    hue: 142, desc: 'Volume delta' },
  { key: 'vera',     label: 'VERA',    hue: 270, desc: 'Dark force' },
  { key: 'chess',    label: 'CHESS',   hue: 210, desc: 'Chess consensus' },
  { key: 'vix',      label: 'VIX',     hue: 0,   desc: 'Fear index' },
  { key: 'short',    label: 'SHORT',   hue: 38,  desc: 'Short pressure' },
  { key: 'ep',       label: 'EP',      hue: 55,  desc: 'EP prediction' },
  { key: 'temporal', label: 'TEMP',    hue: 185, desc: 'Temporal pattern' },
  { key: 'parable',  label: 'PAR',     hue: 300, desc: 'Cross-domain' },
] as const;

// ── Cell computation (same logic as MarketFlowVisualizer) ─────────────────────

function computeCells(meta: any, direction: string, confidence: number): FlowCell[] {
  const bullish = direction === 'bullish';
  const bearish = direction === 'bearish';

  const flowBuyPct = meta.volume_flow?.buy_pct ?? 0.5;
  const flowStale = meta.volume_flow?.stale ?? true;
  const flowVal = flowStale ? 0.3 : Math.abs(flowBuyPct - 0.5) * 2;
  const flowBull = flowStale ? !bearish : flowBuyPct > 0.5;

  const vrScore = meta.vera_rubin?.score ?? 0.5;
  const vrBull = vrScore < 0.5;
  const vrVal = Math.abs(vrScore - 0.5) * 2;

  const blackPct = (meta.chess_consensus?.blackPct ?? 50) / 100;
  const chessBull = blackPct > 0.5;
  const chessVal = Math.abs(blackPct - 0.5) * 2;

  const vixLevel = meta.vix?.level ?? 'neutral';
  const vixBull = vixLevel === 'low';
  const vixVal = vixLevel === 'extreme' ? 1.0 : vixLevel === 'high' ? 0.75 : vixLevel === 'low' ? 0.75 : 0.3;

  const shortPct = meta.short_volume?.shortPct ?? 0.4;
  const shortBull = shortPct < 0.4;
  const shortVal = Math.abs(shortPct - 0.4) * 2;

  const epBull = bullish;
  const epVal = confidence;

  const parableStrength = meta.parable?.strength ?? 0.5;
  const parableDir = meta.parable?.direction;
  const tempBull = parableDir === 'bullish' ? true : parableDir === 'bearish' ? false : bullish;
  const tempVal = Math.abs(parableStrength - 0.5) * 2;

  const parableAgrees = meta.parable?.agrees ?? false;
  const parBull = parableDir === 'bullish' ? true : parableDir === 'bearish' ? false : bullish;
  const parVal = parableAgrees ? parableStrength : 0.2;

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
    return { background: `hsl(${hue}, 10%, 18%)`, boxShadow: 'none' };
  }
  const lightness = cell.bullish
    ? Math.max(8, 28 - cell.value * 20)
    : Math.min(85, 28 + cell.value * 55);
  const sat = cell.bullish ? 70 + cell.value * 20 : 60 + cell.value * 20;
  const displayHue = cell.bullish ? hue : (hue + 180) % 360;
  const glow = cell.glow
    ? `0 0 ${6 + cell.value * 10}px hsl(${displayHue}, ${sat}%, ${lightness + 20}%)`
    : 'none';
  return { background: `hsl(${displayHue}, ${sat}%, ${lightness}%)`, boxShadow: glow };
}

// ── Archetype display names ───────────────────────────────────────────────────

const ARCHETYPE_NAMES: Record<string, string> = {
  mean_reversion_up: 'Mean Reversion ↑',
  mean_reversion_down: 'Mean Reversion ↓',
  regime_shift_up: 'Regime Shift ↑',
  regime_shift_down: 'Regime Shift ↓',
  momentum_continuation: 'Momentum Continuation',
  false_breakout: 'False Breakout',
  overbought_fade: 'Overbought Fade',
  oversold_bounce: 'Oversold Bounce',
  gap_continuation: 'Gap Continuation',
  compression: 'Compression Breakout',
  choppy: 'Choppy / Indeterminate',
  blunder_free_queen: 'Blunder-Free Queen',
  trap_queen_sac: 'Trap: Queen Sac',
  castling_reposition: 'Castling Reposition',
  bullish_momentum: 'Bullish Momentum',
  queenside_expansion: 'Queenside Expansion',
  kingside_attack: 'Kingside Attack',
  central_domination: 'Central Domination',
  positional_squeeze: 'Positional Squeeze',
};

// ── Fetch live price from Yahoo Finance (CORS-friendly proxy) ─────────────────
async function fetchLivePrice(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const yahooSymbol = symbol.replace('=', '=F');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`;
    const r = await fetch(url);
    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) return null;
    const quotes = result.indicators?.quote?.[0];
    const closes = quotes?.close?.filter((c: number) => c != null) || [];
    if (closes.length < 2) return { price: closes[0] || 0, change: 0 };
    const price = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    return { price, change: ((price - prev) / prev) * 100 };
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SignalCard: React.FC<SignalCardProps> = ({ symbol, name, sector, emoji }) => {
  const [pred, setPred] = useState<PredictionData | null>(null);
  const [livePrice, setLivePrice] = useState<{ price: number; change: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('market_signals_public')
        .select('symbol, predicted_direction, confidence, archetype, price_at_prediction, created_at, prediction_metadata')
        .eq('symbol', symbol)
        .order('created_at', { ascending: false })
        .limit(1);

      // Also fetch live price in parallel (always — even if no prediction)
      fetchLivePrice(symbol).then(p => { if (p) setLivePrice(p); });

      if (error || !data || data.length === 0) {
        setLoading(false);
        return;
      }

      const row = data[0];
      const meta = row.prediction_metadata || {};
      const direction = (row.predicted_direction as 'bullish' | 'bearish' | 'neutral') || 'neutral';
      const confidence = typeof row.confidence === 'number'
        ? (row.confidence > 1 ? row.confidence / 100 : row.confidence)
        : 0;

      // Extract calibrated vs raw confidence
      const calib = meta.confidence_calibration;
      const rawConf = calib?.raw_confidence ? calib.raw_confidence / 100 : undefined;

      setPred({
        direction,
        confidence,
        rawConfidence: rawConf,
        archetype: row.archetype || 'choppy',
        price: row.price_at_prediction || 0,
        createdAt: row.created_at,
        metadata: meta,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 animate-pulse">
        <div className="h-32 bg-muted/20 rounded" />
      </div>
    );
  }

  // Compute staleness
  const ageHours = pred ? (Date.now() - new Date(pred.createdAt).getTime()) / 3600000 : Infinity;
  const isStale = ageHours > 4;
  const ageLabel = ageHours < 1 ? 'just now' : ageHours < 24 ? `${Math.floor(ageHours)}h ago` : `${Math.floor(ageHours / 24)}d ago`;

  if (!pred) {
    // No prediction in DB — show live price + "awaiting signal" state
    return (
      <div className="rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="font-bold text-lg leading-tight">{symbol}</div>
              <div className="text-xs text-muted-foreground">{name}</div>
            </div>
          </div>
          {livePrice && (
            <div className="text-right">
              <div className="font-semibold text-sm">${livePrice.price.toFixed(2)}</div>
              <div className={`text-xs ${livePrice.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {livePrice.change >= 0 ? '+' : ''}{livePrice.change.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-sm text-muted-foreground py-6 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 opacity-40" />
            Awaiting next prediction cycle
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/20 text-[10px] text-muted-foreground">
          <span>{sector}</span>
          <span>{livePrice ? 'live price' : 'offline'}</span>
        </div>
      </div>
    );
  }

  const isBullish = pred.direction === 'bullish';
  const isBearish = pred.direction === 'bearish';
  const isNeutral = pred.direction === 'neutral';
  const conviction = Math.round(pred.confidence * 100);
  const rawConv = pred.rawConfidence ? Math.round(pred.rawConfidence * 100) : null;
  const cells = computeCells(pred.metadata, pred.direction, pred.confidence);
  const archetypeName = ARCHETYPE_NAMES[pred.archetype] || pred.archetype;
  const archetypeStory = pred.metadata.archetype_story?.story;
  const archetypeMoral = pred.metadata.archetype_story?.moral;

  // Signal drivers
  const vixData = pred.metadata.vix;
  const vixTermStructure = pred.metadata.vix_term_structure;
  const chessConsensus = pred.metadata.chess_consensus;
  const shortVol = pred.metadata.short_volume;
  const overnightSentiment = pred.metadata.overnight_sentiment;
  const drivers: string[] = [];
  if (vixTermStructure?.regime) drivers.push(`VIX: ${vixTermStructure.regime.replace('_', ' ')}`);
  if (chessConsensus?.direction) drivers.push(`Chess: ${chessConsensus.direction}`);
  if (shortVol?.shortPct > 0.5) drivers.push(`Short: ${(shortVol.shortPct * 100).toFixed(0)}%`);
  if (overnightSentiment?.us_direction && overnightSentiment.us_direction !== 'neutral')
    drivers.push(`Overnight: ${overnightSentiment.us_direction}`);

  const ageMin = Math.round((Date.now() - new Date(pred.createdAt).getTime()) / 60000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="font-bold text-lg leading-tight">{symbol}</div>
            <div className="text-xs text-muted-foreground">{name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 font-bold ${isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-muted-foreground'}`}>
            {isBullish && <TrendingUp className="w-4 h-4" />}
            {isBearish && <TrendingDown className="w-4 h-4" />}
            {isNeutral && <Minus className="w-4 h-4" />}
            <span>{isBullish ? 'CALL' : isBearish ? 'PUT' : 'FLAT'}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {conviction}/100{rawConv && rawConv !== conviction ? ` (raw ${rawConv})` : ''}
          </div>
        </div>
      </div>

      {/* 8×8 Universal Grid */}
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          UNIVERSAL GRID — 8 SIGNAL DIMENSIONS
        </div>
        <div className="grid grid-cols-8 gap-1">
          {cells.map((cell, i) => {
            const col = SIGNAL_COLS[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="aspect-square w-full rounded-sm transition-all duration-500"
                  style={getCellStyle(cell, col.hue)}
                  title={`${col.label}: ${col.desc}`}
                />
                <span className="text-[8px] text-muted-foreground font-mono">{col.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
          <span>■ Black = Buy</span>
          <span>□ White = Sell</span>
        </div>
      </div>

      {/* Archetype + Story */}
      <div className="px-4 pb-3">
        <div className="text-xs font-semibold text-primary/80 mb-1">{archetypeName}</div>
        {archetypeStory && (
          <div className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
            {archetypeStory}
          </div>
        )}
        {archetypeMoral && (
          <div className="text-xs text-muted-foreground/70 italic mt-1 line-clamp-1">
            {archetypeMoral}
          </div>
        )}
      </div>

      {/* Signal Drivers */}
      {drivers.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {drivers.map((d, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/70 border border-primary/20">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20 text-[10px] text-muted-foreground">
        <span>{sector}</span>
        <span className={`flex items-center gap-1 ${isStale ? 'text-amber-500/70' : ''}`}>
          {isStale && <AlertCircle className="w-3 h-3" />}
          <Clock className="w-3 h-3" />
          {ageLabel}
          {isStale && ' · stale'}
        </span>
      </div>
    </motion.div>
  );
};

export default SignalCard;
