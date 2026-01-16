/**
 * Pattern Database
 */

import { ColorFlowSignature, StrategicArchetype } from '../colorFlowAnalysis';
import { GameData } from '../gameSimulator';
import { PatternRecord, PatternMatch } from './types';
import { calculateSimilarity, getMatchingFactors, getRelatedArchetypes } from './similarityCalculator';

export class PatternDatabase {
  private patterns: Map<string, PatternRecord> = new Map();
  private archetypeIndex: Map<StrategicArchetype, PatternRecord[]> = new Map();

  addPattern(
    signature: ColorFlowSignature,
    outcome: 'white_wins' | 'black_wins' | 'draw',
    gameData: GameData,
    totalMoves: number
  ): PatternRecord {
    const record: PatternRecord = {
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fingerprint: signature.fingerprint,
      archetype: signature.archetype,
      outcome,
      totalMoves,
      characteristics: {
        flowDirection: signature.flowDirection,
        intensity: signature.intensity,
        volatility: signature.temporalFlow.volatility,
        dominantSide: signature.dominantSide,
        centerControl: signature.quadrantProfile.center,
        kingsideActivity: (signature.quadrantProfile.kingsideWhite + signature.quadrantProfile.kingsideBlack) / 2,
        queensideActivity: (signature.quadrantProfile.queensideWhite + signature.quadrantProfile.queensideBlack) / 2,
      },
      gameMetadata: {
        event: gameData.event,
        white: gameData.white,
        black: gameData.black,
        date: gameData.date,
      },
    };

    this.patterns.set(record.id, record);

    const existing = this.archetypeIndex.get(signature.archetype) || [];
    existing.push(record);
    this.archetypeIndex.set(signature.archetype, existing);

    return record;
  }

  findSimilar(signature: ColorFlowSignature, limit: number = 5): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // First, look at same archetype
    const sameArchetype = this.archetypeIndex.get(signature.archetype) || [];

    for (const pattern of sameArchetype) {
      const similarity = calculateSimilarity(signature, pattern);
      if (similarity > 30) {
        matches.push({
          pattern,
          similarity,
          matchingFactors: getMatchingFactors(signature, pattern),
          predictedOutcome: pattern.outcome,
          confidence: similarity * 0.9,
        });
      }
    }

    // Also check related archetypes
    const relatedArchetypes = getRelatedArchetypes(signature.archetype);
    for (const archetype of relatedArchetypes) {
      const related = this.archetypeIndex.get(archetype) || [];
      for (const pattern of related) {
        const similarity = calculateSimilarity(signature, pattern) * 0.8;
        if (similarity > 30) {
          matches.push({
            pattern,
            similarity,
            matchingFactors: getMatchingFactors(signature, pattern),
            predictedOutcome: pattern.outcome,
            confidence: similarity * 0.7,
          });
        }
      }
    }

    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  getStats(): { totalPatterns: number; byArchetype: Record<string, number> } {
    const byArchetype: Record<string, number> = {};
    for (const [archetype, patterns] of this.archetypeIndex) {
      byArchetype[archetype] = patterns.length;
    }
    return {
      totalPatterns: this.patterns.size,
      byArchetype,
    };
  }

  clear(): void {
    this.patterns.clear();
    this.archetypeIndex.clear();
  }
}

export const patternDatabase = new PatternDatabase();
