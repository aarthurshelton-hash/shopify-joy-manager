import React from 'react';
import { GameData, formatMoves } from '@/lib/chess/gameSimulator';

interface GameInfoDisplayProps {
  gameData: GameData;
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

const GameInfoDisplay: React.FC<GameInfoDisplayProps> = ({ gameData }) => {
  const formattedMoves = formatMoves(gameData.moves);
  
  return (
    <div 
      className="text-center max-w-md mx-auto space-y-3" 
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Player Names - Bold, elegant */}
      <h1 className="text-xl md:text-2xl font-semibold tracking-wide text-stone-800">
        <span>{gameData.white}</span>
        <span className="mx-2 text-stone-400 font-normal italic text-lg">vs</span>
        <span>{gameData.black}</span>
      </h1>
      
      {/* Event Name */}
      {gameData.event && gameData.event !== 'Unknown' && (
        <h2 className="text-sm md:text-base italic text-stone-500">
          {gameData.event}
        </h2>
      )}
      
      {/* Date */}
      <p className="text-xs uppercase tracking-[0.15em] text-stone-400" style={{ fontFamily: "'Inter', sans-serif" }}>
        {formatDate(gameData.date)}
      </p>
      
      {/* Move Notation - Full display, no truncation */}
      <div 
        className="text-stone-400 leading-relaxed px-2 text-[8px]"
        style={{ 
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {formattedMoves}
      </div>
    </div>
  );
};

export default GameInfoDisplay;
