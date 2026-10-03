/**
 * En Pensent Archetype API — Vercel Serverless Function
 * ============================================================================
 *
 * POST /api/archetype
 *
 * Classifies a game's strategic archetype (and its phase-by-phase
 * evolution) from a PGN — no engine eval required. This is the public
 * integration point for community tools that want En Pensent's
 * "what kind of game is this" signal.
 *
 * Request body (JSON):
 *   {
 *     "pgn": "1. e4 e5 2. Nf3 ..."       // required: PGN (full or partial)
 *   }
 *
 * Response (JSON):
 *   {
 *     "archetype": "kingside_attack",
 *     "archetype_name": "Kingside Attack",
 *     "dominant_side": "white",
 *     "intensity": 67.4,
 *     "flow_direction": "kingside",
 *     "move_number": 34,
 *     "phases": [ { "through_move": 10, "archetype": "..." }, ... ],
 *     "transitions": [ { "from": "...", "to": "...", "around_move": 20 } ],
 *     "latency_ms": 18
 *   }
 *
 * Authentication:
 *   Bearer token via EP_API_KEY env var. If not set, runs in demo mode
 *   (rate-limited, no auth required).
 *
 * ============================================================================
 */

import { simulateGame, truncateBoardToMove } from '../src/lib/chess/gameSimulator';
import { extractColorFlowSignature } from '../src/lib/chess/colorFlowAnalysis/signatureExtractor';
import { ARCHETYPE_DEFINITIONS } from '../src/lib/chess/colorFlowAnalysis/archetypeDefinitions';
import type { StrategicArchetype } from '../src/lib/chess/colorFlowAnalysis/types';

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

function archetypeName(id: StrategicArchetype): string {
  const def = (ARCHETYPE_DEFINITIONS as Record<string, { name?: string }>)[id];
  if (def?.name) return def.name;
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const config = {
  maxDuration: 30,
};

export default async function handler(req: Request): Promise<Response> {
  const t0 = Date.now();

  if (req.method === 'OPTIONS') {
    return json({}, 204);
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return json({ error: 'Rate limit exceeded. Max 60 requests/minute.' }, 429);
  }

  if (!checkAuth(req)) {
    return json({ error: 'Invalid or missing API key.' }, 401);
  }

  let body: { pgn?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const pgn = body.pgn;
  if (!pgn || typeof pgn !== 'string') {
    return json({ error: 'Missing required field: pgn (string).' }, 400);
  }

  try {
    const simulation = simulateGame(pgn);
    const { board, gameData, totalMoves } = simulation;

    if (totalMoves < 10) {
      return json({
        archetype: null,
        move_number: totalMoves,
        latency_ms: Date.now() - t0,
        note: 'Insufficient moves for classification (minimum 10 required).',
      });
    }

    // Phase evolution: signature at strategic checkpoints
    const checkpoints = [10, 20, 30, 45]
      .filter((m) => m < totalMoves)
      .concat([totalMoves]);

    const phases = checkpoints.map((throughMove) => {
      const truncated =
        throughMove >= totalMoves ? board : truncateBoardToMove(board, throughMove);
      const sig = extractColorFlowSignature(truncated, gameData, throughMove);
      return { through_move: throughMove, archetype: sig.archetype };
    });

    const transitions: Array<{ from: string; to: string; around_move: number }> = [];
    for (let i = 1; i < phases.length; i++) {
      const prev = phases[i - 1];
      const cur = phases[i];
      if (
        prev.archetype !== cur.archetype &&
        prev.archetype !== 'unknown' &&
        cur.archetype !== 'unknown'
      ) {
        transitions.push({ from: prev.archetype, to: cur.archetype, around_move: cur.through_move });
      }
    }

    const signature = extractColorFlowSignature(board, gameData, totalMoves);
    const def = (ARCHETYPE_DEFINITIONS as Record<string, { historicalWinRate?: number }>)[
      signature.archetype
    ];

    return json({
      archetype: signature.archetype,
      archetype_name: archetypeName(signature.archetype),
      dominant_side: signature.dominantSide,
      intensity: Math.round(signature.intensity * 10) / 10,
      flow_direction: signature.flowDirection,
      baseline_win_rate: def?.historicalWinRate ?? null,
      move_number: totalMoves,
      phases,
      transitions,
      latency_ms: Date.now() - t0,
    });
  } catch (err) {
    return json({
      error: 'Classification failed.',
      detail: err instanceof Error ? err.message : String(err),
      latency_ms: Date.now() - t0,
    }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-EP-Version': 'ep-api-v1',
    },
  });
}
