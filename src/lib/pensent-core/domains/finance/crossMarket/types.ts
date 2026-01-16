/**
 * Cross-Market Engine Types
 */

export type AssetClass = 'equity' | 'bond' | 'future' | 'commodity' | 'forex' | 'crypto';

export interface MarketTick {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface CrossMarketSignal {
  type: 'divergence' | 'convergence' | 'leading' | 'lagging' | 'breakout' | 'reversal';
  strength: number;
  sourceMarkets: AssetClass[];
  description: string;
  predictiveValue: number;
  timestamp: number;
}

export interface MarketCorrelation {
  market1: AssetClass;
  market2: AssetClass;
  correlation: number;
  lag: number;
  strength: number;
  isInverted: boolean;
}

export interface BigPictureState {
  correlations: MarketCorrelation[];
  activeSignals: CrossMarketSignal[];
  marketSentiment: number;
  volatilityIndex: number;
  riskAppetite: number;
  trendAlignment: number;
  predictionBoost: number;
}

export interface MarketSnapshot {
  equity: MarketTick | null;
  bond: MarketTick | null;
  future: MarketTick | null;
  commodity: MarketTick | null;
  forex: MarketTick | null;
  crypto: MarketTick | null;
}

export const KNOWN_CORRELATIONS: Array<{
  markets: [AssetClass, AssetClass];
  typicalCorrelation: number;
  description: string;
}> = [
  { markets: ['equity', 'bond'], typicalCorrelation: -0.3, description: 'Flight to safety inverse' },
  { markets: ['equity', 'commodity'], typicalCorrelation: 0.4, description: 'Risk-on alignment' },
  { markets: ['bond', 'commodity'], typicalCorrelation: -0.2, description: 'Inflation hedge dynamic' },
  { markets: ['future', 'equity'], typicalCorrelation: 0.95, description: 'Futures lead cash' },
  { markets: ['commodity', 'forex'], typicalCorrelation: -0.3, description: 'Dollar strength inverse' },
  { markets: ['crypto', 'equity'], typicalCorrelation: 0.6, description: 'Risk appetite correlation' },
];
