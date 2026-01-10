import { supabase } from '@/integrations/supabase/client';
import { SimulationResult, GameData } from '@/lib/chess/gameSimulator';
import { Json } from '@/integrations/supabase/types';

export interface SavedVisualization {
  id: string;
  user_id: string;
  title: string;
  pgn: string | null;
  game_data: GameData;
  image_path: string;
  created_at: string;
  updated_at: string;
}

export async function saveVisualization(
  userId: string,
  title: string,
  simulation: SimulationResult,
  imageBlob: Blob,
  pgn?: string
): Promise<{ data: SavedVisualization | null; error: Error | null }> {
  try {
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
    
    // Prepare game_data as Json type
    const gameDataJson: Json = {
      white: simulation.gameData.white,
      black: simulation.gameData.black,
      event: simulation.gameData.event,
      date: simulation.gameData.date,
      result: simulation.gameData.result,
      pgn: simulation.gameData.pgn,
      moves: simulation.gameData.moves,
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
