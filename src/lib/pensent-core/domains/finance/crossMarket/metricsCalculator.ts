/**
 * Big Picture Metrics Calculator
 */

import { MarketTick, BigPictureState, AssetClass } from './types';
import { calculateTrend, calculateVolatility } from './signalDetector';

export function calculateMetrics(
  tickHistory: Map<AssetClass, MarketTick[]>,
  currentState: BigPictureState
): Partial<BigPictureState> {
  const equity = tickHistory.get('equity') || [];
  const bond = tickHistory.get('bond') || [];
  const commodity = tickHistory.get('commodity') || [];
  const crypto = tickHistory.get('crypto') || [];

  // Market sentiment: weighted average of trends
  const trends = [
    { weight: 0.4, trend: calculateTrend(equity.slice(-20)) },
    { weight: 0.2, trend: calculateTrend(commodity.slice(-20)) },
    { weight: 0.2, trend: calculateTrend(crypto.slice(-20)) },
    { weight: 0.2, trend: -calculateTrend(bond.slice(-20)) }
  ];

  const marketSentiment = trends.reduce((sum, t) => sum + t.weight * t.trend, 0);

  // Volatility index
  const vols = [
    calculateVolatility(equity.slice(-20)),
    calculateVolatility(bond.slice(-20)),
    calculateVolatility(commodity.slice(-20))
  ].filter(v => v > 0);

  const volatilityIndex = vols.length > 0 
    ? Math.min(100, vols.reduce((a, b) => a + b, 0) / vols.length * 500)
    : 20;

  // Risk appetite
  const riskAppetite = calculateTrend(equity.slice(-10)) - calculateTrend(bond.slice(-10));

  // Trend alignment
  const allTrends = [
    calculateTrend(equity.slice(-10)),
    calculateTrend(commodity.slice(-10)),
    calculateTrend(crypto.slice(-10))
  ].filter(t => !isNaN(t));

  let trendAlignment = 0.5;
  if (allTrends.length >= 2) {
    const avgTrend = allTrends.reduce((a, b) => a + b, 0) / allTrends.length;
    const variance = allTrends.reduce((sum, t) => sum + Math.pow(t - avgTrend, 2), 0) / allTrends.length;
    trendAlignment = Math.max(0, 1 - variance);
  }

  return {
    marketSentiment,
    volatilityIndex,
    riskAppetite,
    trendAlignment
  };
}

export function calculatePredictionBoost(state: BigPictureState): number {
  let boost = 1.0;

  // High alignment increases confidence
  boost += state.trendAlignment * 0.2;

  // Strong signals increase confidence
  const strongSignals = state.activeSignals.filter(s => s.strength > 0.5);
  boost += strongSignals.length * 0.05;

  // High correlation strength increases confidence
  const avgCorrelationStrength = state.correlations.length > 0
    ? state.correlations.reduce((sum, c) => sum + c.strength, 0) / state.correlations.length
    : 0;
  boost += avgCorrelationStrength * 0.15;

  // Extreme volatility reduces confidence
  if (state.volatilityIndex > 50) {
    boost -= (state.volatilityIndex - 50) / 100;
  }

  return Math.max(0.5, Math.min(1.5, boost));
}
