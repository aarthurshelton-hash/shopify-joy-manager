/**
 * OpeningKnowledgePanel - Unified opening and game knowledge display
 * 
 * Shows:
 * - Opening name, ECO code, and statistics from Lichess
 * - Similar games by archetype
 * - Book move information
 * - Related tactics/puzzles (future)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Trophy,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLichessOpening, useSimilarGames } from '@/hooks/useLichessOpening';
import { DetectedOpening } from '@/lib/chess/openingDetector';

interface OpeningKnowledgePanelProps {
  pgn?: string;
  fen?: string;
  archetype?: string;
  localOpening?: DetectedOpening | null;
  currentMove?: number;
  totalMoves?: number;
  darkMode?: boolean;
  compact?: boolean;
}

export const OpeningKnowledgePanel: React.FC<OpeningKnowledgePanelProps> = ({
  pgn,
  fen,
  archetype,
  localOpening,
  currentMove = 0,
  totalMoves = 0,
  darkMode = false,
  compact = false,
}) => {
  const [isOpeningExpanded, setIsOpeningExpanded] = React.useState(true);
  const [isSimilarExpanded, setIsSimilarExpanded] = React.useState(false);

  // Fetch from Lichess Opening Explorer
  const { 
    data: lichessData, 
    isLoading: lichessLoading, 
    error: lichessError 
  } = useLichessOpening({
    pgn,
    fen,
    enabled: !!(pgn || fen),
    moveNumber: Math.min(currentMove || 15, 20), // Use up to move 20 for opening
  });

  // Find similar games by archetype
  const {
    games: similarGames,
    isLoading: similarLoading,
  } = useSimilarGames({
    archetype,
    openingEco: lichessData?.opening?.eco || localOpening?.eco,
    enabled: !!(archetype || lichessData?.opening?.eco || localOpening?.eco),
  });

  // Determine which opening data to display (prefer Lichess, fall back to local)
  const openingName = lichessData?.opening?.name || localOpening?.fullName || localOpening?.name;
  const openingEco = lichessData?.opening?.eco || localOpening?.eco;
  const hasOpening = !!(openingName || openingEco);

  // Calculate statistics
  const stats = lichessData?.stats?.masters || lichessData?.stats?.lichess;
  const totalGames = stats?.total || 0;
  const whiteWinRate = totalGames > 0 ? Math.round((stats?.white || 0) / totalGames * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((stats?.draws || 0) / totalGames * 100) : 0;
  const blackWinRate = totalGames > 0 ? Math.round((stats?.black || 0) / totalGames * 100) : 0;

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${darkMode ? 'bg-stone-900/50 border-stone-700' : 'bg-stone-50 border-stone-200'}`}>
        {lichessLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading opening data...</span>
          </div>
        ) : hasOpening ? (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="text-[10px]">{openingEco}</Badge>
            <span className="text-sm font-medium truncate">{openingName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs">No opening data</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-stone-900/50 border-stone-700' : 'bg-card border-border'}`}>
      {/* Opening Section */}
      <Collapsible open={isOpeningExpanded} onOpenChange={setIsOpeningExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className={`flex items-center justify-between p-4 ${isOpeningExpanded ? 'border-b border-border/50' : ''}`}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="font-display text-sm uppercase tracking-wider">Opening Knowledge</span>
              {lichessLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform ${isOpeningExpanded ? 'rotate-90' : ''}`} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Opening Name & ECO */}
            {hasOpening ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 shrink-0">
                    {openingEco}
                  </Badge>
                  <div>
                    <h4 className="font-medium">{openingName}</h4>
                    {localOpening?.variation && (
                      <p className="text-xs text-muted-foreground">{localOpening.variation}</p>
                    )}
                  </div>
                </div>

                {/* Marketing Description */}
                {localOpening?.marketingDescription && (
                  <p className="text-xs text-muted-foreground italic">
                    {localOpening.marketingDescription}
                  </p>
                )}

                {/* Statistics from Lichess */}
                {stats && totalGames > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Based on {totalGames.toLocaleString()} games</span>
                      <span className="text-primary">
                        {lichessData?.stats?.masters ? 'Master Database' : 'Lichess Database'}
                      </span>
                    </div>
                    
                    {/* Win Rate Bar */}
                    <div className="flex h-3 rounded-full overflow-hidden border border-border">
                      <div 
                        className="bg-card" 
                        style={{ width: `${whiteWinRate}%` }} 
                        title={`White wins: ${whiteWinRate}%`}
                      />
                      <div 
                        className="bg-muted-foreground/50" 
                        style={{ width: `${drawRate}%` }} 
                        title={`Draws: ${drawRate}%`}
                      />
                      <div 
                        className="bg-foreground" 
                        style={{ width: `${blackWinRate}%` }} 
                        title={`Black wins: ${blackWinRate}%`}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[10px]">
                      <span>⬜ {whiteWinRate}%</span>
                      <span>= {drawRate}%</span>
                      <span>⬛ {blackWinRate}%</span>
                    </div>
                  </div>
                )}

                {/* Top Moves */}
                {lichessData?.topMoves && lichessData.topMoves.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground">Popular Continuations</h5>
                    <div className="space-y-1">
                      {lichessData.topMoves.slice(0, 3).map((move, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-mono">{move.san}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={move.whiteWinRate} 
                              className="w-16 h-1.5" 
                            />
                            <span className="text-muted-foreground w-12 text-right">
                              {move.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Master Games */}
                {lichessData?.masterGames && lichessData.masterGames.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Master Games
                    </h5>
                    <div className="space-y-1">
                      {lichessData.masterGames.slice(0, 3).map((game, i) => (
                        <a
                          key={i}
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs hover:text-primary transition-colors"
                        >
                          <span className="truncate max-w-[60%]">
                            {game.white} vs {game.black}
                          </span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>{game.year}</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Famous Players */}
                {localOpening?.famousPlayers && localOpening.famousPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {localOpening.famousPlayers.slice(0, 4).map((player, i) => (
                      <Badge key={i} variant="outline" className="text-[9px]">
                        {player}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : lichessLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing opening...</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                No opening data available for this position.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Similar Games Section */}
      <Collapsible open={isSimilarExpanded} onOpenChange={setIsSimilarExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className={`flex items-center justify-between p-4 ${isSimilarExpanded ? 'border-b border-border/50' : ''}`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="font-display text-sm uppercase tracking-wider">Similar Games</span>
              {archetype && (
                <Badge variant="secondary" className="text-[10px]">{archetype}</Badge>
              )}
              {similarLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              {similarGames.length > 0 && (
                <Badge variant="outline" className="text-[10px]">{similarGames.length}</Badge>
              )}
              <ChevronRight className={`h-4 w-4 transition-transform ${isSimilarExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4">
            {similarGames.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {similarGames.map((game, i) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-2 rounded-lg ${darkMode ? 'bg-stone-800/50' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{game.gameName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px]">
                              {game.archetype}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {game.moveCount} moves
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-[9px] ${
                            game.outcome === '1-0' ? 'bg-card text-foreground border border-border' :
                            game.outcome === '0-1' ? 'bg-foreground text-background' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {game.outcome}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : similarLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Finding similar games...</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                No similar games found in the database.
                {archetype && (
                  <p className="text-xs mt-1">Archetype: {archetype}</p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Future: Tactics/Puzzles Section */}
      {/* <Separator />
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="h-4 w-4" />
          <span className="text-xs">Related puzzles coming soon</span>
        </div>
      </div> */}
    </div>
  );
};

export default OpeningKnowledgePanel;
