/**
 * Palette Synchronization Hook
 * 
 * Ensures palette state is synchronized between:
 * - URL parameters (?p=)
 * - Global pieceColors module state
 * - React component state
 * - Session/localStorage persistence
 * 
 * This is the SINGLE SOURCE OF TRUTH for palette state.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  setActivePalette, 
  getActivePalette, 
  PaletteId, 
  colorPalettes,
  ColorPalette,
} from '@/lib/chess/pieceColors';

interface PaletteSyncState {
  paletteId: PaletteId;
  palette: ColorPalette;
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  setPalette: (id: PaletteId) => void;
  updateUrlPalette: (id: PaletteId) => void;
}

const DEFAULT_PALETTE: PaletteId = 'modern';

/**
 * Master hook for palette synchronization across the entire application
 */
export function usePaletteSync(initialPaletteId?: string): PaletteSyncState {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const lastSyncedRef = useRef<PaletteId | null>(null);
  
  // Get palette from URL first (highest priority for shared links)
  const urlPaletteId = searchParams.get('p') as PaletteId | null;
  
  // Determine the effective palette ID with priority:
  // 1. URL parameter (for shared links)
  // 2. Initial prop (from component/route)
  // 3. Currently active global palette
  // 4. Default
  const effectivePaletteId = useMemo((): PaletteId => {
    // URL takes precedence for shared links
    if (urlPaletteId && colorPalettes.some(p => p.id === urlPaletteId)) {
      return urlPaletteId;
    }
    
    // Then initial prop
    if (initialPaletteId && colorPalettes.some(p => p.id === initialPaletteId)) {
      return initialPaletteId as PaletteId;
    }
    
    // Then current global state
    const current = getActivePalette();
    if (current && current.id !== 'hotCold') {
      return current.id;
    }
    
    return DEFAULT_PALETTE;
  }, [urlPaletteId, initialPaletteId]);
  
  // Get the full palette object
  const palette = useMemo(() => {
    return colorPalettes.find(p => p.id === effectivePaletteId) || 
           colorPalettes.find(p => p.id === DEFAULT_PALETTE)!;
  }, [effectivePaletteId]);
  
  // Sync global state when effective palette changes
  useEffect(() => {
    if (effectivePaletteId !== lastSyncedRef.current) {
      setActivePalette(effectivePaletteId);
      lastSyncedRef.current = effectivePaletteId;
    }
  }, [effectivePaletteId]);
  
  // Set palette and update all sources
  const setPalette = useCallback((id: PaletteId) => {
    // Validate palette exists
    if (!colorPalettes.some(p => p.id === id)) {
      console.warn(`[PaletteSync] Invalid palette ID: ${id}`);
      return;
    }
    
    // Update global state
    setActivePalette(id);
    lastSyncedRef.current = id;
    
    // Update URL if on a game view route
    if (location.pathname.startsWith('/g/')) {
      const newParams = new URLSearchParams(searchParams);
      if (id !== DEFAULT_PALETTE) {
        newParams.set('p', id);
      } else {
        newParams.delete('p');
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [location.pathname, searchParams, setSearchParams]);
  
  // Update only the URL palette without triggering full sync
  const updateUrlPalette = useCallback((id: PaletteId) => {
    const newParams = new URLSearchParams(searchParams);
    if (id !== DEFAULT_PALETTE) {
      newParams.set('p', id);
    } else {
      newParams.delete('p');
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  return {
    paletteId: effectivePaletteId,
    palette,
    whitePalette: palette.white,
    blackPalette: palette.black,
    setPalette,
    updateUrlPalette,
  };
}

/**
 * Read-only hook for components that just need current palette
 */
export function useCurrentPalette(): ColorPalette {
  const current = getActivePalette();
  return current;
}

/**
 * Palette validation utility
 */
export function isValidPalette(id: string | null | undefined): id is PaletteId {
  if (!id) return false;
  return colorPalettes.some(p => p.id === id);
}
