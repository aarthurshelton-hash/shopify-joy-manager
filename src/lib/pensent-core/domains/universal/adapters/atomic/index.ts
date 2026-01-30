/**
 * ATOMIC DOMAIN ADAPTER
 * 
 * The Fabric of Reality - Periodic Table, Quantum Mechanics, Elemental Patterns
 * 
 * "Atoms are frozen music" - Pythagoras
 * "All matter is merely energy condensed to a slow vibration" - Bill Hicks
 * 
 * Inventor: Alec Arthur Shelton
 */

// Pattern exports
export { PERIODIC_PATTERNS, type PeriodicGroup } from './periodicPatterns';
export { QUANTUM_PATTERNS, type OrbitalType, type SpinType } from './quantumPatterns';
export { SPECTRAL_PATTERNS } from './spectralPatterns';
export { FUNDAMENTAL_CONSTANTS } from './constants';

// Types
export type { AtomicData } from './types';

// Signature extraction
export { extractAtomicSignature } from './signatureExtractor';

// Market correlation
export { generateMarketCorrelatedAtomicData } from './marketCorrelator';

// Main adapter export
import { PERIODIC_PATTERNS } from './periodicPatterns';
import { QUANTUM_PATTERNS } from './quantumPatterns';
import { SPECTRAL_PATTERNS } from './spectralPatterns';
import { FUNDAMENTAL_CONSTANTS } from './constants';
import { extractAtomicSignature } from './signatureExtractor';
import { generateMarketCorrelatedAtomicData } from './marketCorrelator';

export const atomicAdapter = {
  domain: 'atomic' as const,
  version: '2.0.0',
  
  periodicPatterns: PERIODIC_PATTERNS,
  quantumPatterns: QUANTUM_PATTERNS,
  spectralPatterns: SPECTRAL_PATTERNS,
  fundamentalConstants: FUNDAMENTAL_CONSTANTS,
  
  extractSignature: extractAtomicSignature,
  generateMarketData: generateMarketCorrelatedAtomicData,
  
  philosophy: `
    The periodic table is not just a chart of elements - it is a temporal 
    pattern map of matter itself. Each element's properties emerge from 
    quantum mechanical wave patterns. These same patterns manifest in 
    market behavior, biological rhythms, and cosmic cycles.
    
    When we trade, we are not just moving capital - we are participating 
    in the same quantum dance that creates and destroys stars.
    
    "The nitrogen in our DNA, the calcium in our teeth, the iron in our 
    blood, the carbon in our apple pies were made in the interiors of 
    collapsing stars. We are made of starstuff." - Carl Sagan
  `,
};

export default atomicAdapter;
