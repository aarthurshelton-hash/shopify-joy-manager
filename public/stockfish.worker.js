/**
 * Stockfish Web Worker - Self-contained Engine
 * 
 * Uses a robust blob-based loading approach to bypass CORS restrictions.
 * Tries multiple CDN sources with fallback.
 */

let engine = null;
let isReady = false;
let pendingCommands = [];

// CDN sources to try (in order)
const CDN_SOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js',
  'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
  'https://unpkg.com/stockfish.js@10.0.2/stockfish.js'
];

function postStatus(message) {
  self.postMessage({ type: 'status', data: message });
}

function postError(message) {
  self.postMessage({ type: 'error', data: message });
}

// Fetch script from URL and return as blob URL
async function fetchAsBlob(url) {
  const response = await fetch(url, { 
    mode: 'cors',
    cache: 'force-cache'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const text = await response.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

// Try to load engine from multiple sources
async function loadEngineFromCDN() {
  for (const url of CDN_SOURCES) {
    try {
      postStatus(`Trying ${url.split('/')[2]}...`);
      const blobUrl = await fetchAsBlob(url);
      importScripts(blobUrl);
      URL.revokeObjectURL(blobUrl);
      return true;
    } catch (err) {
      console.log(`[Worker] Failed to load from ${url}:`, err.message);
    }
  }
  return false;
}

// Initialize engine using the global STOCKFISH function
function initializeEngine() {
  postStatus('Initializing Stockfish engine...');
  
  // stockfish.js exports STOCKFISH as global
  if (typeof STOCKFISH === 'function') {
    engine = STOCKFISH();
    setupEngineListeners();
    return true;
  }
  
  // Check for Stockfish (capital S)
  if (typeof Stockfish === 'function') {
    engine = Stockfish();
    setupEngineListeners();
    return true;
  }
  
  return false;
}

function setupEngineListeners() {
  if (!engine) {
    postError('Engine object is null');
    return;
  }
  
  // Set up message listener
  if (typeof engine.onmessage !== 'undefined') {
    engine.onmessage = function(msg) {
      const data = typeof msg === 'string' ? msg : (msg.data || msg);
      self.postMessage({ type: 'uci', data: String(data) });
      
      if (String(data) === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        processPendingCommands();
      }
    };
  } else if (engine.addMessageListener) {
    engine.addMessageListener(function(msg) {
      self.postMessage({ type: 'uci', data: msg });
      
      if (msg === 'uciok') {
        isReady = true;
        self.postMessage({ type: 'ready' });
        processPendingCommands();
      }
    });
  }
  
  // Start UCI protocol
  sendToEngine('uci');
  postStatus('Stockfish ready, awaiting UCI response...');
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
  } else if (typeof engine === 'function') {
    engine(cmd);
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
async function init() {
  postStatus('Loading Stockfish engine...');
  
  try {
    const loaded = await loadEngineFromCDN();
    
    if (!loaded) {
      postError('Failed to load Stockfish from all CDN sources');
      return;
    }
    
    const initialized = initializeEngine();
    
    if (!initialized) {
      postError('Failed to initialize Stockfish engine - no STOCKFISH function found');
    }
  } catch (err) {
    postError('Initialization failed: ' + err.message);
    console.error('[Worker] Init error:', err);
  }
}

init();
