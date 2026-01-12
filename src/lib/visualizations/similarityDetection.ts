/**
 * Similarity Detection for Chess Visualizations
 * 
 * This module protects the uniqueness of complete visions and color palettes by:
 * 1. Detecting if colors match 30% or more AND moves match exactly
 * 2. Preventing saves of visualizations too similar to existing ones
 * 3. Supporting palette inheritance for featured palettes
 * 4. Checking against famous game cards to protect En Pensent intrinsic value
 * 5. Auto-detecting intrinsic game cards for analytics and data collection
 */

import { colorPalettes, PaletteId, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GameData } from '@/lib/chess/gameSimulator';
import { supabase } from '@/integrations/supabase/client';
import { detectGameCard, GameCardMatch } from '@/lib/chess/gameCardDetection';

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
  matchedGameCard?: { id: string; title: string; similarity?: number; matchType?: 'exact' | 'partial' | 'none' }; // The matched famous game
  existingVisualizationId?: string;
  ownerDisplayName?: string;
  ownedByCurrentUser?: boolean;
  reason?: string;
  existingColors?: PaletteColors; // For color comparison preview
}

/**
 * Check if the PGN matches any famous game card using our detection utility
 */
export function findMatchingFamousGame(pgn: string | undefined, gameData: GameData): { id: string; title: string; similarity: number; matchType: 'exact' | 'partial' | 'none' } | null {
  const pgnToCheck = pgn || gameData.pgn;
  if (!pgnToCheck && !gameData.moves?.length) return null;
  
  // Use the centralized game card detection
  const match = detectGameCard(pgnToCheck || '');
  
  if (match.isMatch && match.matchedGame) {
    return { 
      id: match.matchedGame.id, 
      title: match.matchedGame.title,
      similarity: match.similarity,
      matchType: match.matchType,
    };
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

/**
 * Generate a fingerprint for Creative Mode board data
 * Compares paint data structure rather than PGN/moves
 */
function generateCreativeBoardFingerprint(
  paintData: Map<string, Array<{ piece: string; color: string; hexColor: string }>>,
  whitePalette: Record<PieceType, string>,
  blackPalette: Record<PieceType, string>
): string {
  // Create sorted representation of paint data
  const paintEntries = Array.from(paintData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, visits]) => `${key}:${visits.map(v => `${v.piece}${v.color}${v.hexColor}`).join(',')}`);
  
  const paletteStr = Object.entries(whitePalette).sort().map(([k, v]) => `w${k}${v}`).join('') +
                     Object.entries(blackPalette).sort().map(([k, v]) => `b${k}${v}`).join('');
  
  return `creative:${paintEntries.join('|')}::${paletteStr}`;
}

/**
 * Calculate similarity between two creative board states
 * Returns percentage of matching squares (by color content)
 */
export function calculateCreativeBoardSimilarity(
  board1: Array<Array<{ visits: Array<{ hexColor: string }> }>>,
  board2: Array<Array<{ visits: Array<{ hexColor: string }> }>>
): number {
  let matchingSquares = 0;
  let totalActiveSquares = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const visits1 = board1[rank]?.[file]?.visits || [];
      const visits2 = board2[rank]?.[file]?.visits || [];
      
      // If both have visits, compare them
      if (visits1.length > 0 || visits2.length > 0) {
        totalActiveSquares++;
        
        // Compare color sets
        const colors1 = new Set(visits1.map(v => v.hexColor.toLowerCase()));
        const colors2 = new Set(visits2.map(v => v.hexColor.toLowerCase()));
        
        if (colors1.size === colors2.size) {
          let allMatch = true;
          for (const color of colors1) {
            if (!colors2.has(color)) {
              allMatch = false;
              break;
            }
          }
          if (allMatch) matchingSquares++;
        }
      }
    }
  }
  
  if (totalActiveSquares === 0) return 0;
  return (matchingSquares / totalActiveSquares) * 100;
}

export interface CreativeSimilarityResult {
  isTooSimilar: boolean;
  similarity: number;
  existingVisualizationId?: string;
  ownerDisplayName?: string;
  ownedByCurrentUser?: boolean;
  reason?: string;
}

/**
 * Check if a Creative Mode visualization is too similar to existing ones
 * Blocks save if 70%+ of painted squares match existing vision
 */
export async function checkCreativeSimilarity(
  userId: string,
  visualizationBoard: Array<Array<{ visits: Array<{ hexColor: string }> }>>,
  whitePalette: Record<PieceType, string>,
  blackPalette: Record<PieceType, string>
): Promise<CreativeSimilarityResult> {
  try {
    // Fetch all creative mode visualizations (marked by having 'Creative' as white player)
    const { data: existingViz, error } = await supabase
      .from('saved_visualizations')
      .select('id, user_id, game_data');
    
    if (error) {
      console.error('Error fetching visualizations for creative similarity check:', error);
      return { isTooSimilar: false, similarity: 0 };
    }
    
    let highestSimilarity = 0;
    let mostSimilarViz: typeof existingViz[0] | null = null;
    
    // Check against each existing visualization
    for (const viz of existingViz || []) {
      const vizGameData = viz.game_data as unknown as { 
        board?: Array<Array<{ visits: Array<{ hexColor: string }> }>>;
        gameData?: { white?: string };
      };
      
      // Only compare with saved visualizations that have board data
      if (!vizGameData.board) continue;
      
      const similarity = calculateCreativeBoardSimilarity(visualizationBoard, vizGameData.board);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarViz = viz;
      }
    }
    
    // If 70%+ similar, it's too close
    if (highestSimilarity >= 70 && mostSimilarViz) {
      const ownedByCurrentUser = mostSimilarViz.user_id === userId;
      
      let ownerDisplayName: string | undefined;
      if (!ownedByCurrentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', mostSimilarViz.user_id)
          .single();
        ownerDisplayName = profileData?.display_name || 'Another collector';
      }
      
      return {
        isTooSimilar: true,
        similarity: highestSimilarity,
        existingVisualizationId: mostSimilarViz.id,
        ownerDisplayName,
        ownedByCurrentUser,
        reason: `This design is ${Math.round(highestSimilarity)}% similar to an existing vision`,
      };
    }
    
    return { 
      isTooSimilar: false, 
      similarity: highestSimilarity,
    };
  } catch (error) {
    console.error('Error in creative similarity check:', error);
    return { isTooSimilar: false, similarity: 0 };
  }
}

/**
 * Get real-time similarity warning level for Creative Mode
 * Returns warning info without blocking (for live feedback)
 */
export async function getCreativeSimilarityWarning(
  userId: string,
  visualizationBoard: Array<Array<{ visits: Array<{ hexColor: string }> }>>
): Promise<{ level: 'none' | 'low' | 'medium' | 'high' | 'blocked'; similarity: number; ownerName?: string }> {
  try {
    const { data: existingViz, error } = await supabase
      .from('saved_visualizations')
      .select('id, user_id, game_data');
    
    if (error || !existingViz) {
      return { level: 'none', similarity: 0 };
    }
    
    let highestSimilarity = 0;
    let ownerUserId: string | null = null;
    
    for (const viz of existingViz) {
      const vizGameData = viz.game_data as unknown as { 
        board?: Array<Array<{ visits: Array<{ hexColor: string }> }>>;
      };
      
      if (!vizGameData.board) continue;
      
      const similarity = calculateCreativeBoardSimilarity(visualizationBoard, vizGameData.board);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        ownerUserId = viz.user_id;
      }
    }
    
    // Get owner name if not current user
    let ownerName: string | undefined;
    if (ownerUserId && ownerUserId !== userId && highestSimilarity >= 40) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', ownerUserId)
        .single();
      ownerName = profileData?.display_name || 'Another collector';
    }
    
    // Determine warning level
    if (highestSimilarity >= 70) {
      return { level: 'blocked', similarity: highestSimilarity, ownerName };
    } else if (highestSimilarity >= 55) {
      return { level: 'high', similarity: highestSimilarity, ownerName };
    } else if (highestSimilarity >= 40) {
      return { level: 'medium', similarity: highestSimilarity, ownerName };
    } else if (highestSimilarity >= 25) {
      return { level: 'low', similarity: highestSimilarity };
    }
    
    return { level: 'none', similarity: highestSimilarity };
  } catch (error) {
    return { level: 'none', similarity: 0 };
  }
}
