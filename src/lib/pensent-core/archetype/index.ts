/**
 * En Pensent Core SDK - Archetype Resolution Module
 */

// Criteria and types
export type { ArchetypeMatchCriteria, ArchetypeMatchResult } from './criteria';
export { DEFAULT_MATCH_CRITERIA } from './criteria';

// Term extraction
export { extractSignatureTerms, matchKeywords } from './termExtractor';

// Alignment calculators
export { 
  calculateIntensityAlignment, 
  calculateFlowAlignment, 
  calculateQuadrantAlignment 
} from './alignmentCalculators';

// Universal classifier
export { classifyUniversalArchetype, calculateArchetypeSimilarity } from './universalClassifier';

// Resolver class and factory
export { ArchetypeResolver, createArchetypeResolver } from './resolver';
