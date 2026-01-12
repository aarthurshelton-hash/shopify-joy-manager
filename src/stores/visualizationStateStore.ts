import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GamePhase } from '@/contexts/TimelineContext';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';

export interface LockedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

export interface CapturedVisualizationState {
  // Timeline state
  currentMove: number;
  selectedPhase: GamePhase;
  isPlaying: boolean;
  
  // Legend state
  lockedPieces: LockedPiece[];
  compareMode: boolean;
  highlightedPiece: LockedPiece | null;
  
  // Display mode
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  
  // Territory mode
  showTerritory: boolean;
  showHeatmaps: boolean;
  
  // Move history for live games
  moveHistory?: MoveHistoryEntry[];
  
  // Captured timestamp
  capturedAt: Date;
}

interface VisualizationStateStore {
  // Current state for capturing
  currentMove: number;
  selectedPhase: GamePhase;
  lockedPieces: LockedPiece[];
  compareMode: boolean;
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  
  // Actions
  setCurrentMove: (move: number) => void;
  setSelectedPhase: (phase: GamePhase) => void;
  setLockedPieces: (pieces: LockedPiece[]) => void;
  setCompareMode: (mode: boolean) => void;
  setDisplayMode: (mode: 'art' | 'analysis' | 'minimal') => void;
  setDarkMode: (dark: boolean) => void;
  setShowTerritory: (show: boolean) => void;
  setShowHeatmaps: (show: boolean) => void;
  
  // Capture current state for export
  captureState: (moveHistory?: MoveHistoryEntry[]) => CapturedVisualizationState;
  
  // Reset state
  resetState: () => void;
}

const initialState = {
  currentMove: Infinity,
  selectedPhase: 'all' as GamePhase,
  lockedPieces: [] as LockedPiece[],
  compareMode: false,
  displayMode: 'art' as const,
  darkMode: false,
  showTerritory: false,
  showHeatmaps: false,
};

export const useVisualizationStateStore = create<VisualizationStateStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentMove: (move) => set({ currentMove: move }),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setLockedPieces: (pieces) => set({ lockedPieces: pieces }),
      setCompareMode: (mode) => set({ compareMode: mode }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setShowTerritory: (show) => set({ showTerritory: show }),
      setShowHeatmaps: (show) => set({ showHeatmaps: show }),
      
      captureState: (moveHistory) => {
        const state = get();
        return {
          currentMove: state.currentMove,
          selectedPhase: state.selectedPhase,
          isPlaying: false, // Always pause for capture
          lockedPieces: [...state.lockedPieces],
          compareMode: state.compareMode,
          highlightedPiece: null,
          displayMode: state.displayMode,
          darkMode: state.darkMode,
          showTerritory: state.showTerritory,
          showHeatmaps: state.showHeatmaps,
          moveHistory,
          capturedAt: new Date(),
        };
      },
      
      resetState: () => set(initialState),
    }),
    {
      name: 'en-pensent-visualization-state',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Persist display preferences
        displayMode: state.displayMode,
        darkMode: state.darkMode,
        showTerritory: state.showTerritory,
        showHeatmaps: state.showHeatmaps,
      }),
    }
  )
);
