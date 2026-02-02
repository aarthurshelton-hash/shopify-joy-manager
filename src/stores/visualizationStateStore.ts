import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { GamePhase } from '@/contexts/TimelineContext';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';

export interface LockedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

export interface LockedSquare {
  square: string;
  pieces: LockedPiece[];
}

export interface CapturedVisualizationState {
  // Timeline state
  currentMove: number;
  selectedPhase: GamePhase;
  isPlaying: boolean;
  
  // Legend state
  lockedPieces: LockedPiece[];
  lockedSquares: LockedSquare[];
  compareMode: boolean;
  highlightedPiece: LockedPiece | null;
  
  // Display mode
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  
  // Territory mode
  showTerritory: boolean;
  showHeatmaps: boolean;
  
  // Show pieces overlay
  showPieces: boolean;
  pieceOpacity: number;
  
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
  lockedSquares: LockedSquare[];
  compareMode: boolean;
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  
  // Show pieces state (synced with visualization)
  showPieces: boolean;
  pieceOpacity: number;
  
  // Actions
  setCurrentMove: (move: number) => void;
  setSelectedPhase: (phase: GamePhase) => void;
  setLockedPieces: (pieces: LockedPiece[]) => void;
  setLockedSquares: (squares: LockedSquare[]) => void;
  setCompareMode: (mode: boolean) => void;
  setDisplayMode: (mode: 'art' | 'analysis' | 'minimal') => void;
  setDarkMode: (dark: boolean) => void;
  setShowTerritory: (show: boolean) => void;
  setShowHeatmaps: (show: boolean) => void;
  setShowPieces: (show: boolean) => void;
  setPieceOpacity: (opacity: number) => void;
  
  // Capture current state for export
  captureState: (moveHistory?: MoveHistoryEntry[]) => CapturedVisualizationState;
  
  // Restore from captured state
  restoreFromState: (state: Partial<CapturedVisualizationState>) => void;
  
  // Reset state
  resetState: () => void;
}

const initialState = {
  currentMove: Infinity,
  selectedPhase: 'all' as GamePhase,
  lockedPieces: [] as LockedPiece[],
  lockedSquares: [] as LockedSquare[],
  compareMode: false,
  displayMode: 'art' as const,
  darkMode: false,
  showTerritory: false,
  showHeatmaps: false,
  showPieces: true,
  pieceOpacity: 0.7,
};

export const useVisualizationStateStore = create<VisualizationStateStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentMove: (move) => set({ currentMove: move }),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setLockedPieces: (pieces) => set({ lockedPieces: pieces }),
      setLockedSquares: (squares) => set({ lockedSquares: squares }),
      setCompareMode: (mode) => set({ compareMode: mode }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setShowTerritory: (show) => set({ showTerritory: show }),
      setShowHeatmaps: (show) => set({ showHeatmaps: show }),
      setShowPieces: (show) => set({ showPieces: show }),
      setPieceOpacity: (opacity) => set({ pieceOpacity: opacity }),
      
      captureState: (moveHistory) => {
        const state = get();
        return {
          currentMove: state.currentMove,
          selectedPhase: state.selectedPhase,
          isPlaying: false, // Always pause for capture
          lockedPieces: [...state.lockedPieces],
          lockedSquares: [...state.lockedSquares],
          compareMode: state.compareMode,
          highlightedPiece: null,
          displayMode: state.displayMode,
          darkMode: state.darkMode,
          showTerritory: state.showTerritory,
          showHeatmaps: state.showHeatmaps,
          showPieces: state.showPieces,
          pieceOpacity: state.pieceOpacity,
          moveHistory,
          capturedAt: new Date(),
        };
      },
      
      restoreFromState: (state) => {
        set({
          currentMove: state.currentMove ?? initialState.currentMove,
          selectedPhase: state.selectedPhase ?? initialState.selectedPhase,
          lockedPieces: state.lockedPieces ?? initialState.lockedPieces,
          lockedSquares: state.lockedSquares ?? initialState.lockedSquares,
          compareMode: state.compareMode ?? initialState.compareMode,
          displayMode: state.displayMode ?? initialState.displayMode,
          darkMode: state.darkMode ?? initialState.darkMode,
          showTerritory: state.showTerritory ?? initialState.showTerritory,
          showHeatmaps: state.showHeatmaps ?? initialState.showHeatmaps,
          showPieces: state.showPieces ?? initialState.showPieces,
          pieceOpacity: state.pieceOpacity ?? initialState.pieceOpacity,
        });
      },
      
      resetState: () => set(initialState),
    }),
    {
      name: 'en-pensent-visualization-state',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Persist display preferences and current state
        currentMove: state.currentMove,
        selectedPhase: state.selectedPhase,
        lockedPieces: state.lockedPieces,
        lockedSquares: state.lockedSquares,
        compareMode: state.compareMode,
        displayMode: state.displayMode,
        darkMode: state.darkMode,
        showTerritory: state.showTerritory,
        showHeatmaps: state.showHeatmaps,
        showPieces: state.showPieces,
        pieceOpacity: state.pieceOpacity,
      }),
    }
  )
);