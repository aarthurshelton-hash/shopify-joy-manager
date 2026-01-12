/**
 * Admin functions for managing featured palette colors
 * Includes role checking and palette override persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { PaletteId, PieceType, colorPalettes } from '@/lib/chess/pieceColors';
import { PaletteColors } from '@/lib/visualizations/similarityDetection';

export interface PaletteOverride {
  id: string;
  palette_id: string;
  white_colors: Record<PieceType, string>;
  black_colors: Record<PieceType, string>;
  modified_by: string;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Check if the current user has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in admin check:', error);
    return false;
  }
}

/**
 * Get all palette overrides
 */
export async function getPaletteOverrides(): Promise<{
  data: PaletteOverride[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('palette_overrides')
      .select('*')
      .order('palette_id');
    
    if (error) throw error;
    
    return { data: (data || []) as unknown as PaletteOverride[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get override for a specific palette
 */
export async function getPaletteOverride(paletteId: string): Promise<{
  data: PaletteOverride | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('palette_overrides')
      .select('*')
      .eq('palette_id', paletteId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return { data: data as unknown as PaletteOverride | null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Save or update a palette override
 */
export async function savePaletteOverride(
  paletteId: string,
  whiteColors: Record<PieceType, string>,
  blackColors: Record<PieceType, string>,
  userId: string
): Promise<{ error: Error | null; version: number }> {
  try {
    // Check if override already exists
    const { data: existing } = await getPaletteOverride(paletteId);
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('palette_overrides')
        .update({
          white_colors: whiteColors,
          black_colors: blackColors,
          modified_by: userId,
          version: existing.version + 1,
        })
        .eq('palette_id', paletteId);
      
      if (error) throw error;
      return { error: null, version: existing.version + 1 };
    } else {
      // Create new
      const { error } = await supabase
        .from('palette_overrides')
        .insert({
          palette_id: paletteId,
          white_colors: whiteColors,
          black_colors: blackColors,
          modified_by: userId,
          version: 1,
        });
      
      if (error) throw error;
      return { error: null, version: 1 };
    }
  } catch (error) {
    return { error: error as Error, version: 0 };
  }
}

/**
 * Delete a palette override (revert to defaults)
 */
export async function deletePaletteOverride(paletteId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('palette_overrides')
      .delete()
      .eq('palette_id', paletteId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get the effective colors for a palette (with overrides applied)
 */
export async function getEffectivePaletteColors(paletteId: PaletteId): Promise<PaletteColors> {
  // Get default colors
  const defaultPalette = colorPalettes.find(p => p.id === paletteId) || colorPalettes[0];
  
  // Check for override
  const { data: override } = await getPaletteOverride(paletteId);
  
  if (override) {
    return {
      white: override.white_colors,
      black: override.black_colors,
    };
  }
  
  return {
    white: defaultPalette.white,
    black: defaultPalette.black,
  };
}

/**
 * Count visualizations linked to a specific palette
 */
export async function countLinkedVisualizations(paletteId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('id, game_data');
    
    if (error) throw error;
    
    let count = 0;
    for (const viz of data || []) {
      const gameData = viz.game_data as { visualizationState?: { paletteId?: string; linkedPaletteId?: string } };
      const state = gameData.visualizationState;
      
      if (state?.paletteId === paletteId || state?.linkedPaletteId === paletteId) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Error counting linked visualizations:', error);
    return 0;
  }
}
