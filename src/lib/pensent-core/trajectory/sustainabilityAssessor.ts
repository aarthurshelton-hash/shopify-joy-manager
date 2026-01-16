/**
 * En Pensent Core SDK - Sustainability Assessor
 * 
 * Assesses trajectory sustainability and risk levels
 */

import { TemporalSignature, PatternMatch } from '../types';

export interface SustainabilityAssessment {
  sustainable: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Predict if current trajectory is sustainable
 */
export function assessTrajectorySustainability(
  signature: TemporalSignature
): SustainabilityAssessment {
  const { temporalFlow, intensity, criticalMoments } = signature;
  
  // Check for high intensity with acceleration (burnout risk)
  if (temporalFlow.trend === 'accelerating' && intensity > 0.8) {
    return {
      sustainable: false,
      reason: 'High intensity with accelerating trend may lead to burnout',
      riskLevel: 'high'
    };
  }
  
  // Check for declining trend with negative momentum
  if (temporalFlow.trend === 'declining' && temporalFlow.momentum < -0.5) {
    return {
      sustainable: false,
      reason: 'Declining trend with negative momentum indicates loss of direction',
      riskLevel: 'high'
    };
  }
  
  // Check for too many critical moments (instability)
  if (criticalMoments.filter(m => m.severity > 0.7).length > 3) {
    return {
      sustainable: false,
      reason: 'Too many critical moments indicate instability',
      riskLevel: 'medium'
    };
  }
  
  // Volatile but potentially stabilizing
  if (temporalFlow.trend === 'volatile') {
    return {
      sustainable: true,
      reason: 'Volatile but may stabilize',
      riskLevel: 'medium'
    };
  }
  
  return {
    sustainable: true,
    reason: 'Current trajectory appears sustainable',
    riskLevel: 'low'
  };
}

/**
 * Calculate trajectory divergence (how much current path differs from historical patterns)
 */
export function calculateTrajectoryDivergence(
  currentSignature: TemporalSignature,
  matches: PatternMatch[]
): number {
  if (matches.length === 0) return 1; // Maximum divergence if no matches
  
  // Calculate average signature of matches
  const avgIntensity = matches.reduce((sum, m) => sum + m.signature.intensity, 0) / matches.length;
  const avgMomentum = matches.reduce((sum, m) => sum + m.signature.temporalFlow.momentum, 0) / matches.length;
  
  // Calculate divergence from average
  const intensityDivergence = Math.abs(currentSignature.intensity - avgIntensity);
  const momentumDivergence = Math.abs(currentSignature.temporalFlow.momentum - avgMomentum) / 2;
  
  return (intensityDivergence + momentumDivergence) / 2;
}
