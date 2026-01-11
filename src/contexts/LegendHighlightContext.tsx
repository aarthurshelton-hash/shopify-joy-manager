import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

interface LegendHighlightContextValue {
  highlightedPiece: HighlightedPiece | null;
  setHighlightedPiece: (piece: HighlightedPiece | null) => void;
}

const LegendHighlightContext = createContext<LegendHighlightContextValue | undefined>(undefined);

export function LegendHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPiece, setHighlightedPieceState] = useState<HighlightedPiece | null>(null);

  const setHighlightedPiece = useCallback((piece: HighlightedPiece | null) => {
    setHighlightedPieceState(piece);
  }, []);

  return (
    <LegendHighlightContext.Provider value={{ highlightedPiece, setHighlightedPiece }}>
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
