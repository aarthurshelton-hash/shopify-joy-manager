import { Chess, Move } from 'chess.js';

export interface PgnFixSuggestion {
  originalMove: string;
  suggestedMove: string;
  moveNumber: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PgnFixResult {
  canFix: boolean;
  fixedPgn?: string;
  suggestions: PgnFixSuggestion[];
  originalError: string;
}

/**
 * Common move notation corrections
 */
const COMMON_TYPOS: Record<string, string[]> = {
  // Castle notation variants
  '0-0': ['O-O'],
  '0-0-0': ['O-O-O'],
  'o-o': ['O-O'],
  'o-o-o': ['O-O-O'],
  // Common OCR/typing errors
  'l': ['1'],
  'O': ['0'],
  'I': ['1'],
};

/**
 * Attempts to fix an invalid PGN by analyzing and correcting common issues
 */
export function fixPgn(pgn: string): PgnFixResult {
  const chess = new Chess();
  const suggestions: PgnFixSuggestion[] = [];
  
  // First check if PGN is actually valid
  try {
    chess.loadPgn(pgn);
    return {
      canFix: true,
      fixedPgn: pgn,
      suggestions: [],
      originalError: 'PGN is already valid',
    };
  } catch (e) {
    // Continue to fix
  }

  // Extract headers and moves section
  const headerMatches = pgn.match(/\[[^\]]*\]/g) || [];
  const headers = headerMatches.join('\n');
  let movesSection = pgn.replace(/\[[^\]]*\]/g, '').trim();
  
  // Store original moves section for reference
  const originalMovesSection = movesSection;
  
  // Clean up common formatting issues
  movesSection = movesSection
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/\([^)]*\)/g, '') // Remove variations  
    .replace(/\$\d+/g, '') // Remove NAG annotations
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove results temporarily
    .trim();

  // Parse move tokens
  const tokens = movesSection.split(/\s+/).filter(t => t.length > 0);
  const fixedMoves: string[] = [];
  let currentMoveNumber = 1;
  let isWhiteMove = true;
  
  chess.reset();
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Skip move numbers
    if (token.match(/^\d+\.+$/)) {
      const num = parseInt(token);
      if (!isNaN(num)) {
        currentMoveNumber = num;
        isWhiteMove = !token.includes('...');
      }
      continue;
    }
    
    if (token === '...') {
      isWhiteMove = false;
      continue;
    }
    
    // Try the move as-is first
    const moveResult = tryMove(chess, token);
    
    if (moveResult) {
      fixedMoves.push(moveResult.san);
      isWhiteMove = !isWhiteMove;
      if (!isWhiteMove) currentMoveNumber++;
      continue;
    }
    
    // Try to fix the move
    const fixResult = attemptMoveFix(chess, token, currentMoveNumber, isWhiteMove);
    
    if (fixResult) {
      suggestions.push({
        originalMove: token,
        suggestedMove: fixResult.move.san,
        moveNumber: currentMoveNumber,
        reason: fixResult.reason,
        confidence: fixResult.confidence,
      });
      
      fixedMoves.push(fixResult.move.san);
      isWhiteMove = !isWhiteMove;
      if (!isWhiteMove) currentMoveNumber++;
    } else {
      // Cannot fix this move - try to suggest alternatives
      const legalMoves = chess.moves();
      const similarMoves = findSimilarMoves(token, legalMoves);
      
      if (similarMoves.length > 0) {
        // Use the most similar legal move
        const bestMatch = similarMoves[0];
        const move = chess.move(bestMatch);
        if (move) {
          suggestions.push({
            originalMove: token,
            suggestedMove: bestMatch,
            moveNumber: currentMoveNumber,
            reason: `"${token}" is not legal. Closest legal move: "${bestMatch}"`,
            confidence: 'low',
          });
          fixedMoves.push(move.san);
          isWhiteMove = !isWhiteMove;
          if (!isWhiteMove) currentMoveNumber++;
          continue;
        }
      }
      
      // Cannot fix - return partial result
      return {
        canFix: false,
        suggestions,
        originalError: `Cannot determine correct move for "${token}" at move ${currentMoveNumber}. No similar legal moves found.`,
      };
    }
  }
  
  // Reconstruct the PGN
  let fixedPgn = headers ? headers + '\n\n' : '';
  
  for (let i = 0; i < fixedMoves.length; i++) {
    const moveNum = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      fixedPgn += `${moveNum}. ${fixedMoves[i]} `;
    } else {
      fixedPgn += `${fixedMoves[i]} `;
    }
  }
  
  // Add result if it was in original
  const resultMatch = originalMovesSection.match(/(1-0|0-1|1\/2-1\/2|\*)$/);
  if (resultMatch) {
    fixedPgn += resultMatch[1];
  }
  
  return {
    canFix: true,
    fixedPgn: fixedPgn.trim(),
    suggestions,
    originalError: suggestions.length > 0 
      ? `Fixed ${suggestions.length} move(s)` 
      : 'PGN formatted correctly',
  };
}

function tryMove(chess: Chess, move: string): Move | null {
  try {
    return chess.move(move);
  } catch {
    return null;
  }
}

interface FixAttempt {
  move: Move;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

function attemptMoveFix(
  chess: Chess, 
  originalMove: string, 
  moveNumber: number,
  isWhiteMove: boolean
): FixAttempt | null {
  const legalMoves = chess.moves({ verbose: true });
  
  // Try common typo corrections first
  for (const [typo, corrections] of Object.entries(COMMON_TYPOS)) {
    if (originalMove.toLowerCase().includes(typo.toLowerCase())) {
      for (const correction of corrections) {
        const correctedMove = originalMove.replace(new RegExp(typo, 'gi'), correction);
        const result = tryMove(chess, correctedMove);
        if (result) {
          return {
            move: result,
            reason: `Fixed notation: "${originalMove}" → "${correctedMove}"`,
            confidence: 'high',
          };
        }
      }
    }
  }
  
  // Try castle notation fixes
  if (originalMove.match(/^[0Oo]-[0Oo](-[0Oo])?$/i)) {
    const isLongCastle = originalMove.length > 3;
    const castleMove = isLongCastle ? 'O-O-O' : 'O-O';
    const result = tryMove(chess, castleMove);
    if (result) {
      return {
        move: result,
        reason: `Fixed castle notation: "${originalMove}" → "${castleMove}"`,
        confidence: 'high',
      };
    }
  }
  
  // Try to find a move with the same piece to a similar square
  const pieceMatch = originalMove.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h])([1-8])/i);
  if (pieceMatch) {
    const [, piece, fromFile, fromRank, capture, toFile, toRank] = pieceMatch;
    const targetSquare = `${toFile}${toRank}`;
    
    // Find moves to the same target square
    const movesToSquare = legalMoves.filter(m => m.to === targetSquare);
    
    if (movesToSquare.length === 1) {
      const result = tryMove(chess, movesToSquare[0].san);
      if (result) {
        return {
          move: result,
          reason: `Corrected move to ${targetSquare}: "${originalMove}" → "${result.san}"`,
          confidence: 'medium',
        };
      }
    }
    
    // If piece is specified, filter by piece type
    if (piece && movesToSquare.length > 1) {
      const pieceType = piece.toLowerCase();
      const pieceMatches = movesToSquare.filter(m => m.piece === pieceType);
      if (pieceMatches.length === 1) {
        const result = tryMove(chess, pieceMatches[0].san);
        if (result) {
          return {
            move: result,
            reason: `Corrected ${piece} move: "${originalMove}" → "${result.san}"`,
            confidence: 'medium',
          };
        }
      }
    }
  }
  
  // Try pawn moves with incorrect notation
  if (originalMove.match(/^[a-h][1-8]/i)) {
    const toSquare = originalMove.slice(0, 2).toLowerCase();
    const pawnMoves = legalMoves.filter(m => m.piece === 'p' && m.to === toSquare);
    if (pawnMoves.length === 1) {
      const result = tryMove(chess, pawnMoves[0].san);
      if (result) {
        return {
          move: result,
          reason: `Fixed pawn move: "${originalMove}" → "${result.san}"`,
          confidence: 'high',
        };
      }
    }
  }
  
  // Try removing extraneous characters
  const cleanedMove = originalMove.replace(/[+#!?]+$/, '');
  if (cleanedMove !== originalMove) {
    const result = tryMove(chess, cleanedMove);
    if (result) {
      return {
        move: result,
        reason: `Removed extra characters: "${originalMove}" → "${result.san}"`,
        confidence: 'high',
      };
    }
  }
  
  return null;
}

function findSimilarMoves(invalidMove: string, legalMoves: string[]): string[] {
  // Calculate similarity scores
  const scored = legalMoves.map(legal => ({
    move: legal,
    score: calculateSimilarity(invalidMove.toLowerCase(), legal.toLowerCase()),
  }));
  
  // Sort by similarity and return top matches
  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.move);
}

function calculateSimilarity(a: string, b: string): number {
  // Simple Levenshtein-based similarity
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[a.length][b.length];
}

/**
 * Generate a human-readable explanation of the fixes
 */
export function explainFixes(result: PgnFixResult): string {
  if (!result.canFix) {
    return result.originalError;
  }
  
  if (result.suggestions.length === 0) {
    return 'No fixes needed - PGN is valid.';
  }
  
  const fixes = result.suggestions.map((s, i) => 
    `${i + 1}. Move ${s.moveNumber}: "${s.originalMove}" → "${s.suggestedMove}" (${s.reason})`
  );
  
  return `Found ${result.suggestions.length} issue(s):\n${fixes.join('\n')}`;
}
