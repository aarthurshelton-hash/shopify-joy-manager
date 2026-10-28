import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Search, Crown } from 'lucide-react';
import { famousGames, carlsenLegendaryGames, type FamousGame } from '@/lib/chess/famousGames';
import { FAMOUS_GAME_OPENINGS, FAMOUS_GAME_PALETTES } from '@/lib/chess/famousGameOpenings';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { paletteThumbs } from '@/lib/palettes/paletteBackgrounds';
import { savedMatchPalette, type SavedSide } from '@/lib/chess/matchPalette';

type ResultFilter = 'all' | 'white' | 'black' | 'draw';
type SortKey = 'newest' | 'oldest' | 'longest' | 'shortest';
type PaletteMode = 'players' | 'game';

interface GameEntry {
  game: FamousGame;
  hash: string;
  result: 'white' | 'black' | 'draw';
  moves: number;
  mate: boolean;
  paletteId: string;
  opening: string;
  match: { white: SavedSide; black: SavedSide } | null;
}

const UNKNOWN_OPENING = 'Other / unclassified';
const PAGE = 6;
const RESULT_LABEL: Record<GameEntry['result'], string> = { white: 'White wins', black: 'Black wins', draw: 'Draw' };
const surname = (name: string) => name.split(/\s+/).slice(-1)[0];

const ERA_PALETTES: [number, string[]][] = [
  [1700, ['medieval', 'egyptian', 'roman']],
  [1900, ['vintage', 'roman', 'inkgold']],
  [1950, ['artdeco', 'inkgold', 'vintage']],
  [2000, ['modern', 'greyscale', 'contrast']],
  [Infinity, ['cyberpunk', 'cosmic', 'modern']],
];

function stableIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

function paletteFor(game: FamousGame): string {
  const chosen = FAMOUS_GAME_PALETTES[game.id];
  if (chosen && paletteThumbs[chosen]) return chosen;
  const era = ERA_PALETTES.find(([limit]) => game.year < limit)![1];
  const id = era[stableIndex(game.id, era.length)];
  return paletteThumbs[id] ? id : Object.keys(paletteThumbs)[0];
}

let cached: GameEntry[] | null = null;
function buildEntries(): GameEntry[] {
  if (cached) return cached;
  const seen = new Set<string>();
  const entries: GameEntry[] = [];
  for (const game of [...famousGames, ...carlsenLegendaryGames]) {
    if (seen.has(game.id)) continue;
    seen.add(game.id);
    const res = /\[Result "([^"]+)"\]/.exec(game.pgn)?.[1];
    const nums = game.pgn.match(/\b(\d+)\.(?=\s)/g);
    entries.push({
      game,
      hash: generateGameHash(game.pgn),
      result: res === '1-0' ? 'white' : res === '0-1' ? 'black' : 'draw',
      moves: nums ? parseInt(nums[nums.length - 1], 10) : 0,
      mate: /#\s*(?:1-0|0-1)?\s*$/.test(game.pgn.trim()),
      paletteId: paletteFor(game),
      opening: FAMOUS_GAME_OPENINGS[game.id]?.name ?? UNKNOWN_OPENING,
      match: savedMatchPalette(game.id),
    });
  }
  cached = entries;
  return entries;
}

/** Landing game for old /explore links: the review page with this browser in view. */
export const DEFAULT_REVIEW_GAME_ID = 'anderssen-kieseritzky-1851';

/** The historic-games gallery, embedded in the game review so browsing never leaves it. */
export function MoreGamesBrowser({ currentHash }: { currentHash?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const entries = useMemo(buildEntries, []);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResultFilter>('all');
  const [matesOnly, setMatesOnly] = useState(false);
  const [opening, setOpening] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [shown, setShown] = useState(PAGE);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('players');

  useEffect(() => {
    if (window.location.hash === '#more-games') rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const openingOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.opening, (counts.get(e.opening) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => {
      if (e.hash === currentHash) return false;
      if (result !== 'all' && e.result !== result) return false;
      if (matesOnly && !e.mate) return false;
      if (opening !== 'all' && e.opening !== opening) return false;
      if (!q) return true;
      const g = e.game;
      return `${g.title} ${g.white} ${g.black} ${g.event} ${g.year}`.toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.game.year - b.game.year;
        case 'longest': return b.moves - a.moves;
        case 'shortest': return a.moves - b.moves;
        default: return b.game.year - a.game.year;
      }
    });
    return list;
  }, [entries, currentHash, query, result, matesOnly, opening, sort]);

  const open = (e: GameEntry, highlights: boolean) => {
    const pair = paletteMode === 'players' && e.match ? `&pw=${e.match.white.paletteId}&pb=${e.match.black.paletteId}` : '';
    window.location.href = `/g/${e.hash}?src=famous${pair}${highlights ? '&highlights=1' : ''}`;
  };

  const reset = () => setShown(PAGE);
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[11px] font-display uppercase tracking-wider transition-colors ${
      active
        ? 'border-primary/60 bg-primary/15 text-primary'
        : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
    }`;

  return (
    <div ref={rootRef} className="space-y-4 scroll-mt-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); reset(); }}
            placeholder="Search players, events, years"
            aria-label="Search games"
            className="w-full rounded-lg border border-border/50 bg-card/60 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaletteMode('players')} className={chip(paletteMode === 'players')} title="Each side drawn in its player's palette, as their style stood at that game">
            Player palettes
          </button>
          <button onClick={() => setPaletteMode('game')} className={chip(paletteMode === 'game')} title="One palette chosen by how the whole game was played">
            Game palette
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort games"
            className="rounded-lg border border-border/50 bg-card/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="longest">Longest</option>
            <option value="shortest">Shortest</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'white', 'black', 'draw'] as ResultFilter[]).map((r) => (
          <button key={r} onClick={() => { setResult(r); reset(); }} className={chip(result === r)}>
            {r === 'all' ? 'All results' : RESULT_LABEL[r]}
          </button>
        ))}
        <button onClick={() => { setMatesOnly((m) => !m); reset(); }} className={chip(matesOnly)}>
          Checkmates
        </button>
        <select
          value={opening}
          onChange={(e) => { setOpening(e.target.value); reset(); }}
          aria-label="Filter by opening"
          className="rounded-full border border-border/50 bg-card/60 px-3 py-1 text-[11px] font-display uppercase tracking-wider text-muted-foreground outline-none focus:border-primary/50"
        >
          <option value="all">All openings</option>
          {openingOptions.map(([name, n]) => (
            <option key={name} value={name}>{name} ({n})</option>
          ))}
        </select>
        <span className="ml-auto self-center text-[11px] text-muted-foreground">{visible.length} games</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/50 p-8 text-center font-serif text-sm text-muted-foreground">
          No games match. Try fewer filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, shown).map((e) => {
            const split = paletteMode === 'players' && e.match && paletteThumbs[e.match.white.paletteId] && paletteThumbs[e.match.black.paletteId];
            return (
              <article key={e.game.id} className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-colors hover:border-primary/40">
                <button type="button" onClick={() => open(e, false)} className="relative block aspect-[16/9] w-full overflow-hidden text-left" aria-label={`Open ${e.game.title}`}>
                  {split ? (
                    <div className="flex h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <img src={paletteThumbs[e.match!.white.paletteId]} alt="" loading="lazy" className="h-full w-1/2 object-cover" />
                      <img src={paletteThumbs[e.match!.black.paletteId]} alt="" loading="lazy" className="h-full w-1/2 border-l border-black/40 object-cover" />
                    </div>
                  ) : (
                    <img src={paletteThumbs[e.paletteId]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute left-3 top-2 font-mono text-[11px] text-white/80">{e.game.year}</span>
                  {split && (
                    <>
                      <span className="absolute bottom-2 left-3 font-mono text-[10px] text-white/80" title={e.match!.white.why}>{surname(e.match!.white.player)} · {e.match!.white.paletteId}</span>
                      <span className="absolute bottom-2 right-3 font-mono text-[10px] text-white/80" title={e.match!.black.why}>{surname(e.match!.black.player)} · {e.match!.black.paletteId}</span>
                    </>
                  )}
                  {e.mate && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-[#d4af37] backdrop-blur">
                      <Crown className="h-3 w-3" /> Mate
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div>
                    <h4 className="font-display text-sm leading-snug text-foreground">{e.game.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.game.white} vs {e.game.black}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{e.moves} moves · {RESULT_LABEL[e.result]}</p>
                    {e.opening !== UNKNOWN_OPENING && (
                      <p className="mt-0.5 text-[11px] text-primary/80">{FAMOUS_GAME_OPENINGS[e.game.id]?.fullName}</p>
                    )}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button type="button" onClick={() => open(e, true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90">
                      <Play className="h-3.5 w-3.5" /> Highlights
                    </button>
                    <button type="button" onClick={() => open(e, false)} className="rounded-lg border border-border/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      Review
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {shown < visible.length && (
        <div className="text-center">
          <button onClick={() => setShown((s) => s + PAGE * 2)} className="rounded-lg border border-border/60 px-5 py-2 text-[11px] font-display uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            Show more ({visible.length - shown} left)
          </button>
        </div>
      )}
    </div>
  );
}

export default MoreGamesBrowser;
