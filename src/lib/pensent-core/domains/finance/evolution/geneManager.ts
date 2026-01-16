/**
 * Gene Manager - Handles gene mutations and performance tracking
 */

import { LearningGene, Mutation, MarketConditions } from './types';

export const DEFAULT_GENES: LearningGene[] = [
  { name: 'correlationWeight', value: 0.3, minValue: 0.1, maxValue: 0.6, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
  { name: 'momentumWeight', value: 0.25, minValue: 0.1, maxValue: 0.5, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
  { name: 'volatilityWeight', value: 0.2, minValue: 0.05, maxValue: 0.4, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
  { name: 'sentimentWeight', value: 0.15, minValue: 0.05, maxValue: 0.3, mutationRate: 0.02, lastMutation: 0, performanceImpact: 0 },
  { name: 'leadingIndicatorLag', value: 3, minValue: 1, maxValue: 10, mutationRate: 0.05, lastMutation: 0, performanceImpact: 0 },
  { name: 'confidenceThreshold', value: 0.6, minValue: 0.4, maxValue: 0.9, mutationRate: 0.01, lastMutation: 0, performanceImpact: 0 },
  { name: 'adaptationSpeed', value: 0.1, minValue: 0.01, maxValue: 0.3, mutationRate: 0.01, lastMutation: 0, performanceImpact: 0 },
  { name: 'patternDecayRate', value: 0.95, minValue: 0.8, maxValue: 0.99, mutationRate: 0.005, lastMutation: 0, performanceImpact: 0 },
];

export function updateGenePerformance(
  genes: LearningGene[],
  wasCorrect: boolean,
  conditions: MarketConditions
): void {
  const impact = wasCorrect ? 0.1 : -0.1;
  
  genes.forEach(gene => {
    let geneImpact = 0;
    
    switch (gene.name) {
      case 'correlationWeight':
        geneImpact = impact * conditions.correlationStrength;
        break;
      case 'momentumWeight':
        geneImpact = impact * Math.abs(conditions.momentum);
        break;
      case 'volatilityWeight':
        geneImpact = impact * (1 - conditions.volatility);
        break;
      case 'leadingIndicatorLag':
        geneImpact = impact * conditions.leadingSignals;
        break;
      default:
        geneImpact = impact * 0.5;
    }
    
    gene.performanceImpact = gene.performanceImpact * 0.95 + geneImpact * 0.05;
  });
}

export function mutateGenes(genes: LearningGene[], currentFitness: number): Mutation[] {
  const mutations: Mutation[] = [];
  
  genes.forEach(gene => {
    if (Math.random() < gene.mutationRate) {
      const previousValue = gene.value;
      
      let mutation = (Math.random() - 0.5) * 0.1 * (gene.maxValue - gene.minValue);
      
      if (gene.performanceImpact < -0.05) {
        mutation *= -2;
      }
      
      gene.value = Math.max(gene.minValue, Math.min(gene.maxValue, gene.value + mutation));
      gene.lastMutation = Date.now();
      
      mutations.push({
        gene: gene.name,
        previousValue,
        newValue: gene.value,
        timestamp: Date.now(),
        reason: gene.performanceImpact < 0 ? 'Poor performance' : 'Random exploration',
        resultingFitness: currentFitness
      });
    }
  });
  
  return mutations;
}

export function getGeneValue(genes: LearningGene[], name: string): number {
  return genes.find(g => g.name === name)?.value ?? 0;
}
