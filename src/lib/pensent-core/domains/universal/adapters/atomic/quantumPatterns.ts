/**
 * Quantum Patterns Module
 * 
 * Quantum numbers mapped to market behavior patterns.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// QUANTUM MECHANICAL PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quantum numbers define electron behavior - these map to market behavior
 */
export const QUANTUM_PATTERNS = {
  // Principal quantum number (n) - Energy level/shell
  principalQuantum: {
    n1: { energy: 'ground_state', marketPhase: 'accumulation', volatility: 0.2 },
    n2: { energy: 'first_excited', marketPhase: 'early_trend', volatility: 0.4 },
    n3: { energy: 'second_excited', marketPhase: 'momentum', volatility: 0.6 },
    n4: { energy: 'third_excited', marketPhase: 'euphoria', volatility: 0.8 },
    n5: { energy: 'high_excited', marketPhase: 'blow_off_top', volatility: 0.95 },
  },
  
  // Angular momentum quantum number (l) - Orbital shape
  angularMomentum: {
    s_orbital: { shape: 'spherical', marketBehavior: 'omnidirectional', predictability: 0.7 },
    p_orbital: { shape: 'dumbbell', marketBehavior: 'directional', predictability: 0.8 },
    d_orbital: { shape: 'cloverleaf', marketBehavior: 'complex_rotation', predictability: 0.5 },
    f_orbital: { shape: 'complex', marketBehavior: 'unpredictable', predictability: 0.3 },
  },
  
  // Magnetic quantum number (ml) - Orbital orientation
  magneticQuantum: {
    description: 'Spatial orientation of orbital',
    marketAnalogy: 'Market sector orientation',
    values: 'Range from -l to +l',
  },
  
  // Spin quantum number (ms) - Electron spin
  spinQuantum: {
    up: { spin: +0.5, marketBias: 'bullish', direction: 'long' },
    down: { spin: -0.5, marketBias: 'bearish', direction: 'short' },
    pairedSpins: { state: 'balanced', marketBias: 'neutral', direction: 'hedge' },
  },
};

export type OrbitalType = 's' | 'p' | 'd' | 'f';
export type SpinType = 'up' | 'down' | 'paired';
