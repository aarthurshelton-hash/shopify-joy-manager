/**
 * Archetypal Resonance Matrix
 * 
 * Maps narrative patterns (hero's journey, fall/redemption, cycles)
 * to market and temporal cycles. Detects when collective unconscious
 * archetypes manifest in price action.
 */

type Archetype = 
  | 'hero_journey'      // Challenge → Growth → Victory
  | 'fall_redemption'   // Peak → Collapse → Recovery
  | 'eternal_return'    // Cyclical patterns, what goes around
  | 'death_rebirth'     // Complete transformation
  | 'shadow_integration'// Facing darkness before light
  | 'threshold_guardian'// Resistance before breakthrough
  | 'sacred_marriage'   // Union of opposites (bull/bear equilibrium)
  | 'apocalypse_renewal'// Complete destruction → new beginning
  ;

interface ArchetypeSignature {
  archetype: Archetype;
  phase: number; // 0-1 where in the narrative arc
  strength: number;
  expectedNextPhase: string;
  priceImplication: 'bullish' | 'bearish' | 'volatile' | 'consolidating';
}

interface ResonanceEvent {
  archetype: Archetype;
  resonanceStrength: number;
  detectedAt: number;
  phaseTransition: string;
  historicalAccuracy: number;
}

class ArchetypalResonanceMatrix {
  private archetypeHistory: ResonanceEvent[] = [];
  private archetypeAccuracy: Map<Archetype, { correct: number; total: number }> = new Map();
  private readonly regularizationFactor = 0.85; // Prevent overfitting to archetypes
  
  /**
   * Analyze price/signal data for archetypal patterns
   */
  detectArchetype(
    priceData: number[],
    volumeData: number[],
    sentimentScore: number
  ): ArchetypeSignature | null {
    if (priceData.length < 20) return null;
    
    // Calculate key metrics
    const priceChange = this.calculateChange(priceData);
    const volumeChange = this.calculateChange(volumeData);
    const volatility = this.calculateVolatility(priceData);
    const trend = this.detectTrend(priceData);
    
    // Match against archetypal patterns
    const matches: Array<{ archetype: Archetype; score: number; phase: number }> = [];
    
    // Hero's Journey: Rising from adversity
    if (trend === 'recovering' && sentimentScore > 0.3) {
      matches.push({
        archetype: 'hero_journey',
        score: (0.3 + sentimentScore * 0.4 + Math.min(priceChange, 0.3)),
        phase: this.calculateHeroPhase(priceData),
      });
    }
    
    // Fall and Redemption: Post-collapse recovery
    if (this.detectFallRedemption(priceData)) {
      matches.push({
        archetype: 'fall_redemption',
        score: 0.6 + Math.abs(priceChange) * 0.2,
        phase: this.calculateRedemptionPhase(priceData),
      });
    }
    
    // Eternal Return: Cyclical patterns
    const cyclicStrength = this.detectCyclicPattern(priceData);
    if (cyclicStrength > 0.5) {
      matches.push({
        archetype: 'eternal_return',
        score: cyclicStrength,
        phase: this.calculateCyclePhase(priceData),
      });
    }
    
    // Death and Rebirth: Extreme volatility + direction change
    if (volatility > 0.3 && Math.abs(priceChange) > 0.15) {
      matches.push({
        archetype: 'death_rebirth',
        score: volatility * 0.5 + Math.abs(priceChange) * 0.5,
        phase: priceChange > 0 ? 0.7 : 0.3, // Rebirth or death phase
      });
    }
    
    // Shadow Integration: Negative sentiment but stabilizing
    if (sentimentScore < -0.2 && volatility < 0.1 && Math.abs(priceChange) < 0.05) {
      matches.push({
        archetype: 'shadow_integration',
        score: 0.5 + Math.abs(sentimentScore) * 0.3,
        phase: 0.6,
      });
    }
    
    // Threshold Guardian: Resistance at key levels
    if (this.detectResistance(priceData)) {
      matches.push({
        archetype: 'threshold_guardian',
        score: 0.55,
        phase: 0.5,
      });
    }
    
    // Sacred Marriage: Bull/bear equilibrium
    if (volatility < 0.05 && Math.abs(priceChange) < 0.02 && volumeChange < 0.1) {
      matches.push({
        archetype: 'sacred_marriage',
        score: 0.5 + (1 - volatility) * 0.3,
        phase: 0.5,
      });
    }
    
    // Apocalypse/Renewal: Extreme moves
    if (Math.abs(priceChange) > 0.25) {
      matches.push({
        archetype: 'apocalypse_renewal',
        score: Math.min(0.9, Math.abs(priceChange)),
        phase: priceChange > 0 ? 0.8 : 0.2,
      });
    }
    
    if (matches.length === 0) return null;
    
    // Sort by score and apply regularization based on historical accuracy
    const best = matches.sort((a, b) => {
      const accuracyA = this.getArchetypeAccuracy(a.archetype);
      const accuracyB = this.getArchetypeAccuracy(b.archetype);
      return (b.score * accuracyB) - (a.score * accuracyA);
    })[0];
    
    return {
      archetype: best.archetype,
      phase: best.phase,
      strength: best.score * this.regularizationFactor,
      expectedNextPhase: this.getNextPhase(best.archetype, best.phase),
      priceImplication: this.getPriceImplication(best.archetype, best.phase),
    };
  }
  
  /**
   * Record outcome for calibration
   */
  recordOutcome(archetype: Archetype, wasCorrect: boolean): void {
    const current = this.archetypeAccuracy.get(archetype) || { correct: 0, total: 0 };
    current.total++;
    if (wasCorrect) current.correct++;
    this.archetypeAccuracy.set(archetype, current);
  }
  
  /**
   * Get historical accuracy for an archetype
   */
  private getArchetypeAccuracy(archetype: Archetype): number {
    const stats = this.archetypeAccuracy.get(archetype);
    if (!stats || stats.total < 5) return 0.5; // Default to neutral
    return stats.correct / stats.total;
  }
  
  private calculateChange(data: number[]): number {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return first !== 0 ? (last - first) / first : 0;
  }
  
  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] !== 0) {
        returns.push((data[i] - data[i - 1]) / data[i - 1]);
      }
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
  
  private detectTrend(data: number[]): 'rising' | 'falling' | 'recovering' | 'declining' | 'flat' {
    if (data.length < 10) return 'flat';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const firstMin = Math.min(...firstHalf);
    const secondMin = Math.min(...secondHalf);
    
    if (secondAvg > firstAvg * 1.05) {
      return firstMin < firstAvg * 0.9 ? 'recovering' : 'rising';
    } else if (secondAvg < firstAvg * 0.95) {
      return 'declining';
    }
    return 'flat';
  }
  
  private detectFallRedemption(data: number[]): boolean {
    if (data.length < 15) return false;
    const third = Math.floor(data.length / 3);
    const peak = Math.max(...data.slice(0, third));
    const trough = Math.min(...data.slice(third, third * 2));
    const current = data[data.length - 1];
    
    return peak > trough * 1.2 && current > trough * 1.1;
  }
  
  private detectCyclicPattern(data: number[]): number {
    if (data.length < 20) return 0;
    
    // Simple autocorrelation for cycle detection
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    let maxCorrelation = 0;
    
    for (let lag = 5; lag < data.length / 2; lag++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < data.length - lag; i++) {
        correlation += (data[i] - mean) * (data[i + lag] - mean);
        count++;
      }
      
      if (count > 0) {
        correlation /= count;
        maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
      }
    }
    
    return Math.min(1, maxCorrelation / (this.calculateVolatility(data) + 0.1));
  }
  
  private detectResistance(data: number[]): boolean {
    if (data.length < 10) return false;
    const recent = data.slice(-10);
    const max = Math.max(...recent);
    const touchCount = recent.filter(v => v > max * 0.98).length;
    return touchCount >= 3 && recent[recent.length - 1] < max * 0.99;
  }
  
  private calculateHeroPhase(data: number[]): number {
    const change = this.calculateChange(data);
    if (change < 0) return 0.2; // Call to adventure
    if (change < 0.1) return 0.4; // Tests and trials
    if (change < 0.2) return 0.6; // Approach
    if (change < 0.3) return 0.8; // Reward
    return 0.9; // Return
  }
  
  private calculateRedemptionPhase(data: number[]): number {
    const third = Math.floor(data.length / 3);
    const current = data[data.length - 1];
    const trough = Math.min(...data.slice(third, third * 2));
    const peak = Math.max(...data.slice(0, third));
    
    const recovery = (current - trough) / (peak - trough);
    return Math.max(0.3, Math.min(0.9, 0.3 + recovery * 0.6));
  }
  
  private calculateCyclePhase(data: number[]): number {
    // Use sine wave fitting to estimate phase
    const normalized = this.normalizeData(data);
    const last = normalized[normalized.length - 1];
    
    // Map -1 to 1 range to 0 to 1 phase
    return (last + 1) / 2;
  }
  
  private normalizeData(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) return data.map(() => 0);
    return data.map(v => ((v - min) / range) * 2 - 1);
  }
  
  private getNextPhase(archetype: Archetype, currentPhase: number): string {
    const phases: Record<Archetype, string[]> = {
      hero_journey: ['Call', 'Threshold', 'Tests', 'Abyss', 'Transformation', 'Return'],
      fall_redemption: ['Peak', 'Decline', 'Bottom', 'Recognition', 'Recovery', 'Restoration'],
      eternal_return: ['Spring', 'Summer', 'Autumn', 'Winter', 'Spring'],
      death_rebirth: ['Life', 'Death', 'Void', 'Rebirth', 'New Life'],
      shadow_integration: ['Denial', 'Confrontation', 'Struggle', 'Acceptance', 'Integration'],
      threshold_guardian: ['Approach', 'Challenge', 'Battle', 'Victory', 'Crossing'],
      sacred_marriage: ['Separation', 'Longing', 'Meeting', 'Union', 'Wholeness'],
      apocalypse_renewal: ['Signs', 'Chaos', 'Destruction', 'Silence', 'New Dawn'],
    };
    
    const phaseList = phases[archetype];
    const currentIndex = Math.floor(currentPhase * (phaseList.length - 1));
    const nextIndex = Math.min(currentIndex + 1, phaseList.length - 1);
    
    return phaseList[nextIndex];
  }
  
  private getPriceImplication(archetype: Archetype, phase: number): 'bullish' | 'bearish' | 'volatile' | 'consolidating' {
    const implications: Record<Archetype, (phase: number) => 'bullish' | 'bearish' | 'volatile' | 'consolidating'> = {
      hero_journey: (p) => p > 0.5 ? 'bullish' : 'consolidating',
      fall_redemption: (p) => p > 0.5 ? 'bullish' : 'bearish',
      eternal_return: (p) => p > 0.25 && p < 0.75 ? (p < 0.5 ? 'bullish' : 'bearish') : 'consolidating',
      death_rebirth: (p) => p > 0.5 ? 'volatile' : 'bearish',
      shadow_integration: () => 'consolidating',
      threshold_guardian: (p) => p > 0.6 ? 'bullish' : 'consolidating',
      sacred_marriage: () => 'consolidating',
      apocalypse_renewal: (p) => p > 0.7 ? 'bullish' : 'volatile',
    };
    
    return implications[archetype](phase);
  }
  
  /**
   * Get confidence modifier based on archetypal clarity
   */
  getConfidenceModifier(signature: ArchetypeSignature | null): number {
    if (!signature) return 1.0;
    
    const accuracy = this.getArchetypeAccuracy(signature.archetype);
    return 0.9 + (signature.strength * accuracy * 0.2);
  }
}

export const archetypalResonanceMatrix = new ArchetypalResonanceMatrix();
export type { Archetype, ArchetypeSignature, ResonanceEvent };
