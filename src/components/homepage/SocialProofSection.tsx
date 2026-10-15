import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, TrendingUp, Users, Eye } from 'lucide-react';

interface Stat {
  icon: typeof TrendingUp;
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { icon: Eye, value: '15M+', label: 'Games Analyzed' },
  { icon: TrendingUp, value: '73%', label: 'Audited Outcome Accuracy' },
  { icon: Users, value: '9', label: 'Domains Explored' },
];

export const SocialProofSection: React.FC = () => {
  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-display text-3xl sm:text-4xl font-bold text-gold-gradient tabular-nums">
                  {value}
                </p>
                <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="divider-gold w-32 mx-auto mb-12" />

          {/* Quote */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Quote className="h-8 w-8 text-primary/30 mx-auto" />
            <blockquote className="font-serif text-lg sm:text-xl text-foreground/90 italic leading-relaxed">
              "Every game leaves a signature in colour and flow.
              We turn that signature into art — and we hold every reading
              of it to an audited standard."
            </blockquote>
            <div className="space-y-1">
              <p className="font-display text-sm uppercase tracking-wider text-foreground">
                Alec Arthur Shelton
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Founder · En Pensent
              </p>
            </div>
          </div>

          {/* CTA links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              to="/whitepaper"
              className="text-sm font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              Read the Whitepaper →
            </Link>
            <span className="hidden sm:inline text-muted-foreground/30">•</span>
            <Link
              to="/benchmark"
              className="text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              See Live Benchmark →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
