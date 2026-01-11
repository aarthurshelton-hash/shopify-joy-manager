import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFavoriteGames() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's favorite games
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_games')
        .select('game_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      setFavoriteIds(new Set(data?.map(f => f.game_id) || []));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a game is favorited
  const isFavorite = useCallback((gameId: string) => {
    return favoriteIds.has(gameId);
  }, [favoriteIds]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (gameId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const isCurrentlyFavorite = favoriteIds.has(gameId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFavorite) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });

    try {
      if (isCurrentlyFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorite_games')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', gameId);

        if (error) {
          // Revert on error
          setFavoriteIds(prev => {
            const next = new Set(prev);
            next.add(gameId);
            return next;
          });
          console.error('Error removing favorite:', error);
          return false;
        }
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorite_games')
          .insert({ user_id: user.id, game_id: gameId });

        if (error) {
          // Revert on error
          setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(gameId);
            return next;
          });
          console.error('Error adding favorite:', error);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return false;
    }
  }, [user, favoriteIds]);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading,
    isAuthenticated: !!user,
  };
}
