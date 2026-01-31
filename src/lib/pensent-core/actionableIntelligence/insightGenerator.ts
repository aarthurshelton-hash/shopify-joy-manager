/**
 * Insight Generator
 * Generates actionable insights from domain signatures
 */

import type { DomainSignature, DomainType } from '../domains/universal/types';
import type { ActionableInsight } from './types';
import { CHESS_ACTIONABLE_MAP } from './chessActions';
import { CODE_ACTIONABLE_MAP } from './codeActions';
import { MARKET_ACTIONABLE_MAP } from './marketActions';

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
      timeframe: chessAction.timeframe || 'Next 5-10 moves',
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
      urgency: codeAction.priority?.includes('Immediate') ? 'immediate' : 'soon',
      confidence: signature.intensity,
      expectedOutcome: codeAction.expectedOutcome,
      timeframe: codeAction.priority || 'This sprint',
      risk: archetype === 'technical_debt' || archetype === 'monolith_giant' ? 'high' : 'medium',
      patternBasis: `Detected from temporal flow: early=${signature.temporalFlow.early.toFixed(2)}, mid=${signature.temporalFlow.mid.toFixed(2)}, late=${signature.temporalFlow.late.toFixed(2)}`,
    });
  }
  
  if (domain === 'market') {
    const marketArchetype = determineMarketArchetype(signature);
    const marketAction = MARKET_ACTIONABLE_MAP[marketArchetype];
    
    insights.push({
      id: `market-${marketArchetype}-${Date.now()}`,
      domain: 'market',
      archetype: marketArchetype,
      headline: `Market signature: ${marketArchetype.replace(/_/g, ' ')}`,
      action: `${marketAction.position}: ${marketAction.entry}`,
      urgency: marketArchetype === 'high_volatility' ? 'immediate' : 'consider',
      confidence: Math.abs(signature.momentum) * 100,
      expectedOutcome: marketAction.exit || marketAction.expectedOutcome,
      timeframe: 'Next trading session',
      risk: marketAction.risk?.includes('1%') || marketAction.risk?.includes('Reduce') ? 'high' : 'medium',
      patternBasis: `Momentum: ${signature.momentum.toFixed(2)}, Volatility: ${signature.volatility.toFixed(2)}`,
    });
  }
  
  return insights;
}

/**
 * Determine market archetype from signature
 */
function determineMarketArchetype(signature: DomainSignature): string {
  if (signature.momentum > 0.3) return 'bullish_momentum';
  if (signature.momentum < -0.3) return 'bearish_reversal';
  if (signature.volatility > 0.6) return 'high_volatility';
  if (signature.temporalFlow.late > signature.temporalFlow.early) return 'accumulation';
  return 'distribution';
}
