/**
 * Entropy Flow Detector
 * 
 * Tracks information entropy across domains to detect
 * order emerging from chaos and vice versa.
 * High entropy = uncertainty/chaos, Low entropy = order/predictability
 */

import type { DomainType } from '../types';

interface EntropySnapshot {
  domain: DomainType;
  entropy: number;
  timestamp: number;
}

interface EntropyFlow {
  fromDomain: DomainType;
  toDomain: DomainType;
  entropyDelta: number;
  flowDirection: 'order_emerging' | 'chaos_increasing' | 'stable';
  confidence: number;
}

interface SystemEntropyState {
  totalEntropy: number;
  entropyTrend: 'increasing' | 'decreasing' | 'stable';
  orderEmergingDomains: DomainType[];
  chaosIncreasingDomains: DomainType[];
  predictionWindow: 'favorable' | 'unfavorable' | 'neutral';
}

class EntropyFlowDetector {
  private entropyHistory: Map<DomainType, EntropySnapshot[]> = new Map();
  private readonly maxHistorySize = 100;
  private readonly entropyDecayFactor = 0.95; // Prevents overfitting to recent data
  
  /**
   * Calculate Shannon entropy from a distribution of values
   */
  private calculateEntropy(values: number[]): number {
    if (values.length === 0) return 1; // Maximum uncertainty
    
    // Normalize to probabilities
    const sum = values.reduce((a, b) => a + Math.abs(b), 0);
    if (sum === 0) return 1;
    
    const probabilities = values.map(v => Math.abs(v) / sum);
    
    // Shannon entropy: -Σ p(x) * log2(p(x))
    let entropy = 0;
    for (const p of probabilities) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    // Normalize to 0-1 range
    const maxEntropy = Math.log2(values.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }
  
  /**
   * Record entropy for a domain based on its recent signal values
   */
  recordDomainEntropy(domain: DomainType, signalValues: number[]): void {
    const entropy = this.calculateEntropy(signalValues);
    
    if (!this.entropyHistory.has(domain)) {
      this.entropyHistory.set(domain, []);
    }
    
    const history = this.entropyHistory.get(domain)!;
    history.push({
      domain,
      entropy,
      timestamp: Date.now(),
    });
    
    // Prune old entries
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }
  
  /**
   * Detect entropy flow between domains
   */
  detectEntropyFlows(): EntropyFlow[] {
    const flows: EntropyFlow[] = [];
    const domains = Array.from(this.entropyHistory.keys());
    
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const domainA = domains[i];
        const domainB = domains[j];
        
        const historyA = this.entropyHistory.get(domainA) || [];
        const historyB = this.entropyHistory.get(domainB) || [];
        
        if (historyA.length < 5 || historyB.length < 5) continue;
        
        // Calculate entropy trends
        const recentA = historyA.slice(-10);
        const recentB = historyB.slice(-10);
        
        const trendA = this.calculateTrend(recentA.map(s => s.entropy));
        const trendB = this.calculateTrend(recentB.map(s => s.entropy));
        
        // Detect inverse relationships (order in one = chaos in other)
        if (Math.sign(trendA) !== Math.sign(trendB) && Math.abs(trendA - trendB) > 0.1) {
          const entropyDelta = trendA - trendB;
          
          flows.push({
            fromDomain: trendA > 0 ? domainA : domainB,
            toDomain: trendA > 0 ? domainB : domainA,
            entropyDelta: Math.abs(entropyDelta),
            flowDirection: trendA < 0 ? 'order_emerging' : 'chaos_increasing',
            confidence: Math.min(0.9, Math.abs(entropyDelta) * this.entropyDecayFactor),
          });
        }
      }
    }
    
    return flows;
  }
  
  /**
   * Get overall system entropy state
   */
  getSystemEntropyState(): SystemEntropyState {
    const domains = Array.from(this.entropyHistory.keys());
    const orderEmergingDomains: DomainType[] = [];
    const chaosIncreasingDomains: DomainType[] = [];
    
    let totalEntropy = 0;
    let entropyTrendSum = 0;
    
    for (const domain of domains) {
      const history = this.entropyHistory.get(domain) || [];
      if (history.length < 3) continue;
      
      const recent = history.slice(-10);
      const avgEntropy = recent.reduce((sum, s) => sum + s.entropy, 0) / recent.length;
      const trend = this.calculateTrend(recent.map(s => s.entropy));
      
      totalEntropy += avgEntropy;
      entropyTrendSum += trend;
      
      if (trend < -0.05) {
        orderEmergingDomains.push(domain);
      } else if (trend > 0.05) {
        chaosIncreasingDomains.push(domain);
      }
    }
    
    const avgTrend = domains.length > 0 ? entropyTrendSum / domains.length : 0;
    
    // Determine prediction window
    let predictionWindow: 'favorable' | 'unfavorable' | 'neutral' = 'neutral';
    if (orderEmergingDomains.length > chaosIncreasingDomains.length * 2) {
      predictionWindow = 'favorable'; // More order = more predictable
    } else if (chaosIncreasingDomains.length > orderEmergingDomains.length * 2) {
      predictionWindow = 'unfavorable'; // More chaos = less predictable
    }
    
    return {
      totalEntropy: domains.length > 0 ? totalEntropy / domains.length : 0.5,
      entropyTrend: avgTrend < -0.02 ? 'decreasing' : avgTrend > 0.02 ? 'increasing' : 'stable',
      orderEmergingDomains,
      chaosIncreasingDomains,
      predictionWindow,
    };
  }
  
  /**
   * Calculate linear trend from values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }
  
  /**
   * Get confidence modifier based on entropy state
   * Lower entropy = higher confidence in predictions
   */
  getConfidenceModifier(): number {
    const state = this.getSystemEntropyState();
    
    // Invert entropy: low entropy = high confidence
    const baseModifier = 1 - (state.totalEntropy * 0.3);
    
    // Boost if order is emerging
    const emergenceBoost = state.predictionWindow === 'favorable' ? 1.1 : 
                           state.predictionWindow === 'unfavorable' ? 0.9 : 1.0;
    
    return Math.max(0.5, Math.min(1.2, baseModifier * emergenceBoost));
  }
}

export const entropyFlowDetector = new EntropyFlowDetector();
export type { EntropyFlow, SystemEntropyState };
