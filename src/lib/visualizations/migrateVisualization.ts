import { supabase } from '@/integrations/supabase/client';
import { simulateGame, SimulationResult } from '@/lib/chess/gameSimulator';
import { SavedVisualization } from './visualizationStorage';
import { Json } from '@/integrations/supabase/types';

/**
 * Migrate a single visualization by re-processing its PGN to generate board data
 */
export async function migrateVisualization(visualization: SavedVisualization): Promise<{
  success: boolean;
  error?: string;
}> {
  // Check if already has board data
  if (visualization.game_data.board && Array.isArray(visualization.game_data.board)) {
    return { success: true }; // Already migrated
  }
  
  // Need PGN to regenerate
  const pgn = visualization.pgn || visualization.game_data.pgn;
  if (!pgn) {
    return { success: false, error: 'No PGN data available for regeneration' };
  }
  
  try {
    // Re-simulate the game
    const simulation = simulateGame(pgn);
    
    // Build updated game_data with board included
    const updatedGameData: Json = {
      white: visualization.game_data.white || simulation.gameData.white,
      black: visualization.game_data.black || simulation.gameData.black,
      event: visualization.game_data.event || simulation.gameData.event,
      date: visualization.game_data.date || simulation.gameData.date,
      result: visualization.game_data.result || simulation.gameData.result,
      pgn: pgn,
      moves: simulation.gameData.moves,
      // Include full board data for reconstruction
      board: simulation.board as unknown as Json,
      totalMoves: simulation.totalMoves,
    };
    
    // Update the database record
    const { error } = await supabase
      .from('saved_visualizations')
      .update({ game_data: updatedGameData })
      .eq('id', visualization.id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to process PGN' 
    };
  }
}

/**
 * Migrate all visualizations for a user that are missing board data
 */
export async function migrateUserVisualizations(userId: string): Promise<{
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  // Fetch all visualizations for user
  const { data: visualizations, error } = await supabase
    .from('saved_visualizations')
    .select('*')
    .eq('user_id', userId);
  
  if (error || !visualizations) {
    result.errors.push(error?.message || 'Failed to fetch visualizations');
    return result;
  }
  
  result.total = visualizations.length;
  
  for (const viz of visualizations) {
    const typedViz = viz as unknown as SavedVisualization;
    
    // Check if needs migration (no board data)
    if (!typedViz.game_data.board || !Array.isArray(typedViz.game_data.board)) {
      const migrationResult = await migrateVisualization(typedViz);
      
      if (migrationResult.success) {
        result.migrated++;
      } else {
        result.failed++;
        if (migrationResult.error) {
          result.errors.push(`${typedViz.title}: ${migrationResult.error}`);
        }
      }
    }
  }
  
  return result;
}
