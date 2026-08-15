import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Brain, TrendingUp } from 'lucide-react';

const CONCEPT_STEPS = [
  {
    icon: Eye,
    title: 'Every piece leaves a trail of color',
    description: 'As each piece moves, it paints its full journey across the board — creating a unique spatial fingerprint no human eye can trace alone.',
  },
  {
    icon: Brain,
    title: 'Those trails form a strategic fingerprint',
    description: 'The pattern reveals a named archetype — Kingside Attack, Positional Squeeze, Sacrificial Assault — each with a known history and win rate.',
  },
  {
    icon: TrendingUp,
    title: 'That fingerprint predicts the outcome',
    description: 'Before the game ends, the colors tell us who is winning. This is how En Pensent reads the middlegame more accurately than Stockfish 18.',
  },
];

export const ConceptSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs uppercase tracking-widest text-primary/70 font-display font-bold mb-3">
              The Concept
            </p>
            <h2 className="text-2xl md:text-4xl font-royal font-bold uppercase tracking-wide leading-tight">
              The Colors <span className="text-gold-gradient">Are</span> the Intelligence
            </h2>
            <p className="text-muted-foreground font-serif text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
              This isn't art inspired by chess. This isn't chess decorated with art.
              The colors you see are the data — and the data predicts who wins.
            </p>
          </motion.div>
        </div>

        {/* Three-step visual explanation */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 md:gap-8">
          {CONCEPT_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center space-y-4"
              >
                {/* Connector line on desktop */}
                {i < CONCEPT_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                {/* Icon */}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto">
                  <Icon className="h-7 w-7 text-primary" />
                  {/* Step number */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm md:text-base font-display font-bold uppercase tracking-wider text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-serif leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ConceptSection;
