import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { 
  Swords, Users, Zap, Clock, Crown, Copy, Share2, 
  Flag, Handshake, ChevronRight, Palette, Sparkles, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useChessGame, TimeControl } from '@/hooks/useChessGame';
import { PlayableChessBoard } from '@/components/chess/PlayableChessBoard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import AuthModal from '@/components/auth/AuthModal';
import PremiumUpgradeModal from '@/components/premium/PremiumUpgradeModal';

type ViewMode = 'lobby' | 'game' | 'waiting';

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
  profiles?: { display_name: string | null };
}

const Play = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPremium } = useAuth();
  
  const [viewMode, setViewMode] = useState<ViewMode>('lobby');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Game creation
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz_5');
  const [selectedPalette, setSelectedPalette] = useState<PaletteId>('hotCold');
  const [isPublicGame, setIsPublicGame] = useState(true);
  const [challengeCode, setChallengeCode] = useState('');
  
  // Waiting games list
  const [waitingGames, setWaitingGames] = useState<WaitingGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  
  // Chess game hook
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

  // Check for game ID in URL
  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId) {
      loadGame(gameId).then(() => setViewMode('game'));
    }
  }, [searchParams, loadGame]);

  // Fetch waiting games
  useEffect(() => {
    if (viewMode !== 'lobby') return;
    
    const fetchWaitingGames = async () => {
      setIsLoadingGames(true);
      const { data } = await supabase
        .from('chess_games')
        .select('id, white_player_id, time_control, created_at')
        .eq('status', 'waiting')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setWaitingGames((data as WaitingGame[]) || []);
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
    }
  }, [gameState?.status, viewMode]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Swords className="h-4 w-4" />
              Visionary Exclusive
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Play <span className="text-gold-gradient">En Pensent</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-2xl mx-auto">
              Experience chess as art. Watch your visualization come alive as you play — 
              each move reveals more of your unique color palette.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* LOBBY VIEW */}
            {viewMode === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {!isPremium && (
                  <div className="p-6 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Crown className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-display font-bold uppercase tracking-wider">Visionary Exclusive</h3>
                        <p className="text-sm text-muted-foreground font-serif">Upgrade to play online chess with live visualization</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Create Game */}
                  <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-6">
                    <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                      <Swords className="h-5 w-5 text-primary" />
                      Create Game
                    </h2>

                    {/* Time Control */}
                    <div className="space-y-3">
                      <label className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                        Time Control
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_CONTROLS.map(tc => (
                          <button
                            key={tc.id}
                            onClick={() => setSelectedTimeControl(tc.id)}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              selectedTimeControl === tc.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 hover:border-primary/30'
                            }`}
                          >
                            <tc.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                            <p className="font-display text-sm">{tc.label}</p>
                            <p className="text-xs text-muted-foreground">{tc.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Palette */}
                    <div className="space-y-3">
                      <label className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                        Your Palette (White Pieces)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPalettes.slice(0, 8).map(palette => (
                          <button
                            key={palette.id}
                            onClick={() => setSelectedPalette(palette.id)}
                            className={`p-2 rounded-lg border transition-all ${
                              selectedPalette === palette.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 hover:border-primary/30'
                            }`}
                          >
                            <div className="flex gap-0.5 mb-1">
                              {Object.values(palette.white).slice(0, 4).map((color, i) => (
                                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            <p className="text-[10px] font-display truncate">{palette.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Public/Private */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsPublicGame(true)}
                        className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                          isPublicGame ? 'border-primary bg-primary/10' : 'border-border/50'
                        }`}
                      >
                        <Users className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-sm font-display">Quick Match</p>
                      </button>
                      <button
                        onClick={() => setIsPublicGame(false)}
                        className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                          !isPublicGame ? 'border-primary bg-primary/10' : 'border-border/50'
                        }`}
                      >
                        <Share2 className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-sm font-display">Challenge Friend</p>
                      </button>
                    </div>

                    <Button 
                      onClick={handleCreateGame} 
                      className="w-full gap-2"
                      disabled={isLoading || !isPremium}
                    >
                      {!isPremium && <Lock className="h-4 w-4" />}
                      Create Game
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Join Game */}
                  <div className="space-y-6">
                    {/* Join by Code */}
                    <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
                      <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Join by Code
                      </h2>
                      <div className="flex gap-2">
                        <Input
                          value={challengeCode}
                          onChange={(e) => setChallengeCode(e.target.value.toUpperCase())}
                          placeholder="Enter 6-digit code"
                          className="font-mono text-lg tracking-widest"
                          maxLength={6}
                        />
                        <Button onClick={handleJoinByCode} disabled={isLoading || !isPremium}>
                          Join
                        </Button>
                      </div>
                    </div>

                    {/* Waiting Games */}
                    <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
                      <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Open Games
                      </h2>
                      
                      {isLoadingGames ? (
                        <p className="text-muted-foreground text-sm font-serif">Loading...</p>
                      ) : waitingGames.length === 0 ? (
                        <p className="text-muted-foreground text-sm font-serif italic">
                          No games waiting. Create one!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {waitingGames.map(g => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30"
                            >
                              <div>
                                <p className="font-display text-sm">
                                  {TIME_CONTROLS.find(tc => tc.id === g.time_control)?.label || 'Blitz'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(g.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleJoinGame(g.id)}
                                disabled={isLoading || !isPremium || g.white_player_id === user?.id}
                              >
                                Join
                              </Button>
                            </div>
                          ))}
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
                className="space-y-6"
              >
                {/* Game Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-display uppercase tracking-wider">
                      {gameState.status === 'active' 
                        ? isMyTurn ? "Your Turn" : "Opponent's Turn"
                        : gameState.result === 'draw' ? 'Draw'
                        : gameState.winnerId === user?.id ? 'You Won!' : 'You Lost'}
                    </p>
                    <p className="text-xs text-muted-foreground font-serif">
                      Playing as {myColor === 'w' ? 'White' : 'Black'}
                    </p>
                  </div>
                  
                  {gameState.status === 'active' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={offerDraw} className="gap-1">
                        <Handshake className="h-4 w-4" />
                        Draw
                      </Button>
                      <Button variant="outline" size="sm" onClick={resignGame} className="gap-1 text-destructive">
                        <Flag className="h-4 w-4" />
                        Resign
                      </Button>
                    </div>
                  )}
                </div>

                {/* Chess Board */}
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
                />

                {/* Move count / PGN display */}
                <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                  <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-2">
                    Moves: {gameState.moveCount}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {gameState.pgn || 'Game started...'}
                  </p>
                </div>

                {/* Post-game actions */}
                {gameState.status === 'completed' && (
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setViewMode('lobby')}>
                      Back to Lobby
                    </Button>
                    <Button variant="outline" onClick={shareGame} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share Game
                    </Button>
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
      
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default Play;
