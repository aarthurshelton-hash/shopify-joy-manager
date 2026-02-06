#!/usr/bin/env node
/**
 * Questrade Market Data Fetcher (Informational Only)
 * 
 * Provides Canadian market data and TSX-listed stock information
 * for display and analysis purposes. Does NOT execute trades.
 * 
 * Questrade API requires OAuth2 authentication:
 * 1. Create app at https://my.questrade.com/settings/apps
 * 2. Get refresh token
 * 3. Exchange for access token
 * 
 * @version 1.0-QUESTRADE-DATA
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// Questrade Configuration
const QUESTRADE_REFRESH_TOKEN = process.env.QUESTRADE_REFRESH_TOKEN;
const QUESTRADE_API_URL = process.env.QUESTRADE_API_URL || 'https://api01.iq.questrade.com'; // Personal API URL from auth

// Canadian Symbols to track
const CA_SYMBOLS = [
  { symbol: 'XIU', name: 'iShares S&P/TSX 60 Index ETF' },
  { symbol: 'XIC', name: 'iShares Core S&P/TSX Capped Composite Index ETF' },
  { symbol: 'XEG', name: 'iShares S&P/TSX Capped Energy Index ETF' },
  { symbol: 'XFN', name: 'iShares S&P/TSX Capped Financials Index ETF' },
  { symbol: 'XIT', name: 'iShares S&P/TSX Capped Information Technology Index ETF' },
  { symbol: 'XMD', name: 'iShares S&P/TSX Completion Index ETF' },
  { symbol: 'XRE', name: 'iShares S&P/TSX Capped REIT Index ETF' },
  { symbol: 'TSX:SHOP', name: 'Shopify Inc.' },
  { symbol: 'TSX:RY', name: 'Royal Bank of Canada' },
  { symbol: 'TSX:TD', name: 'Toronto-Dominion Bank' },
  { symbol: 'TSX:ENB', name: 'Enbridge Inc.' },
  { symbol: 'TSX:CNR', name: 'Canadian National Railway' },
  { symbol: 'TSX:BAM', name: 'Brookfield Asset Management' },
  { symbol: 'TSX:BCE', name: 'BCE Inc.' },
  { symbol: 'TSX:SU', name: 'Suncor Energy Inc.' },
];

let accessToken = null;
let apiServerUrl = null;

// Logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [questrade-data]`;
  
  if (level === 'error') {
    console.error(`${prefix} ❌ ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️  ${message}`);
  } else {
    console.log(`${prefix} ℹ️  ${message}`);
  }
}

// Authenticate with Questrade
async function authenticate() {
  if (!QUESTRADE_REFRESH_TOKEN) {
    log('QUESTRADE_REFRESH_TOKEN not set in .env', 'error');
    log('Get your token at: https://my.questrade.com/settings/apps', 'info');
    return false;
  }
  
  try {
    const response = await fetch(`https://login.questrade.com/oauth2/token?grant_type=refresh_token&refresh_token=${QUESTRADE_REFRESH_TOKEN}`);
    
    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }
    
    const data = await response.json();
    accessToken = data.access_token;
    apiServerUrl = data.api_server;
    
    log(`Authenticated to ${apiServerUrl}`);
    return true;
  } catch (err) {
    log(`Authentication error: ${err.message}`, 'error');
    return false;
  }
}

// Make authenticated request
async function questradeRequest(endpoint) {
  if (!accessToken || !apiServerUrl) {
    const authed = await authenticate();
    if (!authed) return null;
  }
  
  try {
    const response = await fetch(`${apiServerUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // Token expired, re-authenticate
      accessToken = null;
      const authed = await authenticate();
      if (!authed) return null;
      
      // Retry
      return await questradeRequest(endpoint);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    log(`Request error: ${err.message}`, 'error');
    return null;
  }
}

// Search for symbol
async function searchSymbol(symbol) {
  const prefix = symbol.startsWith('TSX:') ? symbol.replace('TSX:', '') : symbol;
  const data = await questradeRequest(`/v1/symbols/search?prefix=${prefix}`);
  return data?.symbols?.[0] || null;
}

// Get quote for symbol
async function getQuote(symbolId) {
  const data = await questradeRequest(`/v1/markets/quotes/${symbolId}`);
  return data?.quotes?.[0] || null;
}

// Get TSX market movers
async function getTSXMovers() {
  log('Fetching TSX market data...');
  
  const results = [];
  
  for (const sym of CA_SYMBOLS) {
    try {
      // Search for symbol
      const symbolInfo = await searchSymbol(sym.symbol);
      if (!symbolInfo) {
        log(`Symbol not found: ${sym.symbol}`, 'warn');
        continue;
      }
      
      // Get quote
      const quote = await getQuote(symbolInfo.symbolId);
      if (!quote) {
        log(`No quote for: ${sym.symbol}`, 'warn');
        continue;
      }
      
      results.push({
        symbol: sym.symbol,
        name: sym.name,
        lastPrice: quote.lastTradePrice,
        bid: quote.bidPrice,
        ask: quote.askPrice,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high: quote.highPrice,
        low: quote.lowPrice,
        open: quote.openPrice,
        timestamp: new Date().toISOString(),
      });
      
      log(`${sym.symbol}: $${quote.lastTradePrice.toFixed(2)} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
      
      // Rate limiting - be nice to the API
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      log(`Error fetching ${sym.symbol}: ${err.message}`, 'error');
    }
  }
  
  return results;
}

// Display market summary
function displaySummary(data) {
  if (!data || data.length === 0) {
    log('No market data available');
    return;
  }
  
  log('\n═══════════════════════════════════════════');
  log('     TSX/CANADIAN MARKET SUMMARY');
  log('═══════════════════════════════════════════');
  
  // Top gainers
  const gainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  log('\n📈 Top Gainers:');
  gainers.forEach(s => {
    log(`  ${s.symbol}: +${s.changePercent.toFixed(2)}% ($${s.lastPrice.toFixed(2)})`);
  });
  
  // Top losers
  const losers = [...data].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);
  log('\n📉 Top Losers:');
  losers.forEach(s => {
    log(`  ${s.symbol}: ${s.changePercent.toFixed(2)}% ($${s.lastPrice.toFixed(2)})`);
  });
  
  // Most active by volume
  const active = [...data].sort((a, b) => b.volume - a.volume).slice(0, 3);
  log('\n🔥 Most Active (Volume):');
  active.forEach(s => {
    log(`  ${s.symbol}: ${(s.volume / 1000).toFixed(0)}K shares`);
  });
  
  log('\n═══════════════════════════════════════════');
}

// Main function
async function main() {
  log('Questrade Market Data Fetcher');
  log('==============================');
  
  if (!QUESTRADE_REFRESH_TOKEN) {
    log('\n⚠️  QUESTRADE_REFRESH_TOKEN not configured');
    log('To enable Canadian market data:');
    log('1. Login to https://my.questrade.com');
    log('2. Go to Settings → App Hub → Create App');
    log('3. Copy your refresh token to .env');
    log('4. Add: QUESTRADE_REFRESH_TOKEN=your_token_here');
    log('\nContinuing without Questrade data...\n');
    return;
  }
  
  // Authenticate
  const authed = await authenticate();
  if (!authed) {
    log('Failed to authenticate with Questrade', 'error');
    return;
  }
  
  // Fetch market data
  const data = await getTSXMovers();
  
  // Display summary
  displaySummary(data);
  
  // Could save to database here if needed
  // await saveToSupabase(data);
  
  log('\nData fetch complete. Run this periodically for Canadian market updates.');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    log(`Fatal error: ${err.message}`, 'error');
    process.exit(1);
  });
}

export { getTSXMovers, searchSymbol, getQuote };
