#!/usr/bin/env node
/**
 * Benchmark Throughput Verification System
 * Verifies the 4,920 games/day target is being met
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_GAMES_PER_DAY = 17000;
const TARGET_GAMES_PER_HOUR = TARGET_GAMES_PER_DAY / 24;

// System capacity breakdown:
// Web auto-evolution: ~1,880 games/hour (volume: 1,800 + deep: 80)
// Terminal workers: Variable based on active worker count
// Total designed capacity: 17,000+ games/day

async function verifyThroughput() {
  console.log('\n📊 Benchmark Throughput Verification');
  console.log('='.repeat(60));
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  try {
    // Count games in last 24 hours
    const { count: dailyCount, error: dailyError } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString());
    
    if (dailyError) throw dailyError;
    
    // Count games in last hour
    const { count: hourlyCount, error: hourlyError } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString());
    
    if (hourlyError) throw hourlyError;
    
    // Calculate metrics
    const dailyRate = dailyCount || 0;
    const hourlyRate = hourlyCount || 0;
    const dailyPercentage = (dailyRate / TARGET_GAMES_PER_DAY * 100).toFixed(1);
    const hourlyPercentage = (hourlyRate / TARGET_GAMES_PER_HOUR * 100).toFixed(1);
    
    console.log(`\n🎯 Target: ${TARGET_GAMES_PER_DAY} games/day (${TARGET_GAMES_PER_HOUR.toFixed(0)}/hour)`);
    console.log(`\n📈 Actual Performance:`);
    console.log(`   Last 24 hours: ${dailyRate} games (${dailyPercentage}%)`);
    console.log(`   Last hour:     ${hourlyRate} games (${hourlyPercentage}%)`);
    
    // Status indicator
    const isOnTarget = dailyRate >= TARGET_GAMES_PER_DAY * 0.9; // 90% threshold
    const isHourlyOnTarget = hourlyRate >= TARGET_GAMES_PER_HOUR * 0.8;
    
    console.log(`\n${isOnTarget ? '✅' : '⚠️'} Daily Target: ${isOnTarget ? 'MET' : 'BELOW TARGET'}`);
    console.log(`${isHourlyOnTarget ? '✅' : '⚠️'} Hourly Rate: ${isHourlyOnTarget ? 'GOOD' : 'LOW'}`);
    
    // Detailed breakdown
    const { data: sourceBreakdown, error: sourceError } = await supabase
      .from('chess_prediction_attempts')
      .select('data_source')
      .gte('created_at', oneDayAgo.toISOString());
    
    if (!sourceError && sourceBreakdown) {
      const sources = {};
      sourceBreakdown.forEach(row => {
        sources[row.data_source] = (sources[row.data_source] || 0) + 1;
      });
      
      console.log(`\n📊 Source Breakdown (24h):`);
      Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          const pct = (count / dailyRate * 100).toFixed(1);
          console.log(`   ${source}: ${count} (${pct}%)`);
        });
    }
    
    // Save verification log
    const logEntry = {
      timestamp: now.toISOString(),
      daily_count: dailyRate,
      hourly_count: hourlyRate,
      daily_target: TARGET_GAMES_PER_DAY,
      hourly_target: TARGET_GAMES_PER_HOUR,
      daily_percentage: parseFloat(dailyPercentage),
      hourly_percentage: parseFloat(hourlyPercentage),
      on_target: isOnTarget
    };
    
    const logFile = path.join(__dirname, '../logs/throughput-verification.json');
    const logs = fs.existsSync(logFile) 
      ? JSON.parse(fs.readFileSync(logFile, 'utf8')) 
      : [];
    logs.push(logEntry);
    
    // Keep last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => new Date(l.timestamp) > thirtyDaysAgo);
    
    fs.writeFileSync(logFile, JSON.stringify(recentLogs, null, 2));
    
    console.log(`\n💾 Verification log saved to throughput-verification.json`);
    
    return {
      dailyRate,
      hourlyRate,
      onTarget: isOnTarget,
      dailyPercentage: parseFloat(dailyPercentage)
    };
    
  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    return null;
  }
}

// Run verification
verifyThroughput().then(result => {
  if (result) {
    console.log('\n' + '='.repeat(60));
    console.log(`Status: ${result.onTarget ? 'SYSTEM OPERATING NORMALLY' : 'PERFORMANCE BELOW TARGET'}`);
    console.log('='.repeat(60) + '\n');
    process.exit(result.onTarget ? 0 : 1);
  } else {
    process.exit(2);
  }
});
