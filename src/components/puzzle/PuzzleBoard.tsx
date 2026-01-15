import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Trophy,
  Flame,
  Target,
  Brain,
  Sparkles,
  Check,
  X,
  Crown,
  Clock,
} from 'lucide-react';
import { PlayableChessBoard } from '@/components/chess/PlayableChessBoard';
import { ChessPuzzle, getThemeInfo, PuzzleDifficulty, DIFFICULTY_RANGES } from '@/lib/chess/puzzleDatabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  onSolve: (solved: boolean, hintsUsed: number) => void;
  onNext: () => void;
  showSolution?: boolean;
}

type PuzzleState = 'playing' | 'correct' | 'incorrect' | 'revealed';

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  puzzle,
  onSolve,
  onNext,
  showSolution = false,
}) => {
  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('playing');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showingHint, setShowingHint] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);

  // Reset when puzzle changes
  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setCurrentMoveIndex(0);
    setPuzzleState('playing');
    setHintsUsed(0);
    setShowingHint(false);
    setLastMoveSquares([]);
    setAttemptCount(0);
  }, [puzzle.id, puzzle.fen]);

  // Get whose turn it is
  const playerColor = useMemo(() => {
    const chess = new Chess(puzzle.fen);
    return chess.turn() === 'w' ? 'white' : 'black';
  }, [puzzle.fen]);

  // Expected move in UCI format
  const expectedMove = puzzle.moves[currentMoveIndex];

  // Get difficulty badge color
  const getDifficultyBadge = () => {
    const rating = puzzle.rating;
    if (rating < 1200) return { label: 'Beginner', color: 'bg-green-500/20 text-green-500 border-green-500/30' };
    if (rating < 1600) return { label: 'Intermediate', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' };
    if (rating < 2000) return { label: 'Advanced', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' };
    return { label: 'Master', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
  };

  // Handle player move
  const handleMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    if (puzzleState !== 'playing') return false;

    const uciMove = `${from}${to}${promotion || ''}`;
    const expectedUci = expectedMove.toLowerCase();
    
    // Check if move matches expected
    if (uciMove === expectedUci || uciMove.startsWith(expectedUci.substring(0, 4))) {
      // Correct move!
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from, to, promotion });
      
      if (move) {
        setGame(newGame);
        setLastMoveSquares([from, to]);
        setCurrentMoveIndex(prev => prev + 1);
        
        // Check if puzzle is complete
        if (currentMoveIndex + 1 >= puzzle.moves.length) {
        setPuzzleState('correct');
          onSolve(true, hintsUsed);
          toast.success('Puzzle solved! 🎉', {
            description: puzzle.gameTitle ? `From "${puzzle.gameTitle}"` : undefined,
          });
        } else {
          // Make opponent's response move after a delay
          setTimeout(() => {
            const opponentMove = puzzle.moves[currentMoveIndex + 1];
            if (opponentMove) {
              const opponentGame = new Chess(newGame.fen());
              const from2 = opponentMove.substring(0, 2) as Square;
              const to2 = opponentMove.substring(2, 4) as Square;
              const promo2 = opponentMove.length > 4 ? opponentMove[4] : undefined;
              
              const opMove = opponentGame.move({ from: from2, to: to2, promotion: promo2 });
              if (opMove) {
                setGame(opponentGame);
                setLastMoveSquares([from2, to2]);
                setCurrentMoveIndex(prev => prev + 1);
              }
            }
          }, 500);
        }
        return true;
      }
    } else {
      // Wrong move
      setAttemptCount(prev => prev + 1);
      
      if (attemptCount >= 2) {
        // After 3 wrong attempts, mark as failed
        setPuzzleState('incorrect');
        onSolve(false, hintsUsed);
        toast.error('Not quite right', {
          description: 'Try the next puzzle!',
        });
      } else {
        toast.error('Not the best move', {
          description: 'Try again!',
        });
      }
      return false;
    }
    return false;
  }, [game, expectedMove, currentMoveIndex, puzzle, puzzleState, hintsUsed, attemptCount, onSolve]);

  // Show hint
  const handleHint = useCallback(() => {
    if (puzzleState !== 'playing' || !expectedMove) return;
    
    setHintsUsed(prev => prev + 1);
    setShowingHint(true);
    
    // Highlight the starting square
    const hintSquare = expectedMove.substring(0, 2);
    setLastMoveSquares([hintSquare]);
    
    toast.info(`Hint: Look at ${hintSquare.toUpperCase()}`, {
      description: 'Find the best move from this square',
    });
    
    setTimeout(() => setShowingHint(false), 3000);
  }, [expectedMove, puzzleState]);

  // Reset puzzle
  const handleReset = useCallback(() => {
    setGame(new Chess(puzzle.fen));
    setCurrentMoveIndex(0);
    setPuzzleState('playing');
    setLastMoveSquares([]);
    setAttemptCount(0);
  }, [puzzle.fen]);

  // Show solution
  const handleShowSolution = useCallback(() => {
    setPuzzleState('revealed');
    
    // Play through all moves
    let tempGame = new Chess(puzzle.fen);
    let delay = 0;
    
    puzzle.moves.forEach((move, index) => {
      setTimeout(() => {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promo = move.length > 4 ? move[4] : undefined;
        
        const result = tempGame.move({ from, to, promotion: promo });
        if (result) {
          tempGame = new Chess(tempGame.fen());
          setGame(tempGame);
          setLastMoveSquares([from, to]);
          setCurrentMoveIndex(index + 1);
        }
      }, delay);
      delay += 1000;
    });
    
    onSolve(false, hintsUsed);
  }, [puzzle, hintsUsed, onSolve]);

  // Get available moves (for playable board)
  const getAvailableMoves = useCallback((square: Square) => {
    if (puzzleState !== 'playing') return [];
    return game.moves({ square, verbose: true }).map(m => m.to as Square);
  }, [game, puzzleState]);

  const difficultyInfo = getDifficultyBadge();

  return (
    <div className="space-y-4">
      {/* Puzzle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('font-display', difficultyInfo.color)}>
            <Brain className="h-3 w-3 mr-1" />
            {difficultyInfo.label}
          </Badge>
          <Badge variant="secondary" className="font-mono">
            {puzzle.rating}
          </Badge>
          {puzzle.source === 'famous_game' && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Crown className="h-3 w-3 mr-1" />
              Master Game
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>{playerColor === 'white' ? 'White' : 'Black'} to move</span>
        </div>
      </div>

      {/* Themes */}
      <div className="flex flex-wrap gap-1">
        {puzzle.themes.slice(0, 5).map((theme) => {
          const info = getThemeInfo(theme);
          return (
            <TooltipProvider key={theme}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    <span className="mr-1">{info.icon}</span>
                    {info.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{info.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Description */}
      {puzzle.description && (
        <p className="text-sm text-muted-foreground italic">
          {puzzle.description}
        </p>
      )}

      {/* Game Title if from famous game */}
      {puzzle.gameTitle && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            From: {puzzle.gameTitle}
          </span>
        </div>
      )}

      {/* Board */}
      <div className="relative">
        <PlayableChessBoard
          fen={game.fen()}
          onMove={handleMove}
          disabled={puzzleState !== 'playing'}
          isMyTurn={puzzleState === 'playing'}
          myColor={playerColor === 'white' ? 'w' : 'b'}
          whitePalette={{}}
          blackPalette={{}}
          movedSquares={new Set(lastMoveSquares)}
          getAvailableMoves={getAvailableMoves}
        />

        {/* Result Overlay */}
        <AnimatePresence>
          {puzzleState !== 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4"
              >
                {puzzleState === 'correct' ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                      <Check className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-green-500">
                      Correct!
                    </h3>
                    {hintsUsed === 0 && (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        No hints used!
                      </Badge>
                    )}
                  </>
                ) : puzzleState === 'incorrect' ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                      <X className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-red-500">
                      Not quite
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The solution has been revealed
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                      <Lightbulb className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-blue-500">
                      Solution
                    </h3>
                  </>
                )}
                <Button onClick={onNext} className="gap-2">
                  Next Puzzle
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.min(currentMoveIndex + 1, puzzle.moves.length)} / {puzzle.moves.length} moves</span>
        </div>
        <Progress 
          value={(currentMoveIndex / puzzle.moves.length) * 100} 
          className="h-2"
        />
      </div>

      {/* Controls */}
      {puzzleState === 'playing' && (
        <div className="flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHint}
                  disabled={showingHint}
                  className="gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Hint
                  {hintsUsed > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {hintsUsed}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get a hint (reduces points)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {showSolution && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowSolution}
              className="gap-2 text-muted-foreground"
            >
              Show Solution
            </Button>
          )}
        </div>
      )}

      {/* Attempt indicator */}
      {puzzleState === 'playing' && attemptCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Attempts remaining:</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i < 3 - attemptCount ? 'bg-amber-500' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleBoard;
