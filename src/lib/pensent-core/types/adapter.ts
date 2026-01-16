/**
 * En Pensent Core SDK - Domain Adapter Interface
 */

import { TemporalSignature } from './core';
import { ArchetypeRegistry } from './archetype';
import { TacticalInsight } from './hybrid';

/**
 * Interface that each domain must implement to use the En Pensent engine
 */
export interface DomainAdapter<TInput, TState> {
  /** Domain identifier */
  readonly domain: string;
  
  /** Convert raw input to sequence of states */
  parseInput(input: TInput): TState[];
  
  /** Extract signature from state sequence */
  extractSignature(states: TState[]): TemporalSignature;
  
  /** Get archetype registry for this domain */
  getArchetypeRegistry(): ArchetypeRegistry;
  
  /** Classify signature into archetype */
  classifyArchetype(signature: TemporalSignature): string;
  
  /** Calculate similarity between two signatures */
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number;
  
  /** Generate tactical insight (if domain supports calculation) */
  analyzeTactically?(state: TState): Promise<TacticalInsight>;
  
  /** Render state for human viewing */
  renderState(state: TState): string;
}
