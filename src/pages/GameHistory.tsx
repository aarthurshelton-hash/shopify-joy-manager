import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Trophy,
  Clock,
  Calendar,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface GameRecord {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  status: string;
  result: string | null;
  pgn: string | null;
  time_control: string;
  white_palette: Record<string, string> | null;
  black_palette: Record<string, string> | null;
  completed_at: string | null;
  created_at: string;
  move_count: number | null;
}

interface MoveRecord {
  move_san: string;
  move_uci: string;
  fen_after: string;
  move_number: number;
}

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const TIME_CONTROL_LABELS: Record<string, string> = {
  bullet_1: '1 min',
  blitz_5: '5 min',
  rapid_15: '15 min',
  untimed: 'Untimed',
};

const parseFen = (fen: string): (string | null)[][] => {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const squares: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) squares.push(null);
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
};

const ReplayBoard = ({ 
  fen, 
  whitePalette, 
  blackPalette,
  movedSquares 
}: { 
  fen: string;
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  movedSquares: Set<string>;
}) => {
  const board = useMemo(() => parseFen(fen), [fen]);

  const getPieceColor = (piece: string, row: number, col: number): string => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    const square = `${file}${rank}`;
    const hasBeenMoved = movedSquares.has(square);
    
    if (!hasBeenMoved && movedSquares.size > 0) {
      return 'rgba(128, 128, 128, 0.15)';
    }
    
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase();
    const palette = isWhite ? whitePalette : blackPalette;
    
    return palette[pieceType] || '#888888';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-8 border-4 border-amber-900 rounded-lg overflow-hidden shadow-xl">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const piece = board[row]?.[col];
          const isLight = (row + col) % 2 === 0;
          const file = String.fromCharCode(97 + col);
          const rank = 8 - row;
          const square = `${file}${rank}`;
          const hasBeenMoved = movedSquares.has(square);

          return (
            <div
              key={i}
              className={`
                aspect-square relative
                ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
              `}
            >
              {piece && (
                <motion.div
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: hasBeenMoved || movedSquares.size === 0 ? 1 : 0.15 
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    color: getPieceColor(piece, row, col),
                    filter: hasBeenMoved || movedSquares.size === 0 ? 'none' : 'grayscale(100%)',
                  }}
                >
                  <span className="text-3xl md:text-4xl select-none drop-shadow-md">
                    {PIECE_SYMBOLS[piece]}
                  </span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function GameHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  // Load user's completed games
  useEffect(() => {
    if (!user) return;

    const loadGames = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('status', 'completed')
        .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
        .order('completed_at', { ascending: false });

      if (!error && data) {
        setGames(data.map(g => ({
          ...g,
          white_palette: g.white_palette as Record<string, string> | null,
          black_palette: g.black_palette as Record<string, string> | null,
        })));
      }
      setIsLoading(false);
    };

    loadGames();
  }, [user]);

  // Load moves for selected game
  useEffect(() => {
    if (!selectedGame) return;

    const loadMoves = async () => {
      const { data, error } = await supabase
        .from('chess_moves')
        .select('move_san, move_uci, fen_after, move_number')
        .eq('game_id', selectedGame.id)
        .order('move_number', { ascending: true });

      if (!error && data) {
        setMoves(data);
        setCurrentMoveIndex(0);
        setIsPlaying(false);
      }
    };

    loadMoves();
  }, [selectedGame]);

  // Playback effect
  useEffect(() => {
    if (!isPlaying || currentMoveIndex >= moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentMoveIndex(prev => prev + 1);
    }, playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, moves.length, playbackSpeed]);

  const currentFen = useMemo(() => {
    if (currentMoveIndex === 0 || moves.length === 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return moves[currentMoveIndex - 1]?.fen_after || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [moves, currentMoveIndex]);

  const movedSquares = useMemo(() => {
    const squares = new Set<string>();
    for (let i = 0; i < currentMoveIndex; i++) {
      const uci = moves[i]?.move_uci;
      if (uci && uci.length >= 4) {
        squares.add(uci.substring(2, 4));
      }
    }
    return squares;
  }, [moves, currentMoveIndex]);

  const getResultBadge = (game: GameRecord) => {
    if (!user) return null;
    
    const isWhite = game.white_player_id === user.id;
    const result = game.result;

    if (result === 'draw') {
      return <Badge variant="secondary">Draw</Badge>;
    }
    
    const won = (result === 'white_wins' && isWhite) || (result === 'black_wins' && !isWhite);
    
    return (
      <Badge variant={won ? 'default' : 'destructive'} className={won ? 'bg-green-500' : ''}>
        {won ? 'Won' : 'Lost'}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to view your game history.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="flex items-center gap-4 mb-8">
          {selectedGame ? (
            <Button variant="ghost" onClick={() => setSelectedGame(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/play')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Play
            </Button>
          )}
          <h1 className="text-3xl font-display font-bold">
            {selectedGame ? 'Game Replay' : 'Game History'}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {selectedGame ? (
            <motion.div
              key="replay"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Game info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedGame.completed_at 
                        ? format(new Date(selectedGame.completed_at), 'MMM d, yyyy')
                        : 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {TIME_CONTROL_LABELS[selectedGame.time_control]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {selectedGame.move_count || 0} moves
                    </div>
                    {getResultBadge(selectedGame)}
                  </div>
                </CardContent>
              </Card>

              {/* Board */}
              <ReplayBoard
                fen={currentFen}
                whitePalette={selectedGame.white_palette || { k: '#FFD700', q: '#FFA500', r: '#FF6B6B', b: '#4ECDC4', n: '#45B7D1', p: '#96CEB4' }}
                blackPalette={selectedGame.black_palette || { k: '#8B4513', q: '#A0522D', r: '#CD853F', b: '#D2691E', n: '#B8860B', p: '#DEB887' }}
                movedSquares={movedSquares}
              />

              {/* Controls */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Move slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Move {currentMoveIndex}</span>
                      <span>of {moves.length}</span>
                    </div>
                    <Slider
                      value={[currentMoveIndex]}
                      onValueChange={([v]) => {
                        setCurrentMoveIndex(v);
                        setIsPlaying(false);
                      }}
                      max={moves.length}
                      step={1}
                    />
                  </div>

                  {/* Playback buttons */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCurrentMoveIndex(0);
                        setIsPlaying(false);
                      }}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMoveIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentMoveIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={currentMoveIndex >= moves.length}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMoveIndex(prev => Math.min(moves.length, prev + 1))}
                      disabled={currentMoveIndex >= moves.length}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCurrentMoveIndex(moves.length);
                        setIsPlaying(false);
                      }}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Speed control */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Speed:</span>
                    <div className="flex gap-2">
                      {[2000, 1000, 500, 250].map(speed => (
                        <Button
                          key={speed}
                          variant={playbackSpeed === speed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlaybackSpeed(speed)}
                        >
                          {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Move list */}
                  {moves.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                      <div className="flex flex-wrap gap-1 text-sm font-mono">
                        {moves.map((move, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentMoveIndex(idx + 1);
                              setIsPlaying(false);
                            }}
                            className={`
                              px-2 py-1 rounded transition-colors
                              ${idx + 1 === currentMoveIndex 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'}
                              ${idx % 2 === 0 ? 'ml-2' : ''}
                            `}
                          >
                            {idx % 2 === 0 && (
                              <span className="text-muted-foreground mr-1">
                                {Math.floor(idx / 2) + 1}.
                              </span>
                            )}
                            {move.move_san}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : games.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">No games yet</p>
                    <p className="text-muted-foreground mb-4">
                      Play your first game to see it here!
                    </p>
                    <Button onClick={() => navigate('/play')}>
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {games.map(game => (
                    <motion.div
                      key={game.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedGame(game)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Trophy className="w-4 h-4" />
                              {game.white_player_id === user.id ? 'White' : 'Black'}
                            </CardTitle>
                            {getResultBadge(game)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {game.completed_at 
                                ? format(new Date(game.completed_at), 'MMM d, yyyy h:mm a')
                                : 'Unknown'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {TIME_CONTROL_LABELS[game.time_control]}
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              {game.move_count || 0} moves
                            </div>
                          </div>
                          <Button variant="ghost" className="w-full mt-4" size="sm">
                            <Play className="w-4 h-4 mr-2" />
                            Watch Replay
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
