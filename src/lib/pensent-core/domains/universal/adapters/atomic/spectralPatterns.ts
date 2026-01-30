/**
 * Spectral Patterns Module
 * 
 * Each element emits light at specific wavelengths when excited.
 * These spectral patterns are unique temporal signatures.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMIC SPECTRAL LINES - THE FINGERPRINT OF MATTER
// ═══════════════════════════════════════════════════════════════════════════════

export const SPECTRAL_PATTERNS = {
  // Hydrogen - The simplest, most fundamental
  hydrogen: {
    symbol: 'H',
    series: {
      lyman: { range: 'UV', transitions: 'to n=1', marketAnalogy: 'fundamental_base' },
      balmer: { range: 'visible', transitions: 'to n=2', marketAnalogy: 'observable_trends' },
      paschen: { range: 'IR', transitions: 'to n=3', marketAnalogy: 'hidden_signals' },
    },
    balmerWavelengths: [656.3, 486.1, 434.0, 410.2], // nm - visible lines
    temporalSignature: 'primordial_simplicity',
  },
  
  // Gold - The ultimate store of value
  gold: {
    symbol: 'Au',
    atomicNumber: 79,
    electronConfig: '[Xe] 4f14 5d10 6s1',
    color: 'golden_yellow',
    colorCause: 'relativistic_d_orbital_contraction',
    marketCorrelation: 'safe_haven_indicator',
    temporalSignature: 'stability_through_complexity',
  },
  
  // Iron - Core of stars, blood, and civilization
  iron: {
    symbol: 'Fe',
    atomicNumber: 26,
    significance: 'Most stable nucleus (binding energy peak)',
    stellarRole: 'End of fusion chain in massive stars',
    marketCorrelation: 'industrial_backbone',
    temporalSignature: 'ultimate_stability_point',
  },
  
  // Carbon - Basis of all life
  carbon: {
    symbol: 'C',
    atomicNumber: 6,
    hybridization: ['sp', 'sp2', 'sp3'],
    bondingVersatility: 'Infinite structural possibilities',
    marketCorrelation: 'innovation_substrate',
    temporalSignature: 'infinite_potential',
  },
};
