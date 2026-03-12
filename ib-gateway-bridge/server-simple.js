/**
 * IB Gateway Bridge Server
 *
 * Uses the `ib` npm package (NOT @stoqey/ib — that package has a placeOrder
 * encoding bug with IB Gateway 1043+). The `ib` package is CommonJS so we
 * import it via createRequire from within this ES module.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const IB = require('ib');

const app = express();
app.use(cors());
app.use(express.json());

const BRIDGE_PORT = 4000;
const IB_HOST = '127.0.0.1';
const IB_PORT = 4002;
const CLIENT_ID = 1;

let ib = null;
let connected = false;
let nextOrderId = 1;
let accounts = [];
let positions = new Map();
let orders = new Map();
let pendingOrders = new Map(); // orderId → {resolve, timeout} — awaits accept/reject confirmation
let reconnectTimer = null;
let connecting = false;
let reqId = 100; // Starting above order IDs to avoid collisions
function nextReqId() { return ++reqId; }

// Yahoo Finance → IBKR symbol + secType mapping
// Futures require localSymbol (e.g., "CLZ26" for Dec 2026 crude oil)
const SYMBOL_MAP = {
  // Futures — front-month contracts for March 2026
  // Roll schedule: CL/GC/PL=Apr(J26), SI/HG=May(K26), NG=Apr(J26), PA=Jun(M26), ES/NQ=Mar(H26 until Mar20)
  'CL=F': { symbol: 'CL', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'CLJ26' },
  'SI=F': { symbol: 'SI', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'SIK26' },
  'HG=F': { symbol: 'HG', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'HGK26' },
  'GC=F': { symbol: 'GC', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'GCJ26' },
  'NG=F': { symbol: 'NG', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'NGJ26' },
  'PA=F': { symbol: 'PA', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'PAM26' },
  'PL=F': { symbol: 'PL', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', localSymbol: 'PLJ26' },
  'ES=F': { symbol: 'ES', secType: 'FUT', exchange: 'CME',   currency: 'USD', localSymbol: 'ESH26' },
  'NQ=F': { symbol: 'NQ', secType: 'FUT', exchange: 'CME',   currency: 'USD', localSymbol: 'NQH26' },
  // ETFs — ARCA required for historical data
  'SLV':  { symbol: 'SLV',  secType: 'STK', exchange: 'ARCA',   currency: 'USD' },
  'GLD':  { symbol: 'GLD',  secType: 'STK', exchange: 'ARCA',   currency: 'USD' },
  'SPY':  { symbol: 'SPY',  secType: 'STK', exchange: 'ARCA',   currency: 'USD' },
  'QQQ':  { symbol: 'QQQ',  secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'USO':  { symbol: 'USO',  secType: 'STK', exchange: 'ARCA',   currency: 'USD' },
  // Stocks — explicit primary exchange
  'AMD':  { symbol: 'AMD',  secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'NVDA': { symbol: 'NVDA', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'GOOGL':{ symbol: 'GOOGL',secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'META': { symbol: 'META', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'MSFT': { symbol: 'MSFT', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'AAPL': { symbol: 'AAPL', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'AMZN': { symbol: 'AMZN', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
  'TSLA': { symbol: 'TSLA', secType: 'STK', exchange: 'NASDAQ', currency: 'USD' },
};

function initIB() {
  ib = new IB({ host: IB_HOST, port: IB_PORT, clientId: CLIENT_ID });

  ib.on('connected', () => {
    console.log('[Bridge] Connected to IB Gateway');
    connected = true;
    connecting = false;
    ib.reqIds(1);
    ib.reqManagedAccts();
    ib.reqMarketDataType(3); // 3 = Delayed (free for paper)
  });

  ib.on('disconnected', () => {
    console.log('[Bridge] Disconnected');
    connected = false;
    connecting = false;
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        console.log('[Bridge] Attempting reconnect...');
        tryConnect();
      }, 5000);
    }
  });

  ib.on('error', (err, codeOrObj) => {
    if (err && (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED')))) return;
    // ib npm package emits (err, {code, reqId}) or (err, numericCode) depending on version
    const code   = typeof codeOrObj === 'object' ? codeOrObj?.code   : codeOrObj;
    const reqId  = typeof codeOrObj === 'object' ? codeOrObj?.reqId  : err?.reqId;
    if (code === 2104 || code === 2106 || code === 2158 || code === 2107) return; // farm msgs
    if (err?.message?.includes('data farm')) return;
    const msg = err?.message || String(err);
    console.error(`[Bridge] Error [${code}] reqId=${reqId}:`, msg);
    // Resolve pending order promise with rejection if this error is order-related
    if (reqId != null && reqId !== -1 && pendingOrders.has(reqId)) {
      const { resolve, timeout } = pendingOrders.get(reqId);
      clearTimeout(timeout);
      pendingOrders.delete(reqId);
      resolve({ rejected: true, error: msg, code });
    }
  });

  ib.on('managedAccounts', (list) => {
    accounts = list.split(',').filter(a => a.trim()).map(id => ({
      accountId: id.trim(),
      accountType: id.trim().startsWith('DU') ? 'Paper' : 'Live',
      balance: null,
      buyingPower: null,
      currency: 'USD'
    }));
    console.log('[Bridge] Accounts:', accounts.map(a => a.accountId));
    accounts.forEach(a => {
      try { ib.reqAccountUpdates(true, a.accountId); } catch (_) {}
    });
  });

  ib.on('updateAccountValue', (key, value, currency, accountName) => {
    const acct = accounts.find(a => a.accountId === accountName);
    if (!acct) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (key === 'NetLiquidation')  { acct.balance     = num; acct.currency = currency || 'USD'; }
    if (key === 'AvailableFunds')  { acct.buyingPower = num; }
    if (key === 'BuyingPower')     { acct.buyingPower = num; }
  });

  ib.on('nextValidId', (id) => {
    if (id > nextOrderId) nextOrderId = id;
  });

  ib.on('position', (account, contract, pos, avgCost) => {
    positions.set(`${account}-${contract.conId || contract.symbol}`, {
      accountId: account,
      conid: contract.conId,
      symbol: contract.symbol,
      position: pos,
      avgCost
    });
  });

  ib.on('openOrder', (orderId, contract, order, orderState) => {
    // Resolve pending order promise — order was accepted by IBKR
    if (pendingOrders.has(orderId)) {
      const { resolve, timeout } = pendingOrders.get(orderId);
      clearTimeout(timeout);
      pendingOrders.delete(orderId);
      resolve({ rejected: false, status: orderState?.status || 'PreSubmitted' });
    }
    orders.set(orderId, {
      orderId: String(orderId),
      symbol: contract.symbol,
      side: order.action,
      quantity: order.totalQuantity,
      status: orderState?.status
    });
    console.log(`[Bridge] Order update: ${orderId} ${contract.symbol} ${order.action} → ${orderState?.status}`);
  });

  ib.on('orderStatus', (orderId, status) => {
    const o = orders.get(orderId);
    if (o) o.status = status;
    if (status === 'Filled') console.log(`[Bridge] ✓ FILLED orderId=${orderId}`);
  });

  return ib;
}

// Connect with guard against duplicate connections
function tryConnect() {
  if (connecting || connected) return;
  connecting = true;
  if (ib) {
    try { ib.disconnect(); } catch (_) {}
    ib = null;
  }
  ib = initIB();
  try {
    ib.connect(IB_HOST, IB_PORT, CLIENT_ID);
  } catch (err) {
    console.error('[Bridge] Connect error:', err.message);
    connecting = false;
  }
}

// Routes
app.get('/api/status', (req, res) => {
  res.json({ bridgeRunning: true, connected, accounts: accounts.length, positions: positions.size, orders: orders.size });
});

// Health check endpoint for load balancers and monitoring
app.get('/health', (req, res) => {
  const health = {
    status: connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bridge: {
      connected,
      ibHost: IB_HOST,
      ibPort: IB_PORT,
    },
    metrics: {
      accounts: accounts.length,
      positions: positions.size,
      orders: orders.size,
    }
  };
  
  const statusCode = connected ? 200 : 503;
  res.status(statusCode).json(health);
});

app.post('/api/connect', async (req, res) => {
  if (connected) return res.json({ connected: true });
  tryConnect();
  // Wait up to 8s for connection
  const start = Date.now();
  while (!connected && Date.now() - start < 8000) {
    await new Promise(r => setTimeout(r, 200));
  }
  if (connected) return res.json({ connected: true });
  res.status(503).json({ connected: false, error: 'IB Gateway not reachable on port ' + IB_PORT });
});

// Contract search — resolves Yahoo Finance symbols to IBKR conids
app.get('/api/search', async (req, res) => {
  const rawSymbol = req.query.symbol;
  if (!rawSymbol) return res.status(400).json({ error: 'symbol required' });
  if (!connected || !ib) return res.status(503).json({ error: 'Not connected' });

  const mapped = SYMBOL_MAP[rawSymbol];
  const ibSymbol = mapped ? mapped.symbol : rawSymbol;

  const id = nextReqId();
  let resolved = false;

  const timeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      try { ib.cancelMktData(id); } catch (_) {}
      res.status(504).json({ contracts: [] });
    }
  }, 8000);

  ib.once('symbolSamples', (reqId, contractDescriptions) => {
    if (reqId !== id || resolved) return;
    resolved = true;
    clearTimeout(timeout);
    const contracts = (contractDescriptions || []).slice(0, 5).map(d => ({
      conid:    d.conId,
      symbol:   rawSymbol,
      ibSymbol: d.symbol,
      secType:  d.secType,
      exchange: d.primaryExchange || d.exchange,
      currency: d.currency,
    }));
    res.json({ contracts });
  });

  try {
    ib.reqMatchingSymbols(id, ibSymbol);
  } catch (err) {
    resolved = true;
    clearTimeout(timeout);
    res.status(500).json({ error: err.message, contracts: [] });
  }
});

// Quote — returns last/bid/ask. Accepts ?symbol=AMD or ?conid=4391
app.get('/api/quote', async (req, res) => {
  if (!connected || !ib) return res.status(503).json({ error: 'Not connected' });

  const rawSymbol = req.query.symbol;
  const conid     = parseInt(req.query.conid);
  if (!rawSymbol && !conid) return res.status(400).json({ error: 'symbol or conid required' });

  // Build contract — IBKR needs exchange for reqMktData
  let contract;
  if (rawSymbol) {
    const mapped = SYMBOL_MAP[rawSymbol];
    if (mapped) {
      contract = { symbol: mapped.symbol, secType: mapped.secType, exchange: mapped.exchange, currency: mapped.currency };
    } else {
      contract = { symbol: rawSymbol, secType: 'STK', exchange: 'SMART', currency: 'USD' };
    }
  } else {
    // conId with SMART — works for most US equities
    contract = { conId: conid, exchange: 'SMART', currency: 'USD' };
  }

  const id = nextReqId();
  let resolved = false;
  const ticks = {};

  const finish = () => {
    if (resolved) return;
    resolved = true;
    try { ib.cancelMktData(id); } catch (_) {}
    // Fields: 1=bid, 2=ask, 4=last, 66=delayed_bid, 67=delayed_ask, 68=delayed_last, 75=close
    const lastPrice = ticks[68] ?? ticks[4]  ?? ticks[75] ?? null;
    const bid       = ticks[66] ?? ticks[1]  ?? null;
    const ask       = ticks[67] ?? ticks[2]  ?? null;

    if (lastPrice !== null) {
      return res.json({ symbol: rawSymbol || conid, lastPrice, bid, ask });
    }

    // ── Fallback: use last 1-min historical bar from USHMDS ──
    if (!rawSymbol) return res.json({ symbol: conid, lastPrice: null, bid: null, ask: null });
    const hId = nextReqId();
    const hBars = [];
    let hDone = false;
    const hTimeout = setTimeout(() => {
      if (!hDone) { hDone = true; ib.removeAllListeners(`historicalData.${hId}`); res.json({ symbol: rawSymbol, lastPrice: null, bid: null, ask: null }); }
    }, 8000);
    ib.on('historicalData', function hHandler(reqId, date, o, h, l, c) {
      if (reqId !== hId) return;
      if (typeof date === 'string' && date.startsWith('finished')) {
        if (!hDone) {
          hDone = true; clearTimeout(hTimeout); ib.removeListener('historicalData', hHandler);
          const last = hBars.length ? hBars[hBars.length - 1] : null;
          res.json({ symbol: rawSymbol, lastPrice: last?.close ?? null, bid: last?.close ?? null, ask: last?.close ?? null, source: 'historical' });
        }
        return;
      }
      if (c > 0) hBars.push({ close: parseFloat(c), open: parseFloat(o) });
    });
    try {
      ib.reqHistoricalData(hId, contract, '', '1 D', '1 min', 'TRADES', 1, 2, false);
    } catch (e) {
      clearTimeout(hTimeout); res.json({ symbol: rawSymbol, lastPrice: null, bid: null, ask: null });
    }
  };

  // Resolve once we have last + bid + ask (or timeout)
  const timeout = setTimeout(finish, 4000);

  const onTickPrice = (tickerId, field, price) => {
    if (tickerId !== id) return;
    if (price > 0) ticks[field] = price;
    const hasLast  = ticks[68] != null || ticks[4] != null;
    const hasBidAsk = (ticks[66] != null || ticks[1] != null) && (ticks[67] != null || ticks[2] != null);
    if (hasLast && hasBidAsk) { clearTimeout(timeout); finish(); }
  };

  ib.on('tickPrice', onTickPrice);
  res.on('finish', () => ib.removeListener('tickPrice', onTickPrice));

  try {
    ib.reqMktData(id, contract, '', true, false);
  } catch (err) {
    resolved = true;
    clearTimeout(timeout);
    ib.removeListener('tickPrice', onTickPrice);
    res.status(500).json({ error: err.message, lastPrice: null });
  }
});

app.get('/api/accounts', (req, res) => {
  res.json({ accounts });
});

app.get('/api/positions', async (req, res) => {
  if (!connected || !ib) return res.json({ positions: [] });
  positions.clear();
  let done = false;
  const timeout = setTimeout(() => {
    if (!done) { done = true; res.json({ positions: Array.from(positions.values()) }); }
  }, 5000);
  ib.once('positionEnd', () => {
    if (!done) { done = true; clearTimeout(timeout); res.json({ positions: Array.from(positions.values()) }); }
  });
  ib.reqPositions();
});

app.get('/api/orders', (req, res) => {
  res.json({ orders: Array.from(orders.values()) });
});

app.post('/api/orders', async (req, res) => {
  if (!connected) return res.status(400).json({ error: 'Not connected' });

  const { accountId, conid, symbol, side, quantity, orderType, price } = req.body;

  try {
    const orderId = nextOrderId++;
    const isLmt = orderType !== 'MKT';
    // Build full contract spec — IBKR requires exchange + secType for order placement
    const mapped = SYMBOL_MAP[symbol];
    const contract = mapped
      ? { symbol: mapped.symbol, secType: mapped.secType, exchange: mapped.exchange, currency: mapped.currency }
      : { ...(conid ? { conId: parseInt(conid) } : {}), symbol, secType: 'STK', exchange: 'SMART', currency: 'USD' };
    const order = {
      action:        side,
      orderType:     isLmt ? 'LMT' : 'MKT',
      totalQuantity: quantity,
      account:       accountId,
      transmit:      true,  // REQUIRED: false = held in gateway, never sent to exchange
      ...(isLmt && price ? { lmtPrice: parseFloat(price.toFixed(2)) } : {}),
    };

    console.log(`[Bridge] Placing order: ${side} ${quantity} ${symbol} ${order.orderType}${isLmt ? ' @ ' + order.lmtPrice : ''} (orderId:${orderId}) conId=${contract.conId||'auto'}`);
    // Wait up to 2s for accept (openOrder) or reject (error event) before responding
    const confirm = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pendingOrders.delete(orderId);
        resolve({ rejected: false, status: 'submitted' }); // timeout = assume submitted
      }, 2000);
      pendingOrders.set(orderId, { resolve, timeout });
      ib.placeOrder(orderId, contract, order);
    });
    if (confirm.rejected) {
      console.error(`[Bridge] ✗ Order ${orderId} REJECTED: ${confirm.error}`);
      return res.status(400).json({ error: confirm.error, code: confirm.code, orderId: String(orderId) });
    }
    res.json({ orderId: String(orderId), status: confirm.status || 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/forex — convert between currencies (e.g. CAD → USD to fund USD trades)
app.post('/api/forex', async (req, res) => {
  if (!connected) return res.status(400).json({ error: 'Not connected' });
  const { accountId, buyCurrency, sellCurrency, amount } = req.body;
  if (!accountId || !buyCurrency || !sellCurrency || !amount) {
    return res.status(400).json({ error: 'accountId, buyCurrency, sellCurrency, amount required' });
  }
  try {
    const orderId = nextOrderId++;
    const contract = {
      symbol:   buyCurrency,   // e.g. 'USD'
      secType:  'CASH',
      exchange: 'IDEALPRO',
      currency: sellCurrency,  // e.g. 'CAD'
    };
    const order = {
      action:        'BUY',
      orderType:     'MKT',
      totalQuantity: parseInt(amount),
      account:       accountId,
      transmit:      true,
    };
    console.log(`[Bridge] Forex: BUY ${amount} ${buyCurrency}.${sellCurrency} MKT (orderId:${orderId})`);
    ib.placeOrder(orderId, contract, order);
    res.json({ orderId: String(orderId), status: 'submitted', pair: `${buyCurrency}.${sellCurrency}`, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Options helpers ──────────────────────────────────────────────────────────
// Next weekly expiry (Friday). If today IS Friday before 4pm ET, use today.
function nextWeeklyExpiry() {
  const now = new Date();
  // Work in ET
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay(); // 0=Sun … 6=Sat
  const hour = et.getHours();
  let daysToFri = (5 - day + 7) % 7;
  if (daysToFri === 0 && hour >= 16) daysToFri = 7; // past close on Friday → next Friday
  const expiry = new Date(et);
  expiry.setDate(et.getDate() + daysToFri);
  const y = expiry.getFullYear();
  const m = String(expiry.getMonth() + 1).padStart(2, '0');
  const d = String(expiry.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// Strike rounded to nearest valid increment, offset by otmStrikes away from ATM
// right='C' → OTM = higher strike; right='P' → OTM = lower strike
function calcStrike(price, symbol, right, otmStrikes = 0) {
  const inc = (symbol === 'NVDA' && price > 500) ? 5 : 1;
  const atm = Math.round(price / inc) * inc;
  const dir = right.toUpperCase() === 'C' ? 1 : -1; // calls go up, puts go down
  return atm + dir * otmStrikes * inc;
}

// POST /api/options/order — places an ATM weekly call or put
app.post('/api/options/order', async (req, res) => {
  if (!connected) return res.status(400).json({ error: 'Not connected' });
  const { accountId, symbol, right, stockPrice, contracts, orderType, price } = req.body;
  if (!accountId || !symbol || !right || !stockPrice) {
    return res.status(400).json({ error: 'accountId, symbol, right, stockPrice required' });
  }
  try {
    const otmStrikes = parseInt(req.body.otmStrikes || 0); // 0=ATM, 2=2 strikes OTM
    const strike   = calcStrike(parseFloat(stockPrice), symbol, right, otmStrikes);
    const expiry   = nextWeeklyExpiry();
    const orderId  = nextOrderId++;
    const isLmt    = orderType !== 'MKT';
    const contract = {
      symbol,
      secType:                    'OPT',
      exchange:                   'SMART',
      currency:                   'USD',
      strike,
      right:                      right.toUpperCase(),  // 'C' or 'P'
      lastTradeDateOrContractMonth: expiry,
      multiplier:                 '100',
    };
    const order = {
      action:        'BUY',
      orderType:     isLmt ? 'LMT' : 'MKT',
      totalQuantity: contracts || 1,
      account:       accountId,
      transmit:      true,
      ...(isLmt && price ? { lmtPrice: parseFloat(price.toFixed(2)) } : {}),
    };
    console.log(`[Bridge] Options order: BUY ${contracts} ${symbol} ${expiry} ${strike}${right} ${order.orderType}${isLmt ? ' @ ' + order.lmtPrice : ''} (orderId:${orderId})`);
    ib.placeOrder(orderId, contract, order);
    res.json({ orderId: String(orderId), status: 'submitted', strike, expiry, right: right.toUpperCase(), symbol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/options/price — get current mid-price for an option contract
app.get('/api/options/price', async (req, res) => {
  if (!connected || !ib) return res.status(503).json({ error: 'Not connected' });
  const { symbol, strike, expiry, right } = req.query;
  if (!symbol || !strike || !expiry || !right) return res.status(400).json({ error: 'symbol,strike,expiry,right required' });

  const id = nextReqId();
  let resolved = false;
  const ticks = {};

  const finish = () => {
    if (resolved) return;
    resolved = true;
    ib.removeListener('tickPrice', onTick);
    try { ib.cancelMktData(id); } catch (_) {}
    const bid  = ticks[66] ?? ticks[1]  ?? null;
    const ask  = ticks[67] ?? ticks[2]  ?? null;
    const last = ticks[68] ?? ticks[4]  ?? ticks[75] ?? null;
    const mid  = (bid != null && ask != null && bid > 0 && ask > 0) ? parseFloat(((bid + ask) / 2).toFixed(4)) : (last ?? null);
    res.json({ symbol, strike: parseFloat(strike), expiry, right: right.toUpperCase(), mid, bid, ask, last });
  };

  const onTick = (tickerId, field, price) => {
    if (tickerId !== id) return;
    if (price > 0) ticks[field] = price;
    const hasBid = ticks[66] != null || ticks[1] != null;
    const hasAsk = ticks[67] != null || ticks[2] != null;
    if (hasBid && hasAsk) { clearTimeout(timeout); finish(); }
  };

  const timeout = setTimeout(finish, 5000);
  ib.on('tickPrice', onTick);
  res.on('finish', () => { ib.removeListener('tickPrice', onTick); clearTimeout(timeout); });

  const contract = {
    symbol, secType: 'OPT', exchange: 'SMART', currency: 'USD',
    strike: parseFloat(strike), right: right.toUpperCase(),
    lastTradeDateOrContractMonth: expiry, multiplier: '100',
  };
  try { ib.reqMktData(id, contract, '', true, false); }
  catch (err) { resolved = true; clearTimeout(timeout); ib.removeListener('tickPrice', onTick); res.json({ symbol, mid: null, error: err.message }); }
});

// POST /api/options/close — sell to close an options position
app.post('/api/options/close', async (req, res) => {
  if (!connected) return res.status(400).json({ error: 'Not connected' });
  const { accountId, symbol, right, strike, expiry, contracts, orderType, price } = req.body;
  try {
    const orderId = nextOrderId++;
    const isLmt   = orderType !== 'MKT';
    const contract = {
      symbol, secType: 'OPT', exchange: 'SMART', currency: 'USD',
      strike, right: right.toUpperCase(),
      lastTradeDateOrContractMonth: expiry, multiplier: '100',
    };
    const order = {
      action: 'SELL', orderType: isLmt ? 'LMT' : 'MKT',
      totalQuantity: contracts || 1, account: accountId,
      transmit: true,
      ...(isLmt && price ? { lmtPrice: parseFloat(price.toFixed(2)) } : {}),
    };
    console.log(`[Bridge] Options close: SELL ${contracts} ${symbol} ${expiry} ${strike}${right} (orderId:${orderId})`);
    ib.placeOrder(orderId, contract, order);
    res.json({ orderId: String(orderId), status: 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── System Reports ────────────────────────────────────────────────────────
const LATEST_REPORT_PATH = path.join(__dirname, '../../farm/data/latest-report.json');
app.get('/api/reports/latest', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    if (!fs.existsSync(LATEST_REPORT_PATH)) return res.status(404).json({ error: 'No report generated yet' });
    res.json(JSON.parse(fs.readFileSync(LATEST_REPORT_PATH, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── USHMDS Historical Data ─────────────────────────────────────────────────
// Maps Yahoo Finance interval/range params → IB barSize/duration strings
const IB_BAR_SIZE = {
  '1m': '1 min', '2m': '2 mins', '5m': '5 mins', '10m': '10 mins',
  '15m': '15 mins', '30m': '30 mins', '1h': '1 hour', '1d': '1 day',
};
const IB_DURATION = {
  '1d': '1 D', '2d': '2 D', '3d': '3 D', '5d': '5 D',
  '1mo': '1 M', '3mo': '3 M', '6mo': '6 M', '1y': '1 Y',
};

app.get('/api/historical', async (req, res) => {
  if (!connected || !ib) return res.status(503).json({ error: 'Not connected to IB Gateway' });

  const { symbol, interval = '5m', range = '2d' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const barSize = IB_BAR_SIZE[interval];
  const duration = IB_DURATION[range];
  if (!barSize || !duration) return res.status(400).json({ error: `Unsupported interval=${interval} or range=${range}` });

  const mapped = SYMBOL_MAP[symbol];
  const contract = mapped
    ? { symbol: mapped.symbol, secType: mapped.secType, exchange: mapped.exchange, currency: mapped.currency, ...(mapped.localSymbol ? { localSymbol: mapped.localSymbol } : {}) }
    : { symbol, secType: 'STK', exchange: 'SMART', currency: 'USD' };

  const id = nextReqId();
  const bars = [];
  let resolved = false;

  const timeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      try { ib.cancelHistoricalData(id); } catch (_) {}
      ib.removeAllListeners(`historicalData.${id}`);
      if (bars.length > 0) {
        res.json({ candles: bars, source: 'ib-timeout-partial' });
      } else {
        res.status(504).json({ error: 'Historical data timeout' });
      }
    }
  }, 15000);

  ib.on('historicalData', function handler(reqId, date, open, high, low, close, volume) {
    if (reqId !== id) return;
    if (typeof date === 'string' && date.startsWith('finished')) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        ib.removeListener('historicalData', handler);
        res.json({ candles: bars, source: 'ib-ushmds' });
      }
      return;
    }
    // formatDate=2 → IB returns Unix epoch seconds as string
    const ts = parseInt(date, 10);
    if (open > 0 && close > 0) {
      bars.push({ timestamp: ts, open: parseFloat(open), high: parseFloat(high), low: parseFloat(low), close: parseFloat(close), volume: parseInt(volume) || 0 });
    }
  });

  try {
    ib.reqHistoricalData(id, contract, '', duration, barSize, 'TRADES', 1, 2, false);
  } catch (err) {
    clearTimeout(timeout);
    res.status(500).json({ error: err.message });
  }
});

app.listen(BRIDGE_PORT, () => {
  console.log(`[Bridge] Server running on port ${BRIDGE_PORT}`);
  console.log(`[Bridge] IB Gateway: ${IB_HOST}:${IB_PORT}`);
  // Auto-connect on startup
  tryConnect();
});
