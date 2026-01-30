/**
 * Cross-Domain Learning Pipeline v2.0 (Refactored)
 * 
 * En Pensent™ Universal Intelligence Learning System
 * 
 * Connects Chess, Code, and Market domains into a unified
 * learning organism where patterns flow bidirectionally.
 * 
 * "Every game analyzed teaches all three domains"
 */

import type { 
  DomainLesson, 
  CrossDomainPattern, 
  LearningState,
  ChessGameOutcome,
  CodeAnalysis,
  MarketExecution,
  ImportResult,
  UnifiedGameData
} from './types';

import { ARCHETYPE_TRANSFER_MAP } from './archetypeMapping';

import {
  generateChessLessons,
  generateCodeLessons,
  generateMarketLessons,
  generateChessFingerprint,
  inferArchetypeFromGame,
  calculateGameConfidence
} from './lessonGenerators';

import {
  createInitialLearningState,
  storeCrossDomainPattern,
  persistLearningState,
  updateStateAfterChessLesson,
  updateStateAfterCodeLesson,
  updateStateAfterMarketLesson,
  getPatternsForDomain
} from './patternStorage';

// Re-export types for backwards compatibility
export type { DomainLesson, CrossDomainPattern, LearningState };

class CrossDomainLearningPipeline {
  private patterns = new Map<string, CrossDomainPattern>();
  private learningState: LearningState = createInitialLearningState();

  /**
   * Learn from historical chess games and propagate to all domains
   */
  async learnFromChessGame(
    game: UnifiedGameData, 
    outcome: ChessGameOutcome
  ): Promise<DomainLesson[]> {
    const fingerprint = generateChessFingerprint(game, outcome.archetype);
    const { lessons, wasCorrect } = generateChessLessons(fingerprint, outcome);
    
    const codeArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.code || [];
    const marketArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.market || [];
    
    storeCrossDomainPattern(
      this.patterns,
      'chess',
      fingerprint,
      { chess: [outcome.archetype], code: codeArchetypes, market: marketArchetypes },
      outcome.confidence,
      wasCorrect
    );
    
    this.learningState = updateStateAfterChessLesson(
      this.learningState, 
      lessons.length, 
      wasCorrect
    );
    
    console.log(`[CrossDomainLearning] Chess → ${lessons.length} lessons (${outcome.archetype})`);
    return lessons;
  }

  /**
   * Learn from code analysis and propagate to chess/market
   */
  async learnFromCodeAnalysis(analysis: CodeAnalysis): Promise<DomainLesson[]> {
    const lessons = generateCodeLessons(analysis);
    const confidence = analysis.health / 100;
    
    const { findChessEquivalents, findMarketEquivalents } = await import('./archetypeMapping');
    const chessEquivalents = findChessEquivalents(analysis.archetype);
    const marketEquivalents = findMarketEquivalents(analysis.archetype);
    
    storeCrossDomainPattern(
      this.patterns,
      'code',
      analysis.fingerprint,
      { code: [analysis.archetype], chess: chessEquivalents, market: marketEquivalents },
      confidence,
      true
    );
    
    this.learningState = updateStateAfterCodeLesson(
      this.learningState, 
      lessons.length, 
      confidence
    );
    
    console.log(`[CrossDomainLearning] Code → ${lessons.length} lessons (${analysis.archetype})`);
    return lessons;
  }

  /**
   * Learn from market execution and calibrate chess/code predictions
   */
  async learnFromMarketExecution(execution: MarketExecution): Promise<DomainLesson[]> {
    const { lessons, wasCorrect } = generateMarketLessons(execution);
    
    this.learningState = updateStateAfterMarketLesson(
      this.learningState, 
      lessons.length, 
      wasCorrect
    );
    
    console.log(`[CrossDomainLearning] Market (${execution.symbol}) → ${lessons.length} lessons (${wasCorrect ? '✓' : '✗'})`);
    return lessons;
  }

  /**
   * Import historical games and extract patterns
   */
  async importHistoricalGames(games: UnifiedGameData[]): Promise<ImportResult> {
    let patternsExtracted = 0;
    let crossDomainLessons = 0;
    
    for (const game of games) {
      const archetype = inferArchetypeFromGame(game);
      const lessons = await this.learnFromChessGame(game, {
        actualWinner: game.winner === 'white' ? 'white' : game.winner === 'black' ? 'black' : 'draw',
        archetype,
        confidence: calculateGameConfidence(game),
      });
      
      patternsExtracted++;
      crossDomainLessons += lessons.length;
    }
    
    await persistLearningState(this.learningState, this.patterns.size);
    this.learningState.evolutionGeneration++;
    
    return { gamesProcessed: games.length, patternsExtracted, crossDomainLessons };
  }

  getState(): LearningState {
    return { ...this.learningState };
  }

  getPatterns(): CrossDomainPattern[] {
    return Array.from(this.patterns.values());
  }

  getPatternsForDomain(domain: 'chess' | 'code' | 'market'): CrossDomainPattern[] {
    return getPatternsForDomain(this.patterns, domain);
  }
}

// Singleton export
export const crossDomainLearningPipeline = new CrossDomainLearningPipeline();
