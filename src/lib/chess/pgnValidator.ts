import { Chess } from 'chess.js';

export interface PgnValidationResult {
  isValid: boolean;
  error?: string;
  moveCount?: number;
  invalidMove?: string;
  invalidMoveNumber?: number;
}

/**
 * Validates a PGN string by attempting to parse and replay all moves.
 * Returns detailed information about any validation errors.
 */
export function validatePgn(pgn: string): PgnValidationResult {
  if (!pgn || !pgn.trim()) {
    return {
      isValid: false,
      error: 'PGN is empty. Please provide a valid chess game notation.',
    };
  }

  const chess = new Chess();

  // First, try to load the PGN directly
  try {
    chess.loadPgn(pgn);
    const history = chess.history();
    
    if (history.length === 0) {
      return {
        isValid: false,
        error: 'No valid moves found in the PGN. Please check the notation format.',
      };
    }

    return {
      isValid: true,
      moveCount: history.length,
    };
  } catch (e) {
    // If direct loading fails, try to find the specific invalid move
    const errorMessage = e instanceof Error ? e.message : String(e);
    
    // Extract the move that failed from the error message
    const moveMatch = errorMessage.match(/Invalid move in PGN: (\S+)/);
    const invalidMove = moveMatch ? moveMatch[1] : undefined;

    // Try to replay moves one by one to find the exact problem
    chess.reset();
    
    // Extract just the moves part (after the headers)
    const movesSection = pgn.replace(/\[[^\]]*\]/g, '').trim();
    
    // Parse individual moves - handle move numbers and annotations
    const moveTokens = movesSection
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\([^)]*\)/g, '') // Remove variations
      .replace(/\$\d+/g, '') // Remove NAG annotations
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove results
      .split(/\s+/)
      .filter(token => {
        // Filter out move numbers and empty tokens
        return token && !token.match(/^\d+\.+$/) && token !== '...';
      });

    let moveNumber = 0;
    for (const moveToken of moveTokens) {
      moveNumber++;
      try {
        const result = chess.move(moveToken);
        if (!result) {
          return {
            isValid: false,
            error: `Invalid move "${moveToken}" at move ${Math.ceil(moveNumber / 2)}. The move is not legal in this position.`,
            invalidMove: moveToken,
            invalidMoveNumber: Math.ceil(moveNumber / 2),
          };
        }
      } catch (moveError) {
        return {
          isValid: false,
          error: `Invalid move "${moveToken}" at move ${Math.ceil(moveNumber / 2)}. Please check the notation.`,
          invalidMove: moveToken,
          invalidMoveNumber: Math.ceil(moveNumber / 2),
        };
      }
    }

    // If we got here but the original load failed, there's a header issue
    return {
      isValid: false,
      error: invalidMove 
        ? `Invalid move: ${invalidMove}. Please verify all moves are in standard algebraic notation.`
        : 'Unable to parse PGN. Please check the format and notation.',
    };
  }
}

/**
 * Cleans and normalizes PGN text for better parsing compatibility
 */
export function cleanPgn(pgn: string): string {
  return pgn
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}
