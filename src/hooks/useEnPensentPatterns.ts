/**
 * Hook to extract En Pensent patterns for visual components
 */

import { useMemo } from 'react';
import { TemporalSignature, QuadrantProfile } from '@/lib/pensent-core/types/core';

export interface PatternVisualization {
  dominantColor: string;
  secondaryColor: string;
  intensity: number;
  flowDirection: 'forward' | 'lateral' | 'backward' | 'chaotic';
  archetype: string;
  quadrantWeights: QuadrantProfile;
  momentum: number;
}

const ARCHETYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  'aggressive': { primary: '#ef4444', secondary: '#f97316' },
  'defensive': { primary: '#3b82f6', secondary: '#6366f1' },
  'balanced': { primary: '#10b981', secondary: '#14b8a6' },
  'chaotic': { primary: '#f59e0b', secondary: '#eab308' },
  'methodical': { primary: '#8b5cf6', secondary: '#a855f7' },
  'explosive': { primary: '#ec4899', secondary: '#f43f5e' },
  'default': { primary: '#6b7280', secondary: '#9ca3af' }
};

export function useEnPensentPatterns(signature?: TemporalSignature | null): PatternVisualization {
  return useMemo(() => {
    if (!signature) {
      return {
        dominantColor: ARCHETYPE_COLORS.default.primary,
        secondaryColor: ARCHETYPE_COLORS.default.secondary,
        intensity: 0.5,
        flowDirection: 'stable' as 'forward',
        archetype: 'unknown',
        quadrantWeights: { q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25 },
        momentum: 0
      };
    }

    const archetypeKey = signature.archetype.toLowerCase();
    const colors = ARCHETYPE_COLORS[archetypeKey] || ARCHETYPE_COLORS.default;

    return {
      dominantColor: colors.primary,
      secondaryColor: colors.secondary,
      intensity: signature.intensity,
      flowDirection: signature.flowDirection,
      archetype: signature.archetype,
      quadrantWeights: signature.quadrantProfile,
      momentum: signature.temporalFlow.momentum
    };
  }, [signature]);
}

export function generateParticlePattern(quadrantProfile: QuadrantProfile, count: number): Array<{
  x: number;
  y: number;
  weight: number;
}> {
  const particles: Array<{ x: number; y: number; weight: number }> = [];
  
  const quadrants = [
    { weight: quadrantProfile.q1, xRange: [0, 50], yRange: [0, 50] },
    { weight: quadrantProfile.q2, xRange: [50, 100], yRange: [0, 50] },
    { weight: quadrantProfile.q3, xRange: [0, 50], yRange: [50, 100] },
    { weight: quadrantProfile.q4, xRange: [50, 100], yRange: [50, 100] }
  ];
  
  const totalWeight = quadrants.reduce((sum, q) => sum + q.weight, 0);
  
  quadrants.forEach(quadrant => {
    const particleCount = Math.round((quadrant.weight / totalWeight) * count);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: quadrant.xRange[0] + Math.random() * (quadrant.xRange[1] - quadrant.xRange[0]),
        y: quadrant.yRange[0] + Math.random() * (quadrant.yRange[1] - quadrant.yRange[0]),
        weight: quadrant.weight
      });
    }
  });
  
  return particles;
}

export function getFlowAnimation(flowDirection: string, momentum: number): {
  x: number[];
  y: number[];
  duration: number;
} {
  const magnitude = Math.abs(momentum) * 20;
  
  switch (flowDirection) {
    case 'forward':
      return { x: [0, magnitude, 0], y: [0, -magnitude * 0.5, 0], duration: 3 + Math.random() * 2 };
    case 'backward':
      return { x: [0, -magnitude, 0], y: [0, magnitude * 0.5, 0], duration: 4 + Math.random() * 2 };
    case 'lateral':
      return { x: [0, magnitude, -magnitude, 0], y: [0, 0, 0, 0], duration: 5 + Math.random() * 2 };
    case 'chaotic':
      return { 
        x: [0, magnitude * Math.random(), -magnitude * Math.random(), 0], 
        y: [0, magnitude * Math.random(), -magnitude * Math.random(), 0], 
        duration: 2 + Math.random() * 3 
      };
    default:
      return { x: [0, 0, 0], y: [0, -5, 0], duration: 4 };
  }
}
