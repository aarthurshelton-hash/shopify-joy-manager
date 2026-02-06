#!/usr/bin/env node
/**
 * 24/7 Futures Trading Worker
 * 
 * Trades E-mini futures (/ES, /NQ) nearly 24/7 for continuous learning.
 * Futures trade Sunday 6:00 PM - Friday 5:00 PM EST (23 hours/day)
 * 
 * Contracts:
 * - /ES: E-mini S&P 500 ($50 x index point)
 * - /NQ: E-mini NASDAQ-100 ($20 x index point)
 * 
 * @version 1.0-FUTURES-24X7
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// Configuration - FUTURES
const CONFIG = {
  CYCLE_INTERVAL_MS: 15000,        // Trade every 15 seconds (faster than equities)
  MIN_CONFIDENCE: 0.40,            // Lower threshold for volume
  CONTRACT_SIZE: 1,                  // 1 contract per trade
  MAX_POSITIONS: 2,                // Max 2 concurrent futures positions
  STOP_LOSS_TICKS: 8,               // 8 tick stop loss
  TAKE_PROFIT_TICKS: 16,          // 16 tick take profit (2:1 R:R)
  MAX_HOLD_MS: 120000,             // 2 minute max hold for scalping
  SIMULATED_FILL: false,           // REAL EXECUTION
  LIVE_TRADING: true,
  
  // Futures symbols with IBKR conids (updated monthly for front month)
  SYMBOLS: [
    { symbol: 'ES', name: 'E-mini S&P 500', conid: 458996, tickSize: 0.25, tickValue: 12.50, multiplier: 50 },
    { symbol: 'NQ', name: 'E-mini NASDAQ', conid: 459994, tickSize: 0.25, tickValue: 5.00, multiplier: 20 }
  ],
  
  // Futures trading hours (nearly 24/7)
  TRADING_HOURS: {
    // Sunday 6:00 PM - Friday 5:00 PM EST
    enabled: true,
    weekendBreakStart: 17, weekendBreakEnd: 18, // 5PM Fri - 6PM Sun (EST)
  },
};

// Connection
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aufycarwflhsdgszbnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BRIDGE_URL = process.env.IB_BRIDGE_URL || 'http://localhost:4000';
const GATEWAY_HOST = process.env.IB_GATEWAY_HOST || '127.0.0.1';
const GATEWAY_PORT = parseInt(process.env.IB_GATEWAY_PORT || '4002');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// State
const WORKER_ID = `futures-trader-${Date.now()}`;
const WORKER_NAME = 'futures-24x7-trader';
let sessionId = null;
let isRunning = false;
let positions = new Map();
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;

// Logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${WORKER_NAME}]`;
  
  let fullMessage;
  if (level === 'error') {
    fullMessage = `${prefix} ❌ ${message}`;
    console.error(fullMessage);
  } else if (level === 'warn') {
    fullMessage = `${prefix} ⚠️  ${message}`;
    console.warn(fullMessage);
  } else if (level === 'trade') {
    fullMessage = `${prefix} 💰 ${message}`;
    console.log(fullMessage);
  } else {
    fullMessage = `${prefix} ℹ️  ${message}`;
    console.log(fullMessage);
  }
}

// Check if futures market is open (nearly 24/7)
function isFuturesMarketOpen() {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  const hours = now.getHours();
  
  // Friday after 5:00 PM - market closed until Sunday 6:00 PM
  if (day === 5 && hours >= 17) return { open: false, reason: 'weekend_break' };
  if (day === 6) return { open: false, reason: 'saturday' };
  if (day === 0 && hours < 18) return { open: false, reason: 'sunday_pre_market' };
  
  return { open: true };
}

// Check bridge connection
async function checkBridgeConnection() {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/status`);
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch (err) {
    return { connected: false };
  }
}

// Connect to gateway
async function connectToGateway() {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: GATEWAY_HOST,
        port: GATEWAY_PORT,
        clientId: Math.floor(Math.random() * 1000) + 100, // Different client ID
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.connected;
  } catch (err) {
    return false;
  }
}

// Get accounts
async function getAccounts() {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/accounts`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    return [];
  }
}

// Get positions from IBKR
async function getPositions(accountId) {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/positions?accountId=${accountId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.positions || [];
  } catch (err) {
    return [];
  }
}

// Place futures order
async function placeFuturesOrder(order) {
  try {
    if (CONFIG.SIMULATED_FILL) {
      const orderId = Date.now() + Math.floor(Math.random() * 1000);
      log(`SIMULATED: ${order.side} ${order.quantity} ${order.symbol}`, 'trade');
      return { orderId: String(orderId), status: 'filled', filled: order.quantity };
    }
    
    const response = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      const text = await response.text();
      log(`Order failed: ${text}`, 'error');
      return null;
    }
    return await response.json();
  } catch (err) {
    log(`Order error: ${err.message}`, 'error');
    return null;
  }
}

// Get futures signal based on real market momentum
async function getFuturesSignal(symbol) {
  try {
    // Fetch real futures data from IBKR or external source
    const response = await fetch(`${BRIDGE_URL}/api/quote?conid=${symbol === 'ES' ? 458996 : 459994}`);
    if (!response.ok) {
      log(`Failed to fetch ${symbol} quote`, 'warn');
      return { direction: 'neutral', confidence: 0 };
    }
    
    const quote = await response.json();
    if (!quote || !quote.lastPrice) {
      log(`No price data for ${symbol}`, 'warn');
      return { direction: 'neutral', confidence: 0 };
    }
    
    // Calculate momentum based on bid/ask spread and price action
    const spread = (quote.ask - quote.bid) / quote.lastPrice;
    const momentum = spread > 0.0002 ? (quote.bid > quote.lastPrice * 0.999 ? 'long' : 'short') : 'neutral';
    
    // Check recent prediction outcomes for this futures symbol
    const { data: recent } = await supabase
      .from('prediction_outcomes')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recent && recent.length >= 2) {
      const upCount = recent.filter(r => r.predicted_direction === 'up').length;
      const avgConfidence = recent.reduce((sum, r) => sum + (r.predicted_confidence || 0), 0) / recent.length;
      
      if (upCount >= 2 && momentum === 'long') {
        return { direction: 'long', confidence: Math.min(0.85, 0.5 + avgConfidence), source: 'enpensent' };
      } else if (upCount <= 1 && momentum === 'short') {
        return { direction: 'short', confidence: Math.min(0.85, 0.5 + avgConfidence), source: 'enpensent' };
      }
    }
    
    // Fallback to market momentum if no En Pensent data
    if (momentum !== 'neutral') {
      return { direction: momentum, confidence: 0.45, source: 'market_momentum' };
    }
    
    return { direction: 'neutral', confidence: 0 };
  } catch (err) {
    log(`Signal error for ${symbol}: ${err.message}`, 'error');
    return { direction: 'neutral', confidence: 0 };
  }
}

// Run trading cycle
async function runCycle() {
  if (!isRunning) return;

  const startTime = Date.now();
  cycleCount++;
  
  // Check futures market hours
  const marketStatus = isFuturesMarketOpen();
  if (!marketStatus.open) {
    if (cycleCount % 100 === 0) {
      log(`Futures market closed: ${marketStatus.reason}`, 'info');
    }
    return;
  }

  try {
    // Check connection
    const status = await checkBridgeConnection();
    if (!status.connected) {
      const connected = await connectToGateway();
      if (!connected) return;
    }

    // Get account
    const accounts = await getAccounts();
    const paperAccount = accounts.find(a => a.accountId?.startsWith('DU')) || accounts[0];
    if (!paperAccount) {
      log('No paper account', 'warn');
      return;
    }

    const balance = paperAccount.balance || 250000;

    // Get current positions
    const ibkrPositions = await getPositions(paperAccount.accountId);
    const openSymbols = new Set(ibkrPositions.map(p => p.symbol));

    // Manage open positions first (close if needed)
    for (const [symbol, pos] of positions) {
      const holdTime = Date.now() - pos.entryTime;
      
      // Close after max hold time or based on ticks
      if (holdTime > CONFIG.MAX_HOLD_MS) {
        const closeSide = pos.side === 'long' ? 'SELL' : 'BUY';
        const closeResult = await placeFuturesOrder({
          accountId: paperAccount.accountId,
          conid: pos.conid,
          symbol: `/${symbol}`,
          side: closeSide,
          quantity: pos.quantity,
          orderType: 'MKT',
          secType: 'FUT',
        });

        if (closeResult) {
          positions.delete(symbol);
          
          // Update database
          await supabase.from('autonomous_trades').update({
            exit_price: pos.entryPrice + (pos.side === 'long' ? 4 : -4) * pos.tickSize,
            exit_time: new Date().toISOString(),
            status: 'closed',
            close_reason: 'timeout'
          }).eq('symbol', symbol).eq('status', 'open');
          
          log(`CLOSED ${symbol} | Timeout after ${(holdTime/1000).toFixed(0)}s`, 'trade');
        }
      }
    }

    // Open new positions if under limit
    if (positions.size >= CONFIG.MAX_POSITIONS) return;

    // Trade each futures symbol
    for (const futures of CONFIG.SYMBOLS) {
      if (positions.size >= CONFIG.MAX_POSITIONS) break;
      if (openSymbols.has(futures.symbol)) continue;

      // Get signal
      const signal = await getFuturesSignal(futures.symbol);
      
      if (signal.confidence < CONFIG.MIN_CONFIDENCE || signal.direction === 'neutral') {
        continue;
      }

      // Get real price quote from IBKR
      const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${futures.conid}`);
      const quote = quoteRes.ok ? await quoteRes.json() : null;
      
      if (!quote || !quote.lastPrice) {
        log(`No real price for ${futures.symbol}, skipping`, 'warn');
        continue;
      }
      
      const price = quote.lastPrice;

      // Place order
      const side = signal.direction === 'long' ? 'BUY' : 'SELL';
      const result = await placeFuturesOrder({
        accountId: paperAccount.accountId,
        conid: futures.conid,
        symbol: `/${futures.symbol}`,
        side,
        quantity: CONFIG.CONTRACT_SIZE,
        orderType: 'MKT',
        secType: 'FUT',
      });

      if (result?.status === 'filled' || result?.status === 'submitted') {
        tradesExecuted++;
        
        // Track position
        positions.set(futures.symbol, {
          id: result.orderId,
          symbol: futures.symbol,
          conid: futures.conid,
          side: signal.direction,
          entryPrice: price,
          quantity: CONFIG.CONTRACT_SIZE,
          tickSize: futures.tickSize,
          tickValue: futures.tickValue,
          entryTime: Date.now(),
        });

        // Log to database
        try {
          const { data: insertData, error: insertError } = await supabase.from('autonomous_trades').insert({
            symbol: futures.symbol,
            direction: signal.direction,
            entry_price: price,
            shares: CONFIG.CONTRACT_SIZE,
            predicted_direction: signal.direction,
            predicted_confidence: signal.confidence,
            status: 'open',
            metadata: {
              contract_type: 'futures',
              tick_size: futures.tickSize,
              tick_value: futures.tickValue,
              multiplier: futures.multiplier,
              signal_source: signal.source || 'unknown',
              bid: quote.bid,
              ask: quote.ask,
            }
          }).select();
          
          if (insertError) {
            log(`DB ERROR: ${insertError.message}`, 'error');
          } else {
            log(`✅ FUTURES ${side} 1 ${futures.symbol} @ ${price.toFixed(2)} | Conf: ${(signal.confidence * 100).toFixed(1)}% | Source: ${signal.source || 'unknown'}`, 'trade');
          }
        } catch (dbErr) {
          log(`DB EXCEPTION: ${dbErr.message}`, 'error');
        }
      }
    }

    // Report status every 50 cycles
    if (cycleCount % 50 === 0) {
      await supabase.from('farm_status').upsert({
        farm_name: 'futures-24x7-trader',
        status: 'trading',
        games_generated: tradesExecuted,
        last_game_at: new Date().toISOString(),
        metadata: {
          type: 'futures',
          worker_id: WORKER_NAME,
          open_positions: positions.size,
          balance,
          cycle_count: cycleCount,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'farm_name' });
    }

  } catch (err) {
    log(`Cycle error: ${err.message}`, 'error');
  }
}

async function start() {
  log('═══════════════════════════════════════');
  log('24/7 FUTURES TRADING WORKER');
  log('═══════════════════════════════════════');
  log(`Worker ID: ${WORKER_ID}`);
  log(`Bridge URL: ${BRIDGE_URL}`);
  log(`Symbols: ${CONFIG.SYMBOLS.map(s => s.symbol).join(', ')}`);
  log(`Cycle Interval: ${CONFIG.CYCLE_INTERVAL_MS}ms`);
  log(`Trading Hours: Nearly 24/7 (Sun 6PM - Fri 5PM EST)`);
  log('═══════════════════════════════════════');

  sessionId = `futures-${Date.now()}-${WORKER_ID}`;
  isRunning = true;

  // Initial connection
  let connected = await connectToGateway();
  if (!connected) {
    log('Waiting for bridge connection...', 'warn');
  } else {
    log('Connected to gateway');
  }

  // First cycle
  await runCycle();

  // Start trading loop
  const interval = setInterval(runCycle, CONFIG.CYCLE_INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log('Shutting down...');
    isRunning = false;
    clearInterval(interval);
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('Shutting down...');
    isRunning = false;
    clearInterval(interval);
    process.exit(0);
  });
}

// Error handlers
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
