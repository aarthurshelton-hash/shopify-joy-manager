/**
 * Stockfish Web Worker
 * 
 * Runs Stockfish WASM in a separate thread for non-blocking chess analysis.
 * Uses stockfish.js from a CORS-friendly CDN.
 */

let stockfish = null;
let isReady = false;
let initAttempts = 0;
const MAX_ATTEMPTS = 3;

// Multiple CDN sources for reliability
const STOCKFISH_SOURCES = [
  'https://unpkg.com/stockfish.js@10.0.2/stockfish.js',
  'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
];

async function loadStockfish() {
  for (const source of STOCKFISH_SOURCES) {
    try {
      self.postMessage({ type: 'status', data: `Loading from ${source}...` });
      importScripts(source);
      
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
        self.postMessage({ type: 'status', data: 'Stockfish loaded successfully!' });
        return true;
      }
    } catch (error) {
      console.warn(`Failed to load from ${source}:`, error);
      self.postMessage({ type: 'status', data: `Failed: ${source}, trying next...` });
    }
  }
  return false;
}

// Initialize
loadStockfish().then(success => {
  if (!success) {
    self.postMessage({ type: 'error', data: 'Failed to load Stockfish from all sources' });
  }
});

// Handle incoming messages
self.onmessage = function(e) {
  const { command, options } = e.data;
  
  if (!stockfish) {
    self.postMessage({ type: 'error', data: 'Stockfish not initialized yet' });
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
