/**
 * En Pensent Music Domain Adapter
 * 
 * Maps MIDI/musical temporal patterns onto the universal 8×8 visualization grid.
 * 24 channels with natural music color palette:
 *   - Pitch = rainbow (low=red C1, mid=green C4, high=violet C8)
 *   - Velocity = brightness (pp=dim, ff=bright)
 *   - Duration = saturation (staccato=vivid, legato=soft)
 *   - Interval = warm/cool (consonant=warm, dissonant=cool)
 *   - Rhythm = pulse (on-beat=solid, syncopated=dashed)
 *   - Harmony = blend (major=warm, minor=cool)
 * 
 * Full 8-quadrant engine from day one.
 * 
 * Classification: 3-way melodic direction (ascending / descending / stable)
 * Baseline: persistence (predict same direction as last phrase)
 */

import {
  createGrid,
  extractUniversalSignature,
} from './universal-grid.mjs';

// ═══════════════════════════════════════════════════════════
// CHANNEL DEFINITIONS: 24 music channels
// ═══════════════════════════════════════════════════════════

const MUSIC_CHANNELS = [
  // Row 0-1: Pitch domain (rainbow palette)
  'pitch_mean',        // Average pitch in window (MIDI note 0-127)
  'pitch_range',       // Pitch range (highest - lowest)
  'pitch_contour',     // Melodic contour direction (-1 to +1)
  'pitch_z',           // Z-score of current pitch vs window
  'pitch_entropy',     // Pitch class entropy (0-1, variety of notes used)
  'chromatic_density',  // Chromatic note density (half-step movements)

  // Row 2-3: Rhythm domain (pulse palette)
  'note_density',      // Notes per beat (event density)
  'ioi_mean',          // Mean inter-onset interval (timing regularity)
  'ioi_std',           // IOI standard deviation (rhythmic complexity)
  'syncopation',       // Off-beat note proportion
  'duration_mean',     // Average note duration
  'rest_ratio',        // Proportion of silence vs sound

  // Row 4-5: Dynamics/Expression domain (brightness palette)
  'velocity_mean',     // Average velocity (loudness)
  'velocity_range',    // Dynamic range
  'velocity_contour',  // Getting louder or softer (-1 to +1)
  'accent_density',    // Strong accent proportion (vel > 100)
  'velocity_z',        // Z-score of velocity vs window
  'crescendo',         // Rate of velocity change (positive = crescendo)

  // Row 6-7: Harmonic/Interval domain (warm/cool palette)
  'interval_mean',     // Average interval size (semitones)
  'consonance',        // Consonant interval ratio (3rds, 5ths, octaves)
  'dissonance',        // Dissonant interval ratio (2nds, 7ths, tritones)
  'step_ratio',        // Stepwise vs leap ratio
  'direction_changes', // Number of direction changes (zigzag)
  'register_position', // Where in the instrument range (0=low, 1=high)

  // ═══ CONSCIOUSNESS LAYER (rows overflow → stacks on grid) ═══
  // These capture higher-order temporal patterns the base 24 channels miss.
  // Mathematically: autocorrelation, information entropy, self-similarity.
  'deja_vu',           // Autocorrelation: pattern recurrence detection (0=novel, 1=exact repeat)
  'dream_entropy',     // Transition surprisal: unpredictability of note-to-note jumps (0=predictable, 1=chaotic)
  'memory_depth',      // Self-similarity with earliest window (long-range dependency, 0=unrelated, 1=identical)
  'imagination_novelty',// Divergence from all prior patterns (0=derivative, 1=unprecedented)
  'lucidity',          // Predictability: how well persistence model predicts next note (0=dreamlike, 1=lucid)
  'temporal_binding',  // Phase coherence: are pitch/rhythm/dynamics changes synchronized? (0=fragmented, 1=bound)

  // ═══ SYNESTHETIC LAYER ═══
  // Cross-modal correspondences grounded in psychoacoustic research.
  // Marks 1974, Spence 2011: pitch↔brightness, loudness↔weight are universal.
  'olfactory_resonance',// Overtone-series interval density — harmonic "scent" (smell→memory via overtone depth)
  'visual_brightness',  // Pitch height → perceived brightness (high=bright, low=dark) — Marks 1974
  'visual_weight',      // Register×velocity → perceived weight (low+loud=heavy, high+soft=light)
  'tactile_texture',    // Roughness: dissonance×rhythmic irregularity (smooth↔rough)
  'color_temperature',  // Major/sharp intervals=warm, minor/flat=cool (chromesthesia)
  'spatial_depth',      // Auditory scene: velocity×IOI → near/far (loud+dense=close, soft+sparse=distant)
];

const MUSIC_COLORS = {};
const COLOR_PALETTE = 'RrOoYyGgCcBbPpVvWwAaDdEeFfHh';
MUSIC_CHANNELS.forEach((ch, i) => {
  MUSIC_COLORS[ch] = COLOR_PALETTE[i % COLOR_PALETTE.length];
});

// ═══════════════════════════════════════════════════════════
// MIDI PARSING: Convert raw MIDI events to note arrays
// ═══════════════════════════════════════════════════════════

/**
 * Parse a simple MIDI-like note array from raw data.
 * Each note: { pitch, velocity, time (beats), duration (beats), channel }
 * 
 * Supports both raw MIDI binary and pre-parsed JSON formats.
 */
export function parseMidiNotes(data) {
  // If already an array of notes, validate and return
  if (Array.isArray(data)) {
    return data.filter(n => 
      n && typeof n.pitch === 'number' && typeof n.time === 'number' &&
      n.pitch >= 0 && n.pitch <= 127
    );
  }
  
  // If it's a buffer/string, parse as simplified MIDI
  // For full MIDI parsing, use a dedicated library (midi-parser-js)
  // This handles our benchmark format: JSON array of note events
  if (typeof data === 'string') {
    try {
      return parseMidiNotes(JSON.parse(data));
    } catch (e) {
      console.error('[MusicAdapter] Failed to parse MIDI data:', e.message);
      return [];
    }
  }
  
  return [];
}

// ═══════════════════════════════════════════════════════════
// FEATURE EXTRACTION: Convert note windows to 24-channel features
// ═══════════════════════════════════════════════════════════

// Consonant intervals (in semitones): unison, minor 3rd, major 3rd, perfect 4th, perfect 5th, minor 6th, major 6th, octave
const CONSONANT_INTERVALS = new Set([0, 3, 4, 5, 7, 8, 9, 12]);
// Dissonant intervals: minor 2nd, major 2nd, tritone, minor 7th, major 7th
const DISSONANT_INTERVALS = new Set([1, 2, 6, 10, 11]);

/**
 * Extract 24-channel feature vector from a window of MIDI notes.
 * 
 * @param {object[]} notes - Array of note events in this window
 * @param {number} windowDuration - Duration of window in beats
 * @returns {object} Feature vector with all 24 channels
 */
export function extractMusicFeatures(notes, windowDuration = 8) {
  if (!notes || notes.length === 0) {
    return null;
  }
  
  const pitches = notes.map(n => n.pitch);
  const velocities = notes.map(n => n.velocity || 64);
  const durations = notes.map(n => n.duration || 0.5);
  const times = notes.map(n => n.time);
  
  // Pitch features
  const pitchMean = pitches.reduce((s, v) => s + v, 0) / pitches.length;
  const pitchMin = Math.min(...pitches);
  const pitchMax = Math.max(...pitches);
  const pitchRange = pitchMax - pitchMin;
  
  // Pitch contour: regression slope of pitches over time
  let pitchContour = 0;
  if (pitches.length > 1) {
    const n = pitches.length;
    const xMean = (n - 1) / 2;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (pitches[i] - pitchMean);
      den += (i - xMean) ** 2;
    }
    pitchContour = den > 0 ? num / den : 0;
    pitchContour = Math.max(-1, Math.min(1, pitchContour / 12)); // Normalize to ±1
  }
  
  // Pitch entropy: variety of pitch classes (0-11)
  const pitchClasses = new Set(pitches.map(p => p % 12));
  const pitchEntropy = pitchClasses.size / 12;
  
  // Chromatic density: proportion of half-step movements
  let chromaticSteps = 0;
  for (let i = 1; i < pitches.length; i++) {
    if (Math.abs(pitches[i] - pitches[i - 1]) === 1) chromaticSteps++;
  }
  const chromaticDensity = pitches.length > 1 ? chromaticSteps / (pitches.length - 1) : 0;
  
  // Pitch z-score
  const pitchStd = Math.sqrt(pitches.reduce((s, v) => s + (v - pitchMean) ** 2, 0) / pitches.length) || 1;
  const lastPitch = pitches[pitches.length - 1];
  const pitchZ = (lastPitch - pitchMean) / pitchStd;
  
  // Rhythm features
  const noteDensity = notes.length / windowDuration;
  
  const iois = [];
  for (let i = 1; i < times.length; i++) {
    iois.push(times[i] - times[i - 1]);
  }
  const ioiMean = iois.length > 0 ? iois.reduce((s, v) => s + v, 0) / iois.length : 1;
  const ioiStd = iois.length > 0 ? Math.sqrt(iois.reduce((s, v) => s + (v - ioiMean) ** 2, 0) / iois.length) : 0;
  
  // Syncopation: notes that don't fall on beat boundaries
  const syncopation = notes.filter(n => n.time % 1 > 0.1 && n.time % 1 < 0.9).length / notes.length;
  
  const durationMean = durations.reduce((s, v) => s + v, 0) / durations.length;
  
  // Rest ratio: approximate from gaps between notes
  const totalNoteDuration = durations.reduce((s, v) => s + v, 0);
  const restRatio = Math.max(0, 1 - totalNoteDuration / windowDuration);
  
  // Dynamics features
  const velMean = velocities.reduce((s, v) => s + v, 0) / velocities.length;
  const velMin = Math.min(...velocities);
  const velMax = Math.max(...velocities);
  const velRange = velMax - velMin;
  
  let velContour = 0;
  if (velocities.length > 1) {
    const n = velocities.length;
    const xMean = (n - 1) / 2;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (velocities[i] - velMean);
      den += (i - xMean) ** 2;
    }
    velContour = den > 0 ? num / den : 0;
    velContour = Math.max(-1, Math.min(1, velContour / 30));
  }
  
  const accentDensity = velocities.filter(v => v > 100).length / velocities.length;
  const velStd = Math.sqrt(velocities.reduce((s, v) => s + (v - velMean) ** 2, 0) / velocities.length) || 1;
  const velZ = (velocities[velocities.length - 1] - velMean) / velStd;
  const crescendo = velContour; // Rate of velocity change
  
  // Interval/Harmonic features
  const intervals = [];
  for (let i = 1; i < pitches.length; i++) {
    intervals.push(Math.abs(pitches[i] - pitches[i - 1]));
  }
  const intervalMean = intervals.length > 0 ? intervals.reduce((s, v) => s + v, 0) / intervals.length : 0;
  
  const consonantCount = intervals.filter(i => CONSONANT_INTERVALS.has(i % 12)).length;
  const dissonantCount = intervals.filter(i => DISSONANT_INTERVALS.has(i % 12)).length;
  const totalIntervals = intervals.length || 1;
  const consonance = consonantCount / totalIntervals;
  const dissonance = dissonantCount / totalIntervals;
  
  // Step vs leap (step = 1-2 semitones, leap = 3+)
  const stepCount = intervals.filter(i => i <= 2).length;
  const stepRatio = stepCount / totalIntervals;
  
  // Direction changes
  let dirChanges = 0;
  for (let i = 2; i < pitches.length; i++) {
    const prev = Math.sign(pitches[i - 1] - pitches[i - 2]);
    const curr = Math.sign(pitches[i] - pitches[i - 1]);
    if (prev !== 0 && curr !== 0 && prev !== curr) dirChanges++;
  }
  const directionChanges = pitches.length > 2 ? dirChanges / (pitches.length - 2) : 0;
  
  // Register position (0=low, 1=high, relative to piano range 21-108)
  const registerPosition = (pitchMean - 21) / (108 - 21);
  
  // ═══ SYNESTHETIC CHANNELS (computable per-window) ═══
  
  // Olfactory resonance: density of overtone-series intervals (octave, 5th, 4th, major 3rd)
  // Overtone series: 12, 7, 5, 4 semitones. These are the intervals that "resonate" 
  // like how scent resonates with deep memory — through harmonic physics.
  const OVERTONE_INTERVALS = new Set([12, 7, 5, 4, 19, 24]); // octave, 5th, 4th, M3, compound
  const overtoneCount = intervals.filter(i => OVERTONE_INTERVALS.has(i) || OVERTONE_INTERVALS.has(i % 12)).length;
  const olfactoryResonance = totalIntervals > 0 ? overtoneCount / totalIntervals : 0;
  
  // Visual brightness: pitch height → brightness (Marks 1974: universally cross-modal)
  // MIDI 0-127 → 0-1 brightness
  const visualBrightness = pitchMean / 127;
  
  // Visual weight: low+loud = heavy, high+soft = light
  // Normalized: (127 - pitch)/127 × velocity/127
  const visualWeight = ((127 - pitchMean) / 127) * (velMean / 127);
  
  // Tactile texture: roughness from dissonance × rhythmic irregularity
  // Helmholtz 1863: beats between close frequencies = roughness perception
  const rhythmIrregularity = ioiStd / (ioiMean || 1);
  const tactileTexture = Math.min(1, dissonance * 0.6 + Math.min(1, rhythmIrregularity) * 0.4);
  
  // Color temperature: major/consonant = warm, minor/dissonant = cool
  // Based on chromesthesia research: sharp keys perceived as warm colors
  const colorTemperature = consonance - dissonance; // -1 to +1 (cool to warm)
  
  // Spatial depth: loud+dense = near, soft+sparse = far (auditory scene analysis, Bregman 1990)
  const loudness = velMean / 127;
  const density = Math.min(1, noteDensity / 8); // normalize to ~8 notes/beat max
  const spatialDepth = 1 - (loudness * 0.5 + density * 0.5); // 0=near, 1=far
  
  // Dream entropy: transition surprisal — Shannon entropy of interval distribution
  // High entropy = unpredictable = dreamlike, Low = structured = lucid
  const intervalCounts = {};
  for (const iv of intervals) {
    const norm = iv % 12;
    intervalCounts[norm] = (intervalCounts[norm] || 0) + 1;
  }
  let dreamEntropy = 0;
  if (intervals.length > 0) {
    for (const count of Object.values(intervalCounts)) {
      const p = count / intervals.length;
      if (p > 0) dreamEntropy -= p * Math.log2(p);
    }
    dreamEntropy = Math.min(1, dreamEntropy / 3.585); // Normalize by log2(12) = max entropy for 12 classes
  }
  
  // Lucidity: how predictable is the next note from a simple persistence model?
  // Count how often note[i] == note[i-1] (exact repeat) or interval == previous interval
  let persistCorrect = 0;
  for (let i = 2; i < pitches.length; i++) {
    const prevInterval = pitches[i - 1] - pitches[i - 2];
    const currInterval = pitches[i] - pitches[i - 1];
    if (currInterval === prevInterval) persistCorrect++;
  }
  const lucidity = pitches.length > 2 ? persistCorrect / (pitches.length - 2) : 0.5;
  
  // Temporal binding: are pitch, velocity, and rhythm changes synchronized?
  // Compute correlation between pitch contour and velocity contour directions
  let bindingScore = 0;
  if (pitches.length > 2) {
    let pitchVelAgree = 0, pitchRhythmAgree = 0, count = 0;
    for (let i = 1; i < Math.min(pitches.length, velocities.length, times.length) - 1; i++) {
      const pDir = Math.sign(pitches[i] - pitches[i - 1]);
      const vDir = Math.sign(velocities[i] - velocities[i - 1]);
      const tDir = Math.sign((times[i + 1] - times[i]) - (times[i] - times[i - 1]));
      if (pDir !== 0 && vDir !== 0 && pDir === vDir) pitchVelAgree++;
      if (pDir !== 0 && tDir !== 0 && pDir === -tDir) pitchRhythmAgree++; // Rising pitch often = faster
      count++;
    }
    bindingScore = count > 0 ? (pitchVelAgree + pitchRhythmAgree) / (count * 2) : 0;
  }
  
  return {
    pitch_mean: pitchMean,
    pitch_range: pitchRange,
    pitch_contour: pitchContour,
    pitch_z: pitchZ,
    pitch_entropy: pitchEntropy,
    chromatic_density: chromaticDensity,
    
    note_density: noteDensity,
    ioi_mean: ioiMean,
    ioi_std: ioiStd,
    syncopation,
    duration_mean: durationMean,
    rest_ratio: restRatio,
    
    velocity_mean: velMean,
    velocity_range: velRange,
    velocity_contour: velContour,
    accent_density: accentDensity,
    velocity_z: velZ,
    crescendo,
    
    interval_mean: intervalMean,
    consonance,
    dissonance,
    step_ratio: stepRatio,
    direction_changes: directionChanges,
    register_position: registerPosition,
    
    // Consciousness channels (per-window; déjà vu, memory_depth, imagination_novelty added in enrichment)
    deja_vu: 0,              // Placeholder — computed in enrichWithConsciousnessChannels
    dream_entropy: dreamEntropy,
    memory_depth: 0,         // Placeholder — needs full sequence
    imagination_novelty: 0,  // Placeholder — needs full sequence
    lucidity,
    temporal_binding: bindingScore,
    
    // Synesthetic channels
    olfactory_resonance: olfactoryResonance,
    visual_brightness: visualBrightness,
    visual_weight: visualWeight,
    tactile_texture: tactileTexture,
    color_temperature: colorTemperature,
    spatial_depth: spatialDepth,
  };
}

/**
 * CONSCIOUSNESS ENRICHMENT: Cross-window features that need the full sequence.
 * 
 * Déjà vu = autocorrelation (how similar is THIS window to PREVIOUS windows?)
 * Memory depth = self-similarity with EARLIEST window (long-range dependency)
 * Imagination novelty = divergence from ALL prior patterns (unprecedented material)
 * 
 * These are the mathematical equivalents of consciousness phenomena:
 * - Déjà vu IS pattern recognition firing on a near-match
 * - Memory IS retrieval of distant stored patterns
 * - Imagination IS generation of patterns that don't match any stored template
 */
export function enrichWithConsciousnessChannels(featureSequence) {
  if (!featureSequence || featureSequence.length < 3) return featureSequence;
  
  // Feature vector for cosine similarity (use the 6 core contour channels)
  const SIGNATURE_KEYS = ['pitch_contour', 'velocity_contour', 'consonance', 'dissonance', 'note_density', 'syncopation'];
  
  const toVector = (f) => SIGNATURE_KEYS.map(k => f[k] || 0);
  
  const cosineSim = (a, b) => {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    magA = Math.sqrt(magA); magB = Math.sqrt(magB);
    return (magA > 0 && magB > 0) ? dot / (magA * magB) : 0;
  };
  
  for (let i = 0; i < featureSequence.length; i++) {
    const current = toVector(featureSequence[i]);
    
    // Déjà vu: max similarity to any previous window (pattern recurrence)
    let maxSim = 0;
    for (let j = Math.max(0, i - 20); j < i; j++) {
      const sim = cosineSim(current, toVector(featureSequence[j]));
      if (sim > maxSim) maxSim = sim;
    }
    featureSequence[i].deja_vu = Math.max(0, maxSim);
    
    // Memory depth: similarity to the FIRST window (long-range dependency)
    if (i > 0) {
      featureSequence[i].memory_depth = Math.max(0, cosineSim(current, toVector(featureSequence[0])));
    }
    
    // Imagination novelty: 1 - average similarity to all previous windows
    if (i > 0) {
      let totalSim = 0;
      const lookback = Math.min(i, 15);
      for (let j = i - lookback; j < i; j++) {
        totalSim += cosineSim(current, toVector(featureSequence[j]));
      }
      const avgSim = totalSim / lookback;
      featureSequence[i].imagination_novelty = Math.max(0, 1 - avgSim);
    }
  }
  
  return featureSequence;
}

// ═══════════════════════════════════════════════════════════
// GRID POPULATION: Window-local z-scores (proven approach)
// ═══════════════════════════════════════════════════════════

/**
 * Populate universal 8×8 grid from a sequence of music feature windows.
 * Uses window-local z-scores for each channel.
 */
export function populateMusicGrid(featureSequence, deviationThreshold = 0.5) {
  const grid = createGrid(8, 8);
  
  // Compute window-local statistics per channel
  const channelStats = {};
  for (const ch of MUSIC_CHANNELS) {
    const vals = featureSequence.map(f => f[ch]).filter(v => v !== undefined && v !== null && isFinite(v));
    if (vals.length === 0) continue;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;
    channelStats[ch] = { mean, std };
  }
  
  // Harmonic/interval channels (rows 6-7) carry structural signal about
  // musical tension, consonance, and melodic shape. These should ALWAYS record
  // (like energy's temporal channels) because z-score filtering removes
  // the gradual harmonic shifts that define musical structure.
  // Contour channels also carry directional signal that shouldn't be filtered.
  const STRUCTURAL_CHANNELS = new Set([
    'consonance', 'dissonance', 'interval_mean', 'step_ratio',
    'direction_changes', 'register_position',
    'pitch_contour', 'velocity_contour', 'crescendo',
  ]);
  
  for (let step = 0; step < featureSequence.length; step++) {
    const features = featureSequence[step];
    
    for (let chIdx = 0; chIdx < MUSIC_CHANNELS.length; chIdx++) {
      const ch = MUSIC_CHANNELS[chIdx];
      const raw = features[ch];
      if (raw === undefined || raw === null || !isFinite(raw)) continue;
      
      const isStructural = STRUCTURAL_CHANNELS.has(ch);
      
      let value, col;
      if (isStructural) {
        // Structural channels: use raw value directly
        // ALWAYS record — these define musical structure, not deviations
        value = raw;
        const clamped = Math.max(-1, Math.min(1, raw));
        col = Math.max(0, Math.min(7, Math.floor((clamped + 1) / 2 * 7.99)));
      } else {
        // Other channels: z-score relative to window context
        const stats = channelStats[ch];
        if (!stats) continue;
        const z = (raw - stats.mean) / stats.std;
        if (isNaN(z) || Math.abs(z) < deviationThreshold) continue;
        value = z;
        const zClamped = Math.max(-3, Math.min(3, z));
        col = Math.max(0, Math.min(7, Math.floor((zClamped + 3) / 6 * 7.99)));
      }
      
      // Row: channel group
      const rowGroup = Math.floor(chIdx / 6);
      const rowOffset = (chIdx % 6) < 3 ? 0 : 1;
      const row = Math.min(7, Math.max(0, rowGroup * 2 + rowOffset));
      
      if (!grid[row] || !grid[row][col]) continue;
      
      grid[row][col].visits.push({
        channel: ch,
        color: MUSIC_COLORS[ch],
        value,
        step,
        raw,
      });
    }
  }
  
  return grid;
}

// ═══════════════════════════════════════════════════════════
// ARCHETYPE CLASSIFICATION: Musical archetypes
// ═══════════════════════════════════════════════════════════

const MUSIC_ARCHETYPES = {
  ascending_phrase:     { name: 'Ascending Phrase', direction: 'ascending' },
  descending_phrase:    { name: 'Descending Phrase', direction: 'descending' },
  arch_phrase:          { name: 'Arch (Rise-Fall)', direction: 'stable' },
  valley_phrase:        { name: 'Valley (Fall-Rise)', direction: 'stable' },
  static_phrase:        { name: 'Static/Pedal', direction: 'stable' },
  climax:              { name: 'Climax (Peak Energy)', direction: 'ascending' },
  resolution:          { name: 'Resolution (Release)', direction: 'descending' },
  tension_build:       { name: 'Tension Building', direction: 'ascending' },
  rhythmic_drive:      { name: 'Rhythmic Drive', direction: 'stable' },
  // 8-QUAD EXCLUSIVE
  call_response:       { name: 'Call & Response (8Q)', direction: 'stable' },
  texture_shift:       { name: 'Texture Shift (8Q)', direction: 'stable' },
  register_change:     { name: 'Register Change (8Q)', direction: 'ascending' },
};

/**
 * Classify music grid pattern into an archetype.
 * Full 8-quadrant engine.
 */
export function classifyMusicArchetype(signature) {
  const { quadrantProfile: qp, temporalFlow: tf, intensity } = signature;
  
  const mainImbalance = Math.abs(qp.q1) + Math.abs(qp.q2) + Math.abs(qp.q3) + Math.abs(qp.q4);
  const centerActivity = Math.abs(qp.q5 || 0) + Math.abs(qp.q6 || 0);
  const edgeActivity = Math.abs(qp.q7 || 0) + Math.abs(qp.q8 || 0);
  const totalImbalance = mainImbalance + centerActivity + edgeActivity;
  
  const pitchQuad = qp.q1;      // Row 0-1: pitch domain
  const rhythmQuad = qp.q2;     // Row 2-3: rhythm domain
  const dynamicsQuad = qp.q3;   // Row 4-5: dynamics domain
  const harmonyQuad = qp.q4;    // Row 6-7: harmony/interval domain
  const centerUpper = qp.q5 || 0;
  const centerLower = qp.q6 || 0;
  const edgeLeft = qp.q7 || 0;
  const edgeRight = qp.q8 || 0;
  
  const trendDir = tf.late - tf.early;
  const centerConviction = Math.abs(centerUpper) + Math.abs(centerLower);
  const edgeExtreme = Math.abs(edgeLeft) + Math.abs(edgeRight);
  
  // Low activity = static/pedal
  if (intensity < 10 || totalImbalance < 3) {
    return 'static_phrase';
  }
  
  // ═══ MAIN PATTERNS ═══
  
  // Climax: high dynamics + high pitch + high density
  if (dynamicsQuad > 2 && pitchQuad > 1 && rhythmQuad > 1) {
    return 'climax';
  }
  
  // Resolution: decreasing dynamics + descending pitch
  if (dynamicsQuad < -1 && pitchQuad < -1 && trendDir < -1) {
    return 'resolution';
  }
  
  // Tension building: rising dynamics + rising pitch
  if (dynamicsQuad > 1 && trendDir > 1) {
    return 'tension_build';
  }
  
  // Strong ascending phrase
  if (pitchQuad > 2 && trendDir > 1) {
    return 'ascending_phrase';
  }
  
  // Strong descending phrase
  if (pitchQuad < -2 && trendDir < -1) {
    return 'descending_phrase';
  }
  
  // Arch: early rising, late falling
  if (tf.early > 0 && tf.late < 0 && Math.abs(tf.early - tf.late) > 2) {
    return 'arch_phrase';
  }
  
  // Valley: early falling, late rising
  if (tf.early < 0 && tf.late > 0 && Math.abs(tf.early - tf.late) > 2) {
    return 'valley_phrase';
  }
  
  // Rhythmic drive: strong rhythm domain, less pitch movement
  if (Math.abs(rhythmQuad) > Math.abs(pitchQuad) * 1.5 && Math.abs(rhythmQuad) > 2) {
    return 'rhythmic_drive';
  }
  
  // ═══ 8-QUAD EXCLUSIVE ═══
  
  // Call & response: center convergence (antiphonal pattern)
  if (centerConviction > mainImbalance * 0.5 && edgeExtreme < centerConviction * 0.5) {
    return 'call_response';
  }
  
  // Texture shift: edge activity dominates (register/timbre change)
  if (edgeExtreme > mainImbalance * 0.5 && edgeExtreme > centerConviction * 3) {
    return 'texture_shift';
  }
  
  // Register change: both center and edge active
  if (centerConviction > mainImbalance * 0.4 && edgeExtreme > mainImbalance * 0.4) {
    return 'register_change';
  }
  
  // Default based on pitch direction
  if (pitchQuad > 0.5) return 'ascending_phrase';
  if (pitchQuad < -0.5) return 'descending_phrase';
  return 'static_phrase';
}

// ═══════════════════════════════════════════════════════════
// PREDICTION: Multi-signal fusion
// ═══════════════════════════════════════════════════════════

const ARCHETYPE_DIRECTION_PRIORS = {
  ascending_phrase:  { ascending: 0.55, descending: 0.20, stable: 0.25 },
  descending_phrase: { ascending: 0.20, descending: 0.55, stable: 0.25 },
  arch_phrase:       { ascending: 0.20, descending: 0.45, stable: 0.35 },
  valley_phrase:     { ascending: 0.45, descending: 0.20, stable: 0.35 },
  static_phrase:     { ascending: 0.25, descending: 0.25, stable: 0.50 },
  climax:            { ascending: 0.15, descending: 0.55, stable: 0.30 },
  resolution:        { ascending: 0.30, descending: 0.15, stable: 0.55 },
  tension_build:     { ascending: 0.60, descending: 0.15, stable: 0.25 },
  rhythmic_drive:    { ascending: 0.30, descending: 0.30, stable: 0.40 },
  call_response:     { ascending: 0.30, descending: 0.30, stable: 0.40 },
  texture_shift:     { ascending: 0.35, descending: 0.35, stable: 0.30 },
  register_change:   { ascending: 0.40, descending: 0.30, stable: 0.30 },
};

/**
 * Predict next-phrase melodic direction from universal grid signature.
 * 7 fused signals including center convergence and edge extremes.
 */
export function predictFromMusicSignature(signature, archetype, learnedWeights = null) {
  const classes = ['ascending', 'descending', 'stable'];
  
  const prior = learnedWeights?.[archetype] || 
                ARCHETYPE_DIRECTION_PRIORS[archetype] || 
                ARCHETYPE_DIRECTION_PRIORS.static_phrase;
  
  const { temporalFlow: tf } = signature;
  const trendBoost = {
    ascending:  tf.late > tf.early ? 0.10 : tf.late < tf.early ? -0.08 : 0,
    descending: tf.late < tf.early ? 0.10 : tf.late > tf.early ? -0.08 : 0,
    stable:     Math.abs(tf.late - tf.early) < 2 ? 0.08 : -0.05,
  };
  
  const dirBoost = {
    ascending:  signature.direction === 'positive' ? 0.10 : signature.direction === 'negative' ? -0.08 : 0,
    descending: signature.direction === 'negative' ? 0.10 : signature.direction === 'positive' ? -0.08 : 0,
    stable:     signature.direction === 'contested' ? 0.05 : -0.03,
  };
  
  const intensityBoost = {
    ascending:  signature.intensity > 30 ? 0.05 : -0.03,
    descending: signature.intensity > 30 ? 0.05 : -0.03,
    stable:     signature.intensity < 15 ? 0.08 : signature.intensity > 40 ? -0.08 : 0,
  };
  
  const volPenalty = Math.min(0.15, (tf.volatility / 100) * 0.15);
  
  // Signal 6: Center convergence (8Q)
  const qp = signature.quadrantProfile;
  const centerConv = Math.abs(qp.q5 || 0) + Math.abs(qp.q6 || 0);
  const mainImb = Math.abs(qp.q1) + Math.abs(qp.q2) + Math.abs(qp.q3) + Math.abs(qp.q4);
  const centerRatio = mainImb > 0 ? centerConv / mainImb : 0;
  const centerBoost = {
    ascending:  centerRatio > 0.2 && (qp.q5 || 0) > 0 ? 0.06 : 0,
    descending: centerRatio > 0.2 && (qp.q5 || 0) < 0 ? 0.06 : 0,
    stable:     centerRatio < 0.1 ? 0.04 : -0.02,
  };
  
  // Signal 7: Edge extremes (8Q)
  const edgeAct = Math.abs(qp.q7 || 0) + Math.abs(qp.q8 || 0);
  const edgeRatio = mainImb > 0 ? edgeAct / mainImb : 0;
  const edgeBoost = {
    ascending:  edgeRatio > 0.25 && (qp.q8 || 0) > 0 ? 0.05 : 0,
    descending: edgeRatio > 0.25 && (qp.q8 || 0) < 0 ? 0.05 : 0,
    stable:     edgeRatio > 0.3 ? -0.04 : 0,
  };
  
  const scores = {};
  for (const cls of classes) {
    scores[cls] = prior[cls] + trendBoost[cls] + dirBoost[cls] + intensityBoost[cls] + centerBoost[cls] + edgeBoost[cls];
    if (cls !== 'stable') scores[cls] -= volPenalty * 0.5;
  }
  
  const total = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1;
  for (const cls of classes) scores[cls] = Math.max(0, scores[cls]) / total;
  
  let bestDir = 'stable';
  let bestScore = -1;
  for (const cls of classes) {
    if (scores[cls] > bestScore) {
      bestScore = scores[cls];
      bestDir = cls;
    }
  }
  
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const rawConfidence = sorted.length > 1 ? sorted[0] - sorted[1] : 0.3;
  const confidence = Math.max(0.30, Math.min(0.85, 0.35 + rawConfidence - volPenalty));
  
  return { direction: bestDir, confidence, scores, archetype };
}

/**
 * Self-learn archetype weights from resolved predictions.
 */
export function learnMusicArchetypeWeights(resolvedPredictions) {
  const counts = {};
  for (const pred of resolvedPredictions) {
    const arch = pred.archetype || 'static_phrase';
    if (!counts[arch]) counts[arch] = { ascending: 0, descending: 0, stable: 0, total: 0 };
    counts[arch][pred.actualDirection || 'stable']++;
    counts[arch].total++;
  }
  const learned = {};
  for (const [arch, c] of Object.entries(counts)) {
    if (c.total < 10) continue;
    learned[arch] = {
      ascending: c.ascending / c.total,
      descending: c.descending / c.total,
      stable: c.stable / c.total,
      sampleSize: c.total,
    };
  }
  return learned;
}

export { MUSIC_CHANNELS, MUSIC_COLORS, MUSIC_ARCHETYPES };
