/**
 * Palette Availability Checker
 * 
 * Checks which color palettes are available or taken for a given game (PGN).
 * Shows users if a game+palette combo is already owned and by whom.
 * Uses enhanced palette detection to identify palettes even when pieces didn't move.
 */

import { supabase } from '@/integrations/supabase/client';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { extractPaletteId } from '@/lib/marketplace/paletteArtMap';

export interface PaletteAvailabilityInfo {
  paletteId: PaletteId;
  paletteName: string;
  isTaken: boolean;
  ownerDisplayName?: string;
  ownerUserId?: string;
  visualizationId?: string;
  isListedForSale: boolean;
  listingPriceCents?: number;
  isOwnedByCurrentUser: boolean;
}

export interface GamePaletteAvailability {
  availablePalettes: PaletteAvailabilityInfo[];
  takenPalettes: PaletteAvailabilityInfo[];
  totalAvailable: number;
  totalTaken: number;
}

/**
 * Normalize PGN for comparison
 */
function normalizePgn(pgn: string): string {
  return pgn
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/\([^)]*\)/g, '') // Remove variations
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\d+\.\s*/g, '')  // Remove move numbers
    .trim()
    .toLowerCase();
}

/**
 * Check palette availability for a specific game
 */
export async function getGamePaletteAvailability(
  pgn: string,
  currentUserId?: string
): Promise<GamePaletteAvailability> {
  const normalizedPgn = normalizePgn(pgn);
  
  // Fetch all visualizations that match this game's moves
  const { data: matchingViz, error } = await supabase
    .from('saved_visualizations')
    .select(`
      id,
      user_id,
      pgn,
      game_data
    `);
  
  if (error) {
    console.error('Error fetching palette availability:', error);
    return createEmptyAvailability();
  }
  
  // Find visualizations with matching PGN
  const takenPaletteMap = new Map<string, {
    ownerId: string;
    visualizationId: string;
  }>();
  
  for (const viz of matchingViz || []) {
    const vizPgn = normalizePgn(viz.pgn || '');
    if (vizPgn === normalizedPgn) {
      // Use enhanced palette detection that checks board colors when metadata is missing
      const gameData = viz.game_data as Record<string, unknown>;
      const paletteId = extractPaletteId(gameData) || 'modern';
      
      takenPaletteMap.set(paletteId, {
        ownerId: viz.user_id || '',
        visualizationId: viz.id,
      });
    }
  }
  
  // Get owner names for taken palettes
  const ownerIds = Array.from(new Set(Array.from(takenPaletteMap.values()).map(v => v.ownerId)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', ownerIds);
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
  
  // Get listing info for taken palettes
  const vizIds = Array.from(takenPaletteMap.values()).map(v => v.visualizationId);
  const { data: listings } = await supabase
    .from('visualization_listings')
    .select('visualization_id, price_cents, status')
    .in('visualization_id', vizIds)
    .eq('status', 'active');
  
  const listingMap = new Map(listings?.map(l => [l.visualization_id, l.price_cents]) || []);
  
  // Build availability info for all palettes
  const availablePalettes: PaletteAvailabilityInfo[] = [];
  const takenPalettes: PaletteAvailabilityInfo[] = [];
  
  for (const palette of colorPalettes) {
    if (palette.id === 'custom') continue; // Skip custom palette
    
    const taken = takenPaletteMap.get(palette.id);
    const info: PaletteAvailabilityInfo = {
      paletteId: palette.id,
      paletteName: palette.name,
      isTaken: !!taken,
      ownerDisplayName: taken ? (profileMap.get(taken.ownerId) || 'A Collector') : undefined,
      ownerUserId: taken?.ownerId,
      visualizationId: taken?.visualizationId,
      isListedForSale: taken ? listingMap.has(taken.visualizationId) : false,
      listingPriceCents: taken ? listingMap.get(taken.visualizationId) : undefined,
      isOwnedByCurrentUser: taken?.ownerId === currentUserId,
    };
    
    if (taken) {
      takenPalettes.push(info);
    } else {
      availablePalettes.push(info);
    }
  }
  
  return {
    availablePalettes,
    takenPalettes,
    totalAvailable: availablePalettes.length,
    totalTaken: takenPalettes.length,
  };
}

function createEmptyAvailability(): GamePaletteAvailability {
  const allPalettes = colorPalettes
    .filter(p => p.id !== 'custom')
    .map(p => ({
      paletteId: p.id,
      paletteName: p.name,
      isTaken: false,
      isListedForSale: false,
      isOwnedByCurrentUser: false,
    }));
  
  return {
    availablePalettes: allPalettes,
    takenPalettes: [],
    totalAvailable: allPalettes.length,
    totalTaken: 0,
  };
}

/**
 * Check if a specific palette is available for a game
 */
export async function isPaletteAvailableForGame(
  pgn: string,
  paletteId: PaletteId,
  currentUserId?: string
): Promise<{ available: boolean; owner?: string; visualizationId?: string; isListed?: boolean }> {
  const availability = await getGamePaletteAvailability(pgn, currentUserId);
  
  const takenInfo = availability.takenPalettes.find(p => p.paletteId === paletteId);
  
  if (!takenInfo) {
    return { available: true };
  }
  
  return {
    available: false,
    owner: takenInfo.ownerDisplayName,
    visualizationId: takenInfo.visualizationId,
    isListed: takenInfo.isListedForSale,
  };
}
