import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, User, Search, CreditCard, Crown } from 'lucide-react';
import { toast } from 'sonner';
import {
  importGames,
  importFromLichessGameUrl,
  importFromLichessTournament,
  importFromChessComGameUrl,
  ImportedGame,
  ImportSource,
  ImportMode,
} from '@/lib/chess/gameImport';
import { generateGamecardFromPgn, downloadBlob, sanitizeFilename } from '@/lib/chess/gamecardGenerator';
import { useAuth } from '@/hooks/useAuth';

interface GameImporterProps {
  onSelectGame: (pgn: string, title?: string) => void;
}

const SOURCES: { id: ImportSource; label: string }[] = [
  { id: 'lichess', label: 'Lichess' },
  { id: 'chesscom', label: 'Chess.com' },
];

const MODES: { id: ImportMode; label: string; lichessOnly?: boolean }[] = [
  { id: 'username', label: 'My recent games' },
  { id: 'link', label: 'Game link' },
  { id: 'tournament', label: 'Tournament', lichessOnly: true },
];

export const GameImporter: React.FC<GameImporterProps> = ({ onSelectGame }) => {
  const [source, setSource] = useState<ImportSource>('lichess');
  const [mode, setMode] = useState<ImportMode>('username');
  const [link, setLink] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<ImportedGame[]>([]);
  const [generatingCards, setGeneratingCards] = useState(false);
  const { isPremium } = useAuth();

  const handleImport = useCallback(async () => {
    const needsLink = mode !== 'username';
    const needsUser = mode === 'username' || mode === 'tournament' || source === 'chesscom';
    if (needsLink && !link.trim()) {
      toast.error(mode === 'tournament' ? 'Paste a tournament link.' : 'Paste a game link.');
      return;
    }
    if (needsUser && !username.trim()) {
      toast.error('Enter a username.');
      return;
    }
    setIsLoading(true);
    setGames([]);
    try {
      let result: ImportedGame[];
      if (mode === 'tournament') {
        result = await importFromLichessTournament(link, username, 12);
      } else if (mode === 'link') {
        result = source === 'lichess'
          ? await importFromLichessGameUrl(link)
          : await importFromChessComGameUrl(link, username);
      } else {
        result = await importGames(source, username, 12);
      }
      setGames(result);
      toast.success(`Imported ${result.length} game${result.length !== 1 ? 's' : ''}`, {
        description: `From ${source === 'lichess' ? 'Lichess' : 'Chess.com'} — pick one to visualize.`,
      });
    } catch (err) {
      toast.error('Import failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [source, username, mode, link]);

  const handleQuickGamecards = useCallback(async () => {
    if (!isPremium) {
      toast.error('Premium required', { description: 'Upgrade to generate collector game card PDFs.' });
      return;
    }
    if (games.length === 0) {
      toast.error('Import games first', { description: 'Enter a username and import to generate game cards.' });
      return;
    }
    setGeneratingCards(true);
    let success = 0;
    let failed = 0;
    try {
      for (const game of games) {
        try {
          const blob = await generateGamecardFromPgn(game.pgn, {
            source: source === 'lichess' ? 'Lichess' : 'Chess.com',
          });
          const filename = `gamecard_${sanitizeFilename(`${game.white}_vs_${game.black}_${game.date}`)}.pdf`;
          downloadBlob(blob, filename);
          success++;
        } catch {
          failed++;
        }
      }
      if (success > 0) {
        toast.success(`${success} game card${success !== 1 ? 's' : ''} downloaded`, {
          description: failed > 0 ? `${failed} failed` : 'Check your downloads folder',
        });
      } else {
        toast.error('Failed to generate game cards');
      }
    } catch (err) {
      toast.error('Game card generation failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setGeneratingCards(false);
    }
  }, [games, isPremium, source]);

  return (
    <div className="rounded-lg border border-primary/20 bg-card/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border/50">
        <h3 className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold">
          <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Import Your Games
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-serif">
          Pull your recent games straight from Lichess or Chess.com — no login required.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Source toggle */}
        <div className="flex gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSource(s.id);
                if (s.id === 'chesscom' && mode === 'tournament') setMode('username');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                source === s.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {MODES.filter((m) => !m.lichessOnly || source === 'lichess').map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                mode === m.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode !== 'username' && (
          <input
            type="text"
            placeholder={
              mode === 'tournament'
                ? 'https://lichess.org/tournament/abcd1234'
                : source === 'lichess'
                  ? 'https://lichess.org/abcd1234'
                  : 'https://www.chess.com/game/live/1234567890'
            }
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
            className="w-full px-3 py-2 text-sm bg-background/50 border border-border/50 rounded-md focus:outline-none focus:border-primary/50 transition-colors"
          />
        )}

        {/* Username input */}
        {(mode === 'username' || mode === 'tournament' || source === 'chesscom') && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Your ${source === 'lichess' ? 'Lichess' : 'Chess.com'} username`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background/50 border border-border/50 rounded-md focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button onClick={handleImport} disabled={isLoading} className="gap-2 shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Import
          </Button>
        </div>
        )}
        {mode === 'link' && source === 'lichess' && (
          <Button onClick={handleImport} disabled={isLoading} className="w-full gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Import game
          </Button>
        )}
        {mode === 'link' && source === 'chesscom' && (
          <p className="text-[11px] text-muted-foreground">
            Chess.com has no lookup by link, so enter a username of one player in the game.
          </p>
        )}

        {/* Quick Gamecard button — appears after import, premium-gated */}
        {games.length > 0 && (
          <Button
            onClick={handleQuickGamecards}
            disabled={generatingCards}
            variant="outline"
            className="w-full gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
          >
            {generatingCards ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Quick Game Cards
            {!isPremium && <Crown className="h-3 w-3 text-primary" />}
            <span className="text-xs text-muted-foreground ml-1">
              ({games.length} PDF{games.length !== 1 ? 's' : ''})
            </span>
          </Button>
        )}

        {/* Imported games list */}
        {games.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame(game.pgn, `${game.white} vs ${game.black}`)}
                className="text-left p-3 rounded-md border border-border/40 bg-card/50 hover:border-primary/50 hover:bg-card transition-all"
              >
                <p className="text-xs font-semibold text-foreground truncate">
                  {game.white} vs {game.black}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground truncate">{game.date}</span>
                  {game.result && (
                    <span className="text-[10px] font-mono text-primary shrink-0">{game.result}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameImporter;
