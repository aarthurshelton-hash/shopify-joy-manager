/**
 * Production Deployment Script for High-Frequency Trading System
 * 
 * Usage: node farm/scripts/start-production.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processes = [];

function startProcess(name, command, args, cwd) {
  console.log(`[Production] Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd: cwd || process.cwd(),
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  proc.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    // Auto-restart on crash
    if (code !== 0) {
      console.log(`[${name}] Restarting in 5 seconds...`);
      setTimeout(() => startProcess(name, command, args, cwd), 5000);
    }
  });

  processes.push(proc);
  return proc;
}

console.log('═══════════════════════════════════════════════════');
console.log('  HIGH-FREQUENCY TRADING SYSTEM - PRODUCTION MODE');
console.log('═══════════════════════════════════════════════════');
console.log('Starting all services...\n');

// 1. Start IB Gateway Bridge
startProcess(
  'IB-Bridge',
  'node',
  ['public/ib-gateway-bridge/server-simple.js'],
  join(process.cwd())
);

// Wait for bridge to start
setTimeout(() => {
  // 2. Start High-Frequency Trader
  startProcess(
    'HF-Trader',
    'node',
    ['farm/workers/high-frequency-paper-trader.mjs'],
    join(process.cwd())
  );
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Production] Shutting down all services...');
  processes.forEach(p => p.kill('SIGINT'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Production] Shutting down all services...');
  processes.forEach(p => p.kill('SIGTERM'));
  process.exit(0);
});

console.log('\n✅ Production services starting...');
console.log('📊 Dashboard: http://localhost:5173/stock-predictions');
console.log('🔌 Bridge API: http://localhost:4000/api/status');
console.log('Press Ctrl+C to stop all services\n');
