/**
 * Speedrun Glitch Detector
 * 
 * Wires the Temporal Consciousness Speedrun Adapter to live market signals.
 * Detects "natural glitches" - optimization pathways that exist within the rules
 * but beyond the typical trader's intent.
 * 
 * Based on CEO insight: Just as speedrunners find legitimate shortcuts in games,
 * markets contain natural optimization routes that can be exploited for merited success.
 */

import { 
  temporalConsciousnessSpeedrunAdapter,
  SPEEDRUN_PHILOSOPHY,
  ESPORTS_TEMPORAL_PATTERNS,
  STRUCTURAL_GLITCHES,
  TIME_PERCEPTION_MODIFIERS
} from '../universal/adapters/temporalConsciousnessSpeedrunAdapter';
import type { BigPictureState, MarketTick } from './crossMarket/types';

// ============================================================================
// GLITCH TYPES FOR MARKET EXPLOITATION
// ============================================================================

export interface MarketGlitch {
  type: keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES;
  confidence: number;
  description: string;
  actionable: boolean;
  timeWindow: number; // milliseconds
  riskReward: number;
  signals: string[];
}

export interface SpeedrunState {
  activeGlitches: MarketGlitch[];
  consciousnessResonance: number;
  temporalCompression: number; // How "compressed" market time feels
  glitchDensity: number; // How many opportunities per unit time
  optimalHorizon: string; // fly/squirrel/human/whale perspective
  lastUpdated: Date;
}

// ============================================================================
// DETECTOR CLASS
// ============================================================================

class SpeedrunGlitchDetector {
  private state: SpeedrunState;
  private recentTicks: MarketTick[] = [];
  private maxRecentTicks = 100;
  private isInitialized = false;

  constructor() {
    this.state = this.createInitialState();
  }

  initialize(): void {
    if (this.isInitialized) return;
    temporalConsciousnessSpeedrunAdapter.initialize();
    this.isInitialized = true;
    console.log('[SpeedrunGlitchDetector] Wired to live market signals');
    console.log('[SpeedrunGlitchDetector] Hunting for natural optimization pathways...');
  }

  private createInitialState(): SpeedrunState {
    return {
      activeGlitches: [],
      consciousnessResonance: 0.5,
      temporalCompression: 1.0,
      glitchDensity: 0,
      optimalHorizon: 'HUMAN',
      lastUpdated: new Date()
    };
  }

  /**
   * Process a market tick and detect glitch opportunities
   */
  processTick(tick: MarketTick, bigPictureState: BigPictureState): SpeedrunState {
    if (!this.isInitialized) this.initialize();

    // Track recent ticks
    this.recentTicks.push(tick);
    if (this.recentTicks.length > this.maxRecentTicks) {
      this.recentTicks.shift();
    }

    // Calculate market metrics for glitch detection
    const volatility = this.calculateVolatility();
    const momentum = this.calculateMomentum();
    const volume = this.normalizeVolume(tick.volume || 0);

    // Use the adapter to detect glitch opportunities
    const temporalSignal = temporalConsciousnessSpeedrunAdapter.processTemporalData({
      observerType: 'AI',
      marketData: { volatility, momentum, volume }
    });

    // Convert adapter glitches to actionable market glitches
    const marketGlitches = this.convertToMarketGlitches(
      temporalSignal.glitchOpportunities,
      bigPictureState,
      { volatility, momentum, volume }
    );

    // Determine optimal observation horizon
    const optimalHorizon = this.determineOptimalHorizon(volatility, momentum);

    // Calculate temporal compression (how fast market time feels)
    const temporalCompression = this.calculateTemporalCompression(volatility, bigPictureState);

    // Calculate glitch density
    const glitchDensity = marketGlitches.length / Math.max(this.recentTicks.length, 1);

    this.state = {
      activeGlitches: marketGlitches,
      consciousnessResonance: temporalSignal.consciousnessResonance,
      temporalCompression,
      glitchDensity,
      optimalHorizon,
      lastUpdated: new Date()
    };

    return this.state;
  }

  private calculateVolatility(): number {
    if (this.recentTicks.length < 2) return 0.5;
    
    const prices = this.recentTicks.map(t => t.price);
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-1 range (assuming typical daily vol of 1-5%)
    return Math.min(1, stdDev * 100);
  }

  private calculateMomentum(): number {
    if (this.recentTicks.length < 10) return 0;
    
    const recentPrice = this.recentTicks[this.recentTicks.length - 1].price;
    const olderPrice = this.recentTicks[Math.max(0, this.recentTicks.length - 10)].price;
    
    const change = (recentPrice - olderPrice) / olderPrice;
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, change * 20));
  }

  private normalizeVolume(volume: number): number {
    // Simple normalization - assumes volume is already somewhat normalized
    return Math.min(1, volume / 1000000);
  }

  private convertToMarketGlitches(
    glitchStrings: string[],
    bigPicture: BigPictureState,
    metrics: { volatility: number; momentum: number; volume: number }
  ): MarketGlitch[] {
    return glitchStrings.map(glitchStr => {
      const [type, ...descParts] = glitchStr.split(':');
      const description = descParts.join(':').trim();
      
      const glitchType = type as keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES;
      const category = SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES[glitchType];
      
      // Calculate actionability based on market conditions
      const actionable = this.isGlitchActionable(glitchType, metrics, bigPicture);
      
      // Calculate time window (shorter for higher volatility)
      const baseWindow = 60000; // 1 minute
      const timeWindow = baseWindow / (1 + metrics.volatility * 2);
      
      // Risk/reward based on glitch type
      const riskReward = this.calculateRiskReward(glitchType, metrics);
      
      // Confidence based on signal strength and alignment
      const confidence = this.calculateGlitchConfidence(glitchType, metrics, bigPicture);
      
      return {
        type: glitchType,
        confidence,
        description: category?.market || description,
        actionable,
        timeWindow,
        riskReward,
        signals: bigPicture.activeSignals.map(s => s.type)
      };
    });
  }

  private isGlitchActionable(
    type: keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES,
    metrics: { volatility: number; momentum: number; volume: number },
    bigPicture: BigPictureState
  ): boolean {
    switch (type) {
      case 'SEQUENCE_BREAK':
        // Actionable when momentum and fundamentals diverge
        return Math.abs(metrics.momentum) > 0.5 && bigPicture.trendAlignment < 0.3;
      
      case 'CLIP_THROUGH':
        // Actionable when volatility is high but direction unclear
        return metrics.volatility > 0.6 && Math.abs(metrics.momentum) < 0.3;
      
      case 'CHECKPOINT_SKIP':
        // Actionable when strong trend with volume confirmation
        return Math.abs(metrics.momentum) > 0.7 && metrics.volume > 0.5;
      
      case 'FRAME_PERFECT':
        // Actionable during compression (pre-breakout)
        return metrics.volatility < 0.15 && bigPicture.trendAlignment > 0.7;
      
      case 'WRONG_WARP':
        // Actionable during chaos - high risk, high reward
        return metrics.volatility > 0.8 && Math.abs(bigPicture.marketSentiment) > 0.7;
      
      default:
        return false;
    }
  }

  private calculateRiskReward(
    type: keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES,
    metrics: { volatility: number; momentum: number; volume: number }
  ): number {
    const baseReward: Record<keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES, number> = {
      SEQUENCE_BREAK: 2.5,
      CLIP_THROUGH: 1.8,
      CHECKPOINT_SKIP: 3.0,
      FRAME_PERFECT: 4.0,
      WRONG_WARP: 5.0
    };
    
    const base = baseReward[type] || 2.0;
    // Adjust based on volatility (higher vol = potentially higher reward but more risk)
    return base * (1 + metrics.volatility * 0.5);
  }

  private calculateGlitchConfidence(
    type: keyof typeof SPEEDRUN_PHILOSOPHY.GLITCH_CATEGORIES,
    metrics: { volatility: number; momentum: number; volume: number },
    bigPicture: BigPictureState
  ): number {
    let confidence = 0.5;
    
    // Volume adds confidence
    confidence += metrics.volume * 0.2;
    
    // Strong trend alignment adds confidence
    confidence += bigPicture.trendAlignment * 0.15;
    
    // Type-specific confidence adjustments
    if (type === 'FRAME_PERFECT' && metrics.volatility < 0.1) {
      confidence += 0.2; // Compression patterns are reliable
    }
    
    if (type === 'CHECKPOINT_SKIP' && bigPicture.predictionBoost > 1.2) {
      confidence += 0.15; // Cross-market confirmation
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private determineOptimalHorizon(volatility: number, momentum: number): string {
    // Match market conditions to optimal consciousness type
    if (volatility > 0.8) return 'FLY'; // Need microsecond reactions
    if (volatility > 0.5) return 'SQUIRREL'; // Day trading
    if (Math.abs(momentum) > 0.7) return 'HUMAN'; // Swing trading
    if (volatility < 0.2 && Math.abs(momentum) < 0.2) return 'ELEPHANT'; // Patient capital
    return 'HUMAN'; // Default
  }

  private calculateTemporalCompression(volatility: number, bigPicture: BigPictureState): number {
    // Higher volatility = time feels faster (more events per unit time)
    const volComponent = 1 + volatility * 2;
    
    // More signals = denser time
    const signalComponent = 1 + bigPicture.activeSignals.length * 0.1;
    
    return volComponent * signalComponent;
  }

  getState(): SpeedrunState {
    return { ...this.state };
  }

  getActionableGlitches(): MarketGlitch[] {
    return this.state.activeGlitches.filter(g => g.actionable);
  }

  getHighestConfidenceGlitch(): MarketGlitch | null {
    const actionable = this.getActionableGlitches();
    if (actionable.length === 0) return null;
    return actionable.reduce((best, g) => g.confidence > best.confidence ? g : best);
  }

  /**
   * Get trading recommendation based on detected glitches
   */
  getTradingRecommendation(): {
    action: 'BUY' | 'SELL' | 'WAIT' | 'SCALP';
    confidence: number;
    glitchType: string | null;
    reasoning: string;
    timeframe: string;
  } {
    const bestGlitch = this.getHighestConfidenceGlitch();
    
    if (!bestGlitch) {
      return {
        action: 'WAIT',
        confidence: 0.3,
        glitchType: null,
        reasoning: 'No actionable glitch patterns detected',
        timeframe: 'N/A'
      };
    }

    // Determine action based on glitch type
    let action: 'BUY' | 'SELL' | 'WAIT' | 'SCALP';
    let reasoning: string;
    
    switch (bestGlitch.type) {
      case 'CHECKPOINT_SKIP':
        // Strong trend - follow it
        action = bestGlitch.riskReward > 3 ? 'BUY' : 'SELL';
        reasoning = `Strong momentum detected - checkpoint skip opportunity. R:R ${bestGlitch.riskReward.toFixed(1)}`;
        break;
      
      case 'FRAME_PERFECT':
        // Compression before breakout
        action = 'WAIT';
        reasoning = `Volatility compression - prepare for frame-perfect entry on breakout`;
        break;
      
      case 'CLIP_THROUGH':
        // Scalp the volatility
        action = 'SCALP';
        reasoning = `High volatility, no direction - scalp both sides`;
        break;
      
      case 'WRONG_WARP':
        // Chaos trade
        action = 'BUY';
        reasoning = `Chaos state detected - WRONG_WARP may lead to unexpected gains`;
        break;
      
      default:
        action = 'WAIT';
        reasoning = `Glitch pattern ${bestGlitch.type} detected - analyzing...`;
    }

    return {
      action,
      confidence: bestGlitch.confidence,
      glitchType: bestGlitch.type,
      reasoning,
      timeframe: `${Math.round(bestGlitch.timeWindow / 1000)}s window`
    };
  }
}

// Export singleton
export const speedrunGlitchDetector = new SpeedrunGlitchDetector();
// Types already exported above via interfaces
