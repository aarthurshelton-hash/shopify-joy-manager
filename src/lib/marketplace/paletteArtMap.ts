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
  'japanese', 'nordic', 'artdeco', 'tropical', 'cyberpunk',
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

// Extract palette ID from game_data - checks visualizationState.paletteId
export function extractPaletteId(gameData: Record<string, unknown> | undefined): string | undefined {
  if (!gameData) return undefined;
  
  // Primary location: visualizationState.paletteId (how saveVisualization stores it)
  if (typeof gameData.visualizationState === 'object' && gameData.visualizationState !== null) {
    const vizState = gameData.visualizationState as Record<string, unknown>;
    if (typeof vizState.paletteId === 'string') return vizState.paletteId;
  }
  
  // Fallback: direct paletteId
  if (typeof gameData.paletteId === 'string') return gameData.paletteId;
  
  // Fallback: palette object
  if (typeof gameData.palette === 'object' && gameData.palette !== null) {
    const palette = gameData.palette as Record<string, unknown>;
    if (typeof palette.id === 'string') return palette.id;
  }
  
  return undefined;
}
