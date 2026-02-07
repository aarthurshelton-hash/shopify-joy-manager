/**
 * En Pensent Core SDK - Signature Extractor Tests
 * 
 * Tests for fingerprint generation, temporal flow calculation, 
 * and critical moment detection.
 */

import { describe, it, expect } from 'vitest';
import {
  generateFingerprint,
  calculateQuadrantProfile,
  calculateTemporalFlow,
  detectCriticalMoments,
  calculateIntensity,
  determineDominantForce,
  determineFlowDirection,
  hashString
} from './signatureExtractor';
import { QuadrantProfile, TemporalFlow } from './types';

describe('signatureExtractor', () => {
  // ============================================================================
  // generateFingerprint
  // ============================================================================
  describe('generateFingerprint', () => {
    it('should generate a fingerprint with EP- prefix', () => {
      const quadrantProfile: QuadrantProfile = { q1: 0.3, q2: 0.2, q3: 0.25, q4: 0.25 };
      const temporalFlow: TemporalFlow = { opening: 0.5, middle: 0.6, ending: 0.4, trend: 'stable', momentum: 0 };
      
      const fingerprint = generateFingerprint(quadrantProfile, temporalFlow, 'test_archetype', 0.7);
      
      expect(fingerprint).toMatch(/^EP-[A-F0-9]{8}$/);
    });

    it('should generate deterministic fingerprints for same inputs', () => {
      const quadrantProfile: QuadrantProfile = { q1: 0.4, q2: 0.3, q3: 0.2, q4: 0.1 };
      const temporalFlow: TemporalFlow = { opening: 0.3, middle: 0.5, ending: 0.7, trend: 'accelerating', momentum: 0.5 };
      
      const fp1 = generateFingerprint(quadrantProfile, temporalFlow, 'archetype', 0.8);
      const fp2 = generateFingerprint(quadrantProfile, temporalFlow, 'archetype', 0.8);
      
      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different inputs', () => {
      const quadrantProfile: QuadrantProfile = { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25 };
      const temporalFlow: TemporalFlow = { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 };
      
      const fp1 = generateFingerprint(quadrantProfile, temporalFlow, 'alpha_type', 0.5);
      const fp2 = generateFingerprint(quadrantProfile, temporalFlow, 'beta_type', 0.5);
      
      expect(fp1).not.toBe(fp2);
    });

    it('should handle edge case with zero values', () => {
      const quadrantProfile: QuadrantProfile = { q1: 0, q2: 0, q3: 0, q4: 0 };
      const temporalFlow: TemporalFlow = { opening: 0, middle: 0, ending: 0, trend: 'stable', momentum: 0 };
      
      const fingerprint = generateFingerprint(quadrantProfile, temporalFlow, '', 0);
      
      expect(fingerprint).toMatch(/^EP-[A-F0-9]{8}$/);
    });

    it('should handle edge case with max values', () => {
      const quadrantProfile: QuadrantProfile = { q1: 1, q2: 1, q3: 1, q4: 1 };
      const temporalFlow: TemporalFlow = { opening: 1, middle: 1, ending: 1, trend: 'volatile', momentum: 1 };
      
      const fingerprint = generateFingerprint(quadrantProfile, temporalFlow, 'max_archetype', 1);
      
      expect(fingerprint).toMatch(/^EP-[A-F0-9]{8}$/);
    });
  });

  // ============================================================================
  // calculateQuadrantProfile
  // ============================================================================
  describe('calculateQuadrantProfile', () => {
    it('should calculate profile from activity distribution', () => {
      const activities = [
        { region: 'q1' as const, weight: 10 },
        { region: 'q2' as const, weight: 20 },
        { region: 'q3' as const, weight: 30 },
        { region: 'q4' as const, weight: 40 },
      ];
      
      const profile = calculateQuadrantProfile(activities);
      
      expect(profile.q1).toBeCloseTo(0.1);
      expect(profile.q2).toBeCloseTo(0.2);
      expect(profile.q3).toBeCloseTo(0.3);
      expect(profile.q4).toBeCloseTo(0.4);
    });

    it('should return equal distribution for empty activities', () => {
      const profile = calculateQuadrantProfile([]);
      
      expect(profile.q1).toBe(0.25);
      expect(profile.q2).toBe(0.25);
      expect(profile.q3).toBe(0.25);
      expect(profile.q4).toBe(0.25);
    });

    it('should handle center region', () => {
      const activities = [
        { region: 'center' as const, weight: 50 },
        { region: 'q1' as const, weight: 50 },
      ];
      
      const profile = calculateQuadrantProfile(activities);
      
      expect(profile.center).toBeCloseTo(0.5);
      expect(profile.q1).toBeCloseTo(0.5);
    });

    it('should normalize to sum of 1', () => {
      const activities = [
        { region: 'q1' as const, weight: 100 },
        { region: 'q2' as const, weight: 200 },
        { region: 'q3' as const, weight: 300 },
        { region: 'q4' as const, weight: 400 },
      ];
      
      const profile = calculateQuadrantProfile(activities);
      const sum = profile.q1 + profile.q2 + profile.q3 + profile.q4 + (profile.center || 0);
      
      expect(sum).toBeCloseTo(1);
    });

    it('should handle single quadrant dominance', () => {
      const activities = [
        { region: 'q1' as const, weight: 100 },
      ];
      
      const profile = calculateQuadrantProfile(activities);
      
      expect(profile.q1).toBe(1);
      expect(profile.q2).toBe(0);
      expect(profile.q3).toBe(0);
      expect(profile.q4).toBe(0);
    });
  });

  // ============================================================================
  // calculateTemporalFlow
  // ============================================================================
  describe('calculateTemporalFlow', () => {
    it('should calculate flow for empty array', () => {
      const flow = calculateTemporalFlow([]);
      
      expect(flow.opening).toBe(0);
      expect(flow.middle).toBe(0);
      expect(flow.ending).toBe(0);
      expect(flow.trend).toBe('stable');
      expect(flow.momentum).toBe(0);
    });

    it('should detect accelerating trend', () => {
      const activityLevels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
      
      const flow = calculateTemporalFlow(activityLevels);
      
      expect(flow.trend).toBe('accelerating');
      expect(flow.ending).toBeGreaterThan(flow.opening);
    });

    it('should detect declining trend', () => {
      const activityLevels = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
      
      const flow = calculateTemporalFlow(activityLevels);
      
      expect(flow.trend).toBe('declining');
      expect(flow.ending).toBeLessThan(flow.opening);
    });

    it('should detect stable trend', () => {
      const activityLevels = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
      
      const flow = calculateTemporalFlow(activityLevels);
      
      expect(flow.trend).toBe('stable');
    });

    it('should detect volatile trend', () => {
      const activityLevels = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6];
      
      const flow = calculateTemporalFlow(activityLevels);
      
      expect(flow.trend).toBe('volatile');
    });

    it('should calculate momentum correctly', () => {
      const increasingActivity = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0];
      
      const flow = calculateTemporalFlow(increasingActivity);
      
      expect(flow.momentum).toBeGreaterThan(0);
    });

    it('should handle custom phase boundaries', () => {
      const activityLevels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      
      const flow = calculateTemporalFlow(activityLevels, { opening: 0.5, middle: 0.3 });
      
      expect(flow.opening).toBeGreaterThan(0);
      expect(flow.middle).toBeGreaterThan(0);
      expect(flow.ending).toBeGreaterThan(0);
    });

    it('should bound momentum between -1 and 1', () => {
      const extremeActivity = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      
      const flow = calculateTemporalFlow(extremeActivity);
      
      expect(flow.momentum).toBeLessThanOrEqual(1);
      expect(flow.momentum).toBeGreaterThanOrEqual(-1);
    });
  });

  // ============================================================================
  // detectCriticalMoments
  // ============================================================================
  describe('detectCriticalMoments', () => {
    it('should return empty for short sequences', () => {
      const moments = detectCriticalMoments([0.5, 0.6]);
      
      expect(moments).toHaveLength(0);
    });

    it('should detect significant increases', () => {
      const values = [0.3, 0.3, 0.3, 0.9, 0.9, 0.9];
      
      const moments = detectCriticalMoments(values, { threshold: 0.3, minSeverity: 0.5 });
      
      expect(moments.length).toBeGreaterThan(0);
      expect(moments[0].type).toBe('surge');
    });

    it('should detect significant decreases', () => {
      const values = [0.9, 0.9, 0.9, 0.2, 0.2, 0.2];
      
      const moments = detectCriticalMoments(values, { threshold: 0.3, minSeverity: 0.5 });
      
      expect(moments.length).toBeGreaterThan(0);
      expect(moments[0].type).toBe('drop');
    });

    it('should respect threshold parameter', () => {
      const values = [0.5, 0.55, 0.6, 0.65, 0.7];
      
      const momentsLowThreshold = detectCriticalMoments(values, { threshold: 0.04 });
      const momentsHighThreshold = detectCriticalMoments(values, { threshold: 0.5 });
      
      expect(momentsHighThreshold.length).toBe(0);
    });

    it('should respect minSeverity parameter', () => {
      const values = [0.3, 0.5, 0.4, 0.6, 0.5];
      
      const momentsLowSeverity = detectCriticalMoments(values, { threshold: 0.1, minSeverity: 0.1 });
      const momentsHighSeverity = detectCriticalMoments(values, { threshold: 0.1, minSeverity: 0.9 });
      
      expect(momentsHighSeverity.length).toBeLessThanOrEqual(momentsLowSeverity.length);
    });

    it('should limit results with maxMoments', () => {
      const values = [0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9];
      
      const moments = detectCriticalMoments(values, { threshold: 0.3, minSeverity: 0.5, maxMoments: 3 });
      
      expect(moments.length).toBeLessThanOrEqual(3);
    });

    it('should return moments in chronological order', () => {
      const values = [0.2, 0.8, 0.3, 0.9, 0.4];
      
      const moments = detectCriticalMoments(values, { threshold: 0.3, minSeverity: 0.3 });
      
      for (let i = 1; i < moments.length; i++) {
        expect(moments[i].index).toBeGreaterThan(moments[i - 1].index);
      }
    });

    it('should include description in moments', () => {
      const values = [0.2, 0.2, 0.8, 0.8];
      
      const moments = detectCriticalMoments(values, { threshold: 0.3, minSeverity: 0.5 });
      
      if (moments.length > 0) {
        expect(moments[0].description).toBeDefined();
        expect(moments[0].description.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // calculateIntensity
  // ============================================================================
  describe('calculateIntensity', () => {
    it('should return 0 for empty metrics', () => {
      const intensity = calculateIntensity([]);
      
      expect(intensity).toBe(0);
    });

    it('should calculate weighted average', () => {
      const metrics = [
        { value: 0.8, weight: 1 },
        { value: 0.4, weight: 1 },
      ];
      
      const intensity = calculateIntensity(metrics);
      
      expect(intensity).toBeCloseTo(0.6);
    });

    it('should respect weights', () => {
      const metrics = [
        { value: 1.0, weight: 3 },
        { value: 0.0, weight: 1 },
      ];
      
      const intensity = calculateIntensity(metrics);
      
      expect(intensity).toBeCloseTo(0.75);
    });

    it('should clamp result between 0 and 1', () => {
      const metricsHigh = [{ value: 2.0, weight: 1 }];
      const metricsLow = [{ value: -1.0, weight: 1 }];
      
      expect(calculateIntensity(metricsHigh)).toBe(1);
      expect(calculateIntensity(metricsLow)).toBe(0);
    });

    it('should handle zero weights', () => {
      const metrics = [
        { value: 0.5, weight: 0 },
        { value: 0.7, weight: 0 },
      ];
      
      const intensity = calculateIntensity(metrics);
      
      expect(intensity).toBe(0);
    });
  });

  // ============================================================================
  // determineDominantForce
  // ============================================================================
  describe('determineDominantForce', () => {
    it('should return primary when primary is significantly higher', () => {
      const result = determineDominantForce(0.8, 0.3);
      
      expect(result).toBe('primary');
    });

    it('should return secondary when secondary is significantly higher', () => {
      const result = determineDominantForce(0.3, 0.8);
      
      expect(result).toBe('secondary');
    });

    it('should return balanced when values are close', () => {
      const result = determineDominantForce(0.5, 0.52);
      
      expect(result).toBe('balanced');
    });

    it('should respect custom balance threshold', () => {
      // With low threshold (0.01), a difference of 0.02 exceeds it, so not balanced
      const resultLowThreshold = determineDominantForce(0.52, 0.5, 0.01);
      // With high threshold (0.1), a difference of 0.02 is within it, so balanced
      const resultHighThreshold = determineDominantForce(0.52, 0.5, 0.1);
      
      expect(resultLowThreshold).toBe('primary');
      expect(resultHighThreshold).toBe('balanced');
    });

    it('should handle equal values', () => {
      const result = determineDominantForce(0.5, 0.5);
      
      expect(result).toBe('balanced');
    });

    it('should handle zero values', () => {
      const result = determineDominantForce(0, 0);
      
      expect(result).toBe('balanced');
    });
  });

  // ============================================================================
  // determineFlowDirection
  // ============================================================================
  describe('determineFlowDirection', () => {
    it('should detect forward direction', () => {
      const profile: QuadrantProfile = { q1: 0.4, q2: 0.4, q3: 0.1, q4: 0.1 };
      
      const direction = determineFlowDirection(profile);
      
      expect(direction).toBe('forward');
    });

    it('should detect backward direction', () => {
      const profile: QuadrantProfile = { q1: 0.1, q2: 0.1, q3: 0.4, q4: 0.4 };
      
      const direction = determineFlowDirection(profile);
      
      expect(direction).toBe('backward');
    });

    it('should detect lateral direction', () => {
      const profile: QuadrantProfile = { q1: 0.4, q2: 0.1, q3: 0.4, q4: 0.1 };
      
      const direction = determineFlowDirection(profile);
      
      expect(direction).toBe('lateral');
    });

    it('should detect chaotic when evenly distributed', () => {
      const profile: QuadrantProfile = { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25 };
      
      const direction = determineFlowDirection(profile);
      
      expect(direction).toBe('chaotic');
    });

    it('should handle edge case with all zeros', () => {
      const profile: QuadrantProfile = { q1: 0, q2: 0, q3: 0, q4: 0 };
      
      const direction = determineFlowDirection(profile);
      
      expect(['chaotic', 'forward', 'backward', 'lateral']).toContain(direction);
    });
  });

  // ============================================================================
  // hashString
  // ============================================================================
  describe('hashString', () => {
    it('should generate consistent hash for same string', () => {
      const hash1 = hashString('test-string');
      const hash2 = hashString('test-string');
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = hashString('string-a');
      const hash2 = hashString('string-b');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should return 8 character hex string', () => {
      const hash = hashString('any-string');
      
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should handle empty string', () => {
      const hash = hashString('');
      
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = hashString(longString);
      
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should handle special characters', () => {
      const hash = hashString('!@#$%^&*()_+-=[]{}|;:,.<>?');
      
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should handle unicode', () => {
      const hash = hashString('日本語テスト🎯');
      
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});
