import { motion } from 'framer-motion';
import { RepositoryAnalyzer } from '@/components/pensent-code/RepositoryAnalyzer';
import { AnalysisResults } from '@/components/pensent-code/AnalysisResults';
import { PatentPendingBadge } from '@/components/pensent-code/PatentPendingBadge';
import { InventorCredits } from '@/components/pensent-code/InventorCredits';
import { ProvenPredictions } from '@/components/pensent-code/ProvenPredictions';
import { PricingSection } from '@/components/pensent-code/PricingSection';
import HowItWorksVisual from '@/components/pensent-code/HowItWorksVisual';
import SelfAnalysisDemo from '@/components/pensent-code/SelfAnalysisDemo';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, GitBranch, Sparkles, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CodeAnalysis() {
  const { result, clearResult } = useCodeAnalysis();

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
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">En Pensent Code™</h1>
                  <p className="text-xs text-muted-foreground">Universal Pattern Recognition Engine</p>
                </div>
              </div>
              <PatentPendingBadge />
            </div>
            <div className="flex items-center gap-2">
              <Link to="/investor-portal">
                <Button variant="outline" size="sm" className="border-primary/50 text-primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Investor Portal
                </Button>
              </Link>
              <Link to="/why-this-matters">
                <Button variant="ghost" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Why This Matters
                </Button>
              </Link>
              {result && (
                <Button variant="outline" onClick={clearResult}>
                  Analyze Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Hero Section */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Universal Pattern Recognition • Patent Pending</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Predict Your Project's{' '}
                <span className="text-primary">Trajectory</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                Analyze any GitHub repository to discover its development archetype, 
                predict outcomes, and receive strategic recommendations.
              </p>

              <p className="text-sm text-muted-foreground/70">
                Powered by En Pensent™ Temporal Signature™ Technology
              </p>
            </div>

            {/* Analyzer Form */}
            <RepositoryAnalyzer />

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <FeatureCard
                icon={<GitBranch className="h-6 w-6" />}
                title="Pattern Recognition"
                description="Identify development archetypes from commit history patterns"
              />
              <FeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="Outcome Prediction"
                description="Predict project success based on historical trajectory analysis"
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title="Strategic Guidance"
                description="Receive actionable recommendations to improve your codebase"
              />
            </div>

            {/* How It Works Visual Diagram */}
            <HowItWorksVisual />

            {/* Self-Analysis Demo - Meta Proof */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">The Ultimate Proof: Self-Analysis</h2>
              <SelfAnalysisDemo />
            </div>

            {/* Proven Predictions - Build Credibility */}
            <ProvenPredictions />

            {/* Pricing Section */}
            <PricingSection />

            {/* Inventor Credits */}
            <InventorCredits />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnalysisResults result={result} />
          </motion.div>
        )}
      </main>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border bg-card/50 text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
