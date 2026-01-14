/**
 * Move Quality Analysis System
 * 
 * Based on chess.com's natural pointage and move classification system.
 * Classifies moves as: Brilliant, Great, Best, Good, Book, Inaccuracy, Mistake, Blunder
 * 
 * Also includes standard piece values used in chess evaluation.
 */

import { Chess, Move, Square, PieceSymbol } from 'chess.js';

// ===================== PIECE VALUES =====================

/**
 * Standard chess piece values (centipawn = 100 = 1 pawn)
 * Used by most chess engines and platforms
 */
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,   // Pawn
  n: 320,   // Knight (slightly more than 3 pawns due to mobility)
  b: 330,   // Bishop (slightly more than knight due to long-range)
  r: 500,   // Rook
  q: 900,   // Queen
  k: 20000, // King (effectively infinite in game terms)
};

/**
 * Simplified piece values for quick calculations
 */
export const PIECE_POINTS: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0, // King has no exchange value
};

// ===================== MOVE QUALITY TYPES =====================

export type MoveQuality = 
  | 'brilliant'   // !! - Exceptional move, often a sacrifice that's not obvious
  | 'great'       // !  - Strong move that significantly improves position
  | 'best'        // ✓  - The objectively best move in the position
  | 'good'        // ○  - A solid move that doesn't hurt the position
  | 'book'        // 📖 - Opening theory move
  | 'inaccuracy'  // ?! - Slightly imprecise, small loss of advantage
  | 'mistake'     // ?  - A clear error that loses material or advantage
  | 'blunder';    // ?? - A severe error, often game-losing

export interface MoveQualityInfo {
  quality: MoveQuality;
  symbol: string;
  color: string;
  label: string;
  description: string;
}

export const MOVE_QUALITY_INFO: Record<MoveQuality, MoveQualityInfo> = {
  brilliant: {
    quality: 'brilliant',
    symbol: '!!',
    color: '#26C9A2', // Cyan/teal
    label: 'Brilliant',
    description: 'An exceptional, often sacrificial move that dramatically improves the position',
  },
  great: {
    quality: 'great',
    symbol: '!',
    color: '#81B64C', // Green
    label: 'Great',
    description: 'A strong move that significantly improves the position',
  },
  best: {
    quality: 'best',
    symbol: '✓',
    color: '#96BC4B', // Light green
    label: 'Best',
    description: 'The objectively best move available in this position',
  },
  good: {
    quality: 'good',
    symbol: '○',
    color: '#A3A3A3', // Gray
    label: 'Good',
    description: 'A solid move that maintains the position',
  },
  book: {
    quality: 'book',
    symbol: '📖',
    color: '#769656', // Book green
    label: 'Book Move',
    description: 'A standard opening theory move',
  },
  inaccuracy: {
    quality: 'inaccuracy',
    symbol: '?!',
    color: '#F7C631', // Yellow
    label: 'Inaccuracy',
    description: 'Slightly imprecise move that gives up some advantage',
  },
  mistake: {
    quality: 'mistake',
    symbol: '?',
    color: '#E58F2A', // Orange
    label: 'Mistake',
    description: 'A clear error that loses material or significant advantage',
  },
  blunder: {
    quality: 'blunder',
    symbol: '??',
    color: '#CA3431', // Red
    label: 'Blunder',
    description: 'A severe error that often loses the game',
  },
};

// ===================== MOVE CLASSIFICATION =====================

export interface ClassifiedMove {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  uci: string;
  quality: MoveQuality;
  info: MoveQualityInfo;
  materialChange: number;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastle: boolean;
  isPromotion: boolean;
  isSacrifice: boolean;
}

/**
 * Analyze a game and classify each move's quality
 * 
 * Note: Without a chess engine, we use heuristic analysis based on:
 * - Material changes
 * - Tactical patterns (checks, checkmates, captures)
 * - Opening theory recognition
 * - Sacrifice detection
 */
export function classifyMoves(pgn: string): ClassifiedMove[] {
  const chess = new Chess();
  const classifiedMoves: ClassifiedMove[] = [];
  
  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    // Reset to analyze move by move
    chess.reset();
    
    let previousMaterialBalance = 0;
    
    history.forEach((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const color = move.color;
      
      // Execute the move
      chess.move(move.san);
      
      // Calculate material balance after move
      const currentMaterialBalance = calculateMaterialBalance(chess);
      const materialChange = color === 'w' 
        ? currentMaterialBalance - previousMaterialBalance
        : previousMaterialBalance - currentMaterialBalance;
      
      // Detect move characteristics
      const isCapture = move.flags.includes('c') || move.flags.includes('e');
      const isCheck = move.san.includes('+');
      const isCheckmate = move.san.includes('#');
      const isCastle = move.flags.includes('k') || move.flags.includes('q');
      const isPromotion = !!move.promotion;
      const isSacrifice = detectSacrifice(move, chess, materialChange);
      
      // Classify the move quality
      const quality = classifySingleMove({
        move,
        chess,
        moveNumber,
        isCapture,
        isCheck,
        isCheckmate,
        isSacrifice,
        materialChange,
        isOpening: moveNumber <= 10,
      });
      
      classifiedMoves.push({
        moveNumber,
        color,
        san: move.san,
        uci: move.from + move.to + (move.promotion || ''),
        quality,
        info: MOVE_QUALITY_INFO[quality],
        materialChange,
        isCapture,
        isCheck,
        isCheckmate,
        isCastle,
        isPromotion,
        isSacrifice,
      });
      
      previousMaterialBalance = currentMaterialBalance;
    });
  } catch (e) {
    console.error('Error classifying moves:', e);
  }
  
  return classifiedMoves;
}

interface ClassifyMoveParams {
  move: Move;
  chess: Chess;
  moveNumber: number;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isSacrifice: boolean;
  materialChange: number;
  isOpening: boolean;
}

function classifySingleMove(params: ClassifyMoveParams): MoveQuality {
  const { move, chess, moveNumber, isCapture, isCheck, isCheckmate, isSacrifice, materialChange, isOpening } = params;
  
  // Checkmate is always brilliant
  if (isCheckmate) {
    return 'brilliant';
  }
  
  // Sacrifice that leads to check or strong position is brilliant
  if (isSacrifice && isCheck) {
    return 'brilliant';
  }
  
  // Pure sacrifice (giving up material) - could be brilliant or blunder
  if (isSacrifice && !isCheck) {
    // If we can detect it leads to forced checkmate, it's brilliant
    // Without an engine, we'll mark sacrifices as "great" if they're followed by check
    return 'great';
  }
  
  // Major blunder detection: hanging pieces, losing queen, etc.
  if (materialChange < -500) { // Lost more than 5 pawns worth
    return 'blunder';
  }
  
  if (materialChange < -200) { // Lost 2+ pawns worth
    return 'mistake';
  }
  
  if (materialChange < -50) { // Small material loss
    return 'inaccuracy';
  }
  
  // Opening book moves (first 10 moves with standard patterns)
  if (isOpening && isStandardOpeningMove(move, moveNumber)) {
    return 'book';
  }
  
  // Winning material is good/great
  if (materialChange > 300) {
    return 'great';
  }
  
  if (materialChange > 100) {
    return 'good';
  }
  
  // Check without material loss is good
  if (isCheck) {
    return 'good';
  }
  
  // Castle in opening is good
  if ((move.flags.includes('k') || move.flags.includes('q')) && moveNumber <= 15) {
    return 'good';
  }
  
  // Default to "good" for neutral moves
  return 'good';
}

/**
 * Calculate total material balance on the board (positive = white advantage)
 */
function calculateMaterialBalance(chess: Chess): number {
  let balance = 0;
  const files = 'abcdefgh';
  const ranks = '12345678';
  
  for (const file of files) {
    for (const rank of ranks) {
      const square = (file + rank) as Square;
      const piece = chess.get(square);
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        balance += piece.color === 'w' ? value : -value;
      }
    }
  }
  
  return balance;
}

/**
 * Detect if a move is a sacrifice (giving up material for positional/tactical gain)
 */
function detectSacrifice(move: Move, chess: Chess, materialChange: number): boolean {
  // A sacrifice typically involves:
  // 1. Giving up higher-value piece for lower-value piece
  // 2. Or leaving a piece hanging
  
  if (!move.captured) return false;
  
  const attackerValue = PIECE_VALUES[move.piece];
  const capturedValue = PIECE_VALUES[move.captured as PieceSymbol];
  
  // If we captured less than we're worth and didn't immediately gain material
  if (attackerValue > capturedValue + 50 && materialChange < 0) {
    return true;
  }
  
  return false;
}

/**
 * Check if a move matches standard opening theory
 */
function isStandardOpeningMove(move: Move, moveNumber: number): boolean {
  const standardMoves: Record<number, string[]> = {
    1: ['e4', 'd4', 'Nf3', 'c4', 'g3', 'e5', 'd5', 'Nf6', 'c5', 'c6', 'e6'],
    2: ['e4', 'd4', 'Nf3', 'c4', 'Nc3', 'Bc4', 'Bb5', 'e5', 'd5', 'Nf6', 'Nc6', 'e6'],
    3: ['Bc4', 'Bb5', 'Nf3', 'Nc3', 'd4', 'd3', 'Be2', 'Bc5', 'Bb4', 'Be7', 'Nf6', 'Nc6'],
    4: ['O-O', 'Nf3', 'd4', 'd3', 'c3', 'Nc3', 'O-O', 'Be7', 'Bc5', 'd6', 'a6'],
    5: ['O-O', 'd4', 'c3', 'Re1', 'd3', 'O-O', 'Be7', 'd6', 'O-O-O'],
  };
  
  const movesForNumber = standardMoves[moveNumber];
  if (!movesForNumber) return false;
  
  // Clean move notation for comparison
  const cleanSan = move.san.replace(/[+#!?x]/g, '');
  return movesForNumber.includes(cleanSan);
}

// ===================== SUMMARY STATISTICS =====================

export interface MoveQualitySummary {
  totalMoves: number;
  brilliantCount: number;
  greatCount: number;
  bestCount: number;
  goodCount: number;
  bookCount: number;
  inaccuracyCount: number;
  mistakeCount: number;
  blunderCount: number;
  accuracy: number; // Percentage of good+ moves
  whiteMoves: ClassifiedMove[];
  blackMoves: ClassifiedMove[];
}

export function getMoveQualitySummary(classifiedMoves: ClassifiedMove[]): MoveQualitySummary {
  const summary: MoveQualitySummary = {
    totalMoves: classifiedMoves.length,
    brilliantCount: 0,
    greatCount: 0,
    bestCount: 0,
    goodCount: 0,
    bookCount: 0,
    inaccuracyCount: 0,
    mistakeCount: 0,
    blunderCount: 0,
    accuracy: 0,
    whiteMoves: [],
    blackMoves: [],
  };
  
  for (const move of classifiedMoves) {
    switch (move.quality) {
      case 'brilliant': summary.brilliantCount++; break;
      case 'great': summary.greatCount++; break;
      case 'best': summary.bestCount++; break;
      case 'good': summary.goodCount++; break;
      case 'book': summary.bookCount++; break;
      case 'inaccuracy': summary.inaccuracyCount++; break;
      case 'mistake': summary.mistakeCount++; break;
      case 'blunder': summary.blunderCount++; break;
    }
    
    if (move.color === 'w') {
      summary.whiteMoves.push(move);
    } else {
      summary.blackMoves.push(move);
    }
  }
  
  // Calculate accuracy (percentage of good or better moves)
  const goodMoves = summary.brilliantCount + summary.greatCount + summary.bestCount + summary.goodCount + summary.bookCount;
  summary.accuracy = summary.totalMoves > 0 
    ? Math.round((goodMoves / summary.totalMoves) * 100) 
    : 100;
  
  return summary;
}

// ===================== KEY MOMENTS =====================

export interface KeyMoment {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  type: 'brilliant' | 'blunder' | 'checkmate' | 'check' | 'sacrifice' | 'capture';
  description: string;
  quality: MoveQuality;
}

export function getKeyMoments(classifiedMoves: ClassifiedMove[]): KeyMoment[] {
  const keyMoments: KeyMoment[] = [];
  
  for (const move of classifiedMoves) {
    // Always include checkmates
    if (move.isCheckmate) {
      keyMoments.push({
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        type: 'checkmate',
        description: `${move.color === 'w' ? 'White' : 'Black'} delivers checkmate!`,
        quality: move.quality,
      });
      continue;
    }
    
    // Include brilliant moves
    if (move.quality === 'brilliant') {
      keyMoments.push({
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        type: 'brilliant',
        description: `Brilliant move ${move.san}!`,
        quality: move.quality,
      });
      continue;
    }
    
    // Include blunders
    if (move.quality === 'blunder') {
      keyMoments.push({
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        type: 'blunder',
        description: `Blunder ${move.san} - material lost`,
        quality: move.quality,
      });
      continue;
    }
    
    // Include sacrifices
    if (move.isSacrifice) {
      keyMoments.push({
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        type: 'sacrifice',
        description: `Sacrifice! ${move.san}`,
        quality: move.quality,
      });
    }
  }
  
  return keyMoments;
}
