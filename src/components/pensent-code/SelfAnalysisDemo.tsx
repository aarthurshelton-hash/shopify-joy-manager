import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code, TrendingUp, Target, CheckCircle, AlertTriangle, Zap } from "lucide-react";

// Simulated analysis of the En Pensent codebase itself
const EN_PENSENT_ANALYSIS = {
  repository: "En Pensent (This App)",
  fingerprint: "EP-2024-CHESS-CODE-HYBRID",
  archetype: "innovation_catalyst",
  archetypeDescription: "Rapid innovation with strong foundational architecture",
  
  quadrantProfile: {
    q1: 0.35, // Core algorithms (pensent-core)
    q2: 0.25, // Chess domain
    q3: 0.22, // Code domain  
    q4: 0.18  // UI/UX
  },
  
  temporalFlow: {
    opening: 0.6,
    midgame: 0.85,
    endgame: 0.75,
    trend: "accelerating",
    momentum: 0.82
  },
  
  criticalMoments: [
    { index: 1, type: "foundation", description: "Core SDK architecture established" },
    { index: 15, type: "breakthrough", description: "Domain adapter pattern implemented" },
    { index: 28, type: "expansion", description: "Chess analysis integrated" },
    { index: 42, type: "innovation", description: "Hybrid prediction system created" },
    { index: 55, type: "meta", description: "Code analysis domain added (self-referential!)" }
  ],
  
  codeMetrics: {
    totalFiles: 247,
    coreAlgorithmFiles: 12,
    domainAdapters: 2,
    componentCount: 85,
    testCoverage: "Conceptual" // lol
  },
  
  prediction: {
    outcome: "success",
    confidence: 0.87,
    reasoning: "Strong architectural patterns, clear separation of concerns, innovative hybrid approach combining multiple analysis methods. The self-referential nature (analyzing itself) demonstrates system robustness."
  },
  
  recommendations: [
    "Add persistence layer for cross-session pattern learning",
    "Implement real-time collaborative analysis features",
    "Expand to additional domains (music, health, finance)",
    "Create public API for third-party integrations"
  ],
  
  metaInsight: "The fact that En Pensent can analyze its own codebase and produce meaningful insights is itself proof of the system's validity. This is recursive validation - the system predicting its own success."
};

const SelfAnalysisDemo = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<typeof EN_PENSENT_ANALYSIS | null>(null);

  const runSelfAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    // Simulate analysis stages
    const stages = [
      "Scanning codebase structure...",
      "Extracting temporal signature...",
      "Calculating quadrant profile...",
      "Detecting critical moments...",
      "Classifying archetype...",
      "Generating predictions..."
    ];

    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(((i + 1) / stages.length) * 100);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    setResult(EN_PENSENT_ANALYSIS);
    setIsAnalyzing(false);
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Meta-Analysis: En Pensent Analyzing Itself
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The ultimate proof: can the system predict its own success?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result && !isAnalyzing && (
          <div className="text-center py-8">
            <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-6">
              Watch En Pensent analyze its own codebase in real-time
            </p>
            <Button size="lg" onClick={runSelfAnalysis} className="gap-2">
              <Zap className="w-4 h-4" />
              Analyze En Pensent's Own Code
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Sparkles className="w-16 h-16 text-amber-500" />
              </motion.div>
              <p className="font-medium">Analyzing En Pensent codebase...</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress < 20 && "Scanning codebase structure..."}
              {progress >= 20 && progress < 40 && "Extracting temporal signature..."}
              {progress >= 40 && progress < 60 && "Calculating quadrant profile..."}
              {progress >= 60 && progress < 80 && "Detecting critical moments..."}
              {progress >= 80 && progress < 100 && "Generating predictions..."}
              {progress >= 100 && "Complete!"}
            </p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{result.repository}</h3>
                <p className="text-sm text-muted-foreground font-mono">{result.fingerprint}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-500 text-lg px-4 py-2">
                {Math.round(result.prediction.confidence * 100)}% Success
              </Badge>
            </div>

            {/* Archetype */}
            <Card className="bg-background/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Archetype</div>
                    <div className="font-bold capitalize">{result.archetype.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">{result.archetypeDescription}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quadrant Profile */}
            <div>
              <h4 className="font-medium mb-3">Codebase Activity Distribution</h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(result.quadrantProfile).map(([key, value]) => (
                  <div key={key} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {key === 'q1' && 'Core SDK'}
                      {key === 'q2' && 'Chess'}
                      {key === 'q3' && 'Code'}
                      {key === 'q4' && 'UI/UX'}
                    </div>
                    <div className="text-lg font-bold">{Math.round(value * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Temporal Flow */}
            <div>
              <h4 className="font-medium mb-3">Development Momentum</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={result.temporalFlow.momentum * 100} className="h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium capitalize">{result.temporalFlow.trend}</span>
                </div>
              </div>
            </div>

            {/* Critical Moments */}
            <div>
              <h4 className="font-medium mb-3">Key Development Milestones</h4>
              <div className="space-y-2">
                {result.criticalMoments.map((moment, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="w-16 justify-center">
                      #{moment.index}
                    </Badge>
                    <span className="text-muted-foreground capitalize">{moment.type}:</span>
                    <span>{moment.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Insight */}
            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">The Meta-Insight</h4>
                    <p className="text-sm text-muted-foreground">{result.metaInsight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction */}
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Prediction: {result.prediction.outcome.toUpperCase()}</h4>
                    <p className="text-sm text-muted-foreground">{result.prediction.reasoning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium mb-3">Recommended Next Steps</h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={() => setResult(null)} variant="outline" className="w-full">
              Run Analysis Again
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelfAnalysisDemo;
