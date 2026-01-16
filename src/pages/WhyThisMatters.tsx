import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Dna, Fingerprint, TrendingUp, Brain, Zap, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WhyThisMatters = () => {
  const navigate = useNavigate();

  const analogies = [
    {
      icon: Dna,
      title: "DNA for Digital Systems",
      simple: "Just like DNA reveals your health risks before symptoms appear...",
      technical: "En Pensent extracts temporal signatures from any sequential system to predict outcomes before they manifest.",
      example: "A codebase's 'DNA' might reveal it's heading toward technical debt collapse 6 months before the first bug reports."
    },
    {
      icon: Fingerprint,
      title: "Fingerprinting Patterns",
      simple: "Like how every fingerprint is unique but we can still match them...",
      technical: "Every chess game, codebase, or system has a unique signature, but similar signatures lead to similar outcomes.",
      example: "Two different chess games can have 95% similar signatures - if one ended in checkmate, the other likely will too."
    },
    {
      icon: TrendingUp,
      title: "Weather Forecasting for Everything",
      simple: "Meteorologists predict storms by recognizing atmospheric patterns...",
      technical: "En Pensent recognizes 'atmospheric patterns' in any temporal system to forecast its trajectory.",
      example: "A repository showing 'tech debt spiral' patterns has an 85% chance of major issues within 3 months."
    }
  ];

  const whyRevolutionary = [
    {
      icon: Brain,
      title: "Universal Pattern Recognition",
      description: "One algorithm works across chess, code, music, health data, financial markets - any system that changes over time."
    },
    {
      icon: Zap,
      title: "No Training Required",
      description: "Unlike AI that needs millions of examples, En Pensent extracts meaningful patterns from a single instance."
    },
    {
      icon: Target,
      title: "Actionable Predictions",
      description: "Not just 'something might happen' but 'at move 45, you'll face a critical decision about the kingside.'"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" onClick={() => navigate("/code-analysis")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analysis
          </Button>
        </div>
      </header>

      <main className="container py-16 space-y-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Why En Pensent Matters
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Explained simply, for everyone
          </p>
          <div className="inline-block bg-primary/10 rounded-full px-4 py-2 text-sm">
            No PhD required to understand this
          </div>
        </motion.section>

        {/* The Big Idea */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">The Big Idea (30 seconds)</h2>
              <div className="space-y-4 text-lg">
                <p>
                  <strong>Everything that changes over time leaves a signature.</strong>
                </p>
                <p className="text-muted-foreground">
                  A chess game. A software project. A patient's health records. A company's stock movements.
                </p>
                <p>
                  <strong>En Pensent reads these signatures and predicts what happens next.</strong>
                </p>
                <p className="text-muted-foreground">
                  Not by magic. By recognizing that similar signatures lead to similar outcomes.
                </p>
                <div className="bg-background rounded-lg p-4 mt-6">
                  <p className="font-mono text-sm">
                    signature("your chess game") ≈ signature("Kasparov vs. Karpov 1985")
                    <br />
                    → Therefore: your game will likely end similarly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Analogies */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Three Analogies That Make It Click
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {analogies.map((analogy, index) => (
              <motion.div
                key={analogy.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <analogy.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{analogy.title}</h3>
                    <p className="text-primary font-medium">{analogy.simple}</p>
                    <p className="text-muted-foreground text-sm">{analogy.technical}</p>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <strong>Example:</strong> {analogy.example}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Revolutionary */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why This Is Revolutionary
          </h2>
          <div className="space-y-6">
            {whyRevolutionary.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* The Vision */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">The Vision</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Imagine a world where doctors can predict health crises before they happen.
                Where investors can see market patterns invisible to others.
                Where software teams know about bugs before they're written.
              </p>
              <p className="text-xl font-bold">
                En Pensent is the foundation for that world.
              </p>
              <div className="mt-6 text-sm text-muted-foreground">
                Invented by <strong>Alec Arthur Shelton "The Artist"</strong>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* CTA */}
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/code-analysis")}>
            Try It Yourself
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/academic-paper")}>
            Read the Technical Paper
          </Button>
        </div>
      </main>
    </div>
  );
};

export default WhyThisMatters;
