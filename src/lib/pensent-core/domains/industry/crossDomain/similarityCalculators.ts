/**
 * Similarity Calculators
 * Functions for calculating similarity between patterns
 */

import type { QuadrantProfile } from '../../../types/core';
import type { SixtyFourSquareGrid } from '../types';

/**
 * Calculate similarity between two quadrant profiles
 */
export function quadrantSimilarity(a: QuadrantProfile, b: QuadrantProfile): number {
  const diff = Math.abs(a.q1 - b.q1) + Math.abs(a.q2 - b.q2) + 
               Math.abs(a.q3 - b.q3) + Math.abs(a.q4 - b.q4);
  return 1 - (diff / 4);
}

/**
 * Calculate grid-level similarity between two 64-square grids
 */
export function gridSimilarity(a: SixtyFourSquareGrid, b: SixtyFourSquareGrid): number {
  let totalDiff = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalDiff += Math.abs((a.cells[i]?.[j] ?? 0) - (b.cells[i]?.[j] ?? 0));
    }
  }
  return 1 - (totalDiff / 64);
}
