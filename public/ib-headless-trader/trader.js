/**
 * Headless IBKR Autonomous Trader
 * 
 * Runs 24/7 on a dedicated machine, connecting to IB Gateway via the bridge server.
 * Executes trades based on momentum/mean-reversion signals.
 */

import { CONFIG } from './config.js';

// State
let connected = false;
let account = null;
let positions = new Map();
let openOrders = new Map();
let dailyPnL = 0;
let tradesExecutedToday = 0;
let lastScanTime = 0;

// Logging
function log(level, message, data = {}) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const configLevel = levels.indexOf(CONFIG.LOG_LEVEL);
  const msgLevel = levels.indexOf(level);
  
  if (msgLevel >= configLevel) {
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`);
  }
}

// API calls to bridge
async function bridgeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${CONFIG.BRIDGE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`Bridge error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    log('error', `Bridge request failed: ${endpoint}`, { error: err.message });
    return null;
  }
}

// Check connection to bridge and IB Gateway
async function checkConnection() {
  const status = await bridgeRequest('/api/status');
  
  if (!status) {
    connected = false;
    return false;
  }
  
  connected = status.connected === true;
  log('debug', 'Connection status', status);
  return connected;
}

// Connect to IB Gateway via bridge
async function connect() {
  log('info', 'Connecting to IB Gateway...');
  
  const result = await bridgeRequest('/api/connect', {
    method: 'POST',
    body: JSON.stringify({
      host: '127.0.0.1',
      port: 4002, // Paper trading
      clientId: 2, // Use different clientId than UI
    }),
  });
  
  if (result?.connected) {
    connected = true;
    log('info', '✅ Connected to IB Gateway');
    
    // Fetch account info
    await refreshAccountData();
    return true;
  }
  
  log('error', '❌ Failed to connect to IB Gateway');
  return false;
}

// Refresh account data
async function refreshAccountData() {
  const accountsData = await bridgeRequest('/api/accounts');
  
  if (accountsData?.accounts?.length > 0) {
    account = accountsData.accounts[0];
    log('info', 'Account loaded', {
      id: account.accountId,
      balance: account.balance,
      buyingPower: account.buyingPower,
    });
  }
  
  // Refresh positions
  if (account) {
    const positionsData = await bridgeRequest(`/api/positions?accountId=${account.accountId}`);
    positions.clear();
    
    if (positionsData?.positions) {
      for (const pos of positionsData.positions) {
        positions.set(pos.symbol, pos);
      }
      log('debug', `Loaded ${positions.size} positions`);
    }
  }
  
  // Refresh orders
  const ordersData = await bridgeRequest('/api/orders');
  openOrders.clear();
  
  if (ordersData?.orders) {
    for (const order of ordersData.orders) {
      openOrders.set(order.orderId, order);
    }
    log('debug', `Loaded ${openOrders.size} open orders`);
  }
}

// Check if market is open
function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Convert to ET (rough approximation - adjust for your timezone)
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  const openTime = CONFIG.TRADING.MARKET_OPEN_HOUR * 60 + CONFIG.TRADING.MARKET_OPEN_MINUTE;
  const closeTime = CONFIG.TRADING.MARKET_CLOSE_HOUR * 60 + CONFIG.TRADING.MARKET_CLOSE_MINUTE;
  
  return timeInMinutes >= openTime && timeInMinutes < closeTime;
}

// Calculate simple momentum signal
function calculateSignal(symbol) {
  // In production, you'd fetch real price data and calculate indicators
  // For now, we'll use a simplified random signal for demonstration
  // Replace this with your actual signal logic
  
  const momentum = Math.random() - 0.5; // -0.5 to 0.5
  const confidence = 0.5 + Math.abs(momentum);
  
  return {
    symbol,
    direction: momentum > 0 ? 'LONG' : 'SHORT',
    confidence,
    momentum,
  };
}

// Search for contract ID
async function getContractId(symbol) {
  const result = await bridgeRequest(`/api/search?symbol=${encodeURIComponent(symbol)}`);
  
  if (result?.contracts?.length > 0) {
    return result.contracts[0].conid;
  }
  
  return null;
}

// Place an order
async function placeOrder(symbol, side, quantity) {
  if (!account) {
    log('warn', 'No account available');
    return null;
  }
  
  const conid = await getContractId(symbol);
  if (!conid) {
    log('warn', `Could not find contract for ${symbol}`);
    return null;
  }
  
  const order = {
    accountId: account.accountId,
    conid,
    symbol,
    side,
    quantity,
    orderType: 'MKT',
  };
  
  log('info', `Placing ${side} order`, order);
  
  const result = await bridgeRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
  
  if (result?.orderId) {
    log('info', `✅ Order placed: ${result.orderId}`);
    tradesExecutedToday++;
    return result;
  }
  
  log('error', `❌ Order failed for ${symbol}`);
  return null;
}

// Check and manage existing positions
async function managePositions() {
  for (const [symbol, position] of positions) {
    if (position.position === 0) continue;
    
    // Calculate P&L percentage
    const pnlPercent = position.avgCost > 0 
      ? ((position.marketValue / (position.avgCost * Math.abs(position.position))) - 1) * 100
      : 0;
    
    // Stop loss
    if (pnlPercent <= -CONFIG.TRADING.STOP_LOSS_PERCENT) {
      log('warn', `Stop loss triggered for ${symbol}`, { pnlPercent });
      const side = position.position > 0 ? 'SELL' : 'BUY';
      await placeOrder(symbol, side, Math.abs(position.position));
    }
    
    // Take profit
    if (pnlPercent >= CONFIG.TRADING.TAKE_PROFIT_PERCENT) {
      log('info', `Take profit triggered for ${symbol}`, { pnlPercent });
      const side = position.position > 0 ? 'SELL' : 'BUY';
      await placeOrder(symbol, side, Math.abs(position.position));
    }
  }
}

// Scan for new opportunities
async function scanForOpportunities() {
  // Check daily loss limit
  if (dailyPnL <= -CONFIG.TRADING.MAX_DAILY_LOSS) {
    log('warn', 'Daily loss limit reached, stopping trading');
    return;
  }
  
  // Check position limit
  const activePositions = Array.from(positions.values()).filter(p => p.position !== 0);
  if (activePositions.length >= CONFIG.TRADING.MAX_TOTAL_POSITIONS) {
    log('debug', 'Max positions reached, skipping scan');
    return;
  }
  
  for (const symbol of CONFIG.TRADING.SYMBOLS) {
    // Skip if already have position
    if (positions.has(symbol) && positions.get(symbol).position !== 0) {
      continue;
    }
    
    const signal = calculateSignal(symbol);
    
    if (signal.confidence >= CONFIG.TRADING.MIN_CONFIDENCE) {
      log('info', `Signal detected for ${symbol}`, signal);
      
      // Calculate position size (simplified)
      const shares = Math.min(
        CONFIG.TRADING.MAX_POSITION_SIZE,
        Math.floor(CONFIG.TRADING.MAX_POSITION_VALUE / 100) // Assume ~$100/share
      );
      
      if (shares > 0) {
        const side = signal.direction === 'LONG' ? 'BUY' : 'SELL';
        await placeOrder(symbol, side, shares);
      }
    }
  }
}

// Main trading loop
async function tradingLoop() {
  log('info', '🔄 Trading loop iteration');
  
  // Check connection
  if (!connected) {
    const reconnected = await connect();
    if (!reconnected) {
      log('warn', 'Not connected, waiting...');
      return;
    }
  }
  
  // Refresh data
  await refreshAccountData();
  
  // Only trade during market hours
  if (!isMarketOpen()) {
    log('debug', 'Market closed, skipping trading');
    return;
  }
  
  // Manage existing positions (stop loss / take profit)
  await managePositions();
  
  // Scan for new opportunities
  await scanForOpportunities();
  
  log('debug', 'Trading loop complete', {
    positions: positions.size,
    openOrders: openOrders.size,
    tradesExecutedToday,
  });
}

// Reset daily stats at midnight
function resetDailyStats() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    dailyPnL = 0;
    tradesExecutedToday = 0;
    log('info', '📅 Daily stats reset');
  }
}

// Main entry point
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         IBKR Headless Autonomous Trader v1.0                ║
╠══════════════════════════════════════════════════════════════╣
║  Bridge URL:     ${CONFIG.BRIDGE_URL.padEnd(40)}║
║  Symbols:        ${CONFIG.TRADING.SYMBOLS.join(', ').padEnd(40)}║
║  Scan Interval:  ${(CONFIG.TRADING.SCAN_INTERVAL_MS / 1000 + 's').padEnd(40)}║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // Initial connection
  await connect();
  
  // Main loop
  setInterval(async () => {
    try {
      resetDailyStats();
      await tradingLoop();
    } catch (err) {
      log('error', 'Trading loop error', { error: err.message });
    }
  }, CONFIG.TRADING.SCAN_INTERVAL_MS);
  
  // Keep alive
  log('info', '🚀 Trader started, running continuously...');
}

// Handle shutdown
process.on('SIGINT', () => {
  log('info', '⏹️ Shutting down trader...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', '⏹️ Shutting down trader...');
  process.exit(0);
});

// Start
main().catch(err => {
  log('error', 'Fatal error', { error: err.message });
  process.exit(1);
});
