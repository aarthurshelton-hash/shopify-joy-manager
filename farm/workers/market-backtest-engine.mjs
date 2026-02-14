/**
 * Market Backtest Engine v1.0
 * 
 * Replays historical market data through the SAME prediction pipeline used live.
 * Each historical window is treated as a fresh "live moment" — the engine has no
 * future information. Predictions are resolved instantly against known outcomes.
 * 
 * Results written to market_prediction_attempts with prediction_source='backtest'
 * so all self-learning systems (entity intelligence, archetype weights, tactical
 * calibration) can learn from historical data immediately.
 * 
 * Usage: node farm/workers/market-backtest-engine.mjs [--symbols=AAPL,MSFT] [--days=365] [--interval=1d]
 */

import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import {
  processMarketThroughGrid,
  classifyMarketArchetype,
  predictFromMarketSignature,
  detectTacticalPatterns,
  getTacticalDirectionOverride,
  computePieceTierProfile,
} from './domain-adapters/market-adapter.mjs';
import {
  refreshMarketIntelligence,
  getMarketEntityBoost,
} from './market-entity-intelligence.mjs';

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const args = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace('--', '').split('=');
  acc[k] = v;
  return acc;
}, {});

const DEFAULT_SYMBOLS = ['AMD', 'AMZN', 'MSFT', 'NVDA', 'AAPL', 'GOOGL', 'META', 'SPY', 'QQQ',
  'GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'BTC-USD', 'ETH-USD', 'SOL-USD'];

const SYMBOLS = (args.symbols || '').split(',').filter(Boolean).length > 0
  ? args.symbols.split(',')
  : DEFAULT_SYMBOLS;

const WINDOW_SIZE = parseInt(args.window || '30');  // Candles per prediction window
const LOOKAHEAD = parseInt(args.lookahead || '1');   // Candles ahead to resolve

// Backtest timeframes: what candle interval + range to fetch from Yahoo
const BACKTEST_CONFIGS = [
  { label: 'daily',   interval: '1d',  range: '2y',  timeHorizon: '1d',  horizonMs: 86400000 },
  { label: 'hourly',  interval: '1h',  range: '60d', timeHorizon: '2h',  horizonMs: 7200000 },
];

const SECTOR_MAP = {
  'AMD': 'tech', 'NVDA': 'tech', 'MSFT': 'tech', 'GOOGL': 'tech', 'META': 'tech', 'AAPL': 'tech', 'AMZN': 'tech',
  'SPY': 'indices', 'QQQ': 'indices',
  'GC=F': 'commodities', 'SI=F': 'commodities', 'CL=F': 'energy', 'NG=F': 'energy', 'HG=F': 'commodities',
  'BTC-USD': 'crypto', 'ETH-USD': 'crypto', 'SOL-USD': 'crypto',
};

// ═══════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════

const sqlPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

async function query(q, v) { return sqlPool.query(q, v); }

// ═══════════════════════════════════════════════════════════
// YAHOO FINANCE — HISTORICAL DATA
// ═══════════════════════════════════════════════════════════

async function fetchHistoricalCandles(symbol, interval = '1d', range = '2y') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.log(`  ⚠ Yahoo ${res.status} for ${symbol}`); return null; }
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
      if (o != null && h != null && l != null && c != null && c > 0) {
        candles.push({ open: o, high: h, low: l, close: c, volume: v || 0, timestamp: timestamps[i] });
      }
    }
    return candles.length >= WINDOW_SIZE + LOOKAHEAD ? candles : null;
  } catch (err) {
    console.log(`  ⚠ Fetch error ${symbol}: ${err.message}`);
    return null;
  }
}

// Rate limiter — Yahoo has limits
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════
// PREDICTION ENGINE (same logic as live worker)
// ═══════════════════════════════════════════════════════════

// Archetype accuracy from production data (same as market-prediction-worker v15)
const ARCHETYPE_ACCURACY = {
  false_breakout: 0.60, bearish_momentum: 0.486, cultural_harmony: 0.483,
  gap_continuation_up: 0.442, trap_queen_sac: 0.418, overbought_fade: 0.405,
  gap_continuation_down: 0.364, institutional_distribution: 0.331,
  castling_reposition: 0.293, oversold_bounce: 0.292,
  institutional_accumulation: 0.291, mean_reversion_down: 0.245,
  regime_shift_down: 0.235, blunder_free_queen: 0.189,
  bullish_momentum: 0.172, mean_reversion_up: 0.164,
};

function generateBacktestPrediction(symbol, candles) {
  if (!candles || candles.length < 10) return null;

  const result = processMarketThroughGrid(candles, 0.1, null);
  if (!result) return null;

  const { signature, features } = result;
  const archetype = classifyMarketArchetype(signature);
  const pred = predictFromMarketSignature(signature, archetype, null); // No learned weights for pure backtest

  // Baseline: momentum continuation
  const recentFeatures = features.slice(-5);
  const recentMom = recentFeatures.reduce((s, f) => s + (f.momentum_5 || 0), 0) / recentFeatures.length;
  const baselineDir = recentMom > 0.05 ? 'up' : recentMom < -0.05 ? 'down' : 'flat';

  // Tactical layer
  const tacticalResult = detectTacticalPatterns(features, signature);
  let finalDirection = pred.direction;
  let finalConfidence = pred.confidence;
  let tacticalOverride = null;

  if (tacticalResult.tactical) {
    const override = getTacticalDirectionOverride(tacticalResult.tactical, tacticalResult.detection, pred.direction);
    if (override.override) {
      finalDirection = override.direction;
      finalConfidence = Math.min(0.75, (override.confidence * 0.6) + (pred.confidence * 0.4));
      tacticalOverride = { pattern: tacticalResult.tactical, baseDirection: pred.direction, overrideDirection: override.direction };
    }
  }

  // Score spread gate
  const scoreSpread = Math.abs((pred.scores.up || 0) - (pred.scores.down || 0));
  if (!tacticalOverride && (scoreSpread < 0.10 || pred.confidence < 0.50)) {
    return null; // Flat — no prediction
  }

  // Archetype accuracy gating
  const finalArch = tacticalOverride ? tacticalResult.tactical : archetype;
  const archAccuracy = ARCHETYPE_ACCURACY[finalArch] || 0.33;
  const archMultiplier = Math.min(1.2, archAccuracy / 0.50);
  finalConfidence = Math.min(0.75, finalConfidence * archMultiplier);
  if (scoreSpread < 0.20) finalConfidence *= (scoreSpread / 0.20);

  // Piece-tier profile
  const pieceTier = computePieceTierProfile(features, null);
  if (pieceTier) {
    finalConfidence = Math.min(0.85, finalConfidence + pieceTier.coordinationBoost);
    if (pieceTier.netDirection !== 0 && Math.sign(pieceTier.netDirection) !== (finalDirection === 'up' ? 1 : -1)) {
      finalConfidence *= 0.85;
    }
  }

  if (finalDirection !== 'up' && finalDirection !== 'down') return null;

  return {
    symbol,
    direction: finalDirection,
    confidence: finalConfidence,
    archetype: finalArch,
    baseArchetype: archetype,
    baselineDirection: baselineDir,
    entryPrice: candles[candles.length - 1].close,
    predicted_magnitude: Math.abs(pred.scores.up - pred.scores.down) * 0.01,
    tacticalOverride,
    gridIntensity: signature.intensity,
    gridDirection: signature.direction,
    scoreSpread,
  };
}

// ═══════════════════════════════════════════════════════════
// RESOLUTION — immediate, since we know the future
// ═══════════════════════════════════════════════════════════

function resolveBacktestPrediction(pred, futureCandles, timeHorizon) {
  if (!futureCandles || futureCandles.length === 0) return null;

  const exitPrice = futureCandles[futureCandles.length - 1].close;
  const entryPrice = pred.entryPrice;
  const actualMove = (exitPrice - entryPrice) / entryPrice;

  // Direction thresholds per timeframe
  const thresholds = { '1d': 0.005, '2h': 0.002, '1h': 0.001, '4h': 0.003 };
  const threshold = thresholds[timeHorizon] || 0.003;

  const actualDirection = actualMove > threshold ? 'bullish' : actualMove < -threshold ? 'bearish' : 'neutral';
  const predictedDirection = pred.direction === 'up' ? 'bullish' : 'bearish';

  const epCorrect = predictedDirection === actualDirection;
  const baselineDirection = pred.baselineDirection === 'up' ? 'bullish' : pred.baselineDirection === 'down' ? 'bearish' : 'neutral';
  const baselineCorrect = baselineDirection === actualDirection;

  return {
    exitPrice,
    actualMove,
    actualDirection,
    epCorrect,
    baselineCorrect,
  };
}

// ═══════════════════════════════════════════════════════════
// DB WRITER — write resolved predictions to market_prediction_attempts
// ═══════════════════════════════════════════════════════════

async function writeBacktestResult(pred, resolution, config, timestamp) {
  const sigData = `backtest|${pred.symbol}|${pred.archetype}|${pred.entryPrice}|${timestamp}`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sigData));
  const signatureHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const predictedDirection = pred.direction === 'up' ? 'bullish' : 'bearish';

  try {
    await sqlPool.query(
      `INSERT INTO market_prediction_attempts 
       (symbol, time_horizon, prediction_source, predicted_direction, confidence, archetype, 
        signature_hash, target_move, price_at_prediction, baseline_direction, baseline_confidence,
        data_source, prediction_metadata, ep_correct, baseline_correct, actual_move, exit_price, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (signature_hash) DO NOTHING`,
      [
        pred.symbol,
        config.timeHorizon,
        'backtest',
        predictedDirection,
        Math.round(pred.confidence * 100),
        pred.archetype,
        signatureHash,
        pred.predicted_magnitude ? Math.round(pred.predicted_magnitude * 10000) / 100 : null,
        pred.entryPrice,
        pred.baselineDirection === 'up' ? 'bullish' : pred.baselineDirection === 'down' ? 'bearish' : 'neutral',
        50, // baseline confidence
        'yahoo_finance_historical',
        JSON.stringify({
          backtest: true,
          candle_interval: config.interval,
          timeframe_label: config.label,
          grid_intensity: pred.gridIntensity,
          grid_direction: pred.gridDirection,
          score_spread: pred.scoreSpread,
          tactical_override: pred.tacticalOverride,
          sector: SECTOR_MAP[pred.symbol] || 'unknown',
          timestamp: new Date(timestamp * 1000).toISOString(),
        }),
        resolution.epCorrect,
        resolution.baselineCorrect,
        Math.round(resolution.actualMove * 10000) / 100, // Basis points
        resolution.exitPrice,
        new Date(timestamp * 1000 + config.horizonMs).toISOString(),
      ]
    );
    return true;
  } catch (err) {
    if (err.code === '23505') return false; // Duplicate — skip
    if (err.message?.includes('column') && err.message?.includes('does not exist')) {
      // Some columns might not exist — fall back to core columns only
      try {
        await sqlPool.query(
          `INSERT INTO market_prediction_attempts 
           (symbol, time_horizon, prediction_source, predicted_direction, confidence, archetype, 
            signature_hash, price_at_prediction, baseline_direction, data_source, prediction_metadata,
            ep_correct, baseline_correct)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT DO NOTHING`,
          [
            pred.symbol, config.timeHorizon, 'backtest', predictedDirection,
            Math.round(pred.confidence * 100), pred.archetype, signatureHash,
            pred.entryPrice,
            pred.baselineDirection === 'up' ? 'bullish' : pred.baselineDirection === 'down' ? 'bearish' : 'neutral',
            'yahoo_finance_historical',
            JSON.stringify({
              backtest: true, candle_interval: config.interval, sector: SECTOR_MAP[pred.symbol] || 'unknown',
              actual_move: resolution.actualMove, exit_price: resolution.exitPrice,
              timestamp: new Date(timestamp * 1000).toISOString(),
            }),
            resolution.epCorrect, resolution.baselineCorrect,
          ]
        );
        return true;
      } catch (e2) {
        console.log(`  ✗ DB fallback error: ${e2.message}`);
        return false;
      }
    }
    console.log(`  ✗ DB error: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN BACKTEST LOOP
// ═══════════════════════════════════════════════════════════

async function runBacktest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     MARKET BACKTEST ENGINE v1.0                           ║');
  console.log('║     Replaying history through the prediction pipeline     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Symbols: ${SYMBOLS.join(', ')}`);
  console.log(`Window: ${WINDOW_SIZE} candles | Lookahead: ${LOOKAHEAD} candle(s)`);
  console.log(`Configs: ${BACKTEST_CONFIGS.map(c => `${c.label}(${c.interval}/${c.range})`).join(', ')}`);
  console.log('');

  let totalPredictions = 0, totalEpCorrect = 0, totalBaselineCorrect = 0;
  let totalFlat = 0, totalWritten = 0, totalDupes = 0;
  const symbolResults = {};
  const archetypeResults = {};

  for (const config of BACKTEST_CONFIGS) {
    console.log(`\n═══ ${config.label.toUpperCase()} (${config.interval}, range=${config.range}) ═══`);

    for (const symbol of SYMBOLS) {
      console.log(`  ${symbol}...`);
      const candles = await fetchHistoricalCandles(symbol, config.interval, config.range);
      if (!candles) { console.log(`    ⚠ No data`); continue; }
      console.log(`    ${candles.length} candles (${new Date(candles[0].timestamp * 1000).toISOString().slice(0, 10)} → ${new Date(candles[candles.length - 1].timestamp * 1000).toISOString().slice(0, 10)})`);

      let symPreds = 0, symCorrect = 0, symBaseCorrect = 0, symFlat = 0, symWritten = 0;

      // Slide window through history
      for (let i = 0; i <= candles.length - WINDOW_SIZE - LOOKAHEAD; i++) {
        const window = candles.slice(i, i + WINDOW_SIZE);
        const future = candles.slice(i + WINDOW_SIZE, i + WINDOW_SIZE + LOOKAHEAD);

        const pred = generateBacktestPrediction(symbol, window);
        if (!pred) { symFlat++; continue; }

        const resolution = resolveBacktestPrediction(pred, future, config.timeHorizon);
        if (!resolution) continue;

        symPreds++;
        if (resolution.epCorrect) symCorrect++;
        if (resolution.baselineCorrect) symBaseCorrect++;

        // Track archetype
        if (!archetypeResults[pred.archetype]) archetypeResults[pred.archetype] = { n: 0, correct: 0 };
        archetypeResults[pred.archetype].n++;
        if (resolution.epCorrect) archetypeResults[pred.archetype].correct++;

        // Write to DB
        const timestamp = window[window.length - 1].timestamp;
        const written = await writeBacktestResult(pred, resolution, config, timestamp);
        if (written) symWritten++;
        else totalDupes++;
      }

      const symAcc = symPreds > 0 ? (symCorrect / symPreds * 100).toFixed(1) : 'N/A';
      const baseAcc = symPreds > 0 ? (symBaseCorrect / symPreds * 100).toFixed(1) : 'N/A';
      console.log(`    EP: ${symAcc}% | Base: ${baseAcc}% | ${symPreds} preds (${symFlat} flat) | ${symWritten} written`);

      if (!symbolResults[symbol]) symbolResults[symbol] = { n: 0, correct: 0, baseCorrect: 0 };
      symbolResults[symbol].n += symPreds;
      symbolResults[symbol].correct += symCorrect;
      symbolResults[symbol].baseCorrect += symBaseCorrect;

      totalPredictions += symPreds;
      totalEpCorrect += symCorrect;
      totalBaselineCorrect += symBaseCorrect;
      totalFlat += symFlat;
      totalWritten += symWritten;

      await sleep(500); // Rate limit Yahoo
    }
  }

  // ═══ FINAL REPORT ═══
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     BACKTEST RESULTS                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Total predictions:  ${totalPredictions.toLocaleString()}`);
  console.log(`EP accuracy:        ${(totalEpCorrect / totalPredictions * 100).toFixed(1)}% (${totalEpCorrect}/${totalPredictions})`);
  console.log(`Baseline accuracy:  ${(totalBaselineCorrect / totalPredictions * 100).toFixed(1)}% (${totalBaselineCorrect}/${totalPredictions})`);
  console.log(`EP edge:            +${((totalEpCorrect - totalBaselineCorrect) / totalPredictions * 100).toFixed(1)}pp`);
  console.log(`Flat (no signal):   ${totalFlat.toLocaleString()}`);
  console.log(`Written to DB:      ${totalWritten.toLocaleString()} (${totalDupes} dupes skipped)`);

  console.log('\n── By Symbol ──');
  const sortedSymbols = Object.entries(symbolResults).sort((a, b) => (b[1].correct / b[1].n) - (a[1].correct / a[1].n));
  for (const [sym, r] of sortedSymbols) {
    const acc = (r.correct / r.n * 100).toFixed(1);
    const baseAcc = (r.baseCorrect / r.n * 100).toFixed(1);
    const edge = ((r.correct - r.baseCorrect) / r.n * 100).toFixed(1);
    console.log(`  ${sym.padEnd(10)} EP=${acc}% Base=${baseAcc}% Edge=${edge}pp (n=${r.n})`);
  }

  console.log('\n── By Archetype ──');
  const sortedArch = Object.entries(archetypeResults).sort((a, b) => (b[1].correct / b[1].n) - (a[1].correct / a[1].n));
  for (const [arch, r] of sortedArch) {
    if (r.n < 5) continue;
    const acc = (r.correct / r.n * 100).toFixed(1);
    console.log(`  ${arch.padEnd(30)} ${acc}% (n=${r.n})`);
  }

  // Refresh entity intelligence with new backtest data
  console.log('\n── Refreshing Market Entity Intelligence ──');
  try {
    await refreshMarketIntelligence(query);
    console.log('✓ Entity intelligence updated with backtest data');
  } catch (e) {
    console.log(`⚠ Entity intelligence refresh: ${e.message}`);
  }

  await sqlPool.end();
  console.log('\n✓ Backtest complete');
}

runBacktest().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
