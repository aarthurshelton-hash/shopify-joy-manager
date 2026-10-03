import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Scale,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';
import { simulateGame, truncateBoardToMove } from '@/lib/chess/gameSimulator';
import { extractColorFlowSignature, ARCHETYPE_DEFINITIONS } from '@/lib/chess/colorFlowAnalysis';
import { fetchDrawOutlook, DrawOutlook } from '@/lib/chess/drawishness/drawOutlook';
import { DecisiveMeter } from '@/components/chess/DecisiveMeter';

function archetypeName(id: string): string {
  const def = (ARCHETYPE_DEFINITIONS as Record<string, { name: string }>)[id];
  if (def) return def.name;
  return id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DrawForecast = () => {
  const [pgn, setPgn] = useState('');
  const [moveIndex, setMoveIndex] = useState(0); // 0 = final position
  const [totalMoves, setTotalMoves] = useState(0);
  const [outlook, setOutlook] = useState<DrawOutlook | null>(null);
  const [archetype, setArchetype] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<ReturnType<typeof simulateGame> | null>(null);

  const effectiveMove = useMemo(
    () => (moveIndex > 0 ? moveIndex : totalMoves),
    [moveIndex, totalMoves]
  );

  const analyze = async (targetMove?: number) => {
    setError(null);
    setOutlook(null);
    try {
      let sim = simulation;
      if (!sim || targetMove === undefined) {
        sim = simulateGame(pgn);
        if (sim.totalMoves < 10) {
          throw new Error('Game is too short — need at least 10 moves.');
        }
        setSimulation(sim);
        setTotalMoves(sim.totalMoves);
      }
      const through = targetMove ?? (moveIndex > 0 ? moveIndex : sim.totalMoves);
      const board = through >= sim.totalMoves ? sim.board : truncateBoardToMove(sim.board, through);
      const sig = extractColorFlowSignature(board, sim.gameData, through);
      setArchetype(sig.archetype);
      setLoading(true);
      const result = await fetchDrawOutlook(sig.archetype, sig.dominantSide);
      setOutlook(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not analyze this position.');
      setSimulation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSlider = (v: number[]) => {
    const m = v[0];
    setMoveIndex(m);
    if (simulation) analyze(m);
  };

  const resetInput = () => {
    setSimulation(null);
    setOutlook(null);
    setArchetype('');
    setMoveIndex(0);
    setTotalMoves(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-display flex items-center justify-center gap-3">
            <Scale className="h-7 w-7 text-primary" />
            Draw Forecast
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            The eval bar says "equal" — but how do games that <em>look</em> like this
            actually end? Paste a PGN, scrub to any position, see the verdict.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-3">
            <Textarea
              placeholder={'[Event "..."]\n1. e4 e5 2. Nf3 ...'}
              value={pgn}
              onChange={(e) => { setPgn(e.target.value); resetInput(); }}
              rows={6}
              className="font-mono text-xs"
            />
            <Button onClick={() => analyze()} disabled={loading || !pgn.trim()} className="w-full">
              {loading && !simulation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check the Forecast
            </Button>
            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </CardContent>
        </Card>

        {simulation && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Scrub to a Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-14">Move {effectiveMove}</span>
                <Slider
                  value={[effectiveMove]}
                  min={10}
                  max={totalMoves}
                  step={1}
                  onValueChange={handleSlider}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">{totalMoves}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Pattern at this point:</span>
                <Badge>{archetypeName(archetype)}</Badge>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardContent>
          </Card>
        )}

        {outlook && !loading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Outlook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DecisiveMeter outlook={outlook} />
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DrawForecast;
