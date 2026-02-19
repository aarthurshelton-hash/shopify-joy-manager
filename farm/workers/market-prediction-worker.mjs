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
import {
  refreshMarketIntelligence,
  getMarketEntityBoost,
  shouldSkipSymbol,
} from './market-entity-intelligence.mjs';
import {
  PhotonicInterferenceEngine,
  loadFramesFromDB,
} from './domain-adapters/photonic-interference.mjs';

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
  connectionTimeoutMillis: 30000,
  statement_timeout: 15000,
}) : null;
if (sqlPool) sqlPool.on('error', (err) => console.error(`[MARKET-POOL] ${err.message}`));

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// v15: SYMBOL UNIVERSE — data-driven, only symbols with demonstrated edge
// Removed (Feb 14, 2026): ALL forex (0-1% on 2000+ resolved), ALL intl indices (0%),
// European indices (0%), bond yields (0%). These were pure pollution.
// v16 audit (24K+ resolved): AMD 48.2%, AMZN 38.6%, MSFT 35.9%, NVDA 35.0%, META 34.4%
// Removed: AAPL 27.8%, GOOGL 24.1%, SPY 20.4%, QQQ 35.3% (borderline but low edge)
const STOCK_SYMBOLS = ['AMD', 'AMZN', 'MSFT', 'NVDA', 'META'];
const FOREX_SYMBOLS = []; // KILLED: 0.2-1.1% accuracy on 2000+ resolved. No edge, pure noise.
// v16 audit: SI=F 53.5%, NG=F 53.0%, CL=F 39.8%, HG=F 39.5% — keep.
// Removed: GC=F 15.3% — way below random, no edge.
const COMMODITY_SYMBOLS = ['SI=F', 'CL=F', 'NG=F', 'HG=F'];
const INDEX_SYMBOLS = []; // KILLED: ^FTSE 0%, ^GDAXI 0%. Re-enable when model handles intl hours.
const INTL_INDEX_SYMBOLS = { asia_pacific: [], middle_east: [], canada: [] }; // KILLED: all 0%. Re-enable with proper timezone/session modeling.
const BOND_SYMBOLS = [];
const CRYPTO_SYMBOLS = [];
// KILLED: crypto harmony was 14-19% accuracy on 24h data. No edge.
const HARMONY_SYMBOLS = [];
const OPTIONS_UNIVERSE = [...OPTIONS_SYMBOLS.stocks, ...OPTIONS_SYMBOLS.etfs];
const ALL_INTL = [...INTL_INDEX_SYMBOLS.asia_pacific, ...INTL_INDEX_SYMBOLS.middle_east, ...INTL_INDEX_SYMBOLS.canada];
const ALL_SYMBOLS = [...STOCK_SYMBOLS, ...COMMODITY_SYMBOLS, ...OPTIONS_UNIVERSE];
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
  // v30: Killed mid_4h (5.0% accuracy on 322 resolved — catastrophic, worse than random)
  // 1h and 2h are our best timeframes (30.7% and 30.8%) — keep and focus
  { label: 'scalp_1h',candleInterval: '5m',  candleRange: '2d',  resolutionMs: 1 * 60 * 60 * 1000, timeHorizon: '1h', minCandles: 10 },
  { label: 'medium',  candleInterval: '15m', candleRange: '5d',  resolutionMs: 2 * 60 * 60 * 1000, timeHorizon: '2h', minCandles: 10 },
  // mid_4h KILLED: 5.0% accuracy (16/322) — anti-predictive noise
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

// ─── HISTORICAL REPLAY ENGINE ────────────────────────────────────────────────
// v30.2: SMART REPLAY — live data ALWAYS takes priority, replay fills dead time.
//   - Weekend (all closed): full replay on ALL symbols
//   - Weekday after-hours/pre-market (stocks closed, forex open): replay STOCKS only
//     while live commodity/forex predictions run in parallel
//   - Market hours: no replay, all live
// Fetch past candle windows → run grid predictions → resolve against known outcomes.
// Cross-references replay patterns with today's live conditions for similarity signals.
const REPLAY_INTERVAL_MS = 5 * 60 * 1000; // Replay every 5 min when markets closed
const REPLAY_STOCK_SYMBOLS = ['AMD', 'AMZN', 'MSFT', 'NVDA', 'META'];
const REPLAY_COMMODITY_SYMBOLS = ['SI=F', 'CL=F', 'NG=F', 'HG=F'];
const REPLAY_ALL_SYMBOLS = [...REPLAY_STOCK_SYMBOLS, ...REPLAY_COMMODITY_SYMBOLS];
const REPLAY_LOOKBACK_DAYS = [5, 10, 20, 40, 60]; // Rotate through different lookback windows
let replayState = {
  cycleCount: 0,
  totalReplayed: 0,
  totalCorrect: 0,
  byArchetype: {},   // archetype → { n, correct }
  bySector: {},       // sector → { n, correct }
  byTimeframe: {},    // tf.label → { n, correct }
  byDayOfWeek: {},    // 0-6 → { n, correct }
  byHourOfDay: {},    // 0-23 → { n, correct }
  lastReportAt: 0,
  // v30.2: Similarity cross-reference — replay patterns that match today's conditions
  recentReplaySignatures: [], // Last N replay results with archetype+direction+accuracy
};
const REPLAY_STATE_FILE = join(__dirname, '../data/market-replay-state.json');
const REPLAY_REPORT_INTERVAL = 20; // Print report every 20 replay cycles
const MAX_RECENT_REPLAY_SIGS = 200; // Keep last 200 replay signatures for cross-reference

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

// ─── PHOTONIC INTERFERENCE ENGINE ─────────────────────────────────────────
// Stack temporal visualizations and shine light through to see discrepancies.
// Feeds every prediction frame into the engine, uses coherence to adjust confidence.
const INTERFERENCE_FILE = join(LEARN_DATA_DIR, 'photonic-interference-state.json');
const INTERFERENCE_REPORT_INTERVAL = 100; // Print report every 100 cycles
const INTERFERENCE_SEED_INTERVAL = 500;   // Re-seed from DB every 500 cycles
let interferenceEngine = new PhotonicInterferenceEngine();
let interferenceSeededAt = 0;

// Load persisted interference state on startup
try {
  const diskState = loadFromFile(INTERFERENCE_FILE);
  if (diskState && diskState.version === 1) {
    interferenceEngine = PhotonicInterferenceEngine.deserialize(diskState);
    log(`🔬 Photonic interference loaded: ${interferenceEngine.totalFrames} frames (${interferenceEngine.correctFrames} correct, ${interferenceEngine.incorrectFrames} incorrect)`);
  }
} catch (e) { /* first run */ }

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
function generateGridPrediction(symbol, candles, priceData, symbolOptionsData = null, marketTimeframe = 'medium') {
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
    
    // v30.1: ACCURACY GATE — only proven tactical patterns can override
    // castling_reposition was 13.3% on 353 resolved — it was CAUSING the bearish bias
    // Only patterns with >25% accuracy earn the right to override the flat gate
    const TACTICAL_ACCURACY = {
      blunder_free_queen: 0.790,    // 79.0% — TRUST completely
      trap_queen_sac: 0.388,        // 38.8% — above random, trust
      regime_shift_down: 0.375,     // 37.5% — borderline, allow
      en_passant_window: 0.250,     // estimated — allow cautiously
      pawn_promotion: 0.250,        // estimated — allow cautiously
      castling_reposition: 0.133,   // 13.3% — ANTI-PREDICTIVE, block override
    };
    const tacticalAcc = TACTICAL_ACCURACY[tacticalResult.tactical] ?? 0.25;
    const tacticalAllowed = tacticalAcc >= 0.25;
    
    if (override.override && tacticalAllowed) {
      finalDirection = override.direction;
      let calibratedTacticalConf = override.confidence;
      if (learnedTacticalCalibration && learnedTacticalCalibration[tacticalResult.tactical]) {
        calibratedTacticalConf *= learnedTacticalCalibration[tacticalResult.tactical].multiplier;
        calibratedTacticalConf = Math.max(0.20, Math.min(0.90, calibratedTacticalConf));
      }
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
  
  // v30: ARCHETYPE ACCURACY from latest 1K resolved (Feb 18, 2026)
  // CRITICAL: Previous table was STALE and WRONG (blunder_free_queen listed 18.9%, actual 79%)
  const ARCHETYPE_ACCURACY = {
    blunder_free_queen: 0.790,             // 79.0% (64/81) — BEST PATTERN by far
    trap_queen_sac: 0.388,                 // 38.8% (50/129) — above random
    regime_shift_down: 0.309,              // 30.9% (25/81)
    bullish_momentum: 0.183,               // 18.3% (17/93) — below random
    mean_reversion_down: 0.073,            // 7.3% (9/123) — catastrophic
    castling_reposition: 0.102,            // 10.2% (25/245) — catastrophic
    institutional_distribution: 0.001,     // 0.0% (0/152) — DEAD, hard block
    mean_reversion_up: 0.014,              // 1.4% (1/71) — DEAD, hard block
    bearish_momentum: 0.001,               // 0.0% (0/25) — DEAD, hard block
  };
  const finalArch = tacticalOverride ? tacticalResult.tactical : archetype;
  // v30: HARD BLOCK archetypes with 0% accuracy — these are pure poison
  const DEAD_ARCHETYPES = new Set(['institutional_distribution', 'mean_reversion_up', 'bearish_momentum']);
  if (DEAD_ARCHETYPES.has(finalArch)) {
    return {
      symbol, direction: 'flat', confidence: 0.01, archetype: finalArch,
      entryPrice: priceData?.price || candles[candles.length - 1].close,
      predicted_magnitude: 0, market_conditions: { gridIntensity: signature.intensity },
      source: 'universal_grid_blocked',
    };
  }
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
  
  // v17.7: Map chess color dynamics to market signals
  // white=sell (down), black=buy (up)
  let marketSignal = 'neutral';
  if (chessBridge.dominantColor === 'white') marketSignal = 'down';
  else if (chessBridge.dominantColor === 'black') marketSignal = 'up';
  
  // If chess color dynamics contradict grid direction, dampen confidence
  if (marketSignal !== 'neutral' && marketSignal !== finalDirection) {
    finalConfidence *= 0.85; // 15% penalty for color-signal disagreement
  } else if (marketSignal === finalDirection) {
    finalConfidence = Math.min(0.90, finalConfidence * 1.05); // 5% boost for agreement
  }

  // Chess archetype accuracy modulates confidence:
  // If market pattern resembles queenside_expansion (80.2% proven) → boost
  // If it resembles closed_maneuvering (70.4% proven, range-bound) → reduce
  const chessAccuracyMultiplier = chessBridge.accuracy / 0.75; // Normalized: 1.0 at 75%
  finalConfidence = Math.min(0.80, finalConfidence * Math.max(0.7, Math.min(1.3, chessAccuracyMultiplier)));

  // ─── v17.8: ARCHETYPE×PHASE TEMPORAL MULTIPLIER ────────────────────────
  // Different archetypes peak at different game phases. Market timeframes map to phases:
  //   scalp→opening, short→early_middle, medium→late_middle, swing→early_endgame, daily→deep_endgame
  // If the matched chess archetype is in its peak phase for this timeframe → boost confidence.
  // If it's in a weak phase → dampen. This is the temporal sweet spot gating.
  let archPhaseMultiplierData = null;
  if (archPhaseIntelCache && chessBridge.archetype) {
    const MARKET_TF_TO_PHASE = {
      scalp: 'opening', short: 'early_middle', medium: 'late_middle',
      swing: 'early_endgame', daily: 'deep_endgame',
    };
    const phase = MARKET_TF_TO_PHASE[marketTimeframe] || 'late_middle';
    const key = `${chessBridge.archetype}__${phase}`;
    const current = archPhaseIntelCache[key];
    
    if (current && current.n >= 10) {
      // Find peak phase for this archetype
      let peakPhase = null, peakAccuracy = 0;
      for (const [k, stats] of Object.entries(archPhaseIntelCache)) {
        if (stats.archetype === chessBridge.archetype && stats.n >= 10 && stats.accuracy > peakAccuracy) {
          peakAccuracy = stats.accuracy;
          peakPhase = stats.phase;
        }
      }
      
      const temporalMultiplier = Math.max(0.7, Math.min(1.3, current.accuracy / 0.50));
      finalConfidence = Math.min(0.85, finalConfidence * temporalMultiplier);
      
      archPhaseMultiplierData = {
        archetype: chessBridge.archetype,
        phase,
        multiplier: temporalMultiplier,
        currentAccuracy: current.accuracy,
        currentN: current.n,
        peakPhase,
        peakAccuracy,
        atPeak: phase === peakPhase,
      };
    }
  }

  // ─── v17.9: SIGNAL D: Puzzle Tactical Likelihood Gate ───────────────────
  // Rare chess tactics (low playerLikelihood) = hidden patterns few players spot
  // In markets: rare pattern = contrarian edge = boost confidence
  // Obvious patterns (high likelihood) = crowded trade = dampen confidence
  let puzzleTacticalData = null;
  if (puzzleTacticalCache && chessBridge.archetype) {
    const tacticalIntel = puzzleTacticalCache[chessBridge.archetype];
    if (tacticalIntel && tacticalIntel.n >= 5) {
      // rarityScore: 0.5 (obvious) to 2.0 (rare hidden edge)
      // Convert to confidence multiplier: 0.90 (obvious) to 1.10 (rare edge)
      const rarityMultiplier = Math.max(0.90, Math.min(1.10,
        0.90 + (tacticalIntel.rarityScore - 0.5) * 0.133
      ));
      finalConfidence = Math.min(0.85, finalConfidence * rarityMultiplier);
      
      puzzleTacticalData = {
        archetype: chessBridge.archetype,
        rarityScore: tacticalIntel.rarityScore,
        avgLikelihood: tacticalIntel.avgLikelihood,
        avgComplexity: tacticalIntel.avgComplexity,
        puzzleAccuracy: tacticalIntel.accuracy,
        multiplier: rarityMultiplier,
        n: tacticalIntel.n,
      };
    }
  }

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

  // v29.4: HARD ACCURACY-BASED CONFIDENCE CEILING
  // Root cause of confidence inversion: 7 multiplicative boosters can inflate
  // confidence for anti-predictive archetypes (bullish_momentum 17.2%, mean_reversion_up 16.4%).
  // No amount of signal agreement should produce high confidence for a pattern that's
  // historically below random. The ceiling is the archetype's actual accuracy + 10pp headroom.
  // This ensures: <33% accuracy → max ~43% confidence, 60% accuracy → max ~70% confidence.
  const accuracyCeiling = Math.min(0.85, archAccuracy + 0.10);
  if (finalConfidence > accuracyCeiling) {
    finalConfidence = accuracyCeiling;
  }
  // Floor: never below 0.20 (system always has some signal)
  finalConfidence = Math.max(0.20, finalConfidence);

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
    archPhaseTemporalMap: archPhaseMultiplierData, // v17.8: Track temporal sweet spot for self-learning
    puzzleTactical: puzzleTacticalData, // v17.9: Track tactical rarity for self-learning
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

// v17.8: Archetype×Phase temporal intelligence cache
// Maps chess archetype + game phase → accuracy, used for market confidence gating
let archPhaseIntelCache = null;
let archPhaseIntelFetchedAt = 0;
const ARCH_PHASE_CACHE_TTL = 15 * 60 * 1000; // Refresh every 15min

/**
 * Build archetype×phase temporal intelligence from chess DB.
 * Returns: { "kingside_attack__late_middle": { n, accuracy, conf }, ... }
 * This tells us WHEN each archetype is most predictive.
 */
async function buildArchetypePhaseIntelligence() {
  if (archPhaseIntelCache && Date.now() - archPhaseIntelFetchedAt < ARCH_PHASE_CACHE_TTL) {
    return archPhaseIntelCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, move_number, hybrid_correct, hybrid_confidence')
      .not('hybrid_archetype', 'is', null)
      .not('hybrid_correct', 'is', null)
      .not('move_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000);
    
    if (error || !data || data.length === 0) return null;
    
    const intel = {};
    for (const r of data) {
      const arch = r.hybrid_archetype;
      let phase;
      if (r.move_number < 15) phase = 'opening';
      else if (r.move_number < 25) phase = 'early_middle';
      else if (r.move_number < 35) phase = 'late_middle';
      else if (r.move_number < 50) phase = 'early_endgame';
      else phase = 'deep_endgame';
      
      const key = `${arch}__${phase}`;
      if (!intel[key]) intel[key] = { n: 0, correct: 0, conf: 0, archetype: arch, phase };
      intel[key].n++;
      if (r.hybrid_correct) intel[key].correct++;
      intel[key].conf += (r.hybrid_confidence || 0);
    }
    
    // Compute accuracy
    for (const stats of Object.values(intel)) {
      stats.accuracy = stats.n > 0 ? stats.correct / stats.n : 0;
      stats.avgConf = stats.n > 0 ? stats.conf / stats.n : 0;
    }
    
    archPhaseIntelCache = intel;
    archPhaseIntelFetchedAt = Date.now();
    
    // Find peak phase per archetype for logging
    const archPeaks = {};
    for (const [key, stats] of Object.entries(intel)) {
      if (stats.n < 10) continue;
      const arch = stats.archetype;
      if (!archPeaks[arch] || stats.accuracy > archPeaks[arch].accuracy) {
        archPeaks[arch] = { phase: stats.phase, accuracy: stats.accuracy, n: stats.n };
      }
    }
    const peakSummary = Object.entries(archPeaks)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .slice(0, 5)
      .map(([arch, p]) => `${arch}→${p.phase}(${(p.accuracy*100).toFixed(0)}%)`)
      .join(' ');
    log(`Arch×Phase intel refreshed: ${peakSummary} (${data.length} games)`);
    
    return intel;
  } catch (err) {
    log(`Arch×Phase intelligence error: ${err.message}`, 'warn');
    return archPhaseIntelCache;
  }
}

// v17.9: Puzzle Tactical Likelihood Intelligence cache
// Maps chess archetype → { avgLikelihood, avgComplexity, n }
// Low likelihood = rare tactic = hidden edge = higher market confidence
let puzzleTacticalCache = null;
let puzzleTacticalFetchedAt = 0;
const PUZZLE_TACTICAL_CACHE_TTL = 20 * 60 * 1000; // Refresh every 20min

/**
 * Build puzzle tactical intelligence from chess DB.
 * Queries puzzle records and aggregates playerLikelihood + tacticalComplexity by archetype.
 * Returns: { "kingside_attack": { avgLikelihood, avgComplexity, n, rarityScore }, ... }
 */
async function buildPuzzleTacticalIntelligence() {
  if (puzzleTacticalCache && Date.now() - puzzleTacticalFetchedAt < PUZZLE_TACTICAL_CACHE_TTL) {
    return puzzleTacticalCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_archetype, metadata, hybrid_correct')
      .eq('data_source', 'lichess_puzzle')
      .not('hybrid_archetype', 'is', null)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3000);
    
    if (error || !data || data.length === 0) return null;
    
    const intel = {};
    for (const r of data) {
      const arch = r.hybrid_archetype;
      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
      if (!meta) continue;
      
      const likelihood = meta.playerLikelihood || meta.player_likelihood || 0;
      const complexity = meta.tacticalComplexity || meta.tactical_complexity || 0;
      
      if (!intel[arch]) intel[arch] = { n: 0, likelihoodSum: 0, complexitySum: 0, correct: 0 };
      intel[arch].n++;
      intel[arch].likelihoodSum += likelihood;
      intel[arch].complexitySum += complexity;
      if (r.hybrid_correct) intel[arch].correct++;
    }
    
    // Compute averages and rarity score
    const result = {};
    for (const [arch, stats] of Object.entries(intel)) {
      if (stats.n < 5) continue;
      const avgLikelihood = stats.likelihoodSum / stats.n;
      const avgComplexity = stats.complexitySum / stats.n;
      const accuracy = stats.correct / stats.n;
      
      // Rarity score: inverse of likelihood, boosted by complexity
      // Low likelihood + high complexity = rare, hard tactic = hidden edge
      // Range: 0.5 (obvious) to 2.0 (rare hidden edge)
      const rarityScore = Math.max(0.5, Math.min(2.0, 
        (1.0 - avgLikelihood) * 1.5 + avgComplexity * 0.5
      ));
      
      result[arch] = { avgLikelihood, avgComplexity, accuracy, n: stats.n, rarityScore };
    }
    
    puzzleTacticalCache = result;
    puzzleTacticalFetchedAt = Date.now();
    
    const topRarity = Object.entries(result)
      .sort((a, b) => b[1].rarityScore - a[1].rarityScore)
      .slice(0, 5)
      .map(([arch, s]) => `${arch}(r=${s.rarityScore.toFixed(2)},n=${s.n})`)
      .join(' ');
    log(`Puzzle tactical intel refreshed: ${topRarity} (${data.length} puzzles)`);
    
    return result;
  } catch (err) {
    log(`Puzzle tactical intelligence error: ${err.message}`, 'warn');
    return puzzleTacticalCache;
  }
}

/**
 * Get the temporal confidence multiplier for a chess archetype at a market-mapped phase.
 * Market timeframes map to chess phases:
 *   scalp → opening (fast, early decisions)
 *   short → early_middle (developing patterns)
 *   medium → late_middle (peak complexity)
 *   swing → early_endgame (positional clarity)
 *   daily → deep_endgame (long-term resolution)
 * Returns: { multiplier: 0.7-1.3, peakPhase, peakAccuracy, currentAccuracy }
 */
async function getArchetypePhaseMultiplier(archetype, marketTimeframe) {
  const intel = await buildArchetypePhaseIntelligence();
  if (!intel || !archetype) return null;
  
  const MARKET_TF_TO_PHASE = {
    scalp: 'opening',
    short: 'early_middle',
    medium: 'late_middle',
    swing: 'early_endgame',
    daily: 'deep_endgame',
  };
  
  const phase = MARKET_TF_TO_PHASE[marketTimeframe] || 'late_middle';
  const key = `${archetype}__${phase}`;
  const current = intel[key];
  
  // Find the peak phase for this archetype
  let peakPhase = null, peakAccuracy = 0;
  for (const [k, stats] of Object.entries(intel)) {
    if (stats.archetype === archetype && stats.n >= 10 && stats.accuracy > peakAccuracy) {
      peakAccuracy = stats.accuracy;
      peakPhase = stats.phase;
    }
  }
  
  if (!current || current.n < 10) {
    return { multiplier: 1.0, peakPhase, peakAccuracy, currentAccuracy: null, phase };
  }
  
  // Multiplier: ratio of current phase accuracy to baseline (50% = random for 2-way)
  // If this archetype at this phase is 70% accurate → 1.4x multiplier (capped at 1.3)
  // If it's 40% accurate → 0.8x multiplier (floored at 0.7)
  const multiplier = Math.max(0.7, Math.min(1.3, current.accuracy / 0.50));
  
  return {
    multiplier,
    peakPhase,
    peakAccuracy,
    currentAccuracy: current.accuracy,
    currentN: current.n,
    phase,
  };
}

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

// ─── TEMPORAL PARABLE CONFIRMATION ───────────────────────────────────────────
// The same story told three ways: chess, music, market.
// A "parable" is when all three temporal domains agree on direction.
// Chess: adversarial dynamics (white=sell, black=buy) → temporal flow
// Music: cultural harmony (tempo, consonance, narrative arc) → emotional flow
// Market: price/volume grid (8-quadrant signature) → structural flow
//
// When all three parables align → HIGH CONVICTION signal.
// When they disagree → LOW CONVICTION or FLAT.
// This is the cyclical confirmation loop that creates real edge.
//
// The insight: each domain sees the same underlying reality through a different lens.
// Chess sees it as adversarial strategy. Music sees it as emotional narrative.
// Market sees it as structural flow. When all three lenses converge → truth.

let parableCache = { signal: null, timestamp: 0 };
const PARABLE_CACHE_TTL = 2 * 60 * 1000; // 2 min — fresh each prediction cycle

/**
 * TEMPORAL PARABLE CONFIRMATION ENGINE
 * 
 * Queries live chess consensus + cultural harmony + market grid signature
 * and computes a three-domain agreement score.
 * 
 * Returns: { direction, confidence, agreement, domains: { chess, music, market } }
 * 
 * Agreement levels:
 *   3/3 = PARABLE (all agree) → 1.25x confidence boost
 *   2/3 = PARTIAL (majority) → 1.10x confidence boost
 *   1/3 = DISCORD (no agreement) → 0.85x confidence dampen
 *   0/3 = SILENCE (no signals) → no modification
 */
async function getTemporalParableSignal(marketDirection, marketArchetype, priceData) {
  // Check cache
  if (parableCache.signal && Date.now() - parableCache.timestamp < PARABLE_CACHE_TTL) {
    return applyParableToDirection(parableCache.signal, marketDirection);
  }

  const domains = { chess: null, music: null, market: null };
  
  // DOMAIN 1: Chess temporal consensus (live games → white/black/draw → bearish/bullish/neutral)
  const chessConsensus = await getChessConsensusSignal().catch(() => null);
  if (chessConsensus && chessConsensus.direction !== 'neutral') {
    domains.chess = {
      direction: chessConsensus.direction === 'bullish' ? 'up' : chessConsensus.direction === 'bearish' ? 'down' : 'neutral',
      confidence: Math.min(0.80, chessConsensus.confidence || 0.50),
      source: 'live_chess_consensus',
      detail: `W:${chessConsensus.whitePct}% B:${chessConsensus.blackPct}% D:${chessConsensus.drawPct}% arch=${chessConsensus.dominantArchetype}`,
    };
  }
  
  // DOMAIN 2: Musical harmony (chess archetypes → musical properties → crowd sentiment)
  const harmonySignal = harmonyCache.signal;
  if (harmonySignal && harmonySignal.direction !== 'neutral') {
    domains.music = {
      direction: harmonySignal.direction,
      confidence: harmonySignal.confidence || 0.40,
      source: 'cultural_harmony',
      detail: `${harmonySignal.dominantMood || 'unknown'} votes:${JSON.stringify(harmonySignal.votes || {})}`,
    };
  }
  
  // DOMAIN 3: Market grid direction (already computed by caller)
  if (marketDirection && marketDirection !== 'flat' && marketDirection !== 'neutral') {
    domains.market = {
      direction: marketDirection,
      confidence: 0.50, // Base — will be modified by parable
      source: 'market_grid',
      detail: `arch=${marketArchetype} price=$${priceData?.price?.toFixed(2) || '?'}`,
    };
  }
  
  // Count agreements
  const activeDomains = Object.values(domains).filter(d => d !== null);
  if (activeDomains.length < 2) {
    // Not enough domains to form a parable — return neutral
    parableCache = { signal: { agreement: 0, domains, direction: 'neutral', activeDomainCount: activeDomains.length }, timestamp: Date.now() };
    return applyParableToDirection(parableCache.signal, marketDirection);
  }
  
  // Compute directional consensus
  let upVotes = 0, downVotes = 0;
  let totalConfidence = 0;
  for (const d of activeDomains) {
    if (d.direction === 'up') upVotes++;
    else if (d.direction === 'down') downVotes++;
    totalConfidence += d.confidence;
  }
  
  const avgConfidence = totalConfidence / activeDomains.length;
  const maxVotes = Math.max(upVotes, downVotes);
  const agreement = maxVotes; // How many domains agree on the majority direction
  const consensusDirection = upVotes > downVotes ? 'up' : downVotes > upVotes ? 'down' : 'neutral';
  
  // Parable strength: 3/3 = full parable, 2/3 = partial, 1/3 = discord
  const parableStrength = activeDomains.length > 0 ? agreement / activeDomains.length : 0;
  
  const signal = {
    direction: consensusDirection,
    agreement,
    activeDomainCount: activeDomains.length,
    parableStrength,
    avgConfidence,
    domains,
    // The parable multiplier — applied to market prediction confidence
    // Full parable (3/3): 1.25x — all three lenses see the same truth
    // Partial (2/3): 1.10x — majority agreement
    // Discord (1/3 or split): 0.85x — disagreement dampens confidence
    multiplier: parableStrength >= 0.90 ? 1.25 :
                parableStrength >= 0.60 ? 1.10 :
                activeDomains.length >= 2 ? 0.85 : 1.0,
  };
  
  parableCache = { signal, timestamp: Date.now() };
  
  // Log the parable
  const domainSummary = Object.entries(domains)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${v.direction}(${(v.confidence*100).toFixed(0)}%)`)
    .join(' ');
  const parableIcon = parableStrength >= 0.90 ? '📖✨' : parableStrength >= 0.60 ? '📖' : '📖❌';
  log(`${parableIcon} PARABLE: ${domainSummary} → ${consensusDirection} (${agreement}/${activeDomains.length} agree, ×${signal.multiplier.toFixed(2)})`);
  
  return applyParableToDirection(signal, marketDirection);
}

/**
 * Apply the parable signal to a specific market direction.
 * If the parable consensus AGREES with market direction → boost.
 * If it DISAGREES → dampen harder.
 * If neutral → no modification.
 */
function applyParableToDirection(parableSignal, marketDirection) {
  if (!parableSignal || parableSignal.activeDomainCount < 2) {
    return { multiplier: 1.0, parable: parableSignal };
  }
  
  const agrees = parableSignal.direction === marketDirection;
  const disagrees = parableSignal.direction !== 'neutral' && marketDirection !== 'flat' && 
                    marketDirection !== 'neutral' && parableSignal.direction !== marketDirection;
  
  let multiplier = parableSignal.multiplier;
  
  if (agrees) {
    // Parable confirms market direction — full boost
    multiplier = parableSignal.multiplier;
  } else if (disagrees) {
    // Parable contradicts market direction — stronger dampen
    multiplier = Math.min(0.80, parableSignal.multiplier * 0.75);
  } else {
    // Neutral parable — slight dampen (no confirmation)
    multiplier = 0.95;
  }
  
  return { multiplier, parable: parableSignal, agrees, disagrees };
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

// ─── TRADE GRADE SYSTEM ──────────────────────────────────────────────────────
// Two-track: LEARN from everything, TRADE only the best.
// A-grade: Multiple high-confidence signals align. Hunt these.
// B-grade: Decent pattern, moderate confidence. Consider.
// C-grade: Learning value only. Record but don't trade.
//
// From 24K+ resolved predictions + 1.1M chess games:
// v30: Trade grades updated from real 1K resolved data (Feb 18, 2026)
// blunder_free_queen is 79% — it's A-grade, not C-grade!
const A_GRADE_ARCHETYPES = new Set(['blunder_free_queen', 'false_breakout']);  // 79% and 60%
const A_GRADE_CHESS_RESONANCE = new Set(['sacrificial_queenside_break', 'sacrificial_kingside_assault']);
const B_GRADE_ARCHETYPES = new Set(['trap_queen_sac', 'regime_shift_down', 'cultural_harmony']);
const C_GRADE_ARCHETYPES = new Set([
  'bullish_momentum', 'mean_reversion_up', 'mean_reversion_down',
  'castling_reposition', 'institutional_distribution', 'bearish_momentum',
  'institutional_accumulation', 'oversold_bounce',
]);

function computeTradeGrade(pred, chessSignal) {
  const arch = pred.archetype;
  const conf = pred.confidence;
  const chessArch = chessSignal?.archetype;
  const chessAcc = chessSignal?.accuracy || 0;

  // C-grade: Known bad archetypes — learn only
  if (C_GRADE_ARCHETYPES.has(arch)) return { grade: 'C', reason: 'low_accuracy_archetype' };
  if (conf < 0.45) return { grade: 'C', reason: 'low_confidence' };

  // A-grade: Proven archetype + high confidence + chess resonance alignment
  const hasAGradeArch = A_GRADE_ARCHETYPES.has(arch);
  const hasChessResonance = A_GRADE_CHESS_RESONANCE.has(chessArch) && chessAcc >= 0.60;
  const highConf = conf >= 0.60;

  if (hasAGradeArch && highConf) return { grade: 'A', reason: 'proven_archetype+high_conf' };
  if (hasAGradeArch && hasChessResonance) return { grade: 'A', reason: 'proven_archetype+chess_resonance' };
  if (highConf && hasChessResonance) return { grade: 'A', reason: 'high_conf+chess_resonance' };

  // B-grade: Decent archetype or moderate confidence
  if (B_GRADE_ARCHETYPES.has(arch) && conf >= 0.50) return { grade: 'B', reason: 'decent_archetype+moderate_conf' };
  if (conf >= 0.55) return { grade: 'B', reason: 'moderate_high_conf' };
  if (hasChessResonance) return { grade: 'B', reason: 'chess_resonance_only' };

  // Default: C-grade (learn only)
  return { grade: 'C', reason: 'default' };
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
  
  // v32: HARD confidence gate — only save predictions with demonstrated signal.
  // Saving low-confidence predictions dilutes the overall accuracy metric and
  // stalls self-learning (wrong data teaches the wrong lesson).
  const MIN_DIRECTIONAL_CONFIDENCE = 0.55;
  const FOREX_MIN_CONFIDENCE = 0.65;
  const minConf = isHarmony ? 0.45 : (isForexSymbol ? FOREX_MIN_CONFIDENCE : MIN_DIRECTIONAL_CONFIDENCE);
  const passesConfidenceGate = pred.confidence >= minConf;
  if (!passesConfidenceGate) return; // HARD gate — skip, don't pollute accuracy metrics

  // v32: Hard archetype kill — dead archetypes (empirically near-zero accuracy) are skipped.
  // Unlike dampening (which saves bad data), kill removes the noise entirely.
  const DEAD_ARCHETYPES = new Set([
    'institutional_distribution', // 0.0% (0/152)
    'mean_reversion_up',          // 1.4% (1/71)
    'bearish_momentum',           // 0.0% (0/25)
    'mean_reversion_down',        // 7.3% (9/123)
    'no_signal',                  // 0% — flat noise
  ]);
  if (!isHarmony && pred.archetype && DEAD_ARCHETYPES.has(pred.archetype)) return;
  
  let passesArchetypeGate = true;
  if (!isHarmony && learnedMarketWeights && pred.archetype) {
    const archWeight = learnedMarketWeights[pred.archetype];
    if (archWeight && archWeight.sampleSize >= 30) {
      const expectedDir = direction === 'up' ? 'up' : 'down';
      const archAcc = archWeight[expectedDir] || 0;
      passesArchetypeGate = archAcc >= 0.30; // Raised from 0.20 — only save above 30%
      if (!passesArchetypeGate) return; // Hard gate
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
        trade_grade: computeTradeGrade(pred, chessSignal),
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
      // v30: Temporal parable confirmation (chess+music+market interlink)
      parable: pred.parableConfirmation || null,
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

// ─── HISTORICAL REPLAY ENGINE (v18.0) ────────────────────────────────────────
// When markets are closed, replay past data through the grid to learn.
// Fetches historical candles, runs predictions, resolves against known outcomes.

function isAllMarketsClosed() {
  // True when stocks, forex, and commodities are ALL closed (only crypto open)
  return !isStockMarketOpen() && !isForexOpen();
}

function loadReplayState() {
  try {
    if (fs.existsSync(REPLAY_STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(REPLAY_STATE_FILE, 'utf8'));
      replayState = { ...replayState, ...data };
      log(`📼 Replay state loaded: ${replayState.totalReplayed} historical predictions`);
    }
  } catch { /* start fresh */ }
}

function saveReplayState() {
  try {
    mkdirSync(join(__dirname, '../data'), { recursive: true });
    writeFileSync(REPLAY_STATE_FILE, JSON.stringify(replayState, null, 2));
  } catch { /* non-critical */ }
}

function recordReplayResult(archetype, sector, tfLabel, timestamp, correct) {
  replayState.totalReplayed++;
  if (correct) replayState.totalCorrect++;

  // By archetype
  if (!replayState.byArchetype[archetype]) replayState.byArchetype[archetype] = { n: 0, correct: 0 };
  replayState.byArchetype[archetype].n++;
  if (correct) replayState.byArchetype[archetype].correct++;

  // By sector
  if (!replayState.bySector[sector]) replayState.bySector[sector] = { n: 0, correct: 0 };
  replayState.bySector[sector].n++;
  if (correct) replayState.bySector[sector].correct++;

  // By timeframe
  if (!replayState.byTimeframe[tfLabel]) replayState.byTimeframe[tfLabel] = { n: 0, correct: 0 };
  replayState.byTimeframe[tfLabel].n++;
  if (correct) replayState.byTimeframe[tfLabel].correct++;

  // By day of week (0=Sun, 6=Sat)
  const dt = new Date(timestamp * 1000);
  const dow = dt.getUTCDay().toString();
  if (!replayState.byDayOfWeek[dow]) replayState.byDayOfWeek[dow] = { n: 0, correct: 0 };
  replayState.byDayOfWeek[dow].n++;
  if (correct) replayState.byDayOfWeek[dow].correct++;

  // By hour of day (UTC)
  const hour = dt.getUTCHours().toString();
  if (!replayState.byHourOfDay[hour]) replayState.byHourOfDay[hour] = { n: 0, correct: 0 };
  replayState.byHourOfDay[hour].n++;
  if (correct) replayState.byHourOfDay[hour].correct++;
}

function printReplayReport() {
  const { totalReplayed: n, totalCorrect: c, byArchetype, bySector, byTimeframe, byDayOfWeek, byHourOfDay } = replayState;
  if (n === 0) return;

  const pct = (k, t) => t > 0 ? (k / t * 100).toFixed(1) + '%' : 'N/A';
  const sortByAcc = (obj) => Object.entries(obj).sort((a, b) => (b[1].n > 10 ? b[1].correct / b[1].n : 0) - (a[1].n > 10 ? a[1].correct / a[1].n : 0));

  log('');
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║          HISTORICAL REPLAY ACCURACY REPORT                  ║');
  log(`║  Total: ${n.toLocaleString()} replayed | ${pct(c, n)} correct                    ║`);
  log('╠══════════════════════════════════════════════════════════════╣');

  // Top archetypes
  log('║ BY ARCHETYPE:');
  for (const [arch, s] of sortByAcc(byArchetype).slice(0, 10)) {
    const acc = pct(s.correct, s.n);
    const icon = s.n >= 20 && s.correct / s.n > 0.5 ? '🟢' : s.n >= 20 && s.correct / s.n < 0.3 ? '🔴' : '⚪';
    log(`║   ${icon} ${arch.padEnd(30)} ${acc.padStart(6)} (n=${s.n})`);
  }

  // By sector
  log('║ BY SECTOR:');
  for (const [sec, s] of sortByAcc(bySector)) {
    log(`║   ${sec.padEnd(20)} ${pct(s.correct, s.n).padStart(6)} (n=${s.n})`);
  }

  // By timeframe
  log('║ BY TIMEFRAME:');
  for (const [tf, s] of sortByAcc(byTimeframe)) {
    log(`║   ${tf.padEnd(15)} ${pct(s.correct, s.n).padStart(6)} (n=${s.n})`);
  }

  // By day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  log('║ BY DAY OF WEEK:');
  for (const [d, s] of Object.entries(byDayOfWeek).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    log(`║   ${dayNames[parseInt(d)].padEnd(10)} ${pct(s.correct, s.n).padStart(6)} (n=${s.n})`);
  }

  // Best/worst hours
  const hourEntries = Object.entries(byHourOfDay).filter(([, s]) => s.n >= 5).sort((a, b) => (b[1].correct / b[1].n) - (a[1].correct / a[1].n));
  if (hourEntries.length > 0) {
    log('║ BEST HOURS (UTC):');
    for (const [h, s] of hourEntries.slice(0, 5)) {
      log(`║   ${h.padStart(2, '0')}:00  ${pct(s.correct, s.n).padStart(6)} (n=${s.n})`);
    }
  }

  log('╚══════════════════════════════════════════════════════════════╝');
  log('');
}

/**
 * Historical Replay Cycle — runs when markets are closed for specific asset classes.
 * v30.2: Smart routing — can replay just stocks (after-hours) or all symbols (weekends).
 * Fetches past candle data, slides a prediction window through it,
 * generates grid predictions, and resolves against known future prices.
 * Cross-references replay patterns with today's live conditions.
 * @param {'stocks_only'|'commodities_only'|'all'} mode - Which symbols to replay
 */
async function historicalReplayCycle(mode = 'all') {
  const replaySymbols = mode === 'stocks_only' ? REPLAY_STOCK_SYMBOLS
    : mode === 'commodities_only' ? REPLAY_COMMODITY_SYMBOLS
    : REPLAY_ALL_SYMBOLS;

  replayState.cycleCount++;
  const lookbackIdx = (replayState.cycleCount - 1) % REPLAY_LOOKBACK_DAYS.length;
  const lookbackDays = REPLAY_LOOKBACK_DAYS[lookbackIdx];
  const symbolIdx = (replayState.cycleCount - 1) % replaySymbols.length;
  const symbol = replaySymbols[symbolIdx];
  const sector = getSector(symbol);

  // Pick a timeframe to replay (rotate through them)
  const tfIdx = Math.floor((replayState.cycleCount - 1) / replaySymbols.length) % TIMEFRAMES.length;
  const tf = TIMEFRAMES[tfIdx];

  log(`📼 Replay #${replayState.cycleCount} | ${symbol} (${sector}) | ${tf.label} | lookback=${lookbackDays}d | total=${replayState.totalReplayed}`);

  try {
    // Fetch historical candles — Yahoo supports range like '5d', '1mo', '3mo'
    const range = lookbackDays <= 5 ? '5d' : lookbackDays <= 30 ? '1mo' : '3mo';
    const candles = await fetchIntradayCandles(symbol, tf.candleInterval, range);
    if (!candles || candles.length < tf.minCandles + 5) {
      log(`📼 Replay: insufficient candles for ${symbol} ${tf.label} (got ${candles?.length || 0})`);
      return;
    }

    // Determine resolution window in candle count
    // e.g., for 'medium' (15m candles, 2h resolution) → 8 candles ahead
    const candleIntervalMs = {
      '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
      '1h': 3600000, '1d': 86400000,
    }[tf.candleInterval] || 300000;
    const resolutionCandles = Math.max(1, Math.round(tf.resolutionMs / candleIntervalMs));

    // Slide window: for each position, use candles[0..i] as input, candles[i+resolution] as outcome
    let replayed = 0;
    let correct = 0;
    const maxWindows = Math.min(20, candles.length - tf.minCandles - resolutionCandles); // Cap at 20 per cycle

    for (let i = tf.minCandles; i < tf.minCandles + maxWindows && i + resolutionCandles < candles.length; i++) {
      const windowCandles = candles.slice(Math.max(0, i - 50), i); // Up to 50 candles as input
      if (windowCandles.length < tf.minCandles) continue;

      const entryPrice = windowCandles[windowCandles.length - 1].close;
      const exitPrice = candles[i + resolutionCandles - 1]?.close;
      if (!entryPrice || !exitPrice || entryPrice <= 0) continue;

      // Run the SAME grid prediction pipeline as live trading
      const priceData = { symbol, price: entryPrice, change: 0 };
      const pred = generateGridPrediction(symbol, windowCandles, priceData, null, tf.label);
      if (!pred || !pred.direction || pred.direction === 'flat' || pred.direction === 'neutral') continue;

      // Resolve: did the price move in the predicted direction?
      const actualMove = (exitPrice - entryPrice) / entryPrice;
      const threshold = 0.001; // 0.1% minimum move
      const actualDir = actualMove > threshold ? 'up' : actualMove < -threshold ? 'down' : 'flat';
      const isCorrect = pred.direction === actualDir;

      replayed++;
      if (isCorrect) correct++;

      const archetype = pred.archetype || 'unknown';
      const timestamp = windowCandles[windowCandles.length - 1].timestamp || 0;
      recordReplayResult(archetype, sector, tf.label, timestamp, isCorrect);

      // v30.2: Record replay signature for cross-reference with today's live conditions
      replayState.recentReplaySignatures.push({
        symbol, archetype, direction: pred.direction, correct: isCorrect,
        confidence: pred.confidence, sector, timeframe: tf.label,
        lookbackDays, actualMove, timestamp: Date.now(),
      });
      if (replayState.recentReplaySignatures.length > MAX_RECENT_REPLAY_SIGS) {
        replayState.recentReplaySignatures = replayState.recentReplaySignatures.slice(-MAX_RECENT_REPLAY_SIGS);
      }

      // Save to DB for the calibration system to learn from (tagged as replay)
      // Uses same column names as the live INSERT (line ~2387)
      if (sqlPool && replayed <= 10) { // Limit DB writes to 10 per cycle
        try {
          await sqlPool.query(
            `INSERT INTO market_prediction_attempts (
              symbol, time_horizon, prediction_source, predicted_direction, confidence,
              archetype, price_at_prediction, data_source, prediction_metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING`,
            [
              symbol,
              tf.timeHorizon,
              'historical_replay',
              pred.direction,
              pred.confidence,
              archetype,
              entryPrice,
              'yahoo_historical',
              JSON.stringify({
                source: 'historical_replay',
                replay_cycle: replayState.cycleCount,
                lookback_days: lookbackDays,
                sector: sector,
                exit_price: exitPrice,
                actual_direction: actualDir,
                replay_correct: isCorrect,
                base_archetype: pred.baseArchetype || null,
                tactical_override: pred.tacticalOverride?.pattern || null,
                chess_bridge: pred.chessBridge ? { archetype: pred.chessBridge.chessArchetype, accuracy: pred.chessBridge.accuracy } : null,
                window_timestamp: timestamp,
              }),
            ]
          );
        } catch (dbErr) {
          if (dbErr.code !== '23505') { // Ignore dupes
            log(`📼 Replay DB error: ${dbErr.message?.substring(0, 100)}`, 'warn');
          }
        }
      }
    }

    const acc = replayed > 0 ? (correct / replayed * 100).toFixed(1) : 'N/A';
    log(`📼 Replay result: ${symbol} ${tf.label} | ${correct}/${replayed} = ${acc}% | cumulative: ${replayState.totalCorrect}/${replayState.totalReplayed} = ${replayState.totalReplayed > 0 ? (replayState.totalCorrect / replayState.totalReplayed * 100).toFixed(1) : 'N/A'}%`);

    // Print full report periodically
    if (replayState.cycleCount % REPLAY_REPORT_INTERVAL === 0) {
      printReplayReport();
    }

    // Persist state
    saveReplayState();

  } catch (err) {
    log(`📼 Replay error: ${err.message}`, 'warn');
  }
}

// ─── REPLAY SIMILARITY CROSS-REFERENCE (v30.2) ──────────────────────────────
// When live predictions fire, check if recent replay patterns match.
// "Cross reference any similarities to today" — if overnight replay found
// that archetype X on symbol Y was 70% accurate in the last 5 days,
// and today's live prediction is archetype X on symbol Y, boost confidence.
function getReplaySimilaritySignal(symbol, archetype, direction, sector) {
  const sigs = replayState.recentReplaySignatures;
  if (!sigs || sigs.length < 10) return null; // Need minimum data

  // Match 1: Exact symbol + archetype (strongest signal)
  const exactMatches = sigs.filter(s => s.symbol === symbol && s.archetype === archetype);
  // Match 2: Same sector + archetype (broader signal)
  const sectorMatches = sigs.filter(s => s.sector === sector && s.archetype === archetype);
  // Match 3: Same symbol + direction (directional signal)
  const dirMatches = sigs.filter(s => s.symbol === symbol && s.direction === direction);

  const calcAcc = (matches) => {
    if (matches.length < 3) return null;
    const correct = matches.filter(m => m.correct).length;
    return { accuracy: correct / matches.length, n: matches.length };
  };

  const exact = calcAcc(exactMatches);
  const bySector = calcAcc(sectorMatches);
  const byDir = calcAcc(dirMatches);

  // Pick the best signal with enough data
  let bestSignal = null;
  let bestType = null;
  if (exact && exact.n >= 3) { bestSignal = exact; bestType = 'exact'; }
  else if (bySector && bySector.n >= 5) { bestSignal = bySector; bestType = 'sector'; }
  else if (byDir && byDir.n >= 5) { bestSignal = byDir; bestType = 'direction'; }

  if (!bestSignal) return null;

  // Convert accuracy to confidence multiplier:
  // >60% → boost (1.0-1.15), 40-60% → neutral (0.95-1.05), <40% → dampen (0.80-0.95)
  const acc = bestSignal.accuracy;
  const multiplier = acc > 0.60 ? 1.0 + (acc - 0.60) * 0.375  // 60%→1.0, 80%→1.075, 100%→1.15
    : acc < 0.40 ? 0.80 + acc * 0.375                          // 0%→0.80, 20%→0.875, 40%→0.95
    : 0.95 + (acc - 0.40) * 0.5;                               // 40%→0.95, 50%→1.0, 60%→1.05

  return {
    multiplier: Math.round(multiplier * 1000) / 1000,
    accuracy: Math.round(acc * 1000) / 1000,
    n: bestSignal.n,
    matchType: bestType,
  };
}

// ─── MULTI-TIMEFRAME CANDLE CACHE ────────────────────────────────────────────
// Slower timeframes don't need fresh candles every 5-min cycle.
// candleRefreshCycles: how often to re-fetch for each timeframe
const CANDLE_REFRESH = { scalp: 1, short: 1, scalp_1h: 1, medium: 2, swing: 15, daily: 60 };
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

  // v30.2: SMART REPLAY — live data ALWAYS takes priority, replay fills dead time.
  // Priority: live predictions > replay learning > idle
  //   - All markets closed (weekends): full replay on ALL symbols
  //   - Stocks closed, forex open (weekday evenings/mornings): replay STOCKS while live commodities run
  //   - All open: no replay, all live
  const stocksOpen = isStockMarketOpen();
  const forexOpen = isForexOpen();
  const allClosed = isAllMarketsClosed();

  if (allClosed) {
    log(`📼 All markets closed — full replay mode (cycle #${cycleCount})`);
    await historicalReplayCycle('all');
  } else if (!stocksOpen && forexOpen) {
    // Weekday after-hours/pre-market: stocks are dead, replay them while commodities trade live
    log(`📼 Stocks closed — replaying stocks while commodities trade live (cycle #${cycleCount})`);
    await historicalReplayCycle('stocks_only');
  }

  const activeSymbols = getActiveSymbols();
  const replayMode = allClosed ? '📼 REPLAY ALL' : (!stocksOpen && forexOpen) ? '📼 REPLAY stocks + LIVE commodities' : null;
  const marketLabel = stocksOpen ? 'All markets' : forexOpen ? (replayMode || 'Forex+Commodities') : allClosed ? '📼 REPLAY + Crypto' : 'Crypto only';

  log(`Cycle #${cycleCount} | ${marketLabel} (${activeSymbols.length} symbols × ${TIMEFRAMES.length} timeframes) | Predictions: ${totalPredictions} | Resolved: ${totalResolved} | Correct: ${totalCorrect} | Acc: ${totalResolved > 0 ? (totalCorrect / totalResolved * 100).toFixed(1) + '%' : 'N/A'} | Audit: ${auditTrailTotal}`);

  // Self-learning: refresh archetype weights, thresholds, and calibration periodically
  if (cycleCount > 1 && cycleCount % WEIGHT_REFRESH_INTERVAL === 1) {
    await refreshLearnedWeights();
    await refreshSymbolAccuracy();
    await refreshLearnedDirThresholds();
    await refreshTacticalCalibration();
    await refreshReverseSignals();
    // Market entity intelligence: per-symbol, per-archetype, per-resonance learning
    try {
      const resilientQ = async (q, v) => sqlPool ? sqlPool.query(q, v) : null;
      await refreshMarketIntelligence(resilientQ);
    } catch (e) { log(`Market intel refresh: ${e.message}`, 'warn'); }
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
  // v17.8: Pre-populate archetype×phase temporal intelligence cache
  await withTimeout(buildArchetypePhaseIntelligence(), 10000);
  // v17.9: Pre-populate puzzle tactical likelihood intelligence cache
  await withTimeout(buildPuzzleTacticalIntelligence(), 10000);
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
    if (!shouldPredictSymbol(symbol) || shouldSkipSymbol(symbol)) {
      skippedLowSignal++;
      continue;
    }

    for (const tf of TIMEFRAMES) {
      // v32: Kill daily unconditionally — 27.2% accuracy, below random.
      // Re-enable only when self-learning pushes verified daily acc > 40%.
      if (tf.label === 'daily') continue;

      // Get cached candles for this symbol+timeframe
      const candles = candleCache.get(`${symbol}|${tf.label}`);
      
      // Get timeframe-matched chess resonance for this prediction
      const tfChess = tfChessSignals[tf.label] || chessSignal;
      
      // PRIMARY: Universal grid prediction with timeframe-specific candles
      let pred = null;
      if (candles && candles.length >= tf.minCandles) {
        const symOpts = optionsData?.get(symbol) || null;
        pred = generateGridPrediction(symbol, candles, priceData, symOpts, tf.label);
        if (pred) pred.timeframe = tf.label;
      }
      
      // FALLBACK for scalp/short only: Legacy ensemble if grid fails
      if (!pred && (tf.label === 'scalp' || tf.label === 'short')) {
        pred = generatePrediction(symbol, priceData, allPrices, null);
        if (pred) pred.timeframe = tf.label;
      }
      if (!pred) continue;

      // v31 NUCLEAR PHASE CALIBRATION: Derived from NPPAD tri-phase benchmark.
      // Late-phase temporal data carries ~50% of discriminative signal (vs early=15%, mid=35%).
      // Applied as mild per-timeframe confidence scaler — validated by cross-domain convergence.
      // scalp=early(0.90x) | medium=mid(1.00x baseline) | swing=late-mid(1.08x) | daily=late(1.15x)
      // Constrained by existing accuracyCeiling — can't inflate beyond empirical archetype performance.
      const NUCLEAR_PHASE_W = { 'scalp_1h': 0.90, 'medium': 1.00, 'swing': 1.08, 'daily': 1.15 };
      const nuclearPhaseMultiplier = NUCLEAR_PHASE_W[tf.label] || 1.00;
      pred.confidence = Math.min(0.85, pred.confidence * nuclearPhaseMultiplier);
      pred.nuclearPhaseCalibration = nuclearPhaseMultiplier;

      // v12.1: CONFIDENCE DAMPENING replaces hard blacklist
      // Like chess poison zones: don't block predictions, dampen confidence & tag for learning.
      // The system needs ALL data to learn sector×archetype patterns.
      // Hard-blocked archetypes were 85% of volume — killing the feedback loop.
      // v32: Remaining penalty archetypes — dead ones now killed upstream.
      // Only apply dampening to borderline patterns (not dead ones).
      const ARCHETYPE_PENALTY = {
        'castling_reposition': 0.30,     // 10.2% (25/245) — keep dampened so it can learn
        'bullish_momentum': 0.50,        // 18.3% — below random but not dead
        'regime_shift_down': 0.65,       // 30.9% — borderline
        // All others: no penalty (above 30% or dead-killed upstream)
        // blunder_free_queen: NO PENALTY — 79.0% accuracy, our BEST pattern
        // false_breakout: NO PENALTY — 60.0% accuracy
        // trap_queen_sac: NO PENALTY — 38.8% accuracy
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

          // v15: DISABLED confidence modification from chess board confirmation.
          // Data: chess_confirmed=true → 20.9% accuracy, chess_confirmed=null → 33.9%.
          // The directional confirmation is ANTI-CORRELATED with market accuracy.
          // Keep tracking for learning, but DO NOT modify confidence.
          pred.chessConfirmed = (predDir === boardDirNorm && boardDirNorm !== 'neutral') ? true :
            (predDir !== 'neutral' && boardDirNorm !== 'neutral' && predDir !== boardDirNorm) ? false : null;
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

        // ...

        // ─── CHESS CONSENSUS: Track but DO NOT modify confidence ────────────
        // v15: DISABLED consensus confirmation boost.
        // Data: chess=bullish+market=bullish → 4.0% accuracy (catastrophic)
        //       chess=null+market=bullish → 59.7% accuracy (excellent)
        // The consensus signal is ANTI-CORRELATED with market accuracy.
        // Keep tracking in metadata for future learning, but stop poisoning confidence.
        if (chessConsensus && chessConsensus.direction !== 'neutral') {
          pred.chessConsensus = chessConsensus;
          // NO confidence modification — data proves this hurts predictions
        }

        // v15: ARCHETYPE RESONANCE BOOST — this IS the real chess→market edge
        // sacrificial_queenside_break: 67.7% on 1,462 predictions
        // The archetype CLASSIFICATION has signal; the directional CONFIRMATION does not.
        const CHESS_RESONANCE_EDGE = {
          sacrificial_queenside_break: 1.15,   // 67.7% — strong edge
          sacrificial_kingside_assault: 1.05,  // 45.5% — modest edge
          central_domination: 1.02,            // 34.7% — slight edge
          positional_squeeze: 0.97,            // 32.9% — neutral
          closed_maneuvering: 0.97,            // 32.5% — neutral
          queenside_expansion: 0.93,           // 29.7% — slight drag
          kingside_attack: 0.90,               // 27.5% — drag
          sacrificial_attack: 0.90,            // 27.5% — drag
        };
        const resonanceArch = pred.chessBridge?.chessArchetype || null;
        if (resonanceArch && CHESS_RESONANCE_EDGE[resonanceArch]) {
          const rBoost = CHESS_RESONANCE_EDGE[resonanceArch];
          pred.confidence = Math.min(0.85, pred.confidence * rBoost);
        }
        pred.confidence = Math.min(pred.confidence, maxCredibleConf);
      } catch (boardErr) {
        // Chess-market board is non-critical
      }

      // ── v30: TEMPORAL PARABLE CONFIRMATION ──────────────────────────────
      // The three-domain interlink: chess + music + market temporal agreement
      // When all three tell the same story → parable → confidence boost
      // When they disagree → discord → confidence dampen
      // This is the cyclical confirmation that creates real edge
      try {
        const parableResult = await getTemporalParableSignal(pred.direction, pred.archetype, priceData);
        if (parableResult && parableResult.multiplier !== 1.0) {
          pred.confidence = Math.max(0.15, Math.min(0.90, pred.confidence * parableResult.multiplier));
          pred.parableConfirmation = {
            multiplier: parableResult.multiplier,
            agrees: parableResult.agrees,
            disagrees: parableResult.disagrees,
            domains: parableResult.parable?.activeDomainCount || 0,
            direction: parableResult.parable?.direction || 'neutral',
            strength: parableResult.parable?.parableStrength || 0,
          };
        }
      } catch (parableErr) {
        // Parable is non-critical — prediction still valid without it
      }

      // ── v30: PHOTONIC INTERFERENCE — feed frame + coherence gate ──────
      // Every prediction feeds a frame into the interference stack.
      // The coherence multiplier adjusts confidence based on how consistent
      // this signature is with the historical pattern of correct predictions.
      try {
        if (pred.market_conditions && interferenceEngine.totalFrames >= 50) {
          const coherenceMult = interferenceEngine.getCoherenceMultiplier({
            quadrantProfile: {
              q1: pred.market_conditions.momentum || 0,
              q2: pred.market_conditions.volatility || 0,
              q3: pred.market_conditions.gridIntensity || 0,
              q4: pred.market_conditions.dailyChange || 0,
              q5: 0, q6: 0, q7: 0, q8: 0,
            },
            temporalFlow: { early: 0, mid: 0, late: pred.market_conditions.dailyChange || 0 },
            intensity: pred.market_conditions.gridIntensity || 10,
            direction: pred.direction === 'up' ? 'positive' : pred.direction === 'down' ? 'negative' : 'contested',
          });
          pred.confidence = Math.max(0.10, Math.min(0.90, pred.confidence * coherenceMult));
          pred.photonicCoherence = Math.round(coherenceMult * 1000) / 1000;
        }
        // Feed this prediction as a frame (outcome unknown yet — will be fed on resolution)
        interferenceEngine.addFrame({
          quadrantProfile: {
            q1: pred.market_conditions?.momentum || 0,
            q2: pred.market_conditions?.volatility || 0,
            q3: pred.market_conditions?.gridIntensity || 0,
            q4: pred.market_conditions?.dailyChange || 0,
            q5: 0, q6: 0, q7: 0, q8: 0,
          },
          temporalFlow: { early: 0, mid: 0, late: pred.market_conditions?.dailyChange || 0 },
          intensity: pred.market_conditions?.gridIntensity || 10,
          direction: pred.direction === 'up' ? 'positive' : pred.direction === 'down' ? 'negative' : 'contested',
        }, { domain: 'market', archetype: pred.archetype, correct: null, timestamp: Date.now() });
      } catch (photErr) { /* non-critical */ }

      // ── v30.2: REPLAY SIMILARITY — cross-reference overnight learning ──────
      // If overnight replay found patterns matching this prediction, adjust confidence.
      try {
        const replaySig = getReplaySimilaritySignal(symbol, pred.archetype, pred.direction, getSector(symbol));
        if (replaySig) {
          pred.confidence = Math.max(0.10, Math.min(0.90, pred.confidence * replaySig.multiplier));
          pred.replaySimilarity = replaySig;
        }
      } catch (repErr) { /* non-critical */ }

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
        const photTag = pred.photonicCoherence ? ` | 🔬×${pred.photonicCoherence}` : '';
        const replayTag = pred.replaySimilarity ? ` | 📼×${pred.replaySimilarity.multiplier}(${pred.replaySimilarity.matchType},n=${pred.replaySimilarity.n})` : '';
        log(`${pred.direction.toUpperCase()} ${symbol} @ $${pred.entryPrice.toFixed(2)} | ${tf.label}/${tf.timeHorizon} | conf: ${(pred.confidence * 100).toFixed(0)}% | arch: ${pred.archetype}${src}${tacticalTag}${photTag}${replayTag}`, 'trade');
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

  // ── v30: PHOTONIC INTERFERENCE — seed from DB + feed resolved outcomes ──
  // Periodically seed the interference engine from the DB so it has
  // correct/incorrect outcome data to compute discrepancies.
  if (resolutionCycleCount % INTERFERENCE_SEED_INTERVAL === 0 || (interferenceEngine.totalFrames < 100 && sqlPool)) {
    try {
      const marketLoaded = await loadFramesFromDB(sqlPool, interferenceEngine, { domain: 'market', limit: 5000 });
      const chessLoaded = await loadFramesFromDB(sqlPool, interferenceEngine, { domain: 'chess', limit: 5000 });
      if (marketLoaded + chessLoaded > 0) {
        log(`🔬 Photonic interference seeded: +${marketLoaded} market +${chessLoaded} chess frames (total: ${interferenceEngine.totalFrames})`);
        // Persist to disk after seeding
        persistToFile(INTERFERENCE_FILE, interferenceEngine.serialize());
      }
    } catch (seedErr) {
      log(`🔬 Interference seed error: ${seedErr.message}`, 'warn');
    }
  }

  // Periodic interference report with strategy discovery
  if (resolutionCycleCount % INTERFERENCE_REPORT_INTERVAL === 0 && interferenceEngine.totalFrames >= 50) {
    try {
      const pattern = interferenceEngine.computeInterferencePattern();
      printInterferenceReport(pattern);
      // Persist state after report
      persistToFile(INTERFERENCE_FILE, interferenceEngine.serialize());
    } catch (repErr) {
      log(`🔬 Interference report error: ${repErr.message}`, 'warn');
    }
  }
}

// ─── PHOTONIC INTERFERENCE REPORT + STRATEGY DISCOVERY ──────────────────────
// "Find the strategy within and which correlations to trust"
// The interference pattern reveals:
//   - BRIGHT SPOTS: cells where all predictions agree → trust these signals
//   - DARK SPOTS: cells where predictions cancel out → these are noise, ignore
//   - DISCREPANCIES: cells that differ between correct and incorrect → the EDGE
//   - CROSS-DOMAIN: where chess and market agree/disagree → trust agreements
function printInterferenceReport(pattern) {
  if (!pattern || pattern.error) return;

  log('');
  log('╔══════════════════════════════════════════════════════════════════════╗');
  log('║          🔬 PHOTONIC INTERFERENCE PATTERN REPORT                    ║');
  log(`║  Frames: ${pattern.totalFrames.toLocaleString()} | Correct: ${pattern.correctFrames} | Incorrect: ${pattern.incorrectFrames} | Acc: ${pattern.overallAccuracy ? (pattern.overallAccuracy * 100).toFixed(1) + '%' : 'N/A'}  ║`);
  log('╠══════════════════════════════════════════════════════════════════════╣');

  // BRIGHT SPOTS — cells to trust
  log('║ ☀️  BRIGHT SPOTS (constructive interference — TRUST these):');
  for (const cell of pattern.coherenceMap.filter(c => c.type === 'BRIGHT')) {
    log(`║   ☀️  ${cell.cell.padEnd(18)} coherence=${cell.coherence.toFixed(3)} mean=${cell.mean.toFixed(4)} σ=${cell.stddev.toFixed(4)}`);
  }

  // DARK SPOTS — cells that are noise
  log('║ 🌑 DARK SPOTS (destructive interference — IGNORE these):');
  for (const cell of pattern.coherenceMap.filter(c => c.type === 'DARK')) {
    log(`║   🌑 ${cell.cell.padEnd(18)} coherence=${cell.coherence.toFixed(3)} mean=${cell.mean.toFixed(4)} σ=${cell.stddev.toFixed(4)}`);
  }

  // DISCREPANCIES — the gold: where correct differs from incorrect
  if (pattern.topDiscrepancies.length > 0) {
    log('║ 💎 DISCREPANCIES (correct ≠ incorrect — THIS IS THE EDGE):');
    for (const d of pattern.topDiscrepancies) {
      const arrow = d.signal === 'correct_is_higher' ? '↑' : d.signal === 'correct_is_lower' ? '↓' : '=';
      log(`║   💎 ${d.cell.padEnd(18)} effect=${d.effectSize.toFixed(3)} ${d.significance} | correct=${d.correctMean.toFixed(4)} ${arrow} incorrect=${d.incorrectMean.toFixed(4)}`);
    }
  }

  // TEMPORAL PHASE SIGNAL
  if (pattern.phaseAnalysis && Object.keys(pattern.phaseAnalysis).length > 0) {
    log('║ ⏱️  TEMPORAL PHASE SIGNAL:');
    for (const [phase, data] of Object.entries(pattern.phaseAnalysis)) {
      log(`║   ⏱️  ${phase.padEnd(8)} effect=${data.effectSize.toFixed(3)} ${data.signalStrength} | correct=${data.correctMean.toFixed(4)} incorrect=${data.incorrectMean.toFixed(4)} → ${data.recommendation}`);
    }
  }

  // ARCHETYPE COHERENCE — which archetypes produce reliable signals
  if (pattern.archetypePatterns.length > 0) {
    log('║ 🎯 ARCHETYPE COHERENCE (which patterns to trust):');
    for (const a of pattern.archetypePatterns.slice(0, 8)) {
      const accStr = a.accuracy !== null ? `${(a.accuracy * 100).toFixed(1)}%` : 'N/A';
      const icon = a.type === 'COHERENT' ? '🟢' : a.type === 'PARTIAL' ? '🟡' : '🔴';
      log(`║   ${icon} ${a.archetype.padEnd(28)} ${a.type.padEnd(11)} coh=${a.coherence.toFixed(3)} acc=${accStr} n=${a.n} | blind_spot=${a.maxDiscrepancyCell}`);
    }
  }

  // CROSS-DOMAIN — chess vs market agreement
  if (pattern.crossDomain.length > 0) {
    log('║ 🌐 CROSS-DOMAIN INTERFERENCE (which correlations to trust):');
    for (const cd of pattern.crossDomain) {
      const icon = cd.type === 'CONSTRUCTIVE' ? '✅' : cd.type === 'PARTIAL' ? '⚠️' : '❌';
      log(`║   ${icon} ${cd.domains.join(' × ').padEnd(20)} ${cd.type} (${cd.agreement}% agreement)`);
      if (cd.disagreementCells.length > 0) {
        for (const dc of cd.disagreementCells.slice(0, 3)) {
          log(`║      ↳ ${dc.cell}: ${cd.domains[0]}=${dc.domain1Mean} vs ${cd.domains[1]}=${dc.domain2Mean} (Δ=${dc.delta})`);
        }
      }
    }
  }

  // STRATEGY DISCOVERY SUMMARY
  log('╠══════════════════════════════════════════════════════════════════════╣');
  log('║ 🧠 STRATEGY DISCOVERY:');
  log(`║   ${pattern.summary.recommendation}`);
  log(`║   Reliable cells: ${pattern.summary.brightCells}/13 | Noise cells: ${pattern.summary.darkCells}/13`);
  log(`║   Most reliable: ${pattern.summary.mostReliableCell} | Least reliable: ${pattern.summary.leastReliableCell}`);
  log(`║   Strongest temporal phase: ${pattern.summary.strongestPhase}`);
  
  // Actionable: which archetypes to trust for trading
  const trustworthy = pattern.archetypePatterns.filter(a => a.type === 'COHERENT' && a.accuracy !== null && a.accuracy > 0.40);
  const avoid = pattern.archetypePatterns.filter(a => a.type === 'INCOHERENT' || (a.accuracy !== null && a.accuracy < 0.20));
  if (trustworthy.length > 0) {
    log(`║   ✅ TRUST: ${trustworthy.map(a => `${a.archetype}(${(a.accuracy*100).toFixed(0)}%)`).join(', ')}`);
  }
  if (avoid.length > 0) {
    log(`║   ❌ AVOID: ${avoid.map(a => `${a.archetype}(${a.accuracy !== null ? (a.accuracy*100).toFixed(0) + '%' : 'N/A'})`).join(', ')}`);
  }

  log('╚══════════════════════════════════════════════════════════════════════╝');
  log('');
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

// Load historical replay state (persists across restarts)
loadReplayState();

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
