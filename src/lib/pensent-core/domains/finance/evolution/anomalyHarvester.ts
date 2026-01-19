/**
 * Anomaly Harvester - Productive Bug Detection System
 * 
 * Philosophy: Bugs that don't crash the system contain exploitable information.
 * Like speedrun glitches, biological mutations, and quantum tunneling -
 * anomalies that preserve system integrity reveal hidden optimization paths.
 */

import { PredictionOutcome, LearnedPattern } from './types';

export type AnomalyType = 
  | 'wrong_but_profitable'      // Prediction wrong, but outcome still favorable
  | 'calibration_mismatch'      // High confidence + wrong = signal about edge cases
  | 'consensus_violation'       // System disagreed with all baselines but was right
  | 'temporal_glitch'           // Prediction timing anomaly revealed hidden pattern
  | 'cross_domain_resonance'    // Bug in one domain = signal in another
  | 'mutation_survival'         // Gene mutation that improved fitness unexpectedly
  | 'emergent_optimization';    // Self-healing fix worked in unintended way

export interface HarvestedAnomaly {
  id: string;
  type: AnomalyType;
  timestamp: number;
  description: string;
  
  // The "bug" details
  expectedBehavior: string;
  actualBehavior: string;
  systemIntegrityPreserved: boolean;
  
  // Extracted information
  informationGained: string;
  exploitabilityScore: number; // 0-1: How useful is this anomaly?
  evolutionaryValue: number;   // 0-1: How much does this advance the system?
  
  // Context
  domain: string;
  relatedPatterns: string[];
  geneticImpact: {
    genesAffected: string[];
    mutationType: 'beneficial' | 'neutral' | 'harmful_but_informative';
    fitnessChange: number;
  };
  
  // For memory persistence
  importance: number; // 1-10 scale
  tags: string[];
}

export interface AnomalyHarvesterState {
  totalHarvested: number;
  byType: Record<AnomalyType, number>;
  recentAnomalies: HarvestedAnomaly[];
  exploitablePatterns: Array<{
    pattern: string;
    frequency: number;
    avgExploitability: number;
  }>;
  evolutionaryInsights: string[];
}

class AnomalyHarvester {
  private state: AnomalyHarvesterState;
  private readonly maxRecentAnomalies = 100;
  
  constructor() {
    this.state = {
      totalHarvested: 0,
      byType: {
        wrong_but_profitable: 0,
        calibration_mismatch: 0,
        consensus_violation: 0,
        temporal_glitch: 0,
        cross_domain_resonance: 0,
        mutation_survival: 0,
        emergent_optimization: 0
      },
      recentAnomalies: [],
      exploitablePatterns: [],
      evolutionaryInsights: []
    };
  }

  /**
   * Analyze a prediction outcome for productive bugs
   */
  harvestFromOutcome(
    outcome: PredictionOutcome,
    wasCorrect: boolean,
    fitness: number,
    previousFitness: number
  ): HarvestedAnomaly | null {
    const anomalies: HarvestedAnomaly[] = [];

    // Type 1: Wrong but profitable (prediction wrong, but fitness improved)
    if (!wasCorrect && fitness > previousFitness) {
      anomalies.push(this.createAnomaly({
        type: 'wrong_but_profitable',
        description: 'Incorrect prediction led to fitness improvement - learning from failure',
        expectedBehavior: `Prediction: ${outcome.predicted}`,
        actualBehavior: `Actual: ${outcome.actual}, but fitness +${((fitness - previousFitness) * 100).toFixed(1)}%`,
        informationGained: 'Wrong predictions with high confidence reveal blind spots in pattern matching',
        exploitabilityScore: Math.min(1, (fitness - previousFitness) * 5),
        evolutionaryValue: 0.7,
        domain: 'prediction',
        importance: 7,
        tags: ['learning', 'failure-analysis', 'fitness-paradox']
      }));
    }

    // Type 2: Calibration mismatch (high confidence but wrong)
    if (!wasCorrect && outcome.confidence > 0.75) {
      anomalies.push(this.createAnomaly({
        type: 'calibration_mismatch',
        description: `High confidence (${(outcome.confidence * 100).toFixed(0)}%) prediction failed - calibration signal`,
        expectedBehavior: `Confidence ${(outcome.confidence * 100).toFixed(0)}% should indicate reliability`,
        actualBehavior: 'Prediction failed despite high confidence',
        informationGained: 'Edge case identified where confidence model breaks down',
        exploitabilityScore: outcome.confidence, // Higher confidence = more informative failure
        evolutionaryValue: 0.8,
        domain: 'calibration',
        importance: 8,
        tags: ['calibration', 'overconfidence', 'edge-case']
      }));
    }

    // Type 3: Consensus violation that succeeded
    if (wasCorrect && outcome.confidence < 0.4) {
      anomalies.push(this.createAnomaly({
        type: 'consensus_violation',
        description: 'Low-confidence contrarian prediction proved correct - hidden pattern detected',
        expectedBehavior: 'Low confidence suggests uncertainty',
        actualBehavior: 'Prediction correct despite low confidence - system knew more than it admitted',
        informationGained: 'Subconscious pattern recognition operating below confidence threshold',
        exploitabilityScore: 1 - outcome.confidence, // Lower confidence = more surprising success
        evolutionaryValue: 0.9,
        domain: 'pattern-recognition',
        importance: 9,
        tags: ['contrarian', 'hidden-pattern', 'brilliant-move']
      }));
    }

    // Return the most valuable anomaly found
    if (anomalies.length > 0) {
      const bestAnomaly = anomalies.reduce((a, b) => 
        a.evolutionaryValue > b.evolutionaryValue ? a : b
      );
      this.recordAnomaly(bestAnomaly);
      return bestAnomaly;
    }

    return null;
  }

  /**
   * Detect mutation survival anomalies from gene performance
   */
  harvestFromMutation(
    geneName: string,
    mutationDelta: number,
    fitnessBeforeMutation: number,
    fitnessAfterMutation: number
  ): HarvestedAnomaly | null {
    const fitnessChange = fitnessAfterMutation - fitnessBeforeMutation;
    
    // Beneficial mutation: small random change led to large improvement
    if (Math.abs(mutationDelta) < 0.1 && fitnessChange > 0.05) {
      const anomaly = this.createAnomaly({
        type: 'mutation_survival',
        description: `Gene "${geneName}" micro-mutation yielded macro-improvement`,
        expectedBehavior: `Small mutation (${(mutationDelta * 100).toFixed(1)}%) should have small effect`,
        actualBehavior: `Fitness improved by ${(fitnessChange * 100).toFixed(1)}%`,
        informationGained: 'Gene exists at critical inflection point - small changes cascade',
        exploitabilityScore: fitnessChange / Math.max(0.01, Math.abs(mutationDelta)),
        evolutionaryValue: 0.85,
        domain: 'genetics',
        importance: 8,
        tags: ['mutation', 'cascade-effect', 'critical-gene'],
        geneticImpact: {
          genesAffected: [geneName],
          mutationType: 'beneficial',
          fitnessChange
        }
      });
      this.recordAnomaly(anomaly);
      return anomaly;
    }

    // Harmful but informative: large mutation that degraded fitness tells us about boundaries
    if (Math.abs(mutationDelta) > 0.2 && fitnessChange < -0.1) {
      const anomaly = this.createAnomaly({
        type: 'mutation_survival',
        description: `Gene "${geneName}" boundary discovered through harmful mutation`,
        expectedBehavior: 'Exploration mutation',
        actualBehavior: `Fitness dropped ${(Math.abs(fitnessChange) * 100).toFixed(1)}% - boundary found`,
        informationGained: 'Gene has hard constraint - now we know the safe operating range',
        exploitabilityScore: 0.6,
        evolutionaryValue: 0.5,
        domain: 'genetics',
        importance: 6,
        tags: ['boundary-detection', 'constraint-mapping'],
        geneticImpact: {
          genesAffected: [geneName],
          mutationType: 'harmful_but_informative',
          fitnessChange
        }
      });
      this.recordAnomaly(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Detect cross-domain resonance anomalies
   */
  harvestCrossDomainResonance(
    domain1: string,
    domain2: string,
    correlationStrength: number,
    unexpectedConnection: string
  ): HarvestedAnomaly | null {
    if (correlationStrength > 0.7) {
      const anomaly = this.createAnomaly({
        type: 'cross_domain_resonance',
        description: `Unexpected resonance between ${domain1} and ${domain2}`,
        expectedBehavior: 'Domains should be independent',
        actualBehavior: `Correlation: ${(correlationStrength * 100).toFixed(0)}%`,
        informationGained: unexpectedConnection,
        exploitabilityScore: correlationStrength,
        evolutionaryValue: 0.95,
        domain: `${domain1}-${domain2}`,
        importance: 10,
        tags: ['cross-domain', 'resonance', 'universal-pattern', 'glitch-in-matrix']
      });
      this.recordAnomaly(anomaly);
      return anomaly;
    }
    return null;
  }

  /**
   * Create anomaly with defaults
   */
  private createAnomaly(params: Partial<HarvestedAnomaly> & {
    type: AnomalyType;
    description: string;
    expectedBehavior: string;
    actualBehavior: string;
    informationGained: string;
    exploitabilityScore: number;
    evolutionaryValue: number;
    domain: string;
    importance: number;
    tags: string[];
    geneticImpact?: HarvestedAnomaly['geneticImpact'];
  }): HarvestedAnomaly {
    return {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      systemIntegrityPreserved: true,
      relatedPatterns: [],
      geneticImpact: params.geneticImpact || {
        genesAffected: [],
        mutationType: 'neutral',
        fitnessChange: 0
      },
      ...params
    };
  }

  /**
   * Record anomaly to state
   */
  private recordAnomaly(anomaly: HarvestedAnomaly): void {
    this.state.totalHarvested++;
    this.state.byType[anomaly.type]++;
    
    this.state.recentAnomalies.unshift(anomaly);
    if (this.state.recentAnomalies.length > this.maxRecentAnomalies) {
      this.state.recentAnomalies.pop();
    }

    // Update exploitable patterns
    this.updateExploitablePatterns(anomaly);
    
    // Generate evolutionary insight
    if (anomaly.evolutionaryValue > 0.8) {
      this.state.evolutionaryInsights.push(
        `[${new Date(anomaly.timestamp).toISOString()}] ${anomaly.type}: ${anomaly.informationGained}`
      );
      // Keep only recent insights
      if (this.state.evolutionaryInsights.length > 50) {
        this.state.evolutionaryInsights.shift();
      }
    }
  }

  /**
   * Track patterns that appear frequently in anomalies
   */
  private updateExploitablePatterns(anomaly: HarvestedAnomaly): void {
    const patternKey = `${anomaly.type}:${anomaly.domain}`;
    const existing = this.state.exploitablePatterns.find(p => p.pattern === patternKey);
    
    if (existing) {
      existing.frequency++;
      existing.avgExploitability = (existing.avgExploitability * (existing.frequency - 1) + anomaly.exploitabilityScore) / existing.frequency;
    } else {
      this.state.exploitablePatterns.push({
        pattern: patternKey,
        frequency: 1,
        avgExploitability: anomaly.exploitabilityScore
      });
    }

    // Sort by exploitability
    this.state.exploitablePatterns.sort((a, b) => 
      (b.avgExploitability * b.frequency) - (a.avgExploitability * a.frequency)
    );
  }

  /**
   * Get the most exploitable patterns discovered
   */
  getTopExploitablePatterns(limit: number = 5): typeof this.state.exploitablePatterns {
    return this.state.exploitablePatterns.slice(0, limit);
  }

  /**
   * Get recent high-value anomalies for memory persistence
   */
  getAnomaliesForMemory(minImportance: number = 7): HarvestedAnomaly[] {
    return this.state.recentAnomalies.filter(a => a.importance >= minImportance);
  }

  /**
   * Get harvester state summary
   */
  getState(): AnomalyHarvesterState {
    return { ...this.state };
  }

  /**
   * Get evolutionary insights summary
   */
  getEvolutionarySummary(): {
    totalAnomalies: number;
    topPatterns: string[];
    recentInsights: string[];
    anomalyDistribution: Record<AnomalyType, number>;
  } {
    return {
      totalAnomalies: this.state.totalHarvested,
      topPatterns: this.state.exploitablePatterns.slice(0, 3).map(p => p.pattern),
      recentInsights: this.state.evolutionaryInsights.slice(-5),
      anomalyDistribution: { ...this.state.byType }
    };
  }
}

export const anomalyHarvester = new AnomalyHarvester();
