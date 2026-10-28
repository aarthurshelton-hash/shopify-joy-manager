import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Users, Heart, Palette, Download, Film, Printer, Trophy, Star, ArrowRight } from 'lucide-react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPlatformVisionStats, getVisionLeaderboard, type VisionLeaderboardEntry } from '@/lib/visualizations/visionScoring';

interface InsightsData {
  visions: number;
  creators: number;
  favorites: number;
  palettes: number;
  publicPalettes: number;
  views: number;
  downloads: number;
  gifs: number;
  printOrders: number;
  topGames: { gameId: string; count: number }[];
  topVisions: VisionLeaderboardEntry[];
  mine: { visions: number; favorites: number; palettes: number } | null;
}

const nf = (n: number) => n.toLocaleString();

const Stat = ({ icon: Icon, label, value, note, loading }: {
  icon: typeof Eye; label: string; value: number; note?: string; loading: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm"
  >
    <Icon className="h-4 w-4 text-primary" />
    <p className="mt-4 font-display text-3xl font-bold tabular-nums text-foreground">
      {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted/40" /> : nf(value)}
    </p>
    <p className="mt-1 text-[11px] font-display uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    {note && <p className="mt-1 text-xs text-muted-foreground/70">{note}</p>}
  </motion.div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">{children}</h2>
);

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [viz, fav, pal, platform, topVisions] = await Promise.all([
          supabase.from('saved_visualizations').select('id, user_id', { count: 'exact' }),
          supabase.from('favorite_games').select('id, game_id', { count: 'exact' }),
          supabase.from('saved_palettes').select('id, is_public', { count: 'exact' }),
          getPlatformVisionStats(),
          getVisionLeaderboard(5),
        ]);

        const freq: Record<string, number> = {};
        fav.data?.forEach((f) => { freq[f.game_id] = (freq[f.game_id] || 0) + 1; });
        const topGames = Object.entries(freq)
          .map(([gameId, count]) => ({ gameId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        let mine: InsightsData['mine'] = null;
        if (user) {
          const [mv, mf, mp] = await Promise.all([
            supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('favorite_games').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('saved_palettes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          ]);
          mine = { visions: mv.count || 0, favorites: mf.count || 0, palettes: mp.count || 0 };
        }

        if (cancelled) return;
        setData({
          visions: viz.count || 0,
          creators: new Set(viz.data?.map((v) => v.user_id) || []).size,
          favorites: fav.count || 0,
          palettes: pal.count || 0,
          publicPalettes: pal.data?.filter((p) => p.is_public).length || 0,
          views: platform.totalViews,
          downloads: platform.totalDownloads,
          gifs: platform.totalGifDownloads,
          printOrders: platform.totalPrintOrders,
          topGames,
          topVisions,
          mine,
        });
      } catch (e) {
        console.error('Insights load failed:', e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-14">
          <header className="space-y-4 text-center">
            <p className="font-display text-[11px] uppercase tracking-[0.35em] text-primary">Insights</p>
            <h1 className="font-royal text-4xl font-bold uppercase tracking-wide md:text-5xl">
              The En Pensent <span className="text-gold-gradient">community</span>
            </h1>
            <p className="mx-auto max-w-xl font-serif text-muted-foreground">
              Live counts from the people making, collecting and printing chess visions. Everything here is real, with nothing estimated.
            </p>
          </header>

          <section className="space-y-4">
            <SectionTitle>Creations</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat icon={Eye} label="Visions created" value={data?.visions || 0} loading={loading} />
              <Stat icon={Users} label="Creators" value={data?.creators || 0} loading={loading} />
              <Stat icon={Heart} label="Games favorited" value={data?.favorites || 0} loading={loading} />
              <Stat
                icon={Palette}
                label="Custom palettes"
                value={data?.palettes || 0}
                note={data ? `${nf(data.publicPalettes)} shared publicly` : undefined}
                loading={loading}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Activity</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat icon={Eye} label="Vision views" value={data?.views || 0} loading={loading} />
              <Stat icon={Download} label="HD downloads" value={data?.downloads || 0} loading={loading} />
              <Stat icon={Film} label="GIF exports" value={data?.gifs || 0} loading={loading} />
              <Stat icon={Printer} label="Print orders" value={data?.printOrders || 0} loading={loading} />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <SectionTitle>Top visions</SectionTitle>
              <div className="space-y-2">
                {loading ? (
                  [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />)
                ) : data && data.topVisions.length > 0 ? (
                  data.topVisions.map((v, i) => (
                    <button
                      key={v.visualizationId}
                      onClick={() => navigate(`/v/${v.visualizationId}`)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-3 text-left transition-colors hover:border-primary/40"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-display text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm">{v.title}</span>
                        <span className="block text-xs text-muted-foreground">by {v.ownerDisplayName}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-display text-lg text-primary tabular-nums">{v.totalScore.toFixed(1)}</span>
                        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">pts</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border/50 p-6 text-center font-serif text-sm text-muted-foreground">
                    No scored visions yet. Save one to the gallery and it appears here.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70">
                Points: view 0.01, HD download 0.10, GIF export 0.25, print order 2.00.
              </p>
            </div>

            <div className="space-y-4">
              <SectionTitle>Most favorited games</SectionTitle>
              <div className="space-y-2">
                {loading ? (
                  [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />)
                ) : data && data.topGames.length > 0 ? (
                  data.topGames.map((g, i) => (
                    <div key={g.gameId} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-display text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-display text-sm capitalize">{g.gameId.replace(/-/g, ' ')}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" /> {g.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border/50 p-6 text-center font-serif text-sm text-muted-foreground">
                    Favorite a famous game and it will appear here.
                  </p>
                )}
              </div>
            </div>
          </section>

          {data?.mine && (
            <section className="space-y-4">
              <SectionTitle>Your collection</SectionTitle>
              <div className="grid grid-cols-3 gap-4">
                <Stat icon={Star} label="Your visions" value={data.mine.visions} loading={false} />
                <Stat icon={Heart} label="Your favorites" value={data.mine.favorites} loading={false} />
                <Stat icon={Trophy} label="Your palettes" value={data.mine.palettes} loading={false} />
              </div>
            </section>
          )}

          <section className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-8 text-center">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider">Make your own</h3>
            <p className="mx-auto mt-2 max-w-md font-serif text-sm text-muted-foreground">
              Paste any game and watch it unfold, with every check, capture and tactic called out on the board.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore a game <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;
