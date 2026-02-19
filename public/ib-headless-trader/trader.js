/**
 * EP-Powered IBKR Autonomous Trader v2.0
 * 
 * Reads LIVE predictions from market-worker's DB (market_prediction_attempts).
 * Only trades predictions that pass strict data-driven filters:
 *   - Proven archetypes (blunder_free_queen, trap_queen_sac, false_breakout)
 *   - Proven symbols (AMD, AMZN, SI=F, CL=F)
 *   - Proven timeframes (1h, 2h, 4h, 8h)
 *   - Minimum confidence threshold
 *   - Photonic coherence gate
 * 
 * Architecture:
 *   market-worker → DB (market_prediction_attempts) → THIS TRADER → IBKR Bridge → IB Gateway
 */

import { CONFIG } from './config.js';
import pg from 'pg';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

let connected = false;
let account = null;
let positions = new Map();
let openOrders = new Map();
let dailyPnL = 0;
let tradesExecutedToday = 0;
let tradedPredictionIds = new Set();     // Don't trade same prediction twice
let symbolCooldowns = new Map();          // symbol → last trade timestamp
let tradeLog = [];                        // All trades this session
let dbPool = null;

// ═══════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════

const LEVELS = ['debug', 'info', 'warn', 'error'];
const configLevel = LEVELS.indexOf(CONFIG.LOG_LEVEL);

function log(level, message, data = {}) {
  if (LEVELS.indexOf(level) >= configLevel) {
    const ts = new Date().toISOString();
    const mode = CONFIG.MODE === 'live' ? '🔴 LIVE' : '📄 PAPER';
    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${ts}] [${mode}] [${level.toUpperCase()}] ${message}${dataStr}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// DATABASE — Read predictions from market-worker
// ═══════════════════════════════════════════════════════════════════

function initDB() {
  if (!CONFIG.DATABASE_URL) {
    log('warn', 'No DATABASE_URL — cannot read EP predictions');
    return null;
  }
  const pool = new pg.Pool({
    connectionString: CONFIG.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => log('error', 'DB pool error', { error: err.message }));
  return pool;
}

/**
 * Fetch recent tradeable predictions from the market-worker's DB.
 * Returns predictions that match ALL filters and haven't been traded yet.
 */
async function fetchTradeableSignals() {
  if (!dbPool) return [];
  
  const F = CONFIG.FILTERS;
  const maxAge = F.MAX_PREDICTION_AGE_SEC || 300;
  
  try {
    const result = await dbPool.query(`
      SELECT 
        id,
        symbol,
        predicted_direction,
        confidence,
        archetype,
        time_horizon,
        price_at_prediction,
        created_at,
        signature_hash,
        chess_archetype_resonance,
        prediction_metadata
      FROM market_prediction_attempts
      WHERE created_at > NOW() - INTERVAL '${maxAge} seconds'
        AND archetype = ANY($1)
        AND symbol = ANY($2)
        AND time_horizon = ANY($3)
        AND confidence >= $4
        AND resolved_at IS NULL
      ORDER BY confidence DESC, created_at DESC
      LIMIT 20
    `, [
      F.ALLOWED_ARCHETYPES,
      F.ALLOWED_SYMBOLS,
      F.ALLOWED_TIMEFRAMES,
      F.MIN_CONFIDENCE * 100, // DB stores confidence as 0-100
    ]);
    
    const signals = [];
    for (const row of result.rows) {
      // Skip already-traded predictions
      if (tradedPredictionIds.has(row.id)) continue;
      
      // Extract photonic coherence and quality gates from metadata
      const meta = row.prediction_metadata || {};
      const photonicCoherence = meta.photonic_coherence || null;
      const qualityGates = meta.quality_gates || {};
      
      // Photonic coherence gate: if present, must be >= 1.0
      if (F.REQUIRE_PHOTONIC_COHERENCE && photonicCoherence != null && photonicCoherence < 1.0) continue;
      
      // Symbol cooldown
      const lastTrade = symbolCooldowns.get(row.symbol);
      if (lastTrade && Date.now() - lastTrade < CONFIG.TRADING.SYMBOL_COOLDOWN_MS) continue;
      
      signals.push({
        id: row.id,
        symbol: row.symbol,
        direction: row.predicted_direction,
        confidence: (row.confidence || 0) / 100, // Normalize to 0-1
        archetype: row.archetype,
        timeframe: row.time_horizon,
        price: parseFloat(row.price_at_prediction) || 0,
        createdAt: row.created_at,
        photonicCoherence,
        chessResonance: row.chess_archetype_resonance,
        signatureHash: row.signature_hash,
        tacticalOverride: meta.tactical_override || null,
        tradeGrade: qualityGates.trade_grade?.grade || null,
      });
    }
    
    return signals;
  } catch (err) {
    log('error', 'Failed to fetch signals from DB', { error: err.message });
    return [];
  }
}

/**
 * Get historical accuracy stats for a symbol+archetype combo.
 * Used for Kelly criterion position sizing.
 */
async function getSymbolStats(symbol, archetype) {
  if (!dbPool) return null;
  
  try {
    const result = await dbPool.query(`
      SELECT 
        COUNT(*) as n,
        COUNT(CASE WHEN ep_correct = true THEN 1 END) as correct,
        AVG(CASE WHEN ep_correct = true THEN ABS(price_at_resolution - price_at_prediction) / NULLIF(price_at_prediction, 0) END) as avg_win_return,
        AVG(CASE WHEN ep_correct = false THEN ABS(price_at_resolution - price_at_prediction) / NULLIF(price_at_prediction, 0) END) as avg_loss_return
      FROM market_prediction_attempts
      WHERE symbol = $1 
        AND archetype = $2
        AND resolved_at IS NOT NULL
        AND price_at_resolution IS NOT NULL
        AND price_at_prediction > 0
    `, [symbol, archetype]);
    
    const row = result.rows[0];
    if (!row || parseInt(row.n) < 10) return null;
    
    const n = parseInt(row.n);
    const correct = parseInt(row.correct);
    const winRate = correct / n;
    
    return {
      n,
      winRate,
      avgWin: parseFloat(row.avg_win_return) || 0.02,   // Default 2% if no data
      avgLoss: parseFloat(row.avg_loss_return) || 0.015, // Default 1.5%
    };
  } catch (err) {
    log('error', 'Failed to get symbol stats', { error: err.message });
    return null;
  }
}

/**
 * Log a trade execution back to the DB for learning.
 */
async function logTradeExecution(trade) {
  if (!dbPool) return;
  
  try {
    await dbPool.query(`
      INSERT INTO trader_executions (
        prediction_id, symbol, direction, shares, price, 
        archetype, timeframe, confidence, photonic_coherence,
        order_id, status, mode, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT DO NOTHING
    `, [
      trade.predictionId, trade.symbol, trade.direction, trade.shares, trade.price,
      trade.archetype, trade.timeframe, trade.confidence, trade.photonicCoherence,
      trade.orderId, trade.status, CONFIG.MODE,
    ]).catch(() => {}); // Non-critical — don't crash if table doesn't exist yet
  } catch (err) {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════
// IBKR BRIDGE COMMUNICATION
// ═══════════════════════════════════════════════════════════════════

async function bridgeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${CONFIG.BRIDGE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) throw new Error(`Bridge error: ${response.status}`);
    return await response.json();
  } catch (err) {
    log('error', `Bridge request failed: ${endpoint}`, { error: err.message });
    return null;
  }
}

async function connectToBridge() {
  log('info', 'Connecting to IB Gateway...');
  const result = await bridgeRequest('/api/connect', {
    method: 'POST',
    body: JSON.stringify({
      host: '127.0.0.1',
      port: parseInt(CONFIG.IB_PORT),
      clientId: 2,
    }),
  });
  if (result?.connected) {
    connected = true;
    log('info', '✅ Connected to IB Gateway');
    await refreshAccountData();
    return true;
  }
  log('error', '❌ Failed to connect to IB Gateway');
  return false;
}

async function refreshAccountData() {
  const accountsData = await bridgeRequest('/api/accounts');
  if (accountsData?.accounts?.length > 0) {
    account = accountsData.accounts[0];
    log('info', 'Account loaded', {
      id: account.accountId,
      type: account.accountType,
      balance: `$${account.balance?.toFixed(2)}`,
      buyingPower: `$${account.buyingPower?.toFixed(2)}`,
    });
  }
  
  if (account) {
    const positionsData = await bridgeRequest(`/api/positions?accountId=${account.accountId}`);
    positions.clear();
    if (positionsData?.positions) {
      for (const pos of positionsData.positions) {
        if (pos.position !== 0) positions.set(pos.symbol, pos);
      }
    }
  }
  
  const ordersData = await bridgeRequest('/api/orders');
  openOrders.clear();
  if (ordersData?.orders) {
    for (const order of ordersData.orders) {
      openOrders.set(order.orderId, order);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// POSITION SIZING — Kelly Criterion
// ═══════════════════════════════════════════════════════════════════

function computePositionSize(bankroll, symbolStats, confidence) {
  if (!symbolStats || symbolStats.n < 10) {
    return { shares: 0, reason: 'insufficient_data' };
  }
  
  if (symbolStats.winRate < 0.35) {
    return { shares: 0, reason: `no_edge (${(symbolStats.winRate * 100).toFixed(1)}%)` };
  }
  
  const { winRate, avgWin, avgLoss } = symbolStats;
  const kellyFraction = CONFIG.TRADING.KELLY_FRACTION;
  
  // Kelly formula: f* = (bp - q) / b
  // where b = avgWin/avgLoss, p = winRate, q = 1 - winRate
  const b = avgWin / (avgLoss || 0.01);
  const fullKelly = (b * winRate - (1 - winRate)) / (b || 1);
  
  if (fullKelly <= 0) {
    return { shares: 0, reason: 'negative_kelly' };
  }
  
  // Scale by confidence and Kelly fraction
  const confidenceScalar = 0.5 + (confidence * 0.5);
  const fraction = Math.min(0.10, fullKelly * kellyFraction * confidenceScalar); // Cap at 10% of bankroll
  const positionValue = Math.min(CONFIG.TRADING.MAX_POSITION_VALUE, bankroll * fraction);
  
  return {
    positionValue: Math.round(positionValue * 100) / 100,
    fraction,
    fullKelly,
    reason: 'kelly_sized',
  };
}

// ═══════════════════════════════════════════════════════════════════
// ORDER EXECUTION
// ═══════════════════════════════════════════════════════════════════

async function executeSignal(signal) {
  if (!account) {
    log('warn', 'No account — cannot execute');
    return null;
  }
  
  // Get contract info
  const contract = CONFIG.CONTRACTS[signal.symbol];
  if (!contract) {
    log('warn', `No contract for ${signal.symbol} — skipping (futures not yet supported)`);
    return null;
  }
  
  // Get historical stats for position sizing
  const stats = await getSymbolStats(signal.symbol, signal.archetype);
  const bankroll = account.balance || CONFIG.TRADING.BANKROLL;
  const sizing = computePositionSize(bankroll, stats, signal.confidence);
  
  if (!sizing.positionValue || sizing.positionValue < 50) {
    log('info', `⏭️ Skip ${signal.symbol}: ${sizing.reason}`, { stats, sizing });
    return null;
  }
  
  // Calculate shares
  const pricePerShare = signal.price || 100;
  const shares = Math.max(1, Math.floor(sizing.positionValue / pricePerShare));
  
  // Determine side
  const direction = signal.direction;
  const side = (direction === 'up' || direction === 'bullish') ? 'BUY' : 
               (direction === 'down' || direction === 'bearish') ? 'SELL' : null;
  
  if (!side) {
    log('debug', `Skip ${signal.symbol}: direction=${direction} (flat/neutral)`);
    return null;
  }
  
  log('info', `🎯 EXECUTING: ${side} ${shares} ${signal.symbol} @ ~$${pricePerShare.toFixed(2)}`, {
    archetype: signal.archetype,
    timeframe: signal.timeframe,
    confidence: `${(signal.confidence * 100).toFixed(0)}%`,
    photonic: signal.photonicCoherence,
    kelly: `${(sizing.fraction * 100).toFixed(1)}%`,
    positionValue: `$${sizing.positionValue.toFixed(2)}`,
    winRate: stats ? `${(stats.winRate * 100).toFixed(1)}%` : 'N/A',
    n: stats?.n || 0,
  });
  
  // Place order via bridge
  const result = await bridgeRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      accountId: account.accountId,
      conid: contract.conId,
      symbol: signal.symbol,
      side,
      quantity: shares,
      orderType: 'MKT',
    }),
  });
  
  if (result?.orderId) {
    const trade = {
      predictionId: signal.id,
      symbol: signal.symbol,
      direction: side,
      shares,
      price: pricePerShare,
      archetype: signal.archetype,
      timeframe: signal.timeframe,
      confidence: signal.confidence,
      photonicCoherence: signal.photonicCoherence,
      orderId: result.orderId,
      status: result.status || 'submitted',
      sizing,
      stats,
      timestamp: Date.now(),
    };
    
    log('info', `✅ ORDER PLACED: ${result.orderId} | ${side} ${shares} ${signal.symbol} | status: ${result.status}`);
    
    // Track state
    tradedPredictionIds.add(signal.id);
    symbolCooldowns.set(signal.symbol, Date.now());
    tradesExecutedToday++;
    tradeLog.push(trade);
    
    // Log to DB
    await logTradeExecution(trade);
    
    return trade;
  }
  
  log('error', `❌ Order failed for ${signal.symbol}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// POSITION MANAGEMENT — Stop Loss / Take Profit
// ═══════════════════════════════════════════════════════════════════

async function managePositions() {
  for (const [symbol, position] of positions) {
    if (position.position === 0) continue;
    
    // Get current quote for P&L calculation
    const contract = CONFIG.CONTRACTS[symbol];
    if (!contract) continue;
    
    const quote = await bridgeRequest(`/api/quote?conid=${contract.conId}`);
    const currentPrice = quote?.lastPrice || 0;
    if (currentPrice <= 0) continue;
    
    const entryPrice = position.avgCost || 0;
    if (entryPrice <= 0) continue;
    
    const isLong = position.position > 0;
    const pnlPercent = isLong 
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - currentPrice) / entryPrice) * 100;
    
    const pnlDollar = (currentPrice - entryPrice) * position.position;
    
    // Stop loss
    if (pnlPercent <= -CONFIG.TRADING.STOP_LOSS_PERCENT) {
      log('warn', `🛑 STOP LOSS: ${symbol} | P&L: ${pnlPercent.toFixed(1)}% ($${pnlDollar.toFixed(2)})`, {
        entry: entryPrice, current: currentPrice, shares: position.position,
      });
      const side = isLong ? 'SELL' : 'BUY';
      await bridgeRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          accountId: account.accountId,
          conid: contract.conId,
          symbol,
          side,
          quantity: Math.abs(position.position),
          orderType: 'MKT',
        }),
      });
      dailyPnL += pnlDollar;
    }
    
    // Take profit
    if (pnlPercent >= CONFIG.TRADING.TAKE_PROFIT_PERCENT) {
      log('info', `💰 TAKE PROFIT: ${symbol} | P&L: +${pnlPercent.toFixed(1)}% (+$${pnlDollar.toFixed(2)})`, {
        entry: entryPrice, current: currentPrice, shares: position.position,
      });
      const side = isLong ? 'SELL' : 'BUY';
      await bridgeRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          accountId: account.accountId,
          conid: contract.conId,
          symbol,
          side,
          quantity: Math.abs(position.position),
          orderType: 'MKT',
        }),
      });
      dailyPnL += pnlDollar;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MARKET HOURS
// ═══════════════════════════════════════════════════════════════════

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  
  // Convert to ET
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  const openTime = CONFIG.TRADING.MARKET_OPEN_HOUR * 60 + CONFIG.TRADING.MARKET_OPEN_MINUTE;
  const closeTime = CONFIG.TRADING.MARKET_CLOSE_HOUR * 60 + CONFIG.TRADING.MARKET_CLOSE_MINUTE;
  
  return timeInMinutes >= openTime && timeInMinutes < closeTime;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN TRADING LOOP
// ═══════════════════════════════════════════════════════════════════

async function tradingLoop() {
  // Check connection
  if (!connected) {
    const ok = await connectToBridge();
    if (!ok) {
      log('debug', 'Not connected to IBKR, waiting...');
      return;
    }
  }
  
  // Refresh account + positions
  await refreshAccountData();
  
  // Only trade during market hours
  if (!isMarketOpen()) {
    log('debug', 'Market closed');
    return;
  }
  
  // Daily loss limit
  if (dailyPnL <= -CONFIG.TRADING.MAX_DAILY_LOSS) {
    log('warn', `🛑 Daily loss limit reached: $${dailyPnL.toFixed(2)}`);
    return;
  }
  
  // Max trades per day
  if (tradesExecutedToday >= CONFIG.TRADING.MAX_TRADES_PER_DAY) {
    log('info', `Max trades reached: ${tradesExecutedToday}/${CONFIG.TRADING.MAX_TRADES_PER_DAY}`);
    return;
  }
  
  // Manage existing positions (stop loss / take profit)
  await managePositions();
  
  // Check position limit
  const activePositions = Array.from(positions.values()).filter(p => p.position !== 0);
  if (activePositions.length >= CONFIG.TRADING.MAX_TOTAL_POSITIONS) {
    log('debug', `Max positions (${activePositions.length}/${CONFIG.TRADING.MAX_TOTAL_POSITIONS})`);
    return;
  }
  
  // Fetch tradeable signals from market-worker's DB
  const signals = await fetchTradeableSignals();
  
  if (signals.length === 0) {
    log('debug', 'No tradeable signals');
    return;
  }
  
  log('info', `📡 Found ${signals.length} tradeable signal(s)`);
  
  // Execute best signal (highest confidence first — already sorted)
  for (const signal of signals) {
    // Skip if already have position in this symbol
    if (positions.has(signal.symbol) && positions.get(signal.symbol).position !== 0) continue;
    
    // Skip flat/neutral
    if (signal.direction === 'flat' || signal.direction === 'neutral') continue;
    
    const trade = await executeSignal(signal);
    if (trade) break; // One trade per cycle to be conservative
  }
}

// Reset daily stats at midnight ET
function resetDailyStats() {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (et.getHours() === 0 && et.getMinutes() === 0) {
    log('info', `📅 Daily reset | Yesterday: ${tradesExecutedToday} trades, P&L: $${dailyPnL.toFixed(2)}`);
    dailyPnL = 0;
    tradesExecutedToday = 0;
    tradedPredictionIds.clear();
    symbolCooldowns.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const modeIcon = CONFIG.MODE === 'live' ? '🔴' : '📄';
  const modeText = CONFIG.MODE === 'live' ? 'LIVE TRADING' : 'PAPER TRADING';
  
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     ${modeIcon} EP-Powered Autonomous Trader v2.0 — ${modeText}       ║
╠══════════════════════════════════════════════════════════════════╣
║  Bridge:      ${CONFIG.BRIDGE_URL.padEnd(48)}║
║  IB Port:     ${CONFIG.IB_PORT.padEnd(48)}║
║  Mode:        ${modeText.padEnd(48)}║
║  Archetypes:  ${CONFIG.FILTERS.ALLOWED_ARCHETYPES.join(', ').padEnd(48)}║
║  Symbols:     ${CONFIG.FILTERS.ALLOWED_SYMBOLS.join(', ').padEnd(48)}║
║  Timeframes:  ${CONFIG.FILTERS.ALLOWED_TIMEFRAMES.join(', ').padEnd(48)}║
║  Min Conf:    ${(CONFIG.FILTERS.MIN_CONFIDENCE * 100 + '%').padEnd(48)}║
║  Kelly:       ${(CONFIG.TRADING.KELLY_FRACTION * 100 + '% (quarter-Kelly)').padEnd(48)}║
║  Max/Day:     ${(CONFIG.TRADING.MAX_TRADES_PER_DAY + ' trades, $' + CONFIG.TRADING.MAX_DAILY_LOSS + ' max loss').padEnd(48)}║
╠══════════════════════════════════════════════════════════════════╣
║  Predictions sourced from: market_prediction_attempts (live DB)  ║
║  Only proven patterns trade. Everything else is filtered out.    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
  
  // Initialize DB connection
  dbPool = initDB();
  if (dbPool) {
    log('info', '✅ DB connected — reading EP predictions');
  } else {
    log('warn', '⚠️ No DB — trader will not have signals. Set DATABASE_URL.');
  }
  
  // Initial IBKR connection
  await connectToBridge();
  
  // Main loop
  setInterval(async () => {
    try {
      resetDailyStats();
      await tradingLoop();
    } catch (err) {
      log('error', 'Trading loop error', { error: err.message, stack: err.stack?.substring(0, 200) });
    }
  }, CONFIG.TRADING.SCAN_INTERVAL_MS);
  
  log('info', '🚀 Trader running — scanning every ' + (CONFIG.TRADING.SCAN_INTERVAL_MS / 1000) + 's');
}

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    log('info', `⏹️ ${sig} — shutting down...`);
    log('info', `Session: ${tradesExecutedToday} trades, P&L: $${dailyPnL.toFixed(2)}`);
    if (tradeLog.length > 0) {
      log('info', 'Trade log:');
      for (const t of tradeLog) {
        log('info', `  ${t.direction} ${t.shares} ${t.symbol} @ $${t.price.toFixed(2)} | ${t.archetype} | ${t.status}`);
      }
    }
    try { if (dbPool) await dbPool.end(); } catch {}
    process.exit(0);
  });
}

main().catch(err => {
  log('error', 'Fatal error', { error: err.message });
  process.exit(1);
});
