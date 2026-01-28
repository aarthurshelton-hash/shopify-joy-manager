/**
 * Color Flow Prediction Engine v7.90-EQUILIBRIUM
 * 
 * Generates strategic predictions from color flow signatures
 * 
 * v7.90 EQUILIBRIUM: CEO insight - "we can win both white AND black"
 * Instead of oscillating biases, use THREE-WAY confidence voting:
 * - Calculate independent confidence for white, black, AND draw
 * - Pick the outcome with highest confidence
 * - Only predict when there's clear separation
 */

import { ColorFlowSignature, ColorFlowPrediction, StrategicArchetype } from './types';
import { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';
import { calculateEquilibriumScores, EquilibriumScores } from './equilibriumPredictor';

// Store last equilibrium scores for debugging/transparency
let lastEquilibriumScores: EquilibriumScores | null = null;

/**
 * Get the last equilibrium calculation (for debugging/UI display)
 */
export function getLastEquilibriumScores(): EquilibriumScores | null {
  return lastEquilibriumScores;
}

/**
 * Generate strategic predictions based on color flow signature
 * 
 * v7.90 EQUILIBRIUM: Uses three-way confidence voting for balanced predictions
 */
export function predictFromColorFlow(
  signature: ColorFlowSignature,
  currentMoveNumber: number,
  stockfishEval: number = 0,
  stockfishDepth: number = 18
): ColorFlowPrediction {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  // v7.90 EQUILIBRIUM: Calculate all three outcome confidences
  const equilibrium = calculateEquilibriumScores(
    signature,
    stockfishEval,
    stockfishDepth,
    currentMoveNumber
  );
  
  // Store for debugging access
  lastEquilibriumScores = equilibrium;
  
  // Convert equilibrium prediction to winner format
  let predictedWinner: 'white' | 'black' | 'draw';
  if (equilibrium.prediction === 'white_wins') {
    predictedWinner = 'white';
  } else if (equilibrium.prediction === 'black_wins') {
    predictedWinner = 'black';
  } else {
    predictedWinner = 'draw';
  }
  
  // Use equilibrium confidence with clarity adjustment
  let confidence = equilibrium.finalConfidence;
  
  // If low clarity, reduce confidence
  if (!equilibrium.highClarity) {
    confidence = Math.max(35, confidence - 10);
  }
  
  // Clamp to reasonable range
  confidence = Math.max(30, Math.min(85, confidence));
  
  // Strategic guidance based on archetype
  const guidance = generateStrategicGuidance(signature);
  
  // Predict future critical squares
  const futureCriticalSquares = predictCriticalSquares(signature);
  
  // Describe expected evolution
  const expectedEvolution = describeExpectedEvolution(signature, currentMoveNumber);
  
  return {
    predictedWinner,
    confidence,
    lookaheadMoves: archetypeDef.lookaheadConfidence,
    strategicGuidance: guidance,
    futureCriticalSquares,
    expectedEvolution,
  };
}

function generateStrategicGuidance(signature: ColorFlowSignature): string[] {
  const guidance: string[] = [];
  const archetype = signature.archetype;
  
  switch (archetype) {
    case 'kingside_attack':
      guidance.push('Maintain pressure on the h-file and g-file');
      guidance.push('Look for sacrificial breakthroughs near the king');
      break;
    case 'queenside_expansion':
      guidance.push('Control the c-file for rook infiltration');
      guidance.push('Advance queenside pawns to create passed pawn');
      break;
    case 'central_domination':
      guidance.push('Use central control to restrict opponent mobility');
      guidance.push('Prepare pawn breaks to open lines');
      break;
    case 'endgame_technique':
      guidance.push('Activate the king immediately');
      guidance.push('Create or protect passed pawns');
      break;
    default:
      guidance.push('Maintain piece coordination');
      guidance.push('Look for tactical opportunities');
  }
  
  if (signature.flowDirection === 'kingside') {
    guidance.push('Color flow indicates kingside as the decisive theater');
  } else if (signature.flowDirection === 'queenside') {
    guidance.push('Color flow indicates queenside expansion opportunity');
  }
  
  return guidance;
}

function predictCriticalSquares(signature: ColorFlowSignature): string[] {
  const squares: string[] = [];
  
  switch (signature.flowDirection) {
    case 'kingside':
      squares.push('g4', 'h5', 'f5', 'g7');
      break;
    case 'queenside':
      squares.push('c4', 'b5', 'd5', 'c7');
      break;
    case 'central':
      squares.push('d4', 'e4', 'd5', 'e5');
      break;
    case 'diagonal':
      squares.push('a1', 'h8', 'a8', 'h1');
      break;
    default:
      squares.push('d4', 'e5');
  }
  
  return squares.slice(0, 4);
}

function describeExpectedEvolution(
  signature: ColorFlowSignature, 
  currentMove: number
): string {
  const archetype = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  if (currentMove < 15) {
    return `Opening phase suggests ${archetype.name}. Expect color intensity to ${
      signature.temporalFlow.volatility > 50 ? 'increase rapidly' : 'develop gradually'
    } toward the ${signature.flowDirection}.`;
  } else if (currentMove < 30) {
    return `Middlegame ${archetype.name} pattern established. Color flow is ${
      signature.dominantSide === 'contested' ? 'evenly contested' : `favoring ${signature.dominantSide}`
    }. Watch for tactical breaks in the ${signature.flowDirection}.`;
  } else {
    return `Late game ${archetype.name}. Pattern suggests ${
      signature.dominantSide === 'contested' ? 'drawing tendencies' : 
      `favorable conversion for ${signature.dominantSide}`
    }.`;
  }
}
