/**
 * Photonic Computing Architecture
 * 
 * Conceptual framework for the next evolution of the En Pensent engine.
 * Models computation as light-based parallel processing, inspired by:
 * 
 * 1. Optical Neural Networks - Near-speed-of-light matrix operations
 * 2. Quantum Photonics - Superposition and entanglement in optical qubits
 * 3. Biological Vision - The eye as a massively parallel optical processor
 * 
 * "The Crow Glitch" demonstrated that pattern recognition operates
 * at the speed of perception - this architecture formalizes that insight.
 */

export interface PhotonicState {
  wavelength: number; // nm - encodes information type
  amplitude: number; // Signal strength
  phase: number; // 0-2π - encodes timing/sync
  polarization: 'horizontal' | 'vertical' | 'circular' | 'elliptical';
  coherence: number; // 0-1 - signal quality
}

export interface OpticalChannel {
  id: string;
  domain: string;
  state: PhotonicState;
  bandwidth: number; // bits/second theoretical
  latency: number; // picoseconds
  interferencePatterns: Map<string, number>; // Cross-channel coupling
}

// Wavelength assignments for different domains (visible spectrum metaphor)
export const DOMAIN_WAVELENGTHS = {
  // Ultraviolet - High energy, cosmic patterns
  'cosmic': 380,
  'consciousness': 400,
  'quantum': 420,
  
  // Violet-Blue - Spiritual/abstract
  'psychedelic': 450,
  'musical': 470,
  'temporal': 490,
  
  // Green - Life/organic
  'biological': 520,
  'ecological': 540,
  'evolutionary': 560,
  
  // Yellow-Orange - Economic/social
  'cultural': 580,
  'linguistic': 590,
  'economic': 600,
  
  // Red - Material/physical
  'geological': 630,
  'molecular': 660,
  'atomic': 700,
  
  // Infrared - Base computations
  'chess': 750,
  'market': 800,
  'code': 850
} as const;

export type PhotonicDomain = keyof typeof DOMAIN_WAVELENGTHS;

// Interference pattern types
export interface InterferenceResult {
  type: 'constructive' | 'destructive' | 'partial';
  resultantAmplitude: number;
  phaseDifference: number;
  patternSignature: string;
}

// Holographic memory - stores patterns as interference patterns
export interface HolographicMemory {
  id: string;
  referenceBeam: PhotonicState;
  objectBeam: PhotonicState;
  storedPattern: string;
  recallConfidence: number;
  associations: string[];
}

class PhotonicComputingEngine {
  private channels: Map<string, OpticalChannel> = new Map();
  private memories: HolographicMemory[] = [];
  private globalCoherence: number = 0.5;
  private entanglementPairs: Map<string, string> = new Map();

  constructor() {
    this.initializeChannels();
  }

  private initializeChannels(): void {
    for (const [domain, wavelength] of Object.entries(DOMAIN_WAVELENGTHS)) {
      this.channels.set(domain, {
        id: `channel_${domain}`,
        domain,
        state: {
          wavelength,
          amplitude: 0.5,
          phase: 0,
          polarization: 'horizontal',
          coherence: 0.5
        },
        bandwidth: 1e12, // 1 Tbps theoretical
        latency: 100, // 100 picoseconds
        interferencePatterns: new Map()
      });
    }
    
    // Create entanglement pairs for correlated domains
    this.createEntanglement('chess', 'market');
    this.createEntanglement('consciousness', 'musical');
    this.createEntanglement('cultural', 'linguistic');
    this.createEntanglement('quantum', 'consciousness');
  }

  /**
   * Create quantum entanglement between two channels
   * Changes in one instantly affect the other
   */
  private createEntanglement(domainA: string, domainB: string): void {
    this.entanglementPairs.set(domainA, domainB);
    this.entanglementPairs.set(domainB, domainA);
  }

  /**
   * Inject a signal into a channel
   */
  injectSignal(
    domain: PhotonicDomain,
    signal: Partial<PhotonicState>
  ): void {
    const channel = this.channels.get(domain);
    if (!channel) return;

    // Update channel state
    channel.state = {
      ...channel.state,
      ...signal
    };

    // Propagate to entangled partner
    const partner = this.entanglementPairs.get(domain);
    if (partner) {
      const partnerChannel = this.channels.get(partner);
      if (partnerChannel) {
        // Entanglement: phase inverts, amplitude correlates
        partnerChannel.state.phase = (channel.state.phase + Math.PI) % (2 * Math.PI);
        partnerChannel.state.amplitude = 0.9 * channel.state.amplitude;
      }
    }

    // Calculate interference with adjacent wavelengths
    this.calculateInterference(domain);
  }

  /**
   * Calculate interference patterns between channels
   */
  private calculateInterference(sourceDomain: string): void {
    const sourceChannel = this.channels.get(sourceDomain);
    if (!sourceChannel) return;

    for (const [domain, channel] of this.channels) {
      if (domain === sourceDomain) continue;

      // Calculate wavelength proximity (closer = more interference)
      const wavelengthDiff = Math.abs(
        sourceChannel.state.wavelength - channel.state.wavelength
      );
      const interferenceStrength = Math.max(0, 1 - wavelengthDiff / 100);

      if (interferenceStrength > 0.1) {
        const result = this.computeInterference(
          sourceChannel.state,
          channel.state
        );
        
        sourceChannel.interferencePatterns.set(domain, result.resultantAmplitude);
        channel.interferencePatterns.set(sourceDomain, result.resultantAmplitude);
      }
    }
  }

  /**
   * Compute interference between two photonic states
   */
  private computeInterference(
    beam1: PhotonicState,
    beam2: PhotonicState
  ): InterferenceResult {
    const phaseDiff = Math.abs(beam1.phase - beam2.phase);
    
    // Constructive when phases align, destructive when opposite
    const interferenceCoeff = Math.cos(phaseDiff);
    const resultantAmplitude = Math.sqrt(
      beam1.amplitude ** 2 + 
      beam2.amplitude ** 2 + 
      2 * beam1.amplitude * beam2.amplitude * interferenceCoeff
    );

    let type: 'constructive' | 'destructive' | 'partial';
    if (Math.abs(phaseDiff) < 0.1 || Math.abs(phaseDiff - 2 * Math.PI) < 0.1) {
      type = 'constructive';
    } else if (Math.abs(phaseDiff - Math.PI) < 0.1) {
      type = 'destructive';
    } else {
      type = 'partial';
    }

    return {
      type,
      resultantAmplitude,
      phaseDifference: phaseDiff,
      patternSignature: `${type}_${beam1.wavelength}_${beam2.wavelength}`
    };
  }

  /**
   * Store a pattern holographically
   * The pattern is encoded as interference between reference and object beams
   */
  storeHolographicMemory(
    pattern: string,
    sourceStates: PhotonicState[]
  ): HolographicMemory {
    // Reference beam is the "address" - derived from pattern hash
    const referenceBeam: PhotonicState = {
      wavelength: this.hashToWavelength(pattern),
      amplitude: 1.0,
      phase: 0,
      polarization: 'horizontal',
      coherence: 1.0
    };

    // Object beam is the "content" - superposition of source states
    const objectBeam: PhotonicState = this.superpose(sourceStates);

    const memory: HolographicMemory = {
      id: `holo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      referenceBeam,
      objectBeam,
      storedPattern: pattern,
      recallConfidence: objectBeam.coherence,
      associations: []
    };

    this.memories.push(memory);
    return memory;
  }

  /**
   * Recall a pattern by illuminating with reference beam
   */
  recallHolographicMemory(pattern: string): HolographicMemory | null {
    const targetWavelength = this.hashToWavelength(pattern);
    
    // Find memories with matching reference beam
    const matches = this.memories.filter(m => 
      Math.abs(m.referenceBeam.wavelength - targetWavelength) < 10
    );

    if (matches.length === 0) return null;

    // Return highest confidence match
    return matches.reduce((best, current) => 
      current.recallConfidence > best.recallConfidence ? current : best
    );
  }

  /**
   * Superpose multiple photonic states
   * This is the core of parallel processing
   */
  private superpose(states: PhotonicState[]): PhotonicState {
    if (states.length === 0) {
      return {
        wavelength: 550,
        amplitude: 0,
        phase: 0,
        polarization: 'horizontal',
        coherence: 0
      };
    }

    // Calculate superposition
    const avgWavelength = states.reduce((s, st) => s + st.wavelength, 0) / states.length;
    
    // Amplitude adds in quadrature
    const totalAmplitude = Math.sqrt(
      states.reduce((s, st) => s + st.amplitude ** 2, 0)
    );
    
    // Phase is weighted average
    const avgPhase = states.reduce((s, st) => s + st.phase * st.amplitude, 0) / 
      states.reduce((s, st) => s + st.amplitude, 0);
    
    // Coherence degrades with more diverse states
    const wavelengthSpread = Math.max(...states.map(s => s.wavelength)) - 
                            Math.min(...states.map(s => s.wavelength));
    const coherence = Math.max(0.1, 1 - wavelengthSpread / 400);

    return {
      wavelength: avgWavelength,
      amplitude: totalAmplitude,
      phase: avgPhase % (2 * Math.PI),
      polarization: 'elliptical', // Mixed states become elliptical
      coherence
    };
  }

  /**
   * Hash string to wavelength (380-850nm range)
   */
  private hashToWavelength(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return 380 + (Math.abs(hash) % 470);
  }

  /**
   * Get global coherence across all channels
   * High coherence = all domains are synchronized
   */
  getGlobalCoherence(): number {
    const channels = Array.from(this.channels.values());
    if (channels.length === 0) return 0;

    // Calculate phase variance
    const phases = channels.map(c => c.state.phase);
    const avgPhase = phases.reduce((s, p) => s + p, 0) / phases.length;
    const phaseVariance = phases.reduce((s, p) => s + (p - avgPhase) ** 2, 0) / phases.length;

    // Low variance = high coherence
    this.globalCoherence = Math.exp(-phaseVariance / 2);
    return this.globalCoherence;
  }

  /**
   * Perform parallel optical matrix multiplication
   * This is the speed-of-light advantage of photonic computing
   */
  opticalMatrixMultiply(
    inputVector: number[],
    weightMatrix: number[][]
  ): number[] {
    // In real photonic hardware, this happens at light speed
    // via Mach-Zehnder interferometers
    // Here we simulate the result
    
    const result: number[] = [];
    for (let i = 0; i < weightMatrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < inputVector.length; j++) {
        sum += inputVector[j] * (weightMatrix[i][j] || 0);
      }
      result.push(sum);
    }
    return result;
  }

  /**
   * Get unified state across all channels
   */
  getUnifiedState(): {
    channels: Map<string, OpticalChannel>;
    globalCoherence: number;
    dominantWavelength: number;
    totalEnergy: number;
    entanglementStrength: number;
  } {
    const channels = Array.from(this.channels.values());
    
    const totalEnergy = channels.reduce((s, c) => s + c.state.amplitude ** 2, 0);
    
    // Find dominant wavelength (highest amplitude)
    const dominant = channels.reduce((best, current) => 
      current.state.amplitude > best.state.amplitude ? current : best
    );
    
    // Measure entanglement strength
    let entanglementStrength = 0;
    for (const [domainA, domainB] of this.entanglementPairs) {
      const channelA = this.channels.get(domainA);
      const channelB = this.channels.get(domainB);
      if (channelA && channelB) {
        // Perfect anti-correlation of phase indicates strong entanglement
        const phaseCorrelation = Math.abs(
          Math.cos(channelA.state.phase - channelB.state.phase - Math.PI)
        );
        entanglementStrength += phaseCorrelation;
      }
    }
    entanglementStrength /= this.entanglementPairs.size / 2;

    return {
      channels: this.channels,
      globalCoherence: this.getGlobalCoherence(),
      dominantWavelength: dominant.state.wavelength,
      totalEnergy,
      entanglementStrength
    };
  }

  /**
   * The "Crow Glitch" detector
   * Identifies moments of extreme coherence where patterns self-reference
   */
  detectGlitchInMatrix(): {
    detected: boolean;
    type: 'SYNCHRONICITY' | 'SELF_REFERENCE' | 'PATTERN_COLLAPSE' | null;
    confidence: number;
    description: string;
  } {
    const state = this.getUnifiedState();
    
    // Glitch conditions:
    // 1. Ultra-high coherence (all domains synchronized)
    // 2. Strong entanglement (correlated domains perfectly anti-phased)
    // 3. Constructive interference across multiple wavelengths
    
    const coherenceThreshold = 0.85;
    const entanglementThreshold = 0.9;
    
    if (state.globalCoherence > coherenceThreshold && state.entanglementStrength > entanglementThreshold) {
      return {
        detected: true,
        type: 'SYNCHRONICITY',
        confidence: (state.globalCoherence + state.entanglementStrength) / 2,
        description: 'All domains synchronized. The universe is paying attention.'
      };
    }
    
    // Check for self-reference (when chess/code/market all resonate)
    const chessChannel = this.channels.get('chess');
    const codeChannel = this.channels.get('code');
    const marketChannel = this.channels.get('market');
    
    if (chessChannel && codeChannel && marketChannel) {
      const tripleResonance = 
        chessChannel.state.amplitude > 0.8 &&
        codeChannel.state.amplitude > 0.8 &&
        marketChannel.state.amplitude > 0.8;
      
      if (tripleResonance) {
        return {
          detected: true,
          type: 'SELF_REFERENCE',
          confidence: 0.9,
          description: 'Chess-Code-Market triple resonance: The system sees itself.'
        };
      }
    }
    
    return {
      detected: false,
      type: null,
      confidence: 0,
      description: 'No glitch detected. Reality is stable.'
    };
  }
}

export const photonicEngine = new PhotonicComputingEngine();
