/**
 * Simulated Paper Trading
 * 
 * Provides a local simulation for paper trading when IBKR Gateway
 * is not available. Useful for testing and development.
 */

export interface SimulatedAccount {
  accountId: string;
  accountType: string;
  balance: number;
  buyingPower: number;
}

export interface SimulatedPosition {
  conid: number;
  symbol: string;
  position: number;
  avgCost: number;
  marketValue: number;
  unrealizedPnl: number;
}

export interface SimulatedOrder {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  filledQuantity: number;
  orderType: string;
  status: string;
  price?: number;
  submittedAt: Date;
}

// Simulated market prices (would be real-time in production)
const MARKET_PRICES: Record<string, number> = {
  SPY: 598.50,
  QQQ: 525.25,
  AAPL: 235.80,
  MSFT: 445.20,
  NVDA: 142.30,
  TSLA: 415.60,
  AMD: 125.40,
  META: 625.90,
  GOOGL: 198.75,
  AMZN: 225.40,
};

const STORAGE_KEY = 'simulated_trading_state';

interface TradingState {
  balance: number;
  positions: SimulatedPosition[];
  orders: SimulatedOrder[];
  tradeHistory: Array<{
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: string;
  }>;
}

function loadState(): TradingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[SimulatedTrading] Failed to load state:', e);
  }
  return {
    balance: 1000, // Start with $1,000 for the challenge
    positions: [],
    orders: [],
    tradeHistory: [],
  };
}

function saveState(state: TradingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[SimulatedTrading] Failed to save state:', e);
  }
}

export function getMarketPrice(symbol: string): number {
  // Add some randomness to simulate real market movement
  const basePrice = MARKET_PRICES[symbol.toUpperCase()] || 100;
  const variation = basePrice * 0.001 * (Math.random() - 0.5);
  return Math.round((basePrice + variation) * 100) / 100;
}

export function getSimulatedAccount(): SimulatedAccount {
  const state = loadState();
  
  // Calculate total position value
  const positionValue = state.positions.reduce((sum, pos) => {
    return sum + pos.marketValue;
  }, 0);
  
  return {
    accountId: 'SIM-PAPER-001',
    accountType: 'Simulated Paper',
    balance: state.balance + positionValue,
    buyingPower: state.balance,
  };
}

export function getSimulatedPositions(): SimulatedPosition[] {
  const state = loadState();
  
  // Update market values and P&L
  return state.positions.map(pos => {
    const currentPrice = getMarketPrice(pos.symbol);
    const marketValue = pos.position * currentPrice;
    const costBasis = pos.position * pos.avgCost;
    
    return {
      ...pos,
      marketValue,
      unrealizedPnl: marketValue - costBasis,
    };
  });
}

export function getSimulatedOrders(): SimulatedOrder[] {
  const state = loadState();
  return state.orders;
}

export function placeSimulatedOrder(params: {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT';
  price?: number;
}): SimulatedOrder | null {
  const state = loadState();
  const symbol = params.symbol.toUpperCase();
  const currentPrice = params.orderType === 'LMT' && params.price 
    ? params.price 
    : getMarketPrice(symbol);
  
  const totalCost = currentPrice * params.quantity;
  
  // Validate order
  if (params.side === 'BUY') {
    if (totalCost > state.balance) {
      console.error('[SimulatedTrading] Insufficient funds');
      return null;
    }
  } else {
    // Check if we have enough shares to sell
    const position = state.positions.find(p => p.symbol === symbol);
    if (!position || position.position < params.quantity) {
      console.error('[SimulatedTrading] Insufficient shares');
      return null;
    }
  }
  
  // Execute the order immediately for market orders
  const orderId = `SIM-${Date.now()}`;
  
  if (params.orderType === 'MKT') {
    // Execute immediately
    if (params.side === 'BUY') {
      state.balance -= totalCost;
      
      // Update or create position
      const existingPos = state.positions.find(p => p.symbol === symbol);
      if (existingPos) {
        const totalShares = existingPos.position + params.quantity;
        const totalCostBasis = (existingPos.position * existingPos.avgCost) + totalCost;
        existingPos.avgCost = totalCostBasis / totalShares;
        existingPos.position = totalShares;
        existingPos.marketValue = totalShares * currentPrice;
      } else {
        state.positions.push({
          conid: Math.floor(Math.random() * 1000000),
          symbol,
          position: params.quantity,
          avgCost: currentPrice,
          marketValue: totalCost,
          unrealizedPnl: 0,
        });
      }
    } else {
      // SELL
      state.balance += totalCost;
      
      const position = state.positions.find(p => p.symbol === symbol);
      if (position) {
        position.position -= params.quantity;
        position.marketValue = position.position * currentPrice;
        
        if (position.position === 0) {
          state.positions = state.positions.filter(p => p.symbol !== symbol);
        }
      }
    }
    
    // Add to trade history
    state.tradeHistory.push({
      symbol,
      side: params.side,
      quantity: params.quantity,
      price: currentPrice,
      timestamp: new Date().toISOString(),
    });
    
    saveState(state);
    
    return {
      orderId,
      symbol,
      side: params.side,
      quantity: params.quantity,
      filledQuantity: params.quantity,
      orderType: params.orderType,
      status: 'Filled',
      price: currentPrice,
      submittedAt: new Date(),
    };
  }
  
  // For limit orders, add to pending orders
  const order: SimulatedOrder = {
    orderId,
    symbol,
    side: params.side,
    quantity: params.quantity,
    filledQuantity: 0,
    orderType: params.orderType,
    status: 'Pending',
    price: params.price,
    submittedAt: new Date(),
  };
  
  state.orders.push(order);
  saveState(state);
  
  return order;
}

export function cancelSimulatedOrder(orderId: string): boolean {
  const state = loadState();
  const orderIndex = state.orders.findIndex(o => o.orderId === orderId);
  
  if (orderIndex >= 0) {
    state.orders.splice(orderIndex, 1);
    saveState(state);
    return true;
  }
  
  return false;
}

export function resetSimulatedAccount(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getTradeHistory() {
  const state = loadState();
  return state.tradeHistory;
}
