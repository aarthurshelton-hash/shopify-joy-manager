/**
 * Stockfish Web Worker - Local Engine
 * Uses locally bundled stockfish.js (no CORS issues)
 */

let engine = null;

// Import local stockfish engine (same origin = no CORS)
try {
  importScripts('./stockfish-engine.js');
  
  if (typeof STOCKFISH === 'function') {
    engine = STOCKFISH();
    
    engine.addMessageListener(function(msg) {
      self.postMessage({ type: 'uci', data: msg });
      if (msg === 'uciok') {
        self.postMessage({ type: 'ready' });
      }
    });
    
    // Initialize UCI protocol
    engine.postMessage('uci');
    self.postMessage({ type: 'status', data: 'Stockfish 10 loaded!' });
  } else {
    self.postMessage({ type: 'error', data: 'STOCKFISH function not found' });
  }
} catch (err) {
  self.postMessage({ type: 'error', data: 'Failed to load engine: ' + err.message });
}

// Handle commands from main thread
self.onmessage = function(e) {
  if (!engine) {
    self.postMessage({ type: 'error', data: 'Engine not ready' });
    return;
  }
  
  const { command, options } = e.data;
  let cmd = command;
  
  if (command === 'position') {
    if (options && options.fen) {
      cmd = 'position fen ' + options.fen;
    } else if (options && options.startpos) {
      cmd = options.moves ? 'position startpos moves ' + options.moves : 'position startpos';
    }
  } else if (command === 'go') {
    cmd = 'go';
    if (options && options.depth) cmd += ' depth ' + options.depth;
    if (options && options.movetime) cmd += ' movetime ' + options.movetime;
    if (options && options.nodes) cmd += ' nodes ' + options.nodes;
    if (options && options.infinite) cmd += ' infinite';
  } else if (command === 'setoption') {
    if (options && options.name) {
      cmd = 'setoption name ' + options.name + ' value ' + options.value;
    }
  }
  
  engine.postMessage(cmd);
};
