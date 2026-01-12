import React from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { EnPensentOverlay, MoveHistoryEntry } from './EnPensentOverlay';
import { SquareData } from '@/lib/chess/gameSimulator';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { HighlightedPiece } from '@/contexts/LegendHighlightContext';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface GameData {
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  moves?: string[];
}

interface EnPensentData {
  moveHistory: MoveHistoryEntry[];
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
}

// Highlight state for export rendering
interface HighlightState {
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
}

interface PrintReadyVisualizationProps {
  // Standard simulation-based rendering
  board?: SquareData[][];
  gameData: GameData;
  size?: number;
  darkMode?: boolean;
  showQR?: boolean;
  qrDataUrl?: string;
  compact?: boolean; // For wall mockup - smaller text
  title?: string;
  
  // EnPensent live game rendering (alternative to board)
  enPensentData?: EnPensentData;
  
  // Optional highlight state for export (captures locked pieces, compare mode)
  highlightState?: HighlightState;
}

/**
 * The unified "trademark look" visualization that matches our premium downloads.
 * This component is used for:
 * - Wall mockup preview
 * - Print image generation (Printify)
 * - Premium downloads
 * - Order print page preview
 * 
 * Supports both:
 * - Simulation-based board data (SquareData[][])
 * - EnPensent live game data (MoveHistoryEntry[])
 */
export const PrintReadyVisualization: React.FC<PrintReadyVisualizationProps> = ({
  board,
  gameData,
  size = 300,
  darkMode = false,
  showQR = false,
  qrDataUrl,
  compact = false,
  title,
  enPensentData,
  highlightState,
}) => {
  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  const primaryText = darkMode ? '#e7e5e4' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';
  
  // Scale factor for compact mode (wall mockup)
  const padding = compact ? 4 : 24;
  const boardSize = size - (padding * 2);

  // Render the chess board - either EnPensent overlay or standard visualization
  const renderBoard = () => {
    if (enPensentData) {
      return (
        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          {/* Base chess grid */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
          }}>
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              return (
                <div
                  key={i}
                  style={{ backgroundColor: isLight ? '#e7e5e4' : '#78716c' }}
                />
              );
            })}
          </div>
          {/* EnPensent Overlay */}
          <EnPensentOverlay
            moveHistory={enPensentData.moveHistory}
            whitePalette={enPensentData.whitePalette}
            blackPalette={enPensentData.blackPalette}
            opacity={0.85}
            isEnabled={true}
            flipped={false}
          />
        </div>
      );
    }
    
    if (board) {
      // Convert highlight state to HighlightedPiece array for the visualization
      const overrideHighlightedPieces: HighlightedPiece[] | undefined = highlightState?.lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      }));
      
      return (
        <ChessBoardVisualization 
          board={board} 
          size={boardSize}
          overrideHighlightedPieces={overrideHighlightedPieces}
          overrideCompareMode={highlightState?.compareMode}
        />
      );
    }
    
    // Fallback: empty chess grid
    return (
      <div style={{ 
        width: boardSize, 
        height: boardSize,
        display: 'grid', 
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
      }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const isLight = (row + col) % 2 === 0;
          return (
            <div
              key={i}
              style={{ backgroundColor: isLight ? '#e7e5e4' : '#78716c' }}
            />
          );
        })}
      </div>
    );
  };

  // For compact mode (wall mockup), use simplified display
  if (compact) {
    return (
      <div
        style={{
          backgroundColor: bgColor,
          padding: `${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: 'fit-content',
          borderRadius: 1,
        }}
      >
        {/* Chess Board */}
        <div style={{ position: 'relative' }}>
          {renderBoard()}
        </div>

        {/* Compact Game Info - Trademark style */}
        <div
          style={{
            width: '100%',
            paddingTop: 2,
            borderTop: `1px solid ${borderColor}`,
            textAlign: 'center',
          }}
        >
          {/* Player Names */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ 
              fontSize: 4.5, 
              fontWeight: 600, 
              color: primaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontFamily: "'Cinzel', 'Times New Roman', serif",
            }}>
              {gameData.white}
            </span>
            <span style={{ 
              fontSize: 3, 
              color: secondaryText,
              fontStyle: 'italic',
            }}>
              vs
            </span>
            <span style={{ 
              fontSize: 4.5, 
              fontWeight: 600, 
              color: primaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontFamily: "'Cinzel', 'Times New Roman', serif",
            }}>
              {gameData.black}
            </span>
          </div>
          
          {/* Event */}
          <p style={{ 
            fontSize: 3, 
            color: mutedColor,
            margin: '1px 0 0 0',
            fontStyle: 'italic',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            {gameData.event || 'Chess Game'}
          </p>
        </div>
        
        {/* Branding footer */}
        <p style={{ 
          fontSize: 2.5, 
          color: mutedColor,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          ♔ En Pensent ♚
        </p>
      </div>
    );
  }

  // Full "trademark look" display
  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: `${padding}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        width: 'fit-content',
        borderRadius: 4,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Chess Board */}
      <div style={{ position: 'relative' }}>
        {renderBoard()}
        
        {/* QR Code overlay for premium prints */}
        {showQR && qrDataUrl && (
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              padding: 3,
              borderRadius: 4,
              border: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div style={{ position: 'relative', width: 36, height: 36 }}>
              <img 
                src={qrDataUrl} 
                alt="QR" 
                style={{ width: 36, height: 36, display: 'block' }} 
              />
              <img
                src={enPensentLogo}
                alt=""
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              />
            </div>
            <p
              style={{
                fontSize: 4,
                color: 'rgba(212, 175, 55, 0.5)',
                letterSpacing: '0.15em',
                margin: 0,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              SCAN
            </p>
          </div>
        )}
      </div>

      {/* Game Info Section - Using the same GameInfoDisplay component */}
      <div
        style={{
          width: '100%',
          paddingTop: 16,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <GameInfoDisplay 
          gameData={{
            white: gameData.white,
            black: gameData.black,
            event: gameData.event || '',
            date: gameData.date || '',
            result: gameData.result || '',
            moves: gameData.moves || [],
            pgn: '',
          }} 
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

export default PrintReadyVisualization;
