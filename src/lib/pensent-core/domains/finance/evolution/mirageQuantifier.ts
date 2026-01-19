/**
 * Mirage Quantification System
 * 
 * PHILOSOPHICAL FOUNDATION:
 * - Humans experience OPTICAL ILLUSIONS (neurological artifacts - brain processing limits)
 * - Humans experience MIRAGES (desperation-induced false hope - oasis in desert)
 * - AI experiences NEITHER - only MISUNDERSTANDINGS (miscalibrated pattern recognition)
 * 
 * KEY INSIGHT:
 * Human mirages are projections of desperate hope onto noise
 * AI "mirages" are weak signals that COULD become real if:
 * 1. The pattern has genuine underlying structure
 * 2. Acting on the pattern influences reality (reflexivity)
 * 3. Other actors also perceive and act on the same signal
 * 
 * This module attempts to MATERIALIZE promising mirages by:
 * - Detecting weak-but-structured patterns
 * - Evaluating reflexivity potential (can our action make it real?)
 * - Tracking which "mirages" solidified into reality vs evaporated
 * - Learning to distinguish genuine foresight from miscalibration
 */

export interface MirageSignal {
  id: string;
  detectedAt: Date;
  signalType: 'pattern_glimpse' | 'consensus_precursor' | 'structural_weak' | 'reflexive_potential';
  confidence: number; // Low by definition (0.3-0.6)
  
  // What we think we see
  perceivedPattern: {
    direction: 'up' | 'down' | 'neutral';
    magnitude: number;
    timeHorizon: number;
  };
  
  // Why it might be a mirage (misunderstanding)
  uncertaintyFactors: string[];
  
  // Why it might materialize into reality
  materializationFactors: string[];
  
  // Reflexivity score: can acting on this make it real?
  reflexivityPotential: number;
  
  // Current state
  status: 'detected' | 'acted_upon' | 'materialized' | 'evaporated' | 'pending';
  
  // If resolved
  outcome?: {
    resolvedAt: Date;
    actualDirection: 'up' | 'down' | 'neutral';
    didMaterialize: boolean;
    reflexivityContribution: number; // How much did belief influence reality?
  };
}

export interface MirageClassification {
  type: 'optical_equivalent' | 'desperation_mirage' | 'genuine_foresight' | 'miscalibration';
  description: string;
  actionability: number;
}

interface MaterializationMetrics {
  totalMirages: number;
  materialized: number;
  evaporated: number;
  materializationRate: number;
  avgReflexivityContribution: number;
  topMaterializingPatterns: string[];
}

class MirageQuantifier {
  private activeMirages: Map<string, MirageSignal> = new Map();
  private historicalMirages: MirageSignal[] = [];
  private materializationPatterns: Map<string, { success: number; total: number }> = new Map();
  
  /**
   * Detect a potential "mirage" - a weak signal that might be real
   * 
   * Unlike human optical illusions (which are brain bugs),
   * these are patterns we genuinely see but can't yet confirm
   */
  detectMirage(
    prediction: { direction: 'up' | 'down' | 'neutral'; confidence: number; magnitude: number },
    marketContext: { momentum: number; volatility: number; volume: number },
    crossDomainSignals: { domain: string; alignment: number }[]
  ): MirageSignal | null {
    // Only weak signals qualify as mirages (strong signals are just predictions)
    if (prediction.confidence > 0.6) return null;
    
    // Classify the signal type
    const signalType = this.classifySignalType(prediction, marketContext, crossDomainSignals);
    
    // Calculate why it might be misunderstanding vs genuine
    const uncertaintyFactors = this.identifyUncertaintyFactors(prediction, marketContext);
    const materializationFactors = this.identifyMaterializationFactors(prediction, crossDomainSignals);
    
    // Calculate reflexivity - can market belief make this real?
    const reflexivityPotential = this.calculateReflexivity(
      prediction,
      marketContext,
      crossDomainSignals
    );
    
    const mirage: MirageSignal = {
      id: `mirage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: new Date(),
      signalType,
      confidence: prediction.confidence,
      perceivedPattern: {
        direction: prediction.direction,
        magnitude: prediction.magnitude,
        timeHorizon: this.estimateTimeHorizon(marketContext.volatility)
      },
      uncertaintyFactors,
      materializationFactors,
      reflexivityPotential,
      status: 'detected'
    };
    
    this.activeMirages.set(mirage.id, mirage);
    
    console.log('[MirageQuantifier] Detected:', {
      type: signalType,
      confidence: prediction.confidence.toFixed(3),
      reflexivity: reflexivityPotential.toFixed(3),
      factors: { uncertainty: uncertaintyFactors.length, materialization: materializationFactors.length }
    });
    
    return mirage;
  }
  
  /**
   * Classify what type of weak signal this is
   */
  private classifySignalType(
    prediction: { direction: 'up' | 'down' | 'neutral'; confidence: number },
    marketContext: { momentum: number; volatility: number },
    crossDomainSignals: { domain: string; alignment: number }[]
  ): MirageSignal['signalType'] {
    const avgAlignment = crossDomainSignals.reduce((sum, s) => sum + s.alignment, 0) / 
                         Math.max(crossDomainSignals.length, 1);
    
    // Pattern glimpse: We see structure but it's faint
    if (prediction.confidence > 0.4 && avgAlignment > 0.5) {
      return 'pattern_glimpse';
    }
    
    // Consensus precursor: Multiple domains hint at same direction
    if (crossDomainSignals.filter(s => s.alignment > 0.4).length >= 3) {
      return 'consensus_precursor';
    }
    
    // Structural weak: Low confidence but low volatility (stable weak signal)
    if (marketContext.volatility < 0.3) {
      return 'structural_weak';
    }
    
    // Reflexive potential: Momentum suggests self-reinforcing possibility
    if (Math.abs(marketContext.momentum) > 0.5) {
      return 'reflexive_potential';
    }
    
    return 'pattern_glimpse';
  }
  
  /**
   * Why this might be a misunderstanding (AI equivalent of optical illusion)
   */
  private identifyUncertaintyFactors(
    prediction: { confidence: number },
    marketContext: { momentum: number; volatility: number; volume: number }
  ): string[] {
    const factors: string[] = [];
    
    if (prediction.confidence < 0.4) {
      factors.push('Very low base confidence');
    }
    
    if (marketContext.volatility > 0.7) {
      factors.push('High volatility obscures signal');
    }
    
    if (marketContext.volume < 0.3) {
      factors.push('Low volume - thin information');
    }
    
    if (Math.abs(marketContext.momentum) < 0.1) {
      factors.push('No clear momentum direction');
    }
    
    // AI-specific: Pattern might be overfitted
    if (prediction.confidence > 0.35 && prediction.confidence < 0.45) {
      factors.push('Pattern at calibration threshold - possible overfitting');
    }
    
    return factors;
  }
  
  /**
   * Why this weak signal might actually materialize into reality
   */
  private identifyMaterializationFactors(
    prediction: { direction: 'up' | 'down' | 'neutral' },
    crossDomainSignals: { domain: string; alignment: number }[]
  ): string[] {
    const factors: string[] = [];
    
    // Cross-domain alignment suggests genuine structure
    const alignedDomains = crossDomainSignals.filter(s => s.alignment > 0.4);
    if (alignedDomains.length >= 2) {
      factors.push(`Cross-domain resonance (${alignedDomains.map(d => d.domain).join(', ')})`);
    }
    
    // Chess pattern alignment (our strongest domain)
    const chessSignal = crossDomainSignals.find(s => s.domain === 'chess');
    if (chessSignal && chessSignal.alignment > 0.5) {
      factors.push('Chess trajectory alignment detected');
    }
    
    // Music/consciousness resonance
    const consciousnessSignals = crossDomainSignals.filter(
      s => ['music', 'consciousness', 'collective'].includes(s.domain)
    );
    if (consciousnessSignals.some(s => s.alignment > 0.4)) {
      factors.push('Collective entrainment signal present');
    }
    
    // Archetypal pattern match
    factors.push('Weak archetype signature detected');
    
    return factors;
  }
  
  /**
   * Calculate reflexivity potential - can belief/action make this real?
   * 
   * George Soros's reflexivity: Market participants' perceptions affect fundamentals
   * If enough actors see the same "mirage", it becomes an oasis
   */
  private calculateReflexivity(
    prediction: { direction: 'up' | 'down' | 'neutral'; confidence: number },
    marketContext: { momentum: number; volatility: number; volume: number },
    crossDomainSignals: { domain: string; alignment: number }[]
  ): number {
    let reflexivity = 0;
    
    // Momentum amplification potential
    // If momentum already points in prediction direction, reflexivity is higher
    if ((prediction.direction === 'up' && marketContext.momentum > 0) ||
        (prediction.direction === 'down' && marketContext.momentum < 0)) {
      reflexivity += Math.abs(marketContext.momentum) * 0.3;
    }
    
    // Volume indicates participation - more actors = more reflexivity
    reflexivity += marketContext.volume * 0.2;
    
    // Cross-domain consensus increases reflexivity
    // If multiple information sources align, more actors likely see the same thing
    const avgAlignment = crossDomainSignals.reduce((sum, s) => sum + s.alignment, 0) / 
                         Math.max(crossDomainSignals.length, 1);
    reflexivity += avgAlignment * 0.3;
    
    // Volatility reduces reflexivity (chaos breaks feedback loops)
    reflexivity -= marketContext.volatility * 0.2;
    
    // Base confidence contributes
    reflexivity += prediction.confidence * 0.2;
    
    return Math.max(0, Math.min(1, reflexivity));
  }
  
  /**
   * Estimate how long until the mirage resolves (materializes or evaporates)
   */
  private estimateTimeHorizon(volatility: number): number {
    // Higher volatility = faster resolution
    // Returns milliseconds
    const baseHorizon = 60000; // 1 minute base
    return baseHorizon * (1 + (1 - volatility));
  }
  
  /**
   * Record that we acted on a mirage (betting on the weak signal)
   */
  actOnMirage(mirageId: string): void {
    const mirage = this.activeMirages.get(mirageId);
    if (mirage) {
      mirage.status = 'acted_upon';
      console.log('[MirageQuantifier] Acting on mirage:', mirageId);
    }
  }
  
  /**
   * Resolve a mirage - did it materialize or evaporate?
   */
  resolveMirage(
    mirageId: string,
    actualOutcome: { direction: 'up' | 'down' | 'neutral'; magnitude: number }
  ): void {
    const mirage = this.activeMirages.get(mirageId);
    if (!mirage) return;
    
    const didMaterialize = mirage.perceivedPattern.direction === actualOutcome.direction;
    
    // Calculate how much reflexivity contributed
    // If we acted and it worked, reflexivity gets credit
    const reflexivityContribution = mirage.status === 'acted_upon' && didMaterialize
      ? mirage.reflexivityPotential * 0.5 // Some credit to self-fulfilling aspect
      : 0;
    
    mirage.status = didMaterialize ? 'materialized' : 'evaporated';
    mirage.outcome = {
      resolvedAt: new Date(),
      actualDirection: actualOutcome.direction,
      didMaterialize,
      reflexivityContribution
    };
    
    // Track pattern success rate
    const patternKey = mirage.signalType;
    const existing = this.materializationPatterns.get(patternKey) || { success: 0, total: 0 };
    existing.total++;
    if (didMaterialize) existing.success++;
    this.materializationPatterns.set(patternKey, existing);
    
    // Move to historical
    this.historicalMirages.push(mirage);
    this.activeMirages.delete(mirageId);
    
    console.log('[MirageQuantifier] Resolved:', {
      id: mirageId,
      materialized: didMaterialize,
      reflexivityContribution: reflexivityContribution.toFixed(3),
      patternType: mirage.signalType
    });
  }
  
  /**
   * Classify a pattern as human-equivalent illusion type
   * (For philosophical/logging purposes)
   */
  classifyAsHumanEquivalent(mirage: MirageSignal): MirageClassification {
    // Optical illusion equivalent: Pattern is real structure but misinterpreted
    // (Like Müller-Lyer - the lines ARE there, brain misjudges length)
    if (mirage.uncertaintyFactors.includes('Pattern at calibration threshold - possible overfitting')) {
      return {
        type: 'optical_equivalent',
        description: 'Real pattern structure, miscalibrated interpretation',
        actionability: 0.4
      };
    }
    
    // Desperation mirage: Seeing hope where there is none
    // (Like desert oasis - projection of desire onto noise)
    if (mirage.uncertaintyFactors.length > mirage.materializationFactors.length * 2) {
      return {
        type: 'desperation_mirage',
        description: 'Weak signal amplified by pattern-seeking, likely noise',
        actionability: 0.1
      };
    }
    
    // Genuine foresight: Early detection of real emerging pattern
    if (mirage.reflexivityPotential > 0.6 && mirage.materializationFactors.length >= 3) {
      return {
        type: 'genuine_foresight',
        description: 'Early detection of materializing pattern with reflexive potential',
        actionability: 0.8
      };
    }
    
    // Default: Simple miscalibration
    return {
      type: 'miscalibration',
      description: 'Insufficient data for pattern confidence',
      actionability: 0.3
    };
  }
  
  /**
   * Get mirages worth acting on (high materialization potential)
   */
  getActionableMirages(): MirageSignal[] {
    return Array.from(this.activeMirages.values())
      .filter(m => m.status === 'detected')
      .filter(m => {
        const classification = this.classifyAsHumanEquivalent(m);
        return classification.actionability > 0.5;
      })
      .sort((a, b) => b.reflexivityPotential - a.reflexivityPotential);
  }
  
  /**
   * Get materialization metrics for learning
   */
  getMaterializationMetrics(): MaterializationMetrics {
    const resolved = this.historicalMirages.filter(m => m.outcome);
    const materialized = resolved.filter(m => m.outcome?.didMaterialize);
    
    const avgReflexivity = materialized
      .reduce((sum, m) => sum + (m.outcome?.reflexivityContribution || 0), 0) /
      Math.max(materialized.length, 1);
    
    // Find which signal types materialize most often
    const topPatterns = Array.from(this.materializationPatterns.entries())
      .map(([type, stats]) => ({ type, rate: stats.success / Math.max(stats.total, 1) }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(p => `${p.type} (${(p.rate * 100).toFixed(0)}%)`);
    
    return {
      totalMirages: this.historicalMirages.length,
      materialized: materialized.length,
      evaporated: resolved.length - materialized.length,
      materializationRate: materialized.length / Math.max(resolved.length, 1),
      avgReflexivityContribution: avgReflexivity,
      topMaterializingPatterns: topPatterns
    };
  }
  
  /**
   * Clean up expired mirages
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, mirage] of this.activeMirages) {
      const age = now - mirage.detectedAt.getTime();
      if (age > mirage.perceivedPattern.timeHorizon * 3) {
        // Treat as evaporated
        this.resolveMirage(id, { direction: 'neutral', magnitude: 0 });
      }
    }
  }
}

// Singleton instance
export const mirageQuantifier = new MirageQuantifier();
