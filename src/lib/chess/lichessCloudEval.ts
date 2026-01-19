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
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3500; // 3.5s between requests (stays under 20/min limit)

// In-memory cache for evaluated positions
const positionCache = new Map<string, PositionEvaluation>();
const CACHE_MAX_SIZE = 500;

export function getRateLimitStatus(): { isLimited: boolean; resetInMs: number } {
  const now = Date.now();
  if (rateLimitResetTime > now) {
    return { isLimited: true, resetInMs: rateLimitResetTime - now };
  }
  return { isLimited: false, resetInMs: 0 };
}

/**
 * Throttle requests to stay under rate limit
 */
async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Get cached evaluation if available
 */
export function getCachedEvaluation(fen: string): PositionEvaluation | null {
  return positionCache.get(fen) || null;
}

/**
 * Cache an evaluation result
 */
function cacheEvaluation(fen: string, evaluation: PositionEvaluation): void {
  // Evict oldest entries if cache is full
  if (positionCache.size >= CACHE_MAX_SIZE) {
    const firstKey = positionCache.keys().next().value;
    if (firstKey) positionCache.delete(firstKey);
  }
  positionCache.set(fen, evaluation);
}

/**
 * Clear the position cache
 */
export function clearEvaluationCache(): void {
  positionCache.clear();
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
 * Includes throttling and caching for rate limit management
 */
export async function evaluatePosition(fen: string, multiPv: number = 1, skipCache: boolean = false): Promise<PositionEvaluation | null> {
  // Check cache first
  if (!skipCache) {
    const cached = getCachedEvaluation(fen);
    if (cached) {
      console.log('[LichessCloud] Cache hit for position');
      return cached;
    }
  }
  
  // Check if we're rate limited
  const limitStatus = getRateLimitStatus();
  if (limitStatus.isLimited) {
    console.warn(`[LichessCloud] Rate limited, ${Math.ceil(limitStatus.resetInMs / 1000)}s remaining`);
    return null;
  }
  
  try {
    // Throttle to stay under rate limit
    await throttleRequest();
    
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fen, multiPv })
    });
    
    if (response.status === 429) {
      const data = await response.json();
      const resetMs = data.resetInMs || 60000; // Default 60s if not provided
      rateLimitResetTime = Date.now() + resetMs;
      console.warn(`[LichessCloud] Rate limited, reset in ${Math.ceil(resetMs / 1000)}s`);
      return null;
    }
    
    if (!response.ok) {
      console.error('[LichessCloud] API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.notFound) {
      console.log('[LichessCloud] Position not in database:', fen.substring(0, 40));
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
    
    const result: PositionEvaluation = {
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
    
    // Cache the result
    cacheEvaluation(fen, result);
    
    return result;
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
