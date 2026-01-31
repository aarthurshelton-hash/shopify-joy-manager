/**
 * Visual Abstraction Showcase
 * 
 * Demonstrates the "Abstraction Power" strength identified by AI reviewer:
 * Complex data → Visual signatures → Pattern recognition
 * 
 * Makes the invisible visible for non-experts.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Layers, ArrowRight, Eye, Fingerprint, Zap, 
  FileCode, Crown, TrendingUp, Sparkles
} from 'lucide-react';

interface SignatureExample {
  domain: string;
  icon: React.ReactNode;
  inputDescription: string;
  inputExample: string;
  outputDescription: string;
  quadrantPreview: { aggressive: number; defensive: number; tactical: number; strategic: number };
  archetype: string;
  insight: string;
}

const SIGNATURE_EXAMPLES: SignatureExample[] = [
  {
    domain: 'Chess',
    icon: <Crown className="w-5 h-5 text-yellow-500" />,
    inputDescription: '40 moves of a GM game',
    inputExample: '1.e4 e5 2.Nf3 Nc6 3.Bb5...',
    outputDescription: 'Color Flow Signature',
    quadrantPreview: { aggressive: 0.72, defensive: 0.28, tactical: 0.65, strategic: 0.58 },
    archetype: 'Aggressive Attacker',
    insight: 'Kingside pressure imminent in 5-8 moves',
  },
  {
    domain: 'Code',
    icon: <FileCode className="w-5 h-5 text-blue-500" />,
    inputDescription: '500 Git commits over 6 months',
    inputExample: 'feat: add auth, fix: memory leak, refactor...',
    outputDescription: 'Code Flow Signature',
    quadrantPreview: { aggressive: 0.45, defensive: 0.55, tactical: 0.38, strategic: 0.82 },
    archetype: 'Pattern Master',
    insight: 'Ready for module extraction this sprint',
  },
  {
    domain: 'Market',
    icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    inputDescription: '30 days of price + volume data',
    inputExample: '$150.23, $151.89, $149.55...',
    outputDescription: 'Market Flow Signature',
    quadrantPreview: { aggressive: 0.62, defensive: 0.38, tactical: 0.71, strategic: 0.44 },
    archetype: 'Bullish Momentum',
    insight: 'Enter on pullback to 20-day MA',
  },
];

function QuadrantVisualization({ profile }: { profile: { aggressive: number; defensive: number; tactical: number; strategic: number } }) {
  return (
    <div className="grid grid-cols-2 gap-1 w-24 h-24">
      <motion.div 
        className="rounded-tl-lg flex items-center justify-center text-xs font-mono"
        style={{ backgroundColor: `hsla(var(--destructive), ${profile.aggressive})` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {(profile.aggressive * 100).toFixed(0)}
      </motion.div>
      <motion.div 
        className="rounded-tr-lg flex items-center justify-center text-xs font-mono"
        style={{ backgroundColor: `hsla(var(--chart-2), ${profile.defensive})` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {(profile.defensive * 100).toFixed(0)}
      </motion.div>
      <motion.div 
        className="rounded-bl-lg flex items-center justify-center text-xs font-mono"
        style={{ backgroundColor: `hsla(var(--chart-4), ${profile.tactical})` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        {(profile.tactical * 100).toFixed(0)}
      </motion.div>
      <motion.div 
        className="rounded-br-lg flex items-center justify-center text-xs font-mono"
        style={{ backgroundColor: `hsla(var(--primary), ${profile.strategic})` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {(profile.strategic * 100).toFixed(0)}
      </motion.div>
    </div>
  );
}

export function VisualAbstractionShowcase() {
  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-primary" />
          Visual Abstraction Power
        </CardTitle>
        <CardDescription>
          Complex temporal data → Visual fingerprints → Actionable insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* The Process */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="p-2 bg-muted rounded-lg mb-2">
              <Layers className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Raw Data</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary" />
          <div className="text-center">
            <div className="p-2 bg-primary/20 rounded-lg mb-2">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Signature</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary" />
          <div className="text-center">
            <div className="p-2 bg-green-500/20 rounded-lg mb-2">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">Action</p>
          </div>
        </div>

        {/* Domain Examples */}
        <div className="space-y-4">
          {SIGNATURE_EXAMPLES.map((example, index) => (
            <motion.div
              key={example.domain}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="p-4 rounded-lg border border-border/50 bg-gradient-to-r from-muted/20 to-transparent"
            >
              <div className="flex items-start gap-4">
                {/* Input */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {example.icon}
                    <span className="font-medium">{example.domain}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">{example.inputDescription}</p>
                    <code className="px-2 py-1 bg-muted rounded text-[10px] font-mono">
                      {example.inputExample}
                    </code>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center py-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>

                {/* Visual Signature */}
                <div className="flex-shrink-0">
                  <QuadrantVisualization profile={example.quadrantPreview} />
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center py-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>

                {/* Output */}
                <div className="flex-1 space-y-2">
                  <Badge variant="outline" className="border-primary/50 bg-primary/10">
                    {example.archetype}
                  </Badge>
                  <p className="text-sm font-medium text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {example.insight}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Insight */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Why This Matters
          </h4>
          <p className="text-sm text-muted-foreground">
            Traditional analysis requires domain expertise. A chess grandmaster can't read Git commits. 
            A trader can't interpret game moves. But <span className="text-primary font-medium">visual signatures are universal</span>.
            The same quadrant-based pattern appears in winning chess games, healthy codebases, and 
            trending markets. <span className="text-primary font-medium">One pattern language for all domains.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
