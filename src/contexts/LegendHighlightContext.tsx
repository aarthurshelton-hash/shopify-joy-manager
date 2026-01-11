import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

export interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

interface LegendHighlightContextValue {
  highlightedPiece: HighlightedPiece | null;
  lockedPieces: HighlightedPiece[];
  compareMode: boolean;
  setHighlightedPiece: (piece: HighlightedPiece | null) => void;
  toggleLockedPiece: (piece: HighlightedPiece) => void;
  toggleCompareMode: () => void;
  clearLock: () => void;
}

const LegendHighlightContext = createContext<LegendHighlightContextValue | undefined>(undefined);

export function LegendHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPiece, setHighlightedPieceState] = useState<HighlightedPiece | null>(null);
  const [lockedPieces, setLockedPieces] = useState<HighlightedPiece[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  const setHighlightedPiece = useCallback((piece: HighlightedPiece | null) => {
    setHighlightedPieceState(piece);
  }, []);

  const toggleLockedPiece = useCallback((piece: HighlightedPiece) => {
    setLockedPieces(prev => {
      const existingIndex = prev.findIndex(
        p => p.pieceType === piece.pieceType && p.pieceColor === piece.pieceColor
      );
      
      if (existingIndex !== -1) {
        // Remove if already selected
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      if (compareMode) {
        // In compare mode, allow up to 2 pieces
        if (prev.length >= 2) {
          // Replace oldest selection
          return [prev[1], piece];
        }
        return [...prev, piece];
      } else {
        // Single selection mode
        return [piece];
      }
    });
  }, [compareMode]);

  const toggleCompareMode = useCallback(() => {
    setCompareMode(prev => {
      if (prev) {
        // Exiting compare mode - keep only first locked piece
        setLockedPieces(current => current.slice(0, 1));
      }
      return !prev;
    });
  }, []);

  const clearLock = useCallback(() => {
    setLockedPieces([]);
  }, []);

  return (
    <LegendHighlightContext.Provider value={{ 
      highlightedPiece: lockedPieces.length > 0 ? null : highlightedPiece, 
      lockedPieces,
      compareMode,
      setHighlightedPiece, 
      toggleLockedPiece,
      toggleCompareMode,
      clearLock 
    }}>
      {children}
    </LegendHighlightContext.Provider>
  );
}

export function useLegendHighlight() {
  const context = useContext(LegendHighlightContext);
  if (context === undefined) {
    throw new Error('useLegendHighlight must be used within a LegendHighlightProvider');
  }
  return context;
}
