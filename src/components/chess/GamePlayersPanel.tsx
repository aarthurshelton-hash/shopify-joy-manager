import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PlayerPaletteCard } from './PlayerPaletteCard';
import { findCatalogGameByHash } from '@/lib/chess/gameCatalog';
import { savedMatchPalette, type SavedSide } from '@/lib/chess/matchPalette';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';

interface GamePlayersPanelProps {
  pgn: string;
  white?: string;
  black?: string;
}

/** Who played this game, in colour: each side's player palette, why, and how it evolved. */
export function GamePlayersPanel({ pgn, white, black }: GamePlayersPanelProps) {
  const [match, setMatch] = useState<{ white: SavedSide; black: SavedSide } | null | undefined>(undefined);
  const hash = generateGameHash(pgn);

  useEffect(() => {
    let live = true;
    findCatalogGameByHash(hash)
      .then((c) => { if (live) setMatch(c ? savedMatchPalette(c.key) : null); })
      .catch(() => { if (live) setMatch(null); });
    return () => { live = false; };
  }, [hash]);

  if (match === undefined) return null;

  const params = new URLSearchParams(window.location.search);
  const usingPlayers = !!match && params.get('pw') === match.white.paletteId && params.get('pb') === match.black.paletteId;

  const switchTo = (players: boolean) => {
    const next = new URLSearchParams(window.location.search);
    next.delete('p');
    if (players && match) {
      next.set('pw', match.white.paletteId);
      next.set('pb', match.black.paletteId);
    } else {
      next.delete('pw');
      next.delete('pb');
    }
    if (!next.get('src')) next.set('src', 'famous');
    window.location.href = `/g/${hash}?${next.toString()}`;
  };

  if (!match) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            See {white && black ? `${white} and ${black}` : 'each player'} in colour: every player has a palette drawn from how they play.
          </p>
        </div>
        <Link to="/palette-match" className="shrink-0 rounded-full border border-primary/50 px-4 py-1.5 text-center text-[11px] font-display uppercase tracking-wider text-primary transition-colors hover:bg-primary/10">
          Find a player's colour
        </Link>
      </div>
    );
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[11px] font-display uppercase tracking-wider transition-colors ${
      active ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => !usingPlayers && switchTo(true)} className={chip(usingPlayers)} title="Each side drawn in its player's palette, as their style stood at this game">
          Draw in player palettes
        </button>
        <button type="button" onClick={() => usingPlayers && switchTo(false)} className={chip(!usingPlayers)} title="One palette for the whole board">
          Single palette
        </button>
        <Link to="/palette-match" className="ml-auto text-[11px] font-display uppercase tracking-wider text-primary hover:underline">
          Match any two players →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {([['White', match.white], ['Black', match.black]] as const).map(([side, s]) => (
          <PlayerPaletteCard
            key={side}
            side={side}
            name={s.player}
            paletteId={s.paletteId}
            style={s.style}
            games={s.games}
            why={s.why}
            journey={s.journey.map(([year, paletteId]) => ({ label: String(year), paletteId }))}
          />
        ))}
      </div>
    </div>
  );
}

export default GamePlayersPanel;
