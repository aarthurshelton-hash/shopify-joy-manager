import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Fingerprint,
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Share2,
  Crosshair,
  Flame,
  Snowflake,
  Minus,
  Download,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generatePlayerFingerprint,
  fetchExtendedHistory,
  PlayerFingerprint as FingerprintData,
  ArchetypeProfile,
  FormEntry,
} from '@/lib/chess/fingerprint/generateFingerprint';
import { ImportSource } from '@/lib/chess/gameImport';
import { useAuth } from '@/hooks/useAuth';

const ArchetypeRow = ({ p }: { p: ArchetypeProfile }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{p.name}</span>
      <span className="text-muted-foreground">
        {p.games} games · {p.share.toFixed(0)}% · {p.winRate.toFixed(0)}% win rate
      </span>
    </div>
    <div className="flex items-center gap-2">
      <Progress value={p.share} className="h-2 flex-1" />
      {p.deltaVsBaseline >= 10 && (
        <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
      )}
      {p.deltaVsBaseline <= -10 && (
        <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
      )}
    </div>
  </div>
);

const BIAS_STYLES: Record<string, string> = {
  attacking: 'border-red-500/40 bg-red-500/10 text-red-500',
  positional: 'border-blue-500/40 bg-blue-500/10 text-blue-500',
  technical: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  volatile: 'border-orange-500/40 bg-orange-500/10 text-orange-500',
  balanced: 'border-border/60 bg-muted/30 text-muted-foreground',
};

const OUTCOME_DOT: Record<FormEntry['outcome'], string> = {
  win: 'bg-green-500',
  draw: 'bg-zinc-400',
  loss: 'bg-red-500',
  unknown: 'bg-muted',
};

const FormStrip = ({ timeline }: { timeline: FormEntry[] }) => (
  <div className="flex items-end gap-1 flex-wrap">
    {timeline.map((e, i) => (
      <div
        key={i}
        title={`${e.opponent} (${e.userColor}) — ${e.archetype.replace(/_/g, ' ')} — ${e.outcome}`}
        className={`h-6 w-2.5 rounded-sm ${OUTCOME_DOT[e.outcome]} ${
          i === timeline.length - 1 ? 'ring-1 ring-foreground/50' : 'opacity-80'
        }`}
      />
    ))}
    <span className="ml-2 text-[10px] text-muted-foreground">oldest → latest</span>
  </div>
);

const FingerprintCard = ({
  fp,
  onExportHistory,
  exporting,
  isPremium,
}: {
  fp: FingerprintData;
  onExportHistory: () => void;
  exporting: boolean;
  isPremium: boolean;
}) => {
  const shareText = () => {
    const lines = [
      `My Chess Fingerprint — ${fp.style.label}`,
      ``,
      ...fp.narrative,
      ``,
      `Analyzed ${fp.gamesAnalyzed} games via En Pensent: ${window.location.origin}/fingerprint`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => toast.success('Fingerprint copied — paste it anywhere'),
      () => toast.error('Could not copy to clipboard')
    );
  };

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Fingerprint className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-display">{fp.style.label}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {fp.username} · {fp.gamesAnalyzed} games analyzed
            {fp.gamesSkipped > 0 && ` (${fp.gamesSkipped} skipped)`}
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Win rate</div>
              <div className="font-semibold">{fp.overallWinRate.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Draw rate</div>
              <div className="font-semibold">{(fp.drawRate * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg intensity</div>
              <div className="font-semibold">{Math.round(fp.avgIntensity)}/100</div>
            </div>
          </div>
          <p className="text-sm max-w-lg mx-auto">{fp.style.description}</p>

          {/* Current bias + trend — the scouting verdict */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                BIAS_STYLES[fp.bias.kind]
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              {fp.bias.label} · {fp.bias.conviction}%
            </span>
            {fp.trend === 'heating_up' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-500 text-xs font-medium">
                <Flame className="h-3.5 w-3.5" /> Heating up
              </span>
            )}
            {fp.trend === 'cooling' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-400/40 bg-blue-400/10 text-blue-400 text-xs font-medium">
                <Snowflake className="h-3.5 w-3.5" /> Cooling
              </span>
            )}
            {fp.trend === 'steady' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-muted-foreground text-xs font-medium">
                <Minus className="h-3.5 w-3.5" /> Steady
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {fp.bias.description}
          </p>

          {/* Recent form strip */}
          <div className="max-w-md mx-auto">
            <FormStrip timeline={fp.formTimeline} />
          </div>

          <Button variant="outline" size="sm" onClick={shareText}>
            <Share2 className="h-4 w-4 mr-2" />
            Copy Share Text
          </Button>
        </CardContent>
      </Card>

      {/* Archetype distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Strategic Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fp.profile.slice(0, 8).map((p) => (
            <ArchetypeRow key={p.archetype} p={p} />
          ))}
        </CardContent>
      </Card>

      {/* Strengths & weaknesses */}
      {(fp.strengths.length > 0 || fp.weaknesses.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {fp.strengths.length > 0 && (
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fp.strengths.map((p) => (
                  <div key={p.archetype} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-green-600 font-medium">
                      +{p.deltaVsBaseline.toFixed(0)}pp
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {fp.weaknesses.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Danger Zones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fp.weaknesses.map((p) => (
                  <div key={p.archetype} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-destructive font-medium">
                      {p.deltaVsBaseline.toFixed(0)}pp
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Scout report — actionable prep */}
      {fp.prepNotes.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" />
              Scout Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {fp.prepNotes.map((note, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Narrative */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fp.narrative.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
          ))}
        </CardContent>
      </Card>

      {/* Premium history export */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm">
            <div className="font-medium flex items-center gap-1.5">
              {!isPremium && <Crown className="h-4 w-4 text-primary" />}
              Full History Export
            </div>
            <div className="text-muted-foreground">
              {isPremium
                ? 'Download every analyzed game — archetype, outcome, opponent — as CSV.'
                : 'Premium members can download the complete archetype timeline (up to 250 games).'}
            </div>
          </div>
          <Button onClick={onExportHistory} disabled={exporting} variant={isPremium ? 'default' : 'outline'}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {exporting ? 'Analyzing history…' : isPremium ? 'Download CSV' : 'Unlock with Premium'}
          </Button>
        </CardContent>
      </Card>

      {/* CTAs */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm">
            <div className="font-medium">Want the story of a specific game?</div>
            <div className="text-muted-foreground">
              Get a full narrative report on any single game.
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/report">Game Report</Link>
            </Button>
            <Button asChild>
              <Link to="/order-print">Print Your Signature</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ChessFingerprint = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState<ImportSource>('chesscom');
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPremium } = useAuth();
  const navigate = useNavigate();

  const run = async () => {
    setLoading(true);
    setError(null);
    setFingerprint(null);
    try {
      const fp = await generatePlayerFingerprint(username, source, 30);
      setFingerprint(fp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not analyze this player.');
    } finally {
      setLoading(false);
    }
  };

  const exportFullHistory = async () => {
    if (!fingerprint) return;
    if (!isPremium) {
      toast.info('Full history export is a Premium feature', {
        description: 'Unlock 250-game archetype timelines for any opponent.',
        action: { label: 'Upgrade', onClick: () => navigate('/premium') },
      });
      return;
    }
    setExporting(true);
    try {
      const games = await fetchExtendedHistory(fingerprint.username, fingerprint.source, 250);
      const full = await generatePlayerFingerprint(
        fingerprint.username,
        fingerprint.source,
        250,
        games
      );

      const header = 'date,opponent,color,archetype,outcome';
      const rows = full.fullTimeline.map((e) =>
        [
          e.date ?? '',
          `"${e.opponent.replace(/"/g, '""')}"`,
          e.userColor,
          e.archetype,
          e.outcome,
        ].join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ep-fingerprint-${fingerprint.username}-${full.fullTimeline.length}games.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${full.fullTimeline.length} games`, {
        description: 'Full archetype timeline saved as CSV.',
      });
    } catch (e) {
      toast.error('Export failed', {
        description: e instanceof Error ? e.message : 'Could not fetch full history.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-display flex items-center justify-center gap-3">
            <Fingerprint className="h-7 w-7 text-primary" />
            Chess Fingerprint
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Scout any opponent — or yourself. Their last 30 games distilled into a
            strategic identity: current bias, form, where they're dangerous,
            and where they bleed points.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-3">
            <div className="flex gap-2">
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSource('chesscom')}
                  className={`px-3 py-2 text-sm ${source === 'chesscom' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                >
                  Chess.com
                </button>
                <button
                  type="button"
                  onClick={() => setSource('lichess')}
                  className={`px-3 py-2 text-sm ${source === 'lichess' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                >
                  Lichess
                </button>
              </div>
              <Input
                placeholder="Username (yours or an opponent's)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && username.trim() && !loading && run()}
              />
              <Button onClick={run} disabled={loading || !username.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Reading your last 30 games — this takes ~20 seconds...
          </div>
        )}

        {fingerprint && !loading && (
          <FingerprintCard
            fp={fingerprint}
            onExportHistory={exportFullHistory}
            exporting={exporting}
            isPremium={isPremium}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ChessFingerprint;
