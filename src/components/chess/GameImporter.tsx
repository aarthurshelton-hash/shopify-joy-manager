import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { importGames, ImportedGame, ImportSource } from '@/lib/chess/gameImport';

interface GameImporterProps {
  onSelectGame: (pgn: string, title?: string) => void;
}

const SOURCES: { id: ImportSource; label: string }[] = [
  { id: 'lichess', label: 'Lichess' },
  { id: 'chesscom', label: 'Chess.com' },
];

export const GameImporter: React.FC<GameImporterProps> = ({ onSelectGame }) => {
  const [source, setSource] = useState<ImportSource>('lichess');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<ImportedGame[]>([]);

  const handleImport = useCallback(async () => {
    if (!username.trim()) {
      toast.error('Enter a username to import games.');
      return;
    }
    setIsLoading(true);
    setGames([]);
    try {
      const result = await importGames(source, username, 12);
      setGames(result);
      toast.success(`Imported ${result.length} game${result.length !== 1 ? 's' : ''}`, {
        description: `From ${source === 'lichess' ? 'Lichess' : 'Chess.com'} — pick one to visualize.`,
      });
    } catch (err) {
      toast.error('Import failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [source, username]);

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
              onClick={() => setSource(s.id)}
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

        {/* Username input */}
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
