/**
 * Stockfish Web Worker Bridge
 * 
 * CRITICAL METHODOLOGY NOTE FOR EN PENSENT BENCHMARKS:
 * =====================================================
 * This worker provides the SAME Stockfish engine to BOTH sides of the benchmark:
 * 
 * 1. PURE STOCKFISH: Raw tactical evaluation only
 * 2. EN PENSENT HYBRID: Stockfish evaluation + Temporal Pattern Recognition
 * 
 * We are NOT testing "better Stockfish vs worse Stockfish".
 * We are testing whether ADDING En Pensent's pattern wavelength recognition
 * to the SAME Stockfish evaluation produces better game outcome predictions.
 * 
 * The hypothesis: Pure calculation misses strategic patterns that
 * En Pensent's temporal signature analysis can detect.
 * 
 * Engine: Stockfish 10 (ELO ~3000)
 * This provides the tactical baseline for both benchmark sides.
 */

// The stockfish-engine.min.js is a self-contained Stockfish worker
// We load it directly and bridge messages to the main thread

let engine = null;
let isReady = false;
let messageQueue = [];
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function postStatus(message) {
  postMessage({ type: 'status', data: message });
}

function postError(message) {
  postMessage({ type: 'error', data: message });
}

function postReady() {
  postMessage({ type: 'ready', data: true });
}

function postUci(line) {
  postMessage({ type: 'uci', data: line });
}

// Initialize the engine
function initEngine() {
  initAttempts++;
  postStatus(`Loading Stockfish engine (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})...`);
  
  try {
    // The stockfish-engine.min.js IS the worker script - use it directly as a nested worker
    engine = new Worker('./stockfish-engine.min.js');
    
    let uciOkReceived = false;
    let readyOkReceived = false;
    
    engine.onmessage = function(e) {
      const line = typeof e.data === 'string' ? e.data : String(e.data);
      
      // Forward UCI output to main thread
      postUci(line);
      
      // Detect UCI protocol ready
      if (line === 'uciok') {
        uciOkReceived = true;
        postStatus('Stockfish UCI protocol ready');
        // Request readiness confirmation
        engine.postMessage('isready');
      }
      
      // Detect engine fully ready
      if (line === 'readyok') {
        readyOkReceived = true;
        if (!isReady) {
          isReady = true;
          postStatus('Stockfish 10 ready! (ELO ~3000 - Same engine for both benchmark sides)');
          postReady();
          processQueue();
        }
      }
    };
    
    engine.onerror = function(e) {
      const errorMsg = e.message || 'Unknown worker error';
      console.error('[Stockfish Worker] Engine error:', e);
      
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        postStatus(`Engine error, retrying... (${errorMsg})`);
        setTimeout(initEngine, 1000);
      } else {
        postError('Stockfish engine failed after ' + MAX_INIT_ATTEMPTS + ' attempts: ' + errorMsg);
      }
    };
    
    // Set timeout for initialization
    setTimeout(() => {
      if (!isReady) {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
          postStatus('Initialization timeout, retrying...');
          if (engine) {
            engine.terminate();
            engine = null;
          }
          initEngine();
        } else {
          postError('Stockfish engine initialization timeout after all retries');
        }
      }
    }, 15000); // 15 second timeout per attempt
    
    // Start UCI handshake after a brief delay to let the engine initialize
    setTimeout(() => {
      if (engine) {
        engine.postMessage('uci');
      }
    }, 500);
    
  } catch (err) {
    console.error('[Stockfish Worker] Init error:', err);
    
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      postStatus('Failed to create engine, retrying...');
      setTimeout(initEngine, 1000);
    } else {
      postError('Failed to load Stockfish after ' + MAX_INIT_ATTEMPTS + ' attempts: ' + err.message);
    }
  }
}

// Process queued commands after engine is ready
function processQueue() {
  while (messageQueue.length > 0) {
    const { command, options } = messageQueue.shift();
    processCommand(command, options);
  }
}

// Convert high-level command to UCI string and send to engine
function processCommand(command, options = {}) {
  if (!engine) {
    postError('Engine not initialized');
    return;
  }
  
  let uciCommand = '';
  
  switch (command) {
    case 'setoption':
      if (options.name && options.value !== undefined) {
        uciCommand = `setoption name ${options.name} value ${options.value}`;
      }
      break;
      
    case 'position':
      if (options.fen) {
        uciCommand = options.moves 
          ? `position fen ${options.fen} moves ${options.moves}`
          : `position fen ${options.fen}`;
      } else if (options.startpos) {
        uciCommand = 'position startpos';
      }
      break;
      
    case 'go':
      uciCommand = 'go';
      if (options.depth) uciCommand += ` depth ${options.depth}`;
      if (options.movetime) uciCommand += ` movetime ${options.movetime}`;
      if (options.nodes) uciCommand += ` nodes ${options.nodes}`;
      if (options.infinite) uciCommand += ' infinite';
      break;
      
    case 'stop':
      uciCommand = 'stop';
      break;
      
    case 'quit':
      uciCommand = 'quit';
      break;
      
    case 'uci':
      uciCommand = 'uci';
      break;
      
    case 'isready':
      uciCommand = 'isready';
      break;
      
    case 'ucinewgame':
      uciCommand = 'ucinewgame';
      break;
      
    default:
      // Pass through raw UCI commands
      if (typeof command === 'string') {
        uciCommand = command;
      }
  }
  
  if (uciCommand && engine) {
    engine.postMessage(uciCommand);
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

// Start initialization
initEngine();
