import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Book, Copy, Check, ExternalLink, Code, Layers, GitBranch, Brain, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SDKDocs() {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const { toast } = useToast();

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/code-analysis">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Book className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">En Pensent SDK</h1>
                  <p className="text-xs text-muted-foreground">Developer Documentation</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              <NavSection title="Getting Started">
                <NavLink href="#installation">Installation</NavLink>
                <NavLink href="#quick-start">Quick Start</NavLink>
                <NavLink href="#concepts">Core Concepts</NavLink>
              </NavSection>
              <NavSection title="Core API">
                <NavLink href="#create-engine">createPensentEngine</NavLink>
                <NavLink href="#extract-signature">extractSignature</NavLink>
                <NavLink href="#find-patterns">findSimilarPatterns</NavLink>
                <NavLink href="#predict-trajectory">predictTrajectory</NavLink>
              </NavSection>
              <NavSection title="Types">
                <NavLink href="#temporal-signature">TemporalSignature</NavLink>
                <NavLink href="#domain-adapter">DomainAdapter</NavLink>
                <NavLink href="#pattern-match">PatternMatch</NavLink>
              </NavSection>
              <NavSection title="Domains">
                <NavLink href="#code-domain">Code Analysis</NavLink>
                <NavLink href="#chess-domain">Chess Games</NavLink>
                <NavLink href="#custom-domain">Custom Domains</NavLink>
              </NavSection>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Hero */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">En Pensent Core SDK</h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Universal Temporal Pattern Recognition Engine for any sequential data domain.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge icon={<Code className="h-3 w-3" />} text="TypeScript" />
                  <Badge icon={<Layers className="h-3 w-3" />} text="Domain Agnostic" />
                  <Badge icon={<Brain className="h-3 w-3" />} text="Pattern Recognition" />
                  <Badge icon={<Sparkles className="h-3 w-3" />} text="Outcome Prediction" />
                </div>
              </div>

              {/* Installation */}
              <section id="installation" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Installation</h2>
                <CodeBlock
                  id="install"
                  code="npm install @enpensent/core"
                  language="bash"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'install'}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Or import directly from the source in your project.
                </p>
              </section>

              {/* Quick Start */}
              <section id="quick-start" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
                <CodeBlock
                  id="quickstart"
                  code={`import { createPensentEngine } from '@enpensent/core';
import { codeAdapter } from '@enpensent/code-adapter';

// Create engine for code analysis
const engine = createPensentEngine(codeAdapter);

// Extract signature from repository data
const signature = engine.extractSignature(repositoryData);

// Classify archetype
const archetype = engine.classifyArchetype(signature);
console.log(archetype); // "Methodical Architect"

// Find similar patterns
const matches = engine.findSimilarPatterns(signature, patternDatabase);

// Predict trajectory
const prediction = engine.predictTrajectory(
  signature, 
  matches, 
  currentPosition, 
  totalExpectedLength
);`}
                  language="typescript"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'quickstart'}
                />
              </section>

              {/* Core Concepts */}
              <section id="concepts" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Core Concepts</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <ConceptCard
                    title="Temporal Signature"
                    description="A compact representation capturing spatial distribution, temporal evolution, intensity, and critical moments of any sequential process."
                  />
                  <ConceptCard
                    title="Domain Adapter"
                    description="A pluggable interface that translates domain-specific data into universal signature components without modifying the core engine."
                  />
                  <ConceptCard
                    title="Archetype Classification"
                    description="Learned pattern categories that correspond to distinct strategic approaches and correlate with specific outcome probabilities."
                  />
                  <ConceptCard
                    title="Trajectory Prediction"
                    description="Forward projection based on pattern matching against historical data with similar signatures and known outcomes."
                  />
                </div>
              </section>

              {/* Core API */}
              <section id="create-engine" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">createPensentEngine</h2>
                <p className="text-muted-foreground mb-4">
                  Creates a new En Pensent engine instance configured for a specific domain.
                </p>
                <CodeBlock
                  id="create-engine-code"
                  code={`function createPensentEngine<TInput, TState>(
  adapter: DomainAdapter<TInput, TState>
): PensentEngine<TInput, TState>

// Returns engine with methods:
interface PensentEngine<TInput, TState> {
  domain: string;
  extractSignature(input: TInput): TemporalSignature;
  classifyArchetype(signature: TemporalSignature): string;
  findSimilarPatterns(signature: TemporalSignature, patterns: Pattern[]): PatternMatch[];
  predictTrajectory(signature: TemporalSignature, matches: PatternMatch[], current: number, total: number): TrajectoryPrediction;
  getArchetypes(): ArchetypeRegistry;
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number;
}`}
                  language="typescript"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'create-engine-code'}
                />
              </section>

              {/* Temporal Signature Type */}
              <section id="temporal-signature" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">TemporalSignature</h2>
                <p className="text-muted-foreground mb-4">
                  The core data structure representing a pattern's unique fingerprint.
                </p>
                <CodeBlock
                  id="temporal-sig"
                  code={`interface TemporalSignature {
  // Unique identifier for this signature
  fingerprint: string;
  
  // Spatial distribution across four quadrants
  quadrantProfile: {
    q1: number; // 0-1, upper-left activity
    q2: number; // 0-1, upper-right activity
    q3: number; // 0-1, lower-left activity
    q4: number; // 0-1, lower-right activity
  };
  
  // Temporal evolution characteristics
  temporalFlow: {
    opening: number;   // Activity level in first third
    midgame: number;   // Activity level in middle third
    endgame: number;   // Activity level in final third
    trend: 'stable' | 'accelerating' | 'declining' | 'volatile';
    momentum: number;  // Rate of change at end
  };
  
  // Classified pattern type
  archetype: string;
  
  // Overall activity intensity (0-1)
  intensity: number;
  
  // Key turning points
  criticalMoments: Array<{
    index: number;
    type: 'surge' | 'drop' | 'pivot' | 'breakthrough';
    description: string;
  }>;
  
  // Which force dominates
  dominantForce: 'primary' | 'secondary' | 'balanced';
  
  // Overall direction of flow
  flowDirection: 'forward' | 'lateral' | 'backward' | 'chaotic';
}`}
                  language="typescript"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'temporal-sig'}
                />
              </section>

              {/* Domain Adapter Interface */}
              <section id="domain-adapter" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">DomainAdapter Interface</h2>
                <p className="text-muted-foreground mb-4">
                  Implement this interface to add support for a new domain.
                </p>
                <CodeBlock
                  id="adapter-interface"
                  code={`interface DomainAdapter<TInput, TState> {
  // Domain identifier
  domain: string;
  
  // Convert raw input to state sequence
  parseInput(input: TInput): TState[];
  
  // Extract signature from states
  extractSignature(states: TState[]): TemporalSignature;
  
  // Classify into archetype
  classifyArchetype(signature: TemporalSignature): string;
  
  // Calculate similarity between signatures
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number;
  
  // Get available archetypes for this domain
  getArchetypeRegistry(): ArchetypeRegistry;
}`}
                  language="typescript"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'adapter-interface'}
                />
              </section>

              {/* Utility Functions */}
              <section id="utilities" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Utility Functions</h2>
                <Tabs defaultValue="signature" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="signature">Signature</TabsTrigger>
                    <TabsTrigger value="matching">Matching</TabsTrigger>
                    <TabsTrigger value="trajectory">Trajectory</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signature">
                    <CodeBlock
                      id="sig-utils"
                      code={`// Signature extraction utilities
import { 
  generateFingerprint,
  calculateQuadrantProfile,
  calculateTemporalFlow,
  detectCriticalMoments,
  calculateIntensity,
  determineDominantForce,
  determineFlowDirection,
  hashString
} from '@enpensent/core';

// Generate unique fingerprint
const fp = generateFingerprint(quadrant, temporal, archetype, intensity);

// Calculate quadrant distribution
const profile = calculateQuadrantProfile([
  { region: 'q1', weight: 0.3 },
  { region: 'q2', weight: 0.25 },
  // ...
]);

// Analyze temporal flow
const flow = calculateTemporalFlow(activityLevels);

// Detect critical moments
const moments = detectCriticalMoments(values, { threshold: 0.3 });`}
                      language="typescript"
                      onCopy={copyCode}
                      copied={copiedSnippet === 'sig-utils'}
                    />
                  </TabsContent>
                  <TabsContent value="matching">
                    <CodeBlock
                      id="match-utils"
                      code={`// Pattern matching utilities
import {
  calculateSignatureSimilarity,
  findSimilarPatterns,
  calculateOutcomeProbabilities,
  getMostLikelyOutcome,
  calculatePatternDiversity,
  calculateMatchConfidence
} from '@enpensent/core';

// Calculate similarity with custom weights
const similarity = calculateSignatureSimilarity(sigA, sigB, {
  archetype: 0.3,
  quadrant: 0.25,
  temporal: 0.25,
  intensity: 0.1,
  flow: 0.1
});

// Find similar patterns
const matches = findSimilarPatterns(targetSignature, patterns, {
  minSimilarity: 0.7,
  limit: 10
});

// Calculate outcome probabilities
const probs = calculateOutcomeProbabilities(matches);
// { success: 0.73, failure: 0.27 }`}
                      language="typescript"
                      onCopy={copyCode}
                      copied={copiedSnippet === 'match-utils'}
                    />
                  </TabsContent>
                  <TabsContent value="trajectory">
                    <CodeBlock
                      id="traj-utils"
                      code={`// Trajectory prediction utilities
import {
  generateTrajectoryPrediction,
  calculateTrajectoryDivergence,
  assessTrajectorySustainability
} from '@enpensent/core';

// Generate full prediction
const prediction = generateTrajectoryPrediction(
  currentSignature,
  matches,
  archetypeDefinition,
  currentPosition,
  totalExpectedLength
);

// Check divergence from historical patterns
const divergence = calculateTrajectoryDivergence(signature, matches);

// Assess sustainability
const assessment = assessTrajectorySustainability(signature);
// { sustainable: true, reason: "Stable trend...", riskLevel: "low" }`}
                      language="typescript"
                      onCopy={copyCode}
                      copied={copiedSnippet === 'traj-utils'}
                    />
                  </TabsContent>
                </Tabs>
              </section>

              {/* Custom Domain Example */}
              <section id="custom-domain" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Creating a Custom Domain Adapter</h2>
                <p className="text-muted-foreground mb-4">
                  Example: Creating an adapter for music composition analysis.
                </p>
                <CodeBlock
                  id="custom-adapter"
                  code={`import { DomainAdapter, TemporalSignature } from '@enpensent/core';

interface MusicInput {
  notes: Array<{ pitch: number; duration: number; velocity: number }>;
  tempo: number;
  timeSignature: [number, number];
}

interface MusicState {
  measure: number;
  harmony: string;
  energy: number;
  complexity: number;
}

const musicAdapter: DomainAdapter<MusicInput, MusicState> = {
  domain: 'music',
  
  parseInput(input: MusicInput): MusicState[] {
    // Convert notes to measure-by-measure states
    return analyzeMeasures(input.notes, input.timeSignature);
  },
  
  extractSignature(states: MusicState[]): TemporalSignature {
    // Map musical features to universal signature
    const quadrantProfile = {
      q1: calculateMelodicComplexity(states),
      q2: calculateHarmonicRichness(states),
      q3: calculateRhythmicVariety(states),
      q4: calculateDynamicRange(states)
    };
    
    // ... build full signature
    return signature;
  },
  
  classifyArchetype(signature: TemporalSignature): string {
    // Classify into musical archetypes
    if (signature.intensity > 0.8) return 'Explosive Crescendo';
    if (signature.temporalFlow.trend === 'stable') return 'Meditative Flow';
    // ...
  },
  
  // ... implement remaining methods
};

// Use the adapter
const musicEngine = createPensentEngine(musicAdapter);
const signature = musicEngine.extractSignature(symphonyData);`}
                  language="typescript"
                  onCopy={copyCode}
                  copied={copiedSnippet === 'custom-adapter'}
                />
              </section>

              {/* Footer */}
              <div className="border-t pt-8 mt-12">
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to="/academic-paper">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Read Academic Paper
                    </Button>
                  </Link>
                  <Link to="/code-analysis">
                    <Button className="gap-2">
                      <GitBranch className="h-4 w-4" />
                      Try Live Demo
                    </Button>
                  </Link>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  © 2024 En Pensent Technologies. Patent Pending.
                </p>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="block text-sm py-1 px-2 rounded hover:bg-muted transition-colors">
      {children}
    </a>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs">
      {icon}
      {text}
    </span>
  );
}

function ConceptCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function CodeBlock({ 
  id, 
  code, 
  language, 
  onCopy, 
  copied 
}: { 
  id: string; 
  code: string; 
  language: string; 
  onCopy: (code: string, id: string) => void;
  copied: boolean;
}) {
  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onCopy(code, id)}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
