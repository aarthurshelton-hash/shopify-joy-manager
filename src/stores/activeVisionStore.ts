import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SquareData, GameData, SimulationResult } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GamePhase } from '@/contexts/TimelineContext';

/**
 * Active Vision Store - Persists the current vision experience across page refreshes
 * Uses localStorage to survive browser refresh/close
 */

export interface ActiveVisionState {
  // Route information
  route: string;
  gameHash?: string;
  paletteId?: string;
  
  // Game data for reconstruction
  pgn?: string;
  gameTitle?: string;
  
  // Visualization state
  currentMove: number;
  selectedPhase: GamePhase;
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  darkMode: boolean;
  showPieces: boolean;
  pieceOpacity: number;
  
  // Timestamps
  savedAt: number;
  expiresAt: number; // Auto-expire after 24 hours to prevent stale data
}

interface ActiveVisionStore {
  // Current active vision
  activeVision: ActiveVisionState | null;
  
  // Flag to track if we should restore on next navigation
  shouldRestoreOnMount: boolean;
  
  // Actions
  saveActiveVision: (state: Omit<ActiveVisionState, 'savedAt' | 'expiresAt'>) => void;
  clearActiveVision: () => void;
  markRestored: () => void;
  
  // Check if we have a valid vision to restore
  hasValidVision: () => boolean;
  
  // Get the restore route
  getRestoreRoute: () => string | null;
}

const VISION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useActiveVisionStore = create<ActiveVisionStore>()(
  persist(
    (set, get) => ({
      activeVision: null,
      shouldRestoreOnMount: false, // Disabled: users should always land on homepage
      
      saveActiveVision: (state) => {
        const now = Date.now();
        set({
          activeVision: {
            ...state,
            savedAt: now,
            expiresAt: now + VISION_EXPIRY_MS,
          },
          shouldRestoreOnMount: false, // Never auto-restore
        });
      },
      
      clearActiveVision: () => {
        set({ activeVision: null, shouldRestoreOnMount: false });
      },
      
      markRestored: () => {
        set({ shouldRestoreOnMount: false });
      },
      
      hasValidVision: () => {
        const { activeVision } = get();
        if (!activeVision) return false;
        
        // Check if expired
        if (Date.now() > activeVision.expiresAt) {
          set({ activeVision: null });
          return false;
        }
        
        // Must have a route
        return !!activeVision.route;
      },
      
      getRestoreRoute: () => {
        const { activeVision, hasValidVision } = get();
        if (!hasValidVision()) return null;
        return activeVision?.route || null;
      },
    }),
    {
      name: 'en-pensent-active-vision',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeVision: state.activeVision,
        shouldRestoreOnMount: state.shouldRestoreOnMount,
      }),
    }
  )
);
