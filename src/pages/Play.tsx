import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Swords, Users, Zap, Clock, Crown, Copy, Share2, 
  Flag, Handshake, ChevronRight, Palette, Sparkles, Lock, TrendingUp,
  Bot, User, ChevronLeft, Image, Eye, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useChessGame, TimeControl } from '@/hooks/useChessGame';
import { PlayableChessBoard } from '@/components/chess/PlayableChessBoard';
import { LiveColorLegend } from '@/components/chess/LiveColorLegend';
import { UniversalTimeline } from '@/components/chess/UniversalTimeline';
import { LegendHighlightProvider } from '@/contexts/LegendHighlightContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import AuthModal from '@/components/auth/AuthModal';
import { VisionaryMembershipCard } from '@/components/premium';
import { getRatingTier, previewEloChanges } from '@/lib/chess/eloCalculator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EloChangeAnimation } from '@/components/chess/EloChangeAnimation';
import { SoundSettings } from '@/components/chess/SoundSettings';
import { EnPensentControls } from '@/components/chess/EnPensentControls';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import { ExportVisualizationModal } from '@/components/chess/ExportVisualizationModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getBotMove, getBotThinkingDelay, BOT_DIFFICULTIES, BotDifficulty } from '@/lib/chess/chessBot';
import { getDrawToastMessage } from '@/lib/chess/drawReasons';
import { useChessSounds } from '@/hooks/useChessSounds';
import { useSoundStore } from '@/stores/soundStore';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

type ViewMode = 'lobby' | 'game' | 'waiting' | 'bot-game';
type GameType = 'human' | 'bot';

const TIME_CONTROLS: { id: TimeControl; label: string; icon: typeof Clock; description: string }[] = [
  { id: 'bullet_1', label: 'Bullet', icon: Zap, description: '1 minute' },
  { id: 'blitz_5', label: 'Blitz', icon: Clock, description: '5 minutes' },
  { id: 'rapid_15', label: 'Rapid', icon: Clock, description: '15 minutes' },
];

interface WaitingGame {
  id: string;
  white_player_id: string;
  time_control: TimeControl;
  created_at: string;
  white_elo?: number;
  profiles?: { display_name: string | null; elo_rating: number };
}

// Lobby section tabs for swipe navigation
type LobbySection = 'bot' | 'create' | 'join';
const LOBBY_SECTIONS: LobbySection[] = ['bot', 'create', 'join'];

const Play = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPremium } = useAuth();
  const { haptics } = useHapticFeedback();
  
  const [viewMode, setViewMode] = useState<ViewMode>('lobby');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Lobby section for mobile swipe navigation
  const [lobbySection, setLobbySection] = useState<LobbySection>('bot');
  
  // Game type selection
  const [gameType, setGameType] = useState<GameType>('human');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  
  // Game creation
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz_5');
  const [selectedPalette, setSelectedPalette] = useState<PaletteId>('hotCold');
  const [isPublicGame, setIsPublicGame] = useState(true);
  const [challengeCode, setChallengeCode] = useState('');
  
  // Bot game state (local only, no DB)
  const [botGame, setBotGame] = useState<Chess | null>(null);
  const [botMovedSquares, setBotMovedSquares] = useState<Set<string>>(new Set());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botGameResult, setBotGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [botMoveHistory, setBotMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const [botPlayerPalette, setBotPlayerPalette] = useState<PaletteId>('hotCold');
  const [botBotPalette, setBotBotPalette] = useState<PaletteId>('hotCold');
  
  // En Pensent mode state
  const [enPensentEnabled, setEnPensentEnabled] = useState(true);
  const [enPensentOpacity, setEnPensentOpacity] = useState(0.7);
  
  // Multiplayer move history for En Pensent
  const [multiplayerMoveHistory, setMultiplayerMoveHistory] = useState<MoveHistoryEntry[]>([]);
  
  // Sound effects for bot game
  const { enabled: soundEnabled, volume: soundVolume } = useSoundStore();
  const { playSound } = useChessSounds(soundEnabled, soundVolume);
  
  // Waiting games list
  const [waitingGames, setWaitingGames] = useState<WaitingGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [myEloRating, setMyEloRating] = useState<number>(1200);
  const [matchmakingRange, setMatchmakingRange] = useState<number>(200); // +/- ELO range
  
  // ELO animation state
  const [eloBeforeGame, setEloBeforeGame] = useState<number | null>(null);
  const [eloAfterGame, setEloAfterGame] = useState<number | null>(null);
  const [showEloAnimation, setShowEloAnimation] = useState(false);
  
  // Export visualization modal state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Timeline scrub state for completed games
  const [timelineMove, setTimelineMove] = useState<number>(Infinity);

  // Swipe navigation for lobby sections (mobile)
  const navigateToSection = useCallback((direction: 'left' | 'right') => {
    const currentIndex = LOBBY_SECTIONS.indexOf(lobbySection);
    let newIndex: number;
    
    if (direction === 'left') {
      newIndex = Math.min(currentIndex + 1, LOBBY_SECTIONS.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    if (newIndex !== currentIndex) {
      haptics.select();
      setLobbySection(LOBBY_SECTIONS[newIndex]);
    }
  }, [lobbySection, haptics]);

  const { swipeOffset, isSwiping, handlers: swipeHandlers } = useSwipeNavigation({
    threshold: 50,
    allowMouse: false, // Only touch on mobile
    onSwipeLeft: () => navigateToSection('left'),
    onSwipeRight: () => navigateToSection('right'),
  });
  
  // Chess game hook (for multiplayer)
  const {
    game,
    gameState,
    isMyTurn,
    myColor,
    isLoading,
    makeMove,
    createGame,
    joinGame,
    joinByCode,
    resignGame,
    offerDraw,
    loadGame,
    getAvailableMoves,
    movedSquares,
  } = useChessGame();

  // Reset ELO animation state when returning to lobby
  const handleBackToLobby = () => {
    setShowEloAnimation(false);
    setEloBeforeGame(null);
    setEloAfterGame(null);
    setBotGame(null);
    setBotMovedSquares(new Set());
    setBotMoveHistory([]);
    setBotGameResult(null);
    setMultiplayerMoveHistory([]);
    setViewMode('lobby');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onResign: gameState?.status === 'active' ? resignGame : undefined,
    onOfferDraw: gameState?.status === 'active' && isMyTurn ? offerDraw : undefined,
    onBackToLobby: viewMode !== 'lobby' ? handleBackToLobby : undefined,
    isGameActive: gameState?.status === 'active',
    isMyTurn,
  });

  // Check for game ID in URL
  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId) {
      loadGame(gameId).then(() => setViewMode('game'));
    }
  }, [searchParams, loadGame]);

  // Fetch user's ELO rating
  useEffect(() => {
    if (!user) return;
    
    const fetchMyRating = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('elo_rating')
        .eq('user_id', user.id)
        .single();
      
      if (data?.elo_rating) {
        setMyEloRating(data.elo_rating);
      }
    };
    
    fetchMyRating();
  }, [user]);

  // Fetch waiting games
  useEffect(() => {
    if (viewMode !== 'lobby') return;
    
    const fetchWaitingGames = async () => {
      setIsLoadingGames(true);
      const { data: games } = await supabase
        .from('chess_games')
        .select('id, white_player_id, time_control, created_at')
        .eq('status', 'waiting')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Fetch ELO ratings for game creators
      if (games && games.length > 0) {
        const userIds = games.map(g => g.white_player_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, elo_rating')
          .in('user_id', userIds);
        
        const eloMap: Record<string, number> = {};
        profiles?.forEach(p => { eloMap[p.user_id] = p.elo_rating || 1200; });
        
        const gamesWithElo = games.map(g => ({
          ...g,
          white_elo: eloMap[g.white_player_id] || 1200
        }));
        setWaitingGames(gamesWithElo as WaitingGame[]);
      } else {
        setWaitingGames([]);
      }
      setIsLoadingGames(false);
    };

    fetchWaitingGames();
    
    // Subscribe to new games
    const channel = supabase
      .channel('waiting-games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chess_games' },
        () => fetchWaitingGames()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewMode]);

  // Watch for game state changes
  useEffect(() => {
    if (gameState?.status === 'active' && viewMode !== 'game') {
      setViewMode('game');
      // Store ELO before game starts for animation
      if (eloBeforeGame === null) {
        setEloBeforeGame(myEloRating);
      }
    }
  }, [gameState?.status, viewMode, myEloRating, eloBeforeGame]);

  // Watch for game completion to trigger ELO animation
  useEffect(() => {
    if (gameState?.status === 'completed' && eloBeforeGame !== null && !showEloAnimation && user) {
      // Fetch updated ELO rating
      const fetchNewRating = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('elo_rating')
          .eq('user_id', user.id)
          .single();
        
        if (data?.elo_rating !== undefined) {
          setEloAfterGame(data.elo_rating);
          setMyEloRating(data.elo_rating);
          // Small delay to let the UI settle before showing animation
          setTimeout(() => setShowEloAnimation(true), 500);
        }
      };
      
      fetchNewRating();
    }
  }, [gameState?.status, eloBeforeGame, showEloAnimation, user]);

  const handleCreateGame = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const palette = colorPalettes.find(p => p.id === selectedPalette);
    const colors = palette?.white || {};
    
    const gameId = await createGame(selectedTimeControl, isPublicGame, colors);
    if (gameId) {
      setViewMode('waiting');
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const palette = colorPalettes.find(p => p.id === selectedPalette);
    const colors = palette?.black || {};
    
    const success = await joinGame(gameId, colors);
    if (success) {
      setViewMode('game');
    }
  };

  const handleJoinByCode = async () => {
    if (!challengeCode.trim()) {
      toast.error('Please enter a challenge code');
      return;
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const palette = colorPalettes.find(p => p.id === selectedPalette);
    const colors = palette?.black || {};
    
    const success = await joinByCode(challengeCode.trim(), colors);
    if (success) {
      setViewMode('game');
    }
  };

  // Get games filtered by ELO range
  const getMatchedGames = () => {
    if (!waitingGames.length) return [];
    
    return waitingGames
      .filter(g => {
        const gameElo = g.white_elo || 1200;
        const diff = Math.abs(gameElo - myEloRating);
        return diff <= matchmakingRange;
      })
      .sort((a, b) => {
        // Sort by closest ELO first
        const diffA = Math.abs((a.white_elo || 1200) - myEloRating);
        const diffB = Math.abs((b.white_elo || 1200) - myEloRating);
        return diffA - diffB;
      });
  };

  // Quick match - automatically join the best matched game
  const handleQuickMatch = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    const matchedGames = getMatchedGames().filter(g => g.white_player_id !== user.id);
    
    if (matchedGames.length > 0) {
      // Join the closest ELO match
      await handleJoinGame(matchedGames[0].id);
    } else {
      // No matched games, create a new one
      toast.info('No matching opponents found. Creating a new game...');
      await handleCreateGame();
    }
  };

  const copyChallenge = () => {
    if (gameState?.challengeCode) {
      navigator.clipboard.writeText(gameState.challengeCode);
      toast.success('Challenge code copied!');
    }
  };

  const shareGame = () => {
    const url = `${window.location.origin}/play?game=${gameState?.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Game link copied!');
  };

  const getMyPalette = () => {
    if (!gameState) return {};
    const palette = myColor === 'w' ? gameState.whitePalette : gameState.blackPalette;
    return palette || colorPalettes[0].white;
  };

  const getOpponentPalette = () => {
    if (!gameState) return {};
    const palette = myColor === 'w' ? gameState.blackPalette : gameState.whitePalette;
    return palette || colorPalettes[0].black;
  };

  // ========== BOT GAME FUNCTIONS ==========
  
  const startBotGame = () => {
    // No premium required for bot games - accessible to all!
    const newGame = new Chess();
    setBotGame(newGame);
    setBotMovedSquares(new Set());
    setBotMoveHistory([]);
    setBotGameResult(null);
    
    // Player keeps their selected palette, bot gets random one
    setBotPlayerPalette(selectedPalette);
    const otherPalettes = colorPalettes.filter(p => p.id !== selectedPalette);
    const randomBotPalette = otherPalettes[Math.floor(Math.random() * otherPalettes.length)];
    setBotBotPalette(randomBotPalette.id);
    
    setViewMode('bot-game');
    playSound('gameStart');
    haptics.gameStart();
    toast.success(`Starting game vs ${BOT_DIFFICULTIES.find(d => d.id === botDifficulty)?.label} bot • Bot using ${randomBotPalette.name} palette`);
  };

  // Helper to extract piece info from a move for En Pensent tracking
  const extractMoveInfo = (game: Chess, from: Square, to: Square): { piece: PieceType; color: PieceColor } | null => {
    const pieceAt = game.get(from);
    if (!pieceAt) return null;
    return {
      piece: pieceAt.type as PieceType,
      color: pieceAt.color as PieceColor,
    };
  };

  const makeBotGameMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    if (!botGame || isBotThinking) return false;
    
    try {
      // Extract piece info BEFORE the move
      const pieceInfo = extractMoveInfo(botGame, from, to);
      
      const move = botGame.move({ from, to, promotion });
      if (!move) {
        playSound('illegal');
        haptics.error();
        return false;
      }

      // Track move for En Pensent visualization
      if (pieceInfo) {
        const newEntry: MoveHistoryEntry = {
          square: to,
          piece: pieceInfo.piece,
          color: pieceInfo.color,
          moveNumber: botGame.history().length,
        };
        setBotMoveHistory(prev => [...prev, newEntry]);
      }

      // Play sound and haptic for player's move
      if (botGame.isCheckmate()) {
        playSound('checkmate');
        haptics.victory();
      } else if (botGame.isCheck()) {
        playSound('check');
        haptics.check();
      } else if (move.captured) {
        playSound('capture');
        haptics.capture();
      } else if (move.san === 'O-O' || move.san === 'O-O-O') {
        playSound('castle');
        haptics.castle();
      } else {
        playSound('move');
        haptics.move();
      }

      setBotGame(new Chess(botGame.fen()));
      setBotMovedSquares(prev => new Set([...prev, to]));

      // Check if game is over after player's move
      if (botGame.isGameOver()) {
        if (botGame.isCheckmate()) {
          setBotGameResult('win');
          playSound('victory');
          haptics.victory();
          toast.success('Checkmate! You won!');
        } else {
          setBotGameResult('draw');
          playSound('draw');
          toast.info(getDrawToastMessage(botGame));
        }
        return true;
      }

      // Bot's turn
      setIsBotThinking(true);
      const thinkingTime = getBotThinkingDelay(botDifficulty);
      
      await new Promise(resolve => setTimeout(resolve, thinkingTime));
      
      const botMoveResult = getBotMove(botGame, botDifficulty);
      if (botMoveResult) {
        // Track bot's move for En Pensent visualization
        const botPieceInfo = extractMoveInfo(botGame, botMoveResult.from as Square, botMoveResult.to as Square);
        
        botGame.move(botMoveResult);
        
        // Add to move history
        if (botPieceInfo) {
          const botEntry: MoveHistoryEntry = {
            square: botMoveResult.to,
            piece: botPieceInfo.piece,
            color: botPieceInfo.color,
            moveNumber: botGame.history().length,
          };
          setBotMoveHistory(prev => [...prev, botEntry]);
        }
        
        // Play sound and haptic for bot's move
        if (botGame.isCheckmate()) {
          playSound('checkmate');
          haptics.error();
        } else if (botGame.isCheck()) {
          playSound('check');
          haptics.check();
        } else if (botMoveResult.captured) {
          playSound('capture');
          haptics.capture();
        } else if (botMoveResult.san === 'O-O' || botMoveResult.san === 'O-O-O') {
          playSound('castle');
        } else {
          playSound('move');
          haptics.move();
        }

        setBotGame(new Chess(botGame.fen()));
        setBotMovedSquares(prev => new Set([...prev, botMoveResult.to]));

        // Check if game is over after bot's move
        if (botGame.isGameOver()) {
          if (botGame.isCheckmate()) {
            setBotGameResult('loss');
            playSound('defeat');
            haptics.error();
            toast.error('Checkmate! You lost.');
          } else {
            setBotGameResult('draw');
            playSound('draw');
            toast.info(getDrawToastMessage(botGame));
          }
        }
      }
      
      setIsBotThinking(false);
      return true;
    } catch (e) {
      console.error('Bot game move error:', e);
      setIsBotThinking(false);
      haptics.error();
      return false;
    }
  }, [botGame, isBotThinking, botDifficulty, playSound, haptics]);

  const getBotGameAvailableMoves = useCallback((square: Square): Square[] => {
    if (!botGame) return [];
    const moves = botGame.moves({ square, verbose: true });
    return moves.map(m => m.to as Square);
  }, [botGame]);

  const resignBotGame = () => {
    setBotGameResult('loss');
    playSound('defeat');
    haptics.error();
    toast.info('You resigned.');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero - more compact on mobile */}
          <div className="text-center space-y-3 sm:space-y-6 mb-6 sm:mb-12 relative">
            {/* Sound Settings - positioned top right */}
            <div className="absolute right-0 top-0">
              <SoundSettings />
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-display uppercase tracking-widest">
              <Swords className="h-3 w-3 sm:h-4 sm:w-4" />
              Visionary Exclusive
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Play <span className="text-gold-gradient">En Pensent</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto px-2">
              Experience chess as art. Watch your visualization come alive <span className="text-primary font-medium">as you play</span>.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-display">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Toggle "En Pensent" mode during any game to see colors fill the board live</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* LOBBY VIEW */}
            {viewMode === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-8"
              >
                {/* Mobile Section Tabs */}
                <div className="sm:hidden">
                  <div className="flex justify-center gap-1 mb-4">
                    {LOBBY_SECTIONS.map((section) => (
                      <button
                        key={section}
                        onClick={() => {
                          haptics.select();
                          setLobbySection(section);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-display uppercase tracking-wider transition-all touch-manipulation ${
                          lobbySection === section
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {section === 'bot' ? 'Bot' : section === 'create' ? 'Create' : 'Join'}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mb-2">
                    Swipe left/right to navigate
                  </p>
                </div>
                {/* Play vs Bot - Mobile optimized */}
                <div className="p-4 sm:p-6 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-display font-bold uppercase tracking-wider text-sm sm:text-base">Practice vs Bot</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground font-serif">Free for everyone! Watch your vision generate live.</p>
                        </div>
                      </div>
                      <Button 
                        onClick={startBotGame} 
                        className="gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 h-11 sm:h-10 text-sm touch-manipulation"
                      >
                        <Bot className="h-4 w-4" />
                        Play Bot
                      </Button>
                    </div>
                    
                    {/* Difficulty selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Swords className="h-3 w-3" />
                        Difficulty
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {BOT_DIFFICULTIES.map(diff => (
                          <button
                            key={diff.id}
                            onClick={() => setBotDifficulty(diff.id)}
                            className={`px-2 py-2.5 rounded-lg text-xs font-display transition-all touch-manipulation text-center ${
                              botDifficulty === diff.id
                                ? 'bg-green-500 text-white'
                                : 'bg-card/50 border border-border/50 text-muted-foreground active:bg-green-500/20'
                            }`}
                          >
                            <div>{diff.label}</div>
                            <div className="text-[10px] opacity-70">{diff.rating}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Your Palette selector for bot games */}
                    <div className="space-y-2">
                      <label className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Palette className="h-3 w-3" />
                        Your Palette (Bot gets random)
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {colorPalettes.slice(0, 8).map(palette => (
                          <button
                            key={palette.id}
                            onClick={() => setSelectedPalette(palette.id)}
                            className={`p-1.5 rounded-lg border transition-all touch-manipulation ${
                              selectedPalette === palette.id
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-border/50 active:bg-green-500/5'
                            }`}
                          >
                            <div className="flex gap-0.5 mb-0.5 justify-center">
                              {Object.values(palette.white).slice(0, 3).map((color, i) => (
                                <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            <p className="text-[7px] sm:text-[8px] font-display truncate">{palette.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {!isPremium && (
                  <div className="p-4 sm:p-6 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-display font-bold uppercase tracking-wider text-sm sm:text-base">Visionary Exclusive</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-serif">Upgrade to play online with visualization</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowUpgradeModal(true)} className="gap-2 w-full sm:w-auto h-11 sm:h-10 touch-manipulation">
                      <Sparkles className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </div>
                )}

                {/* ELO Rating & Quick Match - Mobile optimized */}
                {user && isPremium && (
                  <div className="p-4 sm:p-6 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-center">
                          <span className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${getRatingTier(myEloRating).color} text-white font-display text-base sm:text-lg`}>
                            {myEloRating}
                          </span>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-display uppercase">{getRatingTier(myEloRating).name}</p>
                        </div>
                        <div>
                          <h3 className="font-display font-bold uppercase tracking-wider flex items-center gap-2 text-sm sm:text-base">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Your Rating
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground font-serif">
                            Range: ±{matchmakingRange} ELO
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
                          {[100, 200, 400].map(range => (
                            <button
                              key={range}
                              onClick={() => setMatchmakingRange(range)}
                              className={`px-3 py-2.5 sm:py-1 rounded-lg text-xs font-display transition-all touch-manipulation ${
                                matchmakingRange === range
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card/50 border border-border/50 text-muted-foreground active:bg-primary/20'
                              }`}
                            >
                              ±{range}
                            </button>
                          ))}
                        </div>
                        <Button onClick={handleQuickMatch} className="gap-2 h-11 sm:h-10 touch-manipulation" disabled={isLoading}>
                          <Zap className="h-4 w-4" />
                          Quick Match
                        </Button>
                      </div>
                    </div>
                    {getMatchedGames().length > 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground font-serif">
                        {getMatchedGames().filter(g => g.white_player_id !== user?.id).length} opponent{getMatchedGames().filter(g => g.white_player_id !== user?.id).length !== 1 ? 's' : ''} in your skill range
                      </p>
                    )}
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Create Game */}
                  <div className="p-4 sm:p-6 rounded-lg border border-border/50 bg-card/50 space-y-4 sm:space-y-6">
                    <h2 className="text-lg sm:text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                      <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Create Game
                    </h2>

                    {/* Time Control */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-xs sm:text-sm font-display uppercase tracking-wider text-muted-foreground">
                        Time Control
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_CONTROLS.map(tc => (
                          <button
                            key={tc.id}
                            onClick={() => setSelectedTimeControl(tc.id)}
                            className={`p-2.5 sm:p-3 rounded-lg border text-center transition-all touch-manipulation ${
                              selectedTimeControl === tc.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 active:bg-primary/5'
                            }`}
                          >
                            <tc.icon className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-primary" />
                            <p className="font-display text-xs sm:text-sm">{tc.label}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{tc.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Palette - scrollable on mobile */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-xs sm:text-sm font-display uppercase tracking-wider text-muted-foreground">
                        Your Palette
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {colorPalettes.slice(0, 8).map(palette => (
                          <button
                            key={palette.id}
                            onClick={() => setSelectedPalette(palette.id)}
                            className={`p-1.5 sm:p-2 rounded-lg border transition-all touch-manipulation ${
                              selectedPalette === palette.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 active:bg-primary/5'
                            }`}
                          >
                            <div className="flex gap-0.5 mb-1 justify-center">
                              {Object.values(palette.white).slice(0, 4).map((color, i) => (
                                <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            <p className="text-[8px] sm:text-[10px] font-display truncate">{palette.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Public/Private */}
                    <div className="flex items-center gap-2 sm:gap-4">
                      <button
                        onClick={() => setIsPublicGame(true)}
                        className={`flex-1 p-2.5 sm:p-3 rounded-lg border text-center transition-all touch-manipulation ${
                          isPublicGame ? 'border-primary bg-primary/10' : 'border-border/50'
                        }`}
                      >
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-display">Quick Match</p>
                      </button>
                      <button
                        onClick={() => setIsPublicGame(false)}
                        className={`flex-1 p-2.5 sm:p-3 rounded-lg border text-center transition-all touch-manipulation ${
                          !isPublicGame ? 'border-primary bg-primary/10' : 'border-border/50'
                        }`}
                      >
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-display">Challenge</p>
                      </button>
                    </div>

                    <Button 
                      onClick={handleCreateGame} 
                      className="w-full gap-2 h-11 sm:h-10 touch-manipulation"
                      disabled={isLoading || !isPremium}
                    >
                      {!isPremium && <Lock className="h-4 w-4" />}
                      Create Game
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Join Game */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Join by Code */}
                    <div className="p-4 sm:p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 sm:space-y-4">
                      <h2 className="text-lg sm:text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Join by Code
                      </h2>
                      <div className="flex gap-2">
                        <Input
                          value={challengeCode}
                          onChange={(e) => setChallengeCode(e.target.value.toUpperCase())}
                          placeholder="6-digit code"
                          className="font-mono text-base sm:text-lg tracking-widest h-11 sm:h-10"
                          maxLength={6}
                          inputMode="text"
                          autoComplete="off"
                          autoCorrect="off"
                        />
                        <Button onClick={handleJoinByCode} disabled={isLoading || !isPremium} className="h-11 sm:h-10 px-4 sm:px-6 touch-manipulation">
                          Join
                        </Button>
                      </div>
                    </div>

                    {/* Waiting Games */}
                    <div className="p-4 sm:p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 sm:space-y-4">
                      <h2 className="text-lg sm:text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Open Games
                      </h2>
                      
                      {isLoadingGames ? (
                        <p className="text-muted-foreground text-sm font-serif">Loading...</p>
                      ) : waitingGames.length === 0 ? (
                        <p className="text-muted-foreground text-xs sm:text-sm font-serif italic">
                          No games waiting. Create one!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto -mx-1 px-1">
                          {waitingGames.map(g => {
                            const opponentElo = g.white_elo || 1200;
                            const isMatched = user && Math.abs(opponentElo - myEloRating) <= matchmakingRange;
                            const isOwnGame = g.white_player_id === user?.id;
                            const eloPreview = user ? previewEloChanges(myEloRating, opponentElo) : null;
                            
                            return (
                              <div
                                key={g.id}
                                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all ${
                                  isMatched && !isOwnGame
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'bg-card/50 border-border/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <p className="font-display text-xs sm:text-sm">
                                        {TIME_CONTROLS.find(tc => tc.id === g.time_control)?.label || 'Blitz'}
                                      </p>
                                      {isMatched && !isOwnGame && (
                                        <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-primary/20 text-primary font-display uppercase">
                                          Match
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {opponentElo && (
                                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r ${getRatingTier(opponentElo).color} text-white font-display flex-shrink-0`}>
                                      {opponentElo}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                  {/* ELO Preview - hidden on mobile, visible on larger screens */}
                                  {eloPreview && !isOwnGame && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded bg-card border border-border/50 cursor-help">
                                            <span className="text-green-500">+{eloPreview.win}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className={eloPreview.draw >= 0 ? "text-blue-400" : "text-orange-400"}>
                                              {eloPreview.draw >= 0 ? `+${eloPreview.draw}` : eloPreview.draw}
                                            </span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="text-red-500">{eloPreview.loss}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="space-y-1">
                                          <p className="font-display text-xs uppercase tracking-wider mb-1">ELO Change Preview</p>
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-500 font-bold">Win:</span>
                                            <span>+{eloPreview.win} → {myEloRating + eloPreview.win}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="text-blue-400 font-bold">Draw:</span>
                                            <span>{eloPreview.draw >= 0 ? `+${eloPreview.draw}` : eloPreview.draw} → {myEloRating + eloPreview.draw}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="text-red-500 font-bold">Loss:</span>
                                            <span>{eloPreview.loss} → {myEloRating + eloPreview.loss}</span>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => handleJoinGame(g.id)}
                                    disabled={isLoading || !isPremium || isOwnGame}
                                    variant={isMatched && !isOwnGame ? 'default' : 'outline'}
                                    className="h-9 sm:h-8 px-3 sm:px-4 text-xs touch-manipulation"
                                  >
                                    Join
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* WAITING VIEW */}
            {viewMode === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8"
              >
                <div className="p-8 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4"
                  >
                    <Swords className="w-full h-full text-primary" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-2">
                    Waiting for Opponent
                  </h2>
                  
                  {gameState?.challengeCode && !isPublicGame && (
                    <div className="mt-6 space-y-4">
                      <p className="text-muted-foreground font-serif">Share this code with your friend:</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-mono tracking-[0.5em] text-primary">
                          {gameState.challengeCode}
                        </span>
                        <Button variant="outline" size="icon" onClick={copyChallenge}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewMode('lobby');
                    }}
                    className="mt-6"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* GAME VIEW */}
            {viewMode === 'game' && gameState && (
              <motion.div
                key="game"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Game Header - stacked on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className={`text-sm sm:text-base font-display uppercase tracking-wider ${
                      isMyTurn && gameState.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {gameState.status === 'active' 
                        ? isMyTurn ? "Your Turn" : "Opponent's Turn"
                        : gameState.result === 'draw' ? 'Draw'
                        : gameState.winnerId === user?.id ? 'You Won!' : 'You Lost'}
                    </p>
                    <p className="text-xs text-muted-foreground font-serif">
                      Playing as {myColor === 'w' ? 'White' : 'Black'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center sm:justify-end flex-wrap">
                    {/* En Pensent Toggle - The Revolutionary Feature */}
                    <EnPensentControls
                      isEnabled={enPensentEnabled}
                      opacity={enPensentOpacity}
                      onToggle={() => setEnPensentEnabled(!enPensentEnabled)}
                      onOpacityChange={setEnPensentOpacity}
                      totalMoves={multiplayerMoveHistory.length}
                    />
                    
                    {gameState.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm" onClick={offerDraw} className="gap-1.5 h-10 sm:h-9 px-4 touch-manipulation">
                          <Handshake className="h-4 w-4" />
                          <span className="hidden sm:inline">Offer </span>Draw
                        </Button>
                        <Button variant="outline" size="sm" onClick={resignGame} className="gap-1.5 h-10 sm:h-9 px-4 text-destructive touch-manipulation">
                          <Flag className="h-4 w-4" />
                          Resign
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Chess Board with Legend */}
                <LegendHighlightProvider>
                  <div className="grid lg:grid-cols-[1fr,280px] gap-4">
                    <PlayableChessBoard
                      fen={gameState.currentFen}
                      onMove={makeMove}
                      getAvailableMoves={getAvailableMoves}
                      isMyTurn={isMyTurn}
                      myColor={myColor}
                      whitePalette={gameState.whitePalette || colorPalettes[0].white}
                      blackPalette={gameState.blackPalette || colorPalettes[0].black}
                      movedSquares={movedSquares}
                      disabled={gameState.status !== 'active'}
                      enPensentEnabled={enPensentEnabled}
                      enPensentOpacity={enPensentOpacity}
                      moveHistory={multiplayerMoveHistory}
                    />
                    
                    {/* Live Color Legend - The Legendary System */}
                    {enPensentEnabled && (
                      <div className="hidden lg:block">
                        <LiveColorLegend
                          whitePalette={gameState.whitePalette || colorPalettes[0].white}
                          blackPalette={gameState.blackPalette || colorPalettes[0].black}
                          moveHistory={multiplayerMoveHistory}
                          title="Live Legend"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Legend - collapsible */}
                  {enPensentEnabled && (
                    <div className="lg:hidden">
                      <LiveColorLegend
                        whitePalette={gameState.whitePalette || colorPalettes[0].white}
                        blackPalette={gameState.blackPalette || colorPalettes[0].black}
                        moveHistory={multiplayerMoveHistory}
                        compact
                        title="Legend"
                      />
                    </div>
                  )}
                </LegendHighlightProvider>

                {/* Move count / PGN display - collapsible on mobile */}
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/30">
                  <p className="text-xs sm:text-sm text-muted-foreground font-display uppercase tracking-wider mb-1 sm:mb-2">
                    Moves: {gameState.moveCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-mono break-all line-clamp-2 sm:line-clamp-none">
                    {gameState.pgn || 'Game started...'}
                  </p>
                </div>

                {/* Post-game ELO Animation */}
                {gameState.status === 'completed' && eloBeforeGame !== null && eloAfterGame !== null && (
                  <EloChangeAnimation
                    oldRating={eloBeforeGame}
                    newRating={eloAfterGame}
                    isWin={gameState.winnerId === user?.id}
                    isDraw={gameState.result === 'draw'}
                    show={showEloAnimation}
                  />
                )}

                {/* Post-game actions */}
                {gameState.status === 'completed' && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap">
                    <Button onClick={handleBackToLobby} className="h-11 sm:h-10 touch-manipulation">
                      Back to Lobby
                    </Button>
                    <Button variant="outline" onClick={shareGame} className="gap-2 h-11 sm:h-10 touch-manipulation">
                      <Share2 className="h-4 w-4" />
                      Share Game
                    </Button>
                    {enPensentEnabled && multiplayerMoveHistory.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExportModal(true)} 
                        className="gap-2 h-11 sm:h-10 touch-manipulation border-primary/30 bg-primary/5 hover:bg-primary/10"
                      >
                        <Image className="h-4 w-4" />
                        Export Art
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* BOT GAME VIEW */}
            {viewMode === 'bot-game' && botGame && (
              <motion.div
                key="bot-game"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Game Header - stacked on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className={`text-sm sm:text-base font-display uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2 ${
                      !isBotThinking && !botGameResult ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <Bot className="h-4 w-4" />
                      {botGameResult 
                        ? botGameResult === 'win' ? 'You Won!' 
                          : botGameResult === 'loss' ? 'You Lost' 
                          : 'Draw'
                        : isBotThinking ? "Bot thinking..." : "Your Turn"}
                    </p>
                    <p className="text-xs text-muted-foreground font-serif">
                      vs {BOT_DIFFICULTIES.find(d => d.id === botDifficulty)?.label} Bot ({BOT_DIFFICULTIES.find(d => d.id === botDifficulty)?.rating})
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center sm:justify-end flex-wrap">
                    {/* En Pensent Toggle - The Revolutionary Feature */}
                    <EnPensentControls
                      isEnabled={enPensentEnabled}
                      opacity={enPensentOpacity}
                      onToggle={() => setEnPensentEnabled(!enPensentEnabled)}
                      onOpacityChange={setEnPensentOpacity}
                      totalMoves={botMoveHistory.length}
                    />
                    
                    {!botGameResult && (
                      <Button variant="outline" size="sm" onClick={resignBotGame} className="gap-1.5 h-10 sm:h-9 px-4 text-destructive touch-manipulation">
                        <Flag className="h-4 w-4" />
                        Resign
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chess Board with Legend */}
                <LegendHighlightProvider>
                  <div className="grid lg:grid-cols-[1fr,280px] gap-4">
                    <PlayableChessBoard
                      fen={botGame.fen()}
                      onMove={makeBotGameMove}
                      getAvailableMoves={getBotGameAvailableMoves}
                      isMyTurn={!isBotThinking && !botGameResult && botGame.turn() === 'w'}
                      myColor="w"
                      whitePalette={colorPalettes.find(p => p.id === botPlayerPalette)?.white || colorPalettes[0].white}
                      blackPalette={colorPalettes.find(p => p.id === botBotPalette)?.black || colorPalettes[0].black}
                      movedSquares={botMovedSquares}
                      disabled={isBotThinking || !!botGameResult}
                      enPensentEnabled={enPensentEnabled}
                      enPensentOpacity={enPensentOpacity}
                      moveHistory={botMoveHistory}
                    />
                    
                    {/* Live Color Legend - The Legendary System */}
                    {enPensentEnabled && (
                      <div className="hidden lg:block">
                        <LiveColorLegend
                          whitePalette={colorPalettes.find(p => p.id === botPlayerPalette)?.white || colorPalettes[0].white}
                          blackPalette={colorPalettes.find(p => p.id === botBotPalette)?.black || colorPalettes[0].black}
                          moveHistory={botMoveHistory}
                          title="Live Legend"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Legend - compact */}
                  {enPensentEnabled && (
                    <div className="lg:hidden">
                      <LiveColorLegend
                        whitePalette={colorPalettes.find(p => p.id === botPlayerPalette)?.white || colorPalettes[0].white}
                        blackPalette={colorPalettes.find(p => p.id === botBotPalette)?.black || colorPalettes[0].black}
                        moveHistory={botMoveHistory}
                        compact
                        title="Legend"
                      />
                    </div>
                  )}
                </LegendHighlightProvider>

                {/* Move display with Timeline for completed games */}
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/30 space-y-3">
                  <p className="text-xs sm:text-sm text-muted-foreground font-display uppercase tracking-wider mb-1 sm:mb-2">
                    Moves: {botGame.history().length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-mono break-all line-clamp-2 sm:line-clamp-none">
                    {botGame.pgn() || 'Game started...'}
                  </p>
                  
                  {/* Timeline for post-game replay */}
                  {botGameResult && enPensentEnabled && botMoveHistory.length > 0 && (
                    <UniversalTimeline
                      totalMoves={botMoveHistory.length}
                      moves={botGame.history()}
                      moveHistory={botMoveHistory}
                      currentMove={timelineMove === Infinity ? botMoveHistory.length : timelineMove}
                      onMoveChange={setTimelineMove}
                      compact
                    />
                  )}
                </div>

                {/* Post-game actions */}
                {botGameResult && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap">
                    <Button onClick={handleBackToLobby} className="h-11 sm:h-10 touch-manipulation">
                      Back to Lobby
                    </Button>
                    <Button variant="outline" onClick={startBotGame} className="gap-2 h-11 sm:h-10 touch-manipulation">
                      <Bot className="h-4 w-4" />
                      Play Again
                    </Button>
                    {enPensentEnabled && botMoveHistory.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExportModal(true)} 
                        className="gap-2 h-11 sm:h-10 touch-manipulation border-primary/30 bg-primary/5 hover:bg-primary/10"
                      >
                        <Image className="h-4 w-4" />
                        Export Art
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <VisionaryMembershipCard
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="general"
      />

      {/* Export Visualization Modal for post-game En Pensent art */}
      <ExportVisualizationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        moveHistory={viewMode === 'bot-game' ? botMoveHistory : multiplayerMoveHistory}
        whitePalette={
          viewMode === 'bot-game' 
            ? colorPalettes.find(p => p.id === botPlayerPalette)?.white || colorPalettes[0].white
            : gameState?.whitePalette || colorPalettes[0].white
        }
        blackPalette={
          viewMode === 'bot-game'
            ? colorPalettes.find(p => p.id === botBotPalette)?.black || colorPalettes[0].black
            : gameState?.blackPalette || colorPalettes[0].black
        }
        gameInfo={{
          white: viewMode === 'bot-game' ? 'You' : (myColor === 'w' ? 'You' : 'Opponent'),
          black: viewMode === 'bot-game' 
            ? `${BOT_DIFFICULTIES.find(d => d.id === botDifficulty)?.label} Bot`
            : (myColor === 'b' ? 'You' : 'Opponent'),
          result: viewMode === 'bot-game'
            ? (botGameResult === 'win' ? 'You Won!' : botGameResult === 'loss' ? 'You Lost' : 'Draw')
            : (gameState?.result || 'Game Finished'),
          totalMoves: viewMode === 'bot-game' ? botMoveHistory.length : multiplayerMoveHistory.length,
        }}
      />
    </div>
  );
};

export default Play;
