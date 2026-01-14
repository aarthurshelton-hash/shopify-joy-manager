/**
 * Advanced Chess Analysis System
 * 
 * Inspired by Stockfish and chess.com evaluation methods.
 * Provides comprehensive position evaluation, tactical detection,
 * and move quality scoring using centipawn-based analysis.
 * 
 * Key Features:
 * - Centipawn evaluation system
 * - Win probability calculations
 * - Advanced tactical pattern detection
 * - Positional evaluation factors
 * - Enhanced move quality classification
 */

import { Chess, Move, Square, PieceSymbol, Color } from 'chess.js';

// ===================== PIECE VALUES (STOCKFISH-INSPIRED) =====================

/**
 * Standard piece values in centipawns (100cp = 1 pawn)
 * Based on Stockfish's evaluation function
 */
export const CENTIPAWN_VALUES: Record<PieceSymbol, number> = {
  p: 100,   // Pawn
  n: 305,   // Knight (Stockfish uses ~305)
  b: 333,   // Bishop (slightly > knight due to long-range)
  r: 563,   // Rook
  q: 950,   // Queen
  k: 0,     // King (infinite value, but 0 for material calc)
};

/**
 * Endgame piece values (pieces change value in endgame)
 */
export const ENDGAME_VALUES: Record<PieceSymbol, number> = {
  p: 120,   // Pawns more valuable in endgame
  n: 290,   // Knights slightly weaker
  b: 340,   // Bishops slightly stronger
  r: 590,   // Rooks more valuable
  q: 980,   // Queen more valuable
  k: 0,
};

// ===================== WIN PROBABILITY =====================

/**
 * Convert centipawn evaluation to win probability
 * Based on Lichess/chess.com formula
 * 
 * Formula: winProb = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
 */
export function cpToWinProbability(centipawns: number): number {
  const K = 0.00368208; // Scaling factor from Lichess
  return 50 + 50 * (2 / (1 + Math.exp(-K * centipawns)) - 1);
}

/**
 * Calculate accuracy from win probability change
 * Formula: 103.1668 * exp(-0.04354 * (winProbBefore - winProbAfter)) - 3.1669
 * This matches chess.com's accuracy calculation
 */
export function calculateMoveAccuracy(winProbBefore: number, winProbAfter: number): number {
  const probLoss = winProbBefore - winProbAfter;
  
  // If position improved, accuracy is 100%
  if (probLoss <= 0) return 100;
  
  // Chess.com's formula
  const accuracy = 103.1668 * Math.exp(-0.04354 * probLoss) - 3.1669;
  return Math.max(0, Math.min(100, accuracy));
}

// ===================== POSITION EVALUATION =====================

export interface PositionEvaluation {
  material: number;           // Material balance in centipawns
  pawnStructure: number;      // Pawn structure score
  kingSafety: number;         // King safety score
  pieceActivity: number;      // Piece mobility and activity
  centerControl: number;      // Control of central squares
  development: number;        // Development score (opening)
  space: number;              // Space advantage
  threats: number;            // Immediate threats score
  total: number;              // Total evaluation
  phase: 'opening' | 'middlegame' | 'endgame';
}

/**
 * Evaluate a chess position (simplified Stockfish-like evaluation)
 */
export function evaluatePosition(chess: Chess): PositionEvaluation {
  const board = chess.board();
  const phase = detectGamePhase(chess);
  
  // Material count
  const material = calculateMaterialBalance(chess, phase);
  
  // Pawn structure evaluation
  const pawnStructure = evaluatePawnStructure(chess);
  
  // King safety
  const kingSafety = evaluateKingSafety(chess, phase);
  
  // Piece activity (mobility)
  const pieceActivity = evaluatePieceActivity(chess);
  
  // Center control
  const centerControl = evaluateCenterControl(chess);
  
  // Development (mainly for opening)
  const development = phase === 'opening' ? evaluateDevelopment(chess) : 0;
  
  // Space advantage
  const space = evaluateSpace(chess);
  
  // Immediate threats
  const threats = evaluateThreats(chess);
  
  const total = material + pawnStructure + kingSafety + pieceActivity + 
                centerControl + development + space + threats;
  
  return {
    material,
    pawnStructure,
    kingSafety,
    pieceActivity,
    centerControl,
    development,
    space,
    threats,
    total,
    phase,
  };
}

function detectGamePhase(chess: Chess): 'opening' | 'middlegame' | 'endgame' {
  let pieceCount = 0;
  let queenCount = 0;
  const board = chess.board();
  
  for (const row of board) {
    for (const square of row) {
      if (square && square.type !== 'k') {
        pieceCount++;
        if (square.type === 'q') queenCount++;
      }
    }
  }
  
  // Opening: most pieces still on board
  if (pieceCount >= 28) return 'opening';
  // Endgame: few pieces or no queens
  if (pieceCount <= 14 || queenCount === 0) return 'endgame';
  return 'middlegame';
}

function calculateMaterialBalance(chess: Chess, phase: 'opening' | 'middlegame' | 'endgame'): number {
  let balance = 0;
  const values = phase === 'endgame' ? ENDGAME_VALUES : CENTIPAWN_VALUES;
  const board = chess.board();
  
  for (const row of board) {
    for (const square of row) {
      if (square) {
        const value = values[square.type];
        balance += square.color === 'w' ? value : -value;
      }
    }
  }
  
  return balance;
}

function evaluatePawnStructure(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  const files = { w: new Array(8).fill(0), b: new Array(8).fill(0) };
  
  // Count pawns per file
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const piece = board[rank][file];
      if (piece?.type === 'p') {
        files[piece.color][file]++;
      }
    }
  }
  
  // Evaluate pawn structure factors
  for (let file = 0; file < 8; file++) {
    // Doubled pawns penalty (-15cp per doubled pawn)
    if (files.w[file] > 1) score -= 15 * (files.w[file] - 1);
    if (files.b[file] > 1) score += 15 * (files.b[file] - 1);
    
    // Isolated pawns penalty (-20cp)
    const hasLeftNeighborW = file > 0 && files.w[file - 1] > 0;
    const hasRightNeighborW = file < 7 && files.w[file + 1] > 0;
    const hasLeftNeighborB = file > 0 && files.b[file - 1] > 0;
    const hasRightNeighborB = file < 7 && files.b[file + 1] > 0;
    
    if (files.w[file] > 0 && !hasLeftNeighborW && !hasRightNeighborW) {
      score -= 20 * files.w[file];
    }
    if (files.b[file] > 0 && !hasLeftNeighborB && !hasRightNeighborB) {
      score += 20 * files.b[file];
    }
  }
  
  // Passed pawns bonus (simplified check)
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const piece = board[rank][file];
      if (piece?.type === 'p') {
        if (piece.color === 'w' && isPassedPawn(board, file, rank, 'w')) {
          const bonus = 20 + (rank * 10); // More valuable as it advances
          score += bonus;
        }
        if (piece.color === 'b' && isPassedPawn(board, file, rank, 'b')) {
          const bonus = 20 + ((7 - rank) * 10);
          score -= bonus;
        }
      }
    }
  }
  
  return score;
}

function isPassedPawn(board: ({ type: PieceSymbol; color: Color } | null)[][], file: number, rank: number, color: Color): boolean {
  const direction = color === 'w' ? 1 : -1;
  const startRank = color === 'w' ? rank + 1 : rank - 1;
  const endRank = color === 'w' ? 7 : 0;
  
  for (let r = startRank; color === 'w' ? r <= endRank : r >= endRank; r += direction) {
    // Check same file and adjacent files for enemy pawns
    for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
      const piece = board[r][f];
      if (piece?.type === 'p' && piece.color !== color) {
        return false;
      }
    }
  }
  return true;
}

function evaluateKingSafety(chess: Chess, phase: 'opening' | 'middlegame' | 'endgame'): number {
  // King safety less important in endgame
  if (phase === 'endgame') return 0;
  
  let score = 0;
  const board = chess.board();
  
  // Find kings
  let whiteKingPos: [number, number] | null = null;
  let blackKingPos: [number, number] | null = null;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece?.type === 'k') {
        if (piece.color === 'w') whiteKingPos = [rank, file];
        else blackKingPos = [rank, file];
      }
    }
  }
  
  // Check pawn shelter for castled kings
  if (whiteKingPos) {
    const [rank, file] = whiteKingPos;
    // Bonus for castled position (corner)
    if ((file === 6 || file === 1) && rank === 0) {
      score += 30; // Castled bonus
      // Check pawn shield
      const shieldScore = countPawnShield(board, rank, file, 'w');
      score += shieldScore;
    }
    // Penalty for exposed king in center
    if (file >= 2 && file <= 5 && rank <= 1 && phase === 'middlegame') {
      score -= 50; // King stuck in center penalty
    }
  }
  
  if (blackKingPos) {
    const [rank, file] = blackKingPos;
    if ((file === 6 || file === 1) && rank === 7) {
      score -= 30;
      const shieldScore = countPawnShield(board, rank, file, 'b');
      score -= shieldScore;
    }
    if (file >= 2 && file <= 5 && rank >= 6 && phase === 'middlegame') {
      score += 50;
    }
  }
  
  return score;
}

function countPawnShield(board: ({ type: PieceSymbol; color: Color } | null)[][], kingRank: number, kingFile: number, color: Color): number {
  let shieldScore = 0;
  const shieldRank = color === 'w' ? 1 : 6;
  
  for (let f = Math.max(0, kingFile - 1); f <= Math.min(7, kingFile + 1); f++) {
    const piece = board[shieldRank][f];
    if (piece?.type === 'p' && piece.color === color) {
      shieldScore += 10;
    }
  }
  return shieldScore;
}

function evaluatePieceActivity(chess: Chess): number {
  // Simple mobility count
  const moves = chess.moves();
  const mobility = moves.length;
  
  // Baseline is around 30-35 moves
  return (mobility - 30) * 2; // 2cp per extra move above baseline
}

function evaluateCenterControl(chess: Chess): number {
  let score = 0;
  const centerSquares: Square[] = ['d4', 'd5', 'e4', 'e5'];
  const extendedCenter: Square[] = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];
  
  for (const sq of centerSquares) {
    const piece = chess.get(sq);
    if (piece) {
      if (piece.type === 'p') {
        score += piece.color === 'w' ? 20 : -20;
      } else if (piece.type !== 'k') {
        score += piece.color === 'w' ? 10 : -10;
      }
    }
  }
  
  for (const sq of extendedCenter) {
    const piece = chess.get(sq);
    if (piece && piece.type !== 'k' && piece.type !== 'p') {
      score += piece.color === 'w' ? 5 : -5;
    }
  }
  
  return score;
}

function evaluateDevelopment(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  
  // Check if minor pieces are developed
  // White back rank pieces
  if (board[0][1]?.type === 'n') score -= 15; // b1 knight not developed
  if (board[0][2]?.type === 'b') score -= 15; // c1 bishop not developed
  if (board[0][5]?.type === 'b') score -= 15; // f1 bishop not developed
  if (board[0][6]?.type === 'n') score -= 15; // g1 knight not developed
  
  // Black back rank pieces
  if (board[7][1]?.type === 'n') score += 15;
  if (board[7][2]?.type === 'b') score += 15;
  if (board[7][5]?.type === 'b') score += 15;
  if (board[7][6]?.type === 'n') score += 15;
  
  return score;
}

function evaluateSpace(chess: Chess): number {
  let whiteSpace = 0;
  let blackSpace = 0;
  const board = chess.board();
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece?.type === 'p') {
        // Count squares behind pawns as controlled space
        if (piece.color === 'w') {
          whiteSpace += rank; // Higher rank = more space
        } else {
          blackSpace += (7 - rank);
        }
      }
    }
  }
  
  return (whiteSpace - blackSpace) * 3;
}

function evaluateThreats(chess: Chess): number {
  let score = 0;
  
  // Check if there's a check
  if (chess.inCheck()) {
    score += chess.turn() === 'w' ? -30 : 30; // Being in check is bad
  }
  
  return score;
}

// ===================== ADVANCED TACTICAL PATTERNS =====================

export interface AdvancedTactic {
  type: TacticType;
  moveNumber: number;
  notation: string;
  attacker: { piece: PieceSymbol; from: Square; to: Square };
  targets: { piece: PieceSymbol; square: Square }[];
  description: string;
  value: number; // Material value involved
  subtlety: 'obvious' | 'subtle' | 'deep'; // How hard to spot
}

export type TacticType = 
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered_attack'
  | 'discovered_check'
  | 'double_check'
  | 'back_rank_threat'
  | 'deflection'
  | 'decoy'
  | 'x_ray'
  | 'interference'
  | 'removing_defender'
  | 'overloading'
  | 'zugzwang'
  | 'desperado'
  | 'zwischenzug'
  | 'clearance'
  | 'check'
  | 'checkmate'
  | 'stalemate_threat';

export const TACTIC_DESCRIPTIONS: Record<TacticType, { name: string; description: string; value: number }> = {
  fork: { 
    name: 'Fork', 
    description: 'One piece attacks two or more pieces simultaneously', 
    value: 5 
  },
  pin: { 
    name: 'Pin', 
    description: 'A piece cannot move without exposing a more valuable piece behind it', 
    value: 4 
  },
  skewer: { 
    name: 'Skewer', 
    description: 'A more valuable piece is attacked and must move, exposing a less valuable piece', 
    value: 4 
  },
  discovered_attack: { 
    name: 'Discovered Attack', 
    description: 'Moving a piece reveals an attack from another piece', 
    value: 5 
  },
  discovered_check: { 
    name: 'Discovered Check', 
    description: 'Moving a piece reveals a check from another piece', 
    value: 6 
  },
  double_check: { 
    name: 'Double Check', 
    description: 'King is attacked by two pieces simultaneously - only king move can escape', 
    value: 8 
  },
  back_rank_threat: { 
    name: 'Back Rank Threat', 
    description: 'Threatening checkmate on the back rank', 
    value: 6 
  },
  deflection: { 
    name: 'Deflection', 
    description: 'Forcing a defender away from protecting a key piece or square', 
    value: 5 
  },
  decoy: { 
    name: 'Decoy', 
    description: 'Luring a piece to a vulnerable square', 
    value: 5 
  },
  x_ray: { 
    name: 'X-Ray', 
    description: 'A piece attacks through another piece of the same type', 
    value: 3 
  },
  interference: { 
    name: 'Interference', 
    description: 'Placing a piece between an enemy piece and the square it defends', 
    value: 4 
  },
  removing_defender: { 
    name: 'Removing the Defender', 
    description: 'Eliminating a piece that defends a target', 
    value: 5 
  },
  overloading: { 
    name: 'Overloading', 
    description: 'A piece has too many defensive duties to handle', 
    value: 4 
  },
  zugzwang: { 
    name: 'Zugzwang', 
    description: 'Any move worsens the position - the obligation to move is a disadvantage', 
    value: 7 
  },
  desperado: { 
    name: 'Desperado', 
    description: 'A piece that is lost anyway captures maximum material before being taken', 
    value: 3 
  },
  zwischenzug: { 
    name: 'Zwischenzug', 
    description: 'An "in-between move" - an unexpected move before the expected recapture', 
    value: 6 
  },
  clearance: { 
    name: 'Clearance', 
    description: 'Moving a piece to clear a line or square for another piece', 
    value: 3 
  },
  check: { 
    name: 'Check', 
    description: 'The king is under direct attack', 
    value: 2 
  },
  checkmate: { 
    name: 'Checkmate', 
    description: 'The king is in check and cannot escape - game over', 
    value: 100 
  },
  stalemate_threat: { 
    name: 'Stalemate Threat', 
    description: 'Threatening to force a draw by stalemate', 
    value: 4 
  },
};

// ===================== ENHANCED MOVE CLASSIFICATION =====================

export interface EnhancedMoveQuality {
  quality: MoveQualityType;
  symbol: string;
  color: string;
  label: string;
  accuracy: number;           // 0-100 accuracy of the move
  cpLoss: number;             // Centipawn loss from this move
  winProbabilityLoss: number; // Win probability lost
  isTheoretical: boolean;     // Is this a known book move
  isCritical: boolean;        // Is this a critical moment
  tacticsMissed: TacticType[];// Tactics that were available but not played
  tacticsExecuted: TacticType[];// Tactics that were executed
}

export type MoveQualityType = 
  | 'brilliant'    // !! - Sacrifice or only move that dramatically improves position
  | 'great'        // !  - Strong move, significantly better than alternatives
  | 'best'         // ✓  - Engine's top choice
  | 'excellent'    // ⊛  - Very close to best, essentially equal
  | 'good'         // ○  - Solid, maintains equality or advantage
  | 'book'         // 📖 - Opening theory
  | 'inaccuracy'   // ?! - Small mistake, loses some advantage (10-50 cp)
  | 'mistake'      // ?  - Clear error, significant loss (50-200 cp)
  | 'blunder'      // ?? - Severe error, game-losing (200+ cp)
  | 'miss'         // ⊘  - Missed a winning tactic
  | 'forced';      // ⊡  - Only legal move

export const MOVE_QUALITY_THRESHOLDS = {
  // Centipawn loss thresholds (similar to chess.com)
  brilliant: { maxCpLoss: -50, minTacticalValue: 300 }, // Gained value through sacrifice
  great: { maxCpLoss: 0, minTacticalValue: 100 },
  best: { maxCpLoss: 5 },
  excellent: { maxCpLoss: 15 },
  good: { maxCpLoss: 30 },
  inaccuracy: { maxCpLoss: 75 },
  mistake: { maxCpLoss: 200 },
  blunder: { maxCpLoss: Infinity },
};

export const ENHANCED_QUALITY_INFO: Record<MoveQualityType, { symbol: string; color: string; label: string }> = {
  brilliant: { symbol: '!!', color: '#26C9A2', label: 'Brilliant' },
  great: { symbol: '!', color: '#81B64C', label: 'Great' },
  best: { symbol: '✓', color: '#96BC4B', label: 'Best' },
  excellent: { symbol: '⊛', color: '#A8D08D', label: 'Excellent' },
  good: { symbol: '○', color: '#A3A3A3', label: 'Good' },
  book: { symbol: '📖', color: '#769656', label: 'Book Move' },
  inaccuracy: { symbol: '?!', color: '#F7C631', label: 'Inaccuracy' },
  mistake: { symbol: '?', color: '#E58F2A', label: 'Mistake' },
  blunder: { symbol: '??', color: '#CA3431', label: 'Blunder' },
  miss: { symbol: '⊘', color: '#E63946', label: 'Missed Win' },
  forced: { symbol: '⊡', color: '#9CA3AF', label: 'Forced' },
};

// ===================== COMPREHENSIVE GAME SCORE =====================

export interface GameScore {
  whiteAccuracy: number;
  blackAccuracy: number;
  overallAccuracy: number;
  whiteCpLoss: number;
  blackCpLoss: number;
  brilliantMoves: { white: number; black: number };
  greatMoves: { white: number; black: number };
  blunders: { white: number; black: number };
  mistakes: { white: number; black: number };
  inaccuracies: { white: number; black: number };
  tacticsExecuted: { white: number; black: number };
  tacticsMissed: { white: number; black: number };
  complexity: number; // 0-100 game complexity score
  sharpness: number;  // 0-100 tactical sharpness
  rating: {
    estimated: { white: number; black: number };
    category: 'beginner' | 'intermediate' | 'advanced' | 'master' | 'grandmaster';
  };
}

/**
 * Calculate comprehensive game score from move analysis
 */
export function calculateGameScore(
  moves: EnhancedMoveQuality[], 
  totalMoves: number
): GameScore {
  const whiteMoves = moves.filter((_, i) => i % 2 === 0);
  const blackMoves = moves.filter((_, i) => i % 2 === 1);
  
  const calcAvg = (arr: EnhancedMoveQuality[], key: keyof EnhancedMoveQuality) => 
    arr.length ? arr.reduce((sum, m) => sum + (m[key] as number), 0) / arr.length : 0;
  
  const countQuality = (arr: EnhancedMoveQuality[], quality: MoveQualityType) =>
    arr.filter(m => m.quality === quality).length;
  
  const whiteAccuracy = calcAvg(whiteMoves, 'accuracy');
  const blackAccuracy = calcAvg(blackMoves, 'accuracy');
  
  const whiteCpLoss = whiteMoves.reduce((sum, m) => sum + Math.max(0, m.cpLoss), 0);
  const blackCpLoss = blackMoves.reduce((sum, m) => sum + Math.max(0, m.cpLoss), 0);
  
  // Estimate rating based on accuracy (simplified formula)
  const estimateRating = (accuracy: number) => {
    if (accuracy >= 98) return 2700;
    if (accuracy >= 95) return 2400;
    if (accuracy >= 90) return 2100;
    if (accuracy >= 85) return 1800;
    if (accuracy >= 80) return 1500;
    if (accuracy >= 70) return 1200;
    return 900;
  };
  
  const whiteRating = estimateRating(whiteAccuracy);
  const blackRating = estimateRating(blackAccuracy);
  const avgRating = (whiteRating + blackRating) / 2;
  
  let category: GameScore['rating']['category'] = 'beginner';
  if (avgRating >= 2500) category = 'grandmaster';
  else if (avgRating >= 2200) category = 'master';
  else if (avgRating >= 1800) category = 'advanced';
  else if (avgRating >= 1400) category = 'intermediate';
  
  // Calculate complexity based on tactical density
  const tacticsTotal = moves.reduce((sum, m) => sum + m.tacticsExecuted.length, 0);
  const complexity = Math.min(100, (tacticsTotal / totalMoves) * 200);
  
  // Calculate sharpness based on critical moments
  const criticalMoments = moves.filter(m => m.isCritical).length;
  const sharpness = Math.min(100, (criticalMoments / totalMoves) * 150);
  
  return {
    whiteAccuracy: Math.round(whiteAccuracy * 10) / 10,
    blackAccuracy: Math.round(blackAccuracy * 10) / 10,
    overallAccuracy: Math.round((whiteAccuracy + blackAccuracy) / 2 * 10) / 10,
    whiteCpLoss,
    blackCpLoss,
    brilliantMoves: {
      white: countQuality(whiteMoves, 'brilliant'),
      black: countQuality(blackMoves, 'brilliant'),
    },
    greatMoves: {
      white: countQuality(whiteMoves, 'great'),
      black: countQuality(blackMoves, 'great'),
    },
    blunders: {
      white: countQuality(whiteMoves, 'blunder'),
      black: countQuality(blackMoves, 'blunder'),
    },
    mistakes: {
      white: countQuality(whiteMoves, 'mistake'),
      black: countQuality(blackMoves, 'mistake'),
    },
    inaccuracies: {
      white: countQuality(whiteMoves, 'inaccuracy'),
      black: countQuality(blackMoves, 'inaccuracy'),
    },
    tacticsExecuted: {
      white: whiteMoves.reduce((sum, m) => sum + m.tacticsExecuted.length, 0),
      black: blackMoves.reduce((sum, m) => sum + m.tacticsExecuted.length, 0),
    },
    tacticsMissed: {
      white: whiteMoves.reduce((sum, m) => sum + m.tacticsMissed.length, 0),
      black: blackMoves.reduce((sum, m) => sum + m.tacticsMissed.length, 0),
    },
    complexity: Math.round(complexity),
    sharpness: Math.round(sharpness),
    rating: {
      estimated: { white: whiteRating, black: blackRating },
      category,
    },
  };
}
