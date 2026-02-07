/**
 * Predictive Chess Analysis Engine
 * 
 * Combines Stockfish 17's deep analysis capabilities with En Pensent's
 * visualization data and color theory to provide:
 * - 30-move lookahead predictions
 * - Pattern recognition across game positions
 * - Best move suggestions with visual context
 * - Future potential visualization of any position
 * 
 * This integrates engine analysis with our unique visual fingerprinting
 * to create predictive insights no other platform can offer.
 */

import { Chess, Square } from 'chess.js';
import { getStockfishEngine, PositionAnalysis, StockfishEvaluation } from './stockfishEngine';
import { SquareData, GameData } from './gameSimulator';
import { getPieceColor, PieceType, PieceColor, getActivePalette } from './pieceColors';
import { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype';

// ===================== TYPES =====================

export interface PredictedLine {
  moves: string[];           // Array of SAN moves
  evaluation: number;        // Final position eval in centipawns
  winProbability: number;    // 0-100 for the side to move at start
  isMate: boolean;
  mateIn?: number;
  visualComplexity: number;  // Predicted visual complexity (0-100)
  territoryBalance: number;  // -100 (black dominates) to +100 (white dominates)
}

export interface PositionPotential {
  fen: string;
  currentEval: number;
  bestMove: string;
  bestMoveReadable: string;  // SAN notation
  principalVariation: PredictedLine;
  alternativeLines: PredictedLine[];
  futurePositions: FuturePosition[];
  tacticalThemes: TacticalTheme[];
  positionType: PositionType;
  dynamism: number;          // 0-100, how much the position can change
  criticalSquares: string[]; // Key squares to control
  vulnerabilities: Vulnerability[];
}

export interface FuturePosition {
  moveNumber: number;        // Moves from current position
  fen: string;
  evaluation: number;
  bestContinuation: string;
  description: string;       // Human-readable position description
  visualPattern: VisualPattern;
}

export interface VisualPattern {
  dominantColor: 'white' | 'black' | 'balanced';
  controlledTerritory: number; // Squares controlled (0-64)
  pieceActivity: number;       // 0-100 measure of piece mobility
  kingSafety: { white: number; black: number };
  centerControl: number;       // -100 to +100
}

export interface TacticalTheme {
  type: 'fork' | 'pin' | 'skewer' | 'discovered_attack' | 'double_attack' | 
        'back_rank' | 'sacrifice' | 'promotion' | 'mating_pattern' | 'zugzwang' | 'tactical';
  likelihood: number;        // 0-100
  targetSquares: string[];
  description: string;
}

export interface Vulnerability {
  side: 'white' | 'black';
  type: 'king_safety' | 'weak_pawns' | 'piece_trapped' | 'overloaded_piece' | 
        'exposed_king' | 'back_rank' | 'undefended_piece';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export type PositionType = 
  | 'opening'
  | 'closed_center'
  | 'open_center'
  | 'pawn_race'
  | 'attack'
  | 'defense'
  | 'endgame_winning'
  | 'endgame_drawing'
  | 'tactical'
  | 'positional'
  | 'critical';

export interface MoveRecommendation {
  move: string;
  uci: string;
  evaluation: number;
  improvement: number;       // How much better than current position
  confidence: number;        // 0-100
  reasoning: string[];       // Why this move is recommended
  visualImpact: string;      // How it changes the visualization
  futureLines: PredictedLine[];
}

// ===================== ANALYSIS FUNCTIONS =====================

/**
 * Analyze position potential with 30-move lookahead
 * Combines Stockfish analysis with visual pattern recognition
 */
export async function analyzePositionPotential(
  fen: string,
  options: {
    depth?: number;
    lines?: number;
    lookahead?: number;
    onProgress?: (stage: string, progress: number) => void;
  } = {}
): Promise<PositionPotential> {
  const depth = options.depth || 20;
  const lines = Math.min(options.lines || 3, 5);
  const lookahead = Math.min(options.lookahead || 15, 30); // Cap at 30 moves
  
  const engine = getStockfishEngine();
  await engine.waitReady();
  
  const chess = new Chess(fen);
  options.onProgress?.('Analyzing current position', 10);
  
  // Get primary analysis
  const primaryAnalysis = await engine.analyzePosition(fen, { depth, nodes: 100000 });
  
  options.onProgress?.('Computing principal variation', 30);
  
  // Build principal variation line
  const pvLine = await buildPredictedLine(
    fen, 
    primaryAnalysis.evaluation.pv, 
    primaryAnalysis.evaluation.score,
    primaryAnalysis.evaluation.scoreType === 'mate',
    primaryAnalysis.evaluation.mateIn
  );
  
  options.onProgress?.('Analyzing future positions', 50);
  
  // Generate future position snapshots
  const futurePositions = await generateFuturePositions(fen, pvLine.moves, lookahead);
  
  options.onProgress?.('Detecting tactical themes', 70);
  
  // Detect tactical themes
  const tacticalThemes = detectTacticalThemes(chess, primaryAnalysis);
  
  // Detect vulnerabilities
  const vulnerabilities = detectVulnerabilities(chess);
  
  // Determine position type
  const positionType = classifyPosition(chess, primaryAnalysis);
  
  options.onProgress?.('Calculating dynamics', 90);
  
  // Calculate position dynamism
  const dynamism = calculateDynamism(chess, primaryAnalysis);
  
  // Find critical squares
  const criticalSquares = findCriticalSquares(chess, primaryAnalysis);
  
  options.onProgress?.('Complete', 100);
  
  return {
    fen,
    currentEval: primaryAnalysis.evaluation.score,
    bestMove: primaryAnalysis.bestMove,
    bestMoveReadable: convertUciToSan(chess, primaryAnalysis.bestMove),
    principalVariation: pvLine,
    alternativeLines: await generateAlternativeLines(fen, chess, Math.min(lines - 1, 2), depth),
    futurePositions,
    tacticalThemes,
    positionType,
    dynamism,
    criticalSquares,
    vulnerabilities,
  };
}

/**
 * Get best move recommendation with detailed reasoning
 */
export async function getBestMoveRecommendation(
  fen: string,
  depth: number = 20
): Promise<MoveRecommendation> {
  const engine = getStockfishEngine();
  await engine.waitReady();
  
  const chess = new Chess(fen);
  const analysis = await engine.analyzePosition(fen, { depth, nodes: 100000 });
  
  const bestMove = analysis.bestMove;
  const bestMoveSan = convertUciToSan(chess, bestMove);
  
  // Play the move to see the result
  const newChess = new Chess(fen);
  newChess.move(bestMoveSan);
  
  // Analyze resulting position
  const afterAnalysis = await engine.analyzePosition(newChess.fen(), { depth: depth - 2, nodes: 50000 });
  
  // Calculate improvement
  const currentEval = analysis.evaluation.score;
  const afterEval = -afterAnalysis.evaluation.score; // Flip perspective
  
  // Generate reasoning
  const reasoning = generateMoveReasoning(chess, bestMoveSan, analysis, afterAnalysis);
  
  // Build future lines
  const futureLines = await Promise.all([
    buildPredictedLine(
      newChess.fen(),
      afterAnalysis.evaluation.pv,
      afterAnalysis.evaluation.score,
      afterAnalysis.evaluation.scoreType === 'mate',
      afterAnalysis.evaluation.mateIn
    )
  ]);
  
  return {
    move: bestMoveSan,
    uci: bestMove,
    evaluation: currentEval,
    improvement: afterEval - currentEval,
    confidence: calculateConfidence(analysis),
    reasoning,
    visualImpact: describeVisualImpact(chess, bestMoveSan),
    futureLines,
  };
}

/**
 * Predict visual pattern for a position
 */
export function predictVisualPattern(chess: Chess): VisualPattern {
  const board = chess.board();
  
  let whiteControl = 0;
  let blackControl = 0;
  let whitePieceActivity = 0;
  let blackPieceActivity = 0;
  
  // Count controlled squares and piece activity
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const square = (String.fromCharCode(97 + file) + (8 - rank)) as Square;
        const moves = chess.moves({ square, verbose: true });
        
        if (piece.color === 'w') {
          whitePieceActivity += moves.length;
          whiteControl += moves.length * 0.5;
        } else {
          blackPieceActivity += moves.length;
          blackControl += moves.length * 0.5;
        }
      }
    }
  }
  
  // Normalize activity scores
  const totalMoves = chess.moves().length;
  const activityScore = Math.min(100, (whitePieceActivity + blackPieceActivity) / 2);
  
  // Calculate center control
  const centerSquares = ['d4', 'd5', 'e4', 'e5'] as Square[];
  let centerScore = 0;
  for (const sq of centerSquares) {
    const piece = chess.get(sq);
    if (piece) {
      centerScore += piece.color === 'w' ? 25 : -25;
    }
  }
  
  // Assess king safety (simplified)
  const whiteKingSafety = assessKingSafety(chess, 'w');
  const blackKingSafety = assessKingSafety(chess, 'b');
  
  // Determine dominant color
  const territoryDiff = whiteControl - blackControl;
  const dominantColor = territoryDiff > 5 ? 'white' : territoryDiff < -5 ? 'black' : 'balanced';
  
  return {
    dominantColor,
    controlledTerritory: Math.round(whiteControl + blackControl),
    pieceActivity: activityScore,
    kingSafety: { white: whiteKingSafety, black: blackKingSafety },
    centerControl: centerScore,
  };
}

/**
 * Extract En Pensent temporal signature from a chess position
 * Enables cross-domain pattern matching and archetype classification
 */
export function extractPositionSignature(chess: Chess): TemporalSignature {
  const board = chess.board();
  const history = chess.history();
  const visualPattern = predictVisualPattern(chess);
  
  // Calculate quadrant activity (divide board into 4 quadrants)
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const weight = piece.color === 'w' ? 1 : 0.8;
        if (rank < 4 && file < 4) q1 += weight;
        else if (rank < 4 && file >= 4) q2 += weight;
        else if (rank >= 4 && file < 4) q3 += weight;
        else q4 += weight;
      }
    }
  }
  
  // Normalize quadrant values
  const maxQ = Math.max(q1, q2, q3, q4, 1);
  const quadrantProfile: QuadrantProfile = {
    q1: q1 / maxQ,
    q2: q2 / maxQ,
    q3: q3 / maxQ,
    q4: q4 / maxQ,
    center: visualPattern.centerControl / 100 + 0.5
  };
  
  // Calculate temporal flow based on game phase
  const moveCount = history.length;
  const phase = moveCount < 15 ? 'opening' : moveCount < 40 ? 'middle' : 'ending';
  const temporalFlow: TemporalFlow = {
    opening: phase === 'opening' ? 0.9 : 0.2,
    middle: phase === 'middle' ? 0.9 : 0.3,
    ending: phase === 'ending' ? 0.9 : 0.1,
    trend: visualPattern.pieceActivity > 50 ? 'accelerating' : 
           visualPattern.pieceActivity < 30 ? 'declining' : 'stable',
    momentum: (visualPattern.kingSafety.white - visualPattern.kingSafety.black) / 100
  };
  
  // Calculate intensity from piece activity
  const intensity = Math.min(1, visualPattern.pieceActivity / 80);
  
  // Generate fingerprint
  const fingerprint = `pos_${chess.fen().split(' ')[0].replace(/\//g, '_').slice(0, 20)}`;
  
  // Determine dominant force
  const dominantForce: 'primary' | 'secondary' | 'balanced' = 
    visualPattern.dominantColor === 'white' ? 'primary' :
    visualPattern.dominantColor === 'black' ? 'secondary' : 'balanced';
  
  // Detect critical moments
  const criticalMoments: CriticalMoment[] = [];
  if (chess.inCheck()) {
    criticalMoments.push({
      index: moveCount,
      type: 'check',
      severity: 0.7,
      description: 'King in check - critical position'
    });
  }
  
  // Build signature
  const signature: TemporalSignature = {
    fingerprint,
    archetype: 'unknown',
    dominantForce,
    flowDirection: temporalFlow.momentum > 0.2 ? 'forward' : 
                   temporalFlow.momentum < -0.2 ? 'backward' : 'lateral',
    intensity,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    domainData: {
      fen: chess.fen(),
      visualPattern,
      moveCount,
      phase
    }
  };
  
  // Classify archetype using universal classifier
  signature.archetype = classifyUniversalArchetype(signature);
  
  return signature;
}

// ===================== HELPER FUNCTIONS =====================

async function buildPredictedLine(
  startFen: string,
  pvMoves: string[],
  finalEval: number,
  isMate: boolean,
  mateIn?: number
): Promise<PredictedLine> {
  const chess = new Chess(startFen);
  const sanMoves: string[] = [];
  
  // Convert UCI moves to SAN
  for (const uci of pvMoves.slice(0, 30)) { // Limit to 30 moves
    try {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const promotion = uci.length > 4 ? uci[4] : undefined;
      
      const move = chess.move({ from, to, promotion });
      if (move) {
        sanMoves.push(move.san);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  
  // Calculate visual complexity of final position
  const visualPattern = predictVisualPattern(chess);
  
  // Convert eval to win probability
  const K = 0.00368208;
  const winProb = 50 + 50 * (2 / (1 + Math.exp(-K * finalEval)) - 1);
  
  return {
    moves: sanMoves,
    evaluation: finalEval,
    winProbability: winProb,
    isMate,
    mateIn,
    visualComplexity: visualPattern.pieceActivity,
    territoryBalance: visualPattern.centerControl,
  };
}

async function generateFuturePositions(
  startFen: string,
  moves: string[],
  count: number
): Promise<FuturePosition[]> {
  const positions: FuturePosition[] = [];
  const chess = new Chess(startFen);
  const engine = getStockfishEngine();
  
  // Sample positions at regular intervals
  const interval = Math.max(1, Math.floor(moves.length / Math.min(count, moves.length)));
  
  for (let i = 0; i < moves.length && positions.length < count; i++) {
    try {
      chess.move(moves[i]);
      
      if ((i + 1) % interval === 0 || i === moves.length - 1) {
        const analysis = await engine.analyzePosition(chess.fen(), { nodes: 20000 });
        const pattern = predictVisualPattern(chess);
        
        positions.push({
          moveNumber: i + 1,
          fen: chess.fen(),
          evaluation: analysis.evaluation.score,
          bestContinuation: convertUciToSan(chess, analysis.bestMove),
          description: describePosition(chess, analysis.evaluation.score),
          visualPattern: pattern,
        });
      }
    } catch {
      break;
    }
  }
  
  return positions;
}

function detectTacticalThemes(chess: Chess, analysis: PositionAnalysis): TacticalTheme[] {
  const themes: TacticalTheme[] = [];
  
  // Check for common tactical patterns
  const moves = chess.moves({ verbose: true });
  
  // Fork detection
  for (const move of moves) {
    if (move.piece === 'n' || move.piece === 'q') {
      // Knight or Queen moves - potential forks
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      // Count attacked valuable pieces
      const attacks = testChess.moves({ verbose: true }).filter(m => m.captured);
      if (attacks.length >= 2) {
        themes.push({
          type: 'fork',
          likelihood: 70,
          targetSquares: [move.to, ...attacks.map(a => a.to)],
          description: `${move.piece.toUpperCase()} fork opportunity on ${move.to}`,
        });
      }
    }
  }
  
  // Check if there's a forcing sequence (high eval change)
  if (Math.abs(analysis.evaluation.score) > 300) {
    themes.push({
      type: 'tactical',
      likelihood: 80,
      targetSquares: [],
      description: 'Forcing tactical sequence available',
    });
  }
  
  // Mating pattern detection
  if (analysis.evaluation.scoreType === 'mate') {
    themes.push({
      type: 'mating_pattern',
      likelihood: 100,
      targetSquares: [],
      description: `Checkmate in ${analysis.evaluation.mateIn} moves`,
    });
  }
  
  return themes;
}

function detectVulnerabilities(chess: Chess): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  
  // Back rank weakness
  const whiteKingRank = findKing(chess, 'w')?.charAt(1);
  const blackKingRank = findKing(chess, 'b')?.charAt(1);
  
  if (whiteKingRank === '1') {
    // Check if back rank is weak
    const backRankPieces = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
    const ownPieces = backRankPieces.filter(sq => {
      const piece = chess.get(sq as Square);
      return piece && piece.color === 'w' && piece.type !== 'k';
    });
    
    if (ownPieces.length >= 3) {
      vulnerabilities.push({
        side: 'white',
        type: 'back_rank',
        severity: 'medium',
        description: 'Potential back rank weakness for White',
      });
    }
  }
  
  if (blackKingRank === '8') {
    const backRankPieces = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
    const ownPieces = backRankPieces.filter(sq => {
      const piece = chess.get(sq as Square);
      return piece && piece.color === 'b' && piece.type !== 'k';
    });
    
    if (ownPieces.length >= 3) {
      vulnerabilities.push({
        side: 'black',
        type: 'back_rank',
        severity: 'medium',
        description: 'Potential back rank weakness for Black',
      });
    }
  }
  
  return vulnerabilities;
}

function classifyPosition(chess: Chess, analysis: PositionAnalysis): PositionType {
  const moveCount = chess.history().length;
  const eval_ = analysis.evaluation.score;
  const board = chess.board();
  
  // Count pieces for endgame detection
  let pieceCount = 0;
  let pawnCount = 0;
  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        pieceCount++;
        if (piece.type === 'p') pawnCount++;
      }
    }
  }
  
  // Opening
  if (moveCount < 10) return 'opening';
  
  // Endgame
  if (pieceCount <= 10) {
    return Math.abs(eval_) > 200 ? 'endgame_winning' : 'endgame_drawing';
  }
  
  // Critical position
  if (Math.abs(eval_) > 500) return 'critical';
  
  // Tactical vs positional
  if (analysis.evaluation.pv.length > 5 && 
      analysis.evaluation.pv.some(m => m.includes('x'))) {
    return 'tactical';
  }
  
  return 'positional';
}

function calculateDynamism(chess: Chess, analysis: PositionAnalysis): number {
  const moves = chess.moves();
  const captures = moves.filter(m => m.includes('x')).length;
  const checks = moves.filter(m => m.includes('+')).length;
  
  // More captures and checks = more dynamic
  const baseScore = (captures * 3 + checks * 5) / moves.length * 100;
  
  // High eval swing in PV = dynamic
  const evalMagnitude = Math.min(Math.abs(analysis.evaluation.score) / 500, 1) * 30;
  
  return Math.min(100, baseScore + evalMagnitude);
}

function findCriticalSquares(chess: Chess, analysis: PositionAnalysis): string[] {
  const critical: string[] = [];
  
  // Best move destination
  if (analysis.bestMove) {
    critical.push(analysis.bestMove.slice(2, 4));
  }
  
  // Center squares that are contested
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const sq of centerSquares) {
    const piece = chess.get(sq as Square);
    if (!piece) {
      // Empty center square - often critical
      critical.push(sq);
    }
  }
  
  return [...new Set(critical)].slice(0, 6);
}

function convertUciToSan(chess: Chess, uci: string): string {
  if (!uci || uci.length < 4) return uci;
  
  try {
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = uci.length > 4 ? uci[4] : undefined;
    
    // Create a copy to test the move
    const testChess = new Chess(chess.fen());
    const move = testChess.move({ from, to, promotion });
    
    return move?.san || uci;
  } catch {
    return uci;
  }
}

function generateMoveReasoning(
  chess: Chess,
  move: string,
  before: PositionAnalysis,
  after: PositionAnalysis
): string[] {
  const reasons: string[] = [];
  
  // Check if it's a capture
  if (move.includes('x')) {
    reasons.push('Captures material');
  }
  
  // Check if it gives check
  if (move.includes('+')) {
    reasons.push('Gives check, forcing response');
  }
  
  // Checkmate
  if (move.includes('#')) {
    reasons.push('Delivers checkmate');
  }
  
  // Castling
  if (move === 'O-O' || move === 'O-O-O') {
    reasons.push('Improves king safety and connects rooks');
  }
  
  // Pawn promotion
  if (move.includes('=')) {
    reasons.push('Promotes pawn to stronger piece');
  }
  
  // Center control
  if (move.includes('d4') || move.includes('d5') || 
      move.includes('e4') || move.includes('e5')) {
    reasons.push('Controls central squares');
  }
  
  // Eval improvement
  const evalDiff = before.evaluation.score - (-after.evaluation.score);
  if (evalDiff > 50) {
    reasons.push('Significantly improves position');
  }
  
  if (reasons.length === 0) {
    reasons.push('Maintains positional advantage');
  }
  
  return reasons;
}

function calculateConfidence(analysis: PositionAnalysis): number {
  // Higher depth = higher confidence
  const depthScore = Math.min(analysis.evaluation.depth / 20, 1) * 40;
  
  // Clear advantage = higher confidence
  const evalScore = Math.min(Math.abs(analysis.evaluation.score) / 200, 1) * 30;
  
  // Longer PV = more confident
  const pvScore = Math.min(analysis.evaluation.pv.length / 10, 1) * 30;
  
  return Math.round(depthScore + evalScore + pvScore);
}

function describeVisualImpact(chess: Chess, move: string): string {
  try {
    chess.move(move);
    const pattern = predictVisualPattern(chess);
    chess.undo();
    
    if (pattern.dominantColor === 'white') {
      return 'Expands White\'s visual territory';
    } else if (pattern.dominantColor === 'black') {
      return 'Expands Black\'s visual territory';
    }
    
    return 'Creates balanced visual tension';
  } catch {
    return 'Alters board dynamics';
  }
}

function describePosition(chess: Chess, eval_: number): string {
  if (chess.isCheckmate()) {
    return 'Checkmate';
  }
  if (chess.isDraw()) {
    return 'Draw';
  }
  
  const absEval = Math.abs(eval_);
  const advantage = eval_ > 0 ? 'White' : 'Black';
  
  if (absEval < 30) return 'Equal position';
  if (absEval < 100) return `Slight ${advantage} advantage`;
  if (absEval < 300) return `Clear ${advantage} advantage`;
  if (absEval < 700) return `Winning for ${advantage}`;
  return `Decisive ${advantage} advantage`;
}

function assessKingSafety(chess: Chess, color: 'w' | 'b'): number {
  const kingSquare = findKing(chess, color);
  if (!kingSquare) return 0;
  
  // Count pieces around king
  const file = kingSquare.charCodeAt(0) - 97;
  const rank = parseInt(kingSquare[1]) - 1;
  
  let safety = 50;
  
  // Pawns in front of king increase safety
  const pawnRank = color === 'w' ? rank + 1 : rank - 1;
  for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
    const sq = (String.fromCharCode(97 + f) + (pawnRank + 1)) as Square;
    const piece = chess.get(sq);
    if (piece && piece.type === 'p' && piece.color === color) {
      safety += 15;
    }
  }
  
  // King in center is less safe in middlegame
  if (file >= 2 && file <= 5 && chess.history().length > 10) {
    safety -= 20;
  }
  
  return Math.max(0, Math.min(100, safety));
}

function findKing(chess: Chess, color: 'w' | 'b'): string | null {
  const board = chess.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.type === 'k' && piece.color === color) {
        return String.fromCharCode(97 + file) + (8 - rank);
      }
    }
  }
  return null;
}

/**
 * Generate alternative analysis lines using multi-PV
 */
async function generateAlternativeLines(
  fen: string,
  chess: Chess,
  count: number,
  depth: number
): Promise<PredictedLine[]> {
  const engine = getStockfishEngine();
  const alternatives: PredictedLine[] = [];
  
  // Get all legal moves
  const legalMoves = chess.moves({ verbose: true });
  
  // Sort by capture value (prioritize captures)
  const sortedMoves = legalMoves.sort((a, b) => {
    const aValue = a.captured ? getPieceValue(a.captured) : 0;
    const bValue = b.captured ? getPieceValue(b.captured) : 0;
    return bValue - aValue;
  });
  
  // Analyze top candidate moves
  const candidates = sortedMoves.slice(0, Math.min(count + 1, sortedMoves.length));
  
  // Skip the best move (already in principal variation)
  for (let i = 1; i < candidates.length && alternatives.length < count; i++) {
    const move = candidates[i];
    
    try {
      const testChess = new Chess(fen);
      testChess.move(move.san);
      
      const analysis = await engine.analyzePosition(testChess.fen(), { 
        depth: depth - 2, 
        nodes: 50000 
      });
      
      const line = await buildPredictedLine(
        testChess.fen(),
        analysis.evaluation.pv,
        analysis.evaluation.score,
        analysis.evaluation.scoreType === 'mate',
        analysis.evaluation.mateIn
      );
      
      line.moves.unshift(move.san);
      alternatives.push(line);
    } catch (error) {
      console.warn(`[PredictiveAnalysis] Failed to analyze alternative ${move.san}:`, error);
    }
  }
  
  return alternatives;
}

/**
 * Get piece value for move prioritization
 */
function getPieceValue(piece: string): number {
  const values: Record<string, number> = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
  };
  return values[piece.toLowerCase()] || 0;
}

// Default export
export default analyzePositionPotential;
