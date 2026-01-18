/**
 * Stockfish 17.1 Web Worker
 * 
 * Loads Stockfish 17.1 Lite (single-threaded) from same-origin files.
 * No CORS issues since files are served from the same domain.
 */

let engine = null;
let isReady = false;
let pendingCommands = [];

function postStatus(message) {
  self.postMessage({ type: 'status', data: message });
}

function postError(message) {
  self.postMessage({ type: 'error', data: message });
}

function processPendingCommands() {
  while (pendingCommands.length > 0) {
    const cmd = pendingCommands.shift();
    sendToEngine(cmd);
  }
}

function sendToEngine(cmd) {
  if (!engine) {
    postError('Engine not initialized');
    return;
  }
  
  if (engine.postMessage) {
    engine.postMessage(cmd);
  }
}

function setupEngineListeners() {
  if (!engine) {
    postError('Engine object is null');
    return;
  }
  
  postStatus('Setting up Stockfish 17.1 message handlers...');
  
  // Stockfish 17 uses addMessageListener
  if (engine.addMessageListener) {
    engine.addMessageListener(function(msg) {
      self.postMessage({ type: 'uci', data: msg });
      
      if (msg === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        processPendingCommands();
      }
    });
  } else if (typeof engine.onmessage !== 'undefined') {
    engine.onmessage = function(msg) {
      const data = typeof msg === 'string' ? msg : (msg.data || msg);
      self.postMessage({ type: 'uci', data: String(data) });
      
      if (String(data) === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        processPendingCommands();
      }
    };
  }
  
  // Start UCI protocol
  if (engine.postMessage) {
    engine.postMessage('uci');
    postStatus('Stockfish 17.1 initializing...');
  } else {
    postError('Engine has no postMessage method');
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const msg = e.data;
  
  // Handle string messages (UCI commands)
  if (typeof msg === 'string') {
    if (isReady) {
      sendToEngine(msg);
    } else {
      pendingCommands.push(msg);
    }
    return;
  }
  
  // Handle structured messages
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
  
  if (isReady) {
    sendToEngine(cmd);
  } else {
    pendingCommands.push(cmd);
  }
};

// Initialize Stockfish 17
async function init() {
  postStatus('Loading Stockfish 17.1...');
  
  try {
    // Import the Stockfish 17 script from same origin
    importScripts('/stockfish-17.js');
    
    postStatus('Script loaded, initializing engine...');
    
    // Stockfish 17 exports a Stockfish function that returns a promise
    if (typeof Stockfish === 'function') {
      const result = Stockfish();
      
      // Handle both promise and direct return
      if (result && typeof result.then === 'function') {
        engine = await result;
      } else {
        engine = result;
      }
      
      setupEngineListeners();
    } else if (typeof STOCKFISH === 'function') {
      engine = STOCKFISH();
      setupEngineListeners();
    } else {
      postError('No Stockfish constructor found after import');
    }
  } catch (err) {
    postError('Failed to load Stockfish 17: ' + err.message);
    console.error('[Worker] Init error:', err);
  }
}

init();
