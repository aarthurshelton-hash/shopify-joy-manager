// Map palette IDs to their corresponding AI-generated art images
import artdecoArt from '@/assets/palettes/artdeco.jpg';
import autumnArt from '@/assets/palettes/autumn.jpg';
import cosmicArt from '@/assets/palettes/cosmic.jpg';
import cyberpunkArt from '@/assets/palettes/cyberpunk.jpg';
import desertArt from '@/assets/palettes/desert.jpg';
import egyptianArt from '@/assets/palettes/egyptian.jpg';
import greyscaleArt from '@/assets/palettes/greyscale.jpg';
import hotcoldArt from '@/assets/palettes/hotcold.jpg';
import japaneseArt from '@/assets/palettes/japanese.jpg';
import medievalArt from '@/assets/palettes/medieval.jpg';
import modernArt from '@/assets/palettes/modern.jpg';
import nordicArt from '@/assets/palettes/nordic.jpg';
import oceanArt from '@/assets/palettes/ocean.jpg';
import romanArt from '@/assets/palettes/roman.jpg';
import tropicalArt from '@/assets/palettes/tropical.jpg';
import vintageArt from '@/assets/palettes/vintage.jpg';
import { colorPalettes, PaletteId, PieceType } from '@/lib/chess/pieceColors';

export const paletteArtMap: Record<string, string> = {
  hotCold: hotcoldArt,
  medieval: medievalArt,
  egyptian: egyptianArt,
  roman: romanArt,
  modern: modernArt,
  greyscale: greyscaleArt,
  japanese: japaneseArt,
  nordic: nordicArt,
  artdeco: artdecoArt,
  tropical: tropicalArt,
  cyberpunk: cyberpunkArt,
  autumn: autumnArt,
  ocean: oceanArt,
  desert: desertArt,
  cosmic: cosmicArt,
  vintage: vintageArt,
};

// Human-readable palette names
export const paletteDisplayNames: Record<string, string> = {
  hotCold: 'Hot & Cold',
  medieval: 'Medieval',
  egyptian: 'Egyptian',
  roman: 'Roman Empire',
  modern: 'Modern',
  greyscale: 'Greyscale',
  japanese: 'Japanese',
  nordic: 'Nordic',
  artdeco: 'Art Deco',
  tropical: 'Tropical',
  cyberpunk: 'Cyberpunk',
  autumn: 'Autumn',
  ocean: 'Ocean',
  desert: 'Desert',
  cosmic: 'Cosmic',
  vintage: 'Vintage',
  custom: 'Custom',
};

// Premium palettes that get special visual treatment
export const premiumPaletteIds = [
  'hotCold', 'japanese', 'nordic', 'artdeco', 'tropical', 'cyberpunk',
  'autumn', 'ocean', 'desert', 'cosmic', 'vintage'
];

// All themed palettes (including base themes)
export const themedPaletteIds = [
  'hotCold', 'medieval', 'egyptian', 'roman', 'modern', 'greyscale',
  'japanese', 'nordic', 'artdeco', 'tropical', 'cyberpunk',
  'autumn', 'ocean', 'desert', 'cosmic', 'vintage'
];

export function getPaletteArt(paletteId: string | undefined): string | null {
  if (!paletteId) return null;
  return paletteArtMap[paletteId] || null;
}

export function getPaletteDisplayName(paletteId: string | undefined): string | null {
  if (!paletteId) return null;
  return paletteDisplayNames[paletteId] || null;
}

export function isPremiumPalette(paletteId: string | undefined): boolean {
  if (!paletteId) return false;
  return premiumPaletteIds.includes(paletteId);
}

export function isThemedPalette(paletteId: string | undefined): boolean {
  if (!paletteId) return false;
  return themedPaletteIds.includes(paletteId);
}

/**
 * Detect palette from actual board color data
 * This is the "genius" system: when pieces don't move, no color appears on their starting square.
 * We detect the palette by analyzing the colors that ARE present on the board.
 */
function detectPaletteFromBoardColors(board: unknown): string | undefined {
  if (!Array.isArray(board) || board.length !== 8) return undefined;
  
  // Collect all unique colors from the board
  const colorsFound = new Set<string>();
  
  for (const row of board) {
    if (!Array.isArray(row)) continue;
    for (const square of row) {
      if (!square || typeof square !== 'object') continue;
      const visits = (square as { visits?: Array<{ hexColor?: string }> }).visits;
      if (!Array.isArray(visits)) continue;
      
      for (const visit of visits) {
        if (visit && typeof visit.hexColor === 'string') {
          // Normalize to uppercase for comparison
          colorsFound.add(visit.hexColor.toUpperCase());
        }
      }
    }
  }
  
  if (colorsFound.size === 0) return undefined;
  
  // Check each palette for color matches
  // A palette is considered a match if ALL colors found on the board belong to that palette
  let bestMatch: { paletteId: string; matchCount: number } | null = null;
  
  for (const palette of colorPalettes) {
    if (palette.id === 'custom') continue;
    
    // Build set of all colors in this palette
    const paletteColors = new Set<string>();
    for (const pieceType of ['k', 'q', 'r', 'b', 'n', 'p'] as PieceType[]) {
      paletteColors.add(palette.white[pieceType].toUpperCase());
      paletteColors.add(palette.black[pieceType].toUpperCase());
    }
    
    // Count how many board colors match this palette
    let matchCount = 0;
    let allMatch = true;
    
    for (const color of colorsFound) {
      if (paletteColors.has(color)) {
        matchCount++;
      } else {
        allMatch = false;
      }
    }
    
    // If all colors match OR we have a high match count, consider this palette
    // We use 70% threshold because some pieces may not have moved (intentional noise reduction)
    const matchPercentage = colorsFound.size > 0 ? (matchCount / colorsFound.size) * 100 : 0;
    
    if (allMatch && matchCount > 0) {
      // Perfect match - all board colors belong to this palette
      return palette.id;
    }
    
    if (matchPercentage >= 70 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = { paletteId: palette.id, matchCount };
    }
  }
  
  return bestMatch?.paletteId;
}

// Extract palette ID from game_data - checks visualizationState.paletteId first, then detects from board colors
export function extractPaletteId(gameData: Record<string, unknown> | undefined): string | undefined {
  if (!gameData) return undefined;
  
  // Primary location: visualizationState.paletteId (how saveVisualization stores it)
  if (typeof gameData.visualizationState === 'object' && gameData.visualizationState !== null) {
    const vizState = gameData.visualizationState as Record<string, unknown>;
    if (typeof vizState.paletteId === 'string' && vizState.paletteId !== 'custom') {
      return vizState.paletteId;
    }
    // Check for linked palette (custom colors matching a featured palette)
    if (typeof vizState.linkedPaletteId === 'string') {
      return vizState.linkedPaletteId;
    }
  }
  
  // Fallback: direct paletteId
  if (typeof gameData.paletteId === 'string' && gameData.paletteId !== 'custom') {
    return gameData.paletteId;
  }
  
  // Fallback: palette object
  if (typeof gameData.palette === 'object' && gameData.palette !== null) {
    const palette = gameData.palette as Record<string, unknown>;
    if (typeof palette.id === 'string' && palette.id !== 'custom') {
      return palette.id;
    }
  }
  
  // Advanced detection: analyze actual board colors to detect palette
  // This handles cases where paletteId wasn't stored properly or pieces didn't move
  if (gameData.board) {
    const detectedPalette = detectPaletteFromBoardColors(gameData.board);
    if (detectedPalette) {
      return detectedPalette;
    }
  }
  
  return undefined;
}
