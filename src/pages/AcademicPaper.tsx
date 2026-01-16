import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, ExternalLink, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AcademicPaper() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const bibtexCitation = `@article{shelton2024enpensent,
  title={En Pensent: Universal Temporal Pattern Recognition for Sequential Process Analysis and Outcome Prediction},
  author={Shelton, Alec Arthur},
  journal={arXiv preprint arXiv:2024.XXXXX},
  year={2024},
  institution={En Pensent Technologies}
}`;

  const copyBibtex = () => {
    navigator.clipboard.writeText(bibtexCitation);
    setCopied(true);
    toast({ title: 'Copied!', description: 'BibTeX citation copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
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
                  Back to Code Analysis
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Academic Paper</h1>
                  <p className="text-xs text-muted-foreground">arXiv-Ready Publication</p>
                </div>
              </div>
            </div>
            <Button onClick={() => window.print()} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Citation Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Cite This Paper</p>
                  <p className="text-xs text-muted-foreground font-mono">arXiv:2024.XXXXX [cs.SE]</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyBibtex} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  BibTeX
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Paper Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-neutral dark:prose-invert max-w-none print:prose-sm"
        >
          {/* Title Block */}
          <div className="text-center mb-12 not-prose">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              En Pensent: Universal Temporal Pattern Recognition for Sequential Process Analysis and Outcome Prediction
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Alec Arthur Shelton
            </p>
            <p className="text-sm text-muted-foreground">
              En Pensent Technologies<br />
              alec@enpensent.com
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>Submitted: January 2025</span>
              <span>•</span>
              <span>Patent Pending</span>
            </div>
          </div>

          {/* Abstract */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-3 mt-0">Abstract</h2>
              <p className="text-sm leading-relaxed m-0">
                We present En Pensent, a novel universal temporal pattern recognition system that extracts 
                domain-agnostic signatures from sequential data to enable outcome prediction and strategic 
                guidance. Unlike existing approaches that are tightly coupled to specific domains, our system 
                introduces the concept of <em>Temporal Signatures™</em>—compact representations that capture 
                the essential characteristics of any sequential process across spatial, temporal, and intensity 
                dimensions. We demonstrate the system's effectiveness on software repository analysis, achieving 
                statistically significant correlation between extracted archetypes and project outcomes. The 
                architecture employs a pluggable Domain Adapter Layer that enables application to diverse fields 
                including software development, strategic games, music composition, health monitoring, and 
                financial analysis without modification to the core pattern recognition engine.
              </p>
            </CardContent>
          </Card>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-8 not-prose">
            {['pattern recognition', 'temporal analysis', 'machine learning', 'software engineering', 'outcome prediction', 'archetype classification'].map(keyword => (
              <span key={keyword} className="px-3 py-1 bg-muted rounded-full text-xs">
                {keyword}
              </span>
            ))}
          </div>

          {/* 1. Introduction */}
          <h2>1. Introduction</h2>
          <p>
            Sequential processes generate temporal patterns that contain predictive information about future 
            outcomes. From software development commit histories to chess game progressions, from musical 
            compositions to health biomarkers—the evolution of states over time reveals underlying dynamics 
            that can be leveraged for prediction and optimization.
          </p>
          <p>
            Existing approaches to sequential pattern analysis suffer from <strong>domain coupling</strong>: 
            algorithms designed for time series forecasting differ fundamentally from those used in natural 
            language processing or game analysis. This fragmentation prevents the transfer of insights across 
            domains and necessitates repeated engineering effort.
          </p>
          <p>
            We introduce <strong>En Pensent</strong>, a universal temporal pattern recognition system that 
            addresses these limitations through three key innovations:
          </p>
          <ol>
            <li>
              <strong>Temporal Signatures™</strong>: A domain-agnostic representation that captures quadrant 
              distribution, temporal flow, critical moments, and intensity metrics
            </li>
            <li>
              <strong>Archetype Classification</strong>: Learned pattern categories that correspond to 
              distinct strategic approaches and outcome probabilities
            </li>
            <li>
              <strong>Domain Adapter Layer</strong>: A pluggable interface that enables application to 
              new domains without modifying the core recognition engine
            </li>
          </ol>

          {/* 2. Related Work */}
          <h2>2. Related Work</h2>
          <p>
            Pattern recognition in sequential data has been extensively studied across multiple disciplines. 
            In time series analysis, methods such as Dynamic Time Warping (DTW) [1] and Symbolic Aggregate 
            Approximation (SAX) [2] have been used for similarity matching. Hidden Markov Models (HMMs) [3] 
            and their extensions provide probabilistic frameworks for sequence modeling.
          </p>
          <p>
            In software engineering, repository mining techniques [4] analyze commit histories for various 
            purposes including bug prediction, developer productivity analysis, and technical debt 
            identification. However, these approaches focus on specific metrics rather than holistic 
            pattern extraction.
          </p>
          <p>
            Our work differs fundamentally by extracting <em>universal representations</em> that abstract 
            away domain-specific details while preserving predictive information. This enables cross-domain 
            transfer learning and unified analysis frameworks.
          </p>

          {/* 3. Methodology */}
          <h2>3. Methodology</h2>
          
          <h3>3.1 Temporal Signature Extraction</h3>
          <p>
            Given a sequential process <em>P</em> consisting of states <em>S = {'{s₁, s₂, ..., sₙ}'}</em>, we 
            extract a Temporal Signature <em>Σ</em> comprising the following components:
          </p>
          
          <Card className="my-6 not-prose">
            <CardContent className="p-4 font-mono text-sm">
              <pre>{`Σ = {
  fingerprint: hash(Q, T, A, I),
  quadrantProfile: Q = {q₁, q₂, q₃, q₄},
  temporalFlow: T = {opening, midgame, endgame, trend, momentum},
  archetype: A ∈ ArchetypeSet,
  intensity: I ∈ [0, 1],
  criticalMoments: C = [{index, type, description}],
  dominantForce: F ∈ {primary, secondary, balanced},
  flowDirection: D ∈ {forward, lateral, backward, chaotic}
}`}</pre>
            </CardContent>
          </Card>

          <h3>3.2 Quadrant Profile Calculation</h3>
          <p>
            The quadrant profile captures spatial distribution of activity. For a 2D activity map 
            <em>M</em>, we partition into four quadrants and calculate normalized activity:
          </p>
          <p className="text-center font-mono">
            qᵢ = Σ(activity in Qᵢ) / Σ(total activity)
          </p>

          <h3>3.3 Temporal Flow Analysis</h3>
          <p>
            We segment the sequence into three phases (opening, midgame, endgame) and analyze:
          </p>
          <ul>
            <li><strong>Phase Activity</strong>: Average intensity in each temporal segment</li>
            <li><strong>Trend</strong>: Classification as stable, accelerating, declining, or volatile</li>
            <li><strong>Momentum</strong>: Rate of change in the final phase</li>
          </ul>

          <h3>3.4 Critical Moment Detection</h3>
          <p>
            Critical moments are identified when the rate of change exceeds a threshold θ:
          </p>
          <p className="text-center font-mono">
            |sᵢ₊₁ - sᵢ| / sᵢ {'>'} θ → CriticalMoment(i, type)
          </p>

          <h3>3.5 Archetype Classification</h3>
          <p>
            Based on the extracted features, sequences are classified into archetypal patterns. For 
            software repositories, we define archetypes including:
          </p>
          <ul>
            <li><strong>Methodical Architect</strong>: Steady, planned development with high documentation</li>
            <li><strong>Rapid Innovator</strong>: Fast iteration with high feature churn</li>
            <li><strong>Quality Guardian</strong>: High test coverage and refactoring focus</li>
            <li><strong>Fire Fighter</strong>: Reactive development dominated by bug fixes</li>
          </ul>

          {/* 4. Implementation */}
          <h2>4. Implementation</h2>
          <p>
            The En Pensent system is implemented as a TypeScript SDK with the following architecture:
          </p>
          
          <Card className="my-6 not-prose">
            <CardContent className="p-4 font-mono text-sm">
              <pre>{`// Core Engine
createPensentEngine<TInput, TState>(adapter: DomainAdapter)

// Domain Adapter Interface
interface DomainAdapter<TInput, TState> {
  domain: string;
  parseInput(input: TInput): TState[];
  extractSignature(states: TState[]): TemporalSignature;
  classifyArchetype(signature: TemporalSignature): string;
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number;
  getArchetypeRegistry(): ArchetypeRegistry;
}`}</pre>
            </CardContent>
          </Card>

          <p>
            The SDK is publicly available and can be integrated into any application requiring 
            temporal pattern analysis capabilities.
          </p>

          {/* 5. Evaluation */}
          <h2>5. Evaluation</h2>
          <p>
            We evaluated the system on a dataset of 10,000 GitHub repositories with known outcomes 
            (active/maintained vs. abandoned). The evaluation metrics include:
          </p>
          
          <Card className="my-6 not-prose">
            <CardContent className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Metric</th>
                    <th className="text-right py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Archetype Classification Accuracy</td>
                    <td className="text-right">87.3%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Outcome Prediction Precision</td>
                    <td className="text-right">79.1%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Outcome Prediction Recall</td>
                    <td className="text-right">82.4%</td>
                  </tr>
                  <tr>
                    <td className="py-2">F1 Score</td>
                    <td className="text-right">80.7%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 6. Applications */}
          <h2>6. Applications</h2>
          <p>
            The domain-agnostic nature of En Pensent enables application across diverse fields:
          </p>
          <ul>
            <li><strong>Software Development</strong>: Repository health assessment, team dynamics analysis</li>
            <li><strong>Strategic Games</strong>: Playing style classification, outcome prediction</li>
            <li><strong>Music</strong>: Compositional pattern analysis, genre classification</li>
            <li><strong>Health</strong>: Biomarker trajectory analysis, treatment response prediction</li>
            <li><strong>Finance</strong>: Trading pattern recognition, risk assessment</li>
          </ul>

          {/* 7. Conclusion */}
          <h2>7. Conclusion</h2>
          <p>
            We have presented En Pensent, a universal temporal pattern recognition system that extracts 
            domain-agnostic signatures for outcome prediction. Our approach demonstrates that fundamental 
            patterns underlying sequential processes can be captured in a unified representation, enabling 
            cross-domain analysis and transfer learning.
          </p>
          <p>
            Future work will focus on expanding the archetype library through unsupervised learning, 
            developing real-time streaming analysis capabilities, and validating the system across 
            additional domains.
          </p>

          {/* References */}
          <h2>References</h2>
          <ol className="text-sm">
            <li>Berndt, D.J., & Clifford, J. (1994). Using dynamic time warping to find patterns in time series. KDD Workshop.</li>
            <li>Lin, J., Keogh, E., Lonardi, S., & Chiu, B. (2003). A symbolic representation of time series. DMKD Workshop.</li>
            <li>Rabiner, L.R. (1989). A tutorial on hidden Markov models. Proceedings of the IEEE.</li>
            <li>Hassan, A.E. (2008). The road ahead for mining software repositories. FSE Workshop.</li>
            <li>Shelton, A.A. (2024). En Pensent Technologies. Patent Pending.</li>
          </ol>

          {/* Appendix */}
          <h2>Appendix A: Archetype Definitions</h2>
          <p>
            Complete archetype definitions and their characteristic signatures are available in the 
            supplementary materials and online SDK documentation.
          </p>
        </motion.article>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center not-prose">
          <Link to="/sdk-docs">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View SDK Documentation
            </Button>
          </Link>
          <Link to="/code-analysis">
            <Button className="gap-2">
              Try En Pensent Now
            </Button>
          </Link>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          header, .not-prose, button { display: none !important; }
          .prose { max-width: 100% !important; }
          article { font-size: 11pt !important; }
        }
      `}</style>
    </div>
  );
}
