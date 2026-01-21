/**
 * Game Details Modal - Shows all analyzed games with clickable details
 * For legal/scientific validation - every game ID is visible
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, ExternalLink, Search, Trophy, Brain, Cpu, Filter, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GameDetail {
  id: string;
  game_id: string;
  game_name: string;
  move_number: number;
  fen: string;
  hybrid_prediction: string;
  hybrid_confidence: number;
  hybrid_archetype: string;
  hybrid_correct: boolean;
  stockfish_prediction: string;
  stockfish_eval: number;
  stockfish_correct: boolean;
  actual_result: string;
  time_control: string | null;
  white_elo: number | null;
  black_elo: number | null;
  created_at: string;
  data_source: string | null;
}

interface GameDetailsModalProps {
  trigger: React.ReactNode;
  filter?: 'all' | 'hybrid_wins' | 'stockfish_wins' | 'both_correct' | 'both_wrong';
  title?: string;
}

export function GameDetailsModal({ trigger, filter = 'all', title = 'All Analyzed Games' }: GameDetailsModalProps) {
  const [games, setGames] = useState<GameDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>(filter);
  const [open, setOpen] = useState(false);

  const loadGames = async (filterType: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('chess_prediction_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply filter based on type
      if (filterType === 'hybrid_wins') {
        query = query.eq('hybrid_correct', true).eq('stockfish_correct', false);
      } else if (filterType === 'stockfish_wins') {
        query = query.eq('hybrid_correct', false).eq('stockfish_correct', true);
      } else if (filterType === 'both_correct') {
        query = query.eq('hybrid_correct', true).eq('stockfish_correct', true);
      } else if (filterType === 'both_wrong') {
        query = query.eq('hybrid_correct', false).eq('stockfish_correct', false);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      setGames(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadGames(activeTab);
    }
  }, [open, activeTab]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel('game-details-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' },
        (payload) => {
          const newGame = payload.new as GameDetail;
          setGames(prev => [newGame, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  const filteredGames = games.filter(g => 
    search === '' || 
    g.game_id.toLowerCase().includes(search.toLowerCase()) ||
    g.game_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.hybrid_archetype?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimeControl = (tc: string | null) => {
    if (!tc) return null;
    const match = tc.match(/(\d+)\+(\d+)/);
    if (match) {
      const [, mins, inc] = match;
      const total = parseInt(mins) * 60;
      if (total < 180) return 'Bullet';
      if (total < 600) return 'Blitz';
      if (total < 1800) return 'Rapid';
      return 'Classical';
    }
    return tc;
  };

  const getResultBadge = (result: string) => {
    switch(result) {
      case 'white_wins': return <Badge variant="outline" className="text-xs">⚪ White</Badge>;
      case 'black_wins': return <Badge variant="outline" className="text-xs">⚫ Black</Badge>;
      case 'draw': return <Badge variant="outline" className="text-xs">½ Draw</Badge>;
      default: return <Badge variant="outline" className="text-xs">{result}</Badge>;
    }
  };

  const getSourceInfo = (game: GameDetail) => {
    // Detect source from data_source column or game_id pattern
    const source = game.data_source || (game.game_id.match(/^\d+$/) ? 'chesscom' : 'lichess');
    
    if (source === 'chesscom') {
      return {
        label: 'Chess.com',
        color: 'bg-green-500/10 text-green-600 border-green-500/30',
        url: `https://www.chess.com/game/live/${game.game_id}`,
        icon: '♔'
      };
    }
    return {
      label: 'Lichess',
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      url: `https://lichess.org/${game.game_id}`,
      icon: '♞'
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Game ID, name, or archetype..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">
                All ({games.length})
              </TabsTrigger>
              <TabsTrigger value="hybrid_wins" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                EP Wins
              </TabsTrigger>
              <TabsTrigger value="stockfish_wins" className="text-xs">
                <Cpu className="h-3 w-3 mr-1" />
                SF Wins
              </TabsTrigger>
              <TabsTrigger value="both_correct" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Both ✓
              </TabsTrigger>
              <TabsTrigger value="both_wrong" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Both ✗
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Games List */}
          <ScrollArea className="h-[55vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No games found matching your criteria
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredGames.map((game) => (
                  <div 
                    key={game.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Game Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            const sourceInfo = getSourceInfo(game);
                            return (
                              <>
                                <Badge variant="outline" className={`text-xs ${sourceInfo.color}`}>
                                  {sourceInfo.icon} {sourceInfo.label}
                                </Badge>
                                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {game.game_id}
                                </code>
                                <a 
                                  href={sourceInfo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Game
                                </a>
                              </>
                            );
                          })()}
                          {game.time_control && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeControl(game.time_control)}
                            </Badge>
                          )}
                          {(game.white_elo || game.black_elo) && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {game.white_elo || '?'} vs {game.black_elo || '?'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          Move {game.move_number} • {game.hybrid_archetype || 'Unknown Archetype'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {new Date(game.created_at).toLocaleString()}
                        </p>
                      </div>

                      {/* Right: Predictions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Hybrid Prediction */}
                        <div className="text-center">
                          <div className={`flex items-center gap-1 ${game.hybrid_correct ? 'text-green-500' : 'text-red-500'}`}>
                            {game.hybrid_correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span className="text-xs font-medium">EP</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(game.hybrid_confidence * 100).toFixed(0)}%
                          </p>
                        </div>

                        {/* Stockfish Prediction */}
                        <div className="text-center">
                          <div className={`flex items-center gap-1 ${game.stockfish_correct ? 'text-green-500' : 'text-red-500'}`}>
                            {game.stockfish_correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span className="text-xs font-medium">SF</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {game.stockfish_eval?.toFixed(1) || '?'}cp
                          </p>
                        </div>

                        {/* Actual Result */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">Result</p>
                          {getResultBadge(game.actual_result)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>Showing {filteredGames.length} games • Click Game ID to verify on Lichess</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadGames(activeTab)}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
