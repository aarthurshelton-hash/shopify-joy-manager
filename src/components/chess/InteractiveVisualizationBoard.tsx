import React, { useCallback, useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece, HoveredSquareInfo, AnnotationType, PieceMoveArrow } from '@/contexts/LegendHighlightContext';

interface InteractiveVisualizationBoardProps {
  board: SquareData[][];
  size?: number;
  showPieces?: boolean;
  pieceOpacity?: number;
  pgn?: string;
  currentMoveNumber?: number;
  onFollowPieceActivated?: (moveNumber: number) => void;
}

// Track individual pieces with unique IDs for animation
interface TrackedPiece {
  id: string; // Unique ID like "w-Q-d1" (color-type-startSquare)
  type: string;
  color: 'w' | 'b';
  square: string;
  x: number;
  y: number;
}

// Unicode chess piece characters
const PIECE_SYMBOLS: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

// Get the current color for a visit using the active palette
function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

// Check if a visit matches any of the highlighted pieces
function visitMatchesAnyHighlight(visit: SquareVisit, highlights: HighlightedPiece[]): boolean {
  if (highlights.length === 0) return true;
  return highlights.some(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

// Check which highlight index a visit matches (for compare mode coloring)
function getMatchingHighlightIndex(visit: SquareVisit, highlights: HighlightedPiece[]): number {
  return highlights.findIndex(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

// Renders nested squares for a single board square as SVG rects
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string,
  highlightedPieces: HighlightedPiece[],
  compareMode: boolean,
  isHoveredSquare: boolean,
  isHighlightedFromLegend: boolean
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  const hasHighlight = highlightedPieces.length > 0;
  
  // Determine if this square has any matching visits
  const matchingVisits = hasHighlight 
    ? visits.filter(v => visitMatchesAnyHighlight(v, highlightedPieces))
    : visits;
  
  const hasMatchingVisit = matchingVisits.length > 0;
  
  // In compare mode, check which pieces are present
  const piece1Present = highlightedPieces.length > 0 && visits.some(
    v => v.piece === highlightedPieces[0].pieceType && v.color === highlightedPieces[0].pieceColor
  );
  const piece2Present = highlightedPieces.length > 1 && visits.some(
    v => v.piece === highlightedPieces[1].pieceType && v.color === highlightedPieces[1].pieceColor
  );
  const isOverlap = piece1Present && piece2Present;
  
  // Base dimming when highlight is active but this square doesn't match
  const shouldDim = hasHighlight && !hasMatchingVisit && !isHoveredSquare;
  
  // Draw base square
  elements.push(
    <rect
      key={`base-${x}-${y}`}
      x={x}
      y={y}
      width={squareSize}
      height={squareSize}
      fill={baseColor}
      style={{
        opacity: shouldDim ? 0.3 : 1,
        transition: 'opacity 0.2s ease-out',
      }}
    />
  );
  
  if (visits.length === 0) {
    return elements;
  }
  
  // Get unique colors in order of first appearance
  const uniqueColors: { color: string; matches: boolean; highlightIndex: number }[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    const highlightIndex = getMatchingHighlightIndex(visit, highlightedPieces);
    const matches = !hasHighlight || highlightIndex !== -1;
    const existingIndex = uniqueColors.findIndex(uc => uc.color === color);
    if (existingIndex === -1) {
      uniqueColors.push({ color, matches, highlightIndex });
    } else if (matches) {
      uniqueColors[existingIndex].matches = true;
      if (highlightIndex !== -1) {
        uniqueColors[existingIndex].highlightIndex = highlightIndex;
      }
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number; matches: boolean; highlightIndex: number }[] = [];
  
  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i].color,
      layerSize: currentSize,
      matches: uniqueColors[i].matches,
      highlightIndex: uniqueColors[i].highlightIndex,
    });
    currentSize -= sizeReduction;
    if (currentSize < squareSize * 0.1) break;
  }
  
  // Draw layers from outside in (largest first)
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const offset = (squareSize - layer.layerSize) / 2;
    
    // Determine opacity based on highlight state
    let opacity = 1;
    if (hasHighlight && !isHoveredSquare) {
      opacity = layer.matches ? 1 : 0.15;
    }
    
    elements.push(
      <rect
        key={`layer-${x}-${y}-${i}`}
        x={x + offset}
        y={y + offset}
        width={layer.layerSize}
        height={layer.layerSize}
        fill={layer.color}
        style={{
          opacity,
          transition: 'opacity 0.2s ease-out',
        }}
      />
    );
  }
  
  // Add visual effects for highlighted squares
  if ((hasHighlight && hasMatchingVisit) || isHoveredSquare) {
    const glowSize = squareSize * 0.02;
    
    if (isHoveredSquare) {
      // Square is being hovered - show amber glow
      elements.push(
        <rect
          key={`glow-hover-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.8)"
          strokeWidth={glowSize * 2}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    } else if (compareMode && highlightedPieces.length === 2) {
      // In compare mode, show different effects based on overlap
      if (isOverlap) {
        // Overlap: purple glow
        elements.push(
          <rect
            key={`glow-overlap-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(168, 85, 247, 0.8)"
            strokeWidth={glowSize * 2}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece1Present) {
        // Only piece 1: sky blue glow
        elements.push(
          <rect
            key={`glow-p1-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece2Present) {
        // Only piece 2: rose glow
        elements.push(
          <rect
            key={`glow-p2-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(251, 113, 133, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      }
    } else if (isHighlightedFromLegend) {
      // Single selection mode from legend: white glow
      elements.push(
        <rect
          key={`glow-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={glowSize}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    }
  }
  
  return elements;
};

const InteractiveVisualizationBoard: React.FC<InteractiveVisualizationBoardProps> = ({
  board,
  size = 500,
  showPieces = false,
  pieceOpacity = 0.7,
  pgn,
  currentMoveNumber,
  onFollowPieceActivated,
}) => {
  const [hoveredSquareLocal, setHoveredSquareLocal] = useState<string | null>(null);
  const [hoveredPieceSquare, setHoveredPieceSquare] = useState<string | null>(null);
  
  // Use the context hook directly - it will throw if not in provider, but that's expected
  const context = useLegendHighlight();
  
  // Extract values from context
  const lockedPieces = context.lockedPieces;
  const highlightedPiece = context.highlightedPiece;
  const compareMode = context.compareMode;
  const setHoveredSquare = context.setHoveredSquare;
  const setHighlightedAnnotations = context.setHighlightedAnnotations;
  const hoveredAnnotation = context.hoveredAnnotation;
  const hoveredSquareFromContext = context.hoveredSquare;
  const toggleLockedPiece = context.toggleLockedPiece;
  const pieceArrows = context.pieceArrows;
  const setFollowPieceData = context.setFollowPieceData;
  const setPieceArrows = context.setPieceArrows;

  // Build highlighted pieces array from context state
  const highlightedPieces = useMemo(() => {
    // If annotation is hovered, use its associated pieces
    if (hoveredAnnotation?.associatedPieces && hoveredAnnotation.associatedPieces.length > 0) {
      return hoveredAnnotation.associatedPieces;
    }
    // Combine locked pieces and hover highlight
    if (lockedPieces.length > 0) {
      return lockedPieces;
    }
    if (highlightedPiece) {
      return [highlightedPiece];
    }
    return [];
  }, [lockedPieces, highlightedPiece, hoveredAnnotation]);
  
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;

  // Calculate tracked pieces with unique IDs for animation
  const trackedPieces = useMemo((): TrackedPiece[] => {
    // Early return if pieces shouldn't be shown
    if (!showPieces) return [];
    
    // Validate PGN is a non-empty string
    if (!pgn || typeof pgn !== 'string') {
      return [];
    }
    
    const trimmedPgn = pgn.trim();
    if (trimmedPgn === '') {
      return [];
    }
    
    try {
      // First load the PGN to get all moves with verbose info
      const fullGame = new Chess();
      
      // Try to load PGN - chess.js loadPgn throws on invalid PGN in newer versions
      try {
        fullGame.loadPgn(trimmedPgn);
      } catch (pgnError) {
        // Try loading as move text without headers
        const cleanMoves = trimmedPgn.replace(/\[.*?\]/g, '').trim();
        if (cleanMoves) {
          try {
            fullGame.loadPgn(cleanMoves);
          } catch {
            console.warn('Failed to parse PGN for piece tracking');
            return [];
          }
        } else {
          return [];
        }
      }
      
      const allMovesVerbose = fullGame.history({ verbose: true });
      
      // If no moves were parsed, return empty
      if (allMovesVerbose.length === 0) {
        // This is not necessarily an error - could be starting position only
        return [];
      }
      
      // Track piece origins - each piece gets a unique ID based on starting square
      const pieceOrigins = new Map<string, string>(); // current square -> origin ID
      
      // Initialize with starting position
      const startChess = new Chess();
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const square = `${String.fromCharCode(97 + file)}${rank + 1}` as Square;
          const piece = startChess.get(square);
          if (piece) {
            const originId = `${piece.color}-${piece.type.toUpperCase()}-${square}`;
            pieceOrigins.set(square, originId);
          }
        }
      }
      
      // Replay moves to track piece movements
      const chess = new Chess();
      const moveCount = currentMoveNumber !== undefined ? currentMoveNumber : allMovesVerbose.length;
      
      for (let i = 0; i < Math.min(moveCount, allMovesVerbose.length); i++) {
        const move = allMovesVerbose[i];
        const originId = pieceOrigins.get(move.from);
        
        // Handle captures - remove captured piece
        if (move.captured) {
          pieceOrigins.delete(move.to);
        }
        
        // Move piece to new square
        if (originId) {
          pieceOrigins.delete(move.from);
          pieceOrigins.set(move.to, originId);
        }
        
        // Handle castling - move the rook too
        if (move.flags.includes('k')) { // Kingside
          const rookFrom = move.color === 'w' ? 'h1' : 'h8';
          const rookTo = move.color === 'w' ? 'f1' : 'f8';
          const rookId = pieceOrigins.get(rookFrom);
          if (rookId) {
            pieceOrigins.delete(rookFrom);
            pieceOrigins.set(rookTo, rookId);
          }
        } else if (move.flags.includes('q')) { // Queenside
          const rookFrom = move.color === 'w' ? 'a1' : 'a8';
          const rookTo = move.color === 'w' ? 'd1' : 'd8';
          const rookId = pieceOrigins.get(rookFrom);
          if (rookId) {
            pieceOrigins.delete(rookFrom);
            pieceOrigins.set(rookTo, rookId);
          }
        }
        
        // Handle promotion - update the piece type in the ID
        if (move.promotion) {
          const newId = `${move.color}-${move.promotion.toUpperCase()}-${move.from}-promoted`;
          pieceOrigins.set(move.to, newId);
        }
        
        chess.move(allMovesVerbose[i].san);
      }
      
      // Build tracked pieces array
      const pieces: TrackedPiece[] = [];
      const boardState = chess.board();
      
      for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
        const rank = 7 - rowIndex;
        for (let file = 0; file < 8; file++) {
          const piece = boardState[rowIndex]?.[file];
          if (piece) {
            const square = `${String.fromCharCode(97 + file)}${rank + 1}`;
            const originId = pieceOrigins.get(square) || `${piece.color}-${piece.type.toUpperCase()}-${square}`;
            const x = borderWidth + file * squareSize + squareSize / 2;
            const y = borderWidth + rowIndex * squareSize + squareSize / 2;
            
            pieces.push({
              id: originId,
              type: piece.type,
              color: piece.color,
              square,
              x,
              y,
            });
          }
        }
      }
      
      return pieces;
    } catch (e) {
      console.error('Error parsing PGN for pieces:', e);
      return [];
    }
  }, [showPieces, pgn, currentMoveNumber, borderWidth, squareSize]);
  
  // Calculate piece move arrows from PGN
  const calculatePieceArrows = useCallback((pieceType: string, pieceColor: 'w' | 'b'): PieceMoveArrow[] => {
    if (!pgn) return [];
    
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const allMoves = chess.history({ verbose: true });
      
      const arrows: PieceMoveArrow[] = [];
      const normalizedType = pieceType.toLowerCase();
      
      allMoves.forEach((move, index) => {
        // Match piece type (pawns are '' in move.piece)
        const moveType = move.piece;
        const isPawn = normalizedType === 'p' && moveType === 'p';
        const isOtherPiece = moveType === normalizedType;
        
        if ((isPawn || isOtherPiece) && move.color === pieceColor) {
          arrows.push({
            from: move.from,
            to: move.to,
            moveNumber: index + 1,
            pieceType: pieceType.toUpperCase() as PieceType,
            pieceColor: pieceColor as PieceColor,
            isCapture: !!move.captured,
          });
        }
      });
      
      return arrows;
    } catch (e) {
      console.error('Error calculating piece arrows:', e);
      return [];
    }
  }, [pgn]);

  // Handle piece click to highlight all squares it visited and activate follow mode
  const handlePieceClick = useCallback((pieceType: string, pieceColor: 'w' | 'b') => {
    const highlightPiece: HighlightedPiece = {
      pieceType: pieceType.toUpperCase() as PieceType,
      pieceColor: pieceColor as PieceColor,
    };
    
    // Calculate arrows for this piece
    const arrows = calculatePieceArrows(pieceType, pieceColor);
    setPieceArrows(arrows);
    
    // Set up follow piece mode
    if (arrows.length > 0) {
      const moveNumbers = arrows.map(a => a.moveNumber);
      setFollowPieceData({
        piece: highlightPiece,
        moveNumbers,
        currentIndex: 0,
      });
      
      // Notify parent to jump to first move of this piece
      if (onFollowPieceActivated) {
        onFollowPieceActivated(moveNumbers[0]);
      }
    }
    
    toggleLockedPiece(highlightPiece);
  }, [toggleLockedPiece, calculatePieceArrows, setPieceArrows, setFollowPieceData, onFollowPieceActivated]);

  // Handle piece hover
  const handlePieceHover = useCallback((square: string, pieceType: string, pieceColor: 'w' | 'b') => {
    setHoveredPieceSquare(square);
  }, []);

  const handlePieceLeave = useCallback(() => {
    setHoveredPieceSquare(null);
  }, []);

  // Get unique pieces that visited a square
  const getPiecesForSquare = useCallback((square: SquareData): HighlightedPiece[] => {
    const pieces: HighlightedPiece[] = [];
    const seen = new Set<string>();
    
    for (const visit of square.visits) {
      const key = `${visit.color}-${visit.piece}`;
      if (!seen.has(key)) {
        seen.add(key);
        pieces.push({ pieceType: visit.piece, pieceColor: visit.color });
      }
    }
    
    return pieces;
  }, []);

  // Get all move numbers associated with a square's visits
  const getMoveNumbersForSquare = useCallback((square: SquareData): number[] => {
    const moveNumbers: number[] = [];
    for (const visit of square.visits) {
      if (!moveNumbers.includes(visit.moveNumber)) {
        moveNumbers.push(visit.moveNumber);
      }
    }
    return moveNumbers.sort((a, b) => a - b);
  }, []);

  const handleSquareHover = useCallback((rank: number, file: number) => {
    const square = board[rank][file];
    const squareName = `${String.fromCharCode(97 + file)}${rank + 1}`;
    setHoveredSquareLocal(squareName);
    
    const pieces = getPiecesForSquare(square);
    const moveNumbers = getMoveNumbersForSquare(square);
    
    // Update the context with hovered square info
    setHoveredSquare({ square: squareName, pieces, moveNumbers });
    
    // Update annotation highlighting based on pieces on this square
    if (pieces.length > 0) {
      const annotations: AnnotationType[] = [];
      if (pieces.some(p => p.pieceColor === 'w')) annotations.push('white-player');
      if (pieces.some(p => p.pieceColor === 'b')) annotations.push('black-player');
      setHighlightedAnnotations(annotations);
    } else {
      setHighlightedAnnotations([]);
    }
  }, [board, setHoveredSquare, setHighlightedAnnotations, getPiecesForSquare, getMoveNumbersForSquare]);

  const handleSquareLeave = useCallback(() => {
    setHoveredSquareLocal(null);
    setHoveredSquare(null);
    setHighlightedAnnotations([]);
  }, [setHoveredSquare, setHighlightedAnnotations]);
  
  // Determine effective highlighting pieces - include pieces from hovered square for full board highlighting
  const effectiveHighlightPieces = useMemo(() => {
    // If we have locked pieces or legend hover, use those
    if (highlightedPieces.length > 0) return highlightedPieces;
    // If a square is being hovered, use the pieces from that square to highlight all their visited squares
    if (hoveredSquareFromContext?.pieces && hoveredSquareFromContext.pieces.length > 0) {
      return hoveredSquareFromContext.pieces;
    }
    return [];
  }, [highlightedPieces, hoveredSquareFromContext]);
  
  // Memoize board rendering for performance
  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex; // Flip to show rank 8 at top
      return [...Array(8)].map((_, file) => {
        const square = board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const squareName = `${String.fromCharCode(97 + file)}${rank + 1}`;
        const isHovered = hoveredSquareLocal === squareName;
        
        // Check if this square has any of the effective highlighted pieces
        const isHighlightedFromLegend = effectiveHighlightPieces.length > 0 && square.visits.some(
          v => effectiveHighlightPieces.some(h => h.pieceType === v.piece && h.pieceColor === v.color)
        );
        
        return renderNestedSquares(
          square.visits,
          x,
          y,
          squareSize,
          baseColor,
          effectiveHighlightPieces,
          compareMode,
          isHovered,
          isHighlightedFromLegend
        );
      });
    });
  }, [board, borderWidth, squareSize, effectiveHighlightPieces, compareMode, hoveredSquareLocal, hoveredAnnotation]);

  // Create invisible interaction layer for hover detection
  const interactionSquares = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex;
      return [...Array(8)].map((_, file) => {
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const square = board[rank][file];
        const hasVisits = square.visits.length > 0;
        
        return (
          <rect
            key={`interact-${rank}-${file}`}
            x={x}
            y={y}
            width={squareSize}
            height={squareSize}
            fill="transparent"
            style={{ cursor: hasVisits ? 'pointer' : 'default' }}
            onMouseEnter={() => handleSquareHover(rank, file)}
            onMouseLeave={handleSquareLeave}
            onTouchStart={(e) => {
              if (hasVisits) {
                e.stopPropagation();
                handleSquareHover(rank, file);
                // Auto-clear after 2 seconds for mobile
                setTimeout(handleSquareLeave, 2000);
              }
            }}
          />
        );
      });
    });
  }, [board, borderWidth, squareSize, handleSquareHover, handleSquareLeave]);
  
  // Render chess pieces layer with animations
  const pieceElements = useMemo(() => {
    if (!showPieces || trackedPieces.length === 0) return null;
    
    const elements: React.ReactNode[] = [];
    const fontSize = squareSize * 0.75;
    
    for (const piece of trackedPieces) {
      const pieceKey = piece.color === 'w' 
        ? piece.type.toUpperCase() 
        : piece.type.toLowerCase();
      const symbol = PIECE_SYMBOLS[pieceKey];
      
      if (!symbol) continue;
      
      // Check if this piece type is currently highlighted
      const isHighlighted = highlightedPieces.some(
        h => h.pieceType === piece.type.toUpperCase() && h.pieceColor === piece.color
      );
      const isHovered = hoveredPieceSquare === piece.square;
      
      elements.push(
        <g 
          key={piece.id}
          style={{
            transform: `translate(${piece.x}px, ${piece.y}px)`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fill={piece.color === 'w' ? '#ffffff' : '#1a1a1a'}
            stroke={piece.color === 'w' ? '#1a1a1a' : '#ffffff'}
            strokeWidth={fontSize * 0.03}
            style={{ 
              opacity: pieceOpacity,
              transition: 'opacity 0.2s ease-out, filter 0.2s ease-out',
              cursor: 'pointer',
              filter: isHighlighted 
                ? `drop-shadow(0 0 ${fontSize * 0.15}px rgba(251, 191, 36, 0.8)) drop-shadow(0 ${fontSize * 0.02}px ${fontSize * 0.04}px rgba(0,0,0,0.3))`
                : isHovered
                ? `drop-shadow(0 0 ${fontSize * 0.1}px rgba(255, 255, 255, 0.6)) drop-shadow(0 ${fontSize * 0.02}px ${fontSize * 0.04}px rgba(0,0,0,0.3))`
                : `drop-shadow(0 ${fontSize * 0.02}px ${fontSize * 0.04}px rgba(0,0,0,0.3))`,
              pointerEvents: 'none', // We use invisible rects for interaction
            }}
          >
            {symbol}
          </text>
          {/* Invisible interaction area for piece */}
          <rect
            x={-squareSize * 0.4}
            y={-squareSize * 0.4}
            width={squareSize * 0.8}
            height={squareSize * 0.8}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handlePieceClick(piece.type, piece.color);
            }}
            onMouseEnter={() => handlePieceHover(piece.square, piece.type, piece.color)}
            onMouseLeave={handlePieceLeave}
          />
        </g>
      );
    }
    
    return elements;
  }, [showPieces, trackedPieces, squareSize, pieceOpacity, highlightedPieces, hoveredPieceSquare, handlePieceClick, handlePieceHover, handlePieceLeave]);
  
  // Helper to convert square notation to coordinates
  const squareToCoords = useCallback((square: string): { x: number; y: number } => {
    const file = square.charCodeAt(0) - 97; // 'a' = 0
    const rank = parseInt(square[1]) - 1;   // '1' = 0
    const rowIndex = 7 - rank;
    return {
      x: borderWidth + file * squareSize + squareSize / 2,
      y: borderWidth + rowIndex * squareSize + squareSize / 2,
    };
  }, [borderWidth, squareSize]);

  // Render move arrows
  const arrowElements = useMemo(() => {
    if (pieceArrows.length === 0) return null;
    
    const arrows: React.ReactNode[] = [];
    const arrowWidth = squareSize * 0.08;
    const headLength = squareSize * 0.2;
    const headWidth = squareSize * 0.15;
    
    // Create arrow marker definition
    const markerId = 'arrowhead';
    
    pieceArrows.forEach((arrow, idx) => {
      const from = squareToCoords(arrow.from);
      const to = squareToCoords(arrow.to);
      
      // Calculate arrow direction
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) return;
      
      // Normalize direction
      const nx = dx / length;
      const ny = dy / length;
      
      // Shorten arrow to not overlap with piece center
      const shortenStart = squareSize * 0.15;
      const shortenEnd = squareSize * 0.25;
      
      const startX = from.x + nx * shortenStart;
      const startY = from.y + ny * shortenStart;
      const endX = to.x - nx * shortenEnd;
      const endY = to.y - ny * shortenEnd;
      
      // Calculate arrowhead points
      const headBaseX = endX - nx * headLength;
      const headBaseY = endY - ny * headLength;
      const perpX = -ny * headWidth;
      const perpY = nx * headWidth;
      
      // Color based on capture status and opacity based on move number
      const baseOpacity = 0.5 + (idx / pieceArrows.length) * 0.4;
      const color = arrow.isCapture ? 'rgba(239, 68, 68, 0.8)' : 'rgba(251, 191, 36, 0.8)';
      
      arrows.push(
        <g key={`arrow-${idx}`} style={{ opacity: baseOpacity }}>
          {/* Arrow line */}
          <line
            x1={startX}
            y1={startY}
            x2={headBaseX}
            y2={headBaseY}
            stroke={color}
            strokeWidth={arrowWidth}
            strokeLinecap="round"
          />
          {/* Arrow head */}
          <polygon
            points={`${endX},${endY} ${headBaseX + perpX},${headBaseY + perpY} ${headBaseX - perpX},${headBaseY - perpY}`}
            fill={color}
          />
          {/* Move number indicator */}
          <circle
            cx={startX}
            cy={startY}
            r={squareSize * 0.1}
            fill="rgba(0,0,0,0.7)"
            stroke={color}
            strokeWidth={1}
          />
          <text
            x={startX}
            y={startY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={squareSize * 0.12}
            fill="white"
            fontWeight="bold"
          >
            {arrow.moveNumber}
          </text>
        </g>
      );
    });
    
    return arrows;
  }, [pieceArrows, squareSize, squareToCoords]);
  
  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Border */}
      <rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill={boardColors.border}
      />
      
      {/* Board squares */}
      {boardElements}
      
      {/* Move arrows layer */}
      {arrowElements}
      
      {/* Chess pieces overlay */}
      {pieceElements}
      
      {/* Invisible interaction layer */}
      {interactionSquares}
    </svg>
  );
};

export default InteractiveVisualizationBoard;
