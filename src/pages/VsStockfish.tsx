import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Trophy, TrendingUp, Target, Layers, Zap, Scale,
  Database, GitBranch, ExternalLink, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { useLiveChessStats } from '@/hooks/useLiveChessStats';

// ─── Canonical Data (from RESULTS.md — single source of truth) ──────────────

const CANONICAL = {
  totalPredictions: 12_240_000,
  epCorrect: 8_475_000,
  sfCorrect: 7_809_000,
  epAccuracy: 69.24,
  sfAccuracy: 63.81,
  epEdge: 5.43,
  // Disagreement
  bothCorrect: 6_952_000,
  epOnlyCorrect: 1_523_000,
  sfOnlyCorrect: 857_000,
  bothWrong: 2_908_000,
  epDisagreeWinRate: 64.0,
  // Chess960
  chess960Total: 1_769_457,
  chess960EP: 52.62,
  chess960SF: 33.49,
  chess960Edge: 19.13,
  // Golden Zone
  goldenZoneEP: 71.6,
  goldenZoneSF: 68.1,
  epRecoveryRate: 34.37,
};

const EVAL_ZONES = [
  { zone: '0–10 cp', ep: 43, sf: 14, edge: 29, highlight: true },
  { zone: '10–25 cp', ep: 41, sf: 16, edge: 25, highlight: true },
  { zone: '25–50 cp', ep: 58, sf: 52, edge: 6, highlight: false },
  { zone: '50–100 cp', ep: 71, sf: 70, edge: 1, highlight: false },
  { zone: '100–200 cp', ep: 78, sf: 78, edge: 0, highlight: false },
  { zone: '200+ cp', ep: 88, sf: 89, edge: -1, highlight: false },
];

const PHASE_DATA = [
  { phase: 'Opening (1–10)', ep: 47.5, sf: 50.5, edge: -3.0, note: 'Intentionally suppressed' },
  { phase: 'Early Middlegame (11–25)', ep: 65.8, sf: 60.1, edge: 5.7, note: 'EP advantage begins' },
  { phase: 'Late Middlegame (26–45)', ep: 71.6, sf: 68.1, edge: 3.5, note: 'Golden Zone' },
  { phase: 'Endgame (46–65)', ep: 73.2, sf: 70.4, edge: 2.8, note: null },
  { phase: 'Deep Endgame (66+)', ep: 52.8, sf: 57.0, edge: -4.2, note: 'Intentionally suppressed' },
];

const ARCHETYPES = [
  { name: 'piece_general_pressure', ep: 80.27, sf: 63.83, edge: 16.44, n: '~430K' },
  { name: 'kingside_coordinated_siege', ep: 76.10, sf: 64.50, edge: 11.60, n: '~210K' },
  { name: 'king_hunt', ep: 78.90, sf: 70.10, edge: 8.80, n: '~85K' },
  { name: 'sacrificial_kingside_assault', ep: 73.80, sf: 65.40, edge: 8.40, n: '~95K' },
  { name: 'central_space_advantage', ep: 71.20, sf: 67.90, edge: 3.30, n: '~180K' },
  { name: 'positional_squeeze', ep: 70.40, sf: 67.20, edge: 3.20, n: '~310K' },
];

const CROSS_DOMAIN = [
  { domain: 'Industrial Fault Detection', dataset: 'Tennessee Eastman Process', ep: '93.3% F1', baseline: '72.7% (persistence)', edge: '+20.6pp' },
  { domain: 'Battery Degradation', dataset: 'NASA + 140-cell corpus', ep: '89.0% recall', baseline: '91.8% (persistence)', edge: 'within 2.8pp' },
  { domain: 'Energy Grid', dataset: 'Power-grid stability set', ep: '66.6% 3-way', baseline: '~33% random', edge: '+33pp' },
  { domain: 'Financial Markets', dataset: 'EP market worker', ep: '41.9% directional', baseline: '33.3% random', edge: '+17.1pp' },
  { domain: 'Nuclear Fault Detection', dataset: 'NPPAD (18 accident types)', ep: '72.1% accuracy', baseline: '40.7% (NCC)', edge: '+31.4pp' },
];

// ─── Helper Components ──────────────────────────────────────────────────────

function EdgeBadge({ edge, large }: { edge: number; large?: boolean }) {
  const positive = edge > 0;
  const neutral = edge === 0;
  const Icon = positive ? ArrowUpRight : neutral ? Minus : ArrowDownRight;
  const color = positive ? 'text-green-600 dark:text-green-400' : neutral ? 'text-muted-foreground' : 'text-red-500 dark:text-red-400';
  const bg = positive ? 'bg-green-500/10' : neutral ? 'bg-muted' : 'bg-red-500/10';

  return (
    <span className={`inline-flex items-center gap-1 ${large ? 'text-lg font-bold' : 'text-sm font-semibold'} ${color} ${bg} px-2.5 py-1 rounded-md`}>
      <Icon className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
      {positive ? '+' : ''}{edge.toFixed(2)}pp
    </span>
  );
}

function StatRow({ label, epValue, sfValue, edge, isPercentage }: { label: string; epValue: string; sfValue: string; edge: number; isPercentage?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-bold text-green-600 dark:text-green-400">{epValue}</div>
          <div className="text-xs text-muted-foreground">EP</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{sfValue}</div>
          <div className="text-xs text-muted-foreground">SF18</div>
        </div>
        <EdgeBadge edge={edge} />
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function VsStockfish() {
  const { data: liveStats, isLoading: statsLoading } = useLiveChessStats();

  // Use live stats if available, otherwise canonical fallback
  const stats = liveStats || {
    totalPredictions: CANONICAL.totalPredictions,
    epAccuracy: CANONICAL.epAccuracy,
    sfAccuracy: CANONICAL.sfAccuracy,
    epEdge: CANONICAL.epEdge,
    goldenZoneEP: CANONICAL.goldenZoneEP,
    goldenZoneSF: CANONICAL.goldenZoneSF,
    goldenZoneCount: 0,
    epRecoveryRate: CANONICAL.epRecoveryRate,
    bestArchetype: { name: 'piece_general_pressure', epAccuracy: 80.27, sfAccuracy: 63.83, edge: 16.44, count: 430000 },
    chess960Total: CANONICAL.chess960Total,
    chess960EP: CANONICAL.chess960EP,
    chess960SF: CANONICAL.chess960SF,
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">EP vs Stockfish 18</h1>
                  <p className="text-xs text-muted-foreground">Evidence & Results</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/academic-paper">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Full Paper
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="sm" className="gap-2">
                  <Database className="h-4 w-4" />
                  Live Explorer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* ─── Hero Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Badge variant="secondary" className="mb-3">Canonical Results — RESULTS.md</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  En Pensent vs Stockfish 18
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  A path-based representation of chess games outperforms Stockfish 18
                  on 3-way outcome prediction across {statsLoading ? '...' : `${(stats.totalPredictions / 1_000_000).toFixed(2)}M`} live predictions.
                </p>
              </div>

              {/* Headline Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {statsLoading ? '...' : `${stats.epAccuracy.toFixed(2)}%`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">En Pensent Accuracy</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-3xl font-bold text-primary">
                      {statsLoading ? '...' : `+${stats.epEdge.toFixed(2)}pp`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Edge over Stockfish 18</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-3xl font-bold">
                      {statsLoading ? '...' : `${(stats.totalPredictions / 1_000_000).toFixed(2)}M`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Predictions Analyzed</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 1. Head-to-Head Table ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                1. Head-to-Head: 3-Way Outcome Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Task: predict White wins / Black wins / Draw from a single mid-to-late middlegame position per game.
                Stockfish 18 baseline runs at depth 14–20 under matched conditions.
              </p>
              <div className="space-y-0">
                <StatRow
                  label={`3-Way Accuracy — ${fmt(stats.totalPredictions)} predictions`}
                  epValue={`${stats.epAccuracy.toFixed(2)}%`}
                  sfValue={`${stats.sfAccuracy.toFixed(2)}%`}
                  edge={stats.epEdge}
                />
                <StatRow
                  label="Correct predictions"
                  epValue={fmt(CANONICAL.epCorrect)}
                  sfValue={fmt(CANONICAL.sfCorrect)}
                  edge={stats.epEdge}
                />
                <StatRow
                  label="Golden Zone (moves 15–45, conf≥50)"
                  epValue={`${stats.goldenZoneEP.toFixed(1)}%`}
                  sfValue={`${stats.goldenZoneSF.toFixed(1)}%`}
                  edge={stats.goldenZoneEP - stats.goldenZoneSF}
                />
                <StatRow
                  label="Recovery rate (EP correct when SF18 is wrong)"
                  epValue={`${stats.epRecoveryRate.toFixed(2)}%`}
                  sfValue="0%"
                  edge={stats.epRecoveryRate}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 2. Disagreement Analysis ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                2. When They Disagree, En Pensent Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                  <div className="text-2xl font-bold">{fmt(CANONICAL.bothCorrect)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Both correct</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <Trophy className="h-6 w-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(CANONICAL.epOnlyCorrect)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Only EP correct</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-red-500 dark:text-red-400" />
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400">{fmt(CANONICAL.sfOnlyCorrect)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Only SF18 correct</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{fmt(CANONICAL.bothWrong)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Both wrong</div>
                </div>
              </div>
              <div className="text-center p-6 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-lg">
                  When En Pensent disagrees with Stockfish 18, <strong className="text-green-600 dark:text-green-400">En Pensent is correct {CANONICAL.epDisagreeWinRate}%</strong> of the time.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ({fmt(CANONICAL.epOnlyCorrect)} / ({fmt(CANONICAL.epOnlyCorrect)} + {fmt(CANONICAL.sfOnlyCorrect)}))
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 3. Chess960 / Freestyle ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                3. Chess960 / Freestyle — The Cleanest Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stockfish 18 has no opening book for 960 starting positions and falls to near-random outcome prediction.
                En Pensent's path-based representation doesn't depend on opening knowledge — and holds up.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{fmt(CANONICAL.chess960Total)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Chess960 Games</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{CANONICAL.chess960EP}%</div>
                  <div className="text-xs text-muted-foreground mt-1">EP Accuracy</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-muted-foreground">{CANONICAL.chess960SF}%</div>
                  <div className="text-xs text-muted-foreground mt-1">SF18 Accuracy (≈ random)</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <EdgeBadge edge={CANONICAL.chess960Edge} large />
                <p className="text-sm text-muted-foreground mt-2">
                  SF18's 33.49% is approximately the random baseline (33.33%) for 3-way classification.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 4. Eval Zone Stratification ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                4. Where the Edge Lives: Eval Zone Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stockfish search is strongest at large evaluations and weakest in the 0–25 centipawn range.
                En Pensent's largest gains are concentrated in this exact zone.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Eval Zone</th>
                      <th className="text-right py-2">EP Accuracy</th>
                      <th className="text-right py-2">SF18 Accuracy</th>
                      <th className="text-right py-2">Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVAL_ZONES.map(row => (
                      <tr key={row.zone} className={`border-b ${row.highlight ? 'bg-green-500/5' : ''}`}>
                        <td className="py-3 font-medium">
                          {row.zone}
                          {row.highlight && <Badge variant="secondary" className="ml-2 text-xs">EP dominant</Badge>}
                        </td>
                        <td className="text-right py-3 font-semibold text-green-600 dark:text-green-400">{row.ep}%</td>
                        <td className="text-right py-3 text-muted-foreground">{row.sf}%</td>
                        <td className="text-right py-3"><EdgeBadge edge={row.edge} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The pattern: EP's edge is largest exactly where Stockfish's search is admittedly weakest,
                and the two systems converge as evaluations become decisive.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 5. Phase Stratification ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                5. Game Phase Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Game Phase</th>
                      <th className="text-right py-2">EP Accuracy</th>
                      <th className="text-right py-2">SF18 Accuracy</th>
                      <th className="text-right py-2">Edge</th>
                      <th className="text-left py-2 pl-4">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PHASE_DATA.map(row => (
                      <tr key={row.phase} className="border-b">
                        <td className="py-3 font-medium">{row.phase}</td>
                        <td className="text-right py-3 font-semibold">{row.ep}%</td>
                        <td className="text-right py-3 text-muted-foreground">{row.sf}%</td>
                        <td className="text-right py-3"><EdgeBadge edge={row.edge} /></td>
                        <td className="py-3 pl-4 text-xs text-muted-foreground">{row.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The system intentionally caps confidence in the opening (archetype patterns not yet established)
                and in deep endgames (Stockfish converges to perfect play). The "Golden Zone" of moves 15–45
                is where the edge is most reliable.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 6. Archetype Performance ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                6. Archetype-Level Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                A subset of the 50+ classified strategic archetypes. EP leads SF18 on every archetype with n&gt;10K.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Archetype</th>
                      <th className="text-right py-2">EP Accuracy</th>
                      <th className="text-right py-2">SF18 Accuracy</th>
                      <th className="text-right py-2">Edge</th>
                      <th className="text-right py-2">Sample Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ARCHETYPES.map(row => (
                      <tr key={row.name} className="border-b">
                        <td className="py-3 font-mono text-xs">{row.name}</td>
                        <td className="text-right py-3 font-semibold text-green-600 dark:text-green-400">{row.ep}%</td>
                        <td className="text-right py-3 text-muted-foreground">{row.sf}%</td>
                        <td className="text-right py-3"><EdgeBadge edge={row.edge} /></td>
                        <td className="text-right py-3 text-muted-foreground">{row.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 7. Cross-Domain Validation ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                7. Cross-Domain Validation — Same Architecture, Different Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The path-based representation has been benchmarked on non-chess domains to verify the architecture is not chess-specific.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Domain</th>
                      <th className="text-left py-2">Dataset</th>
                      <th className="text-right py-2">EP Result</th>
                      <th className="text-right py-2">Baseline</th>
                      <th className="text-right py-2">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CROSS_DOMAIN.map(row => (
                      <tr key={row.domain} className="border-b">
                        <td className="py-3 font-medium">{row.domain}</td>
                        <td className="py-3 text-muted-foreground text-xs">{row.dataset}</td>
                        <td className="text-right py-3 font-semibold text-green-600 dark:text-green-400">{row.ep}</td>
                        <td className="text-right py-3 text-muted-foreground">{row.baseline}</td>
                        <td className="text-right py-3 font-semibold text-green-600 dark:text-green-400">{row.edge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Verification Section ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">Verify These Numbers Yourself</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Every claim on this page is verifiable. The canonical source is <code className="text-xs bg-muted px-1.5 py-0.5 rounded">RESULTS.md</code> in the repository.
                Run the verification script to check against live data:
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <div className="text-muted-foreground"># Clone and verify in under 5 minutes</div>
                <div className="mt-1">git clone https://github.com/aarthurshelton-hash/shopify-joy-manager.git</div>
                <div>cd shopify-joy-manager && npm install</div>
                <div>node audit/verify.mjs</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link to="/academic-paper">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Full Academic Paper
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Database className="h-4 w-4" />
                    Game Explorer
                  </Button>
                </Link>
                <a href="https://github.com/aarthurshelton-hash/shopify-joy-manager/blob/main/RESULTS.md" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    RESULTS.md
                  </Button>
                </a>
                <a href="https://github.com/aarthurshelton-hash/shopify-joy-manager/blob/main/METHODOLOGY.md" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Methodology
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Footer ─── */}
        <div className="text-center text-xs text-muted-foreground py-6">
          <p>En Pensent — Canonical results from RESULTS.md · Last snapshot: February 2026</p>
          <p className="mt-1">Discrepancies between this page and <code>node audit/verify.mjs</code> should be reported as bugs.</p>
        </div>
      </main>
    </div>
  );
}
