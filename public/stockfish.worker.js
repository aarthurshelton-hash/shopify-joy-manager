/**
 * Stockfish Web Worker - Fallback Status
 * 
 * This worker reports that local WASM loading is unavailable
 * and suggests using the Lichess Cloud API instead.
 */

let isReady = false;

function postStatus(message) {
  self.postMessage({ type: 'status', data: message });
}

function postError(message) {
  self.postMessage({ type: 'error', data: message });
}

// Handle messages from main thread
self.onmessage = function(e) {
  // If we get any message before ready, queue it
  if (!isReady) {
    postStatus('Local Stockfish WASM unavailable - use Lichess Cloud API');
    return;
  }
};

// Report status immediately
postStatus('Local Stockfish WASM loading...');
postError('Local WASM requires same-origin files. Use Lichess Cloud API for Stockfish 17 analysis.');
