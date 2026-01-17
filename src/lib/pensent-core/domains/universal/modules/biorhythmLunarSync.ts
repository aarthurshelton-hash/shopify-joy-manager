/**
 * Biorhythm Lunar Synchronization
 * 
 * Tracks lunar cycles and their correlation with biological rhythms
 * and market behavior. Ancient wisdom meets quantitative analysis.
 */

type LunarPhase = 
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'third_quarter'
  | 'waning_crescent';

interface LunarState {
  phase: LunarPhase;
  illumination: number; // 0-1
  daysUntilFull: number;
  daysUntilNew: number;
  isEclipse: boolean;
}

interface BiorhythmCycle {
  physical: number; // 23-day cycle, -1 to 1
  emotional: number; // 28-day cycle, -1 to 1
  intellectual: number; // 33-day cycle, -1 to 1
  combined: number; // Weighted average
}

interface LunarMarketCorrelation {
  phase: LunarPhase;
  historicalBias: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  sampleSize: number;
}

interface BiorhythmLunarState {
  lunar: LunarState;
  biorhythm: BiorhythmCycle;
  phaseCorrelations: LunarMarketCorrelation[];
  prediction: {
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  syncScore: number; // How aligned lunar and biorhythm cycles are
}

class BiorhythmLunarSync {
  private readonly LUNAR_CYCLE_DAYS = 29.53;
  private readonly PHYSICAL_CYCLE = 23;
  private readonly EMOTIONAL_CYCLE = 28;
  private readonly INTELLECTUAL_CYCLE = 33;
  
  private outcomeHistory: Array<{ phase: LunarPhase; direction: string; wasCorrect: boolean }> = [];
  private phaseStats: Map<LunarPhase, { up: number; down: number; total: number }> = new Map();
  private readonly regularization = 0.8; // Conservative due to speculative nature
  
  constructor() {
    // Initialize phase stats
    const phases: LunarPhase[] = [
      'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
      'full_moon', 'waning_gibbous', 'third_quarter', 'waning_crescent'
    ];
    for (const phase of phases) {
      this.phaseStats.set(phase, { up: 0, down: 0, total: 0 });
    }
  }
  
  /**
   * Calculate current lunar state
   */
  getLunarState(date: Date = new Date()): LunarState {
    // Known new moon reference: January 6, 2000
    const referenceNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const daysSinceReference = (date.getTime() - referenceNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    
    const lunarAge = daysSinceReference % this.LUNAR_CYCLE_DAYS;
    const illumination = (1 - Math.cos((lunarAge / this.LUNAR_CYCLE_DAYS) * 2 * Math.PI)) / 2;
    
    const phase = this.getPhaseFromAge(lunarAge);
    
    const daysUntilFull = lunarAge < this.LUNAR_CYCLE_DAYS / 2
      ? (this.LUNAR_CYCLE_DAYS / 2) - lunarAge
      : this.LUNAR_CYCLE_DAYS - lunarAge + (this.LUNAR_CYCLE_DAYS / 2);
    
    const daysUntilNew = lunarAge < 1 ? 1 - lunarAge : this.LUNAR_CYCLE_DAYS - lunarAge;
    
    // Simple eclipse approximation (very rough)
    const isEclipse = (lunarAge < 1.5 || Math.abs(lunarAge - this.LUNAR_CYCLE_DAYS / 2) < 1.5) &&
                      (date.getMonth() % 6 === 0 || date.getMonth() % 6 === 5);
    
    return { phase, illumination, daysUntilFull, daysUntilNew, isEclipse };
  }
  
  /**
   * Get lunar phase from age in days
   */
  private getPhaseFromAge(age: number): LunarPhase {
    const phaseLength = this.LUNAR_CYCLE_DAYS / 8;
    const phaseIndex = Math.floor(age / phaseLength) % 8;
    
    const phases: LunarPhase[] = [
      'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
      'full_moon', 'waning_gibbous', 'third_quarter', 'waning_crescent'
    ];
    
    return phases[phaseIndex];
  }
  
  /**
   * Calculate biorhythm cycles
   * Based on birth date or market "birth" (reference point)
   */
  getBiorhythmCycle(referenceDate: Date = new Date(2009, 0, 3)): BiorhythmCycle {
    // Default reference: Bitcoin genesis block as a "market birth"
    const now = new Date();
    const daysSinceBirth = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const physical = Math.sin((2 * Math.PI * daysSinceBirth) / this.PHYSICAL_CYCLE);
    const emotional = Math.sin((2 * Math.PI * daysSinceBirth) / this.EMOTIONAL_CYCLE);
    const intellectual = Math.sin((2 * Math.PI * daysSinceBirth) / this.INTELLECTUAL_CYCLE);
    
    // Markets are more emotional than intellectual
    const combined = (physical * 0.25 + emotional * 0.45 + intellectual * 0.3);
    
    return { physical, emotional, intellectual, combined };
  }
  
  /**
   * Get historical correlation between lunar phases and market direction
   */
  getPhaseCorrelations(): LunarMarketCorrelation[] {
    const correlations: LunarMarketCorrelation[] = [];
    
    for (const [phase, stats] of this.phaseStats) {
      if (stats.total < 5) {
        // Not enough data - use historical research (rough approximations)
        correlations.push(this.getHistoricalBias(phase));
      } else {
        const upRatio = stats.up / stats.total;
        correlations.push({
          phase,
          historicalBias: upRatio > 0.55 ? 'bullish' : upRatio < 0.45 ? 'bearish' : 'neutral',
          strength: Math.abs(upRatio - 0.5) * 2,
          sampleSize: stats.total,
        });
      }
    }
    
    return correlations;
  }
  
  /**
   * Get historical bias based on published research
   */
  private getHistoricalBias(phase: LunarPhase): LunarMarketCorrelation {
    // Based on various studies (Yuan, Zheng, and Zhu, etc.)
    const biases: Record<LunarPhase, { bias: 'bullish' | 'bearish' | 'neutral'; strength: number }> = {
      new_moon: { bias: 'bullish', strength: 0.3 }, // Often marks bottoms
      waxing_crescent: { bias: 'bullish', strength: 0.2 },
      first_quarter: { bias: 'neutral', strength: 0.1 },
      waxing_gibbous: { bias: 'neutral', strength: 0.1 },
      full_moon: { bias: 'bearish', strength: 0.25 }, // Often marks tops
      waning_gibbous: { bias: 'bearish', strength: 0.15 },
      third_quarter: { bias: 'neutral', strength: 0.1 },
      waning_crescent: { bias: 'neutral', strength: 0.15 },
    };
    
    const { bias, strength } = biases[phase];
    return { phase, historicalBias: bias, strength: strength * this.regularization, sampleSize: 0 };
  }
  
  /**
   * Get full biorhythm-lunar synchronized state
   */
  getState(): BiorhythmLunarState {
    const lunar = this.getLunarState();
    const biorhythm = this.getBiorhythmCycle();
    const phaseCorrelations = this.getPhaseCorrelations();
    
    // Calculate sync score (how aligned cycles are)
    const lunarNormalized = lunar.illumination * 2 - 1; // Convert 0-1 to -1 to 1
    const bioNormalized = biorhythm.combined;
    
    // When both cycles align (same sign and similar magnitude)
    const syncScore = 1 - Math.abs(lunarNormalized - bioNormalized) / 2;
    
    // Generate prediction
    const prediction = this.generatePrediction(lunar, biorhythm, phaseCorrelations);
    
    return {
      lunar,
      biorhythm,
      phaseCorrelations,
      prediction: {
        ...prediction,
        confidence: prediction.confidence * this.regularization,
      },
      syncScore,
    };
  }
  
  /**
   * Generate prediction from lunar and biorhythm data
   */
  private generatePrediction(
    lunar: LunarState,
    biorhythm: BiorhythmCycle,
    correlations: LunarMarketCorrelation[]
  ): { direction: 'up' | 'down' | 'neutral'; confidence: number; reasoning: string } {
    const currentCorrelation = correlations.find(c => c.phase === lunar.phase);
    
    let lunarScore = 0;
    if (currentCorrelation) {
      if (currentCorrelation.historicalBias === 'bullish') lunarScore = currentCorrelation.strength;
      else if (currentCorrelation.historicalBias === 'bearish') lunarScore = -currentCorrelation.strength;
    }
    
    // Biorhythm contribution
    const bioScore = biorhythm.combined * 0.3;
    
    // Eclipse effect (high uncertainty)
    const eclipseModifier = lunar.isEclipse ? 0.5 : 1;
    
    const totalScore = (lunarScore + bioScore) * eclipseModifier;
    const confidence = Math.min(0.6, Math.abs(totalScore) * 0.8); // Cap at 60% - this is speculative
    
    let reasoning = `${lunar.phase.replace('_', ' ')} phase`;
    if (biorhythm.combined > 0.3) reasoning += ', positive biorhythm';
    else if (biorhythm.combined < -0.3) reasoning += ', negative biorhythm';
    if (lunar.isEclipse) reasoning += ' (eclipse caution)';
    
    if (Math.abs(totalScore) < 0.1) {
      return { direction: 'neutral', confidence: 0.3, reasoning };
    }
    
    return {
      direction: totalScore > 0 ? 'up' : 'down',
      confidence,
      reasoning,
    };
  }
  
  /**
   * Record outcome for learning
   */
  recordOutcome(phase: LunarPhase, actualDirection: 'up' | 'down'): void {
    const stats = this.phaseStats.get(phase);
    if (stats) {
      stats.total++;
      if (actualDirection === 'up') stats.up++;
      else stats.down++;
    }
    
    this.outcomeHistory.push({
      phase,
      direction: actualDirection,
      wasCorrect: true, // Will be used for prediction accuracy later
    });
    
    if (this.outcomeHistory.length > 1000) {
      this.outcomeHistory.shift();
    }
  }
  
  /**
   * Get accuracy by lunar phase
   */
  getAccuracyByPhase(): Record<LunarPhase, number> {
    const result: Record<LunarPhase, number> = {} as Record<LunarPhase, number>;
    
    for (const [phase, stats] of this.phaseStats) {
      if (stats.total < 5) {
        result[phase] = 0.5;
      } else {
        // Accuracy is how well our bias matches reality
        const upRatio = stats.up / stats.total;
        const bias = this.getHistoricalBias(phase);
        
        if (bias.historicalBias === 'bullish') {
          result[phase] = upRatio;
        } else if (bias.historicalBias === 'bearish') {
          result[phase] = 1 - upRatio;
        } else {
          result[phase] = 1 - Math.abs(upRatio - 0.5) * 2;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get confidence modifier
   */
  getConfidenceModifier(): number {
    const state = this.getState();
    
    // Higher sync = higher confidence
    const syncModifier = 0.9 + state.syncScore * 0.2;
    
    // Eclipse reduces confidence
    const eclipseModifier = state.lunar.isEclipse ? 0.7 : 1;
    
    return syncModifier * eclipseModifier * this.regularization;
  }
}

export const biorhythmLunarSync = new BiorhythmLunarSync();
export type { LunarPhase, LunarState, BiorhythmCycle, BiorhythmLunarState };
