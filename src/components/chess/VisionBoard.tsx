import React, { useMemo, useCallback } from 'react';
import { useTimeline } from '@/contexts/TimelineContext';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import InteractiveVisualizationBoard from './InteractiveVisualizationBoard';
import InteractiveGameInfoDisplay from './InteractiveGameInfoDisplay';
import BoardCoordinateGuide from './BoardCoordinateGuide';

interface VisionBoardProps {
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  size: number;
  darkMode?: boolean;
  title?: string;
  showCoordinates?: boolean;
  showPieces?: boolean;
  pieceOpacity?: number;
  pgn?: string;
}

export const VisionBoard: React.FC<VisionBoardProps> = ({
  board,
  gameData,
  totalMoves,
  size,
  darkMode = false,
  title,
  showCoordinates = false,
  showPieces = false,
  pieceOpacity = 0.7,
  pgn,
}) => {
  const { currentMove, setCurrentMove } = useTimeline();
  
  // Ensure PGN is available - prefer prop, fallback to gameData.pgn
  const effectivePgnForBoard = useMemo(() => {
    if (pgn && typeof pgn === 'string' && pgn.trim().length > 0) {
      return pgn.trim();
    }
    if (gameData?.pgn && typeof gameData.pgn === 'string' && gameData.pgn.trim().length > 0) {
      return gameData.pgn.trim();
    }
    return '';
  }, [pgn, gameData?.pgn]);
  
  const filteredBoard = useMemo(() => {
    if (currentMove >= totalMoves) return board;
    return board.map(rank =>
      rank.map(square => ({
        ...square,
        visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
      }))
    );
  }, [board, currentMove, totalMoves]);

  // Handle follow piece activation - jump to the move
  const handleFollowPieceActivated = useCallback((moveNumber: number) => {
    setCurrentMove(moveNumber);
  }, [setCurrentMove]);

  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        width: 'fit-content',
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Chess Board - Now Interactive for square hover highlighting */}
      <div style={{ position: 'relative' }}>
        {showCoordinates && (
          <BoardCoordinateGuide size={size} position="inside" />
        )}
        <InteractiveVisualizationBoard 
          board={filteredBoard} 
          size={size}
          showPieces={showPieces}
          pieceOpacity={pieceOpacity}
          pgn={effectivePgnForBoard}
          currentMoveNumber={currentMove}
          onFollowPieceActivated={handleFollowPieceActivated}
        />
      </div>

      {/* Game Info Section - Now Interactive */}
      <div
        style={{
          width: '100%',
          paddingTop: 16,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <InteractiveGameInfoDisplay 
          gameData={gameData}
          title={title}
          darkMode={darkMode} 
        />
      </div>

      {/* Branding */}
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: mutedColor,
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        ♔ En Pensent ♚
      </p>
    </div>
  );
};
