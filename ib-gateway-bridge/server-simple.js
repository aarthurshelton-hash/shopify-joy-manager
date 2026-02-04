/**
 * IB Gateway Bridge Server - Simplified
 * 
 * Basic HTTP bridge to IB Gateway for paper trading
 */

import express from 'express';
import cors from 'cors';
import pkg from '@stoqey/ib';
const { IBApi, EventName } = pkg;

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

function initIB() {
  ib = new IBApi({ host: IB_HOST, port: IB_PORT, clientId: CLIENT_ID });

  ib.on(EventName.connected, () => {
    console.log('[Bridge] Connected to IB Gateway');
    connected = true;
    ib.reqIds();
    ib.reqManagedAccts();
    // Request delayed market data mode (free for paper)
    ib.reqMarketDataType(3); // 3 = Delayed
    console.log('[Bridge] Requested delayed market data mode');
  });

  ib.on(EventName.disconnected, () => {
    console.log('[Bridge] Disconnected');
    connected = false;
  });

  ib.on(EventName.error, (err) => {
    console.error('[Bridge] Error:', err);
  });

  ib.on(EventName.managedAccounts, (list) => {
    accounts = list.split(',').filter(a => a).map(id => ({
      accountId: id,
      accountType: id.startsWith('DU') ? 'Paper' : 'Live',
      balance: 250000,
      buyingPower: 833805,
      currency: 'USD'
    }));
    console.log('[Bridge] Accounts:', accounts.map(a => a.accountId));
  });

  ib.on(EventName.nextValidId, (id) => {
    nextOrderId = id;
  });

  ib.on(EventName.position, (account, contract, pos, avgCost) => {
    positions.set(`${account}-${contract.conId}`, {
      accountId: account,
      conid: contract.conId,
      symbol: contract.symbol,
      position: pos,
      avgCost
    });
  });

  ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
    orders.set(orderId, {
      orderId: String(orderId),
      symbol: contract.symbol,
      side: order.action,
      quantity: order.totalQuantity,
      status: orderState.status
    });
  });

  return ib;
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
  try {
    if (ib && connected) return res.json({ connected: true });
    ib = initIB();
    ib.connect();
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
      const check = setInterval(() => {
        if (connected) {
          clearInterval(check);
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

app.get('/api/accounts', (req, res) => {
  if (ib && connected) ib.reqAccountSummary(9000, 'All', 'NetLiquidation,BuyingPower');
  res.json({ accounts });
});

app.get('/api/positions', (req, res) => {
  if (ib && connected) ib.reqPositions();
  res.json({ positions: Array.from(positions.values()) });
});

app.get('/api/orders', (req, res) => {
  res.json({ orders: Array.from(orders.values()) });
});

app.post('/api/orders', async (req, res) => {
  if (!connected) return res.status(400).json({ error: 'Not connected' });
  
  const { accountId, conid, symbol, side, quantity, orderType } = req.body;
  
  try {
    const orderId = nextOrderId++;
    const contract = { conId: conid, symbol, secType: 'STK', exchange: 'SMART', currency: 'USD' };
    const order = { action: side, orderType: orderType === 'MKT' ? 'MKT' : 'LMT', totalQuantity: quantity, account: accountId };
    
    ib.placeOrder(orderId, contract, order);
    res.json({ orderId: String(orderId), status: 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(BRIDGE_PORT, () => {
  console.log(`[Bridge] Server running on port ${BRIDGE_PORT}`);
  console.log(`[Bridge] IB Gateway: ${IB_HOST}:${IB_PORT}`);
});
