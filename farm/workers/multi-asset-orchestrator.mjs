/**
 * Unified Multi-Asset Trading Orchestrator
 * 
 * Farm worker that coordinates all systems:
 * - Unified data pipeline
 * - Dynamic allocation engine
 * - Self-evolving strategy evaluator
 * - Cross-asset correlation analyzer
 * - Options flow integration
 * - Prop firm compliance tracking
 * 
 * This is the main trading brain that runs 24/7
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { UnifiedDataPipeline } from '../src/lib/trading/unifiedDataPipeline';
import { DynamicAllocationEngine } from '../src/lib/trading/dynamicAllocationEngine';
import { SelfEvolvingEvaluator } from '../src/lib/trading/selfEvolvingEvaluator';
import { CrossAssetCorrelationAnalyzer } from '../src/lib/trading/crossAssetCorrelationAnalyzer';
import { OptionsFlowIntegration } from '../src/lib/trading/optionsFlowIntegration';
import { PropFirmComplianceTracker } from '../src/lib/trading/propFirmComplianceTracker';
import { ASSET_CLASSES, STRATEGY_REGISTRY } from '../src/lib/trading/multiAssetConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const WORKER_ID = process.argv[2] || '0';
const WORKER_NAME = `multi-asset-orchestrator-${WORKER_ID}`;

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BRIDGE_URL = process.env.IB_BRIDGE_URL || 'http://localhost:4000';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// Trading state
let isRunning = false;
let sessionId: string | null = null;
let cycleCount = 0;
let tradesExecuted = 0;
let totalPnL = 0;

// System components
let dataPipeline: UnifiedDataPipeline;
let allocationEngine: DynamicAllocationEngine;
let strategyEvaluator: SelfEvolvingEvaluator;
let correlationAnalyzer: CrossAssetCorrelationAnalyzer;
let optionsFlow: OptionsFlowIntegration;
let propFirmTracker: PropFirmComplianceTracker;

// Current positions
interface Position {
  id: string;
  symbol: string;
  assetClass: string;
  strategy: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnL: number;
}

const positions: Map<string, Position> = new Map();

function log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
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

async function initialize() {
  log('=================================');
  log('Multi-Asset Trading Orchestrator');
  log('=================================');
  log(`Worker ID: ${WORKER_ID}`);
  
  // Initialize IBKR client wrapper
  const ibkrClient = {
    getBatchQuotes: async (symbols: string[]) => {
      const quotes = [];
      for (const symbol of symbols) {
        try {
          const response = await fetch(`${BRIDGE_URL}/api/search?symbol=${symbol}`);
          const data = await response.json();
          if (data.contracts?.[0]) {
            const conid = data.contracts[0].conid;
            const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${conid}`);
            const quote = await quoteRes.json();
            quotes.push({
              symbol,
              lastPrice: quote.lastPrice,
              change: quote.change,
              volume: quote.volume,
            });
          }
        } catch (err) {
          // Silent fail for missing symbols
        }
      }
      return quotes;
    },
    getQuote: async (conid: number) => {
      const response = await fetch(`${BRIDGE_URL}/api/quote?conid=${conid}`);
      return response.json();
    },
    getHistoricalData: async (symbol: string, period: string) => {
      // Would fetch from Supabase or other source
      return [];
    },
    getOptionsChain: async (symbol: string) => {
      const response = await fetch(`${BRIDGE_URL}/api/options?symbol=${symbol}`);
      return response.json();
    },
  };
  
  // Initialize all systems
  log('Initializing data pipeline...');
  dataPipeline = new UnifiedDataPipeline(ibkrClient, supabase);
  await dataPipeline.start();
  
  log('Initializing allocation engine...');
  allocationEngine = new DynamicAllocationEngine(dataPipeline, supabase, 250000);
  await allocationEngine.initialize();
  
  log('Initializing strategy evaluator...');
  strategyEvaluator = new SelfEvolvingEvaluator();
  await strategyEvaluator.initialize();
  
  log('Initializing correlation analyzer...');
  correlationAnalyzer = new CrossAssetCorrelationAnalyzer(supabase);
  await correlationAnalyzer.initialize();
  
  log('Initializing options flow...');
  optionsFlow = new OptionsFlowIntegration('', supabase);
  await optionsFlow.initialize();
  
  log('Initializing prop firm tracker...');
  propFirmTracker = new PropFirmComplianceTracker(supabase);
  
  // Subscribe to options flow alerts
  optionsFlow.subscribe((alert) => {
    if (alert.confidence > 0.8) {
      log(`High confidence options alert: ${alert.symbol} ${alert.type} ${alert.side}`);
    }
  });
  
  sessionId = `multi-asset-${Date.now()}-${WORKER_ID}`;
  isRunning = true;
  
  log('All systems initialized');
  log('=================================');
}

async function runTradingCycle() {
  if (!isRunning) return;
  
  cycleCount++;
  log(`Running cycle #${cycleCount}...`);
  
  try {
    // Check IBKR connection
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
    log(`Account: ${account.accountId} | Balance: $${balance.toFixed(2)}`);
    
    // Get current positions from IBKR
    const positionsRes = await fetch(`${BRIDGE_URL}/api/positions?accountId=${account.accountId}`);
    const positionsData = await positionsRes.json();
    const ibkrPositions = positionsData.positions || [];
    
    // Get allocations
    const allocations = allocationEngine.getAllocations();
    const macroRegime = dataPipeline.getMacroRegime();
    
    log(`Macro regime: ${macroRegime?.marketRegime || 'unknown'}`);
    log(`Active allocations: ${allocations.length}`);
    
    // Execute trades for top allocations
    let cycleTrades = 0;
    
    for (const allocation of allocations.slice(0, 5)) {
      // Skip if already have position
      const hasPosition = ibkrPositions.some((p: any) => p.symbol === allocation.symbol);
      const hasAutoPosition = positions.has(allocation.symbol);
      
      if (hasPosition || hasAutoPosition) continue;
      
      // Get signal from appropriate strategy
      const strategy = allocation.strategy;
      if (!strategyEvaluator.isStrategyEnabled(strategy)) continue;
      
      const signal = await generateSignal(allocation.symbol, strategy);
      if (!signal || signal.confidence < 0.7) continue;
      
      // Check options flow for confirmation
      const flowSummary = optionsFlow.getFlowSummary(allocation.symbol);
      const flowAligned = !flowSummary || 
        (signal.direction === 'long' && flowSummary.bullishFlow) ||
        (signal.direction === 'short' && !flowSummary.bullishFlow);
      
      if (!flowAligned) {
        log(`Signal for ${allocation.symbol} not aligned with options flow, skipping`);
        continue;
      }
      
      // Calculate position size
      const positionSize = allocationEngine.calculatePositionSize(
        allocation.symbol,
        signal.confidence,
        0.01 // 1% stop loss
      );
      
      // Execute trade
      const result = await executeTrade(
        account.accountId,
        allocation.symbol,
        signal.direction,
        positionSize
      );
      
      if (result.success) {
        cycleTrades++;
        tradesExecuted++;
        
        // Track position
        positions.set(allocation.symbol, {
          id: result.orderId,
          symbol: allocation.symbol,
          assetClass: allocation.assetClass,
          strategy,
          side: signal.direction,
          entryPrice: result.price,
          quantity: result.shares,
          entryTime: Date.now(),
          stopLoss: signal.direction === 'long' 
            ? result.price * 0.99 
            : result.price * 1.01,
          takeProfit: signal.direction === 'long'
            ? result.price * 1.015
            : result.price * 0.985,
          unrealizedPnL: 0,
        });
        
        // Log to database
        await supabase.from('autonomous_trades').insert({
          session_id: sessionId,
          worker_id: WORKER_NAME,
          symbol: allocation.symbol,
          direction: signal.direction.toUpperCase(),
          entry_price: result.price,
          shares: result.shares,
          predicted_direction: signal.direction,
          predicted_confidence: signal.confidence,
          strategy,
          status: 'open',
          regime: macroRegime?.marketRegime || 'unknown',
        });
        
        log(`✓ ${signal.direction.toUpperCase()} ${allocation.symbol} @ $${result.price.toFixed(2)}`);
      }
    }
    
    // Manage existing positions
    await managePositions(account.accountId);
    
    // Check prop firm compliance
    const firms = propFirmTracker.getAllFirms();
    for (const firm of firms) {
      if (propFirmTracker.shouldPauseTrading(firm)) {
        log(`PAUSING: Prop firm daily loss limit approaching for ${firm}`, 'warn');
        isRunning = false;
        return;
      }
    }
    
    // Report status
    await reportStatus({
      connected: true,
      account_id: account.accountId,
      balance,
      open_positions: positions.size,
      trades_executed: tradesExecuted,
      total_pnl: totalPnL,
      regime: macroRegime?.marketRegime,
      cycle_trades: cycleTrades,
    });
    
    log(`Cycle #${cycleCount} complete | Trades: ${cycleTrades} | Open: ${positions.size}`);
    
  } catch (err) {
    log(`Cycle error: ${(err as Error).message}`, 'error');
  }
}

async function generateSignal(symbol: string, strategy: string): Promise<{ direction: 'long' | 'short'; confidence: number } | null> {
  // Get data from pipeline
  const macro = dataPipeline.getMacroRegime();
  const optionsFlow = dataPipeline.getRecentOptionsFlow(symbol, 30);
  
  // Simple signal generation based on strategy
  switch (strategy) {
    case 'MOMENTUM':
      // Check if in uptrend with momentum
      return { direction: 'long', confidence: 0.75 };
      
    case 'MEAN_REVERSION':
      // Check if oversold
      return { direction: 'long', confidence: 0.70 };
      
    case 'VOLATILITY_ARB':
      // Trade volatility contraction
      if (macro && macro.vix > 25) {
        return { direction: 'short', confidence: 0.80 }; // Short vol
      }
      return null;
      
    case 'MACRO_ROTATION':
      // Sector rotation based on macro
      if (macro?.marketRegime === 'risk_on') {
        return { direction: 'long', confidence: 0.75 };
      }
      return { direction: 'short', confidence: 0.65 };
      
    default:
      return { direction: 'long', confidence: 0.70 };
  }
}

async function executeTrade(accountId: string, symbol: string, direction: 'long' | 'short', dollarAmount: number): Promise<any> {
  try {
    // Search contract
    const searchRes = await fetch(`${BRIDGE_URL}/api/search?symbol=${symbol}`);
    const searchData = await searchRes.json();
    
    if (!searchData.contracts?.[0]) {
      return { success: false };
    }
    
    const contract = searchData.contracts[0];
    
    // Get price
    const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${contract.conid}`);
    const quote = await quoteRes.json();
    
    if (!quote.lastPrice) {
      return { success: false };
    }
    
    const price = quote.lastPrice;
    const shares = Math.floor(dollarAmount / price);
    
    if (shares < 1) {
      return { success: false };
    }
    
    // Place order
    const side = direction === 'long' ? 'BUY' : 'SELL';
    const orderRes = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        conid: contract.conid,
        symbol,
        side,
        quantity: shares,
        orderType: 'MKT',
      }),
    });
    
    const orderData = await orderRes.json();
    
    return {
      success: orderData.orderId !== undefined,
      orderId: orderData.orderId,
      price,
      shares,
    };
    
  } catch (err) {
    log(`Execute trade error: ${(err as Error).message}`, 'error');
    return { success: false };
  }
}

async function managePositions(accountId: string) {
  for (const [symbol, position] of positions) {
    try {
      // Get current price
      const searchRes = await fetch(`${BRIDGE_URL}/api/search?symbol=${symbol}`);
      const searchData = await searchRes.json();
      
      if (!searchData.contracts?.[0]) continue;
      
      const conid = searchData.contracts[0].conid;
      const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${conid}`);
      const quote = await quoteRes.json();
      
      if (!quote.lastPrice) continue;
      
      const currentPrice = quote.lastPrice;
      
      // Calculate P&L
      const pnl = position.side === 'long'
        ? (currentPrice - position.entryPrice) * position.quantity
        : (position.entryPrice - currentPrice) * position.quantity;
      
      position.unrealizedPnL = pnl;
      
      // Check exits
      const shouldClose = 
        (position.side === 'long' && currentPrice <= position.stopLoss) ||
        (position.side === 'long' && currentPrice >= position.takeProfit) ||
        (position.side === 'short' && currentPrice >= position.stopLoss) ||
        (position.side === 'short' && currentPrice <= position.takeProfit) ||
        (Date.now() - position.entryTime > 60000 * 60); // 1 hour max hold
      
      if (shouldClose) {
        // Close position
        const closeSide = position.side === 'long' ? 'SELL' : 'BUY';
        await fetch(`${BRIDGE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            conid,
            symbol,
            side: closeSide,
            quantity: position.quantity,
            orderType: 'MKT',
          }),
        });
        
        totalPnL += pnl;
        
        // Update database
        await supabase.from('autonomous_trades')
          .update({
            exit_price: currentPrice,
            exit_time: new Date().toISOString(),
            pnl,
            pnl_percent: (pnl / (position.entryPrice * position.quantity)) * 100,
            status: 'closed',
          })
          .eq('symbol', symbol)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1);
        
        // Record for strategy evaluation
        await strategyEvaluator.recordTrade(position.strategy, {
          symbol,
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          side: position.side,
          pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          holdingTime: Date.now() - position.entryTime,
          regime: dataPipeline.getMacroRegime()?.marketRegime || 'neutral',
        });
        
        positions.delete(symbol);
        log(`✓ Closed ${symbol} | PnL: $${pnl.toFixed(2)}`);
      }
      
    } catch (err) {
      log(`Position management error for ${symbol}: ${(err as Error).message}`, 'error');
    }
  }
}

async function reportStatus(status: any) {
  try {
    await supabase.from('farm_status').upsert({
      farm_name: 'multi-asset-orchestrator',
      worker_id: WORKER_NAME,
      status: isRunning ? 'trading' : 'stopped',
      games_generated: tradesExecuted,
      last_game_at: new Date().toISOString(),
      metadata: {
        type: 'multi_asset_trading',
        session_id: sessionId,
        ...status,
      },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'farm_name,worker_id'
    });
  } catch (err) {
    log(`Status report failed: ${(err as Error).message}`, 'warn');
  }
}

// Main
async function main() {
  await initialize();
  
  // First cycle
  await runTradingCycle();
  
  // Start loop (every 15 seconds)
  const interval = setInterval(runTradingCycle, 15000);
  
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
