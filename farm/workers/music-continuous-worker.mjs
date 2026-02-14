#!/usr/bin/env node
/**
 * En Pensent Music Domain — Continuous PM2 Worker
 * 
 * Processes MAESTRO v3.0.0 MIDI files continuously, writing predictions
 * to Supabase for the self-evolution engine to learn from.
 * 
 * Source: MAESTRO v3.0.0 (1,276 concert piano performances, ~200 hours)
 * Task: 3-way melodic direction (ascending / descending / stable)
 * Pipeline: Raw MIDI → 24-channel features → 8×8 grid → archetype → prediction
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import pg from 'pg';
import {
  extractMusicFeatures,
  enrichWithConsciousnessChannels,
  populateMusicGrid,
  classifyMusicArchetype,
  predictFromMusicSignature,
  learnMusicArchetypeWeights,
} from './domain-adapters/music-adapter.mjs';
import { extractUniversalSignature } from './domain-adapters/universal-grid.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const MAESTRO_DIR = process.env.MAESTRO_DIR || '/Users/alecshelts/Downloads/maestro-v3.0.0';
const WORKER_ID = `music-worker-${process.pid}`;
const BATCH_SIZE = 10; // Files per cycle
const CYCLE_DELAY_MS = 5000; // 5s between cycles
const PHRASE_WINDOW = 8; // beats per phrase
const PHRASE_HOP = 4; // hop between phrases
const MIN_NOTES = 16; // minimum notes per file
const CONTEXT_SIZE = 8; // previous phrases for grid context
const DIR_THRESHOLD = 2.0; // semitones (self-learned from benchmark)
const BLEND_ALPHA = 0.80; // self-learned from benchmark
const ENABLE_CONSCIOUSNESS = true; // 12 new channels: déjà vu, dream entropy, memory, synesthesia

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ezvfslkjyjsqycztyfxh.supabase.co';
const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const log = (msg, level = 'info') => {
  const ts = new Date().toISOString();
  const prefix = level === 'warn' ? '⚠️' : level === 'error' ? '❌' : 'ℹ️';
  console.log(`[${ts}] [${WORKER_ID}] ${prefix} ${msg}`);
};

// ═══════════════════════════════════════════════════════════
// RAW MIDI BINARY PARSER (same as benchmark worker)
// ═══════════════════════════════════════════════════════════

function parseMidiBinary(buffer) {
  const bufLen = buffer.length;
  let pos = 0;
  
  function readUint16() {
    if (pos + 2 > bufLen) throw new Error('EOF');
    const val = (buffer[pos] << 8) | buffer[pos + 1]; pos += 2; return val;
  }
  function readUint32() {
    if (pos + 4 > bufLen) throw new Error('EOF');
    const val = (buffer[pos] << 24) | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3];
    pos += 4; return val >>> 0;
  }
  function readVarLen() {
    let val = 0, byte, safety = 0;
    do {
      if (pos >= bufLen) break;
      byte = buffer[pos++];
      val = (val << 7) | (byte & 0x7F);
      if (++safety > 4) break;
    } while (byte & 0x80);
    return val;
  }
  
  const headerTag = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  if (headerTag !== 'MThd') throw new Error('Not MIDI');
  pos = 4;
  const headerLen = readUint32();
  readUint16(); // format
  const ntrks = readUint16();
  const division = readUint16();
  const ticksPerBeat = (division & 0x8000) ? 480 : division;
  pos = 8 + headerLen;
  
  const allNotes = [];
  
  for (let t = 0; t < ntrks && pos < bufLen; t++) {
    if (pos + 8 > bufLen) break;
    const trackTag = String.fromCharCode(buffer[pos], buffer[pos+1], buffer[pos+2], buffer[pos+3]);
    pos += 4;
    const trackLen = readUint32();
    if (trackTag !== 'MTrk') { pos += trackLen; continue; }
    
    const trackEnd = pos + trackLen;
    let tickTime = 0, runningStatus = 0;
    const activeNotes = {};
    
    while (pos < trackEnd && pos < bufLen) {
      if (pos + 1 >= bufLen) break;
      tickTime += readVarLen();
      if (pos >= bufLen) break;
      
      let statusByte = buffer[pos];
      if (statusByte & 0x80) { runningStatus = statusByte; pos++; }
      else { statusByte = runningStatus; }
      
      const eventType = statusByte & 0xF0;
      const channel = statusByte & 0x0F;
      
      if (eventType === 0x90) {
        if (pos + 2 > bufLen) break;
        const pitch = buffer[pos++], velocity = buffer[pos++];
        const timeBeats = tickTime / ticksPerBeat;
        const key = `${channel}-${pitch}`;
        
        if (velocity === 0) {
          if (activeNotes[key]) {
            allNotes.push({ pitch, velocity: activeNotes[key].velocity, time: activeNotes[key].startTime, duration: Math.max(0.01, timeBeats - activeNotes[key].startTime), channel });
            delete activeNotes[key];
          }
        } else {
          if (activeNotes[key]) {
            allNotes.push({ pitch, velocity: activeNotes[key].velocity, time: activeNotes[key].startTime, duration: Math.max(0.01, timeBeats - activeNotes[key].startTime), channel });
          }
          activeNotes[key] = { startTime: timeBeats, velocity };
        }
      } else if (eventType === 0x80) {
        if (pos + 2 > bufLen) break;
        const pitch = buffer[pos++]; pos++;
        const timeBeats = tickTime / ticksPerBeat;
        const key = `${channel}-${pitch}`;
        if (activeNotes[key]) {
          allNotes.push({ pitch, velocity: activeNotes[key].velocity, time: activeNotes[key].startTime, duration: Math.max(0.01, timeBeats - activeNotes[key].startTime), channel });
          delete activeNotes[key];
        }
      } else if (eventType === 0xFF) {
        if (pos >= bufLen) break;
        const metaType = buffer[pos++];
        const metaLen = readVarLen();
        pos += metaLen;
      } else if (eventType === 0xF0 || eventType === 0xF7) {
        const sysLen = readVarLen();
        pos += sysLen;
      } else {
        // 2-byte events: program change, channel pressure
        if (eventType === 0xC0 || eventType === 0xD0) { pos++; }
        else { pos += 2; }
      }
    }
    pos = trackEnd;
  }
  
  allNotes.sort((a, b) => a.time - b.time);
  return allNotes;
}

function windowNotes(notes, windowBeats, hopBeats) {
  if (!notes.length) return [];
  const maxTime = notes[notes.length - 1].time;
  const windows = [];
  for (let start = 0; start <= maxTime - windowBeats + 1; start += hopBeats) {
    const end = start + windowBeats;
    const wNotes = notes.filter(n => n.time >= start && n.time < end);
    if (wNotes.length >= 4) windows.push({ start, end, notes: wNotes });
  }
  return windows;
}

function getPhraseDirection(notes, threshold) {
  if (notes.length < 2) return 'stable';
  const half = Math.floor(notes.length / 2);
  const firstHalf = notes.slice(0, half);
  const secondHalf = notes.slice(half);
  const meanFirst = firstHalf.reduce((s, n) => s + n.pitch, 0) / firstHalf.length;
  const meanSecond = secondHalf.reduce((s, n) => s + n.pitch, 0) / secondHalf.length;
  const diff = meanSecond - meanFirst;
  if (diff > threshold) return 'ascending';
  if (diff < -threshold) return 'descending';
  return 'stable';
}

// ═══════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════

let pool = null;

function initPool() {
  if (!DB_URL) {
    log('No DATABASE_URL — predictions will be logged but not saved to DB', 'warn');
    return null;
  }
  const p = new pg.Pool({ connectionString: DB_URL, max: 2, idleTimeoutMillis: 30000 });
  p.on('error', (err) => log(`Pool error: ${err.message}`, 'warn'));
  // Graceful shutdown — drain pool before exit to prevent zombie connections
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, async () => {
      log(`${sig} received — draining pool...`);
      try { await p.end(); } catch {}
      process.exit(0);
    });
  }
  return p;
}

async function savePrediction(record) {
  if (!pool) return;
  try {
    await pool.query(`
      INSERT INTO music_prediction_attempts 
        (performance_id, composer, title, phrase_index, predicted_direction, actual_direction,
         archetype, confidence, worker_id, correct, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT DO NOTHING
    `, [
      record.performanceId, record.composer, record.title, record.phraseIndex,
      record.predicted, record.actual, record.archetype, record.confidence,
      WORKER_ID, record.predicted === record.actual,
    ]);
  } catch (err) {
    if (err.code === '42P01') {
      // Table doesn't exist yet — create it
      await createTable();
      return savePrediction(record);
    }
    log(`Save error: ${err.message}`, 'warn');
  }
}

async function createTable() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS music_prediction_attempts (
        id SERIAL PRIMARY KEY,
        performance_id TEXT,
        composer TEXT,
        title TEXT,
        phrase_index INTEGER,
        predicted_direction TEXT,
        actual_direction TEXT,
        archetype TEXT,
        confidence DECIMAL,
        worker_id TEXT,
        correct BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    log('Created music_prediction_attempts table');
  } catch (err) {
    log(`Create table error: ${err.message}`, 'warn');
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN PROCESSING LOOP
// ═══════════════════════════════════════════════════════════

async function processFile(file, maestroDir, learnedWeights) {
  const midiPath = join(maestroDir, file.midiFile);
  if (!fs.existsSync(midiPath)) return null;
  
  const buffer = fs.readFileSync(midiPath);
  const notes = parseMidiBinary(buffer);
  if (notes.length < MIN_NOTES) return null;
  
  const windows = windowNotes(notes, PHRASE_WINDOW, PHRASE_HOP);
  if (windows.length < CONTEXT_SIZE + 2) return null;
  
  const featureWindows = windows.map(w => ({
    ...w,
    features: extractMusicFeatures(w.notes, PHRASE_WINDOW),
    direction: getPhraseDirection(w.notes, DIR_THRESHOLD),
  }));
  
  // Enrich with consciousness channels (déjà vu, memory depth, imagination novelty)
  // These need cross-window comparison so must run on the full sequence
  if (ENABLE_CONSCIOUSNESS) {
    const allFeatures = featureWindows.map(w => w.features).filter(Boolean);
    enrichWithConsciousnessChannels(allFeatures);
  }
  
  const predictions = [];
  
  for (let i = CONTEXT_SIZE; i < featureWindows.length - 1; i++) {
    const ctx = featureWindows.slice(i - CONTEXT_SIZE, i).map(w => w.features).filter(Boolean);
    if (ctx.length < 3) continue;
    
    const grid = populateMusicGrid(ctx);
    const signature = extractUniversalSignature(grid, ctx.length);
    const archetype = classifyMusicArchetype(signature);
    
    const currentDir = featureWindows[i].direction;
    const actualDir = featureWindows[i + 1].direction;
    
    // Predict using archetype weights + persistence blend
    let predicted = currentDir; // persistence baseline
    let confidence = 0.34;
    
    if (learnedWeights && learnedWeights[archetype]) {
      const w = learnedWeights[archetype];
      const dirs = ['ascending', 'descending', 'stable'];
      const scores = dirs.map(d => (w[d] || 0.33));
      const bestIdx = scores.indexOf(Math.max(...scores));
      const epPred = dirs[bestIdx];
      confidence = scores[bestIdx];
      
      // Blend: alpha * EP + (1-alpha) * persistence
      if (BLEND_ALPHA > 0.5) {
        predicted = confidence > 0.36 ? epPred : currentDir;
      }
    }
    
    predictions.push({
      performanceId: `${file.composer}_${file.year}_${i}`,
      composer: file.composer,
      title: file.title,
      phraseIndex: i,
      predicted,
      actual: actualDir,
      archetype,
      confidence,
    });
  }
  
  return { predictions, noteCount: notes.length, phraseCount: predictions.length };
}

async function main() {
  log('═══════════════════════════════════════════════════════');
  log('  En Pensent Music Worker — MAESTRO v3.0.0');
  log('═══════════════════════════════════════════════════════');
  
  // Load metadata
  const metadataPath = join(MAESTRO_DIR, 'maestro-v3.0.0.json');
  if (!fs.existsSync(metadataPath)) {
    log(`MAESTRO metadata not found at ${metadataPath}`, 'error');
    log('Set MAESTRO_DIR env var to the maestro-v3.0.0 directory');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const numEntries = Object.keys(metadata.canonical_composer).length;
  
  const files = [];
  for (let i = 0; i < numEntries; i++) {
    const key = String(i);
    files.push({
      composer: metadata.canonical_composer[key],
      title: metadata.canonical_title[key],
      split: metadata.split[key],
      year: metadata.year[key],
      midiFile: metadata.midi_filename[key],
      duration: metadata.duration[key],
    });
  }
  
  log(`Loaded ${files.length} MAESTRO performances`);
  
  // Initialize DB
  pool = initPool();
  
  // Phase 1: Learn weights from training split (one-time)
  log('Phase 1: Learning archetype weights from training split...');
  const trainFiles = files.filter(f => f.split === 'train');
  const trainPredictions = [];
  let trainCount = 0;
  
  for (const file of trainFiles) {
    try {
      const result = await processFile(file, MAESTRO_DIR, null);
      if (result) {
        trainPredictions.push(...result.predictions);
        trainCount++;
        if (trainCount % 100 === 0) {
          log(`Training: ${trainCount}/${trainFiles.length} files, ${trainPredictions.length} phrases`);
        }
      }
    } catch (err) { /* skip */ }
  }
  
  const learnedWeights = learnMusicArchetypeWeights(
    trainPredictions.map(p => ({ archetype: p.archetype, actualDirection: p.actual }))
  );
  log(`Learned weights for ${Object.keys(learnedWeights).length} archetypes from ${trainPredictions.length} training phrases`);
  
  // Phase 2: Continuous processing of test/validation files
  log('Phase 2: Continuous prediction on test + validation splits...');
  const evalFiles = files.filter(f => f.split === 'test' || f.split === 'validation');
  let cycleCount = 0;
  let totalPredictions = 0;
  let totalCorrect = 0;
  let fileIndex = 0;
  
  while (true) {
    cycleCount++;
    const batch = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batch.push(evalFiles[fileIndex % evalFiles.length]);
      fileIndex++;
    }
    
    let cyclePreds = 0, cycleCorrect = 0, cycleNotes = 0;
    
    for (const file of batch) {
      try {
        const result = await processFile(file, MAESTRO_DIR, learnedWeights);
        if (!result) continue;
        
        for (const pred of result.predictions) {
          await savePrediction(pred);
          cyclePreds++;
          totalPredictions++;
          if (pred.predicted === pred.actual) { cycleCorrect++; totalCorrect++; }
        }
        cycleNotes += result.noteCount;
      } catch (err) {
        log(`Error processing ${file.midiFile}: ${err.message}`, 'warn');
      }
    }
    
    const cycleAcc = cyclePreds > 0 ? (cycleCorrect / cyclePreds * 100).toFixed(1) : '—';
    const totalAcc = totalPredictions > 0 ? (totalCorrect / totalPredictions * 100).toFixed(1) : '—';
    
    log(`Cycle ${cycleCount}: ${cyclePreds} preds (${cycleAcc}% acc) | Total: ${totalPredictions} (${totalAcc}% acc) | ${cycleNotes} notes`);
    
    // Wrap around
    if (fileIndex >= evalFiles.length * 3) {
      log('Completed 3 passes through eval data. Restarting with shuffled order.');
      fileIndex = 0;
      // Fisher-Yates shuffle (deterministic seed from cycle count)
      for (let i = evalFiles.length - 1; i > 0; i--) {
        const j = (cycleCount * 31 + i * 17) % (i + 1);
        [evalFiles[i], evalFiles[j]] = [evalFiles[j], evalFiles[i]];
      }
    }
    
    await new Promise(r => setTimeout(r, CYCLE_DELAY_MS));
  }
}

main().catch(err => {
  log(`Fatal: ${err.message}`, 'error');
  process.exit(1);
});
