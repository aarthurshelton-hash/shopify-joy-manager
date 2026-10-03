import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generatePlayerFingerprint,
  PlayerFingerprint as FingerprintData,
  ArchetypeProfile,
} from '@/lib/chess/fingerprint/generateFingerprint';
import { ImportSource } from '@/lib/chess/gameImport';

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

const FingerprintCard = ({ fp }: { fp: FingerprintData }) => {
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
  const [error, setError] = useState<string | null>(null);

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
            Your last 30 games distilled into a strategic identity — which patterns
            you play, where you're dangerous, and where you bleed points.
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
                placeholder="Username"
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

        {fingerprint && !loading && <FingerprintCard fp={fingerprint} />}
      </main>
      <Footer />
    </div>
  );
};

export default ChessFingerprint;
