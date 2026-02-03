#!/usr/bin/env node
/**
 * Real Chess Game Generation Worker
 * Uses Stockfish engine to generate actual chess games
 * 
 * Usage: node chess-worker-stockfish.js [workerId]
 */

const { spawn } = require('child_process');
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

// Logger
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, workerId, message, ...data };
  console.log(JSON.stringify(logEntry));
  
  const logFile = path.join(LOG_DIR, `chess-game-${workerId}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Run game generation via tsx (handles TypeScript)
async function generateGame() {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '../..');
    const script = `
      const { generateStockfishGame } = require('${projectRoot}/src/lib/chess/benchmark/predictionBenchmark.ts');
      generateStockfishGame('farm_${workerId}_${Date.now()}', 18, 80)
        .then(game => {
          console.log(JSON.stringify(game));
          process.exit(0);
        })
        .catch(err => {
          console.error(err.message);
          process.exit(1);
        });
    `;
    
    const child = spawn('npx', ['tsx', '-e', script], {
      cwd: projectRoot,
      timeout: 300000 // 5 min timeout
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      log('error', 'Stockfish stderr', { data: data.toString() });
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        try {
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          resolve(JSON.parse(lastLine));
        } catch (e) {
          reject(new Error('Failed to parse output'));
        }
      }
    });
  });
}

// Main loop
let gamesGenerated = 0;
let isRunning = true;

process.on('SIGTERM', () => { isRunning = false; process.exit(0); });
process.on('SIGINT', () => { isRunning = false; process.exit(0); });

async function main() {
  log('info', 'Stockfish worker started', { workerId });
  
  while (isRunning) {
    try {
      log('info', 'Generating game...');
      const game = await generateGame();
      gamesGenerated++;
      
      const gameData = {
        id: `farm_${workerId}_${Date.now()}`,
        workerId,
        timestamp: new Date().toISOString(),
        ...game
      };
      
      const filename = path.join(DATA_DIR, `${gameData.id}.json`);
      fs.writeFileSync(filename, JSON.stringify(gameData, null, 2));
      
      log('info', 'Game generated successfully', { 
        gameId: gameData.id,
        moveCount: game.moveCount,
        result: game.result,
        gamesGenerated
      });
      
      // Wait between games
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      log('error', 'Failed to generate game', { error: error.message });
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

main().catch(error => {
  log('error', 'Fatal error', { error: error.message });
  process.exit(1);
});
