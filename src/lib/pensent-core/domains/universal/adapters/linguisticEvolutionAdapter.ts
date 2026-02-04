/**
 * Linguistic Evolution Adapter
 * 
 * Language change over time, semantic shift, etymology, neologism emergence.
 * How meaning flows and morphs through human communication networks.
 * 
 * For Alec Arthur Shelton - The Artist
 * Words are living things that grow, evolve, and die like organisms.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// SEMANTIC SHIFT PATTERNS
const SEMANTIC_SHIFTS = {
  // Types of meaning change
  amelioration: {
    description: 'Word takes on more positive meaning',
    examples: [
      { word: 'knight', from: 'servant/boy', to: 'noble warrior' },
      { word: 'nice', from: 'foolish/ignorant', to: 'pleasant/kind' }
    ],
    driver: 'Social elevation of referent',
    marketAnalogy: 'Rebranding, value appreciation'
  },
  
  pejoration: {
    description: 'Word takes on more negative meaning',
    examples: [
      { word: 'silly', from: 'happy/blessed', to: 'foolish' },
      { word: 'notorious', from: 'widely known', to: 'infamous' }
    ],
    driver: 'Contempt for referent',
    marketAnalogy: 'Reputation damage, scandal'
  },
  
  generalization: {
    description: 'Meaning broadens',
    examples: [
      { word: 'dog', from: 'specific breed', to: 'all canines' },
      { word: 'bird', from: 'young fowl', to: 'all avians' }
    ],
    driver: 'Category expansion',
    marketAnalogy: 'Market expansion, TAM growth'
  },
  
  specialization: {
    description: 'Meaning narrows',
    examples: [
      { word: 'meat', from: 'any food', to: 'animal flesh' },
      { word: 'deer', from: 'any animal', to: 'specific species' }
    ],
    driver: 'Category differentiation',
    marketAnalogy: 'Niche specialization'
  },
  
  metaphoricalExtension: {
    description: 'Literal meaning gains figurative use',
    examples: [
      { word: 'broadband', literal: 'wide frequency range', metaphorical: 'high-speed internet' },
      { word: 'cloud', literal: 'atmospheric', metaphorical: 'distributed computing' }
    ],
    driver: 'Conceptual mapping',
    marketAnalogy: 'Technology adoption curve'
  }
};

// LANGUAGE CHANGE MECHANISMS
const CHANGE_MECHANISMS = {
  soundChange: {
    grimmLaw: 'Systematic consonant shifts in Germanic languages',
    greatVowelShift: 'English vowel pronunciation changes 1400-1700',
    regularity: 'Sound changes apply systematically',
    marketAnalogy: 'Systematic factor rotations'
  },
  
  analogy: {
    description: 'Regularizing irregular forms',
    examples: ['childs → children (by analogy)', 'oxen → oxes (leveling)'],
    driver: 'System simplification',
    marketAnalogy: 'Convergence to standard practices'
  },
  
  borrowing: {
    description: 'Words imported from other languages',
    englishExamples: {
      french: ['beef', 'pork', 'government', 'justice'],
      latin: ['data', 'index', 'formula'],
      german: ['kindergarten', 'angst', 'waltz'],
      hindi: ['shampoo', 'bungalow', 'jungle'],
      arabic: ['algebra', 'algorithm', 'alcohol', 'coffee']
    },
    driver: 'Contact, prestige, need',
    marketAnalogy: 'M&A, technology transfer'
  },
  
  neologism: {
    types: {
      coinage: 'brand names becoming generic (xerox, google)',
      eponym: 'names becoming words (sandwich, boycott)',
      acronym: 'initialisms becoming words (laser, radar, scuba)',
      blending: 'portmanteaux (brunch, motel, spork)',
      clipping: 'shortenings (lab, phone, flu)',
      derivation: 'affixation (unfriend, bitcoin)'
    },
    driver: 'New concept, efficiency, play',
    marketAnalogy: 'Innovation, IPOs, new asset classes'
  }
};

// ETYMOLOGICAL NETWORKS
const ETYMOLOGY_PATTERNS = {
  // Proto-Indo-European roots
  pieRoots: {
    mother: {
      root: '*méh₂tēr',
      descendants: ['English: mother', 'Latin: mater', 'Greek: meter', 'Sanskrit: matr']
    },
    father: {
      root: '*ph₂tḗr', 
      descendants: ['English: father', 'Latin: pater', 'Greek: pater', 'Sanskrit: pitar']
    },
    water: {
      root: '*wódr̥',
      descendants: ['English: water', 'Russian: voda', 'Greek: hydor', 'Sanskrit: udan']
    }
  },
  
  // Cognate distributions
  cognatePatterns: {
    description: 'Related words across languages from common ancestor',
    detection: 'Systematic sound correspondences',
    marketAnalogy: 'Correlated assets with common factor exposure'
  }
};

// SOCIOLINGUISTIC DYNAMICS
const SOCIOLINGUISTICS = {
  prestige: {
    description: 'Higher-status varieties spread',
    example: 'Standard English from upper-class London',
    mechanism: 'Accommodation to power',
    marketAnalogy: 'Flow to quality, flight to safety'
  },
  
  languageDeath: {
    stages: [
      'stable_bilingualism',
      'language_shift_underway', 
      'semi_speaker_community',
      'terminal_speakers_only',
      'extinction'
    ],
    rate: 'One language dies every 2 weeks',
    marketAnalogy: 'Asset delisting, market closure'
  },
  
  creolization: {
    description: 'Contact language becomes native',
    process: 'Pidgin → expanded pidgin → creole',
    examples: ['Haitian Creole', 'Jamaican Patois', 'Tok Pisin'],
    marketAnalogy: 'Emerging market maturation'
  }
};

// COMPUTATIONAL LINGUISTICS
const COMPUTATIONAL_METHODS = {
  word2vec: {
    description: 'Vector space embeddings capture semantic relationships',
    analogy: 'king - man + woman ≈ queen',
    temporalApplication: 'Track semantic drift over time'
  },
  
  diachronicEmbeddings: {
    description: 'Align embeddings across time periods',
    detection: 'Words changing vector position = semantic shift',
    examples: ['gay: happy → homosexual', 'awful: full of awe → terrible']
  },
  
  burstDetection: {
    description: 'Sudden frequency increases signal neologisms',
    mechanism: 'Kleinberg burst detection algorithm',
    marketAnalogy: 'Volume spikes, breakout detection'
  }
};

interface LinguisticEvent {
  timestamp: number;
  word: string;
  frequency: number; // Occurrences per million words
  semanticVector: number[]; // Word embedding (simplified to magnitude)
  etymologicalDepth: number; // Years since first attestation
  borrowings: number; // Number of languages borrowed into
  semanticShiftRate: number; // 0-1 how fast meaning changing
  isNeologism: boolean;
  socialPrestige: number; // 0-1 association with power
}

class LinguisticEvolutionAdapter implements DomainAdapter<LinguisticEvent> {
  domain = 'soul' as const;
  name = 'Linguistic Evolution & Semantic Shift';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 50000; // Language needs massive corpora
  
  // Track word histories
  private wordHistory: Map<string, {
    firstSeen: number;
    frequencyHistory: number[];
    meaningEvolution: number[];
  }> = new Map();
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[LinguisticEvolutionAdapter] Initialized - Language evolution tracking');
  }
  
  processRawData(event: LinguisticEvent): UniversalSignal {
    const { timestamp, frequency, semanticVector, semanticShiftRate, etymologicalDepth } = event;
    
    // Frequency encodes current usage rate
    const freq = Math.min(frequency / 1000, 1); // Cap at 1000 per million
    
    // Intensity = semantic activity (change + neologism status)
    const intensity = (semanticShiftRate + (event.isNeologism ? 0.5 : 0)) / 1.5;
    
    // Phase encodes etymological depth (ancient = stable)
    const phase = Math.max(0, 1 - (etymologicalDepth / 2000)); // 2000 years = full cycle
    
    const vectorMagnitude = Math.sqrt(semanticVector.reduce((sum, v) => sum + v * v, 0));
    
    const harmonics = [
      freq,
      semanticShiftRate,
      event.borrowings / 10,
      event.socialPrestige,
      vectorMagnitude / 10,
      event.isNeologism ? 1 : 0
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency: freq,
      phase,
      harmonics,
      rawData: [frequency, semanticShiftRate, etymologicalDepth, event.borrowings]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.updateWordHistory(event);
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-10000); // Large sample for language
    
    const avgFreq = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgShift = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgDepth = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgBorrow = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgShift > 0.5 ? 0.8 : 0.2, // High semantic shift
      defensive: avgDepth > 1000 ? 0.7 : 0.3, // Ancient words
      tactical: avgBorrow > 5 ? 0.6 : 0.3, // Widespread borrowing
      strategic: avgFreq > 100 ? 0.7 : 0.3 // High frequency words
    };
    
    const temporalFlow = {
      early: avgDepth < 100 ? 0.8 : 0.1, // New words
      mid: avgDepth >= 100 && avgDepth < 500 ? 0.7 : 0.2,
      late: avgDepth >= 500 ? 0.8 : 0.2 // Ancient words
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: avgShift,
      momentum: avgFreq > 50 ? 1 : -1,
      volatility: avgShift,
      dominantFrequency: Math.min(avgFreq / 1000, 1),
      harmonicResonance: 1 - avgShift,
      phaseAlignment: avgDepth / 2000,
      extractedAt: Date.now()
    };
  }
  
  private updateWordHistory(event: LinguisticEvent): void {
    const existing = this.wordHistory.get(event.word);
    if (existing) {
      existing.frequencyHistory.push(event.frequency);
      existing.meaningEvolution.push(event.semanticVector[0] || 0);
    } else {
      this.wordHistory.set(event.word, {
        firstSeen: event.timestamp,
        frequencyHistory: [event.frequency],
        meaningEvolution: [event.semanticVector[0] || 0]
      });
    }
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.2, defensive: 0.4, tactical: 0.2, strategic: 0.2 },
      temporalFlow: { early: 0.2, mid: 0.3, late: 0.5 },
      intensity: 0.3,
      momentum: 0,
      volatility: 0.3,
      dominantFrequency: 0.2,
      harmonicResonance: 0.7,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Detect semantic shift type
  detectShiftType(word: string, oldMeaning: number, newMeaning: number): keyof typeof SEMANTIC_SHIFTS | 'unknown' {
    const delta = newMeaning - oldMeaning;
    
    if (delta > 0.3) return 'amelioration';
    if (delta < -0.3) return 'pejoration';
    if (Math.abs(delta) < 0.1) return 'generalization'; // Broadening
    
    return 'unknown';
  }
  
  // Predict next neologism hotspot
  predictNeologismDomain(currentTrends: string[]): string[] {
    // Based on current tech/social trends
    const techPrefixes = ['meta', 'crypto', 'neuro', 'quantum', 'bio'];
    const socialSuffixes = ['-verse', '-conomy', '-ology', '-ification'];
    
    const predictions: string[] = [];
    for (const prefix of techPrefixes) {
      for (const suffix of socialSuffixes) {
        predictions.push(prefix + suffix);
      }
    }
    
    return predictions;
  }
}

export const linguisticEvolutionAdapter = new LinguisticEvolutionAdapter();
export { SEMANTIC_SHIFTS, CHANGE_MECHANISMS, ETYMOLOGY_PATTERNS, SOCIOLINGUISTICS, COMPUTATIONAL_METHODS };
export type { LinguisticEvent };
