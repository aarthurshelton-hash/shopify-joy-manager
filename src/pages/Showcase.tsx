import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Trophy, Brain, Target, Zap, TrendingUp, Database, Sparkles } from 'lucide-react';
import { InventorCredits } from '@/components/pensent-code/InventorCredits';

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  demo?: React.ReactNode;
  stats?: { label: string; value: string }[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    title: 'En Pensent™ Universal Pattern Recognition',
    subtitle: 'Patent-Pending Technology',
    description: 'A revolutionary system that extracts "temporal signatures" from any sequential data—chess games, code commits, market ticks—to predict outcomes before they happen.',
    icon: <Brain className="h-12 w-12" />,
    stats: [
      { label: 'Domains Unified', value: '3+' },
      { label: 'Pattern Types', value: '12' },
      { label: 'Prediction Horizon', value: '80 moves' }
    ]
  },
  {
    id: 'chess',
    title: 'Chess: Color Flow™ Analysis',
    subtitle: 'Strategic Pattern Recognition',
    description: 'Unlike Stockfish which calculates positions, En Pensent identifies "game arcs"—strategic trajectories that predict outcomes from move patterns alone.',
    icon: <Trophy className="h-12 w-12" />,
    stats: [
      { label: 'Lichess/Chess.com', value: 'Imports' },
      { label: 'Archetypes', value: '12+' },
      { label: 'Accuracy', value: '73%+' }
    ]
  },
  {
    id: 'code',
    title: 'Code: Repository DNA',
    subtitle: 'Software Project Health Analysis',
    description: 'The same signature extraction applied to git commits reveals project archetypes, predicting technical debt, team dynamics, and delivery outcomes.',
    icon: <Database className="h-12 w-12" />,
    stats: [
      { label: 'Commit Types', value: '8' },
      { label: 'Health Metrics', value: '15+' },
      { label: 'Prediction', value: 'Success/Fail' }
    ]
  },
  {
    id: 'finance',
    title: 'Finance: Self-Evolving Predictions',
    subtitle: 'Market Pattern Learning',
    description: 'Market tick data processed through the same universal engine, with genetic algorithms that evolve prediction accuracy over time.',
    icon: <TrendingUp className="h-12 w-12" />,
    stats: [
      { label: 'vs Random', value: '+12.3%' },
      { label: 'vs Trend', value: '+7.8%' },
      { label: 'Statistical', value: 'p < 0.05' }
    ]
  },
  {
    id: 'validation',
    title: 'Proven Edge: Statistical Validation',
    subtitle: 'Beating Baselines with Significance',
    description: 'Every prediction is validated against random (50/50) and trend-following baselines with p-values proving statistical significance.',
    icon: <Target className="h-12 w-12" />,
    stats: [
      { label: 'Sample Size', value: '1,000+' },
      { label: 'Confidence', value: '95%' },
      { label: 'Edge Proven', value: '✓' }
    ]
  },
  {
    id: 'sync',
    title: 'Universal Heartbeat',
    subtitle: 'Synchronized Cross-Domain Analysis',
    description: 'All domains pulse together through a Universal Heartbeat—when chess patterns align with code signatures and market signals, prediction confidence multiplies.',
    icon: <Zap className="h-12 w-12" />,
    stats: [
      { label: 'Sync Rate', value: '30s' },
      { label: 'Domains', value: 'All' },
      { label: 'Boost', value: 'Up to 2x' }
    ]
  },
  {
    id: 'future',
    title: 'The Future of Pattern Recognition',
    subtitle: 'Expanding the Universal Engine',
    description: 'Medical diagnostics, sports analytics, creative composition—any domain with temporal sequences can be analyzed with En Pensent technology.',
    icon: <Sparkles className="h-12 w-12" />,
    stats: [
      { label: 'Potential', value: 'Unlimited' },
      { label: 'Patents', value: 'Pending' },
      { label: 'Status', value: 'Active' }
    ]
  }
];

export default function Showcase() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-card via-background to-primary/5">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                </div>
                <p className="text-sm font-display uppercase tracking-wider text-primary mb-2">
                  {step.subtitle}
                </p>
                <CardTitle className="text-3xl md:text-4xl font-display">
                  {step.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
                  {step.description}
                </p>

                {/* Stats */}
                {step.stats && (
                  <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                    {step.stats.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <div className="text-2xl font-bold text-primary font-display">
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Demo Area */}
                {step.demo && (
                  <div className="p-6 rounded-lg bg-card border border-border">
                    {step.demo}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex gap-2">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary' : 'bg-muted hover:bg-primary/50'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextStep}
            disabled={currentStep === TOUR_STEPS.length - 1}
            className="gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Inventor Credits */}
        <div className="mt-12">
          <InventorCredits />
        </div>
      </main>

      <Footer />
    </div>
  );
}
