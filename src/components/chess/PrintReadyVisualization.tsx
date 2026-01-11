import React from 'react';
import ChessBoardVisualization from './ChessBoardVisualization';
import { SquareData } from '@/lib/chess/gameSimulator';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface GameData {
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
}

interface PrintReadyVisualizationProps {
  board: SquareData[][];
  gameData: GameData;
  size?: number;
  darkMode?: boolean;
  showQR?: boolean;
  qrDataUrl?: string;
  compact?: boolean; // For wall mockup - smaller text
}

/**
 * The unified "trademark look" visualization that matches our premium downloads.
 * This component is used for:
 * - Wall mockup preview
 * - Print image generation (Printify)
 * - Premium downloads
 */
export const PrintReadyVisualization: React.FC<PrintReadyVisualizationProps> = ({
  board,
  gameData,
  size = 300,
  darkMode = false,
  showQR = false,
  qrDataUrl,
  compact = false,
}) => {
  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const textColor = darkMode ? '#d6d3d1' : '#44403c';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  
  // Scale factor for compact mode (wall mockup)
  const scale = compact ? 0.4 : 1;
  const padding = compact ? 4 : 20;
  const fontSize = compact ? 5 : 12;
  const brandingSize = compact ? 4 : 10;
  const boardSize = size - (padding * 2);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: `${padding}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 2 : 12,
        width: 'fit-content',
        borderRadius: compact ? 1 : 4,
        border: compact ? 'none' : `1px solid ${borderColor}`,
        boxShadow: compact ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Chess Board */}
      <div style={{ position: 'relative' }}>
        <ChessBoardVisualization 
          board={board} 
          size={boardSize} 
        />
        
        {/* QR Code overlay for premium prints */}
        {showQR && qrDataUrl && !compact && (
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

      {/* Game Info Section */}
      <div
        style={{
          width: '100%',
          paddingTop: compact ? 2 : 8,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                fontSize: fontSize,
                fontWeight: 600,
                color: textColor,
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {gameData.white} vs {gameData.black}
            </p>
            <p
              style={{
                fontSize: fontSize * 0.75,
                color: mutedColor,
                margin: 0,
                marginTop: compact ? 0 : 2,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {gameData.event || 'Chess Game'} • {gameData.result || ''}
            </p>
          </div>
          
          {/* Logo */}
          <img 
            src={enPensentLogo} 
            alt="En Pensent" 
            style={{
              width: compact ? 8 : 24,
              height: compact ? 8 : 24,
              borderRadius: '50%',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Branding */}
      <p
        style={{
          fontSize: brandingSize,
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
