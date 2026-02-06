/**
 * IBKR Autonomous Trading Worker
 * 
 * Runs 24/7 automated trading through IB Gateway paper account.
 * Similar to chess workers - runs continuously, reports status.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../.env') });

// Worker ID
const WORKER_ID = process.argv[2] || '0';
const WORKER_NAME = `ibkr-trader-${WORKER_ID}`;

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// IB Gateway Bridge config
const BRIDGE_URL = process.env.IB_BRIDGE_URL || 'http://localhost:4000';
const GATEWAY_HOST = process.env.IB_GATEWAY_HOST || '127.0.0.1';
const GATEWAY_PORT = parseInt(process.env.IB_GATEWAY_PORT || '4002'); // 4002 = paper
const CLIENT_ID = parseInt(process.env.IB_CLIENT_ID || '1');

// Trading config
const CONFIG = {
  MIN_CONFIDENCE: 0.70,
  MAX_RISK_PERCENT: 3,
  POSITION_SIZE_PERCENT: 5,
  CYCLE_INTERVAL_MS: 15000,
  STOP_LOSS_PERCENT: 1.0,
  TAKE_PROFIT_PERCENT: 1.5,
  SCALP_HORIZON_MS: 60000,
};

const SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'AMD'];

// State
let isRunning = false;
let sessionId = null;
let positions = new Map();
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;

// Logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${WORKER_NAME}]`;
  if (level === 'error') {
    console.error(`${prefix} ❌ ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️ ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// Check bridge connection
async function checkBridgeConnection() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/status`);
    if (!response.ok) return { connected: false, authenticated: false };
    const data = await response.json();
    return {
      connected: data.bridgeRunning === true,
      authenticated: data.connected === true,
    };
  } catch (err) {
    return { connected: false, authenticated: false };
  }
}

// Connect to IB Gateway
async function connectToGateway() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: GATEWAY_HOST,
        port: GATEWAY_PORT,
        clientId: CLIENT_ID,
      }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.connected === true;
  } catch (err) {
    log(`Connect error: ${err.message}`, 'error');
    return false;
  }
}

// Get accounts
async function getAccounts() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/accounts`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.accounts || [];
  } catch (err) {
    return [];
  }
}

// Get positions
async function getPositions(accountId) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/positions?accountId=${accountId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.positions || [];
  } catch (err) {
    return [];
  }
}

// Search contract
async function searchContract(symbol) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/search?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.contracts || [];
  } catch (err) {
    return [];
  }
}

// Get quote
async function getQuote(conid) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/quote?conid=${conid}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Place order
async function placeOrder(order) {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

// Get prediction signal from Supabase
async function getPatternSignal(symbol) {
  try {
    const { data: predictions } = await supabase
      .from('prediction_outcomes')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!predictions || predictions.length === 0) {
      // Generate via edge function
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { action: 'prediction', symbol }
      });
      if (error || !data) return null;
      return {
        direction: data.direction || 'neutral',
        confidence: data.confidence || 0.5,
        archetype: data.archetype || 'unknown',
      };
    }

    const upVotes = predictions.filter(p => p.predicted_direction === 'up').length;
    const downVotes = predictions.filter(p => p.predicted_direction === 'down').length;
    const avgConfidence = predictions.reduce((sum, p) => sum + (p.predicted_confidence || 0), 0) / predictions.length;

    let direction = 'neutral';
    if (upVotes > downVotes && upVotes >= 3) direction = 'up';
    else if (downVotes > upVotes && downVotes >= 3) direction = 'down';

    return { direction, confidence: avgConfidence, archetype: 'consensus' };
  } catch (err) {
    return null;
  }
}

// Run trading cycle
async function runCycle() {
  if (!isRunning) return;

  const startTime = Date.now();
  cycleCount++;
  log(`Running cycle #${cycleCount}...`);

  try {
    // Check connection
    const status = await checkBridgeConnection();
    if (!status.connected) {
      log('Bridge not running, skipping cycle', 'warn');
      return;
    }
    if (!status.authenticated) {
      log('Not authenticated, attempting connect...');
      const connected = await connectToGateway();
      if (!connected) {
        log('Failed to connect to gateway', 'warn');
        return;
      }
    }

    // Get account
    const accounts = await getAccounts();
    const paperAccount = accounts.find(a => a.accountId.startsWith('DU') || a.accountType === 'Paper');
    const account = paperAccount || accounts[0];
    if (!account) {
      log('No account found', 'warn');
      return;
    }

    const balance = account.balance || 100000;
    log(`Account: ${account.accountId} | Balance: $${balance.toFixed(2)}`);

    // Get current positions from IBKR
    const ibkrPositions = await getPositions(account.accountId);
    const openSymbols = new Set(ibkrPositions.map(p => p.symbol));

    // Scan for opportunities
    let cycleTrades = 0;

    for (const symbol of SYMBOLS) {
      if (openSymbols.has(symbol) || positions.has(symbol)) continue;

      const signal = await getPatternSignal(symbol);
      if (!signal || signal.direction === 'neutral' || signal.confidence < CONFIG.MIN_CONFIDENCE) {
        continue;
      }

      // Search contract
      const contracts = await searchContract(symbol);
      if (contracts.length === 0) continue;
      const contract = contracts[0];

      // Get price
      const quote = await getQuote(contract.conid);
      if (!quote || !quote.lastPrice) continue;
      const price = quote.lastPrice;

      // Calculate position size
      const riskAmount = balance * (CONFIG.MAX_RISK_PERCENT / 100);
      const stopLossAmount = price * (CONFIG.STOP_LOSS_PERCENT / 100);
      const maxShares = Math.floor(riskAmount / stopLossAmount);
      const positionShares = Math.min(maxShares, Math.floor((balance * CONFIG.POSITION_SIZE_PERCENT / 100) / price));

      if (positionShares < 1) continue;

      // Place order
      const side = signal.direction === 'up' ? 'BUY' : 'SELL';
      const result = await placeOrder({
        accountId: account.accountId,
        conid: contract.conid,
        symbol,
        side,
        quantity: positionShares,
        orderType: 'MKT',
      });

      if (result) {
        tradesExecuted++;
        cycleTrades++;
        
        // Track position
        positions.set(symbol, {
          id: result.orderId,
          symbol,
          conid: contract.conid,
          side: signal.direction === 'up' ? 'long' : 'short',
          entryPrice: price,
          quantity: positionShares,
          entryTime: Date.now(),
          stopLoss: signal.direction === 'up' 
            ? price * (1 - CONFIG.STOP_LOSS_PERCENT / 100)
            : price * (1 + CONFIG.STOP_LOSS_PERCENT / 100),
          takeProfit: signal.direction === 'up'
            ? price * (1 + CONFIG.TAKE_PROFIT_PERCENT / 100)
            : price * (1 - CONFIG.TAKE_PROFIT_PERCENT / 100),
        });

        // Log to database
        await supabase.from('autonomous_trades').insert({
          session_id: sessionId,
          worker_id: WORKER_NAME,
          symbol,
          direction: side,
          entry_price: price,
          shares: positionShares,
          predicted_direction: signal.direction,
          predicted_confidence: signal.confidence,
          status: 'open',
        });

        log(`✓ ${side} ${positionShares} ${symbol} @ $${price.toFixed(2)} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      }
    }

    // Manage open positions - check exits
    for (const [symbol, pos] of positions) {
      const quote = await getQuote(pos.conid);
      if (!quote || !quote.lastPrice) continue;

      const currentPrice = quote.lastPrice;
      const pnl = pos.side === 'long'
        ? (currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - currentPrice) * pos.quantity;

      const shouldClose = 
        (pos.side === 'long' && currentPrice <= pos.stopLoss) ||
        (pos.side === 'long' && currentPrice >= pos.takeProfit) ||
        (pos.side === 'short' && currentPrice >= pos.stopLoss) ||
        (pos.side === 'short' && currentPrice <= pos.takeProfit) ||
        (Date.now() - pos.entryTime > CONFIG.SCALP_HORIZON_MS * 3);

      if (shouldClose) {
        const closeSide = pos.side === 'long' ? 'SELL' : 'BUY';
        const closeResult = await placeOrder({
          accountId: account.accountId,
          conid: pos.conid,
          symbol: pos.symbol,
          side: closeSide,
          quantity: pos.quantity,
          orderType: 'MKT',
        });

        if (closeResult) {
          totalPnL += pnl;
          positions.delete(symbol);

          await supabase.from('autonomous_trades')
            .update({
              exit_price: currentPrice,
              exit_time: new Date().toISOString(),
              pnl,
              pnl_percent: (pnl / (pos.entryPrice * pos.quantity)) * 100,
              status: 'closed',
            })
            .eq('symbol', pos.symbol)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1);

          log(`✓ Closed ${symbol} | PnL: $${pnl.toFixed(2)}`);
        }
      }
    }

    // Report status to farm_status
    await reportStatus({
      connected: true,
      authenticated: true,
      account_id: account.accountId,
      balance,
      open_positions: positions.size,
      trades_executed: tradesExecuted,
      total_pnl: totalPnL,
      cycles_completed: cycleCount,
    });

    const duration = Date.now() - startTime;
    log(`Cycle #${cycleCount} complete | Trades: ${cycleTrades} | Open positions: ${positions.size} | Duration: ${duration}ms`);

  } catch (err) {
    log(`Cycle error: ${err.message}`, 'error');
  }
}

// Report status to Supabase
async function reportStatus(status) {
  try {
    await supabase.from('farm_status').upsert({
      farm_name: 'ibkr-autonomous-trader',
      worker_id: WORKER_NAME,
      status: isRunning ? 'trading' : 'stopped',
      games_generated: tradesExecuted, // Using same column for trades
      last_game_at: new Date().toISOString(),
      metadata: {
        type: 'ibkr_paper_trading',
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

// Main loop
async function start() {
  log('=================================');
  log('IBKR Autonomous Trading Worker');
  log('=================================');
  log(`Worker ID: ${WORKER_ID}`);
  log(`Bridge URL: ${BRIDGE_URL}`);
  log(`Gateway: ${GATEWAY_HOST}:${GATEWAY_PORT}`);
  log(`Symbols: ${SYMBOLS.join(', ')}`);
  log('=================================');

  // Create session
  sessionId = `ibkr-${Date.now()}-${WORKER_ID}`;
  isRunning = true;

  // Initial connection check
  const status = await checkBridgeConnection();
  if (!status.connected) {
    log('⚠️ Bridge not running. Start it with: cd public/ib-gateway-bridge && npm start');
    log('Waiting for bridge...');
  }

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

// Handle errors
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`, 'error');
});

// Start
start().catch(err => {
  log(`Startup error: ${err.message}`, 'error');
  process.exit(1);
});
