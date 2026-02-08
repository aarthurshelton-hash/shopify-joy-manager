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
import { universalAdapterRegistry } from './domains/universal/adapters/index';

function getUniversalAdapterRegistry() { return universalAdapterRegistry; }

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
    
    // Feed signal to universal adapter registry for cross-domain learning
    try {
      const registry = getUniversalAdapterRegistry();
      registry.incrementSignalCount('universalPatterns');
      registry.incrementSignalCount('competitiveDynamics');
      if (signal.normalizedIntensity > 0.7) {
        registry.incrementSignalCount('gameTheory');
      }
    } catch { /* registry not critical */ }
    
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

    // v8.1: Persist to database
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('cross_domain_correlations')
        .insert({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          correlation_id: (correlation as any).correlationId || crypto.randomUUID(),
          pattern_id: pattern.patternId,
          pattern_name: pattern.patternName,
          correlation_score: correlation.correlationScore,
          chess_archetype: correlation.chessSignal.archetype,
          chess_confidence: correlation.chessSignal.confidence,
          chess_intensity: correlation.chessSignal.normalizedIntensity,
          market_symbol: correlation.marketSignal.symbol,
          market_direction: correlation.marketSignal.direction,
          market_confidence: correlation.marketSignal.confidence,
          market_intensity: correlation.marketSignal.normalizedIntensity,
          detected_at: correlation.detectedAt,
          validated: false
        });
      
      if (error) {
        console.warn('[CorrelationEngine] DB persistence warning:', error.message);
      } else {
        console.log('[CorrelationEngine] ✅ Saved to database');
      }
    } catch (err) {
      console.warn('[CorrelationEngine] DB persistence failed:', err);
    }
  }

  /**
   * Validate a correlation with actual outcome
   * Called when chess game ends or market prediction resolves
   */
  async validateCorrelation(
    correlationId: string,
    chessOutcome: 'confirmed' | 'rejected' | 'pending',
    marketOutcome: 'confirmed' | 'rejected' | 'pending'
  ): Promise<void> {
    // Determine overall validation outcome
    let validationOutcome: 'confirmed' | 'rejected' | 'pending' = 'pending';
    
    if (chessOutcome === 'confirmed' && marketOutcome === 'confirmed') {
      validationOutcome = 'confirmed';
    } else if (chessOutcome === 'rejected' || marketOutcome === 'rejected') {
      validationOutcome = 'rejected';
    }
    
    // Update local correlation
    const correlation = this.correlations.find(c => c.id === correlationId);
    if (correlation) {
      correlation.validated = true;
      correlation.validationOutcome = validationOutcome;
      
      console.log(`[CorrelationEngine] ✅ Validated: ${correlationId} → ${validationOutcome}`);
    }
    
    // Update database
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('cross_domain_correlations')
        .update({
          validated: true,
          validation_outcome: validationOutcome,
          chess_outcome: chessOutcome,
          market_outcome: marketOutcome,
          validated_at: new Date().toISOString()
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', correlationId as any);
      
      if (error) {
        console.warn('[CorrelationEngine] Validation update failed:', error.message);
      } else {
        // Update pattern accuracy
        this.updatePatternAccuracy(correlation?.patternType || 'momentum', validationOutcome === 'confirmed');
      }
    } catch (err) {
      console.warn('[CorrelationEngine] Validation DB update failed:', err);
    }
  }

  /**
   * Update pattern accuracy based on validation outcome
   */
  private updatePatternAccuracy(patternType: string, wasCorrect: boolean): void {
    const pattern = UNIVERSAL_PATTERNS.find(p => 
      p.patternId.toLowerCase().includes(patternType.toLowerCase())
    );
    
    if (!pattern) return;
    
    // Calculate rolling accuracy
    const currentAccuracy = pattern.historicalAccuracy;
    const totalOccurrences = pattern.occurrences;
    
    // Bayesian update: weight recent outcomes more heavily
    const newAccuracy = totalOccurrences === 0
      ? (wasCorrect ? 1.0 : 0.0)
      : (currentAccuracy * (totalOccurrences - 1) + (wasCorrect ? 1.0 : 0.0)) / totalOccurrences;
    
    pattern.historicalAccuracy = Math.max(0, Math.min(1, newAccuracy));
    
    console.log(`[CorrelationEngine] 📊 Pattern "${pattern.patternName}" accuracy: ${(pattern.historicalAccuracy * 100).toFixed(1)}%`);
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    total: number;
    validated: number;
    confirmed: number;
    rejected: number;
    pending: number;
    accuracyRate: number;
  } {
    const total = this.correlations.length;
    const validated = this.correlations.filter(c => c.validated).length;
    const confirmed = this.correlations.filter(c => c.validationOutcome === 'confirmed').length;
    const rejected = this.correlations.filter(c => c.validationOutcome === 'rejected').length;
    const pending = total - validated;
    
    const accuracyRate = validated > 0 ? confirmed / validated : 0;
    
    return {
      total,
      validated,
      confirmed,
      rejected,
      pending,
      accuracyRate
    };
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
  const [validationStats, setValidationStats] = useState({
    total: 0,
    validated: 0,
    confirmed: 0,
    rejected: 0,
    pending: 0,
    accuracyRate: 0
  });

  useEffect(() => {
    const eng = getCorrelationEngine();
    
    // Initial load
    setCorrelations(eng.getRecentCorrelations());
    setPatterns(eng.getPatternStats());
    setValidationStats(eng.getValidationStats());

    // Poll for updates
    const interval = setInterval(() => {
      setCorrelations(eng.getRecentCorrelations());
      setPatterns(eng.getPatternStats());
      setValidationStats(eng.getValidationStats());
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

  const validateCorrelation = useCallback(async (
    correlationId: string,
    chessOutcome: 'confirmed' | 'rejected' | 'pending',
    marketOutcome: 'confirmed' | 'rejected' | 'pending'
  ) => {
    await getCorrelationEngine().validateCorrelation(correlationId, chessOutcome, marketOutcome);
    // Refresh stats after validation
    setValidationStats(getCorrelationEngine().getValidationStats());
  }, []);

  return {
    correlations,
    patterns,
    isMonitoring,
    validationStats,
    startMonitoring,
    stopMonitoring,
    ingestChess,
    ingestMarket,
    validateCorrelation
  };
}

export default CorrelationEngine;
