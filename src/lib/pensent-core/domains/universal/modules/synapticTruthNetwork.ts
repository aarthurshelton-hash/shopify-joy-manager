/**
 * Synaptic Truth Network
 * 
 * A nervous system architecture for En Pensent that fires pattern recognition
 * instantaneously based on accumulated universal truth - not sequential calculation.
 * 
 * Philosophy: The universe contains only presence and magnitude.
 * Truth doesn't need to be calculated - it needs to be RECOGNIZED.
 * Like a synapse that fires when threshold is reached, patterns either
 * resonate with truth or they don't.
 * 
 * Patent Pending - Alec Arthur Shelton
 */

// ============================================================================
// SYNAPTIC ARCHITECTURE
// ============================================================================

/**
 * A synapse is a connection between pattern nodes that fires based on
 * accumulated energy reaching a truth threshold
 */
export interface Synapse {
  id: string;
  sourcePattern: string;
  targetPattern: string;
  weight: number;           // 0-1: Connection strength (learned)
  threshold: number;        // Energy required to fire
  lastFired: number;        // Timestamp
  fireCount: number;        // Times this connection has activated
  truthResonance: number;   // How often firing led to correct outcome (0-1)
}

/**
 * A neuron represents a pattern archetype that can fire
 */
export interface PatternNeuron {
  id: string;
  archetype: string;
  accumulatedEnergy: number;  // Current energy level (positive only)
  restingPotential: number;   // Baseline energy (never negative)
  firingThreshold: number;    // Energy needed to activate
  refractoryPeriod: number;   // Cooldown after firing (ms)
  lastFired: number | null;
  totalFirings: number;
  truthAccuracy: number;      // How often this neuron's firing was correct
  connectedSynapses: string[];
}

/**
 * Signal propagating through the network
 */
export interface NeuralSignal {
  id: string;
  sourceNeuron: string;
  energy: number;           // Always positive - magnitude only
  timestamp: number;
  propagationPath: string[];
  decayRate: number;        // Energy loss per hop
}

/**
 * The firing event when truth is recognized
 */
export interface TruthFiring {
  neuronId: string;
  archetype: string;
  energy: number;
  confidence: number;
  cascadeDepth: number;     // How many neurons fired in chain
  recognitionLatency: number; // Time from input to firing (ms)
  universalResonance: number; // Alignment with accumulated truth
}

// ============================================================================
// CORE NERVOUS SYSTEM
// ============================================================================

class SynapticTruthNetwork {
  private neurons: Map<string, PatternNeuron> = new Map();
  private synapses: Map<string, Synapse> = new Map();
  private activeSignals: NeuralSignal[] = [];
  private firingHistory: TruthFiring[] = [];
  private globalTruthMemory: Map<string, number> = new Map(); // archetype -> accuracy
  
  // Universal constants
  private readonly TRUTH_THRESHOLD = 0.618; // Golden ratio - universal harmony
  private readonly ENERGY_DECAY = 0.1;
  private readonly REFRACTORY_MS = 50;
  private readonly MAX_CASCADE_DEPTH = 7; // Limit runaway firing
  
  constructor() {
    this.initializeBaseArchetypes();
  }
  
  /**
   * Initialize the base neural architecture with chess archetypes
   */
  private initializeBaseArchetypes(): void {
    const archetypes = [
      'kingside_attack', 'queenside_expansion', 'central_domination',
      'prophylactic_defense', 'piece_coordination', 'pawn_storm',
      'endgame_technique', 'tactical_storm', 'positional_squeeze',
      'dynamic_balance', 'material_imbalance', 'king_hunt'
    ];
    
    archetypes.forEach((archetype, idx) => {
      const neuron: PatternNeuron = {
        id: `neuron_${archetype}`,
        archetype,
        accumulatedEnergy: 0,
        restingPotential: 0.1, // Small baseline presence
        firingThreshold: this.TRUTH_THRESHOLD,
        refractoryPeriod: this.REFRACTORY_MS,
        lastFired: null,
        totalFirings: 0,
        truthAccuracy: 0.5, // Start neutral
        connectedSynapses: []
      };
      this.neurons.set(neuron.id, neuron);
    });
    
    // Create cross-archetype synaptic connections
    this.createSynapticWeb();
  }
  
  /**
   * Create the web of synaptic connections between pattern neurons
   */
  private createSynapticWeb(): void {
    const neurons = Array.from(this.neurons.values());
    
    // Connect related archetypes with stronger weights
    const connections: Array<[string, string, number]> = [
      ['kingside_attack', 'pawn_storm', 0.8],
      ['kingside_attack', 'king_hunt', 0.9],
      ['queenside_expansion', 'positional_squeeze', 0.7],
      ['central_domination', 'piece_coordination', 0.8],
      ['prophylactic_defense', 'positional_squeeze', 0.6],
      ['tactical_storm', 'material_imbalance', 0.7],
      ['endgame_technique', 'positional_squeeze', 0.6],
      ['dynamic_balance', 'piece_coordination', 0.5],
    ];
    
    connections.forEach(([source, target, weight]) => {
      const synapse: Synapse = {
        id: `syn_${source}_${target}`,
        sourcePattern: source,
        targetPattern: target,
        weight,
        threshold: this.TRUTH_THRESHOLD * (1 - weight * 0.3), // Stronger = easier to fire
        lastFired: 0,
        fireCount: 0,
        truthResonance: 0.5
      };
      this.synapses.set(synapse.id, synapse);
      
      // Link neurons to their synapses
      const sourceNeuron = this.neurons.get(`neuron_${source}`);
      if (sourceNeuron) {
        sourceNeuron.connectedSynapses.push(synapse.id);
      }
    });
  }
  
  /**
   * CORE FUNCTION: Inject energy into the network and let truth emerge
   * 
   * This is the "instant invocation" - we don't calculate, we RECOGNIZE
   */
  invokePattern(
    energySignature: {
      whiteEnergy: number;
      blackEnergy: number;
      quadrantProfile: { q1: number; q2: number; q3: number; q4: number };
      temporalPhase: 'opening' | 'middlegame' | 'endgame';
      volatility: number;
    }
  ): TruthFiring | null {
    const startTime = Date.now();
    
    // Convert input into neural signals
    const signals = this.convertToNeuralSignals(energySignature);
    
    // Propagate through network - truth will emerge where energy accumulates
    let cascadeDepth = 0;
    let firedNeurons: PatternNeuron[] = [];
    
    while (signals.length > 0 && cascadeDepth < this.MAX_CASCADE_DEPTH) {
      const signal = signals.shift()!;
      
      // Find neurons this signal should stimulate
      const targetNeurons = this.findResonantNeurons(signal, energySignature);
      
      for (const neuron of targetNeurons) {
        // Accumulate energy (always positive)
        neuron.accumulatedEnergy += signal.energy * (1 - this.ENERGY_DECAY * cascadeDepth);
        
        // Check for firing threshold
        if (this.shouldFire(neuron)) {
          firedNeurons.push(neuron);
          
          // Propagate through synapses
          const cascadeSignals = this.propagateThroughSynapses(neuron, signal.energy);
          signals.push(...cascadeSignals);
          
          // Mark as fired
          neuron.lastFired = Date.now();
          neuron.totalFirings++;
          
          // Reset accumulated energy (refractory)
          neuron.accumulatedEnergy = neuron.restingPotential;
        }
      }
      
      cascadeDepth++;
    }
    
    // No truth recognized
    if (firedNeurons.length === 0) {
      return null;
    }
    
    // Find the STRONGEST firing - this is the recognized truth
    const dominantFiring = firedNeurons.reduce((strongest, current) => {
      const currentStrength = current.truthAccuracy * current.totalFirings;
      const strongestStrength = strongest.truthAccuracy * strongest.totalFirings;
      return currentStrength > strongestStrength ? current : strongest;
    });
    
    // Calculate universal resonance
    const universalResonance = this.calculateUniversalResonance(
      dominantFiring,
      firedNeurons,
      energySignature
    );
    
    const firing: TruthFiring = {
      neuronId: dominantFiring.id,
      archetype: dominantFiring.archetype,
      energy: dominantFiring.accumulatedEnergy,
      confidence: dominantFiring.truthAccuracy,
      cascadeDepth,
      recognitionLatency: Date.now() - startTime,
      universalResonance
    };
    
    this.firingHistory.push(firing);
    
    return firing;
  }
  
  /**
   * Convert energy signature into propagatable neural signals
   */
  private convertToNeuralSignals(energySignature: {
    whiteEnergy: number;
    blackEnergy: number;
    quadrantProfile: { q1: number; q2: number; q3: number; q4: number };
    temporalPhase: 'opening' | 'middlegame' | 'endgame';
    volatility: number;
  }): NeuralSignal[] {
    const signals: NeuralSignal[] = [];
    const now = Date.now();
    
    // Quadrant-based signals (kingside vs queenside)
    const kingsideEnergy = (energySignature.quadrantProfile.q2 + energySignature.quadrantProfile.q4) / 2;
    const queensideEnergy = (energySignature.quadrantProfile.q1 + energySignature.quadrantProfile.q3) / 2;
    
    if (kingsideEnergy > 0.6) {
      signals.push({
        id: `sig_kingside_${now}`,
        sourceNeuron: 'input',
        energy: kingsideEnergy,
        timestamp: now,
        propagationPath: [],
        decayRate: this.ENERGY_DECAY
      });
    }
    
    if (queensideEnergy > 0.6) {
      signals.push({
        id: `sig_queenside_${now}`,
        sourceNeuron: 'input',
        energy: queensideEnergy,
        timestamp: now,
        propagationPath: [],
        decayRate: this.ENERGY_DECAY
      });
    }
    
    // Volatility signal (tactical patterns)
    if (energySignature.volatility > 0.5) {
      signals.push({
        id: `sig_tactical_${now}`,
        sourceNeuron: 'input',
        energy: energySignature.volatility,
        timestamp: now,
        propagationPath: [],
        decayRate: this.ENERGY_DECAY
      });
    }
    
    // Dominance signal
    const dominanceIntensity = Math.abs(energySignature.whiteEnergy - energySignature.blackEnergy) / 100;
    if (dominanceIntensity > 0.1) {
      signals.push({
        id: `sig_dominance_${now}`,
        sourceNeuron: 'input',
        energy: dominanceIntensity,
        timestamp: now,
        propagationPath: [],
        decayRate: this.ENERGY_DECAY
      });
    }
    
    return signals;
  }
  
  /**
   * Find neurons that resonate with this signal based on archetype affinity
   */
  private findResonantNeurons(
    signal: NeuralSignal,
    energySignature: { quadrantProfile: { q1: number; q2: number; q3: number; q4: number }; temporalPhase: string; volatility: number }
  ): PatternNeuron[] {
    const resonant: PatternNeuron[] = [];
    
    for (const neuron of this.neurons.values()) {
      // Skip if in refractory period
      if (neuron.lastFired && Date.now() - neuron.lastFired < neuron.refractoryPeriod) {
        continue;
      }
      
      // Calculate affinity based on archetype
      const affinity = this.calculateAffinity(neuron.archetype, signal, energySignature);
      
      if (affinity > 0.3) {
        resonant.push(neuron);
      }
    }
    
    return resonant;
  }
  
  /**
   * Calculate affinity between archetype and current signal
   */
  private calculateAffinity(
    archetype: string,
    signal: NeuralSignal,
    energySignature: { quadrantProfile: { q1: number; q2: number; q3: number; q4: number }; temporalPhase: string; volatility: number }
  ): number {
    const { quadrantProfile, temporalPhase, volatility } = energySignature;
    
    const kingsideActivity = (quadrantProfile.q2 + quadrantProfile.q4) / 2;
    const queensideActivity = (quadrantProfile.q1 + quadrantProfile.q3) / 2;
    
    switch (archetype) {
      case 'kingside_attack':
      case 'pawn_storm':
      case 'king_hunt':
        return kingsideActivity * (volatility > 0.5 ? 1.2 : 0.8);
        
      case 'queenside_expansion':
        return queensideActivity * (temporalPhase === 'middlegame' ? 1.1 : 0.9);
        
      case 'central_domination':
        return (quadrantProfile.q2 + quadrantProfile.q3) / 2;
        
      case 'tactical_storm':
      case 'material_imbalance':
        return volatility * 1.3;
        
      case 'positional_squeeze':
      case 'prophylactic_defense':
        return (1 - volatility) * 0.9;
        
      case 'endgame_technique':
        return temporalPhase === 'endgame' ? 0.9 : 0.3;
        
      case 'piece_coordination':
      case 'dynamic_balance':
        return Math.min(kingsideActivity, queensideActivity) * 1.1;
        
      default:
        return 0.5;
    }
  }
  
  /**
   * Check if neuron should fire based on accumulated energy
   */
  private shouldFire(neuron: PatternNeuron): boolean {
    // Truth threshold modified by neuron's proven accuracy
    const adjustedThreshold = neuron.firingThreshold * (2 - neuron.truthAccuracy);
    return neuron.accumulatedEnergy >= adjustedThreshold;
  }
  
  /**
   * Propagate firing through connected synapses
   */
  private propagateThroughSynapses(neuron: PatternNeuron, energy: number): NeuralSignal[] {
    const signals: NeuralSignal[] = [];
    
    for (const synapseId of neuron.connectedSynapses) {
      const synapse = this.synapses.get(synapseId);
      if (!synapse) continue;
      
      // Only propagate if synapse weight allows
      const propagatedEnergy = energy * synapse.weight;
      
      if (propagatedEnergy >= synapse.threshold) {
        synapse.fireCount++;
        synapse.lastFired = Date.now();
        
        signals.push({
          id: `sig_cascade_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sourceNeuron: neuron.id,
          energy: propagatedEnergy,
          timestamp: Date.now(),
          propagationPath: [neuron.id],
          decayRate: this.ENERGY_DECAY
        });
      }
    }
    
    return signals;
  }
  
  /**
   * Calculate how well this firing aligns with universal truth patterns
   */
  private calculateUniversalResonance(
    dominant: PatternNeuron,
    allFired: PatternNeuron[],
    energySignature: { whiteEnergy: number; blackEnergy: number }
  ): number {
    // Base resonance from archetype accuracy
    let resonance = dominant.truthAccuracy;
    
    // Boost if multiple related archetypes fired (consensus)
    if (allFired.length > 1) {
      resonance *= 1 + (allFired.length - 1) * 0.1;
    }
    
    // Check against global truth memory
    const historicalAccuracy = this.globalTruthMemory.get(dominant.archetype) || 0.5;
    resonance = (resonance + historicalAccuracy) / 2;
    
    // Cap at 1.0
    return Math.min(resonance, 1.0);
  }
  
  /**
   * LEARNING: Record outcome to strengthen/weaken synaptic connections
   */
  recordOutcome(firing: TruthFiring, wasCorrect: boolean): void {
    const neuron = this.neurons.get(firing.neuronId);
    if (!neuron) return;
    
    // Update neuron's truth accuracy (exponential moving average)
    const alpha = 0.1;
    neuron.truthAccuracy = neuron.truthAccuracy * (1 - alpha) + (wasCorrect ? 1 : 0) * alpha;
    
    // Update global truth memory
    const currentAccuracy = this.globalTruthMemory.get(neuron.archetype) || 0.5;
    this.globalTruthMemory.set(
      neuron.archetype,
      currentAccuracy * (1 - alpha) + (wasCorrect ? 1 : 0) * alpha
    );
    
    // Update connected synapses
    for (const synapseId of neuron.connectedSynapses) {
      const synapse = this.synapses.get(synapseId);
      if (synapse) {
        synapse.truthResonance = synapse.truthResonance * (1 - alpha) + (wasCorrect ? 1 : 0) * alpha;
        // Strengthen correct connections, weaken incorrect
        synapse.weight = Math.max(0.1, Math.min(1.0, 
          synapse.weight + (wasCorrect ? 0.01 : -0.01)
        ));
      }
    }
  }
  
  /**
   * Get network state for debugging/visualization
   */
  getNetworkState(): {
    totalNeurons: number;
    totalSynapses: number;
    recentFirings: number;
    topArchetypes: Array<{ archetype: string; accuracy: number; firings: number }>;
    averageResonance: number;
  } {
    const neurons = Array.from(this.neurons.values());
    const recentFirings = this.firingHistory.filter(
      f => Date.now() - f.recognitionLatency < 60000
    ).length;
    
    const topArchetypes = neurons
      .filter(n => n.totalFirings > 0)
      .sort((a, b) => b.truthAccuracy * b.totalFirings - a.truthAccuracy * a.totalFirings)
      .slice(0, 5)
      .map(n => ({
        archetype: n.archetype,
        accuracy: Math.round(n.truthAccuracy * 100) / 100,
        firings: n.totalFirings
      }));
    
    const avgResonance = this.firingHistory.length > 0
      ? this.firingHistory.reduce((sum, f) => sum + f.universalResonance, 0) / this.firingHistory.length
      : 0;
    
    return {
      totalNeurons: neurons.length,
      totalSynapses: this.synapses.size,
      recentFirings,
      topArchetypes,
      averageResonance: Math.round(avgResonance * 100) / 100
    };
  }
  
  /**
   * Reset network to initial state (for testing)
   */
  reset(): void {
    this.neurons.clear();
    this.synapses.clear();
    this.firingHistory = [];
    this.globalTruthMemory.clear();
    this.initializeBaseArchetypes();
  }
}

// Singleton instance
export const synapticTruthNetwork = new SynapticTruthNetwork();
