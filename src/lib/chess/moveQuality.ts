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
  
  // Sacrifice that leads to check is brilliant
  if (isSacrifice && isCheck) {
    return 'brilliant';
  }
  
  // Pure sacrifice (giving up material for position) - mark as great
  // This indicates tactical awareness even without engine confirmation
  if (isSacrifice && !isCheck && materialChange < -100) {
    return 'great';
  }
  
  // === BLUNDER / MISTAKE / INACCURACY Detection ===
  // Major blunder: hanging major pieces or losing queen
  if (materialChange < -500) {
    return 'blunder';
  }
  
  // Mistake: lost a minor piece or equivalent
  if (materialChange < -200) {
    return 'mistake';
  }
  
  // Inaccuracy: small material loss (a pawn or less)
  if (materialChange < -50) {
    return 'inaccuracy';
  }
  
  // === BOOK MOVES ===
  // Standard opening theory moves in first 10 moves
  if (isOpening && isStandardOpeningMove(move, moveNumber)) {
    return 'book';
  }
  
  // === BRILLIANT / GREAT / BEST / GOOD Detection ===
  
  // Winning a queen or major material is brilliant
  if (materialChange >= 800) {
    return 'brilliant';
  }
  
  // Winning significant material (rook value or more) is great
  if (materialChange >= 450) {
    return 'great';
  }
  
  // Winning a minor piece is a "best" move (likely optimal in position)
  if (materialChange >= 250) {
    return 'best';
  }
  
  // Winning material worth 1-2 pawns is "good"
  if (materialChange >= 80) {
    return 'good';
  }
  
  // Check that wins material is great
  if (isCheck && materialChange > 0) {
    return 'great';
  }
  
  // Check without losing material is good
  if (isCheck && materialChange >= 0) {
    return 'good';
  }
  
  // Castle in opening/early middlegame is good (king safety)
  if ((move.flags.includes('k') || move.flags.includes('q')) && moveNumber <= 20) {
    return 'good';
  }
  
  // Capture that trades equally or slightly favorably is "best"
  if (isCapture && materialChange >= 0 && materialChange < 80) {
    return 'best';
  }
  
  // Central pawn moves in opening are often best
  if (isOpening && !isCapture && (move.san === 'e4' || move.san === 'd4' || move.san === 'e5' || move.san === 'd5')) {
    return 'best';
  }
  
  // Knight development to good squares is best in opening
  if (isOpening && move.piece === 'n' && ['c3', 'f3', 'c6', 'f6'].includes(move.to)) {
    return 'best';
  }
  
  // Neutral moves without clear improvement - classify as good by default
  // (Without engine analysis, we can't distinguish "best" from "good" perfectly)
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
  // Tactical event counts
  checkCount: number;
  checkmateCount: number;
  captureCount: number;
  castleCount: number;
  promotionCount: number;
  sacrificeCount: number;
  accuracy: number; // Overall accuracy percentage
  whiteAccuracy: number; // White's accuracy percentage
  blackAccuracy: number; // Black's accuracy percentage
  whiteMoves: ClassifiedMove[];
  blackMoves: ClassifiedMove[];
}

// Helper function to calculate accuracy from moves array
function calculateAccuracyFromMoves(moves: ClassifiedMove[]): number {
  if (moves.length === 0) return 100;
  
  let score = 0;
  for (const move of moves) {
    switch (move.quality) {
      case 'brilliant': score += 100; break;
      case 'great': score += 95; break;
      case 'best': score += 90; break;
      case 'good': score += 75; break;
      case 'book': score += 85; break;
      case 'inaccuracy': score += 50; break;
      case 'mistake': score += 25; break;
      case 'blunder': score += 0; break;
    }
  }
  
  return Math.round((score / (moves.length * 100)) * 100);
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
    checkCount: 0,
    checkmateCount: 0,
    captureCount: 0,
    castleCount: 0,
    promotionCount: 0,
    sacrificeCount: 0,
    accuracy: 0,
    whiteAccuracy: 0,
    blackAccuracy: 0,
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
    
    // Count tactical events
    if (move.isCheckmate) summary.checkmateCount++;
    else if (move.isCheck) summary.checkCount++; // Only count non-checkmate checks
    if (move.isCapture) summary.captureCount++;
    if (move.isCastle) summary.castleCount++;
    if (move.isPromotion) summary.promotionCount++;
    if (move.isSacrifice) summary.sacrificeCount++;
    
    if (move.color === 'w') {
      summary.whiteMoves.push(move);
    } else {
      summary.blackMoves.push(move);
    }
  }
  
  // Calculate overall accuracy using weighted scoring (chess.com-like formula)
  summary.accuracy = calculateAccuracyFromMoves(classifiedMoves);
  
  // Calculate per-player accuracy
  summary.whiteAccuracy = calculateAccuracyFromMoves(summary.whiteMoves);
  summary.blackAccuracy = calculateAccuracyFromMoves(summary.blackMoves);
  
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
