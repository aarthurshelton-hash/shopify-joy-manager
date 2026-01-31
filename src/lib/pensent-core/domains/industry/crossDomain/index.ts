/**
 * Cross-Domain Pattern Correlator
 * 
 * Modular entry point for cross-domain pattern matching.
 * @see ./crossDomain/ for individual modules
 */

// Re-export types
export type { ChessArchetypeMapping } from './archetypeMappings';
export type { DataMoatValue } from './dataMoatCalculator';

// Re-export mappings
export { CROSS_DOMAIN_MAPPINGS } from './archetypeMappings';

// Re-export similarity calculators
export { quadrantSimilarity, gridSimilarity } from './similarityCalculators';

// Re-export correlation functions
export { findCrossDomainMatches, getIndustryCorrelations } from './correlationFinder';

// Re-export insight generator
export { generateCrossDomainInsight } from './insightGenerator';

// Re-export Black Swan detector
export { detectBlackSwanEvents } from './blackSwanDetector';

// Re-export data moat calculator
export { calculateDataMoatValue } from './dataMoatCalculator';
