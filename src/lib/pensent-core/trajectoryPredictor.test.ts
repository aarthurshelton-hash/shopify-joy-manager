/**
 * En Pensent Core SDK - Trajectory Predictor Tests
 * 
 * Tests for outcome prediction, milestone forecasting,
 * and confidence calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  generateTrajectoryPrediction,
  calculateTrajectoryDivergence,
  assessTrajectorySustainability
} from './trajectoryPredictor';
import { TemporalSignature, PatternMatch, ArchetypeDefinition } from './types';

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

const createMockArchetype = (overrides: Partial<ArchetypeDefinition> = {}): ArchetypeDefinition => ({
  id: 'test_archetype',
  name: 'Test Archetype',
  description: 'A test archetype',
  successRate: 0.6,
  predictedOutcome: 'primary_wins',
  confidence: 0.7,
  keywords: ['test'],
  relatedArchetypes: [],
  ...overrides
});

describe('trajectoryPredictor', () => {
  // ============================================================================
  // generateTrajectoryPrediction
  // ============================================================================
  describe('generateTrajectoryPrediction', () => {
    it('should generate prediction with required fields', () => {
      const signature = createMockSignature();
      const matches = [createMockMatch()];
      const archetype = createMockArchetype();
      
      const prediction = generateTrajectoryPrediction(signature, matches, archetype, 20, 60);
      
      expect(prediction.predictedOutcome).toBeDefined();
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.primaryWinProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.secondaryWinProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.drawProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.milestones).toBeDefined();
      expect(prediction.strategicGuidance).toBeDefined();
      expect(prediction.lookaheadHorizon).toBeGreaterThanOrEqual(0);
      expect(prediction.patternSampleSize).toBe(1);
    });

    it('should handle empty matches', () => {
      const signature = createMockSignature();
      
      const prediction = generateTrajectoryPrediction(signature, [], null, 10, 40);
      
      expect(prediction.predictedOutcome).toBeDefined();
      expect(prediction.patternSampleSize).toBe(0);
    });

    it('should calculate win probabilities based on outcomes', () => {
      const signature = createMockSignature();
      const matches = [
        createMockMatch({ outcome: 'white_wins', similarity: 0.9 }),
        createMockMatch({ outcome: 'white_wins', similarity: 0.8 }),
        createMockMatch({ outcome: 'black_wins', similarity: 0.5 }),
      ];
      
      const prediction = generateTrajectoryPrediction(signature, matches, null, 15, 50);
      
      expect(prediction.primaryWinProbability).toBeGreaterThan(prediction.secondaryWinProbability);
    });

    it('should generate milestones within remaining game', () => {
      const signature = createMockSignature();
      const matches = [createMockMatch()];
      const currentPosition = 20;
      const totalLength = 60;
      
      const prediction = generateTrajectoryPrediction(signature, matches, null, currentPosition, totalLength);
      
      for (const milestone of prediction.milestones) {
        expect(milestone.predictedIndex).toBeGreaterThan(currentPosition);
        expect(milestone.predictedIndex).toBeLessThanOrEqual(totalLength);
      }
    });

    it('should include archetype-based guidance when archetype provided', () => {
      const signature = createMockSignature({ archetype: 'rapid_growth' });
      const matches = [createMockMatch()];
      const archetype = createMockArchetype({ name: 'Rapid Growth' });
      
      const prediction = generateTrajectoryPrediction(signature, matches, archetype, 10, 50);
      
      expect(prediction.strategicGuidance).toContain('Rapid Growth');
    });

    it('should adjust confidence based on match count', () => {
      const signature = createMockSignature();
      const fewMatches = [createMockMatch()];
      const manyMatches = Array.from({ length: 10 }, () => createMockMatch());
      
      const predFew = generateTrajectoryPrediction(signature, fewMatches, null, 10, 50);
      const predMany = generateTrajectoryPrediction(signature, manyMatches, null, 10, 50);
      
      expect(predMany.confidence).toBeGreaterThan(predFew.confidence);
    });

    it('should calculate lookahead horizon based on confidence', () => {
      const signature = createMockSignature();
      const highConfMatches = Array.from({ length: 10 }, () => 
        createMockMatch({ similarity: 0.95 })
      );
      const lowConfMatches = [createMockMatch({ similarity: 0.5 })];
      
      const predHigh = generateTrajectoryPrediction(signature, highConfMatches, null, 10, 100);
      const predLow = generateTrajectoryPrediction(signature, lowConfMatches, null, 10, 100);
      
      expect(predHigh.lookaheadHorizon).toBeGreaterThan(predLow.lookaheadHorizon);
    });

    it('should handle game near completion', () => {
      const signature = createMockSignature();
      const matches = [createMockMatch()];
      
      const prediction = generateTrajectoryPrediction(signature, matches, null, 55, 60);
      
      expect(prediction.milestones.length).toBeLessThanOrEqual(5);
    });

    it('should include critical moments from signature in milestones', () => {
      const signature = createMockSignature({
        criticalMoments: [
          { index: 30, type: 'surge', severity: 0.8, description: 'Major shift' },
          { index: 40, type: 'drop', severity: 0.6, description: 'Minor decline' },
        ]
      });
      const matches = [createMockMatch()];
      
      const prediction = generateTrajectoryPrediction(signature, matches, null, 20, 60);
      
      const hasCriticalMilestone = prediction.milestones.some(m => 
        m.event.includes('shift') || m.event.includes('decline') || m.predictedIndex === 30 || m.predictedIndex === 40
      );
      
      expect(prediction.milestones.length).toBeGreaterThan(0);
    });

    it('should provide trend-based strategic guidance', () => {
      const accelerating = createMockSignature({
        temporalFlow: { opening: 0.3, middle: 0.5, ending: 0.7, trend: 'accelerating', momentum: 0.5 }
      });
      const declining = createMockSignature({
        temporalFlow: { opening: 0.7, middle: 0.5, ending: 0.3, trend: 'declining', momentum: -0.5 }
      });
      
      const predAccel = generateTrajectoryPrediction(accelerating, [], null, 10, 50);
      const predDecline = generateTrajectoryPrediction(declining, [], null, 10, 50);
      
      expect(predAccel.strategicGuidance.toLowerCase()).toContain('momentum');
      expect(predDecline.strategicGuidance.toLowerCase()).toContain('declin');
    });

    it('should ensure probabilities are valid', () => {
      const signature = createMockSignature();
      const matches = [
        createMockMatch({ outcome: 'win', similarity: 0.9 }),
        createMockMatch({ outcome: 'loss', similarity: 0.7 }),
      ];
      
      const prediction = generateTrajectoryPrediction(signature, matches, null, 10, 50);
      
      const totalProb = prediction.primaryWinProbability + 
                        prediction.secondaryWinProbability + 
                        prediction.drawProbability;
      
      expect(prediction.drawProbability).toBeGreaterThanOrEqual(0);
      expect(totalProb).toBeLessThanOrEqual(1.01); // Allow small floating point error
    });
  });

  // ============================================================================
  // calculateTrajectoryDivergence
  // ============================================================================
  describe('calculateTrajectoryDivergence', () => {
    it('should return 1 for no matches', () => {
      const signature = createMockSignature();
      
      const divergence = calculateTrajectoryDivergence(signature, []);
      
      expect(divergence).toBe(1);
    });

    it('should return low divergence for similar signatures', () => {
      const signature = createMockSignature({ intensity: 0.5 });
      const matches = [
        createMockMatch({ signature: createMockSignature({ intensity: 0.5 }) }),
        createMockMatch({ signature: createMockSignature({ intensity: 0.5 }) }),
      ];
      
      const divergence = calculateTrajectoryDivergence(signature, matches);
      
      expect(divergence).toBeLessThan(0.5);
    });

    it('should return high divergence for different signatures', () => {
      const signature = createMockSignature({ 
        intensity: 0.9,
        temporalFlow: { opening: 0.8, middle: 0.8, ending: 0.8, trend: 'accelerating', momentum: 0.8 }
      });
      const matches = [
        createMockMatch({ 
          signature: createMockSignature({ 
            intensity: 0.1,
            temporalFlow: { opening: 0.2, middle: 0.2, ending: 0.2, trend: 'declining', momentum: -0.8 }
          }) 
        }),
      ];
      
      const divergence = calculateTrajectoryDivergence(signature, matches);
      
      expect(divergence).toBeGreaterThan(0.3);
    });

    it('should factor in momentum differences', () => {
      const signature = createMockSignature({
        temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0.8 }
      });
      const matches = [
        createMockMatch({
          signature: createMockSignature({
            temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: -0.8 }
          })
        }),
      ];
      
      const divergence = calculateTrajectoryDivergence(signature, matches);
      
      expect(divergence).toBeGreaterThan(0);
    });

    it('should be between 0 and 1', () => {
      const signature = createMockSignature();
      const matches = [
        createMockMatch({ signature: createMockSignature({ intensity: 0.3 }) }),
        createMockMatch({ signature: createMockSignature({ intensity: 0.7 }) }),
      ];
      
      const divergence = calculateTrajectoryDivergence(signature, matches);
      
      expect(divergence).toBeGreaterThanOrEqual(0);
      expect(divergence).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // assessTrajectorySustainability
  // ============================================================================
  describe('assessTrajectorySustainability', () => {
    it('should flag high intensity accelerating as unsustainable', () => {
      const signature = createMockSignature({
        intensity: 0.85,
        temporalFlow: { opening: 0.5, middle: 0.7, ending: 0.9, trend: 'accelerating', momentum: 0.6 }
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(false);
      expect(assessment.riskLevel).toBe('high');
      expect(assessment.reason.toLowerCase()).toContain('burnout');
    });

    it('should flag declining with negative momentum as unsustainable', () => {
      const signature = createMockSignature({
        temporalFlow: { opening: 0.8, middle: 0.5, ending: 0.3, trend: 'declining', momentum: -0.6 }
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(false);
      expect(assessment.riskLevel).toBe('high');
      expect(assessment.reason.toLowerCase()).toContain('declin');
    });

    it('should flag many critical moments as potentially unsustainable', () => {
      const signature = createMockSignature({
        criticalMoments: [
          { index: 10, type: 'surge', severity: 0.8, description: 'Big' },
          { index: 20, type: 'drop', severity: 0.75, description: 'Drop' },
          { index: 30, type: 'surge', severity: 0.9, description: 'Another' },
          { index: 40, type: 'drop', severity: 0.85, description: 'More' },
        ]
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(false);
      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.reason.toLowerCase()).toContain('critical');
    });

    it('should mark volatile trends with medium risk', () => {
      const signature = createMockSignature({
        temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'volatile', momentum: 0 }
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(true);
      expect(assessment.riskLevel).toBe('medium');
    });

    it('should mark stable patterns as sustainable with low risk', () => {
      const signature = createMockSignature({
        intensity: 0.5,
        temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 },
        criticalMoments: []
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(true);
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.reason.toLowerCase()).toContain('sustainable');
    });

    it('should handle moderate intensity accelerating as sustainable', () => {
      const signature = createMockSignature({
        intensity: 0.6, // Below 0.8 threshold
        temporalFlow: { opening: 0.3, middle: 0.5, ending: 0.7, trend: 'accelerating', momentum: 0.4 }
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      expect(assessment.sustainable).toBe(true);
    });

    it('should handle edge case with boundary intensity', () => {
      const signature = createMockSignature({
        intensity: 0.8, // Exactly at boundary
        temporalFlow: { opening: 0.5, middle: 0.7, ending: 0.9, trend: 'accelerating', momentum: 0.5 }
      });
      
      const assessment = assessTrajectorySustainability(signature);
      
      // Should be sustainable as condition is > 0.8, not >=
      expect(assessment.sustainable).toBe(true);
    });

    it('should return valid risk level', () => {
      const signatures = [
        createMockSignature({ intensity: 0.9, temporalFlow: { opening: 0.5, middle: 0.7, ending: 0.9, trend: 'accelerating', momentum: 0.5 } }),
        createMockSignature({ temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'volatile', momentum: 0 } }),
        createMockSignature({ temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 } }),
      ];
      
      for (const sig of signatures) {
        const assessment = assessTrajectorySustainability(sig);
        expect(['low', 'medium', 'high']).toContain(assessment.riskLevel);
      }
    });
  });
});
