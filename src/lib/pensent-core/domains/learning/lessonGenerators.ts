/**
 * Lesson Generators
 * 
 * Generate cross-domain lessons from various domain inputs
 */

import type { 
  DomainLesson, 
  ChessGameOutcome, 
  CodeAnalysis, 
  MarketExecution,
  UnifiedGameData 
} from './types';
import { 
  DOMAIN_EXCHANGE_WEIGHTS, 
  ARCHETYPE_TRANSFER_MAP,
  findChessEquivalents,
  findMarketEquivalents,
  findCodeEquivalents
} from './archetypeMapping';

/**
 * Generate lessons from chess game analysis
 */
export function generateChessLessons(
  fingerprint: string,
  outcome: ChessGameOutcome
): { lessons: DomainLesson[]; wasCorrect: boolean } {
  const lessons: DomainLesson[] = [];
  
  const codeArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.code || [];
  const marketArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.market || [];
  
  const wasCorrect = outcome.predictedWinner === outcome.actualWinner;
  const baseWeight = wasCorrect ? 1.0 : 0.7;
  
  if (codeArchetypes.length > 0) {
    lessons.push({
      sourceSignature: fingerprint,
      targetDomain: 'code',
      patternType: outcome.archetype,
      confidence: outcome.confidence * DOMAIN_EXCHANGE_WEIGHTS.chess.code,
      applicableArchetypes: codeArchetypes,
      transferWeight: baseWeight * DOMAIN_EXCHANGE_WEIGHTS.chess.code,
    });
  }
  
  if (marketArchetypes.length > 0) {
    lessons.push({
      sourceSignature: fingerprint,
      targetDomain: 'market',
      patternType: outcome.archetype,
      confidence: outcome.confidence * DOMAIN_EXCHANGE_WEIGHTS.chess.market,
      applicableArchetypes: marketArchetypes,
      transferWeight: baseWeight * DOMAIN_EXCHANGE_WEIGHTS.chess.market,
    });
  }
  
  return { lessons, wasCorrect };
}

/**
 * Generate lessons from code analysis
 */
export function generateCodeLessons(analysis: CodeAnalysis): DomainLesson[] {
  const lessons: DomainLesson[] = [];
  
  const chessEquivalents = findChessEquivalents(analysis.archetype);
  const marketEquivalents = findMarketEquivalents(analysis.archetype);
  const confidence = analysis.health / 100;
  
  if (chessEquivalents.length > 0) {
    lessons.push({
      sourceSignature: analysis.fingerprint,
      targetDomain: 'chess',
      patternType: analysis.archetype,
      confidence: confidence * DOMAIN_EXCHANGE_WEIGHTS.code.chess,
      applicableArchetypes: chessEquivalents,
      transferWeight: DOMAIN_EXCHANGE_WEIGHTS.code.chess,
    });
  }
  
  if (marketEquivalents.length > 0) {
    lessons.push({
      sourceSignature: analysis.fingerprint,
      targetDomain: 'market',
      patternType: analysis.archetype,
      confidence: confidence * DOMAIN_EXCHANGE_WEIGHTS.code.market,
      applicableArchetypes: marketEquivalents,
      transferWeight: DOMAIN_EXCHANGE_WEIGHTS.code.market,
    });
  }
  
  return lessons;
}

/**
 * Generate lessons from market execution
 */
export function generateMarketLessons(
  execution: MarketExecution
): { lessons: DomainLesson[]; wasCorrect: boolean } {
  const lessons: DomainLesson[] = [];
  const wasCorrect = execution.direction === execution.predicted;
  
  const chessEquivalents = findChessEquivalents(execution.archetype);
  const codeEquivalents = findCodeEquivalents(execution.archetype);
  
  const adjustedConfidence = wasCorrect 
    ? execution.confidence * 1.1 
    : execution.confidence * 0.85;
  
  if (chessEquivalents.length > 0) {
    lessons.push({
      sourceSignature: `market_${execution.symbol}_${Date.now()}`,
      targetDomain: 'chess',
      patternType: execution.archetype,
      confidence: adjustedConfidence * DOMAIN_EXCHANGE_WEIGHTS.market.chess,
      applicableArchetypes: chessEquivalents,
      transferWeight: wasCorrect ? 1.0 : 0.7,
    });
  }
  
  if (codeEquivalents.length > 0) {
    lessons.push({
      sourceSignature: `market_${execution.symbol}_${Date.now()}`,
      targetDomain: 'code',
      patternType: execution.archetype,
      confidence: adjustedConfidence * DOMAIN_EXCHANGE_WEIGHTS.market.code,
      applicableArchetypes: codeEquivalents,
      transferWeight: wasCorrect ? 1.0 : 0.7,
    });
  }
  
  return { lessons, wasCorrect };
}

/**
 * Generate chess fingerprint from game data
 */
export function generateChessFingerprint(game: UnifiedGameData, archetype: string): string {
  const components = [
    archetype.slice(0, 4),
    game.speed?.slice(0, 2) || 'un',
    String(game.whiteElo || 0).slice(-2),
    String(game.blackElo || 0).slice(-2),
    game.result?.replace(/[^0-9]/g, '') || '00',
  ];
  return `chess_${components.join('')}_${Date.now().toString(36)}`;
}

/**
 * Infer archetype from game characteristics
 */
export function inferArchetypeFromGame(game: UnifiedGameData): string {
  const eloAvg = ((game.whiteElo || 0) + (game.blackElo || 0)) / 2;
  const isDecisive = game.result !== '1/2-1/2';
  
  if (game.speed === 'bullet' || game.speed === 'blitz') {
    return isDecisive ? 'tactical_chaos' : 'dynamic_play';
  }
  
  if (eloAvg > 2500) {
    return isDecisive ? 'endgame_technique' : 'positional_squeeze';
  }
  
  if (game.termination?.includes('checkmate')) {
    return 'kingside_attack';
  }
  
  return 'central_domination';
}

/**
 * Calculate game confidence based on metadata
 */
export function calculateGameConfidence(game: UnifiedGameData): number {
  let confidence = 0.5;
  
  const avgElo = ((game.whiteElo || 0) + (game.blackElo || 0)) / 2;
  if (avgElo > 2200) confidence += 0.15;
  if (avgElo > 2400) confidence += 0.15;
  if (avgElo > 2600) confidence += 0.1;
  
  if (game.rated) confidence += 0.05;
  if (game.openingEco) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}
