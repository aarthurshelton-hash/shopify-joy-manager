import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Shield, Zap, Users, DollarSign, Target, Play, Copy, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TractionDashboard from '@/components/investor/TractionDashboard';
import CompetitiveMoatVisual from '@/components/investor/CompetitiveMoatVisual';
import DemoReelScript from '@/components/investor/DemoReelScript';
import { useState } from 'react';

export default function InvestorPortal() {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('invest@enpensent.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

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
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-lg">Investor Portal</h1>
                <p className="text-xs text-muted-foreground">En Pensent™ Investment Opportunity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyEmail}>
                {emailCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {emailCopied ? 'Copied!' : 'Request Deck'}
              </Button>
              <Link to="/code-analysis">
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Try Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Seeking Pre-Seed / Seed Investment</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The <span className="text-primary">Pattern Recognition</span> Revolution
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            En Pensent is building the universal pattern recognition layer for all sequential data—
            starting with chess, expanding to code, and ultimately transforming every industry.
          </p>

          {/* One-liner pitch */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <p className="text-lg font-medium">
                "We're building <span className="text-primary">Shazam for patterns</span>—
                point it at anything sequential (chess games, code repos, medical data), 
                and it instantly recognizes the pattern, predicts the outcome, and recommends next steps."
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Quick Stats Row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <QuickStat icon={<TrendingUp />} label="TAM" value="$47B+" subtext="Pattern recognition market" />
          <QuickStat icon={<Shield />} label="Moat" value="Patent Pending" subtext="Temporal Signature™" />
          <QuickStat icon={<Zap />} label="Status" value="Live Product" subtext="2 domains active" />
          <QuickStat icon={<Users />} label="Traction" value="Growing" subtext="See metrics below" />
        </motion.section>

        {/* Traction Dashboard */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Live Traction Dashboard
          </h2>
          <TractionDashboard />
        </section>

        {/* Competitive Moat */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Competitive Moat & Defensibility
          </h2>
          <CompetitiveMoatVisual />
        </section>

        {/* Demo Reel / Talking Points */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            Demo Script & Talking Points
          </h2>
          <DemoReelScript />
        </section>

        {/* The Ask */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <DollarSign className="h-6 w-6" />
                Investment Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">$500K</p>
                  <p className="text-sm text-muted-foreground">Target Raise</p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="text-3xl font-bold">18 mo</p>
                  <p className="text-sm text-muted-foreground">Runway</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Use of Funds:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    40% - Engineering (scale pattern recognition engine)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/80" />
                    30% - Data acquisition (expand pattern library)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                    20% - Go-to-market (chess + developer communities)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                    10% - Operations & legal (patents, compliance)
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button className="flex-1" size="lg" onClick={copyEmail}>
                  {emailCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Request Full Deck
                </Button>
                <Link to="/code-analysis" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Experience the Product
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Links to other materials */}
        <section className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link to="/academic-paper">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📄</div>
                <h3 className="font-semibold">Academic Paper</h3>
                <p className="text-sm text-muted-foreground">arXiv-ready research</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/sdk-docs">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="font-semibold">SDK Documentation</h3>
                <p className="text-sm text-muted-foreground">Developer integration</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/why-this-matters">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">💡</div>
                <h3 className="font-semibold">Why This Matters</h3>
                <p className="text-sm text-muted-foreground">Simple explanations</p>
              </CardContent>
            </Card>
          </Link>
        </section>
      </main>
    </div>
  );
}

function QuickStat({ 
  icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtext: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-2">
          {icon}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}
