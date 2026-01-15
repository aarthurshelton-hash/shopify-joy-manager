import { Chess, Square } from 'chess.js';
import { SquareData, SquareVisit } from './gameSimulator';
import { PieceType, PieceColor, getPieceColor } from './pieceColors';

/**
 * FEN Utilities for En Pensent
 * 
 * FEN (Forsyth-Edwards Notation) describes a single chess position.
 * This module provides utilities for:
 * - Validating FEN strings
 * - Converting FEN to visualization board data
 * - Exporting current position to FEN
 * - Position-based puzzle mode support
 */

export interface FenValidationResult {
  isValid: boolean;
  error?: string;
  fen?: string;
  pieceCount?: number;
  sideToMove?: 'w' | 'b';
  fullMoveNumber?: number;
}

export interface PositionData {
  board: SquareData[][];
  fen: string;
  sideToMove: 'w' | 'b';
  canCastleKingsideWhite: boolean;
  canCastleQueensideWhite: boolean;
  canCastleKingsideBlack: boolean;
  canCastleQueensideBlack: boolean;
  enPassantSquare: string | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  pieceCount: number;
}

// Standard starting position FEN
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Common puzzle/example FENs
export const EXAMPLE_FENS = [
  {
    name: 'Starting Position',
    fen: STARTING_FEN,
    description: 'The initial setup of a chess game',
  },
  {
    name: 'Fool\'s Mate',
    fen: 'rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    description: 'Checkmate in 2 moves - the shortest possible game',
  },
  {
    name: 'Scholar\'s Mate',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    description: 'The famous 4-move checkmate',
  },
  {
    name: 'Endgame Study - King & Rook',
    fen: '8/8/8/8/8/4K3/R7/4k3 w - - 0 1',
    description: 'White to move and checkmate',
  },
  {
    name: 'Queen Sacrifice Position',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    description: 'White threatens Qxf7#',
  },
  {
    name: 'Complex Middlegame',
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 4 7',
    description: 'Italian Game structure',
  },
  {
    name: 'Endgame - Lucena Position',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    description: 'Famous rook endgame winning technique',
  },
  {
    name: 'Zugzwang Example',
    fen: '8/8/p1p5/1p5p/1P5p/8/PPP2K1k/8 w - - 0 1',
    description: 'Whoever moves loses!',
  },
];

/**
 * Validate a FEN string
 */
export function validateFen(fen: string): FenValidationResult {
  if (!fen || !fen.trim()) {
    return { isValid: false, error: 'FEN string is empty' };
  }

  const trimmedFen = fen.trim();

  try {
    const chess = new Chess();
    chess.load(trimmedFen);
    
    // Count pieces
    let pieceCount = 0;
    for (const char of trimmedFen.split(' ')[0]) {
      if (/[pnbrqkPNBRQK]/.test(char)) {
        pieceCount++;
      }
    }

    // Parse FEN parts
    const parts = trimmedFen.split(' ');
    const sideToMove = parts[1] as 'w' | 'b' || 'w';
    const fullMoveNumber = parseInt(parts[5]) || 1;

    return {
      isValid: true,
      fen: trimmedFen,
      pieceCount,
      sideToMove,
      fullMoveNumber,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid FEN format',
    };
  }
}

/**
 * Parse FEN to a 2D array of pieces (for piece display)
 */
export function fenToPieceBoard(fen: string): (string | null)[][] {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const squares: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) squares.push(null);
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
}

/**
 * Convert a FEN position to SquareData[][] for visualization
 * Each piece's current square becomes a "visit"
 */
export function fenToVisualizationBoard(fen: string): SquareData[][] {
  const validation = validateFen(fen);
  if (!validation.isValid) {
    // Return empty board on invalid FEN
    return createEmptyBoard();
  }

  const pieceBoard = fenToPieceBoard(fen);
  const board: SquareData[][] = [];

  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      const isLight = (file + rank) % 2 === 1;
      const visits: SquareVisit[] = [];

      // Get piece at this position (FEN is from rank 8 to 1, so invert)
      const piece = pieceBoard[7 - rank]?.[file];
      
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        const pieceType = piece.toLowerCase() as PieceType;
        const pieceColor: PieceColor = isWhite ? 'w' : 'b';
        const hexColor = getPieceColor(pieceType, pieceColor);

        visits.push({
          piece: pieceType,
          color: pieceColor,
          moveNumber: 1,
          hexColor,
        });
      }

      board[rank][file] = {
        file,
        rank,
        visits,
        isLight,
      };
    }
  }

  return board;
}

/**
 * Create an empty visualization board
 */
export function createEmptyBoard(): SquareData[][] {
  const board: SquareData[][] = [];
  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      const isLight = (file + rank) % 2 === 1;
      board[rank][file] = {
        file,
        rank,
        visits: [],
        isLight,
      };
    }
  }
  return board;
}

/**
 * Extract the FEN at a specific move number from a PGN
 */
export function getFenAtMove(pgn: string, moveNumber: number): string | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    // Reset and replay up to the specified move
    chess.reset();
    
    const targetMoves = Math.min(moveNumber, history.length);
    for (let i = 0; i < targetMoves; i++) {
      chess.move(history[i].san);
    }
    
    return chess.fen();
  } catch {
    return null;
  }
}

/**
 * Get the FEN at the current board position
 * This is used for exporting/sharing a specific position
 */
export function getBoardPositionFen(
  pgn: string | undefined,
  moveNumber: number
): string {
  if (!pgn) {
    return STARTING_FEN;
  }

  const fen = getFenAtMove(pgn, moveNumber);
  return fen || STARTING_FEN;
}

/**
 * Parse full FEN to get detailed position data
 */
export function parseFenDetails(fen: string): PositionData | null {
  const validation = validateFen(fen);
  if (!validation.isValid) {
    return null;
  }

  const parts = fen.split(' ');
  
  // Count pieces
  let pieceCount = 0;
  for (const char of parts[0]) {
    if (/[pnbrqkPNBRQK]/.test(char)) {
      pieceCount++;
    }
  }

  const castling = parts[2] || '-';

  return {
    board: fenToVisualizationBoard(fen),
    fen,
    sideToMove: (parts[1] || 'w') as 'w' | 'b',
    canCastleKingsideWhite: castling.includes('K'),
    canCastleQueensideWhite: castling.includes('Q'),
    canCastleKingsideBlack: castling.includes('k'),
    canCastleQueensideBlack: castling.includes('q'),
    enPassantSquare: parts[3] !== '-' ? parts[3] : null,
    halfMoveClock: parseInt(parts[4]) || 0,
    fullMoveNumber: parseInt(parts[5]) || 1,
    pieceCount,
  };
}

/**
 * Generate a minimal FEN (just piece placement, for display)
 */
export function getMinimalFen(fen: string): string {
  return fen.split(' ')[0];
}

/**
 * Check if a FEN represents the starting position
 */
export function isStartingPosition(fen: string): boolean {
  const minimal = getMinimalFen(fen);
  const startingMinimal = getMinimalFen(STARTING_FEN);
  return minimal === startingMinimal;
}

/**
 * Create a shareable FEN URL
 */
export function createFenShareUrl(fen: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  const encodedFen = encodeURIComponent(fen);
  return `${base}/position?fen=${encodedFen}`;
}

/**
 * Parse FEN from URL parameter
 */
export function parseFenFromUrl(searchParams: URLSearchParams): string | null {
  const fen = searchParams.get('fen');
  if (fen) {
    const decoded = decodeURIComponent(fen);
    const validation = validateFen(decoded);
    if (validation.isValid) {
      return decoded;
    }
  }
  return null;
}

/**
 * Get a descriptive name for a position
 */
export function getPositionDescription(fen: string): string {
  if (isStartingPosition(fen)) {
    return 'Starting Position';
  }

  const details = parseFenDetails(fen);
  if (!details) {
    return 'Invalid Position';
  }

  const toMove = details.sideToMove === 'w' ? 'White' : 'Black';
  const moveNum = details.fullMoveNumber;

  return `${toMove} to move (Move ${moveNum})`;
}
