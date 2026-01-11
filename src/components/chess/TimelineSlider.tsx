import React, { useEffect } from 'react';
import { useTimeline } from '@/contexts/TimelineContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimelineSliderProps {
  totalMoves: number;
  moves?: string[];
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({ totalMoves, moves = [] }) => {
  const {
    currentMove,
    maxMoves,
    isPlaying,
    playbackSpeed,
    setCurrentMove,
    setMaxMoves,
    togglePlayback,
    reset,
    stepForward,
    stepBackward,
    setPlaybackSpeed,
  } = useTimeline();

  // Update max moves when totalMoves changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  const displayMove = currentMove === Infinity ? totalMoves : currentMove;
  const isAtEnd = displayMove >= totalMoves;
  const isAtStart = currentMove === 0;

  // Format move display (e.g., "Move 15" or "1. e4")
  const getMoveLabel = () => {
    if (currentMove === Infinity || currentMove >= totalMoves) {
      return 'All Moves';
    }
    if (currentMove === 0) {
      return 'Start';
    }
    const moveIndex = currentMove - 1;
    if (moves[moveIndex]) {
      const moveNum = Math.floor(moveIndex / 2) + 1;
      const isWhite = moveIndex % 2 === 0;
      return `${moveNum}.${isWhite ? '' : '..'} ${moves[moveIndex]}`;
    }
    return `Move ${currentMove}`;
  };

  // Get current player
  const getCurrentPlayer = () => {
    if (currentMove === 0 || currentMove === Infinity) return null;
    return (currentMove % 2 === 1) ? 'white' : 'black';
  };

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue >= totalMoves) {
      setCurrentMove(Infinity);
    } else {
      setCurrentMove(newValue);
    }
  };

  const speedOptions = [
    { label: '0.25x', value: 2000 },
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 500 },
    { label: '2x', value: 250 },
    { label: '4x', value: 125 },
  ];

  const currentSpeedLabel = speedOptions.find(s => s.value === playbackSpeed)?.label || '1x';
  const player = getCurrentPlayer();

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Timeline
          </span>
          {player && (
            <div className={`w-2 h-2 rounded-full ${player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
          )}
        </div>
        <div className="text-sm font-medium">
          {getMoveLabel()}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <Slider
          value={[displayMove]}
          min={0}
          max={totalMoves}
          step={1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        {/* Move markers for key positions */}
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-0.5">
          <span>Start</span>
          <span className="text-center">
            {Math.floor(totalMoves / 2)} moves
          </span>
          <span>End ({totalMoves})</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-8 w-8 p-0"
          title="Show all moves"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Step backward */}
        <Button
          variant="ghost"
          size="sm"
          onClick={stepBackward}
          disabled={isAtStart}
          className="h-8 w-8 p-0"
          title="Previous move"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play/Pause */}
        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="sm"
          onClick={togglePlayback}
          className="h-10 w-10 p-0 rounded-full"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Step forward */}
        <Button
          variant="ghost"
          size="sm"
          onClick={stepForward}
          disabled={isAtEnd}
          className="h-8 w-8 p-0"
          title="Next move"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Speed selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1 text-xs"
              title="Playback speed"
            >
              <Gauge className="h-3 w-3" />
              {currentSpeedLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {speedOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setPlaybackSpeed(option.value)}
                className={playbackSpeed === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress indicator */}
      {isPlaying && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500 transition-all duration-100"
            style={{ width: `${(displayMove / totalMoves) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default TimelineSlider;
