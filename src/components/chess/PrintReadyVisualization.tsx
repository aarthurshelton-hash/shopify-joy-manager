import React from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import GameInfoDisplay from './GameInfoDisplay';
import { SquareData } from '@/lib/chess/gameSimulator';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface GameData {
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  moves?: string[];
}

interface PrintReadyVisualizationProps {
  board: SquareData[][];
  gameData: GameData;
  size?: number;
  darkMode?: boolean;
  showQR?: boolean;
  qrDataUrl?: string;
  compact?: boolean; // For wall mockup - smaller text
  title?: string;
}

/**
 * The unified "trademark look" visualization that matches our premium downloads.
 * This component is used for:
 * - Wall mockup preview
 * - Print image generation (Printify)
 * - Premium downloads
 * - Order print page preview
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
}) => {
  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  
  // Scale factor for compact mode (wall mockup)
  const padding = compact ? 4 : 24;
  const boardSize = size - (padding * 2);

  // For compact mode, use simplified display
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
          <ChessBoardVisualization 
            board={board} 
            size={boardSize} 
          />
        </div>

        {/* Compact Game Info */}
        <div
          style={{
            width: '100%',
            paddingTop: 2,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ maxWidth: 70, overflow: 'hidden' }}>
            <p
              style={{
                fontSize: 4,
                fontWeight: 600,
                color: darkMode ? '#d6d3d1' : '#44403c',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'Cinzel', 'Times New Roman', serif",
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {gameData.white} vs {gameData.black}
            </p>
          </div>
          
          <img 
            src={enPensentLogo} 
            alt="" 
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              opacity: 0.8,
            }}
          />
        </div>
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
        <ChessBoardVisualization 
          board={board} 
          size={boardSize} 
        />
        
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
