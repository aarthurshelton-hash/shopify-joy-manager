/**
 * Cross-Market Correlation Engine
 * Refactored into modular components with Speedrun Glitch Detection
 * and Consciousness Resonance integration
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
import { speedrunGlitchDetector, SpeedrunState, MarketGlitch } from './speedrunGlitchDetector';
import { consciousnessResonanceDetector, ResonanceState } from './consciousnessResonanceDetector';

// Extended state including new detectors
export interface EnhancedBigPictureState extends BigPictureState {
  speedrunState?: SpeedrunState;
  resonanceState?: ResonanceState;
  actionableGlitches?: MarketGlitch[];
  tradingRecommendation?: {
    speedrun: ReturnType<typeof speedrunGlitchDetector.getTradingRecommendation>;
    resonance: ReturnType<typeof consciousnessResonanceDetector.getTradingRecommendation>;
    combined: {
      action: 'BUY' | 'SELL' | 'WAIT' | 'SCALP' | 'HEDGE';
      confidence: number;
      reasoning: string;
    };
  };
}

class CrossMarketEngine {
  private tickHistory: Map<AssetClass, MarketTick[]> = new Map();
  private maxHistory = 500;
  private state: EnhancedBigPictureState;

  constructor() {
    this.state = this.createInitialState();
    
    const assetClasses: AssetClass[] = ['equity', 'bond', 'future', 'commodity', 'forex', 'crypto'];
    assetClasses.forEach(ac => this.tickHistory.set(ac, []));
    
    // Initialize speedrun detector
    speedrunGlitchDetector.initialize();
  }

  private createInitialState(): EnhancedBigPictureState {
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

  processTick(tick: MarketTick): EnhancedBigPictureState {
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

    // Process through Speedrun Glitch Detector
    this.state.speedrunState = speedrunGlitchDetector.processTick(tick, this.state);
    this.state.actionableGlitches = speedrunGlitchDetector.getActionableGlitches();

    // Process through Consciousness Resonance Detector
    this.state.resonanceState = consciousnessResonanceDetector.processTick(tick, this.state);

    // Get combined trading recommendations
    const speedrunRec = speedrunGlitchDetector.getTradingRecommendation();
    const resonanceRec = consciousnessResonanceDetector.getTradingRecommendation();
    
    this.state.tradingRecommendation = {
      speedrun: speedrunRec,
      resonance: resonanceRec,
      combined: this.combineTradingRecommendations(speedrunRec, resonanceRec)
    };

    return this.state;
  }

  private combineTradingRecommendations(
    speedrun: ReturnType<typeof speedrunGlitchDetector.getTradingRecommendation>,
    resonance: ReturnType<typeof consciousnessResonanceDetector.getTradingRecommendation>
  ): { action: 'BUY' | 'SELL' | 'WAIT' | 'SCALP' | 'HEDGE'; confidence: number; reasoning: string } {
    // If both agree on direction with high confidence
    if (speedrun.action === resonance.action && speedrun.confidence > 0.6 && resonance.confidence > 0.6) {
      return {
        action: speedrun.action as 'BUY' | 'SELL' | 'WAIT' | 'SCALP' | 'HEDGE',
        confidence: (speedrun.confidence + resonance.confidence) / 2 + 0.1,
        reasoning: `ALIGNED: Speedrun (${speedrun.glitchType || 'none'}) + Resonance (${resonance.mood}) both signal ${speedrun.action}`
      };
    }

    // If one has much higher confidence
    if (speedrun.confidence > resonance.confidence + 0.2) {
      return {
        action: speedrun.action as 'BUY' | 'SELL' | 'WAIT' | 'SCALP' | 'HEDGE',
        confidence: speedrun.confidence,
        reasoning: `SPEEDRUN DOMINANT: ${speedrun.reasoning}`
      };
    }

    if (resonance.confidence > speedrun.confidence + 0.2) {
      return {
        action: resonance.action as 'BUY' | 'SELL' | 'WAIT' | 'SCALP' | 'HEDGE',
        confidence: resonance.confidence,
        reasoning: `RESONANCE DOMINANT: ${resonance.reasoning}`
      };
    }

    // Conflicting signals - hedge or wait
    if (speedrun.action !== resonance.action && speedrun.action !== 'WAIT' && resonance.action !== 'WAIT') {
      return {
        action: 'HEDGE',
        confidence: 0.5,
        reasoning: `CONFLICTING: Speedrun says ${speedrun.action}, Resonance says ${resonance.action}. Hedge recommended.`
      };
    }

    return {
      action: 'WAIT',
      confidence: 0.4,
      reasoning: 'No strong consensus between Speedrun and Resonance detectors.'
    };
  }

  getState(): EnhancedBigPictureState {
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
