/**
 * Pattern Similarity Calculator
 */

import { ColorFlowSignature, StrategicArchetype } from '../colorFlowAnalysis';
import { PatternRecord } from './types';

export function calculateSimilarity(signature: ColorFlowSignature, pattern: PatternRecord): number {
  const chars = pattern.characteristics;
  let score = 0;

  // Flow direction match (25 points)
  if (signature.flowDirection === chars.flowDirection) {
    score += 25;
  } else if (areFlowsRelated(signature.flowDirection, chars.flowDirection)) {
    score += 12;
  }

  // Intensity similarity (20 points)
  const intensityDiff = Math.abs(signature.intensity - chars.intensity);
  score += Math.max(0, 20 - intensityDiff / 2);

  // Volatility similarity (15 points)
  const volatilityDiff = Math.abs(signature.temporalFlow.volatility - chars.volatility);
  score += Math.max(0, 15 - volatilityDiff / 3);

  // Dominant side match (20 points)
  if (signature.dominantSide === chars.dominantSide) {
    score += 20;
  } else if (signature.dominantSide === 'contested' || chars.dominantSide === 'contested') {
    score += 10;
  }

  // Center control similarity (10 points)
  const centerDiff = Math.abs(signature.quadrantProfile.center - chars.centerControl);
  score += Math.max(0, 10 - centerDiff / 5);

  // Side activity similarity (10 points)
  const kingsideActivity = (signature.quadrantProfile.kingsideWhite + signature.quadrantProfile.kingsideBlack) / 2;
  const kingsideDiff = Math.abs(kingsideActivity - chars.kingsideActivity);
  score += Math.max(0, 5 - kingsideDiff / 10);

  const queensideActivity = (signature.quadrantProfile.queensideWhite + signature.quadrantProfile.queensideBlack) / 2;
  const queensideDiff = Math.abs(queensideActivity - chars.queensideActivity);
  score += Math.max(0, 5 - queensideDiff / 10);

  return Math.round(score);
}

export function areFlowsRelated(a: string, b: string): boolean {
  const related: Record<string, string[]> = {
    kingside: ['central', 'diagonal'],
    queenside: ['central', 'diagonal'],
    central: ['kingside', 'queenside', 'balanced'],
    balanced: ['central'],
    diagonal: ['kingside', 'queenside'],
  };
  return related[a]?.includes(b) || false;
}

export function getMatchingFactors(signature: ColorFlowSignature, pattern: PatternRecord): string[] {
  const factors: string[] = [];
  const chars = pattern.characteristics;

  if (signature.flowDirection === chars.flowDirection) {
    factors.push(`Same flow direction: ${signature.flowDirection}`);
  }

  if (signature.dominantSide === chars.dominantSide) {
    factors.push(`Same dominant side: ${signature.dominantSide}`);
  }

  if (Math.abs(signature.intensity - chars.intensity) < 15) {
    factors.push('Similar intensity level');
  }

  if (Math.abs(signature.temporalFlow.volatility - chars.volatility) < 20) {
    factors.push('Similar game volatility');
  }

  if (factors.length === 0) {
    factors.push('Structural pattern similarity');
  }

  return factors;
}

export function getRelatedArchetypes(archetype: StrategicArchetype): StrategicArchetype[] {
  const relations: Record<StrategicArchetype, StrategicArchetype[]> = {
    kingside_attack: ['sacrificial_attack', 'open_tactical'],
    queenside_expansion: ['positional_squeeze', 'closed_maneuvering'],
    central_domination: ['piece_harmony', 'positional_squeeze'],
    prophylactic_defense: ['closed_maneuvering', 'endgame_technique'],
    pawn_storm: ['kingside_attack', 'opposite_castling'],
    piece_harmony: ['central_domination', 'positional_squeeze'],
    opposite_castling: ['kingside_attack', 'pawn_storm'],
    closed_maneuvering: ['prophylactic_defense', 'positional_squeeze'],
    open_tactical: ['sacrificial_attack', 'kingside_attack'],
    endgame_technique: ['prophylactic_defense', 'positional_squeeze'],
    sacrificial_attack: ['open_tactical', 'kingside_attack'],
    positional_squeeze: ['central_domination', 'closed_maneuvering'],
    unknown: [],
  };
  return relations[archetype] || [];
}
