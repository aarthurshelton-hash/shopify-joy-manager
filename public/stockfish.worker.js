/**
 * Stockfish Web Worker
 * 
 * Runs Stockfish WASM in a separate thread for non-blocking chess analysis.
 * Communicates via postMessage for UCI commands and responses.
 */

let stockfish = null;
let isReady = false;

// Load Stockfish from npm package (bundled WASM)
importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js');

// Initialize Stockfish
if (typeof STOCKFISH === 'function') {
  stockfish = STOCKFISH();
  
  stockfish.addMessageListener((message) => {
    self.postMessage({ type: 'uci', data: message });
    
    if (message === 'uciok') {
      isReady = true;
      self.postMessage({ type: 'ready' });
    }
  });
  
  // Send UCI init command
  stockfish.postMessage('uci');
} else {
  self.postMessage({ type: 'error', data: 'Failed to load Stockfish' });
}

// Handle incoming messages
self.onmessage = function(e) {
  const { command, options } = e.data;
  
  if (!stockfish) {
    self.postMessage({ type: 'error', data: 'Stockfish not initialized' });
    return;
  }
  
  switch (command) {
    case 'uci':
      stockfish.postMessage('uci');
      break;
      
    case 'isready':
      stockfish.postMessage('isready');
      break;
      
    case 'setoption':
      if (options?.name && options?.value !== undefined) {
        stockfish.postMessage(`setoption name ${options.name} value ${options.value}`);
      }
      break;
      
    case 'position':
      if (options?.fen) {
        stockfish.postMessage(`position fen ${options.fen}`);
      } else if (options?.startpos) {
        const moves = options.moves ? ` moves ${options.moves}` : '';
        stockfish.postMessage(`position startpos${moves}`);
      }
      break;
      
    case 'go':
      let goCommand = 'go';
      if (options?.depth) goCommand += ` depth ${options.depth}`;
      if (options?.movetime) goCommand += ` movetime ${options.movetime}`;
      if (options?.nodes) goCommand += ` nodes ${options.nodes}`;
      if (options?.infinite) goCommand += ' infinite';
      stockfish.postMessage(goCommand);
      break;
      
    case 'stop':
      stockfish.postMessage('stop');
      break;
      
    case 'quit':
      stockfish.postMessage('quit');
      break;
      
    case 'eval':
      stockfish.postMessage('eval');
      break;
      
    default:
      // Send raw UCI command
      if (typeof command === 'string') {
        stockfish.postMessage(command);
      }
  }
};
