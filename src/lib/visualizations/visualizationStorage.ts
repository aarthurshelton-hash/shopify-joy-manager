import { supabase } from '@/integrations/supabase/client';
import { SimulationResult, GameData, SquareData } from '@/lib/chess/gameSimulator';
import { Json } from '@/integrations/supabase/types';
import { 
  checkVisualizationSimilarity, 
  PaletteColors,
  getFeaturedPaletteForColors
} from './similarityDetection';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';

export interface VisualizationState {
  paletteId?: string;
  darkMode?: boolean;
  currentMove?: number;
  lockedPieces?: Array<{ pieceType: string; pieceColor: string }>;
  showLegend?: boolean;
  customColors?: PaletteColors; // Store custom colors for similarity detection
  linkedPaletteId?: string; // If custom colors match a featured palette, link to it
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
 * Result of duplicate/similarity check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isTooSimilar: boolean;
  existingId?: string;
  ownedByCurrentUser?: boolean;
  ownerDisplayName?: string;
  colorSimilarity?: number;
  reason?: string;
  linkedPaletteId?: PaletteId;
  existingColors?: PaletteColors; // For color comparison preview
  isIntrinsicPalette?: boolean; // True if using a featured En Pensent palette
  isIntrinsicGame?: boolean; // True if the game matches a famous game card
  matchedGameCard?: { id: string; title: string; similarity?: number; matchType?: 'exact' | 'partial' | 'none' }; // The matched famous game
  matchedPaletteId?: PaletteId; // The matched featured palette
  matchedPaletteSimilarity?: number; // How close to the featured palette
}

/**
 * Check if a similar visualization already exists globally (any user)
 * Uses advanced similarity detection:
 * - Exact fingerprint matching for duplicates
 * - Color similarity (30%+ threshold) + move matching for "too similar"
 */
export async function checkDuplicateVisualization(
  userId: string,
  pgn: string | undefined,
  gameData: GameData,
  state?: VisualizationState
): Promise<DuplicateCheckResult> {
  try {
    const fingerprint = generateVisualizationFingerprint(pgn, gameData, state);
    
    // First check for exact duplicates
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('id, user_id, pgn, game_data');
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false, isTooSimilar: false };
    }
    
    // Check each existing visualization for an exact match
    for (const viz of data || []) {
      const existingGameData = viz.game_data as unknown as GameData & { visualizationState?: VisualizationState };
      const existingFingerprint = generateVisualizationFingerprint(
        viz.pgn || undefined,
        existingGameData,
        existingGameData.visualizationState
      );
      
      if (fingerprint === existingFingerprint) {
        const ownedByCurrentUser = viz.user_id === userId;
        
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
          isDuplicate: true,
          isTooSimilar: true,
          existingId: viz.id,
          ownedByCurrentUser,
          ownerDisplayName,
          colorSimilarity: 100,
          reason: 'Exact duplicate exists',
        };
      }
    }
    
    // Now check for similarity (30%+ color match with identical moves)
    const paletteId = (state?.paletteId || 'modern') as PaletteId;
    
    // Build custom colors if using custom palette
    let customColors: PaletteColors | undefined;
    if (state?.customColors) {
      customColors = state.customColors;
    } else if (paletteId === 'custom') {
      // Get from current custom palette
      const customPalette = colorPalettes.find(p => p.id === 'custom');
      if (customPalette) {
        customColors = {
          white: customPalette.white,
          black: customPalette.black,
        };
      }
    }
    
    const similarityResult = await checkVisualizationSimilarity(
      userId,
      pgn,
      gameData,
      paletteId,
      customColors
    );
    
    if (similarityResult.isTooSimilar) {
      return {
        isDuplicate: false,
        isTooSimilar: true,
        existingId: similarityResult.existingVisualizationId,
        ownedByCurrentUser: similarityResult.ownedByCurrentUser,
        ownerDisplayName: similarityResult.ownerDisplayName,
        colorSimilarity: similarityResult.colorSimilarity,
        reason: similarityResult.reason,
        existingColors: similarityResult.existingColors, // For comparison preview
        isIntrinsicPalette: similarityResult.isIntrinsicPalette,
        isIntrinsicGame: similarityResult.isIntrinsicGame,
        matchedGameCard: similarityResult.matchedGameCard,
        matchedPaletteId: similarityResult.matchedPaletteId,
        matchedPaletteSimilarity: similarityResult.matchedPaletteSimilarity,
      };
    }
    
    // Check if custom colors should link to a featured palette
    let linkedPaletteId: PaletteId | undefined;
    if (customColors) {
      linkedPaletteId = getFeaturedPaletteForColors(customColors) || undefined;
    }
    
    return { 
      isDuplicate: false, 
      isTooSimilar: false,
      linkedPaletteId,
      colorSimilarity: similarityResult.colorSimilarity,
      isIntrinsicPalette: similarityResult.isIntrinsicPalette,
      isIntrinsicGame: similarityResult.isIntrinsicGame,
      matchedGameCard: similarityResult.matchedGameCard,
      matchedPaletteId: similarityResult.matchedPaletteId,
      matchedPaletteSimilarity: similarityResult.matchedPaletteSimilarity,
    };
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return { isDuplicate: false, isTooSimilar: false };
  }
}

export interface SaveVisualizationResult {
  data: SavedVisualization | null;
  error: Error | null;
  isDuplicate?: boolean;
  isTooSimilar?: boolean;
  ownedByCurrentUser?: boolean;
  ownerDisplayName?: string;
  colorSimilarity?: number;
  reason?: string;
}

export async function saveVisualization(
  userId: string,
  title: string,
  simulation: SimulationResult,
  imageBlob: Blob,
  pgn?: string,
  visualizationState?: VisualizationState
): Promise<SaveVisualizationResult> {
  try {
    // Check for duplicates and similarity first (globally)
    const checkResult = await checkDuplicateVisualization(
      userId,
      pgn,
      simulation.gameData,
      visualizationState
    );
    
    // Block if exact duplicate
    if (checkResult.isDuplicate) {
      const message = checkResult.ownedByCurrentUser 
        ? 'This visualization is already in your gallery'
        : `This visualization is owned by ${checkResult.ownerDisplayName || 'another collector'}`;
      return { 
        data: null, 
        error: new Error(message),
        isDuplicate: true,
        ownedByCurrentUser: checkResult.ownedByCurrentUser,
        ownerDisplayName: checkResult.ownerDisplayName,
        colorSimilarity: 100,
      };
    }
    
    // Block if too similar (30%+ color match with same moves)
    if (checkResult.isTooSimilar) {
      const message = checkResult.ownedByCurrentUser 
        ? 'You have a very similar visualization - try changing at least 8 colors for uniqueness'
        : `This is ${Math.round(checkResult.colorSimilarity || 30)}% similar to a vision by ${checkResult.ownerDisplayName || 'another collector'}`;
      return { 
        data: null, 
        error: new Error(message),
        isTooSimilar: true,
        ownedByCurrentUser: checkResult.ownedByCurrentUser,
        ownerDisplayName: checkResult.ownerDisplayName,
        colorSimilarity: checkResult.colorSimilarity,
        reason: checkResult.reason,
      };
    }
    
    // If custom colors match a featured palette, link to it for inheritance
    const stateWithLink: VisualizationState = {
      ...visualizationState,
      linkedPaletteId: checkResult.linkedPaletteId,
    };
    
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
      // Include visualization state with palette linking for duplicate detection and inheritance
      visualizationState: stateWithLink as unknown as Json,
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
