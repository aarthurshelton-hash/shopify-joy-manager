/**
 * Cross-Domain Learning Types
 * 
 * Type definitions for the En Pensent™ Universal Intelligence Learning System
 */

import { UnifiedGameData } from '@/lib/chess/gameImport/multiSourceFetcher';

export type DomainType = 'chess' | 'code' | 'market';

export interface DomainLesson {
  sourceSignature: string;
  targetDomain: DomainType;
  patternType: string;
  confidence: number;
  applicableArchetypes: string[];
  transferWeight: number; // 0-1 how well this translates
}

export interface CrossDomainPattern {
  id: string;
  originDomain: DomainType;
  fingerprint: string;
  archetypeMapping: Record<string, string[]>;
  confidenceByDomain: Record<string, number>;
  totalObservations: number;
  successRate: number;
  lastUpdated: Date;
}

export interface LearningState {
  totalPatternsLearned: number;
  crossDomainTransfers: number;
  chessToMarketAccuracy: number;
  codeToChessResonance: number;
  marketToCodeAlignment: number;
  evolutionGeneration: number;
}

export interface ChessGameOutcome {
  predictedWinner?: 'white' | 'black' | 'draw';
  actualWinner?: 'white' | 'black' | 'draw';
  archetype: string;
  confidence: number;
}

export interface CodeAnalysis {
  archetype: string;
  health: number;
  fingerprint: string;
  quadrantProfile: { 
    complexity: number; 
    velocity: number; 
    quality: number; 
    architecture: number;
  };
}

export interface MarketExecution {
  symbol: string;
  direction: 'up' | 'down' | 'neutral';
  predicted: 'up' | 'down' | 'neutral';
  confidence: number;
  archetype: string;
  pnl?: number;
}

export interface ImportResult {
  gamesProcessed: number;
  patternsExtracted: number;
  crossDomainLessons: number;
}

export type { UnifiedGameData };
