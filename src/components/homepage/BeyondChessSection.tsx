import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Crown, TrendingUp, Zap, ArrowRight } from 'lucide-react';

const DOMAINS = [
  {
    icon: Crown,
    label: 'Chess',
    stat: '12.24M+ games analyzed',
    active: true,
  },
  {
    icon: TrendingUp,
    label: 'Markets',
    stat: '50.4% directional accuracy',
    active: false,
  },
  {
    icon: Zap,
    label: 'Energy & Chemistry',
    stat: '72.1% battery prediction',
    active: false,
  },
];

export const BeyondChessSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs uppercase tracking-widest text-primary/70 font-display font-bold mb-3">
              Universal Pattern Intelligence
            </p>
            <h2 className="text-2xl md:text-4xl font-royal font-bold uppercase tracking-wide leading-tight">
              Beyond <span className="text-gold-gradient">the Board</span>
            </h2>
            <p className="text-muted-foreground font-serif text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
              The same color-flow signatures that read chess positions apply to any system
              with spatial dynamics. Markets, batteries, chemical processes — all domains are wavelengths.
            </p>
          </motion.div>
        </div>

        {/* Domain cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {DOMAINS.map((domain, i) => {
            const Icon = domain.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`rounded-xl border p-5 text-center space-y-3 transition-colors ${
                  domain.active
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/40 bg-card/30'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${
                  domain.active ? 'bg-primary/15' : 'bg-muted/40'
                }`}>
                  <Icon className={`h-6 w-6 ${domain.active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
                    {domain.label}
                  </h3>
                  <p className="text-xs text-muted-foreground font-serif mt-1">
                    {domain.stat}
                  </p>
                </div>
                {domain.active ? (
                  <span className="inline-block text-[10px] uppercase tracking-widest text-primary font-bold">
                    Live
                  </span>
                ) : (
                  <span className="inline-block text-[10px] uppercase tracking-widest text-muted-foreground/50">
                    Validated
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Link to whitepaper */}
        <div className="text-center mt-8">
          <Link
            to="/whitepaper"
            className="inline-flex items-center gap-1.5 text-sm font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors group"
          >
            Read the whitepaper
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BeyondChessSection;
