import { supabase } from '@/integrations/supabase/client';
import { SimulationResult, GameData, SquareData } from '@/lib/chess/gameSimulator';
import { Json } from '@/integrations/supabase/types';

export interface VisualizationState {
  paletteId?: string;
  darkMode?: boolean;
  currentMove?: number;
  lockedPieces?: Array<{ pieceType: string; pieceColor: string }>;
  showLegend?: boolean;
}

export interface SavedVisualization {
  id: string;
  user_id: string;
  title: string;
  pgn: string | null;
  game_data: GameData & { 
    board?: SquareData[][]; 
    totalMoves?: number;
    visualizationState?: VisualizationState;
  };
  image_path: string;
  public_share_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a hash/fingerprint of the visualization state for duplicate detection
 */
function generateVisualizationFingerprint(
  pgn: string | undefined,
  gameData: GameData,
  state?: VisualizationState
): string {
  // Create a normalized string representation of the key visualization attributes
  const pgnNormalized = (pgn || gameData.pgn || '').trim().replace(/\s+/g, ' ');
  const stateStr = state ? JSON.stringify({
    palette: state.paletteId || 'modern',
    darkMode: state.darkMode || false,
    currentMove: state.currentMove === Infinity ? 'all' : state.currentMove,
    lockedPieces: (state.lockedPieces || []).sort((a, b) => 
      `${a.pieceColor}-${a.pieceType}`.localeCompare(`${b.pieceColor}-${b.pieceType}`)
    ),
  }) : '{}';
  
  return `${pgnNormalized}::${stateStr}`;
}

/**
 * Check if a similar visualization already exists for this user
 */
export async function checkDuplicateVisualization(
  userId: string,
  pgn: string | undefined,
  gameData: GameData,
  state?: VisualizationState
): Promise<{ isDuplicate: boolean; existingId?: string }> {
  try {
    const fingerprint = generateVisualizationFingerprint(pgn, gameData, state);
    
    // Fetch user's existing visualizations
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('id, pgn, game_data')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false };
    }
    
    // Check each existing visualization for a match
    for (const viz of data || []) {
      const existingGameData = viz.game_data as unknown as GameData & { visualizationState?: VisualizationState };
      const existingFingerprint = generateVisualizationFingerprint(
        viz.pgn || undefined,
        existingGameData,
        existingGameData.visualizationState
      );
      
      if (fingerprint === existingFingerprint) {
        return { isDuplicate: true, existingId: viz.id };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return { isDuplicate: false };
  }
}

export async function saveVisualization(
  userId: string,
  title: string,
  simulation: SimulationResult,
  imageBlob: Blob,
  pgn?: string,
  visualizationState?: VisualizationState
): Promise<{ data: SavedVisualization | null; error: Error | null; isDuplicate?: boolean }> {
  try {
    // Check for duplicates first
    const { isDuplicate, existingId } = await checkDuplicateVisualization(
      userId,
      pgn,
      simulation.gameData,
      visualizationState
    );
    
    if (isDuplicate) {
      return { 
        data: null, 
        error: new Error(`This exact visualization already exists in your gallery`),
        isDuplicate: true
      };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    
    // Upload image to storage
    const { error: uploadError } = await supabase.storage
      .from('visualizations')
      .upload(filename, imageBlob, {
        contentType: 'image/png',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    
    // Get public URL for the image
    const { data: urlData } = supabase.storage
      .from('visualizations')
      .getPublicUrl(filename);
    
    // Prepare game_data as Json type - INCLUDE FULL BOARD DATA for reconstruction
    const gameDataJson: Json = {
      white: simulation.gameData.white,
      black: simulation.gameData.black,
      event: simulation.gameData.event,
      date: simulation.gameData.date,
      result: simulation.gameData.result,
      pgn: simulation.gameData.pgn,
      moves: simulation.gameData.moves,
      // Include full board data for proper reconstruction
      board: simulation.board as unknown as Json,
      totalMoves: simulation.totalMoves,
      // Include visualization state for duplicate detection
      visualizationState: visualizationState as unknown as Json,
    };
    
    // Save visualization record to database
    const { data, error } = await supabase
      .from('saved_visualizations')
      .insert({
        user_id: userId,
        title,
        pgn: pgn || null,
        game_data: gameDataJson,
        image_path: urlData.publicUrl,
      })
      .select()
      .single();
    
    if (error) {
      // Clean up uploaded image if database insert fails
      await supabase.storage.from('visualizations').remove([filename]);
      throw new Error(`Failed to save visualization: ${error.message}`);
    }
    
    return { data: data as unknown as SavedVisualization, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function getUserVisualizations(userId: string): Promise<{
  data: SavedVisualization[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch visualizations: ${error.message}`);
    }
    
    return { data: (data || []) as unknown as SavedVisualization[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function deleteVisualization(
  id: string,
  imagePath: string
): Promise<{ error: Error | null }> {
  try {
    // Extract filename from URL for deletion
    const url = new URL(imagePath);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(p => p === 'visualizations');
    const filename = pathParts.slice(bucketIndex + 1).join('/');
    
    // Delete from storage
    if (filename) {
      await supabase.storage.from('visualizations').remove([filename]);
    }
    
    // Delete from database
    const { error } = await supabase
      .from('saved_visualizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete visualization: ${error.message}`);
    }
    
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get a single visualization by ID - used for detail pages
 */
export async function getVisualizationById(id: string): Promise<{
  data: SavedVisualization | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: new Error('Visualization not found') };
      }
      throw new Error(`Failed to fetch visualization: ${error.message}`);
    }
    
    return { data: data as unknown as SavedVisualization, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
