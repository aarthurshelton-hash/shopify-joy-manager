"""
En Pensent — Maia-2 Inference Service
============================================================================

A lightweight HTTP server that loads Maia-2 once and serves expected-score
inference requests. This bridges the Python Maia-2 model to the TypeScript
prediction engine and the benchmark harness.

Endpoints:
  GET  /health        — health check
  POST /infer         — infer Maia-2 expected score for a position

POST /infer body:
  {
    "fen": "...",           — FEN of the position
    "white_elo": 1855,      — optional, default 1500
    "black_elo": 1894       — optional, default 1500
  }

POST /infer response:
  {
    "white_expected_score": 0.62,   — Maia-2 White-perspective score [0,1]
    "predicted_outcome": "white_wins",  — thresholded W/D/L
    "confidence": 0.62,              — confidence in predicted outcome
    "latency_ms": 42
  }

Usage:
  source .venv-bench/bin/activate
  python benchmark/src/maia_service.py --port 3002

  # Test:
  curl -X POST http://localhost:3002/infer \
    -H "Content-Type: application/json" \
    -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}'
============================================================================
"""

import argparse
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

# Maia-2 will be loaded lazily on first request so the server starts fast.
_maia_model = None
_prepared = None


def load_maia(device="auto"):
    global _maia_model, _prepared
    if _maia_model is not None:
        return
    print(f"Loading Maia-2 (device={device})...", flush=True)
    from maia2 import model, inference
    t0 = time.time()
    _maia_model = model.from_pretrained(type="rapid", device=device)
    _prepared = inference.prepare()
    print(f"Maia-2 loaded in {time.time()-t0:.1f}s", flush=True)


def infer_position(fen, white_elo=1500, black_elo=1500):
    """Run Maia-2 inference on a single position."""
    from maia2 import inference

    load_maia()
    # Determine active color from FEN
    active_is_white = " w " in fen
    elo_self = white_elo if active_is_white else black_elo
    elo_oppo = black_elo if active_is_white else white_elo

    move_probs, white_score = inference.inference_each(
        _maia_model, _prepared, fen, elo_self, elo_oppo
    )

    # Threshold white_score to W/D/L
    # white_score: 0 = black wins, 0.5 = draw, 1 = white wins
    if white_score > 0.6:
        outcome = "white_wins"
        conf = white_score
    elif white_score < 0.4:
        outcome = "black_wins"
        conf = 1.0 - white_score
    else:
        outcome = "draw"
        conf = 1.0 - abs(white_score - 0.5) * 2.0

    return {
        "white_expected_score": float(white_score),
        "predicted_outcome": outcome,
        "confidence": float(conf),
    }


class MaiaHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._send_json({
                "status": "ok",
                "service": "maia2-inference",
                "model_loaded": _maia_model is not None,
            })
        else:
            self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        if self.path != "/infer":
            self._send_json({"error": "Not found"}, 404)
            return

        t0 = time.time()
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            fen = body.get("fen")
            if not fen:
                self._send_json({"error": "Missing 'fen' field"}, 400)
                return

            result = infer_position(
                fen,
                white_elo=body.get("white_elo", 1500),
                black_elo=body.get("black_elo", 1500),
            )
            result["latency_ms"] = int((time.time() - t0) * 1000)
            self._send_json(result)
        except Exception as e:
            self._send_json({
                "error": str(e),
                "latency_ms": int((time.time() - t0) * 1000),
            }, 500)

    def log_message(self, fmt, *args):
        # Suppress default request logging; print only errors
        if args and "500" in str(args[0]):
            print(f"[Maia-2] {fmt % args}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Maia-2 inference service")
    parser.add_argument("--port", type=int, default=3002)
    parser.add_argument("--device", type=str, default="auto",
                        help="auto, cpu, mps, cuda")
    parser.add_argument("--preload", action="store_true",
                        help="Preload model at startup")
    args = parser.parse_args()

    if args.preload:
        load_maia(args.device)

    server = HTTPServer(("127.0.0.1", args.port), MaiaHandler)
    print(f"Maia-2 inference service on http://127.0.0.1:{args.port}", flush=True)
    print(f"  Endpoints: GET /health | POST /infer", flush=True)
    print(f"  Device: {args.device}", flush=True)
    print(f"  Preloaded: {_maia_model is not None}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
