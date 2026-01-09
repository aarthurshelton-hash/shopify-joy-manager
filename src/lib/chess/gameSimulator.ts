import { Chess, Square } from 'chess.js';
import { PieceType, PieceColor, getPieceColor } from './pieceColors';

export interface SquareVisit {
  piece: PieceType;
  color: PieceColor;
  moveNumber: number;
  hexColor: string;
}

export interface SquareData {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
  visits: SquareVisit[];
  isLight: boolean;
}

export interface GameData {
  white: string;
  black: string;
  event: string;
  date: string;
  result: string;
  pgn: string;
  moves: string[];
}

export interface SimulationResult {
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
}

// Parse PGN and extract game metadata
function parseGameData(pgn: string): Partial<GameData> {
  const headers: Partial<GameData> = {};
  
  const whiteMatch = pgn.match(/\[White\s+"([^"]+)"\]/);
  const blackMatch = pgn.match(/\[Black\s+"([^"]+)"\]/);
  const eventMatch = pgn.match(/\[Event\s+"([^"]+)"\]/);
  const dateMatch = pgn.match(/\[Date\s+"([^"]+)"\]/);
  const resultMatch = pgn.match(/\[Result\s+"([^"]+)"\]/);
  
  if (whiteMatch) headers.white = whiteMatch[1];
  if (blackMatch) headers.black = blackMatch[1];
  if (eventMatch) headers.event = eventMatch[1];
  if (dateMatch) headers.date = dateMatch[1];
  if (resultMatch) headers.result = resultMatch[1];
  
  return headers;
}

// Convert algebraic notation to file/rank indices
function squareToIndices(square: Square): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

// Get all squares a piece passes through during a move
function getPathSquares(from: Square, to: Square, pieceType: string): Square[] {
  const squares: Square[] = [];
  const fromIndices = squareToIndices(from);
  const toIndices = squareToIndices(to);
  
  const fileDir = Math.sign(toIndices.file - fromIndices.file);
  const rankDir = Math.sign(toIndices.rank - fromIndices.rank);
  
  // Knights jump, don't pass through squares
  if (pieceType.toLowerCase() === 'n') {
    squares.push(to);
    return squares;
  }
  
  // For sliding pieces (rook, bishop, queen) and king, trace the path
  let currentFile = fromIndices.file + fileDir;
  let currentRank = fromIndices.rank + rankDir;
  
  while (currentFile !== toIndices.file || currentRank !== toIndices.rank) {
    const file = String.fromCharCode('a'.charCodeAt(0) + currentFile);
    const rank = (currentRank + 1).toString();
    squares.push((file + rank) as Square);
    currentFile += fileDir;
    currentRank += rankDir;
  }
  
  // Always include destination
  squares.push(to);
  
  return squares;
}

// Simulate the entire game and track piece visits to each square
export function simulateGame(pgn: string): SimulationResult {
  const chess = new Chess();
  
  // Initialize the board data structure
  const board: SquareData[][] = [];
  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      const isLight = (rank + file) % 2 === 1;
      board[rank][file] = {
        file,
        rank,
        visits: [],
        isLight,
      };
    }
  }
  
  // Try to load the PGN
  try {
    chess.loadPgn(pgn);
  } catch (e) {
    console.error('Failed to load PGN:', e);
    // Return empty board if PGN is invalid
    return {
      board,
      gameData: {
        white: 'Unknown',
        black: 'Unknown',
        event: 'Unknown',
        date: 'Unknown',
        result: '*',
        pgn: pgn,
        moves: [],
      },
      totalMoves: 0,
    };
  }
  
  // Get the move history
  const history = chess.history({ verbose: true });
  
  // Reset and replay the game to track movements
  chess.reset();
  
  let moveNumber = 0;
  const moveNotations: string[] = [];
  
  for (const move of history) {
    moveNumber++;
    moveNotations.push(move.san);
    
    const pieceType = move.piece as PieceType;
    const pieceColor = move.color as PieceColor;
    const hexColor = getPieceColor(pieceType, pieceColor);
    
    // Get all squares the piece passes through
    const pathSquares = getPathSquares(move.from, move.to, move.piece);
    
    // Record the visit for each square in the path
    for (const square of pathSquares) {
      const { file, rank } = squareToIndices(square);
      board[rank][file].visits.push({
        piece: pieceType,
        color: pieceColor,
        moveNumber,
        hexColor,
      });
    }
    
    // Make the move on our tracking board
    chess.move(move.san);
  }
  
  // Parse game metadata
  const gameHeaders = parseGameData(pgn);
  
  return {
    board,
    gameData: {
      white: gameHeaders.white || 'Unknown',
      black: gameHeaders.black || 'Unknown',
      event: gameHeaders.event || 'Unknown',
      date: gameHeaders.date || 'Unknown',
      result: gameHeaders.result || '*',
      pgn: pgn,
      moves: moveNotations,
    },
    totalMoves: moveNumber,
  };
}

// Format the moves for display (with move numbers)
export function formatMoves(moves: string[]): string {
  let formatted = '';
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      formatted += `${Math.floor(i / 2) + 1}. `;
    }
    formatted += moves[i] + ' ';
  }
  return formatted.trim();
}
