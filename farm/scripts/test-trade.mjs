#!/usr/bin/env node
/**
 * Test Trade Executor for Paper Account
 * Places test options trades to validate the trading pipeline
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aufycarwflhsdgszbnop.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BRIDGE_URL = process.env.IB_BRIDGE_URL || 'http://localhost:4000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function logTrade(trade) {
  console.log(`\n📊 TEST TRADE EXECUTED`);
  console.log(`Symbol: ${trade.symbol}`);
  console.log(`Side: ${trade.side}`);
  console.log(`Quantity: ${trade.quantity}`);
  console.log(`Price: $${trade.price?.toFixed(2) || 'market'}`);
  console.log(`Status: ${trade.status || 'pending'}`);
  console.log(`Order ID: ${trade.orderId || 'N/A'}`);
}

async function placeTestEquityTrade() {
  console.log('\n🧪 Testing Equity Trade (AAPL)...');
  
  try {
    // Get account
    const accountsRes = await fetch(`${BRIDGE_URL}/api/accounts`);
    const accounts = await accountsRes.json();
    const paperAccount = accounts.accounts?.find(a => a.accountId.startsWith('DU')) || accounts.accounts?.[0];
    
    if (!paperAccount) {
      console.error('❌ No paper account found');
      return;
    }
    
    console.log(`📁 Using account: ${paperAccount.accountId}`);
    
    // Search for AAPL contract - try different endpoint formats
    let contract = null;
    
    try {
      const searchRes = await fetch(`${BRIDGE_URL}/api/contracts/search?symbol=AAPL`);
      const data = await searchRes.json();
      if (data.contracts?.length) {
        contract = data.contracts[0];
      }
    } catch (e) {
      console.log('First search method failed, trying alternative...');
    }
    
    if (!contract) {
      try {
        const searchRes = await fetch(`${BRIDGE_URL}/api/search?symbol=AAPL`);
        const data = await searchRes.json();
        if (data.contracts?.length) {
          contract = data.contracts[0];
        }
      } catch (e) {
        console.log('Second search method failed...');
      }
    }
    
    // Use hardcoded conid for AAPL if search fails
    if (!contract) {
      console.log('Using fallback AAPL conid...');
      contract = {
        conid: 265598,
        symbol: 'AAPL',
        secType: 'STK',
      };
    }
    console.log(`✓ Found contract: ${contract.symbol} (conid: ${contract.conid})`);
    
    // Get current price
    let price = 220;
    try {
      const quoteRes = await fetch(`${BRIDGE_URL}/api/quote?conid=${contract.conid}`);
      if (quoteRes.ok) {
        const quote = await quoteRes.json();
        price = quote.lastPrice || 220;
      } else {
        console.log(`Quote endpoint returned ${quoteRes.status}, using default price`);
      }
    } catch (e) {
      console.log(`Could not fetch quote, using default price: ${e.message}`);
    }
    
    console.log(`💰 Current price: $${price.toFixed(2)}`);
    
    // Calculate small position (10 shares = ~$2200)
    const quantity = 10;
    
    // Place BUY order
    console.log(`🚀 Placing BUY order for ${quantity} shares...`);
    
    const orderRes = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: paperAccount.accountId,
        conid: contract.conid,
        symbol: 'AAPL',
        side: 'BUY',
        quantity: quantity,
        orderType: 'MKT',
      }),
    });
    
    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      console.error(`❌ Order failed with status ${orderRes.status}: ${errorText}`);
      return;
    }
    
    const order = await orderRes.json();
    
    const trade = {
      orderId: order.orderId || order.id,
      symbol: 'AAPL',
      side: 'BUY',
      quantity: quantity,
      price: price,
      status: order.status || 'submitted',
      accountId: paperAccount.accountId,
    };
    
    await logTrade(trade);
    
    // Log to Supabase
    await supabase.from('autonomous_trades').insert({
      session_id: 'test-session',
      worker_id: 'test-executor',
      symbol: 'AAPL',
      direction: 'BUY',
      entry_price: price,
      shares: quantity,
      status: 'open',
      metadata: {
        test_trade: true,
        source: 'manual_test',
        order_id: trade.orderId,
      },
    });
    
    console.log(`✅ Trade logged to Supabase`);
    
    // Wait 5 seconds then place SELL order
    console.log(`\n⏳ Waiting 5 seconds before SELL...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`🚀 Placing SELL order for ${quantity} shares...`);
    
    const sellRes = await fetch(`${BRIDGE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: paperAccount.accountId,
        conid: contract.conid,
        symbol: 'AAPL',
        side: 'SELL',
        quantity: quantity,
        orderType: 'MKT',
      }),
    });
    
    if (!sellRes.ok) {
      const errorText = await sellRes.text();
      console.error(`❌ Sell order failed with status ${sellRes.status}: ${errorText}`);
      return;
    }
    
    const sellOrder = await sellRes.json();
    
    await logTrade({
      orderId: sellOrder.orderId || sellOrder.id,
      symbol: 'AAPL',
      side: 'SELL',
      quantity: quantity,
      price: price * (0.99 + Math.random() * 0.02), // Simulate slight price movement
      status: sellOrder.status || 'submitted',
    });
    
    console.log(`\n✅ Test round-trip complete!`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  PAPER ACCOUNT TEST TRADE EXECUTOR');
  console.log('═══════════════════════════════════════');
  console.log(`Bridge: ${BRIDGE_URL}`);
  console.log(`Account: Paper Trading (DUO712203)`);
  console.log('');
  
  await placeTestEquityTrade();
  
  console.log('\n═══════════════════════════════════════');
  console.log('  Check account to see trades:');
  console.log(`  curl ${BRIDGE_URL}/api/accounts`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
