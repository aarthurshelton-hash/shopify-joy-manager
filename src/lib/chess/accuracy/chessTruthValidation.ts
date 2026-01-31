/**
 * Chess Truth Validation - Priority 1.1
 * 
 * Cross-domain truth validation for chess predictions using
 * the Synaptic Truth Network and Universal Intelligence.
 * 
 * Patent Pending - Alec Arthur Shelton
 */

import { synapticTruthNetwork, TruthFiring } from '@/lib/pensent-core/domains/universal/modules/synapticTruthNetwork';

// ============================================================================
// CHESS TRUTH VALIDATION INTERFACES
// ============================================================================

export interface UniversalPatternContext {
  financeVolatility: number;       // 0-1: Market turbulence
  climatePatternStrength: number;  // 0-1: Pattern detection confidence
  biologicalPressure: number;      // 0-1: Evolutionary pressure indicators
  atomicEnergyState: number;       // 0-1: Energy state transitions
  myceliumNetworkStrength: number; // 0-1: Interconnected pattern strength
  temporalPhase: 'opening' | 'middlegame' | 'endgame';
}

export interface ChessTruthValidation {
  positionHash: string;
  archetypeConfidence: number;
  crossDomainCorrelations: {
    finance: number;
    climate: number;
    biology: number;
    atomic: number;
    mycelium: number;
  };
  truthScore: number;
  validationFactors: string[];
}

export interface ValidatedPrediction {
  prediction: string;
  adjustedConfidence: number;
  archetype: string;
  truthFiring: TruthFiring | null;
  validationDetails: ChessTruthValidation;
}

// ============================================================================
// CROSS-DOMAIN AGREEMENT CHECKING
// ============================================================================

/**
 * Check how many universal domains agree with the chess prediction
 */
function checkDomainAgreement(
  prediction: string,
  archetype: string,
  context: UniversalPatternContext
): { agreementScore: number; factors: string[] } {
  const factors: string[] = [];
  let agreementCount = 0;
  const totalDomains = 5;

  // FINANCE: High volatility = decisive outcomes more likely
  if (context.financeVolatility > 0.7) {
    if (prediction !== 'draw') {
      agreementCount++;
      factors.push('Finance volatility supports decisive outcome');
    }
  } else if (context.financeVolatility < 0.3) {
    if (prediction === 'draw' || archetype.includes('positional')) {
      agreementCount++;
      factors.push('Low finance volatility supports stability');
    }
  }

  // CLIMATE: Pattern strength correlates with prediction confidence
  if (context.climatePatternStrength > 0.6) {
    agreementCount++;
    factors.push('Strong climate pattern detection');
  }

  // BIOLOGY: Evolutionary pressure = aggressive play patterns
  if (context.biologicalPressure > 0.65) {
    if (archetype.includes('attack') || archetype.includes('tactical')) {
      agreementCount++;
      factors.push('Biological pressure aligns with aggressive archetype');
    }
  } else if (context.biologicalPressure < 0.35) {
    if (archetype.includes('defense') || archetype.includes('positional')) {
      agreementCount++;
      factors.push('Low biological pressure aligns with defensive archetype');
    }
  }

  // ATOMIC: Energy state transitions = material imbalances
  if (context.atomicEnergyState > 0.7) {
    if (archetype.includes('tactical') || archetype.includes('sacrifice')) {
      agreementCount++;
      factors.push('High atomic energy supports tactical patterns');
    }
  }

  // MYCELIUM: Network strength = piece coordination
  if (context.myceliumNetworkStrength > 0.6) {
    if (archetype.includes('coordination') || archetype.includes('harmony')) {
      agreementCount++;
      factors.push('Mycelium network aligns with coordination archetype');
    }
  }

  return {
    agreementScore: agreementCount / totalDomains,
    factors,
  };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a chess prediction against universal patterns
 * 
 * This is the core innovation: using cross-domain patterns to
 * validate and adjust chess predictions.
 */
export function validateChessPrediction(
  prediction: string,
  confidence: number,
  archetype: string,
  positionHash: string,
  universalContext?: Partial<UniversalPatternContext>
): ValidatedPrediction {
  const factors: string[] = [];
  let adjustedConfidence = confidence;

  // Default context if not provided (use neutral values)
  const context: UniversalPatternContext = {
    financeVolatility: universalContext?.financeVolatility ?? 0.5,
    climatePatternStrength: universalContext?.climatePatternStrength ?? 0.5,
    biologicalPressure: universalContext?.biologicalPressure ?? 0.5,
    atomicEnergyState: universalContext?.atomicEnergyState ?? 0.5,
    myceliumNetworkStrength: universalContext?.myceliumNetworkStrength ?? 0.5,
    temporalPhase: universalContext?.temporalPhase ?? 'middlegame',
  };

  // Step 1: Check domain agreement
  const { agreementScore, factors: agreementFactors } = checkDomainAgreement(
    prediction,
    archetype,
    context
  );
  factors.push(...agreementFactors);

  // Step 2: Invoke Synaptic Truth Network
  const energySignature = {
    whiteEnergy: prediction === 'white' ? 60 : (prediction === 'black' ? 40 : 50),
    blackEnergy: prediction === 'black' ? 60 : (prediction === 'white' ? 40 : 50),
    quadrantProfile: generateQuadrantFromArchetype(archetype),
    temporalPhase: context.temporalPhase,
    volatility: context.financeVolatility,
  };

  const truthFiring = synapticTruthNetwork.invokePattern(energySignature);

  // Step 3: Adjust confidence based on validations
  
  // Domain agreement adjustment
  if (agreementScore >= 0.6) {
    adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.15);
    factors.push(`High cross-domain agreement (${(agreementScore * 100).toFixed(0)}%)`);
  } else if (agreementScore <= 0.2) {
    adjustedConfidence *= 0.85;
    factors.push(`Low cross-domain agreement (${(agreementScore * 100).toFixed(0)}%)`);
  }

  // Truth network adjustment
  if (truthFiring) {
    if (truthFiring.universalResonance > 0.7) {
      adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.1);
      factors.push(`Strong universal resonance (${(truthFiring.universalResonance * 100).toFixed(0)}%)`);
    } else if (truthFiring.universalResonance < 0.3) {
      adjustedConfidence *= 0.9;
      factors.push(`Weak universal resonance (${(truthFiring.universalResonance * 100).toFixed(0)}%)`);
    }

    // Archetype match bonus
    if (truthFiring.archetype === archetype || archetypesSimilar(truthFiring.archetype, archetype)) {
      adjustedConfidence = Math.min(0.95, adjustedConfidence * 1.05);
      factors.push(`Synaptic archetype alignment: ${truthFiring.archetype}`);
    }
  }

  // Volatility-draw conflict detection (user's specific example)
  if (context.financeVolatility > 0.7 && prediction === 'draw') {
    adjustedConfidence *= 0.85;
    factors.push('Volatility-draw conflict: reducing draw confidence');
  }

  // Cap confidence bounds
  adjustedConfidence = Math.max(0.25, Math.min(0.95, adjustedConfidence));

  // Build validation details
  const validationDetails: ChessTruthValidation = {
    positionHash,
    archetypeConfidence: confidence,
    crossDomainCorrelations: {
      finance: context.financeVolatility,
      climate: context.climatePatternStrength,
      biology: context.biologicalPressure,
      atomic: context.atomicEnergyState,
      mycelium: context.myceliumNetworkStrength,
    },
    truthScore: truthFiring?.universalResonance ?? 0.5,
    validationFactors: factors,
  };

  return {
    prediction,
    adjustedConfidence,
    archetype,
    truthFiring,
    validationDetails,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate quadrant profile from archetype name
 */
function generateQuadrantFromArchetype(archetype: string): { q1: number; q2: number; q3: number; q4: number } {
  const archetypeLower = archetype.toLowerCase();
  
  // Kingside archetypes (q2, q4 = kingside)
  if (archetypeLower.includes('kingside') || archetypeLower.includes('king_hunt')) {
    return { q1: 0.3, q2: 0.8, q3: 0.3, q4: 0.8 };
  }
  
  // Queenside archetypes (q1, q3 = queenside)
  if (archetypeLower.includes('queenside')) {
    return { q1: 0.8, q2: 0.3, q3: 0.8, q4: 0.3 };
  }
  
  // Central archetypes
  if (archetypeLower.includes('central') || archetypeLower.includes('domination')) {
    return { q1: 0.5, q2: 0.7, q3: 0.7, q4: 0.5 };
  }
  
  // Tactical archetypes (high all around)
  if (archetypeLower.includes('tactical') || archetypeLower.includes('storm')) {
    return { q1: 0.7, q2: 0.7, q3: 0.7, q4: 0.7 };
  }
  
  // Positional/defensive archetypes (balanced, lower)
  if (archetypeLower.includes('positional') || archetypeLower.includes('defense')) {
    return { q1: 0.5, q2: 0.5, q3: 0.5, q4: 0.5 };
  }
  
  // Default: balanced
  return { q1: 0.55, q2: 0.55, q3: 0.55, q4: 0.55 };
}

/**
 * Check if two archetypes are semantically similar
 */
function archetypesSimilar(a1: string, a2: string): boolean {
  const a1Lower = a1.toLowerCase();
  const a2Lower = a2.toLowerCase();
  
  // Direct match
  if (a1Lower === a2Lower) return true;
  
  // Semantic groupings
  const groups = [
    ['kingside_attack', 'king_hunt', 'pawn_storm'],
    ['queenside_expansion', 'queenside_attack'],
    ['tactical_storm', 'material_imbalance', 'exchange_sacrifice'],
    ['positional_squeeze', 'prophylactic_defense', 'calculating_defender'],
    ['piece_coordination', 'dynamic_balance', 'piece_activity'],
    ['endgame_technique', 'endgame_virtuoso', 'endgame_conversion'],
  ];
  
  for (const group of groups) {
    const has1 = group.some(g => a1Lower.includes(g) || g.includes(a1Lower));
    const has2 = group.some(g => a2Lower.includes(g) || g.includes(a2Lower));
    if (has1 && has2) return true;
  }
  
  return false;
}

// ============================================================================
// UNIVERSAL HEARTBEAT INTEGRATION
// ============================================================================

/**
 * Get current universal context from the heartbeat provider
 * This function can be called from React components that have access to the provider
 */
export function buildUniversalContext(
  resonanceScore: number,
  activeDomains: string[]
): Partial<UniversalPatternContext> {
  return {
    financeVolatility: activeDomains.includes('finance') ? resonanceScore * 1.2 : 0.5,
    climatePatternStrength: activeDomains.includes('climate') ? resonanceScore : 0.5,
    biologicalPressure: activeDomains.includes('biology') ? resonanceScore * 0.9 : 0.5,
    atomicEnergyState: activeDomains.includes('atomic') ? resonanceScore : 0.5,
    myceliumNetworkStrength: activeDomains.includes('mycelium') ? resonanceScore * 1.1 : 0.5,
  };
}

/**
 * Quick confidence adjustment based on universal resonance
 * Use this when you don't need full validation details
 */
export function quickConfidenceAdjust(
  confidence: number,
  resonanceScore: number,
  archetype: string
): number {
  // High resonance = trust patterns more
  if (resonanceScore > 0.8) {
    return Math.min(0.95, confidence * 1.1);
  }
  
  // Low resonance = rely more on base confidence
  if (resonanceScore < 0.4) {
    return confidence * 0.9;
  }
  
  return confidence;
}
