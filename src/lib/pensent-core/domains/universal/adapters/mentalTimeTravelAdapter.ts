/**
 * Mental Time Travel & Reality Testing Adapter
 * 
 * How humans distinguish:
 * - Present imagination (simulated futures)
 * - Episodic memory (reconstructed pasts)  
 * - Dreams (liminal reality)
 * 
 * The mind's ability to navigate temporal reality subjectively
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// Mental States - The Three Temporal Realities
const MENTAL_STATES = {
  imagination: {
    name: 'Prospection',
    temporalDirection: 'future',
    neuralSignature: 'defaultModeNetwork_dominant',
    characteristics: ['generative', 'counterfactual', 'unconstrained', 'vividness_variable'],
    marketAnalogy: 'Scenario planning, risk modeling, speculative positions'
  },
  memory: {
    name: 'Retrospection', 
    temporalDirection: 'past',
    neuralSignature: 'hippocampal_cortical_reactivation',
    characteristics: ['reconstructive', 'detail_degradation', 'emotional_tagged', 'confidence_weighted'],
    marketAnalogy: 'Backtesting, historical pattern recognition, experience-based bias'
  },
  dream: {
    name: 'Liminal Cognition',
    temporalDirection: 'atemporal',
    neuralSignature: 'REM_sleep_dissociated',
    characteristics: ['logic_suspended', 'emotional_intensified', 'memory_consolidation', 'creative_synthesis'],
    marketAnalogy: 'Intuition, breakthrough insights, subconscious pattern detection'
  }
};

// Reality Testing Mechanisms
const REALITY_MONITORING = {
  sourceMonitoring: {
    description: 'Did I experience this or imagine it?',
    cues: ['sensory_detail', 'contextual_embedding', 'emotional_valence'],
    failure: 'Source confusion, false memories, déjà vu'
  },
  temporalTagging: {
    description: 'When did this happen?',
    mechanisms: ['chronological_context', 'autonoetic_consciousness', 'mental_time_travel'],
    failure: 'Temporal displacement, jamais vu'
  },
  vividnessCalibration: {
    description: 'How real does this feel?',
    factors: ['sensory_fidelity', 'emotional_intensity', 'narrative_coherence'],
    failure: 'Hyper-vivid imagination, flat memories'
  }
};

// Neural Substrates (Real Brain Networks)
const NEURAL_ARCHITECTURE = {
  defaultModeNetwork: {
    regions: ['medial_prefrontal_cortex', 'posterior_cingulate', 'angular_gyrus'],
    function: 'Self-referential processing, mind-wandering, imagination',
    marketCorrelation: 'Narrative-driven trading decisions'
  },
  hippocampus: {
    function: 'Episodic memory encoding/consolidation, spatial navigation, scene construction',
    marketCorrelation: 'Pattern memory, support/resistance levels'
  },
  prefrontalCortex: {
    function: 'Executive control, reality monitoring, working memory',
    marketCorrelation: 'Risk management, position sizing, discipline'
  }
};

// Mental Time Travel (Endel Tulving's Concept)
const CHRONESTHESIA = {
  definition: 'Awareness of subjective time, ability to relive past and prelive future',
  autonoeticConsciousness: 'Self-knowing awareness of ones own existence in time',
  
  mentalTimeTravelAccuracy: {
    past: 0.7, // Memories reconstruct with 70% accuracy
    future: 0.3, // Imagination is less constrained
    dream: 0.1 // Highly unreliable but creative
  },
  
  temporalMarketInsight: 'Traders mentally simulate outcomes before executing'
};

// Dream Science (Real Sleep Research)
const ONEIRIC_PATTERNS = {
  remCycles: {
    duration: '90-120 minutes',
    remDuration: '10-60 minutes increasing through night',
    dreamIntensity: 'Correlates with REM duration'
  },
  
  dreamContent: {
    threatSimulation: '70% of dreams involve negative emotions (evolutionary threat rehearsal)',
    problemSolving: 'REM sleep enhances creative insight',
    memoryConsolidation: 'Hippocampus replays experiences for cortex storage'
  },
  
  lucidity: {
    definition: 'Awareness that one is dreaming while dreaming',
    prevalence: '20-50% of people have experienced',
    control: '10-20% can control dream content',
    marketAnalogy: 'Meta-awareness of ones own cognitive biases'
  }
};

interface MentalTimeTravelData {
  state: keyof typeof MENTAL_STATES;
  temporalDistance: number; // Years from present
  vividness: number; // 0-1 sensory fidelity
  emotionalIntensity: number; // 0-1 emotional charge
  realityConfidence: number; // 0-1 certainty this is real
  sourceClarity: number; // 0-1 clear on origin
  timestamp: number;
}

class MentalTimeTravelAdapter implements DomainAdapter<MentalTimeTravelData> {
  domain = 'soul' as const;
  name = 'Mental Time Travel & Reality Testing';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[MentalTimeTravelAdapter] Initialized - Reality testing active');
  }
  
  processRawData(data: MentalTimeTravelData): UniversalSignal {
    const { state, temporalDistance, vividness, emotionalIntensity, realityConfidence, timestamp } = data;
    
    const stateData = MENTAL_STATES[state] || MENTAL_STATES.imagination;
    
    // Frequency encodes temporal distance (further = lower frequency)
    const frequency = 1 / (Math.abs(temporalDistance) + 1);
    
    // Intensity = vividness × emotional intensity
    const intensity = vividness * emotionalIntensity;
    
    // Phase encodes reality confidence
    const phase = realityConfidence * Math.PI * 2;
    
    const harmonics = [
      vividness,
      emotionalIntensity,
      realityConfidence,
      data.sourceClarity,
      state === 'dream' ? 0.8 : 0.2,
      temporalDistance > 0 ? 1 : 0, // Future vs past
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [vividness, emotionalIntensity, realityConfidence, temporalDistance]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-100);
    
    // Calculate dominant frequency from recent signals
    const dominantFreq = recent.reduce((sum, s) => sum + s.frequency, 0) / recent.length;
    
    // Calculate quadrant profile
    const vividness = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const emotion = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const reality = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const temporal = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: emotion * (1 - reality), // High emotion, low reality check
      defensive: reality * (1 - emotion), // High reality, low emotion
      tactical: vividness * (1 - reality), // Vivid but uncertain
      strategic: reality * emotion // Grounded emotional awareness
    };
    
    // Temporal flow
    const temporalFlow = {
      early: temporal < 0 ? Math.abs(temporal) : 0.1, // Past-focused
      mid: 0.4,
      late: temporal > 0 ? temporal : 0.1 // Future-focused
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: vividness * emotion,
      momentum: temporal / 10,
      volatility: 1 - reality,
      dominantFrequency: dominantFreq,
      harmonicResonance: reality,
      phaseAlignment: reality,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 1,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Generate mental state from market conditions
  generateMarketCorrelatedData(marketMomentum: number, marketVolatility: number, sentiment: number): MentalTimeTravelData {
    // High volatility = imagination/dream state dominates
    // Low volatility = memory dominates
    
    let state: keyof typeof MENTAL_STATES = 'memory';
    if (marketVolatility > 0.7) state = 'dream';
    else if (marketVolatility > 0.4) state = 'imagination';
    
    return {
      state,
      temporalDistance: marketMomentum * 5, // -5 to +5 years
      vividness: marketVolatility * 0.8 + 0.2,
      emotionalIntensity: Math.abs(sentiment),
      realityConfidence: 1 - marketVolatility,
      sourceClarity: sentiment > 0 ? 0.7 : 0.4,
      timestamp: Date.now()
    };
  }
}

export const mentalTimeTravelAdapter = new MentalTimeTravelAdapter();
export { MENTAL_STATES, REALITY_MONITORING, CHRONESTHESIA, ONEIRIC_PATTERNS };
export type { MentalTimeTravelData };
