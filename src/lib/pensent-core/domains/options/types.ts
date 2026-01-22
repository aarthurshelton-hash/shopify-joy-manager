/**
 * Options Scalping System - Core Types
 * 
 * Specialized for American Options with multi-timeframe adaptive prediction.
 * Supports 0DTE, weekly swings, event-driven, and spread strategies.
 * 
 * En Pensent™ Patent-Pending Technology
 * @version 7.50-OPTIONS
 */

export type OptionType = 'call' | 'put';
export type StrategyType = '0dte' | 'weekly' | 'event_driven' | 'spread' | 'scalp';
export type TimeframeType = '30s' | '1m' | '5m' | '15m' | '1h' | '4h';
export type MarketSession = 'premarket' | 'regular' | 'afterhours' | 'closed';

export interface OptionContract {
  symbol: string;
  underlying: string;
  type: OptionType;
  strike: number;
  expiration: string; // ISO date
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  timestamp: number;
}

export interface OptionsChain {
  underlying: string;
  underlyingPrice: number;
  expirations: string[];
  calls: OptionContract[];
  puts: OptionContract[];
  timestamp: number;
}

export interface OptionsTick {
  symbol: string;
  underlying: string;
  underlyingPrice: number;
  optionPrice: number;
  bid: number;
  ask: number;
  delta: number;
  iv: number;
  volume: number;
  timestamp: number;
  source: string;
}

export interface OptionsSignal {
  id: string;
  type: 'momentum' | 'reversal' | 'breakout' | 'iv_spike' | 'gamma_squeeze' | 'flow_imbalance';
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  underlying: string;
  targetStrike: number;
  targetExpiration: string;
  optionType: OptionType;
  confidence: number;
  timeframe: TimeframeType;
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
}

export interface OptionsPrediction {
  id: string;
  underlying: string;
  strategy: StrategyType;
  direction: 'long' | 'short';
  optionType: OptionType;
  strike: number;
  expiration: string;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  confidence: number;
  timeframe: TimeframeType;
  signals: OptionsSignal[];
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  riskReward: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  timestamp: number;
  expiresAt: number;
  resolved?: boolean;
  wasCorrect?: boolean;
  actualPrice?: number;
  pnl?: number;
}

export interface UnderlyingAnalysis {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  
  // Technical indicators
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  ema9: number;
  vwap: number;
  
  // Support/Resistance levels
  supports: number[];
  resistances: number[];
  
  // Trend analysis
  trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  trendStrength: number;
  
  // Volatility
  historicalVolatility: number;
  ivRank: number;
  ivPercentile: number;
  
  timestamp: number;
}

export interface MarketContext {
  session: MarketSession;
  spyTrend: 'up' | 'down' | 'flat';
  vixLevel: number;
  vixChange: number;
  marketBreadth: number; // -100 to 100
  sectorRotation: Record<string, number>;
  economicEvents: EconomicEvent[];
  timestamp: number;
}

export interface EconomicEvent {
  name: string;
  impact: 'high' | 'medium' | 'low';
  time: string;
  actual?: number;
  forecast?: number;
  previous?: number;
}

export interface OptionsPortfolio {
  id: string;
  balance: number;
  startingBalance: number;
  dayPnL: number;
  weekPnL: number;
  monthPnL: number;
  totalPnL: number;
  openPositions: OptionsPosition[];
  closedPositions: OptionsPosition[];
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  totalTrades: number;
  updatedAt: number;
}

export interface OptionsPosition {
  id: string;
  underlying: string;
  optionSymbol: string;
  optionType: OptionType;
  strike: number;
  expiration: string;
  direction: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnL: number;
  realizedPnL: number;
  entryTime: number;
  exitTime?: number;
  strategy: StrategyType;
  predictionId: string;
  status: 'open' | 'closed' | 'stopped' | 'expired';
}

export interface OptionsFlowData {
  symbol: string;
  underlying: string;
  type: OptionType;
  strike: number;
  expiration: string;
  premium: number;
  size: number;
  side: 'buy' | 'sell';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  isUnusual: boolean;
  isSweep: boolean;
  timestamp: number;
}

export interface OptionsEngineConfig {
  // Timeframes to monitor
  timeframes: TimeframeType[];
  
  // Risk management
  maxPositionSize: number; // Percentage of portfolio
  maxDailyLoss: number; // Percentage
  maxOpenPositions: number;
  defaultStopLoss: number; // Percentage
  defaultTakeProfit: number; // Percentage
  
  // Strategy weights
  strategyWeights: Record<StrategyType, number>;
  
  // Signal thresholds
  minConfidence: number;
  minRiskReward: number;
  
  // Greeks constraints
  maxDelta: number;
  maxTheta: number; // Per day
  minIV: number;
  maxIV: number;
  
  // Timing
  predictionIntervalMs: number;
  chainRefreshIntervalMs: number;
  
  // Market hours
  tradingStartHour: number;
  tradingEndHour: number;
  tradePremarket: boolean;
  tradeAfterHours: boolean;
}

export const DEFAULT_OPTIONS_CONFIG: OptionsEngineConfig = {
  timeframes: ['1m', '5m', '15m'],
  maxPositionSize: 0.05, // 5%
  maxDailyLoss: 0.10, // 10%
  maxOpenPositions: 5,
  defaultStopLoss: 0.25, // 25%
  defaultTakeProfit: 0.50, // 50%
  strategyWeights: {
    '0dte': 0.30,
    weekly: 0.25,
    event_driven: 0.15,
    spread: 0.15,
    scalp: 0.15,
  },
  minConfidence: 0.55,
  minRiskReward: 1.5,
  maxDelta: 0.70,
  maxTheta: 0.05,
  minIV: 0.15,
  maxIV: 1.50,
  predictionIntervalMs: 5000,
  chainRefreshIntervalMs: 30000,
  tradingStartHour: 9,
  tradingEndHour: 16,
  tradePremarket: true,
  tradeAfterHours: false,
};

// Supported underlyings for scalping
export const SCALPING_UNDERLYINGS = [
  { symbol: 'SPY', name: 'S&P 500 ETF', liquidity: 'ultra', volatility: 'medium' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', liquidity: 'ultra', volatility: 'high' },
  { symbol: 'IWM', name: 'Russell 2000 ETF', liquidity: 'high', volatility: 'high' },
  { symbol: 'AAPL', name: 'Apple Inc.', liquidity: 'ultra', volatility: 'medium' },
  { symbol: 'TSLA', name: 'Tesla Inc.', liquidity: 'ultra', volatility: 'very_high' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', liquidity: 'ultra', volatility: 'very_high' },
  { symbol: 'AMD', name: 'AMD Inc.', liquidity: 'high', volatility: 'very_high' },
  { symbol: 'AMZN', name: 'Amazon.com', liquidity: 'ultra', volatility: 'medium' },
  { symbol: 'META', name: 'Meta Platforms', liquidity: 'ultra', volatility: 'high' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', liquidity: 'ultra', volatility: 'medium' },
] as const;

export type ScalpingUnderlying = typeof SCALPING_UNDERLYINGS[number]['symbol'];
