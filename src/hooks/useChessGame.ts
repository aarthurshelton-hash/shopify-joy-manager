import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { calculateGameRatingChanges } from '@/lib/chess/eloCalculator';
import { getDrawToastMessage } from '@/lib/chess/drawReasons';
import { useChessSounds } from '@/hooks/useChessSounds';
import { useSoundStore } from '@/stores/soundStore';

export type TimeControl = 'bullet_1' | 'blitz_5' | 'rapid_15' | 'untimed';
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned';
export type GameResult = 'white_wins' | 'black_wins' | 'draw' | 'abandoned';

export interface ChessGameState {
  id: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  status: GameStatus;
  result: GameResult | null;
  pgn: string;
  currentFen: string;
  moveCount: number;
  timeControl: TimeControl;
  whiteTimeRemaining: number | null;
  blackTimeRemaining: number | null;
  whitePalette: Record<string, string> | null;
  blackPalette: Record<string, string> | null;
  challengeCode: string | null;
  winnerId: string | null;
  createdAt: string;
  startedAt: string | null;
}

export interface UseChessGameReturn {
  game: Chess;
  gameState: ChessGameState | null;
  isMyTurn: boolean;
  myColor: 'w' | 'b' | null;
  isLoading: boolean;
  error: string | null;
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  createGame: (timeControl: TimeControl, isPublic: boolean, palette: Record<string, string>) => Promise<string | null>;
  joinGame: (gameId: string, palette: Record<string, string>) => Promise<boolean>;
  joinByCode: (code: string, palette: Record<string, string>) => Promise<boolean>;
  resignGame: () => Promise<void>;
  offerDraw: () => Promise<void>;
  loadGame: (gameId: string) => Promise<void>;
  getAvailableMoves: (square: Square) => Square[];
  movedSquares: Set<string>; // Track which squares have been moved to (for visualization fill-in)
}

const TIME_CONTROL_SECONDS: Record<TimeControl, number> = {
  bullet_1: 60,
  blitz_5: 300,
  rapid_15: 900,
  untimed: 0,
};

export const useChessGame = (): UseChessGameReturn => {
  const { user } = useAuth();
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movedSquares, setMovedSquares] = useState<Set<string>>(new Set());
  
  // Sound effects - read from global store
  const { enabled: soundEnabled, volume: soundVolume } = useSoundStore();
  const { playSound } = useChessSounds(soundEnabled, soundVolume);
  const previousFenRef = useRef<string>('');

  const myColor: 'w' | 'b' | null = gameState
    ? gameState.whitePlayerId === user?.id
      ? 'w'
      : gameState.blackPlayerId === user?.id
      ? 'b'
      : null
    : null;

  const isMyTurn = gameState?.status === 'active' && game.turn() === myColor;

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!gameState?.id) return;

    const channel = supabase
      .channel(`game-${gameState.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chess_games',
          filter: `id=eq.${gameState.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          
          // Check for game completion and play appropriate sound
          if (updated.status === 'completed' && gameState.status !== 'completed') {
            if (updated.result === 'draw') {
              playSound('draw');
            } else if (updated.winner_id === user?.id) {
              playSound('victory');
            } else {
              playSound('defeat');
            }
          }
          
          setGameState(prev => prev ? {
            ...prev,
            status: updated.status,
            result: updated.result,
            pgn: updated.pgn,
            currentFen: updated.current_fen,
            moveCount: updated.move_count,
            whiteTimeRemaining: updated.white_time_remaining,
            blackTimeRemaining: updated.black_time_remaining,
            winnerId: updated.winner_id,
            blackPlayerId: updated.black_player_id,
            startedAt: updated.started_at,
          } : null);

          // Update chess.js game state
          if (updated.current_fen) {
            const newGame = new Chess(updated.current_fen);
            setGame(newGame);
          }
        }
      )
      .subscribe();

    // Subscribe to moves
    const movesChannel = supabase
      .channel(`moves-${gameState.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chess_moves',
          filter: `game_id=eq.${gameState.id}`,
        },
        (payload) => {
          const move = payload.new as any;
          // Track moved squares for visualization
          const uci = move.move_uci;
          if (uci && uci.length >= 4) {
            const to = uci.substring(2, 4);
            setMovedSquares(prev => new Set([...prev, to]));
          }
          
          // Play sound for opponent's move
          if (move.player_id !== user?.id) {
            const san = move.move_san;
            if (san.includes('#')) {
              playSound('checkmate');
            } else if (san.includes('+')) {
              playSound('check');
            } else if (san.includes('x')) {
              playSound('capture');
            } else if (san === 'O-O' || san === 'O-O-O') {
              playSound('castle');
            } else {
              playSound('move');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(movesChannel);
    };
  }, [gameState?.id, gameState?.status, user?.id, playSound]);

  const loadGame = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('chess_games')
        .select('*')
        .eq('id', gameId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Game not found');

      setGameState({
        id: data.id,
        whitePlayerId: data.white_player_id,
        blackPlayerId: data.black_player_id,
        status: data.status as GameStatus,
        result: data.result as GameResult | null,
        pgn: data.pgn || '',
        currentFen: data.current_fen,
        moveCount: data.move_count || 0,
        timeControl: data.time_control as TimeControl,
        whiteTimeRemaining: data.white_time_remaining,
        blackTimeRemaining: data.black_time_remaining,
        whitePalette: data.white_palette as Record<string, string> | null,
        blackPalette: data.black_palette as Record<string, string> | null,
        challengeCode: data.challenge_code,
        winnerId: data.winner_id,
        createdAt: data.created_at,
        startedAt: data.started_at,
      });

      const newGame = new Chess(data.current_fen);
      setGame(newGame);

      // Load existing moves to track moved squares
      const { data: moves } = await supabase
        .from('chess_moves')
        .select('move_uci')
        .eq('game_id', gameId)
        .order('move_number', { ascending: true });

      if (moves) {
        const squares = new Set<string>();
        moves.forEach(m => {
          if (m.move_uci && m.move_uci.length >= 4) {
            squares.add(m.move_uci.substring(2, 4));
          }
        });
        setMovedSquares(squares);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGame = useCallback(async (
    timeControl: TimeControl,
    isPublic: boolean,
    palette: Record<string, string>
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Please sign in to create a game');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const initialTime = TIME_CONTROL_SECONDS[timeControl] || null;
      
      // Generate challenge code
      const { data: codeResult } = await supabase.rpc('generate_challenge_code');
      
      const { data, error: createError } = await supabase
        .from('chess_games')
        .insert({
          white_player_id: user.id,
          status: 'waiting',
          time_control: timeControl,
          white_time_remaining: initialTime,
          black_time_remaining: initialTime,
          white_palette: palette,
          is_public: isPublic,
          challenge_code: codeResult,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast.success(isPublic ? 'Game created! Waiting for opponent...' : `Challenge code: ${codeResult}`);
      await loadGame(data.id);
      return data.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create game';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadGame]);

  const joinGame = useCallback(async (gameId: string, palette: Record<string, string>): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to join a game');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: gameData, error: fetchError } = await supabase
        .from('chess_games')
        .select('*')
        .eq('id', gameId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!gameData) throw new Error('Game not found');
      if (gameData.status !== 'waiting') throw new Error('Game already started');
      if (gameData.white_player_id === user.id) throw new Error('Cannot join your own game');

      const { error: updateError } = await supabase
        .from('chess_games')
        .update({
          black_player_id: user.id,
          black_palette: palette,
          status: 'active',
          started_at: new Date().toISOString(),
          last_move_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (updateError) throw updateError;

      playSound('gameStart');
      toast.success('Joined game! You are playing as Black.');
      await loadGame(gameId);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to join game';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadGame, playSound]);

  const joinByCode = useCallback(async (code: string, palette: Record<string, string>): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to join a game');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: gameData, error: fetchError } = await supabase
        .from('chess_games')
        .select('id')
        .eq('challenge_code', code.toUpperCase())
        .eq('status', 'waiting')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!gameData) throw new Error('Invalid or expired challenge code');

      return await joinGame(gameData.id, palette);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to join by code';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, joinGame]);

  const makeMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    if (!gameState || !user || !isMyTurn) return false;

    try {
      // Make move locally first
      const move = game.move({ from, to, promotion });
      if (!move) {
        playSound('illegal');
        return false;
      }

      // Play appropriate sound for the move
      if (game.isCheckmate()) {
        playSound('checkmate');
      } else if (game.isCheck()) {
        playSound('check');
      } else if (move.captured) {
        playSound('capture');
      } else if (move.san === 'O-O' || move.san === 'O-O-O') {
        playSound('castle');
      } else {
        playSound('move');
      }

      setGame(new Chess(game.fen()));
      setMovedSquares(prev => new Set([...prev, to]));

      // Update game state in database
      const newPgn = game.pgn();
      const newFen = game.fen();
      
      let result: GameResult | null = null;
      let winnerId: string | null = null;
      let status: GameStatus = 'active';

      if (game.isGameOver()) {
        status = 'completed';
        if (game.isCheckmate()) {
          result = game.turn() === 'w' ? 'black_wins' : 'white_wins';
          winnerId = game.turn() === 'w' ? gameState.blackPlayerId : gameState.whitePlayerId;
        } else {
          result = 'draw';
        }
      }

      // Insert move
      await supabase.from('chess_moves').insert({
        game_id: gameState.id,
        player_id: user.id,
        move_number: gameState.moveCount + 1,
        move_san: move.san,
        move_uci: from + to + (promotion || ''),
        fen_after: newFen,
      });

      // Update game
      await supabase
        .from('chess_games')
        .update({
          pgn: newPgn,
          current_fen: newFen,
          move_count: gameState.moveCount + 1,
          last_move_at: new Date().toISOString(),
          status,
          result,
          winner_id: winnerId,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', gameState.id);

      if (status === 'completed' && result) {
        // Update ELO ratings
        await updateEloRatings(gameState.whitePlayerId, gameState.blackPlayerId, result);
        
        // Play game end sounds
        if (result === 'draw') {
          playSound('draw');
        } else if (winnerId === user?.id) {
          playSound('victory');
        } else {
          playSound('defeat');
        }
        
        if (result === 'white_wins') {
          toast.success(myColor === 'w' ? 'You won!' : 'White wins!');
        } else if (result === 'black_wins') {
          toast.success(myColor === 'b' ? 'You won!' : 'Black wins!');
        } else {
          toast.info(getDrawToastMessage(game));
        }
      }

      return true;
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
  }, [game, gameState, user, isMyTurn, myColor, playSound]);

  // Update ELO ratings for both players after a game completes
  const updateEloRatings = useCallback(async (
    whitePlayerId: string | null,
    blackPlayerId: string | null,
    result: GameResult
  ) => {
    if (!whitePlayerId || !blackPlayerId || result === 'abandoned') return;
    
    try {
      // Fetch current ratings for both players
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, elo_rating')
        .in('user_id', [whitePlayerId, blackPlayerId]);
      
      if (!profiles || profiles.length !== 2) return;
      
      const whiteProfile = profiles.find(p => p.user_id === whitePlayerId);
      const blackProfile = profiles.find(p => p.user_id === blackPlayerId);
      
      if (!whiteProfile || !blackProfile) return;
      
      const whiteRating = whiteProfile.elo_rating || 1200;
      const blackRating = blackProfile.elo_rating || 1200;
      
      // Calculate new ratings
      const ratingResult = result === 'draw' ? 'draw' : result;
      const changes = calculateGameRatingChanges(whiteRating, blackRating, ratingResult);
      
      // Update both players' ratings
      await Promise.all([
        supabase
          .from('profiles')
          .update({ elo_rating: changes.white.newRating })
          .eq('user_id', whitePlayerId),
        supabase
          .from('profiles')
          .update({ elo_rating: changes.black.newRating })
          .eq('user_id', blackPlayerId)
      ]);
      
      // Show rating change to current user
      if (user?.id === whitePlayerId) {
        const change = changes.white.change;
        toast.info(`Rating: ${changes.white.newRating} (${change >= 0 ? '+' : ''}${change})`);
      } else if (user?.id === blackPlayerId) {
        const change = changes.black.change;
        toast.info(`Rating: ${changes.black.newRating} (${change >= 0 ? '+' : ''}${change})`);
      }
    } catch (error) {
      console.error('Failed to update ELO ratings:', error);
    }
  }, [user]);

  const resignGame = useCallback(async () => {
    if (!gameState || !user || !myColor) return;

    const result: GameResult = myColor === 'w' ? 'black_wins' : 'white_wins';
    const winnerId = myColor === 'w' ? gameState.blackPlayerId : gameState.whitePlayerId;

    await supabase
      .from('chess_games')
      .update({
        status: 'completed',
        result,
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', gameState.id);

    // Update ELO ratings
    await updateEloRatings(gameState.whitePlayerId, gameState.blackPlayerId, result);

    toast.info('You resigned');
  }, [gameState, user, myColor, updateEloRatings]);

  const offerDraw = useCallback(async () => {
    toast.info('Draw offer sent (opponent auto-accepts in this version)');
    
    if (!gameState) return;
    
    await supabase
      .from('chess_games')
      .update({
        status: 'completed',
        result: 'draw',
        completed_at: new Date().toISOString(),
      })
      .eq('id', gameState.id);

    // Update ELO ratings
    await updateEloRatings(gameState.whitePlayerId, gameState.blackPlayerId, 'draw');
  }, [gameState, updateEloRatings]);

  const getAvailableMoves = useCallback((square: Square): Square[] => {
    const moves = game.moves({ square, verbose: true });
    return moves.map(m => m.to as Square);
  }, [game]);

  return {
    game,
    gameState,
    isMyTurn,
    myColor,
    isLoading,
    error,
    makeMove,
    createGame,
    joinGame,
    joinByCode,
    resignGame,
    offerDraw,
    loadGame,
    getAvailableMoves,
    movedSquares,
  };
};
