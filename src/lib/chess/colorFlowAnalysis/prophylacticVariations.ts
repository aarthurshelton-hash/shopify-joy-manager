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
  // v7.80: Enhanced sub-archetype data
  secondaryVariation?: ProphylacticVariation;
  secondaryConfidence?: number;
  phaseSpecificStrength: 'opening' | 'middlegame' | 'endgame';
  defensiveTopology: 'central' | 'flank' | 'distributed' | 'contracted';
  temporalRhythm: 'proactive' | 'reactive' | 'static' | 'elastic';
  tradingSignal: 'hold' | 'accumulate' | 'hedge' | 'reduce' | 'wait';
}

/**
 * v7.80-PROPHYLACTIC-SPEC: Enhanced Prophylactic Variation Classifier
 * 
 * Classification now uses:
 * - Weighted multi-factor scoring with phase awareness
 * - Defensive topology detection (where prevention occurs)
 * - Temporal rhythm analysis (proactive vs reactive)
 * - Secondary variation detection for hybrid patterns
 * - Market signal generation for cross-domain intelligence
 */
export function classifyProphylacticVariation(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): ProphylacticAnalysis {
  // ========== ADVANCED METRIC CALCULATION ==========
  const metrics = calculateAdvancedMetrics(quadrant, temporal, moments, totalMoves);
  
  // ========== WEIGHTED SCORING ENGINE ==========
  const scores = runWeightedScoringEngine(metrics, temporal, moments, totalMoves);
  
  // ========== DETERMINE TOP VARIATIONS ==========
  const sortedVariations = Array.from(scores.entries())
    .sort((a, b) => b[1].score - a[1].score);
  
  const [primaryVariation, primaryData] = sortedVariations[0];
  const [secondaryVariation, secondaryData] = sortedVariations[1] || ['prophylactic_unknown', { score: 0, factors: [] }];
  
  // Calculate normalized confidence
  const totalScore = sortedVariations.reduce((sum, [_, d]) => sum + d.score, 0);
  const primaryConfidence = Math.min(95, Math.max(30, 
    totalScore > 0 ? (primaryData.score / totalScore) * 100 + primaryData.score * 0.3 : 30
  ));
  const secondaryConfidence = Math.min(85, Math.max(0,
    totalScore > 0 ? (secondaryData.score / totalScore) * 100 + secondaryData.score * 0.2 : 0
  ));
  
  // ========== TOPOLOGY & RHYTHM DETECTION ==========
  const defensiveTopology = detectDefensiveTopology(quadrant, metrics);
  const temporalRhythm = detectTemporalRhythm(temporal, moments);
  const phaseSpecificStrength = detectPhaseStrength(temporal, metrics);
  
  // ========== TRADING SIGNAL GENERATION ==========
  const tradingSignal = generateTradingSignal(primaryVariation, primaryConfidence, temporalRhythm);
  
  const definition = PROPHYLACTIC_VARIATIONS[primaryVariation];
  
  console.log(`[Prophylactic v7.80] Primary: ${primaryVariation} (${primaryConfidence.toFixed(1)}%), Secondary: ${secondaryVariation} (${secondaryConfidence.toFixed(1)}%)`);
  console.log(`[Prophylactic v7.80] Topology: ${defensiveTopology}, Rhythm: ${temporalRhythm}, Phase: ${phaseSpecificStrength}`);
  
  return {
    variation: primaryVariation,
    confidence: Math.round(primaryConfidence),
    matchingFactors: primaryData.factors.length > 0 ? primaryData.factors : ['General prophylactic pattern'],
    suggestedPlay: getSuggestedPlay(primaryVariation, temporal, totalMoves),
    riskAssessment: getRiskAssessment(definition, primaryConfidence),
    // v7.80 Enhanced fields
    secondaryVariation: secondaryConfidence > 25 ? secondaryVariation : undefined,
    secondaryConfidence: secondaryConfidence > 25 ? Math.round(secondaryConfidence) : undefined,
    phaseSpecificStrength,
    defensiveTopology,
    temporalRhythm,
    tradingSignal,
  };
}

// ===================== ADVANCED METRICS ENGINE =====================

interface AdvancedMetrics {
  kingsideTotal: number;
  queensideTotal: number;
  totalActivity: number;
  avgMomentMagnitude: number;
  temporalProgression: number;
  balanceStability: number;
  quadrantShift: number;
  centerDominance: number;
  compressionRatio: number;
  counterattackPotential: number;
  structuralRigidity: number;
  gamePhase: 'opening' | 'middlegame' | 'endgame';
}

function calculateAdvancedMetrics(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): AdvancedMetrics {
  const kingsideTotal = Math.abs(quadrant.kingsideWhite) + Math.abs(quadrant.kingsideBlack);
  const queensideTotal = Math.abs(quadrant.queensideWhite) + Math.abs(quadrant.queensideBlack);
  const totalActivity = kingsideTotal + queensideTotal + Math.abs(quadrant.center);
  const avgMomentMagnitude = moments.length > 0 
    ? moments.reduce((sum, m) => sum + m.shiftMagnitude, 0) / moments.length 
    : 0;
  const temporalProgression = temporal.endgame - temporal.opening;
  const balanceStability = 100 - temporal.volatility;
  const quadrantShift = Math.abs(kingsideTotal - queensideTotal);
  const centerDominance = Math.abs(quadrant.center) / Math.max(1, totalActivity) * 100;
  
  // Compression ratio: how "contracted" is the defensive structure
  const compressionRatio = totalActivity < 100 ? (100 - totalActivity) / 100 : 0;
  
  // Counterattack potential: signs of stored energy for counterplay
  const counterattackPotential = (
    (temporal.endgame > temporal.middlegame ? 20 : 0) +
    (moments.filter(m => m.shiftMagnitude > 4).length * 10) +
    (temporal.opening < 0 && temporal.endgame > 0 ? 25 : 0)
  );
  
  // Structural rigidity: how locked/static is the position
  const structuralRigidity = (
    (temporal.volatility < 15 ? 30 : 0) +
    (moments.length <= 1 ? 25 : 0) +
    (totalMoves > 30 && totalActivity < 80 ? 20 : 0)
  );
  
  // Determine game phase
  let gamePhase: 'opening' | 'middlegame' | 'endgame' = 'middlegame';
  if (totalMoves <= 15) gamePhase = 'opening';
  else if (totalMoves >= 35) gamePhase = 'endgame';
  
  return {
    kingsideTotal,
    queensideTotal,
    totalActivity,
    avgMomentMagnitude,
    temporalProgression,
    balanceStability,
    quadrantShift,
    centerDominance,
    compressionRatio,
    counterattackPotential,
    structuralRigidity,
    gamePhase,
  };
}

// ===================== WEIGHTED SCORING ENGINE =====================

interface ScoringEntry {
  score: number;
  factors: string[];
}

function runWeightedScoringEngine(
  metrics: AdvancedMetrics,
  temporal: TemporalFlow,
  moments: CriticalMoment[],
  totalMoves: number
): Map<ProphylacticVariation, ScoringEntry> {
  const scores = new Map<ProphylacticVariation, ScoringEntry>();
  
  // Initialize all variations
  for (const variation of Object.keys(PROPHYLACTIC_VARIATIONS) as ProphylacticVariation[]) {
    scores.set(variation, { score: 0, factors: [] });
  }
  
  // Phase-based weight multipliers
  const phaseMultiplier = {
    opening: metrics.gamePhase === 'opening' ? 1.3 : 0.8,
    middlegame: metrics.gamePhase === 'middlegame' ? 1.2 : 0.9,
    endgame: metrics.gamePhase === 'endgame' ? 1.4 : 0.7,
  };
  
  // ========== PETROSIAN OVERPROTECTION ==========
  // Key: High center dominance, multiple protection layers, stability
  scoreVariation(scores, 'petrosian_overprotection', [
    { condition: metrics.centerDominance > 25, points: 30, factor: 'Strong central overprotection' },
    { condition: metrics.centerDominance > 40, points: 15, factor: 'Dominant center control' },
    { condition: metrics.balanceStability > 75, points: 20, factor: 'Deep positional stability' },
    { condition: temporal.volatility < 20 && totalMoves > 30, points: 15, factor: 'Sustained piece coordination' },
    { condition: metrics.structuralRigidity > 50, points: 10, factor: 'Locked central structure' },
  ], phaseMultiplier.middlegame);
  
  // ========== KARPOV STRANGLEHOLD ==========
  // Key: Progressive territorial gain, steadily increasing control
  scoreVariation(scores, 'karpov_stranglehold', [
    { condition: metrics.temporalProgression > 20, points: 35, factor: 'Progressive positional squeeze' },
    { condition: temporal.middlegame > temporal.opening && temporal.endgame > temporal.middlegame, points: 25, factor: 'Steadily increasing control' },
    { condition: metrics.balanceStability > 70 && metrics.temporalProgression > 10, points: 15, factor: 'Controlled expansion' },
    { condition: metrics.compressionRatio < 0.3 && metrics.totalActivity > 100, points: 10, factor: 'Space advantage maintained' },
  ], phaseMultiplier.endgame);
  
  // ========== NIMZOWITSCH RESTRAINT ==========
  // Key: Static structure, blockade patterns, minimal tactical incidents
  scoreVariation(scores, 'nimzowitsch_restraint', [
    { condition: metrics.structuralRigidity > 60, points: 35, factor: 'Classic blockade structure' },
    { condition: temporal.volatility < 20 && metrics.totalActivity < 100, points: 25, factor: 'Frozen pawn structure' },
    { condition: moments.length <= 1 && totalMoves > 25, points: 20, factor: 'Minimal tactical incidents' },
    { condition: metrics.avgMomentMagnitude < 2, points: 10, factor: 'Ultra-quiet play' },
  ], phaseMultiplier.middlegame);
  
  // ========== TIGRAN PIVOT ==========
  // Key: Quadrant shift, defensive repositioning, reactive adjustments
  scoreVariation(scores, 'tigran_pivot', [
    { condition: metrics.quadrantShift > 40, points: 35, factor: 'Major defensive piece transfer' },
    { condition: metrics.quadrantShift > 60, points: 15, factor: 'Cross-board repositioning' },
    { condition: temporal.volatility > 25 && temporal.volatility < 50, points: 20, factor: 'Controlled volatility during pivot' },
    { condition: moments.some(m => m.shiftMagnitude > 4), points: 15, factor: 'Reactive repositioning detected' },
  ], phaseMultiplier.middlegame);
  
  // ========== HEDGEHOG COIL ==========
  // Key: Early concession, compact structure, late-game explosion
  scoreVariation(scores, 'hedgehog_coil', [
    { condition: temporal.opening < -10 && temporal.endgame > 10, points: 35, factor: 'Classic hedgehog spring pattern' },
    { condition: temporal.opening < 0 && temporal.endgame > 0, points: 20, factor: 'Early concession, late expansion' },
    { condition: metrics.counterattackPotential > 40, points: 20, factor: 'Coiled counterattack energy' },
    { condition: metrics.compressionRatio > 0.3 && moments.length >= 2, points: 15, factor: 'Compact but active structure' },
  ], phaseMultiplier.endgame);
  
  // ========== BERLIN WALL ==========
  // Key: Ultra-low volatility, early simplification, draw-oriented
  scoreVariation(scores, 'berlin_wall', [
    { condition: temporal.volatility < 12, points: 40, factor: 'Ultra-solid Berlin structure' },
    { condition: temporal.volatility < 15 && moments.length === 0, points: 25, factor: 'Complete tactical sterility' },
    { condition: metrics.totalActivity < 80 && totalMoves > 25, points: 20, factor: 'Early simplification complete' },
    { condition: metrics.structuralRigidity > 70, points: 10, factor: 'Endgame fortress activated' },
  ], phaseMultiplier.endgame);
  
  // ========== FORTRESS CONSTRUCTION ==========
  // Key: Minimal territory, impregnable perimeter, late-game contraction
  scoreVariation(scores, 'fortress_construction', [
    { condition: metrics.compressionRatio > 0.5, points: 40, factor: 'Fortress perimeter established' },
    { condition: metrics.totalActivity < 60 && metrics.balanceStability > 80, points: 30, factor: 'Impregnable defensive setup' },
    { condition: temporal.endgame < temporal.middlegame && totalMoves > 40, points: 20, factor: 'Late-game defensive contraction' },
    { condition: metrics.structuralRigidity > 60 && metrics.counterattackPotential < 20, points: 10, factor: 'Pure defensive fortress' },
  ], phaseMultiplier.endgame);
  
  // ========== PROPHYLACTIC EXCHANGE ==========
  // Key: Decreasing piece density, controlled simplification
  scoreVariation(scores, 'prophylactic_exchange', [
    { condition: temporal.endgame < temporal.opening && temporal.endgame < temporal.middlegame, points: 30, factor: 'Systematic piece reduction' },
    { condition: metrics.totalActivity < 100 && moments.length <= 2, points: 20, factor: 'Controlled simplification' },
    { condition: metrics.temporalProgression < -10, points: 20, factor: 'Activity decrease over time' },
    { condition: metrics.balanceStability > 65, points: 10, factor: 'Stable through exchanges' },
  ], phaseMultiplier.middlegame);
  
  // ========== WAITING MOVE MASTERY ==========
  // Key: Extreme patience, zugzwang cultivation, minimal progress
  scoreVariation(scores, 'waiting_move_mastery', [
    { condition: temporal.volatility < 10, points: 40, factor: 'Master-level patience' },
    { condition: temporal.volatility < 12 && metrics.balanceStability > 85, points: 25, factor: 'Zugzwang cultivation' },
    { condition: moments.length === 0 && totalMoves > 35, points: 25, factor: 'Perfect waiting technique' },
    { condition: metrics.avgMomentMagnitude === 0 && totalMoves > 30, points: 15, factor: 'Zero tactical incidents' },
  ], phaseMultiplier.endgame);
  
  // ========== ELASTIC DEFENSE ==========
  // Key: Initial retreat, subsequent counterattack, flexibility
  scoreVariation(scores, 'elastic_defense', [
    { condition: temporal.opening < -15 && temporal.middlegame > 0, points: 40, factor: 'Classic elastic pattern' },
    { condition: temporal.opening < -10 && temporal.endgame > temporal.opening + 20, points: 25, factor: 'Retreat and spring back' },
    { condition: metrics.counterattackPotential > 50, points: 20, factor: 'Strong counterattack rhythm' },
    { condition: metrics.avgMomentMagnitude > 3 && moments.length >= 2, points: 15, factor: 'Multiple swing moments' },
  ], phaseMultiplier.middlegame);
  
  // ========== PRESSURE ABSORPTION ==========
  // Key: Sustained enemy pressure weathered, gradual neutralization
  scoreVariation(scores, 'pressure_absorption', [
    { condition: temporal.opening < 0 && temporal.middlegame < 0 && temporal.endgame > -5, points: 35, factor: 'Full attack absorbed' },
    { condition: temporal.opening < -10 && temporal.endgame > temporal.opening, points: 25, factor: 'Weathered the storm' },
    { condition: moments.length >= 3 && metrics.avgMomentMagnitude < 4, points: 20, factor: 'Multiple absorptions without breaking' },
    { condition: metrics.balanceStability > 60 && temporal.opening < 0, points: 15, factor: 'Stable under pressure' },
  ], phaseMultiplier.middlegame);
  
  return scores;
}

function scoreVariation(
  scores: Map<ProphylacticVariation, ScoringEntry>,
  variation: ProphylacticVariation,
  criteria: Array<{ condition: boolean; points: number; factor: string }>,
  phaseMultiplier: number
): void {
  const entry = scores.get(variation)!;
  for (const { condition, points, factor } of criteria) {
    if (condition) {
      entry.score += points * phaseMultiplier;
      entry.factors.push(factor);
    }
  }
}

// ===================== TOPOLOGY & RHYTHM DETECTION =====================

function detectDefensiveTopology(
  quadrant: QuadrantProfile,
  metrics: AdvancedMetrics
): 'central' | 'flank' | 'distributed' | 'contracted' {
  if (metrics.compressionRatio > 0.4) return 'contracted';
  if (metrics.centerDominance > 35) return 'central';
  if (metrics.quadrantShift > 50) return 'flank';
  return 'distributed';
}

function detectTemporalRhythm(
  temporal: TemporalFlow,
  moments: CriticalMoment[]
): 'proactive' | 'reactive' | 'static' | 'elastic' {
  // Elastic: clear retreat then advance pattern
  if (temporal.opening < -10 && temporal.endgame > temporal.opening + 15) return 'elastic';
  
  // Static: ultra-low volatility, no significant moments
  if (temporal.volatility < 15 && moments.length <= 1) return 'static';
  
  // Reactive: multiple moments, responding to threats
  if (moments.length >= 3) return 'reactive';
  
  // Proactive: gradual increase without major incidents
  if (temporal.endgame > temporal.opening && moments.length <= 2) return 'proactive';
  
  return 'reactive';
}

function detectPhaseStrength(
  temporal: TemporalFlow,
  metrics: AdvancedMetrics
): 'opening' | 'middlegame' | 'endgame' {
  // Where did the defense shine most?
  const phases = [
    { phase: 'opening' as const, strength: Math.abs(temporal.opening) },
    { phase: 'middlegame' as const, strength: Math.abs(temporal.middlegame) },
    { phase: 'endgame' as const, strength: Math.abs(temporal.endgame) },
  ];
  
  // Prefer endgame if fortress-like
  if (metrics.compressionRatio > 0.4) return 'endgame';
  
  // Prefer where control increased most
  if (temporal.endgame > temporal.middlegame && temporal.middlegame > temporal.opening) return 'endgame';
  if (temporal.middlegame > temporal.opening && temporal.middlegame > temporal.endgame) return 'middlegame';
  
  return phases.sort((a, b) => b.strength - a.strength)[0].phase;
}

// ===================== TRADING SIGNAL GENERATION =====================

function generateTradingSignal(
  variation: ProphylacticVariation,
  confidence: number,
  rhythm: 'proactive' | 'reactive' | 'static' | 'elastic'
): 'hold' | 'accumulate' | 'hedge' | 'reduce' | 'wait' {
  // Low confidence = wait for clarity
  if (confidence < 40) return 'wait';
  
  // Variation-specific signals
  const signalMap: Record<ProphylacticVariation, 'hold' | 'accumulate' | 'hedge' | 'reduce' | 'wait'> = {
    petrosian_overprotection: 'hedge',
    karpov_stranglehold: 'accumulate',
    nimzowitsch_restraint: 'hold',
    tigran_pivot: 'hedge',
    hedgehog_coil: 'accumulate',
    berlin_wall: 'hold',
    fortress_construction: 'reduce',
    prophylactic_exchange: 'reduce',
    waiting_move_mastery: 'wait',
    elastic_defense: 'accumulate',
    pressure_absorption: 'hold',
    prophylactic_unknown: 'wait',
  };
  
  let signal = signalMap[variation];
  
  // Rhythm-based adjustments
  if (rhythm === 'elastic' && signal === 'hold') signal = 'accumulate';
  if (rhythm === 'static' && signal === 'accumulate') signal = 'hold';
  
  return signal;
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
