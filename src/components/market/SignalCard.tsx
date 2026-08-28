/**
 * SignalCard — Live En Pensent market signal card
 *
 * ALWAYS shows a full gamecard — never an empty/awaiting state.
 *
 * Two data sources, priority order:
 *   1. DB prediction (full v38 pipeline: chess consensus, VIX, short volume, etc.)
 *   2. Real-time TA from Yahoo Finance candles (computed in-browser)
 *
 * Both paths produce the same full card: direction, conviction, 8×8 grid,
 * archetype, drivers, and footer with staleness indicator.
 *
 * BLACK = BUY (bullish) | WHITE = SELL (bearish) — universal chess-market invariant.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Activity, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeConfidence, normalizeDirection } from '@/lib/trading/signalNormalization';

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
  source: 'db' | 'ta';
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
  ta_momentum_bull: 'TA: Momentum Bull',
  ta_momentum_bear: 'TA: Momentum Bear',
  ta_mean_revert_bull: 'TA: Mean Revert Bull',
  ta_mean_revert_bear: 'TA: Mean Revert Bear',
  ta_compression_bull: 'TA: Compression Breakout ↑',
  ta_compression_bear: 'TA: Compression Breakdown ↓',
  ta_choppy: 'TA: Choppy / Range-Bound',
};

// ── Candle data fetcher (from Supabase cache, updated by worker) ──────────────
// Yahoo Finance blocks Vercel/cloud IPs with 429. The worker runs locally and
// caches candle data to market_candle_cache in Supabase. The frontend reads
// from there — no direct Yahoo calls from the browser.
//
// v38 24/7: The worker now stores BOTH intraday (5m) and daily (1d) candles.
// We fetch intraday first for real-time TA (includes pre/post/overnight),
// then fall back to daily if intraday is unavailable.

interface CandleData {
  closes: number[];
  volumes: number[];
  highs: number[];
  lows: number[];
  timestamps: number[];
  interval?: string;
  sessionFlags?: string[];
  changePct?: number; // From DB — vs previous day close (correct for all intervals)
  price?: number;     // From DB — live price (may include after-hours)
}

async function fetchCandles(symbol: string): Promise<CandleData | null> {
  try {
    // v38 24/7: Try intraday (5m) first — includes pre-market, after-hours, overnight
    const { data: intradayData, error: intradayError } = await supabase
      .from('market_candle_cache')
      .select('closes, volumes, highs, lows, timestamps, price, change_pct, updated_at, interval, session_flags')
      .eq('symbol', symbol)
      .eq('interval', '5m')
      .limit(1);

    if (!intradayError && intradayData && intradayData.length > 0) {
      const row = intradayData[0];
      const closes = row.closes as number[];
      if (closes && closes.length >= 10) {
        return {
          closes,
          volumes: row.volumes as number[] || [],
          highs: row.highs as number[] || [],
          lows: row.lows as number[] || [],
          timestamps: row.timestamps as number[] || [],
          interval: '5m',
          sessionFlags: row.session_flags as string[] || [],
          changePct: row.change_pct as number | undefined,
          price: row.price as number | undefined,
        };
      }
    }

    // Fall back to daily (1d) candles
    const { data, error } = await supabase
      .from('market_candle_cache')
      .select('closes, volumes, highs, lows, timestamps, price, change_pct, updated_at, interval, session_flags')
      .eq('symbol', symbol)
      .eq('interval', '1d')
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0];
    const closes = row.closes as number[];
    if (!closes || closes.length < 10) return null;
    return {
      closes,
      volumes: row.volumes as number[] || [],
      highs: row.highs as number[] || [],
      lows: row.lows as number[] || [],
      timestamps: row.timestamps as number[] || [],
      interval: '1d',
      sessionFlags: row.session_flags as string[] || [],
      changePct: row.change_pct as number | undefined,
      price: row.price as number | undefined,
    };
  } catch {
    return null;
  }
}

// ── TA-based signal computation ───────────────────────────────────────────────
// Computes direction, conviction, archetype, and synthetic metadata from candles.
// This is the fallback when no DB prediction exists — ensures every card always
// shows a full gamecard.

interface TASignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  archetype: string;
  price: number;
  changePct: number;
  metadata: any;
}

function computeTASignal(candles: CandleData): TASignal {
  const { closes, volumes, highs, lows, changePct: dbChangePct, price: dbPrice } = candles;
  const n = closes.length;
  // v38 FIX: Use DB price (includes after-hours/live) and DB changePct (vs prev day close)
  // instead of computing from consecutive bars which is wrong for 5m intraday data
  const price = dbPrice || closes[n - 1];
  const changePct = dbChangePct != null ? dbChangePct : (() => {
    const prevClose = closes[n - 2] || closes[n - 3] || price;
    return ((price - prevClose) / prevClose) * 100;
  })();

  // SMA20 and SMA50
  const sma = (arr: number[], period: number) => {
    if (arr.length < period) return arr[arr.length - 1];
    let sum = 0;
    for (let i = arr.length - period; i < arr.length; i++) sum += arr[i];
    return sum / period;
  };
  const sma20 = sma(closes, Math.min(20, n));
  const sma50 = sma(closes, Math.min(50, n));

  // RSI(14)
  let gains = 0, losses = 0;
  const rsiPeriod = Math.min(14, n - 1);
  for (let i = n - rsiPeriod; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / rsiPeriod;
  const avgLoss = losses / rsiPeriod;
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  const rsi = 100 - 100 / (1 + rs);

  // Bollinger Band width (20-period)
  const bbPeriod = Math.min(20, n);
  const bbSlice = closes.slice(n - bbPeriod);
  const bbMean = bbSlice.reduce((a, b) => a + b, 0) / bbPeriod;
  const bbStd = Math.sqrt(bbSlice.reduce((a, b) => a + (b - bbMean) ** 2, 0) / bbPeriod);
  const bbWidth = bbStd / bbMean;

  // Volume flow (last 5 days: up days vs down days)
  const volPeriod = Math.min(5, n - 1);
  let upVol = 0, downVol = 0;
  for (let i = n - volPeriod; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) upVol += volumes[i] || 0;
    else downVol += volumes[i] || 0;
  }
  const totalVol = upVol + downVol;
  const buyPct = totalVol > 0 ? upVol / totalVol : 0.5;

  // 5-day momentum
  const mom5 = n > 5 ? ((price - closes[n - 6]) / closes[n - 6]) * 100 : 0;

  // 20-day volatility
  const returns20: number[] = [];
  for (let i = Math.max(1, n - 20); i < n; i++) {
    returns20.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const vol20 = returns20.length > 0
    ? Math.sqrt(returns20.reduce((a, b) => a + b * b, 0) / returns20.length) * Math.sqrt(252)
    : 0.2;

  // ── Direction logic ──────────────────────────────────────────────────────────
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let conviction = 0.3;
  let archetype = 'ta_choppy';

  const aboveSMA20 = price > sma20;
  const aboveSMA50 = price > sma50;
  const smaBullCross = sma20 > sma50;
  const rsiOversold = rsi < 30;
  const rsiOverbought = rsi > 70;

  // Compression (low BB width) → breakout pending
  const isCompressed = bbWidth < 0.03;

  // Strong momentum: price above both SMAs, SMA cross bullish, positive 5d momentum
  if (aboveSMA20 && aboveSMA50 && smaBullCross && mom5 > 0.5) {
    direction = 'bullish';
    archetype = 'ta_momentum_bull';
    conviction = Math.min(0.85, 0.45 + Math.abs(mom5) / 20 + (rsi < 65 ? 0.1 : 0));
  } else if (!aboveSMA20 && !aboveSMA50 && !smaBullCross && mom5 < -0.5) {
    direction = 'bearish';
    archetype = 'ta_momentum_bear';
    conviction = Math.min(0.85, 0.45 + Math.abs(mom5) / 20 + (rsi > 35 ? 0.1 : 0));
  } else if (rsiOversold && aboveSMA50) {
    // Oversold in uptrend → mean reversion bounce
    direction = 'bullish';
    archetype = 'ta_mean_revert_bull';
    conviction = Math.min(0.75, 0.4 + (30 - rsi) / 60);
  } else if (rsiOverbought && !aboveSMA50) {
    // Overbought in downtrend → mean reversion fade
    direction = 'bearish';
    archetype = 'ta_mean_revert_bear';
    conviction = Math.min(0.75, 0.4 + (rsi - 70) / 60);
  } else if (isCompressed && aboveSMA20) {
    direction = 'bullish';
    archetype = 'ta_compression_bull';
    conviction = 0.4;
  } else if (isCompressed && !aboveSMA20) {
    direction = 'bearish';
    archetype = 'ta_compression_bear';
    conviction = 0.4;
  } else if (Math.abs(changePct) > 1.5) {
    // Strong daily move
    direction = changePct > 0 ? 'bullish' : 'bearish';
    archetype = changePct > 0 ? 'ta_momentum_bull' : 'ta_momentum_bear';
    conviction = Math.min(0.7, 0.35 + Math.abs(changePct) / 10);
  } else {
    // Range-bound / choppy
    direction = buyPct > 0.55 ? 'bullish' : buyPct < 0.45 ? 'bearish' : 'neutral';
    archetype = 'ta_choppy';
    conviction = Math.max(0.2, Math.abs(buyPct - 0.5) * 1.2);
  }

  // ── Synthetic metadata for computeCells() ────────────────────────────────────
  // Build a metadata object that looks like the DB prediction metadata so the
  // 8×8 grid renders with real TA-derived values.
  const metadata = {
    volume_flow: {
      buy_pct: buyPct,
      stale: false,
    },
    vera_rubin: {
      // Dark force: high volatility + declining price = bearish dark force
      score: vol20 > 0.3 && mom5 < 0 ? 0.7 : vol20 > 0.3 && mom5 > 0 ? 0.3 : 0.5,
    },
    chess_consensus: {
      // No chess data in TA mode — use price momentum as proxy
      blackPct: direction === 'bullish' ? 60 : direction === 'bearish' ? 40 : 50,
      direction,
    },
    vix: {
      // Approximate VIX level from instrument volatility
      level: vol20 > 0.35 ? 'high' : vol20 < 0.15 ? 'low' : 'neutral',
    },
    short_volume: {
      // No short volume data in TA mode — neutral
      shortPct: 0.4,
    },
    confidence_calibration: null,
    archetype_story: {
      story: getTAStory(archetype, changePct, mom5, rsi),
      moral: getTAMoral(archetype),
    },
    parable: {
      strength: conviction,
      direction,
      agrees: conviction > 0.5,
    },
  };

  return { direction, confidence: conviction, archetype, price, changePct, metadata };
}

function getTAStory(archetype: string, changePct: number, mom5: number, rsi: number): string {
  if (archetype.includes('momentum_bull')) {
    return `Price holds above key moving averages with ${mom5.toFixed(1)}% 5-day momentum. The trend is your friend — until it isn't.`;
  }
  if (archetype.includes('momentum_bear')) {
    return `Price below both SMAs with ${mom5.toFixed(1)}% 5-day decline. The bears are in control of the board.`;
  }
  if (archetype.includes('mean_revert_bull')) {
    return `RSI at ${rsi.toFixed(0)} signals oversold in an uptrend. The position springs back like a compressed coil.`;
  }
  if (archetype.includes('mean_revert_bear')) {
    return `RSI at ${rsi.toFixed(0)} signals overbought in a downtrend. The rally fades as the bigger trend reasserts.`;
  }
  if (archetype.includes('compression')) {
    return `Bollinger Bands are tight — energy is building for a directional breakout. The queen is poised to strike.`;
  }
  return `Price is range-bound with no clear edge. Sometimes the best move is to wait for a better position.`;
}

function getTAMoral(archetype: string): string {
  if (archetype.includes('momentum')) return 'Momentum is a fickle ally — ride it, but watch for the turn.';
  if (archetype.includes('mean_revert')) return 'Rubber bands snap back — but only if the anchor holds.';
  if (archetype.includes('compression')) return 'Stillness precedes the storm.';
  return 'Patience is a position too.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SignalCard: React.FC<SignalCardProps> = ({ symbol, name, sector, emoji }) => {
  const [pred, setPred] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    // Fetch DB prediction and live candles in parallel
    const dbPromise = supabase
      .from('market_signals_public')
      .select('symbol, predicted_direction, confidence, archetype, price_at_prediction, created_at, prediction_metadata')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1);

    const candlePromise = fetchCandles(symbol);

    const [dbResult, candles] = await Promise.all([dbPromise, candlePromise]);

    if (!mountedRef.current) return;

    const dbData = dbResult.data?.[0];

    // Decision priority:
    //   1. DB prediction (any age — staleness badge shows how old it is)
    //   2. Real-time TA from Yahoo Finance candles (via serverless proxy)
    //   3. Neutral fallback (only if both fail — extremely rare)
    if (dbData) {
      const meta = dbData.prediction_metadata || {};
      // normalizeDirection also maps the legacy replay encoding ('up'/'down'),
      // which previously rendered as FLAT on the public signals page.
      const direction = normalizeDirection(dbData.predicted_direction);
      const confidence = normalizeConfidence(dbData.confidence);
      const calib = meta.confidence_calibration;
      const rawConf = calib?.raw_confidence ? calib.raw_confidence / 100 : undefined;

      // If we also have live candles, update the price to current
      const livePrice = candles?.closes?.[candles.closes.length - 1];
      const liveChange = candles && candles.closes.length >= 2
        ? ((candles.closes[candles.closes.length - 1] - candles.closes[candles.closes.length - 2]) /
           candles.closes[candles.closes.length - 2]) * 100
        : null;

      setPred({
        direction,
        confidence,
        rawConfidence: rawConf,
        archetype: dbData.archetype || 'choppy',
        price: livePrice || dbData.price_at_prediction || 0,
        createdAt: dbData.created_at,
        metadata: meta,
        source: 'db',
      });
    } else if (candles) {
      // No DB prediction — compute TA signal from live Yahoo Finance candles
      const ta = computeTASignal(candles);
      setPred({
        direction: ta.direction,
        confidence: ta.confidence,
        archetype: ta.archetype,
        price: ta.price,
        createdAt: new Date().toISOString(),
        metadata: ta.metadata,
        source: 'ta',
      });
    } else {
      // Both failed — neutral fallback (extremely rare, only if Yahoo is down)
      setPred({
        direction: 'neutral',
        confidence: 0.2,
        archetype: 'ta_choppy',
        price: 0,
        createdAt: new Date().toISOString(),
        metadata: {
          volume_flow: { buy_pct: 0.5, stale: true },
          vera_rubin: { score: 0.5 },
          chess_consensus: { blackPct: 50, direction: 'neutral' },
          vix: { level: 'neutral' },
          short_volume: { shortPct: 0.4 },
          archetype_story: {
            story: 'Live data temporarily unavailable. The board is in flux.',
            moral: 'When the fog lifts, the path will appear.',
          },
          parable: { strength: 0.3, direction: 'neutral', agrees: false },
        },
        source: 'ta',
      });
    }

    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 animate-pulse">
        <div className="h-32 bg-muted/20 rounded" />
      </div>
    );
  }

  if (!pred) return null;

  // Compute staleness
  const ageHours = (Date.now() - new Date(pred.createdAt).getTime()) / 3600000;
  const isStale = pred.source === 'db' && ageHours > 4;
  const ageLabel = pred.source === 'ta'
    ? 'live TA'
    : ageHours < 1 ? 'just now' : ageHours < 24 ? `${Math.floor(ageHours)}h ago` : `${Math.floor(ageHours / 24)}d ago`;

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
  const vixTermStructure = pred.metadata.vix_term_structure;
  const chessConsensus = pred.metadata.chess_consensus;
  const shortVol = pred.metadata.short_volume;
  const overnightSentiment = pred.metadata.overnight_sentiment;
  const drivers: string[] = [];
  if (vixTermStructure?.regime) drivers.push(`VIX: ${vixTermStructure.regime.replace('_', ' ')}`);
  if (chessConsensus?.direction && chessConsensus.direction !== 'neutral')
    drivers.push(`Chess: ${chessConsensus.direction}`);
  if (shortVol?.shortPct > 0.5) drivers.push(`Short: ${(shortVol.shortPct * 100).toFixed(0)}%`);
  if (overnightSentiment?.us_direction && overnightSentiment.us_direction !== 'neutral')
    drivers.push(`Overnight: ${overnightSentiment.us_direction}`);
  // For TA mode, show the TA-derived drivers
  if (pred.source === 'ta') {
    const volLevel = pred.metadata.vix?.level;
    if (volLevel && volLevel !== 'neutral') drivers.push(`Vol: ${volLevel}`);
    const buyPct = pred.metadata.volume_flow?.buy_pct;
    if (buyPct != null && Math.abs(buyPct - 0.5) > 0.1) {
      drivers.push(`Flow: ${buyPct > 0.5 ? 'buy' : 'sell'} ${Math.abs((buyPct - 0.5) * 100).toFixed(0)}%`);
    }
  }

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

      {/* Price + Source badge */}
      {pred.price > 0 && (
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="text-sm font-semibold">${pred.price.toFixed(2)}</span>
          <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full ${
            pred.source === 'db'
              ? 'bg-primary/10 text-primary/70 border border-primary/20'
              : 'bg-amber-500/10 text-amber-500/70 border border-amber-500/20'
          }`}>
            {pred.source === 'db' ? <Activity className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
            {pred.source === 'db' ? 'v38 pipeline' : 'live TA'}
          </span>
        </div>
      )}

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
