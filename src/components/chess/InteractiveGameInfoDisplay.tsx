import React, { useMemo, useCallback } from 'react';
import { GameData, formatMoves } from '@/lib/chess/gameSimulator';
import { useLegendHighlight, AnnotationType, HighlightedPiece, parseSanMove, HoveredMoveInfo } from '@/contexts/LegendHighlightContext';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface InteractiveGameInfoDisplayProps {
  gameData: GameData;
  title?: string;
  darkMode?: boolean;
}

// Format date from PGN format (YYYY.MM.DD) to display format
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Unknown' || dateStr === '????.??.??') {
    return 'Date Unknown';
  }
  
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const year = parts[0];
  const monthIndex = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateStr;
  
  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${months[monthIndex]} ${day}${getDaySuffix(day)}, ${year}`;
}

// All white pieces
const WHITE_PIECES: HighlightedPiece[] = [
  { pieceType: 'k', pieceColor: 'w' },
  { pieceType: 'q', pieceColor: 'w' },
  { pieceType: 'r', pieceColor: 'w' },
  { pieceType: 'b', pieceColor: 'w' },
  { pieceType: 'n', pieceColor: 'w' },
  { pieceType: 'p', pieceColor: 'w' },
];

// All black pieces
const BLACK_PIECES: HighlightedPiece[] = [
  { pieceType: 'k', pieceColor: 'b' },
  { pieceType: 'q', pieceColor: 'b' },
  { pieceType: 'r', pieceColor: 'b' },
  { pieceType: 'b', pieceColor: 'b' },
  { pieceType: 'n', pieceColor: 'b' },
  { pieceType: 'p', pieceColor: 'b' },
];

const InteractiveGameInfoDisplay: React.FC<InteractiveGameInfoDisplayProps> = ({ 
  gameData, 
  title, 
  darkMode = false 
}) => {
  // Try to use highlight context if available
  let highlightContext: ReturnType<typeof useLegendHighlight> | null = null;
  try {
    highlightContext = useLegendHighlight();
  } catch {
    // Context not available
  }

  const {
    lockedPieces = [],
    highlightedAnnotations = [],
    hoveredAnnotation = null,
    hoveredSquare = null,
    hoveredMove = null,
    setHoveredAnnotation,
    setHoveredMove,
    highlightedPiece,
  } = highlightContext || {
    lockedPieces: [],
    highlightedAnnotations: [],
    hoveredAnnotation: null,
    hoveredSquare: null,
    hoveredMove: null,
    setHoveredAnnotation: () => {},
    setHoveredMove: () => {},
    highlightedPiece: null,
  };

  // Get highlighted move numbers from hovered square
  const highlightedMoveNumbers = useMemo(() => {
    if (hoveredSquare?.moveNumbers && hoveredSquare.moveNumbers.length > 0) {
      return new Set(hoveredSquare.moveNumbers);
    }
    return null;
  }, [hoveredSquare]);

  // Determine if annotation should be highlighted
  const isAnnotationHighlighted = (type: AnnotationType): boolean => {
    return highlightedAnnotations.includes(type);
  };

  // Check if this annotation is currently hovered
  const isAnnotationHovered = (type: AnnotationType): boolean => {
    return hoveredAnnotation?.type === type;
  };

  // Check if we should dim this annotation (others are highlighted)
  const shouldDimAnnotation = (type: AnnotationType): boolean => {
    const hasActiveHighlight = lockedPieces.length > 0 || highlightedPiece !== null;
    if (!hasActiveHighlight) return false;
    
    // If pieces are locked, check if this annotation is in the highlighted list
    if (lockedPieces.length > 0) {
      // White player should highlight if any white piece is locked
      if (type === 'white-player') {
        return !lockedPieces.some(p => p.pieceColor === 'w');
      }
      // Black player should highlight if any black piece is locked
      if (type === 'black-player') {
        return !lockedPieces.some(p => p.pieceColor === 'b');
      }
    }
    
    // If hovering a piece, check color association
    if (highlightedPiece) {
      if (type === 'white-player') {
        return highlightedPiece.pieceColor !== 'w';
      }
      if (type === 'black-player') {
        return highlightedPiece.pieceColor !== 'b';
      }
    }
    
    return false;
  };

  const handleAnnotationHover = (type: AnnotationType) => {
    if (!setHoveredAnnotation) return;
    
    let associatedPieces: HighlightedPiece[] = [];
    
    if (type === 'white-player') {
      associatedPieces = WHITE_PIECES;
    } else if (type === 'black-player') {
      associatedPieces = BLACK_PIECES;
    }
    
    setHoveredAnnotation({ type, associatedPieces });
  };

  const handleAnnotationLeave = () => {
    if (setHoveredAnnotation) {
      setHoveredAnnotation(null);
    }
  };

  // Handle move notation hover
  const handleMoveHover = useCallback((moveIndex: number, san: string) => {
    if (!setHoveredMove) return;
    
    const isWhiteMove = moveIndex % 2 === 0;
    const parsed = parseSanMove(san, isWhiteMove);
    
    if (parsed) {
      const moveInfo: HoveredMoveInfo = {
        moveNumber: moveIndex + 1, // 1-indexed
        san,
        piece: {
          pieceType: parsed.pieceType,
          pieceColor: isWhiteMove ? 'w' : 'b',
        },
        targetSquare: parsed.targetSquare,
        isCapture: parsed.isCapture,
      };
      setHoveredMove(moveInfo);
    }
  }, [setHoveredMove]);

  const handleMoveLeave = useCallback(() => {
    if (setHoveredMove) {
      setHoveredMove(null);
    }
  }, [setHoveredMove]);
  
  // Color classes based on mode
  const primaryText = darkMode ? 'text-stone-100' : 'text-stone-800';
  const secondaryText = darkMode ? 'text-stone-400' : 'text-stone-500';
  const mutedText = darkMode ? 'text-stone-500' : 'text-stone-400';
  const vsText = darkMode ? 'text-stone-500' : 'text-stone-400';
  const dotText = darkMode ? 'text-stone-700' : 'text-stone-300';

  // Highlight styles
  const getAnnotationStyle = (type: AnnotationType) => {
    const isHighlighted = isAnnotationHighlighted(type);
    const isHovered = isAnnotationHovered(type);
    const shouldDim = shouldDimAnnotation(type);
    
    let style: React.CSSProperties = {
      transition: 'all 0.2s ease-out',
      cursor: highlightContext ? 'pointer' : 'default',
    };
    
    if (isHighlighted || isHovered) {
      const glowColor = type === 'white-player' 
        ? 'rgba(56, 189, 248, 0.4)' 
        : type === 'black-player' 
          ? 'rgba(251, 113, 133, 0.4)' 
          : 'rgba(168, 85, 247, 0.4)';
      
      style = {
        ...style,
        textShadow: `0 0 8px ${glowColor}`,
        transform: 'scale(1.02)',
      };
    }
    
    if (shouldDim) {
      style.opacity = 0.3;
    }
    
    return style;
  };

  // Render individual moves with highlighting based on hovered square or hovered move
  const renderMovesWithHighlighting = useMemo(() => {
    const moves = gameData.moves;
    if (!moves || moves.length === 0) return null;

    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < moves.length; i++) {
      const moveNumber = i + 1; // 1-indexed move number
      const isWhiteMove = i % 2 === 0;
      const displayMoveNumber = Math.floor(i / 2) + 1;
      
      // Check if this move should be highlighted from square hover
      const isHighlightedFromSquare = highlightedMoveNumbers?.has(moveNumber) ?? false;
      
      // Check if this is the currently hovered move
      const isCurrentlyHovered = hoveredMove?.moveNumber === moveNumber;
      
      const isHighlighted = isHighlightedFromSquare || isCurrentlyHovered;
      
      // Add move number for white moves
      if (isWhiteMove) {
        elements.push(
          <span key={`num-${i}`} className="text-muted-foreground/60">
            {displayMoveNumber}.{' '}
          </span>
        );
      }
      
      // Add the move with potential highlighting
      const moveStyle: React.CSSProperties = isHighlighted
        ? {
            backgroundColor: 'rgba(251, 191, 36, 0.3)',
            borderRadius: '2px',
            padding: '0 2px',
            fontWeight: 600,
            color: darkMode ? '#fbbf24' : '#d97706',
            boxShadow: '0 0 4px rgba(251, 191, 36, 0.4)',
          }
        : {};
      
      elements.push(
        <span 
          key={`move-${i}`} 
          style={moveStyle}
          className="cursor-pointer hover:bg-amber-500/20 rounded transition-colors"
          title={`Move ${moveNumber}: ${moves[i]}`}
          onMouseEnter={() => handleMoveHover(i, moves[i])}
          onMouseLeave={handleMoveLeave}
        >
          {moves[i]}
        </span>
      );
      
      // Add space after move
      elements.push(<span key={`space-${i}`}> </span>);
    }
    
    return elements;
  }, [gameData.moves, highlightedMoveNumbers, darkMode, hoveredMove, handleMoveHover, handleMoveLeave]);

  // Determine if there are highlighted moves (for summary display)
  const hasHighlightedMoves = highlightedMoveNumbers && highlightedMoveNumbers.size > 0;
  
  return (
    <div className="text-center max-w-md mx-auto space-y-3">
      {/* Player Names - Cinzel inspired, elegant serif */}
      <h1 
        className={`text-xl md:text-2xl font-semibold tracking-wide ${primaryText}`}
        style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
      >
        <span 
          style={getAnnotationStyle('white-player')}
          onMouseEnter={() => handleAnnotationHover('white-player')}
          onMouseLeave={handleAnnotationLeave}
          className={`inline-block ${isAnnotationHighlighted('white-player') ? 'ring-2 ring-sky-400/50 rounded px-1' : ''}`}
        >
          {gameData.white}
        </span>
        <span className={`mx-2 font-normal italic text-lg ${vsText}`} style={{ fontFamily: "'Cormorant', Georgia, serif" }}>vs</span>
        <span 
          style={getAnnotationStyle('black-player')}
          onMouseEnter={() => handleAnnotationHover('black-player')}
          onMouseLeave={handleAnnotationLeave}
          className={`inline-block ${isAnnotationHighlighted('black-player') ? 'ring-2 ring-rose-400/50 rounded px-1' : ''}`}
        >
          {gameData.black}
        </span>
      </h1>
      
      {/* Event Name - Elegant italic serif */}
      {gameData.event && gameData.event !== 'Unknown' && (
        <h2 
          className={`text-sm md:text-base italic ${secondaryText}`}
          style={{ fontFamily: "'Cormorant', Georgia, serif" }}
        >
          {gameData.event}
        </h2>
      )}
      
      {/* Title and Date - Clean sans-serif */}
      <p 
        className={`text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 ${mutedText}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {title && <span className="font-medium">{title}</span>}
        {title && <span className={dotText}>•</span>}
        <span>{formatDate(gameData.date)}</span>
      </p>

      {/* Square hover summary - shows which moves are highlighted */}
      {hasHighlightedMoves && hoveredSquare && (
        <div 
          className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 inline-flex items-center gap-1"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <span className="font-medium">{hoveredSquare.square.toUpperCase()}</span>
          <span className="opacity-70">•</span>
          <span>{highlightedMoveNumbers!.size} move{highlightedMoveNumbers!.size !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Move Notation - Classic Times New Roman with individual move highlighting */}
      <div 
        className={`leading-relaxed px-2 text-[8px] ${mutedText}`}
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          ...(!hasHighlightedMoves ? getAnnotationStyle('move-notation') : {}),
        }}
        onMouseEnter={() => !hasHighlightedMoves && handleAnnotationHover('move-notation')}
        onMouseLeave={handleAnnotationLeave}
      >
        {renderMovesWithHighlighting}
      </div>
    </div>
  );
};

export default InteractiveGameInfoDisplay;