/**
 * Actionable Intelligence Engine
 * 
 * Transforms pattern classifications into specific, high-value action recommendations.
 * Addresses the "So What?" test - every insight must lead to a concrete action.
 */

import { DomainType, DomainSignature } from './domains/universal/types';

export interface ActionableInsight {
  id: string;
  domain: DomainType;
  archetype: string;
  
  // The "So What?" answer
  headline: string;
  action: string;
  urgency: 'immediate' | 'soon' | 'consider';
  confidence: number;
  
  // Specifics
  expectedOutcome: string;
  timeframe: string;
  risk: 'low' | 'medium' | 'high';
  
  // Evidence
  patternBasis: string;
  historicalAccuracy?: number;
}

export interface DomainActionMap {
  chess: ChessAction[];
  code: CodeAction[];
  market: MarketAction[];
}

interface ChessAction {
  archetype: string;
  action: string;
  whenToApply: string;
  expectedResult: string;
}

interface CodeAction {
  archetype: string;
  action: string;
  files: string[];
  priority: number;
}

interface MarketAction {
  archetype: string;
  position: 'long' | 'short' | 'neutral';
  entryCondition: string;
  exitCondition: string;
}

/**
 * Chess archetype → specific strategic actions
 */
const CHESS_ACTIONABLE_MAP: Record<string, { action: string; expectedOutcome: string; timeframe: string }> = {
  aggressive_attacker: {
    action: 'Look for forcing moves: checks, captures, and threats. Prioritize king-side attack.',
    expectedOutcome: 'Create immediate pressure leading to material or positional advantage',
    timeframe: 'Next 3-5 moves',
  },
  positional_strategist: {
    action: 'Control key squares (d4/d5/e4/e5). Improve worst-placed piece. Avoid premature attacks.',
    expectedOutcome: 'Gradual space advantage and piece coordination',
    timeframe: 'Next 8-15 moves',
  },
  tactical_opportunist: {
    action: 'Calculate all captures and checks. Look for hanging pieces and tactical patterns.',
    expectedOutcome: 'Material gain or winning attack',
    timeframe: 'Next 2-4 moves',
  },
  queenside_expansion: {
    action: 'Push queenside pawns (a4, b4, c4/c5). Open the a and b files. Target enemy queenside weaknesses.',
    expectedOutcome: 'Create passed pawn or win queenside material',
    timeframe: 'Next 10-20 moves',
  },
  pawn_storm: {
    action: 'Advance pawns toward enemy king. Create hooks (h4-h5-h6 or similar). Open lines.',
    expectedOutcome: 'Breach enemy king safety',
    timeframe: 'Next 5-10 moves',
  },
  central_domination: {
    action: 'Occupy e4/d4 (or e5/d5) with pieces. Control central files with rooks.',
    expectedOutcome: 'Piece mobility advantage, easier defense',
    timeframe: 'Next 5-8 moves',
  },
  flank_attack: {
    action: 'Attack on the wing opposite to where opponent is castled. Use fianchetto bishops.',
    expectedOutcome: 'Catch opponent off-guard, create asymmetric pressure',
    timeframe: 'Next 8-12 moves',
  },
  closed_maneuvering: {
    action: 'Improve piece placement without opening the position. Wait for opponent errors.',
    expectedOutcome: 'Slow squeeze, eventual breakthrough',
    timeframe: 'Next 15-25 moves',
  },
  defensive_fortress: {
    action: 'Consolidate king safety. Exchange attacking pieces. Create impenetrable structure.',
    expectedOutcome: 'Draw or slow counterattack',
    timeframe: 'Endgame transition',
  },
  endgame_technique: {
    action: 'Activate king. Create passed pawns. Calculate precisely - every tempo matters.',
    expectedOutcome: 'Convert advantage or hold draw',
    timeframe: 'Final 10-30 moves',
  },
};

/**
 * Code archetype → specific development actions
 */
const CODE_ACTIONABLE_MAP: Record<string, { action: string; expectedOutcome: string; priority: string }> = {
  core_fortress: {
    action: 'Expand successful patterns to edge modules. Document core abstractions for team adoption.',
    expectedOutcome: 'Consistent architecture across codebase',
    priority: 'This sprint',
  },
  rapid_expansion: {
    action: 'STOP adding features. Schedule a 2-day refactoring sprint. Add linting and quality gates.',
    expectedOutcome: 'Reduced tech debt, sustainable velocity',
    priority: 'Immediate',
  },
  pattern_master: {
    action: 'Create internal pattern library. Consider open-sourcing generic utilities.',
    expectedOutcome: 'Reusable assets, industry recognition',
    priority: 'This quarter',
  },
  monolith_giant: {
    action: 'Identify 3 modules with clearest boundaries. Create strangler fig pattern for gradual extraction.',
    expectedOutcome: 'Modular architecture, reduced coupling',
    priority: 'Immediate',
  },
  technical_debt: {
    action: 'Run static analysis. Fix ALL critical issues before any new feature work.',
    expectedOutcome: 'Stability and developer confidence',
    priority: 'Blocker - do first',
  },
  emerging_startup: {
    action: 'Establish coding conventions NOW. Create architecture decision records for key choices.',
    expectedOutcome: 'Scalable foundation as team grows',
    priority: 'This week',
  },
};

/**
 * Market signature → specific trading actions
 */
const MARKET_ACTIONABLE_MAP: Record<string, { position: string; entry: string; exit: string; risk: string }> = {
  bullish_momentum: {
    position: 'LONG',
    entry: 'Enter on pullback to 20-day moving average',
    exit: 'Trail stop at 2x ATR below price',
    risk: 'Position size: 2% of portfolio',
  },
  bearish_reversal: {
    position: 'SHORT or EXIT LONG',
    entry: 'Short on break below recent support',
    exit: 'Cover at previous major low or -10%',
    risk: 'Reduce position size by 50%',
  },
  high_volatility: {
    position: 'REDUCE EXPOSURE',
    entry: 'Wait for VIX to normalize (<20)',
    exit: 'Tight stops, take profits quickly',
    risk: 'Maximum 1% position sizes',
  },
  accumulation: {
    position: 'SCALE IN LONG',
    entry: 'Buy 25% now, 25% on each subsequent dip',
    exit: 'Hold for trend confirmation',
    risk: 'Normal position sizing',
  },
  distribution: {
    position: 'SCALE OUT',
    entry: 'Do not add',
    exit: 'Sell 25% on each rally',
    risk: 'Protect gains',
  },
};

/**
 * Generate actionable insights from a domain signature
 */
export function generateActionableInsights(
  signature: DomainSignature,
  archetype: string
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  const domain = signature.domain;
  
  if (domain === 'chess') {
    const chessAction = CHESS_ACTIONABLE_MAP[archetype] || CHESS_ACTIONABLE_MAP['positional_strategist'];
    insights.push({
      id: `chess-${archetype}-${Date.now()}`,
      domain: 'chess',
      archetype,
      headline: `Your position suggests: ${archetype.replace(/_/g, ' ')}`,
      action: chessAction.action,
      urgency: signature.intensity > 0.7 ? 'immediate' : 'soon',
      confidence: signature.intensity,
      expectedOutcome: chessAction.expectedOutcome,
      timeframe: chessAction.timeframe,
      risk: signature.volatility > 0.6 ? 'high' : signature.volatility > 0.3 ? 'medium' : 'low',
      patternBasis: `Based on quadrant profile: ${JSON.stringify(signature.quadrantProfile)}`,
    });
  }
  
  if (domain === 'code') {
    const codeAction = CODE_ACTIONABLE_MAP[archetype] || CODE_ACTIONABLE_MAP['core_fortress'];
    insights.push({
      id: `code-${archetype}-${Date.now()}`,
      domain: 'code',
      archetype,
      headline: `Codebase archetype: ${archetype.replace(/_/g, ' ')}`,
      action: codeAction.action,
      urgency: codeAction.priority.includes('Immediate') ? 'immediate' : 'soon',
      confidence: signature.intensity,
      expectedOutcome: codeAction.expectedOutcome,
      timeframe: codeAction.priority,
      risk: archetype === 'technical_debt' || archetype === 'monolith_giant' ? 'high' : 'medium',
      patternBasis: `Detected from temporal flow: early=${signature.temporalFlow.early.toFixed(2)}, mid=${signature.temporalFlow.mid.toFixed(2)}, late=${signature.temporalFlow.late.toFixed(2)}`,
    });
  }
  
  if (domain === 'market') {
    // Determine market archetype from signature
    const marketArchetype = signature.momentum > 0.3 ? 'bullish_momentum' 
      : signature.momentum < -0.3 ? 'bearish_reversal'
      : signature.volatility > 0.6 ? 'high_volatility'
      : signature.temporalFlow.late > signature.temporalFlow.early ? 'accumulation'
      : 'distribution';
    
    const marketAction = MARKET_ACTIONABLE_MAP[marketArchetype];
    insights.push({
      id: `market-${marketArchetype}-${Date.now()}`,
      domain: 'market',
      archetype: marketArchetype,
      headline: `Market signature: ${marketArchetype.replace(/_/g, ' ')}`,
      action: `${marketAction.position}: ${marketAction.entry}`,
      urgency: marketArchetype === 'high_volatility' ? 'immediate' : 'consider',
      confidence: Math.abs(signature.momentum) * 100,
      expectedOutcome: marketAction.exit,
      timeframe: 'Next trading session',
      risk: marketAction.risk.includes('1%') || marketAction.risk.includes('Reduce') ? 'high' : 'medium',
      patternBasis: `Momentum: ${signature.momentum.toFixed(2)}, Volatility: ${signature.volatility.toFixed(2)}`,
    });
  }
  
  return insights;
}

/**
 * Generate cross-domain "Black Swan" discovery alerts
 */
export function detectBlackSwanCorrelations(
  signatures: DomainSignature[]
): { discovery: string; domains: DomainType[]; significance: number }[] {
  const discoveries: { discovery: string; domains: DomainType[]; significance: number }[] = [];
  
  // Look for unusual correlations between domains
  for (let i = 0; i < signatures.length; i++) {
    for (let j = i + 1; j < signatures.length; j++) {
      const sig1 = signatures[i];
      const sig2 = signatures[j];
      
      // Check for similar quadrant profiles across different domains
      const profileSimilarity = calculateProfileSimilarity(sig1.quadrantProfile, sig2.quadrantProfile);
      
      if (profileSimilarity > 0.85) {
        discoveries.push({
          discovery: `Unusual pattern match: ${sig1.domain} and ${sig2.domain} show ${(profileSimilarity * 100).toFixed(0)}% quadrant profile similarity`,
          domains: [sig1.domain, sig2.domain],
          significance: profileSimilarity,
        });
      }
      
      // Check for opposing momentum (potential arbitrage)
      if (Math.abs(sig1.momentum - sig2.momentum) > 0.6) {
        discoveries.push({
          discovery: `Momentum divergence detected: ${sig1.domain} (${sig1.momentum > 0 ? '+' : ''}${sig1.momentum.toFixed(2)}) vs ${sig2.domain} (${sig2.momentum > 0 ? '+' : ''}${sig2.momentum.toFixed(2)})`,
          domains: [sig1.domain, sig2.domain],
          significance: Math.abs(sig1.momentum - sig2.momentum),
        });
      }
    }
  }
  
  return discoveries.sort((a, b) => b.significance - a.significance);
}

function calculateProfileSimilarity(
  profile1: { aggressive: number; defensive: number; tactical: number; strategic: number },
  profile2: { aggressive: number; defensive: number; tactical: number; strategic: number }
): number {
  const diff = Math.abs(profile1.aggressive - profile2.aggressive) +
               Math.abs(profile1.defensive - profile2.defensive) +
               Math.abs(profile1.tactical - profile2.tactical) +
               Math.abs(profile1.strategic - profile2.strategic);
  
  return 1 - (diff / 4); // Normalized to 0-1
}
