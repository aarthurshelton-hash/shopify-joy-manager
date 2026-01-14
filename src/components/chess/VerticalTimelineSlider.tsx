import React, { useEffect, useMemo } from 'react';
import { useTimeline, GamePhase } from '@/contexts/TimelineContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { analyzeTimeline, getMomentCounts, TimelineAnalysisResult } from '@/lib/chess/timelineAnalysis';
import { TimelineMarker, PhaseButton, momentConfig, phaseConfig } from './EnhancedTimelineMarker';

interface VerticalTimelineSliderProps {
  totalMoves: number;
  moves?: string[];
  pgn?: string;
}

const VerticalTimelineSlider: React.FC<VerticalTimelineSliderProps> = ({ totalMoves, moves = [], pgn }) => {
  const {
    currentMove,
    isPlaying,
    playbackSpeed,
    selectedPhase,
    phaseRanges,
    setCurrentMove,
    setMaxMoves,
    togglePlayback,
    reset,
    stepForward,
    stepBackward,
    setPlaybackSpeed,
    setSelectedPhase,
  } = useTimeline();

  // Comprehensive timeline analysis
  const analysis: TimelineAnalysisResult | null = useMemo(() => {
    if (!pgn || moves.length === 0) return null;
    try {
      return analyzeTimeline(pgn, moves);
    } catch {
      return null;
    }
  }, [pgn, moves]);

  // Update max moves when totalMoves changes
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  const range = phaseRanges[selectedPhase];
  const displayMove = currentMove === Infinity ? range.end : Math.min(currentMove, range.end);
  const isAtEnd = displayMove >= range.end;
  const isAtStart = currentMove <= range.start || currentMove === 0;

  // Filter moments to current phase
  const visibleMoments = useMemo(() => 
    analysis?.moments.filter(m => m.moveNumber >= range.start && m.moveNumber <= range.end) || [],
    [analysis, range]
  );

  // Get phase info from analysis
  const getPhaseInfo = (phase: GamePhase) => {
    if (phase === 'all' || !analysis) return undefined;
    return analysis.phases.find(p => p.name === phase);
  };

  // Moment counts for summary
  const momentCounts = useMemo(() => getMomentCounts(visibleMoments), [visibleMoments]);

  // Format move display
  const getMoveLabel = () => {
    if (currentMove === Infinity || currentMove >= range.end) {
      if (selectedPhase === 'all') return 'All';
      return phaseConfig[selectedPhase].label;
    }
    if (currentMove === 0 || currentMove === range.start) {
      return 'Start';
    }
    const moveIndex = currentMove - 1;
    if (moves[moveIndex]) {
      const moveNum = Math.floor(moveIndex / 2) + 1;
      const isWhite = moveIndex % 2 === 0;
      return `${moveNum}.${isWhite ? '' : '..'} ${moves[moveIndex]}`;
    }
    return `${currentMove}`;
  };

  // Get current player
  const getCurrentPlayer = () => {
    if (currentMove === 0 || currentMove === Infinity) return null;
    return (currentMove % 2 === 1) ? 'white' : 'black';
  };

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue >= range.end) {
      setCurrentMove(Infinity);
    } else {
      setCurrentMove(Math.max(newValue, range.start));
    }
  };

  const handleMomentClick = (moveNumber: number) => {
    setCurrentMove(moveNumber);
  };

  const speedOptions = [
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 500 },
    { label: '2x', value: 250 },
  ];

  const currentSpeedLabel = speedOptions.find(s => s.value === playbackSpeed)?.label || '1x';
  const player = getCurrentPlayer();
  const phaseMoveCount = Math.max(range.end - range.start, 1);

  // Calculate position for a moment marker (vertical - from top)
  const getMomentPosition = (moveNumber: number) => {
    return ((moveNumber - range.start) / phaseMoveCount) * 100;
  };

  return (
    <TooltipProvider>
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 h-full flex flex-col w-[120px] min-w-[120px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Timeline
            </span>
            {player && (
              <div className={`w-2 h-2 rounded-full ${player === 'white' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            )}
          </div>
          
          {/* Current move label */}
          <div className="text-xs font-medium text-center truncate w-full">
            {getMoveLabel()}
          </div>

          {/* Accuracy display */}
          {analysis && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/30">
              <span className="text-[9px] text-muted-foreground">Accuracy</span>
              <span className={`text-xs font-bold ${
                analysis.summary.accuracy >= 90 ? 'text-green-400' :
                analysis.summary.accuracy >= 70 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.summary.accuracy}%
              </span>
            </div>
          )}
        </div>

        {/* Phase filter buttons - vertical stack with hover tooltips */}
        <div className="flex flex-col gap-1 py-3 border-b border-border/30">
          {(['all', 'opening', 'middlegame', 'endgame'] as const).map((phase) => {
            const phaseRange = phaseRanges[phase];
            const moveCount = phaseRange.end - phaseRange.start;
            
            return (
              <PhaseButton
                key={phase}
                phase={phase}
                isActive={selectedPhase === phase}
                moveCount={moveCount}
                onClick={() => setSelectedPhase(phase)}
                phaseInfo={getPhaseInfo(phase)}
                compact
              />
            );
          })}
        </div>

        {/* Key moments summary with rich tooltips */}
        {visibleMoments.length > 0 && (
          <div className="py-2 border-b border-border/30">
            <div className="text-[9px] text-muted-foreground mb-1.5 text-center">Key Moments</div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {/* Quality moves */}
              {momentCounts.brilliant > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.brilliant.color}`}>
                  <momentConfig.brilliant.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.brilliant}</span>
                </div>
              )}
              {momentCounts.great > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.great.color}`}>
                  <momentConfig.great.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.great}</span>
                </div>
              )}
              {momentCounts.blunder > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.blunder.color}`}>
                  <momentConfig.blunder.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.blunder}</span>
                </div>
              )}
              {/* Tactical */}
              {momentCounts.fork > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.fork.color}`}>
                  <momentConfig.fork.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.fork}</span>
                </div>
              )}
              {momentCounts.sacrifice > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.sacrifice.color}`}>
                  <momentConfig.sacrifice.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.sacrifice}</span>
                </div>
              )}
              {/* Events */}
              {momentCounts.checkmate > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.checkmate.color}`}>
                  <momentConfig.checkmate.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.checkmate}</span>
                </div>
              )}
              {momentCounts.check > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.check.color}`}>
                  <momentConfig.check.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.check}</span>
                </div>
              )}
              {momentCounts.castling > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.castling.color}`}>
                  <momentConfig.castling.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.castling}</span>
                </div>
              )}
              {momentCounts.promotion > 0 && (
                <div className={`flex items-center gap-0.5 ${momentConfig.promotion.color}`}>
                  <momentConfig.promotion.icon className="w-2.5 h-2.5" />
                  <span className="text-[9px]">{momentCounts.promotion}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertical slider with moment markers */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-[200px]">
          <div className="relative h-full flex items-center gap-2">
            {/* Key moment markers on the left side with enhanced tooltips */}
            <div className="relative h-full w-6">
              {visibleMoments.slice(0, 25).map((moment, idx) => (
                <TimelineMarker
                  key={`${moment.moveNumber}-${moment.type}-${idx}`}
                  moment={moment}
                  position={getMomentPosition(moment.moveNumber)}
                  orientation="vertical"
                  onClick={() => handleMomentClick(moment.moveNumber)}
                  size="sm"
                />
              ))}
            </div>

            {/* Vertical slider */}
            <div className="h-full flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground mb-1">Start</span>
              <Slider
                value={[displayMove]}
                min={range.start}
                max={range.end}
                step={1}
                onValueChange={handleSliderChange}
                orientation="vertical"
                className="h-full"
              />
              <span className="text-[8px] text-muted-foreground mt-1">{range.end}</span>
            </div>
          </div>
        </div>

        {/* Controls - compact vertical layout */}
        <div className="pt-3 border-t border-border/30 space-y-2">
          {/* Play/Pause row */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={stepBackward}
              disabled={isAtStart}
              className="h-7 w-7 p-0"
              title="Previous move"
            >
              <SkipBack className="h-3 w-3" />
            </Button>

            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              onClick={togglePlayback}
              className="h-8 w-8 p-0 rounded-full"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stepForward}
              disabled={isAtEnd}
              className="h-7 w-7 p-0"
              title="Next move"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>

          {/* Reset and Speed row */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-6 w-6 p-0"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 gap-0.5 text-[10px]"
                  title="Playback speed"
                >
                  <Gauge className="h-2.5 w-2.5" />
                  {currentSpeedLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top">
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
        </div>

        {/* Progress indicator */}
        {isPlaying && (
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500 transition-all duration-100"
              style={{ width: `${((displayMove - range.start) / phaseMoveCount) * 100}%` }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VerticalTimelineSlider;
