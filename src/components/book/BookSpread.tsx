import React from 'react';
import { CarlsenGame } from '@/lib/book/carlsenGames';

interface BookSpreadProps {
  game: CarlsenGame;
  haiku: string;
  visualizationImage?: string; // Base64 or URL
  pageNumber: number;
}

/**
 * A single spread (2 pages) for the Carlsen in Color book
 * Left page: Haiku in Times New Roman
 * Right page: En Pensent visualization
 */
export const BookSpread: React.FC<BookSpreadProps> = ({
  game,
  haiku,
  visualizationImage,
  pageNumber,
}) => {
  // Bone/off-white background color
  const boneWhite = '#F5F5DC';
  const textColor = '#2C2C2C';
  const mutedColor = '#6B6B6B';

  const haikuLines = haiku.split('\n').filter(line => line.trim());

  return (
    <div 
      className="book-spread"
      style={{
        display: 'flex',
        width: '100%',
        aspectRatio: '2 / 1.4', // Standard book spread ratio
        backgroundColor: boneWhite,
        fontFamily: "'Times New Roman', Georgia, serif",
      }}
    >
      {/* LEFT PAGE - Haiku */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {/* Page number */}
        <span 
          style={{ 
            position: 'absolute', 
            bottom: 24, 
            left: 48,
            fontSize: 12,
            color: mutedColor,
          }}
        >
          {pageNumber * 2}
        </span>

        {/* Game title */}
        <h3 
          style={{ 
            fontSize: 14, 
            fontWeight: 400,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: mutedColor,
            marginBottom: 32,
          }}
        >
          {game.title}
        </h3>

        {/* Haiku */}
        <div style={{ textAlign: 'center' }}>
          {haikuLines.map((line, i) => (
            <p 
              key={i}
              style={{
                fontSize: 24,
                fontStyle: 'italic',
                lineHeight: 2,
                margin: 0,
                color: textColor,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Game info */}
        <div 
          style={{ 
            marginTop: 48, 
            textAlign: 'center',
            color: mutedColor,
            fontSize: 12,
          }}
        >
          <p style={{ margin: 0 }}>
            {game.white} vs {game.black}
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            {game.event}, {game.year}
          </p>
        </div>
      </div>

      {/* RIGHT PAGE - Visualization */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Page number */}
        <span 
          style={{ 
            position: 'absolute', 
            bottom: 24, 
            right: 48,
            fontSize: 12,
            color: mutedColor,
          }}
        >
          {pageNumber * 2 + 1}
        </span>

        {/* Visualization placeholder or image */}
        {visualizationImage ? (
          <img 
            src={visualizationImage} 
            alt={`${game.title} visualization`}
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              objectFit: 'contain',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div 
            style={{
              width: '80%',
              aspectRatio: '1',
              backgroundColor: '#e0e0d8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mutedColor,
              fontSize: 14,
            }}
          >
            Visualization #{game.rank}
          </div>
        )}

        {/* Rank badge */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: mutedColor,
          }}
        >
          #{game.rank}
        </div>
      </div>
    </div>
  );
};

export default BookSpread;
