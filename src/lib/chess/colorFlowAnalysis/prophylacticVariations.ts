/**
 * Prophylactic Defense Archetype Variations
 * 
 * En Pensent™ Deep Pattern Analysis
 * 
 * Prophylaxis in chess (from Greek: προφύλαξις - "guarding beforehand")
 * is the art of anticipating and neutralizing opponent threats before they materialize.
 * 
 * This module identifies 12 distinct prophylactic sub-archetypes based on:
 * - Defensive topology (where prevention occurs)
 * - Temporal rhythm (when prevention triggers)
 * - Strategic intent (why prevention was chosen)
 */

import { QuadrantProfile, TemporalFlow, CriticalMoment } from './types';

// ===================== PROPHYLACTIC SUB-ARCHETYPES =====================

export type ProphylacticVariation =
  | 'petrosian_overprotection'    // Key square fortification beyond necessity
  | 'karpov_stranglehold'         // Slow positional asphyxiation 
  | 'nimzowitsch_restraint'       // Blockade of pawn advances
  | 'tigran_pivot'                // Central piece repositioning for defense
  | 'hedgehog_coil'               // Compact structure ready to spring
  | 'berlin_wall'                 // Solid endgame fortress
  | 'fortress_construction'       // Impregnable defensive setup
  | 'prophylactic_exchange'       // Trades to eliminate threats
  | 'waiting_move_mastery'        // Zugzwang induction through patience
  | 'elastic_defense'             // Flexible retreat then counterattack
  | 'pressure_absorption'         // Absorbing initiative without breaking
  | 'prophylactic_unknown';

export interface ProphylacticVariationDefinition {
  id: ProphylacticVariation;
  name: string;
  description: string;
  historicalPractitioners: string[];
  colorFlowSignature: string;
  winRate: number;
  drawRate: number;
  counterplayTiming: 'early' | 'middle' | 'late' | 'never';
  riskLevel: 'minimal' | 'low' | 'moderate';
  marketAnalogy: string;
}

// ===================== VARIATION DEFINITIONS =====================

export const PROPHYLACTIC_VARIATIONS: Record<ProphylacticVariation, ProphylacticVariationDefinition> = {
  petrosian_overprotection: {
    id: 'petrosian_overprotection',
    name: 'Petrosian Overprotection',
    description: 'Defending key squares with more pieces than seemingly necessary, creating a web of mutual protection that makes breakthroughs impossible',
    historicalPractitioners: ['Tigran Petrosian', 'Ulf Andersson', 'Anatoly Karpov'],
    colorFlowSignature: 'Dense overlapping colors on central squares, multiple piece visits to same squares',
    winRate: 0.42,
    drawRate: 0.45,
    counterplayTiming: 'middle',
    riskLevel: 'minimal',
    marketAnalogy: 'Diversified defensive portfolio with multiple hedges on same position',
  },
  
  karpov_stranglehold: {
    id: 'karpov_stranglehold',
    name: 'Karpov Stranglehold',
    description: 'Gradual space restriction that slowly suffocates opponent options without dramatic action',
    historicalPractitioners: ['Anatoly Karpov', 'Magnus Carlsen', 'Fabiano Caruana'],
    colorFlowSignature: 'Progressive color expansion with decreasing opponent territory per move',
    winRate: 0.55,
    drawRate: 0.35,
    counterplayTiming: 'late',
    riskLevel: 'low',
    marketAnalogy: 'Slow accumulation strategy that gradually corners competitors',
  },
  
  nimzowitsch_restraint: {
    id: 'nimzowitsch_restraint',
    name: 'Nimzowitsch Restraint',
    description: 'Active prevention of opponent pawn advances, controlling key squares to freeze their structure',
    historicalPractitioners: ['Aron Nimzowitsch', 'Richard Réti', 'Bent Larsen'],
    colorFlowSignature: 'Knight/Bishop colors blocking pawn advance paths, static structure',
    winRate: 0.48,
    drawRate: 0.40,
    counterplayTiming: 'middle',
    riskLevel: 'low',
    marketAnalogy: 'Regulatory capture - blocking competitor expansion paths',
  },
  
  tigran_pivot: {
    id: 'tigran_pivot',
    name: 'Tigran Pivot',
    description: 'Repositioning pieces from one flank to another to meet emerging threats, like a goalkeeper shifting',
    historicalPractitioners: ['Tigran Petrosian', 'Vladimir Kramnik', 'Levon Aronian'],
    colorFlowSignature: 'Sudden color shift from one quadrant to opposite, defensive repositioning',
    winRate: 0.45,
    drawRate: 0.42,
    counterplayTiming: 'early',
    riskLevel: 'moderate',
    marketAnalogy: 'Sector rotation in response to changing market conditions',
  },
  
  hedgehog_coil: {
    id: 'hedgehog_coil',
    name: 'Hedgehog Coil',
    description: 'Compact defensive structure (pawns on 6th rank) that appears passive but coils for counterattack',
    historicalPractitioners: ['Ulf Andersson', 'Ljubomir Ljubojević', 'Yasser Seirawan'],
    colorFlowSignature: 'High density colors on ranks 6-7, sudden burst patterns',
    winRate: 0.51,
    drawRate: 0.38,
    counterplayTiming: 'late',
    riskLevel: 'moderate',
    marketAnalogy: 'Defensive consolidation before aggressive breakout',
  },
  
  berlin_wall: {
    id: 'berlin_wall',
    name: 'Berlin Wall',
    description: 'Accepting early simplification to reach an endgame fortress, trading complexity for safety',
    historicalPractitioners: ['Vladimir Kramnik', 'Fabiano Caruana', 'Anish Giri'],
    colorFlowSignature: 'Low volatility, sparse colors, early queen exchange signature',
    winRate: 0.38,
    drawRate: 0.52,
    counterplayTiming: 'never',
    riskLevel: 'minimal',
    marketAnalogy: 'Flight to quality - defensive reallocation to safety assets',
  },
  
  fortress_construction: {
    id: 'fortress_construction',
    name: 'Fortress Construction',
    description: 'Building an impregnable position that cannot be breached even with material deficit',
    historicalPractitioners: ['Tigran Petrosian', 'Sergey Karjakin', 'Ian Nepomniachtchi'],
    colorFlowSignature: 'Concentrated colors in defensive perimeter, minimal central presence',
    winRate: 0.35,
    drawRate: 0.58,
    counterplayTiming: 'never',
    riskLevel: 'minimal',
    marketAnalogy: 'Capital preservation at all costs during crisis',
  },
  
  prophylactic_exchange: {
    id: 'prophylactic_exchange',
    name: 'Prophylactic Exchange',
    description: 'Strategic piece trades to eliminate opponent attacking potential before it develops',
    historicalPractitioners: ['Jose Capablanca', 'Anatoly Karpov', 'Magnus Carlsen'],
    colorFlowSignature: 'Decreasing piece density over time, targeted color elimination',
    winRate: 0.49,
    drawRate: 0.40,
    counterplayTiming: 'middle',
    riskLevel: 'low',
    marketAnalogy: 'Unwinding positions to reduce portfolio risk exposure',
  },
  
  waiting_move_mastery: {
    id: 'waiting_move_mastery',
    name: 'Waiting Move Mastery',
    description: 'Using tempo-neutral moves to pass the move, inducing opponent errors through zugzwang',
    historicalPractitioners: ['Tigran Petrosian', 'Anatoly Karpov', 'Ding Liren'],
    colorFlowSignature: 'Repetitive color patterns, minimal advance, high king safety',
    winRate: 0.44,
    drawRate: 0.46,
    counterplayTiming: 'late',
    riskLevel: 'minimal',
    marketAnalogy: 'Cash position waiting for optimal entry point',
  },
  
  elastic_defense: {
    id: 'elastic_defense',
    name: 'Elastic Defense',
    description: 'Strategic retreat under pressure, maintaining structure integrity while preparing counterattack',
    historicalPractitioners: ['Emanuel Lasker', 'Mikhail Tal', 'Maxime Vachier-Lagrave'],
    colorFlowSignature: 'Backward color flow followed by sudden forward surge',
    winRate: 0.52,
    drawRate: 0.32,
    counterplayTiming: 'early',
    riskLevel: 'moderate',
    marketAnalogy: 'Controlled drawdown before aggressive recovery trade',
  },
  
  pressure_absorption: {
    id: 'pressure_absorption',
    name: 'Pressure Absorption',
    description: 'Absorbing sustained attack without breaking, waiting for opponent overextension',
    historicalPractitioners: ['Viktor Korchnoi', 'Garry Kasparov', 'Magnus Carlsen'],
    colorFlowSignature: 'Stable defensive colors under high enemy intensity, gradual balance shift',
    winRate: 0.48,
    drawRate: 0.38,
    counterplayTiming: 'middle',
    riskLevel: 'moderate',
    marketAnalogy: 'Holding positions through volatility, buying the dip',
  },
  
  prophylactic_unknown: {
    id: 'prophylactic_unknown',
    name: 'Unclassified Prophylactic',
    description: 'Novel defensive approach that does not match known patterns',
    historicalPractitioners: [],
    colorFlowSignature: 'Anomalous defensive color distribution',
    winRate: 0.45,
    drawRate: 0.40,
    counterplayTiming: 'middle',
    riskLevel: 'moderate',
    marketAnalogy: 'Novel risk management approach',
  },
};

// ===================== VARIATION CLASSIFICATION =====================

export interface ProphylacticAnalysis {
  variation: ProphylacticVariation;
  confidence: number;
  matchingFactors: string[];
  suggestedPlay: string;
  riskAssessment: string;
}

/**
 * Classify a prophylactic defense game into its specific variation
 */
export function classifyProphylacticVariation(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): ProphylacticAnalysis {
  const scores: Map<ProphylacticVariation, { score: number; factors: string[] }> = new Map();
  
  // Initialize all variations
  for (const variation of Object.keys(PROPHYLACTIC_VARIATIONS) as ProphylacticVariation[]) {
    scores.set(variation, { score: 0, factors: [] });
  }
  
  // Calculate aggregate metrics
  const kingsideTotal = Math.abs(quadrant.kingsideWhite) + Math.abs(quadrant.kingsideBlack);
  const queensideTotal = Math.abs(quadrant.queensideWhite) + Math.abs(quadrant.queensideBlack);
  const totalActivity = kingsideTotal + queensideTotal + Math.abs(quadrant.center);
  const avgMomentMagnitude = moments.length > 0 
    ? moments.reduce((sum, m) => sum + m.shiftMagnitude, 0) / moments.length 
    : 0;
  const temporalProgression = temporal.endgame - temporal.opening;
  const balanceStability = 100 - temporal.volatility;
  
  // ========== Petrosian Overprotection ==========
  // High center activity, low volatility, multiple piece layers
  if (Math.abs(quadrant.center) > 30 && temporal.volatility < 25) {
    const entry = scores.get('petrosian_overprotection')!;
    entry.score += 25;
    entry.factors.push('Strong central overprotection');
  }
  if (balanceStability > 75 && totalMoves > 30) {
    const entry = scores.get('petrosian_overprotection')!;
    entry.score += 20;
    entry.factors.push('Sustained positional stability');
  }
  
  // ========== Karpov Stranglehold ==========
  // Gradual territorial expansion, low volatility, increasing control
  if (temporalProgression > 20 && temporal.volatility < 30) {
    const entry = scores.get('karpov_stranglehold')!;
    entry.score += 30;
    entry.factors.push('Progressive positional squeeze');
  }
  if (temporal.middlegame > temporal.opening && temporal.endgame > temporal.middlegame) {
    const entry = scores.get('karpov_stranglehold')!;
    entry.score += 20;
    entry.factors.push('Steadily increasing control');
  }
  
  // ========== Nimzowitsch Restraint ==========
  // Static structure, blocked pawn patterns, piece blockade
  if (temporal.volatility < 20 && totalActivity < 100) {
    const entry = scores.get('nimzowitsch_restraint')!;
    entry.score += 25;
    entry.factors.push('Blocked position structure');
  }
  if (moments.length <= 1 && totalMoves > 25) {
    const entry = scores.get('nimzowitsch_restraint')!;
    entry.score += 20;
    entry.factors.push('Minimal tactical incidents');
  }
  
  // ========== Tigran Pivot ==========
  // Sudden quadrant shift, defensive repositioning
  const quadrantShift = Math.abs(kingsideTotal - queensideTotal);
  if (quadrantShift > 40 && temporal.volatility > 25 && temporal.volatility < 45) {
    const entry = scores.get('tigran_pivot')!;
    entry.score += 30;
    entry.factors.push('Defensive piece transfer');
  }
  if (moments.some(m => m.shiftMagnitude > 4)) {
    const entry = scores.get('tigran_pivot')!;
    entry.score += 15;
    entry.factors.push('Reactive repositioning detected');
  }
  
  // ========== Hedgehog Coil ==========
  // Compact structure, late-game counterattack
  if (temporal.opening < 0 && temporal.endgame > 10) {
    const entry = scores.get('hedgehog_coil')!;
    entry.score += 25;
    entry.factors.push('Early concession, late expansion');
  }
  if (totalActivity < 120 && totalMoves > 30 && moments.length >= 2) {
    const entry = scores.get('hedgehog_coil')!;
    entry.score += 20;
    entry.factors.push('Coiled defensive setup');
  }
  
  // ========== Berlin Wall ==========
  // Early simplification, endgame-focused, very low volatility
  if (temporal.volatility < 15 && totalMoves > 25) {
    const entry = scores.get('berlin_wall')!;
    entry.score += 30;
    entry.factors.push('Ultra-solid simplification');
  }
  if (totalActivity < 80 && moments.length === 0) {
    const entry = scores.get('berlin_wall')!;
    entry.score += 25;
    entry.factors.push('Drawish endgame structure');
  }
  
  // ========== Fortress Construction ==========
  // Minimal territory, defensive perimeter, material flexibility
  if (totalActivity < 60 && balanceStability > 80) {
    const entry = scores.get('fortress_construction')!;
    entry.score += 35;
    entry.factors.push('Impregnable defensive setup');
  }
  if (temporal.endgame < temporal.middlegame && totalMoves > 40) {
    const entry = scores.get('fortress_construction')!;
    entry.score += 20;
    entry.factors.push('Late-game contraction');
  }
  
  // ========== Prophylactic Exchange ==========
  // Decreasing activity, targeted piece elimination
  if (temporal.endgame < temporal.opening && temporal.volatility < 30) {
    const entry = scores.get('prophylactic_exchange')!;
    entry.score += 25;
    entry.factors.push('Piece density reduction');
  }
  if (totalActivity < 100 && moments.length <= 2) {
    const entry = scores.get('prophylactic_exchange')!;
    entry.score += 15;
    entry.factors.push('Controlled simplification');
  }
  
  // ========== Waiting Move Mastery ==========
  // Minimal progress, repetitive patterns, zugzwang induction
  if (temporal.volatility < 12 && balanceStability > 85) {
    const entry = scores.get('waiting_move_mastery')!;
    entry.score += 30;
    entry.factors.push('Patience-based play');
  }
  if (moments.length === 0 && totalMoves > 35) {
    const entry = scores.get('waiting_move_mastery')!;
    entry.score += 25;
    entry.factors.push('Zugzwang cultivation');
  }
  
  // ========== Elastic Defense ==========
  // Initial retreat, subsequent counterattack
  if (temporal.opening < -15 && temporal.middlegame > 0) {
    const entry = scores.get('elastic_defense')!;
    entry.score += 30;
    entry.factors.push('Retreat and spring pattern');
  }
  if (avgMomentMagnitude > 3 && moments.length >= 2) {
    const entry = scores.get('elastic_defense')!;
    entry.score += 20;
    entry.factors.push('Counterattack rhythm');
  }
  
  // ========== Pressure Absorption ==========
  // Sustained enemy pressure, gradual neutralization
  if (temporal.opening < 0 && temporal.middlegame < 0 && temporal.endgame > -10) {
    const entry = scores.get('pressure_absorption')!;
    entry.score += 25;
    entry.factors.push('Attack absorption');
  }
  if (moments.length >= 3 && avgMomentMagnitude < 4) {
    const entry = scores.get('pressure_absorption')!;
    entry.score += 20;
    entry.factors.push('Weathering the storm');
  }
  
  // Find best match
  let bestVariation: ProphylacticVariation = 'prophylactic_unknown';
  let bestScore = 0;
  let bestFactors: string[] = [];
  
  for (const [variation, data] of scores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestVariation = variation;
      bestFactors = data.factors;
    }
  }
  
  // Calculate confidence
  const confidence = Math.min(95, Math.max(30, bestScore));
  
  // Get variation definition
  const definition = PROPHYLACTIC_VARIATIONS[bestVariation];
  
  return {
    variation: bestVariation,
    confidence,
    matchingFactors: bestFactors.length > 0 ? bestFactors : ['General prophylactic pattern'],
    suggestedPlay: getSuggestedPlay(bestVariation, temporal, totalMoves),
    riskAssessment: getRiskAssessment(definition, confidence),
  };
}

/**
 * Generate play suggestions based on variation type
 */
function getSuggestedPlay(
  variation: ProphylacticVariation,
  temporal: TemporalFlow,
  totalMoves: number
): string {
  const suggestions: Record<ProphylacticVariation, string> = {
    petrosian_overprotection: 'Maintain piece coordination; avoid premature pawn breaks',
    karpov_stranglehold: 'Continue gradual restriction; probe for weaknesses',
    nimzowitsch_restraint: 'Keep blockade intact; prepare piece regrouping',
    tigran_pivot: 'Complete defensive reorganization; stabilize before counterplay',
    hedgehog_coil: 'Wait for overextension; strike with ...d5 or ...b5 break',
    berlin_wall: 'Simplify further; exploit endgame technique',
    fortress_construction: 'Maintain fortress integrity; avoid pawn weaknesses',
    prophylactic_exchange: 'Seek favorable exchanges; reduce attacking pieces',
    waiting_move_mastery: 'Play useful waiting moves; induce zugzwang',
    elastic_defense: 'Complete retreat; prepare counterattack timing',
    pressure_absorption: 'Stay resilient; opponent will overextend',
    prophylactic_unknown: 'Maintain flexibility; adapt to emerging patterns',
  };
  
  return suggestions[variation];
}

/**
 * Assess risk based on variation and confidence
 */
function getRiskAssessment(
  definition: ProphylacticVariationDefinition,
  confidence: number
): string {
  const baseRisk = definition.riskLevel;
  const drawTendency = definition.drawRate > 0.45 ? 'High draw tendency. ' : '';
  const counterplayNote = definition.counterplayTiming === 'never' 
    ? 'No counterplay expected. ' 
    : `Counterplay window: ${definition.counterplayTiming} game. `;
  
  const confidenceNote = confidence > 70 
    ? 'Pattern clearly established.' 
    : confidence > 50 
    ? 'Pattern developing.' 
    : 'Pattern uncertain.';
  
  return `${baseRisk.charAt(0).toUpperCase() + baseRisk.slice(1)} risk. ${drawTendency}${counterplayNote}${confidenceNote}`;
}

/**
 * Get market trading recommendations based on prophylactic variation
 */
export function getProphylacticTradingSignal(
  analysis: ProphylacticAnalysis
): {
  action: 'hold' | 'accumulate' | 'hedge' | 'reduce';
  rationale: string;
  timeframe: string;
} {
  const variation = PROPHYLACTIC_VARIATIONS[analysis.variation];
  
  // Map chess prophylaxis to trading actions
  const tradingMap: Record<ProphylacticVariation, { action: 'hold' | 'accumulate' | 'hedge' | 'reduce'; timeframe: string }> = {
    petrosian_overprotection: { action: 'hedge', timeframe: 'medium-term' },
    karpov_stranglehold: { action: 'accumulate', timeframe: 'long-term' },
    nimzowitsch_restraint: { action: 'hold', timeframe: 'medium-term' },
    tigran_pivot: { action: 'reduce', timeframe: 'short-term' },
    hedgehog_coil: { action: 'accumulate', timeframe: 'long-term' },
    berlin_wall: { action: 'hold', timeframe: 'long-term' },
    fortress_construction: { action: 'hold', timeframe: 'indefinite' },
    prophylactic_exchange: { action: 'reduce', timeframe: 'medium-term' },
    waiting_move_mastery: { action: 'hold', timeframe: 'variable' },
    elastic_defense: { action: 'accumulate', timeframe: 'short-term' },
    pressure_absorption: { action: 'hold', timeframe: 'medium-term' },
    prophylactic_unknown: { action: 'hold', timeframe: 'variable' },
  };
  
  const mapping = tradingMap[analysis.variation];
  
  return {
    action: mapping.action,
    rationale: variation.marketAnalogy,
    timeframe: mapping.timeframe,
  };
}
