/**
 * En Pensent Code
 * 
 * Code Evolution Pattern Recognition Engine
 * 
 * Analyzes software development patterns through commit histories
 * to predict project trajectories and provide strategic guidance.
 * 
 * Part of the En Pensent family of temporal pattern recognition tools.
 */

// Types
export * from './types';

// Signature Extraction
export { 
  extractCodeFlowSignature,
  classifyCommitType 
} from './codeFlowSignature';

// Domain Adapter
export {
  codeDomainAdapter,
  createCodeAnalysisEngine,
  type CodeInput,
  type CodeState
} from './codeAdapter';

// Re-export core SDK for convenience
export { createPensentEngine, PENSENT_CORE_VERSION } from '../pensent-core';

/**
 * Version of En Pensent Code
 */
export const PENSENT_CODE_VERSION = '1.0.0';

/**
 * Quick analysis function for common use case
 */
export function analyzeCodeEvolution(commits: import('./types').CodeCommit[]) {
  const { createCodeAnalysisEngine } = require('./codeAdapter');
  const engine = createCodeAnalysisEngine();
  
  const signature = engine.analyzeRepository(commits);
  const prediction = engine.predictOutcome(signature);
  const recommendations = engine.getRecommendations(signature);
  
  return {
    signature,
    prediction,
    recommendations,
    archetype: signature.archetype,
    archetypeDefinition: engine.getArchetypeDefinition(signature.archetype)
  };
}
