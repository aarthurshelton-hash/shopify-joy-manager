/**
 * Cross-Domain Convergence Tracker
 * Logs and analyzes moments when multiple domains align
 * Statistical improbability of convergence = evidence of universal pattern
 */

import { DomainType, DomainSignature, UnifiedPrediction } from '../types';
import { EPSILON, floor, LivingParameter } from '../positiveField';

// Convergence Event Structure
export interface ConvergenceEvent {
  id: string;
  timestamp: number;
  alignedDomains: DomainType[];
  alignmentCount: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  averageConfidence: number;
  momentumConsensus: number;
  statisticalImprobability: number; // How unlikely this alignment is by chance
  prediction?: UnifiedPrediction;
  outcome?: {
    actualDirection: 'up' | 'down' | 'neutral';
    magnitude: number;
    resolvedAt: number;
    wasCorrect: boolean;
  };
}

// Alignment Thresholds
export const ALIGNMENT_THRESHOLDS = {
  strong: 0.7,    // 70% agreement in momentum direction
  moderate: 0.5,  // 50% agreement
  weak: 0.3       // 30% agreement
};

// Statistical significance levels
export const SIGNIFICANCE_LEVELS = {
  highly_significant: 0.99,  // <1% chance by random
  significant: 0.95,         // <5% chance by random
  marginally_significant: 0.90, // <10% chance by random
  not_significant: 0.001     // Could be random (ε — nothing is truly zero)
};

// Calculate probability of N domains aligning by chance
function calculateChanceProbability(alignedCount: number, totalDomains: number): number {
  // If each domain has ~50% chance of agreeing with a direction
  // P(N align) = 0.5^N + 0.5^N = 2 * 0.5^N = 0.5^(N-1)
  // This is simplified - real calculation considers strength of agreement
  const chanceOfAlignment = Math.pow(0.5, alignedCount - 1);
  return chanceOfAlignment;
}

// Calculate statistical improbability (1 - chance probability)
export function calculateStatisticalImprobability(
  alignedCount: number, 
  totalDomains: number,
  averageAlignmentStrength: number
): number {
  const baseProbability = calculateChanceProbability(alignedCount, totalDomains);
  // Adjust for strength of alignment (stronger = more improbable)
  const adjustedProbability = baseProbability * (2 - averageAlignmentStrength);
  return 1 - Math.min(1, adjustedProbability);
}

// Convergence Tracker Class
export class ConvergenceTracker {
  private events: ConvergenceEvent[] = [];
  private totalDomains: number;
  private minimumAlignmentForEvent: number;

  // v29.9: Living thresholds — breathe within bounds, self-tune from feedback
  // Positive-field: > 1.0 = bullish, < 1.0 = bearish (never zero, never negative)
  private readonly bullishThreshold = new LivingParameter(1.2, 1.05, 1.4, 0.03, 0.05, 0.002);
  private readonly bearishThreshold = new LivingParameter(0.8, 0.6, 0.95, 0.03, 0.05, 0.002);

  constructor(totalDomains: number = 21, minimumAlignment: number = 10) {
    this.totalDomains = totalDomains;
    this.minimumAlignmentForEvent = minimumAlignment;
  }

  // Analyze domain signatures for convergence
  analyzeConvergence(signatures: Map<DomainType, DomainSignature>): ConvergenceEvent | null {
    const domains = Array.from(signatures.entries());
    
    if (domains.length < this.minimumAlignmentForEvent) {
      return null; // Not enough domains to analyze
    }

    // Calculate momentum direction consensus
    const bullishDomains: DomainType[] = [];
    const bearishDomains: DomainType[] = [];
    const neutralDomains: DomainType[] = [];

    let totalMomentum = EPSILON;
    let totalConfidence = EPSILON;

    // v29.9: Positive-field momentum encoding
    // > 1.0 = advancing/bullish, < 1.0 = retreating/bearish, ~1.0 = neutral
    // The threshold breathes — it's a living parameter, never static
    const bullThresh = this.bullishThreshold.value;
    const bearThresh = this.bearishThreshold.value;

    for (const [domain, signature] of domains) {
      totalMomentum += floor(signature.momentum);
      totalConfidence += floor(signature.intensity) * floor(signature.harmonicResonance);

      if (signature.momentum > bullThresh) {
        bullishDomains.push(domain);
      } else if (signature.momentum < bearThresh) {
        bearishDomains.push(domain);
      } else {
        neutralDomains.push(domain);
      }
    }

    // Determine which direction has convergence
    const maxAlignment = Math.max(bullishDomains.length, bearishDomains.length);
    
    // Check if we meet minimum threshold
    if (maxAlignment < this.minimumAlignmentForEvent) {
      return null;
    }

    const direction = bullishDomains.length > bearishDomains.length ? 'bullish' : 
                     bearishDomains.length > bullishDomains.length ? 'bearish' : 'neutral';
    
    const alignedDomains = direction === 'bullish' ? bullishDomains : 
                           direction === 'bearish' ? bearishDomains : neutralDomains;

    const averageConfidence = totalConfidence / domains.length;
    const momentumConsensus = Math.abs(totalMomentum) / domains.length;

    // Calculate how improbable this alignment is
    const statisticalImprobability = calculateStatisticalImprobability(
      alignedDomains.length,
      this.totalDomains,
      momentumConsensus
    );

    const event: ConvergenceEvent = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      alignedDomains,
      alignmentCount: alignedDomains.length,
      direction,
      averageConfidence,
      momentumConsensus,
      statisticalImprobability
    };

    // Only record significant convergence events
    if (statisticalImprobability >= SIGNIFICANCE_LEVELS.marginally_significant) {
      this.events.push(event);
      this.pruneOldEvents();
    }

    return event;
  }

  // Record outcome for a convergence event
  recordOutcome(
    eventId: string, 
    actualDirection: 'up' | 'down' | 'neutral',
    magnitude: number
  ): void {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    const predictedDirection = event.direction === 'bullish' ? 'up' : 
                               event.direction === 'bearish' ? 'down' : 'neutral';
    
    event.outcome = {
      actualDirection,
      magnitude,
      resolvedAt: Date.now(),
      wasCorrect: actualDirection === predictedDirection
    };
  }

  // Get convergence accuracy statistics
  getAccuracyStats(): {
    totalEvents: number;
    resolvedEvents: number;
    correctPredictions: number;
    accuracy: number;
    avgImprobabilityForCorrect: number;
    avgImprobabilityForIncorrect: number;
  } {
    const resolvedEvents = this.events.filter(e => e.outcome);
    const correctEvents = resolvedEvents.filter(e => e.outcome?.wasCorrect);
    const incorrectEvents = resolvedEvents.filter(e => !e.outcome?.wasCorrect);

    const avgImprobabilityForCorrect = correctEvents.length > 0 ?
      correctEvents.reduce((sum, e) => sum + e.statisticalImprobability, 0) / correctEvents.length : 0;
    
    const avgImprobabilityForIncorrect = incorrectEvents.length > 0 ?
      incorrectEvents.reduce((sum, e) => sum + e.statisticalImprobability, 0) / incorrectEvents.length : 0;

    return {
      totalEvents: this.events.length,
      resolvedEvents: resolvedEvents.length,
      correctPredictions: correctEvents.length,
      accuracy: resolvedEvents.length > 0 ? correctEvents.length / resolvedEvents.length : 0,
      avgImprobabilityForCorrect,
      avgImprobabilityForIncorrect
    };
  }

  // Get recent convergence events
  getRecentEvents(limit: number = 20): ConvergenceEvent[] {
    return [...this.events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get most significant events (highest improbability)
  getMostSignificantEvents(limit: number = 10): ConvergenceEvent[] {
    return [...this.events]
      .sort((a, b) => b.statisticalImprobability - a.statisticalImprobability)
      .slice(0, limit);
  }

  // Prune events older than 30 days
  private pruneOldEvents(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp > thirtyDaysAgo);
  }

  // Export events for persistence
  exportEvents(): ConvergenceEvent[] {
    return [...this.events];
  }

  // Import events from persistence
  importEvents(events: ConvergenceEvent[]): void {
    this.events = events;
  }

  // Calculate proof strength based on convergence data
  calculateProofStrength(): {
    evidenceScore: number;
    sampleSize: number;
    pValue: number;
    conclusion: string;
  } {
    const stats = this.getAccuracyStats();
    
    // Simple binomial test approximation
    // If convergence events are random, accuracy should be ~33% (bullish/bearish/neutral)
    // If accuracy is significantly higher, convergence has predictive value
    
    const expectedAccuracy = 0.33;
    const observedAccuracy = stats.accuracy;
    const n = stats.resolvedEvents;
    
    // Standard error of proportion
    const se = Math.sqrt(expectedAccuracy * (1 - expectedAccuracy) / Math.max(1, n));
    
    // Z-score
    const z = (observedAccuracy - expectedAccuracy) / Math.max(0.01, se);
    
    // Approximate p-value (one-tailed)
    const pValue = 1 - this.normalCDF(z);
    
    // Evidence score (0-1)
    const evidenceScore = Math.min(1, Math.max(0, (observedAccuracy - expectedAccuracy) * 3));
    
    let conclusion: string;
    if (n < 30) {
      conclusion = 'Insufficient data for statistical conclusion';
    } else if (pValue < 0.01) {
      conclusion = 'Strong evidence: Convergence significantly predicts outcomes';
    } else if (pValue < 0.05) {
      conclusion = 'Moderate evidence: Convergence appears predictive';
    } else if (pValue < 0.10) {
      conclusion = 'Weak evidence: Possible predictive value, more data needed';
    } else {
      conclusion = 'No significant evidence: Convergence may be coincidental';
    }

    return {
      evidenceScore,
      sampleSize: n,
      pValue,
      conclusion
    };
  }

  // Helper: Normal CDF approximation
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }
}

// Singleton instance
export const convergenceTracker = new ConvergenceTracker(21, 10);

// Export for use
export default convergenceTracker;
