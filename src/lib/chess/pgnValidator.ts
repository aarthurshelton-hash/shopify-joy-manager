import { Chess } from 'chess.js';

export interface PgnValidationResult {
  isValid: boolean;
  error?: string;
  moveCount?: number;
  invalidMove?: string;
  invalidMoveNumber?: number;
}

/**
 * Validates a PGN string - now PERMISSIVE.
 * We count moves that can be parsed but don't reject PGNs with some invalid moves.
 * The simulator will handle whatever it can.
 */
export function validatePgn(pgn: string): PgnValidationResult {
  if (!pgn || !pgn.trim()) {
    return {
      isValid: false,
      error: 'PGN is empty. Please provide a valid chess game notation.',
    };
  }

  const chess = new Chess();
  
  // Try to load the PGN directly first
  try {
    chess.loadPgn(pgn);
    const history = chess.history();
    
    return {
      isValid: true,
      moveCount: history.length,
    };
  } catch (e) {
    // If direct loading fails, try manual parsing to count playable moves
    chess.reset();
    
    const movesSection = pgn.replace(/\[[^\]]*\]/g, '').trim();
    
    const moveTokens = movesSection
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\$\d+/g, '')
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
      .split(/\s+/)
      .filter(token => token && !token.match(/^\d+\.+$/) && token !== '...');

    let validMoves = 0;
    
    for (const moveToken of moveTokens) {
      try {
        const fixedMove = moveToken
          .replace(/0-0-0/gi, 'O-O-O')
          .replace(/0-0/gi, 'O-O')
          .replace(/[+#!?]+$/, '');
        
        const result = chess.move(fixedMove);
        if (result) {
          validMoves++;
        }
      } catch {
        // Skip invalid moves - continue parsing
      }
    }
    
    // Be permissive: if we got ANY moves, consider it valid
    if (validMoves > 0) {
      return {
        isValid: true,
        moveCount: validMoves,
      };
    }
    
    // Only fail if we couldn't parse ANY moves at all
    return {
      isValid: false,
      error: 'Could not parse any moves from the PGN. Please check the notation format.',
    };
  }
}

/**
 * Cleans and normalizes PGN text for better parsing compatibility
 */
export function cleanPgn(pgn: string): string {
  return pgn
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
