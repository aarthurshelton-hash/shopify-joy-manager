/**
 * Lichess Cloud Evaluation API (via Edge Function)
 * 
 * Uses Lichess's cloud evaluation service which runs Stockfish 17 NNUE.
 * Proxied through Edge Function to avoid CORS issues in production.
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

// Rate limiting state (local tracking)
let rateLimitResetTime = 0;

export function getRateLimitStatus(): { isLimited: boolean; resetInMs: number } {
  const now = Date.now();
  if (rateLimitResetTime > now) {
    return { isLimited: true, resetInMs: rateLimitResetTime - now };
  }
  return { isLimited: false, resetInMs: 0 };
}

// Edge function endpoint
const getEdgeFunctionUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return `${url}/functions/v1/lichess-cloud-eval`;
};

const getHeaders = () => {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'apikey': key
  };
};

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
 * Evaluate a position using Lichess Cloud Eval (Stockfish 17) via Edge Function
 */
export async function evaluatePosition(fen: string, multiPv: number = 1): Promise<PositionEvaluation | null> {
  try {
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fen, multiPv })
    });
    
    if (response.status === 429) {
      const data = await response.json();
      if (data.resetInMs) {
        rateLimitResetTime = Date.now() + data.resetInMs;
      }
      console.warn('[LichessCloud] Rate limited');
      return null;
    }
    
    if (!response.ok) {
      console.error('[LichessCloud] API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.notFound) {
      console.log('[LichessCloud] Position not in database:', fen);
      return null;
    }
    
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
 * Check if Lichess API is available via Edge Function
 */
export async function checkLichessAvailability(): Promise<{ available: boolean; rateLimited: boolean; resetInMs?: number }> {
  // Check if we're currently rate limited locally
  const limitStatus = getRateLimitStatus();
  if (limitStatus.isLimited) {
    return { available: false, rateLimited: true, resetInMs: limitStatus.resetInMs };
  }
  
  try {
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'check' })
    });
    
    if (!response.ok) {
      return { available: false, rateLimited: false };
    }
    
    const data = await response.json();
    
    if (data.rateLimited && data.resetInMs) {
      rateLimitResetTime = Date.now() + data.resetInMs;
    }
    
    return { 
      available: data.available, 
      rateLimited: data.rateLimited || false,
      resetInMs: data.resetInMs 
    };
  } catch (error) {
    console.error('[LichessCloud] Availability check error:', error);
    return { available: false, rateLimited: false };
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
