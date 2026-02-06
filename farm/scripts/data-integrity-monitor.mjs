#!/usr/bin/env node
/**
 * Data Integrity Monitor for Scaled Benchmarking
 * Runs continuously to detect and alert on data integrity issues
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

const LOG_FILE = path.join(__dirname, '../logs/data-integrity-monitor.json');

// Ensure log directory exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

class DataIntegrityMonitor {
  constructor() {
    this.checks = [];
    this.issues = [];
  }

  async runAllChecks() {
    console.log('\n🔒 Data Integrity Monitor - Running Checks');
    console.log('='.repeat(60));
    
    await this.checkDuplicateGameIds();
    await this.checkInvalidFenFormats();
    await this.checkMissingRequiredFields();
    await this.checkDataQualityTiers();
    await this.checkPositionHashConsistency();
    await this.checkTimestampAnomalies();
    await this.checkThroughputSpikes();
    
    this.generateReport();
    this.saveLog();
    
    return this.issues.length === 0;
  }

  async checkDuplicateGameIds() {
    console.log('\n📋 Checking for duplicate game_ids...');
    
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('game_id, count(*)')
      .group('game_id')
      .having('count(*)', 'gt', 1)
      .limit(10);
    
    if (error) {
      console.error('   ❌ Error checking duplicates:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.warn(`   ⚠️ Found ${data.length} duplicate game_ids!`);
      this.issues.push({
        type: 'DUPLICATE_GAME_IDS',
        severity: 'CRITICAL',
        count: data.length,
        samples: data.slice(0, 3)
      });
    } else {
      console.log('   ✅ No duplicate game_ids found');
    }
  }

  async checkInvalidFenFormats() {
    console.log('\n📋 Checking FEN format validity...');
    
    // Valid FEN has 6 space-separated parts
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('id, game_id, fen')
      .not('fen', 'is', null)
      .limit(1000);
    
    if (error) {
      console.error('   ❌ Error checking FEN:', error.message);
      return;
    }
    
    let invalidCount = 0;
    const samples = [];
    
    for (const row of data || []) {
      const fenParts = row.fen.split(' ').length;
      if (fenParts !== 6) {
        invalidCount++;
        if (samples.length < 3) {
          samples.push({ id: row.id, game_id: row.game_id, fen: row.fen.substring(0, 50) });
        }
      }
    }
    
    if (invalidCount > 0) {
      console.warn(`   ⚠️ Found ${invalidCount} invalid FEN formats!`);
      this.issues.push({
        type: 'INVALID_FEN_FORMAT',
        severity: 'HIGH',
        count: invalidCount,
        samples
      });
    } else {
      console.log('   ✅ All FEN formats valid');
    }
  }

  async checkMissingRequiredFields() {
    console.log('\n📋 Checking for missing required fields...');
    
    const requiredFields = ['game_id', 'actual_result', 'hybrid_prediction', 'stockfish_prediction'];
    const missingChecks = [];
    
    for (const field of requiredFields) {
      const { count, error } = await supabase
        .from('chess_prediction_attempts')
        .select('*', { count: 'exact', head: true })
        .is(field, null);
      
      if (error) {
        console.error(`   ❌ Error checking ${field}:`, error.message);
        continue;
      }
      
      if (count > 0) {
        missingChecks.push({ field, count });
      }
    }
    
    if (missingChecks.length > 0) {
      console.warn(`   ⚠️ Found ${missingChecks.length} fields with missing data`);
      this.issues.push({
        type: 'MISSING_REQUIRED_FIELDS',
        severity: 'HIGH',
        fields: missingChecks
      });
    } else {
      console.log('   ✅ All required fields present');
    }
  }

  async checkDataQualityTiers() {
    console.log('\n📋 Checking data quality tier distribution...');
    
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('data_quality_tier, count(*)')
      .group('data_quality_tier');
    
    if (error) {
      console.error('   ❌ Error checking tiers:', error.message);
      return;
    }
    
    console.log('   Distribution:');
    for (const row of data || []) {
      console.log(`     ${row.data_quality_tier || 'NULL'}: ${row.count}`);
    }
    
    // Check for legacy or NULL tiers at scale
    const legacyCount = data?.find(r => r.data_quality_tier === 'legacy')?.count || 0;
    const nullCount = data?.find(r => r.data_quality_tier === null)?.count || 0;
    
    if (legacyCount > 1000 || nullCount > 100) {
      this.issues.push({
        type: 'OUTDATED_DATA_TIERS',
        severity: 'MEDIUM',
        legacy_count: legacyCount,
        null_count: nullCount
      });
    }
  }

  async checkPositionHashConsistency() {
    console.log('\n📋 Checking position hash consistency...');
    
    // Sample recent records to verify hash matches FEN
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('id, fen, position_hash')
      .not('position_hash', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('   ❌ Error checking hashes:', error.message);
      return;
    }
    
    // Simple validation: hash should be 16 hex chars
    let invalidHashes = 0;
    for (const row of data || []) {
      if (!/^[a-f0-9]{16}$/i.test(row.position_hash)) {
        invalidHashes++;
      }
    }
    
    if (invalidHashes > 0) {
      console.warn(`   ⚠️ Found ${invalidHashes} invalid position hashes`);
      this.issues.push({
        type: 'INVALID_POSITION_HASH',
        severity: 'MEDIUM',
        count: invalidHashes
      });
    } else {
      console.log('   ✅ Position hashes valid');
    }
  }

  async checkTimestampAnomalies() {
    console.log('\n📋 Checking for timestamp anomalies...');
    
    const { data, error } = await supabase
      .from('chess_prediction_attempts')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('   ❌ Error checking timestamps:', error.message);
      return;
    }
    
    if (data) {
      const recordTime = new Date(data.created_at);
      const now = new Date();
      const diffHours = (now - recordTime) / (1000 * 60 * 60);
      
      if (diffHours > 2) {
        console.warn(`   ⚠️ Last record is ${diffHours.toFixed(1)} hours old`);
        this.issues.push({
          type: 'STALE_DATA',
          severity: 'HIGH',
          hours_since_last_record: diffHours
        });
      } else {
        console.log(`   ✅ Recent activity detected (${diffHours.toFixed(1)}h ago)`);
      }
    }
  }

  async checkThroughputSpikes() {
    console.log('\n📋 Checking for throughput anomalies...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);
    
    if (error) {
      console.error('   ❌ Error checking throughput:', error.message);
      return;
    }
    
    const hourlyRate = count || 0;
    const expectedMax = 2000; // Max expected per hour at full scale
    
    if (hourlyRate > expectedMax * 1.5) {
      console.warn(`   ⚠️ Unusually high throughput: ${hourlyRate}/hour`);
      this.issues.push({
        type: 'THROUGHPUT_SPIKE',
        severity: 'WARNING',
        hourly_rate: hourlyRate,
        expected_max: expectedMax
      });
    } else if (hourlyRate < 10) {
      console.warn(`   ⚠️ Very low throughput: ${hourlyRate}/hour`);
      this.issues.push({
        type: 'LOW_THROUGHPUT',
        severity: 'WARNING',
        hourly_rate: hourlyRate
      });
    } else {
      console.log(`   ✅ Throughput normal: ${hourlyRate}/hour`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA INTEGRITY REPORT');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('✅ All checks passed - data integrity is solid');
    } else {
      console.log(`⚠️ Found ${this.issues.length} issue(s):`);
      for (const issue of this.issues) {
        console.log(`\n[${issue.severity}] ${issue.type}`);
        if (issue.count) console.log(`  Count: ${issue.count}`);
        if (issue.samples) console.log(`  Samples:`, issue.samples);
      }
    }
    
    console.log('='.repeat(60));
  }

  saveLog() {
    const log = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      issue_count: this.issues.length,
      status: this.issues.length === 0 ? 'HEALTHY' : 'ISSUES_DETECTED'
    };
    
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      } catch {}
    }
    
    logs.push(log);
    
    // Keep last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  }
}

// Run monitor
const monitor = new DataIntegrityMonitor();
monitor.runAllChecks().then(healthy => {
  process.exit(healthy ? 0 : 1);
});
