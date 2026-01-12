import { useState, useCallback, useRef } from 'react';
import { SquareVisit } from '@/lib/chess/gameSimulator';

export interface CreativeState {
  pieceBoard: (string | null)[][];
  paintData: Map<string, SquareVisit[]>;
  moveCounter: number;
}

const MAX_HISTORY = 50;

// Serialize Map for comparison/storage
const serializeMap = (map: Map<string, SquareVisit[]>): string => {
  const obj: Record<string, SquareVisit[]> = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return JSON.stringify(obj);
};

// Clone state deeply
const cloneState = (state: CreativeState): CreativeState => ({
  pieceBoard: state.pieceBoard.map(row => [...row]),
  paintData: new Map(Array.from(state.paintData.entries()).map(([k, v]) => [k, [...v]])),
  moveCounter: state.moveCounter,
});

export const useUndoRedo = (initialState: CreativeState) => {
  const [history, setHistory] = useState<CreativeState[]>([cloneState(initialState)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastSnapshotRef = useRef<string>('');

  // Get current state
  const currentState = history[currentIndex];

  // Check if state has actually changed
  const hasStateChanged = useCallback((newState: CreativeState): boolean => {
    const newSnapshot = JSON.stringify({
      pieceBoard: newState.pieceBoard,
      paintData: serializeMap(newState.paintData),
      moveCounter: newState.moveCounter,
    });
    
    if (newSnapshot === lastSnapshotRef.current) {
      return false;
    }
    
    lastSnapshotRef.current = newSnapshot;
    return true;
  }, []);

  // Push a new state to history
  const pushState = useCallback((newState: CreativeState) => {
    if (!hasStateChanged(newState)) return;

    const clonedState = cloneState(newState);
    
    setHistory(prev => {
      // Remove any "future" states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(clonedState);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY);
      }
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [currentIndex, hasStateChanged]);

  // Undo
  const undo = useCallback((): CreativeState | null => {
    if (currentIndex <= 0) return null;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    const restoredState = cloneState(history[newIndex]);
    lastSnapshotRef.current = JSON.stringify({
      pieceBoard: restoredState.pieceBoard,
      paintData: serializeMap(restoredState.paintData),
      moveCounter: restoredState.moveCounter,
    });
    
    return restoredState;
  }, [currentIndex, history]);

  // Redo
  const redo = useCallback((): CreativeState | null => {
    if (currentIndex >= history.length - 1) return null;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    const restoredState = cloneState(history[newIndex]);
    lastSnapshotRef.current = JSON.stringify({
      pieceBoard: restoredState.pieceBoard,
      paintData: serializeMap(restoredState.paintData),
      moveCounter: restoredState.moveCounter,
    });
    
    return restoredState;
  }, [currentIndex, history]);

  // Reset history (for imports/clears)
  const resetHistory = useCallback((state: CreativeState) => {
    const clonedState = cloneState(state);
    setHistory([clonedState]);
    setCurrentIndex(0);
    lastSnapshotRef.current = JSON.stringify({
      pieceBoard: clonedState.pieceBoard,
      paintData: serializeMap(clonedState.paintData),
      moveCounter: clonedState.moveCounter,
    });
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    currentState,
    pushState,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
};
