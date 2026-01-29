/**
 * Greeks-Chess Adapter - Options Greeks ↔ Chess Constraints Mapping
 * 
 * Formalizes the profound parallel between Options Greeks and Chess game dynamics:
 * - Δ Delta ↔ Material Balance (directional edge)
 * - Γ Gamma ↔ Tactical Sharpness (acceleration)
 * - Θ Theta ↔ Time Control Pressure (decay)
 * - ν Vega ↔ Position Complexity (volatility)
 * - ρ Rho ↔ Long-term Positional Factors
 * 
 * @version 1.0-GREEKS-CHESS
 * @inventor Alec Arthur Shelton
 */

export interface GreeksProfile {
  delta: number;      // -1 to 1 (directional sensitivity)
  gamma: number;      // 0 to 1 (acceleration/sharpness)
  theta: number;      // 0 to 1 (time pressure intensity)
  vega: number;       // 0 to 1 (volatility/complexity sensitivity)
  rho: number;        // 0 to 1 (long-term factor weight)
}

export interface ChessConstraints {
  timeControl: 'bullet' | 'blitz' | 'rapid' | 'classical';
  materialBalance: number;     // -39 to +39 (standard piece values)
  tacticalSharpness: number;   // 0 to 1 (position complexity)
  pieceActivity: number;       // 0 to 1 (how active pieces are)
  pawnStructure: number;       // 0 to 1 (structural integrity)
  kingSafety: number;          // 0 to 1 (king exposure)
}

export interface GreeksChessMapping {
  greeks: GreeksProfile;
  chessEquivalent: ChessConstraints;
  optionsImplication: {
    preferredStrategy: 'long_calls' | 'long_puts' | 'spreads' | 'iron_condor' | 'straddle' | 'strangle';
    optimalExpiration: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'leaps';
    riskLevel: 'aggressive' | 'moderate' | 'conservative';
  };
  confidenceBoost: number;
}

// Time control → Theta/Expiration mapping
const TIME_CONTROL_GREEKS: Record<string, { theta: number; expiration: string }> = {
  'bullet': { theta: 0.95, expiration: 'daily' },      // Extreme time pressure = 0DTE
  'blitz': { theta: 0.75, expiration: 'weekly' },      // Fast decay
  'rapid': { theta: 0.45, expiration: 'monthly' },     // Balanced
  'classical': { theta: 0.15, expiration: 'quarterly' }, // Low theta, Rho matters
};

// Material balance → Delta mapping
function materialToDelta(materialBalance: number): number {
  // Material ranges from -39 (black dominating) to +39 (white dominating)
  // Delta ranges from -1 to 1
  const normalized = Math.max(-1, Math.min(1, materialBalance / 20));
  return normalized;
}

// Tactical sharpness → Gamma mapping
function sharpnessToGamma(tacticalSharpness: number, pieceCount: number): number {
  // High piece count + tactical complexity = high gamma
  // Simplified positions = low gamma
  const pieceMultiplier = Math.min(1, pieceCount / 32);
  return tacticalSharpness * pieceMultiplier;
}

// Position complexity → Vega mapping
function complexityToVega(pieceActivity: number, tacticalSharpness: number): number {
  // Complex positions with active pieces = high vega (benefits from volatility)
  // Quiet positions = low vega
  return (pieceActivity * 0.6 + tacticalSharpness * 0.4);
}

// Pawn structure/long-term factors → Rho mapping
function structureToRho(pawnStructure: number, timeControl: string): number {
  // Long-term positional factors matter more in classical
  const timeMultiplier = timeControl === 'classical' ? 1.0 : 
                         timeControl === 'rapid' ? 0.7 :
                         timeControl === 'blitz' ? 0.4 : 0.2;
  return pawnStructure * timeMultiplier;
}

class GreeksChessAdapter {
  private analysisHistory: GreeksChessMapping[] = [];
  
  /**
   * Convert chess position constraints to Options Greeks profile
   */
  chessToGreeks(constraints: ChessConstraints): GreeksProfile {
    const timeGreeks = TIME_CONTROL_GREEKS[constraints.timeControl] || TIME_CONTROL_GREEKS['rapid'];
    
    return {
      delta: materialToDelta(constraints.materialBalance),
      gamma: sharpnessToGamma(constraints.tacticalSharpness, 32), // Assume full piece count initially
      theta: timeGreeks.theta,
      vega: complexityToVega(constraints.pieceActivity, constraints.tacticalSharpness),
      rho: structureToRho(constraints.pawnStructure, constraints.timeControl),
    };
  }
  
  /**
   * Convert Options Greeks to equivalent chess constraints
   */
  greeksToChess(greeks: GreeksProfile): ChessConstraints {
    // Reverse mapping
    let timeControl: ChessConstraints['timeControl'] = 'rapid';
    if (greeks.theta > 0.85) timeControl = 'bullet';
    else if (greeks.theta > 0.6) timeControl = 'blitz';
    else if (greeks.theta > 0.3) timeControl = 'rapid';
    else timeControl = 'classical';
    
    return {
      timeControl,
      materialBalance: Math.round(greeks.delta * 20),
      tacticalSharpness: greeks.gamma,
      pieceActivity: greeks.vega * 0.8 + greeks.gamma * 0.2,
      pawnStructure: greeks.rho,
      kingSafety: 1 - greeks.gamma * 0.5, // High gamma = risky king positions
    };
  }
  
  /**
   * Generate full mapping with trading implications
   */
  generateMapping(constraints: ChessConstraints): GreeksChessMapping {
    const greeks = this.chessToGreeks(constraints);
    
    // Determine optimal strategy based on Greeks profile
    let preferredStrategy: GreeksChessMapping['optionsImplication']['preferredStrategy'];
    let riskLevel: GreeksChessMapping['optionsImplication']['riskLevel'];
    
    // High delta (directional edge) → directional trades
    if (Math.abs(greeks.delta) > 0.6) {
      preferredStrategy = greeks.delta > 0 ? 'long_calls' : 'long_puts';
      riskLevel = 'aggressive';
    }
    // High gamma (tactical sharpness) → benefit from big moves
    else if (greeks.gamma > 0.7) {
      preferredStrategy = 'straddle';
      riskLevel = 'aggressive';
    }
    // High vega (complexity) → volatility plays
    else if (greeks.vega > 0.7) {
      preferredStrategy = 'strangle';
      riskLevel = 'moderate';
    }
    // Low volatility, neutral → collect premium
    else if (greeks.gamma < 0.3 && Math.abs(greeks.delta) < 0.3) {
      preferredStrategy = 'iron_condor';
      riskLevel = 'conservative';
    }
    // Default to spreads for balanced risk
    else {
      preferredStrategy = 'spreads';
      riskLevel = 'moderate';
    }
    
    // Determine expiration from theta
    const timeGreeks = TIME_CONTROL_GREEKS[constraints.timeControl];
    const optimalExpiration = timeGreeks?.expiration as GreeksChessMapping['optionsImplication']['optimalExpiration'] || 'weekly';
    
    // Calculate confidence boost based on alignment
    const alignmentScore = this.calculateAlignmentScore(greeks, constraints);
    
    const mapping: GreeksChessMapping = {
      greeks,
      chessEquivalent: constraints,
      optionsImplication: {
        preferredStrategy,
        optimalExpiration,
        riskLevel,
      },
      confidenceBoost: alignmentScore,
    };
    
    this.analysisHistory.push(mapping);
    if (this.analysisHistory.length > 100) this.analysisHistory.shift();
    
    return mapping;
  }
  
  /**
   * Calculate alignment score between Greeks and chess position
   * Higher alignment = higher confidence in the parallel
   */
  private calculateAlignmentScore(greeks: GreeksProfile, constraints: ChessConstraints): number {
    let score = 0;
    
    // Theta-time control alignment
    const expectedTheta = TIME_CONTROL_GREEKS[constraints.timeControl]?.theta || 0.5;
    const thetaAlignment = 1 - Math.abs(greeks.theta - expectedTheta);
    score += thetaAlignment * 0.25;
    
    // Delta-material alignment (strong material = strong delta)
    const materialStrength = Math.abs(constraints.materialBalance) / 20;
    const deltaStrength = Math.abs(greeks.delta);
    const deltaAlignment = 1 - Math.abs(materialStrength - deltaStrength);
    score += deltaAlignment * 0.25;
    
    // Gamma-tactical alignment
    const gammaAlignment = 1 - Math.abs(greeks.gamma - constraints.tacticalSharpness);
    score += gammaAlignment * 0.20;
    
    // Vega-activity alignment
    const vegaAlignment = 1 - Math.abs(greeks.vega - constraints.pieceActivity);
    score += vegaAlignment * 0.15;
    
    // Rho-structure alignment
    const rhoAlignment = 1 - Math.abs(greeks.rho - constraints.pawnStructure);
    score += rhoAlignment * 0.15;
    
    return Math.max(0, Math.min(0.15, score * 0.15)); // Max 15% boost
  }
  
  /**
   * Get trading recommendation from current market Greeks
   */
  getChessInsightFromMarketGreeks(delta: number, gamma: number, theta: number, vega: number, rho: number): {
    chessAnalogy: string;
    strategicInsight: string;
    timeControlEquivalent: string;
  } {
    const greeks: GreeksProfile = { delta, gamma, theta, vega, rho };
    const chess = this.greeksToChess(greeks);
    
    let chessAnalogy: string;
    let strategicInsight: string;
    
    // Generate human-readable insights
    if (Math.abs(delta) > 0.7) {
      chessAnalogy = delta > 0 ? 
        "White is up a Rook - pressing for the win" :
        "Black is up a Rook - converting advantage";
      strategicInsight = "Strong directional edge. Press the advantage like a chess master converting material.";
    } else if (gamma > 0.7) {
      chessAnalogy = "Tactical fireworks! Every move creates threats.";
      strategicInsight = "High gamma = sharp position. One wrong move decides the game. Position for explosive moves.";
    } else if (theta > 0.8) {
      chessAnalogy = "Bullet chess! Clock is your enemy.";
      strategicInsight = "Extreme time decay. Act fast or time erodes your edge like a chess clock flagging.";
    } else if (vega > 0.7) {
      chessAnalogy = "Complex middlegame. Many pieces, many plans.";
      strategicInsight = "High complexity benefits those who thrive in chaos. Volatility is your friend.";
    } else {
      chessAnalogy = "Quiet positional maneuvering. Long-term plans matter.";
      strategicInsight = "Low volatility environment. Focus on structure and patience like a classical game.";
    }
    
    return {
      chessAnalogy,
      strategicInsight,
      timeControlEquivalent: chess.timeControl,
    };
  }
  
  /**
   * Get historical analysis statistics
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    averageConfidenceBoost: number;
    strategyDistribution: Record<string, number>;
  } {
    if (this.analysisHistory.length === 0) {
      return { totalAnalyses: 0, averageConfidenceBoost: 0, strategyDistribution: {} };
    }
    
    const avgBoost = this.analysisHistory.reduce((sum, m) => sum + m.confidenceBoost, 0) / this.analysisHistory.length;
    
    const strategyDist: Record<string, number> = {};
    for (const mapping of this.analysisHistory) {
      const strat = mapping.optionsImplication.preferredStrategy;
      strategyDist[strat] = (strategyDist[strat] || 0) + 1;
    }
    
    return {
      totalAnalyses: this.analysisHistory.length,
      averageConfidenceBoost: avgBoost,
      strategyDistribution: strategyDist,
    };
  }
}

export const greeksChessAdapter = new GreeksChessAdapter();
console.log('[v1.0-GREEKS-CHESS] Options Greeks ↔ Chess Constraints Adapter LOADED');
