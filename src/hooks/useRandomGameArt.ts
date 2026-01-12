import { useMemo } from 'react';
import { gameImageImports } from '@/lib/chess/gameImages';

/**
 * Hook to get random game artwork for background usage
 * Returns an array of unique, randomly selected game images
 */
export function useRandomGameArt(count: number = 6): string[] {
  return useMemo(() => {
    const allImages = Object.values(gameImageImports);
    const shuffled = [...allImages].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, allImages.length));
  }, [count]);
}

/**
 * Get a single random game image
 */
export function getRandomGameArt(): string {
  const allImages = Object.values(gameImageImports);
  return allImages[Math.floor(Math.random() * allImages.length)];
}

/**
 * Get multiple random game images (non-hook version for use outside components)
 */
export function getRandomGameArts(count: number = 6): string[] {
  const allImages = Object.values(gameImageImports);
  const shuffled = [...allImages].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allImages.length));
}
