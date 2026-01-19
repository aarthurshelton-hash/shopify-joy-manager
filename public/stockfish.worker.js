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
 * Engine: Stockfish 10 ASM.js (ELO ~3000)
 * This provides the tactical baseline for both benchmark sides.
 */

// The stockfish-engine.min.js is a complete self-contained Web Worker script
// It listens for postMessage and uses postMessage internally for UCI output
// We need to create it as a nested worker and bridge messages

var engine = null;
var isReady = false;
var messageQueue = [];
var initStartTime = Date.now();
var initAttempts = 0;
var MAX_INIT_ATTEMPTS = 3;
var INIT_TIMEOUT = 20000; // 20 seconds per attempt

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

function initEngine() {
  initAttempts++;
  postStatus('Loading Stockfish engine (attempt ' + initAttempts + '/' + MAX_INIT_ATTEMPTS + ')...');
  
  try {
    // Create a new worker from the stockfish engine script
    // The stockfish-engine.min.js IS a complete worker that accepts UCI commands via postMessage
    engine = new Worker('./stockfish-engine.min.js');
    
    var uciOkReceived = false;
    var initTimeoutId = null;
    
    engine.onmessage = function(e) {
      var line = typeof e.data === 'string' ? e.data : String(e.data);
      
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
        if (!isReady) {
          isReady = true;
          if (initTimeoutId) {
            clearTimeout(initTimeoutId);
            initTimeoutId = null;
          }
          var initTime = Date.now() - initStartTime;
          postStatus('Stockfish 10 ready! (ELO ~3000 - Same engine for both benchmark sides) - Init: ' + initTime + 'ms');
          postReady();
          processQueue();
        }
      }
    };
    
    engine.onerror = function(e) {
      var errorMsg = e.message || 'Unknown worker error';
      console.error('[Stockfish Worker] Engine error:', e);
      
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
        initTimeoutId = null;
      }
      
      if (initAttempts < MAX_INIT_ATTEMPTS && !isReady) {
        postStatus('Engine error, retrying... (' + errorMsg + ')');
        if (engine) {
          try { engine.terminate(); } catch(ex) {}
          engine = null;
        }
        setTimeout(initEngine, 1000);
      } else if (!isReady) {
        postError('Stockfish engine failed after ' + MAX_INIT_ATTEMPTS + ' attempts: ' + errorMsg);
      }
    };
    
    // Set timeout for initialization
    initTimeoutId = setTimeout(function() {
      if (!isReady) {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
          postStatus('Initialization timeout, retrying...');
          if (engine) {
            try { engine.terminate(); } catch(ex) {}
            engine = null;
          }
          initEngine();
        } else {
          postError('Stockfish engine initialization timeout after all retries');
        }
      }
    }, INIT_TIMEOUT);
    
    // Start UCI handshake after a brief delay
    setTimeout(function() {
      if (engine && !isReady) {
        postStatus('Sending UCI handshake...');
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
    var cmd = messageQueue.shift();
    processCommand(cmd.command, cmd.options);
  }
}

// Convert high-level command to UCI string and send to engine
function processCommand(command, options) {
  if (!engine) {
    postError('Engine not initialized');
    return;
  }
  
  options = options || {};
  var uciCommand = '';
  
  switch (command) {
    case 'setoption':
      if (options.name && options.value !== undefined) {
        uciCommand = 'setoption name ' + options.name + ' value ' + options.value;
      }
      break;
      
    case 'position':
      if (options.fen) {
        uciCommand = options.moves 
          ? 'position fen ' + options.fen + ' moves ' + options.moves
          : 'position fen ' + options.fen;
      } else if (options.startpos) {
        uciCommand = 'position startpos';
      }
      break;
      
    case 'go':
      uciCommand = 'go';
      if (options.depth) uciCommand += ' depth ' + options.depth;
      if (options.movetime) uciCommand += ' movetime ' + options.movetime;
      if (options.nodes) uciCommand += ' nodes ' + options.nodes;
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
  var command = e.data.command;
  var options = e.data.options;
  
  if (!isReady) {
    messageQueue.push({ command: command, options: options });
    return;
  }
  
  processCommand(command, options);
};

// Start initialization
initEngine();
