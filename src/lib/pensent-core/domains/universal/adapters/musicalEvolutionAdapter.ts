/**
 * Musical Evolution Adapter - Genre Development & Harmonic Innovation
 * 
 * Genre lifecycles, harmonic complexity trends, technology impact on music,
 * and sound palette evolution across time.
 * 
 * For Alec Arthur Shelton - The Artist
 * Music is the architecture of time, the mathematics of emotion.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// GENRE LIFECYCLES
const GENRE_CYCLES = {
  birth: {
    characteristics: 'Experimental, small audience, authentic',
    examples: ['Blues in Delta', 'Hip-hop in Bronx', 'Techno in Detroit'],
    driver: 'Cultural need, new technology, rebellion'
  },
  
  growth: {
    characteristics: 'Expanding audience, formalization, regional spread',
    examples: ['Rock and roll 1950s', 'Disco 1970s', 'Grunge early 90s'],
    evolution: 'Standardization of forms'
  },
  
  mainstream: {
    characteristics: 'Mass audience, commercial success, formulaic',
    examples: ['Pop rock', 'EDM festival culture', 'Trap rap'],
    tension: 'Authenticity vs commercialization'
  },
  
  fragmentation: {
    characteristics: 'Subgenres, niches, revival attempts',
    examples: ['Prog rock subgenres', 'Metal diversity', 'Electronic subcultures'],
    outcome: 'Evolution or decline'
  },
  
  revival: {
    characteristics: 'Nostalgia, retro styling, new context',
    examples: ['Rockabilly revival', 'Vinyl resurgence', '80s synthwave'],
    cycle: '20-30 year nostalgia loops'
  }
};

// HARMONIC EVOLUTION
const HARMONIC_TRENDS = {
  classical: {
    baroque: 'Functional harmony, counterpoint',
    classical: 'Clear forms, tonic-dominant',
    romantic: 'Chromaticism, modulation',
    modern: 'Atonality, serialism, neoclassicism'
  },
  
  jazz: {
    early: 'Simple harmonies, collective improvisation',
    swing: 'Standard progressions, big bands',
    bebop: 'Complex changes, fast tempos',
    modal: 'Scale-based, fewer changes',
    fusion: 'Rock/funk influences, electricity'
  },
  
  popular: {
    '1950s': 'I-vi-IV-V, doo-wop',
    '1970s': 'Complex progressions, concept albums',
    '1980s': 'Synthesizers, MTV era',
    '2000s': 'Digital production, minimalism',
    '2020s': 'Trap beats, streaming optimized'
  }
};

// TECHNOLOGY IMPACT
const MUSIC_TECH = {
  recording: {
    invention: 'Late 19th century',
    impact: 'Music as commodity, star system',
    evolution: 'Acoustic → electric → digital'
  },
  
  amplification: {
    invention: '1920s-30s',
    impact: 'Larger venues, electric guitar',
    genres: 'Rock, electric blues, jazz fusion'
  },
  
  synthesizer: {
    invention: '1960s-70s',
    impact: 'New timbres, electronic genres',
    evolution: 'Analog → digital → software'
  },
  
  digital: {
    invention: '1980s-present',
    impact: ['DAWs', 'Auto-Tune', 'Sampling', 'Streaming'],
    democratization: 'Lower barriers to creation/distribution'
  }
};

// SOUND PALETTE EVOLUTION
const TIMBRE_TRENDS = {
  acoustic: {
    era: 'Pre-20th century',
    characteristics: 'Natural instruments, room acoustics',
    intimacy: 'Direct performer-audience connection'
  },
  
  electric: {
    era: '1950s-70s',
    characteristics: 'Amplification, distortion, effects',
    power: 'Volume, sustain, new expressiveness'
  },
  
  electronic: {
    era: '1970s-2000s',
    characteristics: 'Synthesized sounds, sequencing',
    precision: 'Perfect timing, infinite timbres'
  },
  
  digital: {
    era: '2000s-present',
    characteristics: 'Software instruments, algorithmic',
    hyperreality: 'Pitch correction, quantizing, AI'
  }
};

// LISTENING PATTERNS
const CONSUMPTION_PATTERNS = {
  albumEra: {
    period: '1960s-2000s',
    format: 'LP, CD - long-form listening',
    culture: 'Deep listening, liner notes,收藏'
  },
  
  singleRevival: {
    period: '2000s-present',
    format: 'Digital singles, playlists',
    culture: 'Shuffle, algorithmic discovery'
  },
  
  streaming: {
    model: 'Access over ownership',
    economics: 'Low per-stream payout',
    discovery: 'Algorithmic recommendations'
  },
  
  live: {
    importance: 'Primary revenue for artists',
    experience: 'Communal, authentic, ephemeral',
    growth: 'Festival culture, immersive shows'
  }
};

interface MusicalEvolutionEvent {
  timestamp: number;
  genreNovelty: number; // 0-1
  harmonicComplexity: number; // 0-10
  productionInnovation: number; // 0-10
  commercialSuccess: number; // 0-10
  culturalImpact: number; // 0-10
  technologyAdoption: number; // 0-1
  retroInfluence: number; // 0-1
  streamingVelocity: number; // 0-10
  livePerformanceIntensity: number; // 0-10
}

class MusicalEvolutionAdapter implements DomainAdapter<MusicalEvolutionEvent> {
  domain = 'audio' as const;
  name = 'Musical Evolution & Genre Dynamics';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 3000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[MusicalEvolutionAdapter] Initialized - Sound evolution tracking');
  }
  
  processRawData(event: MusicalEvolutionEvent): UniversalSignal {
    const { timestamp, genreNovelty, harmonicComplexity, productionInnovation, culturalImpact, technologyAdoption } = event;
    
    // Frequency encodes innovation rate
    const frequency = genreNovelty;
    
    // Intensity = musical revolution energy
    const intensity = (productionInnovation / 10 + culturalImpact / 10) / 2 * technologyAdoption;
    
    // Phase encodes acoustic vs digital spectrum
    const phase = technologyAdoption * Math.PI;
    
    const harmonics = [
      genreNovelty,
      harmonicComplexity / 10,
      productionInnovation / 10,
      culturalImpact / 10,
      technologyAdoption,
      event.streamingVelocity / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'audio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [genreNovelty, harmonicComplexity, productionInnovation, culturalImpact, technologyAdoption]
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
    
    const recent = signals.slice(-150);
    
    const avgNovelty = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgHarmonic = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgProduction = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgCultural = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgTech = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgNovelty > 0.7 ? 0.8 : 0.2,
      defensive: avgHarmonic > 7 ? 0.7 : 0.2,
      tactical: avgProduction > 7 ? 0.7 : 0.3,
      strategic: avgCultural > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgNovelty > 0.8 ? 0.8 : 0.2,
      mid: avgCultural > 5 && avgCultural < 8 ? 0.7 : 0.2,
      late: avgCultural > 8 ? 0.8 : 0.2
    };
    
    return {
      domain: 'audio',
      quadrantProfile,
      temporalFlow,
      intensity: (avgProduction + avgCultural) / 20,
      momentum: avgNovelty > 0.6 ? 1 : -1,
      volatility: avgNovelty,
      dominantFrequency: avgNovelty,
      harmonicResonance: avgHarmonic / 10,
      phaseAlignment: avgTech,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'audio',
      quadrantProfile: { aggressive: 0.4, defensive: 0.2, tactical: 0.3, strategic: 0.1 },
      temporalFlow: { early: 0.6, mid: 0.25, late: 0.15 },
      intensity: 0.7,
      momentum: 1,
      volatility: 0.6,
      dominantFrequency: 0.8,
      harmonicResonance: 0.6,
      phaseAlignment: 0.7,
      extractedAt: Date.now()
    };
  }
}

export const musicalEvolutionAdapter = new MusicalEvolutionAdapter();
export { GENRE_CYCLES, HARMONIC_TRENDS, MUSIC_TECH, TIMBRE_TRENDS, CONSUMPTION_PATTERNS };
export type { MusicalEvolutionEvent };
