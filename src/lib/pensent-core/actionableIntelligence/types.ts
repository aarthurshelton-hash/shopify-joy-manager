/**
 * Actionable Intelligence Types
 * Type definitions for the actionable intelligence system.
 */

import { DomainType } from '../domains/universal/types';

export interface ActionableInsight {
  id: string;
  domain: DomainType;
  archetype: string;
  
  // The "So What?" answer
  headline: string;
  action: string;
  urgency: 'immediate' | 'soon' | 'consider';
  confidence: number;
  
  // Specifics
  expectedOutcome: string;
  timeframe: string;
  risk: 'low' | 'medium' | 'high';
  
  // Evidence
  patternBasis: string;
  historicalAccuracy?: number;
}

export interface ChessAction {
  archetype: string;
  action: string;
  whenToApply: string;
  expectedResult: string;
}

export interface CodeAction {
  archetype: string;
  action: string;
  files: string[];
  priority: number;
}

export interface MarketAction {
  archetype: string;
  position: 'long' | 'short' | 'neutral';
  entryCondition: string;
  exitCondition: string;
}

export interface DomainActionMap {
  chess: ChessAction[];
  code: CodeAction[];
  market: MarketAction[];
}

export interface ActionMapEntry {
  action: string;
  expectedOutcome: string;
  timeframe?: string;
  priority?: string;
  position?: string;
  entry?: string;
  exit?: string;
  risk?: string;
}
