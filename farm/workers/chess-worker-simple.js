#!/usr/bin/env node
/**
 * Simple Chess Game Generation Worker
 * Generates games without complex TypeScript dependencies
 */

const fs = require('fs');
const path = require('path');

const workerId = process.argv[2] || '0';
const LOG_DIR = path.join(__dirname, '../logs');
const DATA_DIR = path.join(__dirname, '../data/chess_games');

// Ensure directories exist
[LOG_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Simple logger
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, workerId, message, ...data };
  console.log(JSON.stringify(logEntry));
  
  // Also write to file
  const logFile = path.join(LOG_DIR, `chess-game-${workerId}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Simple game counter
let gamesGenerated = 0;
let isRunning = true;

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'Shutting down gracefully');
  isRunning = false;
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'Interrupted, shutting down');
  isRunning = false;
  process.exit(0);
});

// Main loop
async function main() {
  log('info', 'Chess worker started', { workerId });
  
  while (isRunning) {
    try {
      // Simulate game generation (placeholder)
      gamesGenerated++;
      const gameId = `farm_${workerId}_${Date.now()}`;
      
      log('info', 'Generated game', { 
        gameId, 
        gamesGenerated,
        status: 'success'
      });
      
      // Save placeholder game file
      const gameData = {
        id: gameId,
        workerId,
        timestamp: new Date().toISOString(),
        pgn: `[Event "Farm Game"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n\n1. e4 e5 2. Nf3 *`,
        result: '1/2-1/2'
      };
      
      const filename = path.join(DATA_DIR, `${gameId}.json`);
      fs.writeFileSync(filename, JSON.stringify(gameData, null, 2));
      
      // Wait between games (30 seconds for testing)
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      log('error', 'Error generating game', { error: error.message });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

main().catch(error => {
  log('error', 'Fatal error', { error: error.message });
  process.exit(1);
});
