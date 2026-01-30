/**
 * Cross-Domain Learning Pipeline v1.0
 * 
 * En Pensent™ Universal Intelligence Learning System
 * 
 * Connects Chess, Code, and Market domains into a unified
 * learning organism where patterns flow bidirectionally:
 * 
 * Chess Historical Games → Pattern Signatures → Code Architecture Insights
 * Code Domain Analysis → Archetype Mapping → Market Intelligence
 * Market Execution Data → Confidence Calibration → Chess Prediction Refinement
 * 
 * "Every game analyzed teaches all three domains"
 */

import { UnifiedGameData } from '@/lib/chess/gameImport/multiSourceFetcher';
import { supabase } from '@/integrations/supabase/client';

// Cross-domain learning types
export interface DomainLesson {
  sourceSignature: string;
  targetDomain: 'chess' | 'code' | 'market';
  patternType: string;
  confidence: number;
  applicableArchetypes: string[];
  transferWeight: number; // 0-1 how well this translates
}

export interface CrossDomainPattern {
  id: string;
  originDomain: 'chess' | 'code' | 'market';
  fingerprint: string;
  archetypeMapping: Record<string, string[]>;
  confidenceByDomain: Record<string, number>;
  totalObservations: number;
  successRate: number;
  lastUpdated: Date;
}

export interface LearningState {
  totalPatternsLearned: number;
  crossDomainTransfers: number;
  chessToMarketAccuracy: number;
  codeToChessResonance: number;
  marketToCodeAlignment: number;
  evolutionGeneration: number;
}

// Universal pattern equivalence weights
const DOMAIN_EXCHANGE_WEIGHTS = {
  chess: { code: 0.8, market: 1.2 },
  code: { chess: 1.25, market: 0.95 },
  market: { chess: 0.85, code: 1.05 },
} as const;

// Archetype mappings for cross-domain transfer
const ARCHETYPE_TRANSFER_MAP: Record<string, Record<string, string[]>> = {
  // Chess archetypes → Other domains
  kingside_attack: {
    code: ['feature_sprint', 'rapid_growth'],
    market: ['breakout_bullish', 'momentum_surge'],
  },
  queenside_attack: {
    code: ['architecture_shift', 'refactoring_surge'],
    market: ['accumulation', 'distribution'],
  },
  central_domination: {
    code: ['core_fortress', 'pattern_master'],
    market: ['consolidation', 'uptrend'],
  },
  piece_activity: {
    code: ['modular_army', 'microservice_swarm'],
    market: ['high_volatility', 'momentum_surge'],
  },
  pawn_structure: {
    code: ['stable_evolution', 'maintenance_mode'],
    market: ['accumulation', 'low_volatility'],
  },
  endgame_technique: {
    code: ['technical_debt', 'legacy_guardian'],
    market: ['distribution', 'reversal_bullish'],
  },
  prophylaxis: {
    code: ['balanced_portfolio', 'stable_evolution'],
    market: ['consolidation', 'low_volatility'],
  },
  space_advantage: {
    code: ['pattern_master', 'core_fortress'],
    market: ['uptrend', 'accumulation'],
  },
  material_advantage: {
    code: ['rapid_growth', 'feature_sprint'],
    market: ['breakout_bullish', 'uptrend'],
  },
  dynamic_play: {
    code: ['refactoring_surge', 'architecture_shift'],
    market: ['high_volatility', 'reversal_bullish'],
  },
  positional_squeeze: {
    code: ['technical_debt', 'complexity_wave'],
    market: ['accumulation', 'consolidation'],
  },
  tactical_chaos: {
    code: ['bug_fix_cycle', 'complexity_wave'],
    market: ['high_volatility', 'reversal_bearish'],
  },
};

// 64-square correlation matrix (Chess squares → Code metrics → Market sectors)
const SQUARE_METRIC_SECTOR_MAP = {
  // Center squares (d4, d5, e4, e5) = Core SDK = Large-cap tech
  center: { codeCategory: 'core-sdk', marketSector: 'technology' },
  // Kingside (f-h files) = UI/UX = Consumer discretionary
  kingside: { codeCategory: 'ui-components', marketSector: 'consumer' },
  // Queenside (a-c files) = Infrastructure = Utilities/Energy
  queenside: { codeCategory: 'infrastructure', marketSector: 'utilities' },
  // King position = Security = Financial services
  kingZone: { codeCategory: 'security', marketSector: 'financials' },
};

class CrossDomainLearningPipeline {
  private patterns = new Map<string, CrossDomainPattern>();
  private learningState: LearningState = {
    totalPatternsLearned: 0,
    crossDomainTransfers: 0,
    chessToMarketAccuracy: 0.5,
    codeToChessResonance: 0.5,
    marketToCodeAlignment: 0.5,
    evolutionGeneration: 1,
  };

  /**
   * Learn from historical chess games and propagate to all domains
   */
  async learnFromChessGame(game: UnifiedGameData, outcome: {
    predictedWinner?: 'white' | 'black' | 'draw';
    actualWinner?: 'white' | 'black' | 'draw';
    archetype: string;
    confidence: number;
  }): Promise<DomainLesson[]> {
    const lessons: DomainLesson[] = [];
    
    // Generate chess signature fingerprint
    const fingerprint = this.generateChessFingerprint(game, outcome.archetype);
    
    // Get transferable archetypes for other domains
    const codeArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.code || [];
    const marketArchetypes = ARCHETYPE_TRANSFER_MAP[outcome.archetype]?.market || [];
    
    // Calculate transfer weights based on prediction accuracy
    const wasCorrect = outcome.predictedWinner === outcome.actualWinner;
    const baseWeight = wasCorrect ? 1.0 : 0.7;
    
    // Create code domain lesson
    if (codeArchetypes.length > 0) {
      lessons.push({
        sourceSignature: fingerprint,
        targetDomain: 'code',
        patternType: outcome.archetype,
        confidence: outcome.confidence * DOMAIN_EXCHANGE_WEIGHTS.chess.code,
        applicableArchetypes: codeArchetypes,
        transferWeight: baseWeight * DOMAIN_EXCHANGE_WEIGHTS.chess.code,
      });
    }
    
    // Create market domain lesson
    if (marketArchetypes.length > 0) {
      lessons.push({
        sourceSignature: fingerprint,
        targetDomain: 'market',
        patternType: outcome.archetype,
        confidence: outcome.confidence * DOMAIN_EXCHANGE_WEIGHTS.chess.market,
        applicableArchetypes: marketArchetypes,
        transferWeight: baseWeight * DOMAIN_EXCHANGE_WEIGHTS.chess.market,
      });
    }
    
    // Store cross-domain pattern
    await this.storeCrossDomainPattern('chess', fingerprint, {
      chess: [outcome.archetype],
      code: codeArchetypes,
      market: marketArchetypes,
    }, outcome.confidence, wasCorrect);
    
    // Update learning state
    this.learningState.totalPatternsLearned++;
    this.learningState.crossDomainTransfers += lessons.length;
    if (wasCorrect) {
      this.learningState.chessToMarketAccuracy = 
        this.learningState.chessToMarketAccuracy * 0.99 + 0.01;
    } else {
      this.learningState.chessToMarketAccuracy = 
        this.learningState.chessToMarketAccuracy * 0.99;
    }
    
    console.log(`[CrossDomainLearning] Chess → ${lessons.length} lessons (${outcome.archetype})`);
    
    return lessons;
  }

  /**
   * Learn from code analysis and propagate to chess/market
   */
  async learnFromCodeAnalysis(analysis: {
    archetype: string;
    health: number;
    fingerprint: string;
    quadrantProfile: { complexity: number; velocity: number; quality: number; architecture: number };
  }): Promise<DomainLesson[]> {
    const lessons: DomainLesson[] = [];
    
    // Map code archetype to chess patterns
    const chessEquivalents = this.findChessEquivalents(analysis.archetype);
    const marketEquivalents = this.findMarketEquivalents(analysis.archetype);
    
    const confidence = analysis.health / 100;
    
    // Create chess domain lesson
    if (chessEquivalents.length > 0) {
      lessons.push({
        sourceSignature: analysis.fingerprint,
        targetDomain: 'chess',
        patternType: analysis.archetype,
        confidence: confidence * DOMAIN_EXCHANGE_WEIGHTS.code.chess,
        applicableArchetypes: chessEquivalents,
        transferWeight: DOMAIN_EXCHANGE_WEIGHTS.code.chess,
      });
    }
    
    // Create market domain lesson
    if (marketEquivalents.length > 0) {
      lessons.push({
        sourceSignature: analysis.fingerprint,
        targetDomain: 'market',
        patternType: analysis.archetype,
        confidence: confidence * DOMAIN_EXCHANGE_WEIGHTS.code.market,
        applicableArchetypes: marketEquivalents,
        transferWeight: DOMAIN_EXCHANGE_WEIGHTS.code.market,
      });
    }
    
    // Store pattern
    await this.storeCrossDomainPattern('code', analysis.fingerprint, {
      code: [analysis.archetype],
      chess: chessEquivalents,
      market: marketEquivalents,
    }, confidence, true);
    
    this.learningState.totalPatternsLearned++;
    this.learningState.crossDomainTransfers += lessons.length;
    this.learningState.codeToChessResonance = 
      (this.learningState.codeToChessResonance + confidence) / 2;
    
    console.log(`[CrossDomainLearning] Code → ${lessons.length} lessons (${analysis.archetype})`);
    
    return lessons;
  }

  /**
   * Learn from market execution and calibrate chess/code predictions
   */
  async learnFromMarketExecution(execution: {
    symbol: string;
    direction: 'up' | 'down' | 'neutral';
    predicted: 'up' | 'down' | 'neutral';
    confidence: number;
    archetype: string;
    pnl?: number;
  }): Promise<DomainLesson[]> {
    const lessons: DomainLesson[] = [];
    const wasCorrect = execution.direction === execution.predicted;
    
    // Map market archetype back to chess/code patterns
    const chessEquivalents = this.findChessEquivalents(execution.archetype);
    const codeEquivalents = this.findCodeEquivalents(execution.archetype);
    
    const adjustedConfidence = wasCorrect 
      ? execution.confidence * 1.1 
      : execution.confidence * 0.85;
    
    // Create chess domain calibration lesson
    if (chessEquivalents.length > 0) {
      lessons.push({
        sourceSignature: `market_${execution.symbol}_${Date.now()}`,
        targetDomain: 'chess',
        patternType: execution.archetype,
        confidence: adjustedConfidence * DOMAIN_EXCHANGE_WEIGHTS.market.chess,
        applicableArchetypes: chessEquivalents,
        transferWeight: wasCorrect ? 1.0 : 0.7,
      });
    }
    
    // Create code domain calibration lesson
    if (codeEquivalents.length > 0) {
      lessons.push({
        sourceSignature: `market_${execution.symbol}_${Date.now()}`,
        targetDomain: 'code',
        patternType: execution.archetype,
        confidence: adjustedConfidence * DOMAIN_EXCHANGE_WEIGHTS.market.code,
        applicableArchetypes: codeEquivalents,
        transferWeight: wasCorrect ? 1.0 : 0.7,
      });
    }
    
    // Update accuracy tracking
    if (wasCorrect) {
      this.learningState.marketToCodeAlignment = 
        this.learningState.marketToCodeAlignment * 0.95 + 0.05;
    } else {
      this.learningState.marketToCodeAlignment = 
        this.learningState.marketToCodeAlignment * 0.95;
    }
    
    this.learningState.crossDomainTransfers += lessons.length;
    
    console.log(`[CrossDomainLearning] Market (${execution.symbol}) → ${lessons.length} lessons (${wasCorrect ? '✓' : '✗'})`);
    
    return lessons;
  }

  /**
   * Import historical games from Lichess/Chess.com and extract patterns
   */
  async importHistoricalGames(games: UnifiedGameData[]): Promise<{
    gamesProcessed: number;
    patternsExtracted: number;
    crossDomainLessons: number;
  }> {
    let patternsExtracted = 0;
    let crossDomainLessons = 0;
    
    for (const game of games) {
      // Extract archetype from game characteristics
      const archetype = this.inferArchetypeFromGame(game);
      
      // Learn from this game
      const lessons = await this.learnFromChessGame(game, {
        actualWinner: game.winner === 'white' ? 'white' : game.winner === 'black' ? 'black' : 'draw',
        archetype,
        confidence: this.calculateGameConfidence(game),
      });
      
      patternsExtracted++;
      crossDomainLessons += lessons.length;
    }
    
    // Persist learning state
    await this.persistLearningState();
    
    return {
      gamesProcessed: games.length,
      patternsExtracted,
      crossDomainLessons,
    };
  }

  // Private helper methods
  private generateChessFingerprint(game: UnifiedGameData, archetype: string): string {
    const components = [
      archetype.slice(0, 4),
      game.speed?.slice(0, 2) || 'un',
      String(game.whiteElo || 0).slice(-2),
      String(game.blackElo || 0).slice(-2),
      game.result?.replace(/[^0-9]/g, '') || '00',
    ];
    return `chess_${components.join('')}_${Date.now().toString(36)}`;
  }

  private findChessEquivalents(archetype: string): string[] {
    for (const [chessArch, mappings] of Object.entries(ARCHETYPE_TRANSFER_MAP)) {
      if (mappings.code?.includes(archetype) || mappings.market?.includes(archetype)) {
        return [chessArch];
      }
    }
    return [];
  }

  private findMarketEquivalents(archetype: string): string[] {
    const mappings = ARCHETYPE_TRANSFER_MAP[archetype];
    return mappings?.market || [];
  }

  private findCodeEquivalents(archetype: string): string[] {
    const codeArchetypes: string[] = [];
    for (const mappings of Object.values(ARCHETYPE_TRANSFER_MAP)) {
      if (mappings.market?.includes(archetype)) {
        codeArchetypes.push(...(mappings.code || []));
      }
    }
    return [...new Set(codeArchetypes)];
  }

  private inferArchetypeFromGame(game: UnifiedGameData): string {
    // Infer archetype from game characteristics
    const eloAvg = ((game.whiteElo || 0) + (game.blackElo || 0)) / 2;
    const isDecisive = game.result !== '1/2-1/2';
    
    if (game.speed === 'bullet' || game.speed === 'blitz') {
      return isDecisive ? 'tactical_chaos' : 'dynamic_play';
    }
    
    if (eloAvg > 2500) {
      return isDecisive ? 'endgame_technique' : 'positional_squeeze';
    }
    
    if (game.termination?.includes('checkmate')) {
      return 'kingside_attack';
    }
    
    return 'central_domination';
  }

  private calculateGameConfidence(game: UnifiedGameData): number {
    let confidence = 0.5;
    
    // Higher ELO = higher confidence
    const avgElo = ((game.whiteElo || 0) + (game.blackElo || 0)) / 2;
    if (avgElo > 2200) confidence += 0.15;
    if (avgElo > 2400) confidence += 0.15;
    if (avgElo > 2600) confidence += 0.1;
    
    // Rated games = more reliable
    if (game.rated) confidence += 0.05;
    
    // Known opening = more structured
    if (game.openingEco) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private async storeCrossDomainPattern(
    origin: 'chess' | 'code' | 'market',
    fingerprint: string,
    archetypeMapping: Record<string, string[]>,
    confidence: number,
    successful: boolean
  ): Promise<void> {
    const existing = this.patterns.get(fingerprint);
    
    if (existing) {
      existing.totalObservations++;
      existing.successRate = (existing.successRate * (existing.totalObservations - 1) + (successful ? 1 : 0)) / existing.totalObservations;
      existing.confidenceByDomain[origin] = confidence;
      existing.lastUpdated = new Date();
    } else {
      this.patterns.set(fingerprint, {
        id: fingerprint,
        originDomain: origin,
        fingerprint,
        archetypeMapping,
        confidenceByDomain: { [origin]: confidence },
        totalObservations: 1,
        successRate: successful ? 1 : 0,
        lastUpdated: new Date(),
      });
    }
  }

  private async persistLearningState(): Promise<void> {
    try {
      await supabase.from('evolution_state').insert({
        state_type: 'cross_domain_learning',
        genes: {
          ...this.learningState,
          patternCount: this.patterns.size,
        },
        generation: this.learningState.evolutionGeneration,
        fitness_score: (
          this.learningState.chessToMarketAccuracy +
          this.learningState.codeToChessResonance +
          this.learningState.marketToCodeAlignment
        ) / 3,
        last_mutation_at: new Date().toISOString(),
      } as any);
      
      this.learningState.evolutionGeneration++;
    } catch (error) {
      console.warn('[CrossDomainLearning] Failed to persist state:', error);
    }
  }

  /**
   * Get current learning state
   */
  getState(): LearningState {
    return { ...this.learningState };
  }

  /**
   * Get all learned patterns
   */
  getPatterns(): CrossDomainPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns applicable to a specific domain
   */
  getPatternsForDomain(domain: 'chess' | 'code' | 'market'): CrossDomainPattern[] {
    return this.getPatterns().filter(p => 
      p.archetypeMapping[domain]?.length > 0
    );
  }
}

// Singleton export
export const crossDomainLearningPipeline = new CrossDomainLearningPipeline();
