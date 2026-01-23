/**
 * Market Accuracy Enhancement Suite - v7.53-ACCURACY
 * 
 * Unified exports for all market prediction accuracy improvements.
 */

// Intraday Seasonality
export {
  type MarketSession,
  type SessionCharacteristics,
  type DayOfWeek,
  type DayEffect,
  SESSION_PROFILES,
  DAY_EFFECTS,
  getCurrentSession,
  getDayEffect,
  getSeasonalityAdjustment,
  getOptimalTradingWindows,
  shouldAvoidTrading,
} from './intradaySeasonality';

// Cross-Asset Correlation
export {
  type AssetClass,
  type LeadLagRelationship,
  type AssetSignal,
  LEAD_LAG_RELATIONSHIPS,
  findLeadSignals,
  aggregateLeadSignals,
  detectMarketRegime,
  getCorrelationAdjustedPrediction,
} from './crossAssetCorrelation';

// Options Flow Integration
export {
  type OptionType,
  type FlowType,
  type OptionsFlow,
  type FlowSignal,
  FLOW_THRESHOLDS,
  analyzeOptionsFlow,
  detectSmartMoneyFlow,
  integrateOptionsFlowPrediction,
} from './optionsFlowIntegration';

// Sentiment Divergence
export {
  type SentimentData,
  type PriceData,
  type DivergenceSignal,
  aggregateSentiment,
  detectDivergence,
  detectExtremeSentiment,
  integrateDivergencePrediction,
} from './sentimentDivergence';

// Fractal Time Scaling
export {
  type Timeframe,
  type TimeframeSignal,
  type ConfluenceResult,
  TIMEFRAME_WEIGHTS,
  calculateConfluence,
  detectFractalRepetition,
  getOptimalTimeframe,
  integrateMultiTimeframePrediction,
} from './fractalTimeScaling';
