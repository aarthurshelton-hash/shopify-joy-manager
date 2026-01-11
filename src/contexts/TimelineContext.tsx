import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

export type GamePhase = 'all' | 'opening' | 'middlegame' | 'endgame';

interface PhaseRange {
  start: number;
  end: number;
}

interface TimelineContextValue {
  currentMove: number;
  maxMoves: number;
  isPlaying: boolean;
  playbackSpeed: number;
  selectedPhase: GamePhase;
  phaseRanges: Record<GamePhase, PhaseRange>;
  setCurrentMove: (move: number) => void;
  setMaxMoves: (max: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSelectedPhase: (phase: GamePhase) => void;
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);

// Calculate game phase ranges based on total moves
// Opening: first ~20% of moves (typically first 10-15 moves per side = 20-30 half-moves)
// Middlegame: ~20% to ~70% of moves
// Endgame: last ~30% of moves
function calculatePhaseRanges(totalMoves: number): Record<GamePhase, PhaseRange> {
  const openingEnd = Math.min(Math.floor(totalMoves * 0.2), 30); // Max 30 half-moves for opening
  const endgameStart = Math.max(Math.floor(totalMoves * 0.7), openingEnd + 1);
  
  return {
    all: { start: 0, end: totalMoves },
    opening: { start: 0, end: openingEnd },
    middlegame: { start: openingEnd + 1, end: endgameStart - 1 },
    endgame: { start: endgameStart, end: totalMoves },
  };
}

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentMove, setCurrentMoveState] = useState<number>(Infinity); // Infinity means "show all"
  const [maxMoves, setMaxMovesState] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per move
  const [selectedPhase, setSelectedPhaseState] = useState<GamePhase>('all');
  const [phaseRanges, setPhaseRanges] = useState<Record<GamePhase, PhaseRange>>(
    calculatePhaseRanges(0)
  );
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const setMaxMoves = useCallback((max: number) => {
    setMaxMovesState(max);
    setPhaseRanges(calculatePhaseRanges(max));
  }, []);

  const setCurrentMove = useCallback((move: number) => {
    setCurrentMoveState(move);
  }, []);

  const setSelectedPhase = useCallback((phase: GamePhase) => {
    setSelectedPhaseState(phase);
    setIsPlaying(false);
    // When selecting a phase, reset to show all moves in that phase
    setCurrentMoveState(Infinity);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    const range = phaseRanges[selectedPhase];
    // If at end, restart from beginning of phase
    setCurrentMoveState(prev => {
      if (prev >= range.end || prev === Infinity) {
        return range.start;
      }
      return Math.max(prev, range.start);
    });
  }, [phaseRanges, selectedPhase]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev) {
        const range = phaseRanges[selectedPhase];
        // Starting playback - reset if at end of phase
        setCurrentMoveState(current => {
          if (current >= range.end || current === Infinity) {
            return range.start;
          }
          return Math.max(current, range.start);
        });
      }
      return !prev;
    });
  }, [phaseRanges, selectedPhase]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentMoveState(Infinity);
  }, []);

  const stepForward = useCallback(() => {
    const range = phaseRanges[selectedPhase];
    setCurrentMoveState(prev => {
      if (prev === Infinity) return range.end;
      return Math.min(prev + 1, range.end);
    });
  }, [phaseRanges, selectedPhase]);

  const stepBackward = useCallback(() => {
    const range = phaseRanges[selectedPhase];
    setCurrentMoveState(prev => {
      if (prev === Infinity) return range.end - 1;
      if (prev <= range.start) return range.start;
      return prev - 1;
    });
  }, [phaseRanges, selectedPhase]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const range = phaseRanges[selectedPhase];

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= playbackSpeed) {
        lastUpdateRef.current = timestamp;
        
        setCurrentMoveState(prev => {
          const next = prev === Infinity ? range.start + 1 : prev + 1;
          if (next > range.end) {
            setIsPlaying(false);
            return range.end;
          }
          return next;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, phaseRanges, selectedPhase]);

  return (
    <TimelineContext.Provider value={{
      currentMove,
      maxMoves,
      isPlaying,
      playbackSpeed,
      selectedPhase,
      phaseRanges,
      setCurrentMove,
      setMaxMoves,
      play,
      pause,
      togglePlayback,
      setPlaybackSpeed,
      reset,
      stepForward,
      stepBackward,
      setSelectedPhase,
    }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}

// Helper hook to get filtered board based on timeline and phase
export function useTimelineBoard(fullBoard: any[][] | undefined, totalMoves: number) {
  const { currentMove, setMaxMoves, selectedPhase, phaseRanges } = useTimeline();
  
  // Update max moves when total changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  // If no board, return undefined
  if (!fullBoard) {
    return fullBoard;
  }

  const range = phaseRanges[selectedPhase];
  
  // Filter visits based on phase and current move
  return fullBoard.map(rank => 
    rank.map(square => ({
      ...square,
      visits: square.visits.filter((visit: any) => {
        const moveNum = visit.moveNumber;
        // Always filter by phase range
        if (moveNum < range.start || moveNum > range.end) {
          return false;
        }
        // If showing all moves in phase, include all in range
        if (currentMove === Infinity) {
          return true;
        }
        // Otherwise filter by current move
        return moveNum <= currentMove;
      })
    }))
  );
}
