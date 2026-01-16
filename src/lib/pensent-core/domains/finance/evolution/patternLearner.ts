/**
 * Pattern Learner - Discovers and manages learned patterns
 */

import { LearnedPattern, PatternCondition, PredictionOutcome } from './types';

const MAX_PATTERNS = 100;

export function createPatternId(conditions: { correlationStrength: number; volatility: number; momentum: number }): string {
  const c = Math.round(conditions.correlationStrength * 10);
  const v = Math.round(conditions.volatility * 10);
  const m = Math.round(conditions.momentum * 10);
  return `C${c}V${v}M${m}`;
}

export function generatePatternName(conditions: { correlationStrength: number; volatility: number; momentum: number }): string {
  const corrDesc = conditions.correlationStrength > 0.7 ? 'High-Corr' : 
                   conditions.correlationStrength > 0.4 ? 'Mid-Corr' : 'Low-Corr';
  const volDesc = conditions.volatility > 0.7 ? 'High-Vol' : 
                  conditions.volatility > 0.4 ? 'Mid-Vol' : 'Low-Vol';
  const momDesc = conditions.momentum > 0.3 ? 'Bullish-Mom' : 
                  conditions.momentum < -0.3 ? 'Bearish-Mom' : 'Neutral-Mom';
  
  return `${corrDesc} ${volDesc} ${momDesc}`;
}

export function extractConditions(conditions: { correlationStrength: number; volatility: number; momentum: number }): PatternCondition[] {
  return [
    { market: 'cross', indicator: 'correlation_shift', operator: 'between', value: [conditions.correlationStrength - 0.1, conditions.correlationStrength + 0.1] },
    { market: 'cross', indicator: 'volatility', operator: 'between', value: [conditions.volatility - 0.1, conditions.volatility + 0.1] },
    { market: 'cross', indicator: 'price_change', operator: conditions.momentum > 0 ? '>' : '<', value: 0 }
  ];
}

export function learnFromOutcome(
  patternLibrary: LearnedPattern[],
  prediction: PredictionOutcome,
  wasCorrect: boolean,
  decayRate: number
): LearnedPattern[] {
  const patternId = createPatternId(prediction.marketConditions);
  const existingIndex = patternLibrary.findIndex(p => p.id === patternId);
  
  const newLibrary = [...patternLibrary];
  
  if (existingIndex !== -1) {
    const existing = { ...newLibrary[existingIndex] };
    existing.occurrences++;
    existing.successRate = 
      (existing.successRate * (existing.occurrences - 1) + (wasCorrect ? 1 : 0)) 
      / existing.occurrences;
    existing.lastSeen = Date.now();
    existing.confidence = Math.min(0.95, 
      existing.successRate * Math.min(1, existing.occurrences / 50)
    );
    newLibrary[existingIndex] = existing;
  } else if (patternLibrary.length < MAX_PATTERNS) {
    newLibrary.push({
      id: patternId,
      name: generatePatternName(prediction.marketConditions),
      conditions: extractConditions(prediction.marketConditions),
      predictedOutcome: prediction.predicted === 'up' ? 'bullish' : 
                        prediction.predicted === 'down' ? 'bearish' : 'neutral',
      confidence: 0.5,
      occurrences: 1,
      successRate: wasCorrect ? 1 : 0,
      discoveredAt: Date.now(),
      lastSeen: Date.now()
    });
  }
  
  // Decay and filter old patterns
  return newLibrary
    .map(p => ({ ...p, confidence: p.confidence * decayRate }))
    .filter(p => p.confidence > 0.1 || Date.now() - p.lastSeen < 3600000);
}

export function getBestPatterns(patternLibrary: LearnedPattern[], limit: number = 5): LearnedPattern[] {
  return [...patternLibrary]
    .filter(p => p.occurrences >= 5)
    .sort((a, b) => b.successRate * b.confidence - a.successRate * a.confidence)
    .slice(0, limit);
}
