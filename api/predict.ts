/**
 * En Pensent Prediction API — Vercel Serverless Function
 * ============================================================================
 *
 * POST /api/predict
 *
 * Accepts a chess position (PGN + optional Stockfish eval) and returns
 * En Pensent's 3-way outcome prediction (white_wins / black_wins / draw)
 * with confidence, archetype, and calibration-aware probability estimates.
 *
 * Request body (JSON):
 *   {
 *     "pgn": "1. e4 e5 2. Nf3 ...",     // required: PGN of the game so far
 *     "stockfish_eval_cp": 107,          // optional: SF eval in centipawns
 *     "stockfish_depth": 18,             // optional: SF search depth
 *     "white_elo": 1855,                 // optional: affects calibration
 *     "black_elo": 1894                  // optional: affects calibration
 *   }
 *
 * Response (JSON):
 *   {
 *     "prediction": "white_wins",
 *     "confidence": 0.55,
 *     "probabilities": { "white_wins": 0.55, "black_wins": 0.30, "draw": 0.15 },
 *     "archetype": "piece_knight_maneuver",
 *     "move_number": 22,
 *     "latency_ms": 42,
 *     "model_version": "ep-v8.07",
 *     "calibrated": false
 *   }
 *
 * Authentication:
 *   Bearer token via EP_API_KEY env var. If not set, runs in demo mode
 *   (rate-limited, no auth required).
 *
 * Rate limiting:
 *   In-memory per-IP token bucket. For production, use Upstash Redis.
 *
 * ============================================================================
 */

import { simulateGame } from '../src/lib/chess/gameSimulator';
import { extractColorFlowSignature } from '../src/lib/chess/colorFlowAnalysis/signatureExtractor';
import { predictFromColorFlow } from '../src/lib/chess/colorFlowAnalysis/predictionEngine';
import { fusePredictions, fetchMaiaSignal, isotonicCalibrate, type MaiaSignal } from '../src/lib/chess/colorFlowAnalysis/maiaFusion';

// --- Rate limiter (in-memory token bucket, per-IP) ---
const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT = 60;       // requests per minute
const BURST = 10;            // max burst

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: BURST, lastRefill: now };
    buckets.set(ip, bucket);
  }
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(BURST, bucket.tokens + elapsed * (RATE_LIMIT / 60));
  bucket.lastRefill = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

// --- Auth ---
function checkAuth(req: Request): boolean {
  const apiKey = process.env.EP_API_KEY;
  if (!apiKey) return true; // demo mode — no auth
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === apiKey;
}

export const config = {
  maxDuration: 30,
};

export default async function handler(req: Request): Promise<Response> {
  const t0 = Date.now();

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405);
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return json({ error: 'Rate limit exceeded. Max 60 requests/minute.' }, 429);
  }

  // Auth
  if (!checkAuth(req)) {
    return json({ error: 'Invalid or missing API key.' }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { pgn, stockfish_eval_cp, stockfish_depth, white_elo, black_elo, maia_score, use_fusion } = body;

  if (!pgn || typeof pgn !== 'string') {
    return json({ error: 'Missing required field: pgn (string).' }, 400);
  }

  try {
    // 1. Simulate the game to build the color-flow board
    const simulation = simulateGame(pgn);
    if (!simulation || !simulation.board) {
      return json({ error: 'Failed to parse PGN.' }, 400);
    }

    // 2. Extract the color flow signature
    const totalMoves = simulation.moves?.length || 0;
    if (totalMoves < 12) {
      return json({
        prediction: null,
        confidence: 0,
        probabilities: { white_wins: 0.33, black_wins: 0.33, draw: 0.34 },
        archetype: 'opening',
        move_number: totalMoves,
        latency_ms: Date.now() - t0,
        model_version: 'ep-v8.07',
        note: 'Insufficient moves for prediction (minimum 12 required).',
      });
    }

    const gameData = {
      white: white_elo ? String(white_elo) : '1500',
      black: black_elo ? String(black_elo) : '1500',
    };

    const signature = extractColorFlowSignature(
      simulation.board,
      gameData as any,
      totalMoves
    );

    // 3. Run the prediction (v8.07 base)
    const sfEval = typeof stockfish_eval_cp === 'number' ? stockfish_eval_cp : 0;
    const sfDepth = typeof stockfish_depth === 'number' ? stockfish_depth : 18;
    const avgRating = ((white_elo || 1500) + (black_elo || 1500)) / 2;

    const prediction = predictFromColorFlow(
      signature,
      totalMoves,
      sfEval,
      sfDepth,
      null,
      avgRating
    );

    // 4. v9.0 FUSION: If Maia signal is available, fuse with EP + SF
    const useFusion = use_fusion !== false; // default: true
    let maiaSignal: MaiaSignal | null = null;

    if (useFusion) {
      if (typeof maia_score === 'number') {
        // Caller provided Maia score directly
        maiaSignal = {
          whiteExpectedScore: maia_score,
          predictedOutcome: maia_score > 0.55 ? 'white_wins' : maia_score < 0.45 ? 'black_wins' : 'draw',
          confidence: Math.abs(maia_score - 0.5) * 2,
        };
      } else {
        // Try to fetch from local Maia service (graceful degradation)
        const fen = simulation.fen || '';
        if (fen) {
          maiaSignal = await fetchMaiaSignal(fen, white_elo || 1500, black_elo || 1500);
        }
      }
    }

    // 6. Format response
    if (useFusion && maiaSignal) {
      // v9.0 fusion path
      const epPredStr = prediction.prediction === 'white' ? 'white_wins'
        : prediction.prediction === 'black' ? 'black_wins' : 'draw';
      const epConf = (prediction.confidence || 50) / 100;
      const archetypeAcc = 0.604; // default; could be looked up from ARCHETYPE_HISTORICAL_ACCURACY
      const is960 = false; // could be determined from game metadata

      const fused = fusePredictions(
        epPredStr, epConf, signature.archetype || 'unknown',
        archetypeAcc, maiaSignal, sfEval, totalMoves, is960
      );

      return json({
        prediction: fused.prediction,
        confidence: fused.calibratedConfidence,
        probabilities: fused.probabilities,
        archetype: signature.archetype || 'unknown',
        move_number: totalMoves,
        latency_ms: Date.now() - t0,
        model_version: fused.modelVersion,
        calibrated: true,
        fusion: {
          weights: fused.fusionWeights,
          signals: fused.signals,
          agreement: fused.agreementLevel,
        },
      });
    }

    // v8.07 fallback (no Maia available)
    const pred = prediction.prediction === 'white' ? 'white_wins'
      : prediction.prediction === 'black' ? 'black_wins' : 'draw';
    const conf = (prediction.confidence || 50) / 100;
    const calibratedConf = isotonicCalibrate(conf);

    const probs = {
      white_wins: pred === 'white_wins' ? calibratedConf : (1 - calibratedConf) / 2,
      black_wins: pred === 'black_wins' ? calibratedConf : (1 - calibratedConf) / 2,
      draw: pred === 'draw' ? calibratedConf : (1 - calibratedConf) / 2,
    };

    return json({
      prediction: pred,
      confidence: Math.round(calibratedConf * 100) / 100,
      probabilities: {
        white_wins: Math.round(probs.white_wins * 1000) / 1000,
        black_wins: Math.round(probs.black_wins * 1000) / 1000,
        draw: Math.round(probs.draw * 1000) / 1000,
      },
      archetype: signature.archetype || 'unknown',
      move_number: totalMoves,
      latency_ms: Date.now() - t0,
      model_version: 'ep-v9.0-fusion (fallback: isotonic only)',
      calibrated: true,
    });
  } catch (err: any) {
    return json({
      error: 'Prediction failed.',
      detail: err?.message || String(err),
      latency_ms: Date.now() - t0,
    }, 500);
  }
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-EP-Version': 'ep-v8.07',
    },
  });
}
