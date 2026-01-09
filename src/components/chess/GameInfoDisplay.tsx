import React, { useRef, useEffect, useState } from 'react';
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
  const movesRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(10);
  
  // Dynamically adjust font size to fit all moves without scrolling
  useEffect(() => {
    const adjustFontSize = () => {
      const container = containerRef.current;
      const movesEl = movesRef.current;
      if (!container || !movesEl) return;
      
      // Start with a reasonable font size and decrease until it fits
      let currentSize = 11; // Start slightly larger
      const minSize = 5; // Minimum readable size
      const maxHeight = 80; // Max height for moves section
      
      movesEl.style.fontSize = `${currentSize}px`;
      
      while (movesEl.scrollHeight > maxHeight && currentSize > minSize) {
        currentSize -= 0.5;
        movesEl.style.fontSize = `${currentSize}px`;
      }
      
      setFontSize(currentSize);
    };
    
    // Run after render
    const timer = setTimeout(adjustFontSize, 10);
    return () => clearTimeout(timer);
  }, [formattedMoves]);
  
  return (
    <div 
      ref={containerRef}
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
      
      {/* Move Notation - Auto-scaling font to fit without scroll */}
      <div 
        ref={movesRef}
        className="text-stone-400 leading-relaxed px-2"
        style={{ 
          fontFamily: "'Inter', sans-serif",
          fontSize: `${fontSize}px`,
          maxHeight: '80px',
          overflow: 'hidden',
        }}
      >
        {formattedMoves}
      </div>
    </div>
  );
};

export default GameInfoDisplay;
