/**
 * Universal Domain Adapters Index
 * 
 * v7.52-SYNC: Centralized export for all 27 domain adapters
 * Provides unified access to cross-domain pattern recognition
 */

// Core market adapters
export { multiBrokerAdapter } from './multiBrokerAdapter';

// Physical science adapters
export { atomicAdapter } from './atomicAdapter';
export { molecularAdapter } from './molecularAdapter';
export { lightAdapter } from './lightAdapter';
export { cosmicAdapter } from './cosmicAdapter';
export { geologicalTectonicAdapter } from './geologicalTectonicAdapter';
export { climateAtmosphericAdapter } from './climateAtmosphericAdapter';

// Biological adapters
export { bioAdapter } from './bioAdapter';
export { biologyDeepAdapter } from './biologyDeepAdapter';
export { botanicalAdapter } from './botanicalAdapter';
export { myceliumAdapter } from './myceliumAdapter';

// Consciousness and perception adapters
export { consciousnessAdapter } from './consciousnessAdapter';
export { soulAdapter } from './soulAdapter';
export { sensoryMemoryHumorAdapter } from './sensoryMemoryHumorAdapter';
export { temporalConsciousnessSpeedrunAdapter } from './temporalConsciousnessSpeedrunAdapter';

// Pattern and network adapters
export { networkAdapter } from './networkAdapter';
export { universalPatternsAdapter } from './universalPatternsAdapter';
export { universalRealizationImpulseAdapter } from './universalRealizationImpulseAdapter';

// Mathematical and structural adapters
export { mathematicalFoundationsAdapter } from './mathematicalFoundationsAdapter';
export { 
  rubiksCubeAdapter, 
  RUBIKS_CUBE_CONSTANTS, 
  generateMarketRubiksCubeData,
  extractRubiksCubeSignature,
  estimateMovesToSolve,
  areConjugate
} from './rubiksCubeAdapter';

// Human and cultural adapters
export { humanAttractionAdapter } from './humanAttractionAdapter';
export { culturalValuationAdapter } from './culturalValuationAdapter';
export { competitiveDynamicsAdapter } from './competitiveDynamicsAdapter';
export { linguisticSemanticAdapter } from './linguisticSemanticAdapter';

// Sensory adapters
export { audioAdapter } from './audioAdapter';
export { musicAdapter } from './musicAdapter';

// Novel mechanism adapters
export { 
  grotthussMechanismAdapter, 
  PROTON_TRANSFER_MECHANISMS,
  extractGrotthussSignature
} from './grotthussMechanismAdapter';

// Adapter count for diagnostics
export const TOTAL_ADAPTERS = 27;

console.log(`[v7.52-SYNC] Universal Adapters Index LOADED - ${TOTAL_ADAPTERS} domain adapters available`);
