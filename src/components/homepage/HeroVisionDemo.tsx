import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, ChevronRight, MousePointerClick } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { VisionBoard } from '@/components/chess/VisionBoard';
import { ShowPiecesToggle } from '@/components/chess/ShowPiecesToggle';
import { simulateGame } from '@/lib/chess/gameSimulator';
import { famousGames } from '@/lib/chess/famousGames';
import { setActivePalette, colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { useSessionStore } from '@/stores/sessionStore';

// Curated rotation of the most visually striking games for the hero loop
const DEMO_GAME_IDS = [
  'anderssen-kieseritzky-1851', // The Immortal Game
  'byrne-fischer-1956',         // The Game of the Century
  'kasparov-topalov-1999',      // Kasparov's Immortal
];

const DEMO_GAMES = DEMO_GAME_IDS
  .map(id => famousGames.find(g => g.id === id))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

// Palettes offered as one-tap swaps beneath the board
const DEMO_PALETTES = colorPalettes.slice(0, 5);

// Responsive board size based on viewport width
function useBoardSize(): number {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined' ? 420 : Math.min(440, window.innerWidth - 48)
  );
  useEffect(() => {
    const onResize = () => setSize(Math.min(440, window.innerWidth - 48));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

interface HeroPlayerControlsProps {
  totalMoves: number;
  onFinished: () => void;
  gameTitle: string;
  gameSubtitle: string;
}

// Runs INSIDE the TimelineProvider — drives auto-play, loop rotation, and the scrubber
const HeroPlayerControls: React.FC<HeroPlayerControlsProps> = ({
  totalMoves,
  onFinished,
  gameTitle,
  gameSubtitle,
}) => {
  const {
    currentMove,
    maxMoves,
    isPlaying,
    setMaxMoves,
    setCurrentMove,
    setPlaybackSpeed,
    play,
    togglePlayback,
  } = useTimeline();

  // Sync total moves + set a lively playback speed on mount
  useEffect(() => {
    setMaxMoves(totalMoves);
    setPlaybackSpeed(320);
  }, [totalMoves, setMaxMoves, setPlaybackSpeed]);

  // Auto-start the animation shortly after mount
  useEffect(() => {
    const t = setTimeout(() => play(), 500);
    return () => clearTimeout(t);
  }, [play]);

  // When the game finishes painting, hold briefly then rotate to the next game
  useEffect(() => {
    if (maxMoves > 0 && currentMove !== Infinity && currentMove >= maxMoves) {
      const t = setTimeout(onFinished, 2600);
      return () => clearTimeout(t);
    }
  }, [currentMove, maxMoves, onFinished]);

  const sliderValue = currentMove === Infinity ? maxMoves : currentMove;

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="text-center">
        <p className="font-display text-sm md:text-base uppercase tracking-wider text-foreground">
          {gameTitle}
        </p>
        <p className="text-xs text-muted-foreground font-serif">{gameSubtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Slider
          value={[sliderValue]}
          min={0}
          max={Math.max(maxMoves, 1)}
          step={1}
          onValueChange={(v) => setCurrentMove(v[0])}
          className="flex-1"
          aria-label="Scrub through the game"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-12 text-right tabular-nums">
          {sliderValue}/{maxMoves}
        </span>
      </div>
    </div>
  );
};

export const HeroVisionDemo: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentSimulation } = useSessionStore();
  const [gameIndex, setGameIndex] = useState(0);
  const [paletteId, setPaletteId] = useState<PaletteId>(DEMO_PALETTES[0]?.id ?? 'hotCold');
  const [showPieces, setShowPieces] = useState(true);
  const [pieceOpacity, setPieceOpacity] = useState(0.55);
  const [renderKey, setRenderKey] = useState(0);
  const boardSize = useBoardSize();

  const game = DEMO_GAMES[gameIndex] ?? DEMO_GAMES[0];
  const simulation = useMemo(() => simulateGame(game.pgn), [game.pgn]);

  // Apply the active palette before the board paints, then force it to pick up colors
  useLayoutEffect(() => {
    setActivePalette(paletteId);
    setRenderKey((k) => k + 1);
  }, [paletteId]);

  const handleFinished = useCallback(() => {
    setGameIndex((prev) => (prev + 1) % DEMO_GAMES.length);
  }, []);

  const handleBoardClick = useCallback(() => {
    const gameHash = generateGameHash(game.pgn);
    setCurrentSimulation(simulation, game.pgn, game.title);
    const urlParams = new URLSearchParams();
    urlParams.set('src', 'hero');
    navigate(`/g/${gameHash}?${urlParams.toString()}`);
  }, [game, simulation, navigate, setCurrentSimulation]);

  if (!game) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-6">
        {/* The self-painting board */}
        <TimelineProvider key={game.id} initialMove={0}>
          <div className="flex flex-col items-center gap-5 w-full">
            <div
              key={renderKey}
              className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-primary/15 cursor-pointer group/board relative"
              onClick={handleBoardClick}
              role="button"
              tabIndex={0}
              aria-label={`Open ${game.title} in full visualization`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBoardClick();
                }
              }}
            >
              <div className="absolute inset-0 bg-primary/0 group-hover/board:bg-primary/5 transition-colors duration-300 z-10 pointer-events-none flex items-center justify-center">
                <div className="opacity-0 group-hover/board:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Open in Visualizer</span>
                </div>
              </div>
              <VisionBoard
                board={simulation.board}
                gameData={simulation.gameData}
                totalMoves={simulation.totalMoves}
                size={boardSize}
                showPieces={showPieces}
                pieceOpacity={pieceOpacity}
                pgn={game.pgn}
                title={game.title}
              />
            </div>

            <HeroPlayerControls
              totalMoves={simulation.totalMoves}
              onFinished={handleFinished}
              gameTitle={game.title}
              gameSubtitle={`${game.white} vs ${game.black} · ${game.year}`}
            />
          </div>
        </TimelineProvider>

        {/* Live controls: palette swap + show pieces */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
              Palette
            </span>
            <div className="flex items-center gap-1.5">
              {DEMO_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  aria-label={`Use ${p.name} palette`}
                  className={`h-8 w-8 rounded-full overflow-hidden border-2 transition-all ${
                    paletteId === p.id
                      ? 'border-primary scale-110'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <span className="flex h-full w-full">
                    {Object.values(p.white).slice(0, 3).map((c, i) => (
                      <span key={i} className="flex-1" style={{ backgroundColor: c as string }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <ShowPiecesToggle
            showPieces={showPieces}
            pieceOpacity={pieceOpacity}
            onToggle={setShowPieces}
            onOpacityChange={setPieceOpacity}
            compact
          />
        </div>

        {/* Make your own CTA */}
        <a
          href="#make-your-own"
          className="group inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          Try it with your own game
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export default HeroVisionDemo;
