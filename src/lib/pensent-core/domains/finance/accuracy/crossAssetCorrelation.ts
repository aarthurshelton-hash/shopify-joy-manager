/**
 * Cross-Asset Correlation Lag - v7.53-ACCURACY
 * 
 * Uses leading indicators from correlated assets to improve predictions.
 * BTC often leads equity risk, VIX leads reversals, etc.
 */

export type AssetClass = 'equity' | 'crypto' | 'bond' | 'commodity' | 'forex' | 'volatility';

export interface LeadLagRelationship {
  leader: string;       // Ticker of leading asset
  follower: string;     // Ticker of following asset
  lagMinutes: number;   // How many minutes follower lags
  correlation: number;  // Correlation strength (-1 to 1)
  reliability: number;  // How reliable this relationship is (0-1)
  regime: 'risk_on' | 'risk_off' | 'all';  // When this relationship holds
}

/**
 * Known lead-lag relationships from market microstructure
 */
export const LEAD_LAG_RELATIONSHIPS: LeadLagRelationship[] = [
  // Crypto leads equity risk
  {
    leader: 'BTC',
    follower: 'SPY',
    lagMinutes: 15,
    correlation: 0.65,
    reliability: 0.7,
    regime: 'risk_on',
  },
  {
    leader: 'BTC',
    follower: 'QQQ',
    lagMinutes: 10,
    correlation: 0.72,
    reliability: 0.75,
    regime: 'risk_on',
  },
  // VIX leads reversals
  {
    leader: 'VIX',
    follower: 'SPY',
    lagMinutes: 5,
    correlation: -0.85,
    reliability: 0.9,
    regime: 'all',
  },
  // Bonds lead equity in risk-off
  {
    leader: 'TLT',
    follower: 'SPY',
    lagMinutes: 30,
    correlation: -0.5,
    reliability: 0.6,
    regime: 'risk_off',
  },
  // Dollar strength
  {
    leader: 'DXY',
    follower: 'SPY',
    lagMinutes: 60,
    correlation: -0.4,
    reliability: 0.55,
    regime: 'all',
  },
  // Gold as safe haven
  {
    leader: 'GLD',
    follower: 'SPY',
    lagMinutes: 20,
    correlation: -0.35,
    reliability: 0.5,
    regime: 'risk_off',
  },
  // Sector rotation
  {
    leader: 'XLF',
    follower: 'SPY',
    lagMinutes: 15,
    correlation: 0.8,
    reliability: 0.7,
    regime: 'risk_on',
  },
  // Tech leads market
  {
    leader: 'NVDA',
    follower: 'QQQ',
    lagMinutes: 5,
    correlation: 0.85,
    reliability: 0.8,
    regime: 'all',
  },
];

export interface AssetSignal {
  ticker: string;
  direction: 'up' | 'down' | 'neutral';
  magnitude: number;  // Percentage move
  timestamp: number;
}

/**
 * Find relevant lead signals for a target asset
 */
export function findLeadSignals(
  targetTicker: string,
  currentSignals: AssetSignal[],
  regime: 'risk_on' | 'risk_off' | 'neutral' = 'neutral'
): { relationship: LeadLagRelationship; signal: AssetSignal; expectedMove: number }[] {
  const relationships = LEAD_LAG_RELATIONSHIPS.filter(r => 
    r.follower === targetTicker && 
    (r.regime === 'all' || r.regime === regime || regime === 'neutral')
  );
  
  const leadSignals: { relationship: LeadLagRelationship; signal: AssetSignal; expectedMove: number }[] = [];
  
  for (const rel of relationships) {
    const leaderSignal = currentSignals.find(s => s.ticker === rel.leader);
    if (leaderSignal) {
      // Calculate expected move based on correlation and leader move
      const expectedMove = leaderSignal.magnitude * rel.correlation * rel.reliability;
      leadSignals.push({ relationship: rel, signal: leaderSignal, expectedMove });
    }
  }
  
  return leadSignals.sort((a, b) => Math.abs(b.expectedMove) - Math.abs(a.expectedMove));
}

/**
 * Aggregate lead signals into a prediction adjustment
 */
export function aggregateLeadSignals(
  leadSignals: { relationship: LeadLagRelationship; signal: AssetSignal; expectedMove: number }[]
): { direction: 'up' | 'down' | 'neutral'; confidence: number; expectedMagnitude: number } {
  if (leadSignals.length === 0) {
    return { direction: 'neutral', confidence: 0, expectedMagnitude: 0 };
  }
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const ls of leadSignals) {
    const weight = ls.relationship.reliability * Math.abs(ls.relationship.correlation);
    const directionSign = ls.signal.direction === 'up' ? 1 : ls.signal.direction === 'down' ? -1 : 0;
    
    weightedSum += directionSign * ls.expectedMove * weight;
    totalWeight += weight;
  }
  
  const avgExpectedMove = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const direction: 'up' | 'down' | 'neutral' = 
    avgExpectedMove > 0.1 ? 'up' : avgExpectedMove < -0.1 ? 'down' : 'neutral';
  
  // Confidence based on agreement between signals
  const upSignals = leadSignals.filter(s => s.signal.direction === 'up').length;
  const downSignals = leadSignals.filter(s => s.signal.direction === 'down').length;
  const agreement = Math.abs(upSignals - downSignals) / leadSignals.length;
  
  const avgReliability = leadSignals.reduce((sum, s) => sum + s.relationship.reliability, 0) / leadSignals.length;
  const confidence = agreement * avgReliability;
  
  return { direction, confidence, expectedMagnitude: Math.abs(avgExpectedMove) };
}

/**
 * Detect regime based on cross-asset signals
 */
export function detectMarketRegime(
  signals: AssetSignal[]
): 'risk_on' | 'risk_off' | 'neutral' {
  const vixSignal = signals.find(s => s.ticker === 'VIX');
  const btcSignal = signals.find(s => s.ticker === 'BTC');
  const tltSignal = signals.find(s => s.ticker === 'TLT');
  const gldSignal = signals.find(s => s.ticker === 'GLD');
  
  let riskOnScore = 0;
  let riskOffScore = 0;
  
  // VIX down = risk on
  if (vixSignal?.direction === 'down') riskOnScore += 2;
  if (vixSignal?.direction === 'up') riskOffScore += 2;
  
  // BTC up = risk on
  if (btcSignal?.direction === 'up') riskOnScore += 1.5;
  if (btcSignal?.direction === 'down') riskOffScore += 1.5;
  
  // TLT up (bonds rallying) = risk off
  if (tltSignal?.direction === 'up') riskOffScore += 1;
  if (tltSignal?.direction === 'down') riskOnScore += 1;
  
  // GLD up = risk off
  if (gldSignal?.direction === 'up') riskOffScore += 0.5;
  if (gldSignal?.direction === 'down') riskOnScore += 0.5;
  
  if (riskOnScore > riskOffScore + 1) return 'risk_on';
  if (riskOffScore > riskOnScore + 1) return 'risk_off';
  return 'neutral';
}

/**
 * Calculate correlation-adjusted prediction
 */
export function getCorrelationAdjustedPrediction(
  basePrediction: { direction: 'up' | 'down' | 'neutral'; confidence: number; magnitude: number },
  targetTicker: string,
  crossAssetSignals: AssetSignal[]
): { direction: 'up' | 'down' | 'neutral'; confidence: number; magnitude: number; leadingIndicators: string[] } {
  const regime = detectMarketRegime(crossAssetSignals);
  const leadSignals = findLeadSignals(targetTicker, crossAssetSignals, regime);
  const aggregated = aggregateLeadSignals(leadSignals);
  
  // Blend base prediction with cross-asset intelligence
  const blendWeight = 0.7; // 70% base, 30% cross-asset
  
  let { direction, confidence, magnitude } = basePrediction;
  
  // If cross-asset signals strongly disagree, reduce confidence
  if (aggregated.direction !== 'neutral' && aggregated.direction !== direction) {
    confidence *= (1 - aggregated.confidence * 0.5);
    
    // If cross-asset is very confident, flip direction
    if (aggregated.confidence > 0.7) {
      direction = aggregated.direction;
      confidence = aggregated.confidence * 0.6;
      magnitude = aggregated.expectedMagnitude;
    }
  } else if (aggregated.direction === direction) {
    // Agreement boosts confidence
    confidence = Math.min(1, confidence * (1 + aggregated.confidence * 0.3));
    magnitude = (magnitude * blendWeight) + (aggregated.expectedMagnitude * (1 - blendWeight));
  }
  
  const leadingIndicators = leadSignals.map(ls => 
    `${ls.relationship.leader} (${ls.signal.direction}, ${ls.relationship.lagMinutes}m lag)`
  );
  
  return { direction, confidence, magnitude, leadingIndicators };
}
