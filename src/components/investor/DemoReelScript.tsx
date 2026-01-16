import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Play, Clock, MessageSquare, Target, Zap, Brain } from 'lucide-react';

export default function DemoReelScript() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="elevator" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="elevator">30s Pitch</TabsTrigger>
          <TabsTrigger value="demo">2m Demo</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
          <TabsTrigger value="oneliners">One-Liners</TabsTrigger>
        </TabsList>

        {/* 30-Second Elevator Pitch */}
        <TabsContent value="elevator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                30-Second Elevator Pitch
                <Badge variant="outline">Memorize This</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg relative">
                <p className="text-lg leading-relaxed">
                  "You know how <span className="text-primary font-medium">Shazam can identify any song</span> from a 
                  few seconds of audio? We're building that for <span className="text-primary font-medium">patterns</span>.
                </p>
                <br />
                <p className="text-lg leading-relaxed">
                  Point En Pensent at a chess game—it instantly identifies the pattern type, predicts who will win, 
                  and explains why. Point it at a GitHub repo—same thing: it recognizes the development pattern and 
                  predicts if the project will succeed.
                </p>
                <br />
                <p className="text-lg leading-relaxed">
                  The breakthrough is our <span className="text-primary font-medium">Temporal Signature™</span> technology—
                  a universal way to fingerprint any sequential process. It's <span className="text-primary font-medium">
                  patent-pending</span>, and every analysis makes our prediction engine smarter.
                </p>
                <br />
                <p className="text-lg leading-relaxed">
                  We're starting with chess and code. Next: medical diagnosis patterns, financial trading, 
                  sports analytics. It's a <span className="text-primary font-medium">$47 billion market</span>."
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyText(
                    `You know how Shazam can identify any song from a few seconds of audio? We're building that for patterns.

Point En Pensent at a chess game—it instantly identifies the pattern type, predicts who will win, and explains why. Point it at a GitHub repo—same thing: it recognizes the development pattern and predicts if the project will succeed.

The breakthrough is our Temporal Signature™ technology—a universal way to fingerprint any sequential process. It's patent-pending, and every analysis makes our prediction engine smarter.

We're starting with chess and code. Next: medical diagnosis patterns, financial trading, sports analytics. It's a $47 billion market.`,
                    'elevator'
                  )}
                >
                  {copiedSection === 'elevator' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Approximately 30-35 seconds when spoken naturally</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2-Minute Demo Script */}
        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                2-Minute Demo Script
                <Badge variant="outline">Video / Live Demo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {demoSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    {index < demoSteps.length - 1 && (
                      <div className="w-0.5 h-full bg-primary/20 my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      <Badge variant="secondary">{step.time}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{step.action}</p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm italic">
                      "{step.script}"
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => copyText(
                  demoSteps.map((s, i) => `${i + 1}. ${s.title} (${s.time})\nAction: ${s.action}\nScript: "${s.script}"`).join('\n\n'),
                  'demo'
                )}
              >
                {copiedSection === 'demo' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Full Script
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Common Objections */}
        <TabsContent value="objections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Handling Common Objections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {objections.map((obj, index) => (
                <motion.div
                  key={obj.objection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Badge variant="destructive" className="shrink-0">Objection</Badge>
                    <p className="font-medium">{obj.objection}</p>
                  </div>
                  <div className="flex items-start gap-3 ml-4">
                    <Badge variant="default" className="shrink-0">Response</Badge>
                    <p className="text-sm text-muted-foreground">{obj.response}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* One-Liners */}
        <TabsContent value="oneliners">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Memorable One-Liners
                <Badge variant="outline">Pick Your Favorite</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {oneLiners.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-mono text-sm">{index + 1}.</span>
                      <p className="font-medium">"{line}"</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyText(line, `oneliner-${index}`)}
                    >
                      {copiedSection === `oneliner-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reference Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Key Stats to Remember
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">$47B+</p>
              <p className="text-xs text-muted-foreground">Total Market (TAM)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">2</p>
              <p className="text-xs text-muted-foreground">Domains Live</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">Patent</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">∞</p>
              <p className="text-xs text-muted-foreground">Domains Possible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const demoSteps = [
  {
    title: "Hook",
    time: "0:00-0:15",
    action: "Show the En Pensent logo and a split screen of chess + code",
    script: "What if you could see the future of any process? Not guess—actually predict with data. That's what En Pensent does."
  },
  {
    title: "Chess Demo",
    time: "0:15-0:45",
    action: "Paste a famous chess game PGN, show the visual fingerprint generating",
    script: "Here's a chess game. Watch—in seconds, our engine extracts its 'Temporal Signature'—a unique fingerprint of how the game flows. It identifies this as an 'Aggressive Mastermind' pattern and predicts White wins with 87% confidence."
  },
  {
    title: "Code Demo",
    time: "0:45-1:15",
    action: "Paste a GitHub URL, show the analysis running",
    script: "Now here's the magic—same engine, completely different domain. This GitHub repo... same process, different adapter. It identifies a 'Steady Growth' archetype and predicts a 78% chance of continued success."
  },
  {
    title: "The Insight",
    time: "1:15-1:35",
    action: "Show side-by-side comparison of chess + code signatures",
    script: "Notice something? The underlying pattern structure is the same. We've discovered that all sequential processes share universal characteristics. That's the breakthrough."
  },
  {
    title: "The Vision",
    time: "1:35-2:00",
    action: "Show roadmap slide with future domains",
    script: "Chess and code are proof of concept. The same technology applies to medical diagnosis sequences, financial trading patterns, sports analytics, supply chain optimization. It's a $47 billion opportunity, and we're first to market with a patent-pending solution."
  }
];

const objections = [
  {
    objection: "Isn't this just machine learning?",
    response: "No—ML requires massive training data and is domain-specific. Our approach extracts universal temporal signatures that work across ANY domain without training. We use mathematical pattern extraction, not statistical learning. One algorithm, infinite applications."
  },
  {
    objection: "How do you know the predictions are accurate?",
    response: "We track every prediction against actual outcomes. Our chess predictions are verifiable against game results. For code, we track project health over time. We publish our accuracy metrics transparently—currently averaging 75%+ across domains."
  },
  {
    objection: "What stops a big player from copying this?",
    response: "Three things: Our patent-pending methodology, our growing pattern library (data moat), and our cross-domain validation. A competitor would need to invent a different approach, build their data from scratch, and can't prove universality without multiple domains working."
  },
  {
    objection: "Chess is a small market. Why start there?",
    response: "Chess is the perfect proof-of-concept: deterministic, rich data, measurable outcomes. But we're not a chess company—we're a pattern recognition company. Chess proves the tech works. Code proves it transfers. That's worth $47B+."
  },
  {
    objection: "How do you make money?",
    response: "Three revenue streams: SaaS subscriptions for developers and analysts, marketplace fees on pattern art trading, and enterprise licensing for domain-specific applications. We're already generating revenue from premium subscriptions."
  }
];

const oneLiners = [
  "Shazam for patterns—point it at anything sequential, get instant recognition and prediction.",
  "We fingerprint processes the way DNA fingerprints people.",
  "One algorithm to rule them all—universal pattern recognition.",
  "Every analysis makes us smarter. Every competitor starts from zero.",
  "We don't predict the future—we recognize the pattern that creates it.",
  "Chess proved the tech. Code proved it transfers. Everything else is just adapters.",
  "The Google of pattern recognition—index everything sequential.",
  "We turn any process into a predictable, analyzable signature.",
];
