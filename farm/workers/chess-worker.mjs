#!/usr/bin/env node
/**
 * Chess Game Generation Worker
 * Continuously generates Stockfish vs Stockfish games for the prediction pipeline
 * 
 * Usage: node chess-worker.js [workerId]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_PATH = path.join(__dirname, '../config/farm.config.json');
const LOG_DIR = path.join(__dirname, '../logs');
const DATA_DIR = path.join(__dirname, '../data/chess_games');

// Ensure directories exist
[LOG_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const workerConfig = config.workers.chessGameGenerator;
const workerId = process.argv[2] || '0';

// Logger
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    worker: `chess-game-${workerId}`,
    message,
    ...meta
  };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] [chess-game-${workerId}] ${message}`);
  
  // Also write to file
  const logFile = path.join(LOG_DIR, `chess-game-${workerId}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Stats tracking
let stats = {
  gamesGenerated: 0,
  gamesSaved: 0,
  errors: 0,
  startTime: Date.now()
};

// Game generation function
async function generateGameBatch(batchSize, depth, maxMoves) {
  log('info', `Generating batch of ${batchSize} games`, { depth, maxMoves });
  
  try {
    // Dynamic import for ESM modules
    const { generateStockfishGame } = await import('../../src/lib/chess/benchmark/predictionBenchmark.ts');
    
    const games = [];
    for (let i = 0; i < batchSize; i++) {
      try {
        const gameId = `farm_${workerId}_${Date.now()}_${i}`;
        const game = await generateStockfishGame(gameId, depth, maxMoves, (move, pgn) => {
          if (move % 10 === 0) {
            log('debug', `Game ${gameId} progress: ${move} moves`);
          }
        });
        
        if (game.pgn && game.moveCount > 0) {
          games.push({
            ...game,
            id: gameId,
            generatedAt: new Date().toISOString(),
            workerId
          });
          stats.gamesGenerated++;
        }
      } catch (gameError) {
        log('error', 'Failed to generate individual game', { error: gameError.message });
        stats.errors++;
      }
    }
    
    return games;
  } catch (error) {
    log('error', 'Batch generation failed', { error: error.message });
    stats.errors++;
    return [];
  }
}

// Save games to disk
function saveGames(games) {
  if (games.length === 0) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `games_${workerId}_${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(games, null, 2));
    stats.gamesSaved += games.length;
    log('info', `Saved ${games.length} games to ${filename}`);
  } catch (error) {
    log('error', 'Failed to save games', { error: error.message });
  }
}

// Main worker loop
async function runWorker() {
  log('info', 'Chess Game Worker starting', { 
    batchSize: workerConfig.batchSize,
    depth: workerConfig.depth,
    maxMoves: workerConfig.maxMoves
  });
  
  // Set process priority (lower = less CPU priority, prevents system freezing)
  try {
    process.nice(10);
    log('info', 'Process priority lowered to prevent system overload');
  } catch (e) {
    log('warn', 'Could not set process priority');
  }
  
  while (true) {
    try {
      // Check if we should pause due to high system load
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (memPercent > config.system.maxMemoryPercent) {
        log('warn', `High memory usage (${memPercent.toFixed(1)}%), pausing for 30s`);
        await new Promise(r => setTimeout(r, 30000));
        continue;
      }
      
      // Generate batch
      const startTime = Date.now();
      const games = await generateGameBatch(
        workerConfig.batchSize,
        workerConfig.depth,
        workerConfig.maxMoves
      );
      
      // Save results
      saveGames(games);
      
      const duration = Date.now() - startTime;
      log('info', `Batch complete`, { 
        gamesGenerated: games.length,
        durationMs: duration,
        totalGames: stats.gamesGenerated,
        totalSaved: stats.gamesSaved,
        errors: stats.errors
      });
      
      // Rest between batches
      log('info', `Resting for ${workerConfig.restBetweenBatchesMs}ms`);
      await new Promise(r => setTimeout(r, workerConfig.restBetweenBatchesMs));
      
    } catch (error) {
      log('error', 'Worker loop error', { error: error.message });
      stats.errors++;
      
      // Exponential backoff on errors
      const backoff = Math.min(60000, 5000 * Math.pow(2, Math.min(stats.errors, 5)));
      log('info', `Backing off for ${backoff}ms before retry`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully', { stats });
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down gracefully', { stats });
  process.exit(0);
});

// Start worker
runWorker().catch(error => {
  log('error', 'Fatal worker error', { error: error.message });
  process.exit(1);
});
