#!/usr/bin/env node
/**
 * Alpaca Paper Trading Worker - Chess Battle Mode
 * 
 * Maps trading signals to chess white (BUY/long) vs black (SELL/short) battles.
 * Tracks temporal victories to see which side dominates through different market conditions.
 * 
 * White = Long positions (buy signals)
 * Black = Short positions (sell signals)
 * Victory = Positive P&L at position close
 * 
 * Trading Hours: Extended (7:00 AM - 8:00 PM ET) via Alpaca API
 * 
 * @version 1.0-CHESS-BATTLE-ALPACA
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// Alpaca Configuration
const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets'; // Paper trading
const ALPACA_DATA_URL = 'https://data.alpaca.markets';

// Trading Configuration - CHESS BATTLE MODE
const CONFIG = {
  CYCLE_INTERVAL_MS: 20000,        // Trade every 20 seconds
  MIN_CONFIDENCE: 0.40,            // Lower threshold for volume
  POSITION_SIZE_PERCENT: 2,        // 2% of balance per trade
  MAX_RISK_PERCENT: 0.5,          // 0.5% risk per trade
  STOP_LOSS_PERCENT: 1.5,          // 1.5% stop
  TAKE_PROFIT_PERCENT: 2.0,       // 2% profit target
  MAX_HOLD_MS: 300000,            // 5 minute max hold
  MAX_POSITIONS: 10,              // Max concurrent positions
  MIN_POSITION_SIZE: 1000,        // Minimum $1000 trade
  MAX_POSITION_SIZE: 10000,       // Maximum $10000 trade
  
  // Extended hours enabled (7AM - 8PM ET for Alpaca)
  EXTENDED_HOURS: true,
  
  // Chess Battle Symbols
  SYMBOLS: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN', 'IWM'],
};

// Connection
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aufycarwflhsdgszbnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// State
const WORKER_ID = `alpaca-chess-${Date.now()}`;
const WORKER_NAME = 'alpaca-chess-battle-trader';
let sessionId = null;
let isRunning = false;
let positions = new Map();
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;

// Chess Battle Statistics
const CHESS_STATS = {
  white: { wins: 0, losses: 0, totalPnL: 0, trades: 0, bestMove: null, worstMove: null },
  black: { wins: 0, losses: 0, totalPnL: 0, trades: 0, bestMove: null, worstMove: null },
  temporalWins: [], // Array of { timestamp, side, pnl, symbol, duration }
  currentStreak: { side: null, count: 0 },
  battleHistory: [], // For visualization
};

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
  } else if (level === 'chess') {
    fullMessage = `${prefix} ♟️  ${message}`;
    console.log(fullMessage);
  } else {
    fullMessage = `${prefix} ℹ️  ${message}`;
    console.log(fullMessage);
  }
}

// Alpaca API helper
async function alpacaRequest(endpoint, options = {}) {
  try {
    const url = `${ALPACA_BASE_URL}/v2${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Alpaca error: ${response.status} - ${text}`);
    }
    
    return await response.json();
  } catch (err) {
    log(`Alpaca request failed: ${err.message}`, 'error');
    return null;
  }
}

// Get real-time quote from Alpaca
async function getAlpacaQuote(symbol) {
  try {
    const data = await alpacaRequest(`/quotes/${symbol}`);
    if (!data || !data.quote) return null;
    
    return {
      lastPrice: (data.quote.ap + data.quote.bp) / 2, // Mid price
      bid: data.quote.bp,
      ask: data.quote.ap,
      timestamp: data.quote.t,
    };
  } catch (err) {
    return null;
  }
}

// Fallback to Yahoo Finance
async function getYahooPrice(symbol) {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
    const data = await response.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price) {
      return { lastPrice: price, bid: price * 0.9995, ask: price * 1.0005, source: 'yahoo' };
    }
  } catch (err) {
    // Silent fail
  }
  return null;
}

// Get quote with fallback
async function getQuote(symbol) {
  // Try Alpaca first
  const alpacaQuote = await getAlpacaQuote(symbol);
  if (alpacaQuote) return { ...alpacaQuote, source: 'alpaca' };
  
  // Fallback to Yahoo
  const yahooQuote = await getYahooPrice(symbol);
  if (yahooQuote) return yahooQuote;
  
  return null;
}

// Get account info
async function getAlpacaAccount() {
  return await alpacaRequest('/account');
}

// Get positions
async function getAlpacaPositions() {
  return await alpacaRequest('/positions');
}

// Place order with extended hours
async function placeAlpacaOrder(order) {
  try {
    const orderData = {
      symbol: order.symbol,
      qty: order.quantity,
      side: order.side,
      type: order.orderType || 'market',
      time_in_force: 'day',
      extended_hours: CONFIG.EXTENDED_HOURS, // KEY: Enable after-hours
    };
    
    if (order.orderType === 'limit') {
      orderData.limit_price = order.price;
    }
    
    const result = await alpacaRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    
    return result;
  } catch (err) {
    log(`Order failed: ${err.message}`, 'error');
    return null;
  }
}

// Get chess battle signal (white=long, black=short)
async function getChessSignal(symbol) {
  try {
    const quote = await getQuote(symbol);
    if (!quote) return { side: null, confidence: 0 };
    
    // Check prediction outcomes for chess battle
    const { data: recent } = await supabase
      .from('prediction_outcomes')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recent && recent.length >= 3) {
      const upCount = recent.filter(r => r.predicted_direction === 'up').length;
      const avgConfidence = recent.reduce((sum, r) => sum + (r.predicted_confidence || 0), 0) / recent.length;
      
      // WHITE WINS: More up predictions = BUY
      if (upCount >= 3) {
        return { 
          side: 'white', // WHITE = BUY/LONG
          confidence: Math.min(0.85, 0.4 + avgConfidence),
          source: 'enpensent_white_majority'
        };
      }
      // BLACK WINS: More down predictions = SELL
      if (upCount <= 1) {
        return { 
          side: 'black', // BLACK = SELL/SHORT
          confidence: Math.min(0.85, 0.4 + avgConfidence),
          source: 'enpensent_black_majority'
        };
      }
    }
    
    // Market momentum as tiebreaker
    const spread = (quote.ask - quote.bid) / quote.lastPrice;
    if (spread > 0.0003) {
      const side = quote.bid > quote.lastPrice * 0.999 ? 'white' : 'black';
      return { side, confidence: 0.42, source: 'market_momentum' };
    }
    
    return { side: null, confidence: 0 };
  } catch (err) {
    return { side: null, confidence: 0 };
  }
}

// Check trading hours (Alpaca extended: 7AM - 8PM ET)
function isTradingHours() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();
  const totalMinutes = hours * 60 + minutes;
  
  // No trading on weekends
  if (day === 0 || day === 6) return { allowed: false, reason: 'weekend' };
  
  // Alpaca extended hours: 7:00 AM - 8:00 PM ET
  const marketOpen = 7 * 60;    // 7:00 AM
  const marketClose = 20 * 60;  // 8:00 PM
  
  if (totalMinutes < marketOpen || totalMinutes >= marketClose) {
    return { allowed: false, reason: 'outside_extended_hours' };
  }
  
  const isExtended = totalMinutes < 9 * 60 + 30 || totalMinutes >= 16 * 60;
  return { allowed: true, isExtended };
}

// Update chess battle stats
function updateChessStats(side, pnl, symbol, durationMs) {
  const stats = side === 'white' ? CHESS_STATS.white : CHESS_STATS.black;
  
  stats.trades++;
  stats.totalPnL += pnl;
  
  if (pnl > 0) {
    stats.wins++;
    // Track best move
    if (!stats.bestMove || pnl > stats.bestMove.pnl) {
      stats.bestMove = { symbol, pnl, duration: durationMs };
    }
  } else {
    stats.losses++;
    // Track worst move
    if (!stats.worstMove || pnl < stats.worstMove.pnl) {
      stats.worstMove = { symbol, pnl, duration: durationMs };
    }
  }
  
  // Record temporal win
  CHESS_STATS.temporalWins.push({
    timestamp: new Date().toISOString(),
    side,
    pnl,
    symbol,
    duration: durationMs,
  });
  
  // Update streak
  if (pnl > 0) {
    if (CHESS_STATS.currentStreak.side === side) {
      CHESS_STATS.currentStreak.count++;
    } else {
      CHESS_STATS.currentStreak = { side, count: 1 };
    }
  } else {
    CHESS_STATS.currentStreak = { side: null, count: 0 };
  }
  
  // Keep only last 100 temporal wins for analysis
  if (CHESS_STATS.temporalWins.length > 100) {
    CHESS_STATS.temporalWins.shift();
  }
}

// Log chess battle status
function logChessBattle() {
  const whiteWinRate = CHESS_STATS.white.trades > 0 ? (CHESS_STATS.white.wins / CHESS_STATS.white.trades * 100).toFixed(1) : 0;
  const blackWinRate = CHESS_STATS.black.trades > 0 ? (CHESS_STATS.black.wins / CHESS_STATS.black.trades * 100).toFixed(1) : 0;
  const currentLeader = CHESS_STATS.white.totalPnL > CHESS_STATS.black.totalPnL ? 'WHITE' : 'BLACK';
  
  log(`⚔️  CHESS BATTLE UPDATE ⚔️`, 'chess');
  log(`♙ WHITE (Long): ${CHESS_STATS.white.wins}W/${CHESS_STATS.white.losses}L | PnL: $${CHESS_STATS.white.totalPnL.toFixed(2)} | WR: ${whiteWinRate}%`, 'chess');
  log(`♟️ BLACK (Short): ${CHESS_STATS.black.wins}W/${CHESS_STATS.black.losses}L | PnL: $${CHESS_STATS.black.totalPnL.toFixed(2)} | WR: ${blackWinRate}%`, 'chess');
  log(`🏆 Current Leader: ${currentLeader} | Streak: ${CHESS_STATS.currentStreak.side?.toUpperCase() || 'NONE'} x${CHESS_STATS.currentStreak.count}`, 'chess');
}

// Run trading cycle
async function runCycle() {
  if (!isRunning) return;
  
  cycleCount++;
  
  // Check trading hours
  const hoursCheck = isTradingHours();
  if (!hoursCheck.allowed) {
    if (cycleCount % 50 === 0) {
      log(`Trading paused: ${hoursCheck.reason}`, 'info');
    }
    return;
  }
  
  try {
    // Get account
    const account = await getAlpacaAccount();
    if (!account) {
      log('No Alpaca account', 'warn');
      return;
    }
    
    const balance = parseFloat(account.buying_power);
    
    // Get current positions
    const alpacaPositions = await getAlpacaPositions() || [];
    const openSymbols = new Set(alpacaPositions.map(p => p.symbol));
    
    // Manage open positions first
    for (const [symbol, pos] of positions) {
      const quote = await getQuote(symbol);
      if (!quote || !quote.lastPrice) continue;
      
      const currentPrice = quote.lastPrice;
      const pnl = pos.side === 'white'
        ? (currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - currentPrice) * pos.quantity;
      
      const pnlPercent = (pnl / (pos.entryPrice * pos.quantity)) * 100;
      const holdTime = Date.now() - pos.entryTime;
      
      // Exit conditions
      const shouldClose = 
        (pos.side === 'white' && currentPrice <= pos.stopLoss) ||
        (pos.side === 'white' && currentPrice >= pos.takeProfit) ||
        (pos.side === 'black' && currentPrice >= pos.stopLoss) ||
        (pos.side === 'black' && currentPrice <= pos.takeProfit) ||
        (holdTime > CONFIG.MAX_HOLD_MS) ||
        (pnlPercent >= CONFIG.TAKE_PROFIT_PERCENT) ||
        (pnlPercent <= -CONFIG.STOP_LOSS_PERCENT);
      
      if (shouldClose) {
        const closeSide = pos.side === 'white' ? 'sell' : 'buy';
        const closeResult = await placeAlpacaOrder({
          symbol: pos.symbol,
          side: closeSide,
          quantity: pos.quantity,
          orderType: 'market',
        });
        
        if (closeResult) {
          totalPnL += pnl;
          positions.delete(symbol);
          
          // Update chess battle stats
          updateChessStats(pos.side, pnl, symbol, holdTime);
          
          // Update database
          await supabase.from('autonomous_trades').update({
            exit_price: currentPrice,
            exit_time: new Date().toISOString(),
            pnl,
            pnl_percent: pnlPercent,
            status: 'closed',
            close_reason: holdTime > CONFIG.MAX_HOLD_MS ? 'timeout' : 'signal',
            metadata: { chess_side: pos.side }
          }).eq('symbol', symbol).eq('status', 'open');
          
          const sideEmoji = pos.side === 'white' ? '♙' : '♟️';
          log(`${sideEmoji} ${pos.side.toUpperCase()} CLOSED ${symbol} | PnL: $${pnl.toFixed(2)} | Duration: ${(holdTime/1000).toFixed(0)}s`, 'chess');
          
          // Log battle status every 5 trades
          if ((CHESS_STATS.white.trades + CHESS_STATS.black.trades) % 5 === 0) {
            logChessBattle();
          }
        }
      }
    }
    
    // Open new positions if under limit
    if (positions.size >= CONFIG.MAX_POSITIONS) return;
    
    // Shuffle symbols
    const shuffledSymbols = [...CONFIG.SYMBOLS].sort(() => Math.random() - 0.5);
    
    for (const symbol of shuffledSymbols) {
      if (positions.size >= CONFIG.MAX_POSITIONS) break;
      if (openSymbols.has(symbol)) continue;
      
      // Get chess battle signal
      const signal = await getChessSignal(symbol);
      
      if (signal.confidence < CONFIG.MIN_CONFIDENCE || !signal.side) {
        continue;
      }
      
      const quote = await getQuote(symbol);
      if (!quote || !quote.lastPrice) continue;
      
      const price = quote.lastPrice;
      
      // Calculate position size
      const riskAmount = balance * (CONFIG.MAX_RISK_PERCENT / 100);
      const stopLossAmount = price * (CONFIG.STOP_LOSS_PERCENT / 100);
      const maxShares = Math.floor(riskAmount / stopLossAmount);
      const positionShares = Math.min(
        maxShares,
        Math.floor((balance * CONFIG.POSITION_SIZE_PERCENT / 100) / price)
      );
      
      const positionValue = positionShares * price;
      if (positionValue < CONFIG.MIN_POSITION_SIZE || positionValue > CONFIG.MAX_POSITION_SIZE) continue;
      if (positionShares < 1) continue;
      
      // Place order
      const side = signal.side === 'white' ? 'buy' : 'sell';
      const result = await placeAlpacaOrder({
        symbol,
        side,
        quantity: positionShares,
        orderType: 'market',
      });
      
      if (result && result.id) {
        tradesExecuted++;
        
        // Track position
        positions.set(symbol, {
          id: result.id,
          symbol,
          side: signal.side,
          entryPrice: price,
          quantity: positionShares,
          entryTime: Date.now(),
          stopLoss: signal.side === 'white' 
            ? price * (1 - CONFIG.STOP_LOSS_PERCENT / 100)
            : price * (1 + CONFIG.STOP_LOSS_PERCENT / 100),
          takeProfit: signal.side === 'white'
            ? price * (1 + CONFIG.TAKE_PROFIT_PERCENT / 100)
            : price * (1 - CONFIG.TAKE_PROFIT_PERCENT / 100),
        });
        
        // Log to database
        try {
          const { data: insertData, error: insertError } = await supabase.from('autonomous_trades').insert({
            session_id: sessionId,
            worker_id: WORKER_NAME,
            symbol,
            direction: signal.side,
            entry_price: price,
            shares: positionShares,
            predicted_direction: signal.side === 'white' ? 'up' : 'down',
            predicted_confidence: signal.confidence,
            status: 'open',
            metadata: {
              chess_battle: true,
              chess_side: signal.side,
              signal_source: signal.source,
              alpaca_order_id: result.id,
              extended_hours: hoursCheck.isExtended,
            }
          }).select();
          
          if (insertError) {
            log(`DB ERROR: ${insertError.message}`, 'error');
          } else {
            const sideEmoji = signal.side === 'white' ? '♙' : '♟️';
            log(`${sideEmoji} ${signal.side.toUpperCase()} OPENED ${side.toUpperCase()} ${positionShares} ${symbol} @ $${price.toFixed(2)} | Conf: ${(signal.confidence * 100).toFixed(1)}% | Source: ${signal.source}`, 'chess');
          }
        } catch (dbErr) {
          log(`DB EXCEPTION: ${dbErr.message}`, 'error');
        }
      }
    }
    
    // Report status every 50 cycles
    if (cycleCount % 50 === 0) {
      await supabase.from('farm_status').upsert({
        farm_name: 'alpaca-chess-battle-trader',
        status: 'trading',
        games_generated: tradesExecuted,
        last_game_at: new Date().toISOString(),
        metadata: {
          type: 'alpaca_chess_battle',
          worker_id: WORKER_NAME,
          open_positions: positions.size,
          balance,
          white_stats: CHESS_STATS.white,
          black_stats: CHESS_STATS.black,
          current_leader: CHESS_STATS.white.totalPnL > CHESS_STATS.black.totalPnL ? 'white' : 'black',
          current_streak: CHESS_STATS.currentStreak,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'farm_name' });
    }
    
  } catch (err) {
    log(`Cycle error: ${err.message}`, 'error');
  }
}

async function start() {
  // Validate Alpaca credentials
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    log('ERROR: ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in .env', 'error');
    process.exit(1);
  }
  
  log('═══════════════════════════════════════════════════');
  log('♟️  ALPACA PAPER TRADING - CHESS BATTLE MODE ♟️');
  log('═══════════════════════════════════════════════════');
  log(`Worker ID: ${WORKER_ID}`);
  log(`Account: Paper Trading (Extended Hours: ${CONFIG.EXTENDED_HOURS ? 'ENABLED' : 'DISABLED'})`);
  log(`Trading Hours: 7:00 AM - 8:00 PM ET`);
  log(`Symbols: ${CONFIG.SYMBOLS.join(', ')}`);
  log(`Cycle Interval: ${CONFIG.CYCLE_INTERVAL_MS}ms`);
  log('═══════════════════════════════════════════════════');
  log('♙ WHITE = LONG (BUY) - The Attackers');
  log('♟️ BLACK = SHORT (SELL) - The Defenders');
  log('⚔️  Battle for market supremacy begins...');
  log('═══════════════════════════════════════════════════');
  
  sessionId = `chess-${Date.now()}-${WORKER_ID}`;
  isRunning = true;
  
  // Verify Alpaca connection
  const account = await getAlpacaAccount();
  if (account) {
    log(`✅ Connected to Alpaca Paper | Balance: $${parseFloat(account.buying_power).toLocaleString()}`, 'info');
  } else {
    log('❌ Failed to connect to Alpaca', 'error');
    process.exit(1);
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
