/**
 * Lichess Cloud Evaluation API
 * 
 * Uses Lichess's cloud evaluation service which runs Stockfish 17 NNUE.
 * This provides reliable, high-quality analysis without local WASM issues.
 * 
 * API: https://lichess.org/api#tag/Analysis/operation/apiCloudEval
 * 
 * Rate limits: 
 * - Anonymous: 20 requests/minute
 * - With token: 100 requests/minute
 */

import { Chess } from 'chess.js';

export interface CloudEvaluation {
  fen: string;
  knodes: number;
  depth: number;
  pvs: Array<{
    moves: string;
    cp?: number;
    mate?: number;
  }>;
}

export interface PositionEvaluation {
  fen: string;
  bestMove: string;
  bestMoveSan: string;
  evaluation: number; // Centipawns
  isMate: boolean;
  mateIn?: number;
  depth: number;
  pv: string[];
  winProbability: number;
}

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests (20/min safe limit)

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Convert centipawns to win probability (Lichess formula)
 */
function cpToWinProbability(cp: number): number {
  const K = 0.00368208;
  return 50 + 50 * (2 / (1 + Math.exp(-K * cp)) - 1);
}

/**
 * Convert UCI move to SAN
 */
function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci.slice(4) : undefined;
    
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/**
 * Evaluate a position using Lichess Cloud Eval (Stockfish 17)
 */
export async function evaluatePosition(fen: string, multiPv: number = 1): Promise<PositionEvaluation | null> {
  try {
    // Normalize FEN for API (remove move clocks for cache hits)
    const fenParts = fen.split(' ');
    const normalizedFen = fenParts.slice(0, 4).join(' ');
    
    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`;
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Position not in cloud database - that's okay
        console.log('[LichessCloud] Position not in database:', fen);
        return null;
      }
      throw new Error(`Lichess API error: ${response.status}`);
    }
    
    const data: CloudEvaluation = await response.json();
    
    if (!data.pvs || data.pvs.length === 0) {
      return null;
    }
    
    const mainLine = data.pvs[0];
    const moves = mainLine.moves.split(' ');
    const bestMoveUci = moves[0];
    
    const isMate = mainLine.mate !== undefined;
    const evaluation = isMate ? (mainLine.mate! > 0 ? 10000 : -10000) : (mainLine.cp || 0);
    
    return {
      fen: data.fen,
      bestMove: bestMoveUci,
      bestMoveSan: uciToSan(fen, bestMoveUci),
      evaluation,
      isMate,
      mateIn: mainLine.mate,
      depth: data.depth,
      pv: moves,
      winProbability: cpToWinProbability(evaluation),
    };
  } catch (error) {
    console.error('[LichessCloud] Evaluation error:', error);
    return null;
  }
}

/**
 * Batch evaluate multiple positions
 * Returns evaluations in order, with null for unavailable positions
 */
export async function evaluatePositions(
  fens: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<(PositionEvaluation | null)[]> {
  const results: (PositionEvaluation | null)[] = [];
  
  for (let i = 0; i < fens.length; i++) {
    const result = await evaluatePosition(fens[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, fens.length);
    }
  }
  
  return results;
}

/**
 * Check if Lichess API is available
 */
export async function checkLichessAvailability(): Promise<boolean> {
  try {
    // Test with starting position (always in database)
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = await evaluatePosition(startingFen);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Get evaluation for a position at a specific move in a game
 */
export async function evaluateGamePosition(
  pgn: string,
  moveNumber: number
): Promise<PositionEvaluation | null> {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    
    const history = chess.history();
    
    // Reset and play up to the specified move
    chess.reset();
    
    const movesToPlay = Math.min(moveNumber, history.length);
    for (let i = 0; i < movesToPlay; i++) {
      chess.move(history[i]);
    }
    
    return evaluatePosition(chess.fen());
  } catch (error) {
    console.error('[LichessCloud] Game position error:', error);
    return null;
  }
}
