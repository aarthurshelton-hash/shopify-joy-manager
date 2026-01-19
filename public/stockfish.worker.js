/**
 * Stockfish Web Worker - Maximum Compatibility Version
 * 
 * Uses Stockfish 10 ASM.js (pure JavaScript, no external WASM files needed).
 * This version works in all browsers without CORS headers.
 * 
 * Strength: ~3000 ELO (Stockfish 10 level)
 */

// Import the self-contained Stockfish engine
importScripts('./stockfish-10.js');

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

// Handle UCI output from Stockfish
Module['print'] = function(line) {
  postUci(line);
  
  if (line === 'uciok') {
    postStatus('Stockfish 10 UCI protocol ready');
  } else if (line === 'readyok') {
    if (!isReady) {
      isReady = true;
      postStatus('Stockfish 10 ready! (ELO ~3000)');
      postReady();
      processQueue();
    }
  }
};

Module['printErr'] = function(line) {
  console.error('[Stockfish stderr]', line);
};

// Send a UCI command to Stockfish
function sendCommand(cmd) {
  if (typeof Module !== 'undefined' && Module.ccall) {
    Module.ccall('uci_command', 'number', ['string'], [cmd]);
  }
}

// Process a high-level command
function processCommand(command, options = {}) {
  let uciCommand = '';
  
  switch (command) {
    case 'setoption':
      if (options.name && options.value !== undefined) {
        uciCommand = `setoption name ${options.name} value ${options.value}`;
      }
      break;
      
    case 'position':
      if (options.fen) {
        if (options.moves) {
          uciCommand = `position fen ${options.fen} moves ${options.moves}`;
        } else {
          uciCommand = `position fen ${options.fen}`;
        }
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
  
  if (uciCommand) {
    sendCommand(uciCommand);
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

// Initialize when the module is ready
Module['onRuntimeInitialized'] = function() {
  postStatus('Stockfish 10 ASM.js initialized');
  // Start UCI handshake
  sendCommand('uci');
  setTimeout(() => {
    sendCommand('isready');
  }, 100);
};

postStatus('Loading Stockfish 10 ASM.js engine...');
