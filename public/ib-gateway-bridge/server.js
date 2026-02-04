/**
 * IB Gateway Bridge Server
 * 
 * Translates HTTP requests to TWS API socket protocol for IB Gateway.
 * Run this on your local machine alongside IB Gateway.
 */

import express from 'express';
import cors from 'cors';
import pkg from '@stoqey/ib';
const { IBApi, EventName } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// Configuration from environment
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '4000');
const IB_HOST = process.env.IB_HOST || '127.0.0.1';
const IB_PORT = parseInt(process.env.IB_PORT || '4002');
const CLIENT_ID = parseInt(process.env.CLIENT_ID || '1');

// IB API instance
let ib = null;
let connected = false;
let nextOrderId = 1;
let accounts = [];
let accountSummary = new Map(); // Store account values
let positions = new Map();
let orders = new Map();
let contractCache = new Map();
let pendingOrders = new Map(); // Track order execution status

// Fallback contract IDs for major symbols
const FALLBACK_CONTRACTS = {
  'AAPL': { conid: 265598, symbol: 'AAPL' },
  'MSFT': { conid: 272093, symbol: 'MSFT' },
  'NVDA': { conid: 202994, symbol: 'NVDA' },
  'TSLA': { conid: 76792991, symbol: 'TSLA' },
  'AMD': { conid: 4391, symbol: 'AMD' },
  'META': { conid: 107113386, symbol: 'META' },
  'GOOGL': { conid: 208813720, symbol: 'GOOGL' },
  'AMZN': { conid: 3691937, symbol: 'AMZN' },
  'SPY': { conid: 756733, symbol: 'SPY' },
  'QQQ': { conid: 320504791, symbol: 'QQQ' },
  'IWM': { conid: 14433401, symbol: 'IWM' },
};

// Market data cache
let marketData = new Map();

// Initialize IB API
function initIB() {
  ib = new IBApi({
    host: IB_HOST,
    port: IB_PORT,
    clientId: CLIENT_ID,
  });

  // Connection events
  ib.on(EventName.connected, () => {
    console.log('[Bridge] Connected to IB Gateway');
    connected = true;
    ib.reqIds();
    ib.reqManagedAccts();
  });

  ib.on(EventName.disconnected, () => {
    console.log('[Bridge] Disconnected from IB Gateway');
    connected = false;
  });

  ib.on(EventName.error, (err, code, reqId) => {
    console.error('[Bridge] IB Error:', { err, code, reqId });
  });

  // Account data
  ib.on(EventName.managedAccounts, (accountsList) => {
    accounts = accountsList.split(',').filter(a => a).map(accountId => ({
      accountId,
      accountType: accountId.startsWith('DU') ? 'Paper' : 'Live',
      balance: 0,
      buyingPower: 0,
      currency: 'USD',
    }));
    console.log('[Bridge] Accounts:', accounts);
    
    // Request account summary for each account
    accounts.forEach((acc, idx) => {
      const reqId = 9000 + idx;
      ib.reqAccountSummary(reqId, 'All', 'NetLiquidation,BuyingPower,AvailableFunds,TotalCashValue');
    });
  });

  // Account summary data
  ib.on(EventName.accountSummary, (reqId, account, tag, value, currency) => {
    if (!accountSummary.has(account)) {
      accountSummary.set(account, { currency: currency });
    }
    const summary = accountSummary.get(account);
    
    if (tag === 'NetLiquidation') {
      summary.balance = parseFloat(value) || 0;
    } else if (tag === 'BuyingPower') {
      summary.buyingPower = parseFloat(value) || 0;
    } else if (tag === 'AvailableFunds') {
      summary.availableFunds = parseFloat(value) || 0;
    } else if (tag === 'TotalCashValue') {
      summary.cashValue = parseFloat(value) || 0;
    }
    summary.currency = currency;
    
    // Update accounts array with real values
    const accIdx = accounts.findIndex(a => a.accountId === account);
    if (accIdx >= 0) {
      accounts[accIdx].balance = summary.balance || 0;
      accounts[accIdx].buyingPower = summary.buyingPower || 0;
      accounts[accIdx].currency = summary.currency || 'USD';
    }
    
    console.log(`[Bridge] Account ${account} ${tag}: ${value} ${currency}`);
  });

  ib.on(EventName.accountSummaryEnd, (reqId) => {
    console.log('[Bridge] Account summary complete');
  });

  // Order ID
  ib.on(EventName.nextValidId, (orderId) => {
    nextOrderId = orderId;
    console.log('[Bridge] Next order ID:', orderId);
  });

  // Positions
  ib.on(EventName.position, (account, contract, pos, avgCost) => {
    const key = `${account}-${contract.conId}`;
    positions.set(key, {
      accountId: account,
      conid: contract.conId,
      symbol: contract.symbol,
      position: pos,
      avgCost: avgCost,
      marketValue: pos * avgCost,
      unrealizedPnl: 0,
      realizedPnl: 0,
    });
  });

  ib.on(EventName.positionEnd, () => {
    console.log('[Bridge] Positions loaded:', positions.size);
  });

  // Orders
  ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
    orders.set(orderId, {
      orderId: String(orderId),
      conid: contract.conId,
      symbol: contract.symbol,
      side: order.action,
      orderType: order.orderType,
      quantity: order.totalQuantity,
      filledQuantity: order.filledQuantity || 0,
      price: order.lmtPrice,
      status: orderState.status,
    });
  });

  ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice, permId, parentId, lastFillPrice, clientId, whyHeld, mktCapPrice) => {
    // Update orders map
    if (orders.has(orderId)) {
      const order = orders.get(orderId);
      order.status = status;
      order.filledQuantity = filled;
    }
    
    // Update pending orders tracking
    if (pendingOrders.has(orderId)) {
      const pending = pendingOrders.get(orderId);
      pending.status = status;
      pending.filled = filled;
      pending.remaining = remaining;
      if (whyHeld) pending.reason = whyHeld;
    }
  });

  // Contract search results
  ib.on(EventName.symbolSamples, (reqId, contractDescriptions) => {
    const results = contractDescriptions.map(cd => ({
      conid: cd.contract.conId,
      symbol: cd.contract.symbol,
      description: cd.derivativeSecTypes?.join(', ') || '',
    }));
    contractCache.set(reqId, results);
  });

  // Market data
  ib.on(EventName.tickPrice, (reqId, tickType, price, attrib) => {
    if (!marketData.has(reqId)) {
      marketData.set(reqId, {});
    }
    const data = marketData.get(reqId);
    
    // Tick types: 1=bid, 2=ask, 4=last, 9=close
    if (tickType === 1) data.bid = price;
    else if (tickType === 2) data.ask = price;
    else if (tickType === 4) data.lastPrice = price;
    else if (tickType === 9 && !data.lastPrice) data.lastPrice = price; // Use close as fallback
  });

  return ib;
}

// API Routes

// Status
app.get('/api/status', (req, res) => {
  res.json({
    bridgeRunning: true,
    connected,
    accounts: accounts.length,
    positions: positions.size,
    orders: orders.size,
    config: { host: IB_HOST, port: IB_PORT, clientId: CLIENT_ID },
  });
});

// Connect
app.post('/api/connect', async (req, res) => {
  try {
    const { host, port, clientId } = req.body || {};
    
    if (ib && connected) {
      return res.json({ connected: true, message: 'Already connected' });
    }

    ib = initIB();
    ib.connect();

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
      const checkConnection = setInterval(() => {
        if (connected) {
          clearInterval(checkConnection);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 100);
    });

    res.json({ connected: true });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Disconnect
app.post('/api/disconnect', (req, res) => {
  if (ib) {
    ib.disconnect();
    connected = false;
  }
  res.json({ disconnected: true });
});

// Accounts
app.get('/api/accounts', (req, res) => {
  // Request fresh account data
  if (ib && connected && accounts.length > 0) {
    accounts.forEach((acc, idx) => {
      const reqId = 9000 + idx;
      try {
        ib.cancelAccountSummary(reqId); // Cancel any existing
      } catch {}
      ib.reqAccountSummary(reqId, 'All', 'NetLiquidation,BuyingPower,AvailableFunds,TotalCashValue');
    });
  }
  res.json({ accounts });
});

// Positions
app.get('/api/positions', (req, res) => {
  const { accountId } = req.query;
  
  if (ib && connected) {
    ib.reqPositions();
  }

  // Filter by account if provided
  let positionsArray = Array.from(positions.values());
  if (accountId) {
    positionsArray = positionsArray.filter(p => p.accountId === accountId);
  }
  
  res.json({ positions: positionsArray });
});

// Orders
app.get('/api/orders', (req, res) => {
  if (ib && connected) {
    ib.reqAllOpenOrders();
  }
  res.json({ orders: Array.from(orders.values()) });
});

// Place order
app.post('/api/orders', async (req, res) => {
  if (!connected) {
    return res.status(400).json({ error: 'Not connected to IB Gateway' });
  }

  const { accountId, conid, symbol, side, quantity, orderType, price } = req.body;

  try {
    // Use plain objects for contract and order (library doesn't export classes)
    const contract = {
      conId: conid,
      symbol: symbol,
      secType: 'STK',
      exchange: 'SMART',
      currency: 'USD'
    };

    const order = {
      action: side === 'BUY' ? 'BUY' : 'SELL',
      orderType: orderType === 'MKT' ? 'MKT' : 'LMT',
      totalQuantity: quantity,
      account: accountId,
      lmtPrice: (orderType === 'LMT' && price) ? price : 0
    };

    const orderId = nextOrderId++;
    
    // Track order status
    let orderStatus = { status: 'pending', filled: 0, remaining: quantity };
    pendingOrders.set(orderId, orderStatus);
    
    ib.placeOrder(orderId, contract, order);

    // Wait for execution status (up to 5 seconds)
    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      const checkInterval = setInterval(() => {
        const status = pendingOrders.get(orderId);
        if (status && (status.status === 'Filled' || status.status === 'Cancelled' || status.status === 'Rejected')) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 100);
    });

    const finalStatus = pendingOrders.get(orderId);
    pendingOrders.delete(orderId);

    if (finalStatus?.status === 'Filled') {
      res.json({ orderId: String(orderId), status: 'filled', filled: finalStatus.filled });
    } else if (finalStatus?.status === 'Rejected') {
      res.status(400).json({ error: 'Order rejected by IBKR', reason: finalStatus.reason });
    } else {
      res.json({ orderId: String(orderId), status: 'submitted', warning: 'Execution status unknown' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel order
app.delete('/api/orders/:orderId', (req, res) => {
  if (!connected) {
    return res.status(400).json({ error: 'Not connected' });
  }

  const orderId = parseInt(req.params.orderId);
  ib.cancelOrder(orderId);
  orders.delete(orderId);
  
  res.json({ cancelled: true });
});

// Search contracts
app.get('/api/search', async (req, res) => {
  if (!connected) {
    return res.status(400).json({ error: 'Not connected' });
  }

  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  const reqId = Date.now();
  ib.reqMatchingSymbols(reqId, String(symbol));

  // Wait for results
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const contracts = contractCache.get(reqId) || [];
  contractCache.delete(reqId);
  
  res.json({ contracts });
});

// Get live market data from external API (bypasses IBKR data subscription requirement)
async function getExternalQuote(symbol) {
  try {
    // Use Yahoo Finance API (free, no key needed)
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta;
      return {
        lastPrice: meta.regularMarketPrice || meta.previousClose,
        bid: meta.regularMarketPrice * 0.999,
        ask: meta.regularMarketPrice * 1.001,
        source: 'yahoo'
      };
    }
  } catch (err) {
    console.log('[Bridge] External quote failed:', err.message);
  }
  return null;
}

// Get quote with delayed market data support
app.get('/api/quote', async (req, res) => {
  if (!connected) {
    return res.status(400).json({ error: 'Not connected' });
  }

  const { conid } = req.query;
  if (!conid) {
    return res.status(400).json({ error: 'conid required' });
  }

  const reqId = parseInt(conid);
  
  // Request market data with delayed flag (free for paper)
  ib.reqMktData(reqId, { conId: parseInt(conid), exchange: 'SMART' }, '', false, false);
  
  // Also request delayed data as fallback
  ib.reqMktData(reqId + 100000, { conId: parseInt(conid), exchange: 'SMART' }, '221', false, false);
  
  // Wait for data (with timeout)
  let data = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(marketData.get(reqId) || marketData.get(reqId + 100000) || { lastPrice: 0, bid: 0, ask: 0 });
    }, 2000);
    
    const checkInterval = setInterval(() => {
      const cached = marketData.get(reqId) || marketData.get(reqId + 100000);
      if (cached && cached.lastPrice > 0) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        resolve(cached);
      }
    }, 100);
  });

  // If IBKR data is 0, try external API
  if (!data || data.lastPrice === 0) {
    const symbol = [...FALLBACK_CONTRACTS.entries()].find(([_, c]) => c.conid === parseInt(conid))?.[1]?.symbol;
    if (symbol) {
      const external = await getExternalQuote(symbol);
      if (external) {
        data = external;
      }
    }
  }

  res.json({
    conid: parseInt(conid),
    lastPrice: data.lastPrice || 0,
    bid: data.bid || 0,
    ask: data.ask || 0,
  });
});

// Start server
app.listen(BRIDGE_PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           IB Gateway Bridge Server v1.0                   ║
╠════════════════════════════════════════════════════════════╣
║  Bridge URL:    http://localhost:${BRIDGE_PORT}                    ║
║  IB Gateway:    ${IB_HOST}:${IB_PORT}                            ║
║  Client ID:     ${CLIENT_ID}                                       ║
╠════════════════════════════════════════════════════════════╣
║  1. Start IB Gateway and log in                           ║
║  2. Enable API in IB Gateway settings                     ║
║  3. POST to /api/connect to establish connection          ║
╚════════════════════════════════════════════════════════════╝
  `);
});
