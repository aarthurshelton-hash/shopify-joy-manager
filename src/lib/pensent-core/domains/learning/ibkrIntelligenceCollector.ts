/**
 * IBKR Intelligence Collector v1.0
 * 
 * Real-time market intelligence gathering from IBKR Paper Account
 * 
 * Feeds execution data into the Universal Learning Pipeline:
 * - Trade outcomes → Pattern validation
 * - P&L data → Confidence calibration
 * - Market conditions → Archetype refinement
 * 
 * "The Market is the NERVOUS SYSTEM - every trade teaches the organism"
 */

import { getBridgeUrl } from '@/lib/trading/ibGatewayBridge';
import { crossDomainLearningPipeline } from './crossDomainLearningPipeline';

export interface IBKRTradeIntelligence {
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  executionTime: Date;
  archetype: string;
  confidence: number;
  wasCorrect?: boolean;
  marketConditions: MarketConditions;
}

export interface MarketConditions {
  volatility: 'low' | 'medium' | 'high';
  trend: 'bullish' | 'bearish' | 'sideways';
  volume: 'low' | 'normal' | 'high';
  sector: string;
}

export interface IntelligenceState {
  isConnected: boolean;
  lastUpdate: Date | null;
  tradesCollected: number;
  patternsLearned: number;
  totalPnl: number;
  winRate: number;
  accuracyByArchetype: Record<string, number>;
}

// Archetype mapping from market conditions
const MARKET_TO_ARCHETYPE_MAP: Record<string, Record<string, string>> = {
  bullish: {
    high: 'momentum_surge',
    medium: 'uptrend',
    low: 'accumulation',
  },
  bearish: {
    high: 'reversal_bearish',
    medium: 'downtrend',
    low: 'distribution',
  },
  sideways: {
    high: 'high_volatility',
    medium: 'consolidation',
    low: 'low_volatility',
  },
};

class IBKRIntelligenceCollector {
  private state: IntelligenceState = {
    isConnected: false,
    lastUpdate: null,
    tradesCollected: 0,
    patternsLearned: 0,
    totalPnl: 0,
    winRate: 0.5,
    accuracyByArchetype: {},
  };
  
  private tradeHistory: IBKRTradeIntelligence[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_FREQUENCY_MS = 5000; // 5 seconds

  /**
   * Connect to IBKR Gateway and start intelligence collection
   */
  async connect(): Promise<boolean> {
    const bridgeUrl = getBridgeUrl();
    
    try {
      console.log('[IBKRIntelligence] Connecting to gateway...');
      
      const response = await fetch(`${bridgeUrl}/api/connection`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Gateway connection failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.connected) {
        this.state.isConnected = true;
        this.state.lastUpdate = new Date();
        console.log('[IBKRIntelligence] ✓ Connected to IBKR Gateway');
        
        // Start polling for trades
        this.startPolling();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('[IBKRIntelligence] Connection failed:', error);
      this.state.isConnected = false;
      return false;
    }
  }

  /**
   * Start continuous polling for new trade data
   */
  private startPolling(): void {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(async () => {
      await this.collectIntelligence();
    }, this.POLL_FREQUENCY_MS);
    
    console.log('[IBKRIntelligence] Started polling loop');
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('[IBKRIntelligence] Stopped polling loop');
    }
  }

  /**
   * Collect intelligence from IBKR account
   */
  async collectIntelligence(): Promise<void> {
    if (!this.state.isConnected) return;
    
    const bridgeUrl = getBridgeUrl();
    
    try {
      // Fetch account summary
      const accountResponse = await fetch(`${bridgeUrl}/api/accounts`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        await this.processAccountData(accountData);
      }
      
      // Fetch positions
      const positionsResponse = await fetch(`${bridgeUrl}/api/positions`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        await this.processPositions(positionsData);
      }
      
      // Fetch recent orders/executions
      const ordersResponse = await fetch(`${bridgeUrl}/api/orders`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        await this.processOrders(ordersData);
      }
      
      this.state.lastUpdate = new Date();
    } catch (error) {
      console.warn('[IBKRIntelligence] Collection error:', error);
    }
  }

  /**
   * Process account data for learning
   */
  private async processAccountData(data: any): Promise<void> {
    if (!data?.accounts?.length) return;
    
    const account = data.accounts[0];
    const totalPnl = account.unrealizedPnL || 0;
    
    // Track PnL changes for pattern calibration
    if (totalPnl !== this.state.totalPnl) {
      const pnlChange = totalPnl - this.state.totalPnl;
      this.state.totalPnl = totalPnl;
      
      // Propagate to cross-domain learning
      if (Math.abs(pnlChange) > 10) { // Significant change
        console.log(`[IBKRIntelligence] PnL change: $${pnlChange.toFixed(2)}`);
      }
    }
  }

  /**
   * Process positions for archetype mapping
   */
  private async processPositions(data: any): Promise<void> {
    if (!data?.positions?.length) return;
    
    for (const position of data.positions) {
      const marketConditions = this.inferMarketConditions(position);
      const archetype = this.deriveArchetype(marketConditions);
      
      // Check if position outcome is known
      if (position.unrealizedPnL !== undefined) {
        const wasCorrect = position.unrealizedPnL > 0;
        
        // Update archetype accuracy
        const currentAccuracy = this.state.accuracyByArchetype[archetype] || 0.5;
        this.state.accuracyByArchetype[archetype] = 
          currentAccuracy * 0.9 + (wasCorrect ? 0.1 : 0);
      }
    }
  }

  /**
   * Process order executions for pattern learning
   */
  private async processOrders(data: any): Promise<void> {
    if (!data?.orders?.length) return;
    
    for (const order of data.orders) {
      if (order.status !== 'Filled') continue;
      
      // Create intelligence record
      const marketConditions = this.inferMarketConditionsFromOrder(order);
      const archetype = this.deriveArchetype(marketConditions);
      
      const intelligence: IBKRTradeIntelligence = {
        symbol: order.symbol,
        direction: order.action === 'BUY' ? 'long' : 'short',
        entryPrice: order.avgPrice || order.price,
        quantity: order.totalQuantity || order.quantity,
        executionTime: new Date(order.time || Date.now()),
        archetype,
        confidence: 0.7, // Base confidence
        marketConditions,
      };
      
      // Store in history
      this.tradeHistory.push(intelligence);
      this.state.tradesCollected++;
      
      // Feed to cross-domain learning pipeline
      await this.feedToLearningPipeline(intelligence);
    }
  }

  /**
   * Feed trade intelligence to cross-domain learning pipeline
   */
  private async feedToLearningPipeline(trade: IBKRTradeIntelligence): Promise<void> {
    // Determine direction outcome
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    let predicted: 'up' | 'down' | 'neutral' = 'neutral';
    
    if (trade.direction === 'long') {
      predicted = 'up';
      if (trade.pnl !== undefined) {
        direction = trade.pnl > 0 ? 'up' : trade.pnl < 0 ? 'down' : 'neutral';
      }
    } else {
      predicted = 'down';
      if (trade.pnl !== undefined) {
        direction = trade.pnl > 0 ? 'down' : trade.pnl < 0 ? 'up' : 'neutral';
      }
    }
    
    // Feed to learning pipeline
    const lessons = await crossDomainLearningPipeline.learnFromMarketExecution({
      symbol: trade.symbol,
      direction,
      predicted,
      confidence: trade.confidence,
      archetype: trade.archetype,
      pnl: trade.pnl,
    });
    
    this.state.patternsLearned += lessons.length;
    
    // Update win rate
    if (trade.wasCorrect !== undefined) {
      const total = this.tradeHistory.filter(t => t.wasCorrect !== undefined).length;
      const wins = this.tradeHistory.filter(t => t.wasCorrect === true).length;
      this.state.winRate = total > 0 ? wins / total : 0.5;
    }
    
    console.log(`[IBKRIntelligence] Trade → ${lessons.length} cross-domain lessons`);
  }

  /**
   * Infer market conditions from position data
   */
  private inferMarketConditions(position: any): MarketConditions {
    // Derive volatility from P&L spread
    const pnlPercent = Math.abs(position.unrealizedPnLPercent || 0);
    const volatility = pnlPercent > 5 ? 'high' : pnlPercent > 2 ? 'medium' : 'low';
    
    // Derive trend from P&L direction
    const pnl = position.unrealizedPnL || 0;
    const trend = pnl > 0 ? 'bullish' : pnl < 0 ? 'bearish' : 'sideways';
    
    return {
      volatility,
      trend,
      volume: 'normal', // Would need real volume data
      sector: this.inferSector(position.symbol),
    };
  }

  /**
   * Infer market conditions from order data
   */
  private inferMarketConditionsFromOrder(order: any): MarketConditions {
    return {
      volatility: 'medium', // Default without real-time data
      trend: order.action === 'BUY' ? 'bullish' : 'bearish',
      volume: 'normal',
      sector: this.inferSector(order.symbol),
    };
  }

  /**
   * Infer sector from symbol
   */
  private inferSector(symbol: string): string {
    const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AMZN', 'TSLA'];
    const financeSymbols = ['JPM', 'BAC', 'GS', 'MS', 'WFC'];
    const energySymbols = ['XOM', 'CVX', 'COP', 'SLB'];
    
    if (techSymbols.includes(symbol)) return 'technology';
    if (financeSymbols.includes(symbol)) return 'financials';
    if (energySymbols.includes(symbol)) return 'energy';
    if (symbol.includes('SPY') || symbol.includes('QQQ')) return 'index';
    
    return 'other';
  }

  /**
   * Derive archetype from market conditions
   */
  private deriveArchetype(conditions: MarketConditions): string {
    return MARKET_TO_ARCHETYPE_MAP[conditions.trend]?.[conditions.volatility] || 'consolidation';
  }

  /**
   * Get current intelligence state
   */
  getState(): IntelligenceState {
    return { ...this.state };
  }

  /**
   * Get trade history
   */
  getTradeHistory(): IBKRTradeIntelligence[] {
    return [...this.tradeHistory];
  }

  /**
   * Get accuracy by archetype
   */
  getArchetypeAccuracy(): Record<string, number> {
    return { ...this.state.accuracyByArchetype };
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.stopPolling();
    this.state.isConnected = false;
    console.log('[IBKRIntelligence] Disconnected');
  }
}

// Singleton export
export const ibkrIntelligenceCollector = new IBKRIntelligenceCollector();
