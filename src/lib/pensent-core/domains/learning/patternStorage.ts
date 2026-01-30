/**
 * Pattern Storage
 * 
 * Manages cross-domain pattern persistence and state management
 */

import { supabase } from '@/integrations/supabase/client';
import type { CrossDomainPattern, LearningState, DomainType } from './types';

/**
 * Create initial learning state
 */
export function createInitialLearningState(): LearningState {
  return {
    totalPatternsLearned: 0,
    crossDomainTransfers: 0,
    chessToMarketAccuracy: 0.5,
    codeToChessResonance: 0.5,
    marketToCodeAlignment: 0.5,
    evolutionGeneration: 1,
  };
}

/**
 * Store or update a cross-domain pattern
 */
export function storeCrossDomainPattern(
  patterns: Map<string, CrossDomainPattern>,
  origin: DomainType,
  fingerprint: string,
  archetypeMapping: Record<string, string[]>,
  confidence: number,
  successful: boolean
): void {
  const existing = patterns.get(fingerprint);
  
  if (existing) {
    existing.totalObservations++;
    existing.successRate = (
      existing.successRate * (existing.totalObservations - 1) + (successful ? 1 : 0)
    ) / existing.totalObservations;
    existing.confidenceByDomain[origin] = confidence;
    existing.lastUpdated = new Date();
  } else {
    patterns.set(fingerprint, {
      id: fingerprint,
      originDomain: origin,
      fingerprint,
      archetypeMapping,
      confidenceByDomain: { [origin]: confidence },
      totalObservations: 1,
      successRate: successful ? 1 : 0,
      lastUpdated: new Date(),
    });
  }
}

/**
 * Persist learning state to database
 */
export async function persistLearningState(
  learningState: LearningState,
  patternCount: number
): Promise<void> {
  try {
    await supabase.from('evolution_state').insert({
      state_type: 'cross_domain_learning',
      genes: {
        ...learningState,
        patternCount,
      },
      generation: learningState.evolutionGeneration,
      fitness_score: (
        learningState.chessToMarketAccuracy +
        learningState.codeToChessResonance +
        learningState.marketToCodeAlignment
      ) / 3,
      last_mutation_at: new Date().toISOString(),
    } as any);
  } catch (error) {
    console.warn('[CrossDomainLearning] Failed to persist state:', error);
  }
}

/**
 * Update learning state after chess lesson
 */
export function updateStateAfterChessLesson(
  state: LearningState,
  lessonCount: number,
  wasCorrect: boolean
): LearningState {
  return {
    ...state,
    totalPatternsLearned: state.totalPatternsLearned + 1,
    crossDomainTransfers: state.crossDomainTransfers + lessonCount,
    chessToMarketAccuracy: wasCorrect
      ? state.chessToMarketAccuracy * 0.99 + 0.01
      : state.chessToMarketAccuracy * 0.99,
  };
}

/**
 * Update learning state after code lesson
 */
export function updateStateAfterCodeLesson(
  state: LearningState,
  lessonCount: number,
  confidence: number
): LearningState {
  return {
    ...state,
    totalPatternsLearned: state.totalPatternsLearned + 1,
    crossDomainTransfers: state.crossDomainTransfers + lessonCount,
    codeToChessResonance: (state.codeToChessResonance + confidence) / 2,
  };
}

/**
 * Update learning state after market lesson
 */
export function updateStateAfterMarketLesson(
  state: LearningState,
  lessonCount: number,
  wasCorrect: boolean
): LearningState {
  return {
    ...state,
    crossDomainTransfers: state.crossDomainTransfers + lessonCount,
    marketToCodeAlignment: wasCorrect
      ? state.marketToCodeAlignment * 0.95 + 0.05
      : state.marketToCodeAlignment * 0.95,
  };
}

/**
 * Get patterns applicable to a specific domain
 */
export function getPatternsForDomain(
  patterns: Map<string, CrossDomainPattern>,
  domain: DomainType
): CrossDomainPattern[] {
  return Array.from(patterns.values()).filter(
    p => p.archetypeMapping[domain]?.length > 0
  );
}
