/**
 * Options Scalping Worker
 * 
 * 24/7 autonomous options scalping through IB Gateway.
 * Sells credit spreads on high IV underlyings with 5-min scalp horizon.
 * 
 * Strategy:
 * - Monitor IV rank > 50% for entry
 * - Sell 30-45 DTE credit spreads (delta 0.30)
 * - 25% stop loss on premium, 50% take profit
 * - Max 3 concurrent positions
 * - Auto-roll at 21 DTE
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const WORKER_ID = process.argv[2] || '0';
const WORKER_NAME = `options-scalping-${WORKER_ID}`;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aufycarwflhsdgszbnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BRIDGE_URL = process.env.IB_BRIDGE_URL || 'http://localhost:4000';

if (!SUPABASE_KEY) {
  console.error(`[${WORKER_NAME}] No Supabase key found. Check your .env file`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Options scalping config
const CONFIG = {
  MIN_IV_RANK: 50,              // Min IV rank for entry
  MAX_IV_RANK: 80,              // Max IV rank (avoid earnings)
  DTE_ENTRY: [30, 45],          // Days to expiration at entry
  DTE_ROLL: 21,                 // Roll at 21 DTE
  STRIKE_DISTANCE: 0.10,        // 10% OTM strikes
  MAX_SPREAD_WIDTH: 5.00,       // $5 max width per spread
  MIN_CONFIDENCE: 0.65,
  MAX_RISK_PERCENT: 2,          // 2% account risk per trade
  POSITION_SIZE_PERCENT: 3,     // 3% position sizing
  STOP_LOSS_PERCENT: 25,        // 25% stop on premium
  TAKE_PROFIT_PERCENT: 50,      // 50% take profit
  MAX_OPEN_POSITIONS: 3,
  CYCLE_INTERVAL_MS: 20000,     // 20 second cycles
  SCALP_HORIZON_MS: 300000,     // 5 min scalp horizon
};

// High liquidity underlyings for options
const UNDERLYINGS = [
  { symbol: 'SPY', secType: 'STK', exchange: 'SMART' },
  { symbol: 'QQQ', secType: 'STK', exchange: 'SMART' },
  { symbol: 'IWM', secType: 'STK', exchange: 'SMART' },
  { symbol: 'AAPL', secType: 'STK', exchange: 'SMART' },
  { symbol: 'TSLA', secType: 'STK', exchange: 'SMART' },
  { symbol: 'NVDA', secType: 'STK', exchange: 'SMART' },
];

// State
let isRunning = false;
let sessionId = null;
let positions = new Map();
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;
let ivHistory = new Map(); // Track IV history for rank calculation

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${WORKER_NAME}]`;
  if (level === 'error') console.error(`${prefix} ❌ ${message}`);
  else if (level === 'warn') console.warn(`${prefix} ⚠️ ${message}`);
  else console.log(`${prefix} ${message}`);
}

async function initialize() {
  log('=================================');
  log('Options Scalping Worker Starting');
  log('=================================');
  log(`Worker ID: ${WORKER_ID}`);
  
  sessionId = `options-${Date.now()}-${WORKER_ID}`;
  isRunning = true;
  
  // Load existing positions
  await loadPositions();
  
  log('Initialized');
  log('=================================');
}

async function loadPositions() {
  try {
    const { data } = await supabase
      .from('options_positions')
      .select('*')
      .eq('status', 'open')
      .eq('worker_id', WORKER_NAME);
    
    if (data) {
      for (const pos of data) {
        positions.set(pos.id, pos);
      }
      log(`Loaded ${positions.size} open positions`);
    }
  } catch (err) {
    log(`Failed to load positions: ${err.message}`, 'warn');
  }
}

async function runCycle() {
  if (!isRunning) return;
  
  cycleCount++;
  
  try {
    // Check bridge connection
    const statusRes = await fetch(`${BRIDGE_URL}/api/status`);
    const status = await statusRes.json();
    
    if (!status.connected) {
      log('Bridge not connected, skipping cycle', 'warn');
      return;
    }
    
    // Get account
    const accountsRes = await fetch(`${BRIDGE_URL}/api/accounts`);
    const accountsData = await accountsRes.json();
    const account = accountsData.accounts?.[0];
    
    if (!account) {
      log('No account found', 'warn');
      return;
    }
    
    const balance = account.balance || 250000;
    
    // Manage existing positions first
    await managePositions(account.accountId, balance);
    
    // Look for new opportunities if under max positions
    if (positions.size < CONFIG.MAX_OPEN_POSITIONS) {
      await findNewTrades(account.accountId, balance);
    }
    
    // Report status
    await reportStatus({
      connected: true,
      account_id: account.accountId,
      balance,
      open_positions: positions.size,
      trades_executed: tradesExecuted,
      total_pnl: totalPnL,
    });
    
  } catch (err) {
    log(`Cycle error: ${err.message}`, 'error');
  }
}

async function managePositions(accountId, balance) {
  for (const [posId, position] of positions) {
    try {
      // Check DTE - roll if approaching
      const dte = calculateDTE(position.expiration);
      
      if (dte <= CONFIG.DTE_ROLL) {
        log(`Rolling position ${posId} (${dte} DTE remaining)`);
        await rollPosition(accountId, position);
        continue;
      }
      
      // Check P&L for exit
      const currentPrices = await getOptionPrices(position);
      if (!currentPrices) continue;
      
      const spreadValue = (currentPrices.shortPrice - currentPrices.longPrice) * position.quantity * 100;
      const entryValue = position.entry_credit * position.quantity * 100;
      const unrealizedPnL = entryValue - spreadValue;
      const pnlPercent = (unrealizedPnL / entryValue) * 100;
      
      // Exit conditions
      const shouldClose = 
        pnlPercent >= CONFIG.TAKE_PROFIT_PERCENT ||  // Hit profit target
        pnlPercent <= -CONFIG.STOP_LOSS_PERCENT ||   // Hit stop loss
        dte <= 7;                                     // Close at 7 DTE
      
      if (shouldClose) {
        await closePosition(accountId, position, currentPrices, unrealizedPnL);
      }
      
    } catch (err) {
      log(`Position management error for ${posId}: ${err.message}`, 'error');
    }
  }
}

async function findNewTrades(accountId, balance) {
  for (const underlying of UNDERLYINGS) {
    try {
      // Skip if at max positions
      if (positions.size >= CONFIG.MAX_OPEN_POSITIONS) break;
      
      // Check if already have position in this underlying
      const hasPosition = Array.from(positions.values()).some(p => p.underlying === underlying.symbol);
      if (hasPosition) continue;
      
      // Get IV rank
      const ivRank = await calculateIVRank(underlying.symbol);
      if (!ivRank || ivRank < CONFIG.MIN_IV_RANK || ivRank > CONFIG.MAX_IV_RANK) continue;
      
      // Get option chain
      const chain = await getOptionChain(underlying.symbol);
      if (!chain || chain.length === 0) continue;
      
      // Find best spread opportunity
      const spread = findCreditSpread(chain, underlying.symbol);
      if (!spread) continue;
      
      // Calculate position size
      const maxRisk = balance * (CONFIG.MAX_RISK_PERCENT / 100);
      const spreadWidth = spread.longStrike - spread.shortStrike;
      const maxSpreads = Math.floor(maxRisk / (spreadWidth * 100));
      const positionSpreads = Math.min(maxSpreads, Math.floor((balance * CONFIG.POSITION_SIZE_PERCENT / 100) / (spreadWidth * 100)));
      
      if (positionSpreads < 1) continue;
      
      // Execute the spread
      const result = await openSpread(accountId, underlying.symbol, spread, positionSpreads);
      
      if (result.success) {
        const position = {
          id: result.orderId,
          underlying: underlying.symbol,
          expiration: spread.expiration,
          shortStrike: spread.shortStrike,
          longStrike: spread.longStrike,
          shortConid: spread.shortConid,
          longConid: spread.longConid,
          side: spread.type,
          entry_credit: spread.credit,
          quantity: positionSpreads,
          entry_time: new Date().toISOString(),
          status: 'open',
          iv_rank: ivRank,
          worker_id: WORKER_NAME,
        };
        
        positions.set(result.orderId, position);
        tradesExecuted++;
        
        await supabase.from('options_positions').insert(position);
        
        log(`✓ Opened ${spread.type} spread on ${underlying.symbol} ${spread.shortStrike}/${spread.longStrike} @ $${spread.credit.toFixed(2)} (${positionSpreads}x)`);
      }
      
    } catch (err) {
      log(`Trade finding error for ${underlying.symbol}: ${err.message}`, 'warn');
    }
  }
}

async function calculateIVRank(symbol) {
  try {
    // Get current IV
    const searchRes = await fetch(`${BRIDGE_URL}/api/search?symbol=${symbol}`);
    const searchData = await searchRes.json();
    if (!searchData.contracts?.[0]) return null;
    
    const conid = searchData.contracts[0].conid;
    const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${conid}`);
    const quote = await quoteRes.json();
    
    if (!quote.impliedVol) return null;
    
    const currentIV = quote.impliedVol * 100;
    
    // Track history for rank calculation
    if (!ivHistory.has(symbol)) {
      ivHistory.set(symbol, []);
    }
    
    const history = ivHistory.get(symbol);
    history.push(currentIV);
    
    if (history.length > 252) { // 1 year
      history.shift();
    }
    
    if (history.length < 20) return null; // Need minimum history
    
    const minIV = Math.min(...history);
    const maxIV = Math.max(...history);
    
    if (maxIV === minIV) return 50;
    
    return ((currentIV - minIV) / (maxIV - minIV)) * 100;
    
  } catch (err) {
    return null;
  }
}

async function getOptionChain(symbol) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/options?symbol=${symbol}`);
    const data = await response.json();
    return data.options || [];
  } catch (err) {
    return [];
  }
}

function findCreditSpread(chain, symbol) {
  // Filter for target DTE
  const targetExpirations = chain.filter(opt => {
    const dte = calculateDTE(opt.expiration);
    return dte >= CONFIG.DTE_ENTRY[0] && dte <= CONFIG.DTE_ENTRY[1];
  });
  
  if (targetExpirations.length === 0) return null;
  
  // Group by expiration
  const byExpiration = {};
  for (const opt of targetExpirations) {
    if (!byExpiration[opt.expiration]) {
      byExpiration[opt.expiration] = [];
    }
    byExpiration[opt.expiration].push(opt);
  }
  
  // Find best spread
  let bestSpread = null;
  let bestCredit = 0;
  
  for (const [expiration, options] of Object.entries(byExpiration)) {
    const puts = options.filter(o => o.type === 'put').sort((a, b) => b.strike - a.strike);
    const calls = options.filter(o => o.type === 'call').sort((a, b) => a.strike - b.strike);
    
    // Try put credit spreads (bullish)
    for (let i = 0; i < puts.length - 1; i++) {
      const shortPut = puts[i];
      const longPut = puts[i + 1];
      
      if (shortPut.delta > 0.4 || shortPut.delta < 0.2) continue; // Target 0.30 delta
      
      const width = shortPut.strike - longPut.strike;
      if (width > CONFIG.MAX_SPREAD_WIDTH) continue;
      
      const credit = shortPut.price - longPut.price;
      const maxRisk = width - credit;
      const returnOnRisk = credit / maxRisk;
      
      if (returnOnRisk > 0.30 && credit > bestCredit) { // Min 30% return on risk
        bestCredit = credit;
        bestSpread = {
          type: 'put_credit',
          expiration,
          shortStrike: shortPut.strike,
          longStrike: longPut.strike,
          shortConid: shortPut.conid,
          longConid: longPut.conid,
          credit,
          width,
        };
      }
    }
    
    // Try call credit spreads (bearish)
    for (let i = 0; i < calls.length - 1; i++) {
      const shortCall = calls[i];
      const longCall = calls[i + 1];
      
      if (Math.abs(shortCall.delta) > 0.4 || Math.abs(shortCall.delta) < 0.2) continue;
      
      const width = longCall.strike - shortCall.strike;
      if (width > CONFIG.MAX_SPREAD_WIDTH) continue;
      
      const credit = shortCall.price - longCall.price;
      const maxRisk = width - credit;
      const returnOnRisk = credit / maxRisk;
      
      if (returnOnRisk > 0.30 && credit > bestCredit) {
        bestCredit = credit;
        bestSpread = {
          type: 'call_credit',
          expiration,
          shortStrike: shortCall.strike,
          longStrike: longCall.strike,
          shortConid: shortCall.conid,
          longConid: longCall.conid,
          credit,
          width,
        };
      }
    }
  }
  
  return bestSpread;
}

async function openSpread(accountId, symbol, spread, quantity) {
  try {
    // Place short leg
    const shortRes = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        conid: spread.shortConid,
        symbol: `${symbol}_OPT`,
        side: 'SELL',
        quantity: quantity * 100,
        orderType: 'LMT',
        price: spread.credit + 0.01,
      }),
    });
    
    const shortData = await shortRes.json();
    
    // Place long leg
    const longRes = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        conid: spread.longConid,
        symbol: `${symbol}_OPT`,
        side: 'BUY',
        quantity: quantity * 100,
        orderType: 'LMT',
        price: 0.01,
      }),
    });
    
    const longData = await longRes.json();
    
    return {
      success: shortData.orderId && longData.orderId,
      orderId: `${shortData.orderId}_${longData.orderId}`,
    };
    
  } catch (err) {
    return { success: false };
  }
}

async function getOptionPrices(position) {
  try {
    const shortRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${position.shortConid}`);
    const longRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${position.longConid}`);
    
    const shortData = await shortRes.json();
    const longData = await longRes.json();
    
    return {
      shortPrice: shortData.lastPrice || 0,
      longPrice: longData.lastPrice || 0,
    };
  } catch (err) {
    return null;
  }
}

async function closePosition(accountId, position, prices, pnl) {
  try {
    // Close short leg
    await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        conid: position.shortConid,
        symbol: `${position.underlying}_OPT`,
        side: 'BUY',
        quantity: position.quantity * 100,
        orderType: 'MKT',
      }),
    });
    
    // Close long leg
    await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        conid: position.longConid,
        symbol: `${position.underlying}_OPT`,
        side: 'SELL',
        quantity: position.quantity * 100,
        orderType: 'MKT',
      }),
    });
    
    totalPnL += pnl;
    
    await supabase.from('options_positions')
      .update({
        status: 'closed',
        exit_time: new Date().toISOString(),
        exit_debit: prices.shortPrice - prices.longPrice,
        realized_pnl: pnl,
      })
      .eq('id', position.id);
    
    positions.delete(position.id);
    
    log(`✓ Closed ${position.underlying} ${position.side} | PnL: $${pnl.toFixed(2)}`);
    
  } catch (err) {
    log(`Failed to close position: ${err.message}`, 'error');
  }
}

async function rollPosition(accountId, position) {
  // Close current position and open new one further out
  log(`Rolling ${position.underlying} position to next expiration`);
  
  // For now, just close - can add rolling logic later
  const prices = await getOptionPrices(position);
  if (prices) {
    const spreadValue = (prices.shortPrice - prices.longPrice) * position.quantity * 100;
    const entryValue = position.entry_credit * position.quantity * 100;
    const pnl = entryValue - spreadValue;
    await closePosition(accountId, position, prices, pnl);
  }
}

function calculateDTE(expiration) {
  const exp = new Date(expiration);
  const now = new Date();
  const diffTime = exp - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function reportStatus(status) {
  try {
    await supabase.from('farm_status').upsert({
      farm_name: 'options-scalping',
      worker_id: WORKER_NAME,
      status: isRunning ? 'trading' : 'stopped',
      games_generated: tradesExecuted,
      last_game_at: new Date().toISOString(),
      metadata: {
        type: 'options_scalping',
        session_id: sessionId,
        open_positions: positions.size,
        total_pnl: totalPnL,
        ...status,
      },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'farm_name,worker_id'
    });
  } catch (err) {
    log(`Status report failed: ${err.message}`, 'warn');
  }
}

// Main
async function main() {
  await initialize();
  
  // First cycle
  await runCycle();
  
  // Start loop
  const interval = setInterval(runCycle, CONFIG.CYCLE_INTERVAL_MS);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down...');
    isRunning = false;
    clearInterval(interval);
    reportStatus({ connected: false, stopped: true });
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Shutting down...');
    isRunning = false;
    clearInterval(interval);
    reportStatus({ connected: false, stopped: true });
    process.exit(0);
  });
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
