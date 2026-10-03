import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Loader2,
  Swords,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Users,
  Zap,
} from 'lucide-react';
import { generateGameReport, GameReport as GameReportData } from '@/lib/chess/gameReport/generateGameReport';
import { importGames, ImportedGame, ImportSource } from '@/lib/chess/gameImport';

const SIDE_LABEL: Record<string, string> = {
  white: 'White',
  black: 'Black',
  contested: 'Contested',
};

const OutcomeBar = ({ label, value, highlight }: { label: string; value: number; highlight: boolean }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className={highlight ? 'font-semibold text-primary' : 'text-muted-foreground'}>{label}</span>
      <span className={highlight ? 'font-semibold text-primary' : 'text-muted-foreground'}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
    <Progress value={value * 100} className="h-2" />
  </div>
);

const ReportView = ({ report }: { report: GameReportData }) => (
  <div className="space-y-6">
    {/* Game header */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              {report.white} vs {report.black}
            </div>
            <div className="text-sm text-muted-foreground">
              {report.event && <span>{report.event} · </span>}
              {report.date && <span>{report.date} · </span>}
              {report.totalMoves} moves
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">{report.result}</Badge>
            {report.resultAlignment === 'defied' && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30" variant="outline">
                Defied its pattern
              </Badge>
            )}
            {report.resultAlignment === 'followed' && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30" variant="outline">
                Followed its pattern
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Archetype identity */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Swords className="h-4 w-4 text-primary" />
          Strategic Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="text-base px-3 py-1">{report.finalArchetypeName}</Badge>
          <span className="text-sm text-muted-foreground">{report.finalArchetypeDescription}</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Dominant side</div>
            <div className="font-medium">{SIDE_LABEL[report.dominantSide]}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Flow direction</div>
            <div className="font-medium capitalize">{report.flowDirection}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Intensity</div>
            <div className="font-medium">{Math.round(report.intensity)}/100</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Phase timeline */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          How the Game Evolved
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {report.phases.map((phase, i) => (
            <div key={phase.throughMove} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              <div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {phase.label} · move {phase.throughMove}
                </div>
                <div className="text-sm font-medium">{phase.archetypeName}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Corpus outlook */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          How Games Like This End
          {report.corpus.source === 'historical' && report.corpus.sampleSize > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({report.corpus.sampleSize.toLocaleString()} corpus games)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <OutcomeBar
          label="White wins"
          value={report.corpus.probabilities.white}
          highlight={report.corpus.modalOutcome === 'white_wins'}
        />
        <OutcomeBar
          label="Black wins"
          value={report.corpus.probabilities.black}
          highlight={report.corpus.modalOutcome === 'black_wins'}
        />
        <OutcomeBar
          label="Draw"
          value={report.corpus.probabilities.draw}
          highlight={report.corpus.modalOutcome === 'draw'}
        />
        {report.corpus.source === 'default' && (
          <p className="text-xs text-muted-foreground">
            Corpus data unavailable — showing baseline rates for this pattern.
          </p>
        )}
      </CardContent>
    </Card>

    {/* Turning points */}
    {report.criticalMoments.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Turning Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[...report.criticalMoments]
              .sort((a, b) => b.shiftMagnitude - a.shiftMagnitude)
              .slice(0, 5)
              .sort((a, b) => a.moveNumber - b.moveNumber)
              .map((m, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="shrink-0">Move {m.moveNumber}</Badge>
                  <span className="text-muted-foreground">{m.description}</span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    )}

    {/* Narrative */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          The Story of the Game
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.narrative.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </CardContent>
    </Card>

    {/* CTA */}
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm">
          <div className="font-medium">See this game as color flow art</div>
          <div className="text-muted-foreground">
            Visualize the full trajectory — then keep it as a print.
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Visualize It</Link>
          </Button>
          <Button asChild>
            <Link to="/order-print">Order a Print</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const GameReport = () => {
  const [pgn, setPgn] = useState('');
  const [username, setUsername] = useState('');
  const [source, setSource] = useState<ImportSource>('chesscom');
  const [importedGames, setImportedGames] = useState<ImportedGame[]>([]);
  const [report, setReport] = useState<GameReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runReport = async (gamePgn: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await generateGameReport(gamePgn);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not analyze this game.');
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    setError(null);
    setImportedGames([]);
    try {
      const games = await importGames(source, username, 12);
      setImportedGames(games);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load games.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-display flex items-center justify-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            Game Report
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Not just what the eval bar said — what <em>kind</em> of game you played, how games
            like it usually end, and where yours turned.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <Tabs defaultValue="pgn">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pgn">Paste PGN</TabsTrigger>
                <TabsTrigger value="import">Import by Username</TabsTrigger>
              </TabsList>

              <TabsContent value="pgn" className="space-y-3 pt-4">
                <Textarea
                  placeholder={'[Event "..."]\n1. e4 e5 2. Nf3 ...'}
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
                <Button onClick={() => runReport(pgn)} disabled={loading || !pgn.trim()} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generate Report
                </Button>
              </TabsContent>

              <TabsContent value="import" className="space-y-3 pt-4">
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
                    onKeyDown={(e) => e.key === 'Enter' && username.trim() && runImport()}
                  />
                  <Button onClick={runImport} disabled={importing || !username.trim()}>
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
                  </Button>
                </div>

                {importedGames.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {importedGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => runReport(game.pgn)}
                        disabled={loading}
                        className="w-full text-left rounded-lg border border-border/60 bg-card/50 px-3 py-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">
                            {game.white} vs {game.black}
                          </span>
                          <Badge variant="outline" className="shrink-0 ml-2">{game.result}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{game.date} · {game.event}</div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Reading the game's trajectory...
          </div>
        )}

        {report && !loading && <ReportView report={report} />}
      </main>
      <Footer />
    </div>
  );
};

export default GameReport;
