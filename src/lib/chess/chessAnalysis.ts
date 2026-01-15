/**
 * Deep Chess Analysis System
 * 
 * Detects and categorizes chess patterns including:
 * - Openings (by ECO code and common names)
 * - Gambits (pawn/piece sacrifices for position)
 * - Tactical motifs: Forks, Pins, Skewers, Discoveries
 * - Special moves: En passant, Castling, Pawn promotion
 * - Game phases: Opening, Middlegame, Endgame
 */

import { Chess, Move, Square, PieceSymbol } from 'chess.js';
import { PIECE_VALUES, PIECE_POINTS, ENDGAME_PIECE_VALUES, cpToWinProbability, calculateMoveAccuracy, classifyMoves, getMoveQualitySummary, MoveQualitySummary, ClassifiedMove } from './moveQuality';

// Re-export for convenience
export { PIECE_VALUES, PIECE_POINTS, ENDGAME_PIECE_VALUES, cpToWinProbability, calculateMoveAccuracy };
export type { MoveQualitySummary, ClassifiedMove };

// ===================== TYPES =====================

export interface ChessOpening {
  eco: string;          // ECO code (A00-E99)
  name: string;         // Opening name
  variation?: string;   // Specific variation
  moves: string;        // Standard move sequence
  description: string;  // Brief description
  category: 'open' | 'semi-open' | 'closed' | 'semi-closed' | 'flank' | 'irregular';
}

export interface ChessGambit {
  name: string;
  moves: string;
  sacrificedMaterial: string;
  compensation: string;
  frequency: 'common' | 'rare' | 'legendary';
}

export interface TacticalMotif {
  type: 'fork' | 'pin' | 'skewer' | 'discovery' | 'double_attack' | 'back_rank' | 'smothered_mate' | 'sacrifice' | 'check' | 'checkmate' | 'discovered_check' | 'double_check';
  moveNumber: number;
  notation: string;
  attacker: { piece: PieceSymbol; square: Square };
  targets: { piece: PieceSymbol; square: Square }[];
  description: string;
  value: number; // Material value involved
  isAbsolute?: boolean; // For pins - piece cannot legally move
}

export interface SpecialMove {
  type: 'en_passant' | 'castle_kingside' | 'castle_queenside' | 'promotion' | 'underpromotion';
  moveNumber: number;
  notation: string;
  description: string;
  promotedTo?: PieceSymbol;
}

export interface GamePhase {
  name: 'opening' | 'middlegame' | 'endgame';
  startMove: number;
  endMove: number;
  description: string;
  keyEvents: string[];
}

export interface GameAnalysis {
  opening?: ChessOpening;
  gambit?: ChessGambit;
  tactics: TacticalMotif[];
  specialMoves: SpecialMove[];
  phases: GamePhase[];
  moveQuality?: MoveQualitySummary;
  summary: {
    totalMoves: number;
    captureCount: number;
    checkCount: number;
    brilliantCount: number;
    blunderCount: number;
    accuracy: number; // Percentage of good+ moves
    materialBalance: number; // Positive = white ahead
    longestForcingSequence: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'masterpiece';
  };
}

// ===================== OPENING DATABASE =====================

const OPENINGS_DB: ChessOpening[] = [
  // Italian Game family
  { eco: 'C50', name: 'Italian Game', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', description: 'Classic opening targeting f7', category: 'open' },
  { eco: 'C51', name: 'Evans Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4', description: 'Aggressive pawn sacrifice for rapid development', category: 'open' },
  { eco: 'C53', name: 'Giuoco Piano', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5', description: 'The "quiet game" - solid and strategic', category: 'open' },
  
  // Spanish Game family
  { eco: 'C60', name: 'Ruy Lopez', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', description: 'The most thoroughly analyzed opening', category: 'open' },
  { eco: 'C65', name: 'Berlin Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6', description: 'Solid defense, "the Berlin Wall"', category: 'open' },
  { eco: 'C78', name: 'Morphy Defense', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4', description: 'Main line Ruy Lopez', category: 'open' },
  
  // Sicilian Defense family
  { eco: 'B20', name: 'Sicilian Defense', moves: '1.e4 c5', description: 'Fighting response to 1.e4, asymmetrical play', category: 'semi-open' },
  { eco: 'B33', name: 'Sicilian Sveshnikov', moves: '1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5', description: 'Dynamic with weak d5 but active pieces', category: 'semi-open' },
  { eco: 'B90', name: 'Sicilian Najdorf', moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6', description: 'The most popular Sicilian, flexible and fighting', category: 'semi-open' },
  { eco: 'B23', name: 'Grand Prix Attack', moves: '1.e4 c5 2.Nc3 Nc6 3.f4', description: 'Aggressive anti-Sicilian with f4', category: 'semi-open' },
  { eco: 'B52', name: 'Sicilian Rossolimo', moves: '1.e4 c5 2.Nf3 Nc6 3.Bb5', description: 'Positional anti-Sicilian', category: 'semi-open' },
  
  // French Defense
  { eco: 'C00', name: 'French Defense', moves: '1.e4 e6', description: 'Solid but cramped, counterattacking', category: 'semi-open' },
  { eco: 'C11', name: 'French Classical', moves: '1.e4 e6 2.d4 d5 3.Nc3 Nf6', description: 'Main line French with Nf6', category: 'semi-open' },
  { eco: 'C18', name: 'French Winawer', moves: '1.e4 e6 2.d4 d5 3.Nc3 Bb4', description: 'Sharp and complex French variation', category: 'semi-open' },
  
  // Caro-Kann Defense
  { eco: 'B10', name: 'Caro-Kann Defense', moves: '1.e4 c6', description: 'Solid and reliable, fewer weaknesses than French', category: 'semi-open' },
  { eco: 'B12', name: 'Caro-Kann Advance', moves: '1.e4 c6 2.d4 d5 3.e5', description: 'Space advantage for White, French-like', category: 'semi-open' },
  
  // Queen\'s Gambit family
  { eco: 'D06', name: "Queen's Gambit", moves: '1.d4 d5 2.c4', description: 'Classical opening, fight for the center', category: 'closed' },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: '1.d4 d5 2.c4 e6', description: 'Solid defense, maintaining the d5 pawn', category: 'closed' },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: '1.d4 d5 2.c4 dxc4', description: 'Taking the pawn, conceding center', category: 'closed' },
  { eco: 'D35', name: 'Exchange Variation', moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5', description: 'Symmetrical structure, minority attack', category: 'closed' },
  
  // Indian Defenses
  { eco: 'E00', name: "King's Indian Defense", moves: '1.d4 Nf6 2.c4 g6', description: 'Hypermodern, fianchetto kingside', category: 'semi-closed' },
  { eco: 'E70', name: "King's Indian Classical", moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3', description: 'Main line KID', category: 'semi-closed' },
  { eco: 'E60', name: "King's Indian Fianchetto", moves: '1.d4 Nf6 2.c4 g6 3.g3', description: 'Quiet, positional approach', category: 'semi-closed' },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', description: 'Flexible and solid, pins Nc3', category: 'semi-closed' },
  { eco: 'A50', name: "Queen's Indian Defense", moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6', description: 'Control e4 with Bb7', category: 'semi-closed' },
  { eco: 'D70', name: 'Grünfeld Defense', moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5', description: 'Hypermodern counter to d4', category: 'semi-closed' },
  
  // Flank Openings
  { eco: 'A00', name: 'Hungarian Opening', moves: '1.g3', description: 'Flexible flank opening', category: 'flank' },
  { eco: 'A02', name: "Bird's Opening", moves: '1.f4', description: 'Control e5 with f-pawn', category: 'flank' },
  { eco: 'A04', name: "Réti Opening", moves: '1.Nf3 d5 2.c4', description: 'Hypermodern, fianchetto setup', category: 'flank' },
  { eco: 'A10', name: 'English Opening', moves: '1.c4', description: 'Flexible flank opening, transposes often', category: 'flank' },
  { eco: 'A16', name: 'English Anglo-Indian', moves: '1.c4 Nf6 2.Nc3', description: 'English with Indian setup', category: 'flank' },
  
  // Gambits
  { eco: 'C30', name: "King's Gambit", moves: '1.e4 e5 2.f4', description: 'Romantic era attacking opening', category: 'open' },
  { eco: 'D08', name: 'Albin Counter-Gambit', moves: '1.d4 d5 2.c4 e5', description: 'Aggressive counter to QG', category: 'closed' },
  { eco: 'A45', name: 'Trompowsky Attack', moves: '1.d4 Nf6 2.Bg5', description: 'Aggressive anti-Indian', category: 'closed' },
  { eco: 'D00', name: 'London System', moves: '1.d4 d5 2.Bf4', description: 'Solid, systematic setup for White', category: 'closed' },
  { eco: 'A46', name: 'Torre Attack', moves: '1.d4 Nf6 2.Nf3 e6 3.Bg5', description: 'Pin knight, solid development', category: 'closed' },
  
  // Scandinavian
  { eco: 'B01', name: 'Scandinavian Defense', moves: '1.e4 d5', description: 'Immediate counter in center, queen comes out early', category: 'semi-open' },
  
  // Pirc/Modern
  { eco: 'B07', name: 'Pirc Defense', moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6', description: 'Hypermodern, lets White build center', category: 'semi-open' },
  { eco: 'B06', name: 'Modern Defense', moves: '1.e4 g6', description: 'Flexible, delays d6', category: 'semi-open' },
  
  // Alekhine
  { eco: 'B02', name: "Alekhine's Defense", moves: '1.e4 Nf6', description: 'Provoke e5, attack White center', category: 'semi-open' },
  
  // Dutch
  { eco: 'A80', name: 'Dutch Defense', moves: '1.d4 f5', description: 'Aggressive response to d4', category: 'semi-closed' },
  { eco: 'A87', name: 'Dutch Leningrad', moves: '1.d4 f5 2.c4 Nf6 3.g3 g6', description: 'Dragon-like setup against d4', category: 'semi-closed' },
  
  // Slav
  { eco: 'D10', name: 'Slav Defense', moves: '1.d4 d5 2.c4 c6', description: 'Solid, supports d5 with c6', category: 'closed' },
  { eco: 'D15', name: 'Slav Accepted', moves: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4', description: 'Taking on c4 with c6 support', category: 'closed' },
  
  // Catalan
  { eco: 'E01', name: 'Catalan Opening', moves: '1.d4 Nf6 2.c4 e6 3.g3', description: 'Fianchetto bishop, pressure on d5', category: 'closed' },
  
  // Benoni
  { eco: 'A60', name: 'Benoni Defense', moves: '1.d4 Nf6 2.c4 c5 3.d5', description: 'Asymmetrical pawn structure', category: 'semi-closed' },
  { eco: 'A67', name: 'Benko Gambit', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5', description: 'Pawn sac for queenside pressure', category: 'semi-closed' },
];

const GAMBITS_DB: ChessGambit[] = [
  { name: "King's Gambit", moves: '1.e4 e5 2.f4', sacrificedMaterial: 'f-pawn', compensation: 'Open f-file, rapid development', frequency: 'common' },
  { name: 'Evans Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4', sacrificedMaterial: 'b-pawn', compensation: 'Tempo, open lines, center control', frequency: 'common' },
  { name: 'Danish Gambit', moves: '1.e4 e5 2.d4 exd4 3.c3', sacrificedMaterial: 'd and c pawns', compensation: 'Massive lead in development', frequency: 'rare' },
  { name: 'Smith-Morra Gambit', moves: '1.e4 c5 2.d4 cxd4 3.c3', sacrificedMaterial: 'c-pawn', compensation: 'Development and open lines', frequency: 'common' },
  { name: 'Benko Gambit', moves: '1.d4 Nf6 2.c4 c5 3.d5 b5', sacrificedMaterial: 'b-pawn', compensation: 'Queenside pressure, a and b files', frequency: 'common' },
  { name: 'Marshall Attack', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5', sacrificedMaterial: 'e-pawn', compensation: 'Attack on white king', frequency: 'legendary' },
  { name: 'Muzio Gambit', moves: '1.e4 e5 2.f4 exf4 3.Nf3 g5 4.Bc4 g4 5.O-O', sacrificedMaterial: 'Knight', compensation: 'Massive attack, development lead', frequency: 'rare' },
  { name: 'Latvian Gambit', moves: '1.e4 e5 2.Nf3 f5', sacrificedMaterial: 'f-pawn weakens king', compensation: 'Counterattack chances', frequency: 'rare' },
  { name: 'Englund Gambit', moves: '1.d4 e5', sacrificedMaterial: 'e-pawn', compensation: 'Tricky for White', frequency: 'rare' },
  { name: 'Budapest Gambit', moves: '1.d4 Nf6 2.c4 e5', sacrificedMaterial: 'e-pawn', compensation: 'Active pieces', frequency: 'rare' },
  { name: 'Albin Counter-Gambit', moves: '1.d4 d5 2.c4 e5', sacrificedMaterial: 'e-pawn', compensation: 'Central initiative', frequency: 'rare' },
  { name: "Queen's Gambit", moves: '1.d4 d5 2.c4', sacrificedMaterial: 'c-pawn (temporarily)', compensation: 'Center control', frequency: 'common' },
  { name: 'Scotch Gambit', moves: '1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Bc4', sacrificedMaterial: 'd-pawn', compensation: 'Development, attacking f7', frequency: 'common' },
  { name: 'Wing Gambit', moves: '1.e4 c5 2.b4', sacrificedMaterial: 'b-pawn', compensation: 'Open b-file, queenside play', frequency: 'rare' },
  { name: 'Blackmar-Diemer Gambit', moves: '1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3', sacrificedMaterial: 'e-pawn', compensation: 'Development and attack', frequency: 'rare' },
];

// ===================== ANALYSIS FUNCTIONS =====================

/**
 * Convert PGN moves to array of SAN notation
 */
function pgnToMoves(pgn: string): string[] {
  const movesSection = pgn.replace(/\[[^\]]*\]/g, '').trim();
  return movesSection
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\$\d+/g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .split(/\s+/)
    .filter(token => token && !token.match(/^\d+\.+$/) && token !== '...')
    .map(m => m.replace(/[+#!?]+$/, ''));
}

/**
 * Match opening from move sequence using the comprehensive opening detector
 */
export function detectOpening(moves: string[]): ChessOpening | undefined {
  // Use the new comprehensive opening detector
  const { detectOpeningFromMoves } = require('./openingDetector');
  const detected = detectOpeningFromMoves(moves);
  
  if (!detected) return undefined;
  
  // Convert to legacy ChessOpening format for backwards compatibility
  return {
    eco: detected.eco,
    name: detected.fullName,
    moves: detected.moves,
    description: detected.description,
    category: detected.category === 'gambit' ? 'open' : detected.category,
  };
}

/**
 * Detect if a gambit was played
 */
export function detectGambit(moves: string[]): ChessGambit | undefined {
  const moveSequence = moves.slice(0, 10).join(' ').toLowerCase();
  
  for (const gambit of GAMBITS_DB) {
    const gambitMoves = pgnToMoves(gambit.moves).join(' ').toLowerCase();
    if (moveSequence.startsWith(gambitMoves) || gambitMoves.startsWith(moveSequence)) {
      return gambit;
    }
  }
  
  return undefined;
}

/**
 * Detect special moves in the game
 */
export function detectSpecialMoves(pgn: string): SpecialMove[] {
  const specialMoves: SpecialMove[] = [];
  const chess = new Chess();
  
  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    history.forEach((move, index) => {
      const moveNumber = index + 1;
      
      // En passant
      if (move.flags.includes('e')) {
        specialMoves.push({
          type: 'en_passant',
          moveNumber,
          notation: move.san,
          description: `En passant capture: ${move.san} - a rare pawn capture where the capturing pawn moves to the square the opponent's pawn passed through`,
        });
      }
      
      // Castling
      if (move.flags.includes('k')) {
        specialMoves.push({
          type: 'castle_kingside',
          moveNumber,
          notation: move.san,
          description: `Kingside castling (O-O) - King moves two squares toward h-file, rook jumps to the other side`,
        });
      }
      
      if (move.flags.includes('q')) {
        specialMoves.push({
          type: 'castle_queenside',
          moveNumber,
          notation: move.san,
          description: `Queenside castling (O-O-O) - King moves two squares toward a-file, rook jumps to the other side`,
        });
      }
      
      // Pawn promotion
      if (move.promotion) {
        const pieceNames: Record<string, string> = {
          q: 'Queen',
          r: 'Rook',
          b: 'Bishop',
          n: 'Knight',
        };
        
        const isUnderpromotion = move.promotion !== 'q';
        specialMoves.push({
          type: isUnderpromotion ? 'underpromotion' : 'promotion',
          moveNumber,
          notation: move.san,
          promotedTo: move.promotion as PieceSymbol,
          description: isUnderpromotion 
            ? `Underpromotion to ${pieceNames[move.promotion]}: ${move.san} - a tactical choice, often to avoid stalemate or deliver checkmate`
            : `Pawn promotes to ${pieceNames[move.promotion]}: ${move.san} - the most common promotion`,
        });
      }
    });
  } catch (e) {
    // Handle malformed PGN gracefully
  }
  
  return specialMoves;
}

/**
 * Detect tactical motifs (forks, pins, etc.)
 */
export function detectTactics(pgn: string): TacticalMotif[] {
  const tactics: TacticalMotif[] = [];
  const chess = new Chess();
  
  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    // Reset and replay to analyze each position
    chess.reset();
    
    history.forEach((move, index) => {
      const moveNumber = index + 1;
      chess.move(move.san);
      
      // Check for checks
      if (move.san.includes('+') && !move.san.includes('#')) {
        tactics.push({
          type: 'check',
          moveNumber,
          notation: move.san,
          attacker: { piece: move.piece, square: move.to },
          targets: [{ piece: 'k', square: findKingSquare(chess, move.color === 'w' ? 'b' : 'w') }],
          description: `${getPieceName(move.piece)} delivers check from ${move.to}`,
          value: 0,
        });
      }
      
      // Check for checkmate
      if (move.san.includes('#')) {
        tactics.push({
          type: 'checkmate',
          moveNumber,
          notation: move.san,
          attacker: { piece: move.piece, square: move.to },
          targets: [{ piece: 'k', square: findKingSquare(chess, move.color === 'w' ? 'b' : 'w') }],
          description: `Checkmate! ${getPieceName(move.piece)} delivers the final blow from ${move.to}`,
          value: 100, // Game-ending value
        });
      }
      
      // Check for forks (one piece attacking multiple valuable pieces)
      const forksFound = detectForks(chess, move, moveNumber);
      tactics.push(...forksFound);
      
      // Check for pins
      const pinsFound = detectPins(chess, move, moveNumber);
      tactics.push(...pinsFound);
    });
  } catch (e) {
    // Handle gracefully
  }
  
  return tactics;
}

function detectForks(chess: Chess, lastMove: Move, moveNumber: number): TacticalMotif[] {
  const forks: TacticalMotif[] = [];
  const movedPiece = lastMove.piece;
  const movedTo = lastMove.to;
  const color = lastMove.color;
  
  // Get all squares attacked by the moved piece
  const attackedSquares = getAttackedSquares(chess, movedTo);
  
  // Find valuable pieces being attacked
  const valuablePieces: { piece: PieceSymbol; square: Square }[] = [];
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  
  for (const square of attackedSquares) {
    const piece = chess.get(square);
    if (piece && piece.color !== color) {
      if (pieceValues[piece.type] >= 3 || piece.type === 'k') {
        valuablePieces.push({ piece: piece.type, square });
      }
    }
  }
  
  // A fork attacks 2+ valuable pieces
  if (valuablePieces.length >= 2) {
    const totalValue = valuablePieces.reduce((sum, p) => sum + pieceValues[p.piece], 0);
    forks.push({
      type: 'fork',
      moveNumber,
      notation: lastMove.san,
      attacker: { piece: movedPiece, square: movedTo },
      targets: valuablePieces,
      description: `${getPieceName(movedPiece)} fork attacks ${valuablePieces.map(p => getPieceName(p.piece)).join(' and ')}`,
      value: totalValue,
    });
  }
  
  return forks;
}

function detectPins(chess: Chess, lastMove: Move, moveNumber: number): TacticalMotif[] {
  const pins: TacticalMotif[] = [];
  const skewers: TacticalMotif[] = [];
  const movedPiece = lastMove.piece;
  const movedTo = lastMove.to;
  const attackerColor = lastMove.color;
  const defenderColor = attackerColor === 'w' ? 'b' : 'w';
  
  // Only sliding pieces can create pins/skewers
  if (!['b', 'r', 'q'].includes(movedPiece)) {
    return [];
  }
  
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  
  // Find the defender's king position
  const kingSquare = findKingSquare(chess, defenderColor);
  
  // Direction vectors for sliding pieces
  const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const rookDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const queenDirs = [...bishopDirs, ...rookDirs];
  
  const directions = movedPiece === 'b' ? bishopDirs 
                   : movedPiece === 'r' ? rookDirs 
                   : queenDirs;
  
  const file = movedTo.charCodeAt(0) - 97; // 0-7
  const rank = parseInt(movedTo[1]) - 1; // 0-7
  
  // Check each direction from the moved piece
  for (const [df, dr] of directions) {
    const piecesInLine: { piece: PieceSymbol; square: Square; color: 'w' | 'b'; value: number }[] = [];
    
    let f = file + df;
    let r = rank + dr;
    
    // Scan along the line
    while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
      const square = (String.fromCharCode(97 + f) + (r + 1)) as Square;
      const piece = chess.get(square);
      
      if (piece) {
        piecesInLine.push({
          piece: piece.type,
          square,
          color: piece.color,
          value: pieceValues[piece.type]
        });
        
        // Stop if we hit a same-color piece (can't pin through)
        if (piece.color === attackerColor) break;
        
        // If we have 2 defender pieces in line, check for pin/skewer
        if (piecesInLine.length === 2) break;
      }
      
      f += df;
      r += dr;
    }
    
    // Need exactly 2 enemy pieces in line for pin/skewer
    const enemyPieces = piecesInLine.filter(p => p.color === defenderColor);
    
    if (enemyPieces.length === 2) {
      const first = enemyPieces[0];
      const second = enemyPieces[1];
      
      // PIN: First piece is less valuable than second (or second is king)
      // The first piece is "pinned" to the more valuable piece behind it
      if (first.value < second.value || second.piece === 'k') {
        pins.push({
          type: 'pin',
          moveNumber,
          notation: lastMove.san,
          attacker: { piece: movedPiece, square: movedTo },
          targets: [
            { piece: first.piece, square: first.square },
            { piece: second.piece, square: second.square }
          ],
          description: `${getPieceName(movedPiece)} pins ${getPieceName(first.piece)} to ${second.piece === 'k' ? 'the King' : getPieceName(second.piece)}`,
          value: first.value + (second.piece === 'k' ? 10 : second.value),
        });
      }
      
      // SKEWER: First piece is MORE valuable than second
      // The more valuable piece must move, exposing the lesser piece
      if (first.value > second.value && first.piece !== 'k') {
        skewers.push({
          type: 'skewer',
          moveNumber,
          notation: lastMove.san,
          attacker: { piece: movedPiece, square: movedTo },
          targets: [
            { piece: first.piece, square: first.square },
            { piece: second.piece, square: second.square }
          ],
          description: `${getPieceName(movedPiece)} skewers ${getPieceName(first.piece)}, exposing ${getPieceName(second.piece)}`,
          value: first.value + second.value,
        });
      }
      
      // Special case: Absolute pin (pinned to king)
      if (second.piece === 'k') {
        // This is always a pin, the pinned piece cannot legally move
        // Already handled above, but could add extra flag
      }
    }
  }
  
  return [...pins, ...skewers];
}

function getAttackedSquares(chess: Chess, from: Square): Square[] {
  const attacks: Square[] = [];
  const files = 'abcdefgh';
  const ranks = '12345678';
  
  for (const file of files) {
    for (const rank of ranks) {
      const to = (file + rank) as Square;
      if (to !== from) {
        // Check if move would be legal (captures or attacks)
        const moves = chess.moves({ square: from, verbose: true });
        if (moves.some(m => m.to === to)) {
          attacks.push(to);
        }
      }
    }
  }
  
  return attacks;
}

function findKingSquare(chess: Chess, color: 'w' | 'b'): Square {
  const files = 'abcdefgh';
  const ranks = '12345678';
  
  for (const file of files) {
    for (const rank of ranks) {
      const square = (file + rank) as Square;
      const piece = chess.get(square);
      if (piece && piece.type === 'k' && piece.color === color) {
        return square;
      }
    }
  }
  
  return 'e1' as Square; // Fallback
}

function getPieceName(piece: PieceSymbol): string {
  const names: Record<string, string> = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King',
  };
  return names[piece] || piece.toUpperCase();
}

/**
 * Detect game phases
 */
export function detectGamePhases(totalMoves: number, moves: string[]): GamePhase[] {
  const phases: GamePhase[] = [];
  
  // Opening: first 10-15 moves (20-30 half-moves)
  const openingEnd = Math.min(Math.floor(totalMoves * 0.25), 30);
  
  // Endgame: typically when few pieces remain or after move 40
  const endgameStart = Math.max(Math.floor(totalMoves * 0.7), 60);
  
  // Opening phase
  phases.push({
    name: 'opening',
    startMove: 1,
    endMove: openingEnd,
    description: 'Development phase - pieces are developed, castling, center control',
    keyEvents: extractPhaseEvents(moves, 1, openingEnd),
  });
  
  // Middlegame
  if (openingEnd < endgameStart) {
    phases.push({
      name: 'middlegame',
      startMove: openingEnd + 1,
      endMove: endgameStart - 1,
      description: 'Main battle - tactical combinations, attacks, strategic maneuvering',
      keyEvents: extractPhaseEvents(moves, openingEnd + 1, endgameStart - 1),
    });
  }
  
  // Endgame
  if (endgameStart <= totalMoves) {
    phases.push({
      name: 'endgame',
      startMove: endgameStart,
      endMove: totalMoves,
      description: 'Endgame phase - fewer pieces, king becomes active, pawn promotion key',
      keyEvents: extractPhaseEvents(moves, endgameStart, totalMoves),
    });
  }
  
  return phases;
}

function extractPhaseEvents(moves: string[], start: number, end: number): string[] {
  const events: string[] = [];
  const phraseMoves = moves.slice(start - 1, end);
  
  for (let i = 0; i < phraseMoves.length; i++) {
    const move = phraseMoves[i];
    const absMove = start + i;
    
    if (move.includes('#')) events.push(`Move ${absMove}: Checkmate! (${move})`);
    else if (move.includes('+')) events.push(`Move ${absMove}: Check (${move})`);
    else if (move === 'O-O') events.push(`Move ${absMove}: Kingside castle`);
    else if (move === 'O-O-O') events.push(`Move ${absMove}: Queenside castle`);
    else if (move.includes('=')) events.push(`Move ${absMove}: Pawn promotion (${move})`);
    else if (move.includes('x') && move.toLowerCase().includes('q')) events.push(`Move ${absMove}: Queen capture! (${move})`);
  }
  
  return events.slice(0, 5); // Limit to 5 key events per phase
}

/**
 * Main analysis function - analyzes a full game
 */
export function analyzeGame(pgn: string): GameAnalysis {
  const moves = pgnToMoves(pgn);
  const totalMoves = moves.length;
  
  // Count captures and checks
  let captureCount = 0;
  let checkCount = 0;
  
  for (const move of moves) {
    if (move.includes('x')) captureCount++;
    if (move.includes('+') || move.includes('#')) checkCount++;
  }
  
  // Classify move quality
  const classifiedMoves = classifyMoves(pgn);
  const moveQuality = getMoveQualitySummary(classifiedMoves);
  
  // Determine complexity - enhanced with brilliant/blunder data
  let complexity: GameAnalysis['summary']['complexity'] = 'simple';
  if (totalMoves > 40) complexity = 'moderate';
  if (totalMoves > 60 && captureCount > 10) complexity = 'complex';
  if (totalMoves > 80 && checkCount > 5) complexity = 'masterpiece';
  if (moveQuality.brilliantCount >= 2) complexity = 'masterpiece';
  
  const analysis: GameAnalysis = {
    opening: detectOpening(moves),
    gambit: detectGambit(moves),
    tactics: detectTactics(pgn),
    specialMoves: detectSpecialMoves(pgn),
    phases: detectGamePhases(totalMoves, moves),
    moveQuality,
    summary: {
      totalMoves,
      captureCount,
      checkCount,
      brilliantCount: moveQuality.brilliantCount,
      blunderCount: moveQuality.blunderCount,
      accuracy: moveQuality.accuracy,
      materialBalance: 0, // Would require position analysis
      longestForcingSequence: 0, // Would require deep analysis
      complexity,
    },
  };
  
  return analysis;
}

/**
 * Get a human-readable summary of the analysis
 */
export function getAnalysisSummary(analysis: GameAnalysis): string {
  const parts: string[] = [];
  
  if (analysis.opening) {
    parts.push(`Opening: ${analysis.opening.name} (${analysis.opening.eco})`);
    parts.push(`  → ${analysis.opening.description}`);
  }
  
  if (analysis.gambit) {
    parts.push(`Gambit: ${analysis.gambit.name}`);
    parts.push(`  → Sacrificed: ${analysis.gambit.sacrificedMaterial}`);
    parts.push(`  → Compensation: ${analysis.gambit.compensation}`);
  }
  
  if (analysis.tactics.length > 0) {
    parts.push(`Tactics detected: ${analysis.tactics.length}`);
    analysis.tactics.slice(0, 3).forEach(t => {
      parts.push(`  → Move ${t.moveNumber}: ${t.description}`);
    });
  }
  
  if (analysis.specialMoves.length > 0) {
    parts.push(`Special moves: ${analysis.specialMoves.map(m => m.type).join(', ')}`);
  }
  
  // Add move quality summary
  if (analysis.moveQuality) {
    const mq = analysis.moveQuality;
    parts.push(`Move Quality: ${analysis.summary.accuracy}% accuracy`);
    if (mq.brilliantCount > 0) {
      parts.push(`  → Brilliant moves: ${mq.brilliantCount}`);
    }
    if (mq.blunderCount > 0) {
      parts.push(`  → Blunders: ${mq.blunderCount}`);
    }
  }
  
  parts.push(`Game complexity: ${analysis.summary.complexity}`);
  parts.push(`Total: ${analysis.summary.totalMoves} moves, ${analysis.summary.captureCount} captures, ${analysis.summary.checkCount} checks`);
  
  return parts.join('\n');
}
