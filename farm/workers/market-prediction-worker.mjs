#!/usr/bin/env node
/**
 * Market Prediction Worker v1.0
 * 
 * Generates tracked market predictions using REAL Yahoo Finance data.
 * Saves to prediction_outcomes, resolves with real exit prices.
 * Also fetches historical data for pattern correlation.
 * 
 * NO IBKR required. NO simulated data. ALL real prices.
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import {
  computeFeatures,
  populateMarketGrid,
  processMarketThroughGrid,
  classifyMarketArchetype,
  predictFromMarketSignature,
  learnMarketArchetypeWeights,
  setMarketCorrelation,
  detectTacticalPatterns,
  getTacticalDirectionOverride,
  computePieceTierProfile,
} from './domain-adapters/market-adapter.mjs';
import {
  computeTradeSizing,
  CircuitBreaker,
  EdgeDecayMonitor,
  BROKER_PROFILES,
} from './risk-management.mjs';
import {
  computeCulturalHarmony,
  aggregateCulturalSignals,
} from './cultural-harmony-signal.mjs';
import {
  fetchOptionsData,
  calculateLeverageMetrics,
  OPTIONS_SYMBOLS,
} from './options-data-fetcher.mjs';
import {
  createChessMarketBoard,
} from './domain-adapters/chess-market-board.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_KEY) { console.error('[MarketPred] No Supabase key'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Direct SQL pool for operations that need to bypass RLS (alerts, correlations)
const sqlPool = process.env.DATABASE_URL ? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;
if (sqlPool) sqlPool.on('error', (err) => console.error(`[MARKET-POOL] ${err.message}`));

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const STOCK_SYMBOLS = ['AMD', 'AMZN', 'MSFT', 'NVDA', 'AAPL', 'GOOGL', 'META', 'SPY', 'QQQ']; // v12.1: Restored all for sector learning — confidence dampened, not blocked
// Real economies, real currencies, real physical goods
const FOREX_SYMBOLS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCAD=X', 'AUDUSD=X', 'USDCHF=X', 'NZDUSD=X', 'EURGBP=X'];
const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F']; // Gold, Silver, Oil, NatGas, Copper
const INDEX_SYMBOLS = ['^FTSE', '^GDAXI']; // European
// v10: International market expansion — global pattern learning
const INTL_INDEX_SYMBOLS = {
  asia_pacific: ['^AXJO', '000001.SS'],     // ASX 200 (Sydney), Shanghai Composite
  middle_east: ['^TASI.SR'],                // Tadawul All Share (Saudi)
  canada: ['^GSPTSE'],                      // S&P/TSX Composite (Toronto)
};
const BOND_SYMBOLS = []; // Removed — no demonstrated edge
const CRYPTO_SYMBOLS = []; // Removed from conventional prediction — 24-26% accuracy
// Cultural harmony experiment: crypto + volatile stocks predicted via chess archetype → musical patterns
const HARMONY_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD']; // Dead weight via conventional → try abstract harmony
// Options symbols (non-disruptive addition)
const OPTIONS_UNIVERSE = [...OPTIONS_SYMBOLS.stocks, ...OPTIONS_SYMBOLS.etfs]; // MSFT, AMD, AMZN, NVDA + currency ETFs
const ALL_INTL = [...INTL_INDEX_SYMBOLS.asia_pacific, ...INTL_INDEX_SYMBOLS.middle_east, ...INTL_INDEX_SYMBOLS.canada];
const ALL_SYMBOLS = [...STOCK_SYMBOLS, ...FOREX_SYMBOLS, ...COMMODITY_SYMBOLS, ...INDEX_SYMBOLS, ...ALL_INTL, ...HARMONY_SYMBOLS, ...OPTIONS_UNIVERSE];
const PREDICTION_INTERVAL_MS = 2 * 60 * 1000;   // New predictions every 2 min (was 5 — need volume for strategy testing)
const RESOLUTION_INTERVAL_MS = 60 * 1000;        // Check resolutions every 60s
const MIN_MOVE = 0.0001;

// ─── v12.1: SECTOR CLASSIFICATION ─────────────────────────────────────────────
// Each sector = a chess "game mode". Different sectors have different temporal rhythms,
// different "pieces" (parties of interest), and different archetypal behaviors.
// Sector → Chess Game Mode mapping:
//   tech = bullet (fast, volatile, momentum-driven — like speed chess)
//   commodities = classical (slow, fundamental, macro-driven — deep positional play)
//   forex = blitz (24h, reactive to news — fast intuition required)
//   crypto = puzzle (pattern recognition, 24/7, no fundamentals — pure pattern)
//   indices = rapid (balanced calculation — market-wide structural moves)
//   energy = rapid (physical supply/demand cycles — methodical)
const SECTOR_MAP = {
  // Tech (bullet — fast pattern recognition)
  'AMD': 'tech', 'NVDA': 'tech', 'MSFT': 'tech', 'GOOGL': 'tech', 'META': 'tech', 'AAPL': 'tech', 'AMZN': 'tech',
  // Indices (rapid — structural)
  'SPY': 'indices', 'QQQ': 'indices', '^FTSE': 'indices', '^GDAXI': 'indices',
  '^AXJO': 'indices', '000001.SS': 'indices', '^TASI.SR': 'indices', '^GSPTSE': 'indices',
  // Forex (blitz — fast intuition)
  'EURUSD=X': 'forex', 'GBPUSD=X': 'forex', 'USDJPY=X': 'forex', 'USDCAD=X': 'forex',
  'AUDUSD=X': 'forex', 'USDCHF=X': 'forex', 'NZDUSD=X': 'forex', 'EURGBP=X': 'forex',
  // Commodities (classical — deep positional)
  'GC=F': 'commodities', 'SI=F': 'commodities', 'CL=F': 'energy', 'NG=F': 'energy', 'HG=F': 'commodities',
  // Crypto (puzzle — pure pattern)
  'BTC-USD': 'crypto', 'ETH-USD': 'crypto', 'SOL-USD': 'crypto',
};
const SECTOR_CHESS_MODE = {
  tech: 'bullet',
  commodities: 'classical',
  forex: 'blitz',
  crypto: 'puzzle',
  indices: 'rapid',
  energy: 'rapid',
};
function getSector(symbol) { return SECTOR_MAP[symbol] || 'unknown'; }
function getChessMode(symbol) { return SECTOR_CHESS_MODE[getSector(symbol)] || 'blitz'; }

// ─── MULTI-TIMEFRAME CONFIG ──────────────────────────────────────────────────
// Each timeframe feeds different candle granularity through the SAME universal grid portal.
// Different candle intervals → different grid signatures → different archetypes.
// Like chess time windows (recent/mid/historical), each timeframe may reveal different edges.
const TIMEFRAMES = [
  // v11: Added 1h and 4h for more scalp-friendly resolution windows
  // More timeframes = more data points per cycle = faster strategy learning
  { label: 'scalp_1h',candleInterval: '5m',  candleRange: '2d',  resolutionMs: 1 * 60 * 60 * 1000, timeHorizon: '1h', minCandles: 10 },
  { label: 'medium',  candleInterval: '15m', candleRange: '5d',  resolutionMs: 2 * 60 * 60 * 1000, timeHorizon: '2h', minCandles: 10 },
  { label: 'mid_4h',  candleInterval: '30m', candleRange: '10d', resolutionMs: 4 * 60 * 60 * 1000, timeHorizon: '4h', minCandles: 10 },
  { label: 'swing',   candleInterval: '1h',  candleRange: '1mo', resolutionMs: 8 * 60 * 60 * 1000, timeHorizon: '8h', minCandles: 10 },
  { label: 'daily',   candleInterval: '1d',  candleRange: '3mo', resolutionMs: 24 * 60 * 60 * 1000, timeHorizon: '1d', minCandles: 10 },
];
// Legacy compat
const HORIZONS_MS = TIMEFRAMES.map(t => t.resolutionMs);
const WORKER_ID = `market-pred-${Date.now().toString(36)}`;

let cycleCount = 0;
let totalPredictions = 0;
let totalResolved = 0;
let totalCorrect = 0;
let auditTrailTotal = 0;
let auditTrailResolved = 0;
let auditTrailCorrect = 0;

// Edge monitor state
let edgeMonitorLastRun = 0;
const EDGE_MONITOR_INTERVAL = 50; // Run every 50 resolution cycles (~50 min)
const EDGE_SIGNIFICANCE_THRESHOLD = 0.05; // p < 0.05 for statistical significance
const EDGE_MIN_SAMPLES = 50; // Need 50+ resolved predictions per symbol
const EDGE_MIN_ACCURACY = 0.55; // 55%+ directional accuracy = potential edge
const CATASTROPHE_ACCURACY = 0.15; // Below 15% = auto-exclude immediately
const CATASTROPHE_MIN_SAMPLES = 20; // Need 20+ to auto-exclude

// Self-learned archetype weights (refreshed from resolved predictions every 50 cycles — Pro tier)
let learnedMarketWeights = null;
let learnedWeightsRefreshedAt = 0;
const WEIGHT_REFRESH_INTERVAL = 50; // cycles (Pro tier: was 100)

// Self-learned directional thresholds per timeframe (from actual_move distribution)
// Start with hardcoded defaults, then learn optimal cutoffs from resolution data
let learnedDirThresholds = null;
let dirThresholdsRefreshedAt = 0;

// Self-learned tactical confidence calibration (per-pattern accuracy → confidence multiplier)
let learnedTacticalCalibration = null;
let tacticalCalibrationRefreshedAt = 0;

// Self-learned REVERSE SIGNAL detection per sector×symbol
// If a sector is consistently anti-predictive (<20% on directional binary),
// it's a reverse signal — flip it and you get 80%+ accuracy.
// 1% accuracy = 99% reverse signal. The system IS detecting something, just inverted.
let learnedReverseSignals = null;
let reverseSignalsRefreshedAt = 0;

// ─── DISK PERSISTENCE FOR SELF-LEARNING ─────────────────────────────────────
// Mirror chess worker pattern: persist learned data so restarts don't lose it
const LEARN_DATA_DIR = join(__dirname, '../data');
const WEIGHTS_FILE = join(LEARN_DATA_DIR, 'market-archetype-weights.json');
const THRESHOLDS_FILE = join(LEARN_DATA_DIR, 'market-dir-thresholds.json');
const TACTICAL_FILE = join(LEARN_DATA_DIR, 'market-tactical-calibration.json');
const REVERSE_FILE = join(LEARN_DATA_DIR, 'market-reverse-signals.json');

function persistToFile(filePath, data) {
  try {
    mkdirSync(LEARN_DATA_DIR, { recursive: true });
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) { /* non-critical */ }
}

function loadFromFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) { return null; }
}

// Load persisted self-learning data on startup
try {
  const diskWeights = loadFromFile(WEIGHTS_FILE);
  if (diskWeights && Object.keys(diskWeights).length > 0) {
    learnedMarketWeights = diskWeights;
    log(`Loaded ${Object.keys(diskWeights).length} market archetype weights from disk`);
  }
  const diskThresholds = loadFromFile(THRESHOLDS_FILE);
  if (diskThresholds && Object.keys(diskThresholds).length > 0) {
    learnedDirThresholds = diskThresholds;
    log(`Loaded ${Object.keys(diskThresholds).length} directional thresholds from disk`);
  }
  const diskTactical = loadFromFile(TACTICAL_FILE);
  if (diskTactical && Object.keys(diskTactical).length > 0) {
    learnedTacticalCalibration = diskTactical;
    log(`Loaded ${Object.keys(diskTactical).length} tactical calibrations from disk`);
  }
  const diskReverse = loadFromFile(REVERSE_FILE);
  if (diskReverse && Object.keys(diskReverse).length > 0) {
    learnedReverseSignals = diskReverse;
    const flipped = Object.entries(diskReverse).filter(([, v]) => v.shouldFlip).map(([k]) => k);
    log(`Loaded ${Object.keys(diskReverse).length} reverse signal entries (${flipped.length} active flips: ${flipped.join(', ')})`);
  }
} catch (e) { /* first run, no files yet */ }

// Per-symbol accuracy cache for selective prediction
let symbolAccuracyCache = new Map();

// ─── RISK MANAGEMENT ──────────────────────────────────────────────────────
// These track portfolio state for when edge is confirmed and real capital deployed.
// Until then, they run in shadow mode — logging what WOULD happen.
const circuitBreaker = new CircuitBreaker();
const edgeDecayMonitor = new EdgeDecayMonitor();
let shadowBankroll = 100; // Paper bankroll for shadow sizing ($100 start)

// Chess resonance cache (refreshed every 30 min)
let chessResonanceCache = null;
let chessResonanceFetchedAt = 0;
const CHESS_CACHE_TTL = 30 * 60 * 1000;

function log(msg, level = 'info') {
  const ts = new Date().toISOString();
  const pfx = `[${ts}] [market-prediction]`;
  if (level === 'error') console.error(`${pfx} ❌ ${msg}`);
  else if (level === 'warn') console.warn(`${pfx} ⚠️  ${msg}`);
  else console.log(`${pfx} ${level === 'trade' ? '📈' : 'ℹ️'} ${msg}`);
}

// ─── YAHOO FINANCE ───────────────────────────────────────────────────────────
async function fetchPrice(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.chart?.result?.[0];
    if (!r) return null;
    const price = r.meta?.regularMarketPrice;
    const prevClose = r.meta?.previousClose || r.meta?.chartPreviousClose;
    if (!price || price <= 0) return null;
    const closes = r.indicators?.quote?.[0]?.close?.filter(c => c != null) || [];
    return {
      symbol, price, prevClose: prevClose || price,
      volume: r.meta?.regularMarketVolume || 0,
      intradayPrices: closes.slice(-30),
      change: prevClose ? (price - prevClose) / prevClose : 0,
    };
  } catch (err) {
    log(`Yahoo error ${symbol}: ${err.message}`, 'warn');
    return null;
  }
}

/**
 * Fetch intraday OHLCV candles from Yahoo Finance for universal grid processing.
 * Returns proper candle objects: { open, high, low, close, volume, timestamp }
 */
async function fetchIntradayCandles(symbol, interval = '5m', range = '1d') {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.chart?.result?.[0];
    if (!r) return null;
    
    const quotes = r.indicators?.quote?.[0];
    const timestamps = r.timestamp || [];
    if (!quotes || timestamps.length === 0) return null;
    
    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quotes.open?.[i];
      const h = quotes.high?.[i];
      const l = quotes.low?.[i];
      const c = quotes.close?.[i];
      const v = quotes.volume?.[i];
      if (o != null && h != null && l != null && c != null) {
        candles.push({ open: o, high: h, low: l, close: c, volume: v || 0, timestamp: timestamps[i] });
      }
    }
    return candles.length >= 5 ? candles : null;
  } catch (err) {
    return null;
  }
}

async function fetchHistorical(symbol, range = '6mo', interval = '1d') {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.chart?.result?.[0];
    if (!r) return null;
    const closes = r.indicators?.quote?.[0]?.close?.filter(c => c != null) || [];
    const timestamps = r.timestamp || [];
    return { symbol, closes, timestamps, range, interval };
  } catch (err) {
    return null;
  }
}

// ─── PAWN PRESSURE: VIX + FINRA SHORT VOLUME ────────────────────────────────
// VIX = market fear gauge (♚ King safety proxy)
// FINRA short volume = bearish retail/institutional pressure (♙ Pawn pressure)
let vixCache = { value: null, timestamp: 0 };
let shortVolumeCache = new Map(); // symbol → { shortVol, totalVol, shortPct, date }
const VIX_REFRESH_MS = 5 * 60 * 1000; // Refresh VIX every 5 min
const SHORT_VOL_REFRESH_MS = 60 * 60 * 1000; // Refresh short volume every hour

async function fetchVIX() {
  if (Date.now() - vixCache.timestamp < VIX_REFRESH_MS && vixCache.value != null) return vixCache.value;
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d');
    if (!res.ok) return vixCache.value;
    const data = await res.json();
    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(c => c != null) || [];
    if (closes.length > 0) {
      const current = closes[closes.length - 1];
      const prev = closes.length > 1 ? closes[closes.length - 2] : current;
      vixCache = {
        value: { current, prev, change: (current - prev) / prev, level: current > 25 ? 'fear' : current < 15 ? 'greed' : 'neutral' },
        timestamp: Date.now()
      };
      return vixCache.value;
    }
  } catch(e) { /* silent */ }
  return vixCache.value;
}

async function fetchFINRAShortVolume() {
  if (Date.now() - (shortVolumeCache._timestamp || 0) < SHORT_VOL_REFRESH_MS && shortVolumeCache.size > 1) return shortVolumeCache;
  try {
    // Try today first, then yesterday, then day before
    for (let daysBack = 0; daysBack <= 2; daysBack++) {
      const d = new Date(Date.now() - daysBack * 86400000);
      const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
      const res = await fetch(`https://cdn.finra.org/equity/regsho/daily/CNMSshvol${dateStr}.txt`);
      if (!res.ok) continue;
      const text = await res.text();
      const lines = text.split('\n');
      if (lines.length < 100) continue; // Too few records, probably not valid
      
      const stockSymbols = STOCK_SYMBOLS;
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length < 5) continue;
        const sym = parts[1];
        if (stockSymbols.includes(sym)) {
          const shortVol = parseInt(parts[2]) || 0;
          const totalVol = parseInt(parts[4]) || 0;
          const shortPct = totalVol > 0 ? shortVol / totalVol : 0;
          shortVolumeCache.set(sym, {
            shortVol, totalVol, shortPct,
            date: parts[0],
            signal: shortPct > 0.60 ? 'heavy_short' : shortPct > 0.50 ? 'moderate_short' : 'low_short'
          });
        }
      }
      shortVolumeCache._timestamp = Date.now();
      log(`FINRA short volume loaded: ${shortVolumeCache.size - 1} stocks from ${dateStr}`);
      break;
    }
  } catch(e) { /* silent */ }
  return shortVolumeCache;
}

// ─── CULTURAL HARMONY: Chess Archetype → Musical Pattern → Abstract Signal ───
// For symbols where conventional analysis fails (crypto at 25%), use the abstract
// musical/cultural resonance of live chess archetypes as the prediction signal.
let harmonyCache = { signal: null, timestamp: 0 };
const HARMONY_CACHE_TTL = 10 * 60 * 1000; // 10 min

async function fetchChessArchetypeStats() {
  if (!sqlPool) return null;
  try {
    const { rows } = await sqlPool.query(`
      SELECT hybrid_archetype as archetype, COUNT(*) as count,
             COUNT(CASE WHEN hybrid_correct THEN 1 END)::float / NULLIF(COUNT(*), 0) as accuracy
      FROM chess_prediction_attempts 
      WHERE created_at > NOW() - INTERVAL '2 hours'
      AND hybrid_archetype IS NOT NULL
      GROUP BY hybrid_archetype HAVING COUNT(*) >= 5
      ORDER BY COUNT(*) DESC
    `);
    return rows.map(r => ({
      archetype: r.archetype,
      count: parseInt(r.count),
      accuracy: parseFloat(r.accuracy) || 0.5,
      temporalFlow: null, // Could enrich later from 8Q profile data
    }));
  } catch (e) {
    return null;
  }
}

async function getHarmonySignal(symbol, priceData) {
  // Refresh archetype stats periodically
  if (Date.now() - harmonyCache.timestamp > HARMONY_CACHE_TTL || !harmonyCache.signal) {
    const stats = await fetchChessArchetypeStats();
    if (stats && stats.length > 0) {
      // Use a generic price context for the aggregate signal
      const recentPrice = priceData ? { change: priceData.change || 0, volatility: 0.02 } : { change: 0, volatility: 0.02 };
      harmonyCache.signal = aggregateCulturalSignals(stats, recentPrice);
      harmonyCache.timestamp = Date.now();
    }
  }
  
  if (!harmonyCache.signal) return null;
  
  // Adjust the aggregate signal for this specific symbol's recent price action
  const symbolPrice = priceData ? { change: priceData.change || 0, volatility: 0.03 } : null;
  
  return {
    ...harmonyCache.signal,
    symbol,
    source: 'cultural_harmony',
    description: `Chess archetype chorus → ${harmonyCache.signal.direction} (${harmonyCache.signal.dominantMood})`,
  };
}

// ─── PREDICTION ENGINE ───────────────────────────────────────────────────────
function generatePrediction(symbol, priceData, allPrices, historicalData) {
  if (!priceData || !priceData.price) return null;
  const { price, prevClose, intradayPrices, change } = priceData;
  if (!intradayPrices || intradayPrices.length < 5) return null;

  // Signal 1: Short-term momentum (last 5 candles)
  const recent5 = intradayPrices.slice(-5);
  const momentum5 = (recent5[recent5.length - 1] - recent5[0]) / recent5[0];
  const momentumDir = momentum5 > 0 ? 'up' : 'down';
  const momentumStr = Math.min(Math.abs(momentum5) * 100, 1);

  // Signal 2: Mean reversion
  const avg = intradayPrices.reduce((a, b) => a + b, 0) / intradayPrices.length;
  const deviation = (price - avg) / avg;
  const revDir = deviation > 0.001 ? 'down' : deviation < -0.001 ? 'up' : 'neutral';
  const revStr = Math.min(Math.abs(deviation) * 200, 1);

  // Signal 3: Volatility
  const returns = [];
  for (let i = 1; i < intradayPrices.length; i++) {
    returns.push((intradayPrices[i] - intradayPrices[i - 1]) / intradayPrices[i - 1]);
  }
  const vol = returns.length > 0 ? Math.sqrt(returns.reduce((a, r) => a + r * r, 0) / returns.length) : 0;
  const volPenalty = Math.min(vol * 500, 0.3);

  // Signal 4: Market correlation (SPY proxy)
  let mktDir = 'neutral', mktStr = 0;
  const spy = allPrices.get('SPY');
  if (spy && symbol !== 'SPY' && spy.intradayPrices?.length >= 5) {
    const spyR = spy.intradayPrices.slice(-5);
    const spyM = (spyR[spyR.length - 1] - spyR[0]) / spyR[0];
    mktDir = spyM > 0 ? 'up' : 'down';
    mktStr = Math.min(Math.abs(spyM) * 80, 0.5);
  }

  // Signal 5: Daily trend
  const dailyDir = change > 0.002 ? 'up' : change < -0.002 ? 'down' : 'neutral';
  const dailyStr = Math.min(Math.abs(change) * 50, 0.5);

  // Signal 6: Historical pattern (6-month trend)
  let histDir = 'neutral', histStr = 0;
  const hist = historicalData?.get(symbol);
  if (hist && hist.closes.length >= 20) {
    const recent20d = hist.closes.slice(-20);
    const older20d = hist.closes.slice(-40, -20);
    if (older20d.length >= 10) {
      const recentAvg = recent20d.reduce((a, b) => a + b, 0) / recent20d.length;
      const olderAvg = older20d.reduce((a, b) => a + b, 0) / older20d.length;
      const trend = (recentAvg - olderAvg) / olderAvg;
      histDir = trend > 0.01 ? 'up' : trend < -0.01 ? 'down' : 'neutral';
      histStr = Math.min(Math.abs(trend) * 10, 0.5);
    }
  }

  // Weighted ensemble
  const signals = [
    { dir: momentumDir, w: 0.30, s: momentumStr },
    { dir: revDir, w: 0.20, s: revStr },
    { dir: mktDir, w: 0.15, s: mktStr },
    { dir: dailyDir, w: 0.15, s: dailyStr },
    { dir: histDir, w: 0.20, s: histStr },
  ];

  let up = 0, down = 0;
  for (const sig of signals) {
    const score = sig.w * sig.s;
    if (sig.dir === 'up') up += score;
    else if (sig.dir === 'down') down += score;
  }

  const total = up + down;
  if (total < 0.01) return null;

  // FLAT/NO-TRADE: If signals are too weak or too balanced, predict flat
  // This prevents forced directional calls when there's no real signal
  const spread = Math.abs(up - down);
  const flatThreshold = 0.02; // Minimum signal strength to make a directional call
  if (spread < flatThreshold) {
    return {
      symbol, direction: 'flat', confidence: 0.40, archetype: 'no_signal',
      entryPrice: price, predicted_magnitude: 0,
      market_conditions: { volatility: vol, momentum: momentum5, deviation, dailyChange: change, marketCorrelation: mktStr, historicalTrend: histStr },
      source: 'legacy_flat',
    };
  }

  const direction = up > down ? 'up' : 'down';
  const rawConf = Math.abs(up - down) / Math.max(total, 0.01);
  const confidence = Math.max(0.45, Math.min(0.92, 0.5 + rawConf - volPenalty));

  // Archetype classification — find dominant signal WITHOUT mutating array
  let dominantIdx = 0;
  let dominantScore = -1;
  for (let i = 0; i < signals.length; i++) {
    const score = signals[i].w * signals[i].s;
    if (score > dominantScore) { dominantScore = score; dominantIdx = i; }
  }
  const archetypes = {
    0: direction === 'up' ? 'bullish_momentum' : 'bearish_momentum',
    1: direction === 'up' ? 'oversold_bounce' : 'overbought_fade',
    2: direction === 'up' ? 'market_corr_bull' : 'market_corr_bear',
    3: direction === 'up' ? 'gap_continuation_up' : 'gap_continuation_down',
    4: direction === 'up' ? 'historical_uptrend' : 'historical_downtrend',
  };
  const archetype = archetypes[dominantIdx] || 'mixed_signal';

  return {
    symbol, direction, confidence, archetype, entryPrice: price,
    predicted_magnitude: Math.abs(up - down) * 0.01,
    market_conditions: {
      volatility: vol, momentum: momentum5, deviation,
      dailyChange: change, marketCorrelation: mktStr,
      historicalTrend: histStr,
    },
  };
}

/**
 * Generate prediction through the UNIVERSAL GRID PORTAL.
 * This is the new path — routes market data through the same architecture as chess/battery/TEP.
 * Falls back to the legacy weighted ensemble if candle data is unavailable.
 */
function generateGridPrediction(symbol, candles, priceData, symbolOptionsData = null) {
  if (!candles || candles.length < 10) return null;
  
  // Route through universal grid portal (with options flow if available)
  const result = processMarketThroughGrid(candles, 0.1, symbolOptionsData);
  if (!result) return null;
  
  const { signature, features } = result;
  const archetype = classifyMarketArchetype(signature);
  const pred = predictFromMarketSignature(signature, archetype, learnedMarketWeights);
  
  // BASELINE: simple momentum continuation (the naive comparison)
  // "Did the EP grid beat just following recent momentum?"
  const recentFeatures = features.slice(-5);
  const recentMom = recentFeatures.reduce((s, f) => s + (f.momentum_5 || 0), 0) / recentFeatures.length;
  const baselineDir = recentMom > 0.05 ? 'up' : recentMom < -0.05 ? 'down' : 'flat';
  
  // ─── TACTICAL LAYER: Chess→Market pattern detection ───────────────────
  // "The market is like an evil stockfish" — detect the tactics
  const tacticalResult = detectTacticalPatterns(features, signature);
  let finalDirection = pred.direction;
  let finalConfidence = pred.confidence;
  let tacticalOverride = null;
  
  if (tacticalResult.tactical) {
    const override = getTacticalDirectionOverride(
      tacticalResult.tactical, 
      tacticalResult.detection, 
      pred.direction
    );
    
    if (override.override) {
      // Tactical pattern OVERRIDES the base prediction
      // Like seeing the queen sac is a trap — don't take the bait
      finalDirection = override.direction;
      // Apply self-learned tactical calibration if available
      let calibratedTacticalConf = override.confidence;
      if (learnedTacticalCalibration && learnedTacticalCalibration[tacticalResult.tactical]) {
        calibratedTacticalConf *= learnedTacticalCalibration[tacticalResult.tactical].multiplier;
        calibratedTacticalConf = Math.max(0.20, Math.min(0.90, calibratedTacticalConf));
      }
      // Blend confidence: calibrated tactical conviction + base separation
      // v9.5: Removed 0.85 cap — let archetype accuracy gate confidence instead
      finalConfidence = Math.min(0.75, (calibratedTacticalConf * 0.6) + (pred.confidence * 0.4));
      tacticalOverride = {
        pattern: tacticalResult.tactical,
        baseDirection: pred.direction,
        overrideDirection: override.direction,
        reason: override.reason,
        confidence: override.confidence,
        allDetections: Object.fromEntries(
          Object.entries(tacticalResult.allDetections)
            .filter(([, v]) => v !== null)
            .map(([k, v]) => [k, v.details || true])
        ),
      };
    }
  }
  
  // FLAT/NO-TRADE: If grid scores are too balanced AND no tactical override
  // v11: raised threshold from 0.05→0.10 — data shows weak directional calls at 0% accuracy
  const scoreSpread = Math.abs((pred.scores.up || 0) - (pred.scores.down || 0));
  if (!tacticalOverride && (scoreSpread < 0.10 || pred.confidence < 0.50)) {
    return {
      symbol,
      direction: 'flat',
      confidence: 0.40,
      archetype: 'no_signal',
      entryPrice: priceData?.price || candles[candles.length - 1].close,
      predicted_magnitude: 0,
      market_conditions: {
        gridIntensity: signature.intensity,
        gridDirection: signature.direction,
        totalVisits: signature.totalVisits,
        dailyChange: priceData?.change || 0,
      },
      tacticalScan: tacticalResult.tactical ? tacticalResult.tactical : 'none',
      source: 'universal_grid_flat',
    };
  }
  
  // v9.5: MARKET OVERCONFIDENCE CORRECTION + ARCHETYPE ACCURACY GATING
  const ARCHETYPE_ACCURACY = {
    false_breakout: 0.60, bearish_momentum: 0.518, gap_continuation_up: 0.44,
    overbought_fade: 0.40, trap_queen_sac: 0.38, cultural_harmony: 0.29,
  };
  const finalArch = tacticalOverride ? tacticalResult.tactical : archetype;
  const archAccuracy = ARCHETYPE_ACCURACY[finalArch] || 0.33;
  const archMultiplier = Math.min(1.2, archAccuracy / 0.50);
  finalConfidence = Math.min(0.75, finalConfidence * archMultiplier);
  if (scoreSpread < 0.20) {
    finalConfidence *= (scoreSpread / 0.20);
  }
  
  // ─── SIGNAL B: Market-as-Chess Pattern Matching ───────────────────────
  // The en pensent grid visualization IS temporal data — classify which
  // chess tendency this market pattern resembles, then use proven chess accuracy.
  const chessBridge = classifyMarketAsChess(signature);
  // Chess archetype accuracy modulates confidence:
  // If market pattern resembles queenside_expansion (80.2% proven) → boost
  // If it resembles closed_maneuvering (70.4% proven, range-bound) → reduce
  const chessAccuracyMultiplier = chessBridge.accuracy / 0.75; // Normalized: 1.0 at 75%
  finalConfidence = Math.min(0.80, finalConfidence * Math.max(0.7, Math.min(1.3, chessAccuracyMultiplier)));

  // ─── SIGNAL C: Piece-Tier Institutional Profile ────────────────────────
  // Maps market signals to chess piece hierarchy (King=Fed, Queen=institutions, etc.)
  // When top-tier pieces coordinate (K+Q+R agree), boost confidence.
  const pieceTier = computePieceTierProfile(features, symbolOptionsData);
  if (pieceTier) {
    // Apply coordination boost (0-15% confidence increase)
    finalConfidence = Math.min(0.85, finalConfidence + pieceTier.coordinationBoost);
    // If piece-tier net direction contradicts grid direction, dampen confidence
    if (pieceTier.netDirection !== 0 && Math.sign(pieceTier.netDirection) !== (finalDirection === 'up' ? 1 : -1)) {
      finalConfidence *= 0.85; // 15% penalty for institutional disagreement
    }
  }

  return {
    symbol,
    direction: finalDirection,
    confidence: finalConfidence,
    archetype: finalArch,
    baseArchetype: archetype,
    baselineDirection: baselineDir,
    baselineConfidence: 0.50,
    entryPrice: priceData?.price || candles[candles.length - 1].close,
    predicted_magnitude: Math.abs(pred.scores.up - pred.scores.down) * 0.01,
    market_conditions: {
      volatility: pred.volatility / 100,
      momentum: signature.temporalFlow.late - signature.temporalFlow.early,
      deviation: 0,
      dailyChange: priceData?.change || 0,
      marketCorrelation: 0,
      historicalTrend: 0,
      gridIntensity: signature.intensity,
      gridDirection: signature.direction,
      totalVisits: signature.totalVisits,
    },
    tacticalOverride,
    chessBridge, // Track which chess tendency matched for self-learning
    pieceTier: pieceTier ? {
      dominantTier: pieceTier.dominantTier,
      netDirection: pieceTier.netDirection,
      kingQueenCoord: pieceTier.kingQueenCoordination,
      topTierCoord: pieceTier.topTierCoordination,
      boost: pieceTier.coordinationBoost,
    } : null,
    source: tacticalOverride ? 'universal_grid_tactical' : 'universal_grid',
  };
}

/**
 * Refresh self-learned market archetype weights from resolved predictions in DB.
 * 
 * IMPORTANT: Re-computes actual direction from raw price changes using per-sector
 * thresholds instead of trusting the DB's actual_direction column. The DB column
 * was scored with the OLD universal threshold that treated forex the same as stocks,
 * causing 90-95% of forex to be classified as "neutral" when it wasn't.
 */
async function refreshLearnedWeights() {
  try {
    // Fetch raw prices so we can recompute direction with correct sector thresholds
    const { data, error } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, archetype, predicted_direction, price_at_prediction, price_at_resolution')
      .not('resolved_at', 'is', null)
      .not('price_at_resolution', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000);
    
    if (error || !data || data.length < 50) return;
    
    // Per-sector thresholds for recomputing actual direction
    const sectorThresholds = {
      forex: 0.0005, crypto: 0.0075, commodities: 0.004,
      energy: 0.004, tech: 0.005, indices: 0.005,
    };
    
    const resolved = [];
    for (const r of data) {
      if (!r.price_at_prediction || !r.price_at_resolution) continue;
      const sector = getSector(r.symbol);
      const threshold = sectorThresholds[sector] || 0.005;
      const change = (r.price_at_resolution - r.price_at_prediction) / r.price_at_prediction;
      // Recompute actual direction with CORRECT per-sector threshold
      const actualDir = change > threshold ? 'up' : change < -threshold ? 'down' : 'flat';
      resolved.push({
        archetype: r.archetype || 'choppy',
        predictedDirection: r.predicted_direction === 'bullish' ? 'up' : r.predicted_direction === 'bearish' ? 'down' : 'flat',
        actualDirection: actualDir,
      });
    }
    
    learnedMarketWeights = learnMarketArchetypeWeights(resolved);
    learnedWeightsRefreshedAt = cycleCount;
    persistToFile(WEIGHTS_FILE, learnedMarketWeights);
    
    const archetypeCount = Object.keys(learnedMarketWeights).length;
    log(`Self-learned market weights refreshed: ${archetypeCount} archetypes from ${resolved.length} resolved (sector-aware thresholds)`);
    
    for (const [arch, w] of Object.entries(learnedMarketWeights)) {
      log(`  ${arch}: up=${(w.up*100).toFixed(0)}% down=${(w.down*100).toFixed(0)}% flat=${(w.flat*100).toFixed(0)}% (n=${w.sampleSize})`);
    }
  } catch (err) {
    log(`Weight refresh error: ${err.message}`, 'warn');
  }
}

/**
 * SELF-EVOLVING: Learn optimal directional classification thresholds per timeframe.
 * 
 * Instead of hardcoded thresholds (0.05% for 5m, 0.5% for 1d), the system learns
 * what threshold maximizes prediction accuracy for each timeframe by trying candidates
 * and picking the one where our predictions match actual outcomes most often.
 * 
 * This adapts to changing market volatility — if markets become more volatile,
 * the optimal thresholds shift automatically.
 */
async function refreshLearnedDirThresholds() {
  try {
    // Fetch symbol alongside prices so we can group by sector
    const { data, error } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, time_horizon, predicted_direction, price_at_prediction, price_at_resolution')
      .not('resolved_at', 'is', null)
      .not('price_at_resolution', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8000);
    
    if (error || !data || data.length < 100) return;
    
    // Group by timeframe (global) — the per-sector scaling is applied at resolution time
    // But we ALSO learn per-sector×timeframe for diagnostics
    const byTH = {};
    const bySectorTH = {};
    for (const r of data) {
      const th = r.time_horizon;
      if (!th || !r.price_at_prediction || !r.price_at_resolution) continue;
      const change = (r.price_at_resolution - r.price_at_prediction) / r.price_at_prediction;
      const normDir = (d) => d === 'up' || d === 'bullish' ? 'bullish' : d === 'down' || d === 'bearish' ? 'bearish' : 'neutral';
      const entry = { change, predicted: normDir(r.predicted_direction) };
      
      if (!byTH[th]) byTH[th] = [];
      byTH[th].push(entry);
      
      // Also group by sector for per-sector learning
      const sector = getSector(r.symbol);
      const sectorKey = `${sector}|${th}`;
      if (!bySectorTH[sectorKey]) bySectorTH[sectorKey] = [];
      bySectorTH[sectorKey].push(entry);
    }
    
    // Learn the BASE threshold per timeframe (stocks-calibrated)
    // The per-sector SECTOR_THRESHOLD_SCALE in resolution multiplies this base
    const candidates = [0.0002, 0.0005, 0.0008, 0.001, 0.0015, 0.002, 0.003, 0.004, 0.005, 0.008, 0.01];
    const minThreshold = { '5m': 0.0002, '30m': 0.0005, '1h': 0.001, '2h': 0.0015, '4h': 0.002, '8h': 0.003, '1d': 0.003, '1w': 0.005 };
    
    const findBestThreshold = (records, floor) => {
      let bestThreshold = floor;
      let bestScore = 0;
      for (const t of candidates) {
        if (t < floor) continue;
        let correct = 0, directional = 0;
        for (const r of records) {
          const actualDir = r.change > t ? 'bullish' : r.change < -t ? 'bearish' : 'neutral';
          if (actualDir === 'neutral') continue;
          directional++;
          if (r.predicted === actualDir) correct++;
        }
        const acc = directional > 0 ? correct / directional : 0;
        const directionalPct = directional / records.length;
        const coveragePenalty = directionalPct > 0.95 ? 0.7 : directionalPct < 0.30 ? 0.5 : 1.0;
        const score = acc * Math.min(1, directionalPct / 0.4) * coveragePenalty;
        if (score > bestScore) { bestScore = score; bestThreshold = t; }
      }
      return bestThreshold;
    };
    
    const learned = {};
    for (const [th, records] of Object.entries(byTH)) {
      if (records.length < 30) continue;
      learned[th] = findBestThreshold(records, minThreshold[th] || 0.001);
    }
    
    if (Object.keys(learned).length > 0) {
      learnedDirThresholds = learned;
      dirThresholdsRefreshedAt = cycleCount;
      persistToFile(THRESHOLDS_FILE, learnedDirThresholds);
      log(`♻️ Self-learned directional thresholds: ${Object.entries(learned).map(([k,v]) => `${k}=${(v*100).toFixed(2)}%`).join(' ')}`);
      
      // Log per-sector diagnostic — shows if sector scaling is correct
      for (const [sectorKey, records] of Object.entries(bySectorTH)) {
        if (records.length < 20) continue;
        const [sector, th] = sectorKey.split('|');
        const optimal = findBestThreshold(records, 0.0002);
        const base = learned[th] || 0.005;
        const impliedScale = base > 0 ? optimal / base : 1;
        // Only log if the optimal differs significantly from what our scaling gives
        const currentScale = ({ forex: 0.10, crypto: 1.5, commodities: 0.8, energy: 0.8 })[sector] || 1.0;
        if (Math.abs(impliedScale - currentScale) > 0.3 && records.length >= 50) {
          log(`  ⚠️ ${sector}/${th}: optimal=${(optimal*100).toFixed(3)}% implied_scale=${impliedScale.toFixed(2)} vs current_scale=${currentScale.toFixed(2)} (n=${records.length})`);
        }
      }
    }
  } catch (err) {
    log(`Dir threshold learning error: ${err.message}`, 'warn');
  }
}

/**
 * SELF-EVOLVING: Learn tactical pattern confidence calibration from resolution data.
 * 
 * Each tactical pattern (trap, castling, promotion, etc.) gets a confidence multiplier
 * based on its actual prediction accuracy. Patterns that work get boosted; patterns
 * that don't get dampened. This prevents bad tactical detectors from hurting accuracy.
 * 
 * The calibration is a simple Bayesian update:
 *   multiplier = (pattern_accuracy / baseline_accuracy) capped at [0.3, 2.0]
 * 
 * If trap_queen_sac has 60% accuracy and baseline is 40%, multiplier = 1.5 (boost).
 * If castling has 20% accuracy and baseline is 40%, multiplier = 0.5 (dampen).
 */
async function refreshTacticalCalibration() {
  try {
    // Fetch raw prices + symbol to recompute correctness with sector-aware thresholds
    // Don't trust ep_correct — it was scored with the old universal threshold
    const { data, error } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, predicted_direction, price_at_prediction, price_at_resolution, prediction_metadata')
      .not('resolved_at', 'is', null)
      .not('price_at_resolution', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8000);
    
    if (error || !data || data.length < 50) return;
    
    // Per-sector thresholds for recomputing correctness
    const sectorThresholds = {
      forex: 0.0005, crypto: 0.0075, commodities: 0.004,
      energy: 0.004, tech: 0.005, indices: 0.005,
    };
    
    // Split by tactical vs base, recomputing correctness
    const byPattern = {};
    let baseN = 0, baseCorrect = 0;
    
    for (const r of data) {
      if (!r.price_at_prediction || !r.price_at_resolution) continue;
      const normPred = r.predicted_direction === 'bullish' ? 'bullish' : r.predicted_direction === 'bearish' ? 'bearish' : 'neutral';
      if (normPred === 'neutral') continue; // Only score directional

      const sector = getSector(r.symbol);
      const threshold = sectorThresholds[sector] || 0.005;
      const change = (r.price_at_resolution - r.price_at_prediction) / r.price_at_prediction;
      const actualDir = change > threshold ? 'bullish' : change < -threshold ? 'bearish' : null;
      if (!actualDir) continue; // Genuinely flat — skip

      const isCorrect = normPred === actualDir;

      const tact = r.prediction_metadata?.tactical_override?.pattern;
      if (tact) {
        if (!byPattern[tact]) byPattern[tact] = { n: 0, correct: 0 };
        byPattern[tact].n++;
        if (isCorrect) byPattern[tact].correct++;
      } else {
        baseN++;
        if (isCorrect) baseCorrect++;
      }
    }
    
    const baseAcc = baseN > 0 ? baseCorrect / baseN : 0.33;
    if (baseAcc === 0) return; // Can't calibrate against zero
    
    const calibration = {};
    let hasData = false;
    
    for (const [pattern, stats] of Object.entries(byPattern)) {
      if (stats.n < 5) continue; // Need minimum sample
      const patternAcc = stats.correct / stats.n;
      // Multiplier: how much better/worse than baseline
      const rawMultiplier = patternAcc / baseAcc;
      // Cap at [0.3, 2.0] to prevent extreme swings
      const multiplier = Math.max(0.3, Math.min(2.0, rawMultiplier));
      calibration[pattern] = {
        multiplier,
        accuracy: patternAcc,
        sampleSize: stats.n,
      };
      hasData = true;
    }
    
    if (hasData) {
      learnedTacticalCalibration = calibration;
      tacticalCalibrationRefreshedAt = cycleCount;
      persistToFile(TACTICAL_FILE, learnedTacticalCalibration);
      log(`♻️ Self-learned tactical calibration (base=${(baseAcc*100).toFixed(1)}%):`);
      for (const [p, c] of Object.entries(calibration)) {
        const icon = c.multiplier >= 1.0 ? '🟢' : c.multiplier >= 0.6 ? '🟡' : '🔴';
        log(`  ${icon} ${p}: ${(c.accuracy*100).toFixed(1)}% (n=${c.sampleSize}) → ×${c.multiplier.toFixed(2)}`);
      }
    }
  } catch (err) {
    log(`Tactical calibration error: ${err.message}`, 'warn');
  }
}

/**
 * SELF-EVOLVING: Detect reverse signals per symbol.
 * 
 * If a symbol is consistently anti-predictive (<20% accuracy on directional binary),
 * that's actually a STRONG signal — just inverted. 1% accuracy = 99% reverse signal.
 * The system IS detecting something real, the direction mapping is just backwards.
 * 
 * This learns which symbols should have their predictions flipped.
 * Uses the NEW per-sector thresholds so forex gets properly classified.
 */
async function refreshReverseSignals() {
  if (!sqlPool) return;
  try {
    // Query recent resolved predictions with per-sector threshold awareness
    // We re-evaluate accuracy using the CORRECT sector thresholds
    const { rows } = await sqlPool.query(`
      SELECT symbol, predicted_direction, price_at_prediction, price_at_resolution,
             prediction_metadata->>'sector' as sector
      FROM market_prediction_attempts
      WHERE resolved_at IS NOT NULL
        AND price_at_prediction IS NOT NULL
        AND price_at_resolution IS NOT NULL
        AND predicted_direction IN ('bullish', 'bearish')
      ORDER BY created_at DESC
      LIMIT 10000
    `);

    if (!rows || rows.length < 100) return;

    // Per-sector directional thresholds (matching resolution function)
    const sectorThresholds = {
      forex: 0.0005,       // 0.05% — forex moves are tiny
      crypto: 0.0075,      // 0.75% — crypto is volatile
      commodities: 0.004,  // 0.4%
      energy: 0.004,       // 0.4%
      tech: 0.005,         // 0.5%
      indices: 0.005,      // 0.5%
    };

    // Group by symbol and re-evaluate with correct thresholds
    const bySymbol = {};
    for (const r of rows) {
      const sym = r.symbol;
      if (!bySymbol[sym]) bySymbol[sym] = { correct: 0, wrong: 0, flippedCorrect: 0, sector: r.sector || getSector(sym) };

      const change = (r.price_at_resolution - r.price_at_prediction) / r.price_at_prediction;
      const threshold = sectorThresholds[bySymbol[sym].sector] || 0.005;
      const actualDir = change > threshold ? 'bullish' : change < -threshold ? 'bearish' : null;

      if (!actualDir) continue; // Genuinely flat — skip

      if (r.predicted_direction === actualDir) {
        bySymbol[sym].correct++;
      } else {
        bySymbol[sym].wrong++;
        // Would flipping have been correct?
        const flipped = r.predicted_direction === 'bullish' ? 'bearish' : 'bullish';
        if (flipped === actualDir) bySymbol[sym].flippedCorrect++;
      }
    }

    const signals = {};
    let flippedSymbols = [];

    for (const [sym, stats] of Object.entries(bySymbol)) {
      const total = stats.correct + stats.wrong;
      if (total < 30) continue; // Need minimum sample with proper thresholds

      const accuracy = stats.correct / total;
      const flippedAccuracy = stats.flippedCorrect / total;

      // REVERSE SIGNAL: accuracy < 20% on directional binary AND flipped > 50%
      // This means the system is detecting real patterns but mapping direction wrong
      const shouldFlip = accuracy < 0.20 && flippedAccuracy > 0.45 && total >= 50;

      signals[sym] = {
        accuracy: +accuracy.toFixed(3),
        flippedAccuracy: +flippedAccuracy.toFixed(3),
        sampleSize: total,
        sector: stats.sector,
        shouldFlip,
      };

      if (shouldFlip) flippedSymbols.push(sym);
    }

    learnedReverseSignals = signals;
    reverseSignalsRefreshedAt = cycleCount;
    persistToFile(REVERSE_FILE, signals);

    // Log results
    const aboveRandom = Object.entries(signals).filter(([, v]) => v.accuracy >= 0.40);
    const belowRandom = Object.entries(signals).filter(([, v]) => v.accuracy < 0.20 && v.sampleSize >= 30);
    log(`🔄 Reverse signal scan: ${Object.keys(signals).length} symbols | ${flippedSymbols.length} flipped | ${aboveRandom.length} above 40% | ${belowRandom.length} below 20%`);
    for (const [sym, s] of Object.entries(signals).sort((a, b) => a[1].accuracy - b[1].accuracy)) {
      if (s.shouldFlip) {
        log(`  🔴→🟢 FLIP ${sym}: ${(s.accuracy*100).toFixed(1)}% → ${(s.flippedAccuracy*100).toFixed(1)}% (n=${s.sampleSize}, ${s.sector})`);
      } else if (s.accuracy < 0.25 && s.sampleSize >= 30) {
        log(`  🟡 WATCH ${sym}: ${(s.accuracy*100).toFixed(1)}% (n=${s.sampleSize}, ${s.sector}) — near flip threshold`);
      }
    }
  } catch (err) {
    log(`Reverse signal scan error: ${err.message}`, 'warn');
  }
}

/**
 * Refresh per-symbol accuracy cache for selective prediction.
 */
async function refreshSymbolAccuracy() {
  try {
    const { data, error } = await supabase
      .from('security_accuracy_metrics')
      .select('symbol, total_predictions, direction_accuracy')
      .order('total_predictions', { ascending: false });
    
    if (error || !data) return;
    
    symbolAccuracyCache = new Map();
    for (const row of data) {
      symbolAccuracyCache.set(row.symbol, {
        total: row.total_predictions,
        accuracy: row.direction_accuracy,
      });
    }
  } catch (err) {
    // Non-critical
  }
}

/**
 * Check if a symbol should be predicted on (selective prediction).
 * Skip symbols with enough data showing accuracy below random baseline.
 * Also checks auto-exclude list from edge monitor.
 */
function shouldPredictSymbol(symbol) {
  // Check auto-exclude list (catastrophic performers)
  if (autoExcludedSymbols.has(symbol)) return false;
  
  // NEVER block reverse-signal symbols — they're anti-predictive and we FLIP them.
  // Blocking them prevents the reverse signal from activating and kills the feedback loop.
  if (learnedReverseSignals && learnedReverseSignals[symbol]?.shouldFlip) return true;
  
  const stats = symbolAccuracyCache.get(symbol);
  if (!stats || stats.total < 20) return true; // Not enough data to judge
  // NOTE: security_accuracy_metrics may have contaminated data from old universal thresholds.
  // As new predictions resolve with per-sector thresholds, these metrics will self-correct.
  // For now, be lenient — only block truly catastrophic symbols with high sample size.
  if (stats.accuracy < 0.35 && stats.total >= 100) {
    return false;
  }
  return true;
}

// Auto-excluded symbols (catastrophic performers detected by edge monitor)
const autoExcludedSymbols = new Set();

// ─── BINOMIAL TEST (Statistical Significance) ────────────────────────────────
/**
 * Compute one-tailed binomial test p-value.
 * H0: accuracy <= p0 (no edge, random guessing)
 * H1: accuracy > p0 (real edge exists)
 * Uses normal approximation for n >= 30.
 * 
 * @param {number} successes - Number of correct predictions
 * @param {number} trials - Total resolved predictions  
 * @param {number} p0 - Null hypothesis probability (0.5 for 2-way, 0.33 for 3-way)
 * @returns {{ zScore: number, pValue: number, significant: boolean }}
 */
function binomialTest(successes, trials, p0 = 0.5) {
  if (trials < 10) return { zScore: 0, pValue: 1, significant: false };
  
  const observed = successes / trials;
  const se = Math.sqrt(p0 * (1 - p0) / trials);
  const z = (observed - p0) / se;
  
  // Normal CDF approximation (Abramowitz & Stegun)
  const pValue = z > 0 ? 1 - normalCDF(z) : normalCDF(-z);
  
  return {
    zScore: z,
    pValue,
    significant: z > 0 && pValue < EDGE_SIGNIFICANCE_THRESHOLD,
  };
}

function normalCDF(x) {
  // Approximation from Abramowitz & Stegun
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

// ─── EDGE MONITOR ────────────────────────────────────────────────────────────
/**
 * Automated statistical edge monitor.
 * Runs periodically after resolution cycles.
 * 
 * For each symbol:
 * 1. Checks if enough resolved predictions exist (>= EDGE_MIN_SAMPLES)
 * 2. Computes binomial test (is accuracy > 50% with p < 0.05?)
 * 3. If edge found → alerts via system_alerts
 * 4. If catastrophically bad → auto-excludes from future predictions
 * 
 * This is the GATE. No real capital until a symbol passes this test.
 */
async function runEdgeMonitor() {
  try {
    // Query per-symbol accuracy from security_accuracy_metrics
    const { data: metrics, error } = await supabase
      .from('security_accuracy_metrics')
      .select('symbol, total_predictions, correct_predictions, direction_accuracy, composite_accuracy')
      .gte('total_predictions', 10)
      .order('total_predictions', { ascending: false });
    
    if (error || !metrics || metrics.length === 0) return;
    
    log('═══ EDGE MONITOR REPORT ═══');
    
    const edgeSymbols = [];
    const catastrophicSymbols = [];
    
    for (const m of metrics) {
      const n = m.total_predictions;
      const k = m.correct_predictions;
      const acc = m.direction_accuracy;
      
      // Binomial test: is this better than random (50%)?
      const test = binomialTest(k, n, 0.5);
      
      const status = test.significant && acc >= EDGE_MIN_ACCURACY
        ? '🟢 EDGE'
        : acc < CATASTROPHE_ACCURACY && n >= CATASTROPHE_MIN_SAMPLES
          ? '🔴 EXCLUDE'
          : acc < 0.40 && n >= 30
            ? '🟡 WEAK'
            : '⚪ LEARNING';
      
      log(`  ${status} ${m.symbol}: ${k}/${n} = ${(acc * 100).toFixed(1)}% | z=${test.zScore.toFixed(2)} p=${test.pValue.toFixed(4)}${n >= EDGE_MIN_SAMPLES ? '' : ` (need ${EDGE_MIN_SAMPLES - n} more)`}`);
      
      // Track edge candidates
      if (test.significant && acc >= EDGE_MIN_ACCURACY && n >= EDGE_MIN_SAMPLES) {
        edgeSymbols.push({ symbol: m.symbol, accuracy: acc, n, zScore: test.zScore, pValue: test.pValue });
      }
      
      // Auto-exclude catastrophic performers
      if (acc < CATASTROPHE_ACCURACY && n >= CATASTROPHE_MIN_SAMPLES) {
        catastrophicSymbols.push(m.symbol);
        if (!autoExcludedSymbols.has(m.symbol)) {
          autoExcludedSymbols.add(m.symbol);
          log(`  ⛔ AUTO-EXCLUDED ${m.symbol}: ${(acc * 100).toFixed(1)}% accuracy on ${n} predictions`);
        }
      }
    }
    
    // Alert on edge discoveries
    if (edgeSymbols.length > 0) {
      log('🎯 STATISTICAL EDGE DETECTED:');
      for (const e of edgeSymbols) {
        log(`  🟢 ${e.symbol}: ${(e.accuracy * 100).toFixed(1)}% accuracy, z=${e.zScore.toFixed(2)}, p=${e.pValue.toFixed(4)}, n=${e.n}`);
        // Shadow sizing: compare IBKR vs zero-fee broker
        const isTSX = e.symbol.endsWith('.TO') || e.symbol.endsWith('.V');
        const broker = isTSX ? BROKER_PROFILES.ibkr_tsx : BROKER_PROFILES.ibkr_us;
        const sizing = computeTradeSizing({
          bankroll: shadowBankroll,
          symbol: e.symbol,
          confidence: e.accuracy,
          symbolStats: { winRate: e.accuracy, avgWin: 0.02, avgLoss: 0.015, n: e.n },
          circuitBreaker,
          edgeDecay: edgeDecayMonitor,
          broker,
          pricePerShare: 50,
        });
        log(`  💰 Shadow sizing ${e.symbol}: $${sizing.positionSize.toFixed(2)} of $${shadowBankroll.toFixed(2)} (${sizing.reason}) [${broker.name}]`);
      }
      
      // Write to system_alerts for CEO dashboard
      await alertEdgeDiscovery(edgeSymbols);
    } else {
      log(`  No statistically significant edge yet. ${metrics.length} symbols being tracked.`);
      log(`  Need: >${EDGE_MIN_ACCURACY * 100}% accuracy on ${EDGE_MIN_SAMPLES}+ predictions with p<${EDGE_SIGNIFICANCE_THRESHOLD}`);
    }
    
    if (autoExcludedSymbols.size > 0) {
      log(`  Auto-excluded symbols (${autoExcludedSymbols.size}): ${[...autoExcludedSymbols].join(', ')}`);
    }
    
    // RISK MANAGEMENT: Report circuit breaker + edge decay status
    const cbState = circuitBreaker.getState();
    const decaying = edgeDecayMonitor.getDecayingSymbols();
    log(`  📊 Risk: CB=${cbState.halted ? 'HALTED' : 'OK'} | Peak=$${cbState.peakEquity.toFixed(2)} | DD=${(cbState.drawdownPct * 100).toFixed(1)}% | Losses=${cbState.consecutiveLosses}`);
    if (decaying.length > 0) {
      log(`  ⚠️ Edge decay: ${decaying.map(d => `${d.symbol}(${d.signal},Δ${(d.delta*100).toFixed(1)}%)`).join(', ')}`);
    }
    
    // PER-TIMEFRAME ACCURACY: Find which timeframe has the edge
    // Different candle granularities through the same grid portal produce different patterns
    await runTimeframeBreakdown();
    
    log('═══════════════════════════');
  } catch (err) {
    log(`Edge monitor error: ${err.message}`, 'warn');
  }
}

/**
 * Per-timeframe accuracy breakdown from audit trail.
 * Queries market_prediction_attempts grouped by time_horizon.
 * This reveals if the edge lives at a specific timeframe (e.g. scalp but not daily).
 */
async function runTimeframeBreakdown() {
  try {
    const { data: resolved, error } = await supabase
      .from('market_prediction_attempts')
      .select('symbol, time_horizon, ep_correct, prediction_metadata')
      .not('resolved_at', 'is', null)
      .not('ep_correct', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10000); // Pro tier: full history for accuracy tracking
    
    if (error || !resolved || resolved.length < 10) return;
    
    // Group by timeframe
    const byTF = {};
    const byTFSymbol = {};
    
    for (const r of resolved) {
      const tf = r.time_horizon || 'unknown';
      if (!byTF[tf]) byTF[tf] = { n: 0, k: 0 };
      byTF[tf].n++;
      if (r.ep_correct) byTF[tf].k++;
      
      // Also track per timeframe+symbol
      const key = `${tf}|${r.symbol}`;
      if (!byTFSymbol[key]) byTFSymbol[key] = { n: 0, k: 0, symbol: r.symbol, tf };
      byTFSymbol[key].n++;
      if (r.ep_correct) byTFSymbol[key].k++;
    }
    
    log('  --- Per-Timeframe Accuracy ---');
    const sortedTF = Object.entries(byTF).sort((a, b) => b[1].n - a[1].n);
    for (const [tf, stats] of sortedTF) {
      const acc = stats.k / stats.n;
      const test = binomialTest(stats.k, stats.n, 0.5);
      const icon = test.significant && acc >= EDGE_MIN_ACCURACY ? '🟢' : acc < 0.40 ? '🟡' : '⚪';
      log(`  ${icon} ${tf.padEnd(6)}: ${stats.k}/${stats.n} = ${(acc * 100).toFixed(1)}% | z=${test.zScore.toFixed(2)} p=${test.pValue.toFixed(4)}`);
    }
    
    // Find best timeframe+symbol combos (potential edge pockets)
    const combos = Object.values(byTFSymbol)
      .filter(c => c.n >= 10)
      .map(c => ({ ...c, acc: c.k / c.n, test: binomialTest(c.k, c.n, 0.5) }))
      .filter(c => c.acc >= 0.55)
      .sort((a, b) => a.test.pValue - b.test.pValue);
    
    if (combos.length > 0) {
      log('  --- Best Timeframe+Symbol Combos (>55%) ---');
      for (const c of combos.slice(0, 10)) {
        const icon = c.test.significant ? '🟢' : '⚪';
        log(`  ${icon} ${c.symbol}@${c.tf}: ${c.k}/${c.n} = ${(c.acc * 100).toFixed(1)}% | z=${c.test.zScore.toFixed(2)} p=${c.test.pValue.toFixed(4)}`);
      }
    }
    
    // ♟️ TACTICAL PATTERN ACCURACY: Which chess→market patterns actually work?
    const byTactical = {};
    const byTacticalNone = { n: 0, k: 0 };
    for (const r of resolved) {
      const tact = r.prediction_metadata?.tactical_override?.pattern;
      if (tact) {
        if (!byTactical[tact]) byTactical[tact] = { n: 0, k: 0 };
        byTactical[tact].n++;
        if (r.ep_correct) byTactical[tact].k++;
      } else {
        byTacticalNone.n++;
        if (r.ep_correct) byTacticalNone.k++;
      }
    }
    
    const hasTactical = Object.keys(byTactical).length > 0;
    if (hasTactical) {
      log('  --- ♟️ Tactical Pattern Accuracy ---');
      log(`  ⚪ no_tactical: ${byTacticalNone.k}/${byTacticalNone.n} = ${byTacticalNone.n > 0 ? (byTacticalNone.k/byTacticalNone.n*100).toFixed(1) : 'N/A'}%`);
      for (const [tact, stats] of Object.entries(byTactical).sort((a, b) => b[1].n - a[1].n)) {
        const acc = stats.n > 0 ? stats.k / stats.n : 0;
        const test = binomialTest(stats.k, stats.n, 0.5);
        const icon = test.significant && acc >= 0.55 ? '🟢' : acc < 0.35 ? '🔴' : '⚪';
        log(`  ${icon} ${tact}: ${stats.k}/${stats.n} = ${(acc * 100).toFixed(1)}% | z=${test.zScore.toFixed(2)}`);
      }
    }
  } catch (err) {
    log(`Timeframe breakdown error: ${err.message}`, 'warn');
  }
}

/**
 * Write edge discovery alert to system_alerts table.
 * This triggers notification to CEO dashboard.
 */
async function alertEdgeDiscovery(edgeSymbols) {
  for (const e of edgeSymbols) {
    const clamp = (v) => Math.min(9.99, Math.max(-9.99, v));
    const corrId = `edge_${e.symbol}_${Date.now()}`;
    const patternName = `EDGE: ${e.symbol} ${(e.accuracy * 100).toFixed(1)}% (z=${e.zScore.toFixed(2)}, p=${e.pValue.toFixed(4)}, n=${e.n})`;
    
    // Use raw SQL (same approach as server-auto-evolution which works reliably)
    if (sqlPool) {
      try {
        await sqlPool.query(
          `INSERT INTO cross_domain_correlations (
            correlation_id, pattern_id, pattern_name,
            correlation_score, chess_archetype, chess_confidence,
            chess_intensity, market_symbol, market_direction,
            market_confidence, market_intensity, validated, detected_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            corrId,
            'market-statistical-edge',
            patternName,
            clamp(e.accuracy),
            'market_edge_discovery',
            clamp(e.accuracy),
            clamp(e.zScore / 10),
            e.symbol,
            'flat',
            clamp(e.accuracy),
            clamp(e.n / 1000),
            true,
          ]
        );
        log(`✅ Edge alert saved for ${e.symbol} via SQL`);
      } catch (err) {
        log(`Edge alert SQL error: ${err.message}`, 'warn');
      }
    } else {
      log(`Edge alert skipped (no DATABASE_URL): ${e.symbol}`, 'warn');
    }
  }
}

// ─── MARKET HOURS ────────────────────────────────────────────────────────────
function isStockMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960; // 9:30 AM - 4:00 PM ET
}

function isCrypto(symbol) {
  return symbol.endsWith('-USD');
}

function isForex(symbol) {
  return symbol.endsWith('=X');
}

function isCommodityOrFuture(symbol) {
  return symbol.endsWith('=F');
}

/** Forex trades Sun 5pm ET → Fri 5pm ET (24/5) */
function isForexOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  // Closed: Friday 10pm UTC → Sunday 10pm UTC
  if (day === 6) return false; // Saturday: closed
  if (day === 0 && hour < 22) return false; // Sunday before 10pm UTC: closed
  if (day === 5 && hour >= 22) return false; // Friday after 10pm UTC: closed
  return true;
}

/** European indices (FTSE, DAX) — only trade during European hours */
function isEuropeanMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = now.getUTCHours();
  // FTSE: 8:00-16:30 UTC, DAX: 8:00-16:30 UTC (roughly)
  return hour >= 8 && hour < 17;
}

/** Sydney ASX: 10:00-16:00 AEST = 00:00-06:00 UTC */
function isSydneyOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = now.getUTCHours();
  return hour >= 0 && hour < 6;
}

/** Shanghai SSE: 09:30-15:00 CST = 01:30-07:00 UTC */
function isShanghaiOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = now.getUTCHours();
  return hour >= 1 && hour < 7;
}

/** Saudi Tadawul: 10:00-15:00 AST = 07:00-12:00 UTC (Sun-Thu) */
function isSaudiOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  // Saudi trades Sun-Thu (closed Fri-Sat)
  if (day === 5 || day === 6) return false;
  const hour = now.getUTCHours();
  return hour >= 7 && hour < 12;
}

/** TSX Toronto: 09:30-16:00 ET = 14:30-21:00 UTC */
function isTSXOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960; // 9:30 AM - 4:00 PM ET
}

/** Returns symbols that are currently tradeable */
function getActiveSymbols() {
  const stocksOpen = isStockMarketOpen();
  const forexOpen = isForexOpen();
  const symbols = [];
  // Stocks: US market hours only
  if (stocksOpen) symbols.push(...STOCK_SYMBOLS);
  // Forex + commodities: 24/5 (Sun evening → Fri evening)
  if (forexOpen) {
    symbols.push(...FOREX_SYMBOLS, ...COMMODITY_SYMBOLS, ...BOND_SYMBOLS);
  }
  // European indices: only during European trading hours (avoid zero-move predictions)
  if (isEuropeanMarketOpen()) {
    symbols.push(...INDEX_SYMBOLS);
  }
  // International markets: each gated to its own trading hours
  if (isSydneyOpen())   symbols.push(...INTL_INDEX_SYMBOLS.asia_pacific.filter(s => s === '^AXJO'));
  if (isShanghaiOpen()) symbols.push(...INTL_INDEX_SYMBOLS.asia_pacific.filter(s => s === '000001.SS'));
  if (isSaudiOpen())    symbols.push(...INTL_INDEX_SYMBOLS.middle_east);
  if (isTSXOpen())      symbols.push(...INTL_INDEX_SYMBOLS.canada);
  // Crypto: 24/7/365 (training data)
  symbols.push(...CRYPTO_SYMBOLS);
  // Harmony experiment symbols: 24/7 (cultural signal, not conventional)
  symbols.push(...HARMONY_SYMBOLS);
  return symbols;
}

// ─── CROSS-TIMEFRAME INTELLIGENCE ENGINE ─────────────────────────────────────
// Maps chess time controls to market timeframes:
//   Puzzle scenarios  → Scalp  (seconds/1m: pure pattern recognition under max pressure)
//   Bullet (≤2min)    → Short  (minutes/5m: fast intuitive play, momentum-driven)
//   Blitz (3-8min)    → Medium (15min: balanced calculation + intuition)
//   Rapid (10-25min)  → Swing  (hours: deeper calculation, positional understanding)
//   Classical (30min+) → Daily  (day: exhaustive analysis, strategic depth)
//
// Different GMs from different cultures think differently under different time pressure.
// This IS the market: algos (bullet), retail (blitz), institutions (classical).
// The archetype patterns at each chess time control inform market predictions at the
// corresponding timeframe through the same universal grid portal.

const CHESS_TC_TO_MARKET_TF = {
  bullet:    'scalp',    // Fast pattern recognition → seconds scalp
  blitz:     'short',    // Quick intuition → minutes
  rapid:     'medium',   // Balanced → 15min+ trades
  classical: 'swing',    // Deep positional → hours
  puzzle:    'scalp',    // Pure tactical pattern → instant recognition
};

// Reverse: which chess time controls inform each market timeframe
const MARKET_TF_TO_CHESS_TC = {
  scalp:  ['bullet', 'puzzle'],
  short:  ['bullet', 'blitz'],
  medium: ['blitz', 'rapid'],
  swing:  ['rapid', 'classical'],
  daily:  ['classical', 'rapid'],
};

// Cross-timeframe intelligence cache: per-timeframe chess archetype accuracy
let crossTimeframeCache = null;
let crossTimeframeFetchedAt = 0;
const CROSS_TF_CACHE_TTL = 10 * 60 * 1000; // Refresh every 10min

function classifyChessTimeControl(timeControlStr) {
  if (!timeControlStr) return 'unknown';
  const s = String(timeControlStr).toLowerCase().trim();
  
  // Handle string labels (Lichess speed field, Chess.com time_class)
  if (s === 'bullet' || s === 'ultrabullet') return 'bullet';
  if (s === 'blitz') return 'blitz';
  if (s === 'rapid') return 'rapid';
  if (s === 'classical' || s === 'standard' || s === 'correspondence') return 'classical';
  
  // Handle FIDE format: "40/5400" or "40/5400:20/1800" or "40/5400+30"
  // Format: moves/seconds[:moves/seconds][+increment]
  if (s.includes('/')) {
    // Extract total base time from all time control periods
    let totalSeconds = 0;
    const periods = s.split(':');
    for (const period of periods) {
      const slashMatch = period.match(/\d+\/(\d+)/);
      if (slashMatch) totalSeconds += parseInt(slashMatch[1]);
    }
    // Add increment estimate if present
    const incMatch = s.match(/\+(\d+)/);
    if (incMatch) totalSeconds += parseInt(incMatch[1]) * 40;
    
    if (totalSeconds <= 180) return 'bullet';
    if (totalSeconds <= 600) return 'blitz';
    if (totalSeconds <= 1800) return 'rapid';
    return 'classical';
  }
  
  // Handle Lichess format: "seconds+increment" (e.g. "600+0", "180+2")
  const parts = s.split('+');
  const base = parseInt(parts[0]) || 0;
  const inc = parseInt(parts[1] || 0);
  const total = base + inc * 40; // estimated game duration
  if (total <= 120) return 'bullet';
  if (total <= 480) return 'blitz';
  if (total <= 1500) return 'rapid';
  return 'classical';
}

/**
 * Build cross-timeframe intelligence from chess DB.
 * Groups chess predictions by time control → archetype → accuracy.
 * Returns a map: { bullet: { archetype1: { n, acc, conf }, ... }, blitz: {...}, ... }
 */
async function buildCrossTimeframeIntelligence() {
  if (crossTimeframeCache && Date.now() - crossTimeframeFetchedAt < CROSS_TF_CACHE_TTL) {
    return crossTimeframeCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('time_control, hybrid_archetype, hybrid_correct, hybrid_confidence')
      .not('hybrid_archetype', 'is', null)
      .not('hybrid_correct', 'is', null)
      .not('time_control', 'is', null)
      .order('created_at', { ascending: false })
      .limit(2000); // Pro tier: deeper chess×market intelligence
    
    if (error || !data || data.length === 0) return null;
    
    // Group by chess time control → archetype → accuracy
    const intel = {};
    for (const r of data) {
      const tc = classifyChessTimeControl(r.time_control);
      if (!intel[tc]) intel[tc] = {};
      const arch = r.hybrid_archetype;
      if (!intel[tc][arch]) intel[tc][arch] = { n: 0, correct: 0, conf: 0 };
      intel[tc][arch].n++;
      if (r.hybrid_correct) intel[tc][arch].correct++;
      intel[tc][arch].conf += (r.hybrid_confidence || 0);
    }
    
    // Compute accuracy for each
    for (const tc of Object.keys(intel)) {
      for (const arch of Object.keys(intel[tc])) {
        const s = intel[tc][arch];
        s.accuracy = s.n > 0 ? s.correct / s.n : 0;
        s.avgConf = s.n > 0 ? s.conf / s.n : 0;
      }
    }
    
    crossTimeframeCache = intel;
    crossTimeframeFetchedAt = Date.now();
    
    // Log summary
    const summary = Object.entries(intel)
      .map(([tc, archs]) => {
        const total = Object.values(archs).reduce((s, a) => s + a.n, 0);
        const correct = Object.values(archs).reduce((s, a) => s + a.correct, 0);
        return `${tc}=${correct}/${total}(${(correct/total*100).toFixed(0)}%)`;
      }).join(' ');
    log(`Cross-TF intelligence refreshed: ${summary} (${data.length} games)`);
    
    return intel;
  } catch (err) {
    log(`Cross-TF intelligence error: ${err.message}`, 'warn');
    return crossTimeframeCache; // Return stale cache if available
  }
}

/**
 * Get chess resonance matched to a specific market timeframe.
 * Scalp predictions get bullet chess intelligence.
 * Daily predictions get classical chess intelligence.
 * Returns the dominant archetype + accuracy for the matching chess time controls.
 */
async function getTimeframeChessResonance(marketTimeframe) {
  const intel = await buildCrossTimeframeIntelligence();
  if (!intel) return null;
  
  const matchingTCs = MARKET_TF_TO_CHESS_TC[marketTimeframe] || ['blitz', 'bullet'];
  
  // Merge archetype data from all matching chess time controls
  const merged = {};
  for (const tc of matchingTCs) {
    if (!intel[tc]) continue;
    for (const [arch, stats] of Object.entries(intel[tc])) {
      if (!merged[arch]) merged[arch] = { n: 0, correct: 0, conf: 0 };
      merged[arch].n += stats.n;
      merged[arch].correct += stats.correct;
      merged[arch].conf += stats.conf;
    }
  }
  
  if (Object.keys(merged).length === 0) return null;
  
  // Find the most accurate archetype with enough data (not just most frequent)
  let bestArch = null, bestScore = -1;
  let dominantArch = null, maxN = 0;
  for (const [arch, stats] of Object.entries(merged)) {
    stats.accuracy = stats.n > 0 ? stats.correct / stats.n : 0;
    stats.avgConf = stats.n > 0 ? stats.conf / stats.n : 0;
    // Score = accuracy weighted by sample size (more data = more trust)
    const score = stats.accuracy * Math.min(1, stats.n / 20);
    if (score > bestScore) { bestScore = score; bestArch = arch; }
    if (stats.n > maxN) { maxN = stats.n; dominantArch = arch; }
  }
  
  const best = merged[bestArch] || merged[dominantArch];
  return {
    archetype: bestArch || dominantArch,
    accuracy: best?.accuracy || 0,
    confidence: best?.avgConf || 0,
    sampleSize: Object.values(merged).reduce((s, a) => s + a.n, 0),
    marketTimeframe,
    chessTimeControls: matchingTCs,
    allArchetypes: merged,
  };
}

// Legacy compat: generic resonance uses overall best
async function getChessResonance() {
  if (chessResonanceCache && Date.now() - chessResonanceFetchedAt < CHESS_CACHE_TTL) {
    return chessResonanceCache;
  }
  // Build full intel, then return overall dominant
  const intel = await buildCrossTimeframeIntelligence();
  if (!intel) return null;
  
  const allArchs = {};
  for (const tc of Object.values(intel)) {
    for (const [arch, stats] of Object.entries(tc)) {
      if (!allArchs[arch]) allArchs[arch] = { n: 0, correct: 0, conf: 0 };
      allArchs[arch].n += stats.n;
      allArchs[arch].correct += stats.correct;
      allArchs[arch].conf += stats.conf;
    }
  }
  
  let dominant = 'unknown', maxN = 0;
  for (const [arch, stats] of Object.entries(allArchs)) {
    if (stats.n > maxN) { maxN = stats.n; dominant = arch; }
  }
  const d = allArchs[dominant] || { n: 0, correct: 0, conf: 0 };
  chessResonanceCache = {
    archetype: dominant,
    accuracy: d.n > 0 ? d.correct / d.n : 0,
    confidence: d.n > 0 ? d.conf / d.n : 0,
    sampleSize: Object.values(allArchs).reduce((s, a) => s + a.n, 0),
  };
  chessResonanceFetchedAt = Date.now();
  log(`Chess resonance: ${dominant} (${(chessResonanceCache.accuracy * 100).toFixed(1)}% acc, n=${chessResonanceCache.sampleSize})`);
  return chessResonanceCache;
}

// ─── CHESS→MARKET BRIDGE ─────────────────────────────────────────────────────
// The adversarial dynamics of chess map to buyer/seller dynamics in markets.
// White (initiator/aggressor) = Sell pressure. Black (responder/defender) = Buy pressure.
// Draw = Equilibrium / No trade.
//
// SIGNAL A: Live chess game consensus — what are current chess games saying?
// SIGNAL B: Market-as-chess — what chess archetype does this market grid pattern resemble?
// When both agree → cyclical confirmation → high conviction.

// Chess archetype proven accuracy from 600K predictions (golden zone conf 55-64)
const CHESS_ARCHETYPE_PROVEN = {
  queenside_expansion:  { accuracy: 0.802, n: 31860, regime: 'institutional',  volatility: 'medium' },
  positional_squeeze:   { accuracy: 0.793, n: 11779, regime: 'compression',    volatility: 'low' },
  sacrificial_attack:   { accuracy: 0.749, n: 7232,  regime: 'breakout',       volatility: 'high' },
  central_domination:   { accuracy: 0.711, n: 2795,  regime: 'trend',          volatility: 'medium' },
  closed_maneuvering:   { accuracy: 0.704, n: 12509, regime: 'range_bound',    volatility: 'low' },
  kingside_attack:      { accuracy: 0.692, n: 21205, regime: 'momentum',       volatility: 'high' },
};

let chessConsensusCache = null;
let chessConsensusFetchedAt = 0;
const CHESS_CONSENSUS_TTL = 2 * 60 * 1000; // 2 min — fresh consensus each prediction cycle

/**
 * SIGNAL A: Live chess game consensus.
 * Queries recent chess predictions and maps white_wins/black_wins/draw → bearish/bullish/neutral.
 * This is the "what are the chess games saying right now?" signal.
 */
async function getChessConsensusSignal() {
  if (chessConsensusCache && Date.now() - chessConsensusFetchedAt < CHESS_CONSENSUS_TTL) {
    return chessConsensusCache;
  }
  if (!sqlPool) return null;
  try {
    const { rows } = await sqlPool.query(`
      SELECT hybrid_prediction, hybrid_confidence, hybrid_archetype
      FROM chess_prediction_attempts
      WHERE created_at > NOW() - INTERVAL '5 minutes'
        AND hybrid_prediction IS NOT NULL
        AND hybrid_confidence IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 200
    `);
    if (!rows || rows.length < 20) return null;

    let whiteWeight = 0, blackWeight = 0, drawWeight = 0;
    const archCounts = {};
    for (const r of rows) {
      const conf = (r.hybrid_confidence || 50) / 100;
      if (r.hybrid_prediction === 'white_wins') whiteWeight += conf;
      else if (r.hybrid_prediction === 'black_wins') blackWeight += conf;
      else drawWeight += conf;
      const a = r.hybrid_archetype || 'unknown';
      archCounts[a] = (archCounts[a] || 0) + 1;
    }
    const total = whiteWeight + blackWeight + drawWeight;
    const wPct = whiteWeight / total;
    const bPct = blackWeight / total;
    const dPct = drawWeight / total;
    const spread = Math.abs(wPct - bPct);

    // White winning = sellers dominating = bearish. Black = bullish.
    let direction, strength;
    if (dPct > 0.40) {
      direction = 'neutral'; strength = dPct;
    } else if (wPct > bPct) {
      direction = 'bearish'; strength = spread;
    } else {
      direction = 'bullish'; strength = spread;
    }

    const dominantArch = Object.entries(archCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const proven = CHESS_ARCHETYPE_PROVEN[dominantArch];
    const conviction = proven ? proven.accuracy : 0.60;

    chessConsensusCache = {
      direction,
      confidence: Math.min(0.80, spread * conviction * 2),
      whitePct: Math.round(wPct * 100),
      blackPct: Math.round(bPct * 100),
      drawPct: Math.round(dPct * 100),
      sampleSize: rows.length,
      dominantArchetype: dominantArch,
      regime: proven?.regime || 'unknown',
    };
    chessConsensusFetchedAt = Date.now();
    log(`♟️ Chess consensus: ${direction} (W:${chessConsensusCache.whitePct}% B:${chessConsensusCache.blackPct}% D:${chessConsensusCache.drawPct}%) arch=${dominantArch} n=${rows.length}`);
    return chessConsensusCache;
  } catch (err) {
    return chessConsensusCache; // Return stale on error
  }
}

/**
 * SIGNAL B: Market-as-Chess pattern matching.
 * Takes a market grid signature (same 8-quadrant format as chess) and classifies
 * it into the closest CHESS archetype based on pattern characteristics.
 * Then uses the chess archetype's PROVEN accuracy to calibrate confidence.
 *
 * The en pensent grid visualization is temporal data — this maps its similarities
 * to chess tendencies to predict market outcomes.
 */
function classifyMarketAsChess(signature) {
  const { quadrantProfile: qp, temporalFlow: tf, intensity } = signature;
  const mainImb = Math.abs(qp.q1) + Math.abs(qp.q2) + Math.abs(qp.q3) + Math.abs(qp.q4);
  const centerAct = Math.abs(qp.q5 || 0) + Math.abs(qp.q6 || 0);
  const edgeAct = Math.abs(qp.q7 || 0) + Math.abs(qp.q8 || 0);
  const trend = tf.late - tf.early;

  // Map market grid patterns → chess archetypes using same spatial logic
  // kingside_attack: strong directional momentum, high intensity
  if (intensity > 35 && Math.abs(trend) > 3 && mainImb > 20) {
    return { chessArchetype: 'kingside_attack', ...CHESS_ARCHETYPE_PROVEN.kingside_attack };
  }
  // sacrificial_attack: sharp spike, very high intensity, one quadrant dominates
  const maxQ = Math.max(Math.abs(qp.q1), Math.abs(qp.q2), Math.abs(qp.q3), Math.abs(qp.q4));
  if (intensity > 40 && maxQ > mainImb * 0.5) {
    return { chessArchetype: 'sacrificial_attack', ...CHESS_ARCHETYPE_PROVEN.sacrificial_attack };
  }
  // queenside_expansion: broad activity across all quadrants, structural
  const minQ = Math.min(Math.abs(qp.q1), Math.abs(qp.q2), Math.abs(qp.q3), Math.abs(qp.q4));
  if (mainImb > 15 && minQ > mainImb * 0.15 && Math.abs(trend) > 1) {
    return { chessArchetype: 'queenside_expansion', ...CHESS_ARCHETYPE_PROVEN.queenside_expansion };
  }
  // central_domination: strong center activity, controlled edges
  if (centerAct > mainImb * 0.3 && edgeAct < centerAct) {
    return { chessArchetype: 'central_domination', ...CHESS_ARCHETYPE_PROVEN.central_domination };
  }
  // positional_squeeze: low-moderate intensity, compression
  if (intensity > 10 && intensity < 30 && Math.abs(trend) < 2 && mainImb > 8) {
    return { chessArchetype: 'positional_squeeze', ...CHESS_ARCHETYPE_PROVEN.positional_squeeze };
  }
  // closed_maneuvering: low intensity, balanced, no clear direction
  if (intensity < 20 || mainImb < 10) {
    return { chessArchetype: 'closed_maneuvering', ...CHESS_ARCHETYPE_PROVEN.closed_maneuvering };
  }
  // Default: positional squeeze (moderate confidence)
  return { chessArchetype: 'positional_squeeze', ...CHESS_ARCHETYPE_PROVEN.positional_squeeze };
}

// ─── AUDIT TRAIL (market_prediction_attempts) ────────────────────────────────
async function logToAuditTrail(pred, horizonMs, chessSignal, timeframe = null) {
  // Use timeframe label if available, otherwise fall back to horizon map
  const timeHorizon = timeframe?.timeHorizon || '1d';

  // Generate signature hash
  const sigData = `${pred.symbol}|${pred.archetype}|${pred.entryPrice}|${Date.now()}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(sigData));
  const signatureHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  // v12: AUDIT TRAIL ALWAYS RECORDS — quality flags for downstream filtering
  // Self-learning needs ALL directional data. Paper-tracker uses flags to decide what to trade.
  // Dead zones = no data = no learning = system stagnates.
  const isForexSymbol = pred.symbol?.endsWith('=X');
  const isHarmony = pred.archetype === 'cultural_harmony';
  let direction = pred.direction;
  
  // Gate 1 ONLY: Must be explicit directional — non-directional has zero learning value
  if (direction !== 'up' && direction !== 'down') {
    return;
  }
  
  // Quality flags (metadata only — never block recording)
  const MIN_DIRECTIONAL_CONFIDENCE = 0.45;
  const FOREX_MIN_CONFIDENCE = 0.65;
  const minConf = isHarmony ? 0.40 : (isForexSymbol ? FOREX_MIN_CONFIDENCE : MIN_DIRECTIONAL_CONFIDENCE);
  const passesConfidenceGate = pred.confidence >= minConf;
  
  let passesArchetypeGate = true;
  if (!isHarmony && learnedMarketWeights && pred.archetype) {
    const archWeight = learnedMarketWeights[pred.archetype];
    if (archWeight && archWeight.sampleSize >= 20) {
      const expectedDir = direction === 'up' ? 'up' : 'down';
      const archAcc = archWeight[expectedDir] || 0;
      passesArchetypeGate = archAcc >= 0.20;
    }
  }

  const record = {
    symbol: pred.symbol,
    time_horizon: timeHorizon,
    prediction_source: 'ep_farm_market_worker',
    predicted_direction: direction === 'up' ? 'bullish' : direction === 'down' ? 'bearish' : 'neutral',
    confidence: Math.round(pred.confidence * 100),
    archetype: pred.archetype,
    signature_hash: signatureHash,
    target_move: pred.predicted_magnitude ? Math.round(pred.predicted_magnitude * 10000) / 100 : null,
    price_at_prediction: pred.entryPrice,
    volume_at_prediction: null,
    baseline_direction: pred.baselineDirection ? (pred.baselineDirection === 'up' ? 'bullish' : pred.baselineDirection === 'down' ? 'bearish' : 'neutral') : (pred.market_conditions?.momentum > 0.05 ? 'bullish' : pred.market_conditions?.momentum < -0.05 ? 'bearish' : 'neutral'),
    baseline_confidence: pred.baselineConfidence || null,
    chess_archetype_resonance: chessSignal?.archetype || null,
    cross_domain_confidence: chessSignal?.confidence || null,
    data_source: 'yahoo_finance',
    candle_count: null,
    prediction_metadata: {
      market_conditions: pred.market_conditions,
      worker_id: WORKER_ID,
      horizon_ms: horizonMs,
      timeframe_label: timeframe?.label || 'legacy',
      candle_interval: timeframe?.candleInterval || '5m',
      chess_accuracy: chessSignal?.accuracy || null,
      chess_sample_size: chessSignal?.sampleSize || null,
      vix: vixCache.value ? { current: vixCache.value.current, level: vixCache.value.level, change: vixCache.value.change } : null,
      short_volume: shortVolumeCache.get(pred.symbol) || null,
      tactical_override: pred.tacticalOverride ? {
        pattern: pred.tacticalOverride.pattern,
        baseDirection: pred.tacticalOverride.baseDirection,
        overrideDirection: pred.tacticalOverride.overrideDirection,
        reason: pred.tacticalOverride.reason,
        confidence: pred.tacticalOverride.confidence,
      } : null,
      base_archetype: pred.baseArchetype || null,
      chess_bridge: pred.chessBridge ? {
        chessArchetype: pred.chessBridge.chessArchetype,
        accuracy: pred.chessBridge.accuracy,
        regime: pred.chessBridge.regime,
        volatility: pred.chessBridge.volatility,
      } : null,
      chess_confirmed: pred.chessConfirmed ?? null,
      chess_consensus: pred.chessConsensus ? {
        direction: pred.chessConsensus.direction,
        whitePct: pred.chessConsensus.whitePct,
        blackPct: pred.chessConsensus.blackPct,
        drawPct: pred.chessConsensus.drawPct,
        dominantArchetype: pred.chessConsensus.dominantArchetype,
        regime: pred.chessConsensus.regime,
      } : null,
      harmony: pred.harmonySignal ? {
        direction: pred.harmonySignal.direction,
        confidence: pred.harmonySignal.confidence,
        votes: pred.harmonySignal.votes,
        dominantMood: pred.harmonySignal.dominantMood,
        signalCount: pred.harmonySignal.signalCount,
      } : null,
      options: (typeof optionsData !== 'undefined' && optionsData?.has?.(pred.symbol)) ? 
        calculateLeverageMetrics(optionsData.get(pred.symbol), pred) : null,
      quality_gates: {
        passes_confidence: passesConfidenceGate,
        passes_archetype: passesArchetypeGate,
        tradeable: passesConfidenceGate && passesArchetypeGate,
      },
      // v12.1: Sector intelligence — per-sector archetype learning
      sector: pred.sector || getSector(pred.symbol),
      chess_mode: pred.chessMode || getChessMode(pred.symbol),
      dampened: pred.dampened || false,
      dampen_reason: pred.dampenReason || null,
      reverse_signal: pred.reverseSignal ? {
        flipped: true,
        originalDirection: pred.reverseOriginal,
        accuracy: pred.reverseAccuracy,
        flippedAccuracy: pred.reverseFlippedAccuracy,
      } : null,
    },
  };

  // Use SQL pool (faster, no REST timeout) with Supabase REST fallback
  if (sqlPool) {
    try {
      await sqlPool.query(
        `INSERT INTO market_prediction_attempts (symbol, time_horizon, prediction_source, predicted_direction, confidence, archetype, signature_hash, target_move, price_at_prediction, volume_at_prediction, baseline_direction, baseline_confidence, chess_archetype_resonance, cross_domain_confidence, data_source, candle_count, prediction_metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT DO NOTHING`,
        [record.symbol, record.time_horizon, record.prediction_source, record.predicted_direction, record.confidence, record.archetype, record.signature_hash, record.target_move, record.price_at_prediction, record.volume_at_prediction, record.baseline_direction, record.baseline_confidence, record.chess_archetype_resonance, record.cross_domain_confidence, record.data_source, record.candle_count, JSON.stringify(record.prediction_metadata)]
      );
      auditTrailTotal++;
    } catch (err) {
      if (err.code === '23505') return;
      log(`Audit trail SQL error: ${err.message}`, 'warn');
    }
  } else {
    const { error } = await supabase.from('market_prediction_attempts').insert(record);
    if (error) {
      if (error.code === '23505') return;
      log(`Audit trail error: ${error.message}`, 'warn');
    } else {
      auditTrailTotal++;
    }
  }
}

// ─── RESOLVE AUDIT TRAIL ─────────────────────────────────────────────────────
// Smart per-horizon resolution: queries each time horizon separately so short-horizon
// predictions (5m scalp) aren't blocked by 3000+ long-horizon predictions not yet due.
async function resolveAuditTrailPredictions() {
  const horizons = [
    { label: '5m',  ms: 5*60*1000,      batchSize: 200 },
    { label: '30m', ms: 30*60*1000,     batchSize: 150 },
    { label: '2h',  ms: 2*60*60*1000,   batchSize: 100 },
    { label: '8h',  ms: 8*60*60*1000,   batchSize: 80 },
    { label: '1d',  ms: 24*60*60*1000,  batchSize: 60 },
    { label: '1h',  ms: 60*60*1000,     batchSize: 80 },
    { label: '4h',  ms: 4*60*60*1000,   batchSize: 60 },
    { label: '1w',  ms: 7*24*60*60*1000, batchSize: 30 },
  ];

  let totalResolved = 0;
  const now = new Date();

  for (const h of horizons) {
    // Only fetch predictions that are actually PAST their horizon
    const cutoff = new Date(now.getTime() - h.ms).toISOString();
    
    const { data: pending, error } = await supabase
      .from('market_prediction_attempts')
      .select('id, symbol, time_horizon, created_at, price_at_prediction, predicted_direction, baseline_direction')
      .is('resolved_at', null)
      .eq('time_horizon', h.label)
      .lt('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(h.batchSize);

    if (error || !pending || pending.length === 0) continue;

    // ── PER-SECTOR DIRECTIONAL THRESHOLDS ──
    // Forex moves are 5-10x smaller than stocks. A 0.03% forex move IS directional.
    // Using the same threshold for all sectors was classifying 90-95% of forex as "neutral"
    // when the predictions were actually directionally correct.
    const defaultThresholds = {
      '5m': 0.0005, '30m': 0.001, '1h': 0.0015, '2h': 0.002,
      '4h': 0.003, '8h': 0.004, '1d': 0.005, '1w': 0.01,
    };
    // Sector multipliers: forex needs much tighter thresholds
    const SECTOR_THRESHOLD_SCALE = {
      forex: 0.10,       // 10x tighter — forex 0.01% = significant
      crypto: 1.5,       // 1.5x wider — crypto is more volatile
      commodities: 0.8,  // Slightly tighter
      energy: 0.8,
      tech: 1.0,
      indices: 1.0,
    };
    const baseThreshold = (learnedDirThresholds && learnedDirThresholds[h.label]) 
      ? learnedDirThresholds[h.label] 
      : (defaultThresholds[h.label] || 0.005);

    for (const pred of pending) {
      const priceData = await fetchPrice(pred.symbol);
      if (!priceData) continue;

      const exitPrice = priceData.price;
      const priceChange = (exitPrice - pred.price_at_prediction) / pred.price_at_prediction;
      const actualMove = Math.abs(priceChange * 100);
      // Apply per-sector threshold scaling
      const predSector = getSector(pred.symbol);
      const sectorScale = SECTOR_THRESHOLD_SCALE[predSector] || 1.0;
      const dirThreshold = baseThreshold * sectorScale;
      const actualDir = priceChange > dirThreshold ? 'bullish' : priceChange < -dirThreshold ? 'bearish' : 'neutral';
      // Normalize direction enums: handle both 'up'/'down'/'flat' and 'bullish'/'bearish'/'neutral'
      const normDir = (d) => d === 'up' || d === 'bullish' ? 'bullish' : d === 'down' || d === 'bearish' ? 'bearish' : 'neutral';
      const predNorm = normDir(pred.predicted_direction);
      const actualNorm = normDir(actualDir);
      
      // v10 FIX: neutral→neutral is NOT a valid prediction — no predictive value
      // Only directional predictions (bullish/bearish) that match actual direction count as correct
      // neutral→neutral = null (indeterminate), directional→neutral = false, directional→match = true
      const bothNeutral = predNorm === 'neutral' && actualNorm === 'neutral';
      const epCorrect = bothNeutral ? null : (predNorm === actualNorm);
      const baselineNorm = pred.baseline_direction ? normDir(pred.baseline_direction) : null;
      const baselineCorrect = baselineNorm 
        ? (baselineNorm === 'neutral' && actualNorm === 'neutral' ? null : (baselineNorm === actualNorm))
        : null;

      const { error: upErr } = await supabase.from('market_prediction_attempts').update({
        resolved_at: now.toISOString(),
        price_at_resolution: exitPrice,
        actual_direction: actualDir,
        actual_move: Math.round(actualMove * 100) / 100,
        ep_correct: epCorrect,
        baseline_correct: baselineCorrect,
      }).eq('id', pred.id);

      if (!upErr) {
        totalResolved++;
        auditTrailResolved++;
        // Only count directional predictions in accuracy tracking
        if (epCorrect === true) auditTrailCorrect++;
        if (epCorrect !== null) edgeDecayMonitor.record(pred.symbol, epCorrect);
      }
    }
  }
  return totalResolved;
}

// ─── SAVE PREDICTION ─────────────────────────────────────────────────────────
async function savePrediction(pred, horizonMs) {
  const { error } = await supabase.from('prediction_outcomes').insert({
    symbol: pred.symbol,
    predicted_direction: pred.direction,
    predicted_confidence: pred.confidence,
    predicted_magnitude: pred.predicted_magnitude,
    entry_price: pred.entryPrice,
    prediction_horizon_ms: horizonMs,
    market_conditions: JSON.parse(JSON.stringify(pred.market_conditions)),
  });
  if (error) {
    log(`Save error ${pred.symbol}: ${error.message}`, 'error');
    return false;
  }
  return true;
}

// ─── RESOLVE PREDICTIONS ─────────────────────────────────────────────────────
async function resolvePendingPredictions() {
  const { data: pending, error } = await supabase
    .from('prediction_outcomes')
    .select('*')
    .is('resolved_at', null)
    .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  if (error || !pending || pending.length === 0) return 0;

  let resolved = 0;
  for (const pred of pending) {
    const horizonMs = pred.prediction_horizon_ms || 5 * 60 * 1000;
    const createdAt = new Date(pred.created_at).getTime();
    const now = Date.now();

    if (now - createdAt < horizonMs) continue;

    const priceData = await fetchPrice(pred.symbol);
    if (!priceData) continue;

    const exitPrice = priceData.price;
    const actualMove = (exitPrice - pred.entry_price) / pred.entry_price;
    const actualDir = actualMove > MIN_MOVE ? 'up' : actualMove < -MIN_MOVE ? 'down' : 'flat';
    const dirCorrect = (pred.predicted_direction === 'up' && actualMove > 0) ||
                       (pred.predicted_direction === 'down' && actualMove < 0);

    const magAcc = pred.predicted_magnitude
      ? Math.max(0, 1 - Math.abs(Math.abs(actualMove) - pred.predicted_magnitude) / Math.max(pred.predicted_magnitude, 0.001))
      : 0.5;
    const calAcc = Math.max(0, 1 - Math.abs(pred.predicted_confidence - (dirCorrect ? 1 : 0)));
    const composite = (dirCorrect ? 1 : 0) * 0.5 + magAcc * 0.25 + calAcc * 0.25;

    const { error: upErr } = await supabase.from('prediction_outcomes').update({
      exit_price: exitPrice,
      actual_direction: actualDir,
      actual_magnitude: Math.abs(actualMove),
      direction_correct: dirCorrect,
      magnitude_accuracy: magAcc,
      calibration_accuracy: calAcc,
      composite_score: composite,
      resolved_at: new Date().toISOString(),
    }).eq('id', pred.id);

    if (!upErr) {
      resolved++;
      totalResolved++;
      if (dirCorrect) totalCorrect++;

      // Update security_accuracy_metrics
      await updateSecurityMetrics(pred.symbol, dirCorrect, magAcc, calAcc, composite);
    }
  }
  return resolved;
}

async function updateSecurityMetrics(symbol, dirCorrect, magAcc, calAcc, composite) {
  const { data: existing } = await supabase
    .from('security_accuracy_metrics')
    .select('*')
    .eq('symbol', symbol)
    .single();

  if (existing) {
    const t = existing.total_predictions + 1;
    const c = existing.correct_predictions + (dirCorrect ? 1 : 0);
    await supabase.from('security_accuracy_metrics').update({
      total_predictions: t,
      correct_predictions: c,
      direction_accuracy: c / t,
      magnitude_accuracy: (existing.magnitude_accuracy * existing.total_predictions + magAcc) / t,
      calibration_accuracy: (existing.calibration_accuracy * existing.total_predictions + calAcc) / t,
      composite_accuracy: (existing.composite_accuracy * existing.total_predictions + composite) / t,
      last_prediction_at: new Date().toISOString(),
    }).eq('symbol', symbol);
  } else {
    await supabase.from('security_accuracy_metrics').insert({
      symbol,
      total_predictions: 1,
      correct_predictions: dirCorrect ? 1 : 0,
      direction_accuracy: dirCorrect ? 1 : 0,
      magnitude_accuracy: magAcc,
      timing_accuracy: 0.5,
      calibration_accuracy: calAcc,
      composite_accuracy: composite,
      last_prediction_at: new Date().toISOString(),
    });
  }
}

// ─── MULTI-TIMEFRAME CANDLE CACHE ────────────────────────────────────────────
// Slower timeframes don't need fresh candles every 5-min cycle.
// candleRefreshCycles: how often to re-fetch for each timeframe
const CANDLE_REFRESH = { scalp: 1, short: 1, scalp_1h: 1, medium: 2, mid_4h: 5, swing: 15, daily: 60 };
const candleCache = new Map(); // key: `${symbol}|${timeframe.label}` → candles

async function fetchCandlesForTimeframe(symbols, tf) {
  const shouldRefresh = cycleCount % (CANDLE_REFRESH[tf.label] || 1) === 1 || cycleCount === 1;
  if (!shouldRefresh) return; // Use cached candles

  for (const symbol of symbols) {
    const candles = await fetchIntradayCandles(symbol, tf.candleInterval, tf.candleRange);
    if (candles && candles.length >= tf.minCandles) {
      candleCache.set(`${symbol}|${tf.label}`, candles);
    }
  }
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────
async function predictionCycle() {
  cycleCount++;
  const activeSymbols = getActiveSymbols();
  const stocksOpen = isStockMarketOpen();
  const forexOpen = isForexOpen();
  const marketLabel = stocksOpen ? 'All markets' : forexOpen ? 'Forex+Crypto' : 'Crypto only';

  log(`Cycle #${cycleCount} | ${marketLabel} (${activeSymbols.length} symbols × ${TIMEFRAMES.length} timeframes) | Predictions: ${totalPredictions} | Resolved: ${totalResolved} | Correct: ${totalCorrect} | Acc: ${totalResolved > 0 ? (totalCorrect / totalResolved * 100).toFixed(1) + '%' : 'N/A'} | Audit: ${auditTrailTotal}`);

  // Self-learning: refresh archetype weights, thresholds, and calibration periodically
  if (cycleCount > 1 && cycleCount % WEIGHT_REFRESH_INTERVAL === 1) {
    await refreshLearnedWeights();
    await refreshSymbolAccuracy();
    await refreshLearnedDirThresholds();
    await refreshTacticalCalibration();
    await refreshReverseSignals();
  }

  // Fetch real prices for active symbols
  const allPrices = new Map();
  const prices = await Promise.all(activeSymbols.map(s => fetchPrice(s)));
  for (const p of prices) {
    if (p) allPrices.set(p.symbol, p);
  }

  if (allPrices.size === 0) {
    log('No prices fetched. Yahoo may be down.', 'warn');
    return;
  }

  // Fetch VIX + FINRA short volume (pawn pressure gauges)
  const vix = await fetchVIX();
  const shortVols = await fetchFINRAShortVolume();
  if (vix && cycleCount % 12 === 1) {
    const shortSummary = STOCK_SYMBOLS.map(s => { const sv = shortVolumeCache.get(s); return sv ? `${s}:${(sv.shortPct*100).toFixed(0)}%` : null; }).filter(Boolean).join(' ');
    log(`♚ VIX: ${vix.current.toFixed(1)} (${vix.level}) | ♙ Short: ${shortSummary || 'N/A'}`);
  }

  // Fetch real options data (non-disruptive, parallel to existing flow)
  const optionsData = await fetchOptionsData(OPTIONS_UNIVERSE);
  if (optionsData.size > 0 && cycleCount % 6 === 1) {
    const optionsSummary = Array.from(optionsData.entries()).map(([sym, opts]) => {
      const volRatio = opts.putCallRatio.toFixed(2);
      const iv = opts.impliedVolatility ? (opts.impliedVolatility * 100).toFixed(1) + '%' : 'N/A';
      return `${sym}: P/C=${volRatio} IV=${iv}`;
    }).join(' ');
    log(`💎 Options: ${optionsSummary}`);
  }

  // Fetch candles at ALL timeframe intervals (batched per interval to minimize API calls)
  // Slower timeframes only re-fetch every N cycles (swing: 12, daily: 36)
  const tfFetchCounts = {};
  for (const tf of TIMEFRAMES) {
    await fetchCandlesForTimeframe(activeSymbols, tf);
    let count = 0;
    for (const symbol of activeSymbols) {
      if (candleCache.has(`${symbol}|${tf.label}`)) count++;
    }
    tfFetchCounts[tf.label] = count;
  }
  log(`Candles: ${Object.entries(tfFetchCounts).map(([k, v]) => `${k}=${v}`).join(' ')}`);

  // Build cross-timeframe chess intelligence (10s timeout to avoid hanging on slow Supabase)
  const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
  const chessSignal = await withTimeout(getChessResonance(), 10000);
  const tfChessSignals = {};
  for (const tf of TIMEFRAMES) {
    tfChessSignals[tf.label] = await withTimeout(getTimeframeChessResonance(tf.label), 5000);
  }
  // SIGNAL A: Live chess consensus (white=sell/black=buy)
  const chessConsensus = await withTimeout(getChessConsensusSignal(), 5000);
  const tfChessSummary = Object.entries(tfChessSignals)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}→${v.archetype}(${(v.accuracy*100).toFixed(0)}%)`)
    .join(' ');
  if (tfChessSummary) log(`Chess×Market TF: ${tfChessSummary}`);

  // Generate predictions for each symbol at EACH timeframe
  let made = 0;
  let skippedLowSignal = 0;
  let flatSkipped = 0;
  const tfMade = {};
  const tacticalCounts = {};

  // ── HARMONY PREDICTIONS: crypto via chess archetype → musical patterns ──
  let harmonyMade = 0;
  for (const symbol of HARMONY_SYMBOLS) {
    const priceData = allPrices.get(symbol);
    if (!priceData) continue;
    
    const harmony = await getHarmonySignal(symbol, priceData);
    if (!harmony || harmony.direction === 'neutral') continue;
    
    // Use medium + swing timeframes for harmony (crypto moves on hours, not minutes)
    for (const tf of TIMEFRAMES.filter(t => t.label === 'medium' || t.label === 'swing')) {
      const pred = {
        symbol,
        direction: harmony.direction,
        confidence: harmony.confidence,
        entryPrice: priceData.price,
        archetype: 'cultural_harmony',
        timeframe: tf.label,
        market_conditions: { momentum: priceData.change || 0 },
        predicted_magnitude: null,
        baselineDirection: null,
        baselineConfidence: null,
        tacticalOverride: null,
        baseArchetype: null,
        harmonySignal: harmony,
      };
      
      await logToAuditTrail(pred, tf.resolutionMs, chessSignal, tf);
      totalPredictions++;
      harmonyMade++;
      tfMade[tf.label] = (tfMade[tf.label] || 0) + 1;
      
      const dirEmoji = pred.direction === 'up' ? '📈' : pred.direction === 'down' ? '📉' : '➡️';
      log(`${dirEmoji} ${pred.direction.toUpperCase()} ${symbol} @ $${priceData.price.toFixed(2)} | ${tf.label}/${tf.timeHorizon} | 🎵 HARMONY conf: ${Math.round(harmony.confidence*100)}% | ${harmony.dominantMood}`, 'trade');
    }
  }
  if (harmonyMade > 0) log(`🎵 Cultural harmony: ${harmonyMade} predictions (${HARMONY_SYMBOLS.join(', ')})`);

  for (const [symbol, priceData] of allPrices) {
    // Skip harmony symbols — already predicted above via cultural signal
    if (HARMONY_SYMBOLS.includes(symbol)) continue;
    
    // SELECTIVE PREDICTION: Skip symbols with proven poor accuracy
    if (!shouldPredictSymbol(symbol)) {
      skippedLowSignal++;
      continue;
    }

    for (const tf of TIMEFRAMES) {
      // P5: Skip daily predictions — 27.2% accuracy is below random (33%).
      // Re-enable when self-learning brings daily above 35%.
      if (tf.label === 'daily') {
        const dailyAcc = learnedMarketWeights ? Object.values(learnedMarketWeights).reduce((s, w) => s + (w.sampleSize || 0), 0) : 0;
        // Only allow daily if we have self-learned weights showing it works
        if (!learnedDirThresholds || !learnedDirThresholds['1d']) continue;
      }

      // Get cached candles for this symbol+timeframe
      const candles = candleCache.get(`${symbol}|${tf.label}`);
      
      // Get timeframe-matched chess resonance for this prediction
      const tfChess = tfChessSignals[tf.label] || chessSignal;
      
      // PRIMARY: Universal grid prediction with timeframe-specific candles
      let pred = null;
      if (candles && candles.length >= tf.minCandles) {
        const symOpts = optionsData?.get(symbol) || null;
        pred = generateGridPrediction(symbol, candles, priceData, symOpts);
        if (pred) pred.timeframe = tf.label;
      }
      
      // FALLBACK for scalp/short only: Legacy ensemble if grid fails
      if (!pred && (tf.label === 'scalp' || tf.label === 'short')) {
        pred = generatePrediction(symbol, priceData, allPrices, null);
        if (pred) pred.timeframe = tf.label;
      }
      if (!pred) continue;

      // v12.1: CONFIDENCE DAMPENING replaces hard blacklist
      // Like chess poison zones: don't block predictions, dampen confidence & tag for learning.
      // The system needs ALL data to learn sector×archetype patterns.
      // Hard-blocked archetypes were 85% of volume — killing the feedback loop.
      const ARCHETYPE_PENALTY = {
        'no_signal': 0.15,               // 0% — almost certainly noise, heavy dampen
        'regime_shift_down': 0.25,       // 3.9% — catastrophic but still record
        'bullish_momentum': 0.5,         // 14.9% — below random but may improve per-sector
        'mean_reversion_up': 0.55,       // 19.1%
        'mean_reversion_down': 0.6,      // 22.3%
        'blunder_free_queen': 0.65,      // 23.7%
        'castling_reposition': 0.7,      // 25.8%
        'institutional_distribution': 0.7, // 27.4%
        'oversold_bounce': 0.75,         // 29.2%
        'institutional_accumulation': 0.75, // 29.1%
      };
      const penalty = pred.archetype ? (ARCHETYPE_PENALTY[pred.archetype] || 1.0) : 1.0;
      if (penalty < 1.0) {
        pred.confidence *= penalty;
        pred.dampened = true;
        pred.dampenReason = `archetype_penalty_${(penalty*100).toFixed(0)}pct`;
      }
      
      // v12.1: Tag with sector + chess game mode for per-sector learning
      const sector = getSector(symbol);
      const chessMode = getChessMode(symbol);
      pred.sector = sector;
      pred.chessMode = chessMode;

      // ── REVERSE SIGNAL DETECTION: Flip anti-predictive symbols ──
      // If accuracy < 20% on binary directional, the system IS detecting something
      // real — it's just inverted. 1% accuracy = 99% reverse signal. FLIP IT.
      if (learnedReverseSignals && learnedReverseSignals[symbol]?.shouldFlip) {
        const rs = learnedReverseSignals[symbol];
        const originalDir = pred.direction;
        pred.direction = pred.direction === 'up' ? 'down' : pred.direction === 'down' ? 'up' : pred.direction;
        pred.reverseSignal = true;
        pred.reverseOriginal = originalDir;
        pred.reverseAccuracy = rs.accuracy;
        pred.reverseFlippedAccuracy = rs.flippedAccuracy;
        // Confidence from the flipped accuracy — if flipped is 80%, high confidence
        pred.confidence = Math.min(0.80, rs.flippedAccuracy * 0.9);
      }

      // ── CHESS-MARKET BOARD: Per-stock board with parallel scenarios ──
      // Each symbol gets its own chess board: white=sell, black=buy,
      // pieces=volume parties, position=archetype-matched opening.
      // Thousands of real chess games from DB produce outcome distribution.
      try {
        const boardResult = await createChessMarketBoard(
          symbol,
          pred.signature || {},
          pred.archetype,
          pred.pieceTierProfile || null,
          pred.market_conditions || {},
          sqlPool
        );
        if (boardResult && boardResult.prediction) {
          const boardDir = boardResult.prediction.direction;
          const predDir = pred.direction === 'up' ? 'bullish' : pred.direction === 'down' ? 'bearish' : 'neutral';
          const boardDirNorm = boardDir === 'bullish' ? 'bullish' : boardDir === 'bearish' ? 'bearish' : 'neutral';

          // Cyclical confirmation: board agrees with grid prediction
          if (predDir === boardDirNorm && boardDirNorm !== 'neutral') {
            pred.confidence = Math.min(0.90, pred.confidence * 1.12);
            pred.chessConfirmed = true;
          } else if (predDir !== 'neutral' && boardDirNorm !== 'neutral' && predDir !== boardDirNorm) {
            pred.confidence *= 0.75; // Contradiction — reduce confidence
            pred.chessConfirmed = false;
          }
          pred.chessBridge = {
            chessArchetype: boardResult.position.archetype,
            direction: boardDir,
            confidence: boardResult.prediction.confidence,
            distribution: boardResult.prediction.distribution,
            drawMode: boardResult.prediction.drawMode,
            scenarioCount: boardResult.prediction.scenarioCount,
            accuracy: boardResult.prediction.predictionAccuracy,
          };
        }
      } catch (boardErr) {
        // Non-fatal — chess board is an enhancement, not a requirement
      }

      // FLAT/NO-TRADE: Save to audit trail as 'neutral' but skip legacy prediction_outcomes
      // The system must get credit when market is genuinely flat (~70% of outcomes)
      if (pred.direction === 'flat') {
        flatSkipped++;
        // Still log to audit trail for proper accuracy tracking
        pred.direction = 'flat'; // Keep as-is for conversion in logToAuditTrail ('flat' → 'neutral')
        await logToAuditTrail(pred, tf.resolutionMs, tfChess, tf).catch(() => {});
        continue;
      }

      // ─── CYCLICAL CONFIRMATION: Chess consensus × Market grid ───────────
      // When two independent systems agree → truth amplification.
      // When they disagree → conflict dampening.
      if (chessConsensus && chessConsensus.direction !== 'neutral') {
        const marketDir = pred.direction === 'up' ? 'bullish' : pred.direction === 'down' ? 'bearish' : 'neutral';
        if (chessConsensus.direction === marketDir) {
          // CONFIRMATION: chess and market grid agree → boost confidence
          pred.confidence = Math.min(0.85, pred.confidence * 1.15);
          pred.chessConfirmed = true;
        } else {
          // CONFLICT: chess and market disagree → dampen confidence
          pred.confidence *= 0.85;
          pred.chessConfirmed = false;
        }
        pred.chessConsensus = chessConsensus;
      }

      // CONFIDENCE RECALIBRATION
      const symStats = symbolAccuracyCache.get(symbol);
      if (symStats && symStats.total >= 10) {
        const maxCredibleConf = Math.min(0.90, symStats.accuracy + 0.20);
        pred.confidence = Math.min(pred.confidence, maxCredibleConf);
      }

      // Log to audit trail with timeframe-MATCHED chess signal
      const auditOk = await logToAuditTrail(pred, tf.resolutionMs, tfChess, tf).then(() => true).catch(err => { log(`Audit trail INSERT failed: ${err.message}`, 'error'); return false; });
      // Also save to legacy prediction_outcomes
      const saved = await savePrediction(pred, tf.resolutionMs);
      if (auditOk || saved) {
        made++;
        totalPredictions++;
        tfMade[tf.label] = (tfMade[tf.label] || 0) + 1;
        if (pred.tacticalOverride) tacticalCounts[pred.tacticalOverride.pattern] = (tacticalCounts[pred.tacticalOverride.pattern] || 0) + 1;
        const src = pred.source === 'universal_grid_tactical' ? ' ♟️TACTICAL' : pred.source === 'universal_grid' ? ' [GRID]' : pred.source?.includes('flat') ? ' [FLAT]' : ' [LEGACY]';
        const tacticalTag = pred.tacticalOverride ? ` | ♟️${pred.tacticalOverride.pattern}: ${pred.tacticalOverride.baseDirection}→${pred.tacticalOverride.overrideDirection}` : '';
        log(`${pred.direction.toUpperCase()} ${symbol} @ $${pred.entryPrice.toFixed(2)} | ${tf.label}/${tf.timeHorizon} | conf: ${(pred.confidence * 100).toFixed(0)}% | arch: ${pred.archetype}${src}${tacticalTag}`, 'trade');
      }
    }
  }

  if (skippedLowSignal > 0) log(`Skipped ${skippedLowSignal} symbols (selective prediction)`);
  if (flatSkipped > 0) log(`Skipped ${flatSkipped} flat/no-signal predictions`);
  const totalMade = made + harmonyMade;
  log(`Made ${totalMade} predictions (${made} market + ${harmonyMade} harmony): ${Object.entries(tfMade).map(([k, v]) => `${k}=${v}`).join(' ')}`);

  // Tactical summary: count tactical overrides this cycle
  if (tacticalCounts && Object.keys(tacticalCounts).length > 0) {
    const tacticalSummary = Object.entries(tacticalCounts).map(([k, v]) => `${k}=${v}`).join(' ');
    log(`♟️ Tactical overrides: ${tacticalSummary}`);
  }
}

let resolutionCycleCount = 0;

async function resolutionCycle() {
  resolutionCycleCount++;
  
  // Always run resolution — crypto predictions need resolving 24/7
  const resolved = await resolvePendingPredictions();
  if (resolved > 0) {
    log(`Resolved ${resolved} predictions | Running accuracy: ${totalResolved > 0 ? (totalCorrect / totalResolved * 100).toFixed(1) + '%' : 'N/A'}`);
  }
  // Also resolve audit trail predictions
  const auditResolved = await resolveAuditTrailPredictions().catch(() => 0);
  if (auditResolved > 0) {
    log(`Audit trail: resolved ${auditResolved} | Total: ${auditTrailTotal} | Resolved: ${auditTrailResolved} | Correct: ${auditTrailCorrect} | Acc: ${auditTrailResolved > 0 ? (auditTrailCorrect / auditTrailResolved * 100).toFixed(1) + '%' : 'N/A'}`);
  }
  
  // EDGE MONITOR: Run periodically after resolutions
  if (resolutionCycleCount % EDGE_MONITOR_INTERVAL === 0) {
    await runEdgeMonitor();
  }
}

// ─── STARTUP: Seed auto-exclude from DB ──────────────────────────────────────
async function seedAutoExclude() {
  try {
    const { data, error } = await supabase
      .from('security_accuracy_metrics')
      .select('symbol, total_predictions, direction_accuracy')
      .gte('total_predictions', CATASTROPHE_MIN_SAMPLES);
    
    if (error || !data) return;
    
    let excluded = 0;
    for (const m of data) {
      if (m.direction_accuracy < CATASTROPHE_ACCURACY) {
        autoExcludedSymbols.add(m.symbol);
        excluded++;
      }
    }
    if (excluded > 0) {
      log(`Startup: auto-excluded ${excluded} catastrophic symbols: ${[...autoExcludedSymbols].join(', ')}`);
    } else {
      log(`Startup: no catastrophic symbols to exclude (checked ${data.length} symbols)`);
    }
  } catch (err) {
    log(`Startup exclude seed error: ${err.message}`, 'warn');
  }
}

// ─── ONE-TIME REPAIR: Fix ep_correct for enum mismatch ──────────────────────
// Old predictions stored 'up'/'down'/'flat' but resolution compared against 'bullish'/'bearish'/'neutral'
// This re-computes ep_correct for all resolved predictions using normalized comparison
async function repairEpCorrect() {
  try {
    const { data, error } = await supabase
      .from('market_prediction_attempts')
      .select('id, predicted_direction, actual_direction, ep_correct, baseline_direction')
      .not('resolved_at', 'is', null)
      .not('actual_direction', 'is', null);

    if (error || !data || data.length === 0) return;

    const normDir = (d) => d === 'up' || d === 'bullish' ? 'bullish' : d === 'down' || d === 'bearish' ? 'bearish' : 'neutral';
    let fixed = 0;

    for (const r of data) {
      const predNorm = normDir(r.predicted_direction);
      const actualNorm = normDir(r.actual_direction);
      // v10: neutral→neutral = null (no predictive value), not true
      const bothNeutral = predNorm === 'neutral' && actualNorm === 'neutral';
      const shouldBeCorrect = bothNeutral ? null : (predNorm === actualNorm);
      const baselineNorm = r.baseline_direction ? normDir(r.baseline_direction) : null;
      const baselineCorrect = baselineNorm
        ? (baselineNorm === 'neutral' && actualNorm === 'neutral' ? null : (baselineNorm === actualNorm))
        : null;
      
      if (r.ep_correct !== shouldBeCorrect || r.baseline_correct !== baselineCorrect) {
        const { error: upErr } = await supabase
          .from('market_prediction_attempts')
          .update({ ep_correct: shouldBeCorrect, baseline_correct: baselineCorrect })
          .eq('id', r.id);
        if (!upErr) fixed++;
      }
    }

    if (fixed > 0) {
      log(`🔧 Repaired ep_correct/baseline_correct for ${fixed}/${data.length} resolved predictions`);
    } else {
      log(`✅ All ${data.length} resolved predictions have correct ep_correct/baseline_correct values`);
    }
  } catch (err) {
    log(`Repair ep_correct error: ${err.message}`, 'warn');
  }
}

// ─── SEED AUDIT COUNTERS FROM DB ─────────────────────────────────────────────
async function seedAuditCounters() {
  if (!sqlPool) return;
  try {
    const { rows } = await sqlPool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(resolved_at) AS resolved,
        COUNT(CASE WHEN ep_correct = true THEN 1 END) AS correct
      FROM market_prediction_attempts
    `);
    if (rows[0]) {
      auditTrailTotal = parseInt(rows[0].total) || 0;
      auditTrailResolved = parseInt(rows[0].resolved) || 0;
      auditTrailCorrect = parseInt(rows[0].correct) || 0;
      log(`Audit counters seeded from DB: Total=${auditTrailTotal} Resolved=${auditTrailResolved} Correct=${auditTrailCorrect}`);
    }
  } catch (err) {
    log(`Audit counter seed error (non-fatal): ${err.message}`, 'warn');
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
log(`Starting market prediction worker [${WORKER_ID}]`);
log(`Stocks (US hours): ${STOCK_SYMBOLS.join(', ')}`);
log(`Forex (24/5):      ${FOREX_SYMBOLS.join(', ')}`);
log(`Commodities (24/5): ${COMMODITY_SYMBOLS.join(', ')}`);
log(`Indices (EU hours): ${INDEX_SYMBOLS.join(', ')}`);
log(`Intl (gated):       ASX: ${INTL_INDEX_SYMBOLS.asia_pacific.join(', ')} | Saudi: ${INTL_INDEX_SYMBOLS.middle_east.join(', ')} | Canada: ${INTL_INDEX_SYMBOLS.canada.join(', ')}`);
log(`Crypto (24/7):      ${CRYPTO_SYMBOLS.join(', ')}`);
log(`Total universe: ${ALL_SYMBOLS.length} symbols (${ALL_INTL.length} international)`);
log(`Prediction interval: ${PREDICTION_INTERVAL_MS / 1000}s | Resolution interval: ${RESOLUTION_INTERVAL_MS / 1000}s`);
log(`Timeframes: ${TIMEFRAMES.map(t => `${t.label}(${t.candleInterval}→${t.timeHorizon})`).join(', ')}`);
log(`Mode: Forex/commodities 24/5, crypto 24/7, stocks US hours only | Multi-timeframe: ${TIMEFRAMES.length} per symbol`);
log(`Edge gate: >${EDGE_MIN_ACCURACY * 100}% acc, p<${EDGE_SIGNIFICANCE_THRESHOLD}, n>=${EDGE_MIN_SAMPLES}`);

// Seed counters from DB so Resolved/Total are accurate after restarts
await seedAuditCounters();

// Start prediction cycles immediately (edge monitor + auto-exclude run during cycles)
log('Startup complete — beginning prediction cycles');
predictionCycle().catch(err => log(`Prediction cycle error: ${err.message}`, 'error'));

// Set intervals
setInterval(() => {
  predictionCycle().catch(err => log(`Prediction cycle error: ${err.message}`, 'error'));
}, PREDICTION_INTERVAL_MS);

setInterval(() => {
  resolutionCycle().catch(err => log(`Resolution cycle error: ${err.message}`, 'error'));
}, RESOLUTION_INTERVAL_MS);

// Keep alive
process.on('SIGINT', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });
