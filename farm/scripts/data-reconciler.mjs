#!/usr/bin/env node
/**
 * Cross-System Reconciliation Script
 * Detects and reports discrepancies between web and terminal benchmark data
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

const LOG_FILE = path.join(__dirname, '../logs/reconciliation-report.json');

class DataReconciler {
  constructor() {
    this.discrepancies = [];
    this.stats = {
      web_total: 0,
      terminal_total: 0,
      overlap_count: 0,
      conflicting_predictions: 0
    };
  }

  async runReconciliation() {
    console.log('\n🔄 Cross-System Data Reconciliation');
    console.log('='.repeat(60));
    
    await this.compareSourceCounts();
    await this.findOverlappingGames();
    await this.checkPredictionConsistency();
    await this.analyzeThroughputBalance();
    await this.validateDataLineage();
    
    this.generateReport();
    this.saveLog();
    
    return this.discrepancies.length === 0;
  }

  async compareSourceCounts() {
    console.log('\n📊 Comparing web vs terminal data volumes...');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Web data (volume and deep pools)
    const { count: webCount, error: webError } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)
      .in('data_source', ['volume_pool', 'deep_pool', 'web_benchmark']);
    
    if (webError) {
      console.error('   ❌ Error counting web data:', webError.message);
      return;
    }
    
    // Terminal data
    const { count: terminalCount, error: termError } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)
      .in('data_source', ['terminal_worker', 'farm_terminal', 'chess_benchmark_farm']);
    
    if (termError) {
      console.error('   ❌ Error counting terminal data:', termError.message);
      return;
    }
    
    this.stats.web_total = webCount || 0;
    this.stats.terminal_total = terminalCount || 0;
    
    console.log(`   Web (24h): ${this.stats.web_total} predictions`);
    console.log(`   Terminal (24h): ${this.stats.terminal_total} predictions`);
    
    // Check ratio balance
    const total = this.stats.web_total + this.stats.terminal_total;
    if (total > 0) {
      const webRatio = (this.stats.web_total / total * 100).toFixed(1);
      const termRatio = (this.stats.terminal_total / total * 100).toFixed(1);
      console.log(`   Ratio: ${webRatio}% web / ${termRatio}% terminal`);
      
      // Alert if one source dominates too heavily
      if (webRatio > 90 || termRatio > 90) {
        this.discrepancies.push({
          type: 'IMBALANCED_SOURCES',
          severity: 'WARNING',
          web_ratio: parseFloat(webRatio),
          terminal_ratio: parseFloat(termRatio)
        });
      }
    }
  }

  async findOverlappingGames() {
    console.log('\n📊 Checking for overlapping game analysis...');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Find games analyzed by both web and terminal
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('game_id, data_source')
      .gte('created_at', twentyFourHoursAgo)
      .in('data_source', ['volume_pool', 'deep_pool', 'terminal_worker']);
    
    if (error) {
      console.error('   ❌ Error finding overlaps:', error.message);
      return;
    }
    
    // Group by game_id
    const gameSources = {};
    for (const row of data || []) {
      if (!gameSources[row.game_id]) {
        gameSources[row.game_id] = new Set();
      }
      gameSources[row.game_id].add(row.data_source);
    }
    
    // Find games with multiple sources
    let overlapCount = 0;
    for (const [gameId, sources] of Object.entries(gameSources)) {
      if (sources.size > 1) {
        overlapCount++;
      }
    }
    
    this.stats.overlap_count = overlapCount;
    console.log(`   Games analyzed by both systems: ${overlapCount}`);
    
    // At scale, some overlap is expected due to dedup timing windows
    // But high overlap indicates coordination issues
    if (overlapCount > 100) {
      console.warn(`   ⚠️ High overlap detected: ${overlapCount} games`);
      this.discrepancies.push({
        type: 'HIGH_OVERLAP',
        severity: 'WARNING',
        overlap_count: overlapCount
      });
    }
  }

  async checkPredictionConsistency() {
    console.log('\n📊 Checking prediction consistency across systems...');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Compare accuracy rates between web and terminal
    const { data: webStats, error: webError } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_correct, stockfish_correct')
      .gte('created_at', twentyFourHoursAgo)
      .in('data_source', ['volume_pool', 'deep_pool']);
    
    if (webError) {
      console.error('   ❌ Error getting web stats:', webError.message);
      return;
    }
    
    const { data: termStats, error: termError } = await supabase
      .from('chess_prediction_attempts')
      .select('hybrid_correct, stockfish_correct')
      .gte('created_at', twentyFourHoursAgo)
      .eq('data_source', 'terminal_worker');
    
    if (termError) {
      console.error('   ❌ Error getting terminal stats:', termError.message);
      return;
    }
    
    // Calculate accuracy rates
    if (webStats && webStats.length > 0) {
      const webHybridAcc = webStats.filter(r => r.hybrid_correct).length / webStats.length * 100;
      const webSfAcc = webStats.filter(r => r.stockfish_correct).length / webStats.length * 100;
      console.log(`   Web Hybrid Accuracy: ${webHybridAcc.toFixed(1)}%`);
      console.log(`   Web SF Accuracy: ${webSfAcc.toFixed(1)}%`);
    }
    
    if (termStats && termStats.length > 0) {
      const termHybridAcc = termStats.filter(r => r.hybrid_correct).length / termStats.length * 100;
      const termSfAcc = termStats.filter(r => r.stockfish_correct).length / termStats.length * 100;
      console.log(`   Terminal Hybrid Accuracy: ${termHybridAcc.toFixed(1)}%`);
      console.log(`   Terminal SF Accuracy: ${termSfAcc.toFixed(1)}%`);
    }
    
    // Large accuracy differences indicate system divergence
    if (webStats?.length > 50 && termStats?.length > 50) {
      const webHybridAcc = webStats.filter(r => r.hybrid_correct).length / webStats.length;
      const termHybridAcc = termStats.filter(r => r.hybrid_correct).length / termStats.length;
      
      const diff = Math.abs(webHybridAcc - termHybridAcc) * 100;
      if (diff > 15) {
        console.warn(`   ⚠️ Large accuracy gap: ${diff.toFixed(1)}% difference`);
        this.discrepancies.push({
          type: 'ACCURACY_DIVERGENCE',
          severity: 'WARNING',
          accuracy_diff: diff,
          web_accuracy: webHybridAcc * 100,
          terminal_accuracy: termHybridAcc * 100
        });
      }
    }
  }

  async analyzeThroughputBalance() {
    console.log('\n📊 Analyzing throughput distribution...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Hourly breakdown by source
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('data_source, count(*)')
      .gte('created_at', oneHourAgo)
      .group('data_source');
    
    if (error) {
      console.error('   ❌ Error analyzing throughput:', error.message);
      return;
    }
    
    console.log('   Hourly throughput by source:');
    for (const row of data || []) {
      console.log(`     ${row.data_source}: ${row.count}/hour`);
    }
    
    // Check for source gaps (no data from expected sources)
    const sources = new Set(data?.map(r => r.data_source) || []);
    const expectedSources = ['volume_pool', 'deep_pool', 'terminal_worker'];
    
    for (const source of expectedSources) {
      if (!sources.has(source)) {
        console.warn(`   ⚠️ No data from ${source} in last hour`);
        this.discrepancies.push({
          type: 'SOURCE_GAP',
          severity: 'WARNING',
          missing_source: source
        });
      }
    }
  }

  async validateDataLineage() {
    console.log('\n📊 Validating data lineage...');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Check for records without proper lineage markers
    const { count: noTierCount, error: tierError } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)
      .is('data_quality_tier', null);
    
    if (tierError) {
      console.error('   ❌ Error checking lineage:', tierError.message);
      return;
    }
    
    if (noTierCount > 0) {
      console.warn(`   ⚠️ ${noTierCount} records without data_quality_tier`);
      this.discrepancies.push({
        type: 'MISSING_LINEAGE',
        severity: 'WARNING',
        count: noTierCount
      });
    } else {
      console.log('   ✅ All records have proper lineage markers');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RECONCILIATION REPORT');
    console.log('='.repeat(60));
    
    console.log('\nStatistics (24h):');
    console.log(`  Web predictions: ${this.stats.web_total}`);
    console.log(`  Terminal predictions: ${this.stats.terminal_total}`);
    console.log(`  Overlapping games: ${this.stats.overlap_count}`);
    
    if (this.discrepancies.length === 0) {
      console.log('\n✅ No discrepancies found - systems are in sync');
    } else {
      console.log(`\n⚠️ Found ${this.discrepancies.length} discrepancy(s):`);
      for (const disc of this.discrepancies) {
        console.log(`\n[${disc.severity}] ${disc.type}`);
        if (disc.count) console.log(`  Count: ${disc.count}`);
        if (diff.web_accuracy) console.log(`  Web: ${disc.web_accuracy?.toFixed(1)}%`);
        if (disc.terminal_accuracy) console.log(`  Terminal: ${disc.terminal_accuracy?.toFixed(1)}%`);
      }
    }
    
    console.log('='.repeat(60));
  }

  saveLog() {
    const log = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      discrepancies: this.discrepancies,
      status: this.discrepancies.length === 0 ? 'SYNCED' : 'DISCREPANCIES_FOUND'
    };
    
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      } catch {}
    }
    
    logs.push(log);
    
    // Keep last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log(`\n💾 Report saved to ${LOG_FILE}`);
  }
}

// Run reconciler
const reconciler = new DataReconciler();
reconciler.runReconciliation().then(synced => {
  process.exit(synced ? 0 : 1);
});
