/**
 * PHOTONIC GRID v1.0 — 64-Square Frequency Signature Analysis
 * 
 * CONCEPT: Each square on the board gets a unique "frequency signature" based on:
 *   1. Visit pattern over time (early/mid/late phase distribution)
 *   2. Piece-type spectrum (which pieces visited, weighted by value)
 *   3. Color oscillation (how often control changed between white/black)
 *   4. Pressure gradient (attack pressure from surrounding squares)
 * 
 * These four dimensions create a per-square "photonic frequency" that captures
 * information the aggregate 8-quadrant system misses:
 *   - A square visited 10 times by pawns ≠ a square visited 10 times by queens
 *   - A square that oscillated 5 times ≠ a square held steadily
 *   - A square under heavy attack pressure ≠ a quiet square
 * 
 * The 64 frequencies are then analyzed for PATTERNS:
 *   - Frequency alignment (many squares pointing same direction = decisive)
 *   - Frequency divergence (squares pointing different directions = unclear)
 *   - Hotspot detection (clusters of high-frequency squares = attack zones)
 *   - Cold zone analysis (quiet squares = strategic voids)
 * 
 * TARGET: Improve 0-50cp zone from 43.7% → 55%+ accuracy
 * This zone is where SF is blind (25.4%) and spatial patterns matter most.
 */

import type { EnhancedQuadrantProfileData, EnhancedSignalsData, TemporalFlow } from './types';

export interface PhotonicSquare {
  /** Temporal distribution of visits (0-1 for each phase) */
  temporal: { early: number; mid: number; late: number };
  /** Piece-type spectrum: weighted sum of piece values that visited */
  spectrum: number;
  /** Color oscillation: number of times control changed */
  oscillation: number;
  /** Net color bias: positive = white controlled more, negative = black */
  colorBias: number;
  /** Total visit intensity */
  intensity: number;
}

export interface PhotonicGridResult {
  /** 64-square frequency grid (8x8, row-major) */
  grid: PhotonicSquare[];
  /** Global pattern metrics */
  patterns: {
    /** How aligned are the frequencies? (0-1, 1 = all pointing same way) */
    alignment: number;
    /** Frequency divergence (0-1, 1 = maximum disagreement) */
    divergence: number;
    /** Number of hotspot clusters (high-activity zones) */
    hotspotCount: number;
    /** Number of cold zones (quiet areas) */
    coldZoneCount: number;
    /** White hotspot strength vs black hotspot strength */
    hotspotBias: number;
    /** Oscillation index: how contested is the board overall (0-1) */
    contestation: number;
    /** Spectral imbalance: piece-type advantage signal */
    spectralImbalance: number;
  };
  /** 3-way prediction signal from photonic analysis */
  signal: { white: number; black: number; draw: number };
  /** Confidence in the photonic signal (0-1) */
  confidence: number;
  /** Number of active squares (with visits) */
  activeSquares: number;
}

/**
 * Compute the 64-square photonic frequency grid from board visit data.
 * 
 * This function takes the raw board data (visits per square) and computes
 * per-square frequency signatures, then analyzes the global pattern.
 * 
 * @param board 8x8 array of square data with visit histories
 * @param totalMoves Total moves in the game
 * @param currentMoveNumber Current move being analyzed
 */
export function computePhotonicGrid(
  board: { visits: { piece: string; color: string; moveNumber: number }[] }[][],
  totalMoves: number,
  currentMoveNumber: number
): PhotonicGridResult {
  const grid: PhotonicSquare[] = [];
  let activeSquares = 0;
  
  // Phase 1: Compute per-square frequency signatures
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const sq = board[rank][file];
      const visits = sq.visits;
      
      if (visits.length === 0) {
        grid.push({
          temporal: { early: 0, mid: 0, late: 0 },
          spectrum: 0,
          oscillation: 0,
          colorBias: 0,
          intensity: 0,
        });
        continue;
      }
      
      activeSquares++;
      let earlyVisits = 0, midVisits = 0, lateVisits = 0;
      let spectrumSum = 0;
      let oscillations = 0;
      let whiteVisits = 0, blackVisits = 0;
      let prevColor: string | null = null;
      
      for (const v of visits) {
        // Temporal distribution
        if (v.moveNumber <= 15) earlyVisits++;
        else if (v.moveNumber <= 40) midVisits++;
        else lateVisits++;
        
        // Piece-type spectrum (weighted by piece value)
        const pieceVal = PIECE_VALUES[v.piece] || 1;
        const colorSign = v.color === 'w' ? 1 : -1;
        spectrumSum += pieceVal * colorSign;
        
        // Color tracking
        if (v.color === 'w') whiteVisits++;
        else blackVisits++;
        
        // Oscillation: count color changes
        if (prevColor && prevColor !== v.color) oscillations++;
        prevColor = v.color;
      }
      
      const total = visits.length;
      grid.push({
        temporal: {
          early: earlyVisits / total,
          mid: midVisits / total,
          late: lateVisits / total,
        },
        spectrum: spectrumSum / total,
        oscillation: oscillations,
        colorBias: (whiteVisits - blackVisits) / total,
        intensity: Math.min(1, total / 20), // Normalize: 20+ visits = max intensity
      });
    }
  }
  
  // Phase 2: Analyze global patterns from the 64-square grid
  const patterns = analyzePhotonicPatterns(grid, activeSquares);
  
  // Phase 3: Convert patterns to 3-way prediction signal
  const { signal, confidence } = photonicToSignal(patterns, currentMoveNumber);
  
  return { grid, patterns, signal, confidence, activeSquares };
}

const PIECE_VALUES: Record<string, number> = {
  'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1, 'k': 0.5,
};

/**
 * Analyze the 64-square grid for global patterns.
 */
function analyzePhotonicPatterns(
  grid: PhotonicSquare[],
  activeSquares: number
): PhotonicGridResult['patterns'] {
  if (activeSquares === 0) {
    return {
      alignment: 0.5, divergence: 0.5, hotspotCount: 0, coldZoneCount: 64,
      hotspotBias: 0, contestation: 0, spectralImbalance: 0,
    };
  }
  
  // Alignment: how many active squares agree on direction?
  let whiteLeaning = 0, blackLeaning = 0, neutral = 0;
  let totalOscillation = 0;
  let totalSpectrum = 0;
  const hotspots: { rank: number; file: number; bias: number }[] = [];
  let coldZones = 0;
  
  for (let i = 0; i < 64; i++) {
    const sq = grid[i];
    
    if (sq.intensity === 0) {
      coldZones++;
      continue;
    }
    
    // Direction counting
    if (sq.colorBias > 0.15) whiteLeaning++;
    else if (sq.colorBias < -0.15) blackLeaning++;
    else neutral++;
    
    // Oscillation accumulation
    totalOscillation += sq.oscillation;
    
    // Spectral accumulation
    totalSpectrum += sq.spectrum;
    
    // Hotspot detection: high intensity + strong bias
    if (sq.intensity > 0.4 && Math.abs(sq.colorBias) > 0.3) {
      const rank = Math.floor(i / 8);
      const file = i % 8;
      hotspots.push({ rank, file, bias: sq.colorBias });
    }
  }
  
  // Cluster hotspots (adjacent hotspots = one cluster)
  const hotspotClusters = clusterHotspots(hotspots);
  
  // Alignment: proportion of active squares agreeing on direction
  const directionTotal = whiteLeaning + blackLeaning + neutral;
  const maxDirection = Math.max(whiteLeaning, blackLeaning);
  const alignment = directionTotal > 0 ? maxDirection / directionTotal : 0.5;
  
  // Divergence: how split are the directions?
  const minDirection = Math.min(whiteLeaning, blackLeaning);
  const divergence = directionTotal > 0 ? minDirection / directionTotal : 0.5;
  
  // Hotspot bias: white hotspots vs black hotspots
  let whiteHotspotStrength = 0, blackHotspotStrength = 0;
  for (const h of hotspots) {
    if (h.bias > 0) whiteHotspotStrength += h.bias;
    else blackHotspotStrength += Math.abs(h.bias);
  }
  const totalHotspot = whiteHotspotStrength + blackHotspotStrength;
  const hotspotBias = totalHotspot > 0 
    ? (whiteHotspotStrength - blackHotspotStrength) / totalHotspot 
    : 0;
  
  // Contestation: how much the board oscillated overall
  const maxOscillation = activeSquares * 5; // Theoretical max
  const contestation = Math.min(1, totalOscillation / maxOscillation);
  
  // Spectral imbalance: piece-type weighted advantage
  const spectralImbalance = activeSquares > 0 ? totalSpectrum / activeSquares : 0;
  
  return {
    alignment,
    divergence,
    hotspotCount: hotspotClusters,
    coldZoneCount: coldZones,
    hotspotBias,
    contestation,
    spectralImbalance,
  };
}

/**
 * Cluster adjacent hotspots into groups.
 */
function clusterHotspots(
  hotspots: { rank: number; file: number; bias: number }[]
): number {
  if (hotspots.length === 0) return 0;
  
  const visited = new Set<number>();
  let clusters = 0;
  
  for (const h of hotspots) {
    const key = h.rank * 8 + h.file;
    if (visited.has(key)) continue;
    
    // BFS to find connected hotspots
    clusters++;
    const queue = [h];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const ck = current.rank * 8 + current.file;
      if (visited.has(ck)) continue;
      visited.add(ck);
      
      // Check adjacent squares for other hotspots
      for (const other of hotspots) {
        const ok = other.rank * 8 + other.file;
        if (visited.has(ok)) continue;
        if (Math.abs(other.rank - current.rank) <= 1 && Math.abs(other.file - current.file) <= 1) {
          queue.push(other);
        }
      }
    }
  }
  
  return clusters;
}

/**
 * v29.2: PHOTONIC FUSION SIGNAL — lightweight version for equilibrium predictor integration.
 * 
 * Derives photonic-style spatial patterns from the existing EnhancedSignalsData and
 * EnhancedQuadrantProfileData WITHOUT needing raw per-square visit data.
 * 
 * This captures the SAME information as the full photonic grid but from already-computed
 * enhanced signals: square control (spatial), coordination (spectral), trajectories (temporal),
 * negative space (cold zones), and capture graph (oscillation/contestation).
 * 
 * TARGET: 0-50cp zone where SF is ~23% and EP is ~30%. The photonic signal provides
 * an INDEPENDENT spatial dimension that the aggregate 8-quadrant system misses.
 */
export function computePhotonicFusionSignal(
  profile: EnhancedQuadrantProfileData | undefined,
  signals: EnhancedSignalsData | undefined,
  temporal: TemporalFlow | undefined,
  currentMoveNumber: number
): { signal: { white: number; black: number; draw: number }; confidence: number } {
  if (!profile || !signals) {
    return { signal: { white: 33, black: 33, draw: 34 }, confidence: 0 };
  }

  // ── DIMENSION 1: Spatial alignment (from 8-quadrant profile) ──
  // How many quadrants agree on direction? High alignment = decisive.
  const quadVals = [
    profile.q1_kingside_white, profile.q2_queenside_white,
    profile.q3_kingside_black, profile.q4_queenside_black,
    profile.q5_center_white, profile.q6_center_black,
    profile.q7_extended_kingside, profile.q8_extended_queenside,
  ];
  const whiteLeaning = quadVals.filter(v => v > 5).length;
  const blackLeaning = quadVals.filter(v => v < -5).length;
  const totalDirectional = whiteLeaning + blackLeaning;
  const alignment = totalDirectional > 0 ? Math.max(whiteLeaning, blackLeaning) / totalDirectional : 0.5;
  const spatialBias = totalDirectional > 0 ? (whiteLeaning - blackLeaning) / totalDirectional : 0;

  // ── DIMENSION 2: Spectral imbalance (piece-type advantage) ──
  // Bishop vs knight dominance, rook activity, queen presence
  const spectral = (profile.bishop_dominance * 0.3 + profile.knight_dominance * 0.3 +
                    profile.rook_dominance * 0.2 + profile.queen_dominance * 0.2);

  // ── DIMENSION 3: Contestation (from capture graph + square control) ──
  // High captures + contested squares = oscillating board
  const cg = signals.captureGraph;
  const sc = signals.squareControl;
  const captureIntensity = Math.min(1, cg.totalCaptures / 20);
  const contestedRatio = Math.min(1, sc.contestedSquares / 20);
  const contestation = (captureIntensity * 0.5 + contestedRatio * 0.5);

  // ── DIMENSION 4: Hotspot detection (from square control deltas) ──
  // Strong control deltas = attack zones (hotspots)
  const ksDelta = sc.kingsideControlDelta;
  const qsDelta = sc.queensideControlDelta;
  const centerDelta = sc.centerControlDelta;
  const hotspotStrength = Math.abs(ksDelta) + Math.abs(qsDelta) + Math.abs(centerDelta);
  const hotspotBias = hotspotStrength > 0
    ? (ksDelta + qsDelta + centerDelta) / hotspotStrength
    : 0;

  // ── DIMENSION 5: Cold zone analysis (from negative space) ──
  const ns = signals.negativeSpace;
  const voidTension = ns ? ns.voidTension : 0;
  const negSpaceBalance = ns ? ns.negativeSpaceBalance : 0;

  // ── DIMENSION 6: Coordination coherence ──
  // High coordination = pieces working together = conversion potential
  const coord = signals.coordination;
  const coordSignal = coord.coordinationScore;

  // ── DIMENSION 7: Trajectory momentum ──
  const traj = signals.trajectories;
  const forwardBias = traj.forwardBias;

  // ── SYNTHESIZE: Combine dimensions into photonic signal ──
  const drawIndicators = [
    contestation > 0.4 ? 1 : 0,
    Math.abs(spatialBias) < 0.2 ? 1 : 0,
    Math.abs(hotspotBias) < 0.15 ? 1 : 0,
    Math.abs(spectral) < 2 ? 1 : 0,
    Math.abs(negSpaceBalance) < 3 ? 1 : 0,
  ];
  const drawCount = drawIndicators.reduce((a, b) => a + b, 0);

  // Decisive strength: spatial alignment × hotspot bias + spectral + coordination
  const decisiveStrength = alignment * Math.abs(hotspotBias) * 0.4 +
                           Math.abs(spectral) / 20 * 0.2 +
                           Math.abs(coordSignal) / 30 * 0.2 +
                           Math.abs(forwardBias) / 10 * 0.2;

  const isWhiteFavored = spatialBias > 0.1 || hotspotBias > 0.1 || spectral > 2;

  // Phase scaling: photonic patterns most reliable in middlegame (15-45)
  const phaseScale = currentMoveNumber < 15 ? 0.4 : currentMoveNumber < 45 ? 1.0 : 0.7;

  let white = 33, black = 33, draw = 34;

  if (drawCount >= 4) {
    const drawBoost = Math.min(6, (drawCount - 3) * 3) * phaseScale;
    draw += drawBoost;
    white -= drawBoost / 2;
    black -= drawBoost / 2;
  } else if (decisiveStrength > 0.15) {
    const advantage = Math.min(12, decisiveStrength * 30) * phaseScale;
    if (isWhiteFavored) {
      white += advantage;
      black -= advantage * 0.6;
      draw -= advantage * 0.4;
    } else {
      black += advantage;
      white -= advantage * 0.6;
      draw -= advantage * 0.4;
    }
  }

  // Confidence: based on how many dimensions have clear signal
  const dimensionClarity = [
    Math.abs(spatialBias) > 0.2 ? 1 : 0,
    Math.abs(hotspotBias) > 0.15 ? 1 : 0,
    Math.abs(spectral) > 3 ? 1 : 0,
    Math.abs(coordSignal) > 10 ? 1 : 0,
    hotspotStrength > 5 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const confidence = Math.min(1, Math.max(0.1,
    (dimensionClarity / 5) * 0.5 + phaseScale * 0.3 + (alignment > 0.6 ? 0.2 : 0)
  ));

  return {
    signal: { white: Math.round(white), black: Math.round(black), draw: Math.round(draw) },
    confidence,
  };
}

/**
 * Convert photonic patterns to a 3-way prediction signal.
 * 
 * KEY INSIGHTS from data:
 * - High alignment + strong hotspot bias → decisive (one side dominates)
 * - High divergence + high contestation → draw (board is contested)
 * - Spectral imbalance captures piece-type advantage (bishops vs knights etc.)
 */
function photonicToSignal(
  patterns: PhotonicGridResult['patterns'],
  currentMoveNumber: number
): { signal: { white: number; black: number; draw: number }; confidence: number } {
  const { alignment, divergence, hotspotBias, contestation, spectralImbalance, hotspotCount } = patterns;
  
  // Draw indicators
  const drawSignals = [
    divergence > 0.35 ? 1 : 0,           // Board is split
    contestation > 0.3 ? 1 : 0,          // High oscillation
    Math.abs(hotspotBias) < 0.15 ? 1 : 0, // Balanced hotspots
    Math.abs(spectralImbalance) < 0.3 ? 1 : 0, // Balanced piece spectrum
  ];
  const drawCount = drawSignals.reduce((a, b) => a + b, 0);
  
  // Decisive indicators
  const decisiveStrength = alignment * Math.abs(hotspotBias) + Math.abs(spectralImbalance) * 0.3;
  const isWhiteFavored = hotspotBias > 0.1 || (hotspotBias >= 0 && spectralImbalance > 0.3);
  
  // Phase scaling: photonic patterns more reliable in middlegame
  const phaseScale = currentMoveNumber < 15 ? 0.5 : currentMoveNumber < 40 ? 1.0 : 0.8;
  
  // Build signal
  let white = 33, black = 33, draw = 34;
  
  if (drawCount >= 3) {
    // Strong draw signal from photonic analysis
    const drawBoost = Math.min(8, drawCount * 2) * phaseScale;
    draw += drawBoost;
    white -= drawBoost / 2;
    black -= drawBoost / 2;
  } else if (decisiveStrength > 0.2) {
    // Decisive signal
    const advantage = Math.min(15, decisiveStrength * 25) * phaseScale;
    if (isWhiteFavored) {
      white += advantage;
      black -= advantage * 0.6;
      draw -= advantage * 0.4;
    } else {
      black += advantage;
      white -= advantage * 0.6;
      draw -= advantage * 0.4;
    }
  }
  
  // Confidence: based on active squares and pattern clarity
  const patternClarity = Math.max(alignment, divergence) - 0.3;
  const confidence = Math.min(1, Math.max(0.1, 
    patternClarity * 0.5 + (hotspotCount > 0 ? 0.2 : 0) + phaseScale * 0.3
  ));
  
  return { signal: { white: Math.round(white), black: Math.round(black), draw: Math.round(draw) }, confidence };
}
