import { Chess, Square, Move } from 'chess.js';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface EvaluationResult {
  score: number;
  move: Move | null;
}

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Position tables for piece-square evaluation
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MIDDLE_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPositionTable(piece: string): number[][] {
  switch (piece.toLowerCase()) {
    case 'p': return PAWN_TABLE;
    case 'n': return KNIGHT_TABLE;
    case 'b': return BISHOP_TABLE;
    case 'r': return ROOK_TABLE;
    case 'q': return QUEEN_TABLE;
    case 'k': return KING_MIDDLE_TABLE;
    default: return [];
  }
}

// Evaluate the board position
function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -Infinity : Infinity;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type] || 0;
        const table = getPositionTable(piece.type);
        
        // Get position bonus (flip for black pieces)
        let positionBonus = 0;
        if (table.length > 0) {
          const tableRank = piece.color === 'w' ? rank : 7 - rank;
          positionBonus = table[tableRank][file];
        }

        const totalValue = pieceValue + positionBonus;
        score += piece.color === 'w' ? totalValue : -totalValue;
      }
    }
  }

  // Mobility bonus
  const moves = game.moves().length;
  score += game.turn() === 'w' ? moves * 2 : -moves * 2;

  return score;
}

// Minimax with alpha-beta pruning
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): EvaluationResult {
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game), move: null };
  }

  const moves = game.moves({ verbose: true });
  
  // Move ordering for better pruning
  moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (a.captured) scoreA += PIECE_VALUES[a.captured] || 0;
    if (b.captured) scoreB += PIECE_VALUES[b.captured] || 0;
    if (a.san.includes('+')) scoreA += 50;
    if (b.san.includes('+')) scoreB += 50;
    return scoreB - scoreA;
  });

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove: Move | null = null;

    for (const move of moves) {
      game.move(move);
      const evalResult = minimax(game, depth - 1, alpha, beta, false);
      game.undo();

      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break;
    }

    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove: Move | null = null;

    for (const move of moves) {
      game.move(move);
      const evalResult = minimax(game, depth - 1, alpha, beta, true);
      game.undo();

      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break;
    }

    return { score: minEval, move: bestMove };
  }
}

// Get a random move (for easy difficulty)
function getRandomMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // 30% chance to prefer captures for some aggression
  const captures = moves.filter(m => m.captured);
  if (captures.length > 0 && Math.random() < 0.3) {
    return captures[Math.floor(Math.random() * captures.length)];
  }
  
  return moves[Math.floor(Math.random() * moves.length)];
}

// Get medium difficulty move (basic evaluation, depth 2)
function getMediumMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove: Move | null = null;
  let bestScore = game.turn() === 'w' ? -Infinity : Infinity;

  for (const move of moves) {
    game.move(move);
    const score = evaluateBoard(game);
    game.undo();

    if (game.turn() === 'w') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  // Add some randomness (20% chance to pick a random good move)
  if (Math.random() < 0.2) {
    const sortedMoves = moves.sort((a, b) => {
      game.move(a);
      const scoreA = evaluateBoard(game);
      game.undo();
      game.move(b);
      const scoreB = evaluateBoard(game);
      game.undo();
      return game.turn() === 'w' ? scoreB - scoreA : scoreA - scoreB;
    });
    
    // Pick from top 3 moves
    const topMoves = sortedMoves.slice(0, Math.min(3, sortedMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }

  return bestMove;
}

// Get hard difficulty move (minimax with alpha-beta, depth 4)
function getHardMove(game: Chess): Move | null {
  const result = minimax(
    game,
    4, // Depth 4 for good play without being too slow
    -Infinity,
    Infinity,
    game.turn() === 'w'
  );
  return result.move;
}

// Main bot move function
export function getBotMove(game: Chess, difficulty: BotDifficulty): Move | null {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(game);
    case 'medium':
      return getMediumMove(game);
    case 'hard':
      return getHardMove(game);
    default:
      return getRandomMove(game);
  }
}

// Get thinking delay based on difficulty (for UX)
export function getBotThinkingDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 300 + Math.random() * 500; // 300-800ms
    case 'medium':
      return 500 + Math.random() * 1000; // 500-1500ms
    case 'hard':
      return 800 + Math.random() * 1500; // 800-2300ms
    default:
      return 500;
  }
}

// Difficulty descriptions
export const BOT_DIFFICULTIES: { id: BotDifficulty; label: string; description: string; rating: string }[] = [
  { id: 'easy', label: 'Beginner', description: 'Makes random moves, occasional captures', rating: '~800' },
  { id: 'medium', label: 'Club Player', description: 'Basic tactics and material awareness', rating: '~1400' },
  { id: 'hard', label: 'Master', description: 'Advanced evaluation, 4-ply search depth', rating: '~2000' },
];
