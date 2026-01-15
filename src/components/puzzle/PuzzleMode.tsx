import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Puzzle,
  Trophy,
  Flame,
  Brain,
  Target,
  ChevronRight,
  Crown,
  Sparkles,
  BookOpen,
  Zap,
  Swords,
  RotateCcw,
} from 'lucide-react';
import { PuzzleBoard } from './PuzzleBoard';
import {
  ChessPuzzle,
  PuzzleDifficulty,
  PuzzleTheme,
  getRandomPuzzle,
  getPuzzleStats,
  getPuzzlesByTheme,
  getThemeInfo,
  FAMOUS_GAME_PUZZLES,
} from '@/lib/chess/puzzleDatabase';
import { cn } from '@/lib/utils';

interface PuzzleSession {
  puzzlesSolved: number;
  puzzlesFailed: number;
  totalHintsUsed: number;
  currentStreak: number;
  bestStreak: number;
  completedIds: string[];
}

const FEATURED_THEMES: PuzzleTheme[] = [
  'mateIn1',
  'mateIn2',
  'fork',
  'pin',
  'sacrifice',
  'discoveredAttack',
  'backRankMate',
  'endgame',
];

export const PuzzleMode: React.FC = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficulty>('intermediate');
  const [selectedTheme, setSelectedTheme] = useState<PuzzleTheme | 'any'>('any');
  const [selectedSource, setSelectedSource] = useState<'all' | 'lichess' | 'famous_game'>('all');
  const [session, setSession] = useState<PuzzleSession>({
    puzzlesSolved: 0,
    puzzlesFailed: 0,
    totalHintsUsed: 0,
    currentStreak: 0,
    bestStreak: 0,
    completedIds: [],
  });

  const stats = useMemo(() => getPuzzleStats(), []);

  // Start a new puzzle
  const startPuzzle = useCallback((options?: {
    difficulty?: PuzzleDifficulty;
    theme?: PuzzleTheme;
    source?: 'lichess' | 'famous_game';
    specificPuzzle?: ChessPuzzle;
  }) => {
    if (options?.specificPuzzle) {
      setCurrentPuzzle(options.specificPuzzle);
      return;
    }

    const puzzle = getRandomPuzzle({
      difficulty: options?.difficulty || selectedDifficulty,
      theme: options?.theme || (selectedTheme !== 'any' ? selectedTheme : undefined),
      source: options?.source || (selectedSource !== 'all' ? selectedSource : undefined),
      excludeIds: session.completedIds,
    });

    if (puzzle) {
      setCurrentPuzzle(puzzle);
    }
  }, [selectedDifficulty, selectedTheme, selectedSource, session.completedIds]);

  // Handle puzzle completion
  const handlePuzzleSolved = useCallback((solved: boolean, hintsUsed: number) => {
    setSession(prev => {
      const newStreak = solved ? prev.currentStreak + 1 : 0;
      return {
        ...prev,
        puzzlesSolved: solved ? prev.puzzlesSolved + 1 : prev.puzzlesSolved,
        puzzlesFailed: !solved ? prev.puzzlesFailed + 1 : prev.puzzlesFailed,
        totalHintsUsed: prev.totalHintsUsed + hintsUsed,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        completedIds: currentPuzzle ? [...prev.completedIds, currentPuzzle.id] : prev.completedIds,
      };
    });
  }, [currentPuzzle]);

  // Next puzzle
  const handleNextPuzzle = useCallback(() => {
    startPuzzle();
  }, [startPuzzle]);

  // Reset session
  const resetSession = useCallback(() => {
    setSession({
      puzzlesSolved: 0,
      puzzlesFailed: 0,
      totalHintsUsed: 0,
      currentStreak: 0,
      bestStreak: 0,
      completedIds: [],
    });
    setCurrentPuzzle(null);
  }, []);

  // Calculate accuracy
  const accuracy = useMemo(() => {
    const total = session.puzzlesSolved + session.puzzlesFailed;
    if (total === 0) return 0;
    return Math.round((session.puzzlesSolved / total) * 100);
  }, [session]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Puzzle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Puzzle Training</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} puzzles from Lichess & famous games
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            <span className="font-mono text-sm">{session.puzzlesSolved}</span>
          </div>
          {session.currentStreak > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="font-mono text-sm">{session.currentStreak} streak</span>
            </div>
          )}
          {accuracy > 0 && (
            <Badge variant="outline" className={cn(
              accuracy >= 80 ? 'text-green-500 border-green-500/30' :
              accuracy >= 60 ? 'text-amber-500 border-amber-500/30' :
              'text-red-500 border-red-500/30'
            )}>
              {accuracy}% accuracy
            </Badge>
          )}
        </div>
      </div>

      {currentPuzzle ? (
        /* Active Puzzle View */
        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          <Card>
            <CardContent className="p-4">
              <PuzzleBoard
                puzzle={currentPuzzle}
                onSolve={handlePuzzleSolved}
                onNext={handleNextPuzzle}
                showSolution={true}
              />
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                  Quick Play
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => startPuzzle({ theme: 'mateIn1' })}
                >
                  <Target className="h-4 w-4 text-green-500" />
                  Mate in 1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => startPuzzle({ theme: 'sacrifice' })}
                >
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Sacrifices
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => startPuzzle({ source: 'famous_game' })}
                >
                  <Crown className="h-4 w-4 text-amber-500" />
                  Master Games
                </Button>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                  This Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-bold text-green-500">{session.puzzlesSolved}</p>
                    <p className="text-xs text-muted-foreground">Solved</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <p className="text-lg font-bold text-red-500">{session.puzzlesFailed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <p className="text-lg font-bold text-amber-500">{session.bestStreak}</p>
                    <p className="text-xs text-muted-foreground">Best Streak</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <p className="text-lg font-bold text-blue-500">{session.totalHintsUsed}</p>
                    <p className="text-xs text-muted-foreground">Hints Used</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 gap-2 text-muted-foreground"
                  onClick={resetSession}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Puzzle Selection View */
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2">
              <Target className="h-4 w-4" />
              By Theme
            </TabsTrigger>
            <TabsTrigger value="famous" className="gap-2">
              <Crown className="h-4 w-4" />
              Famous Games
            </TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quick" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['beginner', 'intermediate', 'advanced', 'master'] as PuzzleDifficulty[]).map((diff) => {
                const config = {
                  beginner: { icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
                  intermediate: { icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                  advanced: { icon: Swords, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                  master: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                }[diff];
                const Icon = config.icon;
                
                return (
                  <Card
                    key={diff}
                    className={cn(
                      'cursor-pointer transition-all hover:ring-2 hover:ring-primary/50',
                      config.border,
                      config.bg
                    )}
                    onClick={() => {
                      setSelectedDifficulty(diff);
                      startPuzzle({ difficulty: diff });
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3', config.bg)}>
                        <Icon className={cn('h-6 w-6', config.color)} />
                      </div>
                      <h3 className="font-display font-bold capitalize">{diff}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {diff === 'beginner' && '800-1200'}
                        {diff === 'intermediate' && '1200-1600'}
                        {diff === 'advanced' && '1600-2000'}
                        {diff === 'master' && '2000+'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* By Theme */}
          <TabsContent value="themes" className="mt-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {FEATURED_THEMES.map((theme) => {
                const info = getThemeInfo(theme);
                const count = getPuzzlesByTheme(theme).length;
                
                return (
                  <Card
                    key={theme}
                    className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                    onClick={() => {
                      setSelectedTheme(theme);
                      startPuzzle({ theme });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{info.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{info.name}</h3>
                          <p className="text-xs text-muted-foreground">{count} puzzles</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Famous Games */}
          <TabsContent value="famous" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FAMOUS_GAME_PUZZLES.map((puzzle) => (
                <Card
                  key={puzzle.id}
                  className="cursor-pointer transition-all hover:ring-2 hover:ring-amber-500/50 border-amber-500/20 bg-amber-500/5"
                  onClick={() => startPuzzle({ specificPuzzle: puzzle })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Trophy className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-sm">{puzzle.gameTitle}</h3>
                        {puzzle.openingFamily && (
                          <p className="text-xs text-muted-foreground">{puzzle.openingFamily}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {puzzle.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {puzzle.rating}
                          </Badge>
                          {puzzle.themes.slice(0, 2).map(t => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {getThemeInfo(t).name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PuzzleMode;
