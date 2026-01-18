/**
 * Stockfish Web Worker - Real WASM Implementation
 * 
 * Loads and runs Stockfish 17 WASM engine in a web worker.
 * Uses the lite-single version for maximum compatibility (no CORS required).
 */

let stockfish = null;
let isReady = false;
let messageQueue = [];

function postStatus(message) {
  self.postMessage({ type: 'status', data: message });
}

function postError(message) {
  self.postMessage({ type: 'error', data: message });
}

function postUci(message) {
  self.postMessage({ type: 'uci', data: message });
}

function postReady() {
  self.postMessage({ type: 'ready', data: true });
}

// Process a UCI command
function processCommand(command, options = {}) {
  if (!stockfish) return;
  
  switch (command) {
    case 'setoption':
      if (options.name && options.value !== undefined) {
        stockfish.postMessage(`setoption name ${options.name} value ${options.value}`);
      }
      break;
      
    case 'position':
      if (options.fen) {
        stockfish.postMessage(`position fen ${options.fen}`);
      } else if (options.startpos) {
        stockfish.postMessage('position startpos');
      }
      if (options.moves) {
        stockfish.postMessage(`position fen ${options.fen} moves ${options.moves}`);
      }
      break;
      
    case 'go':
      let goCmd = 'go';
      if (options.depth) goCmd += ` depth ${options.depth}`;
      if (options.movetime) goCmd += ` movetime ${options.movetime}`;
      if (options.nodes) goCmd += ` nodes ${options.nodes}`;
      if (options.infinite) goCmd += ' infinite';
      stockfish.postMessage(goCmd);
      break;
      
    case 'stop':
      stockfish.postMessage('stop');
      break;
      
    case 'quit':
      stockfish.postMessage('quit');
      break;
      
    case 'uci':
      stockfish.postMessage('uci');
      break;
      
    case 'isready':
      stockfish.postMessage('isready');
      break;
      
    case 'ucinewgame':
      stockfish.postMessage('ucinewgame');
      break;
      
    default:
      // Pass through raw UCI commands
      if (typeof command === 'string') {
        stockfish.postMessage(command);
      }
  }
}

// Process queued messages
function processQueue() {
  while (messageQueue.length > 0) {
    const { command, options } = messageQueue.shift();
    processCommand(command, options);
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { command, options } = e.data;
  
  if (!isReady) {
    messageQueue.push({ command, options });
    return;
  }
  
  processCommand(command, options);
};

// Initialize Stockfish using the lite-single WASM version
async function initStockfish() {
  postStatus('Initializing Stockfish 17 WASM (lite-single)...');
  
  try {
    // Import the Stockfish lite-single version (no CORS required)
    importScripts('./stockfish-17.1-lite-single.js');
    
    if (typeof Stockfish === 'function') {
      // Stockfish constructor exists - use it
      postStatus('Loading Stockfish WASM module...');
      stockfish = await Stockfish();
      
      stockfish.addMessageListener((line) => {
        postUci(line);
        
        if (line === 'uciok') {
          postStatus('Stockfish 17 UCI initialized');
        } else if (line === 'readyok') {
          if (!isReady) {
            isReady = true;
            postStatus('Stockfish 17 WASM ready!');
            postReady();
            processQueue();
          }
        }
      });
      
      // Start UCI handshake
      stockfish.postMessage('uci');
      
      // Wait a bit then send isready
      setTimeout(() => {
        stockfish.postMessage('isready');
      }, 200);
      
    } else {
      throw new Error('Stockfish constructor not found after import');
    }
  } catch (e) {
    postError(`Stockfish WASM initialization failed: ${e.message}`);
    postStatus('Failed to load Stockfish WASM - check console');
    console.error('[Stockfish Worker] Init error:', e);
  }
}

// Start initialization
initStockfish();
