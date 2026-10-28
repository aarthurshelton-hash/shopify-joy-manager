import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, Crown, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlayerPaletteCard } from '@/components/chess/PlayerPaletteCard';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { famousGames, carlsenLegendaryGames, type FamousGame } from '@/lib/chess/famousGames';
import { FAMOUS_GAME_OPENINGS, FAMOUS_GAME_PALETTES } from '@/lib/chess/famousGameOpenings';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { paletteThumbs, ALL_PALETTES_PREVIEW_URL } from '@/lib/palettes/paletteBackgrounds';
import { savedMatchPalette, type SavedSide } from '@/lib/chess/matchPalette';

type ResultFilter = 'all' | 'white' | 'black' | 'draw';
type SortKey = 'newest' | 'oldest' | 'longest' | 'shortest';

interface GameEntry {
  game: FamousGame;
  result: 'white' | 'black' | 'draw';
  moves: number;
  mate: boolean;
  paletteId: string;
  opening: string;
  match: { white: SavedSide; black: SavedSide } | null;
}

type PaletteMode = 'players' | 'game';
const surname = (name: string) => name.split(/\s+/).slice(-1)[0];

const UNKNOWN_OPENING = 'Other / unclassified';

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

function buildEntries(): GameEntry[] {
  const seen = new Set<string>();
  const entries: GameEntry[] = [];
  for (const game of [...famousGames, ...carlsenLegendaryGames]) {
    if (seen.has(game.id)) continue;
    seen.add(game.id);
    const res = /\[Result "([^"]+)"\]/.exec(game.pgn)?.[1];
    const result: GameEntry['result'] = res === '1-0' ? 'white' : res === '0-1' ? 'black' : 'draw';
    const nums = game.pgn.match(/\b(\d+)\.(?=\s)/g);
    const moves = nums ? parseInt(nums[nums.length - 1], 10) : 0;
    entries.push({ game, result, moves, mate: /#\s*(?:1-0|0-1)?\s*$/.test(game.pgn.trim()), paletteId: paletteFor(game), opening: FAMOUS_GAME_OPENINGS[game.id]?.name ?? UNKNOWN_OPENING, match: savedMatchPalette(game.id) });
  }
  return entries;
}

const RESULT_LABEL: Record<GameEntry['result'], string> = {
  white: 'White wins', black: 'Black wins', draw: 'Draw',
};

const PAGE = 24;

const Explore = () => {
  const navigate = useNavigate();
  const entries = useMemo(buildEntries, []);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResultFilter>('all');
  const [matesOnly, setMatesOnly] = useState(false);
  const [opening, setOpening] = useState('all');
  const openingOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.opening, (counts.get(e.opening) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);
  const [sort, setSort] = useState<SortKey>('newest');
  const [shown, setShown] = useState(PAGE);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('players');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => {
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
  }, [entries, query, result, matesOnly, opening, sort]);

  const open = (e: GameEntry, highlights: boolean) => {
    const pair = paletteMode === 'players' && e.match ? `&pw=${e.match.white.paletteId}&pb=${e.match.black.paletteId}` : '';
    navigate(`/g/${generateGameHash(e.game.pgn)}?src=famous${pair}${highlights ? '&highlights=1' : ''}`);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors ${
      active
        ? 'border-primary/60 bg-primary/15 text-primary'
        : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border/40">
          <img
            src={ALL_PALETTES_PREVIEW_URL}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="container relative mx-auto px-4 py-20 text-center md:py-28">
            <p className="font-display text-[11px] uppercase tracking-[0.35em] text-primary">Explore</p>
            <h1 className="mt-4 font-royal text-4xl font-bold uppercase tracking-wide md:text-6xl">
              The great games, <span className="text-gold-gradient">in color</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-serif text-muted-foreground">
              {entries.length} historic games. Open any one and press Play highlights to watch its key moments, with Stockfish checking every call.
            </p>
            <button
              type="button"
              onClick={() => navigate('/palette-match')}
              className="mt-5 rounded-full border border-primary/50 px-4 py-2 text-xs font-display uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
            >
              Find any player's colour →
            </button>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
                  placeholder="Search players, events, years"
                  aria-label="Search games"
                  className="w-full rounded-lg border border-border/50 bg-card/60 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
                />
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-primary/50"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="longest">Longest games</option>
                  <option value="shortest">Shortest games</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'white', 'black', 'draw'] as ResultFilter[]).map((r) => (
                <button key={r} onClick={() => { setResult(r); setShown(PAGE); }} className={chip(result === r)}>
                  {r === 'all' ? 'All results' : RESULT_LABEL[r]}
                </button>
              ))}
              <button onClick={() => { setMatesOnly((m) => !m); setShown(PAGE); }} className={chip(matesOnly)}>
                Ends in checkmate
              </button>
              <select
                value={opening}
                onChange={(e) => { setOpening(e.target.value); setShown(PAGE); }}
                aria-label="Filter by opening"
                className="rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground outline-none focus:border-primary/50"
              >
                <option value="all">All openings</option>
                {openingOptions.map(([name, n]) => (
                  <option key={name} value={name}>{name} ({n})</option>
                ))}
              </select>
              <span className="ml-auto flex gap-2">
                <button onClick={() => setPaletteMode('players')} className={chip(paletteMode === 'players')} title="Each side drawn in its player's palette, as their style stood at that game">
                  Player palettes
                </button>
                <button onClick={() => setPaletteMode('game')} className={chip(paletteMode === 'game')} title="One palette chosen by how the whole game was played">
                  Game palette
                </button>
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{visible.length} games</p>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/50 p-10 text-center font-serif text-muted-foreground">
                No games match. Try fewer filters.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.slice(0, shown).map((e) => (
                  <article
                    key={e.game.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-colors hover:border-primary/40"
                  >
                    <button
                      type="button"
                      onClick={() => open(e, false)}
                      className="relative block aspect-[16/9] w-full overflow-hidden text-left"
                      aria-label={`Open ${e.game.title}`}
                    >
                      {paletteMode === 'players' && e.match && paletteThumbs[e.match.white.paletteId] && paletteThumbs[e.match.black.paletteId] ? (
                        <div className="flex h-full w-full transition-transform duration-500 group-hover:scale-105">
                          <img src={paletteThumbs[e.match.white.paletteId]} alt="" loading="lazy" className="h-full w-1/2 object-cover" />
                          <img src={paletteThumbs[e.match.black.paletteId]} alt="" loading="lazy" className="h-full w-1/2 border-l border-black/40 object-cover" />
                        </div>
                      ) : (
                        <img
                          src={paletteThumbs[e.paletteId]}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {paletteMode === 'players' && e.match ? (
                        <>
                          <span className="absolute bottom-3 left-4 font-mono text-[10px] text-white/80" title={e.match.white.why}>
                            {surname(e.match.white.player)} · {e.match.white.paletteId}
                          </span>
                          <span className="absolute bottom-3 right-4 font-mono text-[10px] text-white/80" title={e.match.black.why}>
                            {surname(e.match.black.player)} · {e.match.black.paletteId}
                          </span>
                          <span className="absolute left-4 top-3 font-mono text-xs text-white/80">{e.game.year}</span>
                        </>
                      ) : (
                        <span className="absolute bottom-3 left-4 font-mono text-xs text-white/80">{e.game.year}</span>
                      )}
                      {e.mate && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-display uppercase tracking-wider text-[#d4af37] backdrop-blur">
                          <Crown className="h-3 w-3" /> Mate
                        </span>
                      )}
                    </button>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <h2 className="font-display text-base leading-snug text-foreground">{e.game.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {e.game.white} vs {e.game.black}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {e.game.event} · {e.moves} moves · {RESULT_LABEL[e.result]}
                        </p>
                        {e.opening !== UNKNOWN_OPENING && (
                          <p className="mt-0.5 text-[11px] text-primary/80">{FAMOUS_GAME_OPENINGS[e.game.id]?.fullName}</p>
                        )}
                      </div>
                      <div className="mt-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => open(e, true)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-display uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          <Play className="h-3.5 w-3.5" /> Highlights
                        </button>
                        <button
                          type="button"
                          onClick={() => open(e, false)}
                          className="rounded-lg border border-border/60 px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          Open
                        </button>
                        {e.match && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                aria-label="Why these palettes"
                                className="rounded-lg border border-border/60 px-2.5 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[22rem] max-w-[92vw] space-y-2 p-2" align="end">
                              {([['White', e.match.white], ['Black', e.match.black]] as const).map(([side, s]) => (
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
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {shown < visible.length && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShown((s) => s + PAGE)}
                  className="rounded-lg border border-border/60 px-6 py-2.5 text-xs font-display uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  Show more ({visible.length - shown} left)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Explore;
