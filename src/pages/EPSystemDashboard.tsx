import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Brain, BarChart3, Zap, Activity } from 'lucide-react';

const BRIDGE = 'http://localhost:4000';

interface Report {
  generated_at: string;
  chess: {
    summary: { total_predictions: number; ep_accuracy: number; sf_accuracy: number; enhanced_accuracy: number; ep_edge_over_sf_pp: number; ep_when_sf_wrong_pct: number; unique_games: number };
    by_archetype: { archetype: string; n: number; ep_accuracy: number; sf_accuracy: number; edge_pp: number }[];
    by_data_source: { source: string; n: number; ep_accuracy: number; sf_accuracy: number }[];
  };
  market: {
    by_symbol: { symbol: string; n: number; accuracy: number; avg_confidence: number; unresolved: number }[];
    by_archetype: { archetype: string; n: number; accuracy: number; symbols_seen: number }[];
    chess_resonance_cross_domain: { chess_archetype_resonance: string; n: number; accuracy: number; symbols: number }[];
  };
  paper_trading: {
    summary: { total_trades: number; open: number; closed: number; wins: number; losses: number; win_rate_pct: number; total_pnl: number; avg_pnl_per_trade: number; first_trade: string; last_trade: string };
    by_grade: { grade: string; total: number; wins: number; losses: number; win_rate_pct: number; total_pnl: number; avg_score: number }[];
    by_horizon: { horizon: string; total: number; wins: number; losses: number; win_rate_pct: number; total_pnl: number }[];
  };
  options_scalping: {
    summary: { total_trades: number; wins: number; losses: number; win_rate_pct: number; total_pnl: number };
    by_archetype: { arch: string; n: number; wins: number; win_rate_pct: number; total_pnl: number }[];
    by_grade: { grade: string; n: number; wins: number; win_rate_pct: number; total_pnl: number }[];
    by_timeframe: { tf: string; n: number; wins: number; win_rate_pct: number; total_pnl: number }[];
  };
  signal_calibration: { type: string; sample_size: number; validation_accuracy: number | null; last_updated: string }[];
}

function Stat({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xl font-bold ${up === true ? 'text-green-500' : up === false ? 'text-red-400' : ''}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function AccBadge({ acc }: { acc: number | null }) {
  if (acc == null) return <span className="text-muted-foreground text-xs">N/A</span>;
  const color = acc >= 60 ? 'text-green-500' : acc >= 52 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-mono font-bold text-sm ${color}`}>{acc.toFixed(1)}%</span>;
}

function PnlBadge({ pnl }: { pnl: number }) {
  const color = pnl >= 0 ? 'text-green-500' : 'text-red-400';
  return <span className={`font-mono text-sm ${color}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>;
}

export default function EPSystemDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BRIDGE}/api/reports/latest`);
      if (!res.ok) throw new Error(`Bridge returned ${res.status}`);
      setReport(await res.json());
      setLastFetch(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Home</Button></Link>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Activity className="h-6 w-6 text-primary" /></div>
              <div>
                <h1 className="font-bold text-lg">EP System Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : 'En Pensent — Live Intelligence'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/10">
            <CardContent className="p-4 text-red-400 text-sm">
              Bridge offline or report not yet generated. Run <code>pm2 start report-generator</code> to generate. Error: {error}
            </CardContent>
          </Card>
        )}

        {report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

            {/* ── Chess Engine ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Chess Engine — EP vs SF18</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card><CardContent className="p-4"><Stat label="EP Accuracy" value={`${report.chess.summary.ep_accuracy}%`} up={true} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="SF18 Accuracy" value={`${report.chess.summary.sf_accuracy}%`} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="EP Edge" value={`+${report.chess.summary.ep_edge_over_sf_pp}pp`} up={true} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Enhanced Acc" value={`${report.chess.summary.enhanced_accuracy}%`} up={true} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="EP When SF Wrong" value={`${report.chess.summary.ep_when_sf_wrong_pct}%`} up={true} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Total Predictions" value={`~${(report.chess.summary.total_predictions / 1_000_000).toFixed(1)}M`} sub={`${(report.chess.summary.unique_games / 1_000_000).toFixed(1)}M games`} /></CardContent></Card>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Archetype (Top 12)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.chess.by_archetype.slice(0, 12).map(r => (
                        <div key={r.archetype} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.archetype}</span>
                          <div className="flex gap-4">
                            <span><AccBadge acc={r.ep_accuracy} /></span>
                            <span className="text-xs text-muted-foreground">{r.edge_pp >= 0 ? '+' : ''}{r.edge_pp}pp</span>
                            <span className="text-xs text-muted-foreground">n=~{(r.n / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Data Source</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.chess.by_data_source.map(r => (
                        <div key={r.source} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="font-mono text-xs">{r.source}</span>
                          <div className="flex gap-4">
                            <AccBadge acc={r.ep_accuracy} />
                            <span className="text-xs text-muted-foreground">n=~{(r.n / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── Chess→Market Cross-Domain ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" />Chess → Market Cross-Domain Resonance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Chess Archetype → Market Accuracy</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.market.chess_resonance_cross_domain.map(r => (
                        <div key={r.chess_archetype_resonance} className="flex items-center justify-between px-4 py-2">
                          <span className="font-mono text-xs text-muted-foreground">{r.chess_archetype_resonance}</span>
                          <div className="flex gap-3 items-center">
                            <AccBadge acc={r.accuracy} />
                            <span className="text-xs text-muted-foreground">n={r.n}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Market Archetype Accuracy (Top 10)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.market.by_archetype.slice(0, 10).map(r => (
                        <div key={r.archetype} className="flex items-center justify-between px-4 py-2">
                          <span className="font-mono text-xs text-muted-foreground">{r.archetype}</span>
                          <div className="flex gap-3 items-center">
                            <AccBadge acc={r.accuracy} />
                            <span className="text-xs text-muted-foreground">n={r.n}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── Market by Symbol ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-400" />Market Predictions by Symbol</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {report.market.by_symbol.filter(r => r.n > 50).map(r => (
                  <Card key={r.symbol}>
                    <CardContent className="p-4">
                      <div className="font-bold text-base">{r.symbol}</div>
                      <AccBadge acc={r.accuracy} />
                      <div className="text-xs text-muted-foreground mt-1">n={r.n}</div>
                      <div className="text-xs text-muted-foreground">conf={r.avg_confidence}%</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Paper Trading ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-400" />Paper Trading — IBKR DUO712203</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                <Card><CardContent className="p-4"><Stat label="Total P&L" value={`${report.paper_trading.summary.total_pnl >= 0 ? '+' : ''}$${report.paper_trading.summary.total_pnl.toFixed(2)}`} up={report.paper_trading.summary.total_pnl >= 0} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Win Rate" value={`${(report.paper_trading.summary.win_rate_pct ?? 0).toFixed(1)}%`} sub={`${report.paper_trading.summary.wins}W / ${report.paper_trading.summary.losses}L`} up={(report.paper_trading.summary.win_rate_pct ?? 0) >= 50} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Avg P&L/Trade" value={`$${report.paper_trading.summary.avg_pnl_per_trade.toFixed(2)}`} up={report.paper_trading.summary.avg_pnl_per_trade >= 0} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Open Positions" value={`${report.paper_trading.summary.open}`} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Closed Trades" value={`${report.paper_trading.summary.closed}`} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Total Trades" value={`${report.paper_trading.summary.total_trades}`} /></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Viability Grade</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.paper_trading.by_grade.map(r => (
                        <div key={r.grade} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="font-bold">Grade {r.grade}</span>
                          <div className="flex gap-4 items-center">
                            <AccBadge acc={r.win_rate_pct} />
                            <PnlBadge pnl={r.total_pnl} />
                            <span className="text-xs text-muted-foreground">{r.wins}W/{r.losses}L</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Time Horizon</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.paper_trading.by_horizon.map(r => (
                        <div key={r.horizon} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="font-mono font-bold">{r.horizon}</span>
                          <div className="flex gap-4 items-center">
                            <AccBadge acc={r.win_rate_pct} />
                            <PnlBadge pnl={r.total_pnl} />
                            <span className="text-xs text-muted-foreground">{r.wins}W/{r.losses}L</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── Options Scalping ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-purple-400" />Options Scalping</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card><CardContent className="p-4"><Stat label="Total Trades" value={`${report.options_scalping.summary.total_trades}`} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Win Rate" value={`${(report.options_scalping.summary.win_rate_pct ?? 0).toFixed(1)}%`} sub={`${report.options_scalping.summary.wins}W/${report.options_scalping.summary.losses}L`} up={(report.options_scalping.summary.win_rate_pct ?? 0) >= 50} /></CardContent></Card>
                <Card><CardContent className="p-4"><Stat label="Total P&L" value={`${report.options_scalping.summary.total_pnl >= 0 ? '+' : ''}$${report.options_scalping.summary.total_pnl.toFixed(0)}`} up={report.options_scalping.summary.total_pnl >= 0} /></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Archetype</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {report.options_scalping.by_archetype.map(r => (
                      <div key={r.arch} className="flex items-center justify-between px-4 py-2 text-sm border-b last:border-0">
                        <span className="font-mono text-xs text-muted-foreground">{r.arch}</span>
                        <div className="flex gap-3"><AccBadge acc={r.win_rate_pct} /><PnlBadge pnl={r.total_pnl} /></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Grade</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {report.options_scalping.by_grade.map(r => (
                      <div key={r.grade} className="flex items-center justify-between px-4 py-2 text-sm border-b last:border-0">
                        <span className="font-bold">Grade {r.grade}</span>
                        <div className="flex gap-3"><AccBadge acc={r.win_rate_pct} /><PnlBadge pnl={r.total_pnl} /></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm">By Timeframe</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {report.options_scalping.by_timeframe.map(r => (
                      <div key={r.tf} className="flex items-center justify-between px-4 py-2 text-sm border-b last:border-0">
                        <span className="font-mono font-bold">{r.tf}</span>
                        <div className="flex gap-3"><AccBadge acc={r.win_rate_pct} /><PnlBadge pnl={r.total_pnl} /></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── Signal Calibration ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-400" />Signal Calibration (Learned Weights)</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {report.signal_calibration.map(r => (
                      <div key={r.type} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="font-mono text-xs">{r.type}</span>
                        <div className="flex gap-6 text-xs text-muted-foreground">
                          <span>n={r.sample_size?.toLocaleString()}</span>
                          {r.validation_accuracy != null && <span className="text-green-400">{r.validation_accuracy}% val acc</span>}
                          <span>updated {r.last_updated?.slice(0, 16)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className="text-xs text-muted-foreground text-center pb-8">
              Report generated {new Date(report.generated_at).toLocaleString()} · Auto-regenerates every 2h · <code>node farm/scripts/live-stats.mjs</code> for instant CLI stats
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
