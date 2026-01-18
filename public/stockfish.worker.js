/**
 * Stockfish Web Worker - Embedded UCI Engine
 * 
 * Uses a lightweight stockfish.js build that works in workers.
 */

let engine = null;
let ready = false;
let outputBuffer = [];

// Use Lichess's stockfish.js which is designed for web workers
const STOCKFISH_URL = 'https://lichess1.org/assets/_qGqxVU/compiled/stockfish.js';

async function init() {
  try {
    self.postMessage({ type: 'status', data: 'Initializing Stockfish...' });
    
    // Fetch the stockfish script
    const response = await fetch(STOCKFISH_URL);
    if (!response.ok) throw new Error('Failed to fetch stockfish');
    
    const code = await response.text();
    
    // Create and evaluate
    const fn = new Function(code + '\n;return Stockfish;');
    const StockfishFactory = fn();
    
    if (typeof StockfishFactory === 'function') {
      engine = StockfishFactory();
      
      // Set up message handler
      engine.addMessageListener((line) => {
        self.postMessage({ type: 'uci', data: line });
        
        if (line === 'uciok') {
          ready = true;
          self.postMessage({ type: 'ready' });
        }
      });
      
      // Initialize UCI
      engine.postMessage('uci');
      self.postMessage({ type: 'status', data: 'Stockfish loaded successfully!' });
      return;
    }
  } catch (e) {
    console.error('Primary load failed:', e);
  }
  
  // Fallback: Try alternative CDN with importScripts
  try {
    self.postMessage({ type: 'status', data: 'Trying fallback...' });
    importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
    
    if (typeof STOCKFISH === 'function') {
      engine = STOCKFISH();
      
      engine.addMessageListener((line) => {
        self.postMessage({ type: 'uci', data: line });
        if (line === 'uciok') {
          ready = true;
          self.postMessage({ type: 'ready' });
        }
      });
      
      engine.postMessage('uci');
      self.postMessage({ type: 'status', data: 'Stockfish 10 loaded!' });
      return;
    }
  } catch (e) {
    console.error('Fallback failed:', e);
  }
  
  self.postMessage({ type: 'error', data: 'Failed to load Stockfish engine' });
}

// Start initialization
init();

// Handle commands from main thread
self.onmessage = function(e) {
  if (!engine) {
    self.postMessage({ type: 'error', data: 'Engine not ready' });
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
