#!/usr/bin/env node
/**
 * Farm Process Manager
 * Manages all workers: starts, stops, monitors, auto-restarts
 * 
 * Usage: node farm-manager.js [start|stop|status|logs]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config/farm.config.json');
const LOG_DIR = path.join(__dirname, '../logs');
const PID_DIR = path.join(__dirname, '../pids');

// Ensure directories exist
[LOG_DIR, PID_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Track running processes
const workers = new Map();

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] [farm-manager] ${message}`;
  console.log(line);
  
  const logFile = path.join(LOG_DIR, 'farm-manager.log');
  fs.appendFileSync(logFile, line + '\n');
}

function savePid(workerName, pid) {
  const pidFile = path.join(PID_DIR, `${workerName}.pid`);
  fs.writeFileSync(pidFile, pid.toString());
}

function removePid(workerName) {
  const pidFile = path.join(PID_DIR, `${workerName}.pid`);
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
  }
}

function loadPids() {
  const pids = {};
  if (fs.existsSync(PID_DIR)) {
    fs.readdirSync(PID_DIR).forEach(file => {
      if (file.endsWith('.pid')) {
        const workerName = file.replace('.pid', '');
        const pid = fs.readFileSync(path.join(PID_DIR, file), 'utf8').trim();
        pids[workerName] = parseInt(pid);
      }
    });
  }
  return pids;
}

function startWorker(type, id, command, args) {
  const workerName = `${type}-${id}`;
  
  if (workers.has(workerName)) {
    log(`Worker ${workerName} already running`);
    return;
  }
  
  log(`Starting worker: ${workerName}`);
  
  const child = spawn(command, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', (data) => {
    console.log(`[${workerName}] ${data.toString().trim()}`);
  });
  
  child.stderr.on('data', (data) => {
    console.error(`[${workerName}] ERROR: ${data.toString().trim()}`);
  });
  
  child.on('exit', (code, signal) => {
    log(`Worker ${workerName} exited with code ${code}, signal ${signal}`, 'warn');
    workers.delete(workerName);
    removePid(workerName);
    
    // Auto-restart if enabled
    if (config.system.autoRestartOnFailure && code !== 0) {
      log(`Auto-restarting ${workerName} in ${config.system.restartDelayMs}ms`);
      setTimeout(() => {
        startWorker(type, id, command, args);
      }, config.system.restartDelayMs);
    }
  });
  
  workers.set(workerName, child);
  savePid(workerName, child.pid);
  
  log(`Worker ${workerName} started with PID ${child.pid}`);
}

function stopWorker(workerName) {
  const child = workers.get(workerName);
  if (child) {
    log(`Stopping worker: ${workerName}`);
    process.kill(-child.pid); // Kill process group
    workers.delete(workerName);
    removePid(workerName);
  } else {
    // Try to kill by PID file
    const pidFile = path.join(PID_DIR, `${workerName}.pid`);
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
      try {
        process.kill(-pid);
        log(`Stopped worker ${workerName} (PID ${pid})`);
      } catch (e) {
        log(`Worker ${workerName} not running`);
      }
      removePid(workerName);
    }
  }
}

function stopAll() {
  log('Stopping all workers...');
  workers.forEach((child, name) => {
    stopWorker(name);
  });
  
  // Also clean up any orphaned PID files
  const pids = loadPids();
  Object.entries(pids).forEach(([name, pid]) => {
    try {
      process.kill(-pid, 0); // Check if process exists
      process.kill(-pid); // Kill it
      log(`Stopped orphaned worker ${name} (PID ${pid})`);
    } catch (e) {
      // Process doesn't exist
    }
    removePid(name);
  });
  
  log('All workers stopped');
}

function startAll() {
  log('Starting farm workers...');
  
  // Chess game generators
  if (config.workers.chessGameGenerator.enabled) {
    for (let i = 0; i < config.workers.chessGameGenerator.instances; i++) {
      startWorker(
        'chess-game',
        i,
        'node',
        [path.join(__dirname, 'chess-worker.js'), i.toString()]
      );
    }
  }
  
  // Market analyzers
  if (config.workers.marketAnalyzer.enabled) {
    for (let i = 0; i < config.workers.marketAnalyzer.instances; i++) {
      startWorker(
        'market-analyzer',
        i,
        'node',
        [path.join(__dirname, 'market-worker.js'), i.toString()]
      );
    }
  }
  
  // Prediction benchmark runners
  if (config.workers.predictionBenchmark.enabled) {
    for (let i = 0; i < config.workers.predictionBenchmark.instances; i++) {
      startWorker(
        'prediction-benchmark',
        i,
        'node',
        [path.join(__dirname, 'benchmark-worker.js'), i.toString()]
      );
    }
  }
  
  log('All workers started');
}

function status() {
  const pids = loadPids();
  const running = Object.entries(pids).filter(([name, pid]) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  });
  
  console.log('\n=== Farm Status ===');
  console.log(`Total workers configured: ${Object.keys(pids).length}`);
  console.log(`Running: ${running.length}`);
  console.log('\nRunning workers:');
  running.forEach(([name, pid]) => {
    console.log(`  ✓ ${name} (PID: ${pid})`);
  });
  
  const stopped = Object.keys(pids).filter(name => !running.find(([n]) => n === name));
  if (stopped.length > 0) {
    console.log('\nStopped workers:');
    stopped.forEach(name => {
      console.log(`  ✗ ${name}`);
    });
  }
  console.log('');
}

// Handle commands
const command = process.argv[2];

switch (command) {
  case 'start':
    startAll();
    break;
  case 'stop':
    stopAll();
    break;
  case 'status':
    status();
    break;
  case 'logs':
    const worker = process.argv[3];
    if (worker) {
      const logFile = path.join(LOG_DIR, `${worker}.log`);
      if (fs.existsSync(logFile)) {
        console.log(fs.readFileSync(logFile, 'utf8'));
      } else {
        console.error(`No logs found for ${worker}`);
      }
    } else {
      console.log('Usage: node farm-manager.js logs <worker-name>');
      console.log('Example: node farm-manager.js logs chess-game-0');
    }
    break;
  default:
    console.log('Usage: node farm-manager.js [start|stop|status|logs]');
    console.log('');
    console.log('Commands:');
    console.log('  start   - Start all farm workers');
    console.log('  stop    - Stop all farm workers');
    console.log('  status  - Show status of all workers');
    console.log('  logs    - Show logs for a specific worker');
    console.log('');
    console.log('Workers:');
    console.log('  chess-game-{n}      - Chess game generators');
    console.log('  market-analyzer-{n} - Market analysis workers');
    console.log('  prediction-benchmark-{n} - Prediction benchmark runners');
}

// Keep process alive if starting
if (command === 'start') {
  setInterval(() => {
    // Health check every 30 seconds
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      log('WARNING: Farm manager memory usage high', 'warn');
    }
  }, 30000);
  
  // Handle signals
  process.on('SIGTERM', () => {
    log('SIGTERM received, stopping all workers');
    stopAll();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log('SIGINT received, stopping all workers');
    stopAll();
    process.exit(0);
  });
}
