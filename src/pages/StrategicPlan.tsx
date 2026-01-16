import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Target, DollarSign, Users, Shield, Rocket, 
  TrendingUp, Zap, Globe, Cpu, Database, Brain,
  CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronRight,
  Download, Share2, Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const StrategicPlan: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-primary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
                CONFIDENTIAL - INTERNAL STRATEGY DOCUMENT
              </Badge>
              <h1 className="text-4xl font-bold mb-2">En Pensent Strategic Plan</h1>
              <p className="text-xl text-muted-foreground">
                Universal Temporal Pattern Recognition Platform
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Prepared for: Alec Arthur Shelton "The Artist" - Inventor & CEO
              </p>
              <p className="text-sm text-muted-foreground">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-400">3</div>
              <div className="text-sm text-muted-foreground">Active Domains</div>
              <div className="text-xs text-green-400">Chess • Code • Finance</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-400">5</div>
              <div className="text-sm text-muted-foreground">Revenue Streams</div>
              <div className="text-xs text-blue-400">Ready to activate</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-400">Patent Pending</div>
              <div className="text-sm text-muted-foreground">IP Status</div>
              <div className="text-xs text-purple-400">Full documentation ready</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-400">∞</div>
              <div className="text-sm text-muted-foreground">Domain Potential</div>
              <div className="text-xs text-yellow-400">Universal applicability</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="print:block">
          <TabsList className="w-full justify-start overflow-x-auto print:hidden">
            <TabsTrigger value="overview">Executive Overview</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="execution">Execution Plan</TabsTrigger>
            <TabsTrigger value="risks">Risks & Mitigation</TabsTrigger>
          </TabsList>

          {/* Executive Overview */}
          <TabsContent value="overview" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-primary mt-0">The One-Line Pitch</h3>
                  <p className="text-lg mb-0">
                    En Pensent extracts temporal DNA from any sequential data—chess games, codebases, 
                    market ticks—to predict outcomes before they happen.
                  </p>
                </div>

                <h3>What We've Built</h3>
                <p>
                  A universal pattern recognition engine that treats <strong>time as a fingerprint</strong>. 
                  Every system that evolves over time leaves behind a signature—we read it, match it to 
                  known archetypes, and predict what happens next.
                </p>

                <h3>Why It Matters</h3>
                <ul>
                  <li><strong>Chess Domain (Proven):</strong> Color Flow™ visualizations turn game data into art and analytics</li>
                  <li><strong>Code Domain (Built):</strong> Repository pattern analysis predicts project success/failure</li>
                  <li><strong>Finance Domain (Active):</strong> Real-time market prediction with self-evolving accuracy tracking</li>
                  <li><strong>Future Domains:</strong> Microchips, network infrastructure, biological systems, supply chains</li>
                </ul>

                <h3>Current Status</h3>
                <div className="grid md:grid-cols-3 gap-4 not-prose">
                  <div className="bg-card/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">Complete</span>
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Core SDK (v1.1.0)</li>
                      <li>• Chess visualization engine</li>
                      <li>• Code analysis system</li>
                      <li>• Market prediction engine</li>
                      <li>• 24/7 learning infrastructure</li>
                      <li>• Patent documentation</li>
                      <li>• Stripe integration</li>
                    </ul>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">In Progress</span>
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Accuracy validation (tracking)</li>
                      <li>• User acquisition</li>
                      <li>• Marketplace traction</li>
                      <li>• Premium subscriptions</li>
                    </ul>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Next Phase</span>
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Live trading validation</li>
                      <li>• API licensing deals</li>
                      <li>• Enterprise partnerships</li>
                      <li>• Patent filing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* The Founder Reality */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <Users className="w-5 h-5" />
                  The Founder Reality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You are one person with a groundbreaking platform. Here's how to maximize impact while protecting yourself:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-yellow-400">Immediate Priorities (Solo)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Keep 24/7 learning running—data compounds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Document everything (you're doing this now)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Use your own system—trade with simulated money, build track record</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>File provisional patent ($2,000-3,000)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-yellow-400">First Hire Priorities</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-mono">1.</span>
                        <span>Operations/Marketing person (free you to build)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-mono">2.</span>
                        <span>Legal counsel (IP protection, contracts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-mono">3.</span>
                        <span>Backend engineer (scale the 24/7 system)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technology Deep Dive */}
          <TabsContent value="technology" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Core Technology: Universal Temporal Pattern Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">The Breakthrough</h3>
                  <p className="text-muted-foreground">
                    Traditional AI trains on static snapshots. En Pensent treats <strong>time itself as the feature</strong>. 
                    Any sequence of events—chess moves, code commits, price ticks—contains a temporal signature 
                    that reveals its archetype and predicts its trajectory.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" />
                      SDK Architecture
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-card/50 rounded">
                        <span>signatureExtractor</span>
                        <Badge variant="outline">Core</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-card/50 rounded">
                        <span>archetypeResolver</span>
                        <Badge variant="outline">Core</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-card/50 rounded">
                        <span>trajectoryPredictor</span>
                        <Badge variant="outline">Core</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-card/50 rounded">
                        <span>visualizationPrimitives</span>
                        <Badge variant="outline">Core</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-card/50 rounded">
                        <span>selfEvolvingSystem</span>
                        <Badge variant="outline">Adaptive</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Domain Adapters
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
                        <span>Chess (Color Flow™)</span>
                        <Badge className="bg-green-500/20 text-green-400">Production</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
                        <span>Code Analysis</span>
                        <Badge className="bg-green-500/20 text-green-400">Production</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                        <span>Finance/Trading</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400">Beta</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-500/10 rounded border border-blue-500/20">
                        <span>Hardware/IoT</span>
                        <Badge className="bg-blue-500/20 text-blue-400">Planned</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-purple-500/10 rounded border border-purple-500/20">
                        <span>Network/Telecom</span>
                        <Badge className="bg-purple-500/20 text-purple-400">Planned</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Self-Evolving Learning System</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    The 24/7 background collector continuously:
                  </p>
                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="text-xs font-medium">Collects Ticks</div>
                      <div className="text-xs text-muted-foreground">16 futures contracts</div>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <div className="text-xs font-medium">Resolves Predictions</div>
                      <div className="text-xs text-muted-foreground">4-level accuracy</div>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">🔗</div>
                      <div className="text-xs font-medium">Calculates Correlations</div>
                      <div className="text-xs text-muted-foreground">Cross-market signals</div>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">🧬</div>
                      <div className="text-xs font-medium">Evolves Genes</div>
                      <div className="text-xs text-muted-foreground">Adaptive parameters</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IP Protection */}
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Shield className="w-5 h-5" />
                  Intellectual Property Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Documentation Complete</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Patent-ready technical specification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        arXiv-ready academic paper
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        SDK documentation (v1.1.0)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Inventor attribution throughout
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Active Protection</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        AI crawler blocking (robots.txt)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        DevTools detection
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        JSON-LD structured IP claims
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Provisional patent (action required)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Markets */}
          <TabsContent value="markets" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Market Opportunity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Markets */}
                  <div>
                    <h3 className="font-semibold mb-4">Active Markets</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-card/50 rounded-lg p-4 border border-green-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">Chess Analytics</h4>
                          <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TAM</span>
                            <span>$500M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Our Wedge</span>
                            <span>Art + Analytics</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue Model</span>
                            <span>Sub + Print + NFT</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card/50 rounded-lg p-4 border border-green-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">Code Analysis</h4>
                          <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TAM</span>
                            <span>$15B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Our Wedge</span>
                            <span>Predictive health</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue Model</span>
                            <span>API + Enterprise</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card/50 rounded-lg p-4 border border-yellow-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">Trading Signals</h4>
                          <Badge className="bg-yellow-500/20 text-yellow-400">Beta</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TAM</span>
                            <span>$40B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Our Wedge</span>
                            <span>Cross-domain edge</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Revenue Model</span>
                            <span>Sub + Performance</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Future Markets */}
                  <div>
                    <h3 className="font-semibold mb-4">Future Markets (Year 2+)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-card/50 rounded-lg p-4 border border-blue-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Semiconductor/IoT
                          </h4>
                          <Badge className="bg-blue-500/20 text-blue-400">$600B TAM</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Predictive maintenance, yield optimization, failure pattern detection in chip manufacturing and IoT device fleets.
                        </p>
                        <div className="text-xs text-blue-400">
                          Entry: Partner with chip manufacturer for pilot
                        </div>
                      </div>

                      <div className="bg-card/50 rounded-lg p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Network Infrastructure
                          </h4>
                          <Badge className="bg-purple-500/20 text-purple-400">$200B TAM</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Traffic prediction, congestion prevention, security anomaly detection for telcos and satellite operators.
                        </p>
                        <div className="text-xs text-purple-400">
                          Entry: Partner with CDN or satellite company
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Moat */}
            <Card>
              <CardHeader>
                <CardTitle>Competitive Moat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-400">What We Have</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Universal abstraction:</strong> Same engine, any domain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Compounding data:</strong> 24/7 learning creates barrier</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Cross-domain insight:</strong> Chess patterns inform trading</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>First mover:</strong> Novel approach, patent-ready</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-yellow-400">Competitive Threats</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span><strong>Big Tech:</strong> Could build similar, but lack domain depth</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span><strong>Quant funds:</strong> Have data, but domain-siloed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span><strong>Chess.com/Lichess:</strong> Could copy visuals, not engine</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials */}
          <TabsContent value="financials" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Revenue Model & Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Streams */}
                  <div>
                    <h3 className="font-semibold mb-4">Revenue Streams (Built & Ready)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-primary/20">
                            <th className="text-left py-2">Stream</th>
                            <th className="text-left py-2">Model</th>
                            <th className="text-right py-2">Price Point</th>
                            <th className="text-right py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/20">
                          <tr>
                            <td className="py-2">Premium Subscription</td>
                            <td className="py-2">Monthly recurring</td>
                            <td className="py-2 text-right">$9.99/mo</td>
                            <td className="py-2 text-right"><Badge className="bg-green-500/20 text-green-400">Live</Badge></td>
                          </tr>
                          <tr>
                            <td className="py-2">Print-on-Demand</td>
                            <td className="py-2">Per order (Printify)</td>
                            <td className="py-2 text-right">$29-99/item</td>
                            <td className="py-2 text-right"><Badge className="bg-green-500/20 text-green-400">Live</Badge></td>
                          </tr>
                          <tr>
                            <td className="py-2">Vision Marketplace</td>
                            <td className="py-2">10% transaction fee</td>
                            <td className="py-2 text-right">Variable</td>
                            <td className="py-2 text-right"><Badge className="bg-green-500/20 text-green-400">Live</Badge></td>
                          </tr>
                          <tr>
                            <td className="py-2">Code Analysis API</td>
                            <td className="py-2">Per analysis + sub</td>
                            <td className="py-2 text-right">$1.99-49/mo</td>
                            <td className="py-2 text-right"><Badge className="bg-yellow-500/20 text-yellow-400">Beta</Badge></td>
                          </tr>
                          <tr>
                            <td className="py-2">Trading Signals</td>
                            <td className="py-2">Premium tier</td>
                            <td className="py-2 text-right">$49-299/mo</td>
                            <td className="py-2 text-right"><Badge className="bg-yellow-500/20 text-yellow-400">Beta</Badge></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Projections */}
                  <div>
                    <h3 className="font-semibold mb-4">Conservative Revenue Projections</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-card/50 rounded-lg p-4 border text-center">
                        <div className="text-sm text-muted-foreground mb-1">Year 1</div>
                        <div className="text-2xl font-bold text-primary">$50K - $150K</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          500-1000 premium users<br />
                          Print & marketplace traction
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg p-4 border text-center">
                        <div className="text-sm text-muted-foreground mb-1">Year 2</div>
                        <div className="text-2xl font-bold text-primary">$300K - $800K</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Trading signals revenue<br />
                          First API licensing deals
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg p-4 border text-center">
                        <div className="text-sm text-muted-foreground mb-1">Year 3</div>
                        <div className="text-2xl font-bold text-primary">$1M - $3M</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Enterprise partnerships<br />
                          New domain launches
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Funding Requirements */}
                  <div>
                    <h3 className="font-semibold mb-4">Funding Requirements (Optional Path)</h3>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        The platform is built and can generate revenue bootstrapped. However, funding accelerates:
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-semibold text-blue-400 mb-2">$50K - Seed/Angel</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Patent filing</li>
                            <li>• 6 months runway</li>
                            <li>• Marketing push</li>
                            <li>• Legal setup</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-blue-400 mb-2">$500K - Pre-Seed</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Team of 3-4</li>
                            <li>• Enterprise sales</li>
                            <li>• Infrastructure scale</li>
                            <li>• New domain R&D</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unit Economics */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Economics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Subscription LTV</div>
                    <div className="text-2xl font-bold">$60-120</div>
                    <div className="text-xs text-muted-foreground">6-12 month avg retention</div>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Print Margin</div>
                    <div className="text-2xl font-bold">40-60%</div>
                    <div className="text-xs text-muted-foreground">After Printify costs</div>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">API Gross Margin</div>
                    <div className="text-2xl font-bold">80%+</div>
                    <div className="text-xs text-muted-foreground">Pure software</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Execution Plan */}
          <TabsContent value="execution" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  90-Day Execution Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Month 1 */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-green-400 mb-3">Month 1: Foundation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">File provisional patent ($2-3K)</span>
                        <Badge variant="outline" className="ml-auto">Critical</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Run 24/7 collector for 30 days—build accuracy data</span>
                        <Badge variant="outline" className="ml-auto">In Progress</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Trade simulated $1K/day—document performance</span>
                        <Badge variant="outline" className="ml-auto">Start Now</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Create landing page for each use case</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Set up LLC or Corp (state filing)</span>
                      </div>
                    </div>
                  </div>

                  {/* Month 2 */}
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="font-semibold text-yellow-400 mb-3">Month 2: Validation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Publish accuracy report from 30-day data</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Launch on Product Hunt / HackerNews</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">First 100 premium subscribers</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Outreach to 10 potential enterprise partners</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Publish arXiv paper (builds credibility)</span>
                      </div>
                    </div>
                  </div>

                  {/* Month 3 */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-blue-400 mb-3">Month 3: Scale</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Launch trading signals tier (if accuracy validates)</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">First code analysis API customer</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Evaluate funding vs bootstrap decision</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-card/50 rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">First hire if revenue supports</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Rhythm */}
            <Card>
              <CardHeader>
                <CardTitle>Sustainable Solo Founder Rhythm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Daily (30 min)</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Check 24/7 system health</li>
                      <li>• Review overnight accuracy metrics</li>
                      <li>• One simulated trading session</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Weekly (2-3 hours)</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Generate and review weekly report</li>
                      <li>• One feature improvement</li>
                      <li>• One outreach/marketing effort</li>
                      <li>• Update this strategic document</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risks */}
          <TabsContent value="risks" className="space-y-6 print:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Risk Analysis & Mitigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      risk: "Prediction accuracy doesn't validate",
                      impact: "High",
                      likelihood: "Medium",
                      mitigation: "Focus on chess/code domains first (already validated). Trading is upside, not core business."
                    },
                    {
                      risk: "Someone copies the approach",
                      impact: "Medium",
                      likelihood: "Medium", 
                      mitigation: "Patent filing. Data moat compounds daily. Cross-domain insight is hard to replicate."
                    },
                    {
                      risk: "Burnout as solo founder",
                      impact: "High",
                      likelihood: "Medium",
                      mitigation: "Automate everything possible. 24/7 system runs without you. Set boundaries."
                    },
                    {
                      risk: "Legal challenges (trading claims)",
                      impact: "Medium",
                      likelihood: "Low",
                      mitigation: "Proper disclaimers. Never claim guaranteed returns. Educational framing."
                    },
                    {
                      risk: "Technical scaling issues",
                      impact: "Medium",
                      likelihood: "Low",
                      mitigation: "Supabase handles scale. Edge functions are stateless. Architecture is solid."
                    }
                  ].map((item, i) => (
                    <div key={i} className="bg-card/50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.risk}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={
                            item.impact === 'High' ? 'border-red-500 text-red-400' :
                            item.impact === 'Medium' ? 'border-yellow-500 text-yellow-400' :
                            'border-green-500 text-green-400'
                          }>
                            {item.impact} Impact
                          </Badge>
                          <Badge variant="outline" className={
                            item.likelihood === 'High' ? 'border-red-500 text-red-400' :
                            item.likelihood === 'Medium' ? 'border-yellow-500 text-yellow-400' :
                            'border-green-500 text-green-400'
                          }>
                            {item.likelihood} Likelihood
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Mitigation:</strong> {item.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Line */}
            <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/30">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">The Bottom Line</h3>
                <p className="text-muted-foreground mb-4">
                  You've built something genuinely novel—a universal pattern engine that works across domains. 
                  The technology is real, the IP is documented, and the revenue paths are ready.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>As a solo founder, your constraints are time and trust.</strong> The 24/7 learning system 
                  buys you time by working while you sleep. This document helps you share the vision with 
                  people you can trust.
                </p>
                <div className="flex gap-4 mt-6">
                  <div className="flex-1 text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">1</div>
                    <div className="text-sm">Focus on accuracy validation</div>
                  </div>
                  <div className="flex-1 text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">2</div>
                    <div className="text-sm">Protect the IP</div>
                  </div>
                  <div className="flex-1 text-center p-4 bg-card/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm">Let the data compound</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default StrategicPlan;
