/**
 * Stockfish 17.1 Web Worker Bridge
 * 
 * CRITICAL METHODOLOGY NOTE FOR EN PENSENT BENCHMARKS:
 * =====================================================
 * This worker provides the SAME Stockfish engine to BOTH sides of the benchmark:
 * 
 * 1. PURE STOCKFISH: Raw tactical evaluation only
 * 2. EN PENSENT HYBRID: Stockfish evaluation + Temporal Pattern Recognition
 * 
 * Engine: Stockfish 17.1 NNUE (ELO ~3600)
 * This provides the tactical baseline for both benchmark sides.
 */

var engine = null;
var isReady = false;
var messageQueue = [];
var initStartTime = Date.now();
var initAttempts = 0;
var MAX_INIT_ATTEMPTS = 3;
var INIT_TIMEOUT = 30000; // 30 seconds per attempt

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
  postStatus('Loading Stockfish 17.1 NNUE engine (attempt ' + initAttempts + '/' + MAX_INIT_ATTEMPTS + ')...');
  
  try {
    // Try loading the lite single-threaded version first (no CORS needed)
    // Falls back to stockfish-engine.min.js (Stockfish 10 ASM.js)
    var enginePaths = [
      './stockfish-17.1-lite.js',
      './stockfish-engine.min.js'
    ];
    
    var currentPathIndex = 0;
    
    function tryLoadEngine() {
      if (currentPathIndex >= enginePaths.length) {
        postError('Failed to load any Stockfish engine after trying all paths');
        return;
      }
      
      var path = enginePaths[currentPathIndex];
      postStatus('Trying to load: ' + path);
      
      try {
        engine = new Worker(path);
        
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
              var version = path.includes('17.1') ? 'Stockfish 17.1 NNUE (ELO ~3600)' : 'Stockfish 10 ASM.js (ELO ~3000)';
              postStatus(version + ' ready! Init: ' + initTime + 'ms');
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
          
          // Try next path
          if (!isReady) {
            currentPathIndex++;
            if (engine) {
              try { engine.terminate(); } catch(ex) {}
              engine = null;
            }
            setTimeout(tryLoadEngine, 500);
          }
        };
        
        // Set timeout for initialization
        initTimeoutId = setTimeout(function() {
          if (!isReady) {
            currentPathIndex++;
            postStatus('Timeout on ' + path + ', trying next...');
            if (engine) {
              try { engine.terminate(); } catch(ex) {}
              engine = null;
            }
            tryLoadEngine();
          }
        }, INIT_TIMEOUT);
        
        // Start UCI handshake after a brief delay
        setTimeout(function() {
          if (engine && !isReady) {
            postStatus('Sending UCI handshake to ' + path + '...');
            engine.postMessage('uci');
          }
        }, 500);
        
      } catch (err) {
        console.error('[Stockfish Worker] Error loading ' + path + ':', err);
        currentPathIndex++;
        setTimeout(tryLoadEngine, 500);
      }
    }
    
    tryLoadEngine();
    
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
