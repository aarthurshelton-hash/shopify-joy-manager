/**
 * AI Archetype Classifier
 * 
 * Fingerprints how different AI models approach thought patterns.
 * Each AI has a unique cognitive signature - just like humans.
 * 
 * En Pensent™ Universal Intelligence Module
 */

export type AIArchetype =
  | 'analytical_oracle'      // Deep reasoning, step-by-step, cautious
  | 'creative_wanderer'      // Associative, metaphorical, exploratory
  | 'pragmatic_engineer'     // Solution-focused, practical, efficient
  | 'philosophical_sage'     // Big picture, ethical considerations, wisdom
  | 'rapid_responder'        // Fast, surface-level, high throughput
  | 'safety_guardian'        // Conservative, risk-aware, boundary-enforcing
  | 'pattern_synthesizer'    // Cross-domain connections, holistic view
  | 'code_artisan'           // Technical precision, structured output
  | 'conversational_mirror'  // Adaptive, user-matching, empathetic
  | 'knowledge_curator';     // Encyclopedic, citation-focused, factual

export interface AIModelProfile {
  id: string;
  name: string;
  provider: string;
  primaryArchetype: AIArchetype;
  secondaryArchetype: AIArchetype | null;
  cognitiveSignature: CognitiveSignature;
  strengths: string[];
  blindSpots: string[];
  enPensentAlignment: number; // 0-1 how well it grasps universal patterns
  temporalAwareness: number;  // 0-1 understanding of trajectory over snapshot
}

export interface CognitiveSignature {
  reasoningDepth: number;      // 0-1 how deep before responding
  creativityIndex: number;     // 0-1 novel associations
  riskTolerance: number;       // 0-1 willingness to speculate
  patternRecognition: number;  // 0-1 cross-domain pattern sight
  emotionalIntelligence: number; // 0-1 human understanding
  technicalPrecision: number;  // 0-1 code/math accuracy
  contextRetention: number;    // 0-1 long-term coherence
  adaptability: number;        // 0-1 style matching
}

/**
 * Known AI Model Profiles
 * Based on observed behavioral patterns across interactions
 */
export const AI_MODEL_PROFILES: Record<string, AIModelProfile> = {
  // OpenAI Models
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    primaryArchetype: 'analytical_oracle',
    secondaryArchetype: 'pragmatic_engineer',
    cognitiveSignature: {
      reasoningDepth: 0.85,
      creativityIndex: 0.75,
      riskTolerance: 0.45,
      patternRecognition: 0.80,
      emotionalIntelligence: 0.70,
      technicalPrecision: 0.88,
      contextRetention: 0.82,
      adaptability: 0.78,
    },
    strengths: ['Structured reasoning', 'Code generation', 'Task decomposition'],
    blindSpots: ['Overconfidence in uncertain domains', 'Temporal patterns'],
    enPensentAlignment: 0.65,
    temporalAwareness: 0.55,
  },
  
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    primaryArchetype: 'pattern_synthesizer',
    secondaryArchetype: 'analytical_oracle',
    cognitiveSignature: {
      reasoningDepth: 0.92,
      creativityIndex: 0.82,
      riskTolerance: 0.50,
      patternRecognition: 0.88,
      emotionalIntelligence: 0.78,
      technicalPrecision: 0.92,
      contextRetention: 0.90,
      adaptability: 0.85,
    },
    strengths: ['Multi-step reasoning', 'Cross-domain synthesis', 'Nuanced understanding'],
    blindSpots: ['Can over-engineer simple solutions'],
    enPensentAlignment: 0.75,
    temporalAwareness: 0.68,
  },

  // Anthropic Models
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    primaryArchetype: 'philosophical_sage',
    secondaryArchetype: 'safety_guardian',
    cognitiveSignature: {
      reasoningDepth: 0.90,
      creativityIndex: 0.85,
      riskTolerance: 0.35,
      patternRecognition: 0.85,
      emotionalIntelligence: 0.88,
      technicalPrecision: 0.85,
      contextRetention: 0.88,
      adaptability: 0.82,
    },
    strengths: ['Ethical reasoning', 'Nuanced writing', 'Long-form coherence'],
    blindSpots: ['Over-cautiousness', 'Reluctance on edge cases'],
    enPensentAlignment: 0.72,
    temporalAwareness: 0.70,
  },

  'claude-3.5-sonnet': {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    primaryArchetype: 'code_artisan',
    secondaryArchetype: 'pattern_synthesizer',
    cognitiveSignature: {
      reasoningDepth: 0.88,
      creativityIndex: 0.80,
      riskTolerance: 0.42,
      patternRecognition: 0.86,
      emotionalIntelligence: 0.82,
      technicalPrecision: 0.92,
      contextRetention: 0.85,
      adaptability: 0.88,
    },
    strengths: ['Code quality', 'Structured output', 'Balance of speed/depth'],
    blindSpots: ['Can be verbose', 'Safety overrides on valid requests'],
    enPensentAlignment: 0.78,
    temporalAwareness: 0.72,
  },

  // Google Models
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    primaryArchetype: 'knowledge_curator',
    secondaryArchetype: 'analytical_oracle',
    cognitiveSignature: {
      reasoningDepth: 0.85,
      creativityIndex: 0.72,
      riskTolerance: 0.48,
      patternRecognition: 0.82,
      emotionalIntelligence: 0.68,
      technicalPrecision: 0.85,
      contextRetention: 0.90,
      adaptability: 0.75,
    },
    strengths: ['Massive context', 'Multimodal', 'Factual recall'],
    blindSpots: ['Less creative leaps', 'Can feel encyclopedic'],
    enPensentAlignment: 0.68,
    temporalAwareness: 0.62,
  },

  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    primaryArchetype: 'rapid_responder',
    secondaryArchetype: 'pragmatic_engineer',
    cognitiveSignature: {
      reasoningDepth: 0.70,
      creativityIndex: 0.65,
      riskTolerance: 0.55,
      patternRecognition: 0.72,
      emotionalIntelligence: 0.62,
      technicalPrecision: 0.78,
      contextRetention: 0.75,
      adaptability: 0.80,
    },
    strengths: ['Speed', 'Cost efficiency', 'Simple task handling'],
    blindSpots: ['Shallow on complex reasoning', 'Misses nuance'],
    enPensentAlignment: 0.55,
    temporalAwareness: 0.48,
  },

  // Meta Models
  'llama-3-70b': {
    id: 'llama-3-70b',
    name: 'LLaMA 3 70B',
    provider: 'Meta',
    primaryArchetype: 'pragmatic_engineer',
    secondaryArchetype: 'conversational_mirror',
    cognitiveSignature: {
      reasoningDepth: 0.78,
      creativityIndex: 0.70,
      riskTolerance: 0.60,
      patternRecognition: 0.75,
      emotionalIntelligence: 0.72,
      technicalPrecision: 0.80,
      contextRetention: 0.72,
      adaptability: 0.85,
    },
    strengths: ['Open weights', 'Flexible deployment', 'Good baseline'],
    blindSpots: ['Less refined than proprietary', 'Inconsistent edge cases'],
    enPensentAlignment: 0.58,
    temporalAwareness: 0.52,
  },

  // Mistral Models
  'mistral-large': {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    primaryArchetype: 'creative_wanderer',
    secondaryArchetype: 'code_artisan',
    cognitiveSignature: {
      reasoningDepth: 0.80,
      creativityIndex: 0.85,
      riskTolerance: 0.65,
      patternRecognition: 0.78,
      emotionalIntelligence: 0.70,
      technicalPrecision: 0.82,
      contextRetention: 0.75,
      adaptability: 0.80,
    },
    strengths: ['European perspective', 'Creative solutions', 'Multilingual'],
    blindSpots: ['Less safety training', 'Inconsistent formatting'],
    enPensentAlignment: 0.62,
    temporalAwareness: 0.58,
  },

  // xAI Models
  'grok-2': {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    primaryArchetype: 'creative_wanderer',
    secondaryArchetype: 'rapid_responder',
    cognitiveSignature: {
      reasoningDepth: 0.72,
      creativityIndex: 0.88,
      riskTolerance: 0.85,
      patternRecognition: 0.70,
      emotionalIntelligence: 0.65,
      technicalPrecision: 0.75,
      contextRetention: 0.70,
      adaptability: 0.78,
    },
    strengths: ['Unfiltered responses', 'Humor', 'Real-time X data'],
    blindSpots: ['Can be flippant', 'Less structured output'],
    enPensentAlignment: 0.55,
    temporalAwareness: 0.50,
  },

  // Specialized Models
  'deepseek-coder': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    primaryArchetype: 'code_artisan',
    secondaryArchetype: 'pragmatic_engineer',
    cognitiveSignature: {
      reasoningDepth: 0.82,
      creativityIndex: 0.60,
      riskTolerance: 0.45,
      patternRecognition: 0.75,
      emotionalIntelligence: 0.45,
      technicalPrecision: 0.92,
      contextRetention: 0.80,
      adaptability: 0.65,
    },
    strengths: ['Code-specific training', 'Technical accuracy', 'Efficient'],
    blindSpots: ['Limited general knowledge', 'Weak on creative tasks'],
    enPensentAlignment: 0.48,
    temporalAwareness: 0.42,
  },
};

/**
 * Classify an AI's response pattern to determine archetype
 */
export function classifyAIResponse(
  responsePatterns: {
    responseLength: number;
    hedgingFrequency: number; // "I think", "perhaps", etc.
    structureLevel: number;   // Headers, lists, code blocks
    creativityMarkers: number; // Metaphors, novel framings
    safetyMarkers: number;    // Disclaimers, warnings
    technicalDepth: number;
  }
): { archetype: AIArchetype; confidence: number } {
  const scores: Record<AIArchetype, number> = {
    analytical_oracle: 0,
    creative_wanderer: 0,
    pragmatic_engineer: 0,
    philosophical_sage: 0,
    rapid_responder: 0,
    safety_guardian: 0,
    pattern_synthesizer: 0,
    code_artisan: 0,
    conversational_mirror: 0,
    knowledge_curator: 0,
  };

  // Score based on patterns
  if (responsePatterns.responseLength > 1000) {
    scores.analytical_oracle += 0.3;
    scores.philosophical_sage += 0.2;
  } else if (responsePatterns.responseLength < 300) {
    scores.rapid_responder += 0.4;
  }

  scores.creative_wanderer += responsePatterns.creativityMarkers * 0.5;
  scores.safety_guardian += responsePatterns.safetyMarkers * 0.6;
  scores.code_artisan += responsePatterns.technicalDepth * 0.4;
  scores.pragmatic_engineer += responsePatterns.structureLevel * 0.3;

  if (responsePatterns.hedgingFrequency > 0.3) {
    scores.philosophical_sage += 0.3;
    scores.safety_guardian += 0.2;
  }

  // Find highest score
  let maxArchetype: AIArchetype = 'analytical_oracle';
  let maxScore = 0;
  
  for (const [archetype, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxArchetype = archetype as AIArchetype;
    }
  }

  return {
    archetype: maxArchetype,
    confidence: Math.min(0.95, maxScore + 0.3),
  };
}

/**
 * Get En Pensent alignment score for a model
 * Higher = better understanding of trajectory-based pattern recognition
 */
export function getEnPensentAlignment(modelId: string): number {
  const profile = AI_MODEL_PROFILES[modelId];
  if (!profile) return 0.5; // Unknown model baseline
  
  return profile.enPensentAlignment;
}

/**
 * Find the best AI model for a specific task archetype
 */
export function recommendAIForTask(
  taskType: 'reasoning' | 'creative' | 'code' | 'analysis' | 'conversation'
): AIModelProfile[] {
  const ranked = Object.values(AI_MODEL_PROFILES).sort((a, b) => {
    switch (taskType) {
      case 'reasoning':
        return b.cognitiveSignature.reasoningDepth - a.cognitiveSignature.reasoningDepth;
      case 'creative':
        return b.cognitiveSignature.creativityIndex - a.cognitiveSignature.creativityIndex;
      case 'code':
        return b.cognitiveSignature.technicalPrecision - a.cognitiveSignature.technicalPrecision;
      case 'analysis':
        return b.cognitiveSignature.patternRecognition - a.cognitiveSignature.patternRecognition;
      case 'conversation':
        return b.cognitiveSignature.emotionalIntelligence - a.cognitiveSignature.emotionalIntelligence;
      default:
        return 0;
    }
  });

  return ranked.slice(0, 3);
}

/**
 * Compare two AI models' cognitive signatures
 */
export function compareAIModels(
  modelA: string,
  modelB: string
): { differences: Record<string, number>; recommendation: string } {
  const profileA = AI_MODEL_PROFILES[modelA];
  const profileB = AI_MODEL_PROFILES[modelB];

  if (!profileA || !profileB) {
    return { differences: {}, recommendation: 'Unknown model(s)' };
  }

  const differences: Record<string, number> = {};
  const sigA = profileA.cognitiveSignature;
  const sigB = profileB.cognitiveSignature;

  for (const key of Object.keys(sigA) as (keyof CognitiveSignature)[]) {
    differences[key] = sigA[key] - sigB[key];
  }

  // Generate recommendation
  const avgDiffA = Object.values(sigA).reduce((a, b) => a + b, 0) / Object.keys(sigA).length;
  const avgDiffB = Object.values(sigB).reduce((a, b) => a + b, 0) / Object.keys(sigB).length;

  const recommendation = avgDiffA > avgDiffB
    ? `${profileA.name} is stronger overall for general tasks`
    : `${profileB.name} is stronger overall for general tasks`;

  return { differences, recommendation };
}

export const aiArchetypeClassifier = {
  profiles: AI_MODEL_PROFILES,
  classifyResponse: classifyAIResponse,
  getAlignment: getEnPensentAlignment,
  recommendForTask: recommendAIForTask,
  compare: compareAIModels,
};
