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
  const vsText = darkMode ? 'text-stone-600' : 'text-stone-400';
  const dotText = darkMode ? 'text-stone-700' : 'text-stone-300';
  
  return (
    <div className="text-center max-w-md mx-auto space-y-3">
      {/* Player Names - Clean, modern, edgy */}
      <h1 
        className={`text-xl md:text-2xl font-bold tracking-wider uppercase ${primaryText}`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.08em' }}
      >
        <span>{gameData.white}</span>
        <span className={`mx-3 font-light lowercase text-base ${vsText}`}>vs</span>
        <span>{gameData.black}</span>
      </h1>
      
      {/* Event Name - Subtle, refined */}
      {gameData.event && gameData.event !== 'Unknown' && (
        <h2 
          className={`text-sm md:text-base font-light tracking-wide ${secondaryText}`}
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {gameData.event}
        </h2>
      )}
      
      {/* Title and Date - Minimal, sharp */}
      <p 
        className={`text-[10px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-3 ${mutedText}`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {title && <span>{title}</span>}
        {title && <span className={dotText}>•</span>}
        <span>{formatDate(gameData.date)}</span>
      </p>
      
      {/* Move Notation - Monospace for that technical edge */}
      <div 
        className={`leading-relaxed px-2 text-[8px] font-light ${mutedText}`}
        style={{ 
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          letterSpacing: '0.02em',
        }}
      >
        {formattedMoves}
      </div>
    </div>
  );
};

export default GameInfoDisplay;
