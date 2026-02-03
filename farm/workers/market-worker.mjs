#!/usr/bin/env node
/**
 * Market Prediction Analysis Worker
 * Continuously analyzes market data and generates predictions
 * 
 * Usage: node market-worker.js [workerId]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_PATH = path.join(__dirname, '../config/farm.config.json');
const LOG_DIR = path.join(__dirname, '../logs');
const DATA_DIR = path.join(__dirname, '../data/market_analysis');

// Ensure directories exist
[LOG_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const workerConfig = config.workers.marketAnalyzer;
const workerId = process.argv[2] || '0';

// Logger
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    worker: `market-analyzer-${workerId}`,
    message,
    ...meta
  };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] [market-analyzer-${workerId}] ${message}`);
  
  const logFile = path.join(LOG_DIR, `market-analyzer-${workerId}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Stats tracking
let stats = {
  analysesCompleted: 0,
  predictionsGenerated: 0,
  errors: 0,
  startTime: Date.now()
};

// Mock market analysis function (replace with actual implementation)
async function analyzeMarket(symbol) {
  log('info', `Analyzing ${symbol}`);
  
  // This would connect to your actual market prediction system
  // For now, simulating the structure
  
  try {
    // Example: Fetch market data
    // const marketData = await fetchMarketData(symbol);
    // const prediction = await generateMarketPrediction(marketData);
    
    // Simulated result
    await new Promise(r => setTimeout(r, 1000)); // Simulate processing
    
    return {
      symbol,
      timestamp: new Date().toISOString(),
      prediction: {
        direction: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
        confidence: Math.random() * 100,
        timeframe: '1h'
      },
      analysis: {
        trend: 'uptrend',
        volatility: 'medium',
        volume: 'increasing'
      }
    };
  } catch (error) {
    log('error', `Failed to analyze ${symbol}`, { error: error.message });
    throw error;
  }
}

// Save analysis results
function saveAnalysis(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `market_${workerId}_${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    stats.predictionsGenerated += results.length;
    log('info', `Saved ${results.length} analyses to ${filename}`);
  } catch (error) {
    log('error', 'Failed to save analyses', { error: error.message });
  }
}

// Main worker loop
async function runWorker() {
  log('info', 'Market Analysis Worker starting', { 
    symbols: workerConfig.symbols,
    interval: workerConfig.analysisIntervalMs
  });
  
  // Set process priority
  try {
    process.nice(5);
    log('info', 'Process priority set');
  } catch (e) {
    log('warn', 'Could not set process priority');
  }
  
  while (true) {
    try {
      const startTime = Date.now();
      log('info', 'Starting analysis cycle');
      
      // Analyze all configured symbols
      const results = [];
      for (const symbol of workerConfig.symbols) {
        try {
          const analysis = await analyzeMarket(symbol);
          results.push(analysis);
          stats.analysesCompleted++;
        } catch (error) {
          stats.errors++;
          log('error', `Error analyzing ${symbol}`, { error: error.message });
        }
        
        // Small delay between symbols to prevent rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
      
      // Save results
      if (results.length > 0) {
        saveAnalysis(results);
      }
      
      const duration = Date.now() - startTime;
      const nextRun = workerConfig.analysisIntervalMs - duration;
      
      log('info', `Analysis cycle complete`, {
        durationMs: duration,
        analysesCompleted: results.length,
        totalAnalyses: stats.analysesCompleted,
        errors: stats.errors,
        nextRunInMs: Math.max(0, nextRun)
      });
      
      // Wait until next interval
      if (nextRun > 0) {
        log('info', `Waiting ${nextRun}ms until next cycle`);
        await new Promise(r => setTimeout(r, nextRun));
      }
      
    } catch (error) {
      log('error', 'Worker loop error', { error: error.message });
      stats.errors++;
      
      const backoff = Math.min(60000, 5000 * Math.pow(2, Math.min(stats.errors, 5)));
      log('info', `Backing off for ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down', { stats });
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down', { stats });
  process.exit(0);
});

// Start
runWorker().catch(error => {
  log('error', 'Fatal worker error', { error: error.message });
  process.exit(1);
});
