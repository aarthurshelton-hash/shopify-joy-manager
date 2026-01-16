/**
 * 24-Hour Futures Market Correlations
 * Key contracts with established inter-market relationships
 */

export interface FuturesContract {
  symbol: string;
  name: string;
  exchange: string;
  tickSize: number;
  pointValue: number;
  tradingHours: string;
  correlations: FuturesCorrelation[];
  leadLagProfile: LeadLagProfile;
  volatilityProfile: VolatilityProfile;
}

export interface FuturesCorrelation {
  withSymbol: string;
  baseCorrelation: number; // Historical average
  currentCorrelation: number; // Real-time calculated
  confidence: number; // How stable this relationship is
  description: string;
  tradingImplication: 'confirming' | 'divergent' | 'leading' | 'lagging';
}

export interface LeadLagProfile {
  leadsBy: number; // Positive = leads, negative = lags (in ticks)
  reliability: number; // 0-1
  bestTimeframes: string[];
}

export interface VolatilityProfile {
  avgDailyRange: number; // Percentage
  peakVolatilityHours: string[];
  lowVolatilityHours: string[];
}

// Key 24H Futures Contracts with Correlative Value
export const FUTURES_CONTRACTS: Record<string, FuturesContract> = {
  ES: {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 50,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'NQ', baseCorrelation: 0.92, currentCorrelation: 0.92, confidence: 0.95, description: 'Tech-heavy cousin', tradingImplication: 'confirming' },
      { withSymbol: 'ZN', baseCorrelation: -0.35, currentCorrelation: -0.35, confidence: 0.80, description: 'Flight to safety inverse', tradingImplication: 'divergent' },
      { withSymbol: 'VX', baseCorrelation: -0.78, currentCorrelation: -0.78, confidence: 0.90, description: 'Fear gauge inverse', tradingImplication: 'leading' },
      { withSymbol: 'CL', baseCorrelation: 0.25, currentCorrelation: 0.25, confidence: 0.60, description: 'Energy/inflation proxy', tradingImplication: 'lagging' },
    ],
    leadLagProfile: { leadsBy: 0, reliability: 0.95, bestTimeframes: ['1m', '5m', '15m'] },
    volatilityProfile: { avgDailyRange: 1.2, peakVolatilityHours: ['9:30-10:30 ET', '14:00-16:00 ET'], lowVolatilityHours: ['12:00-14:00 ET'] }
  },
  NQ: {
    symbol: 'NQ',
    name: 'E-mini Nasdaq 100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 20,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'ES', baseCorrelation: 0.92, currentCorrelation: 0.92, confidence: 0.95, description: 'Broad market cousin', tradingImplication: 'confirming' },
      { withSymbol: 'ZN', baseCorrelation: -0.40, currentCorrelation: -0.40, confidence: 0.75, description: 'Rate sensitivity inverse', tradingImplication: 'divergent' },
      { withSymbol: 'GC', baseCorrelation: -0.15, currentCorrelation: -0.15, confidence: 0.50, description: 'Risk-on vs safe haven', tradingImplication: 'divergent' },
    ],
    leadLagProfile: { leadsBy: 1, reliability: 0.70, bestTimeframes: ['1m', '5m'] },
    volatilityProfile: { avgDailyRange: 1.8, peakVolatilityHours: ['9:30-10:30 ET'], lowVolatilityHours: ['12:00-14:00 ET'] }
  },
  ZN: {
    symbol: 'ZN',
    name: '10-Year Treasury Note',
    exchange: 'CBOT',
    tickSize: 0.015625,
    pointValue: 1000,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'ES', baseCorrelation: -0.35, currentCorrelation: -0.35, confidence: 0.80, description: 'Risk-off rotation', tradingImplication: 'divergent' },
      { withSymbol: 'GC', baseCorrelation: 0.30, currentCorrelation: 0.30, confidence: 0.65, description: 'Safe haven alignment', tradingImplication: 'confirming' },
      { withSymbol: '6E', baseCorrelation: 0.20, currentCorrelation: 0.20, confidence: 0.55, description: 'Rate differential', tradingImplication: 'lagging' },
    ],
    leadLagProfile: { leadsBy: -2, reliability: 0.75, bestTimeframes: ['15m', '1H'] },
    volatilityProfile: { avgDailyRange: 0.5, peakVolatilityHours: ['8:30 ET (data)', '14:00 ET (FOMC)'], lowVolatilityHours: ['16:00-20:00 ET'] }
  },
  CL: {
    symbol: 'CL',
    name: 'Crude Oil WTI',
    exchange: 'NYMEX',
    tickSize: 0.01,
    pointValue: 1000,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'ES', baseCorrelation: 0.25, currentCorrelation: 0.25, confidence: 0.60, description: 'Economic activity proxy', tradingImplication: 'confirming' },
      { withSymbol: '6E', baseCorrelation: 0.35, currentCorrelation: 0.35, confidence: 0.65, description: 'Dollar inverse', tradingImplication: 'divergent' },
      { withSymbol: 'GC', baseCorrelation: 0.20, currentCorrelation: 0.20, confidence: 0.55, description: 'Inflation hedges', tradingImplication: 'confirming' },
    ],
    leadLagProfile: { leadsBy: 0, reliability: 0.60, bestTimeframes: ['5m', '15m'] },
    volatilityProfile: { avgDailyRange: 2.5, peakVolatilityHours: ['10:30 ET (inventory)', '9:00-11:00 ET'], lowVolatilityHours: ['22:00-02:00 ET'] }
  },
  GC: {
    symbol: 'GC',
    name: 'Gold Futures',
    exchange: 'COMEX',
    tickSize: 0.10,
    pointValue: 100,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: '6E', baseCorrelation: 0.45, currentCorrelation: 0.45, confidence: 0.75, description: 'Dollar inverse', tradingImplication: 'divergent' },
      { withSymbol: 'ZN', baseCorrelation: 0.30, currentCorrelation: 0.30, confidence: 0.65, description: 'Safe haven pair', tradingImplication: 'confirming' },
      { withSymbol: 'ES', baseCorrelation: -0.15, currentCorrelation: -0.15, confidence: 0.50, description: 'Risk-off flows', tradingImplication: 'divergent' },
    ],
    leadLagProfile: { leadsBy: -1, reliability: 0.65, bestTimeframes: ['15m', '1H'] },
    volatilityProfile: { avgDailyRange: 1.0, peakVolatilityHours: ['8:30 ET', '10:00 ET'], lowVolatilityHours: ['16:00-20:00 ET'] }
  },
  VX: {
    symbol: 'VX',
    name: 'VIX Futures',
    exchange: 'CFE',
    tickSize: 0.05,
    pointValue: 1000,
    tradingHours: '23H (Sun 5pm - Fri 4pm ET)',
    correlations: [
      { withSymbol: 'ES', baseCorrelation: -0.78, currentCorrelation: -0.78, confidence: 0.90, description: 'Fear gauge', tradingImplication: 'leading' },
      { withSymbol: 'NQ', baseCorrelation: -0.80, currentCorrelation: -0.80, confidence: 0.88, description: 'Tech volatility', tradingImplication: 'leading' },
      { withSymbol: 'ZN', baseCorrelation: 0.25, currentCorrelation: 0.25, confidence: 0.60, description: 'Flight to quality', tradingImplication: 'confirming' },
    ],
    leadLagProfile: { leadsBy: 3, reliability: 0.85, bestTimeframes: ['1m', '5m'] },
    volatilityProfile: { avgDailyRange: 5.0, peakVolatilityHours: ['9:30-10:30 ET', '15:00-16:00 ET'], lowVolatilityHours: ['12:00-14:00 ET'] }
  },
  '6E': {
    symbol: '6E',
    name: 'Euro FX Futures',
    exchange: 'CME',
    tickSize: 0.00005,
    pointValue: 125000,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'GC', baseCorrelation: 0.45, currentCorrelation: 0.45, confidence: 0.75, description: 'Dollar inverse pair', tradingImplication: 'confirming' },
      { withSymbol: 'CL', baseCorrelation: 0.35, currentCorrelation: 0.35, confidence: 0.65, description: 'Commodity currency', tradingImplication: 'confirming' },
      { withSymbol: 'ZN', baseCorrelation: 0.20, currentCorrelation: 0.20, confidence: 0.55, description: 'Rate differentials', tradingImplication: 'lagging' },
    ],
    leadLagProfile: { leadsBy: 0, reliability: 0.70, bestTimeframes: ['5m', '15m', '1H'] },
    volatilityProfile: { avgDailyRange: 0.6, peakVolatilityHours: ['3:00-5:00 ET (Europe)', '8:30 ET'], lowVolatilityHours: ['17:00-20:00 ET'] }
  },
  RTY: {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    pointValue: 50,
    tradingHours: '23H (Sun 6pm - Fri 5pm ET)',
    correlations: [
      { withSymbol: 'ES', baseCorrelation: 0.85, currentCorrelation: 0.85, confidence: 0.90, description: 'Small cap beta', tradingImplication: 'lagging' },
      { withSymbol: 'ZN', baseCorrelation: -0.30, currentCorrelation: -0.30, confidence: 0.70, description: 'Rate sensitive', tradingImplication: 'divergent' },
      { withSymbol: 'NQ', baseCorrelation: 0.75, currentCorrelation: 0.75, confidence: 0.85, description: 'Risk-on alignment', tradingImplication: 'lagging' },
    ],
    leadLagProfile: { leadsBy: -2, reliability: 0.80, bestTimeframes: ['5m', '15m'] },
    volatilityProfile: { avgDailyRange: 1.5, peakVolatilityHours: ['9:30-10:30 ET'], lowVolatilityHours: ['12:00-14:00 ET'] }
  }
};

// Correlation confidence thresholds
export const CORRELATION_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.80,
  MEDIUM_CONFIDENCE: 0.60,
  LOW_CONFIDENCE: 0.40,
  STRONG_CORRELATION: 0.70,
  MODERATE_CORRELATION: 0.40,
  WEAK_CORRELATION: 0.20
};

// Get all contracts as array
export const getAllContracts = (): FuturesContract[] => Object.values(FUTURES_CONTRACTS);

// Get high-confidence correlations
export const getHighConfidenceCorrelations = (): Array<{
  contract1: string;
  contract2: string;
  correlation: number;
  confidence: number;
}> => {
  const pairs: Array<{ contract1: string; contract2: string; correlation: number; confidence: number }> = [];
  
  Object.entries(FUTURES_CONTRACTS).forEach(([symbol, contract]) => {
    contract.correlations.forEach(corr => {
      if (corr.confidence >= CORRELATION_THRESHOLDS.HIGH_CONFIDENCE) {
        pairs.push({
          contract1: symbol,
          contract2: corr.withSymbol,
          correlation: corr.currentCorrelation,
          confidence: corr.confidence
        });
      }
    });
  });
  
  return pairs;
};

// Get leading indicators
export const getLeadingIndicators = (): FuturesContract[] => {
  return getAllContracts().filter(c => c.leadLagProfile.leadsBy > 0 && c.leadLagProfile.reliability > 0.7);
};
