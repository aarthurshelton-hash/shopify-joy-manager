// Game Card Detection - Auto-detect when uploaded PGN matches our famous game cards
// Also integrates with emerging game detection for new high-value games
import { famousGames, FamousGame } from './famousGames';
import { Chess } from 'chess.js';

export interface GameCardMatch {
  isMatch: boolean;
  matchedGame: FamousGame | null;
  similarity: number; // 0-1 representing how closely the moves match
  matchType: 'exact' | 'partial' | 'none';
}

// Re-export emerging game detection for unified access
export { detectEmergingGame, formatSignificanceDisplay, getSignificanceLabel } from './emergingGameDetection';
export type { EmergingGameSignificance } from './emergingGameDetection';

/**
 * Normalize PGN moves by removing annotations, comments, and extra whitespace
 */
function normalizeMoves(pgn: string): string[] {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return chess.history();
  } catch {
    // If PGN fails to load, try extracting moves manually
    const moveSection = pgn.replace(/\[.*?\]/g, '').trim();
    const moves = moveSection
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\([^)]*\)/g, '') // Remove variations
      .replace(/\d+\.\s*/g, ' ') // Remove move numbers
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove results
      .split(/\s+/)
      .filter(m => m.length > 0 && /^[KQRBNP]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$/i.test(m) || m === 'O-O' || m === 'O-O-O');
    return moves;
  }
}

/**
 * Calculate similarity between two move arrays
 */
function calculateMoveSimilarity(moves1: string[], moves2: string[]): number {
  if (moves1.length === 0 || moves2.length === 0) return 0;
  
  const minLength = Math.min(moves1.length, moves2.length);
  const maxLength = Math.max(moves1.length, moves2.length);
  
  let matchingMoves = 0;
  for (let i = 0; i < minLength; i++) {
    if (moves1[i] === moves2[i]) {
      matchingMoves++;
    } else {
      // Once moves diverge, stop counting
      break;
    }
  }
  
  // Similarity is based on matching moves vs the longer game
  // We want to catch both exact matches and games that are subsets
  return matchingMoves / maxLength;
}

/**
 * Detect if an uploaded PGN matches one of our famous game cards
 * @param uploadedPgn The PGN string uploaded by the user
 * @returns GameCardMatch object with match details
 */
export function detectGameCard(uploadedPgn: string): GameCardMatch {
  if (!uploadedPgn || uploadedPgn.trim().length === 0) {
    return { isMatch: false, matchedGame: null, similarity: 0, matchType: 'none' };
  }

  const uploadedMoves = normalizeMoves(uploadedPgn);
  
  if (uploadedMoves.length < 5) {
    // Too few moves to make a meaningful match
    return { isMatch: false, matchedGame: null, similarity: 0, matchType: 'none' };
  }

  let bestMatch: FamousGame | null = null;
  let bestSimilarity = 0;
  
  for (const game of famousGames) {
    const gameMoves = normalizeMoves(game.pgn);
    const similarity = calculateMoveSimilarity(uploadedMoves, gameMoves);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = game;
    }
  }

  // Thresholds for matching:
  // - Exact: 95%+ similarity (allows for minor annotation differences)
  // - Partial: 70%+ similarity (covers games that are subsets or have minor variations)
  // - None: below 70%
  
  if (bestSimilarity >= 0.95) {
    return {
      isMatch: true,
      matchedGame: bestMatch,
      similarity: bestSimilarity,
      matchType: 'exact'
    };
  } else if (bestSimilarity >= 0.70) {
    return {
      isMatch: true,
      matchedGame: bestMatch,
      similarity: bestSimilarity,
      matchType: 'partial'
    };
  }
  
  return { isMatch: false, matchedGame: null, similarity: bestSimilarity, matchType: 'none' };
}

/**
 * Check if a PGN exactly matches any of our famous game cards
 * Used for ownership/save restrictions
 */
export function isExactGameCardMatch(pgn: string): boolean {
  const match = detectGameCard(pgn);
  return match.matchType === 'exact';
}

/**
 * Get the matched game card for analytics and data collection
 */
export function getMatchedGameCard(pgn: string): FamousGame | null {
  const match = detectGameCard(pgn);
  return match.isMatch ? match.matchedGame : null;
}
