/**
 * Universal Options Integration - Full 27-Domain + Scientific Foundation + Greeks-Chess
 * 
 * Connects Options Prediction to En Pensent™ Universal Intelligence:
 * - 27 Domain Adapters 
 * - Scientific Formulations (Shannon, Hurst, Lyapunov, Kuramoto)
 * - Cross-Domain Engine
 * - Speedrun Glitch Detection
 * - Consciousness Resonance
 * - Greeks ↔ Chess Constraints Mapping (Δ,Γ,Θ,ν,ρ)
 * 
 * @version 8.1-GREEKS-CHESS
 */

import { crossDomainEngine } from '../universal/crossDomainEngine';
import { unifiedSynchronizer } from '../universal/unifiedSynchronizer';
import { speedrunGlitchDetector } from '../finance/speedrunGlitchDetector';
import { consciousnessResonanceDetector } from '../finance/consciousnessResonanceDetector';
import {
  shannonEntropy,
  hurstExponent,
  lyapunovExponent,
  fractalDimension,
  FUNDAMENTAL_CONSTANTS,
} from '../universal/modules/scientificFormulations';
import { greeksChessAdapter, type GreeksChessMapping } from './greeksChessAdapter';

export interface UniversalOptionsContext {
  domainConsensus: {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    confirmingDomains: number;
    leadingDomain: string;
  };
  scientificMetrics: {
    hurstExponent: number;
    lyapunovExponent: number;
    shannonEntropy: number;
    fractalDimension: number;
    goldenRatioAlignment: number;
  };
  glitchState: {
    hasGlitch: boolean;
    glitchType: string | null;
    recommendation: string;
  };
  resonanceState: {
    synchronization: number;
    mood: string;
  };
  greeksChessMapping: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    chessAnalogy: string;
    strategicInsight: string;
    preferredStrategy: string;
  };
  universalConfidence: number;
  universalDirection: 'bullish' | 'bearish' | 'neutral';
  truthScore: number;
}

export interface EnhancedOptionsPrediction {
  baseConfidence: number;
  universalBoost: number;
  finalConfidence: number;
  reasoning: string[];
  universalContext: UniversalOptionsContext;
}

class UniversalOptionsIntegration {
  private priceHistory: number[] = [];
  private momentumHistory: number[] = [];
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('[UniversalOptionsIntegration] 🌌 Initializing 27-domain universal intelligence...');
    await unifiedSynchronizer.initialize();
    speedrunGlitchDetector.initialize();
    this.isInitialized = true;
    console.log('[UniversalOptionsIntegration] ✅ Full universal integration active');
  }
  
  getUniversalContext(underlying: string, currentPrice: number, momentum: number, volatility: number, volume: number): UniversalOptionsContext {
    this.priceHistory.push(currentPrice);
    if (this.priceHistory.length > 200) this.priceHistory.shift();
    this.momentumHistory.push(momentum);
    if (this.momentumHistory.length > 100) this.momentumHistory.shift();
    
    // Process through 27 domains
    const direction = momentum > 0 ? 1 : momentum < 0 ? -1 : 0;
    crossDomainEngine.processMarketSignal(momentum, volatility, volume, direction, currentPrice);
    const unifiedPrediction = crossDomainEngine.generateUnifiedPrediction(underlying);
    const domainRankings = crossDomainEngine.getDomainRankings();
    
    // Count confirming domains
    let confirmingDomains = 0;
    for (const contrib of unifiedPrediction.contributingDomains) {
      if ((unifiedPrediction.direction === 'up' && contrib.signal === 'bullish') ||
          (unifiedPrediction.direction === 'down' && contrib.signal === 'bearish')) {
        confirmingDomains++;
      }
    }
    
    // Scientific metrics
    const calcHurst = this.priceHistory.length >= 20 ? hurstExponent(this.priceHistory.slice(-50)) : 0.5;
    const calcLyapunov = this.priceHistory.length >= 15 ? lyapunovExponent(this.priceHistory.slice(-30)) : 0;
    const momentumBins = this.binMomentum();
    const calcEntropy = shannonEntropy(momentumBins);
    const calcFractal = this.priceHistory.length >= 10 ? fractalDimension(this.priceHistory.slice(-50)) : 1.5;
    const goldenRatioAlignment = this.calculateGoldenRatioAlignment(this.priceHistory.slice(-10));
    
    // Glitch detection
    const glitches = speedrunGlitchDetector.getActionableGlitches();
    const glitchRec = speedrunGlitchDetector.getTradingRecommendation();
    
    // Resonance
    const resonanceState = consciousnessResonanceDetector.getState();
    const resonanceRec = consciousnessResonanceDetector.getTradingRecommendation();
    
    // Greeks-Chess Mapping - derive Greeks from market conditions
    const impliedDelta = momentum > 0 ? Math.min(0.9, momentum * 2) : Math.max(-0.9, momentum * 2);
    const impliedGamma = Math.min(1, volatility * 3); // High vol = high gamma
    const impliedTheta = 0.6; // Default to weekly-equivalent decay
    const impliedVega = Math.min(1, volatility * 2.5);
    const impliedRho = calcHurst > 0.6 ? 0.7 : 0.3; // Trending = long-term factors matter
    
    const chessInsight = greeksChessAdapter.getChessInsightFromMarketGreeks(
      impliedDelta, impliedGamma, impliedTheta, impliedVega, impliedRho
    );
    
    const greeksMapping = greeksChessAdapter.generateMapping({
      timeControl: impliedTheta > 0.8 ? 'bullet' : impliedTheta > 0.6 ? 'blitz' : impliedTheta > 0.3 ? 'rapid' : 'classical',
      materialBalance: Math.round(impliedDelta * 15),
      tacticalSharpness: impliedGamma,
      pieceActivity: impliedVega,
      pawnStructure: impliedRho,
      kingSafety: 1 - impliedGamma * 0.4,
    });
    
    // Final synthesis
    const universalDirection = unifiedPrediction.direction === 'up' ? 'bullish' : unifiedPrediction.direction === 'down' ? 'bearish' : 'neutral';
    const universalConfidence = Math.min(0.95, unifiedPrediction.confidence * 0.85 + greeksMapping.confidenceBoost);
    
    return {
      domainConsensus: {
        direction: universalDirection,
        strength: unifiedPrediction.consensusStrength,
        confirmingDomains,
        leadingDomain: domainRankings[0]?.domain || 'market',
      },
      scientificMetrics: { hurstExponent: calcHurst, lyapunovExponent: calcLyapunov, shannonEntropy: calcEntropy, fractalDimension: calcFractal, goldenRatioAlignment },
      glitchState: { hasGlitch: glitches.length > 0, glitchType: glitches[0]?.type || null, recommendation: glitchRec.reasoning },
      resonanceState: { synchronization: resonanceState.globalSynchronization, mood: resonanceRec.mood },
      greeksChessMapping: {
        delta: impliedDelta,
        gamma: impliedGamma,
        theta: impliedTheta,
        vega: impliedVega,
        rho: impliedRho,
        chessAnalogy: chessInsight.chessAnalogy,
        strategicInsight: chessInsight.strategicInsight,
        preferredStrategy: greeksMapping.optionsImplication.preferredStrategy,
      },
      universalConfidence,
      universalDirection,
      truthScore: unifiedPrediction.harmonicAlignment,
    };
  }
  
  enhancePrediction(baseConfidence: number, direction: 'bullish' | 'bearish' | 'neutral', underlying: string, currentPrice: number, momentum: number, volatility: number, volume: number): EnhancedOptionsPrediction {
    const context = this.getUniversalContext(underlying, currentPrice, momentum, volatility, volume);
    const reasoning: string[] = [];
    let boost = 0;
    
    if (context.domainConsensus.direction === direction && context.domainConsensus.confirmingDomains >= 15) {
      boost += 0.10;
      reasoning.push(`✅ ${context.domainConsensus.confirmingDomains}/27 domains confirm ${direction}`);
    }
    if (context.scientificMetrics.hurstExponent > 0.6) {
      boost += 0.05;
      reasoning.push(`📈 Hurst H=${context.scientificMetrics.hurstExponent.toFixed(2)} trending`);
    }
    if (context.glitchState.hasGlitch) {
      boost += 0.08;
      reasoning.push(`⚡ ${context.glitchState.glitchType} glitch exploitable`);
    }
    if (reasoning.length === 0) reasoning.push(`📊 Standard analysis`);
    
    return { baseConfidence, universalBoost: boost, finalConfidence: Math.min(0.95, baseConfidence + boost * 0.85), reasoning, universalContext: context };
  }
  
  private binMomentum(): number[] {
    if (this.momentumHistory.length < 10) return [0.5, 0.5];
    const bins = [0, 0, 0, 0, 0];
    for (const m of this.momentumHistory) {
      if (m < -0.5) bins[0]++; else if (m < -0.1) bins[1]++; else if (m < 0.1) bins[2]++; else if (m < 0.5) bins[3]++; else bins[4]++;
    }
    return bins.map(b => b / this.momentumHistory.length);
  }
  
  private calculateGoldenRatioAlignment(prices: number[]): number {
    if (prices.length < 3) return 0.5;
    let score = 0, count = 0;
    for (let i = 2; i < prices.length; i++) {
      const a = prices[i] - prices[i - 1], b = prices[i - 1] - prices[i - 2];
      if (Math.abs(b) > 0.001) { score += Math.max(0, 1 - Math.min(Math.abs(Math.abs(a / b) - FUNDAMENTAL_CONSTANTS.PHI), Math.abs(Math.abs(a / b) - 1 / FUNDAMENTAL_CONSTANTS.PHI))); count++; }
    }
    return count > 0 ? score / count : 0.5;
  }
  
  getSystemSummary() { return { initialized: this.isInitialized, ...unifiedSynchronizer.getSystemSummary() }; }
}

export const universalOptionsIntegration = new UniversalOptionsIntegration();
export { greeksChessAdapter };
console.log('[v8.1-GREEKS-CHESS] 27 Domains + Greeks↔Chess Adapter LOADED');
