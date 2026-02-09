/**
 * En Pensent Battery Domain Adapter
 * 
 * Mirrors the chess color flow architecture:
 *   Chess board → 4 quadrants → temporal phases → archetypes → prediction
 *   Battery → 4 domains → lifecycle phases → degradation archetypes → prediction
 * 
 * UNIVERSAL GRID MAPPING:
 *   8×8 grid where:
 *   - Row 0-1: Electrical domain (voltage_mean, voltage_std, voltage_end, voltage_min, current_mean, current_max)
 *   - Row 2-3: Thermal domain (temp_max, temp_rise, temp_start, temp_end, ambient_temperature)
 *   - Row 4-5: Kinetic domain (duration_s) + Deltas (delta_voltage, delta_temp, delta_duration)
 *   - Row 6-7: Cross-domain interactions (temp_per_current, voltage_temp_ratio, deviation)
 *   
 *   Each sensor channel = unique color code (like chess piece types)
 *   Readings STACK on cells over cycles (like pieces visiting squares)
 *   Accumulated grid = temporal QR code fingerprint
 * 
 * LIFECYCLE PHASES (like opening/middlegame/endgame):
 *   Early life | Mid life | Late life
 * 
 * ARCHETYPES (like chess strategic archetypes):
 *   calendar_aging | cycle_aging | thermal_abuse | sudden_knee | stable_plateau | normal_wear
 */

import {
  createGrid,
  recordVisit,
  extractUniversalSignature,
} from './universal-grid.mjs';

// ═══════════════════════════════════════════════════════════
// SENSOR CHANNELS: Each gets a unique color (like chess piece types)
// ═══════════════════════════════════════════════════════════

const BATTERY_CHANNELS = {
  // Electrical domain — Row 0-1
  voltage_mean:  { color: 'V', row: 0, col: 0 },
  voltage_std:   { color: 'S', row: 0, col: 1 },
  voltage_end:   { color: 'E', row: 0, col: 2 },
  voltage_min:   { color: 'M', row: 0, col: 3 },
  current_mean:  { color: 'I', row: 1, col: 0 },
  current_max:   { color: 'X', row: 1, col: 1 },
  current_min:   { color: 'N', row: 1, col: 2 },
  // Thermal domain — Row 2-3
  temp_max:      { color: 'T', row: 2, col: 0 },
  temp_rise:     { color: 'R', row: 2, col: 1 },
  temp_start:    { color: 'A', row: 2, col: 2 },
  temp_end:      { color: 'B', row: 2, col: 3 },
  ambient_temperature: { color: 'W', row: 3, col: 0 },
  // Kinetic domain — Row 4
  duration_s:    { color: 'D', row: 4, col: 0 },
  // Deltas (rate of change) — Row 5
  delta_voltage_mean: { color: 'v', row: 5, col: 0 },
  delta_voltage_end:  { color: 'e', row: 5, col: 1 },
  delta_temp_max:     { color: 't', row: 5, col: 2 },
  delta_temp_rise:    { color: 'r', row: 5, col: 3 },
  delta_duration:     { color: 'd', row: 5, col: 4 },
  delta_current_mean: { color: 'i', row: 5, col: 5 },
  // Cross-domain interactions — Row 6-7
  temp_per_current:         { color: 'H', row: 6, col: 0 }, // Heating efficiency
  voltage_temp_ratio:       { color: 'C', row: 6, col: 1 }, // V-T coupling
  duration_current_product: { color: 'P', row: 6, col: 2 }, // Throughput
  voltage_deviation:        { color: 'F', row: 7, col: 0 }, // Deviation from MA
  temp_deviation:           { color: 'G', row: 7, col: 1 }, // Deviation from MA
};

const GRID_ROWS = 8;
const GRID_COLS = 8;

/**
 * Compute ranges for normalization from a set of cycles.
 */
export function computeRanges(cycles) {
  const ranges = {};
  const keys = Object.keys(BATTERY_CHANNELS);
  for (const k of keys) ranges[k] = { min: Infinity, max: -Infinity };
  for (const c of cycles) {
    for (const k of keys) {
      if (c[k] != null && isFinite(c[k])) {
        ranges[k].min = Math.min(ranges[k].min, c[k]);
        ranges[k].max = Math.max(ranges[k].max, c[k]);
      }
    }
  }
  return ranges;
}

/**
 * Populate the universal grid from a battery's cycle history.
 * 
 * Each cycle "visits" grid cells for each of its sensor readings.
 * The value is normalized to -1..+1 where:
 *   -1 = minimum (degraded direction)
 *   +1 = maximum (healthy direction)
 * 
 * Visits STACK over cycles — a battery that's been running for 200 cycles
 * will have 200 visits per channel cell, building up the temporal QR code.
 */
export function populateBatteryGrid(batteryCycles, ranges, deviationThreshold = 0) {
  const grid = createGrid(GRID_ROWS, GRID_COLS);
  
  for (let step = 0; step < batteryCycles.length; step++) {
    const cycle = batteryCycles[step];
    
    for (const [key, ch] of Object.entries(BATTERY_CHANNELS)) {
      const rawVal = cycle[key];
      if (rawVal == null || !isFinite(rawVal)) continue;
      
      const r = ranges[key];
      if (!r || r.max === r.min) continue;
      
      // Normalize to -1..+1
      const normalized = ((rawVal - r.min) / (r.max - r.min)) * 2 - 1;
      
      // Only record visits above deviation threshold
      // 0 = record everything, 0.5 = only extreme values
      // Self-learning discovers optimal threshold from volume
      if (Math.abs(normalized) > deviationThreshold) {
        recordVisit(grid, ch.row, ch.col, ch.color, key, step, normalized);
      }
    }
  }
  
  return grid;
}

/**
 * Full battery pipeline through universal grid portal.
 * Raw cycles → grid → universal signature → battery archetype → prediction.
 */
export function processBatteryThroughGrid(batteryCycles, ranges, deviationThreshold = 0) {
  const grid = populateBatteryGrid(batteryCycles, ranges, deviationThreshold);
  const signature = extractUniversalSignature(grid, batteryCycles.length, 'bat');
  return { grid, signature };
}

// ═══════════════════════════════════════════════════════════
// DOMAIN PROFILE: The battery equivalent of chess quadrants
// ═══════════════════════════════════════════════════════════

/**
 * Calculate domain profile from battery cycle data.
 * Each domain tracks the "balance" (deviation from normal behavior).
 * Positive = healthy direction, Negative = degradation direction.
 */
export function calculateDomainProfile(cycle, ranges) {
  const norm = (val, key) => {
    if (val == null || !ranges[key] || ranges[key].max === ranges[key].min) return 0;
    return ((val - ranges[key].min) / (ranges[key].max - ranges[key].min)) * 200 - 100; // -100 to +100
  };
  
  return {
    electrical: (norm(cycle.voltage_mean, 'voltage_mean') + norm(cycle.voltage_end, 'voltage_end')) / 2,
    thermal: -(norm(cycle.temp_max, 'temp_max') + norm(cycle.temp_rise, 'temp_rise')) / 2, // Negative = hotter = worse
    kinetic: norm(cycle.duration_s, 'duration_s'),
    degradation: norm(cycle.voltage_end, 'voltage_end'), // Low voltage_end = degraded
    center: norm(cycle.voltage_mean, 'voltage_mean') - norm(cycle.temp_max, 'temp_max'), // V-T coupling
  };
}

// ═══════════════════════════════════════════════════════════
// TEMPORAL PHASES: Battery lifecycle equivalent of game phases
// ═══════════════════════════════════════════════════════════

/**
 * Calculate lifecycle phase balance for a cycle within its battery's history.
 * Tracks how each domain changes through early/mid/late life.
 */
export function calculateLifecycleFlow(cycle, batteryCycles) {
  const total = batteryCycles.length;
  if (total < 3) return { early: 0, mid: 0, late: 0, volatility: 0 };
  
  const earlyEnd = Math.floor(total * 0.3);
  const midEnd = Math.floor(total * 0.7);
  
  // Compute average voltage_mean per phase
  const phaseAvg = (start, end) => {
    const slice = batteryCycles.slice(start, end);
    if (slice.length === 0) return 0;
    return slice.reduce((s, c) => s + (c.voltage_mean || 0), 0) / slice.length;
  };
  
  const earlyAvg = phaseAvg(0, earlyEnd);
  const midAvg = phaseAvg(earlyEnd, midEnd);
  const lateAvg = phaseAvg(midEnd, total);
  
  // Normalize phase balances relative to early phase
  const baseline = earlyAvg || 1;
  const earlyBalance = 0; // Reference point
  const midBalance = ((midAvg - baseline) / Math.abs(baseline)) * 100;
  const lateBalance = ((lateAvg - baseline) / Math.abs(baseline)) * 100;
  
  // Volatility: cycle-to-cycle variance in voltage_mean
  let volatility = 0;
  for (let i = 1; i < batteryCycles.length; i++) {
    const prev = batteryCycles[i-1].voltage_mean || 0;
    const curr = batteryCycles[i].voltage_mean || 0;
    volatility += Math.abs(curr - prev);
  }
  volatility = (volatility / total) * 1000; // Scale to 0-100 range
  
  return {
    early: earlyBalance,
    mid: midBalance,
    late: lateBalance,
    volatility: Math.min(100, volatility),
  };
}

// ═══════════════════════════════════════════════════════════
// CRITICAL MOMENTS: Battery equivalent of chess balance shifts
// ═══════════════════════════════════════════════════════════

/**
 * Detect critical moments in the battery's lifecycle.
 * These are sudden changes in behavior — like chess tactical breaks.
 */
export function findCriticalMoments(batteryCycles) {
  const moments = [];
  if (batteryCycles.length < 5) return moments;
  
  for (let i = 3; i < batteryCycles.length; i++) {
    const prev3 = batteryCycles.slice(i-3, i);
    const curr = batteryCycles[i];
    
    // Rolling average of previous 3 cycles
    const avgV = prev3.reduce((s, c) => s + (c.voltage_mean || 0), 0) / 3;
    const avgT = prev3.reduce((s, c) => s + (c.temp_max || 0), 0) / 3;
    const avgD = prev3.reduce((s, c) => s + (c.duration_s || 0), 0) / 3;
    
    // Voltage drop (capacity fade indicator)
    const vDrop = avgV - (curr.voltage_mean || avgV);
    if (Math.abs(vDrop) > 0.005) { // Significant voltage shift
      moments.push({
        cycleNumber: curr.cycle_number,
        type: vDrop > 0 ? 'voltage_drop' : 'voltage_recovery',
        magnitude: Math.abs(vDrop) * 1000,
        description: vDrop > 0 ? 'Capacity fade acceleration' : 'Unexpected capacity recovery',
      });
    }
    
    // Temperature spike
    const tSpike = (curr.temp_max || avgT) - avgT;
    if (tSpike > 2) { // 2°C above rolling average
      moments.push({
        cycleNumber: curr.cycle_number,
        type: 'thermal_spike',
        magnitude: tSpike,
        description: `Temperature anomaly: +${tSpike.toFixed(1)}°C above trend`,
      });
    }
    
    // Duration change (resistance growth indicator)
    const dChange = Math.abs((curr.duration_s || avgD) - avgD) / (avgD || 1);
    if (dChange > 0.1) { // 10% duration change
      moments.push({
        cycleNumber: curr.cycle_number,
        type: 'duration_shift',
        magnitude: dChange * 100,
        description: `Discharge duration shifted ${(dChange * 100).toFixed(0)}%`,
      });
    }
  }
  
  // Keep top 5 most significant
  moments.sort((a, b) => b.magnitude - a.magnitude);
  return moments.slice(0, 5);
}

// ═══════════════════════════════════════════════════════════
// ARCHETYPE CLASSIFICATION: Like chess strategic archetypes
// ═══════════════════════════════════════════════════════════

/**
 * Archetype definitions with known characteristics.
 * Each has a signature pattern in the domain profile + lifecycle flow.
 */
const BATTERY_ARCHETYPES = {
  calendar_aging: {
    name: 'Calendar Aging',
    description: 'Gradual degradation from time, not cycling',
    // Slow steady decline, low volatility, low thermal stress
  },
  cycle_aging: {
    name: 'Cycle Aging',
    description: 'Degradation from repeated charge/discharge',
    // Correlated with cycle count, moderate volatility
  },
  thermal_abuse: {
    name: 'Thermal Abuse',
    description: 'Accelerated degradation from high temperature',
    // High thermal domain activity, fast degradation
  },
  sudden_knee: {
    name: 'Sudden Knee',
    description: 'Rapid capacity drop after gradual decline (the knee)',
    // Stable then sudden voltage drop critical moment
  },
  stable_plateau: {
    name: 'Stable Plateau',
    description: 'Healthy battery with minimal degradation',
    // High electrical, low thermal, no critical moments
  },
  normal_wear: {
    name: 'Normal Wear',
    description: 'Expected aging pattern with moderate degradation',
    // Balanced profile, moderate volatility
  },
};

/**
 * Classify battery cycle into archetype based on multi-domain signals.
 * Uses relative thresholds (percentile-based) instead of absolute values
 * so it works even with small datasets (4 batteries).
 * 
 * The archetype classification improves with VOLUME — more batteries = 
 * better differentiation. With few batteries, it still attempts to
 * find the most informative archetype from available signals.
 */
export function classifyBatteryArchetype(profile, lifecycle, moments, cyclePosition) {
  const thermalStress = Math.abs(profile.thermal);
  const electricalHealth = profile.electrical;
  const hasThermalSpikes = moments.filter(m => m.type === 'thermal_spike').length;
  const hasVoltageDrop = moments.filter(m => m.type === 'voltage_drop').length;
  const hasDurationShift = moments.filter(m => m.type === 'duration_shift').length;
  
  // 1. Thermal abuse: any thermal spikes + degradation direction
  if (hasThermalSpikes >= 1 && thermalStress > 30) {
    return 'thermal_abuse';
  }
  
  // 2. Sudden knee: voltage drops detected in lifecycle
  if (hasVoltageDrop >= 1 && cyclePosition > 0.5) {
    return 'sudden_knee';
  }
  
  // 3. Stable plateau: early lifecycle, healthy electrical, few moments
  if (cyclePosition < 0.3 && moments.length <= 1 && electricalHealth > 0) {
    return 'stable_plateau';
  }
  
  // 4. Calendar aging: late lifecycle, low volatility, degradation trend
  if (cyclePosition > 0.6 && lifecycle.volatility < 30 && lifecycle.late < lifecycle.mid) {
    return 'calendar_aging';
  }
  
  // 5. Cycle aging: mid-to-late lifecycle with progressive decline + any moments
  if (cyclePosition > 0.3 && moments.length >= 1) {
    return 'cycle_aging';
  }
  
  // 6. Use lifecycle position as tiebreaker
  if (cyclePosition > 0.7) return 'cycle_aging';
  if (cyclePosition > 0.4) return 'normal_wear';
  return 'stable_plateau';
}

// ═══════════════════════════════════════════════════════════
// DOMINANT SIDE: Which direction is the battery trending?
// ═══════════════════════════════════════════════════════════

/**
 * Determine degradation trajectory direction.
 * Like chess determineDominantSide but for battery health.
 */
export function determineDegradationDirection(profile, lifecycle) {
  const totalActivity = Math.abs(profile.electrical) + Math.abs(profile.thermal) + 
                         Math.abs(profile.kinetic) + Math.abs(profile.degradation);
  
  if (totalActivity < 30) return 'contested'; // Not enough signal
  
  const healthScore = profile.electrical + profile.degradation - Math.abs(profile.thermal) * 0.5;
  const trendScore = lifecycle.late - lifecycle.early;
  
  const combined = healthScore * 0.6 + trendScore * 0.4;
  
  const GAP = 15;
  if (combined > GAP) return 'stable';
  if (combined < -GAP) return 'degrading';
  return 'contested';
}

// ═══════════════════════════════════════════════════════════
// FULL SIGNATURE: The complete battery "color flow signature"
// ═══════════════════════════════════════════════════════════

/**
 * Extract complete battery signature from a cycle + its history.
 * This is the battery equivalent of extractColorFlowSignature.
 */
export function extractBatterySignature(cycle, batteryCycles, ranges) {
  const profile = calculateDomainProfile(cycle, ranges);
  const lifecycle = calculateLifecycleFlow(cycle, batteryCycles);
  const moments = findCriticalMoments(batteryCycles);
  const cyclePosition = cycle.cycle_number / (batteryCycles.length || 1);
  
  const archetype = classifyBatteryArchetype(profile, lifecycle, moments, cyclePosition);
  const direction = determineDegradationDirection(profile, lifecycle);
  
  return {
    profile,
    lifecycle,
    moments,
    archetype,
    direction,
    cyclePosition,
    intensity: Math.abs(profile.electrical) + Math.abs(profile.thermal),
  };
}

// ═══════════════════════════════════════════════════════════
// PREDICTION: Multi-signal fusion like chess prediction engine
// ═══════════════════════════════════════════════════════════

/**
 * Archetype-specific prediction accuracy (like ARCHETYPE_HISTORICAL_ACCURACY in chess).
 * These start as priors and get updated with real data.
 */
const ARCHETYPE_PREDICTION_WEIGHTS = {
  thermal_abuse:   { stable: 0.05, accelerating: 0.25, critical: 0.70 },
  sudden_knee:     { stable: 0.10, accelerating: 0.30, critical: 0.60 },
  cycle_aging:     { stable: 0.20, accelerating: 0.55, critical: 0.25 },
  calendar_aging:  { stable: 0.35, accelerating: 0.45, critical: 0.20 },
  normal_wear:     { stable: 0.40, accelerating: 0.40, critical: 0.20 },
  stable_plateau:  { stable: 0.75, accelerating: 0.20, critical: 0.05 },
};

/**
 * Predict degradation trajectory from battery signature.
 * Uses multi-signal fusion like chess prediction engine:
 *   archetype prior + domain profile + lifecycle trend + direction signal
 */
export function predictFromBatterySignature(signature, classes = ['stable', 'accelerating', 'critical']) {
  const { archetype, direction, profile, lifecycle, moments, cyclePosition } = signature;
  
  // Signal 1: Archetype prior (like chess archetype historical accuracy)
  const prior = ARCHETYPE_PREDICTION_WEIGHTS[archetype] || ARCHETYPE_PREDICTION_WEIGHTS.normal_wear;
  
  // Signal 2: Direction signal (like chess dominant side)
  const directionBoost = {
    stable: direction === 'stable' ? 0.15 : direction === 'degrading' ? -0.10 : 0,
    accelerating: direction === 'contested' ? 0.10 : 0,
    critical: direction === 'degrading' ? 0.15 : direction === 'stable' ? -0.10 : 0,
  };
  
  // Signal 3: Lifecycle position (later = more likely degraded)
  const positionBoost = {
    stable: cyclePosition < 0.3 ? 0.10 : cyclePosition > 0.7 ? -0.10 : 0,
    accelerating: (cyclePosition > 0.3 && cyclePosition < 0.8) ? 0.05 : 0,
    critical: cyclePosition > 0.7 ? 0.10 : -0.05,
  };
  
  // Signal 4: Critical moments count (more moments = more likely critical)
  const momentBoost = {
    stable: moments.length === 0 ? 0.10 : moments.length > 2 ? -0.10 : 0,
    accelerating: moments.length === 1 ? 0.05 : 0,
    critical: moments.length >= 3 ? 0.10 : 0,
  };
  
  // Signal 5: Thermal stress (like chess Stockfish eval — supplementary signal)
  const thermalSignal = {
    stable: profile.thermal > 0 ? 0.05 : profile.thermal < -50 ? -0.10 : 0,
    accelerating: Math.abs(profile.thermal) > 30 ? 0.05 : 0,
    critical: profile.thermal < -50 ? 0.10 : 0,
  };
  
  // Fuse all signals
  const scores = {};
  for (const cls of classes) {
    scores[cls] = prior[cls] + directionBoost[cls] + positionBoost[cls] + momentBoost[cls] + thermalSignal[cls];
  }
  
  // Normalize to probabilities
  const total = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1;
  for (const cls of classes) {
    scores[cls] = Math.max(0, scores[cls]) / total;
  }
  
  // Pick highest
  let bestClass = classes[0];
  let bestScore = -1;
  for (const cls of classes) {
    if (scores[cls] > bestScore) {
      bestScore = scores[cls];
      bestClass = cls;
    }
  }
  
  // Confidence from score separation
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const confidence = sorted.length > 1 ? sorted[0] - sorted[1] : 0.5;
  
  return {
    prediction: bestClass,
    confidence: Math.max(0.1, Math.min(0.9, 0.3 + confidence)),
    scores,
    archetype,
    direction,
  };
}

/**
 * Self-learned prediction using grid signature features.
 * Compares test signature to class centroids learned from training data.
 * This improves with VOLUME — more training samples = better centroids.
 * 
 * @param {object} gridSig - Universal grid signature (from extractUniversalSignature)
 * @param {object} battSig - Battery-specific signature (from extractBatterySignature)
 * @param {object} classCentroids - { className: { intensity, visits, imbalance } } learned from training
 * @param {string[]} classes - Class labels
 */
export function predictFromGridSignature(gridSig, battSig, classCentroids, classes = ['stable', 'accelerating', 'critical']) {
  // Extract features from grid signature
  const qp = gridSig.quadrantProfile;
  const imbalance = Math.abs(qp.q1) + Math.abs(qp.q2) + Math.abs(qp.q3) + Math.abs(qp.q4) +
                    Math.abs(qp.q5) + Math.abs(qp.q6) + Math.abs(qp.q7) + Math.abs(qp.q8);
  
  const testFeatures = {
    intensity: gridSig.intensity,
    visits: gridSig.totalVisits,
    imbalance,
    cyclePosition: battSig.cyclePosition,
  };
  
  // Compute distance to each class centroid
  const distances = {};
  for (const cls of classes) {
    const centroid = classCentroids[cls];
    if (!centroid) { distances[cls] = Infinity; continue; }
    
    // Weighted Euclidean distance
    const dIntensity = (testFeatures.intensity - centroid.intensity) / (centroid.intensityStd || 1);
    const dVisits = (testFeatures.visits - centroid.visits) / (centroid.visitsStd || 1);
    const dImbalance = (testFeatures.imbalance - centroid.imbalance) / (centroid.imbalanceStd || 1);
    const dPosition = (testFeatures.cyclePosition - centroid.cyclePosition) / (centroid.positionStd || 0.3);
    
    distances[cls] = Math.sqrt(dIntensity ** 2 + dVisits ** 2 + dImbalance ** 2 + dPosition ** 2);
  }
  
  // Convert distances to scores (inverse distance weighting)
  const scores = {};
  let totalWeight = 0;
  for (const cls of classes) {
    const weight = 1 / (distances[cls] + 0.01);
    scores[cls] = weight;
    totalWeight += weight;
  }
  for (const cls of classes) scores[cls] /= totalWeight;
  
  // Pick class with highest score (smallest distance)
  let bestClass = classes[0];
  let bestScore = -1;
  for (const cls of classes) {
    if (scores[cls] > bestScore) {
      bestScore = scores[cls];
      bestClass = cls;
    }
  }
  
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const confidence = sorted.length > 1 ? sorted[0] - sorted[1] : 0.5;
  
  return {
    prediction: bestClass,
    confidence: Math.max(0.1, Math.min(0.9, 0.3 + confidence)),
    scores,
    archetype: battSig.archetype,
    direction: battSig.direction,
    distances,
  };
}

/**
 * Build class centroids from training data grid signatures.
 * This is the LEARNING step — compute mean features per class.
 */
export function learnClassCentroids(trainingSamples) {
  const centroids = {};
  
  for (const [cls, samples] of Object.entries(trainingSamples)) {
    if (samples.length === 0) continue;
    
    const intensities = samples.map(s => s.gridSig.intensity);
    const visits = samples.map(s => s.gridSig.totalVisits);
    const imbalances = samples.map(s => {
      const qp = s.gridSig.quadrantProfile;
      return Math.abs(qp.q1) + Math.abs(qp.q2) + Math.abs(qp.q3) + Math.abs(qp.q4) +
             Math.abs(qp.q5) + Math.abs(qp.q6) + Math.abs(qp.q7) + Math.abs(qp.q8);
    });
    const positions = samples.map(s => s.cyclePosition);
    
    const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const std = (arr, m) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1;
    
    const mI = mean(intensities), mV = mean(visits), mIm = mean(imbalances), mP = mean(positions);
    
    centroids[cls] = {
      intensity: mI, intensityStd: std(intensities, mI),
      visits: mV, visitsStd: std(visits, mV),
      imbalance: mIm, imbalanceStd: std(imbalances, mIm),
      cyclePosition: mP, positionStd: std(positions, mP),
      sampleCount: samples.length,
    };
  }
  
  return centroids;
}

export { BATTERY_ARCHETYPES, ARCHETYPE_PREDICTION_WEIGHTS };
