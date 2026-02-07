/**
 * Cross-Domain Pattern Correlation Engine
 * 
 * Detects when similar patterns emerge across Chess and Market predictions.
 * This is where En Pensent's true intelligence emerges - finding universal
 * patterns that transcend domains.
 * 
 * Architecture:
 * - Chess predictions (archetypes, confidence, outcomes) → normalized signals
 * - Market predictions (direction, confidence, volatility) → normalized signals
 * - Cross-correlation analysis in real-time
 * - Alerting when pattern alignment exceeds threshold
 */

import { supabase } from '@/integrations/supabase/client';
import type { PredictionAttempt } from '@/lib/chess/cloudBenchmark';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface ChessSignal {
  timestamp: number;
  archetype: string;
  confidence: number;
  outcome: 'win' | 'loss' | 'draw';
  moveNumber: number;
  predictionAccuracy: number;
  normalizedIntensity: number; // 0-1 scale
}

interface MarketSignal {
  timestamp: number;
  symbol: string;
  category: string;
  direction: 'up' | 'down' | 'flat';
  confidence: number;
  outcome?: 'correct' | 'incorrect' | 'pending';
  volatility: number;
  normalizedIntensity: number; // 0-1 scale
}

interface PatternCorrelation {
  id: string;
  detectedAt: string;
  chessSignal: ChessSignal;
  marketSignal: MarketSignal;
  correlationScore: number; // 0-1
  patternType: 'momentum' | 'reversal' | 'consolidation' | 'breakout';
  confidence: number;
  validated: boolean;
  validationOutcome?: 'confirmed' | 'rejected' | 'pending';
}

interface UniversalPattern {
  patternId: string;
  patternName: string;
  description: string;
  chessSignatures: string[]; // Archetypes that trigger this
  marketSignatures: string[]; // Conditions that trigger this
  correlationThreshold: number;
  historicalAccuracy: number;
  occurrences: number;
  lastDetected: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN DEFINITIONS - Universal patterns that transcend domains
// ═════════════════════════════════════════════════════════════════════════════

const UNIVERSAL_PATTERNS: UniversalPattern[] = [
  {
    patternId: 'ep-momentum-surge',
    patternName: 'Momentum Surge',
    description: 'High confidence in both chess attack and market upward movement. ' +
                'Aggressive positioning paying off across domains.',
    chessSignatures: ['crushing_attack', 'tactical_mastery', 'relentless_pressure'],
    marketSignatures: ['up', 'high_confidence', 'low_volatility'],
    correlationThreshold: 0.75,
    historicalAccuracy: 0.0, // Updated dynamically
    occurrences: 0,
    lastDetected: new Date(0).toISOString()
  },
  {
    patternId: 'ep-reversal-alignment',
    patternName: 'Reversal Alignment',
    description: 'Chess comeback narrative aligns with market bounce prediction. ' +
                'Resilience patterns synchronized across domains.',
    chessSignatures: ['comeback_victory', 'defensive_resilience', 'positional_grind'],
    marketSignatures: ['up', 'after_decline', 'high_confidence'],
    correlationThreshold: 0.70,
    historicalAccuracy: 0.0,
    occurrences: 0,
    lastDetected: new Date(0).toISOString()
  },
  {
    patternId: 'ep-consolidation-harmony',
    patternName: 'Consolidation Harmony',
    description: 'Both chess and market in steady, low-volatility states. ' +
                'Strategic positioning phase across domains.',
    chessSignatures: ['positional_mastery', 'quiet_buildup', 'prophylactic_defense'],
    marketSignatures: ['flat', 'low_volatility', 'moderate_confidence'],
    correlationThreshold: 0.65,
    historicalAccuracy: 0.0,
    occurrences: 0,
    lastDetected: new Date(0).toISOString()
  },
  {
    patternId: 'ep-breakout-convergence',
    patternName: 'Breakout Convergence',
    description: 'Chess tactical explosion coincides with market volatility expansion. ' +
                'Explosive energy synchronized across domains.',
    chessSignatures: ['tactical_mastery', 'sacrificial_attack', 'queenside_onslaught'],
    marketSignatures: ['any_direction', 'high_volatility', 'breakout_pattern'],
    correlationThreshold: 0.80,
    historicalAccuracy: 0.0,
    occurrences: 0,
    lastDetected: new Date(0).toISOString()
  },
  {
    patternId: 'ep-precision-timing',
    patternName: 'Precision Timing',
    description: 'Late-game chess accuracy aligns with market entry timing. ' +
                'Optimal execution windows opening simultaneously.',
    chessSignatures: ['endgame_mastery', 'technical_precision', 'clutch_performance'],
    marketSignatures: ['any_direction', 'high_confidence', 'optimal_risk_reward'],
    correlationThreshold: 0.72,
    historicalAccuracy: 0.0,
    occurrences: 0,
    lastDetected: new Date(0).toISOString()
  }
];

// ═════════════════════════════════════════════════════════════════════════════
// SIGNAL NORMALIZATION - Convert domain-specific to universal
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Normalize chess prediction to universal intensity signal
 */
export function normalizeChessSignal(prediction: PredictionAttempt): ChessSignal {
  // Map archetype to intensity
  const archetypeIntensity: Record<string, number> = {
    'crushing_attack': 0.95,
    'tactical_mastery': 0.90,
    'positional_mastery': 0.75,
    'endgame_mastery': 0.85,
    'comeback_victory': 0.80,
    'defensive_resilience': 0.70,
    'technical_precision': 0.88,
    'relentless_pressure': 0.92,
    'quiet_buildup': 0.65,
    'prophylactic_defense': 0.60,
    'sacrificial_attack': 0.93,
    'queenside_onslaught': 0.87,
    'positional_grind': 0.68,
    'clutch_performance': 0.91,
    'default': 0.50
  };

  const intensity = archetypeIntensity[prediction.hybridArchetype] || 
                    archetypeIntensity['default'];

  // Blend with confidence
  const normalizedIntensity = (intensity * 0.6) + (prediction.hybridConfidence * 0.4);

  return {
    timestamp: Date.now(),
    archetype: prediction.hybridArchetype,
    confidence: prediction.hybridConfidence,
    outcome: prediction.hybridCorrect ? 'win' : 'loss',
    moveNumber: prediction.moveNumber,
    predictionAccuracy: prediction.hybridCorrect ? 1 : 0,
    normalizedIntensity: Math.min(1, Math.max(0, normalizedIntensity))
  };
}

/**
 * Normalize market prediction to universal intensity signal
 */
export function normalizeMarketSignal(
  symbol: string,
  category: string,
  direction: 'up' | 'down' | 'flat',
  confidence: number,
  volatility: number,
  outcome?: 'correct' | 'incorrect'
): MarketSignal {
  // Direction intensity (absolute value of directional conviction)
  const directionIntensity = direction === 'flat' ? 0.3 : 0.8;
  
  // Blend factors
  const normalizedIntensity = (
    (directionIntensity * 0.3) +
    (confidence * 0.4) +
    (Math.min(volatility, 0.5) * 0.3) // Cap volatility contribution
  );

  return {
    timestamp: Date.now(),
    symbol,
    category,
    direction,
    confidence,
    outcome,
    volatility,
    normalizedIntensity: Math.min(1, Math.max(0, normalizedIntensity))
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CORRELATION DETECTION ENGINE
// ═════════════════════════════════════════════════════════════════════════════

class CorrelationEngine {
  private chessBuffer: ChessSignal[] = [];
  private marketBuffer: MarketSignal[] = [];
  private readonly BUFFER_SIZE = 50;
  private correlations: PatternCorrelation[] = [];
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start the correlation monitoring engine
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[CorrelationEngine] 🌐 Starting cross-domain pattern detection');
    
    // Check for correlations every 30 seconds
    this.checkInterval = setInterval(() => {
      this.detectCorrelations();
    }, 30000);
  }

  /**
   * Stop the engine
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('[CorrelationEngine] ⏹️ Stopped');
  }

  /**
   * Ingest a chess prediction signal
   */
  ingestChessSignal(signal: ChessSignal): void {
    this.chessBuffer.push(signal);
    if (this.chessBuffer.length > this.BUFFER_SIZE) {
      this.chessBuffer.shift();
    }
    
    // Immediate check for high-intensity signals
    if (signal.normalizedIntensity > 0.85) {
      this.detectCorrelations();
    }
  }

  /**
   * Ingest a market prediction signal
   */
  ingestMarketSignal(signal: MarketSignal): void {
    this.marketBuffer.push(signal);
    if (this.marketBuffer.length > this.BUFFER_SIZE) {
      this.marketBuffer.shift();
    }
    
    // Immediate check for high-confidence signals
    if (signal.confidence > 0.75) {
      this.detectCorrelations();
    }
  }

  /**
   * Detect correlations between recent signals
   */
  private detectCorrelations(): void {
    if (this.chessBuffer.length === 0 || this.marketBuffer.length === 0) return;

    const now = Date.now();
    const timeWindow = 60000; // 1 minute window for correlation

    // Get recent signals
    const recentChess = this.chessBuffer.filter(s => now - s.timestamp < timeWindow);
    const recentMarket = this.marketBuffer.filter(s => now - s.timestamp < timeWindow);

    // Check each pattern definition
    for (const pattern of UNIVERSAL_PATTERNS) {
      const correlation = this.checkPattern(pattern, recentChess, recentMarket);
      
      if (correlation && correlation.correlationScore >= pattern.correlationThreshold) {
        this.recordCorrelation(correlation, pattern);
      }
    }
  }

  /**
   * Check if a specific pattern is present in recent signals
   */
  private checkPattern(
    pattern: UniversalPattern,
    chessSignals: ChessSignal[],
    marketSignals: MarketSignal[]
  ): PatternCorrelation | null {
    
    // Find matching chess signals
    const matchingChess = chessSignals.filter(c => 
      pattern.chessSignatures.includes(c.archetype)
    );

    if (matchingChess.length === 0) return null;

    // Find matching market signals
    const matchingMarket = marketSignals.filter(m => {
      // Check direction condition
      const directionMatch = pattern.marketSignatures.includes(m.direction) ||
                            pattern.marketSignatures.includes('any_direction');
      
      // Check volatility condition
      const volatilityMatch = pattern.marketSignatures.includes('high_volatility') 
        ? m.volatility > 0.02 
        : pattern.marketSignatures.includes('low_volatility')
          ? m.volatility < 0.01
          : true;

      // Check confidence condition
      const confidenceMatch = pattern.marketSignatures.includes('high_confidence')
        ? m.confidence > 0.75
        : pattern.marketSignatures.includes('moderate_confidence')
          ? m.confidence > 0.50
          : true;

      return directionMatch && volatilityMatch && confidenceMatch;
    });

    if (matchingMarket.length === 0) return null;

    // Calculate correlation score
    const bestChess = matchingChess.reduce((max, c) => 
      c.normalizedIntensity > max.normalizedIntensity ? c : max
    );

    const bestMarket = matchingMarket.reduce((max, m) => 
      m.normalizedIntensity > max.normalizedIntensity ? m : max
    );

    const correlationScore = (
      bestChess.normalizedIntensity * 0.5 +
      bestMarket.normalizedIntensity * 0.5
    );

    return {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: new Date().toISOString(),
      chessSignal: bestChess,
      marketSignal: bestMarket,
      correlationScore,
      patternType: this.mapPatternType(pattern.patternId),
      confidence: Math.min(bestChess.confidence, bestMarket.confidence),
      validated: false
    };
  }

  /**
   * Map pattern ID to pattern type
   */
  private mapPatternType(patternId: string): PatternCorrelation['patternType'] {
    if (patternId.includes('momentum')) return 'momentum';
    if (patternId.includes('reversal')) return 'reversal';
    if (patternId.includes('consolidation')) return 'consolidation';
    if (patternId.includes('breakout')) return 'breakout';
    return 'momentum';
  }

  /**
   * Record a detected correlation
   */
  private async recordCorrelation(
    correlation: PatternCorrelation,
    pattern: UniversalPattern
  ): Promise<void> {
    // Check if similar correlation was recently recorded (dedup)
    const recentDuplicate = this.correlations.find(c =>
      c.patternType === correlation.patternType &&
      Date.now() - new Date(c.detectedAt).getTime() < 300000 // 5 min dedup
    );

    if (recentDuplicate) return;

    // Add to local buffer
    this.correlations.push(correlation);
    if (this.correlations.length > 100) {
      this.correlations.shift();
    }

    // Update pattern stats
    pattern.occurrences++;
    pattern.lastDetected = correlation.detectedAt;

    // Log correlation detection
    console.log(`[CorrelationEngine] 🔗 ${pattern.patternName} DETECTED`);
    console.log(`  Score: ${(correlation.correlationScore * 100).toFixed(1)}%`);
    console.log(`  Chess: ${correlation.chessSignal.archetype} (${(correlation.chessSignal.normalizedIntensity * 100).toFixed(0)}%)`);
    console.log(`  Market: ${correlation.marketSignal.symbol} ${correlation.marketSignal.direction} (${(correlation.marketSignal.normalizedIntensity * 100).toFixed(0)}%)`);

    // TODO: Enable database persistence after running migration:
    // supabase/migrations/001_cross_domain_correlations.sql
    // For now, correlations are stored in memory and logged to console
  }

  /**
   * Get recent correlations
   */
  getRecentCorrelations(limit: number = 10): PatternCorrelation[] {
    return this.correlations
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(): UniversalPattern[] {
    return [...UNIVERSAL_PATTERNS];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═════════════════════════════════════════════════════════════════════════════

let engine: CorrelationEngine | null = null;

export function getCorrelationEngine(): CorrelationEngine {
  if (!engine) {
    engine = new CorrelationEngine();
  }
  return engine;
}

// ═════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

export function useCrossDomainCorrelations() {
  const [correlations, setCorrelations] = useState<PatternCorrelation[]>([]);
  const [patterns, setPatterns] = useState<UniversalPattern[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const eng = getCorrelationEngine();
    
    // Initial load
    setCorrelations(eng.getRecentCorrelations());
    setPatterns(eng.getPatternStats());

    // Poll for updates
    const interval = setInterval(() => {
      setCorrelations(eng.getRecentCorrelations());
      setPatterns(eng.getPatternStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startMonitoring = useCallback(() => {
    getCorrelationEngine().start();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    getCorrelationEngine().stop();
    setIsMonitoring(false);
  }, []);

  const ingestChess = useCallback((prediction: PredictionAttempt) => {
    const signal = normalizeChessSignal(prediction);
    getCorrelationEngine().ingestChessSignal(signal);
  }, []);

  const ingestMarket = useCallback((
    symbol: string,
    category: string,
    direction: 'up' | 'down' | 'flat',
    confidence: number,
    volatility: number
  ) => {
    const signal = normalizeMarketSignal(symbol, category, direction, confidence, volatility);
    getCorrelationEngine().ingestMarketSignal(signal);
  }, []);

  return {
    correlations,
    patterns,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    ingestChess,
    ingestMarket
  };
}

export default CorrelationEngine;
