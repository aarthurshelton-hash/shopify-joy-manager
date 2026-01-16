/**
 * En Pensent Core SDK - Pattern Matching
 * 
 * Universal algorithms for finding similar patterns and calculating similarity
 */

import { 
  TemporalSignature, 
  PatternMatch, 
  PatternSearchCriteria,
  QuadrantProfile,
  TemporalFlow
} from './types';

/**
 * Calculate similarity between two quadrant profiles
 */
export function quadrantSimilarity(a: QuadrantProfile, b: QuadrantProfile): number {
  const diff = 
    Math.abs(a.q1 - b.q1) +
    Math.abs(a.q2 - b.q2) +
    Math.abs(a.q3 - b.q3) +
    Math.abs(a.q4 - b.q4);
  
  // Maximum possible difference is 4 (each quadrant can differ by 1)
  return 1 - (diff / 4);
}

/**
 * Calculate similarity between two temporal flows
 */
export function temporalFlowSimilarity(a: TemporalFlow, b: TemporalFlow): number {
  const phaseDiff = 
    Math.abs(a.opening - b.opening) +
    Math.abs(a.middle - b.middle) +
    Math.abs(a.ending - b.ending);
  
  const phaseSimilarity = 1 - (phaseDiff / 3);
  
  // Trend matching bonus
  const trendBonus = a.trend === b.trend ? 0.2 : 0;
  
  // Momentum similarity
  const momentumSimilarity = 1 - Math.abs(a.momentum - b.momentum) / 2;
  
  return Math.min(1, (phaseSimilarity * 0.5) + (momentumSimilarity * 0.3) + trendBonus);
}

/**
 * Calculate overall similarity between two signatures
 */
export function calculateSignatureSimilarity(
  a: TemporalSignature,
  b: TemporalSignature,
  weights: {
    archetype?: number;
    quadrant?: number;
    temporal?: number;
    intensity?: number;
    flow?: number;
  } = {}
): number {
  const {
    archetype: archetypeWeight = 0.25,
    quadrant: quadrantWeight = 0.25,
    temporal: temporalWeight = 0.25,
    intensity: intensityWeight = 0.15,
    flow: flowWeight = 0.10
  } = weights;
  
  // Archetype similarity (exact match or related)
  const archetypeSimilarity = a.archetype === b.archetype ? 1 : 0.5;
  
  // Quadrant profile similarity
  const quadrantSim = quadrantSimilarity(a.quadrantProfile, b.quadrantProfile);
  
  // Temporal flow similarity
  const temporalSim = temporalFlowSimilarity(a.temporalFlow, b.temporalFlow);
  
  // Intensity similarity
  const intensitySim = 1 - Math.abs(a.intensity - b.intensity);
  
  // Flow direction similarity
  const flowSim = a.flowDirection === b.flowDirection ? 1 : 
                  (a.flowDirection === 'chaotic' || b.flowDirection === 'chaotic') ? 0.3 : 0.5;
  
  // Weighted combination
  const similarity = 
    (archetypeSimilarity * archetypeWeight) +
    (quadrantSim * quadrantWeight) +
    (temporalSim * temporalWeight) +
    (intensitySim * intensityWeight) +
    (flowSim * flowWeight);
  
  return Math.min(1, Math.max(0, similarity));
}

/**
 * Find similar patterns from a collection
 */
export function findSimilarPatterns(
  targetSignature: TemporalSignature,
  patterns: { id: string; signature: TemporalSignature; outcome: string; metadata?: Record<string, unknown> }[],
  criteria: Partial<PatternSearchCriteria> = {}
): PatternMatch[] {
  const {
    minSimilarity = 0.5,
    limit = 10,
    archetypeFilter,
    outcomeFilter
  } = criteria;
  
  const matches: PatternMatch[] = [];
  
  for (const pattern of patterns) {
    // Apply filters
    if (archetypeFilter && archetypeFilter.length > 0) {
      if (!archetypeFilter.includes(pattern.signature.archetype)) {
        continue;
      }
    }
    
    if (outcomeFilter && outcomeFilter.length > 0) {
      if (!outcomeFilter.includes(pattern.outcome)) {
        continue;
      }
    }
    
    // Calculate similarity
    const similarity = calculateSignatureSimilarity(targetSignature, pattern.signature);
    
    if (similarity >= minSimilarity) {
      matches.push({
        patternId: pattern.id,
        similarity,
        signature: pattern.signature,
        outcome: pattern.outcome,
        sourceMetadata: pattern.metadata
      });
    }
  }
  
  // Sort by similarity descending
  matches.sort((a, b) => b.similarity - a.similarity);
  
  // Limit results
  return matches.slice(0, limit);
}

/**
 * Calculate outcome probabilities from pattern matches
 */
export function calculateOutcomeProbabilities(
  matches: PatternMatch[]
): Record<string, number> {
  if (matches.length === 0) {
    return {};
  }
  
  const outcomeCounts: Record<string, { count: number; weightedCount: number }> = {};
  let totalWeight = 0;
  
  for (const match of matches) {
    if (!outcomeCounts[match.outcome]) {
      outcomeCounts[match.outcome] = { count: 0, weightedCount: 0 };
    }
    
    outcomeCounts[match.outcome].count++;
    outcomeCounts[match.outcome].weightedCount += match.similarity;
    totalWeight += match.similarity;
  }
  
  const probabilities: Record<string, number> = {};
  
  for (const [outcome, data] of Object.entries(outcomeCounts)) {
    probabilities[outcome] = totalWeight > 0 ? data.weightedCount / totalWeight : 0;
  }
  
  return probabilities;
}

/**
 * Get the most likely outcome from pattern matches
 */
export function getMostLikelyOutcome(
  matches: PatternMatch[]
): { outcome: string; probability: number } | null {
  const probabilities = calculateOutcomeProbabilities(matches);
  
  let bestOutcome: string | null = null;
  let bestProbability = 0;
  
  for (const [outcome, probability] of Object.entries(probabilities)) {
    if (probability > bestProbability) {
      bestOutcome = outcome;
      bestProbability = probability;
    }
  }
  
  if (bestOutcome === null) {
    return null;
  }
  
  return { outcome: bestOutcome, probability: bestProbability };
}

/**
 * Calculate pattern diversity score (how varied the matches are)
 */
export function calculatePatternDiversity(matches: PatternMatch[]): number {
  if (matches.length <= 1) return 0;
  
  const uniqueArchetypes = new Set(matches.map(m => m.signature.archetype));
  const uniqueOutcomes = new Set(matches.map(m => m.outcome));
  
  const archetypeDiversity = uniqueArchetypes.size / matches.length;
  const outcomeDiversity = uniqueOutcomes.size / matches.length;
  
  return (archetypeDiversity + outcomeDiversity) / 2;
}

/**
 * Calculate confidence based on pattern matches
 */
export function calculateMatchConfidence(
  matches: PatternMatch[],
  minSampleSize: number = 5
): number {
  if (matches.length === 0) return 0;
  
  // Factor 1: Sample size
  const sampleSizeConfidence = Math.min(1, matches.length / minSampleSize);
  
  // Factor 2: Average similarity
  const avgSimilarity = matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length;
  
  // Factor 3: Outcome consensus (low diversity = high confidence)
  const diversity = calculatePatternDiversity(matches);
  const consensusConfidence = 1 - diversity;
  
  // Weighted combination
  return (sampleSizeConfidence * 0.3) + (avgSimilarity * 0.4) + (consensusConfidence * 0.3);
}
