/**
 * Color Flow Prediction Engine
 * 
 * Generates strategic predictions from color flow signatures
 */

import { ColorFlowSignature, ColorFlowPrediction, StrategicArchetype } from './types';
import { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';

/**
 * Generate strategic predictions based on color flow signature
 */
export function predictFromColorFlow(
  signature: ColorFlowSignature,
  currentMoveNumber: number
): ColorFlowPrediction {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  // Base prediction on archetype
  let predictedWinner: 'white' | 'black' | 'draw';
  if (archetypeDef.predictedOutcome === 'balanced') {
    predictedWinner = 'draw';
  } else if (archetypeDef.predictedOutcome === 'white_favored') {
    predictedWinner = signature.dominantSide === 'black' ? 'black' : 'white';
  } else {
    predictedWinner = 'black';
  }
  
  // Adjust confidence based on pattern clarity
  let confidence = archetypeDef.historicalWinRate * 100;
  confidence *= (signature.intensity / 100);
  confidence = Math.round(confidence);
  
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
      archetype.predictedOutcome === 'balanced' ? 'drawing tendencies' : 
      `favorable conversion for ${archetype.predictedOutcome.replace('_favored', '')}`
    }.`;
  }
}
