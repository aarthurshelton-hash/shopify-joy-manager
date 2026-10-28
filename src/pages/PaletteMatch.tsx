import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Swords, Play, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { PremiumUpgradeModal } from '@/components/premium';
import { PlayerPaletteCard, type JourneyStep } from '@/components/chess/PlayerPaletteCard';
import { useAuth } from '@/hooks/useAuth';
import { useSessionStore } from '@/stores/sessionStore';
import { importGames, importHeadToHead, type ImportedGame, type ImportSource } from '@/lib/chess/gameImport';
import { listStoredProfiles, profileFromGames, updateStoredProfile, type StoredStyleProfile } from '@/lib/chess/onlineStyle';
import { matchPaletteForProfiles, composeMatchPalette, styleFromScores, type MatchPalette, type PlayerProfile } from '@/lib/chess/playerStyle';
import { signaturePalette } from '@/lib/chess/signaturePalette';
import { getActivePalette, setTemporaryPalette, type PaletteId } from '@/lib/chess/pieceColors';
import { simulateGame } from '@/lib/chess/gameSimulator';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';

const GAMES_PER_PLAYER = 100;

interface Slot {
  platform: ImportSource;
  username: string;
}

interface Loaded {
  slot: Slot;
  games: ImportedGame[];
  profile: PlayerProfile;
}

const journeyOf = (p: PlayerProfile): JourneyStep[] => {
  const out: JourneyStep[] = [];
  for (const h of p.history) {
    if (out[out.length - 1]?.paletteId !== h.paletteId) out.push({ label: `#${h.games}`, paletteId: h.paletteId });
  }
  return out;
};

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const PaletteMatch = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { setCurrentSimulation } = useSessionStore();
  const [slots, setSlots] = useState<[Slot, Slot]>([
    { platform: 'chesscom', username: 'GothamChess' },
    { platform: 'chesscom', username: 'Hikaru' },
  ]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<[Loaded, Loaded] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tracked, setTracked] = useState<StoredStyleProfile[]>([]);
  const [h2h, setH2h] = useState<{ loading: boolean; games: ImportedGame[]; searched: string; error?: string }>({ loading: false, games: [], searched: '' });
  const matchRun = useRef(0);

  useEffect(() => {
    if (!user) return;
    listStoredProfiles(user.id).then(setTracked).catch(() => setTracked([]));
  }, [user]);

  const build = useCallback(async () => {
    if (slots.some((s) => !s.username.trim())) {
      toast.error('Enter both usernames.');
      return;
    }
    setLoading(true);
    setLoaded(null);
    setH2h({ loading: false, games: [], searched: '' });
    const run = ++matchRun.current;
    try {
      const results = await Promise.all(
        slots.map(async (slot) => {
          const games = await importGames(slot.platform, slot.username, GAMES_PER_PLAYER);
          const profile = profileFromGames(slot.platform, slot.username, games);
          if (!profile) throw new Error(`No games by ${slot.username} found.`);
          return { slot, games, profile };
        }),
      );
      setLoaded(results as [Loaded, Loaded]);
      if (slots[0].platform === slots[1].platform) {
        setH2h({ loading: true, games: [], searched: '' });
        importHeadToHead(slots[0].platform, slots[0].username, slots[1].username, 30, 36, (partial) => {
          if (run === matchRun.current) setH2h({ loading: true, games: partial.games, searched: partial.searched });
        })
          .then((r) => run === matchRun.current && setH2h({ loading: false, games: r.games, searched: r.searched }))
          .catch((e) => run === matchRun.current && setH2h({ loading: false, games: [], searched: '', error: e instanceof Error ? e.message : String(e) }));
      } else {
        setH2h({ loading: false, games: [], searched: '', error: 'Players are on different sites, so they have no games together.' });
      }
    } catch (err) {
      toast.error('Could not build palettes', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, [slots]);

  const match: MatchPalette | null = useMemo(() => (loaded ? matchPaletteForProfiles(loaded[0].profile, loaded[1].profile) : null), [loaded]);

  const headToHead = useMemo(() => {
    if (!loaded) return [];
    const [a, b] = loaded;
    const seen = new Set<string>();
    const out: ImportedGame[] = [];
    for (const g of [...h2h.games, ...a.games, ...b.games]) {
      const between = (same(g.white, a.slot.username) && same(g.black, b.slot.username)) || (same(g.white, b.slot.username) && same(g.black, a.slot.username));
      if (!between) continue;
      const hash = generateGameHash(g.pgn);
      if (seen.has(hash)) continue;
      seen.add(hash);
      out.push(g);
    }
    return out.sort((x, y) => y.date.localeCompare(x.date));
  }, [loaded, h2h.games]);

  const visualize = useCallback(
    (g: ImportedGame) => {
      if (!loaded || !match) return;
      const aIsWhite = same(g.white, loaded[0].slot.username);
      const pw = (aIsWhite ? match.white : match.black).paletteId;
      const pb = (aIsWhite ? match.black : match.white).paletteId;
      const previous = getActivePalette();
      setTemporaryPalette(composeMatchPalette(pw, pb));
      const sim = simulateGame(g.pgn);
      setTemporaryPalette(previous);
      setCurrentSimulation(sim, g.pgn, `${g.white} vs ${g.black}`);
      navigate(`/g/${generateGameHash(g.pgn)}?src=generator&pw=${pw}&pb=${pb}`);
    },
    [loaded, match, navigate, setCurrentSimulation],
  );

  const track = useCallback(
    async (l: Loaded) => {
      if (!user) {
        toast.error('Sign in to track a player.');
        return;
      }
      if (!isPremium) {
        setShowUpgrade(true);
        return;
      }
      setSaving(l.slot.username);
      try {
        const saved = await updateStoredProfile(user.id, l.slot.platform, l.slot.username, l.games);
        setTracked((t) => [saved, ...t.filter((x) => x.id !== saved.id)]);
        toast.success(`Tracking ${l.slot.username}`, { description: 'Signature palette saved to My Palettes. It evolves each time you refresh.' });
      } catch (err) {
        toast.error('Could not save profile', { description: err instanceof Error ? err.message : String(err) });
      } finally {
        setSaving(null);
      }
    },
    [user, isPremium],
  );

  const input = 'rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <p className="font-display text-[11px] uppercase tracking-[0.35em] text-primary">Palette match</p>
        <h1 className="mt-3 font-royal text-3xl font-bold uppercase tracking-wide md:text-5xl">Every player has a colour</h1>
        <p className="mt-3 max-w-2xl font-serif text-muted-foreground">
          Enter two players. Their last {GAMES_PER_PLAYER} games are read from their own moves (energy, pawn structure, game length), compared with
          players of the same time control, and turned into a palette that evolves game by game. Their games together are drawn side against side.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          {slots.map((s, i) => (
            <div key={i} className={`flex gap-2 ${i === 1 ? 'md:order-3' : ''}`}>
              <select
                aria-label={`Player ${i + 1} platform`}
                value={s.platform}
                onChange={(e) => setSlots((prev) => prev.map((p, j) => (j === i ? { ...p, platform: e.target.value as ImportSource } : p)) as [Slot, Slot])}
                className={input}
              >
                <option value="chesscom">Chess.com</option>
                <option value="lichess">Lichess</option>
              </select>
              <input
                aria-label={`Player ${i + 1} username`}
                value={s.username}
                onChange={(e) => setSlots((prev) => prev.map((p, j) => (j === i ? { ...p, username: e.target.value } : p)) as [Slot, Slot])}
                placeholder="Username"
                className={`${input} flex-1`}
              />
            </div>
          ))}
          <Button onClick={build} disabled={loading} className="gap-2 md:order-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            Match
          </Button>
        </div>

        {loaded && match && (
          <section className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              {loaded.map((l, i) => {
                const side = i === 0 ? match.white : match.black;
                const last = l.profile.history[l.profile.history.length - 1];
                return (
                  <div key={l.slot.username} className="space-y-2">
                    <PlayerPaletteCard
                      name={`${l.slot.username} (${l.slot.platform === 'chesscom' ? 'Chess.com' : 'Lichess'})`}
                      paletteId={side.paletteId}
                      style={side.style}
                      games={side.games}
                      why={side.why}
                      journey={journeyOf(l.profile)}
                    />
                    <PlayerPaletteCard name="Signature palette" paletteId={side.paletteId} signature={signaturePalette(last.style, l.slot.username)} />
                    <Button variant="outline" size="sm" className="w-full gap-2" disabled={saving === l.slot.username} onClick={() => track(l)}>
                      {saving === l.slot.username ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                      Track {l.slot.username} (Premium)
                    </Button>
                  </div>
                );
              })}
            </div>

            <div>
              <h2 className="font-display text-sm uppercase tracking-wider">Their games together</h2>
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                {h2h.loading
                  ? `Searching ${loaded[0].slot.username}'s game history for games against ${loaded[1].slot.username}${h2h.searched ? ` (${h2h.searched})` : ''}…`
                  : h2h.error
                    ? h2h.error
                    : `${headToHead.length} game${headToHead.length === 1 ? '' : 's'} found${h2h.searched ? ` (searched ${h2h.searched})` : ''}. Each side is drawn in its player's palette.`}
              </p>
              {h2h.loading && headToHead.length === 0 ? (
                <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />
              ) : headToHead.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No games between them found.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border/40 rounded-xl border border-border/50">
                  {headToHead.slice(0, 20).map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>
                        {g.white} vs {g.black} <span className="text-muted-foreground">· {g.result} · {g.date}</span>
                      </span>
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => visualize(g)}>
                        <Play className="h-3.5 w-3.5" /> Visualize
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tracked.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-sm uppercase tracking-wider">Players you track</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracked.map((t) => (
                <PlayerPaletteCard
                  key={t.id}
                  name={`${t.username} (${t.platform === 'chesscom' ? 'Chess.com' : 'Lichess'})`}
                  paletteId={t.paletteId}
                  style={styleFromScores(t.scores)}
                  games={t.games}
                  journey={t.journey.map((j) => ({ label: j.at.slice(0, 10), paletteId: j.paletteId as PaletteId }))}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <PremiumUpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} trigger="general" />
    </div>
  );
};

export default PaletteMatch;
