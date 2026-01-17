/**
 * Sacred Geometry Module
 * Fibonacci spirals, golden ratios, and geometric patterns in price data
 * Mathematics is the language of the universe - we listen through geometry
 */

// Golden Ratio and Fibonacci Constants
export const PHI = 1.6180339887498948482; // Golden ratio
export const PHI_INVERSE = 0.6180339887498948482; // 1/PHI
export const PHI_SQUARED = 2.6180339887498948482; // PHI^2

// Fibonacci Sequence (first 21 numbers)
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946];

// Fibonacci Retracement Levels
export const FIBONACCI_RETRACEMENTS = {
  0: 0,
  0.236: 0.236,  // 1 - 0.764
  0.382: 0.382,  // 1 - PHI_INVERSE
  0.5: 0.5,      // Not Fibonacci but commonly used
  0.618: 0.618,  // PHI_INVERSE
  0.764: 0.764,  // 1 - 0.236
  0.786: 0.786,  // sqrt(PHI_INVERSE)
  1: 1,
  1.272: 1.272,  // sqrt(PHI)
  1.414: 1.414,  // sqrt(2)
  1.618: 1.618,  // PHI
  2.618: 2.618,  // PHI^2
  4.236: 4.236   // PHI^3
};

// Sacred Geometric Patterns
export const SACRED_PATTERNS = {
  vesica_piscis: {
    name: 'Vesica Piscis',
    ratio: Math.sqrt(3),
    meaning: 'Creation, intersection of two realms',
    pricePattern: 'Symmetrical consolidation'
  },
  flower_of_life: {
    name: 'Flower of Life',
    circles: 19,
    meaning: 'Universal pattern of creation',
    pricePattern: 'Multi-level support/resistance grid'
  },
  metatrons_cube: {
    name: 'Metatrons Cube',
    vertices: 13,
    meaning: 'Contains all platonic solids',
    pricePattern: 'Five-wave price structure'
  },
  seed_of_life: {
    name: 'Seed of Life',
    circles: 7,
    meaning: 'Genesis, seven days of creation',
    pricePattern: 'Weekly cycle completion'
  }
};

// Price Pattern Analysis Results
export interface GeometricAnalysis {
  nearestFibLevel: number;
  distanceFromLevel: number;
  levelStrength: 'strong' | 'moderate' | 'weak';
  fibonacciZone: 'expansion' | 'retracement' | 'neutral';
  goldenRatioAlignment: number; // 0-1 how aligned with golden ratio
  spiralPhase: number; // 0-1 position in fibonacci spiral
  patternDetected: string | null;
  harmonicRatios: number[];
  sacredScore: number; // Overall geometric significance 0-1
}

// Detect Fibonacci levels in price action
export function detectFibonacciLevels(
  prices: number[],
  swingHigh: number,
  swingLow: number
): { level: number; price: number; distance: number }[] {
  const range = swingHigh - swingLow;
  const levels: { level: number; price: number; distance: number }[] = [];
  
  for (const [name, level] of Object.entries(FIBONACCI_RETRACEMENTS)) {
    const priceAtLevel = swingLow + (range * level);
    const currentPrice = prices[prices.length - 1];
    const distance = Math.abs(currentPrice - priceAtLevel) / currentPrice;
    
    levels.push({
      level: level,
      price: priceAtLevel,
      distance
    });
  }
  
  return levels.sort((a, b) => a.distance - b.distance);
}

// Calculate Fibonacci spiral position
export function calculateSpiralPosition(
  prices: number[],
  lookback: number = 144 // Fibonacci number
): number {
  if (prices.length < lookback) return 0.5;
  
  const recentPrices = prices.slice(-lookback);
  const high = Math.max(...recentPrices);
  const low = Math.min(...recentPrices);
  const current = recentPrices[recentPrices.length - 1];
  
  // Position in the range as spiral phase
  const position = (current - low) / (high - low || 1);
  
  // Apply golden ratio modulation
  return (position * PHI) % 1;
}

// Detect harmonic ratios in price swings
export function detectHarmonicRatios(swings: number[]): number[] {
  if (swings.length < 2) return [];
  
  const ratios: number[] = [];
  
  for (let i = 1; i < swings.length; i++) {
    const ratio = Math.abs(swings[i]) / Math.abs(swings[i - 1] || 1);
    ratios.push(ratio);
  }
  
  return ratios;
}

// Check if a ratio is close to a Fibonacci ratio
export function isFibonacciRatio(ratio: number, tolerance: number = 0.02): boolean {
  const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618, 2.618];
  
  return fibRatios.some(fibRatio => Math.abs(ratio - fibRatio) <= tolerance);
}

// Calculate golden ratio alignment
export function calculateGoldenRatioAlignment(
  value1: number,
  value2: number
): number {
  const ratio = Math.max(value1, value2) / Math.min(value1, value2);
  const distanceFromPhi = Math.abs(ratio - PHI);
  
  // Convert distance to alignment score (closer = higher score)
  return Math.max(0, 1 - (distanceFromPhi / PHI));
}

// Comprehensive geometric analysis
export function analyzeGeometry(
  prices: number[],
  swingHigh: number,
  swingLow: number,
  recentSwings: number[] = []
): GeometricAnalysis {
  const currentPrice = prices[prices.length - 1];
  const range = swingHigh - swingLow;
  
  // Find nearest Fibonacci level
  const fibLevels = detectFibonacciLevels(prices, swingHigh, swingLow);
  const nearestLevel = fibLevels[0];
  
  // Determine level strength based on significance of the Fibonacci number
  const strongLevels = [0.382, 0.5, 0.618, 1.618];
  const moderateLevels = [0.236, 0.764, 0.786, 1.272];
  let levelStrength: 'strong' | 'moderate' | 'weak';
  
  if (strongLevels.some(l => Math.abs(nearestLevel.level - l) < 0.01)) {
    levelStrength = 'strong';
  } else if (moderateLevels.some(l => Math.abs(nearestLevel.level - l) < 0.01)) {
    levelStrength = 'moderate';
  } else {
    levelStrength = 'weak';
  }
  
  // Determine Fibonacci zone
  const retracement = (currentPrice - swingLow) / range;
  let fibonacciZone: 'expansion' | 'retracement' | 'neutral';
  if (retracement > 1) fibonacciZone = 'expansion';
  else if (retracement < 0) fibonacciZone = 'retracement';
  else fibonacciZone = 'neutral';
  
  // Calculate golden ratio alignment from recent price action
  let goldenRatioAlignment = 0;
  if (prices.length >= 3) {
    const move1 = Math.abs(prices[prices.length - 1] - prices[prices.length - 2]);
    const move2 = Math.abs(prices[prices.length - 2] - prices[prices.length - 3]);
    goldenRatioAlignment = calculateGoldenRatioAlignment(move1, move2);
  }
  
  // Spiral phase
  const spiralPhase = calculateSpiralPosition(prices);
  
  // Harmonic ratios in swings
  const harmonicRatios = detectHarmonicRatios(recentSwings);
  const fibonacciHarmonics = harmonicRatios.filter(r => isFibonacciRatio(r));
  
  // Detect sacred pattern
  let patternDetected: string | null = null;
  if (fibonacciHarmonics.length >= 3) {
    patternDetected = 'Fibonacci Harmonic Pattern';
  } else if (goldenRatioAlignment > 0.8) {
    patternDetected = 'Golden Ratio Price Action';
  }
  
  // Calculate sacred score
  const sacredScore = calculateSacredScore(
    nearestLevel.distance,
    levelStrength,
    goldenRatioAlignment,
    fibonacciHarmonics.length,
    harmonicRatios.length
  );
  
  return {
    nearestFibLevel: nearestLevel.level,
    distanceFromLevel: nearestLevel.distance,
    levelStrength,
    fibonacciZone,
    goldenRatioAlignment,
    spiralPhase,
    patternDetected,
    harmonicRatios,
    sacredScore
  };
}

// Calculate overall sacred geometry score
function calculateSacredScore(
  distanceFromLevel: number,
  levelStrength: 'strong' | 'moderate' | 'weak',
  goldenAlignment: number,
  fibHarmonicCount: number,
  totalHarmonics: number
): number {
  let score = 0;
  
  // Distance from Fibonacci level (closer = higher score)
  score += Math.max(0, 0.25 - distanceFromLevel) * 1.5;
  
  // Level strength bonus
  if (levelStrength === 'strong') score += 0.2;
  else if (levelStrength === 'moderate') score += 0.1;
  
  // Golden ratio alignment
  score += goldenAlignment * 0.25;
  
  // Fibonacci harmonic ratio
  if (totalHarmonics > 0) {
    score += (fibHarmonicCount / totalHarmonics) * 0.2;
  }
  
  return Math.min(1, score);
}

// Get Fibonacci extension targets
export function getFibonacciExtensions(
  swingLow: number,
  swingHigh: number,
  direction: 'up' | 'down'
): { level: number; price: number }[] {
  const range = Math.abs(swingHigh - swingLow);
  const extensionLevels = [1.272, 1.414, 1.618, 2.0, 2.618, 4.236];
  
  return extensionLevels.map(level => ({
    level,
    price: direction === 'up' 
      ? swingHigh + (range * (level - 1))
      : swingLow - (range * (level - 1))
  }));
}

// Sacred Geometry Overlay data for visualization
export interface SacredGeometryOverlay {
  fibonacciLevels: { level: number; price: number; distance: number }[];
  extensions: { level: number; price: number }[];
  spiralPhase: number;
  goldenZones: { start: number; end: number }[];
  sacredScore: number;
  currentAnalysis: GeometricAnalysis;
}

// Generate overlay data for charts
export function generateSacredOverlay(
  prices: number[],
  swingHigh: number,
  swingLow: number,
  direction: 'up' | 'down' = 'up'
): SacredGeometryOverlay {
  const fibLevels = detectFibonacciLevels(prices, swingHigh, swingLow);
  const extensions = getFibonacciExtensions(swingLow, swingHigh, direction);
  const analysis = analyzeGeometry(prices, swingHigh, swingLow);
  
  // Golden zones are 0.618 retracement areas
  const range = swingHigh - swingLow;
  const goldenZones = [
    { start: swingLow + range * 0.5, end: swingLow + range * 0.618 },
    { start: swingLow + range * 0.618, end: swingLow + range * 0.786 }
  ];
  
  return {
    fibonacciLevels: fibLevels,
    extensions,
    spiralPhase: analysis.spiralPhase,
    goldenZones,
    sacredScore: analysis.sacredScore,
    currentAnalysis: analysis
  };
}

// Export module
export const sacredGeometry = {
  PHI,
  PHI_INVERSE,
  FIBONACCI,
  FIBONACCI_RETRACEMENTS,
  SACRED_PATTERNS,
  
  detectFibonacciLevels,
  calculateSpiralPosition,
  detectHarmonicRatios,
  isFibonacciRatio,
  calculateGoldenRatioAlignment,
  analyzeGeometry,
  getFibonacciExtensions,
  generateSacredOverlay,
  
  philosophy: `
    The universe writes its laws in geometry.
    Fibonacci appears in galaxies, hurricanes, flowers, and DNA.
    Why would markets - collective human action - be exempt from this universal pattern?
    The golden ratio is not mysticism - it is mathematics made manifest.
    When price touches a Fibonacci level, it touches the structure of reality.
    Sacred geometry is simply the recognition that pattern is primary.
  `
};

export default sacredGeometry;
