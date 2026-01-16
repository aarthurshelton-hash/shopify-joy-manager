import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RepositoryAnalyzer } from '@/components/pensent-code/RepositoryAnalyzer';
import { AnalysisResults } from '@/components/pensent-code/AnalysisResults';
import { PatentPendingBadge } from '@/components/pensent-code/PatentPendingBadge';
import { InventorCredits } from '@/components/pensent-code/InventorCredits';
import { ProvenPredictions } from '@/components/pensent-code/ProvenPredictions';
import { PricingSection } from '@/components/pensent-code/PricingSection';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, GitBranch, Sparkles } from 'lucide-react';
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
            {result && (
              <Button variant="outline" onClick={clearResult}>
                Analyze Another
              </Button>
            )}
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

            {/* How It Works */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: 1, title: 'Input Repository', desc: 'Enter any GitHub repo URL' },
                  { step: 2, title: 'Extract Signature', desc: 'Analyze commit patterns' },
                  { step: 3, title: 'Match Archetypes', desc: 'Compare to known patterns' },
                  { step: 4, title: 'Predict & Guide', desc: 'Get insights & recommendations' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
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
