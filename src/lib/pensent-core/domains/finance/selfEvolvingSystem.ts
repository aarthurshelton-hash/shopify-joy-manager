/**
 * Self-Evolving Learning System
 * Continuously adapts and improves based on prediction outcomes
 */

export interface EvolutionMetrics {
  generationNumber: number;
  startedAt: number;
  totalPredictions: number;
  successfulEvolutions: number;
  currentFitness: number;
  peakFitness: number;
  learningVelocity: number; // How fast we're improving
  adaptationRate: number; // How quickly we adjust to new patterns
}

export interface LearningGene {
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  mutationRate: number;
  lastMutation: number;
  performanceImpact: number; // -1 to 1
}

export interface EvolutionState {
  metrics: EvolutionMetrics;
  genes: LearningGene[];
  correlationMemory: CorrelationMemory[];
  patternLibrary: LearnedPattern[];
  adaptiveThresholds: AdaptiveThresholds;
  recentMutations: Mutation[];
}

export interface CorrelationMemory {
  market1: string;
  market2: string;
  observedCorrelations: number[];
  predictedCorrelation: number;
  actualCorrelation: number;
  accuracy: number;
  lastUpdated: number;
}

export interface LearnedPattern {
  id: string;
  name: string;
  conditions: PatternCondition[];
  predictedOutcome: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  occurrences: number;
  successRate: number;
  discoveredAt: number;
  lastSeen: number;
}

export interface PatternCondition {
  market: string;
  indicator: 'price_change' | 'volume_spike' | 'correlation_shift' | 'volatility';
  operator: '>' | '<' | '=' | 'between';
  value: number | [number, number];
}

export interface AdaptiveThresholds {
  confidenceMinimum: number;
  correlationSignificance: number;
  volumeSpikeFactor: number;
  volatilityAdjustment: number;
  predictionHorizonMs: number;
}

export interface Mutation {
  gene: string;
  previousValue: number;
  newValue: number;
  timestamp: number;
  reason: string;
  resultingFitness: number;
}

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
      genes: [
        { name: 'correlationWeight', value: 0.3, minValue: 0.1, maxValue: 0.6, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
        { name: 'momentumWeight', value: 0.25, minValue: 0.1, maxValue: 0.5, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
        { name: 'volatilityWeight', value: 0.2, minValue: 0.05, maxValue: 0.4, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
        { name: 'sentimentWeight', value: 0.15, minValue: 0.05, maxValue: 0.3, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
        { name: 'leadingIndicatorLag', value: 3, minValue: 1, maxValue: 10, mutationRate: 0.05, lastMutation: 0, performanceImpact: 0 },
        { name: 'confidenceThreshold', value: 0.6, minValue: 0.4, maxValue: 0.9, mutationRate: 0.01, lastMutation: 0, performanceImpact: 0 },
        { name: 'adaptationSpeed', value: 0.1, minValue: 0.01, maxValue: 0.3, mutationRate: 0.01, lastMutation: 0, performanceImpact: 0 },
        { name: 'patternDecayRate', value: 0.95, minValue: 0.8, maxValue: 0.99, mutationRate: 0.005, lastMutation: 0, performanceImpact: 0 },
      ],
      correlationMemory: [],
      patternLibrary: [],
      adaptiveThresholds: {
        confidenceMinimum: 0.55,
        correlationSignificance: 0.3,
        volumeSpikeFactor: 1.5,
        volatilityAdjustment: 1.0,
        predictionHorizonMs: 5000
      },
      recentMutations: []
    };
  }

  // Process prediction outcome and evolve
  processOutcome(prediction: {
    predicted: 'up' | 'down' | 'neutral';
    actual: 'up' | 'down' | 'neutral';
    confidence: number;
    marketConditions: {
      correlationStrength: number;
      volatility: number;
      momentum: number;
      leadingSignals: number;
    };
  }): EvolutionState {
    this.state.metrics.totalPredictions++;
    
    const wasCorrect = prediction.predicted === prediction.actual;
    const fitness = this.calculateFitness(wasCorrect, prediction.confidence);
    
    // Update fitness history
    this.fitnessHistory.push(fitness);
    if (this.fitnessHistory.length > this.maxHistorySize) {
      this.fitnessHistory.shift();
    }
    
    // Update current fitness (exponential moving average)
    const alpha = this.state.metrics.adaptationRate;
    this.state.metrics.currentFitness = 
      alpha * fitness + (1 - alpha) * this.state.metrics.currentFitness;
    
    // Track peak fitness
    if (this.state.metrics.currentFitness > this.state.metrics.peakFitness) {
      this.state.metrics.peakFitness = this.state.metrics.currentFitness;
    }
    
    // Calculate learning velocity
    this.calculateLearningVelocity();
    
    // Update gene performance impacts
    this.updateGenePerformance(wasCorrect, prediction.marketConditions);
    
    // Learn patterns
    this.learnFromOutcome(prediction, wasCorrect);
    
    // Evolve if conditions are right
    this.maybeEvolve();
    
    // Adapt thresholds
    this.adaptThresholds();
    
    return this.getState();
  }

  private calculateFitness(wasCorrect: boolean, confidence: number): number {
    // Reward correct predictions scaled by confidence
    // Penalize incorrect predictions, more if confident
    if (wasCorrect) {
      return 0.5 + confidence * 0.5;
    } else {
      return 0.5 - confidence * 0.3;
    }
  }

  private calculateLearningVelocity(): void {
    if (this.fitnessHistory.length < 20) {
      this.state.metrics.learningVelocity = 0;
      return;
    }
    
    // Compare recent fitness to older fitness
    const recentAvg = this.fitnessHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const olderAvg = this.fitnessHistory.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
    
    this.state.metrics.learningVelocity = (recentAvg - olderAvg) * 10; // Scale for visibility
  }

  private updateGenePerformance(wasCorrect: boolean, conditions: {
    correlationStrength: number;
    volatility: number;
    momentum: number;
    leadingSignals: number;
  }): void {
    const impact = wasCorrect ? 0.1 : -0.1;
    
    // Attribute performance to genes based on conditions
    this.state.genes.forEach(gene => {
      let geneImpact = 0;
      
      switch (gene.name) {
        case 'correlationWeight':
          geneImpact = impact * conditions.correlationStrength;
          break;
        case 'momentumWeight':
          geneImpact = impact * Math.abs(conditions.momentum);
          break;
        case 'volatilityWeight':
          geneImpact = impact * (1 - conditions.volatility); // Lower vol = clearer signals
          break;
        case 'leadingIndicatorLag':
          geneImpact = impact * conditions.leadingSignals;
          break;
        default:
          geneImpact = impact * 0.5;
      }
      
      // Exponential moving average of gene performance
      gene.performanceImpact = gene.performanceImpact * 0.95 + geneImpact * 0.05;
    });
  }

  private learnFromOutcome(prediction: {
    predicted: 'up' | 'down' | 'neutral';
    actual: 'up' | 'down' | 'neutral';
    marketConditions: {
      correlationStrength: number;
      volatility: number;
      momentum: number;
      leadingSignals: number;
    };
  }, wasCorrect: boolean): void {
    // Create or update pattern
    const patternId = this.createPatternId(prediction.marketConditions);
    const existingPattern = this.state.patternLibrary.find(p => p.id === patternId);
    
    if (existingPattern) {
      existingPattern.occurrences++;
      existingPattern.successRate = 
        (existingPattern.successRate * (existingPattern.occurrences - 1) + (wasCorrect ? 1 : 0)) 
        / existingPattern.occurrences;
      existingPattern.lastSeen = Date.now();
      
      // Update confidence based on occurrences and success rate
      existingPattern.confidence = Math.min(0.95, 
        existingPattern.successRate * Math.min(1, existingPattern.occurrences / 50)
      );
    } else if (this.state.patternLibrary.length < 100) {
      // Add new pattern
      this.state.patternLibrary.push({
        id: patternId,
        name: this.generatePatternName(prediction.marketConditions),
        conditions: this.extractConditions(prediction.marketConditions),
        predictedOutcome: prediction.predicted === 'up' ? 'bullish' : 
                          prediction.predicted === 'down' ? 'bearish' : 'neutral',
        confidence: 0.5,
        occurrences: 1,
        successRate: wasCorrect ? 1 : 0,
        discoveredAt: Date.now(),
        lastSeen: Date.now()
      });
    }
    
    // Decay old patterns
    this.state.patternLibrary = this.state.patternLibrary
      .map(p => ({
        ...p,
        confidence: p.confidence * this.getGeneValue('patternDecayRate')
      }))
      .filter(p => p.confidence > 0.1 || Date.now() - p.lastSeen < 3600000);
  }

  private createPatternId(conditions: { correlationStrength: number; volatility: number; momentum: number }): string {
    const c = Math.round(conditions.correlationStrength * 10);
    const v = Math.round(conditions.volatility * 10);
    const m = Math.round(conditions.momentum * 10);
    return `C${c}V${v}M${m}`;
  }

  private generatePatternName(conditions: { correlationStrength: number; volatility: number; momentum: number }): string {
    const corrDesc = conditions.correlationStrength > 0.7 ? 'High-Corr' : 
                     conditions.correlationStrength > 0.4 ? 'Mid-Corr' : 'Low-Corr';
    const volDesc = conditions.volatility > 0.7 ? 'High-Vol' : 
                    conditions.volatility > 0.4 ? 'Mid-Vol' : 'Low-Vol';
    const momDesc = conditions.momentum > 0.3 ? 'Bullish-Mom' : 
                    conditions.momentum < -0.3 ? 'Bearish-Mom' : 'Neutral-Mom';
    
    return `${corrDesc} ${volDesc} ${momDesc}`;
  }

  private extractConditions(conditions: { correlationStrength: number; volatility: number; momentum: number }): PatternCondition[] {
    return [
      { market: 'cross', indicator: 'correlation_shift', operator: 'between', value: [conditions.correlationStrength - 0.1, conditions.correlationStrength + 0.1] },
      { market: 'cross', indicator: 'volatility', operator: 'between', value: [conditions.volatility - 0.1, conditions.volatility + 0.1] },
      { market: 'cross', indicator: 'price_change', operator: conditions.momentum > 0 ? '>' : '<', value: 0 }
    ];
  }

  private maybeEvolve(): void {
    // Evolve every 50 predictions or if fitness is declining
    const shouldEvolve = 
      this.state.metrics.totalPredictions % 50 === 0 ||
      (this.state.metrics.learningVelocity < -0.05 && this.state.metrics.totalPredictions > 20);
    
    if (!shouldEvolve) return;
    
    // Mutate genes based on their performance
    this.state.genes.forEach(gene => {
      if (Math.random() < gene.mutationRate) {
        const previousValue = gene.value;
        
        // Mutation direction based on performance impact
        let mutation = (Math.random() - 0.5) * 0.1 * (gene.maxValue - gene.minValue);
        
        // If gene is performing poorly, mutate more aggressively in opposite direction
        if (gene.performanceImpact < -0.05) {
          mutation *= -2;
        }
        
        gene.value = Math.max(gene.minValue, Math.min(gene.maxValue, gene.value + mutation));
        gene.lastMutation = Date.now();
        
        // Record mutation
        this.state.recentMutations.push({
          gene: gene.name,
          previousValue,
          newValue: gene.value,
          timestamp: Date.now(),
          reason: gene.performanceImpact < 0 ? 'Poor performance' : 'Random exploration',
          resultingFitness: this.state.metrics.currentFitness
        });
      }
    });
    
    // Keep only recent mutations
    this.state.recentMutations = this.state.recentMutations.slice(-20);
    
    // Increment generation
    this.state.metrics.generationNumber++;
    this.state.metrics.successfulEvolutions++;
  }

  private adaptThresholds(): void {
    const fitness = this.state.metrics.currentFitness;
    const velocity = this.state.metrics.learningVelocity;
    
    // If doing well, be more aggressive
    if (fitness > 0.65 && velocity >= 0) {
      this.state.adaptiveThresholds.confidenceMinimum = Math.max(0.5, 
        this.state.adaptiveThresholds.confidenceMinimum - 0.01);
    }
    
    // If doing poorly, be more conservative
    if (fitness < 0.45) {
      this.state.adaptiveThresholds.confidenceMinimum = Math.min(0.75, 
        this.state.adaptiveThresholds.confidenceMinimum + 0.02);
    }
    
    // Adjust prediction horizon based on success at different timeframes
    if (velocity > 0.1) {
      // Learning well, can try shorter horizons
      this.state.adaptiveThresholds.predictionHorizonMs = Math.max(2000, 
        this.state.adaptiveThresholds.predictionHorizonMs * 0.95);
    } else if (velocity < -0.1) {
      // Struggling, use longer horizons
      this.state.adaptiveThresholds.predictionHorizonMs = Math.min(15000, 
        this.state.adaptiveThresholds.predictionHorizonMs * 1.05);
    }
  }

  // Get current gene value
  getGeneValue(name: string): number {
    return this.state.genes.find(g => g.name === name)?.value ?? 0;
  }

  // Get best patterns
  getBestPatterns(limit: number = 5): LearnedPattern[] {
    return [...this.state.patternLibrary]
      .filter(p => p.occurrences >= 5)
      .sort((a, b) => b.successRate * b.confidence - a.successRate * a.confidence)
      .slice(0, limit);
  }

  // Update correlation memory
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

  // Get evolution summary for UI
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
