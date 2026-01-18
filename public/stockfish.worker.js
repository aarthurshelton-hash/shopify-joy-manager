/**
 * Stockfish Web Worker - Minimal Implementation
 * Uses stockfish.js lite single-threaded version (no CORS required)
 */

// The stockfish lite single-threaded version works without SharedArrayBuffer/CORS
const STOCKFISH_CDN = 'https://cdn.jsdelivr.net/npm/stockfish@17.1.0/src/stockfish-17.1-lite-single-03e3232.js';

let engine = null;
let ready = false;

// Simple message handler
function handleMessage(msg) {
  self.postMessage({ type: 'uci', data: msg });
  if (msg === 'uciok') {
    ready = true;
    self.postMessage({ type: 'ready' });
  }
}

// Initialize using importScripts (works in classic workers)
async function init() {
  try {
    self.postMessage({ type: 'status', data: 'Loading Stockfish 17 Lite...' });
    
    // Classic worker can use importScripts
    importScripts(STOCKFISH_CDN);
    
    // After import, Stockfish should be available
    if (typeof Stockfish === 'function') {
      engine = await Stockfish();
      
      if (engine.addMessageListener) {
        engine.addMessageListener(handleMessage);
      } else if (typeof engine.listen === 'function') {
        engine.listen(handleMessage);
      } else {
        // Direct postMessage style
        const origPost = engine.postMessage.bind(engine);
        engine.onmessage = (e) => handleMessage(typeof e === 'string' ? e : e.data);
      }
      
      engine.postMessage('uci');
      self.postMessage({ type: 'status', data: 'Stockfish 17 Lite ready!' });
      return;
    }
    
    // Fallback - STOCKFISH global
    if (typeof STOCKFISH === 'function') {
      engine = STOCKFISH();
      engine.addMessageListener(handleMessage);
      engine.postMessage('uci');
      self.postMessage({ type: 'status', data: 'Stockfish ready!' });
      return;
    }
    
    throw new Error('Stockfish function not found after import');
  } catch (err) {
    console.error('Stockfish init error:', err);
    self.postMessage({ type: 'error', data: 'Failed to load: ' + err.message });
  }
}

init();

// Handle commands from main thread
self.onmessage = function(e) {
  if (!engine) {
    self.postMessage({ type: 'error', data: 'Engine not initialized' });
    return;
  }
  
  const { command, options } = e.data;
  let cmd = command;
  
  if (command === 'position') {
    if (options?.fen) {
      cmd = `position fen ${options.fen}`;
    } else if (options?.startpos) {
      cmd = options.moves ? `position startpos moves ${options.moves}` : 'position startpos';
    }
  } else if (command === 'go') {
    cmd = 'go';
    if (options?.depth) cmd += ` depth ${options.depth}`;
    if (options?.movetime) cmd += ` movetime ${options.movetime}`;
    if (options?.nodes) cmd += ` nodes ${options.nodes}`;
    if (options?.infinite) cmd += ' infinite';
  } else if (command === 'setoption') {
    cmd = `setoption name ${options?.name} value ${options?.value}`;
  }
  
  engine.postMessage(cmd);
};
