import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

export interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

interface LegendHighlightContextValue {
  highlightedPiece: HighlightedPiece | null;
  lockedPiece: HighlightedPiece | null;
  setHighlightedPiece: (piece: HighlightedPiece | null) => void;
  toggleLockedPiece: (piece: HighlightedPiece) => void;
  clearLock: () => void;
}

const LegendHighlightContext = createContext<LegendHighlightContextValue | undefined>(undefined);

export function LegendHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPiece, setHighlightedPieceState] = useState<HighlightedPiece | null>(null);
  const [lockedPiece, setLockedPiece] = useState<HighlightedPiece | null>(null);

  const setHighlightedPiece = useCallback((piece: HighlightedPiece | null) => {
    setHighlightedPieceState(piece);
  }, []);

  const toggleLockedPiece = useCallback((piece: HighlightedPiece) => {
    setLockedPiece(prev => {
      if (prev?.pieceType === piece.pieceType && prev?.pieceColor === piece.pieceColor) {
        return null; // Unlock if clicking same piece
      }
      return piece; // Lock to new piece
    });
  }, []);

  const clearLock = useCallback(() => {
    setLockedPiece(null);
  }, []);

  // Effective highlight is locked piece if set, otherwise hovered piece
  const effectiveHighlight = lockedPiece || highlightedPiece;

  return (
    <LegendHighlightContext.Provider value={{ 
      highlightedPiece: effectiveHighlight, 
      lockedPiece,
      setHighlightedPiece, 
      toggleLockedPiece,
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
