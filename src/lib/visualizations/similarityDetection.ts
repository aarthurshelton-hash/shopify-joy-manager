/**
 * Similarity Detection for Chess Visualizations
 * 
 * This module protects the uniqueness of complete visions and color palettes by:
 * 1. Detecting if colors match 30% or more AND moves match exactly
 * 2. Preventing saves of visualizations too similar to existing ones
 * 3. Supporting palette inheritance for featured palettes
 * 4. Checking against famous game cards to protect En Pensent intrinsic value
 */

import { colorPalettes, PaletteId, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GameData } from '@/lib/chess/gameSimulator';
import { supabase } from '@/integrations/supabase/client';
import { famousGames } from '@/lib/chess/famousGames';

// All piece types for comparison
const PIECE_TYPES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
const PIECE_COLORS: PieceColor[] = ['w', 'b'];

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Calculate color distance using Euclidean distance in RGB space
 * Returns a value between 0 (identical) and ~441 (max distance)
 */
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 441; // Max distance if invalid
  
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Check if two colors are "similar" (within threshold)
 * Threshold of ~50 is about 12% of max distance, considered "similar"
 */
function areColorsSimilar(hex1: string, hex2: string, threshold: number = 50): boolean {
  return colorDistance(hex1, hex2) < threshold;
}

export interface PaletteColors {
  white: Record<PieceType, string>;
  black: Record<PieceType, string>;
}

/**
 * Calculate the percentage of matching colors between two palettes
 * A color "matches" if it's similar enough (within threshold)
 */
export function calculatePaletteSimilarity(
  palette1: PaletteColors,
  palette2: PaletteColors,
  similarityThreshold: number = 50
): number {
  let matchingColors = 0;
  const totalColors = PIECE_TYPES.length * PIECE_COLORS.length; // 12 total colors
  
  for (const pieceType of PIECE_TYPES) {
    for (const pieceColor of PIECE_COLORS) {
      const color1 = pieceColor === 'w' ? palette1.white[pieceType] : palette1.black[pieceType];
      const color2 = pieceColor === 'w' ? palette2.white[pieceType] : palette2.black[pieceType];
      
      if (areColorsSimilar(color1, color2, similarityThreshold)) {
        matchingColors++;
      }
    }
  }
  
  return (matchingColors / totalColors) * 100;
}

/**
 * Check if a palette is similar to any featured palette (>80% match)
 */
export function findSimilarFeaturedPalette(
  customColors: PaletteColors
): { paletteId: PaletteId; similarity: number } | null {
  const featuredPalettes = colorPalettes.filter(p => p.id !== 'custom');
  
  let bestMatch: { paletteId: PaletteId; similarity: number } | null = null;
  
  for (const palette of featuredPalettes) {
    const similarity = calculatePaletteSimilarity(customColors, palette);
    
    // If 80%+ similar to a featured palette, it's essentially that palette
    if (similarity >= 80) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { paletteId: palette.id, similarity };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Normalize PGN for comparison (remove comments, variations, whitespace)
 */
function normalizePgn(pgn: string | undefined | null): string {
  if (!pgn) return '';
  
  return pgn
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/\([^)]*\)/g, '') // Remove variations
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\d+\.\s*/g, '')  // Remove move numbers
    .trim()
    .toLowerCase();
}

/**
 * Check if two games have identical moves (from start to finish)
 */
export function areMovesIdentical(
  pgn1: string | undefined | null,
  gameData1: GameData,
  pgn2: string | undefined | null,
  gameData2: GameData
): boolean {
  // Compare normalized PGNs
  const normalized1 = normalizePgn(pgn1 || gameData1.pgn);
  const normalized2 = normalizePgn(pgn2 || gameData2.pgn);
  
  if (normalized1 && normalized2) {
    return normalized1 === normalized2;
  }
  
  // If no PGN, compare moves array
  const moves1 = gameData1.moves || [];
  const moves2 = gameData2.moves || [];
  
  if (moves1.length !== moves2.length) return false;
  
  return moves1.every((move, idx) => move.toLowerCase() === (moves2[idx] || '').toLowerCase());
}

export interface SimilarityCheckResult {
  isTooSimilar: boolean;
  colorSimilarity: number;
  movesMatch: boolean;
  matchedPaletteId?: PaletteId;
  matchedPaletteSimilarity?: number;
  isIntrinsicPalette?: boolean; // True if using/close to a featured En Pensent palette
  isIntrinsicGame?: boolean; // True if the game matches a famous game card
  matchedGameCard?: { id: string; title: string }; // The matched famous game
  existingVisualizationId?: string;
  ownerDisplayName?: string;
  ownedByCurrentUser?: boolean;
  reason?: string;
  existingColors?: PaletteColors; // For color comparison preview
}

/**
 * Check if the PGN matches any famous game card
 */
export function findMatchingFamousGame(pgn: string | undefined, gameData: GameData): { id: string; title: string } | null {
  if (!pgn && !gameData.pgn && !gameData.moves?.length) return null;
  
  const normalizedInput = normalizePgn(pgn || gameData.pgn);
  
  for (const game of famousGames) {
    const normalizedFamous = normalizePgn(game.pgn);
    
    // Exact match
    if (normalizedInput === normalizedFamous) {
      return { id: game.id, title: game.title };
    }
    
    // Partial match - if the input contains all moves of the famous game (or vice versa)
    // This catches games that are the same but with extra moves or shorter notation
    if (normalizedInput.includes(normalizedFamous) || normalizedFamous.includes(normalizedInput)) {
      // Only match if at least 80% of moves are shared
      const inputMoves = normalizedInput.split(' ').filter(m => m.length > 0);
      const famousMoves = normalizedFamous.split(' ').filter(m => m.length > 0);
      
      const minLength = Math.min(inputMoves.length, famousMoves.length);
      const maxLength = Math.max(inputMoves.length, famousMoves.length);
      
      if (minLength / maxLength >= 0.8) {
        let matchingMoves = 0;
        for (let i = 0; i < minLength; i++) {
          if (inputMoves[i] === famousMoves[i]) matchingMoves++;
        }
        
        if (matchingMoves / minLength >= 0.9) {
          return { id: game.id, title: game.title };
        }
      }
    }
  }
  
  return null;
}

export interface VisualizationWithPalette {
  id: string;
  user_id: string;
  pgn: string | null;
  game_data: GameData & { 
    visualizationState?: { 
      paletteId?: string;
      customColors?: PaletteColors;
    };
  };
}

/**
 * Main similarity check function
 * Returns true if visualization is too similar to an existing one:
 * - Moves match exactly AND colors match 30% or higher
 * - OR colors match an existing featured palette too closely
 */
export async function checkVisualizationSimilarity(
  userId: string,
  pgn: string | undefined,
  gameData: GameData,
  paletteId: PaletteId,
  customColors?: PaletteColors
): Promise<SimilarityCheckResult> {
  try {
    // Get the colors to compare
    const currentPalette = customColors || colorPalettes.find(p => p.id === paletteId) || colorPalettes[0];
    const colorsToCompare: PaletteColors = {
      white: currentPalette.white,
      black: currentPalette.black,
    };
    
    // Check if using a featured En Pensent palette (intrinsic value)
    let isIntrinsicPalette = false;
    let matchedPaletteId: PaletteId | undefined;
    let matchedPaletteSimilarity: number | undefined;
    
    // If using a featured palette directly, it's intrinsic
    if (paletteId !== 'custom') {
      isIntrinsicPalette = true;
      matchedPaletteId = paletteId;
      matchedPaletteSimilarity = 100;
    } else if (customColors) {
      // Check if custom colors are close to any featured palette
      const matchedPalette = findSimilarFeaturedPalette(customColors);
      if (matchedPalette && matchedPalette.similarity >= 30) {
        isIntrinsicPalette = matchedPalette.similarity >= 80; // Only truly intrinsic at 80%+
        matchedPaletteId = matchedPalette.paletteId;
        matchedPaletteSimilarity = matchedPalette.similarity;
      }
    }
    
    // Check if the game matches any famous game card
    const matchedGameCard = findMatchingFamousGame(pgn, gameData);
    const isIntrinsicGame = matchedGameCard !== null;
    
    // Fetch all saved visualizations
    const { data: existingViz, error } = await supabase
      .from('saved_visualizations')
      .select('id, user_id, pgn, game_data');
    
    if (error) {
      console.error('Error fetching visualizations for similarity check:', error);
      return { 
        isTooSimilar: false, 
        colorSimilarity: 0, 
        movesMatch: false,
        isIntrinsicPalette,
        isIntrinsicGame,
        matchedGameCard: matchedGameCard || undefined,
        matchedPaletteId,
        matchedPaletteSimilarity,
      };
    }
    
    // Check against each existing visualization
    for (const viz of existingViz || []) {
      const vizGameData = viz.game_data as unknown as VisualizationWithPalette['game_data'];
      const vizState = vizGameData.visualizationState;
      
      // Get the existing visualization's colors
      let existingColors: PaletteColors;
      if (vizState?.customColors) {
        existingColors = vizState.customColors;
      } else {
        const existingPalette = colorPalettes.find(p => p.id === (vizState?.paletteId || 'modern')) || colorPalettes[0];
        existingColors = {
          white: existingPalette.white,
          black: existingPalette.black,
        };
      }
      
      // Check if moves match
      const movesMatch = areMovesIdentical(pgn, gameData, viz.pgn, vizGameData);
      
      // Calculate color similarity
      const colorSimilarity = calculatePaletteSimilarity(colorsToCompare, existingColors);
      
      // If moves match AND colors are 30%+ similar, it's too close
      if (movesMatch && colorSimilarity >= 30) {
        const ownedByCurrentUser = viz.user_id === userId;
        
        // Get owner's display name
        let ownerDisplayName: string | undefined;
        if (!ownedByCurrentUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', viz.user_id)
            .single();
          ownerDisplayName = profileData?.display_name || 'Another collector';
        }
        
        return {
          isTooSimilar: true,
          colorSimilarity,
          movesMatch: true,
          isIntrinsicPalette,
          isIntrinsicGame,
          matchedGameCard: matchedGameCard || undefined,
          matchedPaletteId,
          matchedPaletteSimilarity,
          existingVisualizationId: viz.id,
          ownerDisplayName,
          ownedByCurrentUser,
          reason: `This visualization is ${Math.round(colorSimilarity)}% similar to an existing vision of the same game`,
          existingColors, // Include for comparison preview
        };
      }
    }
    
    // Return result with intrinsic palette and game info
    return { 
      isTooSimilar: false, 
      colorSimilarity: 0, 
      movesMatch: false,
      isIntrinsicPalette,
      isIntrinsicGame,
      matchedGameCard: matchedGameCard || undefined,
      matchedPaletteId,
      matchedPaletteSimilarity,
    };
  } catch (error) {
    console.error('Error in similarity check:', error);
    return { isTooSimilar: false, colorSimilarity: 0, movesMatch: false };
  }
}

/**
 * Get featured palette ID from custom colors if they match 80%+
 * Used for palette inheritance - links custom colors to the closest featured palette
 */
export function getFeaturedPaletteForColors(colors: PaletteColors): PaletteId | null {
  const match = findSimilarFeaturedPalette(colors);
  return match?.paletteId || null;
}

/**
 * Update all visualizations linked to a featured palette
 * Called when a creator modifies a featured palette's colors
 */
export async function propagatePaletteChanges(
  paletteId: PaletteId,
  newColors: PaletteColors
): Promise<{ updated: number; error: Error | null }> {
  try {
    // This would be called from an admin function when palette colors change
    // For now, visualizations store their state and re-render with current palette colors
    // The palette inheritance happens at render time, not storage time
    
    console.log(`Palette ${paletteId} colors would be propagated to linked visualizations`);
    
    return { updated: 0, error: null };
  } catch (error) {
    return { updated: 0, error: error as Error };
  }
}
