import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

export interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

// For reverse highlighting: hovering a square highlights relevant pieces
export interface HoveredSquareInfo {
  square: string;
  pieces: HighlightedPiece[]; // All pieces that have visited this square
}

// Annotation types that can be highlighted
export type AnnotationType = 
  | 'white-player'    // The white player name
  | 'black-player'    // The black player name
  | 'move-notation'   // The move notation text
  | 'result';         // The game result

// For annotation highlighting: which annotation element is hovered
export interface HoveredAnnotation {
  type: AnnotationType;
  // For annotations, specify which pieces are associated
  associatedPieces?: HighlightedPiece[];
}

interface LegendHighlightContextValue {
  highlightedPiece: HighlightedPiece | null;
  lockedPieces: HighlightedPiece[];
  compareMode: boolean;
  hoveredSquare: HoveredSquareInfo | null;
  // Annotation highlighting
  hoveredAnnotation: HoveredAnnotation | null;
  highlightedAnnotations: AnnotationType[]; // Annotations to highlight based on piece selection
  setHighlightedPiece: (piece: HighlightedPiece | null) => void;
  toggleLockedPiece: (piece: HighlightedPiece) => void;
  toggleCompareMode: () => void;
  clearLock: () => void;
  setHoveredSquare: (info: HoveredSquareInfo | null) => void;
  setHoveredAnnotation: (annotation: HoveredAnnotation | null) => void;
  setHighlightedAnnotations: (annotations: AnnotationType[]) => void;
}

const LegendHighlightContext = createContext<LegendHighlightContextValue | undefined>(undefined);

export function LegendHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPiece, setHighlightedPieceState] = useState<HighlightedPiece | null>(null);
  const [lockedPieces, setLockedPieces] = useState<HighlightedPiece[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [hoveredSquare, setHoveredSquareState] = useState<HoveredSquareInfo | null>(null);
  const [hoveredAnnotation, setHoveredAnnotationState] = useState<HoveredAnnotation | null>(null);
  const [highlightedAnnotations, setHighlightedAnnotationsState] = useState<AnnotationType[]>([]);

  const setHighlightedPiece = useCallback((piece: HighlightedPiece | null) => {
    setHighlightedPieceState(piece);
  }, []);

  const setHoveredSquare = useCallback((info: HoveredSquareInfo | null) => {
    setHoveredSquareState(info);
  }, []);

  const setHoveredAnnotation = useCallback((annotation: HoveredAnnotation | null) => {
    setHoveredAnnotationState(annotation);
  }, []);

  const setHighlightedAnnotations = useCallback((annotations: AnnotationType[]) => {
    setHighlightedAnnotationsState(annotations);
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
    setHighlightedAnnotationsState([]);
  }, []);

  return (
    <LegendHighlightContext.Provider value={{ 
      highlightedPiece: lockedPieces.length > 0 ? null : highlightedPiece, 
      lockedPieces,
      compareMode,
      hoveredSquare,
      hoveredAnnotation,
      highlightedAnnotations,
      setHighlightedPiece, 
      toggleLockedPiece,
      toggleCompareMode,
      clearLock,
      setHoveredSquare,
      setHoveredAnnotation,
      setHighlightedAnnotations,
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
