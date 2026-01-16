/**
 * Self-Evolving Learning System
 * Continuously adapts and improves based on prediction outcomes
 * 
 * Refactored: Modular architecture with separated concerns
 */

import {
  EvolutionState,
  EvolutionMetrics,
  CorrelationMemory,
  LearnedPattern,
  PredictionOutcome
} from './evolution/types';
import { DEFAULT_GENES, updateGenePerformance, mutateGenes, getGeneValue } from './evolution/geneManager';
import { learnFromOutcome, getBestPatterns } from './evolution/patternLearner';
import { DEFAULT_THRESHOLDS, adaptThresholds } from './evolution/thresholdAdapter';

// Re-export types for backwards compatibility
export * from './evolution/types';

class SelfEvolvingSystem {
  private state: EvolutionState;
  private fitnessHistory: number[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): EvolutionState {
    return {
      metrics: {
        generationNumber: 1,
        startedAt: Date.now(),
        totalPredictions: 0,
        successfulEvolutions: 0,
        currentFitness: 0.5,
        peakFitness: 0.5,
        learningVelocity: 0,
        adaptationRate: 0.1
      },
      genes: [...DEFAULT_GENES.map(g => ({ ...g }))],
      correlationMemory: [],
      patternLibrary: [],
      adaptiveThresholds: { ...DEFAULT_THRESHOLDS },
      recentMutations: []
    };
  }

  processOutcome(prediction: PredictionOutcome): EvolutionState {
    this.state.metrics.totalPredictions++;
    
    const wasCorrect = prediction.predicted === prediction.actual;
    const fitness = this.calculateFitness(wasCorrect, prediction.confidence);
    
    this.updateFitnessHistory(fitness);
    this.updateCurrentFitness(fitness);
    this.calculateLearningVelocity();
    
    updateGenePerformance(this.state.genes, wasCorrect, prediction.marketConditions);
    
    this.state.patternLibrary = learnFromOutcome(
      this.state.patternLibrary,
      prediction,
      wasCorrect,
      getGeneValue(this.state.genes, 'patternDecayRate')
    );
    
    this.maybeEvolve();
    this.state.adaptiveThresholds = adaptThresholds(this.state.adaptiveThresholds, this.state.metrics);
    
    return this.getState();
  }

  private calculateFitness(wasCorrect: boolean, confidence: number): number {
    return wasCorrect ? 0.5 + confidence * 0.5 : 0.5 - confidence * 0.3;
  }

  private updateFitnessHistory(fitness: number): void {
    this.fitnessHistory.push(fitness);
    if (this.fitnessHistory.length > this.maxHistorySize) {
      this.fitnessHistory.shift();
    }
  }

  private updateCurrentFitness(fitness: number): void {
    const alpha = this.state.metrics.adaptationRate;
    this.state.metrics.currentFitness = alpha * fitness + (1 - alpha) * this.state.metrics.currentFitness;
    
    if (this.state.metrics.currentFitness > this.state.metrics.peakFitness) {
      this.state.metrics.peakFitness = this.state.metrics.currentFitness;
    }
  }

  private calculateLearningVelocity(): void {
    if (this.fitnessHistory.length < 20) {
      this.state.metrics.learningVelocity = 0;
      return;
    }
    
    const recentAvg = this.fitnessHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const olderAvg = this.fitnessHistory.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
    
    this.state.metrics.learningVelocity = (recentAvg - olderAvg) * 10;
  }

  private maybeEvolve(): void {
    const shouldEvolve = 
      this.state.metrics.totalPredictions % 50 === 0 ||
      (this.state.metrics.learningVelocity < -0.05 && this.state.metrics.totalPredictions > 20);
    
    if (!shouldEvolve) return;
    
    const mutations = mutateGenes(this.state.genes, this.state.metrics.currentFitness);
    this.state.recentMutations.push(...mutations);
    this.state.recentMutations = this.state.recentMutations.slice(-20);
    
    this.state.metrics.generationNumber++;
    this.state.metrics.successfulEvolutions++;
  }

  getGeneValue(name: string): number {
    return getGeneValue(this.state.genes, name);
  }

  getBestPatterns(limit: number = 5): LearnedPattern[] {
    return getBestPatterns(this.state.patternLibrary, limit);
  }

  updateCorrelationMemory(market1: string, market2: string, observed: number): void {
    const existing = this.state.correlationMemory.find(
      m => (m.market1 === market1 && m.market2 === market2) ||
           (m.market1 === market2 && m.market2 === market1)
    );
    
    if (existing) {
      existing.observedCorrelations.push(observed);
      if (existing.observedCorrelations.length > 100) {
        existing.observedCorrelations.shift();
      }
      existing.actualCorrelation = observed;
      existing.accuracy = 1 - Math.abs(existing.predictedCorrelation - observed);
      existing.lastUpdated = Date.now();
    } else {
      this.state.correlationMemory.push({
        market1,
        market2,
        observedCorrelations: [observed],
        predictedCorrelation: observed,
        actualCorrelation: observed,
        accuracy: 1,
        lastUpdated: Date.now()
      });
    }
  }

  getState(): EvolutionState {
    return { ...this.state };
  }

  getEvolutionSummary(): {
    generation: number;
    fitness: number;
    velocity: number;
    topGenes: Array<{ name: string; value: number; impact: number }>;
    patternCount: number;
    bestPatternAccuracy: number;
  } {
    const bestPattern = this.getBestPatterns(1)[0];
    
    return {
      generation: this.state.metrics.generationNumber,
      fitness: this.state.metrics.currentFitness,
      velocity: this.state.metrics.learningVelocity,
      topGenes: this.state.genes
        .sort((a, b) => Math.abs(b.performanceImpact) - Math.abs(a.performanceImpact))
        .slice(0, 3)
        .map(g => ({ name: g.name, value: g.value, impact: g.performanceImpact })),
      patternCount: this.state.patternLibrary.length,
      bestPatternAccuracy: bestPattern?.successRate ?? 0
    };
  }
}

export const selfEvolvingSystem = new SelfEvolvingSystem();
