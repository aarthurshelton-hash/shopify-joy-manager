/**
 * En Pensent Core SDK - Signature Extraction
 * 
 * Universal algorithms for extracting temporal signatures from any domain.
 * This file re-exports from focused modules for backward compatibility.
 */

import { TemporalSignature, DomainAdapter } from './types';

// Re-export all signature-related functions
export { 
  calculateQuadrantProfile,
  determineFlowDirection 
} from './signature/quadrantCalculator';

export { 
  calculateTemporalFlow,
  type PhaseConfig 
} from './signature/temporalFlowCalculator';

export { 
  detectCriticalMoments,
  type DetectionOptions 
} from './signature/criticalMomentDetector';

export { 
  calculateIntensity,
  determineDominantForce 
} from './signature/intensityCalculator';

export { 
  generateFingerprint,
  hashString 
} from './signature/fingerprintGenerator';

/**
 * Universal signature extraction using a domain adapter
 */
export function extractSignature<TInput, TState>(
  input: TInput,
  adapter: DomainAdapter<TInput, TState>
): TemporalSignature {
  const states = adapter.parseInput(input);
  return adapter.extractSignature(states);
}
