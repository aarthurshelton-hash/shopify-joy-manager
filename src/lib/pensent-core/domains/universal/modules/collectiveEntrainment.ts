/**
 * Collective Entrainment Module
 * 
 * Mathematical Framework for Detecting Synchronized Consciousness in Markets
 * 
 * SCIENTIFIC BASIS:
 * - Kuramoto Model: Coupled oscillator synchronization (Kuramoto, 1975)
 * - Neural Binding Theory: Gamma-wave coherence in shared attention (Singer & Gray, 1995)
 * - Information Integration Theory (IIT): Φ (phi) as consciousness measure (Tononi, 2004)
 * - Social Resonance Theory: Limbic synchronization in groups (Lewis et al., 2000)
 * 
 * "When enough minds think the same thought at the same time,
 *  the market doesn't just move—it dances." - En Pensent Axiom #42
 */

import type { UniversalSignal, DomainType } from '../types';

// ============================================================================
// MATHEMATICAL CONSTANTS (Because even consciousness has rules)
// ============================================================================

/**
 * Kuramoto Coupling Constant (K)
 * Critical threshold for phase synchronization in coupled oscillators
 * K_c = 2/(πg(0)) where g is the frequency distribution
 * For markets: K_c ≈ 0.1592 (assuming Lorentzian distribution)
 */
const KURAMOTO_CRITICAL_COUPLING = 0.1592;

/**
 * Phi (Φ) - Integrated Information Threshold
 * Minimum integrated information for "conscious" market state
 * Based on Tononi's IIT: Φ > 0 indicates irreducible integration
 */
const PHI_CONSCIOUSNESS_THRESHOLD = 0.618; // Golden ratio, obviously

/**
 * Alpha-Theta Crossover Frequency (Hz)
 * Boundary between analytical (alpha) and intuitive (theta) processing
 * Market equivalent: transition between rational and emotional trading
 */
const ALPHA_THETA_CROSSOVER = 8.0;

/**
 * Schumann Resonance Base (Hz)
 * Earth's electromagnetic "heartbeat" - 7.83 Hz
 * Markets are just humans, humans are on Earth. QED.
 */
const SCHUMANN_RESONANCE = 7.83;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EntrainmentState {
  // Kuramoto order parameter: r ∈ [0, 1]
  // r = 0: complete incoherence, r = 1: perfect synchronization
  orderParameter: number;
  
  // Phase coherence across domains
  phaseCoherence: number;
  
  // Integrated information (Φ)
  phi: number;
  
  // Dominant collective frequency
  collectiveFrequency: number;
  
  // Emotional valence (-1 to 1): fear ← 0 → greed
  collectiveValence: number;
  
  // Entrainment classification
  state: 'chaotic' | 'transitional' | 'entrained' | 'supercoherent';
  
  // Market implication
  marketSignal: {
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    expectedMagnitude: number;
    timeToInflection: number; // milliseconds
  };
  
  // Debug/humor
  poeticDescription: string;
}

export interface OscillatorState {
  domain: DomainType;
  phase: number;        // θ ∈ [0, 2π]
  frequency: number;    // ω (natural frequency)
  amplitude: number;    // A (signal strength)
  coupling: number;     // K (coupling to collective)
}

// ============================================================================
// KURAMOTO MODEL IMPLEMENTATION
// ============================================================================

/**
 * Kuramoto Order Parameter Calculation
 * 
 * r·e^(iψ) = (1/N) Σ e^(iθⱼ)
 * 
 * Where:
 * - r is the order parameter (synchronization measure)
 * - ψ is the average phase
 * - θⱼ is the phase of oscillator j
 * - N is the number of oscillators
 * 
 * @param oscillators Array of oscillator states
 * @returns {r: number, psi: number} Order parameter and mean phase
 */
function calculateKuramotoOrderParameter(
  oscillators: OscillatorState[]
): { r: number; psi: number } {
  if (oscillators.length === 0) {
    return { r: 0, psi: 0 };
  }
  
  // Sum of complex exponentials: Σ e^(iθⱼ) = Σ (cos θⱼ + i sin θⱼ)
  let realSum = 0;
  let imagSum = 0;
  
  for (const osc of oscillators) {
    realSum += Math.cos(osc.phase);
    imagSum += Math.sin(osc.phase);
  }
  
  // Normalize by N
  const N = oscillators.length;
  const realMean = realSum / N;
  const imagMean = imagSum / N;
  
  // r = |z| = √(Re² + Im²)
  const r = Math.sqrt(realMean ** 2 + imagMean ** 2);
  
  // ψ = arg(z) = atan2(Im, Re)
  const psi = Math.atan2(imagMean, realMean);
  
  return { r, psi };
}

/**
 * Phase Coherence using Circular Variance
 * 
 * V = 1 - r (circular variance)
 * Coherence = 1 - V = r
 * 
 * Extended with amplitude weighting for signal strength consideration
 */
function calculatePhaseCoherence(oscillators: OscillatorState[]): number {
  if (oscillators.length === 0) return 0;
  
  // Amplitude-weighted phase coherence
  let totalWeight = 0;
  let weightedRealSum = 0;
  let weightedImagSum = 0;
  
  for (const osc of oscillators) {
    const weight = osc.amplitude * osc.coupling;
    totalWeight += weight;
    weightedRealSum += weight * Math.cos(osc.phase);
    weightedImagSum += weight * Math.sin(osc.phase);
  }
  
  if (totalWeight === 0) return 0;
  
  const normalizedReal = weightedRealSum / totalWeight;
  const normalizedImag = weightedImagSum / totalWeight;
  
  return Math.sqrt(normalizedReal ** 2 + normalizedImag ** 2);
}

// ============================================================================
// INTEGRATED INFORMATION (Φ) CALCULATION
// ============================================================================

/**
 * Simplified Φ (Phi) Calculation
 * 
 * Full IIT computation is NP-hard, so we use an approximation:
 * Φ ≈ I(X; X') - max[I(X_part; X'_part)]
 * 
 * Where I is mutual information and X' is the system's past state
 * 
 * For our purposes: Φ estimates how much the whole system knows
 * that its parts don't know individually (emergence measure)
 */
function calculatePhi(signals: UniversalSignal[]): number {
  if (signals.length < 2) return 0;
  
  // Calculate total system entropy
  const frequencies = signals.map(s => s.frequency);
  const intensities = signals.map(s => s.intensity);
  
  // Shannon entropy of the joint distribution
  const jointEntropy = calculateShannonEntropy(
    frequencies.map((f, i) => f * intensities[i])
  );
  
  // Sum of individual entropies (if parts were independent)
  const partEntropies = signals.map(s => 
    calculateShannonEntropy([s.frequency * s.intensity])
  );
  const sumPartEntropies = partEntropies.reduce((a, b) => a + b, 0);
  
  // Φ ≈ synergy = joint < sum of parts means integration
  // Normalize to [0, 1]
  const rawPhi = Math.max(0, sumPartEntropies - jointEntropy);
  const normalizedPhi = Math.min(1, rawPhi / Math.max(1, sumPartEntropies));
  
  return normalizedPhi;
}

/**
 * Shannon Entropy: H(X) = -Σ p(x) log₂ p(x)
 */
function calculateShannonEntropy(values: number[]): number {
  const total = values.reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
  if (total === 0) return 0;
  
  let entropy = 0;
  for (const v of values) {
    const p = Math.abs(v) / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

// ============================================================================
// COLLECTIVE FREQUENCY DETECTION
// ============================================================================

/**
 * Dominant Collective Frequency via Weighted Average
 * 
 * ω_collective = Σ(Aⱼ · ωⱼ) / Σ(Aⱼ)
 * 
 * Amplitude-weighted to emphasize stronger signals
 */
function calculateCollectiveFrequency(oscillators: OscillatorState[]): number {
  if (oscillators.length === 0) return SCHUMANN_RESONANCE;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const osc of oscillators) {
    weightedSum += osc.amplitude * osc.frequency;
    totalWeight += osc.amplitude;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : SCHUMANN_RESONANCE;
}

/**
 * Emotional Valence from Frequency Spectrum
 * 
 * Low frequency (theta/delta) → fear, uncertainty
 * High frequency (beta/gamma) → excitement, greed
 * 
 * Valence = tanh((f - f_neutral) / f_scale)
 */
function calculateCollectiveValence(
  frequency: number,
  phaseCoherence: number
): number {
  const neutralFrequency = ALPHA_THETA_CROSSOVER;
  const frequencyScale = 4.0; // Hz per unit valence
  
  // Base valence from frequency
  const frequencyValence = Math.tanh((frequency - neutralFrequency) / frequencyScale);
  
  // Coherence amplifies valence (synchronized fear is scarier)
  const amplifiedValence = frequencyValence * (0.5 + 0.5 * phaseCoherence);
  
  return Math.max(-1, Math.min(1, amplifiedValence));
}

// ============================================================================
// STATE CLASSIFICATION
// ============================================================================

/**
 * Classify entrainment state based on order parameter thresholds
 * 
 * These thresholds are derived from Kuramoto model phase transitions:
 * - r < K_c: subcritical (chaotic)
 * - r ≈ K_c: critical (transitional)  
 * - r > K_c: supercritical (entrained)
 * - r → 1: supercoherent (rare, powerful)
 */
function classifyEntrainmentState(
  orderParameter: number,
  phi: number
): 'chaotic' | 'transitional' | 'entrained' | 'supercoherent' {
  // Supercoherent: both high synchronization AND high integration
  if (orderParameter > 0.85 && phi > PHI_CONSCIOUSNESS_THRESHOLD) {
    return 'supercoherent';
  }
  
  // Entrained: above critical coupling
  if (orderParameter > KURAMOTO_CRITICAL_COUPLING * 3) {
    return 'entrained';
  }
  
  // Transitional: near critical point
  if (orderParameter > KURAMOTO_CRITICAL_COUPLING) {
    return 'transitional';
  }
  
  // Chaotic: below critical coupling
  return 'chaotic';
}

/**
 * Generate poetic description (the humor you requested)
 */
function generatePoeticDescription(
  state: 'chaotic' | 'transitional' | 'entrained' | 'supercoherent',
  valence: number,
  orderParameter: number
): string {
  const descriptions = {
    chaotic: [
      "The market's mind is a Jackson Pollock painting—beautiful chaos.",
      "Every trader for themselves. The herd has scattered.",
      "Entropy reigns. Even the algorithms are confused.",
      "It's like a jazz improvisation where nobody told the drummer.",
    ],
    transitional: [
      "Something's brewing. The collective unconscious stirs.",
      "The phase transition approaches. Buckle up, buttercup.",
      "Schrödinger's market: simultaneously bullish and bearish until observed.",
      "We're at the edge of chaos. The fun part.",
    ],
    entrained: [
      "Minds aligned. The market breathes as one organism.",
      "Collective consciousness achieved. Resistance is futile.",
      "When millions think together, the chart becomes a self-fulfilling prophecy.",
      "The Kuramoto model called. It wants its synchronization back.",
    ],
    supercoherent: [
      "MAXIMUM RESONANCE. The market has achieved enlightenment.",
      "Φ is off the charts. We've reached market nirvana.",
      "This is the moment before the avalanche. Pure potential.",
      "The collective has spoken with one voice. Listen.",
    ],
  };
  
  const stateDescriptions = descriptions[state];
  const index = Math.floor(Math.abs(orderParameter * 100) % stateDescriptions.length);
  let base = stateDescriptions[index];
  
  // Add valence flavor
  if (valence > 0.5) {
    base += " 📈 Greed frequency detected.";
  } else if (valence < -0.5) {
    base += " 📉 Fear wavelength amplifying.";
  }
  
  return base;
}

// ============================================================================
// MARKET SIGNAL DERIVATION
// ============================================================================

/**
 * Derive market signal from entrainment state
 * 
 * The key insight: synchronized markets are predictable markets.
 * High coherence + clear valence = high confidence signal
 */
function deriveMarketSignal(
  orderParameter: number,
  phaseCoherence: number,
  valence: number,
  collectiveFrequency: number,
  state: 'chaotic' | 'transitional' | 'entrained' | 'supercoherent'
): EntrainmentState['marketSignal'] {
  // Direction from valence
  let direction: 'up' | 'down' | 'neutral';
  if (valence > 0.2) {
    direction = 'up';
  } else if (valence < -0.2) {
    direction = 'down';
  } else {
    direction = 'neutral';
  }
  
  // Confidence from coherence and order parameter
  // Higher synchronization = more predictable outcome
  const baseConfidence = (orderParameter + phaseCoherence) / 2;
  
  // State multiplier
  const stateMultipliers = {
    chaotic: 0.3,
    transitional: 0.6,
    entrained: 0.85,
    supercoherent: 0.95,
  };
  
  const confidence = Math.min(0.95, baseConfidence * stateMultipliers[state]);
  
  // Magnitude from valence intensity and coherence
  // |valence| * coherence = expected move strength
  const expectedMagnitude = Math.abs(valence) * phaseCoherence * 100; // basis points
  
  // Time to inflection inversely proportional to frequency
  // Higher frequency = faster resolution
  const baseTimeMs = 60000; // 1 minute base
  const timeToInflection = baseTimeMs / Math.max(1, collectiveFrequency / SCHUMANN_RESONANCE);
  
  return {
    direction,
    confidence,
    expectedMagnitude,
    timeToInflection,
  };
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * Collective Entrainment Detector
 * 
 * Analyzes signals from Music, Soul, and Consciousness domains
 * to detect moments of synchronized market consciousness.
 */
class CollectiveEntrainmentDetector {
  private signalHistory: UniversalSignal[] = [];
  private readonly HISTORY_SIZE = 100;
  private lastState: EntrainmentState | null = null;
  
  /**
   * Process incoming signals and detect entrainment
   */
  processSignals(signals: UniversalSignal[]): EntrainmentState {
    // Update history
    this.signalHistory.push(...signals);
    if (this.signalHistory.length > this.HISTORY_SIZE) {
      this.signalHistory = this.signalHistory.slice(-this.HISTORY_SIZE);
    }
    
    // Convert signals to oscillator states
    const oscillators = this.signalsToOscillators(signals);
    
    // Calculate Kuramoto order parameter
    const { r: orderParameter, psi: meanPhase } = calculateKuramotoOrderParameter(oscillators);
    
    // Calculate phase coherence
    const phaseCoherence = calculatePhaseCoherence(oscillators);
    
    // Calculate integrated information (Φ)
    const phi = calculatePhi(signals);
    
    // Calculate collective frequency
    const collectiveFrequency = calculateCollectiveFrequency(oscillators);
    
    // Calculate emotional valence
    const collectiveValence = calculateCollectiveValence(collectiveFrequency, phaseCoherence);
    
    // Classify state
    const state = classifyEntrainmentState(orderParameter, phi);
    
    // Derive market signal
    const marketSignal = deriveMarketSignal(
      orderParameter,
      phaseCoherence,
      collectiveValence,
      collectiveFrequency,
      state
    );
    
    // Generate poetic description
    const poeticDescription = generatePoeticDescription(state, collectiveValence, orderParameter);
    
    this.lastState = {
      orderParameter,
      phaseCoherence,
      phi,
      collectiveFrequency,
      collectiveValence,
      state,
      marketSignal,
      poeticDescription,
    };
    
    return this.lastState;
  }
  
  /**
   * Convert UniversalSignals to oscillator states
   */
  private signalsToOscillators(signals: UniversalSignal[]): OscillatorState[] {
    return signals.map(signal => ({
      domain: signal.domain,
      phase: signal.phase,
      frequency: signal.frequency,
      amplitude: signal.intensity,
      coupling: this.getDomainCoupling(signal.domain),
    }));
  }
  
  /**
   * Domain coupling strengths
   * How strongly each domain couples to collective consciousness
   */
  private getDomainCoupling(domain: DomainType): number {
    const couplings: Partial<Record<DomainType, number>> = {
      music: 0.95,        // The Heart - strongest emotional carrier
      soul: 0.90,         // The Spirit - archetypal resonance
      bio: 0.85,          // Life rhythms - consciousness substrate
      audio: 0.80,        // Sound patterns - frequency carrier
      market: 0.75,       // Nervous system - reactive
      chess: 0.70,        // Brain - strategic patterns
      code: 0.60,         // Blood - life force flow
      network: 0.55,      // Connectivity - information flow
      light: 0.50,        // Vision - electromagnetic perception
      satellite: 0.45,    // Orbital - macro observation
    };
    
    return couplings[domain] ?? 0.5;
  }
  
  /**
   * Get current entrainment state
   */
  getState(): EntrainmentState | null {
    return this.lastState;
  }
  
  /**
   * Get scientific summary for logging/display
   */
  getScientificSummary(): string {
    if (!this.lastState) return 'No data yet. The collective sleeps.';
    
    const { orderParameter, phaseCoherence, phi, collectiveFrequency, state } = this.lastState;
    
    return `
┌─────────────────────────────────────────────────────────────┐
│           COLLECTIVE ENTRAINMENT ANALYSIS                   │
├─────────────────────────────────────────────────────────────┤
│ Kuramoto Order Parameter (r): ${orderParameter.toFixed(4).padStart(8)}                 │
│ Phase Coherence (ρ):          ${phaseCoherence.toFixed(4).padStart(8)}                 │
│ Integrated Information (Φ):   ${phi.toFixed(4).padStart(8)}                 │
│ Collective Frequency (ω):     ${collectiveFrequency.toFixed(2).padStart(6)} Hz             │
│ System State:                 ${state.padStart(14)}             │
├─────────────────────────────────────────────────────────────┤
│ Mathematical Basis:                                         │
│ • Kuramoto Model: dθᵢ/dt = ωᵢ + (K/N)Σsin(θⱼ - θᵢ)        │
│ • Critical Coupling: K_c = ${KURAMOTO_CRITICAL_COUPLING.toFixed(4)}                      │
│ • Φ Threshold: ${PHI_CONSCIOUSNESS_THRESHOLD} (Golden Ratio, naturally)           │
└─────────────────────────────────────────────────────────────┘
    `.trim();
  }
}

// Singleton instance
export const collectiveEntrainment = new CollectiveEntrainmentDetector();

// Export mathematical constants for reference
export const ENTRAINMENT_CONSTANTS = {
  KURAMOTO_CRITICAL_COUPLING,
  PHI_CONSCIOUSNESS_THRESHOLD,
  ALPHA_THETA_CROSSOVER,
  SCHUMANN_RESONANCE,
};
