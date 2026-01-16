/**
 * Pattern Learning Engine
 * 
 * En Pensent™ Patent-Pending Technology
 * 
 * Refactored into modular components for maintainability.
 */

import { 
  ColorFlowSignature, 
  extractColorFlowSignature,
  ARCHETYPE_DEFINITIONS 
} from './colorFlowAnalysis';
import { simulateGame, GameData } from './gameSimulator';

// Re-export types from modular structure
export type { PatternRecord, PatternMatch, PatternPrediction, PatternCharacteristics } from './patternLearning/types';
export { patternDatabase, PatternDatabase } from './patternLearning/patternDatabase';

import { patternDatabase } from './patternLearning/patternDatabase';
import { PatternRecord, PatternPrediction } from './patternLearning/types';

/**
 * Learn a pattern from a completed game
 */
export function learnFromGame(
  pgn: string,
  outcome: 'white_wins' | 'black_wins' | 'draw'
): PatternRecord {
  const simulation = simulateGame(pgn);
  
  const signature = extractColorFlowSignature(
    simulation.board,
    simulation.gameData,
    simulation.totalMoves
  );
  
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
  const simulation = simulateGame(pgn);
  
  const signature = extractColorFlowSignature(
    simulation.board,
    simulation.gameData,
    simulation.totalMoves
  );
  
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

export default predictFromPatterns;
