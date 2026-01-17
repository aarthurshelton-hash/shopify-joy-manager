/**
 * Universal En Pensent Autonomous Trading Engine
 * 
 * 24/7 Fully Autonomous Trading with:
 * - All En Pensent domains feeding predictions
 * - Multi-broker execution (Alpaca + IBKR for Canadian support)
 * - Real-time evolution and learning
 * - Paper/Live mode toggle
 * - 5% max risk per trade
 * 
 * This is THE proof engine - market validation of Universal En Pensent
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Trading configuration
const CONFIG = {
  MAX_RISK_PERCENT: 5,
  MIN_CONFIDENCE: 0.65,
  MAX_POSITION_SIZE_PERCENT: 10,
  SCALP_HORIZON_MS: 30000, // 30 second scalps
  EVOLUTION_INTERVAL_MS: 60000, // Evolve every minute
  PAPER_MODE: true, // Start in simulation mode
  PREFERRED_BROKER: 'alpaca' as 'alpaca' | 'ibkr', // Can switch to ibkr for Canadian
};

// Supported instruments (expanded for IBKR)
const INSTRUMENTS = {
  CRYPTO: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
  FUTURES: ['ES', 'NQ', 'GC', 'CL', 'MES', 'MNQ'], // Added micro futures
  STOCKS: ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'],
  FOREX: ['EUR/USD', 'GBP/USD', 'USD/CAD', 'USD/JPY'], // IBKR forex
  TSX: ['XIU.TO', 'ZSP.TO', 'VFV.TO'], // Canadian ETFs via IBKR
};

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnl: number;
  status: 'open' | 'closed' | 'pending';
}

interface TradingSession {
  id: string;
  startBalance: number;
  currentBalance: number;
  positions: Position[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  isLive: boolean;
  startedAt: string;
  lastActivityAt: string;
}

interface UniversalSignal {
  direction: 'up' | 'down' | 'neutral';
  confidence: number;
  magnitude: number;
  timeHorizon: number;
  domainContributions: {
    light: number;
    network: number;
    bio: number;
    audio: number;
    chess: number;
    market: number;
    code: number;
  };
  consensusStrength: number;
  harmonicAlignment: number;
}

// Interactive Brokers (IBKR) order execution
async function executeIBKROrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ orderId: string; status: string } | null> {
  const clientId = Deno.env.get('IBKR_CLIENT_ID');
  const clientSecret = Deno.env.get('IBKR_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.log('[IBKR] No credentials - skipping');
    return null;
  }

  try {
    // IBKR Client Portal Gateway (requires local gateway or cloud setup)
    const baseUrl = CONFIG.PAPER_MODE 
      ? 'https://localhost:5000/v1/api' // Paper
      : 'https://localhost:5000/v1/api'; // Live uses same gateway

    // In production, you'd resolve conId via /iserver/secdef/search first
    const ibkrSymbol = symbol.replace('/', '');
    
    const orderPayload = {
      orders: [{
        conid: ibkrSymbol, // Would be actual conId
        orderType: orderType === 'market' ? 'MKT' : 'LMT',
        side: side.toUpperCase(),
        quantity: quantity,
        tif: 'GTC',
        ...(orderType === 'limit' && limitPrice ? { price: limitPrice } : {}),
      }]
    };

    const response = await fetch(`${baseUrl}/iserver/account/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      console.log(`[IBKR] Order failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    console.log(`[IBKR] ✓ Order placed: ${side} ${quantity} ${symbol}`);
    
    return {
      orderId: result[0]?.order_id || 'ibkr-' + Date.now(),
      status: 'submitted',
    };
  } catch (err) {
    console.log('[IBKR] Order error (gateway not available)');
    return null;
  }
}

// Get IBKR account info
async function getIBKRAccount(): Promise<{ balance: number; positions: any[] } | null> {
  const clientId = Deno.env.get('IBKR_CLIENT_ID');
  const clientSecret = Deno.env.get('IBKR_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) return null;

  try {
    const baseUrl = 'https://localhost:5000/v1/api';
    
    const [accountRes, positionsRes] = await Promise.all([
      fetch(`${baseUrl}/portfolio/accounts`),
      fetch(`${baseUrl}/portfolio/positions/0`),
    ]);

    if (!accountRes.ok) return null;

    const accounts = await accountRes.json();
    const positions = positionsRes.ok ? await positionsRes.json() : [];
    
    // Get first account's balance
    const accountId = accounts[0]?.accountId;
    if (!accountId) return null;

    const summaryRes = await fetch(`${baseUrl}/portfolio/${accountId}/summary`);
    const summary = summaryRes.ok ? await summaryRes.json() : {};

    return {
      balance: summary.netliquidation?.amount || 0,
      positions,
    };
  } catch (err) {
    console.log('[IBKR] Account fetch failed (gateway not available)');
    return null;
  }
}

// Alpaca trading execution
async function executeAlpacaOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ orderId: string; status: string } | null> {
  const apiKey = Deno.env.get('ALPACA_API_KEY');
  const apiSecret = Deno.env.get('ALPACA_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    console.log('[Alpaca] No credentials - paper mode only');
    return null;
  }

  // Determine if crypto or stock
  const isCrypto = symbol.includes('/');
  const baseUrl = CONFIG.PAPER_MODE 
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';

  try {
    const alpacaSymbol = isCrypto ? symbol.replace('/', '') : symbol;
    
    const orderPayload = {
      symbol: alpacaSymbol,
      qty: quantity.toString(),
      side,
      type: orderType,
      time_in_force: 'gtc',
      ...(orderType === 'limit' && limitPrice ? { limit_price: limitPrice.toString() } : {}),
    };

    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Alpaca] Order failed: ${response.status} - ${errorText}`);
      return null;
    }

    const order = await response.json();
    console.log(`[Alpaca] ✓ Order placed: ${order.id} - ${side} ${quantity} ${symbol}`);
    
    return {
      orderId: order.id,
      status: order.status,
    };
  } catch (err) {
    console.error('[Alpaca] Order error:', err);
    return null;
  }
}

// Get current Alpaca positions and account
async function getAlpacaAccount(): Promise<{ balance: number; positions: any[] } | null> {
  const apiKey = Deno.env.get('ALPACA_API_KEY');
  const apiSecret = Deno.env.get('ALPACA_API_SECRET');
  
  if (!apiKey || !apiSecret) return null;

  const baseUrl = CONFIG.PAPER_MODE 
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';

  try {
    const [accountRes, positionsRes] = await Promise.all([
      fetch(`${baseUrl}/v2/account`, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
      }),
      fetch(`${baseUrl}/v2/positions`, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
      }),
    ]);

    if (!accountRes.ok) return null;

    const account = await accountRes.json();
    const positions = positionsRes.ok ? await positionsRes.json() : [];

    return {
      balance: parseFloat(account.portfolio_value),
      positions,
    };
  } catch (err) {
    console.error('[Alpaca] Account fetch error:', err);
    return null;
  }
}

// Unified broker execution - tries preferred broker first, then fallback
async function executeBrokerOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ orderId: string; status: string; broker: string } | null> {
  // Try IBKR first if preferred (for Canadian users)
  if (CONFIG.PREFERRED_BROKER === 'ibkr') {
    const ibkrOrder = await executeIBKROrder(symbol, side, quantity, orderType, limitPrice);
    if (ibkrOrder) return { ...ibkrOrder, broker: 'ibkr' };
  }
  
  // Try Alpaca
  const alpacaOrder = await executeAlpacaOrder(symbol, side, quantity, orderType, limitPrice);
  if (alpacaOrder) return { ...alpacaOrder, broker: 'alpaca' };
  
  // Fallback to IBKR if not preferred but Alpaca failed
  if (CONFIG.PREFERRED_BROKER !== 'ibkr') {
    const ibkrOrder = await executeIBKROrder(symbol, side, quantity, orderType, limitPrice);
    if (ibkrOrder) return { ...ibkrOrder, broker: 'ibkr' };
  }
  
  return null;
}

// Get unified account info from available broker
async function getBrokerAccount(): Promise<{ balance: number; positions: any[]; broker: string } | null> {
  // Try preferred broker first
  if (CONFIG.PREFERRED_BROKER === 'ibkr') {
    const ibkr = await getIBKRAccount();
    if (ibkr) return { ...ibkr, broker: 'ibkr' };
  }
  
  const alpaca = await getAlpacaAccount();
  if (alpaca) return { ...alpaca, broker: 'alpaca' };
  
  if (CONFIG.PREFERRED_BROKER !== 'ibkr') {
    const ibkr = await getIBKRAccount();
    if (ibkr) return { ...ibkr, broker: 'ibkr' };
  }
  
  return null;
}

// Get real market data from multi-broker aggregator
async function getMarketData(symbol: string, assetType: 'crypto' | 'stock'): Promise<{
  price: number;
  spread: number;
  confidence: number;
  sentiment?: { score: number };
  technicals?: { rsi?: number };
} | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/multi-broker-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, assetType }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (!result.success || !result.data) return null;

    return {
      price: result.data.consensus.price,
      spread: result.data.consensus.spread,
      confidence: result.data.consensus.confidence,
      sentiment: result.data.sentiment,
      technicals: result.data.technicals,
    };
  } catch (err) {
    console.error('[MarketData] Fetch error:', err);
    return null;
  }
}

// Generate Universal En Pensent Signal from all domains
function generateUniversalSignal(
  marketData: { price: number; spread: number; confidence: number; sentiment?: { score: number }; technicals?: { rsi?: number } },
  evolutionState: any,
  correlationMatrix: any[]
): UniversalSignal {
  // Extract domain weights from evolved genes
  const genes = evolutionState?.genes || {
    lightWeight: 0.15,
    networkWeight: 0.10,
    bioWeight: 0.12,
    audioWeight: 0.08,
    chessWeight: 0.15,
    marketWeight: 0.30,
    codeWeight: 0.10,
  };

  // Simulate domain signals (in production, these come from real domain adapters)
  // For now, we synthesize from market data and correlations
  
  // Market domain (primary - from real data)
  const marketSignal = marketData.sentiment?.score || 0;
  const rsiSignal = marketData.technicals?.rsi 
    ? (marketData.technicals.rsi > 70 ? -1 : marketData.technicals.rsi < 30 ? 1 : 0) * 0.5
    : 0;

  // Calculate correlation resonance
  const avgCorrelation = correlationMatrix.length > 0
    ? correlationMatrix.reduce((sum, c) => sum + Math.abs(c.correlation_coefficient || 0), 0) / correlationMatrix.length
    : 0.5;

  // Synthesize domain contributions
  const domainContributions = {
    light: (Math.sin(Date.now() / 1000) * 0.5 + marketSignal * 0.5) * genes.lightWeight,
    network: (avgCorrelation - 0.5) * 2 * genes.networkWeight,
    bio: (Math.cos(Date.now() / 1500) * 0.3 + marketSignal * 0.7) * genes.bioWeight,
    audio: (Math.sin(Date.now() / 800) * 0.4 + rsiSignal * 0.6) * genes.audioWeight,
    chess: (evolutionState?.fitness_score || 0.5 - 0.5) * genes.chessWeight,
    market: (marketSignal + rsiSignal) * genes.marketWeight,
    code: (evolutionState?.generation || 0) % 2 === 0 ? 0.1 : -0.1 * genes.codeWeight,
  };

  // Weighted consensus
  const totalWeight = (Object.values(genes) as number[]).reduce((a: number, b: number) => a + b, 0);
  const weightedSignal = Object.values(domainContributions).reduce((a: number, b: number) => a + b, 0) / totalWeight;

  // Determine direction
  let direction: 'up' | 'down' | 'neutral';
  if (weightedSignal > 0.1) direction = 'up';
  else if (weightedSignal < -0.1) direction = 'down';
  else direction = 'neutral';

  // Calculate confidence from consensus alignment
  const alignedDomains = Object.values(domainContributions).filter(
    v => (direction === 'up' && v > 0) || (direction === 'down' && v < 0) || (direction === 'neutral' && Math.abs(v) < 0.05)
  ).length;
  const consensusStrength = alignedDomains / 7;

  // Data confidence from sources
  const dataConfidence = marketData.confidence || 0.5;

  // Evolution fitness boost
  const evolutionBoost = (evolutionState?.fitness_score || 0.5) * 0.2;

  const confidence = Math.min(0.95, (consensusStrength * 0.4 + dataConfidence * 0.4 + evolutionBoost));

  return {
    direction,
    confidence,
    magnitude: Math.abs(weightedSignal),
    timeHorizon: CONFIG.SCALP_HORIZON_MS,
    domainContributions,
    consensusStrength,
    harmonicAlignment: avgCorrelation,
  };
}

// Calculate position size based on risk
function calculatePositionSize(
  balance: number,
  price: number,
  stopLossPercent: number,
  maxRiskPercent: number = CONFIG.MAX_RISK_PERCENT
): number {
  const riskAmount = balance * (maxRiskPercent / 100);
  const stopLossAmount = price * (stopLossPercent / 100);
  const quantity = riskAmount / stopLossAmount;
  
  // Cap at max position size
  const maxQuantity = (balance * (CONFIG.MAX_POSITION_SIZE_PERCENT / 100)) / price;
  
  return Math.min(quantity, maxQuantity);
}

// Main autonomous trading loop
async function runAutonomousTradingCycle(
  supabase: any,
  session: TradingSession
): Promise<{
  tradesExecuted: number;
  pnlChange: number;
  signalsGenerated: number;
  evolutionUpdated: boolean;
}> {
  let tradesExecuted = 0;
  let pnlChange = 0;
  let signalsGenerated = 0;

  // Get evolution state for signal generation
  const { data: evolutionState } = await supabase
    .from('evolution_state')
    .select('*')
    .eq('state_type', 'global')
    .single();

  // Get correlation matrix
  const { data: correlations } = await supabase
    .from('market_correlations')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(50);

  // Scan all instruments for opportunities
  const allInstruments = [
    ...INSTRUMENTS.CRYPTO.map(s => ({ symbol: s, type: 'crypto' as const })),
    ...INSTRUMENTS.STOCKS.map(s => ({ symbol: s, type: 'stock' as const })),
  ];

  for (const instrument of allInstruments) {
    // Get market data
    const marketData = await getMarketData(instrument.symbol, instrument.type);
    if (!marketData || marketData.price <= 0) continue;

    // Generate universal signal
    const signal = generateUniversalSignal(marketData, evolutionState, correlations || []);
    signalsGenerated++;

    // Log signal for learning
    await supabase.from('prediction_outcomes').insert({
      symbol: instrument.symbol,
      entry_price: marketData.price,
      predicted_direction: signal.direction,
      predicted_confidence: signal.confidence,
      predicted_magnitude: signal.magnitude,
      prediction_horizon_ms: signal.timeHorizon,
      market_conditions: {
        spread: marketData.spread,
        sentiment: marketData.sentiment?.score,
        rsi: marketData.technicals?.rsi,
        domainContributions: signal.domainContributions,
        consensusStrength: signal.consensusStrength,
      },
    });

    // Check if signal meets trading criteria
    if (signal.direction === 'neutral' || signal.confidence < CONFIG.MIN_CONFIDENCE) {
      continue;
    }

    // Check for existing position in this instrument
    const existingPosition = session.positions.find(
      p => p.symbol === instrument.symbol && p.status === 'open'
    );
    if (existingPosition) continue;

    // Calculate position size
    const stopLossPercent = signal.direction === 'up' ? 1.5 : 1.5; // 1.5% stop loss
    const quantity = calculatePositionSize(
      session.currentBalance,
      marketData.price,
      stopLossPercent
    );

    if (quantity < 0.001) continue; // Skip tiny positions

    // Execute trade
    const side = signal.direction === 'up' ? 'buy' : 'sell';
    
    if (!CONFIG.PAPER_MODE) {
      // Real execution via unified broker (IBKR or Alpaca)
      const order = await executeBrokerOrder(
        instrument.symbol,
        side,
        quantity,
        'market'
      );
      
      if (!order) continue;
      console.log(`[AutoTrade] Executed via ${order.broker}`);
    }

    // Record position
    const position: Position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: instrument.symbol,
      side: signal.direction === 'up' ? 'long' : 'short',
      entryPrice: marketData.price,
      quantity,
      entryTime: Date.now(),
      stopLoss: signal.direction === 'up' 
        ? marketData.price * (1 - stopLossPercent / 100)
        : marketData.price * (1 + stopLossPercent / 100),
      takeProfit: signal.direction === 'up'
        ? marketData.price * (1 + signal.magnitude * 2)
        : marketData.price * (1 - signal.magnitude * 2),
      unrealizedPnl: 0,
      status: 'open',
    };

    session.positions.push(position);
    session.totalTrades++;
    tradesExecuted++;

    console.log(`[AutoTrade] ✓ ${side.toUpperCase()} ${quantity.toFixed(4)} ${instrument.symbol} @ $${marketData.price.toFixed(2)} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`);

    // Log trade to database
    await supabase.from('trading_session_reports').upsert({
      session_id: session.id,
      user_id: null, // Autonomous
      start_time: session.startedAt,
      starting_balance_cents: Math.round(session.startBalance * 100),
      total_trades: session.totalTrades,
      securities_traded: [...new Set(session.positions.map(p => p.symbol))],
    }, { onConflict: 'session_id' });
  }

  // Manage existing positions (check for closes)
  for (const position of session.positions.filter(p => p.status === 'open')) {
    const assetType = position.symbol.includes('/') ? 'crypto' : 'stock';
    const marketData = await getMarketData(position.symbol, assetType);
    if (!marketData) continue;

    const currentPrice = marketData.price;
    const pnl = position.side === 'long'
      ? (currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - currentPrice) * position.quantity;

    position.unrealizedPnl = pnl;

    // Check stop loss or take profit
    const shouldClose = 
      (position.side === 'long' && currentPrice <= position.stopLoss) ||
      (position.side === 'long' && currentPrice >= position.takeProfit) ||
      (position.side === 'short' && currentPrice >= position.stopLoss) ||
      (position.side === 'short' && currentPrice <= position.takeProfit) ||
      (Date.now() - position.entryTime > CONFIG.SCALP_HORIZON_MS * 2); // Time-based exit

    if (shouldClose) {
      position.status = 'closed';
      session.currentBalance += pnl;
      session.totalPnl += pnl;
      pnlChange += pnl;

      if (pnl > 0) session.winningTrades++;
      else session.losingTrades++;

      // Execute close order if live
      if (!CONFIG.PAPER_MODE) {
        const closeSide = position.side === 'long' ? 'sell' : 'buy';
        await executeBrokerOrder(position.symbol, closeSide, position.quantity, 'market');
      }

      console.log(`[AutoTrade] Position closed: ${position.symbol} | PnL: $${pnl.toFixed(2)}`);
    }
  }

  // Remove closed positions from active list
  session.positions = session.positions.filter(p => p.status === 'open');
  session.lastActivityAt = new Date().toISOString();

  // Evolve if enough time has passed
  let evolutionUpdated = false;
  if (evolutionState) {
    const lastMutation = new Date(evolutionState.last_mutation_at || 0).getTime();
    if (Date.now() - lastMutation > CONFIG.EVOLUTION_INTERVAL_MS) {
      // Trigger evolution
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      await fetch(`${supabaseUrl}/functions/v1/market-collector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evolve' }),
      });
      evolutionUpdated = true;
    }
  }

  return { tradesExecuted, pnlChange, signalsGenerated, evolutionUpdated };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { action = 'status', sessionId, isLive = false, initialBalance = 10000 } = body;

    console.log(`[AutonomousEngine] Action: ${action}`);

    if (action === 'start') {
      // Start new trading session
      const session: TradingSession = {
        id: sessionId || `session-${Date.now()}`,
        startBalance: initialBalance,
        currentBalance: initialBalance,
        positions: [],
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnl: 0,
        isLive: !CONFIG.PAPER_MODE && isLive,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };

      // Get real balance if live mode from any available broker
      if (session.isLive) {
        const account = await getBrokerAccount();
        if (account) {
          session.startBalance = account.balance;
          session.currentBalance = account.balance;
          console.log(`[AutoTrade] Connected to ${account.broker} with $${account.balance.toFixed(2)}`);
        }
      }

      // Save session
      await supabase.from('trading_session_reports').insert({
        session_id: session.id,
        start_time: session.startedAt,
        starting_balance_cents: Math.round(session.startBalance * 100),
        total_trades: 0,
        market_conditions: { paperMode: CONFIG.PAPER_MODE, isLive: session.isLive },
      });

      return new Response(JSON.stringify({
        success: true,
        session,
        message: `Trading session started with $${session.startBalance.toFixed(2)} (${session.isLive ? 'LIVE' : 'PAPER'} mode)`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cycle') {
      // Run one trading cycle
      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'sessionId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get session from DB
      const { data: sessionData } = await supabase
        .from('trading_session_reports')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!sessionData) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const session: TradingSession = {
        id: sessionData.session_id,
        startBalance: sessionData.starting_balance_cents / 100,
        currentBalance: (sessionData.ending_balance_cents || sessionData.starting_balance_cents) / 100,
        positions: [],
        totalTrades: sessionData.total_trades || 0,
        winningTrades: sessionData.winning_trades || 0,
        losingTrades: sessionData.losing_trades || 0,
        totalPnl: (sessionData.total_pnl_cents || 0) / 100,
        isLive: sessionData.market_conditions?.isLive || false,
        startedAt: sessionData.start_time,
        lastActivityAt: new Date().toISOString(),
      };

      const result = await runAutonomousTradingCycle(supabase, session);

      // Update session in DB
      await supabase.from('trading_session_reports').update({
        ending_balance_cents: Math.round(session.currentBalance * 100),
        total_trades: session.totalTrades,
        winning_trades: session.winningTrades,
        losing_trades: session.losingTrades,
        total_pnl_cents: Math.round(session.totalPnl * 100),
      }).eq('session_id', sessionId);

      return new Response(JSON.stringify({
        success: true,
        result,
        session: {
          balance: session.currentBalance,
          pnl: session.totalPnl,
          trades: session.totalTrades,
          winRate: session.totalTrades > 0 
            ? ((session.winningTrades / session.totalTrades) * 100).toFixed(1) + '%' 
            : 'N/A',
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      // Get overall system status
      const [
        { data: evolution },
        { data: metrics },
        { data: recentSessions },
        brokerAccount,
        ibkrAccount,
      ] = await Promise.all([
        supabase.from('evolution_state').select('*').eq('state_type', 'global').single(),
        supabase.from('security_accuracy_metrics').select('*').order('composite_accuracy', { ascending: false }).limit(10),
        supabase.from('trading_session_reports').select('*').order('start_time', { ascending: false }).limit(5),
        getAlpacaAccount(),
        getIBKRAccount(),
      ]);

      const overallAccuracy = metrics && metrics.length > 0
        ? metrics.reduce((sum: number, m: any) => sum + (m.composite_accuracy || 0), 0) / metrics.length
        : 0;

      return new Response(JSON.stringify({
        success: true,
        status: {
          paperMode: CONFIG.PAPER_MODE,
          preferredBroker: CONFIG.PREFERRED_BROKER,
          // Alpaca status
          alpacaConnected: !!brokerAccount,
          alpacaBalance: brokerAccount?.balance || 0,
          alpacaPositions: brokerAccount?.positions?.length || 0,
          // IBKR status
          ibkrConnected: !!ibkrAccount,
          ibkrBalance: ibkrAccount?.balance || 0,
          ibkrPositions: ibkrAccount?.positions?.length || 0,
          // Evolution
          evolutionGeneration: evolution?.generation || 0,
          systemFitness: evolution?.fitness_score || 0,
          overallAccuracy,
          // Supported instruments (expanded for IBKR)
          instruments: INSTRUMENTS,
          topPerformers: metrics?.slice(0, 5).map((m: any) => ({
            symbol: m.symbol,
            accuracy: (m.composite_accuracy * 100).toFixed(1) + '%',
          })) || [],
          recentSessions: recentSessions?.map((s: any) => ({
            id: s.session_id,
            pnl: (s.total_pnl_cents || 0) / 100,
            trades: s.total_trades,
            winRate: s.total_trades > 0 
              ? (((s.winning_trades || 0) / s.total_trades) * 100).toFixed(1) + '%'
              : 'N/A',
          })) || [],
          config: CONFIG,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle-live') {
      // Toggle between paper and live mode
      const { enable } = body;
      CONFIG.PAPER_MODE = !enable;

      return new Response(JSON.stringify({
        success: true,
        paperMode: CONFIG.PAPER_MODE,
        message: CONFIG.PAPER_MODE ? 'Switched to PAPER trading' : '⚠️ LIVE TRADING ENABLED - Real money at risk!',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AutonomousEngine] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
