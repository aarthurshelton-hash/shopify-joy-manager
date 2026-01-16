/**
 * Cross-Market Correlation Engine
 * Refactored into modular components
 */

export * from './crossMarket/types';

import { 
  AssetClass, 
  MarketTick, 
  BigPictureState, 
  MarketSnapshot 
} from './crossMarket/types';
import { updateCorrelations } from './crossMarket/correlationCalculator';
import { detectSignals } from './crossMarket/signalDetector';
import { calculateMetrics, calculatePredictionBoost } from './crossMarket/metricsCalculator';

class CrossMarketEngine {
  private tickHistory: Map<AssetClass, MarketTick[]> = new Map();
  private maxHistory = 500;
  private state: BigPictureState;

  constructor() {
    this.state = this.createInitialState();
    
    const assetClasses: AssetClass[] = ['equity', 'bond', 'future', 'commodity', 'forex', 'crypto'];
    assetClasses.forEach(ac => this.tickHistory.set(ac, []));
  }

  private createInitialState(): BigPictureState {
    return {
      correlations: [],
      activeSignals: [],
      marketSentiment: 0,
      volatilityIndex: 20,
      riskAppetite: 0,
      trendAlignment: 0.5,
      predictionBoost: 1.0
    };
  }

  processTick(tick: MarketTick): BigPictureState {
    // Store tick
    const history = this.tickHistory.get(tick.assetClass) || [];
    history.push(tick);
    if (history.length > this.maxHistory) {
      history.shift();
    }
    this.tickHistory.set(tick.assetClass, history);

    // Update correlations
    this.state.correlations = updateCorrelations(this.tickHistory);

    // Detect cross-market signals
    this.state.activeSignals = detectSignals(this.tickHistory, this.state.activeSignals);

    // Calculate big picture metrics
    const metrics = calculateMetrics(this.tickHistory, this.state);
    Object.assign(this.state, metrics);

    // Calculate prediction boost
    this.state.predictionBoost = calculatePredictionBoost(this.state);

    return this.state;
  }

  getState(): BigPictureState {
    return { ...this.state };
  }

  getSnapshot(): MarketSnapshot {
    const getLatest = (ac: AssetClass): MarketTick | null => {
      const history = this.tickHistory.get(ac) || [];
      return history.length > 0 ? history[history.length - 1] : null;
    };

    return {
      equity: getLatest('equity'),
      bond: getLatest('bond'),
      future: getLatest('future'),
      commodity: getLatest('commodity'),
      forex: getLatest('forex'),
      crypto: getLatest('crypto')
    };
  }
}

export const crossMarketEngine = new CrossMarketEngine();
