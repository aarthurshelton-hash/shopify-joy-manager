/**
 * Legend Data Hook
 * Extracted from LiveColorLegend for separation of concerns
 */

import { useMemo } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { MoveHistoryEntry } from '../EnPensentOverlay';
import { TemporalSignature, QuadrantProfile, TemporalFlow } from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype/universalClassifier';

export interface TerritoryData {
  whiteControl: number[][];
  blackControl: number[][];
  maxWhite: number;
  maxBlack: number;
  whitePercent: number;
  blackPercent: number;
}

/**
 * Calculate piece activity from move history
 */
export function usePieceActivity(moveHistory: MoveHistoryEntry[]) {
  return useMemo(() => {
    const activity = new Map<string, number>();
    const pieceTypes: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const colors: PieceColor[] = ['w', 'b'];
    
    // Initialize
    for (const color of colors) {
      for (const piece of pieceTypes) {
        activity.set(`${color}-${piece}`, 0);
      }
    }
    
    // Count from move history
    for (const move of moveHistory) {
      const key = `${move.color}-${move.piece}`;
      activity.set(key, (activity.get(key) || 0) + 1);
    }
    
    return activity;
  }, [moveHistory]);
}

/**
 * Calculate territory heatmap data
 */
export function useTerritoryData(moveHistory: MoveHistoryEntry[]): TerritoryData {
  return useMemo(() => {
    const whiteControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    const blackControl: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
    let maxWhite = 0;
    let maxBlack = 0;
    
    for (const move of moveHistory) {
      const file = move.square.charCodeAt(0) - 97;
      const rank = parseInt(move.square[1]) - 1;
      
      if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
        if (move.color === 'w') {
          whiteControl[7 - rank][file]++;
          maxWhite = Math.max(maxWhite, whiteControl[7 - rank][file]);
        } else {
          blackControl[7 - rank][file]++;
          maxBlack = Math.max(maxBlack, blackControl[7 - rank][file]);
        }
      }
    }
    
    let whiteTotal = 0;
    let blackTotal = 0;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        whiteTotal += whiteControl[r][f];
        blackTotal += blackControl[r][f];
      }
    }
    const total = whiteTotal + blackTotal || 1;
    
    return {
      whiteControl,
      blackControl,
      maxWhite: maxWhite || 1,
      maxBlack: maxBlack || 1,
      whitePercent: Math.round((whiteTotal / total) * 100),
      blackPercent: Math.round((blackTotal / total) * 100),
    };
  }, [moveHistory]);
}

/**
 * Extract temporal signature from move history (En Pensent integration)
 */
export function useTemporalSignature(
  moveHistory: MoveHistoryEntry[],
  territoryData: TerritoryData
): TemporalSignature | null {
  return useMemo((): TemporalSignature | null => {
    if (moveHistory.length === 0) return null;
    
    const quadrantProfile: QuadrantProfile = { q1: 0, q2: 0, q3: 0, q4: 0 };
    const totalMoves = moveHistory.length;
    
    for (const move of moveHistory) {
      const file = move.square.charCodeAt(0) - 97;
      const rank = parseInt(move.square[1]) - 1;
      
      if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
        if (rank >= 4 && file < 4) quadrantProfile.q1++;
        else if (rank >= 4 && file >= 4) quadrantProfile.q2++;
        else if (rank < 4 && file < 4) quadrantProfile.q3++;
        else quadrantProfile.q4++;
      }
    }
    
    if (totalMoves > 0) {
      quadrantProfile.q1 /= totalMoves;
      quadrantProfile.q2 /= totalMoves;
      quadrantProfile.q3 /= totalMoves;
      quadrantProfile.q4 /= totalMoves;
    }
    
    const whitePercent = territoryData.whitePercent / 100;
    
    const temporalFlow: TemporalFlow = {
      opening: Math.min(1, 10 / totalMoves),
      middle: totalMoves > 10 ? Math.min(1, (totalMoves - 10) / 30) : 0,
      ending: totalMoves > 40 ? Math.min(1, (totalMoves - 40) / 20) : 0,
      trend: whitePercent > 0.55 ? 'accelerating' : whitePercent < 0.45 ? 'declining' : 'stable',
      momentum: (whitePercent - 0.5) * 2,
    };
    
    const intensity = Math.min(1, totalMoves / 80);
    const dominantForce = whitePercent > 0.55 ? 'primary' : whitePercent < 0.45 ? 'secondary' : 'balanced';
    
    return {
      fingerprint: `live-${Date.now()}`,
      archetype: 'unknown',
      dominantForce,
      flowDirection: temporalFlow.momentum > 0 ? 'forward' : temporalFlow.momentum < 0 ? 'backward' : 'lateral',
      intensity,
      quadrantProfile,
      temporalFlow,
      criticalMoments: [],
    };
  }, [moveHistory, territoryData]);
}

/**
 * Classify game archetype from temporal signature
 */
export function useGameArchetype(signature: TemporalSignature | null): string | null {
  return useMemo(() => {
    if (!signature) return null;
    return classifyUniversalArchetype(signature);
  }, [signature]);
}
