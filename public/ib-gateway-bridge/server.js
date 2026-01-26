/**
 * IB Gateway Bridge Server
 * 
 * Translates HTTP requests to TWS API socket protocol for IB Gateway.
 * Run this on your local machine alongside IB Gateway.
 */

import express from 'express';
import cors from 'cors';
import { IBApi, EventName, Contract, Order, OrderAction, OrderType, SecType } from '@stoqey/ib';

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
let positions = new Map();
let orders = new Map();
let contractCache = new Map();

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

  ib.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
    if (orders.has(orderId)) {
      const order = orders.get(orderId);
      order.status = status;
      order.filledQuantity = filled;
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
    const contract = new Contract();
    contract.conId = conid;
    contract.symbol = symbol;
    contract.secType = SecType.STK;
    contract.exchange = 'SMART';
    contract.currency = 'USD';

    const order = new Order();
    order.action = side === 'BUY' ? OrderAction.BUY : OrderAction.SELL;
    order.orderType = orderType === 'MKT' ? OrderType.MKT : OrderType.LMT;
    order.totalQuantity = quantity;
    order.account = accountId;
    
    if (orderType === 'LMT' && price) {
      order.lmtPrice = price;
    }

    const orderId = nextOrderId++;
    ib.placeOrder(orderId, contract, order);

    res.json({ orderId: String(orderId), status: 'submitted' });
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

// Get quote
app.get('/api/quote', async (req, res) => {
  if (!connected) {
    return res.status(400).json({ error: 'Not connected' });
  }

  const { conid } = req.query;
  if (!conid) {
    return res.status(400).json({ error: 'conid required' });
  }

  // For now, return placeholder - real implementation needs market data subscription
  res.json({
    conid: parseInt(conid),
    lastPrice: 0,
    bid: 0,
    ask: 0,
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
