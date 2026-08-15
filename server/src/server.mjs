/**
 * En Pensent Prediction API — Standalone Node Server
 * ============================================================================
 *
 * A self-hostable Express-style server (using Node's built-in http module,
 * zero external dependencies) that exposes the same prediction endpoints as
 * the Vercel serverless functions. Suitable for on-prem deployment, PM2
 * management, or customers who need a dedicated instance.
 *
 * Endpoints:
 *   GET  /health         — health check
 *   POST /predict        — chess outcome prediction
 *   GET  /               — API docs (JSON)
 *
 * Configuration (env vars):
 *   EP_API_KEY     — Bearer token for auth (if unset, demo mode)
 *   EP_PORT        — port to listen on (default 3001)
 *   EP_RATE_LIMIT  — requests per minute per IP (default 60)
 *
 * Usage:
 *   node server/src/server.mjs
 *   EP_API_KEY=secret EP_PORT=3001 node server/src/server.mjs
 *
 * PM2:
 *   pm2 start server/src/server.mjs --name ep-api
 *
 * ============================================================================
 */

import http from 'http';
import { simulateGame } from '../../src/lib/chess/gameSimulator';
import { extractColorFlowSignature } from '../../src/lib/chess/colorFlowAnalysis/signatureExtractor';
import { predictFromColorFlow } from '../../src/lib/chess/colorFlowAnalysis/predictionEngine';

const PORT = parseInt(process.env.EP_PORT || '3001', 10);
const API_KEY = process.env.EP_API_KEY || null;
const RATE_LIMIT = parseInt(process.env.EP_RATE_LIMIT || '60', 10);
const BURST = 10;

// --- Rate limiter ---
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

function checkRateLimit(ip) {
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

function checkAuth(req) {
  if (!API_KEY) return true;
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === API_KEY;
}

function sendJSON(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-EP-Version': 'ep-v8.07',
  });
  res.end(body);
}

async function handlePredict(req, res) {
  const t0 = Date.now();

  // Read body
  let body = '';
  for await (const chunk of req) body += chunk;
  if (!body) return sendJSON(res, { error: 'Empty request body.' }, 400);

  let data;
  try { data = JSON.parse(body); }
  catch { return sendJSON(res, { error: 'Invalid JSON body.' }, 400); }

  const { pgn, stockfish_eval_cp, stockfish_depth, white_elo, black_elo } = data;
  if (!pgn || typeof pgn !== 'string') {
    return sendJSON(res, { error: 'Missing required field: pgn (string).' }, 400);
  }

  try {
    const simulation = simulateGame(pgn);
    if (!simulation || !simulation.board) {
      return sendJSON(res, { error: 'Failed to parse PGN.' }, 400);
    }

    const totalMoves = simulation.moves?.length || 0;
    if (totalMoves < 12) {
      return sendJSON(res, {
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

    const signature = extractColorFlowSignature(simulation.board, gameData, totalMoves);
    const sfEval = typeof stockfish_eval_cp === 'number' ? stockfish_eval_cp : 0;
    const sfDepth = typeof stockfish_depth === 'number' ? stockfish_depth : 18;
    const avgRating = ((white_elo || 1500) + (black_elo || 1500)) / 2;

    const prediction = predictFromColorFlow(signature, totalMoves, sfEval, sfDepth, null, avgRating);
    const pred = prediction.prediction || 'unknown';
    const conf = prediction.confidence || 0.5;

    const probs = {
      white_wins: pred === 'white_wins' ? conf : (1 - conf) / 2,
      black_wins: pred === 'black_wins' ? conf : (1 - conf) / 2,
      draw: pred === 'draw' ? conf : (1 - conf) / 2,
    };

    return sendJSON(res, {
      prediction: pred,
      confidence: Math.round(conf * 100) / 100,
      probabilities: {
        white_wins: Math.round(probs.white_wins * 1000) / 1000,
        black_wins: Math.round(probs.black_wins * 1000) / 1000,
        draw: Math.round(probs.draw * 1000) / 1000,
      },
      archetype: signature.archetype || 'unknown',
      move_number: totalMoves,
      latency_ms: Date.now() - t0,
      model_version: 'ep-v8.07',
      calibrated: false,
    });
  } catch (err) {
    return sendJSON(res, {
      error: 'Prediction failed.',
      detail: err?.message || String(err),
      latency_ms: Date.now() - t0,
    }, 500);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    return sendJSON(res, {
      status: 'ok',
      service: 'en-pensent-prediction-api',
      version: 'ep-v8.07',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  if (url.pathname === '/' && req.method === 'GET') {
    return sendJSON(res, {
      name: 'En Pensent Prediction API',
      version: 'ep-v8.07',
      endpoints: {
        'GET /health': 'Health check',
        'POST /predict': 'Chess outcome prediction (requires PGN)',
        'GET /': 'This documentation',
      },
      predict_request: {
        pgn: 'string (required) — PGN of the game so far',
        stockfish_eval_cp: 'number (optional) — Stockfish eval in centipawns',
        stockfish_depth: 'number (optional, default 18)',
        white_elo: 'number (optional, default 1500)',
        black_elo: 'number (optional, default 1500)',
      },
      predict_response: {
        prediction: 'white_wins | black_wins | draw',
        confidence: 'number (0-1)',
        probabilities: '{ white_wins, black_wins, draw }',
        archetype: 'string — strategic archetype classification',
        move_number: 'number — current move count',
        latency_ms: 'number — processing time',
        model_version: 'string',
        calibrated: 'boolean — whether probabilities are calibrated',
      },
      auth: API_KEY ? 'Bearer token required (EP_API_KEY set)' : 'demo mode (no auth)',
      rate_limit: `${RATE_LIMIT} requests/minute per IP`,
    });
  }

  if (url.pathname === '/predict' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return sendJSON(res, { error: 'Rate limit exceeded.' }, 429);
    }
    if (!checkAuth(req)) {
      return sendJSON(res, { error: 'Invalid or missing API key.' }, 401);
    }
    return handlePredict(req, res);
  }

  sendJSON(res, { error: 'Not found.', path: url.pathname }, 404);
});

server.listen(PORT, () => {
  console.log(`En Pensent Prediction API running on http://localhost:${PORT}`);
  console.log(`  Auth: ${API_KEY ? 'Bearer token (EP_API_KEY set)' : 'demo mode (no auth)'}`);
  console.log(`  Rate limit: ${RATE_LIMIT}/min per IP`);
  console.log(`  Endpoints: GET / | GET /health | POST /predict`);
});
