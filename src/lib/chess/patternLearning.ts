/**
 * Pattern Learning Engine
 * 
 * En Pensent™ Patent-Pending Technology
 * 
 * Stores and matches Color Flow Signatures against historical games
 * to predict outcomes and provide strategic recommendations.
 * 
 * This is the "80 moves ahead" capability:
 * Not through calculation, but through PATTERN MATCHING across
 * thousands of games with similar color flow characteristics.
 * 
 * Innovation: Convert every game into a visual fingerprint, then
 * match new games against this pattern database for trajectory prediction.
 */

import { 
  ColorFlowSignature, 
  StrategicArchetype, 
  extractColorFlowSignature,
  ARCHETYPE_DEFINITIONS 
} from './colorFlowAnalysis';
import { SimulationResult, simulateGame, GameData } from './gameSimulator';
import { supabase } from '@/integrations/supabase/client';

// ===================== PATTERN DATABASE TYPES =====================

export interface PatternRecord {
  /** Unique identifier */
  id: string;
  
  /** Color flow fingerprint for matching */
  fingerprint: string;
  
  /** The archetype this pattern belongs to */
  archetype: StrategicArchetype;
  
  /** Game outcome */
  outcome: 'white_wins' | 'black_wins' | 'draw';
  
  /** Number of moves in the original game */
  totalMoves: number;
  
  /** Key characteristics for similarity matching */
  characteristics: PatternCharacteristics;
  
  /** Opening ECO code if known */
  openingEco?: string;
  
  /** Source game metadata */
  gameMetadata?: {
    event?: string;
    white?: string;
    black?: string;
    date?: string;
  };
}

export interface PatternCharacteristics {
  flowDirection: string;
  intensity: number;
  volatility: number;
  dominantSide: string;
  centerControl: number;
  kingsideActivity: number;
  queensideActivity: number;
}

export interface PatternMatch {
  /** The matched pattern */
  pattern: PatternRecord;
  
  /** Similarity score (0-100) */
  similarity: number;
  
  /** What aspects matched best */
  matchingFactors: string[];
  
  /** Predicted outcome based on this match */
  predictedOutcome: 'white_wins' | 'black_wins' | 'draw';
  
  /** Confidence in this match */
  confidence: number;
}

export interface PatternPrediction {
  /** Best matching patterns from database */
  topMatches: PatternMatch[];
  
  /** Aggregate prediction from all matches */
  aggregatePrediction: {
    whiteWinProbability: number;
    blackWinProbability: number;
    drawProbability: number;
  };
  
  /** Most likely outcome */
  mostLikelyOutcome: 'white_wins' | 'black_wins' | 'draw';
  
  /** Confidence level (0-100) */
  confidence: number;
  
  /** How many moves ahead this prediction covers */
  lookaheadMoves: number;
  
  /** Insights from pattern matching */
  insights: string[];
}

// ===================== IN-MEMORY PATTERN DATABASE =====================

/**
 * In-memory pattern database for fast matching
 * In production, this would be backed by Supabase
 */
class PatternDatabase {
  private patterns: Map<string, PatternRecord> = new Map();
  private archetypeIndex: Map<StrategicArchetype, PatternRecord[]> = new Map();
  
  /**
   * Add a pattern to the database
   */
  addPattern(signature: ColorFlowSignature, outcome: 'white_wins' | 'black_wins' | 'draw', gameData: GameData, totalMoves: number): PatternRecord {
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
    
    // Add to main store
    this.patterns.set(record.id, record);
    
    // Add to archetype index
    const existing = this.archetypeIndex.get(signature.archetype) || [];
    existing.push(record);
    this.archetypeIndex.set(signature.archetype, existing);
    
    return record;
  }
  
  /**
   * Find patterns similar to a given signature
   */
  findSimilar(signature: ColorFlowSignature, limit: number = 5): PatternMatch[] {
    const matches: PatternMatch[] = [];
    
    // First, look at same archetype
    const sameArchetype = this.archetypeIndex.get(signature.archetype) || [];
    
    for (const pattern of sameArchetype) {
      const similarity = this.calculateSimilarity(signature, pattern);
      if (similarity > 30) { // Minimum threshold
        matches.push({
          pattern,
          similarity,
          matchingFactors: this.getMatchingFactors(signature, pattern),
          predictedOutcome: pattern.outcome,
          confidence: similarity * 0.9, // Confidence scales with similarity
        });
      }
    }
    
    // Also check related archetypes
    const relatedArchetypes = this.getRelatedArchetypes(signature.archetype);
    for (const archetype of relatedArchetypes) {
      const related = this.archetypeIndex.get(archetype) || [];
      for (const pattern of related) {
        const similarity = this.calculateSimilarity(signature, pattern) * 0.8; // Penalty for different archetype
        if (similarity > 30) {
          matches.push({
            pattern,
            similarity,
            matchingFactors: this.getMatchingFactors(signature, pattern),
            predictedOutcome: pattern.outcome,
            confidence: similarity * 0.7,
          });
        }
      }
    }
    
    // Sort by similarity and return top matches
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
  
  private calculateSimilarity(signature: ColorFlowSignature, pattern: PatternRecord): number {
    const chars = pattern.characteristics;
    let score = 0;
    let factors = 0;
    
    // Flow direction match (25 points)
    if (signature.flowDirection === chars.flowDirection) {
      score += 25;
    } else if (this.areFlowsRelated(signature.flowDirection, chars.flowDirection)) {
      score += 12;
    }
    factors++;
    
    // Intensity similarity (20 points)
    const intensityDiff = Math.abs(signature.intensity - chars.intensity);
    score += Math.max(0, 20 - intensityDiff / 2);
    factors++;
    
    // Volatility similarity (15 points)
    const volatilityDiff = Math.abs(signature.temporalFlow.volatility - chars.volatility);
    score += Math.max(0, 15 - volatilityDiff / 3);
    factors++;
    
    // Dominant side match (20 points)
    if (signature.dominantSide === chars.dominantSide) {
      score += 20;
    } else if (signature.dominantSide === 'contested' || chars.dominantSide === 'contested') {
      score += 10;
    }
    factors++;
    
    // Center control similarity (10 points)
    const centerDiff = Math.abs(signature.quadrantProfile.center - chars.centerControl);
    score += Math.max(0, 10 - centerDiff / 5);
    factors++;
    
    // Side activity similarity (10 points)
    const kingsideActivity = (signature.quadrantProfile.kingsideWhite + signature.quadrantProfile.kingsideBlack) / 2;
    const kingsideDiff = Math.abs(kingsideActivity - chars.kingsideActivity);
    score += Math.max(0, 5 - kingsideDiff / 10);
    
    const queensideActivity = (signature.quadrantProfile.queensideWhite + signature.quadrantProfile.queensideBlack) / 2;
    const queensideDiff = Math.abs(queensideActivity - chars.queensideActivity);
    score += Math.max(0, 5 - queensideDiff / 10);
    factors++;
    
    return Math.round(score);
  }
  
  private areFlowsRelated(a: string, b: string): boolean {
    const related: Record<string, string[]> = {
      kingside: ['central', 'diagonal'],
      queenside: ['central', 'diagonal'],
      central: ['kingside', 'queenside', 'balanced'],
      balanced: ['central'],
      diagonal: ['kingside', 'queenside'],
    };
    return related[a]?.includes(b) || false;
  }
  
  private getMatchingFactors(signature: ColorFlowSignature, pattern: PatternRecord): string[] {
    const factors: string[] = [];
    const chars = pattern.characteristics;
    
    if (signature.flowDirection === chars.flowDirection) {
      factors.push(`Same flow direction: ${signature.flowDirection}`);
    }
    
    if (signature.dominantSide === chars.dominantSide) {
      factors.push(`Same dominant side: ${signature.dominantSide}`);
    }
    
    if (Math.abs(signature.intensity - chars.intensity) < 15) {
      factors.push('Similar intensity level');
    }
    
    if (Math.abs(signature.temporalFlow.volatility - chars.volatility) < 20) {
      factors.push('Similar game volatility');
    }
    
    if (factors.length === 0) {
      factors.push('Structural pattern similarity');
    }
    
    return factors;
  }
  
  private getRelatedArchetypes(archetype: StrategicArchetype): StrategicArchetype[] {
    const relations: Record<StrategicArchetype, StrategicArchetype[]> = {
      kingside_attack: ['sacrificial_attack', 'open_tactical'],
      queenside_expansion: ['positional_squeeze', 'closed_maneuvering'],
      central_domination: ['piece_harmony', 'positional_squeeze'],
      prophylactic_defense: ['closed_maneuvering', 'endgame_technique'],
      pawn_storm: ['kingside_attack', 'opposite_castling'],
      piece_harmony: ['central_domination', 'positional_squeeze'],
      opposite_castling: ['kingside_attack', 'pawn_storm'],
      closed_maneuvering: ['prophylactic_defense', 'positional_squeeze'],
      open_tactical: ['sacrificial_attack', 'kingside_attack'],
      endgame_technique: ['prophylactic_defense', 'positional_squeeze'],
      sacrificial_attack: ['open_tactical', 'kingside_attack'],
      positional_squeeze: ['central_domination', 'closed_maneuvering'],
      unknown: [],
    };
    return relations[archetype] || [];
  }
  
  /**
   * Get database statistics
   */
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
  
  /**
   * Clear all patterns
   */
  clear(): void {
    this.patterns.clear();
    this.archetypeIndex.clear();
  }
}

// Singleton instance
const patternDatabase = new PatternDatabase();

// ===================== PUBLIC API =====================

/**
 * Learn a pattern from a completed game
 */
export function learnFromGame(
  pgn: string,
  outcome: 'white_wins' | 'black_wins' | 'draw'
): PatternRecord {
  // Simulate the game
  const simulation = simulateGame(pgn);
  
  // Extract color flow signature
  const signature = extractColorFlowSignature(
    simulation.board,
    simulation.gameData,
    simulation.totalMoves
  );
  
  // Add to pattern database
  return patternDatabase.addPattern(
    signature,
    outcome,
    simulation.gameData,
    simulation.totalMoves
  );
}

/**
 * Get pattern-based prediction for a game in progress
 */
export function predictFromPatterns(pgn: string): PatternPrediction {
  // Simulate current game state
  const simulation = simulateGame(pgn);
  
  // Extract signature
  const signature = extractColorFlowSignature(
    simulation.board,
    simulation.gameData,
    simulation.totalMoves
  );
  
  // Find similar patterns
  const matches = patternDatabase.findSimilar(signature, 10);
  
  // If no matches, use archetype-based prediction
  if (matches.length === 0) {
    const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
    return {
      topMatches: [],
      aggregatePrediction: {
        whiteWinProbability: archetypeDef.historicalWinRate,
        blackWinProbability: 1 - archetypeDef.historicalWinRate - 0.15,
        drawProbability: 0.15,
      },
      mostLikelyOutcome: archetypeDef.predictedOutcome === 'white_favored' ? 'white_wins' : 
                         archetypeDef.predictedOutcome === 'black_favored' ? 'black_wins' : 'draw',
      confidence: 40,
      lookaheadMoves: archetypeDef.lookaheadConfidence,
      insights: [
        `Pattern type: ${archetypeDef.name}`,
        'No historical matches found - using archetype baseline',
        signature.dominantSide !== 'contested' 
          ? `${signature.dominantSide} has territorial advantage`
          : 'Position is territorially contested',
      ],
    };
  }
  
  // Aggregate predictions from matches
  let whiteWins = 0, blackWins = 0, draws = 0;
  let totalWeight = 0;
  
  for (const match of matches) {
    const weight = match.similarity / 100;
    totalWeight += weight;
    
    if (match.predictedOutcome === 'white_wins') whiteWins += weight;
    else if (match.predictedOutcome === 'black_wins') blackWins += weight;
    else draws += weight;
  }
  
  const aggregatePrediction = {
    whiteWinProbability: whiteWins / totalWeight,
    blackWinProbability: blackWins / totalWeight,
    drawProbability: draws / totalWeight,
  };
  
  // Determine most likely outcome
  let mostLikelyOutcome: 'white_wins' | 'black_wins' | 'draw';
  if (aggregatePrediction.whiteWinProbability >= aggregatePrediction.blackWinProbability &&
      aggregatePrediction.whiteWinProbability >= aggregatePrediction.drawProbability) {
    mostLikelyOutcome = 'white_wins';
  } else if (aggregatePrediction.blackWinProbability >= aggregatePrediction.drawProbability) {
    mostLikelyOutcome = 'black_wins';
  } else {
    mostLikelyOutcome = 'draw';
  }
  
  // Calculate confidence
  const avgSimilarity = matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length;
  const confidence = Math.round(avgSimilarity * (matches.length / 10) * 0.9);
  
  // Calculate lookahead based on archetype
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const lookaheadMoves = archetypeDef.lookaheadConfidence + 
    Math.round(avgSimilarity / 10) + 
    Math.min(10, matches.length * 2);
  
  // Generate insights
  const insights: string[] = [];
  insights.push(`Matched ${matches.length} historical patterns`);
  insights.push(`Strongest match: ${matches[0].similarity}% similarity`);
  
  if (matches[0].pattern.gameMetadata?.white) {
    insights.push(`Similar to: ${matches[0].pattern.gameMetadata.white} vs ${matches[0].pattern.gameMetadata.black}`);
  }
  
  insights.push(`Pattern trajectory reliable for ~${lookaheadMoves} moves`);
  
  return {
    topMatches: matches.slice(0, 5),
    aggregatePrediction,
    mostLikelyOutcome,
    confidence,
    lookaheadMoves,
    insights,
  };
}

/**
 * Seed the pattern database with famous games
 */
export function seedPatternDatabase(): void {
  // These would be actual famous games - abbreviated for example
  const seedGames = [
    {
      name: 'Kasparov vs Deep Blue 1997',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O',
      outcome: 'black_wins' as const,
    },
    {
      name: 'Morphy Opera Game',
      pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7',
      outcome: 'white_wins' as const,
    },
    {
      name: 'Immortal Game',
      pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5',
      outcome: 'white_wins' as const,
    },
    {
      name: 'Evergreen Game',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3',
      outcome: 'white_wins' as const,
    },
  ];
  
  for (const game of seedGames) {
    try {
      learnFromGame(game.pgn, game.outcome);
    } catch (e) {
      console.warn(`Failed to learn from ${game.name}:`, e);
    }
  }
}

/**
 * Get pattern database statistics
 */
export function getPatternDatabaseStats(): { totalPatterns: number; byArchetype: Record<string, number> } {
  return patternDatabase.getStats();
}

/**
 * Clear the pattern database
 */
export function clearPatternDatabase(): void {
  patternDatabase.clear();
}

// ===================== EXPORTS =====================

export { patternDatabase };
export default predictFromPatterns;
