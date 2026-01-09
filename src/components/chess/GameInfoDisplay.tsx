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
    <div className="text-center font-serif max-w-2xl mx-auto">
      {/* Player Names */}
      <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-2">
        <span className="small-caps">{gameData.white}</span>
        <span className="mx-3 text-muted-foreground">vs</span>
        <span className="small-caps">{gameData.black}</span>
      </h1>
      
      {/* Event Name */}
      {gameData.event && gameData.event !== 'Unknown' && (
        <h2 className="text-lg md:text-xl italic text-muted-foreground mb-1">
          "{gameData.event}"
        </h2>
      )}
      
      {/* Date */}
      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
        {formatDate(gameData.date)}
      </p>
      
      {/* Move Notation */}
      <div className="text-xs text-muted-foreground leading-relaxed px-4 max-h-24 overflow-y-auto">
        {formattedMoves}
      </div>
    </div>
  );
};

export default GameInfoDisplay;
