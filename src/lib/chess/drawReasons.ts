import { Chess } from 'chess.js';

export type DrawReason = 
  | 'stalemate'
  | 'threefold_repetition'
  | 'insufficient_material'
  | 'fifty_move_rule'
  | 'agreement'
  | 'unknown';

export interface DrawInfo {
  reason: DrawReason;
  message: string;
  shortMessage: string;
}

/**
 * Get specific draw reason from a chess game
 */
export function getDrawReason(game: Chess): DrawInfo {
  if (game.isStalemate()) {
    return {
      reason: 'stalemate',
      message: 'Stalemate! No legal moves available.',
      shortMessage: 'Stalemate!',
    };
  }
  
  if (game.isThreefoldRepetition()) {
    return {
      reason: 'threefold_repetition',
      message: 'Draw by threefold repetition.',
      shortMessage: 'Threefold Repetition',
    };
  }
  
  if (game.isInsufficientMaterial()) {
    return {
      reason: 'insufficient_material',
      message: 'Draw by insufficient material.',
      shortMessage: 'Insufficient Material',
    };
  }
  
  // Check 50-move rule (100 half-moves without pawn move or capture)
  // Note: chess.js uses halfMoves for this counter
  const fen = game.fen();
  const halfMoves = parseInt(fen.split(' ')[4], 10);
  if (halfMoves >= 100) {
    return {
      reason: 'fifty_move_rule',
      message: 'Draw by the fifty-move rule.',
      shortMessage: '50-Move Rule',
    };
  }
  
  return {
    reason: 'unknown',
    message: 'Game drawn!',
    shortMessage: 'Draw',
  };
}

/**
 * Check if the game is a draw and get the reason
 */
export function isDraw(game: Chess): boolean {
  return game.isDraw() || game.isStalemate();
}

/**
 * Get a toast-friendly message for the draw
 */
export function getDrawToastMessage(game: Chess): string {
  const info = getDrawReason(game);
  return info.message;
}
