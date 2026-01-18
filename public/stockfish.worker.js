/**
 * Stockfish Web Worker - Runtime CDN Loader
 * 
 * This worker fetches and executes Stockfish from a CDN at runtime,
 * avoiding CORS issues that occur with importScripts.
 */

let engine = null;
let isReady = false;
let pendingCommands = [];

// Post status to main thread
function postStatus(message) {
  self.postMessage({ type: 'status', data: message });
}

function postError(message) {
  self.postMessage({ type: 'error', data: message });
}

// Initialize the engine by fetching and evaluating the script
async function initEngine() {
  postStatus('Fetching Stockfish engine...');
  
  try {
    // Fetch the engine script as text
    const response = await fetch('https://unpkg.com/stockfish@17.1.0/src/stockfish-17.1-lite-single-03e3232.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch engine: ${response.status}`);
    }
    
    const scriptText = await response.text();
    postStatus('Engine script loaded, initializing...');
    
    // Create a blob URL and import it (this avoids CORS issues)
    const blob = new Blob([scriptText], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Import the blob URL
    importScripts(blobUrl);
    URL.revokeObjectURL(blobUrl);
    
    postStatus('Script imported, looking for Stockfish function...');
    
    // Find the Stockfish constructor
    if (typeof Stockfish === 'function') {
      postStatus('Found Stockfish() function');
      const result = Stockfish();
      
      if (result && result.then) {
        // It's a promise
        engine = await result;
      } else {
        engine = result;
      }
    } else if (typeof STOCKFISH === 'function') {
      postStatus('Found STOCKFISH() function');
      engine = STOCKFISH();
    } else {
      throw new Error('No Stockfish or STOCKFISH function found after script load');
    }
    
    setupEngine();
    
  } catch (error) {
    postError('Failed to initialize: ' + error.message);
    console.error('[Worker] Init error:', error);
  }
}

function setupEngine() {
  if (!engine) {
    postError('Engine is null after setup');
    return;
  }
  
  postStatus('Setting up engine message handlers...');
  
  // Set up message listener from engine
  if (engine.addMessageListener) {
    engine.addMessageListener(function(msg) {
      self.postMessage({ type: 'uci', data: msg });
      if (msg === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        // Process any pending commands
        processPendingCommands();
      }
    });
  } else if (typeof engine.onmessage !== 'undefined') {
    engine.onmessage = function(msg) {
      const data = typeof msg === 'string' ? msg : msg.data;
      self.postMessage({ type: 'uci', data: data });
      if (data === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        processPendingCommands();
      }
    };
  }
  
  // Send UCI initialization
  if (engine.postMessage) {
    engine.postMessage('uci');
    postStatus('Stockfish 17.1 Lite initializing...');
  } else {
    postError('Engine has no postMessage method');
  }
}

function processPendingCommands() {
  while (pendingCommands.length > 0) {
    const cmd = pendingCommands.shift();
    sendToEngine(cmd);
  }
}

function sendToEngine(cmd) {
  if (engine && engine.postMessage) {
    engine.postMessage(cmd);
  } else {
    postError('Cannot send command - engine not ready');
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

// Start initialization
initEngine();
