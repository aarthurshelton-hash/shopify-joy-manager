import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface TimelineContextValue {
  currentMove: number;
  maxMoves: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setCurrentMove: (move: number) => void;
  setMaxMoves: (max: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentMove, setCurrentMoveState] = useState<number>(Infinity); // Infinity means "show all"
  const [maxMoves, setMaxMoves] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per move
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const setCurrentMove = useCallback((move: number) => {
    setCurrentMoveState(move);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    // If at end, restart from beginning
    setCurrentMoveState(prev => {
      if (prev >= maxMoves || prev === Infinity) {
        return 0;
      }
      return prev;
    });
  }, [maxMoves]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev) {
        // Starting playback - reset if at end
        setCurrentMoveState(current => {
          if (current >= maxMoves || current === Infinity) {
            return 0;
          }
          return current;
        });
      }
      return !prev;
    });
  }, [maxMoves]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentMoveState(Infinity);
  }, []);

  const stepForward = useCallback(() => {
    setCurrentMoveState(prev => {
      if (prev === Infinity) return maxMoves;
      return Math.min(prev + 1, maxMoves);
    });
  }, [maxMoves]);

  const stepBackward = useCallback(() => {
    setCurrentMoveState(prev => {
      if (prev === Infinity) return maxMoves - 1;
      if (prev <= 0) return 0;
      return prev - 1;
    });
  }, [maxMoves]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= playbackSpeed) {
        lastUpdateRef.current = timestamp;
        
        setCurrentMoveState(prev => {
          const next = prev === Infinity ? 1 : prev + 1;
          if (next > maxMoves) {
            setIsPlaying(false);
            return maxMoves;
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
  }, [isPlaying, playbackSpeed, maxMoves]);

  return (
    <TimelineContext.Provider value={{
      currentMove,
      maxMoves,
      isPlaying,
      playbackSpeed,
      setCurrentMove,
      setMaxMoves,
      play,
      pause,
      togglePlayback,
      setPlaybackSpeed,
      reset,
      stepForward,
      stepBackward,
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

// Helper hook to get filtered board based on timeline
export function useTimelineBoard(fullBoard: any[][] | undefined, totalMoves: number) {
  const { currentMove, setMaxMoves } = useTimeline();
  
  // Update max moves when total changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  // If showing all moves or no board, return original
  if (!fullBoard || currentMove === Infinity || currentMove >= totalMoves) {
    return fullBoard;
  }

  // Filter visits to only show up to currentMove
  return fullBoard.map(rank => 
    rank.map(square => ({
      ...square,
      visits: square.visits.filter((visit: any) => visit.moveNumber <= currentMove)
    }))
  );
}
