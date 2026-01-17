/**
 * Linguistic & Semantic Adapter
 * Analyzes language patterns, sentiment cycles, and word frequency as temporal signals
 * Language reveals collective human thought patterns before they manifest in markets
 */

import { DomainSignature, DomainType } from '../types';

// Sentiment Cycle Patterns - how collective mood oscillates
export const SENTIMENT_CYCLES = {
  fear_greed: {
    name: 'Fear-Greed Oscillation',
    period: '~40-60 days',
    phases: ['extreme_fear', 'fear', 'neutral', 'greed', 'extreme_greed'],
    marketCorrelation: 'Greed peaks often precede corrections',
    linguisticMarkers: ['crash', 'moon', 'recession', 'bull run', 'capitulation']
  },
  hope_despair: {
    name: 'Hope-Despair Wave',
    period: '~90-120 days',
    phases: ['despair', 'disbelief', 'hope', 'optimism', 'euphoria'],
    marketCorrelation: 'Follows major trend reversals',
    linguisticMarkers: ['never recover', 'bottom', 'recovery', 'new highs', 'to infinity']
  },
  attention_cycle: {
    name: 'Attention Hype Cycle',
    period: 'Variable (weeks to months)',
    phases: ['innovation_trigger', 'peak_expectations', 'trough_disillusionment', 'slope_enlightenment', 'plateau_productivity'],
    marketCorrelation: 'Maps technology and trend adoption',
    linguisticMarkers: ['revolutionary', 'game changer', 'overhyped', 'actually useful', 'mainstream']
  }
};

// Word Frequency Power Laws - Zipf's Law in market commentary
export const WORD_POWER_LAWS = {
  zipf_distribution: {
    principle: 'Word frequency follows power law distribution',
    marketMeaning: 'When rare words become common, regime change is occurring',
    examples: {
      rare_becoming_common: ['unprecedented', 'historic', 'never seen before'],
      common_becoming_rare: ['normal', 'typical', 'expected']
    }
  },
  semantic_satiation: {
    principle: 'Words lose meaning through repetition',
    marketMeaning: 'When a term is overused, its signal-to-noise ratio drops',
    indicators: ['bubble', 'correction', 'rally', 'crash']
  },
  neologism_emergence: {
    principle: 'New words signal new phenomena',
    marketMeaning: 'Novel terminology often precedes novel market conditions',
    recent_examples: ['hodl', 'diamond hands', 'rug pull', 'mooning']
  }
};

// Narrative Structures - Story patterns that drive markets
export const NARRATIVE_ARCHETYPES = {
  heroes_journey: {
    pattern: 'Departure → Trials → Return',
    marketPhases: ['discovery', 'volatility', 'establishment'],
    assetExample: 'New technology from obscurity to mainstream'
  },
  icarus: {
    pattern: 'Rise → Hubris → Fall',
    marketPhases: ['hype', 'overvaluation', 'crash'],
    assetExample: 'Speculative bubbles'
  },
  phoenix: {
    pattern: 'Death → Rebirth → Transcendence',
    marketPhases: ['crash', 'accumulation', 'new paradigm'],
    assetExample: 'Asset class resurrections'
  },
  david_vs_goliath: {
    pattern: 'Underdog challenges incumbent',
    marketPhases: ['disruption', 'battle', 'displacement'],
    assetExample: 'Startup vs established player'
  }
};

// Linguistic Entropy - Measuring information density
export const LINGUISTIC_ENTROPY = {
  high_entropy: {
    characteristics: 'Diverse vocabulary, complex sentences, nuanced views',
    marketSignal: 'Uncertainty, transition period, opportunity for informed',
    action: 'Gather more data, multiple scenarios possible'
  },
  low_entropy: {
    characteristics: 'Repeated phrases, simple language, consensus views',
    marketSignal: 'Complacency, trend exhaustion, crowded trade',
    action: 'Prepare for reversal, contrarian opportunity'
  },
  entropy_spike: {
    characteristics: 'Sudden increase in vocabulary diversity',
    marketSignal: 'Black swan event, paradigm shift, new information',
    action: 'Reduce exposure, wait for clarity'
  }
};

// Temporal Markers in Language
export const TEMPORAL_LANGUAGE = {
  future_focus: {
    words: ['will', 'going to', 'expect', 'predict', 'forecast'],
    marketMeaning: 'Speculation phase, expectations building',
    weight: 'Forward-looking sentiment'
  },
  present_focus: {
    words: ['is', 'now', 'currently', 'happening', 'ongoing'],
    marketMeaning: 'Active event, momentum phase',
    weight: 'Real-time assessment'
  },
  past_focus: {
    words: ['was', 'previously', 'historically', 'before', 'used to'],
    marketMeaning: 'Reflection phase, pattern matching to history',
    weight: 'Anchoring bias potential'
  }
};

// Linguistic Data Structure
export interface LinguisticData {
  sentimentPhase: string;
  entropyLevel: number; // 0-1
  narrativeArchetype: string;
  temporalFocus: 'past' | 'present' | 'future';
  wordFrequencyAnomaly: number; // Deviation from Zipf's law
  neologismRate: number; // New terms per time period
  fearGreedIndex: number; // 0-100
  attentionPhase: string;
  linguisticVolatility: number; // Variance in language patterns
}

// Extract domain signature from linguistic analysis
export function extractLinguisticSignature(data: LinguisticData): DomainSignature {
  // Map sentiment and narrative to quadrant profile
  const sentimentAggression = data.fearGreedIndex > 70 ? 0.8 : data.fearGreedIndex > 50 ? 0.5 : 0.2;
  const narrativeDefense = data.narrativeArchetype === 'icarus' ? 0.8 : 
                           data.narrativeArchetype === 'phoenix' ? 0.3 : 0.5;
  
  // Entropy affects tactical vs strategic
  const tacticalWeight = data.entropyLevel > 0.7 ? 0.7 : 0.4; // High entropy = tactical
  const strategicWeight = 1 - tacticalWeight;
  
  // Temporal focus affects temporal flow
  const temporalMap = {
    past: { early: 0.2, mid: 0.3, late: 0.5 },
    present: { early: 0.3, mid: 0.5, late: 0.2 },
    future: { early: 0.5, mid: 0.3, late: 0.2 }
  };
  
  // Calculate momentum from fear/greed and anomalies
  const momentum = (data.fearGreedIndex - 50) / 50; // -1 to 1
  
  // Linguistic volatility as market volatility proxy
  const volatility = data.linguisticVolatility;
  
  return {
    domain: 'soul' as DomainType, // Language is expression of collective soul
    quadrantProfile: {
      aggressive: sentimentAggression,
      defensive: narrativeDefense,
      tactical: tacticalWeight,
      strategic: strategicWeight
    },
    temporalFlow: temporalMap[data.temporalFocus],
    intensity: data.entropyLevel,
    momentum,
    volatility,
    dominantFrequency: data.wordFrequencyAnomaly,
    harmonicResonance: 1 - data.entropyLevel, // Low entropy = high consensus = resonance
    phaseAlignment: data.neologismRate > 0.3 ? 0.3 : 0.7, // New words = phase shift
    extractedAt: Date.now()
  };
}

// Generate linguistic data from text metrics
export function generateLinguisticData(
  sentimentScore: number, // -1 to 1
  vocabularyDiversity: number, // 0 to 1
  futureWordRatio: number, // 0 to 1
  unusualWordFrequency: number // 0 to 1
): LinguisticData {
  // Determine sentiment phase
  let sentimentPhase: string;
  if (sentimentScore < -0.6) sentimentPhase = 'extreme_fear';
  else if (sentimentScore < -0.2) sentimentPhase = 'fear';
  else if (sentimentScore < 0.2) sentimentPhase = 'neutral';
  else if (sentimentScore < 0.6) sentimentPhase = 'greed';
  else sentimentPhase = 'extreme_greed';
  
  // Map vocabulary diversity to entropy
  const entropyLevel = vocabularyDiversity;
  
  // Determine narrative archetype based on patterns
  let narrativeArchetype: string;
  if (sentimentScore > 0.5 && entropyLevel < 0.3) narrativeArchetype = 'icarus';
  else if (sentimentScore < -0.5 && entropyLevel > 0.5) narrativeArchetype = 'phoenix';
  else if (entropyLevel > 0.7) narrativeArchetype = 'heroes_journey';
  else narrativeArchetype = 'david_vs_goliath';
  
  // Temporal focus from future word ratio
  let temporalFocus: 'past' | 'present' | 'future';
  if (futureWordRatio > 0.4) temporalFocus = 'future';
  else if (futureWordRatio < 0.2) temporalFocus = 'past';
  else temporalFocus = 'present';
  
  // Convert sentiment score to fear-greed index (0-100)
  const fearGreedIndex = Math.round((sentimentScore + 1) * 50);
  
  // Attention phase based on entropy and sentiment combination
  let attentionPhase: string;
  if (entropyLevel > 0.8 && sentimentScore > 0.5) attentionPhase = 'peak_expectations';
  else if (entropyLevel < 0.3 && sentimentScore < -0.3) attentionPhase = 'trough_disillusionment';
  else if (entropyLevel > 0.5 && sentimentScore > 0) attentionPhase = 'slope_enlightenment';
  else if (entropyLevel < 0.4 && sentimentScore > 0.2) attentionPhase = 'plateau_productivity';
  else attentionPhase = 'innovation_trigger';
  
  return {
    sentimentPhase,
    entropyLevel,
    narrativeArchetype,
    temporalFocus,
    wordFrequencyAnomaly: unusualWordFrequency,
    neologismRate: unusualWordFrequency * 0.3,
    fearGreedIndex,
    attentionPhase,
    linguisticVolatility: Math.abs(sentimentScore) * vocabularyDiversity
  };
}

// Calculate truth score for linguistic signals
export function calculateLinguisticTruthScore(data: LinguisticData): number {
  let score = 0.5;
  
  // High entropy with extreme sentiment = potential noise
  if (data.entropyLevel > 0.8 && Math.abs(data.fearGreedIndex - 50) > 40) {
    score -= 0.2; // Chaotic narrative, less reliable
  }
  
  // Low entropy with consistent narrative = stronger signal
  if (data.entropyLevel < 0.4 && data.narrativeArchetype !== 'icarus') {
    score += 0.2; // Consensus forming
  }
  
  // Neologism spike = regime change, valuable signal
  if (data.neologismRate > 0.5) {
    score += 0.15; // New language = new reality
  }
  
  // Word frequency anomaly matters
  if (data.wordFrequencyAnomaly > 0.7) {
    score += 0.1; // Unusual patterns worth attention
  }
  
  return Math.max(0, Math.min(1, score));
}

// Export the adapter
export const linguisticSemanticAdapter = {
  domain: 'Linguistic/Semantic',
  version: '1.0.0',
  
  SENTIMENT_CYCLES,
  WORD_POWER_LAWS,
  NARRATIVE_ARCHETYPES,
  LINGUISTIC_ENTROPY,
  TEMPORAL_LANGUAGE,
  
  extractSignature: extractLinguisticSignature,
  generateData: generateLinguisticData,
  calculateTruthScore: calculateLinguisticTruthScore,
  
  philosophy: `
    Language is the crystallization of thought into pattern.
    Before humans act, they speak. Before they speak, they think.
    Markets are conversations - billions of linguistic acts compressed into price.
    By reading the language patterns, we read the collective mind.
    Words that rise in frequency signal rising attention.
    New words signal new realities emerging.
    When everyone uses the same words, the crowd is about to move together.
    The linguistic pattern precedes the market pattern.
  `
};
