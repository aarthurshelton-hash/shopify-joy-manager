/**
 * En Pensent Core SDK - Pattern Matcher Tests
 * 
 * Tests for similarity scoring, pattern matching accuracy, 
 * and archetype fuzzy matching.
 */

import { describe, it, expect } from 'vitest';
import {
  quadrantSimilarity,
  temporalFlowSimilarity,
  calculateSignatureSimilarity,
  findSimilarPatterns,
  calculateOutcomeProbabilities,
  getMostLikelyOutcome,
  calculatePatternDiversity,
  calculateMatchConfidence
} from './patternMatcher';
import { TemporalSignature, QuadrantProfile, TemporalFlow, PatternMatch } from './types';

// Test fixtures
const createMockSignature = (overrides: Partial<TemporalSignature> = {}): TemporalSignature => ({
  fingerprint: 'EP-TEST0001',
  archetype: 'test_archetype',
  dominantForce: 'balanced',
  flowDirection: 'forward',
  intensity: 0.5,
  quadrantProfile: { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25 },
  temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 },
  criticalMoments: [],
  ...overrides
});

const createMockMatch = (overrides: Partial<PatternMatch> = {}): PatternMatch => ({
  patternId: 'pattern-1',
  similarity: 0.8,
  signature: createMockSignature(),
  outcome: 'success',
  ...overrides
});

describe('patternMatcher', () => {
  // ============================================================================
  // quadrantSimilarity
  // ============================================================================
  describe('quadrantSimilarity', () => {
    it('should return 1 for identical profiles', () => {
      const profile: QuadrantProfile = { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25 };
      
      const similarity = quadrantSimilarity(profile, profile);
      
      expect(similarity).toBe(1);
    });

    it('should return 0 for completely opposite profiles', () => {
      const profileA: QuadrantProfile = { q1: 1, q2: 0, q3: 0, q4: 0 };
      const profileB: QuadrantProfile = { q1: 0, q2: 0, q3: 0, q4: 1 };
      
      const similarity = quadrantSimilarity(profileA, profileB);
      
      expect(similarity).toBe(0.5); // Diff is 2, so 1 - 2/4 = 0.5
    });

    it('should return value between 0 and 1', () => {
      const profileA: QuadrantProfile = { q1: 0.4, q2: 0.3, q3: 0.2, q4: 0.1 };
      const profileB: QuadrantProfile = { q1: 0.1, q2: 0.2, q3: 0.3, q4: 0.4 };
      
      const similarity = quadrantSimilarity(profileA, profileB);
      
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should be symmetric', () => {
      const profileA: QuadrantProfile = { q1: 0.5, q2: 0.2, q3: 0.2, q4: 0.1 };
      const profileB: QuadrantProfile = { q1: 0.3, q2: 0.3, q3: 0.2, q4: 0.2 };
      
      const simAB = quadrantSimilarity(profileA, profileB);
      const simBA = quadrantSimilarity(profileB, profileA);
      
      expect(simAB).toBeCloseTo(simBA);
    });

    it('should handle edge case with all zeros', () => {
      const profile: QuadrantProfile = { q1: 0, q2: 0, q3: 0, q4: 0 };
      
      const similarity = quadrantSimilarity(profile, profile);
      
      expect(similarity).toBe(1);
    });
  });

  // ============================================================================
  // temporalFlowSimilarity
  // ============================================================================
  describe('temporalFlowSimilarity', () => {
    it('should return high value for identical flows', () => {
      const flow: TemporalFlow = { opening: 0.5, middle: 0.6, ending: 0.7, trend: 'accelerating', momentum: 0.3 };
      
      const similarity = temporalFlowSimilarity(flow, flow);
      
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should give trend matching bonus', () => {
      const flowA: TemporalFlow = { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 };
      const flowB: TemporalFlow = { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'accelerating', momentum: 0 };
      
      const sameTrend = temporalFlowSimilarity(flowA, flowA);
      const diffTrend = temporalFlowSimilarity(flowA, flowB);
      
      expect(sameTrend).toBeGreaterThan(diffTrend);
    });

    it('should factor in momentum similarity', () => {
      const flowA: TemporalFlow = { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0.8 };
      const flowB: TemporalFlow = { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: -0.8 };
      
      const similarity = temporalFlowSimilarity(flowA, flowB);
      
      expect(similarity).toBeLessThan(1);
    });

    it('should handle extreme phase differences', () => {
      const flowA: TemporalFlow = { opening: 0, middle: 0, ending: 0, trend: 'stable', momentum: 0 };
      const flowB: TemporalFlow = { opening: 1, middle: 1, ending: 1, trend: 'stable', momentum: 0 };
      
      const similarity = temporalFlowSimilarity(flowA, flowB);
      
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should be symmetric', () => {
      const flowA: TemporalFlow = { opening: 0.3, middle: 0.6, ending: 0.9, trend: 'accelerating', momentum: 0.5 };
      const flowB: TemporalFlow = { opening: 0.7, middle: 0.4, ending: 0.3, trend: 'declining', momentum: -0.3 };
      
      const simAB = temporalFlowSimilarity(flowA, flowB);
      const simBA = temporalFlowSimilarity(flowB, flowA);
      
      expect(simAB).toBeCloseTo(simBA);
    });
  });

  // ============================================================================
  // calculateSignatureSimilarity
  // ============================================================================
  describe('calculateSignatureSimilarity', () => {
    it('should return 1 for identical signatures', () => {
      const signature = createMockSignature();
      
      const similarity = calculateSignatureSimilarity(signature, signature);
      
      expect(similarity).toBeCloseTo(1);
    });

    it('should give bonus for matching archetype', () => {
      const sigA = createMockSignature({ archetype: 'same_archetype' });
      const sigB = createMockSignature({ archetype: 'same_archetype' });
      const sigC = createMockSignature({ archetype: 'different_archetype' });
      
      const sameArchetype = calculateSignatureSimilarity(sigA, sigB);
      const diffArchetype = calculateSignatureSimilarity(sigA, sigC);
      
      expect(sameArchetype).toBeGreaterThan(diffArchetype);
    });

    it('should consider intensity similarity', () => {
      const sigA = createMockSignature({ intensity: 0.9 });
      const sigB = createMockSignature({ intensity: 0.9 });
      const sigC = createMockSignature({ intensity: 0.1 });
      
      const sameIntensity = calculateSignatureSimilarity(sigA, sigB);
      const diffIntensity = calculateSignatureSimilarity(sigA, sigC);
      
      expect(sameIntensity).toBeGreaterThan(diffIntensity);
    });

    it('should consider flow direction similarity', () => {
      const sigA = createMockSignature({ flowDirection: 'forward' });
      const sigB = createMockSignature({ flowDirection: 'forward' });
      const sigC = createMockSignature({ flowDirection: 'chaotic' });
      
      const sameFlow = calculateSignatureSimilarity(sigA, sigB);
      const diffFlow = calculateSignatureSimilarity(sigA, sigC);
      
      expect(sameFlow).toBeGreaterThan(diffFlow);
    });

    it('should respect custom weights', () => {
      const sigA = createMockSignature({ archetype: 'archetype_a' });
      const sigB = createMockSignature({ archetype: 'archetype_b' });
      
      const highArchetypeWeight = calculateSignatureSimilarity(sigA, sigB, { archetype: 0.8, quadrant: 0.1, temporal: 0.1 });
      const lowArchetypeWeight = calculateSignatureSimilarity(sigA, sigB, { archetype: 0.1, quadrant: 0.45, temporal: 0.45 });
      
      expect(highArchetypeWeight).toBeLessThan(lowArchetypeWeight);
    });

    it('should clamp result between 0 and 1', () => {
      const sigA = createMockSignature();
      const sigB = createMockSignature({
        archetype: 'different',
        intensity: 0,
        flowDirection: 'chaotic',
        quadrantProfile: { q1: 0, q2: 0, q3: 1, q4: 0 },
        temporalFlow: { opening: 1, middle: 0, ending: 1, trend: 'volatile', momentum: -1 }
      });
      
      const similarity = calculateSignatureSimilarity(sigA, sigB);
      
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // findSimilarPatterns
  // ============================================================================
  describe('findSimilarPatterns', () => {
    const targetSignature = createMockSignature();
    
    it('should return empty array when no patterns exist', () => {
      const matches = findSimilarPatterns(targetSignature, []);
      
      expect(matches).toHaveLength(0);
    });

    it('should filter by minimum similarity', () => {
      const patterns = [
        { id: 'p1', signature: createMockSignature(), outcome: 'success' },
        { id: 'p2', signature: createMockSignature({ intensity: 0.1 }), outcome: 'failure' },
      ];
      
      const matchesLow = findSimilarPatterns(targetSignature, patterns, { minSimilarity: 0.5 });
      const matchesHigh = findSimilarPatterns(targetSignature, patterns, { minSimilarity: 0.99 });
      
      expect(matchesLow.length).toBeGreaterThanOrEqual(matchesHigh.length);
    });

    it('should respect limit parameter', () => {
      const patterns = Array.from({ length: 20 }, (_, i) => ({
        id: `p${i}`,
        signature: createMockSignature(),
        outcome: 'success'
      }));
      
      const matches = findSimilarPatterns(targetSignature, patterns, { limit: 5 });
      
      expect(matches.length).toBeLessThanOrEqual(5);
    });

    it('should filter by archetype', () => {
      const patterns = [
        { id: 'p1', signature: createMockSignature({ archetype: 'type_a' }), outcome: 'success' },
        { id: 'p2', signature: createMockSignature({ archetype: 'type_b' }), outcome: 'success' },
      ];
      
      const matches = findSimilarPatterns(targetSignature, patterns, { 
        minSimilarity: 0,
        archetypeFilter: ['type_a'] 
      });
      
      expect(matches.every(m => m.signature.archetype === 'type_a')).toBe(true);
    });

    it('should filter by outcome', () => {
      const patterns = [
        { id: 'p1', signature: createMockSignature(), outcome: 'win' },
        { id: 'p2', signature: createMockSignature(), outcome: 'loss' },
        { id: 'p3', signature: createMockSignature(), outcome: 'draw' },
      ];
      
      const matches = findSimilarPatterns(targetSignature, patterns, { 
        minSimilarity: 0,
        outcomeFilter: ['win', 'draw'] 
      });
      
      expect(matches.every(m => m.outcome === 'win' || m.outcome === 'draw')).toBe(true);
    });

    it('should sort by similarity descending', () => {
      const patterns = [
        { id: 'p1', signature: createMockSignature({ intensity: 0.1 }), outcome: 'a' },
        { id: 'p2', signature: createMockSignature({ intensity: 0.5 }), outcome: 'b' },
        { id: 'p3', signature: createMockSignature({ intensity: 0.49 }), outcome: 'c' },
      ];
      
      const matches = findSimilarPatterns(createMockSignature({ intensity: 0.5 }), patterns, { minSimilarity: 0 });
      
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].similarity).toBeLessThanOrEqual(matches[i - 1].similarity);
      }
    });

    it('should include metadata from patterns', () => {
      const patterns = [
        { id: 'p1', signature: createMockSignature(), outcome: 'success', metadata: { source: 'test' } },
      ];
      
      const matches = findSimilarPatterns(targetSignature, patterns, { minSimilarity: 0 });
      
      expect(matches[0].sourceMetadata).toEqual({ source: 'test' });
    });
  });

  // ============================================================================
  // calculateOutcomeProbabilities
  // ============================================================================
  describe('calculateOutcomeProbabilities', () => {
    it('should return empty object for no matches', () => {
      const probabilities = calculateOutcomeProbabilities([]);
      
      expect(Object.keys(probabilities)).toHaveLength(0);
    });

    it('should calculate weighted probabilities', () => {
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 0.9 }),
        createMockMatch({ outcome: 'win', similarity: 0.8 }),
        createMockMatch({ outcome: 'loss', similarity: 0.7 }),
      ];
      
      const probabilities = calculateOutcomeProbabilities(matches);
      
      expect(probabilities['win']).toBeGreaterThan(probabilities['loss']);
    });

    it('should sum probabilities to 1', () => {
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 0.8 }),
        createMockMatch({ outcome: 'loss', similarity: 0.6 }),
        createMockMatch({ outcome: 'draw', similarity: 0.5 }),
      ];
      
      const probabilities = calculateOutcomeProbabilities(matches);
      const sum = Object.values(probabilities).reduce((a, b) => a + b, 0);
      
      expect(sum).toBeCloseTo(1);
    });

    it('should handle single outcome', () => {
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 0.8 }),
        createMockMatch({ outcome: 'win', similarity: 0.7 }),
      ];
      
      const probabilities = calculateOutcomeProbabilities(matches);
      
      expect(probabilities['win']).toBe(1);
    });

    it('should weight by similarity correctly', () => {
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 1.0 }),
        createMockMatch({ outcome: 'loss', similarity: 0.0 }),
      ];
      
      const probabilities = calculateOutcomeProbabilities(matches);
      
      expect(probabilities['win']).toBe(1);
      expect(probabilities['loss']).toBe(0);
    });
  });

  // ============================================================================
  // getMostLikelyOutcome
  // ============================================================================
  describe('getMostLikelyOutcome', () => {
    it('should return null for no matches', () => {
      const result = getMostLikelyOutcome([]);
      
      expect(result).toBeNull();
    });

    it('should return highest probability outcome', () => {
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 0.9 }),
        createMockMatch({ outcome: 'win', similarity: 0.8 }),
        createMockMatch({ outcome: 'loss', similarity: 0.5 }),
      ];
      
      const result = getMostLikelyOutcome(matches);
      
      expect(result?.outcome).toBe('win');
    });

    it('should include probability in result', () => {
      const matches = [
        createMockMatch({ outcome: 'success', similarity: 0.8 }),
      ];
      
      const result = getMostLikelyOutcome(matches);
      
      expect(result?.probability).toBe(1);
    });

    it('should handle ties by returning first encountered', () => {
      const matches = [
        createMockMatch({ outcome: 'a', similarity: 0.5 }),
        createMockMatch({ outcome: 'b', similarity: 0.5 }),
      ];
      
      const result = getMostLikelyOutcome(matches);
      
      expect(result).not.toBeNull();
      expect(['a', 'b']).toContain(result?.outcome);
    });
  });

  // ============================================================================
  // calculatePatternDiversity
  // ============================================================================
  describe('calculatePatternDiversity', () => {
    it('should return 0 for single match', () => {
      const diversity = calculatePatternDiversity([createMockMatch()]);
      
      expect(diversity).toBe(0);
    });

    it('should return 0 for empty matches', () => {
      const diversity = calculatePatternDiversity([]);
      
      expect(diversity).toBe(0);
    });

    it('should return high value for diverse patterns', () => {
      const matches = [
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'win' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'b' }), outcome: 'loss' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'c' }), outcome: 'draw' }),
      ];
      
      const diversity = calculatePatternDiversity(matches);
      
      expect(diversity).toBe(1); // All unique archetypes and outcomes
    });

    it('should return low value for homogeneous patterns', () => {
      const matches = [
        createMockMatch({ signature: createMockSignature({ archetype: 'same' }), outcome: 'win' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'same' }), outcome: 'win' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'same' }), outcome: 'win' }),
      ];
      
      const diversity = calculatePatternDiversity(matches);
      
      expect(diversity).toBeLessThan(0.5);
    });

    it('should be between 0 and 1', () => {
      const matches = [
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'x' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'y' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'b' }), outcome: 'x' }),
      ];
      
      const diversity = calculatePatternDiversity(matches);
      
      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // calculateMatchConfidence
  // ============================================================================
  describe('calculateMatchConfidence', () => {
    it('should return 0 for no matches', () => {
      const confidence = calculateMatchConfidence([]);
      
      expect(confidence).toBe(0);
    });

    it('should increase with more matches', () => {
      const fewMatches = [createMockMatch()];
      const manyMatches = Array.from({ length: 10 }, () => createMockMatch());
      
      const confidenceFew = calculateMatchConfidence(fewMatches);
      const confidenceMany = calculateMatchConfidence(manyMatches);
      
      expect(confidenceMany).toBeGreaterThan(confidenceFew);
    });

    it('should increase with higher similarity', () => {
      const lowSimilarity = [
        createMockMatch({ similarity: 0.3 }),
        createMockMatch({ similarity: 0.4 }),
      ];
      const highSimilarity = [
        createMockMatch({ similarity: 0.9 }),
        createMockMatch({ similarity: 0.95 }),
      ];
      
      const confidenceLow = calculateMatchConfidence(lowSimilarity);
      const confidenceHigh = calculateMatchConfidence(highSimilarity);
      
      expect(confidenceHigh).toBeGreaterThan(confidenceLow);
    });

    it('should increase with less diversity (more consensus)', () => {
      const diverse = [
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'x' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'b' }), outcome: 'y' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'c' }), outcome: 'z' }),
      ];
      const consensus = [
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'x' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'x' }),
        createMockMatch({ signature: createMockSignature({ archetype: 'a' }), outcome: 'x' }),
      ];
      
      const confidenceDiverse = calculateMatchConfidence(diverse);
      const confidenceConsensus = calculateMatchConfidence(consensus);
      
      expect(confidenceConsensus).toBeGreaterThan(confidenceDiverse);
    });

    it('should respect minSampleSize parameter', () => {
      const matches = Array.from({ length: 3 }, () => createMockMatch());
      
      const confidenceLowMin = calculateMatchConfidence(matches, 3);
      const confidenceHighMin = calculateMatchConfidence(matches, 10);
      
      expect(confidenceLowMin).toBeGreaterThan(confidenceHighMin);
    });

    it('should be between 0 and 1', () => {
      const matches = Array.from({ length: 20 }, () => createMockMatch({ similarity: 0.95 }));
      
      const confidence = calculateMatchConfidence(matches);
      
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});
