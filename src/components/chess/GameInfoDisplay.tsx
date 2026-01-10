import React from 'react';
import { GameData, formatMoves } from '@/lib/chess/gameSimulator';

interface GameInfoDisplayProps {
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

const GameInfoDisplay: React.FC<GameInfoDisplayProps> = ({ gameData, title, darkMode = false }) => {
  const formattedMoves = formatMoves(gameData.moves);
  
  // Color classes based on mode
  const primaryText = darkMode ? 'text-stone-100' : 'text-stone-800';
  const secondaryText = darkMode ? 'text-stone-400' : 'text-stone-500';
  const mutedText = darkMode ? 'text-stone-500' : 'text-stone-400';
  const vsText = darkMode ? 'text-stone-500' : 'text-stone-400';
  const dotText = darkMode ? 'text-stone-700' : 'text-stone-300';
  
  return (
    <div className="text-center max-w-md mx-auto space-y-3">
      {/* Player Names - Cinzel inspired, elegant serif */}
      <h1 
        className={`text-xl md:text-2xl font-semibold tracking-wide ${primaryText}`}
        style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
      >
        <span>{gameData.white}</span>
        <span className={`mx-2 font-normal italic text-lg ${vsText}`} style={{ fontFamily: "'Cormorant', Georgia, serif" }}>vs</span>
        <span>{gameData.black}</span>
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
      
      {/* Move Notation - Classic Times New Roman */}
      <div 
        className={`leading-relaxed px-2 text-[8px] ${mutedText}`}
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {formattedMoves}
      </div>
    </div>
  );
};

export default GameInfoDisplay;
