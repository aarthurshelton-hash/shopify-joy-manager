/**
 * Stockfish Web Worker - Direct Engine Loader
 * Imports the engine and bridges UCI communication
 */

let engine = null;
let isReady = false;

// Import the engine script
try {
  importScripts('./stockfish-engine.js');
} catch (err) {
  self.postMessage({ type: 'error', data: 'Failed to import engine: ' + err.message });
}

// Handle messages from main thread - just forward as UCI strings
self.onmessage = function(e) {
  const msg = e.data;
  
  // Handle string messages (UCI commands)
  if (typeof msg === 'string') {
    if (engine && engine.postMessage) {
      engine.postMessage(msg);
    } else {
      self.postMessage({ type: 'error', data: 'Engine not initialized' });
    }
    return;
  }
  
  // Handle structured messages for backward compatibility
  const { command, options } = msg;
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
  
  if (engine && engine.postMessage) {
    engine.postMessage(cmd);
  } else {
    self.postMessage({ type: 'error', data: 'Engine not ready' });
  }
};

// The engine should automatically initialize itself
// We need to set up message handling
if (typeof Stockfish === 'function') {
  // Modern Stockfish.js exports a Stockfish function
  try {
    const sf = Stockfish();
    if (sf.then) {
      // It's a promise
      sf.then(function(e) {
        engine = e;
        setupEngine();
      }).catch(function(err) {
        self.postMessage({ type: 'error', data: 'Promise rejected: ' + err.message });
      });
    } else {
      engine = sf;
      setupEngine();
    }
  } catch (err) {
    self.postMessage({ type: 'error', data: 'Stockfish() failed: ' + err.message });
  }
} else if (typeof STOCKFISH === 'function') {
  // Older stockfish.js uses STOCKFISH
  try {
    engine = STOCKFISH();
    setupEngine();
  } catch (err) {
    self.postMessage({ type: 'error', data: 'STOCKFISH() failed: ' + err.message });
  }
} else {
  // The engine might set up onmessage itself
  self.postMessage({ type: 'status', data: 'Waiting for engine to initialize...' });
  
  // Check if there's an onmessage handler the engine is expecting
  setTimeout(function checkEngine() {
    if (typeof Stockfish === 'function' || typeof STOCKFISH === 'function') {
      if (typeof Stockfish === 'function') {
        const sf = Stockfish();
        if (sf.then) {
          sf.then(function(e) {
            engine = e;
            setupEngine();
          });
        } else {
          engine = sf;
          setupEngine();
        }
      } else {
        engine = STOCKFISH();
        setupEngine();
      }
    } else {
      self.postMessage({ type: 'error', data: 'No Stockfish or STOCKFISH function found' });
    }
  }, 100);
}

function setupEngine() {
  if (!engine) return;
  
  self.postMessage({ type: 'status', data: 'Setting up engine...' });
  
  // Handle messages from the engine
  if (engine.addMessageListener) {
    engine.addMessageListener(function(msg) {
      self.postMessage({ type: 'uci', data: msg });
      if (msg === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
      }
    });
  } else if (engine.onmessage !== undefined) {
    engine.onmessage = function(msg) {
      const data = typeof msg === 'string' ? msg : msg.data;
      self.postMessage({ type: 'uci', data: data });
      if (data === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
      }
    };
  }
  
  // Send UCI init command
  if (engine.postMessage) {
    engine.postMessage('uci');
    self.postMessage({ type: 'status', data: 'Stockfish 17 Lite initializing...' });
  }
}
