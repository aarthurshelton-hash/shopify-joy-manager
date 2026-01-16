import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, TrendingUp, Github, Loader2, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';

interface FamousRepo {
  name: string;
  url: string;
  expectedOutcome: 'success' | 'failure' | 'uncertain';
  description: string;
  category: string;
}

const FAMOUS_REPOS: FamousRepo[] = [
  {
    name: 'facebook/react',
    url: 'https://github.com/facebook/react',
    expectedOutcome: 'success',
    description: 'The library that powers modern web development',
    category: 'Framework',
  },
  {
    name: 'microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    expectedOutcome: 'success',
    description: 'Most popular code editor in the world',
    category: 'Developer Tool',
  },
  {
    name: 'torvalds/linux',
    url: 'https://github.com/torvalds/linux',
    expectedOutcome: 'success',
    description: 'The kernel powering billions of devices',
    category: 'Operating System',
  },
  {
    name: 'vercel/next.js',
    url: 'https://github.com/vercel/next.js',
    expectedOutcome: 'success',
    description: 'React framework for production',
    category: 'Framework',
  },
  {
    name: 'denoland/deno',
    url: 'https://github.com/denoland/deno',
    expectedOutcome: 'success',
    description: 'Modern runtime for JavaScript and TypeScript',
    category: 'Runtime',
  },
];

interface PredictionResult {
  repo: string;
  predictedOutcome: string;
  expectedOutcome: string;
  archetype: string;
  confidence: number;
  correct: boolean;
}

export function ProvenPredictions() {
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const { analyzeRepository } = useCodeAnalysis();

  const analyzeRepo = async (repo: FamousRepo) => {
    setAnalyzing(repo.name);
    try {
      const result = await analyzeRepository(repo.url);
      if (result) {
        const predictedSuccess = result.prediction.predictedOutcome === 'success';
        const expectedSuccess = repo.expectedOutcome === 'success';
        
        setResults(prev => [...prev.filter(r => r.repo !== repo.name), {
          repo: repo.name,
          predictedOutcome: result.prediction.predictedOutcome,
          expectedOutcome: repo.expectedOutcome,
          archetype: result.archetype,
          confidence: result.prediction.confidence,
          correct: predictedSuccess === expectedSuccess,
        }]);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(null);
    }
  };

  const accuracyRate = results.length > 0 
    ? Math.round((results.filter(r => r.correct).length / results.length) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-4">
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-medium">Prove It Works</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Test Against Famous Repositories</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Analyze world-renowned open source projects. If En Pensent correctly predicts 
          React and Linux as successes, you have empirical proof the system works.
        </p>
      </div>

      {accuracyRate !== null && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 p-6 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 text-center"
        >
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            {accuracyRate}%
          </div>
          <div className="text-sm text-muted-foreground">
            Prediction Accuracy ({results.filter(r => r.correct).length}/{results.length} correct)
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FAMOUS_REPOS.map((repo) => {
          const result = results.find(r => r.repo === repo.name);
          const isAnalyzing = analyzing === repo.name;

          return (
            <Card key={repo.name} className="relative overflow-hidden">
              {result && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  result.correct ? 'bg-green-500' : 'bg-red-500'
                }`} />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {repo.category}
                  </Badge>
                  {result && (
                    result.correct 
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  {repo.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {repo.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Archetype:</span>
                      <span className="font-medium">{result.archetype.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Predicted:</span>
                      <span className={`font-medium ${
                        result.predictedOutcome === 'success' ? 'text-green-500' : 'text-amber-500'
                      }`}>
                        {result.predictedOutcome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => analyzeRepo(repo)} 
                    disabled={isAnalyzing}
                    className="w-full"
                    size="sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Test Prediction
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Each successful prediction strengthens the case for En Pensent's value.
          <br />
          <span className="font-medium">100% accuracy on famous repos = undeniable proof.</span>
        </p>
      </div>
    </motion.div>
  );
}
